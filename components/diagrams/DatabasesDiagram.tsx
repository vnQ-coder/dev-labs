'use client';

import { useTheme } from '@/hooks/useTheme';

function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    bg: dark ? '#04080f' : '#f0f6ff', card: dark ? '#0d1422' : '#ffffff',
    card2: dark ? '#141d30' : '#e8f2ff',
    border: dark ? 'rgba(56,189,248,.3)' : 'rgba(3,105,161,.2)',
    p: dark ? '#38bdf8' : '#0369a1', g: dark ? '#34d399' : '#059669',
    a: dark ? '#fbbf24' : '#d97706', v: dark ? '#a78bfa' : '#7c3aed',
    t: dark ? '#e2e8f0' : '#0f172a', tm: dark ? '#64748b' : '#475569',
  };
}

export default function DatabasesDiagram() {
  const c = useColors();
  return (
    <svg viewBox="0 0 520 360" width="100%" style={{ background: c.bg, borderRadius: 12 }}>
      {/* VS badge */}
      <rect x="230" y="140" width="60" height="60" rx="30" fill={c.p} />
      <text x="260" y="176" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">VS</text>

      {/* SQL side */}
      <rect x="20" y="20" width="210" height="310" rx="14" fill={c.card} stroke={c.p} strokeWidth="1.5" />
      <text x="125" y="48" textAnchor="middle" fill={c.p} fontSize="13" fontWeight="700">🗃️ SQL (Relational)</text>
      <text x="125" y="63" textAnchor="middle" fill={c.tm} fontSize="9">PostgreSQL / MySQL</text>

      {/* SQL table */}
      <rect x="30" y="72" width="190" height="18" rx="4" fill={c.p} fillOpacity="0.2" />
      <text x="125" y="84" textAnchor="middle" fill={c.p} fontSize="9" fontWeight="700">id | name | email | created_at</text>
      {[['1','Alice','alice@ex.com'],['2','Bob','bob@ex.com'],['3','Carol','carol@ex.com']].map(([id, name, email], i) => (
        <g key={id}>
          <rect x="30" y={90 + i * 18} width="190" height="18" rx="2" fill={i%2===0 ? c.card2 : 'transparent'} />
          <text x="40" y={103 + i * 18} fill={c.tm} fontSize="8">{id}</text>
          <text x="72" y={103 + i * 18} fill={c.t} fontSize="8">{name}</text>
          <text x="120" y={103 + i * 18} fill={c.tm} fontSize="8">{email}</text>
        </g>
      ))}

      {/* JOIN visualization */}
      <text x="125" y="162" textAnchor="middle" fill={c.tm} fontSize="8">JOIN orders ON orders.user_id = users.id</text>
      <rect x="30" y="168" width="190" height="50" rx="8" fill={c.card2} stroke={c.p} strokeWidth="1" strokeDasharray="3 2" />
      <text x="125" y="185" textAnchor="middle" fill={c.p} fontSize="9">⟕ INNER JOIN</text>
      <text x="125" y="200" textAnchor="middle" fill={c.tm} fontSize="8">users ⟶ orders ⟶ products</text>
      <text x="125" y="213" textAnchor="middle" fill={c.tm} fontSize="7">Cross-table relationships</text>

      {/* SQL pros/cons */}
      <text x="40" y="238" fill={c.g} fontSize="9">✓ ACID transactions</text>
      <text x="40" y="253" fill={c.g} fontSize="9">✓ Complex queries (JOIN)</text>
      <text x="40" y="268" fill={c.g} fontSize="9">✓ Strong consistency</text>
      <text x="40" y="288" fill={c.a} fontSize="9">⚠ Hard to scale horizontally</text>
      <text x="40" y="303" fill={c.a} fontSize="9">⚠ Schema migrations needed</text>

      {/* NoSQL side */}
      <rect x="290" y="20" width="210" height="310" rx="14" fill={c.card} stroke={c.g} strokeWidth="1.5" />
      <text x="395" y="48" textAnchor="middle" fill={c.g} fontSize="13" fontWeight="700">📄 NoSQL (Document)</text>
      <text x="395" y="63" textAnchor="middle" fill={c.tm} fontSize="9">MongoDB / Firestore</text>

      {/* JSON doc */}
      <rect x="300" y="72" width="190" height="130" rx="8" fill={c.card2} stroke={c.g} strokeWidth="1" />
      <text x="310" y="89" fill={c.g} fontSize="8" fontFamily="monospace">{'{'}</text>
      <text x="320" y="103" fill={c.p} fontSize="8" fontFamily="monospace">"_id": "abc123",</text>
      <text x="320" y="116" fill={c.p} fontSize="8" fontFamily="monospace">"name": "Alice",</text>
      <text x="320" y="129" fill={c.a} fontSize="8" fontFamily="monospace">"orders": [</text>
      <text x="330" y="142" fill={c.tm} fontSize="8" fontFamily="monospace">{'{ "total": 49.99 },'}</text>
      <text x="330" y="155" fill={c.tm} fontSize="8" fontFamily="monospace">{'{ "total": 99.00 }'}</text>
      <text x="320" y="168" fill={c.a} fontSize="8" fontFamily="monospace">],</text>
      <text x="320" y="181" fill={c.p} fontSize="8" fontFamily="monospace">"tags": ["vip"]</text>
      <text x="310" y="194" fill={c.g} fontSize="8" fontFamily="monospace">{'}'}</text>

      {/* NoSQL pros/cons */}
      <text x="305" y="225" fill={c.g} fontSize="9">✓ Flexible schema</text>
      <text x="305" y="240" fill={c.g} fontSize="9">✓ Horizontal scale</text>
      <text x="305" y="255" fill={c.g} fontSize="9">✓ Fast key lookups</text>
      <text x="305" y="275" fill={c.a} fontSize="9">⚠ No JOIN support</text>
      <text x="305" y="290" fill={c.a} fontSize="9">⚠ Eventual consistency</text>
      <text x="305" y="305" fill={c.a} fontSize="9">⚠ Duplicate data risk</text>
    </svg>
  );
}
