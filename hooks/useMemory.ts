'use client';
import { useState, useEffect, useCallback } from 'react';

export interface AxiomMemory {
  studied_concepts: string[];
  weak_areas: string[];
  strong_areas: string[];
  quiz_scores: Record<string, number>;
  interview_sessions: number;
  preferred_style: string;
  last_session: string | null;
  total_messages: number;
}

const DEFAULT_MEMORY: AxiomMemory = {
  studied_concepts: [],
  weak_areas: [],
  strong_areas: [],
  quiz_scores: {},
  interview_sessions: 0,
  preferred_style: '',
  last_session: null,
  total_messages: 0,
};

const STORAGE_KEY = 'axiom-memory-v1';

export function useMemory() {
  const [memory, setMemory] = useState<AxiomMemory>(DEFAULT_MEMORY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMemory({ ...DEFAULT_MEMORY, ...JSON.parse(stored) });
      }
    } catch {}
    setLoaded(true);
  }, []);

  const saveMemory = useCallback((updates: Partial<AxiomMemory>) => {
    setMemory(prev => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const addStudiedConcept = useCallback((conceptId: string) => {
    setMemory(prev => {
      if (prev.studied_concepts.includes(conceptId)) return prev;
      const next = { ...prev, studied_concepts: [...prev.studied_concepts, conceptId].slice(-30) };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const applyMemoryUpdate = useCallback((update: { weak_areas?: string[]; strong_areas?: string[]; session_note?: string; interview_score?: number } | null) => {
    if (!update) return;
    setMemory(prev => {
      const next = { ...prev };
      if (update.weak_areas?.length) {
        next.weak_areas = [...new Set([...prev.weak_areas, ...update.weak_areas])].slice(-10);
      }
      if (update.strong_areas?.length) {
        next.strong_areas = [...new Set([...prev.strong_areas, ...update.strong_areas])].slice(-10);
      }
      if (update.interview_score !== undefined) {
        next.interview_sessions = prev.interview_sessions + 1;
      }
      next.last_session = new Date().toISOString();
      next.total_messages = prev.total_messages + 1;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearMemory = useCallback(() => {
    setMemory(DEFAULT_MEMORY);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { memory, loaded, saveMemory, addStudiedConcept, applyMemoryUpdate, clearMemory };
}
