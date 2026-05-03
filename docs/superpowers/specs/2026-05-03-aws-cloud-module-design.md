# AWS & Cloud Module — Design Spec
**Date:** 2026-05-03  
**Status:** Approved

---

## 1. Goal

Add a comprehensive AWS & Cloud module to System Design Lab that prepares engineers — specifically those with 5–15 years of experience — to confidently answer cloud architecture and infrastructure questions in any technical interview. The module covers networking fundamentals, AWS services, deployment patterns, security, and three full real-world AWS architecture walkthroughs.

Success looks like: a senior engineer who has used AWS for years but never studied it formally can read this module and immediately articulate trade-offs, failure modes, and design decisions at the principal/staff level.

---

## 2. Scope

### What's included
- 15 cloud concepts, each with full depth (analogy, technical, interview, components, diagrams, failure modes)
- 3 AWS Real World System scenarios
- 4 new animated diagram components
- New "Cloud" sidebar category

### What's NOT included
- AWS console walkthroughs or step-by-step tutorials
- Pricing calculators or exact cost tables (prices change; trade-off framing is used instead)
- Coverage of non-AWS clouds (GCP, Azure) — AWS is the reference, concepts are noted as transferable
- Deep Kubernetes internals (EKS is covered at the architecture/trade-off level)

---

## 3. Architecture Changes

### Files modified
| File | Change |
|---|---|
| `lib/data/categories.ts` | Add `{ id: 'cloud', label: 'Cloud', color: '#22d3ee' }` |
| `lib/data/concepts.ts` | Import and spread `CONCEPTS_CLOUD` from `concepts-cloud.ts` |
| `lib/data/realworld.ts` | Import and spread `REALWORLD_AWS` from `realworld-aws.ts` |

### Files created
| File | Contents |
|---|---|
| `lib/data/concepts-cloud.ts` | 15 `Concept` objects, cloud category |
| `lib/data/realworld-aws.ts` | 3 `RealWorldSystem` objects |
| `components/diagrams/VPCDiagram.tsx` | Animated VPC architecture diagram |
| `components/diagrams/DNSDiagram.tsx` | DNS resolution chain diagram |
| `components/diagrams/CloudArchDiagram.tsx` | 3-tier AWS production architecture |
| `components/diagrams/ServerlessDiagram.tsx` | Lambda + SQS + DynamoDB pipeline |

### No type changes
The existing `Concept` and `RealWorldSystem` interfaces in `lib/types.ts` cover everything needed. No modifications required.

### Color
`#22d3ee` (cyan-400) — distinct from the existing arctic-signal `#38bdf8` (blue), fits the "cloud/sky" semantic without clashing with any current category color.

---

## 4. The 15 Cloud Concepts

### Category: Cloud (`cat: 'cloud'`, `color: '#22d3ee'`)

#### Group 1 — Networking

**1. VPC (Virtual Private Cloud)**  
`id: 'vpc'` | Icon: 🏗️ | Tag: "Your private data center inside AWS"

- **Overview:** A VPC is a logically isolated section of the AWS cloud where you define your own IP address range, create subnets, configure route tables, and control what can talk to what. Every resource you launch in AWS lives inside a VPC whether you realize it or not.
- **Components:** CIDR Block, Availability Zones, Route Tables, Internet Gateway, VPC Peering, VPC Endpoints
- **How it works:** Walk through: creating a VPC with 10.0.0.0/16, splitting into /24 public and /24 private subnets per AZ, attaching an IGW to the VPC, adding a 0.0.0.0/0 route to public subnet route tables, and deploying resources
- **Decision:** Use a VPC for any production workload. Use default VPC only for personal experiments. Design CIDR ranges upfront — you can't change a VPC's CIDR once it's deployed and overlapping ranges block VPC peering.
- **Failures:** CIDR overlap blocks VPC peering; missing route in route table causes silent connectivity failure; VPC endpoints misconfigured causing traffic to traverse public internet
- **Interview (senior):** "Design the VPC architecture for a multi-tenant SaaS where each tenant must have data isolation. How many VPCs? How do they communicate? How do you handle shared services?"
- **Follow-ups:** Transit Gateway vs VPC peering at scale; PrivateLink for service exposure; CIDR sizing for future growth; how AWS implements VPC isolation internally; cost implications of cross-AZ vs same-AZ traffic; shared services VPC pattern

---

**2. Subnets & CIDR**  
`id: 'subnets'` | Icon: 🗺️ | Tag: "The floors in your building — who can reach the lobby"

- **Overview:** Subnets divide a VPC's IP range into smaller segments. Public subnets have a route to the internet gateway; private subnets do not. CIDR notation (10.0.1.0/24) defines the IP range: the number after the slash tells you how many bits are fixed, so /24 gives you 256 addresses (251 usable — AWS reserves 5).
- **Components:** Public Subnet, Private Subnet, CIDR Notation, Route Table, Availability Zone placement, Reserved IPs
- **How it works:** A /16 VPC (65,536 IPs) → split into /24 subnets (256 IPs each) across 2 AZs: 2 public (web tier), 2 private (app tier), 2 private (data tier). 6 subnets total. Public subnets get a route to IGW; private subnets get a route to NAT Gateway.
- **Decision:** Always use private subnets for databases and application servers. Use public subnets only for load balancers and NAT Gateways. Subnet size: /24 is a safe default for most workloads; use /28 (11 usable IPs) for small utility subnets.
- **Failures:** Subnets too small — running out of IPs when Auto Scaling launches new instances; public subnet used for databases by mistake; cross-AZ data transfer costs accumulating because NAT Gateway is in wrong AZ
- **Interview (senior):** "You're designing a VPC for a platform that will run 500 microservices in EKS, each needing its own ENI. How do you plan your CIDR to avoid exhaustion? What's the pod networking implication?"
- **Follow-ups:** IPv6 dual-stack subnets; EKS pod IP exhaustion and the /19 subnet requirement; secondary CIDR blocks; IPAM tools; how to expand a VPC CIDR after the fact

