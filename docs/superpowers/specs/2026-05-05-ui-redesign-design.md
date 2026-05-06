# UI Redesign — System Design Lab
**Date:** 2026-05-05  
**Status:** Approved for implementation

---

## Summary

Full visual redesign of the System Design Lab app to FAANG-level production quality. Replace emoji icons with Lucide React icons, adopt the Slate/Parchment theme (GitHub-dark + warm cream light), upgrade typography within the existing Inter stack, refine the multi-color category system, redesign the hero page as a minimal app-shell, and make the entire app fully responsive across all screen sizes.

---

## Design Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Theme | Slate / Parchment | GitHub-dark + warm cream light — editorial, readable |
| Hero layout | C — Minimal / App-Shell | Top nav, centered headline, scrolling concept ticker |
| Color system | Multi-color (refined) | Category colors as cognitive anchors for learning |
| Icon library | Lucide React | 2px stroke, matches Inter weight, ecosystem standard |
| Font | Inter (keep) | Already installed, perfect pairing, no change needed |
| Responsiveness | Fully responsive | Mobile-first, all breakpoints: 320px → 1920px |

---

## 1. Design Tokens

### 1.1 Color Palette

**Dark mode (default)**
```css
--bg:     #0d1117   /* page background */
--s1:     #161b22   /* sidebar, cards */
--s2:     #1c2128   /* elevated cards, code bg */
--s3:     #21262d   /* hover states, dividers */
--b0:     #21262d   /* border subtle */
--b1:     #30363d   /* border default */
--b2:     #484f58   /* border strong */

--t:      #f0f6fc   /* primary text */
--tm:     #8b949e   /* muted text */
--td:     #484f58   /* dim text / labels */

--accent: #ffa657   /* amber — primary interactive */
--accent-hover: #f7cc6a
--accent-subtle: rgba(255,166,87,0.08)
--accent-border: rgba(255,166,87,0.20)
```

**Light mode**
```css
--bg:     #fdf8f0   /* warm parchment */
--s1:     #ffffff   /* sidebar, cards */
--s2:     #f6f1e8   /* slightly warm off-white */
--s3:     #ede8de   /* hover, dividers */
--b0:     #e8e0d4   /* border subtle */
--b1:     #d8cfc0   /* border default */
--b2:     #b8ae9e   /* border strong */

--t:      #1a1209   /* near-black warm */
--tm:     #6b6358   /* warm muted */
--td:     #a89f92   /* warm dim */

--accent: #d17844   /* warm amber (light mode version) */
--accent-hover: #b86030
--accent-subtle: rgba(209,120,68,0.08)
--accent-border: rgba(209,120,68,0.20)
```

### 1.2 Category Colors (refined — desaturated ~20%)

| Category | Dark token | Light token | Usage |
|---|---|---|---|
| foundation | `#5ba3c9` (muted sky) | `#2b6cb0` | Load Balancer, API Gateway, Monolith |
| performance | `#4db896` (muted emerald) | `#276749` | Caching, CDN, Rate Limiting |
| data | `#8b78d4` (muted violet) | `#553c9a` | Databases, Sharding |
| async | `#c9a84c` (muted amber) | `#975a16` | Message Queues, Kafka, BullMQ |
| reliability | `#c97070` (muted red) | `#9b2c2c` | Circuit Breaker, CAP Theorem |
| messaging | `#c97a40` (muted orange) | `#9c4221` | RabbitMQ |
| cloud | `#4db0c9` (muted cyan) | `#2c7a7b` | VPC, DNS, Serverless, Cloud Arch |

**Rule:** Colors are used at 100% for category labels and active indicators only. All other uses (card backgrounds, icon wrappers, chips) use the color at 8–15% opacity.

### 1.3 Typography

Keep existing font stack — no change needed.

```css
--font-sans:    'Inter', system-ui, sans-serif
--font-display: 'Inter', system-ui, sans-serif  /* use weight 800-900 for display */
--font-mono:    'JetBrains Mono', 'Fira Code', monospace
```

