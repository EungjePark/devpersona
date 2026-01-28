import { internalMutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// User data args for upsert
const userArgs = {
  githubId: v.number(),
  username: v.string(),
  avatarUrl: v.string(),
  name: v.optional(v.string()),
  bio: v.optional(v.string()),
  followers: v.number(),
  following: v.optional(v.number()),
  publicRepos: v.number(),
  totalStars: v.number(),
  totalForks: v.number(),
};

type UserArgs = {
  githubId: number;
  username: string;
  avatarUrl: string;
  name?: string;
  bio?: string;
  followers: number;
  following?: number;
  publicRepos: number;
  totalStars: number;
  totalForks: number;
};

// Internal Mutation: Save/update user (upsert by username)
// SECURITY: Changed to internalMutation - only callable from server-side
export const upsertUser = internalMutation({
  args: userArgs,
  handler: async (ctx: MutationCtx, args: UserArgs) => {
    const existing = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", args.username))
      .first();

    const data = {
      ...args,
      lastFetchedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id as Id<"users">, data);
      return existing._id as Id<"users">;
    } else {
      return await ctx.db.insert("users", data);
    }
  },
});

// Query: Get user by username (public)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }: { username: string }) => {
    return await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();
  },
});

// Query: Get user by GitHub ID
export const getByGithubId = query({
  args: { githubId: v.number() },
  handler: async (ctx: QueryCtx, { githubId }: { githubId: number }) => {
    return await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_github_id", (q: any) => q.eq("githubId", githubId))
      .first();
  },
});

// Query: Get top users by stars (public - for star leaderboard)
export const getTopByStars = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 50 }: { limit?: number }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_total_stars")
      .order("desc")
      .take(limit);
  },
});

// Query: Get top users by followers (public - for follower leaderboard)
export const getTopByFollowers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 50 }: { limit?: number }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_followers")
      .order("desc")
      .take(limit);
  },
});

// Internal query: Get all users for aggregation
export const getAll = internalQuery({
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query("users").collect();
  },
});

// Query: Get user's star rank
export const getStarRank = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }: { username: string }) => {
    const user = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!user) {
      return { rank: null, total: 0, percentile: null };
    }

    // Count users with more stars
    const allUsers = await ctx.db.query("users").collect();
    const sortedByStars = allUsers.sort((a, b) => b.totalStars - a.totalStars);
    const rank = sortedByStars.findIndex(u => u.username === username) + 1;
    const total = sortedByStars.length;
    const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;

    return { rank, total, percentile };
  },
});

// ============================================
// Authentication Functions (Clerk Integration)
// ============================================

// Query: Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx: QueryCtx, { clerkId }: { clerkId: string }) => {
    return await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .first();
  },
});

// Internal Mutation: Link Clerk user to existing GitHub user
export const linkClerkUser = internalMutation({
  args: {
    username: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx: MutationCtx, { username, clerkId }) => {
    // Find existing user by username
    const existing = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!existing) {
      throw new Error(`User with username ${username} not found`);
    }

    // Check if Clerk ID is already linked to another user
    const existingClerkUser = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .first();

    if (existingClerkUser && existingClerkUser._id !== existing._id) {
      throw new Error("This Clerk account is already linked to another user");
    }

    // Update user with Clerk ID
    await ctx.db.patch(existing._id, {
      clerkId,
      isAuthenticated: true,
      lastLoginAt: Date.now(),
    });

    // Create builderRank if not exists
    const existingRank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!existingRank) {
      const builderRankId = await ctx.db.insert("builderRanks", {
        username,
        tier: 1, // Start as Cadet
        shippingPoints: 0,
        communityKarma: 0,
        trustScore: 0,
        tierScore: 0,
        potenCount: 0,
        weeklyWins: 0,
        monthlyWins: 0,
        updatedAt: Date.now(),
      });

      // Link builderRank to user
      await ctx.db.patch(existing._id, { builderRankId });
    }

    return existing._id;
  },
});

// Query: Get authenticated user profile (combines user + builderRank)
export const getAuthenticatedUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx: QueryCtx, { clerkId }: { clerkId: string }) => {
    const user = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return null;
    }

    // Get builder rank if exists
    let builderRank = null;
    if (user.builderRankId) {
      builderRank = await ctx.db.get(user.builderRankId);
    } else {
      // Fallback: query by username
      builderRank = await ctx.db
        .query("builderRanks")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_username", (q: any) => q.eq("username", user.username))
        .first();
    }

    // Get latest analysis (sorted by analyzedAt desc to get most recent)
    const analyses = await ctx.db
      .query("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", user.username))
      .collect();

    // Sort by analyzedAt descending and take the first (most recent)
    analyses.sort((a, b) => b.analyzedAt - a.analyzedAt);
    const analysis = analyses[0] ?? null;

    return {
      user,
      builderRank,
      analysis,
    };
  },
});

// Internal Mutation: Update user login timestamp
export const updateLoginTimestamp = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx: MutationCtx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }
  },
});
