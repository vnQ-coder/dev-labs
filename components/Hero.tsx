'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { CONCEPTS } from '@/lib/data/concepts';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export default function Hero() {
  const router = useRouter();
  const allTitles = CONCEPTS.map(c => c.title);
  const tickerItems = [...allTitles, ...allTitles];

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Fixed top nav ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8"
        style={{
          height: 56,
          background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
          borderBottom: '1px solid var(--b0)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 26, height: 26, background: 'var(--accent)', color: '#0d1117' }}
          >
            <FlaskConical size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--t)' }}>
            System Design Lab
          </span>
        </div>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: 'Concepts', href: '/lab' },
            { label: 'Diagrams', href: '/lab' },
            { label: 'Interview', href: '/lab' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm transition-colors"
              style={{ color: 'var(--tm)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--t)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tm)')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: CTA + theme */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/lab')}
            className="hidden md:flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              padding: '6px 14px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.color = '#0d1117';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent-subtle)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
          >
            Open Lab
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Center content ── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">

        {/* Eyebrow */}
        <motion.div {...fadeUp(0)}>
          <div
            className="inline-flex items-center gap-2 rounded-full mb-8"
            style={{
              padding: '4px 14px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.10em',
              color: 'var(--accent)',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
              }}
            />
            {CONCEPTS.length} Concepts · Interactive Diagrams · Interview Prep
          </div>
        </motion.div>

        {/* H1 */}
        <motion.div {...fadeUp(0.08)} className="mb-5">
          <h1
            className="tracking-tight"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: 'var(--t)',
            }}
          >
            System Design
            <span className="block" style={{ WebkitTextStroke: '1.5px var(--b2)', color: 'transparent' }}>
              from{' '}
              <span style={{ WebkitTextStroke: '0', color: 'var(--accent)' }}>zero</span>
              {' '}to staff.
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          {...fadeUp(0.16)}
          className="max-w-md mb-10"
          style={{
            fontSize: '1rem',
            lineHeight: 1.65,
            color: 'var(--tm)',
          }}
        >
          Every concept explained with real-world analogies, interactive diagrams,
          and CTO-grade interview answers.
        </motion.p>

        {/* CTA row */}
        <motion.div {...fadeUp(0.24)} className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => router.push('/lab')}
            className="rounded-lg font-semibold transition-all"
            style={{
              padding: '10px 24px',
              background: 'var(--accent)',
              color: '#0d1117',
              fontSize: '0.9375rem',
              boxShadow: '0 4px 20px var(--accent-subtle)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 28px var(--accent-subtle)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-subtle)';
            }}
          >
            Open the Lab →
          </button>
          <Link
            href="/lab"
            className="rounded-lg font-medium transition-colors"
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid var(--b1)',
              color: 'var(--tm)',
              fontSize: '0.9375rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--b2)';
              e.currentTarget.style.color = 'var(--t)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--b1)';
              e.currentTarget.style.color = 'var(--tm)';
            }}
          >
            Browse Concepts
          </Link>
        </motion.div>
      </main>

      {/* ── Ticker footer ── */}
      <footer
        className="fixed bottom-0 left-0 right-0 overflow-hidden flex-shrink-0"
        style={{
          height: 40,
          borderTop: '1px solid var(--b0)',
          background: 'var(--s1)',
        }}
      >
        <div className="ticker-track flex items-center h-full" style={{ width: 'max-content' }}>
          {tickerItems.map((title, i) => (
            <div
              key={i}
              className="flex items-center gap-3 flex-shrink-0"
              style={{
                padding: '0 20px',
                height: '100%',
                borderRight: '1px solid var(--b0)',
              }}
            >
              <span
                style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--accent)',
                  opacity: 0.5,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--td)', whiteSpace: 'nowrap' }}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2.2); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
