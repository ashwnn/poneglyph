'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (loadingHistory) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a] rounded-lg border border-gray-700 ">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-[#b82c3b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#2a2a2a] rounded-lg border border-gray-700 ">
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        {storeNames.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-700">
            <span className="text-xs text-gray-400">Active stores:</span>
            {storeNames.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 text-xs font-medium bg-[#b82c3b]/20 text-[#ff6b7a] rounded border border-[#b82c3b]/30"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {instructions && (
          <div className="pb-2 border-b border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Global instructions active</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>Start a conversation by selecting stores and sending a message.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3  ${
                      message.role === 'user'
                        ? 'bg-[#b82c3b] text-white'
                        : 'bg-[#333] text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {message.role === 'assistant' ? (
                        <div className="text-sm prose prose-invert prose-sm max-w-none flex-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap flex-1">{message.content}</p>
                      )}
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="p-1 hover:bg-black/20 rounded transition-all flex-shrink-0"
                        aria-label="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="text-xs font-medium mb-1">Sources:</p>
                        <div className="space-y-1">
                          {message.citations.map((citation, idx) => (
                            <div key={idx} className="text-xs opacity-90">
                              <span className="font-medium">{citation.fileName}</span>
                              {citation.snippet && (
                                <span className="ml-2 opacity-75">— {citation.snippet}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#333] rounded-lg p-3 ">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm text-gray-300">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-700">
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
            placeholder="Type your message..."
            disabled={loading || storeNames.length === 0}
            className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed "
            aria-label="Chat input"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || storeNames.length === 0}
            className="px-4 py-2 bg-[#b82c3b] hover:bg-[#a02634] text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed "
            aria-label="Send message"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
