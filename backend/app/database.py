import os
import sys
import logging
import certifi  # type: ignore
from pymongo import MongoClient, ASCENDING  # type: ignore
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError  # type: ignore
import mongomock  # type: ignore
from app.config import Config

logger = logging.getLogger(__name__)

_mongo_client = None
_db_instance = None
_is_mock_db = False

def _get_shared_mock_client():
    if not hasattr(sys, '_shared_mongo_mock') or sys._shared_mongo_mock is None:
        sys._shared_mongo_mock = mongomock.MongoClient()
    return sys._shared_mongo_mock

def get_db(db_name: str = None, force_reconnect: bool = False):
    """
    Returns the active MongoDB database instance.
    - If TESTING environment is set, returns an isolated in-memory test database from a process-wide shared mock client.
    - Uses MongoDB Atlas when reachable, and falls back to mongomock for offline development.
    """
    global _mongo_client, _db_instance, _is_mock_db
    
    if _db_instance is not None and not force_reconnect and db_name is None:
        return _db_instance

    # Process-wide shared mock client for test mode
    if os.getenv('TESTING') == 'True' or (db_name and db_name.endswith('_test')):
        mock_client = _get_shared_mock_client()
        target_name = db_name or "social_media_test_db"
        _db_instance = mock_client[target_name]
        _is_mock_db = True
        ensure_indexes(_db_instance)
        return _db_instance

    uri = Config.MONGO_URI
    target_db_name = db_name or getattr(Config, 'MONGO_DB_NAME', None) or 'ai_social_media'

    try:
        # 5 second timeout for live MongoDB Atlas connectivity check (SRV/TLS)
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            retryWrites=True,
            tlsCAFile=certifi.where(),
            appName='Cluster0'
        )
        # Verify connection with an explicit ping command
        client.admin.command('ping')
        _mongo_client = client
        _db_instance = client[target_db_name]
        _is_mock_db = False
        logger.info(f"Connected to live MongoDB Atlas database '{target_db_name}' successfully.")
        ensure_indexes(_db_instance)
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        logger.warning(f"Could not connect to live MongoDB Atlas ({e}). Falling back to in-memory mongomock.")
        mock_client = _get_shared_mock_client()
        _mongo_client = mock_client
        _db_instance = mock_client[target_db_name]
        _is_mock_db = True
        ensure_indexes(_db_instance)
        
    return _db_instance

def get_db_status():
    """
    Returns connection health without exposing database credentials or passwords.
    """
    global _is_mock_db, _mongo_client, _db_instance
    ping_ok = False
    try:
        if _mongo_client:
            _mongo_client.admin.command('ping')
            ping_ok = True
    except Exception:
        ping_ok = False

    return {
        "status": "connected" if ping_ok or _is_mock_db else "disconnected",
        "mock_mode": _is_mock_db,
        "engine": "mongomock (In-Memory Development Fallback)" if _is_mock_db else "MongoDB Atlas",
        "database": _db_instance.name if _db_instance is not None else "ai_social_media",
        "ping": ping_ok or _is_mock_db
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
        
        logger.info("MongoDB unique and TTL indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")
