import { action, mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// Analysis args type - extended with star/follower data
const analysisArgs = {
  username: v.string(),
  avatarUrl: v.string(),
  name: v.optional(v.string()),
  grit: v.number(),
  focus: v.number(),
  craft: v.number(),
  impact: v.number(),
  voice: v.number(),
  reach: v.number(),
  overallRating: v.number(),
  tier: v.string(),
  archetypeId: v.string(),
  analyzedAt: v.number(),
  // NEW: Extended metrics
  totalStars: v.optional(v.number()),
  totalForks: v.optional(v.number()),
  followers: v.optional(v.number()),
  topLanguage: v.optional(v.string()),
};

type AnalysisArgs = {
  username: string;
  avatarUrl: string;
  name?: string;
  grit: number;
  focus: number;
  craft: number;
  impact: number;
  voice: number;
  reach: number;
  overallRating: number;
  tier: string;
  archetypeId: string;
  analyzedAt: number;
  totalStars?: number;
  totalForks?: number;
  followers?: number;
  topLanguage?: string;
};

// Valid username pattern (GitHub username rules - no consecutive hyphens)
const GITHUB_USERNAME_PATTERN = /^(?!.*--)[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const VALID_TIERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
const VALID_ARCHETYPES = [
  'maintainer', 'silent_builder', 'prototype_machine', 'specialist',
  'hype_surfer', 'archivist', 'comeback_kid', 'ghost'
];

// Input validation helper
function validateAnalysisInput(args: AnalysisArgs): string | null {
  // Validate username format
  if (!args.username || !GITHUB_USERNAME_PATTERN.test(args.username)) {
    return 'Invalid username format';
  }
  if (args.username.length > 39) {
    return 'Username too long';
  }

  // Validate numeric ranges (0-100)
  const numericFields = ['grit', 'focus', 'craft', 'impact', 'voice', 'reach', 'overallRating'] as const;
  for (const field of numericFields) {
    const value = args[field];
    if (typeof value !== 'number' || value < 0 || value > 100 || !Number.isFinite(value)) {
      return `Invalid ${field} value`;
    }
  }

  // Validate tier
  if (!VALID_TIERS.includes(args.tier)) {
    return 'Invalid tier';
  }

  // Validate archetype
  if (!VALID_ARCHETYPES.includes(args.archetypeId)) {
    return `Invalid archetype: "${args.archetypeId}" (valid: ${VALID_ARCHETYPES.join(', ')})`;
  }

  // Validate optional numbers
  if (args.totalStars !== undefined && (args.totalStars < 0 || !Number.isFinite(args.totalStars))) {
    return 'Invalid totalStars';
  }
  if (args.totalForks !== undefined && (args.totalForks < 0 || !Number.isFinite(args.totalForks))) {
    return 'Invalid totalForks';
  }
  if (args.followers !== undefined && (args.followers < 0 || !Number.isFinite(args.followers))) {
    return 'Invalid followers';
  }

  return null;
}

// Shared upsert logic for analysis records
async function upsertAnalysis(ctx: MutationCtx, args: AnalysisArgs): Promise<Id<"analyses">> {
  const existing = await ctx.db
    .query("analyses")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_username", (q: any) => q.eq("username", args.username))
    .first();

  let analysisId: Id<"analyses">;
  if (existing) {
    await ctx.db.patch(existing._id as Id<"analyses">, { ...args });
    analysisId = existing._id as Id<"analyses">;
  } else {
    analysisId = await ctx.db.insert("analyses", args);
  }

  // Also ensure user record exists (required for station membership, voting, etc.)
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", args.username))
    .first();

  if (!existingUser) {
    // Generate a temporary githubId from username hash
    // This will be updated when the user authenticates with Clerk
    const tempGithubId = Math.abs(
      args.username.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0)
    ) % 1000000000;

    await ctx.db.insert("users", {
      username: args.username,
      avatarUrl: args.avatarUrl,
      followers: args.followers ?? 0,
      githubId: tempGithubId,
      lastFetchedAt: args.analyzedAt,
      publicRepos: 0,
      totalForks: args.totalForks ?? 0,
      totalStars: args.totalStars ?? 0,
      name: args.name,
    });
  } else {
    // Update existing user with latest data
    await ctx.db.patch(existingUser._id, {
      avatarUrl: args.avatarUrl,
      followers: args.followers ?? existingUser.followers,
      totalStars: args.totalStars ?? existingUser.totalStars,
      totalForks: args.totalForks ?? existingUser.totalForks,
      lastFetchedAt: args.analyzedAt,
      name: args.name ?? existingUser.name,
    });
  }

  return analysisId;
}

// Public Mutation: Save analysis with validation (client-callable)
// SECURITY: Validates input before saving to prevent malicious data
export const saveAnalysisPublic = mutation({
  args: analysisArgs,
  handler: async (ctx: MutationCtx, args: AnalysisArgs) => {
    const validationError = validateAnalysisInput(args);
    if (validationError) {
      throw new Error(validationError);
    }
    return upsertAnalysis(ctx, args);
  },
});

// Internal Mutation: Save/update analysis result (upsert by username)
// SECURITY: Changed to internalMutation - only callable from server-side actions
export const saveAnalysis = internalMutation({
  args: analysisArgs,
  handler: async (ctx: MutationCtx, args: AnalysisArgs) => {
    return upsertAnalysis(ctx, args);
  },
});

// Query: Get pre-aggregated leaderboard snapshot (O(1) - public)
export const getLeaderboardSnapshot = query({
  handler: async (ctx: QueryCtx) => {
    return await ctx.db
      .query("stats")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("type"), "leaderboard"))
      .first();
  },
});

