# 🧪 Testing & Quality Assurance Guide

Comprehensive testing protocols, test cases, and quality validation procedures for the **AI-Powered Social Media Platform**.

---

## 📌 Table of Contents
- [1. Testing Strategy](#1-testing-strategy)
- [2. Automated Build & Compilation Verification](#2-automated-build--compilation-verification)
- [3. Backend API Test Suite](#3-backend-api-test-suite)
- [4. Authentication Test Cases](#4-authentication-test-cases)
- [5. Social Feed & Interaction Test Cases](#5-social-feed--interaction-test-cases)
- [6. AI Capabilities Test Cases](#6-ai-capabilities-test-cases)
- [7. Database Resilience & Fallback Testing](#7-database-resilience--fallback-testing)
- [8. Bug Reporting & Issue Triage](#8-bug-reporting--issue-triage)

---

## 1. Testing Strategy

The platform employs a layered testing approach:
1. **Compilation Testing**: Validates that all TypeScript/JSX and Tailwind styling builds cleanly without syntax errors.
2. **Endpoint Smoke Tests**: Tests every REST route for expected JSON status codes and error models.
3. **Security & Permission Checks**: Validates that standard users cannot invoke `@admin_required()` endpoints.
4. **Resilience Tests**: Verifies that missing API keys or database network interruptions do not crash the server.

---

## 2. Automated Build & Compilation Verification

### Frontend Build Test (Windows PowerShell):
```powershell
cd client
npm run build
```
**Expected Outcome**:
```text
✓ built in ~3.6s
dist/index.html
dist/assets/index.css
dist/assets/index.js
```

### Backend Route Verification Test:
```powershell
cd server
.\venv\Scripts\activate
python -c "from app import create_app; app = create_app(); print('Endpoints registered:', len(list(app.url_map.iter_rules())))"
```
**Expected Outcome**:
```text
Endpoints registered: 33+
```

---

## 3. Backend API Test Suite

You can execute the following API tests using **PowerShell `Invoke-RestMethod`** or **cURL**:

### Test 1: API Health Check
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/health" -Method GET
```
**Expected Response**:
```json
{
  "database": {
    "engine": "MongoDB Live Server",
    "mock_mode": false,
    "status": "connected"
  },
  "service": "AI-Powered Social Media Platform API",
  "status": "healthy"
}
```

---

## 4. Authentication Test Cases

| Test ID | Test Description | Input Data | Expected Status | Expected Output |
|---|---|---|---|---|
| `TC-AUTH-01` | Successful Registration | Valid username, email, password | `201 Created` | Verification code returned |
| `TC-AUTH-02` | Duplicate Username | Existing registered username | `409 Conflict` | `"Username or email already exists"` |
| `TC-AUTH-03` | Short Password (<6 chars) | Password: `"123"` | `400 Bad Request` | `"Password must be at least 6 characters"` |
| `TC-AUTH-04` | Successful User Login | Valid credentials | `200 OK` | JWT access token returned |
| `TC-AUTH-05` | Invalid Password | Incorrect password | `401 Unauthorized` | `"Invalid credentials"` |
| `TC-AUTH-06` | Admin Route Access (User) | Standard user JWT token | `403 Forbidden` | `"Admin access required"` |
| `TC-AUTH-07` | Admin Route Access (Admin)| Admin JWT token | `200 OK` | Platform metrics returned |

---

## 5. Social Feed & Interaction Test Cases

| Test ID | Test Description | Action | Expected Outcome |
|---|---|---|---|
| `TC-FEED-01` | Fetch Feed | `GET /api/posts` | Returns array of post objects |
| `TC-FEED-02` | Create Post without Auth | `POST /api/posts` (No token) | `401 Unauthorized` |
| `TC-FEED-03` | Create Post with Auth | `POST /api/posts` (With token) | `201 Created`, post saved to DB |
| `TC-FEED-04` | Toggle Post Like | `POST /api/posts/<id>/like` | `liked: true`, count increments |
| `TC-FEED-05` | Unlike Post | `POST /api/posts/<id>/like` | `liked: false`, count decrements |
| `TC-FEED-06` | Add Post Comment | `POST /api/posts/<id>/comments` | `201 Created`, comment added |
| `TC-FEED-07` | Delete Others' Post | Standard user attempts delete | `403 Forbidden` |
| `TC-FEED-08` | Admin Delete Any Post | Admin attempts delete | `200 OK`, post removed |

---

## 6. AI Capabilities Test Cases

### Test Case: Post Generation
```powershell
$headers = @{ "Authorization" = "Bearer <jwt_token>"; "Content-Type" = "application/json" }
$body = @{ topic = "Artificial Intelligence"; tone = "witty" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/ai/generate" -Method POST -Headers $headers -Body $body
```
**Expected Outcome**: Returns formatted post content with emojis and hashtags.

### Test Case: Content Moderation Screening
```powershell
$body = @{ content = "You are a complete idiot and this is trash" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/ai/moderate" -Method POST -ContentType "application/json" -Body $body
```
**Expected Outcome**:
```json
{
  "flagged": true,
  "toxicity_score": 0.7,
  "reason": "Potentially offensive terms detected: idiot, trash"
}
```

---

## 7. Database Resilience & Fallback Testing

To verify the in-memory fallback mechanism:
1. Stop the local MongoDB service or set `MONGO_URI=mongodb://localhost:9999/dummy`.
2. Start the backend: `python run.py`.
3. **Observed Behavior**:
   - The server catches `ServerSelectionTimeoutError`.
   - Logs `[DB] Live MongoDB unreachable. Using mongomock in-memory database fallback`.
   - Automatically seeds the demo admin and posts.
   - All REST APIs continue responding normally without crashing.

---

## 8. Bug Reporting & Issue Triage

When reporting a bug in GitHub Issues, include:
1. **Operating System & Environment** (e.g. Windows 11, Node v22.14, Python 3.12).
2. **Steps to Reproduce**.
3. **Expected vs Actual Behavior**.
4. **Terminal Log Output** or browser console errors.
