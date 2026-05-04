'use client';

import { Concept } from '@/lib/types';

export default function AnalogyTab({ concept }: { concept: Concept }) {
  const { a } = concept;
  return (
    <div className="space-y-6">
      {/* Visual */}
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
      >
        <div className="text-6xl mb-4">{a.v}</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--p)', fontFamily: 'var(--font-syne)' }}>
          {a.t}
        </h3>
      </div>

      {/* Text */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
      >
        {a.tx.split('\n\n').map((para, i) => (
          <p key={i} className={`leading-relaxed text-base ${i > 0 ? 'mt-4' : ''}`} style={{ color: 'var(--t)' }}>
            {para}
          </p>
        ))}
      </div>

      {/* Key insight */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: `${concept.color}10`,
          border: `1px solid ${concept.color}40`,
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: concept.color }}>
              Key Insight
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>{a.s}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
