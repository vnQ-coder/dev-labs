import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
  description: string;
}

/* ── Edge style helpers ──────────────────────────────────────────── */

function arrow(color: string) {
  return { type: MarkerType.ArrowClosed, color, width: 14, height: 14 };
}

/** Animated solid edge with arrow */
function ae(color: string, label?: string): Partial<Edge> {
  return {
    animated: true,
    style: { stroke: color, strokeWidth: 1.8 },
    markerEnd: arrow(color),
    ...(label ? { label, labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 }, labelBgStyle: { fill: 'rgba(6,10,18,0.9)', fillOpacity: 1 }, labelBgPadding: [4, 6] as [number, number], labelBgBorderRadius: 4 } : {}),
  };
}

/** Static dashed edge with arrow */
function de(color: string, label?: string): Partial<Edge> {
  return {
    animated: false,
    style: { stroke: color, strokeWidth: 1.6, strokeDasharray: '6 3' },
    markerEnd: arrow(color),
    ...(label ? { label, labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 }, labelBgStyle: { fill: 'rgba(6,10,18,0.9)', fillOpacity: 1 }, labelBgPadding: [4, 6] as [number, number], labelBgBorderRadius: 4 } : {}),
  };
}

/* ── NETWORKING DIAGRAMS ─────────────────────────────────────────── */

