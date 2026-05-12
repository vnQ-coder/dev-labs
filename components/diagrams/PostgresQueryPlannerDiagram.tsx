'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresQueryPlannerDiagram() {
  const nodes: Node[] = useMemo(() => [
    // EXPLAIN plan tree (top-down)
    mkNode('hashjoin', 200, 0, {
      icon: '🔗',
      title: 'Hash Join',
      sub: 'cost=450..890',
      color: '#336791',
      badge: 'root',
    }),

    // Left branch
    mkNode('seqscan', 0, 120, {
      icon: '🔍',
      title: 'Seq Scan orders',
      sub: "Filter: status='new'\nrows=50000 est / 12 actual",
      color: '#ef4444',
      badge: '⚠ bad estimate',
    }),

    // Right branch
    mkNode('hash', 400, 120, {
      icon: '#️⃣',
      title: 'Hash',
      sub: 'Batches=1, Memory=8kB',
      color: '#60a5fa',
    }),
    mkNode('idxscan', 400, 240, {
      icon: '⚡',
      title: 'Index Scan users',
      sub: 'Index Cond: pkey\nrows=1 est / 1 actual',
      color: '#10b981',
      badge: 'accurate',
    }),

    // Planner inputs group
    mkGroup('grp-inputs', 0, 340, 580, 120, { label: 'Planner Inputs', color: '#60a5fa' }),
    mkNode('pgstat', 20, 380, {
      icon: '📊',
      title: 'pg_statistic',
      sub: 'populated by ANALYZE\nhistograms, MCVs',
      color: '#60a5fa',
    }),
    mkNode('costparams', 210, 380, {
      icon: '⚙️',
      title: 'Cost Parameters',
      sub: 'seq_page_cost\nrandom_page_cost, cpu_*',
      color: '#60a5fa',
    }),
    mkNode('jit', 400, 380, {
      icon: '🚀',
      title: 'JIT Compilation',
      sub: 'jit=on for long queries\nLLVM code generation',
      color: '#60a5fa',
    }),

    // CREATE STATISTICS fix
    mkNode('createstats', 700, 120, {
      icon: '🛠',
      title: 'CREATE STATISTICS',
      sub: 'fixes correlated column\nestimates (e.g. city+zip)',
      color: '#10b981',
      badge: 'fix bad estimates',
    }),

    mkLabel('lbl', 100, 490, {
      label: 'EXPLAIN ANALYZE shows actual vs estimated rows — divergence = stale stats',
      icon: '🔎',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Plan tree
    mkEdge('e-hj-seq',  'hashjoin', 'seqscan', { color: '#336791', labelText: 'build left' }),
    mkEdge('e-hj-hash', 'hashjoin', 'hash',    { color: '#336791', labelText: 'build right' }),
    mkEdge('e-hash-idx','hash',     'idxscan', { color: '#60a5fa' }),

    // Bad estimate → CREATE STATISTICS
    mkEdge('e-seq-cs',  'seqscan', 'createstats', { color: '#ef4444', dashed: true, labelText: 'needs fix' }),

    // Planner inputs feed hashjoin
    mkEdge('e-stat-hj',  'pgstat',     'hashjoin', { color: '#60a5fa', dashed: true, labelText: 'row estimates' }),
    mkEdge('e-cost-hj',  'costparams', 'hashjoin', { color: '#60a5fa', dashed: true, labelText: 'cost model' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
