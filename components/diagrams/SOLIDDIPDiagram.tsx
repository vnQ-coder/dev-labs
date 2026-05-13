'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SOLIDDIPDiagram() {
  const nodes: Node[] = useMemo(() => [
    // BAD group — tight coupling
    mkGroup('grp-bad', 0, 0, 680, 130, { label: 'BAD — OrderService directly instantiates SendGridEmailService (tight coupling)', color: '#dc2626' }),
    mkNode('order-bad',   20,  50, { icon: '📦', title: 'OrderService',         sub: 'new SendGridEmailService()',           color: '#dc2626', badge: 'tight coupling' }),
    mkNode('sendgrid-bad',280,  50, { icon: '📧', title: 'SendGridEmailService', sub: 'concrete class — hard dependency',    color: '#dc2626' }),
    mkNode('test-bad',    520,  50, { icon: '🧪', title: 'Unit test',            sub: 'cannot swap — real emails sent!',     color: '#dc2626', badge: 'untestable' }),

    // GOOD group — abstraction + DI
    mkGroup('grp-good', 0, 165, 860, 230, { label: 'GOOD — OrderService depends on IEmailService abstraction; DI container wires the concrete class', color: '#10b981' }),
    mkNode('order-good',  20, 235, { icon: '📦', title: 'OrderService',         sub: 'constructor(emailSvc: IEmailService)', color: '#10b981', badge: 'decoupled' }),
    mkNode('iemail',     270, 235, { icon: '📐', title: 'IEmailService',        sub: '«interface» sendEmail(to, subject, body)', color: '#38bdf8', badge: 'abstraction' }),
    mkNode('sendgrid-ok',510, 205, { icon: '📧', title: 'SendGridEmailService', sub: 'implements IEmailService',            color: '#10b981' }),
    mkNode('mock-email', 510, 270, { icon: '🧪', title: 'MockEmailService',     sub: 'implements IEmailService — injected in tests', color: '#a78bfa', badge: 'testable' }),
    mkNode('di-container',270, 320, {
      icon: '🏗️',
      title: 'NestJS DI Container',
      sub: '{ provide: EMAIL_SERVICE, useClass: SendGridEmailService }',
      color: '#f97316',
      badge: 'wires at runtime',
    }),

    // Bottom label
    mkLabel('lbl', 60, 420, { label: 'High-level modules depend on abstractions, not concretions', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // BAD — direct instantiation
    mkEdge('e-bad-sg',   'order-bad',   'sendgrid-bad', { color: '#dc2626', labelText: 'new (hard dependency)' }),
    mkEdge('e-bad-test', 'sendgrid-bad','test-bad',     { color: '#dc2626', dashed: true, labelText: 'cannot mock' }),

    // GOOD — depends on abstraction
    mkEdge('e-good-iface',  'order-good',   'iemail',      { color: '#38bdf8', labelText: 'depends on abstraction' }),
    mkEdge('e-sg-iface',    'sendgrid-ok',  'iemail',      { color: '#10b981', labelText: 'implements' }),
    mkEdge('e-mock-iface',  'mock-email',   'iemail',      { color: '#a78bfa', labelText: 'implements', dashed: true }),
    mkEdge('e-di-sg',       'di-container', 'sendgrid-ok', { color: '#f97316', labelText: 'useClass' }),
    mkEdge('e-di-order',    'di-container', 'order-good',  { color: '#f97316', dashed: true, labelText: 'injects' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
