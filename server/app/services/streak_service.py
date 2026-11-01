import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from app.db import get_db
from app.models.helpers import serialize_doc, to_object_id
from app.models.streak_model import (
    BADGES_CATALOG,
    build_streak_document,
    calculate_level_info
)

logger = logging.getLogger(__name__)

XP_REWARDS = {
    "login": 10,
    "checkin": 15,
    "post": 25,
    "comment": 15,
    "streak_7_bonus": 50,
    "streak_14_bonus": 100,
    "streak_30_bonus": 250
}

DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

def _get_current_week_dates() -> Dict[str, str]:
    """Returns mapping of weekday key ('mon'..'sun') to ISO date string 'YYYY-MM-DD' for current week."""
    today = datetime.now(timezone.utc).date()
    # Monday is 0, Sunday is 6
    start_of_week = today - timedelta(days=today.weekday())
    result = {}
    for i, key in enumerate(DAY_KEYS):
        day_date = start_of_week + timedelta(days=i)
        result[key] = day_date.strftime('%Y-%m-%d')
    return result

def _compute_weekly_progress(active_dates: List[str]) -> Dict[str, bool]:
    """Computes completion status for Monday..Sunday of the current week."""
    week_dates = _get_current_week_dates()
    active_set = set(active_dates)
    return {k: (date_str in active_set) for k, date_str in week_dates.items()}

