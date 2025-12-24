'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check, FileText, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, Citation } from '@/types';
import { sendChatMessage } from '@/lib/api';

interface ChatProps {
  conversationId: string | null;
  storeNames: string[];
  instructions?: string;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  onConversationCreated?: (id: string) => void;
}

export default function Chat({
  conversationId,
  storeNames,
  instructions,
  model,
  onConversationCreated,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (conversationId) {
      loadConversationHistory();
    } else {
      setMessages([]);
      setInput('');
      setError(null);
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    // Clear error when stores are selected/changed
    if (storeNames.length > 0 && error?.includes('select at least one store')) {
      setError(null);
    }
  }, [storeNames]);

  const loadConversationHistory = async () => {
    if (!conversationId) return;

    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          citations: msg.citations,
          timestamp: new Date(msg.createdAt),
        }));
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (storeNames.length === 0) {
      setError('Please select at least one store to chat with.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: userMessage.content,
        storeNames,
        instructions,
        model,
        conversationId: conversationId || undefined,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        citations: response.citations,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent of new conversation
      if (response.conversationId && !conversationId && onConversationCreated) {
        onConversationCreated(response.conversationId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Chat error:', err);
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleCitations = (messageId: string) => {
    setExpandedCitations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loadingHistory) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a] rounded-xl border border-gray-700/50 shadow-lg">
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-3 border-[#b82c3b] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#2a2a2a] to-[#252525] rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-700/50 bg-[#2a2a2a]/80 backdrop-blur-sm">
        {storeNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Searching:</span>
            {storeNames.map((name) => (
              <span
                key={name}
                className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-[#b82c3b]/20 to-[#b82c3b]/10 text-[#ff6b7a] rounded-full border border-[#b82c3b]/30"
              >
                {name.split('/').pop() || name}
              </span>
            ))}
          </div>
        )}

        {instructions && (
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Global instructions active
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-sm text-red-400 animate-fade-in">
          {error}
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 chat-scroll-container"
      >
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-16 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#333] flex items-center justify-center">
                <Send className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-lg font-medium text-gray-400 mb-2">Start a conversation</p>
              <p className="text-sm">Select stores from the sidebar and send a message to begin.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 message-bubble ${message.role === 'user'
                      ? 'bg-gradient-to-br from-[#b82c3b] to-[#9a2431] text-white rounded-br-md'
                      : 'bg-[#333] text-white rounded-bl-md border border-gray-700/30'
                    }`}
                >
                  {/* Message Content */}
                  <div className="flex items-start justify-between gap-3">
                    {message.role === 'assistant' ? (
                      <div className="text-sm prose prose-invert prose-sm max-w-none flex-1 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap flex-1 leading-relaxed">{message.content}</p>
                    )}
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="p-1.5 hover:bg-black/20 rounded-lg transition-all flex-shrink-0 opacity-60 hover:opacity-100"
                      aria-label="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Timestamp */}
                  <div className={`flex items-center gap-1.5 mt-2 text-xs ${message.role === 'user' ? 'text-white/60' : 'text-gray-500'
                    }`}>
                    <Clock className="w-3 h-3" />
                    {formatTime(message.timestamp)}
                  </div>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600/50">
                      <button
                        onClick={() => toggleCitations(message.id)}
                        className="flex items-center gap-2 text-xs font-medium text-[#ff6b7a] hover:text-[#ff8a96] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {message.citations.length} source{message.citations.length !== 1 ? 's' : ''}
                        <span className="text-gray-500 text-xs">
                          {expandedCitations.has(message.id) ? '(hide)' : '(show)'}
                        </span>
                      </button>

                      {expandedCitations.has(message.id) && (
                        <div className="mt-2 space-y-2 animate-fade-in">
                          {message.citations.map((citation, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-[#222] rounded-lg border border-gray-700/50 citation-card"
                            >
                              <p className="text-xs font-medium text-[#ff6b7a] mb-1 truncate">
                                {citation.fileName}
                              </p>
                              {citation.snippet && (
                                <p className="text-xs text-gray-400 line-clamp-2">
                                  {citation.snippet}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start animate-message-in">
              <div className="bg-[#333] rounded-2xl rounded-bl-md px-4 py-3 border border-gray-700/30">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[#b82c3b] rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-[#b82c3b] rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-[#b82c3b] rounded-full typing-dot" />
                  </div>
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700/50 bg-[#2a2a2a]/80 backdrop-blur-sm">
        <div className="flex gap-3 max-w-4xl mx-auto chat-input-container rounded-xl border border-gray-600/50 bg-[#333] p-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={storeNames.length === 0 ? "Select a store to start chatting..." : "Type your message..."}
            disabled={loading || storeNames.length === 0}
            className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            aria-label="Chat input"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || storeNames.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-[#b82c3b] to-[#a02634] hover:from-[#c93545] hover:to-[#b82c3b] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#b82c3b]/20"
            aria-label="Send message"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
