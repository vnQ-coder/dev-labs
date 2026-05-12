'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function StripeDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Left: Merchant
    mkNode('merchant', 0, 160, {
      icon: '🏪',
      title: 'Merchant',
      sub: 'API client',
      color: '#38bdf8',
    }),

    // API Gateway (centre-left)
    mkNode('apigw', 145, 160, {
      icon: '🚪',
      title: 'API Gateway',
      sub: 'TLS · rate limit',
      color: '#635bff',
      badge: 'idempotency check',
    }),

    // Redis idempotency (top branch)
    mkNode('redis', 145, 30, {
      icon: '⚡',
      title: 'Redis Idempotency',
      sub: 'Key-value store',
      color: '#dc2626',
      badge: '24h TTL',
    }),

    // Payment Intent (centre)
    mkNode('intent', 310, 160, {
      icon: '🔄',
      title: 'Payment Intent',
      sub: 'State machine',
      color: '#635bff',
      badge: 'state machine',
    }),

    // Stripe Radar (dashed branch, top)
    mkNode('radar', 310, 30, {
      icon: '🛡️',
      title: 'Stripe Radar',
      sub: 'ML fraud detection',
      color: '#a78bfa',
      badge: 'ML fraud < 100ms',
    }),

    // Card Network (centre-right)
    mkNode('cardnet', 490, 160, {
      icon: '💳',
      title: 'Card Network',
      sub: 'Issuer bank auth',
      color: '#6366f1',
      badge: 'Visa / Mastercard',
    }),

    // PostgreSQL Ledger (bottom)
    mkNode('postgres', 490, 300, {
      icon: '🐘',
      title: 'PostgreSQL Ledger',
      sub: 'Financial records',
      color: '#336791',
      badge: 'double-entry',
    }),

    // Kafka (far right centre)
    mkNode('kafka', 630, 160, {
      icon: '📨',
      title: 'Kafka',
      sub: 'Event streaming',
      color: '#f59e0b',
      badge: 'payment events',
    }),

    // Webhook Service (far right bottom)
    mkNode('webhook', 630, 300, {
      icon: '🔔',
      title: 'Webhook Service',
      sub: 'Outbound delivery',
      color: '#635bff',
      badge: 'exponential retry',
    }),

    // Annotation label
    mkLabel('lbl', 60, 395, {
      label: '99.999% uptime · Idempotency key stored BEFORE processing — never double-charge',
      icon: '💡',
      color: '#635bff',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Merchant → API Gateway
    mkEdge('e-merchant-apigw', 'merchant', 'apigw', { color: '#38bdf8', animated: pulse }),

    // API Gateway → Redis (idempotency store, top branch)
    mkEdge('e-apigw-redis', 'apigw', 'redis', { color: '#dc2626', animated: false, srcHandle: 't', tgtHandle: 'b' }),

    // API Gateway → Payment Intent
    mkEdge('e-apigw-intent', 'apigw', 'intent', { color: '#635bff', animated: pulse }),

    // Payment Intent → Stripe Radar (dashed — fraud scoring)
    mkEdge('e-intent-radar', 'intent', 'radar', { color: '#a78bfa', animated: false, dashed: true, srcHandle: 't', tgtHandle: 'b' }),

    // Payment Intent → Card Network (authorization)
    mkEdge('e-intent-card', 'intent', 'cardnet', { color: '#6366f1', animated: pulse }),

    // Card Network → Payment Intent (authorization result, back edge)
    mkEdge('e-card-intent', 'cardnet', 'intent', { color: '#6366f1', animated: false, dashed: true, srcHandle: 'b', tgtHandle: 'b' }),

    // Payment Intent → PostgreSQL Ledger
    mkEdge('e-intent-pg', 'intent', 'postgres', { color: '#336791', animated: false, srcHandle: 'b', tgtHandle: 't' }),

    // Payment Intent → Kafka
    mkEdge('e-intent-kafka', 'intent', 'kafka', { color: '#f59e0b', animated: pulse }),

    // Kafka → Webhook Service
    mkEdge('e-kafka-webhook', 'kafka', 'webhook', { color: '#635bff', animated: pulse, srcHandle: 'b', tgtHandle: 't' }),

    // Webhook Service → Merchant (response)
    mkEdge('e-webhook-merchant', 'webhook', 'merchant', { color: '#38bdf8', animated: false, dashed: true }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
