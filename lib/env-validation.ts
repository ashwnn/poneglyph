/**
 * Environment variable validation
 * This should be imported at the top of your main entry point (e.g., lib/prisma.ts or similar)
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'ENCRYPTION_KEY',
] as const;

const envVarValidations: Record<string, (value: string) => string | null> = {
  NEXTAUTH_SECRET: (value) => {
    if (value.length < 32) {
      return 'NEXTAUTH_SECRET must be at least 32 characters long. Generate with: openssl rand -base64 32';
    }
    return null;
  },
  ENCRYPTION_KEY: (value) => {
    if (value.length !== 64) {
      return 'ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32';
    }
    if (!/^[0-9a-fA-F]{64}$/.test(value)) {
      return 'ENCRYPTION_KEY must contain only hexadecimal characters';
    }
    return null;
  },
};

export function validateEnvironment() {
  const errors: string[] = [];

  // Check required variables exist
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Run specific validations
  for (const [key, validator] of Object.entries(envVarValidations)) {
    const value = process.env[key];
    if (value) {
      const error = validator(value);
      if (error) {
        errors.push(error);
      }
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:\n');
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file and restart the server.\n');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. See logs for details.');
    } else {
      console.error('⚠️  Server starting in development mode despite errors...\n');
    }
  } else {
    console.log('✅ Environment variables validated successfully');
  }
}

// Auto-validate on import (only in Node.js environment)
if (typeof window === 'undefined') {
  validateEnvironment();
}
