import { Concept } from '../types';

export const MONGODB_PART2: Concept[] = [
  {
    id: 'mongodb-replication',
    cat: 'mongodb',
    color: '#00ed64',
    icon: '🔄',
    title: 'MongoDB Replica Sets',
    tag: 'A replica set is a consensus group — the primary owns all writes, secondaries follow the oplog',
    overview:
      'A MongoDB replica set is a group of mongod processes that maintain the same data set. The primary receives all write operations and records them to an operation log (oplog). Secondaries replicate the oplog and apply the operations to their data sets. If the primary becomes unavailable, an eligible secondary holds an election to become the new primary — providing automatic failover without human intervention.',
    components: [
      {
        name: 'Primary',
        icon: '👑',
        role: 'Accepts all write operations and records them to the oplog',
        detail:
          'At most one primary exists at any time — elected by majority vote. Maintains the oplog at `local.oplog.rs`, a special capped collection that records every write as an idempotent operation. If the primary fails, secondaries detect the timeout and hold an election to promote one of themselves.',
      },
      {
        name: 'Secondary',
        icon: '📋',
        role: 'Replicates the primary oplog asynchronously and serves reads',
        detail:
          'Tails the primary\'s oplog and replays operations to stay current. Lags behind the primary by replication lag — typically milliseconds on a healthy cluster. Can serve reads when configured with an appropriate read preference. Participates in elections; the secondary with the most up-to-date oplog timestamp wins.',
      },
      {
        name: 'Oplog (Operation Log)',
        icon: '📜',
        role: 'Capped collection recording every write as an idempotent operation',
        detail:
          'Lives at `local.oplog.rs` on every replica set member. Secondaries tail the primary\'s oplog and replay each entry. Because operations are idempotent, replaying an operation multiple times produces the same result — safe after network interruptions. Oplog size determines how long a secondary can be offline and still recover without a full initial sync.',
      },
      {
        name: 'Election Protocol',
        icon: '🗳️',
        role: 'Raft-like consensus that promotes a new primary after failure',
        detail:
          'A secondary calls an election when it cannot reach the primary for `electionTimeoutMillis` (default 10 seconds). Requires a majority of votes to elect a new primary — a 3-member set needs 2 votes. The candidate with the highest oplog timestamp wins. Minimum viable set: 3 data members, or 2 data members + 1 arbiter (vote-only, no data).',
      },
    ],
    howItWorks:
      'Replication flow: a write arrives at the primary → the primary applies it to WiredTiger → records an oplog entry → returns acknowledgement to the client (based on write concern) → secondaries independently tail the oplog → apply each operation to their own data set.\n\nWrite concern controls durability: `w: 1` (default) acknowledges after the primary writes to memory — fast, but carries a risk of data loss if the primary crashes before flushing the oplog to disk. `w: "majority"` blocks until a majority of data-bearing members have acknowledged the write — survives a primary failure without data loss, at the cost of replication-lag latency. `w: 0` is fire-and-forget — never use for important data. Adding `j: true` to any write concern requires the WiredTiger journal (written every 50ms) to flush to disk before acknowledging — strongest durability.\n\nRead preferences let you trade consistency for load: `primary` (default) guarantees fresh data; `secondary` reads potentially stale data but offloads the primary; `secondaryPreferred` uses a secondary if available, otherwise primary; `nearest` picks the member with lowest network latency — ideal for geographically distributed replica sets where some staleness is acceptable.\n\nInitial sync: when a new member joins the set, it clones all data from the primary (initial sync), then catches up via the oplog. If the secondary is offline longer than the oplog window, it must initial-sync again.\n\nSpecial member types: hidden members (priority: 0, invisible to clients) are used for analytics and backup without affecting primary elections. Delayed members (hidden with `slaveDelay: N`) lag N seconds behind — provide a rollback window against accidental deletes. Arbiters cast votes only and hold no data — useful to break ties in even-numbered sets, but avoid in production because they add no data redundancy.',
    decision: {
      choose: [
        'You need automatic failover without manual intervention',
        'You want read scaling by directing analytics queries to secondaries',
        'You need a rollback window against operator error (delayed member)',
        'You want `w: majority` writes that survive a primary crash without data loss',
        'You have a geographically distributed app and need `nearest` read preference to reduce latency',
      ],
      avoid: [
        'You expect primary elections to be invisible to your application — write retries are always needed',
        'You need synchronous replication with zero replication lag — use `w: majority` and accept the latency cost',
        'An arbiter alone as your third member in production — adds votes but not redundancy',
      ],
      vs: [
        {
          name: 'Synchronous replication (PostgreSQL streaming)',
          when: 'PostgreSQL synchronous_commit blocks until standby confirms — zero lag guaranteed. MongoDB replica sets are asynchronous by default; use w:majority as the closest equivalent.',
        },
        {
          name: 'MongoDB Sharding',
          when: 'Replica sets handle high availability. Sharding handles horizontal scale beyond what a single node can store. In a sharded cluster, every shard IS a replica set.',
        },
      ],
    },
    failures: [
      {
        name: 'Primary election window causes write failures',
        cause: 'Primary crash triggers a 10-second election timeout; all writes fail with NotPrimaryError during the window',
        symptom: 'Application receives `NotPrimaryError` or `MongoNotPrimaryError` exceptions; write throughput drops to zero for 10–30 seconds',
        fix: 'Implement retry logic with exponential backoff for `NotPrimaryError` and `NotWritablePrimary` error codes. Use `w: majority` so committed writes survive the failover without being rolled back. The MongoDB drivers\' retryable writes (`retryWrites: true` in the connection string) handle single-statement retries automatically.',
        severity: 'critical',
      },
      {
        name: 'Replication lag causing stale secondary reads',
        cause: 'A secondary falls behind — e.g. a heavy index build on the primary floods the oplog faster than the secondary can replay it',
        symptom: 'Reads from secondary return data that is 30+ seconds old; users see inconsistent state after writes',
        fix: 'Use `readConcern: "majority"` — MongoDB only returns data that a majority of nodes have committed, ensuring you never read an uncommitted write. For consistency-critical reads, switch to `readPreference: "primary"`. Monitor replication lag with `rs.printSecondaryReplicationInfo()` and alert when lag exceeds your SLO.',
        severity: 'high',
      },
    ],
    a: {
      v: '🔄 → 👑📋📋',
      t: 'A parliament with one speaker and multiple note-takers',
      tx: 'In a parliament, only the Speaker can put motions to a vote — that is the primary. The Hansard reporters (secondaries) transcribe every word into their own notebooks (oplog). If the Speaker collapses, the reporters elect a new Speaker from among themselves by majority vote — within seconds, the parliament is back in business. The transcripts (oplogs) ensure the new Speaker picks up exactly where the old one left off. Reading from a reporter\'s notebook is fine for historical record, but for the latest motion you go to the Speaker directly.',
      s: 'One primary owns all writes; secondaries follow the oplog; majority vote elects a new primary on failure.',
    },
    te: {
      def: 'A MongoDB replica set is a group of mongod instances that maintain identical data via oplog replication. The primary accepts writes; secondaries tail the oplog. Elections use a Raft-like majority vote protocol with a configurable 10-second timeout.',
      types: [
        { n: 'Primary', d: 'Single writable node. Maintains oplog at local.oplog.rs. Elected by majority.' },
        { n: 'Secondary', d: 'Read-only replica. Tails primary oplog. Eligible for election.' },
        { n: 'Arbiter', d: 'Vote-only member. No data. Breaks ties in even-numbered sets.' },
        { n: 'Hidden member', d: 'priority:0, invisible to drivers. Used for analytics and backup.' },
        { n: 'Delayed member', d: 'Hidden + slaveDelay:N. Lags N seconds behind — rollback protection.' },
      ],
      when: 'Always run a replica set in production — even a 3-node set with an arbiter is vastly better than standalone. Use w:majority for financial or critical writes. Use secondaryPreferred for read-heavy analytics to offload the primary.',
      trade:
        'Pro: automatic failover in ~10–30 seconds; read scaling via secondaries; delayed member enables point-in-time rollback. Con: election window means brief write unavailability; w:majority adds latency proportional to replication lag; secondary reads can be stale unless readConcern:majority is used.',
      code: `// ── REPLICA SET INIT (mongo shell) ───────────────────
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },  // preferred primary
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
});

rs.status();      // view replica set status + lag
rs.conf();        // view current configuration

// ── ADD SPECIAL MEMBERS ───────────────────────────────
rs.add({ host: "mongo-hidden:27017", hidden: true, priority: 0 });   // hidden (analytics)
rs.add({ host: "mongo-delayed:27017", slaveDelay: 3600, priority: 0, hidden: true }); // 1-hour delay

// ── WRITE CONCERNS ────────────────────────────────────
// w:1 — default, primary acknowledged (risk: data loss on failover)
db.orders.insertOne({ item: "widget", qty: 10 }, { writeConcern: { w: 1 } });

// w:majority — safe, survives primary failure (adds ~replication lag latency)
db.orders.insertOne({ item: "widget", qty: 10 }, { writeConcern: { w: "majority", j: true, wtimeout: 5000 } });

// w:0 — fire and forget (fastest, no durability guarantee)
db.metrics.insertOne({ ts: new Date(), val: 42 }, { writeConcern: { w: 0 } });

// ── READ PREFERENCES ──────────────────────────────────
// Node.js driver
const client = new MongoClient(uri, {
  readPreference: "secondaryPreferred",  // read from secondary if available
  readConcern: { level: "majority" }     // only read committed data
});

// Per-operation read preference override
db.reports.find({ year: 2024 }).readPref("secondary");   // use secondary
db.reports.find({ year: 2024 }).readPref("nearest");     // lowest latency

// ── OPLOG INSPECTION ──────────────────────────────────
use local
db.oplog.rs.find().sort({ $natural: -1 }).limit(5).pretty();
// Each oplog entry:
// { op: "i" (insert) | "u" (update) | "d" (delete) | "c" (command)
//   ns: "mydb.orders",
//   o: { /* document or update modifier */ },
//   ts: Timestamp(1704067200, 1),   // timestamp + ordinal
//   t: 1,   // election term
//   h: NumberLong("..."),   // hash
//   v: 2 }

// ── REPLICATION LAG MONITORING ───────────────────────
rs.printSecondaryReplicationInfo();
// Output shows: each secondary's sync source and how far behind (seconds)

// ── MANUAL STEPDOWN (planned failover) ───────────────
rs.stepDown(60);    // primary steps down, waits 60s before re-election eligibility`,
      rw: {
        ex: [
          'MongoDB Atlas runs every cluster as a 3+ node replica set by default',
          'Shopify uses replica sets with w:majority for order writes to prevent data loss on failover',
          'Expedia uses secondaryPreferred reads for search queries to reduce primary load',
          'LinkedIn uses delayed members (1-hour lag) as a rollback safety net against bad deployments',
        ],
        cs: 'An e-commerce platform storing orders uses w:majority on all order.insertOne() calls. When a primary crashes mid-peak, the 10-second election window causes writes to fail — but retryable writes in the driver automatically retry the operation against the new primary. Because w:majority was used, no committed order is lost. Orders written with w:1 that had not yet replicated are rolled back, but the driver retry re-inserts them cleanly.',
      },
    },
    interview: {
      q: 'Explain MongoDB\'s write concern `w: majority` and when you\'d use it over `w: 1`.',
      a: '`w: majority` blocks until a majority of data-bearing replica set members have durably written the operation — meaning even if the primary immediately crashes, the write survives on at least one secondary that will become the new primary. `w: 1` only waits for the primary to acknowledge in memory — faster (no network round-trip to secondaries) but risks data loss if the primary crashes before the oplog is replicated. Use `w: majority` for anything you cannot afford to lose: financial transactions, order placements, user account creation. Use `w: 1` for metrics, logs, or analytics events where occasional loss is acceptable. Add `j: true` to `w: majority` for the strongest guarantee — requires journal flush to disk before acknowledgement.',
      fu: [
        'What happens to in-flight writes during a replica set election, and how does the driver handle them?',
        'How does readConcern:"majority" interact with read preference:"secondary"?',
        'When would you add a delayed member to a replica set, and what recovery scenario does it cover?',
      ],
    },
  },

  {
    id: 'mongodb-sharding',
    cat: 'mongodb',
    color: '#00ed64',
    icon: '🔀',
    title: 'MongoDB Sharding',
    tag: 'Sharding splits your collection into chunks — mongos routes each query to the right shard',
    overview:
      'MongoDB sharding horizontally partitions a collection across multiple replica sets (shards). A query router (mongos) uses a chunk map stored on config servers to forward each request to the correct shard. The right shard key routes queries to a single shard (targeted query); the wrong shard key broadcasts to all shards (scatter-gather). Sharding is an irreversible commitment — the shard key cannot be changed after the collection is sharded.',
    components: [
      {
        name: 'mongos (Query Router)',
        icon: '🔀',
        role: 'Routes client queries to the correct shard(s)',
        detail:
          'Stateless process that reads the chunk map from config servers to determine which shard(s) hold the requested data. Multiple mongos instances run for high availability — clients connect to any mongos. Merges results from multiple shards for scatter-gather queries. Does not store data itself.',
      },
      {
        name: 'Config Servers',
        icon: '🗂️',
        role: 'Store the cluster metadata: chunk ranges and shard assignments',
        detail:
          'A 3-member replica set storing the routing table — which chunk ranges belong to which shard, the list of shards, and balancer state. Every mongos caches this metadata locally and refreshes on changes. Config servers are the brain of the cluster; losing them (without backup) makes the cluster unroutable.',
      },
      {
        name: 'Shard',
        icon: '🗄️',
        role: 'A replica set storing a horizontal slice of the sharded collection',
        detail:
          'Each shard is a fully functional MongoDB replica set with its own primary and secondaries. Data is divided into chunks (default max 128MB each) distributed across shards. The balancer migrates chunks between shards to maintain an even distribution. Unsharded collections live entirely on the primary shard.',
      },
      {
        name: 'Shard Key',
        icon: '🔑',
        role: 'The field(s) that determine which shard holds each document',
        detail:
          'An immutable decision — cannot be changed after sharding (MongoDB 5.0+ allows resharding but it is a heavy operation). Determines data distribution, query routing efficiency, and whether write hotspots will occur. High cardinality (many distinct values) and uniform write distribution are the two most important properties. Low cardinality (e.g. boolean field) or monotonically increasing values (e.g. ObjectId) cause hotspots.',
      },
    ],
    howItWorks:
      'Data distribution: a sharded collection is divided into chunks — each chunk covers a contiguous range of shard key values (or hash values). Initially MongoDB creates a small number of chunks. As data grows, the balancer splits chunks that exceed 128MB and migrates chunks between shards to maintain balance. The background balancer runs automatically and can be paused or scheduled to a maintenance window.\n\nHashed vs range sharding: hashed sharding applies a hash function to the shard key value before computing the chunk range — uniform distribution, no hotspots, but range queries must scatter-gather across all shards. Range sharding stores documents with adjacent shard key values in the same chunk — supports efficient range queries, but a monotonically increasing key (timestamp, ObjectId) means all new inserts always hit the same "max" chunk on one shard, creating a write hotspot.\n\nQuery routing: a query that includes the shard key in its filter → mongos consults the chunk map → forwards to exactly one shard (targeted query — fast). A query without the shard key → mongos broadcasts to all shards and merges results (scatter-gather). At 10 shards, a 10ms query becomes 100ms because the slowest shard determines the total latency. Design your application query patterns before choosing a shard key.\n\nCompound shard keys: `{ userId: 1, createdAt: 1 }` co-locates all orders for a user on the same shard — user-scoped queries are always targeted.\n\nZone sharding: pin specific shard key ranges to specific shards using zones. Use case: EU user data pinned to EU shards for GDPR data residency compliance.\n\nJumbo chunks: a chunk that exceeds the max size but cannot be split because all documents share the same shard key value (e.g., all documents have `country: "US"`). Jumbo chunks cannot migrate — they cause permanent shard imbalance. This is a sign of low-cardinality shard key design.\n\nPre-splitting: before a bulk data load, manually split chunks and distribute them across shards. Without pre-splitting, all data loads into one shard and the balancer scrambles to catch up — causing migration storms and degraded performance during load.',
    decision: {
      choose: [
        'Your data set exceeds the storage capacity of a single server',
        'Write throughput exceeds what a single primary can sustain',
        'You need horizontal read scaling beyond replica set secondaries',
        'You have a clear, high-cardinality shard key with uniform write distribution',
        'Data residency regulations require pinning specific data to specific regions (zone sharding)',
      ],
      avoid: [
        'Your data fits comfortably on a single replica set — sharding adds significant operational complexity',
        'You cannot identify a good shard key — a bad shard key causes worse performance than no sharding',
        'You need frequent cross-shard transactions — they are expensive in a sharded cluster',
        'You are sharding a collection you expect to need frequent schema changes — the shard key is immutable',
      ],
      vs: [
        {
          name: 'Replica set (no sharding)',
          when: 'Replica sets provide high availability and read scaling. Only shard when write throughput or storage exceeds single-node capacity — the added complexity is significant.',
        },
        {
          name: 'Application-level sharding',
          when: 'Some teams shard at the application layer (e.g. database-per-tenant) to avoid mongos overhead and retain full control. MongoDB sharding is better when you need automatic balancing and a transparent routing layer.',
        },
      ],
    },
    failures: [
      {
        name: 'Monotonically increasing shard key causing write hotspot',
        cause: 'Sharding on `_id` (ObjectId contains timestamp) or `createdAt` means all new inserts target the "maximum" chunk on one shard — other shards sit idle',
        symptom: 'One shard\'s primary CPU and disk I/O are maxed out; other shards are nearly idle; the balancer cannot keep up because the hot chunk is always the newest one',
        fix: 'Use a hashed shard key `{ _id: "hashed" }` for uniform distribution. Alternatively, use a compound shard key where the first field is a bucketed category (e.g. `{ tenantId: 1, _id: 1 }`) to spread writes across tenants. Recognize this during design — you cannot change the shard key without resharding.',
        severity: 'critical',
      },
      {
        name: 'Scatter-gather queries degrading latency at scale',
        cause: 'Application queries do not include the shard key; mongos broadcasts every query to all N shards and waits for the slowest response',
        symptom: 'Query latency multiplies proportionally with the number of shards; `explain()` shows a SHARD_MERGE stage across all shards',
        fix: 'Always include the shard key in application query filters. For analytics queries that legitimately need full-collection scans, use dedicated secondary reads or route them to a separate analytics cluster. Use `db.collection.find(...).explain()` to verify queries are targeted before deploying.',
        severity: 'high',
      },
    ],
    a: {
      v: '🔀 → 🗄️🗄️🗄️',
      t: 'A library with multiple wings, each holding books by a different letter range',
      tx: 'A single library wing can only hold so many books. When the collection outgrows it, you open new wings — each wing holds books for a specific letter range (A–G in wing 1, H–P in wing 2, Q–Z in wing 3). The librarian at the front desk (mongos) knows which wing holds which letters and sends you directly there. Ask for "Herman Melville" and you go straight to wing 2 — a targeted query. Ask for "all books about the sea" and the librarian must check every wing — scatter-gather. The building\'s blueprint (config servers) maps the letter ranges to wings. The shard key is the decision of how to arrange the letters — chosen once, never changed.',
      s: 'mongos routes queries using the chunk map; shard key choice determines whether queries are targeted or scatter-gather; bad shard keys cause hotspots or jumbo chunks.',
    },
    te: {
      def: 'MongoDB sharding horizontally partitions a collection across N replica sets (shards). mongos routes queries using a chunk map stored on config servers. Each chunk covers a shard key range. The balancer migrates chunks to maintain even distribution.',
      types: [
        { n: 'Hashed sharding', d: 'Hash applied to shard key → uniform distribution → no hotspots → equality queries only.' },
        { n: 'Range sharding', d: 'Contiguous key ranges per chunk → efficient range queries → hotspot risk on monotonic keys.' },
        { n: 'Zone sharding', d: 'Pin shard key ranges to specific shards for data residency (GDPR, latency).' },
        { n: 'Targeted query', d: 'Query includes shard key → mongos routes to exactly one shard.' },
        { n: 'Scatter-gather', d: 'Query lacks shard key → mongos broadcasts to all shards, merges results.' },
      ],
      when: 'Shard when write throughput or data volume exceeds single-node capacity. Choose hashed shard key for uniform write distribution. Choose range/compound shard key when queries need to be co-located by a natural grouping (e.g. all data for one tenant on one shard).',
      trade:
        'Pro: linear horizontal scale for storage and write throughput; zone sharding for data residency; targeted queries are as fast as single-node queries. Con: significant operational complexity; shard key is immutable; scatter-gather queries get slower as you add shards; cross-shard transactions are expensive; mongos adds a network hop.',
      code: `// ── ENABLE SHARDING ───────────────────────────────────
// Connect to mongos (NOT to a shard directly)
sh.enableSharding("myDatabase");

// ── CHOOSE AND APPLY SHARD KEY ────────────────────────
// Option 1: Hashed shard key (uniform distribution, equality queries only)
sh.shardCollection("myDatabase.events", { userId: "hashed" });

// Option 2: Range shard key (supports range queries, hotspot risk)
sh.shardCollection("myDatabase.orders", { customerId: 1, createdAt: 1 });

// Option 3: Compound hashed (balance + some locality)
sh.shardCollection("myDatabase.logs", { tenantId: 1, _id: "hashed" });

// ── SHARDING STATUS ───────────────────────────────────
sh.status();                       // overview of shards, chunks, balancer
db.orders.getShardDistribution();  // per-shard document + size counts

// ── QUERY TARGETING ───────────────────────────────────
// Targeted query (has shard key) → goes to ONE shard
db.orders.find({ customerId: "usr123" }).explain();
// executionStats.serverInfo.host → single shard

// Scatter-gather (no shard key) → ALL shards
db.orders.find({ status: "pending" }).explain();
// SHARD_MERGE stage → multiple shards

// ── CHUNK MANAGEMENT ──────────────────────────────────
use config
db.chunks.find({ ns: "myDatabase.orders" }).sort({ min: 1 }).limit(5).pretty();
// Each chunk: { min: { customerId: MinKey }, max: { customerId: "abc" }, shard: "shard0" }

// Manual chunk split (useful for pre-splitting before bulk load)
sh.splitAt("myDatabase.orders", { customerId: "m" });

// Move a chunk manually (avoid the balancer if needed)
sh.moveChunk("myDatabase.orders", { customerId: "m" }, "shard1");

// ── ZONE SHARDING (GDPR data residency) ──────────────
// Add shards to zones
sh.addShardTag("shard-eu-1", "EU");
sh.addShardTag("shard-us-1", "US");

// Define which key ranges go to each zone
sh.addTagRange(
  "myDatabase.users",
  { region: "EU", _id: MinKey },
  { region: "EU", _id: MaxKey },
  "EU"
);
sh.addTagRange(
  "myDatabase.users",
  { region: "US", _id: MinKey },
  { region: "US", _id: MaxKey },
  "US"
);

// ── JUMBO CHUNK DETECTION ─────────────────────────────
use config
db.chunks.find({ ns: "myDatabase.events", jumbo: true }).count();
// If > 0, you have a bad shard key — all documents share the same value
// Fix: add a second field to the shard key to increase cardinality

// ── BALANCER CONTROL ──────────────────────────────────
sh.stopBalancer();                    // pause balancer (e.g., during peak hours)
sh.startBalancer();
sh.isBalancerRunning();
sh.getBalancerWindow();
// Set balancer to run only in maintenance window
db.settings.updateOne(
  { _id: "balancer" },
  { $set: { activeWindow: { start: "02:00", stop: "05:00" } } },
  { upsert: true }
);`,
      rw: {
        ex: [
          'Foursquare shards geospatial data by geohash prefix for locality-based query targeting',
          'CERN shards particle physics experiment data by experiment ID to keep each experiment\'s data co-located',
          'eBay uses zone sharding to pin regional auction data to regional data centres for latency and compliance',
          'Amadeus (travel) shards flight inventory by route hash for uniform distribution across booking surges',
        ],
        cs: 'A multi-tenant SaaS platform initially shards on `{ _id: "hashed" }` for uniform distribution. As the platform grows, analytics queries that need all records for a single tenant become expensive scatter-gather operations across 8 shards. The team reshards to `{ tenantId: 1, _id: 1 }` — now all tenant data is co-located, tenant-scoped queries are targeted to one shard, and cross-tenant analytics are isolated to their own mongos read pool with secondary read preference.',
      },
    },
    interview: {
      q: 'How do you choose a shard key in MongoDB, and what happens if you choose wrong?',
      a: 'A good shard key has three properties: high cardinality (many distinct values so chunks can split), uniform write distribution (no single value receives a disproportionate share of writes), and query alignment (your most common query filters include the shard key for targeted routing). If you choose wrong — e.g. a timestamp or ObjectId that is monotonically increasing — all new inserts always hit the same "max" chunk on one shard. The other shards sit idle and the hot shard becomes a bottleneck. The balancer cannot help because the hot chunk is always the newest one, not an old one it can migrate. The only fix is resharding (expensive in MongoDB 5.0+, previously impossible). Always prototype with production-scale data and query patterns before committing to a shard key.',
      fu: [
        'What is the difference between a targeted query and a scatter-gather query in a sharded cluster, and how does explain() help you identify which one you have?',
        'Explain what a jumbo chunk is and how it forms — what does its existence tell you about your shard key?',
        'How does zone sharding work, and give a real-world example of when you would use it?',
      ],
    },
  },

  {
    id: 'mongodb-transactions',
    cat: 'mongodb',
    color: '#00ed64',
    icon: '🔒',
    title: 'MongoDB Multi-Document Transactions',
    tag: 'ACID transactions since 4.0 — snapshot isolation across multiple documents and collections',
    overview:
      'MongoDB multi-document transactions provide ACID guarantees across multiple documents, collections, and (since 4.2) shards. All reads within a transaction see a consistent snapshot; all writes are atomic — either all commit or all roll back. The document model is designed to minimise the need for transactions (embed related data in one document for single-write atomicity), but transactions are available when cross-document atomicity is unavoidable.',
    components: [
      {
        name: 'Session',
        icon: '🪪',
        role: 'The context object that groups operations into a single transaction',
        detail:
          'Created with `client.startSession()`. Every operation in the transaction must pass the session object. The session tracks transaction state: in-progress, committed, or aborted. A session can run only one transaction at a time. Sessions must be ended (`session.endSession()`) to release server-side resources.',
      },
      {
        name: 'Snapshot Isolation',
        icon: '📸',
        role: 'All reads within the transaction see a consistent point-in-time snapshot',
        detail:
          'Implemented via WiredTiger\'s MVCC (multi-version concurrency control). When the transaction starts, MongoDB takes a snapshot of the data. All reads within the transaction see data as it was at that moment — not affected by concurrent writes from other sessions. No dirty reads, no non-repeatable reads. The `readConcern: "snapshot"` level is recommended for transactions.',
      },
      {
        name: 'Write Conflicts',
        icon: '⚡',
        role: 'Optimistic concurrency — conflict detected at write time, not lock at read time',
        detail:
          'MongoDB uses optimistic concurrency control. If two concurrent transactions both attempt to write the same document, the second one receives a `WriteConflict` error immediately — it does not block waiting for a lock. The application must catch `TransientTransactionError` and retry the entire transaction from the start with a fresh snapshot.',
      },
      {
        name: 'Abort & Rollback',
        icon: '↩️',
        role: 'Any failure rolls back all writes in the transaction atomically',
        detail:
          'If any operation fails, the application calls `abortTransaction()`, or the maximum transaction runtime (60 seconds, configurable via `transactionLifetimeLimitSeconds`) is exceeded, all writes are rolled back atomically. No partial state is ever visible to other readers.',
      },
    ],
    howItWorks:
      'The document model is your first line of defence against needing transactions. Embedding related data in a single document makes any update to that document atomic without a transaction — MongoDB guarantees single-document atomicity at all times. Design your schema to embed what you read and write together. Transactions are needed when you genuinely must atomically update multiple separate documents — the canonical example is a bank transfer: debit account A and credit account B must both succeed or both fail.\n\nTransaction lifecycle: `session.startTransaction()` → execute reads and writes (all passing the session object) → `session.commitTransaction()` (success path) or `session.abortTransaction()` (failure path) → `session.endSession()`.\n\nThe `withTransaction()` helper (available in all modern drivers) wraps this lifecycle and automatically handles retries on `TransientTransactionError` — you provide a callback function with the business logic.\n\nPerformance cost: a transaction holds a WiredTiger snapshot for its entire duration. Long-running transactions block the WiredTiger cache from reclaiming old MVCC versions — increasing memory pressure and potentially slowing all other operations on the same documents. MongoDB recommends OLTP transactions complete within 1 second. Move all computation outside the transaction; inside the transaction, only execute the minimal set of database reads and writes.\n\nRetryable transactions: on a `WriteConflict` or transient network error (labelled `TransientTransactionError`), retry the entire transaction function — not just the failed operation. Each retry starts with a fresh snapshot. For commit errors labelled `UnknownTransactionCommitResult`, retry only the commit (the writes already happened and are safe to commit again).\n\nDistributed transactions (sharded clusters): MongoDB 4.2+ supports transactions spanning multiple shards. mongos coordinates a two-phase commit across all participating shards. Latency is higher than single-shard transactions — design your shard key to co-locate related documents on the same shard, making most transactions single-shard.',
    decision: {
      choose: [
        'You must atomically update multiple documents across multiple collections (e.g. bank transfer, order + inventory decrement)',
        'You need rollback on partial failure — no intermediate state should be visible',
        'You are migrating a relational workload that relies on multi-row transactions',
      ],
      avoid: [
        'When a schema redesign (embedding) can make the operation single-document — embed first, transact as a last resort',
        'For high-contention hot documents — WriteConflict retries under load cause latency spikes; use atomic operators ($inc, findOneAndUpdate) instead',
        'Long-running transactions (> 1 second) — they degrade the WiredTiger cache and block MVCC cleanup',
        'Cross-shard transactions on every request in a sharded cluster — design shard key for co-location instead',
      ],
      vs: [
        {
          name: 'Single-document atomic operations',
          when: 'Always prefer these. $inc, $push, findOneAndUpdate, updateOne with a condition — these are atomic without any session overhead and are much faster than transactions.',
        },
        {
          name: 'Optimistic concurrency (version field)',
          when: 'For single-document updates where you need to detect concurrent modification without a transaction: read the document, check the version field in the update filter, increment version in the $set. If modifiedCount === 0, another process won — retry.',
        },
      ],
    },
    failures: [
      {
        name: 'Transaction exceeding 60-second limit and aborting automatically',
        cause: 'Transaction is doing heavy computation, calling external APIs, or waiting on user input between database operations — all while holding the WiredTiger snapshot open',
        symptom: 'Application receives `TransactionExceededLifetimeLimitSeconds` error; all writes in the transaction are silently rolled back; user-visible data is in the pre-transaction state',
        fix: 'Pre-compute everything outside the transaction. Inside the transaction, execute only the minimal set of database reads and writes. A well-designed OLTP transaction should complete in milliseconds, not seconds. Never call external services, sleep, or wait for user input inside a transaction.',
        severity: 'high',
      },
      {
        name: 'Write conflicts causing excessive retries on hot documents',
        cause: 'High-contention document (e.g. a global inventory counter, a shared sequence) — most concurrent transactions conflict and retry in a loop, each consuming resources',
        symptom: '`WriteConflict` errors flood the logs; transaction throughput is much lower than expected; CPU is high on retries with low actual commit rate',
        fix: 'Redesign to avoid hot documents. Use `$inc` atomic operators without a transaction for counters — a single `updateOne` with `$inc` is atomic and never conflicts. Use MongoDB\'s `findOneAndUpdate` for compare-and-swap on a single document. If cross-document atomicity is truly needed, shard the hot document\'s load by introducing a bucketed counter pattern and aggregating periodically.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🔒 → ✅ or ↩️',
      t: 'A safety deposit box procedure at a bank',
      tx: 'At a bank, moving valuables between two safety deposit boxes requires a formal procedure: you sign in (startSession), the clerk locks both boxes so no one else can modify them during the transfer (snapshot isolation), you physically move the items (writes), and only when everything is accounted for does the clerk unseal the record and hand you a receipt (commitTransaction). If anything goes wrong mid-transfer, the clerk reverses every action and both boxes return to their original state (abortTransaction). The procedure takes a few minutes — not hours. If you tried to hold both boxes locked for an hour while you went to lunch, the bank would cancel the procedure. MongoDB\'s transactions work the same way: fast, purposeful, and never left open.',
      s: 'Start session → execute minimal reads and writes → commit or abort. Keep transactions under 1 second. Prefer embedding and atomic operators over transactions.',
    },
    te: {
      def: 'MongoDB multi-document transactions provide ACID guarantees across documents, collections, and shards (4.2+). WiredTiger MVCC implements snapshot isolation. Optimistic concurrency detects write conflicts at commit time. Maximum transaction lifetime is 60 seconds.',
      types: [
        { n: 'Single-document transaction', d: 'Implicit — every MongoDB write to a single document is always atomic. No session needed.' },
        { n: 'Multi-document transaction', d: 'Explicit session + startTransaction. ACID across N documents and collections.' },
        { n: 'Distributed transaction', d: 'MongoDB 4.2+. Spans shards via two-phase commit coordinated by mongos. Higher latency.' },
        { n: 'Retryable transaction', d: 'withTransaction() pattern — automatically retries on TransientTransactionError with a fresh snapshot.' },
        { n: 'Optimistic concurrency (no transaction)', d: 'Version field pattern — conditional update fails if another writer modified the document. Retry in application.' },
      ],
      when: 'Use transactions when embedding cannot make the operation single-document AND atomicity across multiple documents is a hard requirement. The ordering is: (1) redesign schema to embed, (2) use atomic operators ($inc, findOneAndUpdate), (3) use optimistic concurrency with a version field, (4) use a transaction as a last resort.',
      trade:
        'Pro: true ACID across multiple documents and collections; rollback on any failure; familiar semantics for developers coming from relational databases. Con: significant performance overhead vs single-document operations; write conflicts under high contention require retry logic; long transactions degrade WiredTiger cache; distributed transactions in sharded clusters add latency and complexity.',
      code: `// ── BASIC TRANSACTION ─────────────────────────────────
const client = new MongoClient(uri);
const session = client.startSession();

try {
  const result = await session.withTransaction(async () => {
    const accounts = client.db("bank").collection("accounts");
    const transfers = client.db("bank").collection("transfers");

    // All operations use the same session
    const sender = await accounts.findOne(
      { userId: "alice" },
      { session }
    );

    if (sender.balance < 100) {
      await session.abortTransaction();
      throw new Error("Insufficient funds");
    }

    // Debit sender
    await accounts.updateOne(
      { userId: "alice" },
      { $inc: { balance: -100 } },
      { session }
    );

    // Credit receiver
    await accounts.updateOne(
      { userId: "bob" },
      { $inc: { balance: 100 } },
      { session }
    );

    // Record transfer
    await transfers.insertOne(
      { from: "alice", to: "bob", amount: 100, timestamp: new Date() },
      { session }
    );
  }, {
    readPreference: "primary",
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  console.log("Transaction committed:", result);
} catch (error) {
  console.error("Transaction failed:", error);
} finally {
  await session.endSession();
}

// ── RETRYABLE TRANSACTION PATTERN ────────────────────
async function runTransactionWithRetry(txnFunc, client, session) {
  while (true) {
    try {
      await txnFunc(client, session);  // performs transaction
      break;
    } catch (error) {
      // Retry on transient transaction errors
      if (error.hasErrorLabel("TransientTransactionError")) {
        console.log("TransientTransactionError — retrying transaction");
        continue;
      }
      throw error;
    }
  }
}

async function commitWithRetry(session) {
  while (true) {
    try {
      await session.commitTransaction();
      break;
    } catch (error) {
      if (error.hasErrorLabel("UnknownTransactionCommitResult")) {
        console.log("UnknownTransactionCommitResult — retrying commit");
        continue;
      }
      throw error;
    }
  }
}

// ── OPTIMISTIC CONCURRENCY WITHOUT TRANSACTIONS ───────
// Alternative to transactions for single-document updates: version field
// Read
const product = await db.products.findOne({ _id: productId });
const currentVersion = product.version;

// Conditional update (fails if another process modified it)
const result = await db.products.updateOne(
  { _id: productId, version: currentVersion },    // version check
  {
    $inc: { stock: -1, version: 1 },              // decrement + bump version
  }
);

if (result.modifiedCount === 0) {
  throw new Error("Concurrent modification — retry");
}

// ── TRANSACTION MONITORING ────────────────────────────
db.currentOp({ "transaction": { $exists: true } });  // see active transactions
db.adminCommand({ serverStatus: 1 }).transactions;   // transaction stats`,
      rw: {
        ex: [
          'Stripe uses MongoDB transactions for idempotent payment record creation across charge + ledger collections',
          'Robinhood uses multi-document transactions for trade settlement: order record + account balance + position update',
          'Expedia uses transactions for booking confirmation: reservation record + seat inventory decrement across collections',
          'MongoDB Atlas uses distributed transactions internally for multi-region cluster metadata consistency',
        ],
        cs: 'A fintech startup builds a peer-to-peer payment feature. Initially they use two separate updateOne() calls — debit Alice, credit Bob. Under load, they discover a bug: if the credit to Bob fails (e.g. validation error), Alice has already been debited. They migrate to a transaction with w:majority: debit and credit happen atomically inside withTransaction(). The driver automatically retries on TransientTransactionError. They keep the transaction body to under 200ms by moving all validation logic (balance check, fraud check) outside the transaction — read-then-act pattern — and only the two updateOne() calls run inside the session.',
      },
    },
    interview: {
      q: 'When would you use a MongoDB transaction vs redesigning your schema to avoid the need for one?',
      a: 'The MongoDB document model is designed so that transactions are rarely needed. Before reaching for a transaction, I ask: can I embed the related data in a single document? A single-document write is always atomic — no session overhead, no write conflicts, no 60-second timeout. For example, an order document that embeds its line items needs no transaction to update quantities. Transactions are the right choice when the data genuinely belongs in separate documents (e.g. two user accounts in a bank transfer — you cannot embed Alice\'s account inside Bob\'s) AND you need atomicity across both. Even then, I check whether atomic operators ($inc, findOneAndUpdate with a filter) can solve the problem without a transaction. Transactions are expensive: they hold MVCC snapshots, can conflict and require retries, and add latency — especially in sharded clusters.',
      fu: [
        'What does `TransientTransactionError` mean, and how does your retry strategy differ from retrying a `UnknownTransactionCommitResult`?',
        'How does snapshot isolation in a MongoDB transaction differ from read-committed isolation, and what class of bugs does snapshot isolation prevent?',
        'In a sharded cluster, what happens when a transaction touches documents on two different shards? How does MongoDB ensure atomicity across them?',
      ],
    },
  },
];
