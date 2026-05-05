'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

type CBState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export default function CircuitBreakerDiagram() {
  const [state, setState] = useState<CBState>('CLOSED');

  useEffect(() => {
    const cycle: CBState[] = ['CLOSED', 'OPEN', 'HALF_OPEN'];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % 3; setState(cycle[i]); }, 2500);
    return () => clearInterval(id);
  }, []);

  const stateColor = state === 'CLOSED' ? '#34d399' : state === 'OPEN' ? '#f87171' : '#f59e0b';
  const stateIcon  = state === 'CLOSED' ? '🟢' : state === 'OPEN' ? '🔴' : '🟡';
  const stateDesc  = state === 'CLOSED'
    ? 'Normal flow — requests pass through. Counting failures.'
    : state === 'OPEN'
    ? 'Tripped! All requests fail fast. 30s timer running.'
    : 'Testing recovery — 1 probe request allowed through.';

  const nodes: Node[] = useMemo(() => [
    mkNode('svc-a', 0, 140, { icon: '⚙️', title: 'Service A', sub: 'Caller', color: '#38bdf8' }),
    mkNode('breaker', 230, 100, {
      icon: stateIcon,
      title: 'Circuit Breaker',
      sub: state,
      color: stateColor,
      badge: state === 'CLOSED' ? 'Failures: 2/5' : state === 'OPEN' ? 'Timer: 28s remaining' : 'Probe: 1 request',
      pills: [{ label: stateDesc, color: stateColor }],
    }),
    mkNode('svc-b', 530, 140, {
      icon: state === 'OPEN' ? '🔥' : '🟢',
      title: 'Service B',
      sub: state === 'OPEN' ? 'Unavailable' : 'Downstream',
      color: state === 'OPEN' ? '#f87171' : '#34d399',
      dim: state === 'OPEN',
    }),
    mkNode('fallback', 530, 310, {
      icon: '⚡',
      title: 'Fallback',
      sub: 'Cached / default response',
      color: '#f59e0b',
      badge: state === 'OPEN' ? '← Active now' : 'Standby',
      dim: state !== 'OPEN',
    }),
    mkLabel('lbl', 170, 300, {
      label: state === 'CLOSED' ? '✅ CLOSED — Normal operation'
           : state === 'OPEN'   ? '🔴 OPEN — Fail fast, protect Service B'
           :                      '🟡 HALF-OPEN — Recovery probe',
      color: stateColor,
    }),
  ], [state, stateColor, stateIcon, stateDesc]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-a-br', 'svc-a', 'breaker', { color: '#38bdf8' }),
    ...(state !== 'OPEN' ? [mkEdge('e-br-b', 'breaker', 'svc-b', { color: stateColor, dashed: state === 'HALF_OPEN' })] : []),
    ...(state === 'OPEN'  ? [mkEdge('e-br-fb', 'breaker', 'fallback', { color: '#f59e0b' })] : []),
  ], [state, stateColor]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
