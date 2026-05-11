'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function CQRSDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkGroup('write-side', 0, 0, 540, 180, { label: 'Write Side (Commands)', color: '#f59e0b' }),
    mkGroup('read-side',  0, 220, 540, 180, { label: 'Read Side (Queries)', color: '#38bdf8' }),

    mkNode('cmd-client',  20,  60,  { icon: '✍️',  title: 'Client',          sub: 'sends command',              color: '#f59e0b' }, { parentId: 'write-side', extent: 'parent' }),
    mkNode('cmd-handler', 180, 60,  { icon: '⚙️',  title: 'Command Handler', sub: 'validates & executes',       color: '#f59e0b' }, { parentId: 'write-side', extent: 'parent' }),
    mkNode('write-db',    360, 60,  { icon: '🗄️',  title: 'Write DB',        sub: 'normalised, consistent',     color: '#f59e0b' }, { parentId: 'write-side', extent: 'parent' }),

    mkNode('query-client',  20,  90,  { icon: '🔍', title: 'Client',          sub: 'sends query',               color: '#38bdf8' }, { parentId: 'read-side', extent: 'parent' }),
    mkNode('query-handler', 180, 90,  { icon: '📖', title: 'Query Handler',   sub: 'reads from read model',     color: '#38bdf8' }, { parentId: 'read-side', extent: 'parent' }),
    mkNode('read-db',       360, 90,  { icon: '⚡', title: 'Read DB',         sub: 'denormalised, fast reads',  color: '#38bdf8' }, { parentId: 'read-side', extent: 'parent' }),

    mkNode('projector',  580, 110, { icon: '🔄', title: 'Event Projector', sub: 'syncs write → read model', color: '#a78bfa', badge: 'eventual consistency' }),
    mkLabel('lbl', 0, 420, { label: 'CQRS separates reads from writes — each side optimised independently', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'cmd-client',    'cmd-handler',   { color: '#f59e0b', labelText: 'CreateOrder' }),
    mkEdge('e2', 'cmd-handler',   'write-db',      { color: '#f59e0b' }),
    mkEdge('e3', 'query-client',  'query-handler', { color: '#38bdf8', labelText: 'GetOrders' }),
    mkEdge('e4', 'query-handler', 'read-db',       { color: '#38bdf8' }),
    mkEdge('e5', 'write-db',      'projector',     { color: '#a78bfa', dashed: true, labelText: 'events' }),
    mkEdge('e6', 'projector',     'read-db',       { color: '#a78bfa', dashed: true, labelText: 'projects' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
