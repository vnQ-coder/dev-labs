'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square } from 'lucide-react';
import { useLearningPath } from '@/hooks/useLearningPath';
import { useMemory } from '@/hooks/useMemory';
import { useAxiom, AgentMode } from '@/hooks/useAxiom';
import { loadProfile } from '@/lib/profile';
import { PathPanel } from '@/components/PathPanel';
import { MermaidBlock } from '@/components/MermaidBlock';

const GREETING_PHRASES = [
  'Analysing your profile…',
  'Reading your background…',
  'Crafting your introduction…',
  'Almost ready…',
];

const MODE_CONFIG: Record<AgentMode, { label: string; color: string }> = {
  ask: { label: 'Ask', color: '#6366f1' },
  interview: { label: 'Interview', color: '#f59e0b' },
  quiz: { label: 'Quiz', color: '#10b981' },
  debug: { label: 'Debug', color: '#ef4444' },
  threeam: { label: '3AM', color: '#8b5cf6' },
};

function renderPathMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      if (lang === 'mermaid') {
        nodes.push(<MermaidBlock key={`m-${i}`} code={codeLines.join('\n')} />);
      } else {
        nodes.push(
          <pre key={`c-${i}`} style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px', overflowX: 'auto', fontSize: '0.78rem', color: '#e5e7eb', margin: '8px 0' }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
      }
      continue;
    }
    if (line.startsWith('## ')) { nodes.push(<h2 key={i} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f9fafb', margin: '12px 0 6px' }}>{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith('### ')) { nodes.push(<h3 key={i} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb', margin: '10px 0 4px' }}>{line.slice(4)}</h3>); i++; continue; }
    if (line.startsWith('- ')) { nodes.push(<li key={i} style={{ color: '#d1d5db', fontSize: '0.82rem', margin: '2px 0 2px 16px' }}>{line.slice(2)}</li>); i++; continue; }
    if (line.trim() === '') { nodes.push(<div key={i} style={{ height: '0.4rem' }} />); i++; continue; }
    // Inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    nodes.push(
      <p key={i} style={{ color: '#d1d5db', fontSize: '0.82rem', lineHeight: 1.65, margin: '2px 0' }}>
        {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: '#e5e7eb' }}>{p.slice(2, -2)}</strong> : p)}
      </p>
    );
    i++;
  }
  return nodes;
}

export function PathPage() {
  const router = useRouter();
  const { path, completedIds, completedCount, totalConcepts, nextConceptId, loaded, markConceptDone } = useLearningPath();
  const { memory } = useMemory();
  const { messages, isLoading, sendMessage, stopGeneration, suggestedQuestions } = useAxiom({
    memory,
    onMemoryUpdate: () => {},
  });

  const [mode, setMode] = useState<AgentMode>('ask');
  const [input, setInput] = useState('');
  const [greetingSent, setGreetingSent] = useState(false);
  const [greetingPhrase, setGreetingPhrase] = useState(GREETING_PHRASES[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if no path
  useEffect(() => {
    if (loaded && !path) router.replace('/');
  }, [loaded, path, router]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rotate greeting phrases until first message arrives
  useEffect(() => {
    if (messages.length > 0) return;
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % GREETING_PHRASES.length; setGreetingPhrase(GREETING_PHRASES[i]); }, 1600);
    return () => clearInterval(t);
  }, [messages.length]);

  // Send auto-greeting once
  useEffect(() => {
    if (greetingSent || !loaded || !path || !memory) return;
    setGreetingSent(true);
    const profile = loadProfile();
    const skillGaps = path.phases
      .flatMap(ph => ph.concepts.filter(c => c.isSkillGap).map(c => c.conceptId))
      .slice(0, 3).join(', ');
    const firstConcept = nextConceptId || path.phases[0]?.concepts[0]?.conceptId || '';
    const greetingMsg = `My profile: Name=${profile?.name || memory.display_name}, Target role=${path.targetRole}, Current stack=${profile?.currentStack.join(', ') || 'not set'}, Skill gaps identified=${skillGaps || 'none'}, First concept to study=${firstConcept}, Path has ${totalConcepts} concepts across ${path.phases.length} phases. Please greet me personally and introduce my learning path.`;
    sendMessage(greetingMsg, 'path_greeting' as AgentMode);
  }, [loaded, path, memory, greetingSent, nextConceptId, totalConcepts, sendMessage]);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), mode);
    setInput('');
  }

  function handleConceptClick(conceptId: string) {
    markConceptDone(conceptId);
    router.push(`/lab?concept=${conceptId}`);
  }

  if (!loaded || !path) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#09090b' }}>
      {/* Left: Path Panel */}
      <PathPanel
        path={path}
        completedIds={completedIds}
        nextConceptId={nextConceptId}
        completedCount={completedCount}
        onConceptClick={handleConceptClick}
      />

      {/* Right: Mentor Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f9fafb' }}>Axiom</div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>Your personal mentor · {MODE_CONFIG[mode].label} mode</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(Object.keys(MODE_CONFIG) as AgentMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                background: mode === m ? `${MODE_CONFIG[m].color}20` : 'transparent',
                border: `1px solid ${mode === m ? MODE_CONFIG[m].color + '50' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 6, padding: '4px 10px', fontSize: '0.68rem',
                color: mode === m ? MODE_CONFIG[m].color : '#6b7280',
                cursor: 'pointer', fontWeight: mode === m ? 700 : 400,
              }}>
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Loading greeting placeholder */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: 'white', flexShrink: 0, marginTop: 2 }}>A</div>
              <div style={{ borderLeft: '2px solid rgba(99,102,241,0.35)', paddingLeft: 12, paddingTop: 2 }}>
                <AnimatePresence mode="wait">
                  <motion.p key={greetingPhrase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ color: '#6b7280', fontSize: '0.82rem', margin: 0 }}>
                    {greetingPhrase}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Filter out the user-side of the greeting message */}
          {messages
            .filter(m => !(m.role === 'user' && m.mode === ('path_greeting' as AgentMode)))
            .map(msg => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.25)', padding: '9px 13px', borderRadius: '12px 12px 2px 12px', fontSize: '0.82rem', color: '#e5e7eb', maxWidth: '75%' }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: 'white', flexShrink: 0, marginTop: 2 }}>A</div>
                    <div style={{ borderLeft: '2px solid rgba(99,102,241,0.35)', paddingLeft: 12, paddingTop: 2, flex: 1 }}>
                      {renderPathMarkdown(msg.content)}
                      {msg.isStreaming && (
                        <span style={{ display: 'inline-block', width: 2, height: 14, background: '#6366f1', marginLeft: 2, animation: 'blink 1s infinite', verticalAlign: 'middle' }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* Suggested questions */}
          {suggestedQuestions.length > 0 && (
            <div style={{ paddingLeft: 36, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {suggestedQuestions.map(q => (
                <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', padding: '5px 11px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Ask Axiom about your ${path.targetRole} path…`}
            rows={1}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 13px', color: '#e5e7eb', fontSize: '0.82rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
          {isLoading ? (
            <button onClick={stopGeneration} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Square size={14} color="#f87171" />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim()} style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: input.trim() ? 1 : 0.5, flexShrink: 0 }}>
              <Send size={14} color="white" />
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
