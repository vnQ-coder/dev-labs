'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NextJSRenderingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // SSG
    mkGroup('grp-ssg', 0, 0, 220, 280, { label: 'SSG', color: '#10b981' }),
    mkNode('ssg-build', 20, 45, { icon: '🏗️', title: 'Build Time', sub: 'next build runs', color: '#10b981', badge: 'once' }),
    mkNode('ssg-html', 20, 120, { icon: '📄', title: 'Pre-rendered HTML', sub: 'Static files on disk', color: '#38bdf8', badge: 'static' }),
    mkNode('ssg-cdn', 20, 195, { icon: '🌍', title: 'CDN Edge', sub: 'Served globally, fastest TTFB', color: '#6366f1', badge: 'fastest' }),

    // ISR
    mkGroup('grp-isr', 240, 0, 220, 280, { label: 'ISR', color: '#6366f1' }),
    mkNode('isr-build', 260, 45, { icon: '🏗️', title: 'Build Time', sub: 'Initial HTML generated', color: '#10b981', badge: 'initial' }),
    mkNode('isr-stale', 260, 120, { icon: '⏳', title: 'Stale-while-revalidate', sub: 'Serve stale, regenerate bg', color: '#f97316', badge: 'fresh enough' }),
    mkNode('isr-regen', 260, 195, { icon: '🔄', title: 'Background Regen', sub: 'revalidate: N seconds', color: '#6366f1', badge: 'auto refresh' }),

    // SSR
    mkGroup('grp-ssr', 480, 0, 220, 280, { label: 'SSR', color: '#f97316' }),
    mkNode('ssr-req', 500, 45, { icon: '📥', title: 'Request Arrives', sub: 'User hits URL', color: '#64748b', badge: 'per request' }),
    mkNode('ssr-render', 500, 120, { icon: '⚙️', title: 'Server Renders', sub: 'Fresh HTML with live data', color: '#f97316', badge: 'always fresh' }),
    mkNode('ssr-client', 500, 195, { icon: '💻', title: 'Client Receives', sub: 'HTML + hydration JS', color: '#38bdf8', badge: 'slower TTFB' }),

    // CSR
    mkGroup('grp-csr', 720, 0, 220, 280, { label: 'CSR', color: '#dc2626' }),
    mkNode('csr-req', 740, 45, { icon: '📥', title: 'Request', sub: 'Empty HTML shell', color: '#64748b', badge: 'shell only' }),
    mkNode('csr-fetch', 740, 120, { icon: '🔌', title: 'Client Fetches Data', sub: 'useEffect + fetch/SWR', color: '#dc2626', badge: 'client-side' }),
    mkNode('csr-render', 740, 195, { icon: '🖼️', title: 'Renders in Browser', sub: 'Content appears after JS loads', color: '#f97316', badge: 'layout shift risk' }),

    // PPR
    mkGroup('grp-ppr', 0, 310, 940, 140, { label: 'PPR — Partial Pre-rendering (Next.js 14+)', color: '#a78bfa' }),
    mkNode('ppr-static', 20, 355, { icon: '⚡', title: 'Static Shell', sub: 'Pre-rendered at build time', color: '#10b981', badge: 'instant' }),
    mkNode('ppr-dynamic', 260, 355, { icon: '🌊', title: 'Dynamic Suspense Boundaries', sub: 'Streamed in as data resolves', color: '#a78bfa', badge: 'streaming' }),
    mkNode('ppr-client', 540, 355, { icon: '💻', title: 'Client Sees', sub: 'Static content instantly + dynamic fills in', color: '#38bdf8', badge: 'best of both' }),

    // Bottom label
    mkLabel('lbl', 80, 475, { label: 'ISR = best of SSG and SSR for most content — fresh data without per-request server cost', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // SSG flow
    mkEdge('e-ssg-1', 'ssg-build', 'ssg-html', { color: '#10b981', labelText: 'generates' }),
    mkEdge('e-ssg-2', 'ssg-html', 'ssg-cdn', { color: '#6366f1', labelText: 'served via' }),

    // ISR flow
    mkEdge('e-isr-1', 'isr-build', 'isr-stale', { color: '#6366f1', labelText: 'cached then' }),
    mkEdge('e-isr-2', 'isr-stale', 'isr-regen', { color: '#f97316', labelText: 'triggers' }),

    // SSR flow
    mkEdge('e-ssr-1', 'ssr-req', 'ssr-render', { color: '#f97316', labelText: 'server renders' }),
    mkEdge('e-ssr-2', 'ssr-render', 'ssr-client', { color: '#38bdf8', labelText: 'sends HTML' }),

    // CSR flow
    mkEdge('e-csr-1', 'csr-req', 'csr-fetch', { color: '#dc2626', labelText: 'JS fetches' }),
    mkEdge('e-csr-2', 'csr-fetch', 'csr-render', { color: '#f97316', labelText: 'then renders' }),

    // PPR flow
    mkEdge('e-ppr-1', 'ppr-static', 'ppr-dynamic', { color: '#a78bfa', labelText: '+ streaming' }),
    mkEdge('e-ppr-2', 'ppr-dynamic', 'ppr-client', { color: '#38bdf8', labelText: 'seen as' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
