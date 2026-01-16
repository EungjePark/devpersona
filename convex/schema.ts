import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Individual analysis results
  analyses: defineTable({
    username: v.string(),
    avatarUrl: v.string(),
    name: v.optional(v.string()),
    // Signal scores (0-100)
    grit: v.number(),
    focus: v.number(),
    craft: v.number(),
    impact: v.number(),
    voice: v.number(),
    reach: v.number(),
    // Calculated values
    overallRating: v.number(),
    tier: v.string(), // 'S' | 'A' | 'B' | 'C'
    archetypeId: v.string(),
    // NEW: Additional metrics for leaderboard
    totalStars: v.optional(v.number()),
    totalForks: v.optional(v.number()),
    followers: v.optional(v.number()),
    topLanguage: v.optional(v.string()),
    // Timestamp
    analyzedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_rating", ["overallRating"])
    .index("by_stars", ["totalStars"])
    .index("by_followers", ["followers"]),

  // Users table - GitHub profile cache
  users: defineTable({
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
    lastFetchedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_github_id", ["githubId"])
    .index("by_total_stars", ["totalStars"])
    .index("by_followers", ["followers"]),

  // Repositories table - Individual repo data
  repositories: defineTable({
    userId: v.optional(v.id("users")),
    username: v.string(),
    name: v.string(),
    fullName: v.string(), // owner/repo
    stars: v.number(),
    forks: v.number(),
    language: v.optional(v.string()),
    description: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    isFork: v.optional(v.boolean()),
    lastFetchedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_full_name", ["fullName"])
    .index("by_stars", ["stars"]),

  // Analysis history - Track changes over time
  analysisHistory: defineTable({
    username: v.string(),
    grit: v.number(),
    focus: v.number(),
    craft: v.number(),
    impact: v.number(),
    voice: v.number(),
    reach: v.number(),
    overallRating: v.number(),
    tier: v.string(),
    totalStars: v.optional(v.number()),
    analyzedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_username_date", ["username", "analyzedAt"]),

  // Global GitHub star rankings (from gitstar-ranking.com)
  globalRankings: defineTable({
    rank: v.number(),
    username: v.string(),
    stars: v.number(),
    avatarUrl: v.optional(v.string()),
    fetchedAt: v.number(),
  })
    .index("by_rank", ["rank"])
    .index("by_username", ["username"])
    .index("by_stars", ["stars"]),

  // Pre-aggregated leaderboard snapshot (traffic optimization)
  stats: defineTable({
    type: v.literal("leaderboard"),
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
        bucket: v.string(), // "0-10", "10-20", etc.
        count: v.number(),
      })
    ),
    totalUsers: v.number(),
    updatedAt: v.number(),
  }),
});
