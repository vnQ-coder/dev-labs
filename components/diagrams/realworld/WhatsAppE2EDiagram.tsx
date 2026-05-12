'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function WhatsAppE2EDiagram() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    mkNode('sender', 30, 160, {
      icon: '📱',
      title: 'Sender Client',
      sub: 'iOS / Android',
      color: '#25d366',
      badge: 'Signal Protocol',
    }),
    mkNode('chatA', 220, 100, {
      icon: '🖧',
      title: 'Chat Server A',
      sub: 'WhatsApp DC',
      color: '#25d366',
      badge: 'XMPP binary',
    }),
    mkNode('zookeeper', 370, 30, {
      icon: '🦓',
      title: 'Zookeeper',
      sub: 'server routing table',
      color: '#f59e0b',
      badge: 'server routing table',
    }),
    mkNode('chatB', 520, 100, {
      icon: '🖧',
      title: 'Chat Server B',
      sub: 'recipient DC',
      color: '#25d366',
    }),
    mkNode('recipient', 680, 160, {
      icon: '📱',
      title: 'Recipient Client',
      sub: 'iOS / Android',
      color: '#25d366',
    }),
    mkNode('scylla', 370, 230, {
      icon: '🗄️',
      title: 'ScyllaDB',
      sub: 'offline message queue',
      color: '#a78bfa',
      badge: 'offline queue · 30d TTL',
    }),
    mkNode('media', 370, 360, {
      icon: '☁️',
      title: 'Media Server (S3)',
      sub: 'encrypted blob store',
      color: '#34d399',
      badge: 'client-side encrypted',
    }),
    mkLabel('lbl', 180, 430, {
      label: '2B users · Signal Protocol — server never sees plaintext',
      icon: '🔒',
      color: '#25d366',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-sender-chatA', 'sender', 'chatA', {
      color: '#25d366',
      animated: pulse,
      labelText: 'encrypt',
    }),
    mkEdge('e-chatA-zoo', 'chatA', 'zookeeper', {
      color: '#f59e0b',
      animated: false,
      labelText: 'lookup recipient server',
    }),
    mkEdge('e-zoo-chatB', 'zookeeper', 'chatB', {
      color: '#f59e0b',
      animated: false,
    }),
    mkEdge('e-chatA-chatB', 'chatA', 'chatB', {
      color: '#25d366',
      animated: pulse,
      labelText: 'forward msg',
    }),
    mkEdge('e-chatB-recipient', 'chatB', 'recipient', {
      color: '#25d366',
      animated: pulse,
      labelText: 'deliver',
    }),
    mkEdge('e-chatA-scylla', 'chatA', 'scylla', {
      color: '#a78bfa',
      animated: false,
      dashed: true,
      labelText: 'offline queue',
    }),
    mkEdge('e-scylla-chatB', 'scylla', 'chatB', {
      color: '#a78bfa',
      animated: false,
      dashed: true,
      labelText: 'flush on reconnect',
    }),
    mkEdge('e-sender-media', 'sender', 'media', {
      color: '#34d399',
      animated: pulse,
      labelText: 'upload blob',
    }),
    mkEdge('e-media-chatA', 'media', 'chatA', {
      color: '#34d399',
      animated: false,
      dashed: true,
      labelText: 'URL + key in msg',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
