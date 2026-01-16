import { mutation, query, internalQuery } from "./_generated/server";
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

// Mutation: Save/update analysis result (upsert by username)
export const saveAnalysis = mutation({
  args: analysisArgs,
  handler: async (ctx: MutationCtx, args: AnalysisArgs) => {
    // Check for existing analysis
    const existing = await ctx.db
      .query("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", args.username))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id as Id<"analyses">, {
        ...args,
      });
      return existing._id as Id<"analyses">;
    } else {
      // Create new record
      return await ctx.db.insert("analyses", args);
    }
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
