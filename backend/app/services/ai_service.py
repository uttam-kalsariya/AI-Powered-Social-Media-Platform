import os
import re
import random
import requests
import logging
from app.config import Config

logger = logging.getLogger(__name__)

GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]

def _call_gemini(prompt: str) -> str:
    """Helper to query Gemini API with automatic model fallback."""
    api_key = Config.GEMINI_API_KEY
    if not api_key:
        return ""

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 600
        }
    }

    for model_name in GEMINI_MODELS:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            res = requests.post(url, json=payload, timeout=10)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            elif res.status_code in [429, 503, 404]:
                logger.warning(f"Gemini {model_name} returned {res.status_code}, trying fallback model...")
                continue
            else:
                logger.warning(f"Gemini API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Error querying Gemini {model_name}: {e}")
            continue

    return ""

# ==================== FEATURE 1: POST GENERATION & IMPROVEMENT ====================

def generate_post(topic: str, tone: str = "casual", target_length: str = "medium") -> dict:
    """Generate an AI-crafted social media post based on topic and desired tone."""
    if Config.GEMINI_API_KEY:
        prompt = (
            f"Write an engaging social media post about '{topic}'. "
            f"Tone: {tone}. Length: {target_length}. "
            f"Include appropriate emojis and 3-5 relevant hashtags. Output only the post content."
        )
        gemini_result = _call_gemini(prompt)
        if gemini_result:
            return {"content": gemini_result, "provider": "Google Gemini 1.5 Flash"}

    # Intelligent Local Fallback Generator
    tone_styles = {
        "professional": {
            "hooks": [
                f"Exciting developments in {topic}:",
                f"Reflecting on the evolving landscape of {topic} today.",
                f"Key insights and takeaways on {topic} that industry leaders should consider:"
            ],
            "closings": [
                "What strategies is your team currently prioritizing? Let's connect in the comments.",
                "Continuous learning and agility remain the key drivers of success.",
                "Looking forward to hearing diverse industry perspectives on this."
            ],
            "emojis": ["💼", "📈", "🚀", "💡", "🎯"]
        },
        "witty": {
            "hooks": [
                f"Plot twist: {topic} is actually not as complicated as everyone makes it sound 😂",
                f"Nobody told me that getting into {topic} would involve this much caffeine ☕",
                f"Me trying to master {topic}: 1% skill, 99% sheer determination and meme power ✨"
            ],
            "closings": [
                "Change my mind in the comments below 👇",
                "Send help (or coffee) ☕👀",
                "Agree or totally disagree? Drop your thoughts!"
            ],
            "emojis": ["🔥", "✨", "😂", "👀", "🙌"]
        },
        "inspirational": {
            "hooks": [
                f"Every great journey with {topic} begins with a single bold decision.",
                f"Don't wait for the perfect moment to explore {topic}. Create it.",
                f"Growth happens right outside your comfort zone, especially when navigating {topic}."
            ],
            "closings": [
                "Stay consistent, stay curious, and keep building! 🌟",
                "Believe in your vision even when the path is uncertain.",
                "What dream are you taking a step towards today?"
            ],
            "emojis": ["🌟", "💫", "🚀", "🌱", "💪"]
        },
        "casual": {
            "hooks": [
                f"Just spent some time thinking about {topic} and here is my take:",
                f"Quick question for everyone exploring {topic} lately:",
                f"Sharing a quick update on my journey with {topic}!"
            ],
            "closings": [
                "What do you all think? Let me know!",
                "Have a great day everyone! ✌️",
                "Drop your recommendations below!"
            ],
            "emojis": ["👋", "💭", "🎉", "🔥", "📌"]
        }
    }
    
    style = tone_styles.get(tone.lower(), tone_styles["casual"])
    hook = random.choice(style["hooks"])
    closing = random.choice(style["closings"])
    emoji = random.choice(style["emojis"])
    
    clean_tag = re.sub(r'[^a-zA-Z0-9]', '', topic.title())
    hashtags = f"#{clean_tag} #Innovation #SocialMedia #Community"
    
    body = f"{hook} {emoji}\n\nOver the past few days, diving into this space has highlighted just how vital community feedback, smart tools, and authentic sharing are. The possibilities are truly endless.\n\n{closing}\n\n{hashtags}"
    
    return {"content": body, "provider": "AI Social Engine (Smart Heuristic)"}

