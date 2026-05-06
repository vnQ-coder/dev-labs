# Personalised Onboarding & Learning Path — Design Spec

**Date:** 2026-05-06  
**Status:** Approved — ready for implementation  
**Feature:** Developer onboarding flow with AI-generated personalised learning path

---

## 1. Problem

Every user lands on System Design Lab with zero context about who they are or what they need. A junior React developer pivoting to backend roles and a senior DevOps engineer prepping for a Staff interview get the same generic experience — the same concept list, the same Axiom greeting, the same sidebar. This is a library, not a tutor.

The result: low retention, no sense of progress, and an AI mentor that has to start from scratch every conversation.

---

## 2. Solution

A blocking first-visit onboarding modal that collects name, current stack, target stack, target role, and optional background context. Axiom uses this to immediately generate a personalised learning path (ordered concept IDs, grouped into phases) and open a mentor greeting that already knows who the user is and why they're here.

---

## 3. Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Onboarding entry point | Blocking first-visit modal | Devs arriving with job-search intent have high motivation; guaranteed profile completion |
| Post-onboarding experience | Path page + mentor greeting together | Retention play (checklist) + delight play (personal coach) simultaneously |
| CV / background collection | Free-text paste (no file upload) | Zero extra dependencies, no privacy surface area, doubles as job-description input |
| Architecture | Pure client-side, localStorage | No auth system exists; cross-device persistence is a v2 problem |
| Learning path content | Strict — only real concept IDs from CONCEPT_META | Eliminates hallucination risk; every path item is a working link |

---

## 4. User Journey

```
First visit
    │
    ▼
Blocking modal appears (cannot be escaped)
    │
    ├── Step 1: Name + current stack (tag input)
    ├── Step 2: Target role (dropdown) + target stack (tag input)
    └── Step 3: Background context (textarea, optional)
              "Paste your experience, skills, or a job description"
    │
    ▼
"Generate my path" → single Gemini call (onboard mode)
    │   Agent receives: profile + full CONCEPT_META list
    │   Agent returns: JSON { phases: [{ label, concepts: conceptId[] }] }
    │
    ▼
Path page loads (split layout)
    ├── LEFT: Ordered concept path with phases, progress, SKILL GAP badges
    └── RIGHT: Axiom mentor — personalised greeting already streaming
    │
    ▼
User continues from "My Path" nav item on every return visit
```

---

## 5. Data Model

### UserProfile (new — `axiom-profile-v1` in localStorage)

```typescript
interface UserProfile {
  name: string;
  currentStack: string[];       // e.g. ["React", "TypeScript", "Node.js"]
  targetStack: string[];        // e.g. ["Go", "Kubernetes", "PostgreSQL"]
  targetRole: string;           // e.g. "Backend Engineer"
  backgroundText: string;       // free text, may be empty
  createdAt: string;            // ISO timestamp
}
```

### LearningPath (new — `axiom-path-v1` in localStorage)

```typescript
interface PathConcept {
  conceptId: string;            // must exist in CONCEPT_META
  isSkillGap: boolean;          // true = agent flagged as gap from background text
}

interface PathPhase {
  label: string;                // e.g. "Phase 1 — Foundations"
  color: string;                // hex for phase accent
  concepts: PathConcept[];
}

interface LearningPath {
  generatedAt: string;          // ISO timestamp
  targetRole: string;           // denormalised for display
  phases: PathPhase[];
  totalConcepts: number;        // sum across all phases
}
```

### Updates to AxiomMemory (existing `axiom-memory-v1`)

Add profile fields so the memory hook can provide name and role to every agent call:

```typescript
// hooks/useMemory.ts — add these fields to AxiomMemory interface and DEFAULT_MEMORY
display_name: string;          // NEW — e.g. "Muhammad" — sourced from UserProfile.name on onboarding complete
target_role: string;           // NEW — e.g. "Backend Engineer" — sourced from UserProfile.targetRole
```

### Updates to MemorySummary (existing Python model)

The Python `MemorySummary` must also carry these fields so `build_system_prompt()` can inject the profile:

```python
# axiom-backend/models.py — add to MemorySummary
display_name: str = ""         # NEW
target_role: str = ""          # NEW
```

---

## 6. Components

### New Components

| Component | File | Purpose |
|---|---|---|
| `OnboardingModal` | `components/OnboardingModal.tsx` | 3-step blocking modal, manages form state, triggers path generation |
| `TagInput` | `components/TagInput.tsx` | Reusable tag input for current/target stack fields |
| `PathPage` | `components/PathPage.tsx` | Full split-panel page: path list left + mentor right |
| `PathPanel` | `components/PathPanel.tsx` | Left panel — phases, concept rows, progress bar, skill gap badges |
| `ConceptRow` | `components/ConceptRow.tsx` | Single concept row: status icon, name, tag, badge, click-to-navigate |

### Modified Components

