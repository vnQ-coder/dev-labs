import { RealWorldSystem } from '../types';

export const REALWORLD_PAYMENTS: RealWorldSystem[] = [
  {
    id: 'stripe',
    icon: '💳',
    name: 'Stripe',
    color: '#635bff',
    scale: '1B+ API requests/day · $1T+ payment volume/year · 99.999% uptime SLA',
    focus: 'Payment Processing, Idempotency & Financial Reliability at Scale',
    problem:
      "Design Stripe's payment processing platform. A developer calls Stripe's API to charge a customer's card. The charge must be processed exactly once (no double charges even on network retries), within 2 seconds, with a complete audit trail, and 99.999% uptime. The system handles 1B+ API requests/day, integrates with card networks (Visa/Mastercard) and hundreds of banks, detects fraud in real time, and must never lose a financial transaction even through data center failures.",

    functionalReqs: [
      'Accept payments via credit/debit cards, bank transfers, wallets (Apple Pay, Google Pay)',
      'Create customers, payment methods, subscriptions with recurring billing',
      'Issue refunds, partial refunds, and chargebacks handling',
      "Webhook delivery: notify merchant's server of payment events (succeeded, failed, refunded)",
      'Dashboard: merchants see all transactions, disputes, payouts in real time',
      'Multi-currency: accept and settle in 135+ currencies with FX conversion',
    ],

    nonFunctionalReqs: [
      { label: 'Payment latency', value: 'p99 < 2 seconds from API call to charge result' },
      {
        label: 'Exactly-once processing',
        value: 'a payment charged exactly once regardless of API retries',
      },
      {
        label: 'Uptime',
        value: '99.999% (< 5 min/year downtime) — merchants lose revenue on every second of outage',
      },
      {
        label: 'Durability',
        value: 'zero financial transactions lost — even through complete data center failure',
      },
      {
        label: 'Fraud detection',
        value: 'ML fraud scoring in < 100ms added to the payment flow',
      },
      { label: 'Compliance', value: 'PCI DSS Level 1, SOC 2 Type II, GDPR' },
    ],

    scaleEstimation: [
      {
        label: 'API requests/day',
        value: '1B',
        note: '~11,600/sec avg; 50K/sec peak',
      },
      {
        label: 'Payment volume',
        value: '$1T/year = ~$31,700/sec in dollar value processed',
      },
      {
        label: 'Webhooks delivered/day',
        value: '5B (5 events per payment × 1B requests)',
        note: 'webhook delivery is the highest-volume operation',
      },
      {
        label: 'Idempotency keys stored',
        value: '1B/day with 24-hour TTL = ~1B active keys at any time',
        note: 'stored in Redis',
      },
      {
        label: 'Fraud scoring requests',
        value: 'equal to payment attempts = ~11,600/sec',
        note: 'Stripe Radar ML model',
      },
      {
        label: 'Payout records',
        value: '~10M merchants receiving payouts daily',
        note: 'T+2 settlement cycle',
      },
    ],

    highLevelDesign: [
      {
        title: 'API Gateway & Idempotency Layer',
        description:
          "Every Stripe API call passes through an API Gateway that authenticates (secret key validation), rate-limits (per-merchant), and most critically: checks an idempotency key. The merchant includes an Idempotency-Key header. The Gateway stores (idempotency_key, response) in Redis with 24-hour TTL. If the same key is seen again (retry after network timeout), the stored response is returned immediately — no charge is re-processed. This is how exactly-once semantics are implemented.",
      },
      {
        title: 'Payment Intent State Machine',
        description:
          'A payment goes through states: CREATED → REQUIRES_PAYMENT_METHOD → REQUIRES_CONFIRMATION → REQUIRES_ACTION (3DS) → PROCESSING → SUCCEEDED / FAILED. State is persisted in PostgreSQL (append-only event log + current state). Each state transition is idempotent. The state machine ensures a payment cannot be charged twice — once SUCCEEDED, further charge attempts are rejected.',
      },
      {
        title: 'Card Network Integration',
        description:
          "Stripe connects to Visa, Mastercard, Amex networks via direct acquire relationships. A charge request triggers: tokenization (PAN stored in Stripe's vault, merchant gets a token) → authorization request to card network (< 1 second) → funds hold placed on cardholder's account. Settlement (actual money movement) happens asynchronously via ACH/wire in T+2 days. Stripe's direct network connections bypass intermediary processors — this is how they achieve 2-second latency and control their uptime SLA.",
      },
      {
        title: 'Fraud Detection (Stripe Radar)',
        description:
          "Every payment is scored by Stripe Radar, an ML model trained on billions of transactions. Features: card velocity (how many charges in last hour), geographic anomalies, device fingerprint, email domain reputation, IP-to-billing-address mismatch. The model runs inference in < 100ms and returns a risk score. High-risk payments trigger additional authentication (3DS) or are blocked. Radar's advantage is Stripe's cross-merchant data: a fraudulent card used at one merchant is flagged globally within minutes.",
      },
      {
        title: 'Webhook Delivery System',
        description:
          'Stripe delivers events (payment.succeeded, charge.refunded) to merchant endpoints via HTTPS POST. Webhooks are stored in a durable queue (Kafka). The delivery service attempts delivery with exponential backoff (retry at 1m, 5m, 30m, 2h, 8h, 24h, 72h). Each delivery attempt is recorded. Merchants can replay failed webhooks from the Dashboard. The delivery service is separate from the payment path — a slow merchant endpoint never affects payment processing.',
      },
    ],

    deepDive: [
      {
        title: 'Idempotency — exactly-once in a distributed system',
        description:
          "Network retries are unavoidable. A merchant's server calls Stripe, the response gets lost (network partition), the server retries. Without idempotency, the card is charged twice. Stripe's solution: each API call includes a merchant-generated idempotency_key (UUID). Stripe stores (api_key + idempotency_key) → response in Redis with 24-hour TTL. On retry, the original response is returned immediately from Redis. The charge never re-enters the payment flow. Critical detail: the idempotency key must be stored BEFORE the charge is attempted, not after — if stored after, a crash between charge success and Redis write causes a retry to re-charge. Stripe writes the key first, then processes.",
        insight:
          "Idempotency is a client-server contract, not a server-only feature. The client must generate and send stable keys; the server must store them before processing. Both sides must participate for exactly-once semantics to hold.",
      },
      {
        title: 'PCI DSS — never storing raw card numbers',
        description:
          "Stripe is PCI DSS Level 1 (highest). Raw PANs (Primary Account Numbers) are encrypted immediately on receipt (Stripe.js encrypts in the browser — the raw PAN never touches the merchant's server). Stripe stores PANs in an isolated vault (separate from the main application — a hardware security module, HSM). The vault issues tokens; the rest of Stripe's infrastructure only sees tokens. Even Stripe engineers cannot access raw PANs — all vault access is audited and requires two-person approval.",
        insight:
          "Tokenization is the PCI compliance strategy. By ensuring raw PANs exist only in the vault (HSM), Stripe dramatically reduces the PCI DSS scope — most of their infrastructure is outside PCI scope entirely.",
      },
      {
        title: 'Multi-region active-active with zero data loss',
        description:
          'Stripe runs in multiple AWS regions. Financial data is replicated synchronously via PostgreSQL streaming replication before any transaction commits (synchronous_commit = remote_write). This means a commit only returns success when the data is safely on disk in at least two regions. Latency cost: +5ms for cross-region replication. This is the cost of "zero financial data loss" — Stripe explicitly makes this trade-off because losing a transaction is never acceptable.',
        insight:
          'For financial data, synchronous replication is not optional. The 5ms latency penalty is a business requirement, not a technical trade-off.',
      },
      {
        title: 'Payouts — moving real money at T+2',
        description:
          "After a merchant processes payments, Stripe aggregates their balance and initiates a payout via ACH (US) or SEPA (EU) at T+2. The payout system calculates net (charges - refunds - fees) per merchant per day, creates ACH debit instructions, and submits via ODFI (Originating Depository Financial Institution) connections. ACH has no real-time confirmation — Stripe shows payouts as 'In Transit' until the bank confirms (2 business days). Failed ACH returns (insufficient funds, account closed) create negative balance entries that must be recovered. Stripe's treasury risk system monitors merchant account health to minimize unrecoverable losses.",
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          "Stripe explicitly chooses CP (Consistency + Partition Tolerance) over AP. When a network partition occurs, Stripe prefers to become temporarily unavailable rather than risk incorrect billing. A customer must never be charged twice; a charge must never be silently lost. Synchronous cross-region replication enforces this: a write is not acknowledged until it is durable in at least two regions. If replication is partitioned, writes are blocked (unavailability) rather than proceeding with a potentially inconsistent state. This is the right trade-off for payments — a merchant experiencing 10 seconds of 503 errors is recoverable; a merchant who double-charged 1,000 customers is a legal and trust catastrophe.",
        insight:
          "In financial systems, the CAP choice is not a trade-off to optimize — it is a business requirement. Incorrect billing cannot be tolerated; brief unavailability always can. CP is non-negotiable for money movement.",
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          "Stripe uses MySQL (scaled horizontally via Vitess sharding) as its primary financial database. ACID transactions are non-negotiable for a double-entry ledger: every charge must atomically create a debit and credit entry — no partial writes allowed. MySQL's row-level locking and serializable isolation prevent balance inconsistencies. Vitess handles horizontal sharding transparently, partitioning by merchant_id so each shard handles a subset of merchants' data. Redis is used for idempotency key storage (TTL-based expiry, O(1) lookup) and for rate limiting counters — use cases where eventual consistency and speed matter more than ACID. NoSQL databases (DynamoDB, Cassandra) are deliberately avoided for financial records: their eventual consistency models are incompatible with double-entry accounting correctness requirements.",
        insight:
          "ACID is not a performance feature — it is a correctness guarantee. For financial ledgers, choosing NoSQL to gain throughput means giving up the consistency guarantees that make the ledger trustworthy. SQL with sharding is the correct approach.",
      },
      {
        title: 'Message Broker & Event Streaming',
        description:
          "Stripe uses two message systems with distinct roles. SQS handles webhook delivery to merchant endpoints: at-least-once delivery semantics with exponential backoff retries (1m, 5m, 30m, 2h, 8h, 24h, 72h) match the webhook delivery contract — merchants must make their endpoints idempotent because Stripe may deliver the same event more than once. Kafka serves as the internal event log: every payment event (charge.created, charge.succeeded, refund.created) is written to Kafka. Downstream consumers (fraud scoring pipeline, email notification service, ledger update service, analytics) consume from Kafka independently. This fan-out architecture decouples the payment path from all downstream effects — a slow fraud analytics job never blocks a payment from completing.",
        insight:
          "Using two message systems is intentional: SQS for external delivery (simpler, managed retries) and Kafka for internal event sourcing (ordered, replayable log). Each tool matches its use case.",
      },
      {
        title: 'Networking & Security Architecture',
        description:
          "Stripe applies defense-in-depth networking. All external traffic uses TLS 1.2+ with certificate pinning in official SDKs. Internal service-to-service communication uses mTLS (mutual TLS) — every service has a client certificate, preventing rogue internal services. Connections to Visa/Mastercard payment networks use dedicated private leased lines (not the public internet) — this eliminates internet latency variance and provides guaranteed bandwidth for authorization requests. Cloudflare provides edge-level rate limiting and DDoS protection before traffic reaches Stripe's origin infrastructure. PCI DSS network segmentation: cardholder data environment (CDE) lives in isolated network segments with strict firewall rules — the rest of Stripe's infrastructure cannot directly query CDE systems.",
        insight:
          "PCI DSS network segmentation is not just a compliance checkbox — it is the primary defense against lateral movement if any non-CDE service is compromised. Isolating cardholder data at the network layer limits the blast radius of any breach.",
      },
    ],

    decisions: [
      {
        question: 'PostgreSQL vs distributed ledger for financial records',
        chosen: 'PostgreSQL with double-entry accounting',
        reason:
          "Financial records need ACID transactions, strong consistency, and SQL queryability for complex balance calculations. Stripe uses a double-entry accounting model: every charge creates a debit entry (customer's card) and a credit entry (merchant's Stripe balance) in the same transaction. This makes the ledger self-auditing — debits always equal credits. A distributed ledger (blockchain) adds consensus overhead without adding correctness guarantees over PostgreSQL's ACID transactions.",
      },
      {
        question: 'Synchronous vs asynchronous webhook delivery',
        chosen: 'Asynchronous via Kafka',
        reason:
          "If webhook delivery were synchronous (payment API waits for merchant's server to acknowledge), a slow or failing merchant endpoint would block payment processing. Merchants build their own servers — Stripe cannot control their response times. Decoupling via Kafka means the payment API returns in < 2 seconds regardless of merchant server health. The delivery queue absorbs spikes and provides retry semantics.",
      },
      {
        question: 'Direct card network connections vs third-party payment processor',
        chosen: 'Direct connections (Stripe as the processor)',
        reason:
          "Third-party processors (like Authorize.net) add 300-500ms latency and an additional failure point. More importantly, they control the merchant relationship — Stripe's business model requires owning the full stack. Direct connections cost hundreds of millions in compliance and bank relationship investment but give Stripe control over latency, uptime, and pricing. At Stripe's scale, the per-transaction savings from removing the intermediary processor pays for the direct connection investment.",
      },
      {
        question: 'CP vs AP for payment writes during network partitions',
        chosen: 'CP — block writes rather than risk inconsistency',
        reason:
          "During a network partition, allowing writes to proceed on both sides of the partition risks double-charging customers or losing charges entirely when partitions heal and conflicts must be resolved. There is no safe merge strategy for financial transactions — you cannot average two conflicting ledger states. Stripe accepts brief unavailability (503 errors) during partitions because merchants can retry; double-charges cannot be undone without destroying customer trust.",
      },
      {
        question: 'MySQL with Vitess vs NoSQL for primary payment storage',
        chosen: 'MySQL + Vitess horizontal sharding',
        reason:
          "ACID transactions are required for double-entry ledger correctness. MySQL provides serializable isolation and row-level locking. Vitess adds horizontal sharding by merchant_id, giving the throughput of a distributed system without sacrificing ACID semantics. NoSQL databases trade ACID for availability/throughput — an acceptable trade for social feeds or session state, but not for financial records where partial writes or stale reads cause real monetary losses.",
      },
      {
        question: 'Where to store idempotency keys: Redis vs database',
        chosen: 'Redis with TTL expiry',
        reason:
          "Idempotency key lookups must be sub-millisecond (they are on the critical path of every API call) and keys expire after 24 hours. Redis provides O(1) SET NX (set-if-not-exists) atomics — the exact primitive needed to implement 'store only if not seen before'. TTL-based expiry handles cleanup automatically. PostgreSQL could store idempotency keys but would add 5-10ms per lookup and require a separate cleanup job. Redis is the right tool for ephemeral, high-frequency key-value lookups.",
      },
    ],

    interview: [
      {
        q: 'How does Stripe ensure a payment is processed exactly once even when the API is retried?',
        a: "Stripe requires merchants to include an Idempotency-Key header (a merchant-generated UUID) with each API call. The API Gateway stores (api_key + idempotency_key) → response in Redis with 24-hour TTL before processing the charge. If the same key arrives again (network retry), the stored response is returned immediately without re-entering the payment flow. Critically, the key is stored BEFORE the charge is attempted — this ensures a server crash mid-processing means the retry sees a stored response (or no key yet, triggering a fresh attempt) rather than re-charging. The Payment Intent state machine provides a second layer: once a payment reaches SUCCEEDED, further charge attempts are rejected regardless of idempotency key.",
      },
      {
        q: 'How does Stripe achieve 99.999% uptime for payment processing?',
        a: "Multiple layers: (1) Multi-region active-active deployment on AWS — requests route to the nearest healthy region. (2) Synchronous cross-region PostgreSQL replication (synchronous_commit = remote_write) — a region can fail with zero data loss. (3) Stripe's direct card network connections remove third-party processor as a failure point. (4) The idempotency layer means even if an API call fails, retries safely recover. (5) The payment path is isolated from non-critical paths (webhooks, dashboard) — a webhook delivery system failure never impacts payment processing. 99.999% = < 5 minutes downtime/year, which requires no single point of failure anywhere in the payment critical path.",
      },
      {
        q: 'How does Stripe detect fraud in real time without adding more than 100ms to the payment flow?',
        a: "Stripe Radar is an ML model trained on Stripe's cross-merchant transaction graph — billions of transactions. The model runs as a synchronous step in the payment flow, called after card tokenization and before network authorization. Features are pre-computed and cached: card velocity (charges in last 1h/24h), device fingerprint from Stripe.js, email domain reputation, IP geolocation vs billing address. The model inference itself is fast (pre-loaded in memory, feature vectors pre-computed) — the < 100ms budget is achievable because feature computation is done offline/async, not at inference time. Cross-merchant data is Radar's biggest advantage: a fraudulent card used at one merchant updates the risk model globally within minutes, benefiting all merchants.",
      },
      {
        q: 'How does Stripe deliver 5 billion webhooks per day reliably to merchant servers?',
        a: "Webhooks are decoupled from the payment path entirely. When a payment succeeds, an event is written to Kafka (durable, replicated log). The Webhook Delivery Service consumes from Kafka and attempts HTTPS POST to the merchant's endpoint. Delivery uses exponential backoff: retry at 1m, 5m, 30m, 2h, 8h, 24h, 72h. Each attempt is recorded in PostgreSQL with status/response. Merchants can replay webhooks from the Dashboard (pull model as fallback). Key design: the delivery service is completely separate from the payment processing path — a merchant's slow or failing server never adds latency to payment API calls. 5B/day = ~57K/sec avg; the Kafka-backed queue absorbs spikes and provides durability guarantees — a webhook is never lost even if the delivery service restarts.",
      },
      {
        q: 'How does Stripe prevent double-charging a customer?',
        a: "Three complementary mechanisms work together. First, the idempotency key layer in Redis: the API Gateway performs SET NX (api_key:idempotency_key) before any processing begins — if the key already exists, the cached response is returned immediately. The SET NX is atomic; concurrent retries cannot both succeed. Second, the Payment Intent state machine: a PaymentIntent in SUCCEEDED state rejects any further charge attempt at the application layer — the state transition is guarded by a database row lock. Third, the card network authorization: Stripe submits a single authorization request per PaymentIntent ID to the card network — the network deduplicates on this ID. All three layers must fail simultaneously for a double charge to occur, making it effectively impossible under normal operation.",
      },
      {
        q: 'Why use a relational database (SQL) for payments instead of a NoSQL database?',
        a: "Payments require double-entry accounting: every charge atomically creates a debit record (customer owes money) and a credit record (merchant gains balance) in the same transaction. If the write partially fails — debit recorded but credit missing — the ledger is corrupt. SQL ACID transactions guarantee all-or-nothing writes with serializable isolation. NoSQL databases (DynamoDB, Cassandra, MongoDB) trade ACID for availability and horizontal scale — their eventual consistency models allow reads of stale data and do not support multi-document atomic writes without significant complexity. For a financial ledger, the throughput gains of NoSQL are not worth the correctness risk. Stripe achieves horizontal scale through Vitess sharding of MySQL — getting distributed throughput while retaining ACID guarantees within each shard.",
      },
    ],

    keyInsight:
      "Stripe's idempotency system is its most important correctness guarantee. By requiring merchants to send a stable idempotency key and storing the response before processing, Stripe converts the inherently non-idempotent act of charging a card into an idempotent API call. This single design decision eliminates an entire class of distributed systems bugs — double charges — that would otherwise require complex deduplication logic on both the merchant and Stripe side. Great API design is great distributed systems design.",
  },

  {
    id: 'robinhood',
    icon: '📈',
    name: 'Robinhood',
    color: '#00c805',
    scale: '23M funded accounts · 10B+ trades/year · real-time market data for 5,000+ securities',
    focus: 'Commission-Free Stock Trading, Real-Time Quotes & Order Routing',
    problem:
      "Design Robinhood's stock trading platform. A user places a market order; it must be routed to a broker-dealer, executed at NBBO (National Best Bid and Offer), and confirmed within 1 second during market hours. The system displays real-time stock quotes (updating every 200ms during market hours) for 5,000+ securities across 23M users. The platform must handle circuit breaker events (market-wide trading halts), options expiration days (massive order spikes), and must never accept an order that would violate regulatory requirements (PDT rule, margin limits).",

    functionalReqs: [
      'Users can view real-time quotes for stocks, ETFs, options, and crypto',
      'Place market orders, limit orders, stop orders, options orders; receive execution confirmation',
      'Portfolio view: current holdings, P&L (realized and unrealized), account value in real time',
      'Options chain: display all strikes, expirations with Greeks (delta, gamma, theta, vega) in real time',
      'Cash management: instant deposit (up to $1,000), ACH bank transfers, dividend reinvestment',
      'Regulatory compliance: enforce PDT (Pattern Day Trader) rule, margin requirements, options approval levels',
    ],

    nonFunctionalReqs: [
      {
        label: 'Order execution latency',
        value: '< 1 second from tap to execution confirmation during market hours',
      },
      {
        label: 'Quote update frequency',
        value: 'every 200ms during market hours for subscribed securities',
      },
      {
        label: 'Portfolio P&L',
        value: 'real-time update on every quote change for held securities',
      },
      {
        label: 'Availability',
        value:
          '99.99% during market hours (9:30 AM - 4:00 PM ET) — outages during market hours cause regulatory and legal exposure',
      },
      {
        label: 'Data accuracy',
        value:
          'quote data must match NBBO within 200ms; incorrect prices cause bad fills and regulatory violations',
      },
      {
        label: 'Risk checks',
        value: 'all orders must pass margin/PDT/options-level checks in < 50ms',
      },
    ],

    scaleEstimation: [
      {
        label: 'Active users during market open',
        value: '~5M',
        note: '23M total accounts, ~22% active on any given day',
      },
      {
        label: 'Quote updates/sec',
        value: '5,000 securities × 5 updates/sec = 25K quote events/sec from exchanges',
      },
      {
        label: 'Fan-out',
        value: '25K quote events × avg 10K subscribers/security = 250M push events/sec',
        note: 'only for actively-watched securities',
      },
      {
        label: 'Orders/day',
        value: '10B/year = ~27M/day = ~45K/sec at market open (first 30 minutes are peak)',
      },
      {
        label: 'Portfolio recalculations',
        value:
          '5M active users × 5,000 securities quote updates/sec — only affected users recalculate',
        note: 'sparse updates',
      },
      {
        label: 'Market data storage',
        value: '5,000 securities × 1 year tick data = ~500 GB/year compressed',
      },
    ],

    highLevelDesign: [
      {
        title: 'Market Data Ingestion',
        description:
          "Robinhood receives consolidated real-time quotes from SIP (Securities Information Processor) — the official US market data feed. The SIP aggregates quotes from all 13 US stock exchanges. Raw tick data arrives via UDP multicast at 25K+ updates/sec. Robinhood's market data service normalizes, deduplicates, and publishes to an internal Kafka topic. Downstream services (quote API, options pricing, portfolio P&L) consume from Kafka.",
      },
      {
        title: 'Real-Time Quote Distribution',
        description:
          'Each security has a set of subscribed users (users viewing that stock\'s page). When a quote update arrives, the system must push to all subscribed users via WebSocket. The Quote Fan-out Service maintains a subscription registry: (security_id → list of user WebSocket connections). On a quote update, it fans out to all subscribers. At 25K updates/sec with avg 10K subscribers each = 250M fan-out events/sec — this is the highest-throughput operation.',
      },
      {
        title: 'Order Entry & Risk Checks',
        description:
          "User submits order → Risk Engine checks: (1) account has sufficient buying power (margin/cash), (2) PDT rule compliance (< 3 day trades per 5 days for < $25K accounts), (3) options approval level (level 1 = covered calls only, level 3 = naked options). Risk checks run in < 50ms using account state cached in Redis. If all checks pass, the order is sent to Robinhood's broker-dealer partner (Apex Clearing) via FIX protocol.",
      },
      {
        title: 'Order Routing & Execution (PFOF)',
        description:
          "Robinhood routes orders to market makers (Citadel Securities, Virtu) via Payment For Order Flow (PFOF). Market makers execute the order at NBBO or better and pay Robinhood a small fee per share. Execution confirmation returns via FIX in < 500ms. The Trade Service writes the execution to PostgreSQL (trade record with price, shares, timestamp) and updates the user's portfolio in Redis. A push notification is sent to the user's device.",
      },
      {
        title: 'Portfolio P&L Engine',
        description:
          "Each user's portfolio = list of (security, shares, avg_cost_basis). When a quote updates, P&L = (current_price - avg_cost) × shares. With 5M active users holding an avg 10 securities each = 50M position calculations needed per quote update. The P&L Engine maintains positions in Redis and runs vectorized batch calculations on quote updates. Only securities with active subscribers trigger recalculation — not all 50M positions on every tick.",
      },
    ],

    deepDive: [
      {
        title: 'The PDT rule enforcement — distributed counter problem',
        description:
          'The Pattern Day Trader rule: if you execute 4+ day trades (buy and sell same security same day) in a 5-day rolling window with < $25K account, your account is flagged and restricted to cash trades for 90 days. Robinhood must enforce this in real time — an order that would violate PDT must be rejected before submission. Implementation: a Redis sorted set per user stores (trade_id, timestamp) for day trades in the last 5 days. On order submission, ZCOUNT in the time window returns day trade count. If ≥ 3, the order is rejected with a PDT warning.',
        insight:
          'Financial regulations create hard real-time constraints on order systems. The PDT check is not optional — Robinhood has regulatory obligation to enforce it. This means the check must be synchronous in the order path, not async, adding a Redis round-trip to every order.',
      },
      {
        title: 'Market circuit breakers — halting the system',
        description:
          "When market-wide circuit breakers trigger (S&P 500 drops 7%, 13%, or 20%), all trading halts for 15 minutes to 1 day. Robinhood must immediately cancel all open orders and stop accepting new ones. Implementation: a global circuit_breaker_active flag in Redis. The order entry service checks this flag on every order — a single Redis GET. When FINRA/SEC broadcasts a halt, Robinhood's market data service flips the Redis flag. All order submissions instantly return TRADING_HALTED. Open orders are cancelled via a sweep job. Resuming requires flipping the flag back and reprocessing queued limit orders at the re-open price.",
        insight:
          'Circuit breakers are a rare but critical path. The flag check adds < 1ms to every order — cheap insurance against accepting orders during a halt, which would create regulatory violations and impossible-to-fill positions.',
      },
      {
        title: 'Options Greeks computation at scale',
        description:
          'Options have 5 Greeks (delta, gamma, theta, vega, rho) that change with every underlying stock quote update. For 5,000 option chains with 50 strikes × 10 expirations = 2.5M option contracts, each needing Greek recalculation on every underlying tick. Black-Scholes computation is CPU-intensive. Robinhood batches Greeks calculations: when AAPL quote updates, the Options Pricing Engine batches all 5,000 AAPL option contracts and computes Greeks in parallel using vectorized NumPy operations (AVX2 SIMD instructions). A GPU-based pricing server handles the most active options chains. Results are cached in Redis with 200ms TTL — same as quote frequency.',
      },
      {
        title: 'The March 2020 outage — lessons learned',
        description:
          'On March 2-3, 2020, Robinhood went down for a full trading day during a historic market rally. Root cause: a DNS configuration issue cascading with database connection exhaustion during peak load. The outage revealed: (1) no graceful degradation — the entire app went down instead of degrading to read-only; (2) no circuit breakers between services — one failing service took down the entire backend; (3) insufficient load testing for extreme volatility scenarios. Post-outage: Robinhood implemented chaos engineering, added circuit breakers at every service boundary, built a read-only degraded mode (view portfolio but no trading), and paid $70M in settlements to affected customers.',
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          "Robinhood applies CAP differently depending on the data type. Trade execution and account positions choose CP strongly: executing a trade at the wrong price or executing the same order twice is a financial and regulatory disaster. Writes to position records use PostgreSQL transactions with serializable isolation — during a partition, the system returns an error rather than accepting an order that might execute inconsistently. Market data display (watchlist prices, quote tickers) chooses AP: if the latest AAPL price is 1 second stale, a user sees $189.23 instead of $189.31. This is acceptable — users understand quotes have inherent latency. The WebSocket fan-out service can serve slightly stale cached quotes during a partition rather than dropping the connection entirely. The boundary between CP and AP is the order submit button: everything before it (display) can be AP; everything after it (execution) must be CP.",
        insight:
          "CAP is not a single system-wide choice — it is a per-operation choice. Robinhood uses AP for read-heavy market data display (high availability matters more than freshness) and CP for write-heavy order execution (correctness matters more than availability).",
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          "Robinhood uses PostgreSQL for accounts, positions, and trade records — the financial source of truth. Foreign key constraints enforce referential integrity (a position must reference a valid account; a trade must reference a valid position). ACID transactions ensure that when a trade executes, the position update and trade record are written atomically. RocksDB (an embedded LSM-tree key-value store) serves the internal order book: it provides microsecond-level read latency for order lookups during the matching process, and its sequential write performance handles the burst of limit orders at market open. Kafka serves as the durable event streaming backbone: the trade execution pipeline (order received → risk check passed → routed to market maker → execution confirmed → position updated → notification sent) is modeled as a Kafka topic partitioned by symbol, ensuring all events for a given symbol are ordered and processed sequentially by downstream consumers.",
        insight:
          "Polyglot persistence — using different databases for different data access patterns — is the norm in trading systems. PostgreSQL for ACID correctness, RocksDB for low-latency key-value reads, Kafka for ordered event streaming.",
      },
      {
        title: 'Message Broker & Event Streaming',
        description:
          "Robinhood's trade execution pipeline is modeled as a Kafka event stream. When a user submits an order, an order_created event is published to Kafka. The Risk Engine consumes this event, performs PDT/margin checks, and publishes order_risk_approved or order_risk_rejected. The Routing Service consumes order_risk_approved events and sends the order to market makers via FIX protocol. When execution confirmation returns, an order_executed event is published. The Position Update Service consumes order_executed events and updates PostgreSQL positions. The Notification Service consumes order_executed and pushes a confirmation to the user's device. The Kafka topic is partitioned by symbol — all events for AAPL go to the same partition, guaranteeing ordering of AAPL trades. This event-driven pipeline decouples each stage: if the notification service is slow, it does not delay position updates; if the analytics consumer is behind, it does not block execution.",
        insight:
          "Partitioning Kafka by trading symbol is critical for correctness: position updates for the same security must be applied in order. A buy followed by a sell must not be processed as sell-then-buy.",
      },
      {
        title: 'Networking & Security Architecture',
        description:
          "Robinhood runs on AWS VPC with strict security group rules: each service tier (web, application, database) lives in a separate subnet with explicit ingress/egress rules. No service can communicate outside its defined trust boundary. FIX (Financial Information eXchange) protocol connects Robinhood to market makers and eventually to exchanges — FIX is the industry-standard low-latency binary protocol for order routing, chosen for its sub-millisecond parse overhead and universal exchange support. WebSocket connections from mobile clients use TLS 1.3 with session resumption to minimize reconnection overhead during brief network interruptions (common on mobile). Real-time price streaming to clients flows through a dedicated WebSocket gateway tier, isolated from the order submission path — a surge in users loading charts cannot consume resources from the order processing path.",
        insight:
          "Separating the read path (quote streaming) from the write path (order submission) at the network level prevents read traffic spikes from degrading order latency — a critical isolation boundary during volatile market events.",
      },
    ],

    decisions: [
      {
        question: 'In-house clearing vs third-party clearing (Apex)',
        chosen: 'Third-party clearing (Apex), later building in-house (Robinhood Securities)',
        reason:
          'Clearing — the settlement of trades (actual money/stock movement) — requires DTCC membership, complex regulatory compliance, and massive capital reserves. Starting with Apex allowed Robinhood to launch without this infrastructure. As they scaled, Apex\'s fees became prohibitive and latency-sensitive features required direct control. Robinhood built its own clearing operation (Robinhood Securities) in 2018 — a multi-year, $100M+ investment.',
      },
      {
        question: 'WebSocket vs polling for real-time quotes',
        chosen: 'WebSocket',
        reason:
          'At 25K quote updates/sec for potentially 5M concurrent users, polling at 200ms intervals = 5M × 5 req/sec = 25M HTTP requests/sec. This would require 100K+ API servers. WebSocket maintains one persistent connection per user — the server pushes only when a quote the user is subscribed to changes. At 25K updates × avg 100 subscribers = 2.5M pushes/sec — 10× fewer operations than polling.',
      },
      {
        question: 'PFOF vs building a direct exchange connection',
        chosen: 'PFOF (Payment For Order Flow)',
        reason:
          "Building direct exchange connections (becoming a broker-dealer with direct market access) requires significant capital, exchange membership fees, and co-location infrastructure. PFOF monetizes the order flow while outsourcing execution to market makers who have this infrastructure. Trade-off: PFOF has been criticized for potential conflicts of interest (are market makers always giving best execution?). The SEC has scrutinized this model. Robinhood's business model depends on PFOF — this is the controversial but financially rational choice.",
      },
      {
        question: 'CP vs AP for trade execution vs market data display',
        chosen: 'CP for execution; AP for display',
        reason:
          "A split CAP strategy matches the risk profile of each operation. Executing a trade at a stale price or executing it twice is a regulatory violation and financial loss — CP (block the operation during partitions). Displaying a price that is 1 second stale causes no harm — AP (serve cached data, stay available). This split is implemented at the system boundary: the order submission endpoint uses PostgreSQL with synchronous writes; the quote WebSocket feed can serve Redis-cached values during degraded conditions.",
      },
      {
        question: 'PostgreSQL vs RocksDB vs Kafka for different data types',
        chosen: 'Polyglot persistence: PostgreSQL + RocksDB + Kafka',
        reason:
          "No single database serves all access patterns. PostgreSQL handles financial records requiring ACID and SQL joins. RocksDB handles order book state requiring microsecond key-value lookups (sequential writes, random reads on hot keys). Kafka handles the trade execution pipeline requiring ordered, replayable, partitioned event streaming. Using one database for all three would mean compromising on correctness, latency, or ordering guarantees — the polyglot approach gives each subsystem the right tool.",
      },
      {
        question: 'Synchronous vs event-driven trade execution pipeline',
        chosen: 'Event-driven via Kafka topics partitioned by symbol',
        reason:
          "A synchronous pipeline (risk check → route → execute → update position → notify, all in a single request) creates a fragile chain where any slow step blocks the entire flow. If the notification service is slow (push notification delivery to Apple/Google APNs can be slow), it delays position updates. Kafka decouples each stage: each service processes its Kafka partition independently at its own pace. Partitioning by symbol ensures per-symbol ordering without global ordering overhead.",
      },
    ],

    interview: [
      {
        q: 'How does Robinhood distribute real-time stock quotes to 5 million concurrent users?',
        a: "Robinhood ingests raw tick data from the SIP (Securities Information Processor) via UDP multicast at 25K+ updates/sec, normalizes it into Kafka. A Quote Fan-out Service maintains a subscription registry: for each security, the list of WebSocket connections currently subscribed (users viewing that stock's page). On a quote update from Kafka, the service fans out to all subscribers via their persistent WebSocket connections. The challenge is managing subscription state: users navigate between stocks constantly, so the registry must be updated in real time. At 25K updates × avg 10K subscribers = 250M fan-out events/sec at peak, the fan-out service is horizontally scaled, with each instance owning a shard of WebSocket connections. Consistent hashing routes users to the correct fan-out server.",
      },
      {
        q: 'How does Robinhood enforce the PDT rule in real time without adding significant latency to order submission?',
        a: "The PDT check uses a Redis sorted set per user: keys are trade_ids, scores are timestamps. When a day trade executes (same security bought and sold same day), an entry is added to the sorted set with ZADD. On each order submission, the risk engine runs ZCOUNT user:dayTrades (now-5days, now) — a single O(log N) Redis operation. If count ≥ 3 and account balance < $25K, the order is rejected with a PDT warning. The Redis round-trip adds ~1ms to order latency — within the 50ms risk check budget. The sorted set auto-expires entries via score-based range deletes on each query. This approach is idempotent (safe to re-run) and consistent across multiple app servers since state lives in Redis, not application memory.",
      },
      {
        q: 'How would you design the portfolio P&L calculation to update in real time as prices change?',
        a: "Each user's positions are stored in Redis as a hash: {security_id: (shares, avg_cost_basis)}. When a quote updates for security X, the P&L Engine looks up all users who hold X (a reverse index: security_id → list of user_ids with positions). For each user, P&L_X = (new_price - avg_cost) × shares — a simple multiply. The total portfolio value = sum of all position P&Ls. The reverse index is maintained in Redis sorted sets (security_id → user_ids). Only users who hold a security and are currently active (WebSocket connected) receive updates — this reduces 50M potential calculations to only those affecting active users with open positions. Updates are batched per security per 200ms tick window and pushed via WebSocket.",
      },
      {
        q: 'How do you handle a market-wide circuit breaker that requires immediately halting all trading?',
        a: "A global circuit_breaker_active flag in Redis acts as the kill switch. Every order submission begins with GET circuit_breaker:{market}. This single Redis read adds < 1ms. When FINRA/SEC broadcasts a halt, Robinhood's market data service (which consumes the same SIP feed that carries halt notifications) calls SET circuit_breaker:US 1 EX 900 (15-minute TTL for Level 1 halts). All new orders instantly return TRADING_HALTED. A background sweep job queries all open orders and cancels them via the clearing system. On resume, the flag is cleared and the order book is reconstructed. The read-only degraded mode (implemented post-March 2020) allows users to view portfolios and quotes even if the order submission path is halted — preventing the worst user experience of a completely dark app.",
      },
      {
        q: 'How does Robinhood handle the trade execution pipeline from order submission to position update?',
        a: "The trade execution pipeline is modeled as a Kafka event stream partitioned by trading symbol. When a user submits an order, an order_created event is published to the AAPL partition (if buying AAPL). The Risk Engine consumes from this partition, performs synchronous PDT/margin checks against Redis-cached account state, and publishes order_risk_approved. The Routing Service consumes this, sends the order to the market maker via FIX protocol, and waits for execution confirmation (< 500ms). On confirmation, it publishes order_executed with price/shares/timestamp. The Position Update Service consumes order_executed, updates PostgreSQL positions in a transaction, and publishes position_updated. The Notification Service consumes order_executed and sends a push notification. Partitioning by symbol guarantees that all events for AAPL are processed in order — a buy cannot be processed after a sell that came before it.",
      },
      {
        q: 'Why does Robinhood use a relational database for accounts and positions rather than a NoSQL database?',
        a: "Account and position data has strict relational integrity requirements. A position must reference a valid account (foreign key). A trade must reference a valid position. When an order executes, three things must happen atomically in a single transaction: (1) deduct buying power from the account, (2) create the position record (or update shares), (3) create the trade record. If any step fails, all must roll back. NoSQL databases do not support multi-document ACID transactions without application-level complexity that reintroduces all the failure modes SQL prevents. PostgreSQL provides the ACID guarantees, foreign key constraints, and SQL queryability needed for regulatory reporting (every trade must be queryable for FINRA audits). Redis is used for caching account state for the hot path (risk checks) — it is a cache layer on top of PostgreSQL, not a replacement.",
      },
    ],

    keyInsight:
      "Robinhood's core engineering challenge is the quote fan-out problem: 25K quote updates per second must reach millions of subscribed users. The solution — WebSocket subscriptions with server-side fan-out — requires knowing which users are watching which security at any moment and maintaining that subscription registry consistently as users navigate the app. This subscription tracking problem is harder than the quote delivery itself. Every real-time system's complexity lives in managing the subscription state, not the event delivery.",
  },
];
