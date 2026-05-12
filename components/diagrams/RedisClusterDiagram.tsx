'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function RedisClusterDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Replication group
    mkGroup('grp-rep', 0, 0, 620, 110, { label: 'Replication — single primary', color: '#10b981' }),
    mkNode('primary',  20,  35, { icon: '👑', title: 'Primary',   sub: 'Read + Write',           color: '#dc2626', badge: 'leader' }),
    mkNode('rep1',    260,  35, { icon: '📋', title: 'Replica 1', sub: 'Async replication',       color: '#10b981', badge: 'read-only' }),
    mkNode('rep2',    470,  35, { icon: '📋', title: 'Replica 2', sub: 'Async replication',       color: '#10b981', badge: 'read-only' }),

    // Sentinel group
    mkGroup('grp-sentinel', 0, 140, 700, 130, { label: 'Sentinel HA — automatic failover', color: '#f97316' }),
    mkNode('sent1',    20, 185, { icon: '🔭', title: 'Sentinel 1', sub: 'Monitors primary',      color: '#f97316' }),
    mkNode('sent2',   180, 185, { icon: '🔭', title: 'Sentinel 2', sub: 'Monitors primary',      color: '#f97316' }),
    mkNode('sent3',   340, 185, { icon: '🔭', title: 'Sentinel 3', sub: 'Quorum vote (2 of 3)',  color: '#f97316', badge: 'majority quorum' }),
    mkNode('sent-pri',540, 185, { icon: '👑', title: 'New Primary', sub: 'Elected on failure',   color: '#10b981', badge: 'promoted replica' }),

    // Cluster group
    mkGroup('grp-cluster', 0, 305, 820, 160, { label: 'Cluster — 3 shards, 16,384 hash slots', color: '#38bdf8' }),
    mkNode('cli',       20, 360, { icon: '💻', title: 'Client',     sub: 'MOVED redirect',       color: '#64748b' }),
    mkNode('shard1',   200, 330, { icon: '⚡', title: 'Shard 1',   sub: 'Primary + Replica',    color: '#dc2626', badge: 'slots 0–5460',     pills: [{ label: '1 replica', color: '#64748b' }] }),
    mkNode('shard2',   200, 390, { icon: '⚡', title: 'Shard 2',   sub: 'Primary + Replica',    color: '#f97316', badge: 'slots 5461–10922', pills: [{ label: '1 replica', color: '#64748b' }] }),
    mkNode('shard3',   200, 440, { icon: '⚡', title: 'Shard 3',   sub: 'Primary + Replica',    color: '#a78bfa', badge: 'slots 10923–16383',pills: [{ label: '1 replica', color: '#64748b' }] }),
    mkNode('crc16',    460, 385, {
      icon: '🔢',
      title: 'CRC16 Hash Slot',
      sub: 'CRC16(key) % 16384',
      color: '#38bdf8',
      badge: 'MOVED → correct shard',
    }),

    // Bottom label
    mkLabel('lbl', 80, 490, { label: 'Sentinel = HA for one shard; Cluster = sharding across 16,384 slots', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Replication
    mkEdge('e-pri-r1', 'primary', 'rep1', { color: '#10b981', dashed: true, labelText: 'async replication' }),
    mkEdge('e-pri-r2', 'primary', 'rep2', { color: '#10b981', dashed: true }),

    // Sentinel monitoring
    mkEdge('e-s1-pri', 'sent1', 'sent3',   { color: '#f97316', labelText: 'PING / heartbeat' }),
    mkEdge('e-s2-pri', 'sent2', 'sent3',   { color: '#f97316' }),
    mkEdge('e-s3-elect','sent3', 'sent-pri',{ color: '#10b981', labelText: 'elect' }),

    // Cluster routing
    mkEdge('e-cli-s1', 'cli', 'shard1', { color: '#dc2626', labelText: 'hash key' }),
    mkEdge('e-cli-s2', 'cli', 'shard2', { color: '#f97316' }),
    mkEdge('e-cli-s3', 'cli', 'shard3', { color: '#a78bfa' }),
    mkEdge('e-s1-crc', 'shard1', 'crc16', { color: '#38bdf8', dashed: true }),
    mkEdge('e-s2-crc', 'shard2', 'crc16', { color: '#38bdf8', dashed: true }),
    mkEdge('e-s3-crc', 'shard3', 'crc16', { color: '#38bdf8', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
