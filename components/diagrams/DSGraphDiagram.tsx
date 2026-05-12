'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSGraphDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Graph nodes
    mkNode('A', 100, 150, { icon: '🔵', title: 'A', sub: 'start', color: '#10b981', badge: 'BFS origin' }),
    mkNode('B', 280, 50,  { icon: '🔵', title: 'B', sub: 'visit 2nd', color: '#38bdf8' }),
    mkNode('C', 280, 250, { icon: '🔵', title: 'C', sub: 'visit 3rd', color: '#38bdf8' }),
    mkNode('D', 460, 50,  { icon: '🔵', title: 'D', sub: 'visit 4th', color: '#a78bfa' }),
    mkNode('E', 460, 250, { icon: '🔵', title: 'E', sub: 'visit 5th', color: '#a78bfa' }),
    mkNode('F', 640, 150, { icon: '🔵', title: 'F', sub: 'visit 6th', color: '#f59e0b' }),

    // BFS label
    mkLabel('lbl-bfs', 60, 10, {
      label: 'BFS from A: A→B→C→D→E→F (shortest path, queue-based)',
      icon: '🌊',
      color: '#38bdf8',
    }),

    // Adjacency list group
    mkGroup('g-adj', 720, 30, 190, 250, { label: 'Adjacency List', sub: 'sparse graph', color: '#10b981' }),
    mkNode('adj-a', 730, 60,  { title: 'A: [B, C]',   sub: 'degree 2', color: '#10b981' }),
    mkNode('adj-b', 730, 140, { title: 'B: [A,C,D]',  sub: 'degree 3', color: '#38bdf8' }),
    mkNode('adj-c', 730, 220, { title: 'C: [A,B,E]',  sub: 'degree 3', color: '#38bdf8' }),

    // Algorithm badges
    mkLabel('lbl-bfs-badge', 60, 340, {
      label: 'BFS: shortest unweighted path',
      icon: '🌊',
      color: '#38bdf8',
    }),
    mkLabel('lbl-dfs-badge', 290, 340, {
      label: 'DFS: cycle detect / topo sort',
      icon: '🌀',
      color: '#a78bfa',
    }),
    mkLabel('lbl-dijk-badge', 500, 340, {
      label: 'Dijkstra: weighted shortest path',
      icon: '⚖️',
      color: '#f59e0b',
    }),
    mkLabel('lbl-footer', 60, 375, {
      label: 'G=(V,E) — adjacency list for sparse graphs (E<<V²); BFS=queue, DFS=stack',
      icon: '📐',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // BFS highlighted path edges (blue)
    mkEdge('e-AB', 'A', 'B', { color: '#38bdf8', noArrow: false, labelText: '1' }),
    mkEdge('e-AC', 'A', 'C', { color: '#38bdf8', noArrow: false, labelText: '1' }),
    mkEdge('e-BD', 'B', 'D', { color: '#a78bfa', noArrow: false, labelText: '2' }),
    mkEdge('e-CE', 'C', 'E', { color: '#a78bfa', noArrow: false, labelText: '2' }),
    mkEdge('e-DF', 'D', 'F', { color: '#f59e0b', noArrow: false, labelText: '3' }),
    mkEdge('e-EF', 'E', 'F', { color: '#f59e0b', noArrow: false, labelText: '3' }),

    // Cross edge B-C (neutral)
    mkEdge('e-BC', 'B', 'C', { color: '#64748b', animated: false, dashed: true, noArrow: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
