import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

export interface DiagramData {
  nodes: Node[];
  edges: Edge[];
  description: string;
}

/* ── Edge style helpers ──────────────────────────────────────────── */

function arrow(color: string) {
  return { type: MarkerType.ArrowClosed, color, width: 14, height: 14 };
}

/** Animated solid edge with arrow */
function ae(color: string, label?: string): Partial<Edge> {
  return {
    animated: true,
    style: { stroke: color, strokeWidth: 1.8 },
    markerEnd: arrow(color),
    ...(label ? { label, labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 }, labelBgStyle: { fill: 'rgba(6,10,18,0.9)', fillOpacity: 1 }, labelBgPadding: [4, 6] as [number, number], labelBgBorderRadius: 4 } : {}),
  };
}

/** Static dashed edge with arrow */
function de(color: string, label?: string): Partial<Edge> {
  return {
    animated: false,
    style: { stroke: color, strokeWidth: 1.6, strokeDasharray: '6 3' },
    markerEnd: arrow(color),
    ...(label ? { label, labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 }, labelBgStyle: { fill: 'rgba(6,10,18,0.9)', fillOpacity: 1 }, labelBgPadding: [4, 6] as [number, number], labelBgBorderRadius: 4 } : {}),
  };
}

/* ── CLOUD DIAGRAMS ──────────────────────────────────────────────── */

