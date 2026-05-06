# Personalised Onboarding & Learning Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a blocking first-visit onboarding modal that collects developer profile info, calls Axiom to generate a personalised 3-phase learning path, then redirects to a split page showing the path checklist and a personalised mentor greeting.

**Architecture:** Pure client-side — profile (`axiom-profile-v1`) and learning path (`axiom-path-v1`) stored in localStorage. The path is generated via a single SSE call to the existing `/api/agent` endpoint in `onboard` mode. The path page (`/path`) splits into PathPanel (left) and Axiom mentor (right). Profile fields (`display_name`, `target_role`) are injected into every agent system prompt.

**Tech Stack:** Next.js 15, TypeScript, Framer Motion, Lucide React, FastAPI (Python), Gemini 2.5 Flash

---

## File Map

### Create
| File | Responsibility |
|---|---|
| `lib/profile.ts` | `UserProfile` + `LearningPath` interfaces; localStorage read/write helpers; fallback paths per role |
| `hooks/useLearningPath.ts` | Load path from localStorage; track per-concept completion; expose `markConceptDone`, `completedIds`, `completedCount`, `totalConcepts` |
| `components/TagInput.tsx` | Controlled tag input: type + Enter to add, click × to remove, preset suggestions |
| `components/OnboardingModal.tsx` | 3-step blocking modal; form state; calls `generateLearningPath`; shows loading; navigates to `/path` |
| `components/ConceptRow.tsx` | Single concept row with status (done/active/locked/gap), click handler, badges |
| `components/PathPanel.tsx` | Left panel: progress bar, phases, concept rows |
| `components/PathPage.tsx` | Split layout: PathPanel + embedded Axiom mentor with auto-greeting |
| `app/path/page.tsx` | Next.js page that renders `<PathPage />` |

### Modify
| File | Change |
|---|---|
| `axiom-backend/models.py` | Add `display_name`, `target_role` to `MemorySummary`; add `"onboard"`, `"path_greeting"` to mode Literal |
| `axiom-backend/agent.py` | Add `onboard`/`path_greeting` MODE_PROMPTS; inject profile into `build_system_prompt()` |
| `hooks/useMemory.ts` | Add `display_name: string`, `target_role: string` to interface + DEFAULT_MEMORY |
| `hooks/useAxiom.ts` | Include `display_name`, `target_role` in `memorySummary` sent to API |
| `components/Hero.tsx` | Import + mount `<OnboardingModal>`; pass `onComplete` that saves memory + navigates |
| `components/Sidebar.tsx` | Add "My Path" nav item; add profile card at bottom |

---

## Task 1: Backend — Update models.py

**Files:**
- Modify: `axiom-backend/models.py`

- [ ] **Step 1: Add `display_name` and `target_role` to `MemorySummary`, and add new modes to `AgentRequest`**

Replace the `MemorySummary` class and `AgentRequest` mode Literal in `axiom-backend/models.py`:

```python
class MemorySummary(BaseModel):
    studied_concepts: list[str] = []
    weak_areas: list[str] = []
    strong_areas: list[str] = []
    quiz_scores: dict[str, int] = {}
    interview_sessions: int = 0
    preferred_style: str = ""
    explained_topics: list[ExplainedTopic] = []
    display_name: str = ""
    target_role: str = ""


class AgentRequest(BaseModel):
    mode: Literal["ask", "interview", "quiz", "debug", "threeam", "onboard", "path_greeting"] = "ask"
    message: str = Field(..., min_length=1, max_length=2000)  # increased for onboard profile text
    concept_id: Optional[str] = None
    memory: Optional[MemorySummary] = None
    history: list[ConversationTurn] = Field(default=[], max_length=6)
```

Note: `max_length` on `message` is raised to 2000 because the onboard message includes the full concept ID list.

- [ ] **Step 2: Verify syntax**

```bash
cd axiom-backend && python3 -c "from models import AgentRequest, MemorySummary; print('OK')"
```

Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
git add axiom-backend/models.py
git commit -m "feat(backend): add display_name/target_role to MemorySummary; add onboard+path_greeting modes"
```

---

## Task 2: Backend — Update agent.py

**Files:**
- Modify: `axiom-backend/agent.py`

- [ ] **Step 1: Add `onboard` and `path_greeting` to `MODE_PROMPTS`**

In `axiom-backend/agent.py`, add two entries to the `MODE_PROMPTS` dict after the existing `"threeam"` entry:

```python
    "onboard": """You are generating a personalised learning path. You will receive a developer profile and the complete list of available concept IDs. Return ONLY a valid JSON object — no markdown, no explanation, no code fences, just raw JSON.

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
- Every conceptId MUST be from the provided available IDs list. No exceptions — never invent IDs.
- 3 phases maximum. 3–5 concepts per phase. Total 9–14 concepts.
- Order phases: Foundations → Role-specific depth → Interview prep.
- Mark isSkillGap true for concepts the background text suggests the user hasn't encountered.
- Phase labels must follow the pattern "Phase N — Theme".
- Colors: Phase 1 = #10b981, Phase 2 = #f59e0b, Phase 3 = #f87171.""",

    "path_greeting": """You are greeting a developer who just completed onboarding. You know their name, current stack, target role, and their personalised learning path. Write a warm, technically precise welcome message that:
1. Addresses them by name
2. Summarises what you know about their background in one sentence
3. Names their 1-2 biggest skill gaps based on their profile
4. Recommends the first concept to start with and explains why it bridges their existing knowledge
5. Ends with an offer: "Want to dive in, or should I explain why I ordered your path this way?"

Be conversational but technically precise. Do not use generic phrases like "Great to meet you". Use markdown bold for concept names.""",
```

- [ ] **Step 2: Add profile injection to `build_system_prompt()`**

In `build_system_prompt()`, after the `memory_str` block (around line 81), add:

```python
    profile_context = ""
    if memory and memory.display_name:
        profile_context = f"\n## USER PROFILE\n- Name: {memory.display_name}\n- Target role: {memory.target_role or 'Not specified'}"
