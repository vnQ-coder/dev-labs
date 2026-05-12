'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DiscordDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // User client (left)
    mkNode('client', 20, 160, {
      icon: '💬',
      title: 'User Client',
      sub: 'Desktop / mobile',
      color: '#38bdf8',
    }),

    // Gateway pod
    mkNode('gateway', 200, 160, {
      icon: '🔌',
      title: 'Gateway Pod',
      sub: 'WebSocket handler',
      color: pulse ? '#5865f2' : '#4752c4',
      badge: '100K WS/pod',
    }),

    // Kafka
    mkNode('kafka', 390, 80, {
      icon: '📊',
      title: 'Kafka',
      sub: 'Message bus',
      color: '#f59e0b',
      badge: 'partitioned by channel',
    }),

    // Redis routing table
    mkNode('redis', 390, 260, {
      icon: '⚡',
      title: 'Redis',
      sub: 'Routing table',
      color: '#dc2626',
      badge: 'user → pod map',
    }),

    // Delivery service
    mkNode('delivery', 580, 160, {
      icon: '📬',
      title: 'Delivery Service',
      sub: 'Fan-out to pods',
      color: '#5865f2',
    }),

    // Gateway pod (receiving fan-out — target side)
    mkNode('gateway2', 760, 160, {
      icon: '🔌',
      title: 'Gateway Pod',
      sub: 'Other users WS',
      color: pulse ? '#5865f2' : '#4752c4',
      badge: '100K WS/pod',
    }),

    // Cassandra
    mkNode('cassandra', 390, 390, {
      icon: '🗄️',
      title: 'Cassandra',
      sub: 'Message store',
      color: '#a78bfa',
      badge: 'message history',
    }),

    // SFU voice
    mkNode('sfu', 200, 360, {
      icon: '🔊',
      title: 'SFU Voice Server',
      sub: 'Media relay',
      color: '#34d399',
      badge: '< 40ms audio',
    }),

    // Viewer (target of fan-out)
    mkNode('other-client', 940, 160, {
      icon: '👥',
      title: 'Other Clients',
      sub: 'Receiving users',
      color: '#38bdf8',
    }),

    // Label
    mkLabel('lbl', 500, 430, {
      label: "19M active servers · Cassandra partitioned by (channel_id, bucket)",
      icon: '💡',
      color: '#5865f2',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Client → Gateway
    mkEdge('e-client-gw', 'client', 'gateway', { color: '#38bdf8', animated: pulse }),

    // Gateway → Kafka
    mkEdge('e-gw-kafka', 'gateway', 'kafka', {
      color: '#f59e0b',
      animated: pulse,
      srcHandle: 't',
      tgtHandle: 'b',
    }),

    // Kafka → Delivery Service
    mkEdge('e-kafka-delivery', 'kafka', 'delivery', { color: '#f59e0b', animated: pulse }),

    // Delivery → Redis (lookup which pod the target user is on)
    mkEdge('e-delivery-redis', 'delivery', 'redis', {
      color: '#dc2626',
      animated: pulse,
      dashed: true,
    }),

    // Delivery → Gateway2 (fan-out)
    mkEdge('e-delivery-gw2', 'delivery', 'gateway2', { color: '#5865f2', animated: pulse }),

    // Gateway2 → Other clients
    mkEdge('e-gw2-clients', 'gateway2', 'other-client', { color: '#38bdf8', animated: pulse }),

    // Gateway → Cassandra (write path, dashed)
    mkEdge('e-gw-cassandra', 'gateway', 'cassandra', {
      color: '#a78bfa',
      animated: false,
      dashed: true,
      srcHandle: 'b',
      tgtHandle: 't',
    }),

    // Client → SFU (voice path)
    mkEdge('e-client-sfu', 'client', 'sfu', {
      color: '#34d399',
      animated: pulse,
      dashed: true,
      srcHandle: 'b',
      tgtHandle: 't',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
