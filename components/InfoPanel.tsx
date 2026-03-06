'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WordFrequency } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface InfoPanelProps {
  word: WordFrequency | null;
  onClose: () => void;
}

const CATEGORY_BADGE: Record<string, string> = {
  crime:   'bg-red-100 text-red-700',
  cyber:   'bg-blue-100 text-blue-700',
  banking: 'bg-green-100 text-green-700',
  general: 'bg-purple-100 text-purple-700',
};

// Navbar is h-16 = 64px. Panel sits below it and above the bottom of the viewport.
const NAV_HEIGHT = 64;

export default function InfoPanel({ word, onClose }: InfoPanelProps) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [defLoading, setDefLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Resizable panel width via drag handle on the left edge
  const [panelWidth, setPanelWidth] = useState(400);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch definition whenever the selected word changes
  useEffect(() => {
    if (!word) return;
    setDefinition(null);
    setMessages([]);
    setInput('');
    setDefLoading(true);

    fetch('/api/word-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: word.word,
        category: word.category,
        frequency: word.frequency,
        messages: [],
      }),
    })
      .then((r) => r.json())
      .then((data) => setDefinition(data.content ?? null))
      .catch(() => setDefinition('Could not load definition at this time.'))
      .finally(() => setDefLoading(false));
  }, [word]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Send a user chat message
  const sendMessage = useCallback(async () => {
    if (!word || !input.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/word-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.word,
          category: word.category,
          frequency: word.frequency,
          messages: updatedMessages,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.content ?? 'No response received.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error — please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [word, input, messages, chatLoading]);

  // Enter sends; Shift+Enter inserts newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Drag-to-resize: dragging the left handle left → widens the panel
  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX; // moving left → positive delta → wider
      const newWidth = Math.max(320, Math.min(700, startWidth.current + delta));
      setPanelWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (!word) return null;

  return (
    <>
      {/* Drag handle — sits just to the left of the panel */}
      <div
        onMouseDown={onDragStart}
        className="fixed z-50 top-0 bottom-0 w-2 cursor-ew-resize
                   bg-verint-purple-pale hover:bg-verint-purple transition-colors"
        style={{ right: panelWidth, top: NAV_HEIGHT }}
        title="Drag to resize"
      />

      {/* Main panel — fixed to the right of the viewport, below the navbar */}
      <div
        className="fixed z-40 right-0 bottom-0 bg-white
                   border-l border-verint-purple-pale shadow-2xl
                   flex flex-col overflow-hidden"
        style={{ width: panelWidth, top: NAV_HEIGHT }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-verint-gradient flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white font-bold text-sm truncate capitalize">
              {word.word}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0
                ${CATEGORY_BADGE[word.category] || CATEGORY_BADGE.general}`}
            >
              {word.category}
            </span>
            <span className="text-white/60 text-xs flex-shrink-0">{word.frequency}×</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors ml-2 flex-shrink-0"
            aria-label="Close information panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Definition section ── */}
        <div className="px-4 py-3 bg-verint-purple-bg border-b border-verint-purple-pale flex-shrink-0">
          <h3 className="text-xs font-semibold text-verint-purple uppercase tracking-wide mb-2">
            Information
          </h3>
          {defLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
              <svg className="animate-spin h-4 w-4 text-verint-purple flex-shrink-0"
                fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading definition…
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">{definition}</p>
          )}
        </div>

        {/* ── Chat history — scrollable, fills available space ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 && !chatLoading && (
            <div className="text-center text-gray-400 text-xs pt-8">
              <div className="text-2xl mb-2">💬</div>
              Ask a follow-up question about{' '}
              <span className="font-semibold text-verint-purple capitalize">{word.word}</span>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-verint-purple text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl rounded-bl-sm px-4 py-3">
                <span className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"/>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"/>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"/>
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── Chat input — always pinned to the bottom ── */}
        <div className="px-4 py-3 border-t border-verint-purple-pale bg-white flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${word.word}…`}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-verint-purple-pale px-3 py-2
                         text-sm text-gray-800 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-verint-purple/40
                         focus:border-verint-purple leading-relaxed overflow-y-auto"
              style={{ minHeight: '38px', maxHeight: '100px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || chatLoading}
              className="flex-shrink-0 bg-verint-purple hover:bg-verint-purple-dark text-white
                         rounded-lg px-3 py-2 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </>
  );
}
