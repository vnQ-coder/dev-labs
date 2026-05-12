'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AWSWAFDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Incoming request
    mkNode('req', 0, 160, { icon: '🌐', title: 'Incoming Request', sub: 'HTTP/HTTPS', color: '#4db0c9' }),

    // Web ACL group
    mkGroup('acl-group', 180, 0, 280, 360, { label: 'Web ACL', sub: 'Rules evaluated in priority order', color: '#4db0c9' }),
    mkNode('rule1', 40, 40,  { icon: '🚫', title: 'Rule 1: IP Reputation', sub: 'Known bad IPs',     color: '#f87171', badge: 'Block ✗' }, { parentId: 'acl-group' }),
    mkNode('rule2', 40, 110, { icon: '⏱️', title: 'Rule 2: Rate Limit',   sub: '100 req / 5 min',   color: '#f59e0b', badge: 'Block ✗' }, { parentId: 'acl-group' }),
    mkNode('rule3', 40, 180, { icon: '💉', title: 'Rule 3: SQLi Match',   sub: 'SQL injection',      color: '#f87171', badge: 'Block ✗' }, { parentId: 'acl-group' }),
    mkNode('rule4', 40, 250, { icon: '🕸️', title: 'Rule 4: XSS Match',   sub: 'Cross-site script',  color: '#f87171', badge: 'Block ✗' }, { parentId: 'acl-group' }),

    // Default allow
    mkNode('allow', 500, 160, { icon: '✅', title: 'Default: Allow', sub: 'No rule matched', color: '#34d399', badge: 'Allow ✓' }),

    // Right: CDN / ALB / APIGW → Origin
    mkNode('cdn',    680, 80,  { icon: '🌩️', title: 'CloudFront / ALB / API GW', sub: 'WAF attachment point', color: '#4db0c9' }),
    mkNode('origin', 680, 260, { icon: '🖥️', title: 'Origin',                   sub: 'Your backend',         color: '#a78bfa' }),

    // Block sink
    mkNode('block', 500, 340, { icon: '🚫', title: 'Blocked', sub: '403 Forbidden', color: '#f87171' }),

    // CloudWatch Logs
    mkNode('cw', 340, 400, { icon: '📋', title: 'CloudWatch Logs', sub: 'all rule decisions', color: '#64748b', badge: 'audit' }),

    // Bottom label
    mkLabel('lbl', 100, 480, { label: 'Rules evaluated in priority order — first match wins', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Request enters Web ACL
    mkEdge('e-req-r1',   'req',   'rule1', { color: '#4db0c9' }),
    mkEdge('e-r1-r2',    'rule1', 'rule2', { color: '#4db0c9', labelText: 'pass' }),
    mkEdge('e-r2-r3',    'rule2', 'rule3', { color: '#4db0c9', labelText: 'pass' }),
    mkEdge('e-r3-r4',    'rule3', 'rule4', { color: '#4db0c9', labelText: 'pass' }),
    mkEdge('e-r4-allow', 'rule4', 'allow', { color: '#34d399', labelText: 'pass' }),

    // Block paths from each rule
    mkEdge('e-r1-blk', 'rule1', 'block', { color: '#f87171', dashed: true, labelText: 'match → block' }),
    mkEdge('e-r2-blk', 'rule2', 'block', { color: '#f87171', dashed: true }),
    mkEdge('e-r3-blk', 'rule3', 'block', { color: '#f87171', dashed: true }),
    mkEdge('e-r4-blk', 'rule4', 'block', { color: '#f87171', dashed: true }),

    // Allowed → CDN → Origin
    mkEdge('e-allow-cdn',    'allow',  'cdn',    { color: '#34d399' }),
    mkEdge('e-cdn-origin',   'cdn',    'origin', { color: '#a78bfa' }),

    // CloudWatch captures all
    mkEdge('e-acl-cw',   'allow', 'cw', { color: '#64748b', dashed: true, animated: false }),
    mkEdge('e-blk-cw',   'block', 'cw', { color: '#64748b', dashed: true, animated: false }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
