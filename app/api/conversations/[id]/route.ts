import { NextRequest, NextResponse } from 'next/server';
import { withGeminiAuth } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export const GET = withGeminiAuth<{ id: string }>(async (request: NextRequest, { params, session }) => {
  const { id } = params;
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(conversation);
});

export const DELETE = withGeminiAuth<{ id: string }>(async (request: NextRequest, { params, session }) => {
  const { id } = params;
  await prisma.conversation.deleteMany({
    where: {
      id,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
});

export const PATCH = withGeminiAuth<{ id: string }>(async (request: NextRequest, { params, session }) => {
  const { id } = params;
  const { title } = await request.json();

  const conversation = await prisma.conversation.updateMany({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      title,
    },
  });

  return NextResponse.json({ success: true });
});

