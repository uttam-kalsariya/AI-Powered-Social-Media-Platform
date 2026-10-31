import logging
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from flask_jwt_extended import create_access_token
from app.database import get_db
from app.utils.security import (
    generate_secure_token, 
    hash_token, 
    generate_verification_code,
    hash_otp,
    verify_otp_hmac
)
from app.models.helpers import to_object_id

logger = logging.getLogger(__name__)

# Expiration constants
ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)
REFRESH_TOKEN_NORMAL_LIFETIME = timedelta(days=7)
REFRESH_TOKEN_REMEMBER_LIFETIME = timedelta(days=30)
PASSWORD_RESET_TOKEN_LIFETIME = timedelta(minutes=15)
VERIFICATION_TOKEN_LIFETIME = timedelta(minutes=5)
OTP_RESEND_COOLDOWN = timedelta(seconds=60)
MAX_OTP_ATTEMPTS = 5

# ==================== ACCESS & REFRESH TOKENS ====================

def create_user_tokens(user: dict, remember_me: bool = False, user_agent: str = "", ip_address: str = "") -> dict:
    """
    Creates short-lived Access Token and long-lived Refresh Token.
    Stores SHA-256 hash of refresh token in database (never plain token).
    """
    db = get_db()
    user_id_str = str(user.get('_id') or user.get('id'))
    
    # 1. Short-lived Access Token (15 mins)
    access_token = create_access_token(
        identity=user_id_str,
        expires_delta=ACCESS_TOKEN_LIFETIME,
        additional_claims={
            "username": user.get('username'),
            "email": user.get('email'),
            "role": user.get('role', 'user')
        }
    )
    
    # 2. Cryptographic Refresh Token
    plain_refresh_token = generate_secure_token(48)
    refresh_token_hash = hash_token(plain_refresh_token)
    
    lifetime = REFRESH_TOKEN_REMEMBER_LIFETIME if remember_me else REFRESH_TOKEN_NORMAL_LIFETIME
    now = datetime.now(timezone.utc)
    expires_at = now + lifetime
    
    refresh_doc = {
        "user_id": to_object_id(user_id_str),
        "token_hash": refresh_token_hash,
        "remember_me": remember_me,
        "expires_at": expires_at,
        "revoked": False,
        "user_agent": user_agent or "Unknown",
        "ip_address": ip_address or "Unknown",
        "created_at": now
    }
    db.refresh_tokens.insert_one(refresh_doc)
    
    return {
        "access_token": access_token,
        "refresh_token": plain_refresh_token,
        "expires_in": int(ACCESS_TOKEN_LIFETIME.total_seconds()),
        "remember_me": remember_me,
        "refresh_expires_at": expires_at.isoformat()
    }

