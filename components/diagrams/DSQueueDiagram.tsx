'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSQueueDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Circular buffer group
    mkGroup('buf-group', 0, 0, 760, 130, { label: 'Circular Buffer (capacity = 8)', sub: 'head = index 2 (dequeue end), tail = index 5 (enqueue end)', color: '#10b981' }),
    mkNode('cb0', 10,  25, { title: '[0]', sub: 'empty', color: '#334155' }, { parentId: 'buf-group' }),
    mkNode('cb1', 85,  25, { title: '[1]', sub: 'empty', color: '#334155' }, { parentId: 'buf-group' }),
    mkNode('cb2', 160, 25, { title: '[2]', sub: 'data',  color: '#10b981', badge: '← HEAD' }, { parentId: 'buf-group' }),
    mkNode('cb3', 270, 25, { title: '[3]', sub: 'data',  color: '#10b981' }, { parentId: 'buf-group' }),
    mkNode('cb4', 380, 25, { title: '[4]', sub: 'data',  color: '#10b981', badge: 'occupied' }, { parentId: 'buf-group' }),
    mkNode('cb5', 490, 25, { title: '[5]', sub: 'empty', color: '#f59e0b', badge: '← TAIL' }, { parentId: 'buf-group' }),
    mkNode('cb6', 580, 25, { title: '[6]', sub: 'empty', color: '#334155' }, { parentId: 'buf-group' }),
    mkNode('cb7', 655, 25, { title: '[7]', sub: 'empty', color: '#334155' }, { parentId: 'buf-group' }),

    // Wrap-around label
    mkLabel('lbl-wrap', 280, 140, { label: 'wrap-around: [7] → [0] (mod 8)', icon: '🔄', color: '#10b981' }),

    // BFS Level-Order mini
    mkGroup('bfs-group', 0, 200, 760, 180, { label: 'BFS Level-Order Traversal', sub: 'Queue drives level-by-level processing', color: '#a78bfa' }),
    mkNode('root',   20,  40, { icon: '🌳', title: 'Root',    sub: 'Level 0', color: '#a78bfa', badge: 'enqueue first' }, { parentId: 'bfs-group' }),
    mkNode('bfs-q0', 200, 40, { icon: '📥', title: 'Queue',   sub: '[root]',  color: '#a78bfa', badge: 'Level 0' },       { parentId: 'bfs-group' }),
    mkNode('nodeA',  20,  120,{ icon: '🌿', title: 'Node A',  sub: 'Level 1', color: '#10b981' }, { parentId: 'bfs-group' }),
    mkNode('nodeB',  120, 120,{ icon: '🌿', title: 'Node B',  sub: 'Level 1', color: '#10b981' }, { parentId: 'bfs-group' }),
    mkNode('bfs-q1', 310, 120,{ icon: '📥', title: 'Queue',   sub: '[A, B]',  color: '#10b981', badge: 'Level 1' },      { parentId: 'bfs-group' }),
    mkNode('nodeC',  430, 40, { icon: '🌱', title: 'Node C',  sub: 'Level 2', color: '#34d399' }, { parentId: 'bfs-group' }),
    mkNode('nodeD',  530, 40, { icon: '🌱', title: 'Node D',  sub: 'Level 2', color: '#34d399' }, { parentId: 'bfs-group' }),
    mkNode('bfs-q2', 610, 40, { icon: '📥', title: 'Queue',   sub: '[C, D]',  color: '#34d399', badge: 'Level 2' },      { parentId: 'bfs-group' }),

    // Bottom label
    mkLabel('lbl', 50, 400, { label: 'Circular buffer = O(1) enqueue+dequeue; Array.shift() is O(n) — never use for hot path', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Buffer adjacency
    mkEdge('e-00-01', 'cb0', 'cb1', { color: '#334155', animated: false, noArrow: true }),
    mkEdge('e-01-02', 'cb1', 'cb2', { color: '#10b981', animated: false }),
    mkEdge('e-02-03', 'cb2', 'cb3', { color: '#10b981', animated: false, noArrow: true }),
    mkEdge('e-03-04', 'cb3', 'cb4', { color: '#10b981', animated: false, noArrow: true }),
    mkEdge('e-04-05', 'cb4', 'cb5', { color: '#f59e0b', animated: false }),
    mkEdge('e-05-06', 'cb5', 'cb6', { color: '#334155', animated: false, noArrow: true }),
    mkEdge('e-06-07', 'cb6', 'cb7', { color: '#334155', animated: false, noArrow: true }),
    // Wrap-around
    mkEdge('e-07-00', 'cb7', 'cb0', { color: '#10b981', dashed: true, labelText: 'wrap' }),

    // BFS level 0 → level 1
    mkEdge('e-root-q0',   'root',   'bfs-q0', { color: '#a78bfa', labelText: 'enqueue' }),
    mkEdge('e-q0-a',      'bfs-q0', 'nodeA',  { color: '#10b981', labelText: 'dequeue→visit' }),
    mkEdge('e-q0-b',      'bfs-q0', 'nodeB',  { color: '#10b981' }),
    mkEdge('e-ab-q1',     'nodeA',  'bfs-q1', { color: '#10b981', labelText: 'enqueue children' }),
    mkEdge('e-b-q1',      'nodeB',  'bfs-q1', { color: '#10b981' }),

    // BFS level 1 → level 2
    mkEdge('e-q1-c',      'bfs-q1', 'nodeC',  { color: '#34d399', labelText: 'dequeue→visit' }),
    mkEdge('e-q1-d',      'bfs-q1', 'nodeD',  { color: '#34d399' }),
    mkEdge('e-cd-q2',     'nodeC',  'bfs-q2', { color: '#34d399', labelText: 'enqueue' }),
    mkEdge('e-d-q2',      'nodeD',  'bfs-q2', { color: '#34d399' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
