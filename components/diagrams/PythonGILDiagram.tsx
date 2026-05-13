'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PythonGILDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Single process with GIL
    mkGroup('grp-process', 0, 0, 340, 110, { label: 'Python Process — single GIL', color: '#f97316' }),
    mkNode('gil', 120, 30, { icon: '🔒', title: 'GIL', sub: 'Global Interpreter Lock', color: '#f97316', badge: 'one thread at a time' }),

    // Threading group
    mkGroup('grp-threading', 0, 140, 640, 160, { label: 'Threading — I/O-bound OK', color: '#10b981' }),
    mkNode('thread1-run', 20, 185, { icon: '▶', title: 'Thread 1', sub: 'Holds GIL — running', color: '#10b981', badge: 'CPU active' }),
    mkNode('io-wait', 220, 185, { icon: '⏳', title: 'I/O Wait', sub: 'DB query / HTTP request', color: '#64748b', badge: 'releases GIL' }),
    mkNode('thread2-run', 430, 185, { icon: '▶', title: 'Thread 2', sub: 'Acquires GIL — runs', color: '#10b981', badge: 'CPU active' }),
    mkNode('thread1-resume', 20, 255, { icon: '🔄', title: 'Thread 1 resumes', sub: 'I/O done, re-acquires GIL', color: '#38bdf8' }),

    // Multiprocessing group
    mkGroup('grp-multiproc', 0, 335, 720, 130, { label: 'Multiprocessing — CPU-bound, true parallelism', color: '#a78bfa' }),
    mkNode('proc1', 20, 375, { icon: '⚙', title: 'Process 1', sub: 'Own GIL + interpreter', color: '#a78bfa', badge: 'core 0' }),
    mkNode('proc2', 260, 375, { icon: '⚙', title: 'Process 2', sub: 'Own GIL + interpreter', color: '#a78bfa', badge: 'core 1' }),
    mkNode('proc3', 500, 375, { icon: '⚙', title: 'Process 3', sub: 'Own GIL + interpreter', color: '#a78bfa', badge: 'core 2' }),

    // concurrent.futures group
    mkGroup('grp-futures', 0, 500, 640, 120, { label: 'concurrent.futures — unified API', color: '#38bdf8' }),
    mkNode('thread-pool', 20, 545, { icon: '🧵', title: 'ThreadPoolExecutor', sub: 'Use for I/O-bound tasks', color: '#10b981', badge: 'I/O' }),
    mkNode('process-pool', 340, 545, { icon: '🖥', title: 'ProcessPoolExecutor', sub: 'Use for CPU-bound tasks', color: '#a78bfa', badge: 'CPU' }),

    mkLabel('lbl', 0, 645, { label: 'GIL blocks CPU parallelism; I/O releases it; use multiprocessing for CPU-bound work', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-t1-io', 'thread1-run', 'io-wait', { color: '#f97316', labelText: 'blocks on I/O → releases GIL' }),
    mkEdge('e-io-t2', 'io-wait', 'thread2-run', { color: '#10b981', labelText: 'Thread 2 acquires GIL' }),
    mkEdge('e-io-t1r', 'io-wait', 'thread1-resume', { color: '#38bdf8', dashed: true, labelText: 'I/O completes' }),
    mkEdge('e-p1-p2', 'proc1', 'proc2', { color: '#a78bfa', labelText: 'no shared GIL' }),
    mkEdge('e-p2-p3', 'proc2', 'proc3', { color: '#a78bfa' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
