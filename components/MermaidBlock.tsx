'use client';
import { useEffect, useRef, useState } from 'react';

interface MermaidBlockProps {
  code: string;
  mini?: boolean;
}

let mermaidInitialized = false;

export function MermaidBlock({ code, mini = false }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
              darkMode: true,
              background: '#0d1117',
              primaryColor: '#6366f1',
              primaryTextColor: '#e5e7eb',
              primaryBorderColor: '#4f46e5',
              lineColor: '#6b7280',
              secondaryColor: '#1e1b4b',
              tertiaryColor: '#1f2937',
              edgeLabelBackground: '#111827',
              clusterBkg: '#1e1b4b',
              titleColor: '#a5b4fc',
              nodeTextColor: '#e5e7eb',
              noteBkgColor: '#1e1b4b',
              noteTextColor: '#c4b5fd',
              activationBorderColor: '#6366f1',
              activationBkgColor: '#1e1b4b',
              sequenceNumberColor: '#e5e7eb',
              actorBkg: '#1e1b4b',
              actorBorder: '#6366f1',
              actorTextColor: '#e5e7eb',
              actorLineColor: '#4b5563',
              signalColor: '#a5b4fc',
              signalTextColor: '#e5e7eb',
              labelBoxBkgColor: '#1e1b4b',
              labelBoxBorderColor: '#6366f1',
              labelTextColor: '#e5e7eb',
              loopTextColor: '#e5e7eb',
              altSectionBkgColor: '#111827',
              altSectionBkgColor2: '#1e1b4b',
            },
            flowchart: {
              curve: 'basis',
              useMaxWidth: true,
            },
            sequence: {
              useMaxWidth: true,
              boxMargin: 8,
            },
          });
          mermaidInitialized = true;
        }

        const cleanCode = code.trim();
        const { svg } = await mermaid.render(idRef.current, cleanCode);

        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.removeAttribute('width');
          }
          setRendered(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to render diagram');
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div style={{
        margin: mini ? '0.5rem 0' : '1rem 0',
        padding: '0.75rem 1rem',
        background: '#1a0e0e',
        border: '1px solid #7f1d1d',
        borderRadius: '8px',
        fontSize: mini ? '0.7rem' : '0.8rem',
        color: '#fca5a5',
        fontFamily: 'monospace',
      }}>
        <span style={{ color: '#f87171', marginRight: '0.5rem' }}>⚠ Diagram error:</span>
        {error}
        <pre style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.75em', overflowX: 'auto' }}>
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div style={{
      margin: mini ? '0.5rem 0' : '1rem 0',
      padding: mini ? '0.75rem' : '1.25rem',
      background: 'linear-gradient(135deg, #0d1117 0%, #0f0f1a 100%)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: '12px',
      overflowX: 'auto',
      position: 'relative',
    }}>
      {/* Label */}
      <div style={{
        position: 'absolute',
        top: mini ? '6px' : '10px',
        right: mini ? '8px' : '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.65rem',
        color: '#6366f1',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        opacity: 0.8,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
        Diagram
      </div>

      {/* Loading state */}
      {!rendered && !error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '2rem',
          color: '#6b7280',
          fontSize: '0.8rem',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          Rendering diagram...
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: rendered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          minHeight: rendered ? undefined : '1px',
        }}
      />
    </div>
  );
}
