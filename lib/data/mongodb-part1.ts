import { Concept } from '../types';

export const MONGODB_PART1: Concept[] = [
  {
    id: 'mongodb-documents',
    cat: 'mongodb',
    color: '#00ed64',
    icon: '📄',
    title: 'MongoDB Document Model & Schema Design',
    tag: 'A document is a JSON object on steroids — nested, flexible, and co-located with its data',
    overview:
      'MongoDB stores data as BSON documents inside collections. Unlike relational tables, collections have no enforced schema — documents can carry different fields, enabling polymorphic data and iterative schema evolution. The 16MB document limit and the embedding vs referencing decision drive most data-modelling choices.',
    components: [
      {
        name: 'BSON (Binary JSON)',
        icon: '🔢',
        role: "MongoDB's wire and storage format — a superset of JSON with richer types",
        detail:
          'BSON adds types absent from JSON: Date, ObjectId, Binary, Decimal128, Int32, Int64. ObjectId is a 12-byte unique identifier: 4-byte Unix timestamp + 5-byte random value + 3-byte incrementing counter. Because the timestamp is the most significant bytes, ObjectIds are sortable by creation time without a separate timestamp field — `db.collection.find().sort({_id:1})` is effectively insertion-order sort.',
      },
      {
        name: 'Embedded Documents',
        icon: '📦',
        role: 'Sub-documents nested directly inside the parent for co-located, atomically readable data',
        detail:
          'Access nested fields with dot notation: `user.address.city`. The entire document is read or written atomically — no joins needed. Best for data always accessed together (e.g., a user and their shipping address). Avoids the 16MB limit pitfall only when the embedded array or object is bounded in size.',
      },
      {
        name: 'References ($lookup / DBRef)',
        icon: '🔗',
        role: 'Store the _id of another document instead of embedding — normalised, join-on-read',
        detail:
          'Analogous to a foreign key. Enables normalisation and prevents unbounded document growth. Resolving a reference requires a second query or a `$lookup` aggregation stage. Use when data is accessed independently, shared across multiple parents, or when the child array could grow without bound (e.g., all tweets by a user).',
      },
      {
        name: 'Schema Validation ($jsonSchema)',
        icon: '✅',
        role: 'Optional but recommended guard that enforces document structure at the database layer',
        detail:
          'Available from MongoDB 3.6+. `db.createCollection("users", { validator: { $jsonSchema: { required: ["email"], properties: { email: { bsonType: "string" } } } } })`. `validationAction: "error"` rejects non-conforming writes outright; `"warn"` logs a warning but accepts the document — useful during incremental migrations.',
      },
    ],
    howItWorks: `MongoDB stores BSON documents in collections (analogous to relational tables) inside databases. There is no fixed schema — documents in the same collection can have entirely different fields, enabling polymorphism and schema-less iteration. This flexibility is the platform's greatest strength and its greatest risk: without discipline, collections become inconsistent bags of fields.

**Document size limit — 16 MB**
Every document must fit in 16 MB. This is rarely hit for normal records but becomes a hard constraint if you embed unbounded arrays (e.g., all comments on a viral post).

**ObjectId anatomy**
\`ObjectId("64a7b1c2d3e4f5a6b7c8d9e0")\` — 12 bytes:
  • Bytes 0–3: Unix timestamp (seconds) — makes ObjectIds roughly sortable by creation time
  • Bytes 4–8: 5-byte random value (per process/host)
  • Bytes 9–11: 3-byte incrementing counter

**Embedding vs Referencing — decision tree**

Embed when:
  • The child data is always accessed together with the parent (user + address)
  • The relationship is 1-to-1 or 1-to-few with bounded growth
  • You need atomic writes across parent + child in a single operation

Reference when:
  • Data is accessed independently of the parent
  • The child array grows without bound (e.g., comments on a post)
  • The child document is shared across multiple parents (many-to-many)
  • You are modelling many-to-many relationships

**Extended Reference Pattern**
Embed only the frequently-accessed fields of a referenced document (name, thumbnail URL) to avoid a $lookup in the hot path, while keeping the authoritative copy in its own collection. Accept the trade-off: embedded copies can go stale and require an update-many when the source changes.

**Bucket Pattern (time-series)**
Instead of one document per measurement, store N measurements per bucket document (e.g., 100 readings). Dramatically reduces index overhead and improves scan efficiency for time-range queries.`,
    decision: {
      choose: [
        'Data that is naturally hierarchical or document-shaped (product catalogs, user profiles, content pages)',
        'Schema that evolves rapidly across releases without costly ALTER TABLE migrations',
        'Read patterns that retrieve the full entity at once — embedding eliminates joins',
        'Flexible polymorphic data where different subtypes carry different fields',
      ],
      avoid: [
        'Modelling highly relational data with many many-to-many joins — SQL is a better fit',
        'Unbounded embedding (all events, all comments) — reference instead',
        'Transactions across many documents — MongoDB supports multi-document ACID since 4.0, but it is costlier than single-document atomicity',
      ],
      vs: [
        {
          name: 'PostgreSQL',
          when: 'Strong relational integrity, complex joins across many entities, or regulatory compliance requiring strict schema enforcement',
        },
        {
          name: 'DynamoDB',
          when: 'Single-table design with known access patterns and need for serverless auto-scaling; MongoDB offers richer query language',
        },
        {
          name: 'Cassandra',
          when: 'Write-heavy time-series at extreme scale; MongoDB wins on ad-hoc query flexibility',
        },
      ],
    },
    failures: [
      {
        name: 'Unbounded array growth',
        cause:
          'Embedding all comments inside a post document; a viral post accumulates 100K comments and the document hits the 16MB ceiling',
        symptom:
          'Insert/update throws "document too large" error; application errors spike on popular content',
        fix: 'Switch to referencing for unbounded relationships. Use the Bucket Pattern if some embedding is still desired — create bucket documents each holding 100 child items, with a reference back to the parent.',
        severity: 'critical',
      },
      {
        name: 'Schema mismatch across documents after field addition',
        cause:
          'A new required field is added to the $jsonSchema validator, but existing documents predate the field and fail validation',
        symptom:
          'Reads succeed, but any update to an old document fails validation; application update paths error selectively',
        fix: 'Set `validationAction: "warn"` before rolling out the new validator, run a migration script to back-fill the field on all existing documents, then switch back to `"error"` once migration completes.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A filing cabinet vs a spreadsheet',
      t: 'Each drawer (collection) holds folders (documents) of any shape — no fixed columns',
      tx: 'A spreadsheet forces every row to have the same columns. A filing cabinet lets each folder hold whatever papers make sense for that record — a passport copy, a tax form, a hand-written note. MongoDB collections are the filing cabinet: flexible, self-describing, and hierarchical.',
      s: 'Collections = drawers; documents = folders; embedded sub-documents = stapled pages inside a folder; references = a sticky note pointing to another drawer.',
    },
    te: {
      def: 'MongoDB stores data as BSON documents — binary-encoded JSON supersets — in schema-flexible collections. The document model eliminates impedance mismatch by storing related data together, trading normalisation for locality.',
      types: [
        {
          n: '1-to-1 Embedding',
          d: 'Embed a single sub-document directly (user → address). Atomic read, no join, bounded size.',
        },
        {
          n: '1-to-Few Embedding',
          d: 'Embed a small, bounded array (order → line items). Best when items are always fetched with the parent.',
        },
        {
          n: '1-to-Many Referencing',
          d: 'Store parentId on the child (comment.postId). Prevents unbounded array growth; requires $lookup or second query.',
        },
        {
          n: 'Many-to-Many Referencing',
          d: 'Each side stores an array of the other side\'s _ids, or use an intermediary "junction" collection.',
        },
        {
          n: 'Extended Reference Pattern',
          d: 'Embed a subset of referenced document fields (name, thumbnail) for read performance while keeping the authoritative copy separate.',
        },
        {
          n: 'Bucket Pattern',
          d: 'Group N time-series measurements per bucket document to reduce index size and improve scan throughput.',
        },
      ],
      when: 'Use MongoDB when your data is document-shaped, schemas evolve frequently, or read patterns retrieve full entities. Avoid when strong relational integrity or complex multi-table joins are core requirements.',
      trade:
        'Embedding improves read performance and atomicity at the cost of data duplication and potential document size growth. Referencing normalises data at the cost of additional queries or $lookup stages. There is no universal answer — match the data model to the dominant access pattern.',
      code: `// ── DOCUMENT STRUCTURE ────────────────────────────────
// Collection: users
{
  _id: ObjectId("64a7b1c2d3e4f5a6b7c8d9e0"),  // 12-byte, auto-generated
  email: "jane@example.com",
  name: { first: "Jane", last: "Doe" },          // embedded sub-document
  address: {
    street: "123 Main St",
    city: "San Francisco",
    zip: "94105"
  },
  roles: ["admin", "editor"],                    // array of primitives
  createdAt: ISODate("2024-01-15T10:30:00Z"),   // BSON Date type
  metadata: { loginCount: 42, lastSeen: ISODate("2024-07-01T08:00:00Z") }
}

// ── EMBEDDING vs REFERENCING ──────────────────────────
// Pattern 1: Embed (1-to-few, always accessed together)
// orders collection
{
  _id: ObjectId(...),
  userId: ObjectId("..."),
  status: "shipped",
  items: [                        // embedded array — always needed with order
    { productId: ObjectId("..."), name: "Widget", qty: 2, price: 29.99 },
    { productId: ObjectId("..."), name: "Gadget", qty: 1, price: 49.99 }
  ],
  total: 109.97,
  shippingAddress: { street: "...", city: "..." }
}

// Pattern 2: Reference (1-to-many, independent access)
// comments collection — reference to post, not embedded
{
  _id: ObjectId(...),
  postId: ObjectId("abc123"),    // reference — not embedded (unbounded growth)
  authorId: ObjectId("..."),
  text: "Great article!",
  createdAt: ISODate("...")
}

// ── SCHEMA VALIDATION ─────────────────────────────────
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$",
          description: "must be a valid email"
        },
        name: {
          bsonType: "object",
          required: ["first", "last"],
          properties: {
            first: { bsonType: "string", minLength: 1 },
            last:  { bsonType: "string", minLength: 1 }
          }
        },
        age: { bsonType: "int", minimum: 0, maximum: 150 }
      }
    }
  },
  validationAction: "error"    // reject invalid documents
});

// ── CRUD OPERATIONS ───────────────────────────────────
// Insert
db.users.insertOne({ email: "bob@example.com", name: { first: "Bob", last: "Smith" }, createdAt: new Date() });
db.users.insertMany([{ ... }, { ... }]);

// Find (query operators)
db.users.find({ "address.city": "San Francisco" });           // dot notation
db.users.find({ age: { $gte: 18, $lte: 65 } });              // range
db.users.find({ roles: { $in: ["admin", "superuser"] } });   // array contains
db.users.find({ $or: [{ age: { $lt: 18 } }, { roles: "guest" }] });
db.users.find({ "metadata.loginCount": { $gt: 10 } }).sort({ "metadata.loginCount": -1 }).limit(20);

// Update
db.users.updateOne(
  { email: "jane@example.com" },
  { $set: { "metadata.lastSeen": new Date() }, $inc: { "metadata.loginCount": 1 } }
);
db.users.updateMany(
  { "address.city": "SF" },
  { $set: { "address.city": "San Francisco" } }
);
// findOneAndUpdate — atomic update + return
db.users.findOneAndUpdate(
  { email: "jane@example.com" },
  { $set: { status: "active" } },
  { returnDocument: "after" }   // return the updated document
);

// Delete
db.users.deleteOne({ email: "spam@example.com" });
db.users.deleteMany({ status: "inactive", createdAt: { $lt: new Date("2020-01-01") } });`,
      rw: {
        ex: [
          'E-commerce product catalog: each product document embeds variants, images, and attributes — fields differ per product type (clothing vs electronics) with no schema conflict',
          'Content management: blog posts embed author sub-documents (name, avatar) via the Extended Reference Pattern, avoiding a $lookup on every page render',
          'IoT sensor data: Bucket Pattern groups 100 readings per document, reducing the index from 1M entries to 10K entries for a 100-reading-per-bucket scheme',
        ],
        cs: 'Airbnb uses MongoDB for its listing catalog: each listing document embeds photos, amenities, and pricing rules — data always fetched together on the listing page. Host profiles are referenced (not embedded) because they are accessed independently on the host profile page and shared across multiple listings.',
      },
    },
    interview: {
      q: 'When would you embed a document vs use a reference in MongoDB?',
      a: 'Embed when the child data is always accessed with the parent, the relationship is 1-to-1 or 1-to-few, and the embedded size is bounded. Reference when the child array can grow without bound, data is accessed independently, or the child is shared across multiple parents. The 16MB document limit enforces the bounded-growth constraint — unbounded embedding will eventually cause document-too-large errors.',
      fu: [
        'What is the Extended Reference Pattern and when does it help?',
        'How does the Bucket Pattern reduce index pressure for time-series data?',
        'What happens if you add a new required field to $jsonSchema without migrating existing documents?',
        'How would you model a many-to-many relationship (e.g., students and courses) in MongoDB?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONCEPT 2: MongoDB Indexes
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mongodb-indexes',
    cat: 'mongodb',
    color: '#00ed64',
    icon: '🗂️',
    title: 'MongoDB Indexes',
    tag: 'An index is a B-tree over a subset of your documents — use it or do a full collection scan',
    overview:
      'MongoDB indexes are B-tree data structures that allow the query planner to locate matching documents without scanning every record. Without an index, every query is a COLLSCAN — O(n) in collection size. The right index turns it into an IXSCAN — O(log n + k) where k is the result set size.',
    components: [
      {
        name: 'Single Field Index',
        icon: '1️⃣',
        role: 'The simplest index — covers equality, range, and sort queries on one field',
        detail:
          '`db.users.createIndex({ email: 1 })` — `1` means ascending, `-1` descending. MongoDB automatically creates a unique index on `_id`. Single field indexes support queries filtering or sorting on that one field and can be used in reverse (the planner traverses the B-tree backward for descending sorts).',
      },
      {
        name: 'Compound Index',
        icon: '🔢',
        role: 'Index on multiple fields — field order determines which query shapes benefit',
        detail:
          '`db.users.createIndex({ status: 1, createdAt: -1, age: 1 })`. A compound index supports any prefix of its fields. Design using the ESR rule: Equality fields first (narrows the scan set), Sort fields in the middle (eliminates in-memory sort), Range fields last (range predicates cannot eliminate the sort step if they precede sort fields in the index).',
      },
      {
        name: 'Multikey Index',
        icon: '🗃️',
        role: 'Automatically created when an indexed field contains an array — one index entry per element',
        detail:
          'Enables `db.products.find({ tags: "electronics" })` to use an IXSCAN even though `tags` is an array. MongoDB creates one B-tree entry per array element. Limitation: a compound index cannot have two multikey (array) fields simultaneously — at most one array field per compound index.',
      },
      {
        name: 'Covered Query',
        icon: '⚡',
        role: 'A query fully satisfied from the index — zero document reads, maximum throughput',
        detail:
          'A query is covered when ALL fields in the filter AND projection exist in the index (with `_id: 0` in the projection to exclude the non-indexed `_id`). MongoDB returns results directly from the index B-tree without fetching any collection documents — the fastest possible query execution path.',
      },
    ],
    howItWorks: `MongoDB indexes are B-tree structures stored separately from the collection. Each index entry maps one or more field values to the \`_id\` of the matching document. The query planner chooses the "winning plan" by considering all candidate indexes, running trial executions, and caching the winner.

**explain("executionStats") — reading the output**
\`\`\`
winningPlan.stage: "IXSCAN"          ✅ index used
winningPlan.stage: "COLLSCAN"         ❌ full collection scan
executionStats.totalKeysExamined      index entries scanned
executionStats.totalDocsExamined      documents fetched from collection
executionStats.totalDocsReturned      documents returned to client
executionStats.executionTimeMillis    wall clock time
\`\`\`
Good selectivity: totalDocsExamined ≈ totalDocsReturned. Bad selectivity: examining 1M documents to return 10.

**ESR Rule for compound index design**
1. **E**quality fields first — fields tested with exact match ($eq, $in) go first; they reduce the working set to only matching documents
2. **S**ort fields second — sort fields placed after equality fields allow the index to satisfy ORDER BY without an in-memory sort (SORT stage disappears from the plan)
3. **R**ange fields last — range predicates ($gt, $lt, $between) go last; once a range boundary is hit, no further sort optimisation is possible

**Specialised index types**
- **Sparse** — only indexes documents where the field exists; smaller index footprint for optional fields
- **Partial** — only indexes documents matching a filter expression (\`{ status: "active" }\`); ideal for "hot subset" queries
- **TTL** — a background MongoDB task scans the TTL index every 60 seconds and deletes documents whose indexed date field is older than \`expireAfterSeconds\`; used for sessions, logs, caches
- **Text** — inverted index for full-text search; supports \`$text\` operator with language-aware stemming; only one text index per collection
- **2dsphere** — geospatial index for GeoJSON shapes; supports \`$near\`, \`$geoWithin\`, \`$geoIntersects\`
- **Hashed** — uniform hash distribution; used as a shard key for even data distribution; only equality queries, no range queries

**Write amplification**
Every insert, update, or delete must update ALL indexes on the collection. A collection with 20 indexes has up to 20× write amplification. Use \`$indexStats\` to find indexes with zero usage and drop them.`,
    decision: {
      choose: [
        'Add an index when explain() shows COLLSCAN on a frequently-executed query',
        'Use compound indexes for queries with equality + sort + range patterns — design with the ESR rule',
        'Use TTL indexes for automatic expiry instead of application-level cron jobs',
        'Use partial indexes to index only the "hot" subset of documents (e.g., status: "active")',
      ],
      avoid: [
        'Do not add an index for every field — write amplification degrades insert/update throughput',
        'Do not use a text index when you need ranked relevance or faceting at scale — use Atlas Search (Lucene) instead',
        'Do not use a hashed index if you need range queries on the shard key',
      ],
      vs: [
        {
          name: 'PostgreSQL B-tree index',
          when: 'Functionally identical for equality/range; MongoDB adds multikey (array) and hashed as native index types; Postgres has partial indexes too',
        },
        {
          name: 'Elasticsearch index',
          when: 'Full-text search with scoring, faceting, and aggregations at scale; MongoDB text indexes are simpler and lack relevance tuning',
        },
        {
          name: 'Redis sorted set',
          when: 'Sub-millisecond rank/score queries on a pre-computed key; MongoDB indexes are durable and support complex filters Redis cannot',
        },
      ],
    },
    failures: [
      {
        name: 'Too many indexes slowing writes',
        cause:
          'A collection accumulates 20+ indexes over time as engineers add them for new features without removing old ones; every insert and update must maintain all indexes',
        symptom:
          'Insert and update latency climbs; replication lag increases on secondaries; `mongostat` shows high lock contention',
        fix: 'Run `db.collection.aggregate([{ $indexStats: {} }])` to find indexes with `accesses.ops: 0`. Hide them first with `db.collection.hideIndex(name)` to verify no query regresses, then drop with `db.collection.dropIndex(name)`.',
        severity: 'high',
      },
      {
        name: 'Index not used due to wrong field order in compound index',
        cause:
          'A compound index `{ age: 1, status: 1 }` exists, but a query filters only on `status`. MongoDB can only use index prefixes — a query on `status` alone cannot use this index and falls back to COLLSCAN.',
        symptom:
          'explain() shows COLLSCAN despite a compound index existing; queries on non-prefix fields are slow',
        fix: 'Redesign the index to put the queried field first, or add a separate single-field index on `status`. Always verify with `explain("executionStats")` that the winning plan is IXSCAN.',
        severity: 'medium',
      },
    ],
    a: {
      v: "A book's index vs reading every page",
      t: 'The index at the back of a textbook tells you exactly which pages mention "sharding" — you jump straight there instead of reading all 800 pages',
      tx: "Without an index MongoDB reads every document in the collection — a full collection scan. With an index it jumps directly to matching entries in the B-tree and fetches only those documents. The index is a sorted, separate data structure maintained in sync with the collection.",
      s: 'Collection = book; documents = pages; index = alphabetical index at the back; COLLSCAN = reading every page; IXSCAN = jumping to the index entry.',
    },
    te: {
      def: 'MongoDB indexes are B-tree structures that map field values to document locations, enabling the query planner to skip non-matching documents. Without indexes, every query is O(n); with a selective index, it approaches O(log n).',
      types: [
        { n: 'Single Field', d: 'One field, ascending or descending. Supports equality, range, sort.' },
        { n: 'Compound', d: 'Multiple fields. Field order matters — ESR rule. Supports prefix queries.' },
        { n: 'Multikey', d: 'Array field. One index entry per array element. Cannot compound two multikey fields.' },
        { n: 'Text', d: 'Inverted index for $text operator. Language-aware stemming. One per collection.' },
        { n: '2dsphere', d: 'GeoJSON shapes on a spherical surface. Supports $near, $geoWithin.' },
        { n: 'Hashed', d: 'Hash of field value. Even distribution for sharding. Equality only, no ranges.' },
        { n: 'Sparse', d: 'Skips documents where the field is absent. Smaller, faster for optional fields.' },
        { n: 'Partial', d: 'Only indexes documents matching a filter expression. Hot-subset optimisation.' },
        { n: 'TTL', d: 'Expires documents automatically after a time delta. Background thread runs every 60s.' },
      ],
      when: 'Add indexes driven by observed query patterns (explain output), not speculatively. Every index has a write cost — treat them as a trade-off, not a free optimisation.',
      trade:
        'Indexes speed reads at the cost of write throughput and storage. More indexes = slower inserts/updates. Fewer indexes = slower reads. Covered queries eliminate even the document fetch, but require projections to exactly match the index fields.',
      code: `// ── INDEX CREATION ────────────────────────────────────
// Single field (ascending)
db.users.createIndex({ email: 1 }, { unique: true });

// Compound — ESR rule: Equality, Sort, Range
// Query: find active users, sort by createdAt desc, filter age range
// Bad index:  { age: 1, status: 1, createdAt: -1 }  ← range first
// Good index: { status: 1, createdAt: -1, age: 1 }  ← equality, sort, range
db.users.createIndex({ status: 1, createdAt: -1, age: 1 });

// Multikey (array field)
db.products.createIndex({ tags: 1 });
// Now this query uses IXSCAN:
db.products.find({ tags: "electronics" });

// Text index (full-text search)
db.articles.createIndex({ title: "text", body: "text" }, { weights: { title: 10, body: 1 } });
db.articles.find({ $text: { $search: "mongodb sharding" } }, { score: { $meta: "textScore" } })
           .sort({ score: { $meta: "textScore" } });

// Geospatial (2dsphere for spherical Earth)
db.restaurants.createIndex({ location: "2dsphere" });
db.restaurants.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.9857, 40.7484] },
      $maxDistance: 1000   // 1km radius
    }
  }
});

// Sparse (only index documents where field exists)
db.users.createIndex({ phoneNumber: 1 }, { sparse: true });

// Partial (only index active users)
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { status: "active" }, unique: true }
);

// TTL — auto-expire documents after 24 hours
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Hashed (for even sharding distribution)
db.events.createIndex({ userId: "hashed" });

// ── COVERED QUERY ─────────────────────────────────────
// Index: { status: 1, email: 1, name: 1 }
db.users.createIndex({ status: 1, email: 1, name: 1 });
// Query: filter on status, project only email + name (no _id)
db.users.find(
  { status: "active" },
  { _id: 0, email: 1, name: 1 }   // covered — all fields in the index
);

// ── EXPLAIN OUTPUT ────────────────────────────────────
db.users.find({ status: "active", age: { $gt: 18 } })
        .explain("executionStats");
// Key fields to check:
// winningPlan.stage: "IXSCAN" ✅ or "COLLSCAN" ❌
// executionStats.totalDocsExamined: lower = better selectivity
// executionStats.totalDocsReturned: compare with examined
// executionStats.executionTimeMillis: wall clock time
// executionStats.totalKeysExamined: index entries scanned

// ── INDEX MANAGEMENT ──────────────────────────────────
db.users.getIndexes();                      // list all indexes
db.users.dropIndex("email_1");             // drop by name
db.users.hideIndex("email_1");             // hide without dropping (test impact)
db.users.createIndex({ field: 1 }, { background: true });  // non-blocking (older MongoDB)
// MongoDB 4.2+: all index builds are non-blocking by default`,
      rw: {
        ex: [
          'E-commerce search: compound index `{ category: 1, price: 1, rating: -1 }` (ESR) supports "all electronics under $500, sorted by rating" with an IXSCAN and no in-memory sort',
          'Session management: TTL index on `{ createdAt: 1 }` with `expireAfterSeconds: 1800` auto-expires sessions after 30 minutes — no cron job needed',
          'Location-based app: 2dsphere index on `{ location: "2dsphere" }` powers "find restaurants within 1km" queries with $near in sub-millisecond time',
        ],
        cs: 'Uber uses compound indexes on their trip collection with the ESR rule to support driver-lookup queries: `{ city: 1, status: 1, startTime: -1 }` — city and status are equality fields (ESR E), startTime is the sort field (ESR S). This eliminates the in-memory sort on billions of trip records.',
      },
    },
    interview: {
      q: 'Explain the ESR rule and why field order matters in a compound MongoDB index.',
      a: 'ESR stands for Equality-Sort-Range. Equality fields go first because they reduce the working set to only documents matching the exact value. Sort fields go next so MongoDB can traverse the B-tree in the sort order without a separate in-memory sort stage. Range fields go last because once the index enters a range scan, it cannot guarantee order for subsequent sort keys. Wrong order — e.g., range before sort — causes MongoDB to add a blocking SORT stage in the query plan, which can consume significant memory and time on large datasets.',
      fu: [
        'What is a covered query and how do you verify one with explain()?',
        'What is the difference between a sparse index and a partial index?',
        'How does a multikey index work and what is its compound-index limitation?',
        'How would you audit and remove unused indexes in a production MongoDB cluster?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONCEPT 3: MongoDB Aggregation Pipeline
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'mongodb-aggregation',
    cat: 'mongodb',
    color: '#00ed64',
    icon: '🔧',
    title: 'MongoDB Aggregation Pipeline',
    tag: 'A pipeline of stages — each stage transforms the document stream like a Unix pipe',
    overview:
      'The aggregation pipeline is MongoDB\'s primary analytics and transformation engine. Documents flow through an ordered sequence of stages — each stage receives the output of the previous one and applies a transformation. It replaces SQL GROUP BY, JOIN, HAVING, and window functions in a single, composable API.',
    components: [
      {
        name: '$match',
        icon: '🔍',
        role: 'Filters the document stream — must be placed first to use collection indexes',
        detail:
          'Equivalent to SQL WHERE. `{ $match: { status: "active", age: { $gte: 18 } } }`. Only $match and $sort at the very beginning of the pipeline can leverage collection indexes. A $match placed after any transforming stage (like $unwind or $group) cannot use indexes — it operates on the in-memory intermediate result.',
      },
      {
        name: '$group',
        icon: '📊',
        role: 'Groups documents by a key and applies accumulators — the SQL GROUP BY of MongoDB',
        detail:
          '`{ $group: { _id: "$category", total: { $sum: "$price" }, count: { $sum: 1 }, avg: { $avg: "$price" } } }`. The `_id` field is the grouping key — set to `null` to aggregate all documents into one. Accumulators: $sum, $avg, $min, $max, $push (array of values), $addToSet (unique values array), $first, $last.',
      },
      {
        name: '$lookup',
        icon: '🔗',
        role: 'Left outer join from the current collection to another — the SQL JOIN of MongoDB',
        detail:
          '`{ $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" } }`. Returns an array field — use `$unwind` to flatten one document per matched result. Always index the `foreignField` in the joined collection or each lookup triggers a full scan of that collection per input document.',
      },
      {
        name: '$unwind',
        icon: '📤',
        role: 'Deconstructs an array field — outputs one document per array element',
        detail:
          'Turns `{ tags: ["a", "b", "c"] }` into three separate documents, each with a single tag value. Essential before $group when grouping by an array field (e.g., "revenue per tag"). Use `preserveNullAndEmptyArrays: true` to keep documents with null or missing array fields in the stream instead of silently dropping them.',
      },
    ],
    howItWorks: `**Pipeline execution model**
Stages execute sequentially. The output document stream of stage N is the input stream of stage N+1. MongoDB processes documents in batches — it does not buffer the entire collection before starting the next stage.

**Index usage rules**
Only $match and $sort at the very beginning of the pipeline (before any transforming stage) can use collection indexes. This makes "filter early" the single most impactful pipeline optimisation: a $match at position 0 reduces the document stream before any expensive stage.

**Memory limits**
Each pipeline stage has a 100MB working set limit. This affects $group and $sort most — they must hold the intermediate result in memory. For large aggregations, pass \`{ allowDiskUse: true }\` to spill to disk. MongoDB 6.0+ uses a more efficient spill implementation.

**MongoDB's automatic pipeline optimisations**
- Merges consecutive $match stages into one
- Moves a $match before a preceding $lookup when the $match references only fields from the local collection (filter before the join, not after)
- Coalesces $sort + $limit into a top-K sort (keeps only K documents in memory instead of sorting everything)
- Merges $project / $addFields when they are adjacent

**Key stages beyond the four above**
- **$project** — reshape documents: include/exclude fields, compute new fields with expressions
- **$addFields** — add computed fields without removing existing ones ($project alternative)
- **$sort** — order documents; can use index only at pipeline start
- **$limit / $skip** — pagination; always combine $sort before $limit for deterministic results
- **$bucket / $bucketAuto** — histogram grouping by numeric range; $bucketAuto distributes evenly
- **$facet** — runs multiple independent sub-pipelines on the same input in parallel; returns one document with one field per sub-pipeline; ideal for search result pages (results + total count + facets in one query)
- **$graphLookup** — recursive traversal of a collection (org charts, social graphs, product dependencies); specify maxDepth to prevent infinite recursion
- **$merge** — writes pipeline output into a collection (upsert semantics); enables incremental materialized views
- **$out** — replaces a collection atomically with pipeline output; simpler than $merge but non-incremental

**$facet for search result pages**
The classic pagination problem: "give me page 2 of results AND the total count AND the facet counts." Without $facet this requires three round trips. With $facet it is one aggregation with three sub-pipelines running on the same filtered input.`,
    decision: {
      choose: [
        'Use $match as the first stage whenever possible — reduces document count before expensive stages',
        'Use $facet when a single query must return multiple aggregated views of the same data (search pages)',
        'Use $merge for nightly rollup jobs that build materialized summary collections for dashboards',
        'Use $graphLookup for recursive relationship traversal (org charts, category hierarchies, dependency graphs)',
      ],
      avoid: [
        'Do not place $lookup on a foreignField with no index — causes N × full-collection-scan',
        'Do not run large $group or $sort stages without allowDiskUse: true on big collections',
        'Do not use $out for incremental updates — it replaces the entire collection; use $merge instead',
      ],
      vs: [
        {
          name: 'SQL GROUP BY / JOIN',
          when: 'SQL is often more concise for simple grouping; MongoDB pipeline shines for nested document transformations and multi-stage conditional logic',
        },
        {
          name: 'Apache Spark',
          when: 'Petabyte-scale batch analytics across heterogeneous sources; MongoDB aggregation is best for ad-hoc operational analytics within the database',
        },
        {
          name: 'Atlas Search aggregation',
          when: 'Full-text search with relevance scoring and facets at scale; $text + $facet is simpler but less powerful than Atlas Search (Lucene-backed)',
        },
      ],
    },
    failures: [
      {
        name: '$lookup on unindexed foreignField',
        cause:
          'For each document entering the $lookup stage, MongoDB performs a query on the foreign collection using the foreignField value. Without an index on foreignField, each lookup triggers a full collection scan.',
        symptom:
          'Aggregation time grows quadratically with collection size; slow query log shows repeated COLLSCANs on the foreign collection for every input document',
        fix: 'Create an index on the foreignField in the joined collection before using $lookup: `db.products.createIndex({ _id: 1 })` is automatic, but custom foreignFields need explicit indexes. Verify with explain("executionStats") on the aggregation.',
        severity: 'high',
      },
      {
        name: 'Pipeline exceeding 100MB stage memory limit',
        cause:
          'A $group or $sort stage on a large unfiltered collection accumulates more than 100MB of intermediate documents in memory',
        symptom:
          'Aggregation throws "Exceeded memory limit for $group / $sort" error; pipeline fails entirely',
        fix: 'Add `{ allowDiskUse: true }` to the aggregate call. Restructure to add a $match or $project early in the pipeline to reduce document size/count before the expensive stage. For recurring analytics, pre-aggregate with $merge into a summary collection.',
        severity: 'high',
      },
    ],
    a: {
      v: 'A factory assembly line',
      t: 'Raw materials (documents) enter at one end; each workstation (stage) does one transformation; finished goods (results) come out the other end',
      tx: 'Each stage in the aggregation pipeline does exactly one job: $match is the quality filter that rejects bad parts early, $unwind is the disassembler that splits kits into individual components, $group is the counter that tallies components by type, $project is the packager that labels the final box. No stage knows what came before or after — it just transforms its input stream.',
      s: 'Pipeline = assembly line; stages = workstations; documents = parts; $match = QA filter; $group = batch counter; $lookup = parts sourcing from another warehouse; $out/$merge = shipping dock.',
    },
    te: {
      def: 'The MongoDB aggregation pipeline is a framework for declarative data transformation and analysis. Documents flow through an ordered array of stage operators, each transforming the stream, enabling complex analytics without leaving the database.',
      types: [
        { n: '$match', d: 'Filter stage. Uses indexes when first. Equivalent to SQL WHERE.' },
        { n: '$group', d: 'Grouping stage with accumulators ($sum, $avg, $push, $addToSet). Equivalent to SQL GROUP BY.' },
        { n: '$project', d: 'Reshape stage. Include/exclude/compute fields. Equivalent to SQL SELECT.' },
        { n: '$sort', d: 'Order stage. Uses index only at pipeline start.' },
        { n: '$limit / $skip', d: 'Pagination stages. Always pair with $sort for determinism.' },
        { n: '$unwind', d: 'Array deconstructor. One document per array element.' },
        { n: '$lookup', d: 'Left outer join to another collection. Requires index on foreignField.' },
        { n: '$addFields', d: 'Add computed fields without dropping existing ones.' },
        { n: '$bucket / $bucketAuto', d: 'Histogram grouping by numeric boundaries.' },
        { n: '$facet', d: 'Multiple parallel sub-pipelines on the same input. Search result pages.' },
        { n: '$graphLookup', d: 'Recursive collection traversal. Org charts, category trees.' },
        { n: '$merge / $out', d: 'Write pipeline output to a collection. Materialized views.' },
      ],
      when: 'Use the aggregation pipeline for any analytics, reporting, or transformation that goes beyond a simple find(). Use it in preference to application-side aggregation — pushing computation to the database avoids transferring large document sets over the network.',
      trade:
        'Aggregation pipelines are powerful but can be memory-intensive. Filter early ($match first) and project away unneeded fields early to keep intermediate documents small. Complex pipelines can be hard to debug — use `db.collection.aggregate([...]).explain("executionStats")` to inspect stage-by-stage execution.',
      code: `// ── BASIC GROUP + MATCH ───────────────────────────────
// "Total revenue by category for active orders in 2024"
db.orders.aggregate([
  // Stage 1: Filter early — uses index on {status:1, createdAt:1}
  { $match: {
    status: "completed",
    createdAt: { $gte: ISODate("2024-01-01"), $lt: ISODate("2025-01-01") }
  }},
  // Stage 2: Deconstruct items array — one doc per item
  { $unwind: "$items" },
  // Stage 3: Group by category, sum revenue
  { $group: {
    _id: "$items.category",
    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
    orderCount: { $sum: 1 },
    avgOrderValue: { $avg: { $multiply: ["$items.price", "$items.qty"] } },
    topProducts: { $addToSet: "$items.name" }  // unique product names per category
  }},
  // Stage 4: Sort by revenue descending
  { $sort: { totalRevenue: -1 } },
  // Stage 5: Top 10 categories
  { $limit: 10 },
  // Stage 6: Shape the output
  { $project: {
    _id: 0,
    category: "$_id",
    totalRevenue: { $round: ["$totalRevenue", 2] },
    orderCount: 1,
    avgOrderValue: { $round: ["$avgOrderValue", 2] }
  }}
]);

// ── $LOOKUP (JOIN) ────────────────────────────────────
// "Orders with full user and product details"
db.orders.aggregate([
  { $match: { status: "pending" } },
  // Join users collection
  { $lookup: {
    from: "users",
    localField: "userId",      // field in orders
    foreignField: "_id",       // field in users
    as: "user"                 // output array field name
  }},
  { $unwind: "$user" },        // flatten array to single object
  // Join products for each item
  { $lookup: {
    from: "products",
    localField: "items.productId",
    foreignField: "_id",
    as: "productDetails"
  }},
  { $project: {
    orderId: "$_id",
    "user.name": 1,
    "user.email": 1,
    items: 1,
    productDetails: { name: 1, sku: 1 },
    total: 1
  }}
]);

// ── $FACET — multiple aggregations in one query ───────
// "Search results page: items + total count + price buckets"
db.products.aggregate([
  { $match: { $text: { $search: "laptop" }, inStock: true } },
  { $facet: {
    // Sub-pipeline 1: paginated results
    results: [
      { $sort: { score: { $meta: "textScore" } } },
      { $skip: 0 },
      { $limit: 20 },
      { $project: { name: 1, price: 1, brand: 1 } }
    ],
    // Sub-pipeline 2: total count
    totalCount: [
      { $count: "total" }
    ],
    // Sub-pipeline 3: price distribution histogram
    priceRanges: [
      { $bucket: {
        groupBy: "$price",
        boundaries: [0, 100, 500, 1000, 5000],
        default: "5000+",
        output: { count: { $sum: 1 }, avgPrice: { $avg: "$price" } }
      }}
    ],
    // Sub-pipeline 4: brands facet
    brands: [
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]
  }}
]);

// ── $GRAPHLOOKUP — recursive traversal ───────────────
// "Find all reports-to chain for an employee (org chart)"
db.employees.aggregate([
  { $match: { name: "Alice" } },
  { $graphLookup: {
    from: "employees",
    startWith: "$managerId",
    connectFromField: "managerId",
    connectToField: "_id",
    as: "managementChain",
    maxDepth: 5,               // stop after 5 levels
    depthField: "level"        // add level number to each result
  }}
]);

// ── MATERIALIZED VIEW WITH $MERGE ─────────────────────
// Run nightly to update a summary collection
db.orders.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 86400000) } } },  // last 24h
  { $group: {
    _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, category: "$category" },
    revenue: { $sum: "$total" },
    orders: { $sum: 1 }
  }},
  { $merge: {
    into: "daily_revenue_summary",
    on: "_id",
    whenMatched: "replace",
    whenNotMatched: "insert"
  }}
]);`,
      rw: {
        ex: [
          'E-commerce search page: $facet returns paginated results, total count, price histogram, and brand facets in a single round trip — eliminates three separate queries',
          'Reporting dashboard: nightly $merge job aggregates daily revenue by category into a summary collection; the dashboard reads the summary instead of re-running the full aggregation on millions of orders',
          'HR org chart: $graphLookup with maxDepth: 10 recursively builds the full management chain for any employee — equivalent to a recursive CTE in SQL',
        ],
        cs: 'LinkedIn uses MongoDB aggregation pipelines for their "People You May Know" feature recommendations: $graphLookup traverses the connection graph up to depth 2 to find second-degree connections, $group counts mutual connections, and $sort + $limit returns the top 10 ranked suggestions — all within the database without application-side graph traversal.',
      },
    },
    interview: {
      q: 'How would you write an aggregation to get the top 5 products by revenue per category, with the total count per category alongside the product list?',
      a: 'Use a $facet or a two-stage approach. First $match to filter relevant documents, then $unwind the items array, then $group twice: first by `{ category, productId }` to get per-product revenue, then $sort and $limit within a $group using $push to collect the top products per category. For the count alongside, $facet lets you run a "top products per category" sub-pipeline and a "count per category" sub-pipeline on the same filtered input simultaneously, returning both in one result document.',
      fu: [
        'What is the 100MB stage memory limit and how do you work around it?',
        'Why must $match be placed before $lookup for index use, and what does MongoDB do automatically to enforce this?',
        'What is the difference between $merge and $out?',
        'How does $bucket differ from $group for numeric range aggregations?',
      ],
    },
  },
];
