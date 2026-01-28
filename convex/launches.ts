import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// Poten threshold for launches (weighted score)
const LAUNCH_POTEN_THRESHOLD = 10;

// Vote weight by tier (matching BUILDER_TIERS)
const VOTE_WEIGHTS: Record<number, number> = {
  0: 0, // Ground Control - can't vote
  1: 1, // Cadet
  2: 1, // Pilot
  3: 2, // Astronaut
  4: 3, // Commander
  5: 5, // Captain
  6: 5, // Admiral
  7: 5, // Cosmos
};

// ============================================
// Queries
// ============================================

// Get launches for a specific week
export const getWeeklyLaunches = query({
  args: { weekNumber: v.string() },
  handler: async (ctx: QueryCtx, { weekNumber }) => {
    return await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_week", (q: any) => q.eq("weekNumber", weekNumber))
      .collect()
      .then(launches => launches.sort((a, b) => b.weightedScore - a.weightedScore));
  },
});

// Get current week launches
export const getCurrentWeekLaunches = query({
  handler: async (ctx: QueryCtx) => {
    const weekNumber = getCurrentWeekNumber();
    return await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_week", (q: any) => q.eq("weekNumber", weekNumber))
      .collect()
      .then(launches => launches.sort((a, b) => b.weightedScore - a.weightedScore));
  },
});

// Get a single launch by ID
export const getById = query({
  args: { launchId: v.id("launches") },
  handler: async (ctx: QueryCtx, { launchId }) => {
    return await ctx.db.get(launchId);
  },
});

// Get launches by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx: QueryCtx, { username }) => {
    return await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .collect();
  },
});


// Get launch by linked idea ID
export const getByLinkedIdea = query({
  args: { ideaId: v.id("ideaValidations") },
  handler: async (ctx: QueryCtx, { ideaId }) => {
    return await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_linked_idea", (q: any) => q.eq("linkedIdeaId", ideaId))
      .first();
  },
});

