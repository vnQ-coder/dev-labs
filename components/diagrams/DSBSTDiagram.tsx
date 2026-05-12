'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSBSTDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Main BST — search path for 40 highlighted in amber (#f59e0b)
    mkNode('n50', 420, 20, { icon: '🌳', title: '50', sub: 'root', color: '#f59e0b', badge: 'search 40→' }),
    mkNode('n30', 240, 120, { icon: '🔢', title: '30', sub: '< 50', color: '#f59e0b' }),
    mkNode('n70', 600, 120, { icon: '🔢', title: '70', sub: '> 50', color: '#64748b' }),
    mkNode('n20', 140, 220, { icon: '🔢', title: '20', sub: '< 30', color: '#64748b' }),
    mkNode('n40', 340, 220, { icon: '🔢', title: '40', sub: 'FOUND ✓', color: '#f59e0b', badge: 'target' }),
    mkNode('n60', 500, 220, { icon: '🔢', title: '60', sub: '< 70', color: '#64748b' }),
    mkNode('n80', 700, 220, { icon: '🔢', title: '80', sub: '> 70', color: '#64748b' }),
    mkNode('n35', 280, 320, { icon: '🔢', title: '35', sub: '> 30 < 40', color: '#64748b' }),
    mkNode('n45', 400, 320, { icon: '🔢', title: '45', sub: '> 40', color: '#64748b' }),

    // Degenerate tree (right side)
    mkGroup('g-degen', 790, 30, 160, 320, { label: 'Degenerate Tree', sub: 'sorted input worst-case', color: '#f87171' }),
    mkNode('d1', 820, 60,  { title: '1', color: '#f87171' }),
    mkNode('d2', 820, 140, { title: '2', color: '#f87171' }),
    mkNode('d3', 820, 220, { title: '3', color: '#f87171' }),
    mkNode('d4', 820, 300, { title: '4', color: '#f87171', badge: 'O(n) on sorted input!' }),

    // Labels
    mkLabel('lbl-inorder', 90, 390, {
      label: 'In-order = sorted: 20, 30, 35, 40, 45, 50, 60, 70, 80',
      icon: '📋',
      color: '#10b981',
    }),
    mkLabel('lbl-invariant', 90, 420, {
      label: 'BST invariant: left < root < right at every node — balanced = O(log n)',
      icon: '⚖️',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Search path (amber)
    mkEdge('e-50-30', 'n50', 'n30', { color: '#f59e0b', labelText: 'go left' }),
    mkEdge('e-30-40', 'n30', 'n40', { color: '#f59e0b', labelText: 'go right' }),

    // Rest of BST (neutral)
    mkEdge('e-50-70', 'n50', 'n70', { color: '#64748b', animated: false }),
    mkEdge('e-30-20', 'n30', 'n20', { color: '#64748b', animated: false }),
    mkEdge('e-70-60', 'n70', 'n60', { color: '#64748b', animated: false }),
    mkEdge('e-70-80', 'n70', 'n80', { color: '#64748b', animated: false }),
    mkEdge('e-40-35', 'n40', 'n35', { color: '#64748b', animated: false }),
    mkEdge('e-40-45', 'n40', 'n45', { color: '#64748b', animated: false }),

    // Degenerate chain
    mkEdge('e-d1-d2', 'd1', 'd2', { color: '#f87171', animated: false }),
    mkEdge('e-d2-d3', 'd2', 'd3', { color: '#f87171', animated: false }),
    mkEdge('e-d3-d4', 'd3', 'd4', { color: '#f87171', animated: false }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
