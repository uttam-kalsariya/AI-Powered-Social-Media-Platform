from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.models.helpers import serialize_doc

BADGES_CATALOG = [
    {
        "id": "first_flame",
        "name": "First Flame",
        "description": "Recorded your first day on Aura!",
        "icon": "🔥",
        "requirement_type": "streak",
        "requirement_value": 1,
        "xp_reward": 20
    },
    {
        "id": "on_fire",
        "name": "On Fire",
        "description": "Maintained a 3-day daily streak",
        "icon": "⚡",
        "requirement_type": "streak",
        "requirement_value": 3,
        "xp_reward": 50
    },
    {
        "id": "week_warrior",
        "name": "Week Warrior",
        "description": "Achieved a full 7-day active streak",
        "icon": "🛡️",
        "requirement_type": "streak",
        "requirement_value": 7,
        "xp_reward": 100
    },
    {
        "id": "biweekly_beast",
        "name": "Unstoppable",
        "description": "Blazed through a 14-day consecutive streak",
        "icon": "🌟",
        "requirement_type": "streak",
        "requirement_value": 14,
        "xp_reward": 250
    },
    {
        "id": "monthly_master",
        "name": "Streak Legend",
        "description": "Reached a legendary 30-day streak milestone",
        "icon": "👑",
        "requirement_type": "streak",
        "requirement_value": 30,
        "xp_reward": 500
    },
    {
        "id": "first_post",
        "name": "Debut Creator",
        "description": "Shared your very first post on the platform",
        "icon": "✍️",
        "requirement_type": "posts",
        "requirement_value": 1,
        "xp_reward": 25
    },
    {
        "id": "post_pro",
        "name": "Content Maven",
        "description": "Created 5 inspiring posts",
        "icon": "🎨",
        "requirement_type": "posts",
        "requirement_value": 5,
        "xp_reward": 75
    },
    {
        "id": "community_spark",
        "name": "Discussion Starter",
        "description": "Contributed 5 meaningful comments to community posts",
        "icon": "💬",
        "requirement_type": "comments",
        "requirement_value": 5,
        "xp_reward": 50
    },
    {
        "id": "century_club",
        "name": "Century Club",
        "description": "Earned your first 100 XP points",
        "icon": "💎",
        "requirement_type": "xp",
        "requirement_value": 100,
        "xp_reward": 30
    },
    {
        "id": "aura_champion",
        "name": "Aura Champion",
        "description": "Earned 500 XP and unlocked elite status",
        "icon": "🏆",
        "requirement_type": "xp",
        "requirement_value": 500,
        "xp_reward": 150
    }
]

LEVEL_THRESHOLDS = [
    {"level": 1, "title": "Novice Explorer", "min_xp": 0, "max_xp": 100},
    {"level": 2, "title": "Active Spark", "min_xp": 100, "max_xp": 300},
    {"level": 3, "title": "Engaged Contributor", "min_xp": 300, "max_xp": 700},
    {"level": 4, "title": "Trailblazer", "min_xp": 700, "max_xp": 1500},
    {"level": 5, "title": "Aura Legend", "min_xp": 1500, "max_xp": 999999}
]

def calculate_level_info(xp: int) -> Dict[str, Any]:
    """Calculates user level, current tier title, and XP progress toward next level."""
    current_tier = LEVEL_THRESHOLDS[0]
    next_tier = LEVEL_THRESHOLDS[1]
    
    for i, tier in enumerate(LEVEL_THRESHOLDS):
        if xp >= tier["min_xp"]:
            current_tier = tier
            next_tier = LEVEL_THRESHOLDS[i + 1] if i + 1 < len(LEVEL_THRESHOLDS) else None

    if next_tier:
        xp_in_level = xp - current_tier["min_xp"]
        xp_needed = next_tier["min_xp"] - current_tier["min_xp"]
        progress_percentage = min(100, int((xp_in_level / xp_needed) * 100))
        xp_to_next = next_tier["min_xp"] - xp
    else:
        progress_percentage = 100
        xp_to_next = 0

    return {
        "level": current_tier["level"],
        "title": current_tier["title"],
        "current_xp": xp,
        "next_level_xp": next_tier["min_xp"] if next_tier else current_tier["max_xp"],
        "xp_to_next_level": max(0, xp_to_next),
        "progress_percentage": progress_percentage
    }

def build_streak_document(user_id: str, username: str) -> Dict[str, Any]:
    """Builds a normalized, production-grade streak document for a user."""
    now = datetime.now(timezone.utc)
    return {
        "user_id": str(user_id),
        "username": username.strip().lower(),
        "current_streak": 0,
        "longest_streak": 0,
        "total_active_days": 0,
        "xp": 0,
        "level": 1,
        "level_title": "Novice Explorer",
        "last_activity_date": None,        # Format: YYYY-MM-DD
        "last_activity_at": None,          # UTC timestamp
        "today_activities": {
            "login": False,
            "post_created": False,
            "comment_created": False,
            "checkin_claimed": False
        },
        "stats": {
            "posts_count": 0,
            "comments_count": 0,
            "logins_count": 0
        },
        "weekly_progress": {
            "mon": False,
            "tue": False,
            "wed": False,
            "thu": False,
            "fri": False,
            "sat": False,
            "sun": False
        },
        "unlocked_badges": [],
        "active_dates": [],                 # List of active date strings 'YYYY-MM-DD' (last 365 days)
        "freeze_credits": 1,                # Monthly streak freeze allowance
        "created_at": now,
        "updated_at": now
    }

