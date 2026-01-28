import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// Tier score formula weights
const WEIGHTS = {
  SHIPPING: 1.5,
  KARMA: 1.0,
  TRUST: 0.5,
} as const;

// Calculate tier from score (matching BUILDER_TIERS in types.ts)
function getTierFromScore(score: number): number {
  if (score >= 3000) return 7; // Cosmos
  if (score >= 1500) return 6; // Admiral
  if (score >= 800) return 5;  // Captain
  if (score >= 400) return 4;  // Commander
  if (score >= 150) return 3;  // Astronaut
  if (score >= 50) return 2;   // Pilot
  if (score >= 10) return 1;   // Cadet
  return 0; // Ground Control
}

// Calculate tier score from components
function calculateTierScore(sp: number, ck: number, ts: number): number {
  return Math.round(sp * WEIGHTS.SHIPPING + ck * WEIGHTS.KARMA + ts * WEIGHTS.TRUST);
}

// ============================================
// Queries
// ============================================

// Get builder rank by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }) => {
    return await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();
  },
});

// Get top builders by tier score (leaderboard)
// PERFORMANCE FIX: Use index ordering instead of full table scan + JS sort
export const getTopBuilders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 50 }) => {
    return await ctx.db
      .query("builderRanks")
      .withIndex("by_tier_score")
      .order("desc")
      .take(limit);
  },
});

// Get builders by tier
export const getByTier = query({
  args: { tier: v.number() },
  handler: async (ctx: QueryCtx, { tier }) => {
    return await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_tier", (q: any) => q.eq("tier", tier))
      .collect();
  },
});

// Get tier distribution stats
export const getTierDistribution = query({
  handler: async (ctx: QueryCtx) => {
    const all = await ctx.db.query("builderRanks").collect();
    const distribution = new Map<number, number>();

    for (let i = 0; i <= 7; i++) {
      distribution.set(i, 0);
    }

    for (const rank of all) {
      distribution.set(rank.tier, (distribution.get(rank.tier) || 0) + 1);
    }

    return {
      distribution: Array.from(distribution.entries()).map(([tier, count]) => ({
        tier,
        count,
      })),
      total: all.length,
    };
  },
});

// ============================================
// Mutations
// ============================================

// Initialize builder rank for new user (called on first project/launch)
export const initializeRank = mutation({
  args: { username: v.string() },
  handler: async (ctx: MutationCtx, { username }) => {
    // Check if already exists
    const existing = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new rank at Ground Control (T0)
    return await ctx.db.insert("builderRanks", {
      username,
      tier: 0,
      shippingPoints: 0,
      communityKarma: 0,
      trustScore: 0,
      tierScore: 0,
      potenCount: 0,
      weeklyWins: 0,
      monthlyWins: 0,
      updatedAt: Date.now(),
    });
  },
});

// Add shipping points (for launches, potens, wins)
export const addShippingPoints = mutation({
  args: {
    username: v.string(),
    points: v.number(),
    reason: v.string(), // "launch_submit", "poten_achieved", "weekly_first", etc.
  },
  handler: async (ctx: MutationCtx, { username, points, reason }) => {
    const rank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!rank) {
      // Auto-initialize if not exists
      const id = await ctx.db.insert("builderRanks", {
        username,
        tier: 0,
        shippingPoints: points,
        communityKarma: 0,
        trustScore: 0,
        tierScore: calculateTierScore(points, 0, 0),
        potenCount: reason === "poten_achieved" ? 1 : 0,
        weeklyWins: reason === "weekly_first" ? 1 : 0,
        monthlyWins: reason === "monthly_first" ? 1 : 0,
        updatedAt: Date.now(),
      });

      const newRank = await ctx.db.get(id);
      if (newRank) {
        const newTier = getTierFromScore(newRank.tierScore);
        if (newTier !== newRank.tier) {
          await ctx.db.patch(id, { tier: newTier });
        }
      }
      return id;
    }

    const newSP = rank.shippingPoints + points;
    const newTierScore = calculateTierScore(newSP, rank.communityKarma, rank.trustScore);
    const newTier = getTierFromScore(newTierScore);

    const updates: Partial<typeof rank> = {
      shippingPoints: newSP,
      tierScore: newTierScore,
      tier: newTier,
      updatedAt: Date.now(),
    };

    // Update achievement counters
    if (reason === "poten_achieved") {
      updates.potenCount = rank.potenCount + 1;
    } else if (reason === "weekly_first") {
      updates.weeklyWins = rank.weeklyWins + 1;
    } else if (reason === "monthly_first") {
      updates.monthlyWins = rank.monthlyWins + 1;
    }

    await ctx.db.patch(rank._id, updates);
    return rank._id;
  },
});

