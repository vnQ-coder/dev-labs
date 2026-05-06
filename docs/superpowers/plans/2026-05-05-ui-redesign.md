# UI Redesign — System Design Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire app to FAANG-level production quality — Slate/Parchment theme, Lucide icons, Hero C layout, refined multi-color categories, full responsiveness across 320px→1920px.

**Architecture:** Token-first approach — update `globals.css` design tokens first so every subsequent component change is already correct. Then build the two new shared components (`ConceptIcon`, drawer logic absorbed into `MobileTopBar`). Then work surface-by-surface: Hero → Sidebar → ConceptPage → CommandPalette.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, lucide-react (new), @xyflow/react (kept for diagram tabs only)

**Spec:** `docs/superpowers/specs/2026-05-05-ui-redesign-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | modify | add lucide-react |
| `app/globals.css` | rewrite | all design tokens |
| `app/layout.tsx` | modify | remove Space Grotesk, add Inter weight 800/900 |
| `lib/data/categories.ts` | modify | refined desaturated category colors |
| `components/icons/ConceptIcon.tsx` | create | maps concept ID → Lucide icon |
| `components/ThemeToggle.tsx` | rewrite | Lucide Sun/Moon + Framer rotation |
| `components/MobileTopBar.tsx` | rewrite | Lucide Menu, lg breakpoint, integrated drawer |
| `components/Hero.tsx` | rewrite | Hero C: topnav + centered headline + ticker |
| `components/HeroFlow.tsx` | delete | replaced by ticker in Hero.tsx |
| `components/Sidebar.tsx` | rewrite | Lucide icons, lg breakpoint, clean design |
| `app/lab/page.tsx` | modify | lg breakpoint, WelcomeScreen with Lucide |
| `components/ConceptPage.tsx` | rewrite | full redesign — all sections use Lucide icons |
| `components/CommandPalette.tsx` | modify | Lucide Search icon, responsive width |

---

## Task 1: Install lucide-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
cd /Users/muhammadjamil/Desktop/practice/system-design-app
npm install lucide-react
```

Expected output: `added 1 package` (lucide-react is a single package with tree-shakeable exports)

- [ ] **Step 2: Verify TypeScript types resolve**

```bash
node -e "const lr = require('lucide-react'); console.log(typeof lr.Search)"
```

Expected output: `function`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install lucide-react"
```

---

## Task 2: Rewrite design tokens in globals.css

**Files:**
- Rewrite: `app/globals.css`

- [ ] **Step 1: Replace globals.css entirely**

```css
/* app/globals.css */
@import "tailwindcss";

/* ── Fonts ── */
:root {
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), 'Fira Code', monospace;
}

/* ── Dark theme (default) ── */
:root {
  --bg: #0d1117;
  --s1: #161b22;
  --s2: #1c2128;
  --s3: #21262d;
  --b0: #21262d;
  --b1: #30363d;
  --b2: #484f58;

  --accent:        #ffa657;
  --accent-hover:  #f7cc6a;
  --accent-subtle: rgba(255,166,87,0.08);
  --accent-border: rgba(255,166,87,0.20);

  --t:  #f0f6fc;
  --tm: #8b949e;
  --td: #484f58;

  /* Severity */
  --sev-critical:    #ef4444;
  --sev-critical-bg: rgba(239,68,68,0.10);
  --sev-high:        #f97316;
  --sev-high-bg:     rgba(249,115,22,0.10);
  --sev-medium:      #f59e0b;
  --sev-medium-bg:   rgba(245,158,11,0.10);
}

[data-theme="light"] {
  --bg: #fdf8f0;
  --s1: #ffffff;
  --s2: #f6f1e8;
  --s3: #ede8de;
  --b0: #e8e0d4;
  --b1: #d8cfc0;
  --b2: #b8ae9e;

  --accent:        #d17844;
  --accent-hover:  #b86030;
  --accent-subtle: rgba(209,120,68,0.08);
  --accent-border: rgba(209,120,68,0.20);

  --t:  #1a1209;
  --tm: #6b6358;
  --td: #a89f92;

  --sev-critical:    #dc2626;
  --sev-critical-bg: rgba(220,38,38,0.08);
  --sev-high:        #ea580c;
  --sev-high-bg:     rgba(234,88,12,0.08);
  --sev-medium:      #d97706;
  --sev-medium-bg:   rgba(217,119,6,0.08);
}

/* ── Base ── */
*,
*::before,
*::after {
  box-sizing: border-box;
  overflow-wrap: break-word;
}

html, body {
  background-color: var(--bg);
  color: var(--t);
  font-family: var(--font-sans);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--b1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--b2); }

/* ── Code blocks ── */
pre, code { font-family: var(--font-mono); }
pre { overflow-x: auto; tab-size: 2; }

/* ── Section label ── */
.section-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

/* ── Severity badges ── */
.badge-critical {
  background: var(--sev-critical-bg);
  color: var(--sev-critical);
  border: 1px solid var(--sev-critical);
}
.badge-high {
  background: var(--sev-high-bg);
  color: var(--sev-high);
  border: 1px solid var(--sev-high);
}
.badge-medium {
  background: var(--sev-medium-bg);
  color: var(--sev-medium);
  border: 1px solid var(--sev-medium);
}

/* ── Concept page mini-nav ── */
.concept-mini-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--b0);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
}

/* ── Ticker (hero) ── */
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.ticker-track {
  animation: ticker-scroll 22s linear infinite;
}
.ticker-track:hover {
  animation-play-state: paused;
}

/* ── Motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Start dev server and verify the page background changed**

```bash
npm run dev
```

Open `http://localhost:3000`. Background should be `#0d1117` (darker, cooler than before). Light mode toggle should show warm cream `#fdf8f0`.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "design: overhaul design tokens — Slate/Parchment theme"
```

---

## Task 3: Update layout.tsx — consolidate to Inter

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'System Design Lab',
  description:
    'Master every architecture concept through real-world analogies, interactive diagrams, and CTO-level interview prep.',
  openGraph: {
    title: 'System Design Lab',
    description: 'Master system design from beginner to staff-level engineer.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify build has no type errors**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "design: consolidate to Inter font, remove Space Grotesk"
```

---

## Task 4: Update category colors

**Files:**
- Modify: `lib/data/categories.ts`

- [ ] **Step 1: Update categories.ts with refined desaturated palette**

```ts
// lib/data/categories.ts
import { Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'foundation',  label: 'Foundation',  color: '#5ba3c9' },
  { id: 'performance', label: 'Performance',  color: '#4db896' },
  { id: 'data',        label: 'Data',         color: '#8b78d4' },
  { id: 'async',       label: 'Async',        color: '#c9a84c' },
  { id: 'reliability', label: 'Reliability',  color: '#c97070' },
  { id: 'messaging',   label: 'Messaging',    color: '#c97a40' },
  { id: 'cloud',       label: 'Cloud',        color: '#4db0c9' },
];
```

- [ ] **Step 2: Verify dev server still compiles**

```bash
# dev server should hot-reload with no errors
# check browser console — no TypeScript errors
```

- [ ] **Step 3: Commit**

```bash
git add lib/data/categories.ts
git commit -m "design: refine category colors — desaturated ~20% for editorial feel"
```

---

## Task 5: Create ConceptIcon component

**Files:**
- Create: `components/icons/ConceptIcon.tsx`

- [ ] **Step 1: Create the icons directory and component**

```tsx
// components/icons/ConceptIcon.tsx
import {
  Boxes, Server, GitFork, Database, Globe, HardDrive,
  LayoutGrid, MessageSquare, Gauge, Scale, Zap, Workflow,
  MessageCircle, ListTodo, List, Shield, Network, Lock,
  ArrowLeftRight, Radio, Cpu, Braces, Package, Archive,
  UserCheck, AtSign, MapPin, Globe2, CloudLightning,
  FlaskConical, Search, Trophy, Sun, Moon, Lightbulb,
  CheckCircle2, XCircle, Copy, Check, ChevronLeft,
  ChevronRight, X, Menu, BookOpen, ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* Maps concept IDs to Lucide icons */
const CONCEPT_ICONS: Record<string, LucideIcon> = {
  monolith:        Boxes,
  apigateway:      Server,
  loadbalancer:    GitFork,
  caching:         Database,
  cdn:             Globe,
  databases:       HardDrive,
  sharding:        LayoutGrid,
  messagequeue:    MessageSquare,
  ratelimit:       Gauge,
  cap:             Scale,
  circuit:         Zap,
  kafka:           Workflow,
  rabbitmq:        MessageCircle,
  bullmq:          ListTodo,
  queuepatterns:   List,
  vpc:             Shield,
  subnets:         Network,
  'security-groups': Lock,
  'nat-gateway':   ArrowLeftRight,
  'ports-protocols': Radio,
  ec2:             Cpu,
  lambda:          Braces,
  containers:      Package,
  s3:              Archive,
  rds:             HardDrive,
  iam:             UserCheck,
  dns:             AtSign,
  route53:         MapPin,
  cloudflare:      Globe2,
  cloudfront:      CloudLightning,
};

interface ConceptIconProps {
  conceptId: string;
  size?: number;
  color?: string;
  className?: string;
}

export default function ConceptIcon({
  conceptId,
  size = 16,
  color = 'currentColor',
  className,
}: ConceptIconProps) {
  const Icon = CONCEPT_ICONS[conceptId] ?? FlaskConical;
  return <Icon size={size} color={color} className={className} strokeWidth={2} />;
}

