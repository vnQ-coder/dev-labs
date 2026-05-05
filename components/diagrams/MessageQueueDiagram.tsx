'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('prod1', 0, 50, {
    icon: '🛒',
    title: 'Order Service',
    sub: 'Producer',
    color: '#f59e0b',
    badge: 'Publishes events',
  }),
  mkNode('prod2', 0, 200, {
    icon: '👤',
    title: 'User Service',
    sub: 'Producer',
    color: '#38bdf8',
    badge: 'Publishes events',
  }),
  mkNode('queue', 230, 100, {
    icon: '📨',
    title: 'Message Queue',
    sub: 'Kafka / RabbitMQ / SQS',
    color: '#f59e0b',
    badge: 'Async decoupling',
    pills: [
      { label: '📬 msg_001: order.created', color: '#f59e0b' },
      { label: '📬 msg_002: user.signup', color: '#38bdf8' },
      { label: '📬 msg_003: order.created', color: '#f59e0b' },
      { label: 'Retention: 7 days', color: '#64748b' },
    ],
  }),
  mkNode('con-email', 520, 0, {
    icon: '📧',
    title: 'Email Service',
    sub: 'Consumer · Group A',
    color: '#34d399',
    badge: 'Sends welcome email',
  }),
  mkNode('con-analytics', 520, 120, {
    icon: '📊',
    title: 'Analytics',
    sub: 'Consumer · Group B',
    color: '#a78bfa',
    badge: 'Tracks all events',
  }),
  mkNode('con-notify', 520, 240, {
    icon: '🔔',
    title: 'Push Notify',
    sub: 'Consumer · Group C',
    color: '#38bdf8',
    badge: 'Mobile push alerts',
  }),
  mkNode('con-billing', 520, 360, {
    icon: '💰',
    title: 'Billing',
    sub: 'Consumer · Group D',
    color: '#f97316',
    badge: 'Invoice generation',
  }),
  mkLabel('dlq', 240, 340, {
    label: 'DLQ: failed messages after 3 retries',
    icon: '💀',
    color: '#f87171',
  }),
];

const edges: Edge[] = [
  mkEdge('e-p1-q', 'prod1', 'queue', { color: '#f59e0b' }),
  mkEdge('e-p2-q', 'prod2', 'queue', { color: '#38bdf8' }),
  mkEdge('e-q-em', 'queue', 'con-email', { color: '#34d399', labelText: 'fan-out' }),
  mkEdge('e-q-an', 'queue', 'con-analytics', { color: '#a78bfa', labelText: 'fan-out' }),
  mkEdge('e-q-nt', 'queue', 'con-notify', { color: '#38bdf8', labelText: 'fan-out' }),
  mkEdge('e-q-bl', 'queue', 'con-billing', { color: '#f97316', labelText: 'fan-out' }),
];

export default function MessageQueueDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
