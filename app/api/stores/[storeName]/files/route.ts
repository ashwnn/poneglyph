import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGeminiClient, decryptApiKey } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

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
    
    // List documents in the file search store
    const documentsPager = await ai.fileSearchStores.documents.list({
      parent: storeName,
    });
    
    const documents: Array<{
      name: string;
      displayName: string;
      sizeBytes?: string;
      mimeType?: string;
    }> = [];
    
    for await (const doc of documentsPager) {
      documents.push({
        name: doc.name || '',
        displayName: doc.displayName || '',
        sizeBytes: doc.sizeBytes,
        mimeType: doc.mimeType,
      });
    }

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Error listing files in store:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: 500 }
    );
  }
}
