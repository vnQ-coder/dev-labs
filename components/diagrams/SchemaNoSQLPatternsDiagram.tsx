'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaNoSQLPatternsDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkLabel('lbl-embed', 0,   0,  { label: 'EMBED', color: '#4ade80' }),
    mkLabel('lbl-ref',   600, 0,  { label: 'REFERENCE', color: '#38bdf8' }),

    mkLabel('lbl-when-embed', 0, 50, { label: 'Use when...', color: '#4ade80' }),
    mkNode('embed-bounded',   0,   110, { icon: '📏', title: 'Bounded Size',          sub: 'array will not grow unboundedly',          color: '#4ade80' }),
    mkNode('embed-together',  0,   230, { icon: '📖', title: 'Read Together',          sub: 'data is always fetched with parent doc',   color: '#4ade80' }),
    mkNode('embed-no-query',  0,   350, { icon: '🚫', title: 'No Independent Query',  sub: 'sub-document not queried on its own',      color: '#4ade80' }),
    mkNode('embed-example',   0,   470, { icon: '💬', title: 'WhatsApp Example',      sub: 'embed last_message inside conversation doc', color: '#4ade80', badge: 'Embed' }),

    mkLabel('lbl-when-ref', 600, 50, { label: 'Use when...', color: '#38bdf8' }),
    mkNode('ref-unbounded',   600, 110, { icon: '📈', title: 'Unbounded Growth',       sub: 'collection may grow very large over time',  color: '#38bdf8' }),
    mkNode('ref-independent', 600, 230, { icon: '🔍', title: 'Queried Independently',  sub: 'need to query sub-docs without parent',     color: '#38bdf8' }),
    mkNode('ref-shared',      600, 350, { icon: '🔗', title: 'Shared Across Parents',  sub: 'referenced by multiple parent documents',   color: '#38bdf8' }),
    mkNode('ref-example',     600, 470, { icon: '💬', title: 'WhatsApp Example',       sub: 'reference messages as separate collection', color: '#38bdf8', badge: 'Reference' }),

    mkNode('hybrid', 280, 580, { icon: '⚡', title: 'Hybrid Pattern', sub: 'Embed summary + Reference full collection for balance', color: '#a78bfa', badge: 'Best of both' }),

    mkLabel('lbl-note', 0, 700, { label: 'MongoDB rule of thumb: embed for one-to-few, reference for one-to-many and many-to-many', color: '#f59e0b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'embed-bounded',   'embed-together',  { color: '#4ade80' }),
    mkEdge('e2', 'embed-together',  'embed-no-query',  { color: '#4ade80' }),
    mkEdge('e3', 'embed-no-query',  'embed-example',   { color: '#4ade80', labelText: 'leads to' }),
    mkEdge('e4', 'ref-unbounded',   'ref-independent', { color: '#38bdf8' }),
    mkEdge('e5', 'ref-independent', 'ref-shared',      { color: '#38bdf8' }),
    mkEdge('e6', 'ref-shared',      'ref-example',     { color: '#38bdf8', labelText: 'leads to' }),
    mkEdge('e7', 'embed-example',   'hybrid',          { color: '#a78bfa', dashed: true, labelText: 'combine' }),
    mkEdge('e8', 'ref-example',     'hybrid',          { color: '#a78bfa', dashed: true, labelText: 'combine' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
