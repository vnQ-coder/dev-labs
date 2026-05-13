'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NestJSMicroservicesDiagram() {
  const nodes: Node[] = useMemo(() => [
    // HTTP gateway group
    mkGroup('grp-gateway', 0, 0, 300, 110, { label: 'API Gateway — HTTP entry point', color: '#38bdf8' }),
    mkNode('gateway',     20,  35, { icon: '🌐', title: 'API Gateway',          sub: 'HTTP REST — NestJS app',             color: '#38bdf8', badge: 'port 3000' }),
    mkNode('client-proxy',160, 35, { icon: '📡', title: 'ClientProxy',          sub: 'this.client.send() / emit()',        color: '#38bdf8', badge: 'injected' }),

    // Transport group
    mkGroup('grp-transport', 320, 0, 280, 110, { label: 'Transport Layer', color: '#64748b' }),
    mkNode('redis-transport', 340, 35, { icon: '🔀', title: 'Redis Transport',  sub: 'Pub/Sub channels, TCP, NATS, Kafka',  color: '#dc2626', badge: 'configurable' }),

    // Microservice group
    mkGroup('grp-ms', 620, 0, 280, 110, { label: 'Microservice — separate process', color: '#a78bfa' }),
    mkNode('microservice',  640, 35, { icon: '⚙️', title: 'UserMicroservice',   sub: 'NestJS microservice app',            color: '#a78bfa', badge: 'port 3001' }),

    // Patterns group
    mkGroup('grp-patterns', 0, 140, 600, 120, { label: 'Message Patterns — communication styles', color: '#10b981' }),
    mkNode('msg-pattern',   20, 178, { icon: '↔️', title: "@MessagePattern('get_user')", sub: 'Request-response: bidirectional, awaitable', color: '#10b981', badge: 'request-response' }),
    mkNode('evt-pattern',  300, 178, { icon: '📢', title: "@EventPattern('user_created')", sub: 'Fire-and-forget: one-way, no reply',       color: '#f97316', badge: 'event' }),

    // Hybrid app group
    mkGroup('grp-hybrid', 620, 140, 280, 120, { label: 'Hybrid App — one process, two listeners', color: '#38bdf8' }),
    mkNode('hybrid',        640, 178, { icon: '🔀', title: 'Hybrid Application', sub: 'HTTP server + microservice listener in one', color: '#38bdf8', badge: 'app.connectMicroservice()' }),

    // Error flow
    mkGroup('grp-error', 0, 285, 500, 100, { label: 'Error Handling — RpcException', color: '#dc2626' }),
    mkNode('rpc-exc',     20, 320, { icon: '💥', title: 'throw new RpcException()', sub: 'Thrown inside @MessagePattern handler', color: '#dc2626', badge: 'microservice error' }),
    mkNode('exc-filter',  260, 320, { icon: '🚨', title: 'RPC Exception Filter',    sub: '@Catch(RpcException) on gateway',     color: '#dc2626', badge: 'caught at gateway' }),

    mkLabel('lbl', 80, 410, { label: 'send() = request-response (awaitable). emit() = fire-and-forget.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Gateway → transport → microservice
    mkEdge('e-gw-cp',    'gateway',       'client-proxy',    { color: '#38bdf8', labelText: 'uses' }),
    mkEdge('e-cp-trans', 'client-proxy',  'redis-transport',  { color: '#64748b', labelText: 'publish' }),
    mkEdge('e-trans-ms', 'redis-transport','microservice',    { color: '#a78bfa', labelText: 'deliver' }),

    // Patterns
    mkEdge('e-ms-msg',   'microservice',  'msg-pattern',     { color: '#10b981', dashed: true }),
    mkEdge('e-ms-evt',   'microservice',  'evt-pattern',     { color: '#f97316', dashed: true }),

    // Hybrid
    mkEdge('e-ms-hyb',   'microservice',  'hybrid',          { color: '#38bdf8', dashed: true, labelText: 'or use as hybrid' }),

    // Error
    mkEdge('e-ms-exc',   'microservice',  'rpc-exc',         { color: '#dc2626', dashed: true, labelText: 'throws' }),
    mkEdge('e-exc-flt',  'rpc-exc',       'exc-filter',      { color: '#dc2626', labelText: 'caught by' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
