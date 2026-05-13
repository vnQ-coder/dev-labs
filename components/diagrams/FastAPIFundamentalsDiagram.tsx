'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function FastAPIFundamentalsDiagram() {
  const nodes: Node[] = useMemo(() => [
    // ASGI stack group
    mkGroup('grp-stack', 0, 0, 780, 110, { label: 'ASGI Stack — layered framework architecture', color: '#10b981' }),
    mkNode('uvicorn',    20,  38, { icon: '⚡', title: 'Uvicorn',         sub: 'ASGI server — handles TCP, HTTP/1.1, HTTP/2', color: '#10b981', badge: 'ASGI server' }),
    mkNode('starlette', 180,  38, { icon: '🌟', title: 'Starlette',       sub: 'Routing, middleware, WebSocket, static files',  color: '#10b981', badge: 'web framework' }),
    mkNode('fastapi',   360,  38, { icon: '🚀', title: 'FastAPI',         sub: '@app.get() decorators + Pydantic validation',   color: '#10b981', badge: 'API layer' }),
    mkNode('handler',   560,  38, { icon: '🎯', title: 'Route Handler',   sub: 'async def endpoint(params) → response',         color: '#a78bfa', badge: 'your code' }),

    // Request flow group
    mkGroup('grp-req', 0, 145, 900, 110, { label: 'Request Flow — parse → validate → handle → serialize', color: '#38bdf8' }),
    mkNode('http-req',   20, 183, { icon: '🌐', title: 'HTTP Request',    sub: 'path params, query params, body',              color: '#64748b' }),
    mkNode('extract',   180, 183, { icon: '🔍', title: 'Param Extraction',sub: 'path/query/header parsed by Starlette',         color: '#38bdf8', badge: 'type coercion' }),
    mkNode('pydantic-in',340, 183, { icon: '✅', title: 'Pydantic Validation', sub: 'RequestBody model_validate(json)',         color: '#10b981', badge: '422 on fail' }),
    mkNode('route-fn',  530, 183, { icon: '⚡', title: 'Handler Runs',   sub: 'business logic executed',                       color: '#a78bfa', badge: 'awaited' }),
    mkNode('pydantic-out',700,183, { icon: '📤', title: 'Pydantic Serialization', sub: 'response_model.model_dump() → JSON', color: '#10b981', badge: 'response' }),

    // Auto-docs group
    mkGroup('grp-docs', 0, 285, 560, 110, { label: 'Auto Documentation — generated from type hints', color: '#f97316' }),
    mkNode('openapi',    20, 323, { icon: '📋', title: 'OpenAPI Schema',  sub: 'FastAPI generates /openapi.json automatically',  color: '#f97316', badge: 'JSON schema' }),
    mkNode('swagger',   220, 323, { icon: '🔧', title: '/docs (Swagger)', sub: 'Interactive API explorer UI',                   color: '#f97316', badge: 'Swagger UI' }),
    mkNode('redoc',     400, 323, { icon: '📖', title: '/redoc',          sub: 'Clean reference documentation',                 color: '#f97316', badge: 'ReDoc UI' }),

    mkLabel('lbl', 80, 415, { label: 'FastAPI = Starlette + Pydantic + automatic OpenAPI', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // ASGI stack
    mkEdge('e-uvi-star', 'uvicorn',     'starlette',     { color: '#10b981', labelText: 'built on' }),
    mkEdge('e-star-fast','starlette',   'fastapi',       { color: '#10b981', labelText: 'extended by' }),
    mkEdge('e-fast-hdl', 'fastapi',     'handler',       { color: '#a78bfa', labelText: 'dispatches to' }),

    // Request flow
    mkEdge('e-req-ext',  'http-req',    'extract',       { color: '#38bdf8', labelText: 'parsed' }),
    mkEdge('e-ext-pyd',  'extract',     'pydantic-in',   { color: '#10b981', labelText: 'validated' }),
    mkEdge('e-pyd-fn',   'pydantic-in', 'route-fn',      { color: '#a78bfa', labelText: 'injected' }),
    mkEdge('e-fn-out',   'route-fn',    'pydantic-out',  { color: '#10b981', labelText: 'serialized' }),

    // Docs generation
    mkEdge('e-fast-oas', 'fastapi',     'openapi',       { color: '#f97316', dashed: true, labelText: 'generates' }),
    mkEdge('e-oas-sw',   'openapi',     'swagger',       { color: '#f97316', labelText: 'renders' }),
    mkEdge('e-oas-rd',   'openapi',     'redoc',         { color: '#f97316', labelText: 'renders' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
