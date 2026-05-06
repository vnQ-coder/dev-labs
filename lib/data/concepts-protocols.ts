import { Concept } from '../types';

export const CONCEPTS_PROTOCOLS: Concept[] = [
  {
    id: 'network-protocols',
    cat: 'networking',
    color: '#6272d4',
    icon: '-',
    title: "TCP, UDP, TLS, WebSockets, Socket.IO — when to use which",
    tag: "The protocol decision that defines your app's speed, reliability, and security",

    hook: "You're building a chat app. You reach for HTTP. Your lead says 'use WebSockets.' You reach for Socket.IO. A senior engineer asks why. Suddenly you realize you've been picking protocols by instinct, not by understanding what actually happens on the wire. This chapter fixes that.\n\nThe protocol you choose defines whether your data arrives in order, whether you get delivery guarantees, whether the connection stays open, whether it encrypts automatically, and how much overhead each message carries. Getting this wrong means either your video call stutters, your chat messages arrive out of order, or your server collapses under unnecessary connections.",

    simpleExplain: "Think of your data as a package you need to send.\n\n**TCP** is FedEx with signature required. Guaranteed delivery, in order, confirmed. Slower because of the paperwork.\n\n**UDP** is flyers through the letterbox. Fast, no confirmation, some might blow away. Perfect when speed matters more than perfection.\n\n**TLS** is a locked box around your FedEx package. The truck (TCP) still delivers it, but nobody can read the contents en route.\n\n**WebSocket** is a phone call you leave open. Both sides can talk anytime without hanging up and calling back each time.\n\n**Socket.IO** is a phone call with a personal assistant who reconnects it if it drops, and can put you into conference calls with groups.\n\n**QUIC** is a new truck that combines FedEx reliability with motorbike speed — built from scratch to be faster than the old system.",

    pipeline: [
      {
        icon: 'Shield',
        label: 'TCP',
        sublabel: 'Reliable · Ordered · Connection-based',
        simple: "TCP is the reliable protocol. Every byte you send is guaranteed to arrive, in the same order you sent it. Your browser uses TCP for every website it loads.",
        deep: "TCP establishes connections via a 3-way handshake (SYN→SYN-ACK→ACK) adding ~1 RTT before any data flows. Sequence numbers guarantee ordering. Selective ACKs confirm delivery. Congestion control (CUBIC, BBR) backs off when routers are overwhelmed. 20-byte minimum header. Head-of-line blocking: if packet 5 is lost, packets 6-100 wait in the buffer even if they arrived.",
      },
      {
        icon: 'Zap',
        label: 'UDP',
        sublabel: 'Fast · Connectionless · Best-effort',
        simple: "UDP doesn't wait for a handshake and doesn't confirm delivery. What it loses in reliability it gains in speed — perfect when late data is worse than missing data.",
        deep: "8-byte header (vs TCP's 20+). No handshake, no ordering, no retransmission. Application-layer reliability is possible (QUIC does this). At 60fps gaming, a missed position update 16ms ago is useless — resending it just causes lag. DNS uses UDP because a single-packet question → single-packet answer is faster than a TCP handshake. Broadcast and multicast are UDP-only.",
      },
      {
        icon: 'Lock',
        label: 'TLS',
        sublabel: 'Encryption · Authentication · Integrity',
        simple: "TLS isn't a separate transport — it's a security layer that wraps TCP. It encrypts data so nobody can read it in transit, verifies the server is who it claims, and detects any tampering.",
        deep: "TLS 1.3 handshake: 1 RTT (ClientHello with key_share → ServerHello + cert + Finished → client Finished). Uses ECDHE for key exchange (perfect forward secrecy — compromising today's key can't decrypt past sessions). AES-256-GCM for symmetric encryption. Certificate chain verified against root CAs. HTTPS = HTTP + TLS. WSS = WebSocket + TLS. mTLS adds client certificates for service-to-service auth.",
      },
      {
        icon: 'Activity',
        label: 'WebSocket',
        sublabel: 'Persistent · Bidirectional · Low-overhead',
        simple: "WebSocket opens a persistent connection between client and server. Both sides can send messages at any time — the server can push data without the client asking first. One connection, unlimited messages.",
        deep: "Starts as an HTTP/1.1 Upgrade request (Connection: Upgrade, Upgrade: websocket, Sec-WebSocket-Key header). After the 101 Switching Protocols response, the TCP connection is reused with a new framing protocol: 2–10 byte frame header (vs HTTP's 200+ byte headers per request). Full-duplex. Server push without polling. But: no built-in reconnection, no rooms/namespaces, stateful (load balancers need sticky sessions).",
      },
      {
        icon: 'Radio',
        label: 'Socket.IO',
        sublabel: 'WebSocket + reconnection + rooms + events',
        simple: "Socket.IO is a library that adds superpowers to WebSockets: automatic reconnection if the connection drops, named events instead of raw messages, rooms for grouping users, and fallback to HTTP long-polling for environments that block WebSockets.",
        deep: "Socket.IO is NOT a protocol — it's a library with its own packet framing on top of WebSocket (or XHR polling). Adds: event namespaces, room broadcasting (`io.to('room1').emit('event', data)`), heartbeat/ping-pong for connection health detection, exponential backoff reconnection, acknowledgment callbacks, and middleware support. Overhead: ~100-200 bytes per packet vs WebSocket's 2-10 bytes. The Engine.IO transport layer handles fallback.",
      },
      {
        icon: 'Globe',
        label: 'QUIC / HTTP3',
        sublabel: 'UDP-based · 0-RTT · No HOL blocking',
        simple: "QUIC takes everything TCP does — reliability, ordering, congestion control — and rebuilds it on top of UDP. The result is faster connections, no head-of-line blocking, and built-in TLS. It's what HTTP/3 runs on.",
        deep: "QUIC multiplexes independent streams over one UDP connection — packet loss in stream A doesn't block stream B (unlike TCP where one lost packet blocks all streams sharing the connection). 0-RTT for known servers (TLS session resumption sends data in the first packet). Connection migration: your connection survives switching from Wi-Fi to LTE because QUIC uses connection IDs, not 4-tuples (src IP, src port, dst IP, dst port). TLS 1.3 is mandatory — QUIC can't run without encryption.",
      },
    ],

    howItWorks: "Choosing the right protocol comes down to three questions:\n\n**1. Does order and reliability matter?**\nIf yes → TCP. If speed matters more than occasional loss → UDP.\n\nReal examples: A database query must arrive in order and complete — TCP. A live video stream can skip frames — UDP. A DNS query is one packet → one reply, no need for TCP overhead — UDP.\n\n**2. Does the server need to push data to the client?**\nIf yes → WebSocket (or Socket.IO if you need rooms/reconnection). If it's just request-response → plain HTTP/TCP.\n\nReal examples: Slack message arrives without you requesting it → WebSocket. Your React app fetching a user profile → HTTP GET.\n\n**3. Do you need encryption?**\nAlways on the public internet. HTTPS (HTTP+TLS), WSS (WebSocket+TLS), never plain HTTP or WS in production.\n\n**The full decision matrix:**\n\n| Use case | Protocol choice | Why |\n|---|---|---|\n| REST API | HTTPS (HTTP/2 + TLS) | Request-response, encrypted |\n| Chat app | WSS + Socket.IO | Push, rooms, reconnection |\n| Video call | WebRTC (DTLS+SRTP over UDP) | Speed, UDP, encrypted |\n| File download | HTTPS | Reliability, resumable |\n| DNS lookup | UDP/53 | Single packet, no handshake |\n| Online game | UDP (custom) or WebSocket | Low latency |\n| Mobile API | HTTP/3 (QUIC) | Connection migration, 0-RTT |\n| Microservices | gRPC (HTTP/2 + TLS) or mTLS | Efficiency, auth |\n| Real-time DB | WebSocket | Server push for live queries |",

    components: [
      {
        name: "TCP in Production",
        icon: 'Shield',
        role: "PostgreSQL · Redis · Nginx upstream · SSH · SMTP",
        detail: "Every database connection you make is TCP. When PgBouncer pools 1000 app connections into 10 DB connections, it's managing 10 TCP sessions. Redis AUTH, Elasticsearch queries, Kafka producers — all TCP. SSH tunnels are TCP. SMTP relay between mail servers is TCP/25 or TCP/465 (SMTPS).",
      },
      {
        name: "UDP in Production",
        icon: 'Zap',
        role: "DNS · Cloudflare DNS · Game servers · Zoom audio · DHCP",
        detail: "Cloudflare's 1.1.1.1 handles 1 trillion DNS queries/month over UDP. Zoom's audio channel uses UDP because a 20ms audio dropout is imperceptible — a 200ms retransmission delay is not. Steam's game servers use UDP with custom reliability layers. DHCP bootstraps network config via UDP broadcast before an IP is even assigned.",
      },
      {
        name: "TLS in Production",
        icon: 'Lock',
        role: "Let's Encrypt · Cloudflare TLS termination · mTLS in Istio · Database TLS",
        detail: "Let's Encrypt issues 300M+ free TLS certificates. Cloudflare terminates TLS at 300+ edge PoPs before proxying to your origin (optionally with TLS to origin too). Istio service mesh enforces mTLS between every microservice — zero-trust networking. Postgres supports `sslmode=verify-full` to require verified TLS for database connections.",
      },
      {
        name: "WebSocket in Production",
        icon: 'Activity',
        role: "Slack · Discord · Figma · GitHub Copilot · TradingView",
        detail: "Slack maintains one persistent WebSocket per client to deliver messages without polling. Figma uses WebSockets for collaborative multiplayer editing — your cursor and edits stream in real-time to other users. GitHub Copilot streams token completions over WebSocket. TradingView streams tick-by-tick price updates to charts.",
      },
      {
        name: "Socket.IO in Production",
        icon: 'Radio',
        role: "Trello · Notion (early) · Online whiteboards · Multiplayer games",
        detail: "Trello used Socket.IO for real-time board updates (cards moving across lists). Online whiteboard apps use Socket.IO rooms to broadcast drawing events to specific collaborators. The reconnection logic is particularly valuable for mobile users who frequently switch networks. Notable: Socket.IO rooms allow broadcasting to 10,000 users in one `emit` call.",
      },
      {
        name: "QUIC/HTTP3 in Production",
        icon: 'Globe',
        role: "YouTube · Google Search · Cloudflare · Facebook · Shopify",
        detail: "Google invented QUIC and now routes ~50% of all YouTube traffic over it. HTTP/3 (QUIC) is enabled by default in Chrome, Firefox, and Safari. Cloudflare serves HTTP/3 for all customers automatically. Facebook uses QUIC for their mobile app APIs — connection migration is critical for users switching between cellular and Wi-Fi.",
      },
    ],

    failures: [
      {
        name: "WebSocket Connection Not Upgrading",
        cause: "Reverse proxy (Nginx, AWS ALB) not configured to pass WebSocket upgrade headers — drops the connection as a regular HTTP request",
        symptom: "WebSocket falls back to HTTP long-polling (visible in DevTools as repeated XHR requests). Socket.IO may still work but with high latency. WS connects then immediately closes.",
        fix: "Add to Nginx config: `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection 'upgrade';`. AWS ALB: select 'WebSockets' in listener protocol. Check proxy_read_timeout — WebSockets need a long timeout (proxy_read_timeout 3600s).",
        severity: 'high',
      },
      {
        name: "TCP Head-of-Line Blocking on HTTP/2",
        cause: "HTTP/2 multiplexes streams over one TCP connection — a single lost packet blocks all streams until TCP retransmits it, negating HTTP/2's multiplexing benefit",
        symptom: "On lossy networks (mobile, VPN), HTTP/2 is slower than HTTP/1.1 with multiple connections. Packet loss amplifies latency disproportionately.",
        fix: "Enable HTTP/3 (QUIC) — QUIC has independent per-stream loss recovery at the QUIC layer, not the transport layer. For HTTP/2, increase TCP buffer sizes. Or use multiple HTTP/1.1 connections (browsers do this by default for HTTP/1.1).",
        severity: 'medium',
      },
      {
        name: "UDP Blocked by Corporate Firewall",
        cause: "Corporate firewalls often block all UDP traffic except DNS (port 53), preventing QUIC/HTTP3 and WebRTC from working",
        symptom: "Video calls fail on corporate Wi-Fi. Google Workspace video works but is slow (falls back to TCP). QUIC disabled in browser, falling back to HTTP/2.",
        fix: "HTTP/3 (QUIC) gracefully falls back to HTTP/2 over TCP — no action needed for web traffic. WebRTC/Zoom has TCP fallback mode (port 443). TURN servers relay WebRTC UDP via TCP for enterprise firewalls. Socket.IO falls back to HTTP long-polling automatically.",
        severity: 'medium',
      },
    ],

    commands: [
      {
        label: "Check which protocol a site uses",
        cmd: "curl -sI --http3 https://google.com | head -5 || curl -sI https://google.com | head -5",
        what: "Tests if the server supports HTTP/3 (QUIC). If supported, shows 'HTTP/3'. Falls back to HTTP/2 or HTTP/1.1 and shows the protocol used.",
      },
      {
        label: "Test WebSocket connection",
        cmd: "npx wscat -c wss://echo.websocket.org",
        what: "Opens a WebSocket connection to a public echo server. Type messages and see them echoed back. Great for testing if WebSockets work through your proxy/firewall.",
      },
      {
        label: "Monitor TCP connection states",
        cmd: "ss -s",
        what: "Shows a summary of TCP states (ESTABLISHED, TIME_WAIT, SYN_SENT, etc.). High TIME_WAIT count indicates many short-lived connections — consider keep-alive or connection pooling.",
      },
      {
        label: "Capture WebSocket frames",
        cmd: "tcpdump -i any -w ws-capture.pcap 'tcp port 443' && wireshark ws-capture.pcap",
        what: "Captures all HTTPS/WSS traffic. Open in Wireshark → right-click a packet → Follow → TCP Stream to see the WebSocket upgrade handshake and subsequent frames.",
      },
    ],

    interview: {
      q: "You're building a collaborative code editor like Replit. What protocol would you use for real-time collaboration and why?",
      a: "For a collaborative code editor, I'd use WebSockets (specifically WSS for encryption) for the real-time collaboration layer. The key requirement is bidirectional streaming: when one user types, all other cursors and changes must update in under 50ms — HTTP polling can't achieve this. I'd use Socket.IO over raw WebSockets for three reasons: (1) built-in rooms let me isolate collaboration sessions per file/project, (2) automatic reconnection handles mobile users or flaky connections without losing their session, and (3) event namespacing separates cursor events from content events from presence (who's online). For the document sync protocol itself, I'd use CRDTs (Conflict-free Replicated Data Types) or Operational Transform — these handle concurrent edits mathematically. Persisting changes uses a standard HTTP/REST API for non-real-time operations (saving, opening files). I'd also use QUIC/HTTP3 for the API calls from mobile clients for faster connection establishment when switching networks.",
      fu: [
        "How does WebRTC differ from WebSocket for video calls?",
        "What is DTLS and how does it relate to TLS?",
        "How would you scale WebSocket connections to 1 million concurrent users?",
        "What are the tradeoffs of gRPC vs REST vs GraphQL?",
        "How does HTTP/2 server push differ from WebSocket push?",
      ],
    },

    a: {
      v: '-',
      t: 'The Delivery Service Decision',
      tx: "Think of your data as a package you need to send.\n\nTCP is FedEx with signature required — every package tracked, delivery confirmed, contents arrive in perfect order, and if one is lost, they resend it. Reliable, but the paperwork takes time.\n\nUDP is flyers through a letterbox. Fast, no forms, no confirmation. Some blow away in the wind. Perfect if you're sending 60 flyers a second and missing one or two doesn't matter.\n\nTLS is a locked armored box. You still use FedEx (TCP) to ship it — but nobody can read what's inside. The lock is the encryption.\n\nWebSocket is a phone call you leave open all day. No hanging up and calling back for every sentence. Both sides just talk when they have something to say.\n\nSocket.IO is that phone call with a personal assistant who redials if it drops, routes you into conference calls, and organizes everyone into rooms.",
      s: "The protocol choice is an architectural decision, not an implementation detail. TCP for reliability, UDP for speed, TLS always for security, WebSocket when the server needs to push, Socket.IO when you need rooms and reconnection, QUIC when you need TCP's reliability with UDP's speed. Know the tradeoffs and you'll never reach for the wrong tool again.",
    },

    te: {
      def: "Network protocols define the rules for how data is formatted, transmitted, received, and acknowledged between devices. The choice of protocol determines reliability, speed, security, and connection model of your application.",
      types: [
        {
          n: "Connection-oriented (TCP)",
          d: "Establishes a connection before data flows. Guarantees delivery and ordering. Higher latency due to handshake overhead.",
        },
        {
          n: "Connectionless (UDP)",
          d: "No handshake. Data sent immediately. No delivery guarantee. Lower overhead, higher speed for bursty data.",
        },
        {
          n: "Persistent connections (WebSocket)",
          d: "One connection, unlimited bidirectional messages. Eliminates per-request HTTP overhead. Stateful — needs sticky load balancing.",
        },
      ],
      when: "Choose TCP/HTTPS for any request-response API. Choose WebSocket when the server needs to push data to clients in real-time. Choose UDP when you have high-frequency updates where missing one frame is acceptable (gaming, audio, video). Always layer TLS on top for public internet traffic.",
      trade: "TCP's reliability guarantees come at the cost of head-of-line blocking and handshake latency. UDP's speed comes with no ordering or delivery guarantee. WebSockets maintain persistent state (harder to scale horizontally — need sticky sessions or pub/sub). Socket.IO's extras add per-packet overhead. QUIC solves TCP's HOL blocking but UDP is blocked by some enterprise firewalls.",
      code: `# TCP connection test (L4)
nc -zv google.com 443 && echo "TCP open"

# Check what HTTP version is negotiated
curl -sI --http2 https://google.com | grep HTTP
curl -sI --http3 https://google.com | grep HTTP

# WebSocket connection test
npx wscat -c wss://echo.websocket.org

# Monitor active TCP connections per state
ss -s

# See all established connections to port 443
ss -tn state established '( dport = :443 )'

# Test UDP (DNS over UDP port 53)
dig +time=2 +tries=1 google.com @8.8.8.8`,
      rw: {
        ex: [
          "Slack: WebSocket for messages, HTTP for file uploads",
          "Discord: WebSocket + UDP (WebRTC) for voice",
          "Cloudflare: QUIC/HTTP3 for all customer sites",
          "Steam: UDP for game state, TCP for purchases/auth",
          "Zoom: UDP (SRTP) for audio/video, TCP fallback",
        ],
        cs: "When Figma scaled from 1000 to 1 million users, WebSocket connection management became their biggest infrastructure challenge. Each collaborative session is a WebSocket room — a user joining a large Figma file means joining a room with potentially hundreds of active connections, all needing to receive cursor and edit events. They moved from Socket.IO to a custom WebSocket implementation with a pub/sub backend (Redis) to decouple connection state from server state, enabling horizontal scaling.",
      },
    },
  },
];
