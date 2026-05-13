'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresCTEsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Group 1: Regular CTE
    mkGroup('grp-cte', 0, 0, 700, 130, { label: 'Regular CTE — WITH clause, materialized once', color: '#38bdf8' }),
    mkNode('with',      20,  40, { icon: '📝', title: 'WITH clause',      sub: 'Define named subquery',         color: '#38bdf8' }),
    mkNode('mat',      230,  40, { icon: '💾', title: 'Materialized',     sub: 'Result stored in memory',       color: '#38bdf8', badge: 'MATERIALIZED hint' }),
    mkNode('ref1',     460,  40, { icon: '🔗', title: 'Reference A',      sub: 'Used in main query',            color: '#10b981' }),
    mkNode('ref2',     580,  40, { icon: '🔗', title: 'Reference B',      sub: 'Reused — no re-execution',      color: '#10b981', badge: 'optimization fence' }),

    // Group 2: Recursive CTE
    mkGroup('grp-rec', 0, 155, 820, 160, { label: 'Recursive CTE — org chart / tree traversal', color: '#a78bfa' }),
    mkNode('anchor',    20, 200, { icon: '⚓', title: 'Anchor Query',     sub: 'Base case (e.g. CEO row)',       color: '#a78bfa', badge: 'SELECT id FROM emp WHERE manager IS NULL' }),
    mkNode('worktab',  260, 200, { icon: '🗄️', title: 'Working Table',   sub: 'Holds current iteration rows',   color: '#f97316' }),
    mkNode('recmem',   500, 200, { icon: '🔄', title: 'Recursive Member', sub: 'JOIN working table on manager', color: '#a78bfa', badge: 'UNION ALL' }),
    mkNode('result',   700, 200, { icon: '✅', title: 'Union Result',     sub: 'All rows accumulated',          color: '#10b981' }),
    mkNode('empchain', 260, 270, { icon: '👤', title: 'Employee Chain',   sub: 'emp → manager → grandboss',     color: '#64748b', badge: 'stops when no new rows' }),

    // Group 3: LATERAL join
    mkGroup('grp-lat', 0, 345, 820, 130, { label: 'LATERAL Join — correlated subquery as table', color: '#f97316' }),
    mkNode('outer',     20, 390, { icon: '📋', title: 'Outer Table',      sub: 'e.g. customers',                color: '#64748b' }),
    mkNode('lateral',  230, 390, { icon: '↩️', title: 'LEFT JOIN LATERAL', sub: 'Can reference outer.col',      color: '#f97316', badge: 'correlated' }),
    mkNode('latres',   480, 390, { icon: '📊', title: 'Top-N per group',  sub: 'e.g. last 3 orders per customer', color: '#10b981' }),
    mkNode('regjoin',  680, 390, { icon: '🚫', title: 'Regular JOIN',     sub: 'Cannot see outer row cols',     color: '#dc2626', badge: 'no correlation' }),

    // DISTINCT ON vs GROUP BY
    mkGroup('grp-distinct', 0, 500, 820, 110, { label: 'DISTINCT ON vs GROUP BY', color: '#10b981' }),
    mkNode('distinct-on', 20, 545, { icon: '1️⃣', title: 'DISTINCT ON (col)',  sub: 'Keeps FIRST row per group — needs ORDER BY to control which', color: '#10b981', badge: 'PostgreSQL only' }),
    mkNode('groupby-agg', 430, 545, { icon: '∑',  title: 'GROUP BY',           sub: 'Aggregates all rows — must use agg functions for non-key cols', color: '#38bdf8' }),

    mkLabel('lbl', 0, 630, { label: 'Recursive CTE terminates when the recursive member returns 0 rows. Always add a depth limit to avoid infinite loops on cyclic graphs.', icon: '⚠️', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Regular CTE
    mkEdge('e-with-mat',   'with',    'mat',     { color: '#38bdf8', labelText: 'evaluate once' }),
    mkEdge('e-mat-r1',     'mat',     'ref1',    { color: '#10b981', dashed: true }),
    mkEdge('e-mat-r2',     'mat',     'ref2',    { color: '#10b981', dashed: true }),

    // Recursive CTE
    mkEdge('e-anc-wt',    'anchor',  'worktab',  { color: '#a78bfa', labelText: 'seed rows' }),
    mkEdge('e-wt-rec',    'worktab', 'recmem',   { color: '#f97316', labelText: 'iterate' }),
    mkEdge('e-rec-wt',    'recmem',  'worktab',  { color: '#f97316', dashed: true, labelText: 'UNION ALL' }),
    mkEdge('e-wt-res',    'worktab', 'result',   { color: '#10b981', labelText: 'accumulate' }),
    mkEdge('e-wt-chain',  'worktab', 'empchain', { color: '#64748b', dashed: true }),

    // LATERAL
    mkEdge('e-out-lat',   'outer',   'lateral',  { color: '#f97316', labelText: 'row by row' }),
    mkEdge('e-lat-res',   'lateral', 'latres',   { color: '#10b981' }),
    mkEdge('e-out-reg',   'outer',   'regjoin',  { color: '#dc2626', dashed: true, labelText: 'no outer ref' }),

    // DISTINCT ON vs GROUP BY
    mkEdge('e-do-gb',     'distinct-on', 'groupby-agg', { color: '#64748b', dashed: true, labelText: 'vs' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
