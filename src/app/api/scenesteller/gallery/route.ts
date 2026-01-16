import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SCENESTELLER_API = 'https://adorable-jackal-568.convex.site/public-gallery';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('username') || searchParams.get('userId');
  const limit = searchParams.get('limit') || '12';

  try {
    const url = new URL(SCENESTELLER_API);
    if (userId) url.searchParams.set('userId', userId);
    url.searchParams.set('limit', limit);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Return empty gallery instead of error (external service may be unavailable)
      return NextResponse.json(
        { success: true, images: [] },
        { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch {
    // Return empty gallery on any error
    return NextResponse.json(
      { success: true, images: [] },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
    );
  }
}
