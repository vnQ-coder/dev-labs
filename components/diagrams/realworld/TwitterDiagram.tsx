'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function TwitterDiagram() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(p => !p);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // User
    mkNode('user', 10, 155, {
      icon: '👤',
      title: 'User',
      sub: 'Tweets',
      color: '#38bdf8',
    }),

    // Write API
    mkNode('writeapi', 175, 155, {
      icon: '✍️',
      title: 'Write API',
      sub: 'REST endpoint',
      color: '#1da1f2',
    }),

    // Tweet Service
    mkNode('tweetservice', 340, 155, {
      icon: '🐦',
      title: 'Tweet Service',
      sub: 'Go / Java',
      color: '#1da1f2',
    }),

    // Tweet DB
    mkNode('tweetdb', 340, 295, {
      icon: '🗃️',
      title: 'Tweet DB',
      sub: 'MySQL sharded',
      color: '#34d399',
    }),

    // Fan-out / Kafka
    mkNode('fanout', 510, 155, {
      icon: '📨',
      title: 'Fan-out Service',
      sub: 'Apache Kafka',
      color: '#f59e0b',
      badge: 'async queue',
    }),

    // Timeline Service
    mkNode('timeline', 680, 155, {
      icon: '📋',
      title: 'Timeline Service',
      sub: 'Celebrity pull path',
      color: '#1da1f2',
    }),

    // Redis Cache
    mkNode('redis', 680, 295, {
      icon: '⚡',
      title: 'Redis Cache',
      sub: 'Timeline per user',
      color: '#34d399',
    }),

    // Read API
    mkNode('readapi', 850, 155, {
      icon: '📖',
      title: 'Read API',
      sub: 'REST endpoint',
      color: '#1da1f2',
    }),

    // Follower feeds
    mkNode('feeds', 850, 295, {
      icon: '👥',
      title: 'Follower Feeds',
      sub: 'Home timeline',
      color: '#38bdf8',
    }),

    // Label
    mkLabel('lbl', 120, 375, {
      label: 'Hybrid fan-out: push for ≤10K followers, pull for celebrities',
      icon: '💡',
      color: '#1da1f2',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // User → Write API → Tweet Service
    mkEdge('e-user-write', 'user', 'writeapi', { color: '#38bdf8', animated: pulse }),
    mkEdge('e-write-tweet', 'writeapi', 'tweetservice', { color: '#1da1f2', animated: pulse }),

    // Tweet Service → Tweet DB
    mkEdge('e-tweet-db', 'tweetservice', 'tweetdb', {
      color: '#34d399',
      animated: false,
      srcHandle: 'b',
      tgtHandle: 't',
    }),

    // Tweet Service → Fan-out
    mkEdge('e-tweet-fanout', 'tweetservice', 'fanout', {
      color: '#f59e0b',
      animated: pulse,
    }),

    // Fan-out → Timeline Service (async)
    mkEdge('e-fanout-timeline', 'fanout', 'timeline', {
      color: '#1da1f2',
      animated: pulse,
      dashed: true,
      labelText: 'async',
    }),

    // Timeline Service → Redis
    mkEdge('e-timeline-redis', 'timeline', 'redis', {
      color: '#34d399',
      animated: false,
      srcHandle: 'b',
      tgtHandle: 't',
    }),

    // Timeline Service → Read API
    mkEdge('e-timeline-read', 'timeline', 'readapi', {
      color: '#1da1f2',
      animated: false,
    }),

    // Redis → Feeds
    mkEdge('e-redis-feeds', 'redis', 'feeds', {
      color: '#38bdf8',
      animated: pulse,
      srcHandle: 'r',
      tgtHandle: 'l',
    }),

    // Read API → Feeds
    mkEdge('e-read-feeds', 'readapi', 'feeds', {
      color: '#38bdf8',
      animated: false,
      srcHandle: 'b',
      tgtHandle: 't',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
