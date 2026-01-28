import { v } from "convex/values";
import { mutation, internalMutation, query } from "./_generated/server";
import type { GenericMutationCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

// GitHub username validation pattern
const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const MAX_RANKINGS_PER_BATCH = 1000;

type RankingData = {
  rank: number;
  username: string;
  stars: number;
  avatarUrl?: string;
};

// Shared upsert logic for rankings (delete all + insert new)
async function performRankingsUpsert(
  ctx: MutationCtx,
  rankings: RankingData[]
): Promise<{ updated: number; timestamp: number }> {
  const now = Date.now();

  // Delete existing rankings (full refresh)
  const existing = await ctx.db.query("globalRankings").collect();
  for (const doc of existing) {
    await ctx.db.delete(doc._id);
  }

  // Insert new rankings
  for (const ranking of rankings) {
    await ctx.db.insert("globalRankings", {
      ...ranking,
      username: ranking.username.toLowerCase(),
      fetchedAt: now,
    });
  }

  return { updated: rankings.length, timestamp: now };
}

// Get top N global rankings
export const getTopRankings = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("globalRankings")
      .withIndex("by_rank")
      .take(limit);
  },
});

// Get a specific user's global rank
export const getUserRank = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("globalRankings")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();
  },
});

// Get last update time
export const getLastUpdate = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("globalRankings")
      .withIndex("by_rank")
      .first();
    return latest?.fetchedAt ?? null;
  },
});

const rankingsArgsValidator = v.array(
  v.object({
    rank: v.number(),
    username: v.string(),
    stars: v.number(),
    avatarUrl: v.optional(v.string()),
  })
);

// Input validation for public mutations
function validateRankings(rankings: RankingData[]): void {
  if (rankings.length > MAX_RANKINGS_PER_BATCH) {
    throw new Error(`Batch size exceeds maximum of ${MAX_RANKINGS_PER_BATCH}`);
  }
  for (const r of rankings) {
    if (!GITHUB_USERNAME_PATTERN.test(r.username) || r.username.length > 39) {
      throw new Error(`Invalid username: ${r.username}`);
    }
    if (r.rank < 1 || !Number.isInteger(r.rank)) {
      throw new Error(`Invalid rank: ${r.rank}`);
    }
    if (r.stars < 0 || !Number.isFinite(r.stars)) {
      throw new Error(`Invalid stars: ${r.stars}`);
    }
  }
}

// Public Mutation: Batch upsert rankings with validation
// SECURITY: Validates input; API route enforces auth via SCRAPE_API_KEY
export const upsertRankingsPublic = mutation({
  args: { rankings: rankingsArgsValidator },
  handler: async (ctx, args) => {
    validateRankings(args.rankings);
    return performRankingsUpsert(ctx, args.rankings);
  },
});

// Internal Mutation: Batch upsert rankings (called from API route with auth)
// SECURITY: Changed to internalMutation - prevents public manipulation of rankings
export const upsertRankings = internalMutation({
  args: { rankings: rankingsArgsValidator },
  handler: async (ctx, args) => {
    return performRankingsUpsert(ctx, args.rankings);
  },
});

// Get DevPersona internal star ranking (users we've analyzed)
export const getDevPersonaStarRanking = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get analyses sorted by totalStars
    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_stars")
      .order("desc")
      .take(limit);

    // Filter out entries without totalStars and map to ranking format
    return analyses
      .filter((a) => a.totalStars && a.totalStars > 0)
      .map((a, index) => ({
        rank: index + 1,
        username: a.username,
        stars: a.totalStars!,
        avatarUrl: a.avatarUrl,
        tier: a.tier,
        overallRating: a.overallRating,
      }));
  },
});

// Get user's rank within DevPersona analyzed users
export const getDevPersonaUserRank = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // Get the user's analysis
    const userAnalysis = await ctx.db
      .query("analyses")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!userAnalysis?.totalStars) return null;

    // Count how many users have more stars
    const allAnalyses = await ctx.db
      .query("analyses")
      .withIndex("by_stars")
      .order("desc")
      .collect();

    const usersWithMoreStars = allAnalyses.filter(
      (a) => a.totalStars && a.totalStars > userAnalysis.totalStars!
    ).length;

    const totalUsersWithStars = allAnalyses.filter(
      (a) => a.totalStars && a.totalStars > 0
    ).length;

    return {
      rank: usersWithMoreStars + 1,
      totalUsers: totalUsersWithStars,
      percentile: Math.round(((totalUsersWithStars - usersWithMoreStars) / totalUsersWithStars) * 100),
    };
  },
});
