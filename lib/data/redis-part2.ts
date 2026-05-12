import { Concept } from '../types';

export const REDIS_PART2: Concept[] = [
  {
    id: 'cache-eviction',
    cat: 'redis',
    color: '#dc2626',
    icon: '🗑️',
    title: 'Cache Eviction Policies',
    tag: 'When memory is full — who gets the boot?',
    overview:
      'Redis operates as a bounded in-memory store; once maxmemory is reached it must decide which keys to remove before accepting new writes. The maxmemory-policy directive controls this decision, offering eight strategies ranging from strict refusal to probabilistic approximations of least-recently-used and least-frequently-used eviction. Choosing the wrong policy can silently degrade cache hit rates or, worse, crash your application with OOM errors. Understanding the algorithm behind each policy — particularly the difference between LRU clock sampling and LFU logarithmic decay — is essential for tuning Redis in production.',
    components: [
      {
        name: 'Memory Monitor',
        icon: '📊',
        role: 'Tracks used_memory against maxmemory threshold',
        detail:
          'Redis polls its own allocator stats on every command. When used_memory exceeds the configured maxmemory, the memory monitor triggers the eviction pipeline before the write is allowed to proceed. It also exposes INFO memory metrics for external monitoring.',
      },
      {
        name: 'LRU Clock',
        icon: '🕐',
        role: 'Approximates recency with a coarse-grained timestamp',
        detail:
          'Redis maintains a global LRU clock updated every 1 ms (lru_clock resolution is 10 bits). Each key stores its own clock value at last access. On eviction, Redis samples maxmemory-samples (default 5) random candidates and evicts the one with the oldest clock — a probabilistic approximation that avoids maintaining a true linked-list LRU.',
      },
      {
        name: 'LFU Counter',
        icon: '🔢',
        role: 'Tracks access frequency with logarithmic probability and decay',
        detail:
          'The LFU counter reuses the 24-bit lru field. The lower 8 bits store a logarithmic counter (Morris counter): each access increments it with probability 1/counter, capping around 255 at ~10 million hits. The upper 16 bits store the last decrement timestamp. The lfu-decay-time setting (default 1 minute) halves the counter for every minute of inactivity, ensuring rarely-accessed keys eventually become eviction candidates.',
      },
      {
        name: 'Eviction Queue',
        icon: '📤',
        role: 'Selects and removes keys to free the required memory',
        detail:
          'When memory pressure is detected, Redis builds a pool of eviction candidates (size maxmemory-samples) sorted by the policy metric. The worst candidate is evicted. This repeats until enough memory is freed for the pending write. Redis does not evict in bulk — it evicts just enough per command to maintain low latency.',
      },
    ],
    howItWorks:
      'When a write command arrives and used_memory >= maxmemory, Redis enters the eviction loop. It samples maxmemory-samples random keys from the relevant keyspace (all keys or only volatile keys, depending on the policy). For LRU policies it computes an approximate idle time using the global LRU clock minus the key\'s stored clock value. The key with the highest idle time is the eviction winner. For LFU policies it ranks by the combined frequency-and-decay score instead.\n\nThe LRU approximation trades perfect accuracy for O(1) overhead. A true LRU requires a doubly-linked list with O(1) promotions on every access — expensive in a single-threaded event loop. Redis\'s sampled approach achieves near-perfect hit rates at sample sizes of 10 and above, as verified by the Redis authors against Belady\'s optimal algorithm. The eviction pool (introduced in Redis 3.0) further improves accuracy by retaining the best candidates across multiple eviction rounds.\n\nLFU adds a time-decay dimension. A key accessed 1 million times last month but never touched since should not outcompete a key accessed 10 times today. The Morris counter\'s logarithmic growth means very hot keys plateau near 255, while the decay timer steadily drains counters of idle keys. This makes LFU strictly better than LRU for workloads with a stable hot set — but it requires a warm-up period before the counters reflect reality, during which newly inserted keys start at counter=5 (lfu-log-factor default).',
    decision: {
      choose: [
        'allkeys-lru when all keys are cacheable and you want to keep the most recently accessed data',
        'allkeys-lfu when your workload has a stable hot set and you want frequency-aware eviction',
        'volatile-lru or volatile-ttl when only some keys are cache entries (others are persistent) and you set TTLs on cacheable keys',
        'noeviction when Redis is used as a primary data store and data loss is unacceptable — pair with client-side back-pressure',
        'allkeys-random only for uniform-access workloads or when you want maximum eviction speed with no scoring overhead',
      ],
      avoid: [
        'noeviction in a pure cache scenario — a full cache will return ENOMEM errors and halt writes',
        'volatile-* policies when you forget to set TTLs — Redis will find no eligible keys and fall back to noeviction behavior',
        'allkeys-lru for frequency-skewed workloads — a key accessed once yesterday beats a key accessed 999 times last week if both were idle today',
        'Large maxmemory-samples values (>20) on high-throughput paths — the sampling loop runs synchronously in the event thread',
      ],
      vs: [
        {
          name: 'LRU vs LFU',
          when:
            'Use LRU for recency-dominant workloads (news feeds, session stores). Use LFU for frequency-dominant workloads (product catalogs, feature flags) where the same small set is hammered repeatedly.',
        },
        {
          name: 'Redis eviction vs Memcached eviction',
          when:
            'Memcached uses a true slab-based LRU per slab class with O(1) promotions. Redis trades perfect accuracy for lower per-command overhead. Prefer Memcached if pure LRU correctness is critical; prefer Redis if you need richer data types alongside caching.',
        },
        {
          name: 'volatile-ttl vs volatile-lru',
          when:
            'Use volatile-ttl when your TTLs are already calibrated to data freshness — evicting soonest-to-expire keys aligns eviction with natural expiry. Use volatile-lru when TTLs are arbitrary and you want recency-based selection instead.',
        },
      ],
    },
    failures: [
      {
        name: 'noeviction causing OOM in production',
        cause:
          'maxmemory-policy set to noeviction (the default) on a cache-only Redis instance with no TTLs set on keys',
        symptom:
          'Clients receive OOM command not allowed when used memory > maxmemory errors; write throughput drops to zero while read throughput continues',
        fix: 'Switch policy to allkeys-lru or allkeys-lfu immediately via CONFIG SET maxmemory-policy allkeys-lru. Long-term: audit why the policy was noeviction for a cache use case and add alerting on used_memory / maxmemory ratio > 85%.',
        severity: 'critical',
      },
      {
        name: 'LRU evicting hot keys',
        cause:
          'A large batch job or scan operation touches millions of cold keys, refreshing their LRU timestamps and making them appear recently used; the real hot keys have older timestamps and get evicted',
        symptom:
          'Cache hit rate drops sharply after batch operations; latency spikes as misses fall through to the database',
        fix: 'Switch to allkeys-lfu, which is immune to one-off scan pollution because frequency counters require sustained access to grow. Alternatively, run SCAN with a MATCH pattern in the batch job to avoid polluting the main keyspace LRU.',
        severity: 'high',
      },
      {
        name: 'LFU counters never decaying',
        cause:
          'lfu-decay-time set to 0 (no decay) combined with a workload that had a large hot set in the past that has since gone cold',
        symptom:
          'Stale keys with historically high counters resist eviction; new hot keys are evicted because their counters have not yet grown, causing counter-intuitive cache misses',
        fix: 'Set lfu-decay-time to a value reflecting your workload\'s temporal locality (1–10 minutes is typical). Monitor the LFU counter distribution with DEBUG OBJECT key and OBJECT FREQ key commands to validate decay is working.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'A nightclub bouncer with a strict capacity limit',
      t: 'The bouncer decides who leaves when the club is full',
      tx: 'Redis is the nightclub with a fixed capacity (maxmemory). Every new key wanting entry is a new guest. When the club is full, the bouncer must remove someone to let the new guest in. With LRU policy, the bouncer ejects whoever has been standing in the corner longest without dancing (least recently accessed). With LFU policy, the bouncer ejects whoever has danced the fewest times all night (least frequently accessed). With noeviction, the bouncer simply refuses new guests at the door. The policy you choose determines whether your best regulars stay or get thrown out with the wallflowers.',
      s: 'Redis eviction selects and removes keys when maxmemory is exceeded, using configurable policies (LRU, LFU, random, TTL-based, or noeviction) to determine which key is sacrificed for new writes.',
    },
    te: {
      def: 'Redis cache eviction is the process of removing existing keys from memory when used_memory reaches the maxmemory limit, governed by the maxmemory-policy configuration directive which selects candidates using one of eight algorithms.',
      types: [
        { n: 'noeviction', d: 'Refuse all writes when memory is full; reads still work. Safe for primary data stores, fatal for pure caches.' },
        { n: 'allkeys-lru', d: 'Evict the least recently used key across all keys. Best general-purpose cache policy for recency-dominant workloads.' },
        { n: 'volatile-lru', d: 'Evict LRU key but only among keys with a TTL set. Safe when mixing persistent and cache keys in one instance.' },
        { n: 'allkeys-lfu', d: 'Evict the least frequently used key across all keys. Best for stable hot-set workloads; resistant to scan pollution.' },
        { n: 'volatile-lfu', d: 'LFU eviction scoped to TTL-bearing keys only.' },
        { n: 'allkeys-random', d: 'Evict a random key. Fastest eviction path; only rational for uniform-access distributions.' },
        { n: 'volatile-random', d: 'Random eviction scoped to TTL-bearing keys.' },
        { n: 'volatile-ttl', d: 'Evict the key with the shortest remaining TTL among volatile keys. Aligns eviction with natural expiry ordering.' },
      ],
      when: 'Configure eviction policy at instance creation time, or change it live with CONFIG SET maxmemory-policy <policy>. Revisit the policy whenever cache hit rate drops below 90%, after workload pattern changes, or when batch jobs begin polluting the keyspace.',
      trade: 'LRU/LFU add per-command overhead (sampling loop) and per-key metadata (24-bit clock/counter field). noeviction eliminates that overhead but sacrifices availability. LFU requires a warm-up period and careful decay tuning. volatile-* policies require disciplined TTL management — missing TTLs effectively make those keys immune to eviction.',
      code: `# redis.conf — eviction configuration
maxmemory 2gb
maxmemory-policy allkeys-lfu
maxmemory-samples 10        # sample size for LRU/LFU approximation
lfu-log-factor 10           # logarithm base for LFU counter growth
lfu-decay-time 1            # minutes before counter halves on idle

# Node.js — observe eviction metrics and set policy at runtime
import Redis from 'ioredis';
const redis = new Redis();

// Check current eviction stats
const info = await redis.info('stats');
const evictedKeys = info.match(/evicted_keys:(\d+)/)?.[1];
console.log('Evicted keys since start:', evictedKeys);

const memInfo = await redis.info('memory');
const usedMemory = memInfo.match(/used_memory_human:(\S+)/)?.[1];
const maxMemory = memInfo.match(/maxmemory_human:(\S+)/)?.[1];
console.log(\`Memory: \${usedMemory} / \${maxMemory}\`);

// Switch policy live (no restart needed)
await redis.config('SET', 'maxmemory-policy', 'allkeys-lfu');
console.log('Policy switched to allkeys-lfu');

// Inspect a key's LFU frequency counter
await redis.set('product:42', JSON.stringify({ name: 'Widget' }));
for (let i = 0; i < 1000; i++) await redis.get('product:42');
const freq = await redis.sendCommand(['OBJECT', 'FREQ', 'product:42']);
console.log('LFU frequency counter for product:42:', freq);

// Inspect a key's LRU idle time
const idleTime = await redis.sendCommand(['OBJECT', 'IDLETIME', 'product:42']);
console.log('Seconds idle:', idleTime);`,
      rw: {
        ex: [
          'Twitter uses allkeys-lru for its timeline cache — recent tweets are always more valuable than older ones, matching LRU semantics perfectly',
          'Stack Overflow uses volatile-lru to cache question pages with TTLs while keeping user session keys (no TTL) safe from eviction',
          'Shopify switches to allkeys-lfu during flash sales — product pages for items in the sale become the hot set and must not be evicted by scan pollution from inventory batch jobs',
          'GitHub uses noeviction on Redis instances serving as the Sidekiq job queue — losing a job is worse than a write error that the producer can handle',
        ],
        cs: 'A major e-commerce platform running allkeys-lru suffered a 40% cache hit rate drop every night when their inventory sync job scanned 10 million product keys, refreshing all their LRU timestamps. The hot product pages (accessed by millions of users) had slightly older timestamps than the just-scanned inventory keys and were evicted. Switching to allkeys-lfu eliminated the problem: the inventory keys were touched once per sync (low frequency) while the hot product pages had counters in the hundreds, making them immune to eviction regardless of scan order.',
      },
    },
    interview: {
      q: 'Redis is returning OOM errors in production. How do you diagnose and fix the issue, and how do you prevent it recurring?',
      a: 'First, check INFO memory to confirm used_memory has hit maxmemory and that maxmemory-policy is noeviction. Immediate fix: CONFIG SET maxmemory-policy allkeys-lru to restore write availability. Then investigate root cause — run INFO stats to check evicted_keys (if 0, no eviction was happening) and DEBUG SLEEP 0 to check for latency. Use MEMORY USAGE key on large keys and SCAN with OBJECT ENCODING to find unexpectedly large data structures. Long-term prevention: set maxmemory to 75–80% of available RAM to leave headroom, choose an eviction policy appropriate to your workload, instrument used_memory/maxmemory ratio with alerts at 80% and 90%, and review whether the noeviction policy was ever appropriate for this use case.',
      fu: [
        'What is the difference between LRU and LFU eviction, and when would you choose each?',
        'How does Redis approximate LRU without maintaining a full linked list, and what are the accuracy trade-offs?',
        'If volatile-lru is configured but no keys have TTLs set, what happens when memory is exhausted?',
      ],
    },
  },

  {
    id: 'redis-persistence',
    cat: 'redis',
    color: '#dc2626',
    icon: '💾',
    title: 'Redis Persistence (RDB vs AOF)',
    tag: 'Snapshot photo vs transaction diary — which do you keep?',
    overview:
      'Redis is an in-memory store, but it offers two complementary persistence mechanisms to survive restarts: RDB (Redis Database) takes periodic point-in-time snapshots of the dataset, while AOF (Append-Only File) logs every write command as it arrives. Each mechanism has distinct durability, performance, and recovery characteristics. Hybrid persistence (aof-use-rdb-preamble=yes) combines both: an RDB snapshot forms the AOF file header, with incremental commands appended after, giving fast restarts with near-complete durability.',
    components: [
      {
        name: 'BGSAVE Fork',
        icon: '🍴',
        role: 'Creates a child process to write the RDB snapshot without blocking the parent',
        detail:
          'BGSAVE calls fork(2) to create a copy-on-write child. The child serialates the dataset to a temp file using the RDB binary format, then atomically renames it to dump.rdb. The parent continues serving requests. Copy-on-write means both processes share the same physical memory pages until the parent modifies a page, at which point the OS allocates a new page — peak memory usage can approach 2x the dataset size during the snapshot.',
      },
      {
        name: 'AOF Writer',
        icon: '✍️',
        role: 'Appends every write command to the AOF file buffer',
        detail:
          'After executing a write command, Redis appends its RESP-encoded text representation to an in-memory write buffer. The buffer is flushed to disk according to the appendfsync policy: always (fsync after every command), everysec (fsync once per second in a background thread), or no (OS decides when to flush). The AOF file is a human-readable log of commands that can be replayed to reconstruct the dataset.',
      },
      {
        name: 'AOF Rewriter',
        icon: '🔄',
        role: 'Compacts the AOF file by rewriting it as the minimal set of commands',
        detail:
          'BGREWRITEAOF forks a child that creates a new AOF by reading the current in-memory dataset and writing the minimal SET/HSET/LPUSH/etc. commands that produce it — collapsing thousands of incremental updates into one command per key. While rewriting, new writes go to both the old AOF and a rewrite buffer; after the child finishes, the rewrite buffer is appended and the file atomically replaced.',
      },
      {
        name: 'fsync Scheduler',
        icon: '⏱️',
        role: 'Controls when the OS is instructed to flush the AOF buffer to physical disk',
        detail:
          'The appendfsync setting governs durability vs performance. always: calls fsync() after every write — at most 1 command lost on crash, but throughput drops to ~thousands of ops/sec. everysec: a background thread calls fsync() once per second — at most 1 second of writes lost, throughput remains high. no: never calls fsync() explicitly — the OS flushes on its own schedule (typically 30 seconds) — maximum throughput, maximum data loss risk.',
      },
    ],
    howItWorks:
      'RDB persistence works through periodic background saves. You configure save triggers in redis.conf, e.g. save 900 1 (save if at least 1 key changed in 900 seconds). When triggered, Redis calls BGSAVE: fork() creates a child process that serializes the entire dataset into a compact binary RDB file using LZF compression. The parent process is not blocked — it continues serving requests using copy-on-write semantics. On startup, Redis loads dump.rdb and reconstructs the dataset in memory. RDB is compact (binary, compressed), loads fast, and is ideal for backups — but you lose all writes since the last snapshot on a crash.\n\nAOF persistence writes every write command to the aof file immediately after execution. The commands are stored in RESP (Redis Serialization Protocol) text format, making the file human-readable and replayable with redis-check-aof. Because every mutation is recorded, AOF can provide much stronger durability guarantees than RDB — with appendfsync always, you lose at most one command. The cost is a larger file (verbose text vs compact binary), slower restarts (must replay all commands), and higher I/O.\n\nAOF rewrite prevents unbounded file growth. BGREWRITEAOF (or auto-aof-rewrite-percentage trigger) forks a child that constructs a new AOF containing only the minimal commands to reproduce the current dataset — eliminating superseded SET commands, collapsed LPUSH sequences, and expired keys. Hybrid persistence (aof-use-rdb-preamble yes, the default since Redis 4.0) makes the rewritten AOF start with an RDB-format snapshot block followed by AOF commands since the snapshot, combining fast load times with near-complete command coverage.',
    decision: {
      choose: [
        'RDB-only when you need fast restarts, can tolerate data loss of minutes, and want minimal disk I/O overhead (e.g., a pure cache)',
        'AOF with appendfsync everysec for most production deployments — good durability (at most 1 second loss) with acceptable throughput',
        'AOF with appendfsync always for financial or transactional data where losing even one write is unacceptable',
        'Hybrid persistence (both RDB+AOF) when you want fast restart times AND strong durability — the default recommendation since Redis 4.0',
        'No persistence (save "" / appendonly no) for pure ephemeral caches where speed is paramount and all data is derived from a durable source',
      ],
      avoid: [
        'RDB-only for primary data stores where losing minutes of writes is not acceptable',
        'appendfsync always on high-throughput (>10k writes/sec) workloads — each fsync serializes writes and will become the bottleneck',
        'Disabling auto-aof-rewrite without a manual rewrite strategy — the AOF file will grow until it fills the disk',
        'Running BGSAVE and BGREWRITEAOF simultaneously on a large dataset — two concurrent forks on a memory-constrained host will trigger OOM kills',
      ],
      vs: [
        {
          name: 'RDB vs AOF durability',
          when: 'RDB: lose up to minutes of data (snapshot interval). AOF everysec: lose up to 1 second. AOF always: lose at most 1 command. Choose based on your RPO (Recovery Point Objective).',
        },
        {
          name: 'Redis persistence vs external backup',
          when: 'Redis persistence protects against process restarts. It does not protect against disk failure or datacenter loss. Always ship RDB snapshots to object storage (S3, GCS) for disaster recovery.',
        },
        {
          name: 'AOF vs Kafka for durability',
          when: 'If you need a durable, replayable write log with consumer groups and retention policies, Kafka is the right tool. AOF is a persistence implementation detail — it is not an externally consumable event log.',
        },
      ],
    },
    failures: [
      {
        name: 'Fork bomb on huge dataset',
        cause:
          'Calling BGSAVE or BGREWRITEAOF on a Redis instance with a 20GB+ dataset on a system with transparent huge pages enabled — copy-on-write amplification causes the child to consume nearly as much memory as the parent during the write burst',
        symptom:
          'OOM killer terminates the Redis child or parent process; the system becomes unresponsive; latency spikes to seconds during the fork period as the OS frantically allocates copy-on-write pages',
        fix: 'Disable transparent huge pages (echo never > /sys/kernel/mm/transparent_hugepage/enabled). Add latency-monitor-threshold 100 and run LATENCY HISTORY to detect fork latency. Keep datasets small enough that 2x fits in available RAM. Use replica-level persistence to offload BGSAVE from the primary.',
        severity: 'critical',
      },
      {
        name: 'AOF growing unbounded',
        cause:
          'auto-aof-rewrite-percentage and auto-aof-rewrite-min-size not tuned, or BGREWRITEAOF failing repeatedly (e.g., due to disk pressure) while writes continue to accumulate',
        symptom:
          'Disk usage grows linearly with write volume; eventually the disk fills, Redis cannot write to AOF, and it shuts down or starts refusing writes depending on aof-use-rdb-preamble and stop-writes-on-bgsave-error settings',
        fix: 'Set auto-aof-rewrite-percentage 100 and auto-aof-rewrite-min-size 64mb as a baseline. Monitor disk usage and AOF size via INFO persistence (aof_current_size vs aof_base_size). Add disk-usage alerts at 70% capacity. If BGREWRITEAOF is failing, check redis.log for fork errors and ensure disk space is sufficient for the temp file.',
        severity: 'high',
      },
      {
        name: 'appendfsync always crushing throughput',
        cause:
          'appendfsync set to always on a high-throughput write workload — each write command blocks until the OS confirms the data is on disk, serializing all writes through a single fsync bottleneck',
        symptom:
          'Write throughput plateaus at a few thousand operations per second regardless of client count; CPU is low but iowait is high; p99 latency is consistently high even for simple SET commands',
        fix: 'Switch to appendfsync everysec to trade at-most-1-second durability for an order-of-magnitude throughput improvement. If you need stronger durability, use appendfsync always on a replica only (not the primary) — configure save "" on the primary for RDB and let the replica handle the fsync cost.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A camera (RDB) vs a court reporter (AOF)',
      t: 'Two ways to record what happened in the Redis courtroom',
      tx: 'RDB is like a photographer who takes a snapshot of the entire courtroom every 15 minutes — you get a complete picture of that moment, but anything that happened between photos is lost if the courthouse burns down. AOF is like a court reporter who writes down every single word spoken the moment it is said — you have a complete transcript, but reading back the entire transcript to reconstruct the current state of the trial takes much longer than looking at a photo. Hybrid persistence is like the court reporter who starts each day with a photo of the morning\'s state and then records every word after that — fast to start (look at the photo) and complete (read the words since the photo).',
      s: 'Redis persistence saves data to disk via RDB snapshots (fast, lossy, binary) or AOF command logs (slow to replay, durable, human-readable), with hybrid mode combining both for the best of each.',
    },
    te: {
      def: 'Redis persistence is the mechanism by which an in-memory dataset is durably written to disk so it can be recovered after a restart, implemented as RDB point-in-time binary snapshots and/or AOF sequential command logging, each with configurable durability-vs-performance trade-offs.',
      types: [
        { n: 'RDB (Redis Database)', d: 'Binary snapshot of the entire dataset at a point in time. Compact, fast to load, configurable save intervals. Potential data loss = time since last snapshot.' },
        { n: 'AOF (Append-Only File)', d: 'Sequential log of every write command in RESP text format. Replayable, human-readable. Data loss depends on fsync policy (0–1s for everysec, 0 commands for always).' },
        { n: 'Hybrid (RDB+AOF)', d: 'Rewritten AOF starts with an RDB preamble followed by incremental AOF commands. Fast load time from RDB + complete coverage from AOF. Default since Redis 4.0.' },
        { n: 'No persistence', d: 'Redis operates as a pure in-memory store. Fastest possible performance. All data lost on restart. Appropriate for ephemeral caches backed by a durable data source.' },
      ],
      when: 'Enable RDB for periodic backups even if you primarily use AOF — RDB files are invaluable for point-in-time recovery and disaster recovery shipping to object storage. Enable AOF for any use case where the dataset is the source of truth and downtime for replay is acceptable. Use hybrid mode as the default for new production deployments.',
      trade: 'RDB: low I/O overhead, fast restarts, significant potential data loss, fork-induced memory spikes. AOF: minimal data loss, high I/O overhead (especially with fsync always), slow restarts on large datasets, unbounded file growth without rewrite. Hybrid: best of both for restarts, but more complex failure modes during rewrite. No persistence: maximum throughput, zero durability.',
      code: `# redis.conf — hybrid persistence (recommended default)
save 3600 1          # RDB snapshot: if 1 key changed in 1 hour
save 300 100         # RDB snapshot: if 100 keys changed in 5 minutes
save 60 10000        # RDB snapshot: if 10000 keys changed in 1 minute
dbfilename dump.rdb
dir /var/lib/redis

appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-use-rdb-preamble yes    # hybrid mode

# Node.js — trigger and monitor persistence
import Redis from 'ioredis';
const redis = new Redis();

// Check persistence status
const info = await redis.info('persistence');
const aofEnabled = info.match(/aof_enabled:(\d)/)?.[1];
const rdbLastSave = info.match(/rdb_last_bgsave_time_sec:(\d+)/)?.[1];
const aofSize = info.match(/aof_current_size:(\d+)/)?.[1];
console.log({ aofEnabled, rdbLastSave, aofSize });

// Trigger a background RDB save
await redis.bgsave();
console.log('BGSAVE initiated');

// Poll until save completes
let saving = true;
while (saving) {
  await new Promise(r => setTimeout(r, 500));
  const status = await redis.info('persistence');
  saving = status.includes('rdb_bgsave_in_progress:1');
}
console.log('RDB save complete');

// Check last save timestamp
const lastSave = await redis.lastsave();
console.log('Last RDB save:', new Date(lastSave * 1000).toISOString());

// Trigger AOF rewrite
await redis.bgrewriteaof();
console.log('AOF rewrite initiated');`,
      rw: {
        ex: [
          'GitHub uses Redis with AOF everysec for its rate-limiting counters — losing one second of rate limit increments on crash is acceptable, but the counters must survive restarts',
          'Snapchat uses RDB-only Redis for ephemeral story view counters — data is re-derived from the primary store on restart, so snapshot loss is acceptable',
          'Stripe uses hybrid persistence on Redis instances backing idempotency key storage — RDB preamble enables fast restarts after deploy, AOF ensures idempotency keys are never silently lost',
          'Discord ships hourly RDB snapshots to S3 for each shard of their presence Redis cluster — the snapshots serve as disaster recovery backups independent of the Sentinel-managed replicas',
        ],
        cs: 'A fintech startup used Redis as the primary store for pending payment records with AOF appendfsync no (the default before they understood the setting). During a kernel panic the OS had not flushed the AOF buffer for 28 seconds, losing 28 seconds of payment commands. After the incident they switched to appendfsync everysec on the payment Redis instance, reducing the theoretical maximum loss to 1 second. They also added a secondary replica with its own persistence enabled, ensuring that even if the primary\'s disk failed, the replica\'s AOF would have the data.',
      },
    },
    interview: {
      q: 'Explain the difference between RDB and AOF persistence in Redis. Which would you choose for a payment processing system and why?',
      a: 'RDB creates periodic binary snapshots of the entire dataset using a fork-and-write approach — compact, fast to load, but you lose all writes since the last snapshot on a crash. AOF logs every write command as it happens in RESP text format — near-complete durability with everysec fsync (at most 1 second lost) or complete durability with always fsync (at most 1 command lost), but slower restarts and larger files. For a payment processing system I would use hybrid persistence: AOF with appendfsync everysec for the primary node (losing at most 1 second of payment commands is likely acceptable, and always would throttle throughput), plus RDB snapshots shipped to object storage hourly for disaster recovery. I would also replicate to a read replica with its own persistence enabled as a second durability layer. The tradeoff I\'m making is accepting up to 1 second of data loss in exchange for acceptable write throughput — if even that is unacceptable, I would switch to appendfsync always and provision NVMe SSDs to absorb the fsync overhead.',
      fu: [
        'How does BGSAVE avoid blocking the main Redis thread, and what are the memory implications of the approach?',
        'What is AOF rewrite and why is it necessary? How does Redis ensure no writes are lost during the rewrite process?',
        'If both RDB and AOF files exist on startup, which does Redis prefer to load and why?',
      ],
    },
  },

  {
    id: 'redis-distributed-lock',
    cat: 'redis',
    color: '#dc2626',
    icon: '🔐',
    title: 'Distributed Locking with Redis',
    tag: 'A key only one server can hold — across the whole cluster',
    overview:
      'Distributed locks allow multiple processes across different machines to coordinate exclusive access to a shared resource. Redis\'s atomic commands make it a natural lock store, but naive single-node implementations are not safe against crashes or network partitions. The Redlock algorithm, proposed by Salvatore Sanfilippo, extends distributed locking to multiple independent Redis nodes, requiring a quorum of successful acquisitions to consider the lock held — providing safety even when individual nodes fail.',
    components: [
      {
        name: 'Lock Requester',
        icon: '🙋',
        role: 'Attempts to acquire the lock by setting a unique token with TTL',
        detail:
          'The client generates a unique random token (e.g., UUID or crypto random bytes) and issues SET lock_name token NX PX ttl_ms. The NX flag makes it atomic: the key is set only if it does not exist. The PX ttl_ms sets an expiry so the lock auto-releases on crash. The unique token ensures only the lock holder can release it.',
      },
      {
        name: 'Quorum Checker',
        icon: '🗳️',
        role: 'Validates that the lock was acquired on a majority of independent nodes (Redlock)',
        detail:
          'In Redlock, the client attempts the SET NX PX command on N (typically 5) independent Redis nodes sequentially. A quorum is N/2 + 1 successful acquisitions. The client records the elapsed time; the effective lock validity is min_ttl - elapsed_time - clock_drift_factor. If quorum is not reached within validity time, the client releases all acquired locks and retries.',
      },
      {
        name: 'Expiry Guard',
        icon: '⏳',
        role: 'Ensures the lock auto-expires if the holder crashes before releasing',
        detail:
          'The TTL on the lock key is the safety net — if the holder crashes, suffers a GC pause longer than the TTL, or is partitioned away, the lock will expire automatically and another client can acquire it. The TTL must be tuned to be longer than the expected critical section duration plus clock drift, but short enough that a crashed holder does not block others for too long.',
      },
      {
        name: 'Release Script (Lua)',
        icon: '📜',
        role: 'Atomically checks and deletes the lock key only if the token matches',
        detail:
          'A GET followed by a DEL is not atomic — another process could acquire the lock between the GET and DEL, and you would delete their lock. The Lua script runs atomically: if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end. This ensures only the original lock holder can release the lock.',
      },
    ],
    howItWorks:
      'A single-node distributed lock uses SET lock_name unique_token NX PX ttl_ms. NX makes the command atomic — the key is set only if it does not exist, so two clients racing to acquire the lock will have exactly one succeed. The PX ttl_ms ensures the lock expires automatically if the holder crashes before releasing. To release, the holder runs a Lua script that checks the stored value matches the holder\'s token before deleting — preventing a holder from accidentally releasing a lock that expired and was re-acquired by another client.\n\nThe single-node approach has a fatal flaw: if the Redis master fails between a client acquiring the lock and replication reaching the replica, the replica promoted to master will have no record of the lock — a second client can acquire it, creating two simultaneous holders. The Redlock algorithm addresses this by requiring the client to acquire the lock on a quorum (majority) of N independent Redis nodes. Even if one node fails and its replica has no record of the lock, the other N-1 nodes still have it, and a challenger cannot reach quorum without those nodes knowing the lock has expired.\n\nFencing tokens solve the remaining problem: even Redlock does not protect against a client that holds a valid lock but then experiences a GC pause (or any stop-the-world event) longer than the lock TTL. The lock expires, another client acquires it, and then the first client resumes and writes to the shared resource — now two clients are writing concurrently. The fix is a monotonically increasing fencing token (e.g., a Redis INCR counter) returned with the lock. The storage layer rejects writes with a token number lower than the highest it has seen, so the paused client\'s stale writes are rejected.',
    decision: {
      choose: [
        'Single-node Redis lock (SET NX PX) when your Redis instance has a replica with synchronous replication (WAIT 1 0) or when lock loss on Redis failover is acceptable for your use case',
        'Redlock when you need lock safety across Redis node failures and can tolerate the complexity of 5 independent Redis nodes',
        'Fencing tokens (INCR-based) in addition to any Redis lock when the downstream resource (database, file system) can enforce monotonic ordering — the gold standard for safety',
        'Redis lock for short-lived critical sections (< 5 seconds) where the lock TTL is much larger than the critical section duration',
      ],
      avoid: [
        'Relying on Redis locks for absolute safety without fencing tokens — GC pauses and process freezes can cause lock expiry while the holder is still running',
        'Redlock when you cannot provision 5 independent Redis nodes — 3-node Redlock has worse safety properties than single-node with synchronous replication',
        'Long TTLs that make lock contention visible to users (e.g., a 5-minute TTL means a crashed holder blocks everyone for 5 minutes)',
        'Using Redis locks to coordinate writes to a system that already has its own atomic compare-and-swap (e.g., database transactions with SELECT FOR UPDATE are safer and simpler for DB resources)',
      ],
      vs: [
        {
          name: 'Redis lock vs ZooKeeper/etcd lock',
          when: 'ZooKeeper and etcd use consensus protocols (ZAB, Raft) that provide stronger safety guarantees — a lock is only granted after a majority quorum of nodes confirms it, and ephemeral nodes auto-release on client disconnect. Use ZooKeeper/etcd when lock correctness is critical (leader election, configuration management). Use Redis when performance and simplicity matter more than theoretical safety.',
        },
        {
          name: 'Redis lock vs database advisory lock (SELECT FOR UPDATE)',
          when: 'Database advisory locks (PostgreSQL pg_advisory_lock, MySQL GET_LOCK) are safer when the resource being protected IS a database row — the lock and the update happen in the same transaction. Use Redis locks for cross-service coordination or when the resource is not a database.',
        },
        {
          name: 'Single-node vs Redlock',
          when: 'Single-node is simpler and sufficient when your Redis has a synchronous replica (WAIT 1 0 before returning to client) or when the worst case is temporary duplicate processing. Redlock adds safety against Redis node failures at the cost of 5 independent nodes, network round trips to all nodes, and complex failure handling.',
        },
      ],
    },
    failures: [
      {
        name: 'Clock drift invalidating locks early',
        cause:
          'System clocks on Redis nodes drift apart (NTP adjustments, hypervisor clock skew); a lock acquired with a 10-second TTL has its actual validity shrink because the node\'s clock advances faster than real time, expiring the key before the holder expects',
        symptom:
          'Locks expire unexpectedly during normal operation; two clients simultaneously believe they hold the lock; data corruption in the protected resource',
        fix: 'Account for clock drift in the Redlock validity calculation: validity = min_ttl - elapsed - (clock_drift_factor * min_ttl + 2ms). Use NTP with monitoring and alert on clock skew > 100ms between Redis nodes. The Redlock spec recommends a drift factor of 0.01 (1%). Use fencing tokens as the ultimate safety net.',
        severity: 'critical',
      },
      {
        name: 'GC pause causing lock expiry while held',
        cause:
          'A JVM (or Go runtime, Ruby GC) stop-the-world GC pause lasts longer than the lock TTL; the lock expires during the pause; another client acquires it; the paused client resumes and proceeds with the critical section',
        symptom:
          'Two processes simultaneously mutate the same resource; data corruption or duplicate processing; no error is raised because both clients believe they hold a valid lock',
        fix: 'Implement fencing tokens: use INCR lock:fence to get a monotonically increasing token when acquiring the lock. The protected resource must reject writes from a token lower than the last committed token. This makes GC pause-induced races safe — the stale client\'s writes are rejected by the resource, not the lock.',
        severity: 'critical',
      },
      {
        name: 'Wrong release (releasing another holder\'s lock)',
        cause:
          'Client A acquires the lock. The lock expires (GC pause, slow operation). Client B acquires the lock. Client A resumes and calls a naive DEL lock_name — deleting Client B\'s lock',
        symptom:
          'Client B\'s critical section is interrupted; a third client acquires the lock; effectively no mutual exclusion; can cascade into multiple simultaneous lock holders',
        fix: 'Always use the atomic Lua release script that checks the token before deleting: if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end. Never use DEL directly for lock release.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A bathroom key at a single-stall coffee shop',
      t: 'Only one person can hold the key (lock) at a time',
      tx: 'The coffee shop has one bathroom (shared resource) and one physical key hanging behind the counter (the Redis lock key). To use the bathroom, you take the key (SET NX — only works if no one has it). If the key is already gone, you wait. When you\'re done, you hang it back up (DEL with token check). The key has a tag with your name on it (unique token) so the barista can verify you\'re returning your own key and not stealing someone else\'s. In Redlock, imagine five coffee shops in a row — you must get the key from at least three of them simultaneously to use any bathroom, so even if one shop burns down, the other four still know the key is checked out.',
      s: 'Redis distributed locks use atomic SET NX PX to grant exclusive access to a named key, with a unique token for safe release via Lua script; Redlock extends this to N independent nodes requiring quorum acquisition for safety against node failures.',
    },
    te: {
      def: 'A Redis distributed lock is a mutually exclusive flag implemented as a key with a TTL and a unique value, acquired atomically via SET key token NX PX ttl and released atomically via a Lua compare-and-delete script, providing mutual exclusion across distributed processes.',
      types: [
        { n: 'Single-node SETNX (legacy)', d: 'SETNX key token followed by EXPIRE key ttl — non-atomic, vulnerable to crash between the two commands. Deprecated in favor of SET NX PX.' },
        { n: 'Single-node SET NX PX', d: 'Atomic lock acquisition with TTL in one command. Safe for single-node Redis. Loses safety on master failover without synchronous replication.' },
        { n: 'Redlock (multi-node)', d: 'Acquire lock on majority of N≥5 independent Redis nodes. Validity time accounts for clock drift. Safe against individual node failures. Complex to implement correctly.' },
        { n: 'Lock with fencing token', d: 'Augment any Redis lock with a monotonically increasing INCR token. The protected resource enforces token ordering, making GC pauses and lock expiry races safe.' },
      ],
      when: 'Use Redis locks for short-lived critical sections (job deduplication, rate limit enforcement, cache stampede prevention). Do not use as a substitute for database transactions when the protected resource IS a database. Always set TTLs shorter than 60 seconds to limit the blast radius of a crashed holder.',
      trade: 'Redis locks are fast (sub-millisecond acquisition) and simple, but they are not perfectly safe without fencing tokens. They are weaker than ZooKeeper/etcd consensus-based locks but much simpler to operate. Redlock adds safety against node failures but requires 5 independent Redis instances and adds latency for the quorum round-trip. All Redis lock implementations are vulnerable to clock skew and GC pauses without fencing tokens.',
      code: `// Node.js — Redlock acquire and release using ioredis
import Redis from 'ioredis';
import crypto from 'crypto';

const nodes = [
  new Redis({ host: 'redis-1', port: 6379 }),
  new Redis({ host: 'redis-2', port: 6379 }),
  new Redis({ host: 'redis-3', port: 6379 }),
  new Redis({ host: 'redis-4', port: 6379 }),
  new Redis({ host: 'redis-5', port: 6379 }),
];

const QUORUM = Math.floor(nodes.length / 2) + 1; // 3
const CLOCK_DRIFT_FACTOR = 0.01;

// Lua script for safe release (atomic check-and-delete)
const RELEASE_SCRIPT = \`
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
\`;

async function acquireLock(
  resource: string,
  ttlMs: number
): Promise<{ token: string; validityMs: number } | null> {
  const token = crypto.randomBytes(16).toString('hex');
  const start = Date.now();
  let acquired = 0;

  for (const node of nodes) {
    try {
      const result = await node.set(resource, token, 'NX', 'PX', ttlMs);
      if (result === 'OK') acquired++;
    } catch {
      // Node unreachable — count as failure
    }
  }

  const elapsed = Date.now() - start;
  const drift = ttlMs * CLOCK_DRIFT_FACTOR + 2;
  const validityMs = ttlMs - elapsed - drift;

  if (acquired >= QUORUM && validityMs > 0) {
    return { token, validityMs };
  }

  // Failed to reach quorum — release any partial acquisitions
  await releaseLock(resource, token);
  return null;
}

async function releaseLock(resource: string, token: string): Promise<void> {
  await Promise.allSettled(
    nodes.map(node =>
      node.eval(RELEASE_SCRIPT, 1, resource, token)
    )
  );
}

// Usage example
async function processPayment(paymentId: string) {
  const lock = await acquireLock(\`payment:\${paymentId}\`, 5000); // 5s TTL
  if (!lock) {
    throw new Error('Could not acquire payment lock — retry later');
  }
  console.log(\`Lock acquired, valid for \${lock.validityMs}ms\`);

  try {
    // Critical section — process the payment
    await doPaymentProcessing(paymentId);
  } finally {
    await releaseLock(\`payment:\${paymentId}\`, lock.token);
    console.log('Lock released');
  }
}

async function doPaymentProcessing(id: string) {
  // Simulate work
  await new Promise(r => setTimeout(r, 100));
  console.log('Payment processed:', id);
}`,
      rw: {
        ex: [
          'Shopify uses Redis locks to prevent double-charging during checkout — a lock on the cart ID ensures only one payment attempt proceeds at a time even under retry storms',
          'GitHub Actions uses distributed locks to ensure only one workflow run at a time can access a self-hosted runner, preventing concurrent builds from corrupting shared build caches',
          'Airbnb uses Redis-based distributed locks for calendar availability updates — preventing double-bookings when two users attempt to book the same listing simultaneously',
          'Uber uses Redis locks for driver assignment — ensuring a driver is only assigned to one ride request at a time, even when the request arrives at multiple dispatch servers simultaneously',
        ],
        cs: 'A SaaS billing platform used a naive GET + DEL pattern (non-atomic) to release Redis locks protecting invoice generation. Under load, Client A would GET the lock key (confirming ownership), then a GC pause would hit, the lock would expire, Client B would acquire it, and then Client A would DEL — deleting Client B\'s lock. Both A and B would then generate the invoice concurrently, sending duplicate invoices to customers. The fix was replacing GET + DEL with the atomic Lua compare-and-delete script. They also added a fencing token stored with the invoice record, so even if two clients held the lock simultaneously, the second write to the invoice table would be rejected as a stale token.',
      },
    },
    interview: {
      q: 'How would you implement a distributed lock in Redis? What are its failure modes and how do you mitigate them?',
      a: 'I\'d implement the lock with SET lock_key unique_token NX PX ttl_ms — the NX flag makes acquisition atomic (only succeeds if key doesn\'t exist) and PX sets an expiry so crashed holders auto-release. For release, I\'d use a Lua script to atomically check the token matches before deleting, preventing a holder from releasing a lock it no longer owns. The main failure modes are: (1) GC pause — the holder pauses longer than the TTL, the lock expires, another client acquires it, the paused client resumes and corrupts the resource. (2) Clock drift — the lock expires earlier than expected due to clock skew between Redis nodes. (3) Redis master failover — if the lock key was set on the master but not yet replicated, the promoted replica won\'t know about it. I mitigate these with fencing tokens (INCR counter returned with lock, resource rejects stale tokens), clock drift budgets in TTL calculation, and for critical use cases, Redlock across 5 independent Redis nodes. For most production use cases, single-node SET NX PX with Lua release plus fencing tokens gives sufficient safety without Redlock\'s operational complexity.',
      fu: [
        'What is the Redlock algorithm and in what scenarios does it fail to provide mutual exclusion?',
        'Why is a GET followed by a DEL not safe for lock release, and how does the Lua script fix this?',
        'What are fencing tokens and why are they necessary even when using Redlock?',
      ],
    },
  },

  {
    id: 'redis-pub-sub',
    cat: 'redis',
    color: '#dc2626',
    icon: '📡',
    title: 'Redis Pub/Sub & Streams',
    tag: 'Radio broadcast vs recorded podcast — fire-and-forget vs durable replay',
    overview:
      'Redis provides two messaging paradigms: Pub/Sub for ephemeral real-time broadcast, and Streams for durable, replayable event logs with consumer group semantics. Pub/Sub delivers messages to all current subscribers at the moment of publishing — if no subscriber is listening, the message is lost forever. Streams persist every message to a log structure (similar to Kafka topics) and support multiple consumer groups, each independently tracking their position in the stream, with acknowledgement and pending-entry tracking for at-least-once processing.',
    components: [
      {
        name: 'Publisher',
        icon: '📢',
        role: 'Emits messages to a channel or stream without knowing who will receive them',
        detail:
          'In Pub/Sub, PUBLISH channel message sends to all current subscribers and returns the count of subscribers that received it. In Streams, XADD stream_name * field1 val1 ... appends an entry with an auto-generated ID (millisecond-timestamp-sequence) and returns the ID. Publishers are fully decoupled from consumers in both cases.',
      },
      {
        name: 'Channel/Topic Router',
        icon: '🔀',
        role: 'Routes published messages to matching subscribers',
        detail:
          'Pub/Sub supports exact-match SUBSCRIBE channel and pattern-match PSUBSCRIBE pattern (e.g., PSUBSCRIBE notifications:*). Redis maintains an in-memory subscription table mapping channel names to client connection lists. Streams use the stream key as the topic — there is no routing, just a log that consumers read at their own pace.',
      },
      {
        name: 'Consumer Group',
        icon: '👥',
        role: 'Enables horizontal scaling and at-least-once delivery for stream consumers',
        detail:
          'XGROUP CREATE stream_name group_name $ creates a consumer group starting from the latest entry. XREADGROUP GROUP group consumer COUNT n STREAMS stream_name > reads the next N undelivered entries for this consumer. Each entry is delivered to exactly one consumer in the group (competing consumers pattern). XACK group stream_name id marks it as processed and removes it from the PEL.',
      },
      {
        name: 'PEL (Pending Entry List)',
        icon: '📋',
        role: 'Tracks messages delivered to consumers but not yet acknowledged',
        detail:
          'When XREADGROUP delivers an entry to a consumer, Redis records it in the PEL for that consumer. The entry stays in the PEL until XACK is called. XPENDING stream_name group shows all pending entries with delivery count and idle time. If a consumer crashes, entries in its PEL can be claimed by another consumer using XCLAIM or auto-claimed with XAUTOCLAIM after an idle timeout.',
      },
    ],
    howItWorks:
      'Redis Pub/Sub maintains a subscription table in memory. SUBSCRIBE puts the client\'s connection into a dedicated subscribe mode where it can only receive messages (it cannot issue regular commands). PUBLISH broadcasts the message synchronously to all matching connections in the same event loop iteration — no buffering, no persistence. If the subscriber is slow to consume (its TCP buffer fills), Redis will either block or drop the message depending on client-output-buffer-limit settings. The delivery guarantee is strictly at-most-once: messages sent while a subscriber is disconnected or overloaded are silently dropped.\n\nRedis Streams store each message as an entry in an append-only log identified by a stream key. Each entry has a unique ID (timestamp-sequencenumber, e.g., 1735000000000-0) and a set of field-value pairs. XREAD reads from a position in the stream; XREADGROUP reads on behalf of a consumer group, delivering each entry to exactly one consumer (round-robin or first-available depending on implementation). The entry remains in the log until the stream is trimmed with MAXLEN or XTRIM — separate from acknowledgement, which only affects the PEL.\n\nConsumer groups provide the at-least-once semantic. A crashed consumer\'s PEL entries are not lost — XPENDING shows them with their idle time. Another consumer can claim them with XCLAIM after a timeout, or XAUTOCLAIM can sweep them automatically. The delivery count per entry allows dead-letter logic: entries delivered more than N times without acknowledgement can be moved to a dead-letter stream for manual inspection. Compared to Kafka, Redis Streams trade retention policy richness and multi-datacenter replication for simplicity and sub-millisecond latency.',
    decision: {
      choose: [
        'Pub/Sub for real-time notifications where message loss is acceptable — chat room messages, live dashboard updates, presence indicators, cache invalidation signals',
        'Pub/Sub for fan-out to many subscribers where you need PSUBSCRIBE pattern matching',
        'Streams for task queues, event sourcing, and any use case requiring at-least-once delivery, consumer group scaling, or the ability to replay messages',
        'Streams when you need acknowledgement, pending entry tracking, and dead-letter handling',
        'Streams as a simpler alternative to Kafka for moderate-volume event streaming within a single datacenter',
      ],
      avoid: [
        'Pub/Sub when subscribers can be slow or intermittently disconnected — messages will be silently dropped',
        'Pub/Sub for task distribution — if the worker crashes mid-task, the task is lost',
        'Streams as a replacement for Kafka when you need multi-datacenter replication, multi-day retention of terabytes of data, or Kafka Streams-style processing',
        'Streams with MAXLEN 0 (no trimming) — the stream will grow unbounded and eventually OOM the instance',
      ],
      vs: [
        {
          name: 'Redis Pub/Sub vs Redis Streams',
          when: 'Use Pub/Sub for fire-and-forget real-time broadcast (at-most-once, no persistence). Use Streams for reliable task delivery (at-least-once, persistent, replayable). Streams are strictly more capable but have more operational overhead.',
        },
        {
          name: 'Redis Streams vs Kafka',
          when: 'Use Kafka for high-volume (millions of events/sec), multi-datacenter, multi-day retention, complex stream processing (joins, aggregations). Use Redis Streams for lower-volume, low-latency, simple task queues within one datacenter where you already operate Redis.',
        },
        {
          name: 'Redis Pub/Sub vs WebSocket broadcast',
          when: 'Redis Pub/Sub is the backend fan-out mechanism. WebSockets are the client-facing transport. Use Redis Pub/Sub to broadcast across multiple application server instances; each server subscribes and forwards to its own WebSocket clients.',
        },
      ],
    },
    failures: [
      {
        name: 'Pub/Sub message loss on subscriber disconnect',
        cause:
          'A subscriber disconnects briefly (network blip, deploy restart, crash); PUBLISH continues during the disconnect; when the subscriber reconnects it has no way to know what it missed — there is no persistence, no offset, no replay',
        symptom:
          'Missing real-time updates after reconnect; users see stale UI; cache invalidation signals are dropped, causing stale cache entries; no errors or logs to indicate the loss',
        fix: 'Switch to Redis Streams if any message loss is unacceptable. For pure Pub/Sub use cases, implement a fallback poll: on reconnect, query the current state from the canonical data source to catch up before resuming subscription. For cache invalidation, use a versioned invalidation key in Redis that subscribers check on reconnect.',
        severity: 'high',
      },
      {
        name: 'Slow consumer blocking Streams',
        cause:
          'A consumer group member is slow (database bottleneck downstream) and accumulates a large PEL while other consumers in the group are idle; alternatively, a single consumer on XREAD BLOCK without a group holds a connection open, starving Redis of connection pool slots',
        symptom:
          'PEL grows unbounded; XPENDING shows entries with millions of milliseconds of idle time; new messages are delivered but not processed; latency for producers (XADD) is unaffected, but business logic stalls',
        fix: 'Monitor XPENDING cardinality per consumer group. Implement XAUTOCLAIM with a reasonable idle timeout to redistribute stuck entries to active consumers. Tune consumer group count to match downstream processing capacity. Use XINFO GROUPS stream_name to see lag per group.',
        severity: 'high',
      },
      {
        name: 'PEL growing without XACK',
        cause:
          'Consumer code processes messages successfully but forgets to call XACK, or crashes after processing but before acknowledging; entries remain in the PEL indefinitely',
        symptom:
          'XPENDING count grows monotonically; memory usage increases (PEL is stored in memory); entries are redelivered on XAUTOCLAIM, causing duplicate processing; eventually Redis OOMs if the PEL grows large enough',
        fix: 'Always call XACK in a finally block or as part of the same transaction as the downstream write. Implement a dead-letter consumer that XAUTOCLAIMS entries idle for > N minutes and moves them to a dead:stream_name stream after > M delivery attempts. Alert on XPENDING cardinality > threshold.',
        severity: 'high',
      },
    ],
    a: {
      v: 'Radio broadcast (Pub/Sub) vs a recorded podcast with listener tracking (Streams)',
      t: 'Both deliver audio, but only one knows you listened',
      tx: 'Redis Pub/Sub is a live radio station: if you\'re tuned in when the DJ plays a song, you hear it. If your radio is off, the song is gone forever — the station keeps no recording. Redis Streams is a podcast platform: every episode is stored permanently, each listener\'s position is tracked, and if you pause and come back a week later, you pick up exactly where you left off. Multiple podcast listeners (consumer group members) can share a feed where each episode is delivered to exactly one listener — no episode is missed, and if one listener skips out mid-episode, another can pick it up from the beginning.',
      s: 'Redis Pub/Sub provides at-most-once ephemeral broadcast (PUBLISH/SUBSCRIBE) while Redis Streams provides durable, replayable event logs (XADD/XREADGROUP/XACK) with consumer groups and pending-entry tracking for at-least-once delivery.',
    },
    te: {
      def: 'Redis Pub/Sub is an at-most-once broadcast mechanism where PUBLISH delivers a message to all current subscribers with no persistence. Redis Streams is a durable append-only log (XADD/XREAD) supporting consumer groups (XREADGROUP/XACK) for at-least-once delivery with replayability and pending-entry tracking.',
      types: [
        { n: 'Pub/Sub — SUBSCRIBE', d: 'Subscribe to an exact channel name. Connection enters subscribe mode. At-most-once delivery. No persistence. No consumer groups.' },
        { n: 'Pub/Sub — PSUBSCRIBE', d: 'Subscribe to a glob pattern (e.g., notifications:user:*). All matching channels are received. Same at-most-once semantics.' },
        { n: 'Streams — XADD / XREAD', d: 'Append entries to a durable log and read from a position. No consumer groups — each reader manages its own offset. Supports BLOCK for long-polling.' },
        { n: 'Streams — XREADGROUP / XACK', d: 'Consumer group mode: entries delivered to one consumer per group, tracked in PEL until XACK. At-least-once delivery with crash recovery via XCLAIM/XAUTOCLAIM.' },
        { n: 'Streams — XPENDING / XCLAIM / XAUTOCLAIM', d: 'Inspect and redistribute pending (unacknowledged) entries. Foundation for dead-letter queues and consumer crash recovery.' },
      ],
      when: 'Use Pub/Sub for real-time features where message loss is tolerable (live dashboards, presence, chat notifications). Use Streams for any workflow requiring reliability: job queues, event sourcing, audit logs, inter-service event buses within a single datacenter.',
      trade: 'Pub/Sub: zero overhead for missed messages (no storage), instant broadcast, but zero durability and no consumer scaling without application-level fan-out. Streams: persistent, replayable, scalable consumer groups, but requires MAXLEN management, XACK discipline, and PEL monitoring to avoid memory growth. Redis Streams are simpler than Kafka but lack Kafka\'s retention, throughput ceiling, and ecosystem.',
      code: `// Node.js — Pub/Sub AND Stream producer + consumer group
import Redis from 'ioredis';

// ============ PUB/SUB ============
const publisher = new Redis();
const subscriber = new Redis();

// Subscriber side — must use a dedicated connection
await subscriber.subscribe('notifications:orders', (err, count) => {
  if (err) throw err;
  console.log(\`Subscribed to \${count} channel(s)\`);
});

subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  console.log(\`[PubSub] \${channel}:\`, data);
  // NOTE: if this process restarts, we miss any messages sent during downtime
});

// Publisher side
await publisher.publish(
  'notifications:orders',
  JSON.stringify({ orderId: 'ord-123', status: 'shipped' })
);

// ============ STREAMS ============
const streamClient = new Redis();
const STREAM = 'orders:events';
const GROUP = 'order-processor';
const CONSUMER = \`worker-\${process.pid}\`;

// Create consumer group (idempotent with MKSTREAM)
try {
  await streamClient.xgroup('CREATE', STREAM, GROUP, '0', 'MKSTREAM');
  console.log('Consumer group created');
} catch (e: any) {
  if (!e.message.includes('BUSYGROUP')) throw e;
}

// Producer — append events to stream
async function publishOrderEvent(orderId: string, status: string) {
  const id = await streamClient.xadd(
    STREAM, 'MAXLEN', '~', '10000', // keep ~10k entries
    '*',                              // auto-generate ID
    'orderId', orderId,
    'status', status,
    'timestamp', Date.now().toString()
  );
  console.log(\`[Stream] Published event \${id}\`);
  return id;
}

// Consumer — read and acknowledge
async function consumeOrderEvents() {
  while (true) {
    // '>' means: give me new messages not delivered to any consumer
    const results = await streamClient.xreadgroup(
      'GROUP', GROUP, CONSUMER,
      'COUNT', '10',
      'BLOCK', '2000',  // block 2 seconds if no messages
      'STREAMS', STREAM, '>'
    ) as [string, [string, string[]][]][] | null;

    if (!results) continue; // timeout, loop again

    for (const [, entries] of results) {
      for (const [id, fields] of entries) {
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }
        console.log(\`[Stream] Processing \${id}:\`, data);

        try {
          await processOrder(data);
          // XACK removes from PEL — critical for at-least-once guarantee
          await streamClient.xack(STREAM, GROUP, id);
          console.log(\`[Stream] Acknowledged \${id}\`);
        } catch (err) {
          console.error(\`Failed to process \${id}, will retry:\`, err);
          // Don't XACK — entry stays in PEL for XAUTOCLAIM
        }
      }
    }
  }
}

// Recover stuck entries (run periodically)
async function recoverPendingEntries() {
  const minIdleMs = 30_000; // 30 seconds idle = consider stuck
  const [, claimed] = await (streamClient.xautoclaim as any)(
    STREAM, GROUP, CONSUMER, minIdleMs, '0-0', 'COUNT', '100'
  );
  if (claimed.length > 0) {
    console.log(\`Reclaimed \${claimed.length} stuck entries\`);
  }
}

async function processOrder(data: Record<string, string>) {
  console.log('Processing order:', data.orderId, data.status);
}

// Start
await publishOrderEvent('ord-456', 'placed');
await publishOrderEvent('ord-456', 'paid');
consumeOrderEvents().catch(console.error);`,
      rw: {
        ex: [
          'Discord uses Redis Pub/Sub to broadcast typing indicators and presence updates across gateway servers — losing a typing indicator is acceptable, so at-most-once is fine',
          'Robinhood uses Redis Streams for their trade event pipeline — each trade must be processed exactly once for settlement, requiring consumer groups and XACK',
          'Notion uses Redis Pub/Sub to fan out real-time collaboration events (cursor moves, block edits) to all connected clients via WebSocket servers subscribed to per-document channels',
          'Cloudflare uses Redis Streams as an internal task queue for their Workers KV replication pipeline, using consumer groups to distribute replication tasks across worker processes',
        ],
        cs: 'A logistics company used Redis Pub/Sub for shipment status updates to warehouse management systems. During a network partition between Redis and the warehouse software, 20 minutes of status updates were silently dropped. Warehouse staff continued scanning packages with stale status data, causing incorrect routing. The team migrated to Redis Streams with a consumer group per downstream system. After the migration, the warehouse system\'s consumer group fell behind during the partition but caught up immediately on reconnect — processing all 20 minutes of missed events in order with zero data loss.',
      },
    },
    interview: {
      q: 'When would you use Redis Pub/Sub versus Redis Streams? What are the delivery guarantees of each?',
      a: 'Redis Pub/Sub is at-most-once — messages are delivered to currently connected subscribers and immediately discarded; if a subscriber is disconnected, the message is lost. I\'d use it for latency-sensitive, loss-tolerant real-time features: live sports scores, typing indicators, cache invalidation signals, dashboard pushes. Redis Streams is at-least-once — every XADD entry is persisted and tracked per consumer group; a crashed consumer\'s unacknowledged entries stay in the PEL until another consumer claims them. I\'d use it for any task queue, event sourcing pipeline, or inter-service event bus where losing an event causes a real business problem. The key operational differences: Streams require MAXLEN trimming to prevent unbounded growth, XACK discipline to prevent PEL accumulation, and periodic XAUTOCLAIM to recover crashed consumers\' stuck entries. Pub/Sub requires none of that but gives you no safety net.',
      fu: [
        'How do consumer groups in Redis Streams ensure a message is processed by exactly one consumer, and what happens if that consumer crashes?',
        'What is the Pending Entry List (PEL) in Redis Streams, and how do you handle entries that fail to acknowledge?',
        'How would you use Redis Pub/Sub to fan out messages across multiple application server instances serving WebSocket connections?',
      ],
    },
  },

  {
    id: 'redis-cluster',
    cat: 'redis',
    color: '#dc2626',
    icon: '🕸️',
    title: 'Redis Replication, Sentinel & Cluster',
    tag: 'One leader, many followers — until the leader falls',
    overview:
      'Redis offers three progressively more complex topologies for high availability and horizontal scalability. Basic replication creates read replicas that asynchronously mirror the primary, providing read scaling and a warm standby. Redis Sentinel adds automatic failover by monitoring the primary and coordinating replica promotion on failure. Redis Cluster shards data across multiple primary-replica pairs using 16,384 hash slots, providing horizontal write scaling and automatic resharding — at the cost of multi-key operation restrictions and increased operational complexity.',
    components: [
      {
        name: 'Primary Node',
        icon: '👑',
        role: 'Accepts all writes and propagates them to replicas',
        detail:
          'The primary node processes all write commands and maintains a replication backlog (a circular buffer of recent commands). Replicas connect and request the backlog from their current offset. Partial resync (PSYNC) allows a replica to reconnect after a brief disconnect and catch up from the backlog rather than triggering a full BGSAVE.',
      },
      {
        name: 'Replica Node',
        icon: '📋',
        role: 'Maintains a copy of the primary\'s dataset and serves read requests',
        detail:
          'Replicas connect to the primary, receive an initial BGSAVE snapshot (or partial resync via PSYNC), and then apply the replication stream of commands in order. By default replication is asynchronous — the primary does not wait for replica confirmation before returning to the client. WAIT numreplicas timeout forces the primary to block until N replicas have acknowledged the replication offset.',
      },
      {
        name: 'Sentinel Monitor',
        icon: '👁️',
        role: 'Monitors the primary and orchestrates failover on failure detection',
        detail:
          'Each Sentinel sends PING to the primary every second. If no response is received within down-after-milliseconds, the Sentinel marks the primary as subjectively down. When a quorum of Sentinels agree (objectively down), an election chooses a Sentinel leader to initiate failover: it selects the replica with the most up-to-date replication offset, issues REPLICAOF NO ONE to promote it, and instructs other replicas and clients (via Sentinel pub/sub) to follow the new primary.',
      },
      {
        name: 'Cluster Bus',
        icon: '🚌',
        role: 'Gossip protocol for cluster state propagation',
        detail:
          'Each cluster node maintains connections to all other nodes on the cluster bus port (main port + 10000). Nodes exchange gossip messages every second with a random subset of peers, propagating node state (alive/failed/migrating), slot assignments, and configuration epochs. A node is marked as failed when a majority of masters report it as PFAIL (probable failure). The gossip protocol converges in O(log N) rounds.',
      },
      {
        name: 'Hash Slot Router',
        icon: '🗺️',
        role: 'Routes commands to the correct shard based on key\'s hash slot',
        detail:
          'Redis Cluster divides the keyspace into 16,384 hash slots (CRC16(key) % 16384). Each primary owns a contiguous range of slots. Clients (like ioredis in cluster mode) cache the slot-to-node mapping. On a MOVED error, the client refreshes its mapping and retries. On an ASK error (during slot migration), the client sends ASKING to the destination node before the command. Hash tags ({user}) force related keys to the same slot for multi-key operations.',
      },
    ],
    howItWorks:
      'Redis replication starts when a replica issues REPLICAOF primary_host primary_port. If the replica has no data, the primary runs BGSAVE and sends the RDB file; the replica loads it and then applies the continuous replication stream. If the replica was previously connected and its replication offset is within the replication backlog, a partial resync (PSYNC) sends only the missed commands. By default, writes return to the client before any replica confirms receipt — asynchronous replication. This means that on a primary crash, the promoted replica may be missing the last few writes. WAIT N timeout forces the primary to block until N replicas confirm the offset, providing synchronous replication at the cost of latency.\n\nRedis Sentinel solves the manual failover problem. A deployment of at least 3 Sentinel processes monitors the primary, agrees on failure via quorum, elects a Sentinel leader, selects the most up-to-date replica (highest replication offset), promotes it, and reconfigures all other replicas to follow the new primary. Client libraries that support Sentinel (ioredis, Lettuce) discover the current primary by querying any Sentinel — they receive the primary\'s address and connect to it, automatically reconnecting after failover. Sentinel provides high availability but not horizontal scalability — there is still one primary that handles all writes.\n\nRedis Cluster shards data. 16,384 hash slots are distributed across multiple primary nodes (e.g., 3 primaries each owning ~5,461 slots). Each primary has one or more replicas for failover. A client computes CRC16(key) % 16384 to determine the target slot, and queries the node owning that slot. If the command arrives at the wrong node, the node responds with MOVED slot node_address — the client updates its slot map and retries. During slot migration (CLUSTER SETSLOT / MIGRATE), keys move from source to target; ASK redirects indicate the key has moved but the slot is still migrating. Multi-key commands (MGET, MSET, SUNIONSTORE) only work when all keys hash to the same slot — use hash tags ({tag}key) to group related keys.',
    decision: {
      choose: [
        'Replication-only when you need read scaling and can tolerate manual failover — simplest topology, lowest overhead',
        'Sentinel when you need automatic failover for a single primary and your dataset fits on one server — the standard HA setup for most Redis deployments',
        'Cluster when your dataset exceeds single-node memory, or when write throughput exceeds what a single primary can handle — the horizontal scaling answer',
        'WAIT command with Sentinel when losing the last few writes on failover is unacceptable (financial transactions, inventory updates)',
      ],
      avoid: [
        'Redis Cluster when you rely heavily on multi-key operations across different hash slots — MGET/MSET/Lua scripts spanning slots will fail with CROSSSLOT errors',
        'Redis Cluster with fewer than 3 primary nodes — you need at least 3 primaries for the cluster to continue operating after one node failure (majority quorum)',
        'Sentinel with only 2 Sentinels — you need at least 3 for reliable quorum; 2 Sentinels cannot reach majority to elect a leader',
        'Asynchronous replication for use cases that cannot tolerate any write loss on failover — use WAIT or a consensus-based store instead',
      ],
      vs: [
        {
          name: 'Sentinel vs Cluster for HA',
          when: 'Use Sentinel when your dataset fits on one primary and you want simple automatic failover. Use Cluster when you need to shard data across multiple primaries. Cluster also does failover automatically, but for single-node HA Sentinel is simpler to operate.',
        },
        {
          name: 'Redis Cluster vs multiple independent Redis instances',
          when: 'Multiple independent instances (sharded at the application layer) give you full control and avoid cross-slot restrictions, but require client-side sharding logic and manual resharding. Redis Cluster handles resharding, failover, and routing automatically — prefer it for new deployments.',
        },
        {
          name: 'Redis replication vs Redis Cluster replication',
          when: 'Both use async replication by default. Cluster replication follows the same PSYNC protocol within each shard. The difference is that Cluster performs automatic intra-shard failover without Sentinel — each shard\'s replicas elect a new primary when the shard\'s primary fails, as long as a majority of cluster masters are reachable.',
        },
      ],
    },
    failures: [
      {
        name: 'Async replication losing writes on failover',
        cause:
          'Primary accepts writes but crashes before they are replicated; the promoted replica has an older replication offset; writes in the gap are permanently lost',
        symptom:
          'After failover, data that clients received successful write confirmations for is missing; counters are incorrect; cache entries appear to revert; no error in client logs because the primary confirmed the write before dying',
        fix: 'For write-critical paths, use WAIT 1 timeout_ms before returning to the client to ensure at least one replica has confirmed the write. Accept the latency cost. For cache use cases, treat write loss as acceptable and focus on monitoring replication lag via INFO replication (master_repl_offset - slave_repl_offset).',
        severity: 'high',
      },
      {
        name: 'Split-brain on network partition',
        cause:
          'A network partition separates the primary from the Sentinel majority; the Sentinels promote a replica to primary; the original primary is still alive and accepting writes from clients that can still reach it; after the partition heals, one primary\'s writes are lost',
        symptom:
          'Two primaries accept writes simultaneously during the partition; when the partition heals, the old primary is demoted and its writes since the partition are discarded; clients connected to the old primary received successful write confirmations for data that is now lost',
        fix: 'Configure min-replicas-to-write 1 and min-replicas-max-lag 10 on the primary — if the primary cannot reach any replica within 10 seconds, it stops accepting writes, preventing split-brain write loss. This trades availability for consistency during partitions.',
        severity: 'critical',
      },
      {
        name: 'Hot slot overloading one shard',
        cause:
          'A single key (or a group of keys forced to the same slot via hash tags) receives a disproportionate amount of traffic, overloading the primary responsible for that slot while other shards are underutilized',
        symptom:
          'One Redis node shows high CPU and command latency while others are idle; cluster-wide throughput is limited by the hot shard; CLUSTER INFO shows one primary with orders of magnitude more commands/sec than others',
        fix: 'Identify hot keys with redis-cli --hotkeys or MONITOR sampling. For hot read keys, add read replicas to the hot shard and route reads to them. For hot write keys, shard the key itself at the application layer (e.g., counter:product:42:shard:{0..9}) and aggregate reads. Avoid large hash tags that force many keys to the same slot.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A restaurant chain with a head chef, sous chefs, and multiple kitchen locations',
      t: 'One kitchen makes the decisions; the others follow',
      tx: 'Basic replication is one head chef (primary) with sous chefs (replicas) who copy every recipe the head chef creates — the sous chefs can serve dishes (handle reads) but cannot change the menu (no writes). Sentinel is the restaurant manager who watches the head chef: if the head chef collapses, the manager promotes the best sous chef to head chef and tells all the waiters the new kitchen location. Redis Cluster is a restaurant with multiple kitchens, each responsible for a section of the menu (hash slots): starters in kitchen 1, mains in kitchen 2, desserts in kitchen 3. Each kitchen has its own head chef and sous chefs. If you order a starter and a dessert together, the waiter must visit both kitchens — that\'s the multi-key restriction.',
      s: 'Redis offers three HA/scale topologies: replication (async primary-replica sync with PSYNC), Sentinel (automatic failover via quorum monitoring), and Cluster (16,384 hash slots sharded across multiple primary-replica pairs with MOVED/ASK routing).',
    },
    te: {
      def: 'Redis high availability is achieved through three mechanisms: replication (async PSYNC-based primary-to-replica data sync), Sentinel (automated primary monitoring and failover orchestration via quorum), and Cluster (horizontal sharding across 16,384 CRC16 hash slots with built-in failover and gossip-based cluster state management).',
      types: [
        { n: 'Standalone Replication', d: 'REPLICAOF command sets up async primary-to-replica sync. PSYNC enables partial resync after disconnect. WAIT enables sync replication. No automatic failover.' },
        { n: 'Redis Sentinel', d: 'External monitoring processes detect primary failure via quorum, elect a leader Sentinel, promote a replica, and notify clients. Requires ≥3 Sentinels. Single-primary HA.' },
        { n: 'Redis Cluster', d: '16,384 hash slots distributed across ≥3 primary nodes. Each primary has replicas. Automatic intra-shard failover. MOVED/ASK redirects for routing. Horizontal write scaling.' },
        { n: 'Cluster with hash tags', d: 'Curly-brace syntax ({tag}key) forces keys to the same slot, enabling multi-key operations across logically related keys within a Cluster deployment.' },
      ],
      when: 'Start with standalone replication for read scaling. Add Sentinel when you need automatic failover and your dataset fits on one primary. Migrate to Cluster when dataset size exceeds single-node memory (~80% of available RAM) or write throughput saturates a single primary.',
      trade: 'Replication: simple but no auto-failover, async replication risks write loss. Sentinel: automatic failover but adds operational complexity (≥3 Sentinel processes), still single primary for writes. Cluster: horizontal scalability and automatic failover but restricts multi-key operations, increases client complexity, and requires ≥6 nodes (3 primaries + 3 replicas) for production-grade operation.',
      code: `// Node.js — ioredis Cluster + Sentinel configuration
import Redis, { Cluster } from 'ioredis';

// ============ SENTINEL ============
const sentinelClient = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'mymaster',         // sentinel master name
  sentinelRetryStrategy: (times: number) => Math.min(times * 100, 3000),
});

sentinelClient.on('connect', () => console.log('Connected to Redis via Sentinel'));
sentinelClient.on('+switch-master', (msg: string) => console.log('Failover:', msg));

await sentinelClient.set('session:user123', JSON.stringify({ role: 'admin' }));
const session = await sentinelClient.get('session:user123');
console.log('Session:', session);

// ============ CLUSTER ============
const cluster = new Cluster([
  { host: 'redis-node-1', port: 7001 },
  { host: 'redis-node-2', port: 7002 },
  { host: 'redis-node-3', port: 7003 },
  { host: 'redis-node-4', port: 7004 },
  { host: 'redis-node-5', port: 7005 },
  { host: 'redis-node-6', port: 7006 },
], {
  redisOptions: { password: 'secret' },
  scaleReads: 'slave',     // route reads to replicas
  clusterRetryStrategy: (times: number) => Math.min(times * 100, 3000),
});

cluster.on('node error', (err: Error, address: string) => {
  console.error(\`Cluster node \${address} error:\`, err.message);
});

// Keys hash to different slots — works fine individually
await cluster.set('user:1001:name', 'Alice');
await cluster.set('user:1002:name', 'Bob');

// Hash tags force both keys to the same slot — enables multi-key ops
await cluster.mset(
  '{user:1001}:name', 'Alice',
  '{user:1001}:email', 'alice@example.com',
  '{user:1001}:role', 'admin'
);
const [name, email, role] = await cluster.mget(
  '{user:1001}:name', '{user:1001}:email', '{user:1001}:role'
);
console.log({ name, email, role });

// Pipeline within a single slot
const pipeline = cluster.pipeline();
pipeline.incr('{counter:page:home}:views');
pipeline.incr('{counter:page:home}:uniques');
const results = await pipeline.exec();
console.log('Page counters:', results);

// Cluster info
const info = await cluster.cluster('INFO') as string;
const state = info.match(/cluster_state:(\w+)/)?.[1];
const slots = info.match(/cluster_slots_assigned:(\d+)/)?.[1];
console.log(\`Cluster state: \${state}, slots assigned: \${slots}/16384\`);`,
      rw: {
        ex: [
          'Twitter\'s Twemcache and later Redis deployments used consistent-hash-based application-level sharding before Redis Cluster existed — they eventually migrated to Cluster for operational simplicity',
          'GitHub uses Redis Sentinel for its primary session and rate-limit Redis instances — automatic failover during Redis maintenance windows allows zero-downtime deploys',
          'Slack uses Redis Cluster with hash tags to group all keys for a given workspace into the same hash slot, ensuring multi-key atomic operations work correctly for workspace-scoped data',
          'Shopify operates hundreds of Redis Cluster shards, each serving a partition of their merchant namespace, with Sentinel-like monitoring managed by their internal infrastructure platform',
        ],
        cs: 'A social gaming company ran Redis Cluster with 3 primaries and relied heavily on MGET to fetch multiple player profiles simultaneously. After moving to Cluster, cross-slot MGET calls started failing with CROSSSLOT errors. They implemented hash tags ({game:session_id}player:N) to force all player keys for a given game session to the same slot. This fixed the CROSSSLOT errors but created a hot slot problem: popular game sessions were hashing to the same node, overloading it. They solved this by using a consistent hash ring at the application layer to distribute game sessions across multiple prefixes ({game:shard0}..{game:shard7}), spreading the hot slots across all cluster nodes.',
      },
    },
    interview: {
      q: 'Explain the difference between Redis Replication, Sentinel, and Cluster. When would you use each, and what are the trade-offs?',
      a: 'Replication is the foundation: a primary accepts writes and asynchronously syncs them to one or more replicas via PSYNC. Replicas can serve reads but not writes. There is no automatic failover — if the primary dies, you promote a replica manually. Sentinel adds automatic failover: a quorum of Sentinel processes monitors the primary, and when they agree it is down, one Sentinel is elected to promote the best replica and reconfigure all clients. You need at least 3 Sentinels for reliable quorum. Sentinel gives you HA but still only one primary for writes. Cluster shards the keyspace across multiple primary-replica pairs using 16,384 hash slots (CRC16 mod 16384). Each shard operates like a mini-Sentinel group with automatic failover. Cluster gives you horizontal write scaling and handles routing via MOVED/ASK redirects. Trade-offs: Cluster restricts multi-key operations to the same hash slot (solvable with hash tags), requires ≥6 nodes (3 primaries + 3 replicas) for production, and adds client complexity. I use replication for read scaling, Sentinel for single-primary HA, and Cluster when the dataset or write load exceeds single-node capacity.',
      fu: [
        'How does Redis Cluster handle a node failure? What is the quorum requirement for promoting a replica to primary within a shard?',
        'What are MOVED and ASK errors in Redis Cluster, and when does each occur?',
        'How does asynchronous replication in Redis lead to write loss during failover, and what configuration options can mitigate this?',
      ],
    },
  },
];
