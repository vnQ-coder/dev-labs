'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AWSSESDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Left: application send path
    mkNode('app',      0,   80,  { icon: '💻', title: 'Application',    sub: 'Your service',         color: '#4db0c9' }),
    mkNode('ses-api',  190, 80,  { icon: '📮', title: 'SES API / SMTP', sub: 'sendEmail / port 587', color: '#4db0c9' }),

    // Center: SES processing group
    mkGroup('ses-group', 380, 0, 240, 260, { label: 'SES', sub: 'Amazon Simple Email Service', color: '#4db0c9' }),
    mkNode('dkim',    30, 50,  { icon: '🔑', title: 'DKIM Signing',       sub: 'RSA-256 signature',  color: '#34d399' }, { parentId: 'ses-group' }),
    mkNode('ip-rep',  30, 140, { icon: '📊', title: 'IP Reputation Check', sub: 'Dedicated/shared IP', color: '#f59e0b' }, { parentId: 'ses-group' }),
    mkNode('suppr',   130, 95,  { icon: '🚫', title: 'Suppression List',   sub: 'Block known bad addrs', color: '#f87171' }, { parentId: 'ses-group' }),

    // Right: recipient MTA
    mkNode('mta', 680, 80, { icon: '📥', title: 'Recipient MTA', sub: 'Gmail / Outlook', color: '#a78bfa', badge: 'DMARC check' }),

    // Event destinations group (below)
    mkGroup('events-group', 0, 320, 740, 140, { label: 'Event Destinations', sub: 'Bounces & Complaints → feedback loop', color: '#f59e0b' }),
    mkNode('bounce',  20,  40, { icon: '↩️', title: 'Bounce Event',     sub: 'hard/soft bounce', color: '#f87171' }, { parentId: 'events-group' }),
    mkNode('complaint',140, 40,{ icon: '🚩', title: 'Complaint Event',   sub: 'spam report',      color: '#f87171' }, { parentId: 'events-group' }),
    mkNode('sns',     280, 40, { icon: '📣', title: 'SNS Topic',         sub: 'fan-out',          color: '#f59e0b' }, { parentId: 'events-group' }),
    mkNode('lambda',  420, 40, { icon: '⚡', title: 'Lambda',            sub: 'event processor',  color: '#a78bfa' }, { parentId: 'events-group' }),
    mkNode('db-upd',  570, 40, { icon: '🗄️', title: 'Update DB',         sub: 'suppress list',    color: '#34d399' }, { parentId: 'events-group' }),

    // Bottom label
    mkLabel('lbl', 100, 490, { label: 'DKIM + DMARC = deliverability; bounce rate >5% = account suspension', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Send path
    mkEdge('e-app-api',   'app',      'ses-api',  { color: '#4db0c9', labelText: 'sendEmail()' }),
    mkEdge('e-api-dkim',  'ses-api',  'dkim',     { color: '#34d399' }),
    mkEdge('e-dkim-ip',   'dkim',     'ip-rep',   { color: '#34d399' }),
    mkEdge('e-ip-suppr',  'ip-rep',   'suppr',    { color: '#f87171', dashed: true }),
    mkEdge('e-dkim-mta',  'dkim',     'mta',      { color: '#4db0c9', labelText: 'deliver' }),

    // Event feedback loops
    mkEdge('e-mta-bounce',    'mta',     'bounce',   { color: '#f87171', dashed: true }),
    mkEdge('e-mta-complaint', 'mta',     'complaint',{ color: '#f87171', dashed: true }),
    mkEdge('e-bounce-sns',    'bounce',  'sns',      { color: '#f59e0b' }),
    mkEdge('e-comp-sns',      'complaint','sns',     { color: '#f59e0b' }),
    mkEdge('e-sns-lam',       'sns',     'lambda',   { color: '#a78bfa' }),
    mkEdge('e-lam-db',        'lambda',  'db-upd',   { color: '#34d399' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
