'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const NODES: Node[] = [
  // Path labels
  mkLabel('lbl-hit',  100, -10,  { label: 'CACHE HIT — fast path',  icon: '⚡', color: '#34d399' }),
  mkLabel('lbl-miss', 100, 170,  { label: 'CACHE MISS — slow path', icon: '🐌', color: '#f59e0b' }),

  // HIT path (top row, y ~30–60)
  mkNode('user-hit',  0,   30,  { icon: '👤', title: 'User Request', sub: 'GET /product/42',   color: '#34d399' }),
  mkNode('cache',     220, 30,  {
    icon: '⚡',
    title: 'Redis Cache',
    sub: '~0.5ms',
    color: '#34d399',
    badge: 'HIT ✓',
    pills: [
      { label: 'Key: product:42',    color: '#34d399' },
      { label: 'TTL: 300s remaining', color: '#64748b' },
    ],
  }),
  mkNode('resp-hit',  460, 30,  { icon: '✅', title: '200 OK', sub: 'Served from cache', color: '#34d399', badge: '< 1ms' }),

  // MISS path (bottom row, y ~200–330)
  mkNode('user-miss',  0,   200, { icon: '👤', title: 'User Request', sub: 'GET /product/99',  color: '#f59e0b' }),
  mkNode('cache-miss', 220, 200, { icon: '💨', title: 'Cache Miss',   sub: 'Key not found',    color: '#f87171', badge: 'MISS ✗' }),
  mkNode('db',         460, 200, { icon: '🗄️', title: 'Database',     sub: '~80ms query',      color: '#a78bfa', badge: 'PostgreSQL' }),
  mkNode('cache-set',  460, 330, { icon: '⚡', title: 'Cache Set',    sub: 'Store result 5min', color: '#34d399', badge: 'Future requests → HIT' }),
  mkNode('resp-miss',  680, 200, { icon: '✅', title: '200 OK',       sub: 'Served from DB',   color: '#f59e0b', badge: '~85ms' }),
];

const EDGES: Edge[] = [
  // HIT path
  mkEdge('e-hit-1', 'user-hit', 'cache',    { color: '#34d399' }),
  mkEdge('e-hit-2', 'cache',    'resp-hit', { color: '#34d399' }),

  // MISS path
  mkEdge('e-miss-1', 'user-miss',  'cache-miss', { color: '#f87171' }),
  mkEdge('e-miss-2', 'cache-miss', 'db',         { color: '#f59e0b', labelText: 'fetch'    }),
  mkEdge('e-miss-3', 'db',         'cache-set',  { color: '#34d399', labelText: 'populate' }),
  mkEdge('e-miss-4', 'db',         'resp-miss',  { color: '#f59e0b' }),
];

export default function CachingDiagram() {
  return <FlowDiagram nodes={NODES} edges={EDGES} />;
}
