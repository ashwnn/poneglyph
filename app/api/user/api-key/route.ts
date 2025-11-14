import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptApiKey, decryptApiKey } from '@/lib/gemini';

/**
 * GET /api/user/api-key
 * Check if user has an API key configured
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { geminiApiKey: true },
    });

    return NextResponse.json({
      hasApiKey: !!user?.geminiApiKey,
    });
  } catch (error: any) {
    console.error('Error checking API key:', error);
    return NextResponse.json(
      { error: 'Failed to check API key' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/api-key
 * Set or update user's Gemini API key
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
  } catch (error: any) {
    console.error('Error saving API key:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/api-key
 * Remove user's Gemini API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { geminiApiKey: null },
    });

    return NextResponse.json({
      success: true,
      message: 'API key removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing API key:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }
}
