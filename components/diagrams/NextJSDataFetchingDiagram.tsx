'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NextJSDataFetchingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Caching layers — top to bottom
    mkGroup('grp-layers', 0, 0, 820, 500, { label: 'Next.js Caching Layers — Top to Bottom', color: '#6366f1' }),

    mkNode('fetch-call', 20, 40, { icon: '🌐', title: 'fetch() call', sub: 'In Server Component or Route Handler', color: '#64748b', badge: 'entry point' }),

    mkNode('req-memo', 20, 120, { icon: '🔁', title: 'Request Memoization', sub: 'Deduplicates identical fetch calls within one render tree', color: '#38bdf8', badge: 'layer 1 — per render', pills: [{ label: 'React cache()', color: '#64748b' }] }),

    mkNode('data-cache', 20, 210, { icon: '💾', title: 'Data Cache', sub: 'Persistent across requests — survives server restarts', color: '#6366f1', badge: 'layer 2 — persistent', pills: [{ label: 'revalidate: N', color: '#64748b' }] }),

    mkNode('route-cache', 20, 300, { icon: '📄', title: 'Full Route Cache', sub: 'Pre-rendered static HTML + RSC payload at build time', color: '#10b981', badge: 'layer 3 — static HTML' }),

    mkNode('router-cache', 20, 390, { icon: '💻', title: 'Router Cache', sub: 'Client-side prefetch cache in browser', color: '#a78bfa', badge: 'layer 4 — client memory', pills: [{ label: 'auto-prefetch on hover', color: '#64748b' }] }),

    // Cache hit paths
    mkGroup('grp-hit', 860, 0, 300, 200, { label: 'Cache Hit = Skip Lower Layers', color: '#10b981' }),
    mkNode('hit1', 880, 45, { icon: '✅', title: 'Memo Hit', sub: 'Return same promise — no network call', color: '#38bdf8', badge: 'fastest' }),
    mkNode('hit2', 880, 115, { icon: '✅', title: 'Data Cache Hit', sub: 'Serve from persistent store', color: '#6366f1', badge: 'fast' }),
    mkNode('hit3', 880, 175, { icon: '✅', title: 'Route Cache Hit', sub: 'Serve pre-rendered HTML', color: '#10b981', badge: 'no computation' }),

    // Invalidation group
    mkGroup('grp-invalidate', 0, 530, 820, 140, { label: 'Cache Invalidation', color: '#dc2626' }),
    mkNode('revalidate-tag', 20, 575, { icon: '🏷️', title: 'revalidateTag("posts")', sub: 'Invalidates all fetches with that cache tag', color: '#dc2626', badge: 'tag-based' }),
    mkNode('revalidate-path', 280, 575, { icon: '📂', title: 'revalidatePath("/blog")', sub: 'Invalidates Full Route Cache for that path', color: '#f97316', badge: 'path-based' }),
    mkNode('server-action', 560, 575, { icon: '⚙️', title: 'Server Action', sub: 'Mutates data → calls revalidatePath/Tag → regenerates', color: '#6366f1', badge: 'mutation flow' }),

    // Bottom label
    mkLabel('lbl', 80, 695, { label: '4 caching layers — understand which one your bug is in before debugging', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Caching layers
    mkEdge('e-fc-rm', 'fetch-call', 'req-memo', { color: '#38bdf8', labelText: 'deduplicated by' }),
    mkEdge('e-rm-dc', 'req-memo', 'data-cache', { color: '#6366f1', labelText: 'then stored in' }),
    mkEdge('e-dc-rc', 'data-cache', 'route-cache', { color: '#10b981', labelText: 'used for' }),
    mkEdge('e-rc-roc', 'route-cache', 'router-cache', { color: '#a78bfa', labelText: 'prefetched into' }),

    // Cache hits
    mkEdge('e-rm-h1', 'req-memo', 'hit1', { color: '#38bdf8', dashed: true }),
    mkEdge('e-dc-h2', 'data-cache', 'hit2', { color: '#6366f1', dashed: true }),
    mkEdge('e-rc-h3', 'route-cache', 'hit3', { color: '#10b981', dashed: true }),

    // Invalidation
    mkEdge('e-sa-rt', 'server-action', 'revalidate-tag', { color: '#dc2626', labelText: 'calls' }),
    mkEdge('e-sa-rp', 'server-action', 'revalidate-path', { color: '#f97316', labelText: 'or calls' }),
    mkEdge('e-rt-dc', 'revalidate-tag', 'data-cache', { color: '#dc2626', dashed: true, labelText: 'busts' }),
    mkEdge('e-rp-rc', 'revalidate-path', 'route-cache', { color: '#f97316', dashed: true, labelText: 'busts' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
