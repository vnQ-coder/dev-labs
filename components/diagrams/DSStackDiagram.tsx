'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSStackDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Left group: array-backed stack
    mkGroup('stack-group', 0, 0, 200, 330, { label: 'Stack (array-backed)', sub: 'LIFO', color: '#10b981' }),
    mkNode('frame3', 30, 30,  { icon: '📄', title: 'Frame 3', sub: 'top → push here', color: '#10b981', badge: 'TOP' }, { parentId: 'stack-group' }),
    mkNode('frame2', 30, 110, { icon: '📄', title: 'Frame 2', sub: 'intermediate',    color: '#34d399' }, { parentId: 'stack-group' }),
    mkNode('frame1', 30, 190, { icon: '📄', title: 'Frame 1', sub: 'intermediate',    color: '#34d399' }, { parentId: 'stack-group' }),
    mkNode('frame0', 30, 270, { icon: '📄', title: 'Frame 0', sub: 'bottom',          color: '#64748b', badge: 'BOTTOM' }, { parentId: 'stack-group' }),

    // push/pop labels
    mkLabel('lbl-push', 220, 20,  { label: '← push O(1)', icon: '⬇️', color: '#10b981' }),
    mkLabel('lbl-pop',  220, 60,  { label: '← pop O(1)',  icon: '⬆️', color: '#f87171' }),
    mkLabel('lbl-peek', 220, 100, { label: '← peek O(1)', icon: '👁️', color: '#a78bfa' }),

    // Right group: call stack example
    mkGroup('call-group', 420, 0, 240, 260, { label: 'Call Stack Example', sub: 'return pops frame', color: '#a78bfa' }),
    mkNode('cs-bar',  50, 30,  { icon: '⚙️', title: 'bar()',  sub: 'currently executing', color: '#a78bfa', badge: 'TOP' }, { parentId: 'call-group' }),
    mkNode('cs-foo',  50, 110, { icon: '⚙️', title: 'foo()',  sub: 'called bar()',        color: '#a78bfa' }, { parentId: 'call-group' }),
    mkNode('cs-main', 50, 190, { icon: '⚙️', title: 'main()', sub: 'entry point',         color: '#64748b', badge: 'BOTTOM' }, { parentId: 'call-group' }),

    // Monotonic stack mini
    mkGroup('mono-group', 0, 360, 680, 100, { label: 'Monotonic Stack — Next Greater Element', sub: 'input: [3,1,4,1,5]', color: '#f59e0b' }),
    mkNode('ms0', 20,  20, { title: '3', sub: 'push',          color: '#f59e0b' }, { parentId: 'mono-group' }),
    mkNode('ms1', 120, 20, { title: '1', sub: 'push (3>1)',     color: '#f59e0b' }, { parentId: 'mono-group' }),
    mkNode('ms2', 240, 20, { title: '4', sub: 'pop 1,3 → ans', color: '#34d399', badge: 'NGE(3)=4, NGE(1)=4' }, { parentId: 'mono-group' }),
    mkNode('ms3', 400, 20, { title: '1', sub: 'push (4>1)',     color: '#f59e0b' }, { parentId: 'mono-group' }),
    mkNode('ms4', 520, 20, { title: '5', sub: 'pop 1,4 → ans', color: '#34d399', badge: 'NGE(4)=5, NGE(1)=5' }, { parentId: 'mono-group' }),

    // Bottom label
    mkLabel('lbl', 50, 490, { label: 'LIFO maps to recursion, parsing, DFS — O(1) push/pop/peek', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Stack frames (top-down stacking)
    mkEdge('e-f3-f2', 'frame3', 'frame2', { color: '#10b981', animated: false, noArrow: true }),
    mkEdge('e-f2-f1', 'frame2', 'frame1', { color: '#10b981', animated: false, noArrow: true }),
    mkEdge('e-f1-f0', 'frame1', 'frame0', { color: '#10b981', animated: false, noArrow: true }),

    // Call stack frames
    mkEdge('e-cs-bar-foo',  'cs-bar',  'cs-foo',  { color: '#a78bfa', labelText: 'called by' }),
    mkEdge('e-cs-foo-main', 'cs-foo',  'cs-main', { color: '#a78bfa', labelText: 'called by' }),

    // Monotonic steps
    mkEdge('e-ms0-1', 'ms0', 'ms1', { color: '#f59e0b' }),
    mkEdge('e-ms1-2', 'ms1', 'ms2', { color: '#34d399', labelText: 'pop+record' }),
    mkEdge('e-ms2-3', 'ms2', 'ms3', { color: '#f59e0b' }),
    mkEdge('e-ms3-4', 'ms3', 'ms4', { color: '#34d399', labelText: 'pop+record' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
