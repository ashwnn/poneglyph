'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, RefreshCw, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FileSearchStore } from '@/types';
import { listStores, createStore, deleteStore } from '@/lib/api';
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
  const [deleteStoreMenu, setDeleteStoreMenu] = useState<string | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<FileSearchStore | null>(null);
  const [storeFiles, setStoreFiles] = useState<FileInStore[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [deleteFileMenu, setDeleteFileMenu] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    // Close dropdown menus when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-delete-menu]')) {
        setDeleteStoreMenu(null);
        setDeleteFileMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone and all operations will be cancelled.`,
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
            // Refresh stores to update file count
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

  const formatFileSize = (sizeBytes?: string) => {
    if (!sizeBytes) return 'Unknown size';
    const bytes = parseInt(sizeBytes);
    if (isNaN(bytes)) return 'Unknown size';
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="w-full bg-[#2a2a2a] rounded-lg border border-gray-700 p-4 space-y-4 ">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">File Search Stores</h2>
        <button
          onClick={loadStores}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-[#333] hover:bg-[#3a3a3a] rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 "
          aria-label="Refresh stores"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New store display name"
          value={newStoreName}
          onChange={(e) => setNewStoreName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleCreateStore();
          }}
          className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b] focus:border-transparent "
        />
        <button
          onClick={handleCreateStore}
          disabled={creating || !newStoreName.trim()}
          className="px-4 py-2 bg-[#b82c3b] hover:bg-[#a02634] text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium "
        >
          {creating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Create
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {stores.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No stores yet. Create one to get started.
          </p>
        ) : (
          stores.map((store) => (
            <div
              key={store.name}
              className="border border-gray-700 rounded-lg bg-[#333]  overflow-hidden"
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedStoreNames.includes(store.name)}
                    onChange={() => toggleStoreSelection(store.name)}
                    className="w-4 h-4 text-[#b82c3b] border-gray-600 rounded focus:ring-[#b82c3b] bg-[#222]"
                    aria-label={`Select ${store.displayName}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white">{store.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {store.name}
                    </p>
                  </div>
                  {store.fileCount !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-[#b82c3b]/20 text-[#ff6b7a] rounded border border-[#b82c3b]/30">
                      {store.fileCount} files
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShowFiles(store)}
                    className="p-1.5 text-[#b82c3b] hover:bg-[#b82c3b]/10 rounded-md transition-all "
                    aria-label={`View files in ${store.displayName}`}
                    title="View files"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStore(store.name, store.displayName)}
                    disabled={deletingStore === store.name}
                    className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full px-3 py-2 text-sm text-gray-300 bg-[#222] hover:bg-[#2a2a2a] border-t border-gray-700 transition-all flex items-center justify-center gap-2 font-medium"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#2a2a2a] rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Files in {selectedStore.displayName}
              </h3>
              <button
                onClick={() => setShowFilesModal(false)}
                className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#b82c3b]" />
                  <span className="ml-2 text-gray-400">Loading files...</span>
                </div>
              ) : storeFiles.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No files in this store yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {storeFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-[#333] "
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium text-sm text-white truncate mb-1">
                          {file.displayName || 'Unnamed File'}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-400 bg-[#222] px-2 py-0.5 rounded">
                            {formatFileSize(file.sizeBytes)}
                          </span>
                          {file.mimeType && (
                            <span className="text-xs text-gray-400 bg-[#222] px-2 py-0.5 rounded">
                              {file.mimeType}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative flex-shrink-0" data-delete-menu>
                        <button
                          onClick={() => setDeleteFileMenu(deleteFileMenu === file.name ? null : file.name)}
                          disabled={deletingFile === file.name}
                          className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Delete ${file.displayName}`}
                        >
                          {deletingFile === file.name ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
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
