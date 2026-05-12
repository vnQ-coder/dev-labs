'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function TwitchDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Streamer (left)
    mkNode('obs', 20, 160, {
      icon: '🎮',
      title: 'Streamer (OBS)',
      sub: 'RTMP push client',
      color: '#94a3b8',
    }),

    // Ingest edge
    mkNode('ingest', 200, 160, {
      icon: '📡',
      title: 'Ingest Edge',
      sub: 'RTMP termination',
      color: '#9146ff',
      badge: 'RTMP/SRT',
    }),

    // Transcode cluster
    mkNode('transcode', 390, 160, {
      icon: '⚙️',
      title: 'GPU Transcode',
      sub: 'FFmpeg cluster',
      color: pulse ? '#9146ff' : '#7c3aed',
      badge: '5 quality tiers',
    }),

    // HLS segments
    mkNode('hls', 570, 80, {
      icon: '🗂️',
      title: 'HLS Segments',
      sub: '2–6s chunks',
      color: '#9146ff',
    }),

    // CDN Edge
    mkNode('cdn', 740, 80, {
      icon: '🌍',
      title: 'CDN Edge',
      sub: 'Global PoPs',
      color: '#6366f1',
    }),

    // Viewer browser
    mkNode('viewer', 900, 160, {
      icon: '🖥️',
      title: 'Viewer Browser',
      sub: 'HLS.js / native',
      color: '#38bdf8',
    }),

    // PubSub chat server
    mkNode('pubsub', 570, 300, {
      icon: '💬',
      title: 'PubSub Chat',
      sub: 'WebSocket server',
      color: '#f59e0b',
      badge: '100K msg/min',
    }),

    // S3 VOD
    mkNode('s3vod', 570, 420, {
      icon: '🗄️',
      title: 'S3 VOD Storage',
      sub: 'Clip archive',
      color: '#34d399',
      badge: '2s segments',
    }),

    // Label
    mkLabel('lbl', 160, 430, {
      label: '100K+ simultaneous live channels · HLS pull scales to 7M viewers',
      icon: '💡',
      color: '#9146ff',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Streamer pipeline
    mkEdge('e-obs-ingest', 'obs', 'ingest', { color: '#94a3b8', animated: pulse }),
    mkEdge('e-ingest-trans', 'ingest', 'transcode', { color: '#9146ff', animated: pulse }),

    // Video path
    mkEdge('e-trans-hls', 'transcode', 'hls', { color: '#9146ff', animated: pulse }),
    mkEdge('e-hls-cdn', 'hls', 'cdn', { color: '#6366f1', animated: pulse }),
    mkEdge('e-cdn-viewer', 'cdn', 'viewer', { color: '#38bdf8', animated: pulse }),

    // Chat loop (dashed)
    mkEdge('e-viewer-pubsub', 'viewer', 'pubsub', {
      color: '#f59e0b',
      animated: pulse,
      dashed: true,
    }),
    mkEdge('e-pubsub-viewer', 'pubsub', 'viewer', {
      color: '#f59e0b',
      animated: pulse,
      dashed: true,
    }),

    // VOD archive (dashed secondary path)
    mkEdge('e-trans-s3', 'transcode', 's3vod', {
      color: '#34d399',
      animated: false,
      dashed: true,
      srcHandle: 'b',
      tgtHandle: 't',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
