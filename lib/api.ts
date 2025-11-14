import type {
  FileSearchStore,
  ChatRequest,
  ChatResponse,
  FileUploadStatus,
  Settings,
} from '@/types';

const API_BASE = '/api';

export async function listStores(): Promise<FileSearchStore[]> {
  const res = await fetch(`${API_BASE}/stores`);
  if (!res.ok) throw new Error('Failed to list stores');
  return res.json();
}

export async function createStore(displayName: string): Promise<FileSearchStore> {
  const res = await fetch(`${API_BASE}/stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to create store' }));
    throw new Error(error.error || 'Failed to create store');
  }
  return res.json();
}

export async function deleteStore(storeName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/stores/${encodeURIComponent(storeName)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to delete store' }));
    const errorMessage = typeof errorData.error === 'string' 
      ? errorData.error 
      : errorData.error?.message || 'Failed to delete store';
    throw new Error(errorMessage);
  }
}

export async function uploadFile(
  storeName: string,
  file: File,
  displayName: string,
  chunkingConfig?: { maxTokensPerChunk?: number; maxOverlapTokens?: number },
  customMetadata?: Array<{ key: string; stringValue?: string; numericValue?: number }>
): Promise<FileUploadStatus> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('displayName', displayName);
  if (chunkingConfig) {
    formData.append('chunkingConfig', JSON.stringify(chunkingConfig));
  }
  if (customMetadata && customMetadata.length > 0) {
    formData.append('customMetadata', JSON.stringify(customMetadata));
  }

  const res = await fetch(`${API_BASE}/stores/${encodeURIComponent(storeName)}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to upload file' }));
    throw new Error(error.error || 'Failed to upload file');
  }

  return res.json();
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(error.error || 'Failed to send message');
  }

  return res.json();
}


