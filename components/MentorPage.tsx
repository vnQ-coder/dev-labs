'use client';

import { useRef, useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Square, Trash2, ChevronRight, Copy, Check,
  Zap, Bug, Moon, Brain, AlertTriangle, X, Sparkles,
  RotateCcw, BookOpen, Target,
} from 'lucide-react';
import { useMemory } from '@/hooks/useMemory';
import { useAxiom, AgentMode, Message } from '@/hooks/useAxiom';
import { MermaidBlock } from '@/components/MermaidBlock';

/* ─────────────────────────────────────────────
   MODE CONFIG
───────────────────────────────────────────── */

interface ModeConfig {
  id: AgentMode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  emoji: string;
  color: string;
  gradient: string;
  desc: string;
  placeholder: string;
  thinkingPhrases: string[];
}

const MODES: ModeConfig[] = [
  {
    id: 'ask',
    label: 'Ask Anything',
    shortLabel: 'Ask',
    icon: <Sparkles size={13} strokeWidth={2} />,
    emoji: '✦',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    desc: 'Engineering questions, architecture deep-dives, tradeoff analysis',
    placeholder: 'Ask anything — system design, cloud, networking, tradeoffs…',
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
    label: 'Interview Me',
    shortLabel: 'Interview',
    icon: <Target size={13} strokeWidth={2} />,
    emoji: '🎤',
    color: '#f87171',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
    desc: 'FAANG-style system design interviews with live feedback',
    placeholder: 'Say "start" for a random question, or name a topic…',
    thinkingPhrases: [
      'Preparing interview scenario…',
      'Loading FAANG evaluation rubric…',
      'Setting difficulty level…',
      'Cueing follow-up probes…',
      'Evaluating your answer…',
      'Calibrating feedback…',
    ],
  },
  {
    id: 'quiz',
    label: 'Quiz Me',
    shortLabel: 'Quiz',
    icon: <Zap size={13} strokeWidth={2} />,
    emoji: '⚡',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
    desc: 'Adaptive MCQ based on your weak spots and study history',
    placeholder: 'Say "quiz me on caching" or pick any concept…',
    thinkingPhrases: [
      'Checking your weak areas…',
      'Generating adaptive question…',
      'Calibrating to your level…',
      'Loading concept data…',
      'Building quiz context…',
      'Scoring your answer…',
    ],
  },
  {
    id: 'debug',
    label: 'Debug Design',
    shortLabel: 'Debug',
    icon: <Bug size={13} strokeWidth={2} />,
    emoji: '🔍',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    desc: 'Paste a design and get bottlenecks, SPOFs, and failure modes',
    placeholder: 'Describe your system design — I\'ll find the weak spots…',
    thinkingPhrases: [
      'Scanning for bottlenecks…',
      'Analyzing failure modes…',
      'Checking SPOF patterns…',
      'Reviewing scalability constraints…',
      'Stress-testing your design…',
      'Building critique report…',
    ],
  },
  {
    id: 'threeam',
    label: '3AM Debug',
    shortLabel: '3AM',
    icon: <Moon size={13} strokeWidth={2} />,
    emoji: '🌙',
    color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)',
    desc: 'Production incident mode — triage under pressure',
    placeholder: 'Describe your production incident — I\'ll help triage fast…',
    thinkingPhrases: [
      'Initiating incident response…',
      'Triaging the failure…',
      'Checking failure signatures…',
      'Analyzing blast radius…',
      'Loading incident runbooks…',
      'Narrowing root cause…',
    ],
  },
];

/* ─────────────────────────────────────────────
   THINKING LOADER (Claude-style rotating phrases)
───────────────────────────────────────────── */

