'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaOneToOneDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkLabel('lbl-sql',   0,   0, { label: 'SQL Approach',   color: '#38bdf8' }),
    mkLabel('lbl-nosql', 550, 0, { label: 'NoSQL Approach', color: '#4ade80' }),

    mkNode('user-table',    0,   60,  { icon: '🗄️', title: 'users',        sub: 'id, email, created_at',             color: '#38bdf8' }),
    mkNode('profile-table', 0,   180, { icon: '🗄️', title: 'user_profiles', sub: 'user_id (FK UNIQUE), bio, avatar', color: '#38bdf8', badge: 'UNIQUE FK' }),

    mkLabel('lbl-rel', 290, 110, { label: '1 ↔ 1', color: '#a78bfa' }),

    mkNode('user-doc', 550, 60, { icon: '📄', title: 'User Document',    sub: 'id, email, created_at',            color: '#4ade80' }),
    mkNode('profile-embed', 550, 180, { icon: '📎', title: 'Embedded Profile', sub: 'profile: { bio, avatar }',   color: '#4ade80' }),

    mkLabel('lbl-examples', 0, 310, { label: 'Real-world examples', color: '#f59e0b' }),

    mkNode('whatsapp-user',    0,   380, { icon: '💬', title: 'WhatsApp User',  sub: 'user_id, phone, name',        color: '#f59e0b' }),
    mkNode('whatsapp-key',     300, 380, { icon: '🔑', title: 'KeyBundle',       sub: 'user_id (FK UNIQUE), keys',  color: '#f59e0b', badge: 'E2E Encryption' }),
    mkNode('banking-customer', 0,   500, { icon: '🏦', title: 'Customer',        sub: 'customer_id, name, email',   color: '#f87171' }),
    mkNode('banking-kyc',      300, 500, { icon: '📋', title: 'KYC Record',      sub: 'customer_id (FK UNIQUE)',    color: '#f87171', badge: 'Compliance' }),

    mkLabel('lbl-note', 0, 620, { label: 'One-to-One: enforced with UNIQUE constraint on FK — each row maps to exactly one row in the other table', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'user-table',    'profile-table',  { color: '#38bdf8', labelText: 'has one' }),
    mkEdge('e2', 'user-doc',      'profile-embed',  { color: '#4ade80', labelText: 'embeds' }),
    mkEdge('e3', 'user-table',    'user-doc',       { color: '#a78bfa', dashed: true, labelText: '1 ↔ 1' }),
    mkEdge('e4', 'whatsapp-user', 'whatsapp-key',   { color: '#f59e0b', labelText: '1 ↔ 1' }),
    mkEdge('e5', 'banking-customer', 'banking-kyc', { color: '#f87171', labelText: '1 ↔ 1' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
