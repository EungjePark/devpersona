import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

// Type-safe vote and status types
export type VoteType = "support" | "oppose";
export type IdeaStatus = "open" | "validated" | "launched" | "closed";

// Convex validators for vote and status types
const voteTypeValidator = v.union(v.literal("support"), v.literal("oppose"));
const ideaStatusValidator = v.union(
  v.literal("open"),
  v.literal("validated"),
  v.literal("launched"),
  v.literal("closed")
);

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// ============================================
// Authentication Helper
// ============================================

/**
 * Verify that the authenticated user matches the provided username.
 * Uses Clerk identity to get the user's clerkId, then cross-references
 * with the users table to get the actual GitHub username.
 */
async function verifyAuthenticatedUser(
  ctx: MutationCtx,
  providedUsername: string
): Promise<{ isValid: boolean; error?: string }> {
  // Get the authenticated identity from Clerk
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return { isValid: false, error: "Authentication required. Please sign in." };
  }

  // The identity.subject is the Clerk user ID
  const clerkId = identity.subject;

  // Look up the user in our database by clerkId
  const user = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();

  if (!user) {
    return {
      isValid: false,
      error: "User account not found. Please complete your profile setup."
    };
  }

  // Verify the provided username matches the authenticated user's username
  if (user.username.toLowerCase() !== providedUsername.toLowerCase()) {
    return {
      isValid: false,
      error: "Username mismatch. You can only perform actions as yourself."
    };
  }

  return { isValid: true };
}

// Validation threshold for "Validated" badge
const VALIDATION_THRESHOLDS = {
  minNetSupport: 20,      // Minimum (support - oppose) votes
  minTotalVoters: 10,     // Minimum total voters
  minSupportRatio: 0.6,   // Minimum 60% support
  minComments: 5,         // Minimum comments for discussion
};

// CK (Community Karma) points
const CK_POINTS = {
  IDEA_SUBMIT: 5,
  VOTE: 1,
  VOTE_WITH_REASON: 3,
  COMMENT: 2,
  IDEA_VALIDATED: 30,
  IDEA_LAUNCHED: 20,
};

// Check if idea meets validation criteria
function isValidated(idea: {
  supportVotes: number;
  opposeVotes: number;
  commentCount: number;
}): boolean {
  const netSupport = idea.supportVotes - idea.opposeVotes;
  const totalVotes = idea.supportVotes + idea.opposeVotes;
  const supportRatio = idea.supportVotes / Math.max(1, totalVotes);

  return (
    netSupport >= VALIDATION_THRESHOLDS.minNetSupport &&
    totalVotes >= VALIDATION_THRESHOLDS.minTotalVoters &&
    supportRatio >= VALIDATION_THRESHOLDS.minSupportRatio &&
    idea.commentCount >= VALIDATION_THRESHOLDS.minComments
  );
}

// ============================================
// Hot Score Algorithm (Enhanced HN/Reddit Style)
// ============================================

/**
 * Hot Score Algorithm Configuration
 *
 * The hot score determines content visibility and ranking.
 * It balances engagement quality with time decay to surface
 * both popular and fresh content.
 *
 * ALGORITHM BREAKDOWN:
 * -------------------
 * score = (netVotes + commentWeight) * freshBoost / (hoursAge + offset)^gravity
 *
 * FACTORS THAT INFLUENCE VISIBILITY:
 * 1. Net Votes (support - oppose): Core engagement signal
 * 2. Comments: Weighted contribution (discussions indicate interest)
 * 3. Age: Time decay ensures fresh content can surface
 * 4. Fresh Boost: New ideas get temporary visibility advantage
 *
 * TUNING GUIDE:
 * - Increase GRAVITY to make content decay faster (more churn)
 * - Decrease GRAVITY to let popular content stay visible longer
 * - Increase COMMENT_WEIGHT to favor discussion over raw votes
 * - Adjust FRESH_BOOST_HOURS/MULTIPLIER to control new content advantage
 *
 * FUTURE IMPROVEMENTS:
 * - Add engagement velocity factor (votes per hour) - see recommendations.ts
 * - Weight comments by quality (upvotes, length, author reputation)
 * - Consider voter reputation in weighted scoring
 * - A/B test different gravity values
 */
