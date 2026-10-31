from app.database import get_db, get_db_status, ensure_indexes

def get_status():
    return get_db_status()

__all__ = ['get_db', 'get_status', 'ensure_indexes']
