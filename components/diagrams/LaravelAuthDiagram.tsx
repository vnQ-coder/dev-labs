'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function LaravelAuthDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Group 1: Sanctum SPA auth
    mkGroup('grp-sanctum', 0, 0, 940, 130, { label: 'Sanctum — SPA session auth OR API token auth', color: '#f97316' }),
    mkNode('login-req',    20,  40, { icon: '💻', title: 'Login request',       sub: 'POST /login credentials',        color: '#64748b' }),
    mkNode('session-cook', 220, 40, { icon: '🍪', title: 'Session cookie',       sub: 'stateful SPA auth',             color: '#38bdf8', badge: 'web guard' }),
    mkNode('create-token', 220, 85, { icon: '🔑', title: 'createToken()',         sub: 'plaintext token returned once', color: '#f97316', badge: 'api guard' }),
    mkNode('bearer-mid',   500, 40, { icon: '🛡️', title: 'Authorization: Bearer', sub: 'client sends token in header',  color: '#a78bfa' }),
    mkNode('pat-table',    730, 40, { icon: '🗄️', title: 'personal_access_tokens', sub: 'middleware validates hash',    color: '#dc2626', badge: 'hashed' }),
    mkNode('authed',       900, 40, { icon: '✅', title: 'Authenticated',         sub: 'user resolved, request proceeds', color: '#10b981' }),

    // Group 2: Gate vs Policy
    mkGroup('grp-auth-z', 0, 155, 900, 140, { label: 'Gate vs Policy — authorisation', color: '#38bdf8' }),
    mkNode('gate',         20, 195, { icon: '🚪', title: 'Gate::define()',        sub: 'Gate::define(\'admin\', fn(user) => ...)', color: '#38bdf8', badge: 'simple checks' }),
    mkNode('policy',      290, 195, { icon: '📜', title: 'PostPolicy->update()',  sub: 'model-specific authorisation logic',        color: '#a78bfa', badge: 'model auth' }),
    mkNode('can-blade',   570, 195, { icon: '🎨', title: '@can(\'update\', $post)', sub: 'Blade directive delegates to policy',     color: '#f59e0b' }),
    mkNode('gate-allows', 20,  265, { icon: '✔️', title: 'Gate::allows()',         sub: 'programmatic gate check',                 color: '#64748b' }),
    mkNode('authorize',   290, 265, { icon: '🔒', title: '$this->authorize()',     sub: 'controller helper — throws 403',           color: '#dc2626', badge: '403 on fail' }),

    // Group 3: Multi-guard
    mkGroup('grp-guards', 0, 325, 840, 120, { label: 'Multi-guard — web / api / admin', color: '#a78bfa' }),
    mkNode('web-guard',    20, 365, { icon: '🌐', title: '\'web\' guard',    sub: 'session driver — browser SPA',       color: '#38bdf8', badge: 'session' }),
    mkNode('api-guard',   260, 365, { icon: '🔌', title: '\'api\' guard',    sub: 'token driver — REST API clients',    color: '#f97316', badge: 'token' }),
    mkNode('admin-guard', 500, 365, { icon: '👑', title: '\'admin\' guard',  sub: 'separate users table / driver',      color: '#dc2626', badge: 'separate table' }),
    mkNode('guard-call',  700, 365, { icon: '📞', title: 'Auth::guard(\'api\')->user()', sub: 'explicit guard resolution', color: '#64748b' }),

    // Bottom label
    mkLabel('lbl', 80, 460, { label: 'Sanctum is lighter than Passport — use Sanctum for SPAs and simple APIs', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Sanctum flow
    mkEdge('e-login-sess',   'login-req',    'session-cook', { color: '#38bdf8', labelText: 'SPA' }),
    mkEdge('e-login-token',  'login-req',    'create-token', { color: '#f97316', labelText: 'API' }),
    mkEdge('e-sess-bearer',  'session-cook', 'bearer-mid',   { color: '#a78bfa', dashed: true }),
    mkEdge('e-token-bearer', 'create-token', 'bearer-mid',   { color: '#a78bfa', dashed: true }),
    mkEdge('e-bearer-pat',   'bearer-mid',   'pat-table',    { color: '#dc2626', labelText: 'validate' }),
    mkEdge('e-pat-authed',   'pat-table',    'authed',       { color: '#10b981', labelText: 'pass' }),

    // Gate vs Policy
    mkEdge('e-gate-can',     'gate',         'can-blade',    { color: '#f59e0b', dashed: true, labelText: 'simple' }),
    mkEdge('e-policy-can',   'policy',       'can-blade',    { color: '#f59e0b', labelText: 'delegates' }),
    mkEdge('e-gate-allows',  'gate',         'gate-allows',  { color: '#64748b', dashed: true }),
    mkEdge('e-pol-auth',     'policy',       'authorize',    { color: '#dc2626', dashed: true }),

    // Guards (no edges needed — illustrative side by side)
    mkEdge('e-api-call',     'api-guard',    'guard-call',   { color: '#64748b', labelText: 'Auth::guard()' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
