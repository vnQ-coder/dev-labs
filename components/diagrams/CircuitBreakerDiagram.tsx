'use client';

import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';

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

type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export default function CircuitBreakerDiagram() {
  const c = useColors();
  const [state, setState] = useState<State>('CLOSED');

  useEffect(() => {
    const cycle: State[] = ['CLOSED', 'OPEN', 'HALF_OPEN'];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % cycle.length;
      setState(cycle[i]);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const stateColor = state === 'CLOSED' ? c.g : state === 'OPEN' ? c.r : c.a;
  const stateIcon = state === 'CLOSED' ? '🟢' : state === 'OPEN' ? '🔴' : '🟡';

  return (
    <svg viewBox="0 0 520 320" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      <style>{`
        @keyframes cbPk { 0%{opacity:0;offset-distance:0%}20%{opacity:1}80%{opacity:1}100%{opacity:0;offset-distance:100%} }
        .cb1 { animation: cbPk 1.5s 0s infinite; offset-path: path('M110,120 L200,120'); }
        .cb2 { animation: cbPk 1.5s 0.5s infinite; offset-path: path('M310,120 L400,120'); }
      `}</style>

      {/* Service A */}
      <rect x="20" y="96" width="90" height="48" rx="10" fill={c.card} stroke={c.p} strokeWidth="1.5" />
      <text x="65" y="116" textAnchor="middle" fill={c.t} fontSize="12">⚙️</text>
      <text x="65" y="132" textAnchor="middle" fill={c.p} fontSize="9" fontWeight="700">Service A</text>

      {/* Arrow A → breaker */}
      <line x1="110" y1="120" x2="200" y2="120" stroke={c.p} strokeWidth="1.5" />
      <circle className="cb1" r="5" fill={c.p} />

      {/* Circuit Breaker */}
      <rect x="200" y="80" width="110" height="80" rx="12" fill={c.card} stroke={stateColor} strokeWidth="2.5" />
      <text x="255" y="104" textAnchor="middle" fill={c.t} fontSize="11">{stateIcon} Circuit</text>
      <text x="255" y="119" textAnchor="middle" fill={stateColor} fontSize="10" fontWeight="800">{state}</text>
      {/* Switch symbol */}
      <line x1="225" y1="138" x2="240" y2="138" stroke={stateColor} strokeWidth="2" />
      {state === 'CLOSED' && <line x1="240" y1="138" x2="285" y2="138" stroke={stateColor} strokeWidth="2" />}
      {state === 'OPEN' && <line x1="240" y1="138" x2="272" y2="118" stroke={stateColor} strokeWidth="2" />}
      {state === 'HALF_OPEN' && <line x1="240" y1="138" x2="272" y2="128" stroke={stateColor} strokeWidth="2" strokeDasharray="4 2" />}
      <line x1="285" y1="138" x2="310" y2="138" stroke={stateColor} strokeWidth="2" />

      {/* Arrow breaker → B (only if CLOSED or HALF_OPEN) */}
      <line x1="310" y1="120" x2="400" y2="120" stroke={state === 'OPEN' ? c.r : stateColor} strokeWidth="1.5"
        strokeDasharray={state === 'OPEN' ? '5 4' : '0'} opacity={state === 'OPEN' ? 0.4 : 1} />
      {state !== 'OPEN' && <circle className="cb2" r="5" fill={stateColor} />}

      {/* Service B */}
      <rect x="400" y="96" width="100" height="48" rx="10" fill={c.card} stroke={state === 'OPEN' ? c.r : c.g} strokeWidth="1.5" />
      <text x="450" y="116" textAnchor="middle" fill={c.t} fontSize="12">{state === 'OPEN' ? '🔥' : '🟢'}</text>
      <text x="450" y="132" textAnchor="middle" fill={state === 'OPEN' ? c.r : c.g} fontSize="9" fontWeight="700">Service B</text>

      {/* Fallback */}
      <rect x="190" y="205" width="130" height="50" rx="10" fill={c.card} stroke={c.a} strokeWidth="1.5" />
      <text x="255" y="226" textAnchor="middle" fill={c.a} fontSize="10">⚡ Fallback</text>
      <text x="255" y="242" textAnchor="middle" fill={c.tm} fontSize="8">cached/default response</text>
      {state === 'OPEN' && (
        <line x1="255" y1="160" x2="255" y2="205" stroke={c.a} strokeWidth="1.5" strokeDasharray="4 2" />
      )}

      {/* State descriptions */}
      <rect x="20" y="270" width="480" height="38" rx="8" fill={c.card} />
      <text x="260" y="286" textAnchor="middle" fill={stateColor} fontSize="9" fontWeight="700">{state}:</text>
      {state === 'CLOSED' && <text x="260" y="300" textAnchor="middle" fill={c.tm} fontSize="8">Normal — all requests pass through. Tracking failure count.</text>}
      {state === 'OPEN' && <text x="260" y="300" textAnchor="middle" fill={c.tm} fontSize="8">Tripped — all requests fail fast. Returning fallback immediately. 30s timer running.</text>}
      {state === 'HALF_OPEN' && <text x="260" y="300" textAnchor="middle" fill={c.tm} fontSize="8">Testing recovery — 1 trial request allowed. Success → CLOSED, Failure → OPEN.</text>}
    </svg>
  );
}
