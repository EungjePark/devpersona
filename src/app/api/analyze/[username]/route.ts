/**
 * API Route: Analyze a GitHub user
 * Returns full analysis result including signals, archetype, and tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeUser } from '@/lib/analysis';

// Use edge runtime for better performance
export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username || username.length < 1) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Validate username format
  const cleanUsername = username.trim().replace('@', '');
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleanUsername)) {
    return NextResponse.json({ error: 'Invalid GitHub username format' }, { status: 400 });
  }

  try {
    const result = await analyzeUser(cleanUsername);

    // Return the full analysis result
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Analysis error for ${cleanUsername}:`, error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'GitHub API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return NextResponse.json(
          { error: `GitHub user "${cleanUsername}" not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
