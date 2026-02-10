import { NextRequest, NextResponse } from 'next/server';
import { withGeminiAuth } from '@/lib/api-helpers';
import { getGeminiClient, decryptApiKey } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

export const GET = withGeminiAuth(async (request: NextRequest, { session }) => {
  // Fetch user's API key
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { geminiApiKey: true },
  });

  if (!user?.geminiApiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured. Please add your API key in settings.' },
      { status: 400 }
    );
  }

  const apiKey = decryptApiKey(user.geminiApiKey);
  const ai = getGeminiClient(apiKey);
  const storesPager = await ai.fileSearchStores.list();
  const stores: { name: string; displayName: string }[] = [];

  for await (const store of storesPager) {
    stores.push({
      name: store.name || '',
      displayName: store.displayName || '',
    });
  }

  return NextResponse.json(stores);
});

export const POST = withGeminiAuth(async (request: NextRequest, { session }) => {
  // Fetch user's API key
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { geminiApiKey: true },
  });

  if (!user?.geminiApiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured. Please add your API key in settings.' },
      { status: 400 }
    );
  }

  const apiKey = decryptApiKey(user.geminiApiKey);

  const { displayName } = await request.json();

  if (!displayName || typeof displayName !== 'string') {
    return NextResponse.json(
      { error: 'displayName is required' },
      { status: 400 }
    );
  }

  const ai = getGeminiClient(apiKey);
  const response = await ai.fileSearchStores.create({
    config: { displayName },
  });

  return NextResponse.json({
    name: response.name || '',
    displayName: response.displayName || displayName,
  });
});

