'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

type Phase = 'write' | 'relay' | 'deliver';

export default function TransactionalOutboxDiagram() {
  const [phase, setPhase] = useState<Phase>('write');

  useEffect(() => {
    const cycle: Phase[] = ['write', 'relay', 'deliver'];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % cycle.length; setPhase(cycle[i]); }, 1800);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('service',  0,   160, { icon: '⚙️', title: 'Order Service',   sub: 'writes to DB atomically',   color: '#38bdf8' }),
    mkNode('db',       220, 80,  { icon: '🗄️', title: 'Orders Table',    sub: 'main business data',        color: '#34d399', dim: phase !== 'write' }),
    mkNode('outbox',   220, 240, { icon: '📤', title: 'Outbox Table',     sub: 'same transaction as DB write', color: '#f59e0b', badge: phase === 'write' ? '← writing now' : phase === 'relay' ? 'undelivered rows' : '✅ marked sent' }),
    mkNode('relay',    460, 240, { icon: '🔄', title: 'Message Relay',    sub: 'polls outbox table',        color: '#a78bfa', dim: phase === 'write' }),
    mkNode('broker',   680, 240, { icon: '📨', title: 'Message Broker',   sub: 'Kafka / RabbitMQ / SNS',    color: '#f59e0b', dim: phase !== 'deliver' }),
    mkNode('consA',    900, 140, { icon: '📦', title: 'Inventory Svc',    sub: 'consumer',                  color: '#34d399', dim: phase !== 'deliver' }),
    mkNode('consB',    900, 340, { icon: '📧', title: 'Email Service',    sub: 'consumer',                  color: '#34d399', dim: phase !== 'deliver' }),
    mkLabel('lbl', 0, 400, { label: 'Outbox guarantees at-least-once delivery — no dual-write, no lost messages', color: '#f59e0b' }),
  ], [phase]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'service', 'db',     { color: phase === 'write' ? '#34d399' : '#1e293b', labelText: 'atomic txn' }),
    mkEdge('e2', 'service', 'outbox', { color: phase === 'write' ? '#f59e0b' : '#1e293b' }),
    mkEdge('e3', 'outbox',  'relay',  { color: phase === 'relay' ? '#a78bfa' : '#1e293b', dashed: true, labelText: 'poll' }),
    mkEdge('e4', 'relay',   'broker', { color: phase === 'deliver' ? '#f59e0b' : '#1e293b' }),
    mkEdge('e5', 'broker',  'consA',  { color: phase === 'deliver' ? '#34d399' : '#1e293b' }),
    mkEdge('e6', 'broker',  'consB',  { color: phase === 'deliver' ? '#34d399' : '#1e293b' }),
  ], [phase]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
