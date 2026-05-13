'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function OOPEncapsulationDiagram() {
  const nodes: Node[] = useMemo(() => [
    // BAD group — no encapsulation
    mkGroup('grp-bad', 0, 0, 680, 160, { label: 'BAD — No Encapsulation', color: '#ef4444' }),
    mkNode('bad-ctrl',    20,  50, { icon: '🎮', title: 'Controller',       sub: 'Handles request',          color: '#ef4444' }),
    mkNode('bad-user',   230,  50, { icon: '👤', title: 'user.password',    sub: 'Direct field access',      color: '#f97316', badge: 'exposed' }),
    mkNode('bad-db',     420,  50, { icon: '🗄️', title: 'user.db',          sub: 'Direct DB access',         color: '#f97316', badge: 'exposed' }),
    mkNode('bad-bcrypt', 230, 105, { icon: '🔐', title: 'bcrypt.hash()',    sub: 'Inline in controller',     color: '#f97316', badge: 'exposed' }),

    // GOOD group — encapsulated
    mkGroup('grp-good', 0, 200, 740, 200, { label: 'GOOD — Encapsulated', color: '#10b981' }),
    mkNode('good-ctrl',   20,  260, { icon: '🎮', title: 'Controller',       sub: 'Calls public API only',   color: '#10b981' }),
    mkNode('good-svc',   240,  260, { icon: '🛡️', title: 'UserService',      sub: 'Public API boundary',     color: '#f472b6', badge: '@Injectable()' }),
    mkNode('priv-hash',  480,  230, { icon: '🔒', title: 'hashPassword()',   sub: 'private method',          color: '#94a3b8', badge: 'hidden' }),
    mkNode('priv-repo',  480,  285, { icon: '🔒', title: 'userRepository',   sub: 'private dependency',      color: '#94a3b8', badge: 'hidden' }),
    mkNode('priv-log',   480,  340, { icon: '🔒', title: 'logger',           sub: 'private dependency',      color: '#94a3b8', badge: 'hidden' }),

    // Label
    mkLabel('lbl', 60, 420, { label: 'NestJS: @Injectable() service encapsulates all user logic', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // BAD — controller reaches into internals directly
    mkEdge('e-bad-user',   'bad-ctrl', 'bad-user',   { color: '#ef4444', labelText: 'direct access' }),
    mkEdge('e-bad-db',     'bad-ctrl', 'bad-db',     { color: '#ef4444', labelText: 'direct access' }),
    mkEdge('e-bad-bcrypt', 'bad-ctrl', 'bad-bcrypt', { color: '#ef4444', labelText: 'inline call' }),

    // GOOD — controller only sees public service API
    mkEdge('e-good-svc',  'good-ctrl', 'good-svc',  { color: '#10b981', labelText: 'public method' }),
    // Service owns all internals — dashed to show private
    mkEdge('e-svc-hash',  'good-svc', 'priv-hash',  { color: '#94a3b8', dashed: true }),
    mkEdge('e-svc-repo',  'good-svc', 'priv-repo',  { color: '#94a3b8', dashed: true }),
    mkEdge('e-svc-log',   'good-svc', 'priv-log',   { color: '#94a3b8', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