| Component | Change |
|---|---|
| `components/Hero.tsx` | Mount `OnboardingModal` — checks `axiom-profile-v1` in localStorage; renders modal if absent |
| `hooks/useMemory.ts` | Add `target_role` and `display_name` fields; populate from profile on load |
| `hooks/useAxiom.ts` | Include `display_name` and `target_role` in every `memorySummary` sent to API |
| `components/Sidebar.tsx` | Add "My Path" nav item (top); add profile card at bottom (name, role, stack tags, "Edit profile" link) |
| `axiom-backend/agent.py` | Add `"onboard"` and `"path_greeting"` to MODE_PROMPTS; add profile injection block in `build_system_prompt()` |
| `axiom-backend/models.py` | Add `"onboard"` and `"path_greeting"` to mode Literal; add `display_name: str = ""` and `target_role: str = ""` to `MemorySummary` |

### New Hook

| Hook | File | Purpose |
|---|---|---|
| `useLearningPath` | `hooks/useLearningPath.ts` | Load/save `axiom-path-v1`; track per-concept completion; expose `markConceptDone`, `completedCount`, `totalConcepts` |

---

## 7. Onboarding Modal — Detailed Spec

**Trigger:** On app mount, `Hero.tsx` checks localStorage for `axiom-profile-v1`. If absent, renders `<OnboardingModal />`.

**Layout:** All 3 steps visible simultaneously on one screen. Active step at full opacity; future steps dimmed (opacity 0.35, 0.25). Progress bar at top (3 segments). No "next" button between steps — user fills naturally top to bottom.

**Escape key:** Disabled while modal is open. No backdrop click to dismiss.

**Fields:**

| Step | Field | Type | Required | Notes |
|---|---|---|---|---|
| 1 | Name | Text input | Yes | Used in Axiom greetings |
| 1 | Current stack | TagInput | Yes | Min 1 tag; suggestions: React, Node.js, Python, Go, Java, TypeScript, etc. |
| 2 | Target role | Dropdown | Yes | Options: Backend Engineer, DevOps Engineer, Full Stack Engineer, Staff/Principal SWE, Cloud/Infrastructure Engineer, SRE |
| 2 | Target stack | TagInput | No | Technologies they want to learn |
| 3 | Background context | Textarea | No | Placeholder: "Paste your experience, current skills, or the job description you're targeting" |

**Submit button text:** "Generate my path →" (Step 3 level, or a "Skip & generate" link if Step 3 is empty)

**On submit:**
1. Validate Step 1 + 2 fields
2. Save `UserProfile` to localStorage (`axiom-profile-v1`)
3. Update `AxiomMemory` with `display_name` and `target_role`
4. Call `generateLearningPath(profile)` — see Section 8
5. Show inline loading state: spinning ring + rotating phrases ("Mapping your gaps…", "Ordering concepts…", "Building your path…")
6. On success: save `LearningPath` to localStorage, navigate to `/path`

---

## 8. Learning Path Generation

**Agent call** — uses existing `/api/agent` endpoint with `mode: "onboard"`.

**New MODE_PROMPT for `"onboard"`:**

```
You are generating a personalised learning path. You will receive a developer profile and the complete list of available concept IDs. Return ONLY a valid JSON object — no markdown, no explanation, just JSON.

The JSON must match this shape exactly:
{
  "phases": [
    {
      "label": "Phase 1 — Foundations",
      "color": "#10b981",
      "concepts": [
        { "conceptId": "apigateway", "isSkillGap": false },
        { "conceptId": "loadbalancer", "isSkillGap": true }
      ]
    }
  ]
}

Rules:
- Every conceptId MUST be from the provided list. No exceptions.
- 3 phases maximum. 3–5 concepts per phase. Total 9–14 concepts.
- Order phases: Foundations → Role-specific depth → Interview prep
- Mark isSkillGap: true for concepts the user's background text suggests they haven't encountered
- Phase labels must include the phase number and a short theme name
- Assign colors: Phase 1 = #10b981, Phase 2 = #f59e0b, Phase 3 = #f87171
```

**Message sent to agent:**

```
[USER_INPUT]
Profile:
- Name: {name}
- Current stack: {currentStack.join(', ')}
- Target role: {targetRole}
- Target stack: {targetStack.join(', ')}
- Background: {backgroundText || 'Not provided'}

Available concept IDs: {Object.keys(CONCEPT_META).join(', ')}

Generate the learning path JSON now.
[/USER_INPUT]
```

**Response parsing:** The agent's full response is `JSON.parse()`d. If parsing fails, retry once. If retry fails, fall back to a hardcoded default path based on target role (see fallback map in implementation plan).

**Streaming resolution:** The existing `/api/agent` endpoint always streams via SSE. For the onboard call, the frontend reads all SSE chunks, concatenates them into `full_response`, then parses the JSON from the final assembled string — same as how the agent already tracks `full_response` internally. No new endpoint needed. The modal loading spinner runs until all chunks are received and the `done: true` event fires.

