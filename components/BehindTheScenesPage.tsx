'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Server, Database, Lock, Globe, Globe2, Shield, Wifi,
  Layers, Network, CloudLightning, MapPin, Search, Terminal,
  Bug, Key, ArrowRight, ArrowLeft, Zap, Cpu, Code2, Route,
  Activity, PlugZap, Plug, RefreshCw, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Lightbulb,
  BookOpen, Copy, Check, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import { useProgress } from '@/hooks/useProgress';
import ConceptIcon from './icons/ConceptIcon';
import type { Concept, FailureMode, PipelineStep, DebugCommand } from '@/lib/types';

/* ── Icon map ── */

const PIPELINE_ICONS: Record<string, LucideIcon> = {
  Monitor, Server, Database, Lock, Globe, Globe2, Shield, Wifi,
  Layers, Network, CloudLightning, MapPin, Search, Terminal,
  Bug, Key, ArrowRight, ArrowLeft, Zap, Cpu, Code2, Route,
  Activity, PlugZap, Plug, RefreshCw, CheckCircle2,
};

function getPipelineIcon(name: string): LucideIcon {
  return PIPELINE_ICONS[name] ?? Globe;
}

/* ── Helpers ── */

function getCatColor(cat: string): string {
  return CATEGORIES.find(c => c.id === cat)?.color ?? 'var(--accent)';
}

function getNetworkingConcepts(): Concept[] {
  return CONCEPTS.filter(c => c.cat === 'networking');
}

/* ── Section config ── */

const SECTIONS = [
  { id: 'hook',      label: 'Intro'     },
  { id: 'simple',   label: 'ELI5'      },
  { id: 'pipeline', label: 'Journey'   },
  { id: 'failures', label: 'Failures'  },
  { id: 'debug',    label: 'Debug'     },
  { id: 'interview',label: 'Interview' },
];

/* ── Section Label ── */

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

/* ── Header ── */

