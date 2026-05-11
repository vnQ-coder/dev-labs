'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

type Mode = 'hit' | 'miss';

export default function ProxyDiagram() {
  const [mode, setMode] = useState<Mode>('miss');

  useEffect(() => {
    const id = setInterval(() => setMode(m => m === 'miss' ? 'hit' : 'miss'), 2200);
    return () => clearInterval(id);
  }, []);

  const isHit = mode === 'hit';

  const nodes: Node[] = useMemo(() => [
    mkNode('client', 0,   160, { icon: '💻', title: 'Client',      sub: 'makes request',          color: '#38bdf8' }),
    mkNode('proxy',  220, 160, {
      icon: '🛡️', title: 'Proxy',
      sub: 'access control · caching · logging',
      color: '#a78bfa',
      badge: isHit ? '✅ Cache HIT' : '🔍 Cache MISS',
      pills: [{ label: isHit ? 'Returns cached data' : 'Forwarding to real subject', color: isHit ? '#34d399' : '#f59e0b' }],
    }),
    mkNode('cache',  480, 60,  { icon: '⚡', title: 'Cache',       sub: 'in-memory store',        color: '#34d399', dim: !isHit }),
    mkNode('real',   480, 280, { icon: '🏦', title: 'Real Subject', sub: 'expensive operation',   color: '#f59e0b', dim: isHit }),
    mkLabel('lbl',   80,  370, { label: 'Proxy intercepts requests — caches, validates, or logs before delegating', color: '#a78bfa' }),
  ], [isHit]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'client', 'proxy', { color: '#38bdf8' }),
    ...(isHit
      ? [mkEdge('e2', 'proxy', 'cache', { color: '#34d399', labelText: 'return cached' })]
      : [mkEdge('e3', 'proxy', 'real',  { color: '#f59e0b', labelText: 'forward request' })]),
  ], [isHit]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
