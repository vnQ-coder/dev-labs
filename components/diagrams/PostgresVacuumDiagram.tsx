'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresVacuumDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Before VACUUM group
    mkGroup('grp-before', 0, 0, 200, 340, { label: 'Table (before)', color: '#336791' }),
    mkNode('live1',  20, 40,  { icon: '✅', title: 'Live Row 1', sub: 'xmin=10', color: '#10b981' }),
    mkNode('live2',  20, 120, { icon: '✅', title: 'Live Row 2', sub: 'xmin=12', color: '#10b981' }),
    mkNode('live3',  20, 200, { icon: '✅', title: 'Live Row 3', sub: 'xmin=15', color: '#10b981' }),
    mkNode('dead1',  20, 280, { icon: '💀', title: 'Dead Tuple',  sub: 'from UPDATE', color: '#ef4444', dim: true }),

    // Autovacuum daemon
    mkNode('autovac', 280, 100, {
      icon: '🤖',
      title: 'Autovacuum Daemon',
      sub: 'triggered by dead tuple %\nscans, marks space reusable',
      color: '#336791',
      badge: 'background',
    }),

    // FSM
    mkNode('fsm', 280, 250, {
      icon: '🗺',
      title: 'Free Space Map',
      sub: 'updated with reusable pages',
      color: '#60a5fa',
    }),

    // After VACUUM group
    mkGroup('grp-after', 480, 0, 200, 340, { label: 'Table (after VACUUM)', color: '#10b981' }),
    mkNode('alive1', 500, 40,  { icon: '✅', title: 'Live Row 1', sub: 'xmin=10', color: '#10b981' }),
    mkNode('alive2', 500, 120, { icon: '✅', title: 'Live Row 2', sub: 'xmin=12', color: '#10b981' }),
    mkNode('alive3', 500, 200, { icon: '✅', title: 'Live Row 3', sub: 'xmin=15', color: '#10b981' }),
    mkNode('reuse',  500, 280, { icon: '♻️', title: 'Reusable Space', sub: 'available for new rows', color: '#64748b', badge: 'reclaimed' }),

    // XID Wraparound warning
    mkNode('wraparound', 750, 80, {
      icon: '⚠️',
      title: 'XID Wraparound',
      sub: 'After 2^31 txns\nFREEZE required or shutdown!',
      color: '#ef4444',
      badge: 'critical',
    }),

    // pg_repack
    mkNode('pgrepack', 750, 240, {
      icon: '🔧',
      title: 'pg_repack',
      sub: 'no ACCESS EXCLUSIVE lock\nalternative to VACUUM FULL',
      color: '#f59e0b',
      badge: 'prod safe',
    }),

    mkLabel('lbl', 80, 400, {
      label: 'VACUUM marks space reusable; VACUUM FULL rewrites table (avoid in prod)',
      icon: '🧹',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-dead-vac',  'dead1',    'autovac', { color: '#ef4444', labelText: 'triggers scan' }),
    mkEdge('e-vac-fsm',   'autovac',  'fsm',     { color: '#60a5fa', labelText: 'updates' }),
    mkEdge('e-vac-after', 'autovac',  'reuse',   { color: '#10b981', labelText: 'marks reusable' }),
    mkEdge('e-vac-wrap',  'autovac',  'wraparound', { color: '#ef4444', dashed: true, labelText: 'freeze prevents' }),
    mkEdge('e-rep-full',  'pgrepack', 'reuse',   { color: '#f59e0b', dashed: true, labelText: 'alternative' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
