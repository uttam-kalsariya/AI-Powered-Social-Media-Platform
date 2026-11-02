# 📜 Changelog

All notable changes, enhancements, and releases for the **AI-Powered Social Media Platform** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-11-02

### 🚀 Added
- **Production Cloud DevOps & Resilience**:
  - Implemented 3-attempt exponential backoff retry loop for MongoDB Atlas connections in `database.py`.
  - Configured TLS with `certifi.where()` Mozilla CA bundle to prevent SSL certificate validation failures in containerized environments.
  - Added loud failure in production mode: application fails loudly with detailed diagnostics instead of silently falling back to in-memory `mongomock`.
  - Added Render health check endpoints: `GET /` and `HEAD /` returning `200 OK` (`{"status": "ok"}`), and `/health` with live MongoDB ping.
  - Added standalone diagnostic tool `test_mongo.py` for testing Atlas connection, replica set topology, and read/write permissions.
  - Pinned `certifi==2024.7.4`, `dnspython==2.6.1`, and `gunicorn==22.0.0` across all `requirements.txt` files.
- **UI & Interaction Bug Fixes (18 fixes across 12 commits)**:
  - Responsive feed grid and tag filter clear button in `HomePage.jsx`.
  - Mobile-responsive direct message chat drawer with theme-safe inputs in `MessagesPage.jsx`.
  - Responsive explore media grid with interactive popover modal in `ExplorePage.jsx`.
  - Notification flyout positioning with outside-click listener in `Navbar.jsx`.
  - Admin dashboard table horizontal scroll with `min-width: 680px` in `AdminDashboard.jsx`.
  - Responsive streak summary cards in `StreakModal.jsx`.
  - Semantic theme inputs and account setting controls in `SettingsPage.jsx`.
  - Dead CSS cleanup in `App.css`.
  - 1-click interactive deep links in `NotificationsPage.jsx`.
  - Short-form vertical video playback with audio mute/unmute and slide-out comments in `ReelsPage.jsx`.
  - Broken image URL fallback handling and consistent timestamps in `CreatePostCard.jsx` and `PostCard.jsx`.
  - Theme-safe avatar generator and bookmark tab navigation in `ProfilePage.jsx`.
- **Quality Assurance**:
  - 30 automated Pytest tests passing cleanly covering OTP hashing, JWT security, social feeds, and streak mechanics.

---

## [2.0.0] - 2026-11-01

### 🚀 Added
- **Short-Form Video (Reels)**: Immersive vertical reel feed with likes, bookmarks, and floating action drawer.
- **Daily Activity Streaks & Gamification**: Daily streaks engine, XP progression, level milestones, streak freeze shields, and community leaderboards.
- **Direct Messaging System**: Real-time 1-on-1 conversations with unread badges and active thread indicators.
- **Resend OTP Email Verification**: HMAC-SHA256 OTP hashing with 5-minute expiration, cooldown timer, and brute-force attempt limits.
- **Dynamic Theme Engine**: Full Dark Mode and Light Mode switching with local storage persistence.

---

## [1.0.0] - 2026-10-31

### 🚀 Added
- **Authentication System**: Full registration/login with `bcrypt` and `Flask-JWT-Extended`.
- **Social Feed Architecture**: Feed view, post CRUD, likes, comments, and hashtag filtering.
- **Artificial Intelligence Engine**: Google Gemini 1.5 Flash API with local heuristic engine fallback.
- **Administrator Command Center**: Platform metrics, user governance, moderation queue, and audit logs.
- **Frontend & Design System**: React 19 + Vite + Tailwind CSS glassmorphic design.
- **Database Architecture**: MongoDB Atlas cloud cluster integration with automatic seeding.
