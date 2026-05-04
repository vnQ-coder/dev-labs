'use client';

import { useTheme } from '@/hooks/useTheme';

function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    bg: dark ? '#04080f' : '#f0f6ff', card: dark ? '#0d1422' : '#ffffff',
    p: dark ? '#38bdf8' : '#0369a1', g: dark ? '#34d399' : '#059669',
    a: dark ? '#fbbf24' : '#d97706', v: dark ? '#a78bfa' : '#7c3aed',
    r: dark ? '#f87171' : '#dc2626',
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function CAPDiagram() {
  const c = useColors();
  // Triangle vertices
  const top = { x: 260, y: 50 };
  const botL = { x: 100, y: 290 };
  const botR = { x: 420, y: 290 };

  return (
    <svg viewBox="0 0 520 360" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes orbit { 0%{offset-distance:0%} 100%{offset-distance:100%} }
        .cap-dot { animation: orbit 4s linear infinite; offset-path: path('M260,50 L420,290 L100,290 Z'); }
      `}</style>

      {/* Triangle */}
      <polygon
        points={`${top.x},${top.y} ${botR.x},${botR.y} ${botL.x},${botL.y}`}
        fill="transparent"
        stroke={c.v}
        strokeWidth="2"
        strokeDasharray="8 4"
      />

      {/* Zone fills */}
      {/* CP zone (top-left side) */}
      <polygon points={`${top.x},${top.y} ${botL.x},${botL.y} ${(top.x + botL.x) / 2},${(top.y + botL.y) / 2}`}
        fill={c.p} fillOpacity="0.07" />
      {/* AP zone (top-right side) */}
      <polygon points={`${top.x},${top.y} ${botR.x},${botR.y} ${(top.x + botR.x) / 2},${(top.y + botR.y) / 2}`}
        fill={c.g} fillOpacity="0.07" />
      {/* CA zone (bottom) */}
      <polygon points={`${botL.x},${botL.y} ${botR.x},${botR.y} ${260},${290}`}
        fill={c.a} fillOpacity="0.07" />

      {/* Vertices */}
      <circle cx={top.x} cy={top.y} r="28" fill={c.card} stroke={c.p} strokeWidth="2" />
      <text x={top.x} y={top.y - 5} textAnchor="middle" fill={c.p} fontSize="11" fontWeight="700">C</text>
      <text x={top.x} y={top.y + 8} textAnchor="middle" fill={c.p} fontSize="8">Consistency</text>

      <circle cx={botL.x} cy={botL.y} r="28" fill={c.card} stroke={c.g} strokeWidth="2" />
      <text x={botL.x} y={botL.y - 5} textAnchor="middle" fill={c.g} fontSize="11" fontWeight="700">A</text>
      <text x={botL.x} y={botL.y + 8} textAnchor="middle" fill={c.g} fontSize="8">Availability</text>

      <circle cx={botR.x} cy={botR.y} r="28" fill={c.card} stroke={c.a} strokeWidth="2" />
      <text x={botR.x} y={botR.y - 5} textAnchor="middle" fill={c.a} fontSize="11" fontWeight="700">P</text>
      <text x={botR.x} y={botR.y + 8} textAnchor="middle" fill={c.a} fontSize="8">Partition</text>

      {/* Zone labels */}
      <text x="155" y="175" textAnchor="middle" fill={c.p} fontSize="10" fontWeight="700">CP</text>
      <text x="155" y="189" textAnchor="middle" fill={c.tm} fontSize="8">HBase, etcd</text>
      <text x="365" y="175" textAnchor="middle" fill={c.g} fontSize="10" fontWeight="700">AP</text>
      <text x="365" y="189" textAnchor="middle" fill={c.tm} fontSize="8">Cassandra, DynamoDB</text>
      <text x="260" y="268" textAnchor="middle" fill={c.a} fontSize="10" fontWeight="700">CA</text>
      <text x="260" y="282" textAnchor="middle" fill={c.tm} fontSize="8">Single-node SQL</text>

      {/* Animated dot */}
      <circle className="cap-dot" r="7" fill={c.r} />

      {/* Center note */}
      <text x="260" y="185" textAnchor="middle" fill={c.tm} fontSize="8">During network partition:</text>
      <text x="260" y="200" textAnchor="middle" fill={c.tm} fontSize="8">choose C or A, not both</text>
    </svg>
  );
}
