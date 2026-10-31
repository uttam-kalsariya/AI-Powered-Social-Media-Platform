from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.db import get_db, get_status
from app.models.helpers import serialize_doc, to_object_id

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') != 'admin':
                return jsonify({"error": "Admin access required"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

@admin_bp.route('/stats', methods=['GET'])
@admin_required()
def get_dashboard_stats():
    db = get_db()
    total_users = db.users.count_documents({})
    active_users = db.users.count_documents({"status": "active"})
    total_posts = db.posts.count_documents({})
    total_comments = db.comments.count_documents({})
    flagged_posts = db.posts.count_documents({"is_flagged": True})
    
    # Active logins in last 24h
    day_ago = datetime.now(timezone.utc) - timedelta(days=1)
    recent_logins = db.audit_logs.count_documents({
        "event": "user_login",
        "timestamp": {"$gte": day_ago}
    })
    
    db_info = get_status()
    
    return jsonify({
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "total_posts": total_posts,
            "total_comments": total_comments,
            "flagged_posts": flagged_posts,
            "recent_logins_24h": recent_logins,
            "database_status": db_info
        }
    }), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required()
def list_users():
    db = get_db()
    users = list(db.users.find({}, {"password_hash": 0}).sort('created_at', -1))
    return jsonify({"users": serialize_doc(users)}), 200

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@admin_required()
def update_user_status(user_id):
    data = request.get_json() or {}
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    update_fields = {}
    if 'role' in data and data['role'] in ['user', 'admin']:
        update_fields['role'] = data['role']
    if 'status' in data and data['status'] in ['active', 'banned']:
        update_fields['status'] = data['status']
        
    if not update_fields:
        return jsonify({"error": "No valid fields provided to update"}), 400
        
    db.users.update_one({"_id": user['_id']}, {"$set": update_fields})
    updated_user = db.users.find_one({"_id": user['_id']}, {"password_hash": 0})
    
    return jsonify({
        "message": "User updated successfully",
        "user": serialize_doc(updated_user)
    }), 200

@admin_bp.route('/posts', methods=['GET'])
@admin_required()
def list_all_posts():
    db = get_db()
    flagged_only = request.args.get('flagged', 'false').lower() == 'true'
    query = {"is_flagged": True} if flagged_only else {}
    posts = list(db.posts.find(query).sort('created_at', -1).limit(100))
    return jsonify({"posts": serialize_doc(posts)}), 200

@admin_bp.route('/posts/<post_id>/dismiss-flag', methods=['POST'])
@admin_required()
def dismiss_post_flag(post_id):
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        return jsonify({"error": "Post not found"}), 404
        
    db.posts.update_one(
        {"_id": post['_id']},
        {"$set": {"is_flagged": False, "moderation_reason": "Cleared by admin"}}
    )
    return jsonify({"message": "Flag dismissed"}), 200

@admin_bp.route('/activity', methods=['GET'])
@admin_required()
def get_activity_log():
    db = get_db()
    logs = list(db.audit_logs.find().sort('timestamp', -1).limit(50))
    return jsonify({"activities": serialize_doc(logs)}), 200
