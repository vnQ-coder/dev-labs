'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NextJSAppRouterDiagram() {
  const nodes: Node[] = useMemo(() => [
    // File conventions group
    mkGroup('grp-files', 0, 0, 880, 160, { label: 'App Router File Conventions — app/ directory', color: '#6366f1' }),
    mkNode('layout', 20, 45, { icon: '🏛️', title: 'layout.tsx', sub: 'Persistent across navigations', color: '#6366f1', badge: 'wraps page' }),
    mkNode('page', 200, 45, { icon: '📄', title: 'page.tsx', sub: 'Route content — makes URL accessible', color: '#38bdf8', badge: 'route segment' }),
    mkNode('loading', 390, 45, { icon: '⏳', title: 'loading.tsx', sub: 'Suspense boundary — auto-wraps page', color: '#f97316', badge: 'streaming fallback' }),
    mkNode('error-file', 580, 45, { icon: '🚨', title: 'error.tsx', sub: 'Error boundary for segment', color: '#dc2626', badge: 'error UI' }),
    mkNode('not-found', 750, 45, { icon: '🔍', title: 'not-found.tsx', sub: 'notFound() renders this', color: '#64748b', badge: '404 UI' }),

    // Server component group
    mkGroup('grp-sc', 0, 190, 420, 150, { label: 'Server Component (default)', color: '#10b981' }),
    mkNode('sc-node', 20, 235, { icon: '🖥️', title: 'Server Component', sub: 'Direct DB/API access, zero JS to client', color: '#10b981', badge: 'default in app/', pills: [{ label: 'async component', color: '#64748b' }] }),
    mkNode('sc-db', 200, 235, { icon: '🗄️', title: 'Database Query', sub: 'await db.query() directly in component', color: '#38bdf8', badge: 'no API layer needed' }),

    // Client component group
    mkGroup('grp-cc', 440, 190, 440, 150, { label: "Client Component ('use client')", color: '#f97316' }),
    mkNode('cc-node', 460, 235, { icon: '💻', title: 'Client Component', sub: "'use client' directive at top", color: '#f97316', badge: 'sends JS to browser', pills: [{ label: 'useState / useEffect ok', color: '#64748b' }] }),
    mkNode('cc-browser', 680, 235, { icon: '🌐', title: 'Browser APIs', sub: 'window, localStorage, event handlers', color: '#a78bfa', badge: 'client-only' }),

    // Composition pattern
    mkGroup('grp-comp', 0, 370, 600, 130, { label: 'Composition Pattern — Server passes to Client', color: '#a78bfa' }),
    mkNode('sc-data', 20, 415, { icon: '📦', title: 'Server fetches data', sub: 'async fetch / db call in Server Component', color: '#10b981', badge: 'server side' }),
    mkNode('cc-props', 280, 415, { icon: '🔽', title: 'Passed as props', sub: 'Serializable data only (no functions)', color: '#a78bfa', badge: 'props boundary' }),
    mkNode('cc-render', 480, 415, { icon: '🖼️', title: 'Client renders', sub: 'Interactive UI with received data', color: '#f97316', badge: 'client interactive' }),

    // Parallel routes
    mkGroup('grp-parallel', 620, 370, 360, 130, { label: 'Parallel Routes', color: '#38bdf8' }),
    mkNode('layout-par', 640, 415, { icon: '🏛️', title: 'Layout', sub: 'Renders both slots simultaneously', color: '#6366f1', badge: 'parallel slots' }),
    mkNode('modal-slot', 800, 405, { icon: '💬', title: '@modal slot', sub: 'Renders modal independently', color: '#38bdf8', badge: '@modal' }),
    mkNode('feed-slot', 800, 445, { icon: '📰', title: '@feed slot', sub: 'Renders feed independently', color: '#f97316', badge: '@feed' }),

    // Bottom label
    mkLabel('lbl', 80, 525, { label: 'Server Components are the default — opt into client interactivity with use client only where needed', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // File hierarchy
    mkEdge('e-ly-pg', 'layout', 'page', { color: '#6366f1', labelText: 'wraps' }),
    mkEdge('e-pg-ld', 'page', 'loading', { color: '#f97316', labelText: 'during load' }),
    mkEdge('e-pg-er', 'page', 'error-file', { color: '#dc2626', labelText: 'on error' }),
    mkEdge('e-pg-nf', 'page', 'not-found', { color: '#64748b', dashed: true, labelText: 'notFound()' }),

    // Server component
    mkEdge('e-sc-db', 'sc-node', 'sc-db', { color: '#10b981', labelText: 'queries' }),

    // Client component
    mkEdge('e-cc-br', 'cc-node', 'cc-browser', { color: '#a78bfa', labelText: 'accesses' }),

    // Composition
    mkEdge('e-sd-cp', 'sc-data', 'cc-props', { color: '#a78bfa', labelText: 'serialized' }),
    mkEdge('e-cp-cr', 'cc-props', 'cc-render', { color: '#f97316', labelText: 'received by' }),

    // Parallel routes
    mkEdge('e-lp-ms', 'layout-par', 'modal-slot', { color: '#38bdf8' }),
    mkEdge('e-lp-fs', 'layout-par', 'feed-slot', { color: '#f97316' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
