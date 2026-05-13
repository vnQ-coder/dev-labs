'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NextJSOptimizationDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Optimization pipeline
    mkGroup('grp-pipeline', 0, 0, 1000, 420, { label: 'Next.js Optimization Pipeline', color: '#6366f1' }),

    // Images
    mkNode('img-input', 20, 45, { icon: '🖼️', title: 'next/image', sub: 'Lazy load, WebP, size hints, blur placeholder', color: '#10b981', badge: 'Image optimization', pills: [{ label: 'improves LCP', color: '#dc2626' }] }),
    mkNode('img-output', 280, 45, { icon: '⚡', title: 'Optimized Delivery', sub: 'Correct size per viewport, avoids CLS', color: '#38bdf8', badge: 'automatic srcset' }),

    // Fonts
    mkNode('font-input', 20, 135, { icon: '🔤', title: 'next/font', sub: 'Self-hosted, zero layout shift', color: '#a78bfa', badge: 'Font optimization', pills: [{ label: 'eliminates FOUT', color: '#64748b' }] }),
    mkNode('font-output', 280, 135, { icon: '📦', title: 'Inlined at Build Time', sub: 'CSS variables, display:swap, zero network request', color: '#38bdf8', badge: 'no layout shift' }),

    // Scripts
    mkNode('script-input', 20, 225, { icon: '📜', title: 'next/script', sub: 'strategy prop controls loading', color: '#f97316', badge: 'Script optimization' }),
    mkNode('script-strats', 280, 215, { icon: '🎛️', title: 'Strategy Options', sub: 'beforeInteractive / afterInteractive / lazyOnload / worker', color: '#f97316', badge: 'load control', pills: [{ label: 'Partytown for workers', color: '#64748b' }] }),

    // Bundle / RSC
    mkNode('rsc-input', 20, 315, { icon: '⚛️', title: 'React Server Components', sub: 'Component code stays on server', color: '#6366f1', badge: 'Bundle optimization', pills: [{ label: 'no client JS', color: '#64748b' }] }),
    mkNode('rsc-output', 280, 315, { icon: '📉', title: 'Smaller Client Bundle', sub: 'Dependencies like DB clients never shipped to browser', color: '#10b981', badge: 'bundle savings' }),

    // Middleware
    mkNode('mw-input', 600, 45, { icon: '🔀', title: 'Middleware', sub: 'Edge runtime — runs before render on every request', color: '#dc2626', badge: 'Edge optimization', pills: [{ label: 'low latency', color: '#64748b' }] }),
    mkNode('mw-redirect', 600, 130, { icon: '↩️', title: 'Redirect / Rewrite', sub: 'Auth guard, A/B test, geo routing', color: '#f97316', badge: 'before response' }),

    // Core Web Vitals group
    mkGroup('grp-cwv', 0, 450, 1000, 160, { label: 'Core Web Vitals — Metrics Impacted', color: '#dc2626' }),
    mkNode('lcp', 20, 495, { icon: '🖼️', title: 'LCP — Largest Contentful Paint', sub: 'Improved by next/image (lazy, preload hero) and SSR for faster HTML', color: '#dc2626', badge: 'target < 2.5s', pills: [{ label: 'images + TTFB', color: '#64748b' }] }),
    mkNode('ttfb', 380, 495, { icon: '⏱️', title: 'TTFB — Time to First Byte', sub: 'Improved by SSG/ISR (CDN) over SSR — choose right rendering', color: '#f97316', badge: 'target < 800ms', pills: [{ label: 'rendering strategy', color: '#64748b' }] }),
    mkNode('cls', 700, 495, { icon: '📐', title: 'CLS — Cumulative Layout Shift', sub: 'Eliminated by next/font (no FOUT) and next/image (size reserved)', color: '#10b981', badge: 'target < 0.1', pills: [{ label: 'fonts + images', color: '#64748b' }] }),

    // Bottom label
    mkLabel('lbl', 80, 635, { label: 'Each Next.js optimization primitive directly targets one or more Core Web Vitals metrics', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Images
    mkEdge('e-ii-io', 'img-input', 'img-output', { color: '#10b981', labelText: 'produces' }),
    mkEdge('e-io-lcp', 'img-output', 'lcp', { color: '#dc2626', dashed: true, labelText: 'improves' }),

    // Fonts
    mkEdge('e-fi-fo', 'font-input', 'font-output', { color: '#a78bfa', labelText: 'inlined as' }),
    mkEdge('e-fo-cls', 'font-output', 'cls', { color: '#10b981', dashed: true, labelText: 'eliminates shift' }),

    // Scripts
    mkEdge('e-si-ss', 'script-input', 'script-strats', { color: '#f97316', labelText: 'configured via' }),

    // RSC
    mkEdge('e-ri-ro', 'rsc-input', 'rsc-output', { color: '#6366f1', labelText: 'reduces' }),

    // Middleware
    mkEdge('e-mi-mr', 'mw-input', 'mw-redirect', { color: '#dc2626', labelText: 'can' }),

    // CWV connections
    mkEdge('e-tt-lcp', 'ttfb', 'lcp', { color: '#f97316', dashed: true, labelText: 'affects' }),
    mkEdge('e-img-cls', 'img-input', 'cls', { color: '#10b981', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
