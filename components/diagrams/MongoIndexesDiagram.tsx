'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function MongoIndexesDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Query entry
    mkNode('query',      20,  40, { icon: '🔍', title: 'Query',        sub: 'db.col.find({ … })',       color: '#64748b' }),

    // Query Planner group
    mkGroup('grp-planner', 200, 0, 440, 160, { label: 'Query Planner', color: '#38bdf8' }),
    mkNode('planner',   220,  40, { icon: '🧠', title: 'Query Planner', sub: 'Evaluates candidate plans', color: '#38bdf8' }),
    mkNode('ixscan',    220, 110, { icon: '✅', title: 'IXSCAN',        sub: 'Index scan — winning plan', color: '#10b981', badge: 'fast' }),
    mkNode('collscan',  420, 110, { icon: '🐢', title: 'COLLSCAN',      sub: 'Full collection scan',     color: '#dc2626', badge: 'slow — no index' }),

    // Index Types group
    mkGroup('grp-indexes', 700, 0, 820, 380, { label: 'Index Types', color: '#a78bfa' }),
    mkNode('btree',      720,  40, { icon: '🌳', title: 'B-tree Index',      sub: 'Single field — equality & range',    color: '#a78bfa', badge: 'default' }),
    mkNode('compound',   720, 120, {
      icon: '📐',
      title: 'Compound Index',
      sub: 'Multi-field — follow ESR rule',
      color: '#f97316',
      badge: 'ESR order matters',
      pills: [{ label: 'Equality → Sort → Range', color: '#7c2d12' }],
    }),
    mkNode('text',       720, 210, { icon: '📝', title: 'Text Index',        sub: 'Full-text search, stemming',         color: '#38bdf8', badge: '$text / $search' }),
    mkNode('geo',        720, 290, { icon: '🌐', title: 'Geospatial Index',  sub: '2dsphere — GeoJSON queries',         color: '#10b981', badge: '$near / $geoWithin' }),
    mkNode('ttl',        720, 360, { icon: '⏱️', title: 'TTL Index',         sub: 'Auto-expire documents by date field', color: '#dc2626', badge: 'expireAfterSeconds' }),

    // ESR rule detail
    mkGroup('grp-esr', 200, 200, 440, 180, { label: 'ESR Rule — compound index field order', color: '#f97316' }),
    mkNode('esr-e',      220, 245, { icon: '1️⃣', title: 'Equality',   sub: 'Exact match fields first',   color: '#f97316' }),
    mkNode('esr-s',      340, 245, { icon: '2️⃣', title: 'Sort',       sub: 'Sort fields next',           color: '#f97316' }),
    mkNode('esr-r',      460, 245, { icon: '3️⃣', title: 'Range',      sub: 'Range / inequality last',    color: '#f97316' }),
    mkLabel('lbl-esr',   220, 330, { label: 'Correct order maximises index selectivity and avoids in-memory sorts', icon: '💡', color: '#f97316' }),

    // Bottom hint
    mkLabel('lbl-hint', 20, 410, { label: 'Use explain("executionStats") to verify IXSCAN and check nReturned vs totalDocsExamined', icon: '🔬', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Query → Planner → plans
    mkEdge('e-query-plan',    'query',    'planner',  { color: '#64748b', labelText: 'candidate plans' }),
    mkEdge('e-plan-ixscan',   'planner',  'ixscan',   { color: '#10b981', labelText: 'winning plan' }),
    mkEdge('e-plan-collscan', 'planner',  'collscan', { color: '#dc2626', dashed: true, labelText: 'no usable index' }),

    // Planner considers index types
    mkEdge('e-plan-btree',    'planner',  'btree',    { color: '#a78bfa', dashed: true }),
    mkEdge('e-plan-compound', 'planner',  'compound', { color: '#f97316', dashed: true }),
    mkEdge('e-plan-text',     'planner',  'text',     { color: '#38bdf8', dashed: true }),
    mkEdge('e-plan-geo',      'planner',  'geo',      { color: '#10b981', dashed: true }),
    mkEdge('e-plan-ttl',      'planner',  'ttl',      { color: '#dc2626', dashed: true }),

    // ESR rule flow
    mkEdge('e-esr-e-s', 'esr-e', 'esr-s', { color: '#f97316' }),
    mkEdge('e-esr-s-r', 'esr-s', 'esr-r', { color: '#f97316' }),

    // Compound → ESR detail
    mkEdge('e-compound-esr', 'compound', 'esr-e', { color: '#f97316', dashed: true, labelText: 'applies' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
