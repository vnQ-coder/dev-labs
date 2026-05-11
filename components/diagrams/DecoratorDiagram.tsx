'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const LAYERS = [
  { id: 'base',  title: 'TextLogger',      sub: 'base component',            color: '#34d399', icon: '📝' },
  { id: 'dec1',  title: '+ TimestampDecorator', sub: 'wraps TextLogger',     color: '#f59e0b', icon: '⏱️' },
  { id: 'dec2',  title: '+ LogLevelDecorator',  sub: 'wraps Timestamp',      color: '#a78bfa', icon: '🎚️' },
  { id: 'dec3',  title: '+ JSONDecorator',       sub: 'wraps LogLevel',       color: '#f472b6', icon: '📦' },
];

export default function DecoratorDiagram() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % LAYERS.length), 1600);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('client', 0, 160, { icon: '💻', title: 'Client', sub: 'calls log("hello")', color: '#38bdf8' }),
    ...LAYERS.map((l, i) =>
      mkNode(l.id, 230 + i * 160, 160, {
        icon: l.icon,
        title: l.title,
        sub: l.sub,
        color: l.color,
        badge: i === active ? '← active call' : undefined,
        dim: i > active,
      })
    ),
    mkLabel('lbl', 150, 310, { label: 'Each decorator adds behaviour and delegates to the wrapped component', color: '#a78bfa' }),
  ], [active]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-cl', 'client', 'dec3', { color: '#38bdf8' }),
    mkEdge('e-d3', 'dec3',  'dec2',  { color: '#f472b6', dashed: active < 3 }),
    mkEdge('e-d2', 'dec2',  'dec1',  { color: '#a78bfa', dashed: active < 2 }),
    mkEdge('e-d1', 'dec1',  'base',  { color: '#f59e0b', dashed: active < 1 }),
  ], [active]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