// Get top launches (poten) across all weeks
export const getPotenLaunches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 20 }) => {
    // Use index for efficient Poten filtering
    const potenLaunches = await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_poten", (q: any) => q.eq("isPoten", true))
      .collect();

    return potenLaunches
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

// Get weekly results for Hall of Fame
export const getWeeklyResults = query({
  args: { year: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { year, limit = 52 }) => {
    const results = await ctx.db.query("weeklyResults").collect();

    let filtered = results;
    if (year) {
      filtered = results.filter(r => r.weekNumber.startsWith(`${year}-`));
    }

    return filtered
      .sort((a, b) => b.finalizedAt - a.finalizedAt)
      .slice(0, limit);
  },
});

// Get single week result
export const getWeekResult = query({
  args: { weekNumber: v.string() },
  handler: async (ctx: QueryCtx, { weekNumber }) => {
    return await ctx.db
      .query("weeklyResults")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_week", (q: any) => q.eq("weekNumber", weekNumber))
      .first();
  },
});

// Get last week's champions (most recent finalized result)
export const getLastWeekChampions = query({
  handler: async (ctx: QueryCtx) => {
    const results = await ctx.db
      .query("weeklyResults")
      .order("desc")
      .take(1);

    if (results.length === 0) return null;

    const result = results[0];

    // Fetch full launch details for each winner
    const winnersWithDetails = await Promise.all(
      result.winners.map(async (winner) => {
        const launch = await ctx.db.get(winner.launchId);
        return {
          ...winner,
          screenshot: launch?.screenshot,
          ogImage: launch?.ogImage,
          demoUrl: launch?.demoUrl,
        };
      })
    );

    return {
      weekNumber: result.weekNumber,
      winners: winnersWithDetails,
      totalLaunches: result.totalLaunches,
      totalVotes: result.totalVotes,
      finalizedAt: result.finalizedAt,
    };
  },
});

// Get all available years with results
export const getAvailableYears = query({
  handler: async (ctx: QueryCtx) => {
    const results = await ctx.db.query("weeklyResults").collect();
    const years = new Set(results.map(r => parseInt(r.weekNumber.split('-')[0])));
    return Array.from(years).sort((a, b) => b - a);
  },
});

// Check if user has already voted on a launch
export const hasVoted = query({
  args: { launchId: v.id("launches"), voterUsername: v.string() },
  handler: async (ctx: QueryCtx, { launchId, voterUsername }) => {
    const vote = await ctx.db
      .query("votes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_launch_voter", (q: any) =>
        q.eq("launchId", launchId).eq("voterUsername", voterUsername)
      )
      .first();
    return vote !== null;
  },
});

// Get vote count for a launch
export const getVoteCount = query({
  args: { launchId: v.id("launches") },
  handler: async (ctx: QueryCtx, { launchId }) => {
    const votes = await ctx.db
      .query("votes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_launch", (q: any) => q.eq("launchId", launchId))
      .collect();
    return {
      count: votes.length,
      weightedScore: votes.reduce((sum, v) => sum + v.weight, 0),
    };
  },
});

// ============================================
// Mutations
// ============================================

// Submit a new launch
export const submitLaunch = mutation({
  args: {
    username: v.string(),
    title: v.string(),
    description: v.string(),
    demoUrl: v.string(),
    githubUrl: v.optional(v.string()),
    weekNumber: v.string(),
    screenshot: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    problemSolved: v.optional(v.string()),
    // URL metadata from unfurl
    ogImage: v.optional(v.string()),
    favicon: v.optional(v.string()),
    siteName: v.optional(v.string()),
    // Link to validated idea
    linkedIdeaId: v.optional(v.id("ideaValidations")),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { username, title, description, demoUrl, githubUrl, weekNumber, screenshot, targetAudience, problemSolved, ogImage, favicon, siteName, linkedIdeaId } = args;

    // Check how many launches user has this week (max 3 per week)
    const userLaunchesThisWeek = await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_week", (q: any) => q.eq("weekNumber", weekNumber))
      .collect()
      .then(launches => launches.filter(l => l.username === username));

    const MAX_LAUNCHES_PER_WEEK = 3;
    if (userLaunchesThisWeek.length >= MAX_LAUNCHES_PER_WEEK) {
      throw new Error(`Maximum ${MAX_LAUNCHES_PER_WEEK} launches per week. You've already submitted ${userLaunchesThisWeek.length}.`);
    }

    // If linking to a validated idea, verify ownership and status
    if (linkedIdeaId) {
      const idea = await ctx.db.get(linkedIdeaId);
      if (!idea) {
        throw new Error("Linked idea not found.");
      }
      if (idea.authorUsername !== username) {
        throw new Error("You can only link your own validated ideas.");
      }
      if (idea.status !== "validated") {
        throw new Error("Only validated ideas can be linked to launches.");
      }
      // Check if idea is already linked via launches table (unidirectional FK)
      const existingLaunch = await ctx.db
        .query("launches")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_linked_idea", (q: any) => q.eq("linkedIdeaId", linkedIdeaId))
        .first();
      if (existingLaunch) {
        throw new Error("This idea is already linked to another launch.");
      }
    }

    // Create launch
    const launchId = await ctx.db.insert("launches", {
      username,
      title,
      description,
      demoUrl,
      githubUrl,
      screenshot,
      weekNumber,
      targetAudience,
      problemSolved,
      // URL metadata
      ogImage,
      favicon,
      siteName,
      // Linked idea
      linkedIdeaId,
      voteCount: 0,
      weightedScore: 0,
      isPoten: false,
      status: "active",
      createdAt: Date.now(),
      promotionBoost: 0,
      verifiedFeedbackCount: 0,
      vitaminVotes: 0,
      painkillerVotes: 0,
      candyVotes: 0,
    });

    // If linked to an idea, update the idea status to "launched"
    if (linkedIdeaId) {
      await ctx.db.patch(linkedIdeaId, {
        status: "launched",
      });
    }

    // Auto-create station for the launch (free for now, subscription later)
    await createStationForLaunch(ctx, launchId, {
      title,
      description,
      username,
      ogImage,
      screenshot,
    });

    return launchId;
  },
});

// Feedback weight multipliers
const FEEDBACK_MULTIPLIERS: Record<string, number> = {
  quickVote: 1,
  review: 3,
  verifiedReview: 5,
};

// Cast a vote (with tier-based weighting and feedback)
export const castVote = mutation({
  args: {
    launchId: v.id("launches"),
    voterUsername: v.string(),
    feedbackText: v.optional(v.string()),
    productTypeVote: v.optional(v.string()),
    visitedAt: v.optional(v.number()),
    returnedAt: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { launchId, voterUsername, feedbackText, productTypeVote, visitedAt, returnedAt } = args;

    // Look up actual tier from database
    const builderRank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", voterUsername))
      .first();

    const voterTier = builderRank?.tier ?? 0;

    // Validate tier
    if (voterTier < 1) {
      throw new Error("You need to be at least Cadet (T1) to vote.");
    }

    // Check if launch exists
    const launch = await ctx.db.get(launchId);
    if (!launch) {
      throw new Error("Launch not found.");
    }

    // Prevent self-voting (disabled in dev mode for testing)
    const isDevMode = process.env.NODE_ENV === "development" || process.env.CONVEX_DEV_MODE === "true";
    if (launch.username === voterUsername && !isDevMode) {
      throw new Error("You cannot vote for your own launch.");
    }

    // Check if already voted
    const existingVote = await ctx.db
      .query("votes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_launch_voter", (q: any) =>
        q.eq("launchId", launchId).eq("voterUsername", voterUsername)
      )
      .first();

    if (existingVote) {
      throw new Error("You've already voted for this launch.");
    }

    // Calculate feedback multiplier
    const hasReview = feedbackText && feedbackText.trim().length >= 50;
    const isVerified = visitedAt && returnedAt && (returnedAt - visitedAt >= 10 * 60 * 1000);

    let multiplier = FEEDBACK_MULTIPLIERS.quickVote;
    if (hasReview && isVerified) {
      multiplier = FEEDBACK_MULTIPLIERS.verifiedReview;
    } else if (hasReview) {
      multiplier = FEEDBACK_MULTIPLIERS.review;
    }

    // Get base vote weight from tier
    const baseWeight = VOTE_WEIGHTS[voterTier] || 1;
    const weight = baseWeight * multiplier;

    // Create vote
    await ctx.db.insert("votes", {
      launchId,
      voterUsername,
      weight,
      createdAt: Date.now(),
      feedbackText: feedbackText?.trim() || undefined,
      isVerified: !!isVerified,
      visitedAt,
      returnedAt,
      productTypeVote,
    });

    // Update launch vote counts and product type votes
    const newWeightedScore = launch.weightedScore + weight;
    const updates: Record<string, number | boolean> = {
      voteCount: launch.voteCount + 1,
      weightedScore: newWeightedScore,
    };

    if (isVerified) {
      updates.verifiedFeedbackCount = (launch.verifiedFeedbackCount || 0) + 1;
    }

    if (productTypeVote === 'vitamin') {
      updates.vitaminVotes = (launch.vitaminVotes || 0) + 1;
    } else if (productTypeVote === 'painkiller') {
      updates.painkillerVotes = (launch.painkillerVotes || 0) + 1;
    } else if (productTypeVote === 'candy') {
      updates.candyVotes = (launch.candyVotes || 0) + 1;
    }

    // Check if this vote crosses the Poten threshold (consolidate into single patch)
    const crossesPoten = !launch.isPoten && newWeightedScore >= LAUNCH_POTEN_THRESHOLD;
    if (crossesPoten) {
      updates.isPoten = true;
    }

    await ctx.db.patch(launchId, updates);

    // Auto-create Product Station when Poten threshold is crossed
    // Re-fetch to prevent race condition in station creation
    if (crossesPoten) {
      const updatedLaunch = await ctx.db.get(launchId);
      if (updatedLaunch && updatedLaunch.isPoten) {
        await createStationFromPoten(ctx, launchId, updatedLaunch);
      }
    }

    // Award promotion points to the voter for their feedback
    let promotionPoints = 1; // quickVote
    if (hasReview && isVerified) {
      promotionPoints = 10; // verifiedReview
    } else if (hasReview) {
      promotionPoints = 5; // review
    }

    // Update voter's promotion points and community karma
    const voterBuilderRank = await ctx.db
      .query("builderRanks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", voterUsername))
      .first();

    if (voterBuilderRank) {
      await ctx.db.patch(voterBuilderRank._id, {
        promotionPoints: (voterBuilderRank.promotionPoints || 0) + promotionPoints,
        communityKarma: voterBuilderRank.communityKarma + promotionPoints,
        updatedAt: Date.now(),
      });
    }

    return { success: true, weight, multiplier, promotionPoints };
  },
});

