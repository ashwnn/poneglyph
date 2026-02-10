export interface FileSearchStore {
  name: string;
  displayName: string;
  fileCount?: number;
}

export interface FileUploadStatus {
  fileName: string;
  displayName: string;
  status: 'uploading' | 'indexing' | 'ready' | 'error';
  error?: string;
  operationName?: string;
}

export interface ChunkingConfig {
  maxTokensPerChunk?: number;
  maxOverlapTokens?: number;
}

export interface CustomMetadata {
  key: string;
  stringValue?: string;
  numericValue?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface Citation {
  fileName: string;
  snippet?: string;
  page?: number;
}

import { ModelId } from '@/lib/models';

export interface Settings {
  globalInstructions: string;
  defaultModel: ModelId;
  preferShorterAnswers: boolean;
  enableCitations: boolean;
  defaultChunking?: ChunkingConfig;
  defaultMetadataPresets?: CustomMetadata[];
  theme: 'light' | 'dark';
  showAdvancedControls: boolean;
}

export interface ChatRequest {
  message: string;
  storeNames: string[];
  instructions?: string;
  metadataFilter?: string;
  model?: ModelId;
  conversationId?: string;
}

export interface ChatResponse {
  text: string;
  citations?: Citation[];
  conversationId?: string;
}

