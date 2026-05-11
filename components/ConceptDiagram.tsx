'use client';

import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DIAGRAMS } from '@/lib/data/diagrams';
import { CLOUD_DIAGRAMS } from '@/lib/data/diagrams-cloud';
import { NETWORKING_DIAGRAMS } from '@/lib/data/diagrams-networking';

/* ── Lazy component diagrams (design patterns + arch patterns) ─── */
const COMPONENT_DIAGRAMS: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  // Design Patterns
  singleton:         lazy(() => import('./diagrams/SingletonDiagram')),
  'factory-method':  lazy(() => import('./diagrams/FactoryMethodDiagram')),
  builder:           lazy(() => import('./diagrams/BuilderDiagram')),
  adapter:           lazy(() => import('./diagrams/AdapterDiagram')),
  facade:            lazy(() => import('./diagrams/FacadeDiagram')),
  decorator:         lazy(() => import('./diagrams/DecoratorDiagram')),
  proxy:             lazy(() => import('./diagrams/ProxyDiagram')),
  observer:          lazy(() => import('./diagrams/ObserverDiagram')),
  strategy:          lazy(() => import('./diagrams/StrategyDiagram')),
  command:           lazy(() => import('./diagrams/CommandDiagram')),
  iterator:          lazy(() => import('./diagrams/IteratorDiagram')),
  'template-method': lazy(() => import('./diagrams/TemplateMethodDiagram')),
  // Architectural Patterns
  'event-driven-architecture': lazy(() => import('./diagrams/EventDrivenArchDiagram')),
  cqrs:                        lazy(() => import('./diagrams/CQRSDiagram')),
  saga:                        lazy(() => import('./diagrams/SagaDiagram')),
  'event-sourcing':            lazy(() => import('./diagrams/EventSourcingDiagram')),
  'transactional-outbox':      lazy(() => import('./diagrams/TransactionalOutboxDiagram')),
  'strangler-fig':             lazy(() => import('./diagrams/StranglerFigDiagram')),
};

/* ── Invisible handle style (layout anchors only) ─────────────── */
const HS: React.CSSProperties = {
  background: 'transparent',
  backgroundColor: 'transparent',
  border: 'none',
  opacity: 0,
  width: 6,
  height: 6,
  minWidth: 6,
  minHeight: 6,
  pointerEvents: 'none',
};

/* ── Custom node types ─────────────────────────────────────────── */

/** Source nodes — callers / clients */
function SourceNode({ data }: NodeProps) {
  const d = data as { label: string; sub?: string; color: string };
  return (
    <div style={{
      background: `linear-gradient(135deg, ${d.color}18 0%, ${d.color}0c 100%)`,
      border: `1.5px solid ${d.color}60`,
      borderRadius: 10,
      padding: '7px 14px',
      minWidth: 110,
      textAlign: 'center',
      boxShadow: `0 0 12px ${d.color}18`,
      transition: 'all 0.3s',
    }}>
      <Handle type="target" position={Position.Left}   style={HS} id="l" />
      <Handle type="target" position={Position.Top}    style={HS} id="t" />
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: d.color,
        letterSpacing: '0.05em',
        fontFamily: 'var(--font-display)',
        textTransform: 'uppercase',
      }}>
        {d.label}
      </div>
      {d.sub && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{d.sub}</div>
      )}
      <Handle type="source" position={Position.Right}  style={HS} id="r" />
      <Handle type="source" position={Position.Bottom} style={HS} id="b" />
    </div>
  );
}