// Remove vote
export const removeVote = mutation({
  args: {
    launchId: v.id("launches"),
    voterUsername: v.string(),
  },
  handler: async (ctx: MutationCtx, { launchId, voterUsername }) => {
    const vote = await ctx.db
      .query("votes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_launch_voter", (q: any) =>
        q.eq("launchId", launchId).eq("voterUsername", voterUsername)
      )
      .first();

    if (!vote) {
      throw new Error("Vote not found.");
    }

    const launch = await ctx.db.get(launchId);
    if (!launch) {
      throw new Error("Launch not found.");
    }

    // Remove vote
    await ctx.db.delete(vote._id);

    // Update launch counts including category votes and verified feedback
    const updates: Record<string, number> = {
      voteCount: Math.max(0, launch.voteCount - 1),
      weightedScore: Math.max(0, launch.weightedScore - vote.weight),
    };

    // Decrement verified feedback count if applicable
    if (vote.isVerified) {
      updates.verifiedFeedbackCount = Math.max(0, (launch.verifiedFeedbackCount || 0) - 1);
    }

    // Decrement category vote counts
    if (vote.productTypeVote === 'vitamin') {
      updates.vitaminVotes = Math.max(0, (launch.vitaminVotes || 0) - 1);
    } else if (vote.productTypeVote === 'painkiller') {
      updates.painkillerVotes = Math.max(0, (launch.painkillerVotes || 0) - 1);
    } else if (vote.productTypeVote === 'candy') {
      updates.candyVotes = Math.max(0, (launch.candyVotes || 0) - 1);
    }

    await ctx.db.patch(launchId, updates);

    return { success: true };
  },
});

