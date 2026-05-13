'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function FastAPIAuthDiagram() {
  const nodes: Node[] = useMemo(() => [
    // OAuth2 password flow — token creation
    mkGroup('grp-token', 0, 0, 900, 120, { label: 'OAuth2 Password Flow — POST /token', color: '#f97316' }),
    mkNode('client-login',  20,  40, { icon: '💻', title: 'Client',          sub: 'POST /token username+password',   color: '#64748b' }),
    mkNode('verify-user',  200,  40, { icon: '🔍', title: 'Verify user in DB', sub: 'lookup by username',            color: '#38bdf8' }),
    mkNode('hash-compare', 380,  40, { icon: '🔐', title: 'bcrypt hash compare', sub: 'pwd_context.verify(plain, hash)', color: '#f97316', badge: 'never store raw' }),
    mkNode('create-jwt',   570,  40, { icon: '🪙', title: 'Create JWT',       sub: 'header.payload.signature',       color: '#a78bfa', badge: 'HS256' }),
    mkNode('return-token', 760,  40, { icon: '✅', title: 'Return access_token', sub: '{ access_token, token_type }', color: '#10b981' }),

    // Protected route flow
    mkGroup('grp-protected', 0, 150, 900, 120, { label: 'Protected Route — Bearer token validation', color: '#38bdf8' }),
    mkNode('req-auth',      20, 190, { icon: '📨', title: 'Request',           sub: 'Authorization: Bearer <token>',  color: '#64748b' }),
    mkNode('oauth2bearer', 200, 190, { icon: '🔑', title: 'OAuth2PasswordBearer', sub: 'extracts token from header',  color: '#f97316' }),
    mkNode('get-user',     420, 190, { icon: '👤', title: 'get_current_user()', sub: 'decodes JWT, validates claims', color: '#38bdf8' }),
    mkNode('check-expiry', 620, 190, { icon: '⏰', title: 'Validate expiry',    sub: 'exp claim + signature check',   color: '#dc2626', badge: '401 if invalid' }),
    mkNode('inject-user',  800, 190, { icon: '🎯', title: 'User injected',      sub: 'route receives user: User',     color: '#10b981' }),

    // Refresh token pattern
    mkGroup('grp-refresh', 0, 300, 820, 130, { label: 'Refresh Token Pattern — short + long lived', color: '#a78bfa' }),
    mkNode('access-tok',   20,  340, { icon: '⚡', title: 'Access Token',   sub: '15 min expiry — short-lived',      color: '#f97316', badge: '15min' }),
    mkNode('refresh-tok', 240,  340, { icon: '🔄', title: 'Refresh Token',  sub: '7 day expiry — stored securely',   color: '#a78bfa', badge: '7 days' }),
    mkNode('refresh-ep',  460,  340, { icon: '🔁', title: 'POST /refresh',  sub: 'validates refresh token',          color: '#38bdf8' }),
    mkNode('new-access',  680,  340, { icon: '🆕', title: 'New Access Token', sub: 'fresh 15-min token returned',    color: '#10b981' }),

    // Bottom label
    mkLabel('lbl', 80, 450, { label: 'Never store raw passwords — always bcrypt hash', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Token creation flow
    mkEdge('e-cli-verify',  'client-login',  'verify-user',   { color: '#38bdf8', labelText: 'lookup' }),
    mkEdge('e-verify-hash', 'verify-user',   'hash-compare',  { color: '#f97316', labelText: 'compare hash' }),
    mkEdge('e-hash-jwt',    'hash-compare',  'create-jwt',    { color: '#a78bfa', labelText: 'sign' }),
    mkEdge('e-jwt-return',  'create-jwt',    'return-token',  { color: '#10b981', labelText: 'respond' }),

    // Protected route flow
    mkEdge('e-req-bearer',  'req-auth',      'oauth2bearer',  { color: '#f97316', labelText: 'extract' }),
    mkEdge('e-bearer-user', 'oauth2bearer',  'get-user',      { color: '#38bdf8', labelText: 'decode' }),
    mkEdge('e-user-expiry', 'get-user',      'check-expiry',  { color: '#dc2626', labelText: 'validate' }),
    mkEdge('e-expiry-inj',  'check-expiry',  'inject-user',   { color: '#10b981', labelText: 'inject' }),

    // Refresh token flow
    mkEdge('e-access-ref',  'access-tok',   'refresh-ep',    { color: '#a78bfa', dashed: true, labelText: 'expires → call' }),
    mkEdge('e-ref-ep',      'refresh-tok',  'refresh-ep',    { color: '#a78bfa', labelText: 'send refresh' }),
    mkEdge('e-ep-new',      'refresh-ep',   'new-access',    { color: '#10b981', labelText: 'issue new token' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
