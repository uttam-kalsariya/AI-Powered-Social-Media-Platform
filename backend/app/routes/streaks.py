from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id
from app.models.streak_model import BADGES_CATALOG
from app.services.streak_service import (
    get_or_create_streak,
    record_activity,
    get_leaderboard
)

streaks_bp = Blueprint('streaks', __name__, url_prefix='/api/streaks')

@streaks_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_streak():
    """
    Returns the authenticated user's current streak statistics,
    level progression, weekly breakdown, badges, and activity calendar.
    """
    user_id = get_jwt_identity()
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    streak = get_or_create_streak(user_id, user.get('username'))
    
    return jsonify({
        "streak": serialize_doc(streak),
        "badges_catalog": BADGES_CATALOG
    }), 200

@streaks_bp.route('/checkin', methods=['POST'])
@jwt_required()
def claim_checkin():
    """
    Claims the daily check-in reward for today.
    Increments or preserves streak, awards XP, and returns updated stats.
    """
    user_id = get_jwt_identity()
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Check if checkin was already claimed today
    streak = get_or_create_streak(user_id, user.get('username'))
    today_activities = streak.get('today_activities', {})
    
    if today_activities.get('checkin_claimed'):
        return jsonify({
            "message": "Daily check-in already claimed for today. Come back tomorrow!",
            "already_claimed": True,
            "streak": serialize_doc(streak)
        }), 200
        
    result = record_activity(user_id, 'checkin')
    
    return jsonify({
        "message": f"Daily check-in successful! +{result['xp_gained']} XP awarded.",
        "already_claimed": False,
        **result
    }), 200

@streaks_bp.route('/leaderboard', methods=['GET'])
def get_streak_leaderboard():
    """Returns top platform members ordered by current streak and XP."""
    limit = min(50, max(1, int(request.args.get('limit', 10))))
    leaderboard = get_leaderboard(limit=limit)
    return jsonify({"leaderboard": leaderboard}), 200

@streaks_bp.route('/badges', methods=['GET'])
def get_badges_catalog():
    """Returns the full badge catalog with descriptions and requirements."""
    return jsonify({"badges": BADGES_CATALOG}), 200

@streaks_bp.route('/user/<username>', methods=['GET'])
def get_user_streak(username):
    """Returns public streak profile, level, and unlocked badges for any user."""
    db = get_db()
    user = db.users.find_one({"username": username.strip().lower()})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    streak = get_or_create_streak(str(user['_id']), user.get('username'))
    
    public_data = {
        "user_id": str(user['_id']),
        "username": user.get('username'),
        "full_name": user.get('full_name', user.get('username')),
        "avatar": user.get('avatar', ''),
        "current_streak": streak.get('current_streak', 0),
        "longest_streak": streak.get('longest_streak', 0),
        "total_active_days": streak.get('total_active_days', 0),
        "xp": streak.get('xp', 0),
        "level": streak.get('level', 1),
        "level_title": streak.get('level_title', 'Novice Explorer'),
        "unlocked_badges": streak.get('unlocked_badges', []),
        "weekly_progress": streak.get('weekly_progress', {}),
        "active_dates": streak.get('active_dates', [])
    }
    
    return jsonify({"streak": public_data}), 200

