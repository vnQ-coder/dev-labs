'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AdapterDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkNode('client',  0,   140, { icon: '💻', title: 'Client',   sub: 'uses Target interface',    color: '#38bdf8' }),
    mkNode('target',  220, 60,  { icon: '🎯', title: 'Target',   sub: '<<interface>> request()',  color: '#a78bfa' }),
    mkNode('adapter', 220, 220, { icon: '🔌', title: 'Adapter',  sub: 'request() → specificRequest()', color: '#f59e0b', badge: 'Translates interface' }),
    mkNode('adaptee', 480, 220, { icon: '🏛️', title: 'Adaptee',  sub: 'legacy code / 3rd-party',  color: '#64748b', badge: 'specificRequest()' }),
    mkLabel('lbl',    100, 340, { label: 'Adapter bridges incompatible interfaces without changing existing code', color: '#f59e0b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'client',  'target',  { color: '#38bdf8', dashed: true, labelText: 'expects' }),
    mkEdge('e2', 'client',  'adapter', { color: '#38bdf8', labelText: 'uses' }),
    mkEdge('e3', 'adapter', 'adaptee', { color: '#f59e0b', labelText: 'wraps & delegates' }),
    mkEdge('e4', 'target',  'adapter', { color: '#a78bfa', dashed: true, labelText: 'implements' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
