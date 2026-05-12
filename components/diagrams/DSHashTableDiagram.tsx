'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSHashTableDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Input keys (left)
    mkNode('key1', 0,  40,  { icon: '🔑', title: 'key1', sub: '"alice"',  color: '#10b981' }),
    mkNode('key2', 0,  160, { icon: '🔑', title: 'key2', sub: '"bob"',    color: '#10b981' }),
    mkNode('key3', 0,  280, { icon: '🔑', title: 'key3', sub: '"charlie"',color: '#10b981' }),

    // Hash function node
    mkNode('hash-fn', 190, 160, { icon: '⚙️', title: 'Hash Function', sub: 'h(k) mod 8', color: '#a78bfa', badge: 'O(1) expected' }),

    // Slot array group
    mkGroup('slots-group', 370, 0, 160, 380, { label: 'Slot Array [0..7]', color: '#10b981' }),
    mkNode('slot0', 20, 15,  { title: 'slot[0]', sub: 'empty', color: '#334155' }, { parentId: 'slots-group' }),
    mkNode('slot1', 20, 55,  { title: 'slot[1]', sub: 'empty', color: '#334155' }, { parentId: 'slots-group' }),
    mkNode('slot2', 20, 100, { title: 'slot[2]', sub: '→ chain', color: '#10b981', badge: 'collision!' }, { parentId: 'slots-group' }),
    mkNode('slot3', 20, 150, { title: 'slot[3]', sub: 'empty', color: '#334155' }, { parentId: 'slots-group' }),
    mkNode('slot4', 20, 195, { title: 'slot[4]', sub: 'empty', color: '#334155' }, { parentId: 'slots-group' }),
    mkNode('slot5', 20, 240, { title: 'slot[5]', sub: '→ node', color: '#a78bfa', badge: 'key2' }, { parentId: 'slots-group' }),
    mkNode('slot6', 20, 285, { title: 'slot[6]', sub: 'empty', color: '#334155' }, { parentId: 'slots-group' }),
    mkNode('slot7', 20, 330, { title: 'slot[7]', sub: 'empty', color: '#334155' }, { parentId: 'slots-group' }),

    // Chained nodes off slot 2 (collision)
    mkNode('chain1', 590, 80,  { icon: '📎', title: 'Node(k1, v1)', sub: '"alice" → val1', color: '#10b981' }),
    mkNode('chain2', 590, 180, { icon: '📎', title: 'Node(k3, v3)', sub: '"charlie" → val3', color: '#10b981', badge: 'collision: same slot' }),
    mkNode('chain-null', 590, 270, { title: 'null', sub: 'end of chain', color: '#334155' }),

    // Node off slot 5
    mkNode('chain5', 590, 340, { icon: '📎', title: 'Node(k2, v2)', sub: '"bob" → val2', color: '#a78bfa' }),

    // Load factor labels
    mkLabel('lbl-lf',    200, 370, { label: 'Load Factor α = n / m', icon: '📊', color: '#f59e0b' }),
    mkLabel('lbl-resize',200, 410, { label: 'Resize at α > 0.75 — rehash all keys', icon: '⚡', color: '#f87171' }),

    // Bottom label
    mkLabel('lbl', 0, 460, { label: 'O(1) average; O(n) worst case when all keys collide — good hash + low load factor is everything', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Keys → hash function
    mkEdge('e-k1-hf', 'key1', 'hash-fn', { color: '#10b981' }),
    mkEdge('e-k2-hf', 'key2', 'hash-fn', { color: '#10b981' }),
    mkEdge('e-k3-hf', 'key3', 'hash-fn', { color: '#10b981' }),

    // Hash function → slots
    mkEdge('e-hf-s2', 'hash-fn', 'slot2', { color: '#10b981', labelText: 'h(k1)=h(k3)=2' }),
    mkEdge('e-hf-s5', 'hash-fn', 'slot5', { color: '#a78bfa', labelText: 'h(k2)=5' }),

    // Slot 2 chain
    mkEdge('e-s2-c1',    'slot2',  'chain1',     { color: '#10b981', labelText: 'head' }),
    mkEdge('e-c1-c2',    'chain1', 'chain2',     { color: '#10b981', labelText: '→next' }),
    mkEdge('e-c2-null',  'chain2', 'chain-null', { color: '#334155', labelText: '→next' }),

    // Slot 5 single node
    mkEdge('e-s5-c5', 'slot5', 'chain5', { color: '#a78bfa', labelText: 'head' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
