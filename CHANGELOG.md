# 📜 Changelog

All notable changes, enhancements, and releases for the **AI-Powered Social Media Platform** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-31

### 🚀 Added
- **Authentication System**:
  - Full user registration and login with `bcrypt` password hashing.
  - `Flask-JWT-Extended` access token generation and claims encoding.
  - Dual persona architecture supporting Standard User and Administrator roles.
  - Email verification code delivery (SMTP + developer console fallback).
  - Tokenized forgot password and password reset workflow.
  - Automatic admin notification alerts dispatched on every user login.
- **Social Feed Architecture**:
  - Feed view with chronological post ordering, image rendering, and hashtag filtering.
  - Create, edit, and delete post functionality.
  - Interactive like toggle with dynamic counter and author notifications.
  - Threaded comment system with author and admin deletion permissions.
- **Artificial Intelligence Engine**:
  - Dual-tier AI pipeline integrating Google Gemini 1.5 Flash API with a zero-crash local heuristic fallback.
  - AI Post Generator supporting 4 tones (`Casual`, `Professional`, `Witty`, `Inspirational`).
  - 1-click tone polisher and rephraser.
  - Discussion thread summarizer extracting key takeaways and sentiments.
  - 1-click contextual smart reply suggestion pills.
  - Pre-publication automated toxicity screening and moderation flagging.
  - Aura conversational social media strategist assistant.
- **Administrator Command Center**:
  - Live platform metrics dashboard (total users, active users, posts, comments, moderation flags, 24h logins, and database engine status).
  - User directory with search, role modification (`user` vs `admin`), and ban/unban controls.
  - Moderation queue for reviewing flagged content with toxicity scores.
  - Activity audit logging tracking platform logins and administrative events.
- **Frontend & Design System**:
  - Built with React 19 and Vite 8 for sub-millisecond HMR.
  - Modern glassmorphic dark theme using Tailwind CSS and custom HSL tokens.
  - Lucide React icon set integration.
  - Axios HTTP client configured with JWT interceptors.
  - 1-click demo login buttons for rapid persona evaluation.
- **Database Architecture**:
  - Live MongoDB Atlas cloud integration.
  - Embedded `mongomock` fallback for offline testing resilience.
  - Pre-seeded showcase posts, comments, and demo accounts.
- **Documentation Suite**:
  - Complete technical documentation in `docs/` covering schema, endpoints, auth, AI, and testing.

---

## [Unreleased] - Planned for v1.1.0

### 🔮 Planned
- Follow / Unfollow user system with personalized following-only feed filter.
- Direct peer-to-peer messaging system.
- Direct image and video file upload handlers (AWS S3 / Cloudinary).
- Real-time WebSockets / SSE for instant chat notifications.
