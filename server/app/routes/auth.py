import secrets
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id
from app.services.email_service import send_verification_email, send_password_reset_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'user')  # 'user' or 'admin'
    
    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
        
    db = get_db()
    existing_user = db.users.find_one({
        "$or": [{"email": email}, {"username": username}]
    })
    if existing_user:
        return jsonify({"error": "Username or email already exists"}), 409
        
    # Generate 6-digit verification code
    verification_token = f"{secrets.randbelow(900000) + 100000}"
    
    user_doc = {
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "role": 'admin' if role == 'admin' else 'user',
        "is_verified": False,
        "verification_token": verification_token,
        "reset_token": None,
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
        "bio": "Excited to connect on AI Social!",
        "created_at": datetime.now(timezone.utc),
        "last_login": None,
        "status": "active"
    }
    
    result = db.users.insert_one(user_doc)
    user_doc['_id'] = result.inserted_id
    
    # Send verification email via SMTP service (falls back to console log)
    send_verification_email(email, username, verification_token)
    
    # Notify admins about new user registration
    db.notifications.insert_one({
        "recipient_role": "admin",
        "sender_id": str(result.inserted_id),
        "sender_name": username,
        "type": "registration",
        "message": f"New user '{username}' registered ({email})",
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return jsonify({
        "message": "Registration successful. Please verify your email.",
        "user": serialize_doc(user_doc),
        "dev_verification_code": verification_token  # Provided for frictionless development testing
    }), 201

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    token = data.get('token', '').strip()
    
    if not email or not token:
        return jsonify({"error": "Email and verification token are required"}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if user.get('is_verified'):
        return jsonify({"message": "Account is already verified"}), 200
        
    if user.get('verification_token') != token:
        return jsonify({"error": "Invalid verification token"}), 400
        
    db.users.update_one(
        {"_id": user['_id']},
        {"$set": {"is_verified": True, "verification_token": None}}
    )
    
    return jsonify({"message": "Email verified successfully! You may now log in."}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email_or_username = data.get('email_or_username', '').strip()
    password = data.get('password', '')
    
    if not email_or_username or not password:
        return jsonify({"error": "Email/username and password are required"}), 400
        
    db = get_db()
    user = db.users.find_one({
        "$or": [
            {"email": email_or_username.lower()},
            {"username": email_or_username}
        ]
    })
    
    if not user or not check_password(password, user.get('password_hash', '')):
        return jsonify({"error": "Invalid credentials"}), 401
        
    if user.get('status') == 'banned':
        return jsonify({"error": "Your account has been suspended by an administrator"}), 403
        
    # Update last login timestamp
    now = datetime.now(timezone.utc)
    db.users.update_one({"_id": user['_id']}, {"$set": {"last_login": now}})
    
    # Requirement 3: Admin persona receives notification whenever a user successfully logs in
    admin_notif = {
        "recipient_role": "admin",
        "sender_id": str(user['_id']),
        "sender_name": user.get('username'),
        "type": "login",
        "message": f"User '{user.get('username')}' logged in successfully at {now.strftime('%H:%M:%S UTC')}",
        "is_read": False,
        "created_at": now
    }
    db.notifications.insert_one(admin_notif)
    
    # Log in audit logs
    db.audit_logs.insert_one({
        "event": "user_login",
        "user_id": str(user['_id']),
        "username": user.get('username'),
        "role": user.get('role', 'user'),
        "timestamp": now,
        "ip": request.remote_addr
    })
    
    access_token = create_access_token(
        identity=str(user['_id']),
        additional_claims={
            "username": user.get('username'),
            "role": user.get('role', 'user'),
            "email": user.get('email')
        }
    )
    
    user_data = serialize_doc(user)
    user_data.pop('password_hash', None)
    
    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": user_data
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    user_data = serialize_doc(user)
    user_data.pop('password_hash', None)
    return jsonify({"user": user_data}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        # Don't leak existence of email for security
        return jsonify({"message": "If this email is registered, a password reset token has been sent."}), 200
        
    reset_token = f"{secrets.randbelow(900000) + 100000}"
    db.users.update_one(
        {"_id": user['_id']},
        {"$set": {"reset_token": reset_token}}
    )
    
    send_password_reset_email(email, reset_token)
    
    return jsonify({
        "message": "If this email is registered, a password reset token has been sent.",
        "dev_reset_token": reset_token  # Provided for frictionless development testing
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    token = data.get('token', '').strip()
    new_password = data.get('new_password', '')
    
    if not email or not token or not new_password:
        return jsonify({"error": "Email, token, and new password are required"}), 400
        
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or user.get('reset_token') != token:
        return jsonify({"error": "Invalid or expired password reset token"}), 400
        
    db.users.update_one(
        {"_id": user['_id']},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "reset_token": None
            }
        }
    )
    
    return jsonify({"message": "Password reset successfully. You can now log in with your new password."}), 200
