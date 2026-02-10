import { NextRequest, NextResponse } from 'next/server';
import { withGeminiAuth } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export const GET = withGeminiAuth(async (request: NextRequest, { session }) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 1, // Just to check if conversation has messages
      },
    },
  });

  return NextResponse.json(conversations);
});

export const POST = withGeminiAuth(async (request: NextRequest, { session }) => {
  const { title } = await request.json();

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title: title || 'New Conversation',
    },
  });

  return NextResponse.json(conversation);
});

