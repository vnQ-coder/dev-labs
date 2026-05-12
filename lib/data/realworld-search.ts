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
        a: 'Google runs two indexes in parallel: a large main index (100B pages, updated over days/weeks) and a small real-time index (~1B pages, updated in minutes). When Googlebot detects a changed page via HTTP Last-Modified or sitemap ping, it enters the fast Caffeine pipeline → real-time index. Queries hit both indexes and results are merged. The real-time index covers only ~1% of the web but contains the most time-sensitive content.',
      },
      {
        q: 'How does autocomplete work at Google Search\'s scale?',
        a: 'Completions are precomputed offline: MapReduce over anonymized query logs counts prefix frequencies. Top completions per prefix are stored in a compressed trie (~50 GB RAM) on autocomplete servers replicated at every edge PoP. Each keystroke hits the nearest PoP via Anycast, does an O(prefix length) trie lookup, returns top 10 completions in < 20ms. Personalization re-ranks based on user history at serve time.',
      },
    ],
    keyInsight:
      "Google Search scales through massive parallelism, not faster machines. A single query fans out to thousands of index-shard machines simultaneously, each returning their top results, which are then merged. The inverted index — a 200-year-old library science concept — is still the core data structure. Google's engineering achievement is making it work at 100 billion documents with sub-200ms latency by distributing the lookup across a data center's worth of RAM.",
  },
  {
    id: 'amazon',
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
    ],
    keyInsight:
      "Amazon's most important architectural insight is separating inventory reservation from cart. By reserving only at checkout, Amazon maximizes the inventory available to all customers at any moment. The 70% cart abandonment rate means that reserving at add-to-cart would make 70% of inventory invisible to everyone else. This is not a technical decision — it's a product decision with massive technical implications: the Inventory Service must handle atomic decrements at checkout-time peak, not cart-time peak. Product decisions drive architecture.",
  },
];
