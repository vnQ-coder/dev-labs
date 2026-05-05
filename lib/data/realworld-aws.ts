import { RealWorldSystem } from '../types';

export const REALWORLD_AWS: RealWorldSystem[] = [
  {
    id: 'aws-3tier',
    icon: '🏗️',
    name: 'AWS Production 3-Tier Web App',
    color: '#22d3ee',
    scale: '10M requests/day · 1,000 concurrent users peak · 99.9% uptime SLA',
    focus: '3-Tier Web App on AWS',
    problem:
      'Deploy a production 3-tier web application on AWS: a dynamic API backend, a React SPA frontend, user authentication, a PostgreSQL data store, and image uploads. The system must hold p99 API latency under 200ms, static asset TTFB under 50ms, RTO under 5 minutes, and RPO under 1 minute — all on a single-region footprint that survives an AZ failure cleanly.',

    functionalReqs: [
      'Users can sign up, log in, and maintain a session across requests',
      'React SPA is served as static assets with cache-busting on each deploy',
      'API endpoints handle CRUD on user-owned resources backed by PostgreSQL',
      'Users can upload profile and content images, served back via CDN',
      'Background jobs and read-replica queries do not block the request path',
      'Admin can deploy a new app version with zero downtime',
      'All traffic is HTTPS-only with valid certificates and HSTS',
    ],

    nonFunctionalReqs: [
      { label: 'Availability', value: '99.9% uptime — survives a single-AZ failure automatically' },
      { label: 'API Latency', value: 'p99 < 200ms at the ALB; p50 < 60ms' },
      { label: 'Static TTFB', value: '< 50ms globally via CloudFront edge cache' },
      { label: 'RTO / RPO', value: 'RTO < 5 min on AZ failover; RPO < 1 min via Aurora Multi-AZ' },
      { label: 'Security', value: 'WAF + DDoS protection at edge; private subnets for compute and DB' },
      { label: 'Throughput', value: '10M req/day ≈ 116/sec avg, ~1,000/sec peak burst' },
    ],

    scaleEstimation: [
      { label: 'Daily Requests', value: '10M', note: '~116 req/sec average, ~1,000/sec peak' },
      { label: 'Concurrent Users (peak)', value: '1,000', note: 'Drives EC2 Auto Scaling target tracking' },
      { label: 'EC2 Capacity', value: '4× m7g.medium baseline, 8× peak', note: 'ASG min=4 max=12 across 2 AZs' },
      { label: 'Aurora Storage', value: '~200 GB year 1', note: 'Auto-grows to 128 TiB; backups in S3' },
      { label: 'S3 Uploads', value: '~50 GB/day, ~18 TB/year', note: 'Lifecycle to IA after 30 days' },
      { label: 'CloudFront Cache Hit Ratio', value: '> 90% for SPA assets', note: 'Long TTL on hashed JS/CSS, short on index.html' },
    ],

    highLevelDesign: [
      {
        title: 'Route 53 — DNS with Health Checks',
        description:
          'The apex and www records resolve via Route 53 using a latency-based routing policy that today points at a single regional CloudFront distribution but is structured so additional regions can be added later. Per-endpoint health checks probe the ALB every 30 seconds and remove unhealthy records automatically. TTLs are kept low (60s) so failover propagates quickly during incidents.',
      },
      {
        title: 'CloudFront — Edge Cache, WAF, DDoS',
        description:
          'CloudFront sits in front of both the SPA and the API. Static assets (hashed bundles in S3) are cached for a year, while the API path uses cache-control headers to bypass or short-cache GETs. AWS WAF rules attached to the distribution block common OWASP patterns and rate-limit per-IP. AWS Shield Standard provides automatic L3/L4 DDoS protection at the edge.',
      },
      {
        title: 'Application Load Balancer — TLS + Path Routing',
        description:
          'The ALB terminates HTTPS using an ACM certificate, redirects HTTP to HTTPS, and inspects request paths. Requests to /api/* forward to the EC2 target group; everything else falls through to a CloudFront-S3 origin for the SPA. Sticky sessions are disabled — the app tier is stateless and reads session state from ElastiCache.',
      },
      {
        title: 'EC2 Auto Scaling Group in Private Subnets',
        description:
          'm7g.medium instances run the API behind an Auto Scaling Group spread across two private subnets in two AZs. The ASG uses target-tracking on average CPU (50%) and ALB request count per target. Instances have no public IPs; outbound calls (e.g., third-party APIs, package mirrors) flow through a NAT Gateway in the public subnets.',
      },
      {
        title: 'Aurora PostgreSQL Multi-AZ + ElastiCache Redis',
        description:
          'Aurora PostgreSQL runs in Multi-AZ mode in the private DB subnets — one writer, one reader in a second AZ that auto-promotes on failure (typically under 60 seconds). ElastiCache Redis (also Multi-AZ with automatic failover) holds session tokens and a hot-key query cache. Both are reachable only from the EC2 security group, never from the internet.',
      },
      {
        title: 'S3 — Static SPA + User Uploads',
        description:
          'Two S3 buckets back the system. The SPA bucket holds hashed bundles fronted by CloudFront with Origin Access Control. The uploads bucket accepts presigned PUTs from the browser so file bytes never traverse EC2; CloudFront fronts reads with a separate distribution and signed URLs for private content. Both buckets have versioning and server-side encryption enabled.',
      },
    ],

    deepDive: [
      {
        title: 'Zero-Downtime Deploys via Rolling Replacement',
        description:
          'Each deploy launches a new ASG launch template version. The ASG uses an instance refresh with a minimum healthy percentage of 90%, so at most one instance at a time is replaced. The ALB target group health check requires two consecutive 200s on /healthz — which only returns healthy after the app has warmed its DB pool and Redis connections. Connection draining holds open sockets for up to 60 seconds before terminating an old instance, so in-flight requests complete cleanly.',
        insight:
          'Health checks are the contract. A /healthz that returns 200 before the DB pool is ready will silently break every deploy by serving cold instances under load.',
      },
      {
        title: 'Aurora Failover — What Actually Happens',
        description:
          'When the writer AZ fails, Aurora promotes the reader replica in the second AZ. The cluster endpoint DNS swings to the new writer in 30–60 seconds. Open connections from EC2 to the old writer get RST and must reconnect — this is where many apps drop traffic. The fix is a JDBC/PG driver with retry + connection-validation configured (e.g., RDS Proxy or pgbouncer in front of Aurora) so the application sees a transient blip, not a flood of 500s.',
        insight:
          'Failover is not transparent at the connection layer. Always pool through RDS Proxy or a local pgbouncer so DNS swings translate into reconnects, not user-visible errors.',
      },
      {
        title: 'ElastiCache Redis Eviction for Sessions',
        description:
          'Sessions are cached in Redis with a sliding TTL of 24 hours. Memory pressure is controlled with maxmemory-policy=allkeys-lru so when the node is full, the least-recently-used keys (typically idle sessions) are evicted first. CloudWatch alarms fire on Evictions > 0 sustained for 5 minutes — a signal that the working set has outgrown the node and we need to scale up the instance class or shard. We never use noeviction for session caches: an OOM error breaks logins outright.',
        insight:
          'Pick an eviction policy that matches the data model. allkeys-lru for sessions is safe; noeviction is a foot-gun unless every key is durable elsewhere.',
      },
      {
        title: 'ALB Slow Target Draining',
        description:
          'During scale-in or deploys, terminating instances are deregistered from the target group. ALB enters a draining state where it stops sending new requests but allows existing ones to complete for up to 300 seconds (we set 60). Lifecycle hooks on the ASG hold the instance in Terminating:Wait until drain completes, then the EC2 SIGTERM handler runs application shutdown to flush logs and close DB connections. Without lifecycle hooks the instance dies mid-request.',
        insight:
          'Auto Scaling lifecycle hooks turn instance termination from a guillotine into a controlled shutdown. They are mandatory for stateful or long-request workloads.',
      },
      {
        title: 'CloudFront Invalidation on SPA Deploy',
        description:
          'SPA bundles are content-hashed (app.abc123.js) so they can be cached for a year. The only file that needs invalidation is index.html, which references the new hashes. The deploy pipeline uploads new bundles to S3, then issues a CloudFront invalidation for /index.html only. This is one of the cheapest invalidation patterns and avoids the soft cap on broad /* invalidations. Users mid-session continue with the old bundles until they reload — which is exactly the desired behavior.',
        insight:
          'Cache long, invalidate narrowly. A content-hashed asset pipeline turns CloudFront invalidation from an operational headache into a single-file no-op.',
      },
    ],

    decisions: [
      {
        question: 'ALB vs NLB for the entry layer?',
        chosen: 'Application Load Balancer',
        reason:
          'The traffic is HTTP/HTTPS with path-based routing (/api/* vs /*), HTTP header inspection, sticky sessions if needed, and direct WAF integration. NLB operates at L4 — it cannot path-route or terminate TLS for HTTP semantics in a way that exposes headers to WAF. NLB shines for ultra-high TPS or non-HTTP protocols (gRPC raw TCP, MQTT). For a 10M-req/day web app, ALB is the right level of abstraction and cost.',
      },
      {
        question: 'Aurora PostgreSQL vs RDS PostgreSQL?',
        chosen: 'Aurora PostgreSQL',
        reason:
          'Aurora separates compute from storage: storage is a distributed, 6-way-replicated volume across 3 AZs, while compute nodes are stateless. Failover is faster (~30–60s vs 60–120s for RDS Multi-AZ), read replicas share the same storage volume so replica lag is sub-10ms, and backups are continuous to S3 with point-in-time restore. The cost premium over RDS is roughly 20%, justified by the better RPO/RTO and the option to add up to 15 readers without provisioning extra storage.',
      },
      {
        question: 'EC2 Auto Scaling Group vs ECS Fargate for the app tier?',
        chosen: 'EC2 ASG',
        reason:
          'For a steady-state workload of 4–12 instances with predictable scaling, EC2 ASG with a Graviton (m7g) instance type is roughly 30% cheaper than equivalent Fargate vCPU-hours and gives full OS-level control for tuning kernel networking, JVM/Node flags, and observability agents. Fargate wins when you have bursty, idle-most-of-the-time workloads or don’t want to manage AMIs. Here the workload runs 24/7, so paying the Fargate premium for managed compute does not pay back.',
      },
      {
        question: 'Single CloudFront distribution vs separate ones for SPA and API?',
        chosen: 'Single distribution with multiple origins and behaviors',
        reason:
          'A single distribution simplifies certificate and WAF management — one certificate covers app.example.com, one set of WAF rules applies. Cache behaviors are differentiated by path: /api/* points to the ALB origin with caching mostly disabled, while /* points to the S3 SPA origin with long TTLs. Separate distributions would double the operational surface (two WAFs, two cert renewals, two invalidation surfaces) for no real benefit.',
      },
    ],

    interview: [
      {
        q: 'How would you handle a database failover with zero dropped connections?',
        a: 'You cannot eliminate the failover blip at the TCP layer — when Aurora promotes the reader, every existing connection to the old writer is reset. The trick is to absorb that blip in the connection pool. Put RDS Proxy (or a self-hosted pgbouncer) between EC2 and Aurora: the proxy maintains a warm pool of pinned connections, and on failover it transparently reconnects to the new writer while holding application requests for a few seconds. Combined with retry-on-transient-error in the data-access layer (3 retries with jitter), users see a 1–3 second pause instead of a wave of 500s. CloudWatch should alarm on DatabaseConnections going to zero on the old writer as the canary signal that failover happened.',
      },
      {
        q: 'How would you deploy a breaking API change without taking downtime?',
        a: 'Never deploy a breaking change in a single step. Use the expand-contract pattern: (1) Deploy v2 of the API alongside v1 — the SPA still calls v1. (2) Update the SPA to call v2 and roll it out via CloudFront — old SPA tabs still call v1. (3) After enough time has elapsed for old SPA tabs to drop off (track via an X-API-Version header in CloudWatch Logs Insights), retire v1. Schema changes follow the same pattern: add a new column nullable, backfill, deploy code that reads the new column and falls back to the old, then drop the old column in a later release. The rollout itself uses ALB weighted target groups so we can shift 10% → 50% → 100% of traffic to the new instance fleet and roll back instantly if error rates rise.',
      },
      {
        q: 'How would you debug a 2-second latency spike that only shows up at p99?',
        a: 'p99-only spikes are almost always tail-latency: GC pauses, lock contention, cold caches, or one slow downstream. Start with X-Ray or CloudWatch ServiceLens to break the request down by segment — ALB time, app time, DB time, downstream HTTP time. If the time is in the app, check JVM/Node GC logs and the app’s own internal queues. If it is in the DB, look at Performance Insights for top SQL by wait time at the spike timestamp and check for lock waits or sequential scans. If it is in a downstream HTTP call, measure DNS resolution time (NAT Gateway exhaustion can spike connect time). Often the answer is one tenant generating a heavy query that locks a row — the fix is either a query rewrite, an index, or per-tenant rate limiting at the API layer.',
      },
      {
        q: 'Why two AZs and not three?',
        a: 'Three AZs is the right answer for stateful systems where quorum matters (Aurora storage actually replicates 6-way across 3 AZs under the hood, regardless of how many AZs your compute lives in). For the app tier, two AZs already gives us survival of a full AZ outage, and the cross-AZ data-transfer cost of three AZs adds up: every Redis read, every DB connection, every internal call may cross an AZ. Two AZs with proper auto-scaling capacity headroom (we run with 50% spare so one AZ can absorb the other’s load) is the cost-effective sweet spot for a 99.9% SLA. We would move to three AZs if we needed 99.99% or had a quorum-based service of our own.',
      },
      {
        q: 'How do you keep secrets like the DB password out of the AMI and out of source control?',
        a: 'Two complementary mechanisms. AWS Secrets Manager stores the DB credentials and rotates them automatically on a schedule by talking to Aurora. The EC2 instance profile grants secretsmanager:GetSecretValue scoped to that one secret ARN — the instance fetches the password at boot and on rotation events via the SDK. Application config that is non-secret (feature flags, region) goes in SSM Parameter Store. Nothing sensitive is ever baked into the AMI or environment variables visible in the EC2 console. Audit trails for access live in CloudTrail, and a CloudWatch alarm fires if any IAM principal outside the instance role reads the secret.',
      },
    ],

    keyInsight:
      'A production 3-tier app on AWS is not "EC2 + RDS." It is the disciplined assembly of edge (Route 53 + CloudFront + WAF), tier boundaries (ALB doing TLS and path routing), stateless compute (ASG with proper lifecycle hooks and health checks), and managed state (Aurora Multi-AZ behind a connection pool, ElastiCache with the right eviction policy). Each layer has a specific job, and the magic is the boring discipline of letting each one do only that job — so a single AZ failure is a non-event instead of an outage.',
  },

  {
    id: 'aws-serverless',
    icon: '⚡',
    name: 'Serverless Event Pipeline',
    color: '#22d3ee',
    scale: '50M events/day · 580/sec avg · 5K/sec peak · <5s end-to-end',
    focus: 'Event-driven Serverless on AWS',
    problem:
      'Build an event ingestion pipeline that accepts 50M events per day from many producers, validates and enriches each one, persists it durably, and triggers downstream actions — all within 5 seconds end-to-end and without managing any servers. The pipeline must absorb 10× bursts, retry safely, and isolate poison messages without losing data.',

    functionalReqs: [
      'External producers POST events over HTTPS with API key authentication',
      'Each event is validated against a JSON schema before acceptance',
      'Valid events are persisted to a durable event store with idempotent writes',
      'Each persisted event triggers fan-out to one or more downstream subscribers',
      'Failed events are isolated to a DLQ after 3 retries, never lost',
      'Operators can replay events from the DLQ once the underlying bug is fixed',
    ],

    nonFunctionalReqs: [
      { label: 'Throughput', value: '50M/day avg = 580/sec; peak burst 5,000/sec' },
      { label: 'End-to-End Latency', value: '< 5 seconds p99 from POST to downstream notification' },
      { label: 'Durability', value: '99.999999999% (S3/DDB-class) — events never silently lost' },
      { label: 'Idempotency', value: 'Duplicate event_id is a no-op write, not a duplicated record' },
      { label: 'Cost Model', value: 'Pay-per-use; idle cost approaches zero outside business hours' },
      { label: 'Operability', value: 'Alarming on queue depth, error rate, DLQ depth; X-Ray tracing end-to-end' },
    ],

    scaleEstimation: [
      { label: 'Daily Events', value: '50M', note: '~580/sec average over 24h' },
      { label: 'Peak Burst', value: '5,000/sec', note: '~10× average — sized for marketing campaigns' },
      { label: 'Lambda Concurrency', value: '~1,000 reserved for processor', note: 'Protects DDB capacity from runaway scale-out' },
      { label: 'DDB Write Capacity', value: 'On-demand, ~5K WCU peak', note: '1 WCU per 1 KB write; events ~500 B' },
      { label: 'SQS Backlog Budget', value: '< 60s of average traffic = ~35K msgs', note: 'Alarm at 10K, page at 50K' },
      { label: 'Storage Growth', value: '~25 GB/day in DDB, ~9 TB/year', note: 'TTL after 90 days; archive to S3 for analytics' },
    ],

    highLevelDesign: [
      {
        title: 'API Gateway HTTP API → Ingest Lambda',
        description:
          'Producers POST to an API Gateway HTTP API endpoint (cheaper and lower-latency than REST API). API Gateway authenticates via Lambda authorizer that validates the API key against a DynamoDB table. The request payload is forwarded to the Ingest Lambda, which performs JSON Schema validation in-process and rejects invalid payloads with a 400 before any downstream work happens.',
      },
      {
        title: 'Ingest Lambda → SQS Standard Queue',
        description:
          'Once validated, the Ingest Lambda enqueues the event to an SQS Standard queue. SQS Standard is chosen over FIFO because it offers nearly unlimited TPS while our pipeline tolerates at-least-once semantics. The Ingest Lambda is intentionally tiny — its only job is validate + enqueue — so its cold start is small and its concurrency footprint stays close to the API Gateway request rate.',
      },
      {
        title: 'Processor Lambda — Batch of 10 from SQS',
        description:
          'A Processor Lambda is wired to the SQS queue with a batch size of 10 and a maximum batching window of 1 second. Each invocation enriches the events (geo lookup, account lookup), then writes them to DynamoDB. Partial-batch failure reporting is enabled so a single bad message does not mark the whole batch as failed.',
      },
      {
        title: 'DynamoDB (Event Store) + SNS Fan-Out',
        description:
          'After a successful DDB write, the processor publishes to an SNS topic. SNS fans out to multiple subscribers — an SQS queue feeding the analytics pipeline, an HTTPS endpoint for a partner system, and a Lambda that triggers user-facing notifications. Each subscriber has its own DLQ so a slow consumer cannot back up the others.',
      },
      {
        title: 'DLQ + EventBridge Scheduled Replay',
        description:
          'Messages that fail processing 3 times are redirected to an SQS DLQ. An EventBridge schedule runs every hour, invoking a Replay Lambda that inspects DLQ depth and either pages the on-call (if growing) or replays messages back into the main queue (after a deploy that fixed the bug). This pattern keeps poison messages out of the hot path without losing them.',
      },
      {
        title: 'Observability — CloudWatch + X-Ray',
        description:
          'CloudWatch alarms watch ApproximateNumberOfMessagesVisible > 10K (queue backing up), Lambda Errors > 1% over 5 minutes, and DLQ ApproximateNumberOfMessagesVisible > 0. X-Ray is enabled across API Gateway, both Lambdas, and the SDK calls to DDB and SNS, giving an end-to-end trace per event with sub-second resolution.',
      },
    ],

    deepDive: [
      {
        title: 'Idempotency via DynamoDB Conditional Writes',
        description:
          'SQS Standard delivers at-least-once, so the same event_id can arrive twice. The Processor Lambda writes with a ConditionExpression of attribute_not_exists(event_id). The first write succeeds; the second throws ConditionalCheckFailedException, which the processor treats as a successful no-op. This makes the pipeline exactly-once at the persistence layer without needing FIFO queues or distributed locks. The event_id itself is supplied by the producer, or generated as a UUIDv7 by the Ingest Lambda from the request body hash so retries from the same producer collide on the same id.',
        insight:
          'Idempotency is a property of the writer, not the queue. Conditional writes in DDB give you exactly-once persistence on top of an at-least-once transport — and at a fraction of the cost of FIFO.',
      },
      {
        title: 'Reserved Concurrency to Protect Downstream',
        description:
          'Lambda will happily scale to thousands of concurrent executions, but DynamoDB on-demand has a soft adaptive ceiling and our SNS subscribers may have stricter limits. We set a reserved concurrency of 1,000 on the Processor Lambda — this both guarantees that capacity is available (it is reserved from the account pool) and caps it so a sudden spike does not overwhelm DDB or partners. When SQS depth grows, messages queue rather than thrash downstream services. The queue is the shock absorber; reserved concurrency is the throttle.',
        insight:
          'Reserved concurrency is two tools in one: a guarantee (capacity reserved) and a limit (capacity capped). Use it to make your Lambda a polite citizen to its dependencies.',
      },
      {
        title: 'SQS Visibility Timeout Sizing',
        description:
          'When a Lambda picks up a batch from SQS, the messages are hidden for the visibility timeout. If the Lambda crashes before deleting them, they reappear and another invocation gets them. The rule is: visibility_timeout >= lambda_timeout × (max_batch_retries). With a 30-second Lambda timeout, batch size 10, and 3 retries, the visibility timeout is set to 6× the Lambda timeout (180s) to give clear headroom. Setting it too low causes duplicate processing of in-flight messages — which is safe thanks to idempotency but inflates cost and triggers false DLQ entries.',
        insight:
          'Visibility timeout is the "quiet contract" between SQS and Lambda. Get it wrong and you will see ghost duplicates and premature retries that look like a bug somewhere else entirely.',
      },
      {
        title: 'DLQ Alerting and Replay',
        description:
          'A DLQ that nobody watches is just data loss with extra steps. We alarm on the first message landing in the DLQ (NumberOfMessagesSent > 0 over 1 minute) and again on depth growth. The Replay Lambda is parameterized: dry-run mode logs what it would replay, replay mode pushes back to the main queue at a controlled rate (using SendMessageBatch with backoff). For mass replay after a bug fix we use Step Functions with a Map state to read 10 million messages from DLQ in chunks of 1,000 — each chunk a parallel branch — to drain in minutes rather than hours.',
        insight:
          'A DLQ is a triage room, not a graveyard. Build the replay tooling at the same time you build the pipeline, not the night you have a million failed messages.',
      },
      {
        title: 'Cold Start Optimization for the Ingest Lambda',
        description:
          'API-Gateway-fronted Lambdas feel cold starts in user-visible latency. We attack this on three axes: (1) keep the deployment package small (ESM build, tree-shaken, < 5 MB) so init time is in tens of ms; (2) use Lambda SnapStart on Java or provisioned concurrency on Node when burst patterns are predictable; (3) keep the runtime ARM64 (Graviton2) for ~20% better price/performance and slightly faster init. For the Processor Lambda we don’t use provisioned concurrency — it is invoked from SQS, where 100ms cold starts are invisible to the producer.',
        insight:
          'Pay for warm capacity only at user-facing entry points. Async workers down the pipe can absorb cold starts for free.',
      },
    ],

    decisions: [
      {
        question: 'SQS Standard vs SQS FIFO?',
        chosen: 'SQS Standard',
        reason:
          'SQS Standard offers near-unlimited TPS, which lets the pipeline absorb 5,000/sec bursts without hitting any throughput ceiling. FIFO caps at 300 TPS per message group (3,000/sec with high throughput mode and many groups) and gives exactly-once delivery + ordering — guarantees we don’t actually need. We achieve exactly-once persistence via DDB conditional writes (cheaper, simpler), and our events do not require strict ordering between producers. FIFO would be the right call for an order-management pipeline where ordering per-customer truly matters; here it is the wrong tool.',
      },
      {
        question: 'DynamoDB vs Aurora for the event store?',
        chosen: 'DynamoDB',
        reason:
          'DynamoDB scales horizontally to millions of writes per second on a single table, with single-digit millisecond p99 reads at any scale. The access pattern here is "write event by id, read event by id, scan recent events by partition" — all native to DDB and trivially served by a partition key + sort key design. Aurora is excellent for ad-hoc SQL and joins, but at 50M writes/day with peak bursts it would require careful instance sizing and read-replica fan-out. We export DDB to S3 nightly (PITR-based export) so analysts get SQL access via Athena without putting that load on the operational store.',
      },
      {
        question: 'SNS vs EventBridge for fan-out?',
        chosen: 'SNS for high-throughput fan-out, EventBridge for scheduled control plane',
        reason:
          'SNS is purpose-built for high-throughput pub/sub fan-out: cheap per-message, sub-100ms latency, native SQS/Lambda/HTTPS subscribers. It is the right choice for the data-plane fan-out where every event must reach every subscriber. EventBridge costs more per event but offers content-based routing rules, schema registry, and integrations with 100+ AWS services and SaaS partners — perfect for control-plane work like the scheduled DLQ replay and partner-specific routing where rules change frequently. Using both, each for its sweet spot, is cheaper and clearer than forcing one to do both jobs.',
      },
    ],

    interview: [
      {
        q: 'How do you achieve exactly-once processing with SQS Standard?',
        a: 'SQS Standard guarantees at-least-once delivery, so duplicates are inevitable — your job is to make duplicates harmless at the writer. The pattern is: the producer (or the Ingest Lambda) generates a stable event_id. The Processor Lambda writes to DynamoDB with ConditionExpression="attribute_not_exists(event_id)". The first write succeeds; any duplicate throws ConditionalCheckFailedException, which the processor catches and treats as success. Downstream notifications then read from DDB Streams, so they fire exactly once per persisted record regardless of how many SQS retries occurred. This gives you exactly-once semantics at the only place that matters — the system of record — without paying the FIFO tax in throughput and complexity.',
      },
      {
        q: 'Your Lambda is processing SQS but DynamoDB is throttling — how do you apply backpressure without losing messages?',
        a: 'First, do not catch and swallow ProvisionedThroughputExceededException — let the Lambda invocation fail. SQS will hide and retry the messages after the visibility timeout. Second, lower the Processor Lambda’s reserved concurrency below the previous level so fewer parallel writes hit DDB; the queue depth grows but messages are safe. Third, set a reasonable maxReceiveCount on the queue redrive policy (e.g., 5) so a genuinely poison message eventually moves to the DLQ rather than oscillating forever. Fourth, raise an alarm on ApproximateAgeOfOldestMessage so on-call knows the pipeline is falling behind. The queue is doing exactly what it’s meant to do — buffer between producers and a slow consumer — and you turn the throttle dial via Lambda concurrency, not by dropping messages.',
      },
      {
        q: 'How would you replay 10 million events from the DLQ after fixing a bug?',
        a: 'I would not loop a single Lambda over 10 million messages — that takes hours and is fragile. Instead, I use Step Functions with a Map state in distributed mode. The state machine reads the DLQ in batches of 1,000 via ReceiveMessage, fans out parallel Map branches (each branch is a Lambda processing one batch), and writes back to the main queue with SendMessageBatch (10 messages per call). Distributed Map can run thousands of branches in parallel, draining millions of messages in minutes. We also throttle via Map’s maxConcurrency to avoid re-overwhelming DDB, and we record the source DLQ messageId in CloudWatch Logs so we can audit what was replayed. After replay, an alarm verifies DLQ depth returned to zero and main queue depth drained back to baseline.',
      },
      {
        q: 'How do you keep the pipeline cheap during quiet hours?',
        a: 'Serverless gives us most of this for free: no Lambda invocations, no API Gateway requests, no SQS receives — no charges. The places where idle cost shows up are: provisioned concurrency on the Ingest Lambda (set to 0 outside business hours via a scheduled rule), DynamoDB on-demand (we use on-demand precisely because there is no per-hour minimum), and CloudWatch Logs retention (set to 30 days, archive older logs to S3 with Glacier). We also tag every resource by environment and pipeline so AWS Cost Explorer breaks the bill down per pipeline — making it obvious if a producer accidentally enables a debug log that doubles the CloudWatch bill.',
      },
      {
        q: 'How do you trace a single event end-to-end through this pipeline?',
        a: 'Enable AWS X-Ray on API Gateway, both Lambdas, and the SDK clients for DDB and SNS. X-Ray attaches a trace id to the request at API Gateway, propagates it through Lambda context, and stitches together segments for SQS sends, DDB calls, and SNS publishes. In the X-Ray service map you see one node per service with latency percentiles per edge; clicking into a slow trace shows you exactly which segment owned the time. I also log the event_id and trace_id together in structured JSON to CloudWatch Logs, so a customer-support query like "where did event 1234 go?" becomes a single Logs Insights query joining the ingest, processor, and notification logs by event_id.',
      },
    ],

    keyInsight:
      'Serverless event pipelines look simple — Lambda + SQS + DDB — but their reliability comes from the unglamorous details: idempotency via conditional writes, reserved concurrency to protect downstream services, visibility timeouts sized to the worst-case retry, and a DLQ with first-class replay tooling. Get those four right and you have a pipeline that costs near zero at idle, scales 10× on demand without intervention, and lets a small team operate at very high throughput without a pager.',
  },

  {
    id: 'aws-multiregion',
    icon: '🌍',
    name: 'Multi-Region High-Availability',
    color: '#22d3ee',
    scale: '1B requests/day · global users · 99.99% SLA · RPO <1 min · RTO <5 min',
    focus: 'Global Active-Active on AWS',
    problem:
      'Serve 1 billion daily requests from users on every continent with the lowest possible latency, survive a complete AWS region outage automatically, and lose no data on failover. The system runs active-active across three regions, with a strict 99.99% SLA, RPO under 1 minute, and RTO under 5 minutes — including the time it takes to detect a regional failure.',

    functionalReqs: [
      'Users are routed to the nearest healthy region transparently',
      'A full region failure causes automatic redirection to the next-closest region within 5 minutes',
      'Writes performed in any region are visible globally within 1 second of normal-state replication',
      'User assets uploaded in one region are replicated to all other regions for read locality',
      'Sessions survive region failover — users do not need to log in again',
      'Operators can perform a controlled regional failover (drain traffic) without impacting users',
    ],

    nonFunctionalReqs: [
      { label: 'Availability', value: '99.99% — < 53 minutes downtime per year, including DR' },
      { label: 'Latency', value: 'p99 < 200ms regional, < 350ms cross-region after failover' },
      { label: 'RPO', value: '< 1 minute — Aurora Global lag typically < 1s' },
      { label: 'RTO', value: '< 5 minutes — DNS + Aurora promotion + ECS scale-out' },
      { label: 'Throughput', value: '1B req/day ≈ 11.5K/sec average, ~50K/sec peak' },
      { label: 'Data Residency', value: 'Per-user routing honors data-residency rules where required' },
    ],

    scaleEstimation: [
      { label: 'Daily Requests', value: '1B', note: '~11.5K/sec average, ~50K/sec peak' },
      { label: 'Regions', value: '3 active', note: 'us-east-1, eu-west-1, ap-southeast-1' },
      { label: 'ECS Fargate Tasks', value: '~150 per region steady, ~400 peak', note: 'Stateless app tier, scaled on RPS' },
      { label: 'Aurora Global Lag', value: 'Typically 200ms–1s', note: 'Storage-level replication, not logical' },
      { label: 'S3 CRR Replication Lag', value: '~15 minutes p99', note: 'Acceptable for non-critical assets; critical assets use S3 MRAP' },
      { label: 'ElastiCache Global Lag', value: '< 1 second', note: 'For session replication; not source of truth' },
    ],

    highLevelDesign: [
      {
        title: 'Route 53 — Latency-Based Routing + Health Checks',
        description:
          'Route 53 holds A/AAAA records for the apex hostname with a latency-based routing policy across the three regions. Per-region health checks probe a /healthz endpoint on each region’s ALB every 30 seconds from multiple Route 53 checker locations. A region failing 3 consecutive checks is automatically removed from the resolver answers; surviving regions absorb its traffic via the next-best-latency rule.',
      },
      {
        title: 'CloudFront — Global Edge with Origin Failover',
        description:
          'CloudFront sits in front of all three regions. Each cache behavior is configured with an origin group containing a primary and a secondary regional origin, and origin failover triggers on 5xx or connection errors. This protects against momentary regional brownouts that are too fast for Route 53 health checks (which run on a 90-second window) — CloudFront will silently re-issue the request to the secondary origin within seconds.',
      },
      {
        title: 'Per-Region: ALB → ECS Fargate (Stateless App Tier)',
        description:
          'Inside each region, an ALB routes to ECS Fargate services running the stateless application tier. Fargate is chosen here over EC2 because the workload is bursty across regions (the failed region’s traffic surges into surviving regions), and Fargate scales tasks in seconds without managing EC2 capacity. The application tier holds no session state — every request can be served by any task in any region.',
      },
      {
        title: 'Aurora Global Database — Single Writer + Cross-Region Readers',
        description:
          'Aurora Global Database has its primary writer in us-east-1 and read replicas in eu-west-1 and ap-southeast-1, replicated at the storage layer with typical lag under 1 second. Writes from non-primary regions go through a write-forwarding layer (or are routed at the application via a "writer region" lookup). On primary-region failure, a secondary is promoted in under 1 minute, becoming the new global writer.',
      },
      {
        title: 'S3 Cross-Region Replication for User Assets',
        description:
          'User-uploaded assets live in a per-region S3 bucket. Cross-Region Replication (CRR) is enabled to mirror objects to the other two regions asynchronously. For latency-critical reads we layer an S3 Multi-Region Access Point in front of the buckets so reads always hit the nearest copy automatically. CRR replication metrics are monitored — sustained replication lag triggers an alarm.',
      },
      {
        title: 'ElastiCache Global Datastore + Route 53 ARC',
        description:
          'ElastiCache for Redis Global Datastore replicates session caches across regions with sub-second lag, so a user re-routed to another region finds their session warm. Route 53 Application Recovery Controller (ARC) provides controlled, audited regional failover with readiness checks — operators can drain a region for maintenance with one API call, and ARC verifies that the destination region is actually ready before flipping traffic.',
      },
    ],

    deepDive: [
      {
        title: 'Active-Active vs Active-Passive Trade-Offs',
        description:
          'Active-active means all regions serve traffic continuously — the failover path is exercised every second of every day, so you cannot accidentally ship a regression that breaks DR. The price is a much harder data model: writes can in principle originate anywhere, and the system has to decide which region "owns" each write. Active-passive avoids that problem (only one region writes) at the cost of a cold standby that may have undetected drift. We chose active-active for the read path everywhere, with a single global writer for the strongly-consistent write path — this captures most of active-active’s exercise benefit while keeping the data model sane.',
        insight:
          'A failover path you do not exercise daily is a failover path that does not work. Active-active forces you to live in DR mode all the time, which is the only honest test.',
      },
      {
        title: 'Writes During Regional Failover — Route 53 ARC Readiness',
        description:
          'During an Aurora Global writer failover, there is a short window where no region accepts writes. Route 53 ARC defines readiness checks on each region — replica lag below threshold, ECS task count above minimum, ALB target health green, dependency availability — and only allows a failover flip if the destination region passes all of them. This prevents the worst-case scenario of failing over to a region that is itself in trouble, which has caused several historical multi-region outages industry-wide. Application code must also handle the brief write-unavailable window with retries plus idempotency keys.',
        insight:
          'Failover is dangerous precisely because it happens during incidents — when other things are also wrong. ARC readiness checks gate the flip on facts, not assumptions.',
      },
      {
        title: 'Aurora Global Promote-to-Writer vs Point-in-Time Restore',
        description:
          'There are two recovery levers and they answer different questions. Aurora Global "managed planned failover" promotes a secondary region to writer in under 1 minute — used when the primary region is up but we want to drain it (maintenance, regulatory, evacuation drill). Aurora Global "unplanned failover" promotes during a real region loss; expect 1–2 minutes plus the time for the application to discover the new writer. Point-in-time restore (PITR) is for logical disasters (a bad migration, a wipe-out delete) and recovers a separate cluster from continuous backups in S3 — slower but to any second within the 35-day retention. We rehearse both quarterly with AWS FIS.',
        insight:
          'Promote-to-writer is your tool for infrastructure failures; PITR is your tool for human errors. They are not interchangeable, and you need both.',
      },
      {
        title: 'Testing DR with Chaos Engineering (AWS FIS)',
        description:
          'AWS Fault Injection Service runs scheduled experiments against production: terminate a fraction of ECS tasks in a region, inject latency on Aurora replication, simulate AZ loss by failing one of three subnets. Each experiment has a rollback condition (e.g., regional error rate > 2% aborts immediately). We require that any new component pass a "kill its dependencies" experiment before it goes to production. Quarterly we run a full regional evacuation drill — drain us-east-1 entirely via Route 53 ARC for 30 minutes during business hours and watch the surviving regions absorb the load.',
        insight:
          'You don’t actually have a DR plan until you have run it under load. FIS turns DR from a document into a habit.',
      },
      {
        title: 'Cost Modeling: 3-Region Active-Active vs 2-Region Active-Passive',
        description:
          'Three-region active-active runs roughly 3× the compute of a single region, plus inter-region data transfer (Aurora Global replication, S3 CRR, CloudWatch metrics). Two-region active-passive runs ~1.2× the compute (passive sized for failover capacity) plus replication. The active-active premium is real — often 30–50% of the bill — but it buys: zero RTO at the read path, geographic latency wins (a EU user gets a EU region, not a transatlantic round trip), and a continuously-tested failover. For a 99.99% SLA where every minute of downtime costs more than the AWS premium, active-active pays for itself; for an internal tool, active-passive is the responsible choice.',
        insight:
          'Multi-region is not a switch you flip — it is a budget you justify. Be honest with the business about whether the SLA is worth the tax before designing for it.',
      },
    ],

    decisions: [
      {
        question: 'Active-active vs active-passive across regions?',
        chosen: 'Active-active for reads, single-writer for strongly-consistent writes',
        reason:
          'Active-active on the read path gives users in every region the lowest possible latency and means the failover path is exercised every second — there is no cold-start surprise during a real outage. A single global writer for transactional state keeps the data model honest: no conflict resolution, no last-writer-wins ambiguity, no split-brain. Eventually-consistent writes (analytics events, telemetry) are written locally and replicated asynchronously, where conflict-free CRDT-style data structures apply. This hybrid captures the latency and exercise benefits of active-active while keeping the parts that need ACID actually ACID.',
      },
      {
        question: 'Aurora Global Database vs DynamoDB Global Tables?',
        chosen: 'Aurora Global Database',
        reason:
          'The application has rich relational data (users, accounts, transactions with foreign keys and aggregates). DynamoDB Global Tables provide multi-region multi-active with ~1-second replication and last-writer-wins conflict resolution — a great fit when the data model is genuinely key-value, but a poor fit for joins and ad-hoc SQL. Aurora Global gives us full PostgreSQL semantics with sub-second cross-region replication and a clear single-writer model, at the cost of write-forwarding latency from non-primary regions. If we were rebuilding from scratch with a key-value access pattern, DynamoDB Global Tables would be the right call.',
      },
      {
        question: 'Sticky sessions at the ALB vs stateless app tier?',
        chosen: 'Stateless app tier — sessions live in ElastiCache Global Datastore (or signed JWTs)',
        reason:
          'Sticky sessions tie a user to a specific ECS task; when that task dies, scales out, or its region fails, the user’s session is gone. Stateless tasks let any request go to any task in any region — which is exactly what we need during failover. Session state lives in ElastiCache Global Datastore (sub-second cross-region replication) or, for small state, in a signed JWT carried by the client. The cost is one extra cache lookup per request (~1ms) versus the gain of true regional fungibility. Sticky sessions remain useful for legacy stateful protocols, not for modern stateless web tiers.',
      },
    ],

    interview: [
      {
        q: 'How do you prevent split-brain writes during a network partition between regions?',
        a: 'Split-brain happens when two regions both believe they are the writer. We avoid it structurally: only one region holds the Aurora Global writer endpoint at a time, and that designation is controlled by a coordination plane (Route 53 ARC and Aurora’s own promotion API) which uses quorum across multiple AWS control planes. During a partition, the writer region keeps writing and the partitioned region simply cannot promote itself — Aurora’s promotion API requires a quorum acknowledgment. If the partition is severe enough that the writer region is unreachable from operators, ARC has a documented "force-failover" path that requires multi-party human approval and aborts if the original writer comes back online. The system fails closed: during ambiguity, the secondary stays read-only.',
      },
      {
        q: 'Walk me end-to-end through what happens when us-east-1 goes down.',
        a: 'Within seconds, CloudFront origin failover routes user requests away from us-east-1 to the next-closest origin (eu-west-1 or ap-southeast-1) on 5xx errors — most users notice nothing. Within 90 seconds, Route 53 health checks declare us-east-1 unhealthy and stop returning its IPs in DNS answers; new sessions go straight to surviving regions. Within 1–2 minutes, our automation (or AWS-managed Aurora Global with managed failover enabled) promotes eu-west-1’s Aurora replica to writer; the application’s data layer rediscovers the writer endpoint and resumes accepting writes. ECS services in surviving regions auto-scale up over the next 2–3 minutes to absorb the redirected traffic — Fargate spins up tasks in seconds. Total user-visible impact: a few seconds of elevated errors, then degraded latency for users formerly closest to us-east-1, with full availability throughout. Total RTO: under 5 minutes.',
      },
      {
        q: 'How do you test the DR plan without taking production down?',
        a: 'Three layers. (1) AWS Fault Injection Service experiments in production — small-blast-radius failures (kill 10% of ECS tasks, inject 100ms latency on one Aurora replica, fail one AZ’s subnets) on a schedule, with automatic rollback if regional error rate climbs. These run weekly and catch latent bugs in retry logic. (2) Quarterly regional evacuation drills using Route 53 ARC: drain us-east-1 entirely for 30 minutes during business hours; surviving regions absorb the load while ops watch dashboards. Because active-active means traffic is already flowing through all regions, this is a load-shifting exercise rather than a cold-start test. (3) Annual full-region failover drill: actually promote a secondary Aurora region to writer and run on it for an hour. The combination ensures we are never more than a quarter away from having proven the plan works under realistic load.',
      },
      {
        q: 'Why three regions instead of two?',
        a: 'Two regions can survive one region failing, but during that failure you have zero remaining redundancy — a second incident in the surviving region is a full outage. Three regions give you n+1 even during a regional outage, which is what 99.99% actually requires when you do the math: each region might offer 99.95%, but three independent 99.95%-availability regions in active-active configuration with proper failover compose to roughly 99.999%. Three regions also let you place one in each major geography (Americas, EMEA, APAC), which both improves global latency and gives you data-residency flexibility. The cost premium over two regions is meaningful but smaller than going from one region to two — the operational tooling (Route 53 ARC, Aurora Global, multi-region pipelines) is the same.',
      },
      {
        q: 'How do you handle a deploy that you only want to ship to one region first?',
        a: 'CodePipeline with sequential regional stages and a manual approval gate between them. Stage 1 deploys to ap-southeast-1 (smallest traffic share) and runs synthetic tests for 30 minutes. Stage 2 requires manual approval and deploys to eu-west-1, again with a soak period. Stage 3 deploys to us-east-1. CloudWatch composite alarms watch error rate, latency, and saturation in each region; an alarm during a soak period rolls back automatically by re-deploying the previous task definition. For schema changes, the same expand-contract pattern as a single-region deploy applies, but with the extra constraint that all three regions must run a code version compatible with both old and new schema for the duration of the multi-region rollout — typically a full week.',
      },
      {
        q: 'What does data residency look like when a user must stay in EU?',
        a: 'Route 53 geoproximity routing pins those users’ DNS resolutions to eu-west-1 regardless of latency, and the application checks the user’s residency flag on every write to refuse cross-region propagation for restricted records. The Aurora Global writer for restricted tenants is configured to live in eu-west-1, with replicas in other EU regions only — never crossing into us-east-1 or ap-southeast-1. S3 buckets for restricted users have CRR rules excluding non-EU destinations. CloudTrail and Config rules audit any cross-region access attempt. The architecture supports a per-tenant "home region" concept where the same global product can comply with regional regulations without forking the codebase.',
      },
    ],

    keyInsight:
      'Multi-region active-active is not a feature you turn on — it is a discipline of designing every layer (DNS, edge, compute, data, state) so that no single region is special. The hard parts are not in the diagram; they are in the readiness checks before failover, the idempotency keys that survive retries across regions, the chaos experiments that prove the failover actually works, and the honest cost conversation about whether the 99.99% SLA is worth the bill. Done well, a region disappearing becomes a non-event your customers don’t notice — done poorly, multi-region is a more expensive way to fail.',
  },
];
