'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SlackDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('client', 20, 160, {
      icon: '💬',
      title: 'User Client',
      sub: 'Web / Desktop / Mobile',
      color: '#38bdf8',
    }),
    mkNode('api', 190, 100, {
      icon: '⚙️',
      title: 'API Server',
      sub: 'message write path',
      color: '#4a154b',
    }),
    mkNode('kafka', 360, 100, {
      icon: '📨',
      title: 'Kafka',
      sub: 'message bus',
      color: '#f59e0b',
      badge: 'partitioned by channel',
    }),
    mkNode('delivery', 530, 100, {
      icon: '🚚',
      title: 'Delivery Service',
      sub: 'fan-out per channel',
      color: '#4a154b',
    }),
    mkNode('redis', 530, 250, {
      icon: '🔴',
      title: 'Redis Pod Registry',
      sub: 'user → gateway pod',
      color: '#dc2626',
      badge: 'user → pod_id',
    }),
    mkNode('gateway', 680, 160, {
      icon: '🔌',
      title: 'Gateway Pod',
      sub: 'WebSocket server',
      color: '#4a154b',
      badge: '100K WS connections',
    }),
    mkNode('mysql', 360, 280, {
      icon: '🗃️',
      title: 'MySQL',
      sub: 'persistent message store',
      color: '#336791',
      badge: 'messages + threads',
    }),
    mkNode('elastic', 530, 370, {
      icon: '🔍',
      title: 'Elasticsearch',
      sub: 'full-text search index',
      color: '#f59e0b',
      badge: 'search in < 2s',
    }),
    mkLabel('lbl', 20, 400, {
      label: '20M DAU · MySQL for messages (not Cassandra) — relational queries matter',
      icon: '💡',
      color: '#4a154b',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-client-api', 'client', 'api', {
      color: '#38bdf8',
      animated: pulse,
      labelText: 'send message',
    }),
    mkEdge('e-api-kafka', 'api', 'kafka', {
      color: '#f59e0b',
      animated: pulse,
      labelText: 'publish event',
    }),
    mkEdge('e-kafka-delivery', 'kafka', 'delivery', {
      color: '#4a154b',
      animated: pulse,
      labelText: 'consume',
    }),
    mkEdge('e-delivery-redis', 'delivery', 'redis', {
      color: '#dc2626',
      animated: pulse,
      labelText: 'lookup pod',
    }),
    mkEdge('e-redis-gateway', 'redis', 'gateway', {
      color: '#dc2626',
      animated: false,
    }),
    mkEdge('e-gateway-client', 'gateway', 'client', {
      color: '#38bdf8',
      animated: pulse,
      labelText: 'push via WS',
    }),
    mkEdge('e-api-mysql', 'api', 'mysql', {
      color: '#336791',
      animated: false,
      dashed: true,
      labelText: 'persist',
    }),
    mkEdge('e-kafka-elastic', 'kafka', 'elastic', {
      color: '#f59e0b',
      animated: false,
      dashed: true,
      labelText: 'index',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
