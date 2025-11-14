import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid boolean and error message if invalid
 */
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (process.env.ALLOW_REGISTRATION === 'false') {
      return NextResponse.json(
        { error: 'User registration is disabled' },
        { status: 403 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Create default settings (removed defaultStoreNames as it doesn't exist in schema)
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        globalInstructions: '',
        defaultModel: 'gemini-2.5-flash',
        preferShorterAnswers: false,
        enableCitations: true,
        showAdvancedControls: false,
        theme: 'light',
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Don't expose internal error details to clients in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Failed to register user';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

