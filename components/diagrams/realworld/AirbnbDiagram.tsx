'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AirbnbDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Guest (left)
    mkNode('guest', 20, 180, {
      icon: '👤',
      title: 'Guest',
      sub: 'Web / Mobile',
      color: '#38bdf8',
    }),

    // Elasticsearch (search)
    mkNode('elastic', 200, 80, {
      icon: '🔍',
      title: 'Elasticsearch',
      sub: 'Listing search',
      color: '#ff5a5f',
      badge: '7M listings indexed',
    }),

    // Redis Bitmaps (availability)
    mkNode('bitmaps', 200, 260, {
      icon: '🗓️',
      title: 'Redis Bitmaps',
      sub: 'Availability check',
      color: '#dc2626',
      badge: 'availability O(1)',
    }),

    // Booking Service (centre-right)
    mkNode('booking', 420, 180, {
      icon: '📝',
      title: 'Booking Service',
      sub: 'Reserve listing',
      color: '#ff5a5f',
      badge: 'EXCLUDE constraint',
    }),

    // Redis Redlock
    mkNode('redlock', 600, 100, {
      icon: '🔒',
      title: 'Redis Redlock',
      sub: 'Distributed lock',
      color: '#dc2626',
      badge: 'anti double-book',
    }),

    // PostgreSQL
    mkNode('postgres', 600, 260, {
      icon: '🗄️',
      title: 'PostgreSQL',
      sub: 'Booking record',
      color: '#336791',
      badge: 'booking record',
    }),

    // Kafka
    mkNode('kafka', 750, 180, {
      icon: '📨',
      title: 'Kafka',
      sub: 'Booking events',
      color: '#f59e0b',
      badge: 'booking events',
    }),

    // Host App (far right)
    mkNode('host', 750, 340, {
      icon: '🏠',
      title: 'Host App',
      sub: 'iOS / Android',
      color: '#34d399',
    }),

    // Label
    mkLabel('lbl', 100, 400, {
      label: '7M listings · Redis bitmap: 730 bits per listing = 640 MB total',
      icon: '💡',
      color: '#ff5a5f',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Guest → Elasticsearch (search listings)
    mkEdge('e-guest-elastic', 'guest', 'elastic', {
      color: '#ff5a5f',
      animated: pulse,
      labelText: 'search query',
    }),

    // Guest → Redis Bitmaps (availability check)
    mkEdge('e-guest-bitmaps', 'guest', 'bitmaps', {
      color: '#dc2626',
      animated: pulse,
      labelText: 'check availability',
    }),

    // Elasticsearch → Booking Service (search results)
    mkEdge('e-elastic-booking', 'elastic', 'booking', {
      color: '#ff5a5f',
      animated: false,
    }),

    // Redis Bitmaps → Booking Service (availability result)
    mkEdge('e-bitmaps-booking', 'bitmaps', 'booking', {
      color: '#dc2626',
      animated: false,
    }),

    // Booking Service → Redis Redlock (acquire lock)
    mkEdge('e-booking-redlock', 'booking', 'redlock', {
      color: '#dc2626',
      animated: pulse,
      labelText: 'acquire lock',
    }),

    // Redis Redlock → PostgreSQL (write booking)
    mkEdge('e-redlock-postgres', 'redlock', 'postgres', {
      color: '#336791',
      animated: pulse,
    }),

    // PostgreSQL → Kafka (emit event)
    mkEdge('e-postgres-kafka', 'postgres', 'kafka', {
      color: '#f59e0b',
      animated: false,
      srcHandle: 'r',
    }),

    // Kafka → Host App (notify host)
    mkEdge('e-kafka-host', 'kafka', 'host', {
      color: '#34d399',
      animated: false,
      labelText: 'notify host',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
