from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = str(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role', 'user')
    
    db = get_db()
    if role == 'admin':
        # Admins receive both personal notifications and all admin notifications (login alerts, signups)
        query = {
            "$or": [
                {"recipient_id": user_id},
                {"recipient_role": "admin"}
            ]
        }
    else:
        query = {"recipient_id": user_id}
        
    notifications = list(db.notifications.find(query).sort('created_at', -1).limit(50))
    unread_count = db.notifications.count_documents({**query, "is_read": False})
    
    return jsonify({
        "notifications": serialize_doc(notifications),
        "unread_count": unread_count
    }), 200

@notifications_bp.route('/read', methods=['POST'])
@jwt_required()
def mark_all_read():
    user_id = str(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role', 'user')
    
    db = get_db()
    if role == 'admin':
        query = {
            "$or": [
                {"recipient_id": user_id},
                {"recipient_role": "admin"}
            ]
        }
    else:
        query = {"recipient_id": user_id}
        
    db.notifications.update_many(query, {"$set": {"is_read": True}})
    return jsonify({"message": "All notifications marked as read"}), 200
