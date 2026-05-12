'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresWALDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Write path (top row)
    mkNode('write',    0,   80, { icon: '✍️', title: 'Write Command',   sub: 'INSERT / UPDATE / DELETE', color: '#336791' }),
    mkNode('walbuf',  200,  80, { icon: '💾', title: 'WAL Buffer',      sub: 'in-memory ring buffer',    color: '#60a5fa' }),
    mkNode('walwriter',400, 80, { icon: '📝', title: 'WAL Writer',      sub: 'fsync to disk',            color: '#336791' }),
    mkNode('pgwal',   610,  80, { icon: '📁', title: 'pg_wal/ on Disk', sub: 'sequential log segments',  color: '#336791', badge: 'durable' }),

    // Checkpoint branch
    mkNode('checkpoint', 610, 220, { icon: '📌', title: 'Checkpoint Process', sub: 'periodic dirty-page flush', color: '#60a5fa' }),
    mkNode('datafiles',  820, 220, { icon: '🗄',  title: 'Data Files',         sub: 'heap & index pages',        color: '#64748b' }),

    // Archiving branch
    mkNode('archiver', 610, 320, { icon: '🗜',  title: 'WAL Archiver',    sub: 'copies segments async', color: '#f59e0b' }),
    mkNode('archive',  820, 320, { icon: '☁️',  title: 'Archive Storage', sub: 'S3 / NFS (PITR)',       color: '#f59e0b', badge: 'PITR' }),

    // Streaming replication branch
    mkNode('walsender', 610, 420, { icon: '📡', title: 'WAL Sender',     sub: 'streaming changes',   color: '#10b981' }),
    mkNode('standby',   820, 420, { icon: '🖥',  title: 'Standby Server', sub: 'hot standby / reads', color: '#10b981', badge: 'HA' }),

    mkLabel('lbl', 60, 520, {
      label: 'WAL is written before data files — crash recovery replays from last checkpoint',
      icon: '🛡',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-wr-buf',  'write',      'walbuf',     { color: '#336791' }),
    mkEdge('e-buf-wrt', 'walbuf',     'walwriter',  { color: '#336791' }),
    mkEdge('e-wrt-wal', 'walwriter',  'pgwal',      { color: '#336791' }),

    // Checkpoint
    mkEdge('e-wal-ckp',  'pgwal', 'checkpoint', { color: '#60a5fa', labelText: 'triggers' }),
    mkEdge('e-ckp-data', 'checkpoint', 'datafiles', { color: '#60a5fa' }),

    // Archiving
    mkEdge('e-wal-arch', 'pgwal', 'archiver', { color: '#f59e0b', labelText: 'archive_command' }),
    mkEdge('e-arch-s3',  'archiver', 'archive', { color: '#f59e0b' }),

    // Replication
    mkEdge('e-wal-send', 'pgwal',     'walsender', { color: '#10b981', labelText: 'streaming' }),
    mkEdge('e-send-std', 'walsender', 'standby',   { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
