'use client';

import FlowDiagram, { mkNode, mkEdge, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  // ── Groups ────────────────────────────────────────────────────
  mkGroup('grp-edge',    120, 20,  340, 300, { label: 'Edge Tier',    sub: 'Route53 + CloudFront', color: '#f59e0b' }),
  mkGroup('grp-compute', 480, 80,  300, 180, { label: 'Compute Tier', sub: 'ALB + EC2 ASG',        color: '#38bdf8' }),
  mkGroup('grp-data',    720, 0,   280, 420, { label: 'Data Tier',    sub: 'Aurora · Cache · S3',  color: '#a78bfa' }),

  // ── Service nodes ─────────────────────────────────────────────
  mkNode('user',        0,   160, { icon: '👤', title: 'User',                sub: 'Global traffic',                color: '#64748b' }),
  mkNode('route53',     170, 80,  { icon: '🛣️', title: 'Route 53',            sub: 'DNS + health checks',            color: '#f59e0b', badge: 'Latency routing',       pills: [{ label: 'Failover to DR region', color: '#64748b' }] }),
  mkNode('cloudfront',  170, 240, { icon: '⚡', title: 'CloudFront CDN',      sub: '400+ PoPs worldwide',            color: '#f59e0b', badge: '<10ms edge latency',    pills: [{ label: 'Cache static assets', color: '#34d399' }, { label: 'WAF protection', color: '#f87171' }] }),
  mkNode('alb',         400, 160, { icon: '⚖️', title: 'App Load Balancer',   sub: 'SSL termination · HTTP/2',       color: '#38bdf8', badge: 'Multi-AZ',              pills: [{ label: 'Health checks every 5s', color: '#34d399' }] }),
  mkNode('asg',         600, 160, { icon: '🖥️', title: 'EC2 Auto Scaling',    sub: '2–50 instances',                 color: '#38bdf8', badge: 'Target: 60% CPU',       pills: [{ label: 'Spot Instances (70% savings)', color: '#34d399' }, { label: 'Launch Template: AL2023', color: '#64748b' }] }),
  mkNode('aurora',      800, 60,  { icon: '🗄️', title: 'Aurora PostgreSQL',   sub: 'Multi-AZ · 15 replicas',         color: '#a78bfa', badge: '< 30s failover',        pills: [{ label: 'Writer in us-east-1a', color: '#64748b' }] }),
  mkNode('elasticache', 800, 200, { icon: '⚡', title: 'ElastiCache Redis',   sub: 'Session + query cache',          color: '#34d399', badge: '< 0.5ms',               pills: [{ label: 'Cluster mode enabled', color: '#64748b' }] }),
  mkNode('s3',          800, 340, { icon: '🪣', title: 'Amazon S3',           sub: 'Assets · backups · logs',        color: '#f59e0b', badge: '11 nines durability',    pills: [{ label: 'CloudFront OAC origin', color: '#64748b' }] }),
];

const edges: Edge[] = [
  mkEdge('e-user-r53',   'user',       'route53',      { color: '#f59e0b' }),
  mkEdge('e-user-cf',    'user',       'cloudfront',   { color: '#f59e0b' }),
  mkEdge('e-r53-alb',    'route53',    'alb',          { color: '#38bdf8', labelText: 'A record → ALB' }),
  mkEdge('e-cf-alb',     'cloudfront', 'alb',          { color: '#38bdf8', labelText: 'dynamic origin' }),
  mkEdge('e-cf-s3',      'cloudfront', 's3',           { color: '#f59e0b', dashed: true, labelText: 'static assets' }),
  mkEdge('e-alb-asg',    'alb',        'asg',          { color: '#38bdf8' }),
  mkEdge('e-asg-aurora', 'asg',        'aurora',       { color: '#a78bfa', labelText: 'writes' }),
  mkEdge('e-asg-cache',  'asg',        'elasticache',  { color: '#34d399', labelText: 'cache-aside' }),
  mkEdge('e-asg-s3',     'asg',        's3',           { color: '#f59e0b', dashed: true, labelText: 'uploads' }),
];

export default function CloudArchDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
