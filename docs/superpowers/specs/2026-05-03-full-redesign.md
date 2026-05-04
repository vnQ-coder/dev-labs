# System Design Lab — Full Product Redesign Spec
**Date:** 2026-05-03  
**Status:** Approved by user

---

## Goal
Transform SDL from a shallow reference tool into the definitive system design learning resource — useful to a student reading for the first time and a senior engineer cramming for a staff-level interview. Every concept page must stand alone as a complete, authoritative explanation.

---

## 1. Technology Decisions

| Concern | Old | New | Rationale |
|---|---|---|---|
| Body font | DM Sans | **Inter** | Industry standard in dev tools (Linear, Vercel, Notion) |
| Display/headings | Syne 800 | **Space Grotesk** | Technical personality, distinctive without being loud |
| Code blocks | Fira Code | **JetBrains Mono** | Better legibility at small sizes, widely respected in dev tools |
| Diagrams | Hand-coded SVG | **@xyflow/react (React Flow v12)** | Professional interactive node graphs — used by n8n, Langflow, Retool |
| Hero animation | Canvas particles | **Animated React Flow graph** | Thematically perfect — a living system diagram as the hero |

---

## 2. New Content Model

### 2a. Extended Concept Type

```typescript
interface ConceptComponent {
  name: string;      // e.g. "Partition"
  icon: string;      // emoji
  role: string;      // one-line role
  detail: string;    // 2-3 sentence explanation
}

interface DecisionCriteria {
  choose: string[];                          // concrete reasons to pick this
  avoid: string[];                           // concrete reasons not to
  vs: Array<{ name: string; when: string }>; // vs alternatives
}

interface FailureMode {
  name: string;      // e.g. "Consumer Lag"
  cause: string;     // what triggers it
  symptom: string;   // what you observe
  fix: string;       // how to resolve
  severity: 'critical' | 'high' | 'medium';
}

interface Concept {
  id: string;
  cat: string;
  color: string;
  icon: string;
  title: string;
  tag: string;              // subtitle / hook line
  overview: string;         // 2-sentence TL;DR — first thing displayed
  components: ConceptComponent[];  // the moving parts
  a: ConceptAnalogy;        // non-technical analogy (unchanged)
  howItWorks: string;       // narrative walkthrough (markdown)
  decision: DecisionCriteria;
  failures: FailureMode[];
  te: ConceptTechnical;     // code example + real-world case
  interview: ConceptInterview;
}
```

### 2b. Concept View Layout (Approach B — scrolling sections)

Replace 4-tab layout with a single top-to-bottom scrollable page. Section anchors in a sticky mini-nav on desktop.

```
┌─────────────────────────────────────────┐
│ Header: icon · title · tag · ←/→ nav   │
│ Mini-nav: Overview · Analogy · How It   │
│   Works · Architecture · Decide ·       │
│   Failures · Code · Case Study · Interview│
├─────────────────────────────────────────┤
│ OVERVIEW — 2-line summary card          │
├─────────────────────────────────────────┤
│ THE ANALOGY — non-technical story       │
│   + key insight callout                 │
├─────────────────────────────────────────┤
│ HOW IT WORKS — narrative + component    │
│   grid (icon, name, role, detail)       │
├─────────────────────────────────────────┤
│ ARCHITECTURE DIAGRAM — React Flow       │
│   Toggle: Conceptual | Technical        │
│   Interactive: zoom, pan, hover labels  │
├─────────────────────────────────────────┤
│ DECISION GUIDE                          │
│   ✅ Choose when…  ❌ Avoid when…       │
│   vs. alternatives table                │
├─────────────────────────────────────────┤
│ FAILURE MODES & FIXES — cards per mode  │
│   severity badge · cause · symptom · fix│
├─────────────────────────────────────────┤
│ CODE EXAMPLE — JetBrains Mono block     │
│   + Real-World Case Study               │
├─────────────────────────────────────────┤
│ INTERVIEW PREP                          │
│   Question → Show Answer (gated) →     │
│   Follow-ups → CTO tip                  │
└─────────────────────────────────────────┘
```

