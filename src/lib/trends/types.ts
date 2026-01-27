/**
 * Types for Global Tech Trends feature
 * All data is now fetched live from GitHub API via Convex
 */

export interface TrendingRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  todayStars: number;
  language: string | null;
  forks: number;
  url: string;
}

export interface LanguageTrend {
  name: string;
  percentage: number;
  growth: number;
  repos: number;
}

export interface LibraryTrend {
  name: string;
  category: string;
  downloads: number;
  weeklyGrowth: number;
  stars: number;
}
