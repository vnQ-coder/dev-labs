'use client';

import { useRef, useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Square, Trash2, ChevronDown, ChevronUp, Mic, Zap,
  Bug, Moon, MessageCircle, Brain, AlertTriangle, X,
} from 'lucide-react';
import { useMemory } from '@/hooks/useMemory';
import { useAxiom, AgentMode, Message } from '@/hooks/useAxiom';

/* ── Mode config ── */

interface ModeConfig {
  id: AgentMode;
  label: string;
  icon: string;
  color: string;
  tooltip?: string;
}

const MODES: ModeConfig[] = [
  { id: 'ask',       label: 'Ask Anything',  icon: '✦',  color: '#818cf8' },
  { id: 'interview', label: 'Interview Me',   icon: '🎤', color: '#f87171' },
  { id: 'quiz',      label: 'Quiz Me',        icon: '⚡', color: '#fbbf24' },
  { id: 'debug',     label: 'Debug Design',   icon: '🔍', color: '#34d399' },
  { id: 'threeam',   label: '3AM Debug',      icon: '🌙', color: '#94a3b8', tooltip: 'Production incident mode — high-urgency debugging' },
];

/* ── Inline markdown renderer ── */

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} style={{ color: 'var(--t)', fontSize: '1.1rem', fontWeight: 700, margin: '0.75rem 0 0.35rem', letterSpacing: '-0.01em' }}>
          {inlineFormat(line.slice(2))}
        </h1>
      );
      i++; continue;
    }
    // H2
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={i} style={{ color: 'var(--t)', fontSize: '0.95rem', fontWeight: 700, margin: '0.65rem 0 0.25rem' }}>
          {inlineFormat(line.slice(3))}
        </h2>
      );
      i++; continue;
    }
    // H3
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} style={{ color: 'var(--t)', fontSize: '0.875rem', fontWeight: 600, margin: '0.5rem 0 0.2rem' }}>
          {inlineFormat(line.slice(4))}
        </h3>
      );
      i++; continue;
    }
    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ margin: '0.35rem 0', paddingLeft: '1.25rem', listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ color: 'var(--tm)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '0.15rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.05rem' }}>›</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} style={{ margin: '0.35rem 0', paddingLeft: '0', listStyle: 'none' }}>
          {items.map((item, j) => (
            <li key={j} style={{ color: 'var(--tm)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '0.15rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, fontWeight: 600, minWidth: '1rem' }}>{j + 1}.</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(
        <pre key={`code-${i}`} style={{
          background: 'var(--s1)',
          border: '1px solid var(--b0)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          overflowX: 'auto',
          margin: '0.5rem 0',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--t)',
          lineHeight: 1.6,
        }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }
    // Horizontal rule
    if (line === '---' || line === '***') {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--b0)', margin: '0.75rem 0' }} />);
      i++; continue;
    }
    // Empty line — spacing
    if (line.trim() === '') {
      nodes.push(<div key={i} style={{ height: '0.35rem' }} />);
      i++; continue;
    }
    // Normal paragraph
    nodes.push(
      <p key={i} style={{ color: 'var(--tm)', fontSize: '0.875rem', lineHeight: 1.75, margin: '0.1rem 0' }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function inlineFormat(text: string): React.ReactNode {
  // Split on bold (**), italic (*), inline code (`)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--t)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} style={{ color: 'var(--t)' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} style={{
          background: 'var(--s2)',
          border: '1px solid var(--b0)',
          borderRadius: '0.25rem',
          padding: '0.05em 0.35em',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8em',
          color: 'var(--accent)',
        }}>{part.slice(1, -1)}</code>
      );
    }
    return part;
  });
}

/* ── Streaming cursor ── */

function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.65, repeat: Infinity, repeatType: 'reverse' }}
      style={{
        display: 'inline-block',
        width: '2px',
        height: '1em',
        background: 'var(--accent)',
        borderRadius: '1px',
        marginLeft: '2px',
        verticalAlign: 'text-bottom',
      }}
    />
  );
}

/* ── Mode pill ── */