const HOT_SCORE_CONFIG = {
  // Time decay exponent - higher means faster decay
  // 1.8 is similar to HN, Reddit uses ~1.5
  gravity: 1.8,

  // Base offset to smooth early-hour volatility
  // Prevents divide-by-zero and reduces initial score spikes
  ageOffset: 2,

  // How much each comment contributes to score
  // 0.5 means 2 comments = 1 vote worth of score
  commentWeight: 0.5,

  // New ideas within this window get boosted
  freshBoostHours: 6,

  // Multiplier for fresh idea boost (1.5 = 50% increase)
  freshBoostMultiplier: 1.5,
};

/**
 * Calculate hot score for content ranking.
 *
 * @param supportVotes - Number of support votes
 * @param opposeVotes - Number of oppose votes
 * @param commentCount - Number of comments
 * @param createdAt - Timestamp when idea was created
 * @returns Hot score value (higher = more visible)
 */
function calculateHotScore(
  supportVotes: number,
  opposeVotes: number,
  commentCount: number,
  createdAt: number
): number {
  const { gravity, ageOffset, commentWeight, freshBoostHours, freshBoostMultiplier } =
    HOT_SCORE_CONFIG;

  // Base score: net votes + weighted comments
  const baseScore = supportVotes - opposeVotes + commentCount * commentWeight;

  // Time-based calculations
  const now = Date.now();
  const hoursAge = (now - createdAt) / (1000 * 60 * 60);

  // Fresh content boost: new ideas get temporary visibility advantage
  // This helps quality content get initial exposure
  const isFresh = hoursAge <= freshBoostHours;
  const freshBoost = isFresh ? freshBoostMultiplier : 1;

  // Final calculation with time decay
  // Score decays exponentially over time
  const adjustedScore = baseScore * freshBoost;
  const hotScore = adjustedScore / Math.pow(hoursAge + ageOffset, gravity);

  return hotScore;
}

// ============================================
// Queries
// ============================================

// Sort options validator
const sortByValidator = v.union(
  v.literal("hot"),
  v.literal("new"),
  v.literal("top")
);

// Get all ideas by status (paginated)
export const getByStatus = query({
  args: {
    status: v.optional(ideaStatusValidator),
    limit: v.optional(v.number()),
    sortBy: v.optional(sortByValidator),
  },
  handler: async (ctx: QueryCtx, { status, limit = 20, sortBy = "hot" }) => {
    let ideas;

    if (status) {
      ideas = await ctx.db
        .query("ideaValidations")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_status", (q: any) => q.eq("status", status))
        .collect();
    } else {
      ideas = await ctx.db.query("ideaValidations").collect();
    }

    // Sort based on sortBy
    if (sortBy === "hot") {
      ideas.sort((a, b) => b.hotScore - a.hotScore);
    } else if (sortBy === "new") {
      ideas.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "top") {
      ideas.sort((a, b) => (b.supportVotes - b.opposeVotes) - (a.supportVotes - a.opposeVotes));
    }

    return ideas.slice(0, limit);
  },
});

// Get single idea by ID
export const getById = query({
  args: { ideaId: v.id("ideaValidations") },
  handler: async (ctx: QueryCtx, { ideaId }) => {
    return await ctx.db.get(ideaId);
  },
});

// Get ideas by author
export const getByAuthor = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }) => {
    return await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_author", (q: any) => q.eq("authorUsername", username))
      .collect();
  },
});

