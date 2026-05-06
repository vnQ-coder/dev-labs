'use client';
import { LearningPath } from '@/lib/profile';
import { ConceptRow } from '@/components/ConceptRow';

// Concept ID → title/category map
const CONCEPT_INFO: Record<string, { title: string; cat: string }> = {
  monolith: { title: 'Monolith vs Microservices', cat: 'foundation' },
  apigateway: { title: 'API Gateway', cat: 'foundation' },
  loadbalancer: { title: 'Load Balancer', cat: 'performance' },
  caching: { title: 'Caching', cat: 'performance' },
  cdn: { title: 'CDN', cat: 'performance' },
  databases: { title: 'Databases', cat: 'data' },
  sharding: { title: 'Database Sharding', cat: 'data' },
  messagequeue: { title: 'Message Queue', cat: 'async' },
  ratelimit: { title: 'Rate Limiting', cat: 'reliability' },
  cap: { title: 'CAP Theorem', cat: 'reliability' },
  circuit: { title: 'Circuit Breaker', cat: 'reliability' },
  kafka: { title: 'Apache Kafka', cat: 'messaging' },
  rabbitmq: { title: 'RabbitMQ', cat: 'messaging' },
  bullmq: { title: 'BullMQ', cat: 'messaging' },
  queuepatterns: { title: 'Queue Patterns', cat: 'messaging' },
  vpc: { title: 'VPC', cat: 'cloud' },
  subnets: { title: 'Subnets', cat: 'cloud' },
  'security-groups': { title: 'Security Groups', cat: 'cloud' },
  'nat-gateway': { title: 'NAT Gateway', cat: 'cloud' },
  'ports-protocols': { title: 'Ports & Protocols', cat: 'cloud' },
  dns: { title: 'AWS DNS', cat: 'cloud' },
  route53: { title: 'Route 53', cat: 'cloud' },
  cloudflare: { title: 'Cloudflare', cat: 'cloud' },
  cloudfront: { title: 'CloudFront', cat: 'cloud' },
  ec2: { title: 'EC2 & Auto Scaling', cat: 'cloud' },
  lambda: { title: 'AWS Lambda', cat: 'cloud' },
  containers: { title: 'Containers: ECS & EKS', cat: 'cloud' },
  s3: { title: 'Amazon S3', cat: 'cloud' },
  rds: { title: 'Amazon RDS', cat: 'cloud' },
  iam: { title: 'AWS IAM', cat: 'cloud' },
  kubernetes: { title: 'Kubernetes', cat: 'cloud' },
  docker: { title: 'Docker & Containers', cat: 'cloud' },
  ecs: { title: 'Amazon ECS', cat: 'cloud' },
  eks: { title: 'Amazon EKS', cat: 'cloud' },
  ecr: { title: 'Amazon ECR', cat: 'cloud' },
  'url-journey': { title: 'URL Journey', cat: 'networking' },
  'dns-explained': { title: 'DNS Explained', cat: 'networking' },
  'osi-tcp': { title: 'OSI & TCP/IP', cat: 'networking' },
  'https-tls': { title: 'HTTPS & TLS', cat: 'networking' },
  'reverse-proxy': { title: 'Reverse Proxy', cat: 'networking' },
  'cdn-explained': { title: 'CDN Explained', cat: 'networking' },
  'debug-network': { title: 'Debugging Networks', cat: 'networking' },
  'osi-layers': { title: 'OSI Layers Deep Dive', cat: 'networking' },
  'network-protocols': { title: 'Network Protocols', cat: 'networking' },
};

interface PathPanelProps {
  path: LearningPath;
  completedIds: Set<string>;
  nextConceptId: string | null;
  completedCount: number;
  onConceptClick: (conceptId: string) => void;
}

export function PathPanel({ path, completedIds, nextConceptId, completedCount, onConceptClick }: PathPanelProps) {
  const totalConcepts = path.totalConcepts;
  const hoursRemaining = totalConcepts - completedCount;
  const progressPct = totalConcepts > 0 ? (completedCount / totalConcepts) * 100 : 0;

  const generatedDate = new Date(path.generatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  function getStatus(conceptId: string, isSkillGap: boolean): 'done' | 'active' | 'locked' | 'gap' {
    if (completedIds.has(conceptId)) return 'done';
    if (conceptId === nextConceptId) return 'active';
    if (isSkillGap) return 'gap';
    return 'locked';
  }

  return (
    <div style={{
      width: 380, flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto',
      padding: '24px 20px',
      background: 'var(--bg, #09090b)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
          <span style={{ fontSize: '0.65rem', color: '#6366f1', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Personalised for you
          </span>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.02em' }}>
          {path.targetRole} Path
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>
          Axiom-curated · {generatedDate}
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 4, height: 5, margin: '12px 0 4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
          {completedCount} of {totalConcepts} concepts complete · ~{hoursRemaining}h remaining
        </div>
      </div>

      {/* Phases */}
      {path.phases.map((phase, phaseIdx) => (
        <div key={phaseIdx} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: phase.color, marginBottom: 8,
          }}>
            {phase.label}
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {phase.concepts.map((concept, cIdx) => {
            const info = CONCEPT_INFO[concept.conceptId] ?? { title: concept.conceptId, cat: 'concept' };
            const status = getStatus(concept.conceptId, concept.isSkillGap);
            const isLast = cIdx === phase.concepts.length - 1;
            return (
              <ConceptRow
                key={concept.conceptId}
                concept={concept}
                conceptTitle={info.title}
                conceptCat={info.cat}
                status={status}
                onClick={() => onConceptClick(concept.conceptId)}
                showConnector={!isLast}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
