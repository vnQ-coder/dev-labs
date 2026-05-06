# Axiom AI Mentor — Design Spec
**Date:** 2026-05-06  
**Status:** Approved — implementation in progress

## Overview
Axiom is a compound AI engineering mentor agent integrated into System Design Lab. It uses Google Gemini 2.0 Flash with function/tool calling to ground answers in the app's 44 structured concepts. Built with a Python FastAPI backend and React frontend.

## Agent Identity
- **Name:** Axiom
- **Model:** Gemini 2.0 Flash (free tier) → Gemini 2.5 Pro (paid credits)
- **Backend:** Python FastAPI on Railway
- **Frontend:** Next.js dedicated page + floating contextual panel

## Five Modes
1. **Ask Anything** (default) — Cross-domain Q&A grounded in app concepts
2. **Interview Simulation** — FAANG-style system design interview with scoring
3. **Adaptive Quiz** — AI-generated MCQ based on user progress and memory
4. **Debug My Design** — Architecture review against real-world systems
5. **3AM Debug** — Live incident response with terminal commands

## Domain Coverage
- System Design (44 concepts across 8 categories)
- Cloud Infrastructure (AWS, Kubernetes, Docker, ECS, EKS, ECR)
- Networking & Internet Internals (Behind the Scenes module)

## Memory Architecture
- Stored in browser localStorage under key `axiom-memory-v1`
- Sent as compact summary on each API call
- Agent returns `memory_update` object after sessions
- No database required

## Security — 5 Layers
1. API key server-side only (Railway env vars)
2. Rate limiting: 20 req/min, 100/day per IP (SlowAPI)
3. Prompt injection isolation ([USER_INPUT] tagging)
4. Input validation: max 600 chars, HTML stripped (Pydantic + bleach)
5. CORS restricted to Vercel domain + output schema validation

## Tool Functions
- `get_concept(concept_id)` — retrieves full concept from /api/concepts cache
- `search_concepts(query)` — keyword search across all concepts
- `get_real_world_system(system_name)` — Netflix, Uber, Discord patterns

## Placement
- Dedicated page: `/lab?view=mentor` (Axiom Mentor in sidebar)
- Floating panel: appears on all ConceptPage renders (contextual)

## API Contract
```
POST /api/agent
{
  "mode": "ask|interview|quiz|debug|threeam",
  "message": string (max 600 chars),
  "concept_id": string | null,
  "memory": MemorySummary,
  "history": ConversationTurn[] (max 6)
}

Response: SSE stream
  data: {"chunk": "..."} — text chunk
  data: {"done": true, "suggested_questions": [], "memory_update": {...}} — final
```

## Deployment
- Backend: Railway (free tier, connect GitHub, set GEMINI_API_KEY)
- Frontend env: NEXT_PUBLIC_AXIOM_URL=https://your-railway-url.up.railway.app
- Vercel: add NEXT_PUBLIC_AXIOM_URL to project env vars

## Market Positioning
Only learning platform with cross-domain AI spanning system design + cloud + networking. Answers grounded in structured concept data via tool calling — cannot hallucinate app concepts. Persistent memory without a database.
