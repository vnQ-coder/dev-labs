'use client';
import { useState, useEffect, useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

type Phase = 'execute' | 'undo';

export default function CommandDiagram() {
  const [phase, setPhase] = useState<Phase>('execute');

  useEffect(() => {
    const id = setInterval(() => setPhase(p => p === 'execute' ? 'undo' : 'execute'), 2500);
    return () => clearInterval(id);
  }, []);

  const isExec = phase === 'execute';

  const nodes: Node[] = useMemo(() => [
    mkNode('client',   0,   100, { icon: '💻', title: 'Client',         sub: 'creates command',           color: '#38bdf8' }),
    mkNode('invoker',  0,   280, { icon: '⏯️', title: 'Invoker',        sub: 'button / scheduler',        color: '#64748b', badge: isExec ? 'execute()' : 'undo()' }),
    mkNode('command',  240, 190, { icon: '📋', title: 'Command',         sub: '<<interface>> execute()/undo()', color: '#a78bfa' }),
    mkNode('concrete', 460, 100, { icon: '💡', title: 'TurnOnCommand',   sub: 'ConcreteCommand',           color: '#f59e0b', badge: isExec ? '▶ execute()' : '◀ undo()' }),
    mkNode('receiver', 680, 100, { icon: '🔦', title: 'Light (Receiver)', sub: 'turnOn() / turnOff()',     color: '#34d399' }),
    mkNode('history',  460, 320, { icon: '📚', title: 'Command History', sub: 'undo / redo stack',         color: '#f472b6' }),
    mkLabel('lbl',     100, 420, { label: 'Commands encapsulate requests as objects — enabling undo, queuing, and logging', color: '#a78bfa' }),
  ], [isExec]);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'client',   'command',  { color: '#38bdf8', labelText: 'new Command(receiver)' }),
    mkEdge('e2', 'invoker',  'command',  { color: '#64748b', labelText: isExec ? 'execute()' : 'undo()' }),
    mkEdge('e3', 'command',  'concrete', { color: '#a78bfa', dashed: true }),
    mkEdge('e4', 'concrete', 'receiver', { color: isExec ? '#34d399' : '#f87171', labelText: isExec ? 'turnOn()' : 'turnOff()' }),
    mkEdge('e5', 'concrete', 'history',  { color: '#f472b6', dashed: true, labelText: 'log' }),
  ], [isExec]);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
