import { NextRequest, NextResponse } from 'next/server';

interface BadgeResponse {
  schemaVersion: number;
  label: string;
  message: string;
  color: string;
  namedLogo?: string;
  logoColor?: string;
  style?: string;
}

export const runtime = 'edge';

// Reserved for future star count badge implementation
// function formatCompact(num: number): string {
//   if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
//   if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
//   return num.toString();
// }

// function getStarColor(stars: number): string {
//   if (stars >= 100000) return 'ffd700'; // Gold
//   if (stars >= 10000) return 'a855f7';  // Purple
//   if (stars >= 1000) return '3b82f6';   // Blue
//   if (stars >= 100) return '22c55e';    // Green
//   return '6b7280'; // Gray
// }

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const { searchParams } = new URL(request.url);
  const style = searchParams.get('style') || 'flat';

  // Placeholder - in production, this would query actual data
  // For now, return a generic badge that links to the profile
  const badge: BadgeResponse = {
    schemaVersion: 1,
    label: 'GitHub Stars',
    message: `@${username}`,
    color: '6b7280',
    namedLogo: 'github',
    logoColor: 'white',
    style: style,
  };

  return NextResponse.json(badge, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