**Scale:**
```
display:   clamp(2.5rem, 6vw, 4rem)  weight 900  tracking -0.04em  lh 1.0
headline:  1.5rem                     weight 800  tracking -0.02em  lh 1.1
title:     1.125rem                   weight 700  tracking -0.01em  lh 1.3
body:      1rem                       weight 400                    lh 1.65
small:     0.875rem                   weight 400                    lh 1.6
label:     0.6875rem                  weight 700  tracking 0.10em  lh 1.2  uppercase
mono:      0.8125rem                  weight 400                    lh 1.7
```

### 1.4 Spacing & Radius

```
sidebar width:  260px (desktop)
content max-w:  48rem (768px)
page padding:   1.5rem (mobile) → 2rem (desktop)
card padding:   1.25rem
section gap:    2.5rem
border-radius:  card=12px  button=8px  badge=20px  icon-wrapper=8px  input=8px
```

### 1.5 Shadows & Elevation

```
card:    0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)  [light only]
popover: 0 8px 32px rgba(0,0,0,0.32)
glow:    0 0 0 3px var(--accent-subtle)  [focus ring]
```

### 1.6 Motion

```
duration-fast:   120ms  ease-out    (hover, active states)
duration-base:   220ms  ease-out    (content transitions)
duration-enter:  320ms  cubic-bezier(0.16, 1, 0.3, 1)  (page enter, modals)
duration-exit:   180ms  ease-in     (leave)
reduced-motion:  respect prefers-reduced-motion — disable all animations
```

---

## 2. Page Architecture

### 2.1 Responsive Breakpoints

```
xs:  < 480px    mobile portrait
sm:  480–767px  mobile landscape
md:  768–1023px tablet
lg:  1024–1279px desktop
xl:  ≥ 1280px   wide desktop
```

**Layout strategy per breakpoint:**

| Breakpoint | Hero | Lab layout |
|---|---|---|
| xs/sm | Stack: nav → headline → CTA → ticker | Drawer sidebar (full-screen overlay) |
| md | Same as xs/sm + wider content | Drawer sidebar with hamburger toggle |
| lg | Full hero with ticker | Fixed sidebar 260px + main content |
| xl | Full hero | Fixed sidebar 280px + main content max-w 56rem |

### 2.2 Hero Page (`/`)

**Structure:**
```
<header>  fixed top nav: logo | nav links | "Open Lab" CTA button
<main>    centered: eyebrow label → h1 → subtitle → CTA row
<footer>  scrolling concept ticker (infinite loop, pause on hover)
```

**Top nav (responsive):**
- Desktop: logo left, nav links center, CTA right
- Mobile (< md): logo left, hamburger right — nav links hidden in mobile menu

**H1 copy:**
```
System Design
from zero to staff.
```
Line 2 uses `-webkit-text-stroke: 1.5px` with `color: transparent` for the ghost/outline text treatment on "zero to staff." The word "zero" gets `color: var(--accent)`.

**CTA row:** `Open the Lab →` (filled amber) + `Browse Concepts` (ghost)

**Ticker:** Infinite horizontal scroll of all concept names separated by `·` dots. Pauses on hover. 20s duration. Uses `animation: ticker-scroll linear infinite`.

**Animations (Framer Motion):**
- Eyebrow: fade up, delay 0ms
- H1: fade up, delay 80ms
- Subtitle: fade up, delay 160ms  
- CTA row: fade up, delay 240ms
- Ticker: always running, no entrance animation

### 2.3 Lab Page (`/lab`)

**Desktop layout:** `display: flex` — sidebar fixed 260px + scrollable main area.

**Mobile layout:** Sidebar becomes a drawer. Toggle via hamburger in `MobileTopBar`. Drawer slides in from left with overlay backdrop.

**Sidebar sections (top → bottom):**
1. Logo area: Lucide `FlaskConical` icon + wordmark
2. Search button (triggers CommandPalette) — `⌘K` badge
3. Category filter pills (horizontal scroll, single-select)
4. Concept list grouped by category — each item: icon wrapper + title + tag
5. Footer: Real World Systems nav item + Quiz nav item + progress bar + theme toggle

**Main content area:** Renders one of:
- `<ConceptPage>` when `?concept=` param present
- `<RealWorldView>` when `?view=realworld`
- `<Quiz>` when `?view=quiz`
- Welcome/empty state otherwise

---

## 3. Component Redesign Specs

### 3.1 Icons — replacing all emojis