def get_or_create_streak(user_id: str, username: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetches user's streak document or creates an initialized one if not found.
    Checks and handles lapsed streaks (if more than 1 day missed).
    """
    db = get_db()
    streak = db.streaks.find_one({"user_id": str(user_id)})
    
    now = datetime.now(timezone.utc)
    today_str = now.strftime('%Y-%m-%d')
    yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    if not streak:
        # If username not passed, query user document
        if not username:
            user = db.users.find_one({"_id": to_object_id(user_id)})
            username = user.get('username', 'user') if user else 'user'
            
        doc = build_streak_document(user_id, username)
        db.streaks.insert_one(doc)
        streak = doc
    else:
        # Check if the streak is broken due to inactivity
        last_date = streak.get('last_activity_date')
        needs_update = False
        update_set = {}
        
        # If user has not been active today or yesterday, active streak drops to 0 (broken)
        if last_date and last_date != today_str and last_date != yesterday_str:
            if streak.get('current_streak', 0) > 0:
                update_set['current_streak'] = 0
                needs_update = True
        
        # If today is a new calendar day, reset today's activity checklist
        if last_date != today_str:
            update_set['today_activities'] = {
                "login": False,
                "post_created": False,
                "comment_created": False,
                "checkin_claimed": False
            }
            needs_update = True
            
        # Ensure weekly progress is kept current
        active_dates = streak.get('active_dates', [])
        computed_weekly = _compute_weekly_progress(active_dates)
        if computed_weekly != streak.get('weekly_progress'):
            update_set['weekly_progress'] = computed_weekly
            needs_update = True

        if needs_update:
            update_set['updated_at'] = now
            db.streaks.update_one({"_id": streak['_id']}, {"$set": update_set})
            streak.update(update_set)

    # Calculate dynamic level progress
    level_info = calculate_level_info(streak.get('xp', 0))
    streak['level_info'] = level_info
    streak['level'] = level_info['level']
    streak['level_title'] = level_info['title']
    
    return streak

def check_badge_unlocks(streak_doc: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], int]:
    """
    Evaluates streak, post count, comment count, and XP against BADGES_CATALOG.
    Returns (newly_unlocked_badges, bonus_xp_from_badges).
    """
    existing_badge_ids = {b['id'] for b in streak_doc.get('unlocked_badges', [])}
    newly_unlocked = []
    bonus_xp = 0
    now = datetime.now(timezone.utc)
    
    current_streak = streak_doc.get('current_streak', 0)
    longest_streak = streak_doc.get('longest_streak', 0)
    max_streak_achieved = max(current_streak, longest_streak)
    xp = streak_doc.get('xp', 0)
    stats = streak_doc.get('stats', {})
    posts_count = stats.get('posts_count', 0)
    comments_count = stats.get('comments_count', 0)
    
    for badge in BADGES_CATALOG:
        if badge['id'] in existing_badge_ids:
            continue
            
        unlocked = False
        req_type = badge['requirement_type']
        req_val = badge['requirement_value']
        
        if req_type == 'streak' and max_streak_achieved >= req_val:
            unlocked = True
        elif req_type == 'posts' and posts_count >= req_val:
            unlocked = True
        elif req_type == 'comments' and comments_count >= req_val:
            unlocked = True
        elif req_type == 'xp' and xp >= req_val:
            unlocked = True
            
        if unlocked:
            awarded = {
                "id": badge['id'],
                "name": badge['name'],
                "description": badge['description'],
                "icon": badge['icon'],
                "xp_reward": badge['xp_reward'],
                "unlocked_at": now.isoformat()
            }
            newly_unlocked.append(awarded)
            bonus_xp += badge['xp_reward']
            
    return newly_unlocked, bonus_xp

def record_activity(user_id: str, activity_type: str) -> Dict[str, Any]:
    """
    Records an activity ('login', 'post', 'comment', 'checkin') for a user.
    Maintains daily streaks, awards XP, unlocks badges, and refreshes calendar.
    """
    db = get_db()
    streak = get_or_create_streak(user_id)
    now = datetime.now(timezone.utc)
    today_str = now.strftime('%Y-%m-%d')
    yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    last_date = streak.get('last_activity_date')
    current_streak = streak.get('current_streak', 0)
    longest_streak = streak.get('longest_streak', 0)
    total_active_days = streak.get('total_active_days', 0)
    active_dates = list(streak.get('active_dates', []))
    today_activities = dict(streak.get('today_activities', {}))
    stats = dict(streak.get('stats', {}))
    xp = streak.get('xp', 0)
    
    xp_gained = 0
    streak_increased = False
    streak_reset = False
    milestone_bonus = 0
    milestone_name = None
    
    # 1. Update activity stats
    if activity_type == 'post':
        stats['posts_count'] = stats.get('posts_count', 0) + 1
        today_activities['post_created'] = True
    elif activity_type == 'comment':
        stats['comments_count'] = stats.get('comments_count', 0) + 1
        today_activities['comment_created'] = True
    elif activity_type == 'login':
        stats['logins_count'] = stats.get('logins_count', 0) + 1
        today_activities['login'] = True
    elif activity_type == 'checkin':
        today_activities['checkin_claimed'] = True
        
    # Award base XP for this activity if not already completed today
    base_reward = XP_REWARDS.get(activity_type, 10)
    xp_gained += base_reward

    # 2. Daily Streak Evaluation
    if last_date == today_str:
        # Already checked in for today, keep streak as is
        streak_increased = False
    elif last_date == yesterday_str:
        # Consecutive day: increment streak!
        current_streak += 1
        total_active_days += 1
        streak_increased = True
        if today_str not in active_dates:
            active_dates.append(today_str)
            
        # Check weekly/monthly milestone bonuses
        if current_streak == 7:
            milestone_bonus = XP_REWARDS['streak_7_bonus']
            milestone_name = "7-Day Week Milestone (+50 XP)"
        elif current_streak == 14:
            milestone_bonus = XP_REWARDS['streak_14_bonus']
            milestone_name = "14-Day Biweekly Milestone (+100 XP)"
        elif current_streak == 30:
            milestone_bonus = XP_REWARDS['streak_30_bonus']
            milestone_name = "30-Day Monthly Legend (+250 XP)"
    else:
        # Missed 1+ days or first time: reset streak to 1
        current_streak = 1
        total_active_days += 1
        streak_reset = (last_date is not None)
        streak_increased = True
        if today_str not in active_dates:
            active_dates.append(today_str)

    longest_streak = max(longest_streak, current_streak)
    xp_gained += milestone_bonus
    xp += xp_gained
    
    # Keep active_dates bounded to last 365 entries
    if len(active_dates) > 365:
        active_dates = active_dates[-365:]

    # 3. Badge evaluation
    streak['current_streak'] = current_streak
    streak['longest_streak'] = longest_streak
    streak['xp'] = xp
    streak['stats'] = stats
    
    newly_unlocked, badge_bonus_xp = check_badge_unlocks(streak)
    if badge_bonus_xp > 0:
        xp += badge_bonus_xp
        xp_gained += badge_bonus_xp

    unlocked_badges = list(streak.get('unlocked_badges', [])) + newly_unlocked
    level_info = calculate_level_info(xp)
    weekly_progress = _compute_weekly_progress(active_dates)
    
    # 4. Atomic MongoDB update
    update_doc = {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_active_days": total_active_days,
        "last_activity_date": today_str,
        "last_activity_at": now,
        "today_activities": today_activities,
        "stats": stats,
        "xp": xp,
        "level": level_info['level'],
        "level_title": level_info['title'],
        "weekly_progress": weekly_progress,
        "unlocked_badges": unlocked_badges,
        "active_dates": active_dates,
        "updated_at": now
    }
    
    db.streaks.update_one({"user_id": str(user_id)}, {"$set": update_doc})
    
    # Also update user document with cached streak & XP for quick profile display
    db.users.update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {
            "current_streak": current_streak,
            "xp": xp,
            "level": level_info['level']
        }}
    )
    
    streak.update(update_doc)
    streak['level_info'] = level_info
    
    return {
        "streak": serialize_doc(streak),
        "xp_gained": xp_gained,
        "current_streak": current_streak,
        "streak_increased": streak_increased,
        "streak_reset": streak_reset,
        "milestone_reached": milestone_name,
        "new_badges": newly_unlocked,
        "today_activities": today_activities
    }

def get_leaderboard(limit: int = 10) -> List[Dict[str, Any]]:
    """Retrieves top community members sorted by current streak and XP."""
    db = get_db()
    cursor = db.streaks.find().sort([("current_streak", -1), ("xp", -1)]).limit(limit)
    raw_list = list(cursor)
    
    # Enrich with user avatar and full name
    leaderboard = []
    for rank, entry in enumerate(raw_list, start=1):
        user = db.users.find_one({"_id": to_object_id(entry.get('user_id'))})
        leaderboard.append({
            "rank": rank,
            "user_id": entry.get('user_id'),
            "username": entry.get('username'),
            "full_name": user.get('full_name', entry.get('username')) if user else entry.get('username'),
            "avatar": user.get('avatar', '') if user else '',
            "current_streak": entry.get('current_streak', 0),
            "longest_streak": entry.get('longest_streak', 0),
            "xp": entry.get('xp', 0),
            "level": entry.get('level', 1),
            "level_title": entry.get('level_title', 'Novice Explorer'),
            "badges_count": len(entry.get('unlocked_badges', []))
        })
        
    return leaderboard

