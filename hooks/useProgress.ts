'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sdl-viewed-concepts';

function loadViewed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveViewed(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

export function useProgress() {
  const [viewed, setViewed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setViewed(loadViewed());
  }, []);

  const markViewed = useCallback((id: string) => {
    setViewed(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveViewed(next);
      return next;
    });
  }, []);

  const isViewed = useCallback((id: string) => viewed.has(id), [viewed]);

  return { viewed, markViewed, isViewed, count: viewed.size };
}
