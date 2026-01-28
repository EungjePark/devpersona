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
  voice: { name: 'COMMUNITY', description: 'How much you collaborate', emoji: '🤝' },
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
  fork: boolean;
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

// Community metrics for COMMUNITY signal (replacement for VOICE)
export interface CommunityMetrics {
  externalPRs: number;      // PRs to other people's repos
  prsReceived: number;      // PRs received on own repos
  issuesReceived: number;   // Issues received on own repos
  uniqueContributors: number; // Unique contributors across repos
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
  communityMetrics?: CommunityMetrics;
  contributions: ContributionStats | null;
  // Raw data for signal breakdowns
  repos?: GitHubRepo[];
  followers?: number;
  // Achievement badges
  achievements?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    category: 'streak' | 'volume' | 'consistency' | 'special' | 'language' | 'social' | 'opensource' | 'npm' | 'community' | 'milestone' | 'secret';
    unlocked: boolean;
    progress?: number;
    maxValue?: number;
    currentValue?: number;
  }>;
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

// ============================================
// DevPersona V2: Community Edition Types
// ============================================

// Builder Tier System (NASA Theme)
export type BuilderTierLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BuilderTierInfo {
  level: BuilderTierLevel;
  name: string;
  icon: string;
  background: string;
  description: string;
  voteWeight: number;
  minScore: number;
  privileges: string[];
}

export const BUILDER_TIERS: Record<BuilderTierLevel, BuilderTierInfo> = {
  0: {
    level: 0,
    name: 'Ground Control',
    icon: '🎧',
    background: 'none',
    description: 'Mission Control - observing from Earth',
    voteWeight: 0,
    minScore: 0,
    privileges: ['View launches', 'View leaderboard'],
  },
  1: {
    level: 1,
    name: 'Cadet',
    icon: '🧑‍🚀',
    background: 'none',
    description: 'Space training initiated',
    voteWeight: 1,
    minScore: 10,
    privileges: ['Vote on launches (1 point)', 'Comment on posts'],
  },
  2: {
    level: 2,
    name: 'Pilot',
    icon: '✈️',
    background: 'clouds',
    description: 'Breaking through the atmosphere',
    voteWeight: 1,
    minScore: 50,
    privileges: ['Submit launches', 'Create posts', 'Full voting'],
  },
  3: {
    level: 3,
    name: 'Astronaut',
    icon: '👨‍🚀',
    background: 'earth',
    description: 'Achieved orbit - first poten!',
    voteWeight: 2,
    minScore: 150,
    privileges: ['Vote weight x2', 'Poten badge'],
  },
  4: {
    level: 4,
    name: 'Commander',
    icon: '🚀',
    background: 'space',
    description: 'Leading missions to the stars',
    voteWeight: 3,
    minScore: 400,
    privileges: ['Vote weight x3', 'Custom badge', 'Badge customization'],
  },
  5: {
    level: 5,
    name: 'Captain',
    icon: '🛸',
    background: 'nebula',
    description: 'Navigating through nebulae',
    voteWeight: 5,
    minScore: 800,
    privileges: ['Vote weight x5', 'Jury member', 'VIP access'],
  },
  6: {
    level: 6,
    name: 'Admiral',
    icon: '⭐',
    background: 'galaxy',
    description: 'Commanding the fleet',
    voteWeight: 5,
    minScore: 1500,
    privileges: ['Physical rewards eligible', 'VIP Lounge access'],
  },
  7: {
    level: 7,
    name: 'Cosmos',
    icon: '🌌',
    background: 'hologram',
    description: 'One with the universe',
    voteWeight: 5,
    minScore: 3000,
    privileges: ['Annual trophy', 'Ambassador status', 'Hall of Fame'],
  },
};

// Builder Rank data structure
export interface BuilderRank {
  username: string;
  tier: BuilderTierLevel;
  shippingPoints: number;
  communityKarma: number;
  trustScore: number;
  tierScore: number;
  potenCount: number;
  weeklyWins: number;
  monthlyWins: number;
  updatedAt: number;
}

// Launch submission
export interface Launch {
  _id?: string;
  userId?: string;
  username: string;
  title: string;
  description: string;
  demoUrl?: string;
  githubUrl?: string;
  screenshot?: string;
  weekNumber: string;
  voteCount: number;
  weightedScore: number;
  isPoten: boolean;
  rank?: number;
  status: 'pending' | 'active' | 'closed';
  createdAt: number;
}

// Vote on a launch
export interface Vote {
  launchId: string;
  voterId?: string;
  voterUsername: string;
  weight: number;
  createdAt: number;
}

// Community board types
export type BoardType = 'launch_week' | 'hall_of_fame' | 'feedback' | 'discussion' | 'vip_lounge';

export const BOARD_INFO: Record<BoardType, { name: string; description: string; minTier: BuilderTierLevel }> = {
  launch_week: {
    name: 'Launch Week',
    description: 'This week\'s launches and voting',
    minTier: 0,
  },
  hall_of_fame: {
    name: 'Hall of Fame',
    description: 'Archive of winners and poten posts',
    minTier: 0,
  },
  feedback: {
    name: 'Feedback',
    description: 'Project reviews and feedback',
    minTier: 1,
  },
  discussion: {
    name: 'Discussion',
    description: 'Free discussion among builders',
    minTier: 2,
  },
  vip_lounge: {
    name: 'VIP Lounge',
    description: 'Admiral+ exclusive discussions',
    minTier: 6,
  },
};

// Community post
export interface Post {
  _id?: string;
  authorId?: string;
  authorUsername: string;
  boardType: BoardType;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isPoten: boolean;
  potenAt?: number;
  commentCount: number;
  createdAt: number;
  updatedAt?: number;
}

