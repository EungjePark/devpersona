// Shared types for leaderboard functionality

/**
 * Represents a user entry in the leaderboard
 * Extended with star/follower data for ranking tabs
 */
export interface TopUser {
  username: string;
  avatarUrl: string;
  overallRating: number;
  tier: string;
  archetypeId: string;
  // Extended metrics
  totalStars?: number;
  followers?: number;
  topLanguage?: string;
}

/**
 * Distribution bucket for rating histogram
 */
export interface DistributionBucket {
  bucket: string;
  count: number;
}

/**
 * Leaderboard snapshot data structure
 */
export interface LeaderboardSnapshot {
  topUsers: TopUser[];
  distribution: DistributionBucket[];
  totalUsers: number;
}

/**
 * Ranking category for leaderboard tabs
 */
export type RankingCategory = 'rating' | 'stars' | 'followers';

/**
 * Sort users by a given category
 */
export function sortUsersByCategory(users: TopUser[], category: RankingCategory): TopUser[] {
  const sorted = [...users];
  switch (category) {
    case 'stars':
      return sorted.sort((a, b) => (b.totalStars || 0) - (a.totalStars || 0));
    case 'followers':
      return sorted.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    case 'rating':
    default:
      return sorted.sort((a, b) => b.overallRating - a.overallRating);
  }
}

/**
 * Format number compactly (e.g., 1.2K, 45.3M)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}
