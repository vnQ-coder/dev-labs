'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function JSEventLoopDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Main runtime group
    mkGroup('grp-runtime', 0, 0, 680, 130, { label: 'JavaScript Runtime', color: '#3b82f6' }),
    mkNode('callstack',   20,  35, { icon: '📚', title: 'Call Stack',    sub: 'Sync code runs here (LIFO)', color: '#3b82f6', badge: 'single-threaded' }),
    mkNode('heap',       280,  35, { icon: '🏗️', title: 'Heap',          sub: 'Memory allocation',          color: '#6366f1' }),
    mkNode('eventloop',  490,  35, { icon: '🔄', title: 'Event Loop',    sub: 'Orchestrates execution',      color: '#8b5cf6', badge: 'orchestrator' }),

    // Browser / Node APIs group
    mkGroup('grp-apis', 0, 160, 680, 110, { label: 'Web APIs / Node.js APIs', color: '#f97316' }),
    mkNode('webapis',    20, 200, { icon: '🌐', title: 'Web APIs',       sub: 'setTimeout / fetch / DOM events', color: '#f97316', badge: 'async offload' }),
    mkNode('timers',    310, 200, { icon: '⏱️', title: 'Timer (setTimeout)', sub: 'Scheduled by runtime',     color: '#ea580c' }),
    mkNode('fetchapi',  520, 200, { icon: '📡', title: 'fetch / XHR',   sub: 'Network I/O off main thread',  color: '#ea580c' }),

    // Queues group
    mkGroup('grp-queues', 0, 300, 680, 140, { label: 'Task Queues', color: '#10b981' }),
    mkNode('microtask',  20, 345, {
      icon: '⚡',
      title: 'Microtask Queue',
      sub: 'Promises / queueMicrotask',
      color: '#10b981',
      badge: 'higher priority',
      pills: [{ label: 'drained completely first', color: '#059669' }],
    }),
    mkNode('taskqueue', 390, 345, {
      icon: '📬',
      title: 'Callback / Task Queue',
      sub: 'Macrotasks: setTimeout, setInterval',
      color: '#eab308',
      badge: 'one at a time',
    }),

    // Label
    mkLabel('lbl', 60, 460, { label: 'Event Loop: stack empty → drain all microtasks → pick ONE macrotask → repeat', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Sync execution
    mkEdge('e-cs-el',   'callstack', 'eventloop', { color: '#8b5cf6', labelText: 'stack empty?' }),

    // APIs receive tasks
    mkEdge('e-cs-wa',   'callstack', 'webapis',   { color: '#f97316', labelText: 'offload async' }),
    mkEdge('e-wa-timer','webapis',   'timers',     { color: '#ea580c', dashed: true }),
    mkEdge('e-wa-fetch','webapis',   'fetchapi',   { color: '#ea580c', dashed: true }),

    // Callbacks enqueued
    mkEdge('e-timer-tq','timers',    'taskqueue',  { color: '#eab308', labelText: 'callback ready' }),
    mkEdge('e-fetch-mq','fetchapi',  'microtask',  { color: '#10b981', labelText: '.then() resolved' }),

    // Event loop drains
    mkEdge('e-el-mq',   'eventloop', 'microtask',  { color: '#10b981', labelText: '1st: drain all' }),
    mkEdge('e-el-tq',   'eventloop', 'taskqueue',  { color: '#eab308', labelText: '2nd: one task' }),

    // Push back to stack
    mkEdge('e-mq-cs',   'microtask', 'callstack',  { color: '#10b981', dashed: true, labelText: 'push callback' }),
    mkEdge('e-tq-cs',   'taskqueue', 'callstack',  { color: '#eab308', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
