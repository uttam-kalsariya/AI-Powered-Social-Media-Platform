from datetime import datetime, timezone
from app.models.helpers import serialize_doc

def build_user_document(
    full_name: str,
    username: str,
    email: str,
    password_hash: str,
    role: str = "user",
    avatar: str = "",
    bio: str = "Excited to connect on AI Social!"
) -> dict:
    """Builds a normalized, production-ready user document."""
    now = datetime.now(timezone.utc)
    clean_username = username.strip().lower()
    clean_email = email.strip().lower()
    
    return {
        "full_name": full_name.strip(),
        "username": clean_username,
        "email": clean_email,
        "password_hash": password_hash,
        "role": 'admin' if role == 'admin' else 'user',
        "avatar": avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={clean_username}",
        "bio": bio.strip(),
        "email_verified": False,
        "is_verified": False,  # backward compatibility alias
        "account_status": "active",
        "status": "active",     # backward compatibility alias
        "failed_login_attempts": 0,
        "lockout_until": None,
        "last_login": None,
        "created_at": now,
        "updated_at": now
    }

def sanitize_user_profile(user_doc: dict) -> dict:
    """Serializes MongoDB document and strips all security hashes and private internal tokens."""
    if not user_doc:
        return {}
    serialized = serialize_doc(user_doc)
    
    # Strip sensitive fields
    for field in ['password_hash', 'verification_token', 'reset_token', 'token_hash']:
        serialized.pop(field, None)
        
    return serialized
