'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PythonDecoratorsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Basic wrapper
    mkGroup('grp-wrap', 0, 0, 720, 120, { label: 'Decorator as Wrapper — original function gains extra behavior', color: '#f97316' }),
    mkNode('orig-fn', 20, 40, { icon: '🔧', title: 'original_fn()', sub: 'Plain function', color: '#64748b' }),
    mkNode('decorator', 240, 40, { icon: '🎁', title: '@decorator', sub: 'Wraps original function', color: '#f97316', badge: 'def wrapper(*args)' }),
    mkNode('deco-fn', 490, 40, { icon: '✨', title: 'decorated_fn()', sub: 'Same API, extra behavior', color: '#10b981', badge: 'logging, caching, retry' }),

    // Stacking decorators
    mkGroup('grp-stack', 0, 150, 680, 160, { label: 'Stacked Decorators — applied bottom-up', color: '#a78bfa' }),
    mkNode('stack-fn', 20, 205, { icon: '🔧', title: 'my_function()', sub: 'Original function (innermost)', color: '#64748b' }),
    mkNode('timer-wrap', 200, 205, { icon: '⏱', title: '@timer', sub: 'Applied first (bottom)', color: '#10b981', badge: '2nd in stack' }),
    mkNode('retry-wrap', 400, 205, { icon: '🔁', title: '@retry', sub: 'Applied second (top)', color: '#dc2626', badge: '1st in stack' }),
    mkLabel('stack-note', 20, 270, { label: '@retry wraps @timer which wraps my_function — outer decorators run first', icon: '📌', color: '#a78bfa' }),

    // functools.wraps
    mkGroup('grp-wraps', 0, 340, 640, 110, { label: '@functools.wraps — preserve original metadata', color: '#38bdf8' }),
    mkNode('no-wraps', 20, 380, { icon: '❌', title: 'Without @wraps', sub: '__name__ = "wrapper"', color: '#dc2626', badge: 'metadata lost' }),
    mkNode('with-wraps', 340, 380, { icon: '✅', title: 'With @wraps(fn)', sub: '__name__ = "original_fn"', color: '#10b981', badge: '__doc__ preserved' }),

    // @property
    mkGroup('grp-property', 0, 480, 520, 110, { label: '@property — method becomes attribute', color: '#f97316' }),
    mkNode('prop-method', 20, 520, { icon: '🔧', title: 'def full_name(self)', sub: 'Defined as method', color: '#64748b' }),
    mkNode('prop-access', 280, 520, { icon: '📌', title: 'obj.full_name', sub: 'Accessed as attribute (no call)', color: '#f97316', badge: '@property' }),

    // @dataclass
    mkGroup('grp-dataclass', 0, 620, 680, 120, { label: '@dataclass — auto-generate dunder methods', color: '#10b981' }),
    mkNode('dc-class', 20, 665, { icon: '📋', title: '@dataclass class User', sub: 'Just define fields', color: '#64748b' }),
    mkNode('dc-init', 220, 665, { icon: '🏗', title: '__init__', sub: 'Auto-generated', color: '#10b981', badge: 'no boilerplate' }),
    mkNode('dc-repr', 390, 665, { icon: '🖨', title: '__repr__', sub: 'Auto-generated', color: '#10b981' }),
    mkNode('dc-eq', 540, 665, { icon: '⚖', title: '__eq__', sub: 'Auto-generated', color: '#10b981' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Wrapper
    mkEdge('e-orig-deco', 'orig-fn', 'decorator', { color: '#f97316', labelText: 'passed into' }),
    mkEdge('e-deco-new', 'decorator', 'deco-fn', { color: '#10b981', labelText: 'returns new function' }),

    // Stacking
    mkEdge('e-fn-timer', 'stack-fn', 'timer-wrap', { color: '#10b981', labelText: 'wrapped by @timer' }),
    mkEdge('e-timer-retry', 'timer-wrap', 'retry-wrap', { color: '#dc2626', labelText: 'then wrapped by @retry' }),

    // functools.wraps
    mkEdge('e-nowraps-wraps', 'no-wraps', 'with-wraps', { color: '#38bdf8', labelText: 'add @wraps(fn)' }),

    // property
    mkEdge('e-method-attr', 'prop-method', 'prop-access', { color: '#f97316', labelText: '@property' }),

    // dataclass
    mkEdge('e-dc-init', 'dc-class', 'dc-init', { color: '#10b981' }),
    mkEdge('e-dc-repr', 'dc-class', 'dc-repr', { color: '#10b981' }),
    mkEdge('e-dc-eq', 'dc-class', 'dc-eq', { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
