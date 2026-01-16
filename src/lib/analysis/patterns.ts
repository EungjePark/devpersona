// Activity Pattern Detection

import type {
  ActivityPattern,
  PatternInfo,
  GitHubCommit,
  Tier,
  StatGrade,
  SignalScores,
} from '../types';
import { TIERS, STAT_GRADES } from '../types';

export const PATTERNS: Record<ActivityPattern, PatternInfo> = {
  night_owl: {
    type: 'night_owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'Codes when the world sleeps',
  },
  weekend_warrior: {
    type: 'weekend_warrior',
    name: 'Weekend Warrior',
    emoji: '⚔️',
    description: '9-5 is for the day job',
  },
  early_bird: {
    type: 'early_bird',
    name: 'Early Bird',
    emoji: '🐦',
    description: 'Commits before coffee kicks in',
  },
  balanced: {
    type: 'balanced',
    name: 'Balanced',
    emoji: '⚖️',
    description: 'Work-life harmony achieved',
  },
};

/**
 * Detect activity pattern from commit timestamps
 */
export function detectActivityPattern(commits: GitHubCommit[]): PatternInfo {
  if (commits.length < 10) {
    return PATTERNS.balanced;
  }

  const hourCounts = new Array(24).fill(0);
  let weekendCount = 0;

  commits.forEach(commit => {
    const date = new Date(commit.commit.author.date);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    hourCounts[hour]++;

    // Weekend: Saturday (6) or Sunday (0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendCount++;
    }
  });

  const total = commits.length;

  // Night owl: 00:00 - 05:00
  const nightCount = hourCounts.slice(0, 6).reduce((a, b) => a + b, 0);
  const nightRatio = nightCount / total;

  // Early bird: 05:00 - 10:00
  const morningCount = hourCounts.slice(5, 11).reduce((a, b) => a + b, 0);
  const morningRatio = morningCount / total;

  // Weekend ratio
  const weekendRatio = weekendCount / total;

  // Determine pattern
  if (nightRatio > 0.35) {
    return PATTERNS.night_owl;
  }

  if (weekendRatio > 0.45) {
    return PATTERNS.weekend_warrior;
  }

  if (morningRatio > 0.4) {
    return PATTERNS.early_bird;
  }

  return PATTERNS.balanced;
}

/**
 * Get peak activity time
 */
export function getPeakActivityTime(commits: GitHubCommit[]): string {
  if (commits.length < 5) return 'Not enough data';

  const hourCounts = new Array(24).fill(0);

  commits.forEach(commit => {
    const hour = new Date(commit.commit.author.date).getHours();
    hourCounts[hour]++;
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Format as time range
  const startHour = peakHour;
  const endHour = (peakHour + 2) % 24;

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}${period}`;
  };

  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

/**
 * Get tier from overall rating
 */
export function getTierFromRating(rating: number): Tier {
  if (rating >= 90) return TIERS.S;
  if (rating >= 75) return TIERS.A;
  if (rating >= 50) return TIERS.B;
  return TIERS.C;
}

/**
 * Get stat grade from score
 */
export function getStatGrade(score: number): { grade: StatGrade; color: string } {
  for (const gradeInfo of STAT_GRADES) {
    if (score >= gradeInfo.threshold) {
      return { grade: gradeInfo.grade, color: gradeInfo.color };
    }
  }

  return { grade: 'F', color: '#ef4444' };
}

/**
 * Get all stat grades for signals
 */
export function getAllStatGrades(signals: SignalScores): Record<keyof SignalScores, { grade: StatGrade; color: string }> {
  return {
    grit: getStatGrade(signals.grit),
    focus: getStatGrade(signals.focus),
    craft: getStatGrade(signals.craft),
    impact: getStatGrade(signals.impact),
    voice: getStatGrade(signals.voice),
    reach: getStatGrade(signals.reach),
  };
}

/**
 * Get language distribution from repos
 */
export function getLanguageDistribution(repos: { language: string | null }[]): { name: string; percentage: number }[] {
  const languageCounts = new Map<string, number>();

  repos.forEach(repo => {
    if (repo.language) {
      languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
    }
  });

  const total = repos.filter(r => r.language).length;

  const distribution = Array.from(languageCounts.entries())
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5); // Top 5 languages

  return distribution;
}
