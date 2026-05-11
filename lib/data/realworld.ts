import { RealWorldSystem } from '../types';
import { REALWORLD_AWS } from './realworld-aws';
import { REALWORLD_PATTERNS } from './realworld-patterns';

const REALWORLD_BASE: RealWorldSystem[] = [
  {
    id: 'netflix',
    icon: '🎬',
    name: 'Netflix',
    color: '#e50914',
    scale: '238M subscribers · 15M+ concurrent streams · 190 countries',
    focus: 'Video Streaming Service',
    problem:
      'Design the core streaming pipeline that delivers 4K video to 238M subscribers worldwide with under 2-second startup time, adaptive quality, and 99.99% availability — even during a viral season-premiere spike.',

    functionalReqs: [
      'Users can search, browse, and stream movies and TV shows',
      'Playback resumes from the last watched position across any device',
      'Video quality adapts automatically to available bandwidth (360p → 4K)',
      'New content is uploaded, transcoded, and published without downtime',
      'Multiple simultaneous streams per account (depending on plan)',
      'Download for offline viewing on mobile devices',
    ],

    nonFunctionalReqs: [
      { label: 'Availability', value: '99.99% uptime (< 52 min/year downtime)' },
      { label: 'Startup Latency', value: '< 2 seconds to first frame globally' },
      { label: 'Peak Throughput', value: '45 Tbps during peak evening hours' },
      { label: 'Consistency', value: 'Eventually consistent — resume position within seconds' },
      { label: 'Durability', value: 'Master video files replicated across 3+ regions' },
      { label: 'Scalability', value: 'Horizontal scale from 1M → 15M concurrent streams in hours' },
    ],

    scaleEstimation: [
      { label: 'Daily Active Users', value: '~80M', note: '~33% of 238M subscribers' },
      { label: 'Peak Concurrent Streams', value: '15M', note: 'Weekday evenings, US primetime' },
      { label: 'Avg Bitrate (1080p)', value: '5 Mbps', note: '4K ≈ 25 Mbps, 480p ≈ 1.5 Mbps' },
      { label: 'Peak Bandwidth', value: '15M × 5 Mbps = 75 Tbps', note: 'Borne mostly by Open Connect' },
      { label: 'Catalog Size', value: '~15,000 titles × ~10 resolutions × ~8 GB avg = 1.2 PB', note: 'Stored in Amazon S3' },
      { label: 'Upload Events/Day', value: '~500B playback events via Kafka', note: 'Feeds recommendations & analytics' },
    ],

    highLevelDesign: [
      {
        title: 'Client → API Gateway (Zuul)',
        description:
          'Every app request hits Zuul first. Zuul handles auth token validation, rate limiting, A/B test bucketing, and routes to the correct microservice. Running on AWS, it processes 100B+ API calls per day.',
      },
      {
        title: 'Playback Service → Manifest Generation',
        description:
          'When a user hits Play, the Playback Service authenticates the request, resolves the CDN server closest to the user, and returns a streaming manifest (MPEG-DASH or HLS). The manifest lists every quality tier URL so the player can switch dynamically.',
      },
      {
        title: 'Open Connect CDN → Video Delivery',
        description:
          'Netflix\'s custom CDN. Instead of renting from Akamai, Netflix places its own Open Connect Appliances (OCAs) inside ISPs globally. 95% of traffic is served locally — the video never traverses the public internet backbone.',
      },
      {
        title: 'Adaptive Bitrate Player',
        description:
          'The client player continuously measures download speed and buffer health. It switches quality tiers every few seconds using the DASH/HLS manifest segments. On a good connection it climbs to 4K; on congestion it drops to 480p — no buffering spinner.',
      },
      {
        title: 'Kafka → Recommendations & Analytics',
        description:
          'Every play, pause, seek, and rating event is published to Kafka. Downstream consumers update the real-time recommendation model, feed A/B test dashboards, and populate the data warehouse for content acquisition decisions.',
      },
    ],

    deepDive: [
      {
        title: 'Open Connect — The Secret Weapon',
        description:
          'Netflix operates its own CDN with servers inside hundreds of ISPs worldwide. An ISP gets an Open Connect Appliance (a rack of servers with 100–200 TB of disk) for free in exchange for serving Netflix traffic locally. During off-peak hours, Netflix pre-positions the next day\'s popular content to each OCA via a \"fill\" process. When users watch, traffic never leaves the ISP — eliminating peering costs and dramatically cutting latency.',
        insight:
          'Cache invalidation is a fill problem, not a CDN problem. Netflix controls exactly what content sits on each OCA and refreshes it nightly.',
      },
      {
        title: 'Transcoding Pipeline',
        description:
          'Each uploaded video is split into scene-sized chunks and transcoded in parallel across hundreds of AWS instances using FFmpeg. Netflix produces 1,200+ delivery files per title: every combination of resolution (360p→4K), codec (H.264, H.265, AV1), HDR format, and audio track. The result is stored in Amazon S3 and pushed to OCAs.',
        insight:
          'AV1 codec achieves same quality at 20% lower bitrate vs H.265 — meaning less bandwidth, lower CDN costs, and better mobile streaming.',
      },
      {
        title: 'Cassandra for Viewing History',
        description:
          'Resume position and viewing history are stored in Apache Cassandra — a wide-column NoSQL database. The key design: userId as partition key, timestamp as clustering key. Reads and writes are O(1) lookups. Netflix runs one of the world\'s largest Cassandra clusters with billions of rows and sub-millisecond p99 reads.',
        insight: 'The data model drives everything. Partition by userId means all history for a user lives on the same node — one disk seek for a resume.',
      },
      {
        title: 'Chaos Engineering — Chaos Monkey',
        description:
          'Netflix\'s Simian Army (led by Chaos Monkey) randomly terminates EC2 instances in production during business hours. The philosophy: if a failure can happen, it will — so find the weak spots before a real outage does. Every service must be designed to survive its dependencies dying unexpectedly. This culture forced retry logic, circuit breakers, and graceful degradation into every microservice.',
        insight: 'Chaos Monkey is a forcing function. Teams stopped writing brittle code because they knew their instances would be killed at any time.',
      },
    ],

    decisions: [
      {
        question: 'Build our own CDN (Open Connect) vs use a third-party CDN?',
        chosen: 'Build Open Connect',
        reason:
          'At Netflix\'s scale, third-party CDN costs would be billions per year. Open Connect shifts the cost to hardware placement (servers are given free to ISPs). It also gives Netflix direct control over caching policy, fill schedules, and routing — impossible with a black-box CDN. The break-even point is around 10M concurrent streams.',
      },
      {
        question: 'MySQL vs Cassandra for viewing history and resume position?',
        chosen: 'Cassandra',
        reason:
          'Viewing history is write-heavy (every minute of playback writes an event), append-only, and queried only by userId. Cassandra\'s LSM-tree storage handles write throughput 10× better than MySQL B-trees. Cross-region replication is built-in. ACID transactions are not needed — a slightly stale resume point is acceptable.',
      },
      {
        question: 'Push recommendations (precompute) vs pull (real-time compute)?',
        chosen: 'Precompute offline, serve from cache',
        reason:
          'Collaborative filtering over 238M user histories cannot be run in real-time per request. Netflix trains models offline (Spark), stores ranked recommendation lists per user in Cassandra, and serves them at <1ms from cache. Real-time signals (you just watched X) trigger lightweight re-ranking, not full model inference.',
      },
    ],

    interview: [
      {
        q: 'How would you design Netflix\'s video streaming architecture?',
        a: 'Start with requirements: 15M concurrent streams, <2s startup, adaptive quality, 99.99% uptime. High-level: client → API Gateway → Playback Service returns a CDN manifest → client fetches video segments from CDN. Key insight: Netflix\'s Open Connect CDN places servers inside ISPs so traffic stays local. Adaptive bitrate (DASH/HLS) handles quality switching. Viewing events flow through Kafka to recommendations and analytics.',
      },
      {
        q: 'How does Netflix achieve under 2-second startup time globally?',
        a: 'Three layers: (1) Open Connect serves content from within the user\'s ISP — no cross-internet hops. (2) The Playback Service pre-selects the optimal OCA and encodes it in the manifest — no redirect chains. (3) The player pre-buffers the first 10 seconds in background while the user is browsing. All three together collapse startup to <2s even from cold cache.',
      },
      {
        q: 'How would you handle the thundering herd when a viral show premieres?',
        a: 'Three mitigations: (1) OCAs are pre-filled the night before a premiere — content is already at the edge. (2) The Playback Service uses weighted traffic shifting to spread load across multiple OCAs. (3) If an OCA is saturated, the manifest can fall back to a regional AWS CloudFront origin. Chaos Engineering ensures these fallback paths are exercised regularly so they work when needed.',
      },
      {
        q: 'How would you design the resume-position feature across devices?',
        a: 'Store (userId, contentId) → position in Cassandra with a write-through cache in Redis for the active session. When playback starts, read from Cassandra (< 1ms). Writes happen every 30 seconds during playback. Eventual consistency is fine — if a user switches devices, a 30-second stale resume is acceptable. Use Kafka to fan out position updates to analytics and continue-watching recommendations.',
      },
      {
        q: 'What would you do if the CDN goes down?',
        a: 'Graceful degradation in layers: (1) Route around saturated OCAs to healthy ones within the same ISP using DNS health checks. (2) Fall back to Akamai or CloudFront as backup CDN — Netflix maintains hot failover agreements. (3) Drop quality tiers to reduce bandwidth pressure. (4) Circuit breakers in the Playback Service stop routing to unhealthy OCAs. During the 2012 Christmas Eve AWS outage, these fallbacks kept streaming alive for most users.',
      },
    ],

    keyInsight:
      'Open Connect is the moat. By placing servers inside ISPs, Netflix turned the internet backbone into a non-factor. 95% of traffic is served from inside the user\'s own ISP. No competitor can replicate this overnight — it took Netflix a decade and thousands of hardware placements.',
  },

  {
    id: 'uber',
    icon: '🚗',
    name: 'Uber',
    color: '#276EF1',
    scale: '5M trips/day · 1M+ active drivers · 130+ countries',
    focus: 'Ride Matching & Real-Time Driver Location Service',
    problem:
      'Design a system that ingests GPS location from 1M+ active drivers every 4 seconds, then matches any rider to the best available driver within 500ms — globally, at any time of day.',

    functionalReqs: [
      'Drivers can go online/offline and continuously broadcast their location',
      'Riders can request a ride and be matched to a nearby available driver',
      'Real-time ETA calculation and live trip tracking on the map',
      'Surge pricing based on real-time supply/demand ratio per area',
      'Drivers can accept or decline a ride request',
      'Riders and drivers can see each other\'s live position during the trip',
    ],

    nonFunctionalReqs: [
      { label: 'Location Update Frequency', value: 'Every 4 seconds per active driver' },
      { label: 'Matching Latency', value: '< 500ms from ride request to driver notification' },
      { label: 'Location Write Throughput', value: '~250,000 GPS updates/second at peak' },
      { label: 'Availability', value: '99.99% — downtime means lost revenue and stranded riders' },
      { label: 'Consistency', value: 'Stale driver location acceptable up to ~8 seconds' },
      { label: 'Geo Coverage', value: 'Global — 130 countries, varying mobile network quality' },
    ],

    scaleEstimation: [
      { label: 'Active Drivers at Peak', value: '~1M', note: 'Global across all cities' },
      { label: 'Location Updates/sec', value: '1M ÷ 4s = 250,000 writes/sec', note: 'Each update ~100 bytes' },
      { label: 'Location Write Bandwidth', value: '250K × 100B = 25 MB/sec', note: 'Manageable for Kafka' },
      { label: 'Active Driver Location Storage', value: '1M × 100B = 100 MB', note: 'Fits entirely in Redis RAM' },
      { label: 'Trip Requests/sec', value: '5M trips/day ÷ 86,400 = ~58/sec avg, ~200/sec peak', note: '' },
      { label: 'Geo Query per Request', value: '~10 candidate drivers checked per match', note: 'H3 hex cell lookup' },
    ],

    highLevelDesign: [
      {
        title: 'Driver App → Location Service',
        description:
          'Every 4 seconds, the driver app sends a GPS payload (driverId, lat, lng, heading, speed, timestamp) over a persistent WebSocket. The Location Service writes it to Kafka and updates Redis with the latest position.',
      },
      {
        title: 'Redis — Active Driver Location Store',
        description:
          'Redis stores the current position of every active driver. The key is the H3 hex cell ID (resolution 7 ≈ 5 km² cells). This makes driver lookup O(1) — query a cell, get all drivers in it. Data TTL of 30 seconds automatically removes drivers who go offline.',
      },
      {
        title: 'Rider Request → Matching Service',
        description:
          'Rider submits a pickup location. The Matching Service converts it to an H3 cell, queries Redis for drivers in that cell and adjacent cells, scores candidates by ETA + rating + cancellation rate, and selects the best match.',
      },
      {
        title: 'Notification Service → Driver Push',
        description:
          'The matched driver receives a push notification via APNs/FCM with a 15-second accept window. If declined or timed out, the Matching Service tries the next candidate. The rider sees a spinner with "Finding your driver…".',
      },
      {
        title: 'Surge Pricing Engine',
        description:
          'A Kafka Streams job continuously reads driver location events and rider request events, computes supply/demand ratio per H3 cell every 60 seconds, and publishes surge multipliers. The Pricing Service reads these multipliers to calculate fares before a rider confirms.',
      },
    ],

    deepDive: [
      {
        title: 'H3 Hexagonal Grid — Spatial Indexing',
        description:
          'Uber uses Uber\'s own H3 library which divides the entire Earth into a hierarchy of hexagonal cells. At resolution 7, each hex covers ~5 km². Unlike square grids, hexagons have uniform distance to all 6 neighbors — no corner artifacts. A driver lookup becomes: hash lat/lng to a cell ID, fetch that cell\'s driver list from Redis. To handle drivers near cell boundaries, the matching service also queries the 6 adjacent cells.',
        insight: 'H3 turns "find drivers within X km" — an expensive radius scan — into a simple hash lookup. O(n) → O(1).',
      },
      {
        title: 'Kafka for Location Ingestion',
        description:
          '250,000 GPS messages/second would overwhelm any traditional database on write. Kafka absorbs the burst with near-zero latency. Multiple consumer groups process the same stream independently: the Redis updater (for matching), the analytics pipeline (for heatmaps), the ETA service, and the fraud detector. If any consumer falls behind, it catches up from the Kafka log without impacting others.',
        insight: 'Kafka\'s consumer group model lets multiple independent systems process the same location stream without coupling.',
      },
      {
        title: 'Matching Engine — Multi-Factor Scoring',
        description:
          'The Matching Service doesn\'t just pick the nearest driver. It scores each candidate on: straight-line distance (50%), predicted ETA given traffic (30%), driver acceptance rate (10%), and rider/driver preference compatibility (10%). The ETA predictor is a ML model trained on historical trip durations for each road segment by time of day.',
        insight: 'Nearest is not always fastest. A driver 1 km away on a highway beats a driver 0.5 km away stuck in a dead-end.',
      },
      {
        title: 'Handling Driver Cancellations',
        description:
          'If a driver accepts then cancels, the rider is already in a matched state. The system must detect the cancellation (driver app sends a cancel event), atomically release the driver, and restart matching from scratch — preferring drivers with low cancellation rates this time. A Redis distributed lock prevents double-booking the same driver to two riders during the reassignment window.',
        insight: 'The hardest part of matching is not finding a driver — it\'s handling every failure mode of a confirmed match.',
      },
    ],

    decisions: [
      {
        question: 'Redis vs Cassandra for storing active driver locations?',
        chosen: 'Redis',
        reason:
          '100 MB of driver location data fits entirely in RAM. Redis gives O(1) reads/writes with sub-millisecond latency. Cassandra would add disk I/O and cross-node coordination for every write. Since driver location is ephemeral (30-second TTL), Redis\'s in-memory model is ideal. Persistence to disk is unnecessary — a Redis restart repopulates from the Kafka stream within seconds.',
      },
      {
        question: 'H3 hexagonal grid vs geohash vs PostGIS radius query?',
        chosen: 'H3 hexagonal grid',
        reason:
          'PostGIS radius queries require full index scans — O(n) per request at 250K drivers. Geohash has non-uniform neighbor distances (cells are rectangles, corners are farther). H3 hexagons have uniform inter-cell distance, a clean hierarchy (zoom in/out), and can be indexed as simple integer keys in Redis. Uber built and open-sourced H3 specifically because no existing solution met these requirements.',
      },
      {
        question: 'WebSocket vs HTTP polling for driver location updates?',
        chosen: 'WebSocket (persistent connection)',
        reason:
          'HTTP polling at 4-second intervals = 1 full HTTP handshake every 4 seconds per driver. At 1M drivers that\'s 250K HTTP connections/sec opening and closing — TCP overhead is enormous. WebSocket maintains a single persistent connection per driver app. Updates are tiny binary payloads (~50 bytes). Battery impact is also lower — no repeated connection establishment.',
      },
    ],

    interview: [
      {
        q: 'How would you design Uber\'s real-time driver tracking and matching system?',
        a: 'Requirements: 1M drivers updating location every 4s = 250K writes/sec. Matching latency <500ms. Key components: (1) Driver app → WebSocket → Location Service → Kafka → Redis. (2) H3 hex cells as spatial index in Redis — O(1) driver lookup. (3) Rider request → Matching Service queries Redis for nearby hex cells → scores candidates → sends push notification. (4) Surge pricing from a Kafka Streams job computing supply/demand per cell.',
      },
      {
        q: 'How do you handle 250,000 GPS writes per second without overloading your database?',
        a: 'Two-tier approach: (1) Kafka absorbs all writes at ingestion — it\'s a durable log that can handle millions of messages/sec. (2) A Redis updater consumer reads from Kafka and upserts driver positions in Redis. Redis handles hundreds of thousands of writes/sec in-memory. The database (Cassandra) is only written to for trip records, not live location. This separation of concerns is key.',
      },
      {
        q: 'What happens if the matching service goes down?',
        a: 'The matching service is stateless — it only reads from Redis and Kafka, writes nothing durable. Multiple instances run behind a load balancer. If one dies, the load balancer routes to healthy instances within milliseconds (health check interval). Rider requests in-flight get a timeout and the client retries. Since driver location in Redis is always fresh, the new instance matches as if nothing happened. No state to recover.',
      },
      {
        q: 'How would you implement surge pricing?',
        a: 'A Kafka Streams job runs continuously. It reads two streams: driver-location-events and rider-request-events. For each H3 cell, every 60 seconds it computes: surge = f(rider_requests / available_drivers). It publishes multipliers to a Kafka topic. The Pricing Service subscribes and caches the latest multiplier per cell. When a rider requests, the Pricing Service looks up the cell multiplier (O(1) cache read) and applies it to the base fare before showing the price confirmation.',
      },
    ],

    keyInsight:
      'H3 hexagonal indexing collapses a hard geospatial problem into a hash lookup. The entire active driver database — 1M entries — fits in 100 MB of RAM. The matching problem, which sounds like it requires expensive spatial queries, reduces to: hash a coordinate → look up a Redis key → score 10 candidates.',
  },

  {
    id: 'whatsapp',
    icon: '💬',
    name: 'WhatsApp',
    color: '#25d366',
    scale: '100B messages/day · 2B users · acquired for $19B with 55 engineers',
    focus: '1-to-1 and Group Messaging with End-to-End Encryption',
    problem:
      'Design a messaging system that delivers 100B messages per day to 2B users with end-to-end encryption, offline store-and-forward, group chats of up to 1,024 members, and delivery receipts — all with 99.99% availability.',

    functionalReqs: [
      'Send and receive text, image, video, audio, and document messages',
      'Delivery receipts: sent (✓), delivered (✓✓), read (✓✓ blue)',
      'Messages are stored on the server until the recipient device comes online (store-and-forward)',
      'Group messaging with up to 1,024 members',
      'End-to-end encryption — server never sees plaintext',
      'Last seen, online status, and typing indicators',
    ],

    nonFunctionalReqs: [
      { label: 'Throughput', value: '100B messages/day ≈ 1.15M messages/second' },
      { label: 'Delivery Latency', value: '< 100ms when both users are online' },
      { label: 'Availability', value: '99.99% — messages must never be silently dropped' },
      { label: 'Durability', value: 'Messages retained until delivered + 30 days backup' },
      { label: 'Security', value: 'Signal Protocol E2E encryption, zero plaintext at rest on server' },
      { label: 'Scale', value: '2B users, ~500M daily active, peak 6M msg/sec' },
    ],

    scaleEstimation: [
      { label: 'Messages per Second (avg)', value: '1.15M msg/sec', note: '100B ÷ 86,400' },
      { label: 'Messages per Second (peak)', value: '~6M msg/sec', note: '5× average, New Year spikes' },
      { label: 'Avg Message Size', value: '~1 KB text, ~500 KB media', note: 'Media stored separately' },
      { label: 'Text Message Bandwidth', value: '1.15M × 1KB = 1.15 GB/sec', note: '' },
      { label: 'Active WebSocket Connections', value: '~500M simultaneous (DAUs)', note: 'Erlang handles millions per server' },
      { label: 'User Storage', value: '2B × 1KB metadata = 2TB', note: 'Contacts, profile, settings' },
    ],

    highLevelDesign: [
      {
        title: 'Client → WebSocket → Chat Server',
        description:
          'Each WhatsApp client holds one persistent WebSocket (or XMPP TCP) connection to an assigned Chat Server. Erlang handles millions of these lightweight connections per server node — each connection is literally one Erlang process.',
      },
      {
        title: 'Chat Server → Message Queue → Delivery',
        description:
          'When Alice sends a message to Bob, Alice\'s Chat Server looks up Bob\'s assigned Chat Server. If Bob is online, the message is forwarded directly. If offline, the message is persisted in Mnesia (in-memory) and Cassandra (durable) and held until Bob reconnects.',
      },
      {
        title: 'Delivery Receipt Flow',
        description:
          'When the message is written to Bob\'s Chat Server queue (✓), the server ACKs to Alice. When Bob\'s device receives it (✓✓), Bob\'s client sends an ACK to the Chat Server, which forwards it to Alice. When Bob opens it (blue ✓✓), Bob\'s client sends a read receipt.',
      },
      {
        title: 'Media Upload — Out of Band',
        description:
          'Images and videos are NOT sent through the Chat Server. The sender uploads to a Media Service (blob storage), receives a URL, and sends a message containing just the URL + encryption key. The recipient downloads from the Media Service directly. This keeps the Chat Server lean.',
      },
      {
        title: 'Group Message Fan-out',
        description:
          'For a group of N members, the sending Chat Server fans the message out to all N members\' Chat Servers. Each server delivers to its connected member. Fan-out is bounded at 1,024 members. For very large groups, an async fan-out queue is used to avoid head-of-line blocking.',
      },
    ],

    deepDive: [
      {
        title: 'Erlang/OTP — Why 55 Engineers Could Run 2B Users',
        description:
          'Erlang was built by Ericsson for telephone switches — environments requiring millions of concurrent connections and zero downtime. Each WebSocket connection is one lightweight Erlang process (~2KB RAM). Erlang\'s "let it crash" philosophy means failed processes are restarted automatically by supervisors. Hot code swapping allows deployments without restarting the server. This is how 55 engineers maintained infrastructure serving 2B users.',
        insight:
          'Erlang\'s process model is why WhatsApp works. One process per user = natural isolation. A crash for one user cannot affect others.',
      },
      {
        title: 'Signal Protocol — End-to-End Encryption',
        description:
          'WhatsApp uses the Signal Protocol for E2E encryption. Setup: Alice and Bob exchange public keys. For each message, a new ephemeral session key is derived using the Double Ratchet algorithm. This gives forward secrecy — even if a long-term key is compromised, past messages cannot be decrypted. The server only sees ciphertext. Even WhatsApp\'s engineers cannot read your messages.',
        insight: 'Double Ratchet generates a new encryption key for every single message. Compromising one key compromises exactly one message.',
      },
      {
        title: 'Store-and-Forward with Guaranteed Delivery',
        description:
          'If Bob is offline, Alice\'s message is persisted in Cassandra (partitioned by recipient userId). When Bob reconnects, his client sends a "catch up" request. The Chat Server fetches all pending messages from Cassandra and streams them. Each message is deleted from server storage upon delivery ACK. If delivery fails (ACK timeout), the server retries with exponential backoff.',
        insight:
          'WhatsApp explicitly deletes messages after delivery — storage is a cost, not a feature. This design forces reliability: if a message is lost before deletion, the retry mechanism catches it.',
      },
      {
        title: 'Presence and Typing Indicators',
        description:
          'Online status and typing indicators are ephemeral — they do not go through Kafka or get persisted. A separate lightweight Presence Service maintains a session table in Redis. When Alice types, her client sends a "typing" event to the Presence Service, which pushes it to Bob\'s Chat Server via an internal pub/sub channel. Presence state has a 30-second TTL — if the client disconnects, status expires automatically.',
        insight: 'Presence is intentionally not durable. Losing a typing indicator is fine. Losing a message is not. Different systems, different guarantees.',
      },
    ],

    decisions: [
      {
        question: 'Erlang/OTP vs Node.js vs Go for the Chat Server?',
        chosen: 'Erlang/OTP',
        reason:
          'WhatsApp chose Erlang because it was purpose-built for exactly this problem: millions of concurrent long-lived connections with fault tolerance. Node.js has a single event loop (one CPU core bottleneck). Go was not mature in 2009. Erlang\'s actor model (one process per connection) gives natural isolation, and the OTP supervisor tree provides automatic crash recovery. The result: millions of connections on a single server with years of uptime.',
      },
      {
        question: 'Send media through Chat Server vs out-of-band upload?',
        chosen: 'Out-of-band upload to Media Service',
        reason:
          'Routing 500KB images through the Chat Server would saturate it. The Chat Server is optimized for millions of tiny, latency-sensitive control messages. Separating media upload (high-bandwidth, latency-tolerant) from messaging (low-bandwidth, latency-critical) lets each scale independently. The Chat Server only routes a URL string — it never touches the media bytes.',
      },
      {
        question: 'Delete messages after delivery vs retain forever?',
        chosen: 'Delete after delivery + 30-day encrypted backup',
        reason:
          'Retaining messages server-side creates enormous storage costs at 100B messages/day, creates a legal liability (subpoena target), and is unnecessary given E2E encryption (server has ciphertext, not plaintext). Deleting after delivery reduces storage to only undelivered messages. Users who want history keep it on their device or in iCloud/Google Drive encrypted backups.',
      },
    ],

    interview: [
      {
        q: 'How would you design WhatsApp\'s messaging system?',
        a: 'Requirements: 1.15M msg/sec avg, delivery < 100ms, E2E encryption, 2B users. Core design: each client holds a persistent WebSocket to a Chat Server. Erlang handles millions of connections per node. For online delivery: Alice\'s server → Bob\'s server → Bob\'s device. For offline: persist in Cassandra, deliver on reconnect. Media is out-of-band (upload → URL in message). E2E encryption via Signal Protocol — server only sees ciphertext.',
      },
      {
        q: 'How do you guarantee exactly-once message delivery?',
        a: 'WhatsApp uses at-least-once delivery with idempotency at the client. Each message has a unique messageId (UUID). If the sender doesn\'t receive a delivery ACK within a timeout, it retries. The recipient client deduplicates by messageId before displaying. The risk of showing a duplicate is handled client-side with a seen-message cache (LRU, last 1000 message IDs). The server retains the message until it receives a delivery ACK, then deletes.',
      },
      {
        q: 'How would you design group messaging for 1,024 members?',
        a: 'Fan-out on send: when a message is sent to a group, the sender\'s Chat Server fans it to each member\'s Chat Server (up to 1,024 servers). Each Chat Server delivers to its connected member or queues it if offline. A group membership service (read from Cassandra, cached in Redis) provides the member list. Fan-out is async for large groups to avoid blocking the sender\'s ACK. The sender sees "sent" ✓ immediately; delivery tracking is per-member.',
      },
      {
        q: 'How does end-to-end encryption work for group messages?',
        a: 'WhatsApp uses the Signal Protocol\'s Sender Keys for groups. When Alice joins a group, she generates a Sender Key and distributes it (encrypted) to each member using their individual session keys. When Alice sends a group message, she encrypts it once with her Sender Key. Each member decrypts using the shared Sender Key — O(1) encrypt, O(1) decrypt per member. This is far more efficient than encrypting once per member (which would be O(N) on the sender).',
      },
    ],

    keyInsight:
      '55 engineers, 2 billion users. Erlang\'s lightweight process model made this ratio possible. One Erlang process per connection costs ~2KB of RAM. Millions of connections is millions of tiny processes — not millions of OS threads. The "let it crash" philosophy meant failures were isolated, supervised, and automatically restarted. WhatsApp didn\'t need thousands of engineers because Erlang/OTP is itself a battle-hardened ops team in a runtime.',
  },

  {
    id: 'twitter',
    icon: '🐦',
    name: 'Twitter / X',
    color: '#1da1f2',
    scale: '500M tweets/day · 350M monthly active users',
    focus: 'Tweet Fanout & Timeline Service',
    problem:
      'Design the timeline delivery system that shows you a fresh, ranked feed of tweets from everyone you follow — within 5 seconds of them posting — at 500M tweets/day, for users who follow anywhere from 1 to 100M accounts.',

    functionalReqs: [
      'Users can post tweets (text, images, videos, polls)',
      'Users see a personalized timeline of tweets from accounts they follow',
      'New tweets appear in followers\' timelines within ~5 seconds',
      'Users can like, retweet, reply, and quote-tweet',
      'Trending topics and search across all tweets in near real-time',
      'Direct messages between users',
    ],

    nonFunctionalReqs: [
      { label: 'Fanout Latency', value: 'Tweet visible to followers within 5 seconds' },
      { label: 'Timeline Read Latency', value: '< 100ms to load home timeline' },
      { label: 'Write Throughput', value: '~6,000 tweets/sec (500M/day)' },
      { label: 'Availability', value: '99.99% for timeline reads' },
      { label: 'Scale', value: 'Users with 0 to 100M+ followers; timelines hold 800 tweets' },
      { label: 'Consistency', value: 'Eventual — 5-second fanout window is acceptable' },
    ],

    scaleEstimation: [
      { label: 'Tweets per Second', value: '~6,000 avg, ~30,000 peak', note: '500M/day' },
      { label: 'Avg Follower Count', value: '~200 followers per user', note: 'Median much lower; power law distribution' },
      { label: 'Fanout per Tweet (avg)', value: '6K × 200 = 1.2M writes/sec to Redis timeline caches', note: '' },
      { label: 'Timeline Cache Size', value: '350M users × 800 tweet IDs × 8 bytes = 2.24 TB', note: 'Fits in Redis cluster' },
      { label: 'Timeline Read QPS', value: '~300,000 reads/sec', note: '350M users × several reads/day' },
      { label: 'Storage (tweets)', value: '500M/day × 365 × ~1 KB = ~180 TB/year', note: 'Stored in Manhattan (KV) + MySQL' },
    ],

    highLevelDesign: [
      {
        title: 'Tweet Write Path → Fan-out Service',
        description:
          'When a user tweets, the write goes to the Tweet Service which writes to MySQL (primary record) and Kafka. A Fan-out Service consumes the Kafka event, reads the user\'s follower list from the Social Graph Service, and writes the tweet ID to each follower\'s Redis timeline cache.',
      },
      {
        title: 'Redis Timeline Cache',
        description:
          'Each user has a Redis sorted set (score = timestamp) holding the 800 most recent tweet IDs in their home timeline. Timeline reads hit Redis directly — no database query. Reading your timeline = one Redis ZRANGE command, then a batch fetch of tweet content.',
      },
      {
        title: 'Hybrid Fanout — Push vs Pull',
        description:
          'Regular users (< ~50K followers): push their tweet ID to all followers\' Redis caches at post time. Celebrity users (> ~50K followers, like Obama or Kylie Jenner): their tweets are NOT pushed at write time. Instead, when a follower loads their timeline, the Timeline Service detects they follow celebrities and merges in real-time by querying those celebrities\' tweet lists.',
      },
      {
        title: 'Timeline Read Path',
        description:
          'Client → Timeline Service → Redis cache (gets 800 tweet IDs) → Tweet Content Service (batch fetches content, enriches with like counts from Redis) → returns ranked feed. If cache miss (new user or eviction), the Timeline Service rebuilds from the Social Graph + Tweet Store.',
      },
      {
        title: 'Search — Earlybird',
        description:
          'All tweets flow through Kafka to Earlybird — Twitter\'s real-time inverted index. New tweets are searchable within seconds. Earlybird runs as a distributed in-memory index sharded by tweet ID range. Text + hashtag + mention search is served entirely from Earlybird; no database scan.',
      },
    ],

    deepDive: [
      {
        title: 'The Celebrity Problem — Why Fanout Breaks at Scale',
        description:
          'When Barack Obama (130M followers) tweets, a naive push fanout would write to 130M Redis keys in seconds. At 100,000 writes/sec, that takes 21 minutes — far beyond the 5-second SLA. Twitter\'s solution: celebrities are excluded from push fanout. When you load your timeline, the Timeline Service identifies which of your followed accounts are "celebrities" (via a precomputed flag), fetches their recent tweets directly, and merges them with your pushed timeline in memory.',
        insight: 'The hybrid fanout model is Twitter\'s most important architectural decision. One tweet from Kylie Jenner would break a pure push system.',
      },
      {
        title: 'Redis Sorted Sets for Timelines',
        description:
          'Each user\'s timeline is a Redis Sorted Set: tweet IDs ranked by timestamp. ZADD to insert (O(log N)), ZRANGE to read (O(log N + M)), ZREMRANGEBYRANK to evict oldest tweets when the set exceeds 800 entries. This structure supports the timeline perfectly: append new tweets, read the top 20 sorted by recency, paginate with cursor. The entire 2.24 TB of timeline data fits in a Redis cluster.',
        insight: 'Storing tweet IDs (8 bytes) not tweet content (1 KB) in Redis keeps the cache 125× smaller. Content is fetched separately, then cached in a second-level content cache.',
      },
      {
        title: 'Social Graph — Manhattan KV Store',
        description:
          'Twitter\'s follower/following graph is stored in Manhattan, a distributed key-value store built internally for high write throughput. Follower lists are stored as sorted sets by time of follow. The Fan-out Service reads follower lists from Manhattan and batches Redis writes into pipelines. For users with millions of followers, the follower list is paginated — the fan-out happens in parallel batches.',
        insight: 'A single tweet from a user with 10M followers triggers 10M individual Redis writes. Batching into pipelines of 1,000 reduces this to 10,000 round trips.',
      },
      {
        title: 'Trending Topics — Real-Time Counting',
        description:
          'A stream processing job (Heron, Twitter\'s Kafka Streams equivalent) counts hashtag mentions in a 10-minute sliding window. It maintains a top-K heap per geographic region. Results are written to Redis every 30 seconds. The Trending Service reads from Redis for the /trends endpoint. Spam filtering removes artificially amplified topics using a bot-detection ML model running in-stream.',
        insight: 'Trending topics are a counting problem at 6,000 tweets/sec. Exact counts are expensive — approximate counts with Count-Min Sketch data structure give 99.9% accuracy at 1% of the memory.',
      },
    ],

    decisions: [
      {
        question: 'Push fanout (write-time) vs Pull fanout (read-time) vs Hybrid?',
        chosen: 'Hybrid — push for regular users, pull for celebrities',
        reason:
          'Pure push: works for normal users but catastrophically slow for celebrities (130M writes per tweet). Pure pull: timeline read requires querying every followed account\'s tweet list — expensive for users following 2,000 accounts. Hybrid captures the best of both: push precomputes timelines for 99% of users (fast reads), pull handles the celebrity edge case at read time (bounded overhead: merge a fixed number of celebrity feeds).',
      },
      {
        question: 'Store tweet content in Redis timeline vs store only tweet IDs?',
        chosen: 'Store only tweet IDs in Redis, fetch content separately',
        reason:
          'A tweet is ~1 KB. Storing full content for 350M users × 800 tweets = 280 TB — not feasible in Redis memory. Storing only IDs (8 bytes each) = 2.24 TB — fits in a Redis cluster. Tweet content is then fetched in a batch (one network round-trip for 20 tweet IDs) from a separate tweet content cache. The separation also means edit/delete only needs to update one place.',
      },
      {
        question: 'MySQL vs custom KV store for the social graph?',
        chosen: 'Manhattan (custom KV store)',
        reason:
          'The social graph has unique access patterns: reads are large sequential scans (give me all 10M followers of @elonmusk), writes are high-frequency (people follow/unfollow constantly). MySQL\'s B-tree indexes are not efficient for large sequential scans. Manhattan is optimized for this: range scans over follower lists are its primary use case. Twitter\'s team built it when MySQL couldn\'t keep up with follow/unfollow write volume.',
      },
    ],

    interview: [
      {
        q: 'How would you design Twitter\'s home timeline?',
        a: 'Key insight: it\'s a fanout problem. When a user tweets, a Fan-out Service reads their follower list and writes the tweet ID to each follower\'s Redis sorted set. When a user loads their timeline, it reads tweet IDs from Redis, batch-fetches content, and returns ranked results. The hard part: celebrity accounts (100M+ followers) cannot be push-fanned. Solution: hybrid model — push for regular users, pull for celebrities at read time and merge.',
      },
      {
        q: 'How do you handle a tweet going viral (sudden spike in likes/retweets)?',
        a: 'Like and retweet counts are not stored in MySQL per tweet — that would cause hot-row lock contention at viral scale. Instead, counts are maintained in Redis (INCR command is atomic) and asynchronously flushed to MySQL every few seconds. The client reads counts from Redis (fast, consistent) not MySQL. For the fanout: a viral retweet generates a new tweet record; the retweet\'s own fan-out follows the same hybrid model based on the retweeter\'s follower count.',
      },
      {
        q: 'How would you make tweets searchable in real-time?',
        a: 'An inverted index like Earlybird is the answer. Every tweet flows through Kafka to indexing workers that tokenize text, hashtags, and @mentions, and upsert into an in-memory inverted index sharded by tweet ID range. Search queries fan out to all shards, each returns top-K results, a merge layer produces the final ranked list. In-memory keeps it fast — disk-based Lucene would add I/O latency. Earlybird makes tweets searchable within ~5 seconds of posting.',
      },
      {
        q: 'What happens if the Redis timeline cache for a user gets evicted?',
        a: 'Cache miss triggers a timeline rebuild. The Timeline Service reads the user\'s follow list (from Manhattan/Social Graph), fetches recent tweet IDs for each followed account (from the Tweet Store), merges and sorts by timestamp, and re-populates Redis. This is called a "cache warming" or "timeline hydration" path. It\'s expensive (O(follows × recent tweets per account)) but rare — Redis eviction only happens for inactive users. Active users\' caches are always warm.',
      },
    ],

    keyInsight:
      'The hybrid fanout model is the core insight. Push fanout at tweet-creation time makes read latency O(1) for 99% of timelines. But apply it naively to @BarackObama and you get 130M Redis writes every time he tweets. The celebrity cutoff (precomputed flag, pull-merged at read time) is the safety valve that makes the whole system work.',
  },

  {
    id: 'amazon',
    icon: '🛒',
    name: 'Amazon',
    color: '#ff9900',
    scale: '$1.3T GMV · 300M customers · millions of third-party sellers',
    focus: 'Shopping Cart & Order Processing Pipeline',
    problem:
      'Design the shopping cart and order processing system that handles millions of concurrent shoppers, guarantees cart durability, processes payments reliably, coordinates inventory reservation, and routes orders to fulfillment centers — without a single lost order.',

    functionalReqs: [
      'Add, remove, and update items in the shopping cart from any device',
      'Cart persists across devices and browser sessions',
      'Place an order: reserve inventory, charge payment, confirm to customer',
      'Order status tracking: placed → processing → shipped → delivered',
      'Inventory management: prevent overselling when multiple users buy the same item',
      'Fulfillment routing: send orders to the nearest warehouse with the item in stock',
    ],

    nonFunctionalReqs: [
      { label: 'Cart Availability', value: '99.9999% — Amazon loses ~$220K/minute during downtime' },
      { label: 'Checkout Latency', value: '< 300ms for cart read, < 2s for order placement' },
      { label: 'Inventory Consistency', value: 'Strong consistency for stock reservation (no overselling)' },
      { label: 'Order Durability', value: 'Zero order loss — even if services crash during processing' },
      { label: 'Scale', value: '~1M orders/day normal, ~10M during Prime Day' },
      { label: 'Idempotency', value: 'Duplicate checkout clicks must not create duplicate charges' },
    ],

    scaleEstimation: [
      { label: 'Orders per Day', value: '~1M avg, 10M peak (Prime Day)', note: '' },
      { label: 'Orders per Second', value: '~12 avg, ~115 peak', note: '' },
      { label: 'Cart Reads per Order', value: '~50 reads per 1 write', note: 'Browsing >> purchasing' },
      { label: 'Cart Read QPS', value: '~600 reads/sec avg, 6,000 peak', note: 'Served from DynamoDB cache' },
      { label: 'Active Carts', value: '~300M users × % active = ~10M concurrent', note: 'Cart = per-user session' },
      { label: 'Inventory Records', value: '~350M SKUs', note: 'Each has stock count per fulfillment center' },
    ],

    highLevelDesign: [
      {
        title: 'Cart Service — DynamoDB',
        description:
          'The cart is stored in DynamoDB with userId as the partition key. Each cart item is an attribute. Cart reads/writes are single-digit millisecond operations. DynamoDB\'s multi-region active-active replication keeps the cart available even if an AWS region fails. No cart is ever lost — DynamoDB\'s durability guarantee is 99.999999999% (11 nines).',
      },
      {
        title: 'Checkout Flow — Distributed Saga',
        description:
          'Placing an order involves multiple steps: (1) validate cart, (2) reserve inventory, (3) charge payment, (4) create order record, (5) route to fulfillment. Each step is a separate service. Amazon uses the Saga pattern: each step has a compensating transaction (undo). If payment fails after inventory was reserved, the inventory reservation is automatically released.',
      },
      {
        title: 'Inventory Service — Optimistic Locking',
        description:
          'Inventory is stored in DynamoDB with a version counter. A reservation does a conditional write: "decrement stock by 1 only if stock >= 1 AND version == N". If two buyers attempt simultaneously, one conditional write wins and the other gets a ConditionalCheckFailedException — the loser retries or sees "out of stock".',
      },
      {
        title: 'Order Processing — Event-Driven Pipeline',
        description:
          'A confirmed order is published to an SQS queue. Downstream services (fulfillment routing, email notification, fraud detection, recommendations) each subscribe and process independently. If fulfillment routing crashes, the order stays in SQS and is retried — nothing is lost.',
      },
      {
        title: 'Fulfillment Routing — ML-Based Assignment',
        description:
          'An ML model selects which of Amazon\'s 1,000+ fulfillment centers should handle each order item, considering: proximity to customer, item stock levels, predicted delivery date, and shipping cost. Multi-item orders may be split across multiple fulfillment centers if no single center has all items.',
      },
    ],

    deepDive: [
      {
        title: 'DynamoDB — Built for the Shopping Cart',
        description:
          'Amazon built DynamoDB internally because relational databases couldn\'t handle shopping cart reliability at their scale. The cart has a simple access pattern: read/write by userId. DynamoDB\'s key-value model is a perfect fit. Conditional writes prevent race conditions. The Global Tables feature replicates carts across 3+ regions — if us-east-1 has an outage, eu-west-1 serves the same cart with < 100ms staleness. This was impossible with MySQL replication.',
        insight: 'DynamoDB was invented to solve Amazon\'s own shopping cart problem. The cart is the most critical data store — losing a cart means losing a sale.',
      },
      {
        title: 'The Saga Pattern — Distributed Transactions Without 2PC',
        description:
          'Classical distributed transactions (2PC — Two-Phase Commit) require all participants to hold locks until a coordinator decides commit or rollback. At Amazon\'s scale, this creates deadlocks and availability holes. The Saga pattern instead defines a sequence of local transactions, each publishing an event that triggers the next. Each step has a compensating transaction. If payment fails, an inventory-release event is published. The orchestrator (AWS Step Functions) tracks state and triggers compensating actions on failure.',
        insight: 'Sagas trade atomicity for availability. Amazon chose availability. "Your order might briefly appear confirmed before failing" is acceptable. "Your cart is unavailable" is not.',
      },
      {
        title: 'Idempotency — Preventing Double Charges',
        description:
          'If a user clicks "Place Order" twice, or if a network timeout causes a retry, the payment must not be charged twice. Amazon uses idempotency keys: when the client submits an order, it generates a UUID and includes it. The Payment Service stores processed idempotency keys in DynamoDB with a 24-hour TTL. On any retry, the service checks: "Did I already process this key?" If yes, return the cached result. The second charge is suppressed.',
        insight: 'Idempotency is not just nice-to-have — charging a customer twice destroys trust. Every payment endpoint must be idempotent at the infrastructure level, not just in business logic.',
      },
      {
        title: 'A9 Search — Ranking by Purchase Probability',
        description:
          'Amazon\'s product search (A9) doesn\'t rank by relevance alone. It multiplies relevance × purchase probability × seller margin. Purchase probability is a ML model trained on billions of click-to-purchase events. A product that\'s often clicked but rarely bought ranks lower than one with high conversion. This alignment of search ranking with revenue generation is why Amazon search feels commercial — it is, by design.',
        insight: 'Ranking = relevance × purchase probability × margin. A search engine that maximizes clicks optimizes for curiosity. Amazon optimizes for transactions.',
      },
    ],

    decisions: [
      {
        question: 'MySQL vs DynamoDB for the shopping cart?',
        chosen: 'DynamoDB',
        reason:
          'The shopping cart has a simple access pattern (read/write by userId) that doesn\'t need joins or transactions across multiple entities. MySQL at 300M user scale requires complex sharding, and replication lag causes stale cart reads. DynamoDB\'s single-digit millisecond latency, automatic multi-region replication (Global Tables), and conditional writes for race condition prevention make it the clear winner for this access pattern.',
      },
      {
        question: 'Synchronous checkout (2PC) vs asynchronous Saga pattern?',
        chosen: 'Saga pattern with event-driven compensation',
        reason:
          '2PC requires all participant services to hold locks during coordination. At Amazon\'s scale, this creates cascading timeouts: if the Inventory Service is slow, the checkout hangs for all users. Sagas break this into independent local transactions. Each service is available independently. Compensation handles failures. The trade-off: eventual consistency during checkout. Amazon accepts that an order might briefly appear confirmed while payment is retried — but the user sees immediate feedback.',
      },
      {
        question: 'Strong consistency vs eventual consistency for inventory?',
        chosen: 'Strong consistency for reservation, eventual for display',
        reason:
          'The reservation write (decrement stock) uses DynamoDB conditional writes for strong consistency — no overselling. But the product page showing "3 left in stock!" uses an eventually consistent read — it might show 3 when there are actually 2. This small inaccuracy on display is acceptable. What\'s not acceptable: selling the same item to two customers simultaneously. The write path is strongly consistent; the read path trades consistency for availability and lower latency.',
      },
    ],

    interview: [
      {
        q: 'How would you design the Amazon shopping cart?',
        a: 'Key requirements: 300M users, cart persists across devices, high availability (can\'t lose carts), fast reads. Design: DynamoDB with userId as partition key. Cart items are a set of attributes. Reads are O(1) key lookups. Write is a conditional update (prevent concurrent item overwrites). Multi-region replication with Global Tables ensures availability even during regional AWS outages. No SQL — the cart doesn\'t need joins. Simple access pattern = NoSQL.',
      },
      {
        q: 'How would you prevent double-charging if a user clicks "Buy" twice?',
        a: 'Idempotency keys. The client generates a UUID when the checkout page loads and attaches it to the order request. The server checks a processed-keys table before charging. If the key already exists, return the cached result without re-charging. Use DynamoDB\'s conditional writes to make the key-check and payment atomic (if key not exists → insert key, proceed with payment). TTL of 24 hours on the key record. This handles both double-clicks and network-retry scenarios.',
      },
      {
        q: 'How do you prevent two customers from buying the last item?',
        a: 'Optimistic locking with conditional writes. The inventory record has a version field. A reservation does: "decrement stock by 1 IF stock >= 1 AND version == current_version; increment version." Two simultaneous requests: one wins, one gets a ConditionalCheckFailedException. The loser retries — sees stock is now 0 — and shows "Out of stock." No locks held, no blocking. DynamoDB\'s conditional writes are atomic at the item level.',
      },
      {
        q: 'How would you design the order processing pipeline?',
        a: 'Event-driven saga: when an order is placed, publish an "OrderPlaced" event to SQS. Inventory Service consumes it → reserves stock → publishes "InventoryReserved". Payment Service consumes that → charges card → publishes "PaymentCharged". Fulfillment Service routes to warehouse → publishes "OrderRouted". Email Service sends confirmation. Each step is independent. Failures trigger compensating events: PaymentFailed → InventoryService releases the reservation. AWS Step Functions orchestrates state and retries.',
      },
    ],

    keyInsight:
      'Amazon\'s 2002 API Mandate — "all teams will expose data through service interfaces, no exceptions" — forced every team to build a clean API. The internal services that emerged (DynamoDB, SQS, S3) were so well-designed that Amazon productized them as AWS. The constraint that felt like bureaucracy accidentally created a $100B business.',
  },

  {
    id: 'chatgpt',
    icon: '🤖',
    name: 'ChatGPT',
    color: '#10a37f',
    scale: '100M+ users · 10M+ API calls/day · tokens streamed in real-time',
    focus: 'LLM Inference API & Real-Time Streaming',
    problem:
      'Design an inference system that serves GPT-4 responses to millions of users with sub-second time-to-first-token, streams output token by token, handles multi-turn conversations efficiently, and scales GPU capacity elastically.',

    functionalReqs: [
      'User sends a message (or multi-turn conversation) and receives a streamed text response',
      'Support for multi-turn conversations with context retention',
      'File and image uploads for vision-capable models',
      'API access with per-key rate limiting and tier-based quotas',
      'Conversation history stored and retrievable by the user',
      'Real-time streaming: tokens appear as they are generated, not after full completion',
    ],

    nonFunctionalReqs: [
      { label: 'Time-to-First-Token', value: '< 500ms for cached context, < 1s for new conversations' },
      { label: 'Token Throughput', value: '~40-60 tokens/sec per stream to user' },
      { label: 'Availability', value: '99.9% (some degradation acceptable — it\'s a stateful compute workload)' },
      { label: 'GPU Utilization', value: '> 70% — idle GPUs cost ~$30/hr each' },
      { label: 'Context Window', value: 'GPT-4: 128K tokens; must be processed in bounded memory' },
      { label: 'Cost', value: 'Batching requests on the same GPU pass is critical to unit economics' },
    ],

    scaleEstimation: [
      { label: 'Daily API Calls', value: '~10M', note: 'ChatGPT + API combined' },
      { label: 'Calls per Second', value: '~115 avg, ~500 peak', note: '' },
      { label: 'Avg Tokens per Request', value: '~1,000 input + 500 output', note: 'Varies widely' },
      { label: 'GPUs Required (A100)', value: '~2,000+ A100s', note: 'Each handles ~20 concurrent streams' },
      { label: 'KV Cache Memory per Request', value: '~1 GB for 128K context', note: 'Limits max concurrent sessions per GPU' },
      { label: 'Cost per Token', value: '~$0.03/1K input, $0.06/1K output (GPT-4 pricing)', note: '' },
    ],

    highLevelDesign: [
      {
        title: 'API Gateway → Auth & Rate Limiting',
        description:
          'Every request hits the API Gateway which validates the API key (via Redis token bucket), applies tier-based rate limits (free: 3 RPM, plus: 60 RPM, enterprise: custom), and routes to the Inference Orchestrator. The gateway rejects over-limit requests immediately — no backpressure into the GPU cluster.',
      },
      {
        title: 'Inference Orchestrator → Dynamic Batching',
        description:
          'The Orchestrator queues incoming requests and batches them into groups of 20-50 (depending on context length) for a single GPU forward pass. Dynamic batching is critical: an A100 GPU running one request at a time is 95% idle — compute-bound only during the attention operation. Batching amortizes the fixed cost of loading model weights across multiple users.',
      },
      {
        title: 'GPU Cluster → Token Generation',
        description:
          'The model runs on clusters of A100/H100 GPUs. For large models (GPT-4), the model is sharded across multiple GPUs using tensor parallelism (weights split across GPUs) or pipeline parallelism (layers split). Each forward pass generates one token per request in the batch. Tokens are streamed back immediately via SSE.',
      },
      {
        title: 'KV Cache — Multi-Turn Efficiency',
        description:
          'The Key-Value cache stores computed attention matrices for all previous tokens in the conversation. On the next turn, instead of recomputing the entire conversation history from scratch, the model reuses the cached KV matrices and only computes attention for the new tokens. This reduces inference time for long conversations by 10×.',
      },
      {
        title: 'SSE Streaming → Client',
        description:
          'Tokens are pushed to the client via Server-Sent Events (SSE) as they are generated. The HTTP connection stays open. Each "data: {token}" event is pushed every ~25ms (40 tokens/sec). The client appends tokens to the UI incrementally. If the connection drops mid-stream, the client shows what was received — no full retry needed.',
      },
    ],

    deepDive: [
      {
        title: 'Dynamic Batching — The Unit Economics of LLM Serving',
        description:
          'An A100 GPU costs ~$30/hr. Running it at 5% utilization means paying $30 to do $1.50 worth of work. Dynamic batching packs multiple requests into a single forward pass. The GPU processes 40 requests simultaneously instead of 1, increasing throughput 40×. The challenge: requests have different lengths and complete at different times (continuous batching). Systems like vLLM use PagedAttention to manage KV cache memory for variable-length batches efficiently.',
        insight: 'Dynamic batching is not just an optimization — it\'s what makes LLM serving economically viable. Without it, GPT-4 would cost $10+ per message.',
      },
      {
        title: 'KV Cache — Why Multi-Turn Is Fast',
        description:
          'During inference, every token must attend to all previous tokens (transformer attention). For a 10-turn conversation (10,000 tokens), naively reprocessing all 10,000 tokens on turn 11 is O(n²) in compute. The KV cache stores the Key and Value matrices computed for each previous token. Turn 11 only needs to compute attention for the new message tokens — O(m) where m << n. Without KV cache, a 128K context window would take minutes to process.',
        insight: 'KV cache is what makes 128K context windows practical. Without it, processing a 100-page document every turn would take more compute than generating the response.',
      },
      {
        title: 'Moderation — Parallel Safety Checking',
        description:
          'Every user message is checked against OpenAI\'s moderation API before being sent to the model. Rather than adding this latency sequentially, the moderation check and the first few model forward passes happen in parallel. If moderation fails, the stream is terminated mid-response. The moderation model is a small, fast classifier (~10ms) running on separate CPUs, not GPUs. This architecture adds near-zero latency to safe requests.',
        insight: 'Running moderation in parallel with inference is the key insight. Sequential safety checking would add hundreds of milliseconds to every response.',
      },
      {
        title: 'Prompt Caching — Prefix Sharing',
        description:
          'Enterprise customers often send the same large system prompt (a 10K-token document or codebase) with every API call. Without caching, those 10K tokens are re-processed every time. Prompt caching stores the KV cache for common prompt prefixes. If two requests share the first 10K tokens, only the suffix is processed. This cuts input token cost by 90% for enterprise use cases (e.g., RAG over a fixed document corpus).',
        insight: 'Prompt caching turns a repeated O(n) compute cost into O(1). For a company making 1M API calls with the same 10K-token system prompt, it\'s a 10B token/day reduction in compute.',
      },
    ],

    decisions: [
      {
        question: 'Streaming (SSE) vs return full response at completion?',
        chosen: 'Server-Sent Events streaming',
        reason:
          'A GPT-4 response takes 5-30 seconds to fully generate. A non-streaming API would force users to stare at a spinner for that entire duration. Streaming delivers the first token in < 1 second and tokens stream in at 40/sec. Perceived latency drops from 15 seconds to 0.5 seconds. The user experience of watching text appear is also qualitatively better — it mimics natural human writing speed. Streaming is the product.',
      },
      {
        question: 'Tensor parallelism vs pipeline parallelism for large model sharding?',
        chosen: 'Tensor parallelism for latency, pipeline for throughput',
        reason:
          'Tensor parallelism splits individual weight matrices across GPUs. Every forward pass requires all GPUs to synchronize on each layer — lowest latency but high inter-GPU communication. Pipeline parallelism assigns layers to GPU groups — less communication but adds pipeline bubble overhead. ChatGPT uses tensor parallelism within a node (fast NVLink interconnect) and pipeline parallelism across nodes (slower Infiniband) to balance latency and scale.',
      },
      {
        question: 'Store conversation history server-side vs client-side only?',
        chosen: 'Server-side in PostgreSQL with client-side context window management',
        reason:
          'Storing history server-side enables cross-device access, history search, and fine-tuning data collection. PostgreSQL stores conversation metadata and message records. But the context window (what gets sent to the model) is managed by the API: if the conversation exceeds the context window, the oldest messages are truncated or summarized. The client cannot be trusted to manage this correctly, and server-side management ensures consistent model behavior.',
      },
    ],

    interview: [
      {
        q: 'How would you design the ChatGPT backend API?',
        a: 'Components: (1) API Gateway — auth, rate limiting, routing. (2) Inference Orchestrator — dynamic batching of requests onto GPUs. (3) GPU Cluster — model inference with tensor/pipeline parallelism. (4) SSE streaming — tokens pushed to client as generated. (5) KV Cache — reuse attention matrices across conversation turns. (6) Moderation — parallel safety check. (7) PostgreSQL — conversation history. Key insight: dynamic batching is what makes unit economics work.',
      },
      {
        q: 'How would you handle the GPU cluster scaling during traffic spikes?',
        a: 'Two mechanisms: (1) Kubernetes HPA scales inference pods based on GPU utilization metric — new pods can provision in ~5 minutes on reserved cloud capacity. (2) A queue-based admission system: when all GPUs are above 90% utilization, requests are queued with a timeout (not rejected). Users see slightly higher latency but not errors. For extreme spikes (viral ChatGPT moment), OpenAI pre-purchases reserved GPU instances rather than relying on on-demand (2-3× cheaper).',
      },
      {
        q: 'How does prompt caching work and why does it matter?',
        a: 'When an API request arrives, the server computes a hash of the prompt prefix. If the KV cache for that prefix is already in GPU memory (or fast NVMe), only the suffix tokens are processed. For an enterprise customer sending "Analyze this 50-page document: [document text]" with 1,000 different questions, the document (10K tokens) is cached after the first request. Subsequent requests only process the 10-token question. This reduces compute by 95% and latency from 2s to 200ms for that customer.',
      },
      {
        q: 'How do you prevent a user\'s 128K-token context from bankrupting you?',
        a: 'Three mechanisms: (1) Token-based pricing — users pay per token, so long contexts cost more. (2) Rate limiting — per-API-key limits on tokens per minute (not just requests per minute). (3) KV cache memory limits — the system enforces a max context length per request and returns an error if exceeded. On the infrastructure side, PagedAttention (vLLM) allows KV cache to be paged in/out of GPU memory like virtual memory, preventing one long-context user from monopolizing GPU RAM.',
      },
    ],

    keyInsight:
      'The business model of LLMs is fundamentally a batching and caching problem. GPUs are expensive; KV cache and dynamic batching are how you amortize that cost across users. Every architectural decision — SSE streaming, KV caching, prompt caching, parallel moderation — exists to maximize useful compute per GPU-hour and minimize perceived latency per dollar spent.',
  },

  {
    id: 'googledocs',
    icon: '📄',
    name: 'Google Docs',
    color: '#4285f4',
    scale: '1B+ users · real-time collaboration · offline-first',
    focus: 'Real-Time Collaborative Document Editing',
    problem:
      'Design a document editor where multiple users can edit the same document simultaneously with no conflicts, edits appear within 50ms for all collaborators, the document converges to the same state for everyone, and the full edit history is preserved.',

    functionalReqs: [
      'Multiple users edit the same document simultaneously',
      'Each user\'s edits appear on collaborators\' screens within 50ms',
      'Cursor positions of all collaborators are visible in real-time',
      'Offline editing — changes sync when reconnected',
      'Full version history — revert to any point in time',
      'Comments and suggestions on specific text ranges',
    ],

    nonFunctionalReqs: [
      { label: 'Latency', value: '< 50ms round-trip for collaborative edits' },
      { label: 'Convergence', value: 'All clients must converge to the same document state' },
      { label: 'Availability', value: '99.99% — losing a document is catastrophic' },
      { label: 'Durability', value: 'Zero data loss — every keystroke must be durable' },
      { label: 'Consistency', value: 'Causal consistency — your own edits are always visible to you' },
      { label: 'Scale', value: '1B documents, up to 100 simultaneous editors per document' },
    ],

    scaleEstimation: [
      { label: 'Active Documents', value: '~50M simultaneously active', note: 'Of 1B+ stored documents' },
      { label: 'Active Editors per Doc', value: '~1-5 on average, up to 100', note: '' },
      { label: 'Operations per Second', value: '~500K ops/sec globally', note: 'Each keystroke is one operation' },
      { label: 'Operation Size', value: '~50-200 bytes', note: 'Small JSON: type, position, content' },
      { label: 'Document Storage', value: '1B docs × avg 500KB = 500 PB', note: 'Stored in Bigtable + GCS' },
      { label: 'Operation Log per Doc', value: '~100MB for active docs (thousands of edits)', note: '' },
    ],

    highLevelDesign: [
      {
        title: 'Client — Local State + Operation Queue',
        description:
          'Each client maintains its own local copy of the document. When you type, the edit is applied locally immediately (0ms perceived latency). Simultaneously, the operation (type, position, character) is queued and sent to the server via WebSocket.',
      },
      {
        title: 'WebSocket → Collaboration Server',
        description:
          'Each user holds a persistent WebSocket connection to a Collaboration Server. The server receives operations from all clients editing the same document and applies Operational Transformation to resolve conflicts before broadcasting to others.',
      },
      {
        title: 'Operational Transformation (OT) Engine',
        description:
          'The OT server serializes all operations on a document. When two concurrent operations conflict (Alice inserts at position 5 while Bob deletes position 3-7), OT transforms one operation against the other so both survive correctly. The server is the single source of truth for operation ordering.',
      },
      {
        title: 'Bigtable — Document Storage',
        description:
          'Document snapshots and operation logs are stored in Bigtable. The row key is documentId. Columns store the latest snapshot and the operation log. Version history = replay the operation log. Bigtable\'s wide-column model handles append-heavy workloads (each edit appends to the operation log) efficiently.',
      },
      {
        title: 'Presence Service — Cursors and Awareness',
        description:
          'Cursor positions, user names, and colors are served by a separate lightweight Presence Service. Cursor positions are ephemeral and NOT stored in Bigtable. They are broadcast via a pub/sub channel with a TTL. If a user disconnects, their cursor disappears within 5 seconds. This keeps the critical editing path decoupled from presence.',
      },
    ],

    deepDive: [
      {
        title: 'Operational Transformation — The Hard Part',
        description:
          'OT is the algorithm that makes concurrent editing possible. Every edit is an operation: Insert("a", position=5) or Delete(position=3, length=2). When two clients send concurrent operations, the server transforms them: if Alice inserts at position 5 and Bob simultaneously inserts at position 3, Bob\'s insert shifts Alice\'s insert to position 6. The transformed operations are then applied in a consistent order. The server serializes all operations — there is no peer-to-peer merging. The OT server is the bottleneck and the source of correctness.',
        insight: 'OT correctness requires a central server. P2P OT is NP-hard to get right. Google intentionally accepted centralization for correctness guarantees.',
      },
      {
        title: 'Conflict-Free Replicated Data Types (CRDTs) — The Alternative',
        description:
          'CRDTs are a mathematical structure that can be merged without conflicts regardless of order. A CRDT text document represents each character as a unique node with a logical position — characters are never moved, only marked as visible/deleted. Merge is automatic and commutative. Figma, Notion, and Linear use CRDTs. Google Docs uses OT. CRDTs enable true offline/P2P sync; OT requires a server. Google chose OT because it was simpler to implement correctly for their use case in 2006.',
        insight: 'CRDTs trade memory overhead (every character has a unique ID forever) for offline capability. OT trades offline capability for simplicity and lower memory usage.',
      },
      {
        title: 'Offline Editing — Service Worker + IndexedDB',
        description:
          'When a Docs user goes offline, a Service Worker intercepts all API calls. Edits are written to IndexedDB (local browser database). When connectivity restores, the Service Worker replays the queued operations against the server\'s OT engine. The server transforms them against any remote operations that happened during the offline period. The document converges. The complexity: if Bob edits paragraph 3 while Alice is offline editing the same paragraph, OT may produce unexpected merged results — but it will always converge.',
        insight: 'Offline sync is fundamentally a reconciliation problem. The OT engine must handle the case where a client has been offline for hours and has accumulated thousands of unsynced operations.',
      },
      {
        title: 'Version History — Operation Log Replay',
        description:
          'Google Docs stores the complete operation log — every insert and delete since the document was created. Version history is not stored as a series of snapshots (expensive storage). Instead, to restore to version N, the system replays operations 1 through N. For performance, the system also stores periodic snapshots (every 1,000 operations), so a restore to version N with snapshot at N-500 only replays 500 operations. This gives O(1) amortized storage and O(log N) restore time.',
        insight: 'The operation log is an append-only event source. Every version of a document ever is implicit in the log. Snapshots are a performance optimization, not the source of truth.',
      },
    ],

    decisions: [
      {
        question: 'Operational Transformation (OT) vs CRDTs for conflict resolution?',
        chosen: 'Operational Transformation',
        reason:
          'Google built Docs in 2006 when CRDTs for text editing were not well-understood (the key CRDT papers came later). OT was well-understood from earlier collaborative systems. OT\'s central server model also gave Google control over operation ordering and made the system easier to reason about for correctness. The downside — requiring server connectivity for collaboration — was acceptable because Google\'s target was always web-first. Offline is a nice-to-have, handled separately via Service Worker buffering.',
      },
      {
        question: 'WebSocket vs long polling vs SSE for real-time collaboration?',
        chosen: 'WebSocket',
        reason:
          'Real-time collaboration requires bidirectional low-latency communication. SSE is server-to-client only — the client would need a separate HTTP connection to send operations. Long polling has high overhead (new connection per poll). WebSocket provides a persistent, full-duplex connection with < 1ms overhead per message after establishment. For 100 users editing simultaneously, WebSocket is the only option that keeps round-trip latency under 50ms.',
      },
      {
        question: 'Store every keystroke vs debounced snapshots?',
        chosen: 'Store every operation (keystroke-level granularity)',
        reason:
          'Storing debounced snapshots (e.g., every 5 seconds) would lose sub-second edits on crash and would make conflict resolution inaccurate (two 5-second edits might both affect the same content). Keystroke-level operation logging enables: precise conflict resolution, character-level version history, collaborative cursors that track exact character positions, and the ability to reconstruct any state. The storage cost (operations are small, ~100 bytes each) is justified by these capabilities.',
      },
    ],

    interview: [
      {
        q: 'How would you design a real-time collaborative document editor?',
        a: 'Core challenge: concurrent edits must not corrupt the document. Architecture: (1) Each client applies edits locally immediately (0ms latency perception). (2) Edits sent as operations (type, position, characters) via WebSocket to a central OT server. (3) OT server serializes operations, transforms conflicts, and broadcasts transformed operations to all collaborators. (4) Clients apply the transformed operations from the server. (5) Operation log persisted to Bigtable. Key insight: a central server is required for OT correctness.',
      },
      {
        q: 'How do you handle two users typing at the same position simultaneously?',
        a: 'OT resolves this. If Alice inserts "A" at position 5 and Bob inserts "B" at position 5 simultaneously: (1) Server receives Alice\'s op first. (2) Server applies Alice\'s op: doc now has "A" at position 5. (3) Server transforms Bob\'s op: Bob\'s "B" was intended for position 5, but Alice\'s insertion means Bob should now insert at position 6. (4) Server applies transformed op. Result: both inserts survive, in server-determined order. Alice and Bob both see "AB" (or "BA" depending on arrival order).',
      },
      {
        q: 'How would you implement the version history feature?',
        a: 'Append-only operation log in Bigtable. Every insert/delete is appended with a sequence number and timestamp. To view version at time T: find the nearest snapshot before T, then replay operations from that snapshot up to T. Snapshots are created every 1,000 operations to bound replay time. Named versions ("Version saved by Alice at 3pm") are pointers into the operation log — no separate copy is stored. This gives infinite version history at ~100 bytes/operation storage cost.',
      },
      {
        q: 'How would you scale the collaboration server to 1B documents?',
        a: 'Partition by documentId. Each document\'s OT server is a single stateful process — only one server can handle a given document at a time (OT requires serialization). Documents are assigned to servers via consistent hashing. A document with 100 editors has all 100 WebSocket connections to the same server. For hot documents (a Google Form with 10K simultaneous responses), we cap collaborative editing at 100 simultaneous editors and queue additional connections. Server state (operation log) is persisted to Bigtable so documents can be migrated to new servers on crash.',
      },
    ],

    keyInsight:
      'Operational Transformation works because there is ONE server serializing all operations for a document. The moment two servers could handle the same document simultaneously, OT breaks. This is why scaling Google Docs is a document-partitioning problem, not a horizontal scaling problem. The architectural constraint — one process per document — is not a bug, it\'s the correctness guarantee.',
  },

  {
    id: 'youtube',
    icon: '▶️',
    name: 'YouTube',
    color: '#ff0000',
    scale: '500 hours uploaded every minute · 5B videos watched daily · 4K/8K support',
    focus: 'Video Upload, Transcoding & Delivery Pipeline',
    problem:
      'Design the end-to-end pipeline that accepts a raw video upload (up to 128 GB, any format), transcodes it into all quality tiers in parallel, makes it available for streaming in under 10 minutes, and delivers it adaptively to 5B daily views.',

    functionalReqs: [
      'Upload videos up to 128 GB in size reliably (resumable on connection drop)',
      'Support any input format (MOV, MKV, AVI, MP4, HEVC, ProRes, etc.)',
      'Auto-generate multiple quality tiers: 360p, 480p, 720p, 1080p, 1440p, 4K',
      'Generate auto-captions, thumbnails, and chapter markers',
      'Video available for streaming within ~10 minutes of upload completion',
      'Adaptive bitrate streaming — quality adjusts automatically to bandwidth',
    ],

    nonFunctionalReqs: [
      { label: 'Upload Reliability', value: 'Resumable from any byte on connection drop' },
      { label: 'Processing Time', value: '< 10 minutes from upload complete to first stream available' },
      { label: 'Streaming Availability', value: '99.99% — video must play even when transcoding is slow' },
      { label: 'Storage Durability', value: '99.999999999% (11 nines) — videos are never lost' },
      { label: 'Scale', value: '500 hrs/min uploaded = 720,000 hrs/day of new content' },
      { label: 'CDN Throughput', value: '5B views/day × avg 3 Mbps = 17.4 Tbps peak' },
    ],

    scaleEstimation: [
      { label: 'Videos Uploaded per Day', value: '~720,000 hours = ~43.2M minutes of content', note: '500 hrs/min × 1440 min/day' },
      { label: 'Raw Upload Data per Day', value: '720K hrs × 10 GB/hr (raw) = 7.2 PB/day', note: 'Before compression' },
      { label: 'Transcoded Storage per Day', value: '~1 PB/day', note: 'After compression across all quality tiers' },
      { label: 'Concurrent Uploads', value: '~350/sec', note: '720K hrs/day ÷ 86,400 sec ÷ avg 6-min video' },
      { label: 'CDN Views per Second', value: '5B/day = ~58,000 streams/sec', note: 'Peak 3-5× higher' },
      { label: 'Total Storage', value: '~2 exabytes and growing', note: 'Including all quality tiers and formats' },
    ],

    highLevelDesign: [
      {
        title: 'Chunked Upload → Upload Service',
        description:
          'The client splits the video into 8MB chunks. Each chunk is uploaded sequentially with a server ACK. If the connection drops, the client resumes from the last ACKed chunk. The Upload Service stores chunks in GCS (Google Cloud Storage) and tracks the upload state in Cloud Spanner. When all chunks arrive, a "UploadComplete" event is published to Pub/Sub.',
      },
      {
        title: 'Transcoding Pipeline — Parallel Workers',
        description:
          'The "UploadComplete" event triggers N transcoding jobs in parallel — one per quality tier. Workers pull jobs from a Pub/Sub queue and use FFmpeg to transcode. 360p, 720p, 1080p, 4K jobs all run simultaneously, not sequentially. A "low-res first" optimization: 360p completes in ~60 seconds and is made available while higher tiers are still processing.',
      },
      {
        title: 'Quality Control & Processing',
        description:
          'Beyond transcoding: the Content ID system fingerprints the video and matches against a rights database. A speech-to-text model generates auto-captions. An ML model selects 3 thumbnail candidates. Audio normalization equalizes volume levels. All of these run as independent workers consuming from Pub/Sub — adding new processing types doesn\'t require changing the upload or transcoding code.',
      },
      {
        title: 'Storage → CDN Distribution',
        description:
          'Transcoded files (.m3u8 manifests + .ts segments for HLS, .mpd + .m4s for MPEG-DASH) are stored in GCS, then pushed to Google\'s CDN edge nodes globally. Popular videos are cached at the edge; long-tail content is served from GCS on demand. CDN cache hit rate for top videos exceeds 99%.',
      },
      {
        title: 'Adaptive Bitrate Streaming — Client Player',
        description:
          'The client player downloads a master manifest listing all quality tiers and their segment URLs. Every 3-10 seconds, the player measures download speed and buffer fill level, then selects the appropriate quality tier for the next segment. No server involvement in quality switching — it\'s entirely client-driven from the manifest.',
      },
    ],

    deepDive: [
      {
        title: 'Resumable Uploads — The Protocol',
        description:
          'YouTube uses Google\'s Resumable Upload protocol. Step 1: client POSTs metadata to get an upload session URL. Step 2: client PUTs chunks sequentially, each with a Range header (Content-Range: bytes 0-8388607/1073741824). Step 3: server responds with 308 Resume Incomplete and a Range header showing how many bytes were received. On connection drop: client queries the session URL with an empty PUT to get the current byte offset, then resumes from there. No bytes are ever re-uploaded.',
        insight: 'A 10 GB video upload that drops at 9.9 GB resumes at exactly byte 10,631,000,000 — not from zero. This is table stakes for mobile uploads on cellular networks.',
      },
      {
        title: 'FFmpeg Transcoding — Parallelism Within a Video',
        description:
          'FFmpeg processes video frame by frame. YouTube\'s system parallelizes at two levels: (1) across quality tiers (360p and 4K workers run simultaneously), and (2) within a single quality tier (a 2-hour video is split into 1-minute segments, each transcoded by a separate worker, then stitched). A 2-hour video at 4K takes ~40 minutes to transcode sequentially but ~3 minutes with 80 parallel segment workers. The "low-res first" policy makes 360p available in 60 seconds while 4K is still being processed.',
        insight: 'Parallelizing within a video (segment splitting) is the key to <10 minute availability SLAs for long videos. Without it, a 3-hour movie would take hours to become available.',
      },
      {
        title: 'Content ID — Rights Management at Scale',
        description:
          'Content ID is YouTube\'s fingerprinting system for copyright. Every uploaded video is fingerprinted using a perceptual hash algorithm that produces a compact "fingerprint" invariant to minor edits (re-encoding, color correction, cropping). The fingerprint is matched against a database of 800M+ reference fingerprints owned by rights holders. A match within milliseconds of upload triggers the rights holder\'s chosen policy (monetize, block, or track). All of this runs as a background worker — it doesn\'t block video availability.',
        insight: 'Content ID processes 500 hours/minute of video in near-real-time using fingerprinting, not full content comparison. The fingerprint (~10KB) represents an entire video for matching purposes.',
      },
      {
        title: 'CDN Strategy — Long Tail Problem',
        description:
          'The top 1% of videos (viral content, mainstream channels) account for 90%+ of views — these are cached aggressively at every edge node worldwide. The remaining 99% of videos (long tail) are rarely watched and would waste CDN cache space. YouTube serves long-tail videos directly from GCS regional buckets, accepting higher latency for rare content. The CDN is optimized for popular content; GCS is the universal fallback. This hybrid approach is more cost-effective than trying to cache everything.',
        insight: 'CDN economics follow a power law. Cache the head of the distribution aggressively; let the tail route to origin. Trying to cache everything would require 10× more CDN storage for <5% additional cache hit rate improvement.',
      },
    ],

    decisions: [
      {
        question: 'Single-pass transcoding (all quality tiers from one decode) vs separate jobs per tier?',
        chosen: 'Separate parallel jobs per quality tier',
        reason:
          'Single-pass (one decode, multiple encode outputs) is more CPU-efficient but serializes all quality tiers behind the slowest encoder (4K). Separate parallel jobs allow 360p to complete in 60 seconds regardless of 4K progress — enabling the "low-res first" policy for <10 minute availability. The extra decode cost is justified by the user experience improvement of having any quality available quickly rather than waiting for all qualities to be ready.',
      },
      {
        question: 'Store original raw video vs delete after transcoding?',
        chosen: 'Store the original raw video permanently',
        reason:
          'New codec formats (AV1, VVC) offer significantly better compression. YouTube re-transcodes its entire library when a better codec is available. Without the original, re-transcoding must start from the already-compressed version — degrading quality further. The original is the ground truth. Storage is cheap (and getting cheaper); quality degradation is permanent. Every major platform (Netflix, YouTube, Vimeo) stores originals indefinitely.',
      },
      {
        question: 'HLS vs MPEG-DASH for adaptive streaming?',
        chosen: 'Both — MPEG-DASH for most clients, HLS for Apple devices',
        reason:
          'Apple devices require HLS — Safari and iOS do not support MPEG-DASH natively. MPEG-DASH is an open standard with better codec support (VP9, AV1) and more efficient segment packaging. YouTube generates both sets of manifests from the same transcoded segments — the segments (video data) are codec-specific but the manifest formats (HLS vs DASH) are just different XML structures pointing to the same files. Running both adds < 1% storage overhead.',
      },
    ],

    interview: [
      {
        q: 'How would you design YouTube\'s video upload and processing pipeline?',
        a: 'Three phases: (1) Upload: chunked 8MB uploads with server ACK, stored in GCS, upload state in Spanner. Completion event to Pub/Sub. (2) Processing: parallel transcoding workers per quality tier (360p available in 60s), Content ID fingerprinting, auto-captions, thumbnail selection — all independent Pub/Sub consumers. (3) Delivery: transcoded files pushed to CDN, served via MPEG-DASH/HLS adaptive streaming. Key: "low-res first" for fast availability, parallel jobs across quality tiers.',
      },
      {
        q: 'How do you handle a 10 GB upload that fails at 9 GB?',
        a: 'Resumable upload protocol: (1) Client stores the upload session URL and last-ACKed byte offset locally. (2) On reconnect, client queries the session URL to get the current server-side byte count. (3) Client resumes from that byte. The Upload Service stores chunk state in Cloud Spanner — each chunk is marked received when stored in GCS. Session URLs expire after 7 days. If the session expires, the client must restart but this is rare for < 10 GB uploads.',
      },
      {
        q: 'How do you make a 2-hour video available in under 10 minutes?',
        a: 'Two parallelism levels: (1) Across quality tiers: 360p, 720p, 1080p, 4K workers all run simultaneously. 360p is typically done in 60-90 seconds for a 2-hour video. (2) Within a quality tier: the 2-hour video is split into 1-minute segments; 120 workers transcode in parallel and the segments are stitched. Combined: 360p available in ~90 seconds, all tiers complete in ~5-7 minutes. The video is marked "available" for streaming as soon as 360p is ready.',
      },
      {
        q: 'How would you design the adaptive bitrate streaming?',
        a: 'Server side: transcode to 6+ quality tiers. Generate a master playlist (HLS .m3u8 or DASH .mpd) listing all tiers and their segment URLs. Segment duration: 6 seconds. Client side: player downloads the master playlist on load. Every 6 seconds, the player measures: current download speed, buffer fill (seconds buffered). It selects the highest quality tier whose bitrate ≤ 80% of measured bandwidth. Switches happen at segment boundaries — no mid-segment interruption. No server involvement in quality selection.',
      },
    ],

    keyInsight:
      '500 hours of video per minute is a distributed systems problem, not just a storage problem. The insight is extreme parallelism: split by quality tier, split by time segment within each tier, run Content ID, captions, and thumbnails as independent parallel workers. Each step is a Pub/Sub consumer — new processing types (new codec, new ML model) are added without touching upload or CDN code. The pipeline is a series of independent, parallelizable transformations over an immutable input.',
  },
];

export const REALWORLD: RealWorldSystem[] = [...REALWORLD_BASE, ...REALWORLD_AWS, ...REALWORLD_PATTERNS];
