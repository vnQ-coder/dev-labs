'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function WriteThroughDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Write path group
    mkGroup('grp-write', 0, 0, 740, 200, { label: 'Write Path — synchronous', color: '#dc2626' }),
    mkNode('app-w',    20,  70, { icon: '🖥️', title: 'Application',  sub: 'Write request',        color: '#64748b' }),
    mkNode('redis-w', 230,  20, { icon: '⚡', title: 'Redis Cache',  sub: 'Write #1 — sync',      color: '#dc2626', badge: '~1ms' }),
    mkNode('db-w',    230, 120, { icon: '🗄️', title: 'Database',     sub: 'Write #2 — sync',      color: '#38bdf8', badge: '~20ms' }),
    mkNode('ack',     490,  70, { icon: '✅', title: 'ACK to Client', sub: 'Both writes confirmed', color: '#10b981', badge: '~21ms' }),

    // Write path annotation
    mkLabel('lbl-sync', 200, 185, { label: 'Both writes must succeed before ACK — always in sync', icon: '🔒', color: '#dc2626' }),

    // Read path group
    mkGroup('grp-read', 0, 240, 500, 120, { label: 'Read Path — cache hit guaranteed', color: '#10b981' }),
    mkNode('app-r',    20, 295, { icon: '🖥️', title: 'Application',  sub: 'Read request',          color: '#64748b' }),
    mkNode('redis-r', 230, 295, { icon: '⚡', title: 'Redis Cache',  sub: 'Always populated',      color: '#dc2626', badge: 'HIT ✓' }),
    mkNode('resp-r',  440, 295, { icon: '🚀', title: 'Instant Return', sub: 'Written keys = hits', color: '#10b981', badge: '< 1ms' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Write path
    mkEdge('e-app-redis', 'app-w', 'redis-w', { color: '#dc2626', labelText: '① write' }),
    mkEdge('e-app-db',    'app-w', 'db-w',    { color: '#38bdf8', labelText: '② write' }),
    mkEdge('e-redis-ack', 'redis-w', 'ack',   { color: '#10b981' }),
    mkEdge('e-db-ack',    'db-w',   'ack',    { color: '#10b981' }),

    // Read path
    mkEdge('e-r-redis', 'app-r',   'redis-r', { color: '#dc2626' }),
    mkEdge('e-r-resp',  'redis-r', 'resp-r',  { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
