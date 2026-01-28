import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

type AuthResult = {
  success: true;
} | {
  success: false;
  response: NextResponse;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Validates bearer token authentication for protected API routes.
 * @param request - The Next.js request object
 * @param envVarName - Name of the environment variable containing the secret
 * @returns Auth result with success flag or error response
 */
export function requireBearerAuth(
  request: NextRequest,
  envVarName: string
): AuthResult {
  const authHeader = request.headers.get('Authorization');
  const secret = process.env[envVarName];

  if (!secret) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `${envVarName} not configured - endpoint disabled` },
        { status: 503 }
      ),
    };
  }

  const expectedToken = `Bearer ${secret}`;
  if (!authHeader || !safeCompare(authHeader, expectedToken)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return { success: true };
}
