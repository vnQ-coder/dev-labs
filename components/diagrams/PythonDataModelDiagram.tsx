'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PythonDataModelDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Sequence protocol
    mkGroup('grp-sequence', 0, 0, 700, 130, { label: 'Sequence Protocol — __len__ + __getitem__', color: '#10b981' }),
    mkNode('seq-len', 20, 40, { icon: '📏', title: '__len__', sub: 'Return count of items', color: '#10b981' }),
    mkNode('seq-getitem', 220, 40, { icon: '🔢', title: '__getitem__', sub: 'Support index access', color: '#10b981' }),
    mkNode('seq-behaviors', 450, 40, { icon: '✅', title: 'Unlocks', sub: 'len(), indexing, for loops, slicing', color: '#38bdf8', badge: 'built-in integration' }),

    // Context manager protocol
    mkGroup('grp-ctx', 0, 160, 680, 130, { label: 'Context Manager Protocol — works with "with" statement', color: '#f97316' }),
    mkNode('ctx-enter', 20, 205, { icon: '🚪', title: '__enter__', sub: 'Setup — returns resource', color: '#f97316' }),
    mkNode('ctx-block', 240, 205, { icon: '📦', title: 'with block', sub: 'User code runs here', color: '#64748b' }),
    mkNode('ctx-exit', 430, 205, { icon: '🚪', title: '__exit__', sub: 'Teardown — even on exception', color: '#f97316', badge: 'exc_type, exc_val, tb' }),

    // Callable protocol
    mkGroup('grp-callable', 0, 320, 560, 110, { label: 'Callable Protocol — __call__ makes instance callable', color: '#a78bfa' }),
    mkNode('call-def', 20, 360, { icon: '🔧', title: '__call__(self, *args)', sub: 'Define on class', color: '#a78bfa' }),
    mkNode('call-use', 280, 360, { icon: '📞', title: 'obj()', sub: 'Instance used like a function', color: '#a78bfa', badge: 'callable(obj) == True' }),

    // __slots__
    mkGroup('grp-slots', 0, 460, 640, 130, { label: '__slots__ — fixed-size array instead of __dict__', color: '#38bdf8' }),
    mkNode('dict-based', 20, 505, { icon: '📚', title: 'Default __dict__', sub: 'Dynamic dict per instance', color: '#dc2626', badge: 'HIGH MEMORY' }),
    mkNode('slots-def', 280, 505, { icon: '🗃', title: "__slots__ = ['x','y']", sub: 'Fixed attribute array', color: '#38bdf8', badge: 'LOW MEMORY' }),
    mkNode('slots-benefit', 500, 505, { icon: '⚡', title: 'Less memory', sub: 'No per-instance __dict__', color: '#10b981', badge: '~40% smaller' }),

    // __eq__ and __hash__
    mkGroup('grp-hash', 0, 620, 680, 130, { label: '__eq__ + __hash__ — define both or lose hashability', color: '#dc2626' }),
    mkNode('eq-only', 20, 665, { icon: '⚖', title: 'Only __eq__', sub: 'Python sets __hash__ = None', color: '#dc2626', badge: 'unhashable!' }),
    mkNode('both', 260, 665, { icon: '✅', title: '__eq__ + __hash__', sub: 'Object usable in sets/dict keys', color: '#10b981', badge: 'hashable' }),
    mkNode('hash-rule', 490, 665, { icon: '📌', title: 'Rule', sub: 'Equal objects must have equal hashes', color: '#64748b', badge: 'invariant' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Sequence
    mkEdge('e-len-get', 'seq-len', 'seq-getitem', { color: '#10b981', labelText: '+' }),
    mkEdge('e-seq-beh', 'seq-getitem', 'seq-behaviors', { color: '#38bdf8', labelText: 'enables' }),

    // Context manager
    mkEdge('e-enter-block', 'ctx-enter', 'ctx-block', { color: '#f97316', labelText: 'as resource' }),
    mkEdge('e-block-exit', 'ctx-block', 'ctx-exit', { color: '#f97316', labelText: 'always called' }),

    // Callable
    mkEdge('e-def-use', 'call-def', 'call-use', { color: '#a78bfa', labelText: 'obj(args)' }),

    // Slots
    mkEdge('e-dict-slots', 'dict-based', 'slots-def', { color: '#38bdf8', labelText: 'replace with' }),
    mkEdge('e-slots-benefit', 'slots-def', 'slots-benefit', { color: '#10b981', labelText: 'result' }),

    // Hash
    mkEdge('e-eq-hash', 'eq-only', 'both', { color: '#10b981', labelText: 'also define __hash__' }),
    mkEdge('e-both-rule', 'both', 'hash-rule', { color: '#64748b', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
