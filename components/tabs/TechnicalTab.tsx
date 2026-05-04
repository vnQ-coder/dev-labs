'use client';

import { Concept } from '@/lib/types';

export default function TechnicalTab({ concept }: { concept: Concept }) {
  const { te, color } = concept;
  return (
    <div className="space-y-5">
      {/* Definition */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>Definition</div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>{te.def}</p>
      </div>

      {/* Types grid */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color }}>Types</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {te.types.map((t, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}
            >
              <div className="text-sm font-semibold mb-1" style={{ color }}>{t.n}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--tm)' }}>{t.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* When to use */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>When to Use</div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>{te.when}</p>
      </div>

      {/* Tradeoffs */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>Tradeoffs</div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>{te.trade}</p>
      </div>

      {/* Code block */}
      {te.code && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--b1)' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'var(--s3)' }}>
            <span className="text-xs" style={{ color: 'var(--tm)' }}>Code Example</span>
          </div>
          <pre
            className="p-5 text-xs overflow-x-auto leading-relaxed"
            style={{
              background: 'var(--s1)',
              color: 'var(--t)',
              fontFamily: 'var(--font-fira), monospace',
            }}
          >
            <code>{te.code}</code>
          </pre>
        </div>
      )}

      {/* Real world */}
      <div
        className="rounded-2xl p-5"
        style={{ background: `${color}10`, border: `1px solid ${color}30` }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color }}>Real World</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {te.rw.ex.map((ex, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
            >
              {ex}
            </span>
          ))}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--t)' }}>{te.rw.cs}</p>
      </div>
    </div>
  );
}
