'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const EVENTS = ['OrderPlaced', 'UserSignedUp', 'PaymentDone', 'ItemShipped'];

export default function EventDrivenArchDiagram() {
  const [evt, setEvt] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => { setPulse(false); setEvt(e => (e + 1) % EVENTS.length); }, 800);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('order-svc',  0,   60,  { icon: '🛒', title: 'Order Service',   sub: 'producer',  color: '#38bdf8' }),
    mkNode('user-svc',   0,   220, { icon: '👤', title: 'User Service',    sub: 'producer',  color: '#38bdf8' }),
    mkNode('bus',        260, 140, { icon: '📨', title: 'Event Bus',        sub: 'Kafka / RabbitMQ / SNS', color: '#f59e0b', badge: `event: ${EVENTS[evt]}` }),
    mkNode('inventory',  520, 20,  { icon: '📦', title: 'Inventory',        sub: 'consumer',  color: '#34d399', dim: !pulse }),
    mkNode('email',      520, 140, { icon: '📧', title: 'Email Service',    sub: 'consumer',  color: '#34d399', dim: !pulse }),
    mkNode('analytics',  520, 260, { icon: '📊', title: 'Analytics',        sub: 'consumer',  color: '#34d399', dim: !pulse }),
    mkLabel('lbl',       80,  340, { label: 'Producers emit events — any number of consumers react independently & asynchronously', color: '#f59e0b' }),
  ], [evt, pulse]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'order-svc', 'bus',       { color: '#38bdf8', labelText: 'publish' }),
    mkEdge('e2', 'user-svc',  'bus',       { color: '#38bdf8' }),
    mkEdge('e3', 'bus', 'inventory',       { color: pulse ? '#34d399' : '#1e293b', dashed: !pulse }),
    mkEdge('e4', 'bus', 'email',           { color: pulse ? '#34d399' : '#1e293b', dashed: !pulse }),
    mkEdge('e5', 'bus', 'analytics',       { color: pulse ? '#34d399' : '#1e293b', dashed: !pulse }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
