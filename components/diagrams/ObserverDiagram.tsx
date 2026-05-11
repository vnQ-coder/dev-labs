'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const EVENTS = ['UserSignedUp', 'OrderPlaced', 'PaymentFailed', 'ItemShipped'];

export default function ObserverDiagram() {
  const [evt, setEvt] = useState(0);
  const [firing, setFiring] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFiring(true);
      setTimeout(() => { setFiring(false); setEvt(e => (e + 1) % EVENTS.length); }, 900);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('subject', 0,  180, {
      icon: '📡', title: 'Subject',
      sub: 'maintains observer list',
      color: '#a78bfa',
      badge: `emit: ${EVENTS[evt]}`,
    }),
    mkNode('obs1', 310, 40,  { icon: '📧', title: 'EmailService',   sub: 'Observer 1', color: '#34d399', dim: !firing }),
    mkNode('obs2', 310, 160, { icon: '📊', title: 'Analytics',      sub: 'Observer 2', color: '#38bdf8', dim: !firing }),
    mkNode('obs3', 310, 280, { icon: '📱', title: 'PushNotify',     sub: 'Observer 3', color: '#f59e0b', dim: !firing }),
    mkNode('obs4', 310, 400, { icon: '📝', title: 'AuditLogger',    sub: 'Observer 4', color: '#f472b6', dim: !firing }),
    mkLabel('lbl', 0,   460, { label: 'Subject notifies all observers — they react independently, without coupling', color: '#a78bfa' }),
  ], [evt, firing]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'subject', 'obs1', { color: '#34d399', dashed: !firing, labelText: firing ? 'notify()' : undefined }),
    mkEdge('e2', 'subject', 'obs2', { color: '#38bdf8', dashed: !firing }),
    mkEdge('e3', 'subject', 'obs3', { color: '#f59e0b', dashed: !firing }),
    mkEdge('e4', 'subject', 'obs4', { color: '#f472b6', dashed: !firing }),
  ], [firing]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
