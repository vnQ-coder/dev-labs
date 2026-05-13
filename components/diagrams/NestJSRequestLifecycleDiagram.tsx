'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NestJSRequestLifecycleDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Happy path group
    mkGroup('grp-pipeline', 0, 0, 920, 120, { label: 'Request Pipeline — sequential middleware chain', color: '#38bdf8' }),
    mkNode('req',         20,  38, { icon: '🌐', title: 'HTTP Request',       sub: 'Incoming HTTP',                     color: '#64748b' }),
    mkNode('middleware',  130, 38, { icon: '🔧', title: 'Middleware',          sub: 'req/res transform, logging',        color: '#94a3b8', badge: 'global/route' }),
    mkNode('guards',      260, 38, { icon: '🛡️', title: 'Guards',             sub: 'canActivate() → true/false',        color: '#f97316', badge: 'auth/rbac' }),
    mkNode('interceptors-before', 385, 38, { icon: '🔄', title: 'Interceptors (before)', sub: 'transform, logging, timing', color: '#38bdf8', badge: 'pre-handler' }),
    mkNode('pipes',       530, 38, { icon: '🔩', title: 'Pipes',              sub: 'transform + validate DTOs',         color: '#10b981', badge: 'validation' }),
    mkNode('handler',     650, 38, { icon: '⚡', title: 'Route Handler',       sub: '@Get() @Post() method',             color: '#a78bfa', badge: 'controller' }),
    mkNode('interceptors-after', 780, 38, { icon: '🔄', title: 'Interceptors (after)', sub: 'map response, cache', color: '#38bdf8', badge: 'post-handler' }),

    // Exception path group
    mkGroup('grp-exception', 0, 150, 920, 110, { label: 'Exception Path — thrown at any stage', color: '#dc2626' }),
    mkNode('exception',   20,  188, { icon: '💥', title: 'Exception Thrown',  sub: 'Any stage can throw',               color: '#dc2626', badge: 'HttpException / Error' }),
    mkNode('filters',     200, 188, { icon: '🚨', title: 'Exception Filters',  sub: '@Catch() catches specific errors',  color: '#dc2626', badge: 'global/controller' }),
    mkNode('err-resp',    440, 188, { icon: '❌', title: 'Error Response',     sub: 'Structured JSON error body',        color: '#64748b' }),
    mkNode('ok-resp',     780, 188, { icon: '✅', title: 'Response',           sub: '200 OK — serialized JSON',          color: '#10b981' }),

    mkLabel('lbl', 80, 280, { label: 'Middleware → Guards → Interceptors → Pipes → Handler → Interceptors → Filters', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Happy path
    mkEdge('e-req-mid',   'req',        'middleware',         { color: '#94a3b8' }),
    mkEdge('e-mid-grd',   'middleware', 'guards',             { color: '#f97316' }),
    mkEdge('e-grd-int',   'guards',     'interceptors-before',{ color: '#38bdf8' }),
    mkEdge('e-int-pipe',  'interceptors-before', 'pipes',     { color: '#10b981' }),
    mkEdge('e-pipe-hdl',  'pipes',      'handler',            { color: '#a78bfa' }),
    mkEdge('e-hdl-int2',  'handler',    'interceptors-after', { color: '#38bdf8' }),
    mkEdge('e-int2-resp', 'interceptors-after', 'ok-resp',    { color: '#10b981', labelText: 'success' }),

    // Exception paths
    mkEdge('e-grd-exc',   'guards',     'exception',          { color: '#dc2626', dashed: true, labelText: 'throws' }),
    mkEdge('e-pipe-exc',  'pipes',      'exception',          { color: '#dc2626', dashed: true }),
    mkEdge('e-hdl-exc',   'handler',    'exception',          { color: '#dc2626', dashed: true }),
    mkEdge('e-exc-flt',   'exception',  'filters',            { color: '#dc2626', labelText: 'caught by' }),
    mkEdge('e-flt-err',   'filters',    'err-resp',           { color: '#dc2626', labelText: 'format error' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