---

## 3. New Category: Messaging

Add `{ id: 'messaging', label: 'Messaging', color: '#f97316' }` to categories.

### New Concepts

#### 3a. Apache Kafka (`id: 'kafka'`)
- **Components**: Producer, Topic, Partition, Offset, Consumer Group, Broker, ZooKeeper/KRaft, Replication
- **Analogy**: A distributed newspaper printing press — articles (events) go into sections (partitions), and each subscriber (consumer group) gets their own bookmark (offset)
- **Failure modes**: Consumer lag, partition skew (hot partition), unclean leader election, exactly-once vs at-least-once
- **Real-world**: LinkedIn (invented it, 7T messages/day), Uber GPS pipeline (250K msg/s), Airbnb event sourcing
- **Decision guide**: Choose when: high-throughput event streaming, multiple independent consumers, event replay needed. Avoid when: simple job queues, small teams, need easy ops

#### 3b. RabbitMQ (`id: 'rabbitmq'`)
- **Components**: Producer, Exchange (Direct/Fanout/Topic/Headers), Binding, Routing Key, Queue, Consumer, Virtual Host, Dead Letter Exchange
- **Analogy**: A sophisticated post office with a sorting machine — the exchange is the sorting machine that reads the label (routing key) and puts mail in the right mailbox (queue)
- **Failure modes**: Queue saturation, split-brain in HA clusters, unacked messages holding memory, DLQ flooding
- **Real-world**: Instagram notifications, Reddit upvote processing, Zalando order events, SoundCloud
- **Decision guide**: Choose when: complex routing logic, multiple protocols (AMQP/STOMP/MQTT), per-message TTL, priority queues. Avoid when: you need event replay, very high throughput (>100K/s)

#### 3c. BullMQ (`id: 'bullmq'`)  
- **Components**: Queue, Job, Worker, Scheduler, Flow (parent-child jobs), QueueEvents, Repeatable Jobs, Dead Letter
- **Analogy**: A restaurant kitchen with a ticket printer — tickets (jobs) get printed, cooks (workers) grab the next ticket, and if a dish fails it goes back on the rail (retry) or gets sent to the manager (DLQ)
- **Failure modes**: Worker crash mid-job (stalled jobs), Redis memory exhaustion, priority inversion, zombie workers
- **Real-world**: Shopify background jobs, Vercel build pipeline, GitHub Actions queue, Figma export service
- **Decision guide**: Choose when: Node.js stack, Redis already in use, need job priorities/delays/retries, small-to-medium throughput (<10K/s). Avoid when: language-agnostic consumers needed, >500K jobs/s, need event sourcing

#### 3d. Queue Patterns (`id: 'queuepatterns'`)
- **Components**: Outbox Pattern, Saga Pattern, Dead Letter Queue, Competing Consumers, Claim Check, Event Sourcing
- **Analogy**: The rulebook that every messaging system follows — patterns that work regardless of which queue you use
- **Failure modes**: Dual-write problem, saga rollback failures, DLQ poisoning, thundering herd on retry storm
- **Real-world**: Stripe (outbox for payment events), Amazon (saga for order fulfilment), Netflix (competing consumers for transcoding)

---

## 4. React Flow Diagram Design

### Node Types
- **SourceNode** — green, left side (producers, clients, publishers)
- **ProcessNode** — blue/amber, center (queues, brokers, exchanges, load balancers)
- **SinkNode** — purple, right side (consumers, databases, services)
- **ErrorNode** — red, shows failure path
- **MetricNode** — grey callout showing a real number (e.g. "250K msg/s")

### Edge Types
- **DataEdge** — animated dashed line, shows data flow direction
- **ErrorEdge** — red dashed, shows failure paths
- **BackpressureEdge** — amber, shows pressure/lag

