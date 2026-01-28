import { internalMutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// Repository data args
const repoArgs = {
  userId: v.optional(v.id("users")),
  username: v.string(),
  name: v.string(),
  fullName: v.string(),
  stars: v.number(),
  forks: v.number(),
  language: v.optional(v.string()),
  description: v.optional(v.string()),
  isArchived: v.optional(v.boolean()),
  isFork: v.optional(v.boolean()),
};

type RepoArgs = {
  userId?: Id<"users">;
  username: string;
  name: string;
  fullName: string;
  stars: number;
  forks: number;
  language?: string;
  description?: string;
  isArchived?: boolean;
  isFork?: boolean;
};

// Internal Mutation: Upsert repository
// SECURITY: Changed to internalMutation - only callable from server-side
export const upsertRepository = internalMutation({
  args: repoArgs,
  handler: async (ctx: MutationCtx, args: RepoArgs) => {
    const existing = await ctx.db
      .query("repositories")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_full_name", (q: any) => q.eq("fullName", args.fullName))
      .first();

    const data = {
      ...args,
      lastFetchedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id as Id<"repositories">, data);
      return existing._id as Id<"repositories">;
    } else {
      return await ctx.db.insert("repositories", data);
    }
  },
});

// Internal Mutation: Bulk upsert repositories for a user
// SECURITY: Changed to internalMutation - only callable from server-side
export const bulkUpsertRepositories = internalMutation({
  args: {
    username: v.string(),
    userId: v.optional(v.id("users")),
    repos: v.array(
      v.object({
        name: v.string(),
        fullName: v.string(),
        stars: v.number(),
        forks: v.number(),
        language: v.optional(v.string()),
        description: v.optional(v.string()),
        isArchived: v.optional(v.boolean()),
        isFork: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx: MutationCtx, { username, userId, repos }) => {
    const results: Id<"repositories">[] = [];

    for (const repo of repos) {
      const existing = await ctx.db
        .query("repositories")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_full_name", (q: any) => q.eq("fullName", repo.fullName))
        .first();

      const data = {
        ...repo,
        username,
        userId,
        lastFetchedAt: Date.now(),
      };

      if (existing) {
        await ctx.db.patch(existing._id as Id<"repositories">, data);
        results.push(existing._id as Id<"repositories">);
      } else {
        const id = await ctx.db.insert("repositories", data);
        results.push(id);
      }
    }

    return results;
  },
});

// Query: Get repositories by username
export const getByUsername = query({
  args: { username: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { username, limit = 100 }: { username: string; limit?: number }) => {
    return await ctx.db
      .query("repositories")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .take(limit);
  },
});

// Query: Get top repositories by username (sorted by stars)
export const getTopByUsername = query({
  args: { username: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { username, limit = 5 }: { username: string; limit?: number }) => {
    const repos = await ctx.db
      .query("repositories")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .collect();

    // Sort by stars descending and take top N
    return repos
      .sort((a, b) => b.stars - a.stars)
      .slice(0, limit);
  },
});

// Query: Get repository by full name
export const getByFullName = query({
  args: { fullName: v.string() },
  handler: async (ctx: QueryCtx, { fullName }: { fullName: string }) => {
    return await ctx.db
      .query("repositories")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_full_name", (q: any) => q.eq("fullName", fullName))
      .first();
  },
});

// Query: Get global top repositories by stars
export const getTopByStars = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 50 }: { limit?: number }) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_stars")
      .order("desc")
      .take(limit);
  },
});

// Internal query: Get all repositories for aggregation
export const getAll = internalQuery({
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query("repositories").collect();
  },
});
