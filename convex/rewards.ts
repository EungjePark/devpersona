import { mutation, query, internalMutation, internalQuery, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Authentication Helper
// ============================================

async function getAuthenticatedUsername(ctx: MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required. Please sign in.");
  }

  const clerkId = identity.subject;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();

  if (!user) {
    throw new Error("User not found. Please link your GitHub account first.");
  }

  return user.username;
}

// Reward type configurations
const REWARD_TYPES = {
  sticker_pack: {
    name: "Sticker Pack",
    description: "5 exclusive DevPersona stickers",
    icon: "🏷️",
  },
  goodie_kit: {
    name: "Goodie Kit",
    description: "Hoodie or T-shirt + sticker pack",
    icon: "👕",
  },
  acrylic_trophy: {
    name: "Acrylic Trophy",
    description: "Custom acrylic trophy with your achievement",
    icon: "🏆",
  },
  metal_trophy: {
    name: "Metal Trophy",
    description: "Premium metal trophy + ambassador status",
    icon: "🥇",
  },
} as const;

// Reason to reward type mapping
const REASON_REWARDS: Record<string, keyof typeof REWARD_TYPES> = {
  weekly_poten_1st: "sticker_pack",
  monthly_1st: "goodie_kit",
  quarterly_1st: "acrylic_trophy",
  yearly_top3: "metal_trophy",
};

// ============================================
// Queries
// ============================================

/**
 * Get all rewards for a user
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }) => {
    return await ctx.db
      .query("rewards")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .collect();
  },
});

/**
 * Get pending/eligible rewards for a user (not yet claimed)
 */
export const getEligibleRewards = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }) => {
    const rewards = await ctx.db
      .query("rewards")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .collect();

    return rewards.filter((r) => r.status === "eligible");
  },
});

/**
 * Get rewards by status (admin only)
 * SECURITY: Changed to internalQuery - prevents public access to reward data
 */
export const getByStatus = internalQuery({
  args: { status: v.string() },
  handler: async (ctx: QueryCtx, { status }) => {
    return await ctx.db
      .query("rewards")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", status))
      .collect();
  },
});

/**
 * Get a specific reward by ID
 */
export const getById = query({
  args: { rewardId: v.id("rewards") },
  handler: async (ctx: QueryCtx, { rewardId }) => {
    return await ctx.db.get(rewardId);
  },
});

/**
 * Get reward statistics for a user
 */
export const getUserStats = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }) => {
    const rewards = await ctx.db
      .query("rewards")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .collect();

    const byStatus = {
      eligible: 0,
      claimed: 0,
      shipped: 0,
      delivered: 0,
    };

    const byType = {
      sticker_pack: 0,
      goodie_kit: 0,
      acrylic_trophy: 0,
      metal_trophy: 0,
    };

    for (const reward of rewards) {
      if (reward.status in byStatus) {
        byStatus[reward.status as keyof typeof byStatus]++;
      }
      if (reward.rewardType in byType) {
        byType[reward.rewardType as keyof typeof byType]++;
      }
    }

    return {
      total: rewards.length,
      byStatus,
      byType,
    };
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Create an eligible reward for a user (called when they achieve something)
 * SECURITY: Changed to internalMutation - prevents unauthenticated reward creation
 */
export const createReward = internalMutation({
  args: {
    username: v.string(),
    reason: v.string(),
    weekNumber: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, { username, reason, weekNumber }) => {
    const rewardType = REASON_REWARDS[reason];
    if (!rewardType) {
      throw new Error(`Unknown reward reason: ${reason}`);
    }

    // Check for duplicate (same user, same reason, same week)
    const existing = await ctx.db
      .query("rewards")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .collect();

    const duplicate = existing.find(
      (r) =>
        r.reason === reason &&
        r.weekNumber === weekNumber
    );

    if (duplicate) {
      return { success: false, error: "Reward already exists for this achievement" };
    }

    const id = await ctx.db.insert("rewards", {
      username,
      rewardType,
      reason,
      weekNumber,
      status: "eligible",
      createdAt: Date.now(),
    });

    return { success: true, rewardId: id };
  },
});

/**
 * Claim a reward (user provides shipping address)
 * SECURITY: Uses authenticated user identity instead of client-supplied username
 */
export const claimReward = mutation({
  args: {
    rewardId: v.id("rewards"),
    shippingAddress: v.string(),
  },
  handler: async (ctx: MutationCtx, { rewardId, shippingAddress }) => {
    const username = await getAuthenticatedUsername(ctx);
    const reward = await ctx.db.get(rewardId);

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (reward.username !== username) {
      throw new Error("This reward does not belong to you");
    }

    if (reward.status !== "eligible") {
      throw new Error(`Reward is already ${reward.status}`);
    }

    if (!shippingAddress.trim()) {
      throw new Error("Shipping address is required");
    }

    await ctx.db.patch(rewardId, {
      status: "claimed",
      shippingAddress: shippingAddress.trim(),
      claimedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark a reward as shipped (admin only)
 * SECURITY: Changed to internalMutation - prevents public status manipulation
 */
export const markShipped = internalMutation({
  args: {
    rewardId: v.id("rewards"),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, { rewardId, trackingNumber }) => {
    const reward = await ctx.db.get(rewardId);

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (reward.status !== "claimed") {
      throw new Error("Reward must be claimed before shipping");
    }

    await ctx.db.patch(rewardId, {
      status: "shipped",
      trackingNumber,
      shippedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark a reward as delivered (admin only)
 * SECURITY: Changed to internalMutation - prevents public status manipulation
 */
export const markDelivered = internalMutation({
  args: { rewardId: v.id("rewards") },
  handler: async (ctx: MutationCtx, { rewardId }) => {
    const reward = await ctx.db.get(rewardId);

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (reward.status !== "shipped") {
      throw new Error("Reward must be shipped before marking delivered");
    }

    await ctx.db.patch(rewardId, {
      status: "delivered",
    });

    return { success: true };
  },
});

/**
 * Cancel an unclaimed reward
 * SECURITY: Uses authenticated user identity instead of client-supplied username
 */
export const cancelReward = mutation({
  args: {
    rewardId: v.id("rewards"),
  },
  handler: async (ctx: MutationCtx, { rewardId }) => {
    const username = await getAuthenticatedUsername(ctx);
    const reward = await ctx.db.get(rewardId);

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (reward.username !== username) {
      throw new Error("This reward does not belong to you");
    }

    if (reward.status !== "eligible") {
      throw new Error("Can only cancel eligible rewards");
    }

    await ctx.db.delete(rewardId);

    return { success: true };
  },
});

// Export constants for frontend use
export const REWARD_CONFIG = {
  types: REWARD_TYPES,
  reasons: REASON_REWARDS,
};
