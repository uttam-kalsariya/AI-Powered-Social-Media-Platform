import os
import sys
import pytest
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.db import get_db
from flask_jwt_extended import create_access_token

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
def auth_users(client):
    db = get_db()
    # User 1: Alex
    user1 = db.users.find_one({"username": "alex_innovator"})
    uid1 = str(user1['_id'])
    
    # User 2: Admin
    user2 = db.users.find_one({"username": "admin"})
    uid2 = str(user2['_id'])

    with client.application.app_context():
        token1 = create_access_token(identity=uid1, additional_claims={"username": "alex_innovator", "role": "user"})
        token2 = create_access_token(identity=uid2, additional_claims={"username": "admin", "role": "admin"})

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    return (headers1, uid1), (headers2, uid2)

def test_follow_and_unfollow_user(client, auth_users):
    (headers1, uid1), (headers2, uid2) = auth_users

    # 1. User 1 follows User 2
    res = client.post(f'/api/users/{uid2}/follow', headers=headers1)
    assert res.status_code == 200
    data = res.get_json()
    assert data['following'] is True

    # 2. Verify followers list of User 2
    res_followers = client.get(f'/api/users/{uid2}/followers')
    assert res_followers.status_code == 200
    followers_data = res_followers.get_json()
    assert any(f['id'] == uid1 for f in followers_data['followers'])

    # 3. User 1 unfollows User 2
    res_unfollow = client.post(f'/api/users/{uid2}/follow', headers=headers1)
    assert res_unfollow.status_code == 200
    unfollow_data = res_unfollow.get_json()
    assert unfollow_data['following'] is False

def test_cannot_follow_self(client, auth_users):
    (headers1, uid1), _ = auth_users
    res = client.post(f'/api/users/{uid1}/follow', headers=headers1)
    assert res.status_code == 400
    assert 'cannot follow themselves' in res.get_json()['error']

def test_save_and_unsave_post(client, auth_users):
    (headers1, uid1), _ = auth_users
    db = get_db()
    post = db.posts.find_one({})
    pid = str(post['_id'])

    # 1. Save post
    res = client.post(f'/api/posts/{pid}/save', headers=headers1, json={"collection_name": "AI Inspiration"})
    assert res.status_code == 200
    save_data = res.get_json()
    assert save_data['saved'] is True
    assert save_data['collection_name'] == "AI Inspiration"

    # 2. Get saved posts
    res_saved = client.get('/api/posts/saved', headers=headers1)
    assert res_saved.status_code == 200
    saved_posts = res_saved.get_json()['posts']
    assert any(p['id'] == pid or p['_id'] == pid for p in saved_posts)

    # 3. Get collections
    res_colls = client.get('/api/posts/saved/collections', headers=headers1)
    assert res_colls.status_code == 200
    colls = res_colls.get_json()['collections']
    assert any(c['name'] == "AI Inspiration" for c in colls)

    # 4. Unsave post
    res_unsave = client.post(f'/api/posts/{pid}/save', headers=headers1)
    assert res_unsave.status_code == 200
    assert res_unsave.get_json()['saved'] is False

def test_trending_hashtags(client):
    res = client.get('/api/posts/trending/hashtags')
    assert res.status_code == 200
    data = res.get_json()
    assert 'hashtags' in data
    assert isinstance(data['hashtags'], list)
    assert len(data['hashtags']) > 0
    assert 'tag' in data['hashtags'][0]

def test_explore_discovery_feed(client):
    res = client.get('/api/posts/explore?q=welcome')
    assert res.status_code == 200
    data = res.get_json()
    assert 'posts' in data
    assert 'trending_hashtags' in data
    assert 'suggested_creators' in data

def test_ai_trending_topics(client):
    res = client.get('/api/ai/trending-topics')
    assert res.status_code == 200
    data = res.get_json()
    assert 'topics' in data
    assert len(data['topics']) > 0
    assert 'topic' in data['topics'][0]
    assert 'category' in data['topics'][0]

