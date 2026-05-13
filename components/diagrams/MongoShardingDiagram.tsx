'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function MongoShardingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Application + mongos
    mkGroup('grp-app', 0, 0, 720, 110, { label: 'Application tier — query routing', color: '#64748b' }),
    mkNode('app',     20,  40, { icon: '💻', title: 'Application',  sub: 'Connects to mongos',                color: '#64748b' }),
    mkNode('mongos',  280,  40, { icon: '🔀', title: 'mongos',      sub: 'Query router — no data stored',     color: '#38bdf8', badge: 'stateless router' }),
    mkNode('cfgsrv',  510,  40, { icon: '🗂️',  title: 'Config Servers', sub: 'Chunk metadata + shard map',  color: '#f97316', badge: 'replica set (CSRS)' }),

    // Shard key routing
    mkGroup('grp-routing', 0, 140, 720, 120, { label: 'Shard key routing strategies', color: '#a78bfa' }),
    mkNode('hashroute',  20, 185, { icon: '🔢', title: 'Hashed Sharding',  sub: 'hash(shardKey) → uniform distribution', color: '#a78bfa', badge: 'avoids hot spots' }),
    mkNode('rangeroute', 350, 185, { icon: '📏', title: 'Range Sharding',   sub: 'min ≤ shardKey < max',                  color: '#f97316', badge: 'range scan efficient' }),

    // Shards
    mkGroup('grp-shards', 0, 290, 720, 160, { label: 'Shards — each is a replica set', color: '#10b981' }),
    mkNode('shard1',  20,  355, { icon: '⚡', title: 'Shard 1',  sub: 'Primary + 2 Secondaries', color: '#dc2626', badge: 'chunk range A–F',  pills: [{ label: 'replica set', color: '#64748b' }] }),
    mkNode('shard2',  270, 355, { icon: '⚡', title: 'Shard 2',  sub: 'Primary + 2 Secondaries', color: '#f97316', badge: 'chunk range G–P',  pills: [{ label: 'replica set', color: '#64748b' }] }),
    mkNode('shard3',  520, 355, { icon: '⚡', title: 'Shard 3',  sub: 'Primary + 2 Secondaries', color: '#10b981', badge: 'chunk range Q–Z',  pills: [{ label: 'replica set', color: '#64748b' }] }),

    // Query types
    mkGroup('grp-query', 0, 480, 720, 110, { label: 'Query patterns', color: '#38bdf8' }),
    mkNode('targeted',    20, 520, { icon: '🎯', title: 'Targeted Query',      sub: 'shard key in filter → 1 shard',       color: '#10b981', badge: 'fast' }),
    mkNode('scatter',    350, 520, { icon: '📡', title: 'Scatter-Gather',       sub: 'no shard key → fan-out to all shards', color: '#dc2626', badge: 'expensive' }),

    // Chunk migration
    mkNode('balancer',   20, 625, { icon: '⚖️', title: 'Balancer',  sub: 'Moves chunks between shards to equalize', color: '#a78bfa', badge: 'background process' }),
    mkNode('chunk',     320, 625, { icon: '📦', title: 'Chunk Migration', sub: 'max chunk size 128 MB (default)',     color: '#f97316', badge: 'zero-downtime move' }),

    mkLabel('lbl', 60, 720, { label: 'Choose shard key carefully — a bad key causes hot spots and uneven chunk distribution', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // App → mongos → config servers
    mkEdge('e-app-mongos',    'app',        'mongos',      { color: '#38bdf8', labelText: 'query / write' }),
    mkEdge('e-mongos-cfg',    'mongos',     'cfgsrv',      { color: '#f97316', dashed: true, labelText: 'lookup chunk map' }),

    // mongos → shards
    mkEdge('e-mongos-s1',     'mongos',     'shard1',      { color: '#dc2626', labelText: 'route' }),
    mkEdge('e-mongos-s2',     'mongos',     'shard2',      { color: '#f97316' }),
    mkEdge('e-mongos-s3',     'mongos',     'shard3',      { color: '#10b981' }),

    // Routing strategies → mongos
    mkEdge('e-hash-mongos',   'hashroute',  'mongos',      { color: '#a78bfa', dashed: true, labelText: 'uniform spread' }),
    mkEdge('e-range-mongos',  'rangeroute', 'mongos',      { color: '#f97316', dashed: true }),

    // Query patterns
    mkEdge('e-tgt-s1',        'targeted',   'shard1',      { color: '#10b981', labelText: '1 shard hit' }),
    mkEdge('e-scat-s1',       'scatter',    'shard1',      { color: '#dc2626', dashed: true }),
    mkEdge('e-scat-s2',       'scatter',    'shard2',      { color: '#dc2626', dashed: true }),
    mkEdge('e-scat-s3',       'scatter',    'shard3',      { color: '#dc2626', dashed: true }),

    // Balancer chunk migration
    mkEdge('e-bal-chunk',     'balancer',   'chunk',       { color: '#a78bfa', labelText: 'triggers migration' }),
    mkEdge('e-chunk-s1',      'chunk',      'shard1',      { color: '#f97316', dashed: true }),
    mkEdge('e-chunk-s2',      'chunk',      'shard2',      { color: '#f97316', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
