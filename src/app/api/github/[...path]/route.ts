// GitHub API Proxy Route
// Uses server-side GITHUB_TOKEN for unauthenticated requests
// This solves the 60 requests/hour rate limit issue

import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const githubPath = path.join('/');
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
  } catch (error) {
    console.error('GitHub proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from GitHub API' },
      { status: 500 }
    );
  }
}
