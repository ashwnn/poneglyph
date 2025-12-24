'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  messageCount?: number;
}

interface ConversationListProps {
  onSelectConversation: (id: string | null) => void;
  selectedConversationId: string | null;
  onNewConversation: () => void;
  refreshTrigger?: number;
  onConversationCountChange?: (count: number) => void;
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
  onNewConversation,
  refreshTrigger,
  onConversationCountChange,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    conversationId: string;
  }>({
    isOpen: false,
    conversationId: '',
  });

  useEffect(() => {
    loadConversations();
  }, [refreshTrigger]);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        onConversationCountChange?.(data.length);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      conversationId: id,
    });
  };

  const confirmDelete = async () => {
    const id = confirmDialog.conversationId;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setConversations(conversations.filter((c) => c.id !== id));
        if (selectedConversationId === id) {
          onSelectConversation(null);
        }
        toast.success('Conversation deleted');
      } else {
        toast.error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* New Conversation Button */}
        <button
          onClick={onNewConversation}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-[#b82c3b] to-[#a02634] hover:from-[#c93545] hover:to-[#b82c3b] text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#b82c3b]/20 mb-4"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto -mx-4 px-4">
          {loading ? (
            <div className="py-8 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-[#b82c3b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Start a new conversation to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all ${selectedConversationId === conversation.id
                      ? 'bg-[#b82c3b]/20 border border-[#b82c3b]/40'
                      : 'hover:bg-[#333] border border-transparent'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {conversation.title || 'Untitled Conversation'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(conversation.id, e)}
                      disabled={deletingId === conversation.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
                      aria-label="Delete conversation"
                    >
                      {deletingId === conversation.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, conversationId: '' })}
        type="danger"
      />
    </>
  );
}


