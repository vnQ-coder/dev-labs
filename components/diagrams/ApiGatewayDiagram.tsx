'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const NODES: Node[] = [
  // Clients (left)
  mkNode('mobile', 0,   20,  { icon: '📱', title: 'Mobile App', sub: 'iOS / Android',  color: '#64748b' }),
  mkNode('web',    0,   145, { icon: '🌐', title: 'Web App',    sub: 'React / Vue',    color: '#64748b' }),
  mkNode('iot',    0,   270, { icon: '⚙️', title: 'IoT Device', sub: 'MQTT / HTTPS',   color: '#64748b' }),

  // API Gateway (center)
  mkNode('gw', 240, 130, {
    icon: '🚪',
    title: 'API Gateway',
    sub: 'AWS API GW / Kong',
    color: '#38bdf8',
    badge: 'Single entry point',
    pills: [
      { label: '🔒 Auth & JWT',     color: '#34d399' },
      { label: '⏱ Rate Limiting',   color: '#f59e0b' },
      { label: '🔀 Smart Routing',  color: '#a78bfa' },
      { label: '📝 Access Logs',    color: '#38bdf8' },
    ],
  }),

  // Backend services (right)
  mkNode('svc-user', 520, 20,  { icon: '👤', title: 'User Service',    sub: 'Port 3001', color: '#34d399' }),
  mkNode('svc-pay',  520, 130, { icon: '💳', title: 'Payment Service', sub: 'Port 3002', color: '#f59e0b' }),
  mkNode('svc-ord',  520, 240, { icon: '📦', title: 'Order Service',   sub: 'Port 3003', color: '#a78bfa' }),
  mkNode('svc-ntf',  520, 350, { icon: '🔔', title: 'Notify Service',  sub: 'Port 3004', color: '#f97316' }),
];

const EDGES: Edge[] = [
  // Clients → Gateway
  mkEdge('e-mob-gw', 'mobile', 'gw', { color: '#38bdf8' }),
  mkEdge('e-web-gw', 'web',    'gw', { color: '#38bdf8' }),
  mkEdge('e-iot-gw', 'iot',    'gw', { color: '#38bdf8' }),

  // Gateway → Services
  mkEdge('e-gw-usr', 'gw', 'svc-user', { color: '#34d399', labelText: 'GET /users'   }),
  mkEdge('e-gw-pay', 'gw', 'svc-pay',  { color: '#f59e0b', labelText: 'POST /pay'    }),
  mkEdge('e-gw-ord', 'gw', 'svc-ord',  { color: '#a78bfa', labelText: 'GET /orders'  }),
  mkEdge('e-gw-ntf', 'gw', 'svc-ntf',  { color: '#f97316', labelText: 'POST /notify' }),
];

export default function ApiGatewayDiagram() {
  return <FlowDiagram nodes={NODES} edges={EDGES} />;
}
