# Supabase Auth & Persistence — Design Spec

**Date:** 2026-05-08  
**Status:** Approved  
**Phase:** 1 of 2 (no embeddings — Phase 2 when real data accumulates)

---

## Goal

Replace the current localStorage-only data model with Supabase-backed persistence. Add Magic Link authentication so user data (profile, learning path, concept completions, Axiom memory, and chat history) survives page refreshes, is accessible across devices, and is associated with a real user identity.

## Architecture

**Approach:** Write-through cache. localStorage is the fast read layer; Supabase is the source of truth. All writes go to localStorage immediately (optimistic UI) and to Supabase asynchronously in the background. Reads prefer localStorage and fall back to Supabase when empty.

**Backend:** FastAPI stays completely stateless. Zero changes to `axiom-backend/`. Chat messages are persisted from the browser JS client directly to Supabase after each SSE stream completes (`data.done` event).

**Auth provider:** Supabase Magic Link (email only). No password auth. No OAuth.

---

## Authentication Flow

```
Visit app
  → No session → AuthModal (email input → magic link sent → "Check your inbox")
  → Session exists → load profile from Supabase → enter app

After magic link click (Supabase redirects back):
  → New user (no profiles row) → run OnboardingModal → save to Supabase + localStorage
  → Returning user (profiles row exists) → load from Supabase → overwrite localStorage → enter app
  → Pre-auth user (no profiles row but localStorage has data) → migrate localStorage → Supabase → enter app

Sign-out: clear localStorage, invalidate Supabase session
```

**Modal order:** AuthModal always appears before OnboardingModal. A user is never asked to onboard without a session.

---

## Database Schema

All tables use Row Level Security. Every policy: `user_id = auth.uid()`. Supabase enforces this at the DB level.

```sql
-- User profile (extends auth.users)
create table profiles (
  id               uuid primary key references auth.users on delete cascade,
  name             text not null default '',
  current_stack    text[] default '{}',
  target_stack     text[] default '{}',
  target_role      text default '',
  background_text  text default '',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
alter table profiles enable row level security;
create policy "users manage own profile"
  on profiles for all using (auth.uid() = id);

-- Learning path (phases stored as JSONB)
create table learning_paths (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users on delete cascade not null,
  target_role    text not null,
  phases         jsonb not null default '[]',
  total_concepts int default 0,
  generated_at   timestamptz default now(),
  is_active      boolean default true,
  created_at     timestamptz default now()
);
create index on learning_paths (user_id, is_active);
alter table learning_paths enable row level security;
create policy "users manage own paths"
  on learning_paths for all using (auth.uid() = user_id);

-- Concept completions
create table concept_completions (
  user_id      uuid references auth.users on delete cascade,
  concept_id   text not null,
  completed_at timestamptz default now(),
  primary key (user_id, concept_id)
);
alter table concept_completions enable row level security;
create policy "users manage own completions"
  on concept_completions for all using (auth.uid() = user_id);

-- Chat sessions (one session = one continuous conversation)
create table chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  mode       text default 'ask',
  concept_id text,
  title      text,         -- first 60 chars of first user message
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on chat_sessions (user_id, updated_at desc);
alter table chat_sessions enable row level security;
create policy "users manage own sessions"
  on chat_sessions for all using (auth.uid() = user_id);

-- Chat messages
create table chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions on delete cascade not null,
  user_id    uuid references auth.users on delete cascade not null,
  role       text not null,   -- user | assistant
  content    text not null,
  mode       text,
  created_at timestamptz default now()
);
create index on chat_messages (session_id, created_at asc);
alter table chat_messages enable row level security;
create policy "users manage own messages"
  on chat_messages for all using (auth.uid() = user_id);

-- Axiom memory (one row per user, upserted after each agent reply)
create table user_memory (
  user_id            uuid primary key references auth.users on delete cascade,
  weak_areas         text[] default '{}',
  strong_areas       text[] default '{}',
  studied_concepts   text[] default '{}',
  quiz_scores        jsonb default '{}',
  interview_sessions int default 0,
  preferred_style    text default '',
  explained_topics   jsonb default '[]',
  total_messages     int default 0,
  last_session       timestamptz,
  updated_at         timestamptz default now()
);
alter table user_memory enable row level security;
create policy "users manage own memory"
  on user_memory for all using (auth.uid() = user_id);
```

