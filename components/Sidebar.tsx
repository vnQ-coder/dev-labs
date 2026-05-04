'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import { useProgress } from '@/hooks/useProgress';
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
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--b0)' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group"
        >
          <span className="text-xl">🧪</span>
          <div>
            <div className="text-sm font-black tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--p)' }}>
              SYSTEM DESIGN
            </div>
            <div className="text-xs" style={{ color: 'var(--tm)' }}>LAB</div>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <button
          onClick={onOpenPalette}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all hover:border-[var(--p)]"
          style={{ background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--tm)' }}
        >
          <span style={{ fontSize: 12 }}>🔍</span>
          <span className="flex-1" style={{ fontFamily: 'var(--font-sans)' }}>Search concepts…</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--s3)', fontFamily: 'var(--font-mono)', border: '1px solid var(--b1)', fontSize: 10 }}>⌘K</kbd>
        </button>
      </div>

      {/* Categories */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCat('all')}
          className="px-2.5 py-1 rounded-full text-xs transition-all"
          style={{
            background: activeCat === 'all' ? 'var(--p)' : 'var(--s2)',
            color: activeCat === 'all' ? 'var(--bg)' : 'var(--tm)',
            border: '1px solid var(--b1)',
          }}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(activeCat === cat.id ? 'all' : cat.id)}
            className="px-2.5 py-1 rounded-full text-xs transition-all"
            style={{
              background: activeCat === cat.id ? cat.color : 'var(--s2)',
              color: activeCat === cat.id ? 'var(--bg)' : 'var(--tm)',
              border: `1px solid ${activeCat === cat.id ? cat.color : 'var(--b1)'}`,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Concepts list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--tm)' }}>
            No concepts found
          </div>
        )}
        {CATEGORIES.filter(cat =>
          activeCat === 'all' || cat.id === activeCat
        ).map(cat => {
          const items = filtered.filter(c => c.cat === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id} className="mb-3">
              <div
                className="text-xs uppercase tracking-wider font-semibold px-2 py-1.5 mb-1"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all mb-0.5 hover:bg-[var(--s2)]"
                    style={{
                      background: active ? `${c.color}20` : undefined,
                      border: active ? `1px solid ${c.color}40` : '1px solid transparent',
                    }}
                  >
                    <span className="text-base flex-shrink-0">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: active ? c.color : 'var(--t)' }}>
                        {c.title}
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: 'var(--tm)' }}>
                        {c.tag}
                      </div>
                    </div>
                    {viewed && !active && (
                      <span
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: c.color, opacity: 0.7 }}
                        title="Viewed"
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
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--b0)' }}>
        <button
          onClick={() => navigate('/lab?view=realworld')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all mb-1"
          style={{
            background: currentView === 'realworld' ? 'rgba(251,191,36,0.15)' : 'transparent',
            border: currentView === 'realworld' ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent',
          }}
        >
          <span>🌍</span>
          <span className="text-sm font-medium" style={{ color: currentView === 'realworld' ? 'var(--a)' : 'var(--t)' }}>
            Real World Systems
          </span>
        </button>
        <button
          onClick={() => navigate('/lab?view=quiz')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
          style={{
            background: currentView === 'quiz' ? 'rgba(248,113,113,0.15)' : 'transparent',
            border: currentView === 'quiz' ? '1px solid rgba(248,113,113,0.3)' : '1px solid transparent',
          }}
        >
          <span>🎯</span>
          <span className="text-sm font-medium" style={{ color: currentView === 'quiz' ? 'var(--r)' : 'var(--t)' }}>
            Take the Quiz
          </span>
        </button>
        <div className="flex items-center justify-between mt-3 px-2">
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--tm)', fontFamily: 'var(--font-display)' }}>
              {count} / {CONCEPTS.length} studied
            </div>
            <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ width: 80, background: 'var(--s3)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(count / CONCEPTS.length) * 100}%`, background: 'var(--g)' }}
              />
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
