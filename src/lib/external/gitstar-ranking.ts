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
// Data source: gitstar-ranking.com/users (Updated: Jan 2026)
export const GLOBAL_TOP_100: GlobalRankEntry[] = [
  { rank: 1, username: 'sindresorhus', stars: 997296 },
  { rank: 2, username: 'kamranahmedse', stars: 441492 },
  { rank: 3, username: 'donnemartin', stars: 431077 },
  { rank: 4, username: 'jwasham', stars: 350558 },
  { rank: 5, username: 'karpathy', stars: 332467 },
  { rank: 6, username: 'vinta', stars: 284673 },
  { rank: 7, username: '996icu', stars: 275148 },
  { rank: 8, username: 'trekhleb', stars: 254533 },
  { rank: 9, username: 'trimstray', stars: 249917 },
  { rank: 10, username: 'torvalds', stars: 222278 },
  { rank: 11, username: 'getify', stars: 215974 },
  { rank: 12, username: 'justjavac', stars: 198082 },
  { rank: 13, username: 'ruanyf', stars: 197061 },
  { rank: 14, username: 'jaywcjlove', stars: 195239 },
  { rank: 15, username: 'jackfrued', stars: 193911 },
  { rank: 16, username: 'CyC2018', stars: 190191 },
  { rank: 17, username: '521xueweihan', stars: 187616 },
  { rank: 18, username: 'yangshun', stars: 186251 },
  { rank: 19, username: 'bradtraversy', stars: 181267 },
  { rank: 20, username: 'lucidrains', stars: 179477 },
  { rank: 21, username: 'Chalarangelo', stars: 178518 },
  { rank: 22, username: 'jlevy', stars: 172860 },
  { rank: 23, username: 'AUTOMATIC1111', stars: 166103 },
  { rank: 24, username: 'avelino', stars: 164396 },
  { rank: 25, username: 'lllyasviel', stars: 164011 },
  { rank: 26, username: 'Snailclimb', stars: 163489 },
  { rank: 27, username: 'rasbt', stars: 162563 },
  { rank: 28, username: 'sharkdp', stars: 160873 },
  { rank: 29, username: 'typicode', stars: 158706 },
  { rank: 30, username: 'f', stars: 156992 },
  { rank: 31, username: 'sebastianbergmann', stars: 152737 },
  { rank: 32, username: 'junegunn', stars: 145679 },
  { rank: 33, username: 'tj', stars: 141316 },
  { rank: 34, username: 'kelseyhightower', stars: 141292 },
  { rank: 35, username: 'JakeWharton', stars: 139581 },
  { rank: 36, username: 'Asabeneh', stars: 136651 },
  { rank: 37, username: 'goldbergyoni', stars: 134614 },
  { rank: 38, username: 'labuladong', stars: 132603 },
  { rank: 39, username: 'macrozheng', stars: 131465 },
  { rank: 40, username: 'jesseduffield', stars: 127878 },
  { rank: 41, username: 'mrdoob', stars: 127177 },
  { rank: 42, username: 'adrianhajdin', stars: 122871 },
  { rank: 43, username: 'ripienaar', stars: 119439 },
  { rank: 44, username: 'PanJiaChen', stars: 118867 },
  { rank: 45, username: 'danielmiessler', stars: 116548 },
  { rank: 46, username: 'mouredev', stars: 108191 },
  { rank: 47, username: 'tpope', stars: 107484 },
  { rank: 48, username: 'HKUDS', stars: 105315 },
  { rank: 49, username: 'spf13', stars: 104860 },
  { rank: 50, username: 'louislam', stars: 104012 },
  { rank: 51, username: 'fatedier', stars: 103788 },
  { rank: 52, username: 'BurntSushi', stars: 103686 },
  { rank: 53, username: 'keijiro', stars: 103300 },
  { rank: 54, username: 'wasabeef', stars: 102176 },
  { rank: 55, username: 'tonsky', stars: 100771 },
  { rank: 56, username: 'jamiebuilds', stars: 100443 },
  { rank: 57, username: 'thedaviddias', stars: 100108 },
  { rank: 58, username: 'Anduin2017', stars: 98727 },
  { rank: 59, username: 'nvbn', stars: 98119 },
  { rank: 60, username: 'ryanmcdermott', stars: 98029 },
  { rank: 61, username: 'enaqx', stars: 96670 },
  { rank: 62, username: 'bregman-arie', stars: 96513 },
  { rank: 63, username: 'hakimel', stars: 96459 },
  { rank: 64, username: 'iluwatar', stars: 95861 },
  { rank: 65, username: '3b1b', stars: 95067 },
  { rank: 66, username: 'florinpop17', stars: 94335 },
  { rank: 67, username: 'dylanaraps', stars: 94144 },
  { rank: 68, username: 'Lissy93', stars: 93659 },
  { rank: 69, username: 'FiloSottile', stars: 92841 },
  { rank: 70, username: 'fengdu78', stars: 89277 },
  { rank: 71, username: 'phodal', stars: 88483 },
  { rank: 72, username: 'necolas', stars: 87956 },
  { rank: 73, username: 'bailicangdu', stars: 87050 },
  { rank: 74, username: 'ankane', stars: 84770 },
  { rank: 75, username: 'swisskyrepo', stars: 84312 },
  { rank: 76, username: 'peng-zhihui', stars: 83780 },
  { rank: 77, username: 'easychen', stars: 83256 },
  { rank: 78, username: 'sudheerj', stars: 82639 },
  { rank: 79, username: 'tw93', stars: 82629 },
  { rank: 80, username: 'MunGell', stars: 81974 },
  { rank: 81, username: 'PKUFlyingPig', stars: 81673 },
  { rank: 82, username: 'fighting41love', stars: 81435 },
  { rank: 83, username: 'MisterBooo', stars: 81006 },
  { rank: 84, username: 'jaredpalmer', stars: 80965 },
  { rank: 85, username: 'wesbos', stars: 80801 },
  { rank: 86, username: 'folke', stars: 79809 },
  { rank: 87, username: 'minimaxir', stars: 79654 },
  { rank: 88, username: 'chubin', stars: 79119 },
  { rank: 89, username: 'jashkenas', stars: 78646 },
  { rank: 90, username: 'egoist', stars: 77344 },
  { rank: 91, username: 'ashishps1', stars: 76778 },
  { rank: 92, username: 'XIU2', stars: 76772 },
  { rank: 93, username: 'prakhar1989', stars: 76742 },
  { rank: 94, username: 'developit', stars: 76658 },
  { rank: 95, username: 'DIYgod', stars: 76617 },
  { rank: 96, username: 'hiyouga', stars: 75648 },
  { rank: 97, username: 'sdmg15', stars: 75556 },
  { rank: 98, username: 'youngyangyang04', stars: 75167 },
  { rank: 99, username: 'Developer-Y', stars: 75026 },
  { rank: 100, username: 'abi', stars: 74502 },
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
