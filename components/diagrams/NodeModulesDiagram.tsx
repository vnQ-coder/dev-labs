'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NodeModulesDiagram() {
  const nodes: Node[] = useMemo(() => [
    // CommonJS group
    mkGroup('grp-cjs', 0, 0, 860, 150, { label: 'CommonJS (CJS) — require() at Runtime', color: '#f97316' }),
    mkNode('require',     20,  50, { icon: '📥', title: "require('mod')",        sub: 'called at runtime, dynamic',    color: '#f97316', badge: 'synchronous' }),
    mkNode('cache',      210,  50, { icon: '🗃️', title: 'Module Cache',          sub: 'require.cache[filename]',       color: '#ea580c', badge: 'check first' }),
    mkNode('cjsload',    410,  50, { icon: '📂', title: 'Load & Execute File',   sub: 'wrap in function, run',         color: '#dc2626', badge: 'cache miss only' }),
    mkNode('cjsexport',  620,  50, { icon: '📤', title: 'module.exports',        sub: 'VALUE COPY returned to caller', color: '#f97316',
      badge: 'snapshot at require time',
      pills: [{ label: 'value copy — not live', color: '#b45309' }],
    }),

    // ES Modules group
    mkGroup('grp-esm', 0, 175, 860, 165, { label: 'ES Modules (ESM) — Static import at Parse Time', color: '#3b82f6' }),
    mkNode('staticimport',20, 225, { icon: '🔍', title: 'static import',          sub: 'parsed before execution',      color: '#3b82f6', badge: 'top of file only' }),
    mkNode('modrecord',  220, 225, { icon: '📋', title: 'Module Record',          sub: 'dependency graph built',       color: '#6366f1' }),
    mkNode('linkphase',  420, 225, {
      icon: '🔗',
      title: 'Link Phase',
      sub: 'bindings created (not values)',
      color: '#8b5cf6',
      badge: 'before eval',
    }),
    mkNode('evalphase',  620, 225, {
      icon: '▶️',
      title: 'Evaluate Phase',
      sub: 'code runs, bindings filled',
      color: '#a78bfa',
    }),
    mkNode('livebind',   420, 315, {
      icon: '⚡',
      title: 'Live Bindings',
      sub: 'always reflect current value',
      color: '#3b82f6',
      badge: 'not a copy',
      pills: [{ label: 'live — reflects updates', color: '#1d4ed8' }],
    }),

    // Circular dependency group
    mkGroup('grp-circular', 0, 365, 860, 130, { label: 'Circular Dependency Behavior', color: '#dc2626' }),
    mkNode('cjscirc',    20, 410, {
      icon: '🔴',
      title: 'CJS circular',
      sub: 'gets incomplete object (partially executed exports)',
      color: '#dc2626',
      badge: 'partial object',
    }),
    mkNode('esmcirc',    390, 410, {
      icon: '🟡',
      title: 'ESM circular',
      sub: 'live binding exists but may be undefined initially',
      color: '#eab308',
      badge: 'undefined initially',
    }),

    // Label
    mkLabel('lbl', 60, 515, { label: 'ESM live bindings vs CJS value copies — key difference for circular deps and tree-shaking', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // CJS flow
    mkEdge('e-req-cac',  'require',     'cache',       { color: '#ea580c', labelText: 'check cache' }),
    mkEdge('e-cac-load', 'cache',       'cjsload',     { color: '#dc2626', labelText: 'cache miss → load' }),
    mkEdge('e-load-exp', 'cjsload',     'cjsexport',   { color: '#f97316', labelText: 'cache + return' }),
    mkEdge('e-cac-exp',  'cache',       'cjsexport',   { color: '#f97316', dashed: true, labelText: 'cache hit → return' }),

    // ESM flow
    mkEdge('e-imp-mr',   'staticimport','modrecord',   { color: '#6366f1', labelText: 'parse phase' }),
    mkEdge('e-mr-lnk',   'modrecord',   'linkphase',   { color: '#8b5cf6', labelText: 'link phase' }),
    mkEdge('e-lnk-ev',   'linkphase',   'evalphase',   { color: '#a78bfa', labelText: 'evaluate' }),
    mkEdge('e-ev-lb',    'evalphase',   'livebind',    { color: '#3b82f6', dashed: true, labelText: 'fills bindings' }),
    mkEdge('e-lnk-lb',   'linkphase',   'livebind',    { color: '#3b82f6', dashed: true, labelText: 'creates refs' }),

    // Circular comparison
    mkEdge('e-cjsc-ec',  'cjscirc',    'esmcirc',     { color: '#64748b', dashed: true, labelText: 'vs ESM' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
