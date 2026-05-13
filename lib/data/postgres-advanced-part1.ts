import { Concept } from '../types';

export const POSTGRES_ADVANCED_PART1: Concept[] = [
  {
    id: 'postgres-clustered-indexes',
    cat: 'postgres',
    color: '#336791',
    icon: '🗃️',
    title: 'PostgreSQL Clustered vs Non-Clustered Indexes',
    tag: 'PostgreSQL heaps are always unordered — CLUSTER physically reorders rows by an index',
    overview:
      'PostgreSQL stores all table rows in unordered "heap" files — unlike MySQL InnoDB or SQL Server, there is no built-in clustered index storage format. Every index is a separate B-tree (or other structure) pointing back into the heap. The CLUSTER command physically rewrites the heap to match an index order, improving correlation and range-query I/O. Complementary tools include BRIN indexes for append-only time-series, covering indexes (INCLUDE) for index-only scans, partial indexes for selective hot paths, and fillfactor to reduce update bloat.',

    components: [
      {
        name: 'Heap File',
        icon: '📄',
        role: "PostgreSQL's table storage — unordered 8 KB pages",
        detail:
          'PostgreSQL stores table rows in "heap" files — 8 KB pages, rows written in arrival order. Dead tuples left in place by MVCC are reclaimed by VACUUM. Unlike MySQL InnoDB, PostgreSQL has NO concept of a clustered index as a storage format — the table is always a heap, and every index is a separate structure that stores pointers (TID = page + offset) back into the heap. This means all index lookups end with at least one random heap access unless an index-only scan is possible.',
      },
      {
        name: 'CLUSTER Command',
        icon: '🔀',
        role: 'Physically rewrites the heap in index order — a one-time sort',
        detail:
          '`CLUSTER orders USING orders_created_at_idx` physically rewrites the table file with rows in index order, setting correlation to 1.0 for that column. This turns a range query from N random heap accesses into a sequential read. Critical caveats: CLUSTER takes an ACCESS EXCLUSIVE lock (all queries block), and the ordering is NOT maintained — new INSERTs and UPDATEs go back to the heap unordered. Re-run CLUSTER periodically, or use `pg_repack` for an online, lock-free alternative.',
      },
      {
        name: 'BRIN Index (Block Range INdex)',
        icon: '📦',
        role: 'Stores min/max per block range — kilobytes vs megabytes for B-tree',
        detail:
          'A BRIN index stores the min and max value of the indexed column for each contiguous range of pages (default 128 pages = 1 MB). When a query filters by that column, PostgreSQL skips ranges whose min/max cannot overlap the filter. BRIN is only effective when the physical row order correlates with the column values — a log table with an always-increasing `created_at` is the ideal case. For random-order data, BRIN provides no selectivity. Index size: kilobytes vs hundreds of megabytes for a B-tree on the same column.',
      },
      {
        name: 'Covering Index (INCLUDE)',
        icon: '🎯',
        role: 'Stores extra columns in leaf pages to enable zero-heap index-only scans',
        detail:
          '`CREATE INDEX ON orders (customer_id) INCLUDE (status, total)` stores `status` and `total` in the index leaf pages but NOT in the B-tree internal nodes — so the index stays small and the B-tree search cost is unchanged. When a query filters on `customer_id` and projects only `status` and `total`, PostgreSQL can satisfy the query entirely from the index (an "index-only scan") — zero heap page reads. Prerequisite: the visibility map for the page must be set (VACUUM sets it), indicating all tuples on the page are visible to all transactions.',
      },
    ],

    howItWorks:
      'PostgreSQL heap pages: each 8 KB page has a 24-byte page header, an array of item pointers (line pointers, 4 bytes each) growing from the top, and tuples stored bottom-up. Each tuple has a 23-byte header containing xmin/xmax (transaction IDs for MVCC visibility). Dead tuples (xmax set, not yet vacuumed) remain in place, consuming space. VACUUM reclaims them and sets the visibility map bit for the page when all tuples are visible.\n\nThe correlation statistic (`pg_stats.correlation`) is a value from -1.0 to 1.0 measuring the Pearson correlation between the physical position of rows and the sort order of the column. Correlation 1.0 = perfectly ordered (index scan becomes sequential read). Correlation 0.0 = random (index scan degenerates to N random heap reads). The query planner uses correlation when estimating the cost of an index scan: low correlation → high random I/O cost → planner may prefer a sequential scan even when an index exists. `CLUSTER` resets correlation to 1.0 for the clustered column.\n\n`fillfactor`: when creating a table (`CREATE TABLE ... WITH (fillfactor=80)`) or index, fillfactor specifies what percentage of each page to fill on initial load or index build. The remaining space is reserved for future updates (HOT updates — Heap-Only Tuple updates — can reuse space on the same page, avoiding index entry duplication and reducing bloat). Default fillfactor for tables is 100; 70–80 is recommended for frequently updated tables.\n\nIndex-only scan requirements: (1) every column in the query\'s SELECT list and WHERE clause must be present in the index (as a key column or INCLUDE column); (2) the visibility map bit for the page must be set. If bit is not set, PostgreSQL must check the heap to verify visibility — "Heap Fetches" in EXPLAIN ANALYZE will be non-zero. Run VACUUM to set visibility map bits. Monitor index usage with `pg_stat_user_indexes.idx_scan` and `idx_tup_fetch` (heap fetches — should be 0 for a true index-only scan).',

    decision: {
      choose: [
        'Use CLUSTER when you have a frequently range-scanned column with low correlation and can tolerate an exclusive lock during the reorder window',
        'Use BRIN on append-only time-series tables where the column is naturally ordered by insertion — 1000× smaller than B-tree',
        'Use covering indexes (INCLUDE) when a query consistently filters on column A and projects columns B, C — eliminates heap access entirely',
        'Use partial indexes when only a small subset of rows is queried (e.g., status = \'active\') — smaller index, faster writes, same query speed for the hot path',
        'Set fillfactor=70–80 on tables with frequent in-place updates to reduce HOT update bloat',
      ],
      avoid: [
        'Do not rely on CLUSTER to maintain ordering — it is a one-time reorder; new writes immediately disorder the heap',
        'Do not use BRIN on columns with poor physical correlation to the value (e.g., user_id with random inserts) — it will scan more pages than no index at all',
        'Do not add every queried column to INCLUDE — bloats the index; only include columns that truly enable index-only scans for high-frequency queries',
        'Do not run CLUSTER on a production table without scheduling a maintenance window — ACCESS EXCLUSIVE lock blocks all reads and writes',
        'Do not set fillfactor too low (e.g., 50%) — wastes storage and reduces cache efficiency',
      ],
      vs: [
        {
          name: 'B-tree vs BRIN',
          when:
            'B-tree: any column, random data, point lookups, range scans with low correlation. BRIN: append-only tables, naturally ordered column, range scans only — use when storage is a constraint and data is always inserted in sorted order.',
        },
        {
          name: 'CLUSTER vs pg_repack',
          when:
            'CLUSTER: simple, built-in, but requires ACCESS EXCLUSIVE lock. pg_repack: online rebuild without exclusive lock — use in production systems where the table cannot be locked.',
        },
        {
          name: 'Covering index (INCLUDE) vs materialized view',
          when:
            'Covering index: best for single-table queries with a stable projection. Materialized view: best when the query involves joins, aggregations, or transformations that cannot be expressed as an index.',
        },
      ],
    },

    failures: [
      {
        name: 'Covering index stale after adding a column to SELECT',
        cause:
          'A new column is added to the SELECT list of a query that was previously served by an index-only scan. The column is not in the INCLUDE list.',
        symptom:
          'EXPLAIN ANALYZE shows "Index Scan" or "Heap Fetches > 0" instead of "Index Only Scan". Query latency increases due to heap lookups.',
        fix:
          'Add the new column to the INCLUDE clause or create a new covering index. Use `pg_stat_user_indexes` to monitor `idx_tup_fetch` — a spike from 0 to non-zero indicates regression to heap access.',
        severity: 'medium',
      },
      {
        name: 'CLUSTER locks the table — production outage',
        cause:
          'Running `CLUSTER` on a large production table takes an ACCESS EXCLUSIVE lock for the entire duration of the table rewrite (can be minutes to hours for large tables).',
        symptom:
          'All queries against the table queue behind the lock. Application shows timeouts. `pg_stat_activity` shows queries in "waiting" state.',
        fix:
          'Use `pg_repack` extension for an online, lock-free table rebuild. Schedule CLUSTER during a low-traffic maintenance window. Set `lock_timeout` to abort CLUSTER if it cannot acquire the lock quickly.',
        severity: 'high',
      },
    ],

    a: {
      v: 'Library with a messy bookshelf',
      t: 'PostgreSQL Heap vs Physical Ordering',
      tx: 'Imagine a library where books are shelved in the order they arrived — not alphabetically, not by topic. Finding all books by a specific author requires checking an index card (the B-tree index) for each book, then walking to a random shelf location. The CLUSTER command is like hiring staff to physically rearrange all books by author — after that, finding all of an author\'s books means walking a single continuous shelf. But as new books arrive, they go back to random shelves. BRIN is like sticky notes on shelf sections saying "all books in this section were acquired between Jan–Mar" — useless for random lookups, but great for "give me all books from Q1 2024."',
      s: 'Heap = arrival-order shelves. B-tree index = card catalog. CLUSTER = physical rearrangement. BRIN = section-level date labels. Covering index = a card catalog that also contains the book summary (no need to fetch the book).',
    },

    te: {
      def: 'PostgreSQL always stores table rows in heap files (unordered 8 KB pages). Indexes are separate structures pointing into the heap via TIDs (page, offset). The CLUSTER command physically rewrites the heap to match index order. BRIN indexes store min/max per block range for append-only use cases. Covering indexes (INCLUDE) embed projection columns in the index leaf to enable zero-heap index-only scans.',
      types: [
        { n: 'Heap File', d: 'Default PostgreSQL table storage — rows in arrival order, 8 KB pages' },
        { n: 'B-tree Index', d: 'Balanced tree — supports equality, range, ORDER BY; standard index type' },
        { n: 'BRIN Index', d: 'Block Range INdex — min/max per N pages; only useful for naturally ordered data' },
        { n: 'Covering Index (INCLUDE)', d: 'B-tree with extra columns in leaf nodes — enables index-only scans' },
        { n: 'Partial Index', d: 'Index with a WHERE clause — only indexes rows matching the condition' },
        { n: 'CLUSTER', d: 'One-time command that physically rewrites the heap in index order' },
      ],
      when: 'Apply CLUSTER when range queries on a column are frequent and EXPLAIN ANALYZE shows high random I/O (many Buffers: read vs hit). Use BRIN when inserting time-series data in order and storage is a constraint. Use covering indexes when index-only scans would eliminate heap reads for high-frequency queries. Use partial indexes when queries consistently target a small, well-defined subset of rows.',
      trade: 'CLUSTER improves read performance but requires an exclusive lock and must be re-run periodically — maintenance overhead. BRIN is tiny but only useful for correlated data — wrong use case returns more pages than a sequential scan. Covering indexes speed up reads at the cost of larger index size and slightly slower writes (more data to maintain). Partial indexes reduce index size and write overhead but only help queries that include the partial condition.',
      code: `-- ── TABLE SETUP ──────────────────────────────────────
CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  status      TEXT NOT NULL,
  total       NUMERIC(12,2),
  created_at  TIMESTAMPTZ DEFAULT now()
) WITH (fillfactor = 80);  -- leave 20% free per page for HOT updates

-- ── CORRELATION CHECK ─────────────────────────────────
-- correlation = 1.0  → physical row order matches index order exactly (sequential reads)
-- correlation = 0.0  → random order (index scan = N random heap reads)
SELECT tablename, attname, correlation
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'created_at';
-- Example output:
-- tablename | attname    | correlation
-- ----------+------------+-------------
-- orders    | created_at | 0.98        ← nearly sequential (BRIN candidate)

SELECT tablename, attname, correlation
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'customer_id';
-- orders    | customer_id | 0.02       ← random order (B-tree needed)

-- ── B-TREE INDEX (standard) ───────────────────────────
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);

-- ── COVERING INDEX (index-only scan) ──────────────────
-- Query: SELECT status, total FROM orders WHERE customer_id = 42
-- Without INCLUDE: planner fetches status + total from heap (random I/O)
-- With INCLUDE: everything is in the index leaf page — zero heap reads

CREATE INDEX idx_orders_customer_covering
ON orders (customer_id)
INCLUDE (status, total, created_at);

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT status, total
FROM orders
WHERE customer_id = 42;
-- Expected output:
-- Index Only Scan using idx_orders_customer_covering on orders
--   Index Cond: (customer_id = 42)
--   Heap Fetches: 0   ← 0 only after VACUUM sets visibility map bits
--   Buffers: shared hit=3

-- Force visibility map update so index-only scan works without heap checks:
VACUUM orders;

-- ── BRIN INDEX for time-series ────────────────────────
-- Each range covers pages_per_range × 8KB pages = 64 × 8KB = 512KB
-- BRIN stores: min(created_at) and max(created_at) per 512KB range
-- Query "WHERE created_at BETWEEN X AND Y" skips ranges with no overlap
CREATE INDEX idx_orders_brin_created
ON orders USING BRIN (created_at)
WITH (pages_per_range = 64);

-- Compare index sizes — BRIN is thousands of times smaller:
SELECT
  pg_size_pretty(pg_relation_size('idx_orders_status_created')) AS btree_size,
  pg_size_pretty(pg_relation_size('idx_orders_brin_created'))   AS brin_size;
-- btree_size | brin_size
-- -----------+----------
-- 200 MB     | 48 KB    ← ~4000× smaller

-- BRIN query execution:
-- 1. Scan the BRIN index (tiny — fits in memory)
-- 2. For each block range, check if [min, max] overlaps [2024-01-01, 2024-01-31]
-- 3. Read only the qualifying block ranges from the heap
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';
-- Bitmap Heap Scan on orders
--   Recheck Cond: (created_at BETWEEN ...)
--   ->  Bitmap Index Scan on idx_orders_brin_created

-- ── CLUSTER (physical reorder) ────────────────────────
-- Before CLUSTER: correlation on customer_id = 0.03 (random heap access for range scan)
-- A range query for customer_id BETWEEN 100 AND 200 reads rows from random pages

CLUSTER orders USING idx_orders_customer;
-- After CLUSTER: correlation on customer_id = 1.0
-- Same range query now reads sequentially — orders of magnitude fewer I/Os

-- Always ANALYZE after CLUSTER to update planner statistics:
ANALYZE orders;

-- ── PARTIAL INDEX ─────────────────────────────────────
-- 90% of queries filter on status IN ('active', 'pending')
-- Full index on (customer_id, created_at DESC) indexes ALL rows including
-- 'completed', 'cancelled', 'refunded' — wasted space and write overhead

-- Partial index: only index the hot rows
CREATE INDEX idx_orders_active
ON orders (customer_id, created_at DESC)
WHERE status IN ('active', 'pending');
-- Result: 10× smaller, faster writes, same speed for hot-path queries

-- PostgreSQL uses this index ONLY when the query predicate matches:
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE customer_id = 42
  AND status = 'pending'
ORDER BY created_at DESC LIMIT 10;
-- Index Scan using idx_orders_active on orders
--   Index Cond: (customer_id = 42)
--   Filter: (status = 'pending')   ← matches the partial index predicate

-- ── INDEX USAGE STATS ─────────────────────────────────
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,          -- total times this index was used for a scan
  idx_tup_read,      -- tuples read via index (index entries traversed)
  idx_tup_fetch,     -- tuples fetched from heap (0 = pure index-only scan)
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'orders'
ORDER BY idx_scan DESC;

-- Find unused indexes — candidates for removal (save write overhead + storage):
SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS wasted_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;`,
      rw: {
        ex: [
          'TimescaleDB uses BRIN indexes on its time-series chunk tables — each chunk is always inserted in time order, giving BRIN perfect correlation',
          'Shopify uses covering indexes extensively on their orders table to avoid heap access for common dashboard queries',
          'GitHub uses partial indexes on repository tables to only index public repositories for full-text search, keeping the index 10× smaller',
          'Citus (distributed PostgreSQL) recommends pg_repack instead of CLUSTER for sharded tables to avoid locking distributed nodes',
        ],
        cs: 'A fintech company had a daily batch job querying 3 years of transactions by account_id for statement generation. Initial B-tree scan took 45 seconds due to 0.03 correlation (random heap reads across the entire table). After running CLUSTER on the account_id index, correlation jumped to 0.98, the same query took 1.2 seconds — sequential reads vs random I/O. They scheduled a weekly pg_repack job during off-peak hours to maintain correlation without downtime.',
      },
    },

    interview: {
      q: 'PostgreSQL doesn\'t have clustered indexes like SQL Server. How do you get the same physical ordering benefit?',
      a: 'PostgreSQL always stores rows in heap files — unordered 8 KB pages. Every index is a separate B-tree pointing into the heap via TIDs. The CLUSTER command physically rewrites the heap in index order, setting correlation to 1.0, so range queries become sequential reads instead of random I/O. The catch: CLUSTER takes an ACCESS EXCLUSIVE lock and does not maintain ordering — new writes go back to the heap unordered. For production use without downtime, I use pg_repack which rebuilds online. I also check pg_stats.correlation to decide when re-clustering is needed, and use BRIN indexes for append-only time-series columns as an alternative that gives range-scan benefits without a full table rewrite.',
      fu: [
        'What is the correlation statistic and how does the planner use it?',
        'When would you choose BRIN over a B-tree index?',
        'What is an index-only scan and what are its requirements?',
        'How does fillfactor reduce table bloat from updates?',
        'What is the difference between a covering index key column and an INCLUDE column?',
      ],
    },
  },

  {
    id: 'postgres-window-functions',
    cat: 'postgres',
    color: '#336791',
    icon: '🪟',
    title: 'PostgreSQL Window Functions',
    tag: 'Window functions compute across a set of rows related to the current row — without collapsing them like GROUP BY',
    overview:
      'Window functions allow you to compute values across a "window" of rows related to the current row — running totals, moving averages, rankings, and row comparisons — while keeping every individual row in the output. Unlike GROUP BY which collapses rows into aggregates, window functions add a computed column to each row. They are executed after WHERE, GROUP BY, and HAVING, and use the OVER() clause to define the window via PARTITION BY (grouping) and ORDER BY (sequencing), with an optional frame specification (ROWS/RANGE BETWEEN) to control which rows around the current row are included in the computation.',

    components: [
      {
        name: 'OVER() Clause',
        icon: '🔭',
        role: 'Transforms an aggregate into a window function — computes without collapsing rows',
        detail:
          'The OVER() clause is the defining feature of window functions. Without OVER, `SUM(total)` is an aggregate that collapses all rows to one. With `OVER()`, it returns the grand total on every row without collapsing. `OVER()` with no arguments = the entire result set is the window. `OVER(PARTITION BY region)` = one window per region. `OVER(PARTITION BY region ORDER BY sale_date)` = one window per region, with rows sequenced by sale_date for functions that care about order (running totals, LAG, LEAD).',
      },
      {
        name: 'PARTITION BY',
        icon: '🗂️',
        role: 'Divides rows into independent groups — window functions reset per partition',
        detail:
          'PARTITION BY divides the result set into independent partitions. Each partition is processed independently — the window function resets its state for each partition. Think of it as GROUP BY that keeps individual rows. `RANK() OVER(PARTITION BY department ORDER BY salary DESC)` gives rank 1 to the highest-paid employee in EACH department, not across the entire company. With no PARTITION BY, the entire result set is one partition.',
      },
      {
        name: 'ORDER BY in OVER',
        icon: '📋',
        role: 'Defines row sequence within each partition — required for order-sensitive functions',
        detail:
          'ORDER BY inside OVER defines the logical ordering of rows within each partition. Required for: LAG, LEAD (need a defined "previous" and "next"), ROW_NUMBER (needs a sequence), RANK, DENSE_RANK, running totals (cumulative sum). Without ORDER BY in OVER, all rows in the partition are peers — no defined sequence. For `SUM() OVER()` (no ORDER BY), the default frame is the entire partition — equivalent to a grand total repeated on every row.',
      },
      {
        name: 'Frame Specification (ROWS/RANGE BETWEEN)',
        icon: '📐',
        role: 'Defines the sliding window of rows included in the current computation',
        detail:
          'The frame clause defines which rows relative to the current row are included in the window computation. Two modes: ROWS (counts physical rows) and RANGE (uses the ORDER BY column value — rows with equal values are in the same range). Common frames: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` = running total (default when ORDER BY is present). `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` = 7-row sliding window. `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` = entire partition (needed for LAST_VALUE). ROWS is more predictable than RANGE for sliding windows because ties are treated as distinct physical rows.',
      },
    ],

    howItWorks:
      'PostgreSQL executes window functions in a specific phase of query processing: after WHERE, HAVING, and GROUP BY (so all rows to be windowed are determined), but before the final ORDER BY and LIMIT. This has a critical implication: you CANNOT filter on a window function result in the WHERE clause of the same query — the WHERE runs before window functions are computed. Wrap the query in a CTE or subquery, then filter in the outer query.\n\nROWS vs RANGE distinction: ROWS counts physical rows — "2 PRECEDING" means exactly 2 rows above the current row in the partition order. RANGE uses the ORDER BY column value — "2 PRECEDING" means all rows whose ORDER BY value is within 2 of the current row\'s value. For a date column with no gaps, ROWS and RANGE behave identically. For an amount column with ties (e.g., two rows with amount=1000), RANGE includes BOTH tied rows in the "preceding" frame, while ROWS counts them separately.\n\nROW_NUMBER vs RANK vs DENSE_RANK: ROW_NUMBER assigns a unique sequential integer — ties get different numbers (arbitrary ordering within the tie). RANK assigns the same number to tied rows, then SKIPS the next numbers (1,1,3 — rank 2 is skipped). DENSE_RANK assigns the same number to tied rows, then continues sequentially without gaps (1,1,2). Use ROW_NUMBER for pagination (guaranteed unique), RANK for competition-style ranking (show tied positions), DENSE_RANK when you never want gaps in the rank sequence.\n\nLAG and LEAD access adjacent rows without a self-join. `LAG(amount, 1, 0)` returns the value of `amount` from 1 row before the current row in the partition order, with a default of 0 if no previous row exists. LEAD does the same for the next row. Useful for computing period-over-period changes, detecting gaps, and comparing consecutive records.\n\nLAST_VALUE gotcha: the default frame `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` means LAST_VALUE returns the current row\'s own value (useless). Always specify `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` to see the last value in the partition.\n\nPerformance: window functions require sorting the input (for ORDER BY in OVER) and potentially materializing intermediate results. PostgreSQL can reuse the same sort for multiple window functions with identical PARTITION BY and ORDER BY clauses — always group such functions together in the SELECT list for efficiency.',

    decision: {
      choose: [
        'Use ROW_NUMBER() for pagination-style top-N-per-group queries (wrap in CTE, filter on rn <= N)',
        'Use LAG/LEAD for period-over-period comparisons without self-joins',
        'Use SUM() OVER with ROWS BETWEEN for running totals and sliding-window aggregates',
        'Use RANK/DENSE_RANK when ties in ranking are meaningful (e.g., competition leaderboard)',
        'Use NTILE for percentile bucketing and quartile analysis',
      ],
      avoid: [
        'Do not filter on window function results in WHERE — wrap in a CTE or subquery',
        'Do not use LAST_VALUE without explicitly setting ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING',
        'Do not use RANGE frame for sliding windows when ties in ORDER BY column exist — use ROWS for predictable behavior',
        'Do not use window functions when a simple GROUP BY aggregate is sufficient — window functions have higher overhead',
        'Do not mix multiple window functions with different PARTITION BY/ORDER BY combinations in the same query without understanding that each requires a separate sort pass',
      ],
      vs: [
        {
          name: 'Window functions vs GROUP BY',
          when: 'GROUP BY: you need aggregated results only (one row per group). Window functions: you need both individual row detail AND aggregated values on each row (e.g., each sale row showing the sale amount AND the regional total).',
        },
        {
          name: 'ROW_NUMBER in CTE vs DISTINCT ON',
          when: 'DISTINCT ON: simpler, often faster for top-1-per-group (latest order per customer). ROW_NUMBER in CTE: more flexible, works for top-N-per-group (N > 1), and supports complex tie-breaking.',
        },
        {
          name: 'LAG/LEAD vs self-join',
          when: 'LAG/LEAD: cleaner, single scan. Self-join: required if you need to compare rows more than one step apart or rows from different partitions.',
        },
      ],
    },

    failures: [
      {
        name: 'Filtering on window function result in WHERE',
        cause:
          'Writing `WHERE ROW_NUMBER() OVER(PARTITION BY region ORDER BY amount DESC) <= 3` in the same SELECT level as the window function definition.',
        symptom:
          'PostgreSQL throws "ERROR: window functions are not allowed in WHERE" or similar. The query fails to parse.',
        fix:
          'Wrap the window function query in a CTE or subquery: `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) AS rn FROM ...) SELECT * FROM ranked WHERE rn <= 3`.',
        severity: 'medium',
      },
      {
        name: 'LAST_VALUE returning the current row due to default frame',
        cause:
          'Using `LAST_VALUE(col) OVER(PARTITION BY x ORDER BY y)` without specifying the frame. The default frame `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` means the "last" value in the frame is always the current row itself.',
        symptom:
          'LAST_VALUE returns the same value as the current row\'s column value, not the final value in the partition. The query produces no error but silently returns wrong results.',
        fix:
          'Always explicitly specify the frame for LAST_VALUE: `LAST_VALUE(col) OVER(PARTITION BY x ORDER BY y ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)`.',
        severity: 'medium',
      },
    ],

    a: {
      v: 'Spreadsheet with frozen panes and running formulas',
      t: 'Window Functions vs GROUP BY',
      tx: 'GROUP BY is like a spreadsheet where you collapse all rows into summary rows — you lose the individual sale details. A window function is like adding a formula column to your spreadsheet that computes a value using a "window" of other rows — but every original row stays in the sheet. `SUM(amount) OVER(PARTITION BY region)` is like a formula `=SUMIF($B:$B, B2, $C:$C)` that shows the regional total next to each individual sale row. LAG is like referencing the cell one row above in the same column.',
      s: 'Window function = formula column that looks at nearby rows without deleting any rows. PARTITION BY = which rows are "nearby". ORDER BY = row sequence. Frame = how many rows above/below to include.',
    },

    te: {
      def: 'Window functions compute a value for each row using a set of rows defined by OVER(). They run after WHERE/GROUP BY/HAVING but before ORDER BY/LIMIT. Key functions: ROW_NUMBER (unique sequence), RANK/DENSE_RANK (ties), LAG/LEAD (adjacent rows), SUM/AVG with frames (running totals, moving averages), FIRST_VALUE/LAST_VALUE/NTH_VALUE (positional), NTILE (bucketing).',
      types: [
        { n: 'Ranking', d: 'ROW_NUMBER, RANK, DENSE_RANK, NTILE — assign position or bucket numbers' },
        { n: 'Offset', d: 'LAG, LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE — access rows at a relative position' },
        { n: 'Aggregate as window', d: 'SUM, AVG, COUNT, MIN, MAX with OVER() — running/sliding aggregates without collapsing' },
      ],
      when: 'Use window functions whenever you need to compute values that span multiple rows (running totals, period comparisons, rankings, moving averages) while preserving individual row output. Especially powerful for analytical/reporting queries, cohort analysis, and time-series computations.',
      trade: 'Window functions require a sort step (O(N log N) for the ORDER BY in OVER) and may materialize intermediate results. They are more expensive than simple aggregates. For very large datasets, ensure the PARTITION BY columns are indexed to reduce sort input size. Multiple window functions with the same OVER() clause reuse the same sort.',
      code: `-- ── SAMPLE DATA ───────────────────────────────────────
CREATE TABLE sales (
  id         SERIAL PRIMARY KEY,
  rep        TEXT,
  region     TEXT,
  sale_date  DATE,
  amount     NUMERIC(10,2)
);
INSERT INTO sales (rep, region, sale_date, amount) VALUES
  ('Alice', 'West',  '2024-01-05', 1200.00),
  ('Alice', 'West',  '2024-01-12',  800.00),
  ('Alice', 'West',  '2024-02-03', 1500.00),
  ('Bob',   'East',  '2024-01-08',  950.00),
  ('Bob',   'East',  '2024-01-20', 1100.00),
  ('Bob',   'East',  '2024-02-15',  700.00),
  ('Carol', 'West',  '2024-01-10', 2000.00),
  ('Carol', 'West',  '2024-02-01', 1800.00);

-- ═══════════════════════════════════════════════════════
-- 1. ROW_NUMBER, RANK, DENSE_RANK — understanding the difference
-- ═══════════════════════════════════════════════════════
SELECT
  rep,
  region,
  amount,
  -- ROW_NUMBER: unique sequential number, no ties — arbitrary order within tied values
  ROW_NUMBER()  OVER (PARTITION BY region ORDER BY amount DESC) AS row_num,
  -- RANK: ties get same rank, next rank SKIPS numbers (gap appears after ties)
  RANK()        OVER (PARTITION BY region ORDER BY amount DESC) AS rnk,
  -- DENSE_RANK: ties get same rank, NO gaps in rank sequence
  DENSE_RANK()  OVER (PARTITION BY region ORDER BY amount DESC) AS dense_rnk
FROM sales;

-- Step-by-step for 'West' partition (sorted by amount DESC):
-- Carol: 2000.00  → row_num=1, rank=1, dense_rank=1
-- Carol: 1800.00  → row_num=2, rank=2, dense_rank=2
-- Alice: 1500.00  → row_num=3, rank=3, dense_rank=3
-- Alice: 1200.00  → row_num=4, rank=4, dense_rank=4
-- Alice:  800.00  → row_num=5, rank=5, dense_rank=5

-- Hypothetical: two rows with amount=1500 (a tie) in West:
-- row_num: 3 and 4 (arbitrary assignment between the two tied rows)
-- rank:    3 and 3, THEN next is 5 (rank 4 is skipped — gap)
-- dense_rank: 3 and 3, THEN next is 4 (no gap — dense/continuous)

-- ── TOP 2 SALES PER REGION (ROW_NUMBER in CTE — cannot filter in WHERE) ──
WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn
  FROM sales
)
-- Filter OUTSIDE the window function computation:
SELECT rep, region, amount
FROM ranked
WHERE rn <= 2;
-- West: Carol 2000.00 (rn=1), Carol 1800.00 (rn=2)
-- East: Bob   1100.00 (rn=1), Bob   950.00  (rn=2)

-- ═══════════════════════════════════════════════════════
-- 2. LAG and LEAD — access adjacent rows without a self-join
-- ═══════════════════════════════════════════════════════
SELECT
  rep,
  sale_date,
  amount,
  -- LAG(col): the value of col from the PREVIOUS row in partition order
  -- Returns NULL for the first row (no previous row)
  LAG(amount)        OVER (PARTITION BY rep ORDER BY sale_date) AS prev_amount,
  -- LAG with offset=1 and default=0: return 0 instead of NULL for first row
  LAG(amount, 1, 0)  OVER (PARTITION BY rep ORDER BY sale_date) AS prev_or_zero,
  -- LEAD(col): the value of col from the NEXT row in partition order
  -- Returns NULL for the last row (no next row)
  LEAD(amount)       OVER (PARTITION BY rep ORDER BY sale_date) AS next_amount,
  -- Period-over-period change (NULL for first row)
  amount - LAG(amount) OVER (PARTITION BY rep ORDER BY sale_date) AS change,
  -- Percentage change: NULLIF prevents division by zero
  ROUND(
    (amount - LAG(amount) OVER (PARTITION BY rep ORDER BY sale_date))
    / NULLIF(LAG(amount) OVER (PARTITION BY rep ORDER BY sale_date), 0) * 100,
    1
  ) AS pct_change
FROM sales
ORDER BY rep, sale_date;

-- Step-by-step for Alice (PARTITION BY rep = 'Alice', ORDER BY sale_date):
-- Iteration 1: sale_date=2024-01-05, amount=1200, prev=NULL,  change=NULL,   pct=NULL
-- Iteration 2: sale_date=2024-01-12, amount= 800, prev=1200,  change=-400,   pct=-33.3%
-- Iteration 3: sale_date=2024-02-03, amount=1500, prev= 800,  change=+700,   pct=+87.5%

-- ═══════════════════════════════════════════════════════
-- 3. RUNNING TOTAL and MOVING AVERAGE — frame specification
-- ═══════════════════════════════════════════════════════
SELECT
  rep,
  sale_date,
  amount,

  -- Running total (cumulative sum per rep, ordered by sale_date)
  -- Frame: ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  -- = all rows from the partition start up to and including the current row
  SUM(amount) OVER (
    PARTITION BY rep
    ORDER BY sale_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total,

  -- 2-row moving average: current row + 1 preceding row
  -- Frame: ROWS BETWEEN 1 PRECEDING AND CURRENT ROW = 2-row sliding window
  ROUND(AVG(amount) OVER (
    PARTITION BY rep
    ORDER BY sale_date
    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
  ), 2) AS moving_avg_2,

  -- Grand total for this rep across ALL their sales (no ORDER BY = entire partition)
  -- No ORDER BY in OVER → default frame = entire partition (not a running total)
  SUM(amount) OVER (PARTITION BY rep) AS rep_total,

  -- Share of rep's total for this individual sale
  ROUND(amount / SUM(amount) OVER (PARTITION BY rep) * 100, 1) AS pct_of_total,

  -- Cumulative percentage of rep's total (running_total / rep_total)
  ROUND(
    SUM(amount) OVER (
      PARTITION BY rep ORDER BY sale_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) / SUM(amount) OVER (PARTITION BY rep) * 100,
    1
  ) AS cumulative_pct

FROM sales
ORDER BY rep, sale_date;

-- Step-by-step for Alice (rep_total = 1200 + 800 + 1500 = 3500):
-- sale_date=2024-01-05: amount=1200, running=1200, moving_avg=1200.00, pct=34.3%, cum_pct= 34.3%
-- sale_date=2024-01-12: amount= 800, running=2000, moving_avg=1000.00, pct=22.9%, cum_pct= 57.1%
-- sale_date=2024-02-03: amount=1500, running=3500, moving_avg=1150.00, pct=42.9%, cum_pct=100.0%

-- ═══════════════════════════════════════════════════════
-- 4. FIRST_VALUE, LAST_VALUE, NTH_VALUE — positional access
-- ═══════════════════════════════════════════════════════
SELECT
  rep,
  sale_date,
  amount,

  -- FIRST_VALUE: always returns the first row's value in the partition (by ORDER BY)
  -- Frame MUST cover the entire partition — otherwise default frame (CURRENT ROW) limits it
  FIRST_VALUE(amount) OVER (
    PARTITION BY rep ORDER BY sale_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS first_sale,

  -- LAST_VALUE: the most common gotcha in window functions
  -- DEFAULT frame = RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  -- → LAST_VALUE with default frame = current row's own value (completely useless)
  -- SOLUTION: always specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  LAST_VALUE(amount) OVER (
    PARTITION BY rep ORDER BY sale_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING  -- ← MANDATORY for correct result
  ) AS last_sale,

  -- NTH_VALUE: the Nth value in the window (NULL if fewer than N rows)
  -- Here: second-highest sale amount per region
  NTH_VALUE(amount, 2) OVER (
    PARTITION BY region ORDER BY amount DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS second_highest_in_region

FROM sales;

-- ⚠️ LAST_VALUE GOTCHA ILLUSTRATED:
-- WRONG (default frame): LAST_VALUE returns 1200 for Alice's first row, 800 for second, etc.
--   (= current row's own value, because frame ends at CURRENT ROW)
-- RIGHT (explicit frame): LAST_VALUE returns 1500 for ALL of Alice's rows
--   (= the last value in the entire partition)

-- ═══════════════════════════════════════════════════════
-- 5. NTILE — divide rows into N equal-sized buckets
-- ═══════════════════════════════════════════════════════
SELECT
  rep,
  amount,
  -- Quartile: bucket 1 = lowest 25%, bucket 4 = highest 25%
  NTILE(4) OVER (ORDER BY amount) AS quartile,
  -- Decile: useful for identifying top-10% performers
  NTILE(10) OVER (ORDER BY amount) AS decile
FROM sales;
-- With 8 rows and NTILE(4): 2 rows per bucket
-- amount  | quartile | decile
-- --------+----------+-------
-- 700.00  |    1     |   1
-- 800.00  |    1     |   2
-- 950.00  |    2     |   3
-- 1100.00 |    2     |   5
-- 1200.00 |    3     |   6
-- 1500.00 |    3     |   8
-- 1800.00 |    4     |   9
-- 2000.00 |    4     |  10

-- ═══════════════════════════════════════════════════════
-- 6. REAL-WORLD: Monthly sales report with MoM growth
-- ═══════════════════════════════════════════════════════
WITH monthly_sales AS (
  -- Step 1: Aggregate to monthly totals per rep
  SELECT
    rep,
    DATE_TRUNC('month', sale_date) AS month,
    SUM(amount) AS monthly_total
  FROM sales
  GROUP BY rep, DATE_TRUNC('month', sale_date)
),
with_window AS (
  -- Step 2: Apply window functions on monthly aggregates
  SELECT
    rep,
    month,
    monthly_total,
    -- Previous month's total for MoM growth calculation
    LAG(monthly_total) OVER (PARTITION BY rep ORDER BY month) AS prev_month,
    -- 3-month rolling average (current + 2 preceding months)
    AVG(monthly_total) OVER (
      PARTITION BY rep ORDER BY month
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS rolling_3m_avg,
    -- Rank each rep by monthly total within each month (cross-rep comparison)
    RANK() OVER (PARTITION BY month ORDER BY monthly_total DESC) AS monthly_rank,
    -- Year-to-date cumulative total per rep
    SUM(monthly_total) OVER (PARTITION BY rep ORDER BY month) AS ytd_total
  FROM monthly_sales
)
-- Step 3: Compute derived metrics in outer query (MoM % requires prev_month)
SELECT
  rep,
  TO_CHAR(month, 'YYYY-MM') AS month,
  monthly_total,
  ROUND(prev_month, 2) AS prev_month,
  -- Month-over-month growth percentage (NULL for first month of each rep)
  ROUND(
    (monthly_total - prev_month) / NULLIF(prev_month, 0) * 100,
    1
  ) AS mom_growth_pct,
  ROUND(rolling_3m_avg, 2) AS rolling_3m_avg,
  monthly_rank,
  ROUND(ytd_total, 2) AS ytd_total
FROM with_window
ORDER BY rep, month;

-- Sample output:
-- rep   | month   | monthly_total | prev_month | mom_growth_pct | rolling_3m_avg | monthly_rank | ytd_total
-- ------+---------+---------------+------------+----------------+----------------+--------------+----------
-- Alice | 2024-01 | 2000.00       | NULL       | NULL           | 2000.00        | 2            | 2000.00
-- Alice | 2024-02 | 1500.00       | 2000.00    | -25.0%         | 1750.00        | 2            | 3500.00
-- Bob   | 2024-01 | 2050.00       | NULL       | NULL           | 2050.00        | 1            | 2050.00
-- Bob   | 2024-02 |  700.00       | 2050.00    | -65.9%         | 1375.00        | 3            | 2750.00
-- Carol | 2024-01 | 2000.00       | NULL       | NULL           | 2000.00        | 2            | 2000.00
-- Carol | 2024-02 | 1800.00       | 2000.00    | -10.0%         | 1900.00        | 1            | 3800.00`,
      rw: {
        ex: [
          'Stripe uses window functions for fraud detection: LAG computes transaction velocity (time since last transaction per card) without self-joins',
          'Airbnb uses NTILE for host quality tiers: hosts are ranked by booking rates and bucketed into performance quartiles for feature access decisions',
          'Uber uses running SUM() OVER with hourly partitions for real-time surge pricing calculations across geographic zones',
          'Shopify uses RANK() OVER(PARTITION BY shop_id ORDER BY revenue DESC) to identify each merchant\'s top products for recommendation features',
        ],
        cs: 'A SaaS analytics team needed to compute a 30-day rolling churn rate per customer segment. Their initial approach used self-joins across 30 date offsets — the query took 8 minutes on 50M rows. Rewritten with `AVG(churn_flag) OVER(PARTITION BY segment ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)`, the query ran in 12 seconds using a single sequential scan with a sliding-frame window. The key insight: window functions scan the sorted data once and maintain a running frame state, while self-joins re-scan the same data 30 times.',
      },
    },

    interview: {
      q: 'How would you find the top 3 products by revenue for each category using window functions? Walk through each step.',
      a: 'I\'d use ROW_NUMBER() partitioned by category, ordered by revenue descending, in a CTE. Step 1: compute revenue per product per category (GROUP BY). Step 2: in a CTE, apply ROW_NUMBER() OVER(PARTITION BY category ORDER BY revenue DESC) — this assigns 1 to the highest-revenue product in each category. Step 3: in the outer query, filter WHERE rn <= 3. I use ROW_NUMBER (not RANK) because it guarantees exactly 3 rows per category even with ties — RANK could return 4+ rows if there are ties at position 3. I cannot put the WHERE rn <= 3 in the same level as the window function because window functions execute after WHERE.',
      fu: [
        'What is the difference between RANK and DENSE_RANK? When would you use each?',
        'Why can\'t you filter on a window function result in the WHERE clause?',
        'What is the LAST_VALUE gotcha and how do you fix it?',
        'What is the difference between ROWS and RANGE in a frame specification?',
        'How does OVER(PARTITION BY x ORDER BY y) differ from OVER(PARTITION BY x)?',
      ],
    },
  },

  {
    id: 'postgres-ctes-recursive',
    cat: 'postgres',
    color: '#336791',
    icon: '🔁',
    title: 'PostgreSQL CTEs, Recursive Queries & Advanced Patterns',
    tag: 'A CTE is a named subquery — recursive CTEs traverse graphs and hierarchies without application-side loops',
    overview:
      'Common Table Expressions (WITH clause) break complex queries into readable named steps. Recursive CTEs (WITH RECURSIVE) enable iterative traversal of hierarchical or graph data — org charts, bill-of-materials, route planning — without application-side loops. PostgreSQL 12+ inlines non-recursive CTEs by default (no longer an optimization fence). LATERAL joins enable correlated subqueries as joins, powering efficient top-N-per-group queries. DISTINCT ON provides a PostgreSQL-specific shorthand for selecting one row per group.',

    components: [
      {
        name: 'CTE (WITH clause)',
        icon: '📝',
        role: 'Named temporary result set — makes complex queries readable and composable',
        detail:
          'A CTE (WITH clause) defines a named subquery that can be referenced multiple times in the main query. Primary benefit: readability — break a complex query into logical named steps. In PostgreSQL 12+, non-recursive CTEs without side effects (no INSERT/UPDATE/DELETE) are inlined (the optimizer can push predicates inside and optimize across the CTE boundary). In PostgreSQL 11 and below, CTEs were ALWAYS materialized — acting as "optimization fences" that prevented the optimizer from pushing conditions inside. Use `WITH cte AS MATERIALIZED (...)` in PG12+ to explicitly force materialization.',
      },
      {
        name: 'Recursive CTE (WITH RECURSIVE)',
        icon: '🔄',
        role: 'Self-referencing query for hierarchical and graph traversal',
        detail:
          'WITH RECURSIVE enables a query to reference itself. Structure: anchor query (base case — initial rows) UNION ALL recursive query (references the CTE name, adds more rows). PostgreSQL maintains a "working table" initialized with anchor rows. Each iteration feeds the working table to the recursive term, producing new rows appended to the result and replacing the working table. Iteration stops when the recursive term returns no new rows. Cycle detection is essential for graph data: maintain a `path` array of visited IDs and use `WHERE id != ALL(path)`. Always add a `depth < N` guard as a safety limit.',
      },
      {
        name: 'LATERAL Join',
        icon: '↔️',
        role: 'Correlated subquery usable as a join — enables per-row subqueries with LIMIT',
        detail:
          'LATERAL allows a subquery in the FROM clause to reference columns from tables appearing earlier in the FROM clause — a correlated subquery expressed as a join. The key power: you can use ORDER BY + LIMIT inside the LATERAL subquery, which executes once per outer row. This enables "top-N per group" queries with true per-group LIMIT — impossible with a simple join. When the inner table has an index on the correlation column, each LATERAL execution is an O(1) index lookup — often faster than window functions for small N.',
      },
      {
        name: 'DISTINCT ON',
        icon: '1️⃣',
        role: 'PostgreSQL-specific: return the first row per group in a defined ordering',
        detail:
          '`SELECT DISTINCT ON (customer_id) * FROM orders ORDER BY customer_id, created_at DESC` returns exactly one row per customer_id — the row with the latest created_at (because of ORDER BY). DISTINCT ON is a PostgreSQL extension not in standard SQL. It is faster than `ROW_NUMBER() OVER(PARTITION BY customer_id ORDER BY created_at DESC) = 1` for top-1-per-group because it avoids computing window function state for all rows. An index on `(customer_id, created_at DESC)` enables an index scan that directly returns the first row per group.',
      },
    ],

    howItWorks:
      'CTE materialization in PostgreSQL versions: PG11 and below always materialized CTEs (computing the result once, storing it in a temp table, preventing optimizer from looking inside). PG12+ changed the default: non-recursive CTEs without side effects are inlined — the optimizer can push WHERE conditions inside and optimize across the CTE boundary. Code that relied on PG11 materialization as a "fence" (e.g., to prevent re-evaluation of volatile functions) may behave differently after upgrading. Mitigation: add `AS MATERIALIZED` to force materialization, or test CTE-heavy queries thoroughly after major version upgrades.\n\nRecursive CTE execution model (PostgreSQL\'s implementation):\n1. Execute the anchor query → populate the "working table" with initial rows\n2. Execute the recursive term, substituting the CTE name with the current working table → produces "new rows"\n3. Append new rows to the "result table"\n4. Replace the working table with the new rows\n5. Repeat from step 2 until the working table is empty (recursive term produced no rows)\n6. Return the entire result table\n\nCycle detection: in a tree (acyclic), cycle detection is optional but good practice. In a general graph (cyclic), it is mandatory. Maintain a `path` array of visited node IDs. In the recursive term, add `WHERE new_node.id != ALL(current.path)` to skip already-visited nodes. Also add `AND depth < 50` or similar as a hard safety limit.\n\nLATERAL execution: PostgreSQL executes the LATERAL subquery once for each row in the outer relation. If the outer table has 10,000 customers and the LATERAL fetches 3 orders per customer using an index on `orders(customer_id, created_at DESC)`, the total cost is 10,000 index lookups × 3 rows each — often much cheaper than sorting all orders and applying ROW_NUMBER(). Without LATERAL, achieving per-group LIMIT requires window functions or correlated subqueries that cannot use indexes as efficiently.\n\nDISTINCT ON implementation: PostgreSQL sorts the result set by the DISTINCT ON keys first, then by any additional ORDER BY keys. It then scans the sorted result and returns only the first row for each distinct key combination. The ORDER BY clause must begin with the DISTINCT ON columns. An index that matches the ORDER BY exactly turns this into an index scan that skips duplicate keys — extremely efficient.',

    decision: {
      choose: [
        'Use CTEs to break complex queries into named readable steps — especially when the same subresult is referenced multiple times',
        'Use WITH RECURSIVE for tree traversal (org charts, category hierarchies, threaded comments), bill-of-materials, and graph path-finding',
        'Use LATERAL for efficient top-N-per-group queries when N is small and the inner table is indexed',
        'Use DISTINCT ON for top-1-per-group queries — simpler and often faster than ROW_NUMBER() = 1',
        'Use MATERIALIZED keyword in PG12+ to force CTE fence behavior when you need to prevent optimizer from pushing predicates inside',
      ],
      avoid: [
        'Do not use recursive CTEs on cyclic graph data without cycle detection — query will run indefinitely',
        'Do not assume CTE materialization in PG12+ — always add MATERIALIZED explicitly if you need fence behavior',
        'Do not use LATERAL when a simple JOIN is sufficient — LATERAL adds per-row execution overhead',
        'Do not use recursive CTEs for very deep hierarchies without a depth limit — protect against unexpected cycles or deeply nested data',
        'Do not use DISTINCT ON when you need top-N (N > 1) — use ROW_NUMBER() in a CTE instead',
      ],
      vs: [
        {
          name: 'Recursive CTE vs application-side loop',
          when: 'Recursive CTE: single database round-trip, handles unlimited depth, database optimizes the join. Application loop: N+1 queries (one per level), much higher latency for deep hierarchies, harder to paginate.',
        },
        {
          name: 'LATERAL vs window function for top-N',
          when: 'LATERAL: better when N is small (1–10) and inner table is well-indexed — O(outer_rows × N) with index. Window function: better when N is large or inner table lacks the right index — processes all rows in one pass.',
        },
        {
          name: 'CTE vs subquery',
          when: 'CTE: when the result is referenced multiple times, or when readability matters. Subquery: when the result is used only once and inlining is fine. In PG12+, CTEs without MATERIALIZED are functionally equivalent to subqueries for the optimizer.',
        },
      ],
    },

    failures: [
      {
        name: 'CTE materialization fence removed after PostgreSQL 12 upgrade',
        cause:
          'In PG11, a CTE always materialized — acting as an optimization fence. Code intentionally relied on this to prevent re-evaluation of volatile functions or to force a specific join order. Upgrading to PG12+ removes the fence; the optimizer inlines the CTE and may choose a different (sometimes worse) plan.',
        symptom:
          'After a PostgreSQL major version upgrade, query performance changes unexpectedly. Some queries become faster, others slower. Volatile function side effects may differ.',
        fix:
          'Add `AS MATERIALIZED` to any CTE where you explicitly need the fence: `WITH cte AS MATERIALIZED (...)`. Run `EXPLAIN` on CTE-heavy queries before and after upgrade. Test in staging with production query patterns.',
        severity: 'medium',
      },
      {
        name: 'Infinite loop in recursive CTE due to cyclic graph',
        cause:
          'A recursive CTE traverses a graph (e.g., org chart where an employee\'s manager_id accidentally points back to a subordinate, forming a cycle). Without cycle detection, the recursive term keeps producing rows indefinitely.',
        symptom:
          'Query never terminates. PostgreSQL consumes increasing memory as the result table grows without bound. Server may OOM. Cancel with `pg_cancel_backend(pid)`.',
        fix:
          'Add `WHERE new_node.id != ALL(current.path)` using a path array. Add `AND depth < 50` as a hard safety limit. Before running recursive queries on user-supplied graph data, validate that the graph is acyclic using a separate cycle-detection query.',
        severity: 'high',
      },
    ],

    a: {
      v: 'Recipe with named steps and a "repeat until done" instruction',
      t: 'CTEs and Recursive Queries',
      tx: 'A CTE is like breaking a complex recipe into named preparation steps: "Step 1: prepare the sauce (set aside). Step 2: prepare the pasta (set aside). Step 3: combine." Each step has a name and can be referenced in later steps. A recursive CTE is like an instruction that says "repeat: take each node, find its children, add them to the list, repeat with the children — until no children remain." It\'s a loop written as a SQL query. LATERAL is like "for each guest at the table, run to the kitchen and fetch their 3 favorite dishes" — the kitchen trip (inner query) is customized per guest (outer row).',
      s: 'CTE = named recipe step. Recursive CTE = loop-until-empty instruction. LATERAL = correlated per-row subquery. DISTINCT ON = "return only the first occurrence of each key."',
    },

    te: {
      def: 'CTEs (WITH) name subqueries for reuse and readability. Recursive CTEs (WITH RECURSIVE) iterate anchor + recursive terms until empty, enabling tree/graph traversal in SQL. In PG12+, non-recursive CTEs are inlined by default (not fences). LATERAL allows FROM subqueries to reference outer columns. DISTINCT ON returns the first row per key in a defined ordering.',
      types: [
        { n: 'Non-recursive CTE', d: 'Named subquery — inlined in PG12+ unless MATERIALIZED specified' },
        { n: 'Recursive CTE', d: 'Self-referencing query — anchor UNION ALL recursive term, iterates until empty' },
        { n: 'Writable CTE', d: 'CTE with INSERT/UPDATE/DELETE — always materialized, enables multi-step DML' },
        { n: 'LATERAL join', d: 'FROM subquery that references outer columns — per-row execution with LIMIT support' },
        { n: 'DISTINCT ON', d: 'PostgreSQL extension — one row per key in defined ordering' },
      ],
      when: 'Use recursive CTEs for any hierarchical or graph data that requires traversal: org charts, product category trees, threaded comments, dependency graphs, network paths. Use LATERAL for per-row top-N queries with small N and good indexes. Use DISTINCT ON as a simpler alternative to ROW_NUMBER() = 1 for top-1-per-group.',
      trade: 'Recursive CTEs always materialize (they cannot be inlined — self-reference requires state). Very deep recursion or wide graphs may produce large intermediate result sets. LATERAL executes the subquery once per outer row — if the outer table is large and the inner query is expensive, performance degrades linearly. DISTINCT ON requires the ORDER BY to start with the DISTINCT ON columns — adds sorting overhead if no suitable index exists.',
      code: `-- ═══════════════════════════════════════════════════════
-- 1. CTE — breaking complex queries into named readable steps
-- ═══════════════════════════════════════════════════════
-- Goal: "Find customers who spent over $10,000 in 2024 and show their most recent order"

WITH
  -- Step 1: Compute 2024 totals per customer, filter to high-value only
  customer_2024 AS (
    SELECT customer_id, SUM(total) AS total_2024
    FROM orders
    WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
    GROUP BY customer_id
    HAVING SUM(total) > 10000
    -- In PG12+, this CTE is inlined — the optimizer can push the JOIN with users inside
    -- In PG11, this was materialized — rows computed once, stored in temp table
  ),
  -- Step 2: Most recent order per high-value customer (DISTINCT ON is efficient here)
  latest_orders AS (
    SELECT DISTINCT ON (o.customer_id)
      o.customer_id, o.id AS order_id, o.total, o.status, o.created_at
    FROM orders o
    -- JOIN inside the CTE to limit the DISTINCT ON to high-value customers only
    JOIN customer_2024 c ON c.customer_id = o.customer_id
    -- DISTINCT ON picks the FIRST row per customer_id in this ordering
    -- = the row with the latest created_at per customer
    ORDER BY o.customer_id, o.created_at DESC
  )
-- Step 3: Join CTEs with users table for final output
SELECT
  u.name,
  u.email,
  c.total_2024,
  lo.order_id        AS latest_order_id,
  lo.total           AS latest_order_total,
  lo.status          AS latest_order_status,
  lo.created_at      AS latest_order_date
FROM customer_2024 c
JOIN latest_orders lo ON lo.customer_id = c.customer_id
JOIN users u           ON u.id = c.customer_id
ORDER BY c.total_2024 DESC;

-- To force PG12+ materialization (fence behavior — optimizer cannot look inside):
WITH customer_2024 AS MATERIALIZED (
  SELECT customer_id, SUM(total) AS total_2024
  FROM orders
  WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
  GROUP BY customer_id
  HAVING SUM(total) > 10000
)
SELECT * FROM customer_2024;

-- ═══════════════════════════════════════════════════════
-- 2. RECURSIVE CTE — org chart traversal
-- ═══════════════════════════════════════════════════════
CREATE TABLE employees (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  manager_id  INT REFERENCES employees(id),  -- NULL for the root (CEO)
  salary      NUMERIC(10,2),
  department  TEXT
);

-- Sample data: Alice (id=5) is VP Engineering, reporting to CEO (id=1)
-- Bob (id=6) and Carol (id=7) report to Alice
-- Dave (id=8) reports to Bob; Eve (id=9) reports to Carol
INSERT INTO employees VALUES
  (1, 'CEO',   NULL, 500000, 'Executive'),
  (5, 'Alice', 1,    200000, 'Engineering'),
  (6, 'Bob',   5,    150000, 'Engineering'),
  (7, 'Carol', 5,    160000, 'Engineering'),
  (8, 'Dave',  6,    120000, 'Engineering'),
  (9, 'Eve',   7,    130000, 'Engineering');

-- Find all reports under Alice (id=5) — the entire subtree
WITH RECURSIVE org_tree AS (
  -- ── ANCHOR QUERY: starting point — Alice herself ──────
  SELECT
    id, name, manager_id, salary, department,
    0 AS depth,             -- Alice is at depth 0
    ARRAY[id] AS path       -- path tracks visited IDs for cycle detection
  FROM employees
  WHERE id = 5              -- start from Alice

  UNION ALL

  -- ── RECURSIVE TERM: find direct reports of each person in the working table ──
  SELECT
    e.id, e.name, e.manager_id, e.salary, e.department,
    t.depth + 1,            -- increment depth for each level down
    t.path || e.id          -- append this employee's ID to the path
  FROM employees e
  JOIN org_tree t ON e.manager_id = t.id   -- employee reports to someone in working table
  WHERE e.id != ALL(t.path)                -- CYCLE GUARD: skip already-visited IDs
    AND t.depth < 10                        -- SAFETY LIMIT: stop at depth 10
)
SELECT
  depth,
  REPEAT('  ', depth) || name AS indented_name,  -- ASCII tree indentation
  department,
  salary,
  path                                             -- shows the ancestry chain
FROM org_tree
ORDER BY path;  -- path ordering gives correct tree order (breadth-first level order)

-- Step-by-step execution trace:
-- ── Iteration 0 (anchor): SELECT ... WHERE id=5
--    working_table = [(id=5, name='Alice', depth=0, path=[5])]
--    result_table  = [(id=5, name='Alice', depth=0, path=[5])]
--
-- ── Iteration 1 (recursive): JOIN employees ON manager_id IN (working_table IDs = {5})
--    Finds: Bob(6), Carol(7) — both have manager_id=5
--    new rows: [(id=6,'Bob',depth=1,path=[5,6]), (id=7,'Carol',depth=1,path=[5,7])]
--    Append to result_table. Replace working_table with new rows.
--
-- ── Iteration 2 (recursive): manager_id IN {6, 7}
--    Finds: Dave(8) for Bob(6), Eve(9) for Carol(7)
--    new rows: [(id=8,'Dave',depth=2,path=[5,6,8]), (id=9,'Eve',depth=2,path=[5,7,9])]
--    Append to result_table. Replace working_table.
--
-- ── Iteration 3 (recursive): manager_id IN {8, 9}
--    No employees have manager_id=8 or manager_id=9
--    Recursive term returns 0 rows → working_table is empty → STOP
--
-- Final result_table: Alice, Bob, Carol, Dave, Eve

-- ── RECURSIVE CTE: Generate a date series (gap detection) ────────────────
WITH RECURSIVE date_series AS (
  -- Anchor: first date
  SELECT '2024-01-01'::DATE AS dt
  UNION ALL
  -- Recursive: add one day until end of year
  SELECT dt + 1 FROM date_series WHERE dt < '2024-12-31'
)
-- LEFT JOIN to find days with no orders (gap detection in time series)
SELECT
  ds.dt,
  COALESCE(COUNT(o.id), 0) AS order_count
FROM date_series ds
LEFT JOIN orders o ON DATE(o.created_at) = ds.dt
GROUP BY ds.dt
HAVING COALESCE(COUNT(o.id), 0) = 0  -- show only gap days
ORDER BY ds.dt;

-- ═══════════════════════════════════════════════════════
-- 3. LATERAL JOIN — top-N per group efficiently
-- ═══════════════════════════════════════════════════════
-- Goal: "For each customer, get their 3 most recent orders"
-- Problem: a simple JOIN returns ALL orders; we need LIMIT PER CUSTOMER
-- Solution: LATERAL allows ORDER BY + LIMIT inside the subquery, per outer row

-- Index that makes each LATERAL execution an O(1) index lookup:
CREATE INDEX idx_orders_customer_date ON orders (customer_id, created_at DESC);

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  c.id   AS customer_id,
  c.name AS customer_name,
  recent.order_id,
  recent.total,
  recent.created_at
FROM customers c
CROSS JOIN LATERAL (
  -- This subquery executes ONCE PER CUSTOMER ROW in the outer query
  SELECT o.id AS order_id, o.total, o.created_at
  FROM orders o
  WHERE o.customer_id = c.id     -- ← references outer table column (the LATERAL part)
  ORDER BY o.created_at DESC
  LIMIT 3                         -- ← 3 most recent per customer
) AS recent
ORDER BY c.id, recent.created_at DESC;

-- Execution plan (with good index):
-- Nested Loop
--   -> Seq Scan on customers     (outer: 10,000 rows)
--   -> Index Scan on orders      (inner: 3 rows per customer via idx_orders_customer_date)
-- Total: 10,000 index lookups × 3 rows = 30,000 rows read from orders (not all 50M rows!)

-- Compare: window function approach requires processing ALL rows:
-- WITH ranked AS (
--   SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
--   FROM orders  -- scans ALL 50M rows, sorts all of them
-- )
-- SELECT * FROM ranked WHERE rn <= 3;
-- → Full sort of 50M rows before filtering — much slower for large tables

-- ── DISTINCT ON — top-1-per-group (faster than ROW_NUMBER() = 1) ──────────
-- Index: CREATE INDEX ON orders (customer_id, created_at DESC)
-- DISTINCT ON requires ORDER BY to start with the DISTINCT ON key columns:
SELECT DISTINCT ON (customer_id)
  customer_id,
  id         AS order_id,
  total,
  status,
  created_at
FROM orders
ORDER BY customer_id, created_at DESC;
-- PostgreSQL sorts by (customer_id, created_at DESC), then returns the first row
-- per customer_id — i.e., the row with the latest created_at.
-- With the index: this becomes an index scan that skips to the first entry per key.

-- ═══════════════════════════════════════════════════════
-- 4. EXPLAIN ANALYZE — reading the output
-- ═══════════════════════════════════════════════════════
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.name, SUM(o.total) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.name
ORDER BY revenue DESC
LIMIT 10;

-- How to read EXPLAIN ANALYZE output:
--
-- Seq Scan on orders
--   cost=0.00..45820.00 rows=500000 width=20
--   actual time=0.05..389.2 rows=487230 loops=1
--   Buffers: shared hit=1234 read=22408
--
-- cost=X..Y    → X = startup cost (before first row), Y = total cost (planner units, not ms)
-- rows=N       → planner's estimated row count (compare with 'actual rows')
-- actual time  → milliseconds: X=time to first row, Y=total time for this node
-- loops=N      → how many times this node was executed (Nested Loop inner = 1 per outer row)
-- Buffers: shared hit=N  → N 8KB pages served from the shared buffer cache (fast)
--          shared read=M → M 8KB pages read from disk (slow — look here first)
--
-- Node types:
-- Seq Scan        → full table scan — every page read sequentially. Check if index should exist.
-- Index Scan      → index used, then heap accessed for each matching row (random I/O)
-- Index Only Scan → index has all needed columns — zero heap reads. Fastest for point queries.
-- Bitmap Heap Scan→ builds a bitmap of matching pages from the index, then reads pages in order
--                   (medium — amortizes random I/O with sorted access)
-- Hash Join       → hashes smaller table, probes with larger. Good for large unsorted joins.
-- Nested Loop     → for each outer row, execute inner query. Fast when inner is indexed.
-- Merge Join      → both inputs sorted on join key. Good for pre-sorted large-large joins.
--
-- Red flags in EXPLAIN:
-- "rows=1 (actual rows=50000)"  → bad estimate → run ANALYZE or increase statistics target
-- "Buffers: read=100000 hit=10" → 99% disk reads → query needs better caching or indexes
-- "loops=50000" on expensive node → N+1 problem inside SQL (check Nested Loop inner)

-- Increase statistics target for a skewed column (default=100, max=10000):
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500;
ANALYZE orders;  -- recompute statistics with new target

-- ── EXISTS vs IN vs JOIN — which to use when ──────────────────────────────
-- "Find customers who placed at least one order in 2024"

-- EXISTS (semi-join, short-circuits at first match per customer):
-- Best when the subquery can match many rows — stops after finding the first match.
-- PostgreSQL's optimizer often converts IN to EXISTS internally.
EXPLAIN ANALYZE
SELECT id, name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.id
    AND o.created_at >= '2024-01-01'
);
-- Plan: Nested Loop Semi Join → Hash Join or Index Scan on orders
-- "Semi Join" = stop after first match (does not need DISTINCT)

-- IN with subquery (similar performance to EXISTS in modern PostgreSQL):
SELECT id, name FROM customers
WHERE id IN (
  SELECT DISTINCT customer_id FROM orders
  WHERE created_at >= '2024-01-01'
);
-- PostgreSQL converts this to a semi-join internally — same plan as EXISTS usually

-- JOIN with DISTINCT (use when you also need order data in the result):
SELECT DISTINCT c.id, c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= '2024-01-01';
-- JOIN can produce duplicate customer rows (one per matching order)
-- DISTINCT removes them — but DISTINCT requires a sort or hash step
-- Prefer EXISTS when you don't need data from orders (avoids DISTINCT overhead)`,
      rw: {
        ex: [
          'Slack uses recursive CTEs to traverse message thread hierarchies for threaded reply counts without application-side loops',
          'GitHub uses recursive CTEs for repository fork graphs — finding all forks of a repository requires traversing the fork tree to arbitrary depth',
          'Salesforce uses LATERAL joins for "most recent activity per account" queries across their CRM data — LATERAL with LIMIT 1 and an index is faster than a correlated subquery for millions of accounts',
          'Shopify uses DISTINCT ON for "latest price per product variant" queries — avoids the overhead of window function ranking across their entire product catalog',
        ],
        cs: 'An e-commerce company needed to generate category-level reports including all subcategories to arbitrary depth (electronics > phones > smartphones > Android phones > ...). Their initial approach loaded the entire category tree into the application (10,000 categories, 200KB) and filtered in code — 3 round trips per report, 800ms latency. Replacing with a single recursive CTE query reduced this to one round trip, 45ms. The recursive CTE also naturally handled new category depths added in the future without code changes.',
      },
    },

    interview: {
      q: 'Walk me through how you would find all employees in an org hierarchy under a given manager using a recursive CTE. What happens at each iteration?',
      a: 'I\'d use WITH RECURSIVE. The anchor query selects the starting manager by ID, initializing depth=0 and a path array with just that ID. The recursive term JOINs the employees table to the CTE itself on `employee.manager_id = cte.id` — finding all direct reports of everyone in the current "working table." I include cycle detection (`WHERE employee.id != ALL(cte.path)`) to handle any accidental cycles in the data, and a depth limit (`AND cte.depth < 50`) as a safety guard. Each iteration: PostgreSQL takes the current working table (initially just the root manager), finds all employees whose manager_id appears in that table, adds them to the result, and replaces the working table with only the newly found rows. When no new employees are found, the working table is empty and the recursion stops. The final result is all rows ever added to the result table — the entire subtree.',
      fu: [
        'How do you detect cycles in a recursive CTE?',
        'What is the difference between UNION and UNION ALL in a recursive CTE?',
        'In PostgreSQL 12+, when would you explicitly add MATERIALIZED to a non-recursive CTE?',
        'When would you choose LATERAL over a window function for top-N-per-group?',
        'What is DISTINCT ON and how does it differ from ROW_NUMBER() = 1?',
      ],
    },
  },
];
