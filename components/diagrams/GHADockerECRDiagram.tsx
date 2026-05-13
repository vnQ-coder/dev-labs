'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GHADockerECRDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Pipeline group
    mkGroup('grp-pipeline', 0, 0, 900, 130, { label: 'GitHub Actions — Docker Build & Push to ECR', color: '#f97316' }),
    mkNode('code-push',   20,  35, { icon: '📤', title: 'Code Push',       sub: 'git push to main',          color: '#64748b' }),
    mkNode('gha-trigger', 170, 35, { icon: '⚡', title: 'GHA Trigger',     sub: 'workflow starts',           color: '#f97316' }),
    mkNode('checkout',    320, 35, { icon: '⬇️', title: 'Checkout',        sub: 'actions/checkout@v4',       color: '#38bdf8' }),
    mkNode('aws-creds',   470, 35, { icon: '🔑', title: 'AWS Credentials', sub: 'configure-aws-credentials', color: '#f97316', badge: 'OIDC' }),
    mkNode('ecr-login',   620, 35, { icon: '🔐', title: 'ECR Login',       sub: 'amazon-ecr-login action',   color: '#10b981' }),
    mkNode('docker-build',760, 35, { icon: '🐳', title: 'Docker Build',    sub: 'docker build -t …',         color: '#38bdf8' }),

    // Second pipeline row
    mkGroup('grp-pipeline2', 0, 160, 660, 130, { label: 'Push & Store', color: '#10b981' }),
    mkNode('docker-tag',  20,  195, { icon: '🏷️', title: 'Docker Tag',   sub: 'tag with commit SHA / latest', color: '#38bdf8' }),
    mkNode('docker-push', 220, 195, { icon: '📦', title: 'Docker Push',  sub: 'docker push to ECR URI',       color: '#10b981' }),
    mkNode('ecr-repo',    460, 195, { icon: '🗄️', title: 'ECR Repository', sub: 'AWS Elastic Container Registry', color: '#f97316', badge: 'image stored' }),

    // OIDC auth group
    mkGroup('grp-oidc', 0, 320, 700, 140, { label: 'OIDC Authentication Flow (no long-lived secrets)', color: '#a78bfa' }),
    mkNode('gh-oidc',     20,  355, { icon: '🪙', title: 'GitHub OIDC Token', sub: 'short-lived JWT from GitHub', color: '#a78bfa' }),
    mkNode('aws-sts',    240,  355, { icon: '🔒', title: 'AWS STS',           sub: 'AssumeRoleWithWebIdentity',   color: '#dc2626' }),
    mkNode('iam-role',   460,  355, { icon: '👤', title: 'IAM Role',          sub: 'ECR push permissions',        color: '#f97316', badge: 'assume role' }),
    mkNode('ecr-creds',  600,  355, { icon: '✅', title: 'ECR Credentials',   sub: 'temp credentials (15 min)',   color: '#10b981' }),

    mkLabel('lbl1', 20, 480, { label: 'OIDC: no AWS_SECRET_ACCESS_KEY stored in GitHub Secrets — safer', icon: '💡', color: '#a78bfa' }),
    mkLabel('lbl2', 20, 515, { label: 'Image URI format: <account>.dkr.ecr.<region>.amazonaws.com/<repo>:<tag>', icon: '💡', color: '#10b981' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Pipeline row 1
    mkEdge('e-push-trigger',  'code-push',   'gha-trigger',  { color: '#f97316', labelText: 'on: push' }),
    mkEdge('e-trigger-co',    'gha-trigger', 'checkout',     { color: '#38bdf8' }),
    mkEdge('e-co-creds',      'checkout',    'aws-creds',    { color: '#f97316' }),
    mkEdge('e-creds-login',   'aws-creds',   'ecr-login',    { color: '#10b981' }),
    mkEdge('e-login-build',   'ecr-login',   'docker-build', { color: '#38bdf8' }),

    // Pipeline row 2
    mkEdge('e-build-tag',     'docker-build','docker-tag',   { color: '#38bdf8' }),
    mkEdge('e-tag-push',      'docker-tag',  'docker-push',  { color: '#10b981' }),
    mkEdge('e-push-ecr',      'docker-push', 'ecr-repo',     { color: '#f97316', labelText: 'stored in ECR' }),

    // OIDC flow
    mkEdge('e-oidc-sts',      'gh-oidc',     'aws-sts',      { color: '#a78bfa', labelText: 'exchange token' }),
    mkEdge('e-sts-role',      'aws-sts',      'iam-role',    { color: '#dc2626', labelText: 'assume role' }),
    mkEdge('e-role-creds',    'iam-role',     'ecr-creds',   { color: '#10b981', labelText: 'temp creds' }),
    mkEdge('e-awscreds-oidc', 'aws-creds',    'gh-oidc',     { color: '#a78bfa', dashed: true, labelText: 'requests OIDC token' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
