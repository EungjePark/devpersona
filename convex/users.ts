import { mutation, query, internalQuery } from "./_generated/server";
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

// Mutation: Save/update user (upsert by username)
export const upsertUser = mutation({
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
