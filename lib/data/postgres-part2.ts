import { Concept } from '../types';

export const POSTGRES_PART2: Concept[] = [
  {
    id: 'postgres-wal',
    cat: 'postgres',
    color: '#336791',
    icon: '📝',
    title: 'WAL (Write-Ahead Logging)',
    tag: 'Write the receipt before touching the cash register',
    overview:
      'WAL (Write-Ahead Logging) is the foundation of PostgreSQL durability: every change is written to an append-only log in pg_wal/ before it is applied to the actual data files. This guarantees that even a mid-write crash can be recovered by replaying the log from the last consistent checkpoint. WAL is also the engine behind streaming replication, sending a continuous stream of WAL records to standby servers in near real time. Every byte written to the log is identified by a Log Sequence Number (LSN), a monotonically increasing 64-bit offset that is used for replication lag measurement, point-in-time recovery (PITR), and conflict detection.',
    components: [
      {
        name: 'WAL Writer',
        icon: '✍️',
        role: 'Flushes WAL buffers to disk',
        detail:
          'A background process that periodically flushes the shared WAL buffer (wal_buffers) to pg_wal/ segment files. It runs at most every wal_writer_delay milliseconds (default 200 ms), ensuring WAL is persisted even without a COMMIT.',
      },
      {
        name: 'WAL Buffer',
        icon: '🗄️',
        role: 'In-memory staging area for WAL records',
        detail:
          'A ring buffer in shared memory (wal_buffers, default 1/32 of shared_buffers) where backends append WAL records before the WAL Writer flushes them. A COMMIT forces an immediate flush and fsync so the transaction is durable.',
      },
      {
        name: 'Checkpoint Process',
        icon: '🏁',
        role: 'Periodically syncs dirty data pages to disk',
        detail:
          'Writes all dirty pages from shared_buffers to the data files and then updates pg_control with the new redo LSN. Controlled by checkpoint_timeout (default 5 min) and max_wal_size (default 1 GB). A checkpoint defines how far back WAL replay must go after a crash.',
      },
      {
        name: 'WAL Archiver',
        icon: '📦',
        role: 'Copies completed WAL segments for PITR',
        detail:
          'When archive_mode = on and archive_command is set, this process ships completed 16 MB WAL segment files to an external location (S3, NFS). These archived segments enable point-in-time recovery to any LSN within the retained window.',
      },
      {
        name: 'WAL Sender',
        icon: '📡',
        role: 'Streams WAL to standby servers',
        detail:
          'One WAL Sender process per connected standby reads from pg_wal/ (or a replication slot) and sends records over a replication protocol connection. The standby\'s WAL Receiver writes them locally and the startup/recovery process applies them.',
      },
    ],
    howItWorks:
      'When a backend executes a DML statement it first constructs WAL records describing the logical change (INSERT record, heap tuple delta, index update, etc.) and appends them to the WAL buffer. On COMMIT the buffer is flushed and an fsync guarantees the data reached durable storage before the client receives a success acknowledgement. Only after this point can the actual heap and index pages be updated in shared_buffers — those dirty pages are written lazily by the bgwriter and the checkpoint process.\n\nCheckpoints are the heartbeat of WAL management. At each checkpoint all dirty shared_buffers pages are written to disk, and the new checkpoint LSN is recorded in pg_control. After a crash, recovery replays every WAL record from the most recent checkpoint LSN up to the end of the log, reconstructing any changes that had not yet been flushed to the data files. The distance between checkpoints therefore controls recovery time: max_wal_size bounds how much WAL can accumulate between checkpoints, while checkpoint_timeout sets a maximum age.\n\nFor replication and PITR, wal_level must be set to replica (the default for streaming replication) or logical (required for logical replication). At the replica level every heap change is recorded with enough information to reconstruct the row on a standby. WAL segments are 16 MB files named with their starting LSN; once a segment is no longer needed locally it can be archived via archive_command and later removed. wal_keep_size (PG13+, replacing wal_keep_segments) ensures a minimum volume of recent WAL is retained on disk so slow standbys can catch up without requiring a replication slot.',
    decision: {
      choose: [
        'You need crash safety — WAL is mandatory and always on in PostgreSQL.',
        'Streaming replication is required for HA or read scaling.',
        'Point-in-time recovery (PITR) is needed: enable archive_mode and set archive_command.',
        'Logical replication is required: set wal_level = logical.',
        'You want to monitor replication lag precisely using LSN arithmetic.',
      ],
      avoid: [
        'Turning off full_page_writes — it risks torn-page corruption after a crash and should stay on.',
        'Setting wal_level = minimal on a primary that has standbys — replicas will be unable to connect.',
        'Ignoring pg_wal/ disk usage — a full pg_wal/ partition causes an immediate Postgres crash.',
        'Setting max_wal_size too small — it forces over-frequent checkpoints, hurting write throughput.',
        'Leaving wal_keep_size at 0 with slow standbys but no replication slots — the replica can fall so far behind that WAL is recycled before it can be consumed.',
      ],
      vs: [
        {
          name: 'Redo Log (Oracle/MySQL InnoDB)',
          when: 'Conceptually equivalent — all major RDBMS use write-ahead logging. PostgreSQL\'s WAL is also used as the replication transport, whereas MySQL separates the redo log from the binlog.',
        },
        {
          name: 'Shadow Paging',
          when: 'An alternative crash-recovery strategy (used by older SQLite) that avoids a log but is slower for random writes. WAL is universally preferred for OLTP workloads.',
        },
      ],
    },
    failures: [
      {
        name: 'pg_wal/ disk full',
        cause: 'Archived WAL not consumed fast enough, or a replication slot holding WAL for a dead subscriber.',
        symptom: 'Postgres aborts with "no space left on device" in pg_wal/; all writes stop immediately.',
        fix: 'Free disk space, then drop the stale replication slot (pg_drop_replication_slot). Add monitoring on pg_wal/ usage and slot lag.',
        severity: 'critical',
      },
      {
        name: 'Checkpoint too frequent',
        cause: 'max_wal_size set too small relative to write throughput, causing constant forced checkpoints.',
        symptom: 'LOG: "checkpoint occurring too frequently" in server logs; write throughput spikes and drops with each checkpoint cycle.',
        fix: 'Increase max_wal_size and checkpoint_timeout. Monitor pg_stat_bgwriter.checkpoints_req vs checkpoints_timed — req should be near zero.',
        severity: 'high',
      },
      {
        name: 'Standby falls off replication',
        cause: 'wal_keep_size too small (and no replication slot), so WAL segments the standby needs are recycled.',
        symptom: 'Standby recovery process logs "requested WAL segment has already been removed"; standby falls into a recovery restart loop.',
        fix: 'Increase wal_keep_size, use a replication slot, or restore from base backup + WAL archive. Consider pg_basebackup for fast re-sync.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A restaurant receipt printer',
      t: 'Every order is printed on a receipt roll before the cook starts. If the kitchen burns down, you rebuild exactly what was being prepared from the receipts — not from the half-cooked food.',
      tx: 'WAL is PostgreSQL\'s receipt roll. Every change is written to the log before it touches the actual data files. If the server crashes mid-operation, Postgres replays the log from the last checkpoint to reconstruct exactly what was in flight. Checkpoints are like end-of-shift reconciliations — they verify everything on the receipt roll has made it into the real ledger, so only the most recent receipts need checking after a crash. WAL segments are shipped to standbys just like duplicate receipt rolls sent to a backup office, allowing them to stay in sync in real time.',
      s: 'WAL writes changes to an append-only log before touching data files, enabling crash recovery by replaying the log from the last checkpoint, and powering streaming replication by shipping those same log segments to standbys.',
    },
    te: {
      def: 'WAL (Write-Ahead Logging) is a durability mechanism where every data modification is first recorded in a sequential append-only log. PostgreSQL writes WAL records to the WAL buffer, flushes them to pg_wal/ on COMMIT, and only then lazily applies changes to heap/index data files. Recovery replays WAL from the last checkpoint LSN.',
      types: [
        {
          n: 'wal_level = minimal',
          d: 'Minimum WAL needed for crash recovery only. Skips logging for COPY, CREATE TABLE AS SELECT, etc. Cannot be used for replication or PITR.',
        },
        {
          n: 'wal_level = replica',
          d: 'Default since PG9.6. Adds full-page writes and enough logical information for streaming replication and base backups (pg_basebackup). Required for hot standby.',
        },
        {
          n: 'wal_level = logical',
          d: 'Adds row-level change information needed for logical decoding and logical replication (CREATE PUBLICATION / CREATE SUBSCRIPTION). Slightly higher WAL volume than replica.',
        },
        {
          n: 'WAL Archiving (PITR)',
          d: 'Completed 16 MB WAL segment files are copied to external storage via archive_command. Combined with a base backup, any LSN in the archived window can be restored (point-in-time recovery).',
        },
        {
          n: 'Replication Slots',
          d: 'A server-side cursor that tracks the minimum LSN a subscriber has consumed. Prevents WAL recycling before the slowest consumer has caught up — at the cost of pg_wal/ growth if the consumer is offline.',
        },
      ],
      when: 'WAL is always active in PostgreSQL. Tune it when setting up replication (wal_level, max_wal_senders, wal_keep_size), enabling PITR (archive_mode, archive_command), or diagnosing performance (checkpoint frequency, WAL write bottlenecks measured with pg_stat_bgwriter).',
      trade:
        'WAL provides durability and replication at the cost of write amplification — every change is written twice (WAL then heap). full_page_writes doubles write volume after a checkpoint because entire 8 KB pages are logged on their first modification. Synchronous replication (synchronous_commit = on) adds latency proportional to network RTT to each COMMIT. Logical replication carries more overhead than streaming replication because row-level decoding is CPU-intensive.',
      code: `-- Current WAL position and file name
SELECT pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn());

-- How far a standby is behind (run on primary)
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  (sent_lsn - replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;

-- Trigger an immediate checkpoint
CHECKPOINT;

-- Pause / resume WAL replay on a standby
SELECT pg_wal_replay_pause();
SELECT pg_wal_replay_resume();

-- Check checkpoint statistics
SELECT checkpoints_timed, checkpoints_req,
       checkpoint_write_time, checkpoint_sync_time
FROM pg_stat_bgwriter;`,
      rw: {
        ex: [
          'Supabase ships WAL events to connected clients via logical replication, powering real-time subscriptions without polling.',
          'AWS RDS PostgreSQL Multi-AZ uses synchronous WAL streaming to a standby in another AZ for automatic failover with RPO ≈ 0.',
          'Heroku Postgres continuous protection archives WAL every 60 seconds, enabling PITR to any minute in the past 4 days.',
          'Debezium CDC connector tails PostgreSQL logical WAL (pgoutput plugin) to stream row changes to Kafka topics.',
        ],
        cs: 'A fintech startup using Heroku Postgres suffered a bad migration that silently corrupted a payments table at 14:32. Because WAL archiving was enabled, the DBA ran pg_restore with recovery_target_time = \'14:31:00\' on a clone, extracted the pre-corruption rows, and patched production — total data loss: zero rows, total downtime: 22 minutes.',
      },
    },
    interview: {
      q: 'Explain how WAL enables both crash recovery and streaming replication in PostgreSQL.',
      a: 'WAL is an append-only sequential log where every change is durably recorded before it is applied to data files. On crash, Postgres replays WAL from the last checkpoint LSN to reconstruct any in-flight transactions. For streaming replication, WAL Sender processes read new WAL records from pg_wal/ and stream them to standby WAL Receivers over a persistent connection. The standby\'s recovery process applies those records to its own data files in the same order, keeping it a byte-for-byte replica of the primary. Because the log is sequential and identified by LSN, lag is precisely measurable and the system can resume after a brief disconnection by requesting records from the last received LSN.',
      fu: [
        'What is the difference between synchronous_commit = remote_write and synchronous_commit = on?',
        'How does a replication slot prevent WAL from being recycled, and what is the risk if the subscriber goes offline?',
        'What happens to pg_wal/ disk usage if archive_command fails repeatedly?',
      ],
    },
  },

  {
    id: 'postgres-partitioning',
    cat: 'postgres',
    color: '#336791',
    icon: '🗃️',
    title: 'Table Partitioning',
    tag: 'Split a giant filing cabinet into monthly drawers',
    overview:
      'Table partitioning in PostgreSQL divides one logical table into multiple physical child tables (partitions), each storing a subset of rows. Introduced as declarative partitioning in PostgreSQL 10, it lets the query planner skip irrelevant partitions entirely (partition pruning), dramatically reducing I/O for range and equality queries. The three main strategies are RANGE (continuous intervals such as date ranges), LIST (discrete enumerated values such as region or status), and HASH (modular distribution for even spread). Partitioning also enables efficient data lifecycle management: old partitions can be detached and archived in milliseconds because DETACH PARTITION is a metadata-only operation.',
    components: [
      {
        name: 'Partition Key',
        icon: '🔑',
        role: 'Column(s) that determine which partition a row belongs to',
        detail:
          'Defined in PARTITION BY (column). Every INSERT, UPDATE that changes the key, and constraint check uses the partition key to route or validate a row. The key must appear in every unique constraint on the partitioned table.',
      },
      {
        name: 'Range Bound',
        icon: '📏',
        role: 'Defines the inclusive lower and exclusive upper boundary of a RANGE partition',
        detail:
          'Declared with FOR VALUES FROM (x) TO (y). Postgres enforces that each row\'s key falls within exactly one partition\'s bounds. Gaps between bounds are illegal unless a DEFAULT partition is present.',
      },
      {
        name: 'Constraint Exclusion / Partition Pruner',
        icon: '✂️',
        role: 'Eliminates irrelevant partitions at plan time',
        detail:
          'The planner inspects partition bounds against query predicates. If WHERE created_at >= \'2024-01-01\' AND created_at < \'2024-02-01\' matches only one partition, the others are never scanned. Enable_partition_pruning (default on) controls this. Runtime pruning (PG11+) also eliminates partitions during execution for parameterised queries.',
      },
      {
        name: 'Default Partition',
        icon: '🗑️',
        role: 'Catch-all for rows that do not match any defined partition',
        detail:
          'Created with FOR VALUES DEFAULT. Prevents INSERT errors when a new range or list value has no explicit partition. Adding a new non-overlapping partition while a DEFAULT partition exists requires a table scan of the DEFAULT partition to verify no existing row belongs to the new range.',
      },
      {
        name: 'Partition-Wise Join/Aggregate',
        icon: '🤝',
        role: 'Allows joins and aggregates to operate partition by partition in parallel',
        detail:
          'When two partitioned tables share the same partition key and bounds, enable_partitionwise_join and enable_partitionwise_aggregate allow the planner to join matching partitions directly, enabling parallelism and reducing hash table sizes.',
      },
    ],
    howItWorks:
      'A partitioned table is a virtual "parent" table with no physical storage of its own — all rows live in child partition tables. When you INSERT a row, the PostgreSQL router reads the partition key value, compares it against partition bounds, and writes the row to the matching child heap file. If no partition matches and no DEFAULT partition exists, the INSERT raises an error. Updates that change the partition key transparently DELETE from the old partition and INSERT into the new one (tuple routing).\n\nThe query planner is the primary beneficiary of partitioning. During planning, it evaluates each partition\'s check constraints against the query\'s WHERE clause. Partitions whose bounds cannot possibly satisfy the predicate are pruned from the plan — they never appear in EXPLAIN output and generate zero I/O. For time-series data (e.g., monthly partitions on an events table) this means a query for "last 7 days" scans at most two monthly partitions out of hundreds.\n\nData lifecycle management is the operational killer feature. DETACH PARTITION orders_2022 separates the child table from the parent in a sub-second metadata operation (no row movement). The detached table becomes an independent, queryable table that can be compressed, moved to cold storage (tablespace), or dropped. ATTACH PARTITION reintegrates a table if its rows satisfy the new bounds — Postgres scans the table to verify the constraint unless a CHECK constraint matching the bound already exists, in which case the operation is instant.',
    decision: {
      choose: [
        'Tables exceed tens of millions of rows and queries almost always filter on a date or categorical column.',
        'You need instant data expiration — DROP or DETACH old partitions instead of slow DELETE.',
        'Time-series workloads where only recent partitions are hot and older ones are cold/archivable.',
        'Load distribution across tablespaces or disks — place hot partitions on fast NVMe, cold on HDD.',
        'Partition-wise parallel aggregates on large fact tables in analytical queries.',
      ],
      avoid: [
        'Small tables — partitioning adds planner overhead with no I/O benefit.',
        'Queries that never filter on the partition key — all partitions will be scanned (full fan-out).',
        'When you need global unique constraints that span all partitions — PostgreSQL cannot enforce a UNIQUE constraint across partitions without including the partition key.',
        'Foreign keys pointing to partitioned tables — they are supported since PG12 but have limitations.',
      ],
      vs: [
        {
          name: 'Sharding (Citus / application-level)',
          when: 'Partitioning keeps all data on one PostgreSQL server; sharding distributes across multiple servers. Use sharding when a single Postgres node cannot hold or process the data volume.',
        },
        {
          name: 'Inheritance-based partitioning (pre-PG10)',
          when: 'Legacy approach using table inheritance and triggers. Declarative partitioning (PG10+) is faster, has planner support, and requires no trigger overhead — always prefer declarative.',
        },
      ],
    },
    failures: [
      {
        name: 'Partition key missing from WHERE clause',
        cause: 'Query predicates do not reference the partition key, so the planner cannot prune any partitions.',
        symptom: 'EXPLAIN shows every child partition in the plan; query time grows linearly with the number of partitions.',
        fix: 'Always include the partition key in WHERE. If the access pattern never uses the key, reconsider the partitioning strategy or add a partial index instead.',
        severity: 'high',
      },
      {
        name: 'Global UNIQUE constraint impossible',
        cause: 'PostgreSQL enforces uniqueness per partition, not globally across all partitions, unless the partition key is included in the unique index.',
        symptom: 'INSERT of a duplicate key in a different partition succeeds silently; application-level duplicates appear.',
        fix: 'Include the partition key in every UNIQUE and PRIMARY KEY constraint. For true global uniqueness use a separate deduplication table or a sequence.',
        severity: 'high',
      },
      {
        name: 'DEFAULT partition blocker for new ranges',
        cause: 'A DEFAULT partition exists and adding a new explicit partition requires Postgres to scan DEFAULT to ensure no rows conflict with the new bounds.',
        symptom: 'ALTER TABLE ... ATTACH PARTITION / add new range partition takes minutes or hours on a large DEFAULT partition.',
        fix: 'Pre-create explicit partitions before data arrives so DEFAULT stays empty, or periodically vacuum DEFAULT and move rows into the correct partitions.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'A filing cabinet with monthly drawers',
      t: 'Instead of one giant drawer where you rifle through every document to find March invoices, you open the "March" drawer directly. Old drawers (years past) are pulled out and archived to offsite storage in seconds.',
      tx: 'PostgreSQL partitioning works the same way. The "partitioned table" is the cabinet label — there are no documents in the top drawer itself. Each monthly child partition is an actual drawer with its own heap file. When you query for March data, the planner reads the drawer labels and only opens the March drawer. When January 2022 data is no longer needed, DETACH PARTITION removes the drawer label in milliseconds; the drawer (table) can then be moved or dropped without touching any other drawer.',
      s: 'Declarative table partitioning splits a large logical table into physical child tables by RANGE, LIST, or HASH, enabling the planner to skip irrelevant partitions and supporting instant data archival via DETACH PARTITION.',
    },
    te: {
      def: 'PostgreSQL declarative partitioning (PG10+) divides a logical parent table into child partition tables using a PARTITION BY clause. Rows are physically stored only in child partitions. The planner uses partition bounds and query predicates to prune irrelevant partitions, and DML is routed to the correct child at runtime.',
      types: [
        {
          n: 'RANGE partitioning',
          d: 'Each partition holds rows where the key falls in [FROM, TO). Ideal for time-series tables partitioned by month/year. Enables sequential archival and pruning on date range queries.',
        },
        {
          n: 'LIST partitioning',
          d: 'Each partition holds rows matching a discrete set of values (e.g., region IN (\'us-east\', \'us-west\')). Good for categorical columns with low cardinality and skewed query patterns by category.',
        },
        {
          n: 'HASH partitioning',
          d: 'Each partition holds rows where hash(key) % modulus = remainder. Distributes rows evenly across N partitions with no natural ordering. Used for user_id sharding on a single Postgres node.',
        },
        {
          n: 'Sub-partitioning',
          d: 'A child partition can itself be partitioned (e.g., RANGE by year, then LIST by region within each year). Useful for very large tables with two dominant access dimensions.',
        },
        {
          n: 'Default partition',
          d: 'Catches rows that do not match any explicit partition. Prevents INSERT errors as new values appear but must be managed carefully to avoid becoming a bloat sink.',
        },
      ],
      when: 'Use partitioning when a table is large enough (>50M rows or >10 GB) that sequential scans are painful, queries almost always filter on the partition key, and data has a natural lifecycle (e.g., expire data older than 1 year). Avoid partitioning small tables or tables with no dominant filter column.',
      trade:
        'Partitioning adds planner overhead (partition pruning logic) for queries on small result sets. Global unique constraints and foreign key references become more complex. INSERT throughput slightly decreases due to tuple routing. However, for large time-series or categorical tables the I/O reduction from pruning and the operational simplicity of partition-level archival far outweigh the costs.',
      code: `-- Create a range-partitioned table by month
CREATE TABLE events (
  id        BIGSERIAL,
  user_id   BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE events_2024_01
  PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE events_2024_02
  PARTITION OF events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Default partition for unexpected values
CREATE TABLE events_default
  PARTITION OF events DEFAULT;

-- Insert is transparently routed
INSERT INTO events (user_id, event_type, created_at)
VALUES (42, 'click', '2024-01-15 10:00:00+00');

-- Confirm partition pruning in EXPLAIN
EXPLAIN (ANALYZE, FORMAT TEXT)
SELECT * FROM events
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';
-- Expected: only events_2024_01 appears in plan

-- Detach old partition for archival (metadata-only, instant)
ALTER TABLE events DETACH PARTITION events_2024_01;`,
      rw: {
        ex: [
          'TimescaleDB auto-creates monthly RANGE partitions (chunks) on time-series tables, enabling per-chunk compression and retention policies.',
          'Shopify partitions their orders table by shop_id HASH across 16 partitions to balance index sizes across PostgreSQL instances.',
          'A SaaS analytics platform partitions its events table by month; expired partitions are detached and moved to a cheaper tablespace on HDD.',
          'Gitlab partitions the ci_builds table by RANGE on created_at, pruning 95% of partitions for queries on recent CI pipeline data.',
        ],
        cs: 'An e-commerce company had a 2 TB orders table causing 45-second DELETE runs every night to purge 90-day-old data. After migrating to monthly RANGE partitions, the nightly archival job became ALTER TABLE orders DETACH PARTITION orders_3months_ago — a 12-millisecond metadata operation. Query performance on recent orders improved 8x from partition pruning, and the table\'s bloat problem disappeared because old partitions are dropped cleanly.',
      },
    },
    interview: {
      q: 'How does partition pruning work in PostgreSQL, and what can prevent it from working?',
      a: 'During query planning, PostgreSQL compares each partition\'s check constraints (derived from its bounds) against the WHERE clause predicates. If a partition\'s range or list is provably disjoint from the predicate, the planner omits it from the query plan entirely — those partition\'s heap files are never opened. Since PG11, runtime pruning also eliminates partitions for parameterised queries where the value is only known at execution time. Pruning fails when the WHERE clause does not reference the partition key, when the predicate uses a non-immutable function that the planner cannot evaluate at plan time, or when enable_partition_pruning is off.',
      fu: [
        'Why can\'t you create a UNIQUE constraint on a partitioned table without including the partition key?',
        'What is the performance trade-off of sub-partitioning and when does it make sense?',
        'How does DETACH PARTITION differ from DELETE in terms of locking and performance?',
      ],
    },
  },

  {
    id: 'postgres-replication',
    cat: 'postgres',
    color: '#336791',
    icon: '🔁',
    title: 'PostgreSQL Replication',
    tag: 'A live carbon copy — updated in real time',
    overview:
      'PostgreSQL supports two complementary replication modes: streaming replication, which ships raw WAL records from primary to standby for a byte-for-byte physical copy, and logical replication, which ships decoded row-level changes for selective, cross-version table synchronisation. Streaming replication is the standard HA and read-scaling mechanism, with synchronous_commit controlling the durability/latency trade-off. Logical replication, built on the publication/subscription model, enables zero-downtime major-version upgrades, selective table replication, and change-data-capture pipelines. Tools like Patroni and pg_auto_failover layer automated leader election, health checking, and failover on top of both modes.',
    components: [
      {
        name: 'WAL Sender',
        icon: '📤',
        role: 'Streams WAL from primary to each standby',
        detail:
          'One backend process per connected replica. Reads from pg_wal/ or a replication slot and pushes records over a walsender protocol connection. max_wal_senders limits concurrency.',
      },
      {
        name: 'WAL Receiver',
        icon: '📥',
        role: 'Receives WAL on the standby and writes it locally',
        detail:
          'Connects to the primary\'s WAL Sender, writes incoming WAL records to the standby\'s pg_wal/, and notifies the startup/recovery process to apply them. Reports flush and apply LSN back to the primary for lag tracking.',
      },
      {
        name: 'Replication Slot',
        icon: '📌',
        role: 'Persists consumer position so WAL is not recycled prematurely',
        detail:
          'A server-side cursor (physical or logical) that records the minimum LSN a consumer has confirmed. Postgres will not recycle WAL segments that the slot still needs. A slot for an offline consumer causes unbounded pg_wal/ growth — monitor pg_replication_slots.lag_in_bytes.',
      },
      {
        name: 'Publication',
        icon: '📢',
        role: 'Defines which tables (and operations) to replicate logically',
        detail:
          'CREATE PUBLICATION pub FOR TABLE orders, users publishes row-level INSERT/UPDATE/DELETE events for those tables. FOR ALL TABLES publishes every table. The wal_level must be logical.',
      },
      {
        name: 'Subscription',
        icon: '📬',
        role: 'Connects to a publication and applies changes to the subscriber database',
        detail:
          'CREATE SUBSCRIPTION sub CONNECTION \'...\' PUBLICATION pub creates a logical replication worker that performs an initial table sync (COPY) and then streams ongoing changes. The subscriber can be a different PostgreSQL major version or a different database on the same cluster.',
      },
    ],
    howItWorks:
      'In streaming replication, the primary\'s WAL Sender reads records from pg_wal/ and pushes them to the standby\'s WAL Receiver over a persistent TCP connection using the PostgreSQL replication protocol. The standby writes received WAL to its own pg_wal/ and the startup process applies it to the data files. The standby sends back periodic status messages reporting the latest LSN it has written, flushed, and applied — the primary tracks these in pg_stat_replication. With hot_standby = on, the standby accepts read-only queries, making it a read replica.\n\nThe synchronous_commit parameter controls when the primary acknowledges a COMMIT to the client. At the default (local) the primary fsyncs its own WAL and responds immediately, risking up to one WAL segment of data loss if it crashes before the standby has received those records. Setting synchronous_commit = remote_apply waits until the standby has applied the WAL and the changes are visible to readers — achieving RPO = 0 at the cost of commit latency equal to the network round-trip.\n\nLogical replication decodes WAL into row-level operations using the output plugin (pgoutput, built-in since PG10). A publication on the primary exposes a stream of decoded changes for subscribed tables. The subscriber\'s background logical replication worker connects, performs an initial COPY-based sync, and then streams ongoing changes in transaction order. Because the protocol is row-level and schema-independent, a PostgreSQL 15 subscriber can consume from a PostgreSQL 16 primary (and vice versa), enabling rolling major-version upgrades with near-zero downtime.',
    decision: {
      choose: [
        'HA with automatic failover: use streaming replication + Patroni or pg_auto_failover.',
        'Read scaling: hot standby read replicas on streaming replication.',
        'Zero-downtime major version upgrade: use logical replication to replicate from old to new version, then promote the new version.',
        'CDC / event streaming: use logical replication with Debezium or pgoutput to feed Kafka.',
        'Selective table sync between databases or tenants: logical replication with a targeted publication.',
      ],
      avoid: [
        'Logical replication when DDL changes are frequent — schema changes are not replicated and must be applied manually to the subscriber.',
        'Physical standbys for cross-version compatibility — streaming replication requires the same major version.',
        'Replication slots for high-churn subscribers without monitoring — offline slots accumulate WAL and can fill pg_wal/.',
        'synchronous_commit = on over a high-latency WAN link without accepting the commit latency cost.',
      ],
      vs: [
        {
          name: 'MySQL binlog replication',
          when: 'MySQL uses a separate binary log for replication (statement, row, or mixed format). PostgreSQL logical replication is conceptually similar to MySQL row-based binlog replication. PostgreSQL streaming replication (physical) has no direct MySQL equivalent — MySQL\'s InnoDB redo log stays on one node.',
        },
        {
          name: 'Citus distributed tables',
          when: 'Replication copies data to a standby on the same schema; Citus shards data across multiple nodes for horizontal write scaling. Use Citus when a single primary cannot absorb the write load.',
        },
      ],
    },
    failures: [
      {
        name: 'Replication lag under heavy write load',
        cause: 'Standby apply throughput (single-threaded pre-PG14 for physical, single-threaded per table for logical) cannot keep up with primary write rate.',
        symptom: 'pg_stat_replication.replay_lag grows continuously; read replicas serve stale data; synchronous replicas block primary commits.',
        fix: 'Upgrade to PG14+ (parallel apply for logical replication). Tune max_parallel_apply_workers_per_subscription. For physical replicas, ensure standby I/O matches primary write bandwidth. Consider promoting a cascading standby closer to the write source.',
        severity: 'high',
      },
      {
        name: 'Replication slot causing WAL accumulation',
        cause: 'A logical or physical replication slot exists for a subscriber that has gone offline or is consuming very slowly.',
        symptom: 'pg_wal/ grows unboundedly; disk alarm fires; eventually Postgres crashes with "no space left on device".',
        fix: 'Monitor pg_replication_slots.confirmed_flush_lsn and set max_slot_wal_keep_size (PG13+) to cap WAL retention per slot. Drop slots for permanently dead subscribers.',
        severity: 'critical',
      },
      {
        name: 'Logical replication initial sync on large tables',
        cause: 'CREATE SUBSCRIPTION triggers a full COPY of each subscribed table, holding an ACCESS SHARE lock and consuming significant I/O on both sides.',
        symptom: 'Subscription takes hours to initial-sync a large table; primary I/O spikes; replication worker crashes and restarts from scratch.',
        fix: 'Use copy_data = false for large tables, pre-populate the subscriber via pg_dump/restore, then re-enable replication at the correct LSN. Or use parallel_apply and tune max_sync_workers_per_subscription.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A live carbon-copy typewriter',
      t: 'Every keystroke on the primary typewriter is instantly reproduced on one or more carbon-copy machines in other rooms. Readers can look at any carbon copy without disturbing the typist. If the primary typewriter breaks, a carbon copy is promoted to take over.',
      tx: 'Streaming replication makes the standby a byte-for-byte physical copy of the primary — every WAL record (keystroke) is transmitted and applied in order. Hot standby allows read queries to run against the copy. Logical replication is like choosing which pages get carbon-copied: you publish specific tables and the subscriber only receives those row-level changes. Patroni is the manager who watches the typewriters and, if the primary stops, declares a carbon copy the new primary and updates the DNS "typewriter room" sign so applications reconnect automatically.',
      s: 'PostgreSQL replication ships WAL records (streaming) or decoded row changes (logical) to one or more standbys, providing HA read scaling and CDC pipelines, with synchronous_commit controlling the durability vs latency trade-off.',
    },
    te: {
      def: 'PostgreSQL replication propagates changes from a primary server to one or more standbys. Streaming replication ships raw WAL records for a physical byte-for-byte copy. Logical replication decodes WAL into row-level changes and ships them to subscribers, allowing selective table replication and cross-version compatibility.',
      types: [
        {
          n: 'Asynchronous streaming replication',
          d: 'Default mode. Primary commits and responds to the client immediately after local fsync. Standby applies WAL asynchronously. RPO > 0 (up to a few seconds of data loss possible on failover).',
        },
        {
          n: 'Synchronous streaming replication',
          d: 'synchronous_commit = remote_apply ensures the standby has applied and made visible the changes before the primary confirms the commit. RPO = 0, but commit latency increases by one network RTT.',
        },
        {
          n: 'Logical replication (publication/subscription)',
          d: 'Row-level changes decoded from WAL are streamed to subscribers. Supports cross-version, cross-database, and selective table replication. Schema changes are not automatically replicated.',
        },
        {
          n: 'Cascading replication',
          d: 'A standby itself acts as a WAL sender to downstream standbys, reducing the WAL sending load on the primary. Useful for geo-distributed read replicas.',
        },
        {
          n: 'Logical decoding / CDC',
          d: 'External tools (Debezium, pg_logical) consume the logical replication protocol to build event streams in Kafka or other systems without creating a full subscriber database.',
        },
      ],
      when: 'Use streaming replication for HA and read scaling in all production deployments. Use logical replication for major-version upgrades, selective sync, and CDC pipelines. Always monitor replication lag (pg_stat_replication, pg_replication_slots) and set max_slot_wal_keep_size to protect against slot-induced disk exhaustion.',
      trade:
        'Streaming replication is low overhead but requires the same major Postgres version and replicates the entire cluster (you cannot replicate a single table). Logical replication supports selective tables and cross-version but has higher CPU cost (WAL decoding), does not replicate DDL, and initial sync locks tables temporarily. Synchronous replication trades commit latency for RPO = 0.',
      code: `-- === Logical Replication Setup ===
-- On the PRIMARY (wal_level must be logical in postgresql.conf):
CREATE PUBLICATION orders_pub
  FOR TABLE orders, order_items;

-- On the SUBSCRIBER:
CREATE SUBSCRIPTION orders_sub
  CONNECTION 'host=primary-db port=5432 dbname=myapp user=replicator password=secret'
  PUBLICATION orders_pub;

-- Monitor replication lag on PRIMARY:
SELECT
  application_name,
  client_addr,
  state,
  write_lag,
  flush_lag,
  replay_lag,
  pg_size_pretty(sent_lsn - replay_lsn) AS replay_lag_size
FROM pg_stat_replication
ORDER BY replay_lag DESC NULLS LAST;

-- Monitor replication slots:
SELECT
  slot_name,
  slot_type,
  active,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS lag
FROM pg_replication_slots;`,
      rw: {
        ex: [
          'AWS RDS PostgreSQL uses synchronous streaming replication to a Multi-AZ standby for automatic failover with sub-30-second RTO.',
          'Supabase logical replication feeds real-time change events to connected browser clients via a WebSocket multiplexer.',
          'Debezium consumes PostgreSQL logical WAL to build event-sourcing pipelines, streaming row changes into Apache Kafka for downstream microservices.',
          'GitLab uses Patroni-managed streaming replication with a VIP (virtual IP) for automatic failover of its PostgreSQL primary without application reconfiguration.',
        ],
        cs: 'A payment processor needed to upgrade from PostgreSQL 14 to 16 with zero downtime. They set up logical replication from the PG14 primary to a new PG16 standby, replicated all tables, verified lag was under 100 ms, then performed a planned failover during low traffic: update connection string, disable writes on old primary, wait for PG16 to apply remaining WAL, promote PG16. Total write unavailability: 8 seconds. Zero data loss.',
      },
    },
    interview: {
      q: 'What is the difference between streaming replication and logical replication in PostgreSQL, and when would you choose each?',
      a: 'Streaming replication ships raw WAL records to create a byte-for-byte physical copy of the entire primary cluster. It is fast, low overhead, and the gold standard for HA standby servers and read replicas, but it requires the same PostgreSQL major version and replicates everything. Logical replication decodes WAL into row-level INSERT/UPDATE/DELETE events and ships them to a subscriber — which can be a different major version, a different database, or even a different system like Kafka. I would use streaming replication for HA and read scaling within a major version, and logical replication for zero-downtime major version upgrades, selective table sync, and CDC pipelines. The key operational risk with logical replication is that DDL is not replicated and replication slots can accumulate unbounded WAL if the subscriber is slow or offline.',
      fu: [
        'How does synchronous_commit = remote_apply differ from remote_write in terms of guarantees and latency?',
        'What happens to a replication slot if the subscriber goes offline for 48 hours and max_slot_wal_keep_size is not set?',
        'How would you perform a zero-downtime major version upgrade from PostgreSQL 15 to 16 using logical replication?',
      ],
    },
  },

  {
    id: 'postgres-vacuum',
    cat: 'postgres',
    color: '#336791',
    icon: '🧹',
    title: 'VACUUM & Table Bloat',
    tag: 'The janitor who cleans dead rows before the building floods',
    overview:
      'PostgreSQL\'s MVCC model never overwrites rows in place: an UPDATE writes a new row version (tuple) and marks the old one dead, while DELETE only marks a tuple dead without physically removing it. Dead tuples accumulate over time, wasting disk space and slowing sequential scans — this wasted space is called bloat. VACUUM reclaims dead tuple space by marking it reusable for future inserts, but it does not shrink the physical file size (only VACUUM FULL rewrites the table, at the cost of an ACCESS EXCLUSIVE lock). The autovacuum daemon runs VACUUM and ANALYZE automatically in the background, and proper tuning of its cost parameters is critical for preventing bloat in high-write workloads. Transaction ID (XID) wraparound is the most dangerous failure mode: if autovacuum cannot freeze old XIDs before they reach the 2^31 limit, PostgreSQL will force an emergency shutdown to prevent data loss.',
    components: [
      {
        name: 'Autovacuum Daemon',
        icon: '🤖',
        role: 'Automatically triggers VACUUM and ANALYZE on tables meeting thresholds',
        detail:
          'Multiple autovacuum worker processes (autovacuum_max_workers, default 3) monitor pg_stat_user_tables. A table is vacuumed when dead_tuple_count > autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor * n_live_tup (default: 50 + 20% of live rows). autovacuum_cost_delay and autovacuum_vacuum_cost_limit throttle I/O to avoid overwhelming the system.',
      },
      {
        name: 'Dead Tuple Scanner',
        icon: '🔍',
        role: 'Scans heap pages to identify dead tuples',
        detail:
          'VACUUM reads each heap page, checks each tuple\'s xmin/xmax against the oldest active transaction (OldestXmin), and marks dead tuples\' item pointers as LP_DEAD. On the next pass, those slots are freed and added to the Free Space Map.',
      },
      {
        name: 'Visibility Map',
        icon: '🗺️',
        role: 'Tracks pages where all tuples are visible to all transactions (all-visible) and all-frozen',
        detail:
          'A two-bit-per-page bitmap. VACUUM sets the all-visible bit when all tuples on a page are visible to every transaction. Index-only scans can skip heap fetches for all-visible pages. The all-frozen bit marks pages requiring no future freezing, reducing freeze overhead.',
      },
      {
        name: 'Free Space Map',
        icon: '🗂️',
        role: 'Tracks available space in each heap page for future inserts',
        detail:
          'After VACUUM marks dead tuples free, it updates the FSM with the available bytes per page. The INSERT tuple router consults the FSM to find a page with enough room, avoiding a full heap scan.',
      },
      {
        name: 'Freeze Worker',
        icon: '🧊',
        role: 'Replaces old transaction IDs with FrozenTransactionId to prevent XID wraparound',
        detail:
          'Tuples with xmin older than vacuum_freeze_min_age are frozen: their xmin is replaced with a special FrozenXID that is considered visible to all transactions regardless of the current XID counter. This prevents the 2^31 wraparound catastrophe.',
      },
    ],
    howItWorks:
      'Every PostgreSQL UPDATE creates a new row version and sets the old row\'s xmax to the updating transaction\'s XID. The old row version is invisible to future transactions but still occupies space on the heap page. DELETE similarly sets xmax without removing the bytes. These dead tuples accumulate: a table with a high update rate can become 2x or 3x its logical size, a condition called bloat. Bloat hurts sequential scan performance because Postgres reads every page including those dominated by dead tuples.\n\nVACUUM scans the heap, identifies dead tuples whose xmax is older than OldestXmin (the snapshot horizon — the oldest XID any active transaction is using), and marks those item pointers reusable. It updates the Free Space Map so future INSERTs can fill those gaps. Critically, VACUUM does not zero out the dead tuple bytes or shrink the file — the file can only grow until VACUUM FULL rewrites it. VACUUM FULL acquires an ACCESS EXCLUSIVE lock, preventing all reads and writes for the duration, which can be minutes to hours on large tables. pg_repack is the production-safe alternative: it rebuilds the table online with a trigger-based change capture mechanism.\n\nTransaction ID wraparound is the existential risk. PostgreSQL\'s XID is a 32-bit counter. When it approaches 2^31 ≈ 2.1 billion transactions ahead of the oldest unfrozen XID, Postgres emits warnings, then at the danger threshold it performs an emergency shutdown to prevent all existing rows from appearing invisible (because their xmin would be "in the future" in the wrapped-around counter). Autovacuum\'s freeze pass (triggered by vacuum_freeze_table_age) converts old XIDs to FrozenXID, permanently exempting those tuples from the wraparound check.',
    decision: {
      choose: [
        'Always run autovacuum — disabling it is almost never correct.',
        'Tune autovacuum_vacuum_scale_factor down (e.g., 0.01) for large, high-churn tables to trigger VACUUM more frequently.',
        'Use pg_repack for online table compaction instead of VACUUM FULL on production.',
        'Monitor n_dead_tup in pg_stat_user_tables and age(relfrozenxid) in pg_class to catch bloat and wraparound risk early.',
        'Set autovacuum_vacuum_cost_limit higher (e.g., 400–800) on tables that can tolerate more autovacuum I/O.',
      ],
      avoid: [
        'Running VACUUM FULL on large production tables during business hours — it holds ACCESS EXCLUSIVE for the entire rewrite.',
        'Disabling autovacuum on high-write tables expecting manual VACUUM to substitute — manual VACUUM is easily missed.',
        'Ignoring age(relfrozenxid) > 1.5 billion — you are approaching the XID wraparound danger zone.',
        'Long-running transactions — they hold OldestXmin back, preventing VACUUM from reclaiming dead tuples from that era.',
      ],
      vs: [
        {
          name: 'pg_repack',
          when: 'Use pg_repack instead of VACUUM FULL when you need to physically shrink a bloated table in production without taking a long exclusive lock.',
        },
        {
          name: 'MySQL InnoDB purge thread',
          when: 'InnoDB\'s purge thread is conceptually similar to autovacuum — it reclaims undo log space from dead row versions. PostgreSQL MVCC stores dead versions in the heap; InnoDB stores them in the undo tablespace. Neither approach is universally better, but InnoDB purge runs continuously without explicit thresholds.',
        },
      ],
    },
    failures: [
      {
        name: 'Autovacuum too slow, causing table bloat',
        cause: 'Default autovacuum cost settings throttle I/O heavily; large tables accumulate dead tuples faster than autovacuum can process them.',
        symptom: 'pg_stat_user_tables.n_dead_tup grows continuously; table file sizes balloon; sequential scans slow proportionally.',
        fix: 'Lower autovacuum_vacuum_scale_factor (to 0.01 or even 0.001 for very large tables) and raise autovacuum_vacuum_cost_limit (to 400–800). Add per-table storage parameters: ALTER TABLE big_table SET (autovacuum_vacuum_scale_factor = 0.01).',
        severity: 'high',
      },
      {
        name: 'VACUUM FULL causing extended downtime',
        cause: 'VACUUM FULL acquires ACCESS EXCLUSIVE lock and rewrites the entire table, blocking all reads and writes.',
        symptom: 'All queries to the table queue behind VACUUM FULL; application times out; monitoring shows lock waits.',
        fix: 'Use pg_repack instead for online table compaction. Schedule VACUUM FULL only during planned maintenance windows for tables where pg_repack is not applicable.',
        severity: 'high',
      },
      {
        name: 'XID wraparound emergency shutdown',
        cause: 'Autovacuum cannot freeze tuples fast enough (disabled, blocked by long transactions, or table too large) and age(relfrozenxid) approaches 2^31.',
        symptom: 'PostgreSQL logs "WARNING: database must be vacuumed within N transactions"; eventually Postgres refuses all new connections and shuts down with "database is not accepting commands to avoid wraparound data loss".',
        fix: 'Run VACUUM FREEZE on the affected table immediately. Investigate what is blocking autovacuum (long-running transactions, lock conflicts). Monitor age(relfrozenxid) and alert at 500M.',
        severity: 'critical',
      },
    ],
    a: {
      v: 'A building janitor cleaning up after a conference',
      t: 'After every session, guests leave their chairs pushed aside but do not remove them. The janitor rearranges chairs into reusable stacks (VACUUM) but does not knock down walls to make more room. If the building fills completely with abandoned chairs, everyone is locked out (XID wraparound shutdown).',
      tx: 'PostgreSQL\'s MVCC model is the conference: every UPDATE leaves an old row version (abandoned chair) that is invisible to new sessions but still takes space. VACUUM is the janitor who marks those spots reusable — but the building\'s footprint (file size) never shrinks unless the janitor completely rebuilds the room (VACUUM FULL). Autovacuum is a janitor on a schedule who tries to keep pace automatically. If old enough chairs are never cleared and the room ID counter wraps around (XID wraparound), Postgres locks the building entirely to prevent chaos.',
      s: 'VACUUM reclaims dead tuple space from MVCC updates/deletes without shrinking files; autovacuum automates this; VACUUM FULL rewrites the table at the cost of an exclusive lock; XID wraparound is the catastrophic failure if freeze does not keep pace with transaction volume.',
    },
    te: {
      def: 'PostgreSQL\'s MVCC creates dead tuples on every UPDATE and DELETE. VACUUM marks dead tuple space reusable and freezes old XIDs to prevent transaction ID wraparound. Autovacuum runs VACUUM and ANALYZE automatically based on configurable thresholds. VACUUM FULL physically rewrites the table but requires an ACCESS EXCLUSIVE lock.',
      types: [
        {
          n: 'VACUUM (standard)',
          d: 'Marks dead tuples reusable, updates the Free Space Map and Visibility Map, freezes old XIDs. Non-blocking: allows concurrent reads and writes. Does not shrink file size.',
        },
        {
          n: 'VACUUM ANALYZE',
          d: 'Runs VACUUM then ANALYZE in sequence. ANALYZE collects column statistics (pg_statistic) used by the query planner. Autovacuum runs both automatically.',
        },
        {
          n: 'VACUUM FULL',
          d: 'Rewrites the entire table into a new file, reclaiming all dead space and shrinking the file. Requires ACCESS EXCLUSIVE lock — blocks all reads and writes for the duration.',
        },
        {
          n: 'VACUUM FREEZE',
          d: 'Forces freezing of all tuples regardless of age. Used to reset age(relfrozenxid) when approaching XID wraparound. More I/O intensive than standard VACUUM.',
        },
        {
          n: 'pg_repack',
          d: 'A third-party extension that online-rewrites a bloated table without a long exclusive lock, using triggers to capture concurrent changes. The production-safe alternative to VACUUM FULL.',
        },
      ],
      when: 'VACUUM is always running via autovacuum. Tune it when: tables show high n_dead_tup; age(relfrozenxid) exceeds 200M; sequential scan performance degrades; disk usage is unexpectedly high. Run VACUUM FREEZE proactively if age approaches 500M. Use pg_repack for compaction without downtime.',
      trade:
        'Standard VACUUM is concurrent and safe but does not return space to the OS. VACUUM FULL returns space but requires exclusive access and is effectively a table rebuild — risk of long downtime. Autovacuum introduces background I/O that competes with application queries; overly aggressive settings hurt OLTP latency. Under-tuned autovacuum allows bloat and wraparound risk. The XID wraparound failure is existential: Postgres will proactively shut down to prevent data corruption.',
      code: `-- Check bloat: dead tuples per table
SELECT
  schemaname,
  relname,
  n_live_tup,
  n_dead_tup,
  round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- Check XID wraparound risk
SELECT
  datname,
  age(datfrozenxid) AS db_xid_age
FROM pg_database
ORDER BY age(datfrozenxid) DESC;

SELECT
  relname,
  age(relfrozenxid) AS table_xid_age
FROM pg_class
WHERE relkind = 'r'
ORDER BY age(relfrozenxid) DESC
LIMIT 10;

-- Per-table autovacuum tuning (apply to high-churn tables)
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_vacuum_threshold    = 100,
  autovacuum_vacuum_cost_limit   = 400
);

-- Emergency freeze (if XID age is dangerously high)
VACUUM FREEZE orders;`,
      rw: {
        ex: [
          'GitHub experienced a production XID wraparound scare on a high-write table; they now run automated age(relfrozenxid) monitoring with PagerDuty alerts at 500M.',
          'Notion uses pg_repack weekly on their largest tables to reclaim bloat from high-update block content without maintenance windows.',
          'Shopify tunes per-table autovacuum parameters for their orders and inventory tables, setting scale_factor = 0.01 to trigger VACUUM far more aggressively than the default 20%.',
          'Cloudflare runs autovacuum cost tuning per database cluster, raising cost_limit to 800 on clusters with fast NVMe storage to allow faster dead-tuple reclamation.',
        ],
        cs: 'A logistics SaaS company disabled autovacuum on their shipments table during a data migration "to speed things up." Six weeks later, the table was 4x its logical size (40 GB for 10 GB of live data), sequential scans took 12 seconds, and age(relfrozenxid) had reached 1.8 billion. Re-enabling autovacuum and running VACUUM FREEZE brought the XID age back to safe levels over 48 hours. They used pg_repack to online-reclaim 30 GB of bloat with zero downtime, then implemented automated bloat and XID-age monitoring.',
      },
    },
    interview: {
      q: 'What is PostgreSQL XID wraparound and how does VACUUM prevent it?',
      a: 'PostgreSQL uses a 32-bit transaction ID (XID) counter. Each transaction gets a new XID, and MVCC visibility is determined by comparing a row\'s xmin/xmax to the current XID. Since XIDs are 32-bit, after about 4 billion transactions the counter would wrap around — rows whose xmin is "in the future" in the wrapped counter would appear invisible to all queries, causing complete data loss. To prevent this, PostgreSQL marks old tuple XIDs as FrozenTransactionId (a special value considered visible to all transactions) when they are old enough. VACUUM and specifically autovacuum\'s freeze pass perform this freezing. If autovacuum cannot keep age(relfrozenxid) below approximately 2 billion, Postgres emits warnings and eventually forces a shutdown rather than risk wraparound corruption. The fix is VACUUM FREEZE and ensuring autovacuum can keep pace.',
      fu: [
        'Why does VACUUM not shrink the physical file size, and what are the options when you need to reclaim that space?',
        'How does a long-running transaction prevent autovacuum from reclaiming dead tuples?',
        'What is the Visibility Map and how does it help index-only scans and VACUUM performance?',
      ],
    },
  },

  {
    id: 'postgres-query-planner',
    cat: 'postgres',
    color: '#336791',
    icon: '🧠',
    title: 'Query Planner & EXPLAIN',
    tag: 'The planner chooses your route — EXPLAIN shows you the map',
    overview:
      'The PostgreSQL query planner (optimizer) transforms a parsed SQL query into an efficient execution plan by estimating the cost of every possible join order, access method, and operator combination. It relies on column-level statistics stored in pg_statistic (populated by ANALYZE) and a configurable cost model (seq_page_cost, random_page_cost, cpu_tuple_cost) to compare alternatives and select the lowest-cost plan. EXPLAIN reveals the chosen plan tree with estimated costs and row counts; EXPLAIN ANALYZE actually executes the query and shows actual rows, loops, and timing for every node, making row-estimate errors immediately visible. Understanding the planner is the single most important skill for diagnosing slow PostgreSQL queries.',
    components: [
      {
        name: 'Statistics Collector (ANALYZE)',
        icon: '📊',
        role: 'Samples table data and stores column statistics in pg_statistic',
        detail:
          'ANALYZE samples a random fraction of each table (default_statistics_target controls the sample size, default 100 meaning ~3000 rows). It records n_distinct, most-common values (MCVs), histogram bounds, and correlation for each column. The planner uses these to estimate how many rows satisfy a predicate.',
      },
      {
        name: 'Cost Estimator',
        icon: '💰',
        role: 'Assigns a numerical cost to each candidate plan node',
        detail:
          'Costs are unitless (1.0 = one sequential page fetch by default). seq_page_cost = 1.0, random_page_cost = 4.0 (tune to ~1.1 on SSD), cpu_tuple_cost = 0.01. Total plan cost = I/O cost + CPU cost. The planner selects the plan with the lowest total cost.',
      },
      {
        name: 'Plan Generator',
        icon: '🗺️',
        role: 'Enumerates candidate plans using dynamic programming (GEQO for >geqo_threshold tables)',
        detail:
          'For queries with ≤ geqo_threshold tables (default 12), the planner uses exhaustive dynamic programming to find the optimal join order. Beyond that, it switches to a Genetic Query Optimizer (GEQO) heuristic to avoid exponential planning time.',
      },
      {
        name: 'Executor',
        icon: '⚙️',
        role: 'Runs the chosen plan, pulling rows through a tree of plan nodes',
        detail:
          'The executor walks the plan tree bottom-up (volcano/iterator model). Each node\'s GetNext() returns one row at a time to its parent. Parallel query (PG9.6+) introduces a Gather or Gather Merge node that collects rows from multiple parallel worker processes.',
      },
      {
        name: 'JIT Compiler',
        icon: '⚡',
        role: 'Compiles frequently executed expressions to native machine code',
        detail:
          'PG11+ includes LLVM-based JIT compilation (jit = on). For queries scanning millions of rows, JIT compiles tuple deforming, expression evaluation, and aggregate functions to native code, reducing per-tuple CPU overhead by 20–60% for analytical queries.',
      },
    ],
    howItWorks:
      'After parsing and rewriting a SQL query, the planner receives a query tree and must produce an execution plan. It first determines the "relation access paths" for each table: Seq Scan (read all pages), Index Scan (follow B-tree or hash index), Bitmap Index Scan (collect matching page locations, sort, then heap-fetch in page order — good for 1–5% selectivity), or Index Only Scan (read from index without heap access when the visibility map says all tuples are visible). For each access path it calculates an estimated startup cost (cost to return the first row) and total cost.\n\nFor multi-table queries, the planner evaluates join strategies: Nested Loop (for small inner relations or indexed joins), Hash Join (build a hash table of the smaller relation, probe with the outer — good for medium to large unsorted equijoins), and Merge Join (sort both relations on the join key then merge — good when both sides are already sorted or an index provides ordering). The planner uses dynamic programming to find the lowest-cost join order across all permutations (up to 12 tables by default).\n\nStatistics are the planner\'s oracle. If statistics are stale (table has grown 10x since the last ANALYZE) or a column has a highly skewed distribution that histograms misrepresent, the planner\'s row estimates will be wrong. A nested loop that looks cheap with an estimated 10 inner rows becomes catastrophic with 100,000 actual rows — EXPLAIN ANALYZE will show "rows=10 actual rows=100000 loops=500" which means 50 million inner iterations. Common fixes: run ANALYZE, increase default_statistics_target for skewed columns (up to 500), create a partial index, or create CREATE STATISTICS for columns with statistical dependencies.',
    decision: {
      choose: [
        'Run EXPLAIN (ANALYZE, BUFFERS) on any query taking more than 100 ms to understand the actual plan and buffer hit rates.',
        'Run ANALYZE after large data loads or significant table changes — stale statistics cause bad plans.',
        'Increase default_statistics_target to 200–500 for highly skewed or correlated columns.',
        'Use CREATE STATISTICS for pairs of correlated columns (e.g., city and postal_code) to fix multi-column estimation errors.',
        'Set random_page_cost = 1.1 on SSD storage — the default 4.0 assumes spinning disks and overestimates the cost of index scans.',
      ],
      avoid: [
        'Using SET enable_seqscan = off or SET enable_hashjoin = off as a permanent fix — it masks the root cause (bad statistics or missing index) and can harm other queries.',
        'Ignoring "rows=X actual rows=Y" discrepancies in EXPLAIN ANALYZE — large gaps indicate statistics problems that will affect other queries too.',
        'Relying on CTEs as optimisation fences in PG12+ — since PG12, CTEs are inlined by default and are no longer guaranteed to be evaluated once.',
        'Assuming the planner always knows best — for extremely complex queries, explicit hints via pg_hint_plan or query restructuring may be necessary.',
      ],
      vs: [
        {
          name: 'MySQL query optimizer',
          when: 'MySQL uses a similar cost-based optimizer with statistics histograms (added in MySQL 8.0). PostgreSQL\'s optimizer is generally considered more sophisticated, with better join reordering, richer statistics (MCVs, extended statistics), and deeper parallelism support.',
        },
        {
          name: 'Oracle CBO (Cost-Based Optimizer)',
          when: 'Oracle\'s CBO is similarly statistics-driven. Oracle supports optimizer hints natively; PostgreSQL requires the pg_hint_plan extension. For very complex analytical queries, Oracle\'s adaptive query optimization can adjust plans mid-execution.',
        },
      ],
    },
    failures: [
      {
        name: 'Row estimate off by 1000x from stale statistics',
        cause: 'Table grew significantly or data distribution changed since the last ANALYZE; planner uses outdated histogram bounds.',
        symptom: 'EXPLAIN ANALYZE shows "rows=10 actual rows=98432" on a join; query uses Nested Loop instead of Hash Join and runs for minutes.',
        fix: 'Run ANALYZE on the affected table. Increase default_statistics_target for the column. Enable autovacuum_analyze for the table. Consider CREATE STATISTICS for correlated columns.',
        severity: 'high',
      },
      {
        name: 'Nested loop on large unsorted join',
        cause: 'Planner underestimates inner relation size (due to stale stats) and chooses Nested Loop over Hash Join; actual inner rows are large.',
        symptom: 'Query runs for minutes; EXPLAIN ANALYZE shows Nested Loop with thousands of loops on a large inner relation; high "Rows Removed by Filter" counts.',
        fix: 'Run ANALYZE, fix statistics. If the plan is still wrong, temporarily SET enable_nestloop = off to force Hash Join and confirm the plan is faster. Investigate root cause and fix statistics permanently.',
        severity: 'high',
      },
      {
        name: 'CTE preventing predicate pushdown (pre-PG12)',
        cause: 'In PostgreSQL 11 and earlier, CTEs are optimisation fences: the planner evaluates them as black boxes and cannot push outer WHERE predicates inside.',
        symptom: 'A CTE scans the full table even though the outer query filters 99% of rows; EXPLAIN shows a full sequential scan inside the CTE.',
        fix: 'Upgrade to PG12+ where CTEs are inlined by default. In older versions, rewrite the CTE as a subquery in the FROM clause, or add the predicate inside the CTE manually.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'A GPS navigation system choosing a driving route',
      t: 'The GPS knows traffic patterns (statistics), road types (access paths — highway vs side street), and intersection costs (join types). It calculates dozens of routes and picks the cheapest. EXPLAIN shows you the route it chose; EXPLAIN ANALYZE shows you the route it actually drove and how long each segment really took.',
      tx: 'The PostgreSQL query planner is the GPS. Table statistics (ANALYZE) are the traffic data: without them, the GPS assumes all roads are equally fast and takes a disastrous detour (wrong join order, unnecessary seq scan). EXPLAIN is the turn-by-turn preview before you leave. EXPLAIN ANALYZE is the post-drive trip report showing "this segment took 3 minutes but GPS estimated 10 seconds" — that discrepancy reveals where the planner\'s model was wrong. Tuning the planner is updating the GPS\'s traffic model so it consistently picks the fastest real route.',
      s: 'The PostgreSQL query planner uses column statistics and a cost model to choose the lowest-cost execution plan; EXPLAIN ANALYZE reveals the actual plan with real row counts and timing, exposing statistic errors and enabling targeted optimisation.',
    },
    te: {
      def: 'The PostgreSQL query planner is a cost-based optimizer that evaluates candidate execution plans using column statistics (pg_statistic), configurable cost parameters, and join enumeration to select the plan with the lowest estimated total cost. EXPLAIN shows the plan; EXPLAIN ANALYZE executes it and reports actual rows and timings.',
      types: [
        {
          n: 'Seq Scan',
          d: 'Reads every page of the table in order. Cheapest for large fractions of the table (>5–10% of rows) or when random I/O (index scan) would cost more. Cost scales linearly with table size.',
        },
        {
          n: 'Index Scan / Index Only Scan',
          d: 'Follows a B-tree (or other index) to find matching TIDs, then fetches heap pages. Index Only Scan skips heap fetches when the visibility map indicates all tuples on a page are visible. Best for highly selective predicates (<1–2% of rows).',
        },
        {
          n: 'Bitmap Index Scan',
          d: 'Collects all matching TIDs from one or more indexes into an in-memory bitmap, sorts by page, then fetches heap pages in page order. Eliminates random I/O for 1–10% selectivity range. Can OR/AND multiple indexes.',
        },
        {
          n: 'Hash Join',
          d: 'Builds an in-memory hash table from the smaller (inner) relation, then probes it for each outer row. Best for equijoins on large unsorted relations. Degrades to disk-based batching if work_mem is insufficient.',
        },
        {
          n: 'Merge Join',
          d: 'Requires both relations sorted on the join key (via index or Sort node). Merges them in a single pass. Best when both sides are already ordered (index scans provide ordering for free).',
        },
        {
          n: 'Nested Loop Join',
          d: 'For each outer row, executes the inner plan. Very fast when the inner relation is tiny (a few rows) or accessed via a highly selective index. Catastrophic when the inner relation is large and unindexed.',
        },
      ],
      when: 'Read EXPLAIN (ANALYZE, BUFFERS) for any slow query. Tune statistics when row estimates are off. Adjust random_page_cost to 1.1 on SSDs. Use CREATE STATISTICS for correlated columns. Enable JIT for analytical queries scanning millions of rows. Increase work_mem for queries spilling hash joins or sorts to disk.',
      trade:
        'The planner optimises based on statistics and cost estimates — if either is wrong, the plan will be suboptimal. More statistics (higher statistics_target) improve estimate accuracy but increase ANALYZE runtime and planner planning time. Increasing work_mem allows Hash Joins in memory instead of disk, but work_mem is per-sort/hash-operation per session, so setting it globally too high can exhaust RAM under concurrent load. JIT compilation has a fixed overhead (~5 ms) that hurts short OLTP queries but helps long analytical ones.',
      code: `-- Full EXPLAIN with timing and buffer information
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.id, u.email, COUNT(o.id) AS order_count
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.email
ORDER BY order_count DESC
LIMIT 10;

-- Increase statistics target for a skewed column
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500;
ANALYZE orders;

-- Create extended statistics for correlated columns
-- (e.g., city and postal_code are not independent)
CREATE STATISTICS city_postal_stats (dependencies)
  ON city, postal_code
  FROM addresses;
ANALYZE addresses;

-- Verify statistics were collected
SELECT stxname, stxkeys, stxdependencies
FROM pg_statistic_ext
JOIN pg_statistic_ext_data ON pg_statistic_ext.oid = pg_statistic_ext_data.stxoid
WHERE stxname = 'city_postal_stats';

-- Check if a query is spilling to disk (hash join / sort)
-- Look for "Batches: N" > 1 in Hash node or "Sort Method: external merge"
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table l JOIN another_large a ON l.key = a.key;`,
      rw: {
        ex: [
          'GitLab identified a 45-second query via pg_stat_statements and used EXPLAIN ANALYZE to find a 10,000x row estimate error on a correlated join; CREATE STATISTICS reduced the error to 2x and the query to 80 ms.',
          'Shopify sets random_page_cost = 1.1 on all PostgreSQL clusters (SSD storage), enabling the planner to prefer index scans that it previously avoided due to the default spinning-disk assumption.',
          'Datadog uses pg_stat_statements + EXPLAIN plan fingerprinting to automatically detect plan regressions after schema changes or statistics updates.',
          'Heroku Postgres tooling surfaces the top 10 "slow queries" from pg_stat_statements with pre-generated EXPLAIN ANALYZE links for one-click plan inspection.',
        ],
        cs: 'A SaaS billing platform had a nightly report query that took 40 minutes after a 10x table growth. EXPLAIN ANALYZE revealed a Nested Loop with "rows=15 actual rows=250000 loops=8000" — the planner estimated 15 inner rows because statistics had not been updated since the table grew. Running ANALYZE on the two join tables changed the plan to Hash Join; the query ran in 90 seconds. Adding a partial index on the filter column (WHERE status = \'pending\') brought it to 4 seconds. Total time: 2 hours of diagnosis and tuning, saving 39+ minutes per nightly run.',
      },
    },
    interview: {
      q: 'How does the PostgreSQL query planner decide between a Seq Scan and an Index Scan, and what can you do when it makes the wrong choice?',
      a: 'The planner calculates a cost for each access path using column statistics (from ANALYZE) to estimate how many rows satisfy the predicate and a cost model (seq_page_cost, random_page_cost, cpu_tuple_cost) to price the I/O. If the predicate is highly selective (returns a tiny fraction of rows), an index scan is cheaper because random page fetches for a few TIDs cost less than reading the entire table. If the predicate matches a large fraction of rows, a seq scan is cheaper because sequential I/O is far faster than random I/O (especially on spinning disks). The most common wrong choice is a seq scan when an index scan would be better — usually caused by stale statistics making the planner overestimate selectivity. The fix is ANALYZE, increasing statistics_target for the column, and setting random_page_cost = 1.1 on SSD clusters. If the plan is still wrong after accurate statistics, create a partial index or rewrite the query.',
      fu: [
        'What is a Bitmap Index Scan and when does the planner prefer it over a plain Index Scan?',
        'How does the work_mem setting affect Hash Join and Sort performance, and what is the risk of setting it too high globally?',
        'What are extended statistics (CREATE STATISTICS) and what class of estimation errors do they fix?',
      ],
    },
  },
];
