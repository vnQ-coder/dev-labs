'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SOLIDSRPDiagram() {
  const nodes: Node[] = useMemo(() => [
    // BEFORE group — bloated class
    mkGroup('grp-before', 0, 0, 680, 160, { label: 'BEFORE — Bloated UserService (one class, many reasons to change)', color: '#dc2626' }),
    mkNode('user-service', 20, 50, { icon: '💣', title: 'UserService', sub: 'Does everything', color: '#dc2626', badge: 'God class' }),
    mkNode('crud',        230, 40, { icon: '🗄️', title: 'User CRUD',       sub: 'create / read / update / delete', color: '#dc2626' }),
    mkNode('pw-hash',     230, 90, { icon: '🔐', title: 'Password Hashing', sub: 'bcrypt / argon2',                color: '#dc2626' }),
    mkNode('email-old',   430, 40, { icon: '📧', title: 'Email Sending',    sub: 'SMTP / SendGrid calls',          color: '#dc2626' }),
    mkNode('jwt-old',     430, 90, { icon: '🪙', title: 'JWT Generation',   sub: 'sign / verify tokens',           color: '#dc2626' }),
    mkNode('audit-old',   580, 65, { icon: '📝', title: 'Audit Logging',    sub: 'write activity logs',            color: '#dc2626' }),

    // AFTER group — split services
    mkGroup('grp-after', 0, 200, 820, 160, { label: 'AFTER — Each service has exactly one reason to change', color: '#10b981' }),
    mkNode('ctrl',         20, 255, { icon: '🎮', title: 'UserController', sub: 'HTTP layer only',           color: '#64748b' }),
    mkNode('user-repo',   200, 225, { icon: '🗄️', title: 'UserRepository',  sub: 'DB access — DBA stakeholder', color: '#10b981', badge: '1 reason' }),
    mkNode('pw-svc',      370, 225, { icon: '🔐', title: 'PasswordService',  sub: 'hashing — security team',    color: '#10b981', badge: '1 reason' }),
    mkNode('email-svc',   540, 225, { icon: '📧', title: 'EmailService',     sub: 'notifications — mktg team',  color: '#10b981', badge: '1 reason' }),
    mkNode('auth-svc',    200, 305, { icon: '🪙', title: 'AuthService',      sub: 'tokens — auth team',         color: '#10b981', badge: '1 reason' }),
    mkNode('audit-svc',   540, 305, { icon: '📝', title: 'AuditService',     sub: 'logging — compliance team',  color: '#10b981', badge: '1 reason' }),

    // Bottom label
    mkLabel('lbl', 60, 390, { label: 'One reason to change = one stakeholder / actor', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // BEFORE — everything inside UserService (internal)
    mkEdge('e-us-crud',  'user-service', 'crud',     { color: '#dc2626', dashed: true }),
    mkEdge('e-us-pw',    'user-service', 'pw-hash',  { color: '#dc2626', dashed: true }),
    mkEdge('e-us-email', 'user-service', 'email-old',{ color: '#dc2626', dashed: true }),
    mkEdge('e-us-jwt',   'user-service', 'jwt-old',  { color: '#dc2626', dashed: true }),
    mkEdge('e-us-audit', 'user-service', 'audit-old',{ color: '#dc2626', dashed: true }),

    // AFTER — controller delegates to focused services
    mkEdge('e-ctrl-repo',  'ctrl', 'user-repo',  { color: '#10b981', labelText: 'delegate' }),
    mkEdge('e-ctrl-pw',    'ctrl', 'pw-svc',     { color: '#10b981' }),
    mkEdge('e-ctrl-email', 'ctrl', 'email-svc',  { color: '#10b981' }),
    mkEdge('e-ctrl-auth',  'ctrl', 'auth-svc',   { color: '#10b981' }),
    mkEdge('e-ctrl-audit', 'ctrl', 'audit-svc',  { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
