'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function OOPPolymorphismDiagram() {
  const nodes: Node[] = useMemo(() => [
    // CanActivate interface group
    mkGroup('grp-guard', 0, 0, 700, 150, { label: 'CanActivate — guard polymorphism', color: '#f97316' }),
    mkNode('can-activate',  20,  55, { icon: '🛡️', title: 'CanActivate',       sub: 'canActivate() interface',  color: '#f97316', badge: 'interface' }),
    mkNode('jwt-guard',    260,  25, { icon: '🎟️', title: 'JwtGuard',           sub: 'implements canActivate()', color: '#10b981', badge: 'concrete' }),
    mkNode('roles-guard',  260,  80, { icon: '👑', title: 'RolesGuard',         sub: 'implements canActivate()', color: '#10b981', badge: 'concrete' }),
    mkNode('throttle-guard',260, 120, { icon: '⏱️', title: 'ThrottleGuard',    sub: 'implements canActivate()', color: '#10b981', badge: 'concrete' }),

    // PipeTransform interface group
    mkGroup('grp-pipe', 0, 175, 700, 130, { label: 'PipeTransform — pipe polymorphism', color: '#38bdf8' }),
    mkNode('pipe-transform', 20,  235, { icon: '🔧', title: 'PipeTransform',    sub: 'transform() interface',   color: '#38bdf8', badge: 'interface' }),
    mkNode('val-pipe',      260,  210, { icon: '✅', title: 'ValidationPipe',   sub: 'implements transform()',  color: '#a78bfa', badge: 'concrete' }),
    mkNode('int-pipe',      260,  255, { icon: '🔢', title: 'ParseIntPipe',     sub: 'implements transform()',  color: '#a78bfa', badge: 'concrete' }),
    mkNode('xfm-pipe',      260,  300, { icon: '🔄', title: 'TransformPipe',    sub: 'implements transform()',  color: '#a78bfa', badge: 'concrete' }),

    // NotificationProvider group
    mkGroup('grp-notify', 0, 335, 700, 160, { label: 'NotificationProvider — fan-out polymorphism', color: '#f472b6' }),
    mkNode('notify-iface',  20,  400, { icon: '📣', title: 'NotificationProvider', sub: 'send() interface',    color: '#f472b6', badge: 'interface' }),
    mkNode('notify-svc',   260,  390, { icon: '📡', title: 'NotificationService',  sub: 'loops → send() each', color: '#64748b', badge: 'orchestrator' }),
    mkNode('email-prov',   490,  360, { icon: '📧', title: 'EmailProvider',       sub: 'implements send()',    color: '#f472b6', badge: 'concrete' }),
    mkNode('sms-prov',     490,  415, { icon: '📱', title: 'SmsProvider',         sub: 'implements send()',    color: '#f472b6', badge: 'concrete' }),
    mkNode('push-prov',    490,  460, { icon: '🔔', title: 'PushProvider',        sub: 'implements send()',    color: '#f472b6', badge: 'concrete' }),

    mkLabel('lbl', 20, 515, { label: 'Framework calls same interface — behavior differs by implementation', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Guard implementations
    mkEdge('e-can-jwt',    'can-activate',  'jwt-guard',      { color: '#10b981', labelText: 'implements' }),
    mkEdge('e-can-roles',  'can-activate',  'roles-guard',    { color: '#10b981' }),
    mkEdge('e-can-thr',    'can-activate',  'throttle-guard', { color: '#10b981' }),

    // Pipe implementations
    mkEdge('e-pipe-val',   'pipe-transform', 'val-pipe',      { color: '#a78bfa', labelText: 'implements' }),
    mkEdge('e-pipe-int',   'pipe-transform', 'int-pipe',      { color: '#a78bfa' }),
    mkEdge('e-pipe-xfm',   'pipe-transform', 'xfm-pipe',      { color: '#a78bfa' }),

    // NotificationProvider — service calls interface, fan-out to concrete
    mkEdge('e-svc-iface',  'notify-svc',    'notify-iface',   { color: '#f472b6', labelText: 'calls send()' }),
    mkEdge('e-iface-email','notify-iface',  'email-prov',     { color: '#f472b6', dashed: true }),
    mkEdge('e-iface-sms',  'notify-iface',  'sms-prov',       { color: '#f472b6', dashed: true }),
    mkEdge('e-iface-push', 'notify-iface',  'push-prov',      { color: '#f472b6', dashed: true }),
    // fan-out from service directly too
    mkEdge('e-svc-email',  'notify-svc',    'email-prov',     { color: '#64748b', labelText: 'fan-out' }),
    mkEdge('e-svc-sms',    'notify-svc',    'sms-prov',       { color: '#64748b' }),
    mkEdge('e-svc-push',   'notify-svc',    'push-prov',      { color: '#64748b' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
