'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const NODES: Node[] = [
  // Clients (left)
  mkNode('c1', 0, 20,  { icon: '💻', title: 'Client 1', sub: 'User request', color: '#64748b' }),
  mkNode('c2', 0, 150, { icon: '📱', title: 'Client 2', sub: 'API call',     color: '#64748b' }),
  mkNode('c3', 0, 280, { icon: '🌐', title: 'Client 3', sub: 'Web request',  color: '#64748b' }),

  // Load Balancer (center)
  mkNode('lb', 240, 130, {
    icon: '⚖️',
    title: 'Load Balancer',
    sub: 'ALB / NGINX',
    color: '#38bdf8',
    badge: 'Round Robin',
    pills: [
      { label: 'Health checks ✓',      color: '#34d399' },
      { label: 'SSL Termination',       color: '#38bdf8' },
      { label: 'Sticky Sessions opt.',  color: '#a78bfa' },
    ],
  }),

  // Servers (right)
  mkNode('s1', 520, 10,  { icon: '🖥️', title: 'Server 1', sub: 'CPU: 45%', color: '#34d399', badge: '● HEALTHY' }),
  mkNode('s2', 520, 130, { icon: '🖥️', title: 'Server 2', sub: 'CPU: 52%', color: '#34d399', badge: '● HEALTHY' }),
  mkNode('s3', 520, 250, { icon: '🖥️', title: 'Server 3', sub: 'CPU: 38%', color: '#34d399', badge: '● HEALTHY' }),
  mkNode('s4', 520, 370, { icon: '🖥️', title: 'Server 4', sub: 'CPU: 0%',  color: '#f87171', badge: '● UNHEALTHY', dim: true }),

  // Info label
  mkLabel('lbl-skip', 680, 400, { label: 'LB skips unhealthy servers', icon: 'ℹ️', color: '#64748b' }),
];

const EDGES: Edge[] = [
  // Clients → LB
  mkEdge('e-c1-lb', 'c1', 'lb', { color: '#38bdf8' }),
  mkEdge('e-c2-lb', 'c2', 'lb', { color: '#38bdf8' }),
  mkEdge('e-c3-lb', 'c3', 'lb', { color: '#38bdf8' }),

  // LB → Servers
  mkEdge('e-lb-s1', 'lb', 's1', { color: '#34d399', labelText: '33%' }),
  mkEdge('e-lb-s2', 'lb', 's2', { color: '#34d399', labelText: '33%' }),
  mkEdge('e-lb-s3', 'lb', 's3', { color: '#34d399', labelText: '33%' }),
  mkEdge('e-lb-s4', 'lb', 's4', { color: '#f87171', dashed: true, animated: false, labelText: 'skipped' }),
];

export default function LoadBalancerDiagram() {
  return <FlowDiagram nodes={NODES} edges={EDGES} />;
}