// Get promotion-based vote weight multiplier
export function getPromotionVoteMultiplier(promotionPoints: number): number {
  if (promotionPoints >= 151) return 5;
  if (promotionPoints >= 51) return 3;
  if (promotionPoints >= 11) return 2;
  return 1;
}

// Add promotion points (earned by giving feedback to others)
export const addPromotionPoints = mutation({
  args: {
    username: v.string(),
    points: v.number(),
    reason: v.string(), // "quick_vote" | "review" | "verified_review" | "marked_helpful"
  },
  handler: async (ctx: MutationCtx, { username, points }) => {
    const rank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!rank) {
      // Auto-initialize if not exists
      const id = await ctx.db.insert("builderRanks", {
        username,
        tier: 0,
        shippingPoints: 0,
        communityKarma: points, // Promotion points also contribute to karma
        trustScore: 0,
        tierScore: calculateTierScore(0, points, 0),
        potenCount: 0,
        weeklyWins: 0,
        monthlyWins: 0,
        updatedAt: Date.now(),
        promotionPoints: points,
      });

      const newRank = await ctx.db.get(id);
      if (newRank) {
        const newTier = getTierFromScore(newRank.tierScore);
        if (newTier !== newRank.tier) {
          await ctx.db.patch(id, { tier: newTier });
        }
      }
      return { id, promotionPoints: points, voteMultiplier: getPromotionVoteMultiplier(points) };
    }

    const newPromotionPoints = (rank.promotionPoints || 0) + points;
    const newCK = rank.communityKarma + points;
    const newTierScore = calculateTierScore(rank.shippingPoints, newCK, rank.trustScore);
    const newTier = getTierFromScore(newTierScore);

    await ctx.db.patch(rank._id, {
      promotionPoints: newPromotionPoints,
      communityKarma: newCK,
      tierScore: newTierScore,
      tier: newTier,
      updatedAt: Date.now(),
    });

    return {
      id: rank._id,
      promotionPoints: newPromotionPoints,
      voteMultiplier: getPromotionVoteMultiplier(newPromotionPoints),
    };
  },
});

// Add community karma (for votes, reviews, helpful marks)
export const addCommunityKarma = mutation({
  args: {
    username: v.string(),
    karma: v.number(),
  },
  handler: async (ctx: MutationCtx, { username, karma }) => {
    const rank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!rank) {
      // Auto-initialize if not exists
      const id = await ctx.db.insert("builderRanks", {
        username,
        tier: 0,
        shippingPoints: 0,
        communityKarma: karma,
        trustScore: 0,
        tierScore: calculateTierScore(0, karma, 0),
        potenCount: 0,
        weeklyWins: 0,
        monthlyWins: 0,
        updatedAt: Date.now(),
      });

      const newRank = await ctx.db.get(id);
      if (newRank) {
        const newTier = getTierFromScore(newRank.tierScore);
        if (newTier !== newRank.tier) {
          await ctx.db.patch(id, { tier: newTier });
        }
      }
      return id;
    }

    const newCK = rank.communityKarma + karma;
    const newTierScore = calculateTierScore(rank.shippingPoints, newCK, rank.trustScore);
    const newTier = getTierFromScore(newTierScore);

    await ctx.db.patch(rank._id, {
      communityKarma: newCK,
      tierScore: newTierScore,
      tier: newTier,
      updatedAt: Date.now(),
    });

    return rank._id;
  },
});

