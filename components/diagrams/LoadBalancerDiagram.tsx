'use client';

import { useTheme } from '@/hooks/useTheme';

function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    bg: dark ? '#04080f' : '#f0f6ff',
    card: dark ? '#0d1422' : '#ffffff',
    border: dark ? 'rgba(56,189,248,.3)' : 'rgba(3,105,161,.2)',
    p: dark ? '#38bdf8' : '#0369a1',
    g: dark ? '#34d399' : '#059669',
    a: dark ? '#fbbf24' : '#d97706',
    r: dark ? '#f87171' : '#dc2626',
    t: dark ? '#e2e8f0' : '#0f172a',
    tm: dark ? '#64748b' : '#475569',
  };
}

export default function LoadBalancerDiagram() {
  const c = useColors();
  return (
    <svg viewBox="0 0 520 340" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes flowLB1 { 0%{opacity:0;offset-distance:0%} 10%{opacity:1} 90%{opacity:1} 100%{opacity:0;offset-distance:100%} }
        @keyframes flowLB2 { 0%{opacity:0;offset-distance:0%} 10%{opacity:1} 90%{opacity:1} 100%{opacity:0;offset-distance:100%} }
        @keyframes flowLB3 { 0%{opacity:0;offset-distance:0%} 10%{opacity:1} 90%{opacity:1} 100%{opacity:0;offset-distance:100%} }
        @keyframes pulse { 0%,100%{r:4px} 50%{r:6px} }
        .pk1 { animation: flowLB1 1.8s 0s infinite; offset-path: path('M120,80 L200,140'); }
        .pk2 { animation: flowLB1 1.8s 0.6s infinite; offset-path: path('M120,170 L200,170'); }
        .pk3 { animation: flowLB1 1.8s 1.2s infinite; offset-path: path('M120,260 L200,200'); }
        .pk4 { animation: flowLB2 1.6s 0.2s infinite; offset-path: path('M310,105 L390,80'); }
        .pk5 { animation: flowLB2 1.6s 0.8s infinite; offset-path: path('M310,155 L390,170'); }
        .pk6 { animation: flowLB3 1.6s 0.4s infinite; offset-path: path('M310,195 L390,260'); }
      `}</style>

      {/* Clients */}
      {[80, 170, 260].map((y, i) => (
        <g key={i}>
          <rect x="30" y={y - 22} width="88" height="44" rx="10" fill={c.card} stroke={c.border} strokeWidth="1.5" />
          <text x="74" y={y - 5} textAnchor="middle" fill={c.t} fontSize="13">💻</text>
          <text x="74" y={y + 12} textAnchor="middle" fill={c.tm} fontSize="9">Client {i + 1}</text>
        </g>
      ))}

      {/* Lines: clients → LB */}
      {[80, 170, 260].map((y, i) => (
        <line key={i} x1="118" y1={y} x2="200" y2={[140, 170, 200][i]} stroke={c.border} strokeWidth="1.5" strokeDasharray="4 3" />
      ))}

      {/* Packets: clients → LB */}
      {['pk1','pk2','pk3'].map((cls, i) => (
        <circle key={cls} className={cls} r="5" fill={[c.p, c.g, c.a][i]} />
      ))}

      {/* Load Balancer */}
      <rect x="200" y="110" width="110" height="120" rx="14" fill={c.card} stroke={c.p} strokeWidth="2" />
      <text x="255" y="148" textAnchor="middle" fill={c.p} fontSize="22">⚖️</text>
      <text x="255" y="168" textAnchor="middle" fill={c.t} fontSize="11" fontWeight="700">Load</text>
      <text x="255" y="183" textAnchor="middle" fill={c.t} fontSize="11" fontWeight="700">Balancer</text>
      <text x="255" y="218" textAnchor="middle" fill={c.tm} fontSize="8">Round Robin</text>

      {/* Lines: LB → servers */}
      {[[310, 105, 390, 80], [310, 155, 390, 170], [310, 195, 390, 260]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.border} strokeWidth="1.5" strokeDasharray="4 3" />
      ))}

      {/* Packets: LB → servers */}
      {['pk4','pk5','pk6'].map((cls, i) => (
        <circle key={cls} className={cls} r="5" fill={[c.p, c.g, c.a][i]} />
      ))}

      {/* Servers */}
      {[80, 170, 260].map((y, i) => (
        <g key={i}>
          <rect x="390" y={y - 24} width="100" height="48" rx="10" fill={c.card} stroke={c.g} strokeWidth="1.5" />
          <text x="440" y={y - 7} textAnchor="middle" fill={c.t} fontSize="12">🖥️</text>
          <text x="440" y={y + 8} textAnchor="middle" fill={c.tm} fontSize="9">Server {i + 1}</text>
          {/* Health dot */}
          <circle cx="482" cy={y - 14} r="4" fill={c.g}>
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* Legend */}
      <rect x="30" y="305" width="460" height="24" rx="6" fill={c.card} />
      <text x="260" y="321" textAnchor="middle" fill={c.tm} fontSize="9">
        Distributes traffic evenly • Health checks every 5s • Automatic failover
      </text>
    </svg>
  );
}
