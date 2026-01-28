// Builder Rank Calculation System
// NASA-themed tier progression based on shipping, community, and trust

import type { BuilderTierLevel, BuilderRank, GitHubRepo, NpmPackage } from '../types';
import { BUILDER_TIERS, SHIPPING_POINTS, KARMA_POINTS } from '../types';

/**
 * Calculate Shipping Points (SP)
 * Based on: project registrations, launch submissions, poten achievements, wins
 */
export function calculateShippingPoints(data: {
  projectsRegistered: number;
  launchesSubmitted: number;
  potenCount: number;
  weeklyFirsts: number;
  monthlyFirsts: number;
}): number {
  const { projectsRegistered, launchesSubmitted, potenCount, weeklyFirsts, monthlyFirsts } = data;

  return (
    projectsRegistered * SHIPPING_POINTS.PROJECT_REGISTER +
    launchesSubmitted * SHIPPING_POINTS.LAUNCH_SUBMIT +
    potenCount * SHIPPING_POINTS.POTEN_ACHIEVED +
    weeklyFirsts * SHIPPING_POINTS.WEEKLY_FIRST +
    monthlyFirsts * SHIPPING_POINTS.MONTHLY_FIRST
  );
}

/**
 * Calculate Community Karma (CK)
 * Based on: reviews written, helpful marks, votes cast, recommended builders achieving poten
 */
export function calculateCommunityKarma(data: {
  reviewsWritten: number;
  helpfulMarks: number;
  votesCast: number;
  recommendedBuilderPotens: number;
}): number {
  const { reviewsWritten, helpfulMarks, votesCast, recommendedBuilderPotens } = data;

  return (
    reviewsWritten * KARMA_POINTS.REVIEW_WRITTEN +
    helpfulMarks * KARMA_POINTS.HELPFUL_MARK +
    votesCast * KARMA_POINTS.VOTE_CAST +
    recommendedBuilderPotens * KARMA_POINTS.RECOMMENDED_BUILDER_POTEN
  );
}

/**
 * Calculate Trust Score (TS) from GitHub data
 * Based on: releases, stars, npm downloads, deployment verification
 */
export function calculateTrustScore(data: {
  repos: GitHubRepo[];
  releaseCount: number;
  npmPackages: NpmPackage[];
  verifiedDeployments: number; // Vercel/Netlify deployments
}): number {
  const { repos, releaseCount, npmPackages, verifiedDeployments } = data;

  let score = 0;

  // Release count bonus (10+ releases = +20)
  if (releaseCount >= 10) score += 20;
  else if (releaseCount >= 5) score += 10;
  else if (releaseCount >= 1) score += 5;

  // Star count bonus
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  if (totalStars >= 1000) score += 30;
  else if (totalStars >= 100) score += 10;
  else if (totalStars >= 10) score += 5;

  // npm downloads bonus
  const totalDownloads = npmPackages.reduce((sum, pkg) => sum + pkg.downloads, 0);
  if (totalDownloads >= 1_000_000) score += 50;
  else if (totalDownloads >= 100_000) score += 40;
  else if (totalDownloads >= 10_000) score += 30;
  else if (totalDownloads >= 1_000) score += 15;
  else if (totalDownloads >= 100) score += 5;

  // Verified deployment bonus
  score += verifiedDeployments * 50;

  return score;
}

/**
 * Calculate Tier Score
 * Formula: (SP × 1.5) + (CK × 1.0) + (TS × 0.5)
 */
export function calculateTierScore(
  shippingPoints: number,
  communityKarma: number,
  trustScore: number
): number {
  return Math.round(shippingPoints * 1.5 + communityKarma * 1.0 + trustScore * 0.5);
}

/**
 * Determine tier level from score
 */
export function getTierFromScore(tierScore: number): BuilderTierLevel {
  // Check tiers from highest to lowest
  const tiers: BuilderTierLevel[] = [7, 6, 5, 4, 3, 2, 1, 0];

  for (const tier of tiers) {
    if (tierScore >= BUILDER_TIERS[tier].minScore) {
      return tier;
    }
  }

  return 0;
}

/**
 * Get tier info for a given tier level
 */
export function getTierInfo(tier: BuilderTierLevel) {
  return BUILDER_TIERS[tier];
}

/**
 * Calculate progress to next tier (0-100%)
 */
