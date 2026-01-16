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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const { searchParams } = new URL(request.url);
  const style = searchParams.get('style') || 'flat';

  // For now, return a placeholder badge
  // In production, this would query Convex for the actual analysis
  const badge: BadgeResponse = {
    schemaVersion: 1,
    label: 'DevPersona',
    message: `Analyze @${username}`,
    color: '6366f1',
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
