import { Concept } from '../types';

export const CONCEPTS_PART1: Concept[] = [
  // ─────────────────────────────────────────────────────────────────
  // 1. MONOLITH VS MICROSERVICES
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'monolith',
    cat: 'foundation',
    color: '#38bdf8',
    icon: '🏛️',
    title: 'Monolith vs Microservices',
    tag: 'One restaurant or a food court?',
    overview:
      'A monolith ships as one deployable unit where every feature shares the same process and database — simple to start, but one slow module can drag down the whole system. Microservices split that into independent, separately deployable services that communicate over APIs, unlocking per-service scaling at the cost of distributed-systems complexity.',
    components: [
      {
        name: 'Monolith Core',
        icon: '🏛️',
        role: 'Single process housing all application logic.',
        detail:
          'All modules (auth, orders, payments, notifications) run in the same process and share the same in-process memory. A single git repo and a single deploy pipeline — great for small teams, lethal for large ones.',
      },
      {
        name: 'Shared Database',
        icon: '🗄️',
        role: 'One database schema owned by every module.',
        detail:
          'The entire application writes to the same tables. Schema changes must be coordinated across every feature team, and a poorly-written query in one feature can lock rows used by another — the most common source of production incidents in mature monoliths.',
      },
      {
        name: 'Service Boundary',
        icon: '✂️',
        role: 'The seam where a microservice is extracted.',
        detail:
          'A service boundary is drawn around a bounded context — a domain that has cohesive data and behavior that rarely needs to join with other domains. Getting boundaries wrong is the #1 mistake in microservices migrations; it leads to chattier inter-service calls than the original function calls.',
      },
      {
        name: 'API Contract',
        icon: '📄',
        role: 'The explicit interface between services.',
        detail:
          'Where a monolith uses in-process function calls, microservices communicate via HTTP/REST, gRPC, or async messages. The API contract must be versioned and backward-compatible — breaking it silently crashes callers in other repositories.',
      },
      {
        name: 'Service Registry',
        icon: '📋',
        role: 'Tracks where each service instance is running.',
        detail:
          'In dynamic cloud environments, service IPs change constantly. A registry (Consul, Kubernetes DNS, AWS Cloud Map) lets services discover each other by name rather than hardcoded IPs.',
      },
      {
        name: 'Distributed Tracing',
        icon: '🔍',
        role: 'Follows a request across multiple service hops.',
        detail:
          'A single user action in a microservices system may touch 15 services. Tracing tools (Jaeger, Zipkin, Datadog APM) propagate a correlation ID through every hop so you can reconstruct the full timeline of a slow or failed request.',
      },
    ],
    howItWorks:
      'A monolith starts with a single web server receiving all requests and handling them in-process: an HTTP handler calls auth logic, then business logic, then writes to a shared database — all in one thread. When a module needs more resources, the entire application must be scaled horizontally, even if only one feature is under load. Microservices replace that with network calls: each service owns its database and exposes an API, so the Order Service talks to Payment Service over HTTP or gRPC. Operational complexity jumps immediately — you now need service discovery, distributed tracing, and circuit breakers — which is why most teams should start with a well-structured modular monolith.',
    decision: {
      choose: [
        'Building a new product or prototype — iteration speed is paramount',
        'Team is fewer than ~15 engineers sharing the same codebase comfortably',
        'Unsure about domain boundaries — better to find them in a monolith than get them wrong upfront in services',
        'Consider microservices when teams >30 engineers are constantly blocking each other',
        'Consider microservices when one module needs 100× more compute than another',
      ],
      avoid: [
        'Microservices with a team of 5 — the ops overhead exceeds the benefit',
        'Splitting before you understand your domain model — you will draw the wrong boundaries',
        'Service-per-function — this is nanoservices anti-pattern, worse than a monolith',
        'Monolith when compliance requires isolated data residency per tenant or region',
      ],
      vs: [
        { name: 'Modular Monolith', when: 'Best of both worlds for <30 engineers: clean internal module boundaries in one deployable. Shopify ran this model to $5B revenue.' },
        { name: 'Serverless Functions', when: 'Even finer-grained than microservices. Use when you have extremely spiky, infrequent workloads and want zero infra management.' },
        { name: 'Service Mesh', when: 'Complement to microservices, not an alternative. A mesh (Istio, Linkerd) handles mTLS, observability, and traffic policies between services.' },
      ],
    },
    failures: [
      {
        name: 'The Distributed Monolith',
        cause: 'Splitting a monolith along technical layers (controllers, services, repos) rather than business domains, resulting in services that must call each other synchronously for every user action.',
        symptom: 'A single checkout request fans out to 12 synchronous service calls — slower than the original monolith. One service going down cascades immediately.',
        fix: 'Identify bounded contexts first. Use async messaging (events) over synchronous HTTP between services so each service can operate independently.',
        severity: 'critical',
      },
      {
        name: 'Shared Database Between Services',
        cause: 'Services share tables directly as a migration shortcut, bypassing service APIs.',
        symptom: 'Schema changes in one service break another. Ownership of data is unclear. Impossible to deploy services independently.',
        fix: 'Each service must own its data exclusively. Shared data access must go through the owning service\'s API or a read-model built specifically for consumers.',
        severity: 'critical',
      },
      {
        name: 'Wrong Service Boundaries',
        cause: 'Services split too fine (one per function) or at the wrong seam, creating a "chatty" call graph requiring 5 service hops for a single user action.',
        symptom: 'p99 latency triples after migration. Developers make coordinated deploys across 4 repos to ship one feature.',
        fix: 'Merge over-split services. A good service should be able to complete most user flows with 0-1 inter-service calls, not 10.',
        severity: 'high',
      },
      {
        name: 'No Tracing or Correlation IDs',
        cause: 'Services log independently without propagating a request ID through headers.',
        symptom: 'An error in Service C is impossible to correlate with the user action in Service A. Debugging takes hours of log correlation.',
        fix: 'Instrument every service with OpenTelemetry. Propagate trace-id and span-id in all HTTP and message headers from the very first service call.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏛️ → 🏘️',
      t: 'The Restaurant Analogy',
      tx: "Imagine a restaurant where one team does everything — cooking, serving, cashier, cleaning. That's a MONOLITH. Simple and fast to start.\n\nAs you grow, the kitchen slows everything. If the chef is sick, the whole restaurant stops.\n\nNow imagine a FOOD COURT — separate stalls each doing one thing brilliantly. Italian stall, Sushi stall, Burger stall. Each can grow independently. One fire doesn't burn the others.\n\nThat's MICROSERVICES.",
      s: 'Start with a monolith, split into microservices ONLY when you hit real pain. Most startups that jump to microservices regret it. Netflix took 7 years to fully migrate.',
    },
    te: {
      def: 'A monolith is a single deployable unit — all features share one codebase and database. Microservices split functionality into independent services communicating via APIs.',
      types: [
        { n: 'Monolith', d: 'Single codebase + DB. Fast to start. One bug can take down everything.' },
        { n: 'Microservices', d: 'Independent services per domain. Each scales separately. Complex to operate.' },
        { n: 'Modular Monolith', d: 'Single deployment with clean internal boundaries. Best of both worlds early on.' },
      ],
      when: "Start with monolith. Consider microservices when team >30 engineers, different scaling needs per module, or teams stepping on each other's code.",
      trade: 'Monolith: simple, fast, easy debug. Microservices: scale, independence — but adds network latency, distributed tracing, data consistency challenges.',
      code: `// Monolith — all in one express app
app.post('/order', auth, inventoryCheck, processPayment, sendEmail);

// Microservices — each step is its own service
OrderService → AuthService      (HTTP/gRPC sync)
OrderService → InventoryService (HTTP sync)
OrderService → PaymentService   (async queue)
OrderService → EmailService     (async queue)`,
      rw: {
        ex: ['Amazon (monolith→micro)', 'Netflix (7yr migration)', 'Shopify (modular monolith)'],
        cs: 'Amazon started as a monolith. In 2002, Bezos mandated all teams expose data via APIs only — no shortcuts. This forced service boundaries and accidentally created the foundation for AWS.',
      },
    },
    interview: {
      q: 'When would you choose microservices over a monolith?',
      a: "I'd start with a <strong>monolith for any new product</strong> — faster to build, easier to debug, cheaper to run. I'd consider splitting when we have clear domain boundaries, independent scaling needs, or multiple teams blocking each other. Key signals: different scaling requirements per module, team above ~30 engineers, or release cycles are truly independent. Most importantly: I'd avoid \"microservices-first\" thinking — premature splitting is an expensive mistake.",
      fu: ['How do microservices communicate?', 'How do you handle distributed transactions?', 'What is service discovery?', 'How do you debug across 20 services?'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. API GATEWAY
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'apigateway',
    cat: 'foundation',
    color: '#38bdf8',
    icon: '🚪',
    title: 'API Gateway',
    tag: 'The single front door to your entire system',
    overview:
      'An API Gateway is a reverse proxy that sits in front of all backend services and handles cross-cutting concerns — authentication, rate limiting, SSL termination, routing, and observability — in one place. Without it, every microservice must re-implement these independently, creating a maintenance and security nightmare.',
    components: [
      {
        name: 'Request Router',
        icon: '🗺️',
        role: 'Maps incoming URL paths to the correct backend service.',
        detail:
          'The router matches the path prefix or full path pattern against a routing table and forwards to the appropriate upstream. Modern gateways (Kong, AWS API Gateway) support dynamic routing by header, query param, or JWT claim — enabling A/B tests and canary releases without code changes.',
      },
      {
        name: 'Auth Middleware',
        icon: '🔐',
        role: 'Validates identity tokens before any backend service sees the request.',
        detail:
          'The gateway validates JWT signatures or calls an auth service once per request, attaches the user identity to forwarded headers, and rejects invalid requests at the edge. This eliminates duplicated auth code in every microservice.',
      },
      {
        name: 'Rate Limiter',
        icon: '🚦',
        role: 'Throttles requests per client to protect backend services from overload.',
        detail:
          'Counters (usually in Redis) track requests per API key or IP per time window. When a limit is hit, the gateway returns 429 immediately without touching the backend. This protects against both accidental loops and deliberate abuse.',
      },
      {
        name: 'SSL Terminator',
        icon: '🔒',
        role: 'Handles TLS encryption/decryption at the edge.',
        detail:
          'The gateway terminates HTTPS connections and forwards plain HTTP internally, so backend services need no TLS configuration. Certificate management, renewal, and cipher negotiation happen in one place.',
      },
      {
        name: 'Response Cache',
        icon: '⚡',
        role: 'Returns cached responses for identical repeated requests without hitting the backend.',
        detail:
          'Cacheable GET responses are stored by cache key (path + query + relevant headers). The gateway serves them directly on cache hit, dramatically reducing backend load for read-heavy endpoints.',
      },
      {
        name: 'Observability Layer',
        icon: '📊',
        role: 'Emits unified metrics, logs, and traces for every API call.',
        detail:
          'Every request flowing through the gateway is logged with method, path, status code, latency, upstream name, and client ID. This gives a consistent, service-agnostic view of system health that is impossible to get from individual service logs alone.',
      },
    ],
    howItWorks:
      'A client sends an HTTPS request to the gateway\'s public hostname. The gateway decrypts TLS, checks the auth token (either validating a JWT locally or calling an auth service), applies rate limiting by counting against a Redis counter, then routes the request to the correct backend service based on path. The backend processes the request and responds; the gateway optionally caches the response, logs the full request/response metadata, and returns the result to the client. From the client\'s perspective it is talking to one server — in reality it might be reaching any of dozens of services behind it.',
    decision: {
      choose: [
        'Any microservices architecture — consolidates cross-cutting concerns in one place',
        'Public-facing APIs requiring auth, rate limiting, and versioning',
        'Multi-client scenarios (web, mobile, third-party) needing different response shapes (BFF pattern)',
        'When you want centralized observability across all services without instrumenting each one',
      ],
      avoid: [
        'Single-service systems where the overhead outweighs the benefits',
        'Real-time bidirectional protocols (WebSockets, gRPC streaming) — gateways add latency on long-lived connections',
        'Routing business logic through the gateway — keep it infrastructure-only or it becomes a bottleneck',
      ],
      vs: [
        { name: 'Load Balancer', when: 'LB distributes traffic to identical instances of one service. A gateway routes across different services and handles auth/rate-limiting. Use both: LB behind the gateway for each service cluster.' },
        { name: 'Service Mesh', when: 'Mesh (Istio, Linkerd) handles east-west traffic between services (mTLS, retries). Gateway handles north-south (external clients → system). Complementary, not competing.' },
        { name: 'BFF', when: 'Backend-for-Frontend is a pattern where each client type (web, mobile) gets its own gateway with a tailored API. BFF is built on top of a shared gateway, not instead of it.' },
      ],
    },
    failures: [
      {
        name: 'Gateway as Single Point of Failure',
        cause: 'Running one gateway instance with no redundancy.',
        symptom: 'When the gateway crashes or deploys, every API call fails — even though all backend services are healthy.',
        fix: 'Run at least 2 gateway instances behind a cloud load balancer. Use health checks with sub-second intervals. Gateways must be stateless (auth state in Redis, not in-process).',
        severity: 'critical',
      },
      {
        name: 'Business Logic Leaking into the Gateway',
        cause: 'Teams add if/else routing logic, data transformations, and business rules directly in gateway configuration.',
        symptom: 'The gateway config becomes thousands of lines. Changes require gateway deploys even for business-logic fixes. Testing is impossible.',
        fix: 'The gateway is infrastructure. It should know HOW to route, not WHY. Move business logic into services or a dedicated BFF layer.',
        severity: 'high',
      },
      {
        name: 'Auth Bypass via Direct Service Access',
        cause: 'Backend services are reachable directly via their internal IPs, bypassing the gateway.',
        symptom: 'An attacker or misconfigured internal service hits the API without going through auth.',
        fix: 'Backend services must only accept traffic from the gateway\'s IP range using firewall rules or network policies. Services should treat the gateway-injected identity headers as the source of truth.',
        severity: 'critical',
      },
    ],
    a: {
      v: '🏨',
      t: 'The Hotel Concierge',
      tx: "Imagine a 5-star hotel. You don't walk directly into the kitchen, laundry, spa, or accounts. You walk up to the CONCIERGE. They direct your request to the right person and verify you're a guest.\n\nAn API Gateway is your system's concierge. All client requests arrive at ONE door. The gateway handles authentication, routing, rate limiting, logging — then forwards to the right service.",
      s: 'Without a gateway, every microservice implements auth, rate limiting, and logging separately. The gateway solves this once for ALL services — a massive win.',
    },
    te: {
      def: 'An API Gateway is a reverse proxy that handles cross-cutting concerns: auth, SSL termination, rate limiting, routing, caching, and observability — for all your backend services.',
      types: [
        { n: 'Request Routing', d: '/users/* → UserService, /payments/* → PaymentService' },
        { n: 'Auth & AuthZ', d: 'Validates JWT tokens once — before any service call' },
        { n: 'Rate Limiting', d: 'Throttles requests per client before hitting services' },
        { n: 'Response Caching', d: 'Returns cached responses for identical repeated requests' },
      ],
      when: 'Any microservices architecture. Also valuable in monoliths as an edge layer for auth and rate limiting.',
      trade: 'Pro: single place for cross-cutting concerns, client simplicity. Con: potential single point of failure (must be HA), one extra network hop.',
      code: `// Without Gateway: each service duplicates logic
UserService:    validateToken() // repeated
PaymentService: validateToken() // repeated

// With Gateway: handled once for everyone
Client → API Gateway (auth✓ rateLimit✓ route✓)
            ↳ UserService    (pure business logic)
            ↳ PaymentService (pure business logic)`,
      rw: {
        ex: ['AWS API Gateway', 'Kong', 'Netflix Zuul', 'Nginx'],
        cs: "Netflix's Zuul handles 100B+ API requests per day. It manages auth, routing, A/B test traffic splitting, and canary deployments — all in one layer before traffic hits any downstream service.",
      },
    },
    interview: {
      q: 'What does an API Gateway do and why is it important?',
      a: 'An API Gateway is a <strong>single entry point</strong> handling cross-cutting concerns for all services. Instead of every microservice implementing auth, rate limiting, and logging independently, the gateway handles these once. It routes to the right service, validates tokens, throttles abusive clients, and caches responses. Main risk: it becomes a single point of failure — must be deployed with high availability and multiple instances behind its own load balancer.',
      fu: ['How is a gateway different from a load balancer?', 'What is BFF (Backend for Frontend)?', 'How would you handle gateway downtime?'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. LOAD BALANCING
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'loadbalancer',
    cat: 'performance',
    color: '#34d399',
    icon: '⚖️',
    title: 'Load Balancing',
    tag: 'Traffic cop that prevents server overwhelm',
    overview:
      'A load balancer distributes incoming requests across a pool of servers so no single instance is overwhelmed, eliminating single points of failure and enabling horizontal scaling. It continuously health-checks backend servers and automatically removes unhealthy ones from the rotation without manual intervention.',
    components: [
      {
        name: 'Health Checker',
        icon: '❤️',
        role: 'Continuously tests backend server liveness.',
        detail:
          'Every few seconds the load balancer sends a probe (HTTP GET /health or TCP connect) to each server. Servers that fail N consecutive checks are removed from the pool. Servers that recover are automatically readmitted — no human intervention needed.',
      },
      {
        name: 'Routing Algorithm',
        icon: '🧮',
        role: 'Decides which server handles each incoming request.',
        detail:
          'Common algorithms: Round Robin (rotate in order), Least Connections (send to server with fewest active connections — best for variable request duration), IP Hash (same client always hits same server), and Weighted Round Robin (send proportionally more traffic to higher-capacity nodes).',
      },
      {
        name: 'Connection Pool',
        icon: '🔗',
        role: 'Maintains persistent upstream connections for reuse.',
        detail:
          'Opening a new TCP connection per request wastes ~100ms on handshake. The load balancer keeps a pool of keep-alive connections to each backend and reuses them, reducing latency and backend CPU significantly.',
      },
      {
        name: 'Session Persistence',
        icon: '📌',
        role: 'Ensures a client always reaches the same backend during a session.',
        detail:
          'Also called "sticky sessions." Implemented via a cookie containing the server ID or consistent IP hashing. Required when application state is stored in server memory rather than a shared store (the latter being the better architectural choice).',
      },
      {
        name: 'TLS Terminator',
        icon: '🔒',
        role: 'Handles SSL/TLS decryption at the load balancer layer.',
        detail:
          'Layer 7 load balancers terminate TLS and forward plain HTTP to backends, reducing backend CPU and centralizing certificate management. Layer 4 load balancers pass encrypted TCP streams through to backends (TLS passthrough).',
      },
    ],
    howItWorks:
      'A client\'s TCP connection lands on the load balancer, which inspects the request (at Layer 7) or just the TCP header (at Layer 4). It selects a healthy backend using the configured algorithm, forwards the request using a pooled connection, and returns the response to the client. The client never sees backend IPs — from its perspective there is one server. When a backend is taken offline for a deploy, the load balancer drains its connections (stops sending new requests while finishing in-flight ones), so users experience zero downtime.',
    decision: {
      choose: [
        'Any service receiving more traffic than one server can handle',
        'Zero-downtime deploys — drain one server at a time while others serve traffic',
        'High availability — automatically removes crashed servers from pool',
        'Horizontal scaling — add servers dynamically during traffic spikes',
      ],
      avoid: [
        'Very low traffic single-server systems where the overhead is unnecessary',
        'Replacing a proper shared session store with sticky sessions — sticky sessions are a workaround, not a solution',
        'Using IP hash for sessions in NAT environments — entire offices may share one IP',
      ],
      vs: [
        { name: 'API Gateway', when: 'Gateway handles auth, routing to different services, rate limiting. Load balancer distributes to identical instances of one service. Use both: gateway routes, then per-service load balancer distributes.' },
        { name: 'DNS Round Robin', when: 'DNS-level distribution is simpler but has no health checking — clients cache stale IPs for failed servers. Use a real load balancer for production systems that need fast failover.' },
        { name: 'Service Mesh Sidecar', when: 'A sidecar proxy (Envoy, Linkerd) does load balancing at the application level for service-to-service traffic. Complements (doesn\'t replace) the entry-point load balancer.' },
      ],
    },
    failures: [
      {
        name: 'Load Balancer as Single Point of Failure',
        cause: 'One load balancer instance with no redundancy.',
        symptom: 'Load balancer crashes → entire application goes down, even though all backend servers are healthy.',
        fix: 'Run load balancers in active-active or active-passive pairs using VRRP (Keepalived) or use a cloud managed LB (AWS ALB/NLB) which is HA by design.',
        severity: 'critical',
      },
      {
        name: 'Health Check Too Slow to Detect Failures',
        cause: 'Health check interval is 60s with 3 failures required = 3-minute detection time.',
        symptom: 'Traffic is routed to a crashed server for up to 3 minutes, causing 50% of requests to fail while the other backend handles all load.',
        fix: 'Use 5-10s intervals with 2-3 failure threshold. For critical paths, use active health checks on realistic endpoints, not just TCP ping.',
        severity: 'high',
      },
      {
        name: 'Thundering Herd on Backend Recovery',
        cause: 'A backend server is slow (high GC pause, warming up), gets marked unhealthy, recovers, then suddenly receives 100% of traffic.',
        symptom: 'The just-recovered server is immediately overwhelmed again, oscillating between healthy and unhealthy.',
        fix: 'Use slow-start or warmup mode: when a server re-enters the pool, gradually ramp its traffic weight from 10% to 100% over 30-60 seconds.',
        severity: 'high',
      },
    ],
    a: {
      v: '⚖️',
      t: 'The Traffic Cop',
      tx: "Imagine a busy intersection with one police officer directing traffic. Without them, all cars rush to one street and it jams completely.\n\nA LOAD BALANCER is your traffic cop. When millions of requests arrive, it distributes them evenly across your fleet of servers. No single server gets overwhelmed.\n\nIf one server crashes, the load balancer stops sending traffic there — automatically. Users never notice.",
      s: 'Load balancers can operate at Layer 4 (TCP — fast, dumb) or Layer 7 (HTTP — smart, can route by URL/header). Most modern apps need Layer 7.',
    },
    te: {
      def: 'A load balancer distributes incoming network traffic across multiple servers to ensure no single server bears too much load, improving reliability and availability.',
      types: [
        { n: 'Round Robin', d: 'Requests distributed in rotation. Simple, works when all requests take equal time.' },
        { n: 'Least Connections', d: 'Route to server with fewest active connections. Best for variable request durations.' },
        { n: 'Weighted', d: 'Servers get traffic proportional to their capacity. Useful for heterogeneous fleets.' },
        { n: 'IP Hash', d: 'Same client IP always routes to same server. Useful for session stickiness.' },
      ],
      when: 'Any system serving more traffic than one server can handle. Also critical for zero-downtime deploys — roll new version one server at a time.',
      trade: 'Pro: horizontal scaling, no single point of failure, health checking. Con: stateful sessions require sticky sessions or shared session store.',
      code: `# Nginx load balancer config (round robin)
upstream backend {
    server server1.example.com;
    server server2.example.com;
    server server3.example.com;
}

# Least connections with health check
upstream backend {
    least_conn;
    server s1.example.com weight=3;
    server s2.example.com;
    server s3.example.com backup;
}`,
      rw: {
        ex: ['Netflix (Zuul + AWS ELB)', 'Google (Maglev)', 'AWS ALB/NLB'],
        cs: 'Netflix streams to 15M+ concurrent users. Their Zuul gateway + AWS Elastic Load Balancers distribute traffic across thousands of instances, with auto-scaling triggered by CPU and request rate metrics.',
      },
    },
    interview: {
      q: 'Which load balancing algorithm would you choose and why?',
      a: 'It depends on the workload. <strong>Round robin</strong> for homogeneous requests (all take similar time). <strong>Least connections</strong> when request duration varies significantly — video encoding vs cache reads. <strong>IP hash</strong> when you need session stickiness but cannot use a shared session store. I default to least connections for most APIs since response times are rarely uniform in real systems.',
      fu: ['How do you handle session stickiness?', 'What is the difference between L4 and L7 load balancing?', 'How do you do zero-downtime deploys with a load balancer?'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. CACHING
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'caching',
    cat: 'performance',
    color: '#34d399',
    icon: '⚡',
    title: 'Caching',
    tag: 'The fastest database is the one you never query',
    overview:
      'Caching stores frequently-read data in fast in-memory storage so the application can serve it without touching the database, reducing latency from ~10ms to ~0.1ms and cutting database load by 80-95% for read-heavy workloads. The core challenge is cache invalidation — knowing when to evict or update stale data without introducing inconsistency.',
    components: [
      {
        name: 'Cache Store',
        icon: '🗄️',
        role: 'The in-memory store that holds cached data.',
        detail:
          'Redis or Memcached are the dominant choices. Redis adds persistence, data structures (sorted sets for leaderboards, HyperLogLog for unique counts), and pub/sub. Memcached is simpler, multi-threaded, and better for homogeneous string values at extreme scale. Both serve data in under 1ms.',
      },
      {
        name: 'Cache Key',
        icon: '🔑',
        role: 'Unique identifier mapping a request to its cached response.',
        detail:
          'A good key captures everything that makes two requests different: user:123:profile, product:456:en-US:v2. Bad keys cause cache collisions (different data served to wrong users) or low hit rates (too-specific keys that are never reused).',
      },
      {
        name: 'TTL (Time-to-Live)',
        icon: '⏱️',
        role: 'How long a cached value is valid before automatic expiry.',
        detail:
          'TTL is the primary safety net against serving stale data. Short TTLs (seconds) for rapidly-changing data, long TTLs (hours/days) for static content. Without TTL, caches grow unbounded and deleted data is served indefinitely.',
      },
      {
        name: 'Eviction Policy',
        icon: '🗑️',
        role: 'Decides which keys to remove when the cache is full.',
        detail:
          'LRU (Least Recently Used) evicts the least recently accessed key — best for most applications. LFU (Least Frequently Used) evicts the coldest key — better for long-lived workloads. allkeys-random is fastest but least intelligent. Redis defaults to no eviction (throws an error when full), so you must configure this.',
      },
      {
        name: 'Cache Invalidation',
        icon: '🔄',
        role: 'Mechanism for removing or updating stale cache entries when source data changes.',
        detail:
          'Three strategies: TTL expiry (passive, simple, brief staleness), explicit delete on write (strong consistency, requires coupling), and cache versioning (embed a version number in the key — old versions expire naturally). No universal answer; the right choice depends on how stale data harms the user.',
      },
      {
        name: 'Write Policy',
        icon: '✍️',
        role: 'Defines whether writes go to cache, DB, or both, and in what order.',
        detail:
          'Cache-aside: app manages cache manually (most flexible). Write-through: write to cache and DB simultaneously (consistent, slower writes). Write-behind: write to cache, async to DB (fast writes, risk data loss on crash). Read-through: cache fetches from DB on miss automatically.',
      },
    ],
    howItWorks:
      'In the most common cache-aside pattern, when a request arrives the application first checks the cache using a key derived from the request parameters. On a cache hit the value is returned immediately. On a cache miss the application queries the database, stores the result in the cache with a TTL, and returns the value. Subsequent identical requests hit the cache until the TTL expires or the key is explicitly invalidated. Under high concurrency, multiple parallel cache misses for the same key can simultaneously query the database — the "thundering herd" — which requires a distributed mutex (Redis SETNX) or probabilistic early expiration to prevent.',
    decision: {
      choose: [
        'High read-to-write ratio (>10:1) — most web apps qualify',
        'Expensive computations or aggregations that change infrequently (report generation, ML inference)',
        'Session storage — Redis is purpose-built for this',
        'Rate limiting counters — Redis atomic INCR with TTL is the canonical solution',
        'Content that is the same for all users (product pages, documentation)',
      ],
      avoid: [
        'Financial transaction records that must always reflect current state — never serve stale balances',
        'Per-user personalized data with fine-grained privacy requirements',
        'Very low traffic — caching adds complexity that is not justified below a few hundred requests/second',
        'Frequently updated data where cache hit rate would be <20%',
      ],
      vs: [
        { name: 'CDN Edge Cache', when: 'CDN caches static assets and API responses at geographic edge nodes. Application cache (Redis) caches DB query results in the same data center as the app. Both serve different purposes and are often used together.' },
        { name: 'Read Replica', when: 'A DB read replica scales read throughput at the DB layer with sub-second lag. Use it when queries are complex and not cacheable. Use caching on top of replicas to further reduce load.' },
        { name: 'Materialized View', when: 'A DB materialized view pre-computes complex query results inside the database. Better when the data must always be consistent and the query logic is SQL-friendly.' },
      ],
    },
    failures: [
      {
        name: 'Cache Stampede (Thundering Herd)',
        cause: 'A popular cache key expires and hundreds of concurrent requests miss the cache simultaneously, all querying the database at the same moment.',
        symptom: 'DB CPU spikes to 100%. Query latency goes from 5ms to 5s. Cascading failures if the DB cannot handle the sudden burst.',
        fix: 'Use probabilistic early expiration (start refreshing before TTL expires) or a distributed lock (Redis SETNX) so only one process rebuilds the cache while others wait for it.',
        severity: 'critical',
      },
      {
        name: 'Cache Penetration',
        cause: 'Requests for keys that do not exist in the DB (invalid IDs, bot probes) always miss the cache and hit the DB.',
        symptom: 'DB gets hammered with queries that return empty results. Easy to exploit as a DoS vector.',
        fix: 'Cache "null" results for non-existent keys with a short TTL (30s). Or use a Bloom filter at the cache layer to reject impossible keys before they reach the DB.',
        severity: 'high',
      },
      {
        name: 'Stale Data Served After Write',
        cause: 'A write updates the DB but the old value remains in cache until TTL expiry.',
        symptom: 'User updates their profile photo, refreshes the page, and still sees the old photo for 60 seconds.',
        fix: 'On successful write, explicitly delete or update the cache key. For write-heavy data, use write-through caching. For user-specific writes, invalidate only the affected user\'s cache keys.',
        severity: 'medium',
      },
      {
        name: 'Cache Avalanche',
        cause: 'A large set of keys all expire at the same time (e.g., all set with identical TTL during a cold start or deploy).',
        symptom: 'Traffic spike to the DB every N minutes. Predictable latency spikes that correlate with cache TTL.',
        fix: 'Add random jitter to TTL values (base_ttl + random(0, 30s)) so expirations are spread over time, not simultaneous.',
        severity: 'high',
      },
    ],
    a: {
      v: '📝',
      t: 'The Post-It Note',
      tx: "You're an accountant. Every time someone asks for last year's annual revenue, you go to the filing cabinet, search through boxes, find the report, and read the number. Takes 10 minutes.\n\nThen you start writing the number on a Post-It note on your monitor. Now it takes 1 second.\n\nThat Post-It note IS a CACHE. The filing cabinet is your database. The rule: if you're fetching the same data repeatedly and it doesn't change often, cache it.",
      s: "Cache invalidation is famously called one of the hardest problems in computer science. The two hard problems are: cache invalidation, naming things, and off-by-one errors.",
    },
    te: {
      def: 'Caching stores frequently accessed data in fast storage (memory) to reduce database load, decrease latency, and improve throughput. The cache sits between the application and the database.',
      types: [
        { n: 'Cache-Aside', d: 'App checks cache first. On miss, fetches from DB and populates cache. Most common pattern.' },
        { n: 'Write-Through', d: 'Write to cache AND DB simultaneously. Cache always consistent. Slower writes.' },
        { n: 'Write-Behind', d: 'Write to cache first, DB async later. Fast writes, risk of data loss on crash.' },
        { n: 'Read-Through', d: 'Cache fetches from DB automatically on miss. Simpler app code, cache handles consistency.' },
      ],
      when: 'High read-to-write ratio. Expensive computations (ML inference, complex DB joins). Session data. Rate limiting counters.',
      trade: 'Pro: massive latency reduction (ms → μs), reduced DB load. Con: cache invalidation complexity, stale data risk, thundering herd on cold start.',
      code: `// Cache-Aside pattern
async function getUser(id: string) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached); // cache HIT

  const user = await db.users.findById(id); // cache MISS
  await redis.setex(\`user:\${id}\`, 3600, JSON.stringify(user));
  return user;
}

// Thundering herd prevention — mutex lock
async function getUserSafe(id: string) {
  const cached = await redis.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);

  const lock = await redis.set(\`lock:user:\${id}\`, '1', 'NX', 'EX', 10);
  if (!lock) return await pollUntilCached(\`user:\${id}\`);

  const user = await db.users.findById(id);
  await redis.setex(\`user:\${id}\`, 3600, JSON.stringify(user));
  await redis.del(\`lock:user:\${id}\`);
  return user;
}`,
      rw: {
        ex: ['Twitter (Redis timelines)', 'Facebook (Memcached)', 'Netflix (EVCache)'],
        cs: "Twitter uses Redis to cache each user's timeline — 150 tweet IDs stored per user. Loading your feed is a single Redis read instead of a complex SQL join across millions of rows. The fan-out service writes to these caches when you post.",
      },
    },
    interview: {
      q: 'How do you handle cache invalidation?',
      a: 'Three main strategies: <strong>TTL expiration</strong> (simplest — cache expires after N seconds, accept brief staleness), <strong>event-driven invalidation</strong> (when data changes, explicitly delete/update the cache key — requires coupling between write and cache paths), and <strong>cache versioning</strong> (embed version in key like user:123:v2 — old keys naturally expire). For financial data I use write-through for consistency. For social feeds I accept TTL-based eventual consistency. The thundering herd on expiration requires a mutex or probabilistic early expiration.',
      fu: ['What is a thundering herd and how do you fix it?', 'When would you NOT use caching?', 'How does Redis differ from Memcached?'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. CDN
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'cdn',
    cat: 'performance',
    color: '#34d399',
    icon: '🌐',
    title: 'CDN',
    tag: "Amazon's regional warehouses for the internet",
    overview:
      'A Content Delivery Network is a globally distributed network of edge servers that caches your content physically close to users, cutting asset load time from 200ms (cross-continental) to 5ms (nearest city) and absorbing traffic spikes that would overwhelm your origin. Modern CDNs like Cloudflare go beyond caching — they run your code at the edge for sub-5ms API responses worldwide.',
    components: [
      {
        name: 'Edge Node (PoP)',
        icon: '📡',
        role: 'A server colocated in a major city that serves content to nearby users.',
        detail:
          'CDN providers operate 200-300+ Points of Presence globally. When a user requests your content, DNS routes them to the nearest PoP based on latency (anycast routing). Cloudflare has PoPs in 300+ cities; Akamai has 4,000+ globally.',
      },
      {
        name: 'Origin Server',
        icon: '🏭',
        role: 'Your application server that generates the canonical response.',
        detail:
          'The origin is the source of truth. Edge nodes pull from the origin on a cache miss, cache the response according to its Cache-Control headers, then serve all subsequent requests locally. The origin only sees a small fraction of total traffic — typically <5% for well-configured static assets.',
      },
      {
        name: 'Cache-Control Headers',
        icon: '🏷️',
        role: 'HTTP headers that tell the CDN how long to cache a response and for whom.',
        detail:
          'The key directives: max-age (client cache TTL), s-maxage (CDN cache TTL, overrides max-age at edge), stale-while-revalidate (serve stale while fetching fresh in background), and private (never cache at edge — for user-specific content). Misconfigured headers are the #1 CDN mistake.',
      },
      {
        name: 'Cache Key',
        icon: '🔑',
        role: 'The fingerprint that identifies a unique cacheable response.',
        detail:
          'By default the cache key is the full URL. CDNs can be configured to vary by header (Accept-Language, Accept-Encoding), cookie, or query param. Vary: Cookie causes individual cache entries per session — accidentally destroying your hit rate if not configured carefully.',
      },
      {
        name: 'Purge API',
        icon: '🗑️',
        role: 'Allows immediate invalidation of specific cached objects.',
        detail:
          'When you deploy a new version of a file, you can\'t wait for TTL to expire. CDNs expose an API to purge by URL, tag, or wildcard. Cloudflare can propagate a purge globally in under 150ms. AWS CloudFront takes 10-15 minutes — a key difference for deployment workflows.',
      },
      {
        name: 'Edge Compute',
        icon: '⚡',
        role: 'Runs custom logic (auth, A/B tests, rewrites) at the CDN edge, not at origin.',
        detail:
          'Cloudflare Workers, AWS Lambda@Edge, and Vercel Edge Functions run JavaScript/WASM within milliseconds of every user. This enables geolocation-based redirects, JWT validation, and personalization without a round-trip to the origin — often reducing latency by 10x versus a centralized API.',
      },
    ],
    howItWorks:
      'A user\'s browser resolves your domain to a CDN IP via DNS (anycast routes them to the nearest PoP). The edge node checks its cache for the requested URL. On a cache hit it returns the file in under 5ms without contacting your origin. On a cache miss it fetches from the origin, caches the response (per Cache-Control headers), and returns it to the user. Future requests for the same asset from any user near that PoP are served from cache. For deploys, content-addressed filenames (bundle.abc123.js) make CDN caching trivial — the file hash changes with every deploy, so old and new content co-exist with maximal caching.',
    decision: {
      choose: [
        'Any website or app with a globally distributed user base',
        'Static assets (JS, CSS, images, fonts) — cache aggressively with immutable headers',
        'Video streaming — CDNs are essential; streaming from one origin to millions is impossible',
        'DDoS protection — CDN absorbs volumetric attacks before they reach your origin',
        'When origin server costs are high — CDN dramatically reduces bandwidth bills',
      ],
      avoid: [
        'Private, user-specific content (bank statements, DMs, order details) — never cache at edge',
        'Real-time data (stock prices, live scores) with TTL <1s — cache hit rate would be near zero',
        'WebSocket or SSE connections — CDN adds complexity to long-lived bidirectional connections',
        'Regions with CDN compliance restrictions (data sovereignty regulations)',
      ],
      vs: [
        { name: 'Application Cache (Redis)', when: 'Redis caches DB query results in your data center. CDN caches HTTP responses at geographic edge nodes. Complementary: Redis reduces DB load, CDN reduces origin load.' },
        { name: 'Origin Replication', when: 'Deploying origin servers in multiple regions (multi-region architecture) is far more complex and expensive. Start with CDN for global performance; only add multi-region origins if you need active-active write consistency.' },
        { name: 'Edge Functions', when: 'Edge compute (Cloudflare Workers, Lambda@Edge) runs business logic at CDN edge nodes, going beyond static caching. Use for dynamic personalization or auth that must be sub-10ms globally.' },
      ],
    },
    failures: [
      {
        name: 'Caching Private Content at Edge',
        cause: 'Missing Cache-Control: private header on responses containing user-specific data. CDN caches the first user\'s response and serves it to all subsequent users.',
        symptom: 'Users see each other\'s account data, payment information, or private files. Severe security/privacy incident.',
        fix: 'Audit every API endpoint. Responses containing user-specific data MUST have Cache-Control: private, no-store. Add automated tests that verify sensitive endpoints return no-cache headers.',
        severity: 'critical',
      },
      {
        name: 'Stale Cache After Deploy (No Cache Busting)',
        cause: 'Static assets use semantic filenames (app.js) without content hashes. After deploying a new version, CDN continues serving the old app.js until TTL expires.',
        symptom: 'Users on cached old JS + new HTML. App breaks. Support tickets spike within minutes of deployment.',
        fix: 'Embed content hash in filenames (app.a3f9b2.js). Tools like webpack, Vite, and Next.js do this automatically. Then set max-age=31536000, immutable — cache forever, replace by changing the filename.',
        severity: 'critical',
      },
      {
        name: 'Low Cache Hit Rate',
        cause: 'Too many cache-key parameters (query strings, cookies) creating unique cache entries for essentially identical content.',
        symptom: 'CDN offload ratio <30%. Origin still receives most traffic. CDN costs without CDN benefits.',
        fix: 'Audit Vary headers and cache key configuration. Strip unnecessary query params (tracking params like fbclid, utm_*) from cache keys. Group users by locale rather than per-user cache keys.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🏭→📦',
      t: "Amazon's Warehouse Strategy",
      tx: "Amazon has one main factory in Seattle. But they don't ship EVERYTHING from Seattle. They have regional warehouses — in Texas, New York, London, Tokyo.\n\nWhen you order something, it ships from the NEAREST warehouse. 2-day delivery becomes 1-day. Sometimes same-day.\n\nA CDN does the same for your website. Your origin server is in Virginia. But CDN edge nodes sit in 200+ cities worldwide. Users get files from the nearest city — not Virginia.",
      s: "CDNs don't just serve static files anymore. Modern CDNs like Cloudflare run your logic at the edge too — API responses, auth, A/B tests — milliseconds from every user.",
    },
    te: {
      def: 'A Content Delivery Network is a geographically distributed network of servers that caches and delivers content from locations close to end users, reducing latency and origin server load.',
      types: [
        { n: 'Static CDN', d: 'Images, CSS, JS, fonts. Set cache headers once, serve forever from edge.' },
        { n: 'Dynamic CDN', d: 'API responses cached at edge with smart invalidation. Cloudflare Workers, Lambda@Edge.' },
        { n: 'Streaming CDN', d: 'Video segments cached at edge nodes. Adaptive bitrate switching. Netflix Open Connect.' },
        { n: 'Security CDN', d: 'DDoS protection, WAF, bot detection at edge before traffic reaches origin.' },
      ],
      when: 'Any globally distributed user base. Static assets always. Video streaming always. API responses when cacheable.',
      trade: 'Pro: massive latency reduction, DDoS absorption, reduced origin bandwidth cost. Con: cache invalidation delay, cost per GB egress, debugging complexity.',
      code: `// Cache-Control headers for CDN
// Static assets — cache forever (hash in filename)
Cache-Control: public, max-age=31536000, immutable

// API responses — cache 60s at edge, revalidate
Cache-Control: public, s-maxage=60, stale-while-revalidate=30

// Private user data — never cache at CDN
Cache-Control: private, no-store

// Purge CDN cache via API
await fetch('https://api.cloudflare.com/zones/{id}/purge_cache', {
  method: 'POST',
  body: JSON.stringify({ files: ['https://example.com/api/products'] })
});`,
      rw: {
        ex: ['Netflix (Open Connect)', 'Cloudflare', 'AWS CloudFront', 'Akamai'],
        cs: "Netflix built Open Connect — their own CDN. Instead of paying Akamai, they place their own servers INSIDE ISPs (Comcast, AT&T, Sky). 95% of Netflix traffic never leaves the ISP network. Startup time dropped, streaming quality improved, bandwidth costs collapsed.",
      },
    },
    interview: {
      q: 'When would you NOT use a CDN?',
      a: "<strong>Private/personalized content</strong> — user-specific API responses cannot be cached at edge (auth tokens, account data). <strong>Highly dynamic data</strong> — if content changes faster than CDN TTL, you're serving stale data constantly. <strong>Real-time systems</strong> — WebSocket connections, live bidding, multiplayer games need direct connections. <strong>Regulated data</strong> — some compliance requirements restrict which countries data can traverse. The key question: is this content shareable across users and does it change infrequently enough for caching to help?",
      fu: ['How do you invalidate CDN cache immediately?', 'What is edge computing?', 'How does adaptive bitrate streaming work?'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. SQL vs NoSQL
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'databases',
    cat: 'data',
    color: '#a78bfa',
    icon: '💾',
    title: 'SQL vs NoSQL',
    tag: 'Library card catalog vs filing cabinet',
    overview:
      'SQL databases store structured relational data in tables with enforced schemas, foreign keys, and ACID transaction guarantees — ideal for complex queries and financial consistency. NoSQL databases trade some consistency guarantees for flexible schemas, horizontal scalability, and simple access patterns optimized for specific data shapes like documents, key-value pairs, or time-series.',
    components: [
      {
        name: 'Schema',
        icon: '📐',
        role: 'Defines the structure, types, and constraints of stored data.',
        detail:
          'SQL databases enforce a rigid schema: columns, data types, and constraints are defined upfront, and the database rejects non-conforming data. NoSQL databases are "schema-on-read" — any shape of data is accepted, and the application interprets the structure. SQL schemas make invalid states impossible to represent; NoSQL schemas make migrations trivially easy.',
      },
      {
        name: 'ACID Transactions',
        icon: '🔒',
        role: 'Guarantees Atomicity, Consistency, Isolation, and Durability across multiple operations.',
        detail:
          'In an ACID transaction, either all operations commit or none do — no partial writes. A bank transfer debits one account and credits another atomically; if the credit fails, the debit is automatically rolled back. Most NoSQL databases sacrifice full cross-document ACID for performance (DynamoDB has single-item ACID; MongoDB added multi-document ACID in v4).',
      },
      {
        name: 'Query Engine',
        icon: '🔍',
        role: 'Processes queries, optimizes execution plans, and joins data across tables.',
        detail:
          'SQL\'s declarative query language enables complex filtering, aggregation, and multi-table JOINs — the database figures out the optimal execution plan. NoSQL databases expose simpler APIs (get by key, scan by index) without full JOIN support, pushing complex aggregation to the application layer or specialized query engines.',
      },
      {
        name: 'Index',
        icon: '📑',
        role: 'Pre-computed data structure enabling fast lookup by non-primary-key fields.',
        detail:
          'Without an index, every query requires a full table scan. A B-tree index lets the DB find rows in O(log n) instead of O(n). Both SQL and NoSQL support secondary indexes, but the cost is the same: every write must update all indexes. More indexes = faster reads, slower writes.',
      },
      {
        name: 'Replication',
        icon: '📋',
        role: 'Copies data to multiple nodes for read scaling and failover.',
        detail:
          'SQL databases typically use primary-replica replication: writes go to one primary, which streams changes to read replicas. Replicas can serve read traffic, spreading the load. NoSQL databases like Cassandra use masterless replication with configurable consistency levels — any node can accept writes.',
      },
      {
        name: 'Horizontal Scaling',
        icon: '↔️',
        role: 'Distributes data and load across multiple database nodes.',
        detail:
          'SQL databases scale vertically (bigger machine) and can shard horizontally with significant complexity. NoSQL databases are designed from the ground up to shard horizontally — Cassandra, DynamoDB, and MongoDB distribute data across nodes automatically using consistent hashing.',
      },
    ],
    howItWorks:
      'In a SQL database, data is stored in normalized tables with foreign key references between them. A query planner reads your SQL, computes multiple possible execution plans, and picks the cheapest based on table statistics and available indexes. Writes pass through a write-ahead log for crash recovery, then commit when flushed to disk. In a document database like MongoDB, data is stored as JSON-like documents; related data is embedded inside a single document rather than across multiple tables, making reads fast (one document fetch) at the cost of write amplification (updating nested data touches large documents). The choice between normalization (SQL) and denormalization (NoSQL) is really a decision about whether to optimize for reads or writes.',
    decision: {
      choose: [
        'SQL: complex multi-table queries, JOINs, aggregations, and reporting',
        'SQL: financial transactions requiring ACID — payments, inventory, bookings',
        'SQL: well-understood, stable schema that is unlikely to change frequently',
        'NoSQL (document): nested/hierarchical data that is always accessed together (user profile + preferences)',
        'NoSQL (key-value): session storage, feature flags, real-time counters',
        'NoSQL (wide-column): time-series data, activity feeds, IoT sensor data at massive write throughput',
      ],
      avoid: [
        'SQL: when the schema is genuinely unknown or changes weekly — migrations slow teams down',
        'SQL: when you need to write >100K rows/second per table without sharding',
        'NoSQL: when you need complex multi-entity transactional consistency',
        'NoSQL: when your access patterns require ad-hoc queries across unrelated data',
        '"NoSQL scales better" is a myth without evidence — PostgreSQL handles billions of rows fine with proper indexing',
      ],
      vs: [
        { name: 'NewSQL (CockroachDB, Spanner)', when: 'Distributed SQL databases that provide ACID guarantees across nodes and horizontal scalability. Best when you need both relational guarantees and global scale. Higher operational complexity.' },
        { name: 'Time-Series DB (InfluxDB, TimescaleDB)', when: 'Purpose-built for append-mostly time-indexed data (metrics, events, logs). 10-100× more efficient than general-purpose SQL for this access pattern.' },
        { name: 'Graph DB (Neo4j)', when: 'Relationship-heavy queries (social graphs, recommendation engines, fraud detection) that require traversing many hops. SQL with JOIN chains becomes exponentially slower; graph DBs handle it natively.' },
      ],
    },
    failures: [
      {
        name: 'Missing Index on High-Cardinality Query Column',
        cause: 'A query filters on a column that has no index. With small data volumes this is imperceptible, but as the table grows the query degrades from 1ms to 30s.',
        symptom: 'DB CPU at 100%. Specific queries take 30s+. EXPLAIN shows "Seq Scan" instead of "Index Scan".',
        fix: 'Run EXPLAIN ANALYZE on slow queries. Add targeted indexes for high-frequency filter and sort columns. Monitor slow query logs in production before they become incidents.',
        severity: 'critical',
      },
      {
        name: 'N+1 Query Problem',
        cause: 'ORM fetches a list of N entities, then for each entity executes an additional query to fetch a related entity — producing N+1 total queries.',
        symptom: 'A page that displays 50 posts makes 51 DB queries. The endpoint takes 2s instead of 20ms.',
        fix: 'Use eager loading (Prisma include, Sequelize include, Hibernate JOIN FETCH) to fetch related data in one query. Or use a DataLoader to batch N queries into one.',
        severity: 'high',
      },
      {
        name: 'Write Amplification in Document Stores',
        cause: 'Embedding large arrays or sub-documents inside a single MongoDB document. When any nested element changes, the entire document is rewritten.',
        symptom: 'High disk I/O for seemingly small writes. Storage grows faster than data. Write throughput degrades over time.',
        fix: 'Reference related data by ID instead of embedding when the sub-collection is large or updated independently. Only embed data that is always accessed with its parent and rarely changes.',
        severity: 'medium',
      },
    ],
    a: {
      v: '📚 vs 🗂️',
      t: 'Library vs Filing Cabinet',
      tx: "A LIBRARY has a strict cataloging system. Every book has a place, a Dewey decimal number, rules about what goes where. You can cross-reference authors, topics, years. Powerful — but adding a new section requires reorganizing the catalog.\n\nA FILING CABINET is flexible. Throw in any document, any shape, any size. No rules. Perfect for your home office. But finding related documents across folders is a mess.\n\nSQL databases are the library. NoSQL is the filing cabinet. Both are correct — for different problems.",
      s: 'The dirty secret: most systems use BOTH. Instagram uses PostgreSQL for users/accounts (SQL) and Cassandra for activity feeds (NoSQL). Pick the right tool per data type.',
    },
    te: {
      def: 'SQL databases store structured data in tables with relationships, enforcing ACID guarantees. NoSQL databases sacrifice some guarantees for flexible schemas and horizontal scale.',
      types: [
        { n: 'SQL (Relational)', d: 'Structured tables, foreign keys, JOIN queries. ACID. PostgreSQL, MySQL.' },
        { n: 'Document', d: 'JSON documents, flexible schema, nested data. MongoDB, Firestore.' },
        { n: 'Key-Value', d: 'Simple key→value lookup. Extremely fast. Redis, DynamoDB.' },
        { n: 'Wide-Column', d: 'Rows with variable columns per row. Massive scale, time-series. Cassandra, HBase.' },
      ],
      when: 'SQL: complex relationships, financial transactions, reporting, ACID required. NoSQL: massive scale, flexible/evolving schema, high write throughput, hierarchical data.',
      trade: 'SQL: strong consistency, mature tooling, complex queries. Con: hard to scale horizontally. NoSQL: horizontal scale, flexible. Con: eventual consistency, limited JOIN support.',
      code: `-- SQL: user with orders (normalized, JOIN)
SELECT u.name, o.total, o.created_at
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.id = 123
ORDER BY o.created_at DESC;

// NoSQL (MongoDB): user with embedded recent orders
// Denormalized — reads are fast, writes update one document
{
  "_id": "123",
  "name": "Alice",
  "recentOrders": [
    { "total": 49.99, "date": "2024-01-15" },
    { "total": 129.00, "date": "2024-01-10" }
  ]
}`,
      rw: {
        ex: ['Instagram (PostgreSQL + Cassandra)', 'Uber (MySQL + Schemaless)', 'Netflix (MySQL + Cassandra + ElasticSearch)'],
        cs: 'Instagram uses PostgreSQL for user accounts, relationships, and media metadata (complex queries needed). They use Cassandra for activity feeds and direct messages (high write throughput, simple access patterns). One system, two databases — right tool per problem.',
      },
    },
    interview: {
      q: 'When would you switch from SQL to NoSQL?',
      a: "I'd switch when: <strong>write throughput exceeds what a single SQL node can handle</strong> and sharding SQL becomes painful; <strong>the schema is genuinely flexible/evolving</strong> and migrations are blocking velocity; <strong>the access patterns are simple</strong> (key lookup, time-series append) and don't need complex JOINs; or <strong>horizontal scale is required</strong> across multiple regions. I would NOT switch just because the team is excited about NoSQL — SQL handles billions of rows fine with proper indexing, and the tooling is far more mature.",
      fu: ['What is ACID and why does it matter?', 'How do you handle many-to-many relationships in NoSQL?', 'What is eventual consistency?'],
    },
  },
];
