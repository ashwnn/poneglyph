import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGeminiClient, decryptApiKey } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeName: string; fileName: string }> }
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

    const { storeName: rawStoreName, fileName: rawFileName } = await params;
    const storeName = decodeURIComponent(rawStoreName);
    const fileName = decodeURIComponent(rawFileName);
    
    // Check for force delete query parameter
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';
    
    const ai = getGeminiClient(apiKey);
    
    // Delete the document from the file search store with optional force config
    if (forceDelete) {
      await ai.fileSearchStores.documents.delete({
        name: fileName,
        config: { force: true }
      });
    } else {
      await ai.fileSearchStores.documents.delete({
        name: fileName
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file from store:', error);
    
    // Extract meaningful error message from complex error objects
    let errorMessage = 'Failed to delete file';
    
    if (error.message) {
      if (error.message.includes('Cannot delete non-empty Document')) {
        errorMessage = 'Cannot delete file with operations in progress. Please try again.';
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
