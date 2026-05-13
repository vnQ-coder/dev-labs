'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function ReactVirtualDOMDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Trigger group
    mkGroup('grp-trigger', 0, 0, 620, 110, { label: 'State Change Triggers Re-render', color: '#6366f1' }),
    mkNode('state-change', 20, 35, { icon: '🔄', title: 'State Change', sub: 'setState / dispatch', color: '#6366f1', badge: 'trigger' }),
    mkNode('re-render', 240, 35, { icon: '⚛️', title: 'React Re-renders', sub: 'Component function called', color: '#38bdf8', badge: 'reconciliation' }),
    mkNode('new-vdom', 460, 35, { icon: '🌳', title: 'New VDOM Tree', sub: 'JS object representation', color: '#10b981' }),

    // VDOM Diff group
    mkGroup('grp-diff', 0, 140, 820, 160, { label: 'Virtual DOM Diffing (Reconciliation)', color: '#f97316' }),
    mkNode('prev-vdom', 20, 185, { icon: '📄', title: 'Previous VDOM', sub: '<div><span>A</span></div>', color: '#64748b', badge: 'before' }),
    mkNode('next-vdom', 240, 185, { icon: '📄', title: 'Next VDOM', sub: '<div><span>B</span></div>', color: '#10b981', badge: 'after' }),
    mkNode('changed-node', 480, 185, { icon: '✏️', title: 'Changed Node', sub: 'Only span text changed', color: '#f97316', badge: 'highlighted diff', pills: [{ label: 'O(n) diff', color: '#6366f1' }] }),
    mkNode('dom-patch', 680, 185, { icon: '🔧', title: 'Minimal DOM Patch', sub: 'Only changed nodes updated', color: '#10b981', badge: 'efficient' }),

    // Fiber group
    mkGroup('grp-fiber', 0, 330, 820, 140, { label: 'Fiber Work Loop', color: '#a78bfa' }),
    mkNode('render-phase', 20, 375, { icon: '🔀', title: 'Render Phase', sub: 'Build new fiber tree', color: '#a78bfa', badge: 'async / interruptible', pills: [{ label: 'can pause', color: '#6366f1' }] }),
    mkNode('commit-phase', 280, 375, { icon: '✅', title: 'Commit Phase', sub: 'Apply mutations to DOM', color: '#dc2626', badge: 'synchronous — no pause', pills: [{ label: 'mutate DOM', color: '#dc2626' }] }),
    mkNode('effects', 550, 375, { icon: '🎯', title: 'Layout Effects', sub: 'useLayoutEffect fires', color: '#f97316', badge: 'after commit' }),

    // Key prop group
    mkGroup('grp-keys', 0, 500, 820, 140, { label: 'key Prop — Correct List Diffing', color: '#10b981' }),
    mkNode('no-key', 20, 545, { icon: '❌', title: 'Without key', sub: 'React reuses by index — wrong order', color: '#dc2626', badge: 'incorrect reuse' }),
    mkNode('with-key', 300, 545, { icon: '✅', title: 'With key', sub: 'React matches by stable identity', color: '#10b981', badge: 'correct mapping' }),
    mkNode('key-rule', 560, 545, { icon: '🔑', title: 'key Rule', sub: 'Use stable ID, not array index', color: '#6366f1', badge: 'best practice' }),

    // Bottom label
    mkLabel('lbl', 80, 660, { label: 'Render phase is async/interruptible; Commit phase is synchronous', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Trigger flow
    mkEdge('e-sc-rr', 'state-change', 're-render', { color: '#6366f1', labelText: 'triggers' }),
    mkEdge('e-rr-nv', 're-render', 'new-vdom', { color: '#38bdf8', labelText: 'builds' }),

    // Diff flow
    mkEdge('e-pv-cn', 'prev-vdom', 'changed-node', { color: '#f97316', labelText: 'diff vs' }),
    mkEdge('e-nv-cn', 'next-vdom', 'changed-node', { color: '#10b981', dashed: true }),
    mkEdge('e-cn-dp', 'changed-node', 'dom-patch', { color: '#10b981', labelText: 'produces' }),
    mkEdge('e-vdom-diff', 'new-vdom', 'prev-vdom', { color: '#f97316', dashed: true, labelText: 'compare' }),

    // Fiber flow
    mkEdge('e-rp-cp', 'render-phase', 'commit-phase', { color: '#a78bfa', labelText: 'then' }),
    mkEdge('e-cp-ef', 'commit-phase', 'effects', { color: '#f97316', labelText: 'fires' }),

    // Key flow
    mkEdge('e-nk-wk', 'no-key', 'with-key', { color: '#10b981', labelText: 'vs' }),
    mkEdge('e-wk-kr', 'with-key', 'key-rule', { color: '#6366f1', labelText: 'follow' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