// Get user's vote on an idea
export const getUserVote = query({
  args: {
    ideaId: v.id("ideaValidations"),
    username: v.string(),
  },
  handler: async (ctx: QueryCtx, { ideaId, username }) => {
    return await ctx.db
      .query("ideaVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_idea_voter", (q: any) =>
        q.eq("ideaId", ideaId).eq("voterUsername", username)
      )
      .first();
  },
});

// Get all votes for an idea
export const getVotesForIdea = query({
  args: { ideaId: v.id("ideaValidations") },
  handler: async (ctx: QueryCtx, { ideaId }) => {
    return await ctx.db
      .query("ideaVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_idea", (q: any) => q.eq("ideaId", ideaId))
      .collect();
  },
});

// Batch get user's votes for multiple ideas (optimized for list views)
export const getUserVotesForIdeas = query({
  args: {
    ideaIds: v.array(v.id("ideaValidations")),
    username: v.string(),
  },
  handler: async (ctx: QueryCtx, { ideaIds, username }) => {
    // Fetch all votes by this user
    const userVotes = await ctx.db
      .query("ideaVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_voter", (q: any) => q.eq("voterUsername", username))
      .collect();

    // Filter to only votes for the requested ideas and create a map
    const voteMap: Record<string, { voteType: VoteType }> = {};
    const ideaIdSet = new Set(ideaIds.map((id) => id.toString()));

    for (const vote of userVotes) {
      if (ideaIdSet.has(vote.ideaId.toString())) {
        voteMap[vote.ideaId.toString()] = {
          voteType: vote.voteType as VoteType,
        };
      }
    }

    return voteMap;
  },
});

// Get validated ideas (for linking to launches)
export const getValidatedIdeas = query({
  args: { username: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, { username }) => {
    let ideas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", "validated"))
      .collect();

    if (username) {
      ideas = ideas.filter(idea => idea.authorUsername === username);
    }

    return ideas;
  },
});

// ============================================
// Mutations
// ============================================

// Submit a new idea
export const submitIdea = mutation({
  args: {
    authorUsername: v.string(),
    title: v.string(),
    problem: v.string(),
    solution: v.string(),
    targetAudience: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    // SECURITY: Verify the authenticated user matches the provided username
    const authResult = await verifyAuthenticatedUser(ctx, args.authorUsername);
    if (!authResult.isValid) {
      throw new Error(authResult.error || "Authentication failed");
    }

    const now = Date.now();

    const ideaId = await ctx.db.insert("ideaValidations", {
      authorUsername: args.authorUsername,
      title: args.title,
      problem: args.problem,
      solution: args.solution,
      targetAudience: args.targetAudience,
      supportVotes: 0,
      opposeVotes: 0,
      commentCount: 0,
      hotScore: calculateHotScore(0, 0, 0, now),
      status: "open",
      createdAt: now,
    });

    // Award CK points for submitting idea
    await awardCommunityKarma(ctx, args.authorUsername, CK_POINTS.IDEA_SUBMIT);

    return ideaId;
  },
});