// Comment on a post
export interface Comment {
  _id?: string;
  postId: string;
  authorId?: string;
  authorUsername: string;
  content: string;
  parentId?: string;
  upvotes: number;
  depth: number;
  createdAt: number;
  // UI helper for nested display
  children?: Comment[];
}

// Reward types
export type RewardType = 'sticker_pack' | 'goodie_kit' | 'acrylic_trophy' | 'metal_trophy';

export interface Reward {
  _id?: string;
  username: string;
  rewardType: RewardType;
  reason: string;
  weekNumber?: string;
  status: 'eligible' | 'claimed' | 'shipped' | 'delivered';
  shippingAddress?: string;
  trackingNumber?: string;
  claimedAt?: number;
  shippedAt?: number;
  createdAt: number;
}

// Weekly results (Hall of Fame)
export interface WeeklyResult {
  weekNumber: string;
  winners: Array<{
    rank: number;
    launchId: string;
    username: string;
    title: string;
    weightedScore: number;
  }>;
  totalLaunches: number;
  totalVotes: number;
  finalizedAt: number;
}

// Point system constants
export const SHIPPING_POINTS = {
  PROJECT_REGISTER: 10,
  LAUNCH_SUBMIT: 20,
  POTEN_ACHIEVED: 100,
  WEEKLY_FIRST: 200,
  MONTHLY_FIRST: 500,
} as const;

export const KARMA_POINTS = {
  REVIEW_WRITTEN: 2,
  HELPFUL_MARK: 5,
  VOTE_CAST: 1,
  RECOMMENDED_BUILDER_POTEN: 10,
} as const;

// Poten threshold (FM코리아 style)
export const POTEN_THRESHOLD = 10; // Net upvotes needed for poten

// ============================================
// DevPersona V3: Community Platform Types
// ============================================

// Signal boost data (from community activities)
export interface SignalBoostData {
  voiceBoost: number;
  impactBoost: number;
  reachBoost: number;
  gritBoost: number;
  focusBoost: number;
  craftBoost: number;
}

// Community activity data for calculating boosts
export interface CommunityActivityData {
  feedbackCount: number;
  helpfulMarks: number;
  launches: number;
  potenCount: number;
  stationMemberships: number;
  crewCount: number;
  streakDays: number;
  challengesCompleted: number;
  topStationKarma: number;
  bugReports: number;
  featureImplemented: number;
}

// Idea Validation (Board)
export interface IdeaValidation {
  _id?: string;
  authorUsername: string;
  title: string;
  problem: string;
  solution: string;
  targetAudience: string;
  supportVotes: number;
  opposeVotes: number;
  commentCount: number;
  hotScore: number;
  status: 'open' | 'validated' | 'launched' | 'closed';
  validatedAt?: number;
  linkedLaunchId?: string;
  createdAt: number;
}

// Idea Vote
export interface IdeaVote {
  _id?: string;
  ideaId: string;
  voterUsername: string;
  voteType: 'support' | 'oppose';
  reason?: string;
  weight: number;
  createdAt: number;
}

// Product Station (Space Station theme)
export interface ProductStation {
  _id?: string;
  slug: string;
  name: string;
  description: string;
  ownerUsername: string;
  launchId?: string;
  logoUrl?: string;
  accentColor?: string;
  memberCount: number;
  postCount: number;
  weeklyActiveMembers: number;
  status: 'active' | 'archived';
  createdAt: number;
}

// Station Crew (Members)
export interface StationCrew {
  _id?: string;
  stationId: string;
  username: string;
  role: 'crew' | 'moderator' | 'captain';
  karmaEarnedHere: number;
  joinedAt: number;
}

// Station Post
export interface StationPost {
  _id?: string;
  stationId: string;
  authorUsername: string;
  postType: 'update' | 'feedback' | 'question' | 'bug' | 'feature' | 'discussion';
  title: string;
  content: string;
  isOwnerPost: boolean;
  isPinned: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: number;
}

// Cross-Station Karma
export interface CrossStationKarma {
  _id?: string;
  username: string;
  externalKarma: number;
  uniqueStationsHelped: number;
  promotionBoostEarned: number;
  updatedAt: number;
}

// Authenticated User Profile (combined data)
export interface AuthenticatedUserProfile {
  user: {
    _id: string;
    githubId: number;
    username: string;
    avatarUrl: string;
    name?: string;
    bio?: string;
    clerkId?: string;
    isAuthenticated?: boolean;
    lastLoginAt?: number;
  };
  builderRank: BuilderRank | null;
  analysis: {
    username: string;
    grit: number;
    focus: number;
    craft: number;
    impact: number;
    voice: number;
    reach: number;
    overallRating: number;
    tier: string;
    archetypeId: string;
    voiceBoost?: number;
    impactBoost?: number;
    reachBoost?: number;
    gritBoost?: number;
    focusBoost?: number;
    craftBoost?: number;
  } | null;
}

// Rate limits configuration
export const RATE_LIMITS = {
  idea_submit: { window: 86400000, max: 3 },    // 하루 3개
  vote: { window: 3600000, max: 30 },           // 시간당 30표
  comment: { window: 300000, max: 10 },         // 5분당 10댓글
  post: { window: 3600000, max: 5 },            // 시간당 5포스트
} as const;

// Quality gates (minimum tier/karma for features)
export const QUALITY_GATES = {
  idea_vote: { minTier: 1, minKarma: 0 },
  idea_submit: { minTier: 2, minKarma: 10 },
  station_post: { minTier: 1, minKarma: 0 },
  oppose_vote: { minTier: 2, minKarma: 50 },
  moderator: { minTier: 4, minKarma: 500 },
} as const;
