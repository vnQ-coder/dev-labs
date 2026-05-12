'use client';

import { useState, useRef, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { REALWORLD } from '@/lib/data/realworld';
import { RealWorldSystem } from '@/lib/types';

const RW_DIAGRAMS: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  netflix:                  lazy(() => import('./diagrams/realworld/NetflixDiagram')),
  uber:                     lazy(() => import('./diagrams/realworld/UberDiagram')),
  whatsapp:                 lazy(() => import('./diagrams/realworld/WhatsAppDiagram')),
  twitter:                  lazy(() => import('./diagrams/realworld/TwitterDiagram')),
  amazon:                   lazy(() => import('./diagrams/realworld/AmazonDiagram')),
  chatgpt:                  lazy(() => import('./diagrams/realworld/ChatGPTDiagram')),
  googledocs:               lazy(() => import('./diagrams/realworld/GoogleDocsDiagram')),
  youtube:                  lazy(() => import('./diagrams/realworld/YouTubeDiagram')),
  'aws-3tier':              lazy(() => import('./diagrams/realworld/Aws3TierDiagram')),
  'aws-serverless':         lazy(() => import('./diagrams/realworld/AwsServerlessDiagram')),
  'aws-multiregion':        lazy(() => import('./diagrams/realworld/AwsMultiRegionDiagram')),
  'ecommerce-order-service':lazy(() => import('./diagrams/realworld/EcommerceOrderDiagram')),
  'twitter-feed-cqrs':      lazy(() => import('./diagrams/realworld/TwitterFeedCqrsDiagram')),
  'notification-service':   lazy(() => import('./diagrams/realworld/NotificationDiagram')),
  'legacy-monolith-migration': lazy(() => import('./diagrams/realworld/LegacyMigrationDiagram')),
  // Streaming
  'jiohotstar':               lazy(() => import('./diagrams/realworld/JioHotstarDiagram')),
  'twitch':                   lazy(() => import('./diagrams/realworld/TwitchDiagram')),
  // Social
  'discord':                  lazy(() => import('./diagrams/realworld/DiscordDiagram')),
  'twitter-x':                lazy(() => import('./diagrams/realworld/TwitterXDiagram')),
  // Infrastructure
  'uber-dispatch':            lazy(() => import('./diagrams/realworld/UberDispatchDiagram')),
  'airbnb':                   lazy(() => import('./diagrams/realworld/AirbnbDiagram')),
  // Messaging
  'whatsapp-e2e':             lazy(() => import('./diagrams/realworld/WhatsAppE2EDiagram')),
  'slack':                    lazy(() => import('./diagrams/realworld/SlackDiagram')),
  // Search
  'google-search':            lazy(() => import('./diagrams/realworld/GoogleSearchDiagram')),
  // Payments (wired after diagram files land)
  'amazon-ecommerce':         lazy(() => import('./diagrams/realworld/AmazonEcommerceDiagram')),
  'stripe':                   lazy(() => import('./diagrams/realworld/StripeDiagram')),
  'robinhood':                lazy(() => import('./diagrams/realworld/RobinhoodDiagram')),
};

export default function RealWorldView() {
  const router = useRouter();
  const params = useSearchParams();
  const systemId = params.get('system');
  const system = systemId ? REALWORLD.find(s => s.id === systemId) : null;

  if (system) return <SystemDetail system={system} onBack={() => router.push('/lab?view=realworld')} />;
  return <SystemGrid />;
}

