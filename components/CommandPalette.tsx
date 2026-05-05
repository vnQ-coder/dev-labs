'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe as GlobeIcon, Trophy } from 'lucide-react';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import ConceptIcon from './icons/ConceptIcon';

interface Result {
  type: 'concept' | 'section';
  id: string;
  title: string;
  sub: string;
  icon: string;
  color: string;
  href: string;
}

const STATIC_RESULTS: Result[] = [
  { type: 'section', id: 'realworld', title: 'Real World Systems', sub: 'Netflix, Uber, Discord…', icon: 'realworld', color: '#fbbf24', href: '/lab?view=realworld' },
  { type: 'section', id: 'quiz',      title: 'Take the Quiz',      sub: '16 interview questions',  icon: 'quiz',      color: '#f87171', href: '/lab?view=quiz'      },
];

function buildResults(query: string): Result[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const conceptResults: Result[] = CONCEPTS.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.tag.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q) ||
    CATEGORIES.find(cat => cat.id === c.cat)?.label.toLowerCase().includes(q)
  ).map(c => ({
    type: 'concept',
    id: c.id,
    title: c.title,
    sub: c.tag,
    icon: c.icon,
    color: c.color,
    href: `/lab?concept=${c.id}`,
  }));

  const sectionResults = STATIC_RESULTS.filter(r =>
    r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
  );

  return [...conceptResults, ...sectionResults].slice(0, 8);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = buildResults(query);
  const showDefault = !query;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const list = showDefault ? STATIC_RESULTS : results;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, list.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        const item = list[selected];
        if (item) navigate(item.href);
      } else if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, selected, showDefault, navigate, onClose]);

  // Reset selection when results change
  useEffect(() => { setSelected(0); }, [query]);

  const displayList = showDefault ? STATIC_RESULTS : results;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-50 left-1/2 top-1/2"
            style={{ transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 560, padding: '0 clamp(12px, 4vw, 16px)' }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'var(--s1)',
                border: '1px solid var(--b2)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Search input */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--b1)' }}
              >
                <Search size={16} strokeWidth={2} style={{ color: 'var(--tm)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search concepts, topics, patterns…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--t)', fontFamily: 'var(--font-sans)' }}
                />
                <kbd
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--s3)', color: 'var(--tm)', fontFamily: 'var(--font-mono)', border: '1px solid var(--b1)' }}
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="py-2 max-h-80 overflow-y-auto">
                {showDefault && (
                  <div className="px-4 py-1.5">
                    <span className="section-label" style={{ color: 'var(--tm)' }}>Quick Access</span>
                  </div>
                )}
                {!showDefault && results.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--tm)' }}>
                    No results for &ldquo;{query}&rdquo;
                  </div>
                )}
                {displayList.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      background: selected === i ? `${item.color}14` : 'transparent',
                      borderLeft: selected === i ? `2px solid ${item.color}` : '2px solid transparent',
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
                    >
                      {item.type === 'section' && item.id === 'realworld' && <GlobeIcon size={15} strokeWidth={2} color={item.color} />}
                      {item.type === 'section' && item.id === 'quiz'      && <Trophy    size={15} strokeWidth={2} color={item.color} />}
                      {item.type === 'concept' && <ConceptIcon conceptId={item.id} size={15} color={item.color} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: selected === i ? item.color : 'var(--t)', fontFamily: 'var(--font-display)' }}>
                        {item.title}
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: 'var(--tm)' }}>
                        {item.sub}
                      </div>
                    </div>
                    {selected === i && (
                      <kbd className="flex-shrink-0 text-xs px-2 py-0.5 rounded" style={{ background: 'var(--s3)', color: 'var(--tm)', fontFamily: 'var(--font-mono)', border: '1px solid var(--b1)' }}>
                        ↵
                      </kbd>
                    )}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div
                className="flex items-center gap-4 px-4 py-2 text-xs"
                style={{ borderTop: '1px solid var(--b1)', color: 'var(--tm)', fontFamily: 'var(--font-mono)' }}
              >
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>ESC close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
