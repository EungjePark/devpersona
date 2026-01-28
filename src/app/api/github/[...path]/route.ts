// GitHub API Proxy Route
// Uses server-side GITHUB_TOKEN for unauthenticated requests
// This solves the 60 requests/hour rate limit issue

import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

export const runtime = 'edge';

// SECURITY: Whitelist of allowed GitHub API path patterns
// Prevents arbitrary API access that could abuse the token
const ALLOWED_PATH_PATTERNS = [
  /^users\/[a-zA-Z0-9_-]+$/, // User profile
  /^users\/[a-zA-Z0-9_-]+\/repos$/, // User repositories
  /^users\/[a-zA-Z0-9_-]+\/events$/, // User events
  /^users\/[a-zA-Z0-9_-]+\/events\/public$/, // User public events
  /^repos\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/, // Repository info
  /^repos\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\/commits$/, // Repository commits
  /^repos\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\/languages$/, // Repository languages
  /^repos\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\/contributors$/, // Repository contributors
  /^repos\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\/stats\/contributors$/, // Contributor stats
];

function isPathAllowed(path: string): boolean {
  return ALLOWED_PATH_PATTERNS.some(pattern => pattern.test(path));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const githubPath = path.join('/');

  // SECURITY: Validate path against whitelist
  if (!isPathAllowed(githubPath)) {
    return NextResponse.json(
      { error: 'Path not allowed' },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${GITHUB_API}/${githubPath}${searchParams ? `?${searchParams}` : ''}`;

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'GitHub token not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DevPersona/1.0',
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return with cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '',
        'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit') || '',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch from GitHub API' },
      { status: 500 }
    );
  }
}
