'use client';

import { lazy, Suspense } from 'react';
import { Concept } from '@/lib/types';

const diagrams: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  monolith: lazy(() => import('@/components/diagrams/MonolithDiagram')),
  apigateway: lazy(() => import('@/components/diagrams/ApiGatewayDiagram')),
  loadbalancer: lazy(() => import('@/components/diagrams/LoadBalancerDiagram')),
  caching: lazy(() => import('@/components/diagrams/CachingDiagram')),
  cdn: lazy(() => import('@/components/diagrams/CDNDiagram')),
  databases: lazy(() => import('@/components/diagrams/DatabasesDiagram')),
  sharding: lazy(() => import('@/components/diagrams/ShardingDiagram')),
  messagequeue: lazy(() => import('@/components/diagrams/MessageQueueDiagram')),
  ratelimit: lazy(() => import('@/components/diagrams/RateLimitDiagram')),
  cap: lazy(() => import('@/components/diagrams/CAPDiagram')),
  circuit: lazy(() => import('@/components/diagrams/CircuitBreakerDiagram')),
  vpc: lazy(() => import('@/components/diagrams/VPCDiagram')),
  subnets: lazy(() => import('@/components/diagrams/VPCDiagram')),
  'security-groups': lazy(() => import('@/components/diagrams/VPCDiagram')),
  'nat-gateway': lazy(() => import('@/components/diagrams/VPCDiagram')),
  'ports-protocols': lazy(() => import('@/components/diagrams/VPCDiagram')),
  dns: lazy(() => import('@/components/diagrams/DNSDiagram')),
  route53: lazy(() => import('@/components/diagrams/DNSDiagram')),
  cloudflare: lazy(() => import('@/components/diagrams/DNSDiagram')),
  cloudfront: lazy(() => import('@/components/diagrams/DNSDiagram')),
  ec2: lazy(() => import('@/components/diagrams/CloudArchDiagram')),
  containers: lazy(() => import('@/components/diagrams/CloudArchDiagram')),
  s3: lazy(() => import('@/components/diagrams/CloudArchDiagram')),
  rds: lazy(() => import('@/components/diagrams/CloudArchDiagram')),
  iam: lazy(() => import('@/components/diagrams/CloudArchDiagram')),
  lambda: lazy(() => import('@/components/diagrams/ServerlessDiagram')),
};

export default function DiagramTab({ concept }: { concept: Concept }) {
  const Diagram = diagrams[concept.id];

  if (!Diagram) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
        <p style={{ color: 'var(--tm)' }}>Diagram coming soon</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
        <div className="px-4 py-2.5" style={{ background: 'var(--s3)', borderBottom: '1px solid var(--b0)' }}>
          <span className="text-xs" style={{ color: 'var(--tm)' }}>Interactive Diagram — {concept.title}</span>
        </div>
        <div className="p-4">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-2xl animate-pulse">⚡</div>
            </div>
          }>
            <Diagram />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
