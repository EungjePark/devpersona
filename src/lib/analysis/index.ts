// Main Analysis Orchestrator
// Combines GitHub, npm, and HN data to generate a complete profile

import type { AnalysisResult, SignalScores, URLState } from '../types';
import { TIERS } from '../types';
import { fetchAllGitHubData } from '../github/client';
import { fetchNpmData } from '../npm/client';
import { fetchHNStats } from '../hackernews/client';
import { calculateAllSignals, calculateOverallRating } from './signals';
import { ARCHETYPES, matchArchetype } from './archetypes';
import { PATTERNS, detectActivityPattern, getLanguageDistribution, getTierFromRating } from './patterns';

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
  // Fetch all data in parallel
  const [githubData, npmPackages, hnStats] = await Promise.all([
    fetchAllGitHubData(username, { token: options.githubToken }),
    fetchNpmData(username).catch(() => []),
    fetchHNStats(username).catch(() => ({
      totalPoints: 0,
      totalComments: 0,
      totalStories: 0,
      topPost: null,
    })),
  ]);

  const { user, repos, commits, contributions } = githubData;

  // Calculate signals
  const signals = calculateAllSignals(
    commits,
    repos,
    user.followers,
    npmPackages,
    [] // HN items not needed for signal calculation - using stats instead
  );

  // Adjust VOICE signal with HN stats
  if (hnStats.totalPoints > 0 || hnStats.totalComments > 0) {
    const combined = hnStats.totalPoints + (hnStats.totalComments * 0.5);
    const logScore = Math.log10(combined + 1);
    signals.voice = Math.min(100, Math.round(20 + (logScore * 20)));
  }

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
    hnStats: {
      points: hnStats.totalPoints,
      comments: hnStats.totalComments,
      topPost: hnStats.topPost?.title,
    },
    contributions,
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
