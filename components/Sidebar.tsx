'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FlaskConical, Search, Globe as GlobeIcon, Trophy, BookOpen, Sparkles, ChevronRight,
} from 'lucide-react';
import { CONCEPTS } from '@/lib/data/concepts';
import { CATEGORIES } from '@/lib/data/categories';
import { useProgress } from '@/hooks/useProgress';
import ConceptIcon from './icons/ConceptIcon';
import ThemeToggle from './ThemeToggle';
import { useLearningPath } from '@/hooks/useLearningPath';
import { loadProfile } from '@/lib/profile';

interface SidebarProps {
  onClose?: () => void;
  onOpenPalette?: () => void;
}

const SIDEBAR_GROUPS = [
  {
    id: 'system-design',
    label: 'System Design',
    emoji: '🏗️',
    cats: ['foundation', 'performance', 'data', 'async', 'reliability', 'messaging', 'cloud', 'networking'],
  },
  {
    id: 'patterns',
    label: 'Patterns & Principles',
    emoji: '🎨',
    cats: ['patterns', 'arch-patterns', 'oop', 'solid'],
  },
  {
    id: 'databases',
    label: 'Databases',
    emoji: '🗄️',
    cats: ['redis', 'postgres', 'mongodb', 'dsa', 'data-modeling'],
  },
  {
    id: 'backend',
    label: 'Backend',
    emoji: '⚙️',
    cats: ['nodejs', 'nestjs', 'fastapi', 'python', 'laravel'],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    emoji: '⚛️',
    cats: ['javascript', 'react', 'nextjs'],
  },
  {
    id: 'devops',
    label: 'DevOps & Tools',
    emoji: '🔧',
    cats: ['git', 'github-actions'],
  },
] as const;

