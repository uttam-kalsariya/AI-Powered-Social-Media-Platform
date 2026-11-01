from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.db import get_db
from app.models.helpers import to_object_id
from app.services.ai_service import (
    generate_post,
    improve_post,
    summarize_post,
    generate_smart_replies,
    moderate_content,
    conversational_assistant,
    detect_trending_topics
)

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/generate', methods=['POST'])
@jwt_required()
def handle_generate_post():
    data = request.get_json() or {}
    topic = data.get('topic', '').strip()
    tone = data.get('tone', 'casual')
    target_length = data.get('length', 'medium')
    
    if not topic:
        return jsonify({"error": "Topic is required for post generation"}), 400
        
    result = generate_post(topic, tone, target_length)
    return jsonify(result), 200

@ai_bp.route('/improve', methods=['POST'])
@jwt_required()
def handle_improve_post():
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    target_tone = data.get('target_tone', 'professional')
    
    if not content:
        return jsonify({"error": "Post content is required"}), 400
        
    result = improve_post(content, target_tone)
    return jsonify(result), 200

@ai_bp.route('/summarize', methods=['POST'])
def handle_summarize():
    data = request.get_json() or {}
    post_text = data.get('post_text', '').strip()
    post_id = data.get('post_id')
    comments = []
    
    if post_id:
        db = get_db()
        post = db.posts.find_one({"_id": to_object_id(post_id)})
        if post and not post_text:
            post_text = post.get('content', '')
        comment_docs = list(db.comments.find({"post_id": str(post_id)}).limit(20))
        comments = [c.get('content', '') for c in comment_docs if c.get('content')]
        
    if not post_text and not comments:
        return jsonify({"error": "Post text or discussion comments are required"}), 400
        
    result = summarize_post(post_text, comments)
    return jsonify(result), 200

@ai_bp.route('/smart-replies', methods=['POST'])
def handle_smart_replies():
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"error": "Post content is required"}), 400
        
    replies = generate_smart_replies(content)
    return jsonify({"replies": replies}), 200

@ai_bp.route('/moderate', methods=['POST'])
def handle_moderate():
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"error": "Content is required"}), 400
        
    result = moderate_content(content)
    return jsonify(result), 200

@ai_bp.route('/chat', methods=['POST'])
@jwt_required(optional=True)
def handle_chat():
    data = request.get_json() or {}
    messages = data.get('messages', [])
    
    claims = get_jwt() or {}
    username = claims.get('username', 'Friend')
    
    if not messages:
        return jsonify({"error": "Messages array is required"}), 400
        
    result = conversational_assistant(messages, current_user=username)
    return jsonify(result), 200

@ai_bp.route('/trending-topics', methods=['GET'])
def handle_trending_topics():
    """Detects emerging viral topics across recent community posts."""
    db = get_db()
    recent_posts = list(db.posts.find({"is_flagged": {"$ne": True}}).sort('created_at', -1).limit(20))
    sample_texts = [p.get('content', '') for p in recent_posts if p.get('content')]
    
    result = detect_trending_topics(sample_texts)
    return jsonify(result), 200
