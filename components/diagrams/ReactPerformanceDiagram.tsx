'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function ReactPerformanceDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Decision tree group
    mkGroup('grp-tree', 0, 0, 1000, 220, { label: 'Re-render Decision Tree', color: '#6366f1' }),
    mkNode('unnecessary', 20, 50, { icon: '⚠️', title: 'Unnecessary Re-render?', sub: 'Component updates without prop/state change', color: '#dc2626', badge: 'diagnose first' }),
    mkNode('react-memo', 230, 50, { icon: '🧠', title: 'React.memo', sub: 'Shallow prop comparison — skips re-render', color: '#10b981', badge: 'pure component' }),
    mkNode('still-rerender', 480, 50, { icon: '🔍', title: 'Still Re-rendering?', sub: 'Check parent passing new reference', color: '#f97316', badge: 'reference equality' }),
    mkNode('new-obj', 680, 50, { icon: '🆕', title: 'New Object/Array', sub: 'Parent creates {} or [] each render', color: '#dc2626', badge: 'referential inequality' }),
    mkNode('fix-memo', 860, 50, { icon: '✅', title: 'useMemo / useCallback', sub: 'Stable reference across renders', color: '#10b981', badge: 'fix' }),

    mkNode('devtools', 20, 130, { icon: '🔬', title: 'React DevTools', sub: 'Profiler → flame graph', color: '#6366f1', badge: 'find expensive renders', pills: [{ label: 'highlight updates', color: '#38bdf8' }] }),
    mkNode('flame', 260, 130, { icon: '🔥', title: 'Flame Graph', sub: 'Width = render time, color = cost', color: '#f97316', badge: 'identify bottleneck' }),

    // Code splitting group
    mkGroup('grp-split', 0, 250, 700, 130, { label: 'Code Splitting', color: '#a78bfa' }),
    mkNode('react-lazy', 20, 295, { icon: '📦', title: 'React.lazy', sub: 'Dynamic import at route level', color: '#a78bfa', badge: 'bundle split point', pills: [{ label: 'reduces initial bundle', color: '#64748b' }] }),
    mkNode('suspense', 260, 295, { icon: '⏳', title: 'Suspense', sub: 'Shows fallback while chunk loads', color: '#38bdf8', badge: 'loading fallback' }),
    mkNode('split-result', 480, 295, { icon: '📉', title: 'Smaller Bundle', sub: 'JS loaded on demand per route', color: '#10b981', badge: 'faster initial load' }),

    // Virtualization group
    mkGroup('grp-virt', 0, 410, 700, 140, { label: 'Virtualization', color: '#f97316' }),
    mkNode('big-list', 20, 455, { icon: '📜', title: '10,000 Item List', sub: 'Render all → 10k DOM nodes → slow', color: '#dc2626', badge: 'performance problem' }),
    mkNode('react-window', 240, 455, { icon: '🪟', title: 'react-window', sub: 'Only renders visible items (windowing)', color: '#f97316', badge: 'virtual list' }),
    mkNode('virt-result', 480, 455, { icon: '⚡', title: '~20 DOM nodes', sub: 'Regardless of list length', color: '#10b981', badge: 'O(viewport) not O(list)' }),

    // Bottom label
    mkLabel('lbl', 80, 575, { label: 'Profile first — optimize only proven bottlenecks. React.memo without profiling is premature', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Decision tree
    mkEdge('e-un-rm', 'unnecessary', 'react-memo', { color: '#10b981', labelText: 'wrap with' }),
    mkEdge('e-rm-sr', 'react-memo', 'still-rerender', { color: '#f97316', labelText: 'still happens?' }),
    mkEdge('e-sr-no', 'still-rerender', 'new-obj', { color: '#dc2626', labelText: 'parent creates' }),
    mkEdge('e-no-fm', 'new-obj', 'fix-memo', { color: '#10b981', labelText: 'fix with' }),

    // DevTools
    mkEdge('e-dt-fl', 'devtools', 'flame', { color: '#f97316', labelText: 'produces' }),

    // Code splitting
    mkEdge('e-rl-su', 'react-lazy', 'suspense', { color: '#38bdf8', labelText: 'wrapped by' }),
    mkEdge('e-su-sr', 'suspense', 'split-result', { color: '#10b981', labelText: 'results in' }),

    // Virtualization
    mkEdge('e-bl-rw', 'big-list', 'react-window', { color: '#f97316', labelText: 'use' }),
    mkEdge('e-rw-vr', 'react-window', 'virt-result', { color: '#10b981', labelText: 'renders only' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
