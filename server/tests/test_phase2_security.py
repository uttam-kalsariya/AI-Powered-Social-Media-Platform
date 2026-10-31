import os
import sys
import pytest
from datetime import datetime, timezone, timedelta

# Ensure server root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.security import (
    hash_password,
    check_password,
    validate_password_strength,
    generate_secure_token,
    hash_token,
    generate_verification_code
)
from app.utils.rate_limiter import is_rate_limited, reset_rate_limits
from app.database import get_db, ensure_indexes
from app.services.token_service import (
    create_user_tokens,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_user_sessions,
    create_password_reset_token,
    verify_password_reset_token,
    mark_password_reset_token_used,
    create_email_verification_token,
    verify_email_token
)
from app.models.user_model import build_user_document, sanitize_user_profile

@pytest.fixture(autouse=True)
def setup_test_db():
    """Isolate test database using in-memory mongomock for testing."""
    os.environ['TESTING'] = 'True'
    db = get_db(db_name="social_media_test_db", force_reconnect=True)
    ensure_indexes(db)
    reset_rate_limits()
    yield db
    # Cleanup collections after test
    for col in ['users', 'password_reset_tokens', 'refresh_tokens', 'verification_tokens']:
        db[col].delete_many({})

# 1. Bcrypt Password Hashing Tests
def test_bcrypt_hashing_and_verification():
    raw_password = "SuperSecurePassword123!@#"
    hashed = hash_password(raw_password)
    
    assert hashed != raw_password
    assert hashed.startswith("$2b$")
    assert check_password(raw_password, hashed) is True
    assert check_password("WrongPassword123!", hashed) is False

# 2. Password Strength Validation Tests (Minimum 12 chars + Complexity)
def test_password_strength_policy():
    # Less than 12 chars
    valid, msg = validate_password_strength("Short123!A")
    assert valid is False
    assert "at least 12 characters" in msg

    # Missing uppercase
    valid, msg = validate_password_strength("nouppercase123!@#")
    assert valid is False
    assert "uppercase" in msg

    # Missing special character
    valid, msg = validate_password_strength("NoSpecialChar12345")
    assert valid is False
    assert "special character" in msg

    # Valid strong password
    valid, msg = validate_password_strength("ValidStrongPass123!@#")
    assert valid is True
    assert "meets security requirements" in msg

# 3. SHA-256 Token Hashing Tests
def test_sha256_token_hashing():
    plain_token = generate_secure_token(32)
    token_hash = hash_token(plain_token)
    
    assert len(token_hash) == 64  # SHA-256 hex string length
    assert token_hash != plain_token
    # Deterministic check
    assert hash_token(plain_token) == token_hash

# 4. Password Reset Token Creation, Expiration & Verification
def test_password_reset_token_lifecycle(setup_test_db):
    db = setup_test_db
    user_res = db.users.insert_one({"username": "reset_user", "email": "reset@test.local"})
    user_id = str(user_res.inserted_id)
    
    plain_token = create_password_reset_token(user_id)
    
    # Verify plain token is NOT stored in DB
    record = db.password_reset_tokens.find_one({"token_hash": hash_token(plain_token)})
    assert record is not None
    assert "token" not in record  # Only token_hash is stored!
    assert record["used"] is False
    
    # Valid verification
    is_valid, returned_user_id, err = verify_password_reset_token(plain_token)
    assert is_valid is True
    assert returned_user_id == user_id
    assert err == ""

# 5. Password Reset Single-Use Enforcement
def test_password_reset_token_single_use(setup_test_db):
    db = setup_test_db
    user_res = db.users.insert_one({"username": "user2", "email": "user2@test.local"})
    user_id = str(user_res.inserted_id)
    
    plain_token = create_password_reset_token(user_id)
    
    # Mark used
    success = mark_password_reset_token_used(plain_token)
    assert success is True
    
    # Attempting reuse must fail
    is_valid, _, err = verify_password_reset_token(plain_token)
    assert is_valid is False
    assert "already been used" in err

# 6. Password Reset Application-Level Expiration Check
def test_password_reset_token_expiration_in_code(setup_test_db):
    db = setup_test_db
    user_res = db.users.insert_one({"username": "user3", "email": "user3@test.local"})
    user_id = str(user_res.inserted_id)
    
    plain_token = create_password_reset_token(user_id)
    token_hash = hash_token(plain_token)
    
    # In MongoDB Atlas, TTL cleanup runs asynchronously every ~60s, so expired documents
    # remain queryable for a short window. Mongomock eagerly drops them during find() queries.
    # We drop the TTL index in this mock test to ensure our Python application-level
    # expiration verification check is executed and verified directly.
    try:
        db.password_reset_tokens.drop_index("idx_reset_ttl")
    except Exception:
        pass

    # Backdate expires_at to simulate TTL lag where document still exists but is expired
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.password_reset_tokens.update_one({"token_hash": token_hash}, {"$set": {"expires_at": expired_time}})
    
    is_valid, _, err = verify_password_reset_token(plain_token)
    assert is_valid is False
    assert err == "This password reset token has expired"

