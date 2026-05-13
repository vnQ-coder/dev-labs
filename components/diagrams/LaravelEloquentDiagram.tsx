'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function LaravelEloquentDiagram() {
  const nodes: Node[] = useMemo(() => [
    // N+1 problem
    mkGroup('grp-n1', 0, 0, 700, 140, { label: 'N+1 Problem — 11 queries for 10 posts', color: '#dc2626' }),
    mkNode('n1-loop', 20, 40, { icon: '🔁', title: 'foreach($posts as $post)', sub: 'Iterate 10 posts', color: '#dc2626', badge: 'bad pattern' }),
    mkNode('n1-query', 240, 40, { icon: '🗄', title: '$post->author', sub: '1 query per post = 10 extra queries', color: '#dc2626', badge: '11 queries total' }),
    mkNode('n1-db', 490, 40, { icon: '💾', title: 'Database', sub: 'SELECT * FROM posts + 10x SELECT author', color: '#dc2626', badge: 'SLOW' }),

    // Eager loading fix
    mkGroup('grp-eager', 0, 170, 680, 130, { label: 'Eager Loading Fix — 2 queries only', color: '#10b981' }),
    mkNode('with-call', 20, 215, { icon: '✅', title: "Post::with('author')", sub: 'Load all at once', color: '#10b981', badge: '2 queries only' }),
    mkNode('eager-q1', 250, 205, { icon: '📋', title: 'Query 1', sub: 'SELECT * FROM posts', color: '#38bdf8' }),
    mkNode('eager-q2', 250, 255, { icon: '📋', title: 'Query 2', sub: 'SELECT * FROM users WHERE id IN (...)', color: '#38bdf8' }),
    mkNode('eager-map', 490, 215, { icon: '🔗', title: 'Hydrate', sub: 'Laravel maps authors to posts in memory', color: '#10b981', badge: 'FAST' }),

    // Relationships
    mkGroup('grp-rels', 0, 330, 760, 160, { label: 'Eloquent Relationships', color: '#a78bfa' }),
    mkNode('rel-hasone', 20, 375, { icon: '1️⃣', title: 'hasOne', sub: 'User → Profile', color: '#a78bfa', badge: 'foreign key on Profile' }),
    mkNode('rel-hasmany', 210, 375, { icon: '📚', title: 'hasMany', sub: 'Post → Comments', color: '#a78bfa', badge: 'foreign key on Comment' }),
    mkNode('rel-belongs', 400, 375, { icon: '↩', title: 'belongsTo', sub: 'Comment → Post', color: '#38bdf8', badge: 'foreign key here' }),
    mkNode('rel-btm', 570, 375, { icon: '🔀', title: 'belongsToMany', sub: 'User ↔ Role via pivot', color: '#f97316', badge: 'pivot table' }),
    mkNode('pivot', 570, 430, { icon: '🔗', title: 'role_user pivot', sub: 'user_id + role_id', color: '#64748b' }),

    // Local scope
    mkGroup('grp-scope', 0, 520, 660, 120, { label: 'Local Scope — reusable query constraints', color: '#f97316' }),
    mkNode('scope-def', 20, 565, { icon: '🔧', title: 'scopeActive($query)', sub: 'return $query->where("active", 1)', color: '#f97316', badge: 'defined on model' }),
    mkNode('scope-use', 280, 565, { icon: '⛓', title: 'User::active()->recent()', sub: 'Chainable with other queries', color: '#10b981', badge: 'reusable' }),

    mkLabel('lbl', 0, 665, { label: "N+1 is Laravel's most common performance bug — always eager load", icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // N+1
    mkEdge('e-loop-q', 'n1-loop', 'n1-query', { color: '#dc2626', labelText: '10 iterations' }),
    mkEdge('e-q-db', 'n1-query', 'n1-db', { color: '#dc2626', labelText: 'each triggers query' }),

    // Eager
    mkEdge('e-with-q1', 'with-call', 'eager-q1', { color: '#38bdf8' }),
    mkEdge('e-with-q2', 'with-call', 'eager-q2', { color: '#38bdf8' }),
    mkEdge('e-q1-map', 'eager-q1', 'eager-map', { color: '#10b981' }),
    mkEdge('e-q2-map', 'eager-q2', 'eager-map', { color: '#10b981' }),

    // Relationships
    mkEdge('e-btm-pivot', 'rel-btm', 'pivot', { color: '#f97316', labelText: 'via' }),

    // Scope
    mkEdge('e-scope-use', 'scope-def', 'scope-use', { color: '#f97316', labelText: '->active()' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
