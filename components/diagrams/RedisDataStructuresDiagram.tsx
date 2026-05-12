'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function RedisDataStructuresDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Client
    mkNode('client', 0, 180, { icon: '💻', title: 'Client App', sub: 'Redis client', color: '#64748b' }),

    // 5 data type nodes
    mkNode('string',     220, 0,   { icon: '🔤', title: 'String',     sub: 'SET / GET / INCR',       color: '#dc2626', badge: 'O(1)' }),
    mkNode('list',       220, 90,  { icon: '📋', title: 'List',       sub: 'LPUSH / BRPOP',          color: '#f97316', badge: 'O(1) push/pop' }),
    mkNode('hash',       220, 180, { icon: '#️⃣', title: 'Hash',       sub: 'HSET / HGET',            color: '#38bdf8', badge: 'O(1)' }),
    mkNode('set',        220, 270, { icon: '🔵', title: 'Set',        sub: 'SADD / SISMEMBER',       color: '#10b981', badge: 'O(1)' }),
    mkNode('sortedset',  220, 360, { icon: '🏆', title: 'Sorted Set', sub: 'ZADD / ZRANGE',          color: '#a78bfa', badge: 'O(log n)' }),

    // Use case nodes
    mkNode('uc-string',    440, 0,   { icon: '🔢', title: 'Counter / Token', sub: 'Rate limits, sessions', color: '#dc2626' }),
    mkNode('uc-list',      440, 90,  { icon: '📬', title: 'Job Queue',        sub: 'Task workers',          color: '#f97316' }),
    mkNode('uc-hash',      440, 180, { icon: '📦', title: 'Object Store',     sub: 'User profiles, carts',  color: '#38bdf8' }),
    mkNode('uc-set',       440, 270, { icon: '👥', title: 'Unique Members',   sub: 'Online users, tags',    color: '#10b981' }),
    mkNode('uc-sortedset', 440, 360, { icon: '🥇', title: 'Leaderboard',      sub: 'Scores, rankings',      color: '#a78bfa' }),

    // Bottom label
    mkLabel('lbl', 100, 460, { label: 'Each type = atomic commands + O(1)/O(log n) guarantees', icon: '⚡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Client to data types
    mkEdge('e-c-str', 'client', 'string',    { color: '#dc2626' }),
    mkEdge('e-c-lst', 'client', 'list',      { color: '#f97316' }),
    mkEdge('e-c-hsh', 'client', 'hash',      { color: '#38bdf8' }),
    mkEdge('e-c-set', 'client', 'set',       { color: '#10b981' }),
    mkEdge('e-c-ss',  'client', 'sortedset', { color: '#a78bfa' }),

    // Data types to use cases
    mkEdge('e-str-uc', 'string',    'uc-string',    { color: '#dc2626' }),
    mkEdge('e-lst-uc', 'list',      'uc-list',      { color: '#f97316' }),
    mkEdge('e-hsh-uc', 'hash',      'uc-hash',      { color: '#38bdf8' }),
    mkEdge('e-set-uc', 'set',       'uc-set',       { color: '#10b981' }),
    mkEdge('e-ss-uc',  'sortedset', 'uc-sortedset', { color: '#a78bfa' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
