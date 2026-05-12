'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresPartitioningDiagram() {
  const nodes: Node[] = useMemo(() => [
    // RANGE group
    mkGroup('grp-range', 0, 0, 680, 120, { label: 'RANGE Partitioning — by date', color: '#336791' }),
    mkNode('range-parent', 20, 40,  { icon: '📅', title: 'orders (parent)', sub: 'PARTITION BY RANGE (created_at)', color: '#336791' }),
    mkNode('range-jan',    230, 40, { icon: '1️⃣', title: 'Jan Partition',  sub: 'Jan 2024', color: '#60a5fa' }),
    mkNode('range-feb',    380, 40, { icon: '2️⃣', title: 'Feb Partition',  sub: 'Feb 2024', color: '#60a5fa', dim: true, badge: 'pruned ✗' }),
    mkNode('range-mar',    530, 40, { icon: '3️⃣', title: 'Mar Partition',  sub: 'Mar 2024', color: '#60a5fa', dim: true, badge: 'pruned ✗' }),

    // LIST group
    mkGroup('grp-list', 0, 145, 560, 120, { label: 'LIST Partitioning — by region', color: '#f59e0b' }),
    mkNode('list-parent', 20, 185,  { icon: '🌍', title: 'users (parent)', sub: 'PARTITION BY LIST (region)', color: '#f59e0b' }),
    mkNode('list-us',     230, 185, { icon: '🇺🇸', title: 'US',  sub: 'region=US',   color: '#60a5fa' }),
    mkNode('list-eu',     370, 185, { icon: '🇪🇺', title: 'EU',  sub: 'region=EU',   color: '#60a5fa' }),
    mkNode('list-apac',   510, 185, { icon: '🌏', title: 'APAC', sub: 'region=APAC', color: '#60a5fa' }),

    // HASH group
    mkGroup('grp-hash', 0, 290, 560, 120, { label: 'HASH Partitioning — by user_id', color: '#10b981' }),
    mkNode('hash-parent', 20, 330,  { icon: '#️⃣', title: 'events (parent)', sub: 'PARTITION BY HASH (user_id)', color: '#10b981' }),
    mkNode('hash-s0',     230, 330, { icon: '0️⃣', title: 'Shard 0', sub: 'user_id % 3 = 0', color: '#60a5fa' }),
    mkNode('hash-s1',     370, 330, { icon: '1️⃣', title: 'Shard 1', sub: 'user_id % 3 = 1', color: '#60a5fa' }),
    mkNode('hash-s2',     510, 330, { icon: '2️⃣', title: 'Shard 2', sub: 'user_id % 3 = 2', color: '#60a5fa' }),

    mkLabel('lbl', 100, 440, {
      label: 'Partition pruning = planner skips irrelevant partitions entirely',
      icon: '✂️',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // RANGE
    mkEdge('e-rp-jan', 'range-parent', 'range-jan', { color: '#336791' }),
    mkEdge('e-rp-feb', 'range-parent', 'range-feb', { color: '#64748b', dashed: true }),
    mkEdge('e-rp-mar', 'range-parent', 'range-mar', { color: '#64748b', dashed: true }),

    // LIST
    mkEdge('e-lp-us',   'list-parent', 'list-us',   { color: '#f59e0b' }),
    mkEdge('e-lp-eu',   'list-parent', 'list-eu',   { color: '#f59e0b' }),
    mkEdge('e-lp-apac', 'list-parent', 'list-apac', { color: '#f59e0b' }),

    // HASH
    mkEdge('e-hp-s0', 'hash-parent', 'hash-s0', { color: '#10b981' }),
    mkEdge('e-hp-s1', 'hash-parent', 'hash-s1', { color: '#10b981' }),
    mkEdge('e-hp-s2', 'hash-parent', 'hash-s2', { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
