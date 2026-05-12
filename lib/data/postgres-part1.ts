import { Concept } from '../types';

export const POSTGRES_PART1: Concept[] = [
  {
    id: 'postgres-mvcc',
    cat: 'postgres',
    color: '#336791',
    icon: '📸',
    title: 'MVCC (Multi-Version Concurrency Control)',
    tag: 'Multiple time-travel snapshots — readers never block writers',
    overview:
      'MVCC allows PostgreSQL to serve concurrent readers and writers without locking by maintaining multiple versions of each row simultaneously. Every row carries hidden system columns — xmin (the transaction that inserted it) and xmax (the transaction that deleted or updated it) — forming a version chain the database walks to find the correct visible row. A transaction takes a snapshot at its start and sees only rows committed before that snapshot, making its view stable for the entire duration even as other transactions commit new data. The cost of this elegance is dead tuple accumulation: old row versions are not deleted in-place but left as garbage until VACUUM reclaims them.',
    components: [
      {
        name: 'Row Version (xmin/xmax)',
        icon: '🏷️',
        role: 'Tracks the birth and death of each tuple',
        detail:
          'Every heap tuple stores xmin (the transaction ID that created it) and xmax (the transaction ID that deleted/updated it, or 0 if still live). An UPDATE physically inserts a new tuple with the new data and stamps the old tuple\'s xmax with the updating transaction\'s ID. This means no in-place modification occurs — the old version remains readable to concurrent snapshots.',
      },
      {
        name: 'Transaction Snapshot',
        icon: '📷',
        role: 'Defines what committed data a transaction can see',
        detail:
          'At the moment a transaction (or, in READ COMMITTED mode, each statement) begins, PostgreSQL records which transaction IDs are in-flight (xip_list), the minimum active xid (xmin), and the next unassigned xid (xmax). Any row whose xmin is below snapshot-xmin and whose xmax is either 0 or in the xip_list is visible. This makes every read a consistent point-in-time view.',
      },
      {
        name: 'Visibility Checker',
        icon: '🔍',
        role: 'Evaluates per-tuple visibility against the current snapshot',
        detail:
          'For every heap tuple fetched during a scan, the visibility checker evaluates the combination of xmin status (committed? aborted?), xmax status, and the current snapshot. It consults the commit log (pg_clog / pg_xact) to determine commit/abort status of transaction IDs. The visibility map tracks which pages contain only visible-to-all tuples, allowing index-only scans to skip the heap entirely on clean pages.',
      },
      {
        name: 'Dead Tuple Accumulator',
        icon: '🗑️',
        role: 'Old row versions awaiting VACUUM reclamation',
        detail:
          'Every UPDATE and DELETE leaves behind dead tuples — rows whose xmax is a committed transaction. These consume disk space and slow sequential scans. VACUUM finds and marks dead tuples as free space in the Free Space Map (FSM) so new rows can reuse the space. VACUUM FULL rewrites the table entirely but takes an ACCESS EXCLUSIVE lock, making autovacuum (which runs HOT_STANDBY-safe VACUUM) the standard solution.',
      },
    ],
    howItWorks:
      'When a transaction begins, PostgreSQL assigns it a transaction ID (XID) from a monotonically increasing 32-bit counter and records a snapshot: the minimum active XID, the maximum assigned XID, and the list of in-progress XIDs. Every subsequent heap tuple read is evaluated against this snapshot — a tuple is visible if its xmin was committed before the snapshot and its xmax was either not yet committed or happened after the snapshot.\n\nWhen a row is updated, PostgreSQL does not touch the existing tuple. Instead it writes a brand-new tuple with the updated column values and the current XID as xmin, then stamps the old tuple\'s xmax with the current XID. The old tuple stays in the heap page, visible to any snapshot that predates this update. Deletions work the same way: only the xmax of the existing tuple is set; no data is physically removed. This means readers running against the old snapshot continue reading the old version without any blocking.\n\nOver time dead tuples accumulate. PostgreSQL\'s autovacuum daemon wakes periodically (controlled by autovacuum_vacuum_scale_factor and autovacuum_vacuum_threshold) to scan tables with many dead tuples, mark their space free in the FSM, and update the visibility map. VACUUM also advances the oldest-horizon XID used by the MVCC machinery. If VACUUM cannot keep up — because a long-running transaction holds back the horizon — table bloat grows and, in the extreme, transaction ID wraparound threatens: XID is a 32-bit integer and wraps after ~2 billion transactions, at which point all data appears to be in the future and is invisible. PostgreSQL forces an emergency VACUUM and eventually shuts down to prevent this catastrophe.',
    decision: {
      choose: [
        'You need high read concurrency without reader/writer blocking — MVCC eliminates shared read locks entirely',
        'You need consistent point-in-time reads for analytics queries running alongside OLTP writes',
        'You want serializable isolation with optimistic concurrency rather than pessimistic locking',
        'You are on PostgreSQL and need predictable read latency regardless of write load',
      ],
      avoid: [
        'Tables with extremely high UPDATE/DELETE rates and underpowered autovacuum — bloat will accumulate faster than VACUUM can reclaim',
        'Very long-running transactions on write-heavy tables — they hold back the MVCC horizon and block VACUUM from reclaiming space',
        'Workloads where you absolutely need to prevent phantom reads and are not using REPEATABLE READ or SERIALIZABLE isolation',
        'Situations where raw storage is severely constrained and dead tuple overhead is unacceptable without tuning autovacuum aggressively',
      ],
      vs: [
        {
          name: 'Lock-based concurrency (MySQL MyISAM)',
          when: 'MyISAM uses table-level read/write locks — readers block writers and vice versa. Choose MVCC (PostgreSQL/InnoDB) for any concurrent workload; lock-based makes sense only for read-only or single-writer batch loads where simplicity matters more than concurrency.',
        },
        {
          name: 'Optimistic locking (application-level)',
          when: 'Application-level optimistic locking (version column + conditional UPDATE) avoids database overhead but requires retry logic in every write path. Use database MVCC when you want the engine to handle snapshot isolation transparently; use application optimistic locking on top of MVCC when you need cross-request conflict detection (e.g., web form edit conflicts).',
        },
      ],
    },
    failures: [
      {
        name: 'Table Bloat from Dead Tuples',
        cause:
          'Autovacuum is disabled, too slow, or blocked by a long-running transaction that holds the MVCC horizon back, preventing dead tuple reclamation.',
        symptom:
          'Table size on disk grows continuously despite stable row counts; sequential scans slow down; pg_stat_user_tables shows n_dead_tup in the millions.',
        fix: 'Run VACUUM ANALYZE manually; tune autovacuum_vacuum_scale_factor (lower it, e.g. 0.01 for large tables); add per-table storage parameters; kill long-running idle transactions; consider pg_repack for zero-downtime table rewrites.',
        severity: 'high',
      },
      {
        name: 'Transaction ID Wraparound',
        cause:
          'The XID counter approaches 2^31 transactions ahead of the oldest un-vacuumed XID; PostgreSQL begins marking tuples with the FrozenXID to protect them, but if VACUUM cannot freeze enough tuples in time, the database enters self-protection shutdown.',
        symptom:
          'WARNING: database "mydb" must be vacuumed within N transactions; eventually ERROR: database is not accepting commands to avoid wraparound data loss.',
        fix: 'Run VACUUM FREEZE on the affected tables immediately; ensure autovacuum_freeze_max_age is not set too high; schedule regular aggressive VACUUM on high-write tables; monitor age(datfrozenxid) in pg_database.',
        severity: 'critical',
      },
      {
        name: 'Long Transactions Blocking VACUUM Horizon',
        cause:
          'An idle-in-transaction or very slow query holds an XID or snapshot older than autovacuum\'s target, preventing any dead tuples from being reclaimed across the entire database.',
        symptom:
          'pg_stat_activity shows a transaction with state = idle in transaction and a very old xact_start; n_dead_tup climbs on all busy tables; disk usage grows.',
        fix: 'Set idle_in_transaction_session_timeout to kill stale transactions automatically; monitor oldest active XID via SELECT min(age(backend_xid)) FROM pg_stat_activity; terminate the offending session.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A library that never removes old editions of a book',
      t: 'When the library receives an updated edition, it shelves the new book next to the old one rather than replacing it. Each reader gets a library card stamped with today\'s date, and they can only see books shelved before their card was stamped. The librarian (VACUUM) periodically removes editions nobody\'s card is old enough to need anymore.',
      tx: 'MVCC works like a library that keeps every edition of every book simultaneously. Your transaction card (snapshot) is stamped when you walk in. You always see the edition that existed at that moment, even if the librarian shelves a newer edition while you\'re reading. Writers never erase old editions — they just add new ones. Old editions pile up until the librarian (VACUUM) determines no valid card is old enough to need them and clears them out. A reader and a writer never fight over the same shelf because they\'re looking at different editions. This keeps reads fast and lock-free at the cost of extra storage for the dead editions.',
      s: 'Snapshot reads via row versioning — readers never block writers',
    },
    te: {
      def: 'MVCC is a concurrency control technique where each write operation creates a new version of a row rather than modifying in place, and each transaction reads the version valid at its snapshot timestamp, eliminating reader/writer blocking at the cost of storing multiple row versions and requiring periodic garbage collection (VACUUM).',
      types: [
        {
          n: 'Snapshot Isolation (Read Committed)',
          d: 'Default PostgreSQL mode. Each statement gets a fresh snapshot of committed data at statement start. Non-repeatable reads are possible across statements in the same transaction.',
        },
        {
          n: 'Snapshot Isolation (Repeatable Read)',
          d: 'Snapshot is fixed at the first statement of the transaction. Reads of the same row return the same value throughout the transaction. In PostgreSQL this also prevents phantom reads due to SSI implementation.',
        },
        {
          n: 'Serializable Snapshot Isolation (SSI)',
          d: 'Full serializability enforced via predicate locking on top of MVCC. Detects read/write dependencies that would cause non-serializable outcomes and aborts one transaction in the cycle.',
        },
        {
          n: 'HOT Updates (Heap Only Tuple)',
          d: 'When an updated column is not indexed, PostgreSQL can write the new tuple in the same heap page and chain it via a pointer rather than requiring index updates, reducing write amplification.',
        },
      ],
      when: 'Always active in PostgreSQL — MVCC is the foundation of all concurrency. Tune autovacuum aggressively for high-write tables. Use REPEATABLE READ or SERIALIZABLE when you need stronger consistency guarantees. Monitor pg_stat_user_tables.n_dead_tup and age(relfrozenxid) in pg_class.',
      trade:
        'Read performance: excellent (no read locks, consistent snapshots). Write performance: slight overhead per write to maintain versions. Storage: dead tuples consume space until VACUUM reclaims them — can be 2–10x logical data size on write-heavy tables without proper autovacuum. Operational complexity: must monitor and tune autovacuum, watch for long transactions holding MVCC horizon, and guard against XID wraparound.',
      code: `-- Session 1: begin a transaction and read
BEGIN;
SELECT txid_current(); -- e.g., 1001

-- Session 2 (concurrent): update the same row
BEGIN;
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
COMMIT; -- txid 1002

-- Session 1 still sees old value (snapshot at txid 1001)
SELECT balance FROM accounts WHERE id = 1;
-- Returns original value — MVCC snapshot in effect
COMMIT;

-- Inspect dead tuples and MVCC overhead
SELECT relname,
       n_live_tup,
       n_dead_tup,
       round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum,
       last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Check oldest transaction holding back VACUUM horizon
SELECT pid, usename, state, xact_start,
       age(backend_xid::text::xid) AS xid_age,
       query
FROM pg_stat_activity
WHERE backend_xid IS NOT NULL
ORDER BY xid_age DESC;

-- EXPLAIN shows heap fetches (MVCC visibility checks)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM accounts WHERE id = 1;
-- "Heap Fetches: N" in Index Only Scan means visibility map misses`,
      rw: {
        ex: [
          'Heroku Postgres: MVCC enables thousands of simultaneous Heroku app connections to read data without blocking each other or the continuous write stream from application backends',
          'GitLab: long-running CI pipeline status queries run against MVCC snapshots while developers push commits and update pipeline records concurrently, with no read/write conflicts',
          'Shopify: order processing writes (INSERT/UPDATE on orders table) proceed in parallel with analytics dashboards reading the same tables via stable MVCC snapshots',
          'Supabase real-time: the logical replication slot that feeds real-time change events relies on MVCC to read the WAL consistently without blocking application writes',
        ],
        cs: 'A fintech platform processing 50,000 transactions/second uses PostgreSQL MVCC to run end-of-day reconciliation reports (full table scans) concurrently with live payment processing (continuous INSERTs/UPDATEs). Without MVCC the report query would lock the table and block payments for minutes. With MVCC the report sees a stable snapshot from its start time and payments proceed unimpeded. The engineering team tunes autovacuum aggressively (autovacuum_vacuum_cost_delay = 2ms, autovacuum_vacuum_scale_factor = 0.01) on the transactions table to keep dead tuple count below 5% of live tuples, avoiding the storage bloat that once caused a 3x table size inflation.',
      },
    },
    interview: {
      q: 'How does PostgreSQL\'s MVCC differ from lock-based concurrency control, and what operational problems does it introduce?',
      a: 'In lock-based systems like MySQL MyISAM, readers and writers contend on the same rows, requiring shared and exclusive locks that cause readers to block writers and vice versa. PostgreSQL\'s MVCC avoids this entirely: every write creates a new row version stamped with the writing transaction\'s XID, and readers use a snapshot taken at transaction start to find the version visible to them — no read lock needed. This makes reads completely non-blocking regardless of concurrent write load. The operational trade-off is dead tuple accumulation: old row versions are never modified in place, so they accumulate as garbage until VACUUM reclaims them. If autovacuum cannot keep up — due to long-running transactions holding the MVCC horizon back, aggressive write rates, or misconfiguration — tables bloat and scans slow. In extreme cases, the 32-bit transaction ID counter can approach wraparound (~2 billion transactions), which PostgreSQL prevents by forcing emergency VACUUM and, if necessary, refusing new transactions.',
      fu: [
        'What is the visibility map and how does it allow index-only scans to skip heap fetches?',
        'How do you detect and respond to transaction ID wraparound risk in production?',
        'What is a HOT update and under what conditions does PostgreSQL use it to reduce write amplification?',
      ],
    },
  },

  {
    id: 'postgres-indexes',
    cat: 'postgres',
    color: '#336791',
    icon: '🗂️',
    title: 'PostgreSQL Index Types',
    tag: 'The right card catalogue for the right library',
    overview:
      'PostgreSQL ships with five built-in index types — B-tree, Hash, GiST, GIN, and BRIN — each optimized for a different access pattern and data shape. The default B-tree handles sorted scalar data and supports range queries; Hash is a pure equality structure tuned for UUIDs and long strings; GiST is an extensible framework covering geometry, ranges, and full-text; GIN excels at multi-valued attributes like JSONB and arrays where a single row contributes many index entries; and BRIN is a tiny metadata structure for physically ordered data like timestamps. Choosing the wrong index type means either missing queries entirely or paying unnecessary write amplification.',
    components: [
      {
        name: 'Index Page / B-tree Node',
        icon: '📄',
        role: 'Sorted on-disk page holding key-pointer pairs',
        detail:
          'B-tree pages (8 KB by default) hold sorted index entries pointing to heap tuple locations (ctid). Internal pages hold separator keys and child page pointers; leaf pages hold actual index key values and ctids. The tree is balanced — all leaves are at the same depth — guaranteeing O(log n) lookup regardless of data distribution. PostgreSQL B-trees are also support backward scans natively, enabling DESC ORDER BY without extra sorting.',
      },
      {
        name: 'Index Scan vs Bitmap Scan',
        icon: '🔦',
        role: 'Two strategies for translating index hits into heap row fetches',
        detail:
          'An Index Scan fetches one heap tuple per index entry in index order — excellent for small result sets but causes random I/O on large ones. A Bitmap Index Scan materialises a bitmap of matching heap pages in memory, then fetches pages in physical order (Bitmap Heap Scan), dramatically reducing random I/O. For very large result sets the planner chooses Seq Scan entirely. Bitmap scans also combine multiple indexes via BitmapAnd/BitmapOr.',
      },
      {
        name: 'Tuple Pointer (ctid)',
        icon: '📍',
        role: 'Physical location of a heap row referenced by the index',
        detail:
          'Every index entry stores a ctid — a (page_number, tuple_offset) pair. After an UPDATE, the old ctid becomes stale and the index entry must eventually be cleaned via VACUUM. For covering indexes (INCLUDE columns), the index leaf stores the extra column values alongside the ctid, allowing index-only scans when the visibility map indicates the page is clean.',
      },
      {
        name: 'Index Condition / Recheck',
        icon: '✅',
        role: 'Exact vs. lossy index matching requiring heap re-evaluation',
        detail:
          'Exact indexes (B-tree, Hash) guarantee every returned ctid satisfies the search condition. Lossy indexes (GiST in some operators, BRIN always) return candidate ctids that may not satisfy the condition — the engine must fetch the heap tuple and re-evaluate the WHERE clause. This recheck step adds CPU overhead but is still faster than a full sequential scan when selectivity is reasonable.',
      },
    ],
    howItWorks:
      'B-tree is PostgreSQL\'s default index, created by CREATE INDEX without specifying a type. It stores keys in sorted order across a balanced tree of 8 KB pages, supporting equality (=), comparison (<, <=, >, >=), BETWEEN, and LIKE \'prefix%\' queries in O(log n) time. B-trees also support multi-column indexes where the leftmost columns must appear in the query for the index to be used, and covering indexes where non-key columns added via INCLUDE allow index-only scans. Hash indexes use a hash function to map keys to bucket pages, making them faster than B-trees for pure equality on high-cardinality columns like UUIDs, and since PostgreSQL 10 they are WAL-safe and survive crash recovery.\n\nGiST (Generalized Search Tree) is a framework for user-defined index strategies. Built-in operator classes support 2D geometric types (&&, @>, ~), range types (&&, @>), and tsvector full-text search (@@). GiST is lossy for some operators, requiring a heap recheck. GIN (Generalized Inverted Index) inverts the relationship: instead of mapping a row to one index entry, it maps each element of a multi-valued attribute to the rows containing it. This makes GIN perfect for JSONB key lookup, tsvector/tsquery full-text search, and array containment (@>). GIN has fast read performance but slow inserts due to extensive index fan-out — the fastupdate setting buffers pending inserts to amortise write cost.\n\nBRIN (Block Range INdex) stores only the min/max values per block range (default 128 pages) rather than per-row entries, resulting in a tiny index (kilobytes for tables with millions of rows). It works correctly only when data is physically ordered — e.g., an event_time column inserted in roughly chronological order. Queries use BRIN to eliminate block ranges whose min/max cannot contain the search value; non-eliminated ranges are scanned in full, producing false positives that the engine rechecks. Partial indexes (CREATE INDEX ... WHERE condition) index only the matching subset of rows, shrinking index size and write cost. Expression indexes (CREATE INDEX ON t (lower(email))) pre-compute a function on the data, enabling index scans for WHERE lower(email) = ... queries.',
    decision: {
      choose: [
        'B-tree for any sorted scalar type with equality, range, prefix-LIKE, or ORDER BY queries — it is the correct default 90% of the time',
        'Hash for pure equality searches on UUID primary keys or long string columns where sorted order is irrelevant',
        'GIN for JSONB attribute lookup, full-text search (tsvector), or array containment on multi-valued columns',
        'GiST for geometric proximity/overlap queries, range type overlap/containment, or full-text search when you need ranking (ts_rank) on small datasets',
        'BRIN for append-only time-series tables (sensor readings, logs, events) with millions of rows where B-tree overhead is unacceptable',
        'Partial index when a query always filters on a low-cardinality condition (WHERE status = \'pending\') and you want a tiny, fast index only on that subset',
      ],
      avoid: [
        'Hash indexes for range queries — they support only equality and will never be used by the planner for <, >, or BETWEEN',
        'BRIN on tables with non-physical ordering (e.g., randomly updated rows) — min/max ranges will be wide and BRIN will return nearly every block as a candidate, performing worse than a sequential scan',
        'GIN on columns with low cardinality or small array sizes — GIN write amplification (one index entry per array element) is unnecessary when B-tree would serve the same query',
        'Multi-column B-tree indexes with the most selective column as the second key — the planner may not use the index at all because leading columns must appear in the query',
        'Indexing every column reflexively — unused indexes add write overhead (every INSERT/UPDATE/DELETE must update all indexes on the table) and bloat shared_buffers',
      ],
      vs: [
        {
          name: 'B-tree vs Hash for UUID equality',
          when: 'Hash is theoretically faster (O(1) vs O(log n)) for equality on UUID primary keys, but B-trees are already extremely fast on integer-sized keys and support range scans Hash cannot. Use Hash only when profiling proves B-tree lookup is a bottleneck, which is rare.',
        },
        {
          name: 'GIN vs GiST for full-text search',
          when: 'GIN is faster for lookup (inverted index gives direct posting list access) but slower for updates. GiST supports ranking operators more naturally. For large, frequently queried tsvector columns use GIN; for smaller or write-heavy datasets or when you need geometric operators alongside text, use GiST.',
        },
        {
          name: 'BRIN vs Partitioning for time-series',
          when: 'BRIN is simpler — add one index, no schema changes. Partitioning (range partitioning on time column) gives stronger partition pruning and allows dropping old partitions instantly. Use BRIN for moderate data volumes; use partitioning when you need sub-second partition pruning on billions of rows or must purge old data efficiently.',
        },
      ],
    },
    failures: [
      {
        name: 'Index Never Used by Planner',
        cause:
          'Common causes: implicit type cast between column and literal (WHERE user_id = \'123\' when user_id is integer), function applied to the indexed column in WHERE (WHERE lower(email) = ... without a lower() expression index), statistics out of date causing planner to underestimate selectivity, or leading column of multi-column index absent from query.',
        symptom:
          'EXPLAIN shows Seq Scan on a large table despite a matching index existing; query is slow; pg_stat_user_indexes shows idx_scan = 0 for the index after weeks of queries.',
        fix: 'Run EXPLAIN (ANALYZE, BUFFERS) to confirm planner choice; check for implicit casts with \\d table_name; run ANALYZE to refresh statistics; create an expression index if a function is applied; verify column order in multi-column indexes matches query predicates.',
        severity: 'high',
      },
      {
        name: 'GIN Write Amplification',
        cause:
          'GIN stores one index entry per element of the indexed array/JSONB/tsvector. A document with 1,000 words produces 1,000 GIN index entries per INSERT. High-volume inserts into GIN-indexed columns cause heavy index write traffic even if fastupdate is enabled.',
        symptom:
          'INSERT/UPDATE throughput drops significantly after adding a GIN index; pg_statio_user_indexes shows high idx_blks_write on the GIN index; autovacuum struggles to keep up with pending GIN list cleanup.',
        fix: 'Ensure gin_pending_list_limit is appropriate; batch inserts and trigger manual vacuum after; consider disabling fastupdate if consistency is more important than write throughput; evaluate whether GiST with a smaller document representation suffices.',
        severity: 'medium',
      },
      {
        name: 'BRIN False Positives on Disordered Data',
        cause:
          'BRIN stores min/max per block range. If rows are inserted in non-chronological order (e.g., backfills, bulk loads of old data, or updates that change the indexed column), the min/max ranges become wide and nearly every range overlaps any query range.',
        symptom:
          'EXPLAIN shows BRIN index being used but Rows Removed by Index Recheck is very high (close to total rows); actual query time is similar to or worse than Seq Scan.',
        fix: 'Run VACUUM to refresh BRIN summaries after data re-ordering; cluster the table on the BRIN column (CLUSTER table USING idx_brin) to restore physical ordering; switch to B-tree if data is fundamentally unordered.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'Five different library card catalogues for five different kinds of books',
      t: 'The B-tree catalogue keeps cards sorted alphabetically — great for finding one book or everything between "Aa" and "Az". The Hash catalogue jumps directly to a pigeonhole for exact title matches — no alphabet, just a direct slot. The GIN catalogue is inverted: every word in every book has a card listing which books contain it — perfect for "find all books mentioning \'concurrency\'". GiST catalogues handle spatial lookups: "find all books whose topic region overlaps \'databases\'". BRIN catalogues just record "shelf 1–128 has books from 1900–1950" — tiny, but only useful when books are shelved in chronological order.',
      tx: 'PostgreSQL offers five index types because no single data structure is optimal for every query shape. B-trees are the universal default: balanced, sorted, O(log n) for range and equality queries, LIKE prefix matching, and ORDER BY. Hash indexes collapse O(log n) to O(1) for pure equality at the cost of no range support — useful for UUID lookups. GiST provides an extensible framework plugged in by extension authors (PostGIS uses GiST for geometry); it is lossy for some operators, requiring heap rechecks. GIN inverts the index: for a JSONB column with keys {a, b, c}, GIN stores three index entries all pointing to the same row, making "find all rows containing key \'a\'" a single index lookup. BRIN is radical minimalism: instead of indexing every row, it records the minimum and maximum value for each block range, producing kilobyte-sized indexes for billion-row tables — but only works when data is physically ordered, like an append-only event log.',
      s: 'B-tree=sorted scalar; Hash=equality O(1); GiST=geometric/range; GIN=inverted multi-valued; BRIN=block-range metadata',
    },
    te: {
      def: 'PostgreSQL index types are specialized data structures that map search key values to heap tuple locations (ctids), each optimized for a different access pattern: B-tree for sorted scalar data, Hash for equality, GiST for extensible/geometric data, GIN for multi-valued inverted lookups, and BRIN for physically-ordered append-only data.',
      types: [
        {
          n: 'B-tree',
          d: 'Default. Balanced sorted tree, O(log n) for =, <, >, BETWEEN, LIKE prefix. Supports multi-column, partial, expression, and covering (INCLUDE) variants. 99% of indexes should be B-trees.',
        },
        {
          n: 'Hash',
          d: 'Hash table mapping key → bucket. O(1) equality only. WAL-safe from PG10+. Best for high-cardinality equality columns (UUID, long strings) where range queries never occur.',
        },
        {
          n: 'GiST (Generalized Search Tree)',
          d: 'Extensible balanced tree for user-defined index strategies. Built-in support for geometry (PostGIS), range types, and tsvector. Lossy — may require heap recheck.',
        },
        {
          n: 'GIN (Generalized Inverted Index)',
          d: 'Inverted index mapping each element of a multi-valued attribute to the set of rows containing it. Ideal for JSONB key lookup, tsvector full-text, array containment. Fast reads, slow writes.',
        },
        {
          n: 'BRIN (Block Range Index)',
          d: 'Stores only min/max per block range (default 128 pages). Tiny index size. Effective only for physically-ordered data (timestamps, sequential IDs). Always lossy — requires recheck.',
        },
      ],
      when: 'Choose index type based on query operator and data shape: equality on scalar → B-tree (or Hash for UUID); range/sort → B-tree; JSONB/array containment/full-text → GIN; geometric/range overlap → GiST; append-only time-series → BRIN. Always run EXPLAIN (ANALYZE, BUFFERS) to verify the planner uses your index.',
      trade:
        'B-tree: balanced write overhead (one entry per row), medium size, universally useful. Hash: lowest read cost for equality, no range support, crash recovery historically problematic (fixed PG10+). GIN: fastest reads for multi-valued lookups, highest write amplification (N entries per row where N = element count). GiST: moderate read/write, supports rich operator classes, requires operator class authors. BRIN: near-zero write overhead and storage, but useful only for ordered data and always requires heap recheck (lossy).',
      code: `-- B-tree: default sorted index
CREATE INDEX idx_users_email ON users (email);
-- Multi-column
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);
-- Partial: only index pending orders
CREATE INDEX idx_orders_pending ON orders (created_at) WHERE status = 'pending';
-- Covering: avoid heap fetch for common query
CREATE INDEX idx_users_email_covering ON users (email) INCLUDE (name, status);

-- Hash: equality-only, fast for UUIDs
CREATE INDEX idx_sessions_token_hash ON sessions USING hash (token);

-- GIN: JSONB key lookup and full-text search
CREATE INDEX idx_products_attrs ON products USING gin (attributes);
-- Query: SELECT * FROM products WHERE attributes @> '{"color":"red"}';
CREATE INDEX idx_articles_fts ON articles USING gin (to_tsvector('english', body));
-- Query: SELECT * FROM articles WHERE to_tsvector('english', body) @@ plainto_tsquery('concurrency');

-- GiST: range overlap
CREATE INDEX idx_reservations_period ON reservations USING gist (period);
-- Query: SELECT * FROM reservations WHERE period && '[2024-01-01,2024-01-07)'::daterange;

-- BRIN: append-only event log
CREATE INDEX idx_events_created_brin ON events USING brin (created_at) WITH (pages_per_range = 64);

-- Expression index: case-insensitive email lookup
CREATE INDEX idx_users_lower_email ON users (lower(email));
-- Query: SELECT * FROM users WHERE lower(email) = 'alice@example.com';

-- EXPLAIN to verify index usage
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT name, status FROM users WHERE email = 'alice@example.com';
-- Look for: "Index Only Scan" or "Index Scan" vs "Seq Scan"
-- Check: "Buffers: shared hit=N read=M" — low read count = index working

-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;`,
      rw: {
        ex: [
          'GitHub: GIN indexes on repository topics array allow instant "find all repos tagged \'machine-learning\'" queries across 100M+ repositories without sequential scans',
          'Cloudflare: BRIN indexes on DNS query log tables (billions of rows, append-only by timestamp) keep index size under 1 MB while enabling time-range pruning for analytics',
          'Stripe: partial B-tree index on payments WHERE status = \'pending\' keeps the working set small (< 1% of total rows) and charge processing queries fast without scanning completed historical payments',
          'PostGIS/Mapbox: GiST indexes on geometry columns enable "find all restaurants within 500m" queries using the && (overlaps bounding box) operator with sub-millisecond latency on millions of spatial features',
        ],
        cs: 'A SaaS application stores product catalog in PostgreSQL with a JSONB attributes column (color, size, brand, tags). Initially using a B-tree on id with sequential scans for attribute filters, query times hit 800ms on 10M rows. Adding CREATE INDEX ON products USING gin (attributes) dropped filter queries to 4ms. However, insert throughput fell from 12,000/s to 3,200/s due to GIN write amplification (each product has ~15 attributes → 15 GIN entries per insert). The team added gin_pending_list_limit = 8MB and fastupdate = on, batched inserts into 500-row chunks, and scheduled VACUUM after bulk loads, recovering throughput to 9,800/s while maintaining 4ms read latency.',
      },
    },
    interview: {
      q: 'When would you choose a GIN index over a B-tree index, and what write-side trade-offs does that choice carry?',
      a: 'GIN (Generalized Inverted Index) is the right choice when a single column contains multiple values that must each be individually searchable — JSONB keys, tsvector lexemes, or array elements. A B-tree maps one row to one index entry; GIN maps each element of a multi-valued column to the rows containing it, creating an inverted structure. This makes "find all rows where JSONB contains key X" a direct lookup rather than a full scan. The write-side cost is significant: an INSERT into a GIN-indexed column with N elements produces N index entries, not one. For a tsvector with 200 unique words, one document insert causes 200 GIN index writes. PostgreSQL mitigates this with the fastupdate option, which buffers pending GIN entries in a list and flushes them in bulk — trading write latency for throughput. You must size gin_pending_list_limit appropriately and ensure VACUUM runs frequently enough to flush the pending list before queries must scan it inline.',
      fu: [
        'How does the fastupdate option for GIN indexes work, and when would you disable it?',
        'What is a covering index (INCLUDE columns) and when does it enable an index-only scan?',
        'How does the PostgreSQL planner decide between an Index Scan, a Bitmap Index Scan, and a Sequential Scan?',
      ],
    },
  },

  {
    id: 'postgres-transactions',
    cat: 'postgres',
    color: '#336791',
    icon: '🔄',
    title: 'Transaction Isolation Levels',
    tag: "How much of other people's work-in-progress can you see?",
    overview:
      'SQL defines four transaction isolation levels — READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, and SERIALIZABLE — each controlling which concurrency anomalies are possible during a transaction. PostgreSQL implements these on top of MVCC, meaning it never does dirty reads regardless of the requested level. READ COMMITTED (the default) sees committed data at each statement start; REPEATABLE READ locks the snapshot at transaction start; SERIALIZABLE adds predicate locking for full serializability. Higher isolation prevents more anomalies but increases the chance of serialization failures that applications must detect and retry.',
    components: [
      {
        name: 'Transaction Snapshot',
        icon: '📸',
        role: 'Point-in-time view of committed data used by a transaction',
        detail:
          'A snapshot records the set of in-progress transaction IDs, the oldest active XID (xmin), and the next unassigned XID (xmax). In READ COMMITTED a new snapshot is taken at each statement. In REPEATABLE READ and SERIALIZABLE the snapshot is fixed at the first statement of the transaction. All visibility checks compare a tuple\'s xmin/xmax against the current snapshot.',
      },
      {
        name: 'Lock Manager',
        icon: '🔒',
        role: 'Manages row, page, table, and predicate locks',
        detail:
          'PostgreSQL\'s lock manager tracks shared and exclusive locks in shared memory. For most MVCC reads no lock is acquired. DML acquires row-level locks (stored in the heap tuple\'s infomask). Table-level locks are tracked in pg_locks. Under SERIALIZABLE, predicate locks (siread locks) are additionally acquired to detect read/write dependencies between transactions.',
      },
      {
        name: 'Predicate Lock (SSI)',
        icon: '🕸️',
        role: 'Tracks read sets for serializable anomaly detection',
        detail:
          'Serializable Snapshot Isolation (SSI) detects dangerous read/write dependency cycles rather than preventing them. When a transaction reads a range of rows, a predicate lock (SIReadLock) is recorded. If another transaction inserts into that range, the engine checks whether a read/write/write cycle exists in the dependency graph. If detected, the later transaction is aborted with SQLSTATE 40001 (serialization failure).',
      },
      {
        name: 'Retry Handler',
        icon: '🔁',
        role: 'Application logic to retry serialization failures',
        detail:
          'SERIALIZABLE transactions that abort due to detected anomalies return SQLSTATE 40001 or 40P01 (deadlock). Applications must catch these error codes and retry the entire transaction from scratch — not just the failed statement. Well-written retry loops use exponential backoff with jitter to avoid thundering herd on contended serializable workloads.',
      },
    ],
    howItWorks:
      'READ UNCOMMITTED in PostgreSQL is silently upgraded to READ COMMITTED because MVCC makes dirty reads impossible by construction — unclean data is simply not written to the heap; it exists only in the writing transaction\'s private work area. READ COMMITTED (the default) takes a fresh snapshot at each statement start: if another transaction commits between two statements in the same transaction, the second statement will see the new data. This enables non-repeatable reads (the same SELECT returns different rows in the same transaction) and is the source of the classic double-spend bug in financial applications.\n\nREPEATABLE READ fixes the snapshot at the first statement of the transaction. All reads see the same committed state regardless of concurrent commits. In standard SQL, phantom reads (new rows inserted by other transactions that match a WHERE clause) are possible even at REPEATABLE READ, but PostgreSQL\'s SSI-based implementation prevents phantoms as well, making PostgreSQL\'s REPEATABLE READ stronger than the SQL standard requires. Write skew (two transactions read overlapping data and each writes based on what it read, producing an inconsistent outcome) is still possible under REPEATABLE READ.\n\nSERIALIZABLE adds predicate locking to MVCC. The engine tracks which row ranges each transaction has read (SIReadLocks) and which rows each has written. It continuously checks whether the read/write dependencies form a dangerous cycle (an rw-antidependency cycle) that would cause the concurrent execution to produce a result impossible under any serial order. When such a cycle is detected, one transaction (the "pivot") is aborted with SQLSTATE 40001. Applications must retry these transactions — the retry will succeed because the conflicting transaction has now committed and the snapshot will reflect its changes.',
    decision: {
      choose: [
        'READ COMMITTED for standard web application OLTP — it is the default and correct for most transactional workloads where you want to see the latest committed data on each query',
        'REPEATABLE READ for long-running reports or ETL jobs that must see a consistent snapshot across multiple statements without locking the table',
        'SERIALIZABLE for financial transactions, inventory reservations, or any operation where two transactions reading overlapping data and each writing based on what they read must not produce inconsistent results (write skew)',
        'SERIALIZABLE with retry loops for optimistic concurrency patterns where conflicts are rare and retrying is cheap',
      ],
      avoid: [
        'READ COMMITTED for financial "check-then-act" operations (read balance, check >= amount, deduct) — concurrent transactions can both pass the check on the old balance and both deduct, causing overdraft (the classic double-spend bug)',
        'SERIALIZABLE on high-contention workloads with many concurrent writes to overlapping data — serialization failures increase rapidly with contention, causing cascade retries and throughput collapse',
        'REPEATABLE READ when you need to see data committed by other transactions mid-transaction — the fixed snapshot will not reflect those commits until you commit and start a new transaction',
        'Assuming PostgreSQL\'s REPEATABLE READ prevents write skew — it prevents phantoms but write skew requires SERIALIZABLE',
      ],
      vs: [
        {
          name: 'REPEATABLE READ vs SERIALIZABLE',
          when: 'Use REPEATABLE READ when you need a stable snapshot for reads across multiple statements but are not performing check-then-write patterns that could produce write skew. Use SERIALIZABLE when two concurrent transactions reading and writing overlapping data must produce a result achievable by some serial execution — the classic example is two doctors both reading "on-call count >= 2" and both writing "set myself off-call", leaving zero doctors on call.',
        },
        {
          name: 'SERIALIZABLE SSI vs SELECT FOR UPDATE (pessimistic)',
          when: 'SELECT FOR UPDATE acquires explicit row locks at read time, preventing concurrent writes but blocking other readers. SERIALIZABLE (SSI) is optimistic — no locks acquired during reads, but transactions may abort at commit. Use SELECT FOR UPDATE when you know the specific rows you need to protect and want guaranteed forward progress. Use SERIALIZABLE when the read set is not known in advance or when lock acquisition order would be complex.',
        },
      ],
    },
    failures: [
      {
        name: 'READ COMMITTED Double-Spend Bug',
        cause:
          'Two concurrent transactions both read a balance at READ COMMITTED, both find it sufficient, and both deduct — the second deduction races the first\'s commit, leaving the account overdrawn.',
        symptom:
          'Account balance drops below zero despite application-level checks; financial discrepancies appear in ledger audits; the bug is intermittent and difficult to reproduce under low concurrency.',
        fix: 'Use SELECT ... FOR UPDATE to lock the row before the balance check; or switch to SERIALIZABLE isolation for financial transactions; or use optimistic locking with a version column (UPDATE ... WHERE version = $old_version) and retry on 0 rows affected.',
        severity: 'critical',
      },
      {
        name: 'SERIALIZABLE Cascade Aborts Under Contention',
        cause:
          'High-concurrency workload where many transactions read and write overlapping rows triggers frequent SSI cycle detection, aborting transactions that then retry and conflict again, collapsing throughput.',
        symptom:
          'High rate of SQLSTATE 40001 errors in application logs; transaction retry count increases; throughput drops by 50–90% compared to READ COMMITTED under the same load.',
        fix: 'Reduce transaction scope (shorter transactions reduce the window for conflicts); restructure queries to touch non-overlapping data; consider SELECT FOR UPDATE on specific rows instead of full SERIALIZABLE; use a queue-based pattern where a single writer serializes operations on contended resources.',
        severity: 'high',
      },
      {
        name: 'Forgetting to Retry Serialization Errors',
        cause:
          'Application catches database exceptions generically (or not at all) and surfaces a 500 error to the user instead of retrying SQLSTATE 40001 (serialization failure) or 40P01 (deadlock detected).',
        symptom:
          'Users see intermittent errors on operations that should always succeed; error logs show ERROR: could not serialize access due to concurrent update or ERROR: deadlock detected; no retry logic in application code.',
        fix: 'Wrap SERIALIZABLE transaction logic in a retry loop that specifically catches SQLSTATE 40001 and 40P01, backs off with jitter, and retries up to N times (typically 3–5); log final failures as alerts for investigation.',
        severity: 'high',
      },
    ],
    a: {
      v: 'Looking at a shared whiteboard through filters of varying opacity',
      t: 'READ COMMITTED: you see every confirmed change the moment someone finishes writing it, even mid-conversation. REPEATABLE READ: you photograph the whiteboard when you sit down — everyone else can keep writing, but you only see your photo. SERIALIZABLE: the room enforces that everything you read and write must look as if only one person used the whiteboard at a time; if the timeline cannot be reconciled that way, you are asked to start over.',
      tx: 'Isolation levels define how much concurrent work-in-progress a transaction is allowed to observe. PostgreSQL\'s MVCC eliminates dirty reads at every level — you never see uncommitted data. READ COMMITTED gives you the freshest view of committed data at each SQL statement, which is intuitive but allows non-repeatable reads (the same row can return different values in two SELECTs within one transaction). REPEATABLE READ takes a snapshot at your transaction\'s first statement and holds it for the whole transaction, making reads stable but potentially missing later commits. SERIALIZABLE adds predicate lock tracking to detect when the combined read/write pattern of concurrent transactions could not have been produced by any sequential execution, aborting one participant in such a cycle. The higher the isolation level, the fewer anomalies are possible, but the more frequently transactions must be retried on serialization failures.',
      s: 'RC=fresh-per-statement; RR=fixed-snapshot; SER=SSI with abort-and-retry',
    },
    te: {
      def: 'Transaction isolation levels define the visibility rules a transaction uses to read data written by concurrent transactions, trading between concurrency anomalies (dirty read, non-repeatable read, phantom read, write skew) and the risk of serialization failures that require application-level retry.',
      types: [
        {
          n: 'Dirty Read',
          d: 'Reading uncommitted data from another transaction. Impossible in PostgreSQL at any isolation level due to MVCC — READ UNCOMMITTED is silently upgraded to READ COMMITTED.',
        },
        {
          n: 'Non-Repeatable Read',
          d: 'Two reads of the same row within one transaction return different values because another transaction committed between them. Possible at READ COMMITTED; prevented at REPEATABLE READ and SERIALIZABLE.',
        },
        {
          n: 'Phantom Read',
          d: 'A range query returns different sets of rows in two executions within one transaction because another transaction inserted/deleted rows in the range. Standard SQL allows this at REPEATABLE READ, but PostgreSQL prevents it via SSI even at REPEATABLE READ.',
        },
        {
          n: 'Write Skew',
          d: 'Two transactions each read overlapping data, make decisions based on what they read, and write non-overlapping rows — producing a result inconsistent with any serial execution. Classic example: two on-call doctors both see "count >= 2" and both set themselves off-call, leaving zero on-call. Only SERIALIZABLE prevents this.',
        },
        {
          n: 'Lost Update',
          d: 'Two transactions read the same value, both compute an update, and the second write overwrites the first\'s result. Prevented by SELECT FOR UPDATE (pessimistic) or by SERIALIZABLE (SSI detects the rw-antidependency cycle).',
        },
      ],
      when: 'Use READ COMMITTED (default) for standard web OLTP. Upgrade to REPEATABLE READ for multi-statement reporting transactions that must see a consistent snapshot. Upgrade to SERIALIZABLE for financial check-then-act operations, inventory reservations, or any pattern where two concurrent transactions reading and writing overlapping data could produce an impossible result.',
      trade:
        'READ COMMITTED: maximum concurrency, no retries, but susceptible to non-repeatable reads and write skew. REPEATABLE READ: stable reads, still susceptible to write skew, no retries for reads (but will abort on conflicting updates). SERIALIZABLE: full correctness, no anomalies, but adds CPU overhead for predicate lock tracking and requires application retry logic for SQLSTATE 40001; throughput degrades under high contention.',
      code: `-- Set isolation level for a transaction
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED; -- default
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Non-repeatable read demo (READ COMMITTED)
-- Session 1:
BEGIN; -- READ COMMITTED
SELECT balance FROM accounts WHERE id = 1; -- returns 1000

-- Session 2 (concurrent):
BEGIN;
UPDATE accounts SET balance = 500 WHERE id = 1;
COMMIT;

-- Session 1 (same transaction, second read):
SELECT balance FROM accounts WHERE id = 1; -- returns 500 (non-repeatable!)
COMMIT;

-- Write skew: on-call doctors (needs SERIALIZABLE to prevent)
-- Session 1:
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT count(*) FROM on_call WHERE shift_id = 1; -- returns 2
UPDATE on_call SET active = false WHERE doctor_id = 101 AND shift_id = 1;

-- Session 2 (concurrent SERIALIZABLE):
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT count(*) FROM on_call WHERE shift_id = 1; -- returns 2 (same snapshot)
UPDATE on_call SET active = false WHERE doctor_id = 102 AND shift_id = 1;

-- Session 2 COMMITs fine.
-- Session 1 COMMIT → ERROR: could not serialize access due to concurrent update

-- Retry loop pattern (application-level pseudocode in PL/pgSQL):
DO $$
DECLARE
  attempts INT := 0;
BEGIN
  LOOP
    attempts := attempts + 1;
    BEGIN
      -- Your serializable transaction body here
      BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
      -- ... reads and writes ...
      COMMIT;
      EXIT; -- success
    EXCEPTION
      WHEN serialization_failure OR deadlock_detected THEN
        IF attempts >= 5 THEN RAISE; END IF;
        PERFORM pg_sleep(0.05 * attempts); -- simple backoff
    END;
  END LOOP;
END;
$$;`,
      rw: {
        ex: [
          'Banking systems: SERIALIZABLE isolation for transfer operations prevents two concurrent withdrawals from the same account both seeing sufficient balance and both succeeding, causing overdraft',
          'Airline seat reservation: REPEATABLE READ for seat browsing (stable view of available seats during search) + SERIALIZABLE for the actual booking transaction (prevents two customers booking the same seat)',
          'Inventory management: SERIALIZABLE prevents two flash-sale purchase transactions both reading stock_count = 1, both decrementing, and leaving stock_count = -1',
          'GitLab merge request counter: READ COMMITTED for displaying merge request lists (always show latest counts); SERIALIZABLE for the unique merge request number assignment to prevent duplicates',
        ],
        cs: 'A healthcare scheduling system had a bug: two clinic staff could simultaneously mark the last available appointment slot as booked, resulting in double-bookings. The application used READ COMMITTED and checked slot.status = \'available\' before updating — but both transactions passed the check concurrently before either committed. Switching the booking transaction to SERIALIZABLE isolation eliminated the bug: SSI detected the rw-antidependency cycle and aborted one transaction with SQLSTATE 40001. The team added a retry loop (up to 3 attempts with 50ms backoff) and deployed. Double-bookings dropped to zero. Serialization failures occur for roughly 0.3% of bookings during peak hours (11am–1pm), all successfully retried within one attempt.',
      },
    },
    interview: {
      q: 'What is write skew, and which PostgreSQL isolation level prevents it?',
      a: 'Write skew is an anomaly where two concurrent transactions each read overlapping data, make decisions based on what they read, and write to non-overlapping rows — producing a combined result that is inconsistent with any serial execution of the two transactions. The canonical example is two on-call doctors: both read "on-call count = 2" (safe to leave), and both update their own row to "off-call". Neither write conflicts with the other at the row level, so both transactions commit successfully under READ COMMITTED and REPEATABLE READ — leaving zero doctors on call, a result that could not have occurred if the transactions ran one after the other. Only SERIALIZABLE isolation prevents write skew in PostgreSQL. It does so via Serializable Snapshot Isolation (SSI), which tracks predicate locks (SIReadLocks) on the ranges each transaction has read, detects rw-antidependency cycles in the read/write dependency graph, and aborts one participant with SQLSTATE 40001 (serialization_failure). Applications must catch this error and retry the transaction.',
      fu: [
        'How does PostgreSQL\'s REPEATABLE READ prevent phantom reads even though the SQL standard says it should not?',
        'What is the performance overhead of SERIALIZABLE isolation compared to READ COMMITTED, and how does it scale with contention?',
        'How would you implement an optimistic concurrency control pattern at the application level without using database SERIALIZABLE isolation?',
      ],
    },
  },

  {
    id: 'postgres-row-locking',
    cat: 'postgres',
    color: '#336791',
    icon: '🔒',
    title: 'Row-Level Locking',
    tag: "Lock exactly what you're editing — not the whole warehouse",
    overview:
      'PostgreSQL\'s row-level locking allows transactions to exclusively or cooperatively hold locks on individual heap tuples, preventing concurrent modifications without blocking unrelated rows. Four lock strengths — FOR KEY SHARE, FOR SHARE, FOR NO KEY UPDATE, and FOR UPDATE — form a compatibility matrix that trades lock exclusivity for concurrency. SKIP LOCKED enables efficient job queue patterns by atomically skipping already-locked rows. Advisory locks extend the mechanism beyond rows to arbitrary application-defined resources identified by integer keys.',
    components: [
      {
        name: 'Row Lock Manager',
        icon: '🔒',
        role: 'Records in-progress row locks in heap tuple infomask bits',
        detail:
          'PostgreSQL does not maintain a separate row lock table for DML. Instead, it records the locking transaction\'s XID in the heap tuple\'s infomask bits and, for multi-transaction locks, in the MultiXactId system. A would-be locker checks the infomask; if the tuple is locked by an active transaction, it waits. On commit/rollback the lock is released implicitly — no explicit UNLOCK is needed.',
      },
      {
        name: 'Lock Compatibility Matrix',
        icon: '📊',
        role: 'Defines which lock modes conflict with each other',
        detail:
          'FOR KEY SHARE conflicts only with FOR UPDATE (exclusive key-changing lock). FOR SHARE conflicts with FOR NO KEY UPDATE and FOR UPDATE. FOR NO KEY UPDATE conflicts with FOR SHARE, FOR NO KEY UPDATE, and FOR UPDATE. FOR UPDATE conflicts with all other row lock modes. This matrix allows foreign key checks (FOR KEY SHARE) to proceed while a non-key UPDATE runs, enabling high-concurrency FK validation.',
      },
      {
        name: 'SKIP LOCKED Scanner',
        icon: '⏭️',
        role: 'Advances past locked rows atomically instead of waiting',
        detail:
          'When SELECT ... FOR UPDATE SKIP LOCKED encounters a tuple locked by another transaction, instead of blocking it records the tuple as skipped and advances to the next candidate. The result set contains only rows the current transaction successfully locked. This is the foundation of multi-worker job queues: each worker atomically claims a batch of unlocked tasks without blocking or contending with siblings.',
      },
      {
        name: 'Advisory Lock Registry',
        icon: '📋',
        role: 'Application-defined locks on arbitrary integer keys stored in shared memory',
        detail:
          'Advisory locks are stored in shared memory (not heap tuples) and identified by a 64-bit integer or two 32-bit integers. Session-scoped advisory locks (pg_advisory_lock) persist until explicitly released or the session ends. Transaction-scoped advisory locks (pg_advisory_xact_lock) are released automatically at transaction end. pg_try_advisory_lock returns false immediately if the lock is unavailable, enabling non-blocking lock acquisition for distributed coordination patterns.',
      },
    ],
    howItWorks:
      'Row-level locks in PostgreSQL are acquired by SELECT ... FOR [mode] statements or implicitly by DML (UPDATE, DELETE acquire FOR NO KEY UPDATE on the rows they modify). Four modes exist in increasing strength: FOR KEY SHARE is the weakest, used by FK constraint checks — it blocks only FOR UPDATE; FOR SHARE blocks writers (FOR NO KEY UPDATE and FOR UPDATE) but allows concurrent readers to also take FOR SHARE; FOR NO KEY UPDATE blocks other writers and FOR SHARE but allows FK checks (FOR KEY SHARE); FOR UPDATE is exclusive and blocks all other row lock modes. All modes block each other when the same row is targeted by two conflicting lock modes — the later transaction waits until the lock is released at the earlier transaction\'s COMMIT or ROLLBACK.\n\nSKIP LOCKED transforms the job queue problem. Without it, multiple workers competing for the first pending job all block on the same row — the first worker processes it while the others wait, then the next row serializes them again. With SELECT ... FOR UPDATE SKIP LOCKED, each worker atomically claims only unlocked rows, processes them in parallel, and never blocks siblings. NOWAIT is a complementary option: instead of waiting indefinitely for a locked row, it raises ERROR: could not obtain lock on row in relation "..." immediately, allowing the application to fail fast and route work elsewhere.\n\nAdvisory locks are application-level mutexes stored in PostgreSQL\'s shared memory rather than tied to any table row. They are identified by integer keys that applications map to semantic resources (e.g., lock key = hash(\'process_monthly_report_2024_01\')). pg_advisory_lock blocks until the lock is available; pg_try_advisory_lock returns a boolean immediately. Session-scoped advisory locks must be explicitly released with pg_advisory_unlock or they persist until the connection closes — a leak risk. Transaction-scoped variants (pg_advisory_xact_lock) are automatically released at transaction end and are generally preferred.',
    decision: {
      choose: [
        'FOR UPDATE for pessimistic locking when you must read a row and then update it in the same transaction without risk of concurrent modification (banking transfers, inventory decrement)',
        'FOR UPDATE SKIP LOCKED for multi-worker job queues where workers should independently process non-overlapping rows without blocking each other',
        'FOR SHARE when you need to hold a row stable for reading while allowing other transactions to also read-lock it but not modify it',
        'FOR NO KEY UPDATE when updating non-key columns and you want to allow concurrent FK checks (FOR KEY SHARE) to proceed without blocking',
        'Advisory locks for distributed process coordination — leader election, cron-job deduplication, or preventing duplicate background jobs — when there is no natural database row to lock',
        'NOWAIT in high-priority request paths where blocking is unacceptable and failing fast + routing to another resource is preferable to waiting',
      ],
      avoid: [
        'Holding row locks across network calls or user-think-time — a transaction with an open FOR UPDATE lock that waits for a slow HTTP response blocks all other writers on that row, potentially for seconds or minutes',
        'Locking rows in an order that varies between transactions — inconsistent lock ordering is the primary cause of deadlocks',
        'Using session-scoped advisory locks without careful release logic — a crashed or disconnected session can leak advisory locks that block other processes until the connection is cleaned up',
        'FOR UPDATE on very wide queries expecting large result sets — locking thousands of rows simultaneously creates contention hotspots and is usually better replaced by batch processing with SKIP LOCKED',
      ],
      vs: [
        {
          name: 'FOR UPDATE vs SERIALIZABLE isolation',
          when: 'FOR UPDATE gives explicit, targeted row locks that guarantee the row will not be modified before your UPDATE — ideal when you know exactly which rows to protect. SERIALIZABLE uses optimistic SSI without upfront locks but may abort and require retry. Use FOR UPDATE when the locked row set is small and known; use SERIALIZABLE when the read set is dynamic or unknown.',
        },
        {
          name: 'SKIP LOCKED vs message queues (Redis, RabbitMQ)',
          when: 'SKIP LOCKED on a PostgreSQL jobs table gives you transactional job processing — a job is not considered dequeued until your transaction commits, giving you exactly-once semantics with rollback safety. External message queues offer higher throughput and pub/sub patterns but add infrastructure complexity. Use SKIP LOCKED for moderate queue volumes (< 100k jobs/day) and when transactional guarantees matter; use a dedicated queue for high throughput or fan-out to many consumers.',
        },
      ],
    },
    failures: [
      {
        name: 'Lock Wait Timeout Causing Cascading Failures',
        cause:
          'A transaction holds a row lock for longer than expected (due to slow downstream API call, long computation, or forgotten idle-in-transaction state), causing other transactions waiting on the same row to time out via lock_timeout, returning errors to users.',
        symptom:
          'ERROR: canceling statement due to lock timeout appearing in logs; cascading HTTP 500s to clients; pg_locks shows many waiting processes on a single relation; pg_stat_activity shows a long-running transaction in idle in transaction state.',
        fix: 'Set lock_timeout = \'2s\' at session level for interactive queries; set idle_in_transaction_session_timeout = \'30s\' globally to kill stale transactions; restructure transactions to acquire locks only when necessary and release them quickly; never hold locks across network calls.',
        severity: 'high',
      },
      {
        name: 'Row Locks Held Across Network Calls',
        cause:
          'Application code runs BEGIN, acquires a FOR UPDATE lock, then makes an external HTTP API call (payment gateway, third-party service) while holding the transaction open, blocking all other writers on the locked row for the duration of the network call.',
        symptom:
          'Cascading slowdowns under any load spike; pg_stat_activity shows transactions in idle in transaction state with very old xact_start; lock waits accumulate on the affected table; throughput drops and latency spikes.',
        fix: 'Never make network calls inside a database transaction. Complete the transaction to commit state changes, then make the external call; use compensating transactions or outbox patterns if the external call fails after the DB commit.',
        severity: 'critical',
      },
      {
        name: 'Advisory Lock Leaked After Session Crash',
        cause:
          'A worker process acquires a session-scoped advisory lock (pg_advisory_lock) and then crashes or is killed without calling pg_advisory_unlock. The advisory lock persists in shared memory associated with the now-dead connection until PostgreSQL cleans up the connection.',
        symptom:
          'Background jobs stop running after a worker crash; SELECT * FROM pg_locks WHERE locktype = \'advisory\' shows a lock held by a pid that no longer exists; manual intervention required to release.',
        fix: 'Prefer transaction-scoped advisory locks (pg_advisory_xact_lock) which are automatically released at transaction end; or wrap session advisory locks in a cleanup handler that calls pg_advisory_unlock in all exit paths including crash handlers; monitor pg_locks for stale advisory locks.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'Coat-check tickets for warehouse shelves',
      t: 'FOR UPDATE is like putting a "DO NOT TOUCH" sign on exactly the shelf you\'re working on — no one else can move anything on that shelf, but all other shelves are free. SKIP LOCKED is like a worker who skips any shelf with a sign already on it and goes straight to the next free one. Advisory locks are sticky notes you make up yourself — you agree with your team that whoever holds the "monthly_report" note has exclusive access to the report server, even though the database has no row for it.',
      tx: 'Row-level locking in PostgreSQL lets transactions claim ownership of exactly the rows they intend to modify, leaving all other rows completely free. The four lock modes form a compatibility ladder: FOR KEY SHARE is the lightest (only FK checkers and FOR UPDATE conflict), useful for foreign key validation running alongside heavy writes. FOR UPDATE is the heaviest — exclusive write lock that blocks all other row-level lock modes. SKIP LOCKED transforms contended job queues from serialized to parallel: each worker skips locked rows and atomically claims only those it can own, enabling true parallel task processing. Advisory locks extend the mechanism to any integer-keyed resource the application defines — useful for distributed cron deduplication or leader election where there is no natural database row to lock.',
      s: 'Targeted row locks with four strength levels + skip-locked queue pattern + advisory mutex',
    },
    te: {
      def: 'Row-level locking in PostgreSQL allows transactions to acquire explicit locks on individual heap tuples at four strength levels (FOR KEY SHARE, FOR SHARE, FOR NO KEY UPDATE, FOR UPDATE), enabling pessimistic concurrency control on specific rows without blocking unrelated rows, with SKIP LOCKED enabling non-blocking job queue consumption and advisory locks enabling application-defined resource mutexes.',
      types: [
        {
          n: 'FOR KEY SHARE',
          d: 'Weakest row lock. Acquired by FK constraint checks. Conflicts only with FOR UPDATE. Allows all other concurrent row lock modes including FOR NO KEY UPDATE, enabling high-concurrency FK validation alongside heavy writes.',
        },
        {
          n: 'FOR SHARE',
          d: 'Shared read lock. Multiple transactions can hold FOR SHARE simultaneously. Conflicts with FOR NO KEY UPDATE and FOR UPDATE. Use when you need to hold rows stable for reading while allowing other shared readers.',
        },
        {
          n: 'FOR NO KEY UPDATE',
          d: 'Exclusive write lock that does not lock key columns. Conflicts with FOR SHARE, FOR NO KEY UPDATE, and FOR UPDATE but allows FK checks (FOR KEY SHARE). Acquired implicitly by UPDATE on non-key columns.',
        },
        {
          n: 'FOR UPDATE',
          d: 'Strongest row lock. Exclusive. Conflicts with all other row lock modes. Required for "read-then-write" patterns (check balance, deduct amount) to prevent concurrent modifications between the read and the write.',
        },
        {
          n: 'SKIP LOCKED / NOWAIT',
          d: 'Modifiers for SELECT FOR [mode]. SKIP LOCKED atomically skips rows already locked by other transactions (job queue pattern). NOWAIT immediately raises an error if any row is locked rather than waiting. Cannot be combined with each other.',
        },
      ],
      when: 'Use FOR UPDATE in pessimistic check-then-write transactions. Use SKIP LOCKED for job/task queue workers. Use advisory locks for application-level distributed mutex (cron deduplication, leader election). Set lock_timeout on all sessions to bound wait time. Always acquire locks in consistent order across transactions to prevent deadlocks.',
      trade:
        'Correctness: row locks guarantee no concurrent modification of locked rows. Concurrency: locks reduce throughput — every waiter on a locked row is serialized. Deadlock risk: increases with number of rows locked per transaction and inconsistent lock ordering. Overhead: row locks stored in tuple infomask — low overhead for small lock sets; MultiXact IDs needed when multiple transactions lock the same row simultaneously (additional shared memory usage).',
      code: `-- FOR UPDATE: pessimistic lock for bank transfer
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE; -- acquires exclusive row lock
-- No other transaction can now modify accounts WHERE id = 1
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- lock released

-- SKIP LOCKED: job queue worker pattern
BEGIN;
SELECT id, payload
FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 10
FOR UPDATE SKIP LOCKED; -- claims up to 10 unlocked pending jobs
-- process jobs ...
UPDATE jobs SET status = 'done' WHERE id = ANY($processed_ids);
COMMIT;

-- NOWAIT: fail fast rather than wait
BEGIN;
SELECT * FROM inventory WHERE product_id = 42 FOR UPDATE NOWAIT;
-- Raises: ERROR: could not obtain lock on row in relation "inventory"
-- Application catches this and routes to fallback immediately
COMMIT;

-- Advisory lock: distributed cron deduplication
-- Only one process should run the monthly report at a time
SELECT pg_try_advisory_lock(hashtext('monthly_report_job'));
-- Returns true if lock acquired, false if another process holds it
-- ... run report ...
SELECT pg_advisory_unlock(hashtext('monthly_report_job'));

-- Transaction-scoped advisory lock (auto-released at COMMIT/ROLLBACK)
BEGIN;
SELECT pg_advisory_xact_lock(12345);
-- ... do work ...
COMMIT; -- advisory lock automatically released

-- Inspect current row locks
SELECT pid, relation::regclass, mode, granted, waitstart
FROM pg_locks
WHERE locktype = 'relation' OR locktype = 'tuple'
ORDER BY granted, waitstart;`,
      rw: {
        ex: [
          'Stripe: FOR UPDATE locks on charge rows during idempotency key processing ensure that two simultaneous API calls with the same idempotency key cannot both create a duplicate charge',
          'Shopify: SELECT FOR UPDATE SKIP LOCKED powers the order fulfillment queue — warehouse workers each claim independent batches of orders without stepping on each other',
          'GitHub: advisory locks prevent two GitHub Actions runners from simultaneously triggering the same repository\'s webhook delivery, deduplicating delivery at the database level',
          'Uber: FOR UPDATE on driver location rows during surge pricing calculations ensures the pricing transaction reads a stable driver count that cannot be concurrently modified mid-calculation',
        ],
        cs: 'An e-commerce platform had a flash sale: 10,000 customers simultaneously tried to buy the last 500 units of a product. The original code read stock_count, checked > 0, then decremented — all at READ COMMITTED. This caused overselling: thousands of concurrent transactions all read stock_count = 1, all passed the check, all decremented, leaving stock_count = -4,500. The fix: SELECT stock_count FROM products WHERE id = $1 FOR UPDATE inside a transaction. This serialized all concurrent purchase attempts — each worker atomically claimed one unit. Throughput dropped from 5,000 concurrent transactions to ~200/s through the locked row, but correctness was guaranteed and the 500 units sold without overselling. The team subsequently moved to a Redis atomic DECR for the hot counter and used the database FOR UPDATE pattern only for the final inventory commit, restoring throughput while maintaining correctness.',
      },
    },
    interview: {
      q: 'How does SELECT FOR UPDATE SKIP LOCKED enable a scalable job queue in PostgreSQL, and what are its limitations?',
      a: 'SKIP LOCKED allows a SELECT ... FOR UPDATE to atomically skip any row already locked by another transaction rather than blocking and waiting for it. In a job queue — a table with a status column and a claimed_by column — multiple worker processes can each run SELECT id, payload FROM jobs WHERE status = \'pending\' ORDER BY priority LIMIT 10 FOR UPDATE SKIP LOCKED simultaneously. Each worker claims a disjoint set of 10 rows without contending with siblings, processes them independently, and commits the status update. The key guarantee is transactional: if a worker crashes after claiming rows but before committing, the FOR UPDATE lock is released when the transaction rolls back and the rows are available for other workers to claim — you get exactly-once processing within the database without a separate ack/nack protocol. Limitations: throughput is bounded by PostgreSQL\'s row lock scalability (practical ceiling ~10,000–50,000 job claims/second on good hardware); the ORDER BY interacts poorly with SKIP LOCKED at high concurrency (the planner may reorder evaluation); and large tables with many pending rows can suffer index bloat if old completed rows are not purged regularly.',
      fu: [
        'What is the difference between session-scoped and transaction-scoped advisory locks, and when is each appropriate?',
        'How does the lock compatibility matrix between FOR KEY SHARE and FOR NO KEY UPDATE enable high-concurrency foreign key validation?',
        'What happens to row locks when a transaction rolls back, and how does PostgreSQL communicate lock release to waiting transactions?',
      ],
    },
  },

  {
    id: 'postgres-deadlocks',
    cat: 'postgres',
    color: '#336791',
    icon: '💀',
    title: 'Deadlocks & Table-Level Locking',
    tag: "Two diners each holding the other's fork — forever",
    overview:
      'A deadlock occurs when two or more transactions each hold a lock that the other needs, forming a cycle in the wait graph from which no transaction can proceed without external intervention. PostgreSQL detects deadlock cycles every deadlock_timeout milliseconds (default 1 second), selects a victim transaction to abort, and allows the others to proceed. Table-level lock modes — eight modes ranging from ACCESS SHARE (SELECT) to ACCESS EXCLUSIVE (ALTER TABLE) — form a conflict matrix that governs which DDL and DML operations can proceed concurrently; the most dangerous is ACCESS EXCLUSIVE, which blocks every other operation including reads.',
    components: [
      {
        name: 'Lock Wait Graph',
        icon: '🕸️',
        role: 'Directed graph of transactions waiting on each other\'s locks',
        detail:
          'Every time a transaction attempts to acquire a lock held by another, an edge is added to the wait graph: T_waiter → T_holder. A deadlock exists when there is a cycle in this graph. PostgreSQL\'s deadlock detector, invoked after deadlock_timeout elapses, traverses the wait graph to find cycles. The wait graph is maintained in shared memory and can be inspected via pg_locks joined with pg_stat_activity.',
      },
      {
        name: 'Deadlock Detector',
        icon: '🔍',
        role: 'Periodic cycle detection in the lock wait graph',
        detail:
          'When a process has been waiting for a lock for deadlock_timeout (default 1000ms), PostgreSQL runs the deadlock detector. It performs a depth-first search of the wait graph. If a cycle is found, one transaction (the "victim") is chosen for abort — typically the one that has done the least work. The victim receives ERROR: deadlock detected (SQLSTATE 40P01) and its transaction is rolled back, releasing its locks and breaking the cycle.',
      },
      {
        name: 'Victim Selector',
        icon: '🎯',
        role: 'Chooses which transaction to abort when a deadlock is detected',
        detail:
          'PostgreSQL\'s victim selection heuristic favors aborting the transaction that started most recently or has done the least work, minimising wasted effort. The victim is not configurable — applications must handle SQLSTATE 40P01 by catching the error and retrying the entire transaction. Unlike some databases, PostgreSQL does not attempt to roll back only the last statement; the entire transaction is aborted.',
      },
      {
        name: 'Lock Mode Hierarchy',
        icon: '📐',
        role: 'Eight table-level lock modes with defined conflict matrix',
        detail:
          'PostgreSQL defines eight table-level lock modes: ACCESS SHARE, ROW SHARE, ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, and ACCESS EXCLUSIVE. Each is acquired implicitly by specific SQL commands (SELECT → ACCESS SHARE; INSERT/UPDATE/DELETE → ROW EXCLUSIVE; ALTER TABLE → ACCESS EXCLUSIVE). Modes that conflict with each other cannot be held simultaneously on the same table, serializing the corresponding operations.',
      },
    ],
    howItWorks:
      'Deadlocks arise from inconsistent lock ordering. If Transaction A locks row 1 then tries to lock row 2, while Transaction B has locked row 2 and tries to lock row 1, both block indefinitely — A waits for B to release row 2, B waits for A to release row 1. PostgreSQL does not prevent this in advance (no lock ordering enforcement); instead it detects the cycle after deadlock_timeout has elapsed and aborts the victim. The standard prevention technique is to always acquire locks in a consistent canonical order (e.g., by row ID ascending) across all transactions touching the same set of rows. Alternatively, SELECT FOR UPDATE of all required rows at the start of the transaction — before any business logic — ensures all locks are acquired in a single pass.\n\nTable-level locks are acquired implicitly by SQL commands and form the conflict matrix that governs DDL/DML concurrency. ACCESS SHARE (SELECT) conflicts only with ACCESS EXCLUSIVE. ROW EXCLUSIVE (INSERT/UPDATE/DELETE) conflicts with SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, and ACCESS EXCLUSIVE. ACCESS EXCLUSIVE (ALTER TABLE, TRUNCATE, DROP, VACUUM FULL, REFRESH MATERIALIZED VIEW without CONCURRENTLY) conflicts with every other lock mode — including ACCESS SHARE — meaning it blocks all reads on the table for its entire duration. On a busy production table, an ALTER TABLE can queue behind long-running queries and then block all subsequent queries for the duration of the schema change.\n\nPractical DDL strategies to minimise ACCESS EXCLUSIVE impact: use CREATE INDEX CONCURRENTLY (acquires SHARE UPDATE EXCLUSIVE, not SHARE — allows reads and writes during index build); use ALTER TABLE ... ADD COLUMN with a DEFAULT only for non-volatile defaults (PostgreSQL 11+ can add a column with a constant default without rewriting the table); use pg_repack or logical replication-based schema migration for table rewrites on large production tables. Lock timeouts (SET lock_timeout = \'2s\') prevent a DDL statement from waiting indefinitely and blocking all subsequent operations.',
    decision: {
      choose: [
        'Consistent lock ordering (always lock rows in primary key order) as the primary deadlock prevention strategy for any transaction that updates multiple rows',
        'SELECT FOR UPDATE on all rows needed by a transaction at transaction start (before any conditional logic) to acquire all locks in one pass',
        'NOWAIT + retry for operations where a deadlock or long wait is better handled by failing fast and trying again than by waiting',
        'CREATE INDEX CONCURRENTLY for adding indexes to busy production tables — avoids the ACCESS EXCLUSIVE lock that CREATE INDEX (without CONCURRENTLY) takes',
        'lock_timeout on DDL sessions to prevent ALTER TABLE from waiting indefinitely behind long queries and then blocking all subsequent operations for the full rewrite duration',
        'Short, focused transactions for high-contention tables — the shorter the transaction, the smaller the window for deadlock and the lower the contention',
      ],
      avoid: [
        'Acquiring locks in different orders in different code paths — even a single code path that locks rows in reverse order relative to all others is sufficient to cause deadlocks under concurrency',
        'ALTER TABLE on large busy production tables without a lock_timeout and a maintenance window — ACCESS EXCLUSIVE will queue behind long reads and then block everything behind it',
        'Long transactions with multiple row locks — each additional locked row increases the surface area for deadlock cycles with other transactions',
        'VACUUM FULL on live production tables — it takes ACCESS EXCLUSIVE for the entire duration of the table rewrite; use pg_repack instead',
        'DDL inside application code that runs during normal request handling — schema migrations should be run separately with careful lock management, not during application startup or request processing',
      ],
      vs: [
        {
          name: 'Deadlock detection (PostgreSQL) vs deadlock prevention (timeout-based)',
          when: 'PostgreSQL uses detection: wait for deadlock_timeout, then detect and abort victim. Timeout-based prevention sets a short lock_timeout and treats any lock wait exceeding it as a potential deadlock, retrying immediately. Detection is more efficient under low deadlock frequency; timeout-based prevention suits high-contention short-transaction workloads where deadlock_timeout is too long to wait.',
        },
        {
          name: 'ACCESS EXCLUSIVE (ALTER TABLE) vs SHARE UPDATE EXCLUSIVE (CREATE INDEX CONCURRENTLY)',
          when: 'ACCESS EXCLUSIVE blocks all readers and writers for the duration of the DDL — use only on tables with zero live traffic (maintenance windows). SHARE UPDATE EXCLUSIVE allows concurrent reads and DML, making CREATE INDEX CONCURRENTLY safe on busy production tables, at the cost of longer index build time and inability to run inside a transaction block.',
        },
      ],
    },
    failures: [
      {
        name: 'ALTER TABLE Blocking All Reads',
        cause:
          'ALTER TABLE acquires ACCESS EXCLUSIVE, which conflicts with every other lock mode including ACCESS SHARE (SELECT). If a long-running query holds ACCESS SHARE when ALTER TABLE begins, ALTER TABLE queues behind it. Every subsequent SELECT then queues behind ALTER TABLE, causing a full table read outage for the duration.',
        symptom:
          'pg_locks shows many processes waiting on "relation" with locktype and the ALTER TABLE session holding mode = \'AccessExclusiveLock\'; all SELECT queries on the table time out; application latency spikes to 100%; pg_stat_activity shows dozens of queries waiting.',
        fix: 'Set lock_timeout = \'3s\' on the ALTER TABLE session so it fails fast rather than queuing; kill long-running queries before running DDL; use pg_repack for online table rewrites; use CREATE INDEX CONCURRENTLY instead of CREATE INDEX; add columns with defaults in PostgreSQL 11+ (no rewrite needed for non-volatile defaults).',
        severity: 'critical',
      },
      {
        name: 'Autovacuum Conflicting with DDL',
        cause:
          'Autovacuum holds SHARE UPDATE EXCLUSIVE on a table while performing VACUUM. DDL operations requiring SHARE or higher conflict with SHARE UPDATE EXCLUSIVE, queuing behind autovacuum. Autovacuum also cancels itself if it detects a waiting lock holder — but only after autovacuum_vacuum_cost_delay delays, which can be slow.',
        symptom:
          'pg_locks shows autovacuum holding ShareUpdateExclusiveLock; DDL statement queued in waiting state; pg_stat_activity shows autovacuum worker on the target table.',
        fix: 'Run DDL when autovacuum activity is low (off-peak hours); use lock_timeout to abort DDL rather than letting it queue; configure autovacuum_vacuum_cost_delay lower on critical tables so autovacuum finishes faster; in emergencies, pg_cancel_backend() on the autovacuum process (it will restart shortly).',
        severity: 'medium',
      },
      {
        name: 'Long Transaction Blocking VACUUM (Table-Level)',
        cause:
          'A long-running or idle-in-transaction session holds a snapshot older than the oldest dead tuple, preventing VACUUM from reclaiming space. Additionally, if the session holds any lock on the table, VACUUM\'s SHARE UPDATE EXCLUSIVE may queue behind it.',
        symptom:
          'n_dead_tup grows continuously in pg_stat_user_tables despite autovacuum running; pg_stat_activity shows a transaction with very old xact_start; table bloat increases; eventually XID age approaches warning threshold.',
        fix: 'Set idle_in_transaction_session_timeout globally; monitor SELECT max(age(backend_xid)) FROM pg_stat_activity and alert when XID age exceeds 100M; terminate offending sessions via pg_terminate_backend(); schedule VACUUM FREEZE on tables approaching XID age limits.',
        severity: 'high',
      },
    ],
    a: {
      v: 'Two diners at a circular table, each holding the other\'s fork',
      t: 'Diner A picks up the left fork (row 1) and reaches for the right fork (row 2). Diner B has already picked up the right fork and is reaching for the left. Neither can eat, neither will put their fork down. PostgreSQL\'s waiter (the deadlock detector) walks around after 1 second, sees the impasse, taps one diner on the shoulder and says "put your fork down and start over." That diner\'s meal (transaction) is cancelled, the other eats, and then the cancelled diner tries again.',
      tx: 'Deadlocks occur when transactions form a circular wait dependency — each transaction holds a lock that another needs, and no one can proceed. PostgreSQL resolves deadlocks by detection rather than prevention: it waits deadlock_timeout (default 1 second) before running a depth-first search of the wait graph. When a cycle is found, a victim transaction is aborted with SQLSTATE 40P01, its locks released, and the cycle broken. Applications must catch 40P01 and retry. Prevention is better than detection: always acquire locks in the same canonical order across all transactions touching the same rows. Table-level lock modes form a separate hierarchy — ACCESS EXCLUSIVE taken by ALTER TABLE conflicts with every other mode including read-only SELECT, making poorly timed DDL a full-table read outage. Safe DDL on live tables requires CREATE INDEX CONCURRENTLY (SHARE UPDATE EXCLUSIVE), lock_timeout to fail fast, and awareness of autovacuum holding competing locks.',
      s: 'Cycle in wait graph → victim abort; ACCESS EXCLUSIVE DDL blocks all operations',
    },
    te: {
      def: 'A deadlock is a circular dependency in the lock wait graph where each transaction holds a lock required by the next, making progress impossible without external intervention; PostgreSQL resolves deadlocks by detecting cycles after deadlock_timeout and aborting a victim transaction (SQLSTATE 40P01). Table-level locks (eight modes from ACCESS SHARE to ACCESS EXCLUSIVE) govern DDL/DML concurrency via a conflict matrix, with ACCESS EXCLUSIVE being the most dangerous as it blocks all concurrent operations.',
      types: [
        {
          n: 'ACCESS SHARE',
          d: 'Acquired by SELECT. Conflicts only with ACCESS EXCLUSIVE. Most permissive — allows all DML and most DDL to proceed concurrently.',
        },
        {
          n: 'ROW EXCLUSIVE',
          d: 'Acquired by INSERT, UPDATE, DELETE, MERGE. Conflicts with SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. Allows concurrent reads and other DML.',
        },
        {
          n: 'SHARE UPDATE EXCLUSIVE',
          d: 'Acquired by VACUUM (non-FULL), ANALYZE, CREATE INDEX CONCURRENTLY, CREATE STATISTICS, REINDEX CONCURRENTLY. Conflicts with itself and stronger modes. Allows concurrent reads and DML.',
        },
        {
          n: 'SHARE',
          d: 'Acquired by CREATE INDEX (non-CONCURRENTLY). Conflicts with ROW EXCLUSIVE and stronger. Blocks all writes but allows reads — causes write outage on busy tables.',
        },
        {
          n: 'ACCESS EXCLUSIVE',
          d: 'Acquired by ALTER TABLE, DROP TABLE, TRUNCATE, VACUUM FULL, REINDEX (non-CONCURRENTLY), REFRESH MATERIALIZED VIEW (non-CONCURRENTLY). Conflicts with ALL other modes including ACCESS SHARE — blocks reads and writes entirely.',
        },
      ],
      when: 'Prevent deadlocks by enforcing consistent lock ordering in application code and by acquiring all needed locks via SELECT FOR UPDATE at transaction start. Handle SQLSTATE 40P01 with retry logic. For DDL on production tables: use lock_timeout, prefer CREATE INDEX CONCURRENTLY, stage large migrations in non-blocking steps, and run during low-traffic windows.',
      trade:
        'Deadlock detection adds 1-second latency (deadlock_timeout) before resolution — acceptable for low-frequency deadlocks but painful under high contention. Victim abort wastes the aborted transaction\'s work. Consistent lock ordering eliminates deadlocks at zero runtime cost but requires discipline across the entire codebase. ACCESS EXCLUSIVE DDL is zero-overhead when the table is idle but catastrophic on busy tables — staging migrations (add column without default, backfill, add constraint) minimises the window of each individual ACCESS EXCLUSIVE acquisition.',
      code: `-- Classic deadlock scenario
-- Session 1:
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1; -- locks row 1
-- (now Session 2 runs and locks row 2)
UPDATE accounts SET balance = balance + 100 WHERE id = 2; -- blocks! waits for row 2
-- After deadlock_timeout: ERROR: deadlock detected

-- Session 2 (concurrent):
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 2;  -- locks row 2
UPDATE accounts SET balance = balance + 50 WHERE id = 1;  -- blocks! waits for row 1
-- One session gets deadlock error; the other proceeds

-- FIX: consistent lock ordering — always lock by id ASC
BEGIN;
SELECT id FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
-- Locks row 1 then row 2 in consistent order — no deadlock possible
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- NOWAIT: fail fast rather than wait deadlock_timeout seconds
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE NOWAIT;
-- Raises immediately: ERROR: could not obtain lock on row in relation "accounts"
-- Application retries with backoff

-- Safe DDL: CREATE INDEX without blocking reads/writes
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders (user_id);
-- Uses SHARE UPDATE EXCLUSIVE — allows concurrent reads and DML
-- Cannot be run inside a transaction block

-- Dangerous DDL: ALTER TABLE takes ACCESS EXCLUSIVE
-- Add lock_timeout to prevent it from queuing and blocking everything behind it
SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN notes TEXT;
RESET lock_timeout;

-- Inspect current locks and wait chains
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query,
  pg_locks.mode AS lock_mode,
  pg_locks.granted
FROM pg_stat_activity AS blocked
JOIN pg_locks ON pg_locks.pid = blocked.pid AND NOT pg_locks.granted
JOIN pg_stat_activity AS blocking ON blocking.pid = (
  SELECT pid FROM pg_locks l2
  WHERE l2.granted AND l2.relation = pg_locks.relation
  LIMIT 1
)
ORDER BY blocked.pid;`,
      rw: {
        ex: [
          'Airbnb: enforces lock ordering on booking transactions (always lock by listing_id ASC then user_id ASC) to eliminate deadlocks in the reservation system that previously caused ~200 deadlock errors/day',
          'Shopify: uses CREATE INDEX CONCURRENTLY for all production index additions, never taking SHARE lock that would block merchant storefronts during the index build',
          'Discord: sets lock_timeout = \'1s\' on all application database connections so any lock contention fails fast and returns an error to the client rather than queuing and cascading',
          'Stack Overflow: stages ALTER TABLE migrations into multiple non-rewriting steps (add nullable column → backfill → add constraint) to minimise the duration of each individual ACCESS EXCLUSIVE acquisition on their large tables',
        ],
        cs: 'A financial trading platform experienced 50–100 deadlocks per day between two transaction types: order placement (locks order row then position row) and position adjustment (locks position row then order row). Each deadlock caused a 1-second deadlock_timeout wait before the victim was aborted, and the retry logic was broken — it retried only the failed statement, not the full transaction, leaving the database in an inconsistent state. The fix: (1) standardised lock order to always acquire position row lock before order row lock in both transaction types; (2) added SELECT FOR UPDATE on both rows at transaction start before any business logic; (3) fixed retry logic to catch SQLSTATE 40P01 and retry the full transaction up to 5 times with exponential backoff. Deadlocks dropped to zero within one day of deployment. The team also added a Grafana alert on pg_stat_activity for lock waits exceeding 500ms to detect future ordering regressions.',
      },
    },
    interview: {
      q: 'How does PostgreSQL detect deadlocks, how do you prevent them, and what makes ALTER TABLE particularly dangerous on a busy production table?',
      a: 'PostgreSQL uses deadlock detection rather than prevention. When a process has been waiting for a lock for longer than deadlock_timeout (default 1 second), it triggers the deadlock detector, which performs a depth-first search of the lock wait graph looking for cycles. If a cycle is found, one transaction — typically the most recently started one or the one that has done the least work — is chosen as the victim and aborted with SQLSTATE 40P01 (deadlock detected). The victim\'s locks are released, breaking the cycle, and the other transactions proceed. The primary prevention technique is consistent lock ordering: if all transactions that touch the same set of rows always acquire locks in the same order (e.g., by primary key ascending), no cycle can form. Additionally, SELECT FOR UPDATE on all needed rows at the start of a transaction acquires all locks in a single pass before any conditional logic branches. ALTER TABLE is dangerous on busy production tables because it acquires ACCESS EXCLUSIVE, the strongest table-level lock, which conflicts with every other lock mode including ACCESS SHARE taken by plain SELECT. If a long-running query already holds ACCESS SHARE when ALTER TABLE begins, ALTER TABLE queues behind it. Every subsequent query then queues behind ALTER TABLE, producing a full table outage for the duration of both the wait and the table rewrite. The correct mitigation is SET lock_timeout = \'2s\' so ALTER TABLE aborts rather than queuing; for index creation, use CREATE INDEX CONCURRENTLY which takes only SHARE UPDATE EXCLUSIVE and allows concurrent reads and DML.',
      fu: [
        'How would you diagnose a deadlock in production using pg_locks and pg_stat_activity?',
        'What is the difference between lock_timeout and deadlock_timeout, and when would you set each?',
        'How does CREATE INDEX CONCURRENTLY avoid the read/write blocking of a regular CREATE INDEX, and what are its limitations?',
      ],
    },
  },
];
