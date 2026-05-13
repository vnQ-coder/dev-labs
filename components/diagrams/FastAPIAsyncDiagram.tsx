'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function FastAPIAsyncDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Group 1: async def route
    mkGroup('grp-async', 0, 0, 680, 110, { label: 'async def route — runs directly in asyncio event loop', color: '#38bdf8' }),
    mkNode('req-async',  20,  35, { icon: '📨', title: 'HTTP Request',      sub: 'GET /items',                   color: '#64748b' }),
    mkNode('event-loop', 220, 35, { icon: '🔄', title: 'asyncio Event Loop', sub: 'no thread overhead',          color: '#38bdf8', badge: 'async def' }),
    mkNode('await-io',   460, 35, { icon: '⏳', title: 'await db.fetch()',   sub: 'yields control while waiting', color: '#a78bfa' }),

    // Group 2: sync def route
    mkGroup('grp-sync', 0, 140, 680, 110, { label: 'sync def route — offloaded to threadpool by FastAPI', color: '#f97316' }),
    mkNode('req-sync',   20, 175, { icon: '📨', title: 'HTTP Request',    sub: 'POST /compute',              color: '#64748b' }),
    mkNode('threadpool', 220, 175, { icon: '🧵', title: 'anyio.to_thread()', sub: 'doesn\'t block event loop', color: '#f97316', badge: 'sync def' }),
    mkNode('cpu-work',   460, 175, { icon: '⚙️', title: 'CPU / blocking work', sub: 'runs in worker thread',  color: '#dc2626' }),

    // Group 3: lifespan
    mkGroup('grp-lifespan', 0, 280, 820, 110, { label: 'lifespan context — startup → serve → shutdown', color: '#10b981' }),
    mkNode('startup',    20,  315, { icon: '🟢', title: 'startup',      sub: 'create DB connection pool',  color: '#10b981', badge: '@asynccontextmanager' }),
    mkNode('serve',      270, 315, { icon: '🌐', title: 'handle requests', sub: 'pool shared across routes', color: '#38bdf8' }),
    mkNode('shutdown',   540, 315, { icon: '🔴', title: 'shutdown',     sub: 'close pool cleanly',         color: '#dc2626' }),
    mkNode('app-lifespan',720, 315, { icon: '🏗️', title: 'app = FastAPI(lifespan=lifespan)', sub: 'wires context', color: '#64748b', badge: 'lifespan=' }),

    // Group 4: BackgroundTasks
    mkGroup('grp-bg', 0, 420, 680, 110, { label: 'BackgroundTasks — response returned first, task runs after', color: '#a78bfa' }),
    mkNode('route-bg',   20,  455, { icon: '📬', title: 'Route handler',   sub: 'background.add_task(send_email)', color: '#a78bfa' }),
    mkNode('res-200',   260,  455, { icon: '✅', title: '200 Response',    sub: 'returned immediately to client',   color: '#10b981', badge: 'instant' }),
    mkNode('bg-task',   510,  455, { icon: '📧', title: 'Background Task', sub: 'email / logging runs after send',  color: '#64748b' }),

    // asyncio.gather
    mkGroup('grp-gather', 0, 560, 820, 120, { label: 'asyncio.gather — parallel DB queries in a single route', color: '#f59e0b' }),
    mkNode('route-gather', 20, 600, { icon: '🚀', title: 'Route fires 3 queries', sub: 'asyncio.gather(q1, q2, q3)', color: '#f59e0b' }),
    mkNode('db1',         280, 580, { icon: '🗄️', title: 'DB query 1', sub: 'await db.fetch(users)',    color: '#38bdf8' }),
    mkNode('db2',         280, 625, { icon: '🗄️', title: 'DB query 2', sub: 'await db.fetch(orders)',   color: '#38bdf8' }),
    mkNode('db3',         280, 665, { icon: '🗄️', title: 'DB query 3', sub: 'await db.fetch(products)', color: '#38bdf8' }),
    mkNode('combined',    570, 620, { icon: '📦', title: 'Combined result', sub: 'all 3 awaited, returned together', color: '#10b981', badge: 'parallel' }),

    // Bottom label
    mkLabel('lbl', 80, 700, { label: 'Use async def for I/O-bound. Use sync def for CPU-bound or blocking libraries.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // async def flow
    mkEdge('e-req-async-el', 'req-async', 'event-loop', { color: '#38bdf8', labelText: 'dispatched to' }),
    mkEdge('e-el-await',     'event-loop', 'await-io',  { color: '#a78bfa', dashed: true, labelText: 'await' }),

    // sync def flow
    mkEdge('e-req-sync-tp', 'req-sync',   'threadpool', { color: '#f97316', labelText: 'offloaded to' }),
    mkEdge('e-tp-cpu',      'threadpool', 'cpu-work',   { color: '#dc2626', dashed: true, labelText: 'thread' }),

    // lifespan
    mkEdge('e-startup-serve',   'startup',  'serve',    { color: '#10b981', labelText: 'yield' }),
    mkEdge('e-serve-shutdown',  'serve',    'shutdown', { color: '#dc2626', labelText: 'on exit' }),

    // background tasks
    mkEdge('e-route-res',   'route-bg', 'res-200',  { color: '#10b981', labelText: 'return immediately' }),
    mkEdge('e-route-bg',    'route-bg', 'bg-task',  { color: '#a78bfa', dashed: true, labelText: 'run after' }),

    // gather
    mkEdge('e-gather-db1', 'route-gather', 'db1',      { color: '#f59e0b', labelText: 'parallel' }),
    mkEdge('e-gather-db2', 'route-gather', 'db2',      { color: '#f59e0b' }),
    mkEdge('e-gather-db3', 'route-gather', 'db3',      { color: '#f59e0b' }),
    mkEdge('e-db1-comb',   'db1',          'combined', { color: '#38bdf8', dashed: true }),
    mkEdge('e-db2-comb',   'db2',          'combined', { color: '#38bdf8', dashed: true }),
    mkEdge('e-db3-comb',   'db3',          'combined', { color: '#38bdf8', dashed: true }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
