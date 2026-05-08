# Design Patterns & Architectural Patterns — Module Design Spec
**Date:** 2026-05-09
**Status:** Approved

---

## 1. Goal

Add two new learning modules to System Design Lab that take a complete beginner from zero to confident in design patterns and architectural patterns — the two topic clusters that distinguish a mid-level engineer from a senior one.

Success: a beginner who works through both modules can explain Observer, CQRS, and SAGA in a system design interview with real-world examples, and recognise these patterns in production codebases.

---

## 2. Scope

### Module 1: Design Patterns
Classic Gang of Four (GoF) patterns — the vocabulary every software engineer must speak. Curated to the 12 patterns that actually appear in real codebases and interviews. Full GoF coverage (all 23 patterns) is deliberately out of scope to preserve beginner focus.

### Module 2: Architectural Patterns
Distributed-system architectural patterns used to build resilient, scalable services. 6 patterns that form a coherent production story: how services communicate, how transactions work across services, and how to migrate away from legacy systems safely.

### What's NOT included
- UML class diagram components (visual diagrams for each pattern — follow-up scope)
- GoF patterns beyond the essential 12
- DDD (Domain-Driven Design), Clean Architecture, Hexagonal Architecture — advanced follow-up scope
- Backend changes to Axiom — existing `get_concept` and `search_concepts` tools cover new patterns automatically

---

## 3. Architecture Changes

### Files created
| File | Contents |
|---|---|
| `lib/data/concepts-design-patterns.ts` | 12 `Concept` objects, `cat: 'patterns'` |
| `lib/data/concepts-arch-patterns.ts` | 6 `Concept` objects, `cat: 'arch-patterns'` |
| `lib/data/realworld-patterns.ts` | 4 `RealWorldSystem` objects |

### Files modified
| File | Change |
|---|---|
| `lib/data/categories.ts` | Add `patterns` and `arch-patterns` categories |
| `lib/data/concepts.ts` | Spread `CONCEPTS_DESIGN_PATTERNS` and `CONCEPTS_ARCH_PATTERNS` |
| `lib/data/realworld.ts` | Spread `REALWORLD_PATTERNS` |

### No type changes
The existing `Concept` and `RealWorldSystem` interfaces cover everything needed.

---

## 4. Module 1 — Design Patterns

### Category
```ts
{ id: 'patterns', label: 'Design Patterns', color: '#a78bfa' }
```
Color: violet-400 — distinct from all 8 existing category colors.

### The 12 Concepts

Each concept follows the full `Concept` interface: `overview`, `components`, `howItWorks`, `decision` (choose/avoid/vs), `failures`, `a` (analogy), `te` (technical), `interview`.

#### Creational (3 patterns — how objects are created)
1. **Singleton** — `id: 'singleton'` — "The one and only president of a country"
   - Real world: database connection pool, app config object, logger
   - Key insight: global state is its main danger — not thread-safe by default
   - Interview: "When would you NOT use Singleton?" (testing, tight coupling, hidden dependencies)

2. **Factory Method** — `id: 'factory-method'` — "A car factory that produces different car models"
   - Real world: `React.createElement`, payment gateway providers (Stripe/PayPal), notification senders
   - Key insight: lets subclasses decide which class to instantiate, decoupling creation from use
   - Interview: "Factory vs Abstract Factory vs Builder — when to choose each?"

3. **Builder** — `id: 'builder'` — "Ordering a custom burger: bun, patty, toppings, sauce"
   - Real world: `URLSearchParams`, query builders (Knex, Hibernate), test fixture factories
   - Key insight: separates the construction of a complex object from its representation
   - Interview: "How is Builder different from a constructor with many parameters?"

#### Structural (4 patterns — how objects are composed)
4. **Adapter** — `id: 'adapter'` — "A travel plug adapter: same electricity, different socket"
   - Real world: legacy API wrappers, third-party library integrations, `Array.from()`
   - Key insight: makes incompatible interfaces work together without modifying either
   - Interview: "Adapter vs Facade — what's the difference?"

