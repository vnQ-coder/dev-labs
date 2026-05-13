'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaOneToManyDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkNode('conversation', 300, 0, { icon: '💬', title: 'Conversation', sub: 'id, name, created_at', color: '#38bdf8' }),

    mkNode('msg1', 100, 130, { icon: '📨', title: 'Message 1', sub: 'id, conversation_id (FK), text', color: '#a78bfa' }),
    mkNode('msg2', 300, 130, { icon: '📨', title: 'Message 2', sub: 'id, conversation_id (FK), text', color: '#a78bfa' }),
    mkNode('msg3', 500, 130, { icon: '📨', title: 'Message 3', sub: 'id, conversation_id (FK), text', color: '#a78bfa' }),

    mkLabel('lbl-sql',   620, 60,  { label: 'SQL FK Approach', color: '#38bdf8' }),
    mkNode('sql-fk',     620, 120, { icon: '🗄️', title: 'Child Table FK', sub: 'messages.conversation_id → conversations.id', color: '#38bdf8' }),

    mkLabel('lbl-nosql', 620, 240, { label: 'NoSQL Decision', color: '#4ade80' }),
    mkNode('nosql-embed', 620, 300, { icon: '📎', title: 'Embed (small arrays)', sub: 'store inside parent doc if bounded', color: '#4ade80', badge: 'bounded' }),
    mkNode('nosql-ref',   620, 420, { icon: '🔗', title: 'Reference (large)',    sub: 'separate collection if unbounded',   color: '#f97316', badge: 'unbounded' }),

    mkLabel('lbl-examples', 0, 300, { label: 'Real-world examples', color: '#f59e0b' }),
    mkNode('ex-whatsapp', 0, 360, { icon: '💬', title: 'WhatsApp',  sub: 'conversation → messages (1:M)',      color: '#f59e0b' }),
    mkNode('ex-ecommerce', 0, 470, { icon: '🛒', title: 'Ecommerce', sub: 'order → order_items (1:M)',          color: '#f87171' }),
    mkNode('ex-banking',   0, 580, { icon: '🏦', title: 'Banking',   sub: 'account → transactions (1:M)',       color: '#2dd4bf' }),

    mkLabel('lbl-note', 0, 690, { label: 'One-to-Many: the child table holds a FK to the parent — most common relationship in relational databases', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'conversation', 'msg1', { color: '#38bdf8', labelText: '1' }),
    mkEdge('e2', 'conversation', 'msg2', { color: '#38bdf8' }),
    mkEdge('e3', 'conversation', 'msg3', { color: '#38bdf8', labelText: 'M' }),
    mkEdge('e4', 'nosql-embed',  'nosql-ref', { color: '#4ade80', dashed: true, labelText: 'vs' }),
    mkEdge('e5', 'ex-whatsapp',  'ex-ecommerce', { color: '#f59e0b', dashed: true }),
    mkEdge('e6', 'ex-ecommerce', 'ex-banking',   { color: '#f59e0b', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
