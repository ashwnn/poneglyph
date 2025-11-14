'use client';

import { useState } from 'react';
import { Upload, X, Plus, RefreshCw } from 'lucide-react';
import type { FileSearchStore, FileUploadStatus, ChunkingConfig, CustomMetadata } from '@/types';
import { uploadFile } from '@/lib/api';

interface FileUploadProps {
  store: FileSearchStore | null;
  onClose: () => void;
}

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

  if (!store) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

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
        return 'bg-green-900/30 text-green-300 border border-green-700';
      case 'error':
        return 'bg-red-900/30 text-red-300 border border-red-700';
      case 'indexing':
        return 'bg-yellow-900/30 text-yellow-300 border border-yellow-700';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  return (
    <div className="w-full bg-[#2a2a2a] rounded-lg border border-gray-700 p-4 space-y-4 ">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          <p className="text-sm text-gray-400">
            {store.displayName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-gray-700 text-gray-400 transition-all "
          aria-label="Close upload"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept=".pdf,.txt,.docx,.doc"
          />
          <label htmlFor="file-upload">
            <div className="w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-[#b82c3b] transition-all flex items-center justify-center gap-2 text-gray-300 ">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Select Files</span>
            </div>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border border-gray-700 rounded bg-[#333] "
              >
                <span className="text-sm truncate flex-1 text-white">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 hover:bg-gray-700 rounded transition-all text-gray-400"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full px-4 py-2 bg-[#b82c3b] hover:bg-[#a02634] text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium "
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

        {uploadStatuses.size > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Upload Status:</p>
            {Array.from(uploadStatuses.entries()).map(([fileName, status]) => (
              <div
                key={fileName}
                className="flex items-center justify-between p-2 border border-gray-700 rounded bg-[#333] "
              >
                <span className="text-sm truncate flex-1 text-white">{status.displayName}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(status.status)}`}>
                  {status.status}
                </span>
                {status.error && (
                  <span className="text-xs text-red-400 ml-2">{status.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-3 py-2 text-sm font-medium text-gray-300 hover:bg-[#333] rounded-md transition-all "
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 text-white">Chunking Configuration</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
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
                      className="w-full px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b] "
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
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
                      className="w-full px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-[#333] text-white focus:outline-none focus:ring-2 focus:ring-[#b82c3b] "
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 text-white">Custom Metadata</p>
                <div className="space-y-2">
                  {metadata.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border border-gray-700 rounded bg-[#333] "
                    >
                      <span className="text-sm font-medium text-white">{item.key}:</span>
                      <span className="text-sm text-gray-300">
                        {item.stringValue || item.numericValue}
                      </span>
                      <button
                        onClick={() => removeMetadata(index)}
                        className="ml-auto p-1 hover:bg-gray-700 rounded text-gray-400"
                        aria-label={`Remove metadata ${item.key}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={newMetadataKey}
                      onChange={(e) => setNewMetadataKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b] "
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={newMetadataValue}
                      onChange={(e) => setNewMetadataValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-600 rounded-md bg-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b82c3b] "
                    />
                    <button
                      onClick={addMetadata}
                      disabled={!newMetadataKey.trim()}
                      className="px-3 py-1.5 bg-[#b82c3b] hover:bg-[#a02634] text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed "
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
