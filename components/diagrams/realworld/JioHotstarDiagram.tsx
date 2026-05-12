'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function JioHotstarDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Source (left column)
    mkNode('cameras', 20, 80, {
      icon: '🎥',
      title: 'Stadium Cameras',
      sub: 'Multi-angle feeds',
      color: '#94a3b8',
    }),

    // Encoding at stadium
    mkNode('srt-enc', 190, 80, {
      icon: '📡',
      title: 'SRT Encoder',
      sub: 'Stadium hardware',
      color: '#1b4ddb',
    }),

    // Cloud ingest
    mkNode('ingest', 360, 80, {
      icon: '☁️',
      title: 'Ingest Server',
      sub: 'Cloud entry point',
      color: '#1b4ddb',
      badge: 'SRT protocol',
    }),

    // ABR encoding
    mkNode('ffmpeg', 360, 230, {
      icon: '⚙️',
      title: 'FFmpeg ABR',
      sub: 'Adaptive bitrate',
      color: '#6366f1',
      badge: '10 quality tiers',
    }),

    // Segments storage / origin
    mkNode('segments', 530, 230, {
      icon: '🗂️',
      title: 'HLS/DASH Segments',
      sub: 'Packaged streams',
      color: '#1b4ddb',
    }),

    // CDN nodes
    mkNode('jiocdn', 700, 130, {
      icon: '🌐',
      title: 'JioCDN Edge',
      sub: 'Reliance network',
      color: pulse ? '#1b4ddb' : '#1540c0',
      badge: '400M Jio users',
    }),
    mkNode('akamai', 700, 280, {
      icon: '🌍',
      title: 'Akamai CDN',
      sub: 'Global edge PoPs',
      color: '#0ea5e9',
    }),

    // Viewer
    mkNode('viewer', 870, 200, {
      icon: '📱',
      title: 'Mobile App',
      sub: 'Viewer client',
      color: '#38bdf8',
    }),

    // WebSocket score server
    mkNode('ws-score', 530, 380, {
      icon: '🏏',
      title: 'WS Score Server',
      sub: 'Live scorecard',
      color: '#f59e0b',
      badge: '< 1s latency',
    }),

    // Label
    mkLabel('lbl', 180, 420, {
      label: '50M concurrent viewers · JioCDN serves Jio users inside Reliance network',
      icon: '💡',
      color: '#1b4ddb',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Stadium pipeline
    mkEdge('e-cam-enc', 'cameras', 'srt-enc', { color: '#94a3b8', animated: pulse }),
    mkEdge('e-enc-ingest', 'srt-enc', 'ingest', { color: '#1b4ddb', animated: pulse }),

    // Cloud pipeline
    mkEdge('e-ingest-ffmpeg', 'ingest', 'ffmpeg', {
      color: '#6366f1',
      animated: pulse,
      srcHandle: 'b',
      tgtHandle: 't',
    }),
    mkEdge('e-ffmpeg-seg', 'ffmpeg', 'segments', { color: '#6366f1', animated: pulse }),

    // CDN distribution
    mkEdge('e-seg-jiocdn', 'segments', 'jiocdn', { color: '#1b4ddb', animated: pulse }),
    mkEdge('e-seg-akamai', 'segments', 'akamai', { color: '#0ea5e9', animated: pulse }),

    // CDN to viewer
    mkEdge('e-jiocdn-viewer', 'jiocdn', 'viewer', { color: '#38bdf8', animated: pulse }),
    mkEdge('e-akamai-viewer', 'akamai', 'viewer', { color: '#38bdf8', animated: pulse }),

    // Score server path (dashed)
    mkEdge('e-ingest-ws', 'ingest', 'ws-score', {
      color: '#f59e0b',
      animated: pulse,
      dashed: true,
      srcHandle: 'b',
      tgtHandle: 't',
    }),
    mkEdge('e-ws-viewer', 'ws-score', 'viewer', {
      color: '#f59e0b',
      animated: pulse,
      dashed: true,
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
