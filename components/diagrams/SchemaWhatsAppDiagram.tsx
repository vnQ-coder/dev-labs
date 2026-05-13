'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaWhatsAppDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Row 1 — top
    mkNode('users',       0,   0,   { icon: '👤', title: 'Users',               sub: 'id, phone, name, status',                          color: '#38bdf8' }),
    mkNode('group-chats', 380, 0,   { icon: '👥', title: 'GroupChats',          sub: 'id, name, created_by',                             color: '#38bdf8' }),

    // Row 2 — middle
    mkNode('conversations', 0,   160, { icon: '💬', title: 'Conversations',       sub: 'id, type: direct/group',                           color: '#a78bfa' }),
    mkNode('conv-members',  380, 160, { icon: '🔗', title: 'ConversationMembers', sub: 'user_id, conv_id, joined_at',                      color: '#a78bfa' }),

    // Row 3
    mkNode('messages', 190, 320, { icon: '✉️', title: 'Messages', sub: 'id, conv_id, sender_id, content, type, created_at', color: '#f97316', badge: 'Partitioned by conv_id+bucket (Cassandra)' }),

    // Row 4
    mkNode('media',          0,   500, { icon: '🖼️', title: 'Media',         sub: 'id, message_id, s3_url, mime_type',                color: '#4ade80' }),
    mkNode('message-status', 380, 500, { icon: '✅', title: 'MessageStatus',  sub: 'message_id, user_id, status: sent/delivered/read', color: '#f59e0b' }),

    mkLabel('lbl', 0, 640, { label: 'Messages stored in Scylla/Cassandra — append-only, partitioned for scale', color: '#f97316' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'users',     'conversations',  { color: '#38bdf8', labelText: 'many' }),
    mkEdge('e2', 'users',     'conv-members',   { color: '#38bdf8' }),
    mkEdge('e3', 'group-chats', 'conversations',{ color: '#a78bfa', dashed: true }),
    mkEdge('e4', 'conversations', 'messages',   { color: '#a78bfa' }),
    mkEdge('e5', 'conv-members', 'conversations',{ color: '#a78bfa', dashed: true }),
    mkEdge('e6', 'messages',  'message-status', { color: '#f97316', labelText: 'one-to-many' }),
    mkEdge('e7', 'messages',  'media',          { color: '#f97316', labelText: 'one-to-one optional', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
