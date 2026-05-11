'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const STRATEGIES = [
  { id: 'quicksort',  title: 'QuickSort',      sub: 'O(n log n) avg',   color: '#34d399', icon: '⚡' },
  { id: 'mergesort',  title: 'MergeSort',       sub: 'O(n log n) stable',color: '#38bdf8', icon: '🔀' },
  { id: 'insertsort', title: 'InsertionSort',   sub: 'O(n²) small lists',color: '#f59e0b', icon: '📋' },
];

export default function StrategyDiagram() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % STRATEGIES.length), 2000);
    return () => clearInterval(id);
  }, []);

  const s = STRATEGIES[active];

  const nodes: Node[] = useMemo(() => [
    mkNode('client',    0,   160, { icon: '💻', title: 'Client',           sub: 'sets strategy at runtime',  color: '#38bdf8' }),
    mkNode('context',   220, 160, { icon: '📦', title: 'Context',           sub: 'has a Strategy reference',  color: '#a78bfa', badge: `using: ${s.title}` }),
    ...STRATEGIES.map((st, i) =>
      mkNode(st.id, 470, 60 + i * 130, {
        icon: st.icon,
        title: st.title,
        sub: st.sub,
        color: st.color,
        badge: i === active ? '← active' : undefined,
        dim: i !== active,
      })
    ),
    mkLabel('lbl', 80, 400, { label: 'Swap algorithms at runtime without changing the Context class', color: '#a78bfa' }),
  ], [active, s]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-cl', 'client',  'context',    { color: '#38bdf8', labelText: 'setStrategy()' }),
    ...STRATEGIES.map((st, i) =>
      mkEdge(`e-${st.id}`, 'context', st.id, {
        color: i === active ? st.color : '#334155',
        dashed: i !== active,
        animated: i === active,
      })
    ),
  ], [active]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
