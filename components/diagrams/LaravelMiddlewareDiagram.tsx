'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function LaravelMiddlewareDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Full Laravel 11 request lifecycle
    mkGroup('grp-lifecycle', 0, 0, 1020, 120, { label: 'Laravel 11 Request Lifecycle — sequential middleware pipeline', color: '#f97316' }),
    mkNode('http-req',       20,  40, { icon: '🌐', title: 'HTTP Request',         sub: 'arrives at server',               color: '#64748b' }),
    mkNode('index-php',     160,  40, { icon: '📄', title: 'public/index.php',      sub: 'entry point',                    color: '#64748b' }),
    mkNode('bootstrap',     310,  40, { icon: '⚙️', title: 'bootstrap/app.php',     sub: 'binds kernel + container',       color: '#38bdf8' }),
    mkNode('http-kernel',   480,  40, { icon: '🏗️', title: 'HTTP Kernel',           sub: 'orchestrates pipeline',          color: '#a78bfa', badge: 'pipeline' }),
    mkNode('global-mw',     650,  40, { icon: '🛡️', title: 'Global Middleware',      sub: 'TrustProxies, CORS, etc.',      color: '#f97316' }),
    mkNode('router',        820,  40, { icon: '🗺️', title: 'Router',                sub: 'find matching route',            color: '#38bdf8' }),
    mkNode('route-mw',      820,  85, { icon: '🔒', title: 'Route Middleware',       sub: 'auth, throttle, etc.',          color: '#dc2626' }),
    mkNode('controller',    980,  40, { icon: '🎯', title: 'Controller action',      sub: 'business logic runs',           color: '#10b981', badge: 'handler' }),

    // Response path
    mkGroup('grp-response', 0, 150, 820, 100, { label: 'Response path — middleware after() hooks', color: '#10b981' }),
    mkNode('response',        20, 188, { icon: '📤', title: 'Response object',       sub: 'created by controller',         color: '#10b981' }),
    mkNode('mw-after',       260, 188, { icon: '🔄', title: 'Middleware after()',     sub: 'runs on way back out',          color: '#38bdf8', badge: 'reverse order' }),
    mkNode('send-response',  540, 188, { icon: '✅', title: 'Send Response',          sub: 'bytes sent to client',          color: '#10b981', badge: 'sent' }),

    // $next pattern
    mkGroup('grp-next', 0, 280, 680, 130, { label: '$next pattern — how each middleware works', color: '#a78bfa' }),
    mkNode('before-code',    20, 320, { icon: '⬆️', title: 'Before code',           sub: 'runs before passing to handler',  color: '#64748b', badge: 'e.g. auth check' }),
    mkNode('next-call',     250, 320, { icon: '➡️', title: '$next($request)',        sub: 'passes to next layer in pipeline', color: '#a78bfa', badge: 'must call!' }),
    mkNode('after-code',    480, 320, { icon: '⬇️', title: 'After code',            sub: 'runs after handler returns',      color: '#64748b', badge: 'e.g. add header' }),

    // Terminable middleware
    mkGroup('grp-terminable', 0, 440, 760, 110, { label: 'Terminable Middleware — terminate() after response sent', color: '#f59e0b' }),
    mkNode('term-mw',        20, 478, { icon: '🔚', title: 'terminate(req, res)',    sub: 'called after response dispatched',  color: '#f59e0b', badge: 'terminate()' }),
    mkNode('logging',       280, 478, { icon: '📝', title: 'Logging / cleanup',      sub: 'doesn\'t delay response to client', color: '#64748b' }),
    mkNode('no-delay',      540, 478, { icon: '⚡', title: 'Zero response delay',    sub: 'client receives response first',    color: '#10b981', badge: 'fast UX' }),

    // Middleware groups
    mkGroup('grp-mw-groups', 0, 580, 900, 130, { label: 'Middleware Groups — web vs api', color: '#38bdf8' }),
    mkNode('web-group',      20, 620, { icon: '🌐', title: '\'web\' group',
      sub: 'StartSession, ShareErrors, VerifyCsrfToken, SubstituteBindings',          color: '#38bdf8', badge: 'CSRF + session' }),
    mkNode('api-group',     480, 620, { icon: '🔌', title: '\'api\' group',
      sub: 'ThrottleRequests, SubstituteBindings',                                    color: '#f97316', badge: 'rate limit' }),

    // Bottom label
    mkLabel('lbl', 80, 725, { label: 'Middleware pipeline is LIFO on the way back — last added runs first on return', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Lifecycle forward
    mkEdge('e-req-idx',     'http-req',    'index-php',    { color: '#64748b', labelText: 'hits' }),
    mkEdge('e-idx-boot',    'index-php',   'bootstrap',    { color: '#38bdf8', labelText: 'loads' }),
    mkEdge('e-boot-kern',   'bootstrap',   'http-kernel',  { color: '#a78bfa', labelText: 'bind' }),
    mkEdge('e-kern-global', 'http-kernel', 'global-mw',    { color: '#f97316', labelText: 'pipe through' }),
    mkEdge('e-global-rout', 'global-mw',   'router',       { color: '#38bdf8', labelText: 'match' }),
    mkEdge('e-rout-rmw',    'router',      'route-mw',     { color: '#dc2626', labelText: 'apply' }),
    mkEdge('e-rmw-ctrl',    'route-mw',    'controller',   { color: '#10b981', labelText: 'dispatch' }),

    // Response path
    mkEdge('e-ctrl-resp',   'controller',  'response',     { color: '#10b981', labelText: 'return' }),
    mkEdge('e-resp-after',  'response',    'mw-after',     { color: '#38bdf8', labelText: 'after hooks' }),
    mkEdge('e-after-send',  'mw-after',    'send-response',{ color: '#10b981', labelText: 'send' }),

    // $next pattern
    mkEdge('e-before-next', 'before-code', 'next-call',    { color: '#a78bfa', labelText: 'call $next' }),
    mkEdge('e-next-after',  'next-call',   'after-code',   { color: '#64748b', dashed: true, labelText: 'on return' }),

    // Terminable
    mkEdge('e-term-log',    'term-mw',     'logging',      { color: '#64748b', labelText: 'do cleanup' }),
    mkEdge('e-log-nodelay', 'logging',     'no-delay',     { color: '#10b981', labelText: 'independent' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
