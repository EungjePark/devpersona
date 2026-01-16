// Core types for DevPersona

// Signal scores (0-100)
export interface SignalScores {
  grit: number;    // Commit consistency
  focus: number;   // Active repos ratio
  craft: number;   // README/License/Description %
  impact: number;  // npm downloads (log scale)
  voice: number;   // HN points + comments
  reach: number;   // Stars + forks + followers (log scale)
}

// Signal display names (Option A - Dev Slang / Meme style)
export const SIGNAL_LABELS: Record<keyof SignalScores, { name: string; description: string; emoji: string }> = {
  grit: { name: 'GRIND', description: 'How hard you push code', emoji: '💪' },
  focus: { name: 'DEPTH', description: 'How deep you go', emoji: '🎯' },
  craft: { name: 'SHINE', description: 'How polished your work is', emoji: '✨' },
  impact: { name: 'BOOM', description: 'How viral your packages are', emoji: '💥' },
  voice: { name: 'VIBE', description: 'How much you engage', emoji: '🗣️' },
  reach: { name: 'CLOUT', description: 'How famous you are', emoji: '👑' },
};

// Signal order for display
export const SIGNAL_ORDER: (keyof SignalScores)[] = ['grit', 'focus', 'craft', 'impact', 'voice', 'reach'];

// Tier system
export type TierLevel = 'S' | 'A' | 'B' | 'C';

export interface Tier {
  level: TierLevel;
  name: string;
  color: string;
  minRating: number;
  cardClass: string;
}

export const TIERS: Record<TierLevel, Tier> = {
  S: { level: 'S', name: 'LEGENDARY', color: '#ffd700', minRating: 90, cardClass: 'card-legendary' },
  A: { level: 'A', name: 'EPIC', color: '#a855f7', minRating: 75, cardClass: 'card-epic' },
  B: { level: 'B', name: 'RARE', color: '#3b82f6', minRating: 50, cardClass: 'card-rare' },
  C: { level: 'C', name: 'COMMON', color: '#6b7280', minRating: 0, cardClass: 'card-common' },
};

// Tier design tokens for enhanced styling
export interface TierDesignTokens {
  background: string;
  border: string;
  text: string;
  textClass: string;
  glow: string;
  grassColors: [string, string, string, string];
}

export const TIER_DESIGN_TOKENS: Record<TierLevel, TierDesignTokens> = {
  S: {
    background: 'var(--card-bg-legendary)',
    border: 'var(--tier-legendary)',
    text: 'var(--tier-text-legendary)',
    textClass: 'text-yellow-300',
    glow: 'var(--tier-glow-legendary)',
    grassColors: ['#78350f', '#92400e', '#b45309', '#d97706'],
  },
  A: {
    background: 'var(--card-bg-epic)',
    border: 'var(--tier-epic)',
    text: 'var(--tier-text-epic)',
    textClass: 'text-purple-400',
    glow: 'var(--tier-glow-epic)',
    grassColors: ['#581c87', '#7e22ce', '#9333ea', '#a855f7'],
  },
  B: {
    background: 'var(--card-bg-rare)',
    border: 'var(--tier-rare)',
    text: 'var(--tier-text-rare)',
    textClass: 'text-blue-400',
    glow: 'var(--tier-glow-rare)',
    grassColors: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6'],
  },
  C: {
    background: 'var(--card-bg-common)',
    border: 'var(--tier-common)',
    text: 'var(--tier-text-common)',
    textClass: 'text-zinc-400',
    glow: 'var(--tier-glow-common)',
    grassColors: ['#27272a', '#3f3f46', '#52525b', '#71717a'],
  },
};

// Stat grades (A-F)
export type StatGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeInfo {
  grade: StatGrade;
  color: string;
  threshold: number;
}

export const STAT_GRADES: GradeInfo[] = [
  { grade: 'S', color: '#ffd700', threshold: 90 },
  { grade: 'A', color: '#22c55e', threshold: 80 },
  { grade: 'B', color: '#84cc16', threshold: 60 },
  { grade: 'C', color: '#eab308', threshold: 40 },
  { grade: 'D', color: '#f97316', threshold: 20 },
  { grade: 'F', color: '#ef4444', threshold: 0 },
];

// Archetypes
export type ArchetypeId =
  | 'maintainer'
  | 'silent_builder'
  | 'prototype_machine'
  | 'specialist'
  | 'hype_surfer'
  | 'archivist'
  | 'comeback_kid'
  | 'ghost';

export interface Archetype {
  id: ArchetypeId;
  name: string;
  description: string;
  roasts: string[];
  condition: (scores: SignalScores) => boolean;
}

// Activity patterns
export type ActivityPattern = 'night_owl' | 'weekend_warrior' | 'early_bird' | 'balanced';

export interface PatternInfo {
  type: ActivityPattern;
  name: string;
  emoji: string;
  description: string;
}

// GitHub types
export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  created_at: string;
  archived: boolean;
  has_readme?: boolean;
  license: { name: string } | null;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
}

// npm types
export interface NpmPackage {
  name: string;
  downloads: number;
}

// Hacker News types
export interface HNItem {
  objectID: string;
  title?: string;
  points: number;
  num_comments: number;
  created_at: string;
  story_text?: string;
}

export interface HNSearchResult {
  hits: HNItem[];
  nbHits: number;
  page: number;
  nbPages: number;
}

// GitHub Contribution (Grass) types
export interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionStats {
  calendar: ContributionCalendar;
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  averagePerDay: number;
}

// Repository summary for top repos display
export interface RepositorySummary {
  name: string;
  fullName: string;
  stars: number;
  forks: number;
  language?: string;
  description?: string;
}

// Analysis result
export interface AnalysisResult {
  username: string;
  avatarUrl: string;
  name: string | null;
  bio: string | null;
  signals: SignalScores;
  overallRating: number;
  tier: Tier;
  archetype: Archetype;
  pattern: PatternInfo;
  languages: { name: string; percentage: number }[];
  npmPackages: NpmPackage[];
  hnStats: { points: number; comments: number; topPost?: string };
  contributions: ContributionStats | null;
  // GitHub star/repo data
  totalStars?: number;
  totalForks?: number;
  repoCount?: number;
  topRepos?: RepositorySummary[];
  // Star ranking data
  starRank?: number | null;
  starPercentile?: number | null;
  totalRankedUsers?: number;
  analyzedAt: string;
}

// URL state (compressed)
export interface URLState {
  u: string;  // username
  a: string;  // archetype id
  t: TierLevel;  // tier
  o: number;  // overall rating
  g: number;  // grit
  f: number;  // focus
  c: number;  // craft
  i: number;  // impact
  v: number;  // voice
  r: number;  // reach
  p: ActivityPattern;  // pattern
}
