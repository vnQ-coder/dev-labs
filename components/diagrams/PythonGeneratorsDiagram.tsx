'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function PythonGeneratorsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Regular function
    mkGroup('grp-regular', 0, 0, 620, 120, { label: 'Regular Function — builds entire list in memory', color: '#dc2626' }),
    mkNode('reg-fn', 20, 40, { icon: '📦', title: 'list()', sub: 'Builds full list at once', color: '#dc2626', badge: 'O(n) memory' }),
    mkNode('reg-mem', 220, 40, { icon: '🗄', title: 'Memory Buffer', sub: 'All 10 GB in RAM', color: '#dc2626', badge: 'HIGH MEMORY' }),
    mkNode('reg-ret', 430, 40, { icon: '↩', title: 'return', sub: 'Returns everything at once', color: '#64748b' }),

    // Generator function
    mkGroup('grp-gen', 0, 150, 720, 130, { label: 'Generator Function — lazy, one item at a time', color: '#10b981' }),
    mkNode('gen-fn', 20, 195, { icon: '🏭', title: 'generator()', sub: 'yield — pauses execution', color: '#10b981', badge: 'O(1) memory' }),
    mkNode('gen-yield', 220, 195, { icon: '⏸', title: 'yield item', sub: 'Sends one value to caller', color: '#10b981' }),
    mkNode('gen-caller', 430, 195, { icon: '👤', title: 'Caller', sub: 'Processes item, calls next()', color: '#38bdf8' }),
    mkNode('gen-resume', 600, 195, { icon: '▶', title: 'Resume', sub: 'Generator continues from yield', color: '#10b981' }),

    // Generator pipeline
    mkGroup('grp-pipeline', 0, 315, 800, 130, { label: 'Generator Pipeline — constant memory, data flows one chunk at a time', color: '#a78bfa' }),
    mkNode('file-reader', 20, 360, { icon: '📂', title: 'file_reader()', sub: 'Reads lines lazily', color: '#a78bfa', badge: 'yield line' }),
    mkNode('filter-lines', 220, 360, { icon: '🔍', title: 'filter_lines()', sub: 'Skips empty/comments', color: '#a78bfa', badge: 'yield line' }),
    mkNode('parse-csv', 430, 360, { icon: '📊', title: 'parse_csv()', sub: 'Parses each record', color: '#a78bfa', badge: 'yield record' }),
    mkNode('consumer', 640, 360, { icon: '✅', title: 'consumer', sub: 'Processes final record', color: '#10b981', badge: 'for item in ...' }),

    // yield from
    mkGroup('grp-yield-from', 0, 480, 560, 110, { label: 'yield from — delegate to sub-generator', color: '#f97316' }),
    mkNode('outer-gen', 20, 520, { icon: '🏗', title: 'outer_gen()', sub: 'yield from inner_gen()', color: '#f97316' }),
    mkNode('inner-gen', 260, 520, { icon: '🔩', title: 'inner_gen()', sub: 'yields values directly to caller', color: '#f97316', badge: 'transparent delegation' }),

    mkLabel('lbl', 0, 615, { label: 'Generators = lazy evaluation. Process 10GB files with constant memory.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Regular function flow
    mkEdge('e-reg-mem', 'reg-fn', 'reg-mem', { color: '#dc2626', labelText: 'allocates all at once' }),
    mkEdge('e-mem-ret', 'reg-mem', 'reg-ret', { color: '#dc2626' }),

    // Generator flow
    mkEdge('e-gen-yield', 'gen-fn', 'gen-yield', { color: '#10b981', labelText: 'suspends' }),
    mkEdge('e-yield-caller', 'gen-yield', 'gen-caller', { color: '#10b981', labelText: 'sends value' }),
    mkEdge('e-caller-resume', 'gen-caller', 'gen-resume', { color: '#38bdf8', dashed: true, labelText: 'next()' }),
    mkEdge('e-resume-fn', 'gen-resume', 'gen-fn', { color: '#10b981', dashed: true, labelText: 'resumes at yield' }),

    // Pipeline
    mkEdge('e-fr-fl', 'file-reader', 'filter-lines', { color: '#a78bfa', labelText: 'one line' }),
    mkEdge('e-fl-pc', 'filter-lines', 'parse-csv', { color: '#a78bfa', labelText: 'one line' }),
    mkEdge('e-pc-con', 'parse-csv', 'consumer', { color: '#10b981', labelText: 'one record' }),

    // yield from
    mkEdge('e-outer-inner', 'outer-gen', 'inner-gen', { color: '#f97316', labelText: 'yield from' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
