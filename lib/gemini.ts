import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

// Cache for client instances per API key
const clientCache = new Map<string, GoogleGenAI>();

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. Generate one with: openssl rand -hex 32'
    );
  }
  
  // Convert hex string to buffer (key should be 32 bytes / 64 hex chars for AES-256)
  if (key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generate one with: openssl rand -hex 32'
    );
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Get a Gemini client for a specific API key
 * @param apiKey - User's Gemini API key
 * @returns GoogleGenAI client instance
 */
export function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  // Return cached client if available
  if (clientCache.has(apiKey)) {
    return clientCache.get(apiKey)!;
  }

  // Create new client and cache it
  const client = new GoogleGenAI({ apiKey });
  clientCache.set(apiKey, client);
  
  return client;
}

/**
 * Encrypt API key using AES-256-CBC
 * @param apiKey - Plain text API key
 * @returns Encrypted API key in format: iv:encryptedData (both hex encoded)
 */
export function encryptApiKey(apiKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(apiKey, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV and encrypted data separated by colon
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted API key
 * @param encryptedKey - Encrypted API key in format: iv:encryptedData
 * @returns Decrypted API key
 */
export function decryptApiKey(encryptedKey: string): string {
  const key = getEncryptionKey();
  const parts = encryptedKey.split(':');
  
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted key format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  
  return decrypted;
}

