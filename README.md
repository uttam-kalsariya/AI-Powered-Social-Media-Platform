# 🌟 Aura — AI-Powered Social Media Platform

An enterprise-grade, modern social media platform engineered with **React 19**, **Vite**, **Tailwind CSS**, **Python Flask**, and **MongoDB Atlas**, featuring end-to-end authentication, dual user personas (**Admin** and **User**), real-time notifications, interactive feeds, short-form reels, direct messaging, daily streaks gamification, and an intelligent suite of **AI-driven creator tools and assistants**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.3-61dafb.svg?logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black.svg?logo=flask)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75C4.svg?logo=google)](https://deepmind.google/technologies/gemini/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live-success.svg?logo=vercel)](https://ai-powered-social-media-platform.vercel.app/home)
[![Render Backend](https://img.shields.io/badge/Render-Live%20API-46E3B7.svg?logo=render)](https://ai-powered-social-media-platform-erlu.onrender.com/)
[![Tests](https://img.shields.io/badge/Pytest-30%20Passed-brightgreen.svg)](docs/TESTING.md)

---

## 🌐 Live Deployments & Repository Links

| Service | Platform / Environment | Live URL | Status |
|---|---|---|---|
| **Frontend Web App** | Vercel (Edge CDN) | [**https://ai-powered-social-media-platform.vercel.app/home**](https://ai-powered-social-media-platform.vercel.app/home) | ![Live](https://img.shields.io/badge/Status-Online-success) |
| **Backend API Service** | Render (Gunicorn WSGI) | [**https://ai-powered-social-media-platform-erlu.onrender.com/**](https://ai-powered-social-media-platform-erlu.onrender.com/) | ![Live](https://img.shields.io/badge/Status-Online-success) |
| **API Health Probe** | Render Cloud Probe | [**https://ai-powered-social-media-platform-erlu.onrender.com/health**](https://ai-powered-social-media-platform-erlu.onrender.com/health) | ![200 OK](https://img.shields.io/badge/Health-200%20OK-brightgreen) |
| **Source Code Repository** | GitHub (Git Monorepo) | [**https://github.com/uttam-kalsariya/AI-Powered-Social-Media-Platform.git**](https://github.com/uttam-kalsariya/AI-Powered-Social-Media-Platform.git) | ![Main](https://img.shields.io/badge/Branch-main-blue) |

---

## 📚 Complete Project Documentation Suite

Explore the comprehensive engineering documentation maintained in this repository:

| Document | Description |
|---|---|
| [**`PROJECT_OVERVIEW.md`**](PROJECT_OVERVIEW.md) | Problem statement, proposed solution, module breakdowns, and personas |
| [**`TECH_STACK.md`**](TECH_STACK.md) | Technology choices, version matrix, and Architectural Decision Records (ADRs) |
| [**`INSTALLATION.md`**](INSTALLATION.md) | Windows 11 setup guide, prerequisites, and startup commands |
| [**`docs/DATABASE_SCHEMA.md`**](docs/DATABASE_SCHEMA.md) | MongoDB Atlas design, collection models, ER diagrams, and indexes |
| [**`docs/API_DOCUMENTATION.md`**](docs/API_DOCUMENTATION.md) | Complete REST API endpoint reference, payloads, and response codes |
| [**`docs/AUTHENTICATION.md`**](docs/AUTHENTICATION.md) | JWT tokens, Bcrypt password hashing, route guards, and Resend OTP verification |
| [**`docs/AI_FEATURES.md`**](docs/AI_FEATURES.md) | Google Gemini integration, copywriting tones, and local fallback engine |
| [**`docs/DEVELOPMENT_ROADMAP.md`**](docs/DEVELOPMENT_ROADMAP.md) | Phase-by-phase development progress and future milestone tracker |
| [**`docs/TESTING.md`**](docs/TESTING.md) | Quality assurance protocols, 30 automated test cases, and test suite execution |
| [**`docs/DEPLOYMENT.md`**](docs/DEPLOYMENT.md) | Production cloud deployment guides for Vercel, Render, and MongoDB Atlas |
| [**`CONTRIBUTING.md`**](CONTRIBUTING.md) | Git workflow, branch naming, and pull request guidelines |
| [**`CHANGELOG.md`**](CHANGELOG.md) | Version history, updates, and release notes |

---

## 🚀 Key Implemented Features

### 1. 🤖 Full AI Creator Suite (Google Gemini 1.5 Flash)
- **AI Post Generation**: Generates structured, engaging posts with hooks and hashtags based on topics and chosen tones (`Casual`, `Professional`, `Witty`, `Inspirational`).
- **AI Tone Rewriter**: 1-click text rephrasing into professional, witty, or inspirational tones before publishing.
- **AI Discussion Summarization**: Instant multi-point summaries highlighting the core discussion sentiments in post comment threads.
- **AI Smart Replies**: Contextual 1-click comment recommendations based on post context.
- **AI Content Moderation Guard**: Automated safety filter detecting toxic keywords, abuse, and spam patterns with numerical toxicity scoring.
- **Aura AI Social Strategist**: Interactive conversational assistant helping users brainstorm viral topics, write hooks, and refine growth strategies.
- **Resilient AI Fallback**: Dual-tier pipeline that routes prompts to an intelligent local heuristic engine if an external API key is omitted or quota is exceeded.

### 2. 🔐 Robust Authentication & Role Governance
- **Dual User Personas**: Distinct workflows and dashboard experiences for **Regular Users** and **Administrators**.
- **Credentials & Session Security**: Secure authentication powered by `bcrypt` (work factor 12) password hashing and stateless `Flask-JWT-Extended`.
- **Resend Email OTP Verification**: Real-time email verification with HMAC-SHA256 hashed OTPs, 5-minute expiration, cooldown protection, and rate-limiting.
- **Tokenized Password Reset**: Secure forgot-password and reset-password workflow with auto-fill fallback and resend mechanisms.
- **Admin Login Alerts**: Real-time notification dispatches to platform administrators upon user login events.

### 3. 📱 Social Feed, Reels & Discovery
- **Interactive Chronological Feed**: Supports rich text, images, and clickable hashtag pills with full responsiveness.
- **Short-Form Video (Reels)**: Immersive vertical reel feed with floating action controls, audio mute/unmute toggle, and a slide-out comments drawer.
- **Explore & Trending**: Real-time trending hashtags, debounced search by user or tag, and an interactive popover media modal.
- **Post Interactions**: Likes counter, nested comment threads with deletion controls, bookmarks/saves, and social share links.
- **Graceful Image Fallback**: Automatic detection of broken or invalid image URLs with fallback placeholders.

### 4. 💬 Direct Messaging & Chat
- **Conversations Drawer**: Responsive chat navigation with search and instant user switching.
- **Real-Time Direct Messages**: Direct messaging system with delivery timestamps, active thread indicators, and unread badges.

### 5. 🔥 Gamification & Streaks
- **Daily Activity Streaks**: Consecutive active day counter with visual calendar indicators.
- **XP & Level Progression**: Experience point rewards for posts, comments, and daily streaks.
- **Streak Freeze Shields**: Shield mechanics protecting users from streak loss on inactive days.
- **Leaderboards**: Community ranking displaying top active users by streak count and total XP.

### 6. 🔔 Real-Time Notifications
- **Activity Alerts**: Instant notifications for likes, comments, mentions, and follows.
- **Navigation Flyout**: Dropdown from the top navigation bar with outside-click dismissal.
- **Notifications Hub**: Dedicated page with 1-click deep links to referenced posts or user profiles and a "Mark All as Read" action.

### 7. 🛡️ Admin Governance Dashboard
- **Live System Telemetry**: Overview metrics tracking total users, active accounts, total posts, comments, moderation flags, and 24h logins.
- **User Management**: Search users, promote/demote administrator rights, and ban/unban abusive accounts.
- **Moderation Queue**: Review AI-flagged posts with toxicity scores, dismiss false positives, or delete toxic content.
- **Audit Logs**: Chronological log of administrative actions, user registrations, and login events.

### 8. 🎨 Modern Glassmorphic Design System
- **Dynamic Theme Switcher**: Full support for **Dark Mode** and **Light Mode** with persistent local storage.
- **Mobile Responsive Layout**: Scaled layouts for smartphones, tablets, and wide monitors.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Axios, React Router 6 |
| **Backend** | Python 3.11/3.12, Flask 3.0.3, Gunicorn 22.0.0, Flask-CORS, Flask-JWT-Extended, PyMongo 4.7.2, Bcrypt |
| **Database** | MongoDB Atlas (Cloud Cluster) / Resilient in-memory mongomock test engine |
| **AI Integration** | Google Gemini 1.5 Flash API + Built-in Local Heuristic Fallback Engine |
| **Email Delivery** | Resend API + SMTP fallback for OTP and password reset delivery |
| **Testing** | Pytest (30 automated unit and integration tests passing) |
| **Cloud Hosting** | Vercel (React Frontend), Render (Flask + Gunicorn), MongoDB Atlas (Cloud DB) |

---

## 📁 Project Directory Structure

```
AI-Powered-Social-Media-Platform/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI (Navbar, PostCard, CreatePostCard, StreakModal, AdminDashboard)
│   │   ├── pages/               # Route views (HomePage, ExplorePage, ReelsPage, MessagesPage, ProfilePage, SettingsPage)
│   │   ├── context/             # AuthContext.jsx, ThemeContext.jsx
│   │   ├── services/            # axiosClient.js, api.js
│   │   ├── config.js            # Centralized API configuration (import.meta.env.VITE_API_URL)
│   │   ├── App.jsx              # Application router
│   │   └── index.css            # Tailwind directives & glassmorphic tokens
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── vercel.json              # Vercel SPA rewrites config
│   ├── .env.example             # Frontend environment template
│   └── package.json
│
├── server/                      # Flask Backend API
│   ├── app/
│   │   ├── routes/              # auth, posts, ai, admin, notifications, users, streaks
│   │   ├── services/            # ai_service, email_service, streak_service
│   │   ├── database.py          # MongoDB Atlas connection manager with retry backoff & CA bundle
│   │   ├── config.py            # Environment configurations
│   │   └── __init__.py          # Flask app factory, health routes & initial data seeder
│   ├── tests/                   # 30 automated Pytest unit and integration tests
│   ├── test_mongo.py            # Standalone MongoDB Atlas pre-flight diagnostic script
│   ├── run.py                   # Server launch entry point
│   ├── gunicorn.conf.py         # Dynamic Gunicorn port binding for Render ($PORT)
│   ├── requirements.txt         # Pinned Python dependencies
│   └── .env                     # Local environment file (Excluded from Git)
│
├── .vercelignore                # Excludes backend/Python files from Vercel frontend builds
├── test_mongo.py                # Standalone diagnostic runner
├── requirements.txt             # Root requirements
├── .python-version              # 3.11.9
├── docs/                        # Complete Engineering Documentation Suite
└── README.md
```

---

## ⚡ Instant Demo Accounts

For immediate evaluation, use the 1-click demo buttons in the Sign In modal or enter:

| Persona | Username / Email | Password | Role |
|---|---|---|---|
| **Administrator** | `admin` / `admin@aisocial.local` | `AdminPass123!` | Admin |
| **Demo User** | `alex_innovator` / `alex@aisocial.local` | `UserPass123!` | Standard User |
| **Test User** | `uttam` / `uttamkalsariya1002@gmail.com` | `UserPass123!` | Standard User |

---

## 🏃 Quick Start Guide

### 1. Start the Flask Backend (Terminal 1)
```powershell
cd server
.\venv\Scripts\activate
python run.py
```
*API runs on `http://127.0.0.1:5000` (Health probe: `http://127.0.0.1:5000/health`)*

### 2. Start the React Frontend (Terminal 2)
```powershell
cd client
npm run dev
```
*Application opens on `http://localhost:3000`*

### 3. Run Automated Tests
```powershell
cd server
.\venv\Scripts\activate
pytest tests
```
*30 passed in ~11s*

### 4. Verify MongoDB Atlas Connectivity
```powershell
python test_mongo.py
```

For complete setup instructions, see [**`INSTALLATION.md`**](INSTALLATION.md).

---

## 🛡️ License
Distributed under the [MIT License](LICENSE). Copyright © 2026 Uttam Kalsariya.
