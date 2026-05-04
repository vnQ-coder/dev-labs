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
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function CDNDiagram() {
  const c = useColors();
  // Edge nodes at corners
  const edges = [
    { x: 80, y: 80, label: '🇺🇸 US East', color: c.p },
    { x: 400, y: 80, label: '🇪🇺 EU West', color: c.g },
    { x: 80, y: 260, label: '🇯🇵 Asia Pacific', color: c.a },
    { x: 400, y: 260, label: '🇦🇪 Middle East', color: c.v },
  ];
  const cx = 240, cy = 170;

  return (
    <svg viewBox="0 0 480 360" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes cdnPk { 0%{opacity:0;offset-distance:0%}20%{opacity:1}80%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .c1{animation:cdnPk 1.6s 0.0s infinite;offset-path:path('M60,105 L60,60')}
        .c2{animation:cdnPk 1.6s 0.4s infinite;offset-path:path('M420,105 L420,60')}
        .c3{animation:cdnPk 1.6s 0.8s infinite;offset-path:path('M60,235 L60,285')}
        .c4{animation:cdnPk 1.6s 1.2s infinite;offset-path:path('M420,235 L420,285')}
      `}</style>

      {/* Origin server (center) */}
      <rect x={cx-52} y={cy-28} width="104" height="56" rx="12" fill={c.card} stroke={c.p} strokeWidth="2" />
      <text x={cx} y={cy-6} textAnchor="middle" fill={c.t} fontSize="16">🏭</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={c.p} fontSize="10" fontWeight="700">Origin Server</text>
      <text x={cx} y={cy+22} textAnchor="middle" fill={c.tm} fontSize="8">Virginia, USA</text>

      {/* Dashed lines to origin */}
      {edges.map((e, i) => (
        <line key={i} x1={e.x} y1={e.y} x2={cx} y2={cy} stroke={e.color} strokeWidth="1" strokeDasharray="5 4" opacity="0.5" />
      ))}

      {/* Edge nodes */}
      {edges.map((e, i) => (
        <g key={i}>
          <rect x={e.x - 58} y={e.y - 28} width="116" height="56" rx="10" fill={c.card} stroke={e.color} strokeWidth="1.5" />
          <text x={e.x} y={e.y - 8} textAnchor="middle" fill={c.t} fontSize="11">📡 Edge Node</text>
          <text x={e.x} y={e.y + 6} textAnchor="middle" fill={e.color} fontSize="9" fontWeight="600">{e.label}</text>
          <text x={e.x} y={e.y + 19} textAnchor="middle" fill={c.tm} fontSize="8">~5ms local</text>
        </g>
      ))}

      {/* User packets (users sending request to edge) */}
      <circle className="c1" r="5" fill={c.p} />
      <circle className="c2" r="5" fill={c.g} />
      <circle className="c3" r="5" fill={c.a} />
      <circle className="c4" r="5" fill={c.v} />

      {/* User icons */}
      <text x="60" y="58" textAnchor="middle" fill={c.t} fontSize="14">👤</text>
      <text x="420" y="58" textAnchor="middle" fill={c.t} fontSize="14">👤</text>
      <text x="60" y="298" textAnchor="middle" fill={c.t} fontSize="14">👤</text>
      <text x="420" y="298" textAnchor="middle" fill={c.t} fontSize="14">👤</text>

      {/* Legend */}
      <rect x="120" y="320" width="240" height="20" rx="6" fill={c.card} />
      <text x="240" y="334" textAnchor="middle" fill={c.tm} fontSize="8">Dashed = cache miss → fetch from origin</text>
    </svg>
  );
}
