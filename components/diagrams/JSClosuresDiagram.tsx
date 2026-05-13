'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function JSClosuresDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Scope chain group
    mkGroup('grp-scope', 0, 0, 700, 160, { label: 'Scope Chain — Lexical Environment', color: '#6366f1' }),
    mkNode('global',   20,  40, { icon: '🌍', title: 'Global Scope',       sub: 'var x, functions',                    color: '#64748b', badge: 'outermost' }),
    mkNode('outer',   230,  40, { icon: '📦', title: 'Outer Function Scope', sub: 'let count = 0 (captured)',           color: '#f97316', badge: 'execution context' }),
    mkNode('inner',   470,  40, { icon: '🔒', title: 'Inner Function',      sub: 'closes over outer scope',             color: '#6366f1', badge: 'closure' }),
    mkNode('lexenv',  230, 105, { icon: '🗺️', title: 'Lexical Environment', sub: '{ count: 0 } → persists after outer returns', color: '#a78bfa' }),

    // Module pattern group
    mkGroup('grp-module', 0, 195, 700, 150, { label: 'Module Pattern — IIFE + Closure', color: '#10b981' }),
    mkNode('iife',     20, 245, { icon: '⚡', title: 'IIFE',               sub: '(function(){ ... })()',                color: '#f97316', badge: 'immediately invoked' }),
    mkNode('private',  230, 245, { icon: '🔐', title: 'Private State',      sub: 'let _count = 0 (hidden)',              color: '#dc2626', badge: 'not accessible outside' }),
    mkNode('pubapi',   490, 245, { icon: '📤', title: 'Public API',         sub: 'returned { increment, get }',          color: '#10b981', badge: 'exposed interface' }),
    mkNode('caller',   490, 320, { icon: '💻', title: 'Caller Code',        sub: 'api.increment() → _count++',           color: '#64748b' }),

    // Label
    mkLabel('lbl', 60, 365, { label: 'Closure = function + its lexical scope (variables captured at definition time)', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Scope chain
    mkEdge('e-gl-out', 'global', 'outer',   { color: '#f97316', labelText: 'outer defined in' }),
    mkEdge('e-out-in', 'outer',  'inner',   { color: '#6366f1', labelText: 'inner defined inside' }),
    mkEdge('e-out-lex','outer',  'lexenv',  { color: '#a78bfa', dashed: true, labelText: 'creates env' }),
    mkEdge('e-in-lex', 'inner',  'lexenv',  { color: '#a78bfa', dashed: true, labelText: 'retains ref' }),

    // Module pattern
    mkEdge('e-iife-prv','iife',   'private', { color: '#dc2626', labelText: 'declares' }),
    mkEdge('e-iife-pub','iife',   'pubapi',  { color: '#10b981', labelText: 'returns' }),
    mkEdge('e-prv-pub', 'private','pubapi',  { color: '#10b981', dashed: true, labelText: 'closed over' }),
    mkEdge('e-pub-cal', 'pubapi', 'caller',  { color: '#64748b', labelText: 'call methods' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
