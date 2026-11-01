import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id

logger = logging.getLogger(__name__)

# ============================================================================
# 1. FOLLOW / UNFOLLOW & NETWORK GRAPH
# ============================================================================

def toggle_follow_user(follower_id: str, target_user_id: str) -> Dict[str, Any]:
    """
    Toggles follow/unfollow between follower and target user.
    Maintains cached follower/following counts on user documents and dispatches notifications.
    """
    db = get_db()
    if str(follower_id) == str(target_user_id):
        raise ValueError("Users cannot follow themselves")

    follower = db.users.find_one({"_id": to_object_id(follower_id)})
    target_user = db.users.find_one({"_id": to_object_id(target_user_id)})
    if not target_user:
        raise ValueError("User not found")

    existing_follow = db.follows.find_one({
        "follower_id": str(follower_id),
        "followed_id": str(target_user_id)
    })

    now = datetime.now(timezone.utc)
    is_following = False

    if existing_follow:
        # Unfollow
        db.follows.delete_one({"_id": existing_follow["_id"]})
        db.users.update_one({"_id": to_object_id(target_user_id)}, {"$inc": {"followers_count": -1}})
        db.users.update_one({"_id": to_object_id(follower_id)}, {"$inc": {"following_count": -1}})
        is_following = False
    else:
        # Follow
        db.follows.insert_one({
            "follower_id": str(follower_id),
            "followed_id": str(target_user_id),
            "created_at": now
        })
        db.users.update_one({"_id": to_object_id(target_user_id)}, {"$inc": {"followers_count": 1}})
        db.users.update_one({"_id": to_object_id(follower_id)}, {"$inc": {"following_count": 1}})
        is_following = True

        # Send notification to target user
        follower_username = follower.get("username", "Someone") if follower else "Someone"
        db.notifications.insert_one({
            "recipient_id": str(target_user_id),
            "sender_id": str(follower_id),
            "sender_name": follower_username,
            "type": "follow",
            "message": f"@{follower_username} started following you!",
            "is_read": False,
            "created_at": now
        })

    # Retrieve refreshed counts
    updated_target = db.users.find_one({"_id": to_object_id(target_user_id)})
    updated_follower = db.users.find_one({"_id": to_object_id(follower_id)})

    return {
        "following": is_following,
        "target_user_id": str(target_user_id),
        "followers_count": max(0, updated_target.get("followers_count", 0)),
        "following_count": max(0, updated_follower.get("following_count", 0))
    }

def is_following(follower_id: Optional[str], target_user_id: str) -> bool:
    """Checks if follower_id is actively following target_user_id."""
    if not follower_id:
        return False
    db = get_db()
    return db.follows.count_documents({
        "follower_id": str(follower_id),
        "followed_id": str(target_user_id)
    }) > 0

def get_following_ids(user_id: str) -> List[str]:
    """Returns list of user IDs that user_id follows."""
    db = get_db()
    cursor = db.follows.find({"follower_id": str(user_id)})
    return [doc["followed_id"] for doc in cursor]

