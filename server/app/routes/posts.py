from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id
from app.services.ai_service import moderate_content

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

@posts_bp.route('', methods=['GET'])
def get_feed():
    """Retrieve social media feed with author details, like counts, and comments count."""
    db = get_db()
    tag = request.args.get('tag')
    author_id = request.args.get('author_id')
    
    query = {}
    if tag:
        query['tags'] = tag.lower()
    if author_id:
        query['author_id'] = author_id
        
    posts = list(db.posts.find(query).sort('created_at', -1).limit(50))
    return jsonify({"posts": serialize_doc(posts)}), 200

@posts_bp.route('/<post_id>', methods=['GET'])
def get_post(post_id):
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        return jsonify({"error": "Post not found"}), 404
        
    comments = list(db.comments.find({"post_id": post_id}).sort('created_at', 1))
    return jsonify({
        "post": serialize_doc(post),
        "comments": serialize_doc(comments)
    }), 200

@posts_bp.route('', methods=['POST'])
@jwt_required()
def create_post():
    user_id = get_jwt_identity()
    claims = get_jwt()
    data = request.get_json() or {}
    
    content = data.get('content', '').strip()
    image_url = data.get('image_url', '').strip()
    tags = data.get('tags', [])
    
    if not content:
        return jsonify({"error": "Post content is required"}), 400
        
    db = get_db()
    user = db.users.find_one({"_id": to_object_id(user_id)})
    username = user.get('username') if user else claims.get('username', 'Anonymous')
    avatar = user.get('avatar') if user else ''
    
    # AI Content Moderation Check
    moderation = moderate_content(content)
    
    post_doc = {
        "author_id": str(user_id),
        "author_name": username,
        "author_avatar": avatar,
        "content": content,
        "image_url": image_url or None,
        "tags": [t.lower().strip('# ') for t in tags if t.strip()],
        "likes": [],  # List of user IDs who liked
        "likes_count": 0,
        "comments_count": 0,
        "is_flagged": moderation.get('flagged', False),
        "toxicity_score": moderation.get('toxicity_score', 0.0),
        "moderation_reason": moderation.get('reason', ''),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = db.posts.insert_one(post_doc)
    post_doc['_id'] = result.inserted_id
    
    return jsonify({
        "message": "Post created successfully",
        "post": serialize_doc(post_doc),
        "moderation_notice": moderation if moderation.get('flagged') else None
    }), 201

@posts_bp.route('/<post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'user')
    data = request.get_json() or {}
    
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        return jsonify({"error": "Post not found"}), 404
        
    # Check permissions: owner or admin
    if post.get('author_id') != user_id and role != 'admin':
        return jsonify({"error": "Permission denied"}), 403
        
    content = data.get('content', '').strip()
    if not content:
        return jsonify({"error": "Content cannot be empty"}), 400
        
    moderation = moderate_content(content)
    
    update_data = {
        "content": content,
        "image_url": data.get('image_url', post.get('image_url')),
        "is_flagged": moderation.get('flagged', False),
        "toxicity_score": moderation.get('toxicity_score', 0.0),
        "moderation_reason": moderation.get('reason', ''),
        "updated_at": datetime.now(timezone.utc)
    }
    
    if 'tags' in data:
        update_data['tags'] = [t.lower().strip('# ') for t in data['tags'] if t.strip()]
        
    db.posts.update_one({"_id": post['_id']}, {"$set": update_data})
    updated_post = db.posts.find_one({"_id": post['_id']})
    
    return jsonify({
        "message": "Post updated successfully",
        "post": serialize_doc(updated_post)
    }), 200

@posts_bp.route('/<post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'user')
    
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        return jsonify({"error": "Post not found"}), 404
        
    if post.get('author_id') != user_id and role != 'admin':
        return jsonify({"error": "Permission denied"}), 403
        
    db.posts.delete_one({"_id": post['_id']})
    db.comments.delete_many({"post_id": post_id})
    
    return jsonify({"message": "Post and associated comments deleted successfully"}), 200

@posts_bp.route('/<post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    user_id = str(get_jwt_identity())
    claims = get_jwt()
    username = claims.get('username', 'Someone')
    
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        return jsonify({"error": "Post not found"}), 404
        
    likes = post.get('likes', [])
    if user_id in likes:
        likes.remove(user_id)
        liked = False
    else:
        likes.append(user_id)
        liked = True
        
        # Create notification if user is not the post author
        if post.get('author_id') != user_id:
            db.notifications.insert_one({
                "recipient_id": post.get('author_id'),
                "sender_id": user_id,
                "sender_name": username,
                "type": "like",
                "message": f"{username} liked your post: '{post.get('content', '')[:30]}...'",
                "post_id": post_id,
                "is_read": False,
                "created_at": datetime.now(timezone.utc)
            })
            
    db.posts.update_one(
        {"_id": post['_id']},
        {"$set": {"likes": likes, "likes_count": len(likes)}}
    )
    
    return jsonify({
        "liked": liked,
        "likes_count": len(likes)
    }), 200

@posts_bp.route('/<post_id>/comments', methods=['GET'])
def get_comments(post_id):
    db = get_db()
    comments = list(db.comments.find({"post_id": post_id}).sort('created_at', 1))
    return jsonify({"comments": serialize_doc(comments)}), 200

@posts_bp.route('/<post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    user_id = str(get_jwt_identity())
    claims = get_jwt()
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"error": "Comment cannot be empty"}), 400
        
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        return jsonify({"error": "Post not found"}), 404
        
    user = db.users.find_one({"_id": to_object_id(user_id)})
    username = user.get('username') if user else claims.get('username', 'Anonymous')
    avatar = user.get('avatar') if user else ''
    
    comment_doc = {
        "post_id": post_id,
        "author_id": user_id,
        "author_name": username,
        "author_avatar": avatar,
        "content": content,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = db.comments.insert_one(comment_doc)
    comment_doc['_id'] = result.inserted_id
    
    # Increment post comment count
    db.posts.update_one({"_id": post['_id']}, {"$inc": {"comments_count": 1}})
    
    # Notify author if different user
    if post.get('author_id') != user_id:
        db.notifications.insert_one({
            "recipient_id": post.get('author_id'),
            "sender_id": user_id,
            "sender_name": username,
            "type": "comment",
            "message": f"{username} commented on your post: '{content[:40]}...'",
            "post_id": post_id,
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        })
        
    return jsonify({
        "message": "Comment added",
        "comment": serialize_doc(comment_doc)
    }), 201

@posts_bp.route('/<post_id>/comments/<comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(post_id, comment_id):
    user_id = str(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role', 'user')
    
    db = get_db()
    comment = db.comments.find_one({"_id": to_object_id(comment_id)})
    if not comment:
        return jsonify({"error": "Comment not found"}), 404
        
    if comment.get('author_id') != user_id and role != 'admin':
        return jsonify({"error": "Permission denied"}), 403
        
    db.comments.delete_one({"_id": comment['_id']})
    db.posts.update_one({"_id": to_object_id(post_id)}, {"$inc": {"comments_count": -1}})
    
    return jsonify({"message": "Comment deleted successfully"}), 200
