'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function OOPInheritanceDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Exception hierarchy group
    mkGroup('grp-exc', 0, 0, 780, 180, { label: 'Exception Hierarchy — HttpException chain', color: '#ef4444' }),
    mkNode('http-exc',     20,  70, { icon: '⚡', title: 'HttpException',        sub: 'Node.js / NestJS base',        color: '#64748b', badge: 'base' }),
    mkNode('app-exc',     230,  70, { icon: '🚨', title: 'AppException',          sub: 'extends HttpException',        color: '#f97316', badge: 'extends' }),
    mkNode('not-found',   490,  30, { icon: '🔍', title: 'NotFoundException',     sub: 'extends AppException',         color: '#ef4444', badge: '404' }),
    mkNode('forbidden',   490,  90, { icon: '🚫', title: 'ForbiddenException',    sub: 'extends AppException',         color: '#ef4444', badge: '403' }),
    mkNode('conflict',    490, 145, { icon: '⚠️', title: 'ConflictException',     sub: 'extends AppException',         color: '#ef4444', badge: '409' }),

    // CrudService hierarchy group
    mkGroup('grp-crud', 0, 210, 780, 200, { label: 'CrudService<T> — generic base with override pattern', color: '#38bdf8' }),
    mkNode('crud-svc',    20,  270, {
      icon: '🗂️',
      title: 'CrudService<T>',
      sub: 'findAll · findOne · create · update · remove',
      color: '#38bdf8',
      badge: 'base',
      pills: [{ label: 'public: findAll', color: '#10b981' }, { label: 'protected: repo', color: '#f97316' }, { label: 'private: logger', color: '#94a3b8' }],
    }),
    mkNode('user-svc',   360,  270, {
      icon: '👤',
      title: 'UserService',
      sub: 'extends CrudService<User>',
      color: '#a78bfa',
      badge: 'override: create',
    }),
    mkNode('hash-step',  580,  250, { icon: '🔐', title: 'hashPassword()',        sub: 'runs before super.create()',   color: '#f472b6' }),
    mkNode('super-call', 580,  310, { icon: '⬆️', title: 'super.create(dto)',     sub: 'delegates to base class',     color: '#38bdf8', badge: 'super()' }),

    mkLabel('lbl', 20, 435, { label: 'Override create() → hash password → super.create() → DB', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Exception chain
    mkEdge('e-http-app',   'http-exc',  'app-exc',    { color: '#f97316', labelText: 'extends' }),
    mkEdge('e-app-notf',   'app-exc',   'not-found',  { color: '#ef4444', labelText: 'extends' }),
    mkEdge('e-app-forb',   'app-exc',   'forbidden',  { color: '#ef4444' }),
    mkEdge('e-app-conf',   'app-exc',   'conflict',   { color: '#ef4444' }),

    // CrudService → UserService
    mkEdge('e-crud-user',  'crud-svc',  'user-svc',   { color: '#a78bfa', labelText: 'extends' }),
    // UserService override flow
    mkEdge('e-user-hash',  'user-svc',  'hash-step',  { color: '#f472b6', labelText: 'override create()' }),
    mkEdge('e-hash-super', 'hash-step', 'super-call', { color: '#38bdf8', labelText: 'then' }),
    // super() back to base
    mkEdge('e-super-crud', 'super-call', 'crud-svc',  { color: '#38bdf8', dashed: true, labelText: 'super.create()' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
