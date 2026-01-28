import { v } from "convex/values";
import { query, internalMutation, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ============================================
// Cross-Station Karma System
// ============================================
// Users earn "external karma" by contributing to OTHER stations (not their own).
// This karma boosts their promotional power for their own launches/stations.

// Karma earned per activity (on other people's stations)
const KARMA_REWARDS = {
  post_feedback: 5, // Posting feedback
  post_bug: 8, // Bug reports are valuable
  post_feature: 5, // Feature suggestions
  post_discussion: 2, // General discussion
  helpful_mark: 10, // When your post is marked helpful
  feature_implemented: 20, // When your suggestion gets implemented
};

// Promotion boost calculation (logarithmic to prevent abuse)
// Formula: 1 + log10(karma/50), capped at 3x
// Examples: 50 karma = 1x, 100 karma ≈ 1.3x, 500 karma ≈ 2x, 5000 karma = 3x (max)
export function calculatePromotionBoost(externalKarma: number): number {
  if (externalKarma <= 0) return 1;
  return Math.min(3, 1 + Math.log10(Math.max(1, externalKarma / 50)));
}

// ============================================
// Queries
// ============================================

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const karma = await ctx.db
      .query("crossStationKarma")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (!karma) {
      return {
        username,
        externalKarma: 0,
        uniqueStationsHelped: 0,
        promotionBoostEarned: 1,
      };
    }

    return {
      ...karma,
      promotionBoostEarned: calculatePromotionBoost(karma.externalKarma),
    };
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const all = await ctx.db.query("crossStationKarma").collect();

    return all
      .sort((a, b) => b.externalKarma - a.externalKarma)
      .slice(0, limit)
      .map((k) => ({
        ...k,
        promotionBoostEarned: calculatePromotionBoost(k.externalKarma),
      }));
  },
});

// Get karma breakdown for a user (how much they've earned in each station)
export const getUserKarmaBreakdown = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    // Get all crew memberships for this user
    const memberships = await ctx.db
      .query("stationCrews")
      .withIndex("by_user", (q) => q.eq("username", username))
      .collect();

    // Get station details and karma for each
    const breakdown = await Promise.all(
      memberships.map(async (m) => {
        const station = await ctx.db.get(m.stationId);
        return {
          stationId: m.stationId,
          stationName: station?.name || "Unknown",
          stationSlug: station?.slug || "",
          role: m.role,
          karmaEarnedHere: m.karmaEarnedHere,
          isOwnStation: station?.ownerUsername === username,
        };
      })
    );

    // Filter to only external stations (not owned by user)
    const externalStations = breakdown.filter((b) => !b.isOwnStation);

    return {
      totalStations: memberships.length,
      externalStations: externalStations.length,
      totalExternalKarma: externalStations.reduce(
        (sum, s) => sum + s.karmaEarnedHere,
        0
      ),
      breakdown: breakdown.sort((a, b) => b.karmaEarnedHere - a.karmaEarnedHere),
    };
  },
});

// ============================================
// Internal Mutations (called from other files)
// ============================================

// Award karma when user posts in another person's station
export const awardPostKarma = internalMutation({
  args: {
    username: v.string(),
    stationId: v.id("productStations"),
    postType: v.string(),
  },
  handler: async (ctx, { username, stationId, postType }) => {
    const station = await ctx.db.get(stationId);
    if (!station) return { success: false, reason: "Station not found" };

    // No karma for posting in your own station
    if (station.ownerUsername === username) {
      return { success: false, reason: "Own station" };
    }

    // Calculate karma based on post type
    let karma = 0;
    switch (postType) {
      case "feedback":
        karma = KARMA_REWARDS.post_feedback;
        break;
      case "bug":
        karma = KARMA_REWARDS.post_bug;
        break;
      case "feature":
        karma = KARMA_REWARDS.post_feature;
        break;
      case "discussion":
      case "question":
        karma = KARMA_REWARDS.post_discussion;
        break;
      default:
        karma = 2;
    }

    // Update crew membership karma
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", stationId).eq("username", username)
      )
      .first();

    // Only award karma if user has an active membership (consistency)
    if (!membership) {
      return { success: false, reason: "No membership" };
    }

    await ctx.db.patch(membership._id, {
      karmaEarnedHere: membership.karmaEarnedHere + karma,
    });

    // Update global cross-station karma
    await updateCrossKarma(ctx, username, karma, stationId);

    return { success: true, karma };
  },
});

