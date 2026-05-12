'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresRowLockingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Workers (left)
    mkNode('w1', 0, 40,  { icon: '👷', title: 'Worker 1', sub: 'SELECT FOR UPDATE\nSKIP LOCKED', color: '#336791' }),
    mkNode('w2', 0, 160, { icon: '👷', title: 'Worker 2', sub: 'SELECT FOR UPDATE\nSKIP LOCKED', color: '#336791' }),
    mkNode('w3', 0, 280, { icon: '👷', title: 'Worker 3', sub: 'SKIP LOCKED\nskips job1, job2', color: '#336791' }),

    // Jobs table group
    mkGroup('grp-jobs', 210, 0, 260, 340, { label: 'Jobs Table', color: '#60a5fa' }),

    // Job rows
    mkNode('job1', 240, 40,  { icon: '🔒', title: 'Job 1', sub: 'status=processing', color: '#ef4444', badge: 'LOCKED', dim: true }),
    mkNode('job2', 240, 110, { icon: '🔒', title: 'Job 2', sub: 'status=processing', color: '#ef4444', badge: 'LOCKED', dim: true }),
    mkNode('job3', 240, 180, { icon: '✅', title: 'Job 3', sub: 'status=pending',    color: '#10b981', badge: 'claimed W1' }),
    mkNode('job4', 240, 250, { icon: '✅', title: 'Job 4', sub: 'status=pending',    color: '#10b981', badge: 'claimed W2' }),
    mkNode('job5', 240, 320, { icon: '✅', title: 'Job 5', sub: 'status=pending',    color: '#10b981', badge: 'claimed W3' }),

    mkLabel('lbl', 60, 400, {
      label: 'SKIP LOCKED = parallel workers with no contention — perfect job queue',
      icon: '⚡',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-w1-j3', 'w1', 'job3', { color: '#10b981', labelText: 'locks' }),
    mkEdge('e-w2-j4', 'w2', 'job4', { color: '#10b981', labelText: 'locks' }),
    mkEdge('e-w3-j5', 'w3', 'job5', { color: '#10b981', labelText: 'locks' }),
    mkEdge('e-w1-j1', 'w1', 'job1', { color: '#ef4444', dashed: true, labelText: 'skips' }),
    mkEdge('e-w2-j2', 'w2', 'job2', { color: '#ef4444', dashed: true, labelText: 'skips' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
