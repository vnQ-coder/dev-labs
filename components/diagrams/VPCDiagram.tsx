'use client';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

const nodes: Node[] = [
  mkNode('internet', 280, 0, {
    icon: '🌐',
    title: 'Internet',
    sub: 'Public traffic',
    color: '#38bdf8',
  }),
  mkNode('igw', 280, 120, {
    icon: '🚪',
    title: 'Internet Gateway',
    sub: 'Ingress / egress',
    color: '#38bdf8',
    badge: '1 per VPC',
  }),

  // Public subnet group
  mkGroup('pub-zone', 20, 230, 670, 110, {
    label: 'Public Subnet — us-east-1a & 1b',
    sub: 'Route: 0.0.0.0/0 → IGW',
    color: '#34d399',
  }),
  mkNode('alb', 40, 15, {
    icon: '⚖️',
    title: 'App Load Balancer',
    sub: 'SSL termination',
    color: '#34d399',
  }, { parentId: 'pub-zone' }),
  mkNode('nat-gw', 440, 15, {
    icon: '🔀',
    title: 'NAT Gateway',
    sub: 'Outbound only',
    color: '#34d399',
    badge: '1 per AZ',
    pills: [{ label: 'Private → Internet (outbound)', color: '#64748b' }],
  }, { parentId: 'pub-zone' }),

  // Private app subnet group
  mkGroup('app-zone', 20, 360, 670, 110, {
    label: 'Private App Subnet — us-east-1a & 1b',
    sub: 'Route: 0.0.0.0/0 → NAT GW',
    color: '#38bdf8',
  }),
  mkNode('ec2', 220, 15, {
    icon: '🖥️',
    title: 'EC2 Auto Scaling',
    sub: 'App servers (no public IP)',
    color: '#38bdf8',
    badge: 'Private subnet',
    pills: [{ label: 'Cannot be reached from internet', color: '#64748b' }],
  }, { parentId: 'app-zone' }),

  // Private DB subnet group
  mkGroup('db-zone', 20, 490, 670, 110, {
    label: 'Private DB Subnet — us-east-1a & 1b',
    sub: 'No internet route',
    color: '#a78bfa',
  }),
  mkNode('rds', 160, 15, {
    icon: '🗄️',
    title: 'Aurora RDS',
    sub: 'Multi-AZ replica',
    color: '#a78bfa',
    badge: 'Encrypted at rest',
    pills: [{ label: 'Only accessible from EC2 SG', color: '#64748b' }],
  }, { parentId: 'db-zone' }),
  mkNode('cache', 420, 15, {
    icon: '⚡',
    title: 'ElastiCache',
    sub: 'Redis cluster',
    color: '#f59e0b',
    badge: 'In-memory cache',
  }, { parentId: 'db-zone' }),

  mkLabel('sg-note', 20, 630, {
    label: 'Security Groups: EC2 SG → only accepts traffic from ALB SG. RDS SG → only from EC2 SG.',
    icon: '🔒',
    color: '#64748b',
  }),
];

const edges: Edge[] = [
  mkEdge('e-inet-igw',  'internet', 'igw',     { color: '#38bdf8' }),
  mkEdge('e-igw-alb',   'igw',      'alb',     { color: '#34d399' }),
  mkEdge('e-alb-ec2',   'alb',      'ec2',     { color: '#38bdf8' }),
  mkEdge('e-ec2-rds',   'ec2',      'rds',     { color: '#a78bfa' }),
  mkEdge('e-ec2-cache', 'ec2',      'cache',   { color: '#f59e0b' }),
  mkEdge('e-ec2-nat',   'ec2',      'nat-gw',  { color: '#34d399', dashed: true, labelText: 'outbound only', animated: false }),
];

export default function VPCDiagram() {
  return <FlowDiagram nodes={nodes} edges={edges} />;
}
