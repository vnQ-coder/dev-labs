'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function WhatsAppDiagram() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Sender
    mkNode('sender', 20, 155, {
      icon: '📱',
      title: 'Sender Phone',
      sub: 'Online',
      color: '#38bdf8',
    }),

    // Load Balancer
    mkNode('lb', 210, 155, {
      icon: '⚖️',
      title: 'Load Balancer',
      sub: 'HAProxy / NGINX',
      color: '#f59e0b',
    }),

    // Chat Server (centre)
    mkNode('chat', 400, 155, {
      icon: '💬',
      title: 'Chat Server',
      sub: 'Erlang / Ejabberd',
      color: '#25d366',
      badge: '2M conns/server',
    }),

    // Message Store
    mkNode('store', 590, 60, {
      icon: '🗄️',
      title: 'Message Store',
      sub: 'Mnesia / Cassandra',
      color: '#34d399',
    }),

    // Push Notification Service
    mkNode('push', 590, 230, {
      icon: '🔔',
      title: 'Push Notifications',
      sub: 'APNs / FCM',
      color: '#f59e0b',
    }),

    // Recipient phone (online path)
    mkNode('recipient-online', 780, 60, {
      icon: '📱',
      title: 'Recipient',
      sub: 'Online — direct',
      color: '#25d366',
    }),

    // Recipient phone (offline path)
    mkNode('recipient-offline', 780, 230, {
      icon: '📱',
      title: 'Recipient',
      sub: 'Offline — push',
      color: '#64748b',
      dim: true,
    }),

    // Label
    mkLabel('lbl', 140, 355, {
      label: '100B messages/day · 2M connections per server',
      icon: '💡',
      color: '#25d366',
    }),
  ], [pulse]);

  const edges: Edge[] = useMemo(() => [
    // Sender → LB → Chat
    mkEdge('e-sender-lb', 'sender', 'lb', { color: '#38bdf8', animated: pulse }),
    mkEdge('e-lb-chat', 'lb', 'chat', { color: '#25d366', animated: pulse }),

    // Chat → Message Store
    mkEdge('e-chat-store', 'chat', 'store', {
      color: '#34d399',
      animated: false,
      srcHandle: 'r',
      tgtHandle: 'l',
    }),

    // Chat → Push
    mkEdge('e-chat-push', 'chat', 'push', {
      color: '#f59e0b',
      animated: false,
      dashed: true,
      srcHandle: 'b',
    }),

    // Direct delivery (online)
    mkEdge('e-store-online', 'store', 'recipient-online', {
      color: '#25d366',
      animated: pulse,
      labelText: 'online',
    }),

    // Push delivery (offline)
    mkEdge('e-push-offline', 'push', 'recipient-offline', {
      color: '#f59e0b',
      animated: false,
      dashed: true,
      labelText: 'offline',
    }),
  ], [pulse]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
