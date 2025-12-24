import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
          globalInstructions: '',
          defaultModel: 'gemini-2.5-flash',
          preferShorterAnswers: false,
          enableCitations: true,
          showAdvancedControls: false,
          theme: 'light',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Verify user exists before upserting settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User does not exist. Please sign in again.' },
        { status: 401 }
      );
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}

