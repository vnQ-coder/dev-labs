'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FlaskConical, Search, Globe as GlobeIcon, Trophy, BookOpen,
} from 'lucide-react';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import { useProgress } from '@/hooks/useProgress';
import ConceptIcon from './icons/ConceptIcon';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  onClose?: () => void;
  onOpenPalette?: () => void;
}

export default function Sidebar({ onClose, onOpenPalette }: SidebarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [activeCat, setActiveCat] = useState<string>('all');
  const { isViewed, count } = useProgress();

  const currentConcept = params.get('concept');
  const currentView = params.get('view');

  const filtered = CONCEPTS.filter(c =>
    activeCat === 'all' || c.cat === activeCat
  );

  function navigate(href: string) {
    router.push(href);
    onClose?.();
  }

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ background: 'var(--s1)', borderRight: '1px solid var(--b0)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--b0)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
          aria-label="Go to home"
        >
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 28, height: 28, background: 'var(--accent)', color: '#0d1117' }}
          >
            <FlaskConical size={14} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight leading-tight" style={{ color: 'var(--t)' }}>
              System Design
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--tm)', fontSize: 10 }}>Lab</div>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 flex-shrink-0">
        <button
          onClick={onOpenPalette}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--b0)',
            color: 'var(--td)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--b0)')}
        >
          <Search size={13} strokeWidth={2} style={{ color: 'var(--td)', flexShrink: 0 }} />
          <span className="flex-1 text-xs">Search concepts…</span>
          <kbd
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--s3)',
              color: 'var(--td)',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--b0)',
              fontSize: 9,
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Category filter pills */}
      <div
        className="px-3 pb-2.5 flex-shrink-0"
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        <div className="flex gap-1.5 min-w-max">
          <button
            onClick={() => setActiveCat('all')}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0"
            style={{
              background: activeCat === 'all' ? 'var(--accent)' : 'var(--s3)',
              color: activeCat === 'all' ? '#0d1117' : 'var(--tm)',
              border: activeCat === 'all' ? '1px solid var(--accent)' : '1px solid var(--b0)',
            }}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(activeCat === cat.id ? 'all' : cat.id)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0"
              style={{
                background: activeCat === cat.id ? `${cat.color}18` : 'var(--s3)',
                color: activeCat === cat.id ? cat.color : 'var(--tm)',
                border: activeCat === cat.id ? `1px solid ${cat.color}40` : '1px solid var(--b0)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Concept list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ scrollbarWidth: 'thin' }}>
        {CATEGORIES.filter(cat => activeCat === 'all' || cat.id === activeCat).map(cat => {
          const items = filtered.filter(c => c.cat === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id} className="mb-3">
              <div
                className="section-label px-2 py-1.5 mb-0.5"
                style={{ color: cat.color }}
              >
                {cat.label}
              </div>
              {items.map(c => {
                const viewed = isViewed(c.id);
                const active = currentConcept === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/lab?concept=${c.id}`)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors mb-0.5"
                    style={{
                      background: active ? `${cat.color}10` : 'transparent',
                      border: active ? `1px solid ${cat.color}30` : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = 'var(--s3)';
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Icon wrapper */}
                    <div
                      className="flex items-center justify-center rounded-md flex-shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        background: active ? `${cat.color}18` : 'var(--s3)',
                        border: active ? `1px solid ${cat.color}30` : '1px solid transparent',
                      }}
                    >
                      <ConceptIcon
                        conceptId={c.id}
                        size={12}
                        color={active ? cat.color : 'var(--td)'}
                      />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-medium truncate"
                        style={{ color: active ? cat.color : 'var(--t)' }}
                      >
                        {c.title}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--td)', fontSize: 10 }}>
                        {c.tag}
                      </div>
                    </div>

                    {/* Viewed dot */}
                    {viewed && !active && (
                      <span
                        className="flex-shrink-0 rounded-full"
                        style={{ width: 5, height: 5, background: cat.color, opacity: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer nav */}
      <div className="px-2 pb-2 flex-shrink-0" style={{ borderTop: '1px solid var(--b0)' }}>
        <div className="pt-2 space-y-0.5">
          <button
            onClick={() => navigate('/lab?view=realworld')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
            style={{
              background: currentView === 'realworld' ? 'rgba(201,168,76,0.10)' : 'transparent',
              border: currentView === 'realworld' ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
            }}
            onMouseEnter={e => {
              if (currentView !== 'realworld') e.currentTarget.style.background = 'var(--s3)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'realworld') e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              className="flex items-center justify-center rounded-md flex-shrink-0"
              style={{
                width: 22, height: 22,
                background: currentView === 'realworld' ? 'rgba(201,168,76,0.15)' : 'var(--s3)',
              }}
            >
              <GlobeIcon size={12} strokeWidth={2} color={currentView === 'realworld' ? '#c9a84c' : 'var(--td)'} />
            </div>
            <span className="text-xs font-medium" style={{ color: currentView === 'realworld' ? '#c9a84c' : 'var(--tm)' }}>
              Real World Systems
            </span>
          </button>

          <button
            onClick={() => navigate('/lab?view=quiz')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
            style={{
              background: currentView === 'quiz' ? 'rgba(201,112,112,0.10)' : 'transparent',
              border: currentView === 'quiz' ? '1px solid rgba(201,112,112,0.25)' : '1px solid transparent',
            }}
            onMouseEnter={e => {
              if (currentView !== 'quiz') e.currentTarget.style.background = 'var(--s3)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'quiz') e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              className="flex items-center justify-center rounded-md flex-shrink-0"
              style={{
                width: 22, height: 22,
                background: currentView === 'quiz' ? 'rgba(201,112,112,0.15)' : 'var(--s3)',
              }}
            >
              <Trophy size={12} strokeWidth={2} color={currentView === 'quiz' ? '#c97070' : 'var(--td)'} />
            </div>
            <span className="text-xs font-medium" style={{ color: currentView === 'quiz' ? '#c97070' : 'var(--tm)' }}>
              Take the Quiz
            </span>
          </button>
        </div>

        {/* Progress + theme toggle */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            <BookOpen size={11} strokeWidth={2} style={{ color: 'var(--td)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--tm)' }}>
              {count} / {CONCEPTS.length} studied
            </span>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-1.5 h-0.5 rounded-full overflow-hidden mx-1" style={{ background: 'var(--s3)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${(count / CONCEPTS.length) * 100}%`,
              background: 'var(--accent)',
              transition: 'width 500ms ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}
