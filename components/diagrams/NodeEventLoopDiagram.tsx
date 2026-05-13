'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NodeEventLoopDiagram() {
  const nodes: Node[] = useMemo(() => [
    // libuv phases group
    mkGroup('grp-phases', 0, 0, 820, 140, { label: 'libuv Event Loop Phases (circular)', color: '#10b981' }),
    mkNode('timers',      20,  45, { icon: '⏱️', title: 'timers',            sub: 'setTimeout / setInterval callbacks', color: '#3b82f6', badge: 'phase 1' }),
    mkNode('pending',    170,  45, { icon: '📋', title: 'pending callbacks',  sub: 'I/O errors from last tick',          color: '#6366f1', badge: 'phase 2' }),
    mkNode('idleprep',   330,  45, { icon: '🛑', title: 'idle / prepare',    sub: 'internal use only',                  color: '#94a3b8', badge: 'phase 3' }),
    mkNode('poll',       490,  45, {
      icon: '🔌',
      title: 'poll',
      sub: 'waits for I/O events',
      color: '#f97316',
      badge: 'phase 4',
      pills: [{ label: 'blocks here when queue empty', color: '#ea580c' }],
    }),
    mkNode('check',      640,  45, { icon: '✅', title: 'check',             sub: 'setImmediate() callbacks',           color: '#10b981', badge: 'phase 5' }),
    mkNode('close',      760,  45, { icon: '🔒', title: 'close callbacks',   sub: 'socket.on("close")',                 color: '#dc2626', badge: 'phase 6' }),

    // Special priority group
    mkGroup('grp-micro', 0, 170, 820, 130, { label: 'Between-Phase Priority Queue (runs after every phase)', color: '#a78bfa' }),
    mkNode('nexttick',    20, 215, {
      icon: '⚡',
      title: 'process.nextTick',
      sub: 'runs after current phase completes',
      color: '#a78bfa',
      badge: 'highest priority',
      pills: [{ label: 'before Promise microtasks', color: '#7c3aed' }],
    }),
    mkNode('promicro',   380, 215, {
      icon: '🔄',
      title: 'Promise microtasks',
      sub: 'resolved .then() callbacks',
      color: '#6366f1',
      badge: 'same tick as nextTick',
    }),

    // Examples group
    mkGroup('grp-examples', 0, 325, 820, 110, { label: 'Common Examples', color: '#f97316' }),
    mkNode('settimeout',  20, 365, { icon: '⏰', title: 'setTimeout(fn, 0)',  sub: 'lands in timers phase',             color: '#3b82f6' }),
    mkNode('setimm',     280, 365, { icon: '🚀', title: 'setImmediate(fn)',   sub: 'lands in check phase',              color: '#10b981' }),
    mkNode('iocb',       530, 365, { icon: '📁', title: 'fs.readFile cb',     sub: 'lands in poll phase',               color: '#f97316' }),

    // Label
    mkLabel('lbl', 60, 455, { label: 'poll phase blocks waiting for I/O when queue is empty (up to timer expiry)', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Circular phase flow
    mkEdge('e-tim-pend', 'timers',   'pending',   { color: '#10b981', labelText: 'next phase' }),
    mkEdge('e-pend-idle','pending',  'idleprep',  { color: '#10b981' }),
    mkEdge('e-idle-poll','idleprep', 'poll',      { color: '#10b981' }),
    mkEdge('e-poll-chk', 'poll',     'check',     { color: '#10b981' }),
    mkEdge('e-chk-cls',  'check',    'close',     { color: '#10b981' }),
    mkEdge('e-cls-tim',  'close',    'timers',    { color: '#10b981', dashed: true, labelText: 'loop back' }),

    // nextTick / microtasks between phases
    mkEdge('e-poll-nt',  'poll',     'nexttick',  { color: '#a78bfa', dashed: true, labelText: 'after phase' }),
    mkEdge('e-nt-pm',    'nexttick', 'promicro',  { color: '#6366f1', labelText: 'then microtasks' }),

    // Examples to phases
    mkEdge('e-sto-tim',  'settimeout','timers',   { color: '#3b82f6', dashed: true }),
    mkEdge('e-si-chk',   'setimm',   'check',    { color: '#10b981', dashed: true }),
    mkEdge('e-io-poll',  'iocb',     'poll',     { color: '#f97316', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