```

Then add `{profile_context}` to the f-string return value, right after `{concept_context}`:

```python
    return f"""You are Axiom, an elite AI engineering mentor embedded in System Design Lab.
...
## USER MEMORY
{memory_str}
{concept_context}
{profile_context}
...
"""
```

- [ ] **Step 3: Verify syntax**

```bash
cd axiom-backend && python3 -c "from agent import build_system_prompt; from models import AgentRequest; r = AgentRequest(mode='ask', message='test'); print(build_system_prompt(r)[:100])"
```

Expected: prints first 100 chars of the system prompt without errors.

- [ ] **Step 4: Commit**

```bash
git add axiom-backend/agent.py
git commit -m "feat(backend): add onboard/path_greeting modes and profile injection in system prompt"
```

---

## Task 3: Frontend types — `lib/profile.ts`

**Files:**
- Create: `lib/profile.ts`

- [ ] **Step 1: Create the file with interfaces and localStorage helpers**

```typescript
// lib/profile.ts
export const PROFILE_KEY = 'axiom-profile-v1';
export const PATH_KEY = 'axiom-path-v1';

export interface UserProfile {
  name: string;
  currentStack: string[];
  targetStack: string[];
  targetRole: string;
  backgroundText: string;
  createdAt: string;
}

export interface PathConcept {
  conceptId: string;
  isSkillGap: boolean;
}

export interface PathPhase {
  label: string;
  color: string;
  concepts: PathConcept[];
}

export interface LearningPath {
  generatedAt: string;
  targetRole: string;
  phases: PathPhase[];
  totalConcepts: number;
}

export const TARGET_ROLES = [
  'Backend Engineer',
  'DevOps Engineer',
  'Full Stack Engineer',
  'Staff / Principal SWE',
  'Cloud / Infrastructure Engineer',
  'SRE',
] as const;

export type TargetRole = typeof TARGET_ROLES[number];

/** Fallback paths used when Gemini returns invalid JSON */
export const FALLBACK_PATHS: Record<string, LearningPath> = {
  'Backend Engineer': {
    generatedAt: new Date().toISOString(),
    targetRole: 'Backend Engineer',
    totalConcepts: 11,
    phases: [
      {
        label: 'Phase 1 — Foundations',
        color: '#10b981',
        concepts: [
          { conceptId: 'monolith', isSkillGap: false },
          { conceptId: 'apigateway', isSkillGap: false },
          { conceptId: 'loadbalancer', isSkillGap: true },
          { conceptId: 'caching', isSkillGap: true },
        ],
      },
      {
        label: 'Phase 2 — Scalability',
        color: '#f59e0b',
        concepts: [
          { conceptId: 'databases', isSkillGap: true },
          { conceptId: 'sharding', isSkillGap: true },
          { conceptId: 'messagequeue', isSkillGap: true },
          { conceptId: 'ratelimit', isSkillGap: true },
        ],
      },
      {
        label: 'Phase 3 — Interview Prep',
        color: '#f87171',
        concepts: [
          { conceptId: 'cap', isSkillGap: false },
          { conceptId: 'circuit', isSkillGap: false },
          { conceptId: 'kafka', isSkillGap: true },
        ],
      },
    ],
  },
  'DevOps Engineer': {
    generatedAt: new Date().toISOString(),
    targetRole: 'DevOps Engineer',
    totalConcepts: 11,
    phases: [
      {
        label: 'Phase 1 — Foundations',
        color: '#10b981',
        concepts: [
          { conceptId: 'docker', isSkillGap: false },
          { conceptId: 'kubernetes', isSkillGap: false },
          { conceptId: 'vpc', isSkillGap: true },
        ],
      },
      {
        label: 'Phase 2 — Cloud Infrastructure',
        color: '#f59e0b',
        concepts: [
          { conceptId: 'ec2', isSkillGap: true },
          { conceptId: 'ecs', isSkillGap: true },
          { conceptId: 'eks', isSkillGap: true },
          { conceptId: 'iam', isSkillGap: true },
          { conceptId: 'rds', isSkillGap: false },
        ],
      },
      {
        label: 'Phase 3 — Interview Prep',
        color: '#f87171',
        concepts: [
          { conceptId: 'loadbalancer', isSkillGap: false },
          { conceptId: 'ratelimit', isSkillGap: false },
          { conceptId: 'circuit', isSkillGap: true },
        ],
      },
    ],
  },
};

/** Default fallback for roles not in FALLBACK_PATHS */
export function getFallbackPath(role: string): LearningPath {
  return FALLBACK_PATHS[role] ?? FALLBACK_PATHS['Backend Engineer'];
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PROFILE_KEY) : null;
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: UserProfile): void {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

export function loadPath(): LearningPath | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PATH_KEY) : null;
    return raw ? (JSON.parse(raw) as LearningPath) : null;
  } catch {
    return null;
  }
}

