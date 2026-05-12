'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresDeadlocksDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Transaction A
    mkNode('txna', 0, 80, {
      icon: '🔵',
      title: 'Transaction A',
      sub: 'xid=200',
      color: '#336791',
    }),
    mkNode('row1', 200, 40, {
      icon: '🔒',
      title: 'Row 1',
      sub: 'held by Txn A',
      color: '#336791',
      badge: 'locked',
    }),

    // Transaction B
    mkNode('txnb', 0, 240, {
      icon: '🟠',
      title: 'Transaction B',
      sub: 'xid=201',
      color: '#f59e0b',
    }),
    mkNode('row2', 200, 240, {
      icon: '🔒',
      title: 'Row 2',
      sub: 'held by Txn B',
      color: '#f59e0b',
      badge: 'locked',
    }),

    // Deadlock detector
    mkNode('detector', 460, 140, {
      icon: '🕵️',
      title: 'Deadlock Detector',
      sub: 'detects cycle after deadlock_timeout (1s)\naborts victim txn (lower xid)',
      color: '#ef4444',
    }),

    // Prevention nodes
    mkNode('prev1', 200, 370, {
      icon: '🔢',
      title: 'Consistent Lock Order',
      sub: 'always lock row1 before row2',
      color: '#10b981',
    }),
    mkNode('prev2', 460, 370, {
      icon: '🔄',
      title: 'NOWAIT + Retry',
      sub: 'fail fast, retry at app layer',
      color: '#10b981',
    }),

    mkLabel('lbl', 80, 470, {
      label: 'Cycle in wait graph = deadlock — Postgres auto-detects and aborts one victim',
      icon: '🔁',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // A holds row1, waits for row2
    mkEdge('e-a-r1',  'txna', 'row1', { color: '#336791', labelText: 'holds' }),
    mkEdge('e-a-r2',  'txna', 'row2', { color: '#336791', dashed: true, labelText: 'waiting' }),

    // B holds row2, waits for row1
    mkEdge('e-b-r2',  'txnb', 'row2', { color: '#f59e0b', labelText: 'holds' }),
    mkEdge('e-b-r1',  'txnb', 'row1', { color: '#f59e0b', dashed: true, labelText: 'waiting' }),

    // Detector aborts victim
    mkEdge('e-det-a', 'detector', 'txna', { color: '#ef4444', labelText: 'aborts victim' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
