'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DIAGRAMS } from '@/lib/data/diagrams';

/* ── Custom node types ─────────────────────────────────────────── */

function SourceNode({ data }: NodeProps) {
  const d = data as { label: string; sub: string; color: string };
  return (
    <div style={{
      background: `${d.color}14`, border: `1.5px solid ${d.color}55`,
      borderRadius: 10, padding: '7px 14px', minWidth: 110, textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: d.color, letterSpacing: '0.05em', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{d.label}</div>
      {d.sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{d.sub}</div>}
    </div>
  );
}

function ProcessNode({ data }: NodeProps) {
  const d = data as { label: string; sub: string; color: string };
  return (
    <div style={{
      background: `${d.color}18`, border: `1.5px solid ${d.color}65`,
      borderRadius: 12, padding: '9px 16px', minWidth: 130, textAlign: 'center',
      boxShadow: `0 0 18px ${d.color}18`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: '0.03em', fontFamily: 'var(--font-display)' }}>{d.label}</div>
      {d.sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.42)', marginTop: 3 }}>{d.sub}</div>}
    </div>
  );
}

function SinkNode({ data }: NodeProps) {
  const d = data as { label: string; sub: string; color: string };
  return (
    <div style={{
      background: `${d.color}12`, border: `1px solid ${d.color}45`,
      borderRadius: 10, padding: '7px 14px', minWidth: 110, textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: d.color, fontFamily: 'var(--font-display)' }}>{d.label}</div>
      {d.sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>{d.sub}</div>}
    </div>
  );
}

function ErrorNode({ data }: NodeProps) {
  const d = data as { label: string; sub: string; color: string };
  return (
    <div style={{
      background: 'rgba(248,113,113,0.10)', border: '1.5px solid rgba(248,113,113,0.50)',
      borderRadius: 10, padding: '7px 14px', minWidth: 110, textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-display)' }}>{d.label}</div>
      {d.sub && <div style={{ fontSize: 9, color: 'rgba(248,113,113,0.55)', marginTop: 2 }}>{d.sub}</div>}
    </div>
  );
}

function MetricNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
      borderRadius: 6, padding: '4px 12px', textAlign: 'center', maxWidth: 280,
    }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>{d.label}</div>
    </div>
  );
}

function LabelNode({ data }: NodeProps) {
  const d = data as { label: string; color: string };
  return (
    <div style={{ background: 'transparent', border: 'none' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: d.color, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d.label}</div>
    </div>
  );
}

const NODE_TYPES = {
  source:  SourceNode,
  process: ProcessNode,
  sink:    SinkNode,
  error:   ErrorNode,
  metric:  MetricNode,
  label:   LabelNode,
};

/* ── Main component ────────────────────────────────────────────── */

interface Props {
  conceptId: string;
  color: string;
}

export default function ConceptDiagram({ conceptId, color }: Props) {
  const diagram = DIAGRAMS[conceptId];
  const [mounted, setMounted] = useState(false);
  const [nodes, , onNodesChange] = useNodesState(diagram?.nodes ?? []);
  const [edges, , onEdgesChange] = useEdgesState(diagram?.edges ?? []);
  const onInit = useCallback(() => {}, []);

  useEffect(() => { setMounted(true); }, []);

  if (!diagram || !mounted) {
    return (
      <div
        className="rounded-2xl flex items-center justify-center"
        style={{ height: 280, background: 'var(--s2)', border: '1px solid var(--b1)' }}
      >
        <span style={{ color: 'var(--tm)', fontSize: 13 }}>Diagram coming soon</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ height: 320, border: `1px solid ${color}25`, background: 'var(--s1)' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
        <Controls
          showInteractive={false}
          style={{
            background: 'var(--s2)',
            border: '1px solid var(--b1)',
            borderRadius: 8,
            boxShadow: 'none',
          }}
        />
      </ReactFlow>

      {/* Description strip */}
      <div
        className="px-4 py-2 text-xs leading-relaxed"
        style={{
          background: 'var(--s2)',
          borderTop: `1px solid ${color}20`,
          color: 'var(--tm)',
          fontFamily: 'var(--font-sans)',
          marginTop: -1,
        }}
      >
        {diagram.description}
      </div>
    </div>
  );
}
