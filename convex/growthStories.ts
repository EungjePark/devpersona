import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// Get recent growth stories
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 10 }) => {
    return await ctx.db
      .query("growthStories")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

// Get stories by launch
export const getByLaunch = query({
  args: { launchId: v.id("launches") },
  handler: async (ctx: QueryCtx, { launchId }) => {
    return await ctx.db
      .query("growthStories")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_launch", (q: any) => q.eq("launchId", launchId))
      .collect();
  },
});

// Get stories by user
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }) => {
    return await ctx.db
      .query("growthStories")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .collect();
  },
});

// Submit a growth story update
export const submitStory = mutation({
  args: {
    launchId: v.id("launches"),
    username: v.string(),
    updateText: v.string(),
    mau: v.optional(v.number()),
    users: v.optional(v.number()),
    revenue: v.optional(v.string()),
    github_stars: v.optional(v.number()),
    milestone: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { launchId, username, updateText, mau, users, revenue, github_stars, milestone } = args;

    // Verify launch exists and belongs to user
    const launch = await ctx.db.get(launchId);
    if (!launch) {
      throw new Error("Launch not found.");
    }
    if (launch.username !== username) {
      throw new Error("You can only submit stories for your own launches.");
    }

    // Create story
    return await ctx.db.insert("growthStories", {
      launchId,
      username,
      weekNumber: launch.weekNumber,
      updateText: updateText.trim(),
      mau,
      users,
      revenue,
      github_stars,
      milestone,
      createdAt: Date.now(),
    });
  },
});
