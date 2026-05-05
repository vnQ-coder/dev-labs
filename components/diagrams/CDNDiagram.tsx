'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('origin', 300, 160, {
    icon: '🏭',
    title: 'Origin Server',
    sub: 'Virginia, US-EAST-1',
    color: '#38bdf8',
    badge: 'Source of truth',
    pills: [{ label: 'All content lives here', color: '#64748b' }],
  }),
  mkNode('edge-us', 0, 0, {
    icon: '📡',
    title: 'US-East Edge',
    sub: 'New York PoP',
    color: '#34d399',
    badge: '~3ms',
    pills: [{ label: '🇺🇸 200ms → 3ms', color: '#34d399' }],
  }),
  mkNode('edge-eu', 600, 0, {
    icon: '📡',
    title: 'EU-West Edge',
    sub: 'London PoP',
    color: '#a78bfa',
    badge: '~4ms',
    pills: [{ label: '🇪🇺 180ms → 4ms', color: '#a78bfa' }],
  }),
  mkNode('edge-ap', 0, 320, {
    icon: '📡',
    title: 'APAC Edge',
    sub: 'Tokyo PoP',
    color: '#f59e0b',
    badge: '~5ms',
    pills: [{ label: '🇯🇵 250ms → 5ms', color: '#f59e0b' }],
  }),
  mkNode('edge-me', 600, 320, {
    icon: '📡',
    title: 'ME Edge',
    sub: 'Dubai PoP',
    color: '#f97316',
    badge: '~6ms',
    pills: [{ label: '🇦🇪 220ms → 6ms', color: '#f97316' }],
  }),
  mkLabel('u-us', 0, -50, { label: '👤 US User', color: '#34d399' }),
  mkLabel('u-eu', 600, -50, { label: '👤 EU User', color: '#a78bfa' }),
  mkLabel('u-ap', 0, 410, { label: '👤 APAC User', color: '#f59e0b' }),
  mkLabel('u-me', 600, 410, { label: '👤 ME User', color: '#f97316' }),
];

const edges: Edge[] = [
  mkEdge('e-o-us', 'origin', 'edge-us', {
    color: '#34d399',
    dashed: true,
    animated: false,
    labelText: 'cache miss',
  }),
  mkEdge('e-o-eu', 'origin', 'edge-eu', {
    color: '#a78bfa',
    dashed: true,
    animated: false,
    labelText: 'cache miss',
  }),
  mkEdge('e-o-ap', 'origin', 'edge-ap', {
    color: '#f59e0b',
    dashed: true,
    animated: false,
    labelText: 'cache miss',
  }),
  mkEdge('e-o-me', 'origin', 'edge-me', {
    color: '#f97316',
    dashed: true,
    animated: false,
    labelText: 'cache miss',
  }),
];

export default function CDNDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
