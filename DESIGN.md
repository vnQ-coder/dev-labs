---
name: System Design Lab
description: Interactive system design learning tool for engineers prepping for technical interviews.
colors:
  deep-space: "#04080f"
  midnight-slate: "#080d18"
  navy-well: "#0d1422"
  dusk-surface: "#141d30"
  ghost-border: "rgba(255,255,255,0.05)"
  surface-border: "rgba(255,255,255,0.10)"
  arctic-signal: "#38bdf8"
  circuit-green: "#34d399"
  amber-alert: "#f59e0b"
  ember: "#f97316"
  plasma-violet: "#a78bfa"
  fault-red: "#f87171"
  titanium-white: "#e2e8f0"
  slate-fog: "#64748b"
  void-shadow: "#1e2d45"
typography:
  display:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(3.5rem, 9vw, 7rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Syne, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 1.15
  title:
    fontFamily: "Syne, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.3
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
  mono:
    fontFamily: "Fira Code, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  pill: "9999px"
  xl: "0.75rem"
  2xl: "1rem"
  lg: "0.5rem"
spacing:
  panel: "1.5rem"
  section: "1.25rem"
  item: "0.625rem"
  chip: "0.625rem 0.875rem"
components:
  button-primary:
    backgroundColor: "{colors.arctic-signal}"
    textColor: "{colors.deep-space}"
    rounded: "{rounded.xl}"
    padding: "1rem 2.5rem"
  button-tab:
    backgroundColor: "transparent"
    textColor: "{colors.slate-fog}"
    rounded: "{rounded.xl}"
    padding: "0.5rem 1rem"
  button-tab-active:
    backgroundColor: "{colors.arctic-signal}"
    textColor: "{colors.arctic-signal}"
    rounded: "{rounded.xl}"
    padding: "0.5rem 1rem"
  chip-category:
    backgroundColor: "{colors.navy-well}"
    textColor: "{colors.slate-fog}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.625rem"
  chip-category-active:
    backgroundColor: "{colors.arctic-signal}"
    textColor: "{colors.deep-space}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.625rem"
  input-search:
    backgroundColor: "{colors.navy-well}"
    textColor: "{colors.titanium-white}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
  card-surface:
    backgroundColor: "{colors.navy-well}"
    textColor: "{colors.titanium-white}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
  nav-sidebar:
    backgroundColor: "{colors.midnight-slate}"
    textColor: "{colors.titanium-white}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 0.75rem"
---

# Design System: System Design Lab

## 1. Overview

**Creative North Star: "The Engineer's War Room"**

System Design Lab is built for a specific person in a specific moment: a software engineer with an interview in 48 hours who needs to understand distributed systems well enough to whiteboard them confidently. The interface reflects that context. It is dark, dense, and direct — the visual equivalent of a dim ops center where every signal on screen matters and nothing decorative earns wall space.

The system works through tonal depth, not shadow. Four surface layers stack from `#04080f` (base) to `#141d30` (elevated card), creating hierarchy without blur or drop-shadow. Color is reserved for meaning: each concept owns a hue that persists across its icon, active state, and section header. The primary accent (`#38bdf8` arctic signal) marks navigation state and primary actions; all other colors are concept-assigned, not decorative.

This is not an edtech platform. There are no progress bars, no encouraging emoji headers, no pastel cards with stock illustrations. The only celebration is understanding. The typography is set in Syne — geometric, heavy, technical — anchored by DM Sans for body text that stays readable under concentration.

**Key Characteristics:**
- Tonal layering over shadow elevation
- Multi-hue accent system, each color concept-assigned and semantically consistent
- Syne display + DM Sans body + Fira Code mono: the technical triple stack
- Minimal chrome, maximum content density
- Dark by default, not by fashion

## 2. Colors: The Signal Palette

The palette is structured around a deep space base with precise categorical accents. Color is never decorative — it is semantic.

### Primary
- **Arctic Signal** (`#38bdf8`): The navigation accent. Active states in the sidebar, primary CTA backgrounds, concept section headers when no concept color is present. Used at ≤15% surface coverage.

### Secondary
- **Circuit Green** (`#34d399`): Assigned to the "Infrastructure" concept category. Success states in quiz feedback.
- **Plasma Violet** (`#a78bfa`): Assigned to "Coordination" concept category. Pairs with Arctic Signal in the hero gradient (primary to violet — this pairing is intentional, not decoration).

### Tertiary
- **Amber Alert** (`#f59e0b`): Real World Systems section accent. Warning-adjacent.
- **Ember** (`#f97316`): Secondary orange accent. Category pairing with amber.
- **Fault Red** (`#f87171`): Quiz surface. Error states. Used deliberately for high-stakes signals only.

### Neutral
- **Deep Space** (`#04080f`): Base background. The floor.
- **Midnight Slate** (`#080d18`): Sidebar and primary surface layer.
- **Navy Well** (`#0d1422`): Cards, inputs, elevated containers.
- **Dusk Surface** (`#141d30`): Progress tracks, highest tonal elevation. Scrollbar tracks.
- **Ghost Border** (`rgba(255,255,255,0.05)`): Section dividers, sidebar borders.
- **Surface Border** (`rgba(255,255,255,0.10)`): Input strokes, card outlines.
- **Titanium White** (`#e2e8f0`): Primary text. Never pure white.
- **Slate Fog** (`#64748b`): Muted labels, metadata, search placeholders.
- **Void Shadow** (`#1e2d45`): Scrollbar thumb at rest.

### Named Rules
**The Categorical Color Rule.** Every system design concept owns a color. That color saturates its icon container, its active nav border, its tab selected state, and its section header. It does not appear anywhere outside that concept's context. Color is identity, not decoration.

**The Restraint Ceiling.** Arctic Signal (`#38bdf8`) appears on ≤15% of any screen. Its rarity is the signal. When it appears on two things at once, one of them is wrong.

## 3. Typography

**Display Font:** Syne (with sans fallback)
**Body Font:** DM Sans (with sans fallback)
**Mono Font:** Fira Code (with monospace fallback)

**Character:** Syne is geometric and confrontational at heavy weights — the right choice for a tool aimed at engineers who need to move fast. DM Sans keeps body text humane and readable under information density. Fira Code handles technical content (diagrams, code snippets) with ligature support at 400–500 weight.

### Hierarchy
- **Display** (900 weight, clamp(3.5rem, 9vw, 7rem), line-height 1): Hero headline only. The title "SYSTEM DESIGN LAB" rendered as three stacked words, each on its own line. Uppercase, zero letterspacing adjustment needed at this weight.
- **Headline** (900 weight, 1.75rem, line-height 1.15): Concept titles, section headers in ConceptView. Set in Syne. Color matches the concept's assigned hue.
- **Title** (800 weight, 1.125rem, line-height 1.3): Tab labels when used as headings, sidebar logo mark. Syne.
- **Body** (400 weight, 1rem, line-height 1.65): All explanatory text. DM Sans. Cap line length at 65–70ch in reading panels.
- **Label** (600 weight, 0.75rem, line-height 1.2, 0.08em letter-spacing, uppercase): Category section headers in sidebar, "Question 1" counters, metadata tags. DM Sans. Always uppercase.
- **Mono** (400 weight, 0.875rem, line-height 1.7): Code references, technical diagram labels, architecture notation. Fira Code.

### Named Rules
**The Syne-Only Rule.** Syne is for structural identifiers: the product name, concept titles, section heads, CTA labels. DM Sans handles everything the user reads. Never use Syne for body text or multi-line paragraphs.

## 4. Elevation

This system is strictly tonal. There are no drop shadows at rest on any component. Depth is conveyed through four surface layers: `deep-space` (base) → `midnight-slate` → `navy-well` → `dusk-surface`. Each step is a small lightness increase, preserving the dark navy hue throughout.

The single exception is the hero CTA: a diffuse glow (`0 0 40px rgba(56,189,248,0.3)`) that signals the primary action on the landing page. It is not repeated elsewhere.

### Shadow Vocabulary
- **Accent Glow** (`box-shadow: 0 0 40px rgba(56,189,248,0.3)`): Hero primary CTA only. Never replicated on interior surfaces.

### Named Rules
**The Flat-By-Default Rule.** Every surface is flat at rest. No card has a shadow. Elevation is expressed only through background-color difference. If you're reaching for `box-shadow`, use a higher surface layer instead.

## 5. Components

### Buttons
- **Shape:** Softly rounded (0.75rem / 12px). Not pill-shaped, not sharp.
- **Primary CTA:** Gradient background from Arctic Signal (`#38bdf8`) to Plasma Violet (`#a78bfa`), white text, 1rem × 2.5rem padding. Used once per screen — the entry action. Framer Motion: scale(1.05) on hover, scale(0.97) on tap.
- **Tab / Ghost:** Transparent background at rest, concept-color background at 12% opacity when active, matching border at 25% opacity when active. Text shifts from Slate Fog to concept color on active. These tabs own 0.5rem × 1rem padding, rounded-xl.
- **No secondary solid button.** The system does not use filled non-primary buttons. Everything below CTA is a tab, chip, or ghost.

### Chips / Category Filters
- **Style:** Pill-shaped (border-radius: 9999px). Unselected: Navy Well background, Surface Border outline, Slate Fog text. Selected: solid category color background, deep-space text (for legibility on saturated bg), matching solid border.
- **Size:** Extra small (0.75rem text, 0.25rem × 0.625rem padding). These are filter controls, not actions.

### Cards / Containers
- **Corner Style:** Gently rounded (1rem / 16px radius) for content cards. Concept icon containers use 1.25rem.
- **Background:** Navy Well (`#0d1422`) for all cards and containers.
- **Shadow Strategy:** None. Flat-By-Default Rule applies.
- **Border:** Surface Border (`rgba(255,255,255,0.10)`) for all card outlines. Concept-color border at 25% opacity on selected/active states.
- **Internal Padding:** 1.5rem uniform (panel spacing).

### Inputs / Fields
- **Style:** Navy Well background, Surface Border outline (1px solid `rgba(255,255,255,0.10)`), 0.5rem radius. No label visible — placeholder only in search fields.
- **Focus:** Outline removed (outline: none). Relies on the browser default ring or future focus-visible treatment. This is a gap — see Do's and Don'ts.
- **Text:** Titanium White on input, Slate Fog for placeholder.

### Navigation (Sidebar)
- **Style:** Midnight Slate background (`#080d18`), 18rem (w-72) fixed width, 1px Ghost Border right-edge divider.
- **List items:** Transparent at rest, concept-color at 12% opacity when active + concept-color border at 25% opacity. Text shifts to concept color on active, Titanium White at rest.
- **Category labels:** Uppercase, 0.75rem, 600 weight, concept category color. These are section dividers, not links.
- **Footer nav items:** Same structure as concept items. Real World Systems = Amber Alert. Quiz = Fault Red.

### Concept Icon Container (Signature Component)
A 56×56px rounded square (border-radius: 1.25rem) displaying the concept emoji at 2rem. Background is the concept color at 8% opacity (`concept.color + "15"` in hex notation). Border is the concept color at 19% opacity. This is the system's primary brand expression per concept — the color arrives here first, before any other surface.

### Progress Bar (Quiz)
- **Track:** Dusk Surface (`#141d30`), 0.375rem height, pill-shaped.
- **Fill:** Fault Red (`#f87171`), full-width transition over 500ms. No animated gradient — solid color, smooth width.

## 6. Do's and Don'ts

### Do:
- **Do** use the concept's assigned color for all active and selected states within that concept's context — icon container, nav item, tab button, section header.
- **Do** use tonal layering (surface steps) to express depth. Deep Space → Midnight Slate → Navy Well → Dusk Surface.
- **Do** set Syne at 800–900 weight for all display and headline use. Lighter weights of Syne are unused in this system.
- **Do** cap reading-panel line length at 65–70ch. DM Sans at 1rem over 80ch degrades readability under cognitive load.
- **Do** use `prefers-reduced-motion` to disable Framer Motion transitions. The background canvas animation must also pause.
- **Do** use the Fira Code mono stack for any architectural terminology, command names, or technical labels within diagram panels.
- **Do** keep Arctic Signal (`#38bdf8`) to navigation state and the primary CTA. Its rarity is functional.

### Don't:
- **Don't** use gradient text (`background-clip: text` + gradient fill). The hero currently does this — it is a known violation of the system's own rules. New surfaces must use solid concept colors or Arctic Signal for headlines. The hero is a legacy exception, not a pattern to follow.
- **Don't** use `border-left` or `border-right` greater than 1px as a decorative accent stripe on any component. Rewrite with background tint or full border.
- **Don't** add drop shadows to cards, sidebar panels, or modals. The Flat-By-Default Rule is absolute inside the `/lab` surface. The accent glow exists only on the hero CTA.
- **Don't** add progress bars as motivational scaffolding (Coursera/Udemy style). The quiz progress bar is functional — it tells the user their position, not how well they're doing. No congratulatory states.
- **Don't** use pastel backgrounds, rounded-3xl card stacks with illustration headers, or icon-plus-heading-plus-text card grids. This is the edtech anti-reference — it signals the wrong register entirely.
- **Don't** reach for glassmorphism. No `backdrop-filter: blur(...)` on cards or sidebars unless there is an explicit, one-off compositional reason that cannot be achieved any other way.
- **Don't** add secondary filled buttons. Every non-primary action is a ghost tab or a chip. Adding a teal "Learn More" button is the SaaS landing page reflex — resist it.
- **Don't** introduce a new accent color that isn't concept-assigned. The multi-hue system exists for semantic reasons. A new purple that isn't tied to a concept pollutes the signal.
- **Don't** use Syne for body copy or multi-line paragraphs. It is a display face only.
