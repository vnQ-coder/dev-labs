'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GHADeployECSDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Build & push group
    mkGroup('grp-build', 0, 0, 680, 130, { label: 'Build & Push (GitHub Actions)', color: '#f97316' }),
    mkNode('trigger',   20,  35, { icon: '⚡', title: 'GHA Trigger',  sub: 'on: push to main',            color: '#f97316' }),
    mkNode('build',    180,  35, { icon: '🐳', title: 'Docker Build', sub: 'build & tag with commit SHA', color: '#38bdf8' }),
    mkNode('push',     380,  35, { icon: '📦', title: 'Push to ECR',  sub: 'docker push <account>.dkr.ecr…', color: '#10b981' }),
    mkNode('ecr',      580,  35, { icon: '🗄️', title: 'ECR Repo',    sub: 'new image available',          color: '#10b981', badge: 'myapp:abc123' }),

    // Task definition group
    mkGroup('grp-taskdef', 0, 160, 820, 130, { label: 'Update ECS Task Definition', color: '#a78bfa' }),
    mkNode('dl-taskdef', 20,  195, { icon: '📥', title: 'Download Task Def',   sub: 'aws ecs describe-task-definition', color: '#a78bfa' }),
    mkNode('upd-img',   260,  195, { icon: '✏️', title: 'Update Image URI',    sub: 'aws ecs register-task-definition', color: '#a78bfa', badge: 'new image tag' }),
    mkNode('reg-taskdef',520, 195, { icon: '📋', title: 'New Task Def Revision', sub: 'family:task-def:42 → :43',       color: '#a78bfa', badge: 'revision N+1' }),
    mkNode('deploy-svc', 700, 195, { icon: '🚀', title: 'Update ECS Service',  sub: 'aws ecs update-service',          color: '#f97316' }),

    // ECS Cluster group
    mkGroup('grp-ecs', 0, 320, 780, 180, { label: 'ECS Cluster (Fargate) — Rolling Deployment', color: '#dc2626' }),
    mkNode('ecs-svc',   20,  355, { icon: '⚙️', title: 'ECS Service',     sub: 'desired count = 2, rolling update',  color: '#dc2626', badge: 'service' }),
    mkNode('old-task1', 240, 355, { icon: '📦', title: 'Task (old)',       sub: 'running old image :prev',            color: '#64748b', badge: 'draining' }),
    mkNode('old-task2', 240, 430, { icon: '📦', title: 'Task (old)',       sub: 'running old image :prev',            color: '#64748b', badge: 'draining' }),
    mkNode('new-task1', 490, 355, { icon: '✅', title: 'Task (new)',       sub: 'running new image :abc123',          color: '#10b981', badge: 'healthy' }),
    mkNode('new-task2', 490, 430, { icon: '✅', title: 'Task (new)',       sub: 'running new image :abc123',          color: '#10b981', badge: 'healthy' }),
    mkNode('alb',       680, 385, { icon: '⚖️', title: 'ALB',             sub: 'routes traffic to healthy tasks',    color: '#38bdf8', badge: 'load balancer' }),

    mkLabel('lbl1', 20, 520, { label: 'ECS rolling update: new tasks start, old tasks drain — zero downtime', icon: '💡', color: '#10b981' }),
    mkLabel('lbl2', 20, 555, { label: 'Task Def is immutable — each deploy creates new revision', icon: '💡', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Build
    mkEdge('e-trigger-build', 'trigger',    'build',      { color: '#f97316' }),
    mkEdge('e-build-push',    'build',      'push',       { color: '#38bdf8' }),
    mkEdge('e-push-ecr',      'push',       'ecr',        { color: '#10b981' }),

    // Task def update
    mkEdge('e-ecr-dl',        'ecr',        'dl-taskdef', { color: '#a78bfa', labelText: 'new image URI' }),
    mkEdge('e-dl-upd',        'dl-taskdef', 'upd-img',    { color: '#a78bfa' }),
    mkEdge('e-upd-reg',       'upd-img',    'reg-taskdef',{ color: '#a78bfa' }),
    mkEdge('e-reg-deploy',    'reg-taskdef','deploy-svc', { color: '#f97316', labelText: 'update service' }),

    // ECS rolling
    mkEdge('e-svc-old1',      'ecs-svc',   'old-task1',  { color: '#64748b', dashed: true, labelText: 'draining' }),
    mkEdge('e-svc-old2',      'ecs-svc',   'old-task2',  { color: '#64748b', dashed: true }),
    mkEdge('e-svc-new1',      'ecs-svc',   'new-task1',  { color: '#10b981', labelText: 'start new' }),
    mkEdge('e-svc-new2',      'ecs-svc',   'new-task2',  { color: '#10b981' }),
    mkEdge('e-new1-alb',      'new-task1', 'alb',        { color: '#38bdf8' }),
    mkEdge('e-new2-alb',      'new-task2', 'alb',        { color: '#38bdf8' }),
    mkEdge('e-deploy-svc-ecs','deploy-svc','ecs-svc',    { color: '#f97316', labelText: 'triggers rolling update' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
