'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const NODES: Node[] = [
  // LEFT — Monolith group
  mkGroup('mono-group', 0, 0, 280, 340, {
    label: '🏛️ MONOLITH',
    sub: 'All services in one process',
    color: '#f87171',
  }),

  // Children inside the monolith group
  mkNode('auth',   15,  50,  { icon: '🔒', title: 'Auth',   color: '#f87171' }, { parentId: 'mono-group', extent: 'parent' }),
  mkNode('orders', 145, 50,  { icon: '📦', title: 'Orders', color: '#f87171' }, { parentId: 'mono-group', extent: 'parent' }),
  mkNode('users',  15,  145, { icon: '👥', title: 'Users',  color: '#f87171' }, { parentId: 'mono-group', extent: 'parent' }),
  mkNode('email',  145, 145, { icon: '📧', title: 'Email',  color: '#f87171' }, { parentId: 'mono-group', extent: 'parent' }),
  mkNode('pay',    15,  240, { icon: '💳', title: 'Pay',    color: '#f87171' }, { parentId: 'mono-group', extent: 'parent' }),
  mkNode('search', 145, 240, { icon: '🔍', title: 'Search', color: '#f87171' }, { parentId: 'mono-group', extent: 'parent' }),

  // Shared DB — outside the group
  mkNode('shared-db', 75, 360, {
    icon: '🗄️',
    title: 'Shared DB',
    sub: 'All coupled',
    color: '#f87171',
    badge: '💥 single point of failure',
  }),

  // VS label in the middle
  mkLabel('vs', 310, 155, { label: 'VS', color: '#64748b' }),

  // RIGHT — API Gateway
  mkNode('gw', 360, 140, {
    icon: '🚪',
    title: 'API Gateway',
    sub: 'Auth · Rate Limit · Route',
    color: '#38bdf8',
    badge: 'Single Entry Point',
  }),

  // Microservices
  mkNode('ms-auth',   600, 10,  { icon: '🔒', title: 'Auth Svc',   sub: 'JWT / OAuth',    color: '#34d399', badge: 'own DB' }),
  mkNode('ms-orders', 600, 115, { icon: '📦', title: 'Order Svc',  sub: 'CQRS pattern',   color: '#a78bfa', badge: 'own DB' }),
  mkNode('ms-users',  600, 220, { icon: '👥', title: 'User Svc',   sub: 'Profile / prefs', color: '#38bdf8', badge: 'own DB' }),
  mkNode('ms-pay',    600, 325, { icon: '💳', title: 'Pay Svc',    sub: 'Stripe / Adyen',  color: '#f59e0b', badge: 'own DB' }),
];

const EDGES: Edge[] = [
  mkEdge('e-gw-auth',   'gw', 'ms-auth',   { color: '#34d399' }),
  mkEdge('e-gw-orders', 'gw', 'ms-orders', { color: '#a78bfa' }),
  mkEdge('e-gw-users',  'gw', 'ms-users',  { color: '#38bdf8' }),
  mkEdge('e-gw-pay',    'gw', 'ms-pay',    { color: '#f59e0b' }),
];

export default function MonolithDiagram() {
  return <FlowDiagram nodes={NODES} edges={EDGES} />;
}
