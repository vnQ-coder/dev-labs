'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function MongoAggregationDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Input
    mkNode('docs',       20, 180, { icon: '📦', title: 'Input Documents', sub: 'Collection cursor',            color: '#64748b' }),

    // Main pipeline group
    mkGroup('grp-pipeline', 180, 0, 880, 380, { label: 'Aggregation Pipeline — stages execute in order', color: '#38bdf8' }),

    // Pipeline stages (left to right)
    mkNode('match',      200, 170, {
      icon: '🔍',
      title: '$match',
      sub: 'Filter documents early',
      color: '#10b981',
      badge: 'uses index if first stage',
    }),
    mkNode('group',      360, 170, {
      icon: '🗃️',
      title: '$group',
      sub: 'Accumulate: $sum $avg $count',
      color: '#f97316',
      badge: '_id: groupKey',
    }),
    mkNode('sort',       520, 170, {
      icon: '↕️',
      title: '$sort',
      sub: 'Order results',
      color: '#a78bfa',
      badge: '1 asc / -1 desc',
    }),
    mkNode('lookup',     680, 170, {
      icon: '🔗',
      title: '$lookup',
      sub: 'Left outer join another collection',
      color: '#38bdf8',
      badge: 'like SQL JOIN',
    }),
    mkNode('project',    840, 170, {
      icon: '🎯',
      title: '$project',
      sub: 'Include / exclude / reshape fields',
      color: '#f97316',
      badge: '1 include / 0 exclude',
    }),

    // $facet branching group
    mkGroup('grp-facet', 180, 400, 560, 240, { label: '$facet — parallel sub-pipelines from same input', color: '#ec4899' }),
    mkNode('facet',      200, 450, {
      icon: '🌿',
      title: '$facet',
      sub: 'Runs multiple pipelines in parallel',
      color: '#ec4899',
      badge: 'single pass',
    }),
    mkNode('facet-a',    420, 420, {
      icon: '📊',
      title: 'Pipeline A',
      sub: '$group → $sort (totals)',
      color: '#ec4899',
      pills: [{ label: 'e.g. category counts', color: '#831843' }],
    }),
    mkNode('facet-b',    420, 510, {
      icon: '📈',
      title: 'Pipeline B',
      sub: '$bucketAuto (distribution)',
      color: '#ec4899',
      pills: [{ label: 'e.g. price ranges', color: '#831843' }],
    }),

    // Output
    mkNode('result',    1060, 170, { icon: '✅', title: 'Result',         sub: 'Array of output docs',        color: '#10b981', badge: '.toArray() / cursor' }),

    // Labels
    mkLabel('lbl-tip1',  20, 360, { label: 'Put $match and $limit as early as possible to reduce documents in the pipeline', icon: '💡', color: '#64748b' }),
    mkLabel('lbl-tip2',  20, 400, { label: 'Use $explain on aggregation to see which stages are the bottleneck', icon: '🔬', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Main pipeline flow
    mkEdge('e-docs-match',    'docs',    'match',   { color: '#64748b', labelText: 'all docs' }),
    mkEdge('e-match-group',   'match',   'group',   { color: '#10b981', labelText: 'filtered' }),
    mkEdge('e-group-sort',    'group',   'sort',    { color: '#f97316', labelText: 'grouped' }),
    mkEdge('e-sort-lookup',   'sort',    'lookup',  { color: '#a78bfa', labelText: 'sorted' }),
    mkEdge('e-lookup-proj',   'lookup',  'project', { color: '#38bdf8', labelText: 'joined' }),
    mkEdge('e-proj-result',   'project', 'result',  { color: '#10b981', labelText: 'shaped' }),

    // $facet branches
    mkEdge('e-match-facet',   'match',   'facet',   { color: '#ec4899', dashed: true, labelText: 'optional $facet' }),
    mkEdge('e-facet-a',       'facet',   'facet-a', { color: '#ec4899' }),
    mkEdge('e-facet-b',       'facet',   'facet-b', { color: '#ec4899' }),
    mkEdge('e-facet-a-res',   'facet-a', 'result',  { color: '#ec4899', dashed: true }),
    mkEdge('e-facet-b-res',   'facet-b', 'result',  { color: '#ec4899', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
