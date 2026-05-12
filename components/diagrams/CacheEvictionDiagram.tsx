'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function CacheEvictionDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Memory pool group
    mkGroup('grp-pool', 0, 0, 760, 130, { label: 'Memory Pool — under pressure', color: '#dc2626' }),
    mkNode('k1', 20,  40, { icon: '🔑', title: 'key:user:1',    sub: 'accessed: 42×', color: '#10b981' }),
    mkNode('k2', 145, 40, { icon: '🔑', title: 'key:sess:9',    sub: 'accessed: 3×',  color: '#f97316', dim: true }),
    mkNode('k3', 270, 40, { icon: '🔑', title: 'key:prod:55',   sub: 'accessed: 18×', color: '#10b981' }),
    mkNode('k4', 395, 40, { icon: '🔑', title: 'key:cart:7',    sub: 'TTL: 2s left',  color: '#f87171', dim: true }),
    mkNode('k5', 520, 40, { icon: '🔑', title: 'key:rate:cl',   sub: 'accessed: 30×', color: '#10b981' }),
    mkNode('k6', 645, 40, { icon: '🔑', title: 'key:cfg:app',   sub: 'accessed: 1×',  color: '#f97316', dim: true }),

    // Trigger
    mkNode('new-write', 0, 175, { icon: '📥', title: 'New Write Arrives', sub: 'Memory at maxmemory limit', color: '#dc2626', badge: 'triggers eviction' }),
    mkNode('policy',  260, 175, { icon: '⚖️', title: 'Eviction Policy',   sub: 'maxmemory-policy',         color: '#a78bfa', badge: 'Redis config' }),

    // Three policy outcomes
    mkNode('lru',    480, 100, { icon: '🕐', title: 'allkeys-lru', sub: 'Evict oldest accessed key',  color: '#f97316', badge: 'evicts k6' }),
    mkNode('lfu',    480, 200, { icon: '📊', title: 'allkeys-lfu', sub: 'Evict least frequent key',   color: '#38bdf8', badge: 'scan-resistant' }),
    mkNode('ttl',    480, 300, { icon: '⏱️', title: 'volatile-ttl', sub: 'Evict soonest expiry key', color: '#f87171', badge: 'evicts k4 (2s TTL)' }),

    // Bottom label
    mkLabel('lbl', 80, 390, { label: 'LFU is scan-resistant; LRU evicts by recency — wrong policy kills hit rate', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-nw-pol', 'new-write', 'policy', { color: '#dc2626', labelText: 'memory full' }),
    mkEdge('e-pol-lru', 'policy', 'lru',     { color: '#f97316' }),
    mkEdge('e-pol-lfu', 'policy', 'lfu',     { color: '#38bdf8' }),
    mkEdge('e-pol-ttl', 'policy', 'ttl',     { color: '#f87171' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
