'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const PHASES = [
  { legacy: 100, new: 0,   label: 'Phase 1: All traffic → Legacy' },
  { legacy: 70,  new: 30,  label: 'Phase 2: New service handles /products' },
  { legacy: 40,  new: 60,  label: 'Phase 3: New service handles /orders too' },
  { legacy: 10,  new: 90,  label: 'Phase 4: Legacy nearly replaced' },
];

export default function StranglerFigDiagram() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 2200);
    return () => clearInterval(id);
  }, []);

  const p = PHASES[phase];

  const nodes: Node[] = useMemo(() => [
    mkNode('client',   0,  160, { icon: '💻', title: 'Clients',          sub: 'web, mobile, partners', color: '#38bdf8' }),
    mkNode('facade',   220, 160, { icon: '🚦', title: 'Strangler Facade', sub: 'routing layer / proxy', color: '#a78bfa', badge: p.label }),
    mkNode('legacy',   470, 60,  {
      icon: '🏛️', title: 'Legacy Monolith',
      sub: `handles ${p.legacy}% of routes`,
      color: p.legacy > 50 ? '#f59e0b' : '#64748b',
      dim: p.legacy < 20,
      badge: `${p.legacy}% traffic`,
    }),
    mkNode('new',      470, 280, {
      icon: '🚀', title: 'New Microservices',
      sub: `handles ${p.new}% of routes`,
      color: p.new > 50 ? '#34d399' : '#38bdf8',
      badge: `${p.new}% traffic`,
      dim: p.new === 0,
    }),
    mkLabel('lbl', 60, 390, { label: 'Strangle the monolith incrementally — migrate one feature at a time, with zero downtime', color: '#a78bfa' }),
  ], [phase, p]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'client', 'facade', { color: '#38bdf8' }),
    mkEdge('e2', 'facade', 'legacy', { color: p.legacy > 0 ? '#f59e0b' : '#1e293b', labelText: `${p.legacy}%`, animated: p.legacy > 0 }),
    mkEdge('e3', 'facade', 'new',    { color: p.new > 0 ? '#34d399' : '#1e293b',    labelText: p.new > 0 ? `${p.new}%` : undefined, animated: p.new > 0 }),
  ], [phase, p]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