export const CLOUD_DIAGRAMS: Record<string, DiagramData> = {

  /* ── 1. VPC ── */
  vpc: {
    description: 'VPC isolates your infrastructure in a private network. Public subnets face the internet; private subnets route outbound-only through NAT. VPC Endpoints reach AWS services without leaving the VPC.',
    nodes: [
      { id: 'inet',   type: 'source',  position: { x: 0,   y: 110 }, data: { label: 'Internet',         sub: 'public traffic',                color: '#38bdf8' } },
      { id: 'igw',    type: 'process', position: { x: 160, y: 110 }, data: { label: 'Internet Gateway',  sub: 'VPC entry point',               color: '#4db0c9' } },
      { id: 'alb',    type: 'process', position: { x: 330, y: 30  }, data: { label: 'ALB',               sub: 'public subnet · 10.0.1.0/24',   color: '#4db0c9' } },
      { id: 'natgw',  type: 'process', position: { x: 330, y: 120 }, data: { label: 'NAT Gateway',       sub: 'outbound-only for private',     color: '#4db0c9' } },
      { id: 'ec2',    type: 'sink',    position: { x: 520, y: 30  }, data: { label: 'App EC2',           sub: 'private · 10.0.2.0/24',         color: '#f97316' } },
      { id: 'rds',    type: 'sink',    position: { x: 520, y: 120 }, data: { label: 'RDS Primary',       sub: 'private · 10.0.3.0/24',         color: '#8b78d4' } },
      { id: 'vpce',   type: 'process', position: { x: 330, y: 210 }, data: { label: 'VPC Endpoint',      sub: 'gateway type · no internet',    color: '#34d399' } },
      { id: 's3',     type: 'sink',    position: { x: 520, y: 210 }, data: { label: 'S3 / DynamoDB',     sub: 'private AWS access',            color: '#34d399' } },
      { id: 'metric', type: 'metric',  position: { x: 0,   y: 270 }, data: { label: 'Private subnet EC2 → NAT GW → Internet (outbound only). Inbound internet: blocked.' } },
    ],
    edges: [
      { id: 'e-inet-igw',   source: 'inet',  target: 'igw',   ...ae('#38bdf8') },
      { id: 'e-igw-alb',    source: 'igw',   target: 'alb',   ...ae('#4db0c9') },
      { id: 'e-igw-natgw',  source: 'igw',   target: 'natgw', ...ae('#4db0c9') },
      { id: 'e-alb-ec2',    source: 'alb',   target: 'ec2',   ...ae('#f97316') },
      { id: 'e-ec2-rds',    source: 'ec2',   target: 'rds',   ...ae('#8b78d4') },
      { id: 'e-natgw-igw',  source: 'natgw', target: 'igw',   ...de('#4db0c9', 'outbound') },
      { id: 'e-ec2-vpce',   source: 'ec2',   target: 'vpce',  ...de('#34d399', 'private') },
      { id: 'e-vpce-s3',    source: 'vpce',  target: 's3',    ...ae('#34d399') },
    ],
  },

  /* ── 2. Subnets ── */
  subnets: {
    description: 'Subnets partition a VPC across Availability Zones. Public subnets route to the IGW; private subnets route to NAT. Multi-AZ deployment survives a full AZ outage.',
    nodes: [
      { id: 'label-az-a', type: 'label',   position: { x: 160, y: -30 }, data: { label: 'AZ us-east-1a',    color: '#4db0c9' } },
      { id: 'label-az-b', type: 'label',   position: { x: 440, y: -30 }, data: { label: 'AZ us-east-1b',    color: '#4db0c9' } },
      { id: 'igw',        type: 'source',  position: { x: 0,   y: 110 }, data: { label: 'Internet Gateway',  sub: 'VPC: 10.0.0.0/16',             color: '#38bdf8' } },
      { id: 'pub-a',      type: 'process', position: { x: 160, y: 30  }, data: { label: 'Public Subnet A',   sub: '10.0.1.0/24 · ALB',            color: '#4db0c9' } },
      { id: 'priv-a',     type: 'sink',    position: { x: 160, y: 130 }, data: { label: 'Private Subnet A',  sub: '10.0.2.0/24 · App EC2',        color: '#f97316' } },
      { id: 'pub-b',      type: 'process', position: { x: 440, y: 30  }, data: { label: 'Public Subnet B',   sub: '10.0.3.0/24 · ALB',            color: '#4db0c9' } },
      { id: 'priv-b',     type: 'sink',    position: { x: 440, y: 130 }, data: { label: 'Private Subnet B',  sub: '10.0.4.0/24 · App EC2',        color: '#f97316' } },
      { id: 'rds-a',      type: 'sink',    position: { x: 160, y: 220 }, data: { label: 'RDS Primary',       sub: 'private subnet A',             color: '#8b78d4' } },
      { id: 'rds-b',      type: 'sink',    position: { x: 440, y: 220 }, data: { label: 'RDS Standby',       sub: 'private subnet B · failover',  color: '#8b78d4' } },
      { id: 'metric',     type: 'metric',  position: { x: 300, y: 295 }, data: { label: 'Multi-AZ: AZ outage only takes down half your capacity — other AZ stays live' } },
    ],
    edges: [
      { id: 'e-igw-puba',   source: 'igw',    target: 'pub-a',  ...ae('#4db0c9') },
      { id: 'e-igw-pubb',   source: 'igw',    target: 'pub-b',  ...ae('#4db0c9') },
      { id: 'e-puba-priva', source: 'pub-a',  target: 'priv-a', ...ae('#f97316', 'route: NAT GW') },
      { id: 'e-pubb-privb', source: 'pub-b',  target: 'priv-b', ...ae('#f97316', 'route: NAT GW') },
      { id: 'e-priva-rdsa', source: 'priv-a', target: 'rds-a',  ...ae('#8b78d4') },
      { id: 'e-privb-rdsb', source: 'priv-b', target: 'rds-b',  ...ae('#8b78d4') },
      { id: 'e-rdsa-rdsb',  source: 'rds-a',  target: 'rds-b',  ...de('#8b78d4', 'sync replication') },
    ],
  },

  /* ── 3. Security Groups ── */
  'security-groups': {
    description: 'Security groups are stateful firewalls attached to resources. Rules reference other security groups by ID — not IP ranges — so they move with instances regardless of IP.',
    nodes: [
      { id: 'inet',   type: 'source',  position: { x: 0,   y: 100 }, data: { label: 'Internet',            sub: '0.0.0.0/0',                     color: '#38bdf8' } },
      { id: 'sg-alb', type: 'process', position: { x: 160, y: 100 }, data: { label: 'ALB Security Group',   sub: 'in: 443/0.0.0.0/0 ✓',          color: '#4db0c9' } },
      { id: 'alb',    type: 'process', position: { x: 320, y: 100 }, data: { label: 'ALB',                  sub: '',                              color: '#4db0c9' } },
      { id: 'sg-app', type: 'process', position: { x: 160, y: 190 }, data: { label: 'App Security Group',   sub: 'in: 8080/sg-alb only ✓',       color: '#f97316' } },
      { id: 'app',    type: 'sink',    position: { x: 320, y: 190 }, data: { label: 'App EC2',              sub: '',                              color: '#f97316' } },
      { id: 'sg-db',  type: 'process', position: { x: 160, y: 280 }, data: { label: 'DB Security Group',    sub: 'in: 5432/sg-app only ✓',       color: '#8b78d4' } },
      { id: 'rds',    type: 'sink',    position: { x: 320, y: 280 }, data: { label: 'RDS',                  sub: '',                              color: '#8b78d4' } },
      { id: 'block',  type: 'error',   position: { x: 320, y: 10  }, data: { label: 'Direct DB Access',     sub: 'blocked — no rule',             color: '#f87171' } },
      { id: 'metric', type: 'metric',  position: { x: 0,   y: 355 }, data: { label: 'Stateful: allow inbound 443 → return traffic automatically allowed. No explicit outbound rule needed.' } },
    ],
    edges: [
      { id: 'e-inet-sgalb', source: 'inet',   target: 'sg-alb', ...ae('#38bdf8') },
      { id: 'e-sgalb-alb',  source: 'sg-alb', target: 'alb',    ...ae('#4db0c9') },
      { id: 'e-alb-sgapp',  source: 'alb',    target: 'sg-app', ...ae('#f97316') },
      { id: 'e-sgapp-app',  source: 'sg-app', target: 'app',    ...ae('#f97316') },
      { id: 'e-app-sgdb',   source: 'app',    target: 'sg-db',  ...ae('#8b78d4') },
      { id: 'e-sgdb-rds',   source: 'sg-db',  target: 'rds',    ...ae('#8b78d4') },
      { id: 'e-inet-block', source: 'inet',   target: 'block',  ...de('#f87171', 'blocked') },
    ],
  },

  /* ── 4. NAT Gateway ── */
  'nat-gateway': {
    description: "NAT Gateway gives private subnet resources outbound internet access while remaining unreachable from the internet. All outbound traffic gets the NAT GW's Elastic IP.",
    nodes: [
      { id: 'priv',   type: 'source',  position: { x: 0,   y: 100 }, data: { label: 'Private EC2',      sub: '10.0.2.5 · no public IP',             color: '#f97316' } },
      { id: 'natgw',  type: 'process', position: { x: 190, y: 100 }, data: { label: 'NAT Gateway',       sub: 'public subnet · EIP: 52.x.x.x',      color: '#4db0c9' } },
      { id: 'igw',    type: 'process', position: { x: 380, y: 100 }, data: { label: 'Internet Gateway',  sub: 'VPC edge',                            color: '#38bdf8' } },
      { id: 'inet',   type: 'sink',    position: { x: 560, y: 100 }, data: { label: 'Internet',          sub: 'npm install · apt-get',               color: '#38bdf8' } },
      { id: 'block',  type: 'error',   position: { x: 380, y: 220 }, data: { label: 'Inbound Blocked',   sub: 'internet cannot initiate to private', color: '#f87171' } },
      { id: 'metric', type: 'metric',  position: { x: 0,   y: 250 }, data: { label: 'Cost: $0.045/hr + $0.045/GB processed. One NAT GW per AZ for HA.' } },
    ],
    edges: [
      { id: 'e-priv-natgw', source: 'priv',  target: 'natgw', ...ae('#4db0c9', 'src: 10.0.2.5') },
      { id: 'e-natgw-igw',  source: 'natgw', target: 'igw',   ...ae('#38bdf8', 'SNAT: 52.x.x.x') },
      { id: 'e-igw-inet',   source: 'igw',   target: 'inet',  ...ae('#38bdf8') },
      { id: 'e-inet-block', source: 'inet',  target: 'block', ...de('#f87171', 'blocked') },
    ],
  },

  /* ── 5. Ports & Protocols ── */
  'ports-protocols': {
    description: 'Every service listens on a well-known port. Firewalls filter by port and protocol. Mixing up TCP/UDP or using wrong ports is one of the most common cloud connectivity issues.',
    nodes: [
      { id: 'client',  type: 'source',  position: { x: 0,   y: 100 }, data: { label: 'Client',               sub: 'ephemeral port 49152–65535', color: '#38bdf8' } },
      { id: 'fw',      type: 'process', position: { x: 180, y: 100 }, data: { label: 'Firewall / SG',         sub: 'allow: TCP 443, 22, 5432',  color: '#4db0c9' } },
      { id: 'https',   type: 'sink',    position: { x: 380, y: 10  }, data: { label: 'HTTPS · TCP/443',       sub: 'Nginx / ALB',               color: '#34d399' } },
      { id: 'ssh',     type: 'sink',    position: { x: 380, y: 80  }, data: { label: 'SSH · TCP/22',          sub: 'bastion host',              color: '#f59e0b' } },
      { id: 'pg',      type: 'sink',    position: { x: 380, y: 150 }, data: { label: 'PostgreSQL · TCP/5432', sub: 'RDS',                       color: '#8b78d4' } },
      { id: 'dns-udp', type: 'sink',    position: { x: 380, y: 220 }, data: { label: 'DNS · UDP/53',          sub: 'Route53 resolver',          color: '#4db0c9' } },
      { id: 'block',   type: 'error',   position: { x: 380, y: 290 }, data: { label: 'TCP/3389 RDP',          sub: 'blocked — not in rules',    color: '#f87171' } },
      { id: 'metric',  type: 'metric',  position: { x: 0,   y: 355 }, data: { label: 'UDP/53 for DNS queries. TCP/53 for large responses (>512 bytes). HTTPS only needs TCP.' } },
    ],
    edges: [
      { id: 'e-client-fw',  source: 'client', target: 'fw',      ...ae('#38bdf8') },
      { id: 'e-fw-https',   source: 'fw',     target: 'https',   ...ae('#34d399') },
      { id: 'e-fw-ssh',     source: 'fw',     target: 'ssh',     ...ae('#f59e0b') },
      { id: 'e-fw-pg',      source: 'fw',     target: 'pg',      ...ae('#8b78d4') },
      { id: 'e-fw-dns',     source: 'fw',     target: 'dns-udp', ...ae('#4db0c9', 'UDP') },
      { id: 'e-fw-block',   source: 'fw',     target: 'block',   ...de('#f87171', 'blocked') },
    ],
  },

  /* ── 6. EC2 Auto Scaling ── */
  ec2: {
    description: 'EC2 Auto Scaling adjusts capacity based on CloudWatch alarms. ALB distributes traffic across healthy instances. Multi-AZ RDS provides database redundancy.',
    nodes: [
      { id: 'client', type: 'source',  position: { x: 0,   y: 110 }, data: { label: 'Client',       sub: 'HTTP request',              color: '#38bdf8' } },
      { id: 'alb',    type: 'process', position: { x: 160, y: 110 }, data: { label: 'ALB',           sub: 'cross-AZ · health check',   color: '#4db0c9' } },
      { id: 'ec2-a',  type: 'sink',    position: { x: 340, y: 40  }, data: { label: 'EC2 (AZ-a)',    sub: 't3.medium · running',       color: '#f97316' } },
      { id: 'ec2-b',  type: 'sink',    position: { x: 340, y: 120 }, data: { label: 'EC2 (AZ-b)',    sub: 't3.medium · running',       color: '#f97316' } },
      { id: 'asg',    type: 'process', position: { x: 340, y: 210 }, data: { label: 'Auto Scaling',  sub: 'min:2 max:10 desired:2',    color: '#f59e0b' } },
      { id: 'cw',     type: 'process', position: { x: 160, y: 210 }, data: { label: 'CloudWatch',    sub: 'CPU > 70% → scale out',     color: '#f59e0b' } },
      { id: 'rds',    type: 'sink',    position: { x: 520, y: 110 }, data: { label: 'RDS Multi-AZ',  sub: 'primary + standby',         color: '#8b78d4' } },
      { id: 'metric', type: 'metric',  position: { x: 0,   y: 280 }, data: { label: 'Scale-out: 3 min avg CPU > 70%. Scale-in: 5 min avg CPU < 30% (cooldown prevents thrashing)' } },
    ],
    edges: [
      { id: 'e-client-alb', source: 'client', target: 'alb',   ...ae('#38bdf8') },
      { id: 'e-alb-ec2a',   source: 'alb',    target: 'ec2-a', ...ae('#f97316') },
      { id: 'e-alb-ec2b',   source: 'alb',    target: 'ec2-b', ...ae('#f97316') },
      { id: 'e-ec2a-rds',   source: 'ec2-a',  target: 'rds',   ...ae('#8b78d4') },
      { id: 'e-ec2b-rds',   source: 'ec2-b',  target: 'rds',   ...ae('#8b78d4') },
      { id: 'e-cw-asg',     source: 'cw',     target: 'asg',   ...ae('#f59e0b', 'alarm') },
      { id: 'e-asg-ec2a',   source: 'asg',    target: 'ec2-a', ...de('#f59e0b', 'launch') },
    ],
  },

  /* ── 7. Lambda ── */
  lambda: {
    description: 'Lambda invokes on events without managing servers. Cold starts add latency on first invocation. Provisioned concurrency pre-warms instances for latency-sensitive workloads.',
    nodes: [
      { id: 'apigw',  type: 'source',  position: { x: 0,   y: 0   }, data: { label: 'API Gateway', sub: 'HTTP trigger',              color: '#38bdf8' } },
      { id: 's3ev',   type: 'source',  position: { x: 0,   y: 80  }, data: { label: 'S3 Event',    sub: 'object created',            color: '#38bdf8' } },
      { id: 'eb',     type: 'source',  position: { x: 0,   y: 160 }, data: { label: 'EventBridge', sub: 'scheduled / rule',          color: '#38bdf8' } },
      { id: 'sqs',    type: 'source',  position: { x: 0,   y: 240 }, data: { label: 'SQS Queue',   sub: 'batch trigger',             color: '#38bdf8' } },
      { id: 'fn',     type: 'process', position: { x: 210, y: 120 }, data: { label: 'Lambda Function', sub: 'cold start ~100ms / warm ~1ms', color: '#f59e0b' } },
      { id: 'ddb',    type: 'sink',    position: { x: 420, y: 40  }, data: { label: 'DynamoDB',    sub: 'write result',              color: '#34d399' } },
      { id: 's3out',  type: 'sink',    position: { x: 420, y: 130 }, data: { label: 'S3 Bucket',   sub: 'store output',             color: '#34d399' } },
      { id: 'sns',    type: 'sink',    position: { x: 420, y: 220 }, data: { label: 'SNS Topic',   sub: 'fan-out notification',     color: '#f97316' } },
      { id: 'metric', type: 'metric',  position: { x: 210, y: 295 }, data: { label: 'Provisioned concurrency keeps N instances warm. Max 15min timeout. 3008MB max memory.' } },
    ],
    edges: [
      { id: 'e-apigw-fn', source: 'apigw', target: 'fn',    ...ae('#38bdf8') },
      { id: 'e-s3ev-fn',  source: 's3ev',  target: 'fn',    ...ae('#38bdf8') },
      { id: 'e-eb-fn',    source: 'eb',    target: 'fn',    ...ae('#38bdf8') },
      { id: 'e-sqs-fn',   source: 'sqs',   target: 'fn',    ...ae('#38bdf8') },
      { id: 'e-fn-ddb',   source: 'fn',    target: 'ddb',   ...ae('#34d399') },
      { id: 'e-fn-s3out', source: 'fn',    target: 's3out', ...ae('#34d399') },
      { id: 'e-fn-sns',   source: 'fn',    target: 'sns',   ...ae('#f97316') },
    ],
  },

  /* ── 8. Containers ── */
  containers: {
    description: 'Container images are built once and run anywhere. ECR stores them. ECS Fargate or EKS runs them as Tasks/Pods. The ALB routes traffic across healthy containers.',
    nodes: [
      { id: 'dev',    type: 'source',  position: { x: 0,   y: 100 }, data: { label: 'Developer',        sub: 'docker build / push',              color: '#38bdf8' } },
      { id: 'ecr',    type: 'process', position: { x: 170, y: 100 }, data: { label: 'ECR',               sub: 'container registry',               color: '#4db0c9' } },
      { id: 'ecs',    type: 'process', position: { x: 340, y: 50  }, data: { label: 'ECS Fargate',       sub: 'serverless containers',            color: '#4db0c9' } },
      { id: 'eks',    type: 'process', position: { x: 340, y: 160 }, data: { label: 'EKS (Kubernetes)',  sub: 'managed K8s cluster',              color: '#4db0c9' } },
      { id: 'task',   type: 'sink',    position: { x: 510, y: 30  }, data: { label: 'Task / Pod',        sub: 'app:v2 · 0.5vCPU 1GB',            color: '#34d399' } },
      { id: 'task2',  type: 'sink',    position: { x: 510, y: 100 }, data: { label: 'Task / Pod',        sub: 'app:v2 · replica 2',              color: '#34d399' } },
      { id: 'alb',    type: 'process', position: { x: 510, y: 190 }, data: { label: 'ALB',               sub: 'target group · health /health',    color: '#4db0c9' } },
      { id: 'client', type: 'sink',    position: { x: 670, y: 190 }, data: { label: 'Client',            sub: 'traffic',                         color: '#38bdf8' } },
      { id: 'metric', type: 'metric',  position: { x: 170, y: 265 }, data: { label: 'Rolling deploy: ECS replaces tasks one-by-one. Blue/green: switch ALB target group instantly.' } },
    ],
    edges: [
      { id: 'e-dev-ecr',    source: 'dev',   target: 'ecr',   ...ae('#4db0c9', 'push') },
      { id: 'e-ecr-ecs',    source: 'ecr',   target: 'ecs',   ...ae('#4db0c9', 'pull') },
      { id: 'e-ecr-eks',    source: 'ecr',   target: 'eks',   ...ae('#4db0c9', 'pull') },
      { id: 'e-ecs-task',   source: 'ecs',   target: 'task',  ...ae('#34d399') },
      { id: 'e-eks-task2',  source: 'eks',   target: 'task2', ...ae('#34d399') },
      { id: 'e-task-alb',   source: 'task',  target: 'alb',   ...ae('#4db0c9') },
      { id: 'e-task2-alb',  source: 'task2', target: 'alb',   ...ae('#4db0c9') },
      { id: 'e-alb-client', source: 'alb',   target: 'client',...ae('#38bdf8') },
    ],
  },

  /* ── 9. S3 ── */
  s3: {
    description: 'S3 provides infinitely scalable object storage. CloudFront CDN caches assets globally. Presigned URLs grant temporary direct access. Cross-region replication provides disaster recovery.',
    nodes: [
      { id: 'app',     type: 'source',  position: { x: 0,   y: 110 }, data: { label: 'Application',    sub: 'upload / read',                            color: '#38bdf8' } },
      { id: 'bucket',  type: 'process', position: { x: 185, y: 110 }, data: { label: 'S3 Bucket',       sub: 'versioning · lifecycle · 11 9s durability', color: '#34d399' } },
      { id: 'cf',      type: 'sink',    position: { x: 385, y: 20  }, data: { label: 'CloudFront CDN',  sub: 'global edge cache',                        color: '#4db0c9' } },
      { id: 'presign', type: 'sink',    position: { x: 385, y: 100 }, data: { label: 'Presigned URL',   sub: 'direct client upload · TTL',               color: '#f59e0b' } },
      { id: 'replica', type: 'sink',    position: { x: 385, y: 185 }, data: { label: 'Replica Bucket',  sub: 'cross-region · DR',                        color: '#34d399' } },
      { id: 'client',  type: 'sink',    position: { x: 560, y: 20  }, data: { label: 'End User',        sub: '~5ms from edge',                           color: '#38bdf8' } },
      { id: 'metric',  type: 'metric',  position: { x: 185, y: 275 }, data: { label: 'S3 Standard: 11 nines durability. Free intra-region transfer. Egress: $0.09/GB.' } },
    ],
    edges: [
      { id: 'e-app-bucket',     source: 'app',    target: 'bucket',  ...ae('#34d399') },
      { id: 'e-bucket-cf',      source: 'bucket', target: 'cf',      ...ae('#4db0c9', 'static assets') },
      { id: 'e-bucket-presign', source: 'bucket', target: 'presign', ...de('#f59e0b', 'generate') },
      { id: 'e-bucket-replica', source: 'bucket', target: 'replica', ...de('#34d399', 'async replication') },
      { id: 'e-cf-client',      source: 'cf',     target: 'client',  ...ae('#38bdf8', 'cached') },
    ],
  },

  /* ── 10. RDS ── */
  rds: {
    description: 'RDS Multi-AZ replicates synchronously to a standby — automatic failover in ~60s. Read Replicas use async replication to scale read-heavy workloads across regions.',
    nodes: [
      { id: 'app',     type: 'source',  position: { x: 0,   y: 110 }, data: { label: 'Application',    sub: 'read + write',                       color: '#38bdf8' } },
      { id: 'primary', type: 'process', position: { x: 185, y: 110 }, data: { label: 'RDS Primary',     sub: 'writer · AZ-a · Multi-AZ',           color: '#8b78d4' } },
      { id: 'standby', type: 'process', position: { x: 385, y: 50  }, data: { label: 'RDS Standby',     sub: 'AZ-b · sync replica · failover',     color: '#8b78d4' } },
      { id: 'rr1',     type: 'sink',    position: { x: 385, y: 140 }, data: { label: 'Read Replica 1',  sub: 'same region · async',                color: '#4db0c9' } },
      { id: 'rr2',     type: 'sink',    position: { x: 385, y: 210 }, data: { label: 'Read Replica 2',  sub: 'us-west-2 · cross-region',           color: '#4db0c9' } },
      { id: 'metric',  type: 'metric',  position: { x: 185, y: 285 }, data: { label: 'Failover: DNS CNAME flips to standby in ~60s. No data loss (sync). Read replicas: up to 5 per primary.' } },
    ],
    edges: [
      { id: 'e-app-primary',     source: 'app',     target: 'primary', ...ae('#8b78d4', 'reads + writes') },
      { id: 'e-primary-standby', source: 'primary', target: 'standby', ...ae('#8b78d4', 'sync') },
      { id: 'e-primary-rr1',     source: 'primary', target: 'rr1',     ...de('#4db0c9', 'async') },
      { id: 'e-primary-rr2',     source: 'primary', target: 'rr2',     ...de('#4db0c9', 'async') },
      { id: 'e-app-rr1',         source: 'app',     target: 'rr1',     ...de('#4db0c9', 'read offload') },
    ],
  },

  /* ── 11. IAM ── */
  iam: {
    description: 'IAM controls who can do what to which AWS resources. Roles + STS temporary credentials replace long-lived keys. Policies are JSON allow/deny rules attached to identities or resources.',
    nodes: [
      { id: 'user',   type: 'source',  position: { x: 0,   y: 20  }, data: { label: 'IAM User / Role',  sub: 'developer or EC2 instance',                      color: '#ef4444' } },
      { id: 'policy', type: 'process', position: { x: 175, y: 20  }, data: { label: 'IAM Policy',        sub: 'Allow: s3:GetObject on arn:aws:s3:::mybucket/*', color: '#ef4444' } },
      { id: 'sts',    type: 'process', position: { x: 175, y: 130 }, data: { label: 'STS AssumeRole',    sub: 'temp credentials · 15min–12hr',                  color: '#f59e0b' } },
      { id: 's3',     type: 'sink',    position: { x: 385, y: 20  }, data: { label: 'S3 Bucket',         sub: 'resource policy enforced',                       color: '#34d399' } },
      { id: 'ec2',    type: 'sink',    position: { x: 385, y: 100 }, data: { label: 'EC2 / Lambda',      sub: 'role attached · no static keys',                 color: '#f97316' } },
      { id: 'deny',   type: 'error',   position: { x: 385, y: 190 }, data: { label: 'Denied Action',     sub: 'no matching Allow rule',                         color: '#f87171' } },
      { id: 'metric', type: 'metric',  position: { x: 0,   y: 265 }, data: { label: 'Least privilege: deny by default. Explicit Allow required. Explicit Deny overrides any Allow.' } },
    ],
    edges: [
      { id: 'e-user-policy', source: 'user',   target: 'policy', ...ae('#ef4444', 'attached') },
      { id: 'e-policy-s3',   source: 'policy', target: 's3',     ...ae('#34d399', 'allow') },
      { id: 'e-policy-deny', source: 'policy', target: 'deny',   ...de('#f87171', 'no rule → deny') },
      { id: 'e-user-sts',    source: 'user',   target: 'sts',    ...de('#f59e0b', 'assume role') },
      { id: 'e-sts-ec2',     source: 'sts',    target: 'ec2',    ...ae('#f97316', 'temp creds') },
    ],
  },

  /* ── 12. DNS (Route53 basics) ── */
  dns: {
    description: "DNS translates human-readable names to IP addresses. Route53 is AWS's authoritative DNS with built-in health checks, routing policies, and sub-millisecond global resolution.",
    nodes: [
      { id: 'client',   type: 'source',  position: { x: 0,   y: 110 }, data: { label: 'Client Browser',  sub: 'query: api.example.com',          color: '#38bdf8' } },
      { id: 'r53',      type: 'process', position: { x: 185, y: 110 }, data: { label: 'Route53',          sub: 'authoritative DNS · 100% SLA',    color: '#4db0c9' } },
      { id: 'simple',   type: 'sink',    position: { x: 385, y: 30  }, data: { label: 'Simple Routing',   sub: 'one record → one IP',             color: '#34d399' } },
      { id: 'weighted', type: 'sink',    position: { x: 385, y: 100 }, data: { label: 'Weighted Routing',  sub: '70% us-east / 30% us-west',      color: '#f59e0b' } },
      { id: 'latency',  type: 'sink',    position: { x: 385, y: 170 }, data: { label: 'Latency Routing',  sub: 'nearest region wins',             color: '#4db0c9' } },
      { id: 'failover', type: 'sink',    position: { x: 385, y: 240 }, data: { label: 'Failover Routing', sub: 'primary → secondary on fail',     color: '#f97316' } },
      { id: 'metric',   type: 'metric',  position: { x: 185, y: 310 }, data: { label: 'TTL controls cache duration. Low TTL (60s) for deployments. High TTL (86400s) for stable records.' } },
    ],
    edges: [
      { id: 'e-client-r53',   source: 'client', target: 'r53',      ...ae('#38bdf8') },
      { id: 'e-r53-simple',   source: 'r53',    target: 'simple',   ...ae('#34d399') },
      { id: 'e-r53-weighted', source: 'r53',    target: 'weighted', ...ae('#f59e0b') },
      { id: 'e-r53-latency',  source: 'r53',    target: 'latency',  ...ae('#4db0c9') },
      { id: 'e-r53-failover', source: 'r53',    target: 'failover', ...ae('#f97316') },
    ],
  },

  /* ── 13. Route53 Health Checks ── */
  route53: {
    description: 'Route53 health checks poll endpoints every 10–30s. Unhealthy endpoints are automatically removed from DNS responses. Failover pairs ensure zero-downtime regional outages.',
    nodes: [
      { id: 'client',    type: 'source',  position: { x: 0,   y: 100 }, data: { label: 'Client',              sub: 'DNS query',                        color: '#38bdf8' } },
      { id: 'r53',       type: 'process', position: { x: 185, y: 100 }, data: { label: 'Route53',              sub: 'health-check-aware routing',       color: '#4db0c9' } },
      { id: 'hc',        type: 'process', position: { x: 185, y: 210 }, data: { label: 'Health Checker',       sub: '15 global checkers · every 10s',   color: '#f59e0b' } },
      { id: 'primary',   type: 'sink',    position: { x: 390, y: 40  }, data: { label: 'Primary Endpoint',     sub: 'us-east-1 · healthy ✓',           color: '#34d399' } },
      { id: 'secondary', type: 'sink',    position: { x: 390, y: 140 }, data: { label: 'Secondary Endpoint',   sub: 'us-west-2 · failover',             color: '#f59e0b' } },
      { id: 'fail',      type: 'error',   position: { x: 390, y: 240 }, data: { label: 'Unhealthy Primary',    sub: 'removed from DNS',                 color: '#f87171' } },
      { id: 'metric',    type: 'metric',  position: { x: 0,   y: 285 }, data: { label: 'Failover RTO: 30–60s (health check interval + DNS TTL). RPO: 0 (traffic shifts, data stays).' } },
    ],
    edges: [
      { id: 'e-client-r53',     source: 'client', target: 'r53',       ...ae('#38bdf8') },
      { id: 'e-hc-primary',     source: 'hc',     target: 'primary',   ...de('#34d399', 'check /health') },
      { id: 'e-hc-fail',        source: 'hc',     target: 'fail',      ...de('#f87171', '3 fails → unhealthy') },
      { id: 'e-r53-primary',    source: 'r53',    target: 'primary',   ...ae('#34d399', 'healthy') },
      { id: 'e-r53-secondary',  source: 'r53',    target: 'secondary', ...de('#f59e0b', 'failover') },
      { id: 'e-fail-secondary', source: 'fail',   target: 'secondary', ...de('#f87171', 'failover triggered') },
    ],
  },

  /* ── 14. Cloudflare ── */
  cloudflare: {
    description: 'Cloudflare sits between users and your origin — providing DDoS mitigation, WAF, TLS termination, and CDN caching at 300+ edge locations before a single packet reaches your server.',
    nodes: [
      { id: 'user-eu',  type: 'source',  position: { x: 0,   y: 0   }, data: { label: 'User EU',        sub: 'Frankfurt · ~5ms',                color: '#38bdf8' } },
      { id: 'user-us',  type: 'source',  position: { x: 0,   y: 90  }, data: { label: 'User US',        sub: 'New York · ~8ms',                 color: '#38bdf8' } },
      { id: 'user-ap',  type: 'source',  position: { x: 0,   y: 180 }, data: { label: 'User APAC',      sub: 'Tokyo · ~6ms',                    color: '#38bdf8' } },
      { id: 'anycast',  type: 'process', position: { x: 185, y: 90  }, data: { label: 'Anycast DNS',     sub: '300+ PoPs · routes to nearest',   color: '#f97316' } },
      { id: 'ddos',     type: 'process', position: { x: 350, y: 20  }, data: { label: 'DDoS Scrubbing',  sub: '100Tbps+ capacity',               color: '#f87171' } },
      { id: 'waf',      type: 'process', position: { x: 350, y: 100 }, data: { label: 'WAF + Firewall',  sub: 'OWASP rules · bot detection',     color: '#f59e0b' } },
      { id: 'cache',    type: 'process', position: { x: 350, y: 180 }, data: { label: 'Edge Cache',      sub: 'cache hit → no origin call',      color: '#34d399' } },
      { id: 'origin',   type: 'sink',    position: { x: 540, y: 100 }, data: { label: 'Your Origin',     sub: 'only cache misses reach here',    color: '#4db0c9' } },
      { id: 'metric',   type: 'metric',  position: { x: 185, y: 265 }, data: { label: 'Cloudflare serves ~20% of all internet traffic. Origin receives <10% of total requests on cached sites.' } },
    ],
    edges: [
      { id: 'e-useu-anycast',  source: 'user-eu', target: 'anycast', ...ae('#38bdf8') },
      { id: 'e-usus-anycast',  source: 'user-us', target: 'anycast', ...ae('#38bdf8') },
      { id: 'e-usap-anycast',  source: 'user-ap', target: 'anycast', ...ae('#38bdf8') },
      { id: 'e-anycast-ddos',  source: 'anycast', target: 'ddos',    ...ae('#f87171', 'scrub') },
      { id: 'e-ddos-waf',      source: 'ddos',    target: 'waf',     ...ae('#f59e0b') },
      { id: 'e-waf-cache',     source: 'waf',     target: 'cache',   ...ae('#34d399') },
      { id: 'e-cache-origin',  source: 'cache',   target: 'origin',  ...de('#4db0c9', 'miss only') },
    ],
  },

  /* ── 15. CloudFront ── */
  cloudfront: {
    description: 'CloudFront caches content at AWS edge locations. S3 origins serve static assets; ALB origins serve dynamic API responses. Origin Shield adds a regional cache layer to protect the origin.',
    nodes: [
      { id: 'user-a',  type: 'source',  position: { x: 0,   y: 30  }, data: { label: 'User (US)',    sub: 'us-east PoP · ~2ms',                       color: '#38bdf8' } },
      { id: 'user-b',  type: 'source',  position: { x: 0,   y: 130 }, data: { label: 'User (EU)',    sub: 'Frankfurt PoP · ~3ms',                      color: '#38bdf8' } },
      { id: 'edge-us', type: 'process', position: { x: 195, y: 30  }, data: { label: 'Edge (US)',    sub: 'cache check · HIT ✓',                      color: '#4db0c9' } },
      { id: 'edge-eu', type: 'process', position: { x: 195, y: 130 }, data: { label: 'Edge (EU)',    sub: 'cache check · MISS',                       color: '#f59e0b' } },
      { id: 'shield',  type: 'process', position: { x: 370, y: 80  }, data: { label: 'Origin Shield', sub: 'regional cache · reduces origin load 70%', color: '#4db0c9' } },
      { id: 's3',      type: 'sink',    position: { x: 540, y: 30  }, data: { label: 'S3 Origin',    sub: 'static assets',                            color: '#34d399' } },
      { id: 'alb',     type: 'sink',    position: { x: 540, y: 140 }, data: { label: 'ALB Origin',   sub: 'dynamic API',                              color: '#f97316' } },
      { id: 'metric',  type: 'metric',  position: { x: 195, y: 220 }, data: { label: 'Cache-Control: max-age=31536000 for versioned assets. TTL=0 for API responses.' } },
    ],
    edges: [
      { id: 'e-usera-edgeus',  source: 'user-a',  target: 'edge-us', ...ae('#38bdf8') },
      { id: 'e-userb-edgeeu',  source: 'user-b',  target: 'edge-eu', ...ae('#38bdf8') },
      { id: 'e-edgeus-s3',     source: 'edge-us', target: 's3',      ...de('#34d399', 'miss only') },
      { id: 'e-edgeeu-shield', source: 'edge-eu', target: 'shield',  ...ae('#4db0c9', 'miss → shield') },
      { id: 'e-shield-s3',     source: 'shield',  target: 's3',      ...de('#34d399', 'miss') },
      { id: 'e-shield-alb',    source: 'shield',  target: 'alb',     ...de('#f97316', 'dynamic') },
    ],
  },

  /* ── 16. Kubernetes ── */
  kubernetes: {
    description: 'Kubernetes cluster architecture — control plane components and worker node lifecycle.',
    nodes: [
      { id: 'kubectl',   type: 'source',  position: { x: 0,    y: 120 }, data: { label: 'kubectl / API Client',  sub: 'apply, get, logs',                          color: '#326ce5' } },
      { id: 'apiserver', type: 'process', position: { x: 190,  y: 60  }, data: { label: 'API Server',             sub: 'auth · admission · etcd gateway',           color: '#326ce5' } },
      { id: 'etcd',      type: 'process', position: { x: 190,  y: 180 }, data: { label: 'etcd',                   sub: 'desired state store · raft consensus',      color: '#326ce5' } },
      { id: 'scheduler', type: 'process', position: { x: 190,  y: 300 }, data: { label: 'kube-scheduler',         sub: 'filter → score → bind',                    color: '#326ce5' } },
      { id: 'ctrlmgr',  type: 'process', position: { x: 190,  y: 420 }, data: { label: 'Controller Manager',      sub: 'ReplicaSet · Deployment · Node',            color: '#326ce5' } },
      { id: 'label-cp', type: 'label',   position: { x: 60,   y: 370 }, data: { label: 'CONTROL PLANE' } },
      { id: 'node1',    type: 'process', position: { x: 420,  y: 60  }, data: { label: 'Worker Node 1',           sub: 'kubelet · containerd · kube-proxy',         color: '#34d399' } },
      { id: 'node2',    type: 'process', position: { x: 420,  y: 200 }, data: { label: 'Worker Node 2',           sub: 'kubelet · containerd · kube-proxy',         color: '#34d399' } },
      { id: 'pod1',     type: 'sink',    position: { x: 620,  y: 40  }, data: { label: 'Pod A',                   sub: 'app container · readiness probe',           color: '#34d399' } },
      { id: 'pod2',     type: 'sink',    position: { x: 620,  y: 140 }, data: { label: 'Pod B',                   sub: 'app container · liveness probe',            color: '#34d399' } },
      { id: 'pod3',     type: 'sink',    position: { x: 620,  y: 220 }, data: { label: 'Pod C',                   sub: 'app container · sidecar',                  color: '#34d399' } },
      { id: 'svc',      type: 'process', position: { x: 820,  y: 130 }, data: { label: 'Service (ClusterIP)',      sub: 'kube-proxy iptables · pod selector',        color: '#f59e0b' } },
      { id: 'ingress',  type: 'source',  position: { x: 1010, y: 130 }, data: { label: 'Ingress / ALB',           sub: 'L7 routing · TLS termination',             color: '#38bdf8' } },
      { id: 'metric1',  type: 'metric',  position: { x: 420,  y: 350 }, data: { label: 'Reconciliation loop: watch → compare desired vs actual → act. Runs continuously in every controller.' } },
    ],
    edges: [
      { id: 'e-kubectl-apiserver',    source: 'kubectl',   target: 'apiserver', ...ae('#326ce5', 'HTTPS') },
      { id: 'e-apiserver-etcd',       source: 'apiserver', target: 'etcd',      ...ae('#326ce5', 'read/write state') },
      { id: 'e-apiserver-scheduler',  source: 'apiserver', target: 'scheduler', ...de('#7c3aed', 'watch unscheduled pods') },
      { id: 'e-apiserver-ctrlmgr',    source: 'apiserver', target: 'ctrlmgr',   ...de('#7c3aed', 'watch all resources') },
      { id: 'e-scheduler-node1',      source: 'scheduler', target: 'node1',     ...ae('#34d399', 'bind pod→node') },
      { id: 'e-scheduler-node2',      source: 'scheduler', target: 'node2',     ...ae('#34d399', 'bind pod→node') },
      { id: 'e-ctrlmgr-apiserver',    source: 'ctrlmgr',  target: 'apiserver', ...ae('#326ce5', 'create/update objects') },
      { id: 'e-node1-pod1',           source: 'node1',     target: 'pod1',      ...ae('#34d399') },
      { id: 'e-node1-pod2',           source: 'node1',     target: 'pod2',      ...ae('#34d399') },
      { id: 'e-node2-pod3',           source: 'node2',     target: 'pod3',      ...ae('#34d399') },
      { id: 'e-pod1-svc',             source: 'pod1',      target: 'svc',       ...de('#f59e0b', 'ready→endpoint') },
      { id: 'e-pod2-svc',             source: 'pod2',      target: 'svc',       ...de('#f59e0b', 'ready→endpoint') },
      { id: 'e-pod3-svc',             source: 'pod3',      target: 'svc',       ...de('#f59e0b', 'ready→endpoint') },
      { id: 'e-ingress-svc',          source: 'ingress',   target: 'svc',       ...ae('#38bdf8', 'route traffic') },
    ],
  },

  /* ── 17. Docker ── */
  docker: {
    description: 'Docker image build pipeline and container runtime — from Dockerfile to running process.',
    nodes: [
      { id: 'dockerfile',  type: 'source',  position: { x: 0,    y: 100 }, data: { label: 'Dockerfile',        sub: 'FROM · RUN · COPY · CMD',                                color: '#2496ed' } },
      { id: 'buildkit',    type: 'process', position: { x: 200,  y: 100 }, data: { label: 'BuildKit',           sub: 'layer cache · parallel stages · mount',                  color: '#2496ed' } },
      { id: 'layers',      type: 'process', position: { x: 400,  y: 40  }, data: { label: 'Image Layers',       sub: 'overlay2 · content-addressed SHA256',                    color: '#2496ed' } },
      { id: 'registry',    type: 'process', position: { x: 400,  y: 160 }, data: { label: 'ECR / Registry',     sub: 'push layers · store manifest',                          color: '#2496ed' } },
      { id: 'pull',        type: 'process', position: { x: 600,  y: 100 }, data: { label: 'docker pull',        sub: 'fetch missing layers only',                             color: '#2496ed' } },
      { id: 'containerd',  type: 'process', position: { x: 800,  y: 100 }, data: { label: 'containerd',         sub: 'CRI · image store · snapshots',                         color: '#34d399' } },
      { id: 'runc',        type: 'process', position: { x: 1000, y: 60  }, data: { label: 'runc',               sub: 'Linux namespaces · cgroups · pivot_root',               color: '#34d399' } },
      { id: 'container',   type: 'sink',    position: { x: 1000, y: 160 }, data: { label: 'Running Container',  sub: 'PID 1 · network ns · writable layer',                   color: '#34d399' } },
      { id: 'host',        type: 'process', position: { x: 800,  y: 240 }, data: { label: 'Host Kernel',        sub: 'shared kernel · cgroups v2 · seccomp',                  color: '#64748b' } },
      { id: 'metric1',     type: 'metric',  position: { x: 200,  y: 220 }, data: { label: 'Multi-stage build: compile in large image → copy only binary to minimal runtime image. Cuts final image 90%.' } },
      { id: 'metric2',     type: 'metric',  position: { x: 800,  y: 340 }, data: { label: 'No hypervisor. Container shares host kernel — startup in milliseconds, not minutes.' } },
    ],
    edges: [
      { id: 'e-dockerfile-buildkit',   source: 'dockerfile', target: 'buildkit',   ...ae('#2496ed', 'docker build') },
      { id: 'e-buildkit-layers',       source: 'buildkit',   target: 'layers',     ...ae('#2496ed', 'cache hit/miss') },
      { id: 'e-layers-registry',       source: 'layers',     target: 'registry',   ...ae('#2496ed', 'docker push') },
      { id: 'e-registry-pull',         source: 'registry',   target: 'pull',       ...ae('#2496ed', 'layer download') },
      { id: 'e-pull-containerd',       source: 'pull',       target: 'containerd', ...ae('#34d399') },
      { id: 'e-containerd-runc',       source: 'containerd', target: 'runc',       ...ae('#34d399', 'create container spec') },
      { id: 'e-runc-container',        source: 'runc',       target: 'container',  ...ae('#34d399', 'exec entrypoint') },
      { id: 'e-container-host',        source: 'container',  target: 'host',       ...de('#64748b', 'kernel syscalls') },
    ],
  },

  /* ── 18. ECS ── */
  ecs: {
    description: 'Amazon ECS Fargate deployment — task lifecycle from ECR pull to ALB traffic routing.',
    nodes: [
      { id: 'dev',      type: 'source',  position: { x: 0,    y: 120 }, data: { label: 'Developer / CI',           sub: 'docker push → task def update',         color: '#ff9900' } },
      { id: 'ecr',      type: 'process', position: { x: 190,  y: 120 }, data: { label: 'Amazon ECR',               sub: 'container image store',                 color: '#ff9900' } },
      { id: 'ecs-cp',   type: 'process', position: { x: 400,  y: 60  }, data: { label: 'ECS Control Plane',        sub: 'AWS-managed scheduler',                 color: '#ff9900' } },
      { id: 'taskdef',  type: 'process', position: { x: 400,  y: 180 }, data: { label: 'Task Definition',          sub: 'image · cpu · memory · secrets',        color: '#ff9900' } },
      { id: 'fargate1', type: 'process', position: { x: 620,  y: 40  }, data: { label: 'Fargate Task 1',           sub: 'Firecracker VM · awsvpc ENI',           color: '#34d399' } },
      { id: 'fargate2', type: 'process', position: { x: 620,  y: 140 }, data: { label: 'Fargate Task 2',           sub: 'Firecracker VM · awsvpc ENI',           color: '#34d399' } },
      { id: 'fargate3', type: 'process', position: { x: 620,  y: 240 }, data: { label: 'Fargate Task 3',           sub: 'Firecracker VM · awsvpc ENI',           color: '#34d399' } },
      { id: 'alb',      type: 'process', position: { x: 840,  y: 140 }, data: { label: 'Application Load Balancer', sub: 'target group · health check',          color: '#38bdf8' } },
      { id: 'secrets',  type: 'process', position: { x: 400,  y: 300 }, data: { label: 'Secrets Manager',          sub: 'injected at task start',                color: '#7c3aed' } },
      { id: 'cw',       type: 'sink',    position: { x: 840,  y: 280 }, data: { label: 'CloudWatch Logs',          sub: 'awslogs driver · Container Insights',   color: '#64748b' } },
      { id: 'user',     type: 'source',  position: { x: 1040, y: 140 }, data: { label: 'Users',                    sub: 'HTTPS traffic',                         color: '#38bdf8' } },
      { id: 'metric1',  type: 'metric',  position: { x: 620,  y: 340 }, data: { label: 'Rolling update: launch new task → health check → register → drain old → stop. Circuit breaker auto-rolls back on failure.' } },
    ],
    edges: [
      { id: 'e-dev-ecr',          source: 'dev',     target: 'ecr',     ...ae('#ff9900', 'docker push') },
      { id: 'e-ecr-fargate1',     source: 'ecr',     target: 'fargate1', ...ae('#ff9900', 'image pull (execution role)') },
      { id: 'e-ecr-fargate2',     source: 'ecr',     target: 'fargate2', ...ae('#ff9900', 'image pull') },
      { id: 'e-ecr-fargate3',     source: 'ecr',     target: 'fargate3', ...ae('#ff9900', 'image pull') },
      { id: 'e-ecscp-fargate1',   source: 'ecs-cp',  target: 'fargate1', ...ae('#34d399', 'place task') },
      { id: 'e-ecscp-fargate2',   source: 'ecs-cp',  target: 'fargate2', ...ae('#34d399', 'place task') },
      { id: 'e-ecscp-fargate3',   source: 'ecs-cp',  target: 'fargate3', ...ae('#34d399', 'place task') },
      { id: 'e-taskdef-ecscp',    source: 'taskdef', target: 'ecs-cp',   ...de('#ff9900', 'service desired count') },
      { id: 'e-secrets-fargate1', source: 'secrets', target: 'fargate1', ...de('#7c3aed', 'env inject') },
      { id: 'e-secrets-fargate2', source: 'secrets', target: 'fargate2', ...de('#7c3aed', 'env inject') },
      { id: 'e-fargate1-alb',     source: 'fargate1', target: 'alb',     ...ae('#38bdf8', 'register ENI IP') },
      { id: 'e-fargate2-alb',     source: 'fargate2', target: 'alb',     ...ae('#38bdf8', 'register ENI IP') },
      { id: 'e-fargate3-alb',     source: 'fargate3', target: 'alb',     ...ae('#38bdf8', 'register ENI IP') },
      { id: 'e-fargate1-cw',      source: 'fargate1', target: 'cw',      ...de('#64748b', 'stdout/stderr') },
      { id: 'e-user-alb',         source: 'user',    target: 'alb',      ...ae('#38bdf8', 'HTTPS') },
    ],
  },

  /* ── 19. EKS ── */
  eks: {
    description: 'Amazon EKS architecture — managed control plane, Karpenter node provisioning, and IRSA pod-level IAM.',
    nodes: [
      { id: 'kubectl',    type: 'source',  position: { x: 0,   y: 140 }, data: { label: 'kubectl / Argo CD',    sub: 'apply manifests · GitOps',                     color: '#ff9900' } },
      { id: 'eks-cp',     type: 'process', position: { x: 210, y: 80  }, data: { label: 'EKS Control Plane',    sub: 'API server · etcd · 3-AZ HA',                  color: '#ff9900' } },
      { id: 'karpenter',  type: 'process', position: { x: 210, y: 220 }, data: { label: 'Karpenter',            sub: 'provision nodes in 60s · bin-pack',             color: '#ff9900' } },
      { id: 'ec2fleet',   type: 'process', position: { x: 420, y: 280 }, data: { label: 'EC2 Fleet API',        sub: 'optimal instance type · Spot/OD',               color: '#64748b' } },
      { id: 'node1',      type: 'process', position: { x: 420, y: 60  }, data: { label: 'Node (AZ-a)',          sub: 'kubelet · containerd · VPC CNI',                color: '#34d399' } },
      { id: 'node2',      type: 'process', position: { x: 420, y: 160 }, data: { label: 'Node (AZ-b)',          sub: 'kubelet · containerd · VPC CNI',                color: '#34d399' } },
      { id: 'pod1',       type: 'sink',    position: { x: 630, y: 40  }, data: { label: 'Pod',                  sub: 'VPC IP · IRSA token',                          color: '#34d399' } },
      { id: 'pod2',       type: 'sink',    position: { x: 630, y: 140 }, data: { label: 'Pod',                  sub: 'VPC IP · IRSA token',                          color: '#34d399' } },
      { id: 'pod3',       type: 'sink',    position: { x: 630, y: 220 }, data: { label: 'Pod',                  sub: 'VPC IP · IRSA token',                          color: '#34d399' } },
      { id: 'irsa',       type: 'process', position: { x: 840, y: 80  }, data: { label: 'AWS IAM (IRSA)',       sub: 'OIDC · STS · per-pod role',                    color: '#7c3aed' } },
      { id: 'alb-ctrl',   type: 'process', position: { x: 840, y: 200 }, data: { label: 'ALB Controller',       sub: 'Ingress → ALB · target type: ip',              color: '#38bdf8' } },
      { id: 'ecr',        type: 'process', position: { x: 840, y: 300 }, data: { label: 'ECR',                  sub: 'image pull · VPC endpoint',                    color: '#ff9900' } },
      { id: 'metric1',    type: 'metric',  position: { x: 210, y: 360 }, data: { label: 'IRSA: pod ServiceAccount → OIDC JWT → STS AssumeRoleWithWebIdentity → temporary IAM credentials. No node-level credentials.' } },
      { id: 'label-dp',   type: 'label',   position: { x: 420, y: 360 }, data: { label: 'DATA PLANE (your VPC)' } },
    ],
    edges: [
      { id: 'e-kubectl-ekscp',      source: 'kubectl',   target: 'eks-cp',    ...ae('#ff9900', 'HTTPS · kubeconfig') },
      { id: 'e-ekscp-karpenter',    source: 'eks-cp',    target: 'karpenter', ...de('#ff9900', 'pending pods watch') },
      { id: 'e-karpenter-ec2fleet', source: 'karpenter', target: 'ec2fleet',  ...ae('#ff9900', 'provision node') },
      { id: 'e-ec2fleet-node1',     source: 'ec2fleet',  target: 'node1',     ...ae('#34d399', 'launch EC2') },
      { id: 'e-ec2fleet-node2',     source: 'ec2fleet',  target: 'node2',     ...ae('#34d399', 'launch EC2') },
      { id: 'e-ekscp-node1',        source: 'eks-cp',    target: 'node1',     ...ae('#34d399', 'schedule pods') },
      { id: 'e-ekscp-node2',        source: 'eks-cp',    target: 'node2',     ...ae('#34d399', 'schedule pods') },
      { id: 'e-node1-pod1',         source: 'node1',     target: 'pod1',      ...ae('#34d399') },
      { id: 'e-node1-pod2',         source: 'node1',     target: 'pod2',      ...ae('#34d399') },
      { id: 'e-node2-pod3',         source: 'node2',     target: 'pod3',      ...ae('#34d399') },
      { id: 'e-pod1-irsa',          source: 'pod1',      target: 'irsa',      ...de('#7c3aed', 'JWT token → IAM role') },
      { id: 'e-pod2-irsa',          source: 'pod2',      target: 'irsa',      ...de('#7c3aed', 'JWT token → IAM role') },
      { id: 'e-pod1-ecr',           source: 'pod1',      target: 'ecr',       ...de('#ff9900', 'pull image') },
      { id: 'e-albctrl-pod1',       source: 'alb-ctrl',  target: 'pod1',      ...ae('#38bdf8', 'route traffic') },
      { id: 'e-albctrl-pod2',       source: 'alb-ctrl',  target: 'pod2',      ...ae('#38bdf8', 'route traffic') },
    ],
  },

  /* ── 20. ECR ── */
  ecr: {
    description: 'Amazon ECR image lifecycle — from CI build through security scanning to ECS/EKS deployment.',
    nodes: [
      { id: 'ci',          type: 'source',  position: { x: 0,   y: 120 }, data: { label: 'CI Pipeline',           sub: 'CodeBuild / GitHub Actions',               color: '#ff9900' } },
      { id: 'build',       type: 'process', position: { x: 190, y: 120 }, data: { label: 'docker build',          sub: 'multi-stage · layer cache',                color: '#ff9900' } },
      { id: 'scan',        type: 'process', position: { x: 400, y: 60  }, data: { label: 'Inspector Scan',        sub: 'OS + app deps · CVE database',             color: '#f87171' } },
      { id: 'ecr-repo',    type: 'process', position: { x: 400, y: 160 }, data: { label: 'ECR Repository',        sub: 'immutable tags · OCI layers in S3',        color: '#ff9900' } },
      { id: 'lifecycle',   type: 'process', position: { x: 400, y: 280 }, data: { label: 'Lifecycle Policy',      sub: 'expire untagged · keep last N',            color: '#64748b' } },
      { id: 'replication', type: 'process', position: { x: 620, y: 60  }, data: { label: 'Cross-Region Replica',  sub: 'eu-west-1 mirror',                         color: '#ff9900' } },
      { id: 'ecs',         type: 'sink',    position: { x: 620, y: 160 }, data: { label: 'ECS Fargate',           sub: 'task exec role · 12h token',               color: '#34d399' } },
      { id: 'eks',         type: 'sink',    position: { x: 620, y: 260 }, data: { label: 'EKS Nodes',             sub: 'node IAM role · VPC endpoint',             color: '#34d399' } },
      { id: 'lambda',      type: 'sink',    position: { x: 620, y: 360 }, data: { label: 'Lambda',                sub: 'container image up to 10GB',               color: '#34d399' } },
      { id: 'cve-gate',    type: 'process', position: { x: 190, y: 280 }, data: { label: 'CVE Gate',              sub: 'fail pipeline if critical found',          color: '#f87171' } },
      { id: 'metric1',     type: 'metric',  position: { x: 0,   y: 280 }, data: { label: 'Auth: aws ecr get-login-password | docker login. Token valid 12h. No passwords — IAM only.' } },
      { id: 'metric2',     type: 'metric',  position: { x: 400, y: 380 }, data: { label: 'VPC endpoint eliminates NAT for image pulls. Free within-region data transfer.' } },
    ],
    edges: [
      { id: 'e-ci-build',           source: 'ci',       target: 'build',       ...ae('#ff9900') },
      { id: 'e-build-ecrrep',       source: 'build',    target: 'ecr-repo',    ...ae('#ff9900', 'docker push (layers deduplicated)') },
      { id: 'e-ecrrep-scan',        source: 'ecr-repo', target: 'scan',        ...ae('#f87171', 'scan-on-push') },
      { id: 'e-scan-cvegate',       source: 'scan',     target: 'cve-gate',    ...ae('#f87171', 'findings') },
      { id: 'e-cvegate-ecs',        source: 'cve-gate', target: 'ecs',         ...de('#34d399', 'PASSED → deploy') },
      { id: 'e-ecrrep-replication', source: 'ecr-repo', target: 'replication', ...de('#ff9900', 'async replication') },
      { id: 'e-ecrrep-ecs',         source: 'ecr-repo', target: 'ecs',         ...ae('#34d399', 'pull image') },
      { id: 'e-ecrrep-eks',         source: 'ecr-repo', target: 'eks',         ...ae('#34d399', 'pull image') },
      { id: 'e-ecrrep-lambda',      source: 'ecr-repo', target: 'lambda',      ...ae('#34d399', 'pull image') },
      { id: 'e-lifecycle-ecrrep',   source: 'lifecycle', target: 'ecr-repo',   ...de('#64748b', 'expire stale images') },
    ],
  },
};
