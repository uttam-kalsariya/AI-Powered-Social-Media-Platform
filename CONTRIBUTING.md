# 🤝 Contributing to AI-Powered Social Media Platform

We welcome contributions from the community! Please follow these guidelines to ensure a smooth, high-quality collaboration process.

---

## 📌 Table of Contents
- [1. Code of Conduct](#1-code-of-conduct)
- [2. Git Workflow](#2-git-workflow)
- [3. Branch Naming Conventions](#3-branch-naming-conventions)
- [4. Commit Message Guidelines](#4-commit-message-guidelines)
- [5. Submitting a Pull Request](#5-submitting-a-pull-request)
- [6. Code Style & Standards](#6-code-style--standards)

---

## 1. Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level. Please remain respectful, constructive, and collaborative.

---

## 2. Git Workflow

1. **Fork the Repository**: Create your own copy of the repository on GitHub.
2. **Clone your Fork**:
   ```bash
   git clone https://github.com/<your-username>/AI-Powered-Social-Media-Platform.git
   cd "AI-Powered Social Media Platform"
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/direct-messaging
   ```
4. **Make Your Changes**: Write clean, modular, and documented code.
5. **Test Your Changes**: Verify that both the frontend (`npm run build`) and backend tests pass.
6. **Commit & Push**:
   ```bash
   git push origin feature/direct-messaging
   ```
7. **Open a Pull Request**: Submit your PR targeting the `main` branch.

---

## 3. Branch Naming Conventions

Use standardized prefixes for branch names:

| Prefix | Description | Example |
|---|---|---|
| `feature/` | New functionality or user-facing feature | `feature/user-follow-system` |
| `bugfix/` | Bug or issue resolution | `bugfix/fix-comment-count-update` |
| `docs/` | Documentation additions or edits | `docs/update-installation-guide` |
| `refactor/`| Code improvements without behavior changes | `refactor/optimize-db-queries` |
| `test/` | Adding or updating unit tests | `test/add-auth-unit-tests` |

---

## 4. Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <short description>
```

### Examples:
- `feat(auth): implement tokenized password reset flow`
- `fix(posts): resolve race condition in like toggle count`
- `docs(api): document contextual smart replies endpoint`
- `style(ui): improve glassmorphic panel contrast and padding`
- `refactor(db): extract MongoDB client factory to db.py`

---

## 5. Submitting a Pull Request

1. **Title**: Provide a concise summary following commit conventions.
2. **Description**:
   - What problem does this PR solve?
   - What changes were introduced?
   - Any relevant screenshots or terminal verification outputs.
3. **Checklist**:
   - [ ] No secrets or `.env` files are tracked.
   - [ ] Code builds cleanly without warnings (`npm run build`).
   - [ ] New endpoints or utilities are documented.

---

## 6. Code Style & Standards

- **Frontend**:
  - Keep components modular, focused, and reusable.
  - Use Tailwind CSS classes for styling; preserve the established glassmorphic dark theme tokens.
- **Backend**:
  - Adhere to PEP 8 Python coding standards.
  - Return standardized JSON responses using `jsonify()`.
  - Validate all incoming request payloads before performing database operations.
