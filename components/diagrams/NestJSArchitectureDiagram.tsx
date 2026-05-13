'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NestJSArchitectureDiagram() {
  const nodes: Node[] = useMemo(() => [
    // AppModule group
    mkGroup('grp-app', 0, 0, 860, 110, { label: 'AppModule — root module, bootstraps the application', color: '#e11d48' }),
    mkNode('app-module', 20, 35, { icon: '🏠', title: 'AppModule', sub: 'imports: [UserModule, AuthModule, DatabaseModule]', color: '#e11d48', badge: 'root' }),

    // UserModule group
    mkGroup('grp-user', 0, 145, 400, 200, { label: 'UserModule — user feature module', color: '#38bdf8' }),
    mkNode('user-ctrl',  20, 185, { icon: '🎮', title: 'UserController', sub: 'Handles routes: GET /users, POST /users', color: '#38bdf8', badge: 'controllers' }),
    mkNode('user-svc',  20, 280, { icon: '⚙️', title: 'UserService',    sub: 'Business logic, injected by DI',           color: '#38bdf8', badge: 'providers' }),
    mkNode('user-repo', 200, 280, { icon: '🗄️', title: 'UserRepository', sub: 'Data access via TypeORM',                  color: '#64748b', badge: 'injected' }),

    // AuthModule group
    mkGroup('grp-auth', 430, 145, 230, 200, { label: 'AuthModule', color: '#f97316' }),
    mkNode('auth-ctrl', 445, 185, { icon: '🔐', title: 'AuthController', sub: 'POST /login, POST /register',              color: '#f97316', badge: 'controllers' }),
    mkNode('auth-svc',  445, 280, { icon: '⚙️', title: 'AuthService',    sub: 'JWT signing, password hashing',            color: '#f97316', badge: 'providers' }),

    // DatabaseModule group
    mkGroup('grp-db', 690, 145, 170, 200, { label: 'DatabaseModule (dynamic)', color: '#a78bfa' }),
    mkNode('db-module', 700, 185, { icon: '🗃️', title: 'DatabaseModule', sub: '.forRoot(config) — dynamic module',       color: '#a78bfa', badge: 'exports: TypeOrmModule' }),
    mkNode('db-pool',   700, 280, { icon: '💾', title: 'Connection Pool', sub: 'Shared DB connection exported',           color: '#64748b', badge: 'provider' }),

    // DI label
    mkLabel('lbl', 80, 370, { label: 'Every feature = one module. Modules compose the application.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    mkEdge('e-app-user', 'app-module', 'grp-user', { color: '#38bdf8', labelText: 'imports' }),
    mkEdge('e-app-auth', 'app-module', 'grp-auth', { color: '#f97316', labelText: 'imports' }),
    mkEdge('e-app-db',   'app-module', 'grp-db',   { color: '#a78bfa', labelText: 'imports' }),
    mkEdge('e-uctrl-usvc', 'user-ctrl', 'user-svc', { color: '#38bdf8', labelText: 'injects' }),
    mkEdge('e-usvc-repo',  'user-svc',  'user-repo', { color: '#64748b', dashed: true, labelText: 'DI: UserRepository' }),
    mkEdge('e-user-db',    'user-repo', 'db-module', { color: '#a78bfa', dashed: true, labelText: 'imports DatabaseModule' }),
    mkEdge('e-actrl-asvc', 'auth-ctrl', 'auth-svc', { color: '#f97316', labelText: 'injects' }),
    mkEdge('e-db-pool',    'db-module', 'db-pool',  { color: '#a78bfa', labelText: 'provides' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
