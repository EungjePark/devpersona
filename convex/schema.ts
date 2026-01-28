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
    // Community boost (from community activities)
    voiceBoost: v.optional(v.number()),
    impactBoost: v.optional(v.number()),
    reachBoost: v.optional(v.number()),
    gritBoost: v.optional(v.number()),
    focusBoost: v.optional(v.number()),
    craftBoost: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_rating", ["overallRating"])
    .index("by_stars", ["totalStars"])
    .index("by_followers", ["followers"]),

  // Users table - GitHub profile cache + Auth integration
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
    // Authentication integration (Clerk)
    clerkId: v.optional(v.string()),
    isAuthenticated: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    // Community connection
    builderRankId: v.optional(v.id("builderRanks")),
    stationMemberships: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_github_id", ["githubId"])
    .index("by_total_stars", ["totalStars"])
    .index("by_followers", ["followers"])
    .index("by_clerk_id", ["clerkId"]),

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

  // ============================================
  // DevPersona V2: Community Edition Tables
  // ============================================

  // Builder Ranks - NASA-themed tier system
  builderRanks: defineTable({
    username: v.string(),
    tier: v.number(), // 0-7: Ground Control to Cosmos
    shippingPoints: v.number(), // SP: from launches, poten, wins
    communityKarma: v.number(), // CK: from reviews, votes, helping
    trustScore: v.number(), // TS: from GitHub releases, stars, npm, deployments
    tierScore: v.number(), // Calculated: (SP × 1.5) + (CK × 1.0) + (TS × 0.5)
    // Achievement tracking
    potenCount: v.number(), // Number of poten achievements
    weeklyWins: v.number(), // Weekly 1st place wins
    monthlyWins: v.number(), // Monthly 1st place wins
    updatedAt: v.number(),
    // NEW: Promotion points for community activity
    promotionPoints: v.optional(v.number()), // Earned by giving feedback to others
  })
    .index("by_username", ["username"])
    .index("by_tier", ["tier"])
    .index("by_tier_score", ["tierScore"]),

  // Launch Week projects
  launches: defineTable({
    userId: v.optional(v.id("users")),
    username: v.string(),
    title: v.string(),
    description: v.string(),
    demoUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    screenshot: v.optional(v.string()), // Storage ID or URL
    // URL metadata (from unfurl)
    ogImage: v.optional(v.string()),
    favicon: v.optional(v.string()),
    siteName: v.optional(v.string()),
    weekNumber: v.string(), // ISO week format: "2026-W04"
    voteCount: v.number(),
    weightedScore: v.number(), // Sum of weighted votes
    isPoten: v.boolean(),
    rank: v.optional(v.number()), // 1, 2, 3 for weekly winners
    status: v.string(), // "pending", "active", "closed"
    createdAt: v.number(),
    // Promotion boost & verified feedback tracking
    promotionBoost: v.optional(v.number()),
    verifiedFeedbackCount: v.optional(v.number()),
    // Category & product context
    targetAudience: v.optional(v.string()),
    problemSolved: v.optional(v.string()),
    // Product type votes: vitamin (nice-to-have), painkiller (must-have), candy (fun but low utility)
    vitaminVotes: v.optional(v.number()),
    painkillerVotes: v.optional(v.number()),
    candyVotes: v.optional(v.number()),
    // Link to validated idea (Sprint 2)
    linkedIdeaId: v.optional(v.id("ideaValidations")),
  })
    .index("by_username", ["username"])
    .index("by_week", ["weekNumber"])
    .index("by_week_score", ["weekNumber", "weightedScore"])
    .index("by_status", ["status"])
    .index("by_linked_idea", ["linkedIdeaId"])
    .index("by_poten", ["isPoten"]),

  // Votes for launches
  votes: defineTable({
    launchId: v.id("launches"),
    voterId: v.optional(v.id("users")),
    voterUsername: v.string(),
    weight: v.number(), // 1-5 based on voter tier
    createdAt: v.number(),
    // Feedback quality tracking
    feedbackText: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    visitedAt: v.optional(v.number()),
    returnedAt: v.optional(v.number()),
    // Product type vote: "vitamin" | "painkiller" | "candy"
    productTypeVote: v.optional(v.string()),
  })
    .index("by_launch", ["launchId"])
    .index("by_voter", ["voterUsername"])
    .index("by_launch_voter", ["launchId", "voterUsername"]),

  // Community Board posts
  posts: defineTable({
    authorId: v.optional(v.id("users")),
    authorUsername: v.string(),
    boardType: v.string(), // "launch_week", "hall_of_fame", "feedback", "discussion", "vip_lounge"
    title: v.string(),
    content: v.string(), // Markdown content
    upvotes: v.number(),
    downvotes: v.number(),
    isPoten: v.boolean(),
    potenAt: v.optional(v.number()), // When it became poten
    commentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_board", ["boardType"])
    .index("by_board_created", ["boardType", "createdAt"])
    .index("by_author", ["authorUsername"])
    .index("by_poten", ["isPoten"]),

  // Post votes (separate from launch votes)
  postVotes: defineTable({
    postId: v.id("posts"),
    voterUsername: v.string(),
    voteType: v.string(), // "up" or "down"
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_post_voter", ["postId", "voterUsername"]),

  // Comments on posts
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.optional(v.id("users")),
    authorUsername: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("comments")), // For threaded replies
    upvotes: v.number(),
    depth: v.number(), // Nesting level (0 = top-level)
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentId"])
    .index("by_author", ["authorUsername"]),

  // Comment votes
  commentVotes: defineTable({
    commentId: v.id("comments"),
    voterUsername: v.string(),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_comment_voter", ["commentId", "voterUsername"]),

  // Physical rewards tracking
  rewards: defineTable({
    username: v.string(),
    rewardType: v.string(), // "sticker_pack", "goodie_kit", "acrylic_trophy", "metal_trophy"
    reason: v.string(), // "weekly_poten_1st", "monthly_1st", "quarterly_1st", "yearly_top3"
    weekNumber: v.optional(v.string()),
    status: v.string(), // "eligible", "claimed", "shipped", "delivered"
    shippingAddress: v.optional(v.string()), // Encrypted or reference
    trackingNumber: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_status", ["status"]),

  // Weekly results archive (for Hall of Fame)
  weeklyResults: defineTable({
    weekNumber: v.string(), // "2026-W04"
    winners: v.array(
      v.object({
        rank: v.number(), // 1, 2, 3
        launchId: v.id("launches"),
        username: v.string(),
        title: v.string(),
        weightedScore: v.number(),
        // Visual assets for podium display
        ogImage: v.optional(v.string()),
        screenshot: v.optional(v.string()),
      })
    ),
    totalLaunches: v.number(),
    totalVotes: v.number(),
    finalizedAt: v.number(),
  }).index("by_week", ["weekNumber"]),

  // Growth stories from past winners
  growthStories: defineTable({
    launchId: v.id("launches"),
    username: v.string(),
    weekNumber: v.string(),
    // Metrics (voluntary sharing)
    mau: v.optional(v.number()),
    users: v.optional(v.number()),
    revenue: v.optional(v.string()), // "MRR $1k", "ARR $10k", etc.
    github_stars: v.optional(v.number()),
    // Story content
    updateText: v.string(),
    milestone: v.optional(v.string()), // "First 100 users", "Product Hunt launch", etc.
    createdAt: v.number(),
  })
    .index("by_launch", ["launchId"])
    .index("by_username", ["username"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // Global Tech Trends Cache (from GitHub API)
  // ============================================
  trends: defineTable({
    type: v.string(), // "repos" | "libraries" | "languages"
    data: v.any(), // Flexible JSON data
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  // ============================================
  // DevPersona V3: Community Platform Tables
  // ============================================

  // Idea Validations (Board)
  ideaValidations: defineTable({
    authorUsername: v.string(),
    // Idea content
    title: v.string(),
    problem: v.string(),
    solution: v.string(),
    targetAudience: v.string(),
    // Voting
    supportVotes: v.number(),
    opposeVotes: v.number(),
    // Discussion
    commentCount: v.number(),
    hotScore: v.number(),
    // Status
    status: v.string(), // "open" | "validated" | "launched" | "closed"
    validatedAt: v.optional(v.number()),
    // NOTE: Use launches.linkedIdeaId as single source of truth for idea-launch link
    createdAt: v.number(),
  })
    .index("by_author", ["authorUsername"])
    .index("by_status", ["status"])
    .index("by_hot", ["hotScore"])
    .index("by_created", ["createdAt"]),

  // Idea Votes
  ideaVotes: defineTable({
    ideaId: v.id("ideaValidations"),
    voterUsername: v.string(),
    voteType: v.string(), // "support" | "oppose"
    reason: v.optional(v.string()),
    weight: v.number(),
    createdAt: v.number(),
  })
    .index("by_idea", ["ideaId"])
    .index("by_idea_voter", ["ideaId", "voterUsername"])
    .index("by_voter", ["voterUsername"]),

  // Product Stations (Space Station theme)
  productStations: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    ownerUsername: v.string(),
    launchId: v.optional(v.id("launches")),
    // Branding
    logoUrl: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    // Metrics
    memberCount: v.number(),
    postCount: v.number(),
    weeklyActiveMembers: v.number(),
    // Status
    status: v.string(), // "active" | "archived"
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerUsername"])
    .index("by_launch", ["launchId"])
    .index("by_member_count", ["memberCount"]),

  // Station Roles (Custom role definitions per station)
  stationRoles: defineTable({
    stationId: v.id("productStations"),
    name: v.string(), // Role display name
    slug: v.string(), // Role identifier
    color: v.optional(v.string()), // Badge color
    permissions: v.array(v.string()), // ["view", "post", "pin", "delete", "settings", "promote", "ban"]
    priority: v.number(), // Higher = more authority (captain=100, co-captain=90, moderator=50, crew=10)
    isDefault: v.boolean(), // Default role for new members
    isSystem: v.boolean(), // System roles cannot be deleted
    createdAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_slug", ["stationId", "slug"])
    .index("by_station_default", ["stationId", "isDefault"]),

  // Station Crews (Members)
  stationCrews: defineTable({
    stationId: v.id("productStations"),
    username: v.string(),
    role: v.string(), // "crew" | "moderator" | "co-captain" | "captain" or custom role slug
    roleId: v.optional(v.id("stationRoles")), // Reference to custom role (optional for legacy)
    karmaEarnedHere: v.number(),
    joinedAt: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_user", ["username"])
    .index("by_station_user", ["stationId", "username"]),

  // Station Moderation (bans, mutes)
  stationModeration: defineTable({
    stationId: v.id("productStations"),
    targetUsername: v.string(),
    action: v.string(), // "ban" | "mute"
    reason: v.optional(v.string()),
    expiresAt: v.optional(v.number()), // null = permanent
    issuedBy: v.string(),
    issuedAt: v.number(),
    liftedBy: v.optional(v.string()),
    liftedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_user", ["stationId", "targetUsername"])
    .index("by_station_active", ["stationId", "isActive"]),

  // Station Invites
  stationInvites: defineTable({
    stationId: v.id("productStations"),
    invitedUsername: v.optional(v.string()), // null = open invite link
    inviteCode: v.string(), // Unique invite code
    invitedBy: v.string(),
    roleOnJoin: v.string(), // Role to assign when joining
    maxUses: v.optional(v.number()), // null = unlimited
    usedCount: v.number(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_station", ["stationId"])
    .index("by_code", ["inviteCode"])
    .index("by_station_active", ["stationId", "isActive"]),

  // Station Audit Log
  stationAuditLog: defineTable({
    stationId: v.id("productStations"),
    action: v.string(), // "member_join", "member_leave", "role_change", "ban", "unban", "settings_update", etc.
    actorUsername: v.string(),
    targetUsername: v.optional(v.string()),
    details: v.optional(v.string()), // JSON stringified details
    timestamp: v.number(),
  })
    .index("by_station", ["stationId"])
    .index("by_station_time", ["stationId", "timestamp"]),

  // Station Posts
  stationPosts: defineTable({
    stationId: v.id("productStations"),
    authorUsername: v.string(),
    postType: v.string(), // "update" | "feedback" | "question" | "bug" | "feature" | "discussion"
    title: v.string(),
    content: v.string(),
    isOwnerPost: v.boolean(),
    isPinned: v.boolean(),
    upvotes: v.number(),
    downvotes: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()), // For edit tracking
    isEdited: v.optional(v.boolean()),
  })
    .index("by_station", ["stationId"])
    .index("by_station_type", ["stationId", "postType"])
    .index("by_author", ["authorUsername"]),

  // Station Post Votes
  stationPostVotes: defineTable({
    postId: v.id("stationPosts"),
    voterUsername: v.string(),
    voteType: v.string(), // "up" | "down"
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_post_voter", ["postId", "voterUsername"])
    .index("by_voter", ["voterUsername"]),

  // Station Comments
  stationComments: defineTable({
    postId: v.id("stationPosts"),
    stationId: v.id("productStations"), // Denormalized for permission checks
    authorUsername: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("stationComments")), // For threaded replies
    depth: v.number(), // Nesting level (0 = top-level)
    upvotes: v.number(),
    downvotes: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isEdited: v.optional(v.boolean()),
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentId"])
    .index("by_author", ["authorUsername"])
    .index("by_station", ["stationId"]),

  // Station Comment Votes
  stationCommentVotes: defineTable({
    commentId: v.id("stationComments"),
    voterUsername: v.string(),
    voteType: v.string(), // "up" | "down"
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_comment_voter", ["commentId", "voterUsername"]),

  // Cross-Station Karma
  crossStationKarma: defineTable({
    username: v.string(),
    externalKarma: v.number(),
    uniqueStationsHelped: v.number(),
    promotionBoostEarned: v.number(),
    updatedAt: v.number(),
  }).index("by_username", ["username"]),

  // Reports (Content Moderation)
  reports: defineTable({
    reporterUsername: v.string(),
    targetType: v.string(), // "idea" | "post" | "comment" | "user"
    targetId: v.string(),
    reason: v.string(), // "spam" | "harassment" | "misinformation" | "other"
    details: v.optional(v.string()),
    status: v.string(), // "pending" | "reviewed" | "actioned" | "dismissed"
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_reporter", ["reporterUsername"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_status", ["status"]),
});
