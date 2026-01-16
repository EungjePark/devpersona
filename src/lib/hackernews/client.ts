// Hacker News Algolia API Client - No Auth Required
// This is the "obscure API" with powerful numericFilters

import type { HNItem, HNSearchResult } from '../types';

const HN_ALGOLIA_API = 'https://hn.algolia.com/api/v1';

/**
 * Search for all items by author (comments and stories)
 * Uses the obscure numericFilters for time-based pagination
 */
export async function fetchUserItems(
  username: string,
  limit = 100
): Promise<HNItem[]> {
  const items: HNItem[] = [];
  let page = 0;
  const maxPages = Math.ceil(limit / 50); // 50 items per page

  while (items.length < limit && page < maxPages) {
    try {
      const response = await fetch(
        `${HN_ALGOLIA_API}/search?tags=author_${username}&hitsPerPage=50&page=${page}`,
        {
          next: { revalidate: 3600 }, // Cache for 1 hour
        }
      );

      if (!response.ok) {
        break;
      }

      const data: HNSearchResult = await response.json();

      if (data.hits.length === 0) {
        break;
      }

      items.push(...data.hits);
      page++;
    } catch (error) {
      console.warn('HN search error:', error);
      break;
    }
  }

  return items.slice(0, limit);
}

/**
 * Get aggregated stats for a user
 */
export async function fetchHNStats(username: string): Promise<{
  totalPoints: number;
  totalComments: number;
  totalStories: number;
  topPost: HNItem | null;
}> {
  const items = await fetchUserItems(username, 200);

  if (items.length === 0) {
    return {
      totalPoints: 0,
      totalComments: 0,
      totalStories: 0,
      topPost: null,
    };
  }

  let totalPoints = 0;
  let totalComments = 0;
  let totalStories = 0;
  let topPost: HNItem | null = null;
  let maxPoints = 0;

  items.forEach(item => {
    const points = item.points || 0;
    totalPoints += points;

    if (item.title) {
      // Story
      totalStories++;
      if (points > maxPoints) {
        maxPoints = points;
        topPost = item;
      }
    } else {
      // Comment
      totalComments++;
    }
  });

  return {
    totalPoints,
    totalComments,
    totalStories,
    topPost,
  };
}

/**
 * Search for items with time filter (obscure feature)
 * Uses numericFilters to query by created_at_i (Unix timestamp)
 */
export async function fetchUserItemsSince(
  username: string,
  sinceDate: Date,
  limit = 100
): Promise<HNItem[]> {
  const sinceTimestamp = Math.floor(sinceDate.getTime() / 1000);

  try {
    const response = await fetch(
      `${HN_ALGOLIA_API}/search?tags=author_${username}&numericFilters=created_at_i>${sinceTimestamp}&hitsPerPage=${limit}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data: HNSearchResult = await response.json();
    return data.hits;
  } catch {
    return [];
  }
}

/**
 * Format HN stats for display
 */
export function formatHNStats(stats: {
  totalPoints: number;
  totalComments: number;
  totalStories: number;
}): string {
  const parts: string[] = [];

  if (stats.totalPoints > 0) {
    parts.push(`${formatNumber(stats.totalPoints)} karma`);
  }

  if (stats.totalComments > 0) {
    parts.push(`${formatNumber(stats.totalComments)} comments`);
  }

  if (stats.totalStories > 0) {
    parts.push(`${formatNumber(stats.totalStories)} stories`);
  }

  return parts.join(' · ') || 'No HN activity';
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
