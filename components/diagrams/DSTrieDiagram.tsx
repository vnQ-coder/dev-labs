'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function DSTrieDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Root
    mkNode('root', 380, 20, { icon: '🌐', title: 'root', sub: 'trie entry', color: '#64748b' }),

    // Level 1: 'a' and 'b'
    mkNode('a',  240, 110, { title: "'a'", sub: 'prefix a', color: '#10b981' }),
    mkNode('b',  520, 110, { title: "'b'", sub: 'prefix b', color: '#f59e0b' }),

    // Level 2 under 'a': 'p' node
    mkNode('ap', 180, 210, { title: "'p'", sub: 'prefix ap', color: '#10b981' }),

    // Level 2 under 'b': 'a' node
    mkNode('ba', 520, 210, { title: "'a'", sub: 'prefix ba', color: '#f59e0b' }),

    // Level 3 under 'ap': 'p' (app), 't' (apt)
    mkNode('app-node', 100, 310, { title: "'p'", sub: 'app', color: '#10b981', badge: 'app ✓' }),
    mkNode('apl',      180, 310, { title: "'l'", sub: 'appl', color: '#a78bfa' }),
    mkNode('apt',      260, 310, { title: "'t'", sub: 'apt', color: '#10b981', badge: 'apt ✓' }),

    // Level 3 under 'ba': 't' (bat)
    mkNode('bat-node', 520, 310, { title: "'t'", sub: 'bat', color: '#f59e0b', badge: 'bat ✓' }),

    // Level 4 under 'apl': 'e' (apple), 'y' (apply)
    mkNode('apple-node', 140, 400, { title: "'e'", sub: 'apple', color: '#a78bfa', badge: 'apple ✓' }),
    mkNode('apply-node', 230, 400, { title: "'y'", sub: 'apply', color: '#a78bfa', badge: 'apply ✓' }),

    // Autocomplete label
    mkLabel('lbl-auto', 380, 10, {
      label: "Autocomplete: prefix 'app' → app, apple, apply",
      icon: '🔍',
      color: '#10b981',
    }),
    mkLabel('lbl-footer', 60, 445, {
      label: 'O(m) search where m=string length — prefix queries, autocomplete, IP routing',
      icon: '💡',
      color: '#64748b',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Root to level 1
    mkEdge('e-root-a', 'root', 'a',  { color: '#10b981' }),
    mkEdge('e-root-b', 'root', 'b',  { color: '#f59e0b', animated: false }),

    // 'a' subtree
    mkEdge('e-a-ap',  'a',  'ap',       { color: '#10b981' }),
    mkEdge('e-ap-app','ap', 'app-node', { color: '#10b981', labelText: 'app' }),
    mkEdge('e-ap-apl','ap', 'apl',      { color: '#a78bfa', labelText: 'appl' }),
    mkEdge('e-ap-apt','ap', 'apt',      { color: '#10b981', labelText: 'apt' }),

    // 'appl' subtree
    mkEdge('e-apl-apple','apl','apple-node', { color: '#a78bfa', labelText: 'apple' }),
    mkEdge('e-apl-apply','apl','apply-node', { color: '#a78bfa', labelText: 'apply' }),

    // 'b' subtree
    mkEdge('e-b-ba',  'b',  'ba',       { color: '#f59e0b', animated: false }),
    mkEdge('e-ba-bat','ba', 'bat-node', { color: '#f59e0b', animated: false, labelText: 'bat' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