export function getTierProgress(tierScore: number): { currentTier: BuilderTierLevel; progress: number; nextTier: BuilderTierLevel | null } {
  const currentTier = getTierFromScore(tierScore);
  const currentTierInfo = BUILDER_TIERS[currentTier];

  if (currentTier === 7) {
    // Max tier
    return { currentTier, progress: 100, nextTier: null };
  }

  const nextTier = (currentTier + 1) as BuilderTierLevel;
  const nextTierInfo = BUILDER_TIERS[nextTier];

  const scoreRange = nextTierInfo.minScore - currentTierInfo.minScore;
  const scoreProgress = tierScore - currentTierInfo.minScore;
  const progress = scoreRange > 0
    ? Math.min(100, Math.round((scoreProgress / scoreRange) * 100))
    : 100;

  return { currentTier, progress, nextTier };
}

/**
 * Get vote weight for a tier
 */
export function getVoteWeight(tier: BuilderTierLevel): number {
  return BUILDER_TIERS[tier].voteWeight;
}

/**
 * Check if user can submit launches (all tiers)
 */
export function canSubmitLaunch(): boolean {
  // All tiers can submit launches
  return true;
}

/**
 * Check if user can vote (T1+)
 */
export function canVote(tier: BuilderTierLevel): boolean {
  return tier >= 1;
}

/**
 * Check if user can access a board
 */
export function canAccessBoard(tier: BuilderTierLevel, boardMinTier: BuilderTierLevel): boolean {
  return tier >= boardMinTier;
}

/**
 * Create initial builder rank for new user
 */
export function createInitialBuilderRank(username: string): Omit<BuilderRank, 'updatedAt'> {
  return {
    username,
    tier: 0,
    shippingPoints: 0,
    communityKarma: 0,
    trustScore: 0,
    tierScore: 0,
    potenCount: 0,
    weeklyWins: 0,
    monthlyWins: 0,
  };
}

/**
 * Recalculate full builder rank
 */
export function recalculateBuilderRank(
  username: string,
  shippingData: Parameters<typeof calculateShippingPoints>[0],
  karmaData: Parameters<typeof calculateCommunityKarma>[0],
  trustData: Parameters<typeof calculateTrustScore>[0],
  existingStats: { potenCount: number; weeklyWins: number; monthlyWins: number }
): BuilderRank {
  const shippingPoints = calculateShippingPoints(shippingData);
  const communityKarma = calculateCommunityKarma(karmaData);
  const trustScore = calculateTrustScore(trustData);
  const tierScore = calculateTierScore(shippingPoints, communityKarma, trustScore);
  const tier = getTierFromScore(tierScore);

  return {
    username,
    tier,
    shippingPoints,
    communityKarma,
    trustScore,
    tierScore,
    ...existingStats,
    updatedAt: Date.now(),
  };
}

/**
 * Get ISO 8601 week number string (e.g., "2026-W04")
 * Uses Monday-start weeks and correct week-year calculation
 */
export function getCurrentWeekNumber(): string {
  const now = new Date();

  // Get Thursday of current week (ISO weeks are defined by their Thursday)
  const thursday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = thursday.getUTCDay();
  // Adjust to Thursday: Sunday=0 -> +4, Monday=1 -> +3, ..., Thursday=4 -> 0
  thursday.setUTCDate(thursday.getUTCDate() - ((dayOfWeek + 6) % 7) + 3);

  // ISO week-year is the year of this Thursday
  const weekYear = thursday.getUTCFullYear();

  // Find first Thursday of the week-year (Jan 4 is always in week 1)
  const jan4 = new Date(Date.UTC(weekYear, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay();
  const firstThursday = new Date(jan4);
  firstThursday.setUTCDate(jan4.getUTCDate() - ((jan4DayOfWeek + 6) % 7) + 3);

  // Calculate week number
  const weekNumber = 1 + Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Check if launch week is currently accepting submissions (Mon 00:00 - Fri 23:59)
 */
export function isLaunchWeekOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
  return day >= 1 && day <= 5;
}

/**
 * Get time until voting closes (Friday 23:59)
 */
export function getTimeUntilVotingCloses(): { hours: number; minutes: number } | null {
  const now = new Date();
  const day = now.getDay();

  if (day === 0 || day === 6) {
    // Weekend - voting closed
    return null;
  }

  // Calculate time to Friday 23:59
  const daysUntilFriday = 5 - day;
  const friday = new Date(now);
  friday.setDate(friday.getDate() + daysUntilFriday);
  friday.setHours(23, 59, 59, 999);

  const diff = friday.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
