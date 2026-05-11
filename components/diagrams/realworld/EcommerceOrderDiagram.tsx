'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function EcommerceOrderDiagram() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 6), 1500);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Client
    mkNode('client', 20, 160, {
      icon: '🛒',
      title: 'Client',
      sub: 'Place Order',
      color: '#38bdf8',
    }),

    // Order Service + Outbox (same DB transaction group)
    mkGroup('grp-order', 180, 100, 260, 170, {
      label: 'Atomic Transaction',
      sub: 'same DB commit',
      color: '#f59e0b',
    }),
    mkNode('order-svc', 200, 130, {
      icon: '📦',
      title: 'Order Service',
      sub: 'Creates order',
      color: '#f59e0b',
      badge: step >= 1 ? 'PROCESSING' : undefined,
    }),
    mkNode('outbox', 330, 185, {
      icon: '📋',
      title: 'Outbox Table',
      sub: 'Pending events',
      color: '#34d399',
      badge: step >= 2 ? 'WRITTEN' : undefined,
    }),

    // Message Relay
    mkNode('relay', 510, 160, {
      icon: '🔄',
      title: 'Message Relay',
      sub: 'Polls outbox',
      color: '#f59e0b',
      badge: step >= 3 ? 'RELAYING' : undefined,
    }),

    // Kafka
    mkNode('kafka', 670, 160, {
      icon: '📨',
      title: 'Kafka',
      sub: 'Event Bus',
      color: '#f59e0b',
      badge: step >= 3 ? 'PUBLISHING' : undefined,
    }),

    // Downstream services
    mkNode('payment-svc', 830, 50, {
      icon: '💳',
      title: 'Payment Service',
      sub: 'Charges card',
      color: '#f59e0b',
      badge: step >= 4 ? 'OK' : undefined,
    }),
    mkNode('payment-db', 830, 10, {
      icon: '🗄️',
      title: 'Payment DB',
      sub: 'Postgres',
      color: '#34d399',
      dim: step < 4,
    }),
    mkNode('inventory-svc', 830, 175, {
      icon: '🏭',
      title: 'Inventory Svc',
      sub: 'Reserves stock',
      color: '#f59e0b',
      badge: step >= 4 ? 'RESERVED' : undefined,
    }),
    mkNode('inventory-db', 830, 235, {
      icon: '🗄️',
      title: 'Inventory DB',
      sub: 'Postgres',
      color: '#34d399',
      dim: step < 4,
    }),
    mkNode('shipping-svc', 830, 310, {
      icon: '🚚',
      title: 'Shipping Service',
      sub: 'Creates shipment',
      color: '#f59e0b',
      badge: step >= 5 ? 'DISPATCHED' : undefined,
    }),
    mkNode('shipping-db', 830, 370, {
      icon: '🗄️',
      title: 'Shipping DB',
      sub: 'Postgres',
      color: '#34d399',
      dim: step < 5,
    }),

    // Compensation arrow label
    mkLabel('comp-lbl', 720, 380, {
      label: '↩ compensation events on failure',
      icon: '⚠️',
      color: '#ef4444',
    }),

    mkLabel('lbl', 150, 395, {
      label: 'Transactional Outbox + Saga — distributed transaction without 2PC',
      icon: '💡',
      color: '#f59e0b',
    }),
  ], [step]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-client-order', 'client', 'order-svc', {
      color: '#38bdf8',
      animated: step >= 1,
    }),
    mkEdge('e-order-outbox', 'order-svc', 'outbox', {
      color: '#f59e0b',
      animated: step >= 2,
    }),
    mkEdge('e-outbox-relay', 'outbox', 'relay', {
      color: '#34d399',
      animated: step >= 3,
      dashed: true,
    }),
    mkEdge('e-relay-kafka', 'relay', 'kafka', {
      color: '#f59e0b',
      animated: step >= 3,
    }),
    mkEdge('e-kafka-payment', 'kafka', 'payment-svc', {
      color: '#f59e0b',
      animated: step >= 4,
    }),
    mkEdge('e-kafka-inventory', 'kafka', 'inventory-svc', {
      color: '#f59e0b',
      animated: step >= 4,
    }),
    mkEdge('e-kafka-shipping', 'kafka', 'shipping-svc', {
      color: '#f59e0b',
      animated: step >= 5,
    }),
    mkEdge('e-payment-db', 'payment-svc', 'payment-db', {
      color: '#34d399',
      animated: step >= 4,
    }),
    mkEdge('e-inventory-db', 'inventory-svc', 'inventory-db', {
      color: '#34d399',
      animated: step >= 4,
    }),
    mkEdge('e-shipping-db', 'shipping-svc', 'shipping-db', {
      color: '#34d399',
      animated: step >= 5,
    }),
    // Compensation edges (reverse, dashed red)
    mkEdge('e-comp-payment', 'payment-svc', 'kafka', {
      color: '#ef4444',
      dashed: true,
      animated: step === 5,
      noArrow: true,
    }),
  ], [step]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
