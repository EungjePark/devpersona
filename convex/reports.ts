import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";

// ============================================
// Rate Limiting Configuration
// ============================================

const RATE_LIMITS = {
  idea_submit: { window: 86400000, max: 3 }, // 3 per day
  vote: { window: 3600000, max: 30 }, // 30 per hour
  comment: { window: 300000, max: 10 }, // 10 per 5 minutes
  post: { window: 3600000, max: 5 }, // 5 per hour
  report: { window: 3600000, max: 5 }, // 5 reports per hour
} as const;

// ============================================
// Authentication Helper
// ============================================

async function verifyAuthenticatedUser(
  ctx: MutationCtx,
  providedUsername: string
) {
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

  if (user.username.toLowerCase() !== providedUsername.toLowerCase()) {
    throw new Error("Username mismatch. You can only perform actions as yourself.");
  }

  return user;
}

// ============================================
// Report Types & Reasons
// ============================================

const REPORT_REASONS = {
  spam: "Spam or promotional content",
  harassment: "Harassment or bullying",
  misinformation: "False or misleading information",
  inappropriate: "Inappropriate or offensive content",
  impersonation: "Impersonation or fake account",
  other: "Other violation",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
export type ReportTargetType = "idea" | "post" | "comment" | "user" | "launch" | "stationPost";

// ============================================
// Queries
// ============================================

export const getReasons = query({
  handler: async () => {
    return REPORT_REASONS;
  },
});

export const getByReporter = query({
  args: { username: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { username, limit = 50 }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_reporter", (q) => q.eq("reporterUsername", username))
      .take(limit);
  },
});

export const getPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit);
  },
});

export const getByTarget = query({
  args: {
    targetType: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_target", (q) =>
        q.eq("targetType", targetType).eq("targetId", targetId)
      )
      .collect();
  },
});

