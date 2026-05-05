'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('c-node', 300, 0, {
    icon: '🔒',
    title: 'Consistency',
    sub: 'All nodes see same data',
    color: '#38bdf8',
    badge: 'C',
    pills: [{ label: 'Every read gets latest write', color: '#64748b' }],
  }),
  mkNode('a-node', 0, 280, {
    icon: '✅',
    title: 'Availability',
    sub: 'Every request gets response',
    color: '#34d399',
    badge: 'A',
    pills: [{ label: 'System always responds', color: '#64748b' }],
  }),
  mkNode('p-node', 600, 280, {
    icon: '🌐',
    title: 'Partition Tolerance',
    sub: 'Works despite network splits',
    color: '#a78bfa',
    badge: 'P',
    pills: [{ label: 'Required in distributed systems', color: '#64748b' }],
  }),
  mkNode('cp-zone', 100, 140, {
    icon: '🗄️',
    title: 'CP Systems',
    sub: 'Sacrifices availability',
    color: '#38bdf8',
    badge: 'Choose during partition: C over A',
    pills: [
      { label: 'etcd / ZooKeeper', color: '#38bdf8' },
      { label: 'HBase / MongoDB (w/writeConcern)', color: '#64748b' },
    ],
  }),
  mkNode('ap-zone', 480, 140, {
    icon: '📈',
    title: 'AP Systems',
    sub: 'Sacrifices consistency',
    color: '#34d399',
    badge: 'Choose during partition: A over C',
    pills: [
      { label: 'Cassandra / DynamoDB', color: '#34d399' },
      { label: 'CouchDB / Riak', color: '#64748b' },
    ],
  }),
  mkNode('ca-zone', 270, 300, {
    icon: '🏛️',
    title: 'CA Systems',
    sub: 'No partition tolerance',
    color: '#f59e0b',
    badge: 'Only in single-node / LAN',
    pills: [
      { label: 'Single-node PostgreSQL / MySQL', color: '#f59e0b' },
      { label: 'Impossible in true distributed system', color: '#f87171' },
    ],
  }),
  mkLabel('note', 200, 430, {
    label: 'During network partition: choose C (reject writes) or A (accept stale reads). You cannot have both.',
    color: '#64748b',
  }),
];

const edges: Edge[] = [
  mkEdge('e-ca', 'c-node', 'a-node', { color: '#64748b', noArrow: true, animated: false, dashed: true }),
  mkEdge('e-cp', 'c-node', 'p-node', { color: '#64748b', noArrow: true, animated: false, dashed: true }),
  mkEdge('e-ap', 'a-node', 'p-node', { color: '#64748b', noArrow: true, animated: false, dashed: true }),
];

export default function CAPDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
