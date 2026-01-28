import { internalAction, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import type { DistributionBucket } from "../src/lib/leaderboard-types";

type ActionCtx = GenericActionCtx<DataModel>;

// Helper: Calculate distribution buckets from analyses
function calculateDistribution(
  analyses: Array<{ overallRating: number }>
): DistributionBucket[] {
  const buckets: Record<string, number> = {};

  // Initialize all buckets
  for (let i = 0; i < 100; i += 10) {
    buckets[`${i}-${i + 10}`] = 0;
  }

  // Count analyses per bucket
  for (const analysis of analyses) {
    const bucketStart = Math.floor(analysis.overallRating / 10) * 10;
    const key = `${bucketStart}-${bucketStart + 10}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }

  return Object.entries(buckets)
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => parseInt(a.bucket) - parseInt(b.bucket));
}

// Extended top user type for leaderboard
interface ExtendedTopUser {
  username: string;
  avatarUrl: string;
  overallRating: number;
  tier: string;
  archetypeId: string;
  totalStars?: number;
  followers?: number;
  topLanguage?: string;
}

// Analysis type from Convex DB
interface AnalysisDoc {
  username: string;
  avatarUrl: string;
  overallRating: number;
  tier: string;
  archetypeId: string;
  totalStars?: number;
  followers?: number;
  topLanguage?: string;
}

// Helper: Extract top users from sorted analyses
function extractTopUsers(analyses: AnalysisDoc[], limit = 50): ExtendedTopUser[] {
  return analyses.slice(0, limit).map((a) => ({
    username: a.username,
    avatarUrl: a.avatarUrl,
    overallRating: a.overallRating,
    tier: a.tier,
    archetypeId: a.archetypeId,
    totalStars: a.totalStars,
    followers: a.followers,
    topLanguage: a.topLanguage,
  }));
}

// Helper: Sort analyses by rating descending
function sortByRating<T extends { overallRating: number }>(analyses: T[]): T[] {
  return [...analyses].sort((a, b) => b.overallRating - a.overallRating);
}

// Internal action: Update leaderboard snapshot WITH auto-seed (called by cron)
// If analyses count < 10, automatically seed the database first
export const updateLeaderboardSnapshotWithAutoSeed = internalAction({
  handler: async (ctx: ActionCtx) => {
    // 1. Check analyses count
    const all = await ctx.runQuery(internal.analyses.getAll);

    // 2. Auto-seed if below threshold
    if (all.length < 10) {
      await ctx.runAction(internal.seed.internalQuickSeed);
    }

    // 3. Re-fetch after potential seed
    const analyses = all.length < 10
      ? await ctx.runQuery(internal.analyses.getAll)
      : all;

    if (analyses.length === 0) {
      return;
    }

    // 4. Sort by rating and extract top 50
    const sorted = sortByRating(analyses);
    const topUsers = extractTopUsers(sorted);

    // 5. Calculate distribution
    const distribution = calculateDistribution(analyses);

    // 6. Upsert snapshot
    await ctx.runMutation(internal.stats.upsertSnapshot, {
      topUsers,
      distribution,
      totalUsers: analyses.length,
    });
  },
});

// Internal action: Update leaderboard snapshot (called by cron) - legacy
export const updateLeaderboardSnapshot = internalAction({
  handler: async (ctx: ActionCtx) => {
    // 1. Fetch all analyses
    const all = await ctx.runQuery(internal.analyses.getAll);

    if (all.length === 0) {
      return; // No data yet
    }

    // 2. Sort by rating and extract top 50
    const sorted = sortByRating(all);
    const topUsers = extractTopUsers(sorted);

    // 3. Calculate distribution
    const distribution = calculateDistribution(all);

    // 4. Upsert snapshot
    await ctx.runMutation(internal.stats.upsertSnapshot, {
      topUsers,
      distribution,
      totalUsers: all.length,
    });
  },
});

// Public action: Trigger leaderboard refresh (called after analysis)
export const refreshLeaderboard = action({
  handler: async (ctx: ActionCtx) => {
    // Fetch all analyses
    const all = await ctx.runQuery(internal.analyses.getAll);

    if (all.length === 0) {
      return;
    }

    // Sort by rating and extract top 50
    const sorted = sortByRating(all);
    const topUsers = extractTopUsers(sorted);

    // Calculate distribution
    const distribution = calculateDistribution(all);

    // Upsert snapshot
    await ctx.runMutation(internal.stats.upsertSnapshot, {
      topUsers,
      distribution,
      totalUsers: all.length,
    });
  },
});

// Public action: Manual trigger for leaderboard refresh with auto-seed
// Use this to manually trigger the seed when analyses table is empty
export const triggerAutoSeed = action({
  handler: async (ctx: ActionCtx): Promise<{ seeded: boolean; message?: string; count?: number }> => {
    // Check current analyses count
    const all = await ctx.runQuery(internal.analyses.getAll);

    if (all.length < 10) {
      // Run the auto-seed
      await ctx.runAction(internal.seed.internalQuickSeed);

      // Re-fetch and update leaderboard
      const analyses = await ctx.runQuery(internal.analyses.getAll);

      if (analyses.length === 0) {
        return { seeded: false, message: "Seed failed" };
      }

      // Sort by rating and extract top 50
      const sorted = sortByRating(analyses);
      const topUsers = extractTopUsers(sorted);

      // Calculate distribution
      const distribution = calculateDistribution(analyses);

      // Upsert snapshot
      await ctx.runMutation(internal.stats.upsertSnapshot, {
        topUsers,
        distribution,
        totalUsers: analyses.length,
      });

      return { seeded: true, count: analyses.length };
    }

    return { seeded: false, message: "Already have enough data", count: all.length };
  },
});

// Internal mutation: Clear leaderboard snapshot (for resetting data)
export const clearSnapshot = internalMutation({
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("stats")
      .filter((q) => q.eq(q.field("type"), "leaderboard"))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { deleted: true };
    }
    return { deleted: false };
  },
});

// Internal mutation: Upsert leaderboard snapshot (extended)
export const upsertSnapshot = internalMutation({
  args: {
    topUsers: v.array(
      v.object({
        username: v.string(),
        avatarUrl: v.string(),
        overallRating: v.number(),
        tier: v.string(),
        archetypeId: v.string(),
        totalStars: v.optional(v.number()),
        followers: v.optional(v.number()),
        topLanguage: v.optional(v.string()),
      })
    ),
    distribution: v.array(
      v.object({
        bucket: v.string(),
        count: v.number(),
      })
    ),
    totalUsers: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for existing snapshot
    const existing = await ctx.db
      .query("stats")
      .filter((q) => q.eq(q.field("type"), "leaderboard"))
      .first();

    const data = {
      type: "leaderboard" as const,
      topUsers: args.topUsers,
      distribution: args.distribution,
      totalUsers: args.totalUsers,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("stats", data);
    }
  },
});
