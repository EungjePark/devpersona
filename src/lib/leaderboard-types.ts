// Shared types for leaderboard functionality

/**
 * Represents a user entry in the leaderboard
 */
export interface TopUser {
  username: string;
  avatarUrl: string;
  overallRating: number;
  tier: string;
  archetypeId: string;
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
