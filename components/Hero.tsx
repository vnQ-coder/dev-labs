'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ThemeToggle from './ThemeToggle';

const HeroFlow = dynamic(() => import('./HeroFlow'), { ssr: false });

const HERO_CONCEPTS = [
  { label: 'Load Balancing',  id: 'loadbalancer', color: '#34d399' },
  { label: 'Caching',         id: 'caching',       color: '#38bdf8' },
  { label: 'CDN',             id: 'cdn',            color: '#38bdf8' },
  { label: 'Sharding',        id: 'sharding',       color: '#a78bfa' },
  { label: 'Kafka',           id: 'kafka',          color: '#16a34a' },
  { label: 'RabbitMQ',        id: 'rabbitmq',       color: '#f97316' },
  { label: 'BullMQ',          id: 'bullmq',         color: '#ef4444' },
  { label: 'CAP Theorem',     id: 'cap',            color: '#a78bfa' },
  { label: 'Circuit Breaker', id: 'circuit',        color: '#f87171' },
  { label: 'Rate Limiting',   id: 'ratelimit',      color: '#f59e0b' },
];

export default function Hero() {
  const router = useRouter();

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Animated React Flow background */}
      <HeroFlow />

      {/* Radial gradient overlay to focus center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, var(--bg) 80%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(56,189,248,0.10)',
            border: '1px solid rgba(56,189,248,0.25)',
            color: 'var(--p)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.06em',
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--g)',
              display: 'inline-block',
              animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
            }}
          />
          15 CONCEPTS · INTERACTIVE DIAGRAMS · INTERVIEW PREP
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <h1
            className="text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="block" style={{ color: 'var(--t)' }}>SYSTEM</span>
            <span className="block" style={{ color: 'var(--t)' }}>DESIGN</span>
            <span
              className="block"
              style={{
                color: 'transparent',
                backgroundImage: 'linear-gradient(135deg, #38bdf8, #a78bfa)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              LAB
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg max-w-xl leading-relaxed mb-10"
          style={{ color: 'var(--tm)', fontFamily: 'var(--font-sans)' }}
        >
          From beginner intuition to staff-level precision. Every concept explained
          with analogies, live diagrams, real-world cases, and CTO-grade interview answers.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/lab')}
          className="px-10 py-3.5 rounded-xl text-base font-semibold transition-all"
          style={{
            background: 'var(--p)',
            color: '#060a12',
            boxShadow: '0 0 32px rgba(56,189,248,0.25)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.02em',
          }}
        >
          Open the Lab →
        </motion.button>

        {/* Concept pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-wrap justify-center gap-2 mt-14"
        >
          {HERO_CONCEPTS.map(c => (
            <Link
              key={c.id}
              href={`/lab?concept=${c.id}`}
              className="text-xs px-3.5 py-1.5 rounded-full border transition-all hover:scale-105"
              style={{
                borderColor: `${c.color}30`,
                color: c.color,
                background: `${c.color}0d`,
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
              }}
            >
              {c.label}
            </Link>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
