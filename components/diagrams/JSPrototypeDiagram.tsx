'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function JSPrototypeDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Prototype chain group
    mkGroup('grp-chain', 0, 0, 760, 130, { label: 'Prototype Chain — Property Lookup Order', color: '#6366f1' }),
    mkNode('instance',    20,  40, { icon: '🐕', title: 'myDog (instance)',    sub: 'own props: name, breed',         color: '#3b82f6', badge: 'lookup starts here' }),
    mkNode('dogproto',   220,  40, { icon: '🔗', title: 'Dog.prototype',       sub: 'bark(), fetch() methods',        color: '#6366f1', badge: '[[Prototype]]' }),
    mkNode('objproto',   470,  40, { icon: '🌐', title: 'Object.prototype',    sub: 'toString, hasOwnProperty',       color: '#8b5cf6', badge: 'root of all objects' }),
    mkNode('nullend',    690,  40, { icon: '🚫', title: 'null',                sub: 'end of chain',                   color: '#64748b', badge: 'chain terminator' }),

    // Property lookup group
    mkGroup('grp-lookup', 0, 160, 760, 130, { label: 'Property Lookup — own → prototype → Object.prototype', color: '#10b981' }),
    mkNode('owncheck',    20, 205, { icon: '🔍', title: 'Check own properties', sub: 'myDog.name → found! ✅',        color: '#10b981', badge: 'step 1' }),
    mkNode('protocheck', 260, 205, { icon: '🔍', title: 'Check Dog.prototype',  sub: 'myDog.bark → found! ✅',        color: '#6366f1', badge: 'step 2' }),
    mkNode('objcheck',   500, 205, { icon: '🔍', title: 'Check Object.prototype', sub: 'myDog.toString → found! ✅', color: '#8b5cf6', badge: 'step 3' }),
    mkNode('notfound',   680, 205, { icon: '❌', title: 'undefined',            sub: 'property not in chain',          color: '#dc2626', badge: 'step 4' }),

    // Class syntax group
    mkGroup('grp-class', 0, 320, 760, 120, { label: 'class Syntax — Syntactic Sugar over Prototype Chain', color: '#f97316' }),
    mkNode('classdef',    20, 365, { icon: '🏷️', title: 'class Dog { }',       sub: 'ES6 class declaration',          color: '#f97316', badge: 'sugar' }),
    mkNode('constructor',240, 365, { icon: '⚙️', title: 'constructor()',        sub: 'sets own properties (this.x)',   color: '#ea580c' }),
    mkNode('methods',    460, 365, { icon: '📋', title: 'class methods',        sub: 'added to Dog.prototype',         color: '#6366f1', badge: 'same prototype chain' }),
    mkNode('newop',      650, 365, { icon: '🆕', title: 'new Dog()',            sub: 'creates instance, sets [[Prototype]]', color: '#3b82f6' }),

    // Label
    mkLabel('lbl', 60, 460, { label: 'class is syntactic sugar — same prototype chain under the hood, no new runtime model', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Prototype chain links
    mkEdge('e-inst-dp',  'instance',   'dogproto',   { color: '#6366f1', labelText: '[[Prototype]]' }),
    mkEdge('e-dp-op',    'dogproto',   'objproto',   { color: '#8b5cf6', labelText: '[[Prototype]]' }),
    mkEdge('e-op-null',  'objproto',   'nullend',    { color: '#64748b', labelText: '[[Prototype]]' }),

    // Lookup steps
    mkEdge('e-own-pc',   'owncheck',   'protocheck', { color: '#6366f1', labelText: 'not own → walk up' }),
    mkEdge('e-pc-oc',    'protocheck', 'objcheck',   { color: '#8b5cf6', labelText: 'not found → walk up' }),
    mkEdge('e-oc-nf',    'objcheck',   'notfound',   { color: '#dc2626', labelText: 'null reached' }),

    // Class syntax
    mkEdge('e-cls-con',  'classdef',   'constructor',{ color: '#ea580c', labelText: 'compiles to' }),
    mkEdge('e-cls-mth',  'classdef',   'methods',    { color: '#6366f1', dashed: true, labelText: 'methods → prototype' }),
    mkEdge('e-new-inst', 'newop',      'instance',   { color: '#3b82f6', labelText: 'creates' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
