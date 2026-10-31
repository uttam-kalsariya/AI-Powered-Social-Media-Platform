import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-key-123')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-jwt-secret-key-456')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/ai_social_media')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'ai_social_media')
    
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    EMAIL_FROM = os.getenv('EMAIL_FROM', 'noreply@aisocial.local')
