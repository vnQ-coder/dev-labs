import { RealWorldSystem } from '../types';

export const REALWORLD_STREAMING: RealWorldSystem[] = [
  {
    id: 'jiohotstar',
    icon: '🏏',
    name: 'JioHotstar',
    color: '#1b4ddb',
    scale: '50M+ concurrent viewers · 500M unique viewers/tournament · IPL 2024 world record',
    focus: 'Live Cricket Streaming — IPL at Planetary Scale',
    problem:
      'JioHotstar (formerly Disney+ Hotstar, merged with Jio Cinema in 2024) streams live IPL cricket to 500M unique viewers per tournament. Peak concurrent viewership crossed 50 million during marquee India matches. Design the end-to-end live streaming platform that ingests multi-camera feeds from stadiums across India, encodes to 10+ quality tiers, delivers to 50M simultaneous viewers in under 10-second latency, handles a chat/reactions firehose of 500K events/sec during a boundary or wicket, and maintains 99.99% uptime during a 4-hour match where a single outage is national news.',

    functionalReqs: [
      'Ingest multi-camera live feeds from cricket stadiums and encode in real time',
      'Deliver adaptive HLS/DASH streams at 10+ quality tiers (144p to 4K HDR)',
      'Show real-time ball-by-ball score, run rate, player stats with <1s update latency',
      'Support live chat, emoji reactions, and viewer polls during match',
      'Serve concurrent streams in 5+ languages (Hindi, Tamil, Telugu, Bengali, English)',
      'Enforce DRM (Widevine/FairPlay) and regional geo-blocking for broadcast rights',
    ],

    nonFunctionalReqs: [
      { label: 'Availability', value: '99.99% during live matches — no planned downtime during IPL season' },
      { label: 'Glass-to-glass latency', value: '< 10 seconds from stadium action to viewer screen' },
      { label: 'Peak concurrent viewers', value: '50M simultaneous streams (India vs Pakistan)' },
      { label: 'Chat throughput', value: '500K+ events/sec during high-excitement moments' },
      { label: 'Startup time', value: '< 3 seconds to first frame on mobile 4G in tier-2 Indian cities' },
      { label: 'Bitrate adaptability', value: 'Seamless switch from 4K (20 Mbps) to 144p (100 Kbps) for 2G users' },
    ],

    scaleEstimation: [
      { label: 'Peak Concurrent Viewers', value: '50M', note: 'India vs Pakistan match, 2024 T20 World Cup' },
      { label: 'Avg stream bitrate (720p)', value: '2.5 Mbps', note: 'Weighted across all quality tiers' },
      { label: 'Total peak bandwidth', value: '50M × 2.5 Mbps = 125 Tbps', note: 'Served via CDN edge nodes' },
      { label: 'Chat events at peak', value: '500K/sec', note: 'During boundary/wicket moments' },
      { label: 'Score update frequency', value: 'Every ball = ~400 updates/match', note: 'Pushed to all clients via WebSocket' },
      { label: 'Storage (7-day replay)', value: '~180 TB per match × all languages', note: 'HLS segments on object storage' },
    ],

    highLevelDesign: [
      {
        title: 'Stadium Ingest',
        description:
          'Multiple broadcast cameras at each stadium feed into a venue encoder (Elemental Live or Harmonic). The encoder outputs a single high-bitrate feed (50 Mbps HEVC) and transmits it over SRT (Secure Reliable Transport) to JioHotstar\'s cloud ingest points in Mumbai, Chennai, and Delhi. Redundant ingest paths over dedicated MPLS and public internet provide failover. A watchdog process monitors ingest health; if the primary SRT connection drops, the secondary activates within 3 seconds.',
      },
      {
        title: 'Encoding Pipeline',
        description:
          'Cloud ingest nodes forward the raw feed to an autoscaling encoding cluster. FFmpeg-based workers transcode the stream into 10+ ABR renditions (144p, 240p, 360p, 480p, 720p 30fps, 720p 60fps, 1080p, 1080p 60fps, 4K SDR, 4K HDR) in parallel. Each encoder outputs 2-second HLS/CMAF segments and writes them to a shared segment store (NFS/object storage). A manifest generator updates the M3U8 playlist every 2 seconds and publishes it to the CDN origin. Language-specific audio tracks are muxed per rendition to support multilingual delivery.',
      },
      {
        title: 'CDN Delivery',
        description:
          'JioHotstar runs a three-CDN strategy: JioCDN (Reliance\'s proprietary CDN with 1,400+ PoPs inside Jio\'s backbone network), Akamai, and AWS CloudFront. Traffic is split by geography and ISP at the DNS level. Jio mobile users (400M+ subscribers) are directed to JioCDN, meaning their video traffic never leaves Reliance\'s private fiber. Non-Jio broadband users hit Akamai or CloudFront. CDN health is monitored in real time via synthetic probes; DNS-level failover reroutes around a degraded CDN within 30 seconds. Each PoP pre-caches the first 30 segments at stream start for fast startup.',
      },
      {
        title: 'Client Player',
        description:
          'Mobile apps use native HLS (AVPlayer on iOS, ExoPlayer on Android). Web uses hls.js. The ABR algorithm monitors buffer health, download speed, and signal strength every 500ms. It uses a conservative buffer-based ABR strategy tuned for Indian mobile networks: it prefers quality stability over peak quality, avoids upgrades when buffer < 15 seconds, and drops quality aggressively on bandwidth loss to prevent rebuffering. A startup sequence fetches the lowest rendition first to achieve sub-3s time-to-first-frame, then ramps up quality as buffer fills.',
      },
      {
        title: 'Real-Time Score & Chat',
        description:
          'Score and match data flow on a completely separate path from video. Ball-by-ball data arrives from the BCCI feed (or official data provider) into a Score Ingest Service. Redis Pub/Sub fans out score updates to all WebSocket server pods within 50ms. 50M clients maintain persistent WebSocket connections to a pool of WebSocket gateway pods (each pod handles 50K connections, so ~1,000 pods total). Chat messages are ingested into Kafka (partitioned by match ID), consumed by chat processor pods that apply rate limiting and moderation, then fanned out via the same WebSocket gateways. Emoji reactions are batched into aggregate counts per second rather than forwarded individually.',
      },
    ],

    deepDive: [
      {
        title: 'Thundering Herd at Match Start',
        description:
          '50M viewers attempt to connect within a 2-minute window when the match begins. To absorb this: (1) A 15-minute pre-match countdown stream is live before the toss, spreading the connection ramp over 15 minutes rather than 2. (2) DNS TTLs for CDN endpoints are lowered to 30 seconds 10 minutes before match start, allowing rapid rerouting. (3) Weighted least-connection load balancing across ingest and manifest servers prevents hot spots. (4) Pre-signed manifest URLs are cached at CDN edges before match start — the first playlist fetch is a cache hit. (5) Mobile app pre-fetches the first 10 HLS segments during the countdown, so "play" is instantaneous.',
        insight: 'Pre-warming is 10× more effective than reactive scaling — you cannot scale fast enough once 50M users click play simultaneously.',
      },
      {
        title: 'Multi-CDN Strategy and JioCDN Advantage',
        description:
          '80% of JioHotstar\'s viewers are on Jio mobile. JioCDN routes their traffic entirely within Reliance\'s private backbone — video never touches the public internet or ISP peering points. This eliminates the primary source of last-mile latency and packet loss in India. For non-Jio users, Akamai and CloudFront share traffic based on real-time latency probes. CDN health is scored every 10 seconds; a CDN scoring below threshold gets its DNS weight reduced to zero within two probe cycles (20 seconds). This multi-CDN design has no single point of failure at the delivery layer.',
      },
      {
        title: 'Chat at 500K Events/Sec',
        description:
          'During a boundary or wicket, chat volume spikes from ~50K/sec to 500K/sec in under 1 second. To handle this: Kafka absorbs the spike with a write buffer — producers never block. Chat processor pods consume from Kafka, apply per-user rate limits (max 5 messages/sec), run ML-based toxicity filtering (async, best-effort), and publish to WebSocket gateways. Emoji reactions are never forwarded individually — instead, a 1-second aggregation window counts reactions per emoji type and publishes a single "reaction burst" event (e.g., "+2.3M fire emojis"). This reduces fan-out by 99.9% for reaction traffic. WebSocket gateways maintain 50K connections each; at 50M viewers, 1,000 pods are required.',
        insight: 'Aggregating reactions into burst events rather than forwarding individually reduces chat fan-out volume by 3 orders of magnitude during peak moments.',
      },
      {
        title: 'Low-Latency HLS (LL-HLS) for Premium Users',
        description:
          'Standard HLS has 20–30 seconds of glass-to-glass latency due to segment duration (6–10s) and buffering. JioHotstar\'s premium path uses Low-Latency HLS (LL-HLS / CMAF Chunked): 2-second segments subdivided into 200ms partial segments, delivered via HTTP/2 server push with blocking playlist requests. This brings glass-to-glass latency to 6–8 seconds. LL-HLS requires CDN support for HTTP/2 push and partial segment delivery — not all edge nodes support it. It is therefore only enabled for 4G+ mobile and broadband users. 2G/3G users receive standard HLS with larger segments for stability over latency.',
      },
    ],

    decisions: [
      {
        question: 'Proprietary JioCDN vs third-party CDN only?',
        chosen: 'Hybrid — JioCDN primary for Jio users, Akamai/CloudFront for non-Jio',
        reason:
          '400M Jio subscribers represent 80% of the viewer base. Routing them to JioCDN means the video never leaves Reliance\'s network — zero public transit cost, sub-5ms intra-CDN latency, and no ISP peering bottleneck. Third-party CDNs cannot replicate this structural advantage regardless of budget.',
      },
      {
        question: 'WebSocket vs HTTP Long-Poll for score and chat delivery?',
        chosen: 'WebSocket',
        reason:
          'At 50M connected clients, long-polling generates 50M HTTP requests every 1–5 seconds — this is 10–50 billion requests per hour. WebSocket maintains one persistent TCP connection per client; score pushes arrive in < 50ms vs 1–5 seconds for long-poll, and server resource usage is 10× lower. The latency improvement is also critical for score — a 1-second delay in showing "OUT!" degrades the product experience.',
      },
      {
        question: 'SRT vs RTMP for stadium-to-cloud ingest?',
        chosen: 'SRT (Secure Reliable Transport)',
        reason:
          'Cricket stadiums have unreliable uplinks — high packet loss on congested event-day WiFi and cellular. SRT uses ARQ (automatic repeat request) to recover lost packets at the transport layer, maintaining clean video at up to 10% packet loss. RTMP has no error correction — a 2% packet loss results in a 2% corrupted stream with visible artifacts. SRT also adds AES-256 encryption, which is required for broadcast rights compliance.',
      },
    ],

    interview: [
      {
        q: 'How do you handle 50M users connecting at match start?',
        a: 'Pre-warm: start a countdown stream 15 minutes early to spread connection load. Pre-sign and cache manifests at CDN edges before match start so the first request is always a cache hit. Lower DNS TTLs 10 minutes before start for fast rerouting. Use weighted least-connection load balancing. Have the mobile app prefetch the first 10 HLS segments during countdown. Reactive scaling alone cannot work — you cannot provision 50M connections in 2 minutes. Pre-warming is the only viable strategy.',
      },
      {
        q: 'How do you keep chat working at 500K events/sec without affecting the video stream?',
        a: 'Video and chat run on completely separate infrastructure — separate Kafka clusters, separate WebSocket pods, separate CDN paths. Chat never shares resources with video delivery. Within the chat system: Kafka absorbs spikes with write buffering. Rate limiting caps each user at 5 msg/sec. Emoji reactions are batched into per-second aggregate counts (never forwarded individually), reducing fan-out by 99.9% during peak moments. 1,000 WebSocket gateway pods at 50K connections each handle 50M concurrent chat connections.',
      },
      {
        q: 'How would you design the ABR algorithm for Indian mobile networks with frequent 4G→3G→2G drops?',
        a: 'Use a buffer-based ABR algorithm rather than a throughput-based one. Buffer-based ABR reacts to buffer depletion rather than instantaneous bandwidth — it is more stable on networks with high variance. Key parameters: minimum safe buffer threshold = 15s (if buffer < 15s, never upgrade quality); emergency drop threshold = 5s (if buffer < 5s, drop to minimum quality immediately). Maintain a 30-second bandwidth history and use the 10th percentile (not mean) as the basis for quality selection — this biases toward stability. On signal type change (4G→3G detected via Network Information API), proactively drop one quality tier before the bandwidth actually drops.',
      },
      {
        q: 'How do you detect and handle a CDN node going down mid-match without viewers noticing?',
        a: 'Continuous synthetic probing: every 10 seconds, probe each CDN PoP from multiple vantage points for TTFB, error rate, and segment freshness. Score each CDN; if a PoP scores below threshold for two consecutive probe cycles (20 seconds), its DNS weight is set to zero — new viewers stop routing to it. Existing viewers on that PoP: their players will experience a segment fetch failure, trigger HLS error recovery (retry + failover URL in the manifest), and land on a healthy CDN within 2–3 segment durations (4–6 seconds). Pre-populate failover CDN URLs in every manifest so clients can switch without a DNS lookup.',
      },
    ],

    keyInsight:
      'The JioCDN advantage is structural: 80% of viewers are on Jio mobile. Routing them to JioCDN means video travels inside Reliance\'s private fiber, never touching the public internet. No amount of engineering on Akamai compensates for ISP-level co-location. The architecture insight is: own the last mile, and scale becomes a cost problem, not a reliability problem.',
  },

  {
    id: 'twitch',
    icon: '🎮',
    name: 'Twitch',
    color: '#9146ff',
    scale: '7M+ concurrent viewers · 100K+ live channels · 30M daily active users',
    focus: 'Live Game Streaming with Real-Time Chat at Scale',
    problem:
      'Design Twitch\'s live streaming platform that enables 100K+ streamers to broadcast simultaneously, delivers video to 7M concurrent viewers with < 20-second latency, and runs a live chat system where a popular channel can receive 100K messages/minute during hype moments — all while maintaining stream stability for the streamer regardless of viewership spike.',

    functionalReqs: [
      'Streamers broadcast via OBS/RTMP from their PC; platform ingests and transcodes in real time',
      'Viewers watch adaptive streams at 160p / 360p / 480p / 720p / 1080p',
      'Live chat with emotes, subscriber badges, channel points, bits (microtransactions)',
      'Clip creation: viewer clips last 30–60 seconds and shares instantly',
      'VOD (video on demand): full stream archive available after broadcast ends',
      'Channel subscriptions, bits, and raids trigger real-time on-screen alerts',
    ],

    nonFunctionalReqs: [
      { label: 'Stream latency', value: 'Normal mode < 20s, Low-Latency mode < 6s, Ultra-Low-Latency mode < 1s' },
      { label: 'Chat delivery', value: 'Messages visible to all viewers < 500ms after send' },
      { label: 'VOD availability', value: 'Clips available within 60 seconds; full VOD within 15 min of stream end' },
      { label: 'Uptime', value: "99.9% — streamer's broadcast must never be dropped by platform failure" },
      { label: 'Scale', value: 'Support 100K+ concurrent live channels with no per-channel capacity limits' },
    ],

    scaleEstimation: [
      { label: 'Concurrent live channels', value: '100K', note: 'Each needs dedicated ingest + transcode capacity' },
      { label: 'Concurrent viewers', value: '7M', note: 'Heavily skewed — top 0.1% of channels have 90% of viewers' },
      { label: 'Chat messages at peak (popular channel)', value: '100K/min = ~1,700/sec', note: 'Ninja/xQc peak events' },
      { label: 'Ingest bandwidth', value: '100K channels × 6 Mbps avg = 600 Gbps', note: "Broadcaster upload to Twitch" },
      { label: 'Delivery bandwidth', value: '7M × 3 Mbps avg = 21 Tbps', note: 'Served via CDN' },
    ],

    highLevelDesign: [
      {
        title: 'Streamer → Ingest Edge',
        description:
          'OBS or any RTMP-compatible encoder sends the stream to the nearest Twitch ingest PoP (50+ globally). The streamer selects an ingest server (or uses the auto-detect endpoint which resolves to the lowest-latency PoP via anycast DNS). Ingest servers accept the RTMP connection and immediately forward the raw stream to the transcoding cluster over an internal high-bandwidth link. Multiple ingest servers in each PoP provide redundancy — if one fails, OBS\'s auto-reconnect logic lands on a peer within 10 seconds.',
      },
      {
        title: 'Transcoding Cluster',
        description:
          'Each live stream is transcoded into 5 quality tiers in real time using GPU-accelerated FFmpeg workers (NVENC on NVIDIA A10 GPUs). Workers are allocated at stream start and released at stream end. Each tier produces 2-second HLS segments, which are pushed to origin servers and simultaneously written to S3 for VOD. A manifest generator maintains the rolling M3U8 playlist for each channel. At 100K concurrent channels, the transcoding fleet scales horizontally via HPA based on active channel count.',
      },
      {
        title: 'CDN Delivery',
        description:
          'Twitch uses Akamai as its primary CDN supplemented by its own edge infrastructure in high-density markets. Segments are pushed from origin to CDN edges within 2 seconds of encoding completion. Viewers\' HLS players fetch segments from the nearest edge node using standard HTTP GET requests — completely stateless and independently cacheable. The viewer\'s player sends a playlist request every 2 seconds; the CDN returns the latest M3U8 with new segment URLs. This pull model means CDN scales horizontally with viewer count at no state cost.',
      },
      {
        title: 'Chat System',
        description:
          'Chat messages flow through Twitch\'s PubSub system. Each channel is a logical topic. When a viewer sends a message, it hits a Chat Ingestion Service that validates it (rate limits, banned words, sub-only check) and publishes it to the channel\'s PubSub topic. All WebSocket server pods subscribed to that topic receive the message and fan it out to their connected viewers. Each WebSocket pod maintains persistent connections for viewers watching that channel. A central sequencer (Redis sorted set with monotonic ID) ensures messages are delivered in order within a channel.',
      },
      {
        title: 'VOD & Clips',
        description:
          'HLS segments are written to S3 in real time as they are created during the live stream. After the stream ends, a background assembly job reads all segment keys from S3, builds the final M3U8 playlist, and makes the VOD available — typically within 15 minutes for a 12-hour stream. Clip creation is a server-side operation: the client sends a clip request with a timestamp offset; the clip service identifies the corresponding S3 segments (no re-encode needed), creates a sub-playlist pointing to those segments, generates a thumbnail, and returns a shareable URL — completing in under 60 seconds.',
      },
    ],

    deepDive: [
      {
        title: 'Chat Architecture and Scaling Modes',
        description:
          'At 100K messages/minute, naive broadcast would require each WebSocket pod to forward every message to every connected viewer in the channel. Twitch\'s PubSub partitions channels across pod groups — each group owns a subset of channels. Messages within a channel are ordered by a Redis sorted set sequencer with a monotonic integer ID. Chat is intentionally lossy (at-most-once delivery) — there is no retry or durability guarantee, simplifying the architecture significantly. To protect against spam bursts, Twitch exposes chat modes: slow mode (enforces N-second cooldown per user), subscriber-only mode (only paying subs can chat), and emote-only mode. A sliding window buffer of the last 150 messages handles reconnect catch-up without requiring a message queue.',
        insight: 'Designing chat as a lossy system is a deliberate architectural choice — a missed chat message is trivially acceptable, while the complexity of guaranteed delivery at this scale is enormous.',
      },
      {
        title: 'Ultra-Low-Latency Mode (< 1 Second)',
        description:
          'Twitch\'s ULL mode uses WebRTC-based delivery instead of HLS. The transcoder outputs an RTP stream which is pushed to viewers via WebRTC DataChannel, bypassing the segment-based HLS pipeline entirely. This achieves sub-1-second latency. The critical trade-off: WebRTC requires a TURN server for NAT traversal for most viewers (home routers block direct P2P). At 7M concurrent viewers, TURN server capacity would require tens of thousands of cores. Twitch therefore restricts ULL mode to channels with fewer than 1,000 concurrent viewers, where the cost is manageable. For the vast majority of viewers, Low-Latency HLS (< 6s) is the practical ceiling.',
      },
      {
        title: 'Ingest Resilience and Consistent Hashing',
        description:
          'Twitch uses consistent hashing to route each streamer\'s RTMP connection to a dedicated transcoding worker. If the ingest server crashes, OBS auto-reconnects within 10 seconds (configurable). The consistent hash key (streamer ID) routes the reconnection to the same transcoding worker, which resumes processing with no discontinuity in the HLS segment sequence. Viewers experience a buffering event (the 10-second gap) but the stream does not end and does not require a new manifest URL. Worker-level health checks detect a failed worker and reassign its streams to a peer within the same consistent hash ring segment.',
      },
      {
        title: 'Distributed VOD Assembly',
        description:
          'During a live stream, 2-second HLS segments are written to S3 with keys structured as `{channel_id}/{stream_id}/{segment_seq}.ts`. S3\'s eventual consistency model means segments may be listed out of order; the assembly job uses the segment sequence number in the key (not S3 list order) to build the correct M3U8 playlist. For a 12-hour stream: 12 × 3600 / 2 = 21,600 segments. The assembly job is O(n) — it sorts segment keys and writes the playlist. At Twitch\'s scale, this completes within 15 minutes. Thumbnails are generated by extracting a keyframe from the first segment using FFmpeg and uploading to a CDN-backed image service.',
      },
    ],

    decisions: [
      {
        question: 'HLS pull vs WebRTC push for viewer delivery?',
        chosen: 'HLS for > 99% of viewers; WebRTC only for ULL mode on small channels',
        reason:
          'HLS scales to millions of viewers with stateless CDN caches — each 2-second segment request is an independent HTTP GET, requiring zero server-side state per viewer. WebRTC requires stateful TURN server connections for NAT traversal; scaling to 7M WebRTC connections would require 70,000+ TURN server cores at prohibitive cost. HLS\'s 6–20 second latency is entirely acceptable for passive viewing. WebRTC\'s sub-1s latency only matters for interactive use cases (e.g., IRL streamers reacting to chat).',
      },
      {
        question: 'Redis PubSub vs Kafka for chat message delivery?',
        chosen: 'Custom PubSub (Redis-like) with sliding window buffer; not Kafka',
        reason:
          'Chat is intentionally lossy — a message from 30 seconds ago is irrelevant. Kafka\'s durable offset model adds operational complexity (offset management, consumer lag monitoring, retention policies) with no product benefit. A Redis PubSub model with a 150-message sliding window buffer handles reconnect scenarios cleanly. Redis Pub/Sub\'s at-most-once delivery is a feature, not a limitation — it prevents the complexity of exactly-once delivery at 100K messages/minute.',
      },
      {
        question: 'On-demand transcode workers vs always-on dedicated workers per channel?',
        chosen: 'On-demand workers, allocated at stream start and released at stream end',
        reason:
          'At 100K concurrent channels, always-on dedicated workers would require 100K+ GPU cores running 24/7 — most of them idle during off-peak hours when only 20K channels are live. On-demand allocation with HPA means the GPU fleet scales with active channel count. Workers are pooled and shared across channels. The only overhead is the ~5-second allocation latency at stream start, which is invisible to viewers (the streamer sees a delay before their stream goes live).',
      },
    ],

    interview: [
      {
        q: "How does Twitch ensure a streamer's broadcast isn't dropped when their ingest server fails?",
        a: "OBS has a built-in reconnect timer (default 10 seconds). Twitch's ingest layer uses consistent hashing on streamer ID — reconnection routes to the same transcoding worker, which resumes the HLS segment sequence from where it left off. Viewers see a 10-second buffering event but the stream URL, manifest URL, and segment numbering remain unchanged. For further resilience: each ingest PoP has multiple servers; OBS can be configured with a backup ingest URL on a separate PoP. The transcoding worker maintains state (current segment number, audio sync timestamps) in memory with periodic checkpoints to Redis for crash recovery.",
      },
      {
        q: 'How does chat scale to 100K messages/minute without overwhelming WebSocket servers?',
        a: 'PubSub partitioning: channels are distributed across pod groups; each pod only receives messages for its assigned channels. Within a popular channel (1,700 msg/sec), the load is distributed across all WebSocket pods connected to that channel via the PubSub fan-out. Rate limiting caps per-user message rate (slow mode). The system is designed as lossy (at-most-once) — no retry logic, no durability. A 150-message sliding window buffer handles reconnects. The hardest scaling problem is a sudden viral spike (a channel going from 10K to 1M viewers in minutes); Twitch handles this by over-provisioning PubSub capacity and using autoscaling with aggressive scale-out triggers.',
      },
      {
        q: 'How would you design clip creation so a clip is shareable within 60 seconds?',
        a: 'Since HLS segments are already written to S3 in real time, clip creation requires no re-encoding. When a viewer requests a clip: (1) Calculate which S3 segment keys cover the requested timestamp window (e.g., last 30 seconds = 15 segments at 2s each). (2) Create a sub-M3U8 playlist pointing to those segment keys. (3) Upload the sub-playlist to S3 and invalidate/push to CDN. (4) Extract a thumbnail keyframe via FFmpeg from the first segment (async). (5) Generate a shareable URL pointing to the CDN-hosted sub-playlist. Steps 1–4 complete in under 10 seconds. The clip is playable as soon as the sub-playlist is on CDN — no transcode, no copy.',
      },
      {
        q: 'How does Twitch handle a sudden spike when a viral moment brings 1M new viewers to one channel?',
        a: 'Ingest is unaffected — the streamer\'s upload to the ingest PoP is a single RTMP connection; viewer count has zero impact on it. Transcoding is pre-allocated at stream start — already running. The spike only affects CDN delivery and WebSocket (chat). CDN handles viewer spikes natively — HLS is stateless, each segment request is independent, and CDN scales horizontally by adding capacity. The only bottleneck is the origin (segment source); Twitch mitigates this by pushing segments to CDN edges proactively (origin shield pattern). For chat: autoscaling triggers additional WebSocket pods and PubSub fan-out capacity. The 60-second autoscaling lag means the first minute of a viral spike may see elevated chat latency — acceptable.',
      },
    ],

    keyInsight:
      "Twitch's key architectural insight is treating ingest and delivery as completely separate pipelines. The streamer pushes to ingest; viewers pull from CDN. These paths never share infrastructure. This means a viewership spike (1M viewers joining a channel) has zero impact on the streamer's ingest quality — they're on separate networks. The streamer never knows how many people are watching at the infrastructure level.",
  },
];
