'use client';

import { useRef, useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Mic, Send, Square, Zap } from 'lucide-react';
import { useMemory } from '@/hooks/useMemory';
import { useAxiom, AgentMode, Message } from '@/hooks/useAxiom';

interface FloatingMentorProps {
  conceptId: string;
  conceptTitle: string;
  conceptColor: string;
}

/* ── Simple inline renderer (shared subset) ── */

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: 'var(--t)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i} style={{ color: 'var(--t)' }}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return (
        <code key={i} style={{
          background: 'var(--s2)',
          border: '1px solid var(--b0)',
          borderRadius: '0.25rem',
          padding: '0.05em 0.3em',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78em',
          color: 'var(--accent)',
        }}>{part.slice(1, -1)}</code>
      );
    return part;
  });
}

function renderMiniMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: '0.3rem' }} />;
    if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
      const content = line.replace(/^#+\s/, '');
      return (
        <div key={i} style={{ color: 'var(--t)', fontWeight: 600, fontSize: '0.82rem', margin: '0.3rem 0 0.1rem' }}>
          {inlineFormat(content)}
        </div>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.1rem' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0 }}>›</span>
          <span style={{ color: 'var(--tm)', fontSize: '0.8rem', lineHeight: 1.6 }}>{inlineFormat(line.slice(2))}</span>
        </div>
      );
    }
    return (
      <p key={i} style={{ color: 'var(--tm)', fontSize: '0.8rem', lineHeight: 1.65, margin: '0.05rem 0' }}>
        {inlineFormat(line)}
      </p>
    );
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
        height: '0.85em',
        background: 'var(--accent)',
        borderRadius: '1px',
        marginLeft: '2px',
        verticalAlign: 'text-bottom',
      }}
    />
  );
}

/* ── Compact message bubble ── */

function MiniMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.65rem' }}>
        <div style={{
          maxWidth: '78%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          borderRadius: '0.875rem 0.875rem 0.2rem 0.875rem',
          padding: '0.5rem 0.8rem',
          fontSize: '0.8rem',
          color: '#f0f6fc',
          lineHeight: 1.6,
          wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{
        maxWidth: '92%',
        background: 'var(--s2)',
        border: '1px solid var(--b0)',
        borderRadius: '0.2rem 0.875rem 0.875rem 0.875rem',
        padding: '0.5rem 0.8rem',
        wordBreak: 'break-word',
      }}>
        {msg.content ? renderMiniMarkdown(msg.content) : null}
        {msg.isStreaming && (
          msg.content ? <StreamingCursor /> : (
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.15rem 0' }}>
              {[0, 1, 2].map(j => (
                <motion.div
                  key={j}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: j * 0.2 }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--tm)' }}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ── Compact input ── */

function MiniInput({
  mode,
  conceptColor,
  isLoading,
  onSend,
  onStop,
  onModeToggle,
}: {
  mode: AgentMode;
  conceptColor: string;
  isLoading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  onModeToggle: () => void;
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const LIMIT = 600;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
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

  return (
    <div style={{
      padding: '0.6rem',
      borderTop: '1px solid var(--b0)',
      background: 'var(--s1)',
    }}>
      <div style={{
        display: 'flex',
        gap: '0.45rem',
        alignItems: 'flex-end',
        background: 'var(--s2)',
        border: '1px solid var(--b1)',
        borderRadius: '0.75rem',
        padding: '0.45rem 0.6rem',
      }}>
        {/* Interview mode toggle */}
        <button
          onClick={onModeToggle}
          title={mode === 'ask' ? 'Switch to Interview mode' : 'Switch to Ask mode'}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: mode === 'interview' ? 'rgba(248,113,113,0.15)' : 'transparent',
            border: mode === 'interview' ? '1px solid rgba(248,113,113,0.3)' : '1px solid transparent',
            color: mode === 'interview' ? '#f87171' : 'var(--td)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            alignSelf: 'flex-end',
            marginBottom: '0.05rem',
          }}
        >
          <Mic size={13} strokeWidth={2} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, LIMIT))}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'interview' ? 'Interview mode — say "start"…' : 'Ask about this concept…'}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: 'var(--t)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
            minHeight: '24px',
            maxHeight: '96px',
            padding: '0.1rem 0',
          }}
          rows={1}
        />

        {isLoading ? (
          <button
            onClick={onStop}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.25)',
              color: '#f87171',
              cursor: 'pointer',
              alignSelf: 'flex-end',
              marginBottom: '0.05rem',
            }}
          >
            <Square size={11} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: text.trim()
                ? `linear-gradient(135deg, ${conceptColor}cc 0%, ${conceptColor} 100%)`
                : 'var(--s3)',
              border: '1px solid transparent',
              color: text.trim() ? '#fff' : 'var(--td)',
              cursor: text.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
              alignSelf: 'flex-end',
              marginBottom: '0.05rem',
              boxShadow: text.trim() ? `0 2px 8px ${conceptColor}40` : 'none',
            }}
          >
            <Send size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>
      <div style={{ textAlign: 'right', marginTop: '0.3rem', paddingRight: '0.2rem' }}>
        <span style={{ color: 'var(--td)', fontSize: '0.65rem' }}>⌘↵ to send</span>
      </div>
    </div>
  );
}