/* Re-export UI chrome icons for convenient single import point */
export {
  FlaskConical,
  Search,
  Trophy,
  Sun,
  Moon,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  BookOpen,
  ChevronDown,
  Globe as GlobeIcon,
};
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/icons/ConceptIcon.tsx
git commit -m "feat: add ConceptIcon component — maps concept IDs to Lucide icons"
```

---

## Task 6: Redesign ThemeToggle

**Files:**
- Rewrite: `components/ThemeToggle.tsx`

- [ ] **Step 1: Rewrite ThemeToggle.tsx**

```tsx
// components/ThemeToggle.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className={`relative flex items-center justify-center rounded-lg transition-colors ${className}`}
      style={{
        width: 34,
        height: 34,
        color: 'var(--tm)',
        background: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000`. Click the theme toggle. Verify:
- Sun icon shown in dark mode, Moon in light mode
- Rotation animation plays on click
- No emoji visible

- [ ] **Step 3: Commit**

```bash
git add components/ThemeToggle.tsx
git commit -m "design: replace emoji with Lucide Sun/Moon in ThemeToggle, add rotation animation"
```

---

## Task 7: Update MobileTopBar — Lucide icons, lg breakpoint

**Files:**
- Rewrite: `components/MobileTopBar.tsx`

- [ ] **Step 1: Rewrite MobileTopBar.tsx**

The drawer already exists here. Update icons to Lucide, switch breakpoint from `md` to `lg`, add `onOpenPalette` prop.

```tsx
// components/MobileTopBar.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, FlaskConical } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

interface MobileTopBarProps {
  onOpenPalette?: () => void;
}

export default function MobileTopBar({ onOpenPalette }: MobileTopBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar — visible below lg */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:hidden"
        style={{
          height: 56,
          background: 'var(--s1)',
          borderBottom: '1px solid var(--b0)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 34, height: 34, color: 'var(--tm)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Open menu"
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-md"
            style={{ width: 24, height: 24, background: 'var(--accent)', color: '#0d1117' }}
          >
            <FlaskConical size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--t)' }}>
            System Design Lab
          </span>
        </div>

        {/* Right side: search + theme */}
        <div className="flex items-center gap-1">
          {onOpenPalette && (
            <button
              onClick={onOpenPalette}
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{ width: 34, height: 34, color: 'var(--tm)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label="Search"
            >
              <Search size={16} strokeWidth={2} />
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Drawer backdrop + panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
              style={{ width: 'min(85vw, 300px)' }}
            >
              {/* Close button inside drawer */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 30, height: 30, color: 'var(--tm)', background: 'var(--s3)' }}
                  aria-label="Close menu"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
              <Sidebar
                onClose={() => setOpen(false)}
                onOpenPalette={onOpenPalette}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/MobileTopBar.tsx
git commit -m "design: update MobileTopBar — Lucide icons, lg breakpoint, search shortcut"
```

---

## Task 8: Redesign Sidebar

**Files:**
- Rewrite: `components/Sidebar.tsx`

- [ ] **Step 1: Rewrite Sidebar.tsx**

```tsx
// components/Sidebar.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FlaskConical, Search, Globe as GlobeIcon, Trophy, BookOpen,
} from 'lucide-react';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import { useProgress } from '@/hooks/useProgress';
import ConceptIcon from './icons/ConceptIcon';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  onClose?: () => void;
  onOpenPalette?: () => void;
}

export default function Sidebar({ onClose, onOpenPalette }: SidebarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [activeCat, setActiveCat] = useState<string>('all');
  const { isViewed, count } = useProgress();

  const currentConcept = params.get('concept');
  const currentView = params.get('view');

  const filtered = CONCEPTS.filter(c =>
    activeCat === 'all' || c.cat === activeCat
  );

  function navigate(href: string) {
    router.push(href);
    onClose?.();
  }

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: 'var(--s1)', borderRight: '1px solid var(--b0)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--b0)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
          aria-label="Go to home"
        >
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 28, height: 28, background: 'var(--accent)', color: '#0d1117' }}
          >
            <FlaskConical size={14} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight leading-tight" style={{ color: 'var(--t)' }}>
              System Design
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--tm)', fontSize: 10 }}>Lab</div>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 flex-shrink-0">
        <button
          onClick={onOpenPalette}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--b0)',
            color: 'var(--td)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--b0)')}
        >
          <Search size={13} strokeWidth={2} style={{ color: 'var(--td)', flexShrink: 0 }} />
          <span className="flex-1 text-xs">Search concepts…</span>
          <kbd
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--s3)',
              color: 'var(--td)',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--b0)',
              fontSize: 9,
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Category filter pills */}
      <div
        className="px-3 pb-2.5 flex-shrink-0"
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        <div className="flex gap-1.5 min-w-max">
          <button
            onClick={() => setActiveCat('all')}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0"
            style={{
              background: activeCat === 'all' ? 'var(--accent)' : 'var(--s3)',
              color: activeCat === 'all' ? '#0d1117' : 'var(--tm)',
              border: activeCat === 'all' ? '1px solid var(--accent)' : '1px solid var(--b0)',
            }}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.id ? 'all' : cat.id)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0"
              style={{
                background: activeCat === cat.id ? `${cat.color}18` : 'var(--s3)',
                color: activeCat === cat.id ? cat.color : 'var(--tm)',
                border: activeCat === cat.id ? `1px solid ${cat.color}40` : '1px solid var(--b0)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Concept list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
        {CATEGORIES.filter(cat => activeCat === 'all' || cat.id === activeCat).map(cat => {
          const items = filtered.filter(c => c.cat === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id} className="mb-3">
              <div
                className="section-label px-2 py-1.5 mb-0.5"
                style={{ color: cat.color }}
              >
                {cat.label}
              </div>
              {items.map(c => {
                const viewed = isViewed(c.id);
                const active = currentConcept === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/lab?concept=${c.id}`)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors mb-0.5"
                    style={{
                      background: active ? `${cat.color}10` : 'transparent',
                      border: active ? `1px solid ${cat.color}30` : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = 'var(--s3)';
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Icon wrapper */}
                    <div
                      className="flex items-center justify-center rounded-md flex-shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        background: active ? `${cat.color}18` : 'var(--s3)',
                        border: active ? `1px solid ${cat.color}30` : '1px solid transparent',
                      }}
                    >
                      <ConceptIcon
                        conceptId={c.id}
                        size={12}
                        color={active ? cat.color : 'var(--td)'}
                      />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-medium truncate"
                        style={{ color: active ? cat.color : 'var(--t)' }}
                      >
                        {c.title}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--td)', fontSize: 10 }}>
                        {c.tag}
                      </div>
                    </div>

                    {/* Viewed dot */}
                    {viewed && !active && (
                      <span
                        className="flex-shrink-0 rounded-full"
                        style={{ width: 5, height: 5, background: cat.color, opacity: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer nav */}
      <div className="px-2 pb-2 flex-shrink-0" style={{ borderTop: '1px solid var(--b0)' }}>
        <div className="pt-2 space-y-0.5">
          <button
            onClick={() => navigate('/lab?view=realworld')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
            style={{
              background: currentView === 'realworld' ? 'rgba(201,168,76,0.10)' : 'transparent',
              border: currentView === 'realworld' ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
            }}
            onMouseEnter={e => {
              if (currentView !== 'realworld') e.currentTarget.style.background = 'var(--s3)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'realworld') e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              className="flex items-center justify-center rounded-md flex-shrink-0"
              style={{
                width: 22, height: 22,
                background: currentView === 'realworld' ? 'rgba(201,168,76,0.15)' : 'var(--s3)',
              }}
            >
              <GlobeIcon size={12} strokeWidth={2} color={currentView === 'realworld' ? '#c9a84c' : 'var(--td)'} />
            </div>
            <span className="text-xs font-medium" style={{ color: currentView === 'realworld' ? '#c9a84c' : 'var(--tm)' }}>
              Real World Systems
            </span>
          </button>

          <button
            onClick={() => navigate('/lab?view=quiz')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
            style={{
              background: currentView === 'quiz' ? 'rgba(201,112,112,0.10)' : 'transparent',
              border: currentView === 'quiz' ? '1px solid rgba(201,112,112,0.25)' : '1px solid transparent',
            }}
            onMouseEnter={e => {
              if (currentView !== 'quiz') e.currentTarget.style.background = 'var(--s3)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'quiz') e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              className="flex items-center justify-center rounded-md flex-shrink-0"
              style={{
                width: 22, height: 22,
                background: currentView === 'quiz' ? 'rgba(201,112,112,0.15)' : 'var(--s3)',
              }}
            >
              <Trophy size={12} strokeWidth={2} color={currentView === 'quiz' ? '#c97070' : 'var(--td)'} />
            </div>
            <span className="text-xs font-medium" style={{ color: currentView === 'quiz' ? '#c97070' : 'var(--tm)' }}>
              Take the Quiz
            </span>
          </button>
        </div>

        {/* Progress + theme toggle */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            <BookOpen size={11} strokeWidth={2} style={{ color: 'var(--td)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--tm)' }}>
              {count} / {CONCEPTS.length} studied
            </span>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-1.5 h-0.5 rounded-full overflow-hidden mx-1" style={{ background: 'var(--s3)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${(count / CONCEPTS.length) * 100}%`,
              background: 'var(--accent)',
              transition: 'width 500ms ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at `/lab`**

Desktop: sidebar shows with Lucide icons, amber CTA on logo, clean items.
Mobile (resize to < 1024px): sidebar hides, hamburger visible in top bar.

- [ ] **Step 3: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "design: redesign Sidebar — Lucide icons, lg breakpoint, refined hover states"
```

---

## Task 9: Redesign Hero page

**Files:**
- Rewrite: `components/Hero.tsx`
- Delete: `components/HeroFlow.tsx`

- [ ] **Step 1: Rewrite Hero.tsx with Hero C layout**

```tsx
// components/Hero.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { CONCEPTS } from '@/lib/data/concepts';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as number[] },
});

export default function Hero() {
  const router = useRouter();
  const allTitles = CONCEPTS.map(c => c.title);
  // Duplicate for seamless loop
  const tickerItems = [...allTitles, ...allTitles];

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Fixed top nav ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8"
        style={{
          height: 56,
          background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
          borderBottom: '1px solid var(--b0)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 26, height: 26, background: 'var(--accent)', color: '#0d1117' }}
          >
            <FlaskConical size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--t)' }}>
            System Design Lab
          </span>
        </div>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: 'Concepts', href: '/lab' },
            { label: 'Diagrams', href: '/lab' },
            { label: 'Interview', href: '/lab' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm transition-colors"
              style={{ color: 'var(--tm)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--t)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tm)')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: CTA + theme */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/lab')}
            className="hidden md:flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              padding: '6px 14px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)', e.currentTarget.style.color = '#0d1117')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-subtle)', e.currentTarget.style.color = 'var(--accent)')}
          >
            Open Lab
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Center content ── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">

        {/* Eyebrow */}
        <motion.div {...fadeUp(0)}>
          <div
            className="inline-flex items-center gap-2 rounded-full mb-8"
            style={{
              padding: '4px 14px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.10em',
              color: 'var(--accent)',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
            {CONCEPTS.length} Concepts · Interactive Diagrams · Interview Prep
          </div>
        </motion.div>

        {/* H1 */}
        <motion.div {...fadeUp(0.08)} className="mb-5">
          <h1
            className="tracking-tight"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: 'var(--t)',
            }}
          >
            System Design
            <span className="block" style={{ WebkitTextStroke: '1.5px var(--b2)', color: 'transparent' }}>
              from{' '}
              <span style={{ WebkitTextStroke: '0', color: 'var(--accent)' }}>zero</span>
              {' '}to staff.
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.16)}
          className="max-w-md mb-10"
          style={{
            fontSize: '1rem',
            lineHeight: 1.65,
            color: 'var(--tm)',
          }}
        >
          Every concept explained with real-world analogies, interactive diagrams,
          and CTO-grade interview answers.
        </motion.p>

        {/* CTA row */}
        <motion.div {...fadeUp(0.24)} className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => router.push('/lab')}
            className="rounded-lg font-semibold transition-all"
            style={{
              padding: '10px 24px',
              background: 'var(--accent)',
              color: '#0d1117',
              fontSize: '0.9375rem',
              boxShadow: '0 4px 20px var(--accent-subtle)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 28px var(--accent-subtle)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-subtle)';
            }}
          >
            Open the Lab →
          </button>
          <Link
            href="/lab"
            className="rounded-lg font-medium transition-colors"
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid var(--b1)',
              color: 'var(--tm)',
              fontSize: '0.9375rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--b2)';
              e.currentTarget.style.color = 'var(--t)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--b1)';
              e.currentTarget.style.color = 'var(--tm)';
            }}
          >
            Browse Concepts
          </Link>
        </motion.div>
      </main>

      {/* ── Ticker footer ── */}
      <footer
        className="fixed bottom-0 left-0 right-0 overflow-hidden flex-shrink-0"
        style={{
          height: 40,
          borderTop: '1px solid var(--b0)',
          background: 'var(--s1)',
        }}
      >
        <div className="ticker-track flex items-center h-full" style={{ width: 'max-content' }}>
          {tickerItems.map((title, i) => (
            <div
              key={i}
              className="flex items-center gap-3 flex-shrink-0"
              style={{
                padding: '0 20px',
                height: '100%',
                borderRight: '1px solid var(--b0)',
              }}
            >
              <span
                style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--accent)',
                  opacity: 0.5,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--td)', whiteSpace: 'nowrap' }}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2.2); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Delete HeroFlow.tsx**

```bash
rm components/HeroFlow.tsx
```

- [ ] **Step 3: Verify hero in browser**

Open `http://localhost:3000`. Verify:
- Fixed top nav with logo, nav links, "Open Lab" button
- Large heading with ghost text "from zero to staff."
- Animated amber pulse dot in eyebrow badge
- Scrolling ticker at bottom with concept names
- CTA buttons work and link to `/lab`
- Mobile: resize to < 768px — nav links hidden, layout stacks cleanly

- [ ] **Step 4: Commit**

```bash
git add components/Hero.tsx
git rm components/HeroFlow.tsx
git commit -m "design: redesign hero — minimal app-shell layout with fixed nav and scrolling ticker"
```

---

## Task 10: Update lab/page.tsx — breakpoint + WelcomeScreen

**Files:**
- Modify: `app/lab/page.tsx`

- [ ] **Step 1: Replace lab/page.tsx**

```tsx
// app/lab/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConceptPage from '@/components/ConceptPage';
import RealWorldView from '@/components/RealWorldView';
import Quiz from '@/components/Quiz';
import MobileTopBar from '@/components/MobileTopBar';
import CommandPalette from '@/components/CommandPalette';
import { CONCEPTS } from '@/lib/data/concepts';

function LabContent() {
  const params = useSearchParams();
  const conceptId = params.get('concept');
  const view = params.get('view');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const concept = conceptId ? CONCEPTS.find(c => c.id === conceptId) : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function renderMain() {
    if (view === 'quiz') return <Quiz />;
    if (view === 'realworld') return <RealWorldView />;
    if (concept) return <ConceptPage concept={concept} />;
    return <WelcomeScreen onOpenPalette={() => setPaletteOpen(true)} />;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Desktop sidebar — visible on lg+ */}
        <div className="hidden lg:flex flex-col flex-shrink-0 relative z-10" style={{ width: 260 }}>
          <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
        </div>

        {/* Mobile/tablet top bar — visible below lg */}
        <MobileTopBar onOpenPalette={() => setPaletteOpen(true)} />

        {/* Main content — offset for mobile top bar */}
        <div
          className="flex-1 overflow-y-auto relative z-10 pt-14 lg:pt-0"
          style={{ background: 'transparent', minWidth: 0 }}
        >
          {renderMain()}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

const WELCOME_CONCEPTS = [
  { id: 'loadbalancer' }, { id: 'caching' }, { id: 'kafka' },
  { id: 'rabbitmq' },     { id: 'cap' },     { id: 'circuit' },
  { id: 'cdn' },          { id: 'sharding' },
];

function WelcomeScreen({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
      <h2
        className="text-2xl font-bold mb-2 tracking-tight"
        style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}
      >
        System Design Lab
      </h2>
      <p className="text-sm max-w-xs mb-8" style={{ color: 'var(--tm)', lineHeight: 1.65 }}>
        {CONCEPTS.length} concepts. Interactive diagrams. CTO-level interview answers.
      </p>

      <button
        onClick={onOpenPalette}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm mb-10 transition-colors"
        style={{
          background: 'var(--s1)',
          border: '1px solid var(--b1)',
          color: 'var(--tm)',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}
      >
        <Search size={14} strokeWidth={2} />
        <span>Search concepts…</span>
        <kbd
          className="text-xs px-2 py-0.5 rounded ml-1"
          style={{
            background: 'var(--s3)',
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--b0)',
            color: 'var(--td)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {WELCOME_CONCEPTS.map(({ id }) => {
          const c = CONCEPTS.find(x => x.id === id);
          if (!c) return null;
          const cat = c.cat;
          // Resolve color from category — import inline to avoid circular dep
          const catColors: Record<string, string> = {
            foundation: '#5ba3c9', performance: '#4db896', data: '#8b78d4',
            async: '#c9a84c', reliability: '#c97070', messaging: '#c97a40', cloud: '#4db0c9',
          };
          const color = catColors[cat] ?? 'var(--accent)';
          return (
            <Link
              key={id}
              href={`/lab?concept=${id}`}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                border: `1px solid ${color}30`,
                color: color,
                background: `${color}0d`,
              }}
            >
              {c.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function LabPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg)', minHeight: '100vh' }} />}>
      <LabContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify lab layout in browser**

Desktop (≥ 1024px): sidebar at 260px on left, main content scrollable on right.
Tablet (768–1023px): no sidebar, hamburger in top bar opens drawer.
Mobile (< 768px): same as tablet but narrower.

- [ ] **Step 3: Commit**

```bash
git add app/lab/page.tsx
git commit -m "design: update lab page — lg breakpoint for sidebar, clean WelcomeScreen with Lucide"
```

---

## Task 11: Update CommandPalette — Lucide Search icon

**Files:**
- Modify: `components/CommandPalette.tsx`

- [ ] **Step 1: Replace emoji icons with Lucide in CommandPalette.tsx**

Replace only the icon-related lines. The logic stays the same.

Change line 1 (imports) — add lucide-react:

```tsx
// At top of file, add:
import { Search, Globe as GlobeIcon, Trophy } from 'lucide-react';
import ConceptIcon from './icons/ConceptIcon';
```

Change the search input emoji (line ~140):

```tsx
// Before:
<span style={{ color: 'var(--tm)', fontSize: 16 }}>🔍</span>

// After:
<Search size={16} strokeWidth={2} style={{ color: 'var(--tm)', flexShrink: 0 }} />
```

Change STATIC_RESULTS to remove emoji `icon` field (the icon will be resolved by component):

```tsx
const STATIC_RESULTS: Result[] = [
  { type: 'section', id: 'realworld', title: 'Real World Systems', sub: 'Netflix, Uber, Discord…', icon: 'realworld', color: '#c9a84c', href: '/lab?view=realworld' },
  { type: 'section', id: 'quiz',      title: 'Take the Quiz',      sub: `${CONCEPTS.length} interview questions`, icon: 'quiz', color: '#c97070', href: '/lab?view=quiz' },
];
```

Replace the icon rendering in the results list (line ~181):

```tsx
// Before:
<span
  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base"
  style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
>
  {item.icon}
</span>

// After:
<span
  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
  style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
>
  {item.type === 'section' && item.id === 'realworld' && <GlobeIcon size={15} strokeWidth={2} color={item.color} />}
  {item.type === 'section' && item.id === 'quiz'      && <Trophy    size={15} strokeWidth={2} color={item.color} />}
  {item.type === 'concept' && <ConceptIcon conceptId={item.id} size={15} color={item.color} />}
</span>
```

Also make the panel responsive — change the width style:

```tsx
// Before:
style={{ transform: 'translateX(-50%)', width: '100%', maxWidth: 560, padding: '0 16px' }}

// After:
style={{ transform: 'translateX(-50%)', width: '100%', maxWidth: 560, padding: '0 clamp(12px, 4vw, 16px)' }}
```

- [ ] **Step 2: Verify command palette in browser**

Press `⌘K`. Verify:
- Lucide Search icon in input
- Globe icon for Real World Systems
- Trophy icon for Quiz
- Concept icons render for search results (type a concept name)
- No emoji visible anywhere

- [ ] **Step 3: Commit**

```bash
git add components/CommandPalette.tsx
git commit -m "design: replace emoji icons in CommandPalette with Lucide icons"
```

---

## Task 12: Redesign ConceptPage — full Lucide + refined cards

**Files:**
- Rewrite: `components/ConceptPage.tsx`

This is the largest file. Replace the entire file — all sections updated with new design tokens, Lucide icons replacing emojis, underline-style mini-nav, and responsive cards.

- [ ] **Step 1: Rewrite components/ConceptPage.tsx**

```tsx
// components/ConceptPage.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Lightbulb, CheckCircle2, XCircle,
  Copy, Check, ChevronDown,
} from 'lucide-react';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import { useProgress } from '@/hooks/useProgress';
import ConceptIcon from './icons/ConceptIcon';
import type { Concept, FailureMode } from '@/lib/types';

const ConceptDiagram = dynamic(() => import('./ConceptDiagram'), { ssr: false });

/* ── helpers ── */

function getCatColor(cat: string): string {
  return CATEGORIES.find(c => c.id === cat)?.color ?? 'var(--accent)';
}

const SECTIONS = [
  { id: 'overview',   label: 'Overview'     },
  { id: 'analogy',    label: 'Analogy'      },
  { id: 'how',        label: 'How It Works' },
  { id: 'components', label: 'Components'   },
  { id: 'diagram',    label: 'Diagram'      },
  { id: 'decide',     label: 'Decision'     },
  { id: 'failures',   label: 'Failures'     },
  { id: 'code',       label: 'Code'         },
  { id: 'interview',  label: 'Interview'    },
];

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="section-label mb-4" style={{ color }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--s1)',
        border: '1px solid var(--b0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: FailureMode['severity'] }) {
  const map = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
  };
  return (
    <span className={`${map[severity]} section-label px-2.5 py-0.5 rounded-full`}>
      {severity.toUpperCase()}
    </span>
  );
}

/* ── Mini-nav ── */

function MiniNav({ active, color }: { active: string; color: string }) {
  function scrollTo(id: string) {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <nav
      className="concept-mini-nav px-4 py-0 overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center min-w-max">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              color: active === s.id ? color : 'var(--tm)',
              borderBottom: active === s.id ? `2px solid ${color}` : '2px solid transparent',
              background: 'transparent',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── Overview ── */

function OverviewSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  return (
    <section id="section-overview" className="mb-8">
      <SectionLabel color={color}>Overview</SectionLabel>
      <Card>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>
          {concept.overview ?? concept.te.def}
        </p>
        {concept.te.types.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--b0)' }}>
            {concept.te.types.map(t => (
              <div
                key={t.n}
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: 'var(--s2)', border: '1px solid var(--b0)' }}
              >
                <span className="font-semibold" style={{ color }}>{t.n}</span>
                <span className="block mt-0.5" style={{ color: 'var(--tm)' }}>{t.d}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

/* ── Analogy ── */

function AnalogySection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  return (
    <section id="section-analogy" className="mb-8">
      <SectionLabel color={color}>The Analogy</SectionLabel>
      <Card>
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{
              width: 48, height: 48,
              background: `${color}12`,
              border: `1px solid ${color}25`,
            }}
          >
            <ConceptIcon conceptId={concept.id} size={22} color={color} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--t)' }}>
              {concept.a.t}
            </h3>
            {concept.a.tx.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm leading-relaxed mb-2" style={{ color: 'var(--tm)' }}>
                {para}
              </p>
            ))}
          </div>
        </div>
        {/* Key insight */}
        <div
          className="mt-4 rounded-xl p-4 flex gap-3"
          style={{ background: `${color}08`, border: `1px solid ${color}20` }}
        >
          <Lightbulb size={16} strokeWidth={2} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>
            <span className="font-semibold" style={{ color }}>Key insight: </span>
            {concept.a.s}
          </p>
        </div>
      </Card>
    </section>
  );
}

/* ── How It Works ── */

function HowItWorksSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  return (
    <section id="section-how" className="mb-8">
      <SectionLabel color={color}>How It Works</SectionLabel>
      <Card>
        {concept.howItWorks ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>{concept.howItWorks}</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--tm)' }}>{concept.te.when}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>{concept.te.trade}</p>
          </>
        )}
      </Card>
    </section>
  );
}