5. **Facade** — `id: 'facade'` — "A hotel concierge: one person, many services behind the scenes"
   - Real world: `axios` (hides XMLHttpRequest), AWS SDK, React's `useState` (hides fiber scheduler)
   - Key insight: simplifies a complex subsystem behind a single clean interface
   - Failure mode: Facade can become a God Object if it grows unchecked

6. **Decorator** — `id: 'decorator'` — "Adding toppings to ice cream — each topping wraps the previous"
   - Real world: Express middleware chain, Python `@property`, Java I/O streams (`BufferedReader`)
   - Key insight: adds behaviour at runtime without modifying the original class
   - Interview: "How does Decorator differ from inheritance?"

7. **Proxy** — `id: 'proxy'` — "A celebrity's manager: controls access to the celebrity"
   - Real world: lazy loading images, API rate limiting, caching layer, access control
   - Three types: Virtual (lazy init), Protection (access control), Remote (network calls)
   - Interview: "What's the difference between Proxy and Decorator?"

#### Behavioural (5 patterns — how objects communicate)
8. **Observer** — `id: 'observer'` — "YouTube subscriptions: one channel, millions of subscribers"
   - Real world: DOM `addEventListener`, React state updates, WebSocket broadcasts, stock tickers
   - Key insight: decouples publishers from subscribers — neither knows the other's concrete type
   - Failure mode: memory leaks if subscribers are not unregistered
   - Interview: "Observer vs Event-Driven Architecture — same thing?"

9. **Strategy** — `id: 'strategy'` — "GPS navigation: same trip, choose fastest/shortest/cheapest route"
   - Real world: sort algorithms, payment methods, compression codecs, auth strategies (Passport.js)
   - Key insight: swap algorithms at runtime without changing the client code
   - Interview: "Strategy vs State — what's the difference?"

10. **Command** — `id: 'command'` — "A restaurant order ticket: encapsulates a request as an object"
    - Real world: undo/redo in editors, job queues (Bull, Sidekiq), database migrations, macro recording
    - Key insight: turns a request into a standalone object — enabling queuing, logging, and undo
    - Interview: "How does Command enable undo?"

11. **Iterator** — `id: 'iterator'` — "A TV remote: flips channels one by one without knowing the schedule"
    - Real world: JavaScript `Symbol.iterator`, Java `Iterable`, database cursors, pagination
    - Key insight: traverses a collection without exposing its internal structure
    - Interview: "Why does JavaScript's `for...of` work on arrays, Maps, and custom objects?"

12. **Template Method** — `id: 'template-method'` — "A recipe: fixed steps, but ingredients vary"
    - Real world: React component lifecycle, Express route handlers, JUnit test lifecycle (`setUp`/`tearDown`)
    - Key insight: defines the skeleton of an algorithm, lets subclasses fill in specific steps
    - Interview: "Template Method vs Strategy — both swap behaviour, what's the difference?"

---

## 5. Module 2 — Architectural Patterns

### Category
```ts
{ id: 'arch-patterns', label: 'Architectural Patterns', color: '#f59e0b' }
```
Color: amber-400 — warm and distinct, semantically fits "architecture/construction".

### The 6 Concepts

#### 1. Event-Driven Architecture — `id: 'event-driven-architecture'`
- **Analogy:** "A newspaper — the publisher prints once, thousands of subscribers read independently"
- **Real world:** Uber (trip events → driver matching, billing, notifications fire independently), Slack (message posted → notification service, search indexer, analytics all react)
- **Core components:** Event Producer, Event Broker (Kafka/SQS/RabbitMQ), Event Consumer, Event Schema Registry
- **How it works:** Services publish domain events to a broker. Consumers subscribe to event types and react. No direct service-to-service calls — total decoupling.
- **Failure modes:** Event ordering violations (consumer sees `ORDER_CANCELLED` before `ORDER_CREATED`), duplicate processing (at-least-once delivery), poison pill messages that crash consumers
- **Decision criteria:** Choose when services need to react to the same event independently. Avoid when you need synchronous confirmation (use REST/gRPC instead).
- **Interview:** "How do you handle duplicate events in EDA?" / "What's the difference between EDA and a message queue?"

