import { RealWorldSystem } from '../types';

export const REALWORLD_SOCIAL: RealWorldSystem[] = [
  {
    id: 'discord',
    icon: '💬',
    name: 'Discord',
    color: '#5865f2',
    scale: '500M registered users · 19M active servers daily · 4B+ messages/day',
    focus: 'Real-Time Messaging, Voice & Video for Communities',
    problem:
      'Design Discord — a platform where 19M servers are active daily, each with multiple text channels, voice channels, and up to 500K members. Messages must be delivered to all online members in < 100ms. Voice calls connect thousands simultaneously with <40ms audio latency. A single message to a 500K-member public server must fan out to all online members within 100ms. Design the messaging, presence, and voice infrastructure that makes this work.',

    functionalReqs: [
      'Users send messages in text channels; messages delivered to all online members in real time',
      'Voice channels: users connect to live voice with < 40ms latency; up to 5,000 simultaneous voice users per channel',
      'Presence: show online/idle/DND/offline status for all guild members in real time',
      'Message history: retrieve last N messages in any channel instantly',
      'Direct messages and group DMs between users (not channels)',
      'Rich embeds: links auto-expand with title/description/image, video previews play inline',
    ],

    nonFunctionalReqs: [
      { label: 'Message delivery latency', value: '< 100ms from send to receipt for online members' },
      { label: 'Voice latency', value: '< 40ms glass-to-glass audio in the same region' },
      { label: 'Presence update propagation', value: '< 500ms for status changes to all guild members' },
      { label: 'Uptime', value: '99.99% for messaging; voice best-effort (WebRTC peer-to-peer fallback)' },
      { label: 'Message history', value: 'Instantly retrieve up to 100 messages; older messages within 500ms' },
      { label: 'Scale', value: 'A single gateway server handles 100K WebSocket connections' },
    ],

    scaleEstimation: [
      {
        label: 'Active WebSocket connections',
        value: '~8M at any moment',
        note: 'Each user maintains one persistent WS connection',
      },
      {
        label: 'Messages/day',
        value: '4B',
        note: '~46K msg/sec avg; 200K/sec peak in major events',
      },
      {
        label: 'Voice minutes/day',
        value: '4B voice minutes',
        note: 'Discord is a voice-first product',
      },
      {
        label: 'Fan-out per message (large server)',
        value: '250K online members in a 500K-member server = 250K WS push events per message',
        note: 'Largest servers are the bottleneck',
      },
      {
        label: 'Presence events/sec',
        value: '~1M',
        note: 'Every join/leave/status change emits events to all shared guilds',
      },
    ],

    highLevelDesign: [
      {
        title: 'Client → Gateway (WebSocket)',
        description:
          'Every Discord client maintains one persistent WebSocket connection to a Gateway server. The gateway authenticates the connection, tracks which guilds the user is in, and receives/dispatches events. Discord runs ~10K gateway pods, each handling 100K connections.',
      },
      {
        title: 'Message Routing',
        description:
          'When a user sends a message, the Gateway pod publishes to a Kafka topic (partitioned by channel ID). A dispatcher service consumes the Kafka event and pushes via WebSocket to all online members of that channel across all Gateway pods.',
      },
      {
        title: 'Fan-out for Large Servers',
        description:
          'For servers with 100K+ online members, Discord uses a scatter-gather fan-out. The dispatcher identifies which Gateway pods have connections for this guild and sends the event to all of them in parallel. Each gateway then delivers to its local connections.',
      },
      {
        title: 'Cassandra for Message History',
        description:
          'Messages are stored in Apache Cassandra, partitioned by (channel_id, bucket) where bucket is a time-based integer. Recent messages (last 100) are cached in Redis. Snowflake IDs (Discord\'s custom ID format) provide total ordering without a centralized counter.',
      },
      {
        title: 'Voice via WebRTC',
        description:
          'Voice channels use WebRTC with a Selective Forwarding Unit (SFU) server. Each speaker\'s audio is sent to the SFU once; the SFU forwards to all listeners. No transcoding — audio is forwarded at the transport layer. Discord Voice Servers are regional; a user connects to the nearest SFU.',
      },
    ],

    deepDive: [
      {
        title: 'The fan-out problem for 500K-member servers',
        description:
          'A message in a large public server must reach all online members across all gateway pods. Discord solved this with "guild subscriptions" — only members who have the channel visible and the app open get real-time push. The rest get events when they open Discord (lazy load). For "announcements" channels, Discord uses a broadcast tree: dispatcher → 50 regional forwarders → gateway pods. This reduces dispatcher fanout from 10K pods to 50 forwarders.',
        insight:
          'Lazy loading presence for inactive members is the key insight: not all 500K members need a real-time push. Only members with the app actively open receive events, cutting the effective fan-out from 500K to a small fraction of that.',
      },
      {
        title: 'Presence at scale',
        description:
          'Tracking online status for all members of a 500K-member server means storing 500K presence states and fanning out every change to everyone. Discord limits presence subscriptions: clients only subscribe to presence updates for the members they can see (visible in the member list). For servers with >1,000 members, the client shows "X online" as an aggregate rather than individual statuses. The server synthesizes this count from a Redis HyperLogLog per guild.',
        insight:
          'Switching from per-member presence to an aggregate count above 1,000 members eliminates a quadratic fan-out problem — each status change no longer needs to be delivered to every other member in a large server.',
      },
      {
        title: 'Snowflake IDs',
        description:
          'Discord generates IDs as 64-bit integers: 42 bits = millisecond timestamp since Discord epoch, 10 bits = worker ID, 12 bits = sequence number. This gives 4,096 unique IDs per millisecond per worker with no central coordinator. IDs sort chronologically — Cassandra range queries for "messages after ID X" work without a separate timestamp index.',
        insight:
          'Encoding the timestamp directly into the ID means the ID itself is the index. Range queries by time become range queries by ID — no secondary index, no coordination overhead.',
      },
      {
        title: 'Message deduplication and ordering',
        description:
          'Discord guarantees at-most-once delivery (not at-least-once) for real-time events. If your WebSocket drops, you reconnect and request a "replay" of missed events using your last received event ID (the Snowflake). The Gateway returns all events since that ID from Cassandra. This makes Discord\'s messaging eventually consistent — a brief disconnect might miss a few events until replay catches up.',
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          'Discord chooses AP (Availability + Partition Tolerance) over CP. During a network partition, Discord gateways continue delivering messages from local state rather than blocking and waiting for consistency. This means two users in the same channel may briefly see messages in different orders, or a message might appear to deliver successfully on the sender\'s side but be delayed reaching some gateway pods. Cassandra — Discord\'s message store — is natively AP: it uses eventual consistency with a tunable replication factor. Writes are acknowledged when a quorum of replicas confirms, but reads may return slightly stale data. Discord accepts this because a message arriving 200ms late is far better than the app appearing frozen. The guarantee Discord makes: messages are never permanently lost (durable write to Cassandra) but real-time delivery may be temporarily inconsistent across gateway pods during partition events.',
        insight:
          'For a chat application, user experience demands availability. A frozen Discord during a partition would feel broken. Slightly out-of-order messages are invisible to most users — they never perceive sub-second ordering differences in a fast-moving chat.',
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          'Discord uses Apache Cassandra for message storage rather than PostgreSQL or MySQL. The schema is designed around the access pattern: partition key = (channel_id, bucket) where bucket = message_timestamp / BUCKET_MS (a time-window integer, e.g. 10-minute buckets). The clustering key = message_id (Snowflake). This means all messages for a channel within a time bucket are co-located on the same Cassandra node — a single disk seek retrieves all recent messages. SQL databases fail at this scale for three reasons: (1) B-tree indexes on billions of rows degrade — index maintenance becomes the bottleneck. (2) Sharding SQL requires application-level routing, losing JOIN capability across shards. (3) SQL write paths involve WAL, locking, and B-tree updates — at 200K msg/sec, this creates contention. Cassandra\'s LSM-tree (Log-Structured Merge-tree) converts random writes into sequential disk appends — optimal for append-heavy workloads like message logs. The trade-off: Cassandra has no JOIN support and limited query flexibility — Discord\'s queries are intentionally simple (fetch N messages by channel + time range), which fits the key-value access pattern perfectly.',
        insight:
          'The rule: pick your database based on your access pattern, not familiarity. Discord\'s access pattern is "give me the last 100 messages for channel X" — Cassandra\'s partition model makes this a single-node operation at any scale.',
      },
      {
        title: 'Message Broker: Why Kafka?',
        description:
          'Discord uses Apache Kafka as the backbone for event routing between services. Kafka topics are partitioned by channel_id, meaning all events for a given channel flow through the same partition — preserving ordering and allowing stateful consumers. The fanout service, presence service, and analytics pipelines all run as separate Kafka consumer groups, each processing the same event stream independently without coordination. Kafka\'s key advantages over RabbitMQ or AWS SQS: (1) Retention — Kafka retains messages for 7 days by default, enabling replay for new consumers and debugging. RabbitMQ deletes messages after consumption. (2) Throughput — Kafka achieves millions of events/sec per broker via sequential disk I/O and zero-copy networking. SQS is limited to ~3,000 msg/sec per queue without batching. (3) Consumer groups — Kafka allows N independent consumer groups to each receive every message, enabling fan-out to fanout service + analytics + audit log simultaneously without duplicate publishing. Discord partitions Kafka by channel_id for message events and by guild_id for presence events, ensuring related events are processed in order within a partition.',
        insight:
          'Kafka\'s log retention is underrated. When Discord deploys a new consumer service, it can replay the last 7 days of events from Kafka to bootstrap state — without touching the primary Cassandra store. This decouples new feature development from historical data migration.',
      },
      {
        title: 'Networking & Protocol Choices',
        description:
          'Discord uses WebSocket (WSS) for all client-to-gateway communication. HTTP polling was rejected because Discord delivers 46K events/sec globally — each event is server-initiated (someone else\'s message, presence update, typing indicator). HTTP polling would require clients to poll every 100ms to match Discord\'s latency SLA, generating 80M requests/sec for 8M connected clients — a 10,000× overhead vs WebSocket. Server-Sent Events (SSE) was rejected because it is unidirectional: clients also need to send messages, heartbeats, and commands to the gateway. WebSocket provides full-duplex communication over a single TCP connection. Load balancing for WebSocket requires sticky sessions — Discord uses consistent hashing based on user_id to route a user to the same gateway pod, preserving connection state. Internal services (fanout service, presence service, media transcoding) communicate via gRPC over HTTP/2 — strongly typed, efficient binary serialization, and streaming support for long-lived server-to-server calls. CDN (Cloudflare) handles all static assets: avatars, server icons, emoji images, and embedded media thumbnails. Voice data uses WebRTC\'s SRTP over UDP — TCP\'s retransmission guarantees are detrimental for real-time audio (a retransmitted audio packet from 200ms ago is useless).',
        insight:
          'Protocol choice is latency choice. WebSocket eliminates HTTP handshake overhead for server-push events. UDP for voice eliminates head-of-line blocking — a lost audio packet is better dropped than retransmitted late.',
      },
    ],

    decisions: [
      {
        question: 'WebSocket per user vs SSE vs polling',
        chosen: 'Persistent WebSocket',
        reason:
          'Discord is event-driven — 4B messages/day means 46K events/sec. Each user needs to receive events they didn\'t ask for (someone else\'s message). WebSocket\'s persistent connection eliminates the request overhead of polling and supports server-push natively. SSE is unidirectional — messages need bidirectional flow.',
      },
      {
        question: 'SFU vs MCU for voice',
        chosen: 'SFU (Selective Forwarding Unit)',
        reason:
          'An MCU (Multipoint Control Unit) mixes all audio server-side and sends one stream to each participant — CPU intensive. An SFU forwards individual streams — the client mixes them. Discord chose SFU because it\'s 10× cheaper in CPU at scale and allows the client to control which audio tracks to play (muting individual users). Trade-off: clients need more CPU to decode and mix N streams.',
      },
      {
        question: 'Cassandra vs PostgreSQL for message history',
        chosen: 'Cassandra',
        reason:
          'Message history is append-only, partitioned by channel, and read by recency. Cassandra\'s partition key = channel_id makes all messages for a channel co-located on the same node — O(1) recent-message lookup. PostgreSQL B-tree indexes for time-range queries degrade at billions of rows; Cassandra\'s SST-based storage handles petabytes without index maintenance overhead.',
      },
      {
        question: 'CAP theorem choice: CP vs AP for real-time messaging',
        chosen: 'AP (Availability + Partition Tolerance)',
        reason:
          'During a network partition, Discord chooses to keep delivering messages from available nodes rather than blocking until consistency is restored. For a chat app, a frozen UI is worse than a briefly out-of-order message. Cassandra\'s eventual consistency model aligns with this — writes are acknowledged by a quorum, reads may return slightly stale data, but the system never refuses service. Message durability is guaranteed (write to Cassandra before ack); real-time delivery ordering is best-effort.',
      },
      {
        question: 'Kafka vs RabbitMQ vs SQS for event routing',
        chosen: 'Apache Kafka',
        reason:
          'Kafka provides ordered event delivery per partition (critical for message ordering per channel), consumer group isolation (fanout, analytics, and audit log each get independent streams), multi-day retention for replay, and millions of events/sec throughput. RabbitMQ deletes messages after consumption, preventing replay. SQS has throughput limits and no ordering guarantee without FIFO queues (which have even lower throughput).',
      },
      {
        question: 'gRPC vs REST for internal service communication',
        chosen: 'gRPC (internal) + WebSocket (client-facing)',
        reason:
          'gRPC uses Protocol Buffers (binary, typed, compact) and HTTP/2 multiplexing for internal service calls. At Discord\'s event volume, the overhead of JSON serialization and HTTP/1.1 connection setup is measurable. gRPC streaming is also used for long-lived server-to-server connections like the fanout service streaming events to gateway pods. REST is used only for external public API endpoints where client compatibility matters.',
      },
    ],

    interview: [
      {
        q: 'How does Discord fan out a message in a 500K-member server to all online members in < 100ms?',
        a: 'Discord uses a scatter-gather fan-out via the dispatcher service. When a message arrives at a Gateway pod, it is published to Kafka (partitioned by channel ID). The dispatcher consumes the event and identifies all Gateway pods that have active connections for the guild — this mapping is maintained in a distributed registry. The dispatcher sends the event to all relevant Gateway pods in parallel (scatter); each pod delivers to its local WebSocket connections (gather). For the largest servers, a broadcast tree (dispatcher → 50 regional forwarders → gateway pods) reduces the dispatcher\'s direct fan-out. Critically, only members with the app actively open receive real-time push — inactive members get lazy-loaded events on next open.',
      },
      {
        q: 'How does Discord keep voice latency under 40ms?',
        a: 'Discord Voice uses WebRTC with a regional SFU (Selective Forwarding Unit). Each speaker sends audio to the nearest regional SFU once; the SFU forwards raw encoded audio packets to all listeners without transcoding. Because there is no audio mixing or re-encoding at the server, the server\'s role is pure packet forwarding — sub-millisecond server processing time. The dominant latency is network RTT to the regional SFU, which is kept under 20ms for most users by deploying SFU clusters in every major AWS region. WebRTC\'s SRTP transport is optimized for real-time audio with jitter buffers and forward error correction.',
      },
      {
        q: 'How does Discord\'s presence system work at 19M active servers without becoming a bottleneck?',
        a: 'Discord limits presence subscriptions to what is actually visible on the client. For servers under 1,000 members, the client subscribes to individual presence updates. For servers over 1,000 members, the client receives only an aggregate online count, synthesized server-side from a Redis HyperLogLog per guild. Presence events are published to Kafka and fanned out only to subscribers — not broadcast to all gateway pods. This converts a potentially O(N^2) fan-out (every member\'s status change delivered to all N other members) into an O(visible members) fan-out, which is bounded by the client\'s viewport.',
      },
      {
        q: 'How would you design Discord\'s message history retrieval to be instantly fast at billions of messages?',
        a: 'The key is the Cassandra data model: partition key = (channel_id, bucket) where bucket is a time-derived integer (e.g., floor(timestamp / BUCKET_SIZE)). All messages for a channel within a time window live on one Cassandra partition — one disk seek. Recent messages (last 100) are also cached in Redis keyed by channel_id so the common case (loading a channel) hits Redis and returns sub-millisecond. Discord\'s Snowflake IDs embed the timestamp, so "messages after ID X" is a Cassandra range scan by ID rather than requiring a secondary timestamp index. For very old messages (multi-year history), bucket-based partitioning limits partition size and avoids the "hot partition" problem of storing all messages for a popular channel in one unbounded partition.',
      },
      {
        q: 'How does Discord handle fan-out to a 500K-member server — why not just write to every member\'s inbox?',
        a: 'Writing to every member\'s inbox (push model) would require 250K Redis writes per message for a 500K-member server with 50% online — at 200K msg/sec peak, that is 50B Redis writes/sec, impossible. Discord uses a gateway-broadcast model instead: the dispatcher identifies which gateway pods host connections for members of that guild and broadcasts the event to those pods only. Each pod then delivers to its local connected sockets. The key optimization is that the dispatcher only contacts pods with active connections — if 250K online members are spread across 2,500 gateway pods (100 members/pod), the dispatcher sends 2,500 events, not 250K. The scatter is to pods, not to individual connections.',
      },
      {
        q: 'Why does Discord use Cassandra over PostgreSQL? What specific schema decisions make it work?',
        a: 'PostgreSQL B-tree indexes degrade at billions of rows — index maintenance locks, bloat, and checkpoint pressure become unavoidable. Sharding PostgreSQL sacrifices JOIN capability. Cassandra\'s LSM-tree converts all writes to sequential disk appends, giving consistent write throughput regardless of dataset size. The schema: PRIMARY KEY ((channel_id, bucket), message_id) where bucket = message_timestamp / 86400000 (daily buckets). channel_id + bucket is the partition key, co-locating all messages for a channel-day on one node. message_id (Snowflake) is the clustering key, providing chronological sort order. Fetching the last 50 messages is: SELECT * FROM messages WHERE channel_id = X AND bucket = TODAY ORDER BY message_id DESC LIMIT 50 — one partition, one seek. This query stays O(1) regardless of total message count in the system.',
      },
    ],

    keyInsight:
      'Discord\'s Cassandra data model is the core of their scale. Partitioning messages by (channel_id, bucket) means every read for recent messages in a channel hits exactly one Cassandra partition — one disk seek. At 4B messages/day across millions of channels, this O(1) read property means message history latency doesn\'t degrade as the platform grows. The data model was the architectural bet that made everything else possible.',
  },

  {
    id: 'twitter-x',
    icon: '🐦',
    name: 'Twitter / X',
    color: '#000000',
    scale: '500M tweets/day · 200M daily active users · 300K tweets/sec peak',
    focus: 'Tweet Fanout, Trending, and Real-Time Timeline at Scale',
    problem:
      'Design Twitter\'s core systems: a user posts a tweet and it appears in the home timelines of all their followers within seconds, even for accounts with 100M+ followers like Barack Obama or Elon Musk. The system must handle 500M tweets/day, deliver timelines in under 100ms, and surface trending topics globally within 10 minutes of a trend emerging.',

    functionalReqs: [
      'Users post tweets (280 chars + images/video); appears in followers\' timelines within seconds',
      'Home timeline shows tweets from followed accounts in reverse-chronological order (with ranking)',
      'Users can like, retweet, reply, quote-tweet with counts visible in real time',
      'Search: full-text search across all tweets within seconds of posting',
      'Trending topics: real-time list of trending hashtags globally and by city',
      'Notifications: users notified of likes, replies, retweets within seconds',
    ],

    nonFunctionalReqs: [
      { label: 'Tweet delivery to timeline', value: '< 5 seconds for 95% of followers' },
      { label: 'Timeline read latency', value: '< 100ms for home timeline load' },
      { label: 'Trending refresh', value: 'Trends updated within 10 minutes of a topic emerging' },
      { label: 'Search indexing', value: 'Tweet searchable within 15 seconds of posting' },
      { label: 'Scale', value: 'Handle 300K tweets/sec during peak events (World Cup final, elections)' },
    ],

    scaleEstimation: [
      {
        label: 'Tweets/day',
        value: '500M',
        note: '~5,800/sec avg; 300K/sec peak during major events',
      },
      {
        label: 'Daily active users',
        value: '200M',
        note: 'Each reads timeline ~8 times/day = 1.6B timeline reads/day',
      },
      {
        label: 'Avg followers per user',
        value: '200',
        note: '1 tweet = 200 fanout writes on average',
      },
      {
        label: 'Celebrity tweet fanout',
        value: 'Obama (130M followers) = 130M timeline writes per tweet',
        note: 'The thundering herd problem',
      },
      {
        label: 'Timeline reads/sec',
        value: '~18,500',
        note: '1.6B / 86,400 seconds',
      },
      {
        label: 'Storage',
        value: '500M tweets × 280 bytes = ~140 GB/day text; images/video stored separately on S3',
      },
    ],

    highLevelDesign: [
      {
        title: 'Tweet Write Path',
        description:
          'User posts tweet → API server validates → writes to tweet store (MySQL sharded by tweet_id) → publishes to Kafka → fanout service consumes and writes tweet_id to each follower\'s pre-computed timeline cache in Redis.',
      },
      {
        title: 'Timeline Read Path (Push model)',
        description:
          'User opens app → load timeline by reading their Redis sorted set (ZSET ranked by timestamp) → fetch tweet content for each tweet_id from tweet cache (Redis) → return ranked feed. Sub-100ms because everything is in Redis cache.',
      },
      {
        title: 'Celebrity Fanout (Pull model hybrid)',
        description:
          'Accounts with 10M+ followers use pull-on-read instead of push. When a user loads their timeline, Twitter fetches the last N tweets from each celebrity they follow and merges them with their pre-computed timeline cache. Avoids 130M writes per Obama tweet.',
      },
      {
        title: 'Search via Earlybird',
        description:
          'Twitter\'s real-time search index (Earlybird, based on Lucene) indexes tweets within 15 seconds. Each shard handles a time-window of tweets. Search queries fan out to all shards in parallel, results are merged by recency. Trending is computed by a streaming MapReduce over Earlybird\'s index.',
      },
      {
        title: 'Notification Service',
        description:
          'Likes/retweets/replies trigger events via Kafka. The notification service reads from Kafka and writes to each recipient\'s notification queue (stored in Manhattan, Twitter\'s custom key-value store). Push notifications sent via APNs/FCM for mobile.',
      },
    ],

    deepDive: [
      {
        title: 'The celebrity tweet fanout problem',
        description:
          'Tweeting for a regular user with 200 followers means 200 Redis writes — instant. Obama tweeting to 130M followers means 130M Redis ZADD operations. At 100K writes/sec per Redis node, that\'s 1,300 seconds (22 minutes) to fanout one tweet. Twitter\'s solution: a hybrid push/pull model. Regular users (<10K followers) use push (pre-computed timelines). Celebrities (>10K followers) use pull — their tweets are fetched on-demand when a follower loads their timeline and merged with the pre-computed feed.',
        insight:
          'The celebrity threshold is the core architectural decision. By treating accounts above ~10K followers as pull sources rather than push targets, Twitter avoids the thundering herd entirely — the cost of a celebrity tweet is now amortized across timeline reads rather than paid upfront in a single fanout burst.',
      },
      {
        title: 'Timeline cache with Redis sorted sets',
        description:
          'Every user has a Redis ZSET keyed by user_id. Each member is a tweet_id; score is the tweet timestamp (Unix ms). ZADD adds a tweet; ZREVRANGE fetches the N most recent. The cache holds the last 800 tweet_ids per user (sufficient for any reasonable session). ZSET operations are O(log N) — fast even at 800 entries. When the cache is cold (user hasn\'t logged in for 30 days), Twitter rebuilds it from Cassandra.',
        insight:
          'Storing only tweet_ids (not full tweet content) in the timeline cache keeps each user\'s ZSET tiny — 800 tweet IDs is ~6KB per user. At 200M users, the entire timeline cache fits in ~1.2TB of Redis — a manageable fleet. Full tweet content is fetched separately from a shared tweet cache hit by many users simultaneously.',
      },
      {
        title: 'Trending topics via counting bloom filters',
        description:
          'Trends require counting hashtag frequency over a sliding 24-hour window across 500M tweets. Twitter uses a distributed counting sketch (Count-Min Sketch) — a probabilistic data structure that estimates frequency with bounded error using fixed memory. Trending is defined as abnormal acceleration, not raw count: "#WorldCup" might have 1M mentions/day normally; 10M mentions in 1 hour is a trend. Twitter\'s trending algorithm computes velocity (rate of change), not absolute count.',
        insight:
          'Velocity over volume is the insight. A hashtag that suddenly surges 10× in one hour is a trend even if its absolute count is lower than a perennially popular tag. This prevents evergreen topics from permanently dominating the trending list.',
      },
      {
        title: 'Hot tweet caching',
        description:
          'A tweet from a celebrity going viral (1M likes in 10 minutes) creates a hot key in the tweet content cache. Read requests for that tweet_id hit the same cache shard. Twitter mitigates with local in-process caches in the API tier — each API server caches hot tweet content for 1 second. At 1,000 API servers, a tweet with 100K reads/sec is served from local cache, hitting the Redis shard only ~1,000 times/sec (100× reduction).',
        insight:
          'Local in-process caching with a 1-second TTL is the viral tweet defense. The trade-off (1 second of stale like counts) is invisible to users but provides a 100× reduction in Redis hot-key pressure during the exact moments when traffic is highest.',
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          'Twitter chooses AP (Availability + Partition Tolerance) for timelines and social graph reads. During a network partition, Twitter continues serving timelines from whatever data is available — a user may see a slightly stale timeline (missing the last few seconds of tweets) rather than receiving an error. This is "eventual consistency" for feeds: the guarantee is that timelines will converge to the correct state, not that they are immediately consistent. Twitter\'s tweet store (MySQL sharded) prioritizes CP for the canonical tweet record — a tweet, once written, must not be lost. But the fanout layer and timeline caches are AP: a Redis ZADD that fails due to a network partition is retried asynchronously, and the follower\'s timeline may lag by seconds. For social media, this trade-off is correct: users tolerate a tweet appearing a few seconds late; they cannot tolerate timeline pages returning HTTP 500.',
        insight:
          'Twitter applies CAP at the subsystem level, not the whole system. The write path to MySQL (canonical tweet) is CP. The read path (timeline cache, fanout) is AP. Mixing consistency models per subsystem based on user-facing impact is the mature approach.',
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          'Twitter uses a multi-database strategy. Tweets themselves are stored in MySQL sharded by tweet_id — MySQL because tweets are immutable after posting, the access pattern is pure key lookup (tweet by ID), and ACID guarantees prevent tweet loss. At Twitter\'s scale, MySQL is horizontally sharded: tweet_id % num_shards determines the shard. The social graph (follow relationships) is stored in a custom graph store (FlockDB, now deprecated; replaced by internal graph services backed by MySQL). The timeline cache uses Redis ZSETs. Engagement counts (likes, retweets, replies) are stored in Manhattan, Twitter\'s internal distributed key-value store, optimized for high write throughput from atomic increments. A pure NoSQL approach for tweets was considered but rejected: Cassandra\'s eventual consistency for the canonical tweet record would risk tweet duplication or loss during partition recovery — unacceptable for the primary content store. NoSQL excels for the high-write, high-read count data (Manhattan for engagements) where eventual consistency is acceptable.',
        insight:
          'Choosing SQL for tweets and NoSQL for engagements is not inconsistency — it is precision. Tweets require durability guarantees (CP); like counts require write throughput and tolerate eventual consistency (AP). Match the database to the consistency requirement of each data type.',
      },
      {
        title: 'Message Broker: Why Kafka?',
        description:
          'Twitter uses Kafka as the central event bus connecting tweet writes to the fanout service, notification service, search indexer (Earlybird), analytics, and ML feature pipelines. Kafka topics are partitioned by user_id for follow-graph events and by tweet_id for engagement events. Each downstream consumer (fanout, notifications, Earlybird indexer) operates as an independent Kafka consumer group — they all receive every tweet event without coordinating. Kafka\'s throughput advantage is critical at Twitter\'s scale: 5,800 tweets/sec × average 200 followers = 1.16M fanout events/sec sustained, with 300K tweet/sec peaks generating 60M fanout events/sec. Kafka handles this via sequential disk writes and zero-copy networking — a single Kafka broker sustains 1M+ events/sec. RabbitMQ at this throughput would require thousands of queues and complex routing topologies. SQS FIFO queues cap at 3,000 msg/sec per queue. Kafka also retains events for 7 days: when Earlybird\'s search index falls behind, it can replay from Kafka without impacting the primary tweet store.',
        insight:
          'Kafka\'s consumer group model is what makes Twitter\'s pipeline composable. Adding a new downstream consumer (e.g., a new ML feature store) requires zero changes to the tweet write path — subscribe a new consumer group to the existing topic and replay from the beginning.',
      },
      {
        title: 'Networking & Protocol Choices',
        description:
          'Twitter\'s client communication uses HTTPS/REST for most reads (timeline, tweet fetches) and Server-Sent Events (SSE) for streaming timeline updates to web clients. Unlike Discord, Twitter\'s communication is predominantly read-heavy and request-response oriented — a user requests their timeline and Twitter returns it. SSE is sufficient for streaming new tweets to an open tab (unidirectional server push). WebSocket is used only for the direct message (DM) inbox, which requires bidirectional communication. Internally, Twitter\'s services communicate via Finagle (Twitter\'s open-source RPC framework built on Netty), which uses Thrift serialization — analogous to gRPC but predating it. Consistent hashing routes requests for the same user\'s timeline to the same API server tier cluster, improving local cache hit rates. Cloudflare and Twitter\'s own CDN (via PoPs) serve all media — images, videos, and GIFs are stored in S3-compatible blob storage and served from the nearest CDN edge. Tweet content API responses are cached at the CDN edge for a short TTL (1-5 seconds), absorbing viral tweet read spikes before they reach origin servers.',
        insight:
          'Twitter chooses SSE over WebSocket for timeline streaming because tweets flow one direction: server to client. WebSocket\'s bidirectional overhead is unnecessary for a read-dominated feed. Protocol minimalism — use only what the use case requires.',
      },
    ],

    decisions: [
      {
        question: 'Push fanout vs pull fanout for timelines',
        chosen: 'Push for regular users, pull for celebrities (hybrid)',
        reason:
          'Pure push requires 130M writes per Obama tweet — unacceptably slow. Pure pull requires reading from every followed account\'s tweet store on timeline load — O(following count) reads at load time, too slow for users following 2,000 accounts. The hybrid uses push for the long tail of normal users and pull for celebrities who would otherwise be the bottleneck.',
      },
      {
        question: 'MySQL vs Cassandra for tweet storage',
        chosen: 'MySQL (sharded by tweet_id)',
        reason:
          'Tweets are immutable after posting (the core content never changes). Sharding by tweet_id distributes load evenly. MySQL\'s ACID properties guarantee tweet durability. Unlike messaging (append-heavy, time-range reads), tweet lookup is pure key-value (tweet by ID) — MySQL handles this with a primary key index at sub-millisecond latency.',
      },
      {
        question: 'Lucene vs custom search index',
        chosen: 'Earlybird (custom Lucene-based)',
        reason:
          'Standard Lucene is not real-time — index merges happen in batch. Twitter modified Lucene to use a write-optimized in-memory segment that is queryable immediately, then flushed to disk. This delivers the 15-second indexing SLA. Standard Elasticsearch (which uses Lucene) cannot meet this without similar modifications.',
      },
      {
        question: 'CAP theorem choice: CP vs AP for timeline reads',
        chosen: 'AP (Availability + Partition Tolerance)',
        reason:
          'During a network partition, Twitter continues serving timelines from cached data rather than blocking. A user seeing a timeline that is 10 seconds stale is acceptable — a timeline page that returns an error is not. The tweet write path (MySQL) is CP for canonical durability, but all read paths (Redis timeline cache, CDN, API cache) are AP with eventual consistency. This split applies CAP at the appropriate layer for each user-facing guarantee.',
      },
      {
        question: 'Kafka vs SQS vs RabbitMQ for event routing',
        chosen: 'Apache Kafka',
        reason:
          'At 5,800 tweets/sec with 200 avg followers, fanout generates 1.16M events/sec sustained. Kafka handles millions of events/sec per broker via sequential I/O. Multiple independent consumer groups (fanout, notifications, search indexer, analytics) each receive every event without the publisher managing separate queues per consumer. 7-day retention allows replay for new consumers and incident recovery.',
      },
      {
        question: 'SQL vs NoSQL for engagement counts (likes, retweets)',
        chosen: 'Manhattan (internal NoSQL key-value store)',
        reason:
          'Like counts receive millions of atomic increments per second during viral events — a pattern that causes severe lock contention in SQL. Manhattan is purpose-built for high-throughput atomic increments with eventual consistency. The trade-off (like counts may be off by a small margin during partition recovery) is acceptable; tweet durability is not sacrificed because tweets themselves remain in MySQL.',
      },
    ],

    interview: [
      {
        q: 'How does Twitter deliver a celebrity\'s tweet to 130M followers within 5 seconds?',
        a: 'Twitter uses a hybrid push/pull fanout. For regular users (<10K followers), the fanout service writes the tweet_id to each follower\'s Redis timeline ZSET immediately — this is fast because 200 Redis writes complete in milliseconds. For celebrities (>10K followers), Twitter does not push to follower timelines at tweet time. Instead, when a follower loads their home timeline, the timeline service fetches the celebrity\'s recent tweets on-demand and merges them with the pre-computed timeline from Redis. The merge is done in-memory in the API tier using a k-way merge of sorted tweet_id lists. The 5-second SLA is met because the merge is fast (CPU-bound, not I/O-bound) and celebrity tweets are already cached in the tweet content cache.',
      },
      {
        q: 'How does Twitter\'s home timeline achieve sub-100ms load time at 200M DAU?',
        a: 'The timeline load path is entirely in-memory. Each user has a pre-computed Redis ZSET containing their last 800 tweet_ids. A single ZREVRANGE command retrieves the top N tweet_ids in O(log N) time — typically under 1ms. Tweet content (text, media URLs, like counts) is fetched from a separate Redis tweet cache, which is a flat key-value store keyed by tweet_id. Since popular tweets are read by many users, the tweet cache has very high hit rates. Celebrity tweets are merged in-memory at read time. The entire path — ZREVRANGE + N cache lookups + celebrity merge — completes in under 50ms for most users. The p99 case involves cache misses or cold timelines, handled by async rebuilds from Cassandra.',
      },
      {
        q: 'How would you design the trending topics feature?',
        a: 'Trending requires computing hashtag velocity over a sliding time window across 500M tweets/day. The pipeline: (1) Every tweet write event is published to Kafka. (2) A stream processing job (Flink or Spark Streaming) consumes the Kafka stream and maintains a Count-Min Sketch per hashtag per 5-minute window — this gives approximate frequency counts with bounded error in fixed memory. (3) A separate job computes velocity: current window count divided by the trailing 24-hour average for the same hashtag. Hashtags with velocity > threshold are candidates for trending. (4) A ranking job sorts candidates by velocity and applies filters (spam, duplicates, sensitive content). (5) Trending lists are written to a cache (updated every few minutes) and served globally, with city-level trends derived by geo-tagging tweets at ingest. The 10-minute SLA is met because the pipeline end-to-end latency is under 5 minutes.',
      },
      {
        q: 'How does Twitter handle hot tweets that receive 1M likes in 10 minutes without melting the database?',
        a: 'Three layers of caching defend against hot tweets. First, like counts are stored in Redis with atomic INCR — not in MySQL — so like writes are single Redis operations at high throughput. Second, tweet content is cached in a distributed Redis cluster keyed by tweet_id. A viral tweet will hit the same shard repeatedly, creating a hot key. Twitter mitigates this with local in-process (heap) caching in each API server with a 1-second TTL — 1,000 API servers absorb 100K reads/sec locally, reducing the Redis shard to ~1,000 QPS. Third, for extreme viral events, Twitter can replicate hot tweet entries across multiple Redis slots (key sharding with a random suffix) and read from any replica. The trade-off — slightly stale like counts for 1 second — is imperceptible to users and avoids a cascading Redis failure.',
      },
      {
        q: 'Why does Twitter use eventual consistency for timelines? Is that safe?',
        a: 'Eventual consistency is safe for timelines because the failure mode is benign: a user sees a tweet 5 seconds late. The alternative — blocking timeline reads until all fanout writes are consistent — would mean every Obama tweet causes 130M read requests to wait. Twitter applies strong consistency only where data loss is unacceptable (the canonical tweet in MySQL uses synchronous replication). Timeline caches (Redis ZSETs) use eventual consistency: a failed fanout write is retried asynchronously, and the timeline converges to correct state within seconds. This is the CAP AP choice — availability over consistency — with the key insight that "slightly stale timeline" is a user-invisible failure mode, while "timeline page error" is a user-visible failure. Match your consistency model to the user impact of inconsistency, not to a blanket policy.',
      },
      {
        q: 'SQL vs NoSQL for social media — when would you choose each?',
        a: 'Choose SQL (MySQL/PostgreSQL) when: data is the canonical source of truth requiring ACID guarantees (tweets, user accounts, payment records), access patterns are key-value or simple range queries on a bounded dataset, and schema is stable. Choose NoSQL when: write throughput requirements exceed what a single SQL primary can sustain (engagement counts needing millions of atomic increments/sec → Manhattan/Redis), access patterns are append-only time-series with time-range reads (message history → Cassandra partition by (channel_id, bucket)), or the data is a cache layer where eventual consistency is acceptable (timeline caches → Redis). Twitter uses both in the same product: MySQL for tweets (CP, durable), Redis for caches (AP, fast), Manhattan for counts (AP, high-throughput). The question is never "SQL or NoSQL globally" — it is "what consistency and throughput does this specific data type require?"',
      },
    ],

    keyInsight:
      'Twitter\'s fundamental insight is that reads (timeline views) vastly outnumber writes (tweets). 200M users read timelines 8 times/day = 1.6B reads. 500M tweets/day = 5,800 writes/sec. The 275:1 read/write ratio means the right trade-off is to do expensive work at write time (fanout to all followers\' Redis caches) to make read time trivial (single Redis ZRANGE). This is the core architectural bet of Twitter\'s design.',
  },
];
