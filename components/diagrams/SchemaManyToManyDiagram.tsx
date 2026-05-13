'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function SchemaManyToManyDiagram() {
  const nodes: Node[] = useMemo(() => [
    mkLabel('lbl-students',  0,   0,  { label: 'Students',       color: '#38bdf8' }),
    mkLabel('lbl-junction',  350, 0,  { label: 'Junction Table',  color: '#a78bfa' }),
    mkLabel('lbl-courses',   700, 0,  { label: 'Courses',         color: '#4ade80' }),

    mkNode('student1', 0,   60,  { icon: '🎓', title: 'Student A', sub: 'id, name, email',          color: '#38bdf8' }),
    mkNode('student2', 0,   180, { icon: '🎓', title: 'Student B', sub: 'id, name, email',          color: '#38bdf8' }),

    mkNode('junction', 350, 100, { icon: '🔗', title: 'enrollments', sub: 'student_id, course_id, enrolled_at, grade', color: '#a78bfa', badge: 'PK: (student_id, course_id)' }),
    mkNode('extra-fields', 350, 240, { icon: '➕', title: 'Extra Attributes', sub: 'enrolled_at TIMESTAMP, grade CHAR', color: '#a78bfa' }),

    mkNode('course1', 700, 60,  { icon: '📚', title: 'Course X', sub: 'id, title, credits',        color: '#4ade80' }),
    mkNode('course2', 700, 180, { icon: '📚', title: 'Course Y', sub: 'id, title, credits',        color: '#4ade80' }),

    mkLabel('lbl-examples', 0, 360, { label: 'Real-world Many-to-Many examples', color: '#f59e0b' }),

    mkNode('ex-ecommerce', 0,   420, { icon: '🛒', title: 'Ecommerce',       sub: 'Product many-to-many Category',         color: '#f97316', badge: 'product_categories' }),
    mkNode('ex-whatsapp',  300, 420, { icon: '💬', title: 'WhatsApp',        sub: 'User many-to-many GroupChat',            color: '#f59e0b', badge: 'group_members' }),
    mkNode('ex-banking',   600, 420, { icon: '🏦', title: 'Banking',         sub: 'Customer many-to-many Account (joint)',  color: '#2dd4bf', badge: 'account_holders' }),

    mkLabel('lbl-note', 0, 540, { label: 'Many-to-Many: always resolved with a junction table — add extra columns to the junction for relationship attributes', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e1', 'student1', 'junction', { color: '#38bdf8', labelText: 'M' }),
    mkEdge('e2', 'student2', 'junction', { color: '#38bdf8' }),
    mkEdge('e3', 'junction', 'course1',  { color: '#4ade80', labelText: 'M' }),
    mkEdge('e4', 'junction', 'course2',  { color: '#4ade80' }),
    mkEdge('e5', 'junction', 'extra-fields', { color: '#a78bfa', dashed: true, labelText: 'attributes' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
