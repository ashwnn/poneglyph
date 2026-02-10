import { NextRequest, NextResponse } from 'next/server';
import { withGeminiAuth } from '@/lib/api-helpers';
import { getGeminiClient, decryptApiKey } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

export const POST = withGeminiAuth<{ storeName: string }>(async (
  request: NextRequest,
  { params, session }
) => {
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

  const { storeName: rawStoreName } = params;
  const storeName = decodeURIComponent(rawStoreName);
  const formData = await request.formData();

  const file = formData.get('file') as File;
  const displayName = formData.get('displayName') as string;
  const chunkingConfigStr = formData.get('chunkingConfig') as string | null;
  const customMetadataStr = formData.get('customMetadata') as string | null;

  if (!file) {
    return NextResponse.json(
      { error: 'File is required' },
      { status: 400 }
    );
  }

  if (!displayName) {
    return NextResponse.json(
      { error: 'displayName is required' },
      { status: 400 }
    );
  }

  const ai = getGeminiClient(apiKey);

  // Parse chunking config if provided
  let chunkingConfig: any = undefined;
  if (chunkingConfigStr) {
    try {
      const parsed = JSON.parse(chunkingConfigStr);
      if (parsed.maxTokensPerChunk || parsed.maxOverlapTokens) {
        chunkingConfig = {
          whiteSpaceConfig: {
            maxTokensPerChunk: parsed.maxTokensPerChunk,
            maxOverlapTokens: parsed.maxOverlapTokens,
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse chunkingConfig:', e);
    }
  }

  // Parse custom metadata if provided
  let customMetadata: any[] | undefined = undefined;
  if (customMetadataStr) {
    try {
      const parsed = JSON.parse(customMetadataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customMetadata = parsed.map((item: any) => {
          const entry: any = { key: item.key };
          if (item.stringValue !== undefined) {
            entry.stringValue = item.stringValue;
          }
          if (item.numericValue !== undefined) {
            entry.numericValue = item.numericValue;
          }
          return entry;
        });
      }
    } catch (e) {
      console.warn('Failed to parse customMetadata:', e);
    }
  }

  // Upload to File Search store
  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: file,
    fileSearchStoreName: storeName,
    config: {
      displayName,
      ...(chunkingConfig && { chunkingConfig }),
      ...(customMetadata && { customMetadata }),
    },
  });

  // Poll for completion
  let pollCount = 0;
  const maxPolls = 60; // 5 minutes max (60 * 5 seconds)

  while (!operation.done && pollCount < maxPolls) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const updatedOperation = await ai.operations.get({ operation });

    if (updatedOperation.done) {
      if (updatedOperation.error) {
        return NextResponse.json({
          fileName: file.name,
          displayName,
          status: 'error',
          error: updatedOperation.error.message || 'Upload failed',
        });
      }

      return NextResponse.json({
        fileName: file.name,
        displayName,
        status: 'ready',
        operationName: updatedOperation.name,
      });
    }

    operation.done = updatedOperation.done;
    pollCount++;
  }

  // Timeout
  if (!operation.done) {
    return NextResponse.json({
      fileName: file.name,
      displayName,
      status: 'error',
      error: 'Upload timeout - operation is still in progress',
      operationName: operation.name,
    });
  }

  return NextResponse.json({
    fileName: file.name,
    displayName,
    status: 'ready',
    operationName: operation.name,
  });
});

