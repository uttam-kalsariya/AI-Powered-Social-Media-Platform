import os
import sys
import pytest
from datetime import datetime, timezone, timedelta

# Ensure server root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.security import (
    hash_password,
    hash_token,
    generate_verification_code,
    hash_otp,
    verify_otp_hmac
)
from app.database import get_db, ensure_indexes
from app.services.token_service import (
    create_email_verification_token,
    verify_email_token
)
from app.models.user_model import build_user_document

@pytest.fixture(autouse=True)
def setup_test_db():
    """Use isolated test database for testing."""
    os.environ['TESTING'] = 'True'
    db = get_db(db_name="social_media_test_db", force_reconnect=True)
    ensure_indexes(db)
    yield db
    for col in ['users', 'verification_tokens']:
        db[col].delete_many({})

def test_generate_verification_code():
    """Verify cryptographically secure 6-digit OTP code."""
    for _ in range(20):
        code = generate_verification_code()
        assert len(code) == 6
        assert code.isdigit()

def test_otp_hmac_sha256_hash_storage(setup_test_db):
    """Verify OTP is never stored in plain text and uses HMAC-SHA256 with server-side secret."""
    db = setup_test_db
    user_doc = build_user_document("OTP User", "otp_user", "otp_user@example.com", hash_password("Password123!@#"))
    res = db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    ok, raw_otp, err = create_email_verification_token(user_id, "otp_user@example.com")
    assert ok is True
    assert err == ""
    assert raw_otp is not None
    assert len(raw_otp) == 6

    # Verify plain OTP is NOT in database
    token_doc = db.verification_tokens.find_one({"user_id": res.inserted_id})
    assert token_doc is not None
    assert "token" not in token_doc or token_doc.get("token") != raw_otp
    # Must match HMAC-SHA256, NOT plain SHA-256
    assert token_doc["token_hash"] == hash_otp(raw_otp)
    assert token_doc["token_hash"] != hash_token(raw_otp)
    assert token_doc["attempts"] == 0
    assert token_doc["used"] is False

def test_otp_verification_success(setup_test_db):
    """Verify valid OTP activates user and sets email_verified and is_verified to True."""
    db = setup_test_db
    user_doc = build_user_document("Verify User", "verify_user", "verify_user@example.com", hash_password("Password123!@#"))
    res = db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    ok, raw_otp, _ = create_email_verification_token(user_id, "verify_user@example.com")
    assert ok is True

    # Verify with correct code
    success, validated_uid, err = verify_email_token(raw_otp, email="verify_user@example.com")
    assert success is True
    assert err == ""
    assert validated_uid == user_id

    # User must now be active & email_verified
    user = db.users.find_one({"_id": res.inserted_id})
    assert user["is_verified"] is True
    assert user["email_verified"] is True

def test_otp_attempt_limiter_and_lockout(setup_test_db):
    """Verify wrong OTP increments attempt counter and locks out after 5 attempts."""
    db = setup_test_db
    user_doc = build_user_document("Attempt User", "attempt_user", "attempt_user@example.com", hash_password("Password123!@#"))
    res = db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    ok, raw_otp, _ = create_email_verification_token(user_id, "attempt_user@example.com")
    assert ok is True

    # 4 wrong attempts
    for i in range(4):
        success, _, err = verify_email_token("000000", email="attempt_user@example.com")
        assert success is False
        assert "Invalid" in err

    # 5th wrong attempt triggers lockout
    success, _, err = verify_email_token("000000", email="attempt_user@example.com")
    assert success is False
    assert "too many failed attempts" in err.lower() or "invalidated" in err.lower()

    # Even right code is rejected once locked
    success, _, err = verify_email_token(raw_otp, email="attempt_user@example.com")
    assert success is False
    assert "invalidated" in err.lower() or "too many failed attempts" in err.lower() or "used" in err.lower()

def test_otp_cannot_be_reused(setup_test_db):
    """Verify an OTP cannot be used more than once."""
    db = setup_test_db
    user_doc = build_user_document("Reuse User", "reuse_user", "reuse_user@example.com", hash_password("Password123!@#"))
    res = db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    ok, raw_otp, _ = create_email_verification_token(user_id, "reuse_user@example.com")
    assert ok is True

    # 1st verification
    success, _, _ = verify_email_token(raw_otp, email="reuse_user@example.com")
    assert success is True

    # 2nd verification attempt with same code
    success, _, err = verify_email_token(raw_otp, email="reuse_user@example.com")
    assert success is False
    assert "already been used" in err or "Invalid" in err

def test_otp_resend_cooldown(setup_test_db):
    """Verify 60-second cooldown prevents spamming OTP generation."""
    db = setup_test_db
    user_doc = build_user_document("Cooldown User", "cooldown_user", "cooldown_user@example.com", hash_password("Password123!@#"))
    res = db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    # 1st creation
    ok1, raw_otp1, err1 = create_email_verification_token(user_id, "cooldown_user@example.com")
    assert ok1 is True
    assert err1 == ""
    assert raw_otp1 is not None

    # Immediate 2nd creation must be rejected by cooldown
    ok2, raw_otp2, err2 = create_email_verification_token(user_id, "cooldown_user@example.com")
    assert ok2 is False
    assert raw_otp2 == ""
    assert "wait" in err2.lower() or "cooldown" in err2.lower()
