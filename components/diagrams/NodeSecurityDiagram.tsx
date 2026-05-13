'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NodeSecurityDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Request pipeline group
    mkGroup('grp-pipeline', 0, 0, 920, 150, { label: 'Incoming Request Security Pipeline', color: '#dc2626' }),
    mkNode('request',      20,  50, { icon: '🌐', title: 'Incoming Request',    sub: 'HTTP / HTTPS',                          color: '#64748b' }),
    mkNode('ratelimit',   175,  50, {
      icon: '🚦',
      title: 'Rate Limiter',
      sub: 'express-rate-limit / slowDown',
      color: '#dc2626',
      badge: 'stops DDoS',
    }),
    mkNode('helmet',      350,  50, {
      icon: '🪖',
      title: 'Helmet',
      sub: 'HTTP security headers',
      color: '#f97316',
      badge: 'XSS / CSP',
    }),
    mkNode('cors',        510,  50, {
      icon: '🌍',
      title: 'CORS',
      sub: 'origin allowlist',
      color: '#eab308',
      badge: 'cross-origin',
    }),
    mkNode('validation',  660,  50, {
      icon: '🔍',
      title: 'Input Validation',
      sub: 'Joi / Zod schema check',
      color: '#10b981',
      badge: 'sanitize inputs',
    }),
    mkNode('auth',        820,  50, {
      icon: '🔑',
      title: 'Auth',
      sub: 'JWT / API key verify',
      color: '#3b82f6',
      badge: 'identity check',
    }),

    // Route + DB group
    mkGroup('grp-route', 0, 175, 920, 130, { label: 'Handler and Database Layer', color: '#3b82f6' }),
    mkNode('handler',      20, 225, {
      icon: '⚙️',
      title: 'Route Handler',
      sub: 'business logic',
      color: '#6366f1',
      badge: 'authorized only',
    }),
    mkNode('paramquery',  280, 225, {
      icon: '🛡️',
      title: 'Parameterized Query',
      sub: 'db.query("… WHERE id = ?", [id])',
      color: '#10b981',
      badge: 'no SQL injection',
      pills: [{ label: 'never interpolate user input', color: '#059669' }],
    }),
    mkNode('db',          600, 225, { icon: '🗄️', title: 'Database',             sub: 'PostgreSQL / MySQL / MongoDB',         color: '#64748b' }),

    // Threats group
    mkGroup('grp-threats', 0, 330, 920, 140, { label: 'Threat Map — What Each Layer Mitigates', color: '#dc2626' }),
    mkNode('tddos',        20, 375, { icon: '💣', title: 'DDoS',                  sub: '→ rate limiter blocks flood',            color: '#dc2626', badge: 'threat' }),
    mkNode('txss',        190, 375, { icon: '💉', title: 'XSS',                   sub: '→ Helmet CSP prevents scripts',          color: '#f97316', badge: 'threat' }),
    mkNode('tcsrf',       360, 375, { icon: '🎭', title: 'CSRF',                  sub: '→ SameSite cookies / CSRF token',        color: '#eab308', badge: 'threat' }),
    mkNode('tsqli',       540, 375, { icon: '🗡️', title: 'SQL Injection',         sub: '→ parameterized queries',                color: '#dc2626', badge: 'threat' }),
    mkNode('tssrf',       720, 375, { icon: '🔀', title: 'SSRF',                  sub: '→ URL allowlist validation',             color: '#a78bfa', badge: 'threat' }),

    // Label
    mkLabel('lbl', 60, 490, { label: 'Apply security in layers — no single control is sufficient; defence in depth', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Request pipeline
    mkEdge('e-req-rl',   'request',    'ratelimit',   { color: '#dc2626', labelText: 'enter' }),
    mkEdge('e-rl-hlm',   'ratelimit',  'helmet',      { color: '#f97316' }),
    mkEdge('e-hlm-cors', 'helmet',     'cors',        { color: '#eab308' }),
    mkEdge('e-cors-val', 'cors',       'validation',  { color: '#10b981' }),
    mkEdge('e-val-auth', 'validation', 'auth',        { color: '#3b82f6' }),
    mkEdge('e-auth-hdl', 'auth',       'handler',     { color: '#6366f1', labelText: 'authorized' }),
    mkEdge('e-hdl-pq',   'handler',    'paramquery',  { color: '#10b981' }),
    mkEdge('e-pq-db',    'paramquery', 'db',          { color: '#64748b' }),

    // Threat mitigations
    mkEdge('e-ddos-rl',  'tddos',      'ratelimit',   { color: '#dc2626', dashed: true, labelText: 'mitigated by' }),
    mkEdge('e-xss-hlm',  'txss',       'helmet',      { color: '#f97316', dashed: true, labelText: 'mitigated by' }),
    mkEdge('e-csrf-cors','tcsrf',      'cors',        { color: '#eab308', dashed: true, labelText: 'mitigated by' }),
    mkEdge('e-sqli-pq',  'tsqli',      'paramquery',  { color: '#dc2626', dashed: true, labelText: 'mitigated by' }),
    mkEdge('e-ssrf-val', 'tssrf',      'validation',  { color: '#a78bfa', dashed: true, labelText: 'mitigated by' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
