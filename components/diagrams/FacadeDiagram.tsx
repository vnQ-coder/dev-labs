'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function FacadeDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkNode('client',  0,   200, { icon: '💻', title: 'Client',          sub: 'one simple call',          color: '#38bdf8' }),
    mkNode('facade',  220, 200, { icon: '🏛️', title: 'Facade',          sub: 'simplified unified API',   color: '#a78bfa', badge: 'Single entry point' }),
    mkNode('sub1',    480, 60,  { icon: '⚙️', title: 'VideoEncoder',    sub: 'subsystem A',              color: '#34d399' }),
    mkNode('sub2',    480, 180, { icon: '🔊', title: 'AudioMixer',       sub: 'subsystem B',              color: '#34d399' }),
    mkNode('sub3',    480, 300, { icon: '📁', title: 'FileManager',      sub: 'subsystem C',              color: '#34d399' }),
    mkNode('sub4',    480, 420, { icon: '🌐', title: 'CDNUploader',      sub: 'subsystem D',              color: '#34d399' }),
    mkLabel('lbl',    80,  360, { label: 'Client interacts with one class — complexity lives behind the Facade', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'client', 'facade', { color: '#38bdf8', labelText: 'processVideo()' }),
    mkEdge('e2', 'facade', 'sub1',   { color: '#a78bfa' }),
    mkEdge('e3', 'facade', 'sub2',   { color: '#a78bfa' }),
    mkEdge('e4', 'facade', 'sub3',   { color: '#a78bfa' }),
    mkEdge('e5', 'facade', 'sub4',   { color: '#a78bfa' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
