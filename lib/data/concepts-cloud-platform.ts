import { Concept } from '../types';

export const CONCEPTS_CLOUD_PLATFORM: Concept[] = [
  {
    id: 'ec2',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🖥️',
    title: 'EC2 & Auto Scaling',
    tag: 'Virtual machines with elastic scaling on AWS',
    overview:
      'Amazon EC2 (Elastic Compute Cloud) provides resizable virtual machines — instances — on demand. You choose the instance type (CPU/RAM/network), launch it from an AMI, and pay per second of running time. Auto Scaling Groups (ASGs) maintain a fleet between min/max bounds, scaling out when CloudWatch alarms fire (CPU > 70%) and scaling in during quiet periods. Combined with an Application Load Balancer, ASGs deliver horizontal elasticity without manual intervention.',
    components: [
      {
        name: 'Instance Types',
        icon: '📊',
        role: 'Define CPU, RAM, storage, and network characteristics',
        detail:
          'General purpose (t3/m6i), compute-optimised (c6i), memory-optimised (r6i), storage-optimised (i3/i4i), GPU (p4d/g5). t-class burstable instances earn CPU credits when idle and spend them during spikes — great for dev environments or workloads with irregular CPU patterns. m/c/r classes provide consistent performance for production workloads.',
      },
      {
        name: 'AMI (Amazon Machine Image)',
        icon: '📸',
        role: 'Immutable snapshot of OS + software used to launch instances',
        detail:
          'An AMI captures the root EBS volume, launch permissions, and block device mappings. Custom AMIs bake in your application and dependencies for faster, more reliable launch (vs. bootstrapping at runtime). Storing secrets in AMIs is a severe anti-pattern — use Secrets Manager and instance roles instead.',
      },
      {
        name: 'Auto Scaling Group',
        icon: '📈',
        role: 'Maintains desired fleet size and integrates with load balancers',
        detail:
          'An ASG defines min/max/desired capacity and which Launch Template to use. It automatically registers new instances with the ALB target group and drains + terminates instances during scale-in. Health checks can be EC2-level (instance running) or ELB-level (ALB health probe) — always use ELB for application-aware health gating.',
      },
      {
        name: 'Launch Template',
        icon: '📋',
        role: 'Versioned spec for instance configuration',
        detail:
          'Defines AMI, instance type, security groups, IAM role, user-data bootstrap script, EBS volumes, and network settings. Launch Templates supersede Launch Configurations — they support versioning and mixed instance policies (multiple instance types in one ASG for Spot diversity).',
      },
      {
        name: 'Scaling Policies',
        icon: '⚖️',
        role: 'Rules that determine when and how many instances to add or remove',
        detail:
          'Target tracking: keep a metric at a target value (e.g., CPU at 50%) — AWS computes the required instance count automatically. Step scaling: add 2 instances at 70% CPU, add 4 at 90%. Scheduled scaling: predictive scale-up before a known event. Predictive scaling (ML-based): analyses patterns and pre-scales before traffic surges.',
      },
      {
        name: 'Spot Instances',
        icon: '💸',
        role: 'Spare EC2 capacity at 70-90% discount with 2-min interruption notice',
        detail:
          'Spot Instances can be reclaimed by AWS with 2-minute notice. Use them for fault-tolerant batch jobs, CI/CD runners, and stateless web tier workers. Mixed instance policy in ASGs combines On-Demand base capacity with Spot for the majority — achieving cost savings while maintaining resilience via diverse Spot pools (multiple instance types, multiple AZs).',
      },
    ],
    howItWorks:
      'A user request hits the ALB, which distributes traffic to healthy instances in the ASG across multiple AZs. CloudWatch collects metrics every 60s (10s with detailed monitoring). When a target-tracking policy detects average CPU above threshold, the ASG computes a new desired count and launches instances from the Launch Template. The new instance runs its user-data bootstrap script, passes the ALB health check, then receives live traffic. During scale-in, connection draining lets in-flight requests complete (default 300s) before EC2 terminates the instance.',
    decision: {
      choose: [
        'EC2 for workloads needing full OS control, persistent processes, GPU, large memory (>10 GB), or compliance requiring dedicated tenancy',
        'Auto Scaling + ALB for stateless web/API tiers that need horizontal elasticity',
        'Spot Instances for batch processing, CI/CD, and stateless workers tolerating interruptions — saves 70-90% vs On-Demand',
        'Reserved Instances or Savings Plans when baseline capacity is predictable (1-3 year commitment, 30-60% savings)',
        'EC2 over Lambda for sustained high-throughput workloads — Lambda cost exceeds EC2 above ~200ms average duration at high RPS',
      ],
      avoid: [
        'EC2 for event-driven, short-lived tasks — Lambda or Fargate is simpler and cheaper',
        'Single-instance deployments without ASG — no automatic replacement on failure',
        'Public IP on application servers — place EC2 in private subnets behind ALB',
        'Hardcoding credentials in AMIs or user-data — use IAM roles and Secrets Manager',
        'Resizing instances manually under load — vertical scaling requires downtime; design for horizontal scaling from day one',
      ],
      vs: [
        {
          name: 'EC2 vs Lambda',
          when: 'EC2 for long-running processes (>15 min), persistent connections (WebSockets), GPU workloads, or predictable sustained load where Reserved pricing makes EC2 cheaper. Lambda for event-driven, spiky, short-duration tasks where you want zero infrastructure management.',
        },
        {
          name: 'EC2 vs ECS Fargate',
          when: 'ECS Fargate when you want container-level isolation with no EC2 management (patching, AMI updates, capacity planning). EC2 when you need specific instance types (GPU, high memory), want to optimise cost with Reserved Instances, or need access to instance-level features.',
        },
        {
          name: 'On-Demand vs Spot vs Reserved',
          when: 'On-Demand: baseline flexibility, no commitment. Spot: up to 90% off for interruption-tolerant batch. Reserved/Savings Plans: 1-3 year commitment, 30-60% savings for steady-state baseline. Typical production mix: Reserved base (60%) + On-Demand buffer (20%) + Spot for scale-out (20%).',
        },
      ],
    },
    failures: [
      {
        name: 'Scaling Lag During Traffic Spikes',
        cause: 'ASG target tracking reacts to the current metric, not the future. A sudden 10x traffic spike triggers scale-out, but EC2 launch + bootstrap takes 3-5 minutes.',
        symptom: 'Latency spikes and HTTP 5xx errors during the lag window as existing instances are overwhelmed before new ones become healthy.',
        fix: 'Use Predictive Scaling (analyses historical patterns) to pre-warm instances 5-10 minutes before expected spikes. Combine with a Warm Pool (pre-initialised stopped instances that start in <30s) for unpredicted surges.',
        severity: 'high',
      },
      {
        name: 'ASG Thrashing (Rapid Scale-In/Out)',
        cause: 'Insufficient cooldown period causes the ASG to add instances, see CPU drop, remove them, see CPU rise, and repeat in a loop — especially with aggressive target tracking.',
        symptom: 'Frequent instance launches and terminations visible in ASG activity history. Bill shows many short-lived instances. Intermittent performance degradation.',
        fix: 'Set scale-in cooldown to 300s minimum (default). Use target tracking with a higher target value (60-70% CPU rather than 50%). Add scale-in protection for instances processing long jobs. Consider step scaling with explicit instance counts.',
        severity: 'medium',
      },
      {
        name: 'AZ Instance Imbalance',
        cause: 'One AZ becomes unavailable, ASG launches replacement instances in other AZs but does not redistribute when the AZ recovers — or Spot capacity is exhausted in one AZ.',
        symptom: 'Uneven request distribution across AZs. One AZ handles disproportionate traffic. Cross-AZ data transfer costs increase.',
        fix: 'Enable the "Rebalance" feature in ASG. Use AZ rebalancing policy. For Spot, define multiple instance types + all AZs in the mixed instance policy to reduce Spot interruption risk.',
        severity: 'medium',
      },
      {
        name: 'Bootstrap Failures Go Undetected',
        cause: 'User-data script fails silently — bash exits with code 0 even if application failed to start. Instance passes EC2 health check (OS running) but fails ELB health check silently.',
        symptom: 'ASG launches instance, instance appears healthy from EC2 perspective, but ELB health check fails repeatedly until instance is terminated and replaced — masking the root cause.',
        fix: 'Use ELB health check type (not EC2) on the ASG to catch application failures. Add cfn-signal + CreationPolicy for CloudFormation stacks. Implement structured logging in user-data that writes to CloudWatch Logs. Test AMIs in staging before production rollout.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏙️🏗️⚖️',
      t: 'A Staffing Agency for a Restaurant',
      tx: 'Imagine your web application is a restaurant. EC2 instances are the kitchen staff — each one can cook (handle requests). On a normal Tuesday you need 4 cooks. On Friday night you need 12. On Christmas Eve you need 40.\n\nManually hiring and firing staff every day is impossible. So you hire a staffing agency (Auto Scaling Group) with a contract: always have at least 4 cooks (min), never more than 40 (max), and aim for 12 (desired). The agency\'s rule is: if every cook is working at more than 70% capacity, hire 2 more immediately.\n\nThe agency pre-qualifies all staff using a standard profile (Launch Template) — everyone knows the same recipes (AMI with your application), wears the same uniform, and passes a cooking test (health check) before serving tables.\n\nSpot Instances are the day-hire workers you get at a huge discount — great for prep work in the morning, but they might leave with 2 minutes notice if another restaurant offers more. You only put them on tasks that can be handed off quickly.\n\nThe analogy breaks at scale: unlike real staff, EC2 instances are perfectly identical, never call in sick, and boot from zero to productive in 2-5 minutes.',
      s: 'The operational insight that separates junior from senior EC2 architecture: the 5-minute launch latency window is the enemy of reactive scaling. Every scaling architecture must answer "what happens during those 5 minutes?" Warm pools, predictive scaling, over-provisioning a buffer, or caching/queue absorption are all valid answers — but having no answer means your users feel every traffic spike as a latency spike.',
    },
    te: {
      def: 'EC2 instances run as hardware-virtualised VMs on AWS Nitro System hypervisor — a purpose-built lightweight hypervisor that offloads networking and storage virtualisation to dedicated Nitro Cards, leaving nearly all the physical host CPU for customer workloads. Auto Scaling Groups are implemented using EC2 Fleet APIs under the hood.',
      types: [
        { n: 'On-Demand Instances', d: 'Pay by the second, no commitment. Full list price. Suitable for unpredictable or short-term workloads.' },
        { n: 'Reserved Instances / Savings Plans', d: '1-3 year commitment, 30-60% discount. Savings Plans are more flexible (apply to Lambda and Fargate too). RIs apply to specific instance type+region.' },
        { n: 'Spot Instances', d: 'Spare capacity at 70-90% discount. Interrupted with 2-minute notice. Use for fault-tolerant batch, CI/CD, or stateless workers.' },
        { n: 'Dedicated Hosts', d: 'Physical server dedicated to your account. Required for BYOL software licenses or compliance requiring physical isolation. Most expensive option.' },
        { n: 'Metal Instances (bare metal)', d: 'Direct access to physical hardware — no hypervisor between your workload and the hardware. Used for VMware Cloud on AWS, containerised workloads needing hardware access.' },
      ],
      when: 'EC2 is appropriate when you need consistent compute with full OS access, workloads running >15 minutes, persistent state on local disk, GPU access, or compliance requiring specific hardware characteristics. For stateless, containerised, or event-driven workloads, Fargate or Lambda offer better operational simplicity.',
      trade: 'EC2 gives maximum control and flexibility but requires you to manage capacity, patching, AMI updates, and failure recovery. Spot Instances provide dramatic cost savings but introduce interruption risk. The fundamental EC2 trade-off vs. serverless is control vs. operational simplicity: EC2 teams own their stack; Lambda teams rent execution.',
      code: `# Terraform: ASG with mixed On-Demand/Spot and target tracking
resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = data.aws_ami.al2023.id
  iam_instance_profile { name = aws_iam_instance_profile.app.name }
  vpc_security_group_ids = [aws_security_group.app.id]
  metadata_options {
    http_tokens                 = "required"   # IMDSv2 mandatory
    http_put_response_hop_limit = 1
  }
  user_data = base64encode(file("scripts/bootstrap.sh"))
}

resource "aws_autoscaling_group" "app" {
  name                = "app-asg"
  min_size            = 2
  max_size            = 50
  desired_capacity    = 4
  vpc_zone_identifier = module.vpc.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 120

  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 2
      on_demand_percentage_above_base_capacity = 20
      spot_allocation_strategy                 = "price-capacity-optimized"
    }
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }
      override { instance_type = "m6i.large"  }
      override { instance_type = "m5.large"   }
      override { instance_type = "m6a.large"  }
      override { instance_type = "c6i.xlarge" }
    }
  }
}

resource "aws_autoscaling_policy" "cpu" {
  name                   = "target-cpu-60"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60.0
  }
}`,
      rw: {
        ex: [
          'Netflix uses hundreds of thousands of EC2 instances across regions, with Spot Instances handling encoding workloads — tolerating interruptions with checkpoint-based resume.',
          'Airbnb scales their search backend with ASGs during peak booking periods (holidays, New Year), using predictive scaling based on historical patterns.',
          'AWS itself uses EC2 internally for many managed services, including the control planes for RDS, ElastiCache, and Redshift.',
          'Pinterest runs their image processing pipeline on Spot Instances, saving ~60% on compute costs vs. On-Demand.',
        ],
        cs: 'When EC2 Auto Scaling saved a fintech startup: their payment processing API ran on fixed 8 EC2 instances. End-of-month payroll cycles caused 12× normal traffic, overwhelming the cluster and dropping transactions. After migrating to an ASG with target tracking (60% CPU target, min=4, max=30) and a Warm Pool of 5 pre-initialised instances, the payroll spikes went unnoticed by users. Monthly cost actually decreased 22% because instances scaled down during nights and weekends.',
      },
    },
    interview: {
      q: 'Design an auto-scaling web tier for a fintech application that handles 10× traffic spikes during month-end payroll processing.',
      a: 'Use an ALB in front of an ASG across 3 AZs. Set On-Demand base capacity (min=6) for baseline reliability, Spot Instances for scale-out (80% Spot above base, multiple instance families for interruption resilience). Configure target tracking at 60% CPU with scale-in cooldown of 300s. Add a Warm Pool of 5 pre-initialised stopped instances to handle sudden surges in <30s. Use Predictive Scaling to pre-warm the week before month-end based on historical metrics. Implement connection draining (deregistration delay = 30s for stateless requests). All instances launch in private subnets with public traffic entering only through ALB.',
      fu: [
        'How does a Warm Pool differ from just increasing the minimum instance count in the ASG?',
        'What is IMDSv2 and why should you enforce it?',
        'How would you implement zero-downtime blue/green deployments using two ASGs and weighted ALB target groups?',
        'Explain the difference between EC2 health checks and ELB health checks in an ASG, and when each is appropriate.',
        'How do you handle Spot Instance interruptions gracefully in a stateless web tier?',
        'When does EC2 become more cost-effective than Lambda for API workloads?',
      ],
    },
  },

  {
    id: 'lambda',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '⚡',
    title: 'AWS Lambda & Serverless',
    tag: 'Event-driven functions that scale to zero — pay only for execution time',
    overview:
      'AWS Lambda executes code in response to events — HTTP via API Gateway, S3 uploads, SQS messages, DynamoDB Streams, CloudWatch schedules, and 200+ other sources. You upload a function (zip or container image up to 10 GB), configure memory (128 MB–10 GB — CPU scales proportionally), and AWS manages the execution environment. Billing is per millisecond × GB-memory; idle time is completely free. Lambda scales from zero to thousands of concurrent executions within seconds, automatically.',
    components: [
      {
        name: 'Execution Environment (Firecracker)',
        icon: '🔥',
        role: 'Isolated micro-VM that runs your function code',
        detail:
          'Each Lambda function runs in a Firecracker micro-VM — a KVM-based VMM that boots in <125ms with a minimal memory footprint (~5MB). The init phase (cold start) loads the runtime and your code; subsequent invocations reuse the warm container (warm start). Global scope (module-level) code and initialised connections persist across warm invocations — use this for database connections, HTTP clients, and loaded ML models.',
      },
      {
        name: 'Event Sources & Invocation Models',
        icon: '📨',
        role: 'Trigger mechanisms that determine delivery semantics',
        detail:
          'Synchronous: API Gateway, ALB, Cognito, direct invoke — caller waits for response, errors returned to caller. Asynchronous: S3, SNS, EventBridge — Lambda retries twice on failure, then routes to dead-letter queue (SQS/SNS). Polling: SQS, Kinesis, DynamoDB Streams — Lambda polls the source in batches using long-polling; you control batch size and maximum batching window.',
      },
      {
        name: 'Concurrency Models',
        icon: '🔢',
        role: 'Controls how many simultaneous executions are permitted',
        detail:
          'Account default: 1,000 concurrent executions per region (soft limit, can increase to millions). Reserved Concurrency: guaranteed allocation for a function; also limits maximum concurrency (protects downstream systems). Provisioned Concurrency: pre-warmed execution environments eliminate cold starts — billed continuously even when idle. Use Provisioned Concurrency for latency-sensitive user-facing functions.',
      },
      {
        name: 'Layers',
        icon: '📦',
        role: 'Shared dependency packages deployed independently of function code',
        detail:
          'Up to 5 layers per function, 250 MB total unzipped. Layers reduce deployment package size and enable sharing common libraries (pandas, numpy, custom runtimes) across functions. AWS provides managed layers for popular runtimes. Layers are cached in the execution environment and do not contribute to cold start time after the first invocation.',
      },
      {
        name: 'Destinations & DLQ',
        icon: '🎯',
        role: 'Route async invocation results (success or failure) to other services',
        detail:
          'Asynchronous destinations: on success/failure, send the event metadata (not return value) to SQS, SNS, EventBridge, or another Lambda. Cleaner than wrapping in try/catch. Dead-letter queues (DLQ) capture events that exhaust retry attempts — critical for ensuring no events are silently dropped in async workflows.',
      },
      {
        name: 'Lambda@Edge & CloudFront Functions',
        icon: '🌍',
        role: 'Execute function logic at CloudFront PoPs close to the user',
        detail:
          'Lambda@Edge: runs at 400+ PoPs, full Node.js/Python, up to 5s (viewer request/response), 30s (origin request/response). Latency-based routing, A/B testing, auth at the edge. CloudFront Functions: JavaScript only, runs at all PoPs, <1ms execution, 2MB code limit — perfect for header manipulation, URL rewrites, and simple auth checks without Lambda@Edge overhead.',
      },
    ],
    howItWorks:
      'First invocation (cold start): AWS creates a Firecracker micro-VM, downloads your code from S3, initialises the runtime, executes module-level initialisation code (/init phase). The handler function runs, returns result, container waits idle. Subsequent warm invocations skip VM creation and init — only the handler runs (1-2ms overhead). For SQS polling: Lambda polls SQS using long-polling in batches (up to 10,000 messages, configurable batch window). Failed messages remain in the queue past visibility timeout, are retried, then routed to DLQ after maxReceiveCount attempts.',
    decision: {
      choose: [
        'Lambda for event-driven tasks, API backends with spiky traffic, file processing pipelines, scheduled jobs, and glue code between services',
        'Lambda when zero-infrastructure-management and automatic scaling to zero are valuable (dev/test, low-traffic internal tools)',
        'Lambda for event fanout: SNS → multiple Lambda subscribers scale independently without provisioning',
        'Lambda@Edge for personalisation, auth, and redirects at CDN layer without a full backend round-trip',
        'Provisioned Concurrency for latency-sensitive endpoints (p99 < 100ms) where cold starts are unacceptable',
      ],
      avoid: [
        'Lambda for functions exceeding 15 minutes — use Step Functions to chain Lambdas or ECS for long jobs',
        'Lambda for large in-memory state, ML inference with large models (>10 GB), or GPU workloads — use ECS or SageMaker',
        'Lambda for steady, high-throughput workloads where EC2/ECS Reserved capacity is significantly cheaper',
        'Lambda without idempotency design — async invocations retry on failure; duplicate processing is guaranteed to happen eventually',
        'Connecting Lambda directly to RDS without RDS Proxy — thousands of Lambda instances exhaust database connection limits',
      ],
      vs: [
        {
          name: 'Lambda vs ECS Fargate',
          when: 'Lambda for stateless, event-driven, <15 min tasks that need automatic scaling to zero. Fargate for containerised workloads needing persistent connections, custom runtimes, or consistent high throughput where paying for idle Lambda concurrency via Provisioned Concurrency approaches Fargate cost.',
        },
        {
          name: 'Lambda vs EC2',
          when: 'At ~200ms average duration and high sustained RPS, EC2 Reserved becomes cheaper than Lambda. Rule of thumb: above 1,000 req/s with >100ms average duration, run a cost comparison. Lambda wins on operational simplicity; EC2 wins on cost at sustained scale.',
        },
        {
          name: 'SQS Lambda vs SNS Lambda',
          when: 'SQS Lambda: guaranteed at-least-once processing with batching, DLQ for failures, rate limiting via Reserved Concurrency. SNS Lambda: fan-out to multiple consumers, lower latency, but no built-in retry batching. Use SQS when ordering/backpressure matters; SNS when multiple independent consumers need the same event.',
        },
      ],
    },
    failures: [
      {
        name: 'Cold Start Latency on User-Facing APIs',
        cause: 'First invocation after idle period (or burst of new concurrent invocations) triggers cold start — VM creation + runtime init adds 200ms-1s depending on runtime and package size.',
        symptom: 'p99/p99.9 latency spikes visible in API Gateway metrics. Users report intermittent slowness. First request after deployment always slow.',
        fix: 'Enable Provisioned Concurrency for latency-sensitive functions. Use Lambda SnapStart for Java (restore from pre-initialised snapshot, reduces cold start to ~200ms). Minimise package size — only bundle dependencies you need. Keep function memory ≥512 MB (more CPU proportionally). Use lighter runtimes (Node.js, Python) for latency-sensitive paths.',
        severity: 'high',
      },
      {
        name: 'SQS Poison Pill Blocks Queue',
        cause: 'A malformed message causes the handler to always throw an exception. The message retries within the batch, blocking all messages behind it in a FIFO queue or causing repeated partial-batch failures in standard queues.',
        symptom: 'SQS queue depth grows, age of oldest message increases, Lambda error rate spikes. Messages pile up behind the poison pill. DLQ may not be configured.',
        fix: 'Implement partial batch response (reportBatchItemFailures) — return only failed messageIds so healthy messages are not re-queued. Set maxReceiveCount on DLQ (3-5 attempts). Implement validation at the producer to prevent malformed messages. For FIFO queues, use message group IDs to isolate failures to a subset of the queue.',
        severity: 'critical',
      },
      {
        name: 'Concurrency Exhaustion Throttling',
        cause: 'A traffic spike or runaway function consumes all available concurrency (default 1,000/region). New invocations are throttled (429). Other functions in the account are starved.',
        symptom: 'CloudWatch TooManyRequestsException errors. Some Lambda functions stop responding while others are unaffected. API Gateway returns 429 to clients.',
        fix: 'Set Reserved Concurrency on each critical function to guarantee capacity and isolate blast radius. Monitor ConcurrencySpilloverInvocations metric. Request account concurrency limit increases from AWS Support proactively. Use SQS as buffer (messages queue rather than triggering throttled Lambdas directly).',
        severity: 'critical',
      },
      {
        name: 'RDS Connection Pool Exhaustion',
        cause: 'Lambda scales to hundreds of concurrent invocations, each opening its own RDS connection. RDS max_connections (determined by instance memory) is exhausted — typically 100-200 connections on small instances.',
        symptom: 'RDS metric DatabaseConnections reaches max_connections. Lambda functions time out waiting for connection. RDS connection errors in logs.',
        fix: 'Deploy RDS Proxy in front of RDS. RDS Proxy pools and multiplexes thousands of Lambda connections into a small set of long-lived database connections. Requires IAM authentication (no password in code). Also helps reduce failover impact from minutes to <30s.',
        severity: 'critical',
      },
    ],
    a: {
      v: '🏭🎰⚡',
      t: 'A Vending Machine Factory That Builds Machines On Demand',
      tx: 'Imagine a vending machine factory. Normally, you buy a machine, place it in a location, and it sits there 24/7 whether customers use it or not — that\'s EC2. You pay for the machine regardless.\n\nLambda is different: you describe what the machine does, and the factory builds one instantly when a customer walks up, dispenses exactly what they need, and then dismantles itself. You pay only for those 30 seconds of operation — not the other 23 hours and 59.5 minutes the machine would have sat idle.\n\nThe catch: the first customer each day waits an extra 30 seconds (cold start) for the machine to be built. Regular customers who come every few minutes get a pre-built machine ready to go (warm start). For your busiest machine, you can keep a few always pre-built (Provisioned Concurrency) — you pay for those even when idle, but your most important customers never wait.\n\nThe factory can build a thousand machines simultaneously if a thousand customers show up at once — no planning needed. But each machine has a 15-minute timer: if you\'re still using it at 15 minutes, it shuts off and a new one starts.\n\nThe analogy breaks for anything stateful: since machines are dismantled, they can\'t remember anything about the previous customer.',
      s: 'The architectural nuance that separates serverless experts from beginners: idempotency is not optional. Lambda async invocations are retried on failure — your function will process the same event multiple times in the real world. Every Lambda function that writes to a database, sends an email, or charges a credit card must be idempotent. The common patterns: use a unique event ID as a DynamoDB conditional write key, or check-then-insert with a unique constraint at the database layer. "At-least-once" is the guarantee; "exactly-once" is your responsibility.',
    },
    te: {
      def: 'Lambda runs on Firecracker — an open-source KVM-based VMM developed by AWS. Firecracker boots a micro-VM in <125ms with a ~5MB memory footprint per VM. The Lambda service maintains a fleet of pre-warmed execution environments (slots) that it assigns to function invocations. Warm starts reuse the runtime process (Python interpreter, JVM, Node.js event loop) without re-initialising it.',
      types: [
        { n: 'Synchronous Invocation', d: 'Caller waits for response. Error handling is caller\'s responsibility. Used by API Gateway, ALB, Cognito. Response includes function output and metadata.' },
        { n: 'Asynchronous Invocation', d: 'Lambda queues the event internally and returns 202 immediately. Retries twice on failure (total 3 attempts). Routes failures to DLQ or destination after retries. Used by S3, SNS, EventBridge.' },
        { n: 'Event Source Mapping (Polling)', d: 'Lambda polls the source (SQS, Kinesis, DynamoDB Streams) in batches. Manages checkpointing (Kinesis/Streams) or message deletion (SQS) automatically. Supports partial batch failure responses.' },
        { n: 'Lambda SnapStart (Java)', d: 'Takes a snapshot of initialised execution environment after init phase. Restores from snapshot on cold start, reducing Java cold start from ~4s to ~200ms.' },
        { n: 'Lambda Container Images', d: 'Package function as OCI-compatible container image up to 10 GB. Full control over OS packages and runtime. Cold starts are comparable to zip deployments for cached images.' },
      ],
      when: 'Lambda is the right choice when: tasks are event-triggered and run <15 minutes, traffic is variable or spiky with significant idle time, you want zero infrastructure management, or you need fine-grained cost accounting per function. Evaluate alternatives when sustained throughput is high (EC2/ECS may be cheaper), execution time exceeds 15 minutes, or you need persistent connections or large local state.',
      trade: 'Lambda\'s core trade-off is operational simplicity vs. control. You gain automatic scaling, zero idle cost, and no patching — but lose persistent local state, long-running process support, and fine-grained control over the execution environment. Cold starts introduce tail latency that synchronous architectures must budget for. The 15-minute execution limit is a hard architectural constraint that shapes system design.',
      code: `# Lambda + SQS with partial batch failure response (Python 3.12)
import json
import boto3
from typing import Any

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event: dict, context: Any) -> dict:
    failures = []
    for record in event['Records']:
        msg_id = record['messageId']
        try:
            body = json.loads(record['body'])
            # Idempotent write: fails gracefully if already processed
            table.put_item(
                Item={
                    'orderId': body['orderId'],
                    'status': 'processed',
                    'processedAt': int(time.time()),
                },
                ConditionExpression='attribute_not_exists(orderId)',
            )
        except table.meta.client.exceptions.ConditionalCheckFailedException:
            pass  # Already processed — idempotent, ignore
        except Exception as e:
            print(f"Failed {msg_id}: {e}")
            failures.append({"itemIdentifier": msg_id})
    # Only failed items re-enter queue
    return {"batchItemFailures": failures}

# Terraform: Lambda + SQS event source mapping
resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn                   = aws_sqs_queue.orders.arn
  function_name                      = aws_lambda_function.processor.arn
  batch_size                         = 100
  maximum_batching_window_in_seconds = 5
  function_response_types            = ["ReportBatchItemFailures"]
  scaling_config { maximum_concurrency = 200 }
}`,
      rw: {
        ex: [
          'Coca-Cola replaced a fleet of EC2 servers processing vending machine transactions with Lambda — reduced cost by 65% and eliminated the need to manage servers for variable vending traffic patterns.',
          'iRobot processes all Roomba device telemetry through Lambda triggered by IoT Core — scales automatically from 0 to millions of device events per day without capacity planning.',
          'Netflix uses Lambda for encoding video for different device profiles, triggered by S3 uploads — scales to thousands of concurrent encoding jobs for new content releases.',
          'Nordstrom rebuilt their product recommendation engine as Lambda functions behind API Gateway — eliminated idle EC2 costs during off-peak hours (significant for seasonal retail).',
        ],
        cs: 'A media startup processed video thumbnail generation on 6 always-on EC2 instances. Off-peak (midnight to 8am), the instances sat at <5% CPU. After migrating to Lambda triggered by S3 upload events, processing time went from 4s average to 1.2s (Lambda initialised instantly, parallel processing), and compute cost dropped 78%. The only trade-off: maximum video duration capped at 15 minutes for the Lambda processing window — longer videos used a fallback ECS Fargate job.',
      },
    },
    interview: {
      q: 'Design a serverless event processing pipeline that ingests 50 million events per day from an IoT fleet, transforms each event, and stores it in DynamoDB with at-most-once processing semantics.',
      a: 'IoT Core → SQS Standard Queue → Lambda (event source mapping, batch=1000, bisect-on-error, DLQ). Lambda transforms events and writes to DynamoDB using conditional writes (attribute_not_exists idempotency key on deviceId+timestamp). SQS provides buffering for Lambda scaling lag. Reserved Concurrency on Lambda limits DynamoDB write throughput to stay within provisioned capacity. DLQ captures poison pills for manual review. CloudWatch alarms on DLQ depth and Lambda error rate. For exactly-once semantics (at-most-once is easier): use DynamoDB conditional writes as the idempotency checkpoint — any duplicate event from SQS retry is silently dropped by the ConditionExpression.',
      fu: [
        'How does Lambda\'s concurrency model differ from traditional thread-per-request servers?',
        'When would you use Provisioned Concurrency vs Warm Pools on EC2 vs just accepting cold starts?',
        'Explain the difference between SQS Standard and FIFO queues and when each is appropriate for Lambda event source mappings.',
        'How would you implement distributed tracing across Lambda functions in a multi-step pipeline?',
        'What is Lambda Power Tuning and how does it help optimise function configuration?',
        'Describe the Lambda execution environment lifecycle — what persists between warm invocations and what does not?',
      ],
    },
  },

  {
    id: 'containers',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🐳',
    title: 'Containers: ECS & EKS',
    tag: 'Docker containers orchestrated by AWS — from simple ECS to full Kubernetes',
    overview:
      'Containers package application code, runtime, and dependencies into portable OCI images that run identically everywhere. AWS offers two orchestration layers: ECS (AWS-native, simpler) and EKS (Kubernetes, industry-standard portable). Both support Fargate (serverless data-plane — no EC2 instances to manage) and EC2 launch types. The choice between ECS and EKS is primarily about team familiarity, portability requirements, and how much Kubernetes ecosystem tooling you need.',
    components: [
      {
        name: 'Docker Image & ECR',
        icon: '📦',
        role: 'Immutable container image stored in AWS container registry',
        detail:
          'An OCI image bundles your application binary, all dependencies, and OS libraries into immutable layers. Amazon ECR (Elastic Container Registry) stores images with automatic replication, vulnerability scanning (via Amazon Inspector), and fine-grained IAM permissions. ECR lifecycle policies automatically expire old image tags. Images pulled from ECR within the same region incur no data transfer charges.',
      },
      {
        name: 'ECS Task Definition',
        icon: '📋',
        role: 'Blueprint defining container configuration for an ECS deployment',
        detail:
          'JSON document specifying container image, CPU/memory allocation, port mappings, environment variables, secrets (from Secrets Manager or SSM Parameter Store), IAM task role, and log driver (awslogs → CloudWatch Logs). Task definitions are versioned — you roll forward by updating the definition and deploying the new revision.',
      },
      {
        name: 'ECS Service',
        icon: '⚙️',
        role: 'Maintains desired number of running tasks and connects them to load balancers',
        detail:
          'An ECS Service ensures N tasks are always running, restarts failed tasks, performs rolling updates with configurable minimumHealthyPercent / maximumPercent, and integrates with ALB/NLB target groups for traffic routing. Blue/green deployments via AWS CodeDeploy allow instant rollback by traffic shift. Service Auto Scaling adjusts desired count based on CloudWatch metrics.',
      },
      {
        name: 'AWS Fargate',
        icon: '🚀',
        role: 'Serverless compute layer for containers — no EC2 instances to manage',
        detail:
          'Fargate allocates isolated micro-VMs (Firecracker) per task — each task gets its own kernel, eliminating noisy-neighbour interference. No EC2 patching, AMI management, or capacity planning. Pay per vCPU-second and GB-second. Ideal for variable workloads or teams wanting zero infrastructure operations. Fargate tasks launch in ~30s vs ~5 min for EC2 instance launch + bootstrap.',
      },
      {
        name: 'Amazon EKS',
        icon: '☸️',
        role: 'Managed Kubernetes control plane on AWS',
        detail:
          'EKS manages the Kubernetes API server and etcd cluster (the control plane). You manage the data plane: EC2 managed node groups, self-managed nodes, or Fargate profiles. Full Kubernetes API compatibility means any K8s tooling (Helm, Argo CD, Istio, Karpenter) works natively. EKS is the choice for organisations already invested in Kubernetes or needing multi-cloud portability.',
      },
      {
        name: 'Karpenter',
        icon: '🎛️',
        role: 'Open-source node provisioner for Kubernetes that replaces Cluster Autoscaler',
        detail:
          'Karpenter provisions EC2 nodes within seconds by directly calling EC2 Fleet APIs — 3-5× faster than Cluster Autoscaler. It selects optimal instance types based on pod resource requests and supports topology spread constraints for AZ balancing. Karpenter consolidates nodes by bin-packing and terminates underutilised instances, reducing waste. Now a CNCF project; AWS maintains the AWS-native provider.',
      },
    ],
    howItWorks:
      'ECS flow: Service scheduler places tasks on Fargate or EC2 capacity based on CPU/memory fit. On new deployment, ECS performs rolling update: launch new task → wait for ALB health check to pass → register in target group → drain connections from old task → stop old task. EKS flow: `kubectl apply` sends a Deployment spec to the Kubernetes API server → stored in etcd → kube-scheduler assigns pod to a node (or Karpenter provisions a new one) → kubelet on the node pulls the image from ECR → containerd starts the container → AWS VPC CNI assigns a VPC IP to the pod → kube-proxy updates iptables rules so the K8s Service routes to the pod.',
    decision: {
      choose: [
        'ECS when your team is AWS-native and wants simplicity — fewer concepts, tighter AWS integration, lower operational overhead',
        'EKS when you have existing Kubernetes expertise, need K8s ecosystem tooling (Argo CD, Istio, Prometheus Operator), or require multi-cloud portability',
        'Fargate for variable workloads, dev/test, or teams wanting zero infrastructure operations — accept ~20% cost premium over EC2 for operational simplicity',
        'EC2 nodes for cost optimisation at scale with Reserved/Spot instances, GPU workloads, or requiring specific hardware characteristics',
        'Containers over Lambda when: tasks run >15 minutes, need persistent TCP connections, use large binaries/models, or have sustained high throughput',
      ],
      avoid: [
        'EKS for small teams with no Kubernetes experience — the operational complexity overhead (etcd, RBAC, CNI, admission controllers) can consume significant engineering time',
        'Fargate for latency-sensitive workloads requiring <30s startup — EC2 warm pools are faster for rapid scale-out',
        'Containers without resource requests and limits set — leads to noisy-neighbour problems and inaccurate scheduling decisions',
        'Storing secrets in container images or environment variables as plaintext — use Secrets Manager with container secrets injection',
        'Single container per task definition for tightly-coupled sidecar patterns — use multi-container task definitions (ECS) or pod specs (EKS) for sidecar proxies and log routers',
      ],
      vs: [
        {
          name: 'ECS vs EKS',
          when: 'ECS is simpler (fewer abstractions, all AWS-native, no kubectl), better for teams new to containers. EKS provides full Kubernetes API, portability, rich ecosystem (Argo CD, Istio, Karpenter), and is the industry standard for large organisations. Migration from ECS to EKS is feasible but requires significant rework; choose deliberately.',
        },
        {
          name: 'Fargate vs EC2 Nodes',
          when: 'Fargate: zero node management, better security isolation (per-task VM), fast task startup for pre-sized tasks. EC2: 30-70% cheaper at sustained load with Reserved/Spot, required for GPU/custom hardware, better performance for CPU-intensive workloads (no VMM overhead). Rule of thumb: use Fargate by default; switch to EC2 nodes when Fargate cost becomes material.',
        },
        {
          name: 'Containers vs Lambda',
          when: 'Containers for: persistent processes, >15min jobs, WebSocket servers, large dependencies (>250MB), or consistent high throughput. Lambda for: event-driven spiky workloads, scale to zero, ultra-short tasks. Containers bridge the gap — Lambda container images (up to 10GB) combine Lambda\'s event model with container deployment.',
        },
      ],
    },
    failures: [
      {
        name: 'Container Image Pull Failure on Launch',
        cause: 'ECS/EKS task cannot reach ECR to pull the container image. Common causes: missing IAM permissions on the task execution role, no VPC endpoint for ECR, or ECR in a different region.',
        symptom: 'Task fails to start with "CannotPullContainerError" or ImagePullBackOff in K8s. Service oscillates between RUNNING and STOPPED. New deployments fail silently with no running tasks.',
        fix: 'Ensure execution role has ecr:GetAuthorizationToken, ecr:BatchGetImage, and ecr:GetDownloadUrlForLayer. Create VPC Interface Endpoints for ECR (com.amazonaws.region.ecr.api and ecr.dkr) and S3 Gateway Endpoint for layer storage — eliminates NAT dependency and reduces pull latency.',
        severity: 'critical',
      },
      {
        name: 'OOMKilled Containers',
        cause: 'Container memory usage exceeds the limit set in the task definition (ECS) or pod spec (K8s). Linux kernel OOM killer terminates the container process.',
        symptom: 'Container repeatedly exits with exit code 137. ECS task fails health check and restarts. K8s pod shows OOMKilled in describe output. Application loses in-flight state.',
        fix: 'Set container memory limit at 80-90% of task memory (leave headroom for OS). Monitor container memory utilisation with Container Insights. Profile application memory under load — Java heap sizing is a common culprit (add -Xmx flag). For Node.js, set --max-old-space-size.',
        severity: 'high',
      },
      {
        name: 'EKS Node Pressure and Pod Evictions',
        cause: 'Nodes reach memory or CPU pressure thresholds. Kubernetes evicts lower-priority pods to free resources. Often caused by missing resource requests/limits or a sudden traffic spike.',
        symptom: 'Pods transition to Evicted state. Workloads intermittently lose pods, causing service degradation. Kube-scheduler cannot place new pods ("Insufficient memory" events).',
        fix: 'Set resource requests on every container (defines scheduling decision) and limits (defines enforcement). Enable Karpenter or Cluster Autoscaler to provision new nodes when pending pods exist. Configure PodDisruptionBudgets to ensure minimum availability during evictions.',
        severity: 'high',
      },
      {
        name: 'Slow Rolling Deployments',
        cause: 'ECS rolling update with minimumHealthyPercent=100 and maximumPercent=200 must launch all new tasks before terminating any old ones — doubles required capacity during deployment.',
        symptom: 'Deployments take 10-20 minutes. Cluster runs at 2× normal cost during deployment window. ALB shows uneven traffic distribution as new and old tasks coexist.',
        fix: 'For stateless services: reduce minimumHealthyPercent to 50% to allow faster rollover. Tune deregistration delay (ECS: 30s for stateless HTTP; 300s default is too long for most APIs). For zero-downtime with instant rollback: use ECS blue/green deployment via CodeDeploy with traffic shifting (canary: 10% for 5 min, then 100%).',
        severity: 'medium',
      },
    ],
    a: {
      v: '🚢📦🏗️',
      t: 'A Shipping Container Port with Automated Cranes',
      tx: 'Before shipping containers, loading cargo was chaos — every item had a different shape, required different handling, and took days to load. A shipping container standardises everything: whatever you put inside works the same on a truck, a train, or an ocean freighter.\n\nDocker containers are the same idea for software. Your application, its dependencies, its configuration — all packed into a standardised container image that runs identically on your laptop, in CI, and in production on AWS.\n\nECS is like a port with dedicated cranes optimised for this specific shipping company\'s containers. The cranes (ECS scheduler) know exactly where every container should go (which EC2 instance or Fargate slot), load them efficiently, and replace any container that falls into the water (failed health check).\n\nEKS is a larger international port with standardised container handling equipment (Kubernetes) that works with any shipping company\'s containers and any crane vendor. More complex to operate, but you can use the same port management software (kubectl, Helm) at every port in the world (any cloud).\n\nFargate is the automated port where you just describe the cargo and delivery address — the port figures out which crane, which berth, and which ship entirely on its own. You never see the cranes.',
      s: 'The production maturity signal for container architectures: the presence of Pod Disruption Budgets (K8s) or ECS task drain configurations. Deployments and node upgrades evict pods/tasks. Without PDBs, a deployment can simultaneously terminate all instances of a service across AZs — causing a complete outage during a routine deploy. Setting minAvailable: 2 on a 3-replica service prevents this. It\'s a 2-line YAML change that prevents the most common self-inflicted container outage.',
    },
    te: {
      def: 'ECS is a regional AWS service that maintains a control plane (cluster scheduler) separate from the data plane (EC2 instances or Fargate tasks). EKS uses the upstream Kubernetes control plane with AWS-managed etcd and API server, combined with AWS-specific integrations (VPC CNI, EBS CSI driver, load balancer controller) via controller add-ons.',
      types: [
        { n: 'ECS on Fargate', d: 'Serverless container execution. AWS manages underlying infrastructure. Each task runs in an isolated Firecracker micro-VM. Fastest path to production, highest per-task cost.' },
        { n: 'ECS on EC2', d: 'ECS agent runs on EC2 instances in your cluster. You manage instance lifecycle, patching, and capacity. Enables use of Spot, Reserved, and specific instance types.' },
        { n: 'EKS with Managed Node Groups', d: 'AWS manages EC2 ASG for worker nodes with automated version updates. Reduces node management overhead while keeping full K8s API access.' },
        { n: 'EKS on Fargate', d: 'K8s pods run on Fargate. Configure Fargate profiles to match pod selectors. Eliminates node management but limits some K8s features (no DaemonSets, limited storage options).' },
        { n: 'EKS with Karpenter', d: 'Most cost-efficient K8s setup. Karpenter provisions and deprovisions nodes in seconds, bin-packs pods optimally, and leverages Spot/diverse instance types automatically.' },
      ],
      when: 'Use containers when: multiple services share infrastructure resources, you need consistent environments from dev to prod, you want faster deployment cycles via immutable image promotion, or you need finer resource granularity than VM-per-service. Containers over VMs when: startup time <1 min matters, density (many services per host) is important, or process isolation (not full VM isolation) is sufficient for your security model.',
      trade: 'Containers reduce environment inconsistency and improve resource utilisation but add orchestration complexity. Fargate removes node management at a cost premium. EKS provides portability and ecosystem richness but requires Kubernetes expertise to operate safely. The primary operational risk: Kubernetes has a steep learning curve — a misconfigured RBAC policy, missing resource limits, or incorrect node affinity can cause subtle production issues that are difficult to debug without experience.',
      code: `# ECS Fargate service with ALB and auto scaling (Terraform)
resource "aws_ecs_cluster" "main" {
  name = "prod"
  setting { name = "containerInsights" value = "enabled" }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu    = "512"
  memory = "1024"
  execution_role_arn = aws_iam_role.ecs_exec.arn
  task_role_arn      = aws_iam_role.app_task.arn

  container_definitions = jsonencode([{
    name  = "api"
    image = "\${aws_ecr_repository.api.repository_url}:latest"
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    secrets = [{
      name      = "DB_PASSWORD"
      valueFrom = aws_secretsmanager_secret.db.arn
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"  = "/ecs/api"
        "awslogs-region" = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
    readonlyRootFilesystem = true
  }])
}

resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnet_ids
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}`,
      rw: {
        ex: [
          'Amazon.com runs its entire microservices architecture (thousands of services) on ECS — one of the largest ECS deployments in existence.',
          'Lyft runs its production services on Kubernetes (EKS) and contributes heavily to the Envoy proxy project used for service mesh.',
          'Capital One migrated 30+ production applications from VMs to ECS Fargate, eliminating patching overhead and reducing deployment time from hours to minutes.',
          'Robinhood runs their trading platform on EKS with Karpenter, using Spot Instances for 60% of compute to manage costs during their high-growth phase.',
        ],
        cs: 'A fintech company ran 200 microservices on EC2 instances — one EC2 instance per service, regardless of load. Most services ran at <5% CPU. After migrating to ECS Fargate with appropriately-sized task definitions (256 CPU units, 512MB for idle services; 2048/4096 for high-traffic APIs), they reduced their EC2 bill by 73% through density consolidation. Deployment time dropped from 25 minutes (AMI bake + ASG rolling update) to 4 minutes (ECS rolling update with pre-pulled ECR image).',
      },
    },
    interview: {
      q: 'Compare ECS and EKS for deploying 50 microservices for a fast-growing startup. What factors would drive your recommendation?',
      a: 'For a fast-growing startup with limited DevOps bandwidth, I would recommend ECS (Fargate) initially. Reasons: lower operational complexity (no etcd, RBAC, CNI, admission controllers to manage), faster time to first deployment, native integration with ALB, IAM, Secrets Manager. Use AWS Copilot CLI to generate ECS infrastructure. As the team grows and Kubernetes expertise is hired, consider migrating to EKS if multi-cloud portability, custom scheduling, or advanced service mesh capabilities become requirements. The migration path exists but is non-trivial — plan for 2-3 months of parallel operation during migration. Key EKS advantages that tip the decision: already have K8s expertise on team, need Argo CD for GitOps, require Istio service mesh, or plan to run on multiple clouds.',
      fu: [
        'How does Kubernetes pod scheduling work and how does Karpenter improve on Cluster Autoscaler?',
        'Explain the difference between a Kubernetes Deployment and a StatefulSet — when would you use each?',
        'How would you implement zero-downtime deployments in ECS? In EKS?',
        'What is a Pod Disruption Budget and why is it critical for production EKS workloads?',
        'How does the AWS VPC CNI plugin work — why does each EKS pod get a VPC IP and what are the capacity implications?',
        'Describe a blue/green deployment strategy using ECS and CodeDeploy with automatic rollback.',
      ],
    },
  },

  {
    id: 's3',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🪣',
    title: 'Amazon S3',
    tag: 'Infinitely scalable object storage with 11 nines of durability',
    overview:
      'Amazon S3 (Simple Storage Service) stores objects — files of any type up to 5 TB — in named containers called buckets. S3 delivers 99.999999999% (11 nines) durability by automatically replicating data across a minimum of 3 Availability Zones using erasure coding. It is the backbone of data lakes, static web hosting, backup targets, ML training datasets, and application media storage. Since December 2020, S3 offers strong read-after-write consistency for all operations.',
    components: [
      {
        name: 'Buckets & Object Keys',
        icon: '🗂️',
        role: 'Containers and addressable identifiers for stored objects',
        detail:
          'Bucket names are globally unique across all AWS accounts. Object keys are strings (up to 1,024 bytes) that look like file paths but are a flat namespace — "folders" are key prefix conventions with no actual directory structure. Buckets can hold unlimited objects of unlimited total size. Each object has a key, value (bytes), metadata (up to 8 KB), version ID (if versioning enabled), and ACL.',
      },
      {
        name: 'Storage Classes',
        icon: '🏷️',
        role: 'Cost tiers based on access frequency and retrieval latency',
        detail:
          'Standard: frequent access, 11 9s durability, millisecond retrieval. Standard-IA: infrequent access, 30-day minimum, retrieval fee. Intelligent-Tiering: auto-moves objects between tiers based on access patterns, no retrieval fee, monitoring fee per object. Glacier Instant: archival with millisecond retrieval. Glacier Flexible: 3-5h retrieval (1-5 min Expedited). Deep Archive: lowest cost, 12h retrieval. Use lifecycle policies to automatically transition objects between classes.',
      },
      {
        name: 'Versioning & Object Lock',
        icon: '🔄',
        role: 'Preserve, retrieve, and restore every version of every object',
        detail:
          'When versioning is enabled, S3 preserves all versions of an object including all writes and deletes. Deletes create a "delete marker" — older versions remain and are retrievable. Object Lock implements WORM (Write Once Read Many) with Retention Periods and Legal Holds for compliance-regulated data. Required for MFA Delete and Cross-Region Replication.',
      },
      {
        name: 'Access Control',
        icon: '🔒',
        role: 'Policies controlling who can perform what operations on which objects',
        detail:
          'Bucket policies (resource-based IAM JSON): grant cross-account access, enforce HTTPS-only, require specific conditions. S3 Block Public Access (4 settings): account-level override preventing any public access regardless of bucket/object ACL. S3 Access Points: per-application endpoints with their own access policies — simplifies managing access for data lakes with many consumers. Pre-signed URLs: time-limited authenticated links for temporary access without AWS credentials.',
      },
      {
        name: 'S3 Event Notifications & EventBridge',
        icon: '📢',
        role: 'Trigger downstream processing on object operations',
        detail:
          'Configure events (s3:ObjectCreated, s3:ObjectRemoved, s3:Replication) to notify SQS, SNS, or Lambda directly. For complex routing, filtering, and replay, use S3 EventBridge integration (all events sent to EventBridge default bus, then routed to 20+ targets with pattern matching). S3 → Lambda for real-time processing; S3 → SQS for buffered processing with rate control.',
      },
      {
        name: 'Multipart Upload & Transfer Acceleration',
        icon: '⚡',
        role: 'Performance features for large object uploads',
        detail:
          'Multipart Upload: required for objects >5 GB, recommended for >100 MB. Splits object into parts (each 5 MB–5 GB), uploads in parallel, S3 assembles server-side. Resumable on network failure. Transfer Acceleration: routes uploads through CloudFront edge PoPs to AWS backbone network — provides 50-500% faster uploads for cross-region or international users.',
      },
    ],
    howItWorks:
      'S3 distributes objects across multiple storage devices in multiple AZs using erasure coding (Reed-Solomon). A PUT request is acknowledged once data is durably written across the required quorum of devices. Strong consistency: S3 processes all read and write requests on the object\'s primary node — no stale reads from a replica. For large uploads, Multipart Upload divides the object into parallel streams that S3 assembles with a final Complete Multipart Upload call. Lifecycle rules run daily, evaluating object age and transitioning or expiring objects based on configured policies.',
    decision: {
      choose: [
        'S3 for any unstructured or semi-structured data at any scale — documents, images, videos, logs, ML datasets, backups',
        'S3 as the storage layer for data lakes — raw, processed, and curated zones partitioned by date/category for Athena or Spark queries',
        'S3 for static website hosting (HTML/CSS/JS + CloudFront CDN in front)',
        'S3 + Lifecycle policies for cost-optimised long-term archival — transition from Standard to Glacier to Deep Archive automatically',
        'S3 with Intelligent-Tiering for objects with unpredictable access patterns — auto-optimises cost with no retrieval fee',
      ],
      avoid: [
        'S3 as a low-latency block store — S3 is optimised for throughput not IOPS; use EBS for databases and EFS for shared filesystems',
        'S3 for files that require POSIX semantics (append, random writes, file locking) — use EFS instead',
        'S3 with single hot key prefix (e.g., all objects starting with the same date string) at high request rates — distributes load across partitions by using randomised or hashed key prefixes',
        'Relying on S3 ACLs for access control — ACLs are legacy; use bucket policies and IAM instead',
        'Storing sensitive data without enabling SSE-KMS and S3 Block Public Access — two-line config that prevents the most common S3 data breaches',
      ],
      vs: [
        {
          name: 'S3 vs EBS',
          when: 'S3 for object storage (HTTP GET/PUT, batch access, unlimited scale). EBS for block storage (requires EC2 attachment, random IOPS, databases, boot volumes). S3 is cheaper at scale ($0.023/GB vs $0.10/GB SSD EBS), accessible from anywhere, but higher latency (10-100ms) vs EBS (<1ms).',
        },
        {
          name: 'S3 vs EFS',
          when: 'S3 for object access patterns (entire file per request). EFS for POSIX filesystem semantics — mount as NFS across multiple EC2/ECS instances, shared config, CMS, content repositories. EFS is 10× more expensive than S3 Standard; only use it when you need a shared filesystem.',
        },
        {
          name: 'S3 Standard vs Intelligent-Tiering',
          when: 'Standard for objects you know will be accessed frequently (within 30 days). Intelligent-Tiering for objects with unknown or variable access patterns — pays a small monthly monitoring fee per object (0.0025¢/1000 objects) and moves objects to cheaper tiers automatically after 30/90/180 days of no access.',
        },
      ],
    },
    failures: [
      {
        name: '503 SlowDown — Request Rate Throttling',
        cause: 'S3 partitions the key space and scales partitions to ~3,500 PUT/5,500 GET TPS per prefix. Applications that write objects with sequential or date-based prefixes (2024/01/01/000001) concentrate all requests on a single partition.',
        symptom: 'HTTP 503 SlowDown responses when request rate to a single prefix exceeds limits. Throughput caps and retries increase latency. Affects batch ingestion pipelines that add thousands of objects with similar prefixes.',
        fix: 'Add random entropy to the key prefix — hash the object identifier and prepend the first 4 hex characters (e.g., a3f2/2024/01/01/000001). S3 will distribute these across different partitions, scaling linearly. S3 also auto-scales partitions after sustained high request rates — the throttling is temporary during repartitioning.',
        severity: 'high',
      },
      {
        name: 'Accidental Public Exposure',
        cause: 'Bucket policy or ACL set to public-read. S3 Block Public Access not enabled at the account level. Common when developers copy public bucket configurations without understanding the security implications.',
        symptom: 'Objects accessible via public URL without authentication. Security scanners report public S3 buckets. Data leak discovered through S3 access logs showing unauthenticated GET requests.',
        fix: 'Enable S3 Block Public Access at the AWS account level (all 4 settings) — this overrides any bucket-level public access grants. Use AWS Config rule s3-bucket-public-read-prohibited and s3-account-level-public-access-blocks to detect and alert on violations. Enable Amazon Macie to scan for PII in S3 buckets.',
        severity: 'critical',
      },
      {
        name: 'Accidental Mass Deletion',
        cause: 'Script runs s3 rm --recursive on the wrong bucket/prefix. DELETE permissions are too broad. Automated cleanup job has a bug.',
        symptom: 'Thousands of objects permanently deleted. Production data unavailable. No versioning enabled means no recovery path. Incident requires restore from backup.',
        fix: 'Enable S3 Versioning on all production buckets — deletes create a delete marker, original versions recoverable. Enable MFA Delete for sensitive buckets (requires MFA device to permanently delete versions). Add S3 Object Lock (WORM) for compliance data. Apply bucket policy denying s3:DeleteObject without specific conditions.',
        severity: 'critical',
      },
      {
        name: 'Glacier Restore Latency',
        cause: 'Data archived to S3 Glacier Flexible or Deep Archive is not pre-restored before it is needed. Incident response, regulatory requests, or data migrations encounter unexpected retrieval delays.',
        symptom: 'Critical data unavailable for 3-12 hours (Glacier Flexible) or up to 12-48 hours (Deep Archive) during urgent restore request. Standard retrieval tier invoked instead of Expedited (5-minute) due to cost concerns.',
        fix: 'Use Glacier Instant Retrieval for archival data that might be accessed in emergencies — millisecond retrieval at moderate price premium. For Flexible/Deep Archive, pre-initiate restore jobs before deadlines. Set lifecycle rules to automatically restore objects to Standard before known access events. Budget for Expedited retrieval ($0.03/GB + $0.01/request) for truly urgent scenarios.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🏭📦♾️',
      t: 'An Infinite Self-Organizing Warehouse',
      tx: 'Imagine a magical warehouse with infinite shelves. You hand any item to the clerk at the front desk (S3 PUT API), they give you a unique label (object key), and the item is stored forever. You retrieve any item instantly by showing its label (S3 GET API). The warehouse automatically makes 11 copies of every item across 3 different buildings (Availability Zones) — if a building burns down, your items are safe.\n\nThe warehouse has different storage zones: the "hot aisle" (Standard) for items you access frequently, the "cold storage" (Glacier) for items you rarely need but want to keep cheaply, and a "deep freeze" (Deep Archive) for items you may never need but legally must retain.\n\nSome items are valuable enough that you want every previous version preserved — the warehouse\'s "versioned storage" area keeps all historical copies so you can recover from accidents. For highly confidential items, you can use a special vault (Object Lock) where even the warehouse manager cannot modify or delete items once stored.\n\nThe analogy breaks here: unlike a physical warehouse, S3 has no capacity limit, stores any type of item in any size, and retrieves items from anywhere in the world in milliseconds. It also charges zero for storage beyond the listed per-GB rate — no monthly minimum, no reservation required.',
      s: 'The S3 architectural pattern that saves companies millions of dollars: aggressive lifecycle policies combined with storage class transitions. Most companies store data indefinitely in S3 Standard ($0.023/GB/month) when 80% of it is never accessed after 30 days. A simple lifecycle rule — Standard → Intelligent-Tiering (day 0), automatic tier to Glacier Instant after 90 days of no access, Deep Archive after 180 days — can reduce storage costs by 60-80% with minimal engineering effort. The ROI calculation is straightforward; the barrier is simply knowing it exists.',
    },
    te: {
      def: 'S3 stores objects in a distributed storage cluster using a consistent-hashing-based namespace partitioning. Each partition handles ~3,500 PUT/5,500 GET TPS. The storage layer uses erasure coding (Reed-Solomon 8+4 scheme across AZs) rather than 3× replication — more storage-efficient while providing equivalent durability guarantees. Strong consistency is implemented via a conditional write mechanism on the primary node for each object key.',
      types: [
        { n: 'S3 Standard', d: '11 9s durability, 99.99% availability, ≥3 AZ replication. Highest cost. For frequently accessed data.' },
        { n: 'S3 Intelligent-Tiering', d: 'Auto-moves between frequent/infrequent/archive tiers based on access. Small monitoring fee per object. Best for unknown access patterns.' },
        { n: 'S3 Standard-IA / One Zone-IA', d: 'For infrequently accessed data. Retrieval fee. Standard-IA: multi-AZ. One Zone-IA: single AZ (20% cheaper, lower durability).' },
        { n: 'S3 Glacier Instant Retrieval', d: 'Millisecond retrieval for archival data. Quarterly access pattern. 68% cheaper than Standard-IA for 90-day+ archived data.' },
        { n: 'S3 Glacier Flexible / Deep Archive', d: 'Lowest cost. Hours to retrieve (Flexible) or up to 12h (Deep Archive). For compliance archives, regulatory retention, disaster recovery backups.' },
      ],
      when: 'S3 is appropriate for any workload dealing with objects (files) accessed via HTTP GET/PUT: static assets, user uploads, data lake storage, log aggregation, backup targets, ML datasets, and artifact storage. Switch to EBS for block storage (databases), EFS for shared POSIX filesystem, or DynamoDB for structured key-value data requiring <10ms latency.',
      trade: 'S3\'s core trade-off is simplicity and infinite scale vs. access latency and semantics. S3 is massively scalable and globally accessible but provides 10-100ms latency for individual objects (vs. <1ms for EBS). It lacks POSIX semantics — no append, no atomic rename, no file locking. These constraints shape how systems use S3: batch operations, full-file reads/writes, and eventual consistency (for cross-region replication scenarios) fit S3\'s design; real-time transactional access does not.',
      code: `# S3 bucket with versioning, encryption, lifecycle, and public access block
resource "aws_s3_bucket" "data_lake" {
  bucket = "company-data-lake-\${random_id.suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true  # reduces KMS API calls 99%
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  depends_on = [aws_s3_bucket_versioning.data_lake]
  rule {
    id = "raw-data-tiering"
    status = "Enabled"
    filter { prefix = "raw/" }
    transition { days = 30;  storage_class = "STANDARD_IA" }
    transition { days = 90;  storage_class = "GLACIER_IR"  }
    transition { days = 365; storage_class = "DEEP_ARCHIVE" }
    noncurrent_version_expiration { noncurrent_days = 90 }
  }
}

resource "aws_s3_bucket_public_access_block" "data_lake" {
  bucket                  = aws_s3_bucket.data_lake.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`,
      rw: {
        ex: [
          'Airbnb stores all user-uploaded photos (hundreds of billions) in S3, serving them via CloudFront CDN — S3 as the origin with virtually unlimited storage capacity.',
          'Netflix stores all video content masters in S3 — multiple petabytes — and uses S3 as the source for encoding pipelines and global CDN distribution.',
          'Dropbox famously migrated off S3 to their own storage infrastructure ("Magic Pocket") after hitting the scale where custom hardware was dramatically cheaper — one of the few cases where the S3 bill became large enough to justify building your own storage.',
          'NASA\'s open data program stores petabytes of satellite imagery on S3 under the AWS Open Data program, making it publicly accessible for scientific research at no charge to researchers.',
        ],
        cs: 'A healthcare company stored 8 years of medical imaging data (12 PB) entirely in S3 Standard, paying $276K/month in storage. Audit revealed 92% of objects hadn\'t been accessed in over 60 days. Implementing a lifecycle policy (Standard → Standard-IA at 30 days → Glacier Instant at 90 days) reduced the bill to $41K/month — a $235K/month savings on a configuration change that took 2 hours to implement.',
      },
    },
    interview: {
      q: 'Design the storage architecture for a data lake ingesting 5 TB of logs per day, needing real-time analytics on the last 7 days and historical analysis on 2 years of data.',
      a: 'Landing zone bucket: logs ingested via Kinesis Firehose → S3 (raw zone, Standard class). Partition keys: year=/month=/day=/hour= (Hive-compatible for Athena). After 7 days: lifecycle transition to Standard-IA. After 90 days: transition to Glacier Instant Retrieval (for on-demand historical queries that need <1s retrieval). After 2 years: transition to Deep Archive (compliance retention). Processed zone: Glue ETL jobs run daily, write Parquet columnar format (10× compression vs raw JSON) to a separate processed bucket. Athena with Glue Data Catalog for SQL queries — pay per TB scanned. For the last 7 days real-time analytics: keep a hot copy in Standard, use Athena with result caching. Bucket policies: enforce SSE-KMS encryption, S3 Block Public Access enabled, VPC endpoint to eliminate NAT costs.',
      fu: [
        'How would you optimise S3 query performance for Athena — what file format, compression, and partitioning strategy would you choose?',
        'Explain S3 Transfer Acceleration and when it provides measurable benefit over standard S3 PUT.',
        'How does S3 Cross-Region Replication work and what are its consistency characteristics?',
        'What is the difference between S3 Gateway Endpoints and Interface Endpoints for S3, and which should you use?',
        'How would you implement fine-grained access control for a data lake where different teams should only see their own data?',
        'Explain S3 Select and when it can reduce query costs vs loading full objects.',
      ],
    },
  },

  {
    id: 'rds',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🗄️',
    title: 'RDS & Aurora',
    tag: 'Managed relational databases with Multi-AZ HA and Aurora\'s cloud-native storage',
    overview:
      'Amazon RDS manages PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server — handling provisioning, patching, automated backups, and Multi-AZ failover. Aurora is AWS\'s cloud-native relational engine compatible with PostgreSQL and MySQL, built on a distributed storage layer that replicates data 6 ways across 3 AZs. Aurora delivers up to 3× PostgreSQL and 5× MySQL throughput, automatically scales storage to 128 TiB, and supports global databases spanning multiple regions with sub-second replication lag.',
    components: [
      {
        name: 'Multi-AZ Deployment',
        icon: '🏛️',
        role: 'Synchronous standby replica for high availability and automatic failover',
        detail:
          'RDS Multi-AZ maintains a synchronous standby in a different AZ. Writes are committed to the primary and standby before acknowledging success — no data loss. Failover is automatic: RDS detects primary failure, promotes standby to primary, and flips the DNS CNAME of the cluster endpoint within 60-120s (RDS) or <30s (Aurora). Applications reconnect using the same endpoint — no code changes needed.',
      },
      {
        name: 'Read Replicas',
        icon: '📖',
        role: 'Asynchronous copies for read scale-out and cross-region failover',
        detail:
          'RDS Read Replicas (up to 5) replicate asynchronously from the primary — reads are slightly stale. Aurora Read Replicas (up to 15) share the same storage volume — replication lag is typically <10ms. Read replicas can be promoted to standalone databases for disaster recovery. Aurora Read Replicas are also used for failover targets (promoted within seconds, no storage sync needed).',
      },
      {
        name: 'Aurora Storage Architecture',
        icon: '💾',
        role: 'Distributed storage layer decoupled from compute',
        detail:
          'Aurora\'s storage tier stores 6 copies of data across 3 AZs (2 per AZ) using a write quorum of 4/6 and a read quorum of 3/6. The storage layer auto-scales in 10 GB increments up to 128 TiB with no manual intervention. Only redo log records (not full page copies) are written over the network — dramatically reducing write amplification vs. traditional replication. Aurora Parallel Query pushes full table scans down to the storage layer.',
      },
      {
        name: 'Aurora Serverless v2',
        icon: '⚡',
        role: 'Instantly auto-scaling compute tier from 0.5 to 128 ACUs',
        detail:
          'Aurora Serverless v2 scales compute in fine-grained increments (0.5 Aurora Capacity Units = ~1 vCPU/2GB RAM) within seconds based on demand. Unlike v1 (which had a warm-up delay), v2 scales instantly. Ideal for variable workloads, dev/test environments, and SaaS applications with per-tenant databases. Can scale to zero (v1 only); v2 has a minimum 0.5 ACU.',
      },
      {
        name: 'RDS Proxy',
        icon: '🔄',
        role: 'Managed connection pooler between application and database',
        detail:
          'RDS Proxy sits between Lambda/ECS and RDS, maintaining a pool of long-lived database connections. It multiplexes thousands of application connections (from Lambda scaling to 1,000+ instances) into a small pool of database connections. Uses IAM authentication — no passwords in application code. Reduces failover impact from 60-120s to <30s by maintaining connections through Multi-AZ failover.',
      },
      {
        name: 'Performance Insights & Enhanced Monitoring',
        icon: '📊',
        role: 'Visibility into database performance and resource utilisation',
        detail:
          'Performance Insights: visualises database load as Average Active Sessions broken down by SQL statement, wait event, user, and host. Identifies the top SQL statements consuming most database time. Enhanced Monitoring: OS-level metrics at 1-60 second granularity (CPU steal, memory, disk I/O, swap) via a dedicated monitoring agent. Combined, they provide a complete picture from OS to query level.',
      },
    ],
    howItWorks:
      'RDS Multi-AZ (PostgreSQL): writes go to the primary and are synchronously replicated to the standby via streaming replication. On primary failure, RDS promotes the standby and updates the DNS CNAME of the cluster endpoint (~60-120s total). Aurora: the writer instance sends only redo log records to the distributed storage layer over the network. Readers share the same storage volume — they read the latest committed pages directly without network replication lag. Failover: Aurora promotes the reader with lowest lag in ~30s — no data copy needed since storage is shared across all instances.',
    decision: {
      choose: [
        'RDS for lift-and-shift of existing PostgreSQL/MySQL/Oracle/SQL Server workloads with minimal code changes',
        'Aurora PostgreSQL or MySQL for new workloads requiring better performance, automatic storage scaling, and Aurora-specific features (Global Database, Serverless v2, Parallel Query)',
        'Aurora Serverless v2 for variable workloads, dev/test databases, and SaaS multi-tenant scenarios with many low-traffic databases',
        'RDS Proxy whenever Lambda functions connect to RDS — mandatory to avoid connection pool exhaustion at scale',
        'Aurora Global Database for multi-region active-passive with <1s replication lag and RPO near-zero',
      ],
      avoid: [
        'RDS for analytical workloads requiring full table scans on large datasets — use Redshift or Athena on S3',
        'Single-AZ RDS in production — Multi-AZ is the minimum acceptable configuration for any production workload',
        'Direct Lambda-to-RDS connection without RDS Proxy — connection exhaustion is a when, not if',
        'Public accessibility on RDS instances — place in private subnets, access via bastion host or AWS Systems Manager Session Manager',
        'Aurora Serverless v1 for latency-sensitive production — the warm-up delay makes it unsuitable for user-facing APIs; use Serverless v2 or provisioned',
      ],
      vs: [
        {
          name: 'RDS Multi-AZ vs Read Replicas',
          when: 'Multi-AZ: high availability and automatic failover — standby does not serve reads. Read Replicas: horizontal read scaling — not a failover target by default (must be manually promoted). These are complementary, not alternatives. Production databases should use both: Multi-AZ for HA + read replicas for read scaling.',
        },
        {
          name: 'Aurora vs RDS PostgreSQL',
          when: 'Aurora: higher write throughput (3× PostgreSQL), automatic storage scaling, faster failover (<30s vs 60-120s), up to 15 read replicas, Global Database, Parallel Query. RDS PostgreSQL: lower cost for small workloads, supports more PostgreSQL extensions, simpler mental model. Migrate to Aurora when write throughput or storage capacity becomes a constraint.',
        },
        {
          name: 'RDS vs DynamoDB',
          when: 'RDS/Aurora for complex relational data, JOIN queries, ACID transactions, and existing SQL-based applications. DynamoDB for single-table key-value access patterns, unlimited horizontal scale at single-millisecond latency, and workloads where the access patterns are well-defined upfront. The schema flexibility of DynamoDB comes with the constraint of limited query patterns.',
        },
      ],
    },
    failures: [
      {
        name: 'Connection Pool Exhaustion',
        cause: 'Lambda functions scaled to hundreds of concurrent instances, each opening a direct database connection. RDS max_connections (determined by instance memory: ~75 connections/GB for PostgreSQL) is exhausted.',
        symptom: 'Lambda functions time out waiting for database connections. RDS metric DatabaseConnections at max. Error logs show "remaining connection slots are reserved" (PostgreSQL) or "Too many connections" (MySQL). API returns 500 errors.',
        fix: 'Deploy RDS Proxy in front of RDS/Aurora for all Lambda workloads. RDS Proxy multiplexes thousands of application connections into a pool sized to the database limit. Requires IAM auth configuration. Also add a wait_timeout with retry logic in the application for the rare cases of transient pool exhaustion.',
        severity: 'critical',
      },
      {
        name: 'Replication Lag on Read Replicas',
        cause: 'High write load on the primary causes the replica to fall behind. Single-threaded replication (RDS) cannot keep up with parallel primary writes. Long-running read queries on the replica also block replication apply.',
        symptom: 'ReplicaLag CloudWatch metric exceeds acceptable threshold (usually >30s). Queries routed to read replica return stale data. Applications relying on replicated data for consistency experience issues.',
        fix: 'Monitor ReplicaLag metric with CloudWatch alarm. Route only truly stale-ok queries to replicas. Increase replica instance size (more replication apply workers). Use Aurora replicas — shared storage means near-zero lag (typically <10ms). For hot standby reads, use Multi-AZ with a read-capable standby (available in newer RDS engine versions).',
        severity: 'high',
      },
      {
        name: 'RDS Storage Auto-Scaling Unexpected Growth',
        cause: 'RDS storage auto-scaling expands storage when free space drops below 10% or 5 GB. But storage can only grow, never shrink — once expanded, the storage tier is permanent.',
        symptom: 'Monthly bill increases as RDS storage grows steadily. Autovacuum bloat in PostgreSQL, temp table growth, or binary log retention causes unexpected storage consumption.',
        fix: 'Monitor FreeStorageSpace CloudWatch metric. Investigate root cause of storage growth: enable pg_stat_user_tables to identify table bloat, check binary log retention (set binlog_retention_hours appropriately). Aurora auto-scales storage bidirectionally for compute but storage still only grows. Reclaim space via VACUUM FULL (PostgreSQL) or ALTER TABLE ... ENGINE=InnoDB (MySQL) — both require table locks.',
        severity: 'medium',
      },
      {
        name: 'Failover Causes Application Errors',
        cause: 'Multi-AZ failover flips DNS in 60-120s. Applications with aggressive DNS TTL caching, connection pools that don\'t detect dead connections, or no retry logic fail during the failover window.',
        symptom: 'Application errors spike for 1-2 minutes after planned maintenance or unexpected primary failure. Connection pool reports all connections unhealthy. Retry logic (if present) eventually reconnects.',
        fix: 'Configure DNS TTL to 5s for RDS endpoint. Implement exponential backoff + retry in the database connection layer. Use RDS Proxy which maintains connections through failover, reducing client-visible outage to <30s. For Aurora, enable fast failover (DNS TTL optimised at 5s, replica lag monitoring for fastest-to-promote selection).',
        severity: 'high',
      },
    ],
    a: {
      v: '🏗️🔧💾',
      t: 'A Managed IT Department for Your Database',
      tx: 'Running a database traditionally is like owning a server room. You buy the hardware, install the OS, install the database software, configure backups, set up replication, patch security vulnerabilities monthly, monitor disk space, and handle hardware failures by physically replacing drives.\n\nRDS is like hiring a managed IT department. You say "I need a PostgreSQL database with these specs." They rack the servers, install the software, set up automated nightly backups to a remote location, configure a hot standby in another building (Multi-AZ), apply OS patches during your configured maintenance window, and replace failed hardware — all transparently. You just connect your application and run SQL queries.\n\nAurora takes this further — it is like swapping the standard database engine for a custom high-performance racing engine while keeping the same SQL interface. The mechanics are fundamentally different under the hood: Aurora\'s storage is a distributed system across 3 data centres that your database writes to, rather than a single server\'s disk. This is why Aurora failover takes 30 seconds instead of 120 — the standby already has all the data (shared storage) and just needs to start accepting writes, rather than waiting for data synchronisation.\n\nThe analogy breaks here: unlike a managed IT department, RDS/Aurora does not manage schema design, query optimisation, or application-level performance. The database engine is managed; what runs on it is your responsibility.',
      s: 'The RDS insight that senior engineers know but junior engineers discover in production: max_connections is not a configuration you increase — it is a signal about architecture. PostgreSQL allows ~100 connections per GB of instance RAM. Lambda scales to 1,000+ concurrent invocations by default. These two facts are incompatible without RDS Proxy. The fix (RDS Proxy) is simple and should be provisioned from day one when Lambda touches a database — retrofitting it after a production connection exhaustion incident is significantly more stressful.',
    },
    te: {
      def: 'Aurora\'s storage layer is a distributed cloud storage service (separate from the database engine) that stores 6 copies of data across 3 AZs using a 4/6 write quorum and 3/6 read quorum. The Aurora writer sends only redo log records — not full data pages — to the storage layer, dramatically reducing network I/O vs traditional replication which sends full block copies. Pages are materialised lazily in the storage layer by the distributed background process.',
      types: [
        { n: 'RDS Single-AZ', d: 'Development only. No standby. Manual failover requires restore from snapshot (15min+). Never acceptable in production.' },
        { n: 'RDS Multi-AZ', d: 'Synchronous standby for HA. Failover in 60-120s. Standby does not serve reads. Standard production baseline.' },
        { n: 'Aurora Provisioned', d: 'Highest performance, fixed instance size, shared storage architecture. Up to 15 read replicas with <10ms lag. Best for predictable high-throughput.' },
        { n: 'Aurora Serverless v2', d: 'Fine-grained compute scaling (0.5 ACU increments) within seconds. Good for variable workloads. Supports all Aurora features including read replicas.' },
        { n: 'Aurora Global Database', d: 'One primary region + up to 5 secondary regions. <1s replication lag. RPO near-zero, RTO <1 minute for managed failover. For multi-region active-passive architectures.' },
      ],
      when: 'RDS is appropriate for any application that needs a relational database without the operational burden of self-managing it. Choose Aurora over RDS when: write throughput exceeds ~1,000 TPS, storage needs exceed a few TB, you need global replication, or failover SLA requirements are tight (<30s). Use DynamoDB instead of RDS when the data model is key-value/document and you need horizontal scaling beyond what a single relational database can provide.',
      trade: 'RDS trades operational simplicity for reduced control. You cannot access the OS, tune kernel parameters, or configure replication topology beyond what AWS provides. Aurora\'s distributed storage provides exceptional durability and performance but introduces Aurora-specific behaviours — storage scales independently of compute (but never shrinks), and Aurora I/O pricing can surprise teams migrating from MySQL/PostgreSQL where I/O is implicit in the hardware cost.',
      code: `# Aurora PostgreSQL with Proxy and Parameter Group (Terraform)
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "prod-aurora"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "appdb"
  master_username         = "dbadmin"
  manage_master_user_password = true  # Secrets Manager integration
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name
  backup_retention_period = 14
  preferred_backup_window = "03:00-04:00"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.rds.arn
  deletion_protection     = true
  enabled_cloudwatch_logs_exports = ["postgresql"]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  family = "aurora-postgresql15"
  name   = "prod-aurora-params"
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # log queries >1s
  }
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = 2
  identifier         = "prod-aurora-\${count.index}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.r6g.xlarge"
  engine             = aws_rds_cluster.aurora.engine
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_enhanced.arn
}

resource "aws_db_proxy" "main" {
  name                   = "prod-proxy"
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_security_group_ids = [aws_security_group.proxy.id]
  vpc_subnet_ids         = module.vpc.private_subnet_ids
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_rds_cluster.aurora.master_user_secret[0].secret_arn
    iam_auth    = "REQUIRED"
  }
}`,
      rw: {
        ex: [
          'Airbnb runs their core booking database on Aurora PostgreSQL — the automatic storage scaling handles booking peak seasons without manual intervention.',
          'Samsung SmartThings migrated from self-managed MySQL to Aurora MySQL — reduced DBA operational overhead by 80% and improved failover time from 5+ minutes to 30 seconds.',
          'Expedia uses Aurora with up to 15 read replicas to handle read-heavy flight search workloads, routing queries to the nearest replica for lowest latency.',
          'Zoom ran their database tier on RDS Aurora during COVID-19 when they scaled from 10M to 300M daily meeting participants — Aurora\'s automatic storage scaling handled the data growth without manual resizing.',
        ],
        cs: 'A SaaS startup ran their PostgreSQL database on a single large EC2 instance with self-managed replication. Failover took 8-12 minutes (manual promotion + DNS update) causing SLA violations. After migrating to Aurora PostgreSQL Multi-AZ: failover dropped to 28 seconds (Aurora auto-promotes reader, DNS flips). With RDS Proxy added for their Lambda API, connection errors during failover dropped from 100% to 0% (proxy maintains connections through failover). The net result: 99.99% availability achieved without any application code changes.',
      },
    },
    interview: {
      q: 'Design the database architecture for a global e-commerce platform requiring 99.99% availability, <100ms query latency for global users, and the ability to recover from a regional outage within 1 minute.',
      a: 'Primary: Aurora PostgreSQL cluster in us-east-1 — writer + 2 readers in Multi-AZ (3 AZs). Aurora Global Database for cross-region: 2 secondary regions (eu-west-1, ap-southeast-1), <1s replication lag. All application connections via RDS Proxy (connection pooling, IAM auth, failover resilience). For global read performance: route read queries to the nearest Aurora Global Database secondary reader. For writes: all writes go to primary region (eventual consistency acceptable for read-heavy e-commerce; use optimistic locking for inventory). Failover plan: Aurora Global Database managed failover promotes a secondary to primary in <1 minute. Route53 health check + latency routing flips write traffic to new primary. RDS Proxy in each region maintains application connections through transition. RPO: ~1s (replication lag). RTO: ~60s.',
      fu: [
        'What is Aurora Fast Failover and how does it achieve <30s failover compared to standard RDS Multi-AZ?',
        'Explain the Aurora storage quorum system — how many AZ failures can Aurora tolerate for reads vs writes?',
        'When would you use Aurora Global Database vs DynamoDB Global Tables for a globally distributed application?',
        'How does RDS Proxy improve security beyond just connection pooling?',
        'Describe the blue/green deployment feature in RDS — how does it enable zero-downtime major version upgrades?',
        'What are the trade-offs of Aurora Serverless v2 vs provisioned Aurora for a production workload?',
      ],
    },
  },

  {
    id: 'iam',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🔑',
    title: 'IAM & Security',
    tag: 'Identity and access management — who can do what to which AWS resources',
    overview:
      'AWS Identity and Access Management (IAM) controls authentication (who you are) and authorisation (what you can do) across every AWS API call. IAM uses a default-deny model — unless a policy explicitly allows an action, it is denied. Principals (users, roles, services) acquire permissions through IAM policies in JSON format. Every API call across all 200+ AWS services is evaluated against IAM policies in real time. Least-privilege and zero-trust are the foundational principles of secure AWS architecture.',
    components: [
      {
        name: 'IAM Policies',
        icon: '📄',
        role: 'JSON documents defining allowed or denied actions on resources',
        detail:
          'A policy has a Statement with Effect (Allow or Deny), Action (e.g., s3:GetObject), Resource (ARN or *), and optional Condition (IP address, MFA, request time, etc.). AWS Managed policies are maintained by AWS. Customer Managed policies are yours. Inline policies are embedded directly in a principal and are less reusable. The most specific matching policy determines the result; an explicit Deny always wins over any Allow.',
      },
      {
        name: 'IAM Roles',
        icon: '🎭',
        role: 'Assumable identities with temporary credentials and no long-term secrets',
        detail:
          'A role has a trust policy (who can assume it) and permission policies (what the role can do). EC2 instances, Lambda functions, ECS tasks, and cross-account users assume roles via AWS STS (Security Token Service), which returns temporary credentials (AccessKeyId + SecretAccessKey + SessionToken) valid for 15 minutes to 12 hours. Roles are the foundation of secure AWS architecture — never use long-term access keys when a role is available.',
      },
      {
        name: 'IAM Identity Center (SSO)',
        icon: '🔐',
        role: 'Centralised workforce identity for AWS console and CLI access',
        detail:
          'Formerly AWS SSO. Integrates with corporate identity providers (Okta, Azure AD, Google Workspace) via SAML/OIDC. Assigns Permission Sets (collections of IAM policies) to users/groups for specific AWS accounts. Users authenticate with their corporate credentials, receive temporary IAM Role credentials — no IAM Users with passwords or long-term access keys required for human access.',
      },
      {
        name: 'Service Control Policies (SCPs)',
        icon: '🛡️',
        role: 'Organization-level guardrails that cap maximum permissions for accounts',
        detail:
          'SCPs are applied to AWS Organizations OUs and accounts. They do not grant permissions — they restrict what IAM can grant. A Allow in an SCP is required for an action to be permitted, but still requires an IAM Allow too. Use SCPs to enforce guardrails: deny actions in unapproved regions, require encryption on all storage, prevent root account usage, block disabling of CloudTrail.',
      },
      {
        name: 'Permission Boundaries',
        icon: '🔒',
        role: 'Delegate IAM administration without enabling privilege escalation',
        detail:
          'A Permission Boundary is an IAM policy that defines the maximum permissions an IAM entity can have, regardless of what policies are attached. If a developer can create IAM roles, they could attach AdministratorAccess and escalate privileges. Permission Boundaries prevent this: a developer can only create roles with permissions that are also permitted by the boundary policy. Critical for delegated administration in multi-team accounts.',
      },
      {
        name: 'IAM Access Analyzer',
        icon: '🔍',
        role: 'Automated reasoning engine that detects overly permissive resource access',
        detail:
          'Access Analyzer uses formal verification (Zelkova — a Z3-based theorem prover) to mathematically prove whether a policy allows public or cross-account access, rather than pattern matching. It continuously monitors S3 buckets, IAM roles, KMS keys, Lambda functions, SQS queues, and Secrets Manager secrets — alerting on findings. The Unused Access Analyzer identifies permissions granted but not used in the last 90 days for privilege reduction.',
      },
    ],
    howItWorks:
      'Every AWS API call includes credentials. IAM evaluates policies in this order: (1) Explicit Deny in any SCP → deny immediately. (2) Explicit Deny in any attached policy (identity, resource, permission boundary) → deny. (3) Is there an Allow in an SCP? → required for accounts in an OU. (4) Is there a Permission Boundary? → limits effective permissions. (5) Is there an Allow in an identity policy (user/role)? (6) Is there an Allow in a resource-based policy (bucket policy, KMS key policy)? If no explicit Allow is found in any applicable policy → implicit deny. Cross-account access requires Allow in BOTH the identity policy of the caller AND the resource-based policy of the target.',
    decision: {
      choose: [
        'IAM Roles for all programmatic access (EC2, Lambda, ECS, EKS) — never create long-term access keys when a role is available',
        'IAM Identity Center (SSO) for all human access — never create IAM Users with passwords for people in production accounts',
        'SCPs at the OU level for preventive guardrails — region restrictions, mandatory encryption, CloudTrail protection',
        'Permission Boundaries when delegating IAM administration to development teams — prevents privilege escalation',
        'Resource-based policies (bucket policies, KMS key policies) for cross-account access — cleaner than requiring the external account to assume a role',
      ],
      avoid: [
        'Wildcard actions (s3:*) or resources (*) in production policies — use least-privilege with specific actions and resource ARNs',
        'Long-term access keys (AKIA...) for automation — use IAM roles with temporary credentials via instance profiles or service accounts',
        'Storing credentials in code, environment variables, or container images — use Secrets Manager or SSM Parameter Store with IAM role access',
        'Skipping MFA for console access — enable MFA for all IAM Users (remaining ones) and require it as a policy condition for sensitive operations',
        'Sharing IAM credentials between services — each service should have its own role with only the permissions it needs',
      ],
      vs: [
        {
          name: 'Identity-Based vs Resource-Based Policies',
          when: 'Identity-based: attached to users/roles, control what they can do in your account and others. Resource-based: attached to the resource (S3 bucket, KMS key, Lambda), control who can access that resource including cross-account principals. For same-account access, identity-based is sufficient. For cross-account access without role assumption, resource-based policies allow it directly.',
        },
        {
          name: 'SCPs vs IAM Policies',
          when: 'SCPs are organisational guardrails — they cannot grant permissions, only restrict maximum permissions. IAM policies grant permissions within those guardrails. An Allow in an SCP does not grant access — it removes an organisational restriction. Both must allow an action for it to succeed. SCPs are management-layer controls; IAM policies are resource-layer controls.',
        },
        {
          name: 'IAM Users vs IAM Roles',
          when: 'IAM Users have long-term credentials (password + access keys) — use only for special cases (break-glass accounts, legacy systems that cannot assume roles). IAM Roles use temporary credentials with automatic rotation — the default for all other use cases. Audit your account: if IAM Users outnumber IAM Roles, your security posture needs work.',
        },
      ],
    },
    failures: [
      {
        name: 'Overly Permissive Wildcard Policies',
        cause: 'Developer adds s3:* or ec2:* to unblock a test, it ships to production. Or a third-party integration guide suggests AdministratorAccess without explanation of risk.',
        symptom: 'IAM Access Analyzer generates findings. Security audit identifies high-risk roles. Compromised instance or Lambda can access all S3 buckets in the account instead of just one.',
        fix: 'Run aws iam generate-service-last-accessed-details to identify which permissions are actually used. Prune unused permissions. Replace wildcards with specific actions (s3:GetObject, s3:PutObject). Apply to specific resources ARNs. Enable Access Analyzer to continuously detect overly permissive policies going forward.',
        severity: 'critical',
      },
      {
        name: 'Leaked Long-Term Access Keys',
        cause: 'Developer accidentally commits AKIA... access keys to a public GitHub repo. Or keys are hardcoded in a Lambda environment variable. GitHub Secret Scanning or threat actors scan for these continuously.',
        symptom: 'GuardDuty finding: UnauthorizedAccess:IAMUser/MaliciousIPCaller.Custom. Unusual API calls from foreign IP addresses. Spike in AWS bills from cryptocurrency mining EC2 instances in unexpected regions.',
        fix: 'Rotate immediately: aws iam update-access-key --status Inactive. Invalidate all active sessions: aws iam delete-access-key. Audit CloudTrail for actions taken with the leaked key. Implement git-secrets or truffleHog in CI to prevent future commits. Remove long-term keys from all production workloads — use roles.',
        severity: 'critical',
      },
      {
        name: 'Confused Deputy Attack',
        cause: 'A service (e.g., a third-party SaaS) assumes your role to access your resources. Without a Condition on the trust policy, any account that knows your role ARN can potentially abuse the service to act on their behalf using your role.',
        symptom: 'A cross-account service can be tricked by a malicious third party to use your AWS role ARN with the service — the service then acts on behalf of the attacker using your role\'s permissions. Subtle attack vector, often discovered during security reviews.',
        fix: 'Add aws:SourceAccount and aws:SourceArn Condition keys to the role trust policy. This ensures only the specific service acting on behalf of your specific account/resource can assume the role — not any arbitrary caller through the same service.',
        severity: 'high',
      },
      {
        name: 'Permission Escalation via IAM Role Creation',
        cause: 'A role with iam:CreateRole and iam:AttachRolePolicy permissions (without a Permission Boundary enforcement) can create a new role with AdministratorAccess and assume it — effectively escalating from limited permissions to full admin.',
        symptom: 'A compromised service or malicious insider creates a high-privilege role. The role passes compliance checks because it was created by legitimate IAM APIs. Detected only by CloudTrail analysis or Access Analyzer.',
        fix: 'Attach Permission Boundaries to all roles that can create IAM resources. Use SCP to enforce: any iam:CreateRole call must include iam:PermissionsBoundary with the approved boundary ARN. Deploy AWS Config rule iam-role-requires-permission-boundary for continuous enforcement.',
        severity: 'critical',
      },
    ],
    a: {
      v: '🔐🎭🛡️',
      t: 'A Security Clearance System for a Government Building',
      tx: 'Imagine AWS as a massive government building complex with hundreds of departments (services). IAM is the security clearance system that governs who can enter which rooms and what they can do inside.\n\nEvery person (IAM User) or automated worker (IAM Role) carries a badge. The badge has a list of clearances (IAM policies): "allowed to enter the finance department and read documents, but not modify them." The badge does not automatically grant access — every door has a reader that checks clearances in real time.\n\nIAM Roles are like contractor badges that self-destruct after 8 hours. An EC2 instance or Lambda function puts on a temporary badge (assumes a role) and gets temporary access credentials. When the job is done or the time expires, the badge becomes invalid — no long-term secrets to steal.\n\nService Control Policies are like the building\'s security regulations that override individual clearances. Even if your badge says you can go to a certain floor, the building regulation saying "no access to server rooms without a 2-person rule" takes precedence.\n\nPermission Boundaries are like a rule that says "even if the security manager gives someone a clearance, they cannot give clearances that exceed their own level." This prevents a mid-level security manager from creating a super-clearance badge for themselves.\n\nThe IAM Access Analyzer is like a mathematical proof checker — it formally verifies whether the combination of all clearance rules could allow an outsider to access something they should not, rather than just spot-checking obvious cases.',
      s: 'The security maturity signal in AWS accounts: the ratio of IAM Roles to IAM Users. In a well-managed account, IAM Roles (for services + human SSO federation) vastly outnumber permanent IAM Users. The ideal production account has zero active long-term access keys in use. If you audit an account and find AKIA access keys associated with IAM Users being used for production automation, that is the highest-priority security remediation — not because the keys are necessarily compromised, but because they never rotate and a single credential leak has indefinite blast radius.',
    },
    te: {
      def: 'IAM policy evaluation runs synchronously on every AWS API call with sub-millisecond latency, distributed to every AWS region and service endpoint. Policies are evaluated using a policy engine built around formal logic — the same logic that powers Access Analyzer (via the Zelkova automated reasoning engine, based on Z3 SMT solver). Policy documents are compiled to an internal representation for fast evaluation.',
      types: [
        { n: 'AWS Managed Policies', d: 'Maintained by AWS, broad-use policies (ReadOnlyAccess, AdministratorAccess, AmazonS3FullAccess). Automatically updated when services add new actions. Not ideal for least-privilege — use as starting point only.' },
        { n: 'Customer Managed Policies', d: 'You define, version, and maintain. Can be shared across multiple principals. Best practice for production — scope precisely to what your service needs.' },
        { n: 'Inline Policies', d: 'Embedded directly in a user/role/group. Not reusable. Appropriate for one-off permissions unique to a single principal. Harder to audit and manage at scale.' },
        { n: 'Resource-Based Policies', d: 'Attached to the resource (S3 bucket policy, KMS key policy, Lambda resource policy). Enable cross-account access without role assumption. Evaluated alongside identity policies.' },
        { n: 'Session Policies', d: 'Passed during AssumeRole to further restrict the assumed role\'s permissions for that specific session. Maximum permissions = intersection of role policy and session policy.' },
      ],
      when: 'IAM is relevant for every AWS interaction — it is not a feature you "turn on," it is the foundation of every API call. The design question is not "should we use IAM?" but "how granular should our IAM policies be?" The answer is always: as granular as operationally practical — specific actions, specific resource ARNs, and specific Condition keys. Broader than necessary means blast radius of a compromised credential is unnecessarily large.',
      trade: 'IAM\'s core trade-off is security vs. operational overhead. Least-privilege policies require maintaining fine-grained policies that must be updated when services add features or applications change. Wildcard policies are easier to maintain but dramatically increase breach blast radius. The operational middle ground: use managed policies to bootstrap quickly, then constrain with customer managed policies once access patterns stabilise. Accept the maintenance overhead — the alternative is a compromised key with unlimited AWS access.',
      code: `# IAM Role with least-privilege + Permission Boundary (Terraform)
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Permission Boundary — cap what this role can ever do
resource "aws_iam_policy" "dev_boundary" {
  name = "developer-permission-boundary"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:*", "dynamodb:*", "sqs:*", "sns:*", "logs:*"]
      Resource = "*"
    }, {
      Effect   = "Deny"
      Action   = ["iam:*", "organizations:*", "cloudtrail:Delete*"]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role" "lambda_exec" {
  name                 = "order-processor-role"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume.json
  permissions_boundary = aws_iam_policy.dev_boundary.arn
}

# Least-privilege: only what this function actually needs
data "aws_iam_policy_document" "lambda_permissions" {
  statement {
    sid       = "Logs"
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:log-group:/aws/lambda/order-processor:*"]
  }
  statement {
    sid       = "SQS"
    effect    = "Allow"
    actions   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
    resources = [aws_sqs_queue.orders.arn]
  }
  statement {
    sid       = "DynamoDB"
    effect    = "Allow"
    actions   = ["dynamodb:PutItem", "dynamodb:GetItem"]
    resources = [aws_dynamodb_table.orders.arn]
  }
  statement {
    sid     = "KMS"
    effect  = "Allow"
    actions = ["kms:Decrypt", "kms:GenerateDataKey"]
    resources = [aws_kms_key.app.arn]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["sqs.\${var.region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "lambda_exec" {
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}`,
      rw: {
        ex: [
          'Capital One\'s 2019 data breach was caused by a misconfigured WAF that allowed SSRF, which then accessed the EC2 instance metadata service and obtained IAM role credentials — illustrating why IMDSv2 (session-oriented metadata access) and least-privilege role policies are critical.',
          'Netflix operates their entire platform with IAM roles, never using long-term access keys in production services. Their Stethoscope tool continuously evaluates device security compliance as part of their zero-trust architecture.',
          'Slack uses AWS IAM Identity Center with Okta integration — thousands of engineers access dozens of AWS accounts through SSO with no long-term IAM User credentials.',
          'AWS itself uses IAM internally to manage access between the internal teams that operate each service — the same IAM API surface available to customers.',
        ],
        cs: 'A startup suffered a crypto-mining attack: a Lambda function had a broad IAM policy (ec2:* on *). An attacker found a Server-Side Request Forgery vulnerability in the application, used it to retrieve the Lambda\'s IAM role credentials from the metadata service, and launched 50 GPU EC2 instances in multiple regions. The bill reached $47,000 before CloudWatch billing alarms triggered. Post-incident: migrated to IMDSv2 (session-oriented, prevents SSRF credential theft), scoped Lambda IAM policies to exact actions needed (no EC2 permissions at all), deployed GuardDuty for anomaly detection. Implementing these three controls took 4 hours; the missing controls cost $47K and a security incident.',
      },
    },
    interview: {
      q: 'Explain how cross-account access works in AWS IAM and design a secure pattern for a central logging account to collect CloudWatch logs from 20 application accounts.',
      a: 'Cross-account access requires two Allows: the identity policy of the caller must Allow sts:AssumeRole targeting the role in the destination account, AND the trust policy of the destination role must Allow the source account\'s principal to assume it. For centralised logging: in the logging account, create an S3 bucket with a bucket policy allowing PutObject from all 20 application account principals (aws:PrincipalOrgID condition restricts to accounts in the Organisation). In each application account, create an IAM Role for CloudWatch Log Delivery with a trust policy allowing logs.region.amazonaws.com to assume it, and a permission policy allowing s3:PutObject only on the logging bucket. CloudWatch Log Groups have a subscription filter that sends to Kinesis Firehose, which assumes the delivery role and writes to the central S3 bucket. SCP on all application accounts prevents any account from disabling CloudTrail or modifying the log delivery role.',
      fu: [
        'Explain the IAM policy evaluation order — what happens when an identity policy allows an action but a resource policy on the target denies it?',
        'What is the Confused Deputy problem in AWS IAM and how do the aws:SourceAccount and aws:SourceArn condition keys solve it?',
        'How does Permission Boundary enforcement prevent privilege escalation when delegating IAM role creation to developers?',
        'What is the difference between STS AssumeRole and STS AssumeRoleWithWebIdentity — when is each used?',
        'Explain how IAM Access Analyzer uses formal verification (not just pattern matching) to detect public resource exposure.',
        'How would you implement break-glass emergency access to an AWS account when SSO federation is unavailable?',
      ],
    },
  },
];
