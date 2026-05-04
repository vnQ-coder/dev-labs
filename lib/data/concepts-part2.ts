import { Concept } from '../types';

export const CONCEPTS_PART2: Concept[] = [
  // ─────────────────────────────────────────────────────────────────
  // 1. DATABASE SHARDING
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'sharding',
    cat: 'data',
    color: '#a78bfa',
    icon: '🗃️',
    title: 'Database Sharding',
    tag: 'Split your data across servers before your DB splits under load',
    overview:
      'Database sharding horizontally partitions rows across multiple independent database servers (shards), so each machine owns a predictable slice of the total dataset. Unlike replication — which copies the same data everywhere — sharding divides it, letting write throughput and storage capacity scale linearly with shard count.',
    components: [
      {
        name: 'Shard Key',
        icon: '🔑',
        role: 'The column (or hash) that determines which shard owns a given row.',
        detail:
          'A good shard key distributes writes evenly and keeps related rows co-located so most queries touch only one shard. Bad choices — low-cardinality fields like country or status — create "hot shards" that negate all benefits of sharding.',
      },
      {
        name: 'Shard Router',
        icon: '🗺️',
        role: 'Middleware layer that maps every query to the correct shard(s).',
        detail:
          'The router accepts a query, extracts the shard key, computes the target shard via the routing function (hash, range lookup, or directory), and forwards the query. For scatter-gather queries it fans out to all shards and merges results — an expensive operation to be avoided by design.',
      },
      {
        name: 'Physical Shard',
        icon: '🖥️',
        role: 'An independent database node that owns and serves its partition of the data.',
        detail:
          'Each shard is a fully autonomous database instance — it can be replicated for HA, backed up independently, and scaled vertically without touching other shards. Shard count is typically fixed at design time; changing it later requires a full resharding migration.',
      },
      {
        name: 'Rebalancer',
        icon: '⚖️',
        role: 'Background process that migrates data between shards when the cluster grows or shrinks.',
        detail:
          'When a new shard is added, the rebalancer must move roughly 1/N of data from existing shards to the new one. With consistent hashing, only the neighbors on the ring are affected. Without it, you must rehash every row — a multi-hour operation for TB-scale tables.',
      },
      {
        name: 'Global Index',
        icon: '📇',
        role: 'A cross-shard index that maps non-shard-key lookups to the correct shard.',
        detail:
          'If users are sharded by user_id but you need to look up by email, a global index stores the mapping email → shard_id + user_id. This index is itself a bottleneck; many teams choose to accept a scatter-gather query for rare non-key lookups instead.',
      },
    ],
    howItWorks:
      'When a write arrives, the shard router extracts the shard key from the row, hashes it (or looks it up in a range map), and routes the INSERT to the target shard. Reads with the shard key in the WHERE clause are equally fast — single-shard, sub-millisecond. Reads without the shard key require a scatter-gather: the router fans out to every shard in parallel, each returns partial results, and the router merges, sorts, and paginates. Over time, as user counts grow, the rebalancer migrates data from overloaded shards to new ones, ideally using consistent hashing to minimize data movement — typically moving only 1/(N+1) of data when adding the (N+1)th shard.',
    decision: {
      choose: [
        'Single database node is saturating write IOPS (>10k writes/sec on typical PostgreSQL) and vertical scaling is no longer cost-effective.',
        'Table has grown beyond 1–2 TB and query planner performance is degrading despite indexing.',
        'Write patterns are partitionable: each write clearly belongs to a user, tenant, or guild — queries rarely need to cross that boundary.',
        'You have a team of ≥5 engineers who can own the operational complexity (migration scripts, resharding runbooks, monitoring per-shard lag).',
        'Multi-tenant SaaS where tenants can be cleanly isolated — shard by tenant_id for both performance and data isolation guarantees.',
      ],
      avoid: [
        'Your tables are under 100 GB — proper indexing, connection pooling, and read replicas will get you 100x further for 10% of the operational cost.',
        'Your queries are inherently cross-shard (e.g., global leaderboards, cross-user analytics) — sharding makes these catastrophically expensive.',
        'You cannot identify a high-cardinality, evenly-distributed shard key. Sharding on a bad key creates hot shards that are WORSE than no sharding.',
        'You need ACID transactions across multiple rows that belong to different shards — cross-shard transactions require 2-phase commit, which is slow and complex.',
        'Your team is fewer than 5 engineers — the operational burden of resharding, monitoring, and maintaining N separate DB clusters is enormous.',
      ],
      vs: [
        { name: 'Replication', when: 'You need read scaling or HA, not write scaling. Replication copies the full dataset; sharding divides it. Use both together.' },
        { name: 'Partitioning (table)', when: 'Data stays on ONE server but is split into partition files by range or list. Simpler than sharding, good up to ~500 GB before hardware limits hit.' },
        { name: 'NewSQL (CockroachDB, Spanner)', when: 'You need automatic sharding + ACID transactions. Trade: higher per-query latency (Paxos overhead), higher licensing cost, less ecosystem maturity.' },
      ],
    },
    failures: [
      {
        name: 'Hot Shard',
        cause: 'Shard key has low cardinality or is temporally skewed — e.g., sharding social posts by created_at means the newest shard gets all writes.',
        symptom: 'One shard at 100% CPU and IOPS saturation; others idle at 5%. P99 write latency spikes for recent data while historical queries are fast.',
        fix: 'Re-key to hash(user_id) or a composite key. Short-term: add read replicas behind the hot shard and route reads there. Add a "salt" suffix to the hot key (user_id + random 0-9) to spread a single hot user across 10 virtual shards, then union at read time.',
        severity: 'critical',
      },
      {
        name: 'Cross-Shard Query Performance Collapse',
        cause: 'Application issues queries without the shard key in the WHERE clause, forcing scatter-gather across all N shards with result merging in the router.',
        symptom: 'Query latency proportional to shard count. Seemingly simple queries (SELECT by email) take 10x longer than expected. Router CPU spikes during list/search operations.',
        fix: 'Maintain a Global Secondary Index table (email → user_id mapping) to convert non-key lookups into key lookups before routing. For analytics, replicate all shards into a single read-replica data warehouse (BigQuery, Redshift) and run heavy queries there — never on the shards.',
        severity: 'high',
      },
      {
        name: 'Rebalancing Downtime',
        cause: 'Naive resharding locks the source shard during data migration to maintain consistency, causing writes to queue up for minutes or hours.',
        symptom: 'Elevated write latency or hard write errors during planned shard addition. Queues back up. SLA breached on a maintenance window.',
        fix: 'Use online resharding: copy data to new shard while source shard continues accepting writes, then apply a change-data-capture (CDC) replay of the delta, then do a brief atomic cutover (typically <1s). Tools: Vitess online DDL, AWS DMS, or custom CDC with Debezium.',
        severity: 'high',
      },
      {
        name: 'Shard Key Regret',
        cause: 'The shard key chosen at launch (e.g., geographic region) no longer fits actual access patterns after the product grows and user behavior shifts.',
        symptom: 'Teams want features that require cross-shard queries for the most common operations. New product direction breaks the partitioning assumption.',
        fix: 'There is no quick fix — this is a full resharding migration. Mitigate with a dual-write migration: write to old and new key simultaneously for a transition window, backfill asynchronously using CDC, then switch reads to new key, then retire old writes. This takes weeks; design shard keys with your 3-year roadmap in mind.',
        severity: 'critical',
      },
    ],
    a: {
      v: '🗃️🗃️🗃️🗃️',
      t: 'The A–Z Filing Room',
      tx: "Your office starts with one filing cabinet — A through Z. It handles 100 client folders fine. Five years later you have 50,000 clients. The cabinet is overflowing, and it takes 20 minutes to file a new folder because you have to reorganize every time.\n\nThe solution: rent a larger room and buy four cabinets. Cabinet 1: A–F. Cabinet 2: G–M. Cabinet 3: N–S. Cabinet 4: T–Z. Now each cabinet holds a manageable number of folders, and finding anything is still O(1) — you go directly to the right cabinet.\n\nBut you also hire a FILING CLERK who sits at the door. Every time someone walks in with a folder, the clerk checks the surname and directs them to the right cabinet. That clerk is your shard router. The four cabinets are your shards.",
      s: 'Choosing what letter range each cabinet holds is your shard key strategy. If everyone has surnames starting with S (like a Korean company roster), Cabinet 3 overflows while others sit empty. This is the hot shard problem. Hash the name instead of using raw letters, and the distribution becomes nearly uniform — regardless of the actual surname distribution.',
    },
    te: {
      def: 'Sharding horizontally partitions rows across N independent database instances. A routing function maps each row\'s shard key to a specific shard. No shard is aware of the others; the router provides the global view.',
      types: [
        { n: 'Range Sharding', d: 'user_id 1–1M → shard_1, 1M–2M → shard_2. Simple router logic. Risk: sequential inserts all hit the latest shard (time-series hotspot).' },
        { n: 'Hash Sharding', d: 'shard = fnv32(user_id) % N. Near-uniform distribution. Adding a shard requires rehashing all rows — mitigated by consistent hashing.' },
        { n: 'Directory (Lookup) Sharding', d: 'A lookup table maps key → shard_id. Maximum flexibility, re-shard any key without formula changes. Lookup table itself can become a bottleneck — cache aggressively.' },
        { n: 'Geo Sharding', d: 'EU users → EU shard, US users → US shard. Satisfies data residency regulations (GDPR). Creates uneven shards if user geography is skewed.' },
        { n: 'Consistent Hashing', d: 'Keys and shards placed on a virtual ring. Adding a shard moves only 1/(N+1) of keys — drastically less data movement than modular hashing. Used by DynamoDB, Cassandra, Redis Cluster.' },
      ],
      when: 'Write throughput exceeds a single node\'s capacity. Dataset exceeds practical single-node storage (>2–5 TB for most workloads). Must maintain low write latency under sustained load beyond vertical scaling limits.',
      trade: 'Sharding wins on write throughput and storage capacity. It loses on cross-shard queries, cross-shard transactions, operational complexity, and schema migration cost (must run on all shards). Carefully model your access patterns before committing.',
      code: `// Hash sharding router — TypeScript
const SHARD_COUNT = 8;
const shards = Array.from({ length: SHARD_COUNT }, (_, i) =>
  createDbPool(\`shard-\${i}.db.internal:5432\`)
);

function getShardIndex(userId: string): number {
  // FNV-1a 32-bit — fast, good distribution
  let hash = 2166136261;
  for (const ch of userId) {
    hash ^= ch.charCodeAt(0);
    hash = (hash * 16777619) >>> 0; // keep 32-bit
  }
  return hash % SHARD_COUNT;
}

async function getUser(userId: string) {
  const idx = getShardIndex(userId);
  return shards[idx].query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
}

// Cross-shard scatter-gather (expensive — design to avoid)
async function searchUsersByEmail(email: string) {
  const results = await Promise.all(
    shards.map(s =>
      s.query('SELECT * FROM users WHERE email = $1', [email])
    )
  );
  return results.flat(); // merge from all shards
}`,
      rw: {
        ex: [
          'Instagram — user_id sharding across PostgreSQL shards; each shard replica-set for HA',
          'Discord — guild_id sharding so all messages in one server stay on one shard',
          'Notion — workspace_id sharding for tenant isolation and data locality',
        ],
        cs: 'Discord shards their message database by guild_id (server ID). Every message, reaction, and channel in a Discord server lives on the same shard. This means that 99% of queries — "get messages in channel X" — touch exactly one shard. At 4 billion messages per day, this single design decision keeps per-shard write rates manageable without cross-shard fan-out for the hot path.',
      },
    },
    interview: {
      q: 'Walk me through how you would shard a social media database with 500M users.',
      a: 'I would shard by <strong>user_id using consistent hashing</strong> across 16 initial shards — large enough to handle 5 years of projected growth, small enough that each shard is still a manageable ~30M users. Each shard is a PostgreSQL primary with two read replicas for HA. The shard router is a lightweight service (or library) that implements the hash ring. For non-key lookups like "find user by email" I maintain a global index table (email → user_id) in a separate small database or in a Redis hash — email lookups convert to user_id first, then route to the correct shard. Cross-shard analytics queries (DAU, global trends) go to a separate data warehouse populated by CDC replication — never to the shards directly. Finally, I would design migrations to run shard-by-shard in rolling fashion, since deploying DDL across all shards simultaneously is risky.',
      fu: [
        'What is consistent hashing and why does it matter when adding shards?',
        'How do you handle cross-shard transactions (e.g., transferring money between two users)?',
        'What is a global secondary index and when do you need one?',
        'How do you migrate to a new shard key without downtime?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. MESSAGE QUEUES (High-level primer)
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'messagequeue',
    cat: 'async',
    color: '#fbbf24',
    icon: '📨',
    title: 'Message Queues',
    tag: 'The async glue between every service in your system',
    overview:
      'A message queue is a durable, ordered buffer that decouples the service that produces a message from the service that consumes it — letting each run, scale, and fail independently. This is the foundational concept; specific technologies like Kafka, RabbitMQ, and BullMQ each make different tradeoffs on durability, ordering, throughput, and delivery semantics — and are covered as dedicated deep-dives.',
    components: [
      {
        name: 'Producer',
        icon: '📤',
        role: 'The service or process that creates and publishes messages to the broker.',
        detail:
          'Producers are blissfully unaware of consumers. They fire a message and move on — they do not wait for the consumer to process it. This is what makes the system asynchronous and why the producer can spike in throughput without blocking on downstream processing.',
      },
      {
        name: 'Message Broker',
        icon: '🏭',
        role: 'The central server (or cluster) that receives, stores, and routes messages.',
        detail:
          'The broker is the backbone of reliability: it persists messages to disk so they survive crashes, enforces ordering guarantees within a queue or partition, and manages consumer group membership. Kafka, RabbitMQ, and BullMQ are all implementations of this role with very different internal designs.',
      },
      {
        name: 'Queue / Topic',
        icon: '📋',
        role: 'The named channel through which a category of messages flows.',
        detail:
          'In point-to-point systems (RabbitMQ queues, BullMQ), a queue delivers each message to exactly one consumer. In pub/sub systems (Kafka topics, Google Pub/Sub), a topic fans a message out to every subscriber group independently — each group gets its own copy of every message.',
      },
      {
        name: 'Consumer',
        icon: '📥',
        role: 'The service that pulls (or receives) messages from the broker and processes them.',
        detail:
          'Consumers track their own position (offset in Kafka, delivery tag in RabbitMQ). Multiple consumers in a consumer group share the partition load for horizontal scaling. A consumer must explicitly acknowledge successful processing — without ACK the broker will redeliver the message.',
      },
      {
        name: 'Acknowledgment (ACK)',
        icon: '✅',
        role: 'The signal a consumer sends to the broker confirming that a message was successfully processed.',
        detail:
          'Until the broker receives an ACK, it treats the message as "in-flight" and will redeliver it after a timeout if the consumer crashes. This is the core of at-least-once delivery: ACK on success, NACK (or let it timeout) on failure so the broker retries. Consumers must be idempotent — they may process the same message more than once.',
      },
      {
        name: 'Dead Letter Queue (DLQ)',
        icon: '☠️',
        role: 'A separate queue where messages land after exhausting all retry attempts.',
        detail:
          'A "poison message" that always crashes the consumer would loop forever without a DLQ. After N retries (typically 3–5), the broker moves the message to the DLQ. On-call teams inspect DLQ messages to identify bugs or unexpected data formats. DLQs prevent one bad message from blocking an entire queue.',
      },
    ],
    howItWorks:
      'The producer publishes a message (a JSON payload, a binary blob) to a named queue or topic on the broker. The broker durably persists it to disk and assigns it a position (offset). One or more consumers poll the broker for new messages; the broker delivers the message and marks it as "in-flight." The consumer processes it — calls an API, writes to a database, sends an email — then sends an ACK. The broker marks the message as consumed and moves the consumer\'s offset forward. If the consumer crashes before ACKing, the broker redelivers to another consumer after the visibility timeout expires. Messages that fail processing repeatedly get moved to the DLQ after N retries, preventing a single bad message from blocking the queue forever.',
    decision: {
      choose: [
        'You need to decouple two services so that a spike in one does not cascade to the other — e.g., order creation should not block if the email service is slow.',
        'Work items need retry-on-failure with backoff — webhooks, payment callbacks, external API calls that can transiently fail.',
        'One event should trigger multiple independent downstream systems (fan-out) — an order created event goes to email, inventory, analytics, and fraud detection simultaneously.',
        'You need to absorb traffic bursts: your API receives 10k orders/min during a flash sale but the fulfillment system processes at 1k/min — the queue absorbs the difference.',
        'Tasks are long-running (>5s) and should not block an HTTP request — image processing, PDF generation, ML inference.',
      ],
      avoid: [
        'You need an immediate response in the same HTTP request — queues are async. Use synchronous gRPC or HTTP for request/reply patterns.',
        'You need cross-message transactions — queues deliver at-least-once, not ACID. If you need "debit account AND send email atomically," use a saga pattern or transactional outbox instead.',
        'Your team is 2–3 engineers and the use case is simple — adding a broker is operational overhead. A simple database-backed job queue (Postgres + pg-boss, or BullMQ with Redis) may be all you need.',
        'Message ordering is critical across multiple producers — most queues only guarantee ordering per partition or per queue. Cross-partition ordering requires careful design.',
      ],
      vs: [
        { name: 'Kafka', when: 'High-throughput event streaming (millions/sec), replay needed, multiple independent consumer groups, event log is the source of truth. See the Kafka deep-dive.' },
        { name: 'RabbitMQ', when: 'Complex routing (topic exchanges, header routing), existing AMQP integration, lower throughput (<50k/sec), mature queue-based task distribution. See the RabbitMQ deep-dive.' },
        { name: 'BullMQ', when: 'Node.js monolith or small team, Redis already in stack, need job queues with priorities, delays, and rate limiting without running a separate broker cluster. See the BullMQ deep-dive.' },
      ],
    },
    failures: [
      {
        name: 'Unacked Message Buildup',
        cause: 'Consumers are processing messages slower than producers are generating them, and messages are not ACKed promptly — either due to slow processing, consumer crashes, or insufficient consumer parallelism.',
        symptom: 'Broker disk fills up. Consumer lag metric grows unboundedly. Delivery latency increases from milliseconds to minutes. Eventually broker runs out of disk and starts dropping messages or applying backpressure.',
        fix: 'Set a max prefetch / in-flight limit per consumer so one slow consumer does not hoard all messages. Scale consumers horizontally (add more consumer instances to the group). Set message TTL so stale messages expire instead of accumulating. Add disk usage alerting at 60% and a dead-letter-after-N-retries policy.',
        severity: 'critical',
      },
      {
        name: 'Consumer Group Rebalance Storms',
        cause: 'Kafka triggers a group rebalance whenever a consumer joins or leaves. If consumers are slow to process and session timeout is short, they time out and trigger rebalances, causing all consumers to stop processing during the rebalance — which triggers more timeouts.',
        symptom: 'Consumer lag spikes every few minutes. Logs show constant "Rebalancing" events. Processing throughput drops to zero during rebalances, then spikes, causing pressure on downstream systems.',
        fix: 'Increase session.timeout.ms and heartbeat.interval.ms. Enable incremental cooperative rebalancing (Kafka 2.4+) so only affected partitions pause instead of all consumers stopping. Investigate WHY consumers are slow — long processing blocks the heartbeat thread; offload heavy work to a separate thread pool.',
        severity: 'high',
      },
      {
        name: 'Broker Disk Full',
        cause: 'Log retention is set too high, consumers are lagging, or message payloads are unexpectedly large. Broker disk fills up, causing writes to fail.',
        symptom: 'Producers get write errors or block. Broker stops accepting new messages. Entire async pipeline halts. Data loss risk if messages not yet consumed.',
        fix: 'Set retention.bytes and retention.ms limits on topics. Monitor disk usage with alerts at 70% and 85%. Use compacted topics for state rather than raw event logs where appropriate. For critical topics, use remote storage tiering (Kafka with S3-backed tiered storage) to offload cold segments.',
        severity: 'critical',
      },
      {
        name: 'Poison Messages',
        cause: 'A message payload is malformed, references a deleted record, or causes an unhandled exception in the consumer — causing the consumer to crash on every attempt.',
        symptom: 'Consumer keeps restarting. The message is redelivered repeatedly. Processing of all subsequent messages in the queue or partition is blocked. Dead letter queue eventually receives the message after max retries, but only after significant delay.',
        fix: 'Always wrap consumer logic in try/catch. On failure, NACKing with requeue=false (or incrementing a retry counter in the message header) routes the message to the DLQ after N attempts. Add monitoring on DLQ depth — a non-empty DLQ should page the on-call team. Design consumer code to be defensive: validate schema before processing, handle missing fields gracefully.',
        severity: 'high',
      },
    ],
    a: {
      v: '🎫→📋→👨‍🍳',
      t: 'The Restaurant Ticket Rail',
      tx: "In a busy restaurant, waiters don't walk into the kitchen and shout orders directly at the chef. That would be chaos — ten waiters yelling at three chefs, no one remembering what was ordered first.\n\nInstead, the waiter writes a ticket and clips it to a rail above the pass. The chefs grab tickets in order when they are ready. The kitchen processes at its own pace. During the lunch rush, tickets stack up — but the waiter can keep taking orders without waiting for each one to be cooked.\n\nThe ticket rail is the message queue. Waiters are producers. The kitchen is the consumer. Tickets are messages. If a chef drops a ticket (consumer crashes), the head chef can pick it up (redelivery). If a ticket is unreadable (poison message), it goes in a drawer for the manager to inspect later (dead letter queue).",
      s: 'The crucial insight: producers and consumers are decoupled in time. The producer does not wait for the consumer to finish. This is what absorbs traffic spikes, allows independent scaling, and isolates failures — a slow kitchen does not stop the waiter from taking more orders.',
    },
    te: {
      def: 'A message queue is a durable, ordered buffer between a producer and one or more consumers. The broker persists messages until they are consumed and acknowledged, enabling async processing, retry logic, and fan-out delivery.',
      types: [
        { n: 'Point-to-Point Queue', d: 'Each message delivered to exactly one consumer. Work is distributed across consumer group. RabbitMQ queues, BullMQ, SQS.' },
        { n: 'Publish / Subscribe (Topic)', d: 'Each message delivered to ALL subscriber groups independently. Kafka topics, Google Pub/Sub, SNS. Use for fan-out.' },
        { n: 'At-Least-Once Delivery', d: 'Message guaranteed to arrive, but may arrive more than once on retry. Consumer must be idempotent. Default in most systems.' },
        { n: 'At-Most-Once Delivery', d: 'Message sent once, not retried on failure. May be lost. Acceptable for metrics/telemetry where losing a data point is fine.' },
        { n: 'Exactly-Once Delivery', d: 'Complex to guarantee end-to-end. Requires idempotent producers + transactional consumers. Kafka transactions, not free.' },
      ],
      when: 'Async side effects (email, notifications, webhooks). Absorbing traffic bursts. Fan-out to multiple downstream systems. Long-running background jobs. Any work that should survive a service restart.',
      trade: 'Queues add latency (async by definition), require idempotent consumers, make debugging harder (async traces), and introduce a new operational component. The payoff: decoupling, resilience, and independent scaling that is impossible with synchronous calls.',
      code: `// Producer — Order service publishes event (framework-agnostic)
async function placeOrder(order: Order): Promise<void> {
  // 1. Persist to DB first (transactional outbox pattern)
  await db.transaction(async trx => {
    await trx('orders').insert(order);
    await trx('outbox').insert({
      topic: 'orders.created',
      payload: JSON.stringify(order),
      created_at: new Date(),
    });
  });
  // Outbox relay publishes to broker asynchronously
}

// Consumer — Email service (idempotent)
broker.consume('orders.created', async (msg) => {
  const order = JSON.parse(msg.payload);

  // Idempotency guard — deduplicate on order ID
  const alreadySent = await redis.get(\`email:sent:\${order.id}\`);
  if (alreadySent) {
    msg.ack(); // already processed, discard duplicate
    return;
  }

  await emailService.sendConfirmation(order.userId, order.id);
  await redis.setex(\`email:sent:\${order.id}\`, 86400, '1');
  msg.ack(); // tell broker: done, advance offset
});`,
      rw: {
        ex: [
          'Stripe — async webhook delivery queue with exponential backoff retry over 72 hours',
          'Airbnb — booking pipeline: payment, host notification, calendar block, analytics all from one booking.created event',
          'Amazon — order processing: each order fans out to warehouse, payment, shipping, recommendations update',
        ],
        cs: "Stripe's webhook system is a message queue at its core. When a payment succeeds, Stripe enqueues a webhook delivery job for every customer endpoint. Each job retries with exponential backoff for up to 72 hours before giving up. The queue absorbs massive spikes (end-of-month billing), ensures delivery even when customer servers are temporarily down, and decouples Stripe's payment processing from customer integrations completely.",
      },
    },
    interview: {
      q: 'Why would you use a message queue instead of a direct HTTP call between services?',
      a: 'Three core reasons. First, <strong>decoupling</strong>: the producer does not need to know if the consumer is up, slow, or even exists yet — the queue absorbs the difference. Second, <strong>resilience</strong>: if the consumer crashes, messages persist in the broker and are redelivered — a direct HTTP call would lose the work. Third, <strong>spike absorption</strong>: if the producer sends 10,000 events/minute but the consumer handles 1,000/minute, the queue buffers the difference; with direct calls you would either overload the consumer or need synchronous backpressure. The tradeoff: you accept eventual consistency (the consumer processes later, not immediately) and must design consumers to be idempotent to handle redelivery. For anything that needs an immediate response in the same request, queues are wrong — use synchronous gRPC or HTTP instead.',
      fu: [
        'What is idempotency and why is it required for queue consumers?',
        'What is the difference between Kafka and RabbitMQ?',
        'What is a dead letter queue and when do you need one?',
        'How do you preserve message ordering in a distributed queue?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. RATE LIMITING
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ratelimit',
    cat: 'reliability',
    color: '#f87171',
    icon: '🛡️',
    title: 'Rate Limiting',
    tag: 'Your API\'s bouncer — capacity protection with a counter',
    overview:
      'Rate limiting enforces a maximum number of requests a client can make in a time window, protecting backend services from overload and preventing individual clients from monopolizing shared infrastructure. It sits at the boundary between the outside world and your services — typically at the API gateway or CDN edge — so enforcement happens before expensive work begins.',
    components: [
      {
        name: 'Request Counter',
        icon: '🔢',
        role: 'Tracks how many requests a given client has made in the current window.',
        detail:
          'The counter is keyed by a client identifier — API key, user ID, IP address, or a combination. In distributed systems this counter must live in shared storage (Redis) so all gateway instances agree on the count; a local in-memory counter would undercount by a factor of N (number of gateway nodes).',
      },
      {
        name: 'Time Window',
        icon: '⏱️',
        role: 'Defines the period over which the request count is measured.',
        detail:
          'Fixed windows (reset at :00 each minute) are simple but allow a 2x burst at the boundary — 100 requests at 11:59 and 100 more at 12:00. Sliding windows measure requests in the last T seconds from NOW, eliminating the boundary burst at the cost of more storage (a sorted set vs a single counter).',
      },
      {
        name: 'Token Bucket',
        icon: '🪣',
        role: 'Allows burst traffic up to bucket capacity while maintaining a steady average refill rate.',
        detail:
          'The bucket holds up to B tokens. Each request consumes 1 token. Tokens refill at rate R per second. A client can burst up to B requests instantly, then is limited to R/sec thereafter. This is what makes APIs feel responsive — occasional bursts are allowed — while average rate is controlled.',
      },
      {
        name: 'Rate Limit Store (Redis)',
        icon: '🗄️',
        role: 'Shared, low-latency storage that holds counters or token buckets for all clients.',
        detail:
          'Redis sorted sets (ZADD + ZREMRANGEBYSCORE + ZCARD) implement sliding window counters atomically via Lua scripts. Redis strings with INCR + EXPIRE implement fixed window counters. Lua scripts are critical: they guarantee read-increment-write is atomic, preventing race conditions in a distributed environment.',
      },
      {
        name: 'Response Headers',
        icon: '📬',
        role: 'Communicates current rate limit status to clients so they can self-throttle.',
        detail:
          'Standard headers: X-RateLimit-Limit (max allowed), X-RateLimit-Remaining (remaining in window), X-RateLimit-Reset (Unix timestamp when window resets), Retry-After (seconds to wait on 429). Well-behaved SDKs read these headers and back off automatically, reducing unnecessary retries.',
      },
      {
        name: 'DDoS Shield',
        icon: '🛡️',
        role: 'IP-level and connection-level rate limiting at the network edge, before application logic runs.',
        detail:
          'Application-level rate limiting (Redis counters) is not sufficient for volumetric DDoS attacks — at 1M req/sec even the counter check is expensive. CDN and cloud WAF rate limiting (Cloudflare Rate Limiting, AWS Shield) operates at the network edge, blocking IPs before traffic hits your origin, handling millions of rps without touching your application stack.',
      },
    ],
    howItWorks:
      'A request arrives at the API gateway with an API key or session token. The gateway extracts the rate limit key (e.g., "api_key:sk_live_abc123"), runs a Lua script against Redis that atomically increments the counter for the current window, checks the result against the configured limit, and either allows the request through or immediately returns HTTP 429 with Retry-After headers. For token bucket implementations, the script calculates how many tokens have refilled since the last request (elapsed_time × refill_rate), adds them to the stored count capped at bucket size, deducts 1 for this request, and returns whether tokens remain. The whole Redis round-trip adds ~0.5–2ms to request latency — acceptable at the gateway layer.',
    decision: {
      choose: [
        'You have a public API consumed by third-party developers — without rate limiting, a single buggy client can take down your service for everyone.',
        'Endpoints have significantly different costs: /search (expensive) should have lower limits than /ping (trivial). Apply per-endpoint limits.',
        'You sell tiered API access (free: 100 req/min, pro: 1000 req/min, enterprise: custom) — rate limits enforce product tiers.',
        'Your authentication endpoints (login, password reset) need attempt limiting to prevent brute-force credential attacks.',
        'You have downstream dependencies with their own rate limits (Stripe: 100/sec, Twilio: 100 SMS/sec) — rate-limit yourself before you hit theirs.',
      ],
      avoid: [
        'Rate limiting alone is not a DDoS mitigation strategy — volumetric attacks at the network layer need CDN/WAF protection, not Redis counters.',
        'Do not apply blanket rate limits without monitoring what normal traffic looks like first — you will block legitimate users during their peak usage.',
        'Do not use per-IP rate limiting as your primary mechanism for authenticated APIs — IPs are shared (NAT, corporate proxies) and will accidentally block entire offices.',
        'Redis as a single rate limit store is fine for <100k req/sec — beyond that, consider distributed rate limiting with local token bucket approximation first, Redis for global sync.',
      ],
      vs: [
        { name: 'Fixed Window', when: 'Simplest implementation, predictable resets, acceptable if boundary bursts are not a concern. One Redis INCR + EXPIRE per request.' },
        { name: 'Sliding Window', when: 'Smooth enforcement with no boundary burst. Requires Redis sorted set per client. Higher memory use but more accurate.' },
        { name: 'Token Bucket', when: 'Best for APIs where clients legitimately burst occasionally. Allows catching up after a quiet period. Stripe, OpenAI use this model.' },
        { name: 'Leaky Bucket', when: 'You want to enforce a perfectly smooth output rate (e.g., feeding a downstream system at exactly 100 rps). Queues excess requests, rejects overflow.' },
      ],
    },
    failures: [
      {
        name: 'Thundering Herd at Window Reset',
        cause: 'Fixed window resets at :00 each minute. All rate-limited clients simultaneously retry at that exact moment, creating a synchronized spike 2x the intended limit.',
        symptom: 'Traffic graph shows sawtooth pattern with peaks at every minute boundary. Database or downstream services receive burst requests exactly at :00, :01, :02 of each minute. Occasional downstream timeouts at window boundaries.',
        fix: 'Switch to sliding window (eliminates the reset cliff) or token bucket (burst absorbs the retry storm). If you must use fixed windows, add random jitter to Retry-After headers (e.g., resetTime + random(0, 10s)) so clients do not all retry simultaneously.',
        severity: 'high',
      },
      {
        name: 'Distributed Counter Drift',
        cause: 'Multiple API gateway instances each maintain local in-memory counters without synchronizing to shared storage. Client is allowed N × gateway_count requests instead of N.',
        symptom: 'Rate limit appears to not be working — clients can exceed the configured limit. Difficult to reproduce in testing (single-instance test environment). The problem scales with gateway fleet size.',
        fix: 'All rate limit counters must be in shared Redis, never local memory. Use Lua scripts for atomic read-increment-write. If Redis latency is a concern, use a local token bucket as the first check (fast path) that syncs to Redis periodically — accept ±5% accuracy for a 10x latency improvement.',
        severity: 'critical',
      },
      {
        name: 'Redis Single Point of Failure',
        cause: 'API gateway cannot reach Redis (network partition, Redis OOM, Redis restart). All rate limit checks fail. Gateway must decide: fail open (allow all traffic) or fail closed (block all traffic).',
        symptom: 'Redis goes down → either your entire API becomes unprotected (fail open) or your entire API returns 429 to everyone (fail closed). Neither is acceptable in production.',
        fix: 'Deploy Redis in cluster mode (Redis Cluster or Redis Sentinel) for HA. Implement fail-open with circuit breaker: if Redis is unreachable for >500ms, allow requests through but log prominently. Short-term unprotected window is better than a full API outage. Consider Resilience4j or a circuit breaker library wrapping the Redis call.',
        severity: 'critical',
      },
      {
        name: 'Legitimate Traffic Blocked',
        cause: 'Rate limit is set too aggressively, or a legitimate user has an unusual usage pattern (end-of-month batch job, data export) that hits the per-minute limit but is perfectly valid business usage.',
        symptom: 'Customer support tickets from angry paying customers. Churn. Developers ranting on Twitter. The rate limit is technically working but the threshold is wrong.',
        fix: 'Instrument rate limit rejections per customer segment before setting limits. Offer burst capacity allowances on premium tiers. Provide Retry-After headers so automated clients back off gracefully. Build a self-service portal where enterprise customers can request limit increases. Proactively notify customers approaching 80% of their limit rather than surprising them with 429s.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🚦',
      t: 'The Nightclub Bouncer with a Clicker',
      tx: "A popular nightclub has a legal capacity of 200 people. The bouncer stands at the door with a clicker. Click in, click out. When the clicker hits 200, the next person hears: \"Sorry, at capacity. Come back in 30 minutes.\"\n\nThis is not personal — it is protecting the experience for everyone already inside. A venue at 300% capacity is miserable for all 300 people.\n\nYour API gateway is the bouncer. The clicker is the rate limit counter in Redis. Each API key gets its own counter. The 101st request in a minute gets HTTP 429 — not permanently blocked, just throttled. The Retry-After header tells the client exactly when to try again.\n\nThe bouncer does not care why you want to come in 101 times — a buggy retry loop and a DDoS attack look identical.",
      s: "Rate limits protect everyone, not just your servers. Without them, one misbehaving client degrades the experience for every other client on the platform. The limit is a contract: \"We guarantee this capacity; staying within it guarantees consistent performance.\"",
    },
    te: {
      def: 'Rate limiting enforces a maximum request rate per client (identified by API key, user ID, or IP) in a time window. Requests exceeding the limit receive HTTP 429 Too Many Requests with a Retry-After header.',
      types: [
        { n: 'Fixed Window Counter', d: 'INCR key; EXPIRE key 60. Simple. Allows 2x burst at window boundary. One Redis op per request.' },
        { n: 'Sliding Window Log', d: 'ZADD with timestamp; ZREMRANGEBYSCORE to remove old; ZCARD to count. Accurate, no boundary burst. Higher Redis memory per client.' },
        { n: 'Token Bucket', d: 'Bucket refills at steady rate R, capped at B. Allows bursts up to B. Token balance persisted in Redis. Most flexible for variable usage patterns.' },
        { n: 'Leaky Bucket', d: 'Outflow is constant rate regardless of inflow. Excess queued or rejected. Smooths output rate. Used for protecting downstream systems from bursts.' },
      ],
      when: 'Every public API. Login and authentication endpoints (brute force protection). Expensive operations (search, ML inference, export). Endpoints that call paid third-party APIs.',
      trade: 'Rate limiting adds 0.5–2ms Redis latency to every request. Inaccurate limits in distributed environments without shared state. Legitimate users get blocked if limits are wrong. The cost of NOT rate limiting: a single abusive client can DoS your service for all users.',
      code: `// Sliding window rate limiter — Redis Lua script (atomic)
const RATE_LIMIT_SCRIPT = \`
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])

  -- Remove requests outside the window
  redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
  -- Count requests in window
  local count = redis.call('ZCARD', key)

  if count < limit then
    -- Add this request
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1  -- allowed
  end
  return 0  -- rejected
\`;

async function rateLimit(
  apiKey: string,
  limit = 100,
  windowMs = 60_000
): Promise<{ allowed: boolean; remaining: number }> {
  const key = \`rl:\${apiKey}\`;
  const now = Date.now();

  const [allowed, count] = await redis.eval(
    RATE_LIMIT_SCRIPT, 1, key, now, windowMs, limit
  ) as [number, number];

  return {
    allowed: allowed === 1,
    remaining: Math.max(0, limit - (count + (allowed ? 1 : 0))),
  };
}

// Middleware usage
app.use(async (req, res, next) => {
  const { allowed, remaining } = await rateLimit(req.apiKey);
  res.set('X-RateLimit-Remaining', String(remaining));
  if (!allowed) return res.status(429).json({ error: 'Rate limit exceeded' });
  next();
});`,
      rw: {
        ex: [
          'Stripe — 100 req/sec per API key; /v1/charges has lower limits than /v1/customers due to cost difference',
          'GitHub API — 5,000 requests/hr authenticated, 60/hr unauthenticated; GraphQL uses point system (cost per query)',
          'OpenAI — dual limits: RPM (requests per minute) AND TPM (tokens per minute) per model tier',
        ],
        cs: 'OpenAI rate limits on two dimensions simultaneously: requests per minute (RPM) and tokens per minute (TPM). A single large prompt can exhaust your TPM limit without hitting your RPM limit. This design lets OpenAI charge more fairly for compute-intensive usage (large context windows) while still protecting server capacity. Their API returns both limits in response headers, and their official SDKs implement automatic exponential backoff when they receive a 429.',
      },
    },
    interview: {
      q: 'Design a rate limiter that works correctly across 50 API gateway instances.',
      a: 'The key challenge is <strong>shared state</strong> — local counters on each gateway instance would allow 50× the intended rate. My design: use Redis as the shared counter store with Lua scripts for atomic read-increment-check. The Lua script does ZADD (add current timestamp), ZREMRANGEBYSCORE (remove expired), ZCARD (count), and returns allowed/rejected — all atomically, no race conditions. For performance: add a local token bucket in each gateway instance as a fast-path pre-check (no Redis call if local tokens available), syncing with Redis every 100ms. This approximation allows ±5% accuracy in exchange for ~10× lower Redis load. For Redis HA: Redis Cluster with 3 primaries + 3 replicas. If Redis is unreachable, fail open (allow requests) but alert immediately — a brief unprotected window is better than a 100% outage. Layer IP-level DDoS protection at the CDN/WAF layer before traffic reaches the gateway.',
      fu: [
        'How do you rate limit across multiple geographic regions?',
        'What is the difference between rate limiting and throttling?',
        'How would you implement a "burst allowance" on top of a base rate limit?',
        'How do you prevent a single Redis node from being a bottleneck at 500k req/sec?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. CAP THEOREM
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'cap',
    cat: 'reliability',
    color: '#f87171',
    icon: '🔺',
    title: 'CAP Theorem',
    tag: 'During a network failure, you can be correct or available — not both',
    overview:
      'CAP Theorem proves that any distributed data store can guarantee at most two of three properties: Consistency (every read returns the most recent write), Availability (every request receives a non-error response), and Partition Tolerance (the system continues operating despite network failures between nodes). Because network partitions are not optional in real distributed systems, the practical tradeoff is always between consistency and availability during a partition.',
    components: [
      {
        name: 'Consistency',
        icon: '🎯',
        role: 'Every read reflects the most recent write, regardless of which node the request hits.',
        detail:
          'CAP Consistency is not the same as ACID consistency — it means linearizability: once a write is acknowledged, all subsequent reads (from any node) see that write. Achieving this during a partition requires either refusing reads from isolated nodes or blocking until a quorum agrees.',
      },
      {
        name: 'Availability',
        icon: '🟢',
        role: 'Every request to a non-failed node receives a response — not a timeout or error.',
        detail:
          'CAP Availability does not mean "fast" — it means every non-failed node must respond. An available system during a partition will serve requests from isolated nodes, potentially returning stale data. It chooses uptime over accuracy.',
      },
      {
        name: 'Partition Tolerance',
        icon: '🌐',
        role: 'The system continues to operate despite some messages being dropped or delayed between nodes.',
        detail:
          'Partition Tolerance is non-negotiable in any real distributed system over unreliable networks — network splits happen, cables are cut, data centers lose connectivity. The real choice is: when a partition occurs, do you preserve consistency or availability?',
      },
      {
        name: 'Network Partition',
        icon: '✂️',
        role: 'A network fault that prevents some nodes from communicating with others.',
        detail:
          'A partition does not mean all nodes are down — it means the cluster is split into two or more groups that cannot communicate. Each group can still serve requests locally. The question is what they return: stale data (AP) or an error (CP).',
      },
      {
        name: 'Quorum',
        icon: '🗳️',
        role: 'A minimum number of nodes that must agree before a read or write is considered successful.',
        detail:
          'In a 5-node cluster, quorum = 3 (majority). A write that reaches 3 nodes is durably committed even if 2 nodes fail. A read that consults 3 nodes will always include at least one node that has the latest write (if W + R > N). Quorum reads/writes trade latency for consistency.',
      },
      {
        name: 'Replication Lag',
        icon: '⏳',
        role: 'The delay between a write being committed on the primary and appearing on replicas.',
        detail:
          'Replication lag is the invisible third party in all consistency discussions. Even without a partition, asynchronous replicas are always slightly behind. If clients read from replicas (for load distribution), they may read stale data. This is the real-world manifestation of eventual consistency — partitions are rare, lag is constant.',
      },
    ],
    howItWorks:
      'Imagine a 3-node database cluster with nodes A, B, and C. A client writes a new bank balance to node A. In a CP system (like etcd), node A does not acknowledge the write until a quorum (A + B or A + C) confirms it. If the network partitions and A cannot reach B or C, A refuses both reads and writes — it returns an error rather than risk returning stale data. In an AP system (like Cassandra with eventual consistency), the write to A is acknowledged immediately and replicated to B and C asynchronously. If a partition occurs, both sides of the partition serve requests using their local state. When the partition heals, the system reconciles using last-write-wins or vector clocks. The client that read from the isolated node may have seen stale data, but the system never went down.',
    decision: {
      choose: [
        'CP for financial systems: bank balances, payment processing, ledgers, inventory counts. Showing a stale balance is worse than returning an error — errors are visible, incorrect data is invisible and dangerous.',
        'CP for configuration and coordination: etcd, ZooKeeper. Leader election and distributed locks MUST be consistent — split-brain causes two leaders, which is catastrophic.',
        'AP for social/engagement data: likes, view counts, activity feeds. A like count that is 2 seconds stale is imperceptible to users. Availability matters more than perfection.',
        'AP for shopping carts and recommendations: Amazon famously chose availability for shopping carts. An error adding to cart is worse than briefly showing a slightly stale cart.',
        'Tunable (DynamoDB, Cassandra) for mixed systems: use strongly consistent reads per operation where accuracy is critical, eventual reads everywhere else.',
      ],
      avoid: [
        'Do not assume CA (consistent + available) systems exist in distributed contexts — CA is only possible on a single node. As soon as you have multiple nodes over a network, you must pick CP or AP for partition scenarios.',
        'Do not blindly default to CP everywhere — you will sacrifice availability for consistency even in contexts where stale data is perfectly acceptable, resulting in unnecessary 503 errors for users.',
        'Do not conflate CAP Consistency with ACID Consistency — they are different concepts. A NoSQL database can be CAP-consistent (linearizable reads) but not ACID-consistent (no multi-row transactions).',
      ],
      vs: [
        { name: 'CP Systems (etcd, HBase, Zookeeper)', when: 'Data correctness is non-negotiable. System can return errors during partition rather than serve stale data. Leader election, distributed locks, financial records.' },
        { name: 'AP Systems (Cassandra, CouchDB, DynamoDB default)', when: 'Availability is paramount. Stale reads are acceptable. Users should never see an error page. Social data, caches, recommendation systems.' },
        { name: 'Tunable (DynamoDB, Cassandra)', when: 'Mixed workload where some operations need strong consistency and others do not. Tune per operation rather than picking a global stance.' },
      ],
    },
    failures: [
      {
        name: 'Split-Brain (Two Leaders)',
        cause: 'Network partition splits a CP cluster. Both halves believe the other half is dead and elect their own leader. Both leaders accept writes to the same data independently.',
        symptom: 'Two primary database nodes accepting conflicting writes. After partition heals, the cluster detects conflicting state and must resolve it — data loss or corruption is likely. Extremely hard to diagnose; by the time the partition heals, the damage is done.',
        fix: 'Use majority quorum for leader election (Raft, Paxos) — only the partition half with >50% of nodes can elect a leader. The minority half returns errors instead of electing a new leader. etcd and CockroachDB use Raft for this reason. Set odd cluster sizes (3, 5, 7) — even numbers cannot form clear majorities.',
        severity: 'critical',
      },
      {
        name: 'Stale Reads Served as Fresh',
        cause: 'AP system serves reads from replica nodes during a partition. Replicas have not received recent writes from the primary (which is on the other side of the partition). Clients receive data that is minutes or hours out of date.',
        symptom: 'User sees a bank balance that does not include a recent deposit. Inventory shows stock that was sold hours ago. User receives an email confirming an action that was actually rolled back. Difficult to detect without end-to-end consistency checks.',
        fix: 'For critical reads, use ConsistentRead: true (DynamoDB) or LOCAL_QUORUM / QUORUM read consistency (Cassandra). Accept the ~2ms extra latency. For non-critical reads, instrument stale read rate via version vectors or timestamps — alert if lag exceeds your SLA. Use read-your-own-writes consistency (client always reads from the same node it wrote to) as a middle ground.',
        severity: 'high',
      },
      {
        name: 'Quorum Unavailable During Partition',
        cause: 'In a CP system with 3 nodes, a partition isolates 2 nodes from 1. The majority (2) can still serve. But in a 5-node cluster partitioned 2-3, the 2-node side has no quorum and goes fully read/write unavailable.',
        symptom: 'Subset of users (those routing to the minority partition) receive errors on all reads and writes. System appears to be fully down to those users. Other users (routing to majority partition) are unaffected.',
        fix: 'Design clusters with odd numbers of nodes in each availability zone (3 or 5). Use multi-region Raft groups where quorum can be satisfied across AZs. Consider "observer" nodes that participate in reads but not in quorum writes — reduces latency without affecting fault tolerance. Have a runbook for manually overriding quorum in disaster scenarios (accepting risk of stale reads).',
        severity: 'critical',
      },
      {
        name: 'Write Amplification from Quorum Writes',
        cause: 'Strongly consistent systems require writes to reach quorum (W nodes) before acknowledging. High write throughput means W × write_rate hits the network and disk simultaneously, consuming more IOPS than expected.',
        symptom: 'Write latency climbs under load. Disk IOPS saturated at a fraction of the expected throughput ceiling. Consistency mode appears to be "working" but the system cannot sustain production write volume.',
        fix: 'Benchmark with production-representative write volume and quorum settings before launch — do not discover this in production. Consider write batching (buffer writes for 5ms, flush as a batch to reduce round trips). Use asynchronous replication for non-critical data. CockroachDB and Spanner use range-based Raft groups to limit how many nodes participate in any single quorum.',
        severity: 'high',
      },
    ],
    a: {
      v: '🔺',
      t: 'The Three-Way Promise You Can\'t Keep',
      tx: "Every project manager knows the iron triangle: Fast, Cheap, Good — pick two. You can be fast and cheap, but quality suffers. Cheap and good, but it takes forever. Fast and good, but it costs a fortune.\n\nCAP Theorem is the distributed systems version of this triangle. The three corners are Consistency, Availability, and Partition Tolerance.\n\nHere's the twist: Partition Tolerance is not optional. Networks are unreliable — cables get cut, data centers lose connectivity, routers fail. You WILL experience network partitions. So you don't get to choose Partition Tolerance — you get it whether you want it or not.\n\nThe real choice, then, is: when a partition happens, do you want your system to stay Consistent (return errors on stale reads) or stay Available (serve possibly stale data)?",
      s: 'The modern nuance that CAP misses: even without a network partition, replication lag means you are always trading consistency for performance. DynamoDB and Cassandra let you tune this tradeoff per request — strong consistency reads when correctness is critical, eventual consistency reads everywhere else. CAP is not a permanent architectural decision; it is a per-operation dial.',
    },
    te: {
      def: "CAP Theorem (Brewer's Theorem, 2000) proves that a distributed data store cannot simultaneously guarantee all three of: Consistency (linearizable reads), Availability (every request gets a response), and Partition Tolerance (operation during network failures). Since partitions are non-optional, the practical tradeoff is CP vs AP.",
      types: [
        { n: 'CP (Consistent + Partition Tolerant)', d: 'Returns error or timeout during partition rather than stale data. HBase, etcd, Zookeeper, CockroachDB, MongoDB (with majority readConcern).' },
        { n: 'AP (Available + Partition Tolerant)', d: 'Returns possibly stale data during partition rather than error. Cassandra, CouchDB, DynamoDB (eventual), Riak.' },
        { n: 'CA (Consistent + Available, no Partition Tolerance)', d: 'Only possible on a single machine. Traditional single-node SQL. Irrelevant for any truly distributed system.' },
        { n: 'Tunable Consistency', d: 'Consistency level configurable per read/write operation. DynamoDB ConsistentRead, Cassandra ONE/QUORUM/ALL. Best of both worlds at the cost of application complexity.' },
        { n: 'PACELC Extension', d: 'Extends CAP: even without a partition, systems trade off latency (L) vs consistency (C). CP systems have higher write latency (quorum round trips). AP systems have lower latency.' },
      ],
      when: 'Every distributed database selection decision. Designing distributed caches. Choosing replication topology. Deciding between synchronous and asynchronous replication.',
      trade: 'CP: you get correctness but your system returns errors during partition — users see failure pages. AP: your system stays up during partition but some reads may be seconds or minutes stale. Neither is universally better — it depends on the cost of incorrect data vs the cost of downtime for your specific domain.',
      code: `// DynamoDB — tunable per-operation consistency

// CP behavior: strongly consistent read
// Latency: ~2ms | Reads from primary replica only
const freshBalance = await dynamodb.getItem({
  TableName: 'BankAccounts',
  Key: { userId: { S: 'user-123' } },
  ConsistentRead: true, // will not serve stale data
}).promise();

// AP behavior: eventually consistent read (default)
// Latency: ~1ms | May be up to 1 second stale
const feedItems = await dynamodb.getItem({
  TableName: 'ActivityFeed',
  Key: { userId: { S: 'user-123' } },
  ConsistentRead: false, // may serve replica data
}).promise();

// Cassandra — tunable consistency levels
// QUORUM: majority must agree (CP-like, higher latency)
session.execute(
  'SELECT balance FROM accounts WHERE id=?',
  [userId],
  { consistency: cassandra.types.consistencies.quorum }
);

// ONE: respond from nearest replica (AP, lower latency)
session.execute(
  'SELECT post_count FROM user_stats WHERE id=?',
  [userId],
  { consistency: cassandra.types.consistencies.one }
);`,
      rw: {
        ex: [
          'DynamoDB — tunable per request; Amazon shopping cart uses AP (availability > accuracy)',
          'Cassandra — AP by default; Instagram uses it for activity feeds and counters',
          'etcd — CP; Kubernetes uses etcd for leader election and cluster state (split-brain would be catastrophic)',
        ],
        cs: "Kubernetes uses etcd (a CP system using Raft consensus) to store all cluster state — which pods are running, which nodes exist, which configs are applied. During a network partition, etcd on the minority side refuses reads and writes. This means some parts of the cluster may be temporarily unschedulable, but it guarantees that two kube-scheduler instances can never simultaneously think they are the leader and schedule the same pod twice. In cluster orchestration, split-brain is far worse than temporary unavailability.",
      },
    },
    interview: {
      q: 'You are designing a payment processing system. How does CAP Theorem affect your database choice?',
      a: 'For payment processing I choose <strong>CP (Consistency + Partition Tolerance)</strong> without hesitation. The cost of incorrect data — showing a wrong balance, double-charging, or losing a transaction — is far higher than the cost of returning an error during a network partition. I would use PostgreSQL with synchronous replication (or CockroachDB for multi-region) where a write is not acknowledged until a quorum of replicas confirms it. During a partition, the minority partition returns errors rather than serving stale state. I would pair this with a circuit breaker and a transactional outbox pattern: payment events written atomically to the DB, then relayed to downstream services via a queue. The system is CP for the payment record itself, and decoupled (via queue) for downstream effects like notifications and analytics — which can tolerate eventual consistency.',
      fu: [
        'What is PACELC and how does it extend CAP Theorem?',
        'What is split-brain and how does Raft consensus prevent it?',
        'How does DynamoDB handle the CAP tradeoff?',
        'What is the difference between CAP Consistency and ACID Consistency?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. CIRCUIT BREAKER
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'circuit',
    cat: 'reliability',
    color: '#f87171',
    icon: '🔌',
    title: 'Circuit Breaker',
    tag: 'Stop calling a dead service — fail fast and recover gracefully',
    overview:
      'A circuit breaker monitors calls to an external dependency and, when the failure rate exceeds a threshold, "trips" — short-circuiting all subsequent calls with an immediate failure or fallback instead of waiting for timeouts. This prevents cascading failures where one slow or failed service consumes all threads and connections in callers, eventually taking down services that had nothing to do with the original failure.',
    components: [
      {
        name: 'Failure Threshold',
        icon: '📊',
        role: 'The failure rate or count that triggers the circuit to trip from CLOSED to OPEN.',
        detail:
          'Typically expressed as a percentage of requests in a sliding time window (e.g., "trip if >50% of requests in the last 10 seconds fail"). A minimum volume requirement prevents false trips during low-traffic periods where a single failure would otherwise be 100% failure rate.',
      },
      {
        name: 'State Machine (CLOSED / OPEN / HALF-OPEN)',
        icon: '🔄',
        role: 'Tracks the health of the downstream dependency and controls whether calls are allowed through.',
        detail:
          'CLOSED: normal operation, all calls pass through. OPEN: circuit is tripped, all calls return immediately with fallback (no actual call made). HALF-OPEN: after a timeout, one probe request is allowed through to test recovery. Success → CLOSED; failure → back to OPEN.',
      },
      {
        name: 'Fallback Handler',
        icon: '🔙',
        role: 'The alternative response returned to callers when the circuit is OPEN.',
        detail:
          'A good fallback is the difference between a degraded-but-functional user experience and a complete error page. Examples: cached recommendation data, a default "Popular items" list, an empty response with a user-visible note, or a queued write to retry later. The fallback must never itself call the failing service.',
      },
      {
        name: 'Health Probe',
        icon: '🩺',
        role: 'The test request sent in HALF-OPEN state to check if the downstream service has recovered.',
        detail:
          'The probe is a single real request (or a lightweight ping). It must be a representative operation — probing with a cheap health-check endpoint while production calls would still fail gives a false positive. After a successful probe, the circuit transitions to CLOSED and gradually restores full traffic.',
      },
      {
        name: 'Metrics Window',
        icon: '📈',
        role: 'The rolling time window over which failure rates and latency are measured.',
        detail:
          'A count-based window (trip after 5 failures) reacts quickly but is noisy at low volume. A time-based percentage window (trip if >50% fail in 10s, with min 20 requests) is more robust. Metrics must include timeout failures, not just error responses — a service that takes 30s to respond is as harmful as one that returns 500.',
      },
      {
        name: 'Bulkhead',
        icon: '🚢',
        role: 'Isolates thread pools or connection pools per dependency so one failing service cannot exhaust shared resources.',
        detail:
          'Named after ship compartments: if one compartment floods, watertight doors prevent the water from spreading. Without bulkheads, a slow database can exhaust a shared thread pool, making the entire application unresponsive — even for endpoints that do not use that database. Each dependency gets its own bounded pool.',
      },
    ],
    howItWorks:
      'In normal operation (CLOSED state), every call to the downstream service passes through the circuit breaker, which records the outcome — success, failure, or timeout — in a rolling metrics window. When the failure rate in that window crosses the configured threshold (e.g., 50% over the last 10 seconds with at least 20 requests), the breaker trips to OPEN. In OPEN state, the breaker does not make any call to the downstream service — it immediately returns the fallback response. After a configured timeout (e.g., 30 seconds), the breaker moves to HALF-OPEN and allows one probe request through. If the probe succeeds, the breaker resets to CLOSED and traffic gradually resumes. If the probe fails, the breaker returns to OPEN for another timeout cycle. Throughout this process, metrics are exported for monitoring, alerting, and dashboards — a tripped circuit should be a visible operational event.',
    decision: {
      choose: [
        'Any synchronous service-to-service call in a microservices architecture — especially on high-traffic paths where downstream slowness would block threads.',
        'Calls to external third-party APIs (payment processors, email providers, geocoding) that have variable reliability and SLAs.',
        'Database calls from services where the database can become temporarily overwhelmed — a circuit breaker prevents thread pool exhaustion from waiting on DB timeouts.',
        'When you have a well-defined fallback: cached data, a default response, a queue for later processing. Without a meaningful fallback, a circuit breaker just converts slow failures into fast failures — useful, but limited.',
        'Services where graceful degradation is product-acceptable: recommendations, search ranking, personalization, non-critical enrichment.',
      ],
      avoid: [
        'Do not use a circuit breaker as a substitute for fixing the underlying reliability problem in the downstream service — it is a resilience pattern, not a performance fix.',
        'For idempotent write operations (state-changing calls), ensure the fallback does not silently drop the operation — queue it for retry instead of returning success.',
        'Do not set thresholds so sensitive that normal variability trips the circuit (e.g., trip after 2 failures in 1 second during a 1 rps service). Tune thresholds against production error rate baselines.',
        'Do not add circuit breakers for every internal function call — the overhead is meaningful and the pattern adds operational complexity. Reserve for I/O-bound, network-crossing calls.',
      ],
      vs: [
        { name: 'Retry with Backoff', when: 'Transient errors that resolve themselves in milliseconds to seconds. Retries make sense for network blips. Circuit breaker makes sense for sustained failures where retries would pile up.' },
        { name: 'Timeout', when: 'Always use timeouts — they are the prerequisite, not the alternative. A circuit breaker without a timeout on the underlying call will still block threads. Use both.' },
        { name: 'Bulkhead', when: 'Complementary pattern, not alternative. Bulkhead isolates resource consumption per dependency. Circuit breaker stops calling a failing dependency. Use both for maximum resilience.' },
      ],
    },
    failures: [
      {
        name: 'False Positives Tripping Healthy Services',
        cause: 'Threshold is set too aggressively — a brief spike in errors (deploy restart, transient network, garbage collection pause) trips the circuit on an otherwise healthy service.',
        symptom: 'Circuit shows OPEN in dashboards but downstream service metrics show it is healthy. Users experience degraded responses during periods when the downstream system is working fine. Frustrating for engineers who cannot correlate the circuit trip to an actual downstream problem.',
        fix: 'Require a minimum request volume before evaluating failure rate (e.g., do not trip on 1 failure if only 1 request was made). Use a longer evaluation window (20s instead of 5s) to smooth over transient spikes. Classify errors — network timeouts and 5xx responses should count; 4xx errors (bad input) should not trip the circuit, they are client errors not downstream failures.',
        severity: 'medium',
      },
      {
        name: 'Thundering Herd When Circuit Closes',
        cause: 'Circuit trips due to overloaded downstream service. After the HALF-OPEN probe succeeds, the circuit fully closes. All queued and pent-up traffic floods the downstream service simultaneously — overwhelming it again and immediately re-tripping the circuit.',
        symptom: 'Circuit oscillates rapidly between OPEN and CLOSED. Downstream service metrics show repeated spikes immediately after each circuit close. The system never fully recovers — it trips, closes, overloads, trips again in a cycle.',
        fix: 'Implement gradual traffic restoration after HALF-OPEN success: allow 10% of traffic for 5 seconds, then 25%, then 50%, then 100%. Combine with rate limiting on the downstream call path. Resilience4j supports a slowCallRateThreshold and slowCallDurationThreshold to detect this pattern and stay in HALF-OPEN longer.',
        severity: 'high',
      },
      {
        name: 'Fallback Itself Failing',
        cause: 'The fallback handler calls another service or a cache that is also failing. Or the fallback computation is expensive enough to cause resource exhaustion under the load that was previously going to the now-circuit-broken service.',
        symptom: 'Circuit is OPEN (expected) but errors are still propagating to users. Fallback service or cache shows elevated error rates coinciding with circuit trip. Cascading failure despite circuit breaker being present.',
        fix: 'Fallbacks must be simpler and more reliable than the primary call. Ideal fallbacks: return a static value, return cached data from local memory (not another network call), return an empty/default response. Test your fallback independently of the primary service — it must survive the same traffic volume as the primary call.',
        severity: 'critical',
      },
      {
        name: 'Half-Open Storm',
        cause: 'Multiple circuit breaker instances (one per application instance) each independently enter HALF-OPEN at the same time after their timeouts expire. All of them send probe requests simultaneously, overwhelming the recovering service with N probe requests instead of 1.',
        symptom: 'Downstream service shows N simultaneous requests right after a circuit timeout (N = number of app instances). If the service is still fragile, the simultaneous probes re-trip all circuits. Recovery time is extended by the repeat overload.',
        fix: 'Use a shared coordination mechanism for HALF-OPEN probes: only one instance probes at a time, the result is broadcast to all instances. Alternatively, use a service mesh (Istio, Envoy) where circuit breaking is centralized at the proxy layer rather than implemented per application instance — one circuit state, N application instances.',
        severity: 'high',
      },
    ],
    a: {
      v: '🔌💡',
      t: 'The Electrical Circuit Breaker',
      tx: "Your house has electrical circuit breakers in the fuse box. Each circuit (kitchen, living room, bedroom) has its own breaker. When something goes wrong — too many appliances running, a short circuit, a faulty device — the breaker TRIPS. Power to that circuit cuts off.\n\nThis is protective by design. Without the breaker, the fault would overheat the wire, potentially starting a fire and damaging everything connected. The breaker sacrifices power to one circuit to protect the entire house.\n\nA software circuit breaker works identically. When Service B starts returning errors or timing out, the circuit breaker in Service A TRIPS. Service A stops calling Service B entirely and immediately returns a fallback response. No waiting 30 seconds for a timeout. No exhausting thread pools waiting for a response that will never come. Fail fast, fail locally, protect the rest of the system.\n\nAfter 30 seconds, the breaker cautiously lets one probe call through — like a homeowner testing if the appliance that caused the fault is safe now. If the probe succeeds, full power is restored. If not, the breaker trips again for another cycle.",
      s: 'Netflix found that without circuit breakers, a single slow service could cascade into a total platform outage — slow responses hold threads, threads fill up, new requests queue, the caller also runs out of threads, and the failure propagates upward. Hystrix circuit breakers contained failures to the failing service boundary. The rest of the platform kept running in degraded mode.',
    },
    te: {
      def: 'A circuit breaker wraps calls to external dependencies and tracks their health. When failure rate exceeds a threshold, it trips to OPEN state — all subsequent calls return immediately with a fallback, giving the downstream service time to recover without being bombarded with additional load.',
      types: [
        { n: 'CLOSED (Healthy)', d: 'All calls pass through. Failures tracked in rolling window. Normal operation.' },
        { n: 'OPEN (Tripped)', d: 'No calls made to downstream. Fallback returned immediately. Timer running for HALF-OPEN probe.' },
        { n: 'HALF-OPEN (Probing)', d: 'Single probe request allowed. Success → CLOSED (full recovery). Failure → OPEN (continue isolation).' },
        { n: 'Count-Based Threshold', d: 'Trip after N consecutive failures. Simple, reacts quickly. Noisy at low volume.' },
        { n: 'Rate-Based Threshold', d: 'Trip if X% of requests in last T seconds fail (with min volume). More robust for variable traffic.' },
      ],
      when: 'Any synchronous I/O call to an external system: HTTP APIs, database queries, gRPC calls. Critical for microservices where one service calling another calling another creates deep failure chains.',
      trade: 'Circuit breakers add complexity: state management, metrics collection, fallback logic, and operational visibility requirements. The payoff is isolation of failure domains — a failing recommendation service degrades recommendations, not checkout, not auth, not the entire platform.',
      code: `// Production-grade Circuit Breaker — TypeScript
type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker<T> {
  private state: State = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private nextProbeAt = 0;

  constructor(
    private readonly threshold = 5,       // failures before OPEN
    private readonly timeout = 30_000,     // ms before HALF_OPEN probe
    private readonly halfOpenSuccesses = 2 // successes before CLOSED
  ) {}

  async execute(fn: () => Promise<T>, fallback: T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextProbeAt) {
        // Fast-fail: no call made, return fallback immediately
        return fallback;
      }
      this.state = 'HALF_OPEN'; // time to probe
      this.successes = 0;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      return fallback;
    }
  }

  private recordSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.halfOpenSuccesses) {
        this.state = 'CLOSED'; // fully recovered
      }
    }
  }

  private recordFailure(): void {
    this.failures++;
    if (
      this.state === 'HALF_OPEN' ||
      this.failures >= this.threshold
    ) {
      this.state = 'OPEN';
      this.nextProbeAt = Date.now() + this.timeout;
      this.failures = 0;
    }
  }

  getState(): State { return this.state; }
}

// Usage
const recoCB = new CircuitBreaker<Product[]>(5, 30_000, 2);

async function getRecommendations(userId: string): Promise<Product[]> {
  return recoCB.execute(
    () => recommendationService.fetch(userId),
    POPULAR_ITEMS_FALLBACK // static cached list
  );
}`,
      rw: {
        ex: [
          'Netflix Hystrix — open-sourced in 2012, pioneered circuit breakers at scale with 10M+ instances in production',
          'Resilience4j — modern Java circuit breaker for Spring Boot; supports count-based and time-based sliding window',
          'AWS SDK — built-in retry with exponential backoff and jitter; adaptive retry mode acts as a soft circuit breaker',
        ],
        cs: "Netflix's Hystrix library was the catalyst for circuit breakers in mainstream microservices. When the recommendation service failed, Hystrix returned \"Popular in your Region\" from a pre-warmed cache instead of an error page. When personalization failed, it returned un-personalized content. Engineers designed explicit fallbacks for every Hystrix command. The result: no single service could take down Netflix. The platform degraded gracefully through dozens of partial failures per day that users never noticed.",
      },
    },
    interview: {
      q: 'How would you prevent a cascading failure in a microservices system where Service A calls B, which calls C?',
      a: 'I would apply four patterns in combination. First, <strong>timeouts on every call</strong> — never let A wait indefinitely for B; a 2s timeout converts an infinite wait into a fast failure. Second, <strong>circuit breakers at each call boundary</strong> — if B is failing, A\'s circuit breaker trips and returns a fallback immediately instead of queuing 1000 threads waiting for B. Third, <strong>bulkheads per dependency</strong> — A has a separate thread pool (or semaphore) for calls to B, sized to B\'s expected capacity. B\'s slowness can exhaust B\'s pool but cannot bleed into A\'s pools for other dependencies. Fourth, <strong>fallbacks</strong> — A must have a meaningful answer for "what do I return when B is unavailable?" If the answer is "I cannot function at all," then this is a hard dependency and availability is inherently coupled. The meta-lesson: design for partial failure, not just total failure. The system should degrade gracefully at each layer, not propagate errors upward.',
      fu: [
        'What is bulkhead isolation and how does it complement circuit breakers?',
        'How do you test circuit breakers in production safely?',
        'What is the difference between a circuit breaker and a retry with exponential backoff?',
        'How does a service mesh like Istio handle circuit breaking differently from application-level libraries?',
      ],
    },
  },
];