// Finalize week (internal, called by cron)
export const finalizeWeek = internalMutation({
  args: { weekNumber: v.string() },
  handler: async (ctx: MutationCtx, { weekNumber }) => {
    // Get all launches for the week
    const launches = await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_week", (q: any) => q.eq("weekNumber", weekNumber))
      .collect();

    if (launches.length === 0) {
      return { success: false, reason: "No launches this week" };
    }

    // Sort by weighted score
    const sorted = [...launches].sort((a, b) => b.weightedScore - a.weightedScore);

    // Assign ranks to top 3
    const winners: Array<{
      rank: number;
      launchId: Id<"launches">;
      username: string;
      title: string;
      weightedScore: number;
      ogImage?: string;
      screenshot?: string;
    }> = [];

    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      const launch = sorted[i];
      const rank = i + 1;

      // Update launch with rank
      await ctx.db.patch(launch._id, {
        rank,
        status: "closed",
      });

      winners.push({
        rank,
        launchId: launch._id,
        username: launch.username,
        title: launch.title,
        weightedScore: launch.weightedScore,
        ogImage: launch.ogImage,
        screenshot: launch.screenshot,
      });
    }

    // Close all other launches
    for (let i = 3; i < sorted.length; i++) {
      await ctx.db.patch(sorted[i]._id, { status: "closed" });
    }

    // PERFORMANCE FIX: Calculate total votes from launches instead of querying all votes
    // Each launch already has voteCount, so we can sum them directly
    const totalVotes = launches.reduce((sum, launch) => sum + launch.voteCount, 0);

    // Create weekly result record
    await ctx.db.insert("weeklyResults", {
      weekNumber,
      winners,
      totalLaunches: launches.length,
      totalVotes,
      finalizedAt: Date.now(),
    });

    return { success: true, winners };
  },
});

