'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Settings, ChunkingConfig } from '@/types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function Settings({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      loadSavedInstructions();
    }
  }, [isOpen]);

  const loadSavedInstructions = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setLocalSettings({
          globalInstructions: data.globalInstructions || '',
          defaultModel: data.defaultModel || 'gemini-2.5-flash',
          preferShorterAnswers: data.preferShorterAnswers || false,
          enableCitations: data.enableCitations !== false,
          defaultChunking: data.defaultChunking || {
            maxTokensPerChunk: 200,
            maxOverlapTokens: 20,
          },
          defaultMetadataPresets: data.defaultMetadataPresets || [],
          theme: data.theme || 'dark',
          showAdvancedControls: data.showAdvancedControls || false,
        });
      }

      // Check if user has an API key set
      const keyRes = await fetch('/api/user/api-key');
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        setHasApiKey(keyData.hasApiKey);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      onSettingsChange(localSettings);
      toast.success('Settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setSavingApiKey(true);
    try {
      const res = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save API key');
      }

      setHasApiKey(true);
      setApiKey('');
      setShowApiKey(false);
      toast.success('API key saved successfully');
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!window.confirm('Are you sure you want to remove your API key?')) {
      return;
    }

    setSavingApiKey(true);
    try {
      const res = await fetch('/api/user/api-key', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete API key');
      }

      setHasApiKey(false);
      setApiKey('');
      setShowApiKey(false);
      toast.success('API key removed successfully');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  const toggleStoreSelection = (storeName: string) => {
    // Removed: defaultStoreNames is no longer supported
  };

  const updateChunking = (field: keyof ChunkingConfig, value: number | undefined) => {
    setLocalSettings({
      ...localSettings,
      defaultChunking: {
        ...localSettings.defaultChunking,
        [field]: value,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#2a2a2a] rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-700 text-gray-400 transition-all "
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Global Custom Instructions</h3>
              <textarea
                placeholder="Enter instructions for the assistant (e.g., tone, level of detail, how to use documents)..."
                value={localSettings.globalInstructions}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, globalInstructions: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b] focus:border-transparent resize-y shadow-md"
                aria-label="Global instructions"
              />
              <p className="text-xs text-gray-400 mt-1">
                These instructions will be included in every chat request.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Gemini API Key</h3>
              <div className="space-y-2">
                {hasApiKey ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-[#333] text-green-400 text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      API key is configured
                    </div>
                    <button
                      onClick={handleDeleteApiKey}
                      disabled={savingApiKey}
                      className="p-2 rounded-md bg-red-900/50 hover:bg-red-800 text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete API key"
                      title="Delete API key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Enter your Gemini API key (must start with AIza)..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b] focus:border-transparent shadow-md pr-10"
                        aria-label="Gemini API key"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 transition-colors"
                        aria-label="Toggle API key visibility"
                        title="Toggle visibility"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleSaveApiKey}
                      disabled={savingApiKey || !apiKey.trim()}
                      className="w-full px-3 py-2 bg-[#b82c3b] hover:bg-[#a02634] text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center justify-center gap-2"
                    >
                      {savingApiKey ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save API Key'
                      )}
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Your Gemini API key is encrypted and stored securely. Get your key at{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b82c3b] hover:underline"
                >
                  aistudio.google.com/apikey
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Default Model</h3>
              <select
                value={localSettings.defaultModel}
                onChange={(e) => {
                  setLocalSettings({
                    ...localSettings,
                    defaultModel: e.target.value as 'gemini-2.5-flash' | 'gemini-2.5-pro',
                  });
                }}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b] focus:border-transparent shadow-md"
                aria-label="Select default model"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Behavior Defaults</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.preferShorterAnswers}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, preferShorterAnswers: e.target.checked })
                    }
                    className="w-4 h-4 text-[#b82c3b] border-gray-600 rounded focus:ring-[#b82c3b] bg-[#222]"
                  />
                  <span className="text-sm text-white">Prefer shorter answers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.enableCitations}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, enableCitations: e.target.checked })
                    }
                    className="w-4 h-4 text-[#b82c3b] border-gray-600 rounded focus:ring-[#b82c3b] bg-[#222]"
                  />
                  <span className="text-sm text-white">Enable citations by default</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.showAdvancedControls}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, showAdvancedControls: e.target.checked })
                    }
                    className="w-4 h-4 text-[#b82c3b] border-gray-600 rounded focus:ring-[#b82c3b] bg-[#222]"
                  />
                  <span className="text-sm text-white">Show advanced controls in main UI</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2 text-white">Default Chunking Presets</h3>
              <p className="text-xs text-gray-400 mb-2">
                These values will prefill the upload section.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Max Tokens Per Chunk
                  </label>
                  <input
                    type="number"
                    value={localSettings.defaultChunking?.maxTokensPerChunk?.toString() || ''}
                    onChange={(e) =>
                      updateChunking('maxTokensPerChunk', parseInt(e.target.value) || undefined)
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b] shadow-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Max Overlap Tokens
                  </label>
                  <input
                    type="number"
                    value={localSettings.defaultChunking?.maxOverlapTokens?.toString() || ''}
                    onChange={(e) =>
                      updateChunking('maxOverlapTokens', parseInt(e.target.value) || undefined)
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b] shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700 bg-[#222]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-all font-medium "
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-[#b82c3b] hover:bg-[#a02634] text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 "
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
