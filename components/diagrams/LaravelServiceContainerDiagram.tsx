'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function LaravelServiceContainerDiagram() {
  const nodes: Node[] = useMemo(() => [
    // IoC container center
    mkNode('container', 300, 30, { icon: '📦', title: 'IoC Container', sub: 'app() / App::make()', color: '#dc2626', badge: 'heart of Laravel' }),

    // Binding types
    mkGroup('grp-bindings', 0, 140, 760, 130, { label: 'Binding Types', color: '#f97316' }),
    mkNode('bind', 20, 185, { icon: '🔁', title: 'bind()', sub: 'New instance every call', color: '#f97316', badge: 'transient' }),
    mkNode('singleton', 240, 185, { icon: '1️⃣', title: 'singleton()', sub: 'Same instance every call', color: '#10b981', badge: 'shared' }),
    mkNode('instance', 480, 185, { icon: '📌', title: 'instance()', sub: 'Pre-built object registered', color: '#38bdf8', badge: 'pre-bound' }),

    // Interface → Implementation
    mkGroup('grp-iface', 0, 305, 740, 130, { label: 'Interface → Implementation resolution', color: '#a78bfa' }),
    mkNode('route', 20, 350, { icon: '🌐', title: 'Route', sub: 'Calls UserController', color: '#64748b' }),
    mkNode('user-ctrl', 200, 350, { icon: '🎮', title: 'UserController', sub: 'Needs IUserRepo', color: '#a78bfa' }),
    mkNode('iuserrepo', 390, 350, { icon: '📄', title: 'IUserRepo', sub: 'Interface / abstract', color: '#38bdf8', badge: 'bound to →' }),
    mkNode('eloquent-repo', 570, 350, { icon: '🗄', title: 'EloquentUserRepo', sub: 'Concrete implementation', color: '#10b981', badge: 'resolved' }),

    // Service Provider
    mkGroup('grp-provider', 0, 465, 660, 130, { label: 'Service Provider — register() then boot()', color: '#38bdf8' }),
    mkNode('register', 20, 510, { icon: '📋', title: 'register()', sub: 'Wire bindings into container', color: '#38bdf8', badge: 'runs first' }),
    mkNode('boot', 260, 510, { icon: '🚀', title: 'boot()', sub: 'Runs after all providers registered', color: '#10b981', badge: 'runs second' }),
    mkNode('app-provider', 490, 510, { icon: '🏗', title: 'AppServiceProvider', sub: 'Main provider class', color: '#64748b' }),

    // Facade
    mkGroup('grp-facade', 0, 625, 680, 130, { label: 'Facade — static proxy to container binding', color: '#dc2626' }),
    mkNode('facade-call', 20, 670, { icon: '🎭', title: 'Cache::get()', sub: 'Static facade call', color: '#dc2626' }),
    mkNode('get-accessor', 240, 670, { icon: '🔑', title: 'getFacadeAccessor()', sub: 'Returns "cache" key', color: '#f97316' }),
    mkNode('container-make', 430, 670, { icon: '📦', title: 'container->make("cache")', sub: 'Resolves real object', color: '#a78bfa' }),
    mkNode('real-obj', 610, 670, { icon: '✅', title: 'CacheManager', sub: 'Real object, method called', color: '#10b981', badge: 'actual instance' }),

    mkLabel('lbl', 0, 780, { label: 'Service Container resolves all class dependencies automatically via constructor injection', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Container to bindings
    mkEdge('e-cont-bind', 'container', 'bind', { color: '#f97316' }),
    mkEdge('e-cont-sing', 'container', 'singleton', { color: '#10b981' }),
    mkEdge('e-cont-inst', 'container', 'instance', { color: '#38bdf8' }),

    // Interface resolution
    mkEdge('e-route-ctrl', 'route', 'user-ctrl', { color: '#a78bfa', labelText: 'resolves' }),
    mkEdge('e-ctrl-iface', 'user-ctrl', 'iuserrepo', { color: '#38bdf8', labelText: 'depends on' }),
    mkEdge('e-iface-eloq', 'iuserrepo', 'eloquent-repo', { color: '#10b981', labelText: 'container resolves' }),

    // Service provider
    mkEdge('e-prov-reg', 'app-provider', 'register', { color: '#38bdf8' }),
    mkEdge('e-reg-boot', 'register', 'boot', { color: '#10b981', labelText: 'after all providers' }),

    // Facade
    mkEdge('e-facade-acc', 'facade-call', 'get-accessor', { color: '#f97316', labelText: 'calls' }),
    mkEdge('e-acc-make', 'get-accessor', 'container-make', { color: '#a78bfa', labelText: 'key' }),
    mkEdge('e-make-real', 'container-make', 'real-obj', { color: '#10b981', labelText: 'returns' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
