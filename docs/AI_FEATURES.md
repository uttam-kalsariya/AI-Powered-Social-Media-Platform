# 🤖 Artificial Intelligence Services & Integration Architecture

Comprehensive documentation on the machine learning and Large Language Model (LLM) capabilities powering the **AI-Powered Social Media Platform**.

---

## 📌 Table of Contents
- [1. AI Architecture Overview](#1-ai-architecture-overview)
- [2. Model Providers & Fallback Strategy](#2-model-providers--fallback-strategy)
- [3. Feature 1: AI Post & Caption Generation](#3-feature-1-ai-post--caption-generation)
- [4. Feature 2: 1-Click Tone Rewriting & Polish](#4-feature-2-1-click-tone-rewriting--polish)
- [5. Feature 3: Discussion Thread Summarization](#5-feature-3-discussion-thread-summarization)
- [6. Feature 4: Contextual Smart Replies](#6-feature-4-contextual-smart-replies)
- [7. Feature 5: AI Safety & Content Moderation](#7-feature-5-ai-safety--content-moderation)
- [8. Feature 6: Aura Conversational Assistant](#8-feature-6-aura-conversational-assistant)
- [9. Error Handling & Offline Reliability](#9-error-handling--offline-reliability)

---

## 1. AI Architecture Overview

The platform adopts a dual-tier AI architecture:
1. **Tier 1 (Cloud Primary)**: Google Gemini 1.5 Flash multimodal API via REST requests.
2. **Tier 2 (Local Heuristic Engine)**: An intelligent internal Python engine that handles copywriting patterns, contextual reply heuristics, and toxicity screening when no internet access or API key is present.

```mermaid
graph TD
    Client[React Client] -->|Topic / Text Payload| Endpoint[/api/ai/*]
    Endpoint --> Orchestrator[AI Service Orchestrator]

    Orchestrator --> KeyCheck{GEMINI_API_KEY Available?}
    KeyCheck -->|Yes| GeminiCall[Query Google Gemini 1.5 Flash API]
    KeyCheck -->|No / Offline| LocalEngine[Execute Local Heuristic Engine]

    GeminiCall --> SuccessCheck{HTTP 200 OK?}
    SuccessCheck -->|Success| ReturnResponse[Format JSON Response]
    SuccessCheck -->|Error / Timeout| LocalEngine

    LocalEngine --> ReturnResponse
    ReturnResponse --> Client
```

---

## 2. Model Providers & Fallback Strategy

- **Primary Cloud Provider**: Google Gemini 1.5 Flash (`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`)
- **Key Storage**: Configured strictly via `server/.env` (`GEMINI_API_KEY`).
- **Resilience Principle**: The application **never crashes** if an API key is omitted, exhausted, or encounters network downtime. The local fallback immediately takes over and returns rich, contextual suggestions.

---

## 3. Feature 1: AI Post & Caption Generation

Generates publication-ready social media posts with opening hooks, emojis, and relevant hashtags.

- **Endpoint**: `POST /api/ai/generate`
- **Supported Tones**:
  - `casual`: Friendly, everyday conversational tone.
  - `professional`: Structured, thought-leadership insight with industry hashtags.
  - `witty`: Humorous, engaging, lighthearted angle.
  - `inspirational`: Motivational, vision-driven narrative.
- **Output Sample**:
  ```text
  Nobody told me that getting into full-stack development would involve this much caffeine ☕✨
  
  Over the past few days, building out this platform has proven just how powerful clean architecture and community feedback truly are.
  
  What project milestones are you celebrating today? 👇
  
  #FullStack #Innovation #BuildInPublic
  ```

---

## 4. Feature 2: 1-Click Tone Rewriting & Polish

Allows users to draft rough thoughts and instantly polish them into punchy, clear posts matching their desired persona.

- **Endpoint**: `POST /api/ai/improve`
- **Input**:
  ```json
  {
    "content": "working on new code it is going ok i guess",
    "target_tone": "professional"
  }
  ```
- **Output**:
  ```json
  {
    "improved_content": "💡 Project Update: Making steady progress refactoring our core services today. Focusing on modularity and test coverage pays dividends long term. How does your team prioritize technical debt? #SoftwareEngineering #CleanCode",
    "provider": "Google Gemini 1.5 Flash"
  }
  ```

---

## 5. Feature 3: Discussion Thread Summarization

Reads a post body along with its threaded comments and extracts high-level community sentiment and discussion takeaways.

- **Endpoint**: `POST /api/ai/summarize`
- **Output Format**:
  ```markdown
  📌 **Key Theme**: Launching new AI content creator tools.
  💬 **Engagement**: 8 community responses.
  💡 **Sentiment**: Collaborative and highly enthusiastic regarding performance.
  ```

---

## 6. Feature 4: Contextual Smart Replies

Analyzes post content to formulate 3 natural, 1-click reply suggestions that populate the comment box for seamless social engagement.

- **Endpoint**: `POST /api/ai/smart-replies`
- **Example Response**:
  ```json
  {
    "replies": [
      "Huge congratulations on this milestone! 🚀",
      "Fascinating architecture! How did you approach the database fallback? 💡",
      "Bookmarked! Can't wait to test this out! 🔥"
    ]
  }
  ```

---

## 7. Feature 5: AI Safety & Content Moderation

Every newly published or updated post undergoes automated safety screening before entering the public feed.

- **Endpoint**: `POST /api/ai/moderate`
- **Screening Vectors**: Harassment, toxicity, spam patterns, profanity, and offensive terms.
- **Scoring**: Returns a normalized `toxicity_score` (`0.00` to `1.00`).
- **Action**: Posts with scores above threshold are tagged with `is_flagged: true` and routed to the **Admin Moderation Queue** for manual review.

---

## 8. Feature 6: Aura Conversational Assistant

A dedicated AI social media strategist accessible via the navigation bar.

- **Endpoint**: `POST /api/ai/chat`
- **Capabilities**:
  - Brainstorm viral topics and content calendars.
  - Critique existing post drafts and recommend punchier hooks.
  - Explain platform features and administrative tools.
  - Suggest hashtag strategies and optimal posting frequencies.

---

## 9. Error Handling & Offline Reliability

1. **Timeout Guards**: All external LLM requests enforce a strict 8-second timeout (`requests.post(..., timeout=8)`).
2. **Safe Fallback**: Any JSON parsing error or non-200 HTTP code automatically routes the user's prompt to the local heuristic generator.
3. **No Secret Leaks**: API keys are injected exclusively on the server side and are never exposed in browser network payloads.
