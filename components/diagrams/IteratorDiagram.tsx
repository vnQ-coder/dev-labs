'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const ITEMS = ['🍎 Apple', '🍌 Banana', '🍇 Grape', '🍊 Orange', '🥝 Kiwi'];

export default function IteratorDiagram() {
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCursor(c => (c + 1) % ITEMS.length), 1200);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('client',     0,   180, { icon: '💻', title: 'Client',         sub: 'calls next() in a loop',    color: '#38bdf8' }),
    mkNode('iterator',   230, 180, { icon: '👆', title: 'Iterator',        sub: `index: ${cursor} / hasNext: ${cursor < ITEMS.length - 1}`, color: '#a78bfa', badge: `current: ${ITEMS[cursor]}` }),
    mkNode('collection', 490, 180, { icon: '📦', title: 'Collection',      sub: `Array[${ITEMS.length}]`,   color: '#34d399' }),
    ...ITEMS.map((item, i) =>
      mkNode(`item${i}`, 420 + i * 90, 340, {
        icon: item.split(' ')[0],
        title: item.split(' ')[1],
        sub: `[${i}]`,
        color: i === cursor ? '#f59e0b' : '#334155',
        badge: i === cursor ? '← current' : undefined,
      })
    ),
    mkLabel('lbl', 80, 480, { label: 'Iterator hides collection internals — client uses a uniform traversal interface', color: '#a78bfa' }),
  ], [cursor]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'client',     'iterator',   { color: '#38bdf8', labelText: 'next()' }),
    mkEdge('e2', 'iterator',   'collection', { color: '#a78bfa', labelText: 'accesses' }),
    mkEdge('e3', 'collection', `item${cursor}`, { color: '#f59e0b', labelText: 'points to' }),
  ], [cursor]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
