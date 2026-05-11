'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function UberDiagram() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(p => !p);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Left: apps
    mkNode('rider', 20, 80, {
      icon: '🧑',
      title: 'Rider App',
      sub: 'iOS / Android',
      color: '#38bdf8',
    }),
    mkNode('driver', 20, 230, {
      icon: '🚗',
      title: 'Driver App',
      sub: 'GPS stream',
      color: '#38bdf8',
    }),

    // API Gateway
    mkNode('apigw', 220, 155, {
      icon: '🚪',
      title: 'API Gateway',
      sub: 'gRPC · REST',
      color: '#f59e0b',
    }),

    // Dispatch Service (centre)
    mkNode('dispatch', 420, 155, {
      icon: '🗺️',
      title: 'Dispatch Service',
      sub: 'Go microservice',
      color: '#276EF1',
    }),

    // Fan-out services (right)
    mkNode('location', 620, 30, {
      icon: '📍',
      title: 'Location Service',
      sub: 'Redis · H3 grid',
      color: '#276EF1',
      badge: '1M GPS updates/sec',
    }),
    mkNode('eta', 620, 155, {
      icon: '⏱️',
      title: 'ETA Service',
      sub: 'ML model',
      color: '#a78bfa',
    }),
    mkNode('maps', 620, 280, {
      icon: '🗺️',
      title: 'Maps Service',
      sub: 'Routing engine',
      color: '#34d399',
    }),

    // Trip DB
    mkNode('tripdb', 420, 310, {
      icon: '🗃️',
      title: 'Trip DB',
      sub: 'Schemaless / MySQL',
      color: '#34d399',
    }),

    // Label
    mkLabel('lbl', 160, 380, {
      label: 'Location updates processed every 4 seconds per active driver',
      icon: '💡',
      color: '#276EF1',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Apps → API Gateway
    mkEdge('e-rider-gw', 'rider', 'apigw', { color: '#38bdf8', animated: false }),
    mkEdge('e-driver-gw', 'driver', 'apigw', {
      color: '#38bdf8',
      animated: pulse,
      labelText: 'GPS',
    }),

    // API Gateway → Dispatch
    mkEdge('e-gw-dispatch', 'apigw', 'dispatch', { color: '#276EF1', animated: false }),

    // Dispatch fan-out
    mkEdge('e-dispatch-loc', 'dispatch', 'location', {
      color: '#276EF1',
      animated: pulse,
    }),
    mkEdge('e-dispatch-eta', 'dispatch', 'eta', { color: '#a78bfa', animated: false }),
    mkEdge('e-dispatch-maps', 'dispatch', 'maps', { color: '#34d399', animated: false }),

    // Dispatch → Trip DB
    mkEdge('e-dispatch-db', 'dispatch', 'tripdb', {
      color: '#34d399',
      animated: false,
      srcHandle: 'b',
      tgtHandle: 't',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
