# 🌟 Aura — AI-Powered Social Media Platform

An enterprise-grade, modern social media platform engineered with **React 19**, **Vite**, **Tailwind CSS**, **Python Flask**, and **MongoDB Atlas**, featuring end-to-end authentication, dual user personas (**Admin** and **User**), real-time notifications, interactive feeds, and an intelligent suite of **AI-driven creator tools and assistants**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.3-61dafb.svg?logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-black.svg?logo=flask)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75C4.svg?logo=google)](https://deepmind.google/technologies/gemini/)

**GitHub Repository**: [https://github.com/uttam-kalsariya/AI-Powered-Social-Media-Platform](https://github.com/uttam-kalsariya/AI-Powered-Social-Media-Platform.git)

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
| [**`docs/AUTHENTICATION.md`**](docs/AUTHENTICATION.md) | JWT tokens, Bcrypt password hashing, route guards, and email verification |
| [**`docs/AI_FEATURES.md`**](docs/AI_FEATURES.md) | Google Gemini integration, copywriting tones, and local fallback engine |
| [**`docs/DEVELOPMENT_ROADMAP.md`**](docs/DEVELOPMENT_ROADMAP.md) | Phase-by-phase development progress and future milestone tracker |
| [**`docs/TESTING.md`**](docs/TESTING.md) | Quality assurance protocols, PowerShell test scripts, and test cases |
| [**`docs/DEPLOYMENT.md`**](docs/DEPLOYMENT.md) | Production cloud deployment guides for Vercel, Render, and Atlas |
| [**`CONTRIBUTING.md`**](CONTRIBUTING.md) | Git workflow, branch naming, and pull request guidelines |
| [**`CHANGELOG.md`**](CHANGELOG.md) | Version history, updates, and release notes |

---

## 🚀 Key Features

### 1. 🔐 Robust Authentication & Role Management
- **Registration & Login**: Secure credential authentication powered by `bcrypt` password hashing and `Flask-JWT-Extended`.
- **Email Verification**: Generates verification tokens sent via SMTP (with dev console preview mode for local environments).
- **Password Reset**: End-to-end tokenized forgot-password and reset-password workflow.
- **Admin Login Alerts**: Real-time notifications dispatched to administrators whenever any user logs in.

### 2. 👥 Two User Personas
- **Administrator**:
  - Live platform telemetry: Total users, active users, posts, comments, moderation flags, and 24h logins.
  - User directory governance: Search users, inspect last login, grant/revoke admin rights, ban/unban accounts.
  - Moderation queue: Inspect AI toxicity scores, dismiss flags, or delete violations.
  - Audit logs: Track user logins, signups, and admin actions.
- **Standard User**:
  - Personal profile management: Custom bio and avatar generator.
  - Feed interaction: Share posts with text, images, and hashtags; like and comment on community content.
  - Receive real-time interactive notifications for likes and comments.

### 3. 🤖 Full AI Agent Suite
1. **AI Post Generation**: Creates structured, formatted posts with hooks and hashtags based on a topic and chosen tone (`Casual`, `Professional`, `Witty`, `Inspirational`).
2. **AI Tone Rewriting & Polish**: 1-click content rephrasing into professional, witty, or inspirational tones.
3. **AI Discussion Summarization**: Instant multi-point summaries highlighting the key discussion sentiments in post threads.
4. **AI Smart Replies**: Contextual 1-click comment suggestions based on post context.
5. **AI Content Moderation Guard**: Automated safety filter detecting toxic keywords, abuse, and spam patterns with toxicity scoring.
6. **Aura AI Social Strategist**: Interactive conversational assistant helping users brainstorm viral topics, write hooks, and refine strategies.
- **Resilient AI Fallback**: Dual-tier pipeline that automatically routes prompts to an intelligent local heuristic engine if an external API key is omitted or unavailable.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Axios, React Router |
| **Backend** | Python 3.12, Flask, Flask-CORS, Flask-JWT-Extended, PyMongo, Bcrypt |
| **Database** | MongoDB Atlas (Cloud Cluster) / Resilient in-memory mongomock fallback |
| **AI Integration** | Google Gemini 1.5 Flash API + Built-in AI Social Heuristic Engine |
| **Email Service** | SMTP / TLS email delivery with developer console logger |

---

## 📁 Project Directory Structure

```
AI-Powered-Social-Media-Platform/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components (Navbar, PostCard, CreatePostCard, etc.)
│   │   ├── layouts/             # App layout wrappers
│   │   ├── pages/               # Route views
│   │   ├── hooks/               # Custom hooks (useDebounce, etc.)
│   │   ├── services/            # axiosClient.js, api.js
│   │   ├── context/             # AuthContext.jsx
│   │   ├── utils/               # formatDate.js, etc.
│   │   ├── assets/              # Static assets & icons
│   │   ├── App.jsx              # Main view manager
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Tailwind directives & glassmorphic tokens
│   ├── tailwind.config.js       # Tailwind theme configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── vite.config.js           # Server proxy configuration
│   └── package.json
│
├── server/                      # Flask Backend API
│   ├── app/
│   │   ├── routes/              # auth, posts, ai, admin, notifications, users
│   │   ├── models/              # helpers and serializers
│   │   ├── services/            # ai_service, email_service, db
│   │   ├── utils/               # response.py, validators.py
│   │   ├── config.py            # Environment configurations
│   │   └── __init__.py          # Flask app factory & initial data seeder
│   ├── run.py                   # Server launch entry point
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── .env                     # Local environment file (Excluded from Git)
│
├── docs/                        # Deep Technical Documentation
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   ├── AUTHENTICATION.md
│   ├── AI_FEATURES.md
│   ├── DEVELOPMENT_ROADMAP.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
│
├── PROJECT_OVERVIEW.md
├── TECH_STACK.md
├── INSTALLATION.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

---

## 🔥 Upcoming Features (Roadmap)

The following features are planned for future releases to make the platform more engaging, intelligent, and production-ready.

### 🏆 Streak Counter
- Daily login streak tracking
- Post creation streaks
- Comment activity streaks
- Weekly engagement milestones
- Achievement rewards for maintaining streaks
- Visual streak calendar
- XP points and badge rewards

### 🌍 Social Features
- 🔥 Trending Topics
- #️⃣ Trending Hashtags
- 📍 Nearby Users
- 🌎 Explore Page
- 🎯 Personalized Recommendations
- 💾 Saved Posts
- 📂 Collections
- 🔖 Bookmarks

### 🚀 Future AI Features
- AI Smart Feed Recommendations
- AI Trending Topic Detection
- AI Auto Hashtag Generator
- AI Content Moderation
- AI Smart Search
- AI Engagement Analytics
- AI Profile Insights

### 📱 Planned Enhancements
- Real-Time Notifications
- WebSocket Support
- Infinite Scrolling Feed
- Dark & Light Mode
- Mobile PWA Support
- Story Feature
- Follow / Unfollow Users
- Real-Time Chat
- User Verification
- Admin Analytics Dashboard

---

## ⚡ Instant Demo Accounts

For immediate evaluation, use the 1-click demo buttons in the Sign In modal or enter:

| Persona | Username / Email | Password | Role |
|---|---|---|---|
| **Administrator** | `admin` / `admin@aisocial.local` | `AdminPass123!` | Admin |
| **Demo User** | `alex_innovator` / `alex@aisocial.local` | `UserPass123!` | Standard User |

---

## 🏃 Quick Start Guide

### 1. Start the Flask Backend (Terminal 1)
```powershell
cd server
.\venv\Scripts\activate
python run.py
```
*API runs on `http://127.0.0.1:5000` (Health check: `http://127.0.0.1:5000/api/health`)*

### 2. Start the React Frontend (Terminal 2)
```powershell
cd client
npm run dev
```
*Application opens on `http://localhost:3000`*

For complete setup instructions, see [**`INSTALLATION.md`**](INSTALLATION.md).

---

## 🛡️ License
Distributed under the [MIT License](LICENSE). Copyright © 2026 Uttam Kalsariya.
