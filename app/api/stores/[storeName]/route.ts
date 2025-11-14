import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGeminiClient, decryptApiKey } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeName: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    const { storeName: rawStoreName } = await params;
    const storeName = decodeURIComponent(rawStoreName);
    
    // Check for force delete query parameter
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';
    
    const ai = getGeminiClient(apiKey);
    
    // Delete the store with optional force config
    if (forceDelete) {
      await ai.fileSearchStores.delete({
        name: storeName,
        config: { force: true }
      });
    } else {
      await ai.fileSearchStores.delete({
        name: storeName
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting store:', error);
    
    // Extract meaningful error message from complex error objects
    let errorMessage = 'Failed to delete store';
    
    if (error.message) {
      // Check if it's a JSON error or contains nested error info
      if (error.message.includes('Cannot delete non-empty FileSearchStore')) {
        errorMessage = 'Cannot delete store with files. Please delete all files first, or use Force Delete.';
      } else if (typeof error.message === 'string') {
        errorMessage = error.message;
      }
    }
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeName: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    const { storeName: rawStoreName } = await params;
    const storeName = decodeURIComponent(rawStoreName);
    
    const ai = getGeminiClient(apiKey);
    const store = await ai.fileSearchStores.get({ name: storeName });

    return NextResponse.json({
      name: store.name || '',
      displayName: store.displayName || '',
    });
  } catch (error: any) {
    console.error('Error getting store:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get store' },
      { status: 500 }
    );
  }
}