function ThinkingLoader({ mode }: { mode: AgentMode }) {
  const cfg = MODES.find(m => m.id === mode)!;
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIdx(i => (i + 1) % cfg.thinkingPhrases.length);
        setVisible(true);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, [cfg.thinkingPhrases.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.25rem 0' }}>
      {/* Animated dots */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: cfg.color,
            }}
          />
        ))}
      </div>

      {/* Rotating phrase */}
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={phraseIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            style={{
              fontSize: '0.78rem',
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
        height: '1.1em',
        background: color,
        borderRadius: '1px',
        marginLeft: '2px',
        verticalAlign: 'text-bottom',
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   CODE BLOCK with copy button
───────────────────────────────────────────── */

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      margin: '0.75rem 0',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
      background: '#0d1117',
    }}>
      {/* Code header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 0.875rem',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: '#64748b',
          fontWeight: 500,
          textTransform: 'lowercase',
          letterSpacing: '0.03em',
        }}>
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: copied ? '#34d399' : '#64748b',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            padding: '0.2rem 0.4rem',
            borderRadius: '0.35rem',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#64748b'; }}
        >
          {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      {/* Code body */}
      <pre style={{
        padding: '0.875rem 1rem',
        overflowX: 'auto',
        margin: 0,
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
        color: '#e2e8f0',
        lineHeight: 1.7,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MARKDOWN RENDERER
───────────────────────────────────────────── */

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} style={{ color: 'var(--t)', fontSize: '1.15rem', fontWeight: 700, margin: '1rem 0 0.4rem', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          {inlineFormat(line.slice(2))}
        </h1>
      );
      i++; continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={i} style={{ color: 'var(--t)', fontSize: '1rem', fontWeight: 700, margin: '0.875rem 0 0.3rem', letterSpacing: '-0.01em', lineHeight: 1.35 }}>
          {inlineFormat(line.slice(3))}
        </h2>
      );
      i++; continue;
    }
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} style={{ color: 'var(--t)', fontSize: '0.9rem', fontWeight: 600, margin: '0.65rem 0 0.2rem' }}>
          {inlineFormat(line.slice(4))}
        </h3>
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
        <ul key={`ul-${i}`} style={{ margin: '0.5rem 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.35rem', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', display: 'block' }} />
              <span style={{ color: 'var(--tm)', fontSize: '0.9rem', lineHeight: 1.7 }}>{inlineFormat(item)}</span>
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
        <ol key={`ol-${i}`} style={{ margin: '0.5rem 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {items.map((item, j) => (
            <li key={j} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{
                color: 'var(--accent)',
                flexShrink: 0,
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                marginTop: '0.15rem',
                minWidth: '1.25rem',
              }}>{j + 1}.</span>
              <span style={{ color: 'var(--tm)', fontSize: '0.9rem', lineHeight: 1.7 }}>{inlineFormat(item)}</span>
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
      if (lang === 'mermaid') {
        nodes.push(<MermaidBlock key={`mermaid-${i}`} code={codeLines.join('\n')} />);
      } else {
        nodes.push(<CodeBlock key={`code-${i}`} code={codeLines.join('\n')} lang={lang} />);
      }
      continue;
    }

    if (line === '---' || line === '***') {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--b0)', margin: '1rem 0', opacity: 0.6 }} />);
      i++; continue;
    }

    if (line.trim() === '') {
      nodes.push(<div key={i} style={{ height: '0.4rem' }} />);
      i++; continue;
    }

    nodes.push(
      <p key={i} style={{ color: 'var(--tm)', fontSize: '0.9rem', lineHeight: 1.8, margin: '0.15rem 0' }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--t)', fontWeight: 650 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} style={{ color: 'var(--t)', fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} style={{
          background: 'rgba(129,140,248,0.08)',
          border: '1px solid rgba(129,140,248,0.15)',
          borderRadius: '0.3rem',
          padding: '0.05em 0.4em',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82em',
          color: '#818cf8',
        }}>{part.slice(1, -1)}</code>
      );
    }
    return part;
  });
}

/* ─────────────────────────────────────────────
   WELCOME SCREEN
───────────────────────────────────────────── */

