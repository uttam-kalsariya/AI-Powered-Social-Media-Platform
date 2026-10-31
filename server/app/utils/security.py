import re
import secrets
import hashlib
import bcrypt

def hash_password(password: str) -> str:
    """Hash password using bcrypt with standard 12 salt rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Enforce strong password policy:
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one numeric digit
    - At least one special character
    """
    if not password or not isinstance(password, str):
        return False, "Password cannot be empty"
        
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
        
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter (A-Z)"
        
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter (a-z)"
        
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one numeric digit (0-9)"
        
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~;]', password):
        return False, "Password must contain at least one special character (!@#$%^&*...)"
        
    return True, "Password meets security requirements"

def generate_secure_token(nbytes: int = 32) -> str:
    """Generate cryptographically secure URL-safe random token."""
    return secrets.token_urlsafe(nbytes)

def hash_token(token: str) -> str:
    """Compute SHA-256 hex digest of a token so plain tokens are never stored in the database."""
    if not token:
        return ""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

import os
import hmac

def generate_verification_code() -> str:
    """Generate cryptographically random 6-digit confirmation code."""
    return f"{secrets.randbelow(900000) + 100000}"

def hash_otp(otp: str, secret: str = None) -> str:
    """
    Computes HMAC-SHA256 digest of 6-digit OTP using the dedicated server-side secret.
    Prevents offline rainbow table / precomputation attacks on 6-digit code space.
    """
    if not otp:
        return ""
    if not secret:
        from app.config import Config
        secret = getattr(Config, 'OTP_HASH_SECRET', 'fallback-otp-hmac-secret-change-me')
    key_bytes = secret.encode('utf-8')
    otp_bytes = otp.strip().encode('utf-8')
    return hmac.new(key_bytes, otp_bytes, hashlib.sha256).hexdigest()

def verify_otp_hmac(plain_otp: str, expected_hash: str, secret: str = None) -> bool:
    """Constant-time comparison of submitted OTP HMAC against stored hash."""
    if not plain_otp or not expected_hash:
        return False
    computed = hash_otp(plain_otp, secret=secret)
    return hmac.compare_digest(computed, expected_hash)

def set_refresh_token_cookie(response, refresh_token: str, remember_me: bool = False):
    """
    Configures a hardened HttpOnly cookie for the refresh token.
    Enforces HttpOnly=True, Secure flag based on environment, and appropriate SameSite.
    Session duration: 30 days if remember_me is True, otherwise 7 days.
    Restricted to /api/auth path to minimize attack surface.
    """
    is_prod = os.getenv('FLASK_ENV') == 'production' or os.getenv('ENV') == 'production'
    max_age = 30 * 86400 if remember_me else 7 * 86400
    
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        max_age=max_age,
        httponly=True,
        secure=is_prod,
        samesite='None' if is_prod else 'Lax',
        path='/api/auth'
    )
    return response

def clear_refresh_token_cookie(response):
    """Clears and invalidates the HttpOnly refresh token cookie on logout."""
    is_prod = os.getenv('FLASK_ENV') == 'production' or os.getenv('ENV') == 'production'
    response.set_cookie(
        key='refresh_token',
        value='',
        max_age=0,
        expires=0,
        httponly=True,
        secure=is_prod,
        samesite='None' if is_prod else 'Lax',
        path='/api/auth'
    )
    return response
