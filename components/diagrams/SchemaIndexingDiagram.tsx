'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaIndexingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Top row — index types
    mkNode('btree',     0,   0,   { icon: '🌲', title: 'B-tree Index',     sub: 'range queries, ORDER BY, default',         color: '#38bdf8' }),
    mkNode('hash',      220, 0,   { icon: '#',  title: 'Hash Index',       sub: 'equality only, = comparisons',             color: '#a78bfa' }),
    mkNode('composite', 440, 0,   { icon: '⊞',  title: 'Composite Index',  sub: 'multi-column, left-prefix rule',           color: '#f59e0b' }),
    mkNode('partial',   660, 0,   { icon: '⊂',  title: 'Partial Index',    sub: 'filtered, WHERE condition',                color: '#4ade80' }),

    // Middle — query analysis hub
    mkNode('query-analysis', 330, 180, { icon: '🔍', title: 'Query Analysis', sub: 'EXPLAIN ANALYZE to pick right index',   color: '#2dd4bf' }),

    // Bottom row — real-world examples
    mkNode('ex-ecommerce', 0,   380, { icon: '🛒', title: 'Ecommerce',  sub: 'products(category_id, price) for catalog filter',             color: '#f97316' }),
    mkNode('ex-fintech',   330, 380, { icon: '🏦', title: 'Fintech',    sub: 'ledger_entries(account_id, created_at DESC) for balance',     color: '#f97316' }),
    mkNode('ex-whatsapp',  660, 380, { icon: '💬', title: 'WhatsApp',   sub: 'messages(conversation_id, created_at) for history',           color: '#f97316' }),

    // Right side — write overhead warning
    mkNode('write-overhead', 920, 180, { icon: '⚠️', title: 'Write Overhead', sub: 'Every index = slower INSERT/UPDATE',   color: '#f87171', badge: 'Tradeoff' }),

    mkLabel('lbl', 0, 540, { label: 'Choose indexes based on query patterns — more indexes = faster reads but slower writes', color: '#38bdf8' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Query analysis → index types
    mkEdge('e1', 'query-analysis', 'btree',     { color: '#38bdf8', dashed: true }),
    mkEdge('e2', 'query-analysis', 'hash',      { color: '#a78bfa', dashed: true }),
    mkEdge('e3', 'query-analysis', 'composite', { color: '#f59e0b', dashed: true }),
    mkEdge('e4', 'query-analysis', 'partial',   { color: '#4ade80', dashed: true }),

    // Query analysis → real-world examples
    mkEdge('e5', 'query-analysis', 'ex-ecommerce', { color: '#f97316' }),
    mkEdge('e6', 'query-analysis', 'ex-fintech',   { color: '#f97316' }),
    mkEdge('e7', 'query-analysis', 'ex-whatsapp',  { color: '#f97316' }),

    // Write overhead warning
    mkEdge('e8', 'write-overhead', 'btree',     { color: '#f87171', dashed: true, labelText: 'impacts' }),
    mkEdge('e9', 'write-overhead', 'composite', { color: '#f87171', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
