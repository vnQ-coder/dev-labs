'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function MongoTransactionsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Session + transaction lifecycle
    mkGroup('grp-session', 0, 0, 720, 120, { label: 'Client Session — transaction lifecycle', color: '#38bdf8' }),
    mkNode('session',   20,  45, { icon: '🔑', title: 'Client Session', sub: 'startSession() → logical session ID', color: '#38bdf8', badge: 'driver-managed' }),
    mkNode('txnstart', 270,  45, { icon: '▶️', title: 'startTransaction', sub: 'snapshot read timestamp locked',      color: '#f97316', badge: 'MVCC snapshot' }),
    mkNode('commit',   510,  45, { icon: '✅', title: 'commitTransaction', sub: 'two-phase commit (multi-shard)',       color: '#10b981', badge: 'durable' }),

    // Multi-document writes
    mkGroup('grp-writes', 0, 150, 720, 120, { label: 'Multi-document writes within transaction', color: '#a78bfa' }),
    mkNode('mongod1',   20, 195, { icon: '🗄️', title: 'mongod 1', sub: 'Write to Document A (in-progress)',  color: '#dc2626', badge: 'not visible yet' }),
    mkNode('mongod2',  270, 195, { icon: '🗄️', title: 'mongod 2', sub: 'Write to Document B (in-progress)',  color: '#dc2626', badge: 'not visible yet' }),
    mkNode('coord',    510, 195, { icon: '🎛️', title: 'Coordinator', sub: 'Orchestrates 2PC across shards',   color: '#f97316', badge: '2-phase commit' }),

    // MVCC / Snapshot isolation
    mkGroup('grp-mvcc', 0, 300, 720, 120, { label: 'Snapshot Isolation — MVCC (multi-version concurrency control)', color: '#10b981' }),
    mkNode('snapold',   20, 345, { icon: '📸', title: 'Old Version',  sub: 'Read by concurrent txns at t0',      color: '#64748b', badge: 'WiredTiger snapshot' }),
    mkNode('snapnew',  270, 345, { icon: '✏️', title: 'New Version',  sub: 'Written by this txn, not committed',  color: '#f97316', badge: 'pending' }),
    mkNode('conflict', 510, 345, { icon: '⚠️', title: 'Write Conflict', sub: 'Two txns modify same doc → abort one', color: '#dc2626', badge: 'WriteConflict error' }),

    // Commit / Abort decision
    mkGroup('grp-decision', 0, 450, 720, 120, { label: 'Commit / Abort decision', color: '#f43f5e' }),
    mkNode('abort',     20, 495, { icon: '🚫', title: 'abortTransaction', sub: 'All writes rolled back atomically', color: '#dc2626', badge: 'nothing persisted' }),
    mkNode('prepared', 270, 495, { icon: '🔐', title: 'Prepared State',   sub: 'Participants ack PREPARED',         color: '#f97316', badge: '2PC phase 1' }),
    mkNode('committed',510, 495, { icon: '💾', title: 'Committed',        sub: 'Coordinator writes global commit',  color: '#10b981', badge: '2PC phase 2' }),

    // Retry pattern
    mkGroup('grp-retry', 0, 600, 720, 110, { label: 'Retryable transactions — TransientTransactionError', color: '#64748b' }),
    mkNode('txnerr',    20, 645, { icon: '❌', title: 'TransientTransactionError', sub: 'Network blip or write conflict', color: '#dc2626', badge: 'retryable' }),
    mkNode('retryloop',280, 645, { icon: '🔁', title: 'Retry Loop',       sub: 'Driver restarts entire transaction', color: '#f97316', badge: 'idempotent ops' }),
    mkNode('success',  520, 645, { icon: '🎉', title: 'Success',          sub: 'Transaction committed cleanly',      color: '#10b981', badge: 'ACID' }),

    mkLabel('lbl', 60, 735, { label: 'MongoDB txns: snapshot isolation via MVCC; multi-shard uses 2PC; max 60 s / 1000 docs recommended', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Session lifecycle
    mkEdge('e-sess-txn',    'session',   'txnstart',  { color: '#38bdf8', labelText: 'begin' }),
    mkEdge('e-txn-commit',  'txnstart',  'commit',    { color: '#10b981', labelText: 'all ops done' }),

    // Writes within txn
    mkEdge('e-txn-m1',      'txnstart',  'mongod1',   { color: '#dc2626', labelText: 'write doc A' }),
    mkEdge('e-txn-m2',      'txnstart',  'mongod2',   { color: '#dc2626', labelText: 'write doc B' }),
    mkEdge('e-m1-coord',    'mongod1',   'coord',     { color: '#f97316', dashed: true }),
    mkEdge('e-m2-coord',    'mongod2',   'coord',     { color: '#f97316', dashed: true }),

    // MVCC
    mkEdge('e-old-new',     'snapold',   'snapnew',   { color: '#10b981', labelText: 'new version created' }),
    mkEdge('e-new-conflict','snapnew',   'conflict',  { color: '#dc2626', dashed: true, labelText: 'concurrent write' }),

    // Commit path
    mkEdge('e-coord-prep',  'coord',     'prepared',  { color: '#f97316', labelText: 'phase 1' }),
    mkEdge('e-prep-cmtd',   'prepared',  'committed', { color: '#10b981', labelText: 'phase 2' }),
    mkEdge('e-coord-abort', 'coord',     'abort',     { color: '#dc2626', dashed: true, labelText: 'on failure' }),
    mkEdge('e-conflict-abort','conflict','abort',     { color: '#dc2626', dashed: true }),

    // Retry loop
    mkEdge('e-err-retry',   'txnerr',    'retryloop', { color: '#f97316', labelText: 'catch & retry' }),
    mkEdge('e-retry-succ',  'retryloop', 'success',   { color: '#10b981', labelText: 'commit ok' }),
    mkEdge('e-abort-err',   'abort',     'txnerr',    { color: '#dc2626', dashed: true, labelText: 'may trigger' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
