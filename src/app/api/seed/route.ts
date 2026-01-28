// Seed API Route
// Fetches popular developers from GitHub and adds them to the leaderboard
// Uses server-side GITHUB_TOKEN for API calls

import { NextRequest, NextResponse } from 'next/server';
import { requireBearerAuth } from '@/lib/api/auth';

export const runtime = 'edge';

const GITHUB_API = 'https://api.github.com';

// Popular developers to seed (curated list for reliable data)
const SEED_DEVELOPERS = [
  'torvalds',
  'gaearon',
  'sindresorhus',
  'tj',
  'getify',
  'addyosmani',
  'paulirish',
  'yyx990803',
  'developit',
  'rauchg',
];

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  public_repos: number;
  followers: number;
}

export async function GET(request: NextRequest) {
  // SECURITY: Auth first - prevent info leak about server config
  const auth = requireBearerAuth(request, 'SEED_SECRET');
  if (!auth.success) return auth.response;

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'GitHub token not configured' },
      { status: 500 }
    );
  }

  const results: Array<{
    username: string;
    avatarUrl: string;
    name: string | null;
    repos: number;
    followers: number;
    status: 'success' | 'error';
    error?: string;
  }> = [];

  for (const username of SEED_DEVELOPERS) {
    try {
      const response = await fetch(`${GITHUB_API}/users/${username}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DevPersona/1.0',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        results.push({
          username,
          avatarUrl: '',
          name: null,
          repos: 0,
          followers: 0,
          status: 'error',
          error: `HTTP ${response.status}`,
        });
        continue;
      }

      const user: GitHubUser = await response.json();

      results.push({
        username: user.login,
        avatarUrl: user.avatar_url,
        name: user.name,
        repos: user.public_repos,
        followers: user.followers,
        status: 'success',
      });
    } catch (error) {
      results.push({
        username,
        avatarUrl: '',
        name: null,
        repos: 0,
        followers: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const successful = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({
    message: `Seeded ${successful} developers (${failed} failed)`,
    results,
    timestamp: new Date().toISOString(),
  });
}

// Search GitHub for popular developers
export async function POST(request: NextRequest) {
  // SECURITY: Auth first - prevent info leak about server config
  const auth = requireBearerAuth(request, 'SEED_SECRET');
  if (!auth.success) return auth.response;

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'GitHub token not configured' },
      { status: 500 }
    );
  }

  try {
    // Search for users with many followers
    const searchResponse = await fetch(
      `${GITHUB_API}/search/users?q=followers:>10000&sort=followers&per_page=20`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DevPersona/1.0',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: `GitHub search failed: ${searchResponse.status}` },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();

    return NextResponse.json({
      message: `Found ${searchData.total_count} developers with 10k+ followers`,
      users: searchData.items.map((user: { login: string; avatar_url: string }) => ({
        username: user.login,
        avatarUrl: user.avatar_url,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
