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

  // Placeholder - in production, this would query actual data
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
