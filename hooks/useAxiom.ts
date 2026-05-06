'use client';
import { useState, useCallback, useRef } from 'react';
import { AxiomMemory } from './useMemory';

export type AgentMode = 'ask' | 'interview' | 'quiz' | 'debug' | 'threeam';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: AgentMode;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseAxiomOptions {
  memory: AxiomMemory;
  onMemoryUpdate?: (update: any) => void;
}

const AXIOM_URL = process.env.NEXT_PUBLIC_AXIOM_URL || 'http://localhost:8000';

export function useAxiom({ memory, onMemoryUpdate }: UseAxiomOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    mode: AgentMode = 'ask',
    conceptId?: string
  ) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setSuggestedQuestions([]);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      mode,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      mode,
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMsg]);

    // Build history (last 6 turns)
    const history = messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Compact memory summary for API
    const memorySummary = {
      studied_concepts: memory.studied_concepts.slice(-10),
      weak_areas: memory.weak_areas.slice(-5),
      strong_areas: memory.strong_areas.slice(-5),
      quiz_scores: memory.quiz_scores,
      interview_sessions: memory.interview_sessions,
      preferred_style: memory.preferred_style,
    };

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${AXIOM_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          message: content.slice(0, 600),
          concept_id: conceptId || null,
          memory: memorySummary,
          history,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Agent error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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

            if (data.error) {
              setError(data.error);
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: `Sorry, I ran into an issue: ${data.error}`, isStreaming: false }
                  : m
              ));
              break;
            }

            if (data.chunk) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + data.chunk }
                  : m
              ));
            }

            if (data.done) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ));
              if (data.suggested_questions?.length) {
                setSuggestedQuestions(data.suggested_questions);
              }
              if (data.memory_update) {
                onMemoryUpdate?.(data.memory_update);
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError('Could not reach Axiom. Make sure the backend is running.');
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: 'Connection failed. Please try again.', isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, memory, onMemoryUpdate]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setSuggestedQuestions([]);
    setError(null);
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages(prev => prev.map(m =>
      m.isStreaming ? { ...m, isStreaming: false } : m
    ));
  }, []);

  return { messages, isLoading, suggestedQuestions, error, sendMessage, clearConversation, stopGeneration };
}