def improve_post(content: str, target_tone: str = "professional") -> dict:
    """Enhance and rewrite an existing post for clarity, punchiness, and tone."""
    if Config.GEMINI_API_KEY:
        prompt = (
            f"Rewrite and improve the following social media post to make it more engaging. "
            f"Target Tone: {target_tone}. Fix grammar and make it punchy:\n\n{content}"
        )
        gemini_result = _call_gemini(prompt)
        if gemini_result:
            return {"improved_content": gemini_result, "provider": "Google Gemini 1.5 Flash"}

    # Heuristic tone transformer
    cleaned = content.strip()
    if target_tone.lower() == "professional":
        improved = f"💡 Insight: {cleaned}\n\nKey takeaway: Consistency and clear communication drive tangible impact. How does your experience align with this? #Leadership #Growth"
    elif target_tone.lower() == "witty":
        improved = f"✨ Hot take of the day: {cleaned} 🔥\n(And yes, I stand by this completely ☕). Thoughts?"
    elif target_tone.lower() == "inspirational":
        improved = f"🌟 Remember: {cleaned}\n\nEvery small effort compounds into extraordinary results. Keep pushing forward! #Motivation #KeepGoing"
    else:
        improved = f"Hey everyone! 👋 {cleaned}\n\nWould love to hear what you think in the comments below!"
        
    return {"improved_content": improved, "provider": "AI Social Engine (Smart Heuristic)"}

# ==================== FEATURE 2: POST & THREAD SUMMARIZATION ====================

def summarize_post(post_text: str, comments: list = None) -> dict:
    """Summarizes a post and its comment thread into high-level highlights."""
    comments_str = ""
    if comments:
        comments_str = "\nComments:\n" + "\n".join([f"- {c.get('author_name', 'User')}: {c.get('content', '')}" for c in comments[:8]])
        
    if Config.GEMINI_API_KEY:
        prompt = (
            f"Summarize this social media post and discussion in 2-3 concise bullet points with key sentiments:\n"
            f"Post: {post_text}\n{comments_str}"
        )
        gemini_result = _call_gemini(prompt)
        if gemini_result:
            return {"summary": gemini_result, "provider": "Google Gemini 1.5 Flash"}

    # Heuristic summarizer
    words = post_text.split()
    first_chunk = " ".join(words[:18]) + ("..." if len(words) > 18 else "")
    comment_count = len(comments) if comments else 0
    
    summary = (
        f"📌 **Key Theme**: {first_chunk}\n"
        f"💬 **Engagement**: {comment_count} community discussion responses.\n"
        f"💡 **Sentiment**: Generally collaborative and focused on knowledge sharing."
    )
    return {"summary": summary, "provider": "AI Social Engine (Smart Heuristic)"}

# ==================== FEATURE 3: SMART REPLY SUGGESTIONS ====================

def generate_smart_replies(post_content: str) -> list:
    """Generates 3 fast contextual reply suggestions for users."""
    if Config.GEMINI_API_KEY:
        prompt = (
            f"Generate exactly 3 short, natural 1-sentence reply suggestions to this social media post. "
            f"Output as three lines separated by newlines:\n\n{post_content}"
        )
        gemini_result = _call_gemini(prompt)
        if gemini_result:
            lines = [line.strip().lstrip('123456789.-* ') for line in gemini_result.split('\n') if line.strip()]
            if len(lines) >= 3:
                return lines[:3]

    # Contextual Heuristic Replies
    text_lower = post_content.lower()
    if any(k in text_lower for k in ["thanks", "thank you", "grateful", "appreciate"]):
        return [
            "Well deserved! Keep up the amazing work! 👏",
            "Always happy to support! 🚀",
            "Love seeing this positive milestone! ✨"
        ]
    elif any(k in text_lower for k in ["launch", "project", "build", "created", "new"]):
        return [
            "Huge congratulations on the launch! Looks fantastic! 🚀",
            "Super interesting concept! How long did it take to build? 💡",
            "Bookmarked! Can't wait to try this out! 🔥"
        ]
    elif "?" in post_content:
        return [
            "In my experience, consistency and early feedback make all the difference! 💡",
            "Great question! I'd love to see how others tackle this as well. 🤔",
            "Totally agree with your perspective on this. Let's discuss more! 👏"
        ]
    else:
        return [
            "Great insights! Thanks for sharing this perspective. 💡",
            "Totally agree with this! 👏",
            "Fascinating point of view! Would love to hear more. 🔥"
        ]

# ==================== FEATURE 4: AI CONTENT MODERATION ====================

TOXIC_KEYWORDS = [
    "idiot", "stupid", "hate", "scam", "kill", "dumb", "trash", 
    "abuse", "harass", "fraud", "fake", "die", "attack", "ugly"
]

