# Axiom — AI Engineering Mentor Backend

Axiom is a FastAPI backend powering an AI engineering mentor agent. It uses Google Gemini 2.0 Flash with function/tool calling to give grounded, structured answers about System Design, Cloud Infrastructure (AWS, Kubernetes, Docker), and Networking internals. It supports 5 interaction modes: `ask`, `interview`, `quiz`, `debug`, and `threeam`.

## Setup

**1. Install dependencies**
```bash
pip install -r requirements.txt
```

**2. Configure environment**
```bash
cp .env.example .env
```

Open `.env` and set your `GEMINI_API_KEY`. Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

**3. Run locally**
```bash
uvicorn main:app --reload
```

The server starts at `http://localhost:8000`. At startup it fetches all 44 structured concepts from the Next.js app's `/api/concepts` endpoint to populate its knowledge cache.

## API

### `GET /health`
Returns `{ "status": "ok", "agent": "axiom", "version": "1.0.0" }`.

### `POST /api/agent`
Main endpoint. Returns a **Server-Sent Events (SSE)** stream.

**Request body:**
```json
{
  "mode": "ask",
  "message": "How does a CDN work and when should I use CloudFront vs Cloudflare?",
  "concept_id": "cdn",
  "history": [
    { "role": "user", "content": "What is caching?" },
    { "role": "assistant", "content": "Caching is..." }
  ],
  "memory": {
    "studied_concepts": ["caching", "loadbalancer"],
    "weak_areas": ["kubernetes", "vpc"],
    "strong_areas": ["databases"],
    "quiz_scores": { "cap": 80 },
    "interview_sessions": 2,
    "preferred_style": "analogies"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `mode` | `ask \| interview \| quiz \| debug \| threeam` | Interaction mode. Default: `ask` |
| `message` | string (1–600 chars) | The user's message |
| `concept_id` | string (optional) | ID of the concept currently open in the UI |
| `history` | array (max 6 turns) | Recent conversation turns for context |
| `memory` | object (optional) | User's learning profile for personalisation |

**SSE stream events:**

Each event is a JSON object on a `data:` line:

- `{ "chunk": "partial response text " }` — streamed text chunks
- `{ "done": true, "suggested_questions": [...], "memory_update": {...} }` — final metadata
- `{ "error": "message" }` — error event

### `GET /api/concepts/list`
Returns all 44 concept IDs and their titles/categories.

## Modes

| Mode | Description |
|---|---|
| `ask` | General Q&A, grounded in the app's concept library |
| `interview` | FAANG-style system design interview with live feedback |
| `quiz` | Adaptive multiple-choice questions with explanations |
| `debug` | Reviews a described system design for gaps and improvements |
| `threeam` | Incident response mode — calm, systematic, action-oriented |

## Rate Limits

- **20 requests per minute** per IP
- **100 requests per day** per IP

Exceeded limits return HTTP 429.

## Deploy to Railway

1. Push this directory to a GitHub repository.
2. Create a new Railway project and connect the repo.
3. Set the `GEMINI_API_KEY` environment variable in Railway's dashboard.
4. Set `NEXT_APP_URL` to your deployed Vercel URL (e.g. `https://system-design-app-mauve.vercel.app`).
5. Set `ALLOWED_ORIGINS` to `https://your-vercel-app.vercel.app,http://localhost:3000`.
6. Railway reads `railway.toml` automatically — no further config needed.

The health check at `/health` is used by Railway to verify the service is up before routing traffic.
