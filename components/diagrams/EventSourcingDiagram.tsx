'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const EVENTS_LIST = ['OrderCreated', 'PaymentTaken', 'ItemShipped', 'OrderClosed'];

export default function EventSourcingDiagram() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setCount(c => c < EVENTS_LIST.length ? c + 1 : 1), 1500);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('cmd',      0,   180, { icon: '✍️', title: 'Command',         sub: 'PlaceOrder / CancelOrder', color: '#38bdf8' }),
    mkNode('handler',  200, 180, { icon: '⚙️', title: 'Command Handler', sub: 'validates & emits events', color: '#a78bfa' }),
    mkNode('store',    430, 180, { icon: '📚', title: 'Event Store',      sub: `${count} event(s) appended`,  color: '#f59e0b', badge: 'append-only log' }),
    mkNode('replay',   650, 80,  { icon: '🔄', title: 'Replay',           sub: 'rebuild state from events',color: '#34d399' }),
    mkNode('state',    870, 80,  { icon: '📊', title: 'Current State',    sub: 'derived, not stored',      color: '#34d399' }),
    mkNode('proj',     650, 300, { icon: '🗂️', title: 'Projections',      sub: 'read-model views',         color: '#f472b6' }),
    ...EVENTS_LIST.slice(0, count).map((e, i) =>
      mkNode(`ev${i}`, 380 + i * 110, 340, { icon: '📌', title: e, sub: `seq: ${i + 1}`, color: '#f59e0b' })
    ),
    mkLabel('lbl', 80, 450, { label: 'State is never stored — it is always derived by replaying the immutable event log', color: '#f59e0b' }),
  ], [count]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'cmd',     'handler', { color: '#38bdf8' }),
    mkEdge('e2', 'handler', 'store',   { color: '#a78bfa', labelText: 'append event' }),
    mkEdge('e3', 'store',   'replay',  { color: '#34d399', labelText: 'read all' }),
    mkEdge('e4', 'replay',  'state',   { color: '#34d399' }),
    mkEdge('e5', 'store',   'proj',    { color: '#f472b6', dashed: true, labelText: 'project' }),
    ...EVENTS_LIST.slice(0, count).map((_, i) =>
      mkEdge(`ev${i}-e`, 'store', `ev${i}`, { color: '#f59e0b', dashed: true, animated: false })
    ),
  ], [count]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
