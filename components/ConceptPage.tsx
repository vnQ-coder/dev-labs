'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { CONCEPTS } from '@/lib/data/concepts';
import { useProgress } from '@/hooks/useProgress';
import type { Concept, FailureMode } from '@/lib/types';

const ConceptDiagram = dynamic(() => import('./ConceptDiagram'), { ssr: false });

/* ── helpers ────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'overview',   label: 'Overview'     },
  { id: 'analogy',    label: 'Analogy'      },
  { id: 'how',        label: 'How It Works' },
  { id: 'components', label: 'Components'   },
  { id: 'diagram',    label: 'Diagram'      },
  { id: 'decide',     label: 'Decision'     },
  { id: 'failures',   label: 'Failures'     },
  { id: 'code',       label: 'Code'         },
  { id: 'interview',  label: 'Interview'    },
];

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      className="section-label mb-4"
      style={{ color }}
    >
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--s2)', border: '1px solid var(--b1)', ...style }}
    >
      {children}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: FailureMode['severity'] }) {
  const map = {
    critical: 'badge-critical',
    high:     'badge-high',
    medium:   'badge-medium',
  };
  return (
    <span
      className={`${map[severity]} text-xs font-semibold px-2.5 py-0.5 rounded-full`}
      style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

/* ── Mini-nav ────────────────────────────────────────────────────── */