---

## Data Sync Map

| Event | localStorage key | Supabase table | Operation |
|---|---|---|---|
| Onboarding complete | `axiom-profile-v1` | `profiles` | upsert |
| Onboarding complete | `axiom-path-v1` | `learning_paths` | insert (is_active=true) |
| Path regenerated | `axiom-path-v1` | `learning_paths` | set old is_active=false, insert new |
| Concept marked done | `axiom-path-completed-v1` | `concept_completions` | insert (ignore conflict) |
| Concept viewed | `sdl-viewed-concepts` | `concept_completions` | insert (ignore conflict) |
| Memory update | `axiom-memory-v1` | `user_memory` | upsert |
| Chat message sent/received | — | `chat_messages` | insert both user + assistant on done |
| New chat starts | — | `chat_sessions` | insert |
| Sign-out | clear all keys | — | — |

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `lib/supabase.ts` | Supabase JS client singleton (anon key, browser-safe) |
| `hooks/useAuth.ts` | `session`, `user`, `signIn(email)`, `signOut()`, `isLoading`, migration logic |
| `components/AuthModal.tsx` | Email input → magic link sent → "Check your inbox" state; blocks app until signed in |

### Modified files
| File | Change |
|---|---|
| `hooks/useMemory.ts` | After `applyMemoryUpdate` → async upsert `user_memory` |
| `hooks/useLearningPath.ts` | `replacePath` → insert `learning_paths`; `markConceptDone` → insert `concept_completions` |
| `hooks/useAxiom.ts` | On `data.done` → save user + assistant messages to `chat_messages`; create/reuse `chat_sessions` |
| `hooks/useProgress.ts` | `markViewed` → also insert `concept_completions` |
| `components/Hero.tsx` | Show `AuthModal` if no session; show `OnboardingModal` only after auth |
| `components/Sidebar.tsx` | Show signed-in email + Sign Out button at bottom of profile card |

### Environment variables needed
```
NEXT_PUBLIC_SUPABASE_URL=https://uqupyzmgstnhvoetnvwz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

---

## Migration Logic (pre-auth localStorage data)

```
On successful sign-in:
  1. Check if profiles row exists for auth.uid()
  2. If YES → load from Supabase, overwrite localStorage, done
  3. If NO → check localStorage for axiom-profile-v1
     a. If localStorage has profile → upsert profiles, learning_paths,
        concept_completions, user_memory from localStorage data → done
     b. If localStorage empty → show OnboardingModal as normal
```

---

## AuthModal UX

- Fullscreen overlay, same visual style as OnboardingModal (dark, indigo accents)
- Step 1: Email input + "Send magic link" button
- Step 2: "Check your inbox ✓" confirmation with option to resend
- No escape key (same as OnboardingModal — must sign in to proceed)
- After Supabase redirect: overlay closes automatically, session is active

---

## Sidebar Changes

Profile card at bottom gains:
- Signed-in email shown in small text below the name
- "Sign out" link replaces / sits next to "Edit profile →"
- Sign-out clears localStorage and invalidates Supabase session

---

## What Is NOT Built (Phase 2)

- Chat history browser UI (reading past conversations)
- Cross-session memory retrieval via embeddings
- pgvector / semantic search
- Social features, shared profiles
- Admin dashboard
- Email preferences

---

## Success Criteria

- [ ] New user: AuthModal → OnboardingModal → /path — all data in Supabase
- [ ] Returning user: sign in → straight to app with path + progress restored
- [ ] Pre-auth user: sign in → localStorage data migrated, nothing lost
- [ ] Chat messages appear in `chat_messages` table after each conversation
- [ ] Memory updates appear in `user_memory` after each agent reply
- [ ] Sign-out clears localStorage, next sign-in loads fresh from Supabase
- [ ] All tables pass RLS check (no user can read another's rows)
