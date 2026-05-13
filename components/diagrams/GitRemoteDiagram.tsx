'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GitRemoteDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Local machine group
    mkGroup('grp-local', 0, 0, 480, 200, { label: 'Local Machine', color: '#38bdf8' }),
    mkNode('local-main',    20,  35, { icon: '🖥️', title: 'local/main',    sub: 'local branch',            color: '#38bdf8' }),
    mkNode('local-feature', 20, 110, { icon: '🌿', title: 'feature branch', sub: 'local feature work',      color: '#f97316', badge: 'your work' }),
    mkNode('tracking-orig', 240, 35, { icon: '📌', title: 'origin/main',    sub: 'tracking branch (cached)',color: '#a78bfa', badge: 'remote-tracking' }),
    mkNode('tracking-up',   240,110, { icon: '📌', title: 'upstream/main',  sub: 'tracking branch (cached)',color: '#64748b', badge: 'remote-tracking' }),

    // Origin remote group
    mkGroup('grp-origin', 520, 0, 220, 110, { label: 'origin (your fork on GitHub)', color: '#10b981' }),
    mkNode('origin-main', 540, 35, { icon: '☁️', title: 'origin/main', sub: 'your fork remote', color: '#10b981' }),

    // Upstream remote group
    mkGroup('grp-upstream', 520, 140, 220, 110, { label: 'upstream (original repo)', color: '#dc2626' }),
    mkNode('upstream-main', 540, 175, { icon: '🏠', title: 'upstream/main', sub: 'original project remote', color: '#dc2626' }),

    // Fork workflow group
    mkGroup('grp-fork', 0, 240, 780, 140, { label: 'Fork Workflow', color: '#64748b' }),
    mkNode('fw-orig',    20, 275, { icon: '🏠', title: 'Upstream Repo', sub: 'open-source project',    color: '#dc2626' }),
    mkNode('fw-fork',   220, 275, { icon: '🍴', title: 'Fork',          sub: 'your copy on GitHub',   color: '#10b981', badge: 'git fork' }),
    mkNode('fw-clone',  420, 275, { icon: '💻', title: 'Clone',         sub: 'local copy on machine', color: '#38bdf8', badge: 'git clone' }),
    mkNode('fw-pr',     620, 275, { icon: '📬', title: 'Pull Request',  sub: 'propose changes',       color: '#f97316', badge: 'open PR' }),

    mkLabel('lbl-pull',  20, 395, { label: 'git pull = git fetch + git merge (updates local from remote)', icon: '💡', color: '#38bdf8' }),
    mkLabel('lbl-fetch', 20, 430, { label: 'git fetch = download remote changes without merging',          icon: '💡', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Local ↔ origin
    mkEdge('e-local-push',   'local-main',    'origin-main',   { color: '#10b981', labelText: 'git push origin main' }),
    mkEdge('e-orig-fetch',   'origin-main',   'tracking-orig', { color: '#a78bfa', dashed: true, labelText: 'git fetch origin' }),
    mkEdge('e-track-merge',  'tracking-orig', 'local-main',    { color: '#38bdf8', dashed: true, labelText: 'git merge (pull)' }),

    // Upstream → local
    mkEdge('e-up-fetch',     'upstream-main', 'tracking-up',   { color: '#64748b', dashed: true, labelText: 'git fetch upstream' }),
    mkEdge('e-track-up-merge','tracking-up',  'local-main',    { color: '#64748b', dashed: true, labelText: 'git merge upstream/main' }),

    // Feature → origin
    mkEdge('e-feat-push',    'local-feature', 'origin-main',   { color: '#f97316', labelText: 'git push origin feature' }),

    // Fork workflow
    mkEdge('e-fw-orig-fork', 'fw-orig',  'fw-fork',  { color: '#10b981', labelText: 'fork on GitHub' }),
    mkEdge('e-fw-fork-clone','fw-fork',  'fw-clone', { color: '#38bdf8', labelText: 'git clone' }),
    mkEdge('e-fw-clone-pr',  'fw-clone', 'fw-pr',    { color: '#f97316', labelText: 'git push + open PR' }),
    mkEdge('e-fw-pr-orig',   'fw-pr',    'fw-orig',  { color: '#dc2626', dashed: true, labelText: 'maintainer merges' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
