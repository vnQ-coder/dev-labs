'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TagInput } from '@/components/TagInput';
import {
  UserProfile, LearningPath, TARGET_ROLES,
  saveProfile, savePath, getFallbackPath,
} from '@/lib/profile';
import { useMemory } from '@/hooks/useMemory';

const AXIOM_URL = process.env.NEXT_PUBLIC_AXIOM_URL || 'http://localhost:8000';

const LOADING_PHRASES = [
  'Mapping your skill gaps…',
  'Curating concept order…',
  'Building your path…',
  'Analysing your background…',
  'Sequencing foundations first…',
  'Almost ready…',
];

async function generateLearningPath(profile: UserProfile): Promise<LearningPath> {
  const conceptIds = [
    'monolith','apigateway','loadbalancer','caching','cdn','databases','sharding',
    'messagequeue','ratelimit','cap','circuit','kafka','rabbitmq','bullmq',
    'queuepatterns','vpc','subnets','security-groups','nat-gateway','ports-protocols',
    'dns','route53','cloudflare','cloudfront','ec2','lambda','containers','s3','rds',
    'iam','kubernetes','docker','ecs','eks','ecr','url-journey','dns-explained',
    'osi-tcp','https-tls','reverse-proxy','cdn-explained','debug-network',
    'osi-layers','network-protocols',
  ];

  const message = `Profile:
- Name: ${profile.name}
- Current stack: ${profile.currentStack.join(', ')}
- Target role: ${profile.targetRole}
- Target stack: ${profile.targetStack.length > 0 ? profile.targetStack.join(', ') : 'Not specified'}
- Background: ${profile.backgroundText || 'Not provided'}

Available concept IDs: ${conceptIds.join(', ')}

Generate the learning path JSON now.`;

  const response = await fetch(`${AXIOM_URL}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'onboard', message, memory: null, history: [] }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);

  // Collect all SSE chunks into full text
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.chunk) fullText += data.chunk;
        if (data.error) throw new Error(data.error);
      } catch {}
    }
  }

  // Parse JSON — strip any accidental markdown fences
  const cleaned = fullText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned) as { phases: LearningPath['phases'] };

  const totalConcepts = parsed.phases.reduce((s, ph) => s + ph.concepts.length, 0);
  return {
    generatedAt: new Date().toISOString(),
    targetRole: profile.targetRole,
    phases: parsed.phases,
    totalConcepts,
  };
}

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const router = useRouter();
  const { saveMemory } = useMemory();

  const [name, setName] = useState('');
  const [currentStack, setCurrentStack] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [targetStack, setTargetStack] = useState<string[]>([]);
  const [backgroundText, setBackgroundText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);
  const [apiError, setApiError] = useState('');

  // Rotate loading phrases
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setLoadingPhrase(LOADING_PHRASES[i]);
    }, 1800);
    return () => clearInterval(timer);
  }, [loading]);

  // Block escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') e.preventDefault(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (currentStack.length === 0) errs.currentStack = 'Add at least one technology';
    if (!targetRole) errs.targetRole = 'Select a target role';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);

    const profile: UserProfile = {
      name: name.trim(),
      currentStack,
      targetStack,
      targetRole,
      backgroundText,
      createdAt: new Date().toISOString(),
    };

    saveProfile(profile);
    saveMemory({ display_name: profile.name, target_role: profile.targetRole });

    let path: LearningPath;
    try {
      path = await generateLearningPath(profile);
    } catch {
      // Retry once
      try {
        path = await generateLearningPath(profile);
      } catch {
        path = getFallbackPath(profile.targetRole);
      }
    }

    savePath(path);
    setLoading(false);
    onComplete(profile);
    router.push('/path');
  }, [name, currentStack, targetRole, targetStack, backgroundText, saveMemory, onComplete, router]);

  const step2Active = name.trim().length > 0 && currentStack.length > 0;
  const step3Active = step2Active && !!targetRole;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#09090b',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 0 80px rgba(99,102,241,0.12)',
        }}
      >
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[true, step2Active, step3Active].map((active, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: active ? '#6366f1' : 'rgba(99,102,241,0.2)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1 */}
        <div style={{ marginBottom: 24 }}>
          <StepLabel number={1} label="Who are you?" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <Field label="Your name" error={errors.name} required>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Muhammad"
                style={inputStyle}
              />
            </Field>
            <Field label="Current stack" hint="Type and press Enter to add" error={errors.currentStack} required>
              <TagInput tags={currentStack} onChange={setCurrentStack} placeholder="e.g. React, Node.js, Python…" />
            </Field>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ marginBottom: 24, opacity: step2Active ? 1 : 0.35, transition: 'opacity 0.3s' }}>
          <StepLabel number={2} label="Where are you going?" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <Field label="Target role" error={errors.targetRole} required>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                disabled={!step2Active}
                style={{ ...inputStyle, color: targetRole ? '#e5e7eb' : '#6b7280' }}
              >
                <option value="">Select your target role…</option>
                {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Target stack" hint="Technologies you want to learn (optional)">
              <TagInput tags={targetStack} onChange={setTargetStack} placeholder="e.g. Go, Kubernetes, AWS…" />
            </Field>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ opacity: step3Active ? 1 : 0.25, transition: 'opacity 0.3s' }}>
          <StepLabel number={3} label="Your background" hint="optional" />
          <div style={{ marginTop: 14 }}>
            <textarea
              value={backgroundText}
              onChange={e => setBackgroundText(e.target.value)}
              disabled={!step3Active}
              placeholder="Paste your experience, skills summary, or the job description you're targeting. Axiom uses this to identify your skill gaps."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
            <p style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: 4 }}>
              Processed locally — never stored on any server
            </p>
          </div>
        </div>

        {/* API Error */}
        {apiError && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.8rem' }}>
            {apiError} — <button type="button" onClick={handleSubmit} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>Retry</button>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !step2Active}
          style={{
            marginTop: 24, width: '100%',
            background: step2Active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.2)',
            border: 'none', borderRadius: 10, padding: '13px 0',
            color: step2Active ? 'white' : '#6b7280',
            fontSize: '0.88rem', fontWeight: 700, cursor: step2Active ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <AnimatePresence mode="wait">
                <motion.span
                  key={loadingPhrase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  {loadingPhrase}
                </motion.span>
              </AnimatePresence>
            </>
          ) : (
            <>Generate my path →</>
          )}
        </button>

        {step2Active && !step3Active && (
          <button
            type="button"
            onClick={handleSubmit}
            style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Skip background & generate →
          </button>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1f2937; color: #e5e7eb; }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e5e7eb',
  fontSize: '0.85rem',
  outline: 'none',
};

function StepLabel({ number, label, hint }: { number: number; label: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 800, color: '#a5b4fc', flexShrink: 0,
      }}>{number}</div>
      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f9fafb' }}>{label}</span>
      {hint && <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>— {hint}</span>}
    </div>
  );
}

function Field({ label, children, hint, error, required }: {
  label: string; children: React.ReactNode;
  hint?: string; error?: string; required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}{required && <span style={{ color: '#6366f1', marginLeft: 2 }}>*</span>}
        </span>
        {hint && <span style={{ fontSize: '0.68rem', color: '#6b7280', marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: '0.72rem', color: '#f87171', marginTop: 4 }}>{error}</p>}
    </div>
  );
}
