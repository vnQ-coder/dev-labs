'use client';

import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('browser',  0,   100, { icon: '🌐', title: 'Browser',            sub: 'Types: google.com',           color: '#38bdf8', badge: 'Step 1: check local cache' }),
  mkNode('os-cache', 180, 100, { icon: '💾', title: 'OS DNS Cache',        sub: 'Checks /etc/hosts',            color: '#38bdf8', badge: '~0ms if cached',               pills: [{ label: 'TTL-aware caching', color: '#64748b' }] }),
  mkNode('resolver', 380, 100, { icon: '🔍', title: 'Recursive Resolver',  sub: 'ISP / 8.8.8.8 / 1.1.1.1',    color: '#a78bfa', badge: 'Iterative query on your behalf', pills: [{ label: 'Caches responses', color: '#64748b' }] }),
  mkNode('root-ns',  580, 0,   { icon: '🌍', title: 'Root Nameserver',     sub: '13 root servers (anycast)',   color: '#f59e0b', badge: 'Knows TLD locations' }),
  mkNode('tld-ns',   580, 200, { icon: '📋', title: '.com TLD Server',     sub: 'Verisign manages .com',       color: '#f59e0b', badge: 'Knows authoritative NS' }),
  mkNode('auth-ns',  780, 100, { icon: '📖', title: 'Authoritative NS',    sub: 'ns1.google.com',              color: '#34d399', badge: 'Has final A record',              pills: [{ label: 'google.com → 142.250.80.46', color: '#34d399' }, { label: 'TTL: 300s', color: '#64748b' }] }),
  mkNode('ip-resp',  980, 100, { icon: '✅', title: 'IP Returned',         sub: '142.250.80.46',               color: '#34d399', badge: 'Browser connects to server',      pills: [{ label: 'Total time: ~50-200ms (cold)', color: '#64748b' }, { label: 'Cached: ~0ms', color: '#34d399' }] }),

  mkLabel('lbl1', 80,  220, { label: '1. Check local cache',       color: '#64748b' }),
  mkLabel('lbl2', 260, 220, { label: '2. OS cache / hosts',        color: '#64748b' }),
  mkLabel('lbl3', 460, 220, { label: '3. Ask resolver',            color: '#64748b' }),
  mkLabel('lbl4', 680, 270, { label: '4-5. Iterative NS lookup',   color: '#64748b' }),
  mkLabel('lbl6', 880, 220, { label: '6. Return IP',               color: '#34d399' }),
];

const edges: Edge[] = [
  mkEdge('e-br-os',    'browser',  'os-cache', { color: '#38bdf8', labelText: 'miss' }),
  mkEdge('e-os-res',   'os-cache', 'resolver', { color: '#a78bfa', labelText: 'miss' }),
  mkEdge('e-res-root', 'resolver', 'root-ns',  { color: '#f59e0b', labelText: 'who handles .com?' }),
  mkEdge('e-res-tld',  'resolver', 'tld-ns',   { color: '#f59e0b', labelText: 'who is auth for google?' }),
  mkEdge('e-res-auth', 'resolver', 'auth-ns',  { color: '#34d399', labelText: 'what is google.com IP?' }),
  mkEdge('e-auth-ip',  'auth-ns',  'ip-resp',  { color: '#34d399' }),
];

export default function DNSDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
