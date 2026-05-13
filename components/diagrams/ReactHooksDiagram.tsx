'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function ReactHooksDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Render cycle
    mkGroup('grp-cycle', 0, 0, 700, 110, { label: 'Component Render Cycle', color: '#6366f1' }),
    mkNode('render-start', 20, 35, { icon: '▶️', title: 'Render Start', sub: 'Function component called', color: '#6366f1', badge: 'top of render' }),
    mkNode('hooks-run', 240, 35, { icon: '🪝', title: 'Hooks Execute', sub: 'In declared order, every render', color: '#38bdf8', badge: 'same order always' }),
    mkNode('jsx-return', 480, 35, { icon: '📤', title: 'JSX Returned', sub: 'React renders output', color: '#10b981' }),

    // State hooks
    mkGroup('grp-state', 0, 140, 700, 120, { label: 'State Hooks', color: '#dc2626' }),
    mkNode('use-state', 20, 185, { icon: '📦', title: 'useState', sub: 'Triggers re-render on set call', color: '#dc2626', badge: 'simple state', pills: [{ label: '[value, setter]', color: '#64748b' }] }),
    mkNode('use-reducer', 340, 185, { icon: '🔁', title: 'useReducer', sub: 'Complex state with actions', color: '#f97316', badge: 'complex state', pills: [{ label: 'dispatch(action)', color: '#64748b' }] }),

    // Effect hooks
    mkGroup('grp-effects', 0, 290, 700, 140, { label: 'Effect Hooks', color: '#10b981' }),
    mkNode('use-effect', 20, 335, { icon: '🌀', title: 'useEffect', sub: 'After paint; cleanup on unmount/dep change', color: '#10b981', badge: 'async after paint', pills: [{ label: 'return cleanup', color: '#64748b' }] }),
    mkNode('use-layout', 360, 335, { icon: '🖼️', title: 'useLayoutEffect', sub: 'Sync before browser paint', color: '#f97316', badge: 'before paint — blocks paint' }),

    // Memoization hooks
    mkGroup('grp-memo', 0, 460, 700, 120, { label: 'Memoization Hooks', color: '#a78bfa' }),
    mkNode('use-memo', 20, 505, { icon: '🧠', title: 'useMemo', sub: 'Memoize computed value', color: '#a78bfa', badge: 'expensive calculation', pills: [{ label: 'deps array', color: '#64748b' }] }),
    mkNode('use-callback', 340, 505, { icon: '📌', title: 'useCallback', sub: 'Memoize function reference', color: '#6366f1', badge: 'stable ref for child props' }),

    // Ref hooks
    mkGroup('grp-refs', 0, 610, 700, 120, { label: 'Ref Hooks', color: '#38bdf8' }),
    mkNode('use-ref', 20, 655, { icon: '📎', title: 'useRef', sub: 'Mutable ref, does NOT trigger re-render', color: '#38bdf8', badge: '.current persists', pills: [{ label: 'DOM access', color: '#64748b' }] }),
    mkNode('forward-ref', 340, 655, { icon: '🔗', title: 'forwardRef', sub: 'Forward ref to child component', color: '#64748b', badge: 'expose child DOM' }),

    // Rules of hooks
    mkGroup('grp-rules', 0, 760, 820, 110, { label: 'Rules of Hooks — Enforced by Linter', color: '#dc2626' }),
    mkNode('rule1', 20, 800, { icon: '🚫', title: 'No Conditions / Loops', sub: 'Hooks must be called unconditionally', color: '#dc2626', badge: 'same order every render' }),
    mkNode('rule2', 360, 800, { icon: '⚛️', title: 'Only in React Functions', sub: 'Not in plain JS, class components', color: '#f97316', badge: 'components or custom hooks' }),
    mkNode('rule3', 640, 800, { icon: '🔢', title: 'Order Matters', sub: 'React tracks hooks by call order', color: '#6366f1', badge: 'linked list internally' }),

    // Bottom label
    mkLabel('lbl', 80, 890, { label: 'Hooks replace class lifecycle methods — simpler mental model, composable logic', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Render cycle
    mkEdge('e-rs-hr', 'render-start', 'hooks-run', { color: '#6366f1', labelText: 'runs hooks' }),
    mkEdge('e-hr-jr', 'hooks-run', 'jsx-return', { color: '#38bdf8', labelText: 'then returns' }),

    // State hooks connection
    mkEdge('e-us-ur', 'use-state', 'use-reducer', { color: '#f97316', labelText: 'or use for complex' }),

    // Effects comparison
    mkEdge('e-ue-ul', 'use-effect', 'use-layout', { color: '#10b981', labelText: 'vs sync version' }),

    // Memo hooks
    mkEdge('e-um-uc', 'use-memo', 'use-callback', { color: '#a78bfa', labelText: 'fn version of' }),

    // Ref connection
    mkEdge('e-ur-fr', 'use-ref', 'forward-ref', { color: '#38bdf8', labelText: 'exposed via' }),

    // Rules
    mkEdge('e-r1-r2', 'rule1', 'rule2', { color: '#dc2626' }),
    mkEdge('e-r2-r3', 'rule2', 'rule3', { color: '#f97316' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
