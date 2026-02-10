'use client';

import { useSession, signOut } from 'next-auth/react';
import { Settings as SettingsIcon, LogOut, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ModelSelector } from './ModelSelector';
import { MODELS, getModelById } from '@/lib/models';
import { Settings as SettingsType } from '@/types';

// Extract ModelType from Settings
type ModelType = SettingsType['defaultModel'];

interface HeaderProps {
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  onSettingsOpen: () => void;
}

export default function Header({ model, onModelChange, onSettingsOpen }: HeaderProps) {
  const { data: session } = useSession();
  const [showModelSelector, setShowModelSelector] = useState(false);

  const getAbbreviatedName = (fullName: string | null | undefined, email: string | null | undefined) => {
    if (!fullName) return email || 'User';

    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 1) return nameParts[0];

    const firstName = nameParts[0];
    const lastInitial = nameParts[nameParts.length - 1][0];
    return `${firstName} ${lastInitial}.`;
  };

  const getModelDisplayName = (modelId: string) => {
    const model = getModelById(modelId);
    return model ? model.name : modelId;
  };

  return (
    <header className="border-b border-gray-700 bg-[#2a2a2a]">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="items-center flex gap-2">
            <img
              src="/poneglyph.png"
              alt="Poneglyph Logo"
              className="w-8 h-8 mb-1"
            />
            <h1 className="text-xl font-semibold text-white">
              Poneglyph
            </h1>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Model Selector Button */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-[#333] text-white hover:bg-[#3a3a3a] transition-all w-48 text-left truncate flex items-center justify-between"
              >
                <span>
                  {getModelDisplayName(model)}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 ml-2" />
              </button>

              {/* Model Selector Dropdown */}
              {showModelSelector && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowModelSelector(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 z-50">
                    <ModelSelector model={model} onModelChange={(m) => {
                      onModelChange(m);
                      setShowModelSelector(false);
                    }} />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onSettingsOpen}
              className="p-2 rounded-md bg-[#333] hover:bg-[#3a3a3a] text-gray-300 transition-all  "
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {session?.user && (
              <div className="flex items-center gap-2 pl-4 border-l border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {getAbbreviatedName(session.user.name, session.user.email)}
                  </span>
                </div>
                <button
                  onClick={() =>
                    signOut({ callbackUrl: '/auth/signin' })
                  }
                  className="p-2 rounded-md bg-[#333] hover:bg-[#b82c3b] text-gray-300 hover:text-white transition-all  "
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
