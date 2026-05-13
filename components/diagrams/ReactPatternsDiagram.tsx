'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function ReactPatternsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Compound Component
    mkGroup('grp-compound', 0, 0, 820, 140, { label: 'Compound Component Pattern', color: '#6366f1' }),
    mkNode('tabs-parent', 20, 45, { icon: '📂', title: 'Tabs (Parent)', sub: 'Creates context with active tab state', color: '#6366f1', badge: 'provider' }),
    mkNode('tab-list', 260, 35, { icon: '📋', title: 'Tab.List', sub: 'Consumes context', color: '#38bdf8', badge: 'consumer' }),
    mkNode('tab-tab', 440, 35, { icon: '🔖', title: 'Tab.Tab', sub: 'Consumes context — sets active', color: '#38bdf8', badge: 'consumer' }),
    mkNode('tab-panel', 620, 35, { icon: '🖼️', title: 'Tab.Panel', sub: 'Shows content for active tab', color: '#38bdf8', badge: 'consumer' }),

    // HOC
    mkGroup('grp-hoc', 0, 170, 820, 140, { label: 'Higher-Order Component (HOC) Pattern', color: '#f97316' }),
    mkNode('with-auth', 20, 215, { icon: '🔐', title: 'withAuth(Component)', sub: 'Wraps any component with auth check', color: '#f97316', badge: 'HOC factory' }),
    mkNode('hoc-check', 260, 215, { icon: '🔍', title: 'Auth Check', sub: 'Is user authenticated?', color: '#dc2626', badge: 'guard logic' }),
    mkNode('hoc-render', 470, 215, { icon: '✅', title: 'Render Component', sub: 'Passes all props through', color: '#10b981', badge: 'authenticated' }),
    mkNode('hoc-redirect', 630, 215, { icon: '↩️', title: 'Redirect', sub: 'Navigate to /login', color: '#dc2626', badge: 'unauthenticated' }),

    // Error Boundary
    mkGroup('grp-error', 0, 340, 820, 140, { label: 'Error Boundary Pattern', color: '#dc2626' }),
    mkNode('err-boundary', 20, 385, { icon: '🛡️', title: 'Error Boundary', sub: 'Class component only — hooks cannot catch render errors', color: '#dc2626', badge: 'class component required', pills: [{ label: 'getDerivedStateFromError', color: '#64748b' }] }),
    mkNode('err-subtree', 260, 385, { icon: '🌲', title: 'Child Subtree', sub: 'Any render error bubbles up', color: '#f97316', badge: 'catches render errors' }),
    mkNode('err-fallback', 520, 385, { icon: '🚨', title: 'Fallback UI', sub: 'Show error state instead of blank screen', color: '#10b981', badge: 'graceful degradation' }),

    // Portal
    mkGroup('grp-portal', 0, 510, 820, 140, { label: 'Portal Pattern', color: '#a78bfa' }),
    mkNode('portal-node', 20, 555, { icon: '🚪', title: 'ReactDOM.createPortal', sub: 'Renders children outside parent DOM node', color: '#a78bfa', badge: 'escape hatch', pills: [{ label: 'event bubbling still works', color: '#64748b' }] }),
    mkNode('modal', 280, 555, { icon: '💬', title: 'Modal / Dialog', sub: 'Rendered at document.body', color: '#38bdf8', badge: 'z-index safe' }),
    mkNode('tooltip', 480, 555, { icon: '💭', title: 'Tooltip', sub: 'Rendered outside overflow:hidden parent', color: '#38bdf8', badge: 'overflow safe' }),

    // Bottom label
    mkLabel('lbl', 80, 675, { label: 'Prefer custom hooks over HOCs and render props for logic reuse — simpler and composable', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Compound component
    mkEdge('e-tp-tl', 'tabs-parent', 'tab-list', { color: '#6366f1', labelText: 'context' }),
    mkEdge('e-tp-tt', 'tabs-parent', 'tab-tab', { color: '#6366f1' }),
    mkEdge('e-tp-tpn', 'tabs-parent', 'tab-panel', { color: '#6366f1' }),

    // HOC
    mkEdge('e-wa-hc', 'with-auth', 'hoc-check', { color: '#f97316', labelText: 'checks' }),
    mkEdge('e-hc-hr', 'hoc-check', 'hoc-render', { color: '#10b981', labelText: 'yes' }),
    mkEdge('e-hc-hrd', 'hoc-check', 'hoc-redirect', { color: '#dc2626', labelText: 'no' }),

    // Error boundary
    mkEdge('e-es-eb', 'err-subtree', 'err-boundary', { color: '#dc2626', labelText: 'error bubbles to' }),
    mkEdge('e-eb-ef', 'err-boundary', 'err-fallback', { color: '#10b981', labelText: 'shows' }),

    // Portal
    mkEdge('e-pn-md', 'portal-node', 'modal', { color: '#a78bfa', labelText: 'renders' }),
    mkEdge('e-pn-tt', 'portal-node', 'tooltip', { color: '#a78bfa' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
