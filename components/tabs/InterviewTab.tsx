'use client';

import { useState } from 'react';
import { Concept } from '@/lib/types';

function SafeRichText({ html, className, style }: { html: string; className?: string; style?: React.CSSProperties }) {
  const parts = html.split(/(<strong>.*?<\/strong>)/g);
  return (
    <div className={className} style={style}>
      {parts.map((part, i) => {
        const match = part.match(/^<strong>(.*?)<\/strong>$/);
        return match ? <strong key={i}>{match[1]}</strong> : <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export default function InterviewTab({ concept }: { concept: Concept }) {
  const { interview, color } = concept;
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="space-y-5">
      {/* The question */}
      <div
        className="rounded-2xl p-6"
        style={{ background: `${color}10`, border: `1px solid ${color}40` }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color }}>
          Interview Question
        </div>
        <p className="text-lg font-semibold leading-relaxed" style={{ color: 'var(--t)' }}>
          &ldquo;{interview.q}&rdquo;
        </p>
      </div>

      {/* Model answer — gated */}
      {!showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-[var(--s2)]"
          style={{ border: '1px solid var(--b1)', color: 'var(--tm)' }}
        >
          Show Model Answer
        </button>
      ) : (
        <div className="rounded-2xl p-6" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
              Model Answer
            </div>
            <button
              onClick={() => setShowAnswer(false)}
              className="text-xs transition-colors hover:text-[var(--t)]"
              style={{ color: 'var(--tm)' }}
            >
              Hide
            </button>
          </div>
          <SafeRichText
            html={interview.a}
            className="text-sm leading-relaxed"
            style={{ color: 'var(--t)' }}
          />
        </div>
      )}

      {/* Follow-up questions */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color }}>
          Follow-Up Questions
        </div>
        <div className="space-y-2">
          {interview.fu.map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'var(--s3)', border: '1px solid var(--b0)' }}
            >
              <span className="text-xs font-bold flex-shrink-0 mt-0.5" style={{ color }}>
                Q{i + 1}
              </span>
              <span className="text-sm" style={{ color: 'var(--t)' }}>{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTO tip */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--s2)', border: `1px solid ${color}30` }}
      >
        <div className="flex items-start gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--a)' }}>
              CTO Tip
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>
              Don&apos;t just answer the question — demonstrate you understand the tradeoffs. The best answers include &ldquo;it depends on...&rdquo; followed by the specific constraints that change the decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
