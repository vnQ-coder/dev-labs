'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function LaravelQueuesDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Main queue flow
    mkGroup('grp-queue', 0, 0, 860, 120, { label: 'Queue Flow — dispatch → driver → worker', color: '#f97316' }),
    mkNode('app-dispatch',  20,  40, { icon: '🚀', title: 'Application',       sub: 'dispatch(SendEmailJob)',          color: '#64748b' }),
    mkNode('queue-driver', 220,  40, { icon: '🗄️', title: 'Queue Driver (Redis)', sub: 'stores serialized job payload', color: '#dc2626', badge: 'Redis' }),
    mkNode('worker',       460,  40, { icon: '⚙️', title: 'Queue Worker',       sub: 'php artisan queue:work',         color: '#f97316', badge: 'pulls job' }),
    mkNode('handle',       660,  40, { icon: '▶️', title: 'execute handle()',    sub: 'job logic runs here',            color: '#38bdf8' }),

    // Success / fail branching
    mkGroup('grp-result', 0, 145, 860, 110, { label: 'Success / Failure handling', color: '#10b981' }),
    mkNode('success',       20, 185, { icon: '✅', title: 'Success',          sub: 'job deleted from queue',         color: '#10b981', badge: 'done' }),
    mkNode('retry',        250, 185, { icon: '🔄', title: 'Retry with backoff', sub: 'exponential delay — attempts--', color: '#f59e0b', badge: 'backoff' }),
    mkNode('max-attempts', 500, 185, { icon: '💀', title: 'Max attempts hit',  sub: 'job moves to failed_jobs table', color: '#dc2626', badge: 'failed' }),
    mkNode('failed-jobs',  720, 185, { icon: '🗑️', title: 'failed_jobs table', sub: 'inspect + replay manually',     color: '#64748b' }),

    // Job chaining
    mkGroup('grp-chain', 0, 285, 680, 110, { label: 'Job Chaining — sequential pipeline', color: '#a78bfa' }),
    mkNode('job-a', 20,  325, { icon: '1️⃣', title: 'Job A',    sub: 'success → dispatch next', color: '#a78bfa' }),
    mkNode('job-b', 240, 325, { icon: '2️⃣', title: 'Job B',    sub: 'success → dispatch next', color: '#a78bfa' }),
    mkNode('job-c', 480, 325, { icon: '3️⃣', title: 'Job C',    sub: 'final step in chain',     color: '#10b981', badge: 'chain end' }),

    // Batch
    mkGroup('grp-batch', 0, 425, 760, 120, { label: 'Bus::batch — parallel jobs with progress tracking', color: '#38bdf8' }),
    mkNode('batch-dispatch', 20,  465, { icon: '📦', title: 'Bus::batch([J1,J2,J3])', sub: 'tracks progress per job', color: '#38bdf8', badge: 'Bus::batch' }),
    mkNode('b-job1',        280,  445, { icon: '⚡', title: 'Job 1',     sub: 'runs in parallel', color: '#64748b' }),
    mkNode('b-job2',        280,  480, { icon: '⚡', title: 'Job 2',     sub: 'runs in parallel', color: '#64748b' }),
    mkNode('b-job3',        280,  515, { icon: '⚡', title: 'Job 3',     sub: 'runs in parallel', color: '#64748b' }),
    mkNode('then-cb',       540,  480, { icon: '🎉', title: 'then() callback', sub: 'fires when all complete', color: '#10b981', badge: 'all done' }),

    // Horizon
    mkGroup('grp-horizon', 0, 570, 500, 100, { label: 'Laravel Horizon — worker pool monitoring', color: '#f97316' }),
    mkNode('horizon',  20, 605, { icon: '📊', title: 'Horizon Dashboard', sub: 'real-time queue metrics',      color: '#f97316', badge: 'artisan horizon' }),
    mkNode('pools',   260, 605, { icon: '🧵', title: 'Worker Pools',      sub: 'auto-scale supervisors',       color: '#64748b', pills: [{ label: 'throughput', color: '#10b981' }] }),

    // Bottom label
    mkLabel('lbl', 80, 685, { label: 'Queues decouple slow work from fast HTTP responses — always retry with backoff', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Main queue flow
    mkEdge('e-app-driver',  'app-dispatch',   'queue-driver', { color: '#f97316', labelText: 'serialize + store' }),
    mkEdge('e-driver-work', 'queue-driver',   'worker',       { color: '#f97316', labelText: 'pull' }),
    mkEdge('e-work-handle', 'worker',         'handle',       { color: '#38bdf8', labelText: 'execute' }),

    // Result branching
    mkEdge('e-handle-ok',   'handle',         'success',      { color: '#10b981', labelText: 'success' }),
    mkEdge('e-handle-fail', 'handle',         'retry',        { color: '#f59e0b', labelText: 'exception' }),
    mkEdge('e-retry-max',   'retry',          'max-attempts', { color: '#dc2626', dashed: true, labelText: 'exhausted' }),
    mkEdge('e-max-failed',  'max-attempts',   'failed-jobs',  { color: '#64748b', labelText: 'write' }),

    // Chaining
    mkEdge('e-a-b', 'job-a', 'job-b', { color: '#a78bfa', labelText: 'then' }),
    mkEdge('e-b-c', 'job-b', 'job-c', { color: '#a78bfa', labelText: 'then' }),

    // Batch
    mkEdge('e-batch-j1', 'batch-dispatch', 'b-job1', { color: '#38bdf8' }),
    mkEdge('e-batch-j2', 'batch-dispatch', 'b-job2', { color: '#38bdf8' }),
    mkEdge('e-batch-j3', 'batch-dispatch', 'b-job3', { color: '#38bdf8' }),
    mkEdge('e-j1-then',  'b-job1', 'then-cb', { color: '#10b981', dashed: true }),
    mkEdge('e-j2-then',  'b-job2', 'then-cb', { color: '#10b981', dashed: true }),
    mkEdge('e-j3-then',  'b-job3', 'then-cb', { color: '#10b981', dashed: true }),

    // Horizon
    mkEdge('e-hor-pools', 'horizon', 'pools', { color: '#f97316', labelText: 'monitor' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
