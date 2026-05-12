'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function RedisPubSubDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Pub/Sub group
    mkGroup('grp-pubsub', 0, 0, 700, 160, { label: 'Pub/Sub — at-most-once (ephemeral)', color: '#f97316' }),
    mkNode('publisher',   20,  55, { icon: '📢', title: 'Publisher',    sub: 'PUBLISH channel msg',  color: '#f97316' }),
    mkNode('channel',    220,  55, { icon: '📡', title: 'Channel',      sub: 'In-memory only',       color: '#dc2626', badge: 'no persistence' }),
    mkNode('sub1',       470,  10, { icon: '👤', title: 'Subscriber A', sub: 'SUBSCRIBE channel',    color: '#10b981' }),
    mkNode('sub2',       470,  80, { icon: '👤', title: 'Subscriber B', sub: 'SUBSCRIBE channel',    color: '#10b981' }),
    mkNode('sub3',       470, 110, { icon: '💤', title: 'Subscriber C', sub: 'Disconnected',         color: '#64748b', dim: true }),
    mkLabel('lbl-miss',  230, 138, { label: '⚠ Disconnected sub misses message', icon: '', color: '#f87171' }),

    // Streams group
    mkGroup('grp-streams', 0, 195, 760, 190, { label: 'Streams — durable log with consumer groups', color: '#38bdf8' }),
    mkNode('producer',    20, 255, { icon: '📤', title: 'Producer',       sub: 'XADD stream * k v',   color: '#38bdf8' }),
    mkNode('stream',     220, 255, {
      icon: '📜',
      title: 'Stream Log',
      sub: 'Append-only entries',
      color: '#dc2626',
      badge: 'XADD',
      pills: [
        { label: '1700000001-0: event A', color: '#38bdf8' },
        { label: '1700000002-0: event B', color: '#38bdf8' },
        { label: '1700000003-0: event C', color: '#38bdf8' },
      ],
    }),
    mkNode('cg',         460, 255, {
      icon: '👥',
      title: 'Consumer Group',
      sub: 'XREADGROUP',
      color: '#a78bfa',
      badge: 'PEL tracks delivery',
      pills: [{ label: 'XACK confirms processing', color: '#a78bfa' }],
    }),
    mkNode('worker1',    660, 210, { icon: '⚙️', title: 'Worker 1', sub: 'XACK on done', color: '#10b981' }),
    mkNode('worker2',    660, 300, { icon: '⚙️', title: 'Worker 2', sub: 'XACK on done', color: '#10b981' }),

    // Bottom label
    mkLabel('lbl', 80, 405, { label: 'Pub/Sub = broadcast ephemeral; Streams = durable log with consumer groups', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Pub/Sub
    mkEdge('e-pub-ch',  'publisher', 'channel', { color: '#f97316' }),
    mkEdge('e-ch-sub1', 'channel',   'sub1',    { color: '#10b981', labelText: 'broadcast' }),
    mkEdge('e-ch-sub2', 'channel',   'sub2',    { color: '#10b981', labelText: 'broadcast' }),
    mkEdge('e-ch-sub3', 'channel',   'sub3',    { color: '#64748b', animated: false, dashed: true }),

    // Streams
    mkEdge('e-prod-str',  'producer', 'stream', { color: '#38bdf8', labelText: 'XADD' }),
    mkEdge('e-str-cg',    'stream',   'cg',     { color: '#a78bfa', labelText: 'XREADGROUP' }),
    mkEdge('e-cg-w1',     'cg',       'worker1',{ color: '#10b981' }),
    mkEdge('e-cg-w2',     'cg',       'worker2',{ color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