// Query: Calculate user rank from snapshot (public)
export const getUserRank = query({
  args: { rating: v.number() },
  handler: async (ctx: QueryCtx, { rating }: { rating: number }) => {
    const result = await ctx.db
      .query("stats")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("type"), "leaderboard"))
      .first();

    // Cast to our known type
    const snapshot = result as Doc<"stats"> | null;

    if (!snapshot) {
      return { rank: null, total: 0, percentile: null };
    }

    // Calculate rank from distribution buckets
    let higherCount = 0;
    for (const bucket of snapshot.distribution) {
      const bucketStart = parseInt(bucket.bucket.split("-")[0]);
      if (bucketStart > rating) {
        higherCount += bucket.count;
      } else if (bucketStart === Math.floor(rating / 10) * 10) {
        // Same bucket: estimate half are higher
        higherCount += Math.floor(bucket.count / 2);
      }
    }

    const rank = higherCount + 1;
    const percentile =
      snapshot.totalUsers > 0
        ? Math.round(((snapshot.totalUsers - rank + 1) / snapshot.totalUsers) * 100)
        : 0;

    return {
      rank,
      total: snapshot.totalUsers,
      percentile,
    };
  },
});

// Query: Get star rank for a user
export const getStarRank = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }: { username: string }) => {
    const user = await ctx.db
      .query("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!user || user.totalStars === undefined) {
      return { rank: null, total: 0, percentile: null };
    }

    // Get all analyses with stars
    const allAnalyses = await ctx.db.query("analyses").collect();
    const withStars = allAnalyses.filter(a => a.totalStars !== undefined && a.totalStars > 0);
    const sortedByStars = withStars.sort((a, b) => (b.totalStars || 0) - (a.totalStars || 0));

    const rank = sortedByStars.findIndex(a => a.username === username) + 1;
    const total = sortedByStars.length;
    const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;

    return { rank, total, percentile };
  },
});

// Query: Get top analyses by stars
export const getTopByStars = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 50 }: { limit?: number }) => {
    const allAnalyses = await ctx.db.query("analyses").collect();
    return allAnalyses
      .filter(a => a.totalStars !== undefined && a.totalStars > 0)
      .sort((a, b) => (b.totalStars || 0) - (a.totalStars || 0))
      .slice(0, limit);
  },
});

// Query: Get top analyses by followers
export const getTopByFollowers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 50 }: { limit?: number }) => {
    const allAnalyses = await ctx.db.query("analyses").collect();
    return allAnalyses
      .filter(a => a.followers !== undefined && a.followers > 0)
      .sort((a, b) => (b.followers || 0) - (a.followers || 0))
      .slice(0, limit);
  },
});

// Internal query: Get all analyses (for cron aggregation only)
export const getAll = internalQuery({
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query("analyses").collect();
  },
});

// Query: Get user's own analysis by username (public)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }: { username: string }) => {
    return await ctx.db
      .query("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();
  },
});

// Internal Mutation: Delete all analyses (for resetting seed data)
// SECURITY: Changed to internalMutation - prevents public access to destructive operation
export const deleteAllAnalyses = internalMutation({
  handler: async (ctx: MutationCtx) => {
    const allAnalyses = await ctx.db.query("analyses").collect();
    let count = 0;
    for (const analysis of allAnalyses) {
      await ctx.db.delete(analysis._id);
      count++;
    }
    return { deleted: count };
  },
});

// Admin action for clearing analyses - auth handled by API route
export const adminClearAnalyses = action({
  args: {},
  handler: async (ctx): Promise<{ deleted: number }> => {
    return await ctx.runMutation(internal.analyses.deleteAllAnalyses);
  },
});
