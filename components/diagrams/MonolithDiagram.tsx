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
    v: dark ? '#a78bfa' : '#7c3aed',
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function MonolithDiagram() {
  const c = useColors();
  const svcs = ['Auth', 'Orders', 'Users', 'Email', 'Pay', 'Search'];
  const microColors = [c.p, c.g, c.a, c.v, c.r, '#fb923c'];

  return (
    <svg viewBox="0 0 540 360" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes explodePulse { 0%,100%{opacity:0.4;r:18} 50%{opacity:0.9;r:22} }
        @keyframes mpk { 0%{opacity:0;offset-distance:0%}20%{opacity:1}80%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .expl { animation: explodePulse 1.5s infinite; }
        .mpk1{animation:mpk 1.4s 0.0s infinite;offset-path:path('M370,40 L370,80')}
        .mpk2{animation:mpk 1.4s 0.35s infinite;offset-path:path('M448,80 L448,120')}
        .mpk3{animation:mpk 1.4s 0.7s infinite;offset-path:path('M448,180 L448,220')}
      `}</style>

      {/* Left — Monolith */}
      <text x="130" y="22" textAnchor="middle" fill={c.r} fontSize="11" fontWeight="700">🏛️ MONOLITH</text>
      <rect x="20" y="30" width="220" height="240" rx="14" fill={c.card} stroke={c.r} strokeWidth="2" strokeDasharray="6 3" />
      {svcs.map((s, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <g key={s}>
            <rect x={30 + col * 72} y={48 + row * 70} width="64" height="52" rx="8" fill={c.bg} stroke={c.border} strokeWidth="1" />
            <text x={62 + col * 72} y={78 + row * 70} textAnchor="middle" fill={c.t} fontSize="9">{s}</text>
          </g>
        );
      })}
      {/* Shared DB */}
      <rect x="60" y="200" width="140" height="36" rx="8" fill={c.card} stroke={c.border} strokeWidth="1.5" />
      <text x="130" y="222" textAnchor="middle" fill={c.tm} fontSize="9">🗄️ Shared Database</text>
      {/* Explosion */}
      <circle className="expl" cx="130" cy="155" r="18" fill={c.r} />
      <text x="130" y="160" textAnchor="middle" fill="#fff" fontSize="14">💥</text>

      {/* VS */}
      <text x="270" y="170" textAnchor="middle" fill={c.tm} fontSize="12" fontWeight="800">VS</text>

      {/* Right — Microservices */}
      <text x="410" y="22" textAnchor="middle" fill={c.g} fontSize="11" fontWeight="700">🏘️ MICROSERVICES</text>

      {/* Gateway */}
      <rect x="340" y="30" width="140" height="36" rx="10" fill={c.card} stroke={c.p} strokeWidth="1.5" />
      <text x="410" y="53" textAnchor="middle" fill={c.p} fontSize="9">🚪 API Gateway</text>

      {/* Service boxes */}
      {svcs.map((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 330 + col * 90;
        const y = 82 + row * 68;
        const col2 = microColors[i];
        return (
          <g key={s}>
            <rect x={x} y={y} width="78" height="54" rx="8" fill={c.card} stroke={col2} strokeWidth="1.5" />
            <text x={x + 39} y={y + 22} textAnchor="middle" fill={c.t} fontSize="9" fontWeight="600">{s}</text>
            <rect x={x + 10} y={y + 28} width="58" height="14" rx="4" fill={col2} fillOpacity="0.2" />
            <text x={x + 39} y={y + 38} textAnchor="middle" fill={col2} fontSize="7">own DB</text>
          </g>
        );
      })}

      {/* Animated packets */}
      <circle className="mpk1" r="5" fill={c.p} />
      <circle className="mpk2" r="5" fill={c.g} />
      <circle className="mpk3" r="5" fill={c.a} />

      {/* Gateway → svc lines */}
      {[375, 420, 465].map((x, i) => (
        <line key={i} x1={x} y1="66" x2={i < 2 ? 369 + i * 90 : 420} y2="82" stroke={microColors[i]} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      ))}
    </svg>
  );
}
