'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GHAFundamentalsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Triggers group
    mkGroup('grp-triggers', 0, 0, 220, 200, { label: 'Triggers (on:)', color: '#f97316' }),
    mkNode('ev-push',     20,  35, { icon: '📤', title: 'push',     sub: 'on: push to branch',    color: '#f97316' }),
    mkNode('ev-pr',       20,  95, { icon: '📬', title: 'pull_request', sub: 'on: PR open/sync',  color: '#f97316' }),
    mkNode('ev-schedule', 20, 155, { icon: '⏰', title: 'schedule',  sub: 'on: cron expression',  color: '#f97316' }),

    // Workflow
    mkNode('workflow', 280, 90, { icon: '📋', title: 'Workflow YAML', sub: '.github/workflows/*.yml', color: '#38bdf8', badge: 'workflow file' }),

    // Jobs — parallel
    mkGroup('grp-jobs', 420, 0, 360, 280, { label: 'Jobs (run in parallel by default)', color: '#10b981' }),
    mkNode('job1',      440,  35, { icon: '🏃', title: 'Job 1: build', sub: 'ubuntu-latest runner', color: '#10b981' }),
    mkNode('job2',      440, 120, { icon: '🏃', title: 'Job 2: test',  sub: 'ubuntu-latest runner', color: '#10b981' }),
    mkNode('job3',      440, 205, { icon: '🏃', title: 'Job 3: deploy', sub: 'needs: [build, test]', color: '#a78bfa', badge: 'depends on 1+2' }),

    // Steps inside job1
    mkGroup('grp-steps', 660, 0, 260, 200, { label: 'Steps (inside Job 1)', color: '#38bdf8' }),
    mkNode('step-checkout', 680,  35, { icon: '⬇️', title: 'actions/checkout', sub: 'Clone repo',     color: '#38bdf8' }),
    mkNode('step-setup',    680,  95, { icon: '⚙️', title: 'setup-node',       sub: 'Install runtime', color: '#38bdf8' }),
    mkNode('step-build',    680, 155, { icon: '🔨', title: 'Run: npm build',   sub: 'Execute command', color: '#38bdf8' }),

    mkLabel('lbl1', 20, 220, { label: 'needs: makes jobs sequential — Job 3 waits for Job 1 and Job 2', icon: '💡', color: '#a78bfa' }),
    mkLabel('lbl2', 20, 255, { label: 'Each job gets a fresh runner VM (stateless by default)', icon: '💡', color: '#10b981' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Triggers → Workflow
    mkEdge('e-push-wf',     'ev-push',     'workflow', { color: '#f97316', labelText: 'triggers' }),
    mkEdge('e-pr-wf',       'ev-pr',       'workflow', { color: '#f97316' }),
    mkEdge('e-sched-wf',    'ev-schedule', 'workflow', { color: '#f97316' }),

    // Workflow → Jobs
    mkEdge('e-wf-job1', 'workflow', 'job1', { color: '#10b981', labelText: 'dispatches jobs' }),
    mkEdge('e-wf-job2', 'workflow', 'job2', { color: '#10b981' }),

    // Job dependency
    mkEdge('e-job1-job3', 'job1', 'job3', { color: '#a78bfa', dashed: true, labelText: 'needs' }),
    mkEdge('e-job2-job3', 'job2', 'job3', { color: '#a78bfa', dashed: true }),

    // Steps inside job1
    mkEdge('e-job1-steps', 'job1', 'step-checkout', { color: '#38bdf8', labelText: 'runs steps' }),
    mkEdge('e-step1-2',    'step-checkout', 'step-setup', { color: '#38bdf8' }),
    mkEdge('e-step2-3',    'step-setup',    'step-build', { color: '#38bdf8' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
