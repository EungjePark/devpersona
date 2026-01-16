import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

// Batch upsert rankings (called from API route)
export const upsertRankings = mutation({
  args: {
    rankings: v.array(
      v.object({
        rank: v.number(),
        username: v.string(),
        stars: v.number(),
        avatarUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete existing rankings (full refresh)
    const existing = await ctx.db.query("globalRankings").collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }

    // Insert new rankings
    for (const ranking of args.rankings) {
      await ctx.db.insert("globalRankings", {
        ...ranking,
        username: ranking.username.toLowerCase(),
        fetchedAt: now,
      });
    }

    return { updated: args.rankings.length, timestamp: now };
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