/* ── FloatingMentor ── */

export default function FloatingMentor({ conceptId, conceptTitle, conceptColor }: FloatingMentorProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AgentMode>('ask');
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { memory, applyMemoryUpdate } = useMemory();
  const { messages, isLoading, suggestedQuestions, sendMessage, stopGeneration } = useAxiom({
    memory,
    onMemoryUpdate: applyMemoryUpdate,
  });

  // Auto-scroll inside panel
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send greeting on first open
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

  const handleSend = useCallback((text: string) => {
    sendMessage(text, mode, conceptId);
  }, [sendMessage, mode, conceptId]);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'ask' ? 'interview' : 'ask');
  }, []);

  const safeColor = conceptColor || '#818cf8';

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mentor-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20, x: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 84,
              right: 24,
              width: 380,
              height: 500,
              zIndex: 51,
              borderRadius: '1.25rem',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg)',
              border: '1px solid var(--b1)',
              boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 20px ${safeColor}18`,
            }}
          >
            {/* Panel header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--b0)',
              background: 'var(--s1)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  flexShrink: 0,
                }}>
                  ✦
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'var(--t)', fontSize: '0.8rem', fontWeight: 700 }}>Axiom</div>
                  <div style={{
                    color: safeColor,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}>
                    {conceptTitle}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {/* Mode badge */}
                {mode === 'interview' && (
                  <span style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    background: 'rgba(248,113,113,0.12)',
                    border: '1px solid rgba(248,113,113,0.25)',
                    color: '#f87171',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                  }}>
                    🎤 Interview
                  </span>
                )}

                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid var(--b0)',
                    color: 'var(--td)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--s2)';
                    e.currentTarget.style.color = 'var(--t)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--td)';
                  }}
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.875rem 0.875rem 0.25rem',
              scrollbarWidth: 'thin',
            }}>
              {messages.length === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #818cf8 0%, #34d399 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      margin: '0 auto 0.75rem',
                    }}>
                      ✦
                    </div>
                    <div style={{ color: 'var(--tm)', fontSize: '0.8rem' }}>Loading context…</div>
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <MiniMessage key={msg.id} msg={msg} />
              ))}

              {/* Suggested questions */}
              {suggestedQuestions.length > 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}
                >
                  {suggestedQuestions.slice(0, 2).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      style={{
                        textAlign: 'left',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.625rem',
                        border: '1px solid var(--b0)',
                        background: 'var(--s1)',
                        color: 'var(--tm)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        lineHeight: 1.45,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = `${safeColor}40`;
                        e.currentTarget.style.color = safeColor;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--b0)';
                        e.currentTarget.style.color = 'var(--tm)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MiniInput
              mode={mode}
              conceptColor={safeColor}
              isLoading={isLoading}
              onSend={handleSend}
              onStop={stopGeneration}
              onModeToggle={toggleMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.8 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open
            ? 'var(--s2)'
            : `linear-gradient(135deg, #4f46e5 0%, #34d399 100%)`,
          border: open ? '1px solid var(--b1)' : 'none',
          boxShadow: open
            ? 'none'
            : '0 4px 20px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          color: open ? 'var(--tm)' : '#fff',
          fontSize: '1.1rem',
          transition: 'background 0.2s, box-shadow 0.2s, color 0.2s',
        }}
        aria-label={open ? 'Close Axiom Mentor' : 'Open Axiom Mentor'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 45 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -45 }}
              transition={{ duration: 0.15 }}
              style={{ lineHeight: 1 }}
            >
              ✦
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulse ring — only on initial load when closed */}
      {!open && (
        <motion.div
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 1.8, repeat: 3, repeatType: 'loop', delay: 1 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #34d399 100%)',
            zIndex: 49,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