#### 2. CQRS — `id: 'cqrs'`
- **Analogy:** "A library: the librarian who catalogues books (writes) is different from the reading room where patrons browse (reads)"
- **Real world:** Twitter (tweet creation → write DB; feed reads → pre-materialised timeline cache), e-commerce (order placement → normalised DB; product search → Elasticsearch read model)
- **Core components:** Command side (write model, handles mutations), Query side (read model, optimised for reads), Synchronisation mechanism (event stream or polling)
- **How it works:** Commands mutate state on the write side. Events from the write side update one or many read models optimised for specific queries. Read and write can scale independently.
- **Failure modes:** Read model lag (eventual consistency), stale reads, synchronisation complexity growing into a maintenance burden
- **Decision criteria:** Choose when reads and writes have very different load profiles or shape. Avoid for simple CRUD apps — the complexity is not worth it.
- **Interview:** "Why is CQRS often paired with Event Sourcing?" / "How do you handle eventual consistency in CQRS?"

#### 3. SAGA Pattern — `id: 'saga'`
- **Analogy:** "Booking a holiday: flight + hotel + car booked in steps. If the hotel is full, cancel the flight and car."
- **Real world:** E-commerce order flow (reserve inventory → charge payment → ship → confirm); airline booking systems
- **Two flavors:**
  - **Choreography:** Each service publishes an event; the next service listens and acts. No central coordinator. Simpler but hard to trace.
  - **Orchestration:** A central Saga Orchestrator tells each service what to do. Easier to debug, single point of failure risk.
- **Compensating transactions:** Each step has a rollback action (e.g., "refund payment" compensates "charge payment")
- **Failure modes:** Partial failure with no compensating transaction (money charged, inventory not reserved), orchestrator becoming a bottleneck, cascading compensation failures
- **Decision criteria:** Use when you need distributed transactions across microservices. Avoid when services can share a database (use a local ACID transaction instead).
- **Interview:** "Choreography vs Orchestration SAGA — when to choose each?"

#### 4. Event Sourcing — `id: 'event-sourcing'`
- **Analogy:** "A bank account: you never store the balance directly — you store every deposit and withdrawal. The balance is always computed from the history."
- **Real world:** Bank ledgers, Git (commit history IS the source of truth), accounting systems, audit logs that must be tamper-proof
- **Core components:** Event Store (append-only log), Aggregate (entity whose state is rebuilt from events), Snapshot (performance optimisation: materialise state at a point in time), Projection (read model built from events)
- **How it works:** Instead of UPDATE rows, you APPEND events. Current state is derived by replaying all events for an entity. The event log is the canonical database.
- **Failure modes:** Event store growing too large (mitigate with snapshots), schema evolution (old events must still replay correctly), complex querying (you need projections for anything beyond point-in-time state)
- **Decision criteria:** Choose for audit-heavy domains, financial systems, or anywhere "how did we get here" is a first-class requirement. Avoid for simple CRUD — the overhead is severe.
- **Interview:** "How do you change an event schema in Event Sourcing without breaking replays?"

#### 5. Transactional Outbox Pattern — `id: 'transactional-outbox'`
- **Analogy:** "A post office outbox: before you leave your desk, you write the letter AND drop it in the outbox. The postman picks it up — even if you're hit by a bus after writing it."
- **Real world:** Any service that must reliably publish an event after a database write (order placed → must publish `ORDER_CREATED` to Kafka, even if the app crashes mid-way)
- **Core components:** Outbox table (in the same DB as the business data), Message Relay (reads outbox, publishes to broker, marks sent), idempotent consumer (handles duplicate deliveries)
- **How it works:** Write business data AND the outbox event in a single local DB transaction. A relay process reads the outbox and publishes events to the broker. Atomicity is guaranteed by the DB transaction — not by distributed coordination.
- **Failure modes:** Relay falling behind (outbox grows), duplicate delivery if relay crashes after publish but before marking sent (consumers must be idempotent), relay as a single point of failure
- **Decision criteria:** Use whenever you need atomic "write data + publish event" without a distributed transaction. This is the standard solution — every event-driven system should use it.
- **Interview:** "Why can't you just write to DB and then publish to Kafka in the same code block?"

