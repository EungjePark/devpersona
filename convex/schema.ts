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
    // Timestamp
    analyzedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_rating", ["overallRating"]),

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
