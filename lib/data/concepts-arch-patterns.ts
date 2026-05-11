import { Concept } from '../types';

export const CONCEPTS_ARCH_PATTERNS: Concept[] = [
  {
    id: 'event-driven-architecture',
    cat: 'arch-patterns',
    color: '#f59e0b',
    icon: '📰',
    title: 'Event-Driven Architecture',
    tag: 'A newspaper: published once, thousands of subscribers read independently',
    overview:
      'Event-Driven Architecture (EDA) decouples services by replacing direct API calls with asynchronous events. A producer emits an event — "OrderPlaced", "UserSignedUp" — to a broker. Every interested consumer reacts independently, in its own time, without the producer knowing who is listening. This eliminates tight coupling and makes services independently deployable, scalable, and resilient.',
    components: [
      {
        name: 'Event Producer',
        icon: '📤',
        role: 'Emits domain events to the broker.',
        detail:
          'Any service that performs a meaningful state change publishes an event describing what happened — not what others should do. "OrderPlaced" is a good event; "TellInventoryToReserve" is a command masquerading as an event. Producers are completely unaware of who consumes their events.',
      },
      {
        name: 'Event Broker',
        icon: '📡',
        role: 'Durably stores and routes events to subscribers.',
        detail:
          'Kafka, AWS SQS/SNS, RabbitMQ, and Google Pub/Sub are common brokers. The broker decouples producers and consumers in time — the producer can be offline while the consumer catches up. Kafka retains events on disk for days, enabling replay; SQS provides at-least-once delivery with a dead-letter queue for failures.',
      },
      {
        name: 'Event Consumer',
        icon: '📥',
        role: 'Subscribes to event types and reacts to them.',
        detail:
          'Consumers subscribe to topics or queues. They process events at their own pace, scale independently, and are isolated from each other. Multiple consumers can read the same event — the notification service, billing service, and analytics service all react to "OrderPlaced" without any producer coordination.',
      },
      {
        name: 'Event Schema Registry',
        icon: '📋',
        role: 'Enforces and versions the event contract.',
        detail:
          'As events evolve, consumers break if the schema changes unexpectedly. A schema registry (Confluent Schema Registry with Avro/Protobuf) enforces backward and forward compatibility. Producers register their schema; consumers validate against it. This is the governance layer that makes EDA maintainable at scale.',
      },
    ],
    howItWorks:
      'Services publish domain events to a broker when something meaningful happens. Consumers subscribe to event types they care about and react — completely independently. No direct service-to-service calls occur. The broker provides durability, ordering guarantees (per partition in Kafka), and delivery semantics. Consumer groups in Kafka allow horizontal scaling: multiple instances of the same service share work across partitions. If a consumer is down, events accumulate in the broker and are processed when it recovers — this is the core resilience property of EDA.',
    decision: {
      choose: [
        'Multiple services need to react to the same domain event independently',
        'You want to decouple services so each can be deployed without coordinating with others',
        'Workloads are naturally asynchronous — notifications, analytics, search indexing',
        'You need replay capability — ability to reprocess historical events for a new consumer',
      ],
      avoid: [
        'When the caller needs a synchronous response — payment confirmation, authentication — use REST or gRPC',
        'Simple point-to-point communication with a single consumer — a message queue is sufficient',
        'When your team lacks operational maturity for a broker — EDA adds significant infra complexity',
      ],
      vs: [
        { name: 'REST / gRPC', when: 'Use when the caller needs a synchronous response — order confirmation, payment result, any request-reply pattern.' },
        { name: 'SAGA Pattern', when: 'Use SAGA when you need coordinated multi-step distributed transactions, not just fire-and-forget reactions to a single event.' },
      ],
    },
    failures: [
      {
        name: 'Event Ordering Violation',
        cause: 'Consumers process events from different partitions or with different lag, receiving ORDER_CANCELLED before ORDER_CREATED.',
        symptom: 'Consumer tries to cancel an order it has never seen, resulting in a no-op or corrupt state.',
        fix: 'Use a single Kafka partition per entity key (e.g., orderId) to guarantee per-entity ordering. Consumers must also handle idempotent out-of-order application.',
        severity: 'high',
      },
      {
        name: 'Duplicate Event Processing',
        cause: 'Brokers guarantee at-least-once delivery. Consumer crashes after processing but before committing its offset.',
        symptom: 'The same event is processed twice — customer charged twice, inventory decremented twice.',
        fix: 'Implement idempotency keys: store processed eventIds in a seen-set (Redis SET or DB unique constraint). Check before processing, record after.',
        severity: 'critical',
      },
      {
        name: 'Poison Pill Message',
        cause: 'A malformed or unexpected event payload causes a consumer to throw an exception on every retry.',
        symptom: 'Consumer is stuck, lag grows indefinitely, all subsequent events are blocked.',
        fix: 'Configure a dead-letter queue (DLQ) with a max retry count. Route poison pills to DLQ for manual inspection. Alert on DLQ depth.',
        severity: 'high',
      },
    ],
    a: {
      v: '📰 → 📬 → 👥',
      t: 'The Newspaper Analogy',
      tx: 'Imagine a newspaper publisher. They print one edition and drop it off at the distribution hub — they have no idea who subscribes, or what each reader does with the news. One reader clips the sports scores, another reads the stock prices, a third cuts out coupons. They all act independently, in their own time, without the publisher needing to know any of them exist. That is Event-Driven Architecture. Your Order Service is the publisher — it emits "OrderPlaced" to the broker. Your Notification Service, Inventory Service, and Analytics Service are the readers — each reacts however it needs to, completely independently. If a reader is on vacation, the newspaper stacks up at their door and they catch up when they return.',
      s: 'Producer emits events → Broker stores and routes → Multiple consumers react independently.',
    },
    te: {
      def: 'An architectural pattern where services communicate by producing and consuming asynchronous events via a message broker, eliminating direct service-to-service coupling.',
      types: [
        { n: 'Pub/Sub', d: 'One producer, many consumers. Each consumer gets a copy of every event (fanout). Used for notifications, analytics, cache invalidation.' },
        { n: 'Event Streaming', d: 'Events are stored as a durable, ordered, replayable log (Kafka). Consumers can replay from any offset. Used for audit trails, ML pipelines, Event Sourcing.' },
        { n: 'Message Queue', d: 'One producer, one consumer group. Each message is processed by exactly one consumer (competing consumers). Used for task distribution, background jobs.' },
      ],
      when: 'Use EDA when multiple downstream services must react to the same business event, when you need temporal decoupling (producer and consumer can be offline independently), or when replay capability is required.',
      trade: 'Pros: loose coupling, independent scaling, resilience to downstream failures, replay capability. Cons: eventual consistency, harder to debug (no single call stack), duplicate event handling complexity, broker is a new operational dependency.',
      code: `// Event Producer — Order Service
async function placeOrder(orderData: OrderData) {
  const order = await db.orders.create(orderData);

  await kafka.produce('orders', {
    eventId: crypto.randomUUID(),
    eventType: 'OrderPlaced',
    aggregateId: order.id,
    payload: { orderId: order.id, userId: order.userId, total: order.total },
    timestamp: new Date().toISOString(),
  });

  return order;
}

// Idempotent Event Consumer — Notification Service
async function handleOrderEvent(event: OrderEvent) {
  const alreadyProcessed = await redis.sismember('processed-events', event.eventId);
  if (alreadyProcessed) return; // deduplicate

  await sendOrderConfirmationEmail(event.payload);
  await redis.sadd('processed-events', event.eventId);
  await redis.expire('processed-events', 7 * 24 * 60 * 60); // 7-day TTL
}`,
      rw: {
        ex: [
          'Uber: trip events (TripStarted, TripEnded) fan out to driver matching, billing, and notification services independently',
          'Slack: MessagePosted event triggers notification delivery, search indexing, and analytics in parallel',
          'LinkedIn: MemberProfileUpdated event propagates to recommendation engine, feed, and search index asynchronously',
        ],
        cs: 'LinkedIn migrated from a synchronous call graph to Kafka-based EDA for feed updates. Write throughput scaled 10× and feed latency dropped because consumers processed updates asynchronously rather than blocking the write path.',
      },
    },
    interview: {
      q: 'How do you handle duplicate events in Event-Driven Architecture?',
      a: "Idempotency keys. Every event carries a unique eventId (UUID). Consumers maintain a seen-set — a Redis SET or a database table with a unique constraint on eventId. Before processing, check: 'Have I seen this eventId?' If yes, skip and acknowledge. If no, process and record the eventId. The seen-set needs a TTL (7 days covers most retry windows) to prevent unbounded growth. At the consumer level, operations should also be naturally idempotent where possible — 'SET balance = X' is safer than 'INCREMENT balance by X'. The combination of event-level deduplication and operation-level idempotency handles at-least-once delivery reliably.",
      fu: [
        "What's the difference between Event-Driven Architecture and a simple message queue?",
        'How do you handle event ordering guarantees in Kafka?',
        'What is a dead-letter queue and when would you use one?',
      ],
    },
  },

  {
    id: 'cqrs',
    cat: 'arch-patterns',
    color: '#f59e0b',
    icon: '📚',
    title: 'CQRS',
    tag: 'A library: the cataloguing room (writes) is separate from the reading room (reads)',
    overview:
      'Command Query Responsibility Segregation (CQRS) splits a system into two distinct models: a command side that handles writes and state mutations, and a query side optimised for reads. This separation allows each side to scale, evolve, and be optimised independently — reads can use denormalised projections, caches, or full-text search engines while the write side maintains a normalised, consistent model.',
    components: [
      {
        name: 'Command Side (Write Model)',
        icon: '✍️',
        role: 'Handles all state-mutating operations.',
        detail:
          'Commands are intentions: PlaceOrder, UpdateUserProfile, CancelSubscription. The write model validates business rules, enforces invariants, and persists state changes. It is normalised for consistency, not for read performance. Commands return only success or failure — never data.',
      },
      {
        name: 'Query Side (Read Model)',
        icon: '🔍',
        role: 'Serves all read requests from optimised projections.',
        detail:
          'Read models are purpose-built for specific queries. A product listing page might query a denormalised Elasticsearch document. A user dashboard might read from a pre-aggregated Redis hash. Read models can be many — one per use case — and rebuilt from scratch if requirements change, because they are derived data.',
      },
      {
        name: 'Synchronisation Mechanism',
        icon: '🔄',
        role: 'Propagates write-side state changes to read models.',
        detail:
          'After a command succeeds, write-side events (or change data capture) update one or many read model projections. This can be synchronous (in-process projection update) or asynchronous (event stream). Asynchronous sync introduces eventual consistency — the read model may lag by milliseconds to seconds.',
      },
      {
        name: 'Command / Query Bus',
        icon: '🚌',
        role: 'Routes commands and queries to the correct handler.',
        detail:
          'A dispatcher maps each command type to a single handler and each query type to a single handler. This keeps application logic decoupled from transport (HTTP, gRPC, CLI) and makes adding new commands or queries a matter of registering a new handler — no modification of existing code.',
      },
    ],
    howItWorks:
      'An incoming write request arrives as a Command object. The command bus dispatches it to the appropriate command handler, which validates business rules and persists changes to the write store. On success, the handler emits domain events. A projection updater consumes those events and updates one or more read model stores — Elasticsearch for search, Redis for dashboards, PostgreSQL for reporting. Read requests bypass the write store entirely and go directly to the optimised read model. The two sides can now scale, evolve, and be optimised completely independently.',
    decision: {
      choose: [
        'Read and write workloads have very different shapes — e.g., complex writes but high-volume simple reads',
        'You need multiple specialised read models for the same data (search, reporting, real-time dashboard)',
        'The domain is complex enough that separating mutation logic from query logic reduces cognitive load',
        'You are already using Event Sourcing — CQRS and Event Sourcing compose naturally',
      ],
      avoid: [
        'Simple CRUD applications — the complexity of two models, sync mechanisms, and eventual consistency is not justified',
        'Small teams without operational capacity to maintain two separate data stores',
        'When strong consistency on reads is a hard requirement — CQRS read models are eventually consistent',
      ],
      vs: [
        { name: 'Traditional CRUD', when: 'Same model for reads and writes. Use for simple domains where the read and write shapes are nearly identical.' },
        { name: 'Event Sourcing', when: 'Pairs naturally with CQRS. Event Sourcing provides the write model as an append-only event log; CQRS provides the read-side projections.' },
      ],
    },
    failures: [
      {
        name: 'Read Model Lag',
        cause: 'Asynchronous projection update pipeline is slow or backed up, causing stale reads.',
        symptom: 'User places an order and immediately refreshes — the order is not visible in their order list.',
        fix: 'Show optimistic UI updates immediately after command success. For critical flows, offer a synchronous "read-your-own-writes" query that hits the write store directly.',
        severity: 'medium',
      },
      {
        name: 'Synchronisation Complexity Creep',
        cause: 'As the number of read models grows, the projection update logic becomes a tangled dependency graph.',
        symptom: 'A schema change on the write side breaks 6 different projections, each owned by a different team.',
        fix: 'Treat each read model projection as an independent consumer of a well-defined event schema. Use a schema registry. Version events, not projections.',
        severity: 'high',
      },
      {
        name: 'Stale Cache on Read Model',
        cause: 'Read model store (Redis, Elasticsearch) is not invalidated when the write model changes.',
        symptom: 'Users see outdated product prices or inventory counts despite successful write operations.',
        fix: 'Use event-driven invalidation — subscribe to domain events and update/invalidate read model entries atomically. Avoid TTL-only cache strategies for mutable data.',
        severity: 'high',
      },
    ],
    a: {
      v: '✍️ ↔ 📚',
      t: 'The Library Analogy',
      tx: 'In a large library, the cataloguing room and the reading room serve very different purposes. The cataloguing room receives new books, assigns them a classification code, and files them precisely — the workflow is about correctness and consistency. The reading room arranges the same books in completely different ways: by genre for casual browsers, by author for researchers, by publication date for academics. Nobody expects the cataloguing workflow to be fast to browse, or the reading room to be where you return books. CQRS applies the same insight to software: your write model is the cataloguing room — normalised, consistent, validates every rule. Your read model is the reading room — denormalised, fast, shaped exactly for each consumer. They share the same underlying data but serve completely different needs.',
      s: 'Write model handles mutations and enforces rules → Events propagate changes → Read models serve optimised queries.',
    },
    te: {
      def: 'An architectural pattern that separates the model used to update information (commands) from the model used to read information (queries), allowing each to be optimised independently.',
      types: [
        { n: 'Simple CQRS', d: 'Same database, separate read and write models in code. Minimal infrastructure change, most of the cognitive benefit.' },
        { n: 'CQRS with Separate Stores', d: 'Write store (PostgreSQL) and read store (Elasticsearch, Redis) are different databases, synced via events or CDC.' },
        { n: 'CQRS + Event Sourcing', d: 'Write side is an append-only event log. Read models are projections built by replaying events. Full audit trail, arbitrary read model rebuild.' },
      ],
      when: 'Use when reads and writes have very different load profiles, when you need multiple purpose-built read models, or when the domain complexity warrants separation of mutation logic from query logic.',
      trade: 'Pros: independent scaling of reads and writes, purpose-optimised read models, cleaner domain model on write side. Cons: eventual consistency, operational overhead of maintaining sync, higher initial complexity.',
      code: `// Command — write side
interface PlaceOrderCommand {
  type: 'PlaceOrder';
  userId: string;
  items: { productId: string; qty: number }[];
}

async function handlePlaceOrder(cmd: PlaceOrderCommand) {
  const order = Order.create(cmd.userId, cmd.items); // domain logic
  await writeStore.save(order);
  await eventBus.publish(new OrderPlacedEvent(order.id, order.userId, order.total));
}

// Projection updater — read side
async function onOrderPlaced(event: OrderPlacedEvent) {
  await readStore.upsert('user_orders', {
    id: event.orderId,
    userId: event.userId,
    total: event.total,
    status: 'pending',
    createdAt: event.timestamp,
  });
}

// Query — hits read model directly, never touches write store
async function getUserOrders(userId: string) {
  return readStore.query('user_orders', { userId });
}`,
      rw: {
        ex: [
          'Twitter: tweet creation writes to a normalised store; feed reads from pre-materialised timeline caches (read models) per user',
          'E-commerce: order placement writes to a transactional DB; product search queries Elasticsearch read model',
          'Banking: transaction writes to ledger; account dashboard reads from a pre-aggregated balance projection',
        ],
        cs: 'Axon Framework (used by many Dutch banks) implements CQRS + Event Sourcing. The write side processes ~10K commands/sec on modest hardware because command handlers are CPU-light. Read models are rebuilt by replaying the event log — schema migrations are replaced by projection rebuilds.',
      },
    },
    interview: {
      q: 'Why is CQRS often paired with Event Sourcing?',
      a: 'CQRS separates read and write models. Event Sourcing stores the write side as an append-only event log instead of mutable rows. The combination is powerful: the event log IS the write model, and you derive any read model by replaying events through a projection function. This means you can add new read models — say, a new analytics dashboard — by replaying all historical events through a new projection, with zero schema migration. You also get a complete audit trail for free. Without Event Sourcing, CQRS still works, but the write side is a traditional mutable store and you cannot rebuild read models from scratch. With Event Sourcing, read models become disposable derived data — throw away and rebuild anytime.',
      fu: [
        'How do you handle eventual consistency in CQRS when a user needs to read their own recent write?',
        'Can you use CQRS without Event Sourcing, and what do you lose?',
        'How do you handle a query that absolutely needs very fresh data in a CQRS system?',
      ],
    },
  },

  {
    id: 'saga',
    cat: 'arch-patterns',
    color: '#f59e0b',
    icon: '✈️',
    title: 'SAGA Pattern',
    tag: "Booking a holiday: flight + hotel + car — if the hotel is full, cancel everything",
    overview:
      'The SAGA pattern manages long-running, multi-step distributed transactions across microservices that cannot share a database. Instead of a single ACID transaction, a SAGA is a sequence of local transactions, each publishing an event or message that triggers the next step. If any step fails, SAGA executes compensating transactions to undo the completed steps — restoring eventual consistency without distributed locking.',
    components: [
      {
        name: 'Saga Coordinator / Orchestrator',
        icon: '🎯',
        role: 'Directs the sequence of steps and handles failures (Orchestration style).',
        detail:
          'A central process (implemented with AWS Step Functions, Temporal, or a custom state machine) tells each service what to do and when. It receives success/failure callbacks and decides whether to proceed or trigger compensation. The orchestrator provides a single place to observe the full transaction state.',
      },
      {
        name: 'Local Transaction',
        icon: '🔒',
        role: 'An ACID transaction within a single service boundary.',
        detail:
          'Each step in the SAGA is a local database transaction within one service — fully ACID. The SAGA chains these local transactions together across service boundaries. The key insight: you trade distributed ACID for a sequence of ACID steps with compensations.',
      },
      {
        name: 'Compensating Transaction',
        icon: '↩️',
        role: 'The rollback action for a completed step.',
        detail:
          'Every step that mutates state must have a compensating transaction that semantically undoes it. "Charge payment" is compensated by "Refund payment". "Reserve inventory" is compensated by "Release inventory". Compensations must be idempotent and are retried until they succeed — they cannot themselves fail permanently.',
      },
      {
        name: 'Event / Message Channel',
        icon: '📨',
        role: 'Carries step results and triggers between services (Choreography style).',
        detail:
          'In choreography, services communicate via a broker. InventoryReserved triggers PaymentService to charge; PaymentCharged triggers ShippingService. There is no central coordinator — each service knows which events to react to and what to publish. The "workflow" is implicit in the event chain.',
      },
    ],
    howItWorks:
      'Orchestration: the SAGA orchestrator sends a "ReserveInventory" command to Inventory Service. On success, it sends "ChargePayment" to Payment Service. On success, it sends "CreateShipment" to Shipping Service. If Payment fails, the orchestrator sends "ReleaseInventory" to Inventory Service to compensate. Every step is tracked in the orchestrator state machine. Choreography: Inventory Service listens for "OrderPlaced", reserves stock, and publishes "InventoryReserved". Payment Service listens for "InventoryReserved", charges the card, and publishes "PaymentCharged". If payment fails, Payment Service publishes "PaymentFailed"; Inventory Service listens and releases the reservation.',
    decision: {
      choose: [
        'You need distributed transactions across microservices that cannot share a database',
        'A business process spans multiple services and requires compensating rollback on failure',
        'Long-running workflows where steps may take seconds to minutes (async is fine)',
      ],
      avoid: [
        'Services can share a database — use a local ACID transaction instead, far simpler',
        'The workflow is synchronous and needs immediate consistency — consider distributed locking or 2PC',
        'Simple two-service coordination — a direct call with compensation in the caller is sufficient',
      ],
      vs: [
        { name: '2PC (Two-Phase Commit)', when: 'Provides true distributed ACID but requires all participants to be available simultaneously and blocks resources during the prepare phase. Not viable for microservices at scale.' },
        { name: 'Event-Driven Architecture', when: 'EDA handles independent reactions to events; SAGA handles coordinated sequences with rollback semantics. You often implement SAGAs using EDA as the transport.' },
      ],
    },
    failures: [
      {
        name: 'Partial Failure Without Compensation',
        cause: 'A step fails but the compensating transaction is missing or not triggered correctly.',
        symptom: 'Customer is charged but inventory is never reserved; order is in a permanently inconsistent state.',
        fix: 'Every state-mutating step must have a compensating transaction defined before going to production. Use a SAGA framework (Temporal, Axon) that enforces this contract.',
        severity: 'critical',
      },
      {
        name: 'Orchestrator Single Point of Failure',
        cause: 'The orchestrator process crashes mid-transaction, leaving the SAGA in an unknown state.',
        symptom: 'Transactions neither complete nor roll back; services hold locks or reserved resources indefinitely.',
        fix: 'Persist orchestrator state to a durable store after every step. Use a framework with built-in durability (Temporal, AWS Step Functions) rather than in-memory state machines.',
        severity: 'critical',
      },
      {
        name: 'Cascading Compensation Failure',
        cause: "Compensating transactions themselves fail due to downstream service unavailability.",
        symptom: 'System is stuck in a partially compensated state; manual intervention required.',
        fix: 'Compensating transactions must be idempotent and retried with exponential backoff until they succeed. Design them to never have a "permanent failure" path — only transient failures that eventually resolve.',
        severity: 'high',
      },
    ],
    a: {
      v: '✈️ + 🏨 + 🚗 → ↩️',
      t: 'The Holiday Booking Analogy',
      tx: 'Imagine booking a holiday package: you book a flight, then a hotel, then a rental car. Each booking is confirmed independently with a different company. If the hotel is fully booked after you have already confirmed the flight, you cannot just "rollback" — you have to call the airline and cancel. That cancellation is the compensating transaction. The SAGA pattern applies this idea to distributed systems. Each step (book flight, book hotel, book car) is a local transaction. If any step fails, you execute the compensations in reverse order — cancel car, cancel hotel, cancel flight. There is no global lock holding all three systems in suspense while you decide; each booking is real and committed, and compensation is the only way to undo it.',
      s: 'Chain of local ACID transactions → Failure triggers compensating transactions in reverse → Eventual consistency restored.',
    },
    te: {
      def: 'A pattern for managing distributed transactions across multiple microservices using a sequence of local transactions, each with a compensating transaction that undoes its effects on failure.',
      types: [
        { n: 'Choreography SAGA', d: 'Services react to events from a broker. No central coordinator. Simple for 3-4 steps, difficult to debug and visualise for complex flows.' },
        { n: 'Orchestration SAGA', d: 'A central orchestrator (state machine) drives the transaction, invoking each service. Clear audit trail, single source of truth, single point of failure.' },
      ],
      when: 'Use when a business transaction spans multiple microservices that cannot share a database. Classic use case: e-commerce checkout (inventory + payment + shipping), travel booking, financial transfers across accounts in different services.',
      trade: 'Pros: no distributed locks, services remain loosely coupled, handles long-running transactions gracefully. Cons: eventual consistency only, compensating transaction complexity, difficult to debug in choreography style, orchestrator is a new operational component.',
      code: `// Orchestration SAGA — Order Service state machine
async function runOrderSaga(orderId: string) {
  const saga = new SagaState(orderId);

  try {
    await inventoryService.reserve({ orderId, items: saga.items });
    saga.record('inventory_reserved');

    await paymentService.charge({ orderId, amount: saga.total });
    saga.record('payment_charged');

    await shippingService.createShipment({ orderId });
    saga.record('shipment_created');

    saga.complete();
  } catch (err) {
    // Compensate in reverse order
    if (saga.has('payment_charged'))
      await paymentService.refund({ orderId });
    if (saga.has('inventory_reserved'))
      await inventoryService.release({ orderId });
    saga.fail(err);
    throw err;
  }
}`,
      rw: {
        ex: [
          'E-commerce (Amazon, Shopify): order checkout saga coordinates inventory reservation, payment authorisation, and fulfilment across independent services',
          'Airline booking: seat reservation, payment, and loyalty points accrual run as a SAGA — payment failure triggers seat release',
          'Financial transfers: debit source account, credit destination account — if credit fails, debit is compensated',
        ],
        cs: 'Uber used SAGA-style orchestration to coordinate ride creation across their trip, driver, and payment services. The Orchestration approach was chosen over Choreography specifically because the flow had 6+ steps and they needed a clear audit trail for debugging and compliance.',
      },
    },
    interview: {
      q: 'Choreography vs Orchestration SAGA — when do you choose each?',
      a: 'Choreography: services emit and react to events via a broker, no central coordinator. Best for simple flows (3-4 steps), loosely coupled teams, and when you want maximum service autonomy. The downside is that the workflow is implicit — you cannot read it from one place. Debugging requires reconstructing a distributed trace from log correlation IDs. Orchestration: a central process (Temporal, AWS Step Functions) drives the transaction, invoking each service in sequence and handling failures. Best for complex flows (5+ steps), regulatory environments requiring audit trails, and when central visibility is important. The trade-off is that the orchestrator is a new operational dependency and a potential single point of failure — mitigate by using a durable workflow engine that persists state. My default: start with Choreography for simple cases, switch to Orchestration once you hit 4+ steps or need a clear audit trail.',
      fu: [
        'How does SAGA differ from Two-Phase Commit (2PC)?',
        'What happens if the compensating transaction itself fails permanently?',
        'How do you test a SAGA end-to-end?',
      ],
    },
  },

  {
    id: 'event-sourcing',
    cat: 'arch-patterns',
    color: '#f59e0b',
    icon: '🏦',
    title: 'Event Sourcing',
    tag: 'A bank account: you never store the balance — you store every deposit and withdrawal',
    overview:
      'Event Sourcing replaces mutable state with an append-only log of domain events. Instead of storing the current state of an entity ("balance: $450"), you store every event that caused that state ("Deposited $500, Withdrew $50"). Current state is derived by replaying events. The event log is the canonical, immutable source of truth — you can rebuild any view of the system at any point in time.',
    components: [
      {
        name: 'Event Store',
        icon: '📜',
        role: 'Append-only log of all domain events, ordered by time.',
        detail:
          'The event store (EventStoreDB, Kafka with log compaction disabled, or a PostgreSQL events table) accepts only appends — never updates or deletes. Every event has a stream ID (the aggregate ID), a sequence number, and a timestamp. The event store is the authoritative database; all other stores are derived projections.',
      },
      {
        name: 'Aggregate',
        icon: '🧩',
        role: 'Domain entity whose state is rebuilt by replaying its event stream.',
        detail:
          'An Aggregate (e.g., BankAccount, Order) has no stored "current state" in the traditional sense. To get its state, you load all events for its ID from the event store and fold them left — each event is applied to produce the next state. The aggregate also validates commands and emits new events.',
      },
      {
        name: 'Snapshot',
        icon: '📸',
        role: 'Materialised state at a point in time to accelerate replay.',
        detail:
          'Replaying 50,000 events to load one aggregate is too slow. A snapshot captures the aggregate state at event #N and persists it. On load, start from the latest snapshot and replay only events after it. Snapshots are an optimisation — the event log remains the source of truth. Take snapshots every N events or on a schedule.',
      },
      {
        name: 'Projection',
        icon: '📊',
        role: 'A read model built by consuming the event stream.',
        detail:
          'Projections subscribe to the event store and build purpose-specific read models — a running balance table, a full-text search index, an analytics dashboard. They are disposable: if you need a new view of the data, create a new projection and replay all historical events through it. No schema migration needed.',
      },
    ],
    howItWorks:
      "A command arrives (e.g., WithdrawMoney). The aggregate is loaded by replaying its event stream from the event store. The command is validated against current state. If valid, a new event (MoneyWithdrawn) is appended to the stream. The aggregate's in-memory state is updated by applying the new event. Projections asynchronously consume the new event and update their read models. To query current balance, you either read from a projection or reload the aggregate by replaying. The event log never shrinks — it is the permanent, immutable record of everything that ever happened.",
    decision: {
      choose: [
        'Audit requirements are first-class — financial systems, healthcare, compliance-heavy domains',
        'You need "how did we get here" debugging — replay to any point in time',
        'The domain is complex and temporal — understanding state transitions matters',
        'You want to add new read models without migrating existing data',
      ],
      avoid: [
        'Simple CRUD applications — storing events for "update username" is unnecessary overhead',
        'Teams unfamiliar with domain-driven design — Event Sourcing requires strong aggregate modelling',
        'When the event store will grow unboundedly and there is no snapshot strategy',
      ],
      vs: [
        { name: 'Traditional State Storage', when: 'Store the current state (SQL UPDATE). Simpler, sufficient for most CRUD-heavy domains that do not need history.' },
        { name: 'Audit Logging', when: 'A supplementary log of changes alongside traditional state storage. Easier to implement but the audit log and the state can diverge; Event Sourcing prevents divergence by making the log the only source.' },
      ],
    },
    failures: [
      {
        name: 'Event Store Unbounded Growth',
        cause: 'High-volume aggregates accumulate thousands of events over time, making replay prohibitively slow.',
        symptom: 'Loading an Order aggregate requires replaying 100K events; aggregate load times spike to seconds.',
        fix: 'Implement snapshotting: persist aggregate state every N events. On load, start from the latest snapshot. Snapshots do not replace events — the log is still the source of truth.',
        severity: 'high',
      },
      {
        name: 'Schema Evolution Breaking Replay',
        cause: 'An event schema is changed (field renamed, type changed), and old events in the store no longer deserialise correctly.',
        symptom: 'Replaying historical events throws deserialisation errors; aggregate cannot be loaded.',
        fix: 'Use upcasters — transformation functions that upgrade old event versions to the current schema at read time. Never modify or delete stored events. Use a schema registry (Avro/Protobuf) to enforce backward compatibility.',
        severity: 'critical',
      },
      {
        name: 'Projection Rebuild Downtime',
        cause: 'A projection schema must be changed, requiring a full replay of the event store from the beginning.',
        symptom: 'Read models are unavailable or stale during multi-hour projection rebuilds on large event stores.',
        fix: 'Build new projections in shadow mode — run old and new projections in parallel. Swap traffic to the new projection when it has caught up. Use catch-up subscriptions to rebuild without blocking reads.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🏦 📜 → 💰',
      t: 'The Bank Ledger Analogy',
      tx: 'Your bank never stores your balance as a single number that gets updated. Instead, it stores every transaction: deposited $500 on Monday, withdrew $50 on Tuesday, received a transfer of $200 on Wednesday. Your balance is the sum of all those entries — computed, not stored. If there is ever a dispute, the bank shows you the complete history, not just the current number. Event Sourcing applies this same principle to software. Instead of doing UPDATE accounts SET balance = 450, you append a MoneyWithdrawn event. Your current state is always the result of replaying your event history. This means you can time-travel to any moment, understand every state transition, and never lose data — because nothing is ever overwritten.',
      s: 'Append events to an immutable log → Replay events to derive current state → Projections build read models from the same log.',
    },
    te: {
      def: 'An architectural pattern where application state is derived from an append-only log of immutable domain events, rather than storing current state directly.',
      types: [
        { n: 'Full Event Sourcing', d: 'Every aggregate uses an event store as its only persistence. State is always derived by replay. Requires snapshots for performance.' },
        { n: 'Selective Event Sourcing', d: 'Only audit-critical or complex aggregates use Event Sourcing; simpler entities use traditional storage. Pragmatic for brownfield systems.' },
        { n: 'CQRS + Event Sourcing', d: 'Write side is the event store; read side is one or many projections. The combination provides full auditability, arbitrary read models, and zero schema migrations.' },
      ],
      when: 'Use for financial systems, audit-heavy domains, complex domain logic with many state transitions, or anywhere the question "how did we get here?" is business-critical.',
      trade: 'Pros: complete audit trail, time-travel debugging, arbitrary new read models without migration, natural fit for CQRS. Cons: increased storage, query complexity (must use projections), schema evolution complexity, steep learning curve for teams unfamiliar with DDD.',
      code: `// Aggregate rebuilt from events
class BankAccount {
  id: string;
  balance: number = 0;
  version: number = 0;

  apply(event: DomainEvent) {
    if (event.type === 'MoneyDeposited') this.balance += event.amount;
    if (event.type === 'MoneyWithdrawn') this.balance -= event.amount;
    this.version = event.sequenceNumber;
  }

  static rehydrate(events: DomainEvent[]): BankAccount {
    const account = new BankAccount();
    for (const event of events) account.apply(event);
    return account;
  }

  withdraw(amount: number): DomainEvent {
    if (amount > this.balance) throw new Error('Insufficient funds');
    return { type: 'MoneyWithdrawn', amount, accountId: this.id,
             sequenceNumber: this.version + 1, timestamp: new Date().toISOString() };
  }
}`,
      rw: {
        ex: [
          'Git: the commit history IS the source of truth; current file state is derived by replaying commits from the initial empty state',
          'Banking ledgers: every deposit and withdrawal is an immutable entry; balance is computed, never stored',
          'EventStoreDB (used by Particular Software clients): stores aggregate events, powers CQRS projections, handles 10K events/sec on commodity hardware',
        ],
        cs: 'Axon Framework, widely used in Dutch financial institutions, implements full CQRS + Event Sourcing. Teams report that schema migrations — historically the most painful database operation — are replaced by projection rebuilds, which can be done online with zero downtime.',
      },
    },
    interview: {
      q: 'How do you change an event schema in Event Sourcing without breaking historical replays?',
      a: "Three strategies. (1) Upcasters: a function registered in your event store client that transforms old event versions to the current schema at read time. When you load events, the upcaster pipeline runs before the aggregate sees them — old events are transparently upgraded. (2) Copy-and-replace: replay all old events through a migration function, write the upgraded events to a new event stream, and cut over. Expensive but gives you a clean store. (3) Schema registry with backward/forward compatibility: use Avro or Protobuf with Confluent Schema Registry. The registry rejects schema changes that would break existing consumers. Only additive, backward-compatible changes are allowed. The universal rule: never modify or delete stored events. They are immutable history. The schema registry enforces this contract automatically.",
      fu: [
        "What's the difference between a projection and a snapshot in Event Sourcing?",
        'How do snapshots work and when should you create them?',
        'How is Event Sourcing different from a traditional audit log alongside a state table?',
      ],
    },
  },

  {
    id: 'transactional-outbox',
    cat: 'arch-patterns',
    color: '#f59e0b',
    icon: '📬',
    title: 'Transactional Outbox Pattern',
    tag: "A desk outbox: write the letter AND put it in the tray — the postman picks it up even if you leave",
    overview:
      'The Transactional Outbox pattern guarantees atomicity between a database write and an event publication without using a distributed transaction. The solution: write business data AND an outbox event record in the same local database transaction. A separate relay process reads the outbox and publishes events to the broker. The local ACID transaction eliminates the dual-write problem — either both the data and the outbox event are written, or neither is.',
    components: [
      {
        name: 'Outbox Table',
        icon: '📋',
        role: 'Staging area for events, inside the same database as the business data.',
        detail:
          'A table in your application database (e.g., outbox_events) that stores serialised events alongside their status (pending/sent). Writing to this table and to the business tables happens in the same ACID transaction — guaranteed atomicity with no distributed coordination.',
      },
      {
        name: 'Message Relay',
        icon: '🚚',
        role: 'Reads pending outbox events and publishes them to the broker.',
        detail:
          'A background process (or a CDC connector like Debezium) polls or watches the outbox table for unsent events and publishes them to Kafka, SQS, or another broker. After successful publish, it marks the event as sent. If the relay crashes after publishing but before marking sent, it republishes — consumers must be idempotent.',
      },
      {
        name: 'CDC Connector (Optional)',
        icon: '🔭',
        role: 'Streams database changes to the broker via change data capture.',
        detail:
          'Debezium reads the PostgreSQL WAL (write-ahead log) or MySQL binlog and publishes change events to Kafka. This eliminates the polling overhead and captures every database change with sub-second latency. The outbox table changes become Kafka events automatically, without any polling loop in application code.',
      },
      {
        name: 'Idempotent Consumer',
        icon: '🔁',
        role: 'Handles duplicate event deliveries without duplicate side effects.',
        detail:
          'Because the relay may publish the same event more than once (at-least-once delivery), consumers must deduplicate. Consumers store processed eventIds in a seen-set (Redis or DB unique constraint) and skip events they have already handled. This is a required complement to the Outbox pattern.',
      },
    ],
    howItWorks:
      'An application request arrives — "place this order". A single database transaction writes the Order row to the orders table AND writes an OrderPlaced event record to the outbox_events table. The transaction commits atomically. A relay process (polling or CDC) detects the new outbox row, publishes the event to Kafka, and marks the outbox row as sent. If the relay crashes between publishing and marking, it republishes on recovery — which is why consumers must be idempotent. The outbox table acts as a reliable, durable buffer that bridges local ACID guarantees and external message delivery.',
    decision: {
      choose: [
        'You need to atomically write data to your DB and publish an event to a message broker',
        'Any event-driven microservice that cannot afford to lose events after a database commit',
        'This is the standard solution for the dual-write problem — use it as the default for event publishing',
      ],
      avoid: [
        'Synchronous request-reply flows — the relay adds latency that is unacceptable for synchronous consumers',
        'When your broker supports distributed transactions natively (rare) — XA transactions with some databases and brokers, though operationally complex',
      ],
      vs: [
        { name: 'Two-Phase Commit (XA)', when: 'Distributed ACID across DB and broker. Theoretically eliminates the need for an outbox but introduces distributed coordinator overhead, reduced availability, and vendor lock-in.' },
        { name: 'Direct Publish (no Outbox)', when: 'Only acceptable if losing events on crash is tolerable — analytics, non-critical notifications. Never use for financial or inventory events.' },
      ],
    },
    failures: [
      {
        name: 'Relay Falling Behind',
        cause: 'High write volume fills the outbox table faster than the relay can publish.',
        symptom: 'Outbox table grows to millions of rows; event consumers lag; downstream services are stale.',
        fix: 'Scale the relay horizontally (partition outbox by aggregate type). Use CDC (Debezium) instead of polling for lower latency. Add an alert on outbox table row count.',
        severity: 'high',
      },
      {
        name: 'Duplicate Event Delivery',
        cause: 'Relay publishes an event to the broker, then crashes before marking the outbox row as sent. On recovery, it republishes.',
        symptom: 'Consumers process the same event twice — double charges, double inventory decrements.',
        fix: 'All consumers of outbox-published events must implement idempotency keys. This is not optional — it is a required contract for at-least-once delivery.',
        severity: 'critical',
      },
      {
        name: 'Outbox Table Unbounded Growth',
        cause: 'Sent events are never deleted from the outbox table.',
        symptom: 'Outbox table consumes gigabytes of storage; queries slow down.',
        fix: 'Run a periodic cleanup job that deletes rows older than N days where status = sent. Or use a TTL index (MongoDB) / table partitioning by date with partition drops.',
        severity: 'medium',
      },
    ],
    a: {
      v: '📝 → 📬 → 📫',
      t: 'The Desk Outbox Analogy',
      tx: 'Imagine you need to send an important letter and update your filing cabinet at the same time. If you update the filing cabinet first and then get hit by a bus before mailing the letter, the letter is never sent. If you mail the letter first and then your office burns down before you update the files, the records are inconsistent. The solution: write the letter AND put it in your physical desk outbox tray in one step. The post room picks it up and mails it later — even if you leave, go on holiday, or the building is evacuated. Your outbox tray is the buffer that decouples "writing the record" from "sending the message". The Transactional Outbox pattern works exactly this way: your database transaction is the one atomic action that captures both the business data and the intention to publish an event.',
      s: 'Atomic DB transaction writes business data + outbox event → Relay publishes to broker → Consumers deduplicate.',
    },
    te: {
      def: 'A pattern that guarantees atomic "write to database + publish event" by writing the event to an outbox table in the same local database transaction, then using a relay to publish the event to the broker asynchronously.',
      types: [
        { n: 'Polling Relay', d: 'A background thread or cron job periodically queries the outbox table for unsent events and publishes them. Simple to implement, introduces polling lag (100ms–1s).' },
        { n: 'CDC-based Relay', d: 'Debezium reads the database WAL and publishes outbox changes to Kafka with sub-second latency. No polling, no application-level relay process. Requires Debezium and Kafka infrastructure.' },
      ],
      when: 'Use whenever a microservice needs to atomically commit a database change and publish a message to a broker. This is the default pattern for event-driven microservices — the alternative (direct publish) is not safe.',
      trade: 'Pros: guaranteed at-least-once event delivery, no distributed transactions, works with any database and broker. Cons: relay is an additional process to operate, at-least-once delivery (consumers must be idempotent), outbox table adds storage overhead.',
      code: `// Atomic write: business data + outbox event in one transaction
async function placeOrder(input: PlaceOrderInput) {
  return db.transaction(async (tx) => {
    const order = await tx.orders.create({
      userId: input.userId,
      items: input.items,
      total: input.total,
      status: 'pending',
    });

    await tx.outbox_events.create({
      id: crypto.randomUUID(),
      eventType: 'OrderPlaced',
      aggregateId: order.id,
      payload: JSON.stringify({ orderId: order.id, total: order.total }),
      status: 'pending',
      createdAt: new Date(),
    });

    return order;
  }); // if this commits, both writes succeeded; if it fails, neither did
}

// Relay: publishes pending outbox events
async function relayOutboxEvents() {
  const pending = await db.outbox_events.findMany({ where: { status: 'pending' }, take: 100 });
  for (const event of pending) {
    await kafka.produce(event.eventType, JSON.parse(event.payload));
    await db.outbox_events.update({ where: { id: event.id }, data: { status: 'sent' } });
  }
}`,
      rw: {
        ex: [
          'Debezium + Kafka: Debezium watches the PostgreSQL WAL for outbox table inserts and publishes them to Kafka topics automatically — used by Red Hat and many enterprise teams',
          'Shopify: uses an outbox pattern to guarantee order events reach their fulfillment pipeline even during partial failures',
          'Any microservice that calls stripe.charge() and writes to a DB uses an implicit outbox need — the explicit Outbox pattern formalises this safely',
        ],
        cs: 'A payments startup switched from "write DB, then publish to SQS" to the Outbox pattern after a crash caused 300 lost payment events in production. Post-adoption, zero payment events were lost over 18 months, and they confirmed consumers were idempotent by auditing duplicate deliveries which had no visible effect.',
      },
    },
    interview: {
      q: "Why can't you just write to the database and then publish to Kafka in the same code block?",
      a: "Two separate I/O operations means two separate failure points. Scenario 1: write to DB succeeds, then process crashes before publishing to Kafka. The DB committed but the broker never received the event — the event is silently lost. Downstream services never react. Scenario 2: publish to Kafka succeeds, then the DB write fails (constraint violation, timeout). You have a phantom event in the broker describing a business state that was rolled back — consumers act on data that does not exist. There is no safe ordering of two operations that can independently fail. The Outbox pattern solves this by making the event record part of the same local DB transaction as the business data — one atomic commit captures both. The relay then handles broker delivery as a separate, retriable concern. Since the relay may deliver the event more than once (crash after publish, before marking sent), consumers must implement idempotency — that is the required contract.",
      fu: [
        'What is CDC (Change Data Capture) and how does Debezium implement the Outbox pattern?',
        'How do you prevent the relay from becoming a single point of failure or a bottleneck?',
        'What happens if the outbox table grows unboundedly and how do you clean it up?',
      ],
    },
  },

  {
    id: 'strangler-fig',
    cat: 'arch-patterns',
    color: '#f59e0b',
    icon: '🌳',
    title: 'Strangler Fig Pattern',
    tag: 'A strangler fig tree: grows around an old tree, gradually replacing it — until the old tree is gone',
    overview:
      'The Strangler Fig pattern migrates a monolith to microservices incrementally by routing specific features or routes to new services while the monolith continues to handle everything else. Over time, more and more traffic is routed to new services until the monolith is serving nothing and can be decommissioned. There is no big-bang rewrite — the system is always running, and migration risk is bounded to one feature at a time.',
    components: [
      {
        name: 'Facade / API Gateway',
        icon: '🚪',
        role: 'Routes incoming requests to either the legacy monolith or the new service.',
        detail:
          'The gateway (NGINX, AWS API Gateway, a custom reverse proxy) is the traffic controller. Initially, all requests go to the monolith. As new services are deployed, routing rules are updated to forward specific paths or features to the new service. The facade must be transparent to clients — the URL structure does not change.',
      },
      {
        name: 'New Microservice',
        icon: '🌱',
        role: 'The replacement service implementing a migrated feature.',
        detail:
          'Each new service owns a specific bounded context extracted from the monolith. It has its own database schema, deployment pipeline, and team ownership. It must be functionally equivalent to the monolith code it replaces — no new features during migration (new features go to the new service only).',
      },
      {
        name: 'Legacy Monolith',
        icon: '🏚️',
        role: 'The existing system, shrinking as features migrate out.',
        detail:
          'The monolith continues to handle all un-migrated features. As routes are strangled away, it handles progressively less traffic. The key discipline: no new features are added to the monolith during migration. Every new feature is built in the new service, which creates a natural forcing function to finish the migration.',
      },
      {
        name: 'Feature Flag / Routing Rule',
        icon: '🚦',
        role: 'Controls what percentage of traffic each path sends to new vs legacy.',
        detail:
          'Feature flags enable canary releases during migration — send 1% of traffic to the new service, validate correctness, then ramp to 100%. If the new service has a bug, roll back by updating the flag. This makes each migration step independently reversible with zero downtime.',
      },
    ],
    howItWorks:
      'Deploy a facade in front of the monolith — all traffic passes through it, initially forwarded entirely to the monolith (zero change to user experience). Identify the first feature to migrate: pick something with clear boundaries and high test coverage. Build the new service. Deploy it alongside the monolith. Update the facade to route that feature\'s traffic to the new service, starting with 1% via feature flag. Monitor error rates and latency. Ramp to 100%. Remove the corresponding code from the monolith. Repeat for the next feature. Track progress: what percentage of traffic goes to new services? What percentage of monolith code has been deleted? The migration is "done" when the monolith has no active routes.',
    decision: {
      choose: [
        'Migrating a large monolith to microservices — this is the only proven approach at scale',
        'You cannot afford downtime or a big-bang cutover — incremental migration is always running',
        'Teams own different bounded contexts and need independent deployments',
      ],
      avoid: [
        'The system is small enough to rewrite in a single sprint — a simple rewrite is acceptable',
        'There are no clear bounded contexts — strangling without boundaries just creates a distributed monolith',
        'The monolith is being retired entirely (not migrated) — full replacement may be simpler',
      ],
      vs: [
        { name: 'Big-Bang Rewrite', when: 'Rewrite the entire system at once. Historical failure rate is close to 100% for large systems. Joel Spolsky called it "the single worst strategic mistake any software company can make." Avoid.' },
        { name: 'Branch by Abstraction', when: 'Used within a single codebase to replace a component behind an interface. Complements Strangler Fig at the code level — you strangle a module within the monolith before extracting it to a service.' },
      ],
    },
    failures: [
      {
        name: 'Incomplete Migration (The 80% Trap)',
        cause: 'The "last 20%" of the monolith is low-traffic legacy code that nobody wants to own or migrate.',
        symptom: 'The monolith still runs indefinitely, requiring maintenance for one service team. The promised cost savings never fully materialise.',
        fix: 'Set a hard decommission date from day one. Track migration completion as a first-class metric. Route all new features exclusively to new services — never add features to the monolith during migration.',
        severity: 'high',
      },
      {
        name: 'Shared Database Dual-Write Inconsistency',
        cause: 'Both the monolith and the new service write to the same database tables during the transition period.',
        symptom: 'Data inconsistencies appear as the new service has different validation logic or write patterns than the monolith.',
        fix: 'Use the Strangler Fig at the API layer, not the database layer. During migration, only one system should own writes to a given table. Use the Outbox pattern or CDC to keep the new service\'s DB in sync from the monolith writes until ownership is transferred.',
        severity: 'critical',
      },
      {
        name: 'Facade Becoming Permanent Infrastructure',
        cause: 'The migration routing logic in the facade accumulates over years, becoming a critical, complex component nobody wants to touch.',
        symptom: 'The facade has 500 routing rules, is maintained by nobody, and becomes the most fragile part of the system.',
        fix: 'Track and prune routing rules as migrations complete. When a feature is fully migrated, remove its routing rule immediately. Treat routing complexity as technical debt with a non-zero cost.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🌱 → 🌳 → 🏚️ → ✅',
      t: 'The Strangler Fig Tree Analogy',
      tx: 'A strangler fig tree starts as a small vine growing around an existing tree. Over years, it grows up, around, and through the host tree — stealing sunlight, water, and nutrients. Eventually, the strangler fig becomes the dominant structure, and the original tree, no longer needed, dies and rots away inside. What stands is entirely the new tree, shaped around where the old one was. This is exactly how you migrate a monolith: you grow new services around the outside of the monolith, steal traffic from it one feature at a time, and eventually the monolith handles nothing and is decommissioned. The key property of both the tree and the pattern: the system is always alive and serving traffic — there is no moment when everything is shut down for migration.',
      s: 'Deploy facade → Route features to new services one at a time → Monolith shrinks → Decommission when empty.',
    },
    te: {
      def: 'A migration pattern that incrementally replaces a legacy monolith by routing specific features to new services via a facade, until the monolith handles no traffic and can be decommissioned.',
      types: [
        { n: 'HTTP-level Strangling', d: 'Facade routes specific URL paths or HTTP methods to new services. Most common approach — works with any language and framework.' },
        { n: 'Event-level Strangling', d: 'New services subscribe to events from the monolith (via CDC or outbox) and build their own state, eventually owning writes. Used when migrating data ownership, not just request handling.' },
        { n: 'UI-level Strangling', d: 'Micro-frontend approach: new services own specific UI components or pages. The monolith delivers legacy pages while new services deliver new ones. Used in large frontend migrations.' },
      ],
      when: 'Use for any significant monolith-to-microservices migration. The pattern works for any size migration — from extracting one service to a multi-year re-architecture. It is the industry standard approach because it is the only one with a proven track record at scale.',
      trade: 'Pros: zero-downtime migration, each step is independently reversible, new services are in production and generating real-world validation throughout. Cons: temporary complexity of running two systems in parallel, facade adds a network hop, shared database coordination during transition, risk of never finishing.',
      code: `// Facade routing rule (NGINX config or API Gateway rule)
// Phase 1: all traffic to monolith
// location /api/orders { proxy_pass http://monolith; }

// Phase 2: order service migrated, routing updated
// nginx.conf
// location /api/orders { proxy_pass http://order-service; }
// location /api/products { proxy_pass http://monolith; }  // not yet migrated
// location /api/users { proxy_pass http://monolith; }     // not yet migrated

// Feature flag canary (TypeScript API gateway middleware)
async function routeOrderRequest(req: Request): Promise<Response> {
  const featureFlag = await flagService.get('orders-v2-rollout'); // 0-100
  const bucket = hashUserId(req.headers['x-user-id']) % 100;

  if (bucket < featureFlag.percentage) {
    return forwardTo('http://order-service-v2', req);  // new service
  } else {
    return forwardTo('http://monolith', req);           // legacy
  }
}`,
      rw: {
        ex: [
          'Amazon: migrated from a Perl monolith to microservices over ~5 years using incremental extraction — the monolith served no traffic by ~2010',
          'Netflix: strangled a Java monolith into hundreds of microservices starting ~2009, feature by feature, enabling independent scaling for streaming',
          'Shopify: extracts services from their Rails monolith gradually; their modular monolith serves as the intermediate step before extraction',
        ],
        cs: 'A European bank ran an 18-month Strangler Fig migration of their loan origination system. By routing new loan applications to the new service while the monolith handled legacy applications, they ran both systems in parallel with zero downtime. The key metric: "percentage of new loan volume on new platform" went from 0% to 100% in 18 months, then the monolith was decommissioned.',
      },
    },
    interview: {
      q: "What's the biggest risk of the Strangler Fig pattern and how do you mitigate it?",
      a: "The biggest risk is incomplete migration — the 'last 20%' syndrome. The monolith handles low-traffic, legacy, forgotten features that nobody wants to own. Migration stalls at 80% because the remaining work is painful and the business value is low. The monolith stays around forever as a zombie system, requiring maintenance without contributing value. Three mitigations: (1) Set a hard decommission date from day one and make it a company-level commitment — not a team-level aspiration. (2) Track migration completion as a first-class engineering metric on the same dashboard as uptime and latency. (3) Enforce a rule: no new features are added to the monolith during migration. Every new feature goes to the new platform. This creates a forcing function — teams that need new functionality are incentivised to migrate their piece. Without these three levers, Strangler Fig migrations routinely get stuck at 80% indefinitely.",
      fu: [
        'How do you handle the shared database problem during a Strangler Fig migration?',
        "What's the difference between the Strangler Fig pattern and the Branch by Abstraction pattern?",
        'How do you test the routing facade to ensure no requests are lost during migration?',
      ],
    },
  },
];