#### 6. Strangler Fig Pattern — `id: 'strangler-fig'`
- **Analogy:** "A strangler fig tree: grows around an old tree, gradually replacing it from the outside in — until the old tree is gone and the fig stands alone."
- **Real world:** Amazon (migrated from monolith to microservices over years by strangling feature by feature), Netflix, Shopify
- **Core components:** Facade/API Gateway (routes traffic to old or new system), Feature flag or routing rule, the new service, the legacy system
- **How it works:** Rather than a big-bang rewrite, you deploy a new service alongside the monolith. The gateway routes specific routes/features to the new service. Over time, more routes migrate until the monolith handles nothing and can be decommissioned.
- **Failure modes:** Dual-write complexity (both systems must stay consistent during transition), facade becoming a permanent part of the architecture, teams losing motivation to finish the migration ("it's good enough with 80% migrated")
- **Decision criteria:** Use for any significant monolith migration. Never do a big-bang rewrite — the failure rate is close to 100%. Avoid only when the system is small enough to rewrite in a single sprint.
- **Interview:** "What's the biggest risk of the Strangler Fig pattern?"

---

## 6. Real World Systems (4 entries)

### 1. `realworld-patterns.ts` — E-Commerce Order Service
- **Focus:** How a modern order service is built using SAGA + Outbox + EDA
- **Walk through:** user places order → SAGA orchestrator starts → inventory reserved → payment charged → shipment triggered → all via domain events → Outbox guarantees no lost events
- **Design decisions:** Why SAGA over 2PC, why Outbox over direct publish, why EDA over synchronous calls

### 2. `realworld-patterns.ts` — Twitter-Scale Feed (CQRS + Event Sourcing)
- **Focus:** Read/write split at massive scale
- **Walk through:** tweet written to write model → event published → fan-out service updates pre-materialised timelines (read model) → user reads from read model, never from write DB
- **Design decisions:** Why CQRS, why event sourcing for the write side, how to handle eventual consistency

### 3. `realworld-patterns.ts` — Notification Service (Observer + Command + Factory)
- **Focus:** GoF patterns working together in a real service
- **Walk through:** event arrives → Factory creates the right notifier (email/SMS/push) → Command encapsulates the send operation (enabling retry + dead-letter) → Observer pattern used for internal event routing
- **Design decisions:** Why not a giant if/else for notification type, why Command enables reliable retry

### 4. `realworld-patterns.ts` — Legacy Monolith Migration (Strangler Fig)
- **Focus:** Migrating a 10-year-old Rails monolith to microservices
- **Walk through:** Nginx facade routes `/api/payments` to new service while all else hits monolith → dual-write phase → monolith routes removed one by one → monolith decommissioned
- **Design decisions:** Why Strangler Fig over rewrite, how to handle shared database during transition

---

## 7. How Axiom Teaches These

No backend changes required. Axiom's existing tool functions automatically index all new concepts:

- `get_concept('observer')` — returns full Observer concept data
- `search_concepts('how to handle distributed transactions')` — surfaces SAGA and Outbox
- `get_real_world_system('ecommerce-order-service')` — returns the SAGA walkthrough

Axiom's beginner-friendly teaching approach for these modules:
1. **Analogy first** — every concept opens with a non-technical analogy (the `a` field) before any code
2. **Real-world grounding** — Axiom always ties patterns to systems the user has used (Netflix, Uber, Twitter)
3. **Interview mode** — Axiom can quiz on "Observer vs EDA", "CQRS vs SAGA", "Factory vs Builder" — the distinctions beginners most often blur
4. **3AM Debug mode** — Axiom can walk through a SAGA failure scenario or a lost event (Outbox) incident live

---

## 8. Concept Count Summary

| Module | Category ID | Concepts | Color |
|---|---|---|---|
| Design Patterns | `patterns` | 12 | `#a78bfa` (violet) |
| Architectural Patterns | `arch-patterns` | 6 | `#f59e0b` (amber) |
| **Total new concepts** | | **18** | |
| **Total new RealWorldSystems** | | **4** | |
