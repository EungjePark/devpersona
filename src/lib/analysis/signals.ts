// Signal calculation algorithms (No AI, pure heuristics)

import type { SignalScores, GitHubRepo, GitHubCommit, NpmPackage, CommunityMetrics } from '../types';

/**
 * Calculate GRIT score (0-100)
 * Measures commit consistency using Coefficient of Variation
 * Lower CV = more consistent = higher GRIT
 */
export function calculateGrit(commits: GitHubCommit[]): number {
  if (commits.length < 10) return 30; // Not enough data

  // Group commits by week
  const weeklyCommits = new Map<string, number>();

  commits.forEach(commit => {
    const date = new Date(commit.commit.author.date);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    weeklyCommits.set(weekKey, (weeklyCommits.get(weekKey) || 0) + 1);
  });

  const counts = Array.from(weeklyCommits.values());
  if (counts.length < 4) return 40;

  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 1;

  // CV of 0 = perfect consistency = 100
  // CV of 2+ = very inconsistent = 20
  const score = Math.max(20, Math.min(100, 100 - (cv * 40)));

  return Math.round(score);
}

/**
 * Calculate FOCUS score (0-100)
 * Ratio of active repos (pushed in last 6 months) to total repos
 */
export function calculateFocus(repos: GitHubRepo[]): number {
  if (repos.length === 0) return 50;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const activeRepos = repos.filter(repo => {
    const pushedAt = new Date(repo.pushed_at);
    return pushedAt > sixMonthsAgo && !repo.archived;
  });

  const ratio = activeRepos.length / repos.length;

  // 100% active = 100, 0% active = 20
  const score = 20 + (ratio * 80);

  return Math.round(score);
}

/**
 * Calculate CRAFT score (0-100)
 * Measures repo quality: README, License, Description presence
 */
export function calculateCraft(repos: GitHubRepo[]): number {
  if (repos.length === 0) return 50;

  let totalScore = 0;

  repos.forEach(repo => {
    let repoScore = 0;
    if (repo.description && repo.description.length > 10) repoScore += 33;
    if (repo.license) repoScore += 33;
    // README presence is inferred from has_readme or non-empty description
    if (repo.has_readme || (repo.description && repo.description.length > 50)) repoScore += 34;
    totalScore += repoScore;
  });

  const avgScore = totalScore / repos.length;
  const score = Math.max(20, Math.min(100, avgScore));

  return Math.round(score);
}

/**
 * Calculate IMPACT score (0-100)
 * Based on npm package downloads (log scale)
 */
export function calculateImpact(packages: NpmPackage[]): number {
  if (packages.length === 0) return 20; // No npm presence

  const totalDownloads = packages.reduce((sum, pkg) => sum + pkg.downloads, 0);

  if (totalDownloads === 0) return 25;

  // Log scale: 1 download = 25, 1K = 50, 1M = 75, 100M = 100
  const logDownloads = Math.log10(totalDownloads + 1);
  const score = Math.min(100, 25 + (logDownloads * 10));

  return Math.round(score);
}

/**
 * Calculate COMMUNITY score (0-100)
 * Based on GitHub collaboration metrics (replacement for VOICE/HN-based)
 * Weights: externalPRs (3.0), prsReceived (2.0), issues (1.0), contributors (1.5)
 */
export function calculateCommunity(metrics: CommunityMetrics): number {
  const { externalPRs, prsReceived, issuesReceived, uniqueContributors } = metrics;

  // No collaboration activity
  if (externalPRs === 0 && prsReceived === 0 && issuesReceived === 0 && uniqueContributors === 0) {
    return 20; // Baseline
  }

  // Weighted combination (per plan)
  const combined =
    (externalPRs * 3.0) +
    (prsReceived * 2.0) +
    (issuesReceived * 1.0) +
    (uniqueContributors * 1.5);

  // Log scale scoring
  // Score formula: min(100, 20 + log10(combined + 1) * 20)
  const logScore = Math.log10(combined + 1);
  const score = Math.min(100, 20 + (logScore * 20));

  return Math.round(score);
}

/**
 * Calculate REACH score (0-100)
 * Based on GitHub stars, forks, and followers (log scale)
 */
export function calculateReach(
  repos: GitHubRepo[],
  followers: number
): number {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

  // Weighted combination: stars most important
  const combined = totalStars + (totalForks * 0.5) + (followers * 0.3);

  if (combined === 0) return 20;

  // Log scale: 10 = 30, 100 = 50, 1000 = 70, 10000 = 90
  const logScore = Math.log10(combined + 1);
  const score = Math.min(100, 20 + (logScore * 18));

  return Math.round(score);
}

/**
 * Calculate overall rating (0-100)
 * Weighted average of all signals
 */
export function calculateOverallRating(signals: SignalScores): number {
  const weights = {
    grit: 1.5,    // Consistency matters
    focus: 1.5,   // Focus matters
    craft: 1.5,   // Quality matters
    impact: 1.0,  // npm presence
    voice: 1.2,   // Community collaboration (previously 0.8 for HN)
    reach: 1.2,   // Influence
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const weightedSum =
    signals.grit * weights.grit +
    signals.focus * weights.focus +
    signals.craft * weights.craft +
    signals.impact * weights.impact +
    signals.voice * weights.voice +
    signals.reach * weights.reach;

  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate all signals from data
 */
export function calculateAllSignals(
  commits: GitHubCommit[],
  repos: GitHubRepo[],
  followers: number,
  npmPackages: NpmPackage[],
  communityMetrics: CommunityMetrics
): SignalScores {
  return {
    grit: calculateGrit(commits),
    focus: calculateFocus(repos),
    craft: calculateCraft(repos),
    impact: calculateImpact(npmPackages),
    voice: calculateCommunity(communityMetrics),
    reach: calculateReach(repos, followers),
  };
}

// Helper: Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