---

**3. Security Groups & NACLs**  
`id: 'security-groups'` | Icon: 🔒 | Tag: "Bouncers at the door vs CCTV on every floor"

- **Overview:** Security Groups are stateful firewalls attached to ENIs (network interfaces) — if you allow inbound port 443, the response traffic is automatically allowed out. NACLs (Network Access Control Lists) are stateless firewalls attached to subnets — you must explicitly allow both inbound AND outbound. Security Groups are the primary tool; NACLs are for subnet-level blast radius control.
- **Components:** Security Group inbound/outbound rules, NACL inbound/outbound rules, Stateful vs stateless, Rule evaluation order, Default SG, Default NACL
- **How it works:** Traffic flow: internet → NACL inbound check → Security Group inbound check → EC2 instance → Security Group outbound check (stateful: always passes for established connections) → NACL outbound check
- **Decision:** Security Groups for everything. NACLs only when you need to explicitly block a range of IPs at the subnet boundary (e.g., blocking a known malicious CIDR range or enforcing hard egress restrictions for compliance). Never open 0.0.0.0/0 on inbound for SSH/RDP.
- **Failures:** NACL ephemeral port range not opened (1024–65535) causing stateless return traffic to be blocked; Security Group references itself causing circular dependency; overly permissive 0.0.0.0/0 inbound left from debugging
- **Interview (senior):** "You've locked down your VPC but a penetration test finds your application servers are reachable directly from the internet. Walk me through every layer you'd audit to find the misconfiguration."
- **Follow-ups:** Security Group vs WAF vs Shield vs Network Firewall — which layer for which threat; reference another security group vs CIDR range trade-offs; zero-trust architecture inside a VPC; how Security Groups implement rules at the hypervisor level

---

**4. NAT Gateway & Internet Gateway**  
`id: 'nat-gateway'` | Icon: 🚪 | Tag: "The front door vs the one-way mail slot"

- **Overview:** An Internet Gateway (IGW) is a horizontally scaled, fully managed gateway that allows resources with public IPs to communicate bidirectionally with the internet. A NAT Gateway allows resources in private subnets (no public IP) to initiate outbound internet connections (e.g., pull OS updates, call external APIs) without being reachable from the internet. Traffic flow in → NAT Gateway translates the source IP to its own Elastic IP → internet.
- **Components:** Internet Gateway, NAT Gateway, Elastic IP, Route table entry (0.0.0.0/0), NAT Instance (legacy), Egress-Only Internet Gateway (IPv6)
- **How it works:** Private EC2 wants to reach api.stripe.com → checks route table → 0.0.0.0/0 → NAT Gateway in public subnet → IGW → internet → response returns to NAT Gateway → translated back to private EC2 IP
- **Decision:** Use NAT Gateway (managed) over NAT Instance (self-managed EC2) for any production workload. Deploy one NAT Gateway per AZ to avoid cross-AZ data transfer charges. Use VPC Endpoints to bypass NAT Gateway for AWS services (S3, DynamoDB) — saves money and latency.
- **Failures:** Single NAT Gateway in one AZ — whole AZ failure kills private subnet internet access for all AZs routed through it; NAT Gateway data processing costs exceeding expectations (charged per GB); forgetting to create NAT Gateway after creating private subnet
- **Interview (senior):** "Your NAT Gateway costs jumped from $200/month to $4,000/month after a new service launched. How do you diagnose and fix it?"
- **Follow-ups:** VPC Endpoints vs NAT Gateway for AWS service traffic; NAT Gateway bandwidth limits; PrivateLink architecture; IPv6 and why NAT is not needed; cost optimization with Gateway Load Balancer

---

**5. Ports & Protocols**  
`id: 'ports-protocols'` | Icon: 🔌 | Tag: "The agreed language two machines use before they can talk"

- **Overview:** A port is a 16-bit number (0–65535) that identifies a specific process or service on a machine. Protocols define the rules of communication. TCP (Transmission Control Protocol) guarantees delivery and order — used for HTTP, HTTPS, SSH, databases. UDP (User Datagram Protocol) is fire-and-forget — used for DNS, video streaming, gaming. Knowing ports is the foundation for reading logs, configuring firewalls, and debugging connectivity.
- **Components:** Well-known ports (0–1023), Registered ports (1024–49151), Ephemeral ports (49152–65535), TCP handshake, UDP datagram, ICMP (ping)
- **Key ports every senior engineer must know:**

  | Port | Protocol | Service |
  |------|----------|---------|
  | 22 | TCP | SSH |
  | 25 | TCP | SMTP (email sending) |
  | 53 | TCP/UDP | DNS |
  | 80 | TCP | HTTP |
  | 443 | TCP | HTTPS |
  | 3306 | TCP | MySQL/Aurora |
  | 5432 | TCP | PostgreSQL |
  | 6379 | TCP | Redis |
  | 27017 | TCP | MongoDB |
  | 8080 | TCP | HTTP alternate / dev servers |

