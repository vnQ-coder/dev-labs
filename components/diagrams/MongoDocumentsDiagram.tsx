'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function MongoDocumentsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Top-level: Client → mongod → Collection
    mkNode('client',     20,  20, { icon: '💻', title: 'Client App',   sub: 'Driver / shell',          color: '#64748b' }),
    mkNode('mongod',    230,  20, { icon: '🍃', title: 'mongod',       sub: 'MongoDB server process',   color: '#10b981', badge: 'TCP :27017' }),
    mkNode('collection',440,  20, { icon: '🗂️', title: 'Collection',   sub: 'Schema-free documents',    color: '#38bdf8', badge: 'users' }),

    // Embedding group
    mkGroup('grp-embed', 0, 110, 480, 200, { label: 'Embedding — one document (denormalised)', color: '#10b981' }),
    mkNode('user-embed', 20, 155, {
      icon: '📄',
      title: 'User Document',
      sub: 'BSON — ObjectId, String, Array…',
      color: '#10b981',
      badge: '_id: ObjectId',
    }),
    mkNode('addr-embed', 260, 155, {
      icon: '🏠',
      title: 'Embedded Address',
      sub: '{ street, city, zip }',
      color: '#10b981',
      badge: 'nested sub-doc',
      pills: [{ label: 'no JOIN', color: '#064e3b' }],
    }),
    mkLabel('lbl-embed', 20, 265, { label: 'Best for: 1-to-1 / 1-to-few, read-heavy, data accessed together', icon: '💡', color: '#10b981' }),

    // Referencing group
    mkGroup('grp-ref', 510, 110, 540, 200, { label: 'Referencing — two linked documents (normalised)', color: '#f97316' }),
    mkNode('user-ref',  530, 155, {
      icon: '👤',
      title: 'User Document',
      sub: '_id: ObjectId("u1")',
      color: '#f97316',
      badge: 'users collection',
    }),
    mkNode('order-ref', 780, 155, {
      icon: '🧾',
      title: 'Order Document',
      sub: 'userId: ObjectId("u1")',
      color: '#f97316',
      badge: 'orders collection',
      pills: [{ label: '$lookup / app join', color: '#7c2d12' }],
    }),
    mkLabel('lbl-ref', 530, 265, { label: 'Best for: 1-to-many / many-to-many, write-heavy, independent updates', icon: '💡', color: '#f97316' }),

    // Bottom summary
    mkLabel('lbl-bson', 20, 340, { label: 'BSON types: String · Int · Double · Bool · Array · Object · Date · ObjectId · Binary', icon: '📦', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Client → mongod → Collection
    mkEdge('e-cli-mongo',  'client',     'mongod',     { color: '#64748b', labelText: 'CRUD commands' }),
    mkEdge('e-mongo-col',  'mongod',     'collection', { color: '#38bdf8', labelText: 'read / write' }),

    // Embedding flow
    mkEdge('e-col-uembed', 'collection', 'user-embed', { color: '#10b981', dashed: true }),
    mkEdge('e-uembed-aembed', 'user-embed', 'addr-embed', { color: '#10b981', labelText: 'address: { … }' }),

    // Referencing flow
    mkEdge('e-col-uref',   'collection', 'user-ref',   { color: '#f97316', dashed: true }),
    mkEdge('e-uref-oref',  'user-ref',   'order-ref',  { color: '#f97316', labelText: 'userId →', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
