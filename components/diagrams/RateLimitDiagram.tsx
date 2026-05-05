'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('client', 0, 130, {
    icon: '💻',
    title: 'Client',
    sub: 'Making API calls',
    color: '#64748b',
  }),
  mkNode('rl-check', 220, 130, {
    icon: '🪣',
    title: 'Token Bucket',
    sub: 'Max: 100 req/min',
    color: '#f59e0b',
    badge: 'Current: 73/100 tokens',
    pills: [
      { label: 'Algorithm: Token Bucket', color: '#f59e0b' },
      { label: 'Refill: +1 token/600ms', color: '#34d399' },
      { label: 'Burst allowed up to limit', color: '#64748b' },
    ],
  }),
  mkNode('allowed', 500, 30, {
    icon: '✅',
    title: '200 OK',
    sub: 'Request processed',
    color: '#34d399',
    badge: '-1 token consumed',
  }),
  mkNode('blocked', 500, 250, {
    icon: '🚫',
    title: '429 Too Many',
    sub: 'Rate limit exceeded',
    color: '#f87171',
    badge: 'Retry-After: 60s',
    pills: [
      { label: 'X-RateLimit-Limit: 100', color: '#64748b' },
      { label: 'X-RateLimit-Remaining: 0', color: '#f87171' },
    ],
  }),
  mkNode('api', 740, 30, {
    icon: '⚙️',
    title: 'API Server',
    sub: 'Handles request',
    color: '#38bdf8',
    badge: 'Business logic',
  }),
  mkLabel('lbl-a', 360, 0, {
    label: 'Token available → allowed',
    icon: '⚡',
    color: '#34d399',
  }),
  mkLabel('lbl-b', 360, 350, {
    label: 'No tokens → rejected instantly (fail fast)',
    icon: '🛑',
    color: '#f87171',
  }),
];

const edges: Edge[] = [
  mkEdge('e-cl-rl', 'client', 'rl-check', { color: '#38bdf8' }),
  mkEdge('e-rl-ok', 'rl-check', 'allowed', { color: '#34d399', labelText: 'has token' }),
  mkEdge('e-rl-blk', 'rl-check', 'blocked', { color: '#f87171', labelText: 'no token', animated: false }),
  mkEdge('e-ok-api', 'allowed', 'api', { color: '#34d399' }),
];

export default function RateLimitDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
