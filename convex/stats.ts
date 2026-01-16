import { internalAction, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { GenericActionCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";
import type {
  DistributionBucket,
  LeaderboardSnapshot,
} from "../src/lib/leaderboard-types";

type ActionCtx = GenericActionCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

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

// Internal action: Update leaderboard snapshot (called by cron)
export const updateLeaderboardSnapshot = internalAction({
  handler: async (ctx: ActionCtx) => {
    // 1. Fetch all analyses
    const all = await ctx.runQuery(internal.analyses.getAll);

    if (all.length === 0) {
      return; // No data yet
    }

    // 2. Sort by rating and extract top 50
    const sorted = [...all].sort((a, b) => b.overallRating - a.overallRating);
    const topUsers = sorted.slice(0, 50).map((a) => ({
      username: a.username,
      avatarUrl: a.avatarUrl,
      overallRating: a.overallRating,
      tier: a.tier,
      archetypeId: a.archetypeId,
    }));

    // 3. Calculate distribution
    const distribution = calculateDistribution(all);

    // 4. Upsert snapshot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.runMutation(internal.stats.upsertSnapshot as any, {
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
    const sorted = [...all].sort((a, b) => b.overallRating - a.overallRating);
    const topUsers = sorted.slice(0, 50).map((a) => ({
      username: a.username,
      avatarUrl: a.avatarUrl,
      overallRating: a.overallRating,
      tier: a.tier,
      archetypeId: a.archetypeId,
    }));

    // Calculate distribution
    const distribution = calculateDistribution(all);

    // Upsert snapshot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.runMutation(internal.stats.upsertSnapshot as any, {
      topUsers,
      distribution,
      totalUsers: all.length,
    });
  },
});

// Internal mutation: Upsert leaderboard snapshot
export const upsertSnapshot = internalMutation({
  args: {
    topUsers: v.array(
      v.object({
        username: v.string(),
        avatarUrl: v.string(),
        overallRating: v.number(),
        tier: v.string(),
        archetypeId: v.string(),
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
  handler: async (ctx: MutationCtx, args: LeaderboardSnapshot) => {
    // Check for existing snapshot
    const existing = await ctx.db
      .query("stats")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.eq(q.field("type"), "leaderboard"))
      .first();

    const data = {
      type: "leaderboard" as const,
      topUsers: args.topUsers,
      distribution: args.distribution,
      totalUsers: args.totalUsers,
      updatedAt: Date.now(),
    };

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.db.patch(existing._id as Id<"stats">, data as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.db.insert("stats", data as any);
    }
  },
});