// Finalize current week (called by cron on Saturday 00:00 UTC)
export const finalizeCurrentWeek = internalMutation({
  handler: async (ctx: MutationCtx) => {
    // Get previous week number (since cron runs at start of Saturday)
    const weekNumber = getPreviousWeekNumber();

    // Check if already finalized
    const existing = await ctx.db
      .query("weeklyResults")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_week", (q: any) => q.eq("weekNumber", weekNumber))
      .first();

    if (existing) {
      return { success: false, reason: "Week already finalized" };
    }

    // Get all launches for the week
    const launches = await ctx.db
      .query("launches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_week", (q: any) => q.eq("weekNumber", weekNumber))
      .collect();

    if (launches.length === 0) {
      return { success: false, reason: "No launches this week" };
    }

    // Sort by weighted score
    const sorted = [...launches].sort((a, b) => b.weightedScore - a.weightedScore);

    // Assign ranks to top 3
    const winners: Array<{
      rank: number;
      launchId: Id<"launches">;
      username: string;
      title: string;
      weightedScore: number;
    }> = [];

    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      const launch = sorted[i];
      const rank = i + 1;

      // Update launch with rank
      await ctx.db.patch(launch._id, {
        rank,
        status: "closed",
      });

      winners.push({
        rank,
        launchId: launch._id,
        username: launch.username,
        title: launch.title,
        weightedScore: launch.weightedScore,
      });

      // Award shipping points to winners
      const shippingPoints = rank === 1 ? 200 : rank === 2 ? 150 : 100;
      const builderRank = await ctx.db
        .query("builderRanks")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_username", (q: any) => q.eq("username", launch.username))
        .first();

      if (builderRank) {
        const newSP = builderRank.shippingPoints + shippingPoints;
        const updates: Record<string, number> = {
          shippingPoints: newSP,
          updatedAt: Date.now(),
        };
        if (rank === 1) {
          updates.weeklyWins = builderRank.weeklyWins + 1;
        }
        await ctx.db.patch(builderRank._id, updates);
      }
    }

    // Close all other launches
    for (let i = 3; i < sorted.length; i++) {
      await ctx.db.patch(sorted[i]._id, { status: "closed" });
    }

    const totalVotes = launches.reduce((sum, launch) => sum + launch.voteCount, 0);

    // Create weekly result record
    await ctx.db.insert("weeklyResults", {
      weekNumber,
      winners,
      totalLaunches: launches.length,
      totalVotes,
      finalizedAt: Date.now(),
    });

    return { success: true, weekNumber, winners };
  },
});

// Helper: Compute ISO 8601 week number for a given date
function computeIsoWeek(date: Date): string {
  // Create a copy to avoid mutating the input
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  const dayNum = d.getUTCDay() || 7; // Make Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate week number: Math.ceil(days / 7)
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  // ISO week year (may differ from calendar year at year boundaries)
  const isoYear = d.getUTCFullYear();
  return `${isoYear}-W${String(weekNum).padStart(2, "0")}`;
}

// Helper: Get current ISO week number
function getCurrentWeekNumber(): string {
  return computeIsoWeek(new Date());
}

// Helper: Get previous ISO week number (for Saturday cron)
function getPreviousWeekNumber(): string {
  const now = new Date();
  const prevWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return computeIsoWeek(prevWeek);
}

// Helper: Generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

// Default system roles for new stations
const DEFAULT_STATION_ROLES = [
  {
    name: "Captain",
    slug: "captain",
    color: "#FFD700",
    permissions: ["view", "post", "pin", "delete", "settings", "promote", "ban", "roles"],
    priority: 100,
    isDefault: false,
    isSystem: true,
  },
  {
    name: "Co-Captain",
    slug: "co-captain",
    color: "#C0C0C0",
    permissions: ["view", "post", "pin", "delete", "settings", "promote", "ban"],
    priority: 90,
    isDefault: false,
    isSystem: true,
  },
  {
    name: "Moderator",
    slug: "moderator",
    color: "#4CAF50",
    permissions: ["view", "post", "pin", "delete"],
    priority: 50,
    isDefault: false,
    isSystem: true,
  },
  {
    name: "Crew",
    slug: "crew",
    color: "#2196F3",
    permissions: ["view", "post"],
    priority: 10,
    isDefault: true,
    isSystem: true,
  },
] as const;