// Award karma when user's post is marked helpful
export const awardHelpfulKarma = internalMutation({
  args: {
    username: v.string(),
    stationId: v.id("productStations"),
  },
  handler: async (ctx, { username, stationId }) => {
    const station = await ctx.db.get(stationId);
    if (!station) return { success: false, reason: "Station not found" };

    // No karma for own station
    if (station.ownerUsername === username) {
      return { success: false, reason: "Own station" };
    }

    const karma = KARMA_REWARDS.helpful_mark;

    // Update crew membership karma
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", stationId).eq("username", username)
      )
      .first();

    // Only award karma if user has an active membership (consistency)
    if (!membership) {
      return { success: false, reason: "No membership" };
    }

    await ctx.db.patch(membership._id, {
      karmaEarnedHere: membership.karmaEarnedHere + karma,
    });

    // Update global cross-station karma
    await updateCrossKarma(ctx, username, karma, stationId);

    return { success: true, karma };
  },
});

// Award karma when feature suggestion gets implemented
export const awardFeatureImplementedKarma = internalMutation({
  args: {
    username: v.string(),
    stationId: v.id("productStations"),
  },
  handler: async (ctx, { username, stationId }) => {
    const station = await ctx.db.get(stationId);
    if (!station) return { success: false, reason: "Station not found" };

    if (station.ownerUsername === username) {
      return { success: false, reason: "Own station" };
    }

    const karma = KARMA_REWARDS.feature_implemented;

    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", stationId).eq("username", username)
      )
      .first();

    // Only award karma if user has an active membership (consistency)
    if (!membership) {
      return { success: false, reason: "No membership" };
    }

    await ctx.db.patch(membership._id, {
      karmaEarnedHere: membership.karmaEarnedHere + karma,
    });

    await updateCrossKarma(ctx, username, karma, stationId);

    return { success: true, karma };
  },
});

// ============================================
// Helper Functions
// ============================================

async function updateCrossKarma(
  ctx: MutationCtx,
  username: string,
  karmaToAdd: number,
  stationId: Id<"productStations">
) {
  const existing = await ctx.db
    .query("crossStationKarma")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();

  if (existing) {
    // Count unique stations where user has earned karma (excluding own)
    const allMemberships = await ctx.db
      .query("stationCrews")
      .withIndex("by_user", (q) => q.eq("username", username))
      .collect();

    let uniqueStationsCount = 0;
    for (const m of allMemberships) {
      if (m.karmaEarnedHere > 0 || m.stationId === stationId) {
        const station = await ctx.db.get(m.stationId);
        if (station && station.ownerUsername !== username) {
          uniqueStationsCount++;
        }
      }
    }

    const newKarma = existing.externalKarma + karmaToAdd;
    await ctx.db.patch(existing._id, {
      externalKarma: newKarma,
      uniqueStationsHelped: uniqueStationsCount,
      promotionBoostEarned: calculatePromotionBoost(newKarma),
      updatedAt: Date.now(),
    });
  } else {
    // Create new record
    const newKarma = karmaToAdd;
    await ctx.db.insert("crossStationKarma", {
      username,
      externalKarma: newKarma,
      uniqueStationsHelped: 1,
      promotionBoostEarned: calculatePromotionBoost(newKarma),
      updatedAt: Date.now(),
    });
  }

  // Also update builder rank's promotion points
  const builderRank = await ctx.db
    .query("builderRanks")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();

  if (builderRank) {
    await ctx.db.patch(builderRank._id, {
      promotionPoints: (builderRank.promotionPoints || 0) + karmaToAdd,
      communityKarma: (builderRank.communityKarma ?? 0) + karmaToAdd,
      updatedAt: Date.now(),
    });
  }
}

// ============================================
// Public Mutation (for testing/admin)
// ============================================

// SECURITY: Changed to internalMutation - prevents public manipulation of karma
export const recalculateUserKarma = internalMutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    // Get all memberships
    const memberships = await ctx.db
      .query("stationCrews")
      .withIndex("by_user", (q) => q.eq("username", username))
      .collect();

    let totalExternalKarma = 0;
    let uniqueStations = 0;

    for (const m of memberships) {
      const station = await ctx.db.get(m.stationId);
      if (station && station.ownerUsername !== username) {
        totalExternalKarma += m.karmaEarnedHere;
        if (m.karmaEarnedHere > 0) {
          uniqueStations++;
        }
      }
    }

    const existing = await ctx.db
      .query("crossStationKarma")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        externalKarma: totalExternalKarma,
        uniqueStationsHelped: uniqueStations,
        promotionBoostEarned: calculatePromotionBoost(totalExternalKarma),
        updatedAt: Date.now(),
      });
    } else if (totalExternalKarma > 0) {
      await ctx.db.insert("crossStationKarma", {
        username,
        externalKarma: totalExternalKarma,
        uniqueStationsHelped: uniqueStations,
        promotionBoostEarned: calculatePromotionBoost(totalExternalKarma),
        updatedAt: Date.now(),
      });
    }

    return {
      totalExternalKarma,
      uniqueStations,
      promotionBoost: calculatePromotionBoost(totalExternalKarma),
    };
  },
});
