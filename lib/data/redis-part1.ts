import { Concept } from '../types';

export const REDIS_PART1: Concept[] = [
  {
    id: 'redis-data-structures',
    cat: 'redis',
    color: '#dc2626',
    icon: '🗂️',
    title: 'Redis Data Structures',
    tag: 'A Swiss Army knife — the right tool for every access pattern',
    overview:
      'Redis is not just a cache — it is a data structure server. Each data type comes with atomic O(1) or O(log n) commands that replace complex application logic. Choosing the right structure eliminates entire classes of race conditions and reduces round-trips.',
    components: [
      {
        name: 'Strings',
        icon: '🔤',
        role: 'Atomic counters, session tokens, cached JSON blobs',
        detail:
          'INCR/DECR are atomic — no compare-and-swap needed. GETSET and SETNX build locks. SET key value EX 300 sets with TTL in one command.',
      },
      {
        name: 'Lists',
        icon: '📋',
        role: 'Ordered queues and recent-item feeds',
        detail:
          'LPUSH + BRPOP implements a reliable job queue. LTRIM caps the list length after each push, keeping a sliding window of the last N items.',
      },
      {
        name: 'Hashes',
        icon: '#️⃣',
        role: 'Object storage — store fields of a record together',
        detail:
          'HSET user:123 name Alice age 30. HGETALL fetches all fields. Smaller memory footprint than one String key per field when fields < 128 and values < 64 bytes (ziplist encoding).',
      },
      {
        name: 'Sets',
        icon: '🔵',
        role: 'Unique membership, tag systems, mutual friends',
        detail:
          'SISMEMBER O(1). SINTER computes intersection of two sets — "users who follow both A and B". SUNIONSTORE materialises union into a new key.',
      },
      {
        name: 'Sorted Sets',
        icon: '🏆',
        role: 'Leaderboards, rate limiting, priority queues',
        detail:
          'ZADD adds with score. ZRANGEBYSCORE returns members in a score range. ZRANK gives position in O(log n). Score can be a Unix timestamp for expiry-ordered sets.',
      },
      {
        name: 'HyperLogLog',
        icon: '📊',
        role: 'Approximate cardinality counting with fixed 12KB memory',
        detail:
          'PFADD tracks unique items. PFCOUNT returns estimate with ≤0.81% error. Use for daily active users, unique page views — never store every ID.',
      },
      {
        name: 'Streams',
        icon: '🌊',
        role: 'Durable append-only event log with consumer groups',
        detail:
          'XADD appends an entry with auto-generated ID. XREADGROUP reads with acknowledgement. XPENDING shows unacknowledged entries — enables at-least-once processing.',
      },
    ],
    howItWorks:
      'Redis stores all data in RAM and uses a single-threaded event loop for command execution, which eliminates locks and makes every command atomic. Each data type uses a compact internal encoding (ziplist, listpack, skiplist, hashtable) selected automatically based on size thresholds — e.g. small Hashes use ziplist (contiguous memory, CPU cache-friendly) and switch to hashtable once fields exceed 128 or values exceed 64 bytes.\n\nThe sorted set combines a skip list (for range queries in O(log n)) with a hash table (for O(1) score lookup by member). This dual structure is why ZADD, ZRANK, and ZRANGEBYSCORE are all fast.\n\nStreams use a radix tree of listpack nodes. Each XADD appends to the current node until it is full, then creates a new node — O(1) amortised. Consumer groups track the last delivered ID and a Pending Entry List (PEL) for unacknowledged messages, enabling reliable processing without a separate broker.',
    decision: {
      choose: [
        'You need atomic counters without transactions (Strings + INCR)',
        'Real-time leaderboards or rate limiting windows (Sorted Sets)',
        'Reliable background job queue (Lists + BRPOP)',
        'Approximate cardinality at massive scale with fixed memory (HyperLogLog)',
        'Durable event log with consumer groups that do not need Kafka scale (Streams)',
      ],
      avoid: [
        'Strong durability guarantees — Redis is primarily in-memory',
        'Complex relational queries across multiple keys',
        'Data sets larger than available RAM without careful eviction policy',
      ],
      vs: [
        {
          name: 'Kafka',
          when: 'Need millions of events/sec, multi-region replication, and months of retention — Streams are Kafka-lite for moderate scale.',
        },
        {
          name: 'Memcached',
          when: 'Memcached only has Strings and is simpler; choose Redis whenever you need any non-string structure or persistence.',
        },
      ],
    },
    failures: [
      {
        name: 'Hot Key Bottleneck',
        cause: 'All traffic for a viral item hits one Redis key (e.g. a product page counter)',
        symptom: 'Single-threaded Redis CPU at 100%; latency spikes across all commands',
        fix: 'Shard the key (counter:product:123:shard:{0..9}), aggregate in app, or use local in-process cache for reads',
        severity: 'critical',
      },
      {
        name: 'Unbounded List Growth',
        cause: 'LPUSH used as a queue but nothing consumes fast enough',
        symptom: 'Memory grows until OOM killer fires or maxmemory evicts random keys',
        fix: 'Always pair LPUSH with LTRIM to cap the list length; use a stream with MAXLEN instead',
        severity: 'high',
      },
      {
        name: 'Wrong Encoding Threshold',
        cause: 'Exceeding hash-max-listpack-entries causes O(n) operations to become O(n²) temporarily during rehash',
        symptom: 'Latency spike when a Hash crosses 128 fields',
        fix: 'Tune hash-max-listpack-entries and hash-max-listpack-value to match your access patterns',
        severity: 'medium',
      },
    ],
    a: {
      v: '🗂️ → 🛠️',
      t: 'A hardware store with the right tool for every job',
      tx: 'A hardware store does not sell just one product. It stocks hammers for nails, screwdrivers for screws, and levels for alignment — each optimised for one task. Using a hammer to turn a screw works, but it is slow and damaging. Redis is the same: Strings are your hammer, Sorted Sets are your precision caliper, HyperLogLog is your laser measure. Grab the wrong tool and you write ten lines of application code to compensate for what one Redis command would have done atomically.',
      s: 'Pick the data structure that matches the access pattern — not the one you know best.',
    },
    te: {
      def: 'Redis exposes seven first-class data structures — Strings, Lists, Hashes, Sets, Sorted Sets, HyperLogLog, and Streams — each with atomic commands that replace multi-step application logic.',
      types: [
        { n: 'String', d: 'Binary-safe value up to 512 MB. Supports atomic INCR, DECR, APPEND, GETSET.' },
        { n: 'List', d: 'Doubly-linked list. LPUSH/RPUSH, LRANGE, BRPOP for blocking dequeue.' },
        { n: 'Hash', d: 'Field-value map. HSET/HGET/HGETALL. Compact ziplist encoding for small hashes.' },
        { n: 'Set', d: 'Unordered unique strings. SADD/SMEMBERS/SINTER/SUNION/SDIFF.' },
        { n: 'Sorted Set', d: 'Members with float score. ZADD/ZRANK/ZRANGEBYSCORE. Backed by skip list + hash table.' },
        { n: 'HyperLogLog', d: 'Probabilistic cardinality estimator. PFADD/PFCOUNT. Fixed 12KB, ≤0.81% error.' },
        { n: 'Stream', d: 'Append-only log with consumer groups. XADD/XREADGROUP/XACK.' },
      ],
      when: 'Use Sorted Sets for leaderboards and rate limiting; Lists for queues; Hashes for user sessions; HyperLogLog for DAU counts; Streams when you need at-least-once processing without Kafka.',
      trade:
        'Pro: atomic operations eliminate application-level locking; compact encodings save memory; O(1) or O(log n) for most operations. Con: all data in RAM means cost scales with data size; wrong structure choice causes latency cliffs at encoding thresholds.',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// String — atomic counter
await redis.incr('page:views:home');

// Hash — session object
await redis.hset('session:abc', { userId: '123', role: 'admin', exp: '1700000000' });
const session = await redis.hgetall('session:abc');

// Sorted Set — leaderboard
await redis.zadd('leaderboard', 9850, 'alice', 4200, 'bob');
const top10 = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');

// HyperLogLog — unique visitor count
await redis.pfadd('uv:2024-01-15', 'user:1', 'user:2', 'user:1');
const unique = await redis.pfcount('uv:2024-01-15'); // ≈ 2`,
      rw: {
        ex: [
          'Twitter uses Sorted Sets for home timeline ordering by tweet ID',
          'GitHub uses Sets for repository star deduplication',
          'Stack Overflow uses Strings + INCR for question view counters',
          'Uber uses Streams for driver location event processing',
        ],
        cs: "Twitter stores each user's home timeline as a Redis Sorted Set, with tweet IDs as members and timestamps as scores. ZREVRANGE fetches the 100 most recent tweets in O(log n). This reduces fan-out read latency from hundreds of milliseconds (DB query) to under 1ms.",
      },
    },
    interview: {
      q: 'A product page is getting 100K requests/second and your Redis CPU is maxed out on a single key. How do you fix it?',
      a: 'This is a hot key problem — Redis is single-threaded so one key can saturate the CPU. Short term: enable local in-process caching (LRU cache in the app tier) to absorb most reads before they reach Redis. Medium term: shard the key across N Redis instances (e.g. counter:product:123:shard:{rand(0,9)}) and aggregate on read. For read-heavy counters, consider a read replica per region. For write-heavy counters, batch increments in the app and flush every 100ms rather than every request.',
      fu: [
        'How does Redis Cluster distribute keys across shards, and what happens to hot keys in that model?',
        'When would you choose HyperLogLog over a Set for counting unique users?',
        'What are the memory encoding thresholds for Hashes and why do they matter?',
      ],
    },
  },
  {
    id: 'cache-aside',
    cat: 'redis',
    color: '#dc2626',
    icon: '📖',
    title: 'Cache-Aside (Lazy Loading)',
    tag: "Check the whiteboard first — only fetch from the source if it's blank",
    overview:
      'Cache-aside (also called lazy loading) puts the application in full control of the cache. On a read, the application checks the cache first; on a miss it fetches from the database, writes the result to cache, and returns it. The cache is populated organically by actual demand, so cold keys never waste memory.',
    components: [
      {
        name: 'Cache Client',
        icon: '🔍',
        role: 'Issues GET to cache before touching DB',
        detail:
          'On HIT returns cached value immediately. On MISS delegates to the DB and then populates the cache. The application owns this logic — not a proxy.',
      },
      {
        name: 'Miss Handler',
        icon: '🔄',
        role: 'Fetches from DB on cache miss and backfills cache',
        detail:
          'Executes the DB query, serialises the result, then calls SET key value EX ttl. Backfill happens synchronously in the same request cycle to minimise duplicate misses.',
      },
      {
        name: 'TTL Manager',
        icon: '⏱️',
        role: 'Sets expiry on cached entries to prevent stale data accumulating',
        detail:
          'TTL is the primary consistency mechanism. Short TTLs (seconds) tolerate staleness poorly but stay fresh; long TTLs (hours) are efficient but risk serving outdated data after DB writes.',
      },
      {
        name: 'Thundering Herd Guard',
        icon: '🛡️',
        role: 'Prevents cache stampede when a popular key expires',
        detail:
          'Options: probabilistic early expiry (re-cache before TTL hits 0), distributed lock around the miss path (only one process refills), or stale-while-revalidate (serve stale, refresh async).',
      },
    ],
    howItWorks:
      'When a request arrives, the application calls GET on the cache key. If the value is present (cache hit), it is returned immediately — the database is never contacted. If absent (cache miss), the application queries the database, then calls SET key value EX {ttl} to store the result with a time-to-live, and finally returns the value to the caller.\n\nThe lazy loading characteristic means the cache only ever contains data that has been requested at least once. This is memory-efficient: cold data (never requested) stays out of the cache entirely. The trade-off is that the very first request for any key always incurs a DB round-trip — leading to a "cold start" problem after a cache flush or Redis restart.\n\nThe thundering herd (or cache stampede) is the critical failure mode. If a popular key expires, hundreds of concurrent requests all miss at the same moment, all query the DB simultaneously, and all attempt to write the same value back to Redis. The fix is to serialize the miss path: use a Redis lock (SET lock:key 1 NX EX 5) so only the first process refills the cache while others wait or serve a slightly stale value.',
    decision: {
      choose: [
        'Read-heavy workloads where most reads hit the same keys',
        'Tolerable staleness — data does not need to be perfectly fresh on every read',
        'You want to avoid warming the cache with data that may never be read',
      ],
      avoid: [
        'Strong consistency requirements where every read must reflect the latest write',
        'Write-heavy workloads where invalidation is more frequent than reads hit the cache',
        'When cache miss latency is unacceptable (e.g. real-time bidding < 10ms SLA)',
      ],
      vs: [
        {
          name: 'Write-Through',
          when: 'Write-through keeps cache always consistent with DB — choose it when reads must always be fresh and write latency is acceptable.',
        },
        {
          name: 'Read-Through',
          when: 'Read-through is cache-aside managed by the cache layer itself (e.g. DAX for DynamoDB) — same pattern but the cache handles the miss logic, not your application code.',
        },
      ],
    },
    failures: [
      {
        name: 'Cache Stampede',
        cause: 'A popular key expires and hundreds of concurrent requests all miss simultaneously',
        symptom: 'DB CPU spikes to 100%, latency jumps 10x for the duration of the storm',
        fix: 'Use probabilistic early expiry, mutex lock on miss path, or stale-while-revalidate',
        severity: 'critical',
      },
      {
        name: 'Stale Data After Write',
        cause: 'DB is updated but the old value is still served from cache until TTL expires',
        symptom: 'Users see outdated prices, stock levels, or profile data',
        fix: 'Invalidate or update the cache key immediately on every DB write (cache invalidation strategy)',
        severity: 'high',
      },
      {
        name: 'Cold Start After Flush',
        cause: 'Redis restart or FLUSHDB causes 100% miss rate',
        symptom: 'DB overwhelmed; latency spikes until cache warms up organically',
        fix: 'Pre-warm cache from DB on startup for the top-N hottest keys',
        severity: 'high',
      },
    ],
    a: {
      v: '📖 → 📚',
      t: 'Checking a whiteboard before opening the textbook',
      tx: 'A student answering a question first glances at the whiteboard where the teacher wrote the answer earlier in the class. If it is there — great, instant answer. If the whiteboard was erased overnight, the student has to open the textbook, find the answer, and write it back on the whiteboard for the next person. This is cache-aside: the whiteboard (cache) is only populated when someone actually needs the answer, not proactively before class starts.',
      s: 'Read from cache first; on miss, fetch from DB and backfill the cache.',
    },
    te: {
      def: 'Cache-aside is a caching pattern where the application manages cache population manually: check cache first, and only on a miss query the database and write the result back to the cache.',
      types: [
        { n: 'Lazy Loading', d: 'Cache populated on first read — memory-efficient, cold start on flush.' },
        { n: 'Stale-While-Revalidate', d: 'Serve stale data immediately, refresh asynchronously in background — hides latency.' },
        { n: 'Pre-warming', d: 'Proactively load hot keys into cache before traffic arrives — eliminates cold start.' },
      ],
      when: 'Use for read-heavy APIs where the same data is requested many times between writes — product catalogue, user profiles, config objects, leaderboards.',
      trade:
        'Pro: cache only holds actually-requested data; DB is the source of truth; simple to implement. Con: first request always slow; thundering herd on expiry; stale reads between TTL and next write.',
      code: `async function getUser(id: string) {
  const key = \`user:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);          // cache HIT

  const user = await db.query('SELECT * FROM users WHERE id=$1', [id]);
  await redis.set(key, JSON.stringify(user), 'EX', 300);  // 5 min TTL
  return user;                                    // cache MISS — backfilled
}`,
      rw: {
        ex: [
          'Facebook TAO uses cache-aside for social graph reads',
          'Amazon product detail pages lazy-load from ElastiCache',
          'GitHub serves repository metadata via cache-aside on Redis',
          'Airbnb listing search results cached lazily per query fingerprint',
        ],
        cs: "Facebook's memcached fleet (the largest in the world at >300TB) runs cache-aside for user profile reads. Every read checks memcached first; misses fall through to MySQL clusters. TTLs are tuned per data type: profile photos expire in hours, friend counts in minutes.",
      },
    },
    interview: {
      q: 'Your cache hit rate dropped from 95% to 60% overnight. How do you diagnose and fix it?',
      a: 'First check if TTLs got shortened accidentally — a configuration push could cause mass expiry. Next, check if traffic patterns changed: a new feature or marketing campaign may be requesting keys that were never cached before (new key space). Check Redis INFO stats for evicted_keys — if maxmemory was hit and keys were evicted, you need to increase memory or tune the eviction policy. If it is a thundering herd, add mutex locking on the miss path. Finally, check if a recent deploy invalidated the cache deliberately and traffic just has not warmed it yet.',
      fu: [
        'How would you implement cache invalidation when a user updates their profile?',
        'What is the difference between cache-aside and read-through caching?',
        'How do you handle thundering herd without a distributed lock?',
      ],
    },
  },
  {
    id: 'write-through-cache',
    cat: 'redis',
    color: '#dc2626',
    icon: '✏️',
    title: 'Write-Through Cache',
    tag: 'Write to the whiteboard and the filing cabinet simultaneously',
    overview:
      'In write-through caching, every write to the database is simultaneously written to the cache by the application or a middleware layer. The cache is always consistent with the database — there is never a window where the DB has newer data than the cache. The cost is higher write latency and potential cache pollution with rarely-read data.',
    components: [
      {
        name: 'Write Interceptor',
        icon: '✋',
        role: 'Captures every write and fans it out to both cache and DB',
        detail:
          'Can be implemented in the application service layer, an ORM hook, or a sidecar proxy. Must ensure both writes are attempted before returning success to the caller.',
      },
      {
        name: 'Cache Writer',
        icon: '💾',
        role: 'Writes the new value to the cache with appropriate TTL',
        detail:
          'Uses SET key value EX ttl. The TTL here is a safety net against logic bugs, not the primary staleness control — the explicit write keeps the cache fresh.',
      },
      {
        name: 'DB Writer',
        icon: '🗄️',
        role: 'Persists the canonical record to the database',
        detail:
          'This is the source of truth. If the DB write fails, the cache write must be rolled back or the cache key must be invalidated to avoid serving stale data.',
      },
      {
        name: 'Consistency Guard',
        icon: '🔒',
        role: 'Handles partial failure — cache written but DB failed (or vice versa)',
        detail:
          'Pattern: write to DB first, then cache. If DB fails, return error and do not touch cache. If cache fails after DB succeeds, invalidate the cache key (do not leave stale data).',
      },
    ],
    howItWorks:
      'When the application performs a write (INSERT, UPDATE, or DELETE), it writes to both the cache and the database in the same logical operation. Unlike cache-aside which only populates the cache on reads, write-through ensures the cache always reflects the latest committed state.\n\nThe typical order is: write to DB first (source of truth), then update the cache. This ordering means that if the cache write fails, the DB still has the correct data and the cache key can be invalidated to force a fresh read on the next request. Writing to cache first risks a scenario where the DB write fails but the cache serves the new (uncommitted) value.\n\nWrite-through eliminates the stale read problem entirely but introduces write amplification — every DB write now costs an additional cache write. It also causes cache pollution: if you write a record that is never subsequently read, you have wasted cache memory and incurred extra latency for no benefit.',
    decision: {
      choose: [
        'Read-heavy with frequent updates where stale data is unacceptable',
        'User-facing data that must always be fresh (shopping cart, account balance display)',
        'When you can accept slightly higher write latency in exchange for read consistency',
      ],
      avoid: [
        'Write-heavy workloads where cache pollution and write amplification dominate',
        'Bulk imports or ETL pipelines — bypass the cache for batch writes',
        'When DB write latency is already high (adding a cache write doubles the critical path)',
      ],
      vs: [
        {
          name: 'Cache-Aside',
          when: 'Cache-aside is simpler and avoids pollution — use it when you can tolerate a brief stale window after writes.',
        },
        {
          name: 'Write-Behind',
          when: 'Write-behind gives lower write latency but risks data loss — use it for high-frequency writes where eventual persistence is acceptable.',
        },
      ],
    },
    failures: [
      {
        name: 'Dual Write Inconsistency',
        cause: 'DB write succeeds but cache write fails — cache now serves stale data',
        symptom: 'Users see old values after updating their profile or cart',
        fix: 'On cache write failure, immediately DEL the key — next read will miss and backfill from DB',
        severity: 'critical',
      },
      {
        name: 'Cache Pollution',
        cause: 'Bulk import writes millions of records that are never subsequently read',
        symptom: 'Cache memory fills with cold data, evicting actually-hot keys',
        fix: 'Bypass the cache for batch/admin writes using a separate DB connection that skips the write-through layer',
        severity: 'high',
      },
      {
        name: 'Write Latency Regression',
        cause: 'Adding synchronous cache write doubles the write latency on a slow Redis connection',
        symptom: 'P99 write latency increases from 20ms to 40ms after cache layer introduction',
        fix: 'Ensure Redis is on the same network segment; use pipelining to batch the cache write if write throughput allows',
        severity: 'medium',
      },
    ],
    a: {
      v: '✏️ → 📋+🗄️',
      t: 'Signing a contract in duplicate — one copy for you, one for the archive',
      tx: 'When you sign an important contract, you and the other party each get an identical copy. Both copies are produced at the same time and contain the same information — there is no lag between them. Write-through caching works the same way: the moment you write a record to the database, an identical copy lands in the cache. Anyone who reads from the cache immediately after the write sees the fresh value, not the old one.',
      s: 'Every write goes to both DB and cache simultaneously — the cache is never stale.',
    },
    te: {
      def: 'Write-through is a caching strategy where every database write is synchronously replicated to the cache, keeping them always consistent at the cost of higher write latency.',
      types: [
        { n: 'Synchronous Write-Through', d: 'App writes to DB then cache in the same request cycle. Simple, consistent, higher latency.' },
        { n: 'Write-Through Proxy', d: 'A transparent proxy (e.g. Twemproxy, Redis Enterprise) intercepts writes and fans out automatically.' },
        { n: 'ORM-level Write-Through', d: 'Hooks in ActiveRecord, SQLAlchemy, or Hibernate automatically sync the cache on model save.' },
      ],
      when: 'Use when data is read frequently right after being written, and serving stale data even briefly is unacceptable — e.g. user account settings, feature flags, shopping cart state.',
      trade:
        'Pro: cache always consistent with DB; no stale-read window; eliminates thundering herd on popular newly-written keys. Con: higher write latency; cache pollution from write-only data; dual-write failure requires careful rollback.',
      code: `async function updateUser(id: string, data: Partial<User>) {
  // Write to DB first (source of truth)
  const updated = await db.query(
    'UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *',
    [data.name, data.email, id]
  );
  // Then update cache — if this fails, invalidate to avoid stale reads
  try {
    await redis.set(\`user:\${id}\`, JSON.stringify(updated.rows[0]), 'EX', 3600);
  } catch {
    await redis.del(\`user:\${id}\`); // fallback: force next read to hit DB
  }
  return updated.rows[0];
}`,
      rw: {
        ex: [
          'AWS ElastiCache for DAX (DynamoDB Accelerator) uses write-through by default',
          'Shopify uses write-through caching for product inventory counts',
          'LinkedIn uses write-through for profile view counters',
          'Redis Enterprise supports write-through via RediSearch module hooks',
        ],
        cs: "Shopify's product inventory service uses write-through caching with Redis to ensure that inventory counts displayed on product pages are always consistent with what was last written. When a purchase is confirmed and inventory is decremented in the DB, the Redis key is updated in the same transaction, eliminating any window where a customer could see incorrect stock levels.",
      },
    },
    interview: {
      q: 'In write-through caching, the DB write succeeds but the Redis write fails. What do you do?',
      a: 'The safest recovery is to immediately delete the cache key on Redis write failure. This turns the failure into a cache miss rather than a stale-data problem. The next read will miss the cache, fetch the freshly written value from the DB, and backfill the cache correctly. Do not leave the old value in the cache — a stale read is worse than a slow read. In distributed systems where the write-through is critical, you can also use a circuit breaker around the Redis call and degrade gracefully to DB-only reads until Redis recovers.',
      fu: [
        'How does write-through interact with cache eviction — what happens if the written key is evicted before it is read?',
        'How would you implement write-through for a write-behind-style bulk import without polluting the cache?',
        'What consistency guarantees does write-through provide compared to a database transaction?',
      ],
    },
  },
  {
    id: 'write-behind-cache',
    cat: 'redis',
    color: '#dc2626',
    icon: '📬',
    title: 'Write-Behind (Write-Back) Cache',
    tag: 'Leave a note — the filing cabinet will catch up later',
    overview:
      'Write-behind (also called write-back) accepts writes into the cache immediately and persists them to the database asynchronously. The caller gets a fast acknowledgement the moment the cache is updated; a background worker flushes dirty keys to the DB on a configurable schedule. This dramatically reduces write latency at the cost of durability — data not yet flushed is lost if the cache crashes.',
    components: [
      {
        name: 'Cache Buffer',
        icon: '🗂️',
        role: 'Accepts writes instantly and marks keys as dirty',
        detail:
          'The key is written to Redis immediately with a "dirty" flag or a separate dirty-keys set. The caller returns without waiting for the DB write.',
      },
      {
        name: 'Async Flush Worker',
        icon: '⚙️',
        role: 'Periodically reads dirty keys and persists them to the DB',
        detail:
          'Runs on a schedule (every 100ms, every 1s) or when the dirty-key set reaches a threshold. Processes in batches to maximise DB write throughput via INSERT ... ON CONFLICT DO UPDATE or bulk UPDATE.',
      },
      {
        name: 'Retry Queue',
        icon: '🔁',
        role: 'Re-queues failed DB writes for later retry',
        detail:
          'If the DB flush fails (timeout, connectivity), the dirty key stays in the queue and is retried with exponential backoff. After max retries, alerts fire and the key may be written to a dead-letter store.',
      },
      {
        name: 'Durability Guard',
        icon: '🛡️',
        role: 'Prevents data loss on Redis crash before flush',
        detail:
          'Enable AOF with fsync=everysec on the write-behind cache to limit data loss to ≤1 second of writes. Or use Redis persistence + replication so at least one replica has the dirty data.',
      },
    ],
    howItWorks:
      'The write path is: application calls SET key value in Redis → Redis acknowledges immediately → application returns success to the user. The DB has not been touched yet. A background flush worker (could be a cron job, a dedicated goroutine, or a Lua script triggered by Redis keyspace notifications) reads the set of dirty keys, fetches their current values, and batch-writes them to the database.\n\nThe flush interval determines the durability window. A 100ms flush means at most 100ms of writes can be lost in a crash. A 5-second flush is more efficient (larger DB batches) but riskier. The tradeoff is write latency (always near-zero for the caller) vs data-loss window (flush interval).\n\nWrite-behind is most effective when many writes to the same key occur before the flush. For example, a live view counter that increments 1000 times per second can be flushed once per second — the DB sees one UPDATE instead of 1000, reducing write amplification by 1000×.',
    decision: {
      choose: [
        'High write throughput where DB cannot keep up with every individual write',
        'Data where small data loss is acceptable: analytics counters, game scores, session activity timestamps',
        'When write latency is the primary SLA and eventual DB persistence is sufficient',
      ],
      avoid: [
        'Financial transactions, orders, payments — any domain where data loss is unacceptable',
        'Scenarios where you cannot afford any lost writes (legal, compliance, audit trails)',
        'Systems without Redis persistence — a crash before flush loses all buffered writes',
      ],
      vs: [
        {
          name: 'Write-Through',
          when: 'Write-through is safer — choose it when you cannot afford any data loss and write latency is acceptable.',
        },
        {
          name: 'Write-Around',
          when: 'Write-around bypasses the cache entirely on writes — use it when writes are rarely re-read and you do not want to pollute the cache.',
        },
      ],
    },
    failures: [
      {
        name: 'Data Loss on Cache Crash',
        cause: 'Redis crashes or is restarted before the flush worker drains the dirty-key queue',
        symptom: 'Writes acknowledged to users are silently lost; DB has old values',
        fix: 'Enable Redis AOF persistence (fsync=everysec) and replication; acknowledge the write only after it is on a replica',
        severity: 'critical',
      },
      {
        name: 'Out-of-Order Writes',
        cause: 'Flush worker processes dirty keys in an order different from when they were written',
        symptom: 'DB ends up with a stale value even though a newer write was acknowledged',
        fix: 'Store a version/timestamp with each dirty write; skip flush if DB already has a newer version',
        severity: 'high',
      },
      {
        name: 'Flush Worker Falling Behind',
        cause: 'Write rate exceeds the flush worker throughput during a traffic spike',
        symptom: 'Dirty-key queue grows unboundedly; memory pressure; eventual OOM',
        fix: 'Scale flush workers horizontally; use SCAN + pipeline to flush in parallel; set maxmemory with volatile-lru to evict non-dirty keys first',
        severity: 'high',
      },
    ],
    a: {
      v: '📬 → 🗄️',
      t: 'Leaving a sticky note for the secretary to file later',
      tx: "When you are in a rush, you scribble a note — \"file this contract in cabinet B\" — stick it on the secretary's desk, and run to your next meeting. You do not wait for the filing to happen. The secretary processes the note pile at the end of the day. Write-behind caching works the same way: the caller leaves a \"write this to the DB\" note (the dirty key in Redis) and immediately continues. The flush worker is the secretary who processes the pile asynchronously.",
      s: 'Accept writes into cache immediately; flush to DB asynchronously in the background.',
    },
    te: {
      def: 'Write-behind (write-back) is a caching strategy where writes are accepted by the cache immediately and persisted to the database asynchronously by a background worker, minimising write latency at the cost of a durability window.',
      types: [
        { n: 'Time-Based Flush', d: 'Flush dirty keys every N milliseconds regardless of volume — simple, predictable.' },
        { n: 'Threshold-Based Flush', d: 'Flush when dirty-key set reaches N entries — efficient for bursty writes.' },
        { n: 'Hybrid Flush', d: 'Flush on time OR threshold, whichever comes first — balances latency and throughput.' },
      ],
      when: 'Use for analytics counters, gaming leaderboards, social metrics (likes, view counts), session heartbeats — workloads with high write frequency where small data loss is tolerable.',
      trade:
        'Pro: write latency reduced to a Redis SET (sub-millisecond); DB write amplification massively reduced by batching. Con: data loss window equal to flush interval; complex failure handling; out-of-order writes if not version-stamped.',
      code: `// Flush worker — runs every 500ms
async function flushDirtyKeys() {
  const dirty = await redis.smembers('dirty:keys');
  if (!dirty.length) return;
  const pipeline = db.pipeline(); // batch DB writes
  for (const key of dirty) {
    const value = await redis.get(key);
    if (value) pipeline.query('INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT(k) DO UPDATE SET v=$2', [key, value]);
  }
  await pipeline.execute();
  await redis.srem('dirty:keys', ...dirty);
}
setInterval(flushDirtyKeys, 500);`,
      rw: {
        ex: [
          'MySQL InnoDB buffer pool uses write-back for all dirty pages',
          'Redis itself uses write-behind when AOF fsync=everysec',
          'Gaming companies (Supercell, Zynga) use write-behind for real-time score updates',
          'TikTok uses write-behind for video view counter batching',
        ],
        cs: "TikTok's video view counter system uses write-behind caching: every view increments a Redis counter instantly. A flush worker aggregates increments per video and bulk-writes them to the persistent store every few seconds, reducing DB writes by 99%+ while keeping the displayed count eventually consistent within seconds.",
      },
    },
    interview: {
      q: 'Your write-behind cache lost 30 seconds of user data after a Redis OOM restart. How do you prevent this?',
      a: 'Three layers of protection: First, enable Redis AOF persistence with fsync=everysec — limits loss to at most 1 second of writes. Second, use Redis replication (at least one replica) and acknowledge the write only after WAIT 1 0 confirms the replica has it. Third, reduce the flush interval to less than your acceptable loss window — if 30 seconds is unacceptable, flush every 5 seconds. For truly critical writes, promote them to write-through or write directly to the DB and skip write-behind entirely. Also set a maxmemory eviction policy of volatile-lru so dirty keys (which should have no TTL) are never evicted while non-critical keys with TTLs are.',
      fu: [
        'How would you handle a situation where two servers write to the same key concurrently in write-behind mode?',
        'What happens to in-flight dirty keys during a Redis failover in Sentinel mode?',
        'How do you implement write-behind without a dedicated flush worker process?',
      ],
    },
  },
  {
    id: 'write-around-cache',
    cat: 'redis',
    color: '#dc2626',
    icon: '🔀',
    title: 'Write-Around Cache',
    tag: 'Write directly to the archive — only cache what people actually read',
    overview:
      'Write-around bypasses the cache entirely on writes. Data goes straight to the database; the cache is only populated on the read path (via cache-aside). This prevents the cache from being flooded with data that is written once and rarely (or never) re-read, keeping cache memory reserved for genuinely hot data.',
    components: [
      {
        name: 'Direct DB Writer',
        icon: '🗄️',
        role: 'Writes data to the DB without touching the cache',
        detail:
          'The write path has no cache interaction. This is the default behaviour of most ORMs — write-around is often implicit unless you explicitly add cache population on writes.',
      },
      {
        name: 'Cache Reader',
        icon: '📖',
        role: 'Serves reads from cache when the key exists',
        detail:
          'Reads still use cache-aside: check cache first, miss → fetch from DB → backfill cache → return. Writes do not disturb this flow.',
      },
      {
        name: 'Selective Warmer',
        icon: '🔥',
        role: 'Optionally pre-warms the cache for data known to be hot after a write',
        detail:
          'After writing a high-traffic record (e.g. a product going on sale), the application can explicitly SET the new value in cache to avoid the first-read miss.',
      },
    ],
    howItWorks:
      'The write path is simple: call the DB directly, return success, never touch Redis. On the subsequent read path, the first request for the newly written key will be a cache miss (since the write never populated the cache), hit the DB, and backfill the cache. Every subsequent read is a cache hit until TTL expires.\n\nWrite-around is the right default for write-heavy workloads where most written records are never re-read — log ingestion, audit trails, bulk analytics imports. If you used write-through in these scenarios, you would burn cache memory on data that is never served from cache, evicting actually-hot keys.\n\nThe downside is that the first read after every write incurs DB latency. For data that is always read immediately after being written (e.g. a user creates a post and immediately views it), write-around is the wrong choice — the post creation write-around guarantees a slow first load.',
    decision: {
      choose: [
        'Write-heavy workloads where most records are never subsequently read (logs, audit, ETL)',
        'When cache memory is limited and you must reserve it for genuinely hot data',
        'Bulk imports where polluting the cache with batch data would evict hot production keys',
      ],
      avoid: [
        'Data that is always read immediately after being written — the first read will always be slow',
        'When you cannot tolerate any cache miss latency on newly created records',
        'Real-time feeds where the writer and reader are the same user (create post → view post immediately)',
      ],
      vs: [
        {
          name: 'Write-Through',
          when: 'Write-through populates the cache on every write — choose it when new records are immediately read after creation.',
        },
        {
          name: 'Write-Behind',
          when: 'Write-behind is also write-heavy but uses the cache as a buffer — choose it when you need to absorb write spikes, not just bypass the cache.',
        },
      ],
    },
    failures: [
      {
        name: 'First-Read Latency Spike',
        cause: 'Newly written data is always a cache miss; if the data becomes popular immediately, the first 100ms window sees full DB load',
        symptom: 'P99 latency spike visible immediately after publishing a viral piece of content',
        fix: 'Add selective cache warming on writes for high-traffic record types (products going on sale, breaking news articles)',
        severity: 'high',
      },
      {
        name: 'Stale Cache After Update',
        cause: 'A record is updated in the DB but the old cached value has not expired yet',
        symptom: 'Users see the old version of a record for up to TTL seconds after an update',
        fix: 'On update, explicitly DEL the cache key so the next read always fetches fresh from DB',
        severity: 'high',
      },
    ],
    a: {
      v: '🔀 → 🗄️',
      t: 'Dropping mail directly in the archive instead of the inbox',
      tx: 'A company receives thousands of legal documents per day, most of which will be stored and never looked at again. Filing them all in the front-office inbox (cache) wastes space and buries the important documents that are actually checked daily. Write-around caching applies the same logic: route bulk writes straight to the archive (database), keep the front office (cache) clean for the documents that are actually retrieved.',
      s: 'Writes go directly to the DB — only reads populate the cache.',
    },
    te: {
      def: 'Write-around is a caching pattern where writes bypass the cache entirely and go directly to the database; the cache is only populated on the read path, preventing cache pollution from write-heavy or write-once workloads.',
      types: [
        { n: 'Pure Write-Around', d: 'Every write goes to DB; cache only filled on read miss. Simple default for most ORMs.' },
        { n: 'Write-Around with Selective Warm', d: 'Most writes bypass cache, but high-traffic records are explicitly cached after write.' },
        { n: 'Write-Around with Invalidation', d: 'On update, DEL the cache key proactively to prevent stale reads, even though the write itself did not touch the cache.' },
      ],
      when: 'Use for log tables, audit trails, bulk analytics imports, or any workload where written records have a very low read probability after creation.',
      trade:
        'Pro: cache stays clean — memory used only by actually-hot data; no write amplification; simple implementation. Con: first read after every write is a cache miss; no protection against thundering herd on newly popular content.',
      code: `// Write-around: write directly to DB, do not touch cache
async function createAuditLog(entry: AuditEntry) {
  await db.query('INSERT INTO audit_log(user_id, action, ts) VALUES($1,$2,NOW())', [entry.userId, entry.action]);
  // No redis.set() here — audit logs are rarely re-read individually
}

// On read: cache-aside handles miss → backfill automatically
async function getAuditLog(userId: string) {
  const key = \`audit:\${userId}:recent\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const rows = await db.query('SELECT * FROM audit_log WHERE user_id=$1 ORDER BY ts DESC LIMIT 50', [userId]);
  await redis.set(key, JSON.stringify(rows), 'EX', 60);
  return rows;
}`,
      rw: {
        ex: [
          'Elasticsearch write path bypasses Redis — queries populate cache via cache-aside',
          'CloudWatch log ingestion writes around cache to S3/DynamoDB directly',
          'Stripe audit log pipeline uses write-around to keep Redis cache hot for payment records only',
          'Apache Kafka consumer offsets written directly to ZooKeeper/Kafka, not through cache',
        ],
        cs: "Stripe's payment processing pipeline uses write-around for audit log entries: millions of events are written directly to their persistent data store (backed by Postgres). The Redis cache is reserved exclusively for frequently-read payment status lookups, keeping cache hit rates above 98% by never polluting it with write-once audit data.",
      },
    },
    interview: {
      q: 'You have a content publishing system where authors create articles. After publishing, the article immediately appears on the homepage. Would you use write-around caching?',
      a: 'No — write-around is the wrong choice here because the article is read immediately after being written. With write-around, the first homepage load after publishing always misses the cache and hits the DB, which is especially bad if the article goes viral. Instead, use write-through or cache-aside with explicit cache population after publish: once the article is saved to the DB, immediately SET the article in Redis so the homepage serves it from cache on the very first request. Write-around is appropriate for the article metadata like raw edit history or draft revisions that are rarely fetched.',
      fu: [
        'When would you combine write-around writes with proactive cache invalidation?',
        'How does write-around behave differently from write-through in a CDN context?',
        'What cache invalidation strategy pairs best with write-around for frequently-updated records?',
      ],
    },
  },
];