function WelcomeScreen({ onModeSelect, onSend }: {
  onModeSelect: (m: AgentMode) => void;
  onSend: (text: string, mode: AgentMode) => void;
}) {
  const starters = [
    { mode: 'ask' as AgentMode,       text: 'Explain database sharding vs partitioning' },
    { mode: 'interview' as AgentMode, text: 'Start a system design interview' },
    { mode: 'debug' as AgentMode,     text: 'Review my load balancer design' },
    { mode: 'quiz' as AgentMode,      text: 'Quiz me on distributed systems' },
    { mode: 'threeam' as AgentMode,   text: 'My Redis cluster is down — help me triage' },
    { mode: 'ask' as AgentMode,       text: 'When should I use Kafka vs RabbitMQ?' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '2rem 1.5rem',
    }}>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', marginBottom: '2.5rem' }}
      >
        {/* Animated logo */}
        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 1.25rem' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #818cf8, #34d399, #fbbf24, #f87171, #818cf8)',
              opacity: 0.15,
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 3,
            borderRadius: '50%',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 50%, #34d399 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              boxShadow: '0 4px 24px rgba(129,140,248,0.35)',
            }}>
              ✦
            </div>
          </div>
        </div>

        <h1 style={{
          color: 'var(--t)',
          fontSize: '1.75rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 0.5rem',
          lineHeight: 1.1,
        }}>
          Axiom Mentor
        </h1>
        <p style={{
          color: 'var(--tm)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          maxWidth: '380px',
          margin: '0 auto',
        }}>
          Your senior engineer on call — system design, cloud, networking, and real-time incident triage.
        </p>
      </motion.div>

      {/* Mode cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.65rem',
          width: '100%',
          maxWidth: '580px',
          marginBottom: '2rem',
        }}
      >
        {MODES.map((m, idx) => (
          <motion.button
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + idx * 0.06 }}
            onClick={() => onModeSelect(m.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.875rem',
              background: `${m.color}08`,
              border: `1px solid ${m.color}20`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${m.color}12`;
              e.currentTarget.style.borderColor = `${m.color}35`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${m.color}08`;
              e.currentTarget.style.borderColor = `${m.color}20`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: `${m.color}18`,
              border: `1px solid ${m.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: m.color,
              marginTop: '0.05rem',
            }}>
              {m.icon}
            </div>
            <div>
              <div style={{ color: m.color, fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.2rem', letterSpacing: '-0.01em' }}>
                {m.label}
              </div>
              <div style={{ color: 'var(--td)', fontSize: '0.72rem', lineHeight: 1.5 }}>
                {m.desc}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Quick starters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        style={{ width: '100%', maxWidth: '580px' }}
      >
        <p style={{ color: 'var(--td)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.65rem', textAlign: 'center' }}>
          Quick start
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {starters.map((s, i) => {
            const modeCfg = MODES.find(m => m.id === s.mode)!;
            return (
              <button
                key={i}
                onClick={() => onSend(s.text, s.mode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.875rem',
                  borderRadius: '0.65rem',
                  background: 'transparent',
                  border: '1px solid var(--b0)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--s1)';
                  e.currentTarget.style.borderColor = `${modeCfg.color}30`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--b0)';
                }}
              >
                <span style={{ fontSize: '0.8rem', flexShrink: 0, color: modeCfg.color }}>{modeCfg.emoji}</span>
                <span style={{ color: 'var(--tm)', fontSize: '0.82rem', flex: 1, lineHeight: 1.4 }}>{s.text}</span>
                <ChevronRight size={13} strokeWidth={2} style={{ color: 'var(--td)', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHAT MESSAGE
───────────────────────────────────────────── */

function ChatMessage({ msg, isLast, suggestedQuestions, onSuggestionClick }: {
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
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}
      >
        <div style={{
          maxWidth: '75%',
          background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 60%, #6366f1 100%)',
          borderRadius: '1.1rem 1.1rem 0.2rem 1.1rem',
          padding: '0.75rem 1.1rem',
          fontSize: '0.9rem',
          color: '#eef2ff',
          lineHeight: 1.7,
          wordBreak: 'break-word',
          boxShadow: '0 2px 16px rgba(79,70,229,0.25)',
        }}>
          {msg.content}
        </div>
      </motion.div>
    );
  }

  // Assistant message
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ marginBottom: '1.75rem' }}
    >
      {/* Mode label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '0.65rem',
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '5px',
          background: `${modeCfg.color}15`,
          border: `1px solid ${modeCfg.color}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: modeCfg.color,
        }}>
          {modeCfg.icon}
        </div>
        <span style={{
          color: modeCfg.color,
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
        }}>
          Axiom · {modeCfg.label}
        </span>
      </div>

      {/* Content */}
      <div style={{
        borderLeft: `2px solid ${modeCfg.color}25`,
        paddingLeft: '1rem',
        wordBreak: 'break-word',
      }}>
        {msg.isStreaming && !msg.content ? (
          <ThinkingLoader mode={msg.mode ?? 'ask'} />
        ) : (
          <>
            {msg.content ? renderMarkdown(msg.content) : null}
            {msg.isStreaming && msg.content && (
              <StreamingCursor color={modeCfg.color} />
            )}
          </>
        )}
      </div>

      {/* Suggested questions */}
      {isLast && !msg.isStreaming && suggestedQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          style={{ paddingLeft: '1.1rem', marginTop: '1.1rem' }}
        >
          <p style={{ color: 'var(--td)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Continue exploring
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(q)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.875rem',
                  borderRadius: '0.6rem',
                  border: `1px solid ${modeCfg.color}20`,
                  background: `${modeCfg.color}06`,
                  color: 'var(--tm)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  lineHeight: 1.4,
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
                <ChevronRight size={12} strokeWidth={2.5} style={{ color: modeCfg.color, flexShrink: 0 }} />
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MODE SELECTOR (sidebar / desktop)
───────────────────────────────────────────── */

function ModeSelector({ mode, onChange }: { mode: AgentMode; onChange: (m: AgentMode) => void }) {
  return (
    <div>
      <p style={{ color: 'var(--td)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        Mode
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.65rem',
                background: active ? `${m.color}12` : 'transparent',
                border: active ? `1px solid ${m.color}30` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                width: '100%',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--s2)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '7px',
                background: active ? `${m.color}18` : 'var(--s2)',
                border: `1px solid ${active ? m.color + '30' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: active ? m.color : 'var(--td)',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}>
                {m.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: active ? m.color : 'var(--tm)',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 500,
                  letterSpacing: '-0.01em',
                }}>
                  {m.label}
                </div>
              </div>
              {active && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MEMORY PANEL
───────────────────────────────────────────── */

function MemoryPanel({ memory, onClear }: {
  memory: ReturnType<typeof useMemory>['memory'];
  onClear: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const hasData = memory.studied_concepts.length > 0 || memory.weak_areas.length > 0 || memory.strong_areas.length > 0;

  return (
    <div style={{
      background: 'var(--s1)',
      border: '1px solid var(--b0)',
      borderRadius: '0.875rem',
      padding: '0.875rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Brain size={12} strokeWidth={2} color="#818cf8" />
          <span style={{ color: 'var(--t)', fontSize: '0.75rem', fontWeight: 650 }}>Memory</span>
        </div>
        {hasData && (
          confirmClear ? (
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={() => { onClear(); setConfirmClear(false); }}
                style={{ padding: '0.2rem 0.5rem', borderRadius: '0.35rem', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ padding: '0.2rem 0.5rem', borderRadius: '0.35rem', background: 'transparent', border: '1px solid var(--b0)', color: 'var(--td)', fontSize: '0.65rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--td)', padding: '0.15rem', display: 'flex', alignItems: 'center' }}
              title="Clear memory"
            >
              <Trash2 size={11} strokeWidth={2} />
            </button>
          )
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: hasData ? '0.75rem' : 0 }}>
        <div style={{ background: 'var(--s2)', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--t)', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {memory.studied_concepts.length}
          </div>
          <div style={{ color: 'var(--td)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: '0.2rem' }}>STUDIED</div>
        </div>
        <div style={{ background: 'var(--s2)', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--t)', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {memory.interview_sessions}
          </div>
          <div style={{ color: 'var(--td)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.05em', marginTop: '0.2rem' }}>SESSIONS</div>
        </div>
      </div>

      {!hasData && (
        <p style={{ color: 'var(--td)', fontSize: '0.73rem', textAlign: 'center', padding: '0.35rem 0', lineHeight: 1.5 }}>
          No memory yet.<br />Start chatting to build context.
        </p>
      )}

      {memory.weak_areas.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ color: 'var(--td)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Needs Work</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {memory.weak_areas.slice(0, 4).map((a, i) => (
              <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: '0.67rem', fontWeight: 500 }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {memory.strong_areas.length > 0 && (
        <div>
          <p style={{ color: 'var(--td)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Strengths</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {memory.strong_areas.slice(0, 4).map((a, i) => (
              <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399', fontSize: '0.67rem', fontWeight: 500 }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   INPUT AREA
───────────────────────────────────────────── */

function InputArea({ mode, isLoading, onSend, onStop, onModeChange }: {
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
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
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

  const charsLeft = LIMIT - text.length;
  const nearLimit = charsLeft < 80;
  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div style={{
      padding: '0.75rem 1.25rem 1.25rem',
      background: 'var(--bg)',
      borderTop: `1px solid ${focused ? modeCfg.color + '25' : 'var(--b0)'}`,
      transition: 'border-color 0.2s',
      flexShrink: 0,
    }}>
      {/* Mode pills - scrollable */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginBottom: '0.65rem',
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.7rem',
                borderRadius: '999px',
                fontSize: '0.73rem',
                fontWeight: active ? 650 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
                background: active ? `${m.color}15` : 'transparent',
                border: active ? `1px solid ${m.color}35` : '1px solid var(--b0)',
                color: active ? m.color : 'var(--td)',
              }}
            >
              <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{m.emoji}</span>
              {m.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Input box */}
      <div style={{
        background: 'var(--s1)',
        border: `1px solid ${focused ? modeCfg.color + '35' : 'var(--b1)'}`,
        borderRadius: '1rem',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? `0 0 0 3px ${modeCfg.color}10` : 'none',
        overflow: 'hidden',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, LIMIT))}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={modeCfg.placeholder}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            padding: '0.875rem 1rem 0',
            color: 'var(--t)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.65,
            minHeight: '48px',
            maxHeight: '130px',
            display: 'block',
          }}
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.875rem 0.7rem',
        }}>
          <span style={{
            fontSize: '0.7rem',
            color: nearLimit ? '#f87171' : 'var(--td)',
            fontFamily: 'var(--font-mono)',
            transition: 'color 0.15s',
          }}>
            {nearLimit ? `${charsLeft} left` : '⌘↵'}
          </span>

          {isLoading ? (
            <button
              onClick={onStop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.875rem',
                borderRadius: '0.6rem',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Square size={11} strokeWidth={2.5} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.875rem',
                borderRadius: '0.6rem',
                background: canSend ? modeCfg.gradient : 'var(--s2)',
                border: '1px solid transparent',
                color: canSend ? '#fff' : 'var(--td)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: canSend ? 'pointer' : 'default',
                transition: 'all 0.18s',
                boxShadow: canSend ? `0 2px 12px ${modeCfg.color}35` : 'none',
              }}
            >
              <Send size={12} strokeWidth={2.5} />
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ERROR BANNER
───────────────────────────────────────────── */

function ErrorBanner({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1.25rem',
        background: 'rgba(248,113,113,0.06)',
        borderBottom: '1px solid rgba(248,113,113,0.15)',
        fontSize: '0.78rem',
        color: '#f87171',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <AlertTriangle size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{error}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', padding: '0.1rem' }}>
        <X size={12} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */

export default function MentorPage() {
  const [mode, setMode] = useState<AgentMode>('ask');
  const { memory, loaded, applyMemoryUpdate, clearMemory } = useMemory();
  const { messages, isLoading, suggestedQuestions, error, sendMessage, clearConversation, stopGeneration } = useAxiom({
    memory,
    onMemoryUpdate: applyMemoryUpdate,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (error) setErrorDismissed(false);
  }, [error]);

  const handleSend = useCallback((text: string, forcedMode?: AgentMode) => {
    sendMessage(text, forcedMode ?? mode);
    if (forcedMode) setMode(forcedMode);
  }, [sendMessage, mode]);

  const handleSuggestion = useCallback((q: string) => {
    sendMessage(q, mode);
  }, [sendMessage, mode]);

  const modeCfg = MODES.find(m => m.id === mode)!;

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ color: 'var(--td)', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}
        >
          loading…
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── LEFT: Chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Chat header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--b0)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Animated logo */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '9px',
              background: `linear-gradient(135deg, ${modeCfg.color}80 0%, ${modeCfg.color} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              flexShrink: 0,
              transition: 'background 0.3s',
              boxShadow: `0 2px 12px ${modeCfg.color}35`,
            }}>
              ✦
            </div>
            <div>
              <div style={{ color: 'var(--t)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Axiom
              </div>
              <div style={{ color: modeCfg.color, fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', lineHeight: 1 }}>
                {modeCfg.label.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {messages.length > 0 && (
              <>
                <span style={{ color: 'var(--td)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                  {messages.length} msgs
                </span>
                <div style={{ width: 1, height: 16, background: 'var(--b0)' }} />
                <button
                  onClick={clearConversation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '0.5rem',
                    background: 'transparent',
                    border: '1px solid var(--b0)',
                    color: 'var(--td)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: 500,
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
                  <RotateCcw size={10} strokeWidth={2.5} />
                  New chat
                </button>
              </>
            )}
          </div>
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
          padding: messages.length === 0 ? '0' : '1.75rem 1.75rem 0.5rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--b1) transparent',
        }}>
          {messages.length === 0 ? (
            <WelcomeScreen onModeSelect={setMode} onSend={handleSend} />
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
              <div ref={messagesEndRef} style={{ height: '1rem' }} />
            </>
          )}
        </div>

        {/* Input */}
        <InputArea
          mode={mode}
          isLoading={isLoading}
          onSend={text => handleSend(text)}
          onStop={stopGeneration}
          onModeChange={setMode}
        />
      </div>

      {/* ── RIGHT: Sidebar (desktop only) ── */}
      <div
        className="hidden lg:flex"
        style={{
          width: 256,
          flexDirection: 'column',
          gap: '0.875rem',
          padding: '1.25rem 1rem',
          borderLeft: '1px solid var(--b0)',
          overflowY: 'auto',
          flexShrink: 0,
          scrollbarWidth: 'thin',
          background: 'var(--s1)',
        }}
      >
        <ModeSelector mode={mode} onChange={setMode} />

        <div style={{ height: '1px', background: 'var(--b0)' }} />

        <MemoryPanel memory={memory} onClear={clearMemory} />

        <div style={{ height: '1px', background: 'var(--b0)' }} />

        {/* Tips */}
        <div>
          <p style={{ color: 'var(--td)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Tips
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '⌘↵',  tip: 'Send message' },
              { icon: '✦',   tip: 'Ask about any concept' },
              { icon: '🎤',  tip: '"Start" to begin interview' },
              { icon: '⚡',  tip: '"Quiz me on caching"' },
              { icon: '🔍',  tip: 'Paste design to debug' },
              { icon: '🌙',  tip: 'Describe prod incident' },
            ].map(({ icon, tip }) => (
              <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', width: '1.25rem', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                <span style={{ color: 'var(--td)', fontSize: '0.73rem', lineHeight: 1.4 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Concepts studied mini-progress */}
        {memory.studied_concepts.length > 0 && (
          <>
            <div style={{ height: '1px', background: 'var(--b0)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BookOpen size={11} strokeWidth={2} color="var(--td)" />
                  <span style={{ color: 'var(--td)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Studied
                  </span>
                </div>
                <span style={{ color: 'var(--td)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                  {memory.studied_concepts.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {memory.studied_concepts.slice(-8).map((c, i) => (
                  <span key={i} style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    background: 'var(--s2)',
                    border: '1px solid var(--b0)',
                    color: 'var(--td)',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
