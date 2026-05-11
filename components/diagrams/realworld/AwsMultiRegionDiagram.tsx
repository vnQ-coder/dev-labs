'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AwsMultiRegionDiagram() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // ── Global layer ─────────────────────────────────────────────
    mkNode('ga', 340, 10, {
      icon: '🌏',
      title: 'Global Accelerator',
      sub: 'Anycast routing',
      color: '#22d3ee',
      badge: 'Global',
    }),
    mkNode('r53', 560, 10, {
      icon: '🗺️',
      title: 'Route 53',
      sub: 'Health-check failover',
      color: '#22d3ee',
      badge: 'Active-Active',
    }),

    // ── Region A — us-east-1 ─────────────────────────────────────
    mkGroup('regionA', 30, 110, 370, 240, {
      label: 'us-east-1 (Primary)',
      color: '#22d3ee',
    }),
    mkNode('alb-a', 50, 145, {
      icon: '⚖️',
      title: 'ALB',
      sub: 'us-east-1',
      color: '#22d3ee',
    }, { parentId: 'regionA', extent: 'parent' as const }),
    mkNode('ec2-a1', 200, 130, {
      icon: '🖥️',
      title: 'EC2 Cluster',
      sub: 'App servers',
      color: '#22d3ee',
    }, { parentId: 'regionA', extent: 'parent' as const }),
    mkNode('aurora-a', 200, 250, {
      icon: '🗄️',
      title: 'Aurora Primary',
      sub: 'Writer instance',
      color: '#34d399',
      badge: 'Primary',
    }, { parentId: 'regionA', extent: 'parent' as const }),

    // ── Region B — us-west-2 ─────────────────────────────────────
    mkGroup('regionB', 450, 110, 370, 240, {
      label: 'us-west-2 (Secondary)',
      color: '#a78bfa',
    }),
    mkNode('alb-b', 470, 145, {
      icon: '⚖️',
      title: 'ALB',
      sub: 'us-west-2',
      color: '#a78bfa',
    }, { parentId: 'regionB', extent: 'parent' as const }),
    mkNode('ec2-b1', 610, 130, {
      icon: '🖥️',
      title: 'EC2 Cluster',
      sub: 'App servers',
      color: '#a78bfa',
    }, { parentId: 'regionB', extent: 'parent' as const }),
    mkNode('aurora-b', 610, 250, {
      icon: '🗄️',
      title: 'Aurora Replica',
      sub: 'Read replica',
      color: '#34d399',
      badge: 'Replica',
      dim: true,
    }, { parentId: 'regionB', extent: 'parent' as const }),

    // ── Label ────────────────────────────────────────────────────
    mkLabel('lbl', 60, 385, {
      label: 'RTO < 60s: Route 53 automatically routes away from an unhealthy region',
      icon: '💡',
      color: '#22d3ee',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Global Accelerator → ALBs
    mkEdge('e-ga-alba', 'ga', 'alb-a', { color: '#22d3ee', animated: pulse }),
    mkEdge('e-ga-albb', 'ga', 'alb-b', { color: '#a78bfa', animated: pulse }),

    // Route 53 health-checks → ALBs (pulsing)
    mkEdge('e-r53-alba', 'r53', 'alb-a', {
      color: pulse ? '#22d3ee' : '#22d3ee88',
      animated: pulse,
      dashed: true,
      labelText: 'health check',
    }),
    mkEdge('e-r53-albb', 'r53', 'alb-b', {
      color: pulse ? '#a78bfa' : '#a78bfa88',
      animated: pulse,
      dashed: true,
      labelText: 'health check',
    }),

    // Region A internal
    mkEdge('e-alba-ec2a', 'alb-a', 'ec2-a1', { color: '#22d3ee' }),
    mkEdge('e-ec2a-aurora-a', 'ec2-a1', 'aurora-a', { color: '#34d399' }),

    // Region B internal
    mkEdge('e-albb-ec2b', 'alb-b', 'ec2-b1', { color: '#a78bfa' }),
    mkEdge('e-ec2b-aurora-b', 'ec2-b1', 'aurora-b', { color: '#34d399' }),

    // Aurora Global DB replication (cross-region, dashed)
    mkEdge('e-aurora-rep', 'aurora-a', 'aurora-b', {
      color: '#34d399',
      dashed: true,
      animated: true,
      labelText: 'Global DB replication',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
