'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const YT     = '#ff0000';
const CLIENT = '#38bdf8';
const STORE  = '#34d399';
const ASYNC  = '#f59e0b';

// Transcoding workers light up one by one
type WorkerState = { w360: boolean; w720: boolean; w1080: boolean; w4k: boolean };

const WORKER_SEQUENCE: WorkerState[] = [
  { w360: true,  w720: false, w1080: false, w4k: false },
  { w360: true,  w720: true,  w1080: false, w4k: false },
  { w360: true,  w720: true,  w1080: true,  w4k: false },
  { w360: true,  w720: true,  w1080: true,  w4k: true  },
];

export default function YouTubeDiagram() {
  const [workerIdx, setWorkerIdx] = useState(0);
  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % WORKER_SEQUENCE.length;
      setWorkerIdx(i);
      if (i === 0) setUploadCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const ws = WORKER_SEQUENCE[workerIdx];

  const nodes: Node[] = useMemo(() => [
    // Creator side
    mkNode('creator', 10, 175, {
      icon: '🎥',
      title: 'Creator',
      sub: 'raw video upload',
      color: CLIENT,
      badge: `upload #${uploadCount + 1}`,
    }),
    mkNode('upload', 185, 175, {
      icon: '📤',
      title: 'Upload Service',
      sub: 'chunked multipart · resumable',
      color: YT,
      badge: 'GCS resumable API',
    }),
    mkNode('rawstore', 370, 175, {
      icon: '🗄️',
      title: 'Raw Video Store',
      sub: 'GCS cold bucket',
      color: STORE,
      badge: 'original quality',
    }),

    // Transcoding pipeline
    mkNode('pipeline', 560, 80, {
      icon: '⚙️',
      title: 'Transcoding Pipeline',
      sub: 'Zencoder / custom workers',
      color: YT,
      badge: 'parallel processing',
    }),

    // Workers
    mkNode('w360', 740, 0, {
      icon: ws.w360 ? '✅' : '⏳',
      title: '360p Worker',
      sub: '640×360 · ~1 Mbps',
      color: ws.w360 ? STORE : '#475569',
      dim: !ws.w360,
    }),
    mkNode('w720', 740, 110, {
      icon: ws.w720 ? '✅' : '⏳',
      title: '720p Worker',
      sub: '1280×720 · ~4 Mbps',
      color: ws.w720 ? STORE : '#475569',
      dim: !ws.w720,
    }),
    mkNode('w1080', 740, 220, {
      icon: ws.w1080 ? '✅' : '⏳',
      title: '1080p Worker',
      sub: '1920×1080 · ~8 Mbps',
      color: ws.w1080 ? STORE : '#475569',
      dim: !ws.w1080,
    }),
    mkNode('w4k', 740, 330, {
      icon: ws.w4k ? '✅' : '⏳',
      title: '4K Worker',
      sub: '3840×2160 · ~35 Mbps',
      color: ws.w4k ? ASYNC : '#475569',
      dim: !ws.w4k,
    }),

    // CDN
    mkNode('cdn', 900, 165, {
      icon: '🌍',
      title: 'CDN (global edge)',
      sub: 'Google GGC edge nodes',
      color: YT,
      badge: '130+ countries',
      pills: [
        { label: '360p ready', color: ws.w360 ? STORE  : '#334155' },
        { label: '720p ready', color: ws.w720 ? STORE  : '#334155' },
        { label: '1080p ready', color: ws.w1080 ? STORE : '#334155' },
        { label: '4K ready',   color: ws.w4k  ? ASYNC  : '#334155' },
      ],
    }),

    // Viewer side
    mkNode('viewer', 900, 340, {
      icon: '👁️',
      title: 'Viewer',
      sub: 'Adaptive Bitrate Player',
      color: CLIENT,
      badge: 'ABR · HLS / DASH',
    }),

    // Metadata branch (separate)
    mkNode('meta', 370, 360, {
      icon: '📋',
      title: 'Metadata Service',
      sub: 'title · thumbnail · tags',
      color: ASYNC,
      badge: 'Bigtable',
      pills: [{ label: 'recommendations engine', color: ASYNC }],
    }),

    // Label
    mkLabel('lbl', 10, 10, {
      label: '500 hours of video uploaded every minute — transcoded to 10+ formats',
      icon: '🚀',
      color: YT,
    }),
  ], [ws, uploadCount]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-cr-up',    'creator',  'upload',   { color: CLIENT }),
    mkEdge('e-up-raw',   'upload',   'rawstore', { color: STORE }),
    mkEdge('e-raw-pipe', 'rawstore', 'pipeline', { color: YT }),
    mkEdge('e-raw-meta', 'rawstore', 'meta',     { color: ASYNC, dashed: true, labelText: 'extract metadata' }),

    // Pipeline → workers (light up based on state)
    mkEdge('e-pipe-360',  'pipeline', 'w360',  { color: ws.w360  ? STORE  : '#334155', animated: ws.w360 }),
    mkEdge('e-pipe-720',  'pipeline', 'w720',  { color: ws.w720  ? STORE  : '#334155', animated: ws.w720 }),
    mkEdge('e-pipe-1080', 'pipeline', 'w1080', { color: ws.w1080 ? STORE  : '#334155', animated: ws.w1080 }),
    mkEdge('e-pipe-4k',   'pipeline', 'w4k',   { color: ws.w4k   ? ASYNC  : '#334155', animated: ws.w4k }),

    // Workers → CDN
    mkEdge('e-360-cdn',  'w360',  'cdn', { color: ws.w360  ? STORE : '#334155', animated: ws.w360 }),
    mkEdge('e-720-cdn',  'w720',  'cdn', { color: ws.w720  ? STORE : '#334155', animated: ws.w720 }),
    mkEdge('e-1080-cdn', 'w1080', 'cdn', { color: ws.w1080 ? STORE : '#334155', animated: ws.w1080 }),
    mkEdge('e-4k-cdn',   'w4k',   'cdn', { color: ws.w4k   ? ASYNC : '#334155', animated: ws.w4k }),

    // Viewer pulls from CDN
    mkEdge('e-cdn-view', 'cdn',    'viewer', { color: CLIENT }),
    mkEdge('e-view-cdn', 'viewer', 'cdn',    { color: CLIENT, dashed: true, labelText: 'bitrate switch' }),
  ], [ws]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