export const getStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("reports").collect();

    const pending = all.filter((r) => r.status === "pending").length;
    const reviewed = all.filter((r) => r.status === "reviewed").length;
    const actioned = all.filter((r) => r.status === "actioned").length;
    const dismissed = all.filter((r) => r.status === "dismissed").length;

    // Group by reason
    const byReason = all.reduce(
      (acc, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by target type
    const byTargetType = all.reduce(
      (acc, r) => {
        acc[r.targetType] = (acc[r.targetType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: all.length,
      pending,
      reviewed,
      actioned,
      dismissed,
      byReason,
      byTargetType,
    };
  },
});

// ============================================
// Mutations
// ============================================

export const submit = mutation({
  args: {
    reporterUsername: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.reporterUsername);

    // Check rate limit
    const recentReports = await ctx.db
      .query("reports")
      .withIndex("by_reporter", (q) => q.eq("reporterUsername", args.reporterUsername))
      .collect();

    const windowStart = Date.now() - RATE_LIMITS.report.window;
    const reportsInWindow = recentReports.filter((r) => r.createdAt > windowStart);

    if (reportsInWindow.length >= RATE_LIMITS.report.max) {
      throw new Error(
        "You have submitted too many reports. Please wait before submitting more."
      );
    }

    // Check if user already reported this target
    const existingReport = await ctx.db
      .query("reports")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .collect()
      .then((reports) =>
        reports.find((r) => r.reporterUsername === args.reporterUsername)
      );

    if (existingReport) {
      throw new Error("You have already reported this content.");
    }

    // Validate reason
    if (!Object.keys(REPORT_REASONS).includes(args.reason)) {
      throw new Error("Invalid report reason.");
    }

    // Validate targetType
    const validTargetTypes: ReportTargetType[] = ["idea", "post", "comment", "user", "launch", "stationPost"];
    if (!validTargetTypes.includes(args.targetType as ReportTargetType)) {
      throw new Error("Invalid report target type.");
    }

    const reportId = await ctx.db.insert("reports", {
      reporterUsername: args.reporterUsername,
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return { reportId };
  },
});

export const review = mutation({
  args: {
    reportId: v.id("reports"),
    reviewerUsername: v.string(),
    status: v.union(
      v.literal("reviewed"),
      v.literal("actioned"),
      v.literal("dismissed")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.reviewerUsername);

    // Check if user has moderation privileges (simplified check - T4+ tier)
    const builderRank = await ctx.db
      .query("builderRanks")
      .withIndex("by_username", (q) => q.eq("username", args.reviewerUsername))
      .first();

    if (!builderRank || builderRank.tier < 4) {
      throw new Error("Insufficient privileges. Moderators must be T4+.");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found.");
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedBy: args.reviewerUsername,
      reviewedAt: Date.now(),
      details: args.notes
        ? `${report.details || ""}\n\n[Mod Note]: ${args.notes}`
        : report.details,
    });

    return { success: true };
  },
});

// ============================================
// Quality Gate Checks
// ============================================

// Minimum tier requirements for actions
const QUALITY_GATES = {
  idea_vote: { minTier: 1, minKarma: 0 },
  idea_submit: { minTier: 2, minKarma: 10 },
  idea_oppose: { minTier: 2, minKarma: 50 },
  station_post: { minTier: 1, minKarma: 0 },
  moderator_apply: { minTier: 4, minKarma: 500 },
} as const;

export const checkQualityGate = query({
  args: {
    username: v.string(),
    action: v.string(),
  },
  handler: async (ctx, { username, action }) => {
    const gate = QUALITY_GATES[action as keyof typeof QUALITY_GATES];
    if (!gate) {
      return { allowed: true, reason: "No gate for this action" };
    }

    const builderRank = await ctx.db
      .query("builderRanks")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    const tier = builderRank?.tier || 0;
    const karma = builderRank?.communityKarma || 0;

    if (tier < gate.minTier) {
      return {
        allowed: false,
        reason: `Requires tier ${gate.minTier}+ (you are T${tier})`,
        requirement: `T${gate.minTier}`,
      };
    }

    if (karma < gate.minKarma) {
      return {
        allowed: false,
        reason: `Requires ${gate.minKarma}+ karma (you have ${karma})`,
        requirement: `${gate.minKarma} karma`,
      };
    }

    return { allowed: true, tier, karma };
  },
});

// ============================================
// Rate Limit Check (export for use in other files)
// ============================================

export const checkRateLimit = query({
  args: {
    username: v.string(),
    action: v.string(),
  },
  handler: async (ctx, { username, action }) => {
    const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    if (!limit) {
      return { allowed: true, remaining: Infinity };
    }

    const windowStart = Date.now() - limit.window;

    // Count actions in window based on action type
    let count = 0;

    switch (action) {
      case "idea_submit": {
        const ideas = await ctx.db
          .query("ideaValidations")
          .withIndex("by_author", (q) => q.eq("authorUsername", username))
          .collect();
        count = ideas.filter((i) => i.createdAt > windowStart).length;
        break;
      }
      case "vote": {
        const votes = await ctx.db
          .query("ideaVotes")
          .withIndex("by_voter", (q) => q.eq("voterUsername", username))
          .collect();
        count = votes.filter((v) => v.createdAt > windowStart).length;
        break;
      }
      case "post": {
        const posts = await ctx.db
          .query("stationPosts")
          .withIndex("by_author", (q) => q.eq("authorUsername", username))
          .collect();
        count = posts.filter((p) => p.createdAt > windowStart).length;
        break;
      }
      case "report": {
        const reports = await ctx.db
          .query("reports")
          .withIndex("by_reporter", (q) => q.eq("reporterUsername", username))
          .collect();
        count = reports.filter((r) => r.createdAt > windowStart).length;
        break;
      }
      case "comment": {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_author", (q) => q.eq("authorUsername", username))
          .collect();
        count = comments.filter((c) => c.createdAt > windowStart).length;
        break;
      }
    }

    const remaining = Math.max(0, limit.max - count);
    // resetIn: time until the rate limit window resets (full window duration)
    const resetIn = remaining > 0 ? 0 : limit.window;

    return {
      allowed: remaining > 0,
      remaining,
      limit: limit.max,
      resetIn,
      windowMs: limit.window,
    };
  },
});
