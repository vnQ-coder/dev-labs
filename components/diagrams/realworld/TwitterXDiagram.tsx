'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function TwitterXDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Left: User Client
    mkNode('user', 20, 180, {
      icon: '🐦',
      title: 'User Client',
      sub: 'Web / Mobile',
      color: '#38bdf8',
    }),

    // API Server
    mkNode('api', 190, 100, {
      icon: '⚙️',
      title: 'API Server',
      sub: 'Write & Read path',
      color: '#1d9bf0',
      badge: '300K tweets/sec peak',
    }),

    // MySQL Tweet Store
    mkNode('mysql', 190, 270, {
      icon: '🗄️',
      title: 'MySQL Store',
      sub: 'Persistent tweets',
      color: '#6366f1',
      badge: 'sharded by tweet_id',
    }),

    // Kafka (centre)
    mkNode('kafka', 390, 100, {
      icon: '📨',
      title: 'Kafka',
      sub: 'Event stream',
      color: '#f59e0b',
      badge: 'tweet events',
    }),

    // Fanout Service
    mkNode('fanout', 390, 250, {
      icon: '📡',
      title: 'Fanout Service',
      sub: 'Push to followers',
      color: '#1d9bf0',
    }),

    // Redis Timeline Cache
    mkNode('redis', 580, 180, {
      icon: '⚡',
      title: 'Redis Timeline',
      sub: 'Per-user cache',
      color: '#dc2626',
      badge: 'ZSET per user',
    }),

    // Celebrity Pull-on-read
    mkNode('celebrity', 580, 340, {
      icon: '⭐',
      title: 'Celebrity Pull',
      sub: 'Pull-on-read path',
      color: '#94a3b8',
      badge: 'pull-on-read',
    }),

    // Earlybird Search
    mkNode('search', 580, 30, {
      icon: '🔍',
      title: 'Earlybird Search',
      sub: 'Real-time index',
      color: '#34d399',
      badge: 'indexed in 15s',
    }),

    // Timeline API
    mkNode('timeline', 730, 180, {
      icon: '📋',
      title: 'Timeline API',
      sub: 'Read timeline',
      color: '#1d9bf0',
    }),

    // Label
    mkLabel('lbl', 160, 410, {
      label: '275:1 read/write ratio · Redis ZSET timeline cache per user',
      icon: '💡',
      color: '#1d9bf0',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // User → API Server (write tweet)
    mkEdge('e-user-api', 'user', 'api', { color: '#38bdf8', animated: pulse }),

    // API → MySQL (persist)
    mkEdge('e-api-mysql', 'api', 'mysql', {
      color: '#6366f1',
      animated: false,
      srcHandle: 'b',
      tgtHandle: 't',
    }),

    // API → Kafka
    mkEdge('e-api-kafka', 'api', 'kafka', { color: '#f59e0b', animated: pulse }),

    // Kafka → Fanout Service
    mkEdge('e-kafka-fanout', 'kafka', 'fanout', { color: '#f59e0b', animated: pulse }),

    // Fanout → Redis Timeline (push to followers)
    mkEdge('e-fanout-redis', 'fanout', 'redis', { color: '#dc2626', animated: pulse }),

    // User → Timeline API (read path)
    mkEdge('e-user-timeline', 'user', 'timeline', {
      color: '#38bdf8',
      animated: false,
      dashed: true,
    }),

    // Timeline API → Redis (cache read)
    mkEdge('e-timeline-redis', 'timeline', 'redis', {
      color: '#dc2626',
      animated: false,
    }),

    // Kafka → Earlybird Search (dashed)
    mkEdge('e-kafka-search', 'kafka', 'search', {
      color: '#34d399',
      animated: false,
      dashed: true,
    }),

    // Kafka → Celebrity Pull (dashed, labeled)
    mkEdge('e-kafka-celebrity', 'kafka', 'celebrity', {
      color: '#94a3b8',
      animated: false,
      dashed: true,
      labelText: '10M+ followers',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
