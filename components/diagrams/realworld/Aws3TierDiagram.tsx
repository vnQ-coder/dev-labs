'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function Aws3TierDiagram() {
  const nodes: Node[] = useMemo(() => [
    // ── Ingress (outside groups) ─────────────────────────────────
    mkNode('internet', 20, 160, {
      icon: '🌐',
      title: 'Internet',
      sub: 'Users',
      color: '#38bdf8',
    }),
    mkNode('route53', 175, 160, {
      icon: '🗺️',
      title: 'Route 53',
      sub: 'DNS routing',
      color: '#22d3ee',
    }),
    mkNode('waf', 330, 60, {
      icon: '🛡️',
      title: 'WAF',
      sub: 'Web ACL rules',
      color: '#f59e0b',
      badge: 'Protects CF',
    }),

    // ── Tier 1 — Presentation ────────────────────────────────────
    mkGroup('tier1', 320, 100, 270, 180, {
      label: 'Tier 1 — Presentation',
      color: '#22d3ee',
    }),
    mkNode('cloudfront', 340, 130, {
      icon: '☁️',
      title: 'CloudFront',
      sub: 'CDN / edge cache',
      color: '#22d3ee',
    }, { parentId: 'tier1', extent: 'parent' as const }),
    mkNode('alb1', 340, 230, {
      icon: '⚖️',
      title: 'ALB',
      sub: 'Application Load Balancer',
      color: '#22d3ee',
    }, { parentId: 'tier1', extent: 'parent' as const }),

    // ── Tier 2 — Application ─────────────────────────────────────
    mkGroup('tier2', 620, 60, 290, 260, {
      label: 'Tier 2 — Application',
      color: '#a78bfa',
    }),
    mkNode('ec2a', 640, 100, {
      icon: '🖥️',
      title: 'EC2 Instance',
      sub: 'App server A',
      color: '#22d3ee',
    }, { parentId: 'tier2', extent: 'parent' as const }),
    mkNode('ec2b', 640, 200, {
      icon: '🖥️',
      title: 'EC2 Instance',
      sub: 'App server B',
      color: '#22d3ee',
    }, { parentId: 'tier2', extent: 'parent' as const }),
    mkNode('elasticache', 640, 300, {
      icon: '⚡',
      title: 'ElastiCache',
      sub: 'Redis — session/cache',
      color: '#f59e0b',
      badge: 'in-memory',
    }, { parentId: 'tier2', extent: 'parent' as const }),

    // ── Tier 3 — Data ────────────────────────────────────────────
    mkGroup('tier3', 940, 80, 290, 240, {
      label: 'Tier 3 — Data',
      color: '#34d399',
    }),
    mkNode('rds-primary', 960, 110, {
      icon: '🗄️',
      title: 'RDS Primary',
      sub: 'Multi-AZ active',
      color: '#34d399',
      badge: 'Primary',
    }, { parentId: 'tier3', extent: 'parent' as const }),
    mkNode('rds-standby', 960, 220, {
      icon: '🗄️',
      title: 'RDS Standby',
      sub: 'Multi-AZ standby',
      color: '#34d399',
      badge: 'Standby',
      dim: true,
    }, { parentId: 'tier3', extent: 'parent' as const }),
    mkNode('s3', 1100, 165, {
      icon: '🪣',
      title: 'S3',
      sub: 'Static assets',
      color: '#f59e0b',
    }, { parentId: 'tier3', extent: 'parent' as const }),

    // ── Label ────────────────────────────────────────────────────
    mkLabel('lbl', 160, 370, {
      label: '3-tier architecture: presentation → application → data, each independently scalable',
      icon: '💡',
      color: '#22d3ee',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Ingress chain
    mkEdge('e-inet-r53', 'internet', 'route53', { color: '#38bdf8', animated: true }),
    mkEdge('e-r53-cf', 'route53', 'cloudfront', { color: '#22d3ee', animated: true }),
    mkEdge('e-waf-cf', 'waf', 'cloudfront', { color: '#f59e0b', dashed: true }),
    // CF → ALB
    mkEdge('e-cf-alb', 'cloudfront', 'alb1', { color: '#22d3ee' }),
    // ALB → EC2 instances
    mkEdge('e-alb-ec2a', 'alb1', 'ec2a', { color: '#a78bfa', animated: true }),
    mkEdge('e-alb-ec2b', 'alb1', 'ec2b', { color: '#a78bfa', animated: true }),
    // EC2 ↔ ElastiCache
    mkEdge('e-ec2a-cache', 'ec2a', 'elasticache', { color: '#f59e0b', dashed: true }),
    mkEdge('e-ec2b-cache', 'ec2b', 'elasticache', { color: '#f59e0b', dashed: true }),
    // EC2 → RDS
    mkEdge('e-ec2a-rds', 'ec2a', 'rds-primary', { color: '#34d399' }),
    mkEdge('e-ec2b-rds', 'ec2b', 'rds-primary', { color: '#34d399' }),
    // RDS Primary → Standby (replication)
    mkEdge('e-rds-rep', 'rds-primary', 'rds-standby', {
      color: '#34d399',
      dashed: true,
      labelText: 'sync replica',
    }),
    // EC2 → S3
    mkEdge('e-ec2a-s3', 'ec2a', 's3', { color: '#f59e0b', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
