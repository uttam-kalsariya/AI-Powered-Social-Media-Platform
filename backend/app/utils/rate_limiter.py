import time
from collections import defaultdict
from functools import wraps
from flask import request, jsonify

# In-memory sliding window rate tracker: key -> list of float timestamps
_rate_limit_store = defaultdict(list)

def is_rate_limited(key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
    """
    Check if a key has exceeded max_requests within window_seconds.
    Returns (is_limited, retry_after_seconds).
    """
    now = time.time()
    cutoff = now - window_seconds
    
    # Filter out timestamps older than sliding window
    timestamps = [t for t in _rate_limit_store[key] if t > cutoff]
    
    if len(timestamps) >= max_requests:
        oldest_in_window = timestamps[0]
        retry_after = int(window_seconds - (now - oldest_in_window)) + 1
        _rate_limit_store[key] = timestamps
        return True, max(1, retry_after)
        
    timestamps.append(now)
    _rate_limit_store[key] = timestamps
    return False, 0

def rate_limit(max_requests: int, window_seconds: int, key_prefix: str = ""):
    """
    Decorator for Flask routes enforcing request rate limits per client IP.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1').split(',')[0].strip()
            identifier = f"{key_prefix}:{client_ip}" if key_prefix else f"{request.endpoint}:{client_ip}"
            
            limited, retry_after = is_rate_limited(identifier, max_requests, window_seconds)
            if limited:
                response = jsonify({
                    "error": f"Too many requests. Please wait {retry_after} seconds before trying again."
                })
                response.status_code = 429
                response.headers['Retry-After'] = str(retry_after)
                return response
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def reset_rate_limits():
    """Helper to clear rate limits (used in testing)."""
    _rate_limit_store.clear()
