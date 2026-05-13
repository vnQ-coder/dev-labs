'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NestJSDecoratorsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Metadata group
    mkGroup('grp-meta', 0, 0, 600, 120, { label: 'Reflect.metadata — @Roles stores metadata on handler', color: '#f97316' }),
    mkNode('roles-dec',   20,  38, { icon: '🏷️', title: "@Roles('admin')",    sub: "SetMetadata('roles', ['admin'])",    color: '#f97316', badge: 'class decorator' }),
    mkNode('metadata',   200,  38, { icon: '🗂️', title: 'Reflect.metadata',   sub: "key='roles', value=['admin']",       color: '#f97316', badge: 'stored on handler' }),
    mkNode('roles-guard',380,  38, { icon: '🛡️', title: 'RolesGuard',         sub: "Reflector.get('roles', handler)",    color: '#f97316', badge: 'reads metadata' }),
    mkNode('user-roles', 560,  38, { icon: '👤', title: 'User Roles Check',   sub: 'request.user.roles includes admin?', color: '#10b981', badge: 'canActivate' }),

    // Param decorator group
    mkGroup('grp-param', 0, 145, 500, 120, { label: '@CurrentUser() — custom param decorator', color: '#38bdf8' }),
    mkNode('cur-user-dec', 20, 183, { icon: '🎯', title: '@CurrentUser()',     sub: 'createParamDecorator((data, ctx) => ctx.switchToHttp().getRequest().user)', color: '#38bdf8', badge: 'param decorator' }),
    mkNode('req-obj',      240, 183, { icon: '🌐', title: 'Request Object',    sub: 'ExecutionContext → HTTP request',    color: '#64748b', badge: 'extracted' }),
    mkNode('user-param',   430, 183, { icon: '👤', title: 'user: User',        sub: 'injected as method param',          color: '#38bdf8', badge: 'handler arg' }),

    // ApplyDecorators group
    mkGroup('grp-compose', 0, 290, 700, 120, { label: 'applyDecorators() — combine multiple decorators into one', color: '#a78bfa' }),
    mkNode('apply-dec',    20, 328, { icon: '🔗', title: 'applyDecorators()',  sub: '@UseGuards + @ApiBearerAuth + @ApiUnauthorizedResponse', color: '#a78bfa', badge: 'custom decorator' }),
    mkNode('use-guards',  250, 310, { icon: '🛡️', title: '@UseGuards',        sub: 'JwtAuthGuard attached',              color: '#f97316', badge: 'composed' }),
    mkNode('api-bearer',  250, 355, { icon: '🔑', title: '@ApiBearerAuth',    sub: 'Swagger bearer auth UI',             color: '#38bdf8', badge: 'composed' }),
    mkNode('api-401',     460, 328, { icon: '📄', title: '@ApiUnauthorizedResponse', sub: 'OpenAPI 401 doc',             color: '#dc2626', badge: 'composed' }),

    mkLabel('lbl', 80, 430, { label: 'Decorators = metadata + factory functions. Reflector reads at runtime.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Metadata flow
    mkEdge('e-roles-meta',  'roles-dec',     'metadata',     { color: '#f97316', labelText: 'stores' }),
    mkEdge('e-meta-guard',  'metadata',      'roles-guard',  { color: '#f97316', labelText: 'read by' }),
    mkEdge('e-guard-check', 'roles-guard',   'user-roles',   { color: '#10b981', labelText: 'compare' }),

    // Param decorator flow
    mkEdge('e-dec-req',     'cur-user-dec',  'req-obj',      { color: '#38bdf8', labelText: 'extracts from' }),
    mkEdge('e-req-param',   'req-obj',       'user-param',   { color: '#38bdf8', labelText: 'injects as' }),

    // Compose flow
    mkEdge('e-apply-grd',   'apply-dec',     'use-guards',   { color: '#f97316' }),
    mkEdge('e-apply-bearer','apply-dec',     'api-bearer',   { color: '#38bdf8' }),
    mkEdge('e-grd-401',     'use-guards',    'api-401',      { color: '#dc2626', dashed: true }),
    mkEdge('e-bearer-401',  'api-bearer',    'api-401',      { color: '#dc2626', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
