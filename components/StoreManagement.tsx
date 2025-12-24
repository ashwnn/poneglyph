'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, RefreshCw, Info, X, HardDrive, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FileSearchStore } from '@/types';
import { listStores, createStore } from '@/lib/api';
import ConfirmDialog from './ConfirmDialog';

interface StoreManagementProps {
  selectedStoreNames: string[];
  onStoreSelectionChange: (storeNames: string[]) => void;
  onStoreSelectForUpload: (store: FileSearchStore) => void;
}

interface FileInStore {
  name: string;
  displayName: string;
  sizeBytes?: string;
  mimeType?: string;
}

const formatFileSize = (sizeBytes?: string | number) => {
  if (!sizeBytes) return 'Unknown';
  const bytes = typeof sizeBytes === 'string' ? parseInt(sizeBytes) : sizeBytes;
  if (isNaN(bytes)) return 'Unknown';

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export default function StoreManagement({
  selectedStoreNames,
  onStoreSelectionChange,
  onStoreSelectForUpload,
}: StoreManagementProps) {
  const [stores, setStores] = useState<FileSearchStore[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingStore, setDeletingStore] = useState<string | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<FileSearchStore | null>(null);
  const [storeFiles, setStoreFiles] = useState<FileInStore[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const storeList = await listStores();
      setStores(storeList);
    } catch (error: any) {
      console.error('Failed to load stores:', error);
      toast.error(`Failed to load stores: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;

    setCreating(true);
    try {
      const newStore = await createStore(newStoreName.trim());
      setStores([...stores, newStore]);
      setNewStoreName('');
      toast.success('Store created successfully');
    } catch (error: any) {
      console.error('Failed to create store:', error);
      toast.error(`Failed to create store: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStore = async (storeName: string, displayName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Store',
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone and all files in this store will be permanently deleted.`,
      onConfirm: async () => {
        setDeletingStore(storeName);
        try {
          const url = new URL(
            `/api/stores/${encodeURIComponent(storeName)}`,
            window.location.origin
          );
          url.searchParams.set('force', 'true');

          const res = await fetch(url.toString(), { method: 'DELETE' });

          if (res.ok) {
            setStores(stores.filter(s => s.name !== storeName));
            onStoreSelectionChange(selectedStoreNames.filter(n => n !== storeName));
            toast.success('Store deleted successfully');
          } else {
            const errorData = await res.json();
            const errorMessage = typeof errorData.error === 'string'
              ? errorData.error
              : errorData.error?.message || 'Failed to delete store';
            toast.error(errorMessage);
          }
        } catch (error: any) {
          console.error('Failed to delete store:', error);
          toast.error(`Failed to delete store: ${error.message}`);
        } finally {
          setDeletingStore(null);
        }
      },
    });
  };

  const toggleStoreSelection = (storeName: string) => {
    if (selectedStoreNames.includes(storeName)) {
      onStoreSelectionChange(selectedStoreNames.filter(n => n !== storeName));
    } else {
      onStoreSelectionChange([...selectedStoreNames, storeName]);
    }
  };

  const handleShowFiles = async (store: FileSearchStore) => {
    setSelectedStore(store);
    setShowFilesModal(true);
    setLoadingFiles(true);
    setStoreFiles([]);

    try {
      const res = await fetch(`/api/stores/${encodeURIComponent(store.name)}/files`);
      if (res.ok) {
        const files = await res.json();
        setStoreFiles(files);
      } else {
        const error = await res.json();
        toast.error(`Failed to load files: ${error.error}`);
      }
    } catch (error: any) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (fileName: string, displayName: string) => {
    if (!selectedStore) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete File',
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
      onConfirm: async () => {
        setDeletingFile(fileName);
        try {
          const url = new URL(
            `/api/stores/${encodeURIComponent(selectedStore.name)}/files/${encodeURIComponent(fileName)}`,
            window.location.origin
          );
          url.searchParams.set('force', 'true');

          const res = await fetch(url.toString(), { method: 'DELETE' });

          if (res.ok) {
            setStoreFiles(storeFiles.filter(f => f.name !== fileName));
            toast.success('File deleted successfully');
            loadStores();
          } else {
            const errorData = await res.json();
            const errorMessage = typeof errorData.error === 'string'
              ? errorData.error
              : errorData.error?.message || 'Failed to delete file';
            toast.error(errorMessage);
          }
        } catch (error: any) {
          console.error('Failed to delete file:', error);
          toast.error('Failed to delete file');
        } finally {
          setDeletingFile(null);
        }
      },
    });
  };

  // Calculate total storage for files in modal
  const totalStorageBytes = storeFiles.reduce((acc, file) => {
    const bytes = file.sizeBytes ? parseInt(file.sizeBytes) : 0;
    return acc + (isNaN(bytes) ? 0 : bytes);
  }, 0);

  return (
    <div className="w-full bg-gradient-to-b from-[#2a2a2a] to-[#252525] rounded-xl border border-gray-700/50 p-4 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#b82c3b]/20">
            <HardDrive className="w-4 h-4 text-[#ff6b7a]" />
          </div>
          <h2 className="text-lg font-semibold text-white">File Stores</h2>
        </div>
        <button
          onClick={loadStores}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-all disabled:opacity-50"
          aria-label="Refresh stores"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Create Store Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New store name"
          value={newStoreName}
          onChange={(e) => setNewStoreName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleCreateStore();
          }}
          className="flex-1 px-3 py-2.5 border border-gray-600/50 rounded-lg bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b]/50 focus:border-[#b82c3b] text-sm"
        />
        <button
          onClick={handleCreateStore}
          disabled={creating || !newStoreName.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-[#b82c3b] to-[#a02634] hover:from-[#c93545] hover:to-[#b82c3b] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-[#b82c3b]/20"
        >
          {creating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Stores List */}
      <div className="space-y-2">
        {stores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HardDrive className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No stores yet</p>
            <p className="text-xs mt-1">Create one to get started</p>
          </div>
        ) : (
          stores.map((store) => (
            <div
              key={store.name}
              className={`border rounded-xl overflow-hidden transition-all ${selectedStoreNames.includes(store.name)
                  ? 'border-[#b82c3b]/50 bg-[#b82c3b]/5'
                  : 'border-gray-700/50 bg-[#333]/50 hover:bg-[#333]'
                }`}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedStoreNames.includes(store.name)}
                    onChange={() => toggleStoreSelection(store.name)}
                    className="w-4 h-4 text-[#b82c3b] border-gray-600 rounded focus:ring-[#b82c3b] bg-[#222] cursor-pointer"
                    aria-label={`Select ${store.displayName}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">{store.displayName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {store.name.split('/').pop() || store.name}
                    </p>
                  </div>
                  {store.fileCount !== undefined && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-[#b82c3b]/20 text-[#ff6b7a] rounded-full">
                      {store.fileCount} file{store.fileCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => handleShowFiles(store)}
                    className="p-2 text-gray-400 hover:text-[#ff6b7a] hover:bg-[#b82c3b]/10 rounded-lg transition-all"
                    aria-label={`View files in ${store.displayName}`}
                    title="View files"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStore(store.name, store.displayName)}
                    disabled={deletingStore === store.name}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                    aria-label={`Delete ${store.displayName}`}
                  >
                    {deletingStore === store.name ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={() => onStoreSelectForUpload(store)}
                className="w-full px-3 py-2.5 text-sm text-gray-400 hover:text-white bg-[#222]/50 hover:bg-[#222] border-t border-gray-700/50 transition-all flex items-center justify-center gap-2"
                aria-label={`Upload to ${store.displayName}`}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          ))
        )}
      </div>

      {/* Files Modal */}
      {showFilesModal && selectedStore && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-b from-[#2a2a2a] to-[#252525] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedStore.displayName}
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-500">
                    {storeFiles.length} file{storeFiles.length !== 1 ? 's' : ''}
                  </span>
                  {!loadingFiles && storeFiles.length > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-[#ff6b7a]">
                      <HardDrive className="w-3.5 h-3.5" />
                      {formatFileSize(totalStorageBytes)} total
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowFilesModal(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#b82c3b]" />
                  <span className="ml-3 text-gray-400">Loading files...</span>
                </div>
              ) : storeFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No files yet</p>
                  <p className="text-sm mt-1">Upload files to this store to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {storeFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-4 border border-gray-700/50 rounded-xl bg-[#333]/50 hover:bg-[#333] transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2.5 rounded-lg bg-[#222]">
                          <FileText className="w-5 h-5 text-[#ff6b7a]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">
                            {file.displayName || 'Unnamed File'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500 bg-[#222] px-2 py-0.5 rounded">
                              {formatFileSize(file.sizeBytes)}
                            </span>
                            {file.mimeType && (
                              <span className="text-xs text-gray-500 bg-[#222] px-2 py-0.5 rounded">
                                {file.mimeType.split('/').pop() || file.mimeType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.name, file.displayName || 'Unnamed File')}
                        disabled={deletingFile === file.name}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        aria-label={`Delete ${file.displayName}`}
                      >
                        {deletingFile === file.name ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type="danger"
      />
    </div>
  );
}