/** Process nodes — central services / brokers */
function ProcessNode({ data }: NodeProps) {
  const d = data as { label: string; sub?: string; color: string };
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(9,14,26,0.97) 0%, ${d.color}12 100%)`,
      border: `1.5px solid ${d.color}80`,
      borderRadius: 12,
      padding: '9px 16px',
      minWidth: 130,
      textAlign: 'center',
      boxShadow: `0 0 20px ${d.color}25, 0 4px 14px rgba(0,0,0,0.5)`,
      transition: 'all 0.3s',
    }}>
      <Handle type="target" position={Position.Left}   style={HS} id="l" />
      <Handle type="target" position={Position.Top}    style={HS} id="t" />
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: d.color,
        letterSpacing: '0.03em',
        fontFamily: 'var(--font-display)',
      }}>
        {d.label}
      </div>
      {d.sub && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)', marginTop: 3, lineHeight: 1.4 }}>{d.sub}</div>
      )}
      <Handle type="source" position={Position.Right}  style={HS} id="r" />
      <Handle type="source" position={Position.Bottom} style={HS} id="b" />
    </div>
  );
}

/** Sink nodes — databases / final destinations */
function SinkNode({ data }: NodeProps) {
  const d = data as { label: string; sub?: string; color: string };
  return (
    <div style={{
      background: `${d.color}10`,
      border: `1px solid ${d.color}50`,
      borderRadius: 10,
      padding: '7px 14px',
      minWidth: 110,
      textAlign: 'center',
      boxShadow: `0 0 8px ${d.color}14`,
      transition: 'all 0.3s',
    }}>
      <Handle type="target" position={Position.Left}   style={HS} id="l" />
      <Handle type="target" position={Position.Top}    style={HS} id="t" />
      <div style={{ fontSize: 10, fontWeight: 600, color: d.color, fontFamily: 'var(--font-display)' }}>
        {d.label}
      </div>
      {d.sub && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{d.sub}</div>
      )}
      <Handle type="source" position={Position.Right}  style={HS} id="r" />
      <Handle type="source" position={Position.Bottom} style={HS} id="b" />
    </div>
  );
}

/** Error nodes — dead letter queues / unhealthy servers */
function ErrorNode({ data }: NodeProps) {
  const d = data as { label: string; sub?: string; color?: string };
  const color = d.color || '#f87171';
  return (
    <div style={{
      background: `${color}12`,
      border: `1.5px solid ${color}60`,
      borderRadius: 10,
      padding: '7px 14px',
      minWidth: 110,
      textAlign: 'center',
      boxShadow: `0 0 14px ${color}20`,
    }}>
      <Handle type="target" position={Position.Left}   style={HS} id="l" />
      <Handle type="target" position={Position.Top}    style={HS} id="t" />
      <div style={{ fontSize: 10, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>
        {d.label}
      </div>
      {d.sub && (
        <div style={{ fontSize: 9, color: `${color}88`, marginTop: 2 }}>{d.sub}</div>
      )}
      <Handle type="source" position={Position.Right}  style={HS} id="r" />
      <Handle type="source" position={Position.Bottom} style={HS} id="b" />
    </div>
  );
}

/** Metric / annotation nodes — no handles needed */
function MetricNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px dashed rgba(255,255,255,0.12)',
      borderRadius: 6,
      padding: '4px 14px',
      textAlign: 'center',
      maxWidth: 340,
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
        {d.label}
      </div>
    </div>
  );
}

/** Label nodes — group headings — no handles needed */
function LabelNode({ data }: NodeProps) {
  const d = data as { label: string; color: string };
  return (
    <div style={{ background: 'transparent', border: 'none', pointerEvents: 'none' }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: d.color,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {d.label}
      </div>
    </div>
  );
}

/* ── Stable module-level nodeTypes reference ───────────────────── */
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
  const ComponentDiagram = COMPONENT_DIAGRAMS[conceptId];
  if (ComponentDiagram) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}25` }}>
        <Suspense fallback={
          <div className="flex items-center justify-center" style={{ height: 420, background: 'linear-gradient(135deg,#04080f 0%,#060d1c 100%)' }}>
            <div className="text-2xl animate-pulse">⚡</div>
          </div>
        }>
          <ComponentDiagram />
        </Suspense>
      </div>
    );
  }

  const ALL_DIAGRAMS = { ...DIAGRAMS, ...CLOUD_DIAGRAMS, ...NETWORKING_DIAGRAMS };
  const diagram = ALL_DIAGRAMS[conceptId];
  const [mounted, setMounted] = useState(false);
  const [nodes, , onNodesChange] = useNodesState(diagram?.nodes ?? []);
  const [edges, , onEdgesChange] = useEdgesState(diagram?.edges ?? []);
  const onInit = useCallback(() => {}, []);

  useEffect(() => { setMounted(true); }, []);

  if (!diagram || !mounted) {
    return (
      <div
        className="rounded-2xl flex items-center justify-center"
        style={{ height: 320, background: 'var(--s2)', border: '1px solid var(--b1)' }}
      >
        <span style={{ color: 'var(--tm)', fontSize: 13 }}>Diagram coming soon</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${color}25` }}
    >
      <div style={{ height: 340, background: 'linear-gradient(135deg,#04080f 0%,#060d1c 100%)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.20 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'transparent' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="rgba(255,255,255,0.05)" />
          <Controls
            showInteractive={false}
            style={{
              background: 'rgba(9,14,26,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              boxShadow: 'none',
            }}
          />
        </ReactFlow>
      </div>

      {/* Description strip */}
      <div
        className="px-4 py-2.5 text-xs leading-relaxed"
        style={{
          background: 'rgba(9,14,26,0.95)',
          borderTop: `1px solid ${color}20`,
          color: 'var(--tm)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {diagram.description}
      </div>
    </div>
  );
}
