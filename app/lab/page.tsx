'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ConceptPage from '@/components/ConceptPage';
import RealWorldView from '@/components/RealWorldView';
import Quiz from '@/components/Quiz';
import MobileTopBar from '@/components/MobileTopBar';
import CommandPalette from '@/components/CommandPalette';
import { CONCEPTS } from '@/lib/data/concepts';

function LabContent() {
  const params = useSearchParams();
  const conceptId = params.get('concept');
  const view = params.get('view');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const concept = conceptId ? CONCEPTS.find(c => c.id === conceptId) : null;

  /* ⌘K / Ctrl+K global shortcut */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function renderMain() {
    if (view === 'quiz') return <Quiz />;
    if (view === 'realworld') return <RealWorldView />;
    if (concept) return <ConceptPage concept={concept} />;
    return <WelcomeScreen onOpenPalette={() => setPaletteOpen(true)} />;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col w-72 flex-shrink-0 relative z-10">
          <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
        </div>

        {/* Mobile top bar */}
        <MobileTopBar />

        {/* Main content */}
        <div
          className="flex-1 overflow-y-auto relative z-10 pt-14 md:pt-0"
          style={{ background: 'transparent' }}
        >
          {renderMain()}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

const WELCOME_CONCEPTS = [
  { label: '⚖️ Load Balancing',  id: 'loadbalancer', color: '#34d399' },
  { label: '⚡ Caching',         id: 'caching',       color: '#34d399' },
  { label: '📨 Kafka',           id: 'kafka',          color: '#16a34a' },
  { label: '🐇 RabbitMQ',        id: 'rabbitmq',       color: '#f97316' },
  { label: '⚙️ BullMQ',          id: 'bullmq',         color: '#ef4444' },
  { label: '🔺 CAP Theorem',     id: 'cap',            color: '#a78bfa' },
  { label: '🔌 Circuit Breaker', id: 'circuit',        color: '#f87171' },
  { label: '🌐 CDN',             id: 'cdn',            color: '#34d399' },
];

function WelcomeScreen({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
      <h2
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--t)' }}
      >
        System Design Lab
      </h2>
      <p className="text-sm max-w-sm mb-8" style={{ color: 'var(--tm)' }}>
        15 concepts. Interactive diagrams. CTO-level interview answers.
      </p>

      {/* Search shortcut hint */}
      <button
        onClick={onOpenPalette}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm mb-10 transition-all hover:scale-105"
        style={{ background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tm)', fontFamily: 'var(--font-display)' }}
      >
        <span>🔍</span>
        <span>Search concepts…</span>
        <kbd className="text-xs px-2 py-0.5 rounded ml-2" style={{ background: 'var(--s3)', fontFamily: 'var(--font-mono)', border: '1px solid var(--b1)' }}>
          ⌘K
        </kbd>
      </button>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {WELCOME_CONCEPTS.map(c => (
          <Link
            key={c.id}
            href={`/lab?concept=${c.id}`}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              border: `1px solid ${c.color}35`,
              color: c.color,
              background: `${c.color}0e`,
              fontFamily: 'var(--font-display)',
            }}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function LabPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg)', minHeight: '100vh' }} />}>
      <LabContent />
    </Suspense>
  );
}
