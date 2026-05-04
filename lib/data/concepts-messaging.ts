import { Concept } from '../types';

export const CONCEPTS_MESSAGING: Concept[] = [
  {
    id: 'kafka',
    cat: 'messaging',
    color: '#16a34a',
    icon: '🌊',
    title: 'Apache Kafka',
    tag: 'The distributed commit log that never forgets',
    overview:
      'Kafka is a distributed event streaming platform built around an immutable, ordered log — producers append records, consumers read from any offset independently, and the log is retained for a configurable window regardless of whether anyone has consumed it. Unlike traditional queues that delete messages on delivery, Kafka is a durable log first, and a message bus second — a distinction that unlocks event sourcing, audit trails, and stream reprocessing at LinkedIn-scale.',
    components: [
      {
        name: 'Producer',
        icon: '📤',
        role: 'Publishes records to a topic; decides which partition each record lands in',
        detail:
          'The producer computes the target partition by hashing the message key (key-based partitioning) when a key is provided, falling back to sticky round-robin batching when the key is null — sending a burst of keyless messages to the same partition until the batch is full or linger.ms elapses, then rotating. Custom partitioners let you co-locate related records (e.g., all events for the same userId on the same partition) to guarantee ordering within a logical entity without global ordering.',
      },
      {
        name: 'Topic',
        icon: '📋',
        role: 'Logical stream name that groups related records; the unit of schema and retention policy',
        detail:
          'A topic is purely a namespace — Kafka never stores data per-topic in a single file; it shards the topic into N partitions spread across the broker fleet, so the topic itself is a virtual construct. Retention is configured either by time (log.retention.hours, default 168h / 7 days) or by size (log.retention.bytes), and log compaction can be enabled so only the latest record per key survives — essential for changelog topics backing KTables.',
      },
      {
        name: 'Partition',
        icon: '📦',
        role: 'Ordered, immutable, append-only log segment; the fundamental unit of parallelism and throughput',
        detail:
          'Each partition is a directory of segment files on disk; Kafka uses a sparse offset index to jump to any offset in O(log n) time without scanning from the beginning, enabling efficient consumer catch-up. The partition\'s leader broker handles all reads and writes for that partition, while ISR (in-sync replica) followers pull from the leader — this pull-based replication means a slow replica drops out of the ISR rather than blocking the leader.',
      },
      {
        name: 'Offset',
        icon: '🔖',
        role: 'Per-consumer, per-partition cursor into the log; determines exactly-once or at-least-once delivery semantics',
        detail:
          'Offsets are monotonically increasing 64-bit integers assigned by the broker at write time; consumers commit their current offset to the internal __consumer_offsets topic either automatically (enable.auto.commit=true) or manually after processing. Manual commit is critical for at-least-once guarantees: committing before processing means a crash loses work; committing after means a crash replays messages — idempotent consumers handle this safely.',
      },
      {
        name: 'Consumer Group',
        icon: '👥',
        role: 'Named group of consumers that collectively consume a topic; each partition is assigned to exactly one member',
        detail:
          'The group coordinator broker assigns partitions to consumers during the join-group/sync-group protocol (rebalance); with the default eager rebalance, all consumers stop, surrender partitions, and re-receive assignments — causing a full processing pause. Cooperative incremental rebalance (introduced in Kafka 2.4) revokes only the partitions being moved, so the rest of the group keeps processing throughout, dramatically reducing rebalance impact in large consumer groups.',
      },
      {
        name: 'Broker',
        icon: '🖥️',
        role: 'A Kafka server that stores partition data and serves producers and consumers',
        detail:
          'Brokers are largely symmetric — any broker can route metadata requests, but only the partition leader handles writes and reads for that partition. The controller broker (elected via ZooKeeper or KRaft Raft) handles administrative tasks: leader election when a broker fails, ISR updates, and partition reassignment. Kafka relies on the OS page cache for read performance — hot partitions are served from RAM without a single disk I/O if the consumer lag is low enough.',
      },
      {
        name: 'ZooKeeper / KRaft',
        icon: '🔧',
        role: 'Cluster coordination layer for leader election, broker registration, and topic metadata',
        detail:
          'Traditional Kafka used ZooKeeper as an external coordination service, creating an operational dependency and limiting metadata scalability (ZooKeeper struggled beyond ~200K partitions). KRaft (Kafka Raft metadata, GA in Kafka 3.3+) replaces ZooKeeper by embedding a Raft consensus quorum of controller nodes directly in the Kafka cluster — eliminating the separate ZooKeeper cluster, halving operational overhead, and scaling to millions of partitions.',
      },
      {
        name: 'Replication Factor',
        icon: '🔁',
        role: 'Number of broker copies each partition maintains; the lever for durability vs. storage cost',
        detail:
          'A replication factor of 3 means each partition has one leader and two followers; the cluster tolerates losing min(RF-1, 2) brokers before losing availability for that partition — with RF=3 and min.insync.replicas=2, one broker can fail without data loss or producer errors. Setting acks=all on the producer forces the leader to wait for all ISR members to acknowledge before returning success, making the write durable even if the leader crashes immediately after.',
      },
    ],
    howItWorks:
      'A producer determines the target partition for each record (via key hash, round-robin, or custom logic), batches records up to batch.size or linger.ms, compresses the batch, and sends it to the partition leader broker. The leader appends the batch to its local log, assigns offsets, and replicates it to follower brokers in the ISR; once min.insync.replicas followers have acknowledged, the leader returns success to the producer. Consumers in a group poll the brokers, each reading from their exclusively assigned partitions starting at their last committed offset — the broker returns a batch of records up to fetch.max.bytes and the consumer processes and commits the offset. Kafka never pushes to consumers; the pull model allows consumers to pace themselves and re-read historical data by resetting the offset. Records persist on disk until the retention deadline regardless of consumption, enabling multiple independent consumer groups to read the same topic at different speeds without interfering with each other.',
    decision: {
      choose: [
        'Processing >100K events/second where queue throughput is the bottleneck',
        'Multiple independent consumer groups need to read the same event stream (e.g., analytics + billing + search indexing from the same order events)',
        'Events must be replayed — audit log, event sourcing, re-running a bug-fix over historical data',
        'Strict ordering is required within a logical key (e.g., all events for userId=123 must process in order)',
        'Long retention is needed — retain 30 days of clickstream data for reprocessing',
        'Stream processing pipelines with Kafka Streams or ksqlDB',
      ],
      avoid: [
        'Task queues where individual jobs need retries with backoff, priorities, or scheduling — use BullMQ or Celery instead',
        'Request/reply patterns — Kafka is async; building RPC on top of it is painful',
        'Total message count under 1M/day — Kafka\'s operational overhead is not justified at low volume',
        'When your team has zero Kafka operations experience and you need to ship in 2 weeks',
        'Messages >1MB frequently — Kafka can handle large messages but performance degrades and the per-broker memory pressure grows',
        'When you need message-level TTL or per-consumer delayed delivery — Kafka\'s retention is topic-level only',
      ],
      vs: [
        {
          name: 'RabbitMQ',
          when: 'Choose RabbitMQ for complex routing logic (topic exchanges, headers routing), per-message TTL, priority queues, or when your team needs simpler operations. Choose Kafka when you need replay, fan-out to many consumers, or >50K msg/s sustained throughput.',
        },
        {
          name: 'BullMQ',
          when: 'Choose BullMQ for background job processing with retries, scheduling, priority, and flow dependencies — it has first-class job semantics. Kafka has no native concept of a "job" with retry backoff or priority.',
        },
        {
          name: 'AWS Kinesis',
          when: 'Choose Kinesis when you\'re all-in on AWS and want zero cluster management. Kafka gives more control, higher throughput per shard, and broader ecosystem (Kafka Connect, Kafka Streams). Kinesis limits you to 1MB/s write per shard vs. Kafka\'s multi-GB/s per partition.',
        },
        {
          name: 'Redis Pub/Sub',
          when: 'Choose Redis Pub/Sub only for ephemeral fan-out where message loss is acceptable (live dashboards, presence). It has no persistence, no consumer groups, and no replay — if a subscriber is offline, the message is gone.',
        },
      ],
    },
    failures: [
      {
        name: 'Consumer Lag',
        cause: 'Consumers process messages slower than producers write them — under-provisioned consumer threads, slow downstream DB, GC pauses, or a downstream API being throttled',
        symptom: 'kafka_consumer_group_lag metric climbs continuously; messages approach or exceed retention age before being processed; SLA violations as events process hours after they occurred',
        fix: 'Add partitions to the topic (requires consumer group restart) and add consumers to the group to match — consumer count cannot exceed partition count. Profile the consumer to find the bottleneck: if it\'s IO-bound, increase concurrency; if it\'s CPU-bound, scale horizontally. Set up lag alerts at 100K and 1M offsets with PagerDuty, not just error rate.',
        severity: 'critical',
      },
      {
        name: 'Hot Partition',
        cause: 'A partition key with low cardinality (e.g., user_country="US" for 80% of traffic, or using a boolean as key) routes the majority of traffic to a single partition while others are idle',
        symptom: 'One broker\'s CPU and network IO spike while others are underutilized; that partition\'s consumer falls behind while other consumers in the group are idle with nothing to process',
        fix: 'Redesign the partition key to have high cardinality (userId, orderId, UUID). For inherently skewed keys, append a random suffix (user_country + random 0-9) and fan-in results downstream. Use Kafka\'s partition.assignment.strategy=StickyAssignor to minimize rebalance thrash while fixing the key.',
        severity: 'high',
      },
      {
        name: 'Unclean Leader Election',
        cause: 'All ISR replicas for a partition go offline simultaneously (rack failure, rolling restart gone wrong); a non-synced replica is the only broker still up; unclean.leader.election.enable=true (default false in modern Kafka) allows it to become leader',
        symptom: 'Messages written to the previous leader but not yet replicated are silently lost; consumers see the offset "rewind" — offsets that were committed now point past the new leader\'s log end',
        fix: 'Set unclean.leader.election.enable=false (default since Kafka 0.11) — prefer unavailability over data loss. Set min.insync.replicas=2 and acks=all on producers so writes are never acknowledged unless two replicas have the data. Monitor under-replicated partitions metric and alert before ISR shrinks to 1.',
        severity: 'critical',
      },
      {
        name: 'Producer Retry Loop',
        cause: 'Network blip causes a producer timeout; the broker actually wrote the record but the ACK was lost in transit; producer retries and sends the same record again, creating a duplicate',
        symptom: 'Downstream systems see duplicate events (double-charged orders, duplicate notifications); idempotency-unaware consumers process the same message twice',
        fix: 'Enable idempotent producer (enable.idempotence=true, default since Kafka 3.0) — the broker deduplicates retries using the producer epoch and sequence number within a single session. For cross-session exactly-once, use Kafka transactions (transactional.id) so the producer fences previous instances of itself. On the consumer side, implement idempotency via a deduplication key in your DB regardless — defense in depth.',
        severity: 'high',
      },
      {
        name: 'Rebalance Storm',
        cause: 'Consumers join and leave rapidly due to: slow poll() calls exceeding max.poll.interval.ms (consumer considered dead), GC pauses, or a rolling deployment that restarts consumers faster than the coordinator can stabilize',
        symptom: 'No messages are processed for seconds to minutes during each rebalance cycle; in extreme cases, the group never stabilizes and throughput drops to near zero',
        fix: 'Increase max.poll.interval.ms to match your worst-case processing time. Reduce max.poll.records to give each poll() loop less work. Migrate to cooperative incremental rebalance (partition.assignment.strategy=CooperativeStickyAssignor) so only affected partitions pause during rebalance. During rolling deploys, use static group membership (group.instance.id) so a restarting consumer rejoins with its old partition assignment without triggering a full rebalance.',
        severity: 'high',
      },
    ],
    a: {
      v: '🗞️🖨️📰',
      t: 'The World\'s Largest Newspaper Printing Press',
      tx: "Picture a newspaper company with a printing press that never stops. Every article ever published is preserved in the archive — you can read today's paper or find any edition from 7 years ago. The press doesn't care if you've read it yet — it keeps printing and storing.\n\nThe newspaper is divided into SECTIONS: Sports, Business, World News, Entertainment. Each section is printed on its own press line — that's a PARTITION. More press lines = more articles printed per hour = more parallelism. Crucially, articles within each section are always in the order they were written.\n\nNow imagine different kinds of subscribers. Sports fans read only the Sports section. Financial analysts read only Business. A research library subscribes to ALL sections. Each subscriber has a BOOKMARK (offset) that remembers exactly which article they last read — the library's bookmark is on page 4,201, the sports fan is on page 18,003. Neither interferes with the other. And when a new subscriber joins, they can start reading from any edition — even 7 years back.\n\nThis is Kafka's killer insight over traditional queues: old messages aren't thrown away after delivery. The retention window (default 7 days) means any consumer group can subscribe today and replay everything from the beginning. A bug in your analytics pipeline? Roll back the offset and replay 3 days of events through the fixed code.\n\nThe printing press itself is the BROKER CLUSTER. Multiple presses (brokers) run in parallel; each press line (partition) has one primary press (leader) and two backup presses (followers) that mirror every article. If the primary press breaks, a backup seamlessly takes over — no articles are lost.",
      s: 'The secret experts know: Kafka is not a message queue — it\'s a distributed commit log that happens to support pub/sub. The moment you internalize this, everything else follows: why retention matters, why consumers can replay, why ordering is per-partition not per-topic, and why adding consumers beyond the partition count does nothing. Size your partition count at 2-3x your expected peak consumer parallelism so you never need a painful partition increase in production.',
    },
    te: {
      def: 'Apache Kafka is a distributed event streaming platform built on a replicated, partitioned, ordered, and immutable commit log. Producers append records to topic-partitions; consumers read at their own pace using offsets; records persist for a configurable retention window regardless of consumption.',
      types: [
        { n: 'Standard Producer-Consumer', d: 'Producers write to topics; consumer groups each independently consume the entire topic. The baseline Kafka use case for event streaming and async decoupling.' },
        { n: 'Compacted Topics', d: 'Only the latest record per key is retained; older records are garbage collected. Used for change-data-capture (CDC) streams and Kafka Streams KTable changelogs.' },
        { n: 'Kafka Streams', d: 'Java library for stateful stream processing (joins, aggregations, windowing) directly on Kafka topics — no separate cluster. State stored in RocksDB locally and backed up to a changelog topic.' },
        { n: 'Exactly-Once Semantics (EOS)', d: 'Combines idempotent producers + Kafka transactions to guarantee each record is written and consumed exactly once across a read-process-write pipeline, even across failures.' },
        { n: 'Kafka Connect', d: 'Framework for integrating external systems (Postgres, S3, Elasticsearch) as sources or sinks via reusable connector plugins — no application code required for standard ETL.' },
      ],
      when: 'Use Kafka when you need durable, replayable, high-throughput event streams consumed by multiple independent systems. Ideal for event sourcing, real-time analytics pipelines, CDC, audit logging, and microservice decoupling at scale above 10K events/sec.',
      trade: 'Kafka delivers extraordinary throughput (millions of msg/s) and durability, but pays for it with operational complexity: cluster sizing, partition planning, consumer group management, and schema evolution require deliberate engineering. The lack of native per-message TTL, per-consumer delay, and priority queuing means it\'s a poor fit for traditional job queue use cases.',
      code: `import { Kafka, CompressionTypes, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'gps-service',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
  logLevel: logLevel.WARN,
});

// ── Producer ──────────────────────────────────────────────
const producer = kafka.producer({
  idempotent: true,           // enable.idempotence=true; deduplicates retries
  transactionTimeout: 30000,
});

await producer.connect();

await producer.send({
  topic: 'gps-updates',
  compression: CompressionTypes.SNAPPY,
  messages: [
    {
      key: driverId,          // key-based partitioning: all updates for a driver land on the same partition
      value: JSON.stringify({ driverId, lat, lng, ts: Date.now() }),
      headers: { version: '2' },
    },
  ],
});

// ── Consumer ──────────────────────────────────────────────
const consumer = kafka.consumer({
  groupId: 'gps-processor-v2',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxPollIntervalMs: 300000,  // must be > your worst-case processing time
});

await consumer.connect();
await consumer.subscribe({ topic: 'gps-updates', fromBeginning: false });

await consumer.run({
  eachBatchAutoResolve: false,  // manual offset commit for at-least-once
  eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning }) => {
    for (const message of batch.messages) {
      if (!isRunning()) break;
      const update = JSON.parse(message.value!.toString());
      await updateDriverLocation(update);  // idempotent upsert in DB
      resolveOffset(message.offset);       // commit this offset
      await heartbeat();                   // prevent session timeout on slow batches
    }
  },
});`,
      rw: {
        ex: [
          'LinkedIn (invented Kafka; 7 trillion messages/day across 100+ clusters)',
          'Uber GPS pipeline (250K msg/s real-time driver location updates)',
          'Airbnb event sourcing for booking pipeline (Kafka + Flink)',
          'Confluent Cloud (managed Kafka; powers thousands of enterprises)',
        ],
        cs: 'Uber\'s real-time GPS pipeline ingests 250,000 location updates per second across 4 million active drivers at peak. Each driverId is the partition key, guaranteeing ordered location history per driver. Downstream consumers include ETA calculation, surge pricing, and fraud detection — all reading the same topic independently via separate consumer groups. The pipeline processes 99th-percentile end-to-end latency under 500ms from driver GPS ping to rider app update, handling Black Friday and New Year\'s Eve spikes without reprovisioning because partition count was sized at 3x peak day one.',
      },
    },
    interview: {
      q: 'Design the messaging backbone for a ride-sharing app that processes 1M GPS updates per second.',
      a: 'I\'d use <strong>Kafka as the central event log</strong> with a single `gps-updates` topic. I\'d set the partition count to 3,000 — roughly 333 msg/s per partition, leaving 3x headroom — and use <strong>driverId as the partition key</strong> so all updates for a driver are ordered on one partition and consumed by one worker thread, enabling stateful ETA calculation without distributed locking. Producers run with <strong>idempotent mode and acks=all</strong> to prevent duplicate GPS points while surviving broker failures. I\'d deploy three consumer groups reading the same topic independently: real-time ETA (low latency, small batches), surge pricing (1-second tumbling windows in Kafka Streams), and a cold path writing to S3 via Kafka Connect for historical replay. Retention is 24 hours — enough to replay a full day if the ETA model is redeployed. I\'d monitor <strong>consumer lag per group</strong> and autoscale consumer instances when lag exceeds 50K offsets.',
      fu: [
        'How would you handle a hot partition if 30% of your drivers are in one city?',
        'What happens if one consumer group\'s lag grows to 10 million offsets? How do you recover without losing messages?',
        'How does Kafka exactly-once semantics work and when would you enable it?',
        'How would you do a schema migration on the gps-updates topic with no downtime?',
        'A broker fails and 20 partitions lose their leader. Walk me through what Kafka does automatically and what you need to monitor.',
        'Compare Kafka\'s consumer model (pull) to RabbitMQ\'s (push). Why does it matter at 1M msg/s?',
      ],
    },
  },

  {
    id: 'rabbitmq',
    cat: 'messaging',
    color: '#f97316',
    icon: '🐇',
    title: 'RabbitMQ',
    tag: 'The smart post office with a configurable sorting machine',
    overview:
      'RabbitMQ is a message broker that decouples producers from consumers using exchanges, bindings, and queues — the exchange applies routing logic so producers never need to know which queue or consumer receives their message. Unlike Kafka\'s log-based retention, RabbitMQ is a traditional queue: messages are deleted after successful acknowledgment, making it ideal for task distribution, per-message TTL, complex routing, and request-reply patterns that Kafka handles awkwardly.',
    components: [
      {
        name: 'Producer',
        icon: '📤',
        role: 'Publishes a message with a routing key to a named exchange; has no knowledge of downstream queues',
        detail:
          'The producer\'s only decisions are which exchange to publish to and what routing key to attach to the message — the broker\'s exchange then applies the routing logic independently. Publishers confirm delivery using publisher confirms (channel.confirmSelect()), which puts the channel in confirm mode and returns an ACK or NACK per message, enabling the producer to retry NACKed messages without polling.',
      },
      {
        name: 'Exchange',
        icon: '🔀',
        role: 'Receives messages from producers and routes them to one or more queues based on exchange type and binding rules',
        detail:
          'The exchange never stores messages — it is a pure routing function that executes in microseconds and drops messages that match no binding (unless an alternate exchange is configured). Exchange type is chosen at declaration time and is immutable; to change routing logic you declare a new exchange and migrate bindings, enabling zero-downtime routing changes by temporarily dual-publishing.',
      },
      {
        name: 'Binding',
        icon: '🔗',
        role: 'A rule associating an exchange to a queue with an optional routing key or pattern',
        detail:
          'Bindings are declared by the consumer-side application and stored in the broker\'s mnesia database; multiple bindings can connect the same exchange to the same queue with different keys, and the same queue can bind to multiple exchanges. In topic exchanges, binding keys use dot-separated words with * (exactly one word) and # (zero or more words) wildcards — order.*.placed matches order.us.placed but not order.placed, while order.# matches both.',
      },
      {
        name: 'Queue',
        icon: '📬',
        role: 'Durable or transient buffer that holds messages awaiting consumption; the unit of consumer assignment',
        detail:
          'Durable queues survive broker restarts (metadata persisted to disk) but messages inside must also be persistent (deliveryMode=2) to survive a restart. Classic queues store messages in memory with an optional disk overflow (Erlang\'s rabbit_variable_queue); Quorum queues (recommended since 3.8) use the Raft consensus protocol for replication across N nodes — more predictable durability than mirrored queues, which relied on synchronous mirroring and had split-brain issues.',
      },
      {
        name: 'Consumer',
        icon: '📥',
        role: 'Subscribes to a queue via a channel; receives pushed messages; sends ACK, NACK, or REJECT',
        detail:
          'RabbitMQ pushes messages to registered consumers (unlike Kafka\'s pull model) up to the prefetch count set by channel.basicQos(n) — without a prefetch limit, RabbitMQ pushes the entire queue to the first consumer\'s TCP buffer, starving other consumers in the same group. A consumer sends basicAck after successful processing, basicNack (requeue=true) to redeliver, or basicReject (requeue=false) to discard or route to a Dead Letter Exchange.',
      },
      {
        name: 'Virtual Host (vHost)',
        icon: '🏠',
        role: 'Logical isolation namespace within one RabbitMQ server; separate exchanges, queues, bindings, and permissions',
        detail:
          'vHosts are like database schemas — multiple applications share one RabbitMQ cluster but with full logical isolation: you cannot bind an exchange in vHost A to a queue in vHost B without a shovel. Each vHost has independent user permissions so a billing team\'s credentials cannot accidentally publish to the notification team\'s exchanges — a critical multi-tenant security boundary.',
      },
      {
        name: 'Dead Letter Exchange (DLX)',
        icon: '💀',
        role: 'Receives messages that are rejected, expired (per-message or queue-level TTL), or exceed a queue\'s max-length',
        detail:
          'A DLX is a normal exchange declared separately and attached to a queue via the x-dead-letter-exchange argument at queue creation time; you cannot add a DLX to an existing queue without deleting and recreating it. Dead-lettered messages carry additional headers (x-death) recording the original queue, reason (rejected/expired/maxlen), count, and timestamp — invaluable for debugging why messages are failing without losing them.',
      },
      {
        name: 'Acknowledgment',
        icon: '✅',
        role: 'Consumer signals to the broker whether a message was processed successfully, failed retriably, or should be discarded',
        detail:
          'Unacknowledged messages are held by the broker in an unacked state — they count against memory and the prefetch window but are not redelivered until the consumer channel closes or disconnects. autoAck=true (never set in production) sends an ACK the moment the broker delivers to the TCP socket, before the consumer has done any processing — a crash between delivery and processing loses the message silently.',
      },
    ],
    howItWorks:
      'A producer connects to a RabbitMQ broker, opens a channel, and publishes a message to a named exchange along with a routing key and optional headers. The exchange applies its routing algorithm: direct exchanges match the routing key exactly to binding keys; fanout exchanges copy the message to every bound queue regardless of key; topic exchanges match the routing key against binding patterns using * and # wildcards. The message lands in one or more queues where it waits, in FIFO order (unless priority queues are configured), for a consumer to receive it. RabbitMQ pushes the message to a subscribed consumer up to the channel\'s prefetch limit, and the message enters an unacked state — still held by the broker but not redelivered. The consumer processes the message and sends an ACK, at which point the broker permanently deletes it; a NACK or REJECT with requeue=true puts it back at the front of the queue for immediate redelivery (careful: this can create tight retry loops — use DLX with a delay queue instead). If a message expires via TTL or the queue exceeds max-length before acknowledgment, the broker routes it to the configured Dead Letter Exchange for inspection and replay.',
    decision: {
      choose: [
        'Complex routing logic: fan-out to N teams, topic-based subscriptions, or header-based routing that Kafka cannot express natively',
        'Per-message TTL — expire a notification after 1 hour if undelivered; Kafka only supports topic-level retention',
        'Priority queues — critical alerts must jump ahead of routine notifications in the same queue',
        'Request-reply RPC patterns — RabbitMQ has native support via reply-to and correlation-id headers',
        'Throughput under 50K msg/s with complex delivery semantics; RabbitMQ\'s management UI simplifies operations at this scale',
        'Teams already running Erlang/Elixir stacks where RabbitMQ integrates naturally',
      ],
      avoid: [
        'Message replay — RabbitMQ deletes messages after ACK; there is no way to re-consume a delivered message without publishing it again',
        'Fan-out to 50+ independent consumer groups reading the same data — each needs its own queue; managing 50 queue bindings becomes operational debt',
        'Sustained throughput above 100K msg/s — at this rate, Kafka\'s sequential disk I/O outperforms RabbitMQ\'s in-memory model',
        'Long message retention as a data lake — queues are not a substitute for object storage or a commit log',
        'Teams with no Erlang debugging experience — RabbitMQ internals (mnesia, Erlang processes) are opaque when things go wrong',
      ],
      vs: [
        {
          name: 'Kafka',
          when: 'Choose Kafka for replay, audit logs, high-throughput (>100K msg/s), or multiple independent consumers reading the same stream. Choose RabbitMQ for complex routing, per-message TTL, priority queues, or traditional task queue semantics with sub-50K msg/s.',
        },
        {
          name: 'BullMQ',
          when: 'Choose BullMQ when you need job-specific features: delayed execution, cron scheduling, retry backoff, and job progress tracking in a Node.js stack. RabbitMQ requires custom logic to replicate these. BullMQ depends on Redis; RabbitMQ is self-contained.',
        },
        {
          name: 'AWS SQS',
          when: 'Choose SQS for zero-ops simplicity in AWS. RabbitMQ gives richer routing (topic/fanout exchanges) and push-based delivery. SQS is poll-only, has a 14-day max retention, and lacks exchange routing — but you never manage a cluster.',
        },
        {
          name: 'Redis Pub/Sub',
          when: 'Choose Redis Pub/Sub only for ephemeral, fire-and-forget fan-out (live presence, dashboard pushes). It has no persistence, no routing logic, and no delivery guarantees. RabbitMQ\'s smallest unit of durability is still stronger than Redis Pub/Sub\'s best-effort delivery.',
        },
      ],
    },
    failures: [
      {
        name: 'Queue Saturation',
        cause: 'Consumers are slower than producers — under-provisioned consumer instances, a slow downstream database, or a burst of traffic that exceeds steady-state capacity; RabbitMQ holds undelivered messages in memory first, then pages to disk',
        symptom: 'Queue depth metric grows monotonically; RabbitMQ management UI shows memory climbing toward the vm_memory_high_watermark (default 40% of system RAM); at the watermark, the broker triggers flow control and blocks producers, causing cascading timeouts upstream',
        fix: 'Scale out consumers horizontally — RabbitMQ\'s competing consumer model means adding a new consumer process immediately helps. Set x-max-length and x-overflow=reject-publish-dlx so the queue doesn\'t grow unbounded; apply back-pressure to producers instead of losing messages silently. Pre-size queues and set memory alarms at 60% to alert before the flow-control watermark is hit.',
        severity: 'critical',
      },
      {
        name: 'Unacked Message Buildup',
        cause: 'Consumers have no prefetch limit (channel.basicQos not called) so RabbitMQ pushes the entire queue to one consumer\'s TCP buffer; the consumer holds thousands of unacked messages but is blocked processing or has stalled, so no ACKs come back',
        symptom: 'RabbitMQ UI shows "Unacked" count equal to queue depth; memory usage is high despite no messages in the "Ready" state; the queue appears empty to other consumers even though nothing is being processed',
        fix: 'Always set channel.basicQos(prefetchCount) — start at 10-50 and tune up. The prefetch count limits how many unacked messages the broker will push per consumer channel, distributing load across all consumers. Reconnect stalled consumers by monitoring consumer channel age and closing channels idle for >60 seconds without ACKs.',
        severity: 'high',
      },
      {
        name: 'Split-Brain in HA Clusters',
        cause: 'A network partition between nodes of a classic mirrored queue cluster causes both sides to accept writes independently; when the partition heals, both nodes claim to be master with divergent message histories',
        symptom: 'Duplicate messages processed; messages silently lost depending on which side the client reconnects to; RabbitMQ management UI shows a cluster partition warning in the overview page',
        fix: 'Migrate to Quorum Queues (x-queue-type=quorum), which use Raft consensus — a partition is safe because only the Raft leader accepts writes and the majority quorum prevents split-brain by design. For classic mirrored queues, set cluster_partition_handling=pause_minority so the minority side pauses rather than accepting writes during a partition.',
        severity: 'critical',
      },
      {
        name: 'DLX Flooding',
        cause: 'A consumer bug causes it to NACK or REJECT every message it receives; messages route to the Dead Letter Exchange and accumulate in the DLQ; nobody is monitoring the DLQ, so it grows until the broker hits memory limits',
        symptom: 'The main queue drains suspiciously fast; the DLQ queue depth climbs; effective message processing rate appears to be high but no business work is actually completing; memory pressure on the broker',
        fix: 'Add an alert on DLQ depth (> 1000 messages in 5 minutes = page). Set a TTL on the DLQ itself (x-message-ttl) as a last resort to prevent unbounded growth. Before deploying consumer changes, test against a staging DLQ. Build a DLQ replay tool so engineers can inspect, fix, and republish dead-lettered messages to the main queue without manual broker manipulation.',
        severity: 'high',
      },
      {
        name: 'Shovel/Federation Misconfiguration',
        cause: 'A Shovel plugin is configured to move messages from Queue A on Cluster 1 to Exchange B on Cluster 2, but Exchange B is bound back to a queue that shovels back to Cluster 1 — creating a routing loop; or a federation link between two clusters mirrors an exchange that feeds back to itself',
        symptom: 'A single message is delivered exponentially many times; x-death header shows a redelivery count in the thousands; broker CPU and network spike; RabbitMQ logs show "message rejected as already processed" or the broker runs out of memory',
        fix: 'Add a dead-letter limit (x-delivery-limit, available in Quorum Queues) so a message is discarded after N redeliveries rather than looping forever. Audit all Shovel and Federation configurations in staging before deploying. Use the x-death header redelivery count to detect looping messages in consumers and REJECT (requeue=false) any message exceeding a threshold.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏣📬🔀',
      t: 'The Post Office with a Smart Sorting Machine',
      tx: "Picture a post office with a smart sorting machine at the entrance. Every piece of mail arrives at the machine — the sorting machine (EXCHANGE) reads the address (ROUTING KEY) and decides which PO box (QUEUE) to put it in. The sender doesn't know or care which PO box exists — they just address the envelope and drop it off.\n\nNow imagine different sorting rules. A DIRECT sorting machine puts letters in the exact PO box matching the address — a letter marked 'billing' goes only to the billing box. A FANOUT machine ignores the address entirely and drops a copy in every PO box — a company-wide announcement. A TOPIC machine reads a structured address like 'us.west.orders' and routes it to any box subscribed to 'us.*.*' or '*.*.orders' — wildcard matching.\n\nThe recipient (CONSUMER) checks their PO box and picks up the mail. Crucially, they sign for it (ACK). Until they sign, the post office keeps a record that this piece of mail is outstanding — if the recipient goes on holiday (consumer crashes), the post office redelivers it when they return. If the letter is damaged and undeliverable, it goes into a DEAD LETTER box (DLX) for the postmaster to inspect.\n\nVirtual Hosts (vHosts) are like renting separate post office buildings — the billing team and the notifications team share the same physical building but have completely separate PO boxes, sorting machines, and keys. A billing team credential cannot accidentally pick up a notification team letter.\n\nThe key difference from Kafka: once you sign for the letter, it is destroyed. There is no archive copy. The post office is not a library. This is the right model when you want messages processed exactly once and then gone — not when you need to re-read the history.",
      s: 'The expert insight: RabbitMQ\'s power is in the exchange layer, not the queue layer. Beginners put all routing logic in their application code and use a single fanout queue. Experts design their exchange topology first — choosing direct, topic, or fanout based on the routing semantics — and let the broker do the routing for free. A well-designed topic exchange with three binding patterns can replace hundreds of lines of application-side routing code and eliminates the coupling between producers and consumers completely.',
    },
    te: {
      def: 'RabbitMQ is an AMQP-compliant message broker that routes messages from producers to consumers via exchanges and queues. Producers publish to exchanges with routing keys; exchanges apply type-specific routing rules to deliver messages to bound queues; consumers ACK messages to confirm processing.',
      types: [
        { n: 'Direct Exchange', d: 'Routes message to queues whose binding key exactly matches the message\'s routing key. Point-to-point delivery. Example: routing key "payment.failed" → queue "payment-retry".' },
        { n: 'Fanout Exchange', d: 'Broadcasts every message to all bound queues, ignoring routing key entirely. Use for pub/sub: a new order event fan-out to inventory, email, and analytics queues simultaneously.' },
        { n: 'Topic Exchange', d: 'Routes by matching routing key to binding patterns using * (one word) and # (zero or more words). Most flexible: "order.us.placed" matches binding "order.*.placed" and "order.#". The workhorse exchange for most real systems.' },
        { n: 'Headers Exchange', d: 'Routes based on message header key-value pairs instead of routing key. Supports x-match=all (all headers must match) or x-match=any. Rarely used — topic exchange handles most routing needs more cleanly.' },
        { n: 'Quorum Queue', d: 'Replication via Raft consensus across an odd number of nodes (3 or 5). Preferred over classic mirrored queues since RabbitMQ 3.8 — no split-brain risk, predictable durability guarantees, supports delivery limits.' },
      ],
      when: 'Use RabbitMQ for task queues requiring complex routing, per-message TTL, priority queuing, or request-reply patterns. Best suited for transactional workloads under 50K msg/s where message durability and delivery semantics matter more than raw throughput or replay capability.',
      trade: 'RabbitMQ offers rich routing semantics, per-message TTL, and push-based delivery in a mature, battle-tested broker — but messages are gone after ACK (no replay), scaling above 100K msg/s requires careful queue architecture, and the Erlang runtime makes deep debugging a specialist skill.',
      code: `import amqplib, { Channel, Connection } from 'amqplib';

const EXCHANGE   = 'orders';
const QUEUE_MAIN = 'order-processor';
const QUEUE_DLQ  = 'order-processor.dlq';
const DLX        = 'orders.dlx';

async function setup(ch: Channel) {
  // Dead letter exchange — receives rejected/expired messages
  await ch.assertExchange(DLX, 'direct', { durable: true });
  await ch.assertQueue(QUEUE_DLQ, { durable: true });
  await ch.bindQueue(QUEUE_DLQ, DLX, 'order-processor');

  // Topic exchange — routes order.*.placed to order-processor queue
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  await ch.assertQueue(QUEUE_MAIN, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DLX,         // route failed messages to DLX
      'x-dead-letter-routing-key': 'order-processor',
      'x-message-ttl': 3_600_000,            // 1h: expire stale orders
      'x-max-length': 100_000,               // prevent unbounded growth
      'x-overflow': 'reject-publish-dlx',    // back-pressure: reject when full
      'x-queue-type': 'quorum',              // Raft replication; no split-brain
    },
  });
  await ch.bindQueue(QUEUE_MAIN, EXCHANGE, 'order.*.placed');
}

async function startConsumer() {
  const conn: Connection = await amqplib.connect('amqp://rabbitmq:5672');
  const ch: Channel = await conn.createChannel();
  await ch.prefetch(20);  // max 20 unacked messages per consumer — critical
  await setup(ch);

  ch.consume(QUEUE_MAIN, async (msg) => {
    if (!msg) return;
    try {
      const order = JSON.parse(msg.content.toString());
      await processOrder(order);              // idempotent business logic
      ch.ack(msg);                            // delete from broker on success
    } catch (err) {
      const retries = (msg.properties.headers['x-death']?.[0]?.count ?? 0);
      if (retries >= 3) {
        ch.reject(msg, false);               // discard → routes to DLX
      } else {
        ch.nack(msg, false, false);          // reject without requeue → DLX handles backoff
      }
    }
  });
}`,
      rw: {
        ex: [
          'Instagram notification delivery (RabbitMQ fanout exchange to push services)',
          'Zalando event-driven order processing (topic exchange per order lifecycle stage)',
          'SoundCloud audio transcoding pipeline (direct exchange to transcoder queues)',
          'GitHub (uses RabbitMQ for internal service communication)',
        ],
        cs: 'Zalando, Europe\'s largest online fashion platform, uses RabbitMQ topic exchanges as the backbone of its order processing pipeline. A single "order.de.placed" event fans through bindings to inventory reservation, payment capture, warehouse picking, and customer notification queues — all independent consumers with independent scaling. When a flash sale causes a 20x traffic spike, only the warehouse picking consumer adds instances; the exchange topology requires no change. Quorum queues ensure that even if a RabbitMQ node dies during peak load, no order event is lost and the cluster self-heals without operator intervention.',
      },
    },
    interview: {
      q: 'When would you choose RabbitMQ over Kafka? Give me a concrete example.',
      a: 'I\'d choose RabbitMQ when I need <strong>per-message routing logic, per-message TTL, or traditional task queue semantics</strong> — Kafka doesn\'t support any of these natively. Concrete example: a notification service that sends emails, SMS, and push based on user preferences. A topic exchange routes "notification.email.marketing" to the email queue, "notification.sms.transactional" to the SMS queue, and "notification.push.*" to the push queue — the routing lives in the broker, not in application code. Each notification has a 1-hour TTL after which it\'s pointless to deliver. Kafka would require me to build this routing logic in consumers and fake per-message TTL with application-side filtering. I\'d only switch to Kafka if I needed <strong>replay</strong> (e.g., resend all notifications from the last 24 hours after an outage) or throughput above 100K msg/s.',
      fu: [
        'How do you prevent a RabbitMQ queue from growing unbounded during a consumer outage?',
        'Explain the difference between quorum queues and classic mirrored queues. Which would you use in production today?',
        'A consumer is processing messages but the queue depth never goes down. What are 3 possible causes?',
        'How would you implement a retry mechanism with exponential backoff in RabbitMQ without a custom delay queue plugin?',
        'When would you use multiple vHosts vs. multiple RabbitMQ clusters?',
        'Your DLQ has 500K messages. How do you replay them without overwhelming the main queue?',
      ],
    },
  },

  {
    id: 'bullmq',
    cat: 'messaging',
    color: '#ef4444',
    icon: '🐂',
    title: 'BullMQ',
    tag: 'Redis-backed job queue with first-class retry, scheduling, and flow semantics',
    overview:
      'BullMQ is a Node.js job and message queue library built on Redis that gives every unit of work (a Job) first-class attributes: priority, retry count, backoff strategy, TTL, delay, and parent-child dependencies. Where Kafka and RabbitMQ model messages as streams or envelopes, BullMQ models them as jobs — discrete tasks with lifecycle state (waiting, active, completed, failed) that you can inspect, retry, or reschedule individually from a dashboard.',
    components: [
      {
        name: 'Queue',
        icon: '📋',
        role: 'Named container for jobs stored in Redis sorted sets and lists; the entry point for job submission',
        detail:
          'A BullMQ Queue uses several Redis data structures under the hood: a list for waiting jobs, a sorted set for delayed jobs (scored by run-at timestamp), a sorted set for prioritized jobs (scored by priority), and hash maps for job data. When you call queue.add(), BullMQ atomically inserts the job into the appropriate structure using a Lua script — atomic insertion prevents partial state even under Redis failover.',
      },
      {
        name: 'Job',
        icon: '📄',
        role: 'Unit of work with a typed data payload, priority (lower integer = higher priority), retry configuration, and lifecycle state',
        detail:
          'A Job\'s data payload is serialized to JSON and stored in a Redis hash (bull:{queue}:{jobId}) alongside metadata: attempts, timestamp, processedOn, finishedOn, and returnValue. Priority queues in BullMQ use a sorted set scored by a composite of priority and timestamp so equal-priority jobs are FIFO, preventing starvation of lower-priority jobs when the queue is lightly loaded.',
      },
      {
        name: 'Worker',
        icon: '⚙️',
        role: 'Process that blocks on the queue, picks the next eligible job, and runs your processor function with configurable concurrency',
        detail:
          'A Worker acquires a job by moving it from the wait list to the active set with a distributed lock (a Redis string with a TTL equal to lockDuration, default 30s) — this is the stall detection mechanism. The Worker extends the lock via a background timer (lockRenewTime = lockDuration / 2) as long as the job is still processing; if the Worker crashes and stops renewing, the lock expires and the job is reclaimed.',
      },
      {
        name: 'Scheduler',
        icon: '⏰',
        role: 'Manages repeatable jobs defined by cron expression or fixed interval; stores next-run time in a Redis sorted set',
        detail:
          'The Scheduler stores repeatable job templates in a Redis sorted set scored by the next scheduled run timestamp; a background polling loop scans for jobs whose score is <= now and enqueues them as regular jobs. Using cron expressions (e.g., \'0 2 * * *\') requires a shared clock — if app servers have >1 second clock skew, two instances may both see the job as "due" and enqueue it twice, causing duplicate runs.',
      },
      {
        name: 'Flow',
        icon: '🌳',
        role: 'Parent-child job graph where the parent job is enqueued only after all its children complete successfully',
        detail:
          'BullMQ Flows use a FlowProducer to atomically add a parent job in a "waiting-children" state along with N child jobs across any combination of queues; the parent transitions to "waiting" only when its children-count reaches zero. This enables data pipeline DAGs without external orchestrators — e.g., a "generate-report" parent waits for "fetch-sales-data", "fetch-inventory-data", and "fetch-user-data" children to all complete before assembling the report.',
      },
      {
        name: 'QueueEvents',
        icon: '📡',
        role: 'Event emitter that subscribes to queue activity (completed, failed, progress, stalled) via Redis pub/sub for monitoring and webhooks',
        detail:
          'QueueEvents uses a Redis keyspace notification channel unique to each queue; it does not poll but instead subscribes to a stream of events emitted by Workers as they process jobs. This allows a separate monitoring process to track all queue activity without impacting worker performance — the worker emits events, the QueueEvents listener consumes them, and neither blocks the other.',
      },
      {
        name: 'Stalled Job Detection',
        icon: '🔍',
        role: 'Watchdog that periodically scans the active set for jobs whose locks have expired and returns them to the wait queue',
        detail:
          'Every stalledInterval milliseconds (default 30s), BullMQ runs a Lua script on the active set comparing each active job\'s lock expiry against the current time; jobs with expired locks are moved back to the wait list and their attempt count is incremented. This covers the crash scenario but not the infinite loop — a Worker in an infinite loop keeps renewing its lock and the job stays active forever; set a job-level timeout (opts.timeout) to forcibly fail such jobs.',
      },
      {
        name: 'Dead Letter Queue',
        icon: '💀',
        role: 'The "failed" set in Redis where jobs exceeding maxAttempts are moved; inspectable, reprocessable, and purgeable via BullMQ Board or the API',
        detail:
          'Failed jobs are stored in the bull:{queue}:failed sorted set scored by timestamp; BullMQ stores the full job data, payload, and the error stack trace from the last failure. You can move failed jobs back to the wait queue with job.retry(), run them immediately with a specific worker, or bulk-retry all failed jobs matching a filter — enabling surgical recovery without reprocessing everything.',
      },
    ],
    howItWorks:
      'When a job is added, BullMQ executes a Lua script that atomically inserts the job data into a Redis hash and pushes the job ID into the appropriate sorted set or list: delayed jobs enter a sorted set scored by their run-at timestamp, prioritized jobs enter a sorted set scored by priority+timestamp, and immediate jobs enter a list. Workers block on BRPOPLPUSH (or BLMOVE in newer Redis) to atomically pop the next ready job and push it into the active set, then set a Redis lock key with TTL=lockDuration. The worker processor function runs, and a background timer renews the lock every lockDuration/2 ms. On success, the worker removes the job from active, stores it in the completed set (or discards it if removeOnComplete=true), and emits a completed event. On failure, the worker increments attempt count: if attempts < maxAttempts, the job re-enters the delayed set with an exponential backoff offset; if attempts === maxAttempts, it moves to the failed set. A stalled job scanner runs every stalledInterval checking for active jobs with expired locks and returning them to the wait queue for retry.',
    decision: {
      choose: [
        'Background job processing in a Node.js stack: image resizing, email sending, PDF generation, webhook delivery',
        'You need per-job retry with exponential backoff (Kafka has no native retry concept)',
        'Cron-style recurring jobs (nightly reports, cache warm-up, billing cycles)',
        'Job priority — VIP user export runs ahead of bulk export jobs',
        'Job progress tracking and real-time status updates via QueueEvents',
        'Parent-child job dependencies: generate report only after all data-fetch jobs complete (Flows)',
        'You already run Redis and want zero additional infrastructure for a queue',
      ],
      avoid: [
        'Throughput above ~10K jobs/sec — Redis single-thread model becomes the bottleneck; Kafka scales to millions/sec',
        'Fan-out to many consumers reading the same job — BullMQ is point-to-point; use Kafka or RabbitMQ fanout for event streaming',
        'Long message retention/replay — completed jobs are deleted (removeOnComplete); failed jobs age out; no commit log semantics',
        'Polyglot environments — BullMQ is Node.js only; Python/Go services need a different queue',
        'When Redis is unavailable — BullMQ has no fallback storage; a Redis outage stops all job processing',
        'Strict ordering across jobs — BullMQ\'s priority + concurrency model does not guarantee FIFO across all job types',
      ],
      vs: [
        {
          name: 'Kafka',
          when: 'Choose Kafka for high-throughput event streaming, replay, or fan-out to multiple consumer groups. Choose BullMQ for task-queue semantics: retry backoff, scheduling, priority, and job lifecycle visibility in a Node.js app.',
        },
        {
          name: 'RabbitMQ',
          when: 'Choose RabbitMQ for polyglot consumers, complex exchange routing, or when you need a standalone broker without Redis. Choose BullMQ for richer job lifecycle management, cron scheduling, and Flow dependencies in a Node.js-first stack.',
        },
        {
          name: 'Celery (Python)',
          when: 'Celery is the BullMQ equivalent for Python. Both use Redis (or RabbitMQ) as the broker. Choose BullMQ in Node.js/TypeScript stacks; choose Celery in Python/Django stacks.',
        },
        {
          name: 'AWS SQS + Lambda',
          when: 'Choose SQS+Lambda for serverless, zero-ops job processing at variable scale. Choose BullMQ when you need priority queues, Flow DAGs, cron scheduling, or BullMQ Board visibility — SQS lacks all of these natively.',
        },
      ],
    },
    failures: [
      {
        name: 'Stalled Jobs',
        cause: 'A Worker process crashes, is OOM-killed, or is stuck in a long GC pause longer than lockDuration (default 30s) without renewing its lock; the job stays in the active set until the stalled check reclaims it',
        symptom: 'Jobs appear in the "active" state in BullMQ Board for longer than expected; the same job is processed multiple times if it has side effects (e.g., charge a customer) before the crash; attempt count increments unexpectedly',
        fix: 'Set lockDuration to 2x your p99 processing time. Implement idempotency in all job processors using the job.id as an idempotency key (store in DB before side effects, check before processing). Enable removeOnComplete to keep the active set small. Set opts.timeout to forcibly fail jobs that exceed a wall-clock limit, preventing infinite-loop stalls.',
        severity: 'critical',
      },
      {
        name: 'Redis Memory Exhaustion',
        cause: 'removeOnComplete and removeOnFail are not configured; every completed and failed job accumulates its full payload in Redis sorted sets indefinitely; Redis grows until it hits maxmemory and starts evicting keys or OOM crashes',
        symptom: 'Redis memory usage grows linearly with job volume; eventually Redis starts evicting job data (if maxmemory-policy=allkeys-lru), causing BullMQ to throw errors like "Missing job data"; or Redis crashes entirely halting all job processing',
        fix: 'Always configure removeOnComplete: { count: 1000, age: 86400 } (keep last 1000 completed jobs for up to 24h) and removeOnFail: { count: 5000 } in production. Monitor Redis memory with an alert at 70% usage. Use Redis keyspace sampling to identify the largest key patterns when memory grows unexpectedly.',
        severity: 'high',
      },
      {
        name: 'Priority Inversion',
        cause: 'A large batch of medium-priority jobs is added before a high-priority job; the Worker\'s concurrency slots are all occupied with medium-priority jobs; the high-priority job waits in the queue despite having higher priority',
        symptom: 'High-priority jobs (priority=1) have higher latency than low-priority jobs (priority=100) during batch processing; SLA violations for VIP users despite the priority queue configuration',
        fix: 'Use separate queues for different priority tiers (criticalQueue, normalQueue, bulkQueue) and create separate Workers with different concurrency settings — critical gets 20 concurrency slots, bulk gets 2. This guarantees critical jobs always have dedicated workers. Reserve BullMQ priority within a single queue for fine-grained ordering within the same tier, not across wildly different workloads.',
        severity: 'medium',
      },
      {
        name: 'Concurrency Overload',
        cause: 'Worker concurrency is set too high (e.g., 500) on a Redis instance with a small connection pool; each concurrent job holds a Redis connection for lock renewal, job updates, and event emission; connection pool exhausted; all workers block waiting for connections',
        symptom: 'Worker processes appear healthy but no jobs complete; Redis client timeout errors appear in logs; BullMQ Board shows a large active set that never drains; Redis connection count in the Redis INFO stats near the maxclients limit',
        fix: 'Size concurrency based on Redis connection capacity: if Redis maxclients=10000 and you have 50 worker processes, each worker should have concurrency ≤ 100 (50×100=5000, leaving headroom). Use a separate Redis instance (or cluster) for BullMQ if Redis is shared with application caching. Start with concurrency=5 and profile CPU, memory, and Redis connections under load before increasing.',
        severity: 'high',
      },
      {
        name: 'Repeatable Job Drift',
        cause: 'Multiple application server instances each create the same repeatable job definition (same jobId/name); BullMQ\'s scheduler deduplicates by the job key, but clock skew >1s between servers causes both instances to see the job as due simultaneously and each enqueue it independently',
        symptom: 'A nightly report job runs twice; a cron-triggered cache warm-up hammers the database twice; billing jobs double-charge customers; the failed job count suddenly doubles after a deployment that added a new app server',
        fix: 'Designate a single application instance (via Redis-based leader election or a startup flag) as the scheduler — only this instance calls addBullMQRepeatableJob. Alternatively, use a dedicated scheduler service (e.g., a Kubernetes CronJob that calls the BullMQ API) rather than having every app server manage repeatables. Always give repeatable jobs a unique, stable jobId so BullMQ can deduplicate across instances.',
        severity: 'high',
      },
    ],
    a: {
      v: '🍽️🎫👨‍🍳',
      t: 'A Restaurant Kitchen Ticket System',
      tx: "Picture a busy restaurant on a Saturday night. Customers place orders at the front (your API adds jobs to the queue). The order is printed as a ticket and sent to the kitchen printer (BullMQ adds the job to Redis). Each chef grabs the next ticket from the printer based on urgency — a 'ALLERGY ALERT' ticket jumps to the front of the stack (job priority).\n\nSome dishes need prep time before cooking — a braise must marinate for 4 hours before the chef can work on it. Those tickets go on the board with a future time stamp: 'Start at 6pm' (delayed jobs). The cron for the 'daily specials board update' runs every morning at 10am regardless of whether customers are there — that's the Scheduler.\n\nIf a dish goes wrong — the steak is overcooked — the chef tries again up to 3 times, waiting a bit longer between each attempt (exponential backoff retry). After the 3rd failure, the dish goes to a special window labeled 'Failed Orders' (Dead Letter Queue) where the head chef reviews what went wrong. Nobody throws it in the trash; it stays there for inspection.\n\nA complex meal — like a full tasting menu — can't be plated until every course's prep is done. The 'plate and serve' job waits for the 'prep amuse-bouche', 'sous vide tenderloin', and 'temper chocolate' jobs to all complete first. That's a BullMQ Flow — a parent job that waits for all its children.\n\nBullMQ Board is the kitchen's order screen that every chef watches — you can see every ticket: waiting, in progress, done, or failed — and hit 'remake' on any failed dish with a single click.",
      s: 'The expert insight: the most dangerous BullMQ mistake is not setting removeOnComplete and removeOnFail — your Redis will fill up silently until it OOM-crashes at 3am. The second most dangerous mistake is not implementing idempotency in your processor — stalled job recovery will re-run your job and if it charges a credit card or sends an email without checking "did I already do this?", you will have very unhappy users. Treat every BullMQ job processor as if it will run at least twice.',
    },
    te: {
      def: 'BullMQ is a Node.js/TypeScript job queue library backed by Redis. It models each unit of work as a Job with typed data, lifecycle state, priority, retry configuration, and delay. Workers process jobs with configurable concurrency; a Scheduler handles repeatable cron jobs; Flows model parent-child dependencies across queues.',
      types: [
        { n: 'Immediate Job', d: 'Added to the wait list and processed as soon as a Worker concurrency slot is available. The default — used for webhook delivery, email sending, image resize.' },
        { n: 'Delayed Job', d: 'Scheduled to run after a fixed delay (opts.delay in ms). Stored in a sorted set scored by run-at timestamp. Used for: send a follow-up email 2 days after signup, retry a failed payment in 1 hour.' },
        { n: 'Repeatable Job', d: 'Recurring job defined by cron expression or interval. BullMQ re-enqueues it after each run. Used for: nightly reports, cache warm-up, subscription billing cycles.' },
        { n: 'Priority Job', d: 'Jobs with a lower integer priority value (0 = highest) are dequeued before higher-priority jobs. Within the same priority, jobs are FIFO. Used for: VIP users jump ahead of batch export jobs.' },
        { n: 'Flow (Parent-Child)', d: 'A FlowProducer atomically enqueues a parent job + N child jobs; parent waits in "waiting-children" state until all children complete. Used for: data pipeline DAGs, multi-step report generation.' },
      ],
      when: 'Use BullMQ for background job processing in Node.js applications where you need retry backoff, scheduling, priority, job visibility, or parent-child dependencies. It is the default choice for Node.js task queues when you already run Redis.',
      trade: 'BullMQ trades broker simplicity (Redis does double duty) and rich job semantics (retry, schedule, priority, flow) for limited throughput (<10K jobs/s), Node.js exclusivity, and no replay semantics — completed jobs are gone. Perfect for task queues; wrong choice for high-throughput event streaming.',
      code: `import { Queue, Worker, FlowProducer, QueueEvents } from 'bullmq';

const connection = { host: 'redis', port: 6379 };

// ── Queue setup ────────────────────────────────────────────
const exportQueue = new Queue('pdf-exports', { connection });

// Add a high-priority job with exponential backoff retry
await exportQueue.add(
  'generate-invoice',
  { userId: 'u_123', invoiceId: 'inv_456' },
  {
    priority: 1,                          // lower = higher priority
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },  // 2s, 4s, 8s, 16s, 32s
    removeOnComplete: { count: 500, age: 3600 },    // keep last 500, max 1h
    removeOnFail: { count: 2000 },                  // retain failed for inspection
  }
);

// ── Worker with concurrency control ───────────────────────
const worker = new Worker(
  'pdf-exports',
  async (job) => {
    job.updateProgress(10);
    const data = await fetchInvoiceData(job.data.invoiceId);    // idempotent fetch
    job.updateProgress(50);
    const pdfUrl = await renderPdf(data);                       // idempotent render
    job.updateProgress(90);
    await markInvoiceSent(job.data.invoiceId, pdfUrl);          // idempotent upsert
    return { pdfUrl };
  },
  {
    connection,
    concurrency: 15,                        // tune to Redis connection capacity
    lockDuration: 60_000,                   // 60s — must be > p99 processing time
  }
);

// ── Flow: parent waits for all children ───────────────────
const flow = new FlowProducer({ connection });
await flow.add({
  name: 'compile-report',
  queueName: 'reports',
  data: { reportId: 'r_789' },
  children: [
    { name: 'fetch-sales',     queueName: 'data-fetch', data: { type: 'sales' } },
    { name: 'fetch-inventory', queueName: 'data-fetch', data: { type: 'inventory' } },
    { name: 'fetch-users',     queueName: 'data-fetch', data: { type: 'users' } },
  ],
});

// ── QueueEvents: monitoring + webhooks ────────────────────
const events = new QueueEvents('pdf-exports', { connection });
events.on('completed', ({ jobId, returnvalue }) => {
  console.log(\`Job \${jobId} done:\`, returnvalue);
});
events.on('failed', ({ jobId, failedReason }) => {
  alertOncall(\`Job \${jobId} failed: \${failedReason}\`);
});`,
      rw: {
        ex: [
          'Vercel build pipeline (every git push triggers a BullMQ build job)',
          'Figma export service (async rendering of PNG/PDF/SVG exports)',
          'Shopify background job processing (order confirmations, inventory sync)',
          'GitHub Actions internal queue management for CI runners',
        ],
        cs: 'Vercel\'s build pipeline processes millions of git-push-triggered deployments daily using BullMQ. Each push creates a build job with the git SHA, project config, and environment variables. Jobs are prioritized so Pro plan users\' builds run before hobby builds. The Flow feature models the build pipeline: a parent "deploy" job waits for children "build-frontend", "build-api", and "run-checks" to all succeed before promoting the deployment. Failed builds retain their full log output in the failed job set for debugging, and engineers can retry individual build jobs from Vercel\'s dashboard without re-triggering the entire git workflow.',
      },
    },
    interview: {
      q: 'Your BullMQ workers keep processing the same job multiple times. Walk me through how you debug and fix this.',
      a: 'The first thing I check is whether this is a <strong>stalled job recovery</strong> — if the worker crashes or the lockDuration is shorter than processing time, BullMQ reclaims the active job and re-queues it. I\'d look at the job\'s attemptsMade count in BullMQ Board; if it\'s > 1, the job was retried. Next I check the job processor for <strong>idempotency</strong> — if the processor is not idempotent, duplicate processing causes real damage regardless of the root cause. I\'d add a check like "has this invoiceId already been processed?" using a DB unique constraint or a Redis SET NX before any side effects. Then I\'d increase lockDuration to 2x the p99 processing time and add opts.timeout to forcibly fail infinite-loop jobs. Finally, I\'d investigate if <strong>multiple scheduler instances</strong> are each enqueuing the same repeatable job — I\'d fix this by designating a single scheduler process with Redis-based leader election.',
      fu: [
        'What is lockDuration and how does it relate to stalled job detection?',
        'How would you implement idempotency in a BullMQ job that charges a credit card?',
        'Explain BullMQ Flows — how does a parent job know when all its children have completed?',
        'Your Redis memory is at 95%. What BullMQ settings do you change first and why?',
        'How would you migrate from BullMQ to Kafka if your job volume grew to 100K/sec?',
        'A job is stuck in the active state for 2 hours. Walk me through diagnosing whether the worker is hung or the lock renewal is failing.',
      ],
    },
  },

  {
    id: 'queuepatterns',
    cat: 'messaging',
    color: '#8b5cf6',
    icon: '📐',
    title: 'Queue Patterns',
    tag: 'The rules that make any queue reliable at scale',
    overview:
      'Queue patterns are implementation strategies that solve the fundamental reliability problems of distributed messaging — dual-write inconsistency, at-least-once duplication, large payload overhead, and partial failure in long-running transactions. These patterns are broker-agnostic: they work with Kafka, RabbitMQ, SQS, or BullMQ, and knowing when to apply each one is what separates engineers who build queues from engineers who build reliable queues.',
    components: [
      {
        name: 'Outbox Pattern',
        icon: '📤',
        role: 'Solves the dual-write problem by writing the event to an outbox table in the same DB transaction as the business data, then publishing to the queue as a separate step',
        detail:
          'The pattern exploits the ACID guarantee of your existing database: the business record and the outbox row are written in a single transaction so they are always consistent with each other. A relay process (either Change Data Capture via Debezium reading the DB\'s WAL, or a polling loop querying outbox rows with status=PENDING) reads the outbox and publishes to the queue, then marks the row as PUBLISHED — the relay is idempotent so retries are safe even if the queue publish succeeds but the DB update fails.',
      },
      {
        name: 'Saga Pattern',
        icon: '📖',
        role: 'Models a long-running distributed transaction as a sequence of local transactions with a compensating transaction for each step to handle rollback',
        detail:
          'A choreography-based Saga has each service publish an event when its local transaction completes, and other services listen for these events to trigger their own local transactions — no central coordinator, but difficult to debug and reason about failure paths. An orchestration-based Saga uses a central saga orchestrator (a state machine, often a durable workflow engine like Temporal) that commands each step and handles compensation logic, making the failure path explicit and observable but introducing a coordination bottleneck.',
      },
      {
        name: 'Competing Consumers',
        icon: '👥',
        role: 'Multiple consumer instances read from the same queue; each message is processed by exactly one consumer; adds horizontal scale without coordination',
        detail:
          'Competing consumers work because the queue guarantees exclusive delivery: once a message is in-flight to Consumer A (via RabbitMQ\'s prefetch lock or BullMQ\'s Redis lock), it will not be delivered to Consumer B. The pattern requires stateless consumers — any consumer must be able to process any message without shared in-memory state, because you cannot predict which consumer receives which message. State is externalized to the database.',
      },
      {
        name: 'Dead Letter Queue (DLQ)',
        icon: '💀',
        role: 'A separate queue that receives messages the main consumer cannot process; prevents a bad message from blocking the entire queue; enables post-mortem analysis and controlled replay',
        detail:
          'A DLQ is not a garbage bin — it is a quarantine zone with a defined process: alert on DLQ depth > threshold, inspect the dead-lettered message and its error headers, fix the root cause (bug in consumer, schema change, third-party outage), then replay the messages back to the main queue. Without a replay strategy, the DLQ is useless; without monitoring, the DLQ is a silent data graveyard.',
      },
      {
        name: 'Claim Check',
        icon: '🎫',
        role: 'Store a large payload in object storage (S3, GCS) and put only a reference (URL or object ID) in the queue message; keeps message size small and brokers fast',
        detail:
          'The Claim Check pattern references the luggage-claim analogy: you check your heavy bag (large payload), receive a ticket (reference), and retrieve the bag at the destination. The producer stores the payload to S3 first, then publishes the S3 URL to the queue; the consumer receives the URL, downloads the payload, processes it, and deletes the S3 object. The queue message stays under 1KB regardless of payload size — Kafka\'s default max.message.bytes is 1MB and performance degrades significantly above 100KB.',
      },
      {
        name: 'Idempotency Key',
        icon: '🔑',
        role: 'A unique identifier attached to every operation that allows the consumer to detect and skip duplicate processing safely',
        detail:
          'An idempotency key is typically the message ID or a business-level UUID (paymentId, orderId) written to a deduplication table before executing the side effect. The consumer checks: "does a row with this idempotency_key exist in processed_events?" — if yes, return the cached result without re-executing; if no, execute and insert the row in the same DB transaction as the business operation. This makes at-least-once delivery safe because re-processing the same message produces the same observable outcome.',
      },
    ],
    howItWorks:
      'Reliable queue-based systems layer these patterns together rather than applying them in isolation. The Outbox Pattern ensures events are published if and only if the corresponding business transaction commits — solving the foundational dual-write problem at the producer side. Idempotency Keys solve the dual-delivery problem at the consumer side — at-least-once delivery (the default guarantee of Kafka, RabbitMQ, and SQS) becomes effectively exactly-once when consumers are idempotent. The Competing Consumers pattern scales consumption linearly by adding stateless worker instances; the DLQ catches the messages that no consumer could process and quarantines them without blocking healthy messages. The Claim Check pattern keeps the broker fast by offloading payloads to object storage, and the Saga pattern coordinates multi-service workflows that cannot fit in a single ACID transaction — with compensating transactions providing the rollback mechanism when a step fails midway through.',
    decision: {
      choose: [
        'Outbox Pattern: any time you write to a DB and publish to a queue in the same logical operation — this is almost always the correct approach',
        'Idempotency Key: every consumer that has side effects (payments, emails, API calls) in an at-least-once delivery system — non-negotiable',
        'Competing Consumers: when you need to scale consumption horizontally without partition-level coordination (simpler than Kafka consumer groups)',
        'DLQ: every production queue — there is no valid reason to skip a DLQ; a queue without a DLQ loses messages silently',
        'Claim Check: message payloads exceed 100KB; video files, ML model outputs, large JSON reports',
        'Saga: distributed transactions spanning 3+ services where a 2PC distributed lock is infeasible or you cannot afford cross-service locks',
      ],
      avoid: [
        'Outbox Pattern via polling on a high-write table — polling at 1-second intervals adds 1s latency and creates read pressure; prefer CDC via Debezium for sub-100ms latency',
        'Choreography Saga for > 5 steps — the implicit event chain becomes impossible to reason about; switch to Orchestration (Temporal, AWS Step Functions)',
        'Idempotency via in-memory deduplication — a process restart loses the cache; use a persistent store (DB or Redis with TTL > message retention)',
        'DLQ without a replay strategy — accumulating dead letters without a way to replay them is useless and creates a false sense of safety',
        'Claim Check for messages under 10KB — the S3 round-trip adds 20-50ms; for small payloads the overhead exceeds the benefit',
      ],
      vs: [
        {
          name: 'Two-Phase Commit (2PC)',
          when: 'Choose the Outbox Pattern over 2PC for distributed writes across DB + queue. 2PC requires both systems to implement the XA protocol (most message brokers do not), blocks during coordinator failure, and scales poorly. The Outbox Pattern trades real-time consistency for eventual consistency with far better availability.',
        },
        {
          name: 'Saga vs. ACID Transaction',
          when: 'Use a single ACID transaction when all data lives in one database — it is simpler, faster, and provides true atomicity. Use Sagas only when the transaction must span multiple services with separate databases, making a single transaction physically impossible.',
        },
        {
          name: 'Competing Consumers vs. Kafka Consumer Groups',
          when: 'Competing consumers on a single queue is simpler — add workers by starting new processes, no partition count limit. Kafka consumer groups provide ordering per partition and replay. Use competing consumers for task queues (BullMQ, SQS); use Kafka consumer groups when per-key ordering or replay is required.',
        },
        {
          name: 'Idempotency Key vs. Exactly-Once Delivery',
          when: 'Exactly-once delivery (Kafka EOS, SQS FIFO with deduplication) is provided by the broker but only within the broker pipeline — the consumer processing is still at-least-once. An idempotency key in your application is the only way to guarantee the side effect (DB write, API call, email) executes exactly once end-to-end.',
        },
      ],
    },
    failures: [
      {
        name: 'Dual-Write Problem',
        cause: 'An application writes to the database (success) and then publishes to the queue (failure due to network error, broker restart, or app crash between the two operations); the two writes are not atomic',
        symptom: 'Orders recorded in the DB but never processed downstream (no inventory update, no email); or in the reverse order, an event is published but the DB write fails and the event references a record that does not exist, causing downstream consumer NullPointerExceptions',
        fix: 'Implement the Outbox Pattern: write the event to an outbox table in the same DB transaction as the business data. Use Debezium to stream outbox rows from the WAL to the queue with sub-100ms latency. Never publish to a queue directly inside a DB transaction — the queue publish happens after the transaction commits, in a separate step that can safely retry.',
        severity: 'critical',
      },
      {
        name: 'Saga Rollback Failure',
        cause: 'A compensating transaction (rollback step) in a Saga fails — e.g., the inventory reservation succeeded but the payment failed, so the Saga tries to cancel the inventory reservation, but the inventory service is down; the compensating transaction cannot execute',
        symptom: 'System is in a partial state: inventory is reserved but no payment exists and no order is confirmed; customer sees a pending order that never progresses; inventory is effectively locked for a product that was never sold',
        fix: 'Design compensating transactions to be idempotent and retriable — the orchestrator must retry the compensation indefinitely with backoff until it succeeds. For true failures (e.g., external service permanently down), use a human-in-the-loop step: emit a compensate-failed event to a monitoring queue that triggers an operations alert and a manual correction workflow. Temporal\'s durable workflow engine handles this automatically via persistent activity retries.',
        severity: 'critical',
      },
      {
        name: 'DLQ Poisoning',
        cause: 'Nobody monitors the Dead Letter Queue — alerts are not configured, the DLQ is treated as a silent discard pile rather than a quarantine zone requiring action',
        symptom: 'Customer support tickets arrive: "my payment is stuck" or "I never received my order confirmation"; engineers investigate and find 50,000 messages in the DLQ from 3 days ago; customer data is effectively lost; replaying 50K messages causes a cascade of downstream processing',
        fix: 'Set up a PagerDuty alert when DLQ depth exceeds 100 messages (5-minute window). Build or use an existing DLQ replay tool that can replay messages one-by-one or in batches with rate limiting. Define a DLQ SLA in your runbook: all DLQ messages must be investigated and resolved within 1 hour. Treat DLQ growth as a P1 incident, not a background task.',
        severity: 'high',
      },
      {
        name: 'Retry Storm',
        cause: 'An upstream dependency (database, external API) goes down for 30 seconds; all N consumers fail their current job simultaneously; they all retry at the same instant with no jitter; the dependency comes back up and is immediately DDOS\'d by N×batchSize simultaneous retries',
        symptom: 'The upstream service recovers but immediately falls over again under the retry load; cascading failure; the system oscillates between brief availability and repeated failure; what would have been a 30-second outage becomes a 10-minute recovery',
        fix: 'Implement exponential backoff with jitter on all consumer retries: delay = min(cap, base * 2^attempt) + random(0, base). The jitter spreads retries across a time window, preventing synchronized thundering herds. At the infrastructure level, use a circuit breaker (e.g., Resilience4j, Polly, or Opossum in Node.js) that opens after N consecutive failures and stops sending requests to the degraded dependency until a probe succeeds.',
        severity: 'high',
      },
      {
        name: 'Large Message Antipattern',
        cause: 'Engineers store full business objects (10MB JSON, 50MB CSV, encoded images) directly in queue messages rather than using references; the queue broker holds all this data in memory; consumers OOM when deserializing large payloads; broker memory fills up',
        symptom: 'Consumer pods OOM-crash on specific messages; RabbitMQ memory watermark hit; Kafka producer receives MESSAGE_TOO_LARGE errors; broker latency spikes when large messages are in-flight; queue throughput drops as memory bandwidth saturates',
        fix: 'Apply the Claim Check pattern: the producer writes the large payload to S3 (or GCS/Azure Blob) first, then publishes a message containing only the S3 URL and metadata (payload size, content type, checksum). The consumer downloads and processes the payload from S3, then deletes it. Enforce a queue message size limit in your CI pipeline (e.g., lint for messages >100KB) to catch violations before production.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏀📋🎮',
      t: 'The Rules of the Game',
      tx: "Basketball has rules: dribbling, fouls, out-of-bounds, shot clock. These rules work on any court — NBA arena, college gym, street court. You can change the ball, change the players, change the court size, but the rules apply everywhere.\n\nQueue patterns are rules that work on any broker — Kafka, RabbitMQ, SQS, BullMQ, or one you build yourself. The Outbox Pattern works whether your queue is Kafka or a Redis list. Idempotency Keys work whether your delivery guarantee is at-least-once or exactly-once. The patterns are layer above the technology.\n\nThe Outbox Pattern is like writing your move on a notepad before broadcasting it over the radio. If the radio cuts out mid-transmission, you still have the notepad — you can re-broadcast the exact same move when the radio comes back. Without the notepad (outbox table), you might have already committed the move in your mind (DB write) but never told your team (queue publish) — now your state and theirs are out of sync forever.\n\nThe Saga Pattern is like a relay race where each runner must finish their leg before the next starts. If the third runner drops the baton, the team doesn't just stop — there's a rule: the previous runners walk back to their starting positions (compensating transactions). The race is either completed fully or completely undone. No partial relay results are accepted.\n\nThe DLQ is the referee's review booth. When a play is too broken to call live — the message is malformed, the downstream API is returning 500s, the schema changed — the referee (broker) sends the play to review (DLQ) rather than holding up the entire game. The review booth is only useful if someone is actually watching the monitor. A DLQ without alerts is a dark room with no monitor.",
      s: 'The expert insight that beginners miss: these patterns compose. A payment service should implement the Outbox Pattern (producer-side consistency) AND Idempotency Keys (consumer-side deduplication) AND a DLQ (failure isolation) AND the Saga Pattern for the multi-step checkout flow — simultaneously. Applying only one pattern gives you partial protection. The reason production messaging systems fail is almost never because of a single missing pattern; it\'s because engineers applied the Outbox but forgot idempotency, or set up a DLQ but never added monitoring. The patterns are a checklist, not a menu.',
    },
    te: {
      def: 'Queue patterns are broker-agnostic implementation strategies that solve the fundamental reliability problems of distributed messaging: dual-write inconsistency (Outbox), duplicate processing (Idempotency Key), partial distributed transaction failure (Saga), unprocessable message handling (DLQ), oversized payloads (Claim Check), and horizontal scale (Competing Consumers).',
      types: [
        { n: 'Outbox Pattern', d: 'Write event to DB outbox table in the same transaction as business data; a relay (CDC or polling) publishes the event to the queue. Solves dual-write. Guarantees at-least-once event publication.' },
        { n: 'Saga Pattern', d: 'Long-running distributed transaction as a sequence of local transactions with compensating rollback steps. Choreography: services react to events. Orchestration: a central coordinator commands each step.' },
        { n: 'Competing Consumers', d: 'Multiple stateless consumer instances reading from the same queue; each message processed by exactly one consumer. Enables linear horizontal scaling with no partition-level coordination.' },
        { n: 'Dead Letter Queue (DLQ)', d: 'Quarantine destination for unprocessable messages. Prevents queue blocking. Requires monitoring alerts and a replay tool to be useful — a DLQ with no monitoring is a silent data graveyard.' },
        { n: 'Claim Check', d: 'Store large payload in object storage; publish only a reference URL in the queue. Keeps broker message size under 1KB regardless of business payload size. Essential for video, ML output, and large reports.' },
        { n: 'Idempotency Key', d: 'Unique ID per operation checked before executing side effects. Makes at-least-once delivery effectively exactly-once. Must be persisted in the database, not held in memory, to survive restarts.' },
      ],
      when: 'Apply Outbox for any service that writes to a DB and publishes to a queue. Apply Idempotency Keys to every consumer with side effects. Apply DLQ to every production queue. Apply Claim Check when payloads exceed 100KB. Apply Competing Consumers to scale stateless workers. Apply Saga for transactions spanning multiple services.',
      trade: 'These patterns add code complexity and operational overhead — the Outbox Pattern requires a CDC pipeline or polling job; Sagas require compensating transactions for every step; Idempotency Keys require a deduplication store. The trade-off is worth it: without these patterns, your messaging system will fail silently, lose data, or double-process in ways that are extremely difficult to debug under production load.',
      code: `// ── Outbox Pattern ──────────────────────────────────────
// Single DB transaction: business write + outbox row are atomic
await db.transaction(async (tx) => {
  const payment = await tx.payments.create({
    data: { userId, amount, status: 'pending' },
  });
  await tx.outbox.create({
    data: {
      aggregateType: 'payment',
      aggregateId: payment.id,
      eventType: 'payment.initiated',
      payload: JSON.stringify(payment),
      status: 'PENDING',
    },
  });
  // If EITHER write fails, BOTH are rolled back — no dual-write
});

// Relay: CDC (Debezium) or polling publishes outbox rows to Kafka
async function relayOutboxEvents() {
  const events = await db.outbox.findMany({
    where: { status: 'PENDING' }, take: 100, orderBy: { createdAt: 'asc' },
  });
  for (const event of events) {
    await kafka.producer.send({ topic: event.eventType, messages: [
      { key: event.aggregateId, value: event.payload },
    ]});
    await db.outbox.update({ where: { id: event.id }, data: { status: 'PUBLISHED' } });
  }
}

// ── Idempotency Key ──────────────────────────────────────
// Consumer checks before executing side effects
async function processPaymentInitiated(msg: KafkaMessage) {
  const { paymentId, userId, amount } = JSON.parse(msg.value!.toString());

  // Check idempotency — has this exact payment been processed?
  const existing = await db.processedEvents.findUnique({
    where: { idempotencyKey: \`payment.initiated:\${paymentId}\` },
  });
  if (existing) {
    console.log(\`Skipping duplicate event for payment \${paymentId}\`);
    return existing.result;
  }

  // Execute side effect + record idempotency key atomically
  return await db.transaction(async (tx) => {
    const result = await chargeCard(userId, amount);          // external API call
    await tx.processedEvents.create({
      data: { idempotencyKey: \`payment.initiated:\${paymentId}\`, result: JSON.stringify(result) },
    });
    return result;
  });
}`,
      rw: {
        ex: [
          'Stripe Outbox Pattern for payment event publishing (described in their engineering blog)',
          'Uber Saga orchestration via Cadence/Temporal for trip lifecycle management',
          'AWS recommended DLQ pattern for all SQS-triggered Lambda functions',
          'Shopify Claim Check for large order export files (CSV/JSON) via S3',
        ],
        cs: 'Stripe\'s payment processing pipeline is the canonical production implementation of the Outbox Pattern and Idempotency Keys working together. Every charge attempt writes to Stripe\'s database and an outbox in the same transaction — the outbox relay publishes the charge.succeeded or charge.failed event to their internal Kafka topics. Every Stripe API endpoint accepts an idempotency-key header; Stripe stores the result of the first call and returns the cached result for any retry with the same key, even across different servers and even if the original server crashed before returning. This combination means a network timeout on a charge request never results in a double-charge — the idempotency key on retry returns the original charge result if it succeeded, or executes the charge if it never started.',
      },
    },
    interview: {
      q: 'You\'re building a payment service that publishes events to a queue. How do you guarantee the payment is processed exactly once even if your service crashes?',
      a: 'Exactly-once requires solving two independent problems: <strong>producer-side consistency</strong> (the event is published if and only if the payment is recorded) and <strong>consumer-side idempotency</strong> (processing the event twice produces the same outcome). For the producer, I\'d implement the <strong>Outbox Pattern</strong>: write the payment record and an outbox row in a single DB transaction, then have a CDC relay (Debezium reading the WAL) publish the outbox row to Kafka — the atomicity of the DB transaction guarantees both writes succeed or neither does. For the consumer, I\'d use an <strong>idempotency key</strong> (the paymentId) checked against a processed_events table before charging the card; the check and the side effect are wrapped in the same DB transaction so they are atomic. With this architecture, a crash anywhere in the pipeline results in a retry that is safe — the Outbox relay retries the publish (Kafka deduplicates via idempotent producer), and the consumer retries the processing (idempotency key short-circuits duplicate execution).',
      fu: [
        'What is the dual-write problem and why does wrapping a DB write and queue publish in a try/catch not solve it?',
        'Explain the difference between choreography and orchestration Sagas. Which would you use for a 5-step checkout flow?',
        'A compensating transaction in your Saga fails. The payment rollback API is returning 503. What do you do?',
        'How does the Outbox Pattern differ from using Kafka transactions (transactional.id) on the producer side?',
        'Your DLQ has 100K messages after a 6-hour consumer outage. How do you replay them safely without re-triggering the original outage?',
        'How would you implement an idempotency key for an operation that calls 3 external APIs sequentially — any one of which can fail partway through?',
      ],
    },
  },
];
