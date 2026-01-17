/**
 * Achievement System - FIFA-style badges and awards
 * Inspired by GitHub Achievements, Steam, and sports games
 */

import type { ContributionStats, SignalScores } from './types';

export type AchievementCategory =
  | 'streak'
  | 'volume'
  | 'consistency'
  | 'special'
  | 'language'
  | 'social'
  | 'opensource'
  | 'npm'
  | 'community'
  | 'milestone'
  | 'secret';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: AchievementCategory;
  unlocked: boolean;
  progress?: number; // 0-100
  maxValue?: number;
  currentValue?: number;
}

export interface PotentialRating {
  current: number;
  potential: number;
  trend: 'rising' | 'stable' | 'declining';
  peakMonth?: string;
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = {
  // Streak Achievements
  streak7: {
    id: 'streak7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day contribution streak',
    icon: '🔥',
    tier: 'bronze' as const,
    category: 'streak' as const,
    threshold: 7,
  },
  streak30: {
    id: 'streak30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day contribution streak',
    icon: '💪',
    tier: 'silver' as const,
    category: 'streak' as const,
    threshold: 30,
  },
  streak100: {
    id: 'streak100',
    name: 'Century Club',
    description: 'Maintain a 100-day contribution streak',
    icon: '⚡',
    tier: 'gold' as const,
    category: 'streak' as const,
    threshold: 100,
  },
  streak365: {
    id: 'streak365',
    name: 'Year of Code',
    description: 'Maintain a 365-day contribution streak',
    icon: '👑',
    tier: 'platinum' as const,
    category: 'streak' as const,
    threshold: 365,
  },
  streak1000: {
    id: 'streak1000',
    name: 'Legendary Coder',
    description: 'Maintain a 1000-day contribution streak',
    icon: '💎',
    tier: 'diamond' as const,
    category: 'streak' as const,
    threshold: 1000,
  },

  // Volume Achievements
  commits100: {
    id: 'commits100',
    name: 'Getting Started',
    description: 'Make 100 contributions',
    icon: '🌱',
    tier: 'bronze' as const,
    category: 'volume' as const,
    threshold: 100,
  },
  commits500: {
    id: 'commits500',
    name: 'Contributor',
    description: 'Make 500 contributions',
    icon: '🌿',
    tier: 'silver' as const,
    category: 'volume' as const,
    threshold: 500,
  },
  commits1000: {
    id: 'commits1000',
    name: 'Code Machine',
    description: 'Make 1,000 contributions',
    icon: '🌳',
    tier: 'gold' as const,
    category: 'volume' as const,
    threshold: 1000,
  },
  commits5000: {
    id: 'commits5000',
    name: 'Open Source Hero',
    description: 'Make 5,000 contributions',
    icon: '🏔️',
    tier: 'platinum' as const,
    category: 'volume' as const,
    threshold: 5000,
  },
  commits10000: {
    id: 'commits10000',
    name: 'Code Legend',
    description: 'Make 10,000 contributions',
    icon: '🌟',
    tier: 'diamond' as const,
    category: 'volume' as const,
    threshold: 10000,
  },

  // Consistency Achievements
  perfectWeek: {
    id: 'perfectWeek',
    name: 'Perfect Week',
    description: 'Contribute every day for a full week',
    icon: '✨',
    tier: 'bronze' as const,
    category: 'consistency' as const,
    threshold: 7,
  },
  perfectMonth: {
    id: 'perfectMonth',
    name: 'Perfect Month',
    description: 'Contribute every day for a full month',
    icon: '🎯',
    tier: 'gold' as const,
    category: 'consistency' as const,
    threshold: 30,
  },
  earlyBird: {
    id: 'earlyBird',
    name: 'Early Bird',
    description: 'Average 5+ contributions per day',
    icon: '🐦',
    tier: 'silver' as const,
    category: 'consistency' as const,
    threshold: 5,
  },
  nightOwl: {
    id: 'nightOwl',
    name: 'Night Owl',
    description: 'Average 10+ contributions per day',
    icon: '🦉',
    tier: 'platinum' as const,
    category: 'consistency' as const,
    threshold: 10,
  },

  // Special Achievements
  firstCommit: {
    id: 'firstCommit',
    name: 'Hello World',
    description: 'Make your first contribution',
    icon: '👋',
    tier: 'bronze' as const,
    category: 'special' as const,
    threshold: 1,
  },
  comeback: {
    id: 'comeback',
    name: 'The Comeback',
    description: 'Return after 30+ days of inactivity',
    icon: '🔄',
    tier: 'silver' as const,
    category: 'special' as const,
    threshold: 1,
  },

  // Language Mastery
  bilingual: {
    id: 'bilingual',
    name: 'Bilingual',
    description: 'Use 2+ languages in your projects',
    icon: '🌐',
    tier: 'bronze' as const,
    category: 'language' as const,
    threshold: 2,
  },
  polyglot: {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Use 5+ languages in your projects',
    icon: '🗣️',
    tier: 'silver' as const,
    category: 'language' as const,
    threshold: 5,
  },
  linguist: {
    id: 'linguist',
    name: 'Master Linguist',
    description: 'Use 10+ languages in your projects',
    icon: '📚',
    tier: 'gold' as const,
    category: 'language' as const,
    threshold: 10,
  },
  fullStack: {
    id: 'fullStack',
    name: 'Full Stack Dev',
    description: 'Use both frontend and backend languages',
    icon: '🥞',
    tier: 'silver' as const,
    category: 'language' as const,
    threshold: 1,
  },
  typeScriptMaster: {
    id: 'typeScriptMaster',
    name: 'TypeScript Master',
    description: 'TypeScript as your primary language (>50%)',
    icon: '💙',
    tier: 'gold' as const,
    category: 'language' as const,
    threshold: 50,
  },
  rustacean: {
    id: 'rustacean',
    name: 'Rustacean',
    description: 'Rust in your top 3 languages',
    icon: '🦀',
    tier: 'platinum' as const,
    category: 'language' as const,
    threshold: 1,
  },

  // Social Impact
  starCollector: {
    id: 'starCollector',
    name: 'Star Collector',
    description: 'Earn 100+ stars across all repos',
    icon: '⭐',
    tier: 'bronze' as const,
    category: 'social' as const,
    threshold: 100,
  },
  risingTalent: {
    id: 'risingTalent',
    name: 'Rising Talent',
    description: 'Earn 500+ stars across all repos',
    icon: '🌟',
    tier: 'silver' as const,
    category: 'social' as const,
    threshold: 500,
  },
  viralRepo: {
    id: 'viralRepo',
    name: 'Viral Repo',
    description: 'Have a repo with 1,000+ stars',
    icon: '🔥',
    tier: 'gold' as const,
    category: 'social' as const,
    threshold: 1000,
  },
  influencer: {
    id: 'influencer',
    name: 'Tech Influencer',
    description: 'Have 1,000+ followers',
    icon: '👥',
    tier: 'platinum' as const,
    category: 'social' as const,
    threshold: 1000,
  },
  celebrity: {
    id: 'celebrity',
    name: 'GitHub Celebrity',
    description: 'Have 10,000+ followers',
    icon: '🎬',
    tier: 'diamond' as const,
    category: 'social' as const,
    threshold: 10000,
  },

  // Open Source
  firstPR: {
    id: 'firstPR',
    name: 'First PR',
    description: 'Open your first pull request',
    icon: '🎫',
    tier: 'bronze' as const,
    category: 'opensource' as const,
    threshold: 1,
  },
  prMachine: {
    id: 'prMachine',
    name: 'PR Machine',
    description: 'Open 50+ pull requests',
    icon: '🏭',
    tier: 'silver' as const,
    category: 'opensource' as const,
    threshold: 50,
  },
  maintainer: {
    id: 'maintainer',
    name: 'Maintainer',
    description: 'Have 10+ repos with recent activity',
    icon: '🔧',
    tier: 'gold' as const,
    category: 'opensource' as const,
    threshold: 10,
  },
  ecosystem: {
    id: 'ecosystem',
    name: 'Ecosystem Builder',
    description: 'Have repos that are dependencies of other projects',
    icon: '🌍',
    tier: 'platinum' as const,
    category: 'opensource' as const,
    threshold: 1,
  },
  ossLegend: {
    id: 'ossLegend',
    name: 'OSS Legend',
    description: 'Total of 5,000+ stars across all repos',
    icon: '🏛️',
    tier: 'diamond' as const,
    category: 'opensource' as const,
    threshold: 5000,
  },

  // npm Presence
  firstPackage: {
    id: 'firstPackage',
    name: 'Package Author',
    description: 'Publish your first npm package',
    icon: '📦',
    tier: 'bronze' as const,
    category: 'npm' as const,
    threshold: 1,
  },
  npmPopular: {
    id: 'npmPopular',
    name: 'Popular Package',
    description: 'Have a package with 1,000+ weekly downloads',
    icon: '📈',
    tier: 'silver' as const,
    category: 'npm' as const,
    threshold: 1000,
  },
  npmViral: {
    id: 'npmViral',
    name: 'npm Viral',
    description: 'Have a package with 100,000+ weekly downloads',
    icon: '🚀',
    tier: 'gold' as const,
    category: 'npm' as const,
    threshold: 100000,
  },
  npmLegend: {
    id: 'npmLegend',
    name: 'npm Legend',
    description: 'Have a package with 1M+ weekly downloads',
    icon: '💎',
    tier: 'diamond' as const,
    category: 'npm' as const,
    threshold: 1000000,
  },

  // Community / Open Source Collaboration
  communityContributor: {
    id: 'communityContributor',
    name: 'Contributor',
    description: 'Made at least 1 PR to another project',
    icon: '🤝',
    tier: 'bronze' as const,
    category: 'community' as const,
    threshold: 1,
  },
  communityActive: {
    id: 'communityActive',
    name: 'Active Contributor',
    description: 'Made 10+ PRs to other projects',
    icon: '🔄',
    tier: 'silver' as const,
    category: 'community' as const,
    threshold: 10,
  },
  openSourceHero: {
    id: 'openSourceHero',
    name: 'Open Source Hero',
    description: 'Made 100+ PRs to other projects',
    icon: '🦸',
    tier: 'platinum' as const,
    category: 'community' as const,
    threshold: 100,
  },

  // Signal-based achievements
  balancedDeveloper: {
    id: 'balancedDeveloper',
    name: 'Balanced Dev',
    description: 'All signal scores above 70',
    icon: '⚖️',
    tier: 'gold' as const,
    category: 'milestone' as const,
    threshold: 70,
  },
  consistencyKing: {
    id: 'consistencyKing',
    name: 'Consistency King',
    description: 'GRIND score above 90',
    icon: '👑',
    tier: 'platinum' as const,
    category: 'milestone' as const,
    threshold: 90,
  },

  // Secret/Easter Egg
  fridayCoder: {
    id: 'fridayCoder',
    name: 'Friday Deployer',
    description: 'Most commits on Fridays (brave soul)',
    icon: '🎉',
    tier: 'silver' as const,
    category: 'secret' as const,
    threshold: 1,
  },
  graveyardShift: {
    id: 'graveyardShift',
    name: 'Graveyard Shift',
    description: 'Commit activity peaks between midnight and 5am',
    icon: '🌙',
    tier: 'silver' as const,
    category: 'secret' as const,
    threshold: 1,
  },
  weekendHacker: {
    id: 'weekendHacker',
    name: 'Weekend Hacker',
    description: 'More commits on weekends than weekdays',
    icon: '🎮',
    tier: 'silver' as const,
    category: 'secret' as const,
    threshold: 1,
  },
  zenCoder: {
    id: 'zenCoder',
    name: 'Zen Coder',
    description: 'Maintain perfect consistency (low variance)',
    icon: '🧘',
    tier: 'gold' as const,
    category: 'secret' as const,
    threshold: 1,
  },

  // Global Ranking (gitstar-ranking.com)
  globalTop50: {
    id: 'globalTop50',
    name: 'Top 50% Global',
    description: 'Ranked in top 50% of all GitHub developers',
    icon: '🌍',
    tier: 'bronze' as const,
    category: 'social' as const,
    threshold: 500, // 500+ total stars
  },
  globalTop25: {
    id: 'globalTop25',
    name: 'Rising Star',
    description: 'Ranked in top 25% of all GitHub developers',
    icon: '🌟',
    tier: 'silver' as const,
    category: 'social' as const,
    threshold: 2500,
  },
  globalTop10: {
    id: 'globalTop10',
    name: 'Top 10%',
    description: 'Ranked in top 10% of all GitHub developers',
    icon: '🔝',
    tier: 'gold' as const,
    category: 'social' as const,
    threshold: 10000,
  },
  globalTop5: {
    id: 'globalTop5',
    name: 'Elite Developer',
    description: 'Ranked in top 5% of all GitHub developers',
    icon: '💫',
    tier: 'platinum' as const,
    category: 'social' as const,
    threshold: 25000,
  },
  globalTop1: {
    id: 'globalTop1',
    name: 'GitHub Legend',
    description: 'Ranked in top 1% of all GitHub developers',
    icon: '👑',
    tier: 'diamond' as const,
    category: 'social' as const,
    threshold: 100000,
  },

  // Awesome List Potential
  awesomeContributor: {
    id: 'awesomeContributor',
    name: 'Awesome Contributor',
    description: 'Created repos worthy of awesome lists',
    icon: '📚',
    tier: 'silver' as const,
    category: 'opensource' as const,
    threshold: 1, // Has at least 1 repo matching awesome categories
  },
  awesomeCreator: {
    id: 'awesomeCreator',
    name: 'Awesome Creator',
    description: 'Multiple repos matching awesome list criteria',
    icon: '✨',
    tier: 'gold' as const,
    category: 'opensource' as const,
    threshold: 3, // 3+ repos matching awesome categories
  },
};

// Tier colors for styling
export const TIER_COLORS = {
  bronze: { bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-500', glow: 'shadow-amber-500/20' },
  silver: { bg: 'bg-slate-400/20', border: 'border-slate-400', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
  gold: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
  platinum: { bg: 'bg-cyan-400/20', border: 'border-cyan-400', text: 'text-cyan-300', glow: 'shadow-cyan-400/30' },
  diamond: { bg: 'bg-purple-400/20', border: 'border-purple-400', text: 'text-purple-300', glow: 'shadow-purple-400/40' },
};

// Extended stats for calculating all achievements
export interface ExtendedStats {
  contributions: ContributionStats;
  languages?: Array<{ name: string; percentage: number }>;
  totalStars?: number;
  maxRepoStars?: number;
  followers?: number;
  prCount?: number;
  activeRepos?: number;
  totalRepos?: number;
  npmPackages?: number;
  awesomeCategoryCount?: number; // Number of categories matching awesome lists
  npmWeeklyDownloads?: number;
  externalPRs?: number; // PRs to other people's repos (community engagement)
  hasDependents?: boolean;
  signals?: SignalScores; // Signal scores for milestone achievements
}

/**
 * Calculate achievements from contribution stats and extended data
 */
export function calculateAchievements(
  contributions: ContributionStats,
  extended?: Omit<ExtendedStats, 'contributions'>
): Achievement[] {
  const { currentStreak, longestStreak, totalContributions, averagePerDay, calendar } = contributions;
  const achievements: Achievement[] = [];

  // Streak achievements - use longest streak
  const bestStreak = Math.max(currentStreak, longestStreak);

  Object.values(ACHIEVEMENT_DEFINITIONS)
    .filter(def => def.category === 'streak')
    .forEach(def => {
      const unlocked = bestStreak >= def.threshold;
      achievements.push({
        ...def,
        unlocked,
        currentValue: bestStreak,
        maxValue: def.threshold,
        progress: Math.min(100, (bestStreak / def.threshold) * 100),
      });
    });

  // Volume achievements
  Object.values(ACHIEVEMENT_DEFINITIONS)
    .filter(def => def.category === 'volume')
    .forEach(def => {
      const unlocked = totalContributions >= def.threshold;
      achievements.push({
        ...def,
        unlocked,
        currentValue: totalContributions,
        maxValue: def.threshold,
        progress: Math.min(100, (totalContributions / def.threshold) * 100),
      });
    });

  // Consistency achievements
  const perfectWeekDef = ACHIEVEMENT_DEFINITIONS.perfectWeek;
  const perfectMonthDef = ACHIEVEMENT_DEFINITIONS.perfectMonth;
  const earlyBirdDef = ACHIEVEMENT_DEFINITIONS.earlyBird;
  const nightOwlDef = ACHIEVEMENT_DEFINITIONS.nightOwl;

  achievements.push({
    ...perfectWeekDef,
    unlocked: currentStreak >= 7 || longestStreak >= 7,
    currentValue: Math.max(currentStreak, longestStreak),
    maxValue: 7,
    progress: Math.min(100, (Math.max(currentStreak, longestStreak) / 7) * 100),
  });

  achievements.push({
    ...perfectMonthDef,
    unlocked: currentStreak >= 30 || longestStreak >= 30,
    currentValue: Math.max(currentStreak, longestStreak),
    maxValue: 30,
    progress: Math.min(100, (Math.max(currentStreak, longestStreak) / 30) * 100),
  });

  achievements.push({
    ...earlyBirdDef,
    unlocked: averagePerDay >= 5,
    currentValue: Math.round(averagePerDay * 10) / 10,
    maxValue: 5,
    progress: Math.min(100, (averagePerDay / 5) * 100),
  });

  achievements.push({
    ...nightOwlDef,
    unlocked: averagePerDay >= 10,
    currentValue: Math.round(averagePerDay * 10) / 10,
    maxValue: 10,
    progress: Math.min(100, (averagePerDay / 10) * 100),
  });

  // Special achievements
  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.firstCommit,
    unlocked: totalContributions >= 1,
    progress: totalContributions >= 1 ? 100 : 0,
  });

  // Check for comeback (gap > 30 days followed by activity)
  let hasComeback = false;
  const weeks = calendar.weeks;
  let gapCount = 0;
  let hadGap = false;

  for (const week of weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount === 0) {
        gapCount++;
      } else {
        if (gapCount >= 30) hadGap = true;
        if (hadGap && day.contributionCount > 0) hasComeback = true;
        gapCount = 0;
      }
    }
  }

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.comeback,
    unlocked: hasComeback,
    progress: hasComeback ? 100 : 0,
  });

  // ===== NEW CATEGORY ACHIEVEMENTS =====

  // Language Mastery
  const languageCount = extended?.languages?.length ?? 0;
  const topLanguage = extended?.languages?.[0];
  const topLanguages = extended?.languages?.slice(0, 3).map(l => l.name.toLowerCase()) ?? [];

  // Frontend/Backend detection for fullStack
  const frontendLangs = ['javascript', 'typescript', 'html', 'css', 'vue', 'react', 'svelte'];
  const backendLangs = ['python', 'java', 'go', 'rust', 'ruby', 'php', 'c#', 'kotlin', 'scala'];
  const hasFrontend = topLanguages.some(l => frontendLangs.includes(l));
  const hasBackend = topLanguages.some(l => backendLangs.includes(l));

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.bilingual,
    unlocked: languageCount >= 2,
    currentValue: languageCount,
    maxValue: 2,
    progress: Math.min(100, (languageCount / 2) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.polyglot,
    unlocked: languageCount >= 5,
    currentValue: languageCount,
    maxValue: 5,
    progress: Math.min(100, (languageCount / 5) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.linguist,
    unlocked: languageCount >= 10,
    currentValue: languageCount,
    maxValue: 10,
    progress: Math.min(100, (languageCount / 10) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.fullStack,
    unlocked: hasFrontend && hasBackend,
    progress: hasFrontend && hasBackend ? 100 : hasFrontend || hasBackend ? 50 : 0,
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.typeScriptMaster,
    unlocked: topLanguage?.name.toLowerCase() === 'typescript' && topLanguage.percentage >= 50,
    currentValue: topLanguage?.name.toLowerCase() === 'typescript' ? Math.round(topLanguage.percentage) : 0,
    maxValue: 50,
    progress: topLanguage?.name.toLowerCase() === 'typescript' ? Math.min(100, (topLanguage.percentage / 50) * 100) : 0,
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.rustacean,
    unlocked: topLanguages.includes('rust'),
    progress: topLanguages.includes('rust') ? 100 : 0,
  });

  // Social Impact
  const totalStars = extended?.totalStars ?? 0;
  const maxRepoStars = extended?.maxRepoStars ?? 0;
  const followers = extended?.followers ?? 0;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.starCollector,
    unlocked: totalStars >= 100,
    currentValue: totalStars,
    maxValue: 100,
    progress: Math.min(100, (totalStars / 100) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.risingTalent,
    unlocked: totalStars >= 500,
    currentValue: totalStars,
    maxValue: 500,
    progress: Math.min(100, (totalStars / 500) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.viralRepo,
    unlocked: maxRepoStars >= 1000,
    currentValue: maxRepoStars,
    maxValue: 1000,
    progress: Math.min(100, (maxRepoStars / 1000) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.influencer,
    unlocked: followers >= 1000,
    currentValue: followers,
    maxValue: 1000,
    progress: Math.min(100, (followers / 1000) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.celebrity,
    unlocked: followers >= 10000,
    currentValue: followers,
    maxValue: 10000,
    progress: Math.min(100, (followers / 10000) * 100),
  });

  // Open Source
  const prCount = extended?.prCount ?? 0;
  const activeRepos = extended?.activeRepos ?? 0;
  const hasDependents = extended?.hasDependents ?? false;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.firstPR,
    unlocked: prCount >= 1,
    currentValue: prCount,
    maxValue: 1,
    progress: prCount >= 1 ? 100 : 0,
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.prMachine,
    unlocked: prCount >= 50,
    currentValue: prCount,
    maxValue: 50,
    progress: Math.min(100, (prCount / 50) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.maintainer,
    unlocked: activeRepos >= 10,
    currentValue: activeRepos,
    maxValue: 10,
    progress: Math.min(100, (activeRepos / 10) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.ecosystem,
    unlocked: hasDependents,
    progress: hasDependents ? 100 : 0,
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.ossLegend,
    unlocked: totalStars >= 5000,
    currentValue: totalStars,
    maxValue: 5000,
    progress: Math.min(100, (totalStars / 5000) * 100),
  });

  // npm Presence
  const npmPackages = extended?.npmPackages ?? 0;
  const npmWeeklyDownloads = extended?.npmWeeklyDownloads ?? 0;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.firstPackage,
    unlocked: npmPackages >= 1,
    currentValue: npmPackages,
    maxValue: 1,
    progress: npmPackages >= 1 ? 100 : 0,
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.npmPopular,
    unlocked: npmWeeklyDownloads >= 1000,
    currentValue: npmWeeklyDownloads,
    maxValue: 1000,
    progress: Math.min(100, (npmWeeklyDownloads / 1000) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.npmViral,
    unlocked: npmWeeklyDownloads >= 100000,
    currentValue: npmWeeklyDownloads,
    maxValue: 100000,
    progress: Math.min(100, (npmWeeklyDownloads / 100000) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.npmLegend,
    unlocked: npmWeeklyDownloads >= 1000000,
    currentValue: npmWeeklyDownloads,
    maxValue: 1000000,
    progress: Math.min(100, (npmWeeklyDownloads / 1000000) * 100),
  });

  // Community / Open Source Collaboration
  const externalPRs = extended?.externalPRs ?? 0;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.communityContributor,
    unlocked: externalPRs >= 1,
    currentValue: externalPRs,
    maxValue: 1,
    progress: externalPRs >= 1 ? 100 : 0,
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.communityActive,
    unlocked: externalPRs >= 10,
    currentValue: externalPRs,
    maxValue: 10,
    progress: Math.min(100, (externalPRs / 10) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.openSourceHero,
    unlocked: externalPRs >= 100,
    currentValue: externalPRs,
    maxValue: 100,
    progress: Math.min(100, (externalPRs / 100) * 100),
  });

  // Secret/Easter Egg (based on contribution patterns)
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  // hourCounts reserved for future time-of-day achievement patterns
  let weekdayTotal = 0;
  let weekendTotal = 0;

  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      dayOfWeekCounts[dayOfWeek] += day.contributionCount;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendTotal += day.contributionCount;
      } else {
        weekdayTotal += day.contributionCount;
      }
    }
  }

  // Friday is index 5
  const fridayCount = dayOfWeekCounts[5];
  const maxDayCount = Math.max(...dayOfWeekCounts);
  const isFridayMax = fridayCount === maxDayCount && fridayCount > 0;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.fridayCoder,
    unlocked: isFridayMax,
    progress: isFridayMax ? 100 : 0,
  });

  // Graveyard shift - we can't get hourly data from GitHub calendar, so use a heuristic
  // Mark as unlocked if average per day is high (suggesting late night work)
  const isGraveyardShift = averagePerDay >= 8;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.graveyardShift,
    unlocked: isGraveyardShift,
    progress: isGraveyardShift ? 100 : Math.min(100, (averagePerDay / 8) * 100),
  });

  // Weekend hacker
  const isWeekendHacker = weekendTotal > weekdayTotal && weekendTotal > 0;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.weekendHacker,
    unlocked: isWeekendHacker,
    progress: isWeekendHacker ? 100 : weekdayTotal > 0 ? Math.min(100, (weekendTotal / weekdayTotal) * 100) : 0,
  });

  // Zen Coder - low variance in daily contributions
  const dailyCounts: number[] = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > 0) {
        dailyCounts.push(day.contributionCount);
      }
    }
  }

  let variance = 0;
  if (dailyCounts.length > 1) {
    const mean = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
    variance = dailyCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyCounts.length;
  }
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = averagePerDay > 0 ? stdDev / averagePerDay : 1;
  const isZenCoder = coefficientOfVariation < 0.5 && dailyCounts.length >= 30;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.zenCoder,
    unlocked: isZenCoder,
    progress: isZenCoder ? 100 : dailyCounts.length >= 30 ? Math.min(100, ((1 - coefficientOfVariation) / 0.5) * 100) : 0,
  });

  // Global Ranking Achievements (based on total stars)
  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.globalTop50,
    unlocked: totalStars >= 500,
    currentValue: totalStars,
    maxValue: 500,
    progress: Math.min(100, (totalStars / 500) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.globalTop25,
    unlocked: totalStars >= 2500,
    currentValue: totalStars,
    maxValue: 2500,
    progress: Math.min(100, (totalStars / 2500) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.globalTop10,
    unlocked: totalStars >= 10000,
    currentValue: totalStars,
    maxValue: 10000,
    progress: Math.min(100, (totalStars / 10000) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.globalTop5,
    unlocked: totalStars >= 25000,
    currentValue: totalStars,
    maxValue: 25000,
    progress: Math.min(100, (totalStars / 25000) * 100),
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.globalTop1,
    unlocked: totalStars >= 100000,
    currentValue: totalStars,
    maxValue: 100000,
    progress: Math.min(100, (totalStars / 100000) * 100),
  });

  // Awesome List Achievements
  const awesomeCategoryCount = extended?.awesomeCategoryCount ?? 0;

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.awesomeContributor,
    unlocked: awesomeCategoryCount >= 1,
    currentValue: awesomeCategoryCount,
    maxValue: 1,
    progress: awesomeCategoryCount >= 1 ? 100 : 0,
  });

  achievements.push({
    ...ACHIEVEMENT_DEFINITIONS.awesomeCreator,
    unlocked: awesomeCategoryCount >= 3,
    currentValue: awesomeCategoryCount,
    maxValue: 3,
    progress: Math.min(100, (awesomeCategoryCount / 3) * 100),
  });

  // Milestone achievements (signal-based)
  const signals = extended?.signals;
  if (signals) {
    // Balanced Developer - all signals above 70
    const allSignals = [signals.grit, signals.focus, signals.craft, signals.impact, signals.voice, signals.reach];
    const minSignal = Math.min(...allSignals);
    const balancedThreshold = ACHIEVEMENT_DEFINITIONS.balancedDeveloper.threshold;
    const isBalanced = allSignals.every(s => s >= balancedThreshold);

    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.balancedDeveloper,
      unlocked: isBalanced,
      currentValue: minSignal,
      maxValue: balancedThreshold,
      progress: isBalanced ? 100 : Math.min(100, (minSignal / balancedThreshold) * 100),
    });

    // Consistency King - GRIND score above 90
    const consistencyThreshold = ACHIEVEMENT_DEFINITIONS.consistencyKing.threshold;
    const isConsistencyKing = signals.grit >= consistencyThreshold;

    achievements.push({
      ...ACHIEVEMENT_DEFINITIONS.consistencyKing,
      unlocked: isConsistencyKing,
      currentValue: signals.grit,
      maxValue: consistencyThreshold,
      progress: Math.min(100, (signals.grit / consistencyThreshold) * 100),
    });
  }

  return achievements;
}

