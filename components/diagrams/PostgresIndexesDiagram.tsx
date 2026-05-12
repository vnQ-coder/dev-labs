'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresIndexesDiagram() {
  const nodes: Node[] = useMemo(() => [
    // 4 index types (left column)
    mkNode('btree', 0, 0, {
      icon: '🌳',
      title: 'B-tree (default)',
      sub: '=, <, >, BETWEEN, LIKE prefix\nO(log n)',
      color: '#336791',
      badge: 'general purpose',
    }),
    mkNode('hash', 0, 110, {
      icon: '#️⃣',
      title: 'Hash Index',
      sub: '= only, faster for UUID equality',
      color: '#60a5fa',
      badge: 'equality only',
    }),
    mkNode('gin', 0, 220, {
      icon: '🔍',
      title: 'GIN',
      sub: 'JSONB keys, tsvector, arrays\nslow insert',
      color: '#f59e0b',
      badge: 'composite values',
    }),
    mkNode('brin', 0, 330, {
      icon: '📦',
      title: 'BRIN',
      sub: 'Block ranges, tiny size\nphysically ordered data',
      color: '#10b981',
      badge: 'huge tables',
    }),

    // Query types (right column)
    mkNode('q-range', 440, 0, {
      icon: '📊',
      title: 'Range Queries',
      sub: 'date BETWEEN, price < 100',
      color: '#336791',
    }),
    mkNode('q-eq', 440, 110, {
      icon: '🎯',
      title: 'Equality Queries',
      sub: 'WHERE id = $1',
      color: '#60a5fa',
    }),
    mkNode('q-fts', 440, 220, {
      icon: '📝',
      title: 'Full-text / JSONB',
      sub: "to_tsvector @@ query, doc->'key'",
      color: '#f59e0b',
    }),
    mkNode('q-seq', 440, 330, {
      icon: '🗂',
      title: 'Sequential Large Tables',
      sub: 'logs, time-series, IoT data',
      color: '#10b981',
    }),

    mkLabel('lbl', 130, 450, {
      label: 'Choose index type by query shape, not habit',
      icon: '💡',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-bt-range', 'btree', 'q-range', { color: '#336791' }),
    mkEdge('e-bt-eq',    'btree', 'q-eq',    { color: '#336791', dashed: true }),
    mkEdge('e-hash-eq',  'hash',  'q-eq',    { color: '#60a5fa' }),
    mkEdge('e-gin-fts',  'gin',   'q-fts',   { color: '#f59e0b' }),
    mkEdge('e-brin-seq', 'brin',  'q-seq',   { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