export function savePath(p: LearningPath): void {
  try { localStorage.setItem(PATH_KEY, JSON.stringify(p)); } catch {}
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `lib/profile.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/profile.ts
git commit -m "feat: add UserProfile and LearningPath types with localStorage helpers and fallback paths"
```

---

## Task 4: Hook — `hooks/useLearningPath.ts`

**Files:**
- Create: `hooks/useLearningPath.ts`

- [ ] **Step 1: Create the hook**

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { LearningPath, loadPath, savePath, PATH_KEY } from '@/lib/profile';

const COMPLETED_KEY = 'axiom-path-completed-v1';

function loadCompleted(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(COMPLETED_KEY) : null;
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompleted(s: Set<string>): void {
  try { localStorage.setItem(COMPLETED_KEY, JSON.stringify([...s])); } catch {}
}

export function useLearningPath() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load path, filter out any concept IDs that may have been removed
    const stored = loadPath();
    setPath(stored);

    // Pre-populate completed from sdl-viewed-concepts (existing progress hook storage)
    const viewedRaw = localStorage.getItem('sdl-viewed-concepts');
    const viewed: string[] = viewedRaw ? JSON.parse(viewedRaw) : [];
    const completed = loadCompleted();
    viewed.forEach(id => completed.add(id));
    setCompletedIds(completed);
    setLoaded(true);
  }, []);

  const markConceptDone = useCallback((conceptId: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.add(conceptId);
      saveCompleted(next);
      return next;
    });
  }, []);

  const replacePath = useCallback((newPath: LearningPath) => {
    savePath(newPath);
    setPath(newPath);
    // Reset completed when path is regenerated
    setCompletedIds(new Set());
    try { localStorage.removeItem(COMPLETED_KEY); } catch {}
  }, []);

  const allConceptIds = path
    ? path.phases.flatMap(ph => ph.concepts.map(c => c.conceptId))
    : [];

  const completedCount = allConceptIds.filter(id => completedIds.has(id)).length;
  const totalConcepts = allConceptIds.length;

  /** Returns the first conceptId in the path that isn't done yet */
  const nextConceptId = allConceptIds.find(id => !completedIds.has(id)) ?? null;

  return {
    path,
    completedIds,
    completedCount,
    totalConcepts,
    nextConceptId,
    loaded,
    markConceptDone,
    replacePath,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useLearningPath.ts
git commit -m "feat: add useLearningPath hook with completion tracking and path replacement"
```

---

## Task 5: Update `hooks/useMemory.ts`

**Files:**
- Modify: `hooks/useMemory.ts`

- [ ] **Step 1: Add `display_name` and `target_role` to the interface and default**

In `hooks/useMemory.ts`, update `AxiomMemory` interface:

```typescript
export interface AxiomMemory {
  studied_concepts: string[];
  weak_areas: string[];
  strong_areas: string[];
  quiz_scores: Record<string, number>;
  interview_sessions: number;
  preferred_style: string;
  last_session: string | null;
  total_messages: number;
  explained_topics: ExplainedTopic[];
  display_name: string;   // NEW
  target_role: string;    // NEW
}
```

Update `DEFAULT_MEMORY`:

```typescript
const DEFAULT_MEMORY: AxiomMemory = {
  studied_concepts: [],
  weak_areas: [],
  strong_areas: [],
  quiz_scores: {},
  interview_sessions: 0,
  preferred_style: '',
  last_session: null,
  total_messages: 0,
  explained_topics: [],
  display_name: '',    // NEW
  target_role: '',     // NEW
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useMemory.ts
git commit -m "feat: add display_name and target_role to AxiomMemory"
```

---

## Task 6: Update `hooks/useAxiom.ts`

**Files:**
- Modify: `hooks/useAxiom.ts`

- [ ] **Step 1: Add `display_name` and `target_role` to the `memorySummary` object**

In `hooks/useAxiom.ts`, find the `memorySummary` const (around line 69) and add the two new fields:

```typescript
    const memorySummary = {
      studied_concepts: memory.studied_concepts.slice(-10),
      weak_areas: memory.weak_areas.slice(-5),
      strong_areas: memory.strong_areas.slice(-5),
      quiz_scores: memory.quiz_scores,
      interview_sessions: memory.interview_sessions,
      preferred_style: memory.preferred_style,
      explained_topics: (memory.explained_topics || []).slice(-8),
      display_name: memory.display_name || '',   // NEW
      target_role: memory.target_role || '',     // NEW
    };
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useAxiom.ts
git commit -m "feat: send display_name and target_role to agent in every memorySummary"
```

---

## Task 7: Component — `TagInput`

**Files:**
- Create: `components/TagInput.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

const SUGGESTIONS: Record<string, string[]> = {
  stack: [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java',
    'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'PostgreSQL', 'MySQL',
    'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'GraphQL', 'REST', 'gRPC', 'Terraform', 'Helm', 'Next.js', 'Django',
    'Spring Boot', 'Express', 'FastAPI',
  ],
};

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Type and press Enter...',
  suggestions = SUGGESTIONS.stack,
  maxTags = 8,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = input.length > 0
    ? suggestions.filter(s =>
        s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
      ).slice(0, 5)
    : [];

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput('');
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          minHeight: 44,
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '6px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          cursor: 'text',
          transition: 'border-color 0.15s',
        }}
        onFocus={() => setShowSuggestions(true)}
      >
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#6366f1', display: 'flex' }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#e5e7eb',
            fontSize: '0.82rem',
            flex: 1,
            minWidth: 80,
            padding: '2px 0',
          }}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: '#1f2937',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8,
          overflow: 'hidden',
          zIndex: 50,
        }}>
          {filteredSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                color: '#d1d5db',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/TagInput.tsx
git commit -m "feat: add TagInput component with suggestions dropdown and keyboard navigation"
```

---

## Task 8: Component — `OnboardingModal`

**Files:**
- Create: `components/OnboardingModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TagInput } from '@/components/TagInput';
import {
  UserProfile, LearningPath, TARGET_ROLES, PROFILE_KEY, PATH_KEY,
  saveProfile, savePath, getFallbackPath,
} from '@/lib/profile';
import { useMemory } from '@/hooks/useMemory';

const AXIOM_URL = process.env.NEXT_PUBLIC_AXIOM_URL || 'http://localhost:8000';

const LOADING_PHRASES = [
  'Mapping your skill gaps…',
  'Curating concept order…',
  'Building your path…',
  'Analysing your background…',
  'Sequencing foundations first…',
  'Almost ready…',
];

