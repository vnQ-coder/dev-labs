'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NetflixDiagram() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Clients (left column)
    mkNode('mobile', 20, 30, {
      icon: '📱',
      title: 'Mobile App',
      sub: 'iOS / Android',
      color: '#38bdf8',
    }),
    mkNode('web', 20, 155, {
      icon: '🌐',
      title: 'Web Browser',
      sub: 'React / MSE',
      color: '#38bdf8',
    }),
    mkNode('tv', 20, 280, {
      icon: '📺',
      title: 'Smart TV',
      sub: 'Native SDK',
      color: '#38bdf8',
    }),

    // CDN (centre-left)
    mkNode('cdn', 230, 155, {
      icon: '🌍',
      title: 'Open Connect',
      sub: 'CDN Edge Node',
      color: pulse ? '#e50914' : '#c00710',
      badge: '95% traffic local',
    }),

    // API Gateway (top-centre)
    mkNode('apigw', 430, 30, {
      icon: '🚪',
      title: 'API Gateway',
      sub: 'Auth · Rate limit',
      color: '#f59e0b',
    }),

    // Playback Service (centre)
    mkNode('playback', 430, 155, {
      icon: '▶️',
      title: 'Playback Service',
      sub: 'Zuul / Spring Boot',
      color: '#e50914',
    }),

    // Fan-out services (right column)
    mkNode('s3', 640, 30, {
      icon: '🗄️',
      title: 'Video Storage',
      sub: 'Amazon S3',
      color: '#34d399',
    }),
    mkNode('rec', 640, 155, {
      icon: '🤖',
      title: 'Recommendation',
      sub: 'Spark ML',
      color: '#a78bfa',
    }),
    mkNode('kafka', 640, 280, {
      icon: '📊',
      title: 'Analytics',
      sub: 'Apache Kafka',
      color: '#f59e0b',
    }),

    // Label annotation
    mkLabel('lbl', 170, 370, {
      label: 'Open Connect serves 95% of traffic locally inside ISPs',
      icon: '💡',
      color: '#e50914',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Clients → CDN
    mkEdge('e-mob-cdn', 'mobile', 'cdn', { color: '#38bdf8', animated: pulse }),
    mkEdge('e-web-cdn', 'web', 'cdn', { color: '#38bdf8', animated: pulse }),
    mkEdge('e-tv-cdn', 'tv', 'cdn', { color: '#38bdf8', animated: pulse }),

    // CDN → Playback
    mkEdge('e-cdn-play', 'cdn', 'playback', { color: '#e50914', animated: pulse }),

    // API Gateway ↔ Playback
    mkEdge('e-apigw-play', 'apigw', 'playback', {
      color: '#f59e0b',
      animated: false,
      srcHandle: 'b',
      tgtHandle: 't',
    }),

    // Playback fan-out
    mkEdge('e-play-s3', 'playback', 's3', { color: '#34d399', animated: false }),
    mkEdge('e-play-rec', 'playback', 'rec', { color: '#a78bfa', animated: false }),
    mkEdge('e-play-kafka', 'playback', 'kafka', {
      color: '#f59e0b',
      animated: false,
      dashed: true,
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
