# 💻 Technology Stack & Architectural Decision Record

Detailed overview of the technology choices powering the **AI-Powered Social Media Platform**.

---

## 📌 Table of Contents
- [1. Technology Stack Summary](#1-technology-stack-summary)
- [2. Frontend Architecture](#2-frontend-architecture)
- [3. Backend Architecture](#3-backend-architecture)
- [4. Database & Storage Architecture](#4-database--storage-architecture)
- [5. Artificial Intelligence Services](#5-artificial-intelligence-services)
- [6. Development, Tooling & DevOps](#6-development-tooling--devops)
- [7. Technology Justifications](#7-technology-justifications)

---

## 1. Technology Stack Summary

```
Frontend:     React 19 + Vite 8 + Tailwind CSS + Lucide React + Axios
Backend:      Python 3.12 + Flask 3.0 + Flask-JWT-Extended + PyMongo + Bcrypt
Database:     MongoDB Atlas (Cloud Cluster) / mongomock (Testing Fallback)
AI Services:  Google Gemini 1.5 Flash API + Built-in Local Heuristic Engine
Email/Auth:   SMTP TLS Email Delivery / Flask-Mail compatibility
DevOps:       Git + GitHub + PowerShell
```

---

## 2. Frontend Architecture

| Technology | Version | Purpose |
|---|---|---|
| **React** | `^19.3.1` | Declarative, component-driven user interface library |
| **Vite** | `^8.3.5` | Next-generation frontend build tool offering instant HMR (Hot Module Replacement) |
| **Tailwind CSS** | `^3.4.17` | Utility-first CSS framework enabling rapid, highly customized UI design |
| **PostCSS & Autoprefixer**| `^8.5.6` | CSS compilation and cross-browser vendor prefix management |
| **Axios** | `^1.7.9` | Promise-based HTTP client with request/response interceptors |
| **React Router DOM** | `^7.2.0` | Declarative client-side routing and deep-linking |
| **Lucide React** | `^1.65.0` | Comprehensive, lightweight, accessible SVG icon set |

---

## 3. Backend Architecture

| Technology | Version | Purpose |
|---|---|---|
| **Python** | `3.12.10` | High-level, productive programming language for web and AI engineering |
| **Flask** | `3.0.3` | Lightweight, unopinionated WSGI web application framework |
| **Flask-JWT-Extended** | `4.6.0` | Industry-standard JSON Web Token generation, decoding, and route guards |
| **Flask-CORS** | `4.0.1` | Cross-Origin Resource Sharing handling for secure frontend API requests |
| **Bcrypt** | `4.1.3` | Strong, salted cryptographic password hashing algorithm |
| **Requests** | `2.32.3` | Synchronous HTTP library for querying external AI APIs (Gemini) |
| **Python-Dotenv** | `1.0.1` | Safe environment variable management parsing `.env` files |

---

## 4. Database & Storage Architecture

| Technology | Version | Purpose |
|---|---|---|
| **MongoDB Atlas** | v7.0+ | Fully managed cloud document database with high availability and scalability |
| **PyMongo** | `4.7.2` | Official Python distribution driver for MongoDB operations |
| **DNSPython** | `2.6.1` | DNS toolkit required for resolving `mongodb+srv://` connection strings |
| **Mongomock** | `4.1.2` | In-memory MongoDB mock library used for development and offline testing |

---

## 5. Artificial Intelligence Services

| Service | Model | Purpose |
|---|---|---|
| **Google Gemini API** | `gemini-1.5-flash` | State-of-the-art multimodal LLM used for post drafting, tone rewriting, and thread summarization |
| **Aura AI Engine** | Local Heuristic | Built-in offline fallback that handles caption styling, hooks, and keyword toxicity checks without external API dependencies |

---

## 6. Development, Tooling & DevOps

| Tool | Version | Purpose |
|---|---|---|
| **Git** | `2.49.0` | Distributed version control system |
| **GitHub** | Cloud | Remote repository hosting, branch tracking, and collaboration |
| **Node.js** | `v22.14.0` | JavaScript runtime environment for client-side tooling |
| **NPM** | `10.9.2` | JavaScript package manager |
| **PowerShell** | 7+ / 5.1 | Cross-platform shell on Windows 11 for build and script execution |

---

## 7. Technology Justifications

### Why React + Vite instead of Create React App?
- **Speed**: Vite leverages native ES modules and esbuild to deliver instant server starts and sub-millisecond hot module replacement, completely eliminating the sluggish build cycles of older bundlers.
- **Modern Ecosystem**: React 19 provides enhanced rendering ergonomics and concurrent mode primitives.

### Why Tailwind CSS?
- **Design Freedom**: Unlike rigid UI component frameworks (such as Bootstrap or Ant Design), Tailwind allows us to build bespoke, modern glassmorphic interfaces with custom gradients, blur effects, and responsive breakpoints directly in markup.
- **Zero Runtime Overhead**: Tailwind purges unused CSS classes during production build, creating bundles under 10 KB.

### Why Flask for the Backend?
- **Lightweight & Modular**: Flask provides an unbloated foundation where we can structure blueprints, services, and middleware exactly as required without Django's heavyweight ORM constraints.
- **Python AI Native**: Hosting the backend in Python eliminates cross-language bridges when interacting with AI libraries, LLM SDKs, or data science pipelines.

### Why MongoDB instead of SQL (PostgreSQL/MySQL)?
- **Social Media Document Flexibility**: Social media data (posts with polymorphic media, variable hashtags, embedded user snapshots, and comment trees) naturally maps to flexible JSON/BSON documents.
- **High Write Throughput**: MongoDB Atlas provides seamless horizontal scaling and fast schema evolutions as features expand.
