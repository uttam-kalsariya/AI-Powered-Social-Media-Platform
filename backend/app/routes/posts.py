from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id
from app.services.ai_service import moderate_content
from app.services.social_service import (
    toggle_save_post,
    get_saved_posts,
    get_saved_collections,
    get_trending_hashtags,
    get_explore_feed,
    get_following_ids,
    is_following
)

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

@posts_bp.route('', methods=['GET'])
def get_feed():
    """
    Retrieve social media feed with author details, like counts, and comments count.
    Supports ?tag=... , ?author_id=... , and ?filter=following (custom feed for followed creators).
    """
    db = get_db()
    tag = request.args.get('tag')
    author_id = request.args.get('author_id')
    feed_filter = request.args.get('filter')
    
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    query = {}
    if tag:
        query['tags'] = tag.lower().replace('#', '').strip()
    if author_id:
        query['author_id'] = author_id

    # Filter: Following (posts only from followed creators)
    if feed_filter == 'following':
        if not current_user_id:
            return jsonify({"posts": [], "message": "Sign in to view your following feed"}), 200
        following_ids = get_following_ids(current_user_id)
        # Include current user's own posts and followed creators
        allowed_authors = list(set(following_ids + [str(current_user_id)]))
        query['author_id'] = {"$in": allowed_authors}

    posts = list(db.posts.find(query).sort('created_at', -1).limit(50))
    
    # Enrich with is_saved & is_author_followed
    saved_set = set()
    following_set = set()
    if current_user_id:
        saved_cursor = db.saved_posts.find({"user_id": str(current_user_id)})
        saved_set = {r["post_id"] for r in saved_cursor}
        following_set = set(get_following_ids(current_user_id))

    enriched = []
    for p in posts:
        pid = str(p["_id"])
        item = serialize_doc(p)
        item["is_saved"] = pid in saved_set
        item["is_author_followed"] = p.get("author_id") in following_set
        enriched.append(item)

    return jsonify({"posts": enriched}), 200

@posts_bp.route('/explore', methods=['GET'])
def explore():
    """
    Discovery hub endpoint: returns trending posts, hashtag analytics, and suggested creators.
    Supports ?q=... (search query) and ?tag=...
    """
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    query = request.args.get('q')
    tag = request.args.get('tag')
    limit = min(60, max(1, int(request.args.get('limit', 30))))

    data = get_explore_feed(current_user_id, query=query, tag=tag, limit=limit)
    return jsonify(data), 200

@posts_bp.route('/trending/hashtags', methods=['GET'])
def trending_tags():
    """Retrieves real-time trending hashtags aggregated across all community posts."""
    limit = min(50, max(1, int(request.args.get('limit', 10))))
    hashtags = get_trending_hashtags(limit=limit)
    return jsonify({"hashtags": hashtags}), 200

@posts_bp.route('/saved', methods=['GET'])
@jwt_required()
def list_saved():
    """Returns posts bookmarked by the authenticated user."""
    user_id = get_jwt_identity()
    collection_name = request.args.get('collection')
    posts = get_saved_posts(user_id, collection_name=collection_name)
    return jsonify({"posts": posts, "count": len(posts)}), 200

@posts_bp.route('/saved/collections', methods=['GET'])
@jwt_required()
def list_collections():
    """Returns all collection folders and bookmark counts for the user."""
    user_id = get_jwt_identity()
    collections = get_saved_collections(user_id)
    return jsonify({"collections": collections}), 200

@posts_bp.route('/<post_id>/save', methods=['POST'])
@jwt_required()
def toggle_save(post_id):
    """Toggles bookmarking/saving a post into a collection."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    collection_name = data.get('collection_name', 'All Saved')
    try:
        result = toggle_save_post(user_id, post_id, collection_name=collection_name)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@posts_bp.route('/<post_id>', methods=['GET'])
def get_post(post_id):
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        return jsonify({"error": "Post not found"}), 404
        
    comments = list(db.comments.find({"post_id": post_id}).sort('created_at', 1))
    
    current_user_id = None
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    post_data = serialize_doc(post)
    if current_user_id:
        post_data["is_saved"] = db.saved_posts.count_documents({"user_id": str(current_user_id), "post_id": post_id}) > 0
        post_data["is_author_followed"] = is_following(current_user_id, post.get("author_id", ""))

    return jsonify({
        "post": post_data,
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
        "likes": [],
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
    
    # Record streak activity for post creation
    streak_result = None
    try:
        from app.services.streak_service import record_activity
        streak_result = record_activity(str(user_id), 'post')
    except Exception:
        pass
        
    res_payload = {
        "message": "Post created successfully",
        "post": serialize_doc(post_doc),
        "moderation_notice": moderation if moderation.get('flagged') else None
    }
    if streak_result:
        res_payload["streak_info"] = {
            "current_streak": streak_result.get("current_streak", 0),
            "xp_gained": streak_result.get("xp_gained", 0),
            "streak_increased": streak_result.get("streak_increased", False),
            "new_badges": streak_result.get("new_badges", [])
        }
    return jsonify(res_payload), 201

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
    db.saved_posts.delete_many({"post_id": post_id})
    
    return jsonify({"message": "Post and associated data deleted successfully"}), 200

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
    liked = False
    
    if user_id in likes:
        likes.remove(user_id)
        liked = False
    else:
        likes.append(user_id)
        liked = True
        if post.get('author_id') != user_id:
            db.notifications.insert_one({
                "recipient_id": post.get('author_id'),
                "sender_id": user_id,
                "sender_name": username,
                "type": "like",
                "message": f"{username} liked your post",
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
    
    try:
        from app.services.streak_service import record_activity
        record_activity(str(user_id), 'comment')
    except Exception:
        pass
        
    db.posts.update_one({"_id": post['_id']}, {"$inc": {"comments_count": 1}})
    
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
