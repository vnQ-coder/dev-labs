'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function GHADeployEC2Diagram() {
  const nodes: Node[] = useMemo(() => [
    // Build & push group
    mkGroup('grp-build', 0, 0, 700, 130, { label: 'Build & Push (GitHub Actions Runner)', color: '#f97316' }),
    mkNode('trigger',    20,  35, { icon: '⚡', title: 'GHA Trigger',   sub: 'on: push to main',           color: '#f97316' }),
    mkNode('build-img',  180, 35, { icon: '🐳', title: 'Docker Build',  sub: 'build image from Dockerfile', color: '#38bdf8' }),
    mkNode('push-ecr',   380, 35, { icon: '📦', title: 'Push to ECR',   sub: 'docker push to repository',  color: '#10b981' }),
    mkNode('ecr',        580, 35, { icon: '🗄️', title: 'ECR',           sub: 'image stored with SHA tag',  color: '#10b981', badge: 'image registry' }),

    // Deploy group
    mkGroup('grp-deploy', 0, 160, 820, 200, { label: 'Deploy to EC2 (via SSH action / self-hosted runner)', color: '#38bdf8' }),
    mkNode('ssh-action', 20,  195, { icon: '🔌', title: 'SSH to EC2',      sub: 'appleboy/ssh-action or self-hosted runner', color: '#a78bfa', badge: 'SSH' }),
    mkNode('docker-pull',230, 195, { icon: '⬇️', title: 'docker pull',     sub: 'pull new image from ECR',  color: '#38bdf8' }),
    mkNode('docker-stop',450, 195, { icon: '🛑', title: 'docker stop',     sub: 'stop & remove old container', color: '#dc2626' }),
    mkNode('docker-run', 650, 195, { icon: '▶️', title: 'docker run',      sub: 'start new container (same port)', color: '#10b981', badge: 'deployed' }),

    // EC2 infrastructure group
    mkGroup('grp-ec2', 0, 390, 580, 140, { label: 'EC2 Instance (AWS)', color: '#dc2626' }),
    mkNode('sg',         20,  425, { icon: '🛡️', title: 'Security Group', sub: 'allow SSH 22, HTTP 80/443', color: '#dc2626', badge: 'firewall' }),
    mkNode('ec2-inst',  240,  425, { icon: '🖥️', title: 'EC2 Instance',   sub: 't3.micro / userdata script', color: '#dc2626' }),
    mkNode('container', 460,  425, { icon: '📦', title: 'Docker Container', sub: 'app running on port 8080', color: '#38bdf8', badge: 'live' }),

    mkLabel('lbl1', 20, 550, { label: 'EC2_SSH_KEY stored as GitHub Secret — used by SSH action', icon: '💡', color: '#a78bfa' }),
    mkLabel('lbl2', 20, 585, { label: 'Self-hosted runner on EC2 eliminates need for SSH action entirely', icon: '💡', color: '#10b981' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Build pipeline
    mkEdge('e-trigger-build', 'trigger',    'build-img',  { color: '#f97316' }),
    mkEdge('e-build-push',    'build-img',  'push-ecr',   { color: '#38bdf8', labelText: 'docker push' }),
    mkEdge('e-push-ecr',      'push-ecr',   'ecr',        { color: '#10b981' }),

    // Deploy pipeline
    mkEdge('e-ecr-ssh',       'ecr',        'ssh-action', { color: '#a78bfa', labelText: 'trigger deploy job' }),
    mkEdge('e-ssh-pull',      'ssh-action', 'docker-pull',{ color: '#38bdf8' }),
    mkEdge('e-pull-stop',     'docker-pull','docker-stop', { color: '#dc2626' }),
    mkEdge('e-stop-run',      'docker-stop','docker-run',  { color: '#10b981' }),

    // EC2 infra
    mkEdge('e-sg-ec2',        'sg',         'ec2-inst',   { color: '#dc2626' }),
    mkEdge('e-ec2-cont',      'ec2-inst',   'container',  { color: '#38bdf8', labelText: 'runs container' }),
    mkEdge('e-run-cont',      'docker-run', 'container',  { color: '#10b981', dashed: true, labelText: 'updates' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