export const NETWORKING_DIAGRAMS: Record<string, DiagramData> = {

  /* ── 1. URL Journey ── */
  'url-journey': {
    description: 'The full browser request lifecycle: DNS resolves the hostname, TCP opens the connection, TLS encrypts it, HTTP carries the request, the server processes and responds, the browser renders.',
    nodes: [
      { id: 'browser', type: 'source',  position: { x: 0,   y: 100 }, data: { label: 'Browser',        sub: 'types URL + hits Enter',             color: '#6272d4' } },
      { id: 'dns',     type: 'process', position: { x: 150, y: 30  }, data: { label: 'DNS Lookup',      sub: 'google.com → 142.x.x.x',            color: '#38bdf8' } },
      { id: 'tcp',     type: 'process', position: { x: 150, y: 110 }, data: { label: 'TCP Connect',     sub: 'SYN → SYN-ACK → ACK',               color: '#6272d4' } },
      { id: 'tls',     type: 'process', position: { x: 300, y: 60  }, data: { label: 'TLS Handshake',   sub: 'cert verify · key exchange',         color: '#f59e0b' } },
      { id: 'http',    type: 'process', position: { x: 450, y: 60  }, data: { label: 'HTTP Request',    sub: 'GET / HTTP/2',                       color: '#6272d4' } },
      { id: 'nginx',   type: 'process', position: { x: 600, y: 30  }, data: { label: 'Nginx Proxy',     sub: 'terminates TLS · routes',            color: '#34d399' } },
      { id: 'app',     type: 'process', position: { x: 600, y: 110 }, data: { label: 'App Server',      sub: 'Node/Go/Python',                     color: '#34d399' } },
      { id: 'db',      type: 'sink',    position: { x: 750, y: 110 }, data: { label: 'Database',        sub: 'query · 5-50ms',                     color: '#8b78d4' } },
      { id: 'render',  type: 'sink',    position: { x: 750, y: 0   }, data: { label: 'Browser Render',  sub: 'DOM → Paint → Composite',            color: '#6272d4' } },
      { id: 'metric',  type: 'metric',  position: { x: 300, y: 200 }, data: { label: 'P99 target: DNS <50ms · TCP <30ms · TLS <100ms · TTFB <200ms · Total <1000ms' } },
    ],
    edges: [
      { id: 'e-br-dns',     source: 'browser', target: 'dns',    ...ae('#38bdf8', 'resolve') },
      { id: 'e-br-tcp',     source: 'browser', target: 'tcp',    ...ae('#6272d4', 'connect') },
      { id: 'e-dns-tls',    source: 'dns',     target: 'tls',    ...ae('#38bdf8') },
      { id: 'e-tcp-tls',    source: 'tcp',     target: 'tls',    ...ae('#6272d4') },
      { id: 'e-tls-http',   source: 'tls',     target: 'http',   ...ae('#f59e0b', 'encrypted') },
      { id: 'e-http-ng',    source: 'http',    target: 'nginx',  ...ae('#34d399') },
      { id: 'e-ng-app',     source: 'nginx',   target: 'app',    ...ae('#34d399') },
      { id: 'e-app-db',     source: 'app',     target: 'db',     ...ae('#8b78d4', 'query') },
      { id: 'e-app-render', source: 'app',     target: 'render', ...de('#6272d4', 'HTTP 200') },
    ],
  },

  /* ── 2. DNS Explained ── */
  'dns-explained': {
    description: 'DNS resolution walks a hierarchy: local caches first, then ISP resolver, then root and TLD servers, and finally the authoritative nameserver that has the actual IP.',
    nodes: [
      { id: 'browser',  type: 'source',  position: { x: 0,   y: 130 }, data: { label: 'Browser',           sub: 'google.com?',                          color: '#6272d4' } },
      { id: 'br-cache', type: 'process', position: { x: 160, y: 60  }, data: { label: 'Browser Cache',      sub: 'TTL: 300s',                            color: '#6272d4' } },
      { id: 'os',       type: 'process', position: { x: 160, y: 140 }, data: { label: 'OS Cache',           sub: '/etc/hosts · nscd',                    color: '#6272d4' } },
      { id: 'router',   type: 'process', position: { x: 160, y: 220 }, data: { label: 'Router Cache',       sub: 'home router',                          color: '#6272d4' } },
      { id: 'isp',      type: 'process', position: { x: 320, y: 130 }, data: { label: 'ISP Resolver',       sub: 'recursive · 1.1.1.1 / 8.8.8.8',       color: '#38bdf8' } },
      { id: 'root',     type: 'sink',    position: { x: 480, y: 50  }, data: { label: 'Root Server',        sub: '13 clusters · who owns .com?',         color: '#f59e0b' } },
      { id: 'tld',      type: 'sink',    position: { x: 480, y: 130 }, data: { label: '.com TLD Server',    sub: 'VeriSign · where is google.com?',      color: '#f59e0b' } },
      { id: 'auth',     type: 'sink',    position: { x: 480, y: 210 }, data: { label: 'Authoritative DNS',  sub: "google's own NS · 142.250.x.x",       color: '#34d399' } },
      { id: 'ip',       type: 'sink',    position: { x: 640, y: 130 }, data: { label: 'IP Returned',        sub: '142.250.80.46 · cached',               color: '#34d399' } },
      { id: 'metric',   type: 'metric',  position: { x: 320, y: 295 }, data: { label: 'Cache hit (browser/OS): ~0ms. Full resolution: 50-200ms. Result cached by TTL at each level.' } },
    ],
    edges: [
      { id: 'e-br-brc',   source: 'browser', target: 'br-cache', ...ae('#6272d4', 'cache?') },
      { id: 'e-br-os',    source: 'browser', target: 'os',       ...ae('#6272d4') },
      { id: 'e-br-rt',    source: 'browser', target: 'router',   ...ae('#6272d4') },
      { id: 'e-rt-isp',   source: 'router',  target: 'isp',      ...ae('#38bdf8', 'miss → recurse') },
      { id: 'e-isp-root', source: 'isp',     target: 'root',     ...ae('#f59e0b') },
      { id: 'e-isp-tld',  source: 'isp',     target: 'tld',      ...ae('#f59e0b') },
      { id: 'e-isp-auth', source: 'isp',     target: 'auth',     ...ae('#34d399') },
      { id: 'e-auth-ip',  source: 'auth',    target: 'ip',       ...ae('#34d399', 'A record') },
      { id: 'e-ip-br',    source: 'ip',      target: 'browser',  ...de('#6272d4', 'use this IP') },
    ],
  },

  /* ── 3. OSI + TCP ── */
  'osi-tcp': {
    description: "Data travels down the OSI stack on the sender (adding headers at each layer), crosses the network, and travels back up the receiver's stack (stripping headers). Each layer only reads its own header.",
    nodes: [
      /* sender stack */
      { id: 'l7s', type: 'source',  position: { x: 0,   y: 0   }, data: { label: 'L7 Application', sub: 'HTTP GET / WebSocket',      color: '#38bdf8' } },
      { id: 'l6s', type: 'process', position: { x: 0,   y: 70  }, data: { label: 'L6 Presentation',sub: 'TLS encrypt · gzip',        color: '#6272d4' } },
      { id: 'l5s', type: 'process', position: { x: 0,   y: 140 }, data: { label: 'L5 Session',     sub: 'TCP connection state',      color: '#6272d4' } },
      { id: 'l4s', type: 'process', position: { x: 0,   y: 210 }, data: { label: 'L4 Transport',   sub: 'TCP segment · port 443',    color: '#a78bfa' } },
      { id: 'l3s', type: 'process', position: { x: 0,   y: 280 }, data: { label: 'L3 Network',     sub: 'IP packet · routing',       color: '#f59e0b' } },
      { id: 'l2s', type: 'process', position: { x: 0,   y: 350 }, data: { label: 'L2 Data Link',   sub: 'Ethernet frame · MAC',      color: '#f97316' } },
      { id: 'l1s', type: 'sink',    position: { x: 0,   y: 420 }, data: { label: 'L1 Physical',    sub: 'bits on wire / radio',      color: '#34d399' } },
      /* network */
      { id: 'net', type: 'process', position: { x: 220, y: 210 }, data: { label: 'Internet',       sub: 'routers · BGP · hops',      color: '#94a3b8' } },
      /* receiver stack */
      { id: 'l1r', type: 'source',  position: { x: 440, y: 420 }, data: { label: 'L1 Physical',    sub: 'receive signal',            color: '#34d399' } },
      { id: 'l2r', type: 'process', position: { x: 440, y: 350 }, data: { label: 'L2 Data Link',   sub: 'check MAC · strip frame',   color: '#f97316' } },
      { id: 'l3r', type: 'process', position: { x: 440, y: 280 }, data: { label: 'L3 Network',     sub: 'check IP · strip packet',   color: '#f59e0b' } },
      { id: 'l4r', type: 'process', position: { x: 440, y: 210 }, data: { label: 'L4 Transport',   sub: 'TCP reassemble · ports',    color: '#a78bfa' } },
      { id: 'l5r', type: 'process', position: { x: 440, y: 140 }, data: { label: 'L5 Session',     sub: 'maintain connection',       color: '#6272d4' } },
      { id: 'l6r', type: 'process', position: { x: 440, y: 70  }, data: { label: 'L6 Presentation',sub: 'TLS decrypt · decompress',  color: '#6272d4' } },
      { id: 'l7r', type: 'sink',    position: { x: 440, y: 0   }, data: { label: 'L7 Application', sub: 'HTTP response to app',      color: '#38bdf8' } },
      /* metric */
      { id: 'metric', type: 'metric', position: { x: 100, y: 470 }, data: { label: 'Encapsulation: each layer wraps data. De-encapsulation: each layer on receiver strips its header. Data unchanged.' } },
    ],
    edges: [
      /* sender going down */
      { id: 'e-l7s-l6s', source: 'l7s', target: 'l6s', ...ae('#6272d4', 'add TLS') },
      { id: 'e-l6s-l5s', source: 'l6s', target: 'l5s', ...ae('#6272d4') },
      { id: 'e-l5s-l4s', source: 'l5s', target: 'l4s', ...ae('#a78bfa', 'segment') },
      { id: 'e-l4s-l3s', source: 'l4s', target: 'l3s', ...ae('#f59e0b', 'packet') },
      { id: 'e-l3s-l2s', source: 'l3s', target: 'l2s', ...ae('#f97316', 'frame') },
      { id: 'e-l2s-l1s', source: 'l2s', target: 'l1s', ...ae('#34d399', 'bits') },
      { id: 'e-l1s-net', source: 'l1s', target: 'net', ...ae('#94a3b8', 'transmit') },
      { id: 'e-net-l1r', source: 'net', target: 'l1r', ...ae('#94a3b8', 'receive') },
      /* receiver going up */
      { id: 'e-l1r-l2r', source: 'l1r', target: 'l2r', ...ae('#34d399') },
      { id: 'e-l2r-l3r', source: 'l2r', target: 'l3r', ...ae('#f97316', 'strip frame') },
      { id: 'e-l3r-l4r', source: 'l3r', target: 'l4r', ...ae('#f59e0b', 'strip packet') },
      { id: 'e-l4r-l5r', source: 'l4r', target: 'l5r', ...ae('#a78bfa', 'reassemble') },
      { id: 'e-l5r-l6r', source: 'l5r', target: 'l6r', ...ae('#6272d4') },
      { id: 'e-l6r-l7r', source: 'l6r', target: 'l7r', ...ae('#38bdf8', 'decrypted data') },
    ],
  },

  /* ── 4. HTTPS / TLS ── */
  'https-tls': {
    description: 'The TLS 1.3 handshake takes 1 round-trip. Client and server derive the same session key using ECDHE without ever transmitting it. All data after the handshake is AES-256-GCM encrypted.',
    nodes: [
      { id: 'client', type: 'source',  position: { x: 0,   y: 150 }, data: { label: 'Client',            sub: 'Browser / App',                      color: '#6272d4' } },
      { id: 'ch',     type: 'process', position: { x: 190, y: 30  }, data: { label: '① ClientHello',     sub: 'TLS 1.3 · cipher list · key_share',   color: '#6272d4' } },
      { id: 'sh',     type: 'process', position: { x: 190, y: 110 }, data: { label: '② ServerHello',     sub: 'chosen cipher · server key_share',    color: '#f59e0b' } },
      { id: 'cert',   type: 'process', position: { x: 190, y: 190 }, data: { label: '③ Certificate',     sub: 'server identity + CA signature',      color: '#f59e0b' } },
      { id: 'verify', type: 'process', position: { x: 190, y: 270 }, data: { label: '④ Verify + Keys',   sub: 'ECDHE derive shared secret',          color: '#34d399' } },
      { id: 'fin',    type: 'process', position: { x: 190, y: 350 }, data: { label: '⑤ Finished',        sub: 'both sides confirm · 1 RTT done',     color: '#34d399' } },
      { id: 'server', type: 'sink',    position: { x: 380, y: 150 }, data: { label: 'Server',             sub: 'origin · Nginx',                     color: '#6272d4' } },
      { id: 'enc',    type: 'sink',    position: { x: 380, y: 350 }, data: { label: 'Encrypted Channel',  sub: 'AES-256-GCM · perfect fwd secrecy',  color: '#34d399' } },
      { id: 'metric', type: 'metric',  position: { x: 0,   y: 430 }, data: { label: 'TLS 1.3: 1 RTT handshake. TLS 1.2: 2 RTT. Session resumption (0-RTT): data in first packet.' } },
    ],
    edges: [
      { id: 'e-cl-ch',    source: 'client', target: 'ch',     ...ae('#6272d4', 'send') },
      { id: 'e-ch-sv',    source: 'ch',     target: 'server', ...ae('#6272d4') },
      { id: 'e-sv-sh',    source: 'server', target: 'sh',     ...ae('#f59e0b', 'reply') },
      { id: 'e-sv-cert',  source: 'server', target: 'cert',   ...ae('#f59e0b') },
      { id: 'e-sh-vfy',   source: 'sh',     target: 'verify', ...ae('#34d399') },
      { id: 'e-cert-vfy', source: 'cert',   target: 'verify', ...ae('#34d399', 'validate CA') },
      { id: 'e-vfy-fin',  source: 'verify', target: 'fin',    ...ae('#34d399') },
      { id: 'e-fin-enc',  source: 'fin',    target: 'enc',    ...ae('#34d399', 'channel open') },
      { id: 'e-enc-sv',   source: 'enc',    target: 'server', ...de('#34d399', 'all traffic encrypted') },
    ],
  },

  /* ── 5. Reverse Proxy ── */
  'reverse-proxy': {
    description: 'Nginx sits between the internet and your app — terminating TLS, applying rate limits, selecting an upstream instance, and adding security headers. Your app never handles a raw TCP connection.',
    nodes: [
      { id: 'u1',    type: 'source',  position: { x: 0,   y: 20  }, data: { label: 'User A',       sub: 'request',                            color: '#38bdf8' } },
      { id: 'u2',    type: 'source',  position: { x: 0,   y: 100 }, data: { label: 'User B',       sub: 'request',                            color: '#38bdf8' } },
      { id: 'u3',    type: 'source',  position: { x: 0,   y: 180 }, data: { label: 'User C',       sub: 'request',                            color: '#38bdf8' } },
      { id: 'nginx', type: 'process', position: { x: 185, y: 100 }, data: { label: 'Nginx',         sub: 'TLS · rate limit · route · compress', color: '#6272d4' } },
      { id: 'app1',  type: 'sink',    position: { x: 380, y: 20  }, data: { label: 'App Server 1', sub: 'localhost:3000',                      color: '#34d399' } },
      { id: 'app2',  type: 'sink',    position: { x: 380, y: 100 }, data: { label: 'App Server 2', sub: 'localhost:3001',                      color: '#34d399' } },
      { id: 'app3',  type: 'error',   position: { x: 380, y: 180 }, data: { label: 'App Server 3', sub: 'health: FAILED',                      color: '#f87171' } },
      { id: 'db',    type: 'sink',    position: { x: 560, y: 60  }, data: { label: 'Database',      sub: 'shared pool',                        color: '#8b78d4' } },
      { id: 'metric',type: 'metric',  position: { x: 185, y: 265 }, data: { label: 'Nginx worker_processes auto. worker_connections 1024. keepalive 75s. Failed servers auto-removed.' } },
    ],
    edges: [
      { id: 'e-u1-ng', source: 'u1',    target: 'nginx', ...ae('#38bdf8') },
      { id: 'e-u2-ng', source: 'u2',    target: 'nginx', ...ae('#38bdf8') },
      { id: 'e-u3-ng', source: 'u3',    target: 'nginx', ...ae('#38bdf8') },
      { id: 'e-ng-a1', source: 'nginx', target: 'app1',  ...ae('#34d399', 'round-robin') },
      { id: 'e-ng-a2', source: 'nginx', target: 'app2',  ...ae('#34d399') },
      { id: 'e-ng-a3', source: 'nginx', target: 'app3',  ...de('#f87171', 'skipped') },
      { id: 'e-a1-db', source: 'app1',  target: 'db',    ...ae('#8b78d4') },
      { id: 'e-a2-db', source: 'app2',  target: 'db',    ...ae('#8b78d4') },
    ],
  },

  /* ── 6. CDN Explained ── */
  'cdn-explained': {
    description: 'CDN edge nodes cache content near users. Anycast DNS routes each user to the nearest PoP. Cache hits serve in single-digit milliseconds; only misses reach the origin.',
    nodes: [
      { id: 'u-tokyo',  type: 'source',  position: { x: 0,   y: 0   }, data: { label: 'User Tokyo',       sub: '~6ms to PoP',                        color: '#38bdf8' } },
      { id: 'u-berlin', type: 'source',  position: { x: 0,   y: 90  }, data: { label: 'User Berlin',      sub: '~4ms to PoP',                        color: '#38bdf8' } },
      { id: 'u-ny',     type: 'source',  position: { x: 0,   y: 180 }, data: { label: 'User New York',    sub: '~3ms to PoP',                        color: '#38bdf8' } },
      { id: 'anycast',  type: 'process', position: { x: 185, y: 90  }, data: { label: 'Anycast DNS',       sub: 'nearest PoP wins via BGP',           color: '#6272d4' } },
      { id: 'pop-ap',   type: 'process', position: { x: 370, y: 0   }, data: { label: 'Tokyo PoP',         sub: 'cache: HIT ✓ · 5ms',                 color: '#34d399' } },
      { id: 'pop-eu',   type: 'process', position: { x: 370, y: 90  }, data: { label: 'Frankfurt PoP',     sub: 'cache: HIT ✓ · 4ms',                 color: '#34d399' } },
      { id: 'pop-us',   type: 'process', position: { x: 370, y: 180 }, data: { label: 'NYC PoP',           sub: 'cache: MISS · fetching',             color: '#f59e0b' } },
      { id: 'origin',   type: 'sink',    position: { x: 555, y: 90  }, data: { label: 'Origin (Virginia)', sub: 'only cache misses · ~150ms',         color: '#f87171' } },
      { id: 'metric',   type: 'metric',  position: { x: 185, y: 265 }, data: { label: 'Netflix: 95% of traffic served from ISP-embedded caches. Origin never sees most requests.' } },
    ],
    edges: [
      { id: 'e-ut-any',  source: 'u-tokyo',  target: 'anycast', ...ae('#38bdf8') },
      { id: 'e-ub-any',  source: 'u-berlin', target: 'anycast', ...ae('#38bdf8') },
      { id: 'e-un-any',  source: 'u-ny',     target: 'anycast', ...ae('#38bdf8') },
      { id: 'e-any-ap',  source: 'anycast',  target: 'pop-ap',  ...ae('#34d399') },
      { id: 'e-any-eu',  source: 'anycast',  target: 'pop-eu',  ...ae('#34d399') },
      { id: 'e-any-us',  source: 'anycast',  target: 'pop-us',  ...ae('#f59e0b') },
      { id: 'e-us-orig', source: 'pop-us',   target: 'origin',  ...de('#f87171', 'miss → fetch') },
      { id: 'e-orig-us', source: 'origin',   target: 'pop-us',  ...de('#34d399', 'cache + serve') },
    ],
  },

  /* ── 7. Debug Network ── */
  'debug-network': {
    description: 'Systematic network debugging: test each layer from outermost to innermost. The first failing check tells you exactly which layer has the problem.',
    nodes: [
      { id: 'start', type: 'source',  position: { x: 0,   y: 130 }, data: { label: 'Site Not Loading',  sub: 'start here',              color: '#f87171' } },
      { id: 'ping',  type: 'process', position: { x: 170, y: 60  }, data: { label: 'ping host',          sub: 'L3 reachable?',           color: '#6272d4' } },
      { id: 'dns',   type: 'process', position: { x: 170, y: 140 }, data: { label: 'dig domain.com',     sub: 'DNS resolving?',          color: '#6272d4' } },
      { id: 'tcp',   type: 'process', position: { x: 170, y: 220 }, data: { label: 'nc -zv host 443',    sub: 'TCP port open?',          color: '#6272d4' } },
      { id: 'tls',   type: 'process', position: { x: 340, y: 60  }, data: { label: 'openssl s_client',   sub: 'cert valid?',             color: '#f59e0b' } },
      { id: 'proxy', type: 'process', position: { x: 340, y: 140 }, data: { label: 'curl -v https://host',sub: 'proxy responding?',     color: '#f59e0b' } },
      { id: 'app',   type: 'process', position: { x: 340, y: 220 }, data: { label: 'curl localhost:3000', sub: 'app responding?',        color: '#f59e0b' } },
      { id: 'db',    type: 'sink',    position: { x: 510, y: 140 }, data: { label: 'DB connection',       sub: 'psql / mysql connect?',  color: '#8b78d4' } },
      { id: 'fixed', type: 'sink',    position: { x: 510, y: 60  }, data: { label: 'Layer Identified',    sub: 'fix at that layer',      color: '#34d399' } },
      { id: 'metric',type: 'metric',  position: { x: 170, y: 300 }, data: { label: 'Rule: the first check that fails identifies the broken layer. Work outside-in, never assume.' } },
    ],
    edges: [
      { id: 'e-st-ping',  source: 'start', target: 'ping',  ...ae('#6272d4', 'step 1') },
      { id: 'e-st-dns',   source: 'start', target: 'dns',   ...ae('#6272d4', 'step 2') },
      { id: 'e-st-tcp',   source: 'start', target: 'tcp',   ...ae('#6272d4', 'step 3') },
      { id: 'e-ping-tls', source: 'ping',  target: 'tls',   ...ae('#f59e0b', 'pass → step 4') },
      { id: 'e-dns-prx',  source: 'dns',   target: 'proxy', ...ae('#f59e0b', 'pass → step 5') },
      { id: 'e-tcp-app',  source: 'tcp',   target: 'app',   ...ae('#f59e0b', 'pass → step 6') },
      { id: 'e-prx-db',   source: 'proxy', target: 'db',    ...ae('#8b78d4', 'pass → step 7') },
      { id: 'e-ping-fix', source: 'ping',  target: 'fixed', ...de('#34d399', 'FAIL: L3 issue') },
      { id: 'e-tls-fix',  source: 'tls',   target: 'fixed', ...de('#34d399', 'FAIL: cert issue') },
    ],
  },

  /* ── 8. OSI Layers ── */
  'osi-layers': {
    description: 'The OSI model maps every app you use to a specific layer. L7 is your code. L4 is TCP/UDP. L3 is IP routing. L2 is switches. L1 is the cable or Wi-Fi signal.',
    nodes: [
      /* real apps on left */
      { id: 'chrome',   type: 'source', position: { x: 0, y: 0   }, data: { label: 'Chrome / Slack',        sub: 'HTTP · WebSocket',          color: '#38bdf8' } },
      { id: 'tls-app',  type: 'source', position: { x: 0, y: 80  }, data: { label: 'TLS / gzip',            sub: 'encrypt · compress',        color: '#6272d4' } },
      { id: 'pg',       type: 'source', position: { x: 0, y: 160 }, data: { label: 'PostgreSQL conn',        sub: 'session management',        color: '#8b78d4' } },
      { id: 'dns-udp',  type: 'source', position: { x: 0, y: 240 }, data: { label: 'TCP port 443 / UDP 53',  sub: 'delivery guarantees',       color: '#a78bfa' } },
      { id: 'aws-vpc',  type: 'source', position: { x: 0, y: 320 }, data: { label: 'AWS VPC / BGP',          sub: 'IP routing',                color: '#f59e0b' } },
      { id: 'switch',   type: 'source', position: { x: 0, y: 400 }, data: { label: 'Ethernet Switch',        sub: 'MAC addresses',             color: '#f97316' } },
      { id: 'cable',    type: 'source', position: { x: 0, y: 480 }, data: { label: 'Cat6 / Wi-Fi / 5G',      sub: 'signals and bits',          color: '#34d399' } },
      /* layer labels in center */
      { id: 'lbl7', type: 'label', position: { x: 230, y: 0   }, data: { label: 'L7 — Application', color: '#38bdf8' } },
      { id: 'lbl6', type: 'label', position: { x: 230, y: 80  }, data: { label: 'L6 — Presentation',color: '#6272d4' } },
      { id: 'lbl5', type: 'label', position: { x: 230, y: 160 }, data: { label: 'L5 — Session',      color: '#8b78d4' } },
      { id: 'lbl4', type: 'label', position: { x: 230, y: 240 }, data: { label: 'L4 — Transport',    color: '#a78bfa' } },
      { id: 'lbl3', type: 'label', position: { x: 230, y: 320 }, data: { label: 'L3 — Network',      color: '#f59e0b' } },
      { id: 'lbl2', type: 'label', position: { x: 230, y: 400 }, data: { label: 'L2 — Data Link',    color: '#f97316' } },
      { id: 'lbl1', type: 'label', position: { x: 230, y: 480 }, data: { label: 'L1 — Physical',     color: '#34d399' } },
      /* metric */
      { id: 'metric', type: 'metric', position: { x: 230, y: 545 }, data: { label: 'AWS ALB = L7 LB (reads HTTP headers). AWS NLB = L4 LB (routes by IP+port only). iptables = L3/L4 firewall.' } },
    ],
    edges: [
      { id: 'e-chrome-l7', source: 'chrome',  target: 'lbl7', ...ae('#38bdf8') },
      { id: 'e-tls-l6',    source: 'tls-app', target: 'lbl6', ...ae('#6272d4') },
      { id: 'e-pg-l5',     source: 'pg',      target: 'lbl5', ...ae('#8b78d4') },
      { id: 'e-dns-l4',    source: 'dns-udp', target: 'lbl4', ...ae('#a78bfa') },
      { id: 'e-vpc-l3',    source: 'aws-vpc', target: 'lbl3', ...ae('#f59e0b') },
      { id: 'e-sw-l2',     source: 'switch',  target: 'lbl2', ...ae('#f97316') },
      { id: 'e-cable-l1',  source: 'cable',   target: 'lbl1', ...ae('#34d399') },
    ],
  },

  /* ── 9. Network Protocols ── */
  'network-protocols': {
    description: "Protocol choice defines your app's delivery model. TCP guarantees order and reliability. UDP trades guarantees for speed. WebSocket keeps a persistent bidirectional channel. QUIC combines UDP speed with TCP reliability.",
    nodes: [
      { id: 'app',     type: 'source',  position: { x: 0,   y: 150 }, data: { label: 'Your Application',     sub: 'choose the right protocol',        color: '#6272d4' } },
      /* protocols */
      { id: 'tcp-n',   type: 'process', position: { x: 185, y: 20  }, data: { label: 'TCP',                   sub: 'reliable · ordered · 3-way HS',   color: '#38bdf8' } },
      { id: 'udp-n',   type: 'process', position: { x: 185, y: 100 }, data: { label: 'UDP',                   sub: 'fast · no guarantee · 8B header', color: '#f59e0b' } },
      { id: 'ws-n',    type: 'process', position: { x: 185, y: 180 }, data: { label: 'WebSocket',              sub: 'persistent · bidirectional · push',color: '#a78bfa' } },
      { id: 'sio-n',   type: 'process', position: { x: 185, y: 260 }, data: { label: 'Socket.IO',              sub: 'WS + rooms + reconnect',           color: '#6272d4' } },
      { id: 'quic-n',  type: 'process', position: { x: 185, y: 340 }, data: { label: 'QUIC / HTTP3',           sub: 'UDP + reliability · 0-RTT',        color: '#34d399' } },
      /* use-cases */
      { id: 'uc-tcp',  type: 'sink',    position: { x: 390, y: 20  }, data: { label: 'APIs · DB · SSH · SMTP', sub: 'when reliability required',        color: '#38bdf8' } },
      { id: 'uc-udp',  type: 'sink',    position: { x: 390, y: 100 }, data: { label: 'DNS · Gaming · VoIP · Video', sub: 'when speed > reliability',   color: '#f59e0b' } },
      { id: 'uc-ws',   type: 'sink',    position: { x: 390, y: 180 }, data: { label: 'Slack · Figma · Live charts', sub: 'server push needed',         color: '#a78bfa' } },
      { id: 'uc-sio',  type: 'sink',    position: { x: 390, y: 260 }, data: { label: 'Chat rooms · Multiplayer',    sub: 'rooms + reconnection',        color: '#6272d4' } },
      { id: 'uc-quic', type: 'sink',    position: { x: 390, y: 340 }, data: { label: 'YouTube · Mobile APIs',       sub: 'network switching · latency', color: '#34d399' } },
      /* metric */
      { id: 'metric',  type: 'metric',  position: { x: 185, y: 410 }, data: { label: 'Always layer TLS on top: HTTPS = HTTP+TLS. WSS = WebSocket+TLS. QUIC has TLS 1.3 built in.' } },
    ],
    edges: [
      { id: 'e-app-tcp',  source: 'app',    target: 'tcp-n',  ...ae('#38bdf8') },
      { id: 'e-app-udp',  source: 'app',    target: 'udp-n',  ...ae('#f59e0b') },
      { id: 'e-app-ws',   source: 'app',    target: 'ws-n',   ...ae('#a78bfa') },
      { id: 'e-app-sio',  source: 'app',    target: 'sio-n',  ...ae('#6272d4') },
      { id: 'e-app-quic', source: 'app',    target: 'quic-n', ...ae('#34d399') },
      { id: 'e-tcp-uc',   source: 'tcp-n',  target: 'uc-tcp', ...ae('#38bdf8') },
      { id: 'e-udp-uc',   source: 'udp-n',  target: 'uc-udp', ...ae('#f59e0b') },
      { id: 'e-ws-uc',    source: 'ws-n',   target: 'uc-ws',  ...ae('#a78bfa') },
      { id: 'e-sio-uc',   source: 'sio-n',  target: 'uc-sio', ...ae('#6272d4') },
      { id: 'e-quic-uc',  source: 'quic-n', target: 'uc-quic',...ae('#34d399') },
    ],
  },

};
