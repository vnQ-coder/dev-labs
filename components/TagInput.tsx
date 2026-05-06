'use client';
import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

const SUGGESTIONS: Record<string, string[]> = {
  stack: [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java',
    'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'PostgreSQL', 'MySQL',
    'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'GraphQL', 'REST', 'gRPC', 'Terraform', 'Helm', 'Next.js', 'Django',
    'Spring Boot', 'Express', 'FastAPI',
  ],
};

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Type and press Enter...',
  suggestions = SUGGESTIONS.stack,
  maxTags = 8,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const filteredSuggestions = useMemo(
    () =>
      input.length > 0
        ? suggestions
            .filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
            .slice(0, 5)
        : [],
    [input, suggestions, tags]
  );

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput('');
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          minHeight: 44,
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '6px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          cursor: 'text',
          transition: 'border-color 0.15s',
        }}
        onFocus={() => setShowSuggestions(true)}
      >
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#6366f1', display: 'flex' }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            blurTimerRef.current = setTimeout(() => setShowSuggestions(false), 150);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#e5e7eb',
            fontSize: '0.82rem',
            flex: 1,
            minWidth: 80,
            padding: '2px 0',
          }}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: '#1f2937',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8,
          overflow: 'hidden',
          zIndex: 50,
        }}>
          {filteredSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                color: '#d1d5db',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