// Update trust score (from GitHub data sync)
export const updateTrustScore = mutation({
  args: {
    username: v.string(),
    trustScore: v.number(),
  },
  handler: async (ctx: MutationCtx, { username, trustScore }) => {
    const rank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!rank) {
      // Auto-initialize if not exists
      const id = await ctx.db.insert("builderRanks", {
        username,
        tier: 0,
        shippingPoints: 0,
        communityKarma: 0,
        trustScore,
        tierScore: calculateTierScore(0, 0, trustScore),
        potenCount: 0,
        weeklyWins: 0,
        monthlyWins: 0,
        updatedAt: Date.now(),
      });

      const newRank = await ctx.db.get(id);
      if (newRank) {
        const newTier = getTierFromScore(newRank.tierScore);
        if (newTier !== newRank.tier) {
          await ctx.db.patch(id, { tier: newTier });
        }
      }
      return id;
    }

    const newTierScore = calculateTierScore(rank.shippingPoints, rank.communityKarma, trustScore);
    const newTier = getTierFromScore(newTierScore);

    await ctx.db.patch(rank._id, {
      trustScore,
      tierScore: newTierScore,
      tier: newTier,
      updatedAt: Date.now(),
    });

    return rank._id;
  },
});

// Full rank recalculation (admin/cron)
export const recalculateRank = internalMutation({
  args: {
    username: v.string(),
    shippingPoints: v.number(),
    communityKarma: v.number(),
    trustScore: v.number(),
    potenCount: v.number(),
    weeklyWins: v.number(),
    monthlyWins: v.number(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { username, shippingPoints, communityKarma, trustScore, potenCount, weeklyWins, monthlyWins } = args;

    const tierScore = calculateTierScore(shippingPoints, communityKarma, trustScore);
    const tier = getTierFromScore(tierScore);

    const rank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (rank) {
      await ctx.db.patch(rank._id, {
        tier,
        shippingPoints,
        communityKarma,
        trustScore,
        tierScore,
        potenCount,
        weeklyWins,
        monthlyWins,
        updatedAt: Date.now(),
      });
      return rank._id;
    } else {
      return await ctx.db.insert("builderRanks", {
        username,
        tier,
        shippingPoints,
        communityKarma,
        trustScore,
        tierScore,
        potenCount,
        weeklyWins,
        monthlyWins,
        updatedAt: Date.now(),
      });
    }
  },
});


// Seed sample builder ranks for demo/testing
export const seedSampleBuilders = internalMutation({
  handler: async (ctx: MutationCtx) => {
    // Define base stats, tier/tierScore calculated dynamically
    const sampleBuilderStats = [
      { username: "torvalds", shippingPoints: 500, communityKarma: 200, trustScore: 100, potenCount: 10, weeklyWins: 5, monthlyWins: 20 },
      { username: "gaearon", shippingPoints: 300, communityKarma: 150, trustScore: 80, potenCount: 8, weeklyWins: 3, monthlyWins: 12 },
      { username: "sindresorhus", shippingPoints: 280, communityKarma: 140, trustScore: 75, potenCount: 7, weeklyWins: 2, monthlyWins: 10 },
      { username: "antfu", shippingPoints: 200, communityKarma: 100, trustScore: 60, potenCount: 5, weeklyWins: 2, monthlyWins: 8 },
      { username: "shadcn", shippingPoints: 180, communityKarma: 90, trustScore: 55, potenCount: 4, weeklyWins: 1, monthlyWins: 6 },
      { username: "rauchg", shippingPoints: 170, communityKarma: 85, trustScore: 50, potenCount: 4, weeklyWins: 1, monthlyWins: 5 },
    ];

    let created = 0;
    for (const stats of sampleBuilderStats) {
      const existing = await ctx.db
        .query("builderRanks")
        .withIndex("by_username", (q) => q.eq("username", stats.username))
        .first();

      if (!existing) {
        const tierScore = calculateTierScore(stats.shippingPoints, stats.communityKarma, stats.trustScore);
        const tier = getTierFromScore(tierScore);
        await ctx.db.insert("builderRanks", {
          ...stats,
          tier,
          tierScore,
          updatedAt: Date.now(),
        });
        created++;
      }
    }

    return { created, total: sampleBuilderStats.length };
  },
});
