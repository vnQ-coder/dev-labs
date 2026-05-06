'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ConceptPage from '@/components/ConceptPage';
import BehindTheScenesPage from '@/components/BehindTheScenesPage';
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
    if (concept && concept.cat === 'networking') return <BehindTheScenesPage concept={concept} />;
    if (concept) return <ConceptPage concept={concept} />;
    return <WelcomeScreen onOpenPalette={() => setPaletteOpen(true)} />;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Desktop sidebar — visible on lg+ */}
        <div className="hidden lg:flex flex-col flex-shrink-0 relative z-10" style={{ width: 260 }}>
          <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
        </div>

        {/* Mobile/tablet top bar — visible below lg */}
        <MobileTopBar onOpenPalette={() => setPaletteOpen(true)} />

        {/* Main content — offset for mobile top bar */}
        <div
          className="flex-1 overflow-y-auto relative z-10 pt-14 lg:pt-0"
          style={{ background: 'transparent', minWidth: 0 }}
        >
          {renderMain()}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

const WELCOME_CONCEPTS = [
  { id: 'loadbalancer' }, { id: 'caching' }, { id: 'kafka' },
  { id: 'rabbitmq' },     { id: 'cap' },     { id: 'circuit' },
  { id: 'cdn' },          { id: 'sharding' },
];

function WelcomeScreen({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
      <h2
        className="text-2xl font-bold mb-2 tracking-tight"
        style={{ color: 'var(--t)', letterSpacing: '-0.02em' }}
      >
        Dev Labs
      </h2>
      <p className="text-sm max-w-xs mb-8" style={{ color: 'var(--tm)', lineHeight: 1.65 }}>
        {CONCEPTS.length} concepts. Interactive diagrams. CTO-level interview answers.
      </p>

      <button
        onClick={onOpenPalette}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm mb-10 transition-colors"
        style={{
          background: 'var(--s1)',
          border: '1px solid var(--b1)',
          color: 'var(--tm)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--b1)')}
      >
        <Search size={14} strokeWidth={2} />
        <span>Search concepts…</span>
        <kbd
          className="text-xs px-2 py-0.5 rounded ml-1"
          style={{
            background: 'var(--s3)',
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--b0)',
            color: 'var(--td)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {WELCOME_CONCEPTS.map(({ id }) => {
          const c = CONCEPTS.find(x => x.id === id);
          if (!c) return null;
          const catColors: Record<string, string> = {
            foundation: '#5ba3c9', performance: '#4db896', data: '#8b78d4',
            async: '#c9a84c', reliability: '#c97070', messaging: '#c97a40', cloud: '#4db0c9',
          };
          const color = catColors[c.cat] ?? 'var(--accent)';
          return (
            <Link
              key={id}
              href={`/lab?concept=${id}`}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                border: `1px solid ${color}30`,
                color: color,
                background: `${color}0d`,
              }}
            >
              {c.title}
            </Link>
          );
        })}
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
