'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NodeStreamsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Main pipeline group
    mkGroup('grp-pipeline', 0, 0, 860, 140, { label: 'Stream Pipeline — Data Source to Destination', color: '#3b82f6' }),
    mkNode('source',      20,  45, { icon: '📁', title: 'Data Source',         sub: 'File / HTTP request / DB cursor',   color: '#64748b', badge: 'producer' }),
    mkNode('readable',   210,  45, {
      icon: '📖',
      title: 'Readable Stream',
      sub: 'highWaterMark buffer (16 KB default)',
      color: '#3b82f6',
      badge: 'flowing / paused modes',
    }),
    mkNode('transform',  440,  45, {
      icon: '⚙️',
      title: 'Transform Stream',
      sub: 'decompress / encrypt / parse',
      color: '#f97316',
      badge: 'duplex',
    }),
    mkNode('writable',   660,  45, {
      icon: '✍️',
      title: 'Writable Stream',
      sub: 'File / HTTP response / DB insert',
      color: '#10b981',
      badge: 'consumer',
    }),
    mkNode('dest',       820,  45, { icon: '🏁', title: 'Destination',         sub: 'disk / network / stdout',           color: '#64748b' }),

    // Backpressure group
    mkGroup('grp-backpressure', 0, 170, 860, 140, { label: 'Backpressure — Flow Control', color: '#dc2626' }),
    mkNode('wrslowdown', 20, 215, {
      icon: '🐢',
      title: 'Writable is slow',
      sub: 'write() returns false',
      color: '#dc2626',
      badge: 'buffer full',
    }),
    mkNode('rdpause',   250, 215, {
      icon: '⏸️',
      title: 'Readable pauses',
      sub: '.pause() called automatically',
      color: '#f97316',
      badge: 'stops reading',
    }),
    mkNode('srcstop',   470, 215, {
      icon: '🛑',
      title: 'Source stops',
      sub: 'no more data pushed',
      color: '#eab308',
      badge: 'pressure applied' ,
    }),
    mkNode('drain',     680, 215, {
      icon: '✅',
      title: '"drain" event',
      sub: 'Writable buffer cleared → resume',
      color: '#10b981',
      badge: 'pressure released',
    }),

    // pipe group
    mkGroup('grp-pipe', 0, 335, 860, 120, { label: 'pipe() and stream.pipeline()', color: '#8b5cf6' }),
    mkNode('pipe',       20, 380, {
      icon: '🔗',
      title: 'readable.pipe(writable)',
      sub: 'connects streams, handles backpressure',
      color: '#8b5cf6',
      badge: 'no error forwarding',
    }),
    mkNode('pipeline',  380, 380, {
      icon: '🛡️',
      title: 'stream.pipeline(..., cb)',
      sub: 'cleans up on error, preferred',
      color: '#6366f1',
      badge: 'with error handling',
      pills: [{ label: 'Node 10+', color: '#4f46e5' }],
    }),

    // Label
    mkLabel('lbl', 60, 475, { label: 'Use stream.pipeline() — it auto-destroys streams on error and prevents memory leaks', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Main pipeline
    mkEdge('e-src-rd',  'source',    'readable',   { color: '#3b82f6', labelText: 'produces chunks' }),
    mkEdge('e-rd-tr',   'readable',  'transform',  { color: '#f97316', labelText: 'pipe / pipeline' }),
    mkEdge('e-tr-wr',   'transform', 'writable',   { color: '#10b981', labelText: 'pipe / pipeline' }),
    mkEdge('e-wr-dst',  'writable',  'dest',       { color: '#64748b' }),

    // Backpressure flow
    mkEdge('e-bp-wr',   'wrslowdown','rdpause',    { color: '#f97316', labelText: 'signals readable' }),
    mkEdge('e-bp-rd',   'rdpause',   'srcstop',    { color: '#eab308', labelText: 'stops reading' }),
    mkEdge('e-bp-dr',   'drain',     'rdpause',    { color: '#10b981', labelText: 'resume()', dashed: true }),

    // pipe vs pipeline
    mkEdge('e-pipe-pl', 'pipe',      'pipeline',   { color: '#6366f1', dashed: true, labelText: 'prefer pipeline' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
