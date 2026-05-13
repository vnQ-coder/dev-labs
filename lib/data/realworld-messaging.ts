import { RealWorldSystem } from '../types';

export const REALWORLD_MESSAGING_SYSTEMS: RealWorldSystem[] = [
  {
    id: 'whatsapp-e2e',
    icon: '💚',
    name: 'WhatsApp',
    color: '#25d366',
    scale: '2B users · 100B messages/day · 2B minutes of calls/day · end-to-end encrypted',
    focus: 'End-to-End Encrypted Messaging at 2 Billion Users',
    problem:
      'Design WhatsApp — a messaging platform with 2 billion users sending 100 billion messages per day. Messages must be delivered in under 1 second, end-to-end encrypted (so WhatsApp servers never see plaintext), and reliably delivered even when recipients are offline for days. Group messages (up to 1,024 members) must fan out to all members. Voice and video calls must connect in under 2 seconds with < 150ms audio latency. Design the messaging, storage, encryption, and delivery systems.',

    functionalReqs: [
      'Send text, images, video, documents, and voice messages between users and in groups (up to 1,024 members)',
      'End-to-end encryption: server never has access to plaintext message content',
      'Reliable delivery with status indicators: sent (single check), delivered (double check), read (blue check)',
      'Offline delivery: messages queued and delivered when recipient comes online (up to 30 days)',
      'Voice and video calls, 1:1 and group calls up to 32 participants',
      'Last seen, online status, and typing indicators for contacts',
    ],

    nonFunctionalReqs: [
      { label: 'Message delivery latency', value: '< 1 second for online recipients in same region' },
      { label: 'Offline queue retention', value: '30 days maximum for undelivered messages' },
      { label: 'Encryption', value: 'Signal Protocol (Double Ratchet + X3DH) — zero-knowledge on server' },
      { label: 'Call connection time', value: '< 2 seconds from ring to audio' },
      { label: 'Uptime', value: '99.99% — 2B people depend on WhatsApp as primary communication' },
      { label: 'Storage', value: 'Media stored on S3 with client-side encryption; server stores only encrypted blobs' },
    ],

    scaleEstimation: [
      { label: 'Messages/day', value: '100B', note: '~1.16M messages/sec avg; 5M+/sec peak' },
      { label: 'Active connections', value: '~500M users online at any given moment', note: 'persistent WS/XMPP connections' },
      { label: 'Media uploads/day', value: '~20B (images, videos, voice notes)', note: '20% of messages include media' },
      { label: 'Group messages', value: 'avg 50-member group, 100B msgs, 20% are group = 20B group msgs × 50 = 1T fan-out events/day' },
      { label: 'Call minutes/day', value: '2B minutes', note: '~1.4M concurrent calls at any moment' },
      { label: 'Server storage for message queue', value: '100B msgs × 2KB avg × 30-day retention = ~6 PB' },
    ],

    highLevelDesign: [
      {
        title: 'Client Connection (XMPP over WebSocket)',
        description:
          'Each WhatsApp client maintains a persistent connection to a Chat Server using a binary XMPP protocol over WebSocket. Each Chat Server handles ~200K connections. With 500M online users, ~2,500 Chat Servers are needed. The connection is authenticated via a Noise Protocol handshake (not TLS — Noise is lighter) and kept alive with 30-second pings.',
      },
      {
        title: 'Message Flow (online recipient)',
        description:
          "Sender client encrypts message with recipient's public key (Signal Protocol) → sends ciphertext to Chat Server → Chat Server looks up recipient's active Chat Server in a routing table (Zookeeper/etcd) → forwards ciphertext directly to recipient's Chat Server → recipient's Chat Server delivers to recipient's WebSocket connection. Server only touches ciphertext — never decrypts.",
      },
      {
        title: 'Offline Message Queue',
        description:
          "If recipient is offline, the message is stored in a persistent queue (Scylla — a Cassandra-compatible database). Partition key = recipient's user_id. When recipient reconnects, their Chat Server queries Scylla for pending messages, delivers them in order, and deletes after delivery confirmed. Messages expire after 30 days.",
      },
      {
        title: 'Media Upload (client-side encrypted)',
        description:
          'Sender encrypts media with a random AES key, uploads the ciphertext to WhatsApp Media Servers (backed by S3). Media URL + decryption key are included in the message payload (also E2E encrypted). The server stores encrypted blobs; it cannot decrypt any media without the key that only the sender sends to the recipient.',
      },
      {
        title: 'Group Messaging Fan-out',
        description:
          "A group message to a 1,024-member group = 1,024 individual messages. The sender client encrypts the message with a shared Group Sender Key (Signal's Sender Keys protocol — one encryption per sender per group, not per recipient). The server fans out the same ciphertext to all members. Each member has the sender's key to decrypt — server never has the key.",
      },
    ],

    deepDive: [
      {
        title: 'Signal Protocol — Double Ratchet',
        description:
          'WhatsApp uses the Signal Protocol, which provides forward secrecy and break-in recovery. Two ratchets: Diffie-Hellman ratchet (new DH keys on each message exchange — recovering from key compromise) and symmetric ratchet (AES-256 chain keys that advance with each message — each message has a unique key). Compromising message N\'s key doesn\'t compromise messages N+1 through N+1000. WhatsApp\'s server generates prekeys (one-time DH public keys) which clients upload; new contacts consume a prekey to establish the initial session.',
        insight: 'Forward secrecy means past messages remain secure even if a long-term key is compromised — each message uses a fresh derived key that is discarded after use.',
      },
      {
        title: 'The typing indicator and presence system',
        description:
          'Typing indicators (user X is typing...) are real-time events routed through the Chat Server cluster. They\'re NOT stored — purely ephemeral. The sender\'s Chat Server broadcasts the typing event to the recipient\'s Chat Server, which delivers to the WebSocket. Last seen timestamps are stored in a distributed KV store per user. "Online" status is derived from whether the user has an active WebSocket connection — queried from the routing table in real time. WhatsApp limits presence visibility to contacts only to reduce fan-out.',
        insight: 'Ephemeral events never touch the database — routing through in-memory Chat Server state keeps latency under 100ms without storage overhead.',
      },
      {
        title: 'Scylla vs Cassandra for offline queue',
        description:
          'WhatsApp uses ScyllaDB (a Cassandra-compatible database written in C++) for offline message storage. Scylla achieves 10× Cassandra\'s throughput on identical hardware by eliminating JVM GC pauses (written in C++ with seastar async framework). At 1.16M msg/sec with potentially 20% offline recipients = ~230K writes/sec to the offline queue, GC pauses would add unpredictable latency spikes. Scylla\'s C++ implementation keeps p99 write latency under 1ms.',
        insight: 'JVM GC pauses at tail latency can cascade into user-visible delays — Scylla\'s C++ implementation eliminates this entire class of problem.',
      },
      {
        title: 'Voice/video call architecture',
        description:
          '1:1 calls use WebRTC with STUN/TURN for NAT traversal. WhatsApp\'s relay servers (TURN) are used only when direct P2P UDP connection fails (~15% of calls). Group calls (up to 32 participants) use an SFU (Selective Forwarding Unit) — similar to Discord\'s architecture. Call signaling (ring, accept, reject) flows through the Chat Server persistent connection — not a separate signaling service — to avoid cold-start latency.',
        insight: 'Reusing the existing persistent Chat Server connection for call signaling eliminates a separate signaling service and shaves 200–500ms off call setup time.',
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          'WhatsApp chooses CP (Consistency + Partition Tolerance) for message ordering. The Signal Protocol\'s Double Ratchet requires strict message ordering — each message\'s decryption key is derived from the previous one in the chain. If messages arrive out of order, the recipient cannot decrypt them without buffering and reordering, which breaks the ratchet state. WhatsApp therefore prefers to delay delivery rather than deliver out-of-order. The offline queue in ScyllaDB stores messages with sequence numbers; the client only advances the ratchet after receiving messages in sequence. During a network partition, a message waits in the queue rather than being delivered out-of-order.',
        insight: 'The cryptographic requirement of the Signal Protocol — not a business rule — forces the CP choice. Incorrect ordering is not just a UX problem; it causes decryption failure.',
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          'WhatsApp uses Mnesia (Erlang\'s built-in distributed database) for session state — tracking which Chat Server each user is connected to, routing tables, and presence data. Mnesia is an in-memory relational store that fits naturally in the Erlang/OTP ecosystem WhatsApp is built on. For the offline message store, ScyllaDB (Cassandra-compatible) is used: messages are append-only (write once, read once on delivery, then delete), the access pattern is always by partition key (user_id), and no relational joins are needed. Cassandra/Scylla\'s LSM-tree write model is optimal for this append-heavy, TTL-driven workload. No SQL relational database is used in the hot path.',
        insight: 'Matching the database to the access pattern: Mnesia for in-memory session routing (relational, tiny), ScyllaDB for the message queue (append-only, massive, key-based lookup).',
      },
      {
        title: 'Message Delivery & Queuing',
        description:
          'WhatsApp uses a custom binary XMPP protocol over WebSocket as its transport. Message delivery is at-least-once: the server stores a message in the ScyllaDB queue and does not delete it until the recipient\'s device sends an explicit ACK stanza back through the WebSocket. If the TCP connection drops before the ACK, the message remains in the queue and is re-delivered on reconnect. The delivery receipt (double checkmark) is generated server-side after the ACK is received from the recipient device, then forwarded to the original sender. This two-phase commit (store-then-deliver-then-ACK-then-delete) ensures no message is silently lost.',
        insight: 'At-least-once delivery with client ACK before queue deletion means a message may be delivered twice if the ACK is lost — clients deduplicate by message ID.',
      },
      {
        title: 'Networking & Protocol Choices',
        description:
          'WhatsApp uses a custom binary protocol derived from XMPP over persistent TCP connections (surfaced as WebSocket for web clients). Phone-number-based identity is central: user_id = phone number hash, enabling global routing without a separate identity system. Each geographic region has edge Chat Servers that terminate client connections locally, then use inter-region gRPC to forward messages to the recipient\'s region. This keeps the client-to-server hop short (< 50ms) even for cross-region messages. Binary protocol frames are 2–5× smaller than JSON equivalents — critical for 2G/3G users in emerging markets, which represent the majority of WhatsApp\'s user base.',
        insight: 'Protocol efficiency compounds at 2B users: a 3× reduction in message size saves hundreds of petabytes of monthly bandwidth and meaningfully improves experience on poor mobile connections.',
      },
    ],

    decisions: [
      {
        question: 'XMPP vs custom binary protocol vs WebSocket JSON',
        chosen: 'Binary XMPP over WebSocket',
        reason:
          'WhatsApp started with XMPP (a well-understood messaging protocol), then replaced the XML encoding with a custom binary format (proto-XMPP). Binary is 2–5× smaller than JSON/XML — critical when serving 2B users on 2G/3G connections. The XMPP semantics (presence, roster, message stanzas) map directly to messaging concepts without reinventing the protocol.',
      },
      {
        question: 'Server-side message storage vs client-only storage',
        chosen: 'Server stores only the offline queue (30-day TTL); delivered messages are deleted from server',
        reason:
          "E2E encryption makes server-side permanent storage useless — the server can't search or process encrypted messages. Storing plaintext would violate E2E guarantees. WhatsApp keeps messages on-device (SQLite). Cloud backup (to Google Drive/iCloud) is the user's responsibility and is separately encrypted with the user's own key.",
      },
      {
        question: 'Sender Keys for group E2E vs per-recipient encryption',
        chosen: 'Signal Sender Keys',
        reason:
          "Naive group E2E would require the sender to encrypt separately for each of 1,024 members = 1,024 encrypt operations per message. Signal's Sender Keys: the sender distributes a Group Sender Key to all members once (when they join). Each message is encrypted once with the sender's key. Fan-out cost moves from sender's CPU to server delivery count — O(1) encryption, O(n) delivery.",
      },
      {
        question: 'CAP theorem: consistency vs availability for message ordering',
        chosen: 'CP — consistency and partition tolerance, accepting delay over disorder',
        reason:
          'The Signal Protocol\'s Double Ratchet cryptographically requires in-order delivery — each message key is derived from the prior one. Out-of-order delivery causes decryption failure, not just a UX glitch. WhatsApp therefore queues messages server-side and delivers them sequentially, preferring delay over incorrect order during partitions.',
      },
      {
        question: 'Database for offline message queue: SQL vs NoSQL',
        chosen: 'ScyllaDB (Cassandra-compatible) for queue; Mnesia for session state',
        reason:
          'Message queue access is purely key-based (user_id), append-only, and TTL-driven — a perfect fit for Scylla\'s LSM-tree model. Mnesia handles in-memory session routing within the Erlang ecosystem with zero serialization overhead. No SQL joins are needed anywhere in the hot message path.',
      },
      {
        question: 'Delivery guarantee: at-most-once vs at-least-once',
        chosen: 'At-least-once with client-side deduplication by message ID',
        reason:
          'At-most-once delivery risks silent message loss if the TCP connection drops after delivery but before ACK. WhatsApp keeps messages in the queue until an explicit ACK is received from the recipient device. Duplicate deliveries (rare, on reconnect) are deduplicated by message ID on the client. For a messaging app, losing a message is far worse than briefly showing a duplicate.',
      },
    ],

    interview: [
      {
        q: 'How does WhatsApp deliver 100 billion messages per day with end-to-end encryption?',
        a: 'Persistent XMPP WebSocket connections to ~2,500 Chat Servers handle 500M online users. The server routes encrypted ciphertext — it never decrypts. Sender encrypts with Signal Protocol (Double Ratchet + X3DH), Chat Server looks up recipient\'s active Chat Server via Zookeeper routing table, and forwards ciphertext directly. For offline recipients, ciphertext is queued in ScyllaDB partitioned by user_id and delivered on reconnect. The server is a dumb forwarder of opaque bytes — all cryptographic work happens on clients.',
      },
      {
        q: 'How does WhatsApp handle offline delivery and ensure no messages are lost?',
        a: 'If a recipient is offline, the Chat Server writes the encrypted message to ScyllaDB with partition key = recipient user_id and a 30-day TTL. On reconnect, the client sends its last received sequence number; the Chat Server queries Scylla for all messages with higher sequence numbers. After the client ACKs delivery, messages are deleted from the queue. The 30-day TTL prevents unbounded queue growth for users who permanently leave. Delivery receipts (single/double check) flow back through the same Chat Server path.',
      },
      {
        q: 'How do group messages work with end-to-end encryption across 1,024 members?',
        a: "Signal's Sender Keys protocol: when a user joins a group, the server distributes the sender's Group Sender Key to all existing members (encrypted per-recipient using individual E2E sessions — this distribution is a one-time cost per join). When the user sends a group message, they encrypt once with their Sender Key and send one ciphertext to the server. The server fans out the same ciphertext to all 1,024 members. Each member already has the sender's key to decrypt. Encryption cost: O(1) per message. Server fan-out cost: O(n) deliveries — but the server touches only one ciphertext.",
      },
      {
        q: 'How does WhatsApp maintain presence and typing indicators for 2 billion users without overloading servers?',
        a: "Presence and typing are ephemeral — never written to disk. Online status is derived from whether a user has an active WebSocket connection, stored in the in-memory routing table (Zookeeper). Typing indicators are Chat Server events routed peer-to-peer between Chat Servers in real time; they expire after 3 seconds with no persistence. Critically, WhatsApp limits presence fanout to contacts only — a user with 500 contacts generates presence events to 500 users, not 2B. This turns a potentially O(2B) broadcast into O(contacts) which averages ~100–500.",
      },
      {
        q: 'How does WhatsApp guarantee message ordering?',
        a: 'WhatsApp makes a CP (consistency over availability) trade-off driven by the Signal Protocol\'s cryptographic requirements. Each message\'s decryption key is derived from the prior message\'s key via the Double Ratchet — so messages must be processed in sequence or decryption fails entirely. Messages are stored in ScyllaDB with monotonically increasing sequence numbers per conversation. On delivery, the Chat Server sends messages in order and waits for the client ACK before advancing the sequence pointer. If a partition causes a delay, the message waits in queue rather than being delivered out-of-order. The constraint is cryptographic, not just a UX preference.',
      },
      {
        q: 'How does WhatsApp handle offline message delivery for a user who is offline for weeks?',
        a: 'When a recipient is offline, every inbound encrypted message is written to ScyllaDB partitioned by user_id, with a 30-day TTL enforced by Scylla\'s native TTL mechanism. Each row stores: message_id, sender_id, ciphertext, and sequence_number. When the user reconnects, the Chat Server queries Scylla for all rows with sequence_number greater than the client\'s last ACKed sequence, returns them in order, and streams them to the client over the restored WebSocket. Each delivered batch is ACKed; rows are deleted post-ACK. If the user stays offline beyond 30 days, Scylla\'s TTL expires the rows and the sender receives a delivery failure notification.',
      },
    ],

    keyInsight:
      "WhatsApp's engineering philosophy — 50 engineers for 2B users — was possible because they built around one principle: the server should do as little work as possible. E2E encryption means the server can't process messages. Client-side storage means the server doesn't store history. Sender Keys mean the server forwards one ciphertext per group message, not one per member. Every architectural decision removed server-side work and pushed it to clients. This is why WhatsApp scaled to 2B users with an infrastructure footprint that would embarrass most 10M-user startups.",
  },

  {
    id: 'slack',
    icon: '🟣',
    name: 'Slack',
    color: '#4a154b',
    scale: '20M daily active users · 10B+ messages indexed · 750K+ organizations',
    focus: 'Persistent Team Messaging with Search, Threads & Enterprise Compliance',
    problem:
      'Design Slack — a persistent team messaging platform where 750K+ organizations communicate across channels. Unlike WhatsApp, Slack messages are server-stored (searchable, auditable, compliance-required). Design a system where messages in a channel reach all online members in < 200ms, the full message history is instantly searchable across 10B+ messages, threads work correctly across time zones, and enterprise customers can export all messages for compliance.',

    functionalReqs: [
      'Users send messages in public/private channels and direct messages; all members see them in real time',
      'Message threads: replies are nested under a parent message, visible in a side panel',
      'Full-text search across all messages a user has access to, returning results in < 2 seconds',
      'File sharing: upload documents, images, code snippets with syntax highlighting',
      'Integrations (slash commands, bots, webhooks) extend Slack with third-party app functionality',
      'Enterprise: message retention policies, compliance exports, SSO (SAML), and data residency',
    ],

    nonFunctionalReqs: [
      { label: 'Message delivery latency', value: '< 200ms from send to receipt for online members in the same workspace' },
      { label: 'Search latency', value: "< 2 seconds for full-text search across a workspace's full history" },
      { label: 'Message storage', value: 'Indefinite retention for paying customers; 90 days free tier' },
      { label: 'Availability', value: '99.99% — Slack is used for incident response; downtime during incidents compounds the problem' },
      { label: 'Security', value: 'Messages encrypted at rest (AES-256) and in transit (TLS 1.3); E2E encryption NOT guaranteed (Slack can read messages)' },
      { label: 'Compliance', value: 'GDPR, SOC 2 Type II, export all messages for audit within 24 hours' },
    ],

    scaleEstimation: [
      { label: 'Messages/day', value: '10B (20M DAU × 500 messages/day per active user)', note: '~115K msg/sec avg' },
      { label: 'Workspaces', value: '750K', note: 'each is isolated; cross-workspace data never mingles' },
      { label: 'Search index', value: '10B messages × 500 bytes avg = 5 TB text', note: 'ElasticSearch cluster per tier' },
      { label: 'Files stored', value: '~50 PB total (messages are small; files are large)', note: 'AWS S3' },
      { label: 'WebSocket connections', value: '20M DAU, peak ~8M simultaneously online', note: '~80K gateway pods at 100 connections/pod' },
      { label: 'Fan-out', value: 'avg channel 50 members; at 115K msg/sec × 50 fan-out = 5.75M WebSocket pushes/sec' },
    ],

    highLevelDesign: [
      {
        title: 'Message Write Path',
        description:
          'Client sends message via HTTP POST to API server → message validated → written to Message Store (MySQL sharded by workspace_id+channel_id) → published to Kafka (partitioned by channel_id) → delivery service reads from Kafka and pushes to all online members\' WebSocket connections via Gateway pods.',
      },
      {
        title: 'Real-Time Delivery (Gateway pods)',
        description:
          "Each user connects via WebSocket to a Gateway pod. Pods are stateless — the pod ID of each user's connection is stored in Redis (user_id → gateway_pod_id). When the delivery service needs to push a message to user X, it looks up X's pod_id in Redis and sends the message to that pod via an internal pub-sub channel. The pod delivers to the WebSocket.",
      },
      {
        title: 'Message History & Threads',
        description:
          'Messages are stored in MySQL, partitioned by (workspace_id, channel_id, bucket_month). Threads are modeled as: parent_message_id on each reply. Fetching a thread = SELECT * WHERE parent_message_id = X ORDER BY ts. Thread reply counts and last reply info are denormalized into the parent message row (updated on each reply) for fast channel view rendering.',
      },
      {
        title: 'Search (Elasticsearch)',
        description:
          "Every message is indexed in Elasticsearch within 5 seconds of being written. Index structure: workspace_id as the routing key (all of one workspace's messages on the same shard group). A search query: bool filter on workspace_id + user's channel membership → full-text match on message text → ranked by recency. For enterprise customers, a dedicated ES cluster per workspace isolates load and enables data residency.",
      },
      {
        title: 'File Storage & Previews',
        description:
          'Files uploaded via chunked multipart → stored in S3 with server-side AES-256 encryption → URL stored in message metadata. Thumbnails and previews generated asynchronously by a media worker (Lambda). Code snippets are stored as text with language metadata; syntax highlighting happens client-side.',
      },
    ],

    deepDive: [
      {
        title: 'The threading model — flat vs nested',
        description:
          "Slack's threading model is intentionally shallow (one level deep — no infinite nesting). This simplifies the data model: every message has an optional parent_ts (timestamp of parent). Fetching 'messages + their reply counts' for a channel view = one query for channel messages + a batch query for reply_count per parent. True infinite nesting (like Reddit) requires recursive CTEs or materialized paths — complex at Slack's message volume. The flat model scales linearly.",
        insight: 'Intentional constraints on product features (one-level threads) can dramatically simplify the underlying data model — a product decision with architectural consequences.',
      },
      {
        title: 'Search across 10B messages — workspace isolation',
        description:
          'A naive Elasticsearch cluster for all 750K workspaces would create hot spots (large enterprises generate 1000× more messages than small teams). Slack tiers customers: free/standard workspaces share multi-tenant ES clusters (workspace_id as routing key). Enterprise Grid workspaces get dedicated ES clusters with data residency guarantees. This tiering means 99% of workspaces share infrastructure, while 1% of customers (who generate 50% of revenue) get isolation.',
        insight: 'Multi-tenancy tiering — shared infrastructure for the long tail, dedicated for top accounts — is the standard playbook for SaaS search at scale.',
      },
      {
        title: 'MySQL for messaging — not Cassandra',
        description:
          "Slack chose MySQL despite messaging's reputation as a Cassandra use case. Reasons: (1) Messages in a channel are read in time order — MySQL B-tree index on timestamp gives O(log N) range queries; (2) Workspace data is naturally isolated — sharding by workspace_id gives even distribution; (3) MySQL transactions are used for atomic message + thread-reply-count updates; (4) Slack's engineering team had deep MySQL expertise and had already built tooling (Vitess for sharding). Cassandra's lack of secondary indexes and transactions was a worse trade-off given their access patterns.",
        insight: "Database selection should be driven by actual query patterns and team expertise, not technology trends — MySQL with Vitess outperformed the 'obvious' NoSQL choice for Slack's workload.",
      },
      {
        title: 'Compliance exports and message retention',
        description:
          "Enterprise customers can configure message retention policies (30 days, 7 years, forever) and request full exports. Slack's compliance export is implemented as a daily batch job: query MySQL for all messages in the retention window per workspace → encrypt with customer-provided KMS key → write to S3 in GDPR-compliant format → notify customer. For real-time compliance (legal hold), Slack writes a copy of every message to a separate compliance Kafka topic consumed by a tamper-evident audit log store (write-once S3 with Object Lock).",
        insight: 'Write-once S3 Object Lock provides tamper-evident storage that satisfies legal hold requirements without building a custom immutable store.',
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          'Slack chooses AP (Availability + Partition Tolerance) for channel messaging. In a distributed system, messages may briefly appear out of order when Gateway pods are behind different Kafka consumer offsets, or when a user reconnects to a different pod mid-session. Slack accepts this: availability (the channel stays usable during a partial outage) is prioritised over strict global ordering. To reconcile inconsistencies, Slack uses vector clocks on message metadata and client-side reconciliation — the client sorts messages by server-assigned timestamps and re-renders if a late message arrives. Eventual consistency is the explicit contract for channel feeds.',
        insight: 'Choosing AP means Slack stays online during partial failures — critical because Slack is often the communication tool used to respond to those very failures.',
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          'Slack uses MySQL sharded by workspace_id for message storage. Each workspace fits neatly into a single shard (small-to-medium workspaces rarely exceed tens of millions of messages), enabling relational joins within a shard (messages + channel membership for ACL enforcement + thread reply counts). Vitess manages the sharding layer. For full-text search, Elasticsearch is used with workspace_id as the routing key — keeping all of a workspace\'s index on one shard group to avoid scatter-gather. Redis handles real-time presence (user_id → online status, gateway_pod_id) and acts as pub/sub backbone for cross-server message fan-out within the delivery tier.',
        insight: 'MySQL for durability and relational queries, Elasticsearch for search, Redis for ephemeral real-time state — three databases, each chosen for a different access pattern.',
      },
      {
        title: 'Message Delivery & Queuing',
        description:
          'Slack uses Kafka for durable, replayable message queuing between the API tier and the delivery tier, and also for populating the Elasticsearch index and the compliance audit log (fan-out to multiple consumers from one Kafka topic). However, direct real-time delivery to online users does NOT go through Kafka — it uses in-memory pub/sub within a Gateway pod cluster, backed by Redis pub/sub for cross-server fan-out. This two-layer approach means: Kafka provides durability and replay for indexing/compliance; Redis pub/sub provides low-latency (<5ms) in-memory routing to the correct Gateway pod. Messages that cannot be delivered (user offline) are not queued — clients fetch missed messages on reconnect by querying MySQL with a "last seen" cursor.',
        insight: 'Kafka for durability and fan-out to batch consumers; Redis pub/sub for real-time sub-10ms delivery to Gateway pods — two message buses serving different latency requirements.',
      },
      {
        title: 'Networking & Protocol Choices',
        description:
          'Slack uses WebSocket for all real-time communication (typing indicators, message delivery, presence updates, reaction events). REST HTTP/2 is used for CRUD operations (sending a message, fetching history, uploading files). File uploads go directly to S3 via pre-signed URLs, with CloudFront as CDN for downloads — the Slack API server is never in the upload data path. For Enterprise Grid customers with data residency requirements (EU, Japan), Slack deploys regional stacks with all data — MySQL, Elasticsearch, S3 — pinned to the customer\'s geographic region. WebSocket connections are terminated at regional load balancers, preventing data from leaving the residency boundary.',
        insight: 'Pre-signed S3 URLs offload file upload bandwidth entirely from Slack\'s servers — a standard pattern that eliminates a massive bottleneck at zero architectural complexity cost.',
      },
    ],

    decisions: [
      {
        question: 'Server-stored messages vs client-stored (like WhatsApp)',
        chosen: 'Server-stored',
        reason:
          "Enterprise customers require searchability, compliance exports, and message access when an employee leaves. Client-stored E2E encryption makes all of this impossible. Slack's value proposition IS searchable persistent history — this is a product decision that drives the architecture. Server-side encryption (not E2E) is the trade-off; Slack can read messages, which is acceptable for enterprise use cases.",
      },
      {
        question: 'MySQL vs DynamoDB for message storage',
        chosen: 'MySQL (via Vitess)',
        reason:
          "Slack's channel message access patterns are relational: fetch last N messages, fetch thread replies, count unreads. DynamoDB's lack of secondary indexes makes the thread reply count query (COUNT WHERE parent_ts = X) expensive (full table scan without a GSI). MySQL + Vitess provides relational queries with horizontal sharding. DynamoDB's operational simplicity wasn't worth the query flexibility trade-off.",
      },
      {
        question: 'WebSocket gateway vs SSE for real-time delivery',
        chosen: 'WebSocket',
        reason:
          "Slack's event stream is bidirectional — clients send typing indicators, ACKs, and presence updates through the same connection. SSE is server-to-client only; clients would need separate HTTP requests for uploads. WebSocket's full-duplex model handles all real-time events in one connection. Trade-off: WebSocket requires stateful connection tracking (Redis pod registry), adding operational complexity vs stateless HTTP SSE.",
      },
      {
        question: 'CAP theorem: consistency vs availability for channel messaging',
        chosen: 'AP — availability and partition tolerance, accepting brief message reordering',
        reason:
          'Slack prioritises availability because it is used as the incident-response tool during outages. If strict consistency required a channel to go read-only during a partition, the team coordinating the incident response would be silenced. Brief out-of-order delivery (reconciled client-side) is a far better trade-off than channel unavailability during the moments it matters most.',
      },
      {
        question: 'Sharding strategy: by workspace vs by channel vs by user',
        chosen: 'Shard MySQL by workspace_id',
        reason:
          'Workspace_id is the natural isolation boundary in Slack — all queries (messages, channels, members) are always scoped to a single workspace. Sharding by workspace_id means all data for one customer lives on one shard, enabling intra-shard joins and transactions without cross-shard coordination. Large enterprise workspaces that outgrow a single shard are given dedicated shards. Sharding by channel or user would scatter a single workspace\'s data across shards, requiring expensive cross-shard joins for every channel view.',
      },
      {
        question: 'Delivery model: push (server fans out) vs pull (clients poll)',
        chosen: 'Push via WebSocket with pull fallback on reconnect',
        reason:
          'Polling at 115K msg/sec with 8M concurrent users would require each client to poll frequently enough to appear real-time — generating billions of HTTP requests per second even when nothing changed. WebSocket push inverts this: the server sends only when there is something to deliver. Pull is reserved for reconnect recovery, where the client fetches missed messages using a cursor (last_seen_ts) against MySQL. The hybrid model avoids both the latency of polling and the complexity of maintaining push state for offline users.',
      },
    ],

    interview: [
      {
        q: 'How does Slack deliver a message to all members of a channel in under 200ms?',
        a: "Message is written to MySQL and published to Kafka in a single request (< 20ms). Kafka consumer (delivery service) reads the message, queries Redis for the gateway_pod_id of each online channel member, and sends the message to each pod via internal pub-sub. Each Gateway pod delivers to the member's WebSocket. The path is: API server → MySQL write + Kafka publish → delivery service fan-out → Gateway pod → WebSocket. With Kafka consumer lag < 10ms and Redis lookups < 1ms, total p99 delivery is under 200ms for same-region members.",
      },
      {
        q: 'How does full-text search work across 10 billion Slack messages in under 2 seconds?',
        a: "Every message is async-indexed into Elasticsearch within 5 seconds of write, via a Kafka consumer. workspace_id is the Elasticsearch routing key — all of a workspace's messages land on the same shard group, enabling single-shard queries (no scatter-gather across all shards). A search query filters first by workspace_id + user's channel membership list (ACL enforcement), then does a full-text BM25 match on message text, ranked by recency. For Enterprise Grid, dedicated per-workspace ES clusters eliminate noisy-neighbor effects. Index size per workspace averages a few GB — fits in ES heap for hot data.",
      },
      {
        q: 'How does Slack implement message threading without infinite nesting complexity?',
        a: "Slack's threading model is one level deep. Data model: every message row has an optional parent_ts column (the timestamp of the parent message — Slack uses timestamps as message IDs). Thread replies: INSERT with parent_ts set. Fetching a thread: SELECT * FROM messages WHERE channel_id = X AND parent_ts = Y ORDER BY ts. Reply counts and last_reply_ts are denormalized into the parent message row via an atomic UPDATE on each reply insertion — enabling the channel view to show '5 replies, last reply 2h ago' without a separate COUNT query. Flat model = O(1) denormalized reads for channel view.",
      },
      {
        q: 'How does Slack handle compliance exports for enterprise customers storing years of messages?',
        a: "Two mechanisms: (1) Scheduled exports: a daily batch job queries MySQL for all messages in the customer's retention window, encrypts them with a customer-managed KMS key, and writes JSON-L files to S3 in a customer-accessible bucket. GDPR-compliant format with user IDs that can be mapped to PII separately. (2) Legal hold / real-time compliance: every message is dual-written to a compliance Kafka topic, consumed by an audit log service that writes to write-once S3 (Object Lock — WORM storage). This makes the audit log tamper-evident: even Slack engineers cannot modify or delete messages under legal hold. Retention policies are enforced by S3 lifecycle rules.",
      },
      {
        q: 'Why does Slack shard MySQL by workspace instead of by channel or user?',
        a: "Workspace_id is Slack's fundamental isolation boundary — every query is always scoped to a single workspace. Sharding by workspace means all of a customer's data (messages, channels, memberships, threads) sits on a single MySQL shard, enabling intra-shard joins and transactions without distributed coordination. A thread reply count UPDATE and the parent message SELECT happen in a single ACID transaction — impossible if the data were scattered across shards. Sharding by channel would require cross-shard joins to render a workspace's channel list; sharding by user would scatter a single conversation across multiple shards. Workspace sharding also simplifies data residency: a customer's shard can be pinned to an AWS region to meet regulatory requirements.",
      },
      {
        q: 'How does Slack handle message delivery when a user is briefly offline or switches devices?',
        a: "When a user disconnects, their Redis entry (user_id → gateway_pod_id) is removed. Messages sent during offline periods are durably stored in MySQL (they are written as part of the normal write path, not just for offline users). On reconnect, the client sends its last_seen_ts; the Gateway pod queries MySQL for all channel messages newer than that timestamp across the channels the user is a member of, and streams them in order. This pull-on-reconnect pattern means the server never needs to maintain a per-user offline queue — the MySQL message store itself serves as the recovery source. The client deduplicates against any messages already rendered from the WebSocket stream.",
      },
    ],

    keyInsight:
      "Slack chose MySQL over Cassandra for messaging — a counterintuitive decision that proved correct. Their access patterns are relational: fetch messages in time order, count thread replies, join with channel membership for search ACL. Cassandra's lack of secondary indexes would have required denormalized copies for every query pattern, exploding storage and complexity. Expertise + fit beats hype: the right database is the one that matches your actual query patterns, not the one with the most impressive scalability claims.",
  },
];