function MiniNav({ active, color }: { active: string; color: string }) {
  const visibleSections = SECTIONS;

  function scrollTo(id: string) {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="concept-mini-nav px-4 py-2 overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max">
        {visibleSections.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-display)',
              background: active === s.id ? `${color}20` : 'transparent',
              color: active === s.id ? color : 'var(--tm)',
              border: active === s.id ? `1px solid ${color}35` : '1px solid transparent',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── Section: Overview ───────────────────────────────────────────── */

function OverviewSection({ concept }: { concept: Concept }) {
  return (
    <section id="section-overview" className="mb-10">
      <SectionLabel color={concept.color}>Overview</SectionLabel>
      <Card>
        {concept.overview ? (
          <p className="text-base leading-relaxed" style={{ color: 'var(--t)', fontFamily: 'var(--font-sans)' }}>
            {concept.overview}
          </p>
        ) : (
          <p className="text-base leading-relaxed" style={{ color: 'var(--t)', fontFamily: 'var(--font-sans)' }}>
            {concept.te.def}
          </p>
        )}
        {/* Type pills */}
        {concept.te.types.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5 pt-5" style={{ borderTop: '1px solid var(--b1)' }}>
            {concept.te.types.map(t => (
              <div
                key={t.n}
                className="px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--s3)', border: '1px solid var(--b1)' }}
              >
                <span className="font-semibold" style={{ color: concept.color, fontFamily: 'var(--font-display)' }}>{t.n}</span>
                <span className="block mt-0.5" style={{ color: 'var(--tm)' }}>{t.d}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

/* ── Section: Analogy ────────────────────────────────────────────── */

function AnalogySection({ concept }: { concept: Concept }) {
  return (
    <section id="section-analogy" className="mb-10">
      <SectionLabel color={concept.color}>The Analogy</SectionLabel>
      <Card>
        <div className="flex items-start gap-4">
          <div
            className="text-3xl flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${concept.color}18`, border: `1px solid ${concept.color}30` }}
          >
            {concept.a.v}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold mb-3"
              style={{ color: 'var(--t)', fontFamily: 'var(--font-display)' }}
            >
              {concept.a.t}
            </h3>
            {concept.a.tx.split('\n\n').map((para, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed mb-3"
                style={{ color: 'var(--tm)' }}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
        {/* Key insight */}
        <div
          className="mt-5 rounded-xl p-4 flex gap-3"
          style={{ background: `${concept.color}10`, border: `1px solid ${concept.color}25` }}
        >
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>
            <span className="font-semibold" style={{ color: concept.color }}>Key insight: </span>
            {concept.a.s}
          </p>
        </div>
      </Card>
    </section>
  );
}

/* ── Section: How It Works ───────────────────────────────────────── */

function HowItWorksSection({ concept }: { concept: Concept }) {
  return (
    <section id="section-how" className="mb-10">
      <SectionLabel color={concept.color}>How It Works</SectionLabel>
      <Card>
        {concept.howItWorks ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>
            {concept.howItWorks}
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--tm)' }}>
              {concept.te.when}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>
              {concept.te.trade}
            </p>
          </>
        )}
      </Card>
    </section>
  );
}

/* ── Section: Components ─────────────────────────────────────────── */

function ComponentsSection({ concept }: { concept: Concept }) {
  const items = concept.components;
  if (!items || items.length === 0) return null;

  return (
    <section id="section-components" className="mb-10">
      <SectionLabel color={concept.color}>Components</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(comp => (
          <div
            key={comp.name}
            className="rounded-xl p-4"
            style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xl">{comp.icon}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--t)', fontFamily: 'var(--font-display)' }}
              >
                {comp.name}
              </span>
            </div>
            <p
              className="text-xs font-medium mb-1"
              style={{ color: concept.color }}
            >
              {comp.role}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>
              {comp.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Section: Architecture Diagram ──────────────────────────────── */

function DiagramSection({ concept }: { concept: Concept }) {
  return (
    <section id="section-diagram" className="mb-10">
      <SectionLabel color={concept.color}>Architecture Diagram</SectionLabel>
      <ConceptDiagram conceptId={concept.id} color={concept.color} />
    </section>
  );
}

/* ── Section: Decision Guide ─────────────────────────────────────── */

function DecisionSection({ concept }: { concept: Concept }) {
  const d = concept.decision;
  if (!d) return null;

  return (
    <section id="section-decide" className="mb-10">
      <SectionLabel color={concept.color}>Decision Guide</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Choose when */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.20)' }}
        >
          <div
            className="section-label mb-3"
            style={{ color: 'var(--g)' }}
          >
            ✅ Choose when
          </div>
          <ul className="space-y-2">
            {d.choose.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--t)' }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--g)' }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Avoid when */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.20)' }}
        >
          <div
            className="section-label mb-3"
            style={{ color: 'var(--r)' }}
          >
            ❌ Avoid when
          </div>
          <ul className="space-y-2">
            {d.avoid.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--t)' }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--r)' }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* vs. table */}
      {d.vs && d.vs.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--b1)' }}
        >
          <div
            className="px-4 py-2.5"
            style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b1)' }}
          >
            <span className="section-label" style={{ color: 'var(--tm)' }}>vs. Alternatives</span>
          </div>
          {d.vs.map((alt, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-start gap-3"
              style={{
                background: i % 2 === 0 ? 'var(--s2)' : 'var(--s1)',
                borderTop: i > 0 ? '1px solid var(--b0)' : undefined,
              }}
            >
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: concept.color, fontFamily: 'var(--font-display)', minWidth: 100 }}
              >
                vs. {alt.name}
              </span>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>
                {alt.when}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Section: Failure Modes ──────────────────────────────────────── */

function FailuresSection({ concept }: { concept: Concept }) {
  const failures = concept.failures;
  if (!failures || failures.length === 0) return null;

  return (
    <section id="section-failures" className="mb-10">
      <SectionLabel color={concept.color}>Failure Modes & Fixes</SectionLabel>
      <div className="space-y-3">
        {failures.map(f => (
          <div
            key={f.name}
            className="rounded-xl p-5"
            style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--t)', fontFamily: 'var(--font-display)' }}
              >
                {f.name}
              </span>
              <SeverityBadge severity={f.severity} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="section-label mb-1" style={{ color: 'var(--a)' }}>Cause</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{f.cause}</p>
              </div>
              <div>
                <div className="section-label mb-1" style={{ color: 'var(--r)' }}>Symptom</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{f.symptom}</p>
              </div>
              <div>
                <div className="section-label mb-1" style={{ color: 'var(--g)' }}>Fix</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{f.fix}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Section: Code + Case Study ──────────────────────────────────── */

function CodeSection({ concept }: { concept: Concept }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (concept.te.code) {
      navigator.clipboard.writeText(concept.te.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section id="section-code" className="mb-10">
      <SectionLabel color={concept.color}>Code Example & Case Study</SectionLabel>
      <div className="space-y-3">
        {/* Code block */}
        {concept.te.code && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--b1)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'var(--s3)', borderBottom: '1px solid var(--b1)' }}
            >
              <span className="section-label" style={{ color: 'var(--tm)' }}>
                {concept.title}
              </span>
              <button
                onClick={copy}
                className="text-xs transition-colors px-2 py-1 rounded"
                style={{
                  color: copied ? 'var(--g)' : 'var(--tm)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre
              className="p-5 text-xs leading-relaxed overflow-x-auto"
              style={{
                background: 'var(--s2)',
                color: 'var(--t)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <code>{concept.te.code}</code>
            </pre>
          </div>
        )}
        {/* Real-world examples */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
        >
          <div className="section-label mb-3" style={{ color: concept.color }}>
            Real-World Case Study
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {concept.te.rw.ex.map(ex => (
              <span
                key={ex}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: `${concept.color}15`,
                  color: concept.color,
                  border: `1px solid ${concept.color}30`,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                }}
              >
                {ex}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>
            {concept.te.rw.cs}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Section: Interview ──────────────────────────────────────────── */

function InterviewSection({ concept }: { concept: Concept }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <section id="section-interview" className="mb-10">
      <SectionLabel color={concept.color}>Interview Prep</SectionLabel>
      <div className="space-y-3">
        {/* Question */}
        <Card>
          <div className="section-label mb-2" style={{ color: 'var(--a)' }}>
            Common Question
          </div>
          <p
            className="text-sm font-semibold leading-relaxed mb-4"
            style={{ color: 'var(--t)', fontFamily: 'var(--font-display)' }}
          >
            {concept.interview.q}
          </p>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: `${concept.color}18`,
                border: `1px solid ${concept.color}35`,
                color: concept.color,
                fontFamily: 'var(--font-display)',
              }}
            >
              Show Model Answer →
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div
                  className="rounded-xl p-4 mb-4 text-sm leading-relaxed"
                  style={{
                    background: `${concept.color}0d`,
                    border: `1px solid ${concept.color}25`,
                    color: 'var(--t)',
                  }}
                  dangerouslySetInnerHTML={{ __html: concept.interview.a }}
                />
                <button
                  onClick={() => setShowAnswer(false)}
                  className="text-xs"
                  style={{ color: 'var(--tm)' }}
                >
                  Hide answer
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </Card>

        {/* Follow-ups */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
        >
          <div className="section-label mb-3" style={{ color: 'var(--tm)' }}>
            Follow-up Questions
          </div>
          <ul className="space-y-2.5">
            {concept.interview.fu.map((q, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-sm"
                style={{ color: 'var(--tm)' }}
              >
                <span className="flex-shrink-0" style={{ color: concept.color }}>→</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Header ──────────────────────────────────────────────────────── */

function ConceptHeader({ concept }: { concept: Concept }) {
  const idx = CONCEPTS.findIndex(c => c.id === concept.id);
  const prev = idx > 0 ? CONCEPTS[idx - 1] : null;
  const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null;

  return (
    <div
      className="px-6 py-4 flex items-center gap-4"
      style={{ borderBottom: '1px solid var(--b1)' }}
    >
      {/* Icon + title */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${concept.color}20`, border: `1px solid ${concept.color}40` }}
      >
        {concept.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h1
          className="text-lg font-bold leading-tight truncate"
          style={{ color: 'var(--t)', fontFamily: 'var(--font-display)' }}
        >
          {concept.title}
        </h1>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--tm)' }}>
          {concept.tag}
        </p>
      </div>
      {/* Prev / Next */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {prev && (
          <Link
            href={`/lab?concept=${prev.id}`}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--b1)',
              color: 'var(--tm)',
              fontFamily: 'var(--font-display)',
            }}
            title={prev.title}
          >
            ←
          </Link>
        )}
        {next && (
          <Link
            href={`/lab?concept=${next.id}`}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--b1)',
              color: 'var(--tm)',
              fontFamily: 'var(--font-display)',
            }}
            title={next.title}
          >
            →
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Main ConceptPage ────────────────────────────────────────────── */

export default function ConceptPage({ concept }: { concept: Concept }) {
  const [activeSection, setActiveSection] = useState('overview');
  const containerRef = useRef<HTMLDivElement>(null);
  const { markViewed } = useProgress();

  useEffect(() => {
    markViewed(concept.id);
  }, [concept.id, markViewed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActiveSection(id);
          }
        }
      },
      { root: container, rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    SECTIONS.forEach(s => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [concept.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ConceptHeader concept={concept} />

      {/* Mini-nav */}
      <MiniNav active={activeSection} color={concept.color} />

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ background: 'var(--bg)' }}
      >
        <motion.div
          key={concept.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto px-4 md:px-6 py-8"
        >
          <OverviewSection   concept={concept} />
          <AnalogySection    concept={concept} />
          <HowItWorksSection concept={concept} />
          <ComponentsSection concept={concept} />
          <DiagramSection    concept={concept} />
          <DecisionSection   concept={concept} />
          <FailuresSection   concept={concept} />
          <CodeSection       concept={concept} />
          <InterviewSection  concept={concept} />
        </motion.div>
      </div>
    </div>
  );
}
