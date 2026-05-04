'use client';

import { useState } from 'react';
import { QUIZ } from '@/lib/data/quiz';

export function useQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null));
  const [showResult, setShowResult] = useState(false);

  const question = QUIZ[current];
  const isAnswered = selected !== null;
  const isCorrect = selected === question.ans;

  function choose(idx: number) {
    if (isAnswered) return;
    setSelected(idx);
    setAnswers(prev => {
      const next = [...prev];
      next[current] = idx;
      return next;
    });
  }

  function next() {
    if (current < QUIZ.length - 1) {
      setCurrent(c => c + 1);
      setSelected(answers[current + 1]);
    } else {
      setShowResult(true);
    }
  }

  function prev() {
    if (current > 0) {
      setCurrent(c => c - 1);
      setSelected(answers[current - 1]);
    }
  }

  function reset() {
    setCurrent(0);
    setSelected(null);
    setAnswers(Array(QUIZ.length).fill(null));
    setShowResult(false);
  }

  const score = answers.filter((a, i) => a === QUIZ[i].ans).length;

  return { question, current, selected, isAnswered, isCorrect, answers, showResult, score, choose, next, prev, reset };
}
