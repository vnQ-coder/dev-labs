'use client';

import { useTheme } from '@/hooks/useTheme';

function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    bg: dark ? '#04080f' : '#f0f6ff', card: dark ? '#0d1422' : '#ffffff',
    border: dark ? 'rgba(248,113,113,.3)' : 'rgba(185,28,28,.2)',
    p: dark ? '#38bdf8' : '#0369a1', g: dark ? '#34d399' : '#059669',
    a: dark ? '#fbbf24' : '#d97706', r: dark ? '#f87171' : '#dc2626',
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function RateLimitDiagram() {
  const c = useColors();
  const slots = Array.from({ length: 10 }, (_, i) => i);
  const filled = 7;
  return (
    <svg viewBox="0 0 480 320" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes refill { 0%,80%{opacity:0} 90%,100%{opacity:1} }
        @keyframes blocked { 0%{opacity:0;offset-distance:0%}30%{opacity:1;offset-distance:60%}100%{opacity:1;offset-distance:60%} }
        @keyframes allowed { 0%{opacity:0;offset-distance:0%}20%{opacity:1}80%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .rl-allow{animation:allowed 1.8s 0s infinite;offset-path:path('M100,160 L200,160')}
        .rl-block{animation:blocked 1.8s 0.9s infinite;offset-path:path('M100,240 L200,240')}
      `}</style>

      {/* Token bucket */}
      <rect x="165" y="50" width="150" height="190" rx="14" fill={c.card} stroke={c.a} strokeWidth="2" />
      <text x="240" y="78" textAnchor="middle" fill={c.a} fontSize="14" fontWeight="700">Token Bucket</text>
      <text x="240" y="95" textAnchor="middle" fill={c.t} fontSize="22" fontWeight="900">{filled}/10</text>
      <text x="240" y="112" textAnchor="middle" fill={c.tm} fontSize="9">tokens available</text>

      {/* Token slots */}
      <g>
        {slots.map(i => {
          const col = i < 3 ? Math.floor(i / 5) : Math.floor(i / 5);
          const row = i < 5 ? 0 : 1;
          const ix = (i < 5 ? i : i - 5);
          const x = 180 + ix * 26;
          const y = 125 + row * 30;
          const isFull = i < filled;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="10" fill={isFull ? c.a : 'transparent'} stroke={isFull ? c.a : c.tm} strokeWidth="1.5" opacity={isFull ? 1 : 0.4} />
              <text x={x} y={y + 4} textAnchor="middle" fill={isFull ? '#000' : c.tm} fontSize="8">{isFull ? '✓' : '○'}</text>
            </g>
          );
        })}
      </g>

      {/* Refill arrow */}
      <text x="240" y="192" textAnchor="middle" fill={c.g} fontSize="9">↻ +1 token/sec</text>
      <text x="240" y="208" textAnchor="middle" fill={c.tm} fontSize="8">auto refill</text>
      <text x="240" y="230" textAnchor="middle" fill={c.tm} fontSize="8">⏱ resets at window boundary</text>

      {/* Allowed request */}
      <rect x="20" y="140" width="80" height="40" rx="8" fill={c.card} stroke={c.g} strokeWidth="1.5" />
      <text x="60" y="157" textAnchor="middle" fill={c.t} fontSize="10">✅ Request</text>
      <text x="60" y="172" textAnchor="middle" fill={c.g} fontSize="8">allowed</text>
      <circle className="rl-allow" r="5" fill={c.g} />

      {/* Blocked request */}
      <rect x="20" y="220" width="80" height="40" rx="8" fill={c.card} stroke={c.r} strokeWidth="1.5" />
      <text x="60" y="237" textAnchor="middle" fill={c.t} fontSize="10">❌ Request</text>
      <text x="60" y="252" textAnchor="middle" fill={c.r} fontSize="8">blocked 429</text>
      <circle className="rl-block" r="5" fill={c.r} />

      {/* Bucket entry/exit */}
      <rect x="315" y="140" width="90" height="40" rx="8" fill={c.card} stroke={c.g} strokeWidth="1.5" />
      <text x="360" y="157" textAnchor="middle" fill={c.g} fontSize="9">200 OK</text>
      <text x="360" y="172" textAnchor="middle" fill={c.tm} fontSize="8">-1 token</text>

      <line x1="200" y1="160" x2="315" y2="160" stroke={c.g} strokeWidth="1.5" />
      <line x1="200" y1="240" x2="215" y2="240" stroke={c.r} strokeWidth="1.5" />
    </svg>
  );
}
