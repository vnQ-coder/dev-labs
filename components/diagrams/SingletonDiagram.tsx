'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SingletonDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkNode('caller1', 0,   20,  { icon: '🖥️', title: 'Service A',    sub: 'calls getInstance()',  color: '#38bdf8' }),
    mkNode('caller2', 0,  140,  { icon: '🖥️', title: 'Service B',    sub: 'calls getInstance()',  color: '#38bdf8' }),
    mkNode('caller3', 0,  260,  { icon: '🖥️', title: 'Service C',    sub: 'calls getInstance()',  color: '#38bdf8' }),
    mkNode('access',  250, 140, { icon: '🚪', title: 'getInstance()', sub: 'static factory method', color: '#a78bfa', badge: 'Always same ref' }),
    mkNode('inst',    490, 90,  { icon: '👑', title: 'Single Instance', sub: 'created once, shared forever', color: '#f59e0b', badge: 'Private constructor 🔒' }),
    mkNode('field',   490, 240, { icon: '🗄️', title: 'Static Field',  sub: 'holds the one instance',   color: '#f59e0b' }),
    mkLabel('lbl1',   200, 320, { label: 'All callers share the same object reference', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'caller1', 'access', { color: '#38bdf8' }),
    mkEdge('e2', 'caller2', 'access', { color: '#38bdf8' }),
    mkEdge('e3', 'caller3', 'access', { color: '#38bdf8' }),
    mkEdge('e4', 'access',  'inst',   { color: '#a78bfa' }),
    mkEdge('e5', 'inst',    'field',  { color: '#f59e0b', dashed: true, labelText: 'stores ref' }),
    mkEdge('e6', 'access',  'field',  { color: '#f59e0b', dashed: true, labelText: 'reads ref' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
