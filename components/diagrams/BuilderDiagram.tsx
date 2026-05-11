'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const STEPS = ['setFoundation()', 'buildWalls()', 'addRoof()', 'addWindows()', '✅ getResult()'];

export default function BuilderDiagram() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1400);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('director', 0,   160, { icon: '🎬', title: 'Director',        sub: 'orchestrates construction', color: '#38bdf8' }),
    mkNode('builder',  230, 160, { icon: '🔨', title: 'Builder',         sub: '<<interface>>',             color: '#a78bfa', badge: STEPS[step] }),
    mkNode('concrete', 460, 160, { icon: '🏗️', title: 'ConcreteBuilder', sub: 'implements each step',     color: '#34d399' }),
    mkNode('product',  670, 160, { icon: '🏠', title: 'Product',         sub: 'fully constructed object', color: '#f59e0b', dim: step < STEPS.length - 1 }),
    mkLabel('lbl',     150, 310, { label: 'Director drives steps — client gets a fully-assembled object', color: '#a78bfa' }),
  ], [step]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'director', 'builder',  { color: '#38bdf8', labelText: 'construct()' }),
    mkEdge('e2', 'builder',  'concrete', { color: '#a78bfa', dashed: true, labelText: 'implements' }),
    mkEdge('e3', 'concrete', 'product',  { color: '#34d399', dashed: step < STEPS.length - 1, labelText: 'getResult()' }),
  ], [step]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
