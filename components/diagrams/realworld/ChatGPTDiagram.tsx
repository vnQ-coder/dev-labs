'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const GPT    = '#10a37f';
const CLIENT = '#38bdf8';
const STORE  = '#34d399';
const ASYNC  = '#f59e0b';

// Token streaming animation — cycles through stream steps
const STREAM_STEPS = ['gpu', 'stream1', 'stream2', 'stream3'] as const;
type StreamStep = (typeof STREAM_STEPS)[number];

export default function ChatGPTDiagram() {
  const [streamStep, setStreamStep] = useState<StreamStep>('gpu');
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % STREAM_STEPS.length;
      setStreamStep(STREAM_STEPS[i]);
      setTokenCount((c) => c + 1);
    }, 800);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Input side
    mkNode('user', 10, 160, {
      icon: '💬',
      title: 'User',
      sub: 'browser · API client',
      color: CLIENT,
      badge: streamStep === 'stream3' ? `← token #${tokenCount}` : 'awaiting…',
    }),
    mkNode('lb', 185, 160, {
      icon: '⚖️',
      title: 'Load Balancer',
      sub: 'L7 · TLS termination',
      color: GPT,
    }),
    mkNode('api', 360, 160, {
      icon: '🖥️',
      title: 'API Server',
      sub: 'session · auth · rate limit',
      color: GPT,
    }),

    // Processing
    mkNode('prompt', 535, 60, {
      icon: '✂️',
      title: 'Prompt Processor',
      sub: 'tokenization · context window mgmt',
      color: GPT,
      badge: 'BPE tokenizer',
    }),
    mkNode('mod', 535, 270, {
      icon: '🛡️',
      title: 'Moderation',
      sub: 'safety classifier',
      color: ASYNC,
      badge: 'content policy',
    }),

    // GPU cluster — wide node
    mkNode('gpu', 720, 120, {
      icon: streamStep === 'gpu' ? '⚡' : '🔮',
      title: 'GPU Inference Cluster',
      sub: 'autoregressive forward pass',
      color: streamStep === 'gpu' ? '#f59e0b' : GPT,
      badge: 'A100 / H100 GPUs',
      pills: [
        { label: 'model: GPT-4o', color: GPT },
        { label: `tokens generated: ${tokenCount}`, color: '#f59e0b' },
      ],
    }),

    // Memory / retrieval
    mkNode('vecdb', 720, 300, {
      icon: '🧠',
      title: 'Vector DB',
      sub: 'memory · RAG retrieval',
      color: STORE,
      badge: 'pgvector / Pinecone',
    }),

    // Streaming response
    mkNode('stream', 900, 160, {
      icon: streamStep !== 'gpu' ? '📡' : '⏳',
      title: 'Token Stream',
      sub: 'SSE / WebSocket chunks',
      color: streamStep !== 'gpu' ? CLIENT : '#475569',
      badge: streamStep !== 'gpu' ? `streaming… #${tokenCount}` : 'waiting',
    }),

    // Label
    mkLabel('lbl', 10, 10, {
      label: 'Autoregressive generation: one token at a time, streamed to client',
      icon: '🔁',
      color: GPT,
    }),
  ], [streamStep, tokenCount]);

  const edges: Edge[] = useMemo(() => {
    const streaming = streamStep !== 'gpu';
    return [
      mkEdge('e-user-lb',     'user',   'lb',     { color: CLIENT }),
      mkEdge('e-lb-api',      'lb',     'api',    { color: GPT }),
      mkEdge('e-api-prompt',  'api',    'prompt', { color: GPT }),
      mkEdge('e-api-mod',     'api',    'mod',    { color: ASYNC, dashed: true, labelText: 'parallel safety check' }),
      mkEdge('e-prompt-gpu',  'prompt', 'gpu',    { color: GPT }),
      mkEdge('e-gpu-vecdb',   'gpu',    'vecdb',  { color: STORE, dashed: true, labelText: 'retrieve context' }),
      mkEdge('e-vecdb-gpu',   'vecdb',  'gpu',    { color: STORE, dashed: true }),
      mkEdge('e-gpu-stream',  'gpu',    'stream', {
        color: streaming ? CLIENT : '#334155',
        animated: streaming,
        labelText: streaming ? 'token chunk' : undefined,
      }),
      mkEdge('e-stream-user', 'stream', 'user',   {
        color: streaming ? CLIENT : '#334155',
        animated: streaming,
      }),
    ];
  }, [streamStep]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
