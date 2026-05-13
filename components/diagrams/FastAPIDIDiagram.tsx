'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function FastAPIDIDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Dependency chain group
    mkGroup('grp-chain', 0, 0, 820, 130, { label: 'Depends() Chain — bottom-up resolution', color: '#38bdf8' }),
    mkNode('route-handler', 20,  42, { icon: '🎯', title: 'Route Handler',       sub: 'async def endpoint(user=Depends(get_current_user))', color: '#a78bfa', badge: 'entry point' }),
    mkNode('get-user',     220,  42, { icon: '👤', title: 'get_current_user()',  sub: 'Depends(get_db) → verify JWT → return user',          color: '#38bdf8', badge: 'Depends()' }),
    mkNode('get-db',       440,  42, { icon: '🗄️', title: 'get_db()',            sub: 'yield db — SQLAlchemy session yielded',                color: '#10b981', badge: 'Depends()' }),
    mkNode('db-cleanup',   640,  42, { icon: '🧹', title: 'DB Cleanup',          sub: 'finally: db.close() — runs after response',           color: '#64748b', badge: 'teardown' }),

    // Caching group
    mkGroup('grp-cache', 0, 155, 700, 110, { label: 'Dependency Caching — use_cache=True (default)', color: '#10b981' }),
    mkNode('shared-dep',   20, 193, { icon: '♻️', title: 'Shared Dependency',   sub: 'Same instance reused across all Depends() in request', color: '#10b981', badge: 'use_cache=True' }),
    mkNode('no-cache',    300, 193, { icon: '🔄', title: 'No Cache',            sub: 'use_cache=False — new instance per injection point',    color: '#64748b', badge: 'use_cache=False' }),

    // Router-level vs endpoint-level group
    mkGroup('grp-scope', 0, 290, 700, 110, { label: 'Dependency Scope — router vs endpoint', color: '#f97316' }),
    mkNode('router-dep',   20, 328, { icon: '🏗️', title: 'Router-level Dep',   sub: 'APIRouter(dependencies=[Depends(auth)]) — all routes',  color: '#f97316', badge: 'router scope' }),
    mkNode('endpoint-dep',300, 328, { icon: '📍', title: 'Endpoint-level Dep', sub: '@router.get("/", dependencies=[Depends(rate_limit)])',  color: '#f97316', badge: 'endpoint scope' }),

    // Test override group
    mkGroup('grp-override', 720, 0, 230, 200, { label: 'Test Override', color: '#dc2626' }),
    mkNode('override',     730,  42, { icon: '🧪', title: 'app.dependency_overrides', sub: 'app.dependency_overrides[get_db] = lambda: test_db', color: '#dc2626', badge: 'test pattern' }),
    mkNode('test-db',      730, 130, { icon: '🗄️', title: 'Test Database',     sub: 'SQLite in-memory or test Postgres',                      color: '#64748b', badge: 'override target' }),

    mkLabel('lbl', 80, 420, { label: 'Depends() resolves bottom-up; shared deps cached within request by default.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Chain
    mkEdge('e-route-user', 'route-handler', 'get-user',     { color: '#38bdf8', labelText: 'Depends()' }),
    mkEdge('e-user-db',    'get-user',      'get-db',        { color: '#10b981', labelText: 'Depends()' }),
    mkEdge('e-db-clean',   'get-db',        'db-cleanup',    { color: '#64748b', dashed: true, labelText: 'yield → finally' }),

    // Cache
    mkEdge('e-db-shared',  'get-db',        'shared-dep',    { color: '#10b981', dashed: true, labelText: 'same instance' }),
    mkEdge('e-db-nocache', 'get-db',        'no-cache',      { color: '#64748b', dashed: true }),

    // Scope
    mkEdge('e-rtr-dep',    'route-handler', 'router-dep',    { color: '#f97316', dashed: true }),
    mkEdge('e-ep-dep',     'route-handler', 'endpoint-dep',  { color: '#f97316', dashed: true }),

    // Override
    mkEdge('e-over-db',    'override',      'test-db',       { color: '#dc2626', labelText: 'replaces get_db' }),
    mkEdge('e-route-over', 'route-handler', 'override',      { color: '#dc2626', dashed: true, labelText: 'in tests' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
