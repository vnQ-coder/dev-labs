'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function WriteAroundDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Write path group
    mkGroup('grp-write', 0, 0, 520, 130, { label: 'Write Path — bypasses cache', color: '#dc2626' }),
    mkNode('app-w',   20,  45, { icon: '🖥️', title: 'Application', sub: 'Write request',          color: '#64748b' }),
    mkNode('db-w',   320,  45, { icon: '🗄️', title: 'Database',    sub: 'Direct write',           color: '#38bdf8', badge: 'Source of truth' }),
    mkLabel('lbl-bypass', 150, 95, { label: 'Write bypasses cache', icon: '➡️', color: '#dc2626' }),

    // Read path group (first read after write — miss)
    mkGroup('grp-read', 0, 165, 740, 210, { label: 'First Read After Write — always a miss', color: '#f97316' }),
    mkNode('app-r',    20,  240, { icon: '🖥️', title: 'Application',  sub: 'Read request',          color: '#64748b' }),
    mkNode('redis-r', 230,  240, {
      icon: '💨',
      title: 'Redis Cache',
      sub: 'Key not populated',
      color: '#dc2626',
      badge: 'MISS ✗',
      pills: [{ label: 'Cache cold after write', color: '#f87171' }],
    }),
    mkNode('db-r',    460,  240, { icon: '🗄️', title: 'Database', sub: 'Fallback read', color: '#38bdf8' }),
    mkNode('r-pop',   230,  330, { icon: '⚡', title: 'Populate Cache', sub: 'SET key EX 300',     color: '#10b981' }),
    mkNode('resp',    640,  240, { icon: '📤', title: 'Return Value', sub: '~80ms, first read slow', color: '#f97316' }),

    // Bottom label
    mkLabel('lbl', 100, 400, { label: 'First read after write always misses — prevents cache pollution', icon: '🧹', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Write path — direct to DB
    mkEdge('e-w-app-db', 'app-w', 'db-w', { color: '#dc2626', labelText: 'direct write (no cache)' }),

    // Read path — miss flow
    mkEdge('e-r-app-redis', 'app-r',   'redis-r', { color: '#f87171' }),
    mkEdge('e-r-redis-db',  'redis-r', 'db-r',    { color: '#f97316', animated: true, labelText: 'miss → fetch DB' }),
    mkEdge('e-r-db-pop',    'db-r',    'r-pop',   { color: '#10b981', dashed: true, labelText: 'populate' }),
    mkEdge('e-r-db-resp',   'db-r',    'resp',    { color: '#f97316' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
