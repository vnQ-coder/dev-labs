'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const STEPS = [
  { id: 'order',     title: 'Create Order',     icon: '🛒', color: '#38bdf8' },
  { id: 'payment',   title: 'Reserve Payment',  icon: '💳', color: '#34d399' },
  { id: 'inventory', title: 'Reserve Inventory',icon: '📦', color: '#f59e0b' },
  { id: 'shipping',  title: 'Ship Order',        icon: '🚚', color: '#a78bfa' },
];

type Phase = 'forward' | 'fail' | 'compensate';

export default function SagaDiagram() {
  const [phase, setPhase] = useState<Phase>('forward');
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let step = 0;
    let direction: Phase = 'forward';

    const id = setInterval(() => {
      if (direction === 'forward') {
        step++;
        if (step === 2) { direction = 'fail'; setPhase('fail'); }
        else if (step >= STEPS.length) { step = 0; direction = 'forward'; setPhase('forward'); }
        else setPhase('forward');
      } else if (direction === 'fail') {
        direction = 'compensate';
        setPhase('compensate');
      } else {
        step--;
        if (step < 0) { step = 0; direction = 'forward'; setPhase('forward'); }
      }
      setActiveStep(step);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    ...STEPS.map((s, i) =>
      mkNode(s.id, i * 160, 120, {
        icon: s.icon,
        title: s.title,
        sub: i < activeStep ? '✅ done' : i === activeStep ? (phase === 'compensate' ? '↩ rolling back' : phase === 'fail' ? '❌ failed' : '▶ running') : 'pending',
        color: i < activeStep ? '#34d399' : i === activeStep ? (phase === 'compensate' ? '#f87171' : phase === 'fail' ? '#f87171' : s.color) : '#334155',
        dim: i > activeStep,
      })
    ),
    mkLabel('lbl', 0, 280, { label: 'Saga: each step publishes an event; on failure, compensating transactions roll back in reverse', color: '#f59e0b' }),
  ], [activeStep, phase]);

  const edges: Edge[] = useMemo(() => [
    ...STEPS.slice(0, -1).map((s, i) =>
      mkEdge(`e${i}`, s.id, STEPS[i + 1].id, {
        color: i < activeStep - 1
          ? '#34d399'
          : i === activeStep - 1 && phase === 'compensate'
          ? '#f87171'
          : '#334155',
        dashed: phase === 'compensate' && i >= activeStep - 1,
        animated: i === activeStep - 1,
      })
    ),
  ], [activeStep, phase]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
