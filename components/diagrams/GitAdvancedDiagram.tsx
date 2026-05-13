'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GitAdvancedDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Cherry-pick group
    mkGroup('grp-cherry', 0, 0, 560, 130, { label: 'git cherry-pick — copy specific commit', color: '#f97316' }),
    mkNode('cp-src1', 20,  35, { icon: '🔵', title: 'A1', sub: 'main branch', color: '#38bdf8' }),
    mkNode('cp-src2', 170, 35, { icon: '🍒', title: 'A2', sub: 'target commit', color: '#f97316', badge: 'cherry-pick this' }),
    mkNode('cp-src3', 320, 35, { icon: '🔵', title: 'A3', sub: 'main branch', color: '#38bdf8' }),
    mkNode('cp-dst',  470, 35, { icon: '🍒', title: "A2'", sub: 'copied to feature', color: '#f97316', badge: 'applied copy' }),

    // Interactive rebase group
    mkGroup('grp-irebase', 0, 160, 620, 130, { label: 'git rebase -i — squash, reorder, edit commits', color: '#a78bfa' }),
    mkNode('rb-b1', 20,  195, { icon: '📝', title: 'B1', sub: 'pick commit', color: '#a78bfa' }),
    mkNode('rb-b2', 160, 195, { icon: '📝', title: 'B2', sub: 'squash into B1', color: '#a78bfa', badge: 'squash' }),
    mkNode('rb-b3', 300, 195, { icon: '📝', title: 'B3', sub: 'reword message', color: '#a78bfa', badge: 'reword' }),
    mkNode('rb-out', 470, 195, { icon: '✅', title: "B1+B2'", sub: 'clean history', color: '#10b981', badge: 'result' }),

    // Git bisect group
    mkGroup('grp-bisect', 0, 320, 660, 130, { label: 'git bisect — binary search for bug', color: '#dc2626' }),
    mkNode('bis-g',   20,  355, { icon: '✅', title: 'Good', sub: 'v1.0 — no bug', color: '#10b981', badge: 'git bisect good' }),
    mkNode('bis-m1', 180,  355, { icon: '❓', title: 'Mid 1', sub: 'bisect checks here first', color: '#f97316' }),
    mkNode('bis-m2', 350,  355, { icon: '❓', title: 'Mid 2', sub: 'narrow down further', color: '#f97316' }),
    mkNode('bis-bad', 530, 355, { icon: '❌', title: 'Bad', sub: 'bug introduced here', color: '#dc2626', badge: 'git bisect bad' }),

    // Git stash group
    mkGroup('grp-stash', 0, 480, 620, 130, { label: 'git stash — park work in progress', color: '#64748b' }),
    mkNode('st-wip',   20,  515, { icon: '🚧', title: 'WIP Changes', sub: 'dirty working tree', color: '#f97316' }),
    mkNode('st-stash', 220, 515, { icon: '📥', title: 'Stash Stack', sub: 'stash@{0}, stash@{1}…', color: '#64748b', badge: 'git stash push' }),
    mkNode('st-clean', 430, 515, { icon: '🧹', title: 'Clean Tree', sub: 'switch branches freely', color: '#10b981' }),
    mkNode('st-pop',   430, 575, { icon: '📤', title: 'Restored WIP', sub: 'back to working tree', color: '#f97316', badge: 'git stash pop' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Cherry-pick
    mkEdge('e-cp-1-2', 'cp-src1', 'cp-src2', { color: '#38bdf8' }),
    mkEdge('e-cp-2-3', 'cp-src2', 'cp-src3', { color: '#38bdf8' }),
    mkEdge('e-cp-pick', 'cp-src2', 'cp-dst', { color: '#f97316', dashed: true, labelText: 'git cherry-pick A2' }),

    // Interactive rebase
    mkEdge('e-rb-1-2', 'rb-b1', 'rb-b2', { color: '#a78bfa', labelText: 'squash' }),
    mkEdge('e-rb-2-3', 'rb-b2', 'rb-b3', { color: '#a78bfa', labelText: 'reword' }),
    mkEdge('e-rb-out',  'rb-b3', 'rb-out', { color: '#10b981', labelText: 'result' }),

    // Bisect
    mkEdge('e-bis-g-m1',  'bis-g',  'bis-m1', { color: '#f97316', labelText: 'check midpoint' }),
    mkEdge('e-bis-m1-m2', 'bis-m1', 'bis-m2', { color: '#f97316', labelText: 'good → upper half' }),
    mkEdge('e-bis-m2-bad','bis-m2', 'bis-bad', { color: '#dc2626', labelText: 'bad found' }),

    // Stash
    mkEdge('e-st-wip-stash', 'st-wip',   'st-stash', { color: '#64748b', labelText: 'git stash push' }),
    mkEdge('e-st-stash-cln', 'st-stash', 'st-clean', { color: '#10b981', labelText: 'work on other branch' }),
    mkEdge('e-st-cln-pop',   'st-clean', 'st-pop',   { color: '#f97316', dashed: true, labelText: 'git stash pop' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
