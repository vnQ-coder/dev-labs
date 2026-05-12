'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function WriteBehindDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Synchronous path group
    mkGroup('grp-sync', 0, 0, 580, 140, { label: 'Synchronous Path', sub: 'instant ACK', color: '#10b981' }),
    mkNode('app',      20,  45, { icon: '🖥️', title: 'Application',  sub: 'Write request',        color: '#64748b' }),
    mkNode('redis',   220,  45, { icon: '⚡', title: 'Redis Cache',  sub: 'Write accepted',       color: '#dc2626', badge: '~1ms' }),
    mkNode('ack',     440,  45, { icon: '✅', title: 'ACK ✓',        sub: 'Client notified',      color: '#10b981', badge: 'instant' }),

    // Async path group
    mkGroup('grp-async', 0, 180, 740, 180, { label: 'Async Path', sub: 'background flush', color: '#f97316' }),
    mkNode('queue',   220, 230, {
      icon: '📥',
      title: 'Write Queue',
      sub: 'XADD stream',
      color: '#f97316',
      badge: 'Redis Streams',
      pills: [{ label: 'Buffered writes', color: '#f97316' }],
    }),
    mkNode('worker',  440, 230, {
      icon: '⚙️',
      title: 'Flush Worker',
      sub: 'Batched consumer',
      color: '#a78bfa',
      badge: 'async',
    }),
    mkNode('db',      660, 230, { icon: '🗄️', title: 'Database', sub: 'Batch insert/update', color: '#38bdf8', badge: '~20ms' }),

    // Coalescing label
    mkLabel('lbl-coal', 315, 345, { label: '3 updates → 1 DB write (coalescing)', icon: '🗜️', color: '#f97316' }),

    // Risk label
    mkLabel('lbl-risk', 100, 390, { label: 'ACK at cache speed; DB write async — data loss risk on crash', icon: '⚠️', color: '#f87171' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Sync path
    mkEdge('e-app-redis', 'app',   'redis', { color: '#dc2626' }),
    mkEdge('e-redis-ack', 'redis', 'ack',   { color: '#10b981', labelText: '✓ ACK' }),

    // Async path
    mkEdge('e-redis-q',  'redis',  'queue',  { color: '#f97316', dashed: true, labelText: 'enqueue' }),
    mkEdge('e-q-worker', 'queue',  'worker', { color: '#a78bfa', animated: true, labelText: 'batch dequeue' }),
    mkEdge('e-worker-db','worker', 'db',     { color: '#38bdf8', animated: true, labelText: 'flush to DB' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
