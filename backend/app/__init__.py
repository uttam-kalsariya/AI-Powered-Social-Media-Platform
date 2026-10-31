from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import datetime, timezone
import bcrypt
from app.config import Config
from app.db import get_db, get_status

jwt = JWTManager()

def seed_initial_data(db):
    """Seeds default admin, demo user, and showcase posts if database is empty."""
    if db.users.count_documents({}) == 0:
        salt = bcrypt.gensalt()
        admin_hash = bcrypt.hashpw("AdminPass123!".encode('utf-8'), salt).decode('utf-8')
        user_hash = bcrypt.hashpw("UserPass123!".encode('utf-8'), salt).decode('utf-8')
        
        now = datetime.now(timezone.utc)
        
        # 1. Admin account
        admin_doc = {
            "username": "admin",
            "email": "admin@aisocial.local",
            "password_hash": admin_hash,
            "role": "admin",
            "is_verified": True,
            "verification_token": None,
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=AdminShield",
            "bio": "Platform Administrator & AI Systems Overseer",
            "created_at": now,
            "last_login": now,
            "status": "active"
        }
        admin_id = db.users.insert_one(admin_doc).inserted_id
        
        # 2. Demo User account
        user_doc = {
            "username": "alex_innovator",
            "email": "alex@aisocial.local",
            "password_hash": user_hash,
            "role": "user",
            "is_verified": True,
            "verification_token": None,
            "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=AlexInnovator",
            "bio": "Full-stack developer building AI-first web applications. 🚀",
            "created_at": now,
            "last_login": now,
            "status": "active"
        }
        user_id = db.users.insert_one(user_doc).inserted_id
        
        # 3. Seed initial showcase posts
        post1 = {
            "author_id": str(admin_id),
            "author_name": "admin",
            "author_avatar": admin_doc["avatar"],
            "content": "🎉 Welcome to the AI-Powered Social Media Platform! Explore smart post generation, instant tone rewriting, thread summarization, and live admin security controls.",
            "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
            "tags": ["welcome", "ai", "platform", "innovation"],
            "likes": [str(user_id)],
            "likes_count": 1,
            "comments_count": 1,
            "is_flagged": False,
            "toxicity_score": 0.02,
            "moderation_reason": "Safe content",
            "created_at": now,
            "updated_at": now
        }
        p1_res = db.posts.insert_one(post1)
        
        # Seed comment
        db.comments.insert_one({
            "post_id": str(p1_res.inserted_id),
            "author_id": str(user_id),
            "author_name": "alex_innovator",
            "author_avatar": user_doc["avatar"],
            "content": "The AI features and responsive UI feel super smooth! Love the real-time notification alerts.",
            "created_at": now
        })
        
        # Seed user post
        post2 = {
            "author_id": str(user_id),
            "author_name": "alex_innovator",
            "author_avatar": user_doc["avatar"],
            "content": "Just generated this post using the built-in AI Assistant! 💡 The tone switcher from casual to professional made drafting so seamless. What features are you testing today?",
            "image_url": "https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=1200&q=80",
            "tags": ["socialtech", "creativity", "buildinpublic"],
            "likes": [str(admin_id)],
            "likes_count": 1,
            "comments_count": 0,
            "is_flagged": False,
            "toxicity_score": 0.01,
            "moderation_reason": "Safe content",
            "created_at": now,
            "updated_at": now
        }
        db.posts.insert_one(post2)
        
        # Initial notifications
        db.notifications.insert_one({
            "recipient_role": "admin",
            "sender_id": str(user_id),
            "sender_name": "alex_innovator",
            "type": "login",
            "message": "User 'alex_innovator' logged in successfully at 10:30 UTC",
            "is_read": False,
            "created_at": now
        })
        
        print("[DB] Initial admin, demo user, showcase posts, and sample notifications seeded successfully.")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    jwt.init_app(app)
    
    # Initialize DB and seed
    db = get_db()
    seed_initial_data(db)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.posts import posts_bp
    from app.routes.ai import ai_bp
    from app.routes.admin import admin_bp
    from app.routes.notifications import notifications_bp
    from app.routes.users import users_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(users_bp)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "AI-Powered Social Media Platform API",
            "database": get_status()
        }), 200
        
    return app
