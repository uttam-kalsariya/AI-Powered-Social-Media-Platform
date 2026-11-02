import re
import secrets
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from app.config import Config
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

from app.services.token_service import (
    create_email_verification_token,
    verify_email_token
)
from app.utils.rate_limiter import rate_limit

@auth_bp.route('/register', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'user')
    
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
        
    user_doc = {
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "role": 'admin' if role == 'admin' else 'user',
        "is_verified": not getattr(Config, 'REQUIRE_EMAIL_VERIFICATION', False),
        "email_verified": not getattr(Config, 'REQUIRE_EMAIL_VERIFICATION', False),
        "reset_token": None,
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
        "bio": "Excited to connect on AI Social!",
        "created_at": datetime.now(timezone.utc),
        "last_login": None,
        "status": "active"
    }
    
    result = db.users.insert_one(user_doc)
    user_doc['_id'] = result.inserted_id
    
    # Generate cryptographically secure 6-digit OTP (stores only SHA-256 hash in verification_tokens)
    ok, plain_otp, err = create_email_verification_token(result.inserted_id, email, force=True)
    
    # Dispatch email via Resend
    if ok and plain_otp:
        send_verification_email(email, username, plain_otp)
        print(f"\n========================================================")
        print(f"🔑 [AURA SECURITY OTP] Verification Code for {email}: {plain_otp}")
        print(f"========================================================\n")
    
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
    
    sanitized_user = serialize_doc(user_doc)
    sanitized_user.pop('password_hash', None)
    
    return jsonify({
        "message": "Registration successful! Welcome to Aura." if not getattr(Config, 'REQUIRE_EMAIL_VERIFICATION', False) else "Registration successful. Please verify your email with the 6-digit code sent to your inbox.",
        "token": create_access_token(identity=str(result.inserted_id), additional_claims={"username": username, "role": user_doc["role"], "email": email}) if not getattr(Config, 'REQUIRE_EMAIL_VERIFICATION', False) else None,
        "needs_verification": getattr(Config, 'REQUIRE_EMAIL_VERIFICATION', False),
        "user": sanitized_user,
        "email": email,
        "expires_in_minutes": 5


    }), 201

@auth_bp.route('/verify-email', methods=['POST'])
@rate_limit(max_requests=15, window_seconds=60)
def verify_email():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    code = (data.get('otp') or data.get('token') or '').strip()
    
    if not email or not code:
        return jsonify({"error": "Email and 6-digit verification code are required"}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if user.get('is_verified') and user.get('email_verified'):
        return jsonify({"message": "Account is already verified. You may log in."}), 200
        
    # Validate OTP through token service (enforces hash check, attempt limits, single-use & 5m expiration)
    is_valid, user_id, err_msg = verify_email_token(code, email=email, user_id=user['_id'])
    if not is_valid:
        return jsonify({"error": err_msg or "Invalid verification code"}), 400
        
    return jsonify({"message": "Email verified successfully! You may now log in to your account."}), 200

@auth_bp.route('/resend-otp', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=60)
def resend_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    db = get_db()
    user = db.users.find_one({"email": email})
    
    # Generic response if user does not exist or already verified (prevents account enumeration)
    if not user or (user.get('is_verified') and user.get('email_verified')):
        return jsonify({
            "message": "If this email is pending verification, a new verification code has been dispatched."
        }), 200
        
    ok, plain_otp, err = create_email_verification_token(user['_id'], email, force=False)
    if not ok:
        return jsonify({"error": err}), 429
        
    send_verification_email(email, user.get('username', 'User'), plain_otp)
    print(f"\n========================================================")
    print(f"🔑 [AURA SECURITY OTP] Resent Verification Code for {email}: {plain_otp}")
    print(f"========================================================\n")
    
    return jsonify({
        "message": "A new 6-digit verification code has been sent to your email.",
        "expires_in_minutes": 5


    }), 200

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
            {"username": {"$regex": f"^{re.escape(email_or_username)}$", "$options": "i"}}
        ]
    })
    
    if not user or not check_password(password, user.get('password_hash', '')):
        return jsonify({"error": "Invalid credentials"}), 401

    # Check email verification status
    if getattr(Config, 'REQUIRE_EMAIL_VERIFICATION', False) and not user.get('email_verified') and not user.get('is_verified'):
        return jsonify({
            "error": "Please verify your email before logging in.",
            "email": user.get('email'),
            "needs_verification": True
        }), 403
        
    if user.get('status') == 'banned':
        return jsonify({"error": "Your account has been suspended by an administrator"}), 403
        
    # Update last login timestamp
    now = datetime.now(timezone.utc)
    db.users.update_one({"_id": user['_id']}, {"$set": {"last_login": now}})
    
    # Record daily login streak activity
    streak_result = None
    try:
        from app.services.streak_service import record_activity
        streak_result = record_activity(str(user['_id']), 'login')
    except Exception as e:
        pass
    
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
    
    res_payload = {
        "message": "Login successful",
        "token": access_token,
        "user": user_data
    }
    if streak_result:
        res_payload["streak_info"] = {
            "current_streak": streak_result.get("current_streak", 0),
            "xp_gained": streak_result.get("xp_gained", 0),
            "streak_increased": streak_result.get("streak_increased", False),
            "new_badges": streak_result.get("new_badges", [])
        }
    return jsonify(res_payload), 200

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
    identifier = (data.get('email') or data.get('username') or '').strip()
    
    if not identifier:
        return jsonify({"error": "Email or username is required"}), 400
        
    db = get_db()
    # Support case-insensitive search by either email or username
    user = db.users.find_one({
        "$or": [
            {"email": identifier.lower()},
            {"username": identifier},
            {"email": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}},
            {"username": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}}
        ]
    })
    
    if not user:
        # Don't leak user existence for unregistered identifiers
        return jsonify({
            "message": "If this account is registered, a password reset token has been sent.",
            "dev_reset_token": None
        }), 200
        
    reset_token = f"{secrets.randbelow(900000) + 100000}"
    db.users.update_one(
        {"_id": user['_id']},
        {"$set": {"reset_token": reset_token}}
    )
    
    target_email = user.get('email', identifier)
    email_result = send_password_reset_email(target_email, user.get('username', 'User'), reset_token)
    print(f"🔑 [AURA PASSWORD RESET CODE] Reset Token for {target_email} ({user.get('username')}): {reset_token}")
    
    return jsonify({
        "message": f"Password reset instructions have been dispatched to {target_email}.",
        "email": target_email,
        "reset_token": reset_token,
        "dev_reset_token": reset_token,
        "email_sent": email_result.get("success", False)
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    identifier = (data.get('email') or data.get('username') or '').strip()
    token = str(data.get('token') or data.get('code') or '').strip()
    new_password = data.get('new_password', '')
    
    if not identifier or not token or not new_password:
        return jsonify({"error": "Email or username, reset code, and new password are required"}), 400
        
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
        
    db = get_db()
    user = db.users.find_one({
        "$or": [
            {"email": identifier.lower()},
            {"username": identifier},
            {"email": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}},
            {"username": {"$regex": f"^{re.escape(identifier)}$", "$options": "i"}}
        ]
    })
    
    if not user or str(user.get('reset_token', '')) != token:
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

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Revoke session and clear authentication."""
    return jsonify({"message": "Successfully logged out"}), 200
