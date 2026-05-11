'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

// Cycle through channels: 0=email, 1=sms, 2=push, 3=inapp
export default function NotificationDiagram() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 4), 1800);
    return () => clearInterval(id);
  }, []);

  const channelActive = (ch: number) => step === ch;

  const nodes: Node[] = useMemo(() => [
    // ── Event Sources (left) ──────────────────────────────
    mkGroup('grp-sources', 10, 40, 150, 280, {
      label: 'Event Sources',
      color: '#a78bfa',
    }),
    mkNode('order-svc', 30, 70, {
      icon: '📦',
      title: 'Order Service',
      sub: 'OrderPlaced event',
      color: '#a78bfa',
    }),
    mkNode('auth-svc', 30, 175, {
      icon: '🔐',
      title: 'Auth Service',
      sub: 'LoginAlert event',
      color: '#a78bfa',
    }),
    mkNode('mkt-svc', 30, 280, {
      icon: '📣',
      title: 'Marketing Svc',
      sub: 'PromoSent event',
      color: '#a78bfa',
    }),

    // ── Event Bus ─────────────────────────────────────────
    mkNode('event-bus', 240, 175, {
      icon: '📨',
      title: 'Kafka / SNS',
      sub: 'Event Bus',
      color: '#f59e0b',
      badge: 'STREAMING',
    }),

    // ── Notification Router (centre) ──────────────────────
    mkNode('router', 430, 175, {
      icon: '🧭',
      title: 'Notification Router',
      sub: 'User preference rules',
      color: '#a78bfa',
      badge: step >= 0 ? 'ROUTING' : undefined,
    }),

    // ── Workers (right) ───────────────────────────────────
    mkNode('email-worker', 620, 50, {
      icon: '✉️',
      title: 'Email Worker',
      sub: 'AWS SES',
      color: channelActive(0) ? '#a78bfa' : '#6b7280',
      badge: channelActive(0) ? 'SENDING' : undefined,
    }),
    mkNode('sms-worker', 620, 150, {
      icon: '📱',
      title: 'SMS Worker',
      sub: 'Twilio',
      color: channelActive(1) ? '#a78bfa' : '#6b7280',
      badge: channelActive(1) ? 'SENDING' : undefined,
    }),
    mkNode('push-worker', 620, 250, {
      icon: '🔔',
      title: 'Push Worker',
      sub: 'FCM / APNs',
      color: channelActive(2) ? '#a78bfa' : '#6b7280',
      badge: channelActive(2) ? 'SENDING' : undefined,
    }),
    mkNode('inapp-worker', 620, 350, {
      icon: '💬',
      title: 'In-App Worker',
      sub: 'WebSocket / SSE',
      color: channelActive(3) ? '#a78bfa' : '#6b7280',
      badge: channelActive(3) ? 'SENDING' : undefined,
    }),

    // ── Delivery Tracker + DLQ ────────────────────────────
    mkNode('tracker', 800, 175, {
      icon: '📊',
      title: 'Delivery Tracker',
      sub: 'Status & dedup',
      color: '#34d399',
    }),
    mkNode('dlq', 800, 320, {
      icon: '🔁',
      title: 'Dead Letter Queue',
      sub: 'Retry on failure',
      color: '#ef4444',
    }),

    mkLabel('lbl', 150, 400, {
      label: 'Fan-out to channels in parallel — retry via DLQ, deduplicate with idempotency keys',
      icon: '💡',
      color: '#a78bfa',
    }),
  ], [step]);

  const edges: Edge[] = useMemo(() => [
    // Sources → Event Bus
    mkEdge('e-order-bus', 'order-svc', 'event-bus', { color: '#a78bfa', animated: true }),
    mkEdge('e-auth-bus', 'auth-svc', 'event-bus', { color: '#a78bfa', animated: true }),
    mkEdge('e-mkt-bus', 'mkt-svc', 'event-bus', { color: '#a78bfa', animated: true }),

    // Event Bus → Router
    mkEdge('e-bus-router', 'event-bus', 'router', { color: '#f59e0b', animated: true }),

    // Router → Workers
    mkEdge('e-router-email', 'router', 'email-worker', {
      color: channelActive(0) ? '#a78bfa' : '#374151',
      animated: channelActive(0),
    }),
    mkEdge('e-router-sms', 'router', 'sms-worker', {
      color: channelActive(1) ? '#a78bfa' : '#374151',
      animated: channelActive(1),
    }),
    mkEdge('e-router-push', 'router', 'push-worker', {
      color: channelActive(2) ? '#a78bfa' : '#374151',
      animated: channelActive(2),
    }),
    mkEdge('e-router-inapp', 'router', 'inapp-worker', {
      color: channelActive(3) ? '#a78bfa' : '#374151',
      animated: channelActive(3),
    }),

    // Workers → Delivery Tracker
    mkEdge('e-email-tracker', 'email-worker', 'tracker', { color: '#34d399', animated: channelActive(0), dashed: true }),
    mkEdge('e-sms-tracker', 'sms-worker', 'tracker', { color: '#34d399', animated: channelActive(1), dashed: true }),
    mkEdge('e-push-tracker', 'push-worker', 'tracker', { color: '#34d399', animated: channelActive(2), dashed: true }),
    mkEdge('e-inapp-tracker', 'inapp-worker', 'tracker', { color: '#34d399', animated: channelActive(3), dashed: true }),

    // Tracker → DLQ
    mkEdge('e-tracker-dlq', 'tracker', 'dlq', { color: '#ef4444', animated: false, dashed: true }),
    // DLQ → Router (retry)
    mkEdge('e-dlq-router', 'dlq', 'router', { color: '#ef4444', animated: false, dashed: true }),
  ], [step]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
