'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, Loader2, CheckCircle, Settings, Info } from 'lucide-react';
import type { FileSearchStore, ChunkingConfig, CustomMetadata, FileUploadStatus } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { uploadFile } from '@/lib/api';

interface FileUploadProps {
  store: FileSearchStore | null;
  onClose: () => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
      return FileText;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return FileText; // Changed to FileText as FileImage was removed
    case 'mp3':
    case 'wav':
    case 'ogg':
      return FileText; // Changed to FileText as FileAudio was removed
    default:
      return FileText; // Changed to FileText as File was removed
  }
};


export default function FileUpload({ store, onClose }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<Map<string, FileUploadStatus>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chunkingConfig, setChunkingConfig] = useState<ChunkingConfig>({
    maxTokensPerChunk: 200,
    maxOverlapTokens: 20,
  });
  const [metadata, setMetadata] = useState<CustomMetadata[]>([]);
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  if (!store) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const filteredFiles = newFiles.filter(
      (file) => !files.some((f) => f.name === file.name && f.size === file.size)
    );
    setFiles([...files, ...filteredFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'txt', 'docx', 'doc'].includes(ext || '');
    });

    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [files]);

  const addMetadata = () => {
    if (!newMetadataKey.trim()) return;

    const numericValue = parseFloat(newMetadataValue);
    const isNumeric = !isNaN(numericValue) && isFinite(numericValue);

    setMetadata([
      ...metadata,
      {
        key: newMetadataKey.trim(),
        ...(isNumeric ? { numericValue } : { stringValue: newMetadataValue }),
      },
    ]);
    setNewMetadataKey('');
    setNewMetadataValue('');
  };

  const removeMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const statusMap = new Map<string, FileUploadStatus>();

    for (const file of files) {
      const displayName = file.name;
      statusMap.set(file.name, {
        fileName: file.name,
        displayName,
        status: 'uploading',
      });
      setUploadStatuses(new Map(statusMap));

      try {
        const result = await uploadFile(
          store.name,
          file,
          displayName,
          showAdvanced ? chunkingConfig : undefined,
          metadata.length > 0 ? metadata : undefined
        );

        statusMap.set(file.name, result);
        setUploadStatuses(new Map(statusMap));
      } catch (error: any) {
        statusMap.set(file.name, {
          fileName: file.name,
          displayName,
          status: 'error',
          error: error.message || 'Upload failed',
        });
        setUploadStatuses(new Map(statusMap));
      }
    }

    setUploading(false);
  };

  const getStatusColor = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'indexing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="w-full bg-gradient-to-b from-[#2a2a2a] to-[#252525] rounded-xl border border-gray-700/50 p-4 space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            to {store.displayName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
          aria-label="Close upload"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging
            ? 'drop-zone-active border-[#b82c3b]'
            : 'border-gray-600 hover:border-[#b82c3b]/60 hover:bg-[#333]/50'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept=".pdf,.txt,.docx,.doc"
          />
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`p-3 rounded-xl transition-colors ${isDragging ? 'bg-[#b82c3b]/20' : 'bg-[#333]'
              }`}>
              <Upload className={`w-6 h-6 ${isDragging ? 'text-[#ff6b7a]' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-medium text-white">
                {isDragging ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse • PDF, TXT, DOC, DOCX
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
              <span className="text-gray-500">{formatFileSize(totalSize)}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => {
                const FileIcon = getFileIcon(file.name);
                return (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 border border-gray-700/50 rounded-lg bg-[#333]/50 group hover:bg-[#333] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-[#222]">
                        <FileIcon className="w-4 h-4 text-[#ff6b7a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 rounded-lg transition-all text-gray-400 hover:text-red-400"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full px-4 py-3 bg-gradient-to-r from-[#b82c3b] to-[#a02634] hover:from-[#c93545] hover:to-[#b82c3b] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#b82c3b]/20"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Files'}
            </>
          )}
        </button>

        {/* Upload Status */}
        {uploadStatuses.size > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Upload Status</p>
            <div className="space-y-2">
              {Array.from(uploadStatuses.entries()).map(([fileName, status]) => (
                <div
                  key={fileName}
                  className="flex items-center justify-between p-3 border border-gray-700/50 rounded-lg bg-[#333]/50"
                >
                  <span className="text-sm truncate flex-1 text-white">{status.displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(status.status)}`}>
                      {status.status}
                    </span>
                    {status.error && (
                      <span className="text-xs text-red-400 max-w-32 truncate" title={status.error}>
                        {status.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <div className="pt-4 border-t border-gray-700/50">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#333]/50 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Chunking Config */}
              <div>
                <p className="text-sm font-medium mb-3 text-white">Chunking Configuration</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Max Tokens Per Chunk
                    </label>
                    <input
                      type="number"
                      value={chunkingConfig.maxTokensPerChunk?.toString() || ''}
                      onChange={(e) =>
                        setChunkingConfig({
                          ...chunkingConfig,
                          maxTokensPerChunk: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-600/50 rounded-lg bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b]/50 focus:border-[#b82c3b]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Max Overlap Tokens
                    </label>
                    <input
                      type="number"
                      value={chunkingConfig.maxOverlapTokens?.toString() || ''}
                      onChange={(e) =>
                        setChunkingConfig({
                          ...chunkingConfig,
                          maxOverlapTokens: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-600/50 rounded-lg bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b]/50 focus:border-[#b82c3b]"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Metadata */}
              <div>
                <p className="text-sm font-medium mb-3 text-white">Custom Metadata</p>
                <div className="space-y-2">
                  {metadata.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 border border-gray-700/50 rounded-lg bg-[#333]/50"
                    >
                      <span className="text-sm font-medium text-[#ff6b7a]">{item.key}:</span>
                      <span className="text-sm text-gray-300 flex-1">
                        {item.stringValue || item.numericValue}
                      </span>
                      <button
                        onClick={() => removeMetadata(index)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400"
                        aria-label={`Remove metadata ${item.key}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={newMetadataKey}
                      onChange={(e) => setNewMetadataKey(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-600/50 rounded-lg bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b]/50 focus:border-[#b82c3b]"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={newMetadataValue}
                      onChange={(e) => setNewMetadataValue(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-600/50 rounded-lg bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b]/50 focus:border-[#b82c3b]"
                    />
                    <button
                      onClick={addMetadata}
                      disabled={!newMetadataKey.trim()}
                      className="px-3 py-2 bg-[#b82c3b] hover:bg-[#a02634] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Add metadata"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