// Vote on an idea (support or oppose)
export const voteOnIdea = mutation({
  args: {
    ideaId: v.id("ideaValidations"),
    voterUsername: v.string(),
    voteType: voteTypeValidator,
    reason: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, { ideaId, voterUsername, voteType, reason }) => {
    // SECURITY: Verify the authenticated user matches the provided username
    const authResult = await verifyAuthenticatedUser(ctx, voterUsername);
    if (!authResult.isValid) {
      throw new Error(authResult.error || "Authentication failed");
    }

    const idea = await ctx.db.get(ideaId);
    if (!idea) throw new Error("Idea not found");
    if (idea.status !== "open" && idea.status !== "validated") {
      throw new Error("Cannot vote on closed ideas");
    }

    // Check for existing vote
    const existingVote = await ctx.db
      .query("ideaVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_idea_voter", (q: any) =>
        q.eq("ideaId", ideaId).eq("voterUsername", voterUsername)
      )
      .first();

    if (existingVote) {
      // Cannot vote the same way twice
      if (existingVote.voteType === voteType) {
        throw new Error("Already voted with this type");
      }

      // Update vote record
      await ctx.db.patch(existingVote._id, {
        voteType,
        reason,
        createdAt: Date.now(),
      });

      // Update idea vote counts - swap votes based on new vote type
      const weight = existingVote.weight;
      const isChangingToSupport = voteType === "support";
      const newSupportVotes = idea.supportVotes + (isChangingToSupport ? weight : -weight);
      const newOpposeVotes = idea.opposeVotes + (isChangingToSupport ? -weight : weight);

      await ctx.db.patch(ideaId, {
        supportVotes: newSupportVotes,
        opposeVotes: newOpposeVotes,
        hotScore: calculateHotScore(newSupportVotes, newOpposeVotes, idea.commentCount, idea.createdAt),
      });
    } else {
      // Get voter's tier weight (from builderRank)
      const builderRank = await ctx.db
        .query("builderRanks")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_username", (q: any) => q.eq("username", voterUsername))
        .first();

      const weight = builderRank ? Math.max(1, builderRank.tier) : 1;

      // Create new vote
      await ctx.db.insert("ideaVotes", {
        ideaId,
        voterUsername,
        voteType,
        reason,
        weight,
        createdAt: Date.now(),
      });

      // Update idea vote counts
      const isSupport = voteType === "support";
      const newSupportVotes = idea.supportVotes + (isSupport ? weight : 0);
      const newOpposeVotes = idea.opposeVotes + (isSupport ? 0 : weight);

      await ctx.db.patch(ideaId, {
        supportVotes: newSupportVotes,
        opposeVotes: newOpposeVotes,
        hotScore: calculateHotScore(newSupportVotes, newOpposeVotes, idea.commentCount, idea.createdAt),
      });

      // Award CK points
      const points = reason ? CK_POINTS.VOTE_WITH_REASON : CK_POINTS.VOTE;
      await awardCommunityKarma(ctx, voterUsername, points);

      // Check if idea should be validated
      const updatedIdea = await ctx.db.get(ideaId);
      if (updatedIdea && updatedIdea.status === "open" && isValidated(updatedIdea)) {
        await ctx.db.patch(ideaId, {
          status: "validated",
          validatedAt: Date.now(),
        });

        // Award bonus CK to author
        await awardCommunityKarma(ctx, idea.authorUsername, CK_POINTS.IDEA_VALIDATED);
      }
    }

    return { success: true };
  },
});

// Remove vote
export const removeVote = mutation({
  args: {
    ideaId: v.id("ideaValidations"),
    voterUsername: v.string(),
  },
  handler: async (ctx: MutationCtx, { ideaId, voterUsername }) => {
    // SECURITY: Verify the authenticated user matches the provided username
    const authResult = await verifyAuthenticatedUser(ctx, voterUsername);
    if (!authResult.isValid) {
      throw new Error(authResult.error || "Authentication failed");
    }

    const idea = await ctx.db.get(ideaId);
    if (!idea) throw new Error("Idea not found");

    const existingVote = await ctx.db
      .query("ideaVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_idea_voter", (q: any) =>
        q.eq("ideaId", ideaId).eq("voterUsername", voterUsername)
      )
      .first();

    if (!existingVote) {
      throw new Error("Vote not found");
    }

    // Remove vote
    await ctx.db.delete(existingVote._id);

    // Update idea counts
    const wasSupport = existingVote.voteType === "support";
    const newSupportVotes = Math.max(0, idea.supportVotes - (wasSupport ? existingVote.weight : 0));
    const newOpposeVotes = Math.max(0, idea.opposeVotes - (wasSupport ? 0 : existingVote.weight));

    await ctx.db.patch(ideaId, {
      supportVotes: newSupportVotes,
      opposeVotes: newOpposeVotes,
      hotScore: calculateHotScore(newSupportVotes, newOpposeVotes, idea.commentCount, idea.createdAt),
    });

    return { success: true };
  },
});

