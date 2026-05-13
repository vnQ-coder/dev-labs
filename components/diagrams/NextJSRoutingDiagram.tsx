'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NextJSRoutingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // File system routing
    mkGroup('grp-routes', 0, 0, 900, 160, { label: 'File System Routing — app/ Directory', color: '#6366f1' }),
    mkNode('home-route', 20, 45, { icon: '🏠', title: 'app/page.tsx', sub: 'Matches /', color: '#6366f1', badge: '/' }),
    mkNode('blog-route', 240, 45, { icon: '📝', title: 'app/blog/[slug]/page.tsx', sub: 'Matches /blog/:slug', color: '#38bdf8', badge: '/blog/:slug', pills: [{ label: 'params.slug', color: '#64748b' }] }),
    mkNode('catch-all', 560, 45, { icon: '🌊', title: 'app/shop/[...categories]/page.tsx', sub: 'Matches /shop/a/b/c', color: '#f97316', badge: '/shop/*', pills: [{ label: 'params.categories = array', color: '#64748b' }] }),

    // Route groups
    mkGroup('grp-groups', 0, 190, 900, 160, { label: 'Route Groups — (folder) Does Not Affect URL', color: '#10b981' }),
    mkNode('auth-group', 20, 235, { icon: '🔐', title: '(auth) group', sub: 'Shared auth layout for login/register', color: '#10b981', badge: 'no URL segment' }),
    mkNode('login-route', 220, 225, { icon: '🔑', title: '(auth)/login/page.tsx', sub: 'URL: /login', color: '#38bdf8', badge: '/login' }),
    mkNode('register-route', 220, 275, { icon: '📋', title: '(auth)/register/page.tsx', sub: 'URL: /register', color: '#38bdf8', badge: '/register' }),
    mkNode('dash-group', 500, 235, { icon: '📊', title: '(dashboard) group', sub: 'Shared dashboard layout', color: '#a78bfa', badge: 'separate layout' }),
    mkNode('dash-home', 700, 225, { icon: '🏠', title: '(dashboard)/home', sub: 'URL: /home', color: '#6366f1', badge: '/home' }),
    mkNode('dash-settings', 700, 275, { icon: '⚙️', title: '(dashboard)/settings', sub: 'URL: /settings', color: '#6366f1', badge: '/settings' }),

    // Parallel routes
    mkGroup('grp-parallel', 0, 380, 480, 140, { label: 'Parallel Routes — @slot Convention', color: '#38bdf8' }),
    mkNode('par-layout', 20, 425, { icon: '🏛️', title: 'layout.tsx', sub: 'Receives both slots as props', color: '#6366f1', badge: 'renders side by side' }),
    mkNode('modal-slot', 220, 415, { icon: '💬', title: '@modal', sub: 'app/@modal/page.tsx', color: '#38bdf8', badge: 'independent loading' }),
    mkNode('feed-slot', 220, 455, { icon: '📰', title: '@feed', sub: 'app/@feed/page.tsx', color: '#f97316', badge: 'independent loading' }),

    // Intercepting routes
    mkGroup('grp-intercept', 500, 380, 400, 140, { label: 'Intercepting Routes', color: '#a78bfa' }),
    mkNode('intercept-match', 520, 425, { icon: '🎯', title: '(.)/photo/[id]', sub: 'Intercepts /photo/:id navigation', color: '#a78bfa', badge: 'modal context' }),
    mkNode('intercept-full', 720, 425, { icon: '📷', title: 'Full page on refresh', sub: '/photo/[id]/page.tsx serves full page', color: '#10b981', badge: 'direct URL works' }),

    // Bottom label
    mkLabel('lbl', 80, 545, { label: 'Intercepting routes enable Instagram-style photo modal — same URL, different UI based on navigation context', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // File routes
    mkEdge('e-hr-br', 'home-route', 'blog-route', { color: '#38bdf8', labelText: 'dynamic segment' }),
    mkEdge('e-br-ca', 'blog-route', 'catch-all', { color: '#f97316', labelText: 'catch-all' }),

    // Route groups
    mkEdge('e-ag-lr', 'auth-group', 'login-route', { color: '#10b981' }),
    mkEdge('e-ag-rr', 'auth-group', 'register-route', { color: '#10b981' }),
    mkEdge('e-dg-dh', 'dash-group', 'dash-home', { color: '#a78bfa' }),
    mkEdge('e-dg-ds', 'dash-group', 'dash-settings', { color: '#a78bfa' }),

    // Parallel routes
    mkEdge('e-pl-ms', 'par-layout', 'modal-slot', { color: '#38bdf8' }),
    mkEdge('e-pl-fs', 'par-layout', 'feed-slot', { color: '#f97316' }),

    // Intercepting
    mkEdge('e-im-if', 'intercept-match', 'intercept-full', { color: '#a78bfa', labelText: 'falls through on refresh', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
