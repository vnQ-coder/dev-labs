'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz } from '@/hooks/useQuiz';
import { QUIZ } from '@/lib/data/quiz';
import { CONCEPTS } from '@/lib/data/concepts';

export default function Quiz() {
  const { question, current, selected, isAnswered, isCorrect, showResult, score, choose, next, prev, reset } = useQuiz();

  if (showResult) return <ResultScreen score={score} total={QUIZ.length} onReset={reset} />;

  const reviewConcept = question.conceptId
    ? CONCEPTS.find(c => c.id === question.conceptId)
    : null;

  return (
    <div className="min-h-full p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--r)' }}>
          System Design Quiz
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--s3)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((current + 1) / QUIZ.length) * 100}%`, background: 'var(--r)' }}
            />
          </div>
          <span className="text-sm flex-shrink-0" style={{ color: 'var(--tm)' }}>
            {current + 1} / {QUIZ.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <div
            className="rounded-2xl p-6 mb-5"
            style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--r)' }}>
              Question {current + 1}
            </div>
            <p className="text-lg leading-relaxed font-medium" style={{ color: 'var(--t)' }}>
              {question.q}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-5">
            {question.opts.map((opt, i) => {
              const isSelected = selected === i;
              const isRight = i === question.ans;
              let borderColor = 'var(--b1)';
              let bg = 'var(--s2)';
              let textColor = 'var(--t)';

              if (isAnswered) {
                if (isRight) { borderColor = 'var(--g)'; bg = 'rgba(52,211,153,0.1)'; textColor = 'var(--g)'; }
                else if (isSelected && !isRight) { borderColor = 'var(--r)'; bg = 'rgba(248,113,113,0.1)'; textColor = 'var(--r)'; }
              } else if (isSelected) {
                borderColor = 'var(--p)';
              }

              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={isAnswered}
                  className="w-full text-left p-4 rounded-xl transition-all"
                  style={{ background: bg, border: `1px solid ${borderColor}`, color: textColor }}
                >
                  <span className="text-sm font-medium mr-3" style={{ color: 'var(--tm)' }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span className="text-sm">{opt}</span>
                  {isAnswered && isRight && <span className="ml-2 text-sm">✓</span>}
                  {isAnswered && isSelected && !isRight && <span className="ml-2 text-sm">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 mb-5"
              style={{
                background: isCorrect ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: isCorrect ? 'var(--g)' : 'var(--r)' }}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--t)' }}>{question.exp}</p>
              {!isCorrect && reviewConcept && (
                <Link
                  href={`/lab?concept=${reviewConcept.id}`}
                  className="text-xs font-medium transition-colors"
                  style={{ color: reviewConcept.color }}
                >
                  Review: {reviewConcept.title} →
                </Link>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={current === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
          style={{ background: 'var(--s2)', border: '1px solid var(--b1)', color: 'var(--t)' }}
        >
          ← Prev
        </button>
        <button
          onClick={next}
          disabled={!isAnswered}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
          style={{ background: 'var(--r)', color: 'var(--bg)' }}
        >
          {current === QUIZ.length - 1 ? 'See Results →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

function ResultScreen({ score, total, onReset }: { score: number; total: number; onReset: () => void }) {
  const pct = Math.round((score / total) * 100);
  const grade =
    pct >= 90 ? 'CTO Level' :
    pct >= 70 ? 'Senior Engineer' :
    pct >= 50 ? 'Mid-Level' :
    'Keep studying';

  const feedback =
    pct >= 90
      ? 'You understand not just the what, but the when and why. The tradeoffs are clear.'
      : pct >= 70
      ? 'Solid foundations. Sharpen your ability to articulate tradeoffs under time pressure.'
      : pct >= 50
      ? 'Review the concepts you missed. Focus on tradeoffs, not just definitions.'
      : 'Study the analogies for each concept, then come back. Understanding beats memorization.';

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--r)' }}>
          {score}/{total} Correct
        </h2>
        <div className="text-5xl font-black mb-1" style={{ color: pct >= 70 ? 'var(--g)' : 'var(--a)' }}>
          {pct}%
        </div>
        <div className="text-base font-semibold mb-6" style={{ color: 'var(--tm)' }}>{grade}</div>

        <div
          className="rounded-2xl p-5 mb-6 max-w-md mx-auto text-left"
          style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tm)' }}>{feedback}</p>
        </div>

        <button
          onClick={onReset}
          className="px-8 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: 'var(--r)', color: 'var(--bg)' }}
        >
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
