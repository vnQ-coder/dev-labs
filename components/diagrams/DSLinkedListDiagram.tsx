'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSLinkedListDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Doubly linked list — top row
    mkNode('head',  0,   30, { icon: '🏁', title: 'Sentinel HEAD', sub: 'prev = null',  color: '#64748b' }),
    mkNode('nodeA', 180, 30, { icon: '📌', title: 'Node A',        sub: 'val = 10',     color: '#10b981' }),
    mkNode('nodeB', 360, 30, { icon: '📌', title: 'Node B',        sub: 'val = 20',     color: '#10b981' }),
    mkNode('nodeC', 540, 30, { icon: '📌', title: 'Node C',        sub: 'val = 30',     color: '#10b981' }),
    mkNode('tail',  720, 30, { icon: '🏁', title: 'Sentinel TAIL', sub: 'next = null',  color: '#64748b' }),

    // LRU Cache mini diagram
    mkGroup('lru-group', 0, 160, 780, 160, { label: 'LRU Cache', sub: 'HashMap + Doubly Linked List', color: '#10b981' }),
    mkNode('hashmap',  20,  40, { icon: '🗂️', title: 'HashMap',   sub: 'key → node ptr\nO(1) lookup',   color: '#a78bfa' }, { parentId: 'lru-group' }),
    mkNode('mru-end',  240, 40, { icon: '🔥', title: 'MRU End',   sub: 'most recently used',            color: '#10b981', badge: 'move-to-front on access' }, { parentId: 'lru-group' }),
    mkNode('mid-node', 440, 40, { icon: '📌', title: 'Node',      sub: 'intermediate',                  color: '#64748b' }, { parentId: 'lru-group' }),
    mkNode('lru-end',  620, 40, { icon: '🧊', title: 'LRU End',   sub: 'evict when full',               color: '#f87171' }, { parentId: 'lru-group' }),

    // Bottom label
    mkLabel('lbl', 50, 345, { label: 'O(1) insert/delete at pointer; O(n) access — 10-50× cache miss penalty vs array', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Forward links
    mkEdge('e-h-a',   'head',  'nodeA', { color: '#10b981', labelText: '→next' }),
    mkEdge('e-a-b',   'nodeA', 'nodeB', { color: '#10b981', labelText: '→next' }),
    mkEdge('e-b-c',   'nodeB', 'nodeC', { color: '#10b981', labelText: '→next' }),
    mkEdge('e-c-t',   'nodeC', 'tail',  { color: '#10b981', labelText: '→next' }),

    // Backward links
    mkEdge('e-a-h',   'nodeA', 'head',  { color: '#64748b', dashed: true, labelText: 'prev←', animated: false }),
    mkEdge('e-b-a',   'nodeB', 'nodeA', { color: '#64748b', dashed: true, labelText: 'prev←', animated: false }),
    mkEdge('e-c-b',   'nodeC', 'nodeB', { color: '#64748b', dashed: true, labelText: 'prev←', animated: false }),
    mkEdge('e-t-c',   'tail',  'nodeC', { color: '#64748b', dashed: true, labelText: 'prev←', animated: false }),

    // LRU cache internal
    mkEdge('e-hm-mru',  'hashmap',  'mru-end',  { color: '#a78bfa', labelText: 'O(1) lookup' }),
    mkEdge('e-mru-mid', 'mru-end',  'mid-node', { color: '#10b981' }),
    mkEdge('e-mid-lru', 'mid-node', 'lru-end',  { color: '#10b981' }),
    mkEdge('e-lru-mid', 'lru-end',  'mid-node', { color: '#64748b', dashed: true, animated: false }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