def get_followers(user_id: str, current_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves list of users who follow user_id with profile info and follow status."""
    db = get_db()
    follows = list(db.follows.find({"followed_id": str(user_id)}).sort("created_at", -1))
    results = []
    for f in follows:
        user = db.users.find_one({"_id": to_object_id(f["follower_id"])})
        if user:
            results.append({
                "id": str(user["_id"]),
                "username": user.get("username"),
                "full_name": user.get("full_name", user.get("username")),
                "avatar": user.get("avatar", ""),
                "bio": user.get("bio", ""),
                "role": user.get("role", "user"),
                "is_following": is_following(current_user_id, str(user["_id"])) if current_user_id else False
            })
    return results

def get_following(user_id: str, current_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves list of users whom user_id follows."""
    db = get_db()
    follows = list(db.follows.find({"follower_id": str(user_id)}).sort("created_at", -1))
    results = []
    for f in follows:
        user = db.users.find_one({"_id": to_object_id(f["followed_id"])})
        if user:
            results.append({
                "id": str(user["_id"]),
                "username": user.get("username"),
                "full_name": user.get("full_name", user.get("username")),
                "avatar": user.get("avatar", ""),
                "bio": user.get("bio", ""),
                "role": user.get("role", "user"),
                "is_following": is_following(current_user_id, str(user["_id"])) if current_user_id else True
            })
    return results

def get_suggested_creators(user_id: Optional[str], limit: int = 5) -> List[Dict[str, Any]]:
    """Recommends active platform creators that the user does not currently follow."""
    db = get_db()
    exclude_ids = [str(user_id)] if user_id else []
    if user_id:
        following_ids = get_following_ids(user_id)
        exclude_ids.extend(following_ids)

    query = {}
    if exclude_ids:
        query["_id"] = {"$nin": [to_object_id(uid) for uid in exclude_ids if to_object_id(uid) is not None]}

    candidates = list(db.users.find(query).sort([("followers_count", -1), ("last_login", -1)]).limit(limit))
    return [{
        "id": str(u["_id"]),
        "username": u.get("username"),
        "full_name": u.get("full_name", u.get("username")),
        "avatar": u.get("avatar", ""),
        "bio": u.get("bio", ""),
        "role": u.get("role", "user"),
        "followers_count": u.get("followers_count", 0),
        "is_following": False
    } for u in candidates]

# ============================================================================
# 2. SAVED POSTS, BOOKMARKS & COLLECTIONS
# ============================================================================

DEFAULT_COLLECTION = "All Saved"

def toggle_save_post(user_id: str, post_id: str, collection_name: str = DEFAULT_COLLECTION) -> Dict[str, Any]:
    """Toggles saving a post for the authenticated user and manages collections."""
    db = get_db()
    post = db.posts.find_one({"_id": to_object_id(post_id)})
    if not post:
        raise ValueError("Post not found")

    clean_coll = collection_name.strip() or DEFAULT_COLLECTION
    existing = db.saved_posts.find_one({
        "user_id": str(user_id),
        "post_id": str(post_id)
    })

    if existing:
        db.saved_posts.delete_one({"_id": existing["_id"]})
        return {
            "saved": False,
            "post_id": str(post_id),
            "collection_name": clean_coll,
            "message": "Post removed from your saved collection"
        }
    else:
        db.saved_posts.insert_one({
            "user_id": str(user_id),
            "post_id": str(post_id),
            "collection_name": clean_coll,
            "created_at": datetime.now(timezone.utc)
        })
        return {
            "saved": True,
            "post_id": str(post_id),
            "collection_name": clean_coll,
            "message": f"Post saved to '{clean_coll}'"
        }

def is_post_saved(user_id: Optional[str], post_id: str) -> bool:
    """Checks if a post is saved by user."""
    if not user_id:
        return False
    db = get_db()
    return db.saved_posts.count_documents({
        "user_id": str(user_id),
        "post_id": str(post_id)
    }) > 0

def get_saved_posts(user_id: str, collection_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all posts saved by the user with their collection tags."""
    db = get_db()
    query = {"user_id": str(user_id)}
    if collection_name and collection_name != DEFAULT_COLLECTION:
        query["collection_name"] = collection_name

    saved_records = list(db.saved_posts.find(query).sort("created_at", -1))
    posts_map = {r["post_id"]: r["collection_name"] for r in saved_records}

    post_object_ids = [to_object_id(pid) for pid in posts_map.keys() if to_object_id(pid) is not None]
    raw_posts = list(db.posts.find({"_id": {"$in": post_object_ids}}))

    serialized = []
    for p in raw_posts:
        pid = str(p["_id"])
        item = serialize_doc(p)
        item["is_saved"] = True
        item["saved_collection"] = posts_map.get(pid, DEFAULT_COLLECTION)
        serialized.append(item)

    # Sort in the order saved
    post_order = {pid: i for i, pid in enumerate(posts_map.keys())}
    serialized.sort(key=lambda x: post_order.get(x["id"] or x["_id"], 999999))
    return serialized

def get_saved_collections(user_id: str) -> List[Dict[str, Any]]:
    """Returns list of distinct collection folders with counts for the user."""
    db = get_db()
    saved = list(db.saved_posts.find({"user_id": str(user_id)}))
    total_count = len(saved)

    counts = {DEFAULT_COLLECTION: total_count}
    for item in saved:
        cname = item.get("collection_name", DEFAULT_COLLECTION)
        if cname != DEFAULT_COLLECTION:
            counts[cname] = counts.get(cname, 0) + 1

    return [{"name": name, "count": count} for name, count in sorted(counts.items())]

# ============================================================================
# 3. DYNAMIC TRENDING TOPICS & HASHTAG ANALYTICS
# ============================================================================

def get_trending_hashtags(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Aggregates real hashtags from posts in the database,
    calculating frequency, like velocity, and comment engagement.
    """
    db = get_db()
    posts = list(db.posts.find({"is_flagged": {"$ne": True}}).sort("created_at", -1).limit(100))

    tag_stats = {}
    for p in posts:
        tags = p.get("tags", [])
        likes = p.get("likes_count", 0)
        comments = p.get("comments_count", 0)
        score = 1 + (likes * 2) + (comments * 3)

        for t in tags:
            tag_clean = t.strip().lower().replace("#", "")
            if not tag_clean:
                continue
            if tag_clean not in tag_stats:
                tag_stats[tag_clean] = {
                    "tag": tag_clean,
                    "posts_count": 0,
                    "likes_sum": 0,
                    "comments_sum": 0,
                    "score": 0
                }
            tag_stats[tag_clean]["posts_count"] += 1
            tag_stats[tag_clean]["likes_sum"] += likes
            tag_stats[tag_clean]["comments_sum"] += comments
            tag_stats[tag_clean]["score"] += score

    # Sort descending by engagement score
    sorted_tags = sorted(tag_stats.values(), key=lambda x: x["score"], reverse=True)

    # Provide default popular tech tags if newly seeded
    if len(sorted_tags) < 5:
        defaults = ["ai", "innovation", "tech", "buildinpublic", "socialmedia", "creativity"]
        for d in defaults:
            if not any(st["tag"] == d for st in sorted_tags):
                sorted_tags.append({
                    "tag": d,
                    "posts_count": 1,
                    "likes_sum": 5,
                    "comments_sum": 2,
                    "score": 15
                })

    return sorted_tags[:limit]

# ============================================================================
# 4. EXPLORE FEED & PERSONALIZED RECOMMENDATIONS
# ============================================================================

def get_explore_feed(
    user_id: Optional[str] = None,
    query: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 40
) -> Dict[str, Any]:
    """
    Multi-faceted content discovery endpoint returning trending posts,
    searched posts, top creators, and trending tags.
    """
    db = get_db()
    db_query: Dict[str, Any] = {"is_flagged": {"$ne": True}}

    if tag:
        db_query["tags"] = tag.strip().lower().replace("#", "")

    if query:
        q_term = query.strip()
        db_query["$or"] = [
            {"content": {"$regex": q_term, "$options": "i"}},
            {"author_name": {"$regex": q_term, "$options": "i"}},
            {"tags": {"$in": [q_term.lower().replace("#", "")]}}
        ]

    posts = list(db.posts.find(db_query).sort([("likes_count", -1), ("created_at", -1)]).limit(limit))

    # Mark is_saved and is_following for requester
    following_set = set(get_following_ids(user_id)) if user_id else set()
    saved_posts_set = set()
    if user_id:
        saved_cursor = db.saved_posts.find({"user_id": str(user_id)})
        saved_posts_set = {r["post_id"] for r in saved_cursor}

    enriched_posts = []
    for p in posts:
        pid = str(p["_id"])
        item = serialize_doc(p)
        item["is_saved"] = pid in saved_posts_set
        item["is_author_followed"] = p.get("author_id") in following_set
        enriched_posts.append(item)

    trending_tags = get_trending_hashtags(limit=8)
    suggested_creators = get_suggested_creators(user_id, limit=4)

    return {
        "posts": enriched_posts,
        "total": len(enriched_posts),
        "trending_hashtags": trending_tags,
        "suggested_creators": suggested_creators
    }

