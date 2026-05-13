'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function JSAsyncDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Promise state machine group
    mkGroup('grp-promise', 0, 0, 720, 145, { label: 'Promise State Machine', color: '#6366f1' }),
    mkNode('pending',    20,  45, { icon: '⏳', title: 'Pending',     sub: 'Initial state',                      color: '#64748b', badge: 'awaiting' }),
    mkNode('fulfilled',  270,  20, { icon: '✅', title: 'Fulfilled',   sub: '.then(value => …)',                   color: '#10b981', badge: 'resolved' }),
    mkNode('rejected',   270,  95, { icon: '❌', title: 'Rejected',    sub: '.catch(err => …)',                    color: '#dc2626', badge: 'error' }),
    mkNode('settled',    520,  55, { icon: '🏁', title: 'Settled',     sub: '.finally() always runs',              color: '#8b5cf6', badge: 'terminal state' }),

    // Combinators group
    mkGroup('grp-combinators', 0, 175, 720, 130, { label: 'Promise Combinators', color: '#f97316' }),
    mkNode('pall',       20, 220, { icon: '🤝', title: 'Promise.all',         sub: 'All must succeed → array of values',  color: '#10b981', badge: 'fails fast' }),
    mkNode('pallsettled',195, 220, { icon: '📊', title: 'Promise.allSettled',  sub: 'All results, success or error',       color: '#3b82f6' }),
    mkNode('prace',      390, 220, { icon: '🏎️', title: 'Promise.race',        sub: 'First to settle wins',                color: '#eab308' }),
    mkNode('pany',       560, 220, { icon: '🎯', title: 'Promise.any',         sub: 'First success wins',                  color: '#f97316' }),

    // async/await group
    mkGroup('grp-async', 0, 335, 720, 140, { label: 'async / await — Syntactic Sugar over Promises', color: '#10b981' }),
    mkNode('asyncfn',    20, 380, { icon: '🔄', title: 'async function',       sub: 'Always returns a Promise',           color: '#6366f1', badge: 'implicit return' }),
    mkNode('awaitexpr',  230, 380, { icon: '⏸️', title: 'await expression',     sub: 'Pauses function, not thread',        color: '#3b82f6' }),
    mkNode('trycatch',   460, 380, {
      icon: '🛡️',
      title: 'try / catch',
      sub: 'catch = .catch(); same semantics',
      color: '#10b981',
      badge: 'error propagation',
      pills: [{ label: 'same as .catch()', color: '#059669' }],
    }),

    // Label
    mkLabel('lbl', 60, 495, { label: 'async/await is syntactic sugar — under the hood it is the same Promise chain', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // State machine
    mkEdge('e-pend-ful', 'pending',    'fulfilled',    { color: '#10b981', labelText: 'resolve(value)' }),
    mkEdge('e-pend-rej', 'pending',    'rejected',     { color: '#dc2626', labelText: 'reject(err)' }),
    mkEdge('e-ful-set',  'fulfilled',  'settled',      { color: '#8b5cf6' }),
    mkEdge('e-rej-set',  'rejected',   'settled',      { color: '#8b5cf6' }),

    // async/await flow
    mkEdge('e-async-aw', 'asyncfn',    'awaitexpr',    { color: '#3b82f6', labelText: 'suspends at await' }),
    mkEdge('e-aw-tc',    'awaitexpr',  'trycatch',     { color: '#10b981', labelText: 'rejection caught here' }),
    mkEdge('e-aw-ful',   'awaitexpr',  'fulfilled',    { color: '#10b981', dashed: true, labelText: 'same as .then()' }),
    mkEdge('e-tc-rej',   'trycatch',   'rejected',     { color: '#dc2626', dashed: true, labelText: 'same as .catch()' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