def moderate_content(text: str) -> dict:
    """
    Checks text for toxic, offensive, or spam content.
    Returns flagged status, toxicity score, and reason.
    """
    if Config.GEMINI_API_KEY:
        prompt = (
            f"Analyze the following text for safety, toxicity, harassment, and spam. "
            f"Respond in format 'FLAGGED: [true/false] | SCORE: [0.0 to 1.0] | REASON: [brief reason]':\n\n{text}"
        )
        gemini_result = _call_gemini(prompt)
        if gemini_result and "FLAGGED:" in gemini_result:
            try:
                parts = gemini_result.split("|")
                is_flagged = "true" in parts[0].lower()
                score = float(re.findall(r"[-+]?\d*\.\d+|\d+", parts[1])[0]) if len(parts) > 1 else 0.0
                reason = parts[2].replace("REASON:", "").strip() if len(parts) > 2 else "Content flagged by AI moderation"
                return {
                    "flagged": is_flagged,
                    "toxicity_score": score,
                    "reason": reason,
                    "provider": "Google Gemini 1.5 Flash"
                }
            except Exception:
                pass

    # Heuristic moderation
    text_lower = text.lower()
    matches = [word for word in TOXIC_KEYWORDS if re.search(r'\b' + re.escape(word) + r'\b', text_lower)]
    
    if matches:
        score = min(0.95, 0.45 + (len(matches) * 0.25))
        return {
            "flagged": True,
            "toxicity_score": round(score, 2),
            "reason": f"Potentially offensive terms detected: {', '.join(matches[:3])}",
            "flagged_terms": matches,
            "provider": "AI Social Moderation Guard"
        }
        
    return {
        "flagged": False,
        "toxicity_score": 0.05,
        "reason": "Content is friendly and safe.",
        "flagged_terms": [],
        "provider": "AI Social Moderation Guard"
    }

# ==================== FEATURE 5: CONVERSATIONAL AI ASSISTANT ====================

def conversational_assistant(messages: list, current_user: str = "User") -> dict:
    """Interactive conversational social assistant for advice, brainstorming, and strategies."""
    last_user_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user_message = msg.get("content", "")
            break

    if Config.GEMINI_API_KEY:
        system_instruction = (
            f"You are 'Aura', a friendly, insightful AI assistant integrated into a modern social media platform. "
            f"You assist {current_user} with content ideas, social media strategy, engaging copywriting, "
            f"and platform questions. Keep answers clear, encouraging, and actionable."
        )
        prompt = f"{system_instruction}\n\nUser: {last_user_message}\nAura:"
        gemini_result = _call_gemini(prompt)
        if gemini_result:
            return {"reply": gemini_result, "provider": "Google Gemini 1.5 Flash"}

    # Dynamic intelligent social strategist fallback
    msg_low = last_user_message.lower()
    if any(w in msg_low for w in ["idea", "what should i post", "topics", "inspire"]):
        reply = (
            f"Here are 3 high-impact post ideas for you today, {current_user}! 💡\n\n"
            "1. **Behind-the-Scenes**: Share a challenge you recently faced in your project and how you solved it.\n"
            "2. **Quick Poll or Question**: Ask your network: 'What's one tool or habit that doubled your productivity this month?'\n"
            "3. **Milestone Celebration**: Highlight a small win or lesson learned this week.\n\n"
            "Would you like me to draft one of these for you?"
        )
    elif any(w in msg_low for w in ["hashtag", "tag", "reach", "engagement"]):
        reply = (
            "Great question on engagement! 📈 To maximize post reach:\n\n"
            "- Use 3-5 focused hashtags instead of 20 generic ones.\n"
            "- Start with a compelling 1-line hook that creates curiosity.\n"
            "- Ask a direct, open-ended question at the very end.\n"
            "- Reply to comments within the first 60 minutes of posting."
        )
    elif any(w in msg_low for w in ["hello", "hi", "hey", "aura", "who are you"]):
        reply = (
            f"Hello {current_user}! 👋 I'm **Aura**, your AI Social Assistant.\n\n"
            "I'm here to help you draft viral posts, polish your captions, summarize discussions, "
            "or brainstorm creative social strategies. How can I assist you right now?"
        )
    elif any(w in msg_low for w in ["admin", "dashboard", "moderation", "features"]):
        reply = (
            "Our platform includes two personas:\n"
            "🛡️ **Admin**: Oversee platform metrics, review users, inspect flagged posts, and receive live login alerts.\n"
            "👤 **User**: Share posts with AI assistance, comment, like, explore feeds, and chat with me!\n\n"
            "Need guidance on using any specific feature?"
        )
    else:
        reply = (
            f"That's a thoughtful point, {current_user}! On social media, authenticity and clear storytelling "
            f"always resonate the most. I can help you turn that thought into a polished post, summarize "
            f"recent discussions, or suggest catchy hooks. What would you like to explore next?"
        )

    return {"reply": reply, "provider": "Aura AI Social Strategist"}
