'use client';
import { useState, useEffect, useCallback } from 'react';
import { LearningPath, loadPath, savePath } from '@/lib/profile';

const COMPLETED_KEY = 'axiom-path-completed-v1';

function loadCompleted(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(COMPLETED_KEY) : null;
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompleted(s: Set<string>): void {
  try { localStorage.setItem(COMPLETED_KEY, JSON.stringify([...s])); } catch {}
}

export function useLearningPath() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = loadPath();
    setPath(stored);

    // Pre-populate completed from sdl-viewed-concepts (existing progress hook storage)
    const viewedRaw = localStorage.getItem('sdl-viewed-concepts');
    const viewed: string[] = viewedRaw ? JSON.parse(viewedRaw) : [];
    const completed = loadCompleted();
    viewed.forEach(id => completed.add(id));
    setCompletedIds(completed);
    setLoaded(true);
  }, []);

  const markConceptDone = useCallback((conceptId: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.add(conceptId);
      saveCompleted(next);
      return next;
    });
  }, []);

  const replacePath = useCallback((newPath: LearningPath) => {
    savePath(newPath);
    setPath(newPath);
    // Reset completed when path is regenerated
    setCompletedIds(new Set());
    try { localStorage.removeItem(COMPLETED_KEY); } catch {}
  }, []);

  const allConceptIds = path
    ? path.phases.flatMap(ph => ph.concepts.map(c => c.conceptId))
    : [];

  const completedCount = allConceptIds.filter(id => completedIds.has(id)).length;
  const totalConcepts = allConceptIds.length;

  /** Returns the first conceptId in the path that isn't done yet */
  const nextConceptId = allConceptIds.find(id => !completedIds.has(id)) ?? null;

  return {
    path,
    completedIds,
    completedCount,
    totalConcepts,
    nextConceptId,
    loaded,
    markConceptDone,
    replacePath,
  };
}