// Create station when launch is submitted (free tier - subscription ready)
async function createStationForLaunch(
  ctx: MutationCtx,
  launchId: Id<"launches">,
  launch: { title: string; description: string; username: string; ogImage?: string; screenshot?: string }
) {
  // Check if station already exists for this launch
  const existing = await ctx.db
    .query("productStations")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_launch", (q: any) => q.eq("launchId", launchId))
    .first();

  if (existing) return existing._id; // Station already exists

  // Generate unique slug
  let slug = generateSlug(launch.title);
  let counter = 1;
  while (
    await ctx.db
      .query("productStations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first()
  ) {
    slug = `${generateSlug(launch.title)}-${counter}`;
    counter++;
  }

  // Create station (free tier for now, ready for subscription model)
  const stationId = await ctx.db.insert("productStations", {
    slug,
    name: launch.title,
    description: launch.description,
    ownerUsername: launch.username,
    launchId,
    logoUrl: launch.ogImage || launch.screenshot,
    memberCount: 1,
    postCount: 0,
    weeklyActiveMembers: 1,
    status: "active",
    createdAt: Date.now(),
    // Future: subscriptionTier, subscribedUntil, features
  });

  // Initialize default roles for the station
  for (const role of DEFAULT_STATION_ROLES) {
    await ctx.db.insert("stationRoles", {
      stationId,
      name: role.name,
      slug: role.slug,
      color: role.color,
      permissions: [...role.permissions],
      priority: role.priority,
      isDefault: role.isDefault,
      isSystem: role.isSystem,
      createdAt: Date.now(),
    });
  }

  // Add owner as captain
  await ctx.db.insert("stationCrews", {
    stationId,
    username: launch.username,
    role: "captain",
    karmaEarnedHere: 0,
    joinedAt: Date.now(),
  });

  // Update owner's station memberships count
  const ownerUser = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_username", (q: any) => q.eq("username", launch.username))
    .first();

  if (ownerUser) {
    await ctx.db.patch(ownerUser._id, {
      stationMemberships: (ownerUser.stationMemberships || 0) + 1,
    });
  }

  return stationId;
}

// Helper: Auto-create Product Station when launch achieves Poten
async function createStationFromPoten(
  ctx: MutationCtx,
  launchId: Id<"launches">,
  launch: { title: string; description: string; username: string; ogImage?: string; screenshot?: string }
) {
  // Check if station already exists for this launch
  const existing = await ctx.db
    .query("productStations")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_launch", (q: any) => q.eq("launchId", launchId))
    .first();

  if (existing) return; // Station already exists

  // Generate unique slug
  let slug = generateSlug(launch.title);
  let counter = 1;
  while (
    await ctx.db
      .query("productStations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first()
  ) {
    slug = `${generateSlug(launch.title)}-${counter}`;
    counter++;
  }

  // Create station
  const stationId = await ctx.db.insert("productStations", {
    slug,
    name: launch.title,
    description: launch.description,
    ownerUsername: launch.username,
    launchId,
    logoUrl: launch.ogImage || launch.screenshot,
    memberCount: 1,
    postCount: 0,
    weeklyActiveMembers: 1,
    status: "active",
    createdAt: Date.now(),
  });

  // Initialize default roles for the station
  for (const role of DEFAULT_STATION_ROLES) {
    await ctx.db.insert("stationRoles", {
      stationId,
      name: role.name,
      slug: role.slug,
      color: role.color,
      permissions: [...role.permissions],
      priority: role.priority,
      isDefault: role.isDefault,
      isSystem: role.isSystem,
      createdAt: Date.now(),
    });
  }

  // Add owner as captain
  await ctx.db.insert("stationCrews", {
    stationId,
    username: launch.username,
    role: "captain",
    karmaEarnedHere: 0,
    joinedAt: Date.now(),
  });

  // Update owner's station memberships count
  const ownerUser = await ctx.db
    .query("users")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_username", (q: any) => q.eq("username", launch.username))
    .first();

  if (ownerUser) {
    await ctx.db.patch(ownerUser._id, {
      stationMemberships: (ownerUser.stationMemberships || 0) + 1,
    });
  }

  // Auto-add all existing voters as crew members
  const votes = await ctx.db
    .query("votes")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_launch", (q: any) => q.eq("launchId", launchId))
    .collect();

  let memberCount = 1; // Start with owner
  for (const vote of votes) {
    if (vote.voterUsername === launch.username) continue; // Skip owner

    await ctx.db.insert("stationCrews", {
      stationId,
      username: vote.voterUsername,
      role: "crew",
      karmaEarnedHere: 0,
      joinedAt: Date.now(),
    });

    // Update user's station memberships count
    const user = await ctx.db
      .query("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_username", (q: any) => q.eq("username", vote.voterUsername))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        stationMemberships: (user.stationMemberships || 0) + 1,
      });
    }

    memberCount++;
  }

  // Update final member count
  if (memberCount > 1) {
    await ctx.db.patch(stationId, { memberCount });
  }
}
