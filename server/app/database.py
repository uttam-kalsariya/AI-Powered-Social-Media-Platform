import os
import sys
import time
import logging
from typing import Optional, Dict, Any
import certifi  # type: ignore
import dns.resolver  # type: ignore
from pymongo import MongoClient, ASCENDING  # type: ignore
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
import mongomock  # type: ignore
from app.config import Config

logger = logging.getLogger(__name__)

# Configure resilient DNS nameservers for environments where local resolver needs upstream fallbacks
try:
    _res = dns.resolver.get_default_resolver()
    _ns_list = list(_res.nameservers) if _res.nameservers else []
    for _ns in ('8.8.8.8', '1.1.1.1', '8.8.4.4'):
        if _ns not in _ns_list:
            _ns_list.append(_ns)
    _res.nameservers = _ns_list  # type: ignore
except Exception as _dns_e:
    logger.debug(f"DNS resolver configuration note: {_dns_e}")

_mongo_client = None
_db_instance = None
_is_mock_db = False

def _get_shared_mock_client():
    mock_client = getattr(sys, '_shared_mongo_mock', None)
    if mock_client is None:
        mock_client = mongomock.MongoClient()
        setattr(sys, '_shared_mongo_mock', mock_client)
    return mock_client

def get_db(db_name: Optional[str] = None, force_reconnect: bool = False):
    """
    Returns the active MongoDB database instance.
    - If TESTING environment is set, returns an isolated in-memory test database from a process-wide shared mock client.
    - If USE_MOCK_DB=true is explicitly set, uses mongomock for local offline development.
    - In production/standard mode, connects to MongoDB Atlas with 3 retries and exponential backoff, failing loudly on error.
    """
    global _mongo_client, _db_instance, _is_mock_db
    
    if _db_instance is not None and not force_reconnect and db_name is None:
        return _db_instance

    is_testing = os.getenv('TESTING', 'False').lower() in ('true', '1') or (db_name and db_name.endswith('_test'))
    use_mock_db = os.getenv('USE_MOCK_DB', 'False').lower() in ('true', '1')

    # Explicit mock database mode for automated tests or local offline emulation
    if is_testing or use_mock_db:
        mock_client = _get_shared_mock_client()
        target_name = db_name or "social_media_test_db"
        _db_instance = mock_client[target_name]
        _mongo_client = mock_client
        _is_mock_db = True
        logger.info(f"Using in-memory mongomock database '{target_name}' (TESTING={is_testing}, USE_MOCK_DB={use_mock_db}).")
        ensure_indexes(_db_instance)
        return _db_instance

    uri = os.getenv('MONGO_URI') or getattr(Config, 'MONGO_URI', None) or 'mongodb://localhost:27017/ai_social_media'
    target_db_name = db_name or os.getenv('MONGO_DB_NAME') or getattr(Config, 'MONGO_DB_NAME', None) or 'ai_social_media'

    # Determine TLS requirements: mongodb+srv scheme or Atlas clusters require TLS with certifi bundle
    use_tls = uri.startswith('mongodb+srv://') or 'tls=true' in uri.lower() or 'ssl=true' in uri.lower() or 'mongodb.net' in uri

    client_kwargs = {
        "serverSelectionTimeoutMS": 30000,
        "connectTimeoutMS": 30000,
        "socketTimeoutMS": 30000,
        "retryWrites": True,
    }
    if use_tls:
        client_kwargs["tls"] = True
        client_kwargs["tlsCAFile"] = certifi.where()

    max_retries = 3
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to MongoDB Atlas (attempt {attempt}/{max_retries})...")
            client = MongoClient(uri, **client_kwargs)
            # Verify connectivity via ping command
            client.admin.command('ping')
            
            _mongo_client = client
            _db_instance = client[target_db_name]
            _is_mock_db = False
            logger.info(f"Connected to MongoDB Atlas database '{target_db_name}' successfully.")
            ensure_indexes(_db_instance)
            return _db_instance
        except Exception as e:
            last_error = e
            logger.error(f"MongoDB connection attempt {attempt}/{max_retries} failed: {type(e).__name__} - {e}")
            if attempt < max_retries:
                backoff_seconds = 2 ** attempt
                logger.info(f"Retrying MongoDB connection in {backoff_seconds} seconds...")
                time.sleep(backoff_seconds)

    # Fail loudly in production - NEVER silently fall back to mongomock
    critical_msg = (
        f"FATAL: Unable to connect to MongoDB Atlas after {max_retries} attempts. Last error: {last_error}.\n"
        "Likely root cause: MongoDB Atlas Network Access IP allowlist does not include Render's outbound IPs. "
        "Atlas rejects the connection with TLSV1_ALERT_INTERNAL_ERROR if the IP is not allowlisted (0.0.0.0/0 required on Render dynamic IPs).\n"
        "Check Atlas cluster status, MONGO_URI credentials, and ensure USE_MOCK_DB=false."
    )
    logger.critical(critical_msg)
    raise RuntimeError(critical_msg) from last_error

