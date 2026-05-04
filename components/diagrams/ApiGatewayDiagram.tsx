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

export default function ApiGatewayDiagram() {
  const c = useColors();
  return (
    <svg viewBox="0 0 540 360" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes agPk { 0%{opacity:0;offset-distance:0%}15%{opacity:1}85%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .ag1 { animation: agPk 1.5s 0s infinite; offset-path: path('M102,80 L200,160'); }
        .ag2 { animation: agPk 1.5s 0.5s infinite; offset-path: path('M102,180 L200,180'); }
        .ag3 { animation: agPk 1.5s 1.0s infinite; offset-path: path('M102,280 L200,200'); }
        .ag4 { animation: agPk 1.4s 0.3s infinite; offset-path: path('M350,135 L430,85'); }
        .ag5 { animation: agPk 1.4s 0.8s infinite; offset-path: path('M350,180 L430,180'); }
        .ag6 { animation: agPk 1.4s 1.3s infinite; offset-path: path('M350,225 L430,275'); }
      `}</style>

      {/* Clients */}
      {[['📱','Mobile',80],['🌐','Web',180],['⚙️','App',280]].map(([icon, label, y], i) => (
        <g key={i}>
          <rect x="18" y={+y - 24} width="84" height="48" rx="10" fill={c.card} stroke={c.border} strokeWidth="1.5" />
          <text x="60" y={+y - 7} textAnchor="middle" fill={c.t} fontSize="14">{icon}</text>
          <text x="60" y={+y + 10} textAnchor="middle" fill={c.tm} fontSize="9">{label}</text>
          <line x1="102" y1={+y} x2="200" y2={[160,180,200][i]} stroke={c.border} strokeWidth="1" strokeDasharray="3 3" />
        </g>
      ))}

      {/* Packets in */}
      {['ag1','ag2','ag3'].map((cls,i) => <circle key={cls} className={cls} r="5" fill={[c.p,c.g,c.a][i]} />)}

      {/* Gateway box */}
      <rect x="200" y="100" width="150" height="160" rx="14" fill={c.card} stroke={c.p} strokeWidth="2" />
      <text x="275" y="130" textAnchor="middle" fill={c.t} fontSize="18">🚪</text>
      <text x="275" y="150" textAnchor="middle" fill={c.p} fontSize="11" fontWeight="700">API Gateway</text>
      {/* Feature pills inside gateway */}
      {[['🔒 Auth',165,c.g],['⏱ Rate Limit',185,c.a],['🔀 Route',205,c.v],['📝 Log',225,c.p]].map(([label, y, col]) => (
        <g key={String(label)}>
          <rect x="215" y={+y - 10} width="120" height="18" rx="6" fill={`${col}20`} stroke={`${col}40`} strokeWidth="1" />
          <text x="275" y={+y + 4} textAnchor="middle" fill={col as string} fontSize="9">{label as string}</text>
        </g>
      ))}
      <line x1="350" y1="135" x2="430" y2="85" stroke={c.border} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="350" y1="180" x2="430" y2="180" stroke={c.border} strokeWidth="1" strokeDasharray="3 3" />
      <line x1="350" y1="225" x2="430" y2="275" stroke={c.border} strokeWidth="1" strokeDasharray="3 3" />

      {/* Packets out */}
      {['ag4','ag5','ag6'].map((cls,i) => <circle key={cls} className={cls} r="5" fill={[c.p,c.g,c.v][i]} />)}

      {/* Services */}
      {[['👤','User Svc',85,c.g],['💳','Payment',180,c.a],['📦','Order Svc',275,c.v]].map(([icon, label, y, col]) => (
        <g key={String(label)}>
          <rect x="430" y={+y - 24} width="96" height="48" rx="10" fill={c.card} stroke={col as string} strokeWidth="1.5" />
          <text x="478" y={+y - 7} textAnchor="middle" fill={c.t} fontSize="13">{icon}</text>
          <text x="478" y={+y + 9} textAnchor="middle" fill={col as string} fontSize="8">{label}</text>
        </g>
      ))}
    </svg>
  );
}