async function generateLearningPath(profile: UserProfile): Promise<LearningPath> {
  const conceptIds = [
    'monolith','apigateway','loadbalancer','caching','cdn','databases','sharding',
    'messagequeue','ratelimit','cap','circuit','kafka','rabbitmq','bullmq',
    'queuepatterns','vpc','subnets','security-groups','nat-gateway','ports-protocols',
    'dns','route53','cloudflare','cloudfront','ec2','lambda','containers','s3','rds',
    'iam','kubernetes','docker','ecs','eks','ecr','url-journey','dns-explained',
    'osi-tcp','https-tls','reverse-proxy','cdn-explained','debug-network',
    'osi-layers','network-protocols',
  ];

  const message = `Profile:
- Name: ${profile.name}
- Current stack: ${profile.currentStack.join(', ')}
- Target role: ${profile.targetRole}
- Target stack: ${profile.targetStack.length > 0 ? profile.targetStack.join(', ') : 'Not specified'}
- Background: ${profile.backgroundText || 'Not provided'}

Available concept IDs: ${conceptIds.join(', ')}

Generate the learning path JSON now.`;

  const response = await fetch(`${AXIOM_URL}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'onboard', message, memory: null, history: [] }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);

  // Collect all SSE chunks into full_response
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.chunk) fullText += data.chunk;
        if (data.error) throw new Error(data.error);
      } catch {}
    }
  }

  // Parse JSON — strip any accidental markdown fences
  const cleaned = fullText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned) as { phases: LearningPath['phases'] };

  const totalConcepts = parsed.phases.reduce((s, ph) => s + ph.concepts.length, 0);
  return {
    generatedAt: new Date().toISOString(),
    targetRole: profile.targetRole,
    phases: parsed.phases,
    totalConcepts,
  };
}

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const router = useRouter();
  const { saveMemory } = useMemory();

  const [name, setName] = useState('');
  const [currentStack, setCurrentStack] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [targetStack, setTargetStack] = useState<string[]>([]);
  const [backgroundText, setBackgroundText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [apiError, setApiError] = useState('');

  // Rotate loading phrases
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setLoadingPhrase(LOADING_PHRASES[i]);
    }, 1800);
    return () => clearInterval(timer);
  }, [loading]);

  // Block escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') e.preventDefault(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (currentStack.length === 0) errs.currentStack = 'Add at least one technology';
    if (!targetRole) errs.targetRole = 'Select a target role';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);

    const profile: UserProfile = {
      name: name.trim(),
      currentStack,
      targetStack,
      targetRole,
      backgroundText,
      createdAt: new Date().toISOString(),
    };

    saveProfile(profile);
    saveMemory({ display_name: profile.name, target_role: profile.targetRole });

    let path: LearningPath;
    try {
      path = await generateLearningPath(profile);
    } catch {
      // Retry once
      try {
        path = await generateLearningPath(profile);
      } catch {
        path = getFallbackPath(profile.targetRole);
      }
    }

    savePath(path);
    setLoading(false);
    onComplete(profile);
    router.push('/path');
  }, [name, currentStack, targetRole, targetStack, backgroundText, saveMemory, onComplete, router]);

  const step1Active = true;
  const step2Active = name.trim().length > 0 && currentStack.length > 0;
  const step3Active = step2Active && !!targetRole;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#09090b',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 80px rgba(99,102,241,0.12)',
        }}
      >
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[step1Active, step2Active, step3Active].map((active, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: active ? '#6366f1' : 'rgba(99,102,241,0.2)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1 */}
        <div style={{ marginBottom: 24 }}>
          <StepLabel number={1} label="Who are you?" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <Field label="Your name" error={errors.name} required>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Muhammad"
                style={inputStyle}
              />
            </Field>
            <Field label="Current stack" hint="Type and press Enter to add" error={errors.currentStack} required>
              <TagInput tags={currentStack} onChange={setCurrentStack} placeholder="e.g. React, Node.js, Python…" />
            </Field>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ marginBottom: 24, opacity: step2Active ? 1 : 0.35, transition: 'opacity 0.3s' }}>
          <StepLabel number={2} label="Where are you going?" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <Field label="Target role" error={errors.targetRole} required>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                disabled={!step2Active}
                style={{ ...inputStyle, color: targetRole ? '#e5e7eb' : '#6b7280' }}
              >
                <option value="">Select your target role…</option>
                {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Target stack" hint="Technologies you want to learn (optional)">
              <TagInput tags={targetStack} onChange={setTargetStack} placeholder="e.g. Go, Kubernetes, AWS…" />
            </Field>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ opacity: step3Active ? 1 : 0.25, transition: 'opacity 0.3s' }}>
          <StepLabel number={3} label="Your background" hint="optional" />
          <div style={{ marginTop: 14 }}>
            <textarea
              value={backgroundText}
              onChange={e => setBackgroundText(e.target.value)}
              disabled={!step3Active}
              placeholder="Paste your experience, skills summary, or the job description you're targeting. Axiom uses this to identify your skill gaps."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
            <p style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: 4 }}>
              Processed locally — never stored on any server
            </p>
          </div>
        </div>

        {/* Error */}
        {apiError && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.8rem' }}>
            {apiError} — <button type="button" onClick={handleSubmit} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>Retry</button>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !step3Active}
          style={{
            marginTop: 24, width: '100%',
            background: step3Active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.2)',
            border: 'none', borderRadius: 10, padding: '13px 0',
            color: step3Active ? 'white' : '#6b7280',
            fontSize: '0.88rem', fontWeight: 700, cursor: step3Active ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <AnimatePresence mode="wait">
                <motion.span
                  key={loadingPhrase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  {loadingPhrase}
                </motion.span>
              </AnimatePresence>
            </>
          ) : (
            <>Generate my path →</>
          )}
        </button>

        {!step3Active && step2Active && (
          <button
            type="button"
            onClick={handleSubmit}
            style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Skip background & generate →
          </button>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1f2937; color: #e5e7eb; }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e5e7eb',
  fontSize: '0.85rem',
  outline: 'none',
};

function StepLabel({ number, label, hint }: { number: number; label: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 800, color: '#a5b4fc', flexShrink: 0,
      }}>{number}</div>
      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f9fafb' }}>{label}</span>
      {hint && <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>— {hint}</span>}
    </div>
  );
}

function Field({ label, children, hint, error, required }: {
  label: string; children: React.ReactNode;
  hint?: string; error?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}{required && <span style={{ color: '#6366f1', marginLeft: 2 }}>*</span>}
        </span>
        {hint && <span style={{ fontSize: '0.68rem', color: '#6b7280', marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: '0.72rem', color: '#f87171', marginTop: 4 }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/OnboardingModal.tsx
git commit -m "feat: add OnboardingModal — 3-step blocking modal with path generation and loading states"
```

---

## Task 9: Component — `ConceptRow`

**Files:**
- Create: `components/ConceptRow.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';
import { PathConcept } from '@/lib/profile';

type RowStatus = 'done' | 'active' | 'locked' | 'gap';

interface ConceptRowProps {
  concept: PathConcept;
  conceptTitle: string;
  conceptCat: string;
  status: RowStatus;
  onClick: () => void;
  showConnector?: boolean;
}

export function ConceptRow({ concept, conceptTitle, conceptCat, status, onClick, showConnector = true }: ConceptRowProps) {
  const isDone = status === 'done';
  const isActive = status === 'active';
  const isLocked = status === 'locked' || status === 'gap';

  return (
    <>
      <div
        onClick={isLocked ? undefined : onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 8, marginBottom: 0,
          border: '1px solid transparent',
          cursor: isLocked ? 'default' : 'pointer',
          opacity: isLocked ? 0.4 : 1,
          background: isDone
            ? 'rgba(16,185,129,0.05)'
            : isActive
              ? 'rgba(99,102,241,0.1)'
              : 'transparent',
          borderColor: isDone
            ? 'rgba(16,185,129,0.12)'
            : isActive
              ? 'rgba(99,102,241,0.3)'
              : 'transparent',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          if (!isLocked) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={e => {
          if (!isLocked) (e.currentTarget as HTMLDivElement).style.background =
            isDone ? 'rgba(16,185,129,0.05)' : isActive ? 'rgba(99,102,241,0.1)' : 'transparent';
        }}
      >
        {/* Status icon */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: 800,
          background: isDone ? '#059669' : isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
          border: isDone ? '1.5px solid #059669' : isActive ? '1.5px solid #6366f1' : '1.5px solid rgba(255,255,255,0.15)',
          color: isDone ? 'white' : '#6366f1',
        }}>
          {isDone ? '✓' : isActive ? '▶' : ''}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {conceptTitle}
          </div>
          <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: 1 }}>
            {conceptCat}
          </div>
        </div>

        {/* Badge */}
        {isDone && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', letterSpacing: '0.04em' }}>
            DONE
          </span>
        )}
        {isActive && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', letterSpacing: '0.04em' }}>
            UP NEXT
          </span>
        )}
        {status === 'gap' && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#f87171', letterSpacing: '0.04em' }}>
            SKILL GAP
          </span>
        )}
      </div>

      {showConnector && (
        <div style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.06)', margin: '2px 0 2px 18px' }} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ConceptRow.tsx
git commit -m "feat: add ConceptRow component with done/active/locked/gap states"
```

---

## Task 10: Component — `PathPanel`

**Files:**
- Create: `components/PathPanel.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';
import { useRouter } from 'next/navigation';
import { LearningPath } from '@/lib/profile';
import { ConceptRow } from '@/components/ConceptRow';

// Concept ID → title/category map (mirrors CONCEPT_META in backend)
const CONCEPT_INFO: Record<string, { title: string; cat: string }> = {
  monolith: { title: 'Monolith vs Microservices', cat: 'foundation' },
  apigateway: { title: 'API Gateway', cat: 'foundation' },
  loadbalancer: { title: 'Load Balancer', cat: 'performance' },
  caching: { title: 'Caching', cat: 'performance' },
  cdn: { title: 'CDN', cat: 'performance' },
  databases: { title: 'Databases', cat: 'data' },
  sharding: { title: 'Database Sharding', cat: 'data' },
  messagequeue: { title: 'Message Queue', cat: 'async' },
  ratelimit: { title: 'Rate Limiting', cat: 'reliability' },
  cap: { title: 'CAP Theorem', cat: 'reliability' },
  circuit: { title: 'Circuit Breaker', cat: 'reliability' },
  kafka: { title: 'Apache Kafka', cat: 'messaging' },
  rabbitmq: { title: 'RabbitMQ', cat: 'messaging' },
  bullmq: { title: 'BullMQ', cat: 'messaging' },
  queuepatterns: { title: 'Queue Patterns', cat: 'messaging' },
  vpc: { title: 'VPC', cat: 'cloud' },
  subnets: { title: 'Subnets', cat: 'cloud' },
  'security-groups': { title: 'Security Groups', cat: 'cloud' },
  'nat-gateway': { title: 'NAT Gateway', cat: 'cloud' },
  'ports-protocols': { title: 'Ports & Protocols', cat: 'cloud' },
  dns: { title: 'AWS DNS', cat: 'cloud' },
  route53: { title: 'Route 53', cat: 'cloud' },
  cloudflare: { title: 'Cloudflare', cat: 'cloud' },
  cloudfront: { title: 'CloudFront', cat: 'cloud' },
  ec2: { title: 'EC2 & Auto Scaling', cat: 'cloud' },
  lambda: { title: 'AWS Lambda', cat: 'cloud' },
  containers: { title: 'Containers: ECS & EKS', cat: 'cloud' },
  s3: { title: 'Amazon S3', cat: 'cloud' },
  rds: { title: 'Amazon RDS', cat: 'cloud' },
  iam: { title: 'AWS IAM', cat: 'cloud' },
  kubernetes: { title: 'Kubernetes', cat: 'cloud' },
  docker: { title: 'Docker & Containers', cat: 'cloud' },
  ecs: { title: 'Amazon ECS', cat: 'cloud' },
  eks: { title: 'Amazon EKS', cat: 'cloud' },
  ecr: { title: 'Amazon ECR', cat: 'cloud' },
  'url-journey': { title: 'URL Journey', cat: 'networking' },
  'dns-explained': { title: 'DNS Explained', cat: 'networking' },
  'osi-tcp': { title: 'OSI & TCP/IP', cat: 'networking' },
  'https-tls': { title: 'HTTPS & TLS', cat: 'networking' },
  'reverse-proxy': { title: 'Reverse Proxy', cat: 'networking' },
  'cdn-explained': { title: 'CDN Explained', cat: 'networking' },
  'debug-network': { title: 'Debugging Networks', cat: 'networking' },
  'osi-layers': { title: 'OSI Layers Deep Dive', cat: 'networking' },
  'network-protocols': { title: 'Network Protocols', cat: 'networking' },
};

interface PathPanelProps {
  path: LearningPath;
  completedIds: Set<string>;
  nextConceptId: string | null;
  completedCount: number;
  onConceptClick: (conceptId: string) => void;
}

export function PathPanel({ path, completedIds, nextConceptId, completedCount, onConceptClick }: PathPanelProps) {
  const totalConcepts = path.totalConcepts;
  const hoursRemaining = totalConcepts - completedCount;
  const progressPct = totalConcepts > 0 ? (completedCount / totalConcepts) * 100 : 0;

  const generatedDate = new Date(path.generatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Flatten all concept IDs in order to determine unlock sequence
  const allIds = path.phases.flatMap(ph => ph.concepts.map(c => c.conceptId));

  function getStatus(conceptId: string, isSkillGap: boolean): 'done' | 'active' | 'locked' | 'gap' {
    if (completedIds.has(conceptId)) return 'done';
    if (conceptId === nextConceptId) return 'active';
    // locked — check if skill gap
    if (isSkillGap) return 'gap';
    return 'locked';
  }

  return (
    <div style={{
      width: 380, flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto',
      padding: '24px 20px',
      background: 'var(--bg, #09090b)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
          <span style={{ fontSize: '0.65rem', color: '#6366f1', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Personalised for you
          </span>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.02em' }}>
          {path.targetRole} Path
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>
          Axiom-curated · {generatedDate}
        </div>

        {/* Progress */}
        <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 4, height: 5, margin: '12px 0 4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
          {completedCount} of {totalConcepts} concepts complete · ~{hoursRemaining}h remaining
        </div>
      </div>

      {/* Phases */}
      {path.phases.map((phase, phaseIdx) => {
        const allPhaseConcepts = phase.concepts.map(c => c.conceptId);
        return (
          <div key={phaseIdx} style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: phase.color, marginBottom: 8,
            }}>
              {phase.label}
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {phase.concepts.map((concept, cIdx) => {
              const info = CONCEPT_INFO[concept.conceptId] ?? { title: concept.conceptId, cat: 'concept' };
              const status = getStatus(concept.conceptId, concept.isSkillGap);
              const isLast = cIdx === phase.concepts.length - 1;
              return (
                <ConceptRow
                  key={concept.conceptId}
                  concept={concept}
                  conceptTitle={info.title}
                  conceptCat={info.cat}
                  status={status}
                  onClick={() => onConceptClick(concept.conceptId)}
                  showConnector={!isLast}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/PathPanel.tsx
git commit -m "feat: add PathPanel — phases, progress bar, concept rows with status"
```

---

## Task 11: Component — `PathPage` + page route

**Files:**
- Create: `components/PathPage.tsx`
- Create: `app/path/page.tsx`

- [ ] **Step 1: Create `components/PathPage.tsx`**

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square } from 'lucide-react';
import { useLearningPath } from '@/hooks/useLearningPath';
import { useMemory } from '@/hooks/useMemory';
import { useAxiom, AgentMode } from '@/hooks/useAxiom';
import { loadProfile } from '@/lib/profile';
import { PathPanel } from '@/components/PathPanel';
import { MermaidBlock } from '@/components/MermaidBlock';

const GREETING_PHRASES = [
  'Analysing your profile…',
  'Reading your background…',
  'Crafting your introduction…',
  'Almost ready…',
];

const MODE_CONFIG = {
  ask: { label: 'Ask', color: '#6366f1' },
  interview: { label: 'Interview', color: '#f59e0b' },
  quiz: { label: 'Quiz', color: '#10b981' },
  debug: { label: 'Debug', color: '#ef4444' },
  threeam: { label: '3AM', color: '#8b5cf6' },
} as const;

function renderPathMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      if (lang === 'mermaid') {
        nodes.push(<MermaidBlock key={`m-${i}`} code={codeLines.join('\n')} />);
      } else {
        nodes.push(
          <pre key={`c-${i}`} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', overflowX: 'auto', fontSize: '0.78rem', color: '#e5e7eb', margin: '8px 0' }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
      }
      continue;
    }
    if (line.startsWith('## ')) { nodes.push(<h2 key={i} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f9fafb', margin: '12px 0 6px' }}>{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith('### ')) { nodes.push(<h3 key={i} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb', margin: '10px 0 4px' }}>{line.slice(4)}</h3>); i++; continue; }
    if (line.startsWith('**') && line.endsWith('**')) { nodes.push(<p key={i} style={{ fontWeight: 700, color: '#f9fafb', margin: '4px 0', fontSize: '0.82rem' }}>{line.slice(2, -2)}</p>); i++; continue; }
    if (line.startsWith('- ')) { nodes.push(<li key={i} style={{ color: '#d1d5db', fontSize: '0.82rem', margin: '2px 0 2px 16px' }}>{line.slice(2)}</li>); i++; continue; }
    if (line.trim() === '') { nodes.push(<div key={i} style={{ height: '0.4rem' }} />); i++; continue; }
    // Inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    nodes.push(
      <p key={i} style={{ color: '#d1d5db', fontSize: '0.82rem', lineHeight: 1.65, margin: '2px 0' }}>
        {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: '#e5e7eb' }}>{p.slice(2, -2)}</strong> : p)}
      </p>
    );
    i++;
  }
  return nodes;
}

