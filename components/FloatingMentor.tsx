'use client';

import { useRef, useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Square, ChevronRight, Copy, Check,
  Sparkles, Target, Zap, Bug, Moon,
} from 'lucide-react';
import { useMemory } from '@/hooks/useMemory';
import { useAxiom, AgentMode, Message } from '@/hooks/useAxiom';

interface FloatingMentorProps {
  conceptId: string;
  conceptTitle: string;
  conceptColor: string;
}

/* ─────────────────────────────────────────────
   MODE CONFIG (mirrors MentorPage)
───────────────────────────────────────────── */

interface ModeConfig {
  id: AgentMode;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  thinkingPhrases: string[];
}

const MODES: ModeConfig[] = [
  {
    id: 'ask',
    label: 'Ask',
    emoji: '✦',
    icon: <Sparkles size={11} strokeWidth={2} />,
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    thinkingPhrases: [
      'Searching concept database…',
      'Analyzing architecture patterns…',
      'Cross-referencing design decisions…',
      'Consulting the knowledge graph…',
      'Evaluating tradeoffs…',
      'Formulating a precise answer…',
    ],
  },
  {
    id: 'interview',
    label: 'Interview',
    emoji: '🎤',
    icon: <Target size={11} strokeWidth={2} />,
    color: '#f87171',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
    thinkingPhrases: [
      'Preparing interview scenario…',
      'Loading evaluation rubric…',
      'Setting FAANG difficulty…',
      'Cueing follow-up probes…',
      'Evaluating your answer…',
    ],
  },
  {
    id: 'quiz',
    label: 'Quiz',
    emoji: '⚡',
    icon: <Zap size={11} strokeWidth={2} />,
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
    thinkingPhrases: [
      'Checking your weak areas…',
      'Generating adaptive question…',
      'Calibrating difficulty…',
      'Loading concept data…',
      'Scoring your answer…',
    ],
  },
  {
    id: 'debug',
    label: 'Debug',
    emoji: '🔍',
    icon: <Bug size={11} strokeWidth={2} />,
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    thinkingPhrases: [
      'Scanning for bottlenecks…',
      'Analyzing failure modes…',
      'Checking SPOF patterns…',
      'Stress-testing your design…',
    ],
  },
  {
    id: 'threeam',
    label: '3AM',
    emoji: '🌙',
    icon: <Moon size={11} strokeWidth={2} />,
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)',
    thinkingPhrases: [
      'Initiating incident response…',
      'Triaging the failure…',
      'Analyzing blast radius…',
      'Loading runbooks…',
    ],
  },
];

/* ─────────────────────────────────────────────
   THINKING LOADER — Claude-style rotating phrases
───────────────────────────────────────────── */

