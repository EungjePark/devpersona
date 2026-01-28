/**
 * Admin API Route: Seed leaderboard with real GitHub data
 * Analyzes famous developers using the actual GitHub API and saves results to Convex
 *
 * Usage: POST /api/admin/seed-real
 * Headers: Authorization: Bearer <SEED_SECRET>
 * Body: { limit?: number, clearExisting?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireBearerAuth } from '@/lib/api/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

export const runtime = 'nodejs'; // Node runtime required for maxDuration > 30s
export const maxDuration = 300; // 5 minutes for processing many developers

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Famous developers to seed with real data
const FAMOUS_DEVELOPERS = [
  // Language & Platform Creators
  'torvalds', 'gvanrossum', 'ry', 'matz', 'lattner',

  // Framework Creators
  'yyx990803', 'gaearon', 'Rich-Harris', 'tj', 'rauchg',
  'developit', 'tannerlinsley', 'shadcn', 'tiangolo',

  // Prolific Contributors
  'sindresorhus', 'kentcdodds', 'addyosmani', 'antfu',
  'colinhacks', 'shuding', 'pacocoursey', 'jaredpalmer',

  // Educators & Advocates
  'wesbos', 'getify', 'cassidoo', 'leerob',
];

interface AnalysisResult {
  username: string;
  avatarUrl: string;
  name: string | null;
  signals: {
    grit: number;
    focus: number;
    craft: number;
    impact: number;
    voice: number;
    reach: number;
  };
  overallRating: number;
  tier: { level: string };
  archetype: { id: string };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = requireBearerAuth(request, 'SEED_SECRET');
  if (!auth.success) return auth.response;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: 'Convex URL not configured' },
      { status: 500 }
    );
  }

  let body: { limit?: number; clearExisting?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine
  }

  const limit = body.limit ?? FAMOUS_DEVELOPERS.length;
  const clearExisting = body.clearExisting ?? false;
  const developers = FAMOUS_DEVELOPERS.slice(0, limit);

  const convex = new ConvexHttpClient(convexUrl);
  const baseUrl = new URL(request.url).origin;

  // Clear existing analyses if requested
  let clearedCount = 0;
  if (clearExisting) {
    try {
      const clearResult = await convex.action(api.analyses.adminClearAnalyses, {});
      clearedCount = clearResult.deleted;
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to clear existing data: ${error instanceof Error ? error.message : 'Unknown'}` },
        { status: 500 }
      );
    }
  }

  const results: Array<{
    username: string;
    status: 'success' | 'error' | 'skipped';
    rating?: number;
    error?: string;
  }> = [];

  for (const username of developers) {
    try {
      // Call the analyze endpoint to get real GitHub data
      const analyzeResponse = await fetch(`${baseUrl}/api/analyze/${username}`);

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        results.push({
          username,
          status: 'error',
          error: `HTTP ${analyzeResponse.status}: ${errorText.slice(0, 100)}`,
        });

        await sleep(1000); // Rate limit delay
        continue;
      }

      const data: AnalysisResult = await analyzeResponse.json();

      // Save to Convex
      await convex.mutation(api.analyses.saveAnalysisPublic, {
        username: data.username,
        avatarUrl: data.avatarUrl,
        name: data.name ?? undefined,
        grit: data.signals.grit,
        focus: data.signals.focus,
        craft: data.signals.craft,
        impact: data.signals.impact,
        voice: data.signals.voice,
        reach: data.signals.reach,
        overallRating: data.overallRating,
        tier: data.tier.level,
        archetypeId: data.archetype.id,
        analyzedAt: Date.now(),
      });

      results.push({
        username,
        status: 'success',
        rating: data.overallRating,
      });

      await sleep(500); // Rate limit delay

    } catch (error) {
      results.push({
        username,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      await sleep(1000); // Rate limit delay on error
    }
  }

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;

  return NextResponse.json({
    message: `Seeded ${successful} developers with real data (${failed} failed)${clearedCount > 0 ? `, cleared ${clearedCount} existing` : ''}`,
    total: developers.length,
    successful,
    failed,
    cleared: clearedCount,
    results,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = requireBearerAuth(request, 'SEED_SECRET');
  if (!auth.success) return auth.response;

  return NextResponse.json({
    developers: FAMOUS_DEVELOPERS,
    total: FAMOUS_DEVELOPERS.length,
    usage: 'POST with { limit?: number, clearExisting?: boolean } to seed with real GitHub data',
  });
}
