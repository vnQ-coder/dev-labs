'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function AWSKMSDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Step 1: GenerateDataKey
    mkNode('app1',      0,   30,  { icon: '💻', title: 'App',              sub: 'Step 1: request DEK', color: '#4db0c9' }),
    mkNode('kms',       200, 30,  { icon: '🔐', title: 'KMS',              sub: 'GenerateDataKey',     color: '#4db0c9', badge: 'FIPS 140-2 HSM' }),
    mkNode('dek-plain', 430, 0,   { icon: '🔑', title: 'Plaintext DEK',    sub: 'use once, then discard', color: '#34d399' }),
    mkNode('dek-enc',   430, 90,  { icon: '📦', title: 'Encrypted DEK',    sub: 'wrapped by CMK',      color: '#f59e0b', badge: 'safe to store' }),

    // Step 2: encrypt data locally
    mkNode('app2',      0,   200, { icon: '💻', title: 'App',              sub: 'Step 2: encrypt locally', color: '#4db0c9' }),
    mkNode('cipher',    200, 200, { icon: '🔒', title: 'Ciphertext',       sub: 'AES-256-GCM output',  color: '#a78bfa' }),

    // Step 3: store
    mkGroup('store-group', 400, 170, 200, 90, { label: 'S3 / DB Storage', color: '#64748b' }),
    mkNode('s3-cipher', 15, 15, { icon: '🗃️', title: 'Ciphertext',   sub: 'encrypted data',   color: '#a78bfa' }, { parentId: 'store-group' }),
    mkNode('s3-dek',    115, 15,{ icon: '📦', title: 'Enc DEK',       sub: 'alongside data',   color: '#f59e0b' }, { parentId: 'store-group' }),

    // Step 4: decrypt
    mkNode('app3',      0,   340, { icon: '💻', title: 'App',              sub: 'Step 4: decrypt',      color: '#4db0c9' }),
    mkNode('kms2',      200, 340, { icon: '🔐', title: 'KMS Decrypt',      sub: 'unwrap DEK via CMK',  color: '#4db0c9' }),
    mkNode('dek-out',   430, 340, { icon: '🔑', title: 'Plaintext DEK',    sub: 'decrypts ciphertext', color: '#34d399' }),

    // CloudTrail
    mkNode('ct', 200, 460, { icon: '📋', title: 'CloudTrail', sub: 'every KMS API call logged', color: '#64748b', badge: 'audit trail' }),

    // Bottom label
    mkLabel('lbl', 50, 530, { label: 'KMS never sees your data — only the 4KB DEK crosses the boundary', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Step 1
    mkEdge('e-app1-kms',    'app1',      'kms',       { color: '#4db0c9', labelText: 'GenerateDataKey' }),
    mkEdge('e-kms-plain',   'kms',       'dek-plain',  { color: '#34d399', labelText: 'plaintext copy' }),
    mkEdge('e-kms-enc',     'kms',       'dek-enc',    { color: '#f59e0b', labelText: 'encrypted copy' }),

    // Step 2
    mkEdge('e-plain-enc',   'dek-plain', 'app2',       { color: '#34d399', labelText: 'encrypt data' }),
    mkEdge('e-app2-cipher', 'app2',      'cipher',     { color: '#a78bfa' }),

    // Step 3 (store)
    mkEdge('e-cipher-s3',   'cipher',    's3-cipher',  { color: '#a78bfa', labelText: 'store' }),
    mkEdge('e-dek-s3',      'dek-enc',   's3-dek',     { color: '#f59e0b', labelText: 'store' }),

    // Step 4 (decrypt)
    mkEdge('e-s3dek-app3',  's3-dek',   'app3',        { color: '#f59e0b', dashed: true, labelText: 'retrieve enc DEK' }),
    mkEdge('e-app3-kms2',   'app3',      'kms2',        { color: '#4db0c9', labelText: 'KMS Decrypt' }),
    mkEdge('e-kms2-dekout', 'kms2',      'dek-out',     { color: '#34d399', labelText: 'plaintext DEK' }),
    mkEdge('e-dekout-ciph', 'dek-out',   's3-cipher',   { color: '#a78bfa', dashed: true, labelText: 'decrypts' }),

    // CloudTrail watches KMS
    mkEdge('e-kms-ct',  'kms',  'ct', { color: '#64748b', dashed: true, animated: false }),
    mkEdge('e-kms2-ct', 'kms2', 'ct', { color: '#64748b', dashed: true, animated: false }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