function ThinkingLoader({ mode }: { mode: AgentMode }) {
  const cfg = MODES.find(m => m.id === mode) ?? MODES[0];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % cfg.thinkingPhrases.length);
        setVisible(true);
      }, 280);
    }, 1800);
    return () => clearInterval(interval);
  }, [cfg.thinkingPhrases.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '0.1rem 0' }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: cfg.color,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={phraseIdx}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.22 }}
            style={{
              fontSize: '0.72rem',
              color: cfg.color,
              fontWeight: 500,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.01em',
            }}
          >
            {cfg.thinkingPhrases[phraseIdx]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STREAMING CURSOR
───────────────────────────────────────────── */

function StreamingCursor({ color }: { color: string }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      style={{
        display: 'inline-block',
        width: '2px',
        height: '0.9em',
        background: color,
        borderRadius: '1px',
        marginLeft: '2px',
        verticalAlign: 'text-bottom',
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   INLINE MARKDOWN
───────────────────────────────────────────── */

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: 'var(--t)', fontWeight: 650 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i} style={{ color: 'var(--t)', fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return (
        <code key={i} style={{
          background: 'rgba(129,140,248,0.08)',
          border: '1px solid rgba(129,140,248,0.15)',
          borderRadius: '0.3rem',
          padding: '0.05em 0.35em',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78em',
          color: '#818cf8',
        }}>{part.slice(1, -1)}</code>
      );
    return part;
  });
}

/* ─────────────────────────────────────────────
   MINI CODE BLOCK with copy
───────────────────────────────────────────── */

function MiniCodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      margin: '0.5rem 0',
      borderRadius: '0.6rem',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
      background: '#0d1117',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.35rem 0.65rem',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? '#34d399' : '#64748b',
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
            padding: '0.1rem 0.3rem', borderRadius: '0.25rem',
            transition: 'color 0.15s',
          }}
        >
          {copied ? <Check size={9} strokeWidth={2.5} /> : <Copy size={9} strokeWidth={2} />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre style={{
        padding: '0.65rem 0.75rem', overflowX: 'auto', margin: 0,
        fontSize: '0.73rem', fontFamily: 'var(--font-mono)',
        color: '#e2e8f0', lineHeight: 1.65,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MINI MARKDOWN RENDERER
───────────────────────────────────────────── */

function renderMiniMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
      const content = line.replace(/^#+\s/, '');
      nodes.push(
        <div key={i} style={{ color: 'var(--t)', fontWeight: 700, fontSize: '0.82rem', margin: '0.45rem 0 0.2rem', letterSpacing: '-0.01em' }}>
          {inlineFormat(content)}
        </div>
      );
      i++; continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} style={{ margin: '0.35rem 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '0.45rem', display: 'block' }} />
              <span style={{ color: 'var(--tm)', fontSize: '0.8rem', lineHeight: 1.65 }}>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} style={{ margin: '0.35rem 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, fontWeight: 700, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', minWidth: '1rem', marginTop: '0.15rem' }}>{j + 1}.</span>
              <span style={{ color: 'var(--tm)', fontSize: '0.8rem', lineHeight: 1.65 }}>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      nodes.push(<MiniCodeBlock key={`code-${i}`} code={codeLines.join('\n')} lang={lang} />);
      continue;
    }

    if (line === '---') {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--b0)', margin: '0.5rem 0' }} />);
      i++; continue;
    }

    if (line.trim() === '') {
      nodes.push(<div key={i} style={{ height: '0.3rem' }} />);
      i++; continue;
    }

    nodes.push(
      <p key={i} style={{ color: 'var(--tm)', fontSize: '0.82rem', lineHeight: 1.7, margin: '0.1rem 0' }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

/* ─────────────────────────────────────────────
   MINI MESSAGE
───────────────────────────────────────────── */

function MiniMessage({ msg, isLast, suggestedQuestions, onSuggestionClick }: {
  msg: Message;
  isLast: boolean;
  suggestedQuestions: string[];
  onSuggestionClick: (q: string) => void;
}) {
  const isUser = msg.role === 'user';
  const modeCfg = MODES.find(m => m.id === msg.mode) ?? MODES[0];

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}
      >
        <div style={{
          maxWidth: '78%',
          background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 60%, #6366f1 100%)',
          borderRadius: '1rem 1rem 0.2rem 1rem',
          padding: '0.55rem 0.85rem',
          fontSize: '0.82rem',
          color: '#eef2ff',
          lineHeight: 1.65,
          wordBreak: 'break-word',
          boxShadow: '0 2px 12px rgba(79,70,229,0.25)',
        }}>
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ marginBottom: '1.1rem' }}
    >
      {/* Mode label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
        <div style={{
          width: 16,
          height: 16,
          borderRadius: '4px',
          background: `${modeCfg.color}15`,
          border: `1px solid ${modeCfg.color}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: modeCfg.color,
          flexShrink: 0,
        }}>
          {modeCfg.icon}
        </div>
        <span style={{ color: modeCfg.color, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Axiom
        </span>
      </div>

      {/* Content with colored left border */}
      <div style={{
        borderLeft: `2px solid ${modeCfg.color}25`,
        paddingLeft: '0.875rem',
        wordBreak: 'break-word',
      }}>
        {msg.isStreaming && !msg.content ? (
          <ThinkingLoader mode={msg.mode ?? 'ask'} />
        ) : (
          <>
            {msg.content ? renderMiniMarkdown(msg.content) : null}
            {msg.isStreaming && msg.content && <StreamingCursor color={modeCfg.color} />}
          </>
        )}
      </div>

      {/* Suggested questions */}
      {isLast && !msg.isStreaming && suggestedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ paddingLeft: '0.9rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
        >
          <p style={{ color: 'var(--td)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Continue
          </p>
          {suggestedQuestions.slice(0, 2).map((q, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(q)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.45rem 0.65rem',
                borderRadius: '0.55rem',
                border: `1px solid ${modeCfg.color}20`,
                background: `${modeCfg.color}06`,
                color: 'var(--tm)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
                lineHeight: 1.4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${modeCfg.color}10`;
                e.currentTarget.style.borderColor = `${modeCfg.color}35`;
                e.currentTarget.style.color = modeCfg.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${modeCfg.color}06`;
                e.currentTarget.style.borderColor = `${modeCfg.color}20`;
                e.currentTarget.style.color = 'var(--tm)';
              }}
            >
              <ChevronRight size={10} strokeWidth={2.5} style={{ color: modeCfg.color, flexShrink: 0 }} />
              {q}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MINI INPUT
───────────────────────────────────────────── */

function MiniInput({
  mode,
  isLoading,
  onSend,
  onStop,
  onModeChange,
}: {
  mode: AgentMode;
  isLoading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onModeChange: (m: AgentMode) => void;
}) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeCfg = MODES.find(m => m.id === mode)!;
  const LIMIT = 600;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
  }, [text]);

  const handleSend = useCallback(() => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, isLoading, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div style={{
      padding: '0.6rem 0.75rem 0.75rem',
      borderTop: `1px solid ${focused ? modeCfg.color + '25' : 'var(--b0)'}`,
      background: 'var(--bg)',
      flexShrink: 0,
      transition: 'border-color 0.2s',
    }}>
      {/* Mode pills */}
      <div style={{
        display: 'flex',
        gap: '0.3rem',
        marginBottom: '0.5rem',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                fontSize: '0.68rem',
                fontWeight: active ? 650 : 500,
                cursor: 'pointer',
                flexShrink: 0,
                background: active ? `${m.color}15` : 'transparent',
                border: active ? `1px solid ${m.color}35` : '1px solid var(--b0)',
                color: active ? m.color : 'var(--td)',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '0.68rem', lineHeight: 1 }}>{m.emoji}</span>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Input box */}
      <div style={{
        background: 'var(--s1)',
        border: `1px solid ${focused ? modeCfg.color + '35' : 'var(--b1)'}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? `0 0 0 3px ${modeCfg.color}0d` : 'none',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, LIMIT))}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            mode === 'ask' ? 'Ask anything about this concept…' :
            mode === 'interview' ? 'Say "start" for an interview…' :
            mode === 'quiz' ? 'Say "quiz me" to begin…' :
            mode === 'debug' ? 'Describe your design…' :
            'Describe your incident…'
          }
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '0.65rem 0.875rem 0',
            color: 'var(--t)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
            minHeight: '40px',
            maxHeight: '90px',
            display: 'block',
          }}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.3rem 0.75rem 0.55rem',
        }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--td)', fontFamily: 'var(--font-mono)' }}>
            ⌘↵
          </span>
          {isLoading ? (
            <button
              onClick={onStop}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '0.45rem',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#f87171',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Square size={9} strokeWidth={2.5} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '0.45rem',
                background: canSend ? modeCfg.gradient : 'var(--s2)',
                border: '1px solid transparent',
                color: canSend ? '#fff' : 'var(--td)',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: canSend ? 'pointer' : 'default',
                transition: 'all 0.18s',
                boxShadow: canSend ? `0 2px 10px ${modeCfg.color}35` : 'none',
              }}
            >
              <Send size={10} strokeWidth={2.5} />
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function FloatingMentor({ conceptId, conceptTitle, conceptColor }: FloatingMentorProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>('ask');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pulsesDone, setPulsesDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { memory, applyMemoryUpdate } = useMemory();
  const { messages, isLoading, suggestedQuestions, sendMessage, stopGeneration } = useAxiom({
    memory,
    onMemoryUpdate: applyMemoryUpdate,
  });

  const safeColor = conceptColor || '#818cf8';
  const modeCfg = MODES.find(m => m.id === mode)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && !hasGreeted && conceptId) {
      setHasGreeted(true);
      sendMessage(
        `I'm studying "${conceptTitle}". Give me a quick 2-sentence context on what I should focus on, then ask me one question to test my understanding.`,
        'ask',
        conceptId
      );
    }
  }, [open, hasGreeted, conceptId, conceptTitle, sendMessage]);

  // Stop pulse after a few seconds
  useEffect(() => {
    const t = setTimeout(() => setPulsesDone(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleSend = useCallback((text: string) => {
    sendMessage(text, mode, conceptId);
  }, [sendMessage, mode, conceptId]);

  const handleSuggestion = useCallback((q: string) => {
    sendMessage(q, mode, conceptId);
  }, [sendMessage, mode, conceptId]);

  return (
    <>
      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mentor-panel"
            initial={{ opacity: 0, scale: 0.94, y: 16, x: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16, x: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{
              position: 'fixed',
              bottom: 88,
              right: 24,
              width: 390,
              height: 520,
              zIndex: 51,
              borderRadius: '1.25rem',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg)',
              border: `1px solid ${modeCfg.color}20`,
              boxShadow: `0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px ${modeCfg.color}18`,
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderBottom: `1px solid ${modeCfg.color}15`,
              background: 'var(--s1)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                {/* Logo — shifts to match mode color */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${modeCfg.color}80 0%, ${modeCfg.color} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  boxShadow: `0 2px 10px ${modeCfg.color}35`,
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}>
                  ✦
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--t)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                      Axiom
                    </span>
                    <span style={{
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      background: `${modeCfg.color}12`,
                      border: `1px solid ${modeCfg.color}25`,
                      color: modeCfg.color,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      transition: 'all 0.3s',
                    }}>
                      {modeCfg.label}
                    </span>
                  </div>
                  <div style={{
                    color: safeColor,
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '190px',
                    marginTop: '0.05rem',
                  }}>
                    {conceptTitle}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 26, height: 26,
                  borderRadius: '0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid var(--b0)',
                  color: 'var(--td)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--t)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--td)'; }}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Messages ── */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 1rem 0.25rem',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--b1) transparent',
            }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ textAlign: 'center' }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', margin: '0 auto 0.6rem',
                    }}>
                      ✦
                    </div>
                    <span style={{ color: 'var(--td)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      Loading context…
                    </span>
                  </motion.div>
                </div>
              )}

              {messages.map((msg, i) => (
                <MiniMessage
                  key={msg.id}
                  msg={msg}
                  isLast={i === messages.length - 1}
                  suggestedQuestions={i === messages.length - 1 ? suggestedQuestions : []}
                  onSuggestionClick={handleSuggestion}
                />
              ))}

              <div ref={messagesEndRef} style={{ height: '0.5rem' }} />
            </div>

            {/* ── Input ── */}
            <MiniInput
              mode={mode}
              isLoading={isLoading}
              onSend={handleSend}
              onStop={stopGeneration}
              onModeChange={setMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger button ── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.8 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open
            ? 'var(--s2)'
            : 'linear-gradient(135deg, #4f46e5 0%, #818cf8 50%, #34d399 100%)',
          border: open ? '1px solid var(--b1)' : 'none',
          boxShadow: open
            ? 'none'
            : '0 4px 20px rgba(79,70,229,0.45), 0 1px 0 rgba(255,255,255,0.1) inset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          color: open ? 'var(--tm)' : '#fff',
          fontSize: '1.1rem',
          transition: 'background 0.25s, box-shadow 0.25s, color 0.2s',
        }}
        aria-label={open ? 'Close Axiom' : 'Open Axiom Mentor'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, rotate: 45, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -45, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              style={{ lineHeight: 1 }}
            >
              ✦
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Pulse rings ── */}
      {!open && !pulsesDone && (
        <>
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.75 }}
            transition={{ duration: 1.6, repeat: 3, repeatType: 'loop', delay: 1 }}
            style={{
              position: 'fixed', bottom: 24, right: 24,
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #34d399 100%)',
              zIndex: 49, pointerEvents: 'none',
            }}
          />
          <motion.div
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ opacity: 0, scale: 2.1 }}
            transition={{ duration: 2, repeat: 2, repeatType: 'loop', delay: 1.4 }}
            style={{
              position: 'fixed', bottom: 24, right: 24,
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #34d399 100%)',
              zIndex: 48, pointerEvents: 'none',
            }}
          />
        </>
      )}
    </>
  );
}