def get_db_status() -> Dict[str, Any]:
    """
    Returns connection health without exposing database credentials or passwords.
    """
    global _is_mock_db, _mongo_client, _db_instance
    ping_ok = False
    error_reason = None
    try:
        if _mongo_client is not None:
            _mongo_client.admin.command('ping')
            ping_ok = True
    except Exception as exc:
        ping_ok = False
        error_reason = str(exc)

    return {
        "status": "connected" if (ping_ok or _is_mock_db) else "disconnected",
        "mock_mode": _is_mock_db,
        "engine": "mongomock (In-Memory Development Fallback)" if _is_mock_db else "MongoDB Atlas",
        "database": _db_instance.name if _db_instance is not None else None,
        "ping": ping_ok or _is_mock_db,
        "error": error_reason if not ping_ok and not _is_mock_db else None
    }

def ensure_indexes(db):
    """
    Enforces unique and TTL indexes across users, tokens, and sessions.
    Handles both live MongoDB Atlas and mongomock instances.
    """
    try:
        # 1. Users collection unique indexes
        db.users.create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")
        db.users.create_index([("username", ASCENDING)], unique=True, name="idx_users_username_unique")
        db.users.create_index([("account_status", ASCENDING)], name="idx_users_status")
        
        # 2. Password reset tokens: token_hash lookup + TTL index on expires_at
        db.password_reset_tokens.create_index([("token_hash", ASCENDING)], name="idx_reset_token_hash")
        db.password_reset_tokens.create_index([("user_id", ASCENDING)], name="idx_reset_user_id")
        db.password_reset_tokens.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0, name="idx_reset_ttl")

        # 3. Refresh tokens (Sessions): token_hash lookup + TTL index on expires_at
        db.refresh_tokens.create_index([("token_hash", ASCENDING)], name="idx_refresh_token_hash")
        db.refresh_tokens.create_index([("user_id", ASCENDING)], name="idx_refresh_user_id")
        db.refresh_tokens.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0, name="idx_refresh_ttl")

        # 4. Verification tokens: token_hash lookup + TTL index on expires_at
        db.verification_tokens.create_index([("token_hash", ASCENDING)], name="idx_verify_token_hash")
        db.verification_tokens.create_index([("user_id", ASCENDING)], name="idx_verify_user_id")
        db.verification_tokens.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0, name="idx_verify_ttl")
        
        # 5. Streaks collection: unique user_id index & leaderboards
        db.streaks.create_index([("user_id", ASCENDING)], unique=True, name="idx_streaks_user_id_unique")
        db.streaks.create_index([("current_streak", -1)], name="idx_streaks_current_streak")
        db.streaks.create_index([("xp", -1)], name="idx_streaks_xp")

        # 6. Social Graph: Follows collection
        db.follows.create_index([("follower_id", ASCENDING), ("followed_id", ASCENDING)], unique=True, name="idx_follows_pair")
        db.follows.create_index([("follower_id", ASCENDING)], name="idx_follows_follower")
        db.follows.create_index([("followed_id", ASCENDING)], name="idx_follows_followed")

        # 7. Saved Posts & Bookmarks
        db.saved_posts.create_index([("user_id", ASCENDING), ("post_id", ASCENDING)], unique=True, name="idx_saved_posts_user_post")
        db.saved_posts.create_index([("user_id", ASCENDING), ("collection_name", ASCENDING)], name="idx_saved_posts_user_coll")

        # 8. Posts discovery indexes
        db.posts.create_index([("tags", ASCENDING)], name="idx_posts_tags")
        db.posts.create_index([("author_id", ASCENDING)], name="idx_posts_author")
        
        logger.info("MongoDB unique and TTL indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")
