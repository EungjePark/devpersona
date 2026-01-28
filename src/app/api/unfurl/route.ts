import { NextRequest, NextResponse } from 'next/server';
import { unfurl } from 'unfurl.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UnfurlResult {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  siteName?: string;
  url: string;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  // Validate URL with SSRF protection
  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only HTTP(S) URLs allowed' }, { status: 400 });
    }

    // Block localhost and private IPs
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  try {
    const metadata = await unfurl(url, {
      timeout: 5000,
      follow: 3,
    });

    const result: UnfurlResult = {
      url,
      title: metadata.title || metadata.open_graph?.title || undefined,
      description: metadata.description || metadata.open_graph?.description || undefined,
      siteName: metadata.open_graph?.site_name || undefined,
      favicon: metadata.favicon || undefined,
      ogImage: metadata.open_graph?.images?.[0]?.url || undefined,
    };

    // Try to extract favicon from URL if not found
    if (!result.favicon) {
      try {
        const urlObj = new URL(url);
        result.favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
      } catch {
        // Ignore favicon extraction errors
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unfurl error:', error);

    // Return partial data with favicon fallback
    try {
      const urlObj = new URL(url);
      return NextResponse.json({
        url,
        favicon: `${urlObj.protocol}//${urlObj.host}/favicon.ico`,
      });
    } catch {
      return NextResponse.json({ url, error: 'Failed to fetch metadata' }, { status: 500 });
    }
  }
}