function ModePill({ mode, active, onClick }: { mode: ModeConfig; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: active ? 600 : 500,
          cursor: 'pointer',
          transition: 'all 0.15s',
          background: active ? `${mode.color}18` : 'transparent',
          border: active ? `1px solid ${mode.color}40` : '1px solid transparent',
          color: active ? mode.color : 'var(--tm)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{mode.icon}</span>
        {mode.label}
      </button>
      {mode.tooltip && hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--s2)',
          border: '1px solid var(--b1)',
          color: 'var(--tm)',
          fontSize: '0.7rem',
          padding: '0.3rem 0.6rem',
          borderRadius: '0.4rem',
          whiteSpace: 'nowrap',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          {mode.tooltip}
        </div>
      )}
    </div>
  );
}

/* ── Empty state / welcome card ── */

function WelcomeCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '480px',
          background: 'var(--s1)',
          border: '1px solid var(--b0)',
          borderRadius: '1.25rem',
          padding: '2.5rem 2rem',
        }}
      >
        {/* Logo mark */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          margin: '0 auto 1.25rem',
          boxShadow: '0 4px 20px rgba(129,140,248,0.25)',
        }}>
          ✦
        </div>

        <h2 style={{ color: 'var(--t)', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 0.4rem' }}>
          Axiom Mentor
        </h2>
        <p style={{ color: 'var(--tm)', fontSize: '0.85rem', lineHeight: 1.65, margin: '0 0 2rem' }}>
          Your cross-domain engineering mentor — system design, cloud, and networking in one place.
        </p>

        <div style={{ display: 'grid', gap: '0.6rem', textAlign: 'left' }}>
          {MODES.map(m => (
            <div key={m.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.65rem 0.9rem',
              borderRadius: '0.75rem',
              background: 'var(--s2)',
              border: '1px solid var(--b0)',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>{m.icon}</span>
              <div>
                <div style={{ color: m.color, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>
                  {m.label}
                </div>
                <div style={{ color: 'var(--td)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  {m.id === 'ask' && 'Ask any engineering question — architecture, tradeoffs, best practices.'}
                  {m.id === 'interview' && 'Practice FAANG-style system design interviews with live feedback.'}
                  {m.id === 'quiz' && 'Test your knowledge with adaptive, concept-specific quizzes.'}
                  {m.id === 'debug' && 'Walk through a design and spot bottlenecks, SPOFs, and issues.'}
                  {m.id === 'threeam' && 'Simulates a production incident — triage under pressure.'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ color: 'var(--td)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Type a message below to get started.
        </p>
      </motion.div>
    </div>
  );
}

/* ── Chat message ── */

function ChatMessage({ msg, isLast, suggestedQuestions, onSuggestionClick }: {
  msg: Message;
  isLast: boolean;
  suggestedQuestions: string[];
  onSuggestionClick: (q: string) => void;
}) {
  const isUser = msg.role === 'user';
  const modeConfig = MODES.find(m => m.id === msg.mode);

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}
      >
        <div style={{
          maxWidth: '72%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          borderRadius: '1rem 1rem 0.25rem 1rem',
          padding: '0.65rem 1rem',
          fontSize: '0.875rem',
          color: '#f0f6fc',
          lineHeight: 1.65,
          wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ marginBottom: '1rem' }}
    >
      {/* Mode badge */}
      {modeConfig && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem' }}>{modeConfig.icon}</span>
          <span style={{ color: modeConfig.color, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {modeConfig.label}
          </span>
        </div>
      )}

      <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--b0)',
        borderRadius: '0.25rem 1rem 1rem 1rem',
        padding: '0.85rem 1.1rem',
        maxWidth: '88%',
        wordBreak: 'break-word',
      }}>
        {msg.content ? renderMarkdown(msg.content) : null}
        {msg.isStreaming && (
          msg.content ? <StreamingCursor /> : (
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', padding: '0.25rem 0' }}>
              {[0, 1, 2].map(j => (
                <motion.div
                  key={j}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: j * 0.2 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tm)' }}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Suggested questions */}
      {isLast && !msg.isStreaming && suggestedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', maxWidth: '88%' }}
        >
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(q)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid var(--b1)',
                background: 'var(--s1)',
                color: 'var(--tm)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)';
                e.currentTarget.style.color = '#818cf8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--b1)';
                e.currentTarget.style.color = 'var(--tm)';
              }}
            >
              {q}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Memory panel ── */

function MemoryPanel({ memory, onClear }: { memory: ReturnType<typeof useMemory>['memory']; onClear: () => void }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      background: 'var(--s1)',
      border: '1px solid var(--b0)',
      borderRadius: '0.875rem',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'transparent',
          cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid var(--b0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={13} strokeWidth={2} color="var(--accent)" />
          <span style={{ color: 'var(--t)', fontSize: '0.78rem', fontWeight: 600 }}>Memory</span>
        </div>
        {collapsed
          ? <ChevronDown size={13} color="var(--td)" />
          : <ChevronUp size={13} color="var(--td)" />
        }
      </button>

      {!collapsed && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <StatChip label="Concepts" value={memory.studied_concepts.length} />
            <StatChip label="Sessions" value={memory.interview_sessions} />
          </div>

          {/* Weak areas */}
          {memory.weak_areas.length > 0 && (
            <div>
              <div style={{ color: 'var(--td)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Needs Work
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {memory.weak_areas.slice(0, 5).map((a, i) => (
                  <span key={i} style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    color: '#f87171',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Strong areas */}
          {memory.strong_areas.length > 0 && (
            <div>
              <div style={{ color: 'var(--td)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Strengths
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {memory.strong_areas.slice(0, 5).map((a, i) => (
                  <span key={i} style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    color: '#34d399',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {memory.studied_concepts.length === 0 && memory.weak_areas.length === 0 && (
            <p style={{ color: 'var(--td)', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem 0' }}>
              No memory yet. Start chatting!
            </p>
          )}

          {/* Clear button */}
          {confirmClear ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => { onClear(); setConfirmClear(false); }}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(248,113,113,0.15)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Confirm Clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--s2)',
                  border: '1px solid var(--b0)',
                  color: 'var(--tm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                width: '100%',
                padding: '0.4rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                border: '1px solid var(--b0)',
                color: 'var(--td)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--b0)';
                e.currentTarget.style.color = 'var(--td)';
              }}
            >
              <Trash2 size={11} strokeWidth={2} />
              Clear Memory
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: 'var(--s2)',
      border: '1px solid var(--b0)',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      textAlign: 'center',
    }}>
      <div style={{ color: 'var(--t)', fontSize: '1.1rem', fontWeight: 700 }}>{value}</div>
      <div style={{ color: 'var(--td)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>{label.toUpperCase()}</div>
    </div>
  );
}

/* ── Input area ── */

function InputArea({
  mode,
  isLoading,
  onSend,
  onStop,
}: {
  mode: AgentMode;
  isLoading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeConfig = MODES.find(m => m.id === mode)!;
  const LIMIT = 600;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  const handleSend = useCallback(() => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isLoading, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const charsLeft = LIMIT - text.length;
  const nearLimit = charsLeft < 80;

  return (
    <div style={{
      padding: '0.75rem 1rem 1rem',
      borderTop: '1px solid var(--b0)',
      background: 'var(--bg)',
    }}>
      <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--b1)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
        onFocus={() => {}}
      >
        {/* Mode badge row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.875rem 0',
        }}>
          <span style={{ fontSize: '0.8rem' }}>{modeConfig.icon}</span>
          <span style={{ color: modeConfig.color, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {modeConfig.label}
          </span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, LIMIT))}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'ask' ? 'Ask anything about system design, cloud, or networking…' :
            mode === 'interview' ? 'Say "start" to begin an interview, or ask for a specific topic…' :
            mode === 'quiz' ? 'Say "quiz me on caching" or pick any topic…' :
            mode === 'debug' ? 'Describe your system design and I\'ll find the weak spots…' :
            'Describe your production incident — I\'ll help you triage fast…'
          }
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '0.5rem 0.875rem',
            color: 'var(--t)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.65,
            minHeight: '44px',
            maxHeight: '120px',
          }}
          rows={1}
        />

        {/* Bottom action row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.875rem 0.65rem',
        }}>
          <span style={{
            fontSize: '0.7rem',
            color: nearLimit ? '#f87171' : 'var(--td)',
            transition: 'color 0.15s',
          }}>
            {nearLimit ? `${charsLeft} chars left` : '⌘↵ to send'}
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isLoading ? (
              <button
                onClick={onStop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(248,113,113,0.12)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Square size={12} strokeWidth={2.5} />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.5rem',
                  background: text.trim() ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'var(--s2)',
                  border: '1px solid transparent',
                  color: text.trim() ? '#fff' : 'var(--td)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: text.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  boxShadow: text.trim() ? '0 2px 8px rgba(79,70,229,0.35)' : 'none',
                }}
              >
                <Send size={12} strokeWidth={2.5} />
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Error banner ── */

function ErrorBanner({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1rem',
        background: 'rgba(248,113,113,0.08)',
        borderBottom: '1px solid rgba(248,113,113,0.2)',
        fontSize: '0.8rem',
        color: '#f87171',
      }}
    >
      <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{error}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0.1rem' }}>
        <X size={13} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

/* ── Main MentorPage ── */

export default function MentorPage() {
  const [mode, setMode] = useState<AgentMode>('ask');
  const { memory, loaded, applyMemoryUpdate, clearMemory } = useMemory();
  const { messages, isLoading, suggestedQuestions, error, sendMessage, clearConversation, stopGeneration } = useAxiom({
    memory,
    onMemoryUpdate: applyMemoryUpdate,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset dismissed state when new error appears
  useEffect(() => {
    if (error) setErrorDismissed(false);
  }, [error]);

  const handleSend = useCallback((text: string) => {
    sendMessage(text, mode);
  }, [sendMessage, mode]);

  const handleSuggestion = useCallback((q: string) => {
    sendMessage(q, mode);
  }, [sendMessage, mode]);

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--td)', fontSize: '0.875rem' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* ── Left: Chat column ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        borderRight: '1px solid var(--b0)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--b0)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              flexShrink: 0,
            }}>
              ✦
            </div>
            <div>
              <div style={{ color: 'var(--t)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Axiom Mentor
              </div>
              <div style={{ color: 'var(--td)', fontSize: '0.68rem' }}>
                {messages.length === 0 ? 'Ready' : `${messages.length} messages`}
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                border: '1px solid var(--b0)',
                color: 'var(--td)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--b0)';
                e.currentTarget.style.color = 'var(--td)';
              }}
            >
              <Trash2 size={11} strokeWidth={2} />
              Clear
            </button>
          )}
        </div>

        {/* Mobile mode pills */}
        <div className="lg:hidden" style={{
          display: 'flex',
          gap: '0.4rem',
          padding: '0.65rem 1rem',
          overflowX: 'auto',
          borderBottom: '1px solid var(--b0)',
          flexShrink: 0,
          scrollbarWidth: 'none',
        }}>
          {MODES.map(m => (
            <ModePill key={m.id} mode={m} active={mode === m.id} onClick={() => setMode(m.id)} />
          ))}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && !errorDismissed && (
            <ErrorBanner error={error} onDismiss={() => setErrorDismissed(true)} />
          )}
        </AnimatePresence>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.25rem 0.5rem',
          scrollbarWidth: 'thin',
        }}>
          {messages.length === 0 ? (
            <WelcomeCard />
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  isLast={i === messages.length - 1}
                  suggestedQuestions={i === messages.length - 1 ? suggestedQuestions : []}
                  onSuggestionClick={handleSuggestion}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <InputArea
          mode={mode}
          isLoading={isLoading}
          onSend={handleSend}
          onStop={stopGeneration}
        />
      </div>

      {/* ── Right: Sidebar (desktop only) ── */}
      <div
        className="hidden lg:flex"
        style={{
          width: 280,
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
          overflowY: 'auto',
          flexShrink: 0,
          scrollbarWidth: 'thin',
        }}
      >
        {/* Mode selector */}
        <div>
          <div style={{
            color: 'var(--td)',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            Mode
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {MODES.map(m => (
              <ModePill key={m.id} mode={m} active={mode === m.id} onClick={() => setMode(m.id)} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--b0)' }} />

        {/* Memory panel */}
        <MemoryPanel memory={memory} onClear={clearMemory} />

        {/* Tips */}
        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--b0)',
          borderRadius: '0.875rem',
          padding: '0.875rem 1rem',
        }}>
          <div style={{ color: 'var(--td)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Tips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '⌘↵', tip: 'Send message' },
              { icon: '✦', tip: 'Ask about any concept' },
              { icon: '🎤', tip: 'Practice interviews' },
              { icon: '⚡', tip: 'Test your knowledge' },
            ].map(({ icon, tip }) => (
              <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', width: '1.2rem', textAlign: 'center' }}>{icon}</span>
                <span style={{ color: 'var(--td)', fontSize: '0.75rem' }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
