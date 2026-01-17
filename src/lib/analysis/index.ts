// Main Analysis Orchestrator
// Combines GitHub, npm data to generate a complete profile

import type { AnalysisResult, SignalScores, URLState, CommunityMetrics } from '../types';
import { TIERS } from '../types';
import { fetchAllGitHubData, fetchCommunityMetrics } from '../github/client';
import { fetchNpmData } from '../npm/client';
import { calculateAllSignals, calculateOverallRating } from './signals';
import { ARCHETYPES, matchArchetype } from './archetypes';
import { PATTERNS, detectActivityPattern, getLanguageDistribution, getTierFromRating } from './patterns';
import { calculateAchievements } from '../achievements';

export * from './signals';
export * from './archetypes';
export * from './patterns';

interface AnalyzeOptions {
  githubToken?: string;
}

/**
 * Perform full analysis of a developer
 * Fetches data from all sources and calculates signals
 */
export async function analyzeUser(
  username: string,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  // Fetch all data in PARALLEL for maximum performance
  const [githubData, npmPackages] = await Promise.all([
    fetchAllGitHubData(username, { token: options.githubToken }),
    fetchNpmData(username).catch(() => []),
  ]);

  const { user, repos, commits, contributions } = githubData;

  // Run community metrics with a timeout to prevent blocking (10s max)
  const communityMetrics = await Promise.race([
    fetchCommunityMetrics(username, repos, { token: options.githubToken }),
    new Promise<CommunityMetrics>((resolve) =>
      setTimeout(() => resolve({
        externalPRs: 0,
        prsReceived: 0,
        issuesReceived: 0,
        uniqueContributors: 0,
      }), 10000)
    ),
  ]).catch((): CommunityMetrics => ({
    externalPRs: 0,
    prsReceived: 0,
    issuesReceived: 0,
    uniqueContributors: 0,
  }));

  // Calculate signals
  const signals = calculateAllSignals(
    commits,
    repos,
    user.followers,
    npmPackages,
    communityMetrics
  );

  // Boost GRIT signal with contribution streak data
  if (contributions) {
    const streakBonus = Math.min(20, contributions.currentStreak * 0.5);
    const consistencyBonus = Math.min(10, contributions.averagePerDay * 20);
    signals.grit = Math.min(100, Math.round(signals.grit + streakBonus + consistencyBonus));
  }

  // Calculate derived values
  const overallRating = calculateOverallRating(signals);
  const tier = getTierFromRating(overallRating);
  const archetype = matchArchetype(signals);
  const pattern = detectActivityPattern(commits);
  const languages = getLanguageDistribution(repos);

  // Calculate repo statistics
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const repoCount = repos.length;

  // Get top repositories sorted by stars
  const topRepos = repos
    .filter(repo => !repo.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language ?? undefined,
      description: repo.description ?? undefined,
    }));

  // Calculate achievements
  const achievements = contributions
    ? calculateAchievements(contributions, {
        languages,
        totalStars,
        maxRepoStars: repos.length > 0 ? Math.max(...repos.map(r => r.stargazers_count)) : 0,
        followers: user.followers,
        prCount: communityMetrics.prsReceived + communityMetrics.externalPRs,
        activeRepos: repos.filter(r => !r.archived).length,
        totalRepos: repoCount,
        npmPackages: npmPackages.length,
        npmWeeklyDownloads: npmPackages.reduce((sum, p) => sum + p.downloads, 0),
        externalPRs: communityMetrics.externalPRs,
        signals,
      })
    : [];

  return {
    username: user.login,
    avatarUrl: user.avatar_url,
    name: user.name,
    bio: user.bio,
    signals,
    overallRating,
    tier,
    archetype,
    pattern,
    languages,
    npmPackages,
    communityMetrics,
    contributions,
    repos,
    followers: user.followers,
    achievements,
    totalStars,
    totalForks,
    repoCount,
    topRepos,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Encode analysis result to URL state (for sharing)
 */
export function encodeToURLState(result: AnalysisResult): URLState {
  return {
    u: result.username,
    a: result.archetype.id,
    t: result.tier.level,
    o: result.overallRating,
    g: result.signals.grit,
    f: result.signals.focus,
    c: result.signals.craft,
    i: result.signals.impact,
    v: result.signals.voice,
    r: result.signals.reach,
    p: result.pattern.type,
  };
}

/**
 * Compress URL state to query string
 */
export function compressURLState(state: URLState): string {
  // Simple encoding: JSON + base64-like encoding
  const json = JSON.stringify(state);
  // Using encodeURIComponent for URL safety
  return encodeURIComponent(btoa(json));
}

/**
 * Decompress query string to URL state
 */
export function decompressURLState(compressed: string): URLState | null {
  try {
    const json = atob(decodeURIComponent(compressed));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Reconstruct partial analysis result from URL state
 * (For rendering shared results without API calls)
 */
export function reconstructFromURLState(state: URLState): Partial<AnalysisResult> {
  const signals: SignalScores = {
    grit: state.g,
    focus: state.f,
    craft: state.c,
    impact: state.i,
    voice: state.v,
    reach: state.r,
  };

  return {
    username: state.u,
    signals,
    overallRating: state.o,
    tier: TIERS[state.t],
    archetype: ARCHETYPES[state.a as keyof typeof ARCHETYPES],
    pattern: PATTERNS[state.p],
  };
}
