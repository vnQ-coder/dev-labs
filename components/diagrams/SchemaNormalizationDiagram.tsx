'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaNormalizationDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkLabel('lbl-unnorm', 0, 0, { label: 'Unnormalized (Bad — 1NF violation)', color: '#f87171' }),

    mkNode('order-full', 200, 60, {
      icon: '⚠️',
      title: 'orders_full',
      sub: 'order_id, customer_name, customer_email, product_name, product_price, quantity',
      color: '#f87171',
      badge: 'Redundancy!',
    }),

    mkLabel('lbl-arrow', 200, 200, { label: 'Normalize to 3NF — eliminate repeating groups and transitive dependencies', color: '#f59e0b' }),

    mkLabel('lbl-norm', 0, 290, { label: 'Normalized (3NF — Correct)', color: '#4ade80' }),

    mkNode('customers-table', 0,   360, { icon: '👤', title: 'customers',    sub: 'customer_id PK, name, email',              color: '#4ade80' }),
    mkNode('orders-table',    300, 360, { icon: '🧾', title: 'orders',        sub: 'order_id PK, customer_id FK, ordered_at',  color: '#38bdf8' }),
    mkNode('products-table',  600, 360, { icon: '📦', title: 'products',      sub: 'product_id PK, name, price',               color: '#a78bfa' }),

    mkNode('order-items',     300, 500, { icon: '🔗', title: 'order_items',   sub: 'order_id FK, product_id FK, quantity',     color: '#f59e0b', badge: 'Junction' }),

    mkLabel('lbl-benefit', 0, 630, { label: 'Eliminates redundancy and prevents update anomalies — change a customer email once, reflects everywhere', color: '#4ade80' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'order-full',      'customers-table', { color: '#f87171', dashed: true, labelText: 'extract' }),
    mkEdge('e2', 'order-full',      'orders-table',    { color: '#f87171', dashed: true }),
    mkEdge('e3', 'order-full',      'products-table',  { color: '#f87171', dashed: true, labelText: 'extract' }),
    mkEdge('e4', 'customers-table', 'orders-table',    { color: '#4ade80', labelText: 'customer_id FK' }),
    mkEdge('e5', 'orders-table',    'order-items',     { color: '#38bdf8', labelText: 'order_id FK' }),
    mkEdge('e6', 'products-table',  'order-items',     { color: '#a78bfa', labelText: 'product_id FK' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
