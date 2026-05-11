'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AwsServerlessDiagram() {
  const nodes: Node[] = useMemo(() => [
    // ── Event Sources (left column) ──────────────────────────────
    mkNode('apigw', 20, 50, {
      icon: '🚪',
      title: 'API Gateway',
      sub: 'REST / HTTP API',
      color: '#22d3ee',
    }),
    mkNode('s3-in', 20, 175, {
      icon: '🪣',
      title: 'S3 Event',
      sub: 'Object upload trigger',
      color: '#f59e0b',
    }),
    mkNode('sqs-in', 20, 300, {
      icon: '📨',
      title: 'SQS',
      sub: 'Message queue source',
      color: '#f59e0b',
    }),

    // ── Lambda handlers (centre column) ─────────────────────────
    mkNode('lambda-api', 250, 50, {
      icon: 'λ',
      title: 'Lambda',
      sub: 'API handler',
      color: '#22d3ee',
      badge: 'handler',
    }),
    mkNode('lambda-process', 250, 175, {
      icon: 'λ',
      title: 'Lambda',
      sub: 'File processor',
      color: '#22d3ee',
      badge: 'handler',
    }),
    mkNode('lambda-consumer', 250, 300, {
      icon: 'λ',
      title: 'Lambda',
      sub: 'Queue consumer',
      color: '#22d3ee',
      badge: 'handler',
    }),

    // ── Outputs (right column) ───────────────────────────────────
    mkNode('dynamo', 500, 50, {
      icon: '⚡',
      title: 'DynamoDB',
      sub: 'NoSQL store',
      color: '#34d399',
    }),
    mkNode('sns', 500, 175, {
      icon: '📣',
      title: 'SNS',
      sub: 'Fan-out notifications',
      color: '#f59e0b',
    }),
    mkNode('s3-out', 500, 300, {
      icon: '🪣',
      title: 'S3',
      sub: 'Processed output',
      color: '#f59e0b',
    }),

    // ── SNS subscribers (far-right column) ──────────────────────
    mkNode('sqs-dlq', 730, 120, {
      icon: '📨',
      title: 'SQS DLQ',
      sub: 'Dead letter queue',
      color: '#f59e0b',
      badge: 'retry',
    }),
    mkNode('email-sms', 730, 230, {
      icon: '📧',
      title: 'Email / SMS',
      sub: 'End-user alerts',
      color: '#38bdf8',
    }),

    // ── Label ────────────────────────────────────────────────────
    mkLabel('lbl', 60, 380, {
      label: 'Serverless: zero idle cost, auto-scales to zero, pay per invocation',
      icon: '💡',
      color: '#22d3ee',
    }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Sources → Lambdas
    mkEdge('e-apigw-lapi', 'apigw', 'lambda-api', { color: '#22d3ee', animated: true }),
    mkEdge('e-s3in-lproc', 's3-in', 'lambda-process', { color: '#f59e0b', animated: true }),
    mkEdge('e-sqsin-lcons', 'sqs-in', 'lambda-consumer', { color: '#f59e0b', animated: true }),

    // Lambdas → outputs
    mkEdge('e-lapi-dynamo', 'lambda-api', 'dynamo', { color: '#34d399' }),
    mkEdge('e-lapi-sns', 'lambda-api', 'sns', { color: '#f59e0b', dashed: true }),
    mkEdge('e-lproc-s3out', 'lambda-process', 's3-out', { color: '#f59e0b' }),
    mkEdge('e-lproc-dynamo', 'lambda-process', 'dynamo', { color: '#34d399', dashed: true }),
    mkEdge('e-lcons-dynamo', 'lambda-consumer', 'dynamo', { color: '#34d399' }),
    mkEdge('e-lcons-sns', 'lambda-consumer', 'sns', { color: '#f59e0b', dashed: true }),

    // SNS fan-out
    mkEdge('e-sns-dlq', 'sns', 'sqs-dlq', { color: '#f59e0b', labelText: 'failed msgs' }),
    mkEdge('e-sns-email', 'sns', 'email-sms', { color: '#38bdf8', animated: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
