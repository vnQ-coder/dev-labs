import { Concept } from '../types';

export const CONCEPTS_KUBERNETES: Concept[] = [
  {
    id: 'kubernetes',
    cat: 'cloud',
    color: '#326ce5',
    icon: 'kubernetes',
    title: 'Kubernetes',
    tag: 'Production-grade container orchestration at scale',
    overview:
      'Kubernetes (K8s) is an open-source container orchestration platform originally built by Google (based on their internal Borg system) and donated to the CNCF in 2014. It solves the operational problem of running containers at scale: how do you schedule workloads across a fleet of machines, recover from failures, roll out updates without downtime, scale based on demand, and manage configuration and secrets — all declaratively? K8s answers all of these through its reconciliation loop: you declare desired state in YAML, Kubernetes continuously compares desired vs actual state, and controllers reconcile any drift automatically. Every major cloud provider offers a managed control plane (EKS, GKE, AKS), making Kubernetes the de-facto standard for production container workloads globally.',
    components: [
      {
        name: 'API Server (kube-apiserver)',
        icon: 'api-server',
        role: 'Central hub — all control plane and kubelet communication goes through it',
        detail:
          'The API server is the only Kubernetes component that reads from and writes to etcd, making it the single stateful gateway for all cluster state. It exposes a RESTful HTTPS API where every Kubernetes resource (Pods, Deployments, Services, etc.) is addressable as a REST endpoint. Authentication is handled via multiple strategies simultaneously: ServiceAccount JWTs (for in-cluster workloads), client certificates (for node kubelets and admin users), and OIDC tokens (for SSO integration with Okta, Dex, or cloud IAM). Authorization runs next via RBAC — every request is checked against Role/ClusterRole and RoleBinding/ClusterRoleBinding objects before proceeding. Admission controllers form the final gate: MutatingAdmissionWebhooks run first and can modify the request (Istio injects Envoy sidecar containers here; cert-manager adds annotations; Kyverno can set default labels), then ValidatingAdmissionWebhooks reject requests that violate policy (OPA/Gatekeeper, Kyverno, Pod Security Admission). The API server is horizontally scalable — large clusters run 3+ replicas behind a load balancer. Every kubectl command is ultimately an HTTPS call to the API server, and write requests follow a strict pipeline: deserialization → validation → admission → persistence to etcd → return 201 Created to the client.',
      },
      {
        name: 'etcd',
        icon: 'etcd',
        role: 'Distributed key-value store — the single source of truth for all cluster state',
        detail:
          'etcd is a strongly-consistent distributed key-value store that implements the Raft consensus algorithm for leader election and write quorum. Every Kubernetes object — Pods, Deployments, Services, ConfigMaps, Secrets, RBAC rules — is serialised to protobuf and stored in etcd. Only kube-apiserver talks to etcd directly; no other Kubernetes component has a direct etcd connection, which ensures all state mutations go through the API server\'s authentication, authorisation, and admission pipeline. In production, etcd is deployed as a 3 or 5-node cluster for high availability — a 3-node cluster tolerates 1 node failure ((n-1)/2), a 5-node cluster tolerates 2. Snapshot backups are absolutely critical: losing all etcd data means losing all cluster state, and there is no way to recover without a backup. Disk performance is etcd\'s primary bottleneck — the Raft algorithm requires fsyncing every log entry before acknowledging a write, so etcd demands at least 3000 sustained IOPS; use SSD or NVMe-backed volumes and never run etcd on shared network storage. The watch mechanism is etcd\'s most important performance feature: clients (apiserver) subscribe to key-prefix changes and receive push notifications rather than polling, enabling efficient real-time sync of resource state across all controllers. Keys follow the format /registry/{group}/{resource}/{namespace}/{name} — for example, /registry/apps/deployments/default/my-app.',
      },
      {
        name: 'kube-scheduler',
        icon: 'scheduler',
        role: 'Assigns unscheduled pods to nodes based on resource requirements and constraints',
        detail:
          'The scheduler watches for pods with an empty spec.nodeName field and runs them through a two-phase scheduling cycle: filter then score. The filter phase eliminates nodes that cannot satisfy the pod\'s constraints: nodes without sufficient allocatable CPU and memory (comparing pod resource requests against node allocatable), nodes that don\'t match nodeSelector labels or nodeAffinity rules, nodes where podAntiAffinity rules would be violated, nodes with taints the pod doesn\'t tolerate, and nodes in topology zones where volume constraints cannot be satisfied. The score phase ranks the surviving nodes using weighted plugin scores: LeastRequestedPriority (prefer nodes with more free resources), BalancedResourceAllocation (prefer nodes where CPU and memory utilisation is balanced rather than skewed), and InterPodAffinity (prefer nodes near pods with matching labels). The scheduler then patches the pod object\'s spec.nodeName to the winning node, which triggers the kubelet on that node to begin pod creation. Preemption handles the case where no node can fit a pod: the scheduler will evict lower-priority pods from a candidate node to make room, controlled by PriorityClass objects (values 0 to 1,000,000,000 — system-node-critical at 2,000,001,000 for DNS and CNI). Pod topology spread constraints are the modern way to ensure pods spread across availability zones without using complex anti-affinity rules. The default scheduler is extensible via scheduling framework plugins and can be replaced with custom schedulers for specialised workloads (GPU-aware bin-packing, NUMA-aware placement); multiple schedulers can coexist in a single cluster, with pods selecting their scheduler via schedulerName.',
      },
      {
        name: 'Controller Manager (kube-controller-manager)',
        icon: 'controller',
        role: 'Runs all built-in controllers that drive cluster state toward desired state',
        detail:
          'The controller manager is a single binary that runs dozens of independent controllers in separate goroutines, each implementing the same fundamental reconciliation loop: watch the API server for resource changes, compare current state to desired state, and take corrective action to close the gap. This watch-compare-act pattern, sometimes called the operator pattern, is the core abstraction of Kubernetes. The ReplicaSet controller watches ReplicaSet objects and ensures the exact number of pod replicas specified are running — if a pod is deleted, the controller immediately creates a replacement. The Deployment controller manages the rollout lifecycle by creating a new ReplicaSet with the updated pod template, scaling it up while scaling down the old ReplicaSet, and respecting maxSurge (how many extra pods can exist) and maxUnavailable (how many pods can be down) during the transition. The Node controller monitors node health and, after a node becomes unreachable (40 seconds to mark NotReady, 5 minutes with taint-based eviction), taints the node and evicts its pods so they can be rescheduled elsewhere. Other critical controllers: the ServiceAccount controller creates default service accounts in new namespaces, the Endpoints controller populates EndpointSlice objects with the IPs of ready pods backing a Service, the Job controller runs pods to completion and retries on failure, and the CronJob controller creates Jobs on a cron schedule. In cloud environments, cloud-specific logic (provisioning LoadBalancer Services, assigning node external IPs, detaching volumes from terminated nodes) runs in the Cloud Controller Manager — a separate process that integrates with the cloud provider API.',
      },
      {
        name: 'kubelet',
        icon: 'kubelet',
        role: 'Node agent — executes pod specs and reports node/pod status to control plane',
        detail:
          'The kubelet is the primary node agent, running on every node in the cluster including control plane nodes. It watches the API server for PodSpec objects assigned to its node (via spec.nodeName) and is responsible for making the container runtime create and maintain those containers. The kubelet communicates with the container runtime (containerd, CRI-O) via the Container Runtime Interface (CRI), a gRPC API that decouples Kubernetes from specific runtimes. For each pod, the kubelet orchestrates the complete lifecycle: pulling the container image if not cached, creating the sandbox network namespace, creating and starting containers in the correct order (init containers first, sequentially; then app containers in parallel), and then running health probes. Liveness probes detect containers that are alive but broken (deadlocked, corrupted internal state) and kill them so Kubernetes can restart them — after failureThreshold consecutive failures. Readiness probes detect containers that are not yet ready to serve traffic (still warming caches, connecting to dependencies) and temporarily remove the pod from the Service\'s EndpointSlice without restarting it. The startup probe is designed for slow-starting legacy applications: it disables the liveness probe until the startup probe first succeeds, preventing premature restarts during a long initialisation phase. The kubelet also continuously collects CPU and memory usage statistics for containers and exposes them to the metrics-server, which the Horizontal Pod Autoscaler queries for scaling decisions. Volume mounting and unmounting is also kubelet\'s responsibility, coordinating with the CSI driver to attach block devices and mount filesystems before container start.',
      },
      {
        name: 'Pod',
        icon: 'pod',
        role: 'Smallest deployable unit — one or more tightly-coupled containers sharing network and storage',
        detail:
          'A pod is not just a container — it is a group of containers that are always co-located, co-scheduled, and share a set of Linux namespaces. All containers in a pod share the same network namespace (meaning they all have the same IP address and communicate with each other via localhost on different ports), the same IPC namespace (they can use POSIX message queues and shared memory), and optionally the same PID namespace (containers can see each other\'s processes). This design is intentional: the sidecar pattern places a helper process (Envoy proxy for Istio, Fluentbit for log shipping, Vault agent for secrets rotation) alongside the main application container where tight coupling and low-latency local communication is needed. Init containers are a powerful mechanism for sequencing startup: they run to completion in order before any app container starts, making them ideal for database migration runners, configuration generators, or dependency waiters (wait for a Service to be resolvable before starting the app). Each pod gets its own unique IP address within the cluster — in AWS EKS with the VPC CNI plugin, this is a real VPC IP address from the node\'s subnet, enabling pods to be directly addressed from within the VPC without NAT. Pods are deliberately ephemeral: you should never exec into a running pod to make changes, as the next restart will discard them. All mutation must go through the pod\'s controller (Deployment, StatefulSet). PodAntiAffinity with topologyKey: topology.kubernetes.io/zone ensures replicas are distributed across availability zones, preventing a full outage during an AZ failure.',
      },
      {
        name: 'Deployment',
        icon: 'deployment',
        role: 'Declarative manager for stateless workloads — handles rollouts, rollbacks, scaling',
        detail:
          'A Deployment is the standard way to run stateless applications in Kubernetes. It manages a set of ReplicaSets, with at most one ReplicaSet active at any time during steady state. When you update the pod template (change the image tag, add an env var), the Deployment controller creates a new ReplicaSet with the updated template and performs a rolling update: it gradually scales up the new ReplicaSet and scales down the old one, controlled by maxSurge (extra pods above desired, default 25%) and maxUnavailable (pods below desired allowed during update, default 25%). This means a 10-replica Deployment by default will never have fewer than 8 running or more than 12 total during a rollout. Rollbacks are instant: kubectl rollout undo deployment/name switches traffic back to the previous ReplicaSet (which was kept alive with 0 replicas, up to revisionHistoryLimit). You can pause a rollout mid-way for canary validation (kubectl rollout pause) and resume or undo based on metrics. The ownership chain — Deployment owns ReplicaSet, ReplicaSet owns Pod — is expressed via ownerReferences on each object, enabling garbage collection: delete the Deployment and all its ReplicaSets and Pods are automatically deleted. For stateful workloads (databases, Kafka, ZooKeeper), StatefulSet provides stable network identities (pod-0, pod-1), stable persistent storage (one PVC per pod, not shared), and ordered startup/shutdown guarantees. DaemonSets ensure exactly one pod runs on every node (or a subset via nodeSelector) — used for node exporters, CNI plugins, log collectors, and security agents.',
      },
      {
        name: 'Service & Ingress',
        icon: 'service',
        role: 'Stable network endpoint for pods; Ingress routes external HTTP/S traffic',
        detail:
          'Services solve the fundamental problem of pod ephemerality: pods come and go, but a Service provides a stable virtual IP (ClusterIP) and DNS name that always routes to healthy pods. Kubernetes DNS (CoreDNS) resolves service names automatically: a Service named my-api in the default namespace is reachable at my-api.default.svc.cluster.local from anywhere in the cluster. There are four Service types: ClusterIP (internal only, the default and most common), NodePort (opens a port in the 30000-32767 range on every node — useful for on-premises or when an external LB isn\'t available), LoadBalancer (provisions a cloud load balancer automatically — an AWS NLB in EKS via the AWS Load Balancer Controller), and ExternalName (creates a CNAME DNS alias to an external service — useful for routing to RDS or external APIs through K8s DNS). kube-proxy, running on every node, implements Service routing by installing iptables rules (or IPVS rules in IPVS mode, which is more scalable for large clusters with thousands of Services) that DNAT traffic destined for the ClusterIP to a randomly selected healthy pod IP. The Endpoints controller watches for pods matching a Service\'s selector and becoming Ready, then populates the EndpointSlice with their IPs — kube-proxy watches EndpointSlice updates and rewrites iptables rules accordingly. Ingress is a K8s API object that defines L7 HTTP/S routing rules (route traffic for host api.example.com/v1 to service api-service on port 80) — the actual routing is implemented by an Ingress controller (nginx-ingress, AWS ALB Ingress Controller, Traefik, Istio Gateway) which watches Ingress objects and configures itself. The AWS ALB Ingress Controller creates one Application Load Balancer per Ingress object and maps Ingress path rules to ALB listener rules and target groups — enabling SSL termination, WAF integration, and advanced routing at the load balancer tier.',
      },
      {
        name: 'ConfigMap & Secret',
        icon: 'config',
        role: 'Decouple configuration from container images',
        detail:
          'ConfigMaps store arbitrary non-sensitive configuration data as key-value pairs (up to 1 MB total), providing a clean separation between the immutable container image and the environment-specific configuration. They can be consumed by pods in three ways: as environment variables (valueFrom.configMapKeyRef for individual keys, envFrom.configMapRef for all keys at once), as command-line arguments (via env var substitution in the command field), or as mounted files (each key becomes a file at the mount path, enabling complex config files like nginx.conf or prometheus.yml to be managed as Kubernetes objects). Importantly, changes to a ConfigMap mounted as a volume propagate to running pods after the kubelet\'s sync interval (default ~60 seconds), without a pod restart — though the application must re-read the file to pick up the change. Secrets work the same way but are intended for sensitive data; however, the critical nuance is that Kubernetes Secrets are base64-encoded by default, not encrypted — base64 is an encoding, not encryption, and anyone with etcd read access or kubectl get secret can read them. Enabling encryption at rest via EncryptionConfiguration with a KMS provider (AWS KMS in EKS via the KMS plugin) encrypts Secret values in etcd so that even raw etcd access doesn\'t expose secrets. For production GitOps workflows, two patterns dominate: Sealed Secrets (Bitnami) encrypts secret data with a controller public key so the encrypted SealedSecret can be safely committed to git, while External Secrets Operator syncs secret values from AWS Secrets Manager or SSM Parameter Store into Kubernetes Secrets on a schedule — the source of truth lives in the secret store, not in git.',
      },
      {
        name: 'PersistentVolume & Storage',
        icon: 'storage',
        role: 'Durable storage that survives pod restarts and rescheduling',
        detail:
          'Kubernetes abstracts storage through a two-object model: PersistentVolumes (PVs) represent actual storage resources (provisioned by an administrator or dynamically by a StorageClass), and PersistentVolumeClaims (PVCs) are a pod\'s request for storage specifying size and access mode — the binding system matches PVCs to suitable PVs. Access modes define how the volume can be mounted: ReadWriteOnce (RWO) means the volume can be mounted read-write by a single node — AWS EBS gp3 volumes are RWO, which means EBS-backed pods are inherently tied to a single AZ; ReadOnlyMany (ROX) allows multiple nodes to mount read-only simultaneously; ReadWriteMany (RWX) allows multiple nodes to mount read-write simultaneously — AWS EFS (NFS-based) supports RWX and is the standard choice for shared file storage across AZs. StorageClasses define the provisioner, parameters (volume type, encryption, throughput), and reclaim policy (Retain — keep volume after PVC deletion; Delete — delete volume automatically). Dynamic provisioning is the standard pattern: creating a PVC triggers the StorageClass provisioner (ebs.csi.aws.com for EBS, efs.csi.aws.com for EFS) to automatically provision and bind a new volume. StatefulSets use volumeClaimTemplates to provision a unique PVC for each pod replica — pod-0 gets its own PVC, pod-1 gets its own, and these PVCs persist even when the StatefulSet is scaled down, so data survives. CSI (Container Storage Interface) drivers are the modern extension point for storage — any storage vendor can write a CSI driver without modifying Kubernetes core, enabling integration with Portworx, Rook/Ceph, NetApp Trident, and dozens of other storage systems.',
      },
      {
        name: 'HPA & VPA',
        icon: 'autoscaler',
        role: 'Horizontal Pod Autoscaler scales replica count; VPA adjusts resource requests',
        detail:
          'The Horizontal Pod Autoscaler (HPA) is a control loop that periodically (default every 15 seconds) queries metrics and adjusts a Deployment or StatefulSet\'s replica count to maintain a target metric value. The default metric source is the metrics-server (lightweight CPU/memory aggregator), supporting targets like 50% CPU utilization relative to resource requests. Scale-up is aggressive — once the metric exceeds the target, the HPA immediately calculates the required replica count and scales up. Scale-down is deliberately conservative: a stabilisation window (default 5 minutes) prevents thrashing where the HPA scales down just before a traffic spike causes it to immediately scale up again. KEDA (Kubernetes Event-Driven Autoscaling) dramatically extends HPA\'s capabilities by adding external metric sources: SQS queue depth (scale based on unprocessed message count), Kafka consumer group lag, Prometheus metrics, HTTP request rate, cron schedules, and dozens more via a rich scaler ecosystem. KEDA is the standard solution for event-driven workloads and uniquely supports scale-to-zero — scaling a Deployment down to 0 replicas during inactivity and back up when events arrive, dramatically reducing costs for batch or off-peak workloads. The Vertical Pod Autoscaler (VPA) addresses the complementary problem: right-sizing CPU and memory requests. VPA analyses historical resource usage histograms and recommends (Off mode), sets at pod creation (Initial mode), or evicts and recreates pods with updated requests (Auto mode). A subtle incompatibility: VPA and HPA cannot both target CPU on the same workload, since VPA changing CPU requests changes HPA\'s baseline calculation, causing instability — the recommended pattern is VPA for memory right-sizing, HPA for CPU-based scaling, or KEDA with external metrics paired with VPA. Karpenter (AWS-native) complements these by provisioning new EC2 nodes just-in-time when pending pods cannot be scheduled, selecting optimal instance types based on pod requirements rather than pre-configuring node groups.',
      },
      {
        name: 'RBAC & Security',
        icon: 'rbac',
        role: 'Role-Based Access Control governs who can do what to which resources',
        detail:
          'Kubernetes RBAC is a mandatory security layer that controls which subjects (users, groups, service accounts) can perform which verbs (get, list, watch, create, update, patch, delete, impersonate) on which resources (pods, deployments, secrets, configmaps, etc.) in which namespaces. Role objects define a set of permissions scoped to a single namespace; ClusterRole objects define permissions valid cluster-wide (or reusable as a namespace role via RoleBinding). RoleBinding attaches a Role or ClusterRole to a subject within a namespace; ClusterRoleBinding attaches a ClusterRole to a subject across the entire cluster. The principle of least privilege is critical: most application service accounts should have zero RBAC permissions (the default), and automation like CI/CD pipelines should have narrowly scoped Roles rather than cluster-admin. In EKS, Kubernetes RBAC integrates with AWS IAM via two mechanisms: the legacy aws-auth ConfigMap maps IAM role ARNs and user ARNs to Kubernetes usernames and groups (which are then bound via RBAC), and the newer EKS Access Entries API provides a managed, API-driven way to manage these mappings without editing a ConfigMap. IRSA (IAM Roles for Service Accounts) enables pod-level IAM: a Kubernetes service account is annotated with an IAM role ARN, and EKS\'s OIDC provider allows the pod\'s projected service account token to be exchanged for IAM credentials — each pod gets its own fine-grained AWS permissions with no shared credentials. NetworkPolicy is the network-level complement to RBAC: it defines L3/L4 firewall rules specifying which pods can send traffic to which other pods, but it requires a CNI plugin that enforces these policies — Calico and Cilium both support NetworkPolicy enforcement, while the standard AWS VPC CNI alone does not. Pod Security Standards (enforced via the PodSecurity admission controller built into K8s 1.25+) define three profiles: privileged (no restrictions), baseline (prevent privilege escalation and host namespace access), and restricted (hardened — requires non-root, read-only root filesystem, dropped capabilities) — namespaces opt into enforcement, audit, or warn mode for each profile.',
      },
    ],
    howItWorks:
      'Understanding Kubernetes means understanding its reconciliation loop. When you run kubectl apply -f deployment.yaml, the kubectl client serialises the YAML manifest and sends an HTTPS POST (or PATCH for updates) to the API server. The API server first authenticates the request using the credentials in your kubeconfig (a bearer token, client certificate, or OIDC token), then authorises it by checking your identity against RBAC roles — does this user have the create verb on the deployments resource in this namespace? If authorised, the request enters the admission controller chain: mutating webhooks run first (Istio may inject a sidecar container spec into the Deployment template, Kyverno may add labels), then validating webhooks run (OPA/Gatekeeper checks that resource requests are set, that the image doesn\'t use the latest tag, that security context runAsNonRoot is set). If all admission controllers accept the request, the API server writes the Deployment object to etcd and returns a 201 Created response to kubectl. Now the controllers take over. The Deployment controller has an open watch on Deployment objects and receives a notification of the new or changed object. It compares the desired state (spec.replicas, spec.template) to the current state and determines it needs to create a new ReplicaSet (or update an existing one). It creates the ReplicaSet object in the API server. The ReplicaSet controller receives a notification of the new ReplicaSet and computes that it needs N pods. It creates N Pod objects with spec.nodeName left empty. The scheduler has a watch on Pod objects with no nodeName and receives a notification for each new pod. For each pod, it runs the scheduling cycle: the filter phase eliminates nodes that lack sufficient CPU/memory, don\'t match nodeSelector/nodeAffinity, have untolerated taints, or violate podAntiAffinity rules; the score phase ranks the remaining nodes using LeastRequestedPriority, BalancedResourceAllocation, and topology spread scoring. The scheduler patches each pod\'s spec.nodeName to the winning node. The kubelet on that node has a watch on pods assigned to it and receives the notification. It calls containerd via the CRI gRPC interface to pull the image from the registry (ECR, Docker Hub, or a private registry), create the container sandbox (network namespace, cgroup), and start the container process. The kubelet then begins running the probes: the startup probe (if configured) runs until it succeeds, after which the liveness probe monitors the container for crashes and the readiness probe determines when the container is ready to receive traffic. Once the readiness probe passes, the Endpoints controller (watching both Pod and Service objects) adds the pod\'s IP to the Service\'s EndpointSlice. kube-proxy, running on every node, watches EndpointSlice objects and updates iptables DNAT rules to include the new pod IP in the load-balanced backend set. Traffic now routes to the new pod. During a rolling update, the old ReplicaSet is simultaneously scaled down as the new one scales up, with iptables rules updated in real time. When a node fails: the Node controller, which periodically checks node heartbeats, marks the node as NotReady after 40 seconds of missed heartbeats, then adds a node.kubernetes.io/not-ready taint after the pod eviction timeout (default 5 minutes). The ReplicaSet controller detects that pods on the failed node are no longer Running and creates replacement pods, which go through the full scheduling cycle above to land on healthy nodes.',
    decision: {
      choose: [
        'Large microservice estates (more than 10 services) where the operational investment in Kubernetes pays off through standardised deployment, scaling, and observability across all services',
        'Multi-cloud or hybrid deployments requiring portability — Kubernetes abstracts the underlying infrastructure and the same Deployment YAML runs on EKS, GKE, AKS, or on-premises with minimal changes',
        'Teams investing in the Kubernetes ecosystem: Argo CD for GitOps, Argo Rollouts for progressive delivery, Istio or Linkerd for service mesh, Prometheus Operator for observability, Cert-manager for automatic TLS, Karpenter for intelligent node provisioning — this ecosystem delivers enormous leverage',
        'GPU scheduling workloads (ML training/inference) where K8s GPU plugins and the NVIDIA device plugin allocate GPUs to containers with fine-grained control',
        'Complex multi-tenant isolation requirements using namespaces, NetworkPolicies, RBAC, and resource quotas to give teams isolated slices of shared infrastructure',
      ],
      avoid: [
        'Small teams with no Kubernetes operational experience — the learning curve for etcd backup, RBAC configuration, networking troubleshooting, and upgrade management is steep and will slow delivery more than it helps',
        'Single-service applications where ECS Fargate or a simple EC2 Auto Scaling Group with a load balancer is far simpler to operate and reason about',
        'When time-to-first-deploy is the primary constraint — ECS, Elastic Beanstalk, or App Runner get a containerised app running in hours rather than days',
        'Teams that will use Kubernetes purely as a container runner without investing in the ecosystem — at that point you get all the complexity without most of the benefits',
        'Workloads that are entirely event-driven and serverless — Lambda, SQS, and EventBridge require zero cluster management and scale to zero automatically',
      ],
      vs: [
        {
          name: 'K8s vs ECS',
          when: 'Choose ECS when your team is AWS-only, has no existing Kubernetes expertise, and the workload is a manageable number of services — ECS has zero control plane overhead, native IAM integration, and simpler operational model. Choose Kubernetes when you need multi-cloud portability, the full CNCF ecosystem (Argo, Istio, Prometheus Operator), or when custom scheduling and extensibility (CRDs, operators) are requirements.',
        },
        {
          name: 'K8s vs Nomad',
          when: 'Choose Nomad (HashiCorp) when you need to orchestrate not just containers but also raw executables, JVM applications, and batch jobs on heterogeneous infrastructure without the Kubernetes control plane complexity. Nomad\'s operational surface is dramatically smaller. Choose Kubernetes when you need the richer ecosystem, stronger multi-tenancy, and broader community tooling.',
        },
        {
          name: 'K8s vs Lambda',
          when: 'Choose Lambda for event-driven, short-lived (under 15 minutes), highly spiky workloads where you want zero infrastructure management and genuine scale-to-zero. Choose Kubernetes for long-running services, latency-sensitive workloads (Lambda cold starts are 100-500ms), workloads needing persistent connections (WebSockets, gRPC streaming), or when the monthly Lambda cost exceeds EC2/EKS cost at sustained high throughput.',
        },
      ],
    },
    failures: [
      {
        name: 'CrashLoopBackOff',
        cause: 'Container crashes immediately on startup — common causes: application error at startup (null pointer exception, missing required config), database or dependency unreachable, missing or misconfigured Secret/ConfigMap (env var resolves to empty string), out-of-memory kill during initialisation (JVM allocates max heap on startup), or binary incompatibility with the host kernel.',
        symptom: 'Pod status shows CrashLoopBackOff in kubectl get pods. Restart count increments rapidly then slows (exponential backoff: 10s, 20s, 40s, 80s, 160s, then capped at 5 minutes between restarts). kubectl describe pod shows the last exit code in the Last State section.',
        fix: 'Run kubectl logs pod-name --previous to see the logs from the last crashed container (current logs may be empty). kubectl describe pod pod-name shows Events including OOMKill signals. Add a startupProbe with a high failureThreshold (30 failures × 10s = 5 minutes) for slow-starting apps to prevent premature liveness-probe restarts. Validate all required env vars and Secrets exist before deploying: kubectl get secret, kubectl get configmap. For OOM issues, check kubectl top pod and increase memory limits, or for JVM set -XX:MaxRAMPercentage instead of hard -Xmx.',
        severity: 'critical',
      },
      {
        name: 'Pending Pods / Insufficient Resources',
        cause: 'Pods cannot be scheduled because no node satisfies all constraints: insufficient allocatable CPU or memory (node has capacity but existing pods\' requests consume it all), nodeSelector or nodeAffinity targets nodes that don\'t exist or have wrong labels, untolerated taints block all nodes (common after adding a new node group with a taint for GPU or spot), max pods per node reached (AWS VPC CNI limits pods per node based on instance type\'s ENI and IP limits), or PVC in wrong availability zone.',
        symptom: 'kubectl get pods shows pods in Pending state indefinitely. kubectl describe pod pod-name shows Events with FailedScheduling and a specific reason: 0/5 nodes are available: 3 Insufficient cpu, 2 node(s) had untolerated taint.',
        fix: 'kubectl describe node node-name shows Allocatable resources and existing pod resource requests — this reveals whether the node is genuinely full or whether labels/taints are the issue. kubectl get events --field-selector reason=FailedScheduling gives a cluster-wide view. If nodes are genuinely full, add nodes via Cluster Autoscaler or configure Karpenter to provision on demand. If resource requests are too high (pods requesting 2 CPU when they use 200m), reduce requests to reflect actual usage. For taint issues, add the appropriate toleration to the pod spec. For VPC CNI node IP limits, enable prefix delegation (--enable-prefix-delegation) to increase pods-per-node by 16x.',
        severity: 'high',
      },
      {
        name: 'etcd Disk Pressure / Slow Writes',
        cause: 'etcd write latency spikes, causing all API server operations to slow or time out. Primary causes: etcd disk IOPS saturated (gp2 EBS volumes exhaust their burst credit bucket under sustained load), etcd database fragmentation (deleted objects leave gaps that accumulate and slow compaction), excessive number of watch events (large clusters with thousands of pods/services generate massive event streams), or etcd database size approaching the storage quota (default 8GB), which triggers a no-space alarm and makes etcd read-only.',
        symptom: 'API server latency exceeds 1 second for all operations (visible in API server metrics: apiserver_request_duration_seconds). kubectl commands time out or return context deadline exceeded. Controller logs show falling behind on watch events. etcd logs show took too long to execute messages.',
        fix: 'Migrate etcd to gp3 EBS volumes with provisioned 3000+ IOPS (gp3 provides 3000 IOPS at no extra cost, unlike gp2 which bursts). Run etcd defrag regularly (etcdctl defrag --cluster) during low-traffic windows to reclaim fragmented space — add this to a CronJob. Set explicit resourceVersion on list/watch calls to avoid full re-list storms. Implement ResourceQuotas to limit total object count per namespace. Monitor etcd_mvcc_db_total_size_in_bytes and etcd_disk_wal_fsync_duration_seconds as leading indicators.',
        severity: 'critical',
      },
      {
        name: 'ImagePullBackOff',
        cause: 'Pod cannot pull the container image from the registry. Causes: image tag doesn\'t exist (typo, deleted tag, branch name used as tag for a deleted branch), image name points to wrong registry, ECR authentication credentials expired (ECR tokens expire after 12 hours), node has no network path to the registry (security group blocks egress, no NAT gateway, no VPC endpoint for ECR), or rate limiting from Docker Hub (unauthenticated pulls are rate-limited to 100/6h per IP — in EKS all nodes share the NAT gateway IP).',
        symptom: 'Pod status shows ErrImagePull initially, transitioning to ImagePullBackOff (with exponential backoff). kubectl describe pod shows Events with Failed to pull image messages including the specific HTTP error code (401 for auth, 404 for missing image, 429 for rate limiting).',
        fix: 'Verify the image name and tag exist: docker pull the image from a machine with registry access. For ECR in EKS: ensure node IAM role has ecr:GetAuthorizationToken, ecr:BatchGetImage, ecr:GetDownloadUrlForLayer permissions. For private registries: add an imagePullSecrets reference to the pod spec pointing to a Secret of type kubernetes.io/dockerconfigjson. For Docker Hub rate limiting: authenticate with docker login and use the secret as imagePullSecrets, or mirror frequently-used public images to your own ECR. Create a VPC endpoint for ECR (com.amazonaws.region.ecr.api and com.amazonaws.region.ecr.dkr) to avoid NAT gateway costs and remove the network dependency.',
        severity: 'high',
      },
    ],
    a: {
      v: 'OS kernel for your cluster',
      t: 'Kubernetes is the Operating System for Your Cluster',
      tx: 'When you sit down to write a program, you never think about which CPU core it will run on. You never worry that if that core overheats, your program will die. You never manually manage memory addresses or page tables. The operating system handles all of that invisibly: it schedules your process onto available cores, moves it if a core fails, enforces memory boundaries, and restarts it if something goes catastrophically wrong. You simply declare "I want this program running" and the OS makes it so.\n\nKubernetes does the exact same thing, but one abstraction layer higher. Instead of processes on CPU cores, it manages containers on server nodes. You declare "I want three replicas of this container running, with at least 2 CPUs and 4GB of RAM each" and Kubernetes figures out which nodes to place them on, moves them if a node fails, restarts them if they crash, and scales them up if demand spikes — all without manual intervention.\n\nThe analogy runs deeper than the surface: The API server is Kubernetes\'s equivalent of the kernel\'s system call interface — the one authorised gateway through which all state changes must pass, with authentication, authorisation, and validation enforced at every call. etcd is the kernel\'s memory management: the single authoritative store of what exists and what its state is. The scheduler is the process scheduler: given a set of runnable units (pods) and a set of resources (nodes), assign each unit to a resource efficiently according to declared constraints. The kubelet is the process manager (like systemd on Linux): running on each node, it ensures the containers assigned to that node are started, kept alive, and cleaned up. Pods are processes: the basic unit of execution, isolated from each other, with their own network namespace and filesystem view. Services are network sockets: stable addresses that abstract away the fact that the underlying processes come and go.\n\nThe reconciliation loop is Kubernetes\'s equivalent of the kernel\'s interrupt handler. The kernel doesn\'t poll your keyboard — it waits for an interrupt, handles it, and returns to idle. Similarly, Kubernetes controllers don\'t poll the cluster looking for drift — they watch for change events via etcd\'s watch mechanism and react immediately when actual state diverges from desired state. This event-driven reactive model is why Kubernetes can manage thousands of resources efficiently without spinning its wheels.\n\nThe deepest insight: an OS doesn\'t prevent bugs in your programs — it gives your programs a reliable, isolated environment to run in and handles the infrastructure concerns so you can focus on logic. Kubernetes doesn\'t prevent bugs in your services — it gives your services a reliable, self-healing environment to run in and handles the infrastructure concerns (placement, restart, scaling, networking) so your team can focus on building.',
      s: 'The most important Kubernetes configuration you will ever write is resource requests and limits. Without CPU and memory requests, the scheduler places pods on nodes based on capacity that doesn\'t reflect actual usage — pods pile up on nodes until one workload spikes and triggers an OOMKill that takes down pods that had nothing to do with the problem. Without limits, a single misbehaving container can consume all CPU on a node, starving every other workload. Every container in production must have both requests (set to the p50 of actual usage) and limits (set to the p99, or p99.9 for latency-sensitive workloads). The second most important configuration is PodDisruptionBudgets. Without a PDB, a routine Kubernetes node drain (during an upgrade, a spot interruption, or routine maintenance) will evict pods without regard to quorum — if your Deployment has 3 replicas across 3 nodes and all 3 nodes are drained simultaneously, all 3 replicas are terminated at once, causing a full service outage during routine maintenance. A PDB with minAvailable: 2 ensures Kubernetes will never voluntarily reduce your running replicas below 2 simultaneously, making node drains safe for any reasonably-sized Deployment.',
    },
    te: {
      def: 'Kubernetes is a declarative container orchestration system built around the controller pattern: every resource type has one or more controllers that continuously reconcile the resource\'s observed state toward its declared desired state using an optimistic-concurrency watch-based event model. Resources are versioned objects stored in etcd; every object carries a resourceVersion field that changes on every write, and controllers use this for optimistic concurrency control (a stale update is rejected with a 409 Conflict, forcing the controller to re-read before retrying). The watch mechanism (a long-lived HTTP/2 connection returning a stream of watch.Event objects) enables all controllers to react to changes in near-real-time without polling. Controller high availability is achieved via leader election: multiple replicas of kube-controller-manager run simultaneously, but only the leader actively reconciles — if the leader fails, a standby acquires the lease and takes over within seconds, preventing split-brain. The admission controller chain (mutating → validating) is the extension point for policy enforcement: webhooks receive the full API request, can modify or reject it, and integrate external systems (OPA/Gatekeeper enforcing OPA policies from a policy-as-code repository, Kyverno enforcing resource best practices, Istio injecting Envoy sidecars). Custom Resource Definitions (CRDs) extend the Kubernetes API with arbitrary resource types, enabling the Operator pattern: domain-specific controllers that manage stateful applications (cert-manager manages TLS certificates as Certificate resources, Argo CD manages GitOps deployments as Application resources, the Prometheus Operator manages scrape configs as ServiceMonitor resources) using the same reconciliation primitives as built-in controllers.',
      types: [
        {
          n: 'Vanilla K8s (self-managed)',
          d: 'Full control over every component (API server flags, etcd config, network plugin choice, admission controllers). Maximum flexibility, maximum operational burden. Teams must manage control plane upgrades, etcd backups, certificate rotation, and node provisioning. Suitable for on-premises, air-gapped environments, or organisations with strict requirements around control plane access.',
        },
        {
          n: 'EKS (Amazon Elastic Kubernetes Service)',
          d: 'AWS-managed control plane: AWS runs and upgrades the API server, etcd, scheduler, and controller manager across three AZs. You manage worker nodes (managed node groups, self-managed node groups, or Fargate for serverless nodes). Deep integration with AWS services: ALB Ingress Controller, EBS/EFS CSI drivers, VPC CNI, IAM Roles for Service Accounts (IRSA), CloudWatch Container Insights, and GuardDuty for runtime threat detection.',
        },
        {
          n: 'GKE (Google Kubernetes Engine)',
          d: 'Google\'s managed Kubernetes, built by the original Kubernetes creators. Autopilot mode provides a fully managed node layer where Google provisions, scales, and maintains nodes — you pay per pod resource request, not per node. Standard mode gives node control. GKE typically leads on Kubernetes version availability and has the most mature cluster upgrade tooling (node surge upgrades, blue/green node pools).',
        },
        {
          n: 'AKS (Azure Kubernetes Service)',
          d: 'Microsoft\'s managed Kubernetes with deep Azure Active Directory integration (RBAC backed by AAD groups), Azure CNI with subnet-per-pod options, and native integration with Azure Monitor, Azure Policy (using Gatekeeper), and Azure Container Registry. The control plane is free; you pay only for worker nodes. Strong choice for organisations already standardised on the Microsoft Azure ecosystem.',
        },
        {
          n: 'K3s (Lightweight Edge Kubernetes)',
          d: 'A CNCF-certified Kubernetes distribution packaged as a single ~70MB binary, designed for edge computing, IoT devices, CI pipelines, and resource-constrained environments. Replaces etcd with SQLite (or supports external MySQL/PostgreSQL) by default, removes legacy and alpha features, and bundles containerd, CoreDNS, Traefik, and local-path-provisioner. A K3s cluster can run on a Raspberry Pi with 512MB RAM.',
        },
      ],
      when: 'Use Kubernetes when: (1) you are operating more than 8-10 distinct services and the operational overhead of individual service management (manual scaling, deployment scripts, health check configuration) exceeds the operational overhead of a K8s cluster; (2) you need declarative GitOps deployment workflows where every change to production is a git commit and Argo CD continuously reconciles the cluster state to match the git repository; (3) your organisation needs to enforce consistent security policies across all deployments (PodSecurityStandards, OPA/Gatekeeper policies, NetworkPolicies) and individual teams cannot be trusted to configure these correctly per-service; (4) you run stateful distributed systems (Kafka, Cassandra, Elasticsearch) that benefit from StatefulSets, pod disruption budgets, and the Operator pattern for lifecycle management; (5) you need sophisticated traffic management (canary deployments, A/B testing, circuit breaking) provided by Istio, Linkerd, or Argo Rollouts. Avoid Kubernetes when: team size is under 5 engineers and no one has K8s operational experience; the organisation runs fewer than 5 services and is growing slowly; time-to-production is critical and the organisation cannot invest 2-4 weeks in cluster setup and tooling; the workload is entirely serverless/event-driven where Lambda + SQS is the right abstraction.',
      trade: 'Operational complexity vs portability and ecosystem richness: Kubernetes imposes significant upfront operational investment (learning curve, tooling choices, cluster lifecycle management) but pays dividends at scale through standardisation, the CNCF ecosystem, and infrastructure portability across cloud providers. Declarative vs imperative: Kubernetes\'s declarative model (describe what you want, let the system figure out how) is more robust and auditable than imperative scripts, but requires a mindset shift from traditional ops and a discipline of treating the git repository as the source of truth. Ecosystem richness vs learning curve: the CNCF ecosystem offers an extraordinary breadth of integrated tools, but each tool (Argo CD, Istio, Prometheus Operator, Cert-manager, External Secrets Operator) has its own learning curve and failure modes. Fine-grained resource control vs overhead: Kubernetes\'s per-pod resource requests/limits enable optimal bin-packing and prevent noisy neighbours, but require careful tuning — underestimated requests cause scheduling issues, overestimated requests waste money. Self-healing vs debugging complexity: Kubernetes automatically restarts failed pods, evicts pods from failed nodes, and reruns failed jobs — but this automatic remediation can mask bugs, making intermittent failures harder to diagnose.',
      code: `# ============================================================
# Production-grade Kubernetes manifest:
# Deployment + HPA + PodDisruptionBudget + NetworkPolicy
# ============================================================

apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  namespace: production
  labels:
    app: api-service
    version: "1.0.0"
spec:
  replicas: 3
  # Retain last 3 ReplicaSets for fast rollback
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: api-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      # Never go below 2 running replicas during update
      maxUnavailable: 1
      # Allow one extra pod during rollout to maintain capacity
      maxSurge: 1
  template:
    metadata:
      labels:
        app: api-service
        version: "1.0.0"
    spec:
      # Spread replicas across all 3 AZs — if one AZ fails, 2/3 replicas survive
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: api-service
      # Never run two replicas on the same node — single node failure loses at most 1 replica
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: api-service
              topologyKey: kubernetes.io/hostname
      # Service account with IRSA annotation for AWS permissions
      serviceAccountName: api-service-sa
      # Don't mount the default service account token (least privilege)
      automountServiceAccountToken: false
      containers:
        - name: api
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/api-service:1.0.0
          ports:
            - containerPort: 8080
              protocol: TCP
          # resource.requests: used by scheduler for placement decisions
          # resource.limits: enforced by cgroups at runtime
          # requests = p50 of observed usage; limits = p99
          resources:
            requests:
              cpu: "250m"      # 0.25 cores
              memory: "256Mi"
            limits:
              cpu: "1000m"     # 1 core — prevents CPU throttling but caps burst
              memory: "512Mi"  # OOMKill at 512Mi — set above p99 usage
          # Startup probe: disables liveness check during slow app initialisation
          startupProbe:
            httpGet:
              path: /health/startup
              port: 8080
            failureThreshold: 30   # 30 × 10s = 5 minutes max startup time
            periodSeconds: 10
          # Liveness probe: kills and restarts container if it becomes unhealthy
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 0   # Startup probe handles the delay
            periodSeconds: 10
            failureThreshold: 3      # 3 failures × 10s = 30s to declare dead
            timeoutSeconds: 5
          # Readiness probe: removes pod from Service endpoints when not ready
          # Does NOT restart the container — just stops traffic to it
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            periodSeconds: 5
            failureThreshold: 2      # 2 failures × 5s = 10s to pull from rotation
            successThreshold: 1      # One success brings it back
            timeoutSeconds: 3
          env:
            - name: NODE_ENV
              value: "production"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: api-service-secrets
                  key: db-password
          # Hardened security context — all containers should have these
          securityContext:
            runAsNonRoot: true           # Reject if image USER is root
            runAsUser: 1001              # Explicit non-root UID
            runAsGroup: 1001
            readOnlyRootFilesystem: true # Force writes through mounted volumes
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL                    # Drop all Linux capabilities
              # add only the specific capabilities your app needs (rarely any)
          # Writable directories for apps that need to write (logs, tmp)
          volumeMounts:
            - name: tmp-dir
              mountPath: /tmp
            - name: cache-dir
              mountPath: /app/cache
      volumes:
        - name: tmp-dir
          emptyDir: {}
        - name: cache-dir
          emptyDir:
            medium: Memory   # tmpfs — faster, cleared on pod restart
      # Graceful shutdown: give app 30s to drain in-flight requests before SIGKILL
      terminationGracePeriodSeconds: 30

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 3   # Never go below 3 — maintains AZ redundancy
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50   # Scale when average CPU hits 50% of request
  behavior:
    scaleDown:
      # Wait 5 minutes of sustained low load before scaling down
      # Prevents thrashing when load oscillates around the threshold
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1          # Scale down at most 1 pod per minute
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
        - type: Percent
          value: 100         # Can double replica count per 15s in emergency
          periodSeconds: 15

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-service-pdb
  namespace: production
spec:
  # During voluntary disruptions (node drains, upgrades), always keep at least 2 pods running
  # This ensures the service never has a single point of failure during maintenance
  minAvailable: 2
  selector:
    matchLabels:
      app: api-service

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-service-netpol
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Only allow traffic from the ingress controller (nginx/alb-ingress)
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
          podSelector:
            matchLabels:
              app.kubernetes.io/name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    # Allow DNS resolution (CoreDNS in kube-system)
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
    # Allow outbound HTTPS to AWS services (RDS, S3, Secrets Manager via VPC endpoints)
    - ports:
        - protocol: TCP
          port: 443`,
      rw: {
        ex: [
          'Airbnb runs thousands of microservices on Kubernetes, having migrated from a monolithic Rails application. Their internal platform team built Ottr (certificate automation) and Spinnaker-based deployment pipelines on top of K8s, with multi-cluster federation across AWS regions. They use KEDA for event-driven scaling of their pricing and search services.',
          'Spotify migrated to Kubernetes (on GKE) after running their own custom orchestration system called Helios. Their internal developer platform "Backstage" (now open-sourced as CNCF Backstage) was built specifically to abstract Kubernetes complexity for their 2000+ engineers, letting teams deploy services without direct K8s knowledge.',
          'Pinterest runs Kubernetes at scale on AWS EKS, managing hundreds of microservices powering their recommendation engine and image processing pipelines. They developed Teletraan (deployment system) integrated with Kubernetes and contributed significantly to the Kubernetes autoscaling ecosystem, particularly around mixed-instance node groups and cost optimisation.',
          'CERN runs Kubernetes to manage computing workloads for the Large Hadron Collider data processing pipeline, handling petabytes of particle collision data. They operate multi-cluster Kubernetes spanning their Geneva and Budapest data centers, use custom schedulers for GPU workloads, and contributed to the development of CephFS CSI drivers for their high-throughput storage requirements.',
        ],
        cs: 'A mid-sized SaaS company with 40 engineers migrated from a fleet of manually managed EC2 instances to Kubernetes over 18 months. The initial state: 15 services each deployed via custom bash scripts to fixed EC2 instances, deployments requiring a 2-hour maintenance window, no automatic failover, and scaling done manually via support tickets to the ops team — taking 2-3 days. The migration strategy was strangler-fig: containerise one service at a time, run it on EKS alongside the existing EC2 instances, validate, then decommission the old instances. The first three months focused on containerisation: writing Dockerfiles, setting up ECR, and establishing CI/CD pipelines with GitHub Actions building and pushing images. The next six months focused on EKS setup: cluster provisioning via Terraform, configuring the VPC CNI for pod IP allocation, the AWS Load Balancer Controller for ALB Ingress, the EBS CSI driver for persistent storage, ExternalDNS for Route53 integration, and cert-manager for automatic TLS. The final nine months migrated all 15 services and established the GitOps workflow with Argo CD — every change to production became a pull request to the infrastructure repository. Outcomes after 18 months: deployment time went from 2-hour maintenance windows to 3-minute rolling deployments with zero downtime. Incident response improved because kubectl get pods, kubectl logs, and kubectl describe pod gave instant visibility that SSH-and-tail-logs never provided. Scaling a service from 3 to 20 replicas became a 30-second kubectl scale or an HPA trigger, vs 2-3 days before. Infrastructure cost dropped 30% because bin-packing containers on fewer, larger instances was more efficient than dedicating one EC2 instance per service. The hardest parts: convincing developers to write proper resource requests and limits (required a Kyverno policy to enforce it), managing secrets safely during the transition period (External Secrets Operator + AWS Secrets Manager solved this), and the etcd backup and cluster upgrade procedures which required significant investment in runbooks and on-call training.',
      },
    },
    interview: {
      q: 'Walk me through what happens when you run kubectl apply -f deployment.yaml — from your terminal to a running container receiving traffic.',
      a: 'When you run kubectl apply -f deployment.yaml, the kubectl client first reads and parses the YAML into a Kubernetes API object, performs client-side validation against the OpenAPI schema, and computes the diff between the local manifest and the server-side state (using server-side apply or a three-way merge patch). It then serialises the object and sends an HTTPS POST (for new resources) or PATCH request to the API server endpoint, authenticated using the credentials in your kubeconfig — typically a bearer token, client certificate, or an OIDC token from your SSO provider.\n\nThe API server receives the request and runs it through three gates in sequence. First, authentication: it validates the credential and extracts the identity (username, groups, ServiceAccount). Second, authorisation: it checks the identity against RBAC rules — does this identity have the update verb on deployments resources in this namespace? If not, the request is rejected with 403 Forbidden. Third, admission control: mutating webhooks run first (Istio injects Envoy sidecar containers into the pod spec, Kyverno adds required labels, a custom webhook sets default resource limits if missing), then validating webhooks run (OPA/Gatekeeper checks that image tags are not "latest", that resource requests are set, that security context runAsNonRoot is true). If all admission controllers accept the request, the API server writes the Deployment object to etcd with an updated resourceVersion and returns 200 OK to kubectl.\n\nNow the controllers take over via their watch connections. The Deployment controller detects the change and runs its reconciliation: it compares the new desired pod template hash against existing ReplicaSets. Since the pod template changed (new image tag), it creates a new ReplicaSet with the updated template and begins the rolling update — gradually scaling up the new ReplicaSet (respecting maxSurge) while scaling down the old one (respecting maxUnavailable). The ReplicaSet controller detects the new ReplicaSet and creates Pod objects with spec.nodeName left empty.\n\nThe scheduler has a watch open on pods with no nodeName. For each new pod, it runs the scheduling cycle: the filter phase eliminates nodes that cannot satisfy the pod\'s constraints (insufficient CPU/memory allocatable, nodeSelector mismatch, untolerated taints, podAntiAffinity violations), and the score phase ranks the remaining nodes using resource availability and topology spread scoring. The scheduler patches the pod object\'s spec.nodeName to the winning node and writes the binding to the API server.\n\nThe kubelet on the target node detects the new pod assignment via its watch and begins pod creation. It calls containerd via the CRI gRPC interface to pull the container image from ECR (checking the local image cache first, pulling individual layers that are missing), create the network sandbox (the pause container establishes the network namespace), and start the application container. The kubelet then begins running probes: the startup probe runs until it succeeds, then the liveness and readiness probes begin. Once the readiness probe returns 200, the Endpoints controller (which watches both Service selector labels and Pod ready conditions) adds the pod\'s IP to the Service\'s EndpointSlice. kube-proxy on every node watches EndpointSlice objects and rewrites iptables DNAT rules to include the new pod IP in the backend set for the Service\'s ClusterIP. Traffic now routes to the new pod. Simultaneously, the old ReplicaSet is being scaled down — old pods receive SIGTERM, their readiness probe stops passing (removing them from the EndpointSlice), in-flight requests drain during the terminationGracePeriodSeconds window, and then the pods terminate.',
      fu: [
        'How does Kubernetes RBAC differ from IAM, and how do they integrate in EKS? Walk me through IRSA.',
        'What happens to your cluster if etcd goes down completely? What if only the leader fails? How do you recover from a full etcd data loss?',
        'A pod is stuck in Pending state. Walk me through your debugging process — what commands do you run and what are you looking for at each step?',
        'Explain how kube-proxy implements Service routing using iptables. What are the limitations of iptables mode and when would you switch to IPVS?',
        'How would you implement a zero-downtime rolling deployment that automatically rolls back if the error rate on the new version exceeds 1% within 5 minutes of rollout?',
        'Walk me through how KEDA scales a Deployment based on SQS queue depth. What happens when queue depth is zero? What are the tradeoffs vs a traditional HPA?',
      ],
    },
  },

  {
    id: 'docker',
    cat: 'cloud',
    color: '#2496ed',
    icon: 'docker',
    title: 'Docker & Containers',
    tag: 'Container runtime, image layers, and the OCI standard',
    overview:
      'Docker popularised the container model that the entire cloud-native ecosystem now runs on. A container is not a VM — it is a Linux process (or group of processes) with namespace isolation (PID, network, mount, UTS, IPC, user) and cgroup resource limits. Docker made this packaging and running model developer-friendly through its image format (now standardised as OCI — Open Container Initiative), the Dockerfile DSL, and the Docker Hub public registry. Understanding how Docker images are built (layer by layer, union filesystem via OverlayFS), how containers share the host kernel (no hypervisor, no hardware emulation, near-native performance), and how the container runtime stack (Docker daemon → containerd → runc → Linux namespaces/cgroups) works is essential background for anyone running Kubernetes, ECS, EKS, or Fargate in production.',
    components: [
      {
        name: 'Docker Image & OCI Layers',
        icon: 'image-layers',
        role: 'Immutable, layered filesystem built by Dockerfile instructions',
        detail:
          'Docker images are built as a stack of read-only filesystem layers using the OverlayFS union filesystem driver (overlay2). Each instruction in a Dockerfile that modifies the filesystem (RUN, COPY, ADD) creates a new layer; instructions that only set metadata (ENV, EXPOSE, CMD, ENTRYPOINT, LABEL) are recorded in the image manifest but do not create filesystem layers. Layers are content-addressed using SHA256 — a layer\'s digest is the hash of its contents, which means identical layers (e.g., the ubuntu:22.04 base layer) are stored exactly once on a host and shared across all images that use them, dramatically reducing disk usage and pull time. The copy-on-write mechanism means running containers do not modify image layers: each container gets a thin writable layer stacked on top of the image layers, and only the diff between the original file and the modified version is stored in the writable layer. Multi-stage builds are the most important Dockerfile optimisation: the first stage uses a full build environment (node:20 with build tools, maven with the full JDK) to compile and test the application, then the final stage starts from a minimal base image (node:20-alpine or distroless) and copies only the compiled artifacts — eliminating build tools, source code, test files, and package manager caches from the production image, often reducing image size from 1-2GB to 50-200MB. Build cache invalidation is the most important concept for fast builds: Docker rebuilds a layer and all subsequent layers when a layer\'s cache key changes, so instruction order is critical — always copy dependency manifests (package.json, go.mod, pom.xml) and install dependencies before copying application source code.',
      },
      {
        name: 'Container Runtime (containerd → runc)',
        icon: 'runtime',
        role: 'OCI-compliant stack that creates and manages container lifecycle via Linux namespaces and cgroups',
        detail:
          'The container runtime stack has three layers: the Docker daemon (high-level API, now largely replaced by containerd directly in Kubernetes), containerd (CNCF-graduated, manages image pulling, storage, container lifecycle, and exposes the CRI gRPC interface used by Kubernetes), and runc (the low-level OCI runtime that actually creates Linux namespaces and cgroups). Linux namespaces are the isolation mechanism: the PID namespace gives the container its own process tree (its entrypoint is PID 1 in its namespace, invisible to host or other containers), the network namespace gives it its own network stack (interfaces, routing table, firewall rules, port space), the mount namespace gives it its own filesystem tree, the UTS namespace gives it its own hostname, and the IPC namespace isolates semaphores and shared memory. The user namespace (rootless containers) maps container UIDs to unprivileged host UIDs — the container process thinks it is UID 0 (root) inside the container but is actually an unprivileged UID (e.g., 100000) on the host, providing defense-in-depth against container escapes. cgroups v2 enforce resource limits: the memory cgroup kills the container process with SIGKILL when memory usage exceeds the limit (OOM kill), the cpu cgroup enforces CPU shares (relative scheduling weight) and CPU quotas (hard limit in microseconds per 100ms period), and the blkio cgroup throttles disk I/O bandwidth. Because containers share the host kernel (there is no hypervisor, no hardware emulation, no separate kernel boot), container startup time is measured in milliseconds (vs seconds to minutes for VMs) and the performance overhead is near-zero.',
      },
      {
        name: 'Dockerfile Best Practices',
        icon: 'dockerfile',
        role: 'Instructions for building reproducible, minimal, cache-efficient container images',
        detail:
          'Pin base images to their digest (FROM node:20-alpine@sha256:abc123...) rather than a mutable tag — a tag like node:20-alpine can silently change when Docker Hub pushes a new image with the same tag, breaking reproducibility. Use the smallest viable base image: alpine (5MB) for minimal needs, distroless (Google\'s images that contain only the runtime with no shell, package manager, or libc — attack surface is minimal), or scratch (empty filesystem — for statically compiled Go or Rust binaries). Order Dockerfile instructions specifically to maximise cache hits: COPY package.json package-lock.json ./ first, then RUN npm ci (which installs dependencies and caches when package.json hasn\'t changed), then COPY . . (which copies source code and only invalidates the final layer when source changes). Use a comprehensive .dockerignore file to exclude node_modules, .git, .env, test coverage reports, and local build artifacts — these inflate build context size and slow docker build. Always set USER to a non-root UID as the last configuration step: USER 1001:1001. Prefer COPY over ADD for copying local files — ADD has surprising behaviour (it extracts tar archives and can fetch URLs) that makes Dockerfiles harder to reason about. Consolidate RUN commands with && to minimise layer count, but don\'t go too far — splitting a long RUN into multiple commands that rarely change can improve cache hit rate. Enable BuildKit (DOCKER_BUILDKIT=1 or set in daemon.json) for parallel multi-stage builds and --mount=type=cache mounts that persist package manager caches between builds without storing them in image layers.',
      },
      {
        name: 'Container Networking',
        icon: 'networking',
        role: 'Network isolation models from host-shared to overlay multi-host',
        detail:
          'Docker\'s default bridge network creates an isolated Layer 2 network (docker0 bridge, typically 172.17.0.0/16) where each container gets a virtual ethernet interface pair (veth): one end in the container\'s network namespace, one end attached to the docker0 bridge on the host. Containers on the same bridge can communicate by IP; communication to the outside world goes through iptables MASQUERADE (NAT) rules that rewrite the container source IP to the host IP. Port mapping (-p 8080:80) creates an iptables DNAT rule that rewrites traffic arriving on host port 8080 to the container\'s IP on port 80. The host network mode (--network host) bypasses all namespace isolation: the container shares the host\'s network namespace directly, sees all host interfaces, and binds ports directly on the host — useful for maximum throughput (eliminates veth and NAT overhead) or when a container must listen on a port that requires root or privileged access, but eliminates network isolation entirely. The none network mode removes all network interfaces except loopback, for containers that process local files with no network access. Overlay networks (used by Docker Swarm) create a VXLAN tunnel between multiple Docker hosts, allowing containers on different machines to communicate as if on the same L2 segment — each packet is encapsulated in a UDP packet with a VXLAN header and sent to the destination host\'s VTEP. In Kubernetes, Docker networking is not used at all — CNI plugins (VPC CNI, Calico, Cilium) manage pod networking directly via the Container Network Interface, giving each pod its own network namespace with a unique cluster-routable IP.',
      },
      {
        name: 'Docker Volumes & Bind Mounts',
        icon: 'volumes',
        role: 'Persistent and shared storage that outlives container lifecycle',
        detail:
          'Docker containers are ephemeral by design — the writable container layer is destroyed when the container is removed, taking all data written inside the container filesystem with it. Named volumes solve this: Docker creates and manages a directory (typically under /var/lib/docker/volumes/volume-name/_data on the host) that is mounted into the container at a specified path, and the volume persists independently of any container. Named volumes are the recommended approach for databases, log files, and any state that must survive container replacement. Bind mounts mount a specific host filesystem path directly into a container (e.g., -v /home/user/app:/app) — the container sees the host directory contents directly, with changes reflected immediately in both directions. This makes bind mounts ideal for local development (mount source code, edit on host, changes immediately visible to the running container without rebuilding) but problematic in production (depends on host filesystem state, path must exist, breaks container portability). tmpfs mounts store data in the host\'s memory (never written to disk) — ideal for sensitive temporary data (tokens, cryptographic material) that should not persist to disk or appear in docker commit image snapshots. In Kubernetes, Docker volumes are not used — pod volumes are defined in the pod spec and managed by the kubelet and CSI drivers. For production databases in containers, always use cloud-native block storage (EBS gp3 for single-node, EFS for multi-AZ shared) via Kubernetes PersistentVolumes rather than Docker volumes or host-path mounts, which are node-local and will lose data if the pod is rescheduled to a different node.',
      },
      {
        name: 'Docker Compose',
        icon: 'compose',
        role: 'Multi-container local development orchestration via YAML DSL',
        detail:
          'Docker Compose defines multi-container applications as a single YAML file (compose.yaml, the canonical modern name, or docker-compose.yml for backward compatibility), enabling developers to spin up a complete local environment with a single command. The top-level keys are services (container definitions with image or build context, ports, environment variables, volumes, network connections, and dependency ordering), networks (custom bridge networks connecting specific services), and volumes (named volumes shared between services). The depends_on key with condition: service_healthy waits for a dependency\'s healthcheck to pass before starting the dependent service — critical for databases that take a few seconds to accept connections. Override files (docker-compose.override.yml, automatically merged by Docker Compose) allow environment-specific customisation: mount local source code in development, use different secrets in CI, without duplicating the base compose.yaml. Compose is explicitly designed for local development, testing, and CI environments — not for production. Production workloads should use Kubernetes, ECS, or another orchestrator that handles multi-host scheduling, service discovery, and failure recovery. Environment variable substitution (${VARIABLE:-default}) makes compose files reusable across environments. Profiles (--profile database) allow selective service startup — start only the services needed for the current task rather than the entire stack.',
      },
      {
        name: 'Container Registry & ECR',
        icon: 'registry',
        role: 'OCI-compliant image storage, distribution, and security scanning',
        detail:
          'Container registries implement the OCI Distribution Specification: a standardised HTTP API for pushing and pulling OCI images. An image reference has the format registry-hostname/repository:tag@digest — the tag is a mutable pointer (like a git branch), while the digest (sha256:abc123...) is the immutable, content-addressable identifier. When docker push runs, Docker checks which layers the registry already has (via a HEAD request per layer digest), uploads only the missing layers (each layer as a gzip-compressed tar stream), then pushes the image manifest that references all layers. Authentication uses standard HTTP bearer tokens: for ECR, the workflow is aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin account.dkr.ecr.us-east-1.amazonaws.com, which exchanges IAM credentials for a 12-hour ECR bearer token. ECR lifecycle policies are essential for cost control: policies can automatically expire untagged images after N days and keep only the last N tagged images, preventing unbounded registry storage costs. Image vulnerability scanning in ECR Enhanced Scanning uses Amazon Inspector with a Snyk-powered vulnerability database to scan images on push and continuously (as new CVEs are published) — generating findings for OS packages and application language dependencies (npm, PyPI, Maven). Image signing with Sigstore/cosign attaches a cryptographic attestation to an image digest (stored as an OCI artifact in the registry), enabling admission controllers (Kyverno, Connaisseur) to verify that only signed images from trusted pipelines can be deployed to production.',
      },
      {
        name: 'Resource Limits & Security',
        icon: 'security',
        role: 'cgroup enforcement and Linux security mechanisms for container isolation hardening',
        detail:
          'Container resource limits enforce hard boundaries via cgroups: --memory 512m configures the container\'s memory cgroup limit so the kernel OOM killer sends SIGKILL to the container process if it exceeds 512MB (the process gets no warning, no SIGTERM, no chance to flush buffers — design your application to handle sudden termination gracefully). --cpus 1.0 sets a CPU quota of 100ms per 100ms period, effectively capping the container at one logical CPU regardless of how many CPUs the host has — under-allocated CPU manifests as throttling (the process is paused when it exceeds its quota), not killing, so it can be harder to detect than OOM. Security hardening layers: seccomp profiles (--security-opt seccomp=profile.json) restrict which Linux syscalls the container process can make — Docker\'s default seccomp profile already blocks ~44 of the most dangerous syscalls (ptrace, kexec_load, etc.), and a custom profile for your specific application can lock it down further. AppArmor (Ubuntu) or SELinux (RHEL/CentOS) add mandatory access control profiles that restrict file paths, network operations, and capabilities independently of the process\'s UID. Linux capabilities are fine-grained root privileges: instead of giving a container full root, drop all capabilities (--cap-drop ALL) and add back only the specific ones needed — NET_BIND_SERVICE (bind port <1024), SYS_PTRACE (strace, gdb), CHOWN. Never use --privileged in production: it grants the container all capabilities, access to all host devices, and the ability to mount new filesystems — a privileged container escape gives the attacker full host root. Rootless Docker (running the Docker daemon itself as a non-root user via user namespaces) is the defense-in-depth gold standard: even a container escape is limited to the user-namespace UID, not host root.',
      },
      {
        name: 'BuildKit & Image Optimisation',
        icon: 'buildkit',
        role: 'Next-generation build engine with parallelism, cache mounts, and multi-arch support',
        detail:
          'BuildKit is the modern Docker build engine (enabled via DOCKER_BUILDKIT=1 or set as default in daemon.json since Docker 23.0), replacing the legacy sequential builder with a DAG-based parallel executor. Multi-stage builds with BuildKit execute independent stages in parallel — a build, test, and lint stage that don\'t depend on each other run simultaneously, dramatically reducing CI build time. The --mount=type=cache directive is BuildKit\'s most impactful feature for build speed: it mounts a persistent cache directory that is preserved between builds but never written into the image layer. RUN --mount=type=cache,target=/root/.npm npm ci uses a cached npm download cache, so only packages that changed in package-lock.json are downloaded on subsequent builds — a fresh install that took 90 seconds becomes a 5-second cache hit. --mount=type=secret mounts sensitive files (NPM tokens, SSH keys, API credentials) during the build RUN step without storing them in any image layer — the secret is available as a file during that single RUN instruction and then completely absent from the final image. Cross-platform builds via docker buildx build --platform linux/amd64,linux/arm64 (using QEMU emulation or native ARM build nodes) produce a multi-arch manifest that serves the correct binary for the requesting architecture — essential now that Apple Silicon (arm64) is common for development and Graviton (arm64) instances are 40% cheaper than x86 equivalents on AWS. SBOM (Software Bill of Materials) generation (docker buildx build --sbom=true) produces a CycloneDX or SPDX document listing all packages in the image — required for supply chain security compliance in enterprise environments and increasingly mandated by government procurement.',
      },
      {
        name: 'Container vs VM',
        icon: 'container-vs-vm',
        role: 'Isolation model comparison — shared kernel vs separate kernel per workload',
        detail:
          'Virtual machines use a hypervisor (Type 1: KVM, Xen, Hyper-V run directly on hardware; Type 2: VirtualBox, VMware Workstation run on a host OS) to present virtualised hardware to guest operating systems. Each VM runs its own complete OS kernel, init system, and userspace — strong isolation because a kernel vulnerability in one VM cannot be exploited by another VM (they share hardware resources but not kernel code). The isolation cost is substantial: a VM image is gigabytes (full OS + packages), boot time is measured in minutes (kernel initialisation, service startup), and there is measurable overhead from hypervisor context switches and hardware emulation. Containers use Linux namespaces for isolation and share the host kernel — there is no separate kernel per container, no hypervisor, no boot sequence. Startup is milliseconds (just fork the process, set up namespaces, mount the overlay filesystem). Image size is megabytes. The tradeoff is isolation depth: a Linux kernel vulnerability can potentially be exploited by any container on that host (all containers share the same kernel). For most workloads this is an acceptable tradeoff given the benefits. When to use VMs: multi-tenant SaaS where customers must have kernel-level isolation (PCI-DSS, HIPAA strict interpretations), workloads requiring different OS kernels (running Windows workloads alongside Linux), or legacy applications with deep OS dependencies. When to use containers: microservices, APIs, batch processing, CI/CD — anywhere density, speed, and image portability matter. Kata Containers is the bridge: hardware-virtualised containers using Firecracker MicroVMs (the same technology AWS Fargate uses internally) — each container group runs inside a lightweight VM with its own kernel (VM-level isolation), but the VM starts in 125ms and consumes ~5MB of memory (container-level speed and density). Fargate uses Firecracker to provide per-task hardware isolation without customers managing VMs.',
      },
    ],
    howItWorks:
      'When you run docker run -p 8080:80 nginx:alpine, a precisely ordered sequence of events unfolds across the Docker stack. First, the Docker CLI parses the command arguments and connects to the Docker daemon via the Unix domain socket at /var/run/docker.sock (or via TCP on Windows). The CLI sends a container create request to the daemon\'s REST API.\n\nThe daemon (backed by containerd) checks the local image store for nginx:alpine. If not found, it contacts the configured registry (Docker Hub by default): first resolving the tag to a manifest digest by fetching https://registry-1.docker.io/v2/library/nginx/manifests/alpine, then downloading the manifest (which lists all layer digests and their sizes), then checking which layers are already present in the local content store, and finally pulling only the missing layers (each layer is a gzip-compressed tar stream, decompressed and stored as an uncompressed tar in containerd\'s content store).\n\ncontainerd then prepares the container: it creates the overlay2 snapshot (the writable container layer stacked on top of all the image\'s read-only layers using OverlayFS — the merged mount point is what the container process sees as its root filesystem). The OCI runtime spec is generated (a config.json file specifying the process entrypoint, environment variables, namespace configuration, cgroup paths, and mount points).\n\ncontainerd calls runc (via an exec call passing the OCI bundle directory) to create the actual container. runc performs the namespace surgery: it calls unshare() to create new PID, network, mount, UTS, and IPC namespaces; then calls pivot_root() to make the overlay filesystem the container\'s root; then sets up the mount namespace with /proc, /sys, /dev, and any bind mounts from the container spec; creates and configures the cgroup hierarchy (memory limit, CPU quota, blkio throttle); drops Linux capabilities (down to the default set or custom set from security options); and finally calls execve() to replace the runc process with the container entrypoint (nginx -g "daemon off;"). The nginx process is now PID 1 in its own PID namespace.\n\nThe Docker daemon sets up networking: it creates a veth pair (vethXXXXXX on the host side, eth0 inside the container\'s network namespace), attaches the host-side veth to the docker0 bridge, assigns a 172.17.x.x IP to the container\'s eth0, and sets up default routing (0.0.0.0/0 via 172.17.0.1 — the docker0 bridge IP).\n\nPort mapping: the daemon adds an iptables DNAT rule to the DOCKER chain in the nat table: traffic arriving on host interface port 8080 (any protocol, destination the host IP) is DNAT\'d to the container IP on port 80. Traffic from the container to the internet is handled by an iptables MASQUERADE rule that rewrites the source IP from the container\'s 172.17.x.x to the host\'s external IP.\n\nThe nginx process is now running as PID 1 in its PID namespace, listening on port 80 of its eth0 interface, with the host iptables routing incoming traffic on port 8080 to it. Any write the nginx process makes inside the container filesystem is captured by the OverlayFS writable layer and does not modify the underlying image layers. When the container is stopped, the writable layer is discarded (unless docker commit was run).',
    failures: [
      {
        name: 'Image Layer Cache Invalidation Causing Slow Builds',
        cause: 'COPY . . instruction placed before npm install (or pip install, maven package) in the Dockerfile means any change to any source file — including README.md, a test file, or a comment — invalidates the dependency installation layer and forces a full package download on every build.',
        symptom: 'CI builds that should take 2 minutes take 15-20 minutes. npm install or pip install runs from scratch on every pipeline run despite package.json not having changed. Build logs show "cache miss" for the dependency installation step even on trivially different commits.',
        fix: 'Reorder Dockerfile instructions to copy dependency manifests first: COPY package.json package-lock.json ./ then RUN npm ci then COPY . . This way the npm ci layer is only invalidated when package.json or package-lock.json changes — not when any source file changes. Use BuildKit cache mounts (RUN --mount=type=cache,target=/root/.npm npm ci) as a further optimisation that persists the npm download cache between builds in the build daemon\'s cache, not in image layers.',
        severity: 'medium',
      },
      {
        name: 'Container Runs as Root in Production',
        cause: 'Default Dockerfile behaviour (no USER instruction) runs the container process as root (UID 0). Combined with a writable root filesystem and no capability restrictions, a container escape (via a vulnerable library, a path traversal, an RCE in the application) grants the attacker full root privileges on the container — and depending on the kernel version and available exploits, potentially full root on the host.',
        symptom: 'kubectl exec or docker exec shows whoami returns root. Process listing inside the container shows UID 0. Security scanners (Trivy, Snyk, kube-bench) flag "Container running as root" as a HIGH or CRITICAL finding.',
        fix: 'Add USER 1001:1001 as the last configuration instruction in the Dockerfile (after all root-requiring operations like package installation are complete). For Kubernetes: set securityContext.runAsNonRoot: true (kubelet rejects the container if the image USER resolves to UID 0) and securityContext.runAsUser: 1001. Set readOnlyRootFilesystem: true and mount writable directories explicitly as emptyDir volumes. Drop all Linux capabilities and add back only those specifically required by the application.',
        severity: 'critical',
      },
      {
        name: 'OOM Kill — Container Killed Without Warning',
        cause: 'The container process exceeds its configured memory limit (--memory flag or Kubernetes resources.limits.memory). The Linux kernel\'s OOM killer sends SIGKILL directly to the container\'s main process — there is no SIGTERM, no grace period, no opportunity for graceful shutdown. Data in memory is lost, in-flight requests are dropped, database connections are abandoned without proper close.',
        symptom: 'Container exits with exit code 137 (128 + SIGKILL signal 9). kubectl describe pod shows OOMKilled in the Last State of the container status. System journal or /var/log/syslog on the node shows "oom-kill event in group" messages. Application shows sudden restarts in metrics with no corresponding error in application logs (because the application had no opportunity to log anything).',
        fix: 'Set memory limits at p99 + 20% headroom of observed peak usage (kubectl top pod, CloudWatch Container Insights). For JVMs: set -XX:MaxRAMPercentage=75 instead of hard -Xmx values so the JVM respects the cgroup memory limit proportionally. For Node.js: set --max-old-space-size to 75% of the container memory limit. Configure the application to handle SIGTERM gracefully (complete in-flight requests, flush buffers, close DB connections) within the terminationGracePeriodSeconds window — the OOMKill happens before SIGTERM, so the real fix is ensuring the memory limit is set correctly rather than relying on graceful shutdown.',
        severity: 'high',
      },
      {
        name: 'Docker Socket Mount — Privilege Escalation',
        cause: 'Mounting the Docker daemon socket (-v /var/run/docker.sock:/var/run/docker.sock) into a container gives that container full control of the Docker daemon on the host. Any process inside the container can run docker run --privileged -v /:/host ubuntu chroot /host bash to get an unrestricted root shell on the host. This pattern is widely used in CI/CD systems for "Docker-in-Docker" builds and is a critical vulnerability in those environments.',
        symptom: 'Security scanners (Trivy, kube-bench, Falco) alert on Docker socket mount. Any container with the socket mount can list and inspect all other containers, read their environment variables (including secrets), stop or kill any service on the host, and launch new privileged containers.',
        fix: 'Never mount the Docker socket in production containers or Kubernetes pods. For CI/CD image builds: use Kaniko (builds OCI images from a Dockerfile inside a container without requiring Docker daemon access, running as a non-root user), BuildKit in rootless mode (docker buildx build via a BuildKit daemon that does not require the Docker socket), or img (another daemonless builder). For Kubernetes: use Tekton Pipelines with Kaniko tasks or GitHub Actions with OIDC authentication to build and push images without ever exposing the socket to a container workload.',
        severity: 'critical',
      },
    ],
    a: {
      v: 'standardised shipping container for software',
      t: 'Containers Are Standardised Shipping Containers for Software',
      tx: 'Before containers, deploying software was like moving furniture between houses: the movers (operations team) would show up, and nothing quite fit through the doors. The sofa that lived perfectly in the developer\'s living room (Ubuntu 18.04, Node 14, OpenSSL 1.0) refused to navigate the narrow hallway of the production server (CentOS 7, Node 12, OpenSSL 1.1). The deployment scripts that worked perfectly in staging failed in production because of a subtly different library version installed by a different team six months ago. "Works on my machine" was not a joke — it was a genuine diagnosis. Every server was configured by hand, accreting differences over time, becoming a unique snowflake that nobody fully understood.\n\nDocker is the shipping container. In 1956, Malcolm McLean standardised the steel shipping container, and the global shipping industry was transformed: it no longer mattered whether the ship was Japanese, the crane was German, or the truck was American — every crane, ship, and truck in the world could handle the same 20-foot or 40-foot steel box. Cargo that previously required a week of longshoremen manually transferring goods could now be loaded in hours by a single crane. Global trade exploded.\n\nA Docker image is that standardised container: your application, its runtime (Node 20.x), its system libraries (OpenSSL 3.x), its configuration, packed into a sealed, immutable box. Any container runtime in the world — containerd on a developer\'s MacBook (via Docker Desktop), containerd in a CI runner, containerd on an EKS node in us-east-1 — can unpack and run that box identically. The contents are guaranteed by a cryptographic digest (SHA256). "Works on my machine" becomes "works in the image, works everywhere the image runs."\n\nThe image layers are like flat-packed furniture: the base layer (node:20-alpine — the IKEA KALLAX frame) is shared by every team\'s images. Only the unique top layers (your application code — the boxes and dividers you configured) are custom. When Docker Hub pushes an update to node:20-alpine, all images that share that base layer get the update with zero additional storage. When your engineer fixes a bug and pushes a new image, only the changed layer (typically the COPY . . source layer — a few kilobytes of diff) is transmitted to the registry; all the shared base layers are already present on every node.\n\nThe OCI standard is the ISO specification for shipping containers. Just as any ISO 668-compliant container fits any ISO-compliant crane, any OCI-compliant image runs on any OCI-compliant runtime: Docker, containerd, podman, CRI-O. The registry (ECR, Docker Hub, GHCR) is the port: a standardised HTTP API for pushing and pulling images, protected by authentication, with lifecycle policies to retire old versions. The Kubernetes cluster is the shipping terminal: automated cranes (the scheduler) deciding which ship (node) each container (pod) goes on, automatically moving cargo when a ship is drydocked (node maintenance) or sinks (node failure).',
      s: 'The number one Docker security mistake is running containers as root. The number one performance mistake is not ordering Dockerfile layers for cache hit optimisation. These two changes alone — adding USER 1001:1001 near the end of your Dockerfile, and reordering COPY/RUN so dependency installation comes before source code copying — improve security posture and build time by 80% for most teams, and they take less than five minutes to implement. The second-order insight: once you understand that Docker\'s build cache is invalidated at the first changed layer and all subsequent layers are rebuilt, you start thinking about Dockerfile instructions as a sorted list from "changes least frequently" to "changes most frequently" — base image at the top (changes monthly), OS packages (changes weekly), dependency manifests (changes when you add a library), application source code (changes every commit). This mental model makes cache optimisation intuitive rather than a set of rules to memorise.',
    },
    te: {
      def: 'Docker is a platform for building, distributing, and running OCI-compliant container images. Technically: an image is a stack of content-addressed, read-only filesystem layers (stored as gzip-compressed tar archives) described by an OCI Image Manifest (JSON document listing layer digests, media types, and image configuration). The image configuration records the CMD, ENTRYPOINT, ENV, and EXPOSE metadata. At runtime, containerd (the CRI-compliant container runtime used by Kubernetes) creates an overlay2 snapshot — an OverlayFS union mount with the image layers as lower dirs (read-only) and a new writable upper dir for the container — producing a merged filesystem view that is the container\'s root. runc is called with the OCI runtime spec (config.json) to create the container process in new Linux namespaces (PID, network, mount, UTS, IPC, optionally user) and configure cgroup limits (memory, CPU, blkio). The container process is the single process that replaces runc (via exec), running as PID 1 in its PID namespace. The OCI spec is maintained by the Open Container Initiative (a Linux Foundation project), ensuring that images built with Docker, Podman, Buildah, Kaniko, or ko are interchangeable across all OCI-compliant runtimes. BuildKit extends this with a Dockerfile frontend plugin architecture, SBOM attestation support, and provenance metadata stored as OCI referrers alongside the image manifest.',
      types: [
        {
          n: 'Docker Engine (Docker Desktop on Mac/Windows)',
          d: 'The original Docker runtime, now backed by containerd internally. Docker Desktop on Mac and Windows runs a lightweight Linux VM (using Apple Hypervisor Framework on Mac, Hyper-V on Windows) since macOS and Windows don\'t have native Linux kernel namespaces. Includes Docker Compose, Docker BuildKit, and a local Kubernetes cluster option. The standard choice for developer workstations.',
        },
        {
          n: 'Podman',
          d: 'Red Hat\'s daemonless container runtime that is fully OCI and Docker CLI compatible. Runs without a daemon process (containers are child processes of the podman command itself), supports rootless containers natively (user namespaces enabled by default), and does not require root to run containers. podman-compose provides Docker Compose compatibility. Default in RHEL 8+ and Fedora.',
        },
        {
          n: 'containerd',
          d: 'The CNCF-graduated container runtime used directly by Kubernetes via the CRI gRPC interface. Previously embedded inside Docker, now a standalone project that Docker itself uses as its runtime. The standard container runtime for EKS, GKE, and most managed Kubernetes offerings (Docker runtime support was removed from Kubernetes in 1.24). Manages image pulling, storage, and container lifecycle via the containerd API.',
        },
        {
          n: 'Kaniko',
          d: 'A Google-built tool for building container images inside Kubernetes or CI containers without the Docker daemon (no socket mount required). It executes Dockerfile instructions in userspace inside a container, creating and pushing image layers directly to a registry. The standard choice for secure Kubernetes-native CI/CD image builds where giving CI pods access to the Docker socket is unacceptable.',
        },
        {
          n: 'Buildah',
          d: 'Red Hat\'s tool for building OCI images without a daemon, designed to work alongside Podman. Allows granular control over image construction via shell commands (not just Dockerfiles) and integrates with Skopeo for image copying across registries. Supports rootless builds and is the build backend used by OpenShift\'s internal build system.',
        },
      ],
      when: 'Use Docker (containerisation in general) for: any workload that will run in Kubernetes, ECS, or any container orchestrator — containerisation is the prerequisite; local development environments that need to precisely replicate production dependencies without polluting the developer\'s machine with language runtimes and databases; CI/CD pipelines where build reproducibility is critical — container images guarantee the same build environment on every run; packaging microservices with all their dependencies for distribution. Consider alternatives when: the workload needs Windows Server containers (requires Windows nodes, different tooling), the workload needs GPU passthrough with high-performance requirements (containers add latency for GPU workloads vs bare metal), or the workload is a monolithic legacy application that cannot be containerised without significant refactoring and the organisation lacks the resources to do so.',
      trade: 'Portability vs performance: containers are near-native for CPU-bound workloads (no hypervisor overhead), but the OverlayFS layer stack adds I/O latency for disk-intensive applications (databases, log-heavy services). For I/O-intensive workloads, use volume mounts directly to host paths or cloud storage. Image immutability vs operational flexibility: immutable images that are rebuilt and redeployed for every configuration change are more reliable and auditable than mutable servers, but require a mature CI/CD pipeline and image registry strategy. The investment pays off at scale. Small images vs build complexity: minimal base images (distroless, scratch) reduce attack surface and pull time but require more sophisticated multi-stage Dockerfiles and can break applications that assume standard tools (shell, curl, ls) are present. Layer caching vs reproducibility: aggressive layer caching improves build speed but pinning base images to digests (not mutable tags) is necessary to ensure builds remain reproducible when base images are updated. The right balance is cache image layers aggressively within a build but always pin the base image to a specific digest in production.',
      code: `# ============================================================
# Production multi-stage Dockerfile for a Node.js application
# ============================================================

# ---- Stage 1: Install production dependencies only ----
# Use a specific version pinned to a digest for full reproducibility.
# Alpine variants are ~50MB vs ~900MB for the debian-based default.
# The 'deps' stage is cached as long as package.json/package-lock.json are unchanged.
FROM node:20-alpine AS deps

# Set working directory for all subsequent instructions in this stage
WORKDIR /app

# Copy ONLY the dependency manifests first.
# This is the critical cache optimisation: if only source code changes,
# this layer and the npm ci layer below are served from cache —
# the expensive npm install step is skipped entirely.
COPY package.json package-lock.json ./

# npm ci: clean install from package-lock.json (deterministic, no version drift).
# --only=production: exclude devDependencies from the production image.
# Using BuildKit cache mount: npm download cache persists between builds in the
# build daemon's cache, not in any image layer — zero image size cost.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production


# ---- Stage 2: Build (TypeScript compilation, asset bundling) ----
# Separate build stage uses devDependencies (tsc, webpack, etc.)
# that will NOT be present in the final production image.
FROM node:20-alpine AS build

WORKDIR /app

# Copy prod deps from stage 1 (already installed)
COPY --from=deps /app/node_modules ./node_modules

# Copy package files (needed by tsc for tsconfig resolution)
COPY package.json tsconfig.json ./

# Now copy source — this layer is only invalidated when source changes,
# not when package.json changes (the install layer above handles that).
COPY src/ ./src/

# Run the TypeScript compiler (or webpack, vite, etc.)
# Output goes to /app/dist
RUN npm run build


# ---- Stage 3: Production runtime image ----
# Start from scratch — only the files we explicitly copy are in this image.
# node:20-alpine contains Node.js runtime but no build tools, no shell
# (in distroless) — minimal attack surface.
FROM node:20-alpine AS production

# Add metadata labels for OCI image spec compliance and traceability
LABEL org.opencontainers.image.source="https://github.com/org/api-service"
LABEL org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Create a non-root user and group to run the application.
# Alpine uses addgroup/adduser syntax (not groupadd/useradd).
# UID/GID 1001 is arbitrary — choose any value > 999 to avoid system UIDs.
RUN addgroup -g 1001 -S nodegroup && \
    adduser -u 1001 -S nodeuser -G nodegroup

# Copy production node_modules from the deps stage (no devDependencies)
COPY --from=deps --chown=nodeuser:nodegroup /app/node_modules ./node_modules

# Copy compiled application from the build stage
COPY --from=build --chown=nodeuser:nodegroup /app/dist ./dist

# Copy any static assets or config files needed at runtime
# (but NOT source code, NOT .env files, NOT secrets)
COPY --chown=nodeuser:nodegroup package.json ./

# Switch to non-root user for all subsequent instructions and at runtime.
# This is the single most impactful security change in a Dockerfile.
# Combined with readOnlyRootFilesystem in K8s securityContext, this
# prevents nearly all container escape → host compromise attack chains.
USER nodeuser:nodegroup

# Document the port the application listens on.
# EXPOSE is documentation only — it does not publish the port.
# Port mapping is done at docker run or in Kubernetes Service/Ingress.
EXPOSE 3000

# Healthcheck: Docker will run this command and mark the container
# unhealthy if it fails. In Kubernetes, use readinessProbe instead —
# K8s ignores HEALTHCHECK instructions. Useful for docker-compose local dev.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

# CMD uses exec form (JSON array) — the process runs directly, not via shell.
# This ensures the Node.js process receives SIGTERM directly (not via sh -c)
# so graceful shutdown handlers (process.on('SIGTERM', ...)) work correctly.
CMD ["node", "dist/index.js"]`,
      rw: {
        ex: [
          'Netflix runs all of its microservices (800+ services) in Docker containers on AWS EC2 instances managed by their Titus container management platform (Netflix\'s in-house container orchestrator, now open-sourced). Every code change triggers a CI pipeline that builds a new Docker image, runs Chaos Monkey-style fault injection tests in containers, and deploys via immutable instance replacement — no SSH, no in-place changes.',
          'Shopify migrated from a monolithic Ruby on Rails application to a set of Docker containers, using a strategy they call "component extraction" — identifying bounded contexts within the monolith and extracting them as independent services with Docker-based CI/CD pipelines. Their internal PaaS (built on Kubernetes) runs hundreds of containerised services and handles millions of requests per minute during peak shopping events.',
          'Cloudflare uses containers extensively for their edge Workers runtime and for internal service deployment across their 300+ PoPs globally. They contribute significantly to the OCI runtime specification and use custom low-overhead container runtimes for latency-sensitive edge functions where container startup time is a critical performance metric.',
          'GitHub Actions runs every CI/CD workflow inside Docker containers — the "runs-on: ubuntu-latest" directive spins up a fresh container environment for each job, guaranteeing isolation between workflows and eliminating the "works on the runner but not anywhere else" problem. GitHub\'s internal services are also containerised and deployed via Kubernetes on their owned and leased data center infrastructure.',
        ],
        cs: 'A financial services startup with 15 engineers migrated from "works on my machine" chaos to containerised deployments over 8 weeks. Initial state: three developers, three different Node versions on their laptops; staging ran on a bare EC2 instance where someone had manually installed dependencies six months ago and nobody remembered exactly what was installed; production was a different EC2 instance, also manually configured, that had drifted from staging in at least three undocumented ways. Deployments were SSH + git pull + pm2 restart and took 45 minutes with a 20-minute period where the old code had stopped and the new code was starting (effectively a 20-minute partial downtime on every deploy). Week 1-2: wrote Dockerfiles for the three services (a Node.js API, a Python data processing worker, a React frontend served by nginx). Immediately discovered a production bug caused by a Node.js version difference — fixed by pinning node:18-alpine in the Dockerfile. Week 3-4: set up ECR, wrote GitHub Actions workflows to build and push images on every main branch merge, implemented semantic versioning via git tags triggering tagged image pushes. Week 5-6: moved to Docker Compose on a single EC2 instance for staging (simpler than Kubernetes for a 15-person team), with separate compose files for development (with volume mounts for live code reload) and staging (from ECR images). Week 7-8: implemented zero-downtime deploys using an nginx upstream reload pattern and, later, moved production to ECS Fargate to eliminate node management entirely. Outcomes: deployment time dropped from 45 minutes to 4 minutes (image pull + task replacement). The "works on my machine" class of bugs was completely eliminated — the docker-compose up for local development uses the same base images as production. The Python worker that previously required a 10-page onboarding document to set up locally was reduced to docker-compose up. Security posture improved: all containers run as non-root, images are scanned by ECR Enhanced Scanning on push, and the production environment no longer has SSH enabled (deployments are fully automated via ECS task replacement).',
      },
    },
    interview: {
      q: 'Explain the difference between a Docker image and a container. Then explain what actually happens at the Linux kernel level when you start a container.',
      a: 'A Docker image is an immutable, layered filesystem snapshot stored in a registry. It is defined by an OCI Image Manifest — a JSON document that lists the ordered set of content-addressed layers (each layer is a SHA256-identified gzip-compressed tar archive of filesystem changes) and an image configuration (recording the CMD, ENTRYPOINT, ENV variables, working directory, and user). Critically, an image is a static artefact: it cannot run code, it cannot listen on ports, it has no process ID. It is the template. A container is a running instance of an image — a Linux process (or group of processes) with specific isolation properties created from that template. The relationship is like a class (image) and an object (container): you can instantiate the same image into multiple containers simultaneously, each with its own independent writable layer, its own process tree, its own network namespace, and its own lifecycle.\n\nAt the Linux kernel level, starting a container is a sequence of kernel system calls. The container runtime (runc, invoked by containerd) begins by calling clone() with a combination of flags: CLONE_NEWPID (new PID namespace — the container process will be PID 1 in this namespace), CLONE_NEWNET (new network namespace — own network stack), CLONE_NEWNS (new mount namespace — own filesystem tree), CLONE_NEWUTS (new UTS namespace — own hostname), CLONE_NEWIPC (new IPC namespace — own semaphores and shared memory), and optionally CLONE_NEWUSER (new user namespace for rootless containers — UID 0 in the container maps to an unprivileged UID on the host). The forked child process is now in all the new namespaces but still has the parent\'s filesystem view.\n\nNext, the mount namespace is configured: pivot_root() (or the older chroot()) changes the container\'s root filesystem to the OverlayFS merged mount of the image layers plus the writable container layer. /proc, /sys, and /dev are bind-mounted into the container namespace. Any volumes or bind mounts specified in the container config are mounted at this stage.\n\ncgroups are configured: the container runtime creates a cgroup hierarchy (under /sys/fs/cgroup/v2/container-id/) and writes the memory limit (memory.max), CPU quota (cpu.max = "100000 100000" for 1 CPU), and blkio throttle values. The container process\'s PID is written to the cgroup, enrolling it in resource accounting and enforcement.\n\nCapabilities are dropped: the container runtime uses prctl(PR_SET_SECUREBITS) and capset() to drop Linux capabilities from the container process\'s capability sets, leaving only the default set (or custom set if --cap-add/--cap-drop was specified).\n\nSeccomp profile is installed via prctl(PR_SET_SECCOMP) with a BPF filter that intercepts syscalls and allows or rejects them based on the seccomp policy.\n\nFinally, execve() is called to replace the runc process with the actual container entrypoint (nginx, node, python, etc.). This process is now PID 1 in its PID namespace — when it exits, the kernel sends SIGKILL to all other processes in that namespace, cleaning up the container automatically.',
      fu: [
        'What is the difference between COPY and ADD in a Dockerfile, and why should you almost always prefer COPY?',
        'Explain Docker\'s OverlayFS layer caching mechanism. How does the build cache key get computed for each instruction, and what causes cache invalidation?',
        'A container is running as root and its base image has a critical vulnerability in an installed package. Walk me through the attack path a malicious request could take to escalate from application RCE to host compromise.',
        'How does Docker networking work at the kernel level for two containers on the same host communicating with each other? Trace the packet path.',
        'What is a multi-stage Docker build and why does it matter for production image security and size? Give a concrete example with a compiled language.',
        'Explain the difference between CMD and ENTRYPOINT in a Dockerfile. What happens when both are set? What is the shell form vs exec form and why does exec form matter for signal handling?',
      ],
    },
  },
];