export default function Sidebar({ onClose, onOpenPalette }: SidebarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [activeCat, setActiveCat] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['system-design'])
  );
  const { isViewed, count } = useProgress();
  const { completedCount, totalConcepts, path } = useLearningPath();
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile>>(null);
  useEffect(() => { setProfile(loadProfile()); }, []);

  const currentConcept = params.get('concept');
  const currentView = params.get('view');

  const filtered = CONCEPTS.filter(c => c.cat === activeCat);

  function navigate(href: string) {
    router.push(href);
    onClose?.();
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  // Build a lookup: catId -> Category object
  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  // Count concepts per category
  function catCount(catId: string) {
    return CONCEPTS.filter(c => c.cat === catId).length;
  }

  // Count concepts per group
  function groupCount(groupId: string) {
    const group = SIDEBAR_GROUPS.find(g => g.id === groupId);
    if (!group) return 0;
    return group.cats.reduce((sum, catId) => sum + catCount(catId), 0);
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
              Dev Labs
            </div>
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

      {/* Scrollable area: accordion + concept list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>

        {/* Group accordion */}
        <div className="px-2 pb-2">
          {SIDEBAR_GROUPS.map(group => {
            const isExpanded = expandedGroups.has(group.id);
            const total = groupCount(group.id);
            return (
              <div key={group.id} className="mb-0.5">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-colors"
                  style={{ color: 'var(--tm)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <ChevronRight
                    size={13}
                    strokeWidth={2.5}
                    style={{
                      flexShrink: 0,
                      color: 'var(--td)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 180ms ease',
                    }}
                  />
                  <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{group.emoji}</span>
                  <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'var(--t)' }}>
                    {group.label}
                  </span>
                  <span
                    className="text-xs rounded px-1 flex-shrink-0"
                    style={{
                      background: 'var(--s3)',
                      color: 'var(--td)',
                      fontSize: 10,
                    }}
                  >
                    {total}
                  </span>
                </button>

                {/* Category sub-items */}
                {isExpanded && (
                  <div className="mb-1">
                    {group.cats.map(catId => {
                      const cat = catMap[catId];
                      if (!cat) return null;
                      const count = catCount(catId);
                      const isActive = activeCat === catId;
                      return (
                        <button
                          key={catId}
                          onClick={() => setActiveCat(isActive ? '' : catId)}
                          className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-left transition-colors"
                          style={{
                            background: isActive ? `${cat.color}15` : 'transparent',
                            border: isActive ? `1px solid ${cat.color}30` : '1px solid transparent',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = 'var(--s3)';
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* Colored dot */}
                          <span
                            className="flex-shrink-0 rounded-full"
                            style={{ width: 7, height: 7, background: cat.color, opacity: isActive ? 1 : 0.65 }}
                          />
                          <span
                            className="flex-1 text-xs truncate"
                            style={{ color: isActive ? cat.color : 'var(--tm)' }}
                          >
                            {cat.label}
                          </span>
                          <span
                            className="text-xs flex-shrink-0"
                            style={{ color: 'var(--td)', fontSize: 10 }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Concept list — only shown when a category is selected */}
        {activeCat && (
        <div className="px-2 pb-2" style={{ borderTop: '1px solid var(--b0)' }}>
          <div className="pt-2">
            {CATEGORIES.filter(cat => cat.id === activeCat).map(cat => {
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
        </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="px-2 pb-2 flex-shrink-0" style={{ borderTop: '1px solid var(--b0)' }}>
        <div className="pt-2 space-y-0.5">
          {path && (
            <button
              onClick={() => navigate('/path')}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors mb-1"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <div
                className="flex items-center justify-center rounded-md flex-shrink-0"
                style={{ width: 22, height: 22, background: 'rgba(99,102,241,0.15)' }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1' }} />
              </div>
              <span className="text-xs font-bold flex-1" style={{ color: '#a5b4fc' }}>My Path</span>
              <span className="text-xs" style={{ color: '#6b7280' }}>{completedCount}/{totalConcepts}</span>
            </button>
          )}
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

          <button
            onClick={() => navigate('/lab?view=mentor')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
            style={{
              background: currentView === 'mentor' ? 'rgba(52,211,153,0.10)' : 'transparent',
              border: currentView === 'mentor' ? '1px solid rgba(52,211,153,0.25)' : '1px solid transparent',
            }}
            onMouseEnter={e => {
              if (currentView !== 'mentor') e.currentTarget.style.background = 'var(--s3)';
            }}
            onMouseLeave={e => {
              if (currentView !== 'mentor') e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              className="flex items-center justify-center rounded-md flex-shrink-0"
              style={{
                width: 22, height: 22,
                background: currentView === 'mentor' ? 'rgba(52,211,153,0.15)' : 'var(--s3)',
              }}
            >
              <Sparkles size={12} strokeWidth={2} color={currentView === 'mentor' ? '#34d399' : 'var(--td)'} />
            </div>
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: currentView === 'mentor' ? '#34d399' : 'var(--tm)' }}>
              Axiom Mentor
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: currentView === 'mentor' ? 'rgba(52,211,153,0.15)' : 'var(--s3)',
                  color: currentView === 'mentor' ? '#34d399' : 'var(--td)',
                  border: currentView === 'mentor' ? '1px solid rgba(52,211,153,0.30)' : '1px solid var(--b0)',
                  fontSize: 9,
                  lineHeight: 1,
                }}
              >
                AI
              </span>
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

        {profile && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--t)' }}>{profile.name}</div>
            <div style={{ fontSize: '0.68rem', color: '#6366f1', marginTop: 2 }}>→ {profile.targetRole}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' as const }}>
              {profile.currentStack.slice(0, 4).map((t: string) => (
                <span key={t} style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '1px 6px', borderRadius: 3, fontSize: '0.62rem' }}>{t}</span>
              ))}
              {profile.currentStack.length > 4 && (
                <span style={{ color: '#6b7280', fontSize: '0.62rem', padding: '1px 4px' }}>+{profile.currentStack.length - 4} more</span>
              )}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('axiom-profile-v1');
                localStorage.removeItem('axiom-path-v1');
                window.location.href = '/';
              }}
              style={{ marginTop: 8, background: 'none', border: 'none', color: '#4b5563', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Edit profile →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
