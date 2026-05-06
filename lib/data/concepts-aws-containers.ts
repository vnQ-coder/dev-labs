import { Concept } from '../types';

export const CONCEPTS_AWS_CONTAINERS: Concept[] = [
  {
    id: 'ecs',
    cat: 'cloud',
    color: '#ff9900',
    icon: 'ecs',
    title: 'Amazon ECS',
    tag: 'AWS-native container orchestration — simpler path to production containers',
    overview:
      'Amazon ECS (Elastic Container Service) is AWS\'s proprietary container orchestration service, purpose-built for deep integration with the AWS ecosystem. Unlike Kubernetes, ECS has fewer abstractions — no etcd, no kube-scheduler, no RBAC objects — making it significantly simpler to operate. The ECS control plane is fully managed by AWS (zero ops cost on your side). You define what containers to run via Task Definitions, how many via Services, and ECS handles placement, rolling updates, health-check integration with ALB, auto-scaling, logging, and secrets injection. ECS supports two launch types: Fargate (serverless — AWS manages the underlying VMs, you pay per task CPU/memory second) and EC2 (you provision EC2 instances into the cluster, ECS schedules tasks onto them). ECS is the right choice when: team is AWS-native, application complexity does not require K8s ecosystem tooling, and operational simplicity is a priority. Powers Amazon.com\'s own microservices internally.',
    components: [
      {
        name: 'Task Definition',
        icon: 'task-def',
        role: 'Versioned blueprint specifying container image, resources, secrets, logging, and IAM roles for a workload',
        detail:
          'Version-controlled JSON document specifying: container image (ECR URI), CPU/memory allocation (hard limits for Fargate, soft/hard for EC2), port mappings, environment variables, secrets (AWS Secrets Manager ARN or SSM Parameter Store path — injected at task start, not stored in the task definition), IAM Task Role (for AWS API calls from within the container), IAM Execution Role (for pulling from ECR, writing CloudWatch logs), log configuration (awslogs → CloudWatch Logs with group/stream prefix), health check command (overrides Docker HEALTHCHECK), volumes, mount points, ulimits. Task definitions are immutable and versioned — updating creates a new revision. Containers within the same task definition share a network namespace (can communicate via localhost) and optionally share volumes. Essential containers: if any container in a task marked essential exits, the entire task stops.',
      },
      {
        name: 'ECS Service',
        icon: 'service',
        role: 'Maintains N running tasks and manages rolling deployments, auto-scaling, and ALB registration',
        detail:
          'Key parameters: desired count (target number of running tasks), minimum healthy percent (default 100% — ensures at least this fraction of desired count stays healthy during updates), maximum percent (default 200% — allows launching replacement tasks before stopping old ones). Rolling update: ECS launches new tasks using the new task definition revision, waits for ALB health check to pass, registers in target group, then drains and stops old tasks. Deployment circuit breaker: automatically rolls back to previous task definition if new deployment fails health checks (configurable failure threshold). Service Auto Scaling: Application Auto Scaling adjusts desired count based on CloudWatch metrics (TargetTracking: keep avg CPU at 50%, StepScaling: add N tasks at thresholds). Blue/green deployments via CodeDeploy: shift traffic between two target groups with configurable canary/linear/all-at-once strategies; one-click rollback.',
      },
      {
        name: 'ECS Cluster',
        icon: 'cluster',
        role: 'Logical grouping of infrastructure (Fargate capacity or EC2 instances) for running tasks',
        detail:
          'For Fargate: cluster is purely logical (AWS manages underlying compute). For EC2: cluster contains EC2 instances running the ECS Agent (a Go daemon that communicates with ECS control plane, reports instance capacity, accepts task placement instructions). ECS Agent connects to ECS endpoint via HTTPS, polls for task changes, and invokes Docker/containerd locally. Multiple services share a cluster. Container Insights: enables CloudWatch metrics per cluster/service/task (CPU, memory, network, disk) — essential for capacity planning and alarming.',
      },
      {
        name: 'Fargate Launch Type',
        icon: 'fargate',
        role: 'Serverless compute — AWS allocates isolated micro-VMs per task, eliminating EC2 management',
        detail:
          'AWS allocates an isolated Firecracker micro-VM per task (or per pod in EKS Fargate). Firecracker: open-source VMM developed by AWS, starts in <125ms, provides VM-level kernel isolation per task — eliminates noisy-neighbour at kernel level. You specify CPU/memory at task level (Fargate has defined size combinations: 0.25-16 vCPU, 0.5-120 GB RAM). No EC2 instances to patch, right-size, or manage. Fargate VPC networking: each task gets an ENI attached directly to your VPC (awsvpc network mode) — task gets a VPC IP, security groups apply directly to the task. Cost: ~20-30% premium over equivalent EC2 Reserved; justified by zero ops overhead. Spot Fargate: 70% discount with 2-minute interruption notice — for stateless, fault-tolerant workloads.',
      },
      {
        name: 'EC2 Launch Type',
        icon: 'ec2',
        role: 'Run tasks on EC2 instances you provision — enables Spot, GPU, and large-memory workloads',
        detail:
          'ECS agent on each instance reports available CPU/memory to ECS control plane. Task placement strategies: binpack (maximise density — pack tasks on fewest instances for cost), spread (distribute across AZs/instances for HA), random. Task placement constraints: memberOf expression language filters instances by attributes (e.g., only instances with GPU, only specific AZ). You manage: EC2 AMI updates (ECS-optimised AMI), Auto Scaling Group for the cluster, instance patching. Benefit: use Spot Instances (70-90% savings) and Reserved Instances; GPU instance types; larger instance-level memory (>120GB). Capacity Providers: link ASG to ECS cluster for automated capacity management — Managed Scaling adjusts ASG size based on pending tasks.',
      },
      {
        name: 'ALB Integration & Service Discovery',
        icon: 'alb',
        role: 'Native ALB/NLB integration for traffic routing and Service Connect for east-west service mesh',
        detail:
          'ECS services integrate natively with Application Load Balancer and Network Load Balancer. ECS service registers/deregisters task ENIs with ALB target groups automatically as tasks start/stop. Target Group health checks gate traffic — unhealthy tasks never receive production traffic. Slow start: gradually ramp up traffic to new tasks (avoids cold-start JVM/cache-warming issues). Multiple target groups per service: attach to multiple ALB listener rules for path-based routing. Service Connect (AWS Cloud Map): ECS\'s service mesh — provides service-to-service DNS (service.namespace:port) with client-side load balancing, retries, circuit breaking. Alternative: App Mesh (Envoy-based) for full observability and traffic control. Service discovery via Cloud Map: services register their IPs automatically; other services discover via DNS or API.',
      },
      {
        name: 'IAM Roles & Security',
        icon: 'iam',
        role: 'Two-role model: Execution Role for ECS agent pulls/logging, Task Role for application AWS API access',
        detail:
          'Two roles per task: (1) Task Execution Role: used by ECS agent to pull ECR images and write CloudWatch logs — needs ecr:GetAuthorizationToken, ecr:BatchGetImage, logs:CreateLogStream, logs:PutLogEvents, secretsmanager:GetSecretValue, ssm:GetParameter. (2) Task Role: IAM role assumed by the application code inside the container (using the container credentials endpoint 169.254.170.2) — give only the permissions the app needs (S3 read, DynamoDB write, etc.). Avoid passing static AWS credentials via environment variables — always use Task Role. Secrets injection: reference Secrets Manager ARN or SSM path in task definition secrets field — ECS injects the value as an environment variable at task start time, value never stored in the definition or passed via API response.',
      },
      {
        name: 'Logging & Observability',
        icon: 'logs',
        role: 'awslogs driver, FireLens routing, Container Insights metrics, and X-Ray tracing',
        detail:
          'awslogs driver: each container\'s stdout/stderr → CloudWatch Logs (log group per service, stream per task ID). FireLens: route logs to multiple destinations (S3, Kinesis, OpenSearch, third-party) via Fluentbit/Fluentd sidecar container — structured log routing without modifying app code. Container Insights: per-task CloudWatch metrics (enable at cluster level). AWS X-Ray: distributed tracing — run X-Ray daemon as sidecar container, instrument app with X-Ray SDK. CloudWatch Alarms on ECS metrics → SNS → PagerDuty for alerting. Deployment failure alerting: subscribe to ECS EventBridge events (task state changes, service deployment events).',
      },
      {
        name: 'ECS Anywhere',
        icon: 'anywhere',
        role: 'Run ECS tasks on on-premises servers, other cloud VMs, or edge devices using same ECS API',
        detail:
          'Run ECS on any infrastructure: on-premises servers, other cloud VMs, Raspberry Pi. Register external instances to an ECS cluster via the ECS Anywhere installation script (installs SSM agent + ECS agent). Enables hybrid container deployments: run some services on-prem (for data residency) and some in AWS. Useful for edge computing, factory floors, and gradual cloud migration. Same ECS API, same Task Definitions, same observability tooling — consistent operational model across locations.',
      },
      {
        name: 'ECS Exec',
        icon: 'exec',
        role: 'Direct shell access into running containers for debugging via SSM Session Manager — no SSH needed',
        detail:
          'Direct shell access to running containers for debugging without SSH on the host. Uses SSM Session Manager under the hood — no port 22 needed. Enable on service with enableExecuteCommand: true. Run: aws ecs execute-command --cluster prod --task <task-id> --container api --interactive --command /bin/bash. Access container filesystem, run debug commands, check environment variables. Audit trail: ECS Exec commands logged to CloudWatch Logs / S3. Essential for debugging CrashLoopBackOff equivalents (task failing after start).',
      },
    ],
    howItWorks:
      'Trace a new deployment end-to-end: developer pushes new Docker image to ECR → updates ECS service with new task definition revision (via Console, CLI, or CI/CD pipeline) → ECS service scheduler creates new tasks using new task definition → ECS control plane (AWS-managed) places tasks on Fargate or available EC2 instances based on launch type → task starts: ECS agent pulls image from ECR (using Execution Role for auth) → injects secrets from Secrets Manager as env vars → starts container → container liveness and health check runs → once healthy, ECS registers task ENI IP with ALB target group → ALB starts routing traffic to new task → ECS drains connections from old task (deregistration delay, default 300s — reduce to 30s for stateless HTTP) → ECS stops old task. If new task fails health check N times → deployment circuit breaker triggers → ECS rolls back to previous task definition revision automatically.',
    failures: [
      {
        name: 'Image Pull Failure',
        cause: 'Task Execution Role missing ECR permissions, or network path to ECR endpoint blocked',
        symptom: 'Task transitions to STOPPED with reason "CannotPullContainerError: pull access denied"',
        fix: 'Verify Execution Role has ecr:GetAuthorizationToken (account-level), ecr:BatchGetImage, and ecr:GetDownloadUrlForLayer. If using private subnets, add VPC Interface Endpoints for ecr.api, ecr.dkr, and S3 Gateway Endpoint. Check security group allows HTTPS outbound to ECR endpoint.',
        severity: 'critical',
      },
      {
        name: 'Task OOMKilled',
        cause: 'Container exceeds the hard memory limit defined in the task definition',
        symptom: 'Task stops with exit code 137, CloudWatch Logs show no graceful shutdown — container killed mid-request',
        fix: 'Increase task memory limit in task definition. Enable Container Insights to monitor MemoryUtilized metric. Add JVM heap flags (-Xmx) for Java apps. Consider splitting large monolith tasks into smaller focused tasks. Set memoryReservation (soft limit) below memory (hard limit) to allow bursting.',
        severity: 'high',
      },
      {
        name: 'Service Stuck in Draining',
        cause: 'ALB deregistration delay too high, or long-polling connections not closing during task drain',
        symptom: 'Rolling deployment stalls — old tasks remain in DRAINING state for 5+ minutes per batch',
        fix: 'Reduce ALB target group deregistration_delay from default 300s to 15-30s for stateless HTTP APIs. For WebSocket or long-poll workloads, implement graceful shutdown that closes connections on SIGTERM. ECS sends SIGTERM when draining starts, then SIGKILL after stopTimeout seconds.',
        severity: 'medium',
      },
      {
        name: 'Task Placement Failure on EC2 Cluster',
        cause: 'Cluster EC2 instances lack sufficient CPU/memory, or placement constraints eliminate all candidates',
        symptom: 'Service desired count not met; ECS events show "no container instances were found in your capacity provider"',
        fix: 'Enable Capacity Provider with Managed Scaling (ASG scales EC2 instances when tasks are pending). Check placement constraints — overly strict memberOf expressions can exclude all instances. Use Capacity Provider strategy combining FARGATE_SPOT as fallback. Review cluster CPU/memory reservation metrics in Container Insights.',
        severity: 'high',
      },
    ],
    a: {
      v: 'ECS as Professional Kitchen Manager',
      t: 'ECS is the Professional Kitchen Manager',
      tx: 'ECS is the expediter in a professional kitchen — the person who stands between the chefs (your containers) and the customers (traffic). You tell the manager "I need 10 portions of the new recipe ready at all times." The manager: hires kitchen workers (Fargate tasks), assigns them stations (AZs), fires up new workers when old ones quit (restarts failed tasks), replaces a worker\'s recipe when you push an update (rolling deployment), and never sends a dish to a customer until it passes the quality check (ALB health check). With Fargate, the kitchen is fully staff-managed — you never see who\'s mopping floors (no EC2). With EC2, you own the kitchen building and staff — more control, more responsibility.',
      s: 'The single biggest ECS performance mistake: leaving the ALB deregistration delay at the default 300 seconds. This means every rolling deployment takes 5 minutes per task group just waiting for connections to drain. For stateless REST APIs, set it to 15-30 seconds. Deployment time drops from 20 minutes to 3 minutes. The second mistake: not enabling the deployment circuit breaker. Without it, a bad deployment silently spins up failing tasks, ECS keeps retrying, and you get paged at 2am wondering why your service has 0 healthy tasks.',
    },
    te: {
      def: 'Amazon ECS is a fully managed container orchestration service that runs Docker containers on AWS infrastructure. It eliminates the need to install, operate, or scale your own cluster management software. You declare what to run (Task Definition), how many copies (Service), and ECS handles scheduling, placement, health checking, rolling updates, and integration with AWS services.',
      types: [
        {
          n: 'Fargate Launch Type',
          d: 'Serverless containers — AWS manages all underlying EC2 capacity. You define CPU/memory per task and pay per second of execution. No instances to patch or right-size. Best for teams wanting zero infrastructure management and tasks with predictable resource requirements.',
        },
        {
          n: 'EC2 Launch Type',
          d: 'You provision EC2 instances into the ECS cluster; ECS schedules tasks onto them. Full control over instance type (GPU, large memory), Spot Instance integration for cost savings, and instance-level network performance. Requires managing instance lifecycle, AMI updates, and ASG configuration.',
        },
        {
          n: 'ECS Anywhere',
          d: 'Run ECS tasks on any compute — on-premises servers, other clouds, or edge devices. Register external instances via SSM agent. Provides consistent ECS API and tooling for hybrid and edge deployments without migrating workloads to AWS.',
        },
      ],
      when: 'Choose ECS when your team is AWS-native and needs container orchestration without the operational overhead of Kubernetes. Ideal for: microservices already using ALB/RDS/SQS/SNS (ECS integrates natively), teams without Kubernetes expertise, workloads that don\'t require K8s ecosystem tools (Argo CD, Istio, Prometheus Operator), and internal AWS services that need deep VPC/IAM integration. ECS Fargate is the default starting point — switch to EC2 only when needing GPU, large memory, or Spot cost optimisation.',
      trade: 'ECS vs EKS: ECS wins on simplicity, zero control-plane cost, and AWS-native integration depth. EKS wins on portability (standard K8s API), ecosystem (Helm, Argo CD, Istio, thousands of operators), and multi-cloud strategy. ECS vs Fargate: Fargate eliminates all instance management but costs ~20-30% more per compute unit and has limits (max 16 vCPU/120GB per task). EC2 launch type unlocks GPU, large memory, and Spot savings. Key ECS tradeoffs: no built-in multi-cluster federation, limited extensibility vs K8s CRDs, proprietary API that ties you to AWS.',
      code: `# ECS Fargate + ALB — Production Terraform Configuration

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

# --- Cluster ---
resource "aws_ecs_cluster" "main" {
  name = "prod-cluster"

  # Enable Container Insights for per-service CloudWatch metrics
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# --- Task Definition ---
resource "aws_ecs_task_definition" "api" {
  family                   = "api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"   # Required for Fargate
  cpu                      = 512        # 0.5 vCPU
  memory                   = 1024       # 1 GB

  # Execution Role: ECS agent uses this to pull ECR image + write CloudWatch logs
  execution_role_arn = aws_iam_role.ecs_execution.arn
  # Task Role: application code uses this for AWS API calls (S3, DynamoDB, etc.)
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "\${aws_ecr_repository.api.repository_url}:latest"
      essential = true

      portMappings = [{ containerPort = 8080, protocol = "tcp" }]

      # Hard memory limit — container killed if exceeded (OOMKilled)
      memory = 1024
      # Soft limit — ECS uses this for placement decisions
      memoryReservation = 768
      cpu               = 512

      # Inject secrets from Secrets Manager — never hardcode credentials
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "arn:aws:secretsmanager:us-east-1:123456789:secret:prod/api/db-password"
        }
      ]

      environment = [
        { name = "ENV",  value = "production" },
        { name = "PORT", value = "8080" }
      ]

      # CloudWatch Logs — one log group per service
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/prod/api"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "api"
        }
      }

      # Application-level health check (overrides Docker HEALTHCHECK)
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60   # Grace period for slow JVM/cache startup
      }

      # Security hardening
      readonlyRootFilesystem = true
      user                   = "1000:1000"   # Non-root user
    }
  ])
}

# --- ECS Service ---
resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.api_task.id]
    assign_public_ip = false   # Tasks in private subnets — access via ALB
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  # Zero-downtime rolling deployment settings
  deployment_minimum_healthy_percent = 100   # Never drop below desired count
  deployment_maximum_percent         = 200   # Allow 2x tasks during rollout

  # Auto rollback if deployment fails health checks
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # Wait for steady state before marking deployment complete
  wait_for_steady_state = true

  depends_on = [aws_lb_listener.https]
}

# ALB Target Group — set low deregistration delay for fast deployments
resource "aws_lb_target_group" "api" {
  name        = "api-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"   # Fargate requires ip target type

  # Reduce from default 300s — critical for fast rolling deployments
  deregistration_delay = 30

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

# --- Auto Scaling ---
resource "aws_appautoscaling_target" "api" {
  max_capacity       = 20
  min_capacity       = 3
  resource_id        = "service/\${aws_ecs_cluster.main.name}/\${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Target tracking: keep average CPU at 60%
resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60.0
    scale_in_cooldown  = 300   # Wait 5 min before scaling in
    scale_out_cooldown = 60    # Scale out quickly under load
  }
}`,
      rw: {
        ex: [
          'Amazon.com internal microservices — ECS is the original orchestrator AWS built to run its own e-commerce platform at scale',
          'Duolingo — runs language-learning workloads on ECS Fargate, cited zero-ops benefit as key to small team scaling',
          'Snap — ECS for stateless API services, Fargate for burst capacity during peak usage',
          'McDonald\'s — ECS Fargate for restaurant management microservices, cited operational simplicity over K8s',
          'Vanguard — financial services workloads on ECS with strict IAM Task Roles for compliance-grade least privilege',
        ],
        cs: 'A fintech startup migrated from Heroku to ECS Fargate: 12 microservices, each with its own ECS Service behind a shared ALB (path-based routing). Deployment pipeline: GitHub Actions → ECR push → ECS service update via AWS CLI. Problem encountered: deployments took 20+ minutes. Root cause: default 300s ALB deregistration delay across 12 services with 3 tasks each = 12 × 3 × 300s sequential drain. Fix: reduced deregistration delay to 15s for all stateless HTTP services, enabled deployment parallelism. Result: deployments dropped to 3 minutes. Second problem: no deployment circuit breaker — a bad image with a startup crash looped for 45 minutes before manual intervention. Fix: enabled circuit breaker with rollback=true. Next bad deployment auto-rolled back in 4 minutes with zero manual action.',
      },
    },
    interview: {
      q: 'Design a deployment pipeline for 20 microservices on ECS Fargate with zero-downtime deployments and automatic rollback. Walk me through the architecture.',
      a: 'Each microservice gets its own ECR repository (immutable tags, scan-on-push enabled). CI pipeline per service: GitHub Actions triggers on merge to main → CodeBuild builds and pushes Docker image to ECR → waits for Inspector scan COMPLETE with 0 critical CVEs → updates ECS service with new task definition revision using the image digest (not tag). ECS rolling deployment configuration: minimumHealthyPercent 100 (never drop below desired count — zero degradation), maximumPercent 200 (launch replacement tasks before stopping old), deployment circuit breaker enabled with rollback=true (auto-rollback if new tasks fail ALB health checks after N failures). ALB deregistration delay tuned per service type: 15s for stateless HTTP, 60s for services with WebSocket or DB connection warm-up. For critical services (payment, auth): blue/green deployment via CodeDeploy — traffic shifted using canary (10% for 10 minutes, then 100%) with instant one-click rollback by flipping target groups. Monitoring: Container Insights at cluster level, CloudWatch alarms on UnhealthyHostCount and TargetResponseTime per target group → SNS → PagerDuty. EventBridge rule on ECS deployment events (SERVICE_DEPLOYMENT_FAILED) → Lambda → Slack notification. Each service has an independent ECS Service so one bad deployment cannot affect other services.',
      fu: [
        'How would you handle task placement for a service that requires GPU instances? Walk me through Capacity Provider configuration.',
        'A developer accidentally pushes a 4GB Docker image to ECR. What happens to your ECS deployment SLA and how do you prevent this?',
        'Explain how Fargate Spot interruptions are handled. Would you use Spot for a payment processing service?',
        'Your service uses Service Connect for internal communication. Another team switches their service to a new port. What breaks and how do you fix it without downtime?',
        'How do you implement ECS task-level IAM when different tasks in the same service need different DynamoDB table access?',
        'The deployment circuit breaker rolled back automatically at 3am. How do you investigate what caused the failure given the failed tasks are already stopped?',
      ],
    },
  },

  {
    id: 'eks',
    cat: 'cloud',
    color: '#ff9900',
    icon: 'eks',
    title: 'Amazon EKS',
    tag: 'Managed Kubernetes — AWS handles the control plane, you run the workloads',
    overview:
      'Amazon EKS (Elastic Kubernetes Service) is AWS\'s managed Kubernetes offering. AWS runs and manages the Kubernetes control plane (API server, etcd, controller manager, scheduler) across multiple AZs with automatic upgrades, patching, and backup. You never SSH into an etcd node. You interact with a fully standard Kubernetes API — any kubectl command, any Helm chart, any K8s ecosystem tool works without modification. EKS handles the hardest parts of K8s ops: control plane HA, etcd backup/restore, API server scaling, version upgrades. You manage the data plane: EC2 managed node groups (AWS manages the ASG and node AMI updates), Fargate profiles (serverless pod execution), or self-managed nodes (full control). EKS integrates deeply with AWS services: IAM for pod-level permissions (IRSA), VPC CNI for pod networking (each pod gets a VPC IP), AWS Load Balancer Controller (ALB/NLB per Ingress/Service), EBS/EFS CSI drivers for persistent storage, Karpenter for node provisioning. The choice for organisations investing in Kubernetes long-term, needing multi-cloud portability, or requiring the K8s ecosystem (Argo CD, Istio, Prometheus Operator).',
    components: [
      {
        name: 'EKS Control Plane',
        icon: 'control-plane',
        role: 'AWS-managed Kubernetes API server and etcd — multi-AZ, automatically patched, 99.95% SLA',
        detail:
          'AWS-managed Kubernetes API server and etcd running in a VPC you do not own. Multi-AZ by default: 2 API server instances across AZs, 3 etcd nodes across 3 AZs. Control plane SLA: 99.95%. Automatic version upgrades: AWS provides a window, you trigger the upgrade. Network communication: control plane connects to your data plane via AWS-managed ENIs placed in your VPC (access via private endpoint or public endpoint, or both). Private endpoint: API server only accessible within VPC — recommended for production. aws eks update-kubeconfig generates a kubeconfig using AWS CLI token (STS GetCallerIdentity → K8s authentication). EKS access entries (new) vs aws-auth ConfigMap (legacy): map IAM principals to K8s RBAC subjects.',
      },
      {
        name: 'Managed Node Groups',
        icon: 'node-group',
        role: 'EKS-managed EC2 ASGs with automated node updates that respect PodDisruptionBudgets',
        detail:
          'EC2 ASGs managed by EKS for the worker node data plane. AWS provides EKS-optimised AMIs (Amazon Linux 2, Bottlerocket — hardened minimal container-focused OS). Automated node updates: EKS drains pods (respects PodDisruptionBudgets), terminates old node, launches new node. Node group configuration: instance type, min/max/desired capacity, disk size, labels, taints. Mixed instance policy: combine multiple instance types for Spot diversity. Managed node groups handle: node registration to cluster, CloudWatch agent installation, tagging for Cluster Autoscaler discovery. Bottlerocket: purpose-built container OS — minimal attack surface, automatic updates via API (no SSH needed), A/B update partition (rollback if update fails), faster boot.',
      },
      {
        name: 'Karpenter',
        icon: 'karpenter',
        role: 'Node provisioner that calls EC2 Fleet API directly — provisions optimal nodes in ~60s vs 3-5min for Cluster Autoscaler',
        detail:
          'Open-source node provisioner (AWS-native, now CNCF project) that replaces Cluster Autoscaler for most EKS workloads. How it works: watches for unschedulable pods (Pending due to insufficient resources) → directly calls EC2 Fleet API to provision optimal instance type → node joins cluster in ~60 seconds (vs 3-5 minutes for Cluster Autoscaler + ASG). Key advantages: selects instance type based on pod resource requirements (no more over-provisioning), supports Spot with automatic diversification across families/sizes (reduces interruption rate), consolidates underutilised nodes (bin-packing + node termination = significant cost savings), no ASG configuration needed — just NodePool + EC2NodeClass CRDs. NodePool: defines which instance types, AMIs, resource limits Karpenter can use. Disruption: controlled node replacement based on expiry, drift (AMI update), consolidation.',
      },
      {
        name: 'IRSA (IAM Roles for Service Accounts)',
        icon: 'irsa',
        role: 'Pod-level IAM permissions via OIDC — temporary credentials automatically rotated, no node-level blast radius',
        detail:
          'Secure mechanism for pods to assume IAM roles without node-level credentials. How it works: EKS creates an OIDC provider (OpenID Connect) for the cluster → K8s ServiceAccount annotated with IAM role ARN → pod spec references ServiceAccount → kubelet requests a projected ServiceAccount token (audience-bound, time-limited JWT, automatically rotated) → AWS SDK in pod calls STS AssumeRoleWithWebIdentity with the JWT → receives temporary IAM credentials. Benefits: per-pod IAM permissions (not per-node), credentials rotate automatically, full CloudTrail audit trail, works with any AWS SDK. Pattern: one IAM role per K8s ServiceAccount per namespace — least privilege. Never use node-level IAM permissions for pod AWS API access (too broad).',
      },
      {
        name: 'AWS VPC CNI Plugin',
        icon: 'vpc-cni',
        role: 'Assigns real VPC IPs to pods — enables native VPC routing, security groups per pod, and direct ALB-to-pod targeting',
        detail:
          'EKS\'s default CNI plugin — assigns actual VPC IP addresses to pods. Each EC2 instance pre-allocates ENIs (Elastic Network Interfaces) and secondary private IPs from the VPC subnet. Pod scheduled to node → gets one of the pre-allocated VPC IPs → full VPC routing (pods reachable from anywhere in VPC without NAT). Implications: pod IPs consume VPC CIDR space — plan VPC sizing carefully (use /19 or larger subnets for node groups). Instance type determines max pods: c5.xlarge has 4 ENIs x 14 IPs = 56 max pods. Prefix delegation (newer): assign /28 prefixes per ENI → 256 pods per ENI. Security groups for pods: assign security groups directly to pods (not just nodes) using SecurityGroupPolicy CRD. Custom networking: assign pods to secondary VPC CIDRs to avoid exhausting primary CIDR.',
      },
      {
        name: 'AWS Load Balancer Controller',
        icon: 'alb-ctrl',
        role: 'Kubernetes controller that provisions ALB per Ingress and NLB per Service, routing directly to pod IPs',
        detail:
          'K8s controller that provisions ALB (for Ingress) and NLB (for Service type=LoadBalancer). Ingress: creates one ALB per Ingress resource (or shared ALB with IngressGroup). Supports: path-based routing, host-based routing, SSL termination, WAF attachment, Cognito auth, target type: ip (routes directly to pod IPs — bypasses kube-proxy, lower latency). NLB: provisions Network Load Balancer with TCP/UDP/TLS termination. Target type: ip routes to pod IPs across AZs. Annotations control ALB/NLB configuration (scheme, security groups, certificate ARN, idle timeout, access logs). Compared to nginx ingress controller: ALB Ingress Controller is fully managed, auto-scales, integrates with AWS WAF/Shield — but you pay per ALB. Nginx: single NLB + nginx pods in cluster — cheaper for many ingress rules.',
      },
      {
        name: 'EBS & EFS CSI Drivers',
        icon: 'storage',
        role: 'CSI plugins for EBS (per-pod block storage) and EFS (shared ReadWriteMany across pods and AZs)',
        detail:
          'Kubernetes CSI (Container Storage Interface) plugins for AWS storage. EBS CSI driver: dynamic provisioning of gp3/io2 EBS volumes via PVC. StorageClass: provisioner: ebs.csi.aws.com, parameters: type: gp3, iops: 3000, throughput: 125. Limitations: EBS volumes are AZ-bound — pods with EBS PVCs must schedule in the same AZ as the volume (use topology-aware scheduling). StatefulSet + EBS: each replica gets its own PVC (volumeClaimTemplates). EFS CSI driver: dynamic provisioning of EFS access points. ReadWriteMany access mode (multiple pods across AZs can mount same volume simultaneously). Use for: shared configuration, ML model serving (multiple inference pods), WordPress uploads. EFS throughput modes: bursting vs provisioned vs elastic. Backup: AWS Backup integration for EBS snapshots and EFS backups.',
      },
      {
        name: 'Add-ons & GitOps (Argo CD)',
        icon: 'addons',
        role: 'EKS managed add-ons for core components; Argo CD for declarative GitOps continuous delivery',
        detail:
          'EKS managed add-ons: kube-proxy, CoreDNS, VPC CNI, EBS CSI driver — AWS manages versioning and updates, installs via EKS API (not Helm). Community add-ons via EKS Marketplace. Argo CD: GitOps controller that watches a Git repo and continuously syncs cluster state to match. Application CRD defines: source repo + path, target cluster + namespace, sync policy (auto-sync or manual). ArgoCD ApplicationSets for multi-cluster/multi-environment deployment. GitOps flow: developer opens PR → CI runs tests → PR merged → Argo CD detects new commit → diffs desired state vs cluster state → applies changes → updates sync status. Audit trail: all changes tracked in Git. Instant rollback: revert commit → Argo CD syncs back. Helm charts + Argo CD: Argo CD renders Helm values and applies manifests.',
      },
      {
        name: 'EKS Fault Tolerance & Recovery',
        icon: 'ha',
        role: 'Multi-AZ control plane, node failure auto-recovery, Karpenter Spot replacement, and PodDisruptionBudgets',
        detail:
          'How EKS survives failures: Control plane: AWS runs API server + etcd in 3 AZs — single AZ failure does not impact control plane. Worker node failure: node controller marks node NotReady after 40s, evicts pods after 5min tolerationSeconds, ReplicaSet controller creates replacement pods on healthy nodes. AZ failure: pods with topologySpreadConstraints spread across AZs — AZ loss reduces capacity but workload continues. Pod failures: Deployment restarts failed pods via ReplicaSet controller. Self-healing with Karpenter: Karpenter can replace interrupted Spot nodes in <60s by launching a new instance and the pods self-reschedule. etcd: AWS takes automated backups of etcd. In a disaster scenario, control plane is rebuilt from the last etcd snapshot — typically <15 min RTO for control plane restoration. Worker node AMI drift: use Karpenter drift detection — automatically replaces nodes running outdated AMIs.',
      },
      {
        name: 'kubectl & Operational Tooling',
        icon: 'kubectl',
        role: 'kubectl for cluster operations, k9s for real-time visibility, Helm for package management, krew for plugins',
        detail:
          'Essential tooling for EKS operations: kubectl: primary CLI — get/describe/apply/delete/exec/logs/port-forward/rollout. kubeconfig setup: aws eks update-kubeconfig --name cluster-name --region us-east-1. k9s: terminal UI for K8s — real-time pod/node monitoring, log streaming, exec shells. Helm: package manager for K8s — charts define parameterised K8s manifests. Helm values + values-prod.yaml for environment overrides. kubectl plugins via krew: kubectl neat (clean up managed field noise), kubectl node-shell (node-level shell). Debugging commands: kubectl describe pod → events section (scheduling failures, image pull errors, probe failures). kubectl top nodes/pods (requires metrics-server). kubectl get events --sort-by=.lastTimestamp. kubectl rollout status deployment/name (watch rollout progress). kubectl rollout history deployment/name (list revisions). kubectl rollout undo deployment/name --to-revision=N.',
      },
    ],
    howItWorks:
      'Full trace of a production deployment using kubectl + Karpenter + Argo CD: (1) Developer merges PR to main branch. (2) Argo CD detects new Git commit, computes diff between desired state (Git) and actual state (cluster). (3) Argo CD applies updated Deployment manifest via EKS API server. (4) API server authenticates Argo CD ServiceAccount, RBAC authorises, admission controllers validate. (5) Written to etcd → Deployment controller creates new ReplicaSet. (6) ReplicaSet controller creates 3 new Pod objects (pending). (7) kube-scheduler: filter pass (find nodes with enough CPU/memory), score pass (prefer spread across AZs), assigns pods to nodes — or: no node has capacity. (8) If no capacity: Karpenter detects pending pods → reads pod resource requirements → calls EC2 Fleet API → instance launches → kubelet bootstraps → node joins cluster (registered via EKS API) in ~60s. (9) kubelet on target node: pulls image from ECR (using IRSA token for ECR auth), starts container via containerd. (10) Readiness probe passes → Endpoints controller adds pod VPC IP to EndpointSlice. (11) AWS Load Balancer Controller updates ALB target group with new pod IPs (target type: ip). (12) Traffic routes to new pods → Deployment controller scales down old ReplicaSet. (13) Karpenter consolidation: old node now underutilised → cordons node, evicts pods (respecting PDB), terminates EC2 instance. Spot interruption path: EC2 2-min notice → SIGTERM to pods → graceful shutdown → Karpenter provisions replacement node → pods reschedule automatically.',
    failures: [
      {
        name: 'Nodes NotReady — kubelet Cannot Reach API Server',
        cause: 'Security group blocking port 443 from worker nodes to control plane ENIs, or private endpoint DNS resolution failure',
        symptom: 'All nodes in NotReady state; pods stuck Pending; kubectl commands timeout from within the cluster',
        fix: 'Check security groups allow worker node security group → control plane managed security group on port 443. Verify VPC DNS is enabled (enableDnsSupport: true, enableDnsHostnames: true). Confirm private endpoint DNS resolves correctly inside VPC. Check aws-auth ConfigMap (or EKS access entries) maps node IAM role correctly. Use aws eks describe-cluster to verify endpoint access configuration.',
        severity: 'critical',
      },
      {
        name: 'Pod Eviction During Node Upgrade Without PDB',
        cause: 'Managed node group upgrade drains multiple nodes simultaneously; no PodDisruptionBudget protects service replicas',
        symptom: 'During maintenance window, service returns 503 — all replicas evicted simultaneously across upgrading nodes',
        fix: 'Add PodDisruptionBudget with minAvailable: 2 (or maxUnavailable: 1) to every production Deployment. Set maxUnavailable: 1 in Deployment rollingUpdate strategy. Distribute replicas across AZs using topologySpreadConstraints (maxSkew: 1, topologyKey: topology.kubernetes.io/zone). Karpenter respects PDBs during node consolidation and disruption.',
        severity: 'critical',
      },
      {
        name: 'VPC IP Exhaustion — Cannot Schedule More Pods',
        cause: 'VPC CNI exhausts secondary private IPs in node subnet; instance type max pod limit reached',
        symptom: 'New pods stuck Pending with "0/N nodes are available: N Insufficient pods" — nodes have CPU/memory headroom but no IPs',
        fix: 'Enable prefix delegation on aws-node DaemonSet (ENABLE_PREFIX_DELEGATION=true) — assigns /28 prefixes per ENI for 256 IPs instead of 14. Add secondary VPC CIDR (/16) with dedicated subnets for pods using custom networking (AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG=true). Alternatively, use larger instance types with more ENIs or switch high-density pods to Fargate profiles.',
        severity: 'high',
      },
      {
        name: 'IRSA Token Expired or Wrong Audience',
        cause: 'ServiceAccount annotation missing IAM role ARN, or IAM role trust policy has incorrect OIDC provider ARN or condition',
        symptom: 'Pod logs show "WebIdentityErr: failed to retrieve credentials" or "InvalidIdentityToken: Incorrect token audience"',
        fix: 'Verify ServiceAccount annotation: kubectl get sa <name> -o yaml | grep role-arn. Confirm IAM role trust policy: StringEquals condition must match cluster OIDC provider URL, ServiceAccount namespace and name exactly. Check token projection in pod spec (serviceAccountToken volume with audience: sts.amazonaws.com). Recreate pod after fixing annotation — tokens are projected at pod creation time.',
        severity: 'high',
      },
    ],
    a: {
      v: 'EKS as Managed Airport',
      t: 'EKS is a Managed Airport — AWS Runs the Control Tower, You Fly the Planes',
      tx: 'Running self-managed Kubernetes is like building your own airport from scratch — you construct the control tower (API server), install the radar system (etcd), hire air traffic controllers (scheduler, controller manager), and then ALSO fly planes. If the control tower has a hardware failure at 2am, you are paged. If the radar system loses data, you rebuild from backup tapes. Most companies should not be building airports — they should be flying planes (running workloads). EKS is the managed airport: AWS builds and maintains the control tower (multi-AZ, automatic failover, etcd backups, version upgrades). You bring your planes (containers) and pilots (kubectl, Argo CD). You still configure the runways (node groups, Karpenter), security checkpoints (RBAC, NetworkPolicy), and gates (Ingress, Services) — but the critical infrastructure that everything depends on is AWS\'s responsibility. You get paged for YOUR application problems, not for etcd disk pressure.',
      s: 'The most expensive EKS mistake is not setting resource requests on every container. Without requests, the scheduler places pods randomly — nodes get overcommitted, OOMKilled, and the K8s equivalent of a server crash takes down 10 services simultaneously. The second most expensive mistake: no PodDisruptionBudgets. During a managed node group upgrade, AWS will simultaneously drain multiple nodes — without PDBs, all replicas of every service can be evicted at once. Both mistakes are invisible until a maintenance window becomes a production outage.',
    },
    te: {
      def: 'Amazon EKS is a managed Kubernetes service that runs the Kubernetes control plane (API server, etcd, scheduler, controller manager) across multiple AZs with 99.95% SLA. AWS handles control plane upgrades, patching, and etcd backups. You interact with a standard Kubernetes API and manage only the data plane — EC2 node groups, Fargate profiles, or self-managed nodes. EKS integrates natively with IAM (IRSA), VPC networking (VPC CNI), load balancing (AWS Load Balancer Controller), and storage (EBS/EFS CSI drivers).',
      types: [
        {
          n: 'Managed Node Groups',
          d: 'AWS-managed EC2 ASGs running EKS-optimised AMIs. EKS handles node lifecycle: draining pods (respecting PDBs) before terminating, launching replacements, and registering with the cluster. Supports Bottlerocket OS (hardened, API-updateable, no SSH). Best for teams wanting EC2 control with reduced management overhead.',
        },
        {
          n: 'Fargate Profiles',
          d: 'Serverless pod execution — each pod runs on an isolated Firecracker micro-VM managed by AWS. No nodes to manage, no node group sizing. Pods matching the Fargate profile selector run serverless. Limitations: no DaemonSets, no stateful storage (EBS), no privileged containers. Best for variable workloads where node management overhead is undesirable.',
        },
        {
          n: 'Karpenter (Self-managed Node Provisioning)',
          d: 'Replaces Cluster Autoscaler with direct EC2 Fleet API provisioning. Provisions the right instance type for pending pod requirements in ~60 seconds. Supports Spot diversification, node consolidation (bin-packing), and drift-based AMI rotation. Most cost-efficient option for production EKS clusters at scale.',
        },
      ],
      when: 'Choose EKS when: investing in Kubernetes as a long-term platform (portability, ecosystem, talent pool), needing the K8s ecosystem (Argo CD, Istio, Prometheus Operator, Crossplane, KEDA), running polyglot microservices at scale where K8s primitives (Deployments, StatefulSets, Jobs, CronJobs, custom operators) map naturally to the workloads, or when multi-cloud strategy requires a portable container platform. Prefer ECS when team lacks K8s expertise and AWS-native integration is sufficient — K8s adds ~30-40% more operational surface area.',
      trade: 'EKS vs ECS: EKS provides portability (standard K8s API), richer ecosystem, and extensibility via CRDs — but adds operational complexity (RBAC, networking model, upgrade management). ECS is simpler, zero control-plane cost ($0.10/hr per EKS cluster), and integrates more deeply with native AWS services. EKS vs self-managed K8s: EKS eliminates the hardest K8s operation (running etcd HA) but costs $0.10/hr per cluster (~$72/month). Self-managed gives full control (custom API server flags, custom etcd tuning) at the cost of significant ops burden. Key EKS tradeoffs: VPC CNI requires careful CIDR planning (pods consume VPC IPs), IAM complexity with IRSA (one role per service account), K8s upgrade cadence (EKS supports N-2 versions — clusters must upgrade regularly or lose support).',
      code: `# EKS Production Setup — Terraform + Kubernetes Manifests

# --- Terraform: EKS Cluster + IRSA ---

resource "aws_eks_cluster" "main" {
  name     = "prod"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.30"

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true    # API server reachable within VPC
    endpoint_public_access  = false   # No public API endpoint in production
    security_group_ids      = [aws_security_group.eks_control_plane.id]
  }

  # Enable envelope encryption for Kubernetes secrets at rest
  encryption_config {
    provider { key_arn = aws_kms_key.eks.arn }
    resources = ["secrets"]
  }
}

# Managed node group — EKS handles AMI updates and node draining
resource "aws_eks_node_group" "general" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "general"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = var.private_subnet_ids
  instance_types  = ["m6i.xlarge", "m6a.xlarge", "m5.xlarge"]  # Spot diversity

  scaling_config {
    desired_size = 3
    min_size     = 3
    max_size     = 20
  }

  # Bottlerocket: hardened container OS, no SSH needed, A/B updates
  ami_type = "BOTTLEROCKET_x86_64"

  update_config {
    max_unavailable = 1  # Drain one node at a time during updates
  }
}

# IRSA: OIDC provider for the cluster
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# IAM role for a specific K8s ServiceAccount (IRSA pattern)
resource "aws_iam_role" "api_service" {
  name = "eks-prod-api-service"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.eks.arn }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          # Only allow the specific ServiceAccount in the specific namespace
          "\${aws_iam_openid_connect_provider.eks.url}:sub" = "system:serviceaccount:production:api-service"
          "\${aws_iam_openid_connect_provider.eks.url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

---
# Kubernetes: Production Deployment with all best practices

apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-service
  namespace: production
  annotations:
    # IRSA: pod assumes this IAM role via projected ServiceAccount token
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/eks-prod-api-service

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0   # Zero downtime — never reduce below desired
      maxSurge: 1         # One extra pod during rollout
  template:
    metadata:
      labels: { app: api }
    spec:
      serviceAccountName: api-service   # Binds IRSA role to pods

      # Spread pods across AZs — AZ failure only reduces capacity, not availability
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels: { app: api }

      containers:
        - name: api
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/api@sha256:abc123  # Digest pinning

          # Resource requests: used by scheduler for placement decisions
          # Resource limits: hard cap — OOMKilled if exceeded
          resources:
            requests: { cpu: "250m", memory: "256Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }

          readinessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3   # Remove from LB after 3 failures

          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 30   # Allow app to warm up
            periodSeconds: 10
            failureThreshold: 3   # Restart container after 3 failures

          # Graceful shutdown: SIGTERM → app closes connections → SIGKILL after 30s
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 5"]  # Wait for LB deregistration

      terminationGracePeriodSeconds: 30

---
# PodDisruptionBudget: prevents simultaneous eviction during node upgrades
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
  namespace: production
spec:
  minAvailable: 2   # Always keep at least 2 pods running
  selector:
    matchLabels: { app: api }

---
# HPA: scale based on CPU utilisation
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60`,
      rw: {
        ex: [
          'Airbnb — EKS with Karpenter for dynamic node provisioning across hundreds of microservices; Karpenter reduced Spot interruption impact by diversifying across 15+ instance families',
          'Robinhood — EKS for financial trading platform; IRSA used for fine-grained IAM access to DynamoDB per service',
          'Pinterest — EKS at scale with custom Karpenter NodePools per workload type (compute-optimised for image processing, memory-optimised for caching)',
          'Salesforce — EKS multi-cluster with Argo CD ApplicationSets for environment promotion (dev → staging → prod) across 50+ clusters',
          'NASDAQ — EKS for market data processing with strict PodDisruptionBudgets ensuring market hours availability during maintenance',
        ],
        cs: 'A mid-size SaaS company migrated 80 microservices from ECS to EKS. Key challenges: (1) VPC IP exhaustion — original VPC was /20 with /24 subnets per AZ. After enabling prefix delegation, went from 14 IPs per ENI to 256. Added secondary /16 CIDR for pod subnets. (2) No PodDisruptionBudgets — first managed node group upgrade evicted all replicas of 3 services simultaneously (Saturday 11pm). Added PDBs minAvailable: 2 across all Deployments. (3) IRSA misconfiguration — 40% of services were still using node IAM role for AWS API access (overly broad S3 + DynamoDB access from every node). Migrated to per-service IRSA roles. Result: security posture improved dramatically (blast radius of compromised pod reduced from "all S3 buckets" to "one table"). (4) Cost: replaced Cluster Autoscaler with Karpenter — node provisioning time dropped from 4 minutes to 55 seconds, and Spot consolidation saved 38% on compute costs.',
      },
    },
    interview: {
      q: 'Your EKS cluster is running 200 microservices. A new deployment caused a cascade failure — 40 services are returning 503. You have 5 minutes before the CEO calls. Walk me through your incident response.',
      a: 'First 60 seconds — stop the bleeding: identify the deployment that changed (kubectl get events --sort-by=.lastTimestamp -A, check Argo CD deployment history for last 30 minutes). Immediately run kubectl rollout undo deployment/<service-name> -n <namespace> for the changed service. If using Argo CD: sync the previous Git commit. Watch ALB metrics in CloudWatch — UnhealthyHostCount and RequestCount. Next 2 minutes — assess blast radius: kubectl get pods -A --field-selector=status.phase!=Running | head -50. Check kubectl top nodes for resource pressure (maybe OOM or CPU throttling cascaded). Look at ALB target group health per service (Console → EC2 → Target Groups → filter by unhealthy). Run kubectl describe pod <failing-pod> for a sample from each affected service — events section shows scheduling failures, image pull errors, probe failures. Check CloudWatch Logs for the service that changed: /aws/containerinsights/prod/application — look for connection refused errors to dependent services. Next 2 minutes — verify recovery: watch kubectl rollout status deployment/<service> --timeout=120s. ALB metrics should show HealthyHostCount climbing. Run smoke tests. Post-incident: understand why 40 services failed from one deployment — likely a shared dependency (database, cache, auth service). Implement deployment circuit breaker, canary rollout for critical services, and chaos testing for cascade failure scenarios.',
      fu: [
        'How does Karpenter decide which instance type to provision when a pod is pending? What happens if your NodePool excludes the optimal instance type?',
        'Explain prefix delegation in VPC CNI. Your subnets are /24 — how many pods can you run per node with prefix delegation on a c5.2xlarge?',
        'Your team wants to upgrade EKS from 1.28 to 1.30. Walk me through the upgrade sequence (control plane first or node groups? Why? What is the risk of skipping a version?)',
        'You have 50 services running on EKS across 3 clusters (dev/staging/prod). Describe your Argo CD multi-cluster GitOps structure and how you promote a release from dev to prod safely.',
        'A pod is running with the node IAM role permissions instead of IRSA. What is the security blast radius, and how do you migrate to IRSA without restarting production pods?',
        'Describe how you would implement a service mesh decision: App Mesh vs Istio vs Linkerd for 200 microservices. What are the operational tradeoffs?',
      ],
    },
  },

  {
    id: 'ecr',
    cat: 'cloud',
    color: '#ff9900',
    icon: 'ecr',
    title: 'Amazon ECR',
    tag: 'Private container registry with built-in security scanning and IAM integration',
    overview:
      'Amazon ECR (Elastic Container Registry) is AWS\'s fully-managed OCI-compatible container image registry. It is the secure home for every Docker image that runs in your AWS environment — whether on ECS, EKS, Lambda container images, or App Runner. ECR eliminates the operational overhead of running your own registry (no Harbor, no Nexus, no self-hosted Docker Registry to patch and operate). Key differentiators from Docker Hub: native IAM authentication (no passwords — use aws ecr get-login-password), no rate limiting on pulls within AWS (Docker Hub caps anonymous pulls at 100/6h), automatic image vulnerability scanning (basic: at push, enhanced: continuous via Amazon Inspector + Snyk database), cross-region and cross-account replication, and lifecycle policies that automatically garbage-collect stale images. Pricing: storage at $0.10/GB-month, data transfer free within the same region for ECS/EKS/Lambda. ECR is the canonical starting point for any AWS container workflow: build → push to ECR → ECS/EKS pulls → runs.',
    components: [
      {
        name: 'Repository',
        icon: 'repo',
        role: 'Logical container for versioned Docker images sharing a name — private by default, IAM-controlled',
        detail:
          'Logical container for a collection of Docker images sharing the same name (different tags = different versions). Repository naming: account-id.dkr.ecr.region.amazonaws.com/repo-name. Private repositories: IAM-controlled, default deny all. Public repositories (ECR Public / gallery.ecr.aws): publicly accessible, free egress, good for open-source base images. Repository policies: resource-based IAM policies for cross-account access. Mutable vs immutable tags: mutable (default — same tag can be overwritten, risky), immutable (tag cannot be overwritten — enforces deploy-time image digest pinning). Production best practice: immutable tags + pin deployments to image digest (sha256:...) not tag.',
      },
      {
        name: 'Authentication & Push/Pull Flow',
        icon: 'auth',
        role: 'IAM-based auth via temporary 12-hour tokens — no passwords to rotate, no Docker Hub rate limits',
        detail:
          'ECR uses IAM authentication — no username/password to rotate. Auth flow: aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin account.dkr.ecr.us-east-1.amazonaws.com. This generates a temporary token (valid 12 hours) from the ECR service using your IAM credentials. Push: docker tag my-app:v1.0 account.dkr.ecr.region.amazonaws.com/my-app:v1.0 → docker push — Docker pushes only the image layers that do not already exist in the repository (deduplicated by content hash). Pull from ECS/EKS: Task Execution Role / Node IAM Role automatically retrieves ECR auth — no manual login needed in production (IAM handles it). ECR pull-through cache: cache images from Docker Hub, Quay, GitHub GHCR — first pull fetches from upstream, subsequent pulls served from ECR cache (avoids Docker Hub rate limits).',
      },
      {
        name: 'Image Scanning',
        icon: 'scan',
        role: 'Basic scan-on-push for OS CVEs; Enhanced scanning via Amazon Inspector for continuous OS + language-level vulnerability detection',
        detail:
          'Basic scanning (free, scan-on-push): checks image layers against the CVE database (OS package vulnerabilities — uses Clair). Results available within minutes. Enhanced scanning (Amazon Inspector): continuous scanning — re-scans existing images when new CVEs are published (not just at push time). Scans both OS packages AND application dependencies (npm, pip, gem, Maven — language-level vulnerability detection). Integrates with Snyk database. Findings in Amazon Inspector console with severity (Critical/High/Medium/Low) and remediation guidance. EventBridge integration: trigger CI/CD gate when Critical CVE found — fail the build if the new image has critical vulnerabilities. Block deployment of images with critical CVEs using an admission controller (OPA Gatekeeper policy: deny pods with image URIs without a scan finding of COMPLETE with 0 critical).',
      },
      {
        name: 'Lifecycle Policies',
        icon: 'lifecycle',
        role: 'Automated rules to expire stale images by tag prefix, age, or count — controls storage costs',
        detail:
          'Automated rules for cleaning up stale images to control storage costs. Rule types: untagged images older than N days (expire stale build artifacts), tag-prefix rules (keep last N images tagged with "prod-", expire older ones), age-based rules (expire images older than 90 days). Policy evaluation: rules applied in priority order, first match wins. Example production policy: keep last 10 images tagged "prod-*", expire all untagged images older than 1 day (CI build artifacts), expire images tagged "dev-*" older than 7 days. DryRun first: test lifecycle policy before applying (returns what would be deleted without actually deleting). Production caution: never delete the currently deployed image — use immutable tags tied to deployment tracking to prevent accidental deletion of live images.',
      },
      {
        name: 'Cross-Region & Cross-Account Replication',
        icon: 'replication',
        role: 'Automatic asynchronous image replication to other regions or accounts — enables multi-region and CI/prod account separation',
        detail:
          'Registry-level replication: configure source registry to automatically replicate all push events to destination registries in other regions or accounts. Use cases: multi-region active-active deployments (images available in us-east-1 and eu-west-1 simultaneously), disaster recovery (replicate to DR region), CI account → prod account separation (build images in dev/ci account, replicate to prod account — prod account never has CI permissions). Replication is asynchronous (typically minutes). Filter rules: replicate only specific repositories or tag prefixes (do not replicate dev images to prod). Cross-account: source registry policy grants ecr:ReplicateImage to the destination account\'s ECR service principal.',
      },
      {
        name: 'VPC Endpoint for ECR',
        icon: 'endpoint',
        role: 'Route ECR pulls through VPC — eliminates NAT costs, keeps image traffic off public internet, required for private clusters',
        detail:
          'By default, ECS/EKS nodes pull images via public ECR endpoints (outbound HTTPS to ecr.region.amazonaws.com). Two VPC Interface Endpoints required for ECR: (1) com.amazonaws.region.ecr.api — for ECR API calls (GetAuthorizationToken, DescribeRepositories). (2) com.amazonaws.region.ecr.dkr — for image layer downloads. Plus: S3 Gateway Endpoint (image layers are stored in S3 — ECR uses S3 for layer storage; without S3 endpoint, layers route via NAT). Benefits of VPC endpoints: images never traverse public internet (security), eliminates NAT Gateway data processing charges (significant cost savings at scale — ECR via VPC endpoint is free within-region data transfer), lower latency. Required for private subnet EKS clusters with no NAT.',
      },
      {
        name: 'Image Immutability & Supply Chain Security',
        icon: 'security',
        role: 'Immutable tags prevent silent overwrites; cosign signing and SBOM attestation harden the software supply chain',
        detail:
          'Tag immutability: enables immutable image tags at repository level — overwriting an existing tag returns an error. This prevents the "latest" tag problem where a re-push changes what is deployed without a new deployment. Image signing with cosign (Sigstore): sign image after build (cosign sign --key awskms://... image-digest), verify signature before deployment via admission controller (Sigstore policy-controller or Kyverno). SBOM (Software Bill of Materials): generate and attest SBOM to image (cosign attest --type cyclonedx ...) — tracks all dependencies in the image for compliance. ECR supports OCI 1.1 referrers API for attaching signatures, SBOMs, scan results as OCI artifacts to the image. AWS Signer: alternative to cosign for AWS-native image signing workflow.',
      },
      {
        name: 'Integration with ECS, EKS, Lambda',
        icon: 'integration',
        role: 'Native integration with ECS Execution Role, EKS node/IRSA pull permissions, Lambda container images, and App Runner auto-deploy',
        detail:
          'ECS: task execution role needs ecr:GetAuthorizationToken + ecr:BatchGetImage + ecr:GetDownloadUrlForLayer. ECS agent handles auth and pull automatically. EKS: node IAM role (or IRSA for fine-grained control) needs same permissions. For private clusters: kubelet pulls via ECR VPC endpoint. Lambda container images: Lambda supports images up to 10GB from ECR — same permissions model. App Runner: integrates with ECR for automatic deployment on image push (ECR push event → App Runner deploys new revision). CodePipeline: ECR as source stage (push to ECR triggers pipeline). EventBridge: receive events on image push, scan completion, replication events — trigger CI/CD actions.',
      },
    ],
    howItWorks:
      'Full lifecycle: developer builds Docker image locally (or in CodeBuild CI) → docker push to ECR → ECR stores image layers in S3 (deduplicated, content-addressed), stores manifest in ECR metadata store → scan-on-push trigger → Inspector scans OS packages and app dependencies → scan results available via API → CI pipeline polls for SCAN_COMPLETE → if 0 critical CVEs, pipeline proceeds → ECS/EKS deployment triggered (task definition update / kubectl set image) → ECS agent / kubelet authenticates with ECR (IAM token, 12h validity) → pulls image layers from S3 via ECR VPC endpoint → container starts → running production traffic.',
    failures: [
      {
        name: 'GetAuthorizationToken Access Denied',
        cause: 'Task Execution Role or node IAM role missing ecr:GetAuthorizationToken — a common misconfiguration because this permission is account-level, not repository-level',
        symptom: 'ECS task stops with "CannotPullContainerError: authorization denied". EKS pod stuck in ImagePullBackOff with "unauthorized" in events.',
        fix: 'Add ecr:GetAuthorizationToken to the Execution Role or Node Role policy as a resource: "*" action (it cannot be scoped to a specific repository ARN). Separately, ecr:BatchGetImage and ecr:GetDownloadUrlForLayer can be scoped to specific repository ARNs. Verify using aws ecr get-login-password with the role credentials to confirm access.',
        severity: 'critical',
      },
      {
        name: 'Image Layers Available But Manifest 404',
        cause: 'Race condition: deployment triggered immediately after push, before ECR replication to another region completes',
        symptom: 'Pull succeeds in us-east-1 but fails in eu-west-1 with "manifest unknown" despite replication being configured',
        fix: 'Use immutable tags with digest pinning — wait for cross-region replication to complete before triggering multi-region deployments. Add a pipeline step that calls aws ecr describe-images in the target region to confirm replication before triggering deployment. EventBridge replication events can trigger the next pipeline stage automatically.',
        severity: 'high',
      },
      {
        name: 'ECR Lifecycle Policy Deletes Deployed Image',
        cause: 'Lifecycle policy expires the image tag currently running in production; container restart or new task launch fails to pull',
        symptom: 'ECS task fails to start on restart with "ImageNotFound" error. Service falls below desired count with no replacement tasks launching successfully.',
        fix: 'Enable immutable tags so deployed image digests are trackable. Tag running images with a "prod-active" tag and add a lifecycle policy exclusion for that prefix. Better: pin ECS task definitions and K8s Deployments to image digest (sha256:...) not tag — and exclude digests in use from lifecycle policy via tagging.',
        severity: 'critical',
      },
      {
        name: 'Docker Hub Rate Limit Blocking CI Builds',
        cause: 'CI runner public IPs shared with many teams hit Docker Hub anonymous pull rate limit (100 pulls per 6 hours per IP)',
        symptom: 'CI builds fail intermittently with "toomanyrequests: too many requests" on docker pull of base images (node:18, python:3.11, etc.)',
        fix: 'Configure ECR pull-through cache for Docker Hub (ECR Console → Pull-through cache → Create rule → Docker Hub). Update CI Dockerfile FROM lines to use ECR pull-through cache endpoint: aws_account_id.dkr.ecr.region.amazonaws.com/docker-hub/library/node:18. First pull fetches from Docker Hub; subsequent pulls served from ECR cache within the account — no rate limit.',
        severity: 'medium',
      },
    ],
    a: {
      v: 'ECR as Secure Warehouse',
      t: 'ECR is the Secure Warehouse Between Your Factory and Assembly Line',
      tx: 'Your software factory (CI/CD pipeline) produces finished goods (Docker images). Those goods need to be stored somewhere safe before they are shipped to the assembly line (ECS/EKS). You would not store production inventory in a public warehouse anyone can access. ECR is your private, climate-controlled warehouse on AWS premises: every item has a barcode (image digest), items are inspected for defects when they arrive (vulnerability scanning), old expired stock is automatically cleared out (lifecycle policies), and workers on the assembly line (ECS agents, kubelets) have company badges (IAM roles) that grant automatic access without any manual key exchange. The pull-through cache is like having a holding area at your dock for frequently-ordered external materials (Docker Hub images) — instead of ordering from the supplier every time, you keep a local copy that refreshes automatically.',
      s: 'The single biggest ECR production mistake: mutable tags in production. Using :latest or :v1.0 as a mutable tag means a docker push can silently change what is "deployed" — your ECS task restarts and suddenly runs different code with no deployment event. Always enable tag immutability and pin production deployments to the image digest (sha256:abc123...) captured at build time. Every deployment should be fully auditable: which commit, which image, which digest — immutable tags make this possible.',
    },
    te: {
      def: 'Amazon ECR is a fully managed, OCI-compatible container image registry integrated with AWS IAM, security scanning, and replication. It stores Docker images as OCI manifests and layer blobs (in S3). Authentication uses temporary IAM-issued tokens rather than static credentials. ECR integrates natively with ECS, EKS, Lambda, and CodePipeline — serving as the artifact store in every AWS container deployment pipeline.',
      types: [
        {
          n: 'Private Repository',
          d: 'Default repository type — IAM-controlled access, no public internet access without explicit permissions. Supports immutable tags, lifecycle policies, scan-on-push, and cross-account/cross-region replication. All production workloads use private repositories.',
        },
        {
          n: 'Public Repository (ECR Public)',
          d: 'Publicly accessible repositories hosted at gallery.ecr.aws. No authentication required for pulls. Free egress for images served from ECR Public to any AWS region. Use for open-source base images and publicly distributed container images. Not appropriate for proprietary application images.',
        },
        {
          n: 'Pull-Through Cache',
          d: 'ECR caches images from upstream public registries (Docker Hub, Quay, GitHub GHCR, Kubernetes registry). First pull fetches from upstream and caches in ECR; subsequent pulls served from ECR within the account. Eliminates Docker Hub rate limits in CI and prevents upstream registry outages from blocking builds.',
        },
      ],
      when: 'Use ECR for every Docker image running on AWS — it is the natural default when your workloads run on ECS/EKS/Lambda. The zero-friction IAM authentication (no passwords, automatic auth in ECS/EKS), no rate limiting on pulls within AWS, and native integration with CodePipeline and EventBridge make it the lowest-friction choice for AWS-native teams. Consider self-hosted Harbor only if you need: on-premises registry mirroring, multi-cloud registry federation, or advanced image distribution policies beyond ECR\'s feature set.',
      trade: 'ECR vs Docker Hub: ECR has no pull rate limits within AWS, IAM auth (no credential rotation), and native AWS integration — but no public image hosting for external consumers without ECR Public. ECR vs self-hosted Harbor: ECR is zero-ops (no registry infrastructure to run); Harbor provides richer replication policies, image proxying, and multi-cloud support but requires running and maintaining the Harbor cluster. ECR pricing: $0.10/GB-month storage — a typical registry with 100 services, 10 images each at 500MB = 500GB = $50/month. Lifecycle policies are essential to control costs. Enhanced scanning (Amazon Inspector): additional cost beyond basic scanning — evaluate based on compliance requirements.',
      code: `# ECR Repository with Terraform + GitHub Actions CI Pipeline

# --- Terraform ---

resource "aws_ecr_repository" "api" {
  name                 = "api"
  image_tag_mutability = "IMMUTABLE"   # Prevent overwriting tags — critical for auditability

  # Enable vulnerability scanning on every image push
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encrypt image layers at rest using KMS
  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr.arn
  }
}

# Lifecycle policy: automated garbage collection
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        # Rule 1: Keep last 10 production-tagged images
        rulePriority = 1
        description  = "Keep last 10 prod images"
        selection = {
          tagStatus      = "tagged"
          tagPrefixList  = ["prod-"]
          countType      = "imageCountMoreThan"
          countNumber    = 10
        }
        action = { type = "expire" }
      },
      {
        # Rule 2: Expire untagged images (CI build artifacts) after 1 day
        rulePriority = 2
        description  = "Expire untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = { type = "expire" }
      },
      {
        # Rule 3: Expire dev images after 7 days
        rulePriority = 3
        description  = "Expire dev images after 7 days"
        selection = {
          tagStatus      = "tagged"
          tagPrefixList  = ["dev-", "branch-"]
          countType      = "sinceImagePushed"
          countUnit      = "days"
          countNumber    = 7
        }
        action = { type = "expire" }
      }
    ]
  })
}

---
# GitHub Actions: Build → Push → Scan → Deploy

name: Build and Deploy

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: api

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # Required for OIDC auth to AWS
      contents: read

    steps:
      - uses: actions/checkout@v4

      # Authenticate to AWS using OIDC (no long-lived secrets)
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-ecr
          aws-region: \${{ env.AWS_REGION }}

      # Log in to ECR using IAM token (12h validity)
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # Build and push — tag with git SHA for traceability
      - name: Build and push image
        id: build
        env:
          REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t $REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          # Capture the image digest for pinning (not just the tag)
          DIGEST=$(aws ecr describe-images \
            --repository-name $ECR_REPOSITORY \
            --image-ids imageTag=$IMAGE_TAG \
            --query 'imageDetails[0].imageDigest' \
            --output text)
          echo "digest=$DIGEST" >> $GITHUB_OUTPUT
          echo "image=$REGISTRY/$ECR_REPOSITORY@$DIGEST" >> $GITHUB_OUTPUT

      # Wait for scan to complete and fail if critical CVEs found
      - name: Wait for ECR scan results
        run: |
          echo "Waiting for image scan to complete..."
          for i in $(seq 1 20); do
            STATUS=$(aws ecr describe-image-scan-findings \
              --repository-name $ECR_REPOSITORY \
              --image-id imageTag=$IMAGE_TAG \
              --query 'imageScanStatus.status' \
              --output text 2>/dev/null || echo "IN_PROGRESS")
            echo "Scan status: $STATUS (attempt $i)"
            if [ "$STATUS" = "COMPLETE" ]; then break; fi
            sleep 15
          done

          # Fail pipeline if any CRITICAL vulnerabilities found
          CRITICAL=$(aws ecr describe-image-scan-findings \
            --repository-name $ECR_REPOSITORY \
            --image-id imageTag=$IMAGE_TAG \
            --query 'imageScanFindings.findingSeverityCounts.CRITICAL' \
            --output text)

          if [ "$CRITICAL" != "None" ] && [ "$CRITICAL" -gt 0 ]; then
            echo "CRITICAL CVEs found: $CRITICAL — blocking deployment"
            exit 1
          fi
          echo "Scan passed: 0 critical CVEs"

      # Deploy to ECS using image digest (not tag) for full auditability
      - name: Deploy to ECS
        run: |
          # Update task definition to use the exact image digest
          TASK_DEF=$(aws ecs describe-task-definition \
            --task-definition api \
            --query 'taskDefinition' \
            --output json)

          NEW_TASK_DEF=$(echo $TASK_DEF | jq \
            --arg IMAGE "$IMAGE" \
            '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)')

          NEW_REVISION=$(aws ecs register-task-definition \
            --cli-input-json "$NEW_TASK_DEF" \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)

          aws ecs update-service \
            --cluster prod-cluster \
            --service api \
            --task-definition $NEW_REVISION \
            --force-new-deployment`,
      rw: {
        ex: [
          'Netflix — ECR for internal microservices, pull-through cache for public base images, lifecycle policies keep 3000+ repositories clean',
          'Stripe — ECR with immutable tags and digest pinning across all production deployments; full image provenance tracked per deployment',
          'Capital One — ECR enhanced scanning (Amazon Inspector) with automated pipeline blocking on critical CVEs; SOC 2 compliance evidence from scan reports',
          'Lyft — ECR cross-account replication from CI account to production accounts; prod account has zero CI tool access',
          'Twilio — ECR pull-through cache eliminated Docker Hub rate limit incidents that were blocking CI during peak engineering hours',
        ],
        cs: 'A healthcare SaaS company (HIPAA compliance) migrated from Docker Hub to ECR. Requirements: no images in public registries, audit trail for all image pulls, vulnerability scanning before production deployment. Implementation: (1) Private ECR repositories for all services — repository policies lock down to specific AWS accounts. (2) Immutable tags + digest pinning in all ECS task definitions. (3) Enhanced scanning (Inspector) enabled — pipeline gate blocks on Critical or High severity. (4) VPC endpoints for ECR (ecr.api + ecr.dkr + S3 gateway) — all image pulls stay within VPC, never traverse public internet. (5) CloudTrail logging captures every ecr:GetDownloadUrlForLayer call with principal, IP, and image digest — satisfies HIPAA audit requirements. (6) Cross-account replication from build account to production account — build credentials never exist in production. Result: zero public registry exposure, complete pull audit trail, 3-month scan backlog processed by Inspector in 48 hours with 12 critical CVEs found and remediated before production deployment.',
      },
    },
    interview: {
      q: 'You push a new image to ECR and 20 minutes later, your ECS service is returning 503. The image scanner found no critical CVEs. What do you investigate and how?',
      a: 'First: check ECS service events — aws ecs describe-services --cluster prod --services api --query "services[0].events[:10]". This shows deployment progress and any failure reasons. Check if deployment circuit breaker triggered and rolled back automatically (if it did, service should be recovering). Next: check ALB target group health — are there any healthy targets registered? If 0 healthy targets, the new tasks are starting but failing health checks before receiving traffic. Check stopped tasks: aws ecs list-tasks --cluster prod --service api --desired-status STOPPED, then aws ecs describe-tasks to get the stopped reason. Common reasons: Essential container exited (look at exit code — 1 is app crash, 137 is OOMKilled, 143 is SIGTERM). Pull CloudWatch Logs for the failing tasks: /ecs/prod/api — look for startup errors (database connection refused, missing environment variable, config parse error, port binding failure). Check if the image digest that was deployed matches what you pushed — rule out ECR lifecycle policy deleting the image. Check task definition: did secrets injection succeed? If Secrets Manager value changed or permission denied, task starts with missing env var and crashes. Check resource limits: if new image has higher memory usage (e.g., added a dependency), it might be hitting the container memory limit and OOMKilled on startup. Rollback if needed: aws ecs update-service --cluster prod --service api --task-definition api:<previous-revision> --force-new-deployment. Post-incident: add startup probe separate from readiness probe to distinguish "not ready yet" from "crashed". Enable deployment circuit breaker so next time it auto-rolls back within minutes.',
      fu: [
        'Your base image (node:20) has a new CVE published after your image was pushed. With basic scanning, you would not know. How do you set up continuous re-scanning and automated remediation workflow?',
        'Walk me through configuring ECR pull-through cache for Docker Hub including IAM permissions, Dockerfile changes, and what happens on the first vs subsequent pulls.',
        'You need to allow a third-party vendor to pull your ECR images without giving them an IAM user. How do you configure cross-account access?',
        'ECR Public vs Private — your open-source tool needs to be publicly distributed. Walk me through the tradeoffs and configuration of ECR Public.',
        'Your EKS cluster is in a private subnet with no NAT gateway. How many VPC endpoints do you need for ECR to work, and what does each one do?',
        'Describe how you would implement software supply chain security for ECR images: signing, SBOM attestation, and admission controller verification before pod scheduling.',
      ],
    },
  },
];
