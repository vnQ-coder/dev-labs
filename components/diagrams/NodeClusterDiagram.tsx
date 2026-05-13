'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NodeClusterDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Cluster mode group
    mkGroup('grp-cluster', 0, 0, 760, 160, { label: 'Cluster Mode — Multiple Processes (one per CPU core)', color: '#3b82f6' }),
    mkNode('master',      20,  50, { icon: '👑', title: 'Master Process',    sub: 'cluster.fork() × N cores',         color: '#dc2626', badge: 'coordinator' }),
    mkNode('tcpsock',    200,  50, { icon: '🔌', title: 'Shared TCP Socket', sub: 'OS distributes connections',        color: '#64748b', badge: 'round-robin (Linux)' }),
    mkNode('worker1',    400,  20, { icon: '⚙️', title: 'Worker 1',          sub: 'own V8 + heap',                    color: '#3b82f6', badge: 'CPU 0' }),
    mkNode('worker2',    560,  20, { icon: '⚙️', title: 'Worker 2',          sub: 'own V8 + heap',                    color: '#3b82f6', badge: 'CPU 1' }),
    mkNode('worker3',    400,  95, { icon: '⚙️', title: 'Worker 3',          sub: 'own V8 + heap',                    color: '#3b82f6', badge: 'CPU 2' }),
    mkNode('worker4',    560,  95, { icon: '⚙️', title: 'Worker 4',          sub: 'own V8 + heap',                    color: '#3b82f6', badge: 'CPU 3' }),

    // Worker threads group
    mkGroup('grp-wt', 0, 185, 760, 130, { label: 'Worker Threads — One Process, Multiple Threads', color: '#10b981' }),
    mkNode('mainthread', 20, 230, { icon: '🧵', title: 'Main Thread',         sub: 'new Worker(file)',                 color: '#10b981', badge: 'orchestrator' }),
    mkNode('wt1',       230, 215, { icon: '🧵', title: 'Worker Thread 1',     sub: 'CPU-bound task',                   color: '#059669' }),
    mkNode('wt2',       420, 215, { icon: '🧵', title: 'Worker Thread 2',     sub: 'CPU-bound task',                   color: '#059669' }),
    mkNode('sharedbuf', 600, 230, {
      icon: '💾',
      title: 'SharedArrayBuffer',
      sub: 'shared memory + Atomics',
      color: '#f97316',
      badge: 'no copy needed',
    }),

    // child_process group
    mkGroup('grp-cp', 0, 340, 760, 120, { label: 'child_process.fork() — Separate Node.js Process with IPC', color: '#a78bfa' }),
    mkNode('parent',     20, 385, { icon: '📦', title: 'Parent Process',       sub: 'child_process.fork()',             color: '#a78bfa', badge: 'spawner' }),
    mkNode('childproc',  270, 385, {
      icon: '📦',
      title: 'Child Process',
      sub: 'separate Node.js instance',
      color: '#7c3aed',
      badge: 'full isolation',
    }),
    mkNode('ipc',        520, 385, {
      icon: '📨',
      title: 'IPC Channel',
      sub: 'process.send() / on("message")',
      color: '#6366f1',
      badge: 'serialized messages',
    }),

    // Label
    mkLabel('lbl', 30, 480, { label: 'Cluster = same code, multiple processes. Worker threads = one process, multiple threads.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Cluster
    mkEdge('e-mst-tcp',  'master',   'tcpsock',   { color: '#64748b', labelText: 'binds to' }),
    mkEdge('e-tcp-w1',   'tcpsock',  'worker1',   { color: '#3b82f6', labelText: 'fork()' }),
    mkEdge('e-tcp-w2',   'tcpsock',  'worker2',   { color: '#3b82f6' }),
    mkEdge('e-tcp-w3',   'tcpsock',  'worker3',   { color: '#3b82f6' }),
    mkEdge('e-tcp-w4',   'tcpsock',  'worker4',   { color: '#3b82f6' }),

    // Worker threads
    mkEdge('e-mt-wt1',   'mainthread','wt1',      { color: '#10b981', labelText: 'new Worker()' }),
    mkEdge('e-mt-wt2',   'mainthread','wt2',      { color: '#10b981' }),
    mkEdge('e-wt1-sb',   'wt1',      'sharedbuf', { color: '#f97316', dashed: true, labelText: 'shared memory' }),
    mkEdge('e-wt2-sb',   'wt2',      'sharedbuf', { color: '#f97316', dashed: true }),

    // child_process
    mkEdge('e-par-cp',   'parent',   'childproc', { color: '#7c3aed', labelText: 'fork()' }),
    mkEdge('e-cp-ipc',   'childproc','ipc',       { color: '#6366f1', labelText: 'IPC channel' }),
    mkEdge('e-ipc-par',  'ipc',      'parent',    { color: '#6366f1', dashed: true, labelText: 'messages' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
