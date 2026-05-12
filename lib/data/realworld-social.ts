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
        a: 'Discord limits presence subscriptions to what is actually visible on the client. For servers under 1,000 members, the client subscribes to individual presence updates. For servers over 1,000 members, the client receives only an aggregate online count, synthesized server-side from a Redis HyperLogLog per guild. Presence events are published to Kafka and fanned out only to subscribers — not broadcast to all gateway pods. This converts a potentially O(N²) fan-out (every member\'s status change delivered to all N other members) into an O(visible members) fan-out, which is bounded by the client\'s viewport.',
      },
      {
        q: 'How would you design Discord\'s message history retrieval to be instantly fast at billions of messages?',
        a: 'The key is the Cassandra data model: partition key = (channel_id, bucket) where bucket is a time-derived integer (e.g., floor(timestamp / BUCKET_SIZE)). All messages for a channel within a time window live on one Cassandra partition — one disk seek. Recent messages (last 100) are also cached in Redis keyed by channel_id so the common case (loading a channel) hits Redis and returns sub-millisecond. Discord\'s Snowflake IDs embed the timestamp, so "messages after ID X" is a Cassandra range scan by ID rather than requiring a secondary timestamp index. For very old messages (multi-year history), bucket-based partitioning limits partition size and avoids the "hot partition" problem of storing all messages for a popular channel in one unbounded partition.',
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
    ],

    keyInsight:
      'Twitter\'s fundamental insight is that reads (timeline views) vastly outnumber writes (tweets). 200M users read timelines 8 times/day = 1.6B reads. 500M tweets/day = 5,800 writes/sec. The 275:1 read/write ratio means the right trade-off is to do expensive work at write time (fanout to all followers\' Redis caches) to make read time trivial (single Redis ZRANGE). This is the core architectural bet of Twitter\'s design.',
  },
];
