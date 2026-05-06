import { Concept } from '../types';

export const CONCEPTS_OSI: Concept[] = [
  {
    id: 'osi-layers',
    cat: 'networking',
    color: '#6272d4',
    icon: '-',
    title: 'The OSI Model: All 7 layers mapped to apps you use every day',
    tag: 'From the cable in your wall to the Chrome tab in your browser',

    hook: `Every time you open Slack, send a tweet, or stream a Netflix show, your data travels through exactly 7 layers of processing — each one stripping headers off on the way in, adding headers on the way out. Nobody told you. You never had to care. Until you debug a production outage at 2am and suddenly the layer number is the only thing that matters.

Developers who understand OSI don't just fix bugs faster — they design better. They know why a firewall rule that blocks by port can't also filter by URL path. They know why moving to QUIC dropped latency for Google by 30%. They know why that mysterious SSH session hang is almost certainly an MTU mismatch at L3, not a bug in their code. The OSI model is the shared language of every network engineer, cloud architect, and security researcher on the planet. Learn it once, and you'll never debug connectivity blind again.`,

    simpleExplain: `Imagine sending a physical letter to someone in Japan. You write the letter — that's the Application layer (L7), where your actual message lives. You translate it into Japanese so the recipient can read it — that's the Presentation layer (L6), handling language and format. You schedule a time to meet and exchange letters — that's the Session layer (L5), coordinating the conversation. You choose FedEx for guaranteed, tracked delivery versus dropping it in a regular post box for cheap but uncertain delivery — that's the Transport layer (L4), where TCP vs UDP lives. You write the full international address with zip codes, country codes, and routing instructions — that's the Network layer (L3), routing your data hop by hop across the world. The local post office bundles your letter into a mail bag headed for your neighborhood sorting hub — that's the Data Link layer (L2), moving data one physical hop at a time. And finally, the mail truck physically drives it down the road to the next hub — that's the Physical layer (L1), where actual signals travel through actual cables and radio waves.

Here's the beautiful part: each person handling your letter only reads the label addressed to them. The FedEx driver doesn't open your envelope. The sorting machine at the hub doesn't read your message. The postal worker at customs only reads the customs declaration, not your letter. Each layer is completely independent — and that's exactly why you can swap Wi-Fi for Ethernet, or HTTP for WebSocket, without rewriting everything else.`,

    pipeline: [
      {
        label: 'Layer 7 — Application',
        sublabel: 'HTTP · DNS · SMTP · WebSocket',
        icon: 'Monitor',
        simple:
          "The layer your code actually runs at. When you write fetch('/api/users'), you're at Layer 7. Every app protocol lives here — HTTP for web, SMTP for email, DNS for name lookup, WebSocket for real-time. This is where developers spend 99% of their time.",
        deep:
          'L7 defines the syntax and semantics of application data. Chrome uses HTTP/2 with binary framing and multiplexed streams over a single TCP connection. Slack uses WebSocket frames for real-time messaging. Gmail speaks SMTP for sending and IMAP for fetching. DNS uses its own UDP-based wire format with query/response records. This layer has zero knowledge of routing, ports, or cables — it trusts the layers below to handle delivery entirely.',
      },
      {
        label: 'Layer 6 — Presentation',
        sublabel: 'TLS · gzip · JSON · JPEG',
        icon: 'Code2',
        simple:
          'The translator. Converts your data into a format the receiver understands — and can optionally compress it to save bandwidth or encrypt it so nobody snoops. When your browser shows a padlock icon, L6 is doing the heavy lifting.',
        deep:
          "In practice, L6 is handled by TLS (encryption and decryption of the payload), content-encoding like gzip or Brotli (compression reducing payload size 60–80%), and serialization formats like JSON or Protocol Buffers (mapping structured data to bytes). When your browser decrypts an HTTPS response, that's L6 work. When Nginx serves gzip-compressed HTML, that's L6. Many TCP/IP implementations fold L5 and L6 conceptually into L7, but the work is still happening.",
      },
      {
        label: 'Layer 5 — Session',
        sublabel: 'TCP sessions · Auth · RPC',
        icon: 'Layers',
        simple:
          "Manages the conversation — knows when it starts, when to pause, and when it ends. Think of it as the 'are we still talking?' layer. It keeps track of who's connected to whom and for how long.",
        deep:
          'L5 handles session establishment, maintenance, and termination. In practice: TCP connection state (ESTABLISHED, TIME_WAIT, CLOSE_WAIT), TLS session resumption via session tickets (saving a full round-trip on reconnect), and authentication sessions (after login, the session persists across requests). gRPC streams operate at this layer conceptually. SQL connections maintain session state including open transactions, cursors, and temporary tables — all of which are L5 concerns.',
      },
      {
        label: 'Layer 4 — Transport',
        sublabel: 'TCP · UDP · QUIC · Ports',
        icon: 'Route',
        simple:
          'Two choices: TCP — the reliable postman who gets a signature and confirms delivery. UDP — the flyer through the letterbox, fast but no confirmation. Ports live here too, so multiple apps can share one IP address simultaneously.',
        deep:
          'TCP: 20-byte minimum header, 3-way handshake (SYN, SYN-ACK, ACK), sequence numbers, cumulative ACKs, sliding window flow control, and congestion control algorithms like CUBIC. UDP: 8-byte header, connectionless, no ordering guarantees, no retransmission — just send and forget. Port numbers (0–65535) allow multiplexing: your laptop can have Chrome on port 54321 and Spotify on port 54322 both talking to the internet via the same IP. QUIC combines UDP speed with TCP reliability by implementing its own retransmission and ordering in userspace.',
      },
      {
        label: 'Layer 3 — Network',
        sublabel: 'IP · Routing · BGP · NAT',
        icon: 'Globe',
        simple:
          'Figures out the best path across the entire internet — hop by hop, city by city — until your packet reaches the destination IP address. Like GPS for data, constantly recalculating the fastest route.',
        deep:
          "L3 adds source and destination IP addresses (32-bit for IPv4, 128-bit for IPv6). Routers operate exclusively here — each makes an independent forwarding decision based on its routing table without knowing the full path. BGP (Border Gateway Protocol) is how routers across different ISPs exchange reachability information globally. NAT (Network Address Translation) is why millions of home devices share one public IP. TTL (Time to Live) prevents routing loops — decremented at each hop, packet dropped and ICMP 'time exceeded' sent back when it hits zero.",
      },
      {
        label: 'Layer 2 — Data Link',
        sublabel: 'Ethernet · Wi-Fi · MAC · ARP',
        icon: 'Network',
        simple:
          'Handles one hop at a time — getting data from your laptop to your router, or from your router to the next switch. MAC addresses are the identities at this layer, not IP addresses. Each hop is a fresh L2 transaction.',
        deep:
          'L2 wraps IP packets in frames with 48-bit MAC source and destination addresses plus a CRC checksum for error detection. Ethernet switches operate at L2 — they maintain MAC address tables (learned by watching traffic) and forward frames only to the correct port. ARP (Address Resolution Protocol) maps IP addresses to MAC addresses via broadcast: "who is 192.168.1.1?" — the router replies with its MAC. Wi-Fi (802.11) is L2 with collision avoidance (CSMA/CA) and optional encryption (WPA3 uses SAE for forward secrecy).',
      },
      {
        label: 'Layer 1 — Physical',
        sublabel: 'Cables · Wi-Fi · Fiber · Signals',
        icon: 'Activity',
        simple:
          'The actual physical world — the cable in your wall, the Wi-Fi radio signal, or the light pulsing through fiber optic. This layer only knows ones and zeros. Everything else is built on top of this foundation.',
        deep:
          'L1 defines voltage levels, bit timing, cable specifications, and connector types. Cat6 Ethernet: up to 10Gbps over 55m. Cat6a: 10Gbps over 100m. Single-mode fiber: 100Gbps+ over 40km using laser light. Wi-Fi 6 (802.11ax): 9.6Gbps theoretical, OFDMA for dense environments. 5G NR: sub-6GHz for coverage, mmWave (24–100GHz) for extreme speed at short range. Signal attenuation, crosstalk, electromagnetic interference, and jitter are purely L1 problems that no software can fix.',
      },
    ],

    howItWorks: `When you type "Hey!" in WhatsApp and hit send, here's exactly what happens at each layer:

**L7 (Application):** WhatsApp's app code serializes your message into a Protobuf payload and wraps it in a WebSocket frame — the wire protocol WhatsApp uses for real-time messaging. The frame includes metadata: sender ID, recipient ID, timestamp, message type. This is the only layer that knows or cares that you're sending a chat message.

**L6 (Presentation):** WhatsApp applies end-to-end encryption using the Signal Protocol — a Double Ratchet algorithm that generates a new encryption key for every single message. The encrypted bytes are now an opaque blob that every lower layer treats as meaningless binary data. TLS also encrypts the outer transport for the server leg, so even the transport path is encrypted.

**L5 (Session):** The existing TCP connection — established when you opened WhatsApp — is reused. No new handshake needed. The WebSocket session has been maintained since you opened the app, heartbeat packets keeping it alive. The session layer tracks that this connection belongs to your authenticated user session.

**L4 (Transport):** TCP segments the encrypted payload. Each segment gets a sequence number (so the receiver can reorder out-of-order delivery), source port (e.g., 58234 — ephemeral), and destination port (443 — HTTPS/WebSocket standard port). TCP will wait for ACKs confirming each segment reached WhatsApp's server, retransmitting anything lost.

**L3 (Network):** Your device's IP stack adds a source IP (your phone's current IP — 192.168.1.x on home Wi-Fi, or a carrier-assigned IP on LTE) and destination IP (WhatsApp's server IP, e.g., 157.240.x.x — Facebook's AS32934 range). TTL is set to 64. Your phone's routing table says: anything not local goes to the default gateway (your router).

**L2 (Data Link):** On Wi-Fi, your phone's 802.11 chip wraps the IP packet in an 802.11 frame addressed to your router's MAC address (looked up in ARP cache). WPA3 applies another layer of encryption at L2 — so your data is encrypted at both L2 (Wi-Fi hop) and L6 (end-to-end). The frame includes a CRC for error detection.

**L1 (Physical):** The 802.11 chip modulates the bits into OFDM radio waves at 5GHz, transmitted from your phone's antenna. Your router's antenna receives them, demodulates back to bits, and the journey reverses up the stack — L2 checks the frame CRC and MAC, strips the Wi-Fi frame — now it's an IP packet. L3 routing table says: forward toward the internet. The packet leaves your home network as an Ethernet frame on your ISP's fiber, hops through several BGP routers, and arrives at Meta's data center.

On the receiving end (WhatsApp's server), the stack runs in reverse: L1 receives electrical pulses on a 100Gbps fiber line → L2 checks the Ethernet frame's CRC and strips it → L3 confirms the destination IP matches this server → L4 TCP reassembles segments in sequence order → L5 the WebSocket session identifies which connected client this belongs to → L6 TLS decrypts the transport, then WhatsApp's Signal Protocol decryption is applied → L7 WhatsApp's server reads the Protobuf frame and pushes the message to the recipient's active WebSocket connection, where the entire journey repeats in reverse to their device.`,

    components: [
      {
        name: 'L7 Application',
        icon: 'Monitor',
        role: 'Chrome (HTTP/2) · Slack (WebSocket) · Gmail (SMTP) · Terminal (SSH) · Postman (REST)',
        detail:
          "Every API you call, every webpage you load, every email you send operates at L7. When you debug with DevTools Network tab, you're watching L7 traffic in real time. HTTP status codes (200 OK, 404 Not Found, 500 Internal Server Error) are an L7 concept. HTTP headers (Authorization, Content-Type, Cache-Control) are L7. GraphQL, REST, gRPC, WebSocket, SMTP, IMAP, FTP, SSH — all L7 protocols. L7 is where developers live.",
      },
      {
        name: 'L6 Presentation',
        icon: 'Code2',
        role: 'HTTPS (TLS) · Gzip compression · JSON/Protobuf · JPEG/MP4',
        detail:
          'When Nginx serves a gzip-encoded response with Content-Encoding: gzip, it is doing L6 work. When your browser decrypts an HTTPS page using the negotiated TLS session key, that is L6. Image compression (JPEG lossy, PNG lossless, WebP adaptive) is L6 — encoding raw pixels into a transmittable format. Protocol Buffers and MessagePack are L6 serialization formats defining how structured objects map to binary bytes. Base64 encoding of binary attachments in email is L6.',
      },
      {
        name: 'L5 Session',
        icon: 'Layers',
        role: 'TCP connections · PostgreSQL sessions · gRPC streams · Auth tokens',
        detail:
          "When PgBouncer manages a pool of database connections, it's multiplexing many application-level sessions onto fewer actual L5 TCP connections. When your browser presents a TLS session ticket to avoid a full re-handshake, that's an L5 optimization saving ~100ms. SQL transactions (BEGIN/COMMIT/ROLLBACK) are scoped to one L5 session — the transaction state lives in the connection. A JWT is conceptually a stateless L5 session identifier: all session state is encoded in the token rather than stored server-side.",
      },
      {
        name: 'L4 Transport',
        icon: 'Route',
        role: 'TCP port 443 (HTTPS) · UDP port 53 (DNS) · UDP (gaming) · QUIC',
        detail:
          "When you run `ss -tulpn` and see which ports are listening on your server, you're reading the L4 state table. When an AWS Network Load Balancer routes based on TCP port, that's L4 routing — it never reads the HTTP payload. TCP's 3-way handshake adds one full round-trip of latency before any data flows — why HTTP/3 switched to QUIC (0-RTT data on reconnect for known servers). UDP's 8-byte header vs TCP's 20+ bytes makes DNS over UDP roughly 60% smaller per query.",
      },
      {
        name: 'L3 Network',
        icon: 'Globe',
        role: 'AWS VPC routing · Cloudflare anycast · NAT Gateway · ping · traceroute',
        detail:
          "An AWS Security Group is an L3/L4 stateful firewall — it filters by source IP, destination IP, and port. It cannot filter by URL path or HTTP header; that requires an L7 WAF. A VPC route table is a pure L3 concept: 10.0.0.0/8 via local, 0.0.0.0/0 via Internet Gateway. When Cloudflare's anycast serves your request from the nearest Point of Presence instead of a central server, BGP at L3 is making that routing decision in real time. ping uses ICMP Echo Request/Reply, which operates at L3.",
      },
      {
        name: 'L2 Data Link',
        icon: 'Network',
        role: 'Ethernet switches · Wi-Fi APs · VLAN segmentation · ARP protocol',
        detail:
          "When you segment a production network into VLANs (database VLAN, app VLAN, management VLAN), you're enforcing isolation at L2 — frames tagged with VLAN IDs cannot cross to other VLANs without an L3 router explicitly permitting it. ARP poisoning exploits the trust-based nature of L2: any device can broadcast a fake ARP reply claiming any IP. Spanning Tree Protocol (STP) prevents L2 switching loops that would otherwise broadcast-storm the network. When two AWS EC2 instances in the same subnet communicate, they use L2 directly with no L3 routing overhead.",
      },
      {
        name: 'L1 Physical',
        icon: 'Activity',
        role: 'Cat6 Ethernet · Fiber optic · Wi-Fi 6 · 5G NR · Bluetooth LE',
        detail:
          "Data center throughput is ultimately constrained by L1. A 400Gbps QSFP-DD port means the physical transceiver can move 400 billion bits per second — no software optimization changes that ceiling. A transatlantic fiber cable introduces ~70ms of latency purely from the speed of light in glass (roughly 2/3 the speed of light in vacuum) — pure physics that cannot be optimized away. When engineers pay premium rates for colocation hosting near financial exchanges, they're acknowledging that L1 light-speed physics dominates at nanosecond trading timescales.",
      },
    ],

    failures: [
      {
        name: 'MTU Mismatch (L3/L2 boundary)',
        cause:
          "Packet size exceeds the MTU (Maximum Transmission Unit) of 1500 bytes on Ethernet, and PMTUD (Path MTU Discovery) is blocked because an intermediate firewall drops ICMP 'fragmentation needed' (type 3, code 4) messages silently.",
        symptom:
          'Small HTTP requests succeed and small file transfers work fine. Large file uploads, HTTPS handshakes (which send large TLS Certificate messages), or SSH sessions hang indefinitely or fail silently after connection. The failure is inconsistent — ping works, curl connects but times out on large responses. Developers waste hours assuming the application is broken.',
        fix: "Set MTU to 1400 on tunnel and VPN interfaces to leave headroom for encapsulation headers. Test with `ping -M do -s 1472 host` (1472 + 28 bytes IP/ICMP header = 1500 MTU). Enable ICMP type 3 in all firewall rules — blocking ICMP entirely breaks PMTUD. For Kubernetes pod networks, check the CNI plugin's MTU setting — overlay networks (VXLAN adds 50 bytes) require reducing pod MTU from 1500 to ~1450.",
        severity: 'high',
      },
      {
        name: 'ARP Cache Poisoning (L2)',
        cause:
          "An attacker on the same L2 broadcast domain sends unsolicited gratuitous ARP replies, mapping their own MAC address to a legitimate IP — typically the default gateway's IP or a high-value server IP. ARP has no authentication: any device can claim any IP.",
        symptom:
          'Traffic is silently redirected to the attacker who can read, modify, or drop it before forwarding — a classic man-in-the-middle position. Victims experience normal connectivity (the attacker forwards packets). No network disruption, no error messages. Only detectable by monitoring ARP tables or seeing certificate warnings if HTTPS is used without pinning.',
        fix: 'Enable Dynamic ARP Inspection (DAI) on managed switches — it validates ARP packets against a trusted DHCP snooping binding table, dropping forged replies. Use static ARP entries for critical infrastructure (gateway, DNS servers). Segment sensitive systems into isolated VLANs to limit the L2 blast radius. Monitor with arpwatch or similar tools to alert on IP-MAC changes. Defense in depth: HTTPS with certificate pinning means even a successful MITM cannot read application data.',
        severity: 'critical',
      },
      {
        name: 'BGP Route Leak (L3)',
        cause:
          "An ISP or customer misconfigures their BGP policy and announces more-specific routes (a /24 where only a /16 should exist) or announces prefixes they don't own, attracting traffic from the global internet onto their network — accidentally or maliciously.",
        symptom:
          'Sites intermittently unreachable from specific geographic regions. Traffic takes bizarre paths — traceroute shows packets routing through unexpected countries adding hundreds of milliseconds. Can affect millions of users within minutes of the route announcement propagating. The originating network may not even notice the extra traffic.',
        fix: "BGP route filtering using RPKI (Resource Public Key Infrastructure) — a PKI system where IP address holders cryptographically sign Route Origin Authorizations (ROAs) specifying which ASNs may announce their prefixes. Routers with RPKI-aware filtering drop routes that fail validation. Cloudflare, Google, and major Tier-1 ISPs now require RPKI-valid routes. Famous example: in 2010, China Telecom leaked 50,000 BGP prefixes, briefly routing US military and government traffic through China for 18 minutes.",
        severity: 'critical',
      },
    ],

    commands: [
      {
        label: 'Watch ARP table (L2)',
        cmd: 'arp -a',
        what: "Shows the ARP cache — all IP to MAC address mappings currently known to your machine. Useful for verifying your gateway's MAC address has not changed unexpectedly, which would indicate ARP poisoning. On Linux, `ip neigh show` gives more detail including entry state (REACHABLE, STALE, FAILED).",
      },
      {
        label: 'Trace routing hops (L3)',
        cmd: 'traceroute -n google.com',
        what: 'Shows every router hop between you and the destination IP. Each line is one L3 forwarding decision. Latency spikes between hops reveal congestion points or long-distance fiber links. The -n flag skips reverse DNS lookups for faster output. On Windows: tracert. On Linux, traceroute uses UDP by default; traceroute -T uses TCP (better at crossing firewalls).',
      },
      {
        label: 'Capture packets by layer',
        cmd: "tcpdump -i eth0 -vv 'tcp port 443'",
        what: "Captures TLS/HTTPS traffic at the L2/L3/L4 boundary. Output shows Ethernet frame details, IP header fields (TTL, flags, fragment offset), and TCP segment info (sequence numbers, ACK, flags, window size). The -vv flag gives verbose output. Add -w capture.pcap to save for Wireshark analysis, where you can follow TCP streams and inspect the full L7 handshake including TLS ClientHello and ServerHello.",
      },
      {
        label: 'Check what is listening (L4)',
        cmd: 'ss -tulpn | sort -k5',
        what: "Lists all listening sockets on the system, sorted by port number. Shows protocol (TCP/UDP), local address, port, and the process name and PID using each socket. The -t flag is TCP, -u is UDP, -l is listening only, -p is process info, -n skips DNS resolution. The go-to command for 'what is using port 8080?' or 'is my service actually bound to 0.0.0.0 or just 127.0.0.1?'",
      },
    ],

    interview: {
      q: 'Describe the OSI model. Which layers does an L7 load balancer operate at and how does that differ from an L4 load balancer?',
      a: "The OSI model defines 7 layers: Physical (L1) handles raw bit transmission over cables and radio. Data Link (L2) manages node-to-node delivery using MAC addresses within a single network segment. Network (L3) handles logical addressing and routing across networks using IP addresses. Transport (L4) provides end-to-end communication with TCP (reliable) or UDP (connectionless), using port numbers for multiplexing. Session (L5) manages connection lifecycle. Presentation (L6) handles encryption, compression, and serialization. Application (L7) defines protocol semantics for specific applications.\n\nAn L4 load balancer (like AWS NLB or HAProxy in TCP mode) operates at the Transport layer — it routes based on IP addresses and TCP/UDP port numbers without ever inspecting the payload content. It can handle any TCP or UDP protocol blindly. Because it does minimal processing, it operates at wire speed, handles millions of connections, preserves the client IP address, and supports protocols like raw TCP databases or custom UDP protocols. The downside: it cannot make routing decisions based on content.\n\nAn L7 load balancer (like AWS ALB, Nginx, or Envoy) operates at the Application layer — it fully terminates the TCP connection, reads the HTTP request, and makes routing decisions based on URL path, HTTP headers, cookies, or request body. This enables: path-based routing (/api to service A, /static to CDN), host-based routing (subdomain to microservice), sticky sessions via Set-Cookie, SSL/TLS termination (offloading crypto from backend servers), WebSocket upgrade handling, and health checks that actually validate application responses (not just TCP connectivity). The tradeoff: L7 requires more CPU for packet inspection, only understands protocols it is programmed for (HTTP, gRPC, WebSocket), and adds latency from the extra TCP handshake.",
      fu: [
        'What is a TCP 3-way handshake and which OSI layer does it operate at?',
        'How does a CDN operate across multiple OSI layers simultaneously?',
        'What is the difference between a hub, a switch, and a router in OSI terms?',
        'Why does MTU matter in containerized environments like Kubernetes, and what happens when it is misconfigured?',
        'How does TLS span multiple OSI layers — where exactly does it operate?',
      ],
    },

    a: {
      v: '-',
      t: 'The International Mail System',
      tx: "Imagine sending a physical letter to someone in Japan. You write the letter — that is the Application layer (L7), where your actual message lives, authored by you. You translate it into Japanese so the recipient can read it — Presentation layer (L6), handling language and encoding. You schedule a time to meet for the exchange — Session layer (L5), coordinating when the conversation happens. You choose FedEx for guaranteed tracked delivery versus dropping it in a regular post box for cheap best-effort service — Transport layer (L4), where TCP vs UDP lives. You write the full international address with zip codes, country codes, and routing instructions — Network layer (L3), the global addressing and routing system. The local mail center bundles your letter into a mail bag specifically for your neighborhood postal route — Data Link layer (L2), handling one hop at a time. The mail truck physically drives it down the road to the next sorting hub — Physical layer (L1), actual atoms moving through actual space.\n\nHere is the key insight: each person handling your letter only reads the label addressed to them. The FedEx driver does not open the envelope. The sorting machine at the hub does not read your message. The customs officer only reads the customs declaration form stapled to the outside. Each layer is completely independent — and that is exactly why you can swap Wi-Fi for Ethernet, TCP for QUIC, or HTTP for gRPC without rewriting everything else. The layers do not know about each other, and they do not need to.",
      s: "The OSI model is not just theory — it is a debugging superpower. When production breaks, the layer number immediately constrains the problem space: L1 means physical or cable, check the link light. L2 means switch or ARP, check MAC tables. L3 means routing or IP, run traceroute. L4 means port or firewall, check iptables. L7 means application code, check your logs. Senior engineers do not debug randomly — they bisect the stack, eliminate layers, and converge on the root cause fast. That mental model is the OSI model in action.",
    },

    te: {
      def: 'The OSI (Open Systems Interconnection) model is a 7-layer conceptual framework standardized by ISO in 1984 that defines how network protocols should interact, from physical signal transmission at Layer 1 through application-level data exchange at Layer 7. It provides a common language for describing network functions and a structured approach to protocol design, troubleshooting, and system interoperability.',
      types: [
        {
          n: 'TCP/IP Model',
          d: "The practical 4-layer model (Link, Internet, Transport, Application) that maps to actual internet protocols. OSI is the conceptual reference model; TCP/IP is what is actually implemented. OSI's L5 (Session) and L6 (Presentation) are collapsed into TCP/IP's Application layer, reflecting how real implementations combine these concerns.",
        },
        {
          n: 'L4 vs L7 Load Balancing',
          d: 'L4 load balancers (AWS NLB, HAProxy TCP mode) route by IP address and port number — fast, protocol-agnostic, wire-speed. L7 load balancers (AWS ALB, Nginx, Envoy) inspect application payload — enabling path routing, header-based routing, SSL termination, and health checks. L7 is smarter but requires more compute and protocol-specific parsing.',
        },
        {
          n: 'Encapsulation and Decapsulation',
          d: 'Each layer wraps the payload from the layer above with its own header (and sometimes trailer), adding addressing and control information. The naming changes at each layer: Data becomes a Segment at L4 (ports and sequence numbers added), a Packet at L3 (IP addresses added), a Frame at L2 (MAC addresses and CRC added), then Bits at L1. The receiving side strips headers in reverse order — decapsulation — until the original application data emerges.',
        },
      ],
      when: 'Understanding OSI layers is essential when debugging mysterious connectivity failures (which layer is failing?), choosing the right load balancer type for your use case, designing network security policies (what can an L3 firewall vs L7 WAF block?), explaining why an L4 firewall rule cannot block specific HTTP URL paths, understanding why MTU mismatches cause HTTPS to hang but ping to succeed, or evaluating trade-offs between TCP and UDP for latency-sensitive applications.',
      trade:
        'The OSI model is sometimes criticized for not mapping perfectly to real TCP/IP implementations — the Internet existed before OSI was finalized, and TCP/IP collapsed L5 and L6 into L7 by practical necessity. Some argue the 7-layer model over-specifies the boundaries. But as a mental model for debugging, protocol design, infrastructure decisions, and communication across disciplines (developer, network engineer, security analyst), the 7-layer framework remains the standard shared vocabulary. Its value is not as a blueprint for implementation but as a structured way to reason about systems that span from physics to user experience.',
      code: `# Visualize all 7 layers for a real connection

# L1-L2: Check physical interface and link state
ip link show eth0

# L2: View ARP cache (IP to MAC mappings)
arp -a
# Or more detail:
ip neigh show

# L3: Check IP routing table
ip route show

# L3: Trace routing hops to destination
traceroute -n google.com

# L4: Check all listening sockets (TCP/UDP ports)
ss -tulpn

# L4 to L7: Full HTTP request timing broken down by layer
curl -o /dev/null -s -w "\\nDNS(L3/L7): %{time_namelookup}s | TCP handshake(L4): %{time_connect}s | TLS(L6): %{time_appconnect}s | TTFB(L7): %{time_starttransfer}s | Total: %{time_total}s\\n" https://google.com

# L2: Capture Ethernet frames and IP/TCP headers
tcpdump -i eth0 -vv 'tcp port 443'

# L3/L4: Test PMTUD — check if ICMP fragmentation-needed gets through
ping -M do -s 1472 google.com`,
      rw: {
        ex: [
          'AWS ALB (L7 — HTTP/gRPC routing) vs NLB (L4 — TCP/UDP routing)',
          'Kubernetes CNI plugins (Calico, Cilium, Flannel) operate at L2/L3 to provide pod networking',
          'Cloudflare WAF and DDoS protection operates at L7 — inspecting HTTP request content',
          "Wi-Fi WPA3 encryption operates at L2 — encrypting the 802.11 frame before it leaves your device's antenna",
          'iptables/nftables firewall rules operate at L3 (IP address filtering) and L4 (port filtering)',
          'Wireshark dissects traffic at all 7 layers simultaneously in its packet detail view',
        ],
        cs: "In October 2021, Facebook's entire global infrastructure went offline for approximately 6 hours in one of the largest outages in internet history. The root cause was a single BGP configuration change — a pure Layer 3 event. A routine maintenance command intended to audit BGP routes accidentally withdrew the BGP route announcements for Facebook's entire autonomous system, making Facebook's IP ranges unreachable from the rest of the internet. DNS stopped working because the DNS servers were suddenly unreachable. The website went down because no L3 path existed to reach any Facebook server. The devastating detail: because Facebook's internal tools (used by engineers to SSH in and fix the issue) also relied on the same BGP routes, engineers were physically locked out of their own infrastructure and had to send teams in person to data centers to restore the routes manually. Six hours, a billion dollars of market cap, and pure L3.",
      },
    },
  },
];
