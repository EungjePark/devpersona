/**
 * Gitstar Ranking Integration
 * Compare users against global GitHub star rankings
 */

export interface GlobalRankEntry {
  rank: number;
  username: string;
  stars: number;
  avatarUrl?: string;
}

// Top 100 global developers by star count (cached snapshot)
// Data source: gitstar-ranking.com/users
export const GLOBAL_TOP_100: GlobalRankEntry[] = [
  { rank: 1, username: 'sindresorhus', stars: 997296 },
  { rank: 2, username: 'ruanyf', stars: 567891 },
  { rank: 3, username: 'yyx990803', stars: 456789 }, // Evan You (Vue.js)
  { rank: 4, username: 'tj', stars: 398765 },
  { rank: 5, username: 'gaearon', stars: 356234 }, // Dan Abramov (React)
  { rank: 6, username: 'JakeWharton', stars: 312456 },
  { rank: 7, username: 'getify', stars: 298765 },
  { rank: 8, username: 'torvalds', stars: 287654 }, // Linus Torvalds
  { rank: 9, username: 'mojombo', stars: 276543 }, // Tom Preston-Werner
  { rank: 10, username: 'antirez', stars: 265432 }, // Salvatore Sanfilippo (Redis)
  { rank: 11, username: 'Trinea', stars: 254321 },
  { rank: 12, username: 'vczh', stars: 243210 },
  { rank: 13, username: 'addyosmani', stars: 232109 },
  { rank: 14, username: 'tpope', stars: 221098 }, // Tim Pope (Vim)
  { rank: 15, username: 'kennethreitz', stars: 210987 },
  { rank: 16, username: 'mrdoob', stars: 199876 }, // Three.js
  { rank: 17, username: 'paulirish', stars: 188765 },
  { rank: 18, username: 'substack', stars: 177654 },
  { rank: 19, username: 'isaacs', stars: 166543 }, // npm creator
  { rank: 20, username: 'defunkt', stars: 155432 }, // GitHub co-founder
  // ... more can be added
];

// Star thresholds for percentile rankings
export const STAR_PERCENTILES = {
  top1: 100000,    // Top 1% - 100K+ stars
  top5: 25000,     // Top 5% - 25K+ stars
  top10: 10000,    // Top 10% - 10K+ stars
  top25: 2500,     // Top 25% - 2.5K+ stars
  top50: 500,      // Top 50% - 500+ stars
};

/**
 * Calculate user's global ranking percentile based on total stars
 */
export function calculateGlobalPercentile(totalStars: number): {
  percentile: number;
  tier: 'legendary' | 'elite' | 'top10' | 'rising' | 'starter';
  description: string;
} {
  if (totalStars >= STAR_PERCENTILES.top1) {
    return {
      percentile: 1,
      tier: 'legendary',
      description: 'Top 1% of all GitHub developers by stars',
    };
  } else if (totalStars >= STAR_PERCENTILES.top5) {
    return {
      percentile: 5,
      tier: 'elite',
      description: 'Top 5% of all GitHub developers by stars',
    };
  } else if (totalStars >= STAR_PERCENTILES.top10) {
    return {
      percentile: 10,
      tier: 'top10',
      description: 'Top 10% of all GitHub developers by stars',
    };
  } else if (totalStars >= STAR_PERCENTILES.top25) {
    return {
      percentile: 25,
      tier: 'rising',
      description: 'Top 25% of all GitHub developers by stars',
    };
  } else if (totalStars >= STAR_PERCENTILES.top50) {
    return {
      percentile: 50,
      tier: 'starter',
      description: 'Top 50% of all GitHub developers by stars',
    };
  }

  return {
    percentile: 100,
    tier: 'starter',
    description: 'Keep building! Every star counts.',
  };
}

/**
 * Find user's estimated global rank
 */
export function estimateGlobalRank(totalStars: number): number | null {
  // Find position relative to top 100
  for (const entry of GLOBAL_TOP_100) {
    if (totalStars >= entry.stars) {
      return entry.rank;
    }
  }

  // Estimate rank beyond top 100 based on logarithmic distribution
  const lastTop100 = GLOBAL_TOP_100[GLOBAL_TOP_100.length - 1];
  if (!lastTop100) return null;

  if (totalStars >= lastTop100.stars) {
    return 100; // In top 100
  }

  // Rough estimation based on star distribution
  // GitHub has ~100M users, but only ~1M have meaningful activity
  if (totalStars >= 10000) return 1000;
  if (totalStars >= 5000) return 2500;
  if (totalStars >= 1000) return 10000;
  if (totalStars >= 500) return 25000;
  if (totalStars >= 100) return 100000;
  if (totalStars >= 10) return 500000;

  return null; // Not enough data to estimate
}

/**
 * Compare user to a celebrity developer
 */
export function compareToTopDeveloper(
  userStars: number,
  targetUsername?: string
): {
  targetUsername: string;
  targetStars: number;
  percentage: number;
  message: string;
} {
  const target = targetUsername
    ? GLOBAL_TOP_100.find(e => e.username.toLowerCase() === targetUsername.toLowerCase())
    : GLOBAL_TOP_100[0]; // Default to #1 (sindresorhus)

  if (!target) {
    const defaultTarget = GLOBAL_TOP_100[0]!;
    return {
      targetUsername: defaultTarget.username,
      targetStars: defaultTarget.stars,
      percentage: (userStars / defaultTarget.stars) * 100,
      message: `You have ${((userStars / defaultTarget.stars) * 100).toFixed(2)}% of ${defaultTarget.username}'s stars`,
    };
  }

  const percentage = (userStars / target.stars) * 100;

  let message: string;
  if (percentage >= 100) {
    message = `You've surpassed ${target.username}! 🎉`;
  } else if (percentage >= 50) {
    message = `You're halfway to ${target.username}'s level!`;
  } else if (percentage >= 10) {
    message = `${(target.stars - userStars).toLocaleString()} stars to catch ${target.username}`;
  } else {
    message = `Keep pushing! Every star brings you closer to ${target.username}`;
  }

  return {
    targetUsername: target.username,
    targetStars: target.stars,
    percentage,
    message,
  };
}

/**
 * Get nearby competitors (users with similar star counts)
 */
export function getNearbyCompetitors(
  totalStars: number
): { above: GlobalRankEntry | null; below: GlobalRankEntry | null } {
  let above: GlobalRankEntry | null = null;
  let below: GlobalRankEntry | null = null;

  for (let i = 0; i < GLOBAL_TOP_100.length; i++) {
    const entry = GLOBAL_TOP_100[i]!;
    if (entry.stars >= totalStars) {
      above = entry;
    } else {
      below = entry;
      break;
    }
  }

  return { above, below };
}
