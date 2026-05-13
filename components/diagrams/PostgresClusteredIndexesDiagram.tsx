'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresClusteredIndexesDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Group 1: Heap File Layout
    mkGroup('grp-heap', 0, 0, 680, 130, { label: 'Heap File — unordered row storage', color: '#f97316' }),
    mkNode('page0',   20,  40, { icon: '📄', title: 'Page 0',  sub: '8KB block',         color: '#f97316', badge: 'ctid (0,1)' }),
    mkNode('page1',  200,  40, { icon: '📄', title: 'Page 1',  sub: '8KB block',         color: '#f97316', badge: 'ctid (1,2)' }),
    mkNode('page2',  380,  40, { icon: '📄', title: 'Page 2',  sub: '8KB block',         color: '#f97316', badge: 'ctid (2,4)' }),
    mkNode('ctid',   540,  40, { icon: '📍', title: 'ctid',    sub: '(page#, tuple#)',   color: '#dc2626', badge: 'physical location' }),

    // Group 2: Index Types
    mkGroup('grp-idx', 0, 155, 820, 130, { label: 'Index Types — B-tree · BRIN · Hash · Covering', color: '#38bdf8' }),
    mkNode('btree',   20, 200, { icon: '🌲', title: 'B-tree',         sub: 'General purpose, ordered',          color: '#38bdf8', badge: 'default' }),
    mkNode('brin',   220, 200, { icon: '📊', title: 'BRIN',           sub: 'Range, sequential data (timestamps)', color: '#a78bfa', badge: 'tiny, lossy' }),
    mkNode('hash',   430, 200, { icon: '#️⃣', title: 'Hash',           sub: 'Equality only (=)',                  color: '#10b981', badge: 'no range scans' }),
    mkNode('cover',  620, 200, { icon: '📦', title: 'Covering Index',  sub: 'INCLUDE extra cols',                 color: '#f59e0b', badge: 'index-only scan' }),

    // Group 3: Scan paths
    mkGroup('grp-scan', 0, 310, 820, 160, { label: 'Scan Paths — index scan vs index-only scan', color: '#10b981' }),
    mkNode('leaf',    20, 360, { icon: '🍃', title: 'B-tree Leaf',    sub: 'key → ctid',             color: '#38bdf8' }),
    mkNode('heap-fetch', 230, 340, { icon: '📄', title: 'Heap Fetch',  sub: 'Random I/O to heap page', color: '#dc2626', badge: 'Index Scan path' }),
    mkNode('result1',440, 340, { icon: '✅', title: 'Row Result',     sub: 'Returned to query',       color: '#10b981' }),
    mkNode('io-skip', 230, 410, { icon: '⚡', title: 'Index-Only',    sub: 'Read value from index leaf', color: '#10b981', badge: 'no heap fetch' }),
    mkNode('result2', 440, 410, { icon: '✅', title: 'Row Result',    sub: 'Returned to query',        color: '#10b981' }),

    // Correlation label
    mkLabel('lbl-corr', 0, 490, {
      label: 'Correlation stat: HIGH correlation (inserted in order) → sequential heap pages → fast index scan. LOW correlation → random heap fetches → seq scan may win.',
      icon: '📈',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Heap pages share ctid system
    mkEdge('e-p0-ctid', 'page0', 'ctid', { color: '#f97316', labelText: 'ctid pointer' }),
    mkEdge('e-p1-ctid', 'page1', 'ctid', { color: '#f97316' }),
    mkEdge('e-p2-ctid', 'page2', 'ctid', { color: '#f97316' }),

    // Index scan path
    mkEdge('e-leaf-heap',   'leaf',    'heap-fetch', { color: '#dc2626', labelText: 'ctid → random I/O' }),
    mkEdge('e-heap-res',    'heap-fetch', 'result1', { color: '#10b981' }),

    // Index-only scan path
    mkEdge('e-leaf-io',     'leaf',    'io-skip',   { color: '#10b981', dashed: true, labelText: 'value in index' }),
    mkEdge('e-io-res',      'io-skip', 'result2',   { color: '#10b981' }),

    // Covering index feeds index-only
    mkEdge('e-cover-io',    'cover',   'io-skip',   { color: '#f59e0b', dashed: true, labelText: 'INCLUDE cols' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
