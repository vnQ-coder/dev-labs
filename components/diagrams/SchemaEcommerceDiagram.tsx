'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaEcommerceDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Left column
    mkNode('users',     0,   0,   { icon: '👤', title: 'Users',     sub: 'id, email, name',                                    color: '#38bdf8' }),
    mkNode('addresses', 0,   170, { icon: '📍', title: 'Addresses', sub: 'user_id FK, street, city',                           color: '#38bdf8' }),

    // Center column
    mkNode('products',          380, 0,   { icon: '📦', title: 'Products',          sub: 'id, name, base_price',                       color: '#a78bfa' }),
    mkNode('product-variants',  380, 170, { icon: '🎨', title: 'ProductVariants',   sub: 'product_id, size, color, sku, stock',         color: '#a78bfa' }),
    mkNode('categories',        380, 340, { icon: '🏷️', title: 'Categories',        sub: 'id, name, parent_id',                        color: '#a78bfa' }),
    mkNode('product-categories',380, 510, { icon: '🔗', title: 'ProductCategories', sub: 'product_id, category_id (junction)',          color: '#a78bfa' }),

    // Right column
    mkNode('orders',      760, 0,   { icon: '🛒', title: 'Orders',     sub: 'id, user_id, total_snapshot, status',              color: '#f97316' }),
    mkNode('order-items', 760, 170, { icon: '📋', title: 'OrderItems', sub: 'order_id, variant_id, price_snapshot, qty',        color: '#f97316', badge: 'price_snapshot not FK!' }),

    // Below
    mkNode('payments', 760, 340, { icon: '💳', title: 'Payments', sub: 'order_id, stripe_id, amount, status', color: '#4ade80' }),
    mkNode('reviews',    0,  510, { icon: '⭐', title: 'Reviews',  sub: 'user_id, product_id, rating, body',  color: '#f59e0b' }),

    mkLabel('lbl', 0, 680, { label: 'price_snapshot on order_item — prices can change, orders must be immutable', color: '#f97316' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Left column
    mkEdge('e1', 'users',     'addresses',           { color: '#38bdf8', labelText: '1:M' }),
    mkEdge('e2', 'users',     'orders',              { color: '#38bdf8' }),
    mkEdge('e3', 'users',     'reviews',             { color: '#f59e0b', dashed: true }),

    // Center column
    mkEdge('e4', 'products',         'product-variants',   { color: '#a78bfa', labelText: '1:M' }),
    mkEdge('e5', 'products',         'product-categories', { color: '#a78bfa' }),
    mkEdge('e6', 'categories',       'product-categories', { color: '#a78bfa' }),
    mkEdge('e7', 'products',         'reviews',            { color: '#f59e0b', dashed: true }),

    // Right column
    mkEdge('e8', 'orders',       'order-items',     { color: '#f97316', labelText: '1:M' }),
    mkEdge('e9', 'orders',       'payments',        { color: '#4ade80', labelText: '1:1' }),
    mkEdge('e10','product-variants', 'order-items', { color: '#a78bfa', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
