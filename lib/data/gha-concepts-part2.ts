import { Concept } from '../types';

export const GHA_CONCEPTS_PART2: Concept[] = [
  {
    id: 'gha-deploy-ecs',
    cat: 'github-actions',
    color: '#2088ff',
    icon: '🚢',
    title: 'GitHub Actions: Deploy to AWS ECS',
    tag: 'Update a task definition with the new image, deploy to ECS Fargate — AWS handles the rollout',
    overview:
      'Deploying to Amazon ECS from GitHub Actions is the most common CD pattern for teams already using AWS. The workflow orchestrates a precise sequence: push a new container image to ECR, download the current ECS task definition JSON, inject the new image URI into the task definition, register it as a new task definition revision, update the ECS service to use the new revision, and wait for the rolling deployment to complete and stabilise. ECS handles the operational complexity of the rollout: it starts new tasks, waits for ALB health checks to pass, then drains and stops old tasks — achieving zero downtime. ECS Fargate eliminates EC2 management entirely; AWS provisions isolated Firecracker micro-VMs per task and you pay per vCPU/GB per second of task runtime. The deployment circuit breaker adds automatic rollback: if new tasks fail to reach a RUNNING state, ECS rolls back to the previous task definition revision without any manual intervention. GitHub Actions OIDC authentication eliminates long-lived AWS credentials — the workflow assumes an IAM role via federated identity and all AWS API calls use short-lived STS tokens scoped to that role.',
    components: [
      {
        name: 'ECS Task Definition',
        icon: 'task-def',
        role: 'Versioned JSON blueprint specifying container image, CPU/memory, environment, secrets, logs, and IAM roles',
        detail:
          'The task definition is an immutable, versioned JSON document that describes everything needed to run a container workload: the ECR image URI, CPU and memory allocation (hard limits on Fargate — defined size combinations such as 0.25–16 vCPU and 0.5–120 GB RAM), port mappings, environment variables, secrets injection via Secrets Manager ARN or SSM Parameter Store path (ECS pulls the secret value at task start time — the value is never stored in the task definition itself), a log configuration pointing to a CloudWatch Logs group with a stream prefix per task ID, a health check command (overrides Docker HEALTHCHECK), and two distinct IAM roles. Each deployment creates a new task definition revision — revision numbers are monotonically increasing integers. The previous revision is retained so ECS can roll back instantly. Containers within the same task definition share a network namespace (they communicate via localhost on different ports) and can share volumes.',
      },
      {
        name: 'ECS Service',
        icon: 'service',
        role: 'Maintains N running copies of a task definition and manages rolling deployments, ALB registration, and auto-scaling',
        detail:
          'The ECS service is the operational controller for a workload. Key parameters governing rolling updates: minimumHealthyPercent (default 100 — at least this fraction of desired task count must remain healthy during a deployment), and maximumPercent (default 200 — allows launching replacement tasks up to this percentage of desired count before stopping old ones). With minimumHealthyPercent: 100 and maximumPercent: 200, ECS starts new tasks first (up to 200% of desired count), waits for ALB health checks to pass on each new task, registers the new task in the ALB target group, then drains and stops old tasks — achieving zero downtime. Deployment circuit breaker: if new tasks fail to reach RUNNING state (OOMKilled, failed health check) after the maximumFailedTasks threshold, ECS automatically rolls back to the previous task definition revision. Service Auto Scaling via Application Auto Scaling adjusts desired count based on CloudWatch metrics (TargetTracking for CPU/memory, StepScaling for custom thresholds).',
      },
      {
        name: 'ECS Service Circuit Breaker',
        icon: 'circuit-breaker',
        role: 'Automatic rollback to the previous task definition revision when new tasks fail to become healthy',
        detail:
          'The ECS deployment circuit breaker monitors new tasks during a deployment. If new tasks crash on startup — due to OOMKill, a segfault, a misconfigured environment variable, or a failed health check — and the failure count exceeds the circuit breaker threshold, ECS marks the deployment as FAILED and automatically rolls back the service to the previous stable task definition revision. No manual intervention is required. The rollback is triggered by ECS starting the previous task definition revision\'s tasks, waiting for them to pass health checks, then deregistering the failed new tasks. You can observe circuit breaker activity in the ECS console deployment timeline or by subscribing to ECS EventBridge events (task state change events and service deployment state change events). Circuit breaker status is visible in the ECS service deployment details: IN_PROGRESS, COMPLETED, FAILED, or ROLLED_BACK.',
      },
      {
        name: 'Application Load Balancer Integration',
        icon: 'alb',
        role: 'ALB target group health checks gate traffic — new tasks receive traffic only after health checks pass, old tasks drain before stopping',
        detail:
          'The ECS service integrates natively with ALB. During a rolling update, the ECS service controller registers new task ENIs with the ALB target group as new tasks start. The ALB runs health checks against each new task (HTTP GET to the health check path, or TCP — configured on the target group, not the ECS service). Only after the health check succeeds (the required number of consecutive healthy responses) does the ALB begin routing production traffic to the new task. The old tasks are then deregistered with connection draining: the ALB stops sending new connections to the old tasks but keeps existing connections open for the deregistration delay period (default 300 seconds, often reduced to 30 seconds for low-latency APIs). After the drain period, ECS stops the old tasks. This sequence guarantees zero-downtime rolling deployments: there is always at least one healthy task registered in the ALB target group serving traffic throughout the rollout.',
      },
    ],
    howItWorks:
      'The GitHub Actions ECS deploy workflow executes a precise four-step sequence that threads through the AWS ECS data plane. Step 1 — Download the current task definition: the workflow runs `aws ecs describe-task-definition --task-definition <family> --query taskDefinition` and saves the output as task-definition.json. This JSON contains all fields of the current task definition revision — the image URI of the currently running container, CPU/memory, secrets references, log configuration, and IAM role ARNs. Step 2 — Inject the new image: the `aws-actions/amazon-ecs-render-task-definition` action reads task-definition.json, finds the container by name, replaces its image field with the new ECR URI (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:abc1234), and writes a new task-definition.json. It can also inject environment variables at this point. Step 3 — Register and deploy: `aws-actions/amazon-ecs-deploy-task-definition` calls `aws ecs register-task-definition` with the updated JSON, which creates a new revision (e.g. my-app-task:47). It then calls `aws ecs update-service` to set the service\'s task definition to the new revision and `force-new-deployment: true` to ensure new tasks are always started even if the task definition SHA is unchanged. Step 4 — Wait for stability: with `wait-for-service-stability: true`, the action polls `aws ecs describe-services` until the deployment reaches a COMPLETED state (all desired tasks running the new revision and passing health checks) or times out. ECS rolling update mechanics: with minimumHealthyPercent: 100 and maximumPercent: 200, ECS starts new tasks (up to double the desired count), waits for each new task\'s ALB health check to pass (the ALB returns 200 from the /health endpoint), registers the new task in the target group, then drains and stops an old task. This continues until all tasks run the new revision. IAM architecture: the GitHub Actions OIDC token is exchanged for an IAM role via STS AssumeRoleWithWebIdentity. That role needs ecs:RegisterTaskDefinition, ecs:UpdateService, ecs:DescribeServices, ecs:DescribeTasks, ecs:ListTasks, ecr:GetAuthorizationToken, and ecr:BatchGetImage. Inside ECS, two separate IAM roles operate: the Task Execution Role (used by the ECS agent — needs ECR pull and CloudWatch Logs write permissions) and the Task Role (assumed by the application code inside the container via the 169.254.170.2 credential endpoint — grant only the AWS API permissions the application itself needs: S3 read, DynamoDB write, SQS send, etc.). Never pass static AWS credentials as environment variables — always use the Task Role. Fargate provides VM-level isolation per task using Firecracker micro-VMs, eliminating noisy-neighbour issues at the kernel level and removing all EC2 patch management overhead.',
    decision: {
      choose: [
        'AWS-native teams that want simple, fully managed container orchestration without Kubernetes operational complexity',
        'Fargate workloads where you want zero EC2 management — AWS handles patching, right-sizing, and VM isolation',
        'Applications that fit the standard ECS rolling update model with ALB health checks for zero-downtime deployments',
        'Teams that want automatic rollback via the ECS deployment circuit breaker without writing rollback logic',
        'Workloads that need deep AWS integration: native ALB, Secrets Manager injection, CloudWatch Logs, ECS Exec for debugging, and Service Connect for east-west routing',
      ],
      avoid: [
        'Multi-cloud deployments that need portability — ECS is AWS-specific; Kubernetes manifests run on any cloud',
        'Workloads requiring advanced progressive delivery (canary, blue-green with traffic splitting) without CodeDeploy — ECS rolling update is binary with no traffic-weight control during rollout',
        'Teams that need the CNCF ecosystem: Argo Rollouts, Istio, Prometheus Operator, Karpenter — these are Kubernetes-native',
        'Batch workloads with complex DAG dependencies — AWS Batch or Step Functions are better fits',
        'Teams without AWS expertise who would benefit from a cloud-agnostic abstraction',
      ],
      vs: [
        {
          name: 'ECS Fargate vs ECS EC2',
          when: 'Fargate: no EC2 management, pay per task second, VM-level isolation per task — ideal for variable traffic and ops-light teams. EC2: use Spot Instances for 70–90% savings, support GPU instance types for ML inference, and support large-memory instances (>120 GB) — ideal for cost-optimised batch or GPU workloads.',
        },
        {
          name: 'ECS vs EKS',
          when: 'ECS: simpler, fewer abstractions, fully managed control plane, native AWS integration, faster time to production. EKS: full Kubernetes ecosystem, multi-cloud portability, advanced scheduling, CRDs and operators for extensibility — justified when teams already have Kubernetes expertise or need ecosystem tooling.',
        },
        {
          name: 'Rolling Update vs Blue-Green (CodeDeploy)',
          when: 'Rolling update: built-in, zero additional cost, automatically replaces tasks in-place — use for most deployments. Blue-green via CodeDeploy: two target groups, traffic shifted with canary/linear/all-at-once strategies, one-click rollback — use when you need controlled traffic shifting or need to run both versions in parallel for validation.',
        },
      ],
    },
    failures: [
      {
        name: 'ECS tasks OOMKilled immediately after deploy',
        cause: 'Memory limit in the task definition is too low for the new image — the container allocates more memory than the hard limit, and the kernel OOM killer terminates the process',
        symptom: 'New tasks transition from PROVISIONING to RUNNING to STOPPED with exit code 137 in rapid succession; ECS circuit breaker triggers and rolls back to the previous revision; CloudWatch Logs may show no application log output if the container OOMKills before writing logs',
        fix: 'Increase `memory` (hard limit) and set `memoryReservation` (soft limit) with at least 20–30% headroom above observed peak usage. Enable ECS Container Insights to get per-task memory metrics in CloudWatch. Use `aws ecs describe-tasks` to inspect the `containers[].reason` field which will state "OOMKilled". The circuit breaker auto-rolls back but the root cause must be fixed in the task definition before redeploying.',
        severity: 'critical',
      },
      {
        name: '`wait-for-service-stability` times out',
        cause: 'New tasks are starting but the deployment takes longer than the configured `wait-for-minutes` timeout — common causes: slow application startup (JVM warmup, cache loading), ALB health check thresholdCount too high, or health check path returning non-200 during startup',
        symptom: 'GitHub Actions step fails with "Error: Timeout waiting for service stability" but the ECS deployment may still succeed eventually; the workflow is marked failed but the application is fine',
        fix: 'Increase `wait-for-minutes` to allow for slow startup. Tune the ALB health check: reduce `HealthyThresholdCount` to 2, use `startPeriod` in the ECS health check to give the container grace time before probes begin. Check CloudWatch Logs at /ecs/<service-name> for application startup errors. Consider adding a `/health` endpoint that returns 200 immediately on startup (before full initialisation) and a separate `/ready` endpoint for full readiness.',
        severity: 'high',
      },
    ],
    a: {
      v: 'Ship Captain',
      t: 'Deploying to ECS is like a ship captain docking a new vessel',
      tx: 'The captain (GitHub Actions) prepares the new ship (task definition with new image), signals the harbour master (ECS service) to bring it in. The harbour master berths the new ship (starts new tasks), confirms passengers are boarding safely (ALB health checks pass), then sends the old ship to dry dock (drains and stops old tasks). If the new ship is taking on water (OOMKill or failed health checks), the harbour master waves it off and keeps the old ship running (circuit breaker rollback).',
      s: 'ECS rolling deploy: start new tasks → health check → register in ALB → drain old tasks → stop old tasks. Circuit breaker rolls back automatically on failure.',
    },
    te: {
      def: 'ECS rolling deployment driven by GitHub Actions OIDC: render a new task definition revision with the updated ECR image URI, update the ECS service, and poll for stability — ECS orchestrates the ALB-gated zero-downtime task replacement with automatic circuit breaker rollback.',
      types: [
        {
          n: 'Rolling Update (default)',
          d: 'ECS starts new tasks up to maximumPercent, waits for ALB health checks, registers in target group, drains and stops old tasks. minimumHealthyPercent: 100 ensures no capacity reduction during rollout. Zero downtime, no additional infrastructure cost.',
        },
        {
          n: 'Blue-Green (CodeDeploy)',
          d: 'Two ALB target groups (blue = live, green = new). CodeDeploy shifts traffic with canary (10% → 100%), linear (10% every N minutes), or all-at-once strategies. One-click rollback shifts all traffic back to blue. Requires CodeDeploy deployment group configuration alongside the ECS service.',
        },
        {
          n: 'Fargate Spot',
          d: 'Run Fargate tasks on spare AWS capacity at 70% discount. Two-minute interruption notice via SIGTERM. Combine with On-Demand capacity provider to maintain availability: Spot handles baseline load, On-Demand absorbs Spot interruptions. Not suitable for single-task stateful workloads.',
        },
      ],
      when: 'Use ECS Fargate rolling update for stateless API services, microservices, and web frontends that have an ALB health check endpoint. Use blue-green for regulated workloads requiring controlled traffic migration and instant rollback capability. Use ECS EC2 with Spot for batch processing and cost-sensitive background workloads.',
      trade: 'ECS rolling update is operationally simple but gives no traffic control during rollout — both old and new task versions serve traffic simultaneously during the transition window. Blue-green adds traffic control but doubles infrastructure cost during the deployment window and requires CodeDeploy configuration. The circuit breaker provides safety but has a detection lag — several new tasks may fail before rollback is triggered, potentially impacting a percentage of requests during the failure window.',
      code: `# .github/workflows/deploy-ecs.yml
name: Deploy to ECS

on:
  workflow_call:
    inputs:
      image_uri:
        required: true
        type: string
      environment:
        required: true
        type: string

env:
  AWS_REGION: us-east-1
  ECS_CLUSTER: my-cluster
  ECS_SERVICE: my-app-service
  TASK_DEFINITION: my-app-task
  CONTAINER_NAME: my-app

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: \${{ inputs.environment }}

    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-ecs-deploy
          aws-region: \${{ env.AWS_REGION }}

      # ── Download current task definition ──────────────
      - name: Download task definition
        run: |
          aws ecs describe-task-definition \\
            --task-definition \${{ env.TASK_DEFINITION }} \\
            --query taskDefinition \\
            > task-definition.json
          echo "Current task def downloaded"

      # ── Inject new image into task definition ─────────
      - name: Render new task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: \${{ env.CONTAINER_NAME }}
          image: \${{ inputs.image_uri }}
          environment-variables: |
            ENVIRONMENT=\${{ inputs.environment }}
            VERSION=\${{ github.sha }}

      # ── Register new task def revision & deploy ───────
      - name: Deploy to ECS service
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: \${{ steps.task-def.outputs.task-definition }}
          service: \${{ env.ECS_SERVICE }}
          cluster: \${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true      # wait until deployment is stable
          wait-for-minutes: 10                  # timeout
          force-new-deployment: true            # ensure new tasks always start

      # ── Verify deployment ─────────────────────────────
      - name: Verify running task image
        run: |
          RUNNING_IMAGE=$(aws ecs describe-tasks \\
            --cluster \${{ env.ECS_CLUSTER }} \\
            --tasks $(aws ecs list-tasks \\
              --cluster \${{ env.ECS_CLUSTER }} \\
              --service-name \${{ env.ECS_SERVICE }} \\
              --query 'taskArns[0]' --output text) \\
            --query 'tasks[0].containers[0].image' --output text)
          echo "Running image: $RUNNING_IMAGE"
          if [[ "$RUNNING_IMAGE" != "\${{ inputs.image_uri }}" ]]; then
            echo "Wrong image running!"
            exit 1
          fi
          echo "Correct image deployed"

# ── ECS Task Definition JSON structure ────────────────────
# {
#   "family": "my-app-task",
#   "networkMode": "awsvpc",
#   "requiresCompatibilities": ["FARGATE"],
#   "cpu": "512",
#   "memory": "1024",
#   "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
#   "taskRoleArn": "arn:aws:iam::ACCOUNT:role/my-app-task-role",
#   "containerDefinitions": [
#     {
#       "name": "my-app",
#       "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
#       "essential": true,
#       "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
#       "environment": [
#         { "name": "NODE_ENV", "value": "production" }
#       ],
#       "secrets": [
#         { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:db-password" }
#       ],
#       "logConfiguration": {
#         "logDriver": "awslogs",
#         "options": {
#           "awslogs-group": "/ecs/my-app",
#           "awslogs-region": "us-east-1",
#           "awslogs-stream-prefix": "ecs"
#         }
#       },
#       "healthCheck": {
#         "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
#         "interval": 30,
#         "timeout": 5,
#         "retries": 3,
#         "startPeriod": 60
#       }
#     }
#   ]
# }`,
      rw: {
        ex: [
          'Amazon.com — ECS powers many of Amazon\'s own internal microservices; Fargate eliminates the fleet of EC2 instances previously required to run the ECS agent',
          'Duolingo — migrated from EC2 to ECS Fargate for their backend services, reporting significant reduction in operational overhead and faster deployment cycles',
          'Samsung SmartThings — uses ECS with Fargate for IoT device management services, leveraging Fargate Spot capacity providers for cost optimisation on batch workloads',
          'Capital One — uses ECS extensively across multiple business units for containerised microservices, with strict IAM task roles enforcing least-privilege per service',
        ],
        cs: 'A fintech startup running a Node.js payments API on ECS Fargate with ALB. Deployments take 3–5 minutes: GitHub Actions renders the new task definition, deploys to ECS service, and waits for stability. The ECS circuit breaker has saved the team twice — once when a misconfigured environment variable caused immediate crashes, and once when a memory leak caused OOMKills within 60 seconds of startup. Both times, ECS rolled back automatically and the team had time to investigate CloudWatch Logs without a production incident. The task role grants only the specific DynamoDB tables and SQS queues the service uses — no wildcard permissions.',
      },
    },
    interview: {
      q: 'How does ECS rolling deployment achieve zero downtime, and what happens if the new container crashes on startup?',
      a: 'ECS rolling deployment achieves zero downtime through ALB-gated task replacement. With minimumHealthyPercent: 100 and maximumPercent: 200, ECS starts new tasks (up to double desired count), waits for the ALB health check to pass on each new task before routing any production traffic to it, then drains and stops old tasks one by one. There is always at least one healthy task in the ALB target group throughout the rollout. If a new container crashes on startup — OOMKilled, segfault, or failed health check — the ECS deployment circuit breaker detects the failures. After the failure threshold is exceeded, ECS automatically rolls back the service to the previous task definition revision: it starts tasks from the previous revision, waits for them to be healthy, and stops the failed new tasks. No manual intervention needed. You observe this via the ECS service deployment timeline or EventBridge events.',
      fu: [
        'What is the difference between the ECS Task Execution Role and the Task Role, and why do you need both?',
        'How would you implement a blue-green deployment on ECS instead of a rolling update?',
        'Walk me through how ECS Fargate provides isolation between tasks from different customers on the same underlying host.',
        'How do you inject database credentials into an ECS task without hardcoding them in the task definition or the Docker image?',
        'ECS service is stuck in a deployment with tasks continuously cycling between RUNNING and STOPPED — how do you diagnose and fix this?',
      ],
    },
  },

  {
    id: 'gha-deploy-eks',
    cat: 'github-actions',
    color: '#2088ff',
    icon: '☸️',
    title: 'GitHub Actions: Deploy to Amazon EKS',
    tag: 'Update the image in a Kubernetes Deployment — kubectl apply and the rolling rollout is automatic',
    overview:
      'Deploying to Amazon EKS from GitHub Actions involves authenticating kubectl to the cluster via AWS IAM and OIDC, then driving a Kubernetes rolling update by updating the container image in a Deployment. The key auth mechanism: GitHub Actions assumes an IAM role via OIDC, `aws eks update-kubeconfig` writes a kubeconfig with an exec plugin that calls `aws eks get-token` for each kubectl invocation — the returned token is a short-lived Kubernetes bearer token tied to the IAM identity. That IAM role must be mapped to a Kubernetes RBAC role in the cluster (via the `aws-auth` ConfigMap or the newer EKS Access Entries API). Kubernetes rolling update mechanics are then automatic: the Deployment controller creates a new ReplicaSet with the new image, scales it up one pod at a time (waiting for the readiness probe to pass on each new pod), then scales down the old ReplicaSet. Zero downtime by default with `maxUnavailable: 0` and `maxSurge: 1`. `kubectl rollout undo` reverts to the previous ReplicaSet instantly. Helm provides a higher-level abstraction: manages all Kubernetes resources for an application as a versioned release, supports `helm rollback`, and is GitOps-friendly. EKS gives access to the full CNCF ecosystem: Argo Rollouts for canary/blue-green, Karpenter for intelligent node provisioning, Prometheus Operator for observability, and External Secrets Operator for secret injection from AWS Secrets Manager.',
    components: [
      {
        name: 'kubeconfig Auth via OIDC',
        icon: 'auth',
        role: 'AWS OIDC → IAM role → EKS token → Kubernetes RBAC: federated authentication without long-lived credentials',
        detail:
          'GitHub Actions presents an OIDC JWT to AWS STS, which exchanges it for temporary IAM credentials (AssumeRoleWithWebIdentity). `aws eks update-kubeconfig --name <cluster> --region <region>` writes a kubeconfig with an `exec:` credential plugin entry that runs `aws eks get-token --cluster-name <cluster>` before each kubectl call. This command calls the EKS token endpoint and returns a short-lived Kubernetes bearer token (valid for 15 minutes) signed by the IAM role. EKS validates this token against the cluster\'s OIDC issuer and maps the IAM identity to a Kubernetes username and groups using one of two mechanisms: the legacy `aws-auth` ConfigMap in the `kube-system` namespace (a manually edited ConfigMap that maps IAM role ARNs to Kubernetes usernames/groups), or the newer EKS Access Entries API (managed via AWS API/console/Terraform, no ConfigMap editing required). The mapped Kubernetes identity is then subject to standard RBAC: a Role or ClusterRole must grant the necessary verbs (get, list, watch, update, patch) on the necessary resources (deployments, pods, replicasets) in the target namespace.',
      },
      {
        name: 'Kubernetes Rolling Update',
        icon: 'rollout',
        role: 'New ReplicaSet scales up pod-by-pod waiting for readiness probes; old ReplicaSet scales down simultaneously — zero downtime',
        detail:
          'The Deployment controller drives the rolling update when the pod template changes (image tag, environment variable, resource limits). It creates a new ReplicaSet with the updated pod template and runs the rollout per the strategy: `maxUnavailable: 0` means the replica count never drops below desired (zero capacity reduction), and `maxSurge: 1` means one extra pod above desired is allowed during the rollout (for a 3-replica Deployment: up to 4 pods total, always at least 3 ready). The controller scales the new ReplicaSet up by one pod, waits for the pod to pass its readiness probe (`httpGet` to /health, or `exec` or `tcpSocket`), then scales the old ReplicaSet down by one, and repeats. `minReadySeconds` adds a soak time: the pod must remain Ready for at least this many seconds before the controller considers it stable and proceeds. `kubectl rollout status deployment/my-app --timeout=300s` blocks and streams progress. The old ReplicaSet is retained (with 0 replicas) up to `revisionHistoryLimit` (default 10), enabling instant rollback.',
      },
      {
        name: 'kubectl set image vs kubectl apply',
        icon: 'kubectl',
        role: 'set image: fast one-liner that triggers a rolling update; apply: declarative, GitOps-friendly, applies the full manifest',
        detail:
          '`kubectl set image deployment/my-app my-app=<new-image> --namespace production` is the simplest way to trigger a rolling update — it patches the Deployment\'s pod template in-place without touching any YAML files. Fast to execute but not GitOps-friendly: after this command, the image tag in the Kubernetes cluster diverges from whatever is in the Git repository, breaking the GitOps principle that Git is the single source of truth. `kubectl apply -f k8s/deployment.yaml` applies the full manifest file — for this to work in a CD pipeline, the image tag in the YAML must be updated first (e.g. using `sed -i`, `yq`, `kustomize edit set image`, or `envsubst`). This keeps the manifest in Git updated and is the preferred pattern for GitOps workflows. Kustomize and Helm are purpose-built for this: Kustomize overlays swap the image tag without modifying the base manifest; Helm `--set image.tag=$SHA` overrides a values parameter at deploy time.',
      },
      {
        name: 'Helm',
        icon: 'helm',
        role: 'Kubernetes package manager — manages all resources for an app as a versioned release with upgrade, rollback, and diff',
        detail:
          'Helm packages Kubernetes manifests (Deployment, Service, Ingress, ConfigMap, HPA, PodDisruptionBudget, ServiceAccount, RBAC) into a chart — a versioned, templated directory. `helm upgrade --install my-app ./charts/my-app --set image.tag=$SHA --wait --atomic --timeout 5m` renders all templates with the provided values, applies them to the cluster, waits for all pods to become Ready, and — with `--atomic` — automatically rolls back the entire Helm release if the upgrade fails. `helm history my-app` shows all release revisions with timestamps and chart versions. `helm rollback my-app 3` restores the Kubernetes resources to exactly the state of revision 3 — all manifest changes, not just the image tag. The `helm diff upgrade` plugin (separate install) shows a diff of what will change before applying, enabling human review in CI. Helm is the standard for multi-resource applications and is the default packaging format for the CNCF ecosystem (Argo CD, Cert-manager, Prometheus Operator are all distributed as Helm charts).',
      },
    ],
    howItWorks:
      'The GitHub Actions EKS deploy workflow follows a clear sequence rooted in the Kubernetes reconciliation model. Authentication chain: the workflow triggers `aws-actions/configure-aws-credentials` with OIDC, which calls STS AssumeRoleWithWebIdentity using the GitHub OIDC JWT. The resulting temporary credentials belong to an IAM role — for example, `arn:aws:iam::123456789:role/github-actions-eks-deploy`. `aws eks update-kubeconfig --name my-eks-cluster --region us-east-1` writes a kubeconfig entry with an exec plugin: before every kubectl command, this plugin runs `aws eks get-token --cluster-name my-eks-cluster`, which calls the EKS token endpoint and returns a base64-encoded bearer token. EKS validates this token via the cluster\'s built-in OIDC-based IAM authenticator and maps the IAM role ARN to a Kubernetes username (e.g. `github-actions-deployer`) and groups. A ClusterRoleBinding or RoleBinding in the cluster grants that username the necessary RBAC verbs (patch deployments, get pods, watch replicasets) in the target namespace. Deployment execution (kubectl path): `kubectl set image deployment/my-app my-app=<new-image> --namespace production` patches the Deployment object in the Kubernetes API server. The Deployment controller detects the pod template change and begins a rolling update. It creates a new ReplicaSet with the updated image and scales it up one pod at a time. For each new pod: the kubelet on the selected node pulls the new image from ECR (using the node\'s EC2 IAM role or IRSA), starts the container, and begins running probes. The readiness probe (`httpGet: path: /health, port: 3000`) is checked every `periodSeconds` seconds. Only after the probe succeeds for the required consecutive count does the pod enter the Ready state. The Endpoints controller adds the pod\'s IP to the Service\'s EndpointSlice and kube-proxy updates iptables rules — production traffic flows to the new pod. The Deployment controller then scales the old ReplicaSet down by one and repeats the cycle. `kubectl rollout status deployment/my-app --namespace production --timeout=300s` blocks and returns success only when all desired replicas are running the new image and all readiness probes pass. On failure, `kubectl rollout undo deployment/my-app --namespace production` immediately patches the Deployment to point to the previous ReplicaSet (which is retained with 0 replicas), scaling it back up — rollback is near-instant since no new image pull is required. Helm path: `helm upgrade --install` renders all chart templates with the new image tag, calls `kubectl apply` equivalent for all resources, and monitors the Deployment rollout. `--atomic` triggers `helm rollback` automatically if the upgrade times out or fails. IAM for nodes and pods: EKS nodes use EC2 IAM roles for ECR image pulls. Application pods use IRSA (IAM Roles for Service Accounts): a Kubernetes ServiceAccount is annotated with an IAM role ARN, EKS\'s OIDC provider issues a projected token for the pod, and the AWS SDK in the container exchanges this token for IAM credentials — each pod gets fine-grained, pod-scoped AWS permissions with no shared credentials.',
    decision: {
      choose: [
        'Teams already invested in Kubernetes or the CNCF ecosystem who need the full power of Kubernetes scheduling, CRDs, operators, and extensibility',
        'Multi-cloud or hybrid deployments requiring portability — the same Kubernetes manifests run on EKS, GKE, AKS, or on-premises with minimal changes',
        'Workloads requiring advanced progressive delivery: Argo Rollouts for canary (route 5% of traffic to the new version, monitor error rate, promote or abort), blue-green with traffic splitting, and automated analysis based on Prometheus metrics',
        'Teams using GitOps with Argo CD or Flux — Kubernetes manifests in Git drive cluster state declaratively; GitHub Actions becomes just the image build and push pipeline',
        'Applications requiring complex resource management: GPU scheduling for ML inference, NUMA-aware placement, custom schedulers, or large heterogeneous workloads that benefit from Karpenter\'s intelligent node provisioning',
      ],
      avoid: [
        'Small teams with no Kubernetes experience — ECS is dramatically simpler to operate and gets you to production faster without etcd backup, RBAC management, node group upgrades, and CNI troubleshooting',
        'Simple single-service workloads where ECS Fargate or App Runner eliminates all infrastructure management at lower operational cost',
        'Teams that need only basic rolling deployments and are not using any other Kubernetes ecosystem tooling — the complexity is not justified',
        'Workloads that are entirely event-driven and serverless where Lambda, SQS, and EventBridge require zero cluster management',
        'Organizations without strong platform/DevOps capacity to maintain the cluster: upgrades, security patching, node group management, and observability infrastructure all require sustained investment',
      ],
      vs: [
        {
          name: 'EKS vs ECS',
          when: 'EKS: full Kubernetes ecosystem, multi-cloud portability, GitOps, Argo Rollouts, Istio, Karpenter — justified when Kubernetes expertise exists or ecosystem tooling is required. ECS: simpler, fully managed control plane, native AWS integration, faster time to production — choose when the team is AWS-only and does not need Kubernetes ecosystem features.',
        },
        {
          name: 'kubectl set image vs Helm',
          when: 'kubectl set image: fastest path for a single deployment, no templating setup required — use for simple workloads or one-off deploys. Helm: manages all resources (Deployment, Service, Ingress, HPA, RBAC) as a versioned release with history and rollback — use for any non-trivial application or when GitOps and declarative management are priorities.',
        },
        {
          name: 'Rolling Update vs Argo Rollouts',
          when: 'Rolling update (built-in): all-or-nothing pod replacement with no traffic control during rollout — suitable for most internal services. Argo Rollouts: canary (route N% of traffic to new version via NGINX/ALB weighted routing), blue-green, automated analysis via Prometheus/Datadog metrics, automated promotion or rollback — use for high-stakes user-facing services where gradual exposure and metric-based promotion are required.',
        },
      ],
    },
    failures: [
      {
        name: 'GitHub Actions IAM role not in aws-auth ConfigMap',
        cause: 'A new IAM role was created for GitHub Actions but was not added to the EKS cluster\'s aws-auth ConfigMap (or EKS Access Entries), so EKS does not recognise the identity and rejects all kubectl calls',
        symptom: '`error: You must be logged in to the server (Unauthorized)` on every kubectl command despite valid AWS credentials; `aws sts get-caller-identity` succeeds and shows the correct role ARN but `kubectl get pods` fails with 401',
        fix: 'Option 1 (legacy): `kubectl edit configmap aws-auth -n kube-system` and add the role ARN under `mapRoles` with a username and groups that have the necessary RBAC permissions. Option 2 (recommended): use the EKS Access Entries API — `aws eks create-access-entry --cluster-name <cluster> --principal-arn <role-arn>` followed by `aws eks associate-access-policy` to bind a managed policy (e.g. AmazonEKSDeployPolicy). Verify with `aws eks list-access-entries --cluster-name <cluster>`. Use Terraform or CDK to manage cluster access declaratively to prevent this from happening again.',
        severity: 'high',
      },
      {
        name: 'Pods stuck in CrashLoopBackOff during rolling update',
        cause: 'New image fails the readiness probe — the application crashes on startup, cannot connect to a dependency, or the health check path or port is incorrect; Kubernetes keeps restarting the container with exponential backoff',
        symptom: '`kubectl rollout status deployment/my-app` hangs indefinitely; `kubectl get pods -n production` shows new pods in CrashLoopBackOff state cycling between RUNNING and Error; the rolling update stalls because the new ReplicaSet never achieves the required Ready count',
        fix: 'Immediate relief: `kubectl rollout undo deployment/my-app --namespace production` — this instantly scales the previous ReplicaSet back up (no image pull needed) and routes traffic back to healthy old pods. Diagnose: `kubectl logs <crashed-pod> --previous` to see the last log output before crash; `kubectl describe pod <crashed-pod>` to see events including probe failure messages and exit codes; check that the readiness probe path (/health), port (3000), and initialDelaySeconds give the application enough time to start. Common causes: wrong container port in readiness probe, missing environment variable causing startup crash, cannot connect to database (wrong secret name or network policy blocking egress), or OOMKill (memory limits too low).',
        severity: 'critical',
      },
    ],
    a: {
      v: 'Traffic Controller at an Airport',
      t: 'Deploying to EKS is like a traffic controller managing runway transitions at a busy airport',
      tx: 'The controller (Kubernetes Deployment controller) manages an orderly handoff: new planes (pods with the new image) must successfully land and taxi to the gate (pass readiness probe) before old planes vacate their spots (old pods scale down). At no point does the runway go empty — maxUnavailable: 0 ensures at least the desired number of planes are always ready to depart (serve traffic). The kubectl command is the flight plan filed with the tower; the controller executes it autonomously. If a new plane cannot land safely (CrashLoopBackOff), `kubectl rollout undo` is the emergency diversion — the old planes stay at the gate.',
      s: 'EKS rolling deploy: OIDC auth → kubeconfig → kubectl set image → Deployment controller → new ReplicaSet → readiness probe → EndpointSlice update → scale down old ReplicaSet. `kubectl rollout undo` for instant revert.',
    },
    te: {
      def: 'EKS deployment driven by GitHub Actions OIDC: authenticate kubectl via aws eks update-kubeconfig, trigger a Kubernetes rolling update by patching the Deployment image, wait for rollout stability via kubectl rollout status, and roll back instantly with kubectl rollout undo or helm rollback on failure.',
      types: [
        {
          n: 'Rolling Update (built-in)',
          d: 'Default Kubernetes strategy. New ReplicaSet scales up pod-by-pod waiting for readiness probes; old ReplicaSet scales down simultaneously. maxUnavailable: 0, maxSurge: 1 for zero-downtime. Instant rollback via kubectl rollout undo restoring previous ReplicaSet.',
        },
        {
          n: 'Canary via Argo Rollouts',
          d: 'Argo Rollouts CRD replaces the Deployment. Traffic is split via NGINX/ALB weighted routing: start at 5% to new version, analyse Prometheus error rate, promote to 50%, analyse again, promote to 100%. Automated promotion or rollback based on metric thresholds. Zero-downtime with granular risk control.',
        },
        {
          n: 'Helm Release Upgrade',
          d: 'helm upgrade --install manages all Kubernetes resources as a versioned release. --atomic rolls back all resources automatically on timeout or failure. helm history shows full deployment history; helm rollback <release> <revision> restores all manifests to a prior state — not just the image tag.',
        },
      ],
      when: 'Use EKS for workloads requiring Kubernetes ecosystem tooling, multi-cloud portability, or complex scheduling. Use rolling update for standard stateless services. Use Argo Rollouts for high-stakes user-facing services where gradual traffic exposure and metric-based promotion reduce deployment risk. Use Helm for any multi-resource application where version history and atomic rollback across all resources is required.',
      trade: 'EKS introduces significant operational complexity vs ECS: cluster control plane upgrades, node group management, CNI configuration, RBAC management, and etcd backup are all responsibilities that ECS abstracts away. The Kubernetes rolling update is zero-downtime by default but provides no traffic control during rollout — both old and new pod versions serve traffic simultaneously during the transition. Argo Rollouts adds traffic control but requires additional cluster components and expertise. IRSA provides excellent pod-level IAM isolation but requires annotation of every ServiceAccount and IAM role ARN management per workload.',
      code: `# .github/workflows/deploy-eks.yml
name: Deploy to EKS

on:
  workflow_call:
    inputs:
      image_uri:
        required: true
        type: string
      environment:
        required: true
        type: string

env:
  AWS_REGION: us-east-1
  EKS_CLUSTER: my-eks-cluster
  NAMESPACE: production
  DEPLOYMENT: my-app

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: \${{ inputs.environment }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-eks-deploy
          aws-region: \${{ env.AWS_REGION }}

      # ── Install kubectl ───────────────────────────────
      - name: Install kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.29.0'

      # ── Configure kubeconfig ──────────────────────────
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig \\
            --name \${{ env.EKS_CLUSTER }} \\
            --region \${{ env.AWS_REGION }}

      # ── Option A: kubectl set image (simple) ──────────
      - name: Update deployment image
        run: |
          kubectl set image deployment/\${{ env.DEPLOYMENT }} \\
            \${{ env.DEPLOYMENT }}=\${{ inputs.image_uri }} \\
            --namespace \${{ env.NAMESPACE }}

      # ── Wait for rollout ──────────────────────────────
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/\${{ env.DEPLOYMENT }} \\
            --namespace \${{ env.NAMESPACE }} \\
            --timeout=300s

      # ── Verify ────────────────────────────────────────
      - name: Verify deployment
        run: |
          kubectl get pods -n \${{ env.NAMESPACE }} -l app=\${{ env.DEPLOYMENT }}
          ACTUAL=$(kubectl get deployment \${{ env.DEPLOYMENT }} \\
            -n \${{ env.NAMESPACE }} \\
            -o jsonpath='{.spec.template.spec.containers[0].image}')
          echo "Running image: $ACTUAL"

      # ── Rollback on failure ───────────────────────────
      - name: Rollback on failure
        if: failure()
        run: |
          echo "Deployment failed — rolling back"
          kubectl rollout undo deployment/\${{ env.DEPLOYMENT }} \\
            --namespace \${{ env.NAMESPACE }}
          kubectl rollout status deployment/\${{ env.DEPLOYMENT }} \\
            --namespace \${{ env.NAMESPACE }}

# ── Kubernetes Deployment manifest ────────────────────────
# apiVersion: apps/v1
# kind: Deployment
# metadata:
#   name: my-app
#   namespace: production
#   labels:
#     app: my-app
# spec:
#   replicas: 3
#   selector:
#     matchLabels:
#       app: my-app
#   strategy:
#     type: RollingUpdate
#     rollingUpdate:
#       maxUnavailable: 0     # never go below desired replica count
#       maxSurge: 1           # allow 1 extra pod during rollout
#   minReadySeconds: 10       # pod must be ready for 10s before considered stable
#   template:
#     metadata:
#       labels:
#         app: my-app
#     spec:
#       containers:
#         - name: my-app
#           image: ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-app:latest
#           ports:
#             - containerPort: 3000
#           resources:
#             requests:
#               cpu: "250m"
#               memory: "256Mi"
#             limits:
#               cpu: "500m"
#               memory: "512Mi"
#           readinessProbe:
#             httpGet:
#               path: /health
#               port: 3000
#             initialDelaySeconds: 10
#             periodSeconds: 5
#             failureThreshold: 3
#           livenessProbe:
#             httpGet:
#               path: /health
#               port: 3000
#             initialDelaySeconds: 30
#             periodSeconds: 10
#             failureThreshold: 3
#           env:
#             - name: NODE_ENV
#               value: "production"
#             - name: DB_PASSWORD
#               valueFrom:
#                 secretKeyRef:
#                   name: app-secrets
#                   key: db-password

# ── Helm upgrade command (alternative to kubectl set image)
# - name: Deploy with Helm
#   run: |
#     helm upgrade --install my-app ./charts/my-app \\
#       --namespace \${{ env.NAMESPACE }} \\
#       --create-namespace \\
#       --set image.repository=$(echo \${{ inputs.image_uri }} | cut -d: -f1) \\
#       --set image.tag=$(echo \${{ inputs.image_uri }} | cut -d: -f2) \\
#       --set environment=\${{ inputs.environment }} \\
#       --wait \\
#       --timeout 5m \\
#       --atomic        # rollback automatically on failure`,
      rw: {
        ex: [
          'Airbnb — runs thousands of microservices on Kubernetes (self-managed then migrated to EKS); their CD platform deploys via kubectl and Helm with sophisticated canary analysis using internal traffic shadowing',
          'Robinhood — uses EKS for financial trading services with strict RBAC and IRSA for per-service AWS permissions; GitHub Actions drives image builds and Argo CD drives cluster deployments from Git',
          'Datadog — runs EKS at scale for their own infrastructure; publishes the Datadog Operator as a Helm chart and uses Kubernetes rolling updates for their agent deployments',
          'Shopify — uses Kubernetes extensively; their shop serving infrastructure uses Argo Rollouts for canary deployments with automated metric-based promotion during high-traffic sale events like BFCM',
        ],
        cs: 'A SaaS company runs their API platform (15 microservices) on EKS with GitHub Actions CD. Each service has a Helm chart. The deploy workflow: configure AWS OIDC credentials, update kubeconfig, run `helm upgrade --install` with the new image tag and `--atomic --timeout 5m`. Argo CD watches the Helm values files in Git for the production environment and syncs automatically — GitHub Actions only updates the image tag in the values file and commits, Argo CD does the actual apply. Two services use Argo Rollouts for canary: the payment processing service routes 5% of traffic to new versions for 10 minutes and checks the Prometheus `payment_errors_total` rate before promoting. One incident: a pod OOMKilled during rollout — `kubectl rollout undo` took 8 seconds to restore the previous ReplicaSet; Argo Rollouts automatically aborted the canary and reverted traffic weights.',
      },
    },
    interview: {
      q: 'Compare deploying to ECS vs EKS — when would you choose each?',
      a: 'ECS is the right choice when the team is AWS-native, has no existing Kubernetes expertise, and the workload does not require Kubernetes ecosystem tooling. ECS has zero control plane operational overhead (AWS manages etcd, kube-apiserver, scheduler), native ALB/Secrets Manager/CloudWatch integration, and the deployment circuit breaker provides automatic rollback out of the box. The GitHub Actions workflow is straightforward: render task definition, deploy, wait for stability. EKS is the right choice when you need multi-cloud portability (the same manifests run on GKE or AKS), the CNCF ecosystem (Argo Rollouts for canary, Argo CD for GitOps, Istio for service mesh, Prometheus Operator for observability), complex scheduling (GPU, NUMA-aware), or CRDs and operators for custom resource management. The operational investment in EKS — cluster upgrades, node group management, RBAC, CNI — is justified when these capabilities are actively used. For a startup with one to ten services and an AWS-native team, ECS. For a mature platform team running fifty-plus services needing progressive delivery and GitOps, EKS.',
      fu: [
        'How does IRSA (IAM Roles for Service Accounts) work in EKS, and how does it differ from the EC2 node IAM role approach?',
        'A kubectl rollout status command is hanging indefinitely — walk me through how you diagnose whether the issue is the application, the readiness probe, the cluster nodes, or the network.',
        'How would you implement a canary deployment on EKS that automatically rolls back if the error rate exceeds 1% based on Prometheus metrics?',
        'Explain how the EKS aws-auth ConfigMap works and why the EKS Access Entries API is the preferred modern alternative.',
        'How do you handle Kubernetes secrets for database credentials — what are the risks of storing base64-encoded secrets in etcd and what are the alternatives?',
      ],
    },
  },
];
