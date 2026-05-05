'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, FlaskConical } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

interface MobileTopBarProps {
  onOpenPalette?: () => void;
}

export default function MobileTopBar({ onOpenPalette }: MobileTopBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar — visible below lg */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:hidden"
        style={{
          height: 56,
          background: 'var(--s1)',
          borderBottom: '1px solid var(--b0)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 34, height: 34, color: 'var(--tm)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Open menu"
        >
          <Menu size={18} strokeWidth={2} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-md"
            style={{ width: 24, height: 24, background: 'var(--accent)', color: '#0d1117' }}
          >
            <FlaskConical size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--t)' }}>
            System Design Lab
          </span>
        </div>

        {/* Right side: search + theme */}
        <div className="flex items-center gap-1">
          {onOpenPalette && (
            <button
              onClick={onOpenPalette}
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{ width: 34, height: 34, color: 'var(--tm)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label="Search"
            >
              <Search size={16} strokeWidth={2} />
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Drawer backdrop + panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
              style={{ width: 'min(85vw, 300px)' }}
            >
              {/* Close button inside drawer */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 30, height: 30, color: 'var(--tm)', background: 'var(--s3)' }}
                  aria-label="Close menu"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
              <Sidebar
                onClose={() => setOpen(false)}
                onOpenPalette={onOpenPalette}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
