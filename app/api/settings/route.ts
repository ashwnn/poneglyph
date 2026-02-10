import { NextRequest, NextResponse } from 'next/server';
import { withGeminiAuth } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { parseSettings } from '@/lib/settings';

export const GET = withGeminiAuth(async (request: NextRequest, { session }) => {
  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    // Verify user exists before creating settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User does not exist. Please sign in again.' },
        { status: 401 }
      );
    }

    // Create default settings
    settings = await prisma.userSettings.create({
      data: {
        userId: session.user.id,
        ...parseSettings({}),
      },
    });
  }

  return NextResponse.json(settings);
});

export const POST = withGeminiAuth(async (request: NextRequest, { session }) => {
  const rawData = await request.json();
  const settings = parseSettings(rawData);

  // Whitelist known fields to prevent injection
  const {
    globalInstructions,
    defaultModel,
    preferShorterAnswers,
    enableCitations,
    defaultChunking,
    defaultMetadataPresets,
    theme,
    showAdvancedControls
  } = settings;

  const upsertData = {
    globalInstructions,
    defaultModel,
    preferShorterAnswers,
    enableCitations,
    defaultChunking: defaultChunking as any, // Prisma relies on JSON
    defaultMetadataPresets: defaultMetadataPresets as any,
    theme,
    showAdvancedControls
  };

  const savedSettings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: upsertData,
    create: {
      userId: session.user.id,
      ...upsertData,
    },
  });

  return NextResponse.json(savedSettings);
});

