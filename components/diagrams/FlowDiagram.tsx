'use client';

import '@xyflow/react/dist/style.css';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type NodeProps,
  type Edge,
  type Node,
  MarkerType,
} from '@xyflow/react';
import { memo } from 'react';

// ── Invisible handle style (layout anchors only) ───────────────
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

// ── ServiceNode ────────────────────────────────────────────────
export interface ServiceData extends Record<string, unknown> {
  icon?: string;
  title: string;
  sub?: string;
  color?: string;
  badge?: string;
  pills?: { label: string; color: string }[];
  dim?: boolean;
}

export const ServiceNode = memo(({ data }: NodeProps) => {
  const d = data as ServiceData;
  const color = d.color || '#38bdf8';
  return (
    <div
      style={{
        background: d.dim
          ? 'rgba(9,14,26,0.6)'
          : 'linear-gradient(135deg,rgba(9,14,26,0.97) 0%,rgba(13,21,40,0.97) 100%)',
        border: `1.5px solid ${color}`,
        borderRadius: 14,
        padding: '10px 16px',
        minWidth: 110,
        maxWidth: 170,
        textAlign: 'center',
        boxShadow: d.dim
          ? 'none'
          : `0 0 18px ${color}28, 0 4px 14px rgba(0,0,0,0.45)`,
        opacity: d.dim ? 0.5 : 1,
        transition: 'all 0.3s',
      }}
    >
      <Handle type="target" position={Position.Left}   style={HS} id="l" />
      <Handle type="target" position={Position.Top}    style={HS} id="t" />
      {d.icon && (
        <div style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 3 }}>{d.icon}</div>
      )}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#e2e8f0',
          lineHeight: 1.3,
        }}
      >
        {d.title}
      </div>
      {d.sub && (
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>
          {d.sub}
        </div>
      )}
      {d.badge && (
        <div
          style={{
            display: 'inline-block',
            fontSize: 8,
            color,
            background: `${color}1a`,
            borderRadius: 20,
            padding: '2px 8px',
            marginTop: 5,
            fontWeight: 600,
          }}
        >
          {d.badge}
        </div>
      )}
      {d.pills?.map((p, i) => (
        <div
          key={i}
          style={{
            fontSize: 8,
            color: p.color,
            background: `${p.color}1a`,
            borderRadius: 6,
            padding: '2px 7px',
            marginTop: 3,
          }}
        >
          {p.label}
        </div>
      ))}
      <Handle type="source" position={Position.Right}  style={HS} id="r" />
      <Handle type="source" position={Position.Bottom} style={HS} id="b" />
    </div>
  );
});
ServiceNode.displayName = 'ServiceNode';

// ── GroupNode (container / zone) ───────────────────────────────
export interface GroupData extends Record<string, unknown> {
  label: string;
  sub?: string;
  color?: string;
}

export const GroupNode = memo(({ data }: NodeProps) => {
  const d = data as GroupData;
  const color = d.color || '#38bdf8';
  return (
    <div
      style={{
        background: `${color}07`,
        border: `1.5px dashed ${color}45`,
        borderRadius: 18,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        padding: '8px 12px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {d.label}
      </div>
      {d.sub && (
        <div style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>{d.sub}</div>
      )}
    </div>
  );
});
GroupNode.displayName = 'GroupNode';

// ── LabelNode (badge / annotation) ────────────────────────────
export interface LabelData extends Record<string, unknown> {
  label: string;
  icon?: string;
  color?: string;
}

export const LabelNode = memo(({ data }: NodeProps) => {
  const d = data as LabelData;
  const color = d.color || '#64748b';
  return (
    <div
      style={{
        background: `${color}18`,
        border: `1px solid ${color}45`,
        borderRadius: 20,
        padding: '4px 12px',
        fontSize: 9,
        color,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {d.icon && <span>{d.icon}</span>}
      <span>{d.label}</span>
    </div>
  );
});
LabelNode.displayName = 'LabelNode';

// ── Registered node types (stable module-level reference) ──────
const nodeTypes = {
  service: ServiceNode,
  group: GroupNode,
  label: LabelNode,
};

// ── Edge factory ───────────────────────────────────────────────
export function mkEdge(
  id: string,
  source: string,
  target: string,
  opts?: Partial<Edge> & {
    color?: string;
    dashed?: boolean;
    noArrow?: boolean;
    labelText?: string;
    srcHandle?: string;
    tgtHandle?: string;
  }
): Edge {
  const color = opts?.color || '#38bdf8';
  return {
    id,
    source,
    target,
    sourceHandle: opts?.srcHandle,
    targetHandle: opts?.tgtHandle,
    type: 'smoothstep',
    animated: opts?.animated !== false,
    style: {
      stroke: color,
      strokeWidth: 1.8,
      strokeDasharray: opts?.dashed ? '6 3' : undefined,
    },
    markerEnd: opts?.noArrow
      ? undefined
      : { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
    label: opts?.labelText,
    labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 },
    labelBgStyle: { fill: 'rgba(6,10,18,0.85)', fillOpacity: 1 },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    ...opts,
  };
}

// ── Node factory ───────────────────────────────────────────────
export function mkNode(
  id: string,
  x: number,
  y: number,
  data: ServiceData,
  opts?: Partial<Node>
): Node {
  return { id, type: 'service' as const, position: { x, y }, data, ...opts };
}

export function mkGroup(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  data: GroupData,
  opts?: Partial<Node>
): Node {
  return {
    id,
    type: 'group' as const,
    position: { x, y },
    style: { width: w, height: h },
    data,
    ...opts,
  };
}

export function mkLabel(
  id: string,
  x: number,
  y: number,
  data: LabelData,
  opts?: Partial<Node>
): Node {
  return { id, type: 'label' as const, position: { x, y }, data, ...opts };
}

// ── FlowDiagram wrapper ────────────────────────────────────────
interface FlowDiagramProps {
  nodes: Node[];
  edges: Edge[];
}

export default function FlowDiagram({ nodes, edges }: FlowDiagramProps) {
  return (
    <div style={{ height: 420, width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12, minZoom: 0.4, maxZoom: 1.4 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        style={{
          background: 'linear-gradient(135deg,#04080f 0%,#060d1c 100%)',
          borderRadius: 12,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={1}
          color="rgba(255,255,255,0.05)"
        />
      </ReactFlow>
    </div>
  );
}
