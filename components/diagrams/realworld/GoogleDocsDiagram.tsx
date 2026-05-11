'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from '../FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const GOOGLE = '#4285f4';
const CLIENT = '#38bdf8';
const STORE  = '#34d399';
const ASYNC  = '#f59e0b';

// Animation: edit flows from User A → OT Engine → broadcast to B & C
type EditPhase = 'idle' | 'send' | 'ot' | 'broadcast';
const PHASES: EditPhase[] = ['idle', 'send', 'ot', 'broadcast'];

export default function GoogleDocsDiagram() {
  const [phase, setPhase] = useState<EditPhase>('idle');
  const [editCount, setEditCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % PHASES.length;
      setPhase(PHASES[i]);
      if (PHASES[i] === 'send') setEditCount((c) => c + 1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const nodes: Node[] = useMemo(() => [
    // Clients
    mkNode('userA', 10, 80, {
      icon: '👤',
      title: 'User A (Alice)',
      sub: 'cursor at line 4',
      color: phase === 'send' || phase === 'ot' ? ASYNC : CLIENT,
      badge: phase === 'send' ? `sending edit #${editCount}` : 'typing…',
    }),
    mkNode('userB', 10, 230, {
      icon: '👤',
      title: 'User B (Bob)',
      sub: 'cursor at line 12',
      color: phase === 'broadcast' ? GOOGLE : CLIENT,
      badge: phase === 'broadcast' ? 'receiving delta' : 'reading…',
    }),
    mkNode('userC', 10, 380, {
      icon: '👤',
      title: 'User C (Carol)',
      sub: 'cursor at line 7',
      color: phase === 'broadcast' ? GOOGLE : CLIENT,
      badge: phase === 'broadcast' ? 'receiving delta' : 'idle',
    }),

    // WebSocket LB
    mkNode('wslb', 210, 230, {
      icon: '⚡',
      title: 'WS Load Balancer',
      sub: 'sticky sessions',
      color: GOOGLE,
    }),

    // Collab server
    mkNode('collab', 400, 230, {
      icon: '🔄',
      title: 'Collab Server',
      sub: 'session manager',
      color: phase === 'send' ? ASYNC : GOOGLE,
      badge: `${editCount} edits processed`,
    }),

    // OT Engine
    mkNode('ot', 590, 140, {
      icon: '🧮',
      title: 'OT Engine',
      sub: 'Operational Transform',
      color: phase === 'ot' || phase === 'broadcast' ? ASYNC : GOOGLE,
      badge: 'conflict resolution',
      pills: [
        { label: 'insert(4,"Hello") → transform', color: phase === 'ot' ? ASYNC : '#475569' },
      ],
    }),

    // Doc store
    mkNode('spanner', 590, 300, {
      icon: '🗄️',
      title: 'Doc Store (Spanner)',
      sub: 'globally distributed SQL',
      color: STORE,
      badge: 'rev #' + (editCount + 100),
    }),

    // Revision history
    mkNode('revhist', 780, 300, {
      icon: '📜',
      title: 'Revision History',
      sub: 'named versions · diffs',
      color: STORE,
      dim: phase !== 'broadcast',
    }),

    // Label
    mkLabel('lbl', 10, 10, {
      label: 'Operational Transform ensures edits converge regardless of network order',
      icon: '🔀',
      color: GOOGLE,
    }),
  ], [phase, editCount]);

  const edges: Edge[] = useMemo(() => {
    const sending    = phase === 'send';
    const otActive   = phase === 'ot';
    const casting    = phase === 'broadcast';

    return [
      // All clients → WS LB (always live)
      mkEdge('e-a-lb',  'userA', 'wslb',   { color: sending ? ASYNC : CLIENT, animated: sending }),
      mkEdge('e-b-lb',  'userB', 'wslb',   { color: CLIENT }),
      mkEdge('e-c-lb',  'userC', 'wslb',   { color: CLIENT }),

      // LB → Collab
      mkEdge('e-lb-col', 'wslb', 'collab', { color: sending ? ASYNC : GOOGLE, animated: sending }),

      // Collab → OT
      mkEdge('e-col-ot', 'collab', 'ot',      { color: otActive ? ASYNC : GOOGLE, animated: otActive, labelText: 'apply delta' }),

      // OT → Spanner
      mkEdge('e-ot-sp',  'ot',     'spanner', { color: STORE, animated: otActive, labelText: 'persist' }),

      // Spanner → Revision history
      mkEdge('e-sp-rh',  'spanner', 'revhist', { color: STORE, dashed: true }),

      // OT → broadcast back through collab to B and C
      mkEdge('e-ot-col2', 'ot',    'collab',  { color: casting ? GOOGLE : '#334155', animated: casting }),
      mkEdge('e-col-b',   'collab', 'userB',  { color: casting ? GOOGLE : '#334155', animated: casting, labelText: casting ? 'delta' : undefined }),
      mkEdge('e-col-c',   'collab', 'userC',  { color: casting ? GOOGLE : '#334155', animated: casting, labelText: casting ? 'delta' : undefined }),
    ];
  }, [phase]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
