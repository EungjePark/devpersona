/**
 * Admin API: Seed Stations
 * POST /api/admin/seed-stations
 *
 * Seeds sample stations into the database for demo/testing.
 * Requires ADMIN_SECRET bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { requireBearerAuth } from '@/lib/api/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = requireBearerAuth(request, 'ADMIN_SECRET');
  if (!auth.success) return auth.response;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: 'Convex URL not configured' },
      { status: 500 }
    );
  }

  const adminSecret = process.env.ADMIN_SECRET!;
  const convex = new ConvexHttpClient(convexUrl);

  try {
    const result = await convex.action(api.seed.triggerStationSeed, {
      adminSecret,
    });

    return NextResponse.json({
      message: `Seeded ${result.successful} of ${result.total} stations`,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to seed stations',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
