import type { Node, Edge } from '@xyflow/react';

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
  description: string;
}

/* ── shared edge style helpers ─────────────────────────────────── */
const flow = (color: string, w = 1.5) => ({ stroke: color, strokeWidth: w });
const animEdge = (color: string) => ({ animated: true, style: flow(color) });
const dashedEdge = (color: string) => ({ style: { ...flow(color), strokeDasharray: '5 5' } });

/* ── DIAGRAMS ──────────────────────────────────────────────────── */

export const DIAGRAMS: Record<string, DiagramData> = {

  /* ── 1. Monolith vs Microservices ── */
  monolith: {
    description: 'Monolith: all modules share one process and DB. Microservices: each module is an independent deployable with its own DB.',
    nodes: [
      { id: 'c1', type: 'source', position: { x: 0, y: 120 }, data: { label: 'Client', sub: 'browser / mobile', color: '#38bdf8' } },
      // Monolith side
      { id: 'mono', type: 'process', position: { x: 160, y: 60 }, data: { label: 'Monolith', sub: 'auth · orders · payments · email', color: '#f59e0b', wide: true } },
      { id: 'mono-db', type: 'sink', position: { x: 160, y: 200 }, data: { label: 'Shared DB', sub: 'one schema', color: '#f59e0b' } },
      // Microservices side
      { id: 'ms-auth', type: 'process', position: { x: 420, y: 20 }, data: { label: 'Auth', sub: 'service', color: '#34d399' } },
      { id: 'ms-order', type: 'process', position: { x: 420, y: 100 }, data: { label: 'Orders', sub: 'service', color: '#34d399' } },
      { id: 'ms-pay', type: 'process', position: { x: 420, y: 180 }, data: { label: 'Payments', sub: 'service', color: '#34d399' } },
      { id: 'ms-email', type: 'process', position: { x: 420, y: 260 }, data: { label: 'Email', sub: 'service', color: '#34d399' } },
      { id: 'db-auth', type: 'sink', position: { x: 570, y: 20 }, data: { label: 'Auth DB', sub: '', color: '#34d399' } },
      { id: 'db-order', type: 'sink', position: { x: 570, y: 100 }, data: { label: 'Order DB', sub: '', color: '#34d399' } },
      { id: 'db-pay', type: 'sink', position: { x: 570, y: 180 }, data: { label: 'Pay DB', sub: '', color: '#34d399' } },
      { id: 'label-mono', type: 'label', position: { x: 140, y: 0 }, data: { label: '① Monolith', color: '#f59e0b' } },
      { id: 'label-ms', type: 'label', position: { x: 420, y: -35 }, data: { label: '② Microservices', color: '#34d399' } },
    ],
    edges: [
      { id: 'e-c-mono', source: 'c1', target: 'mono', ...animEdge('#38bdf840') },
      { id: 'e-mono-db', source: 'mono', target: 'mono-db', ...animEdge('#f59e0b60') },
      { id: 'e-c-auth', source: 'c1', target: 'ms-auth', ...animEdge('#34d39930') },
      { id: 'e-c-order', source: 'c1', target: 'ms-order', ...animEdge('#34d39930') },
      { id: 'e-auth-db', source: 'ms-auth', target: 'db-auth', ...animEdge('#34d39940') },
      { id: 'e-order-db', source: 'ms-order', target: 'db-order', ...animEdge('#34d39940') },
      { id: 'e-pay-db', source: 'ms-pay', target: 'db-pay', ...animEdge('#34d39940') },
    ],
  },

  /* ── 2. API Gateway ── */
  apigateway: {
    description: 'All clients hit one gateway. Auth, rate-limiting, and routing happen once before any service sees the request.',
    nodes: [
      { id: 'web', type: 'source', position: { x: 0, y: 20 }, data: { label: 'Web App', sub: 'browser', color: '#38bdf8' } },
      { id: 'mob', type: 'source', position: { x: 0, y: 110 }, data: { label: 'Mobile App', sub: 'iOS/Android', color: '#38bdf8' } },
      { id: 'ext', type: 'source', position: { x: 0, y: 200 }, data: { label: 'Third Party', sub: 'API client', color: '#38bdf8' } },
      { id: 'gw', type: 'process', position: { x: 200, y: 100 }, data: { label: 'API Gateway', sub: 'auth · rate-limit · route · log', color: '#a78bfa' } },
      { id: 'svc-user', type: 'sink', position: { x: 420, y: 20 }, data: { label: 'User Service', sub: '/users/*', color: '#34d399' } },
      { id: 'svc-order', type: 'sink', position: { x: 420, y: 100 }, data: { label: 'Order Service', sub: '/orders/*', color: '#34d399' } },
      { id: 'svc-pay', type: 'sink', position: { x: 420, y: 180 }, data: { label: 'Payment Service', sub: '/payments/*', color: '#34d399' } },
      { id: 'metric', type: 'metric', position: { x: 200, y: 240 }, data: { label: '100B+ req/day (Netflix Zuul)' } },
    ],
    edges: [
      { id: 'e-web', source: 'web', target: 'gw', ...animEdge('#38bdf830') },
      { id: 'e-mob', source: 'mob', target: 'gw', ...animEdge('#38bdf830') },
      { id: 'e-ext', source: 'ext', target: 'gw', ...animEdge('#38bdf830') },
      { id: 'e-gw-u', source: 'gw', target: 'svc-user', ...animEdge('#a78bfa40') },
      { id: 'e-gw-o', source: 'gw', target: 'svc-order', ...animEdge('#a78bfa40') },
      { id: 'e-gw-p', source: 'gw', target: 'svc-pay', ...animEdge('#a78bfa40') },
    ],
  },

  /* ── 3. Load Balancing ── */
  loadbalancer: {
    description: 'Incoming traffic is distributed across a healthy server pool. Failed servers are removed automatically via health checks.',
    nodes: [
      { id: 'c1', type: 'source', position: { x: 0, y: 20 },  data: { label: 'Client 1', sub: '', color: '#38bdf8' } },
      { id: 'c2', type: 'source', position: { x: 0, y: 100 }, data: { label: 'Client 2', sub: '', color: '#38bdf8' } },
      { id: 'c3', type: 'source', position: { x: 0, y: 180 }, data: { label: 'Client 3', sub: '', color: '#38bdf8' } },
      { id: 'lb', type: 'process', position: { x: 200, y: 100 }, data: { label: 'Load Balancer', sub: 'least connections', color: '#34d399' } },
      { id: 's1', type: 'sink', position: { x: 410, y: 20 },  data: { label: 'Server 1', sub: '✓ healthy', color: '#34d399' } },
      { id: 's2', type: 'sink', position: { x: 410, y: 100 }, data: { label: 'Server 2', sub: '✓ healthy', color: '#34d399' } },
      { id: 's3', type: 'error', position: { x: 410, y: 180 }, data: { label: 'Server 3', sub: '✗ unhealthy', color: '#f87171' } },
      { id: 'metric', type: 'metric', position: { x: 200, y: 250 }, data: { label: 'Health check every 5s · auto-remove failed' } },
    ],
    edges: [
      { id: 'e-c1', source: 'c1', target: 'lb', ...animEdge('#38bdf830') },
      { id: 'e-c2', source: 'c2', target: 'lb', ...animEdge('#38bdf830') },
      { id: 'e-c3', source: 'c3', target: 'lb', ...animEdge('#38bdf830') },
      { id: 'e-s1', source: 'lb', target: 's1', ...animEdge('#34d39940') },
      { id: 'e-s2', source: 'lb', target: 's2', ...animEdge('#34d39940') },
      { id: 'e-s3', source: 'lb', target: 's3', style: { stroke: '#f8717130', strokeWidth: 1.5, strokeDasharray: '5 5' } },
    ],
  },

  /* ── 4. Caching ── */
  caching: {
    description: 'App checks cache first. Cache hit → μs response. Cache miss → DB query + cache write for next time.',
    nodes: [
      { id: 'client', type: 'source', position: { x: 0, y: 100 }, data: { label: 'Client', sub: 'request', color: '#38bdf8' } },
      { id: 'app', type: 'process', position: { x: 170, y: 100 }, data: { label: 'App Server', sub: 'cache-aside', color: '#34d399' } },
      { id: 'cache', type: 'process', position: { x: 370, y: 30 }, data: { label: 'Redis Cache', sub: '~0.1ms · HIT ✓', color: '#f59e0b' } },
      { id: 'db', type: 'sink', position: { x: 370, y: 170 }, data: { label: 'Database', sub: '~10ms · MISS', color: '#a78bfa' } },
      { id: 'ttl', type: 'metric', position: { x: 370, y: 260 }, data: { label: 'TTL + jitter → prevents cache avalanche' } },
    ],
    edges: [
      { id: 'e-c-a', source: 'client', target: 'app', ...animEdge('#38bdf840') },
      { id: 'e-a-cache', source: 'app', target: 'cache', ...animEdge('#f59e0b60'), label: 'check first' },
      { id: 'e-a-db', source: 'app', target: 'db', style: { stroke: '#a78bfa30', strokeWidth: 1.5, strokeDasharray: '6 4' }, label: 'miss only' },
      { id: 'e-db-cache', source: 'db', target: 'cache', ...dashedEdge('#a78bfa30'), label: 'populate' },
    ],
  },

  /* ── 5. CDN ── */
  cdn: {
    description: 'Users hit the nearest PoP. Edge serves cached content in ~5ms. Only cache misses reach the origin.',
    nodes: [
      { id: 'u-eu', type: 'source', position: { x: 0, y: 0 },   data: { label: 'User EU', sub: 'Frankfurt', color: '#38bdf8' } },
      { id: 'u-us', type: 'source', position: { x: 0, y: 100 }, data: { label: 'User US', sub: 'New York', color: '#38bdf8' } },
      { id: 'u-ap', type: 'source', position: { x: 0, y: 200 }, data: { label: 'User APAC', sub: 'Tokyo', color: '#38bdf8' } },
      { id: 'e-eu', type: 'process', position: { x: 200, y: 0 },   data: { label: 'Edge EU', sub: '~5ms · hit', color: '#34d399' } },
      { id: 'e-us', type: 'process', position: { x: 200, y: 100 }, data: { label: 'Edge US', sub: '~5ms · hit', color: '#34d399' } },
      { id: 'e-ap', type: 'process', position: { x: 200, y: 200 }, data: { label: 'Edge APAC', sub: '~5ms · hit', color: '#34d399' } },
      { id: 'origin', type: 'sink', position: { x: 420, y: 100 }, data: { label: 'Origin Server', sub: 'Virginia · miss only', color: '#f87171' } },
      { id: 'metric', type: 'metric', position: { x: 200, y: 270 }, data: { label: 'Netflix: 95% of traffic never leaves ISP' } },
    ],
    edges: [
      { id: 'e-eu-eu', source: 'u-eu', target: 'e-eu', ...animEdge('#38bdf840') },
      { id: 'e-us-us', source: 'u-us', target: 'e-us', ...animEdge('#38bdf840') },
      { id: 'e-ap-ap', source: 'u-ap', target: 'e-ap', ...animEdge('#38bdf840') },
      { id: 'e-eu-o', source: 'e-eu', target: 'origin', ...dashedEdge('#f8717130'), label: 'miss' },
      { id: 'e-us-o', source: 'e-us', target: 'origin', ...dashedEdge('#f8717130') },
      { id: 'e-ap-o', source: 'e-ap', target: 'origin', ...dashedEdge('#f8717130'), label: 'miss' },
    ],
  },

  /* ── 6. SQL vs NoSQL ── */
  databases: {
    description: 'SQL normalizes data across tables and joins them at query time. NoSQL embeds related data in one document for fast single-read access.',
    nodes: [
      { id: 'app', type: 'source', position: { x: 0, y: 100 }, data: { label: 'Application', sub: 'query layer', color: '#38bdf8' } },
      { id: 'sql', type: 'process', position: { x: 190, y: 20 }, data: { label: 'PostgreSQL', sub: 'normalized + JOIN', color: '#34d399' } },
      { id: 'nosql', type: 'process', position: { x: 190, y: 160 }, data: { label: 'MongoDB', sub: 'embedded documents', color: '#f97316' } },
      { id: 'tbl-users', type: 'sink', position: { x: 410, y: 0 },  data: { label: 'users table', sub: 'id · name · email', color: '#34d399' } },
      { id: 'tbl-orders', type: 'sink', position: { x: 410, y: 80 }, data: { label: 'orders table', sub: 'id · user_id · total', color: '#34d399' } },
      { id: 'doc', type: 'sink', position: { x: 410, y: 180 }, data: { label: 'user document', sub: '{ orders: [...] }', color: '#f97316' } },
      { id: 'metric', type: 'metric', position: { x: 190, y: 280 }, data: { label: 'Instagram: PostgreSQL (accounts) + Cassandra (feeds)' } },
    ],
    edges: [
      { id: 'e-a-sql', source: 'app', target: 'sql', ...animEdge('#34d39940') },
      { id: 'e-a-nosql', source: 'app', target: 'nosql', ...animEdge('#f9731640') },
      { id: 'e-sql-u', source: 'sql', target: 'tbl-users', ...animEdge('#34d39930') },
      { id: 'e-sql-o', source: 'sql', target: 'tbl-orders', ...animEdge('#34d39930'), label: 'JOIN' },
      { id: 'e-nosql-d', source: 'nosql', target: 'doc', ...animEdge('#f9731640'), label: 'single read' },
    ],
  },

  /* ── 7. Database Sharding ── */
  sharding: {
    description: 'The shard router hashes the shard key to pick which physical shard stores the row. Each shard is an independent database.',
    nodes: [
      { id: 'app', type: 'source', position: { x: 0, y: 100 }, data: { label: 'Application', sub: 'write request', color: '#38bdf8' } },
      { id: 'router', type: 'process', position: { x: 180, y: 100 }, data: { label: 'Shard Router', sub: 'hash(user_id) % 3', color: '#a78bfa' } },
      { id: 'sa', type: 'sink', position: { x: 390, y: 20 }, data: { label: 'Shard A', sub: 'users 0–33%', color: '#a78bfa' } },
      { id: 'sb', type: 'sink', position: { x: 390, y: 100 }, data: { label: 'Shard B', sub: 'users 33–66%', color: '#a78bfa' } },
      { id: 'sc', type: 'sink', position: { x: 390, y: 180 }, data: { label: 'Shard C', sub: 'users 66–100%', color: '#a78bfa' } },
      { id: 'metric', type: 'metric', position: { x: 180, y: 250 }, data: { label: 'Discord: guild_id as shard key → even distribution' } },
    ],
    edges: [
      { id: 'e-a-r', source: 'app', target: 'router', ...animEdge('#38bdf840') },
      { id: 'e-r-a', source: 'router', target: 'sa', ...animEdge('#a78bfa50') },
      { id: 'e-r-b', source: 'router', target: 'sb', ...animEdge('#a78bfa50') },
      { id: 'e-r-c', source: 'router', target: 'sc', ...animEdge('#a78bfa50') },
    ],
  },

  /* ── 8. Message Queue ── */
  messagequeue: {
    description: 'Producer fires and forgets. The broker buffers messages. Multiple independent consumers process at their own pace with retry and DLQ.',
    nodes: [
      { id: 'prod', type: 'source', position: { x: 0, y: 100 }, data: { label: 'Producer', sub: 'Order Service', color: '#38bdf8' } },
      { id: 'broker', type: 'process', position: { x: 185, y: 100 }, data: { label: 'Message Broker', sub: 'queue / topic', color: '#fbbf24' } },
      { id: 'c1', type: 'sink', position: { x: 390, y: 30 }, data: { label: 'Consumer A', sub: 'Email Service', color: '#34d399' } },
      { id: 'c2', type: 'sink', position: { x: 390, y: 110 }, data: { label: 'Consumer B', sub: 'Analytics', color: '#34d399' } },
      { id: 'dlq', type: 'error', position: { x: 390, y: 200 }, data: { label: 'Dead Letter Q', sub: 'failed after 3 retries', color: '#f87171' } },
      { id: 'metric', type: 'metric', position: { x: 185, y: 250 }, data: { label: 'Stripe: 72-hour retry window on webhook queue' } },
    ],
    edges: [
      { id: 'e-p-b', source: 'prod', target: 'broker', animated: true, style: flow('#fbbf2450') },
      { id: 'e-b-c1', source: 'broker', target: 'c1', animated: true, style: flow('#34d39940') },
      { id: 'e-b-c2', source: 'broker', target: 'c2', animated: true, style: flow('#34d39940') },
      { id: 'e-b-dlq', source: 'broker', target: 'dlq', style: { stroke: '#f8717135', strokeWidth: 1.5, strokeDasharray: '5 5' } },
    ],
  },

  /* ── 9. Rate Limiting ── */
  ratelimit: {
    description: 'Every request is counted in Redis. Requests within the limit are allowed; those over it get an immediate 429 before touching any service.',
    nodes: [
      { id: 'r1', type: 'source', position: { x: 0, y: 10 },  data: { label: 'Request 1', sub: 'within limit', color: '#34d399' } },
      { id: 'r2', type: 'source', position: { x: 0, y: 90 },  data: { label: 'Request 2', sub: 'within limit', color: '#34d399' } },
      { id: 'r3', type: 'source', position: { x: 0, y: 170 }, data: { label: 'Request 3', sub: 'over limit', color: '#f87171' } },
      { id: 'rl', type: 'process', position: { x: 195, y: 90 }, data: { label: 'Rate Limiter', sub: 'Redis INCR + TTL', color: '#f59e0b' } },
      { id: 'svc', type: 'sink', position: { x: 400, y: 10 }, data: { label: 'API Service', sub: '200 OK', color: '#34d399' } },
      { id: 'rej', type: 'error', position: { x: 400, y: 160 }, data: { label: '429 Too Many', sub: 'Retry-After header', color: '#f87171' } },
      { id: 'metric', type: 'metric', position: { x: 195, y: 260 }, data: { label: 'OpenAI: 60 RPM + 90K TPM dual limits per key' } },
    ],
    edges: [
      { id: 'e-r1', source: 'r1', target: 'rl', ...animEdge('#34d39940') },
      { id: 'e-r2', source: 'r2', target: 'rl', ...animEdge('#34d39940') },
      { id: 'e-r3', source: 'r3', target: 'rl', ...animEdge('#f8717150') },
      { id: 'e-allow', source: 'rl', target: 'svc', ...animEdge('#34d39950'), label: 'allow' },
      { id: 'e-reject', source: 'rl', target: 'rej', style: { stroke: '#f8717140', strokeWidth: 1.5 }, label: 'reject' },
    ],
  },

  /* ── 10. CAP Theorem ── */
  cap: {
    description: 'During a network partition you must choose: keep all nodes consistent (CP) or keep all nodes available (AP).',
    nodes: [
      { id: 'client', type: 'source', position: { x: 0, y: 110 }, data: { label: 'Client', sub: 'write request', color: '#38bdf8' } },
      { id: 'part', type: 'error', position: { x: 185, y: 110 }, data: { label: 'Network Partition', sub: '⚡ network split', color: '#f87171' } },
      { id: 'cp', type: 'process', position: { x: 400, y: 30 }, data: { label: 'CP System', sub: 'etcd · ZooKeeper', color: '#a78bfa' } },
      { id: 'ap', type: 'process', position: { x: 400, y: 190 }, data: { label: 'AP System', sub: 'DynamoDB · Cassandra', color: '#34d399' } },
      { id: 'cp-r', type: 'sink', position: { x: 590, y: 30 }, data: { label: 'Reject Write', sub: 'error → stay consistent', color: '#a78bfa' } },
      { id: 'ap-r', type: 'sink', position: { x: 590, y: 190 }, data: { label: 'Accept Write', sub: 'stale reads → stay available', color: '#34d399' } },
      { id: 'metric', type: 'metric', position: { x: 185, y: 270 }, data: { label: 'You always have P — the choice is C vs A' } },
    ],
    edges: [
      { id: 'e-c-p', source: 'client', target: 'part', ...animEdge('#38bdf840') },
      { id: 'e-p-cp', source: 'part', target: 'cp', style: { stroke: '#a78bfa40', strokeWidth: 1.5 }, label: 'choose C' },
      { id: 'e-p-ap', source: 'part', target: 'ap', style: { stroke: '#34d39940', strokeWidth: 1.5 }, label: 'choose A' },
      { id: 'e-cp-r', source: 'cp', target: 'cp-r', ...animEdge('#a78bfa40') },
      { id: 'e-ap-r', source: 'ap', target: 'ap-r', ...animEdge('#34d39940') },
    ],
  },

  /* ── 11. Circuit Breaker ── */
  circuit: {
    description: 'The circuit breaker tracks failures. Too many failures open the circuit; requests hit the fallback instantly. After a timeout, it probes with one request (half-open).',
    nodes: [
      { id: 'svc-a', type: 'source', position: { x: 0, y: 110 }, data: { label: 'Service A', sub: 'caller', color: '#38bdf8' } },
      { id: 'cb', type: 'process', position: { x: 185, y: 110 }, data: { label: 'Circuit Breaker', sub: 'CLOSED → OPEN → HALF-OPEN', color: '#f87171' } },
      { id: 'svc-b', type: 'sink', position: { x: 400, y: 50 }, data: { label: 'Service B', sub: 'downstream', color: '#34d399' } },
      { id: 'fallback', type: 'sink', position: { x: 400, y: 170 }, data: { label: 'Fallback', sub: 'cached / default response', color: '#f59e0b' } },
      { id: 'metric', type: 'metric', position: { x: 185, y: 270 }, data: { label: 'Netflix: "Popular in your country" when recommendation fails' } },
    ],
    edges: [
      { id: 'e-a-cb', source: 'svc-a', target: 'cb', ...animEdge('#38bdf840') },
      { id: 'e-cb-b', source: 'cb', target: 'svc-b', ...animEdge('#34d39950'), label: 'CLOSED' },
      { id: 'e-cb-fb', source: 'cb', target: 'fallback', style: { stroke: '#f59e0b50', strokeWidth: 1.5, strokeDasharray: '5 5' }, label: 'OPEN' },
    ],
  },

  /* ── 12. Kafka ── */
  kafka: {
    description: 'Producers append to partitions. Each consumer group independently reads all partitions. Offsets are committed per consumer group.',
    nodes: [
      { id: 'prod', type: 'source', position: { x: 0, y: 110 }, data: { label: 'Producer', sub: 'batch + acks=all', color: '#16a34a' } },
      { id: 'p0', type: 'process', position: { x: 190, y: 20 }, data: { label: 'Partition 0', sub: 'leader + 2 replicas', color: '#16a34a' } },
      { id: 'p1', type: 'process', position: { x: 190, y: 110 }, data: { label: 'Partition 1', sub: 'leader + 2 replicas', color: '#16a34a' } },
      { id: 'p2', type: 'process', position: { x: 190, y: 200 }, data: { label: 'Partition 2', sub: 'leader + 2 replicas', color: '#16a34a' } },
      { id: 'cga', type: 'sink', position: { x: 390, y: 60 }, data: { label: 'Consumer Grp A', sub: 'Notifications · offset tracked', color: '#38bdf8' } },
      { id: 'cgb', type: 'sink', position: { x: 390, y: 170 }, data: { label: 'Consumer Grp B', sub: 'Analytics · own offset', color: '#a78bfa' } },
      { id: 'metric', type: 'metric', position: { x: 190, y: 290 }, data: { label: 'LinkedIn: 7 trillion messages/day · retention: 7 days' } },
    ],
    edges: [
      { id: 'e-p-p0', source: 'prod', target: 'p0', ...animEdge('#16a34a50') },
      { id: 'e-p-p1', source: 'prod', target: 'p1', ...animEdge('#16a34a50') },
      { id: 'e-p-p2', source: 'prod', target: 'p2', ...animEdge('#16a34a50') },
      { id: 'e-p0-a', source: 'p0', target: 'cga', ...animEdge('#38bdf840') },
      { id: 'e-p1-a', source: 'p1', target: 'cga', ...animEdge('#38bdf840') },
      { id: 'e-p1-b', source: 'p1', target: 'cgb', ...animEdge('#a78bfa40') },
      { id: 'e-p2-b', source: 'p2', target: 'cgb', ...animEdge('#a78bfa40') },
    ],
  },

  /* ── 13. RabbitMQ ── */
  rabbitmq: {
    description: 'Publisher sends to exchange. Exchange routes to queues based on routing key bindings. Each queue has independent consumers and a DLX for failures.',
    nodes: [
      { id: 'pub', type: 'source', position: { x: 0, y: 110 }, data: { label: 'Publisher', sub: 'routing key: "order.eu"', color: '#f97316' } },
      { id: 'exc', type: 'process', position: { x: 185, y: 110 }, data: { label: 'Topic Exchange', sub: 'routing key matching', color: '#f97316' } },
      { id: 'q1', type: 'process', position: { x: 380, y: 20 }, data: { label: 'EU Orders Q', sub: 'binding: order.eu.*', color: '#f97316' } },
      { id: 'q2', type: 'process', position: { x: 380, y: 110 }, data: { label: 'All Orders Q', sub: 'binding: order.#', color: '#f97316' } },
      { id: 'dlq', type: 'error', position: { x: 380, y: 200 }, data: { label: 'Dead Letter Q', sub: 'failed after 3x', color: '#f87171' } },
      { id: 'con1', type: 'sink', position: { x: 570, y: 20 }, data: { label: 'EU Fulfillment', sub: 'consumer', color: '#34d399' } },
      { id: 'con2', type: 'sink', position: { x: 570, y: 110 }, data: { label: 'Analytics', sub: 'consumer', color: '#34d399' } },
      { id: 'metric', type: 'metric', position: { x: 185, y: 290 }, data: { label: 'Instagram: notification routing via topic exchange' } },
    ],
    edges: [
      { id: 'e-p-e', source: 'pub', target: 'exc', ...animEdge('#f9731650') },
      { id: 'e-e-q1', source: 'exc', target: 'q1', ...animEdge('#f9731640'), label: 'match' },
      { id: 'e-e-q2', source: 'exc', target: 'q2', ...animEdge('#f9731440'), label: 'match' },
      { id: 'e-q1-c1', source: 'q1', target: 'con1', ...animEdge('#34d39940') },
      { id: 'e-q2-c2', source: 'q2', target: 'con2', ...animEdge('#34d39940') },
      { id: 'e-q1-dlq', source: 'q1', target: 'dlq', ...dashedEdge('#f8717135') },
    ],
  },

  /* ── 14. BullMQ ── */
  bullmq: {
    description: 'API adds jobs to the queue with priority levels. Workers pull jobs and process them. Failures retry with backoff; exhausted jobs go to the Dead Letter Queue.',
    nodes: [
      { id: 'api', type: 'source', position: { x: 0, y: 110 }, data: { label: 'API Server', sub: 'add job to queue', color: '#ef4444' } },
      { id: 'queue', type: 'process', position: { x: 185, y: 110 }, data: { label: 'BullMQ Queue', sub: 'p1·p2·p3 · Redis', color: '#ef4444' } },
      { id: 'w1', type: 'sink', position: { x: 390, y: 20 }, data: { label: 'Worker 1', sub: 'concurrency: 5', color: '#34d399' } },
      { id: 'w2', type: 'sink', position: { x: 390, y: 100 }, data: { label: 'Worker 2', sub: 'concurrency: 5', color: '#34d399' } },
      { id: 'retry', type: 'process', position: { x: 390, y: 185 }, data: { label: 'Retry', sub: 'exponential backoff', color: '#f59e0b' } },
      { id: 'dlq', type: 'error', position: { x: 390, y: 265 }, data: { label: 'Dead Letter Q', sub: 'exhausted · inspect', color: '#f87171' } },
      { id: 'metric', type: 'metric', position: { x: 185, y: 320 }, data: { label: 'Vercel: build pipeline runs on BullMQ workers' } },
    ],
    edges: [
      { id: 'e-a-q', source: 'api', target: 'queue', ...animEdge('#ef444440') },
      { id: 'e-q-w1', source: 'queue', target: 'w1', ...animEdge('#34d39940') },
      { id: 'e-q-w2', source: 'queue', target: 'w2', ...animEdge('#34d39940') },
      { id: 'e-w1-retry', source: 'w1', target: 'retry', ...dashedEdge('#f59e0b40'), label: 'fail' },
      { id: 'e-retry-q', source: 'retry', target: 'queue', ...dashedEdge('#f59e0b30'), label: 'requeue' },
      { id: 'e-retry-dlq', source: 'retry', target: 'dlq', style: { stroke: '#f8717135', strokeWidth: 1.5, strokeDasharray: '5 5' }, label: '3x' },
    ],
  },

  /* ── 15. Queue Patterns ── */
  queuepatterns: {
    description: 'Outbox Pattern: write business data and the event in the same DB transaction. A relay process publishes atomically — no dual-write inconsistency.',
    nodes: [
      { id: 'app', type: 'source', position: { x: 0, y: 110 }, data: { label: 'Application', sub: 'create order', color: '#8b5cf6' } },
      { id: 'tx', type: 'process', position: { x: 185, y: 60 }, data: { label: 'DB Transaction', sub: 'ATOMIC', color: '#8b5cf6' } },
      { id: 'orders', type: 'sink', position: { x: 390, y: 20 }, data: { label: 'orders table', sub: 'business data', color: '#34d399' } },
      { id: 'outbox', type: 'sink', position: { x: 390, y: 100 }, data: { label: 'outbox table', sub: 'event record', color: '#8b5cf6' } },
      { id: 'relay', type: 'process', position: { x: 390, y: 200 }, data: { label: 'Relay Process', sub: 'polls outbox · CDC', color: '#8b5cf6' } },
      { id: 'queue', type: 'process', position: { x: 570, y: 200 }, data: { label: 'Message Queue', sub: 'Kafka / RabbitMQ', color: '#fbbf24' } },
      { id: 'cons', type: 'sink', position: { x: 750, y: 200 }, data: { label: 'Consumer', sub: 'idempotent · dedup', color: '#34d399' } },
      { id: 'metric', type: 'metric', position: { x: 185, y: 310 }, data: { label: 'Stripe: Outbox pattern for guaranteed payment event delivery' } },
    ],
    edges: [
      { id: 'e-a-tx', source: 'app', target: 'tx', ...animEdge('#8b5cf640') },
      { id: 'e-tx-o', source: 'tx', target: 'orders', ...animEdge('#34d39940') },
      { id: 'e-tx-out', source: 'tx', target: 'outbox', ...animEdge('#8b5cf650') },
      { id: 'e-out-relay', source: 'outbox', target: 'relay', ...dashedEdge('#8b5cf640'), label: 'poll' },
      { id: 'e-relay-q', source: 'relay', target: 'queue', ...animEdge('#fbbf2450'), label: 'publish' },
      { id: 'e-q-c', source: 'queue', target: 'cons', ...animEdge('#34d39940') },
    ],
  },
};
