'use client';

import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('apigw',   0,   140, { icon: '🚪', title: 'API Gateway',        sub: 'REST / HTTP API',          color: '#38bdf8', badge: '100K req/s auto-scale' }),
  mkNode('lambda1', 220, 140, { icon: '⚡', title: 'Ingest Lambda',      sub: 'Python 3.12 · 512MB',      color: '#f59e0b', badge: 'Validates + transforms',   pills: [{ label: 'p99: 45ms (warm)', color: '#34d399' }, { label: 'Cold start: ~250ms', color: '#64748b' }] }),
  mkNode('sqs',     460, 140, { icon: '📨', title: 'SQS Queue',          sub: 'Standard · Batch=100',     color: '#f59e0b', badge: 'Decoupling buffer',         pills: [{ label: 'Visibility timeout: 30s', color: '#64748b' }, { label: 'Max retention: 14 days', color: '#64748b' }] }),
  mkNode('lambda2', 700, 140, { icon: '⚡', title: 'Process Lambda',     sub: 'Node 20 · 1GB',            color: '#a78bfa', badge: 'Business logic',            pills: [{ label: 'Partial batch failure', color: '#34d399' }, { label: 'Idempotent writes', color: '#64748b' }] }),
  mkNode('dynamo',  940, 60,  { icon: '⚡', title: 'DynamoDB',           sub: 'On-demand capacity',       color: '#34d399', badge: '< 5ms p99',                 pills: [{ label: 'TTL: 90 days', color: '#64748b' }] }),
  mkNode('sns',     940, 240, { icon: '📢', title: 'SNS Topic',          sub: 'Fan-out notifications',    color: '#38bdf8', badge: 'Email · Slack · PagerDuty' }),
  mkNode('dlq',     700, 330, { icon: '💀', title: 'Dead Letter Queue',  sub: 'maxReceiveCount: 3',       color: '#f87171', badge: 'Alert on DLQ depth > 0',    pills: [{ label: 'Failed messages for inspection', color: '#f87171' }] }),

  mkLabel('lbl-scale', 0, 280, { label: 'Scale: 0 → 10,000 concurrent Lambdas in seconds', icon: '📈', color: '#34d399' }),
  mkLabel('lbl-cost',  0, 320, { label: 'Cost: $0.20 per 1M requests + $0.0000166667 per GB-second', icon: '💰', color: '#64748b' }),
];

const edges: Edge[] = [
  mkEdge('e-gw-l1',   'apigw',   'lambda1', { color: '#38bdf8' }),
  mkEdge('e-l1-sqs',  'lambda1', 'sqs',     { color: '#f59e0b', labelText: 'enqueue event' }),
  mkEdge('e-sqs-l2',  'sqs',     'lambda2', { color: '#a78bfa', labelText: 'poll batch=100' }),
  mkEdge('e-l2-dyn',  'lambda2', 'dynamo',  { color: '#34d399', labelText: 'PutItem' }),
  mkEdge('e-l2-sns',  'lambda2', 'sns',     { color: '#38bdf8', labelText: 'Publish' }),
  mkEdge('e-sqs-dlq', 'sqs',     'dlq',     { color: '#f87171', dashed: true, labelText: 'after 3 failures', animated: false }),
];

export default function ServerlessDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
