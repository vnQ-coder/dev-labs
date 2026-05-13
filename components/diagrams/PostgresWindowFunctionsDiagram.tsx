'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresWindowFunctionsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Logical execution order
    mkGroup('grp-order', 0, 0, 940, 110, { label: 'Logical Execution Order', color: '#38bdf8' }),
    mkNode('from',    20,  35, { icon: '📂', title: 'FROM',     sub: 'Join tables',             color: '#64748b' }),
    mkNode('where',  160,  35, { icon: '🔍', title: 'WHERE',    sub: 'Filter rows',             color: '#64748b' }),
    mkNode('groupby',300,  35, { icon: '📦', title: 'GROUP BY', sub: 'Aggregate groups',        color: '#64748b' }),
    mkNode('having', 450,  35, { icon: '🔎', title: 'HAVING',   sub: 'Filter groups',           color: '#64748b' }),
    mkNode('window', 590,  35, { icon: '🪟', title: 'WINDOW',   sub: 'Partition + frame',       color: '#38bdf8', badge: 'runs before SELECT' }),
    mkNode('select', 740,  35, { icon: '📋', title: 'SELECT',   sub: 'Project columns',         color: '#10b981' }),
    mkNode('orderby',880,  35, { icon: '🔢', title: 'ORDER BY', sub: 'Sort final result',       color: '#64748b' }),

    // OVER clause breakdown
    mkGroup('grp-over', 0, 140, 700, 130, { label: 'OVER Clause — how the window is defined', color: '#a78bfa' }),
    mkNode('partby',  20, 185, { icon: '✂️',  title: 'PARTITION BY', sub: 'Split into independent windows', color: '#a78bfa' }),
    mkNode('ord-win', 250, 185, { icon: '↕️', title: 'ORDER BY',     sub: 'Sort rows within partition',    color: '#a78bfa' }),
    mkNode('frame',   480, 185, { icon: '🖼️', title: 'FRAME',        sub: 'ROWS / RANGE BETWEEN',         color: '#a78bfa', badge: 'e.g. UNBOUNDED PRECEDING' }),

    // 4 function types
    mkGroup('grp-fns', 0, 300, 820, 130, { label: 'Window Function Types', color: '#f97316' }),
    mkNode('ranking', 20,  345, { icon: '🏆', title: 'Ranking',      sub: 'ROW_NUMBER, RANK, DENSE_RANK', color: '#dc2626', badge: 'no ties / ties / dense' }),
    mkNode('offset',  220, 345, { icon: '↔️', title: 'Offset',       sub: 'LAG, LEAD',                   color: '#f97316', badge: 'prev / next row' }),
    mkNode('agg',     430, 345, { icon: '∑',  title: 'Aggregate',    sub: 'SUM, AVG running total',       color: '#10b981', badge: 'cumulative' }),
    mkNode('dist',    630, 345, { icon: '📊', title: 'Distribution', sub: 'NTILE, PERCENT_RANK',          color: '#38bdf8', badge: 'percentile buckets' }),

    // Mini example
    mkGroup('grp-ex', 0, 460, 820, 130, { label: 'Example: ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)', color: '#10b981' }),
    mkNode('input',   20, 505, { icon: '📥', title: 'Input Table',  sub: 'dept, salary rows',             color: '#64748b' }),
    mkNode('part-ex', 230, 505, { icon: '✂️', title: 'Partition',   sub: 'group by dept',                 color: '#a78bfa' }),
    mkNode('sort-ex', 440, 505, { icon: '↕️', title: 'Sort',        sub: 'salary DESC per dept',          color: '#a78bfa' }),
    mkNode('rn-ex',   630, 505, { icon: '1️⃣', title: 'ROW_NUMBER', sub: '1,2,3... per dept',             color: '#10b981', badge: 'result col' }),

    mkLabel('lbl', 0, 610, { label: 'LIMIT runs last — it does NOT affect which rows the window function sees inside its partition.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Execution order chain
    mkEdge('e-from-wh',  'from',    'where',   { color: '#64748b' }),
    mkEdge('e-wh-gb',    'where',   'groupby', { color: '#64748b' }),
    mkEdge('e-gb-hv',    'groupby', 'having',  { color: '#64748b' }),
    mkEdge('e-hv-win',   'having',  'window',  { color: '#38bdf8', labelText: 'windowed result set' }),
    mkEdge('e-win-sel',  'window',  'select',  { color: '#10b981' }),
    mkEdge('e-sel-ord',  'select',  'orderby', { color: '#64748b' }),

    // OVER clause parts flow into window node
    mkEdge('e-partby-win',  'partby',  'window', { color: '#a78bfa', dashed: true }),
    mkEdge('e-ordwin-win',  'ord-win', 'window', { color: '#a78bfa', dashed: true }),
    mkEdge('e-frame-win',   'frame',   'window', { color: '#a78bfa', dashed: true }),

    // Function types feed into window
    mkEdge('e-rank-win',   'ranking', 'window', { color: '#dc2626', dashed: true }),
    mkEdge('e-off-win',    'offset',  'window', { color: '#f97316', dashed: true }),
    mkEdge('e-agg-win',    'agg',     'window', { color: '#10b981', dashed: true }),
    mkEdge('e-dist-win',   'dist',    'window', { color: '#38bdf8', dashed: true }),

    // Example pipeline
    mkEdge('e-in-pt',  'input',   'part-ex', { color: '#a78bfa' }),
    mkEdge('e-pt-sr',  'part-ex', 'sort-ex', { color: '#a78bfa' }),
    mkEdge('e-sr-rn',  'sort-ex', 'rn-ex',   { color: '#10b981', labelText: 'assign row number' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
