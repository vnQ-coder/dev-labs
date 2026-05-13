'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function ReactStateDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Spectrum label
    mkGroup('grp-spectrum', 0, 0, 1060, 170, { label: 'State Management Spectrum — Left to Right by Scale', color: '#6366f1' }),
    mkNode('use-state', 20, 40, { icon: '📦', title: 'useState', sub: 'Single component', color: '#10b981', badge: 'local simple', pills: [{ label: 'component scope', color: '#64748b' }] }),
    mkNode('use-reducer', 240, 40, { icon: '🔁', title: 'useReducer', sub: 'Complex local state', color: '#38bdf8', badge: 'local complex', pills: [{ label: 'actions + reducer', color: '#64748b' }] }),
    mkNode('context', 460, 40, { icon: '🌐', title: 'Context API', sub: 'Global — causes all consumers to re-render', color: '#f97316', badge: 'global — re-render risk', pills: [{ label: 'built-in', color: '#64748b' }] }),
    mkNode('zustand', 680, 40, { icon: '🐻', title: 'Zustand', sub: 'Global, granular subscriptions', color: '#a78bfa', badge: 'global — selective', pills: [{ label: 'lightweight', color: '#64748b' }] }),
    mkNode('redux', 870, 40, { icon: '🏗️', title: 'Redux Toolkit', sub: 'Large apps, time-travel debug', color: '#dc2626', badge: 'enterprise scale', pills: [{ label: 'devtools', color: '#64748b' }] }),

    // Context re-render problem
    mkGroup('grp-context', 0, 200, 820, 150, { label: 'Context Re-render Problem', color: '#f97316' }),
    mkNode('ctx-provider', 20, 245, { icon: '🌐', title: 'Context Provider', sub: 'value={{ user, theme }} changes', color: '#f97316', badge: 'any value change' }),
    mkNode('consumer-a', 240, 235, { icon: '📱', title: 'Consumer A', sub: 'Uses user — re-renders', color: '#dc2626', badge: 'needed re-render' }),
    mkNode('consumer-b', 240, 295, { icon: '📱', title: 'Consumer B', sub: 'Uses theme — also re-renders even if only user changed', color: '#dc2626', badge: 'unnecessary re-render' }),
    mkNode('ctx-fix', 520, 265, { icon: '✅', title: 'Fix: Split Contexts', sub: 'UserContext + ThemeContext separately', color: '#10b981', badge: 'or use Zustand selectors' }),

    // Server state
    mkGroup('grp-server', 0, 380, 820, 130, { label: 'Server State — Separate Concern', color: '#38bdf8' }),
    mkNode('rq-fetch', 20, 425, { icon: '🔌', title: 'React Query', sub: 'useQuery / useMutation', color: '#38bdf8', badge: 'server state', pills: [{ label: 'cache + sync', color: '#64748b' }] }),
    mkNode('rq-cache', 240, 425, { icon: '💾', title: 'Query Cache', sub: 'Background refetch, stale-while-revalidate', color: '#6366f1', badge: 'automatic caching' }),
    mkNode('rq-sync', 480, 425, { icon: '🔄', title: 'Optimistic Updates', sub: 'Mutate locally, reconcile on response', color: '#a78bfa', badge: 'good UX' }),

    // Bottom label
    mkLabel('lbl-server', 80, 535, { label: 'Server state (React Query) vs UI state (Zustand/Redux) — keep them separate', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Spectrum left to right
    mkEdge('e-us-ur', 'use-state', 'use-reducer', { color: '#38bdf8', labelText: 'more complex?' }),
    mkEdge('e-ur-ctx', 'use-reducer', 'context', { color: '#f97316', labelText: 'need global?' }),
    mkEdge('e-ctx-zus', 'context', 'zustand', { color: '#a78bfa', labelText: 're-render issues?' }),
    mkEdge('e-zus-rdx', 'zustand', 'redux', { color: '#dc2626', labelText: 'large team/app?' }),

    // Context problem
    mkEdge('e-cp-ca', 'ctx-provider', 'consumer-a', { color: '#dc2626', labelText: 'notifies all' }),
    mkEdge('e-cp-cb', 'ctx-provider', 'consumer-b', { color: '#dc2626', dashed: true }),
    mkEdge('e-cb-fix', 'consumer-b', 'ctx-fix', { color: '#10b981', labelText: 'fix with' }),

    // Server state
    mkEdge('e-rf-rc', 'rq-fetch', 'rq-cache', { color: '#6366f1', labelText: 'backed by' }),
    mkEdge('e-rc-rs', 'rq-cache', 'rq-sync', { color: '#a78bfa', labelText: 'enables' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