function ConceptHeader({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const catLabel = CATEGORIES.find(c => c.id === concept.cat)?.label;
  const networkingConcepts = getNetworkingConcepts();
  const idx = networkingConcepts.findIndex(c => c.id === concept.id);
  const prev = idx > 0 ? networkingConcepts[idx - 1] : null;
  const next = idx < networkingConcepts.length - 1 ? networkingConcepts[idx + 1] : null;

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

/* ── 1. Hook Section ── */

function HookSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const hookText = concept.hook ?? concept.overview ?? concept.te.def;
  const examples = concept.te.rw.ex.slice(0, 3);

  return (
    <section id="section-hook" className="mb-10">
      <div
        className="rounded-2xl p-5"
        style={{
          background: `linear-gradient(135deg, ${color}0d 0%, var(--s1) 60%)`,
          border: `1px solid ${color}22`,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={12} strokeWidth={2.5} color={color} />
          <span className="section-label" style={{ color }}>Behind the Scenes</span>
        </div>
        <p
          className="font-semibold leading-relaxed mb-5"
          style={{ color: 'var(--t)', fontSize: '1rem', lineHeight: 1.75 }}
        >
          {hookText}
        </p>
        {(examples.length > 0 || (concept.failures && concept.failures.length > 0) || (concept.pipeline && concept.pipeline.length > 0)) && (
          <div
            className="flex flex-wrap gap-2 pt-4"
            style={{ borderTop: `1px solid ${color}15` }}
          >
            {examples.map(ex => (
              <span
                key={ex}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}
              >
                {ex}
              </span>
            ))}
            {concept.failures && concept.failures.length > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(201,112,112,0.08)',
                  color: '#c97070',
                  border: '1px solid rgba(201,112,112,0.20)',
                }}
              >
                {concept.failures.length} failure modes
              </span>
            )}
            {concept.pipeline && concept.pipeline.length > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'var(--s2)', color: 'var(--tm)', border: '1px solid var(--b0)' }}
              >
                {concept.pipeline.length} steps
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── 2. ELI5 Section ── */

function SimpleSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const simpleText = concept.simpleExplain ?? concept.a.tx;

  return (
    <section id="section-simple" className="mb-10">
      <SectionLabel color={color}>Explain Like I&apos;m 5</SectionLabel>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${color}20` }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: `${color}06`, borderBottom: `1px solid ${color}18` }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: `${color}18`, border: `1px solid ${color}28` }}
          >
            <Lightbulb size={18} strokeWidth={2} color={color} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--t)' }}>The Simple Version</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--td)' }}>No jargon, just concepts</div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5" style={{ background: 'var(--s1)' }}>
          {simpleText.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="leading-relaxed mb-3 last:mb-0"
              style={{ color: 'var(--tm)', fontSize: '0.9375rem', lineHeight: 1.8 }}
            >
              {para.trim()}
            </p>
          ))}
        </div>

        {/* Key Insight footer */}
        <div
          className="px-5 py-4 flex gap-3"
          style={{ background: `${color}06`, borderTop: `1px solid ${color}18` }}
        >
          <Zap size={14} strokeWidth={2} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
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

/* ── 3. Pipeline / Journey Section ── */

function PipelineVisualizer({
  steps,
  activeIdx,
  color,
  onSelect,
}: {
  steps: PipelineStep[];
  activeIdx: number;
  color: string;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-0 overflow-x-auto pb-3 mb-4"
      style={{ scrollbarWidth: 'none' } as React.CSSProperties}
    >
      {steps.map((step, i) => {
        const Icon = getPipelineIcon(step.icon);
        const isActive = i === activeIdx;
        return (
          <div key={i} className="flex items-center flex-shrink-0">
            {/* Step node */}
            <button
              onClick={() => onSelect(i)}
              className="flex flex-col items-center gap-1.5 transition-all"
              style={{ minWidth: 64 }}
            >
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 40,
                  height: 40,
                  background: isActive ? color : `${color}14`,
                  border: `2px solid ${isActive ? color : `${color}30`}`,
                  boxShadow: isActive ? `0 0 12px ${color}40` : 'none',
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={2}
                  color={isActive ? '#fff' : color}
                />
              </div>
              <span
                className="text-center leading-tight font-medium"
                style={{
                  color: isActive ? color : 'var(--tm)',
                  maxWidth: 60,
                  fontSize: '0.65rem',
                }}
              >
                {step.label}
              </span>
            </button>

            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <div className="flex items-center flex-shrink-0" style={{ marginBottom: 20 }}>
                <ArrowRight size={14} strokeWidth={1.5} color={`${color}40`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PipelineAccordion({
  step,
  index,
  isOpen,
  onToggle,
  color,
}: {
  step: PipelineStep;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  color: string;
}) {
  const Icon = getPipelineIcon(step.icon);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: `1px solid ${isOpen ? `${color}40` : 'var(--b0)'}` }}
    >
      {/* Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: isOpen ? `${color}08` : 'var(--s1)' }}
      >
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            background: isOpen ? `${color}18` : `${color}0c`,
            border: `1px solid ${color}25`,
          }}
        >
          <Icon size={13} strokeWidth={2} color={color} />
        </div>
        <span
          className="flex-shrink-0 text-xs font-bold"
          style={{ color: `${color}80`, minWidth: 20, fontFamily: 'var(--font-mono)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--t)' }}>
          {step.label}
        </span>
        {step.sublabel && (
          <span className="text-xs hidden sm:block" style={{ color: 'var(--td)' }}>
            {step.sublabel}
          </span>
        )}
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
              className="px-4 pb-4 pt-3 space-y-3"
              style={{ background: 'var(--s2)', borderTop: '1px solid var(--b0)' }}
            >
              {/* Simple explanation */}
              <div
                className="rounded-lg p-4"
                style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb size={11} strokeWidth={2.5} color={color} />
                  <span className="section-label" style={{ color }}>Simple</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)', lineHeight: 1.75 }}>
                  {step.simple}
                </p>
              </div>

              {/* Technical deep-dive */}
              <div
                className="rounded-lg p-4"
                style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Terminal size={11} strokeWidth={2} color="var(--tm)" />
                  <span className="section-label" style={{ color: 'var(--tm)' }}>Technical</span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    color: 'var(--tm)',
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {step.deep}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PipelineSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const steps = concept.pipeline;
  const [openIdx, setOpenIdx] = useState<number>(0);

  if (!steps || steps.length === 0) return null;

  return (
    <section id="section-pipeline" className="mb-10">
      <SectionLabel color={color}>The Journey</SectionLabel>

      {/* Horizontal visualizer */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}
      >
        <PipelineVisualizer
          steps={steps}
          activeIdx={openIdx}
          color={color}
          onSelect={i => setOpenIdx(i)}
        />
        <p className="text-xs text-center" style={{ color: 'var(--td)' }}>
          Tap a step to explore it below
        </p>
      </div>

      {/* Accordion cards */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <PipelineAccordion
            key={i}
            step={step}
            index={i}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            color={color}
          />
        ))}
      </div>
    </section>
  );
}

/* ── 4. Failures Section ── */

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

/* ── 5. Debug Section ── */

function DebugCommandCard({ cmd }: { cmd: DebugCommand }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(cmd.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--b0)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b0)' }}
      >
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--t)' }}>{cmd.label}</div>
        <div className="text-xs" style={{ color: 'var(--tm)' }}>{cmd.what}</div>
      </div>

      {/* Code block */}
      <div>
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: 'var(--s2)', borderBottom: '1px solid var(--b0)' }}
        >
          <div className="flex items-center gap-1.5">
            <Terminal size={11} strokeWidth={2} style={{ color: 'var(--td)' }} />
            <span className="section-label" style={{ color: 'var(--td)' }}>Terminal</span>
          </div>
          <button
            onClick={copy}
            className="flex items-center justify-center rounded-md transition-colors"
            style={{
              width: 26,
              height: 26,
              color: copied ? '#4db896' : 'var(--tm)',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={copied ? 'Copied!' : 'Copy command'}
            aria-label={copied ? 'Copied!' : 'Copy command'}
          >
            {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
          </button>
        </div>
        <pre
          className="px-4 py-3 text-xs leading-relaxed overflow-x-auto"
          style={{
            background: 'var(--s2)',
            color: 'var(--t)',
            fontFamily: 'var(--font-mono)',
            margin: 0,
          }}
        >
          <code>{cmd.cmd}</code>
        </pre>
      </div>
    </div>
  );
}

function DebugSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const commands = concept.commands;

  if (!commands || commands.length === 0) return null;

  return (
    <section id="section-debug" className="mb-10">
      <SectionLabel color={color}>Debug Playbook</SectionLabel>
      <div className="space-y-3">
        {commands.map((cmd, i) => (
          <DebugCommandCard key={i} cmd={cmd} />
        ))}
      </div>
    </section>
  );
}

/* ── 6. Interview Section ── */

function InterviewSection({ concept }: { concept: Concept }) {
  const color = getCatColor(concept.cat);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <section id="section-interview" className="mb-10">
      <SectionLabel color={color}>Interview Angle</SectionLabel>
      <div className="space-y-3">
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}
        >
          <div className="section-label mb-2" style={{ color: 'var(--accent)' }}>Common Question</div>
          <p
            className="font-semibold leading-relaxed mb-4"
            style={{ color: 'var(--t)', fontSize: '0.9375rem', lineHeight: 1.7 }}
          >
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
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                    color: 'var(--t)',
                    lineHeight: 1.75,
                  }}
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

        {concept.interview.fu.length > 0 && (
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--s1)', border: '1px solid var(--b0)' }}
          >
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
        )}
      </div>
    </section>
  );
}

/* ── Continue Learning ── */

function ContinueLearning({ concept }: { concept: Concept }) {
  const networkingConcepts = getNetworkingConcepts();
  const netIdx = networkingConcepts.findIndex(c => c.id === concept.id);
  const nextNetworking =
    netIdx >= 0 && netIdx < networkingConcepts.length - 1
      ? networkingConcepts[netIdx + 1]
      : null;

  const allIdx = CONCEPTS.findIndex(c => c.id === concept.id);
  const nextAny = allIdx < CONCEPTS.length - 1 ? CONCEPTS[allIdx + 1] : CONCEPTS[0];

  const next = nextNetworking ?? nextAny;
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

/* ── Main ── */

export default function BehindTheScenesPage({ concept }: { concept: Concept }) {
  const [activeSection, setActiveSection] = useState('hook');
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
          <HookSection      concept={concept} />
          <SimpleSection    concept={concept} />
          <PipelineSection  concept={concept} />
          <FailuresSection  concept={concept} />
          <DebugSection     concept={concept} />
          <InterviewSection concept={concept} />
          <ContinueLearning concept={concept} />
        </motion.div>
      </div>
    </div>
  );
}
