'use client';
import { PathConcept } from '@/lib/profile';

type RowStatus = 'done' | 'active' | 'locked' | 'gap';

interface ConceptRowProps {
  concept: PathConcept;
  conceptTitle: string;
  conceptCat: string;
  status: RowStatus;
  onClick: () => void;
  showConnector?: boolean;
}

export function ConceptRow({ concept, conceptTitle, conceptCat, status, onClick, showConnector = true }: ConceptRowProps) {
  const isDone = status === 'done';
  const isActive = status === 'active';
  const isLocked = status === 'locked' || status === 'gap';

  return (
    <>
      <div
        onClick={isLocked ? undefined : onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 8, marginBottom: 0,
          border: '1px solid transparent',
          cursor: isLocked ? 'default' : 'pointer',
          opacity: isLocked ? 0.4 : 1,
          background: isDone
            ? 'rgba(16,185,129,0.05)'
            : isActive
              ? 'rgba(99,102,241,0.1)'
              : 'transparent',
          borderColor: isDone
            ? 'rgba(16,185,129,0.12)'
            : isActive
              ? 'rgba(99,102,241,0.3)'
              : 'transparent',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          if (!isLocked) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={e => {
          if (!isLocked) (e.currentTarget as HTMLDivElement).style.background =
            isDone ? 'rgba(16,185,129,0.05)' : isActive ? 'rgba(99,102,241,0.1)' : 'transparent';
        }}
      >
        {/* Status icon */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: 800,
          background: isDone ? '#059669' : isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
          border: isDone ? '1.5px solid #059669' : isActive ? '1.5px solid #6366f1' : '1.5px solid rgba(255,255,255,0.15)',
          color: isDone ? 'white' : '#6366f1',
        }}>
          {isDone ? '✓' : isActive ? '▶' : ''}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.78rem', fontWeight: 600, color: '#e5e7eb',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {conceptTitle}
          </div>
          <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: 1 }}>
            {conceptCat}
          </div>
        </div>

        {/* Badge */}
        {isDone && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', letterSpacing: '0.04em' }}>
            DONE
          </span>
        )}
        {isActive && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', letterSpacing: '0.04em' }}>
            UP NEXT
          </span>
        )}
        {status === 'gap' && (
          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#f87171', letterSpacing: '0.04em' }}>
            SKILL GAP
          </span>
        )}
      </div>

      {showConnector && (
        <div style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.06)', margin: '2px 0 2px 18px' }} />
      )}
    </>
  );
}
