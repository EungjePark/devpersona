import { NextRequest, NextResponse } from 'next/server';

// Tier colors for shields.io
const TIER_COLORS: Record<string, string> = {
  S: 'd97706',   // Amber/Gold
  A: '9333ea',   // Purple
  B: '2563eb',   // Blue
  C: '52525b',   // Gray
};

// Tier names
const TIER_NAMES: Record<string, string> = {
  S: 'LEGENDARY',
  A: 'EPIC',
  B: 'RARE',
  C: 'COMMON',
};

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

  // Try to get real data from Convex (in a real implementation)
  // For now, we'll just return the placeholder
  // The frontend will need to call the Convex API directly
  // since Edge Runtime doesn't support Convex client directly

  return NextResponse.json(badge, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
    },
  });
}

// Alternative: Return SVG directly for img src usage
export async function generateBadgeSvg(
  username: string,
  tier: string,
  rating: number,
  _style: string = 'flat' // Reserved for badge style variants
): Promise<string> {
  void _style;
  const color = TIER_COLORS[tier] || '6366f1';
  const tierName = TIER_NAMES[tier] || 'UNKNOWN';
  const message = `${tierName} | OVR ${rating}`;

  // Simple flat badge SVG
  const labelWidth = 70;
  const messageWidth = message.length * 7 + 10;
  const totalWidth = labelWidth + messageWidth;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="DevPersona: ${message}">
  <title>DevPersona: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="#${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">DevPersona</text>
    <text x="${labelWidth * 5}" y="140" transform="scale(.1)">DevPersona</text>
    <text aria-hidden="true" x="${labelWidth * 10 + messageWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${message}</text>
    <text x="${labelWidth * 10 + messageWidth * 5}" y="140" transform="scale(.1)">${message}</text>
  </g>
</svg>
  `.trim();
}
