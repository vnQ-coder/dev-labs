'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const STEPS = [
  { id: 's1', label: 'openFile()',   type: 'concrete', icon: '📂' },
  { id: 's2', label: 'parseData()',  type: 'abstract', icon: '🔄' },
  { id: 's3', label: 'processRows()',type: 'abstract', icon: '⚙️' },
  { id: 's4', label: 'saveResults()',type: 'concrete', icon: '💾' },
];

export default function TemplateMethodDiagram() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), 1400);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('abstract',  0,  180, { icon: '📐', title: 'DataImporter', sub: 'AbstractClass — templateMethod()', color: '#a78bfa', badge: 'defines skeleton' }),
    ...STEPS.map((s, i) =>
      mkNode(s.id, 260 + i * 130, 80 + (s.type === 'abstract' ? 200 : 0), {
        icon: s.icon,
        title: s.label,
        sub: s.type === 'abstract' ? 'abstract ← override' : 'concrete — fixed',
        color: s.type === 'abstract' ? '#f59e0b' : '#34d399',
        badge: i === activeStep ? '▶ running' : undefined,
        dim: i !== activeStep,
      })
    ),
    mkNode('concrete', 740, 180, { icon: '🗂️', title: 'CSVImporter', sub: 'ConcreteClass — overrides abstract steps', color: '#38bdf8' }),
    mkLabel('lbl', 80, 430, { label: 'Abstract class fixes the algorithm skeleton — subclasses fill in the abstract steps', color: '#a78bfa' }),
  ], [activeStep]);

  const edges: Edge[] = useMemo(() => [
    ...STEPS.map((s, i) =>
      mkEdge(`e-abs-${s.id}`, 'abstract', s.id, {
        color: i === activeStep ? (s.type === 'abstract' ? '#f59e0b' : '#34d399') : '#1e293b',
        dashed: s.type === 'abstract',
      })
    ),
    mkEdge('e-conc', 'concrete', 's2', { color: '#38bdf8', dashed: true, labelText: 'implements' }),
    mkEdge('e-conc2', 'concrete', 's3', { color: '#38bdf8', dashed: true }),
  ], [activeStep]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
