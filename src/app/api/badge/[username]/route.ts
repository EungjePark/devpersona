import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

interface BadgeResponse {
  schemaVersion: number;
  label: string;
  message: string;
  color: string;
  namedLogo?: string;
  logoColor?: string;
  style?: string;
}

const TIER_COLORS: Record<string, string> = {
  S: 'd97706', // amber
  A: '9333ea', // purple
  B: '2563eb', // blue
  C: '52525b', // gray
};

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const { searchParams } = new URL(request.url);
  const style = searchParams.get('style') || 'flat';

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('Convex URL not configured');
    }

    const convex = new ConvexHttpClient(convexUrl);
    const analysis = await convex.query(api.analyses.getByUsername, { username });

    if (!analysis) {
      // User not analyzed yet - return prompt badge
      const badge: BadgeResponse = {
        schemaVersion: 1,
        label: 'DevPersona',
        message: `Analyze @${username}`,
        color: '6366f1',
        namedLogo: 'github',
        logoColor: 'white',
        style,
      };
      return NextResponse.json(badge, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      });
    }

    // Return badge with real data - show archetype and tier
    const tierColor = TIER_COLORS[analysis.tier] || '6b7280';
    const badge: BadgeResponse = {
      schemaVersion: 1,
      label: `${analysis.tier} Tier • OVR ${analysis.overallRating}`,
      message: analysis.archetypeId?.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Developer',
      color: tierColor,
      namedLogo: 'github',
      logoColor: 'white',
      style,
    };

    return NextResponse.json(badge, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Badge API error:', error);

    const badge: BadgeResponse = {
      schemaVersion: 1,
      label: 'DevPersona',
      message: 'Error',
      color: 'dc2626',
      namedLogo: 'github',
      logoColor: 'white',
      style,
    };

    return NextResponse.json(badge, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
