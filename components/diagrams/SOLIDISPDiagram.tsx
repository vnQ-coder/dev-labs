'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SOLIDISPDiagram() {
  const nodes: Node[] = useMemo(() => [
    // BEFORE group — fat interface
    mkGroup('grp-before', 0, 0, 820, 180, { label: 'BEFORE — Fat IUserService forces clients to depend on methods they never use', color: '#dc2626' }),
    mkNode('fat-iface',    20,  60, {
      icon: '🐘',
      title: 'IUserService',
      sub: 'findAll · findById · create · update · delete · block · unblock · resetPassword · exportToCsv · auditLog',
      color: '#dc2626',
      badge: '10 methods',
    }),
    mkNode('admin-bad',   380,  30, { icon: '👮', title: 'AdminController',  sub: 'uses 3 of 10 methods',  color: '#dc2626' }),
    mkNode('public-bad',  380,  90, { icon: '👤', title: 'PublicController', sub: 'uses 2 of 10 methods',  color: '#dc2626' }),
    mkNode('drag-note',   570,  60, { icon: '⚠️', title: 'Forced dependency', sub: 'all 10 methods compiled & injected regardless', color: '#dc2626', badge: 'polluted' }),

    // AFTER group — segregated interfaces
    mkGroup('grp-after', 0, 215, 860, 220, { label: 'AFTER — Each client depends only on the interface it actually uses', color: '#10b981' }),
    mkNode('ireader',    20, 265, { icon: '📖', title: 'IUserReader',   sub: 'findAll · findById',             color: '#38bdf8', badge: '2 methods' }),
    mkNode('iwriter',    20, 330, { icon: '✏️', title: 'IUserWriter',   sub: 'create · update · delete',       color: '#10b981', badge: '3 methods' }),
    mkNode('iadmin',    240, 265, { icon: '👮', title: 'IUserAdmin',    sub: 'block · unblock · resetPassword', color: '#f97316', badge: '3 methods' }),
    mkNode('iexporter', 240, 330, { icon: '📤', title: 'IUserExporter', sub: 'exportToCsv',                    color: '#a78bfa', badge: '1 method' }),
    mkNode('pub-ctrl',  480, 255, { icon: '👤', title: 'PublicController', sub: '→ IUserReader',               color: '#38bdf8' }),
    mkNode('usr-ctrl',  480, 305, { icon: '🧑‍💻', title: 'UserController',   sub: '→ IUserWriter',             color: '#10b981' }),
    mkNode('adm-ctrl',  480, 355, { icon: '👮', title: 'AdminController',  sub: '→ IUserAdmin',                color: '#f97316' }),
    mkNode('rpt-ctrl',  480, 405, { icon: '📊', title: 'ReportController', sub: '→ IUserExporter',             color: '#a78bfa' }),

    // Bottom label
    mkLabel('lbl', 60, 460, { label: "No client should be forced to depend on methods it doesn't use", icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // BEFORE
    mkEdge('e-fat-admin',  'admin-bad',  'fat-iface', { color: '#dc2626', labelText: 'depends on (all 10)' }),
    mkEdge('e-fat-public', 'public-bad', 'fat-iface', { color: '#dc2626', labelText: 'depends on (all 10)' }),
    mkEdge('e-fat-drag',   'fat-iface',  'drag-note', { color: '#dc2626', dashed: true }),

    // AFTER — controllers → segregated interfaces
    mkEdge('e-pub-read', 'pub-ctrl', 'ireader',   { color: '#38bdf8', labelText: 'uses' }),
    mkEdge('e-usr-write','usr-ctrl', 'iwriter',   { color: '#10b981', labelText: 'uses' }),
    mkEdge('e-adm-admin','adm-ctrl', 'iadmin',    { color: '#f97316', labelText: 'uses' }),
    mkEdge('e-rpt-exp',  'rpt-ctrl', 'iexporter', { color: '#a78bfa', labelText: 'uses' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
