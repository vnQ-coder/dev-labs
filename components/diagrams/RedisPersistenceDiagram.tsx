'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function RedisPersistenceDiagram() {
  const nodes: Node[] = useMemo(() => [
    // RDB group (left)
    mkGroup('grp-rdb', 0, 0, 320, 260, { label: 'RDB Snapshot', sub: 'point-in-time', color: '#f97316' }),
    mkNode('redis-rdb',  20,  50, { icon: '⚡', title: 'Redis Process',  sub: 'BGSAVE / schedule',  color: '#dc2626' }),
    mkNode('fork',      140,  50, { icon: '🍴', title: 'fork()',          sub: 'Copy-on-write',      color: '#f97316', badge: 'non-blocking' }),
    mkNode('child',      20, 155, { icon: '👶', title: 'Child Process',   sub: 'Serializes dataset', color: '#f97316' }),
    mkNode('rdb-file',  140, 155, { icon: '💾', title: 'dump.rdb',        sub: 'Atomic file swap',   color: '#10b981', badge: 'Disk' }),
    mkLabel('lbl-rdb',   10, 228, { label: 'Minutes of data loss', icon: '⚠️', color: '#f97316' }),

    // AOF group (right)
    mkGroup('grp-aof', 370, 0, 360, 260, { label: 'AOF Log', sub: 'append-only file', color: '#38bdf8' }),
    mkNode('redis-aof', 390,  50, { icon: '⚡', title: 'Redis Process', sub: 'Every write command', color: '#dc2626' }),
    mkNode('aof-buf',   560,  50, { icon: '📝', title: 'AOF Buffer',    sub: 'Write appended',      color: '#38bdf8' }),
    mkNode('aof-file',  560, 155, {
      icon: '📄',
      title: 'appendonly.aof',
      sub: 'fsync policy',
      color: '#10b981',
      badge: 'Disk',
      pills: [
        { label: 'always (0 loss)', color: '#10b981' },
        { label: 'everysec (1s loss)', color: '#f97316' },
        { label: 'no (OS decides)', color: '#64748b' },
      ],
    }),
    mkLabel('lbl-aof', 380, 228, { label: '1s loss with everysec', icon: '🕐', color: '#38bdf8' }),

    // Hybrid (bottom center)
    mkGroup('grp-hybrid', 120, 295, 460, 100, { label: 'Hybrid Mode — aof-use-rdb-preamble', color: '#a78bfa' }),
    mkNode('hybrid',   240, 330, {
      icon: '🔀',
      title: 'RDB preamble + AOF',
      sub: 'Best of both worlds',
      color: '#a78bfa',
      badge: 'Recommended',
      pills: [{ label: 'Fast restore + minimal data loss', color: '#a78bfa' }],
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // RDB path
    mkEdge('e-rdb-fork',  'redis-rdb', 'fork',     { color: '#f97316', labelText: 'BGSAVE' }),
    mkEdge('e-fork-child','fork',      'child',    { color: '#f97316', dashed: true }),
    mkEdge('e-child-file','child',     'rdb-file', { color: '#10b981', labelText: 'write' }),

    // AOF path
    mkEdge('e-aof-buf',  'redis-aof', 'aof-buf',  { color: '#38bdf8', labelText: 'append cmd' }),
    mkEdge('e-buf-file', 'aof-buf',   'aof-file', { color: '#10b981', labelText: 'fsync' }),

    // Both feed hybrid
    mkEdge('e-rdb-hyb', 'rdb-file',  'hybrid', { color: '#a78bfa', dashed: true }),
    mkEdge('e-aof-hyb', 'aof-file',  'hybrid', { color: '#a78bfa', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