# 7. Email Verification Token Hashing and Validation
def test_email_verification_token_hashing(setup_test_db):
    db = setup_test_db
    user_res = db.users.insert_one({"username": "verify_me", "email": "verify@test.local", "email_verified": False})
    user_id = str(user_res.inserted_id)
    
    ok, plain_code, _ = create_email_verification_token(user_id)
    assert ok is True
    assert len(plain_code) == 6
    
    # Verify plain code is not in DB and HMAC hash is stored
    from app.utils.security import hash_otp
    record = db.verification_tokens.find_one({"token_hash": hash_otp(plain_code)})
    assert record is not None
    assert record["used"] is False
    
    # Verify code
    is_valid, verified_uid, err = verify_email_token(plain_code, user_id=user_id)
    assert is_valid is True
    assert verified_uid == user_id
    
    # Check user record was updated to verified
    user = db.users.find_one({"_id": user_res.inserted_id})
    assert user["email_verified"] is True

# 8. Refresh Token Rotation & Reuse Detection
def test_refresh_token_rotation_and_reuse_defense(setup_test_db):
    from flask import Flask
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = 'test-jwt-secret-key-that-is-at-least-32-bytes-long-super-secure'
    from flask_jwt_extended import JWTManager
    JWTManager(app)
    
    db = setup_test_db
    user_res = db.users.insert_one({"username": "session_user", "email": "session@test.local", "role": "user", "account_status": "active"})
    user_doc = db.users.find_one({"_id": user_res.inserted_id})
    
    with app.test_request_context():
        tokens = create_user_tokens(user_doc, remember_me=False)
        refresh1 = tokens["refresh_token"]
        
        # 1. First rotation (valid)
        success, new_tokens, err = rotate_refresh_token(refresh1)
        assert success is True
        assert "access_token" in new_tokens
        refresh2 = new_tokens["refresh_token"]
        assert refresh1 != refresh2
        
        # 2. Replay Attack: Attacker tries to reuse refresh1
        reuse_success, _, reuse_err = rotate_refresh_token(refresh1)
        assert reuse_success is False
        assert "reuse detected" in reuse_err.lower()
        
        # All sessions must be revoked!
        active_sessions = db.refresh_tokens.count_documents({"user_id": user_res.inserted_id, "revoked": False})
        assert active_sessions == 0

# 9. Rate Limiter Sliding Window Test
def test_rate_limiter():
    reset_rate_limits()
    test_key = "login_test_ip_192.168.1.1"
    
    # Allow 3 requests in 10 seconds
    limited, _ = is_rate_limited(test_key, max_requests=3, window_seconds=10)
    assert limited is False
    limited, _ = is_rate_limited(test_key, max_requests=3, window_seconds=10)
    assert limited is False
    limited, _ = is_rate_limited(test_key, max_requests=3, window_seconds=10)
    assert limited is False
    
    # 4th request must be rate-limited
    limited, retry_after = is_rate_limited(test_key, max_requests=3, window_seconds=10)
    assert limited is True
    assert retry_after > 0

# 10. User Profile Sanitization Test
def test_user_profile_sanitization():
    raw_doc = {
        "_id": "672340a1b8c19d45e1234567",
        "username": "secret_user",
        "email": "secret@test.local",
        "password_hash": "$2b$12$abcdef...",
        "verification_token": "123456",
        "token_hash": "hash...",
        "role": "user"
    }
    sanitized = sanitize_user_profile(raw_doc)
    assert "password_hash" not in sanitized
    assert "verification_token" not in sanitized
    assert "token_hash" not in sanitized
    assert sanitized["username"] == "secret_user"

# 11. Database Indexes Verification Test
def test_mongodb_indexes(setup_test_db):
    db = setup_test_db
    ensure_indexes(db)
    
    # Verify index names exist in index_information
    user_indexes = db.users.index_information()
    assert "idx_users_email_unique" in user_indexes
    assert user_indexes["idx_users_email_unique"].get("unique") is True
    assert "idx_users_username_unique" in user_indexes
    assert user_indexes["idx_users_username_unique"].get("unique") is True
    
    reset_indexes = db.password_reset_tokens.index_information()
    assert "idx_reset_token_hash" in reset_indexes
    assert "idx_reset_ttl" in reset_indexes
    
    refresh_indexes = db.refresh_tokens.index_information()
    assert "idx_refresh_token_hash" in refresh_indexes
    assert "idx_refresh_ttl" in refresh_indexes
    
    verify_indexes = db.verification_tokens.index_information()
    assert "idx_verify_token_hash" in verify_indexes
    assert "idx_verify_ttl" in verify_indexes

# 12. Secure HttpOnly Cookie Configuration Test
def test_secure_httponly_cookie_helpers():
    from flask import Response
    from app.utils.security import set_refresh_token_cookie, clear_refresh_token_cookie
    
    # Standard session (7 days)
    resp = Response("OK")
    set_refresh_token_cookie(resp, "sample_refresh_token_123", remember_me=False)
    cookie = resp.headers.get("Set-Cookie")
    assert "refresh_token=sample_refresh_token_123" in cookie
    assert "HttpOnly" in cookie
    assert "Path=/api/auth" in cookie
    assert "Max-Age=604800" in cookie
    
    # Remember Me session (30 days)
    resp_remember = Response("OK")
    set_refresh_token_cookie(resp_remember, "sample_remember_token_456", remember_me=True)
    cookie_rem = resp_remember.headers.get("Set-Cookie")
    assert "refresh_token=sample_remember_token_456" in cookie_rem
    assert "HttpOnly" in cookie_rem
    assert "Max-Age=2592000" in cookie_rem
    
    # Cookie clearing on logout
    resp_clear = Response("OK")
    clear_refresh_token_cookie(resp_clear)
    cookie_clr = resp_clear.headers.get("Set-Cookie")
    assert "Max-Age=0" in cookie_clr
    assert "HttpOnly" in cookie_clr
