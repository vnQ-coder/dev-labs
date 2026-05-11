'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function TwitterFeedCqrsDiagram() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 5), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // ── Write Side ──────────────────────────────────────────
    mkGroup('grp-write', 10, 10, 310, 220, {
      label: 'Write Side',
      color: '#1da1f2',
    }),

    mkNode('user', 30, 40, {
      icon: '👤',
      title: 'User',
      sub: 'Post tweet',
      color: '#38bdf8',
    }),
    mkNode('cmd-handler', 165, 40, {
      icon: '⚙️',
      title: 'Command Handler',
      sub: 'Validates & dispatches',
      color: '#1da1f2',
      badge: step >= 1 ? 'HANDLING' : undefined,
    }),
    mkNode('event-store', 90, 155, {
      icon: '📜',
      title: 'Event Store',
      sub: 'Append-only log',
      color: '#34d399',
      badge: step >= 2 ? 'APPENDED' : undefined,
    }),

    // ── Event Bus ──────────────────────────────────────────
    mkNode('kafka', 390, 100, {
      icon: '📨',
      title: 'Kafka',
      sub: 'Event Bus',
      color: '#f59e0b',
      badge: step >= 2 ? 'PUBLISHING' : undefined,
    }),

    // ── Projections ────────────────────────────────────────
    mkGroup('grp-proj', 375, 200, 200, 110, {
      label: 'Projections',
      color: '#1da1f2',
    }),
    mkNode('proj-worker', 395, 225, {
      icon: '🔨',
      title: 'Projection Worker',
      sub: 'Builds read models',
      color: '#1da1f2',
      badge: step >= 3 ? 'PROJECTING' : undefined,
    }),
    mkNode('redis', 395, 290, {
      icon: '⚡',
      title: 'Redis Cache',
      sub: 'Timeline (per user)',
      color: '#34d399',
      badge: step >= 3 ? 'UPDATED' : undefined,
    }),

    // Fan-out service
    mkNode('fanout', 600, 100, {
      icon: '📡',
      title: 'Fan-out Service',
      sub: 'Celebrity push',
      color: '#a78bfa',
      badge: step >= 3 ? 'FANNING' : undefined,
    }),
    mkNode('timelines', 600, 220, {
      icon: '📋',
      title: 'Pre-computed',
      sub: 'Follower timelines',
      color: '#34d399',
      badge: step >= 4 ? 'READY' : undefined,
    }),

    // ── Read Side ──────────────────────────────────────────
    mkGroup('grp-read', 755, 10, 170, 220, {
      label: 'Read Side',
      color: '#1da1f2',
    }),
    mkNode('follower', 770, 40, {
      icon: '👥',
      title: 'Follower',
      sub: 'Open feed',
      color: '#38bdf8',
    }),
    mkNode('query-api', 770, 130, {
      icon: '🔍',
      title: 'Query API',
      sub: 'Read-only endpoint',
      color: '#1da1f2',
      badge: step >= 4 ? 'SERVING' : undefined,
    }),

    mkLabel('lbl', 160, 390, {
      label: 'Write once to event store; project to as many read models as needed',
      icon: '💡',
      color: '#1da1f2',
    }),
  ], [step]);

  const edges: Edge[] = useMemo(() => [
    // Write path
    mkEdge('e-user-cmd', 'user', 'cmd-handler', { color: '#38bdf8', animated: step >= 1 }),
    mkEdge('e-cmd-store', 'cmd-handler', 'event-store', { color: '#1da1f2', animated: step >= 2 }),
    mkEdge('e-store-kafka', 'event-store', 'kafka', { color: '#f59e0b', animated: step >= 2 }),

    // Projection path
    mkEdge('e-kafka-proj', 'kafka', 'proj-worker', { color: '#1da1f2', animated: step >= 3 }),
    mkEdge('e-proj-redis', 'proj-worker', 'redis', { color: '#34d399', animated: step >= 3 }),

    // Fan-out path
    mkEdge('e-kafka-fanout', 'kafka', 'fanout', { color: '#a78bfa', animated: step >= 3 }),
    mkEdge('e-fanout-timelines', 'fanout', 'timelines', { color: '#34d399', animated: step >= 4 }),

    // Read path
    mkEdge('e-follower-qapi', 'follower', 'query-api', { color: '#38bdf8', animated: step >= 4 }),
    mkEdge('e-qapi-redis', 'query-api', 'redis', { color: '#34d399', animated: step >= 4, dashed: true }),
    mkEdge('e-qapi-timelines', 'query-api', 'timelines', { color: '#34d399', animated: step >= 4, dashed: true }),
  ], [step]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
