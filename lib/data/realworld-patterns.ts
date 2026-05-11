import { RealWorldSystem } from '../types';

export const REALWORLD_PATTERNS: RealWorldSystem[] = [
  {
    id: 'ecommerce-order-service',
    icon: '🛒',
    name: 'E-Commerce Order Service',
    color: '#f59e0b',
    scale: '1M orders/day · SAGA + Outbox + EDA',
    focus: 'Distributed Order Processing with SAGA, Outbox, and Event-Driven Architecture',
    problem:
      'Design an order processing system where placing an order involves coordinating inventory reservation, payment charging, and shipment triggering across three separate microservices — with no lost events, no double-charges, and automatic rollback if any step fails.',
    functionalReqs: [
      'User places order → inventory reserved, payment charged, shipment triggered',
      'If any step fails, all previous steps are compensated (inventory released, payment refunded)',
      'Every domain event is reliably published to Kafka even if the service crashes mid-flight',
      'Order status transitions: PENDING → CONFIRMED → SHIPPED → DELIVERED',
      'Duplicate checkout clicks must not create duplicate orders or charges',
      'Each service can be deployed independently with no shared database',
    ],
    nonFunctionalReqs: [
      { label: 'Order placement latency', value: '< 3 seconds end-to-end (async confirmation acceptable)' },
      { label: 'Durability', value: 'Zero orders lost — even if any single service crashes mid-saga' },
      { label: 'Consistency', value: 'Eventual consistency across services; no overselling (inventory reservation is strongly consistent)' },
      { label: 'Availability', value: '99.9% — payment processing is the critical path' },
    ],
    scaleEstimation: [
      { label: 'Orders/day', value: '1M avg, 10M peak', note: 'Peak during flash sales' },
      { label: 'Orders/sec', value: '~12 avg, ~115 peak', note: 'Burst headroom required' },
      { label: 'SAGA steps per order', value: '3', note: 'Inventory, Payment, Shipment' },
      { label: 'Outbox table writes/sec', value: '~36 avg', note: '3 writes per order × 12 orders/sec' },
      { label: 'Kafka events/sec', value: '~36 avg, ~350 peak', note: 'Mirrors outbox write rate' },
    ],
    highLevelDesign: [
      {
        title: 'API Gateway → Order Service',
        description:
          'User submits order through the API Gateway. Order Service writes the order record and an outbox event to its database inside a single ACID transaction. The API returns 202 Accepted immediately — the client receives an orderId and polls for status. This dual-write (order + outbox in one transaction) is the foundation of durability: either both succeed or neither does, so the event can never be silently dropped.',
      },
      {
        title: 'Outbox Relay → Kafka',
        description:
          'A Message Relay process (or Debezium CDC reading the binlog) continuously polls or streams the outbox table and publishes "OrderCreated" events to Kafka. Once the event is confirmed by Kafka, the relay marks the outbox row as sent. If the relay crashes after publishing but before marking, it re-publishes on restart — Kafka consumers tolerate duplicates via idempotency keys. This asynchronous relay decouples event publication from the request path entirely.',
      },
      {
        title: 'SAGA Orchestrator (Temporal / Step Functions)',
        description:
          'The SAGA Orchestrator consumes "OrderCreated" from Kafka. Step 1: calls Inventory Service to reserve stock. Step 2: calls Payment Service to charge the card. Step 3: calls Shipment Service to create the shipment. Each step is a synchronous call with a timeout and is persisted to the orchestrator\'s durable state store before proceeding. Temporal\'s durable execution guarantees that if the orchestrator crashes between any two steps, it resumes from the last confirmed step automatically.',
      },
      {
        title: 'Compensating Transactions',
        description:
          'If Payment fails after Inventory has already been reserved, the Orchestrator issues a "ReleaseInventory" compensating command back to Inventory Service. If Shipment fails, the Orchestrator issues both "RefundPayment" and "ReleaseInventory". Each compensating command is itself written through the Outbox to ensure it is never lost. Compensations are retried with exponential backoff; permanently failed compensations land in a Dead Letter Queue for manual review.',
      },
      {
        title: 'Status Updates via Read-Model Projector',
        description:
          'Each downstream service publishes domain events (InventoryReserved, PaymentCharged, ShipmentCreated) to their respective Kafka topics. A read-model projector consumes all relevant topics and updates the Orders read table with the current order status. The customer polls GET /orders/{id} and sees live status transitions. The write database is never queried by the status read path — the read model is the only source for customer-facing queries.',
      },
    ],
    deepDive: [
      {
        title: 'Why SAGA over 2PC',
        description:
          'Two-phase commit (2PC) requires all participants to hold database locks during the entire coordination round-trip. At scale, the Inventory Service holding a lock while waiting for Payment Service to respond creates cascading timeouts across the system — one slow downstream makes the entire cluster degrade. SAGA replaces the global lock with local transactions and compensating actions: each service commits locally and publishes an event; if a later step fails, a compensating transaction undoes the earlier commit. The trade-off is a temporary inconsistency window during saga execution — inventory may be reserved but payment not yet charged for up to 2 seconds. This is acceptable for e-commerce (stock is held, not sold), but would not be acceptable for bank transfers. The key insight is that 2PC trades availability for consistency, while SAGA trades consistency for availability — and e-commerce systems need availability.',
        insight:
          'SAGA is not a simpler 2PC — it is a fundamentally different consistency model. You are accepting temporary inconsistency in exchange for availability and independent scalability. Design your saga steps so the compensation of any step is always possible.',
      },
      {
        title: 'Outbox guarantees no lost events',
        description:
          'The naive approach — write order to DB, then publish to Kafka — has a fatal flaw: if the application crashes between the two writes, the event is lost permanently. The Outbox pattern fixes this by including the event row in the same DB transaction as the order row. The Message Relay is a separate process that reads the outbox and publishes to Kafka; even if the relay crashes after publishing but before marking the row as sent, it simply re-publishes on restart. Kafka consumers must handle duplicates, which they do by treating the orderId as an idempotency key — if they have already processed an event with that orderId, they discard the duplicate without error. The Outbox is the only correct implementation of the "transactional outbox" pattern: write events atomically with business state, then deliver them asynchronously.',
        insight:
          'Without the Outbox, every microservice that publishes events has a silent data loss bug. The Outbox is not a performance optimisation — it is a correctness requirement for any event-driven system that cares about durability.',
      },
      {
        title: 'Idempotency for duplicate orders',
        description:
          'The client generates a UUID idempotency key on checkout page load (not on button click). This key is sent in the X-Idempotency-Key request header. Order Service stores processed idempotency keys in a DB table with a unique constraint on the key column. When a second request arrives with the same key — whether from a double-click, a network retry, or a browser refresh — the unique constraint fires and the service returns the cached response from the first request. The key is tied to the checkout session, not the user, so a user can legitimately place two separate orders in two separate sessions. Idempotency keys expire after 24 hours to prevent unbounded growth of the keys table.',
        insight:
          'Idempotency is a client-server contract, not just server-side logic. The client must generate and resend the same key on retries; the server must store processed keys and return cached responses. Both sides must participate for the guarantee to hold.',
      },
    ],
    decisions: [
      {
        question: 'SAGA Choreography vs Orchestration?',
        chosen: 'Orchestration (Temporal / Step Functions)',
        reason:
          'Order flow has 3 steps with explicit compensations. Orchestration makes the entire flow visible in one place — you can see the current step, the compensation history, and retry counts in a single Temporal workflow dashboard. Choreography distributes the flow logic across three services, making debugging a log-mining exercise across multiple systems. The orchestrator is a single point of failure, but Temporal\'s durable execution model means it survives crashes by persisting state after every step — making it effectively stateless from a failure perspective.',
      },
      {
        question: 'CDC (Debezium) vs polling relay for Outbox?',
        chosen: 'Debezium CDC',
        reason:
          'Polling adds latency proportional to the polling interval and increases read load on the DB. CDC reads the database transaction log (MySQL binlog / Postgres WAL) — lower latency (milliseconds), zero extra DB read queries. Debezium streams every committed Outbox row to Kafka almost instantly after the transaction commits. The trade-off is operational complexity: Debezium requires a Kafka Connect cluster and careful connector configuration, and it is sensitive to log rotation settings.',
      },
      {
        question: 'Shared database vs separate DBs per service?',
        chosen: 'Separate databases per service',
        reason:
          'Inventory uses a relational DB with strong consistency constraints for stock counts. Payment uses a financial-grade DB with full audit trails and immutable rows. Shipment uses a document store for flexible address and carrier formats. A shared DB couples every service\'s schema migrations and deployment timelines together — a schema change by the Payment team can break the Shipment service at deploy time. Separate databases allow each service to own its schema evolution completely, which is the fundamental contract of microservices.',
      },
    ],
    interview: [
      {
        q: 'How would you design the order placement flow to guarantee no lost orders?',
        a: 'Two-phase approach. First, Order Service writes the order row and an outbox event row inside a single DB transaction, then returns 202 Accepted immediately. This guarantees the event is durable before the response is sent. Second, the Debezium CDC relay streams the outbox event to Kafka. The SAGA Orchestrator in Temporal picks it up and runs the saga steps. Even if any service crashes at any point, the outbox event persists in the DB and will be published when the relay restarts, and the Temporal workflow resumes from the last completed step. The system has no single point of data loss.',
      },
      {
        q: 'How do you prevent inventory overselling when 1,000 users buy the last item simultaneously?',
        a: 'Optimistic locking with a conditional update. The inventory row has a version counter. The reservation SQL is: UPDATE stock SET count = count - 1, version = version + 1 WHERE sku = ? AND count >= 1 AND version = ?. If 1,000 concurrent requests arrive, only one wins per version — the rest see zero rows affected and retry or receive an out-of-stock response. No locks are held, no blocking occurs. For flash sales with extreme concurrency, a Redis DECR with a floor at zero pre-filters requests before they reach the DB, reducing write contention by 99%.',
      },
      {
        q: 'How does the compensating transaction work if the refund itself fails?',
        a: 'Compensating transactions can also fail, so there are three layers. First, Temporal automatically retries the compensation with exponential backoff. Second, after N retries, the failed compensation is sent to a Dead Letter Queue with the full failure trace — an on-call engineer investigates and manually triggers the compensation. Third, a nightly reconciliation job compares charged payments against confirmed orders and flags any discrepancy to the finance team. No system can guarantee 100% automated compensation — the DLQ and reconciliation job are the safety net.',
      },
      {
        q: 'How do you handle the case where the SAGA orchestrator itself crashes mid-saga?',
        a: 'Temporal provides durable execution: after every saga step completes, Temporal persists the workflow state (current step, input and output of each step) to its own database before proceeding. On orchestrator crash and restart, the workflow engine replays the event history and resumes from the last persisted step — no saga step is re-executed if it already completed successfully. This is the key advantage over a home-built orchestrator: durability is a built-in guarantee of the Temporal framework, not something you bolt on yourself.',
      },
    ],
    keyInsight:
      'The Outbox pattern is not optional in event-driven microservices — it is the only correct solution to the dual-write problem. Without it, you have a distributed system with silent event loss. The SAGA pattern replaces 2PC not because it is simpler, but because 2PC\'s locking model breaks availability at scale. The combination of SAGA + Outbox gives you distributed transactions without distributed locking.',
  },

  {
    id: 'twitter-feed-cqrs',
    icon: '🐦',
    name: 'Twitter Feed (CQRS + Event Sourcing)',
    color: '#1da1f2',
    scale: '500M tweets/day · 350M users · read/write split at massive scale',
    focus: 'Read/Write Separation with CQRS and Event Sourcing for the Write Side',
    problem:
      'Design Twitter\'s timeline system where tweets are written to a normalised write model, events fan out to pre-materialised timeline read models, and any query can be answered from an optimised read projection — without the write DB ever being queried by the timeline read path.',
    functionalReqs: [
      'Tweet written → visible in all follower timelines within 5 seconds',
      'Home timeline reads return in under 100ms at p99',
      'Write and read paths can scale completely independently',
      'Full tweet history is preserved and replayable',
      'New read projections (analytics, notifications) can be added without schema migration on the write side',
    ],
    nonFunctionalReqs: [
      { label: 'Fanout latency', value: '< 5 seconds from tweet to follower timeline' },
      { label: 'Timeline read p99', value: '< 100ms' },
      { label: 'Write throughput', value: '~6,000 tweets/sec sustained' },
      { label: 'Consistency', value: 'Eventual (5-second window acceptable for social feeds)' },
      { label: 'Storage', value: '2.24TB timeline cache (Redis) + append-only event log' },
    ],
    scaleEstimation: [
      { label: 'Tweets/day', value: '500M', note: '~6,000/sec sustained write rate' },
      { label: 'Avg followers per user', value: '200', note: 'Drives fanout amplification' },
      { label: 'Timeline cache writes/sec', value: '~1.2M', note: '6K tweets/sec × 200 followers' },
      { label: 'Redis storage', value: '2.24TB', note: '350M users × 800 tweet IDs × 8 bytes' },
      { label: 'Timeline reads/sec', value: '~300K', note: 'Read:write ratio ~50:1' },
    ],
    highLevelDesign: [
      {
        title: 'Write Path: Tweet Service → MySQL + Kafka',
        description:
          'When a user posts a tweet, the Tweet Service writes the tweet record to MySQL (the CQRS write model) and publishes a TweetCreated event to Kafka. MySQL is the system of record for all tweet content and metadata. The Kafka event log acts as the Event Source — every mutation to the tweet graph is captured as an immutable, ordered event. The write path is optimised for low-latency, strongly-consistent writes; it is never queried by the read path.',
      },
      {
        title: 'Fanout Service: CQRS Projection Builder',
        description:
          'The Fanout Service consumes TweetCreated events from Kafka. For each event, it reads the author\'s follower list from the Social Graph Service and writes the tweet ID into each follower\'s Redis sorted set (keyed by userId, scored by timestamp). This is the materialisation of the read model. The Fanout Service is horizontally scalable — more consumers can be added to drain the Kafka partition faster. Each Redis write is a lightweight ZADD operation; the full tweet content is not stored in the timeline cache.',
      },
      {
        title: 'Read Path: Timeline Service → Redis → Tweet Cache',
        description:
          'When a user requests their home timeline, the Timeline Service reads tweet IDs from their Redis sorted set (a single ZREVRANGE command). It then batch-fetches tweet content from a separate Tweet Content Cache (backed by Memcached or a Redis cluster). The final response is assembled in memory and returned. The MySQL write database is never touched by this path — reads are served entirely from in-memory caches, achieving sub-100ms p99 even at 300K reads/sec.',
      },
      {
        title: 'Celebrity Hybrid: Push + Pull Merge',
        description:
          'Accounts with more than 50,000 followers are excluded from push fanout — writing 100M Redis entries for a single celebrity tweet would take too long and spike the Fanout Service. Instead, at read time, the Timeline Service checks if any followed accounts are flagged as celebrities. If so, it fetches their recent tweets from a dedicated Celebrity Cache and merges them with the pre-materialised follower timeline in memory before returning. The merge is O(n) where n is the number of celebrities followed, typically single digits.',
      },
    ],
    deepDive: [
      {
        title: 'Event Sourcing on the write side',
        description:
          'MySQL stores tweet events, not mutable state snapshots. TweetCreated, TweetDeleted, and TweetEdited events are appended to the event log. The current state of a tweet is derived by folding all events for that tweetId in order. This append-only model means the database is never mutated — only extended. The transformative consequence is that any new read projection can be built by replaying the event log from the beginning. Adding a hashtag analytics dashboard requires writing a new Kafka consumer that projects TweetCreated events into an Elasticsearch index — no changes to the write model, no schema migration, no data backfill beyond the replay.',
        insight:
          'Event Sourcing is not a storage optimisation — it is a time-travel capability. The event log is the only source of truth; projections are just cached computations over that log. You can always discard and rebuild any projection.',
      },
      {
        title: 'Why CQRS solves the read/write impedance mismatch',
        description:
          'The read pattern (give me the 20 most recent tweets from 500 accounts I follow, sorted by time) is fundamentally incompatible with the write schema (one normalised tweets table). A SQL JOIN across 500 accounts at 300K reads/sec would destroy the write database. CQRS acknowledges that the optimal data structure for writing (normalised relational) is different from the optimal structure for reading (pre-sorted Redis sorted sets). Separate models means separate scaling: the Redis cluster scales horizontally for read throughput; the MySQL cluster scales vertically for write consistency. The only coupling between them is the Kafka fanout — a one-way data flow from write model to read model.',
        insight:
          'CQRS is not primarily about performance — it is about acknowledging that different operations have fundamentally different data shape requirements. Once you accept that, separate optimised models become the obvious solution.',
      },
      {
        title: 'Eventual consistency in practice: the author exception',
        description:
          'For most followers, a tweet takes up to 5 seconds to appear in their timeline — the fanout lag. This is entirely acceptable for a social feed; users do not notice 5-second delays in content from others. However, the author\'s own timeline has a different contract: you just posted a tweet, and you expect to see it immediately. Eventual consistency would feel like a bug. The solution is a small strong-consistency exception: the Tweet Service synchronously writes the tweet ID into the author\'s own Redis timeline before returning the 200 response. All other followers receive the tweet via the async fanout path. The author gets strong consistency; the world gets eventual consistency.',
        insight:
          'Eventual consistency is not a binary system property — you can apply it selectively. Design your consistency model around the user\'s expectation of each specific action, not as a global setting.',
      },
    ],
    decisions: [
      {
        question: 'Push fanout vs pull fanout vs hybrid?',
        chosen: 'Hybrid: push for < 50K followers, pull for celebrities',
        reason:
          'Pure push would require writing 100M Redis entries when a celebrity tweets — the Fanout Service would fall behind the write rate during peak hours. Pure pull would require real-time fan-in queries at read time for every account a user follows — expensive at 300K reads/sec. The hybrid model applies push (pre-materialisation) where it is cheap (normal users) and pull (on-demand fetch) where push is prohibitively expensive (celebrities). The threshold of 50K followers is empirically tuned based on Fanout Service capacity.',
      },
      {
        question: 'Store tweet IDs vs full tweet content in Redis timeline?',
        chosen: 'Tweet IDs only',
        reason:
          'Storing full tweet content (avg 1KB) in 350M user timelines at 800 tweets each would require 280TB of Redis — economically infeasible. Storing only the 8-byte tweet ID requires 2.24TB — feasible with a moderate Redis cluster. The content fetch is a separate cache layer (Memcached) that stores tweet content keyed by tweetId. The two-layer approach allows tweet content edits and deletions to propagate without touching any timeline cache entry.',
      },
      {
        question: 'MySQL vs a dedicated Event Store for the write model?',
        chosen: 'MySQL with append semantics + Debezium CDC to Kafka',
        reason:
          'A dedicated Event Store (EventStoreDB, Axon) adds operational complexity and a new technology to support. MySQL with an append-only events table (INSERT only, no UPDATE/DELETE on event rows) provides the same immutability guarantees with a familiar operational model. Debezium CDC reads the MySQL binlog and streams every new event row to Kafka within milliseconds — achieving the same Event Source fanout without a specialised store.',
      },
    ],
    interview: [
      {
        q: 'How does CQRS help Twitter handle its read/write scale difference?',
        a: 'Twitter has roughly a 50:1 read-to-write ratio (300K timeline reads/sec vs 6K tweet writes/sec). CQRS allows the read and write models to be optimised independently for their respective access patterns. The write model (MySQL) is optimised for consistent, normalised tweet storage. The read model (Redis sorted sets) is optimised for O(log N) timeline access by timestamp. Without CQRS, every timeline read would require a multi-table JOIN on the write database — impossible at 300K reads/sec. With CQRS, reads never touch the write database at all.',
      },
      {
        q: 'What happens when a celebrity with 100 million followers tweets?',
        a: 'The celebrity is flagged as a high-follower account (> 50K followers) and excluded from push fanout. Their tweet is written to MySQL and published to Kafka as normal, but the Fanout Service skips the Redis write for that tweet. At read time, the Timeline Service checks whether any followed accounts are celebrities (this flag is cached in Redis per userId). If the user follows that celebrity, the Timeline Service fetches the celebrity\'s recent tweets from a separate Celebrity Tweet Cache and merges them in-memory with the user\'s pre-materialised timeline sorted set before returning the response. The merge is fast because the number of celebrities a user follows is small.',
      },
      {
        q: 'How do you add a new read model (e.g., hashtag trending analytics) without touching the write side?',
        a: 'This is the core value proposition of Event Sourcing. The Kafka topic already contains every TweetCreated event ever written, with full retention enabled on the topic. To build a hashtag analytics projection, you deploy a new Kafka consumer group that reads from the TweetCreated topic from the beginning (offset 0), extracts hashtags from each tweet, and writes counts to an Elasticsearch index. The write side is not modified, no migration is needed, and the new projection is eventually consistent with the event log. Once the consumer catches up to the current offset, it processes new tweets in real time.',
      },
    ],
    keyInsight:
      "CQRS's power is not just read/write separation — it is the ability to evolve read models independently. At Twitter's scale, the read model for home timeline (Redis sorted sets), search (Earlybird inverted index), and analytics (Heron stream processor) are completely different data structures built from the same event stream. Event Sourcing makes this possible — the event log is the truth, and projections are derived, rebuildable views.",
  },

  {
    id: 'notification-service',
    icon: '🔔',
    name: 'Notification Service',
    color: '#a78bfa',
    scale: 'Multi-channel · email/SMS/push · retry + dead-letter',
    focus: 'Three GoF Patterns Working Together: Factory + Command + Observer',
    problem:
      'Design a notification service that receives domain events from multiple upstream services (order placed, payment failed, friend request), selects the right notification channel (email/SMS/push) per user preference, reliably delivers with retry, and enables dead-letter handling for failed notifications — using three GoF patterns to avoid a tangled if/else mess.',
    functionalReqs: [
      'Receive domain events from upstream services (order, payment, social)',
      'Route each notification to the correct channel (email/SMS/push) per user preference',
      'Retry failed deliveries with exponential backoff',
      'Dead-letter permanently failed notifications for manual review',
      'Support adding new channels without modifying existing orchestration code',
    ],
    nonFunctionalReqs: [
      { label: 'Delivery latency (high-priority)', value: '< 10 seconds (e.g., payment failed)' },
      { label: 'Delivery guarantee', value: 'At-least-once delivery for all notifications' },
      { label: 'Extensibility', value: 'New channel added in < 1 day of development' },
      { label: 'Retry policy', value: 'Exponential backoff: 1s, 2s, 4s, 8s, max 5 retries' },
    ],
    scaleEstimation: [
      { label: 'Notifications/day', value: '10M', note: '~115/sec sustained' },
      { label: 'Channel split', value: '60% email, 30% push, 10% SMS', note: 'SMS is most expensive per unit' },
      { label: 'Retry volume', value: '~6/sec extra', note: '~5% of notifications require at least one retry' },
      { label: 'Dead-letter rate', value: '~0.1%', note: '~10K/day requiring manual review' },
    ],
    highLevelDesign: [
      {
        title: 'Event Listener: Observer Pattern via Kafka',
        description:
          'Upstream services (Order Service, Payment Service, Social Service) publish domain events to dedicated Kafka topics — OrderEvents, PaymentEvents, SocialEvents. The Notification Service subscribes to all three topics as a Kafka consumer group. Each consumed event is mapped to a notification template: OrderPlaced → "Your order #123 has been confirmed", PaymentFailed → "Action required: payment for order #123 failed". The Observer pattern means upstream services have zero knowledge of the Notification Service — they publish events to a topic and any number of subscribers can react independently.',
      },
      {
        title: 'Notifier Factory: Factory Method Pattern',
        description:
          'After determining what to notify, the service reads the user\'s preferred channel from the UserPreferences cache (Redis). The NotifierFactory takes the channel string ("email", "push", "sms") and returns the correct Notifier implementation (EmailNotifier, PushNotifier, SMSNotifier). All three implement the same Notifier interface with a single send(notification) method. The orchestration code never checks channel type explicitly — it calls factory.create(channel).send(notification). Adding a WhatsApp channel means creating WhatsAppNotifier and registering it in the factory: zero changes to orchestration code.',
      },
      {
        title: 'Command Object: Command Pattern for Reliable Dispatch',
        description:
          'Each notification is wrapped in a SendNotificationCommand object containing recipient, channel, content, retryCount, idempotencyKey, and nextRetryAt. The Command is serialised and enqueued in SQS or a Redis queue. A pool of worker processes dequeues commands and calls command.execute(). This serialisability is the key property: the Command survives service restarts, can be inspected in the queue, and carries its own retry state. The queue is just a transport — all delivery logic lives inside the Command.',
      },
      {
        title: 'Retry and Dead-Letter Handling',
        description:
          'On delivery failure, the worker calls command.incrementRetry() which updates retryCount and computes nextRetryAt using exponential backoff (2^retryCount seconds). The Command is re-enqueued with a delay. After 5 failed attempts, the Command is moved to the Dead Letter Queue table with the full failure trace (error message, last attempted timestamp, HTTP status from the provider). An admin dashboard displays DLQ entries grouped by channel and error type. An alerting rule fires when DLQ depth exceeds 500 entries, triggering on-call investigation.',
      },
    ],
    deepDive: [
      {
        title: 'Why Command pattern enables reliable retry without coupling',
        description:
          'Without the Command pattern, retry logic is interleaved with notification logic: the worker catches an exception, checks the retry count, sleeps, and tries again — all in the same code path. This couples retry policy to delivery logic, making both harder to test. With Command, the Command object carries its own state (retryCount, lastError, nextRetryAt) and the retry policy lives in the Command class as a pure function. The queue worker is a dumb executor: dequeue, execute, if failure re-enqueue. Commands are serialisable to JSON, so they survive service restarts without loss. The retry history of any notification is embedded in the Command object itself, making debugging trivial.',
        insight:
          'The Command pattern\'s real power is that it turns an action into a data structure. Once an action is data, it can be queued, retried, inspected, replayed, and audited — none of which is possible when the action is just a function call.',
      },
      {
        title: 'Why Factory Method over if/else channel routing',
        description:
          'The naive implementation uses a switch statement or if/else chain to instantiate the correct notifier: if channel == "email" instantiate EmailNotifier, else if channel == "sms" instantiate SMSNotifier, and so on. This chain grows linearly with the number of channels and must be located and updated whenever a new channel is added. More dangerously, this logic is often duplicated — in the worker, in the retry handler, in the DLQ processor. Factory Method centralises channel instantiation in a single class. The factory returns a Notifier interface — all callers are decoupled from concrete types. Adding a Slack notifier requires creating SlackNotifier and adding one line to the factory registry. No other file changes. This is the Open/Closed Principle made concrete.',
        insight:
          'The Factory pattern does not add features — it removes decision points from code that should not be making decisions. Routing logic belongs in the factory; delivery logic belongs in the notifier. Separating them makes both independently testable.',
      },
      {
        title: 'Why Observer via Kafka eliminates upstream coupling',
        description:
          'Without Observer, the Notification Service would be a direct dependency of Order Service, Payment Service, and Social Service — each would call notification.send() directly. This creates fragile coupling: if the Notification Service is down, order placement fails. If the Notification Service is slow, payment processing is slow. Observer via Kafka inverts this: upstream services publish events to a topic without knowing who consumes them. The Notification Service subscribes without any upstream service being aware. If the Notification Service is down, Kafka buffers the events — delivery is delayed but no upstream service is affected. Adding a new event type (e.g., friend request accepted) requires adding a new consumer mapping in the Notification Service only — zero upstream changes.',
        insight:
          'Observer via a message broker is the only safe way to add cross-cutting concerns (notifications, audit logging, analytics) to an existing microservices system. Direct calls couple availability and latency; event subscriptions decouple them completely.',
      },
    ],
    decisions: [
      {
        question: 'Synchronous notification vs async queue?',
        chosen: 'Async queue (Command + SQS/Redis Queue)',
        reason:
          'Synchronous delivery means a slow email provider (common) blocks the thread handling the upstream event. At 115 notifications/sec, thread exhaustion would cause the Notification Service to drop events. Async queuing decouples event consumption from delivery: the consumer is always fast (it just enqueues a Command), and the worker pool scales independently. Retry logic is also cleaner with a queue — re-enqueue the Command rather than blocking a thread with sleep().',
      },
      {
        question: 'Which push notification provider: FCM vs APNs vs Expo?',
        chosen: 'All three, wrapped by an Adapter for each SDK',
        reason:
          'Android devices require FCM; iOS requires APNs; React Native apps often use Expo\'s abstraction over both. The PushNotifier does not call any provider SDK directly — it calls a PushAdapter interface. FCMAdapter, APNsAdapter, and ExpoAdapter implement the interface. The factory selects the adapter based on the device token prefix. Adding a new push provider (e.g., Huawei HMS for Chinese markets) requires only a new Adapter — no changes to PushNotifier or the factory.',
      },
      {
        question: 'Where to store per-user channel preferences?',
        chosen: 'Redis (fast reads, infrequently updated)',
        reason:
          'User preferences (preferred channel, opt-out flags, quiet hours) are read on every notification dispatch but changed rarely (a few times per user lifetime). Redis provides sub-millisecond reads, and the dataset is small (350M users × ~100 bytes = ~35GB, comfortably fits a Redis cluster). A write-through cache with a 1-hour TTL means preference changes propagate within an hour. A Kafka consumer also listens for PreferenceUpdated events from the User Service and invalidates the Redis key immediately for critical preference changes (e.g., opt-out).',
      },
    ],
    interview: [
      {
        q: 'How do you add a new notification channel (e.g., WhatsApp) without breaking existing channels?',
        a: 'Three steps, touching exactly three files. First, create WhatsAppNotifier implementing the Notifier interface — it handles WhatsApp Business API authentication, message formatting, and error mapping. Second, register it in the NotifierFactory: factory.register("whatsapp", () => new WhatsAppNotifier(config)). Third, add "whatsapp" as a valid value in the user preferences schema. No existing code is modified — the orchestrator, the worker, the retry handler, and the DLQ processor all work with the Notifier interface and are completely unaware of the new channel.',
      },
      {
        q: 'How do you guarantee a critical notification (payment failed) is delivered even if the email provider is down?',
        a: 'Four layers of resilience. First, the notification is enqueued as a Command with priority=HIGH — high-priority commands are dequeued first. Second, the worker retries with exponential backoff across up to 5 attempts over roughly 30 seconds. Third, if the email provider is still down after 5 retries, the Command lands in the DLQ — an alert fires immediately when a payment-failed notification enters the DLQ, waking on-call. Fourth, the user\'s preferences include a fallback channel: if email fails, try SMS. The Command object carries the fallback chain, and the worker tries the next channel on persistent failure of the primary.',
      },
      {
        q: 'Walk me through what happens when a notification fails three times.',
        a: 'Attempt 1: worker dequeues the Command, calls EmailNotifier.send(), receives a 503 from the provider. Worker calls command.incrementRetry() — retryCount becomes 1, nextRetryAt = now + 2s. Command is re-enqueued with a 2-second delay. Attempt 2: worker dequeues after 2s, tries again, gets another 503. retryCount becomes 2, nextRetryAt = now + 4s. Attempt 3: same result, retryCount becomes 3, nextRetryAt = now + 8s. After 5 total failures: command.shouldDeadLetter() returns true. Worker inserts the full Command (including the error trace from each attempt) into the DLQ table and does not re-enqueue. A monitoring query on DLQ depth triggers an alert at depth > 500.',
      },
    ],
    keyInsight:
      'Three GoF patterns eliminate three different types of coupling: Factory removes if/else coupling (you never check the channel type explicitly); Command removes temporal coupling (the notification logic is decoupled from when it runs — it can be retried hours later); Observer removes direct-call coupling (upstream services have no compile-time or runtime dependency on Notification Service). Together they produce a system where adding a new channel, a new event type, or a new retry policy requires touching exactly one file.',
  },

  {
    id: 'legacy-monolith-migration',
    icon: '🌳',
    name: 'Legacy Monolith Migration',
    color: '#10b981',
    scale: '10-year Rails monolith · 500K LOC · migrating to microservices',
    focus: 'Strangler Fig Pattern: Migrating a Monolith to Microservices Without a Big-Bang Rewrite',
    problem:
      'A 10-year-old Rails monolith serves 2M users across payments, user management, and product catalog. The monolith is slow to deploy (45-minute CI), difficult to scale (payments and catalog have opposite scaling needs), and owned by 5 separate teams who constantly block each other. Design a migration strategy that keeps the monolith running throughout, extracts services one at a time, and reaches full decommission in 18 months — with zero downtime.',
    functionalReqs: [
      'Zero downtime throughout the entire migration — no scheduled maintenance windows',
      'Monolith remains fully functional until each domain is explicitly cut over',
      'Each extracted service is independently deployable and scalable',
      'Rollback to monolith is possible within minutes at any stage',
      'Shared database access is managed safely during the transition period',
    ],
    nonFunctionalReqs: [
      { label: 'Downtime', value: 'Zero — p99 latency unchanged during each migration step' },
      { label: 'Extraction timeline', value: 'Each domain extraction < 4 weeks' },
      { label: 'Total migration', value: '18 months to full decommission' },
      { label: 'Customer impact', value: 'No customer-visible behaviour change at any step' },
    ],
    scaleEstimation: [
      { label: 'Codebase size', value: '500K lines of code across 3 domains', note: 'Payments, Users, Catalog' },
      { label: 'Active users', value: '2M', note: 'Traffic cannot be interrupted' },
      { label: 'Teams', value: '5 teams currently sharing one deploy pipeline', note: 'Main driver of migration pain' },
      { label: 'Monolith CI time', value: '45 minutes → target < 5 min per service', note: 'Key success metric' },
      { label: 'Services to extract', value: '3', note: 'Payments first, then Users, then Catalog' },
    ],
    highLevelDesign: [
      {
        title: 'Phase 0: Deploy the Facade (Nginx Reverse Proxy)',
        description:
          'Deploy an Nginx reverse proxy in front of the monolith. All traffic passes through unchanged — Nginx forwards every request to the monolith with zero routing logic. The monolith handles everything exactly as before, and customers see no change. This phase is purely infrastructural: the facade is transparent but establishes the chokepoint that will later route specific URL paths to new services. All traffic routing rules are version-controlled Nginx config, making every routing change auditable and instantly rollback-able.',
      },
      {
        title: 'Phase 1: Extract Payments Service',
        description:
          'Build the new Payments Service from scratch, implementing the same payment domain logic. Introduce dual-write: the monolith continues to write to its payments table, and a new write path also writes to the Payments Service database. A reconciliation job runs continuously comparing both stores and alerting on any discrepancy. After two weeks of clean dual-write data, update the Nginx config to route /api/payments/* to the new service. Monitor for two weeks. Delete the payments code from the monolith. Payments is chosen first because it has the clearest bounded context, the highest team motivation (payments team is most blocked), and the most measurable success criteria.',
      },
      {
        title: 'Phase 2: Extract User Management Service',
        description:
          'The shared user table is the hardest extraction: every domain queries it. The approach is the Anti-Corruption Layer pattern. Build User Service as the new single source of truth. For a 4-week transition window, the monolith reads user data via HTTP calls to the User Service instead of direct DB queries — this is the ACL. User writes go to both the monolith DB (via an event-driven sync) and User Service. After validating data integrity, route /api/users/* through Nginx. Remove monolith user code. The ACL phase is painful but necessary: it forces the monolith to treat user data as external, revealing all hidden dependencies.',
      },
      {
        title: 'Phase 3: Catalog Extraction and Monolith Decommission',
        description:
          'Product Catalog is extracted last — it has the lowest business risk, least inter-domain coupling, and provides an opportunity to choose a document store suited to flexible product schemas. Once all routes are handled by the three new services, the Nginx config is updated to route nothing to the monolith. The monolith is kept in a stopped-but-not-deleted state for a two-week rollback window, with its DB in read-only mode for emergency reference. After two clean weeks, the monolith servers are decommissioned and the DNS entry is removed.',
      },
    ],
    deepDive: [
      {
        title: 'Handling the shared database: the hardest part of Strangler Fig',
        description:
          'The monolith\'s single database is the biggest obstacle in any Strangler Fig migration. At the start, both the monolith and new services need the same data. Three approaches in order of risk: (1) New service reads from the monolith\'s DB via a read replica — low risk, no data movement, but the new service is still coupled to the monolith\'s schema. Use this for the first 2 weeks to unblock the new service while schema is being designed. (2) Dual-write: both services write to both databases; a continuous reconciliation job flags discrepancies within minutes. This is the standard pattern for all three extractions. (3) Database migration: after the new service is validated in production, move the tables to the new service\'s DB and have the monolith read via service API. The golden rule: always migrate the code before migrating the database. Migrating the database first makes it impossible to roll back the code.',
        insight:
          'Database shared state is not a technical problem — it is an ownership problem. The migration forces each domain to declare what data it owns. The painful part is discovering that many pieces of data are claimed by multiple domains simultaneously.',
      },
      {
        title: 'Why big-bang rewrite fails: the historical evidence',
        description:
          'A big-bang rewrite freezes the old system conceptually while the team rewrites it — but the monolith keeps evolving in production. Every new feature shipped to the monolith is a feature that must be re-implemented in the rewrite before launch. The rewrite is always chasing a moving target, and the gap rarely closes. Estimates for rewrites are systematically wrong because the team discovers hidden complexity that is not apparent from reading 500K lines of code. The business loses confidence when the 6-month estimate becomes 18 months. Historical failure rate of big-bang rewrites exceeds 70% — Netscape 6, Borland\'s IDE rewrites, and countless SaaS companies have fallen to this trap. Strangler Fig ships value from week 1: the new Payments Service is production-quality and handling real traffic from its first deployment.',
        insight:
          'A rewrite is not a technical problem — it is a risk management problem. Strangler Fig makes the migration reversible at every step. Rewrites are irreversible until they are complete, which is why they fail: there is no off-ramp.',
      },
      {
        title: 'Tracking migration progress with concrete metrics',
        description:
          'Migration progress must be measured, not estimated. Establish four key metrics from day one. First: percentage of production traffic still handled by the monolith (should decrease monotonically — any increase is a regression). Second: number of active microservices in production (should increase). Third: monolith CI pipeline duration (should decrease as code is deleted — deleting 100K lines of Rails code should reduce test time significantly). Fourth: on-call incidents routed to the monolith team (a leading indicator of reliability improvements in new services). Celebrate deleting monolith code as loudly as shipping new features — deletion is the output metric of a successful extraction.',
        insight:
          'The Strangler Fig migration is complete when the monolith CI time reaches zero because there is no more monolith code. Tracking the metric makes the end state concrete and motivates deletion over accumulation.',
      },
    ],
    decisions: [
      {
        question: 'Which service to extract first?',
        chosen: 'Payments Service',
        reason:
          'Three reasons: (1) Highest pain — payments has the clearest scaling need (PCI compliance isolation, independent scaling), strongest team motivation, and the most obvious bounded context. (2) Clearest boundary — payments data is largely self-contained; it reads user IDs but does not join deeply into the user or catalog tables. (3) Highest organisational value — demonstrating that the Strangler Fig process works on the hardest domain builds confidence for the subsequent extractions. Starting with Catalog (lowest risk) would delay the biggest wins and risk losing momentum.',
      },
      {
        question: 'Nginx vs API Gateway for the routing facade?',
        chosen: 'Nginx',
        reason:
          'An API Gateway (AWS API Gateway, Kong) adds vendor dependency and a new operational layer at the most critical moment — when both the monolith and new services must be running simultaneously. Nginx is simpler, has a 20-year operational track record, and routing rules are plain-text config files checked into git. Rolling back a routing change is a git revert and a config reload — seconds. API Gateways provide features (auth, rate limiting, analytics) that the Notification Service and other microservices will eventually need, but those features should be added after the monolith is decommissioned, not during the migration.',
      },
      {
        question: 'Dual-write vs event sourcing for data synchronisation during migration?',
        chosen: 'Dual-write with reconciliation job',
        reason:
          'Event sourcing during a migration would require retrofitting event publication into the monolith — a significant change to the system under migration. Dual-write is simpler: add a secondary write path to the new service alongside the existing monolith write. The reconciliation job is a simple SQL diff between two databases. Dual-write is also fully reversible: stop writing to the new service, and you are back to the monolith instantly. Event sourcing is a permanent architectural change; dual-write is a temporary migration scaffold that is deleted after cutover.',
      },
    ],
    interview: [
      {
        q: 'Why not just do a big-bang rewrite of the monolith?',
        a: 'The historical failure rate of big-bang rewrites exceeds 70%. The fundamental problem is that the monolith continues to evolve in production while the rewrite is in progress. Every new feature shipped to the monolith must also be implemented in the rewrite before launch — the target is always moving. Estimates are systematically wrong because hidden complexity is only discovered during implementation, not during planning. The business loses confidence when the 6-month estimate becomes 18 months. Strangler Fig avoids all of this by shipping production-quality new services from week one, with zero risk to the monolith. Each step is independently verifiable and rollback-able.',
      },
      {
        q: 'How do you handle the shared database — the hardest part of the migration?',
        a: 'In three ordered phases. Phase 1: the new service reads from the monolith\'s DB via a read replica — zero data movement, immediate unblocking. Phase 2: dual-write — the monolith writes to its own DB and the new service\'s DB simultaneously; a reconciliation job runs continuously comparing both and alerting on any divergence. Phase 3: after the new service is validated in production, the monolith drops its direct DB access and reads via the service API. The golden rule: always migrate the code before migrating the database. Migrating the database first removes the ability to roll back the code.',
      },
      {
        q: 'How do you ensure the monolith stays stable while you are migrating away from it?',
        a: 'The monolith is treated as a black box that must not be modified during extraction. Any changes required for the migration — adding an ACL adapter, adding a dual-write path — are additive: they add new code paths without modifying existing ones. Feature flags control dual-write: disabled by default, enabled per-domain when the new service is ready. The Nginx routing facade routes 0% of traffic to the new service until explicitly updated. Every routing change is a git commit to the Nginx config, peer-reviewed and deployed like application code. This means the migration is version-controlled and auditable at every step.',
      },
      {
        q: 'What is your rollback plan if a migrated service has a critical bug in production?',
        a: 'The rollback is a one-line Nginx config change: update the upstream for /api/payments/* from the new Payments Service back to the monolith, and reload Nginx. This takes under 30 seconds and requires no code deployment. The monolith is kept running and fully functional throughout the migration — it is never in a degraded state. The monolith DB is kept in sync via dual-write until the new service is fully decommissioned, so the monolith always has a consistent data state to fall back to. Rollback is not a contingency plan — it is an architectural guarantee built into the facade design.',
      },
    ],
    keyInsight:
      "The Strangler Fig's secret is that it makes the migration reversible at every step. The facade means you can always route traffic back to the monolith in seconds. Dual-write means both systems stay in sync. The migration is never a bet — it is a series of small, measured steps where each step is independently verifiable and rollback-able. This is precisely why it succeeds where big-bang rewrites fail.",
  },
];
