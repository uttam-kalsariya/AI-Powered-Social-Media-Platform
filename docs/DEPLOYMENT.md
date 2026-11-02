# 🚀 Production Deployment & Cloud Hosting Guide

Step-by-step instructions for deploying the **AI-Powered Social Media Platform** to cloud hosting platforms (**Render**, **Vercel**, and **MongoDB Atlas**).

---

## 📌 Table of Contents
- [1. Deployment Architecture](#1-deployment-architecture)
- [2. MongoDB Atlas Production Configuration](#2-mongodb-atlas-production-configuration)
- [3. Backend Deployment (Render)](#3-backend-deployment-render)
- [4. Frontend Deployment (Vercel)](#4-frontend-deployment-vercel)
- [5. Environment Variables Checklist](#5-environment-variables-checklist)
- [6. Pre-flight Verification Script](#6-pre-flight-verification-script)
- [7. Common Deployment Pitfalls & Solutions](#7-common-deployment-pitfalls--solutions)

---

## 1. Deployment Architecture

```mermaid
graph LR
    Browser[Client Web Browser] -->|HTTPS Requests| Vercel[Vercel Frontend CDN]
    Vercel -->|API Requests /api/*| Render[Render Flask Web Service]
    Render -->|Encrypted TLS / Certifi CA| Atlas[(MongoDB Atlas Cluster)]
    Render -->|AI Requests| Gemini[Google Gemini API]
    Render -->|Email OTP Delivery| Resend[Resend API]
```

- **Frontend**: Hosted on **Vercel** with global edge CDN delivery.
- **Backend API**: Hosted on **Render** running Gunicorn WSGI server on Python 3.11.9.
- **Database**: Hosted on **MongoDB Atlas** with automatic daily backups and IP allowlists.
- **Email Service**: **Resend** for OTP and transactional security alerts.

---

## 2. MongoDB Atlas Production Configuration

1. **Configure Network Access (Crucial for Render)**:
   - Go to **Security > Network Access**.
   - Because Render web services use dynamic outbound IP addresses, you **must** allow access from anywhere:
     - Click **Add IP Address** -> Select **Allow Access from Anywhere** (`0.0.0.0/0`).
     - Comment: `Render dynamic outbound IPs`.
     - Click **Confirm**. Wait until status becomes **Active**.
   > [!IMPORTANT]
   > Omitting `0.0.0.0/0` causes MongoDB Atlas to terminate the TLS handshake during negotiation, resulting in `[SSL: TLSV1_ALERT_INTERNAL_ERROR]`.

2. **Create Dedicated Database User**:
   - Go to **Security > Database Access**.
   - Create a database user (e.g. `uttamkalsariya1002_db_user`) with `readWriteAnyDatabase` or `dbOwner` privilege.
   - Avoid special characters (`@`, `:`, `#`, `%`) in the password, or URL-encode them.

3. **Cluster Status**:
   - Ensure the cluster is **Active** (not paused or resuming).

4. **Copy Connection URI**:
   - Format:
     ```text
     mongodb+srv://<username>:<password>@cluster0.cq68ujv.mongodb.net/ai_social_media?retryWrites=true&w=majority&appName=Cluster0
     ```

---

## 3. Backend Deployment (Render)

### 3.1 Web Service Configuration
1. Connect your GitHub repository to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Configure the following parameters:
   - **Name**: `ai-social-media-api`
   - **Root Directory**: `server` (or leave empty if deploying from repo root)
   - **Runtime**: `Python 3`
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
     ```

### 3.2 Health Check Configuration
Render performs periodic health checks to verify service availability. The backend provides dedicated endpoints:
- **Health Check Path**: `/` or `/health`
- **Method**: Render probes using `HEAD /`. The app responds with `200 OK` (`{"status": "ok"}`).
- **Database Ping**: `/health` performs a live `client.admin.command('ping')` to verify MongoDB connectivity before returning 200.

---

## 4. Frontend Deployment (Vercel)

1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Select your repository: `AI-Powered-Social-Media-Platform`.
3. Set **Root Directory** to `client`.
4. **Framework Preset**: `Vite`.
5. **Build Command**: `npm run build`.
6. **Output Directory**: `dist`.
7. Configure `client/vercel.json` to proxy API requests to your Render service:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://<your-render-app>.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

---

## 5. Environment Variables Checklist

Set these environment variables in your **Render Web Service Settings**:

| Variable | Value / Format | Purpose |
|---|---|---|
| `PYTHON_VERSION` | `3.11.9` | Locks the exact Python runtime on Render |
| `PORT` | `10000` | Auto-provided by Render |
| `MONGO_URI` | `mongodb+srv://<user>:<pass>@cluster0.cq68ujv.mongodb.net/ai_social_media?retryWrites=true&w=majority` | Atlas SRV connection string |
| `MONGO_DB_NAME` | `ai_social_media` | Target MongoDB database |
| `USE_MOCK_DB` | `false` | Prevents fallback to in-memory mock in production |
| `SECRET_KEY` | *(Random 32+ character string)* | Session and CSRF encryption |
| `JWT_SECRET_KEY` | *(Random 32+ character string)* | JWT signature verification |
| `RESEND_API_KEY` | `re_Y16C36qG_...` | Real-time OTP email delivery |
| `MAIL_FROM` | `AI Social <onboarding@resend.dev>` | Email sender identity |
| `REQUIRE_EMAIL_VERIFICATION` | `true` | Enforce email verification for new accounts |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini 1.5 Flash API access |

---

## 6. Pre-flight Verification Script

Before deploying or whenever troubleshooting database reachability, run the included diagnostic script locally or in the Render Shell:

```bash
python test_mongo.py
```

### Expected Output:
```text
=================================================================
  MongoDB Atlas Connection Diagnostic & Pre-flight Check
=================================================================

[1/4] Target URI: mongodb+srv://uttamkalsariya1002_db_user:****@cluster0.cq68ujv.mongodb.net/ai_social_media
[2/4] Dependencies verified:
      - certifi CA bundle: .../certifi/cacert.pem
      - dnspython: OK (required for mongodb+srv://)

[3/4] Initiating connection to MongoDB Atlas...
      ✅ Ping successful in 142.5ms! Response: {'ok': 1.0}
      Cluster MongoDB Version: 7.0.12

[4/4] Verifying read & write permissions...
      ✅ Insert OK (doc id: 67265a...)
      ✅ Read OK
      ✅ Cleanup OK

=================================================================
  🎉 ALL CHECKS PASSED: Atlas is reachable and fully functional!
=================================================================
```

---

## 7. Common Deployment Pitfalls & Solutions

| Symptom | Cause | Solution |
|---|---|---|
| `[SSL: TLSV1_ALERT_INTERNAL_ERROR]` | Atlas IP allowlist does not include Render's outbound IP. | Add `0.0.0.0/0` in Atlas **Network Access**. |
| Data vanishes after Render restart | App fell back to in-memory `mongomock`. | Set `USE_MOCK_DB=false`. Check `test_mongo.py` logs to fix Atlas URI. |
| Health check returns `404` on Render | Render sends `HEAD /` probe. | Handled by `@app.route('/', methods=['GET', 'HEAD'])` in `server/app/__init__.py`. |
| `ConfigurationError: ... dnspython` | `dnspython` missing for `mongodb+srv://`. | Pinned `dnspython==2.6.1` in `requirements.txt`. |
| SSL certificate verify failed | Missing CA bundle in container. | Connection uses `certifi.where()` as `tlsCAFile`. |
