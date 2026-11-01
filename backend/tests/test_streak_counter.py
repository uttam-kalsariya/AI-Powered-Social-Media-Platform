import os
import sys
import pytest
from datetime import datetime, timezone, timedelta

# Ensure server root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.db import get_db
from app.services.streak_service import (
    get_or_create_streak,
    record_activity,
    get_leaderboard
)
from app.models.streak_model import calculate_level_info

@pytest.fixture
def app_instance():
    os.environ['TESTING'] = 'True'
    app = create_app()
    app.config['TESTING'] = True
    yield app

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

@pytest.fixture
def auth_headers(client):
    # Register/login demo user
    db = get_db()
    user = db.users.find_one({"username": "alex_innovator"})
    user_id = str(user['_id'])
    
    # Generate token
    from flask_jwt_extended import create_access_token
    with client.application.app_context():
        token = create_access_token(identity=user_id, additional_claims={"username": "alex_innovator", "role": "user"})
    return {"Authorization": f"Bearer {token}"}, user_id

def test_calculate_level_info():
    lvl1 = calculate_level_info(50)
    assert lvl1['level'] == 1
    assert lvl1['title'] == "Novice Explorer"
    assert lvl1['progress_percentage'] == 50

    lvl2 = calculate_level_info(150)
    assert lvl2['level'] == 2
    assert lvl2['title'] == "Active Spark"

    lvl5 = calculate_level_info(2000)
    assert lvl5['level'] == 5
    assert lvl5['title'] == "Aura Legend"
    assert lvl5['progress_percentage'] == 100

def test_streak_initialization_and_first_activity(app_instance):
    with app_instance.app_context():
        db = get_db()
        test_user_id = "507f1f77bcf86cd799439011"
        db.streaks.delete_one({"user_id": test_user_id})

        # Record first activity (login)
        res = record_activity(test_user_id, 'login')
        assert res['current_streak'] == 1
        assert res['streak_increased'] is True
        assert res['xp_gained'] >= 10
        assert res['today_activities']['login'] is True

        # Check badge unlocked: First Flame
        badge_ids = [b['id'] for b in res['new_badges']]
        assert 'first_flame' in badge_ids

def test_streak_consecutive_day_continuation(app_instance):
    with app_instance.app_context():
        db = get_db()
        test_user_id = "507f1f77bcf86cd799439022"
        db.streaks.delete_one({"user_id": test_user_id})

        now = datetime.now(timezone.utc)
        yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')

        # Simulate streak already active yesterday
        db.streaks.insert_one({
            "user_id": test_user_id,
            "username": "streak_tester",
            "current_streak": 2,
            "longest_streak": 2,
            "total_active_days": 2,
            "last_activity_date": yesterday_str,
            "xp": 40,
            "level": 1,
            "level_title": "Novice Explorer",
            "today_activities": {"login": False, "post_created": False, "comment_created": False, "checkin_claimed": False},
            "stats": {"posts_count": 0, "comments_count": 0, "logins_count": 2},
            "unlocked_badges": [],
            "active_dates": [yesterday_str],
            "weekly_progress": {},
            "created_at": now - timedelta(days=2),
            "updated_at": now - timedelta(days=1)
        })

        # User performs check-in today
        res = record_activity(test_user_id, 'checkin')
        assert res['current_streak'] == 3
        assert res['streak_increased'] is True

        # Check if 3-day badge 'on_fire' unlocked!
        badge_ids = [b['id'] for b in res['new_badges']]
        assert 'on_fire' in badge_ids

def test_streak_reset_on_missed_days(app_instance):
    with app_instance.app_context():
        db = get_db()
        test_user_id = "507f1f77bcf86cd799439033"
        db.streaks.delete_one({"user_id": test_user_id})

        now = datetime.now(timezone.utc)
        three_days_ago_str = (now - timedelta(days=3)).strftime('%Y-%m-%d')

        db.streaks.insert_one({
            "user_id": test_user_id,
            "username": "lapsed_tester",
            "current_streak": 5,
            "longest_streak": 10,
            "total_active_days": 10,
            "last_activity_date": three_days_ago_str,
            "xp": 150,
            "level": 2,
            "level_title": "Active Spark",
            "today_activities": {"login": False, "post_created": False, "comment_created": False, "checkin_claimed": False},
            "stats": {"posts_count": 0, "comments_count": 0, "logins_count": 5},
            "unlocked_badges": [],
            "active_dates": [three_days_ago_str],
            "weekly_progress": {},
            "created_at": now - timedelta(days=10),
            "updated_at": now - timedelta(days=3)
        })

        # When fetched, lapsed streak resets to 0
        streak = get_or_create_streak(test_user_id)
        assert streak['current_streak'] == 0
        assert streak['longest_streak'] == 10  # Longest record preserved

        # New activity restarts streak at 1
        res = record_activity(test_user_id, 'login')
        assert res['current_streak'] == 1
        assert res['streak_reset'] is True

def test_api_endpoints_streak_me_and_checkin(client, auth_headers):
    headers, user_id = auth_headers

    # 1. GET /api/streaks/me
    res = client.get('/api/streaks/me', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'streak' in data
    assert 'badges_catalog' in data
    assert data['streak']['user_id'] == user_id

    # 2. POST /api/streaks/checkin
    res2 = client.post('/api/streaks/checkin', headers=headers)
    assert res2.status_code == 200
    checkin_data = res2.get_json()
    assert checkin_data['current_streak'] >= 1
    assert checkin_data['xp_gained'] >= 15

    # 3. Duplicate checkin today should be gracefully noted
    res3 = client.post('/api/streaks/checkin', headers=headers)
    assert res3.status_code == 200
    dup_data = res3.get_json()
    assert dup_data['already_claimed'] is True

def test_api_leaderboard_and_user_streak(client):
    # GET /api/streaks/leaderboard
    res = client.get('/api/streaks/leaderboard')
    assert res.status_code == 200
    data = res.get_json()
    assert 'leaderboard' in data
    assert isinstance(data['leaderboard'], list)

    # GET /api/streaks/user/alex_innovator
    res2 = client.get('/api/streaks/user/alex_innovator')
    assert res2.status_code == 200
    user_data = res2.get_json()
    assert user_data['streak']['username'] == 'alex_innovator'
