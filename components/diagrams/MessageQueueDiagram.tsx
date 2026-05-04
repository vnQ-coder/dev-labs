'use client';

import { useTheme } from '@/hooks/useTheme';

function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    bg: dark ? '#04080f' : '#f0f6ff', card: dark ? '#0d1422' : '#ffffff',
    border: dark ? 'rgba(251,191,36,.3)' : 'rgba(180,83,9,.2)',
    p: dark ? '#38bdf8' : '#0369a1', g: dark ? '#34d399' : '#059669',
    a: dark ? '#fbbf24' : '#d97706', v: dark ? '#a78bfa' : '#7c3aed',
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function MessageQueueDiagram() {
  const c = useColors();
  const consumers = [
    { label: '📧 Email', color: c.p, y: 80 },
    { label: '📊 Analytics', color: c.g, y: 170 },
    { label: '🔔 Notify', color: c.v, y: 260 },
  ];
  return (
    <svg viewBox="0 0 520 360" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes mqIn { 0%{opacity:0;offset-distance:0%}20%{opacity:1}80%{opacity:1}100%{opacity:0;offset-distance:100%} }
        @keyframes mqOut { 0%{opacity:0;offset-distance:0%}20%{opacity:1}80%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .mqp1{animation:mqIn 1.4s 0.0s infinite;offset-path:path('M162,170 L230,145')}
        .mqp2{animation:mqIn 1.4s 0.35s infinite;offset-path:path('M162,170 L230,160')}
        .mqp3{animation:mqIn 1.4s 0.7s infinite;offset-path:path('M162,170 L230,175')}
        .mq1{animation:mqOut 1.5s 0.0s infinite;offset-path:path('M360,145 L430,100')}
        .mq2{animation:mqOut 1.5s 0.5s infinite;offset-path:path('M360,170 L430,190')}
        .mq3{animation:mqOut 1.5s 1.0s infinite;offset-path:path('M360,195 L430,280')}
      `}</style>

      {/* Producer */}
      <rect x="30" y="140" width="132" height="60" rx="12" fill={c.card} stroke={c.a} strokeWidth="2" />
      <text x="96" y="167" textAnchor="middle" fill={c.t} fontSize="14">⚙️</text>
      <text x="96" y="183" textAnchor="middle" fill={c.a} fontSize="10" fontWeight="700">Order Service</text>
      <text x="96" y="196" textAnchor="middle" fill={c.tm} fontSize="8">Producer</text>

      {/* Arrow to queue */}
      <line x1="162" y1="170" x2="230" y2="170" stroke={c.a} strokeWidth="1.5" />
      <circle className="mqp1" r="5" fill={c.a} />
      <circle className="mqp2" r="5" fill={c.a} opacity="0.7" />
      <circle className="mqp3" r="5" fill={c.a} opacity="0.4" />

      {/* Queue box */}
      <rect x="230" y="100" width="130" height="140" rx="12" fill={c.card} stroke={c.a} strokeWidth="2" />
      <text x="295" y="125" textAnchor="middle" fill={c.a} fontSize="12" fontWeight="700">📨 Queue</text>
      <text x="295" y="140" textAnchor="middle" fill={c.tm} fontSize="8">Kafka / RabbitMQ</text>
      {/* Message stack */}
      {['msg_004','msg_003','msg_002','msg_001'].map((m, i) => (
        <g key={m}>
          <rect x="245" y={152 + i * 20} width="100" height="16" rx="4" fill={c.a} fillOpacity={0.15 + i * 0.05} stroke={c.a} strokeOpacity={0.3} strokeWidth="1" />
          <text x="295" y={164 + i * 20} textAnchor="middle" fill={c.a} fontSize="8">{m}</text>
        </g>
      ))}

      {/* Arrows to consumers */}
      {consumers.map((cn, i) => (
        <line key={i} x1="360" y1={[145, 170, 195][i]} x2="430" y2={cn.y} stroke={cn.color} strokeWidth="1.5" />
      ))}

      {/* Packets to consumers */}
      <circle className="mq1" r="5" fill={c.p} />
      <circle className="mq2" r="5" fill={c.g} />
      <circle className="mq3" r="5" fill={c.v} />

      {/* Consumers */}
      {consumers.map((cn, i) => (
        <g key={i}>
          <rect x="430" y={cn.y - 24} width="78" height="48" rx="10" fill={c.card} stroke={cn.color} strokeWidth="1.5" />
          <text x="469" y={cn.y - 4} textAnchor="middle" fill={c.t} fontSize="11">{cn.label}</text>
          <text x="469" y={cn.y + 11} textAnchor="middle" fill={c.tm} fontSize="8">Consumer</text>
        </g>
      ))}

      {/* Fan-out label */}
      <text x="295" y="258" textAnchor="middle" fill={c.tm} fontSize="8">Fan-out: 1 message → 3 consumers</text>
    </svg>
  );
}
