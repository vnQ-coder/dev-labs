'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GitInternalsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Object types group
    mkGroup('grp-objects', 0, 0, 820, 150, { label: 'Git Object Types — .git/objects/ (content-addressed store)', color: '#38bdf8' }),
    mkNode('blob',   20,  35, { icon: '📄', title: 'Blob',   sub: 'File content (no name)',       color: '#10b981', badge: 'SHA-1 hash' }),
    mkNode('tree',  220,  35, { icon: '🌲', title: 'Tree',   sub: 'Directory listing (blob refs)', color: '#38bdf8', badge: 'SHA-1 hash' }),
    mkNode('commit',420,  35, { icon: '📸', title: 'Commit', sub: 'Snapshot + author + parent',   color: '#f97316', badge: 'SHA-1 hash' }),
    mkNode('tag',   620,  35, { icon: '🏷️', title: 'Tag',    sub: 'Named pointer to commit',      color: '#a78bfa', badge: 'annotated tag' }),

    // Object graph group
    mkGroup('grp-graph', 0, 180, 780, 200, { label: 'Object Graph — how a commit resolves to files', color: '#f97316' }),
    mkNode('obj-commit1', 20,  215, { icon: '📸', title: 'commit abc123', sub: 'tree: def456\nparent: 789…\nauthor: …', color: '#f97316' }),
    mkNode('obj-tree1',  240,  215, { icon: '🌲', title: 'tree def456',   sub: 'blob: README.md → aaa\nblob: src/ → bbb (tree)', color: '#38bdf8' }),
    mkNode('obj-blob1',  480,  190, { icon: '📄', title: 'blob aaa',      sub: 'README.md content', color: '#10b981' }),
    mkNode('obj-tree2',  480,  260, { icon: '🌲', title: 'tree bbb',      sub: 'blob: index.ts → ccc', color: '#38bdf8', badge: 'subtree (src/)' }),
    mkNode('obj-blob2',  680,  260, { icon: '📄', title: 'blob ccc',      sub: 'index.ts content',  color: '#10b981' }),

    // Refs group
    mkGroup('grp-refs', 0, 410, 620, 140, { label: 'Refs — .git/refs/ and .git/HEAD', color: '#a78bfa' }),
    mkNode('head',       20, 445, { icon: '👁️', title: 'HEAD',        sub: '.git/HEAD',           color: '#dc2626', badge: 'current position' }),
    mkNode('branch-ref', 200, 445, { icon: '🌿', title: 'refs/heads/main', sub: '.git/refs/heads/main', color: '#a78bfa', badge: 'branch ref' }),
    mkNode('commit-hash',420, 445, { icon: '📸', title: 'Commit Hash', sub: 'abc123… (40 chars)',  color: '#f97316' }),

    mkLabel('lbl1', 20,  570, { label: 'Blobs are immutable — same content = same hash (deduplication)', icon: '💡', color: '#10b981' }),
    mkLabel('lbl2', 20,  605, { label: 'HEAD → branch ref → commit → tree → blobs (full snapshot)', icon: '💡', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Object type relationships
    mkEdge('e-commit-tree', 'commit', 'tree',  { color: '#38bdf8', labelText: 'points to root tree' }),
    mkEdge('e-tree-blob',   'tree',   'blob',  { color: '#10b981', labelText: 'contains blobs' }),
    mkEdge('e-tag-commit',  'tag',    'commit',{ color: '#a78bfa', labelText: 'tags a commit' }),

    // Object graph
    mkEdge('e-oc-ot',  'obj-commit1', 'obj-tree1',  { color: '#f97316', labelText: 'tree ref' }),
    mkEdge('e-ot-ob1', 'obj-tree1',   'obj-blob1',  { color: '#10b981', labelText: 'README.md' }),
    mkEdge('e-ot-ot2', 'obj-tree1',   'obj-tree2',  { color: '#38bdf8', labelText: 'src/ subtree' }),
    mkEdge('e-ot2-ob2','obj-tree2',   'obj-blob2',  { color: '#10b981', labelText: 'index.ts' }),

    // Refs chain
    mkEdge('e-head-branch', 'head',       'branch-ref',  { color: '#a78bfa', labelText: 'ref: refs/heads/main' }),
    mkEdge('e-branch-hash', 'branch-ref', 'commit-hash', { color: '#f97316', labelText: 'contains SHA' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
