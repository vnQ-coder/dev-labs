'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GitBasicsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Working Directory
    mkGroup('grp-wd', 0, 0, 200, 120, { label: 'Working Directory', color: '#f97316' }),
    mkNode('wd', 20, 35, { icon: '📝', title: 'Working Directory', sub: 'Untracked / modified files', color: '#f97316' }),

    // Staging Area
    mkGroup('grp-stage', 240, 0, 200, 120, { label: 'Staging Area (Index)', color: '#a78bfa' }),
    mkNode('stage', 260, 35, { icon: '📦', title: 'Staging Area', sub: 'Indexed (staged) changes', color: '#a78bfa' }),

    // Local Repository
    mkGroup('grp-local', 480, 0, 200, 120, { label: 'Local Repository', color: '#38bdf8' }),
    mkNode('local', 500, 35, { icon: '🗄️', title: 'Local Repo', sub: '.git directory (commits)', color: '#38bdf8' }),

    // Remote Repository
    mkGroup('grp-remote', 720, 0, 200, 120, { label: 'Remote Repository', color: '#10b981' }),
    mkNode('remote', 740, 35, { icon: '☁️', title: 'Remote Repo', sub: 'GitHub / GitLab / Bitbucket', color: '#10b981' }),

    // Labels
    mkLabel('lbl1', 20, 150, { label: 'git add → stages changes', icon: '💡', color: '#a78bfa' }),
    mkLabel('lbl2', 260, 150, { label: 'git commit → saves snapshot locally', icon: '💡', color: '#38bdf8' }),
    mkLabel('lbl3', 500, 150, { label: 'git push → uploads to remote', icon: '💡', color: '#10b981' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Forward flow
    mkEdge('e-wd-stage',  'wd',     'stage',  { color: '#a78bfa', labelText: 'git add' }),
    mkEdge('e-stage-local','stage', 'local',  { color: '#38bdf8', labelText: 'git commit' }),
    mkEdge('e-local-remote','local','remote', { color: '#10b981', labelText: 'git push' }),

    // Reverse flow
    mkEdge('e-remote-local','remote','local', { color: '#f97316', dashed: true, labelText: 'git fetch' }),
    mkEdge('e-local-wd',   'local', 'wd',    { color: '#f97316', dashed: true, labelText: 'git checkout' }),
    mkEdge('e-remote-wd',  'remote','wd',    { color: '#dc2626', dashed: true, labelText: 'git pull (fetch+merge)' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
