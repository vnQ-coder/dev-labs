'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function JSThisDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Default binding group
    mkGroup('grp-default', 0, 0, 330, 110, { label: 'Default Binding', color: '#64748b' }),
    mkNode('standalone',  20,  40, { icon: '📞', title: 'standalone call',  sub: 'foo()',                              color: '#64748b', badge: 'non-strict' }),
    mkNode('defglobal',  200,  40, { icon: '🌍', title: 'this = global',    sub: 'undefined in strict mode',           color: '#94a3b8', badge: 'globalThis' }),

    // Implicit binding group
    mkGroup('grp-implicit', 345, 0, 330, 110, { label: 'Implicit Binding', color: '#3b82f6' }),
    mkNode('objcall',    365,  40, { icon: '🏠', title: 'obj.method()',     sub: 'method called on object',            color: '#3b82f6', badge: 'call site' }),
    mkNode('impthis',    540,  40, { icon: '🎯', title: 'this = obj',       sub: 'the object before the dot',          color: '#1d4ed8' }),

    // Explicit binding group
    mkGroup('grp-explicit', 0, 140, 330, 120, { label: 'Explicit Binding', color: '#f97316' }),
    mkNode('explicit',    20, 185, { icon: '📌', title: '.call / .apply / .bind', sub: 'fn.call(ctx, args)',           color: '#f97316', badge: 'explicit' }),
    mkNode('expthis',    200, 185, { icon: '🎯', title: 'this = ctx',       sub: 'whatever you pass in',               color: '#ea580c' }),

    // New binding group
    mkGroup('grp-new', 345, 140, 330, 120, { label: 'new Binding', color: '#10b981' }),
    mkNode('newcall',    365, 185, { icon: '🆕', title: 'new Constructor()', sub: 'creates fresh object',              color: '#10b981', badge: 'highest priority' }),
    mkNode('newthis',    540, 185, { icon: '🎯', title: 'this = new obj',   sub: 'the newly created instance',         color: '#059669' }),

    // Arrow function group
    mkGroup('grp-arrow', 0, 285, 680, 120, { label: 'Arrow Functions — Lexical this', color: '#a78bfa' }),
    mkNode('arrowfn',    20, 330, {
      icon: '➡️',
      title: 'Arrow Function',
      sub: '() => { … }',
      color: '#a78bfa',
      badge: 'no own this',
      pills: [{ label: 'cannot .call/.bind/.apply to change this', color: '#7c3aed' }],
    }),
    mkNode('enclosing',  350, 330, { icon: '📦', title: 'Enclosing Scope this', sub: 'captured at definition time',   color: '#6366f1', badge: 'lexical' }),

    // Label
    mkLabel('lbl', 60, 425, { label: "Arrow functions don't have their own 'this' — they inherit from enclosing scope", icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Default
    mkEdge('e-std-dg',  'standalone', 'defglobal',  { color: '#64748b', labelText: 'this resolves to' }),

    // Implicit
    mkEdge('e-obj-imp', 'objcall',    'impthis',    { color: '#3b82f6', labelText: 'this resolves to' }),

    // Explicit
    mkEdge('e-exp-et',  'explicit',   'expthis',    { color: '#f97316', labelText: 'this = first arg' }),

    // New
    mkEdge('e-new-nt',  'newcall',    'newthis',    { color: '#10b981', labelText: 'this resolves to' }),

    // Arrow
    mkEdge('e-arr-enc', 'arrowfn',    'enclosing',  { color: '#a78bfa', labelText: 'inherits from' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
