'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GHADeployEKSDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Build & push group
    mkGroup('grp-build', 0, 0, 700, 130, { label: 'Build & Push (GitHub Actions)', color: '#f97316' }),
    mkNode('trigger',   20,  35, { icon: '⚡', title: 'GHA Trigger',    sub: 'on: push to main',              color: '#f97316' }),
    mkNode('build',    200,  35, { icon: '🐳', title: 'Docker Build',   sub: 'docker build -t myapp:sha',     color: '#38bdf8' }),
    mkNode('push',     400,  35, { icon: '📦', title: 'Push to ECR',    sub: 'docker push to ECR repository', color: '#10b981' }),
    mkNode('ecr',      600,  35, { icon: '🗄️', title: 'ECR Repo',      sub: 'image stored: myapp:abc123',    color: '#10b981', badge: 'new image' }),

    // Kubernetes deploy group
    mkGroup('grp-k8s-deploy', 0, 160, 820, 130, { label: 'Kubernetes Deployment (via kubectl)', color: '#a78bfa' }),
    mkNode('kubeconfig', 20,  195, { icon: '🔧', title: 'Update kubeconfig', sub: 'aws eks update-kubeconfig',        color: '#a78bfa' }),
    mkNode('set-image',  260, 195, { icon: '✏️', title: 'kubectl set image', sub: 'deployment/myapp myapp=<ECR>:sha', color: '#a78bfa', badge: 'or apply YAML' }),
    mkNode('k8s-apply',  520, 195, { icon: '📋', title: 'kubectl apply',    sub: 'apply deployment.yaml manifest',   color: '#a78bfa' }),
    mkNode('rollout',    700, 195, { icon: '🔄', title: 'Rollout begins',    sub: 'EKS schedules new pods',           color: '#f97316', badge: 'rolling update' }),

    // EKS Cluster group
    mkGroup('grp-eks', 0, 320, 840, 220, { label: 'EKS Cluster — Rolling Pod Update', color: '#dc2626' }),
    mkNode('eks-deploy',  20,  355, { icon: '📊', title: 'Deployment',      sub: 'desired: 3, strategy: RollingUpdate', color: '#dc2626', badge: 'Kubernetes Deployment' }),
    mkNode('rs-old',     240,  340, { icon: '📋', title: 'ReplicaSet (old)', sub: 'scaling down to 0',                  color: '#64748b', badge: 'old RS' }),
    mkNode('rs-new',     240,  430, { icon: '📋', title: 'ReplicaSet (new)', sub: 'scaling up to 3',                    color: '#10b981', badge: 'new RS' }),
    mkNode('pod-old1',   480,  310, { icon: '📦', title: 'Pod (old)',        sub: 'terminating',                        color: '#64748b', badge: 'Terminating' }),
    mkNode('pod-old2',   480,  370, { icon: '📦', title: 'Pod (old)',        sub: 'terminating',                        color: '#64748b', badge: 'Terminating' }),
    mkNode('pod-new1',   680,  330, { icon: '✅', title: 'Pod (new)',        sub: 'running new image',                  color: '#10b981', badge: 'Running' }),
    mkNode('pod-new2',   680,  410, { icon: '✅', title: 'Pod (new)',        sub: 'running new image',                  color: '#10b981', badge: 'Running' }),
    mkNode('pod-new3',   680,  490, { icon: '✅', title: 'Pod (new)',        sub: 'running new image',                  color: '#10b981', badge: 'Running' }),

    mkLabel('lbl1', 20, 560, { label: 'maxSurge: 1, maxUnavailable: 0 → zero-downtime rolling update', icon: '💡', color: '#10b981' }),
    mkLabel('lbl2', 20, 595, { label: 'kubectl rollout undo deployment/myapp → instant rollback', icon: '💡', color: '#a78bfa' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Build pipeline
    mkEdge('e-trigger-build', 'trigger',    'build',      { color: '#f97316' }),
    mkEdge('e-build-push',    'build',      'push',       { color: '#38bdf8' }),
    mkEdge('e-push-ecr',      'push',       'ecr',        { color: '#10b981' }),

    // K8s deploy pipeline
    mkEdge('e-ecr-kube',      'ecr',        'kubeconfig', { color: '#a78bfa', labelText: 'new image ready' }),
    mkEdge('e-kube-set',      'kubeconfig', 'set-image',  { color: '#a78bfa' }),
    mkEdge('e-set-apply',     'set-image',  'k8s-apply',  { color: '#a78bfa' }),
    mkEdge('e-apply-rollout', 'k8s-apply',  'rollout',    { color: '#f97316' }),

    // EKS rolling update
    mkEdge('e-rollout-deploy','rollout',    'eks-deploy', { color: '#dc2626', labelText: 'triggers' }),
    mkEdge('e-deploy-rs-old', 'eks-deploy', 'rs-old',     { color: '#64748b', dashed: true, labelText: 'scale down' }),
    mkEdge('e-deploy-rs-new', 'eks-deploy', 'rs-new',     { color: '#10b981', labelText: 'scale up' }),
    mkEdge('e-rs-old-p1',     'rs-old',     'pod-old1',   { color: '#64748b', dashed: true }),
    mkEdge('e-rs-old-p2',     'rs-old',     'pod-old2',   { color: '#64748b', dashed: true }),
    mkEdge('e-rs-new-p1',     'rs-new',     'pod-new1',   { color: '#10b981' }),
    mkEdge('e-rs-new-p2',     'rs-new',     'pod-new2',   { color: '#10b981' }),
    mkEdge('e-rs-new-p3',     'rs-new',     'pod-new3',   { color: '#10b981' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
