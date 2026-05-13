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

  // Design Patterns
  singleton: lazy(() => import('@/components/diagrams/SingletonDiagram')),
  'factory-method': lazy(() => import('@/components/diagrams/FactoryMethodDiagram')),
  builder: lazy(() => import('@/components/diagrams/BuilderDiagram')),
  adapter: lazy(() => import('@/components/diagrams/AdapterDiagram')),
  facade: lazy(() => import('@/components/diagrams/FacadeDiagram')),
  decorator: lazy(() => import('@/components/diagrams/DecoratorDiagram')),
  proxy: lazy(() => import('@/components/diagrams/ProxyDiagram')),
  observer: lazy(() => import('@/components/diagrams/ObserverDiagram')),
  strategy: lazy(() => import('@/components/diagrams/StrategyDiagram')),
  command: lazy(() => import('@/components/diagrams/CommandDiagram')),
  iterator: lazy(() => import('@/components/diagrams/IteratorDiagram')),
  'template-method': lazy(() => import('@/components/diagrams/TemplateMethodDiagram')),

  // Architectural Patterns
  'event-driven-architecture': lazy(() => import('@/components/diagrams/EventDrivenArchDiagram')),
  cqrs: lazy(() => import('@/components/diagrams/CQRSDiagram')),
  saga: lazy(() => import('@/components/diagrams/SagaDiagram')),
  'event-sourcing': lazy(() => import('@/components/diagrams/EventSourcingDiagram')),
  'transactional-outbox': lazy(() => import('@/components/diagrams/TransactionalOutboxDiagram')),
  'strangler-fig': lazy(() => import('@/components/diagrams/StranglerFigDiagram')),
  // Redis
  'redis-data-structures':  lazy(() => import('@/components/diagrams/RedisDataStructuresDiagram')),
  'cache-aside':             lazy(() => import('@/components/diagrams/CacheAsideDiagram')),
  'write-through-cache':     lazy(() => import('@/components/diagrams/WriteThroughDiagram')),
  'write-behind-cache':      lazy(() => import('@/components/diagrams/WriteBehindDiagram')),
  'write-around-cache':      lazy(() => import('@/components/diagrams/WriteAroundDiagram')),
  'cache-eviction':          lazy(() => import('@/components/diagrams/CacheEvictionDiagram')),
  'redis-persistence':       lazy(() => import('@/components/diagrams/RedisPersistenceDiagram')),
  'redis-distributed-lock':  lazy(() => import('@/components/diagrams/RedisDistributedLockDiagram')),
  'redis-pub-sub':           lazy(() => import('@/components/diagrams/RedisPubSubDiagram')),
  'redis-cluster':           lazy(() => import('@/components/diagrams/RedisClusterDiagram')),
  // PostgreSQL
  'postgres-mvcc':           lazy(() => import('@/components/diagrams/PostgresMVCCDiagram')),
  'postgres-indexes':        lazy(() => import('@/components/diagrams/PostgresIndexesDiagram')),
  'postgres-transactions':   lazy(() => import('@/components/diagrams/PostgresTransactionsDiagram')),
  'postgres-row-locking':    lazy(() => import('@/components/diagrams/PostgresRowLockingDiagram')),
  'postgres-deadlocks':      lazy(() => import('@/components/diagrams/PostgresDeadlocksDiagram')),
  'postgres-wal':            lazy(() => import('@/components/diagrams/PostgresWALDiagram')),
  'postgres-partitioning':   lazy(() => import('@/components/diagrams/PostgresPartitioningDiagram')),
  'postgres-replication':    lazy(() => import('@/components/diagrams/PostgresReplicationDiagram')),
  'postgres-vacuum':         lazy(() => import('@/components/diagrams/PostgresVacuumDiagram')),
  'postgres-query-planner':  lazy(() => import('@/components/diagrams/PostgresQueryPlannerDiagram')),
  // AWS Services
  'aws-sqs':                 lazy(() => import('@/components/diagrams/AWSSQSDiagram')),
  'aws-ses':                 lazy(() => import('@/components/diagrams/AWSSESDiagram')),
  'aws-kms':                 lazy(() => import('@/components/diagrams/AWSKMSDiagram')),
  'aws-waf':                 lazy(() => import('@/components/diagrams/AWSWAFDiagram')),
  // Data Structures
  'ds-array':                lazy(() => import('@/components/diagrams/DSArrayDiagram')),
  'ds-linked-list':          lazy(() => import('@/components/diagrams/DSLinkedListDiagram')),
  'ds-stack':                lazy(() => import('@/components/diagrams/DSStackDiagram')),
  'ds-queue':                lazy(() => import('@/components/diagrams/DSQueueDiagram')),
  'ds-hash-table':           lazy(() => import('@/components/diagrams/DSHashTableDiagram')),
  'ds-bst':                  lazy(() => import('@/components/diagrams/DSBSTDiagram')),
  'ds-heap':                 lazy(() => import('@/components/diagrams/DSHeapDiagram')),
  'ds-graph':                lazy(() => import('@/components/diagrams/DSGraphDiagram')),
  'ds-trie':                 lazy(() => import('@/components/diagrams/DSTrieDiagram')),
  'ds-union-find':           lazy(() => import('@/components/diagrams/DSUnionFindDiagram')),
  // MongoDB
  'mongodb-documents':       lazy(() => import('@/components/diagrams/MongoDocumentsDiagram')),
  'mongodb-indexes':         lazy(() => import('@/components/diagrams/MongoIndexesDiagram')),
  'mongodb-aggregation':     lazy(() => import('@/components/diagrams/MongoAggregationDiagram')),
  'mongodb-replication':     lazy(() => import('@/components/diagrams/MongoReplicationDiagram')),
  'mongodb-sharding':        lazy(() => import('@/components/diagrams/MongoShardingDiagram')),
  'mongodb-transactions':    lazy(() => import('@/components/diagrams/MongoTransactionsDiagram')),
  // Git
  'git-basics':              lazy(() => import('@/components/diagrams/GitBasicsDiagram')),
  'git-branching':           lazy(() => import('@/components/diagrams/GitBranchingDiagram')),
  'git-advanced':            lazy(() => import('@/components/diagrams/GitAdvancedDiagram')),
  'git-remote':              lazy(() => import('@/components/diagrams/GitRemoteDiagram')),
  'git-internals':           lazy(() => import('@/components/diagrams/GitInternalsDiagram')),
  // GitHub Actions
  'gha-fundamentals':        lazy(() => import('@/components/diagrams/GHAFundamentalsDiagram')),
  'gha-docker-ecr':          lazy(() => import('@/components/diagrams/GHADockerECRDiagram')),
  'gha-deploy-ec2':          lazy(() => import('@/components/diagrams/GHADeployEC2Diagram')),
  'gha-deploy-ecs':          lazy(() => import('@/components/diagrams/GHADeployECSDiagram')),
  'gha-deploy-eks':          lazy(() => import('@/components/diagrams/GHADeployEKSDiagram')),
  // PostgreSQL Advanced
  'postgres-clustered-indexes': lazy(() => import('@/components/diagrams/PostgresClusteredIndexesDiagram')),
  'postgres-window-functions':  lazy(() => import('@/components/diagrams/PostgresWindowFunctionsDiagram')),
  'postgres-ctes-recursive':    lazy(() => import('@/components/diagrams/PostgresCTEsDiagram')),
  // OOP Pillars
  'oop-encapsulation':  lazy(() => import('@/components/diagrams/OOPEncapsulationDiagram')),
  'oop-abstraction':    lazy(() => import('@/components/diagrams/OOPAbstractionDiagram')),
  'oop-inheritance':    lazy(() => import('@/components/diagrams/OOPInheritanceDiagram')),
  'oop-polymorphism':   lazy(() => import('@/components/diagrams/OOPPolymorphismDiagram')),
  // SOLID Principles
  'solid-srp': lazy(() => import('@/components/diagrams/SOLIDSRPDiagram')),
  'solid-ocp': lazy(() => import('@/components/diagrams/SOLIDOCPDiagram')),
  'solid-lsp': lazy(() => import('@/components/diagrams/SOLIDLSPDiagram')),
  'solid-isp': lazy(() => import('@/components/diagrams/SOLIDISPDiagram')),
  'solid-dip': lazy(() => import('@/components/diagrams/SOLIDDIPDiagram')),
  // JavaScript
  'js-event-loop':  lazy(() => import('@/components/diagrams/JSEventLoopDiagram')),
  'js-closures':    lazy(() => import('@/components/diagrams/JSClosuresDiagram')),
  'js-async':       lazy(() => import('@/components/diagrams/JSAsyncDiagram')),
  'js-prototypes':  lazy(() => import('@/components/diagrams/JSPrototypeDiagram')),
  'js-this':        lazy(() => import('@/components/diagrams/JSThisDiagram')),
  // Node.js
  'node-event-loop': lazy(() => import('@/components/diagrams/NodeEventLoopDiagram')),
  'node-streams':    lazy(() => import('@/components/diagrams/NodeStreamsDiagram')),
  'node-cluster':    lazy(() => import('@/components/diagrams/NodeClusterDiagram')),
  'node-modules':    lazy(() => import('@/components/diagrams/NodeModulesDiagram')),
  'node-security':   lazy(() => import('@/components/diagrams/NodeSecurityDiagram')),
  // React.js
  'react-virtual-dom':  lazy(() => import('@/components/diagrams/ReactVirtualDOMDiagram')),
  'react-hooks':        lazy(() => import('@/components/diagrams/ReactHooksDiagram')),
  'react-state':        lazy(() => import('@/components/diagrams/ReactStateDiagram')),
  'react-performance':  lazy(() => import('@/components/diagrams/ReactPerformanceDiagram')),
  'react-patterns':     lazy(() => import('@/components/diagrams/ReactPatternsDiagram')),
  // Next.js
  'nextjs-rendering':      lazy(() => import('@/components/diagrams/NextJSRenderingDiagram')),
  'nextjs-app-router':     lazy(() => import('@/components/diagrams/NextJSAppRouterDiagram')),
  'nextjs-data-fetching':  lazy(() => import('@/components/diagrams/NextJSDataFetchingDiagram')),
  'nextjs-routing':        lazy(() => import('@/components/diagrams/NextJSRoutingDiagram')),
  'nextjs-optimization':   lazy(() => import('@/components/diagrams/NextJSOptimizationDiagram')),
  // NestJS
  'nestjs-architecture':       lazy(() => import('@/components/diagrams/NestJSArchitectureDiagram')),
  'nestjs-request-lifecycle':  lazy(() => import('@/components/diagrams/NestJSRequestLifecycleDiagram')),
  'nestjs-decorators':         lazy(() => import('@/components/diagrams/NestJSDecoratorsDiagram')),
  'nestjs-microservices':      lazy(() => import('@/components/diagrams/NestJSMicroservicesDiagram')),
  'nestjs-testing':            lazy(() => import('@/components/diagrams/NestJSTestingDiagram')),
  // FastAPI
  'fastapi-fundamentals':          lazy(() => import('@/components/diagrams/FastAPIFundamentalsDiagram')),
  'fastapi-dependency-injection':  lazy(() => import('@/components/diagrams/FastAPIDIDiagram')),
  'fastapi-pydantic':              lazy(() => import('@/components/diagrams/FastAPIPydanticDiagram')),
  'fastapi-async':                 lazy(() => import('@/components/diagrams/FastAPIAsyncDiagram')),
  'fastapi-auth':                  lazy(() => import('@/components/diagrams/FastAPIAuthDiagram')),
  // Python
  'py-gil':         lazy(() => import('@/components/diagrams/PythonGILDiagram')),
  'py-generators':  lazy(() => import('@/components/diagrams/PythonGeneratorsDiagram')),
  'py-decorators':  lazy(() => import('@/components/diagrams/PythonDecoratorsDiagram')),
  'py-async':       lazy(() => import('@/components/diagrams/PythonAsyncDiagram')),
  'py-data-model':  lazy(() => import('@/components/diagrams/PythonDataModelDiagram')),
  // Laravel
  'laravel-service-container': lazy(() => import('@/components/diagrams/LaravelServiceContainerDiagram')),
  'laravel-eloquent':          lazy(() => import('@/components/diagrams/LaravelEloquentDiagram')),
  'laravel-queues':            lazy(() => import('@/components/diagrams/LaravelQueuesDiagram')),
  'laravel-auth':              lazy(() => import('@/components/diagrams/LaravelAuthDiagram')),
  'laravel-middleware':        lazy(() => import('@/components/diagrams/LaravelMiddlewareDiagram')),
  // Data Modeling
  'schema-one-to-one':      lazy(() => import('@/components/diagrams/SchemaOneToOneDiagram')),
  'schema-one-to-many':     lazy(() => import('@/components/diagrams/SchemaOneToManyDiagram')),
  'schema-many-to-many':    lazy(() => import('@/components/diagrams/SchemaManyToManyDiagram')),
  'schema-normalization':   lazy(() => import('@/components/diagrams/SchemaNormalizationDiagram')),
  'schema-nosql-patterns':  lazy(() => import('@/components/diagrams/SchemaNoSQLPatternsDiagram')),
  'schema-whatsapp':        lazy(() => import('@/components/diagrams/SchemaWhatsAppDiagram')),
  'schema-ecommerce':       lazy(() => import('@/components/diagrams/SchemaEcommerceDiagram')),
  'schema-fintech':         lazy(() => import('@/components/diagrams/SchemaFintechDiagram')),
  'schema-erd':             lazy(() => import('@/components/diagrams/SchemaERDDiagram')),
  'schema-indexing':        lazy(() => import('@/components/diagrams/SchemaIndexingDiagram')),
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
