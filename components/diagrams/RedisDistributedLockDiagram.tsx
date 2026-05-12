'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function RedisDistributedLockDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Acquire group
    mkGroup('grp-acquire', 0, 0, 740, 250, { label: 'Lock Acquisition', color: '#dc2626' }),

    // 3 servers competing
    mkNode('srv1',   20,  50, { icon: '🖥️', title: 'Server 1',  sub: 'Competing for lock', color: '#64748b' }),
    mkNode('srv2',   20, 140, { icon: '🖥️', title: 'Server 2',  sub: 'Competing for lock', color: '#64748b' }),
    mkNode('srv3',   20, 215, { icon: '🖥️', title: 'Server 3',  sub: 'Competing for lock', color: '#64748b', dim: true }),

    // Redis with SET NX command
    mkNode('redis',  270, 120, {
      icon: '⚡',
      title: 'Redis',
      sub: 'Atomic lock store',
      color: '#dc2626',
      badge: 'SET lock:res UUID NX PX 30000',
      pills: [
        { label: 'NX = only if not exists', color: '#dc2626' },
        { label: 'PX 30000 = TTL 30s', color: '#f97316' },
      ],
    }),

    // Outcomes
    mkNode('acquired', 540,  50, { icon: '🔓', title: '✓ Lock Acquired', sub: 'Server 1 wins',    color: '#10b981', badge: 'UUID token stored' }),
    mkNode('retry1',   540, 155, { icon: '⏳', title: '⏳ Retry',        sub: 'Server 2 waits',   color: '#64748b', dim: true }),
    mkNode('retry2',   540, 215, { icon: '⏳', title: '⏳ Retry',        sub: 'Server 3 waits',   color: '#64748b', dim: true }),

    // Release group
    mkGroup('grp-release', 0, 275, 740, 140, { label: 'Lock Release — safe via Lua script', color: '#10b981' }),
    mkNode('srv1-rel',  20, 325, { icon: '🖥️', title: 'Server 1',    sub: 'Releases lock',         color: '#10b981' }),
    mkNode('lua',      230, 325, {
      icon: '📜',
      title: 'Lua Script',
      sub: 'Atomic GET + DEL',
      color: '#a78bfa',
      badge: 'if token matches → DEL',
      pills: [{ label: 'Atomic — no race condition', color: '#a78bfa' }],
    }),
    mkNode('released', 530, 325, { icon: '🔒', title: 'Lock Released', sub: 'Other servers can acquire', color: '#10b981' }),

    // Bottom label
    mkLabel('lbl', 80, 435, { label: 'NX = atomic; UUID token = safe release; TTL = crash safety', icon: '🔐', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Acquire attempts
    mkEdge('e-s1-redis', 'srv1', 'redis', { color: '#dc2626', labelText: 'SET NX' }),
    mkEdge('e-s2-redis', 'srv2', 'redis', { color: '#64748b' }),
    mkEdge('e-s3-redis', 'srv3', 'redis', { color: '#64748b', animated: false }),

    // Outcomes
    mkEdge('e-redis-acq',  'redis', 'acquired', { color: '#10b981', labelText: 'OK (1st)' }),
    mkEdge('e-redis-ret1', 'redis', 'retry1',   { color: '#64748b', animated: false, labelText: 'nil' }),
    mkEdge('e-redis-ret2', 'redis', 'retry2',   { color: '#64748b', animated: false }),

    // Release path
    mkEdge('e-rel-lua',  'srv1-rel', 'lua',      { color: '#a78bfa' }),
    mkEdge('e-lua-done', 'lua',      'released', { color: '#10b981', labelText: 'DEL confirmed' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
