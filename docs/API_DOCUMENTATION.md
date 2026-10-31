# 📡 REST API Documentation

Comprehensive endpoint specifications, payloads, response formats, and status codes for the **AI-Powered Social Media Platform**.

---

## 📌 Table of Contents
- [1. Overview & Base URL](#1-overview--base-url)
- [2. Authentication Header](#2-authentication-header)
- [3. Authentication Endpoints (`/api/auth`)](#3-authentication-endpoints-apiauth)
- [4. Posts & Comments Endpoints (`/api/posts`)](#4-posts--comments-endpoints-apiposts)
- [5. AI Service Endpoints (`/api/ai`)](#5-ai-service-endpoints-apiai)
- [6. Admin Endpoints (`/api/admin`)](#6-admin-endpoints-apiadmin)
- [7. Notifications Endpoints (`/api/notifications`)](#7-notifications-endpoints-apinotifications)
- [8. User Profile Endpoints (`/api/users`)](#8-user-profile-endpoints-apiusers)
- [9. Planned Endpoints (Follows & Messaging)](#9-planned-endpoints-follows--messaging)
- [10. HTTP Status Codes](#10-http-status-codes)

---

## 1. Overview & Base URL

- **Development API Base URL**: `http://127.0.0.1:5000/api`
- **Frontend Proxy Base URL**: `/api` (Proxied via Vite dev server)
- **Data Format**: `application/json`

---

## 2. Authentication Header

Protected endpoints require a valid JWT Bearer token in the `Authorization` request header:

```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 3. Authentication Endpoints (`/api/auth`)

### 3.1 Register User
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "user"
}
```
- **Success Response (`201 Created`)**:
```json
{
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "672340a1b8c19d45e1234567",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "is_verified": false
  },
  "dev_verification_code": "489214"
}
```

---

### 3.2 Verify Email
- **Method**: `POST`
- **Endpoint**: `/api/auth/verify-email`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "john@example.com",
  "token": "489214"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "Email verified successfully! You may now log in."
}
```

---

### 3.3 User Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email_or_username": "john@example.com",
  "password": "SecurePassword123!"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "672340a1b8c19d45e1234567",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=johndoe",
    "bio": "Excited to connect on AI Social!"
  }
}
```

---

### 3.4 Forgot Password
- **Method**: `POST`
- **Endpoint**: `/api/auth/forgot-password`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "john@example.com"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "If this email is registered, a password reset token has been sent.",
  "dev_reset_token": "732918"
}
```

---

### 3.5 Reset Password
- **Method**: `POST`
- **Endpoint**: `/api/auth/reset-password`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "john@example.com",
  "token": "732918",
  "new_password": "MyNewSecurePassword456!"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

---

### 3.6 Get Current User
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Access**: Protected (Bearer Token)
- **Success Response (`200 OK`)**:
```json
{
  "user": {
    "id": "672340a1b8c19d45e1234567",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=johndoe",
    "bio": "Excited to connect on AI Social!"
  }
}
```

---

## 4. Posts & Comments Endpoints (`/api/posts`)

### 4.1 Get Feed Posts
- **Method**: `GET`
- **Endpoint**: `/api/posts?tag=ai&author_id=...`
- **Access**: Public
- **Success Response (`200 OK`)**:
```json
{
  "posts": [
    {
      "id": "672340b2b8c19d45e1234568",
      "author_id": "672340a1b8c19d45e1234567",
      "author_name": "alex_innovator",
      "author_avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
      "content": "Exciting AI developments today! 🚀 #ai #innovation",
      "image_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      "tags": ["ai", "innovation"],
      "likes_count": 5,
      "comments_count": 2,
      "is_flagged": false,
      "created_at": "2026-10-31T09:15:00.000Z"
    }
  ]
}
```

---

### 4.2 Create New Post
- **Method**: `POST`
- **Endpoint**: `/api/posts`
- **Access**: Protected
- **Request Body**:
```json
{
  "content": "Exploring the capabilities of full-stack AI development! #tech",
  "image_url": "https://images.unsplash.com/...",
  "tags": ["tech", "development"]
}
```
- **Success Response (`201 Created`)**:
```json
{
  "message": "Post created successfully",
  "post": {
    "id": "672340b2b8c19d45e1234599",
    "content": "Exploring the capabilities of full-stack AI development! #tech",
    "tags": ["tech", "development"],
    "is_flagged": false,
    "likes_count": 0,
    "comments_count": 0
  }
}
```

---

### 4.3 Toggle Like on Post
- **Method**: `POST`
- **Endpoint**: `/api/posts/<post_id>/like`
- **Access**: Protected
- **Success Response (`200 OK`)**:
```json
{
  "liked": true,
  "likes_count": 6
}
```

---

### 4.4 Add Comment
- **Method**: `POST`
- **Endpoint**: `/api/posts/<post_id>/comments`
- **Access**: Protected
- **Request Body**:
```json
{
  "content": "Great perspective! Totally agree."
}
```
- **Success Response (`201 Created`)**:
```json
{
  "message": "Comment added",
  "comment": {
    "id": "672340b2b8c19d45e1234999",
    "author_name": "johndoe",
    "content": "Great perspective! Totally agree.",
    "created_at": "2026-10-31T10:45:00.000Z"
  }
}
```

---

## 5. AI Service Endpoints (`/api/ai`)

### 5.1 Generate Social Post
- **Method**: `POST`
- **Endpoint**: `/api/ai/generate`
- **Access**: Protected
- **Request Body**:
```json
{
  "topic": "Launching my modern social media app",
  "tone": "witty",
  "length": "medium"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "content": "Nobody told me that getting into full-stack development would involve this much caffeine ☕✨\n\nProud to unveil Aura—our new AI-powered platform! #Innovation #SocialMedia",
  "provider": "Google Gemini 1.5 Flash"
}
```

---

### 5.2 Improve / Polish Post Tone
- **Method**: `POST`
- **Endpoint**: `/api/ai/improve`
- **Access**: Protected
- **Request Body**:
```json
{
  "content": "here is my new project check it out",
  "target_tone": "professional"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "improved_content": "💡 Insight: Here is my latest project release. We prioritized architectural resilience and modern user experience. #Leadership #Engineering",
  "provider": "Google Gemini 1.5 Flash"
}
```

---

### 5.3 Summarize Post & Discussion Thread
- **Method**: `POST`
- **Endpoint**: `/api/ai/summarize`
- **Access**: Public
- **Request Body**:
```json
{
  "post_id": "672340b2b8c19d45e1234568"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "summary": "📌 **Key Theme**: Overview of recent AI tone polishing features.\n💬 **Engagement**: 5 community responses.\n💡 **Sentiment**: Overwhelmingly positive and collaborative.",
  "provider": "AI Social Engine"
}
```

---

### 5.4 Contextual Smart Replies
- **Method**: `POST`
- **Endpoint**: `/api/ai/smart-replies`
- **Access**: Public
- **Request Body**:
```json
{
  "content": "Excited to launch our new feature today!"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "replies": [
    "Huge congratulations on the launch! Looks fantastic! 🚀",
    "Super interesting concept! How long did it take to build? 💡",
    "Bookmarked! Can't wait to try this out! 🔥"
  ]
}
```

---

### 5.5 Content Moderation Guard
- **Method**: `POST`
- **Endpoint**: `/api/ai/moderate`
- **Access**: Public
- **Request Body**:
```json
{
  "content": "Check out this wonderful community!"
}
```
- **Success Response (`200 OK`)**:
```json
{
  "flagged": false,
  "toxicity_score": 0.05,
  "reason": "Content is friendly and safe."
}
```

---

### 5.6 Aura AI Conversational Assistant
- **Method**: `POST`
- **Endpoint**: `/api/ai/chat`
- **Access**: Optional JWT
- **Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "How can I increase post engagement?" }
  ]
}
```
- **Success Response (`200 OK`)**:
```json
{
  "reply": "To maximize engagement: 1. Use a compelling opening hook. 2. Keep hashtags to 3-5 focused tags. 3. Ask an open question at the end! 📈",
  "provider": "Aura AI Social Strategist"
}
```

---

## 6. Admin Endpoints (`/api/admin`)

*All admin endpoints require `role === 'admin'`.*

### 6.1 Dashboard Metrics
- **Method**: `GET`
- **Endpoint**: `/api/admin/stats`
- **Success Response (`200 OK`)**:
```json
{
  "stats": {
    "total_users": 15,
    "active_users": 14,
    "total_posts": 32,
    "total_comments": 48,
    "flagged_posts": 1,
    "recent_logins_24h": 9,
    "database_status": {
      "status": "connected",
      "mock_mode": false,
      "engine": "MongoDB Live Server"
    }
  }
}
```

---

### 6.2 User Directory Management
- **Method**: `GET`
- **Endpoint**: `/api/admin/users`
- **Update Role/Ban**: `PUT /api/admin/users/<user_id>`
  - Body: `{ "role": "admin", "status": "active" }`

---

### 6.3 Moderation Queue & Flag Dismissal
- **Method**: `GET`
- **Endpoint**: `/api/admin/posts?flagged=true`
- **Dismiss Flag**: `POST /api/admin/posts/<post_id>/dismiss-flag`

---

## 7. Notifications Endpoints (`/api/notifications`)

- **Get Notifications**: `GET /api/notifications`
- **Mark All Read**: `POST /api/notifications/read`

---

## 8. User Profile Endpoints (`/api/users`)

- **Get Profile**: `GET /api/users/<user_id_or_username>`
- **Update Profile**: `PUT /api/users/profile`
  - Body: `{ "bio": "...", "avatar": "https://..." }`

---

## 9. Planned Endpoints (Follows & Messaging)

The following endpoints are scheduled for subsequent roadmap phases:

- `POST /api/users/<user_id>/follow` (Toggle follow relationship)
- `GET /api/users/<user_id>/followers` (List followers)
- `GET /api/messages/<recipient_id>` (Get conversation history)
- `POST /api/messages` (Send peer message)

---

## 10. HTTP Status Codes

| Code | Meaning | Description |
|---|---|---|
| `200 OK` | Success | Request processed successfully |
| `201 Created` | Resource Created | New post, user, or comment created |
| `400 Bad Request` | Validation Error | Missing fields or malformed payload |
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT token |
| `403 Forbidden` | Permission Denied | Attempted admin operation as standard user |
| `404 Not Found` | Not Found | Resource or ID does not exist |
| `409 Conflict` | Conflict | Username or email already registered |
| `500 Server Error` | Internal Error | Unhandled server exception |
