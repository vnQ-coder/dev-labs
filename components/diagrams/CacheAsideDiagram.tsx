'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function CacheAsideDiagram() {
  const nodes: Node[] = useMemo(() => [
    // HIT group
    mkGroup('grp-hit', 0, 0, 680, 140, { label: 'Cache HIT', sub: 'fast path', color: '#10b981' }),
    mkNode('c-hit',    20,  45, { icon: '💻', title: 'Client',      sub: 'GET /item/1',         color: '#64748b' }),
    mkNode('r-hit',   230,  45, { icon: '⚡', title: 'Redis Cache', sub: '~0.5ms',              color: '#dc2626', badge: 'HIT ✓' }),
    mkNode('v-hit',   470,  45, { icon: '✅', title: 'Return Value', sub: 'Cached, < 1ms total', color: '#10b981' }),

    // MISS group
    mkGroup('grp-miss', 0, 180, 680, 200, { label: 'Cache MISS', sub: 'slow path', color: '#f97316' }),
    mkNode('c-miss',   20,  240, { icon: '💻', title: 'Client',       sub: 'GET /item/99',         color: '#64748b' }),
    mkNode('r-miss',  230,  240, { icon: '💨', title: 'Redis Cache',  sub: 'Key not found',        color: '#dc2626', badge: 'MISS ✗' }),
    mkNode('db-miss', 470,  240, { icon: '🗄️', title: 'Database',     sub: '~80ms query',          color: '#38bdf8', badge: 'Source of truth' }),
    mkNode('r-pop',   230,  340, { icon: '⚡', title: 'Populate Cache', sub: 'SET key value EX 300', color: '#10b981' }),
    mkNode('v-miss',  470,  340, { icon: '📤', title: 'Return Value', sub: 'From DB, ~85ms total',  color: '#f97316' }),

    // Bottom label
    mkLabel('lbl', 80, 400, { label: 'Hit ratio determines how much load reaches the DB', icon: '📊', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // HIT path
    mkEdge('e-h1', 'c-hit', 'r-hit',  { color: '#10b981' }),
    mkEdge('e-h2', 'r-hit', 'v-hit',  { color: '#10b981' }),

    // MISS path
    mkEdge('e-m1', 'c-miss', 'r-miss',  { color: '#f87171' }),
    mkEdge('e-m2', 'r-miss', 'db-miss', { color: '#f97316', animated: true, labelText: 'cache miss → fetch' }),
    mkEdge('e-m3', 'db-miss', 'r-pop',  { color: '#10b981', dashed: true, labelText: 'populate cache' }),
    mkEdge('e-m4', 'db-miss', 'v-miss', { color: '#f97316' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
