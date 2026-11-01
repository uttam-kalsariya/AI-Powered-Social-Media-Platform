from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id
from app.services.social_service import (
    toggle_follow_user,
    get_followers,
    get_following,
    get_suggested_creators,
    is_following
)

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    update_data = {}
    if 'bio' in data:
        update_data['bio'] = data['bio'].strip()
    if 'avatar' in data and data['avatar'].strip():
        update_data['avatar'] = data['avatar'].strip()
    if 'display_name' in data:
        update_data['display_name'] = data['display_name'].strip()
        
    if update_data:
        db.users.update_one({"_id": user['_id']}, {"$set": update_data})
        if 'avatar' in update_data:
            db.posts.update_many(
                {"author_id": str(user_id)},
                {"$set": {"author_avatar": update_data['avatar']}}
            )
            
    updated_user = db.users.find_one({"_id": user['_id']}, {"password_hash": 0})
    return jsonify({
        "message": "Profile updated successfully",
        "user": serialize_doc(updated_user)
    }), 200

@users_bp.route('/suggested', methods=['GET'])
def get_suggested():
    """Returns top active creators suggested to follow."""
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass
        
    limit = min(20, max(1, int(request.args.get('limit', 5))))
    creators = get_suggested_creators(current_user_id, limit=limit)
    return jsonify({"suggested": creators}), 200

@users_bp.route('/<user_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    """Toggles following or unfollowing a target user."""
    follower_id = get_jwt_identity()
    
    # Resolve user_id if passed as username
    db = get_db()
    target = db.users.find_one({"_id": to_object_id(user_id)})
    if not target:
        target = db.users.find_one({"username": user_id.lower()})
        if not target:
            return jsonify({"error": "User not found"}), 404
            
    target_id_str = str(target["_id"])
    try:
        result = toggle_follow_user(follower_id, target_id_str)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@users_bp.route('/<user_id>/followers', methods=['GET'])
def list_followers(user_id):
    """Retrieves list of users who follow the target user."""
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    db = get_db()
    target = db.users.find_one({"_id": to_object_id(user_id)})
    if not target:
        target = db.users.find_one({"username": user_id.lower()})
        if not target:
            return jsonify({"error": "User not found"}), 404
            
    target_id_str = str(target["_id"])
    followers = get_followers(target_id_str, current_user_id)
    return jsonify({"followers": followers, "count": len(followers)}), 200

@users_bp.route('/<user_id>/following', methods=['GET'])
def list_following(user_id):
    """Retrieves list of users whom the target user is following."""
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    db = get_db()
    target = db.users.find_one({"_id": to_object_id(user_id)})
    if not target:
        target = db.users.find_one({"username": user_id.lower()})
        if not target:
            return jsonify({"error": "User not found"}), 404
            
    target_id_str = str(target["_id"])
    following = get_following(target_id_str, current_user_id)
    return jsonify({"following": following, "count": len(following)}), 200

@users_bp.route('/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)}, {"password_hash": 0})
    if not user:
        user = db.users.find_one({"username": user_id.lower()}, {"password_hash": 0})
        if not user:
            return jsonify({"error": "User not found"}), 404
            
    uid_str = str(user['_id'])
    posts = list(db.posts.find({"author_id": uid_str}).sort('created_at', -1))
    
    # Calculate real-time follower/following counts if not yet on user doc
    followers_count = user.get("followers_count")
    if followers_count is None:
        followers_count = db.follows.count_documents({"followed_id": uid_str})
        db.users.update_one({"_id": user['_id']}, {"$set": {"followers_count": followers_count}})
        
    following_count = user.get("following_count")
    if following_count is None:
        following_count = db.follows.count_documents({"follower_id": uid_str})
        db.users.update_one({"_id": user['_id']}, {"$set": {"following_count": following_count}})

    user_data = serialize_doc(user)
    user_data["followers_count"] = followers_count
    user_data["following_count"] = following_count
    user_data["is_following"] = is_following(current_user_id, uid_str) if current_user_id else False

    return jsonify({
        "user": user_data,
        "posts": serialize_doc(posts),
        "posts_count": len(posts)
    }), 200
