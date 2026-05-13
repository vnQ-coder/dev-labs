'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function OOPAbstractionDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Abstract BaseRepository group
    mkGroup('grp-repo', 0, 0, 720, 180, { label: 'Abstract BaseRepository<T> — data-layer abstraction', color: '#a78bfa' }),
    mkNode('base-repo',   20,  50, { icon: '📦', title: 'BaseRepository<T>',  sub: 'Abstract class',          color: '#a78bfa', badge: 'abstract' }),
    mkNode('abs-find',   260,  30, { icon: '🔍', title: 'findById(id)',        sub: 'abstract method',         color: '#94a3b8', badge: 'abstract' }),
    mkNode('abs-save',   260,  90, { icon: '💾', title: 'save(entity)',        sub: 'abstract method',         color: '#94a3b8', badge: 'abstract' }),
    mkNode('abs-del',    260, 140, { icon: '🗑️', title: 'delete(id)',          sub: 'abstract method',         color: '#94a3b8', badge: 'abstract' }),
    mkNode('user-repo',  500,  40, { icon: '👤', title: 'UserRepository',      sub: 'extends BaseRepository',  color: '#38bdf8', badge: 'concrete' }),
    mkNode('order-repo', 500, 110, { icon: '🛒', title: 'OrderRepository',     sub: 'extends BaseRepository',  color: '#38bdf8', badge: 'concrete' }),

    // Abstract AuthGuard group
    mkGroup('grp-guard', 0, 210, 720, 160, { label: 'Abstract AuthGuard — auth abstraction', color: '#f97316' }),
    mkNode('auth-guard',  20,  265, { icon: '🔒', title: 'AuthGuard',           sub: 'abstract canActivate()', color: '#f97316', badge: 'abstract' }),
    mkNode('abs-validate',220,  265, { icon: '✅', title: 'validateToken()',     sub: 'abstract method',        color: '#94a3b8', badge: 'abstract' }),
    mkNode('jwt-guard',  460,  245, { icon: '🎟️', title: 'JwtGuard',            sub: 'validateToken via JWT',  color: '#10b981', badge: 'concrete' }),
    mkNode('api-guard',  460,  300, { icon: '🔑', title: 'ApiKeyGuard',         sub: 'validateToken via key',  color: '#10b981', badge: 'concrete' }),

    // Controller — only depends on guard interface
    mkGroup('grp-ctrl', 0, 400, 340, 110, { label: 'Controller — program to interfaces', color: '#64748b' }),
    mkNode('ctrl',        20,  450, { icon: '🎮', title: 'Controller',           sub: 'Uses guard interface',   color: '#64748b' }),
    mkNode('can-activate',200, 450, { icon: '🛡️', title: 'canActivate()',        sub: 'Guard interface method', color: '#f97316', badge: 'interface' }),

    mkLabel('lbl', 20, 535, { label: "Controller doesn't know which guard — just calls canActivate()", icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // BaseRepository abstract methods
    mkEdge('e-base-find',  'base-repo', 'abs-find',   { color: '#a78bfa', dashed: true }),
    mkEdge('e-base-save',  'base-repo', 'abs-save',   { color: '#a78bfa', dashed: true }),
    mkEdge('e-base-del',   'base-repo', 'abs-del',    { color: '#a78bfa', dashed: true }),
    // Concrete repo implementations
    mkEdge('e-user-repo',  'user-repo',  'abs-find',  { color: '#38bdf8', labelText: 'implements' }),
    mkEdge('e-order-repo', 'order-repo', 'abs-save',  { color: '#38bdf8', labelText: 'implements' }),

    // AuthGuard abstract validate
    mkEdge('e-guard-val',  'auth-guard', 'abs-validate', { color: '#f97316', dashed: true }),
    mkEdge('e-jwt-val',    'jwt-guard',  'abs-validate', { color: '#10b981', labelText: 'implements' }),
    mkEdge('e-api-val',    'api-guard',  'abs-validate', { color: '#10b981', labelText: 'implements' }),

    // Controller → guard interface only
    mkEdge('e-ctrl-can',   'ctrl', 'can-activate', { color: '#64748b', labelText: 'calls' }),
    mkEdge('e-can-guard',  'can-activate', 'auth-guard', { color: '#f97316', dashed: true, labelText: 'resolves to' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
