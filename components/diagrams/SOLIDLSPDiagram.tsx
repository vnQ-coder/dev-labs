'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SOLIDLSPDiagram() {
  const nodes: Node[] = useMemo(() => [
    // VIOLATION group
    mkGroup('grp-violation', 0, 0, 700, 160, { label: 'VIOLATION — ReadOnlyRepo extends UserRepo but breaks the save() contract', color: '#dc2626' }),
    mkNode('user-repo-bad',  20,  55, { icon: '🗄️', title: 'UserRepo',       sub: 'save() + findById()',         color: '#64748b' }),
    mkNode('ro-repo-bad',   240,  55, { icon: '🚫', title: 'ReadOnlyRepo',    sub: 'extends UserRepo',           color: '#dc2626', badge: 'LSP violation' }),
    mkNode('save-throws',   460,  55, { icon: '💥', title: 'save() throws',   sub: 'throws new Error',           color: '#dc2626', badge: 'breaks caller' }),
    mkNode('caller-bad',    240, 120, { icon: '💻', title: 'Client code',     sub: 'expects UserRepo — breaks!', color: '#dc2626' }),

    // CORRECT group
    mkGroup('grp-correct', 0, 200, 820, 200, { label: 'CORRECT — Segregated interfaces; subtypes honour their contract', color: '#10b981' }),
    mkNode('ireadable',   20, 265, { icon: '📖', title: 'IReadable',       sub: '«interface» findById()',        color: '#38bdf8', badge: 'read contract' }),
    mkNode('iwritable',   20, 330, { icon: '✏️', title: 'IWritable',       sub: '«interface» save()',           color: '#a78bfa', badge: 'write contract' }),
    mkNode('user-repo-ok',240, 265, { icon: '🗄️', title: 'UserRepo',        sub: 'implements IReadable + IWritable', color: '#10b981' }),
    mkNode('ro-repo-ok',  240, 335, { icon: '📋', title: 'ReadOnlyRepo',    sub: 'implements IReadable only',   color: '#10b981', badge: 'safe subtype' }),
    mkNode('client-ok',   500, 265, { icon: '💻', title: 'Client',          sub: 'uses IReadable',              color: '#64748b', badge: 'works with both' }),
    mkNode('subst-test',  640, 265, {
      icon: '✅',
      title: 'Substitution test',
      sub: 'IReadable ref → UserRepo or ReadOnlyRepo — both work',
      color: '#10b981',
      badge: 'LSP satisfied',
    }),

    // Bottom label
    mkLabel('lbl', 60, 425, { label: 'Subtypes must honour the contract of their base type', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // VIOLATION
    mkEdge('e-bad-extend',  'ro-repo-bad',  'user-repo-bad', { color: '#dc2626', labelText: 'extends' }),
    mkEdge('e-bad-save',    'ro-repo-bad',  'save-throws',   { color: '#dc2626', labelText: 'save() →' }),
    mkEdge('e-bad-caller',  'caller-bad',   'ro-repo-bad',   { color: '#dc2626', dashed: true, labelText: 'expects UserRepo' }),

    // CORRECT — interface implementations
    mkEdge('e-user-read',   'user-repo-ok', 'ireadable',  { color: '#38bdf8', labelText: 'implements' }),
    mkEdge('e-user-write',  'user-repo-ok', 'iwritable',  { color: '#a78bfa', labelText: 'implements' }),
    mkEdge('e-ro-read',     'ro-repo-ok',   'ireadable',  { color: '#38bdf8', labelText: 'implements' }),
    mkEdge('e-client-read', 'client-ok',    'ireadable',  { color: '#10b981', labelText: 'depends on' }),
    mkEdge('e-client-subst','client-ok',    'subst-test', { color: '#10b981', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
