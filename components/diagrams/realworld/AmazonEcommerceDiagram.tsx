'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AmazonEcommerceDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Left: Customer
    mkNode('customer', 0, 160, {
      icon: '🛒',
      title: 'Customer',
      sub: 'Web / Mobile',
      color: '#38bdf8',
    }),

    // Search path (top row)
    mkNode('elasticsearch', 140, 30, {
      icon: '🔍',
      title: 'Elasticsearch',
      sub: 'A9 Search Engine',
      color: '#ff9900',
      badge: '362M SKUs',
    }),
    mkNode('a9ranker', 310, 30, {
      icon: '🏆',
      title: 'A9 Ranker',
      sub: 'Relevance & ads',
      color: '#ff9900',
    }),
    mkNode('searchresults', 480, 30, {
      icon: '📋',
      title: 'Search Results',
      sub: 'SERP page',
      color: '#ff9900',
    }),

    // Checkout path (middle row)
    mkNode('checkout', 140, 160, {
      icon: '💳',
      title: 'Checkout Service',
      sub: 'Order orchestration',
      color: '#ff9900',
      badge: 'SAGA pattern',
    }),
    mkNode('dynamo', 310, 160, {
      icon: '🗄️',
      title: 'DynamoDB Inventory',
      sub: 'Inventory store',
      color: '#f59e0b',
      badge: 'conditional write',
    }),
    mkNode('redis', 480, 160, {
      icon: '⚡',
      title: 'Redis Inventory',
      sub: 'In-memory cache',
      color: '#dc2626',
      badge: 'atomic DECR',
    }),

    // Payment path (bottom-mid row)
    mkNode('payment', 310, 290, {
      icon: '💰',
      title: 'Payment Service',
      sub: 'Charge & auth',
      color: '#34d399',
      badge: 'Stripe/Amazon Pay',
    }),
    mkNode('mysql', 480, 290, {
      icon: '🐬',
      title: 'MySQL Orders',
      sub: 'Order records',
      color: '#336791',
      badge: 'ACID transactions',
    }),

    // Event / warehouse path (far right)
    mkNode('kafka', 610, 160, {
      icon: '📨',
      title: 'Kafka',
      sub: 'Event bus',
      color: '#f59e0b',
      badge: 'order events',
    }),
    mkNode('wms', 740, 160, {
      icon: '🏭',
      title: 'Warehouse WMS',
      sub: 'Fulfillment system',
      color: '#a78bfa',
    }),

    // Delivery promise engine (bottom label area)
    mkNode('delivery', 610, 290, {
      icon: '🚚',
      title: 'Delivery Promise',
      sub: 'ETA estimation',
      color: '#6366f1',
      badge: 'arrives by Tuesday',
    }),

    // Annotation label
    mkLabel('lbl', 60, 400, {
      label: 'Black Friday: 300K orders/min · Redis atomic DECR prevents overselling',
      icon: '💡',
      color: '#ff9900',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Read path: Customer → Elasticsearch → A9 Ranker → Search Results → Customer
    mkEdge('e-cust-es', 'customer', 'elasticsearch', { color: '#38bdf8', animated: pulse, srcHandle: 'r', tgtHandle: 'l' }),
    mkEdge('e-es-a9', 'elasticsearch', 'a9ranker', { color: '#ff9900', animated: pulse }),
    mkEdge('e-a9-sr', 'a9ranker', 'searchresults', { color: '#ff9900', animated: pulse }),
    mkEdge('e-sr-cust', 'searchresults', 'customer', { color: '#38bdf8', animated: false, dashed: true, srcHandle: 'b', tgtHandle: 't' }),

    // Checkout path: Customer → Checkout → DynamoDB → Redis
    mkEdge('e-cust-checkout', 'customer', 'checkout', { color: '#ff9900', animated: pulse }),
    mkEdge('e-checkout-dynamo', 'checkout', 'dynamo', { color: '#f59e0b', animated: pulse }),
    mkEdge('e-dynamo-redis', 'dynamo', 'redis', { color: '#dc2626', animated: pulse }),

    // Payment path: Checkout → Payment → MySQL
    mkEdge('e-checkout-payment', 'checkout', 'payment', { color: '#34d399', animated: pulse, srcHandle: 'b', tgtHandle: 't' }),
    mkEdge('e-payment-mysql', 'payment', 'mysql', { color: '#336791', animated: false }),

    // Event path: MySQL → Kafka → WMS
    mkEdge('e-mysql-kafka', 'mysql', 'kafka', { color: '#f59e0b', animated: pulse, srcHandle: 'r', tgtHandle: 'b' }),
    mkEdge('e-kafka-wms', 'kafka', 'wms', { color: '#a78bfa', animated: pulse }),

    // Delivery Promise → Search Results (dashed — ETA in results)
    mkEdge('e-delivery-sr', 'delivery', 'searchresults', { color: '#6366f1', animated: false, dashed: true, srcHandle: 't', tgtHandle: 'b' }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