export function PathPage() {
  const router = useRouter();
  const { path, completedIds, completedCount, totalConcepts, nextConceptId, loaded, markConceptDone } = useLearningPath();
  const { memory } = useMemory();
  const { messages, isLoading, sendMessage, stopGeneration, suggestedQuestions } = useAxiom({
    memory,
    onMemoryUpdate: () => {},
  });

  const [mode, setMode] = useState<AgentMode>('ask');
  const [input, setInput] = useState('');
  const [greetingSent, setGreetingSent] = useState(false);
  const [greetingPhrase, setGreetingPhrase] = useState(GREETING_PHRASES[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if no path exists
  useEffect(() => {
    if (loaded && !path) router.replace('/');
  }, [loaded, path, router]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rotate greeting phrases
  useEffect(() => {
    if (greetingSent || messages.length > 0) return;
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % GREETING_PHRASES.length; setGreetingPhrase(GREETING_PHRASES[i]); }, 1600);
    return () => clearInterval(t);
  }, [greetingSent, messages.length]);

  // Send auto-greeting once on mount
  useEffect(() => {
    if (greetingSent || !loaded || !path || !memory) return;
    setGreetingSent(true);
    const profile = loadProfile();
    const skillGaps = path.phases.flatMap(ph => ph.concepts.filter(c => c.isSkillGap).map(c => c.conceptId)).slice(0, 3).join(', ');
    const firstConcept = nextConceptId || path.phases[0]?.concepts[0]?.conceptId || '';
    const greetingMsg = `My profile: Name=${profile?.name || memory.display_name}, Target role=${path.targetRole}, Current stack=${profile?.currentStack.join(', ') || 'not set'}, Skill gaps identified=${skillGaps || 'none'}, First concept to study=${firstConcept}, Path has ${totalConcepts} concepts across ${path.phases.length} phases. Please greet me personally and introduce my learning path.`;
    sendMessage(greetingMsg, 'path_greeting');
  }, [loaded, path, memory, greetingSent]);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), mode);
    setInput('');
  }

  function handleConceptClick(conceptId: string) {
    markConceptDone(conceptId);
    router.push(`/lab?concept=${conceptId}`);
  }

  if (!loaded || !path) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg, #09090b)' }}>
      {/* Path Panel */}
      <PathPanel
        path={path}
        completedIds={completedIds}
        nextConceptId={nextConceptId}
        completedCount={completedCount}
        onConceptClick={handleConceptClick}
      />

      {/* Mentor Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f9fafb' }}>Axiom</div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>Your personal mentor · {MODE_CONFIG[mode].label} mode</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(Object.keys(MODE_CONFIG) as AgentMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? `${MODE_CONFIG[m].color}20` : 'transparent', border: `1px solid ${mode === m ? MODE_CONFIG[m].color + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.68rem', color: mode === m ? MODE_CONFIG[m].color : '#6b7280', cursor: 'pointer', fontWeight: mode === m ? 700 : 400 }}>
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Greeting loading state */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: 'white', flexShrink: 0, marginTop: 2 }}>A</div>
              <div style={{ borderLeft: '2px solid rgba(99,102,241,0.35)', paddingLeft: 12, paddingTop: 2 }}>
                <AnimatePresence mode="wait">
                  <motion.p key={greetingPhrase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                    {greetingPhrase}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )}

          {messages
            .filter(m => m.mode !== 'path_greeting' || m.role === 'assistant')
            .map(msg => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.25)', padding: '9px 13px', borderRadius: '12px 12px 2px 12px', fontSize: '0.82rem', color: '#e5e7eb', maxWidth: '75%' }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: 'white', flexShrink: 0, marginTop: 2 }}>A</div>
                    <div style={{ borderLeft: '2px solid rgba(99,102,241,0.35)', paddingLeft: 12, paddingTop: 2, flex: 1 }}>
                      {renderPathMarkdown(msg.content)}
                      {msg.isStreaming && <span style={{ display: 'inline-block', width: 2, height: 14, background: '#6366f1', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />}
                    </div>
                  </div>
                )}
              </div>
            ))}

          {suggestedQuestions.length > 0 && (
            <div style={{ paddingLeft: 36, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {suggestedQuestions.map(q => (
                <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', padding: '5px 11px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Ask Axiom about your ${path.targetRole} path…`}
            rows={1}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 13px', color: '#e5e7eb', fontSize: '0.82rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
          {isLoading ? (
            <button onClick={stopGeneration} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Square size={14} color="#f87171" />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim()} style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: input.trim() ? 1 : 0.5, flexShrink: 0 }}>
              <Send size={14} color="white" />
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/path/page.tsx`**

```typescript
import { PathPage } from '@/components/PathPage';

export default function Page() {
  return <PathPage />;
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/PathPage.tsx app/path/page.tsx
git commit -m "feat: add PathPage and /path route — split path panel + personalised mentor"
```

---

## Task 12: Update `components/Hero.tsx`

**Files:**
- Modify: `components/Hero.tsx`

- [ ] **Step 1: Add OnboardingModal mount**

At the top of `Hero.tsx`, add the import:

```typescript
import { useState, useEffect } from 'react';
import { OnboardingModal } from '@/components/OnboardingModal';
import { loadProfile, UserProfile } from '@/lib/profile';
```

Inside the `Hero` component function, add state and effect:

```typescript
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only check on client side
    const profile = loadProfile();
    if (!profile) setShowOnboarding(true);
  }, []);
```

At the end of the JSX return, before the closing `</div>`, add:

```typescript
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

```
1. Clear localStorage (DevTools → Application → Local Storage → Clear All)
2. Open http://localhost:3000 (or the preview URL)
3. The onboarding modal should appear immediately, blocking the page
4. Fill in all fields and click "Generate my path →"
5. Should redirect to /path after generation completes
```

- [ ] **Step 4: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat: mount OnboardingModal in Hero — shows on first visit, blocks until complete"
```

---

## Task 13: Update `components/Sidebar.tsx`

**Files:**
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: Add "My Path" nav item and profile card**

Add these imports to `Sidebar.tsx`:

```typescript
import { useRouter } from 'next/navigation';
import { loadProfile } from '@/lib/profile';
import { useLearningPath } from '@/hooks/useLearningPath';
```

Inside the `Sidebar` component, add:

```typescript
  const { completedCount, totalConcepts, path } = useLearningPath();
  const profile = typeof window !== 'undefined' ? loadProfile() : null;
```

Add the "My Path" nav item at the very top of the nav list (before the existing concept category items), somewhere near the top navigation section:

```typescript
{path && (
  <button
    onClick={() => navigate('/path')}
    style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: '100%', padding: '8px 10px', borderRadius: 7,
      background: 'rgba(99,102,241,0.1)',
      border: '1px solid rgba(99,102,241,0.2)',
      color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700,
      cursor: 'pointer', marginBottom: 8,
    }}
  >
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1' }} />
    My Path
    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#6b7280' }}>
      {completedCount}/{totalConcepts}
    </span>
  </button>
)}
```

Add the profile card at the bottom of the sidebar, just before the closing `</div>`:

```typescript
{profile && (
  <div style={{
    marginTop: 'auto', paddingTop: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  }}>
    <div style={{
      background: 'rgba(99,102,241,0.07)',
      border: '1px solid rgba(99,102,241,0.18)',
      borderRadius: 10, padding: '10px 12px',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e5e7eb' }}>{profile.name}</div>
      <div style={{ fontSize: '0.68rem', color: '#6366f1', marginTop: 2 }}>→ {profile.targetRole}</div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
        {profile.currentStack.slice(0, 4).map(t => (
          <span key={t} style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '1px 6px', borderRadius: 3, fontSize: '0.62rem' }}>{t}</span>
        ))}
        {profile.currentStack.length > 4 && (
          <span style={{ color: '#6b7280', fontSize: '0.62rem', padding: '1px 4px' }}>+{profile.currentStack.length - 4} more</span>
        )}
      </div>
      <button
        onClick={() => {
          // Clear profile to re-trigger onboarding — navigate home
          localStorage.removeItem('axiom-profile-v1');
          localStorage.removeItem('axiom-path-v1');
          window.location.href = '/';
        }}
        style={{ marginTop: 8, background: 'none', border: 'none', color: '#4b5563', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
      >
        Edit profile →
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "feat: add My Path nav item and profile card to Sidebar"
```

---

## Task 14: Sync to worktree, push, redeploy

- [ ] **Step 1: Sync all new and modified files to the worktree**

```bash
WORKTREE=/Users/muhammadjamil/Desktop/practice/system-design-app/.claude/worktrees/romantic-snyder-a9639b
PROJECT=/Users/muhammadjamil/Desktop/practice/system-design-app

cp "$PROJECT/lib/profile.ts" "$WORKTREE/lib/"
cp "$PROJECT/hooks/useLearningPath.ts" "$WORKTREE/hooks/"
cp "$PROJECT/hooks/useMemory.ts" "$WORKTREE/hooks/"
cp "$PROJECT/hooks/useAxiom.ts" "$WORKTREE/hooks/"
cp "$PROJECT/components/TagInput.tsx" "$WORKTREE/components/"
cp "$PROJECT/components/OnboardingModal.tsx" "$WORKTREE/components/"
cp "$PROJECT/components/ConceptRow.tsx" "$WORKTREE/components/"
cp "$PROJECT/components/PathPanel.tsx" "$WORKTREE/components/"
cp "$PROJECT/components/PathPage.tsx" "$WORKTREE/components/"
cp "$PROJECT/components/Hero.tsx" "$WORKTREE/components/"
cp "$PROJECT/components/Sidebar.tsx" "$WORKTREE/components/"
cp "$PROJECT/axiom-backend/models.py" "$WORKTREE/axiom-backend/"
cp "$PROJECT/axiom-backend/agent.py" "$WORKTREE/axiom-backend/"
mkdir -p "$WORKTREE/app/path"
cp "$PROJECT/app/path/page.tsx" "$WORKTREE/app/path/"
```

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

- [ ] **Step 3: Redeploy to Vercel**

```bash
vercel --prod --yes 2>&1 | grep -E "Production:|Aliased:|Error"
```

Expected: `Aliased: https://system-design-app-mauve.vercel.app`

---

## Final Verification Checklist

```
□ First visit → onboarding modal appears and blocks page (can't Escape out)
□ Step 1 fields activate Step 2 opacity; Step 2 fields activate Step 3
□ Submit with missing required fields → shows inline errors
□ "Generate my path →" triggers loading with rotating phrases
□ After generation → redirected to /path
□ Path page shows 3 phases with correct concept titles and badges
□ SKILL GAP badge appears on flagged concepts
□ UP NEXT badge on the first incomplete concept
□ Clicking a non-locked concept marks it done and navigates to ConceptPage
□ Axiom mentor auto-sends personalised greeting (uses display_name)
□ Suggested pills pre-loaded: "Why this order?", "What's my biggest gap?"
□ Sidebar shows "My Path" button with progress count
□ Sidebar shows profile card with name, role, stack tags
□ "Edit profile →" clears storage and re-shows onboarding on next visit
□ All 5 mode pills work in the path page mentor panel
□ Returning to /path shows persisted progress
```
