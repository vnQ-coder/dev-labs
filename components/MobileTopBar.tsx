'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

export default function MobileTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:hidden"
        style={{
          height: 54,
          background: 'var(--s1)',
          borderBottom: '1px solid var(--b0)',
        }}
      >
        <button onClick={() => setOpen(true)} className="text-xl" aria-label="Open menu">☰</button>
        <div className="flex items-center gap-2">
          <span className="text-base">🧪</span>
          <span className="text-sm font-black" style={{ fontFamily: 'var(--font-syne)', color: 'var(--p)' }}>SDL</span>
        </div>
        <ThemeToggle />
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden" style={{ background: 'rgba(4,8,15,0.75)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden"
            >
              <Sidebar onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
