# 🚀 Installation & Local Environment Setup Guide

Step-by-step setup guide for running the **AI-Powered Social Media Platform** locally on **Windows 11** (and compatible with macOS/Linux).

---

## 📌 Table of Contents
- [1. Prerequisites](#1-prerequisites)
- [2. Cloning the Repository](#2-cloning-the-repository)
- [3. Backend Setup (Python & Flask)](#3-backend-setup-python--flask)
- [4. Frontend Setup (React & Vite)](#4-frontend-setup-react--vite)
- [5. MongoDB Atlas Database Configuration](#5-mongodb-atlas-database-configuration)
- [6. Running the Complete Application](#6-running-the-complete-application)
- [7. Verifying the Installation](#7-verifying-the-installation)
- [8. Troubleshooting Common Issues](#8-troubleshooting-common-issues)

---

## 1. Prerequisites

Before starting, ensure you have the following installed on Windows 11:

1. **Git**: [Download Git for Windows](https://git-scm.com/download/win) (Verify: `git --version`)
2. **Node.js (v18+ or v22+)**: [Download Node.js](https://nodejs.org/) (Verify: `node -v` and `npm -v`)
3. **Python (3.10, 3.11, or 3.12)**: [Download Python](https://www.python.org/downloads/)
   - *Important on Windows*: During installation, check the box: **"Add python.exe to PATH"**.
   - Verify: `py --version` or `python --version`

---

## 2. Cloning the Repository

Open **PowerShell** or **Command Prompt** and clone the project:

```powershell
git clone https://github.com/uttam-kalsariya/AI-Powered-Social-Media-Platform.git
cd "AI-Powered Social Media Platform"
```

---

## 3. Backend Setup (Python & Flask)

Navigate into the `server` directory (or `backend`):

```powershell
cd server
```

### 3.1 Create and Activate a Python Virtual Environment

```powershell
# Create virtual environment
py -m venv venv

# Activate virtual environment on Windows PowerShell:
.\venv\Scripts\Activate.ps1

# (If PowerShell gives an ExecutionPolicy error, run once:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
```

### 3.2 Install Backend Dependencies

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.3 Configure Environment Variables

Create your `.env` configuration file inside `server/`:

```powershell
Copy-Item .env.example .env
```

Open `server/.env` and adjust the variables as needed:

```env
PORT=5000
SECRET_KEY=dev-secret-key-change-in-production-12345
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production-67890

# MongoDB Connection String (Atlas or Local):
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-address>.mongodb.net/social_media_db?retryWrites=true&w=majority

# Optional: Google Gemini API Key for online AI generation
GEMINI_API_KEY=

# Optional: SMTP Configuration for real email sending
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@aisocial.local
```

> **Note**: If `MONGO_URI` is left default or MongoDB is unreachable, the server automatically boots into an in-memory development database without crashing!

---

## 4. Frontend Setup (React & Vite)

Open a **second terminal window** and navigate to the `client` folder:

```powershell
cd "AI-Powered Social Media Platform\client"
```

### 4.1 Install Node Dependencies

```powershell
npm install
```

---

## 5. MongoDB Atlas Database Configuration

If using MongoDB Atlas:

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Free Shared Cluster (M0).
3. Under **Security > Database Access**, add a database user with read/write privileges.
4. Under **Security > Network Access**, add your current IP address (or `0.0.0.0/0` for development).
5. Click **Connect > Drivers > Python (3.12 or later)**.
6. Copy the connection string and paste it into `server/.env` as `MONGO_URI`.

---

## 6. Running the Complete Application

### Terminal 1: Start the Backend Server

```powershell
cd "AI-Powered Social Media Platform\server"
.\venv\Scripts\activate
python run.py
```
*The backend API will start on: **`http://127.0.0.1:5000`***

### Terminal 2: Start the Frontend Development Server

```powershell
cd "AI-Powered Social Media Platform\client"
npm run dev
```
*The React application will start on: **`http://localhost:3000`***

---

## 7. Verifying the Installation

1. Open your browser and navigate to **`http://localhost:3000`**.
2. Click **"Sign In / Register"** in the top navigation bar.
3. Test with the pre-seeded instant demo credentials:
   - **Administrator**: `admin` / `AdminPass123!`
   - **Standard User**: `alex_innovator` / `UserPass123!`
4. Verify the backend health endpoint by opening **`http://127.0.0.1:5000/api/health`** in your browser.

---

## 8. Troubleshooting Common Issues

### Issue 1: `Activate.ps1 cannot be loaded because running scripts is disabled`
**Solution**:
Run this command in PowerShell before activating:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

### Issue 2: `Python was not found; run without arguments to install...`
**Solution**:
Use the Windows Python launcher:
```powershell
py -m venv venv
```

### Issue 3: `Port 5000 already in use`
**Solution**:
Check what process is holding port 5000 or change `PORT=5001` in `server/.env` and update the proxy target in `client/vite.config.js`.

### Issue 4: `ModuleNotFoundError: No module named 'app'`
**Solution**:
Ensure you execute `python run.py` directly from inside the `server/` directory where `run.py` is located.
