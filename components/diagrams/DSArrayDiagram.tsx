'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSArrayDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Array group
    mkGroup('arr-group', 0, 0, 720, 110, { label: 'Array [0..7] — V8 PACKED_SMI', sub: 'contiguous memory block', color: '#10b981' }),
    mkNode('c0', 10,  20, { title: '[0]', sub: '42',  color: '#64748b', badge: 'idx 0' }, { parentId: 'arr-group' }),
    mkNode('c1', 90,  20, { title: '[1]', sub: '17',  color: '#64748b', badge: 'idx 1' }, { parentId: 'arr-group' }),
    mkNode('c2', 170, 20, { title: '[2]', sub: '99',  color: '#64748b', badge: 'idx 2' }, { parentId: 'arr-group' }),
    mkNode('c3', 250, 20, { title: '[3]', sub: '55',  color: '#10b981', badge: 'O(1) access ✓' }, { parentId: 'arr-group' }),
    mkNode('c4', 370, 20, { title: '[4]', sub: '11',  color: '#64748b', badge: 'idx 4' }, { parentId: 'arr-group' }),
    mkNode('c5', 450, 20, { title: '[5]', sub: '78',  color: '#64748b', badge: 'idx 5' }, { parentId: 'arr-group' }),
    mkNode('c6', 530, 20, { title: '[6]', sub: '33',  color: '#64748b', badge: 'idx 6' }, { parentId: 'arr-group' }),
    mkNode('c7', 610, 20, { title: '[7]', sub: '66',  color: '#64748b', badge: 'idx 7' }, { parentId: 'arr-group' }),

    // Access formula label
    mkLabel('lbl-access', 230, 120, { label: 'O(1) access: base + 3 × 8 = addr', icon: '📍', color: '#10b981' }),

    // Dynamic resize flow
    mkNode('full',     0,   230, { icon: '⚠️', title: 'Array Full',        sub: 'capacity = 4',    color: '#f87171' }),
    mkNode('alloc',    180, 230, { icon: '📦', title: 'Alloc 2× Buffer',   sub: 'new heap region', color: '#f59e0b' }),
    mkNode('copy',     360, 230, { icon: '📋', title: 'Copy n Elements',   sub: 'O(n) one-time',   color: '#a78bfa' }),
    mkNode('newcap',   540, 230, { icon: '✅', title: 'New Capacity = 8',  sub: 'amortized O(1)',  color: '#10b981' }),

    // Bottom label
    mkLabel('lbl', 50, 310, { label: 'O(1) random access; O(n) insert middle; cache-line friendly iteration', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Cell-to-cell adjacency (memory layout)
    mkEdge('e-01', 'c0', 'c1', { color: '#334155', animated: false, noArrow: true }),
    mkEdge('e-12', 'c1', 'c2', { color: '#334155', animated: false, noArrow: true }),
    mkEdge('e-23', 'c2', 'c3', { color: '#10b981', animated: false, noArrow: true }),
    mkEdge('e-34', 'c3', 'c4', { color: '#334155', animated: false, noArrow: true }),
    mkEdge('e-45', 'c4', 'c5', { color: '#334155', animated: false, noArrow: true }),
    mkEdge('e-56', 'c5', 'c6', { color: '#334155', animated: false, noArrow: true }),
    mkEdge('e-67', 'c6', 'c7', { color: '#334155', animated: false, noArrow: true }),

    // Resize flow
    mkEdge('e-full-alloc',  'full',  'alloc',  { color: '#f59e0b' }),
    mkEdge('e-alloc-copy',  'alloc', 'copy',   { color: '#a78bfa' }),
    mkEdge('e-copy-newcap', 'copy',  'newcap', { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
