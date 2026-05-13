import { RealWorldSystem } from '../types';

export const REALWORLD_SEARCH: RealWorldSystem[] = [
  {
    id: 'google-search',
    icon: '🔍',
    name: 'Google Search',
    color: '#4285f4',
    scale: '8.5B searches/day · 100B+ web pages indexed · < 200ms query latency',
    focus: 'Web Crawling, Indexing & Sub-200ms Query at Planetary Scale',
    problem:
      'Design Google Search. The system must crawl and index the entire public web (100B+ pages), keep the index fresh (breaking news indexed within minutes), return ranked results for any query in under 200ms, and serve 8.5 billion searches per day. The core engineering challenges are: how to crawl 100B pages efficiently, how to build an inverted index at this scale, and how to rank results by relevance in milliseconds.',
    functionalReqs: [
      'Crawl the public web continuously, discovering new and updated pages',
      'Index page content so any word can be looked up instantly',
      'Return the top 10 most relevant results for a query in under 200ms',
      'Handle special query types: image search, news (real-time), shopping, maps snippets',
      'Autocomplete: suggest query completions as the user types',
      'Safe Search: filter explicit content based on user preference',
    ],
    nonFunctionalReqs: [
      { label: 'Query latency', value: 'p50 < 100ms, p99 < 500ms for global queries' },
      { label: 'Index freshness', value: 'Breaking news pages indexed within 10 minutes; regular pages within 1 week' },
      { label: 'Scale', value: '8.5B queries/day = ~98K queries/sec average; 200K+/sec peak' },
      { label: 'Crawl throughput', value: 'Billions of pages per day re-crawled continuously' },
      { label: 'Index size', value: '100B+ pages × ~10KB extracted text = ~1 PB compressed inverted index' },
      { label: 'Availability', value: '99.999% — Google Search going down is global news' },
    ],
    scaleEstimation: [
      { label: 'Queries/day', value: '8.5B', note: '~98K/sec avg; 200K/sec during news events' },
      { label: 'Web pages indexed', value: '100B+', note: "Google's index covers ~15% of the estimated 5T total URLs" },
      { label: 'Index size', value: '100B pages × 10KB text avg = 1 PB', note: 'Compressed with delta encoding + Huffman' },
      { label: 'Crawl rate', value: '~20B pages/day re-crawled', note: 'Fresh pages get higher crawl frequency' },
      { label: 'PageRank computation', value: 'Iterative over 100B-node graph', note: 'Runs offline on dedicated Bigtable cluster' },
      { label: 'Serving machines', value: 'Estimated 1M+ servers globally', note: 'Google never discloses actual count' },
    ],
    highLevelDesign: [
      {
        title: 'Web Crawler (Googlebot)',
        description:
          'A distributed crawler with billions of concurrent HTTP requests. URL Frontier maintains a priority queue of URLs to crawl (prioritized by PageRank, freshness, and crawl budget). Politeness constraints: max one request per domain per second. Crawled HTML is parsed for links (new URLs added to frontier) and text (sent to indexing pipeline). Content deduplication via SimHash removes near-duplicate pages.',
      },
      {
        title: 'Inverted Index (BigTable + Colossus)',
        description:
          'Each word maps to a posting list: sorted list of (docId, TF-IDF score, position). The index is partitioned into shards by document ID (DocIndex shards) and by word hash (TermIndex shards). Google\'s index is stored on Bigtable (distributed sorted KV store) backed by Colossus (Google\'s distributed filesystem). The entire index is replicated across multiple data centers.',
      },
      {
        title: 'Query Processing Pipeline',
        description:
          'Query → tokenization + spelling correction (did you mean?) → query expansion (synonyms) → retrieval: fan out to TermIndex shards to fetch posting lists for each query term → intersection + ranking → top-K extraction → serving. All of this completes in < 200ms via massive parallelism (thousands of machines process one query simultaneously).',
      },
      {
        title: 'PageRank & Ranking Signals',
        description:
          'PageRank is computed offline via iterative graph traversal over the web link graph (stored in Bigtable). It is one of 200+ ranking signals. Others: TF-IDF, anchor text, freshness, user engagement signals (CTR from Search Console), page experience (Core Web Vitals), E-E-A-T (expertise, authority, trust). Ranking uses a learned model (RankBrain / MUM) that combines signals via ML.',
      },
      {
        title: 'Serving Infrastructure (GFS + Bigtable + Spanner)',
        description:
          'Query results are assembled from: TermIndex shards (posting lists), DocIndex shards (page metadata, snippets), KnowledgeGraph (entity answers), and Ads backend. Results are merged by a central aggregator and returned as a SERP (Search Engine Results Page). The entire pipeline runs on Google\'s custom hardware with custom network fabric (Jupiter) and custom OS (gVisor for isolation).',
      },
    ],
    deepDive: [
      {
        title: 'The inverted index and how a query retrieves results',
        description:
          'For a query "distributed systems book", the system looks up posting lists for "distributed", "systems", and "book" — each a list of hundreds of millions of docIds with scores. The engine intersects these lists (AND semantics) or unions them (OR), picks the top-10,000 by TF-IDF score, then re-ranks by the full 200-signal ranking function. This intersection is O(min posting list size) using skip pointers. The speed comes from massive parallelism: 1,000 machines each handle a shard of the index simultaneously.',
        insight:
          'The inverted index is the same data structure as a database index, but at 100B-document scale with 1M+ distinct terms per language. The engineering challenge is not the algorithm — it\'s fitting it in RAM across thousands of machines.',
      },
      {
        title: 'Freshness — how breaking news appears in minutes',
        description:
          'Google operates a "Caffeine" pipeline alongside the main index. When Googlebot discovers a new or changed page (detected via HTTP Last-Modified header or sitemap ping), it enters a fast-index pipeline that pushes the document to a real-time index layer (separate from the main inverted index). Queries first hit the real-time layer, then the main index. Results are merged. The real-time layer holds ~1B documents — the freshest 1% of the web.',
        insight:
          'Two indexes are better than one. Keeping a small, fast-updating real-time index separate from a large, slower-updating main index lets Google provide freshness without rebuilding the entire 1 PB index on every change.',
      },
      {
        title: 'Autocomplete at 98K queries/sec',
        description:
          'Every keystroke triggers an autocomplete request. Autocomplete predictions are precomputed: Google runs MapReduce over all search queries (anonymized) to count query prefix frequencies. Top completions per prefix are stored in a trie (compressed prefix tree) in RAM on autocomplete servers. A prefix lookup returns the top 10 completions in O(prefix length). Personalization adjusts ordering based on the user\'s search history. The trie for English queries fits in ~50 GB RAM — replicated across all edge PoPs globally for < 20ms TTFB.',
      },
      {
        title: 'Handling 200K queries/sec — load balancing and data center routing',
        description:
          'Google routes each query to the nearest data center via Anycast DNS. Within a data center, a Query Router distributes across leaf servers. Each leaf server handles a slice of the inverted index — a query fans out to all relevant shards in parallel (scatter) and the router merges results (gather). Google\'s custom network fabric (Jupiter) provides 1.3 Pbps bisection bandwidth within a data center, enabling this scatter-gather at microsecond network latency.',
        insight:
          "Google's network is the performance enabler. The reason 1,000 machines can collaborate on one query in < 200ms is because intra-DC network latency is 10 microseconds — not 10 milliseconds.",
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          'Google Search is an AP system — it favors Availability and Partition Tolerance over strict Consistency. A crawled page from yesterday appearing in results today is perfectly acceptable; users never notice. If a data center is partitioned, Google continues serving results from the local index replica rather than refusing queries. Index replicas across regions may be slightly out of sync — one region might have a newer crawl of a page than another. This staleness is the deliberate trade-off. The only place Google enforces strong consistency is in Spanner, used for ads and billing — where a double-charge or missed revenue event is unacceptable.',
        insight:
          'Choosing AP for the index means Google can serve every query even under network partitions or partial data center failures. The user sees a result that is a few hours old instead of seeing an error. Availability wins over real-time consistency for search.',
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          'Google uses Bigtable (NoSQL wide-column store) for the web index — key is a URL hash, value is the full page data, posting list entries, and metadata. Bigtable scales horizontally to petabytes with no schema constraints, perfect for heterogeneous web pages. For ads and billing, Google uses Spanner — a NewSQL database providing globally distributed ACID transactions with external consistency. Spanner uses TrueTime (GPS + atomic clocks) to order transactions globally, enabling serializable reads and writes across continents. The rule: unstructured, write-heavy, enormous scale → Bigtable (NoSQL); financial correctness, global transactions → Spanner (NewSQL).',
        insight:
          'Bigtable and Spanner solve different problems. Bigtable trades schema flexibility for scale; Spanner trades simplicity for global ACID correctness. Using both in one system is the right answer when requirements diverge.',
      },
      {
        title: 'Message Broker & Event Architecture',
        description:
          'Google uses Cloud Pub/Sub as the backbone of its crawl pipeline. When Googlebot fetches a page, it publishes a crawl event to a Pub/Sub topic. Multiple downstream subscribers — the indexer, the PageRank updater, the spam detector, the freshness scorer — each receive a copy and process independently. This fan-out pattern decouples the crawler from all downstream systems. A slow indexer does not block the crawler; messages are durably queued. The crawl queue itself is managed via Pub/Sub, allowing millions of URL-fetch events per second to be distributed across crawler worker fleets without a central coordinator.',
        insight:
          'Pub/Sub turns the crawler pipeline from a tight sequential chain into a loosely coupled event-driven system. Each stage scales independently. Adding a new consumer (e.g., a malware detector) requires zero changes to the crawler — just subscribe to the topic.',
      },
      {
        title: 'Networking & Global Distribution',
        description:
          'Google uses Anycast routing so that every user query is automatically directed to the nearest data center — no per-user routing logic required. The same IP address is announced from dozens of locations; BGP routing picks the shortest path. On top of this, Google developed QUIC (now an IETF standard) to replace TCP for web traffic — QUIC eliminates the TCP three-way handshake and TLS round-trips, reducing connection setup from 3 RTTs to 0 RTTs for repeat connections. Globally, Google operates a private backbone network (B4) connecting its data centers with multi-terabit capacity, bypassing the public internet for inter-DC traffic.',
        insight:
          'Anycast means Google does not need geo-DNS lookup tables to route users — the network infrastructure does it automatically. QUIC means mobile users on high-latency connections see dramatically faster search results because connection overhead is eliminated.',
      },
    ],
    decisions: [
      {
        question: 'Build custom distributed filesystem vs use HDFS/existing',
        chosen: 'Build GFS (Google File System), then Colossus',
        reason:
          "At the time (2003), no distributed filesystem handled Google's scale (petabytes, billions of files, write-once/read-many access pattern). GFS was designed around Google's workload: large sequential writes (crawl output), large sequential reads (MapReduce), rare small random reads. HDFS was later designed from GFS's paper. Building custom allowed Google to optimize for exactly their access patterns and hardware failure model.",
      },
      {
        question: 'ML ranking (RankBrain) vs hand-tuned signal weighting',
        chosen: 'ML ranking (learned model)',
        reason:
          'Hand-tuning 200+ signals required 1,000+ engineers constantly adjusting weights. RankBrain (2015) replaced hand-tuned weights with a neural network that learns optimal weighting from user click data. It handles long-tail queries (15% of daily queries are never-before-seen) where hand-tuning is impossible — the model generalizes. Trade-off: ML models are less interpretable, making debugging ranking bugs harder.',
      },
      {
        question: 'Centralized index vs sharded-by-doc vs sharded-by-term',
        chosen: 'Sharded by document ID (DocIndex) and separately by term (TermIndex)',
        reason:
          'Sharding by document lets each shard score all terms for its documents independently. Sharding by term lets each shard return posting lists for one query term independently. Google uses both: TermIndex shards for posting list retrieval, DocIndex shards for document metadata. This two-level sharding allows independent scaling of retrieval (term lookup) vs. serving (snippet generation).',
      },
      {
        question: 'AP vs CP for the web index under network partition',
        chosen: 'AP — serve stale index rather than refuse queries',
        reason:
          'A user seeing a result that is a few hours old is vastly better than seeing an error page. Google replicates the index across regions; under a partition, each region serves its local replica. Index staleness of hours is undetectable by users. The only exception is the real-time index for breaking news, which uses stronger synchronization — but even there, a stale result beats an outage.',
      },
      {
        question: 'NoSQL (Bigtable) vs NewSQL (Spanner) for different workloads',
        chosen: 'Bigtable for index storage, Spanner for ads/billing',
        reason:
          'The web index is write-heavy, schema-free, and too large for relational constraints — Bigtable handles petabytes horizontally. Ads and billing require globally consistent ACID transactions (a click must be charged exactly once, globally) — Spanner provides this with TrueTime. The key insight is that not all data in one system needs the same database; pick the right store for each access pattern.',
      },
      {
        question: 'Pub/Sub event architecture vs direct RPC calls between crawler and indexer',
        chosen: 'Pub/Sub fan-out for the crawl pipeline',
        reason:
          'Direct RPC couples the crawler to every downstream consumer. If the indexer is slow or offline, the crawler blocks. Pub/Sub queues messages durably — the crawler publishes and moves on; the indexer processes at its own pace. Fan-out allows multiple independent consumers (indexer, spam detector, freshness scorer) without any crawler changes. The trade-off is eventual processing vs. synchronous confirmation, which is acceptable for indexing.',
      },
    ],
    interview: [
      {
        q: "How would you design Google Search's web crawling system?",
        a: 'Start with a URL Frontier — a distributed priority queue of URLs to crawl, prioritized by PageRank and freshness signals. Googlebot fetches pages in parallel across thousands of crawler machines, respecting politeness (one request/domain/second via crawl budget). Parsed HTML extracts links (fed back to frontier) and text (sent to indexing pipeline). SimHash deduplication removes near-duplicate pages before indexing. The frontier itself is stored in Bigtable, partitioned by domain to enforce politeness at scale.',
      },
      {
        q: 'How does Google return search results in under 200ms across a 100B-page index?',
        a: 'Massive parallelism. A query fans out to thousands of TermIndex shard machines simultaneously — each returns posting lists for the query terms from its slice of the index. A central aggregator intersects and ranks the top results from all shards. The scatter-gather completes in < 200ms because Google\'s intra-datacenter network (Jupiter) provides 10-microsecond latency, and each shard operation is O(posting list size / num_shards). No single machine handles the full index.',
      },
      {
        q: 'How does Google keep its index fresh for breaking news?',
        a: 'Google runs two indexes in parallel: a large main index (100B pages, updated over days/weeks) and a small real-time index (~1B pages, updated in minutes). When Googlebot detects a changed page via HTTP Last-Modified or sitemap ping, it enters the fast Caffeine pipeline and is pushed to the real-time index. Queries hit both indexes and results are merged. The real-time index covers only ~1% of the web but contains the most time-sensitive content. This dual-index design means freshness does not require rebuilding the entire 1 PB main index.',
      },
      {
        q: 'How does autocomplete work at Google Search\'s scale?',
        a: 'Completions are precomputed offline: MapReduce over anonymized query logs counts prefix frequencies. Top completions per prefix are stored in a compressed trie (~50 GB RAM) on autocomplete servers replicated at every edge PoP. Each keystroke hits the nearest PoP via Anycast, does an O(prefix length) trie lookup, returns top 10 completions in < 20ms. Personalization re-ranks based on user history at serve time.',
      },
      {
        q: 'Is Google Search CP or AP — and why?',
        a: "Google Search is AP. Under a network partition, Google serves results from the local index replica rather than refusing queries. Index replicas across regions may differ by hours — a page crawled in one region may not yet appear in another. This staleness is acceptable because users cannot detect a result that is a few hours old. The only CP component is Spanner for ads and billing, where a double-charge is unacceptable. For search itself, availability always beats consistency.",
      },
      {
        q: 'Why does Google use Bigtable for the web index instead of a relational database?',
        a: 'The web index is petabyte-scale, schema-free (every web page has different structure), and write-heavy (billions of pages re-crawled continuously). Relational databases cannot scale horizontally to petabytes without massive sharding complexity, and enforcing a schema on heterogeneous web content is impractical. Bigtable stores key-value pairs where the key is a URL hash and the value is arbitrary page data — no schema, infinite horizontal scale, and optimized for the large sequential reads that the query engine performs when fetching posting lists.',
      },
    ],
    keyInsight:
      "Google Search scales through massive parallelism, not faster machines. A single query fans out to thousands of index-shard machines simultaneously, each returning their top results, which are then merged. The inverted index — a 200-year-old library science concept — is still the core data structure. Google's engineering achievement is making it work at 100 billion documents with sub-200ms latency by distributing the lookup across a data center's worth of RAM.",
  },
  {
    id: 'amazon-ecommerce',
    icon: '📦',
    name: 'Amazon',
    color: '#ff9900',
    scale: '300M+ customers · 12M+ products · $500B+ GMV/year · Prime delivery in 1-2 days',
    focus: 'Product Search, Cart, Orders & Inventory at E-Commerce Scale',
    problem:
          "Design Amazon's e-commerce platform. A customer searches for a product, sees real-time inventory availability and price, adds to cart, and completes checkout. The system handles 300M customers, 12M+ product listings, Black Friday peaks of 300K orders/minute, real-time inventory (to prevent overselling), and 1-2 day Prime delivery SLAs that depend on correct warehouse routing at order time.",
    functionalReqs: [
      'Product search with filters (category, price, rating, Prime-eligible) returning results in < 500ms',
      'Product detail page shows real-time price, inventory count, delivery estimate by zip code',
      'Shopping cart persists across sessions and devices; handles concurrent updates (two tabs)',
      'Checkout: address → payment → order confirmation → inventory reserved atomically',
      'Order tracking: real-time status from placement through warehouse pick/pack/ship to delivery',
      'Seller platform: third-party sellers list products, set prices, manage inventory (Marketplace)',
    ],
    nonFunctionalReqs: [
      { label: 'Search latency', value: '< 500ms for product search results' },
      { label: 'Inventory accuracy', value: '< 1% oversell rate — running out of stock mid-order is critical failure' },
      { label: 'Checkout latency', value: '< 3 seconds from "Place Order" to confirmation' },
      { label: 'Peak throughput', value: '300K orders/minute on Black Friday (5,000 orders/sec)' },
      { label: 'Availability', value: '99.99% — Amazon losing checkout for 1 minute = millions in lost revenue' },
      { label: 'Price consistency', value: 'Price at checkout matches price when customer added to cart (within session)' },
    ],
    scaleEstimation: [
      { label: 'Orders/day', value: '~20M avg', note: '300K/min = 5,000/sec peak on Black Friday' },
      { label: 'Product listings', value: '12M+ Amazon-owned + 350M+ Marketplace SKUs', note: '~362M total SKUs' },
      { label: 'Search queries/day', value: '~2B (multiple searches per customer session)', note: '~23K/sec avg' },
      { label: 'Inventory writes', value: '5,000 orders/sec × avg 2 items/order = 10K inventory decrements/sec at peak' },
      { label: 'Cart reads', value: '300M customers × 3 sessions/day = 900M cart reads/day = ~10K/sec' },
      { label: 'Warehouse events', value: '20M orders × 5 status updates = 100M tracking events/day' },
    ],
    highLevelDesign: [
      {
        title: 'Product Search (A9 Algorithm + Elasticsearch)',
        description:
          "Amazon's A9 search engine ranks products by a combination of relevance (keyword match in title/description) and business metrics (conversion rate, revenue per impression, ad bids). The index is built on Elasticsearch with custom ranking layers. Filters (Prime, price range, rating) are applied as ES bool filters. Results include real-time price from a separate Price Service and inventory availability from the Inventory Service.",
      },
      {
        title: 'Inventory Service (strong consistency)',
        description:
          'Inventory is the most critical data — overselling is unacceptable. Each SKU\'s inventory count is stored in DynamoDB with conditional writes (optimistic concurrency): UPDATE inventory SET count = count - 1 WHERE count > 0 AND version = current_version. If the condition fails (concurrent update), retry. For high-velocity items (limited sneaker drops), Amazon uses Redis-based inventory locks with Lua scripts for atomic decrement — zero-miss guarantee at the cost of Redis being the single source of truth.',
      },
      {
        title: 'Shopping Cart Service',
        description:
          'Cart is stored per user in DynamoDB (user_id → cart items list). Cart is eventually consistent — two concurrent "add to cart" operations from different devices may both succeed (union semantics). Price shown in cart is fetched fresh from Price Service on each cart load — not stored in cart (prevents price mismatch at checkout). Cart items have no inventory reservation — reservation happens only at checkout.',
      },
      {
        title: 'Checkout & Order Service (two-phase commit substitute)',
        description:
          'Checkout triggers: (1) Inventory reservation via conditional write (decrement + lock) — if any item fails, abort; (2) Payment charge via Stripe/Amazon Pay; (3) Order record created in RDS (MySQL) — order_id, items, prices, shipping address; (4) Fulfillment event emitted to Kafka → Warehouse Management System picks the fulfillment center based on inventory location + delivery promise. The entire flow is orchestrated by a SAGA pattern with compensating transactions for failure.',
      },
      {
        title: 'Order Tracking & Delivery Estimate',
        description:
          'Each order has a state machine: PLACED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED. State transitions are published to Kafka. The Tracking Service consumes events and updates DynamoDB (order_id → current state). The customer-facing tracking page polls the Tracking API. Delivery estimate at product page is computed by the Delivery Promise Engine: takes customer zip code, item location (which warehouse), and carrier SLA → returns "Arrives by Tuesday" within 100ms.',
      },
    ],
    deepDive: [
      {
        title: 'Inventory reservation — preventing overselling at 5,000 orders/sec',
        description:
          'The naive approach (read inventory, check > 0, decrement) has a TOCTOU race: two threads read count=1, both see count > 0, both decrement → count = -1 = oversell. Amazon solves this with DynamoDB conditional writes: the decrement only succeeds if count > 0 AND the optimistic version matches. Lost updates retry. For flash sales (1M people buying 1,000 units), DynamoDB would be overwhelmed with retries. Amazon uses Redis DECR with a Lua script: atomically decrement if count > 0, else return error. Redis handles 1M ops/sec on a single node — no retries needed.',
        insight:
          "The inventory problem is a distributed counter decrement under contention. Redis's single-threaded command execution eliminates the race condition entirely — no locks, no retries, no TOCTOU.",
      },
      {
        title: 'A9 ranking — why conversion rate beats keyword relevance',
        description:
          "Amazon's A9 search ranks products primarily by revenue per impression — how much money Amazon makes when this product is shown. A product with perfect keyword relevance but a 0.5% conversion rate ranks below a product with partial keyword relevance but a 5% conversion rate. This is fundamentally different from Google Search (which optimizes for user satisfaction). The business implication: sellers must optimize conversion rate (reviews, photos, price, Prime badge) to rank, not just keyword stuff their titles.",
        insight:
          "A9 optimizes for Amazon's revenue, not user relevance. This alignment of search ranking with business outcome is why Amazon's search monetization is so effective — the algorithm and the business model are the same objective function.",
      },
      {
        title: 'The Delivery Promise Engine — "Arrives by Tuesday" in 100ms',
        description:
          "This is one of Amazon's most complex systems. Inputs: customer zip → shipping zone, item → warehouse (which of 200+ fulfillment centers has stock), carrier → SLA (UPS ground from warehouse X to zip Y = 2 days), current time → cutoff (order by 6PM to ship today). The engine precomputes warehouse-to-zip transit times for all carrier/speed combinations and stores in a lookup table (~50 GB) in Redis. A promise query = three Redis lookups: find nearest warehouse with stock, look up transit time, add shipping cutoff. Result in < 50ms. This single feature drives massive Prime conversion — customers buy more when they know exactly when it arrives.",
      },
      {
        title: 'Black Friday — 300K orders/minute',
        description:
          "Amazon's peak is 40× their daily average. Pre-Black Friday preparation: (1) load tests at 200% of expected peak; (2) pre-warm Auto Scaling groups to 3× normal capacity; (3) increase DynamoDB provisioned capacity 10× on inventory tables; (4) pre-position popular items closer to high-demand zip codes; (5) circuit breakers on all third-party integrations (shipping APIs, payment processors) with local fallbacks. During peak: shed non-critical features (recommendations, reviews loading) to free capacity for the checkout path. Amazon's GameDay program runs fake Black Friday events quarterly to find capacity and failure mode surprises before the real thing.",
      },
      {
        title: 'CAP Theorem Trade-off',
        description:
          'Amazon applies CAP differently to different parts of the platform. Inventory and orders are CP — the system must not oversell, so Amazon enforces ACID transactions at checkout. If a network partition prevents confirming inventory, the checkout fails rather than risking an oversell. Cart and product catalog are AP — if a partition occurs, users can still browse and add to cart with potentially stale prices (seconds old). A product showing last night\'s price for a few seconds is acceptable; selling an item that does not exist in stock is not. This mixed CP/AP architecture is deliberate: enforce strong consistency only where the cost of inconsistency (oversell, double-charge) exceeds the cost of unavailability (failed checkout).',
        insight:
          'One system can be both CP and AP for different data types. The key is identifying which data\'s inconsistency is catastrophic (inventory: oversell → CP) vs. merely annoying (catalog price: stale by seconds → AP).',
      },
      {
        title: 'Database Architecture: SQL vs NoSQL',
        description:
          'Amazon uses DynamoDB (NoSQL key-value) for cart and sessions: the access pattern is always "get cart by user_id" — a single-key lookup that DynamoDB serves in single-digit milliseconds at any scale. No joins needed. Cart data is schema-flexible (variable item counts). Aurora MySQL (SQL) is used for orders and payments: orders require ACID transactions (charge payment AND create order record atomically), relational joins (order → items → shipments), and audit trails with strong consistency. Elasticsearch powers product search — inverted index over 362M SKUs with faceted filtering. S3 stores product images and acts as a data lake for analytics. The rule: key-value, high-throughput, schema-flexible → DynamoDB; transactional, relational, audit → Aurora SQL.',
        insight:
          'Amazon uses four different storage systems in one checkout flow. Each is chosen for its access pattern, not convention. DynamoDB for speed, Aurora for correctness, Elasticsearch for search, S3 for blobs.',
      },
      {
        title: 'Message Broker & Event Architecture',
        description:
          'Amazon uses SQS to decouple checkout from fulfillment: when an order is placed, a message is enqueued in SQS. The Warehouse Management System (WMS) consumes messages at its own pace — if a fulfillment center is temporarily slow, orders queue in SQS rather than blocking checkout. SNS handles fan-out notifications: one order event triggers email confirmation, SMS update, and seller notification simultaneously via SNS topic subscriptions. Kinesis ingests clickstream data (every product view, add-to-cart, search query) for real-time analytics and personalization model training. Kafka powers internal event streaming for order state machine transitions — each status change (PLACED → SHIPPED) is a Kafka event consumed by tracking, analytics, and seller dashboards.',
        insight:
          'SQS decouples rate — checkout runs at 5,000 orders/sec; fulfillment runs at warehouse capacity. SNS decouples fan-out — one event reaches many consumers without the publisher knowing who they are. Kinesis decouples analytics — clickstream processing never slows down the purchase flow.',
      },
      {
        title: 'Networking & Global Distribution',
        description:
          'Amazon uses CloudFront CDN to serve all static assets (product images, JS bundles, CSS) from 450+ edge locations globally — a product image loads from a PoP 5ms away, not a US-East data center 200ms away. Route 53 uses latency-based routing to direct API requests to the AWS region with lowest measured latency for that customer. Amazon operates an active-active multi-region architecture for critical services: checkout runs simultaneously in us-east-1, us-west-2, and eu-west-1. If one region fails, Route 53 health checks detect it within 10 seconds and reroute traffic to a healthy region — no manual intervention. Regional failover without active-active would require cold-start time that costs millions per minute during a Black Friday outage.',
        insight:
          'Active-active multi-region means both regions are always serving traffic. Failover is instantaneous because the backup region is already warm. The cost is keeping data synchronized across regions — Amazon uses DynamoDB Global Tables for cart data, which replicates across regions in under 1 second.',
      },
    ],
    decisions: [
      {
        question: 'DynamoDB vs RDS for orders vs inventory',
        chosen: 'DynamoDB for inventory (speed + scale), RDS (MySQL) for orders (relational, audit)',
        reason:
          'Inventory needs 10K conditional writes/sec at peak — DynamoDB scales to this horizontally. Orders need relational queries (customer order history, joins with shipping), ACID transactions (payment + order atomicity), and are relatively low volume (5,000/sec) — MySQL handles this on sharded RDS. Using both is the right tool for each job.',
      },
      {
        question: 'Cart reservation vs checkout reservation for inventory',
        chosen: 'Reserve only at checkout, not in cart',
        reason:
          "Users add items to cart and abandon 70%+ of the time. If Amazon reserved inventory at add-to-cart, 70% of inventory would be held by abandoned carts. Competitors' in-stock items would show as out-of-stock to other customers. The trade-off: a user might add to cart, return 2 hours later, and find the item out of stock at checkout. Amazon accepts this UX trade-off to maximize inventory availability and prevent artificial stockouts.",
      },
      {
        question: 'Microservices vs monolith for the e-commerce platform',
        chosen: 'Microservices (Amazon invented the pattern)',
        reason:
          'Amazon\'s 2002 "API Mandate" (Jeff Bezos\'s internal memo) required every team to expose their data via APIs and communicate only through those APIs. This forced decomposition: Cart Service, Inventory Service, Order Service, Pricing Service, etc., each independently deployable. This is what enabled AWS — teams building internal services discovered they could sell those services externally. The monolith was undeployable at Amazon\'s team size; microservices enabled independent velocity.',
      },
      {
        question: 'CP vs AP for inventory during network partition',
        chosen: 'CP for inventory and orders — fail the checkout rather than oversell',
        reason:
          'An oversell means fulfilling an order for an item that does not exist — a guaranteed customer complaint, refund, and reputation hit. A failed checkout is recoverable (the customer retries or calls support). Amazon enforces strong consistency for inventory decrements even at the cost of occasional checkout failures during partitions. For the product catalog and cart, AP is chosen — stale prices by seconds or missing a recent cart update is far less harmful than an oversell.',
      },
      {
        question: 'SQS vs direct RPC from checkout to fulfillment',
        chosen: 'SQS queue between checkout and warehouse management system',
        reason:
          'If checkout called the WMS directly via RPC and WMS was slow or down, checkout would block — a checkout failure during Black Friday is catastrophic. SQS decouples the two: checkout writes a message and confirms the order immediately. WMS processes at its own rate. If WMS falls behind, messages queue in SQS (durable, no data loss). The customer gets an order confirmation; fulfillment catches up. The trade-off is that WMS processing is asynchronous — the order is confirmed before fulfillment starts, which is the right trade-off.',
      },
      {
        question: 'CloudFront CDN vs origin-only serving for product images',
        chosen: 'CloudFront CDN for all static assets',
        reason:
          'Product pages load 20-50 images per page. Without a CDN, every image request hits an S3 origin in a single AWS region — a user in Europe adds 150ms round-trip to every image. CloudFront serves images from 450+ edge locations, reducing image load latency to < 10ms globally. The cost savings are also significant: CDN cache hits do not incur S3 data transfer fees. For a site with 2B product searches/day, CDN offload reduces origin bandwidth by 95%+.',
      },
    ],
    interview: [
      {
        q: 'How does Amazon prevent overselling when 10,000 people try to buy the last item simultaneously?',
        a: "Use conditional writes in DynamoDB: the inventory decrement only succeeds if count > 0 AND the optimistic version token matches — this prevents the TOCTOU race (two threads both reading count=1, both decrementing to -1). For flash sales with extreme contention (1M buyers, 1K units), use Redis with a Lua script for atomic DECR: Redis's single-threaded execution makes the check-and-decrement atomic without locks or retries, handling 1M ops/sec on a single node.",
      },
      {
        q: 'How does Amazon compute "Arrives by Tuesday" in under 100ms at product page load?',
        a: "Precompute everything. The Delivery Promise Engine precomputes transit times for every warehouse-to-zip-code combination across all carriers and speeds (~50 GB lookup table stored in Redis). At query time: three Redis lookups — find nearest warehouse with stock for the item, look up warehouse-to-customer-zip transit time, add shipping cutoff time for today. Total: < 50ms. The key insight is that this is a lookup problem, not a computation problem — the heavy computation runs offline on order data.",
      },
      {
        q: "How does Amazon's A9 search rank 362 million products?",
        a: "A9 ranks by revenue per impression — the product of relevance score and conversion rate. Unlike Google (which optimizes for user satisfaction), A9 optimizes for Amazon's business outcome. The index is built on Elasticsearch with custom re-ranking layers that inject business signals: conversion rate, revenue per impression, sponsored bid amounts, Prime eligibility, review count/rating. Filters (category, price range, Prime) are ES bool filters applied before ranking. Relevance is keyword match in title/description/bullets; conversion rate is the primary business signal that overrides pure relevance.",
      },
      {
        q: 'How does Amazon scale checkout to 300,000 orders per minute on Black Friday?',
        a: "Pre-warm + shed load + circuit break. Before Black Friday: pre-warm Auto Scaling to 3× normal capacity, provision DynamoDB at 10× for inventory tables, run GameDay load tests at 200% expected peak. During peak: shed non-critical features (recommendations, review loading) via feature flags to route all capacity to the checkout critical path. Circuit breakers on all external dependencies (payment processors, carrier APIs) with local fallbacks prevent a slow third party from cascading into checkout failure. The checkout SAGA pattern ensures that a failure at any step triggers compensating transactions (inventory un-reservation, payment refund) atomically.",
      },
      {
        q: 'Why does Amazon use DynamoDB for carts but SQL (Aurora) for orders?',
        a: "The access patterns and consistency requirements are completely different. Cart is always accessed by a single key (user_id → cart items) — a DynamoDB single-key lookup in single-digit milliseconds. Cart is schema-flexible (variable items), high-throughput (10K reads/sec), and eventual consistency is fine (a stale cart showing the wrong item count for a second is not harmful). Orders require ACID transactions (charge payment AND create order record must be atomic — partial failure means a charged but unconfirmed order), relational joins (order → line items → shipments → tracking), and a full audit trail for compliance. These requirements map exactly to a relational database with ACID guarantees. DynamoDB cannot do multi-item ACID transactions at this complexity level. Use the right tool: DynamoDB for speed and scale, Aurora SQL for correctness and relationships.",
      },
      {
        q: 'How does Amazon handle flash sales (e.g., 1 million people competing for 1,000 units) without overselling?',
        a: "For extreme contention scenarios, DynamoDB conditional writes are insufficient — 999,000 failed conditional writes all retry simultaneously, creating a thundering herd that can overwhelm DynamoDB even with exponential backoff. The solution is to move the inventory counter to Redis. A Lua script runs atomically on Redis: 'if current_count > 0 then DECR count return 1 else return 0 end'. Redis is single-threaded for command execution, so this script is genuinely atomic — no locks needed, no retries. Redis handles 1M+ ops/sec on a single node. The 999,000 losing requests get an immediate 'sold out' response rather than retrying. Amazon also uses virtual queuing for major drops (a waiting room that meters users into checkout) to prevent the thundering herd from even reaching Redis.",
      },
    ],
    keyInsight:
      "Amazon's most important architectural insight is separating inventory reservation from cart. By reserving only at checkout, Amazon maximizes the inventory available to all customers at any moment. The 70% cart abandonment rate means that reserving at add-to-cart would make 70% of inventory invisible to everyone else. This is not a technical decision — it's a product decision with massive technical implications: the Inventory Service must handle atomic decrements at checkout-time peak, not cart-time peak. Product decisions drive architecture.",
  },
];
