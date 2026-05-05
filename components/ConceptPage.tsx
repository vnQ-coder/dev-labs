'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Lightbulb, CheckCircle2, XCircle,
  Copy, Check, ChevronDown, ChevronUp, AlertTriangle, ArrowRight,
  Code2, Zap,
} from 'lucide-react';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import { useProgress } from '@/hooks/useProgress';
import ConceptIcon from './icons/ConceptIcon';
import type { Concept, FailureMode } from '@/lib/types';

const ConceptDiagram = dynamic(() => import('./ConceptDiagram'), { ssr: false });

function getCatColor(cat: string): string {
  return CATEGORIES.find(c => c.id === cat)?.color ?? 'var(--accent)';
}

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
    <div className="section-label mb-3" style={{ color }}>
      {children}
    </div>
  );
}

/* ── Mini-nav ── */

function MiniNav({ active, color }: { active: string; color: string }) {
  function scrollTo(id: string) {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <nav
      className="concept-mini-nav px-4 py-0 overflow-x-auto"
      style={{ scrollbarWidth: 'none' } as React.CSSProperties}
    >
      <div className="flex items-center min-w-max">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              color: active === s.id ? color : 'var(--tm)',
              borderBottom: active === s.id ? `2px solid ${color}` : '2px solid transparent',
              background: 'transparent',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── Overview ── */

function OverviewSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const catLabel = CATEGORIES.find(c => c.id === concept.cat)?.label ?? concept.cat;

  return (
    <section id="section-overview" className="mb-10">
      {/* TL;DR hero */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          background: `linear-gradient(135deg, ${color}0d 0%, var(--s1) 55%)`,
          border: `1px solid ${color}22`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={13} strokeWidth={2.5} color={color} />
          <span className="section-label" style={{ color }}>TL;DR</span>
        </div>
        <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--t)', lineHeight: 1.75 }}>
          {concept.overview ?? concept.te.def}
        </p>
        {/* Quick-fact chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${color}15` }}>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}
          >
            {catLabel}
          </span>
          {concept.te.types.length > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'var(--s2)', color: 'var(--tm)', border: '1px solid var(--b0)' }}
            >
              {concept.te.types.length} patterns
            </span>
          )}
          {concept.failures && concept.failures.length > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(201,112,112,0.08)', color: '#c97070', border: '1px solid rgba(201,112,112,0.20)' }}
            >
              {concept.failures.length} failure modes
            </span>
          )}
        </div>
      </div>

      {/* Patterns / types */}
      {concept.te.types.length > 0 && (
        <>
          <SectionLabel color={color}>Patterns & Variants</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {concept.te.types.map(t => (
              <div
                key={t.n}
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}
              >
                <div className="text-xs font-bold mb-1" style={{ color }}>{t.n}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.65 }}>{t.d}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ── Analogy ── */

function AnalogySection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  return (
    <section id="section-analogy" className="mb-10">
      <SectionLabel color={color}>The Mental Model</SectionLabel>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${color}20` }}
      >
        {/* Header strip */}
        <div
          className="px-5 py-3 flex items-center gap-3"
          style={{ background: `${color}0c`, borderBottom: `1px solid ${color}18` }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: `${color}18`, border: `1px solid ${color}28` }}
          >
            <ConceptIcon conceptId={concept.id} size={18} color={color} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--t)' }}>{concept.a.t}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--td)' }}>Analogy</div>
          </div>
        </div>

        {/* Body paragraphs */}
        <div className="px-5 py-4 space-y-3" style={{ background: 'var(--s1)' }}>
          {concept.a.tx.split('\n\n').map((para: string, i: number) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.75 }}>
              {para}
            </p>
          ))}
        </div>

        {/* Key insight footer */}
        <div
          className="px-5 py-4 flex gap-3"
          style={{ background: `${color}06`, borderTop: `1px solid ${color}18` }}
        >
          <Lightbulb size={15} strokeWidth={2} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color }}>Key Insight</div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--t)', lineHeight: 1.7 }}>
              {concept.a.s}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works — numbered step timeline ── */

function HowItWorksSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const text = concept.howItWorks ?? `${concept.te.when}\n\n${concept.te.trade}`;

  // Split on double-newline first; fall back to splitting on sentence boundaries
  let steps = text.split('\n\n').filter(s => s.trim().length > 10);
  if (steps.length <= 1) {
    steps = text.match(/[^.!?]+[.!?]+/g)?.reduce<string[]>((acc, sentence) => {
      const last = acc[acc.length - 1];
      if (!last || last.length > 180) { acc.push(sentence.trim()); }
      else { acc[acc.length - 1] = last + ' ' + sentence.trim(); }
      return acc;
    }, []) ?? [text];
  }

  return (
    <section id="section-how" className="mb-10">
      <SectionLabel color={color}>How It Works</SectionLabel>
      <div>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4">
            {/* Step indicator + connector */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ paddingTop: 2 }}>
              <div
                className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  width: 26, height: 26,
                  background: `${color}12`,
                  border: `1.5px solid ${color}30`,
                  color,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 mt-1" style={{ background: `${color}18`, minHeight: 12 }} />
              )}
            </div>
            {/* Text */}
            <div className="pb-5 flex-1 min-w-0 pt-0.5">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.75 }}>
                {step.trim()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Components ── */

function ComponentsSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const items = concept.components;
  if (!items || items.length === 0) return null;
  return (
    <section id="section-components" className="mb-10">
      <SectionLabel color={color}>Key Components</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((comp, i) => (
          <motion.div
            key={comp.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className="rounded-xl p-4"
            style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 26, height: 26, background: `${color}10`, border: `1px solid ${color}20` }}
              >
                <ConceptIcon conceptId={concept.id} size={12} color={color} />
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--t)' }}>{comp.name}</span>
            </div>
            <div className="text-xs font-semibold mb-1.5" style={{ color }}>{comp.role}</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.65 }}>{comp.detail}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Diagram ── */

function DiagramSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  return (
    <section id="section-diagram" className="mb-10">
      <SectionLabel color={color}>Architecture Diagram</SectionLabel>
      <ConceptDiagram conceptId={concept.id} color={color} />
    </section>
  );
}

/* ── Decision ── */

function DecisionSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const d = concept.decision;
  if (!d) return null;
  return (
    <section id="section-decide" className="mb-10">
      <SectionLabel color={color}>Decision Guide</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(77,184,150,0.06)', border: '1px solid rgba(77,184,150,0.20)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={13} strokeWidth={2} color="#4db896" />
            <span className="section-label" style={{ color: '#4db896' }}>Choose when</span>
          </div>
          <ul className="space-y-2">
            {d.choose.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--t)' }}>
                <span style={{ color: '#4db896', flexShrink: 0 }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(201,112,112,0.06)', border: '1px solid rgba(201,112,112,0.20)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={13} strokeWidth={2} color="#c97070" />
            <span className="section-label" style={{ color: '#c97070' }}>Avoid when</span>
          </div>
          <ul className="space-y-2">
            {d.avoid.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: 'var(--t)' }}>
                <span style={{ color: '#c97070', flexShrink: 0 }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {d.vs && d.vs.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--b0)' }}>
          <div className="px-4 py-2.5" style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b0)' }}>
            <span className="section-label" style={{ color: 'var(--tm)' }}>vs. Alternatives</span>
          </div>
          {d.vs.map((alt, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-start gap-3"
              style={{
                background: i % 2 === 0 ? 'var(--s1)' : 'var(--s2)',
                borderTop: i > 0 ? '1px solid var(--b0)' : undefined,
              }}
            >
              <span className="text-xs font-semibold flex-shrink-0" style={{ color, minWidth: 100 }}>
                vs. {alt.name}
              </span>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{alt.when}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Failures — accordion ── */

const SEV_CONFIG = {
  critical: { bg: 'rgba(201,112,112,0.08)', border: 'rgba(201,112,112,0.28)', color: '#c97070', label: 'CRITICAL' },
  high:     { bg: 'rgba(201,164,76,0.08)',  border: 'rgba(201,164,76,0.28)',  color: '#c9a84c', label: 'HIGH'     },
  medium:   { bg: 'rgba(91,163,201,0.08)',  border: 'rgba(91,163,201,0.28)', color: '#5ba3c9', label: 'MEDIUM'   },
};

function FailureCard({
  f, isOpen, onToggle,
}: { f: FailureMode; isOpen: boolean; onToggle: () => void }) {
  const sev = SEV_CONFIG[f.severity] ?? SEV_CONFIG.medium;
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: `1px solid ${isOpen ? sev.border : 'var(--b0)'}` }}
    >
      {/* Row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: isOpen ? sev.bg : 'var(--s1)' }}
      >
        <AlertTriangle size={14} strokeWidth={2} color={sev.color} style={{ flexShrink: 0 }} />
        <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--t)' }}>{f.name}</span>
        <span
          className="section-label px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
        >
          {sev.label}
        </span>
        <span style={{ color: 'var(--td)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
        </span>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3"
              style={{ background: 'var(--s2)', borderTop: '1px solid var(--b0)' }}
            >
              <div className="rounded-lg p-3" style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
                <div className="section-label mb-1.5" style={{ color: 'var(--accent)' }}>Cause</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.65 }}>{f.cause}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
                <div className="section-label mb-1.5" style={{ color: '#c97070' }}>Symptom</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.65 }}>{f.symptom}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(77,184,150,0.06)', border: '1px solid rgba(77,184,150,0.20)' }}>
                <div className="section-label mb-1.5" style={{ color: '#4db896' }}>Fix</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.65 }}>{f.fix}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FailuresSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const failures = concept.failures;
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!failures || failures.length === 0) return null;
  return (
    <section id="section-failures" className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel color={color}>Failure Modes</SectionLabel>
        <span className="text-xs mb-3" style={{ color: 'var(--td)' }}>tap to expand</span>
      </div>
      <div className="space-y-2">
        {failures.map((f, i) => (
          <FailureCard
            key={f.name}
            f={f}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Code ── */

function CodeSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
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
      <SectionLabel color={color}>Code & Case Study</SectionLabel>
      <div className="space-y-3">
        {concept.te.code && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--b0)' }}>
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b0)' }}
            >
              <div className="flex items-center gap-2">
                <Code2 size={13} strokeWidth={2} style={{ color: 'var(--tm)' }} />
                <span className="section-label" style={{ color: 'var(--tm)' }}>{concept.title}</span>
              </div>
              <button
                onClick={copy}
                className="flex items-center justify-center rounded-md transition-colors"
                style={{ width: 28, height: 28, color: copied ? '#4db896' : 'var(--tm)', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                title={copied ? 'Copied!' : 'Copy code'}
                aria-label={copied ? 'Copied!' : 'Copy code'}
              >
                {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
              </button>
            </div>
            <pre
              className="p-4 text-xs leading-relaxed overflow-x-auto"
              style={{ background: 'var(--s1)', color: 'var(--t)', fontFamily: 'var(--font-mono)' }}
            >
              <code>{concept.te.code}</code>
            </pre>
          </div>
        )}
        <div className="rounded-xl p-4" style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
          <div className="section-label mb-3" style={{ color }}>Real-World Case Study</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {concept.te.rw.ex.map(ex => (
              <span
                key={ex}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}
              >
                {ex}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>{concept.te.rw.cs}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Interview ── */

function InterviewSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <section id="section-interview" className="mb-10">
      <SectionLabel color={color}>Interview Prep</SectionLabel>
      <div className="space-y-3">
        <div className="rounded-xl p-5" style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
          <div className="section-label mb-2" style={{ color: 'var(--accent)' }}>Common Question</div>
          <p className="text-sm font-semibold leading-relaxed mb-4" style={{ color: 'var(--t)' }}>
            {concept.interview.q}
          </p>
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: `${color}10`, border: `1px solid ${color}30`, color }}
            >
              Show Model Answer
              <ChevronDown size={13} strokeWidth={2.5} />
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div
                  className="rounded-xl p-4 mb-3 text-sm leading-relaxed"
                  style={{ background: `${color}08`, border: `1px solid ${color}20`, color: 'var(--t)' }}
                  dangerouslySetInnerHTML={{ __html: concept.interview.a }}
                />
                <button
                  onClick={() => setShowAnswer(false)}
                  className="text-xs"
                  style={{ color: 'var(--td)' }}
                >
                  Hide answer
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}>
          <div className="section-label mb-3" style={{ color: 'var(--tm)' }}>Follow-up Questions</div>
          <ul className="space-y-2.5">
            {concept.interview.fu.map((q, i) => (
              <li key={i} className="flex gap-2.5 text-sm" style={{ color: 'var(--tm)' }}>
                <span style={{ color, flexShrink: 0 }}>→</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Continue Learning ── */

function ContinueLearning({ concept }: { concept: Concept }) {
  const idx = CONCEPTS.findIndex(c => c.id === concept.id);
  const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : CONCEPTS[0];
  const nextColor = getCatColor(next.cat);
  const nextCatLabel = CATEGORIES.find(c => c.id === next.cat)?.label;

  return (
    <section className="mb-2">
      <div className="section-label mb-3" style={{ color: 'var(--td)' }}>Continue Learning</div>
      <Link
        href={`/lab?concept=${next.id}`}
        className="block rounded-2xl p-4 transition-all"
        style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = `${nextColor}40`)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--b0)')}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, background: `${nextColor}12`, border: `1px solid ${nextColor}25` }}
          >
            <ConceptIcon conceptId={next.id} size={20} color={nextColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs mb-0.5" style={{ color: 'var(--td)' }}>Next up</div>
            <div className="text-sm font-bold truncate" style={{ color: 'var(--t)' }}>{next.title}</div>
            {nextCatLabel && (
              <div className="text-xs mt-0.5" style={{ color: nextColor }}>{nextCatLabel}</div>
            )}
          </div>
          <ArrowRight size={16} strokeWidth={2} style={{ color: 'var(--td)', flexShrink: 0 }} />
        </div>
      </Link>
    </section>
  );
}

/* ── Header ── */

function ConceptHeader({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const catLabel = CATEGORIES.find(c => c.id === concept.cat)?.label;
  const idx = CONCEPTS.findIndex(c => c.id === concept.id);
  const prev = idx > 0 ? CONCEPTS[idx - 1] : null;
  const next = idx < CONCEPTS.length - 1 ? CONCEPTS[idx + 1] : null;

  return (
    <div
      className="px-4 md:px-6 py-3 flex items-center gap-3"
      style={{ borderBottom: '1px solid var(--b0)' }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 36, height: 36, background: `${color}12`, border: `1px solid ${color}30` }}
      >
        <ConceptIcon conceptId={concept.id} size={18} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--t)' }}>
            {concept.title}
          </h1>
          {catLabel && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex"
              style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}
            >
              {catLabel}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--td)' }}>{concept.tag}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {prev && (
          <Link
            href={`/lab?concept=${prev.id}`}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 30, height: 30, color: 'var(--tm)', border: '1px solid var(--b0)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={prev.title}
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </Link>
        )}
        {next && (
          <Link
            href={`/lab?concept=${next.id}`}
            className="flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 30, height: 30, color: 'var(--tm)', border: '1px solid var(--b0)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={next.title}
          >
            <ChevronRight size={15} strokeWidth={2} />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */

export default function ConceptPage({ concept }: { concept: Concept }) {
  const [activeSection, setActiveSection] = useState('overview');
  const containerRef = useRef<HTMLDivElement>(null);
  const { markViewed } = useProgress();

  useEffect(() => { markViewed(concept.id); }, [concept.id, markViewed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('section-', ''));
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

  const color = getCatColor(concept.cat);

  return (
    <div className="flex flex-col h-full">
      <ConceptHeader concept={concept} />
      <MiniNav active={activeSection} color={color} />
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ background: 'var(--bg)' }}
      >
        <motion.div
          key={concept.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
          <ContinueLearning  concept={concept} />
        </motion.div>
      </div>
    </div>
  );
}