/* ── Components ── */

function ComponentsSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const items = concept.components;
  if (!items || items.length === 0) return null;
  return (
    <section id="section-components" className="mb-8">
      <SectionLabel color={color}>Components</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(comp => (
          <div
            key={comp.name}
            className="rounded-xl p-4 transition-all"
            style={{
              background: 'var(--s1)',
              border: '1px solid var(--b0)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 28, height: 28, background: `${color}10`, border: `1px solid ${color}25` }}
              >
                <ConceptIcon conceptId={concept.id} size={13} color={color} />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--t)' }}>{comp.name}</span>
            </div>
            <p className="text-xs font-medium mb-1" style={{ color }}>{comp.role}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{comp.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Diagram ── */

function DiagramSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  return (
    <section id="section-diagram" className="mb-8">
      <SectionLabel color={color}>Architecture Diagram</SectionLabel>
      <ConceptDiagram conceptId={concept.id} color={color} />
    </section>
  );
}

/* ── Decision ── */

function DecisionSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const d = concept.decision;
  if (!d) return null;
  return (
    <section id="section-decide" className="mb-8">
      <SectionLabel color={color}>Decision Guide</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(77,184,150,0.06)', border: '1px solid rgba(77,184,150,0.20)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={13} strokeWidth={2} color="var(--g, #4db896)" />
            <span className="section-label" style={{ color: '#4db896' }}>Choose when</span>
          </div>
          <ul className="space-y-2">
            {d.choose.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--t)' }}>
                <span style={{ color: '#4db896', flexShrink: 0 }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(201,112,112,0.06)', border: '1px solid rgba(201,112,112,0.20)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={13} strokeWidth={2} color="var(--r, #c97070)" />
            <span className="section-label" style={{ color: '#c97070' }}>Avoid when</span>
          </div>
          <ul className="space-y-2">
            {d.avoid.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--t)' }}>
                <span style={{ color: '#c97070', flexShrink: 0 }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {d.vs && d.vs.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--b0)' }}>
          <div className="px-4 py-2.5" style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b0)' }}>
            <span className="section-label" style={{ color: 'var(--tm)' }}>vs. Alternatives</span>
          </div>
          {d.vs.map((alt, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-start gap-3"
              style={{
                background: i % 2 === 0 ? 'var(--s1)' : 'var(--s2)',
                borderTop: i > 0 ? '1px solid var(--b0)' : undefined,
              }}
            >
              <span className="text-xs font-semibold flex-shrink-0" style={{ color, minWidth: 100 }}>
                vs. {alt.name}
              </span>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{alt.when}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Failures ── */

function FailuresSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const failures = concept.failures;
  if (!failures || failures.length === 0) return null;
  return (
    <section id="section-failures" className="mb-8">
      <SectionLabel color={color}>Failure Modes & Fixes</SectionLabel>
      <div className="space-y-3">
        {failures.map(f => (
          <div
            key={f.name}
            className="rounded-xl p-4"
            style={{ background: 'var(--s1)', border: '1px solid var(--b0)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-sm font-semibold" style={{ color: 'var(--t)' }}>{f.name}</span>
              <SeverityBadge severity={f.severity} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="section-label mb-1" style={{ color: 'var(--accent)' }}>Cause</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{f.cause}</p>
              </div>
              <div>
                <div className="section-label mb-1" style={{ color: '#c97070' }}>Symptom</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{f.symptom}</p>
              </div>
              <div>
                <div className="section-label mb-1" style={{ color: '#4db896' }}>Fix</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{f.fix}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Code ── */

function CodeSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const [copied, setCopied] = useState(false);

  function copy() {
    if (concept.te.code) {
      navigator.clipboard.writeText(concept.te.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section id="section-code" className="mb-8">
      <SectionLabel color={color}>Code Example & Case Study</SectionLabel>
      <div className="space-y-3">
        {concept.te.code && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--b0)' }}>
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b0)' }}
            >
              <span className="section-label" style={{ color: 'var(--tm)' }}>{concept.title}</span>
              <button
                onClick={copy}
                className="flex items-center justify-center rounded-md transition-colors"
                style={{
                  width: 28, height: 28,
                  color: copied ? '#4db896' : 'var(--tm)',
                  background: 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                title={copied ? 'Copied!' : 'Copy code'}
                aria-label={copied ? 'Copied!' : 'Copy code'}
              >
                {copied
                  ? <Check size={14} strokeWidth={2.5} />
                  : <Copy size={14} strokeWidth={2} />
                }
              </button>
            </div>
            <pre
              className="p-4 text-xs leading-relaxed overflow-x-auto"
              style={{ background: 'var(--s1)', color: 'var(--t)', fontFamily: 'var(--font-mono)' }}
            >
              <code>{concept.te.code}</code>
            </pre>
          </div>
        )}
        <div className="rounded-xl p-4" style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
          <div className="section-label mb-3" style={{ color }}>Real-World Case Study</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {concept.te.rw.ex.map(ex => (
              <span
                key={ex}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}
              >
                {ex}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>{concept.te.rw.cs}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Interview ── */

function InterviewSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <section id="section-interview" className="mb-8">
      <SectionLabel color={color}>Interview Prep</SectionLabel>
      <div className="space-y-3">
        <Card>
          <div className="section-label mb-2" style={{ color: 'var(--accent)' }}>Common Question</div>
          <p className="text-sm font-semibold leading-relaxed mb-4" style={{ color: 'var(--t)' }}>
            {concept.interview.q}
          </p>
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: `${color}10`,
                border: `1px solid ${color}30`,
                color,
              }}
            >
              Show Model Answer
              <ChevronDown size={13} strokeWidth={2.5} />
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div
                  className="rounded-xl p-4 mb-3 text-sm leading-relaxed"
                  style={{ background: `${color}08`, border: `1px solid ${color}20`, color: 'var(--t)' }}
                  dangerouslySetInnerHTML={{ __html: concept.interview.a }}
                />
                <button
                  onClick={() => setShowAnswer(false)}
                  className="text-xs"
                  style={{ color: 'var(--td)' }}
                >
                  Hide answer
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </Card>

        <div className="rounded-xl p-4" style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
          <div className="section-label mb-3" style={{ color: 'var(--tm)' }}>Follow-up Questions</div>
          <ul className="space-y-2.5">
            {concept.interview.fu.map((q, i) => (
              <li key={i} className="flex gap-2.5 text-sm" style={{ color: 'var(--tm)' }}>
                <span style={{ color, flexShrink: 0 }}>→</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Header ── */

function ConceptHeader({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const idx = CONCEPTS.findIndex(c => c.id === concept.id);
  const prev = idx > 0 ? CONCEPTS[idx - 1] : null;
  const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null;

  return (
    <div
      className="px-4 md:px-6 py-3.5 flex items-center gap-3"
      style={{ borderBottom: '1px solid var(--b0)' }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 36, height: 36, background: `${color}12`, border: `1px solid ${color}30` }}
      >
        <ConceptIcon conceptId={concept.id} size={18} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold leading-tight truncate" style={{ color: 'var(--t)' }}>
          {concept.title}
        </h1>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--td)' }}>{concept.tag}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {prev && (
          <Link
            href={`/lab?concept=${prev.id}`}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 30, height: 30, color: 'var(--tm)', border: '1px solid var(--b0)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={prev.title}
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </Link>
        )}
        {next && (
          <Link
            href={`/lab?concept=${next.id}`}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 30, height: 30, color: 'var(--tm)', border: '1px solid var(--b0)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={next.title}
          >
            <ChevronRight size={15} strokeWidth={2} />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Main ConceptPage ── */

export default function ConceptPage({ concept }: { concept: Concept }) {
  const [activeSection, setActiveSection] = useState('overview');
  const containerRef = useRef<HTMLDivElement>(null);
  const { markViewed } = useProgress();

  useEffect(() => { markViewed(concept.id); }, [concept.id, markViewed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('section-', ''));
          }
        }
      },
      { root: container, rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [concept.id]);

  const color = getCatColor(concept.cat);

  return (
    <div className="flex flex-col h-full">
      <ConceptHeader concept={concept} />
      <MiniNav active={activeSection} color={color} />
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ background: 'var(--bg)' }}
      >
        <motion.div
          key={concept.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto px-4 md:px-6 py-8"
        >
          <OverviewSection   concept={concept} />
          <AnalogySection    concept={concept} />
          <HowItWorksSection concept={concept} />
          <ComponentsSection concept={concept} />
          <DiagramSection    concept={concept} />
          <DecisionSection   concept={concept} />
          <FailuresSection   concept={concept} />
          <CodeSection       concept={concept} />
          <InterviewSection  concept={concept} />
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Verify a concept page in browser**

Navigate to `http://localhost:3000/lab?concept=loadbalancer`. Verify:
- Header: Lucide icon (GitFork) in colored wrapper, chevron prev/next buttons
- Mini-nav: underline-style active tab, scrollable on mobile
- All sections render with correct card styling
- Analogy: ConceptIcon in icon wrapper, Lightbulb for key insight
- Decision: CheckCircle2 / XCircle icons
- Code: Copy/Check icon-only button, no emoji
- Interview: ChevronDown on "Show Model Answer" button
- Light mode: warm parchment background, cards have subtle shadow

- [ ] **Step 4: Commit**

```bash
git add components/ConceptPage.tsx
git commit -m "design: redesign ConceptPage — Lucide icons throughout, refined cards and mini-nav"
```

---

## Task 13: Final responsive check + polish commit

**Files:**
- Verify only — no code changes unless issues found

- [ ] **Step 1: Test at key breakpoints in browser**

Open DevTools → responsive mode. Test at:

| Width | What to verify |
|---|---|
| 320px | No horizontal scroll, text readable, ticker visible |
| 375px | Hero text scales with clamp(), CTA buttons stack cleanly |
| 768px | Lab: drawer sidebar works, concept page full-width |
| 1024px | Lab: fixed sidebar appears, main content centered |
| 1440px | Hero: topnav balanced, content centered at max-w |

- [ ] **Step 2: Test light mode**

Toggle to light mode. Verify:
- Hero: warm parchment `#fdf8f0` background, amber accent adapts
- Sidebar: white background, warm borders
- Concept cards: white with subtle warm shadow
- All text readable (no white-on-white or black-on-black)

- [ ] **Step 3: Test dark mode**

Toggle back to dark. Verify:
- `#0d1117` background throughout
- Ticker running smoothly
- No overflow on any page
- Console: zero errors

- [ ] **Step 4: Verify overflow-wrap works**

Navigate to a concept with long text (e.g., `/lab?concept=cap`). Resize to 320px. Verify all text wraps, no horizontal overflow.

- [ ] **Step 5: Commit if any polish fixes were made**

```bash
git add -A
git commit -m "design: responsive polish — verified across 320px to 1440px, dark and light modes"
```

- [ ] **Step 6: Final build check**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no type errors.

```bash
git add -A
git commit -m "chore: verify production build passes after full UI redesign"
```

---

## Self-Review Notes

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Slate/Parchment tokens | Task 2 |
| Inter consolidation | Task 3 |
| Refined category colors | Task 4 |
| ConceptIcon (all IDs mapped) | Task 5 |
| ThemeToggle Lucide | Task 6 |
| MobileTopBar lg breakpoint | Task 7 |
| Hero C layout + ticker | Task 9 |
| Sidebar Lucide icons | Task 8 |
| Lab lg breakpoint | Task 10 |
| CommandPalette Lucide | Task 11 |
| ConceptPage full redesign | Task 12 |
| Fully responsive | Task 13 |
| HeroFlow deleted | Task 9 |
| `--accent` token used everywhere | Task 2 |
| Framer Motion sidebar drawer | Task 7 |
| Ticker pause on hover | Task 2 (CSS), Task 9 |
