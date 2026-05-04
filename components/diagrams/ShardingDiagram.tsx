'use client';

import { useTheme } from '@/hooks/useTheme';

function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    bg: dark ? '#04080f' : '#f0f6ff', card: dark ? '#0d1422' : '#ffffff',
    border: dark ? 'rgba(56,189,248,.3)' : 'rgba(3,105,161,.2)',
    p: dark ? '#38bdf8' : '#0369a1', g: dark ? '#34d399' : '#059669',
    a: dark ? '#fbbf24' : '#d97706', v: dark ? '#a78bfa' : '#7c3aed',
    o: dark ? '#fb923c' : '#ea580c',
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function ShardingDiagram() {
  const c = useColors();
  const shards = [
    { label: 'Shard 0', range: 'user_id % 4 = 0', color: c.p, x: 60 },
    { label: 'Shard 1', range: 'user_id % 4 = 1', color: c.g, x: 180 },
    { label: 'Shard 2', range: 'user_id % 4 = 2', color: c.a, x: 300 },
    { label: 'Shard 3', range: 'user_id % 4 = 3', color: c.v, x: 420 },
  ];
  return (
    <svg viewBox="0 0 520 320" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes shPk { 0%{opacity:0;offset-distance:0%}20%{opacity:1}80%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .sh0{animation:shPk 1.8s 0.0s infinite;offset-path:path('M260,100 L100,185')}
        .sh1{animation:shPk 1.8s 0.45s infinite;offset-path:path('M260,100 L212,185')}
        .sh2{animation:shPk 1.8s 0.9s infinite;offset-path:path('M260,100 L324,185')}
        .sh3{animation:shPk 1.8s 1.35s infinite;offset-path:path('M260,100 L436,185')}
      `}</style>

      {/* App box */}
      <rect x="180" y="20" width="160" height="70" rx="14" fill={c.card} stroke={c.p} strokeWidth="2" />
      <text x="260" y="48" textAnchor="middle" fill={c.t} fontSize="14">⚙️ App Server</text>
      <text x="260" y="65" textAnchor="middle" fill={c.p} fontSize="9" fontFamily="monospace">hash(userId) % 4</text>
      <text x="260" y="80" textAnchor="middle" fill={c.tm} fontSize="8">→ selects shard</text>

      {/* Lines to shards */}
      {shards.map((s, i) => (
        <line key={i} x1="260" y1="90" x2={s.x + 52} y2="185" stroke={s.color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      ))}

      {/* Animated packets */}
      <circle className="sh0" r="6" fill={c.p} />
      <circle className="sh1" r="6" fill={c.g} />
      <circle className="sh2" r="6" fill={c.a} />
      <circle className="sh3" r="6" fill={c.v} />

      {/* Shard boxes */}
      {shards.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y="185" width="104" height="90" rx="12" fill={c.card} stroke={s.color} strokeWidth="2" />
          <text x={s.x + 52} y="210" textAnchor="middle" fill={c.t} fontSize="13">🗄️</text>
          <text x={s.x + 52} y="228" textAnchor="middle" fill={s.color} fontSize="9" fontWeight="700">{s.label}</text>
          <text x={s.x + 52} y="244" textAnchor="middle" fill={c.tm} fontSize="7">{s.range}</text>
          {/* Mini rows */}
          {[0, 1, 2].map(r => (
            <rect key={r} x={s.x + 10} y={255 + r * 6} width="84" height="4" rx="2" fill={s.color} opacity="0.3" />
          ))}
        </g>
      ))}

      {/* Legend */}
      <rect x="120" y="295" width="280" height="18" rx="6" fill={c.card} />
      <text x="260" y="308" textAnchor="middle" fill={c.tm} fontSize="8">Even distribution • Each shard handles 25% of data</text>
    </svg>
  );
}
