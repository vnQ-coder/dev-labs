'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PostgresReplicationDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Streaming Replication group
    mkGroup('grp-stream', 0, 0, 700, 130, { label: 'Streaming Replication', color: '#336791' }),
    mkNode('primary',    20,  40, { icon: '🖥',  title: 'Primary',      sub: 'accepts writes',                   color: '#336791', badge: 'leader' }),
    mkNode('walsender',  210, 40, { icon: '📡',  title: 'WAL Sender',   sub: 'synchronous_commit=on/off',        color: '#60a5fa' }),
    mkNode('walrecv',    400, 40, { icon: '📥',  title: 'WAL Receiver', sub: 'applies WAL stream',               color: '#60a5fa' }),
    mkNode('standby',    590, 40, { icon: '🖥',  title: 'Hot Standby',  sub: 'read-only queries',                color: '#10b981', badge: 'reads' }),

    // Logical Replication group
    mkGroup('grp-logical', 0, 155, 700, 130, { label: 'Logical Replication', color: '#f59e0b' }),
    mkNode('pub',        20,  195, { icon: '📢',  title: 'Primary Publication', sub: 'CREATE PUBLICATION',         color: '#f59e0b' }),
    mkNode('decoder',    210, 195, { icon: '🔓',  title: 'Logical Decoder',     sub: 'row-level changes (pgoutput)', color: '#f59e0b' }),
    mkNode('subscriber', 400, 195, { icon: '📬',  title: 'Subscriber DB',        sub: 'cross-version, selective tables', color: '#10b981', badge: 'cross-version' }),

    // Failover orchestration
    mkNode('patroni', 820, 80, {
      icon: '🎯',
      title: 'Patroni / Sentinel',
      sub: 'auto failover orchestration\nleader election via DCS',
      color: '#ef4444',
      badge: 'HA orchestrator',
    }),

    mkLabel('lbl', 80, 330, {
      label: 'Streaming = HA copy; Logical = selective rows, cross-version, zero-downtime upgrades',
      icon: '🔗',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Streaming
    mkEdge('e-prim-send',  'primary',   'walsender',  { color: '#336791' }),
    mkEdge('e-send-recv',  'walsender', 'walrecv',    { color: '#336791', labelText: 'WAL stream' }),
    mkEdge('e-recv-stby',  'walrecv',   'standby',    { color: '#10b981' }),

    // Logical
    mkEdge('e-pub-dec',   'pub',     'decoder',    { color: '#f59e0b', labelText: 'logical decoding' }),
    mkEdge('e-dec-sub',   'decoder', 'subscriber', { color: '#10b981', labelText: 'row changes' }),

    // Patroni monitors primary
    mkEdge('e-pat-prim', 'patroni', 'primary', { color: '#ef4444', dashed: true, labelText: 'monitors' }),
    mkEdge('e-pat-stby', 'patroni', 'standby', { color: '#ef4444', dashed: true, labelText: 'promotes on failure' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
