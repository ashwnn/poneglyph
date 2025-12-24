'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { HardDrive, MessageSquare, Upload, Plus } from 'lucide-react';
import Header from '@/components/Header';
import StoreManagement from '@/components/StoreManagement';
import FileUpload from '@/components/FileUpload';
import Chat from '@/components/Chat';
import ConversationList from '@/components/ConversationList';
import Settings from '@/components/Settings';
import Onboarding from '@/components/Onboarding';
import Sidebar, { SidebarIconButton } from '@/components/Sidebar';
import type { FileSearchStore, Settings as SettingsType } from '@/types';

const defaultSettings: SettingsType = {
  globalInstructions: '',
  defaultModel: 'gemini-2.5-flash',
  preferShorterAnswers: false,
  enableCitations: true,
  defaultChunking: {
    maxTokensPerChunk: 200,
    maxOverlapTokens: 20,
  },
  defaultMetadataPresets: [],
  theme: 'light',
  showAdvancedControls: false,
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [selectedStoreNames, setSelectedStoreNames] = useState<string[]>([]);
  const [uploadStore, setUploadStore] = useState<FileSearchStore | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<SettingsType['defaultModel']>(
    defaultSettings.defaultModel
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversationRefreshTrigger, setConversationRefreshTrigger] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);
  const [showChat, setShowChat] = useState(false);

  // Sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedLeftState = localStorage.getItem('poneglyph-left-sidebar');
    const savedRightState = localStorage.getItem('poneglyph-right-sidebar');

    if (savedLeftState !== null) {
      setLeftSidebarOpen(savedLeftState === 'true');
    }
    if (savedRightState !== null) {
      setRightSidebarOpen(savedRightState === 'true');
    }

    // Auto-collapse on mobile
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('poneglyph-left-sidebar', String(leftSidebarOpen));
  }, [leftSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('poneglyph-right-sidebar', String(rightSidebarOpen));
  }, [rightSidebarOpen]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          globalInstructions: data.globalInstructions || '',
          defaultModel: data.defaultModel || 'gemini-2.5-flash',
          preferShorterAnswers: data.preferShorterAnswers || false,
          enableCitations: data.enableCitations !== false,
          defaultChunking: data.defaultChunking || {
            maxTokensPerChunk: 200,
            maxOverlapTokens: 20,
          },
          defaultMetadataPresets: data.defaultMetadataPresets || [],
          theme: data.theme || 'light',
          showAdvancedControls: data.showAdvancedControls || false,
        });
        setCurrentModel(data.defaultModel || 'gemini-2.5-flash');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSettingsChange = async (newSettings: SettingsType) => {
    setSettings(newSettings);
    setCurrentModel(newSettings.defaultModel);

    // Save to database
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleStoreSelectForUpload = (store: FileSearchStore) => {
    setUploadStore(store);
    // Expand sidebar if collapsed when upload is triggered
    if (!leftSidebarOpen) {
      setLeftSidebarOpen(true);
    }
  };

  const handleSelectConversation = (id: string | null) => {
    setSelectedConversationId(id);
    if (id !== null) {
      setShowChat(true);
    }
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setShowChat(true);
  };

  const handleConversationCreated = (id: string) => {
    setSelectedConversationId(id);
    setConversationRefreshTrigger((prev) => prev + 1);
    setShowChat(true);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#222]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#b82c3b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#222]">
      <Header
        model={currentModel}
        onModelChange={setCurrentModel}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      <main className="h-[calc(100vh-4rem)] flex">
        {/* Left Sidebar: Store Management */}
        <Sidebar
          isOpen={leftSidebarOpen}
          onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
          side="left"
          title="File Stores"
          icon={<HardDrive className="w-4 h-4 text-[#ff6b7a]" />}
          collapsedContent={
            <div className="space-y-1">
              <SidebarIconButton
                icon={<HardDrive className="w-5 h-5" />}
                label="File Stores"
                onClick={() => setLeftSidebarOpen(true)}
                isActive={selectedStoreNames.length > 0}
              />
              <SidebarIconButton
                icon={<Upload className="w-5 h-5" />}
                label="Upload Files"
                onClick={() => {
                  setLeftSidebarOpen(true);
                }}
              />
            </div>
          }
        >
          <div className="space-y-4">
            <StoreManagement
              selectedStoreNames={selectedStoreNames}
              onStoreSelectionChange={setSelectedStoreNames}
              onStoreSelectForUpload={handleStoreSelectForUpload}
            />

            {uploadStore && (
              <FileUpload
                store={uploadStore}
                onClose={() => setUploadStore(null)}
              />
            )}
          </div>
        </Sidebar>

        {/* Middle: Chat or Onboarding */}
        <div className="flex-1 flex flex-col p-4 min-w-0 relative z-0 bg-[#222]">
          <div className="flex-1 min-h-0">
            {totalConversations === 0 && !selectedConversationId && !showChat ? (
              <Onboarding />
            ) : (
              <Chat
                key={`${selectedConversationId || 'new'}`}
                conversationId={selectedConversationId}
                storeNames={selectedStoreNames}
                instructions={settings.globalInstructions}
                model={currentModel}
                onConversationCreated={handleConversationCreated}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar: Conversation List */}
        <Sidebar
          isOpen={rightSidebarOpen}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
          side="right"
          title="Conversations"
          icon={<MessageSquare className="w-4 h-4 text-[#ff6b7a]" />}
          collapsedContent={
            <div className="space-y-1">
              <SidebarIconButton
                icon={<Plus className="w-5 h-5" />}
                label="New Conversation"
                onClick={() => {
                  handleNewConversation();
                  setRightSidebarOpen(true);
                }}
              />
              <SidebarIconButton
                icon={<MessageSquare className="w-5 h-5" />}
                label="Conversations"
                onClick={() => setRightSidebarOpen(true)}
                isActive={selectedConversationId !== null}
              />
            </div>
          }
        >
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId}
            onNewConversation={handleNewConversation}
            refreshTrigger={conversationRefreshTrigger}
            onConversationCountChange={setTotalConversations}
          />
        </Sidebar>
      </main>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
