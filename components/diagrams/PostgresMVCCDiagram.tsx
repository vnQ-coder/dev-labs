'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresMVCCDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Transactions (left)
    mkNode('t1', 0, 80, { icon: '🔵', title: 'Transaction T1', sub: 'xid=100', color: '#336791' }),
    mkNode('t2', 0, 220, { icon: '🟢', title: 'Transaction T2', sub: 'xid=101', color: '#10b981' }),

    // Row versions group
    mkGroup('grp-rows', 210, 20, 300, 260, { label: 'Table — Row Versions', color: '#60a5fa' }),

    // Row v1 (dead/dim)
    mkNode('row-v1', 240, 60, {
      icon: '❌',
      title: 'Row v1',
      sub: 'xmin=50 xmax=100\nvalue="Alice"',
      color: '#ef4444',
      badge: 'dead',
      dim: true,
    }),
    // Row v2 (visible to T1)
    mkNode('row-v2', 240, 150, {
      icon: '👁',
      title: 'Row v2',
      sub: 'xmin=100 xmax=101\nvalue="Bob"',
      color: '#336791',
      badge: 'visible T1',
    }),
    // Row v3 (visible to T2)
    mkNode('row-v3', 240, 240, {
      icon: '✅',
      title: 'Row v3',
      sub: 'xmin=101 xmax=∞\nvalue="Carol"',
      color: '#10b981',
      badge: 'visible T2',
    }),

    // VACUUM (right)
    mkNode('vacuum', 600, 140, {
      icon: '🧹',
      title: 'VACUUM',
      sub: 'reclaims dead rows (v1)',
      color: '#f59e0b',
    }),

    // Bottom label
    mkLabel('lbl', 100, 360, {
      label: 'Readers see snapshot at txn start — never block writers',
      icon: '📸',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-t1-v2', 't1', 'row-v2', { color: '#336791', labelText: 'sees' }),
    mkEdge('e-t2-v3', 't2', 'row-v3', { color: '#10b981', labelText: 'sees' }),
    mkEdge('e-t1-v1', 't1', 'row-v1', { color: '#ef4444', dashed: true, labelText: 'skips (dead)' }),
    mkEdge('e-vac-v1', 'vacuum', 'row-v1', { color: '#f59e0b', dashed: true, labelText: 'reclaims' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