Install `lucide-react`. Replace every emoji with a Lucide icon.

**Concept icon map:**

| Concept ID | Lucide Icon | Category color |
|---|---|---|
| monolith | `Boxes` | foundation |
| loadbalancer | `GitFork` | foundation |
| caching | `Database` | performance |
| cdn | `Globe` | performance |
| api-gateway | `Server` | foundation |
| sharding | `LayoutGrid` | data |
| databases | `HardDrive` | data |
| kafka | `Workflow` | async |
| rabbitmq | `MessageSquare` | messaging |
| bullmq | `ListTodo` | async |
| cap | `Scale` | reliability |
| circuit | `Zap` | reliability |
| ratelimit | `Gauge` | performance |
| dns | `AtSign` | cloud |
| vpc | `Shield` | cloud |
| serverless | `Cloud` | cloud |
| cloudarch | `Network` | cloud |

**UI chrome icons:**

| Location | Icon |
|---|---|
| Logo | `FlaskConical` |
| Search | `Search` |
| Real World | `Globe` |
| Quiz | `Trophy` |
| Theme toggle | `Sun` / `Moon` |
| Key insight | `Lightbulb` |
| Choose when ✅ | `CheckCircle2` |
| Avoid when ❌ | `XCircle` |
| Code copy | `Copy` / `Check` |
| Prev/Next nav | `ChevronLeft` / `ChevronRight` |
| Close drawer | `X` |
| Menu | `Menu` |
| Progress | `BookOpen` |

### 3.2 Sidebar

- Width: 260px desktop, full-screen drawer on mobile
- Background: `var(--s1)` with `border-right: 1px solid var(--b0)`
- Category filter: horizontal scrollable pill row, `overflow-x: auto`, hide scrollbar
- Concept items: icon wrapper (20×20, `border-radius: 6px`, category color at 12% opacity) + title + tag
- Active item: `background: categoryColor at 8%`, `border: 1px solid categoryColor at 20%`, text at category color
- Viewed indicator: 6px dot at category color, right side
- Progress bar at bottom: full width, `height: 3px`, category green fill

### 3.3 Concept Page

**ConceptHeader:**
- Icon wrapper: 36×36, `border-radius: 10px`, category color bg
- Replace emoji in icon wrapper with Lucide icon at 18px, category color
- Prev/Next: `ChevronLeft` / `ChevronRight` icons, not text arrows

**MiniNav:**
- Sticky, backdrop blur, `background: color-mix(in srgb, var(--bg) 85%, transparent)`
- Active tab: category color text + bottom border (underline style, no filled bg)
- Horizontally scrollable on mobile, hide scrollbar

**Section cards:**
- `background: var(--s1)`, `border: 1px solid var(--b0)`, `border-radius: 12px`
- Light mode: add `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`

**AnalogySection:**
- Replace `concept.a.v` emoji with corresponding Lucide icon
- Icon wrapper: 48×48, `border-radius: 12px`

**ComponentsSection:**
- Replace `comp.icon` emoji with Lucide icon (derive from component name semantics)
- Grid: 1 col mobile, 2 col sm+

**DecisionSection:**
- "Choose when" header: `CheckCircle2` icon (green) instead of ✅
- "Avoid when" header: `XCircle` icon (red) instead of ❌

**CodeSection:**
- Copy button: `Copy` icon → `Check` icon on success (with green color)
- Remove text "Copy" / "Copied", icon-only button

**InterviewSection:**
- "Show Model Answer" button: keep text, add `ChevronDown` icon

### 3.4 CommandPalette

- Backdrop: `rgba(0,0,0,0.6)` blur
- Container: `max-width: 560px`, centered, `border-radius: 12px`
- Search input: `Search` icon prefix, `border-radius: 8px`
- Results: icon + title + tag, keyboard navigable
- Fully responsive: on mobile takes 90vw width

### 3.5 ThemeToggle

- Replace emoji ☀️ / 🌙 with `Sun` / `Moon` Lucide icons
- 36×36 button, `border-radius: 8px`, subtle hover bg
- Animate: rotate 180deg + scale on switch (Framer Motion)

### 3.6 MobileTopBar