/**
 * Calculate FIFA-style potential rating
 * Current vs Potential (like young players in FIFA)
 */
export function calculatePotential(
  contributions: ContributionStats,
  overallRating: number
): PotentialRating {
  const { averagePerDay, currentStreak, longestStreak, totalContributions: _totalContributions, calendar } = contributions;
  void _totalContributions; // Reserved for contribution-based potential adjustment

  // Calculate monthly contribution trend
  const weeks = calendar.weeks;
  const monthlyTotals: number[] = [];
  let currentMonth = -1;
  let monthTotal = 0;

  for (const week of weeks) {
    for (const day of week.contributionDays) {
      const month = new Date(day.date).getMonth();
      if (currentMonth === -1) currentMonth = month;

      if (month !== currentMonth) {
        monthlyTotals.push(monthTotal);
        monthTotal = day.contributionCount;
        currentMonth = month;
      } else {
        monthTotal += day.contributionCount;
      }
    }
  }
  if (monthTotal > 0) monthlyTotals.push(monthTotal);

  // Determine trend based on recent months
  const recentMonths = monthlyTotals.slice(-3);
  let trend: 'rising' | 'stable' | 'declining' = 'stable';

  if (recentMonths.length >= 2) {
    const avg1 = recentMonths.slice(0, Math.floor(recentMonths.length / 2)).reduce((a, b) => a + b, 0);
    const avg2 = recentMonths.slice(Math.floor(recentMonths.length / 2)).reduce((a, b) => a + b, 0);

    if (avg2 > avg1 * 1.2) trend = 'rising';
    else if (avg2 < avg1 * 0.8) trend = 'declining';
  }

  // Calculate potential
  // Factors: consistency, streak ratio, average activity, trend
  const consistencyBonus = Math.min(10, (currentStreak / longestStreak) * 10 || 0);
  const activityBonus = Math.min(5, averagePerDay);
  const trendBonus = trend === 'rising' ? 5 : trend === 'declining' ? -3 : 0;

  let potential = overallRating + consistencyBonus + activityBonus + trendBonus;
  potential = Math.min(99, Math.max(overallRating, Math.round(potential)));

  // Find peak month
  const peakMonthIndex = monthlyTotals.indexOf(Math.max(...monthlyTotals));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = new Date(weeks[0]?.contributionDays[0]?.date || new Date()).getMonth();
  const peakMonth = monthNames[(startMonth + peakMonthIndex) % 12];

  return {
    current: overallRating,
    potential,
    trend,
    peakMonth,
  };
}

/**
 * Get top unlocked achievements (for display)
 */
export function getTopAchievements(achievements: Achievement[], limit = 3): Achievement[] {
  const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];

  return achievements
    .filter(a => a.unlocked)
    .sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier))
    .slice(0, limit);
}

/**
 * Get next achievable achievement (closest to unlock)
 */
export function getNextAchievement(achievements: Achievement[]): Achievement | null {
  return achievements
    .filter(a => !a.unlocked && a.progress !== undefined)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))[0] || null;
}

/**
 * Calculate achievement score (for leaderboard ranking)
 */
export function calculateAchievementScore(achievements: Achievement[]): number {
  const tierPoints = {
    bronze: 10,
    silver: 25,
    gold: 50,
    platinum: 100,
    diamond: 200,
  };

  return achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + tierPoints[a.tier], 0);
}
