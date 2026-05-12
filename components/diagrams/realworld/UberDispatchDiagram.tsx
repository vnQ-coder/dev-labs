'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function UberDispatchDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Rider App (top-left)
    mkNode('rider', 20, 60, {
      icon: '🙋',
      title: 'Rider App',
      sub: 'iOS / Android',
      color: '#38bdf8',
    }),

    // Driver App (bottom-left)
    mkNode('driver', 20, 280, {
      icon: '🚗',
      title: 'Driver App',
      sub: 'iOS / Android',
      color: '#f59e0b',
    }),

    // API Gateway
    mkNode('gateway', 200, 60, {
      icon: '🚪',
      title: 'API Gateway',
      sub: 'Auth · Rate limit',
      color: '#6366f1',
    }),

    // Location Service
    mkNode('location', 200, 280, {
      icon: '📍',
      title: 'Location Service',
      sub: 'GPS ingestion',
      color: '#f59e0b',
      badge: '1.25M writes/sec',
    }),

    // Dispatch Service (centre)
    mkNode('dispatch', 400, 160, {
      icon: '🗺️',
      title: 'Dispatch Service',
      sub: 'Matching engine',
      color: '#000000',
      badge: 'match in < 15s',
    }),

    // Redis GEO
    mkNode('redisgeo', 580, 160, {
      icon: '⚡',
      title: 'Redis GEO',
      sub: 'Driver locations',
      color: '#dc2626',
      badge: '5M driver locations',
    }),

    // PostgreSQL
    mkNode('postgres', 580, 300, {
      icon: '🗄️',
      title: 'PostgreSQL',
      sub: 'Trip persistence',
      color: '#336791',
      badge: 'trip state machine',
    }),

    // Flink Surge Engine
    mkNode('flink', 400, 360, {
      icon: '🌊',
      title: 'Flink Surge',
      sub: 'Surge pricing',
      color: '#a78bfa',
      badge: 'surge/60s',
    }),

    // Redis Surge Cache
    mkNode('redissurge', 580, 360, {
      icon: '💰',
      title: 'Redis Surge',
      sub: 'Surge cache',
      color: '#dc2626',
      badge: 'H3 hex cells',
    }),

    // Label
    mkLabel('lbl', 130, 435, {
      label: '1.25M GPS writes/sec · Redis GEO GEORADIUS for driver lookup',
      icon: '💡',
      color: '#f59e0b',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Rider → API Gateway
    mkEdge('e-rider-gw', 'rider', 'gateway', { color: '#38bdf8', animated: pulse }),

    // API Gateway → Dispatch Service
    mkEdge('e-gw-dispatch', 'gateway', 'dispatch', { color: '#6366f1', animated: pulse }),

    // Driver App → Location Service (GPS pings)
    mkEdge('e-driver-loc', 'driver', 'location', {
      color: '#f59e0b',
      animated: pulse,
    }),

    // Location Service → Redis GEO (write driver positions)
    mkEdge('e-loc-redisgeo', 'location', 'redisgeo', {
      color: '#dc2626',
      animated: pulse,
    }),

    // Dispatch Service → Redis GEO (query nearby drivers)
    mkEdge('e-dispatch-redisgeo', 'dispatch', 'redisgeo', {
      color: '#dc2626',
      animated: pulse,
      labelText: 'GEORADIUS query',
    }),

    // Dispatch Service → Driver App (send offer via WebSocket)
    mkEdge('e-dispatch-driver', 'dispatch', 'driver', {
      color: '#f59e0b',
      animated: pulse,
      labelText: 'WebSocket offer',
    }),

    // Dispatch Service → PostgreSQL (trip state)
    mkEdge('e-dispatch-pg', 'dispatch', 'postgres', {
      color: '#336791',
      animated: false,
    }),

    // Flink Surge → Redis Surge (computed every 60s, dashed)
    mkEdge('e-flink-redissurge', 'flink', 'redissurge', {
      color: '#a78bfa',
      animated: false,
      dashed: true,
      labelText: 'every 60s',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
