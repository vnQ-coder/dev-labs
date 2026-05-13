'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function MongoReplicationDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Replica Set group
    mkGroup('grp-rs', 0, 0, 720, 130, { label: 'Replica Set — 3 members, single primary', color: '#10b981' }),
    mkNode('primary',    20,  40, { icon: '👑', title: 'Primary',     sub: 'Read + Write, oplog producer', color: '#dc2626', badge: 'election winner' }),
    mkNode('sec1',      280,  40, { icon: '📋', title: 'Secondary 1', sub: 'Async replication via oplog',  color: '#10b981', badge: 'read-only' }),
    mkNode('sec2',      510,  40, { icon: '📋', title: 'Secondary 2', sub: 'Async replication via oplog',  color: '#10b981', badge: 'read-only' }),

    // Oplog group
    mkGroup('grp-oplog', 0, 155, 720, 100, { label: 'Oplog — capped collection on primary', color: '#f97316' }),
    mkNode('oplog',      20, 195, { icon: '📜', title: 'Oplog', sub: 'Ordered operation log (capped)',    color: '#f97316', badge: 'tailable cursor' }),
    mkNode('opapply1',  280, 195, { icon: '🔄', title: 'Apply Ops',  sub: 'Secondary 1 pulls & applies',  color: '#10b981' }),
    mkNode('opapply2',  510, 195, { icon: '🔄', title: 'Apply Ops',  sub: 'Secondary 2 pulls & applies',  color: '#10b981' }),

    // Write concern group
    mkGroup('grp-wc', 0, 285, 720, 110, { label: 'Write Concern — durability guarantees', color: '#38bdf8' }),
    mkNode('wc0',        20, 325, { icon: '⚡', title: 'w:0',        sub: 'Fire and forget',              color: '#64748b', badge: 'fastest / no ack' }),
    mkNode('wc1',       230, 325, { icon: '✅', title: 'w:1',        sub: 'Ack from primary only',         color: '#f97316', badge: 'default' }),
    mkNode('wcmaj',     450, 325, { icon: '🔒', title: 'w:majority', sub: 'Ack from majority of members', color: '#10b981', badge: 'safest' }),

    // Client + read preference
    mkGroup('grp-client', 0, 425, 720, 110, { label: 'Client — read preference routing', color: '#a78bfa' }),
    mkNode('client',     20, 465, { icon: '💻', title: 'Client',        sub: 'Application driver',       color: '#64748b' }),
    mkNode('rpprimary', 230, 465, { icon: '📖', title: 'primary',       sub: 'Reads go to primary only', color: '#dc2626', badge: 'strong consistency' }),
    mkNode('rpsec',     470, 465, { icon: '📖', title: 'secondaryPreferred', sub: 'Reads go to secondaries', color: '#10b981', badge: 'eventual consistency' }),

    // Election group
    mkGroup('grp-elect', 0, 565, 720, 120, { label: 'Election — Raft-based automatic failover', color: '#f43f5e' }),
    mkNode('primfail',   20, 605, { icon: '💥', title: 'Primary Fails', sub: 'No heartbeat detected',    color: '#dc2626', badge: 'timeout 10 s' }),
    mkNode('vote',      230, 605, { icon: '🗳️', title: 'Vote',          sub: 'Secondaries vote (majority needed)', color: '#f97316' }),
    mkNode('newprimary',490, 605, { icon: '👑', title: 'New Primary',   sub: 'Elected secondary promoted', color: '#10b981', badge: 'rollback old primary' }),

    mkLabel('lbl', 60, 710, { label: 'Oplog is idempotent — secondaries can re-apply safely; election requires majority of voting members', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Replication
    mkEdge('e-pri-op',   'primary',  'oplog',    { color: '#f97316', labelText: 'writes to oplog' }),
    mkEdge('e-op-ap1',   'oplog',    'opapply1', { color: '#10b981', dashed: true, labelText: 'tailable cursor pull' }),
    mkEdge('e-op-ap2',   'oplog',    'opapply2', { color: '#10b981', dashed: true }),
    mkEdge('e-ap1-sec1', 'opapply1', 'sec1',     { color: '#10b981', labelText: 'applied' }),
    mkEdge('e-ap2-sec2', 'opapply2', 'sec2',     { color: '#10b981' }),

    // Write concern
    mkEdge('e-wc0-pri',  'primary',  'wc0',      { color: '#64748b', dashed: true }),
    mkEdge('e-wc1-pri',  'primary',  'wc1',      { color: '#f97316', dashed: true }),
    mkEdge('e-wcm-pri',  'primary',  'wcmaj',    { color: '#10b981', dashed: true }),

    // Client reads
    mkEdge('e-cli-rpp',  'client',   'rpprimary', { color: '#dc2626', labelText: 'readPreference' }),
    mkEdge('e-cli-rps',  'client',   'rpsec',     { color: '#10b981' }),
    mkEdge('e-rpp-pri',  'rpprimary','primary',   { color: '#dc2626', dashed: true }),
    mkEdge('e-rps-sec1', 'rpsec',    'sec1',      { color: '#10b981', dashed: true }),
    mkEdge('e-rps-sec2', 'rpsec',    'sec2',      { color: '#10b981', dashed: true }),

    // Election flow
    mkEdge('e-fail-vote',  'primfail',   'vote',       { color: '#f97316', labelText: 'triggers election' }),
    mkEdge('e-vote-newp',  'vote',       'newprimary', { color: '#10b981', labelText: 'majority wins' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
