import { Concept } from '../types';

export const CONCEPTS_CLOUD_NETWORK: Concept[] = [
  {
    id: 'vpc',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🏗️',
    title: 'VPC (Virtual Private Cloud)',
    tag: 'Your private data center inside AWS',
    overview:
      'A VPC is a logically isolated section of the AWS cloud where you define your own IP address range, create subnets, configure route tables, and control what can communicate with what. Every resource you launch in AWS — EC2, RDS, Lambda in VPC mode, ECS tasks — lives inside a VPC whether you realize it or not. The default VPC AWS creates for you is convenient for experiments but a liability in production: its subnets are all public, and its CIDR range (172.31.0.0/16) will conflict with nearly every on-premises or VPC-peering scenario you encounter.',
    components: [
      {
        name: 'CIDR Block',
        icon: '🔢',
        role: 'Defines the IP address range of the VPC',
        detail:
          'A VPC\'s primary CIDR block is set at creation and cannot be changed. The most common choice is a /16 (65,536 IPs, e.g., 10.0.0.0/16). AWS recommends using RFC 1918 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) to avoid conflicts with internet routing. You can add secondary CIDR blocks later, but you cannot remove the primary.',
      },
      {
        name: 'Availability Zones',
        icon: '🏢',
        role: 'Physical data centers within a region — subnets are scoped to a single AZ',
        detail:
          'Each subnet lives in exactly one AZ. To achieve high availability, you must replicate your subnet topology across at least two AZs — one subnet per tier per AZ. Resources in different AZs within the same VPC communicate over AWS\'s internal network, but cross-AZ traffic incurs data transfer charges (typically $0.01/GB each direction).',
      },
      {
        name: 'Route Tables',
        icon: '🗺️',
        role: 'Control where traffic from subnets is directed',
        detail:
          'Every subnet has an associated route table. The most critical routes are: the local route (10.0.0.0/16 → local, always present, cannot be removed) for VPC-internal traffic, and a 0.0.0.0/0 route for internet-bound traffic pointing to either an IGW (public subnet) or NAT Gateway (private subnet). Missing a route is the most common cause of silent connectivity failures in VPCs.',
      },
      {
        name: 'Internet Gateway (IGW)',
        icon: '🚪',
        role: 'Bidirectional gateway between the VPC and the public internet',
        detail:
          'One IGW per VPC. It is horizontally scaled, redundant, and highly available — you never need to manage it. A subnet is "public" when its route table has a 0.0.0.0/0 entry pointing to the IGW AND the resources in it have public or Elastic IP addresses. Without a public IP, a resource in a "public" subnet still cannot communicate with the internet.',
      },
      {
        name: 'VPC Peering',
        icon: '🔗',
        role: 'Private network connection between two VPCs',
        detail:
          'VPC peering connects two VPCs (same or different accounts, same or different regions) so their resources can communicate using private IPs. Peering is non-transitive — if VPC A is peered with B and B with C, A cannot reach C through B. CIDRs must not overlap. At scale (>10 VPCs), peering becomes an O(n²) management problem — use Transit Gateway instead.',
      },
      {
        name: 'VPC Endpoints',
        icon: '🎯',
        role: 'Private connectivity to AWS services without traversing the internet or NAT Gateway',
        detail:
          'Gateway endpoints (S3, DynamoDB) add a route to your route table that sends traffic to the service over AWS\'s internal network — free, no NAT required. Interface endpoints (most other AWS services) create ENIs in your subnets with private IPs that resolve the service\'s DNS name — charged per hour and per GB. Using endpoints for S3 and DynamoDB is almost always cost-positive because it eliminates NAT Gateway data processing charges.',
      },
      {
        name: 'Transit Gateway',
        icon: '🔀',
        role: 'Hub-and-spoke network connector for multiple VPCs and on-premises networks',
        detail:
          'A Transit Gateway acts as a regional hub that multiple VPCs attach to. Unlike peering (which requires a connection between every pair), TGW requires one attachment per VPC — O(n) vs O(n²). TGW supports transitive routing, VPN and Direct Connect integration, and inter-region peering. It costs $0.05/hour plus data transfer charges, making it cost-effective above ~5 VPCs.',
      },
    ],
    howItWorks:
      'You create a VPC with a CIDR block (10.0.0.0/16). You divide that space into subnets — a common pattern is six /24 subnets across two AZs: two public subnets for load balancers and NAT Gateways, two private subnets for application servers, and two private subnets for databases. You attach an Internet Gateway to the VPC. You update the route tables for the public subnets to add a 0.0.0.0/0 → IGW route. You create NAT Gateways (one per AZ) in the public subnets and add 0.0.0.0/0 → NAT GW routes to the private subnet route tables. Resources in public subnets with public IPs can now reach and be reached from the internet; resources in private subnets can initiate outbound connections through the NAT Gateway but are unreachable from the internet.',
    decision: {
      choose: [
        'Use a custom VPC for every production workload — the default VPC is unsuitable for production because all subnets are public',
        'Design your CIDR range upfront with room to grow — a /16 gives 65K IPs; reserve /18 or /17 per environment if you have multiple (dev/staging/prod)',
        'Use Transit Gateway when connecting more than 5 VPCs — VPC peering becomes unmanageable as O(n²) connections',
        'Use VPC Endpoints for S3 and DynamoDB in every VPC that accesses these services — eliminates NAT Gateway cost and latency',
        'Deploy subnets in at least 2 AZs for every production tier',
      ],
      avoid: [
        'Using 10.0.0.0/8 as your VPC CIDR — too broad and will conflict with corporate networks during VPN/Direct Connect setup',
        'Using the default VPC for production — all subnets are public by default',
        'Overlapping CIDR ranges between VPCs you plan to peer — you cannot peer VPCs with overlapping CIDRs and you cannot change a VPC\'s primary CIDR',
        'Creating VPCs without a documented CIDR plan — retroactively expanding CIDRs is painful and error-prone',
        'Relying on VPC peering at scale (>10 VPCs) — use Transit Gateway instead',
      ],
      vs: [
        {
          name: 'VPC Peering vs Transit Gateway',
          when: 'Peering: low cost, no bandwidth limits, good for ≤5 VPCs. Transit Gateway: centralized, transitive routing, supports VPN/Direct Connect integration, better for large multi-account organizations. Above 5 VPCs the TGW management overhead pays for itself.',
        },
        {
          name: 'VPC Endpoints vs NAT Gateway',
          when: 'For AWS service traffic (S3, DynamoDB, SQS, etc.) always prefer Gateway or Interface VPC Endpoints — they avoid data transfer charges and the NAT Gateway processing fee of $0.045/GB. NAT Gateway is only needed for general internet access.',
        },
        {
          name: 'Single VPC vs Multi-VPC',
          when: 'Single VPC per environment is simpler and sufficient for most startups. Multi-VPC becomes necessary for compliance isolation (PCI/HIPAA requiring network boundary between systems), blast radius reduction in large organizations, or per-tenant isolation in SaaS platforms.',
        },
      ],
    },
    failures: [
      {
        name: 'CIDR Overlap Blocks VPC Peering',
        cause: 'Two VPCs assigned overlapping CIDR blocks (e.g., both using 10.0.0.0/16) — often from different teams independently choosing CIDRs',
        symptom: 'VPC peering creation fails with "CIDR block conflict" error. Teams cannot connect VPCs without re-addressing one of them — a painful operation requiring new subnets, migrating resources, and updating all routing.',
        fix: 'Establish a centralized CIDR registry before allocating ranges. Use AWS IP Address Manager (IPAM) to enforce non-overlapping allocations across accounts and regions. Assign /16 blocks from different /8 ranges per environment.',
        severity: 'critical',
      },
      {
        name: 'Missing Route in Route Table',
        cause: 'A route table is not updated after adding a new subnet, peering connection, or TGW attachment — often forgotten because route tables require explicit updates',
        symptom: 'Resources in the subnet report connection timeouts to destinations that should be reachable. VPC Flow Logs show traffic leaving the instance but no corresponding traffic at the destination.',
        fix: 'Always check route tables when debugging connectivity. Use Infrastructure as Code (Terraform) to manage route tables so routes cannot be accidentally omitted. Add a network connectivity test to your deploy pipeline.',
        severity: 'critical',
      },
      {
        name: 'Cross-AZ Data Transfer Cost Surprise',
        cause: 'NAT Gateway placed in us-east-1a, but private subnets in us-east-1b and us-east-1c route through it — each GB crosses AZ boundaries twice (request + response)',
        symptom: 'AWS bill shows unexpectedly high "EC2-Other" line items for Data Transfer within region. Cost grows linearly with traffic volume.',
        fix: 'Deploy one NAT Gateway per AZ and route each AZ\'s private subnet to the NAT Gateway in the same AZ. Adds ~$32/month per AZ but eliminates cross-AZ transfer charges that typically exceed that at moderate scale.',
        severity: 'high',
      },
      {
        name: 'VPC Endpoints Misconfigured',
        cause: 'VPC Endpoint for S3 created but endpoint policy is too restrictive, or route is only added to some subnet route tables',
        symptom: 'Traffic to S3 still routes through NAT Gateway (visible in VPC Flow Logs showing traffic to public S3 IPs). Gateway endpoint should route 54.231.0.0/17 range internally.',
        fix: 'Verify the endpoint route appears in every private subnet route table that should use it. Check endpoint policies. Use VPC Flow Logs to confirm traffic is using the private path (you\'ll see Amazon\'s private IP range).',
        severity: 'medium',
      },
      {
        name: 'Default VPC Used in Production',
        cause: 'Team deploys to the default VPC for speed, all subnets are public by default, security groups left permissive',
        symptom: 'EC2 instances or RDS databases reachable from the public internet. Security audit fails on network isolation requirements.',
        fix: 'Migrate workloads to a custom VPC with proper public/private subnet separation. Consider deleting the default VPC in all regions to prevent accidental use.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏙️🏢🔒',
      t: 'A Private Office Building in a Shared Skyscraper',
      tx: 'Imagine AWS as a massive shared office skyscraper with thousands of tenants. A VPC is your company\'s leased floors in that building. Even though you share the physical structure with everyone else, your floors are completely walled off — other tenants cannot walk in, see your layout, or access your resources.\n\nYou decide how to organize your floors (subnets). Some floors face the street and have doors to the lobby (public subnets with internet access). Others are deep in the building with no public access — the server room, the HR department, the executive floor (private subnets for databases and internal services). The lobby doors are your Internet Gateway.\n\nIf your mail room (private subnet) needs to send packages out (outbound internet access), it can\'t go through the lobby directly — it routes through a special internal courier desk (NAT Gateway) that goes to the lobby on its behalf, so the package goes out but nobody can walk back in through that path.\n\nWhen you need to connect to a partner company\'s floors (another VPC), you build a private corridor between floors (VPC Peering). But if you need to connect to 20 partners, building 190 individual corridors is a nightmare — you build a central hub floor that all corridors pass through (Transit Gateway).\n\nThe analogy breaks down here: unlike a real building, each of your floors can be in a different physical location (Availability Zone) while still feeling logically connected. And the building manager (AWS) never sees what happens on your floors — the isolation is enforced at the hardware level.',
      s: 'The detail that separates junior from senior VPC design: CIDR planning is not a "do it later" task. Once your VPC\'s primary CIDR is set and resources are deployed, changing it requires standing up a new VPC and migrating everything. Do the math upfront: how many EC2 instances, ENIs (EKS pods need one per pod), RDS instances, and load balancers will you run in 3 years? Multiply by 3 for safety. Then carve your /16 into appropriately sized subnet tiers — and document it in a CIDR registry before anyone else steals ranges in the same account.',
    },
    te: {
      def: 'A Virtual Private Cloud (VPC) is a logically isolated virtual network within AWS that you provision, configure, and control entirely. It provides network-level isolation between your resources and other AWS customers\' resources, with full control over IP ranges, subnets, routing, and traffic filtering.',
      types: [
        { n: 'Single-VPC Architecture', d: 'One VPC per environment (dev/staging/prod). Simple to operate, sufficient for most startups and mid-size applications. Connect environments via Transit Gateway if needed.' },
        { n: 'Multi-VPC with Peering', d: 'Separate VPCs for isolation between business units or compliance boundaries. Works up to ~10 VPCs; beyond that peering O(n²) complexity becomes unmanageable.' },
        { n: 'Hub-and-Spoke with Transit Gateway', d: 'Central TGW connects all spoke VPCs. Enables transitive routing, VPN, and Direct Connect integration from a single hub. Standard pattern for AWS Landing Zones with 10+ accounts.' },
        { n: 'Shared VPC (Resource Access Manager)', d: 'A central team owns the VPC and subnets; other AWS accounts attach resources directly into shared subnets. Reduces VPC sprawl in large organizations while maintaining account-level billing isolation.' },
        { n: 'VPC Lattice', d: 'AWS\'s newest layer 7 service networking offering. Allows service-to-service communication across VPCs and accounts with built-in auth and observability, without VPC peering or service mesh overhead.' },
      ],
      when: 'Use a custom VPC for any workload that will touch production data, handle external traffic, or require network isolation. The default VPC is appropriate only for learning, prototypes, and personal experimentation where security posture is not a concern.',
      trade: 'VPCs give you strong network isolation with near-zero overhead — the isolation is enforced at the hardware level with no performance cost. The trade-off is operational complexity: CIDR planning, subnet topology, route tables, security groups, NACLs, and VPC Endpoints all require deliberate design. Teams that skip this design upfront consistently hit CIDR conflicts, connectivity failures, and surprise data transfer bills in production.',
      code: `# Terraform: production VPC with public/private subnets across 2 AZs

variable "vpc_cidr" { default = "10.0.0.0/16" }

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "prod-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "prod-igw" }
}

# Public subnets (ALB, NAT GW)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "prod-public-\${count.index + 1}", Tier = "public" }
}

# Private subnets (EC2 app tier)
resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "prod-private-app-\${count.index + 1}", Tier = "app" }
}

# NAT Gateways — one per AZ to avoid cross-AZ charges
resource "aws_eip" "nat" { count = 2; domain = "vpc" }

resource "aws_nat_gateway" "nat" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.igw]
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }
}

# S3 Gateway VPC Endpoint — eliminates NAT costs for S3 traffic
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )
}`,
      rw: {
        ex: [
          'Netflix operates ~700 VPCs across 4 AWS regions, connected via Transit Gateway, with a dedicated "shared services" VPC hosting internal tooling accessible from all spoke VPCs',
          'Airbnb uses a hub-and-spoke VPC topology with centralized logging and security tooling in a shared VPC, accessed via VPC Endpoints to avoid traffic traversing the internet',
          'Stripe runs separate VPCs per PCI-DSS cardholder data environment (CDE) and non-CDE systems, with no peering between them — the network boundary enforces their compliance scope',
          'GitHub uses dedicated VPCs per AWS account in an AWS Organizations structure, all connected through a Transit Gateway that enforces centralized egress policies',
        ],
        cs: 'A fintech company initially deployed everything in the default VPC for speed. Eighteen months later, a PCI audit flagged that their card processing servers were in public subnets. Migrating to a properly designed custom VPC took 3 months — new VPC design, re-deploying all resources, updating DNS, and cutting over traffic. The CIDR they chose for the new VPC (10.0.0.0/16) conflicted with their corporate VPN\'s range (10.0.0.0/8 summary), forcing a second round of CIDR selection. Both problems would have been avoided with 2 hours of upfront CIDR planning and a custom VPC from day one.',
      },
    },
    interview: {
      q: 'Design the VPC architecture for a multi-tenant SaaS where each tenant must have data isolation. How many VPCs? How do they communicate? How do you handle shared services?',
      a: 'The answer depends on your isolation requirements. If "isolation" means logical isolation (access controls, tenant IDs in queries), a single VPC with strict IAM policies and row-level security in the database may be sufficient. If "isolation" means network isolation (different tenants\' traffic literally cannot reach each other\'s networks even if access controls fail — required for some compliance frameworks), you need separate VPCs per tenant. For network-isolated multi-tenancy: each tenant gets its own /24 VPC. Shared services (auth, billing, observability) live in a dedicated shared services VPC. Connectivity uses AWS PrivateLink so tenants can reach shared services via private DNS endpoints without VPC peering or overlapping CIDR concerns. A Transit Gateway connects all tenant VPCs to the shared services VPC with route table policies that prevent tenant-to-tenant traffic. Cost is real — each additional VPC and TGW attachment adds overhead — so validate whether your compliance requirements actually mandate network isolation or just logical isolation before committing to this architecture.',
      fu: [
        'How does Transit Gateway routing policy prevent tenant A from reaching tenant B\'s VPC even though both are attached to the same TGW?',
        'Explain how PrivateLink works internally — what is actually happening at the network level when a service is exposed via PrivateLink vs VPC peering?',
        'Your SaaS now needs to support customers who require dedicated AWS accounts for regulatory reasons. How does your VPC architecture change, and how do you connect those accounts back to your shared services?',
        'What are the cost trade-offs of VPC Endpoints (Interface vs Gateway) and when does the per-hour cost become justified over NAT Gateway data processing fees?',
        'A penetration test shows that two tenants in different VPCs can reach each other. Walk me through every place in the network stack where this could be misconfigured.',
        'How would you implement centralized egress inspection (sending all outbound internet traffic from multiple VPCs through a single security appliance) using AWS Gateway Load Balancer and Transit Gateway?',
      ],
    },
  },

  {
    id: 'subnets',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🗺️',
    title: 'Subnets & CIDR',
    tag: 'The floors in your building — who can reach the lobby',
    overview:
      'Subnets divide a VPC\'s IP range into smaller segments bound to specific Availability Zones. A subnet is "public" when its route table has a 0.0.0.0/0 route pointing to an Internet Gateway; it\'s "private" when that route points to a NAT Gateway (or doesn\'t exist). CIDR notation (10.0.1.0/24) encodes both the network address and the prefix length — the number after the slash is how many bits are fixed, so /24 gives 256 addresses (251 usable; AWS reserves the first 4 and last 1 in every subnet).',
    components: [
      {
        name: 'Public Subnet',
        icon: '🌐',
        role: 'Subnet with a route to the Internet Gateway — resources here can receive inbound internet traffic if they have public IPs',
        detail:
          'Public subnets are for load balancers, NAT Gateways, and bastion hosts — components that must be reachable from or communicate directly with the internet. Never place databases, application servers, or internal microservices in public subnets. The route 0.0.0.0/0 → IGW is what makes the subnet "public"; the subnet type itself has no special attribute.',
      },
      {
        name: 'Private Subnet',
        icon: '🔒',
        role: 'Subnet without an IGW route — resources can initiate outbound connections only through a NAT Gateway',
        detail:
          'Private subnets are for application servers, databases, and any resource that should not be directly addressable from the internet. Resources here have private IPs only; they reach the internet through a NAT Gateway in a public subnet. Traffic from the internet can never initiate a connection to a private subnet resource, even if the Security Group were wide open — there is no route back.',
      },
      {
        name: 'CIDR Notation',
        icon: '🔢',
        role: 'Compact representation of an IP range: base address + prefix length',
        detail:
          '/16 = 65,536 addresses (2^16); /24 = 256 addresses; /28 = 16 addresses (11 usable after AWS reservation). Key math: for every bit you add to the prefix, the range halves. A /16 VPC split into /24 subnets gives you 256 subnets of 256 IPs each — more than enough for most architectures. EKS pod networking is the exception: each pod consumes one VPC IP, so a 500-pod cluster needs at least 512 available IPs just for pods.',
      },
      {
        name: 'Route Table',
        icon: '🗺️',
        role: 'Defines where traffic leaving a subnet should go, matched by most-specific prefix first',
        detail:
          'Route tables use longest-prefix matching. A route for 10.0.0.0/16 (local VPC traffic) always beats 0.0.0.0/0 (default route). You can have one route table per subnet or share a single table across multiple subnets. The main route table (auto-created with the VPC) applies to subnets not explicitly associated with another table — always leave the main route table restricted and create explicit tables for each tier.',
      },
      {
        name: 'AZ Placement',
        icon: '🏢',
        role: 'Subnets are pinned to a single Availability Zone — failure of that AZ takes the subnet offline',
        detail:
          'This is why you must create subnets in at least two AZs for every tier. A single /24 in one AZ for your database tier means one AZ failure takes your entire database offline. The cost of an extra subnet is zero — you pay for the resources you place in it, not the subnet itself.',
      },
      {
        name: 'Reserved IPs',
        icon: '🚫',
        role: 'AWS reserves 5 IPs per subnet — the first 4 and the last 1',
        detail:
          'In a /24 (256 IPs), usable count is 251. In a /28 (16 IPs), usable count is 11. This matters most for small utility subnets (/27 or smaller) — a /28 in an EKS cluster running 10 pods will be exhausted immediately because each pod consumes one IP via the VPC CNI.',
      },
      {
        name: 'Secondary CIDR',
        icon: '➕',
        role: 'Additional non-overlapping CIDR blocks attached to an existing VPC',
        detail:
          'AWS allows you to add secondary CIDRs to a VPC if the primary is nearly exhausted. This is a last resort — secondary CIDRs must not overlap with existing subnets or peered VPC ranges, and they add complexity to routing and IPAM tracking. Better to plan your primary CIDR generously upfront.',
      },
    ],
    howItWorks:
      'A standard production layout for a 2-AZ VPC: start with 10.0.0.0/16. Carve out 6 subnets — two /24 public subnets (10.0.1.0/24 and 10.0.2.0/24 in AZ-1 and AZ-2) for ALBs and NAT Gateways; two /24 private app subnets (10.0.11.0/24 and 10.0.12.0/24) for EC2 or ECS tasks; two /24 private data subnets (10.0.21.0/24 and 10.0.22.0/24) for RDS and ElastiCache. Public subnets share a single route table with a 0.0.0.0/0 → IGW route. Each private subnet tier gets its own route table with 0.0.0.0/0 pointing to the NAT Gateway in the same AZ — this avoids cross-AZ NAT charges. Security groups and NACLs then layer access controls on top of this topology.',
    decision: {
      choose: [
        'Use /24 as the default subnet size — 251 usable IPs is sufficient for most tiers',
        'Always create subnets in at least 2 AZs for any production tier',
        'Use /27 or /28 for small utility subnets (bastion hosts, NLB endpoints)',
        'Plan EKS subnets at /19 (8,187 usable) — pods consume VPC IPs at a rate that exhausts /24 subnets quickly in large clusters',
        'Keep database and application subnets in separate /24s even if you could fit them in one — separation enables different NACLs and makes compliance audits simpler',
      ],
      avoid: [
        'Placing databases in public subnets — a misconfigured security group is the only protection, and that\'s insufficient',
        'Using a single AZ for production workloads — one physical failure takes everything down',
        'Creating subnets that are too small without a growth plan — you cannot split a /24 subnet into smaller subnets after resources are deployed',
        'Reusing a single route table for all subnets — different tiers should have different routing policies',
      ],
      vs: [
        {
          name: '/24 vs /19 for EKS',
          when: 'EKS with VPC CNI assigns one IP per pod. A 3-node cluster running 50 pods each needs 150 IPs just for pods, plus node IPs, plus service IPs. /24 (251 usable) gets exhausted quickly. Use /19 (8,187 usable) for EKS node/pod subnets, or enable prefix delegation to assign /28 blocks per ENI.',
        },
        {
          name: 'IPv4 vs IPv6 dual-stack',
          when: 'IPv6 subnets in AWS get a /64 (effectively unlimited IPs) and can use an Egress-Only IGW for outbound-only access — eliminating the need for NAT Gateways. Operational complexity increases because you must manage dual-stack security groups. Only adopt if IPv4 exhaustion is an actual problem.',
        },
      ],
    },
    failures: [
      {
        name: 'EKS Pod IP Exhaustion',
        cause: 'EKS with VPC CNI assigns one VPC IP per pod. A /24 subnet has 251 usable IPs. A cluster with 4 nodes × 50 pods = 200 pod IPs + 4 node IPs + overhead = subnet exhausted before cluster reaches full load',
        symptom: 'New pods fail to schedule with "InsufficientFreeAddressesInSubnet" error in VPC CNI logs. Existing pods continue running but no new pods can start, blocking deployments and autoscaling.',
        fix: 'Add /19 subnets to the cluster (re-create node groups pointing to larger subnets). Alternatively, enable VPC CNI prefix delegation which assigns /28 prefixes to ENIs instead of individual IPs, multiplying capacity by 16. For new clusters, always size EKS subnets at /19 or larger.',
        severity: 'critical',
      },
      {
        name: 'Database in Public Subnet',
        cause: 'RDS or self-managed database deployed in a public subnet (either by mistake or for "convenience" during development, never corrected)',
        symptom: 'Penetration test or security scanner reports database port reachable from public internet. A misconfigured security group change (or the default 0.0.0.0/0) would immediately expose all data.',
        fix: 'Move the database to a private subnet. For RDS, create a new subnet group in private subnets and restore from snapshot into the new subnet group. For EC2-based databases, use an AMI-based migration.',
        severity: 'critical',
      },
      {
        name: 'Cross-AZ NAT Costs',
        cause: 'A single NAT Gateway deployed in us-east-1a; private subnets in us-east-1b and 1c route 0.0.0.0/0 to that NAT — every outbound request crosses an AZ boundary twice',
        symptom: 'AWS Cost Explorer shows unexpectedly high "EC2 - Data Transfer in/out" charges growing proportionally with application traffic',
        fix: 'Deploy one NAT Gateway per AZ and update each AZ\'s private route table to route 0.0.0.0/0 to the local NAT Gateway. This adds ~$32/month per AZ but eliminates cross-AZ data transfer fees ($0.01/GB each direction).',
        severity: 'high',
      },
      {
        name: 'Subnet Too Small for Auto Scaling',
        cause: 'ASG or ECS service scales out; new instances or tasks require IPs from a /27 or /28 subnet that only has 11–27 usable IPs',
        symptom: 'Auto Scaling events fail with "There are not enough free IP addresses in the subnet" error. Load increases but capacity cannot scale, causing latency and errors.',
        fix: 'Add a secondary /24 subnet in the same AZ and add it to the ASG\'s subnet list. Long-term, always size application subnets at /24 minimum, /22 for large-scale workloads.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏢🏬🏪',
      t: 'Office Building Floors and Who Has Lobby Access',
      tx: 'Think of your VPC as a multi-story office building with a strict access policy. The CIDR block is the building\'s address range — it defines how many office spaces exist in total. Subnets are individual floors, each in a specific location (Availability Zone is like having floors in different buildings in the same city — connected but physically separate).\n\nSome floors are in the publicly accessible part of the building, with doors straight from the lobby (public subnets). The receptionist desk, the sales floor, the demo room — these belong here because visitors need to come in. Other floors have no public entry — no stairs from the lobby, no elevator buttons for outsiders. To send mail from those floors, staff use an internal mailroom that communicates with the lobby on their behalf (NAT Gateway), but no visitor can walk up uninvited.\n\nThe address system (/16, /24, /28) determines how many offices are on each floor. A /24 floor has 256 office spaces, with 5 reserved by building management, leaving 251 usable. A /28 floor has only 16 spaces (11 usable) — fine for a small security desk, disastrous if you try to seat 50 engineers there.\n\nThe analogy breaks down with EKS: in Kubernetes, every container gets its own mailbox (IP address) carved directly from the floor\'s address space. A floor with 251 mailboxes fills up faster than you expect when each of your 5 applications spawns 30 pods.',
      s: 'The CIDR detail that trips up experienced engineers: AWS reserves 5 IPs per subnet, not just 1 for broadcast. In a /28 (16 IPs), you have 11 usable — not 14. Plan for this when sizing EKS subnets. The second gotcha: subnet size cannot be changed after creation. The only workaround is creating a new subnet and migrating — which means new ENIs, updated ASGs, rolling deploys. Size generously the first time.',
    },
    te: {
      def: 'A subnet is a range of IP addresses within a VPC, constrained to a single Availability Zone. Subnets are classified as public (route to IGW) or private (route to NAT GW or none). CIDR notation encodes the IP range and the number of fixed prefix bits, determining the pool size.',
      types: [
        { n: 'Public Subnet', d: 'Route table includes 0.0.0.0/0 → IGW. Resources need public or Elastic IPs to communicate with the internet. Used for ALBs, NAT Gateways, and bastion hosts.' },
        { n: 'Private Subnet', d: 'No IGW route. Outbound internet access via NAT Gateway. Used for app servers, containers, and internal APIs.' },
        { n: 'Data Subnet', d: 'Private subnet with additional NACL restrictions allowing only DB ports from app subnets. Best practice is to separate data tier into its own subnets.' },
        { n: 'Isolated Subnet', d: 'No route to NAT Gateway at all — completely isolated from the internet in both directions. Used for sensitive databases, encryption key services, or HSMs that should never have internet access.' },
        { n: 'EKS Node Subnet', d: 'Large private subnet (/19 or /22) specifically sized for pod IP consumption when using VPC CNI. Often the largest subnets in a VPC architecture.' },
      ],
      when: 'Design subnet topology before deploying any resources. Changing subnet sizes or types after resources are deployed requires migrating those resources — a painful, error-prone operation in production.',
      trade: 'Subnets add network segmentation without significant overhead. The cost is planning complexity: you must pre-allocate address space that cannot be reclaimed if unused, and growing a subnet that\'s too small requires creating new subnets and migrating resources. Over-provisioning is generally the right trade-off — unused IPs cost nothing, while running out of IPs at 3am during an incident is expensive.',
      code: `# Subnet sizing reference and Terraform cidrsubnet examples

# VPC: 10.0.0.0/16 (65,536 IPs total)

# cidrsubnet(vpc_cidr, newbits, netnum)
# newbits = how many extra bits to add to the prefix
# netnum = which subnet of that size

locals {
  vpc_cidr = "10.0.0.0/16"
}

# /24 subnets: newbits=8 (16+8=24), 256 IPs each
# Public subnets: 10.0.0.0/24, 10.0.1.0/24
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 8, count.index)
  # count.index=0 → 10.0.0.0/24
  # count.index=1 → 10.0.1.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

# Private app subnets: 10.0.10.0/24, 10.0.11.0/24
resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

# EKS subnets: /19 (8,192 IPs), newbits=3 (16+3=19)
# 10.0.0.0/19, 10.0.32.0/19 — large enough for 8,000+ pods
resource "aws_subnet" "eks" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 3, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

# Isolation check: AWS reserved IPs per subnet
# /24 → 251 usable (256 - 5)
# /27 → 27 usable  (32  - 5)
# /28 → 11 usable  (16  - 5)  ← smallest practical subnet`,
      rw: {
        ex: [
          'Uber\'s EKS clusters use /19 subnets per AZ per cluster after hitting /24 exhaustion with their VPC CNI setup running 5,000+ pods per cluster',
          'Netflix carves /16 VPCs into tiered /24 subnets per service family, using isolated subnets with no NAT for its key management infrastructure',
          'Stripe\'s PCI CDE uses separate /24 subnets per compliance tier with NACL rules allowing only specific ports between tiers',
        ],
        cs: 'A media startup running EKS deployed their node groups into /24 subnets — 251 usable IPs. After 6 months of growth they were running 180 pods per AZ. A traffic spike triggered a scale-out event that tried to add 80 more pods. All 80 failed with IP exhaustion errors. The fix required creating new /19 subnets, updating node group subnet lists, rolling out new nodes, and draining old ones — 4 hours of work during a spike event. The correct sizing (/19 from day one) would have taken 10 minutes of planning.',
      },
    },
    interview: {
      q: 'You\'re designing a VPC for a platform that will run 500 microservices in EKS, each needing its own ENI. How do you plan your CIDR to avoid IP exhaustion? What\'s the pod networking implication?',
      a: 'First, calculate the IP demand: 500 microservices, assume 3 replicas each = 1,500 pods. EKS with VPC CNI assigns one VPC IP per pod plus one per node. If you\'re running 50 nodes, that\'s 1,550 IPs minimum, plus headroom for rolling deploys (peak is 2× during deployment). You need at least 3,100 IPs per AZ. A /22 gives 1,019 usable — not enough. A /19 gives 8,187 usable — that\'s your minimum subnet size per AZ. I\'d go with /19 per AZ for the EKS node/pod subnets, carved from a /16 VPC. The alternative is enabling ENI prefix delegation: instead of one IP per pod, the CNI assigns a /28 prefix per ENI, multiplying capacity by 16 — this lets you use /24 subnets without IP exhaustion. The trade-off is that prefix delegation is a newer feature with some operational complexity around IP leak detection. For a new cluster, I\'d use /19 subnets; for an existing cluster hitting exhaustion, prefix delegation is the path of least disruption.',
      fu: [
        'Explain VPC CNI prefix delegation in depth — how does assigning /28 blocks to ENIs work, and what\'s the implication for IP leak detection?',
        'Your EKS cluster spans 3 AZs, each with a /19 subnet. After 6 months you\'re approaching exhaustion in all three. What are your options, and what are the risks of each?',
        'How would IPv6 dual-stack subnets solve the pod IP exhaustion problem, and what new operational complexity does it introduce?',
        'Explain how AWS VPC IPAM (IP Address Manager) helps prevent CIDR conflicts in an organization with 50 AWS accounts.',
        'What is the subnet calculator math for determining how many /24s fit in a /16, and how would you document your CIDR allocation to prevent conflicts across teams?',
        'How does EKS Custom Networking (placing pods in different subnets than nodes) help with IP planning, and what routing complexity does it introduce?',
      ],
    },
  },

  {
    id: 'security-groups',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🔒',
    title: 'Security Groups & NACLs',
    tag: 'Bouncers at the door vs CCTV on every floor',
    overview:
      'Security Groups are stateful firewalls attached to Elastic Network Interfaces (ENIs) — they track connection state, so if you allow inbound port 443, the response traffic is automatically allowed regardless of outbound rules. Network ACLs (NACLs) are stateless firewalls attached to subnets — they process each packet independently, so you must explicitly allow both request and response traffic, including the ephemeral return port. Security Groups are the primary tool for the vast majority of access control; NACLs are an additional blast radius control layer at the subnet boundary.',
    components: [
      {
        name: 'Security Group — Inbound Rules',
        icon: '⬇️',
        role: 'Allow or deny incoming traffic to the associated ENI',
        detail:
          'Security Group rules are allow-only — there is no explicit deny. If no inbound rule matches, traffic is denied implicitly. Rules specify: protocol (TCP/UDP/ICMP/All), port range (single port or range), and source (CIDR, another security group ID, or a prefix list). Using a Security Group ID as source (instead of CIDR) is best practice between tiers in the same VPC — it\'s more expressive ("allow traffic from the load balancer SG") and automatically handles dynamic IP changes.',
      },
      {
        name: 'Security Group — Outbound Rules',
        icon: '⬆️',
        role: 'Allow or deny outgoing traffic from the associated ENI',
        detail:
          'Default outbound rule allows all traffic (0.0.0.0/0). For most tiers, locking down outbound is also valuable for defense-in-depth — it prevents compromised instances from exfiltrating data or reaching malicious infrastructure. However, stateful behavior means established inbound connections always get a response regardless of outbound rules — outbound rules only affect connections initiated from the instance.',
      },
      {
        name: 'NACL — Inbound/Outbound Rules',
        icon: '🚧',
        role: 'Subnet-level stateless packet filter — must allow both request AND response traffic',
        detail:
          'NACL rules are numbered and evaluated in ascending order. The first matching rule applies — rule 100 ALLOW port 443 and rule 200 DENY ALL will allow port 443 traffic. Rules can be ALLOW or DENY (unlike Security Groups which are allow-only). Because NACLs are stateless, inbound rules for a web server (allow TCP 443 inbound) must be paired with outbound rules allowing the ephemeral response ports (TCP 1024–65535 outbound) or the response packets will be dropped.',
      },
      {
        name: 'Stateful vs Stateless',
        icon: '🔄',
        role: 'Core difference between Security Groups and NACLs',
        detail:
          'Stateful (Security Groups): the firewall tracks established connections. A packet matching an inbound rule creates a state table entry; return packets matching that state are automatically allowed regardless of outbound rules. Stateless (NACLs): no state tracking. Every packet is independently evaluated against all rules. This is why the ephemeral port range (1024–65535) must be explicitly allowed outbound in NACLs for servers accepting inbound connections.',
      },
      {
        name: 'Default Security Group',
        icon: '🏠',
        role: 'Automatically created with each VPC — allows all traffic between members of the same SG',
        detail:
          'The default Security Group has an inbound rule that allows all traffic from other resources in the same SG. This is a common security risk: multiple different services added to the default SG can communicate unrestricted with each other. Best practice: never use the default SG; create named SGs with explicit rules for each tier.',
      },
      {
        name: 'Security Group References',
        icon: '🔗',
        role: 'Using another SG\'s ID as the source/destination instead of a CIDR range',
        detail:
          'When you reference a Security Group ID (e.g., allow inbound 8080 from sg-0abc1234) instead of a CIDR, the rule dynamically follows all ENIs in that SG. This is more maintainable than CIDR-based rules (which break when IPs change) and more readable ("allow from the ALB security group"). Cross-account SG references are supported for same-region VPC peering scenarios.',
      },
      {
        name: 'Rule Evaluation Order',
        icon: '📋',
        role: 'How Security Groups and NACLs evaluate multiple rules',
        detail:
          'Security Groups evaluate ALL rules — the most permissive matching rule wins (no rule priority). NACLs evaluate rules in numeric order — the first match terminates evaluation. This means adding a DENY rule to a Security Group has no effect (there are no deny rules in SGs, only allow rules with implicit deny). To block specific traffic with Security Groups, you remove the allow rule rather than adding a deny.',
      },
    ],
    howItWorks:
      'Traffic from the internet to an EC2 instance traverses both layers: first the NACL on the public subnet (evaluates inbound rules stateless), then the Security Group on the EC2\'s ENI (evaluates inbound rules stateful). Return traffic from the EC2 to the client: Security Group outbound rules evaluated (stateful — usually auto-allowed since it\'s an established connection), then NACL outbound rules (stateless — must explicitly allow the ephemeral response port). For security groups between VPC tiers (ALB to EC2): the ALB Security Group has an outbound rule allowing port 8080 to the EC2 Security Group; the EC2 Security Group has an inbound rule allowing port 8080 from the ALB Security Group. No NACL is involved if both are in private subnets with permissive default NACLs.',
    decision: {
      choose: [
        'Use Security Groups as your primary access control layer — they\'re stateful, easier to reason about, and cover 95% of use cases',
        'Reference Security Groups by ID (not CIDR) when controlling access between tiers in the same VPC',
        'Use NACLs as an additional layer to explicitly block known malicious CIDR ranges or enforce hard egress restrictions',
        'Use NACLs when you need explicit DENY capability — Security Groups cannot deny, only allow',
        'Lock down outbound Security Group rules for sensitive tiers (databases) — prevent compromised instances from phoning home',
      ],
      avoid: [
        '0.0.0.0/0 inbound on port 22 (SSH) or 3389 (RDP) — use AWS Systems Manager Session Manager instead, which requires no open inbound ports',
        'Using the default Security Group for production resources',
        'Modifying NACLs without first understanding the stateless ephemeral port requirement',
        'Creating overly complex NACL rule sets — they become unmanageable and easy to misconfigure',
        'Using IP-based SG rules for internal VPC traffic — use SG references instead',
      ],
      vs: [
        {
          name: 'Security Group vs AWS WAF',
          when: 'Security Groups operate at L3/L4 (IP, port, protocol). WAF operates at L7 (HTTP headers, URI, body content, rate limits, OWASP rules). Use both: SG restricts who can reach your ALB; WAF inspects what they send.',
        },
        {
          name: 'Security Group vs AWS Network Firewall',
          when: 'Network Firewall provides deep packet inspection, IDS/IPS signatures, and centralized firewall policy across multiple VPCs. Use it when you need compliance-grade threat detection (PCI, HIPAA), not for standard application access control.',
        },
        {
          name: 'NACL vs Security Group for blocking IPs',
          when: 'NACLs are the right tool for explicitly blocking a specific IP or CIDR range at the subnet boundary — they support DENY rules. Security Groups do not have DENY rules; you\'d have to remove the allow rule, which might be too broad to do safely.',
        },
      ],
    },
    failures: [
      {
        name: 'NACL Blocking Ephemeral Return Traffic',
        cause: 'NACL inbound rule allows port 443; outbound rules don\'t include the ephemeral port range 1024–65535. Web server accepts TCP connections but response packets are dropped at the NACL',
        symptom: 'Clients connecting to port 443 see a successful TCP handshake (SYN-SYN/ACK-ACK) but subsequent data packets are silently dropped. VPC Flow Logs show ACCEPT for the inbound port 443 but REJECT for outbound high-port responses.',
        fix: 'Add an outbound NACL rule allowing TCP 1024–65535 to 0.0.0.0/0. For clarity, separate the rule: one for the specific destination, one for the ephemeral range.',
        severity: 'critical',
      },
      {
        name: 'Overly Permissive 0.0.0.0/0 Debug Rule Not Removed',
        cause: 'Engineer opens 0.0.0.0/0 on port 22 or all-ports to debug connectivity, forgets to remove it after resolving the issue',
        symptom: 'SSH or all-port access exposed to the entire internet. Bots begin probing within minutes of the rule being added. A breach can occur within hours.',
        fix: 'Enforce Security Group changes through Infrastructure as Code (Terraform/CDK) with PR review requirements. Use AWS Config rule `restricted-ssh` to alert on 0.0.0.0/0 inbound port 22. Enable AWS Security Hub for continuous compliance monitoring.',
        severity: 'critical',
      },
      {
        name: 'Security Group Self-Reference Creating Circular Dependency',
        cause: 'Adding a resource to a Security Group that references itself as a source before both the SG and the rule exist — common in Terraform when using `aws_security_group_rule` resources',
        symptom: 'Terraform apply fails with cycle or dependency error. Or connectivity works inconsistently because the SG rule was created before the EC2 instance and references an SG that hadn\'t propagated yet.',
        fix: 'In Terraform, use inline `ingress` blocks inside `aws_security_group` resources for self-references, or use `depends_on` to sequence creation. Test SG changes in a non-production environment first.',
        severity: 'medium',
      },
      {
        name: 'Cross-VPC SG Reference Not Propagating',
        cause: 'Security Group in VPC A references a SG in VPC B via peering. Changes to VPC B\'s SG membership don\'t immediately propagate to the reference in VPC A',
        symptom: 'New instances added to VPC B\'s SG cannot immediately communicate with VPC A resources. Access is intermittent during propagation lag.',
        fix: 'For cross-VPC access, prefer CIDR-based rules or PrivateLink over cross-account SG references. If cross-account SG references are required, understand the propagation delay and plan accordingly.',
        severity: 'medium',
      },
      {
        name: 'Default Security Group Lateral Movement',
        cause: 'Multiple unrelated services (web server, database, internal API) all assigned to the default SG, which allows all traffic between its members',
        symptom: 'A compromised web server can directly connect to the database and internal API without any network restriction, massively expanding the blast radius of the breach.',
        fix: 'Create separate named SGs per tier with explicit ingress rules. Remove all resources from the default SG. Use a Terraform policy or AWS Config rule to alert when any resource is assigned to the default SG.',
        severity: 'critical',
      },
    ],
    a: {
      v: '🚪🔒📹',
      t: 'Bouncers at the door vs CCTV on every floor',
      tx: 'Imagine a concert venue. The main entrance has bouncers (Security Groups) who check each guest\'s identity. They remember who came in — if you got inside, you\'re allowed to leave too. They\'re smart enough to know an established relationship: if Alice entered to see Bob, Alice\'s response to Bob gets out automatically. They only have an allow list — the bouncer can\'t add someone to a "never let them in" list, only remove them from the allow list.\n\nThe building itself has security cameras at every floor (NACLs). These cameras are dumb — they don\'t remember who went up the elevator. If they see someone on floor 10, they check their rulebook: is this person allowed on floor 10? They don\'t care that a bouncer already cleared them downstairs. And because they\'re stateless, when the same person tries to come back down, the camera checks them again — is outbound traffic allowed? If the rulebook says "allow all guests up (inbound port 443)" but doesn\'t say "allow guests back down (outbound ephemeral ports)," the person is stuck on the floor.\n\nIn practice: the cameras (NACLs) are set broadly — allow most building traffic. The bouncers (Security Groups) are configured tightly — only let the right people into the right rooms. If you need to block a specific known bad actor (a malicious IP address) from even entering the building, you add them to the cameras\' deny list — because the cameras have deny rules, the bouncers don\'t.',
      s: 'The gotcha that catches even experienced engineers: NACLs are stateless and evaluate BOTH inbound AND outbound for every connection. When a client connects to your server on port 443, the response goes back on a random port between 1024 and 65535 (the ephemeral port). If your NACL outbound rules don\'t include 1024–65535, all your response packets get silently dropped. The connection handshake works (port 443 inbound is allowed), but no data flows. VPC Flow Logs will show ACCEPT on inbound 443 and REJECT on the outbound high port — that asymmetry is the diagnostic fingerprint.',
    },
    te: {
      def: 'Security Groups are stateful, ENI-attached allow-only firewalls; NACLs are stateless, subnet-attached firewalls supporting both allow and deny rules. Security Groups track TCP/UDP connection state; NACLs evaluate every packet independently with numbered rules applied in order.',
      types: [
        { n: 'Tiered Security Groups', d: 'Separate SG per tier (ALB-SG, App-SG, DB-SG) with explicit rules referencing the upstream tier\'s SG ID. ALB-SG allows 443 from 0.0.0.0/0; App-SG allows 8080 from ALB-SG; DB-SG allows 5432 from App-SG.' },
        { n: 'Least-Privilege SG', d: 'Lock down both inbound and outbound. Outbound: only allow the specific ports and destinations the instance needs to initiate connections to. Prevents compromised instances from communicating with attacker infrastructure.' },
        { n: 'NACL as Blast Radius Control', d: 'Default NACLs (allow all) for most tiers; restrictive NACLs on the data tier explicitly denying inbound traffic from anywhere except the app subnet CIDR range.' },
        { n: 'NACL as IP Blocklist', d: 'Add numbered deny rules for known malicious CIDR ranges at the subnet boundary. Lower rule number than the allow rules ensures the deny takes precedence.' },
      ],
      when: 'Security Groups are always required and always the primary tool. NACLs are optional but valuable for compliance environments requiring network-level deny capability, emergency IP blocking, and defense-in-depth for sensitive data tiers.',
      trade: 'Security Groups are easy to use correctly but provide no explicit deny capability — you can only withdraw allow rules. NACLs support explicit deny but require managing stateless rules with ephemeral port ranges, adding operational complexity. Together they provide defense-in-depth: SGs handle per-resource access control; NACLs handle subnet-wide blast radius limitation.',
      code: `# Terraform: 3-tier security group pattern
# ALB SG → App SG → DB SG with SG references

resource "aws_security_group" "alb" {
  name        = "prod-alb-sg"
  description = "ALB: inbound HTTPS from internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}

resource "aws_security_group" "app" {
  name        = "prod-app-sg"
  description = "App servers: inbound from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]  # reference, not CIDR
  }
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.db.id]
  }
}

resource "aws_security_group" "db" {
  name        = "prod-db-sg"
  description = "DB: inbound Postgres from app tier only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  # No egress rules — DB never initiates connections
}

# NACL for data subnet — explicit allow only from app tier
resource "aws_network_acl" "data" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private_data[*].id

  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "10.0.10.0/23"  # app subnet range
    from_port  = 5432
    to_port    = 5432
  }
  ingress {
    rule_no    = 32766
    protocol   = "-1"
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  # Allow ephemeral ports for return traffic
  egress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "10.0.10.0/23"
    from_port  = 1024
    to_port    = 65535
  }
}`,
      rw: {
        ex: [
          'Netflix uses tiered Security Groups across all microservices — each service SG only allows inbound from the specific upstream service SGs, and outbound only to downstream dependencies',
          'Stripe enforces a "no default SG" policy via AWS Config custom rules across all accounts — every resource must be in an explicitly named and documented SG',
          'GitHub uses NACLs as an emergency IP blocking mechanism — when their security team identifies attacking CIDRs, NACL deny rules can be deployed in seconds ahead of WAF rule propagation',
        ],
        cs: 'A healthcare company running HIPAA workloads failed a network audit because their database subnets used the default NACL (allow all). While their Security Groups were properly locked down (only app SG → DB SG on port 5432), the auditors required a defense-in-depth layer at the subnet boundary. Implementing NACLs on the data subnets — allowing only app-tier CIDRs on port 5432 inbound and ephemeral ports outbound — satisfied the requirement and added a genuine extra layer of protection against misconfigured Security Groups.',
      },
    },
    interview: {
      q: 'A penetration test found your application servers are reachable directly from the internet despite your VPC being locked down. Walk me through every layer you\'d audit to find the misconfiguration.',
      a: 'I\'d work outward from the EC2 instance to the internet. First, check the instance\'s Security Group: is there an inbound rule with 0.0.0.0/0 on any port? Check all SGs attached to the ENI, not just the primary one. Second, check the subnet: is it marked as mapping public IPs on launch? If yes, the instance may have a public IP that wasn\'t intentional. Third, check the subnet\'s route table: does it have a 0.0.0.0/0 route to an IGW? If so, it\'s a public subnet. Fourth, check the NACL on the subnet: does it allow inbound from 0.0.0.0/0? Fifth, verify there\'s no Elastic IP or public IP association on the instance\'s ENI. Sixth, if this is an ECS/EKS workload, check if the task/pod has its own ENI (Fargate tasks get separate ENIs) — the SG on the task may differ from the host. Finally, check for any VPC Endpoints or PrivateLink services that might be routing traffic unexpectedly. The root cause in my experience is almost always one of three things: an instance in a public subnet (should be private), a security group rule left from debugging, or a public IP inadvertently assigned.',
      fu: [
        'What does VPC Flow Log output look like for a rejected connection vs an accepted one, and how do you use it to determine whether the block happened at the NACL or the Security Group?',
        'Describe the defense-in-depth layering that separates Security Groups, NACLs, AWS Network Firewall, and AWS WAF — which layer handles which class of threat?',
        'How would you implement zero-trust networking inside a VPC where services can only communicate with explicitly approved peers, even if they share the same subnet?',
        'A security incident response requires immediately blocking all traffic from 185.220.101.0/24 (known Tor exit nodes). How do you implement this at network level in AWS, and what\'s the fastest path that doesn\'t require deploying new infrastructure?',
        'Explain how AWS Security Groups implement rules at the hypervisor level — what actually enforces the rules, and why is there no performance cost to adding more rules?',
        'Your company acquires a startup and needs to peer their VPC into yours. Their Security Groups are a mess. How do you safely allow selective connectivity without opening broad access?',
      ],
    },
  },

  {
    id: 'nat-gateway',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🚪',
    title: 'NAT Gateway & Internet Gateway',
    tag: 'The front door vs the one-way mail slot',
    overview:
      'An Internet Gateway (IGW) is a horizontally scaled, fully managed gateway that provides bidirectional connectivity between a VPC and the public internet — resources with public IP addresses can receive inbound connections and initiate outbound ones. A NAT Gateway allows resources in private subnets (which have no public IP) to initiate outbound connections to the internet without being reachable inbound. This asymmetry is fundamental: your database can pull OS updates or call an external API; nobody on the internet can initiate a connection back to your database.',
    components: [
      {
        name: 'Internet Gateway',
        icon: '🌐',
        role: 'Bidirectional VPC-to-internet gateway, one per VPC',
        detail:
          'The IGW is not a single-point-of-failure appliance — it\'s a logical construct that AWS implements as a distributed, highly available service. You never choose its capacity or size; it scales horizontally to accommodate any traffic volume. A subnet is made public by adding a 0.0.0.0/0 → IGW route to its route table AND ensuring resources in it have public or Elastic IP addresses. The IGW performs NAT for instances with public IPs.',
      },
      {
        name: 'NAT Gateway',
        icon: '📨',
        role: 'Managed outbound NAT for private subnets — translates private source IPs to its Elastic IP',
        detail:
          'When a private instance (10.0.10.5) sends traffic to 1.2.3.4:443, the NAT Gateway translates the source address to its own Elastic IP (e.g., 52.10.20.30) and forwards to the internet. The internet sees 52.10.20.30 as the source; return traffic comes back to the NAT Gateway, which reverses the translation and delivers to 10.0.10.5. The private instance is never directly addressable. NAT Gateway charges: $0.045/hour per gateway + $0.045/GB of data processed.',
      },
      {
        name: 'Elastic IP',
        icon: '🔢',
        role: 'Static public IPv4 address associated with a NAT Gateway',
        detail:
          'NAT Gateways require an Elastic IP allocation. The EIP is the source IP that external services see for all traffic from your private subnets. If you need to whitelist your outbound IPs with a partner API, use the NAT Gateway\'s EIP — all private subnet traffic exits from this predictable, static IP.',
      },
      {
        name: 'Route Table Integration',
        icon: '🗺️',
        role: '0.0.0.0/0 route in private subnet route table points to NAT Gateway',
        detail:
          'Private subnets are made "private" by routing 0.0.0.0/0 to a NAT Gateway instead of an IGW. The critical best practice: each AZ\'s private subnets should route to the NAT Gateway in the SAME AZ. Cross-AZ NAT routing works but incurs $0.01/GB cross-AZ transfer charges on both the request and response legs.',
      },
      {
        name: 'Gateway VPC Endpoint',
        icon: '🎯',
        role: 'Free route-based endpoint for S3 and DynamoDB — bypasses NAT Gateway entirely',
        detail:
          'S3 and DynamoDB Gateway Endpoints add a managed prefix list route to your route tables. Traffic to these services goes directly over AWS\'s internal network, bypassing the NAT Gateway. There is no per-hour or per-GB charge. For VPCs with moderate-to-heavy S3 or DynamoDB usage, enabling Gateway Endpoints often reduces the NAT Gateway data processing bill by 30–60%.',
      },
      {
        name: 'NAT Instance (Legacy)',
        icon: '⚠️',
        role: 'EC2-based NAT — self-managed, limited bandwidth, single point of failure',
        detail:
          'Before NAT Gateway, you ran an EC2 instance with source/destination check disabled and iptables NAT rules. A NAT Instance is still available but is the wrong choice for any production workload: it has a bandwidth ceiling (instance type-dependent), no built-in HA, and you own patching and maintenance. The only valid use case today is cost optimization for very low-traffic dev environments where the $32/month per NAT Gateway is not justified.',
      },
      {
        name: 'Egress-Only Internet Gateway (IPv6)',
        icon: '↪️',
        role: 'IPv6 equivalent of a NAT Gateway — allows outbound but blocks inbound',
        detail:
          'IPv6 addresses are globally unique and publicly routable — there is no NAT in IPv6. An Egress-Only IGW lets IPv6 instances initiate outbound connections without accepting inbound ones, analogous to NAT for IPv4. Required in dual-stack VPCs where you want private subnets to have IPv6 outbound access.',
      },
    ],
    howItWorks:
      'Private EC2 instance in us-east-1a (10.0.10.5) initiates a connection to api.stripe.com (34.194.1.1:443). The instance looks up its route table: 0.0.0.0/0 → nat-0abc1234 (the NAT Gateway in us-east-1a). The packet reaches the NAT Gateway, which performs Source NAT (SNAT): replaces source IP 10.0.10.5 with its own EIP (52.10.20.30) and records the mapping in its connection table. The packet traverses the IGW to the internet. Stripe\'s server responds to 52.10.20.30:443. The response reaches the NAT Gateway, which reverses the NAT using its connection table: destination 52.10.20.30 → 10.0.10.5. The response is delivered to the EC2 instance. The EC2 instance never sent or received traffic with a public IP — from the network perspective, it doesn\'t exist on the internet.',
    decision: {
      choose: [
        'Use NAT Gateway (managed) over NAT Instance for any production workload',
        'Deploy one NAT Gateway per AZ — route each AZ\'s private subnets to the local NAT Gateway to avoid cross-AZ data transfer costs',
        'Enable S3 and DynamoDB VPC Gateway Endpoints in every VPC to bypass NAT Gateway for those services',
        'Use Interface VPC Endpoints for high-volume AWS API calls (SQS, SNS, CloudWatch) if NAT data processing costs are significant',
        'Log NAT Gateway traffic with VPC Flow Logs to diagnose unexpected cost spikes',
      ],
      avoid: [
        'Routing all AZs\' private traffic through a single NAT Gateway — both a cost issue (cross-AZ) and a reliability risk (one AZ failure kills NAT for all)',
        'Using NAT for traffic to AWS services (S3, DynamoDB, SQS) — use VPC Endpoints instead',
        'Running a NAT Instance in production — no HA, bandwidth limits, manual maintenance',
        'Forgetting to create a NAT Gateway when creating private subnets — a common oversight that causes "no internet" during initial deploys',
      ],
      vs: [
        {
          name: 'NAT Gateway vs VPC Endpoint',
          when: 'For any AWS service that supports a VPC Endpoint, prefer the endpoint over NAT: it\'s free (Gateway type), faster (no internet hop), and eliminates NAT data processing costs. NAT Gateway is only needed for general internet access to non-AWS destinations.',
        },
        {
          name: 'NAT Gateway vs PrivateLink',
          when: 'PrivateLink (Interface Endpoint) exposes an AWS or partner service inside your VPC via a private IP in your subnet. Traffic never leaves AWS. More expensive than Gateway Endpoints ($0.01/hr + $0.01/GB) but supports all services. Use for SNS, SQS, SSM, ECR, and any marketplace service that supports PrivateLink.',
        },
        {
          name: 'Single NAT GW vs per-AZ NAT GW',
          when: 'Single NAT GW: ~$32/month but all cross-AZ traffic pays $0.01/GB. Per-AZ NAT GW: ~$96/month for 3 AZs but no cross-AZ charges and no single-AZ dependency. Break-even point is typically around 3TB of private-subnet outbound traffic per month.',
        },
      ],
    },
    failures: [
      {
        name: 'Single NAT GW Creates AZ Dependency',
        cause: 'All private subnets across 3 AZs route through a single NAT Gateway in us-east-1a. The AZ (or the NAT GW itself) experiences an outage.',
        symptom: 'Private subnet instances in us-east-1b and us-east-1c lose all internet connectivity. Outbound API calls, package downloads, and external webhook deliveries fail. Applications that depend on external APIs become degraded or non-functional.',
        fix: 'Deploy one NAT Gateway per AZ (3 for a 3-AZ deployment). Update each AZ\'s private route table to point 0.0.0.0/0 to the local AZ\'s NAT GW. Added cost: ~$64/month for 2 additional NAT GWs. Eliminated risk: one AZ outage doesn\'t kill internet access for all other AZs.',
        severity: 'critical',
      },
      {
        name: 'NAT Gateway Data Processing Cost Spike',
        cause: 'A new service (e.g., streaming large files, high-volume ML training data downloads, or a service that mistakenly downloads S3 objects through NAT instead of VPC Endpoint) launches and generates massive outbound traffic through the NAT Gateway',
        symptom: 'AWS bill shows unexpectedly high "NatGateway-Bytes" charges. $0.045/GB × high volume = thousands of dollars for what should be cheap AWS API traffic.',
        fix: 'Enable VPC Flow Logs on the NAT Gateway ENI and analyze the top destination IPs. If top destinations are AWS service IPs (S3, DynamoDB), create VPC Endpoints to redirect that traffic. Use Cost Explorer to identify the offending service and redeploy it with endpoint-aware SDK configuration.',
        severity: 'high',
      },
      {
        name: 'Private Subnet Cannot Reach Internet After Deploy',
        cause: 'New VPC created with public and private subnets, but NAT Gateway creation was skipped or the private route table was not updated to route 0.0.0.0/0 to the NAT GW',
        symptom: 'Instances in private subnets report connection timeouts when reaching external endpoints. Package manager (apt, yum) fails; external API calls time out; no DNS resolution for external names.',
        fix: 'Create NAT Gateway in a public subnet, allocate an EIP, then add route 0.0.0.0/0 → nat-gateway-id to the private subnet route table. Verify by running curl https://checkip.amazonaws.com from the instance — it should return the NAT GW\'s EIP.',
        severity: 'high',
      },
      {
        name: 'NAT Gateway Bandwidth Limit Hit',
        cause: 'A single NAT Gateway has a maximum bandwidth of 100 Gbps. A data-intensive workload (large ML training data transfers, streaming video processing) approaches or exceeds this limit in a single AZ.',
        symptom: 'Throughput plateaus; VPC Flow Logs show dropped packets; application reports unexpectedly low throughput despite instances having spare CPU and network capacity.',
        fix: 'Distribute traffic across multiple NAT Gateways by using multiple subnets (each with its own NAT GW) and distributing instances across subnets. Alternatively, move large data transfer workloads to use S3 Transfer Acceleration or Direct Connect.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🏢📬🚪',
      t: 'The front door vs the one-way mail slot',
      tx: 'Imagine your private servers as employees in a secure office with no public address. The building has a front door (Internet Gateway) — but it\'s only usable by people who are publicly listed in the building directory (have a public IP). Your private servers aren\'t in the directory. They\'re in the back office.\n\nWhen a back-office employee needs to send mail to the outside world (outbound internet access), there\'s a mailroom (NAT Gateway) in the lobby. The employee hands their letter to the mailroom, which puts its own return address (the Elastic IP) on the envelope and sends it out. When the reply comes back addressed to the mailroom, they know who in the back office it\'s for and deliver it. Nobody outside can send mail directly to the back-office employee — the mailroom is a one-way slot from outside\'s perspective.\n\nThere are two critical costs to this system: the mailroom charges by the hour to operate ($0.045/hr) AND by the weight of mail processed ($0.045/GB). So if your employees are constantly exchanging large packages with Amazon warehouses (AWS S3), it\'s smarter to build a direct private tunnel to the warehouse (VPC Gateway Endpoint) that bypasses the mailroom entirely. The tunnel is free.\n\nThe mistake most teams make: they put one mailroom on the ground floor (single NAT GW in one AZ), but employees are on five different floors (multiple AZs). When that floor\'s elevator breaks (AZ outage), nobody can reach the mailroom. The fix is one mailroom per floor.',
      s: 'The billing insight: VPC Flow Logs classify NAT Gateway traffic by source/destination. Run this analysis immediately when your NAT costs spike. In practice, 40–60% of NAT Gateway traffic in most AWS accounts is to S3 or DynamoDB — both of which support free Gateway Endpoints. Enabling Gateway Endpoints is a 5-minute change that commonly reduces NAT bills by hundreds of dollars per month.',
    },
    te: {
      def: 'An Internet Gateway is a VPC-attached gateway enabling bidirectional public internet connectivity for resources with public IPs. A NAT Gateway is a managed service in a public subnet that performs outbound Source NAT for private subnet resources, allowing internet-initiated connections without exposing private resources.',
      types: [
        { n: 'Public NAT Gateway', d: 'Standard NAT Gateway in a public subnet with an EIP. Allows private subnet resources to reach the public internet. Most common type.' },
        { n: 'Private NAT Gateway', d: 'NAT Gateway without EIP, used for routing between VPCs with overlapping CIDRs (via Transit Gateway) or for on-premises connectivity scenarios where IP translation is needed.' },
        { n: 'Gateway VPC Endpoint', d: 'Free route-based endpoint for S3 and DynamoDB. Replaces NAT for those services with a direct, low-latency AWS internal path.' },
        { n: 'Interface VPC Endpoint (PrivateLink)', d: 'ENI-based endpoint for most AWS services. Creates a private IP in your subnet that resolves the service\'s DNS. Charged per hour and per GB.' },
        { n: 'Egress-Only IGW', d: 'IPv6-only outbound gateway. Allows IPv6 instances to initiate connections without accepting inbound, analogous to NAT for IPv4.' },
      ],
      when: 'NAT Gateway is required whenever private subnet resources need internet access (pulling packages, calling external APIs, licensing checks). It is NOT needed for access to AWS services — use VPC Endpoints for those.',
      trade: 'NAT Gateway eliminates the operational burden of managing NAT instances (patching, failover, bandwidth limits) at the cost of $0.045/hour + $0.045/GB. The per-GB cost scales linearly with traffic and is the primary surprise in AWS bills for teams with data-intensive private-subnet workloads. Systematic use of VPC Endpoints for AWS services is the most impactful mitigation.',
      code: `# Terraform: per-AZ NAT Gateways with VPC Gateway Endpoint for S3/DynamoDB

data "aws_availability_zones" "azs" { state = "available" }

# Elastic IPs for NAT Gateways (one per AZ)
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  tags   = { Name = "nat-eip-az\${count.index + 1}" }
}

# NAT Gateways in public subnets (one per AZ)
resource "aws_nat_gateway" "nat" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.igw]
  tags          = { Name = "nat-az\${count.index + 1}" }
}

# Private route tables — each AZ routes to its OWN NAT GW
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }
  tags = { Name = "private-rt-az\${count.index + 1}" }
}

resource "aws_route_table_association" "private_app" {
  count          = 2
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# FREE Gateway Endpoints — bypass NAT for S3 and DynamoDB
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.\${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.\${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
}`,
      rw: {
        ex: [
          'Dropbox reduced AWS data transfer costs by 40% by auditing NAT Gateway traffic and discovering most volume was S3 traffic that could be routed via free Gateway Endpoints',
          'Slack runs per-AZ NAT Gateways in every production VPC, preventing cross-AZ data transfer charges and eliminating AZ-level single points of failure for outbound internet access',
          'GitHub uses both NAT Gateways for general internet traffic and PrivateLink endpoints for AWS service traffic (ECR, SSM, CloudWatch), keeping all AWS API calls within the AWS network',
        ],
        cs: 'A startup running ML model training noticed their NAT Gateway costs hit $4,200 in one month after a data team began running training jobs that downloaded datasets from S3. They assumed S3 traffic used free bandwidth since they were in the same region. Analysis of VPC Flow Logs revealed 93TB of data routed through the NAT Gateway at $0.045/GB — $4,185. Adding an S3 Gateway VPC Endpoint took 10 minutes and immediately dropped the next month\'s NAT bill to $15 (genuine external API traffic only). The Gateway Endpoint cost: $0.',
      },
    },
    interview: {
      q: 'Your NAT Gateway costs jumped from $200/month to $4,000/month after a new service launched. How do you diagnose and fix it?',
      a: 'First, confirm the spike in Cost Explorer, filtered by "NatGateway-Bytes" to separate data processing from the hourly cost. The $3,800 increase at $0.045/GB implies roughly 84TB of new data flowing through NAT. Second, enable or query VPC Flow Logs for the NAT Gateway ENI — filter for ACCEPT records with the NAT GW\'s private IP as destination and look at the source IPs (which EC2 instances or tasks) and destination IPs (what they\'re calling). Third, if the top destinations are in AWS IP ranges — specifically S3 or DynamoDB prefixes — that\'s the smoking gun: create Gateway VPC Endpoints for those services, which routes the traffic over AWS\'s internal network for free. Fourth, if it\'s genuine internet traffic (e.g., downloading training datasets from external URLs), profile which service is responsible and evaluate whether the data should be staged in S3 first (downloaded once, cached, served to workers from S3 via endpoint). Fifth, if it\'s cross-AZ routing (multiple AZs routing through a single NAT GW), deploy per-AZ NAT Gateways and update route tables — this also eliminates the $0.01/GB cross-AZ transfer surcharge.',
      fu: [
        'Explain the pricing model for NAT Gateway in detail: what events generate charges and what doesn\'t? What\'s the difference between NatGateway-Hours and NatGateway-Bytes?',
        'A compliance requirement mandates that all outbound internet traffic from your VPC be inspected for data exfiltration. How would you architect this using AWS Network Firewall and a NAT Gateway?',
        'How do Gateway VPC Endpoints vs Interface VPC Endpoints differ in how they implement the routing, and why are Gateway Endpoints free while Interface Endpoints are not?',
        'Your IPv6 dual-stack VPC needs private subnets that can reach the internet but not be reached. What replaces the NAT Gateway in an IPv6 architecture?',
        'Explain Port Address Translation (PAT) — the mechanism NAT Gateway uses internally. What are the limits in terms of concurrent connections, and when do you hit them?',
        'Design a centralized egress architecture for 20 VPCs in an AWS Organization where all internet-bound traffic flows through a single inspection VPC — what services do you use and how does routing work?',
      ],
    },
  },

  {
    id: 'ports-protocols',
    cat: 'cloud',
    color: '#22d3ee',
    icon: '🔌',
    title: 'Ports & Protocols',
    tag: 'The agreed language two machines use before they can talk',
    overview:
      'A port is a 16-bit number (0–65535) that identifies a specific process or service on a machine. Protocols define the rules of communication. TCP (Transmission Control Protocol) guarantees delivery, ordering, and error checking — used for HTTP, HTTPS, SSH, and database connections where every byte matters. UDP (User Datagram Protocol) is fire-and-forget — lower overhead, no delivery guarantees — used for DNS, video streaming, and gaming where speed matters more than reliability. Every connection has two ports: the server listens on a well-known port (443 for HTTPS) and the client uses a randomly assigned ephemeral port (typically 49152–65535) as its source.',
    components: [
      {
        name: 'Well-Known Ports (0–1023)',
        icon: '📋',
        role: 'Standardized ports for system services, require root/admin privileges to bind',
        detail:
          'Assigned by IANA. 22=SSH, 25=SMTP, 53=DNS, 80=HTTP, 110=POP3, 143=IMAP, 443=HTTPS, 587=SMTP submission, 993=IMAPS, 995=POP3S. Any service binding to a port below 1024 on Linux requires root privileges. Understanding these is foundational for Security Group configuration and firewall rule writing.',
      },
      {
        name: 'Registered Ports (1024–49151)',
        icon: '📝',
        role: 'Application-specific ports registered with IANA but not requiring root',
        detail:
          'Key examples: 3306=MySQL/Aurora MySQL, 5432=PostgreSQL/Aurora Postgres, 6379=Redis, 6380=Redis TLS, 11211=Memcached, 27017=MongoDB, 9092=Kafka, 5672=RabbitMQ AMQP, 15672=RabbitMQ management UI, 8080=HTTP alternate, 8443=HTTPS alternate. Every security group for a database tier should use the specific registered port, never a range.',
      },
      {
        name: 'Ephemeral Ports (49152–65535)',
        icon: '🎲',
        role: 'Randomly assigned client-side source ports for each outbound connection',
        detail:
          'When a client connects to port 443 on a server, the OS assigns an ephemeral port (e.g., 54321) as the source port. The server sends response packets to client:54321. If a NACL blocks outbound ports 49152–65535, every HTTPS response is silently dropped. This is the #1 NACL misconfiguration. Note: different OS implementations use different ranges (Linux: 32768–60999; Windows: 49152–65535; AWS NACLs recommend allowing 1024–65535 to cover all cases).',
      },
      {
        name: 'TCP Three-Way Handshake',
        icon: '🤝',
        role: 'Connection establishment protocol: SYN → SYN-ACK → ACK before data flows',
        detail:
          'Client sends SYN (synchronize) to server:443. Server responds SYN-ACK (synchronize-acknowledge) to client:54321. Client sends ACK (acknowledge). Now both parties have agreed on sequence numbers and the connection is established. For a Security Group, this entire exchange happens transparently — stateful tracking means the SYN is the packet that matches the inbound rule; subsequent SYN-ACK and ACK are automatically tracked as part of the same connection.',
      },
      {
        name: 'UDP',
        icon: '💨',
        role: 'Connectionless, best-effort delivery — no handshake, no retransmission',
        detail:
          'DNS queries use UDP port 53 for responses under 512 bytes (larger responses use TCP). QUIC (the protocol underlying HTTP/3) runs over UDP to avoid TCP\'s head-of-line blocking. Monitoring protocols (SNMP, syslog) use UDP. Security groups handle UDP rules identically to TCP syntax but without the statefulness nuance — however, AWS Security Groups ARE stateful for UDP too, so return traffic is allowed for established UDP flows.',
      },
      {
        name: 'ICMP',
        icon: '📡',
        role: 'Control protocol for network diagnostics — ping, traceroute, path MTU discovery',
        detail:
          'ICMP has type and code instead of ports. Type 8 = Echo Request (ping). Type 0 = Echo Reply. Type 3 Code 4 = Destination Unreachable, Fragmentation Needed — critical for Path MTU Discovery (PMTUD). Blocking ALL ICMP is a common misconfiguration: if you block ICMP Type 3 Code 4, PMTUD fails, causing TCP connections to hang on large packets (manifests as connections working for small payloads but failing for large ones).',
      },
      {
        name: 'VPC Flow Logs',
        icon: '📊',
        role: 'Captures IP traffic metadata at the ENI, subnet, or VPC level — includes protocol, ports, and ACCEPT/REJECT disposition',
        detail:
          'Flow log records include: version, account-id, interface-id, srcaddr, dstaddr, srcport, dstport, protocol (6=TCP, 17=UDP, 1=ICMP), packets, bytes, start, end, action (ACCEPT/REJECT), log-status. A REJECT on the destination port of an expected connection means either a Security Group rule is missing or a NACL is blocking it. A REJECT on a high ephemeral port almost always means a NACL is dropping return traffic.',
      },
    ],
    howItWorks:
      'A complete TCP connection from a browser to your application server: browser picks ephemeral port 54321, sends TCP SYN to server:443. The packet reaches the NACL inbound: rule 100 allows TCP 443 from 0.0.0.0/0 — ACCEPT. Packet reaches the Security Group inbound: rule allows TCP 443 from 0.0.0.0/0 — ACCEPT (and stateful tracking entry created). Server processes the request and responds: Security Group outbound is checked but the stateful entry marks this as an established connection — auto-allowed. Packet reaches NACL outbound: rule must explicitly allow TCP 1024–65535 (ephemeral range) to 0.0.0.0/0 — if missing, REJECT. If the NACL outbound rule exists, the response reaches the browser on port 54321. VPC Flow Logs at each stage record the srcaddr, dstaddr, srcport, dstport, and action.',
    decision: {
      choose: [
        'Specify exact ports in Security Group rules — never use port ranges like 0–65535 unless explicitly required',
        'Use Security Group references (SG ID as source) between tiers in the same VPC — more maintainable and readable than CIDR-based rules',
        'Allow ICMP Type 3 Code 4 (Fragmentation Needed) in NACLs to support PMTUD',
        'Always allow ephemeral ports (1024–65535) in NACL outbound rules for subnets hosting servers accepting inbound connections',
        'Use AWS Systems Manager Session Manager instead of opening port 22 inbound — no inbound SSH port needed',
      ],
      avoid: [
        'Opening 0.0.0.0/0 on any port in Security Groups — even for "temporary" debugging',
        'Blocking all ICMP — it breaks ping-based health checks and PMTUD, causing hard-to-diagnose connectivity issues with large payloads',
        'Forgetting that MongoDB (27017) and Redis (6379) run with no authentication by default — never expose these ports beyond the application tier',
        'Using port 8080 for production HTTPS — some corporate firewalls block non-standard ports',
      ],
      vs: [
        {
          name: 'TCP vs UDP',
          when: 'TCP for anything where reliability matters: databases, APIs, file transfers, SSH. UDP for latency-sensitive applications where occasional loss is acceptable: DNS lookups, video conferencing (Zoom/WebRTC), gaming, real-time telemetry. QUIC (HTTP/3) uses UDP to gain TLS + multiplexing without TCP\'s head-of-line blocking.',
        },
        {
          name: 'Port-level security vs mTLS',
          when: 'Port-level security (Security Groups) prevents unauthorized connections at the network layer. mTLS (mutual TLS) adds cryptographic authentication inside the connection — both parties present certificates proving their identity. Use both: SGs for network-level access, mTLS for service-to-service authentication inside the network.',
        },
      ],
    },
    failures: [
      {
        name: 'NACL Blocking Ephemeral Return Traffic',
        cause: 'NACL outbound rules don\'t include ports 1024–65535. Server accepts connections on port 443 but response packets to clients\' ephemeral ports are blocked at the NACL',
        symptom: 'TCP handshake succeeds (SYN/SYN-ACK/ACK complete) but no application data flows. Browser shows spinning loader or times out after handshake. VPC Flow Logs show ACCEPT on inbound port 443 and REJECT on outbound to high ports.',
        fix: 'Add NACL outbound rule: ALLOW TCP 1024–65535 to 0.0.0.0/0 (or the specific client CIDR). Also allow TCP 32768–60999 if clients include Linux systems. Best practice: allow 1024–65535 to cover all OS ephemeral range implementations.',
        severity: 'critical',
      },
      {
        name: 'Database Port Exposed to 0.0.0.0/0',
        cause: 'RDS, Redis, or MongoDB security group has an inbound rule allowing its default port from any source — typically added during initial setup and forgotten',
        symptom: 'Security scanner flags the open rule. In worst case, bots discover the open database port and attempt authentication attacks within minutes of exposure.',
        fix: 'Remove the overly-broad inbound rule and replace with a rule referencing only the application-tier Security Group ID. Enable AWS Config rule `restricted-common-ports` to alert on future violations.',
        severity: 'critical',
      },
      {
        name: 'ICMP Blocked Breaking PMTUD',
        cause: 'Security Group or NACL blocks all ICMP. A client sends a large TCP packet; router between client and server detects packet is too large for the next hop MTU (e.g., 1450 bytes for VPN) and sends back ICMP Type 3 Code 4 "Fragmentation Needed." The ICMP is dropped.',
        symptom: 'HTTPS connections work for small responses (login pages, small API calls) but hang or timeout on large responses (file downloads, large JSON payloads). This is a classic "works locally, breaks in VPN" symptom.',
        fix: 'Allow ICMP Type 3 Code 4 (Destination Unreachable: Fragmentation Needed) in Security Groups and NACLs. In SG, allow ICMP with type -1 (all types) or specifically type 3. Also configure TCP MSS clamping on instances: `sysctl -w net.ipv4.tcp_mtu_probing=1`.',
        severity: 'high',
      },
      {
        name: 'Redis/MongoDB Running Without Authentication',
        cause: 'Redis or MongoDB deployed with default configuration (no password) in a security group that was later widened during debugging',
        symptom: 'Any host that can reach port 6379 (Redis) or 27017 (MongoDB) can read and write all data without credentials. Public exposure is a total data breach; internal-only exposure still enables lateral movement.',
        fix: 'Enable Redis AUTH (requirepass) or Redis 6+ ACLs. Enable MongoDB authentication (security.authorization: enabled). These should be the default — never deploy these services without authentication, even in development.',
        severity: 'critical',
      },
      {
        name: 'Port Exhaustion on NAT Gateway',
        cause: 'A single EC2 instance opens thousands of short-lived connections to the same destination IP:port combination through a NAT Gateway, exhausting its port translation table for that combination (limit: 55,000 simultaneous connections per destination IP:port pair)',
        symptom: 'Application reports intermittent connection failures to external APIs despite NAT Gateway not being bandwidth-limited. Errors increase under load.',
        fix: 'Use connection pooling to limit open connections per destination. Spread load across multiple source IPs (use multiple instances or NAT Gateways). For persistent connections to specific services, use Interface VPC Endpoints where possible to bypass NAT entirely.',
        severity: 'high',
      },
    ],
    a: {
      v: '📮🏷️📬',
      t: 'Postal addresses and apartment numbers',
      tx: 'Think of an IP address like a building\'s street address — it gets your letter to the right building. But a building has thousands of apartments (ports), and you need the apartment number to reach the right person. When you send a letter to 203.0.113.10:443, you\'re saying "street address 203.0.113.10, apartment 443" — which is the HTTPS service inside that building.\n\nWhen you write a letter, you include your return address (your IP and your ephemeral port number — a randomly assigned mailbox). The web server\'s response comes back addressed to YOUR temporary mailbox. This is why blocking the ephemeral port range in a firewall rule is catastrophic: you\'ve allowed letters to arrive at apartment 443, but you\'ve padlocked all the return mailboxes, so responses can never get back to senders.\n\nThe protocol (TCP vs UDP) is like the delivery method. TCP is certified mail — the postal service gets an acknowledgment that the letter arrived, and resends it if not. UDP is dropping a postcard in a public mailbox — fast, no confirmation, and if it gets lost in transit, nobody tries again. For a database query you want certified mail (TCP). For a "ping" checking if a server is alive, a postcard is fine (ICMP).\n\nThe handshake (SYN/SYN-ACK/ACK) is like calling ahead before sending the letter: "Hey, I\'m going to send you something." "Great, I\'m ready." "OK, sending." Only after this three-step confirmation does the actual data flow. Security Groups track this handshake — they know the conversation is "established" and automatically allow the response.',
      s: 'The diagnostic pattern that saves hours: when a connection mysteriously fails, read VPC Flow Logs with these questions: (1) Do you see a record at all? If not, the packet never reached the ENI — routing issue. (2) Is the action ACCEPT or REJECT? REJECT means firewall blocked it. (3) What port was rejected? If it\'s a high ephemeral port, it\'s a NACL stateless block. If it\'s the destination service port, it\'s a Security Group or NACL blocking the inbound service port. The combination of protocol number (6=TCP, 17=UDP, 1=ICMP), source port, and destination port in the flow log tells you exactly what happened.',
    },
    te: {
      def: 'A port is a 16-bit logical endpoint number (0–65535) that distinguishes multiple concurrent network services on a single IP address. Protocols (TCP, UDP, ICMP) define the rules for connection establishment, data transfer, and error handling. Together they form the foundation of all internet communication and every firewall rule.',
      types: [
        { n: 'TCP (Transmission Control Protocol)', d: 'Connection-oriented, ordered, reliable delivery. Three-way handshake before data. Used for HTTP, HTTPS, SSH, databases, email. Stateful tracking allows return packets without explicit outbound rules in Security Groups.' },
        { n: 'UDP (User Datagram Protocol)', d: 'Connectionless, best-effort delivery. No handshake, no retransmission. Used for DNS, DHCP, video streaming, gaming, QUIC/HTTP3. Lower latency overhead but no reliability guarantee.' },
        { n: 'ICMP (Internet Control Message Protocol)', d: 'Not a data protocol — a control and diagnostic protocol. Carries error messages and operational information. Critical for ping, traceroute, and PMTUD. Not blocked by Security Groups by default.' },
        { n: 'QUIC/HTTP3', d: 'Google-developed protocol running over UDP. Provides TLS 1.3 + multiplexed streams without TCP head-of-line blocking. Now used by ~30% of web traffic. Requires UDP 443 to be open for best performance.' },
        { n: 'gRPC', d: 'Google\'s RPC framework using HTTP/2 over TCP port 443. Supports bidirectional streaming. Common for microservice communication. Requires HTTP/2 support in load balancers (ALB supports it; NLB passes it through).' },
      ],
      when: 'Every Security Group rule, NACL rule, and network debugging session requires understanding ports and protocols. This is foundational knowledge, not optional specialization.',
      trade: 'The trade-off in port and protocol design is security vs operational complexity. Locking down to exact ports (principle of least privilege) minimizes attack surface but requires diligent maintenance — every new service dependency requires a new rule. Broad port ranges reduce maintenance but widen blast radius. The right position: exact ports for production, documented in Infrastructure as Code with SG references for VPC-internal traffic.',
      code: `# VPC Flow Log analysis — bash/jq to diagnose connectivity issues
# Flow log fields: version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status

# Query Flow Logs in CloudWatch Insights (paste in CW Logs Insights console):
# fields @timestamp, srcAddr, dstAddr, srcPort, dstPort, protocol, action
# | filter interfaceId = "eni-0abc1234"
# | filter action = "REJECT"
# | sort @timestamp desc
# | limit 50

# Protocol numbers: 6=TCP, 17=UDP, 1=ICMP

# Diagnose from the instance itself:
# 1. Check listening ports:
# ss -tlnp        # TCP listening ports
# ss -ulnp        # UDP listening ports

# 2. Test connectivity to a destination:
# nc -zv rds-hostname.us-east-1.rds.amazonaws.com 5432
# # "Connection to ... 5432 port [tcp/postgresql] succeeded!" = open
# # "Ncat: Connection timed out" = blocked (NACL or no route)
# # "Ncat: Connection refused" = reachable but nothing listening

# 3. Trace the route:
# traceroute -T -p 443 api.example.com   # TCP traceroute on port 443

# 4. Check ephemeral port range on this OS:
# cat /proc/sys/net/ipv4/ip_local_port_range
# # Default: 32768 60999 (Linux)
# # AWS NACL recommendation: allow 1024-65535 to cover all OS variants

# Critical ports reference:
# Port  Protocol  Service
# 22    TCP       SSH (prefer SSM over open port 22)
# 25    TCP       SMTP sending
# 53    TCP/UDP   DNS
# 80    TCP       HTTP
# 443   TCP       HTTPS / QUIC
# 3306  TCP       MySQL / Aurora MySQL
# 5432  TCP       PostgreSQL / Aurora Postgres
# 6379  TCP       Redis
# 6380  TCP       Redis TLS
# 9092  TCP       Kafka broker
# 11211 TCP/UDP   Memcached (no auth by default - never expose externally)
# 27017 TCP       MongoDB (no auth by default - never expose externally)`,
      rw: {
        ex: [
          'Cloudflare runs all 443 traffic with QUIC/HTTP3 (UDP 443) enabled globally — their edge nodes detect QUIC capability in the first packet and upgrade the connection, reducing latency 10–15% for supported clients',
          'AWS ALBs support HTTP/2 (gRPC) on port 443 natively — when Stripe migrated internal services from REST to gRPC, they used ALBs for routing without any port configuration changes',
          'PagerDuty\'s on-call pages use HTTPS (443) for delivery but SMS failover uses SMTP (25) routing through SES — their Security Group configuration explicitly allows only these specific ports with SG references',
        ],
        cs: 'An e-commerce team deployed a Redis cluster in a private subnet with port 6379 open to the app-tier Security Group only — correct configuration. Six weeks later, during a load test, they added a debugging rule opening 6379 to 0.0.0.0/0 and forgot to remove it. A security scanner caught the rule during a quarterly review, 5 weeks after the debugging session. During those 5 weeks, the Redis cache (containing session tokens and user IDs) was accessible from the public internet with no authentication (Redis default). There was no evidence of breach, but the incident triggered a full audit, SSO implementation, and mandatory Infrastructure as Code for all security group changes.',
      },
    },
    interview: {
      q: 'A service your team deploys can\'t connect to the RDS instance. You have VPC Flow Logs enabled. Walk me through exactly what you check and what a successful vs blocked connection looks like in the logs.',
      a: 'First, check basic connectivity: can the instance resolve the RDS DNS name to a private IP? Run nslookup or dig from the instance — if DNS fails, the RDS subnet group or VPC DNS settings are wrong. Second, try nc -zv rds-endpoint 5432. If it times out, it\'s a routing or firewall issue. If "connection refused," RDS is reachable but the service isn\'t listening on that port (unlikely for RDS but possible if the port in the connection string is wrong). Third, check VPC Flow Logs for the source instance\'s ENI. A successful TCP connection looks like: ACCEPT on srcport=ephemeral, dstport=5432, protocol=6, then ACCEPT on the return flow (srcport=5432, dstport=ephemeral). A blocked connection from a Security Group looks like: no flow log record at all for the denied traffic (SG blocks before the packet is logged as REJECT — actually SG REJECTs do appear in flow logs). A NACL block looks like: ACCEPT on the inbound record, then REJECT on the return outbound high-port record. Fourth, verify the Security Group on the RDS instance has an inbound rule allowing port 5432 from the source instance\'s Security Group. Fifth, verify both the source and destination subnets\' NACLs have inbound and outbound rules covering port 5432 and the ephemeral range. The most common finding: a Security Group rule referencing the app SG by ID exists, but a recent scale-out event put instances in a new SG that isn\'t referenced.',
      fu: [
        'VPC Flow Logs show ACCEPT for inbound packets but no corresponding outbound records. What does that tell you, and what specific field in the flow log helps you distinguish a NACL rejection from an application-layer refusal?',
        'Explain the difference between a TCP RST (reset) response and a connection timeout at the application layer — which one do you see when a Security Group blocks the connection, and why?',
        'How would you design Security Group rules for a service mesh where 200 microservices need to call each other selectively — without creating O(n²) SG rules?',
        'A database migration requires you to allow temporary connectivity from a legacy on-premises server (static IP) to Aurora PostgreSQL. What\'s the safest way to implement this that has a clear expiration mechanism?',
        'Explain how mTLS changes the port and protocol story for internal microservice communication — what network-level controls become redundant, and which remain valuable?',
        'How does QUIC\'s use of UDP port 443 affect your Security Group and NACL configurations for a web application? What breaks if you haven\'t allowed UDP 443?',
      ],
    },
  },
];
