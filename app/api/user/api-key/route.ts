import { NextRequest, NextResponse } from 'next/server';
import { withGeminiAuth } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { encryptApiKey, decryptApiKey } from '@/lib/gemini';

/**
 * GET /api/user/api-key
 * Check if user has an API key configured
 */
export const GET = withGeminiAuth(async (request: NextRequest, { session }) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { geminiApiKey: true },
  });

  return NextResponse.json({
    hasApiKey: !!user?.geminiApiKey,
  });
});

/**
 * POST /api/user/api-key
 * Set or update user's Gemini API key
 */
export const POST = withGeminiAuth(async (request: NextRequest, { session }) => {
  const { apiKey } = await request.json();

  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return NextResponse.json(
      { error: 'API key is required' },
      { status: 400 }
    );
  }

  // Basic validation for Gemini API key format
  if (!apiKey.startsWith('AIza')) {
    return NextResponse.json(
      { error: 'Invalid API key format. Gemini API keys should start with "AIza"' },
      { status: 400 }
    );
  }

  // Encrypt and store the API key
  const encryptedKey = encryptApiKey(apiKey.trim());

  await prisma.user.update({
    where: { id: session.user.id },
    data: { geminiApiKey: encryptedKey },
  });

  return NextResponse.json({
    success: true,
    message: 'API key saved successfully',
  });
});

/**
 * DELETE /api/user/api-key
 * Remove user's Gemini API key
 */
export const DELETE = withGeminiAuth(async (request: NextRequest, { session }) => {
  await prisma.user.update({
    where: { id: session.user.id },
    data: { geminiApiKey: null },
  });

  return NextResponse.json({
    success: true,
    message: 'API key removed successfully',
  });
});
