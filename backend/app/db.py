import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import mongomock
from app.config import Config

logger = logging.getLogger(__name__)

db_instance = None
mongo_client = None
is_mock_db = False

def get_db():
    global db_instance, mongo_client, is_mock_db
    if db_instance is not None:
        return db_instance
    
    uri = Config.MONGO_URI
    try:
        # Attempt real MongoDB connection with 2.5 second timeout
        client = MongoClient(uri, serverSelectionTimeoutMS=2500)
        client.admin.command('ping')
        mongo_client = client
        db_name = uri.split('/')[-1].split('?')[0] or 'ai_social_media'
        db_instance = client[db_name]
        is_mock_db = False
        logger.info(f"Connected successfully to MongoDB database '{db_name}' at {uri}")
        print(f"[DB] Successfully connected to live MongoDB: {db_name}")
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        logger.warning(f"Could not connect to live MongoDB ({e}). Falling back to in-memory mongomock for development.")
        print(f"[DB] Live MongoDB unreachable. Using mongomock in-memory database fallback for smooth local testing.")
        mongo_client = mongomock.MongoClient()
        db_instance = mongo_client['ai_social_media']
        is_mock_db = True
        
    return db_instance

def get_status():
    global is_mock_db
    return {
        "status": "connected",
        "mock_mode": is_mock_db,
        "engine": "mongomock (In-Memory Fallback)" if is_mock_db else "MongoDB Live Server"
    }
