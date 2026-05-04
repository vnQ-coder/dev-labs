'use client';

import { useTheme } from '@/hooks/useTheme';

function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    bg: dark ? '#04080f' : '#f0f6ff', card: dark ? '#0d1422' : '#ffffff',
    border: dark ? 'rgba(56,189,248,.3)' : 'rgba(3,105,161,.2)',
    p: dark ? '#38bdf8' : '#0369a1', g: dark ? '#34d399' : '#059669',
    a: dark ? '#fbbf24' : '#d97706', r: dark ? '#f87171' : '#dc2626',
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function CachingDiagram() {
  const c = useColors();
  return (
    <svg viewBox="0 0 480 340" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes hit { 0%{opacity:0;offset-distance:0%}15%{opacity:1}85%{opacity:1}100%{opacity:0;offset-distance:100%} }
        @keyframes miss1 { 0%{opacity:0;offset-distance:0%}15%{opacity:1}85%{opacity:1}100%{opacity:0;offset-distance:100%} }
        @keyframes miss2 { 0%{opacity:0;offset-distance:0%}15%{opacity:1}85%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .hitPk { animation: hit 1.2s 0s infinite; offset-path: path('M120,100 L240,100'); }
        .hitRet { animation: hit 1.2s 0.6s infinite; offset-path: path('M240,115 L120,115'); }
        .missPk1 { animation: miss1 2s 0s infinite; offset-path: path('M120,220 L240,220'); }
        .missPk2 { animation: miss2 2s 0.6s infinite; offset-path: path('M340,240 L340,290'); }
        .missPk3 { animation: miss2 2s 1.1s infinite; offset-path: path('M340,290 L240,260'); }
      `}</style>

      {/* HIT path */}
      <text x="240" y="30" textAnchor="middle" fill={c.g} fontSize="11" fontWeight="700">✅ CACHE HIT (fast path)</text>

      {/* User (hit) */}
      <rect x="30" y="76" width="90" height="48" rx="10" fill={c.card} stroke={c.g} strokeWidth="1.5" />
      <text x="75" y="96" textAnchor="middle" fill={c.t} fontSize="14">👤</text>
      <text x="75" y="113" textAnchor="middle" fill={c.tm} fontSize="9">User</text>

      {/* Cache (Redis) */}
      <rect x="240" y="68" width="120" height="64" rx="12" fill={c.card} stroke={c.g} strokeWidth="2" />
      <text x="300" y="94" textAnchor="middle" fill={c.t} fontSize="16">⚡</text>
      <text x="300" y="110" textAnchor="middle" fill={c.g} fontSize="10" fontWeight="700">Redis Cache</text>
      <text x="300" y="123" textAnchor="middle" fill={c.tm} fontSize="8">~1ms</text>

      {/* Hit lines */}
      <line x1="120" y1="100" x2="240" y2="100" stroke={c.g} strokeWidth="1.5" />
      <line x1="240" y1="115" x2="120" y2="115" stroke={c.g} strokeWidth="1.5" strokeDasharray="4 2" />
      <circle className="hitPk" r="5" fill={c.g} />
      <circle className="hitRet" r="5" fill={c.g} opacity="0.6" />

      {/* MISS path */}
      <text x="240" y="185" textAnchor="middle" fill={c.a} fontSize="11" fontWeight="700">❌ CACHE MISS (slow path)</text>

      {/* User (miss) */}
      <rect x="30" y="196" width="90" height="48" rx="10" fill={c.card} stroke={c.a} strokeWidth="1.5" />
      <text x="75" y="216" textAnchor="middle" fill={c.t} fontSize="14">👤</text>
      <text x="75" y="233" textAnchor="middle" fill={c.tm} fontSize="9">User</text>

      {/* Cache (empty) */}
      <rect x="240" y="196" width="100" height="52" rx="10" fill={c.card} stroke={c.a} strokeWidth="1.5" strokeDasharray="5 3" />
      <text x="290" y="219" textAnchor="middle" fill={c.a} fontSize="12">💨</text>
      <text x="290" y="237" textAnchor="middle" fill={c.tm} fontSize="9">Cache empty</text>

      {/* DB */}
      <rect x="290" y="275" width="100" height="48" rx="10" fill={c.card} stroke={c.border} strokeWidth="1.5" />
      <text x="340" y="297" textAnchor="middle" fill={c.t} fontSize="14">🗄️</text>
      <text x="340" y="313" textAnchor="middle" fill={c.tm} fontSize="9">Database ~100ms</text>

      {/* Miss lines */}
      <line x1="120" y1="220" x2="240" y2="220" stroke={c.a} strokeWidth="1.5" />
      <line x1="340" y1="248" x2="340" y2="275" stroke={c.a} strokeWidth="1.5" strokeDasharray="4 2" />
      <line x1="340" y1="275" x2="240" y2="248" stroke={c.g} strokeWidth="1.5" strokeDasharray="4 2" />
      <circle className="missPk1" r="5" fill={c.a} />
      <circle className="missPk2" r="5" fill={c.a} />
      <circle className="missPk3" r="5" fill={c.g} />

      {/* Labels */}
      <text x="180" y="90" textAnchor="middle" fill={c.g} fontSize="8">request</text>
      <text x="180" y="128" textAnchor="middle" fill={c.g} fontSize="8">HIT ✓</text>
    </svg>
  );
}
