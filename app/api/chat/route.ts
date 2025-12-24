import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGeminiClient, decryptApiKey } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

    const {
      message,
      storeNames,
      instructions,
      metadataFilter,
      model: requestedModel = 'gemini-2.5-flash',
      conversationId
    } = await request.json();

    // Mapping layer to convert requested names to actual model IDs
    const modelMapping: Record<string, string> = {
      'gemini-2.5-flash-lite': 'gemini-1.5-flash-8b',
      'gemini-2.5-flash': 'gemini-1.5-flash',
      'gemini-2.5-pro': 'gemini-1.5-pro',
      'gemini-3.0-flash': 'gemini-2.0-flash-exp',
      'gemini-3.0-pro': 'gemini-1.5-pro', // Fallback to 1.5 Pro until 2.0 Pro is GA
    };

    const model = modelMapping[requestedModel] || requestedModel;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    if (!storeNames || !Array.isArray(storeNames) || storeNames.length === 0) {
      return NextResponse.json(
        { error: 'At least one store name is required' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    const ai = getGeminiClient(apiKey);

    // Build contents array
    const contents: any[] = [];

    // Add global instructions if provided
    if (instructions && typeof instructions === 'string' && instructions.trim()) {
      contents.push({
        role: 'user',
        parts: [{ text: `System Instructions: ${instructions}` }],
      });
    }

    // Add user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Build file search tool config
    const fileSearchConfig: any = {
      fileSearchStoreNames: storeNames,
    };

    if (metadataFilter && typeof metadataFilter === 'string' && metadataFilter.trim()) {
      fileSearchConfig.metadataFilter = metadataFilter;
    }

    // Generate content
    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        tools: [{ fileSearch: fileSearchConfig }],
      },
    });
    const response = result;
    const text = response.text || '';

    // Extract citations from grounding metadata
    const citations: any[] = [];
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.retrievedContext) {
          const context = chunk.retrievedContext;
          // Extract filename from documentUri (e.g., "corpora/xxx/documents/yyy" -> document name)
          const documentUri = (context as any).documentUri || (context as any).uri || '';
          const title = (context as any).title || '';

          // Try to get a clean filename - prioritize title, then extract from URI
          let fileName = title;
          if (!fileName && documentUri) {
            // Extract last segment of the URI path as filename
            const uriParts = documentUri.split('/');
            fileName = uriParts[uriParts.length - 1] || 'Unknown source';
          }
          fileName = fileName || 'Unknown source';

          citations.push({
            fileName,
            snippet: (context as any).snippet || (context as any).text || '',
          });
        } else if (chunk.web) {
          citations.push({
            fileName: chunk.web.title || chunk.web.uri || 'Web source',
            snippet: chunk.web.uri || '',
          });
        }
      }
    }

    // Deduplicate citations by fileName
    const uniqueCitations = citations.reduce((acc: any[], citation) => {
      const existing = acc.find(c => c.fileName === citation.fileName);
      if (!existing) {
        acc.push(citation);
      } else if (citation.snippet && !existing.snippet) {
        existing.snippet = citation.snippet;
      }
      return acc;
    }, []);

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: text,
        citations: uniqueCitations.length > 0 ? uniqueCitations : undefined,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      text,
      citations: uniqueCitations.length > 0 ? uniqueCitations : undefined,
      conversationId: conversation.id,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
