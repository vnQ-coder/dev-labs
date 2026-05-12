'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSUnionFindDiagram() {
  const nodes: Node[] = useMemo(() => [
    // ── Before path compression ──────────────────────────────────
    mkGroup('g-before', 10, 10, 310, 230, { label: 'Before Find(5)', sub: 'chain: each points to parent', color: '#f59e0b' }),
    mkNode('b0', 140, 40,  { icon: '👑', title: '0', sub: 'root',     color: '#10b981' }),
    mkNode('b1', 140, 100, { title: '1', sub: 'parent=0', color: '#f59e0b' }),
    mkNode('b2', 140, 155, { title: '2', sub: 'parent=1', color: '#f59e0b' }),
    mkNode('b3', 140, 205, { title: '3', sub: 'parent=2', color: '#f59e0b' }),
    // 4 and 5 go slightly right to fit group height
    mkNode('b4', 30,  155, { title: '4', sub: 'parent=3', color: '#f87171' }),
    mkNode('b5', 30,  205, { title: '5', sub: 'parent=4', color: '#f87171', badge: 'Find(5)' }),

    // ── After path compression ───────────────────────────────────
    mkGroup('g-after', 360, 10, 360, 230, { label: 'After Find(5) — path compression', sub: 'all point directly to root', color: '#10b981' }),
    mkNode('a0', 530, 40,  { icon: '👑', title: '0', sub: 'root',      color: '#10b981', badge: 'O(α(n)) ≈ O(1)' }),
    mkNode('a1', 380, 130, { title: '1', sub: 'parent[1]=0', color: '#10b981' }),
    mkNode('a2', 460, 130, { title: '2', sub: 'parent[2]=0', color: '#10b981' }),
    mkNode('a3', 540, 130, { title: '3', sub: 'parent[3]=0', color: '#10b981' }),
    mkNode('a4', 620, 130, { title: '4', sub: 'parent[4]=0', color: '#10b981' }),
    mkNode('a5', 700, 130, { title: '5', sub: 'parent[5]=0', color: '#10b981' }),

    // ── Kruskal MST mini ─────────────────────────────────────────
    mkGroup('g-kruskal', 10, 260, 700, 130, { label: "Kruskal's MST", sub: 'union-find drives MST construction', color: '#a78bfa' }),
    mkNode('ka', 30,  300, { title: 'A', sub: 'component 1', color: '#64748b' }),
    mkNode('kb', 160, 300, { title: 'B', sub: 'component 2', color: '#64748b' }),
    mkNode('kc', 290, 300, { title: 'C', sub: 'component 3', color: '#64748b' }),
    mkNode('kd', 420, 300, { title: 'D', sub: 'component 4', color: '#64748b' }),
    mkNode('kab', 95,  350, { title: 'A+B', sub: 'union(A,B)', color: '#a78bfa' }),
    mkNode('kcd', 355, 350, { title: 'C+D', sub: 'union(C,D)', color: '#a78bfa' }),
    mkNode('kmst', 225, 360, { icon: '🏆', title: 'MST', sub: 'union(B,C) → all connected', color: '#10b981', badge: 'complete' }),

    // Alpha badge and footer
    mkLabel('lbl-alpha', 730, 100, {
      label: 'α(n) ≤ 4 for any practical n — effectively O(1)',
      icon: '⚡',
      color: '#10b981',
    }),
    mkLabel('lbl-footer', 10, 400, {
      label: 'Path compression + union by rank = amortized O(α(n)) ≈ O(1) per operation',
      icon: '💡',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Before — chain pointing up (5→4→3→2→1→0)
    mkEdge('e-b5-b4', 'b5', 'b4', { color: '#f87171', labelText: 'parent' }),
    mkEdge('e-b4-b3', 'b4', 'b3', { color: '#f87171' }),
    mkEdge('e-b3-b2', 'b3', 'b2', { color: '#f59e0b' }),
    mkEdge('e-b2-b1', 'b2', 'b1', { color: '#f59e0b' }),
    mkEdge('e-b1-b0', 'b1', 'b0', { color: '#10b981', labelText: 'root' }),

    // After — all point directly to root 0
    mkEdge('e-a1-a0', 'a1', 'a0', { color: '#10b981' }),
    mkEdge('e-a2-a0', 'a2', 'a0', { color: '#10b981' }),
    mkEdge('e-a3-a0', 'a3', 'a0', { color: '#10b981' }),
    mkEdge('e-a4-a0', 'a4', 'a0', { color: '#10b981' }),
    mkEdge('e-a5-a0', 'a5', 'a0', { color: '#10b981' }),

    // Kruskal MST steps
    mkEdge('e-ka-kab', 'ka', 'kab', { color: '#a78bfa', animated: false }),
    mkEdge('e-kb-kab', 'kb', 'kab', { color: '#a78bfa', animated: false }),
    mkEdge('e-kc-kcd', 'kc', 'kcd', { color: '#a78bfa', animated: false }),
    mkEdge('e-kd-kcd', 'kd', 'kcd', { color: '#a78bfa', animated: false }),
    mkEdge('e-kab-mst', 'kab', 'kmst', { color: '#10b981', labelText: 'union(B,C)' }),
    mkEdge('e-kcd-mst', 'kcd', 'kmst', { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