---

## 9. Path Page — Detailed Spec

**Route:** `/path` — new Next.js page at `app/path/page.tsx`

**Layout:** Three-column shell — sidebar (220px) + path panel (380px) + mentor panel (flex 1)

### Path Panel (left)

- Header: path title ("Backend Engineer Path"), subtitle ("Axiom-curated · {date}"), progress bar, "X of Y concepts complete · ~Zh remaining"
- Estimated time: 1h per concept (simple heuristic, not shown per-concept)
- Phases rendered in order with phase label + colour accent
- Concept rows: connector lines between them (vertical 1px line, 8px tall)
- Concept row states:
  - **Done:** green check, muted background, DONE badge
  - **Up Next:** indigo arrow, active border glow, UP NEXT badge  
  - **Locked:** dimmed (opacity 0.4), no interaction
  - **Skill Gap (locked):** SKILL GAP badge in red, still locked until unlocked by sequence
- Clicking any non-locked concept navigates to its `ConceptPage`
- Marking a concept done: `useLearningPath.markConceptDone(conceptId)` — unlocks the next concept in sequence

### Mentor Panel (right)

- Same Axiom mentor UI as `MentorPage.tsx` — reuse all components
- On mount: auto-sends a hidden system message to generate the personalised greeting
- Greeting is constructed via a special `"path_greeting"` mode call — not a user-visible message, just the first assistant turn
- Greeting content covers: name greeting, profile summary, biggest skill gaps identified, recommended first concept, offer to explain path ordering
- Suggested pills pre-loaded: "Why this order?", "What's my biggest gap?", "How long to be interview-ready?"
- All 5 modes available (ask, interview, quiz, debug, 3am) — defaults to ask

### Sidebar additions

- "My Path" appears as first nav item with a filled dot indicator
- Profile card at bottom:
  - Name + target role
  - Current stack tags (up to 4, then "+N more")
  - "Edit profile →" link — clicking re-opens OnboardingModal pre-filled with existing values; re-generates path on save

---

## 10. Axiom System Prompt — Profile Injection

Every agent call (not just onboard mode) gets the user's profile injected into the system prompt when available:

```python
# In build_system_prompt(), after memory_str:
profile_context = ""
if memory and memory.display_name:
    profile_context = f"""
## USER PROFILE
- Name: {memory.display_name}
- Target role: {memory.target_role}
"""
```

This means Axiom addresses users by name and frames every answer in the context of their target role from the very first message — in the floating mentor, on concept pages, everywhere.

---

## 11. Edge Cases

| Scenario | Handling |
|---|---|
| Path generation fails (API error) | Show error state in modal with retry button; do not navigate away |
| Agent returns invalid JSON | Retry once; if still invalid, use role-based hardcoded fallback path |
| User has already viewed some concepts before onboarding | `useLearningPath` checks `useProgress` (existing `sdl-viewed-concepts` key) and auto-marks matching concepts as done |
| User wants to regenerate path | "Edit profile →" in sidebar re-opens modal pre-filled; saving triggers new path generation and replaces `axiom-path-v1` |
| Concept in generated path no longer exists in CONCEPT_META | Filter it out silently in `useLearningPath` on load |
| User clears localStorage | Profile and path are gone; modal re-appears on next visit — treated as a fresh user |

---

## 12. What This Is Not (Scope Boundaries)

- **No file upload** — CV upload is v2. Text paste only.
- **No backend storage** — profile and path live in localStorage only. Cross-device sync is v2.
- **No auth** — no user accounts, no server-side profile persistence.
- **No adaptive path re-ordering** — the path is generated once and is static until the user edits their profile. Dynamic re-ordering based on quiz scores is v3.
- **No sharing** — no shareable profile links or path export in v1.

---

## 13. Success Metrics (post-launch)

- **Onboarding completion rate** — % of new visitors who complete all 3 steps
- **Path engagement** — % of users who click at least 2 concepts from their generated path
- **Return visit rate** — users who return to `/path` on day 2 and day 7
- **Mentor engagement from path page** — messages sent from the path page mentor vs the standalone mentor page

---

## 14. Files to Create / Modify

### Create
- `components/OnboardingModal.tsx`
- `components/TagInput.tsx`
- `components/PathPage.tsx`
- `components/PathPanel.tsx`
- `components/ConceptRow.tsx`
- `hooks/useLearningPath.ts`
- `app/path/page.tsx`

### Modify
- `components/Hero.tsx` — mount OnboardingModal
- `components/Sidebar.tsx` — My Path nav + profile card
- `hooks/useMemory.ts` — add display_name, target_role fields
- `hooks/useAxiom.ts` — include display_name, target_role in memorySummary
- `axiom-backend/agent.py` — add onboard mode prompt + profile injection in build_system_prompt
- `axiom-backend/models.py` — add "onboard" to mode Literal
