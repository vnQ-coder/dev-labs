'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaERDDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Left column — notation guide
    mkNode('notation-entity', 0,   0,   { icon: '▭', title: 'Entity',          sub: 'rectangle = table / entity',     color: '#38bdf8' }),
    mkNode('notation-one-one', 0,  170, { icon: '—', title: '| — | One-to-One', sub: 'each row maps to exactly one',  color: '#4ade80', badge: '1:1' }),
    mkNode('notation-one-many',0,  340, { icon: '<', title: '| — < One-to-Many',sub: 'one parent, many children',     color: '#f59e0b', badge: '1:M' }),
    mkNode('notation-many-many',0, 510, { icon: '⋈', title: '>— < Many-to-Many',sub: 'junction table required',       color: '#a78bfa', badge: 'M:M' }),

    // Right column — ride-sharing example
    mkNode('riders',   480, 0,   { icon: '🧑', title: 'Riders',   sub: 'id, name, phone, rating',       color: '#38bdf8' }),
    mkNode('drivers',  480, 170, { icon: '🚗', title: 'Drivers',  sub: 'id, name, license, rating',     color: '#4ade80' }),
    mkNode('vehicles', 480, 340, { icon: '🚙', title: 'Vehicles', sub: 'id, plate, model, driver_id',   color: '#2dd4bf' }),
    mkNode('trips',    760, 170, { icon: '📍', title: 'Trips',    sub: 'id, rider_id, driver_id, fare, status', color: '#f97316' }),
    mkNode('payments', 760, 340, { icon: '💳', title: 'Payments', sub: 'id, trip_id, amount, method',   color: '#a78bfa' }),

    mkLabel('lbl', 0, 680, { label: 'Identify entities first, then relationships, then attributes', color: '#38bdf8' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // ride-sharing relationships
    mkEdge('e1', 'riders',   'trips',    { color: '#38bdf8', labelText: '1:M' }),
    mkEdge('e2', 'drivers',  'trips',    { color: '#4ade80', labelText: '1:M' }),
    mkEdge('e3', 'trips',    'payments', { color: '#a78bfa', labelText: '1:1' }),
    mkEdge('e4', 'vehicles', 'drivers',  { color: '#2dd4bf', labelText: '1:1 / 1:M fleet' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
