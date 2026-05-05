'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('app', 290, 0, {
    icon: '⚙️',
    title: 'App Server',
    sub: 'Writes & reads',
    color: '#38bdf8',
    badge: 'hash(userId) % 4',
  }),
  mkNode('router', 290, 140, {
    icon: '🔀',
    title: 'Shard Router',
    sub: 'Consistent hashing',
    color: '#a78bfa',
    badge: 'Routes to correct shard',
    pills: [
      { label: 'Key: userId', color: '#a78bfa' },
      { label: 'Algorithm: MurmurHash3', color: '#64748b' },
    ],
  }),
  mkNode('sh0', 0, 310, {
    icon: '🗄️',
    title: 'Shard 0',
    sub: 'userId % 4 = 0',
    color: '#38bdf8',
    badge: '25% of data',
    pills: [{ label: '~2.5M rows', color: '#64748b' }],
  }),
  mkNode('sh1', 200, 310, {
    icon: '🗄️',
    title: 'Shard 1',
    sub: 'userId % 4 = 1',
    color: '#34d399',
    badge: '25% of data',
    pills: [{ label: '~2.5M rows', color: '#64748b' }],
  }),
  mkNode('sh2', 400, 310, {
    icon: '🗄️',
    title: 'Shard 2',
    sub: 'userId % 4 = 2',
    color: '#f59e0b',
    badge: '25% of data',
    pills: [{ label: '~2.5M rows', color: '#64748b' }],
  }),
  mkNode('sh3', 600, 310, {
    icon: '🗄️',
    title: 'Shard 3',
    sub: 'userId % 4 = 3',
    color: '#a78bfa',
    badge: '25% of data',
    pills: [{ label: '~2.5M rows', color: '#64748b' }],
  }),
  mkLabel('lbl', 180, 480, {
    label: 'Cross-shard queries are expensive — design shard key carefully',
    icon: '⚠️',
    color: '#f59e0b',
  }),
];

const edges: Edge[] = [
  mkEdge('e-app-rt', 'app', 'router', { color: '#38bdf8' }),
  mkEdge('e-rt-sh0', 'router', 'sh0', { color: '#38bdf8' }),
  mkEdge('e-rt-sh1', 'router', 'sh1', { color: '#34d399' }),
  mkEdge('e-rt-sh2', 'router', 'sh2', { color: '#f59e0b' }),
  mkEdge('e-rt-sh3', 'router', 'sh3', { color: '#a78bfa' }),
];

export default function ShardingDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
