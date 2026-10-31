import re

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
USERNAME_REGEX = r'^[a-zA-Z0-9_]{3,30}$'

def validate_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(re.match(EMAIL_REGEX, email.strip()))

def validate_username(username: str) -> bool:
    if not username or not isinstance(username, str):
        return False
    return bool(re.match(USERNAME_REGEX, username.strip()))

def validate_password(password: str) -> bool:
    if not password or len(password) < 6:
        return False
    return True
