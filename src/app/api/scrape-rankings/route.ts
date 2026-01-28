import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { requireBearerAuth } from '@/lib/api/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ScrapedRanking {
  rank: number;
  username: string;
  stars: number;
  avatarUrl?: string;
}

/**
 * Parse gitstar-ranking.com HTML to extract user rankings
 */
function parseRankingsHtml(html: string, pageOffset: number): ScrapedRanking[] {
  const rankings: ScrapedRanking[] = [];
  const userPattern = /<a[^>]*href="\/([a-zA-Z0-9_-]+)"[^>]*>[\s\S]*?(\d{4,})\s*<\/a>/gi;

  let match;
  let rank = pageOffset;

  while ((match = userPattern.exec(html)) !== null) {
    const username = match[1];
    const stars = parseInt(match[2], 10);

    if (username && stars >= 1000 && !['users', 'repositories', 'organizations'].includes(username)) {
      rank++;
      rankings.push({
        rank,
        username,
        stars,
        avatarUrl: `https://avatars.githubusercontent.com/${username}`,
      });
    }
  }

  return rankings;
}

/**
 * Fetch and parse rankings from gitstar-ranking.com
 */
async function scrapeGitstarRankings(pages: number = 1): Promise<ScrapedRanking[]> {
  const allRankings: ScrapedRanking[] = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const url = page === 1
        ? 'https://gitstar-ranking.com/users'
        : `https://gitstar-ranking.com/users?page=${page}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DevPersona/1.0 (GitHub Analysis Tool)',
          'Accept': 'text/html',
        },
      });

      if (!response.ok) continue;

      const html = await response.text();
      const pageOffset = (page - 1) * 100;
      const pageRankings = parseRankingsHtml(html, pageOffset);
      allRankings.push(...pageRankings);

      if (page < pages) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`[scrape-rankings] Failed to fetch page ${page}:`, error);
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return allRankings.filter((r) => {
    const lower = r.username.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  }).map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = requireBearerAuth(request, 'SCRAPE_API_KEY');
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(request.url);
  const pages = Math.min(parseInt(searchParams.get('pages') ?? '1', 10), 5);
  const dryRun = searchParams.get('dry_run') === 'true';

  try {
    const rankings = await scrapeGitstarRankings(pages);

    if (rankings.length === 0) {
      return NextResponse.json(
        { error: 'Failed to scrape rankings', hint: 'HTML structure may have changed' },
        { status: 500 }
      );
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        count: rankings.length,
        sample: rankings.slice(0, 10),
      });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    const result = await client.mutation(api.globalRankings.upsertRankingsPublic, {
      rankings: rankings.map((r) => ({
        rank: r.rank,
        username: r.username,
        stars: r.stars,
        avatarUrl: r.avatarUrl,
      })),
    });

    return NextResponse.json({
      success: true,
      ...result,
      sample: rankings.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Scraping failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export { GET as POST };
