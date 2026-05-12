'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AWSSQSDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Producers (left column)
    mkNode('prod1', 0, 20,  { icon: '🛒', title: 'Producer A', sub: 'Order Service',   color: '#4db0c9' }),
    mkNode('prod2', 0, 140, { icon: '👤', title: 'Producer B', sub: 'User Service',    color: '#4db0c9' }),
    mkNode('prod3', 0, 260, { icon: '📦', title: 'Producer C', sub: 'Inventory Svc',   color: '#4db0c9' }),

    // SQS group
    mkGroup('sqs-group', 185, 0, 320, 320, { label: 'SQS Queue', sub: 'Standard Queue — at-least-once', color: '#4db0c9' }),
    mkNode('msg1', 30, 50,  { icon: '📨', title: 'Message',        sub: 'msg-001',       color: '#4db0c9', badge: 'visible' },            { parentId: 'sqs-group' }),
    mkNode('msg2', 30, 150, { icon: '🔒', title: 'Message',        sub: 'msg-002',       color: '#f59e0b', badge: '🔒 invisible 30s' },   { parentId: 'sqs-group' }),
    mkNode('msg3', 170, 100,{ icon: '📨', title: 'Message',        sub: 'msg-003',       color: '#4db0c9', badge: 'visible' },            { parentId: 'sqs-group' }),
    mkNode('msg4', 170, 210,{ icon: '📨', title: 'Message',        sub: 'msg-004',       color: '#4db0c9', badge: 'visible' },            { parentId: 'sqs-group' }),

    // Consumers (right column)
    mkNode('cons1', 560, 80,  { icon: '⚙️', title: 'Consumer 1', sub: 'Worker process', color: '#34d399', badge: 'polling' }),
    mkNode('cons2', 560, 220, { icon: '⚙️', title: 'Consumer 2', sub: 'Worker process', color: '#34d399', badge: 'polling' }),

    // Dead Letter Queue (below)
    mkNode('dlq', 280, 370, { icon: '💀', title: 'Dead Letter Queue', sub: 'maxReceiveCount = 3', color: '#f87171', badge: 'poison pill catcher' }),

    // Labels
    mkLabel('lbl-bottom', 140, 465, { label: 'Visibility timeout = processing window; DLQ = poison pill catcher', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Producers → queue group (target the visible msg nodes)
    mkEdge('e-p1-q', 'prod1', 'msg1', { color: '#4db0c9', labelText: 'send' }),
    mkEdge('e-p2-q', 'prod2', 'msg2', { color: '#4db0c9', labelText: 'send' }),
    mkEdge('e-p3-q', 'prod3', 'msg4', { color: '#4db0c9', labelText: 'send' }),

    // Queue → consumers (long polling label)
    mkEdge('e-q-c1', 'msg1', 'cons1', { color: '#34d399', labelText: 'Long Polling (20s)' }),
    mkEdge('e-q-c2', 'msg3', 'cons2', { color: '#34d399', labelText: 'Long Polling (20s)' }),

    // Invisible message → consumer processing
    mkEdge('e-inv-c1', 'msg2', 'cons1', { color: '#f59e0b', dashed: true, labelText: 'processing…', animated: false }),

    // DLQ path
    mkEdge('e-msg4-dlq', 'msg4', 'dlq', { color: '#f87171', dashed: true, labelText: 'retry ×3 → DLQ' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