### Diagram Modes (toggle per concept)
- **Conceptual** — simplified, 4-6 nodes, story labels ("Your Order" not "message payload")
- **Technical** — full architecture, real component names, metric callouts

### Specific Diagrams
1. **Kafka**: Producer → [Broker cluster with 3 partitions each] → Consumer Groups (A reads all, B reads subset) → Offset commits shown
2. **RabbitMQ**: Publisher → Exchange → [Routing to 3 different queues via binding keys] → Consumers + DLQ fallback
3. **BullMQ**: API → Queue (priority levels shown) → Worker pool → Success/Retry/DLQ paths
4. **Queue Patterns**: Outbox pattern flow (DB + outbox table → CDC → queue)
5. All 11 existing concepts get React Flow replacements

---

## 5. Enriched Data for Existing 11 Concepts

Every existing concept gets:
- `overview`: 2-sentence TL;DR
- `components`: 3-6 component cards
- `howItWorks`: narrative walkthrough paragraph
- `decision`: choose/avoid/vs criteria  
- `failures`: 2-4 failure mode cards
- React Flow diagram replacing SVG

Concepts that need the most work: `messagequeue` (now a gateway to the deeper Kafka/RabbitMQ/BullMQ pages), `databases`, `cap`, `circuit`.

---

## 6. Hero Page Redesign

- **Background**: Animated React Flow graph showing a mini distributed system (clients → LB → services → DB/Cache) with live data packets flowing
- **No more plain particle canvas** — the hero IS a system diagram
- **Overlay**: Title + subtitle + CTA sit on top of the flowing diagram
- Diagram is non-interactive on hero (pointer-events: none) but visually alive

---

## 7. UI Polish Checklist

- [ ] Inter (body) + Space Grotesk (display) + JetBrains Mono (code) — loaded via `next/font/google`
- [ ] Consistent 8px grid throughout
- [ ] Card borders: 1px with subtle gradient on hover
- [ ] Section headers: small caps, letter-spaced, color-coded per category
- [ ] Severity badges (critical/high/medium) with proper colors
- [ ] Dark mode: all new components theme-aware from day 1
- [ ] Mobile: concept page sections stack and scroll naturally
- [ ] Sidebar: messaging category added with 🟠 indicator

---

## 8. Quiz Updates

- Add 6 new questions covering Kafka, RabbitMQ, BullMQ, and queue patterns
- Tag all questions with `conceptId` for "Review this concept" deep-links
- Questions cover: partition keys, consumer groups, exchange types, job retries, outbox pattern, exactly-once semantics

---

## File Manifest

### New Files
- `lib/data/concepts-messaging.ts` — Kafka, RabbitMQ, BullMQ, QueuePatterns data
- `components/ConceptPage.tsx` — new scrolling concept view (replaces ConceptView.tsx)
- `components/sections/` — OverviewSection, AnalogySection, ComponentsSection, DiagramSection, DecisionSection, FailuresSection, CodeSection, CaseStudySection, InterviewSection
- `components/diagrams/flow/` — React Flow diagram components per concept
- `components/diagrams/flow/nodes/` — SourceNode, ProcessNode, SinkNode, ErrorNode, MetricNode
- `components/HeroFlow.tsx` — animated React Flow hero background

### Modified Files
- `lib/types.ts` — extended Concept interface
- `lib/data/concepts.ts` — all 11 concepts enriched with new fields
- `lib/data/categories.ts` — add messaging category
- `lib/data/quiz.ts` — 6 new questions
- `app/globals.css` — new fonts, refined CSS vars
- `app/layout.tsx` — Inter + Space Grotesk + JetBrains Mono
- `app/page.tsx` — HeroFlow background
- `app/lab/page.tsx` — swap ConceptView for ConceptPage
- `components/Sidebar.tsx` — messaging category colour
- `components/tabs/DiagramTab.tsx` — deleted (tabs gone)
- `components/ConceptView.tsx` — replaced by ConceptPage.tsx
