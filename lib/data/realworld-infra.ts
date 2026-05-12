import { RealWorldSystem } from '../types';

export const REALWORLD_INFRA: RealWorldSystem[] = [
  {
    id: 'uber',
    icon: '🚗',
    name: 'Uber',
    color: '#000000',
    scale: '28M trips/day · 5M+ active drivers · 750 cities · real-time GPS matching',
    focus: 'Real-Time Ride Matching, Dynamic Pricing & Location Tracking',
    problem:
      "Design Uber's core dispatch system. A rider requests a ride; within 15 seconds the system finds the optimal nearby driver, sends them the request, and upon acceptance navigates both parties. The system handles 28M trips/day, tracks 5M driver GPS locations updating every 4 seconds, computes dynamic surge pricing in real time, and must match rider to driver in under 15 seconds globally — in Mumbai rush hour and rural Iowa alike.",
    functionalReqs: [
      'Riders can request a ride; system finds and matches nearest available driver within 15 seconds',
      'Real-time GPS tracking: rider sees driver position updating every 4 seconds during approach and trip',
      'Dynamic surge pricing computed per geographic cell based on supply/demand ratio in real time',
      'Drivers receive trip requests, can accept/decline; request goes to next driver if declined',
      'Estimated time of arrival (ETA) computed in real time using live traffic data',
      'Trip history, receipts, ratings for both riders and drivers stored and retrievable',
    ],
    nonFunctionalReqs: [
      {
        label: 'Match latency',
        value: 'Driver matched to rider within 15 seconds for 95th percentile',
      },
      {
        label: 'Location update ingestion',
        value: '5M driver GPS pings every 4 seconds = 1.25M writes/sec',
      },
      {
        label: 'ETA accuracy',
        value: 'within 2 minutes of actual arrival for 90% of trips',
      },
      {
        label: 'Surge pricing refresh',
        value: 'updated every minute per geographic cell globally',
      },
      {
        label: 'Availability',
        value: '99.99% — unable to get a ride during an outage is a critical failure',
      },
      {
        label: 'Consistency',
        value: 'Driver state (available/en-route/on-trip) must be strongly consistent — no double-booking',
      },
    ],
    scaleEstimation: [
      {
        label: 'Driver location writes',
        value: '5M drivers × 1/4 sec = 1.25M writes/sec',
        note: 'the highest write throughput in the system',
      },
      {
        label: 'Rider requests',
        value: '28M trips/day ÷ 57,600 peak seconds = ~485 requests/sec peak',
      },
      {
        label: 'Geospatial queries',
        value: 'per request, search drivers within 2km radius = ~100 geospatial queries/sec',
      },
      {
        label: 'ETA computations',
        value: '485 matches/sec × 5 candidate drivers each = ~2,500 ETA computations/sec',
      },
      {
        label: 'Surge cells',
        value: '750 cities × avg 200 cells/city = 150K geofence cells computed every 60 seconds',
      },
      {
        label: 'Trip events in Kafka',
        value: '~200 events/trip × 28M trips = 5.6B events/day',
      },
    ],
    highLevelDesign: [
      {
        title: 'Driver Location Service',
        description:
          'Drivers send GPS ping every 4 seconds to a Location Service. The service writes to an in-memory geospatial index (Redis GEO commands — geohash-based). Each driver entry has: driver_id, lat/lng, status (available/busy), last_seen. Entries expire after 10 seconds (2.5 missed pings = driver gone offline). This is the hot read path for matching.',
      },
      {
        title: 'Supply-Demand Matching',
        description:
          'Rider submits request → Dispatch Service computes rider\'s geohash cell → queries Redis GEO for available drivers within expanding radius (500m → 1km → 2km) → ranks candidates by ETA → sends offer to top driver first. If no accept in 10 seconds, offer goes to next candidate.',
      },
      {
        title: 'ETA Service (maps + ML)',
        description:
          "ETA is computed using Google Maps API for routing + an ML model that adjusts for historical traffic patterns, time of day, and current traffic (sourced from driver GPS velocity data). Uber's own mapping stack (built after Google Maps cost became prohibitive) handles routing via its open-source H3 hexagonal grid.",
      },
      {
        title: 'Surge Pricing Engine',
        description:
          'The city is divided into H3 hexagonal cells (~500m diameter). Every 60 seconds, a streaming job (Flink) computes supply (available drivers) and demand (unmatched requests) per cell. Surge multiplier = max(1, (demand/supply)^0.5 × base_multiplier). The result is written to a Redis key per cell; the API reads it at request time.',
      },
      {
        title: 'Trip State Machine',
        description:
          'Each trip is a state machine: REQUESTED → DRIVER_ACCEPTED → DRIVER_ARRIVING → TRIP_STARTED → TRIP_COMPLETED → PAYMENT_PROCESSING. State is persisted in PostgreSQL (source of truth) and cached in Redis for sub-millisecond reads during the trip. Kafka events are emitted on each state transition for analytics, payments, and notifications.',
      },
    ],
    deepDive: [
      {
        title: 'The geospatial index — Redis GEO vs S2/H3',
        description:
          'Redis GEO uses geohash to store lat/lng as a sorted set score. GEORADIUS queries return drivers within a radius in O(N+log M) where N is results and M is total keys in the set. For 5M drivers, a 1km radius query returns ~50 drivers — fast. Uber internally uses Google\'s S2 library (spherical geometry) for more accurate distance calculations and their own H3 hex grid for surge/analytics. Redis GEO is used for the hot matching path; H3 for everything aggregated.',
        insight:
          'Redis GEO is purpose-built for ephemeral geospatial data — driver locations expire naturally via TTL, and proximity queries are O(N+log M), making it ideal for the hot matching path.',
      },
      {
        title: 'Consistent driver state — avoiding double-booking',
        description:
          'A driver cannot be matched to two riders simultaneously. Uber uses a distributed lock (Redis Redlock) when transitioning driver state from AVAILABLE → MATCHED. The lock is acquired for the driver\'s ID before sending an offer and released when the driver accepts or the timeout expires. This prevents two dispatch workers from simultaneously offering the same driver to two riders.',
        insight:
          'Distributed locks on driver IDs serialize state transitions without requiring a single-master architecture — each driver ID is its own lock domain.',
      },
      {
        title: 'Dynamic pricing fairness and smoothing',
        description:
          'Raw surge can oscillate wildly — 2.3× one minute, 1.1× the next. Uber smooths with exponential moving average: new_surge = 0.7 × current_surge + 0.3 × computed_surge. Transitions > 0.5× in one period are capped. Geographic cells use Gaussian-weighted blending with neighboring cells to prevent cliff edges (1.2× on one side of a street, 3× on the other).',
        insight:
          'Surge pricing is a control system problem — without dampening, feedback loops cause oscillation. EMA smoothing and neighbor blending make pricing feel predictable to riders.',
      },
      {
        title: 'The map data problem',
        description:
          "Uber switched from Google Maps to its own mapping stack (acquired deCarta, built internal routing). Reason: Google charged per API call; at Uber's ETA computation volume (2,500/sec) this was hundreds of millions/year. Uber's routing engine uses OSRM (Open Source Routing Machine) on top of OpenStreetMap data, updated nightly. Traffic layer uses real-time driver GPS velocity as probe data — 5M moving data points is more accurate than any commercial traffic feed.",
        insight:
          'At sufficient scale, API costs become infrastructure costs. Internalizing the mapping stack paid for itself within a year and gave Uber a traffic data advantage no third party could match.',
      },
    ],
    decisions: [
      {
        question: 'PostgreSQL vs Cassandra for trip state',
        chosen: 'PostgreSQL (sharded)',
        reason:
          "Trip state requires ACID transactions — a driver accepting a trip must atomically update driver status AND create a trip record. Cassandra's lack of multi-row transactions makes this error-prone. Trip data is also relatively small (28M trips/day × 2KB = ~56 GB/day) — well within sharded PostgreSQL's capacity. Cassandra is used for append-only trip events (analytics).",
      },
      {
        question: 'Redis vs dedicated geospatial DB for driver locations',
        chosen: 'Redis GEO',
        reason:
          'Driver locations are ephemeral (expire after 10 seconds), write-heavy (1.25M/sec), and queried by proximity. Redis GEO handles all three. A dedicated PostGIS instance would require persistent storage overhead for data that\'s irrelevant after 10 seconds. At failure, the location index rebuilds itself from incoming driver pings within 10 seconds.',
      },
      {
        question: 'Push offer vs pull acceptance for driver matching',
        chosen: 'Push with timeout',
        reason:
          'Pull (driver polls for jobs) introduces latency proportional to poll interval. At 5-second polls, rider waits up to 5 extra seconds. Push delivers the offer in <100ms. Timeout (10 seconds to accept) prevents a driver from holding up the queue — if they don\'t respond, the offer cascades to the next candidate.',
      },
    ],
    interview: [
      {
        q: 'How does Uber match a rider to a driver within 15 seconds at global scale?',
        a: "The Dispatch Service computes the rider's geohash cell and queries Redis GEO for available drivers in an expanding radius (500m → 1km → 2km). Candidates are ranked by ETA (computed from the routing engine). The top candidate receives a push offer; if they don't accept within 10 seconds, the offer cascades to the next. Redis GEO's GEORADIUS query runs in O(N+log M) — fast enough for 100 queries/sec per DC. Each regional deployment handles its own city cluster, so Mumbai and Iowa run independently.",
      },
      {
        q: 'How does Uber track 5M driver GPS locations updating every 4 seconds?',
        a: 'Drivers send UDP-like pings to a Location Service fleet. Each ping is an upsert to a Redis GEO sorted set: GEOADD drivers <lng> <lat> <driver_id>. Each key has a 10-second TTL reset on every write — missed pings expire automatically. At 1.25M writes/sec, this requires a Redis cluster (sharded by driver_id hash). The write path is fire-and-forget — drivers don\'t need acknowledgment for every ping, which allows for lossy but low-latency ingestion.',
      },
      {
        q: 'How does surge pricing work and how do you prevent it from oscillating?',
        a: "Every 60 seconds, an Apache Flink streaming job aggregates supply (drivers in AVAILABLE state) and demand (unmatched requests) per H3 hexagonal cell. Raw multiplier = max(1, (demand/supply)^0.5 × base). To prevent oscillation: (1) exponential moving average — new = 0.7 × old + 0.3 × computed; (2) cap transitions > 0.5× per period; (3) Gaussian-blend neighboring cells to prevent cliff edges. Results written to Redis per cell_id — API reads at O(1) per request.",
      },
      {
        q: 'How do you prevent a driver from being double-booked by two simultaneous ride requests?',
        a: 'Before sending an offer to a driver, the Dispatch Service acquires a Redis Redlock on the driver\'s ID. Lock TTL = 15 seconds (the offer window). Only one dispatch worker can hold the lock — the second attempt fails and moves to the next candidate. The driver\'s state transition (AVAILABLE → MATCHED) is written to PostgreSQL inside the lock. If the driver declines or times out, the lock is released and state reverts to AVAILABLE.',
      },
    ],
    keyInsight:
      "Uber's entire real-time system is built around one constraint: driver location is ephemeral. A GPS coordinate from 10 seconds ago is worthless — the driver has moved. By designing driver location as a 10-second TTL key in Redis rather than a durable database row, Uber built a system that self-heals after failures (driver pings rebuild the index in 10 seconds), scales writes to 1.25M/sec without a RDBMS, and never accumulates stale data. Ephemerality is a feature, not a limitation.",
  },
  {
    id: 'airbnb',
    icon: '🏠',
    name: 'Airbnb',
    color: '#ff5a5f',
    scale: '150M users · 7M+ listings · 100M+ bookings/year · 220+ countries',
    focus: 'Search, Availability, Pricing & Double-Booking Prevention',
    problem:
      "Design Airbnb's core booking platform. A guest searches listings by location, dates, guests, and filters — the system must return relevant results with real-time availability in < 500ms across 7M listings. When two guests simultaneously try to book the same listing for the same dates, only one must succeed. The system must handle 100M bookings/year with zero double-bookings and support dynamic pricing that updates host-set prices in real time.",
    functionalReqs: [
      'Guests search listings by location (map/city), date range, guest count, and amenity filters',
      'Listing detail page shows real-time availability calendar and nightly price',
      'Booking: guest selects dates, pays, host gets notification; host can accept/decline (Instant Book skips this)',
      'Hosts set base price, minimum stay, blocked dates, and custom price by date',
      'Both parties can cancel under policy rules; cancellation triggers refunds via Stripe',
      'Reviews for both guests and hosts, visible on profile and listing pages',
    ],
    nonFunctionalReqs: [
      {
        label: 'Search latency',
        value: '< 500ms for paginated search results with filters',
      },
      {
        label: 'Availability check',
        value: '< 100ms to verify dates are still available before booking',
      },
      {
        label: 'Double-booking prevention',
        value: 'zero tolerance — exactly one booking per listing per date range',
      },
      {
        label: 'Pricing consistency',
        value: 'price shown at search time matches price at checkout (within session)',
      },
      {
        label: 'Availability calendar',
        value: 'updates visible to other users within 5 seconds of a booking being confirmed',
      },
      {
        label: 'Uptime',
        value: '99.99% — peak season (summer, holidays) is when failures hurt most',
      },
    ],
    scaleEstimation: [
      {
        label: 'Searches/day',
        value: '~500M',
        note: 'many searches per session before booking',
      },
      {
        label: 'Bookings/day',
        value: '100M ÷ 365 = ~274K/day = ~3.2 bookings/sec',
      },
      {
        label: 'Listing availability reads',
        value: '500M searches × avg 20 listings/search = 10B availability checks/day',
      },
      {
        label: 'Calendar write events',
        value: '274K bookings/day × 2 (block + confirm) = ~548K calendar writes/day',
      },
      {
        label: 'Active listings',
        value: '7M listings × avg 365 nights/year = 2.5B night-slots in the availability table',
      },
      {
        label: 'Search index',
        value: '7M listings × ~5 KB metadata = ~35 GB hot search index (fits in memory)',
      },
    ],
    highLevelDesign: [
      {
        title: 'Search Service (Elasticsearch)',
        description:
          'Listings are indexed in Elasticsearch — title, description, amenities, location (geo_point), avg rating, superhost status. A search query maps to an ES bool query with geo_distance filter, term filters (amenities), and range filters (price). Availability filter is applied post-fetch from a separate Availability Service — ES results are cross-referenced with the availability cache.',
      },
      {
        title: 'Availability Service',
        description:
          'Each listing\'s available dates are stored as a bitmap (one bit per night for the next 2 years = ~730 bits per listing). Bitmaps live in Redis (BITFIELD). A date-range availability check is a BITCOUNT on the specified range — O(1) per listing. On booking confirmation, bits are flipped to 0 (unavailable). Reads serve 10B checks/day from Redis at sub-millisecond latency.',
      },
      {
        title: 'Booking & Double-Booking Prevention',
        description:
          'Guest submits booking → Booking Service acquires a distributed lock on (listing_id, date_range) via Redis Redlock → re-checks availability in PostgreSQL (source of truth) → creates booking record + charges Stripe → releases lock. The re-check inside the lock is the critical section that prevents double-booking.',
      },
      {
        title: 'Pricing Service',
        description:
          'Hosts set a price calendar (base price + overrides per date). Stored in PostgreSQL per listing. At search time, price for a date range = sum(nightly_prices). Dynamic pricing suggestions (Airbnb Smart Pricing) are ML-generated and offered to hosts but not enforced. Guest price at checkout is locked to the price at time of booking creation (price_at_booking stored in booking record).',
      },
      {
        title: 'Notifications & Host Dashboard',
        description:
          'Booking events flow through Kafka. The Notification Service sends host SMS/email/push within 5 seconds. The host calendar dashboard is a real-time view backed by the Redis availability bitmap — no database query needed for the calendar view.',
      },
    ],
    deepDive: [
      {
        title: 'Double-booking at scale — the idempotency layer',
        description:
          "Two guests clicking \"Book\" simultaneously for the same listing and dates is the most dangerous race condition. Airbnb's defense is three-layered: (1) Redis distributed lock prevents concurrent booking attempts; (2) PostgreSQL CHECK constraint ensures no overlapping date ranges per listing (implemented via PostgreSQL's EXCLUDE constraint with daterange type and && operator); (3) Stripe payment is authorized only after the lock is held and availability confirmed. The EXCLUDE constraint is the last line of defense if the lock fails.",
        insight:
          "Defense in depth: optimistic locking at the application layer, database constraints as the safety net, and payment authorization only after both checks pass — each layer compensates for the one above it failing.",
      },
      {
        title: 'Search with availability filtering',
        description:
          "ES can't query live availability — it indexes listing metadata, not calendar state. The solution: ES returns top 200 listings matching location/filters, then the Availability Service batch-checks all 200 against Redis bitmaps in parallel (200 BITFIELD reads). Available listings are returned to the client; unavailable are filtered. This two-stage approach keeps ES fast (no join with availability) and availability checks at sub-millisecond Redis speed.",
        insight:
          "Separating the search index from the availability index keeps both systems optimal — ES for relevance ranking, Redis for real-time state. The fan-out to 200 availability checks is ~200 microseconds in parallel.",
      },
      {
        title: 'The availability bitmap design',
        description:
          'Storing 7M listings × 730 nights = 5.1B bits = ~640 MB total. This fits entirely in Redis memory. BITFIELD GET for a 30-day range requires reading 30 bits — one Redis command. Bit flipping on booking is O(1). The bitmap epoch starts Jan 1 of the current year; old bits are reclaimed yearly. This is simpler and faster than a date-range table with millions of rows.',
        insight:
          '640 MB for the entire global availability state of 7M listings. A single Redis instance holds what would take dozens of PostgreSQL replicas to serve at this read throughput.',
      },
      {
        title: 'Price locking to prevent bait-and-switch',
        description:
          "If a host changes their price between when the guest sees it and when they click Book, Airbnb must honor the original price. The solution: price is computed and stored in the booking session (30-minute TTL in Redis) when the guest first views checkout. The final booking uses the session-stored price, not the current host price. If the session expires, price is recomputed. This protects the guest without requiring a price reservation in the DB.",
        insight:
          'Session-scoped price locking is a soft reservation — it protects the guest experience without the complexity of a price-hold transaction in the database. The 30-minute TTL is long enough for checkout but short enough to not hold prices indefinitely.',
      },
    ],
    decisions: [
      {
        question: 'Elasticsearch vs PostgreSQL full-text search for listings',
        chosen: 'Elasticsearch',
        reason:
          "Listing search involves geo-filtering (within 5km of a point), multi-field text search (title + description + amenities), faceting (count by property type), and relevance ranking. PostgreSQL's tsvector handles full-text but lacks native geo-distance ranking and faceting. ES's geo_distance query and aggregations handle all three natively. Trade-off: ES introduces eventual consistency — new listings appear in search within 5 seconds of being created.",
      },
      {
        question: 'Redis bitmap vs date-range table for availability',
        chosen: 'Redis bitmap',
        reason:
          "A date-range table approach requires a query like SELECT COUNT(*) WHERE listing_id = X AND date BETWEEN start AND end AND status = 'booked' for every availability check. At 10B checks/day = 115K queries/sec, this saturates a PostgreSQL cluster. Redis BITFIELD answers the same question in O(range_length) with a single command at 10M ops/sec capacity.",
      },
      {
        question: 'Instant Book vs request-to-book',
        chosen: 'Both supported; architectural difference is Stripe capture timing',
        reason:
          'Instant Book (skip host approval) requires the Booking Service to immediately confirm and charge. Request-to-book requires a 24-hour host acceptance window with payment authorization (not capture) held on card. Both paths share the same double-booking prevention — the difference is when Stripe capture happens (immediate vs after host accept).',
      },
    ],
    interview: [
      {
        q: 'How does Airbnb prevent double-booking when two users book the same listing simultaneously?',
        a: "Three-layered defense: (1) Redis Redlock on (listing_id, date_range) serializes concurrent booking attempts — only one worker holds the lock at a time; (2) inside the lock, availability is re-checked in PostgreSQL (not just Redis) before creating the booking; (3) PostgreSQL EXCLUDE constraint with daterange type and && operator enforces no overlapping reservations at the database level. Stripe payment is authorized only after layers 1 and 2 pass. If the Redis lock fails (network partition), the PostgreSQL constraint is the safety net.",
      },
      {
        q: 'How does the search system filter 7M listings by availability in under 500ms?',
        a: "Two-stage pipeline: (1) Elasticsearch returns the top 200 listings matching location, price, amenities, and guest count — this takes ~50ms; (2) the Availability Service batch-fetches all 200 listings' bitmaps from Redis in parallel (200 concurrent BITFIELD reads) — this takes ~5ms. Unavailable listings are filtered client-side and the remaining results are returned. Total: ~100ms. The key insight is that availability is never stored in ES — keeping ES queries fast and availability reads at Redis speed.",
      },
      {
        q: 'How would you design the availability calendar to handle 10 billion reads per day?',
        a: 'Model availability as a Redis BITFIELD per listing: one bit per night for 730 nights (2 years). Total storage: 7M × 730 bits = ~640 MB — fits in a single Redis instance (replicated). A 30-night availability check is one BITFIELD GET command returning 30 bits. Redis handles 10M ops/sec; 115K checks/sec (10B/day) is well within capacity. On booking, flip bits to 0 with BITFIELD SET. On cancellation, flip back to 1. The bitmap epoch is reclaimed annually.',
      },
      {
        q: 'How do you ensure the price a guest sees is the price they pay, even if the host changes it mid-session?',
        a: "When the guest opens the checkout page, the Pricing Service computes the total price and stores it in a Redis session key (keyed by session_id + listing_id + date_range) with a 30-minute TTL. The Booking Service reads price from the session key, not from the live pricing table. If the session key has expired (guest left and came back 31 minutes later), price is recomputed from current host settings. price_at_booking is also stored on the booking record for dispute resolution. Hosts can change prices freely — in-flight checkout sessions are protected.",
      },
    ],
    keyInsight:
      "Airbnb's availability bitmap is the architectural foundation of their scale. By encoding every listing's 730-night calendar as 730 bits in Redis, they turned 10 billion date-range checks per day into 10 billion O(1) Redis BITFIELD reads. The entire availability index for 7M listings fits in 640 MB of RAM — cheaper than one PostgreSQL read replica. When you can model your most-read data as a bitmap, do it.",
  },
];