def rotate_refresh_token(plain_refresh_token: str, user_agent: str = "", ip_address: str = "") -> tuple[bool, dict, str]:
    """
    Rotates a refresh token:
    1. Validates token hash.
    2. REUSE DETECTION: If token was already revoked, immediately revokes ALL sessions for user.
    3. Verifies application-level expiration (since MongoDB TTL is asynchronous).
    4. Issues a new Access Token + new Refresh Token while invalidating the old one.
    Returns (success, result_dict, error_message).
    """
    if not plain_refresh_token:
        return False, {}, "Refresh token is missing"
        
    db = get_db()
    current_hash = hash_token(plain_refresh_token)
    
    token_record = db.refresh_tokens.find_one({"token_hash": current_hash})
    if not token_record:
        return False, {}, "Invalid refresh token"
        
    user_id = token_record.get('user_id')
    
    # --- REUSE DETECTION (Replay Attack Defense) ---
    if token_record.get('revoked', False):
        logger.critical(f"[SECURITY ALERT] Refresh token reuse detected for user {user_id}! Revoking all user sessions.")
        revoke_all_user_sessions(user_id)
        return False, {}, "Security alert: Refresh token reuse detected. All active sessions have been revoked. Please log in again."
        
    # --- APPLICATION-LEVEL EXPIRATION CHECK ---
    now = datetime.now(timezone.utc)
    record_expires = token_record.get('expires_at')
    if record_expires:
        # Normalize timezone if naive
        if record_expires.tzinfo is None:
            record_expires = record_expires.replace(tzinfo=timezone.utc)
        if record_expires < now:
            db.refresh_tokens.update_one({"_id": token_record['_id']}, {"$set": {"revoked": True}})
            return False, {}, "Refresh token has expired. Please log in again."
            
    # Mark old token as revoked (one-time use)
    db.refresh_tokens.update_one(
        {"_id": token_record['_id']},
        {"$set": {"revoked": True, "replaced_at": now}}
    )
    
    # Retrieve user document
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user or user.get('account_status') == 'suspended':
        return False, {}, "User account is inactive or suspended"
        
    # Issue new token pair (Rotation)
    tokens = create_user_tokens(
        user=user,
        remember_me=token_record.get('remember_me', False),
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    return True, tokens, ""

def revoke_refresh_token(plain_refresh_token: str) -> bool:
    """Marks a single refresh token as revoked (used during user logout)."""
    if not plain_refresh_token:
        return False
    db = get_db()
    current_hash = hash_token(plain_refresh_token)
    res = db.refresh_tokens.update_one(
        {"token_hash": current_hash},
        {"$set": {"revoked": True, "revoked_at": datetime.now(timezone.utc)}}
    )
    return res.modified_count > 0

def revoke_all_user_sessions(user_id) -> int:
    """Revokes all active refresh tokens/sessions for a user (used after password reset or compromise)."""
    db = get_db()
    uid = to_object_id(user_id)
    res = db.refresh_tokens.update_many(
        {"user_id": uid, "revoked": False},
        {"$set": {"revoked": True, "revoked_at": datetime.now(timezone.utc)}}
    )
    return res.modified_count

# ==================== PASSWORD RESET TOKENS ====================

def create_password_reset_token(user_id) -> str:
    """
    Generates a secure 32-byte password reset token.
    Stores SHA-256 hash in database with 15-minute TTL.
    Returns the plain token to be dispatched via email.
    """
    db = get_db()
    plain_token = generate_secure_token(32)
    token_hash = hash_token(plain_token)
    
    now = datetime.now(timezone.utc)
    expires_at = now + PASSWORD_RESET_TOKEN_LIFETIME
    
    # Invalidate any previously unconsumed reset tokens for this user
    db.password_reset_tokens.update_many(
        {"user_id": to_object_id(user_id), "used": False},
        {"$set": {"used": True}}
    )
    
    db.password_reset_tokens.insert_one({
        "user_id": to_object_id(user_id),
        "token_hash": token_hash,
        "expires_at": expires_at,
        "used": False,
        "created_at": now
    })
    
    return plain_token

def verify_password_reset_token(plain_token: str) -> tuple[bool, str, str]:
    """
    Verifies a password reset token:
    1. Checks SHA-256 hash in database.
    2. Enforces single-use policy (`used == False`).
    3. Enforces application-level expiration (15 minutes).
    Returns (is_valid, user_id, error_message).
    """
    if not plain_token:
        return False, "", "Reset token is required"
        
    db = get_db()
    current_hash = hash_token(plain_token)
    
    record = db.password_reset_tokens.find_one({"token_hash": current_hash})
    if not record:
        return False, "", "Invalid or unrecognized password reset token"
        
    if record.get('used', False):
        return False, "", "This password reset token has already been used"
        
    now = datetime.now(timezone.utc)
    expires_at = record.get('expires_at')
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            return False, "", "This password reset token has expired"
            
    return True, str(record.get('user_id')), ""

def mark_password_reset_token_used(plain_token: str) -> bool:
    """Marks reset token as used and revokes all active sessions."""
    db = get_db()
    current_hash = hash_token(plain_token)
    record = db.password_reset_tokens.find_one({"token_hash": current_hash})
    if record:
        db.password_reset_tokens.update_one(
            {"_id": record['_id']},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
        )
        # Revoke all sessions after password reset
        revoke_all_user_sessions(record.get('user_id'))
        return True
    return False

# ==================== EMAIL VERIFICATION TOKENS ====================

def create_email_verification_token(user_id, email: str = "", force: bool = False) -> tuple[bool, str, str]:
    """
    Generates a cryptographically secure 6-digit OTP code.
    Stores only HMAC-SHA256 hash in database with 5-minute TTL.
    Enforces a 60-second cooldown between resend requests.
    Returns (success, plain_code, error_message).
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    uid = to_object_id(user_id)
    norm_email = email.strip().lower() if email else ""

    # Check 60-second cooldown on most recent OTP
    cooldown_query = {"user_id": uid} if uid else {"email": norm_email}
    last_record = db.verification_tokens.find_one(
        cooldown_query,
        sort=[("created_at", -1)]
    )

    if last_record and not force:
        last_created = last_record.get('created_at')
        if last_created:
            if last_created.tzinfo is None:
                last_created = last_created.replace(tzinfo=timezone.utc)
            elapsed = (now - last_created).total_seconds()
            if elapsed < 60:
                seconds_remaining = int(60 - elapsed)
                return False, "", f"Please wait {seconds_remaining}s before requesting a new verification code."

    plain_code = generate_verification_code()
    code_hash = hash_otp(plain_code)
    expires_at = now + VERIFICATION_TOKEN_LIFETIME

    # Invalidate previous unconsumed OTPs for this user / email
    invalidate_query = {"user_id": uid, "used": False} if uid else {"email": norm_email, "used": False}
    db.verification_tokens.update_many(
        invalidate_query,
        {"$set": {"used": True}}
    )

    db.verification_tokens.insert_one({
        "user_id": uid,
        "email": norm_email,
        "token_hash": code_hash,
        "expires_at": expires_at,
        "attempts": 0,
        "max_attempts": MAX_OTP_ATTEMPTS,
        "used": False,
        "created_at": now
    })

    return True, plain_code, ""

def verify_email_token(plain_code: str, email: str = None, user_id=None) -> tuple[bool, str, str]:
    """
    Validates email verification code:
    1. Query latest active OTP record by requested user / email first (never query by hash).
    2. Check single-use status.
    3. Check attempt limiter (max 5 failed attempts).
    4. Check 5-minute expiration window.
    5. Compare submitted OTP using constant-time HMAC-SHA256 comparison.
    6. Atomically increment failed attempts on mismatch; lock out after 5 failures.
    7. On success, mark OTP as used and activate user account (email_verified: True, is_verified: True).
    Returns (is_valid, user_id, error_message).
    """
    if not plain_code or not plain_code.strip():
        return False, "", "Verification code is required."

    clean_code = plain_code.strip()
    db = get_db()
    now = datetime.now(timezone.utc)

    # 1. Locate active OTP record strictly by user/email
    norm_email = email.strip().lower() if email else ""
    query = {}
    if norm_email:
        query["email"] = norm_email
    elif user_id:
        query["user_id"] = to_object_id(user_id)
    else:
        return False, "", "Email or user ID is required to verify code."

    record = db.verification_tokens.find_one(query, sort=[("created_at", -1)])
    if not record:
        return False, "", "Invalid or unrecognized verification request."

    # 2. Check reuse
    if record.get('used', False):
        return False, "", "This verification code has already been used."

    # 3. Check attempt limit
    attempts = record.get('attempts', 0)
    max_attempts = record.get('max_attempts', MAX_OTP_ATTEMPTS)
    if attempts >= max_attempts:
        db.verification_tokens.update_one({"_id": record['_id']}, {"$set": {"used": True}})
        return False, "", "Too many failed attempts. This code has been invalidated."

    # 4. Check expiration (5 minutes)
    expires_at = record.get('expires_at')
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            return False, "", "This verification code has expired. Please request a new code."

    # 5. Constant-time HMAC-SHA256 comparison
    expected_hash = record.get('token_hash', '')
    if not verify_otp_hmac(clean_code, expected_hash):
        new_attempts = attempts + 1
        db.verification_tokens.update_one(
            {"_id": record['_id']},
            {"$set": {"attempts": new_attempts}}
        )
        remaining = max(0, max_attempts - new_attempts)
        if remaining == 0:
            db.verification_tokens.update_one({"_id": record['_id']}, {"$set": {"used": True}})
            return False, "", "Too many failed attempts. This code has been invalidated."
        return False, "", f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."

    # 6. Mark as successfully used
    db.verification_tokens.update_one(
        {"_id": record['_id']},
        {"$set": {"used": True, "used_at": now}}
    )

    # 7. Activate matching user account
    target_uid = record.get('user_id')
    if target_uid:
        db.users.update_one(
            {"_id": target_uid},
            {"$set": {"email_verified": True, "is_verified": True, "updated_at": now}}
        )
    elif norm_email:
        db.users.update_one(
            {"email": norm_email},
            {"$set": {"email_verified": True, "is_verified": True, "updated_at": now}}
        )

    return True, str(target_uid or ""), ""