function SystemGrid() {
  const router = useRouter();
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--a)' }}>
          🌍 Real World Systems
        </h2>
        <p className="text-sm" style={{ color: 'var(--tm)' }}>
          Full system design breakdowns — requirements, scale, architecture, trade-offs, and interview prep
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REALWORLD.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/lab?view=realworld&system=${s.id}`)}
            className="text-left p-5 rounded-2xl transition-all hover:scale-[1.02] group"
            style={{ background: 'var(--s2)', border: `1px solid ${s.color}25` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <div className="font-bold text-base" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>
                  {s.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--tm)' }}>{s.focus}</div>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--t)' }}>{s.scale}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {['Requirements', 'Scale', 'Design', 'Interview'].map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-xs font-medium group-hover:underline" style={{ color: s.color }}>Open system design →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: 'problem', label: 'Problem' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'scale', label: 'Scale' },
  { id: 'design', label: 'Design' },
  { id: 'diagram', label: 'Diagram' },
  { id: 'deepdive', label: 'Deep Dive' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'interview', label: 'Interview' },
];

function SystemDetail({ system, onBack }: { system: RealWorldSystem; onBack: () => void }) {
  const [activeSection, setActiveSection] = useState('problem');
  const [openQA, setOpenQA] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  function scrollTo(id: string) {
    setActiveSection(id);
    const el = document.getElementById(`rw-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div
        className="flex items-center gap-4 px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--b0)', background: 'var(--bg)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ color: 'var(--tm)' }}
        >
          ← Back
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{system.icon}</span>
          <div className="min-w-0">
            <span className="font-bold text-sm" style={{ color: system.color, fontFamily: 'var(--font-display)' }}>
              {system.name}
            </span>
            <span className="text-sm ml-2" style={{ color: 'var(--tm)' }}>
              — {system.focus}
            </span>
          </div>
        </div>
      </div>

      {/* Mini nav */}
      <div
        className="flex items-center gap-1 px-6 py-2 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid var(--b0)', background: 'var(--s1)' }}
      >
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeSection === s.id ? system.color : 'transparent',
              color: activeSection === s.id ? 'var(--bg)' : 'var(--tm)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" ref={contentRef}>
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-10">

          {/* Hero */}
          <div
            className="rounded-2xl p-6"
            style={{ background: `${system.color}10`, border: `1px solid ${system.color}30` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-5xl">{system.icon}</span>
              <div>
                <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: system.color }}>
                  {system.name}
                </h1>
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--t)' }}>{system.focus}</div>
                <div className="text-xs" style={{ color: 'var(--tm)' }}>{system.scale}</div>
              </div>
            </div>
          </div>

          {/* Problem Statement */}
          <section id="rw-problem">
            <SectionHeader color={system.color} label="Problem Statement" />
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'var(--t)', fontFamily: 'var(--font-sans)' }}>
                {system.problem}
              </p>
            </div>
          </section>

          {/* Requirements */}
          <section id="rw-requirements">
            <SectionHeader color={system.color} label="Requirements" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: system.color }}>
                  Functional Requirements
                </div>
                <ul className="space-y-2">
                  {system.functionalReqs.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: `${system.color}20`, color: system.color }}>✓</span>
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--t)' }}>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: system.color }}>
                  Non-Functional Requirements
                </div>
                <ul className="space-y-3">
                  {system.nonFunctionalReqs.map((req, i) => (
                    <li key={i}>
                      <div className="text-xs font-semibold" style={{ color: 'var(--t)' }}>{req.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--tm)', fontFamily: 'var(--font-mono)' }}>{req.value}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Scale Estimation */}
          <section id="rw-scale">
            <SectionHeader color={system.color} label="Scale Estimation" />
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--b1)' }}>
              <div className="grid grid-cols-12 text-xs font-semibold px-4 py-2.5 uppercase tracking-wider" style={{ background: 'var(--s2)', color: 'var(--tm)', borderBottom: '1px solid var(--b1)' }}>
                <div className="col-span-4">Metric</div>
                <div className="col-span-4">Value</div>
                <div className="col-span-4">Notes</div>
              </div>
              {system.scaleEstimation.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 text-xs px-4 py-3"
                  style={{ background: i % 2 === 0 ? 'var(--s1)' : 'var(--s2)', borderBottom: i < system.scaleEstimation.length - 1 ? '1px solid var(--b0)' : 'none' }}
                >
                  <div className="col-span-4 font-medium" style={{ color: 'var(--t)' }}>{row.label}</div>
                  <div className="col-span-4 font-semibold" style={{ color: system.color, fontFamily: 'var(--font-mono)' }}>{row.value}</div>
                  <div className="col-span-4" style={{ color: 'var(--tm)' }}>{row.note}</div>
                </div>
              ))}
            </div>
          </section>

          {/* High-Level Design */}
          <section id="rw-design">
            <SectionHeader color={system.color} label="High-Level Design" />
            <div className="space-y-3">
              {system.highLevelDesign.map((step, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 flex gap-4"
                  style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
                >
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: `${system.color}20`, color: system.color, fontFamily: 'var(--font-display)' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-1" style={{ color: 'var(--t)', fontFamily: 'var(--font-display)' }}>
                      {step.title}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Architecture Diagram */}
          <section id="rw-diagram">
            <SectionHeader color={system.color} label="Architecture Diagram" />
            {RW_DIAGRAMS[system.id] ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${system.color}25` }}>
                <Suspense fallback={
                  <div className="flex items-center justify-center" style={{ height: 420, background: 'linear-gradient(135deg,#04080f 0%,#060d1c 100%)' }}>
                    <div className="text-2xl animate-pulse">⚡</div>
                  </div>
                }>
                  {(() => { const D = RW_DIAGRAMS[system.id]; return <D />; })()}
                </Suspense>
              </div>
            ) : (
              <div className="rounded-2xl flex items-center justify-center" style={{ height: 320, background: 'var(--s2)', border: '1px solid var(--b1)' }}>
                <span style={{ color: 'var(--tm)', fontSize: 13 }}>Diagram coming soon</span>
              </div>
            )}
          </section>

          {/* Deep Dive */}
          <section id="rw-deepdive">
            <SectionHeader color={system.color} label="Deep Dive" />
            <div className="space-y-4">
              {system.deepDive.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5"
                  style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
                >
                  <div className="text-sm font-bold mb-2" style={{ color: system.color, fontFamily: 'var(--font-display)' }}>
                    {item.title}
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--t)' }}>
                    {item.description}
                  </p>
                  {item.insight && (
                    <div
                      className="rounded-lg px-3 py-2 flex items-start gap-2"
                      style={{ background: `${system.color}12`, border: `1px solid ${system.color}25` }}
                    >
                      <span className="text-sm flex-shrink-0">💡</span>
                      <span className="text-xs leading-relaxed" style={{ color: system.color }}>
                        {item.insight}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Key Design Decisions */}
          <section id="rw-decisions">
            <SectionHeader color={system.color} label="Key Design Decisions" />
            <div className="space-y-4">
              {system.decisions.map((d, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5"
                  style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
                >
                  <div className="text-xs font-semibold mb-2" style={{ color: 'var(--tm)', fontFamily: 'var(--font-display)' }}>
                    ❓ {d.question}
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                    style={{ background: `${system.color}20`, color: system.color }}
                  >
                    <span>✓</span>
                    <span>{d.chosen}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t)' }}>
                    {d.reason}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Interview Q&A */}
          <section id="rw-interview">
            <SectionHeader color={system.color} label="Interview Q&A" />
            <div className="space-y-2">
              {system.interview.map((qa, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--b1)' }}
                >
                  <button
                    className="w-full flex items-start gap-3 p-4 text-left transition-colors"
                    style={{ background: openQA === i ? `${system.color}10` : 'var(--s2)' }}
                    onClick={() => setOpenQA(openQA === i ? null : i)}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: `${system.color}20`, color: system.color }}
                    >
                      Q
                    </span>
                    <span className="flex-1 text-sm font-medium text-left" style={{ color: 'var(--t)', fontFamily: 'var(--font-display)' }}>
                      {qa.q}
                    </span>
                    <span className="flex-shrink-0 text-xs mt-0.5" style={{ color: 'var(--tm)' }}>
                      {openQA === i ? '▲' : '▼'}
                    </span>
                  </button>
                  {openQA === i && (
                    <div
                      className="px-4 pb-4 pt-2"
                      style={{ background: `${system.color}08`, borderTop: `1px solid ${system.color}20` }}
                    >
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--t)', fontFamily: 'var(--font-sans)' }}>
                        {qa.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Key Insight */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(249,115,22,0.05))', border: '1px solid rgba(251,191,36,0.3)' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔑</span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--a)' }}>
                  Key Insight
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>{system.keyInsight}</p>
              </div>
            </div>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-px flex-1" style={{ background: 'var(--b1)' }} />
      <span
        className="text-xs font-bold uppercase tracking-widest px-3"
        style={{ color, fontFamily: 'var(--font-display)' }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'var(--b1)' }} />
    </div>
  );
}
