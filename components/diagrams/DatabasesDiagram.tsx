'use client';
import FlowDiagram, { mkNode, mkGroup, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkGroup('sql-group', 0, 0, 260, 400, {
    label: '🗃️ SQL — Relational',
    sub: 'PostgreSQL / MySQL',
    color: '#38bdf8',
  }),
  mkNode('sql-table', 20, 50, {
    icon: '📊',
    title: 'Tables & Rows',
    sub: 'id | name | email',
    color: '#38bdf8',
    badge: 'Strict schema',
  }, { parentId: 'sql-group', extent: 'parent' }),
  mkNode('sql-join', 20, 175, {
    icon: '⟕',
    title: 'JOIN Queries',
    sub: 'users ⟶ orders ⟶ items',
    color: '#38bdf8',
    badge: 'Cross-table relations',
  }, { parentId: 'sql-group', extent: 'parent' }),
  mkNode('sql-acid', 20, 300, {
    icon: '🔒',
    title: 'ACID Transactions',
    sub: 'All-or-nothing writes',
    color: '#34d399',
    pills: [
      { label: '✓ Strong consistency', color: '#34d399' },
      { label: '⚠ Hard to shard', color: '#f59e0b' },
    ],
  }, { parentId: 'sql-group', extent: 'parent' }),

  mkLabel('vs', 280, 175, { label: 'VS', color: '#64748b' }),

  mkGroup('nosql-group', 330, 0, 260, 400, {
    label: '📄 NoSQL — Document',
    sub: 'MongoDB / DynamoDB',
    color: '#34d399',
  }),
  mkNode('nosql-doc', 20, 50, {
    icon: '{}',
    title: 'JSON Documents',
    sub: '"orders": [...embedded]',
    color: '#34d399',
    badge: 'Flexible schema',
  }, { parentId: 'nosql-group', extent: 'parent' }),
  mkNode('nosql-scale', 20, 175, {
    icon: '📈',
    title: 'Horizontal Scale',
    sub: 'Shard across nodes',
    color: '#34d399',
    badge: 'Unlimited growth',
  }, { parentId: 'nosql-group', extent: 'parent' }),
  mkNode('nosql-trade', 20, 300, {
    icon: '⚖️',
    title: 'Trade-offs',
    sub: 'Fast key lookups',
    color: '#a78bfa',
    pills: [
      { label: '✓ Scales infinitely', color: '#34d399' },
      { label: '⚠ Eventual consistency', color: '#f59e0b' },
      { label: '⚠ No JOIN support', color: '#f87171' },
    ],
  }, { parentId: 'nosql-group', extent: 'parent' }),
];

const edges: Edge[] = [];

export default function DatabasesDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
