'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresTransactionsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Isolation levels (left column)
    mkNode('rc', 0, 0, {
      icon: '1️⃣',
      title: 'READ COMMITTED',
      sub: 'Default — no dirty reads\nnon-repeatable reads possible',
      color: '#f59e0b',
      badge: 'default',
    }),
    mkNode('rr', 0, 120, {
      icon: '2️⃣',
      title: 'REPEATABLE READ',
      sub: 'Snapshot at txn start\nno non-repeatable reads',
      color: '#60a5fa',
      badge: 'snapshot',
    }),
    mkNode('ser', 0, 240, {
      icon: '3️⃣',
      title: 'SERIALIZABLE',
      sub: 'Full SSI\nprevents write skew',
      color: '#10b981',
      badge: 'full SSI',
    }),

    // Anomalies column (right)
    mkNode('a-dirty', 480, 0, {
      icon: '🚫',
      title: 'Dirty Read',
      sub: 'Reading uncommitted data',
      color: '#ef4444',
      badge: 'prevented all levels',
    }),
    mkNode('a-nonrep', 480, 120, {
      icon: '⚠️',
      title: 'Non-repeatable Read',
      sub: 'Row changes between reads',
      color: '#f59e0b',
    }),
    mkNode('a-phantom', 480, 240, {
      icon: '👻',
      title: 'Phantom Read',
      sub: 'New rows appear mid-txn',
      color: '#f59e0b',
    }),
    mkNode('a-skew', 480, 360, {
      icon: '🔀',
      title: 'Write Skew',
      sub: 'Concurrent decisions on shared state',
      color: '#ef4444',
    }),

    mkLabel('lbl', 100, 460, {
      label: 'Higher isolation = fewer anomalies, more contention',
      icon: '⚖️',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // RC prevents dirty reads only
    mkEdge('e-rc-dirty',   'rc',  'a-dirty',   { color: '#10b981', labelText: 'prevents' }),

    // RR prevents dirty + non-repeatable + phantom
    mkEdge('e-rr-dirty',   'rr',  'a-dirty',   { color: '#10b981', labelText: 'prevents' }),
    mkEdge('e-rr-nonrep',  'rr',  'a-nonrep',  { color: '#10b981', labelText: 'prevents' }),
    mkEdge('e-rr-phantom', 'rr',  'a-phantom', { color: '#10b981', dashed: true, labelText: 'prevents' }),

    // Serializable prevents all
    mkEdge('e-ser-dirty',   'ser', 'a-dirty',   { color: '#10b981', labelText: 'prevents' }),
    mkEdge('e-ser-nonrep',  'ser', 'a-nonrep',  { color: '#10b981', labelText: 'prevents' }),
    mkEdge('e-ser-phantom', 'ser', 'a-phantom', { color: '#10b981', labelText: 'prevents' }),
    mkEdge('e-ser-skew',    'ser', 'a-skew',    { color: '#10b981', labelText: 'prevents' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
