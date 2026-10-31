from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id

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
        # If avatar or name changed, optionally update in author's existing posts
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

@users_bp.route('/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)}, {"password_hash": 0})
    if not user:
        # Try finding by username
        user = db.users.find_one({"username": user_id}, {"password_hash": 0})
        if not user:
            return jsonify({"error": "User not found"}), 404
            
    uid_str = str(user['_id'])
    posts = list(db.posts.find({"author_id": uid_str}).sort('created_at', -1))
    
    return jsonify({
        "user": serialize_doc(user),
        "posts": serialize_doc(posts),
        "posts_count": len(posts)
    }), 200
