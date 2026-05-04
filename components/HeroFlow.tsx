'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/* ── Custom node components ─────────────────────────────────────── */

function SourceNode({ data }: NodeProps) {
  const d = data as { label: string; sub: string; color: string; pulse: boolean };
  return (
    <div
      style={{
        background: `${d.color}14`,
        border: `1px solid ${d.color}50`,
        borderRadius: 10,
        padding: '8px 14px',
        minWidth: 110,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {d.pulse && (
        <span
          style={{
            position: 'absolute',
            top: 6, right: 6,
            width: 6, height: 6,
            borderRadius: '50%',
            background: d.color,
            animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
          }}
        />
      )}
      <div style={{ fontSize: 10, fontWeight: 700, color: d.color, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{d.label}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{d.sub}</div>
    </div>
  );
}

function ProcessNode({ data }: NodeProps) {
  const d = data as { label: string; sub: string; color: string };
  return (
    <div
      style={{
        background: `${d.color}18`,
        border: `1.5px solid ${d.color}60`,
        borderRadius: 12,
        padding: '10px 18px',
        minWidth: 130,
        textAlign: 'center',
        boxShadow: `0 0 20px ${d.color}18`,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: '0.04em', fontFamily: 'var(--font-display)' }}>{d.label}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', marginTop: 3 }}>{d.sub}</div>
    </div>
  );
}

function SinkNode({ data }: NodeProps) {
  const d = data as { label: string; sub: string; color: string };
  return (
    <div
      style={{
        background: `${d.color}12`,
        border: `1px solid ${d.color}45`,
        borderRadius: 10,
        padding: '8px 14px',
        minWidth: 110,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: d.color, letterSpacing: '0.04em', fontFamily: 'var(--font-display)' }}>{d.label}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>{d.sub}</div>
    </div>
  );
}

function MetricNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: 6,
        padding: '4px 10px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>{d.label}</div>
    </div>
  );
}

const NODE_TYPES = {
  source: SourceNode,
  process: ProcessNode,
  sink: SinkNode,
  metric: MetricNode,
};

/* ── Layout ──────────────────────────────────────────────────────── */

const INITIAL_NODES: Node[] = [
  // Row 0 — clients
  { id: 'web',    type: 'source',  position: { x: 40,  y: 40  }, data: { label: 'Web Client',   sub: 'browser',      color: '#38bdf8', pulse: true  } },
  { id: 'mobile', type: 'source',  position: { x: 40,  y: 140 }, data: { label: 'Mobile App',   sub: 'iOS / Android', color: '#38bdf8', pulse: true  } },
  { id: 'api',    type: 'source',  position: { x: 40,  y: 240 }, data: { label: 'API Client',   sub: 'webhook / SDK', color: '#38bdf8', pulse: false } },

  // Row 1 — load balancer
  { id: 'lb',     type: 'process', position: { x: 230, y: 140 }, data: { label: 'Load Balancer', sub: 'round-robin',  color: '#a78bfa' } },

  // Row 2 — services
  { id: 'auth',   type: 'process', position: { x: 430, y: 30  }, data: { label: 'Auth Service',  sub: 'JWT / OAuth',  color: '#34d399' } },
  { id: 'api2',   type: 'process', position: { x: 430, y: 140 }, data: { label: 'API Service',   sub: 'REST / gRPC',  color: '#34d399' } },
  { id: 'ml',     type: 'process', position: { x: 430, y: 250 }, data: { label: 'ML Service',    sub: 'inference',    color: '#34d399' } },

  // Row 3 — data + queue
  { id: 'cache',  type: 'sink',    position: { x: 640, y: 30  }, data: { label: 'Redis Cache',   sub: 'hot data',     color: '#f59e0b' } },
  { id: 'db',     type: 'sink',    position: { x: 640, y: 140 }, data: { label: 'PostgreSQL',    sub: 'primary DB',   color: '#f87171' } },
  { id: 'queue',  type: 'process', position: { x: 640, y: 250 }, data: { label: 'Message Queue', sub: 'Kafka',        color: '#f97316' } },

  // Row 4 — metrics + worker
  { id: 'worker', type: 'sink',    position: { x: 830, y: 250 }, data: { label: 'Workers',       sub: 'async jobs',   color: '#e879f9' } },
  { id: 'metric', type: 'metric',  position: { x: 830, y: 120 }, data: { label: '99.99% uptime · 2ms p50 · 50K rps' } },
];

const INITIAL_EDGES: Edge[] = [
  // clients → lb
  { id: 'e-web-lb',    source: 'web',    target: 'lb',     animated: true, style: { stroke: '#38bdf820', strokeWidth: 1.5 } },
  { id: 'e-mobile-lb', source: 'mobile', target: 'lb',     animated: true, style: { stroke: '#38bdf820', strokeWidth: 1.5 } },
  { id: 'e-api-lb',    source: 'api',    target: 'lb',     animated: true, style: { stroke: '#38bdf815', strokeWidth: 1.5 } },
  // lb → services
  { id: 'e-lb-auth',   source: 'lb',     target: 'auth',   animated: true, style: { stroke: '#a78bfa30', strokeWidth: 1.5 } },
  { id: 'e-lb-api2',   source: 'lb',     target: 'api2',   animated: true, style: { stroke: '#a78bfa30', strokeWidth: 1.5 } },
  { id: 'e-lb-ml',     source: 'lb',     target: 'ml',     animated: true, style: { stroke: '#a78bfa20', strokeWidth: 1.5 } },
  // services → data
  { id: 'e-auth-cache',source: 'auth',   target: 'cache',  animated: true, style: { stroke: '#f59e0b20', strokeWidth: 1.5 } },
  { id: 'e-api2-db',   source: 'api2',   target: 'db',     animated: true, style: { stroke: '#f8717120', strokeWidth: 1.5 } },
  { id: 'e-api2-queue',source: 'api2',   target: 'queue',  animated: true, style: { stroke: '#f9731630', strokeWidth: 1.5 } },
  { id: 'e-ml-queue',  source: 'ml',     target: 'queue',  animated: true, style: { stroke: '#f9731620', strokeWidth: 1.5 } },
  // queue → workers
  { id: 'e-q-worker',  source: 'queue',  target: 'worker', animated: true, style: { stroke: '#e879f930', strokeWidth: 1.5 } },
];

/* ── Component ───────────────────────────────────────────────────── */

export default function HeroFlow() {
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, , onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onInit = useCallback(() => {}, []);

  if (!mounted) return null;

  return (
    <div
      className="hero-flow"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.65,
      }}
    >
      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.8); opacity: 0.4; }
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
      </ReactFlow>
    </div>
  );
}