- **How it works:** TCP three-way handshake: SYN → SYN-ACK → ACK. After handshake, data flows. Client uses an ephemeral port (randomly assigned high port) as the source, destination uses the well-known port. This is why NACLs must allow return traffic on ephemeral port range 1024–65535.
- **Decision:** Always specify exact ports in Security Group rules — never open port ranges like 0–65535. Use security group references (by ID, not CIDR) between tiers in the same VPC.
- **Failures:** NACLs blocking return traffic on ephemeral port range; database port left open to 0.0.0.0/0; forgetting that some databases (MongoDB, Redis) have no auth by default on their default ports
- **Interview (senior):** "A service your team deploys can't connect to the RDS instance. You have VPC Flow Logs enabled. Walk me through exactly what you check and what a successful vs blocked connection looks like in the logs."
- **Follow-ups:** VPC Flow Logs ACCEPT vs REJECT; TCP vs UDP choice for your own protocol design; how HTTPS terminates at ALB vs end-to-end TLS; port scanning and security implications; mTLS and certificate-based auth vs port-level controls

---

#### Group 2 — DNS & Delivery

**6. DNS & How the Internet Routes Traffic**  
`id: 'dns'` | Icon: 📖 | Tag: "The phone book the whole internet shares"

- **Overview:** DNS (Domain Name System) translates human-readable domain names (stripe.com) into IP addresses (151.101.1.195). Without DNS, every user would need to memorize IP addresses. The system is hierarchical and distributed: root servers → TLD servers (.com, .io) → authoritative nameservers (your domain's DNS provider). Results are cached at every level using TTL (Time To Live) to reduce load.
- **Components:** DNS Resolver (recursive), Root Nameservers (13 clusters), TLD Nameservers, Authoritative Nameservers, TTL, DNS Record Types
- **Record types every engineer must know:**

  | Record | Purpose | Example |
  |--------|---------|---------|
  | A | Domain → IPv4 address | api.stripe.com → 3.209.1.100 |
  | AAAA | Domain → IPv6 address | api.stripe.com → 2600:1f18::1 |
  | CNAME | Domain → another domain | www.stripe.com → stripe.com |
  | MX | Mail server for domain | stripe.com → mail.stripe.com |
  | TXT | Arbitrary text (SPF, DKIM, domain verification) | "v=spf1 include:..." |
  | NS | Authoritative nameservers for domain | stripe.com → ns1.awsdns.com |
  | SOA | Start of Authority — zone metadata | — |
  | ALIAS/ANAME | Like CNAME but at zone apex (root domain) | stripe.com → ALB DNS name |

- **How it works:** Browser checks local cache → OS cache → recursive resolver (ISP or 8.8.8.8) → root server ("ask .com TLD") → TLD server ("ask ns1.awsdns.com") → authoritative nameserver → returns A record → cached at resolver for TTL duration
- **Decision:** Use low TTLs (60s) before a planned migration, then raise to 300–3600s for stability. Never use a CNAME for a root domain (stripe.com, not www.stripe.com) — use ALIAS/ANAME instead because CNAME at zone apex breaks MX records.
- **Failures:** High TTL during a migration — old IP cached for hours after you changed it; CNAME chain too deep (CNAME → CNAME → CNAME) adding latency; DNS propagation delay during incident because TTL was 86400
- **Interview (senior):** "Your deployment updated the application server IP but users are still hitting the old server 2 hours later. The DNS record was changed. What are the 5 places the old IP could be cached and how do you force resolution of each?"
- **Follow-ups:** DNSSEC and why most companies don't use it; DNS over HTTPS (DoH) and its security implications; split-horizon DNS (internal vs external resolution); how DNS-based load balancing works; anycast vs unicast for DNS

---

**7. Route 53**  
`id: 'route53'` | Icon: 🛣️ | Tag: "AWS's DNS that also knows when your server is dead"

- **Overview:** Route 53 is AWS's managed DNS service. What makes it more than just DNS: health checks that remove unhealthy endpoints from DNS responses, routing policies (latency, geolocation, weighted, failover), private hosted zones for internal VPC DNS resolution, and domain registration. The "53" refers to port 53 — the DNS port.
- **Components:** Hosted Zone (public vs private), Record Sets, Health Checks, Routing Policies, Alias Records, Traffic Flow
- **Routing policies:**
  - **Simple:** One record, one target. No health checks.
  - **Weighted:** Split traffic by percentage (10% canary deploy, 90% stable).
  - **Latency:** Route to the region with lowest latency for that user.
  - **Failover:** Primary target with health check → automatic failover to secondary if health check fails.
  - **Geolocation:** Route by user's country or continent (data residency, language).
  - **Geoproximity:** Route by geographic distance with bias controls.
  - **Multivalue:** Up to 8 healthy records returned — basic load balancing in DNS.
- **How it works:** Route 53 health checker sends HTTP/HTTPS/TCP probes from multiple AWS regions every 10–30 seconds. If a threshold of checks fail, the endpoint is marked unhealthy and Route 53 stops returning it in DNS responses. Failover happens within ~60 seconds (TTL + health check evaluation time).
- **Decision:** Use Route 53 Alias records (not CNAME) when pointing to AWS resources (ALB, CloudFront, S3 website) — Alias records are free, resolve at AWS internal network, and work at the zone apex. Use private hosted zones for internal service discovery inside a VPC.
- **Failures:** Health check using wrong path or port — marking healthy endpoints as failed; TTL too high — failover takes longer than expected; forgetting to associate private hosted zone with VPC
- **Interview (senior):** "Design a multi-region active-active architecture for a fintech app with 99.99% availability SLA using Route 53. What routing policy do you use? What happens during a full region outage? What's your RPO and RTO?"
- **Follow-ups:** Route 53 Resolver for hybrid cloud DNS; DNS failover vs application-level failover trade-offs; Route 53 Traffic Flow for complex routing rules; cost of health checks at scale; how Route 53 Resolver endpoints work for on-premises DNS integration

---

**8. Cloudflare**  
`id: 'cloudflare'` | Icon: 🌩️ | Tag: "The security guard and speed booster sitting in front of your entire internet presence"

- **Overview:** Cloudflare operates a global network of 300+ edge locations that sit between your users and your origin servers. It provides: CDN (cache static content at the edge), DDoS protection (absorbs volumetric attacks up to 195 Tbps), WAF (blocks OWASP Top 10 at the edge before traffic reaches your infrastructure), DNS (fastest DNS resolver globally — 1.1.1.1), and Zero Trust network access. Unlike AWS services, Cloudflare is provider-agnostic — it works in front of AWS, GCP, on-prem, or anything with an IP.
- **Components:** Edge Network (PoPs), Anycast routing, DNS (1.1.1.1), CDN with cache rules, WAF, DDoS mitigation, Tunnel (Cloudflare Tunnel replaces VPN/bastion), Workers (edge compute), Zero Trust Access
- **How it works:** User's request hits the nearest Cloudflare PoP via anycast (DNS returns the same IP, BGP routing sends traffic to nearest node). At the edge: WAF rules checked → DDoS scored → cache hit? serve from edge. Cache miss? forward to origin, cache response per rules → return to user. Origin IP is never exposed publicly.
- **Decision:** Use Cloudflare in front of any public-facing app for free DDoS protection and CDN. Use it over AWS WAF when you want a single security layer across multi-cloud or hybrid infrastructure. Use Cloudflare Tunnel to expose internal services without opening firewall ports — superior to bastion hosts.
- **Failures:** Orange-cloud vs grey-cloud confusion (grey-cloud bypasses Cloudflare, exposes origin IP); cache rules too aggressive — serving stale auth responses; Cloudflare IP ranges not whitelisted on origin firewall — legitimate traffic blocked; accidentally caching POST responses
- **Interview (senior):** "Your app is getting a 500 Gbps DDoS attack that is volumetrically larger than your total AWS region bandwidth. Walk me through your mitigation strategy. Assume you have Cloudflare in front of your infrastructure."
- **Follow-ups:** Cloudflare Workers vs Lambda@Edge vs CloudFront Functions trade-offs; how anycast differs from unicast for DDoS resilience; origin pull vs visitor-facing TLS termination; Cloudflare Zero Trust replacing VPN; rate limiting at the edge vs application layer

---

**9. CloudFront & CDN**  
`id: 'cloudfront'` | Icon: ⚡ | Tag: "Warehouse your content 5ms from every user on Earth"

- **Overview:** A CDN (Content Delivery Network) is a globally distributed network of servers that cache content close to users. CloudFront is AWS's CDN with 450+ edge locations. What it caches: static assets (JS, CSS, images), API responses with cache-control headers, whole web pages. What it doesn't cache: unique per-request responses, POST bodies. CloudFront also terminates HTTPS at the edge, reducing TLS handshake latency.
- **Components:** Distribution, Origins (S3, ALB, custom), Behaviors (URL pattern → cache policy), Cache Policy (TTL, headers, cookies to cache on), Origin Request Policy, Invalidation, Lambda@Edge / CloudFront Functions, OAC (Origin Access Control)
- **How it works:** User requests /images/logo.png → CloudFront edge checks cache (HIT: return immediately) (MISS: forward to origin, get response, cache per TTL policy, return to user). Second user in same region gets it from edge cache — zero origin load.
- **Decision:** Use CloudFront for all public-facing static content — mandatory for any app serving users in multiple continents. Use OAC to restrict S3 bucket access to CloudFront only (never expose S3 bucket publicly for web hosting). Use CloudFront for API acceleration even if not caching — TLS termination at edge + AWS backbone routing improves API latency by 20–40%.
- **Failures:** Cache invalidation not triggered after deploy — users seeing old JS/CSS; missing Vary header causing one user's cached response served to another; S3 bucket accidentally public because OAC not configured; CloudFront distribution cost spike from large file downloads not using S3 Transfer Acceleration
- **Interview (senior):** "Your SPA (React app on S3 + CloudFront) is showing the old version to users 30 minutes after a deploy. You ran cache invalidation but it didn't help. Debug this."
- **Follow-ups:** CloudFront vs Cloudflare — when to use which; Lambda@Edge for auth at the edge; real-time logs vs standard logs trade-offs; how CloudFront signed URLs work for private content; cache key design for personalized content

---

#### Group 3 — Compute

**10. EC2 & Auto Scaling**  
`id: 'ec2'` | Icon: 💻 | Tag: "Rent exactly the server you need and scale it automatically"

- **Overview:** EC2 (Elastic Compute Cloud) is virtual machines on AWS — you pick CPU, RAM, storage, and OS. What makes it powerful: Auto Scaling Groups (ASGs) automatically add or remove instances based on load, keeping your fleet right-sized at all times. An ASG uses a Launch Template (AMI, instance type, SG, user data script) and a scaling policy (CPU > 70% → add 2 instances).
- **Components:** Instance types (t/m/c/r/g families), AMI (machine image), Launch Template, Auto Scaling Group, Scaling Policies (target tracking, step, scheduled), Elastic Load Balancer integration, Spot vs On-Demand vs Reserved, Placement Groups
- **Instance family guide:**
  - `t` (t3, t4g): Burstable — general web servers, dev environments
  - `m` (m6i, m7g): Balanced — production app servers
  - `c` (c6i, c7g): Compute-optimized — CPU-intensive: video encoding, ML inference
  - `r` (r6i, r7g): Memory-optimized — in-memory databases, large caches
  - `g` / `p`: GPU — ML training, graphics rendering
  - `i`: Storage-optimized — high IOPS databases
- **How it works:** ASG maintains min/max/desired count. Target tracking policy: "keep average CPU at 60%." CloudWatch monitors CPU → breaches target → ASG launches new instance from Launch Template → ALB registers instance → traffic flows. Scale-in: cooldown period prevents thrashing.
- **Decision:** Use EC2 when you need fine-grained control over the OS, persistent connections, or GPU access. Use `m6i` or `m7g` (Graviton) as default — Graviton3 offers 40% better price/performance for most workloads. Use Spot Instances for stateless, fault-tolerant workloads (batch jobs, CI runners) at 70–90% discount. Reserve 1-year for baseline capacity.
- **Failures:** ASG launch fails because AMI missing in AZ — all new instances fail; scale-out too slow due to warm-up period not configured; Spot Instance interruption not handled — in-flight requests dropped; EBS volume not encrypted by default
- **Interview (senior):** "You're running an ASG with on-demand instances and your AWS bill triples after a traffic spike. The spike lasted 4 hours but your bill for the day is 3× normal. What happened and how do you fix the architecture?"
- **Follow-ups:** Graviton (ARM) vs x86 trade-offs; EC2 instance metadata service v1 vs v2 (SSRF risk); placement groups for low-latency HPC; how AWS Live Migration works and when it causes performance jitter; EBS-optimized instances and storage throughput limits

---

**11. Lambda & Serverless**  
`id: 'lambda'` | Icon: ⚡ | Tag: "Run code without ever thinking about servers"

- **Overview:** Lambda runs your code in response to events — HTTP requests (via API Gateway), S3 uploads, SQS messages, DynamoDB streams, scheduled events (EventBridge). You pay only for execution time (ms) and invocations. No servers to manage, no OS to patch, automatic scaling to zero. The trade-offs: cold starts (first invocation after idle period takes 100ms–2s), execution time limit (15 minutes), and memory-CPU coupling (you can't add CPU without adding RAM).
- **Components:** Function (code + config), Trigger (event source), Execution Environment (sandbox), Cold Start, Concurrency (reserved vs provisioned), Layers, Destinations (success/failure routing), Lambda@Edge
- **How it works:** Event arrives → Lambda service checks if a warm execution environment exists → HIT: inject event, run handler, return response → MISS (cold start): spin up micro-VM (Firecracker), init runtime, download deployment package, run init code, then handle event. Warm environments are reused for ~15 minutes of idle time.
- **Cold start mitigation:** Provisioned Concurrency (pre-warm N environments — costs money), minimize package size, avoid VPC unless necessary (VPC adds 300ms+ to cold start), use Lambda SnapStart for JVM functions
- **Decision:** Use Lambda for: event-driven processing, APIs with variable/unpredictable traffic, cron jobs, fan-out processing. Avoid Lambda for: long-running jobs > 15 min, steady high-throughput APIs (EC2/ECS is cheaper at constant load), workloads needing persistent connections (WebSockets need adaptation), GPU workloads.
- **Failures:** Lambda timeout (15 min limit) — async jobs silently killed; concurrency limit (1000 default per region) — throttling under burst traffic; DLQ not configured — failed async invocations silently lost; Lambda in VPC — cold starts 10× longer due to ENI creation
- **Interview (senior):** "You have a Lambda function processing SQS messages. During peak load it starts throttling. Messages are building up in the queue. How do you diagnose and fix this without simply raising the concurrency limit?"
- **Follow-ups:** Firecracker microVM architecture and why it matters for multi-tenancy security; Lambda pricing vs EC2 break-even point calculation; idempotency design for Lambda + SQS; Lambda Destinations vs DLQ; how Lambda@Edge differs from CloudFront Functions (execution model, capabilities, cost)

---

**12. ECS, EKS & Containers**  
`id: 'containers'` | Icon: 📦 | Tag: "Ship your app in a box that runs anywhere"

- **Overview:** Containers (Docker) package an application with all its dependencies into a portable, isolated unit. ECS (Elastic Container Service) is AWS's native container orchestrator — simpler to operate. EKS (Elastic Kubernetes Service) runs Kubernetes — more powerful, more complex. Fargate is the serverless compute layer for both — no EC2 instances to manage; you pay per vCPU/memory used by containers.
- **Components:** Container Image (Docker), Task Definition (ECS) / Pod spec (EKS), Service (desired count, load balancer), Cluster (logical grouping), Fargate vs EC2 launch type, ECR (Elastic Container Registry), Service Discovery, Horizontal Pod Autoscaler (EKS)
- **ECS vs EKS decision:**
  - **ECS:** Simpler, AWS-native, deep AWS integrations (ALB, IAM roles per task, CloudWatch). Best for teams that want containers without Kubernetes complexity. 80% of container use cases.
  - **EKS:** When you need Kubernetes ecosystem (Helm, custom operators, CRDs), multi-cloud portability, or your team already knows k8s. 20% of cases. Much higher ops overhead.
  - **Fargate:** Use for unpredictable or bursty workloads (no idle EC2 cost). EC2 launch type for steady, high-throughput workloads (cheaper at scale, allows Spot).
- **How it works (ECS Fargate):** Task definition defines container image, CPU, memory, port mappings, IAM role, env vars. ECS Service maintains desired count (3 tasks). ALB target group routes to task IPs. Task fails health check → ECS stops it, starts replacement → zero-downtime rolling deploy.
- **Failures:** Image not found in ECR (wrong tag in task definition after push); task IAM role missing permissions — silent credential errors; container OOM (Out of Memory) kill — task definition memory limit too low; Fargate cold start time — new tasks take 30–60 seconds to start
- **Interview (senior):** "Your EKS cluster is running 500 pods across 50 nodes. You need to upgrade Kubernetes minor version (1.28 → 1.29) with zero downtime. Walk me through the entire process and what can go wrong."
- **Follow-ups:** ECS Service Connect vs App Mesh vs Istio for service mesh; how Fargate networking works (VPC networking for each task); container image scanning in ECR; Karpenter vs Cluster Autoscaler for EKS node scaling; Pod Disruption Budgets and why they matter for safe node draining

---

#### Group 4 — Storage & Data

**13. S3 & Object Storage**  
`id: 's3'` | Icon: 🗄️ | Tag: "An infinite filing cabinet that never loses a file"

- **Overview:** S3 (Simple Storage Service) stores objects (files) in buckets. It is not a filesystem — you can't partially update a file or lock it. You write whole objects, read whole objects. What makes it remarkable: 11 nines of durability (99.999999999%), virtually unlimited storage, globally unique bucket names, native versioning, lifecycle policies, event notifications, and direct hosting of static websites. Every major cloud-native architecture uses S3 as the backbone for data storage.
- **Components:** Bucket (namespace + config container), Object (key + data + metadata), Storage Classes, Versioning, Lifecycle Rules, Bucket Policies vs ACLs, Presigned URLs, Event Notifications, Object Lock (WORM), Multipart Upload, S3 Transfer Acceleration
- **Storage classes (cost vs retrieval trade-off):**
  - `S3 Standard`: Frequently accessed — hot data, web assets
  - `S3 Intelligent-Tiering`: Auto-moves between tiers based on access patterns
  - `S3 Standard-IA`: Infrequently accessed but fast retrieval — backups, DR
  - `S3 Glacier Instant`: Rare access, ms retrieval — compliance archives
  - `S3 Glacier Deep Archive`: Rarely/never accessed, hours retrieval — long-term archives at $0.00099/GB/month
- **How it works:** PUT /bucket/key → S3 replicates object across ≥3 AZs synchronously → returns 200 when durable. GET /bucket/key → S3 routes to nearest replica. Strong read-after-write consistency for all operations since December 2020 (previously eventual for LIST).
- **Decision:** S3 for all blob/object storage needs. Use CloudFront in front of S3 for public content (lower latency + lower cost). Use Presigned URLs for temporary secure access to private objects (never make buckets public for downloads). Use S3 Lifecycle rules to auto-transition objects to cheaper tiers — most companies save 40–60% on storage costs by doing this.
- **Failures:** Public bucket exposing sensitive data (most common AWS security breach); no versioning enabled — accidental delete or overwrite is permanent; large file upload failing without multipart upload; S3 request rate throttling on single prefix (> 5,500 GET/s, 3,500 PUT/s — solved by prefix randomization)
- **Interview (senior):** "You're building a data lake that will store 10 PB of raw logs, with 1% accessed daily for analytics and the rest cold. Design the S3 architecture including storage class strategy, access patterns, security controls, and cost optimization."
- **Follow-ups:** S3 Object Lock for compliance (WORM); S3 Replication (same-region vs cross-region) and consistency guarantees; S3 Select for querying data without downloading; event-driven architecture with S3 notifications; how S3 implements durability (erasure coding vs replication)

---

**14. RDS, Aurora & Managed Databases**  
`id: 'rds'` | Icon: 🗃️ | Tag: "The managed database that pages AWS at 3am instead of you"

- **Overview:** RDS (Relational Database Service) runs MySQL, PostgreSQL, MariaDB, Oracle, and SQL Server on managed infrastructure — AWS handles backups, patching, failover, and storage scaling. Aurora is AWS's own cloud-native relational database engine, compatible with MySQL and PostgreSQL, with a shared distributed storage layer that decouples storage from compute, enabling faster failover (< 30s vs 60–120s for RDS), up to 15 read replicas, and Aurora Serverless v2 for autoscaling compute.
- **Components:** DB Instance, Multi-AZ (synchronous standby for failover), Read Replicas (async replication for read scaling), Parameter Groups, Subnet Groups, Security Groups, Enhanced Monitoring, Performance Insights, Aurora Storage Layer (shared, auto-grows to 128 TB), Aurora Global Database
- **RDS vs Aurora decision:**
  - **RDS:** Simpler, cheaper at small scale, works for standard MySQL/Postgres workloads. Use for dev/test or when budget is primary concern.
  - **Aurora MySQL/Postgres:** Production workloads needing fast failover, more read replicas, or better storage performance. ~20% more expensive than RDS but 5× faster writes.
  - **Aurora Serverless v2:** Variable, unpredictable workloads. Scales compute in ACUs (Aurora Capacity Units) in seconds. Use for dev, low-traffic apps, or APIs with very spiky traffic.
  - **Aurora Global:** Multi-region < 1 second replication lag. Disaster recovery or global read scaling.
- **How it works:** Multi-AZ RDS: primary instance writes to EBS → synchronous replication to standby in different AZ → failover: Route 53 CNAME flips from primary to standby endpoint in 60–120s. Aurora: storage layer spans 3 AZs across 6 copies → writes go to 4 of 6 copies before acknowledgment → read replicas share same storage (no replication lag for reads).
- **Failures:** Read replica lag under heavy write load — reads returning stale data; Multi-AZ failover taking longer than expected due to long-running transactions; RDS storage auto-scaling hitting limit — instance becomes read-only; connection pool exhaustion at high concurrency (use RDS Proxy)
- **Interview (senior):** "Your Aurora PostgreSQL cluster is handling 50,000 connections from 500 Lambda functions. You're seeing connection timeout errors under load. Design the connection management architecture."
- **Follow-ups:** RDS Proxy and how it multiplexes connections; Aurora IOPS pricing vs standard RDS; how Aurora storage works internally (quorum writes); blue-green deployments for RDS major version upgrades; Point-in-Time Recovery (PITR) and RPO guarantees

---

#### Group 5 — Operations

**15. IAM & Cloud Security**  
`id: 'iam'` | Icon: 🔑 | Tag: "The permission system that controls everything in AWS"

- **Overview:** IAM (Identity and Access Management) controls who can do what in AWS. Every API call is checked against IAM. There are no exceptions. Principals (users, roles, services) have policies attached that allow or deny specific actions on specific resources. The most important mental model: prefer roles over users (roles don't have long-lived credentials), use least-privilege always, and never store AWS credentials in code.
- **Components:** IAM Users (human, long-lived credentials — avoid where possible), IAM Roles (temporary credentials via STS, assumed by services/humans), Policies (JSON documents: Allow/Deny + Action + Resource + Condition), Groups (attach policies to collections of users), STS (Security Token Service — issues temporary credentials), IAM Identity Center (SSO), Resource-based policies (S3 bucket policy, KMS key policy), Permission Boundaries
- **Key concepts:**
  - **Least privilege:** Grant only the permissions needed for the specific task. Start with zero and add.
  - **Roles for services:** An EC2 instance assumes an IAM role → gets temporary credentials via instance metadata → credentials auto-rotate every hour. Never embed access keys.
  - **Conditions:** Restrict policies by time, IP range, MFA status, source VPC. `aws:SourceIp`, `aws:RequestedRegion`, `aws:MultiFactorAuthPresent`.
  - **Permission evaluation order:** Explicit Deny always wins → check SCPs (Service Control Policies) → check identity-based policies → check resource-based policies → implicit Deny by default.
- **How it works:** SDK call → signs request with credentials (SigV4) → API endpoint validates signature → IAM evaluates all applicable policies → Allow or Deny → action executed or 403 returned. For roles: `sts:AssumeRole` → STS returns temporary AccessKeyId + SecretAccessKey + SessionToken (valid 1–12 hours).
- **Decision:** Use IAM Identity Center (SSO) for all human access to AWS accounts — no long-lived IAM user credentials for humans. Use IRSA (IAM Roles for Service Accounts) in EKS to give pods IAM permissions. Use Permission Boundaries to prevent privilege escalation when delegating IAM management.
- **Failures:** `AdministratorAccess` policy attached to Lambda function — blast radius of compromise is entire AWS account; AWS access key committed to Git — exposed to public internet within minutes (bots scan GitHub); cross-account role trust policy too permissive — allows any principal in account to assume it; SCPs blocking legitimate operations after organizational restructure
- **Interview (senior):** "A penetration test found your Lambda function's execution role has `iam:*` and `s3:*` on `*`. Beyond fixing this specific Lambda, describe the organizational changes you'd make to prevent this class of issue across 200 Lambda functions in a mature platform."
- **Follow-ups:** IRSA architecture in EKS (how OIDC federation works); AWS Organizations and SCPs for guardrails; detecting IAM misconfigurations at scale (IAM Access Analyzer); Attribute-Based Access Control (ABAC) vs Role-Based; how SigV4 signing works and why credential rotation matters

---

## 5. Real World AWS Scenarios

### Scenario 1: "Deploy a Production 3-Tier Web App on AWS"
`id: 'aws-3tier'` | Icon: 🏗️ | Color: `#22d3ee`

- **Scale:** 10M requests/day, 1,000 concurrent users peak, 99.9% uptime SLA
- **Functional requirements:** Serve dynamic API + React SPA, user authentication, PostgreSQL database, image uploads
- **Non-functional requirements:** < 200ms p99 API latency, < 50ms static asset TTFB, RTO < 5 minutes, RPO < 1 minute
- **Architecture:**
  1. Route 53 (latency routing + health checks)
  2. CloudFront (SPA + API caching, WAF, DDoS)
  3. ALB (HTTPS termination, path-based routing: `/api/*` → EC2, `/*` → S3)
  4. EC2 Auto Scaling Group in private subnets across 2 AZs (m7g.medium)
  5. Aurora PostgreSQL Multi-AZ in private subnets
  6. ElastiCache Redis for session storage and query caching
  7. S3 for user uploads + static SPA assets
  8. VPC: 10.0.0.0/16, 2 public subnets (ALB, NAT GW), 4 private subnets (EC2 + DB)
- **Deep dives:** Zero-downtime deployments (rolling update with health checks), Aurora failover behavior, ElastiCache eviction policy for session store, ALB slow target draining, CloudFront cache invalidation on SPA deploy
- **Decisions:** ALB vs NLB (ALB for HTTP layer 7 routing); Aurora vs RDS (Aurora for fast failover); Fargate vs EC2 (EC2 for consistent load + Spot capability); single CloudFront distribution vs separate (single: simpler; separate: better cache isolation)
- **Interview questions:** How do you handle a database failover with zero dropped connections? How do you deploy a breaking API change? How do you debug a 2-second latency spike visible only in p99?

---

### Scenario 2: "Build a Serverless Event Pipeline"
`id: 'aws-serverless'` | Icon: ⚡ | Color: `#22d3ee`

- **Scale:** 50M events/day (580/sec average, 5,000/sec peak burst), < 5 second end-to-end processing latency
- **Functional requirements:** Ingest events (user actions, webhooks), validate, enrich, persist, trigger downstream actions
- **Architecture:**
  1. API Gateway (HTTP API) → Lambda (ingest + validation) → SQS standard queue
  2. SQS → Lambda (processor, batch size 10) → DynamoDB (event store) + SNS (fan-out to subscribers)
  3. SQS Dead Letter Queue (DLQ) for failed messages after 3 retries
  4. EventBridge for scheduled reprocessing of DLQ
  5. CloudWatch alarms: queue depth > 10K, Lambda error rate > 1%, DLQ messages > 0
  6. X-Ray for distributed tracing across the pipeline
- **Deep dives:** Idempotency using DynamoDB conditional writes (put only if `event_id` not exists); Lambda concurrency reservation to protect downstream DynamoDB capacity; SQS visibility timeout sizing (must be > Lambda timeout × batch size); DLQ alerting and replay strategy; cold start optimization for ingest Lambda
- **Decisions:** SQS Standard vs FIFO (Standard: higher throughput, at-least-once; FIFO: exactly-once, ordering, but limited to 300 TPS per message group); DynamoDB vs Aurora (DynamoDB: scales to millions of writes/sec with zero operational overhead; Aurora: better for complex queries); SNS vs EventBridge for fan-out (EventBridge: content-based routing, schema registry, better for event-driven architectures)
- **Interview questions:** How do you guarantee exactly-once processing with SQS Standard? A Lambda function is processing SQS messages but DynamoDB is throttling — how do you handle backpressure without losing messages? How do you replay 10M events from the DLQ after fixing a processing bug?

---

### Scenario 3: "Multi-Region High-Availability Architecture"
`id: 'aws-multiregion'` | Icon: 🌍 | Color: `#22d3ee`

- **Scale:** 1B requests/day, global user base (Americas, Europe, Asia), 99.99% SLA (< 52 minutes downtime/year), RPO < 1 minute, RTO < 5 minutes
- **Functional requirements:** Serve users from nearest region, survive full regional outage automatically, no data loss on failover
- **Architecture:**
  1. Route 53 latency-based routing (3 regions: us-east-1, eu-west-1, ap-southeast-1) + health checks per region
  2. CloudFront global distribution in front of all 3 regions (origin failover: primary region → secondary)
  3. Per-region: ALB → ECS Fargate (stateless application tier)
  4. Aurora Global Database: primary in us-east-1, read replicas in eu-west-1 + ap-southeast-1 (< 1s replication lag)
  5. S3 Cross-Region Replication (CRR) for user-uploaded assets
  6. ElastiCache Global Datastore for Redis session replication
  7. Route 53 Application Recovery Controller (ARC) for controlled failover
- **Deep dives:** Active-active vs active-passive trade-offs; how to handle writes during regional failover (Route 53 ARC readiness checks before allowing traffic); Aurora Global promote to writer (< 1 minute) vs PITR restore trade-offs; testing DR with chaos engineering (AWS FIS — Fault Injection Simulator); cost modeling — 3-region active-active vs 2-region active-passive
- **Decisions:** Active-active vs active-passive (active-active: zero RTO but requires globally consistent writes, higher cost; active-passive: simpler data model, RTO ~5 min); Aurora Global vs DynamoDB Global Tables (Aurora Global for complex relational queries; DynamoDB Global for simple key-value at massive scale); Session stickiness vs stateless design (stateless always preferred for multi-region — sessions in ElastiCache or JWT)
- **Interview questions:** How do you prevent split-brain writes during a network partition between regions? Walk me through what happens end-to-end when us-east-1 goes down and your system fails over. How do you test your DR plan without taking production down?

---

## 6. Diagram Components

### `VPCDiagram.tsx`
Animated flow showing: Internet → IGW → Public Subnet (ALB + NAT GW) → Private Subnet (EC2) → Private Subnet (RDS). Two columns for 2 AZs. Highlights route table paths on hover. Shows what can and cannot reach the internet.

### `DNSDiagram.tsx`
Step-by-step animated resolution: Browser cache check → OS cache → Recursive Resolver → Root Nameserver → TLD Nameserver → Authoritative Nameserver → IP returned → cached. Each step lights up in sequence. Shows TTL countdown at each cache layer.

### `CloudArchDiagram.tsx`
Full 3-tier AWS architecture: User → Route 53 → CloudFront → ALB → EC2 ASG → Aurora + ElastiCache + S3. Each service shown with AWS service icon style. Animated request flow on load. Shows AZ separation.

### `ServerlessDiagram.tsx`
Event pipeline: API Gateway → Lambda (ingest) → SQS → Lambda (processor) → DynamoDB + SNS → Subscribers. DLQ branch shown. CloudWatch alarm shown. Animated message flow with batch indicator on SQS.

---

## 7. Content Standards

Every concept must meet this bar:
- **Analogy** is concrete, memorable, and states explicitly where it breaks down
- **Technical definition** uses exact terminology (no hand-waving)
- **Real-world examples** name actual companies and actual architectures (Netflix VPC peering, Stripe S3 usage, GitHub EKS migration)
- **Code/config snippet** is real and runnable (Terraform block, AWS CLI command, SDK example)
- **Interview answer** is written at principal/staff level — mentions trade-offs, failure modes, and cost
- **Follow-up questions** are the questions that separate a 5-year engineer from a 15-year engineer
- **Failure modes** describe the actual symptom a user would see, not a theoretical concern

---

## 8. Out of Scope (Explicitly)

- GCP, Azure equivalents (noted as "the concept is the same; the service name differs" where relevant)
- Infrastructure as Code as a standalone concept (CloudFormation/Terraform/CDK trade-offs are covered inside the EC2, ECS, and IAM concepts where deployment decisions arise — not as a separate module)
- AWS CDK / Terraform code walkthroughs (covered at trade-off level only)
- Deep Kubernetes internals below the control plane boundary
- Pricing tables (reference trade-off framing: "cheaper at steady load" not "$0.045/hour")
- AWS Console screenshots or click-through tutorials
