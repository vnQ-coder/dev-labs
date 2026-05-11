'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

// 4 phases: 0 = all legacy, 1 = 30% new auth, 2 = 60% new services, 3 = full new
const PHASES = [
  { label: 'Phase 1', sub: '100% legacy', legacyPct: 100, newPct: 0 },
  { label: 'Phase 2', sub: 'Auth migrated (30%)', legacyPct: 70, newPct: 30 },
  { label: 'Phase 3', sub: 'Orders migrated (60%)', legacyPct: 40, newPct: 60 },
  { label: 'Phase 4', sub: 'Legacy decommissioned', legacyPct: 0, newPct: 100 },
];

export default function LegacyMigrationDiagram() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % 4), 2500);
    return () => clearInterval(id);
  }, []);

  const p = PHASES[phase];
  const legacyDim = phase === 3;
  const authVisible = phase >= 1;
  const ordersVisible = phase >= 2;

  const nodes: Node[] = useMemo(() => [
    // Traffic source
    mkNode('traffic', 20, 175, {
      icon: '🌐',
      title: 'User Traffic',
      sub: '100% requests',
      color: '#38bdf8',
    }),

    // Strangler Fig Router
    mkNode('router', 220, 175, {
      icon: '🌿',
      title: 'Strangler Fig Router',
      sub: 'Nginx / API GW',
      color: '#10b981',
      badge: p.label,
      pills: [
        { label: `Legacy ${p.legacyPct}%`, color: '#6b7280' },
        { label: `New ${p.newPct}%`, color: '#10b981' },
      ],
    }),

    // ── Legacy Side ──────────────────────────────────────
    mkGroup('grp-legacy', 420, 80, 230, 280, {
      label: 'Legacy Monolith',
      color: legacyDim ? '#374151' : '#6b7280',
    }),
    mkNode('monolith', 440, 130, {
      icon: '🏛️',
      title: 'Monolith',
      sub: phase === 0 ? 'Auth + Orders + Users' : phase === 1 ? 'Orders + Users' : phase === 2 ? 'Users only' : 'DECOMMISSIONED',
      color: legacyDim ? '#374151' : '#6b7280',
      dim: legacyDim,
    }),
    mkNode('legacy-db', 440, 280, {
      icon: '🗄️',
      title: 'Legacy DB',
      sub: 'Monolithic schema',
      color: legacyDim ? '#374151' : '#34d399',
      dim: legacyDim,
    }),

    // ── New Microservices Side ─────────────────────────────
    mkGroup('grp-new', 680, 30, 230, 360, {
      label: 'New Microservices',
      color: '#10b981',
    }),
    mkNode('auth-svc', 700, 70, {
      icon: '🔐',
      title: 'Auth Service',
      sub: 'JWT · OAuth2',
      color: authVisible ? '#10b981' : '#374151',
      dim: !authVisible,
      badge: authVisible ? 'LIVE' : undefined,
    }),
    mkNode('auth-db', 700, 140, {
      icon: '🗄️',
      title: 'Auth DB',
      sub: 'Postgres',
      color: authVisible ? '#34d399' : '#374151',
      dim: !authVisible,
    }),
    mkNode('orders-svc', 700, 230, {
      icon: '📦',
      title: 'Orders Service',
      sub: 'Event-driven',
      color: ordersVisible ? '#10b981' : '#374151',
      dim: !ordersVisible,
      badge: ordersVisible ? 'LIVE' : undefined,
    }),
    mkNode('orders-db', 700, 305, {
      icon: '🗄️',
      title: 'Orders DB',
      sub: 'Postgres',
      color: ordersVisible ? '#34d399' : '#374151',
      dim: !ordersVisible,
    }),

    // Phase badge
    mkLabel('phase-lbl', 400, 390, {
      label: p.sub,
      icon: phase === 3 ? '✅' : '🔄',
      color: '#10b981',
    }),

    mkLabel('lbl', 140, 405, {
      label: 'Strangler Fig — migrate one bounded context at a time with zero downtime',
      icon: '💡',
      color: '#10b981',
    }),
  ], [phase]);

  const edges: Edge[] = useMemo(() => [
    // Traffic → Router
    mkEdge('e-traffic-router', 'traffic', 'router', {
      color: '#38bdf8',
      animated: true,
    }),

    // Router → Monolith (dims at phase 3)
    mkEdge('e-router-monolith', 'router', 'monolith', {
      color: legacyDim ? '#374151' : '#6b7280',
      animated: !legacyDim,
      dashed: phase >= 2,
    }),

    // Monolith → Legacy DB
    mkEdge('e-monolith-db', 'monolith', 'legacy-db', {
      color: legacyDim ? '#374151' : '#34d399',
      animated: !legacyDim,
    }),

    // Router → Auth Service
    mkEdge('e-router-auth', 'router', 'auth-svc', {
      color: authVisible ? '#10b981' : '#374151',
      animated: authVisible,
    }),
    mkEdge('e-auth-db', 'auth-svc', 'auth-db', {
      color: authVisible ? '#34d399' : '#374151',
      animated: authVisible,
    }),

    // Router → Orders Service
    mkEdge('e-router-orders', 'router', 'orders-svc', {
      color: ordersVisible ? '#10b981' : '#374151',
      animated: ordersVisible,
    }),
    mkEdge('e-orders-db', 'orders-svc', 'orders-db', {
      color: ordersVisible ? '#34d399' : '#374151',
      animated: ordersVisible,
    }),
  ], [phase]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
