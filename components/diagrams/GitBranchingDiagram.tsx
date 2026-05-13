'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GitBranchingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Main branch commits
    mkGroup('grp-main', 0, 0, 780, 120, { label: 'main branch', color: '#38bdf8' }),
    mkNode('c1', 20,  35, { icon: '🔵', title: 'C1', sub: 'Initial commit', color: '#38bdf8', badge: 'main' }),
    mkNode('c2', 200, 35, { icon: '🔵', title: 'C2', sub: 'Second commit',  color: '#38bdf8', badge: 'branch point' }),
    mkNode('c3', 380, 35, { icon: '🔵', title: 'C3', sub: 'Third commit',   color: '#38bdf8' }),
    mkNode('mc', 600, 35, { icon: '🔀', title: 'M',  sub: 'Merge commit',   color: '#10b981', badge: 'merge commit' }),

    // Feature branch — merge path
    mkGroup('grp-feat', 0, 160, 560, 120, { label: 'feature branch (merge workflow)', color: '#f97316' }),
    mkNode('f1', 200, 195, { icon: '🟠', title: 'F1', sub: 'Feature work 1', color: '#f97316' }),
    mkNode('f2', 380, 195, { icon: '🟠', title: 'F2', sub: 'Feature work 2', color: '#f97316', badge: 'HEAD' }),

    // Feature branch — rebase path
    mkGroup('grp-rebase', 340, 320, 460, 120, { label: 'feature branch (rebase workflow)', color: '#a78bfa' }),
    mkNode('f1r', 360, 355, { icon: '🟣', title: "F1'", sub: 'Rebased commit 1', color: '#a78bfa' }),
    mkNode('f2r', 540, 355, { icon: '🟣', title: "F2'", sub: 'Rebased commit 2', color: '#a78bfa', badge: 'rebased HEAD' }),

    // Labels
    mkLabel('lbl-merge',  20, 300, { label: 'Merge: preserves history, adds merge commit', icon: '🔀', color: '#10b981' }),
    mkLabel('lbl-rebase', 20, 340, { label: 'Rebase: rewrites history, linear log, no merge commit', icon: '♻️', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Main branch linear
    mkEdge('e-c1-c2', 'c1', 'c2', { color: '#38bdf8', labelText: 'commit' }),
    mkEdge('e-c2-c3', 'c2', 'c3', { color: '#38bdf8', labelText: 'commit' }),
    mkEdge('e-c3-mc', 'c3', 'mc', { color: '#38bdf8' }),

    // Feature branch diverges from C2
    mkEdge('e-c2-f1', 'c2', 'f1', { color: '#f97316', labelText: 'git checkout -b feature' }),
    mkEdge('e-f1-f2', 'f1', 'f2', { color: '#f97316', labelText: 'commit' }),

    // Merge back
    mkEdge('e-f2-mc', 'f2', 'mc', { color: '#10b981', labelText: 'git merge feature' }),

    // Rebase path
    mkEdge('e-c3-f1r', 'c3',  'f1r', { color: '#a78bfa', dashed: true, labelText: 'git rebase main' }),
    mkEdge('e-f1r-f2r','f1r', 'f2r', { color: '#a78bfa', labelText: 'commit' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