// Increment comment count (called from comments module)
export const incrementCommentCount = internalMutation({
  args: { ideaId: v.id("ideaValidations") },
  handler: async (ctx: MutationCtx, { ideaId }) => {
    const idea = await ctx.db.get(ideaId);
    if (!idea) return;

    const newCommentCount = idea.commentCount + 1;
    const newHotScore = calculateHotScore(idea.supportVotes, idea.opposeVotes, newCommentCount, idea.createdAt);

    await ctx.db.patch(ideaId, {
      commentCount: newCommentCount,
      hotScore: newHotScore,
    });

    // Check if idea should be validated
    if (idea.status === "open" && isValidated({ ...idea, commentCount: newCommentCount })) {
      await ctx.db.patch(ideaId, { status: "validated", validatedAt: Date.now() });
      await awardCommunityKarma(ctx, idea.authorUsername, CK_POINTS.IDEA_VALIDATED);
    }
  },
});

// Link validated idea to launch
export const linkToLaunch = mutation({
  args: {
    ideaId: v.id("ideaValidations"),
    launchId: v.id("launches"),
    username: v.string(),
  },
  handler: async (ctx: MutationCtx, { ideaId, launchId: _launchId, username }) => {
    // SECURITY: Verify the authenticated user matches the provided username
    const authResult = await verifyAuthenticatedUser(ctx, username);
    if (!authResult.isValid) {
      throw new Error(authResult.error || "Authentication failed");
    }

    const idea = await ctx.db.get(ideaId);
    if (!idea) throw new Error("Idea not found");
    if (idea.authorUsername !== username) {
      throw new Error("Only the author can link their idea to a launch");
    }
    if (idea.status !== "validated") {
      throw new Error("Only validated ideas can be linked to launches");
    }

    await ctx.db.patch(ideaId, {
      status: "launched",
    });

    // Award bonus CK
    await awardCommunityKarma(ctx, username, CK_POINTS.IDEA_LAUNCHED);

    return { success: true };
  },
});

// Close an idea (author only)
export const closeIdea = mutation({
  args: {
    ideaId: v.id("ideaValidations"),
    username: v.string(),
  },
  handler: async (ctx: MutationCtx, { ideaId, username }) => {
    // SECURITY: Verify the authenticated user matches the provided username
    const authResult = await verifyAuthenticatedUser(ctx, username);
    if (!authResult.isValid) {
      throw new Error(authResult.error || "Authentication failed");
    }

    const idea = await ctx.db.get(ideaId);
    if (!idea) throw new Error("Idea not found");
    if (idea.authorUsername !== username) {
      throw new Error("Only the author can close their idea");
    }

    await ctx.db.patch(ideaId, { status: "closed" });

    return { success: true };
  },
});

// ============================================
// Helper Functions
// ============================================

// Award community karma to a user
async function awardCommunityKarma(
  ctx: MutationCtx,
  username: string,
  points: number
) {
  const builderRank = await ctx.db
    .query("builderRanks")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_username", (q: any) => q.eq("username", username))
    .first();

  if (builderRank) {
    const newKarma = builderRank.communityKarma + points;
    const newTierScore =
      builderRank.shippingPoints * 1.5 +
      newKarma * 1.0 +
      builderRank.trustScore * 0.5;

    await ctx.db.patch(builderRank._id, {
      communityKarma: newKarma,
      tierScore: newTierScore,
      updatedAt: Date.now(),
    });
  }
}

// Recalculate hot scores (cron job)
export const recalculateHotScores = internalMutation({
  handler: async (ctx: MutationCtx) => {
    const ideas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();

    for (const idea of ideas) {
      const newHotScore = calculateHotScore(
        idea.supportVotes,
        idea.opposeVotes,
        idea.commentCount,
        idea.createdAt
      );

      await ctx.db.patch(idea._id, { hotScore: newHotScore });
    }
  },
});
