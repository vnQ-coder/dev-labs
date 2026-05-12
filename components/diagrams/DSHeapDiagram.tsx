'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSHeapDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Min-heap tree
    mkNode('h1',  420, 10,  { icon: '👑', title: '1', sub: 'root (min)', color: '#10b981', badge: 'O(1) peek min' }),
    mkNode('h3',  280, 100, { icon: '🔢', title: '3', sub: 'left child', color: '#10b981' }),
    mkNode('h5',  560, 100, { icon: '🔢', title: '5', sub: 'right child', color: '#10b981' }),
    mkNode('h7',  180, 200, { icon: '🔢', title: '7', color: '#a78bfa' }),
    mkNode('h4',  340, 200, { icon: '🔢', title: '4', color: '#a78bfa' }),
    mkNode('h8',  480, 200, { icon: '🔢', title: '8', color: '#a78bfa' }),
    mkNode('h9',  640, 200, { icon: '🔢', title: '9', color: '#a78bfa' }),

    // Array representation group
    mkGroup('g-arr', 60, 295, 780, 70, { label: 'Array Representation', sub: 'indices 0–6', color: '#f59e0b' }),
    mkNode('a0', 80,  315, { title: '1', sub: 'idx 0', color: '#10b981' }),
    mkNode('a1', 200, 315, { title: '3', sub: 'idx 1', color: '#10b981' }),
    mkNode('a2', 320, 315, { title: '5', sub: 'idx 2', color: '#10b981' }),
    mkNode('a3', 430, 315, { title: '7', sub: 'idx 3', color: '#a78bfa' }),
    mkNode('a4', 540, 315, { title: '4', sub: 'idx 4', color: '#a78bfa' }),
    mkNode('a5', 650, 315, { title: '8', sub: 'idx 5', color: '#a78bfa' }),
    mkNode('a6', 760, 315, { title: '9', sub: 'idx 6', color: '#a78bfa' }),

    // Index math labels
    mkLabel('lbl-parent', 60, 395, {
      label: 'parent(i) = ⌊(i-1)/2⌋',
      icon: '⬆️',
      color: '#f59e0b',
    }),
    mkLabel('lbl-children', 320, 395, {
      label: 'left = 2i+1  |  right = 2i+2',
      icon: '⬇️',
      color: '#f59e0b',
    }),
    mkLabel('lbl-footer', 60, 425, {
      label: 'Complete binary tree in array — no pointers, perfect cache locality, O(log n) insert/extract',
      icon: '💡',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Tree edges
    mkEdge('e-1-3', 'h1', 'h3', { color: '#10b981' }),
    mkEdge('e-1-5', 'h1', 'h5', { color: '#10b981' }),
    mkEdge('e-3-7', 'h3', 'h7', { color: '#a78bfa', animated: false }),
    mkEdge('e-3-4', 'h3', 'h4', { color: '#a78bfa', animated: false }),
    mkEdge('e-5-8', 'h5', 'h8', { color: '#a78bfa', animated: false }),
    mkEdge('e-5-9', 'h5', 'h9', { color: '#a78bfa', animated: false }),

    // Sift-down arrow from root
    mkEdge('e-sift', 'h1', 'h3', { color: '#f59e0b', dashed: true, labelText: 'sift-down after extract-min', animated: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