- Height: 56px
- Left: `Menu` icon (hamburger) → opens sidebar drawer
- Center: Logo text
- Right: ThemeToggle + optional `Search` icon shortcut
- Only visible on `< lg` breakpoints
- Fixed, backdrop blur

---

## 4. Responsiveness Requirements

### Mobile (xs/sm — < 768px)

- Sidebar: hidden by default, full-screen drawer overlay triggered by hamburger
- Drawer: slides in from left, 85vw max, backdrop closes on tap
- Hero: stacked single column, `font-size` scales with `clamp()`
- Ticker: still visible and scrolling
- Concept page: full-width, `padding: 1rem`, MiniNav scrollable
- Cards: full-width, no grid
- ComponentsSection: 1 column
- DecisionSection: 1 column (choose/avoid stacked)
- CommandPalette: 92vw wide

### Tablet (md — 768–1023px)

- Sidebar: drawer (same as mobile) OR narrow icon-only sidebar (optional v2 enhancement)
- Hero: 2-column layout possible but single column is fine
- Content max-w: unset (full width - padding)
- ComponentsSection: 2 columns
- DecisionSection: 2 columns

### Desktop (lg+ — ≥ 1024px)

- Sidebar: fixed 260px, always visible
- Hero: full layout with ticker
- Content: centered, `max-width: 48rem`
- ComponentsSection: 2–3 columns

### Overflow rules

- Never allow horizontal scroll on `body`
- All text: `overflow-wrap: break-word`
- Code blocks: `overflow-x: auto` (contained scroll)
- Images/diagrams: `max-width: 100%`
- React Flow diagrams: constrained to their container, no overflow

---

## 5. Animation Inventory

| Element | Animation | Library | Notes |
|---|---|---|---|
| Page enter (lab) | fade + translateY(12px) | Framer Motion | `key={concept.id}` on wrapper |
| Sidebar drawer | translateX(-100%) → 0 | Framer Motion | with backdrop fade |
| Hero content | staggered fade-up | Framer Motion | 80ms stagger between elements |
| Ticker | translateX infinite | CSS | pause on hover |
| Theme toggle | rotate + scale | Framer Motion | 180deg rotation |
| Concept answer reveal | fade + translateY(8px) | Framer Motion | AnimatePresence |
| Progress bar fill | width transition | CSS | `transition: width 500ms ease` |
| Active nav item | background + border | CSS | `transition: all 120ms ease-out` |
| Copy button state | color transition | CSS | `transition: color 150ms` |
| Card hover (light) | `translateY(-1px)` + shadow | CSS | subtle lift |
| Sidebar item hover | background slide | CSS | 120ms ease-out |

---

## 6. Files to Create / Modify

### New files
- `components/icons/ConceptIcon.tsx` — maps concept ID → Lucide icon component
- `components/MobileDrawer.tsx` — slide-in sidebar drawer for mobile

### Modified files
- `app/globals.css` — full token update (colors, typography scale)
- `app/layout.tsx` — remove Space Grotesk font (consolidate to Inter weights)
- `components/Hero.tsx` — Hero C layout: topbar + centered content + ticker
- `components/Sidebar.tsx` — Lucide icons, responsive drawer integration
- `components/ConceptPage.tsx` — Lucide icons throughout, refined cards
- `components/ConceptDiagram.tsx` — styling updates
- `components/ThemeToggle.tsx` — Lucide Sun/Moon, animation
- `components/MobileTopBar.tsx` — hamburger + drawer trigger
- `components/CommandPalette.tsx` — Lucide Search icon, responsive width
- `components/tabs/DiagramTab.tsx` — styling updates
- `lib/data/categories.ts` — update category colors to refined desaturated palette
- `lib/data/concepts*.ts` — no changes to `icon` field; `ConceptIcon` resolves the icon by `concept.id`, so emoji strings in data files are simply ignored at render time
- `package.json` — add `lucide-react`

### Deleted / deprecated
- `components/HeroFlow.tsx` — hero no longer uses React Flow background (replaced with ticker)

---

## 7. Out of Scope

- Content changes (concept text, diagrams, quiz questions)
- New concepts or categories
- Authentication or user accounts
- Backend changes
- Performance optimizations (bundle size, caching headers)
- Dark/light mode auto-detection from OS preference (already implemented via `data-theme`)
