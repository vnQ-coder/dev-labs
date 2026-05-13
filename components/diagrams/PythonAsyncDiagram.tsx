'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PythonAsyncDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Event loop
    mkGroup('grp-loop', 0, 0, 680, 130, { label: 'asyncio Event Loop — single thread, many coroutines', color: '#38bdf8' }),
    mkNode('event-loop', 20, 40, { icon: '🔄', title: 'Event Loop', sub: 'Single thread, runs coroutines', color: '#38bdf8', badge: 'asyncio.run()' }),
    mkNode('coro1', 240, 40, { icon: '⚡', title: 'Coroutine A', sub: 'Awaiting I/O — yields control', color: '#10b981', badge: 'await' }),
    mkNode('coro2', 450, 40, { icon: '⚡', title: 'Coroutine B', sub: 'Running — I/O ready', color: '#10b981', badge: 'running' }),

    // asyncio.gather
    mkGroup('grp-gather', 0, 160, 720, 130, { label: 'asyncio.gather — concurrent coroutines, not parallel', color: '#a78bfa' }),
    mkNode('gather', 20, 205, { icon: '📦', title: 'asyncio.gather', sub: 'task1, task2, task3', color: '#a78bfa', badge: 'concurrent' }),
    mkNode('task1', 220, 195, { icon: '📡', title: 'task1', sub: 'HTTP request', color: '#38bdf8' }),
    mkNode('task2', 390, 195, { icon: '🗄', title: 'task2', sub: 'DB query', color: '#38bdf8' }),
    mkNode('task3', 560, 195, { icon: '📁', title: 'task3', sub: 'File read', color: '#38bdf8' }),
    mkLabel('gather-note', 20, 265, { label: 'Loop switches between tasks at every await point — not true parallelism', icon: '📌', color: '#a78bfa' }),

    // Semaphore
    mkGroup('grp-sema', 0, 320, 640, 120, { label: 'asyncio.Semaphore — limit concurrent connections', color: '#f97316' }),
    mkNode('sem100', 20, 365, { icon: '📋', title: '100 Tasks', sub: 'All dispatched at once', color: '#64748b' }),
    mkNode('sem', 220, 365, { icon: '🚦', title: 'Semaphore(10)', sub: 'Max 10 concurrent', color: '#f97316', badge: 'rate limit' }),
    mkNode('sem-active', 450, 365, { icon: '▶', title: '10 Active', sub: 'Others wait in queue', color: '#10b981', badge: 'running' }),

    // Queue producer-consumer
    mkGroup('grp-queue', 0, 470, 680, 120, { label: 'asyncio.Queue — producer-consumer pattern', color: '#10b981' }),
    mkNode('producer', 20, 515, { icon: '🏭', title: 'Producer', sub: 'await queue.put(item)', color: '#10b981' }),
    mkNode('async-queue', 240, 515, { icon: '📬', title: 'asyncio.Queue', sub: 'Async-safe buffer', color: '#38bdf8', badge: 'maxsize=100' }),
    mkNode('consumer', 460, 515, { icon: '👤', title: 'Consumer(s)', sub: 'await queue.get()', color: '#a78bfa' }),

    // run_in_executor
    mkGroup('grp-executor', 0, 620, 680, 120, { label: 'loop.run_in_executor — run sync code without blocking', color: '#dc2626' }),
    mkNode('sync-code', 20, 665, { icon: '🐌', title: 'Sync blocking fn()', sub: 'Would block event loop', color: '#dc2626', badge: 'e.g. requests.get' }),
    mkNode('executor', 280, 665, { icon: '🧵', title: 'ThreadPoolExecutor', sub: 'Runs sync fn in thread', color: '#f97316' }),
    mkNode('await-result', 510, 665, { icon: '✅', title: 'await result', sub: 'Event loop not blocked', color: '#10b981', badge: 'non-blocking' }),

    mkLabel('lbl', 0, 765, { label: 'asyncio = concurrency, not parallelism. One thread, many coroutines.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Event loop switches
    mkEdge('e-loop-c1', 'event-loop', 'coro1', { color: '#38bdf8', labelText: 'runs until await' }),
    mkEdge('e-loop-c2', 'event-loop', 'coro2', { color: '#10b981', dashed: true, labelText: 'switches to ready' }),

    // gather
    mkEdge('e-gather-t1', 'gather', 'task1', { color: '#a78bfa' }),
    mkEdge('e-gather-t2', 'gather', 'task2', { color: '#a78bfa' }),
    mkEdge('e-gather-t3', 'gather', 'task3', { color: '#a78bfa' }),

    // semaphore
    mkEdge('e-s100-sem', 'sem100', 'sem', { color: '#f97316', labelText: 'all 100 tasks' }),
    mkEdge('e-sem-active', 'sem', 'sem-active', { color: '#10b981', labelText: 'allows 10 through' }),

    // queue
    mkEdge('e-prod-q', 'producer', 'async-queue', { color: '#10b981', labelText: 'put()' }),
    mkEdge('e-q-cons', 'async-queue', 'consumer', { color: '#a78bfa', labelText: 'get()' }),

    // executor
    mkEdge('e-sync-exec', 'sync-code', 'executor', { color: '#dc2626', labelText: 'run_in_executor' }),
    mkEdge('e-exec-await', 'executor', 'await-result', { color: '#10b981', labelText: 'await' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
