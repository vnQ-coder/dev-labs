'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function FactoryMethodDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkNode('client',    0,   160, { icon: '💻', title: 'Client',          sub: 'calls createProduct()', color: '#38bdf8' }),
    mkNode('creator',   200, 160, { icon: '🏭', title: 'Creator',          sub: '<<abstract>> createProduct()', color: '#a78bfa' }),
    mkNode('ccA',       430, 60,  { icon: '🔧', title: 'ConcreteCreatorA', sub: 'createProduct() → A',   color: '#34d399' }),
    mkNode('ccB',       430, 260, { icon: '🔧', title: 'ConcreteCreatorB', sub: 'createProduct() → B',   color: '#f59e0b' }),
    mkNode('prodA',     670, 60,  { icon: '📦', title: 'ProductA',         sub: 'implements Product',    color: '#34d399' }),
    mkNode('prodB',     670, 260, { icon: '📦', title: 'ProductB',         sub: 'implements Product',    color: '#f59e0b' }),
    mkLabel('lbl',      200, 330, { label: 'Factory Method — subclasses decide which class to instantiate', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'client',  'creator', { color: '#38bdf8' }),
    mkEdge('e2', 'creator', 'ccA',     { color: '#a78bfa', dashed: true, labelText: 'extends' }),
    mkEdge('e3', 'creator', 'ccB',     { color: '#a78bfa', dashed: true, labelText: 'extends' }),
    mkEdge('e4', 'ccA',     'prodA',   { color: '#34d399', labelText: 'creates' }),
    mkEdge('e5', 'ccB',     'prodB',   { color: '#f59e0b', labelText: 'creates' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
