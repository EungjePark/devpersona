/**
 * Content Recommendation and Discovery Algorithms
 * ================================================
 *
 * This module provides algorithms for content discovery as the platform grows.
 * It implements multiple recommendation strategies to surface relevant content
 * to users based on different signals.
 *
 * ALGORITHM OVERVIEW:
 * -------------------
 *
 * 1. HOT SCORE (Enhanced HN/Reddit style):
 *    - Base formula: score / (hoursAge + 2)^gravity
 *    - Enhanced with: engagement velocity, comment quality weight, fresh idea boost
 *    - Gravity factor: 1.8 (content decays over ~24-48 hours)
 *
 * 2. TRENDING:
 *    - Measures vote velocity (votes per hour) within a recent window
 *    - Ideas with high velocity surface regardless of total score
 *    - Window: 24 hours by default
 *
 * 3. FOR YOU (Personalized):
 *    - Based on user's past votes and interactions
 *    - Finds similar authors and topics the user has engaged with
 *    - Applies diversity factor to avoid filter bubbles
 *
 * 4. RISING STARS:
 *    - New ideas (within boost window) with exceptional early engagement
 *    - High engagement-to-age ratio
 *    - Gives new content a chance to be discovered
 *
 * 5. SIMILAR IDEAS:
 *    - Based on author similarity (same author's other ideas)
 *    - Topic similarity (keyword/problem overlap - future enhancement)
 *
 * FUTURE IMPROVEMENTS:
 * --------------------
 * - ML-based collaborative filtering (users who liked X also liked Y)
 * - Natural language processing for topic similarity
 * - Time-of-day personalization
 * - A/B testing framework for algorithm tuning
 * - User feedback loop (explicit "not interested" signals)
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;

// ============================================
// DISCOVERY ALGORITHM CONSTANTS
// ============================================

/**
 * Configuration for content discovery algorithms.
 * These values can be tuned based on platform behavior and user feedback.
 */
export const DISCOVERY_CONFIG = {
  // Trending window: Ideas within this timeframe are candidates for "trending"
  trendingWindowHours: 24,

  // Votes per hour threshold to be considered "trending"
  // Lower threshold = more ideas shown, higher = more selective
  velocityThreshold: 5,

  // New ideas get a visibility boost for this many hours
  // Helps fresh content get initial exposure
  newIdeaBoostHours: 6,

  // Boost multiplier for new ideas (1.5 = 50% boost)
  newIdeaBoostMultiplier: 1.5,

  // Diversity factor: 0-1, higher = more variety in recommendations
  // 0.3 means 30% of recommendations should come from diverse sources
  diversityFactor: 0.3,

  // Rising star threshold: engagement-to-age ratio
  // Ideas with this ratio or higher are "rising"
  risingStarThreshold: 3.0,

  // Maximum age (hours) for an idea to be considered "rising"
  risingStarMaxAgeHours: 48,

  // Comment quality weight in hot score
  // Each comment contributes this much to the score
  commentWeight: 0.5,

  // Gravity factor for time decay (higher = faster decay)
  gravity: 1.8,

  // Base offset to prevent division by zero and smooth early hours
  ageOffset: 2,

  // For personalized recommendations: how many past interactions to consider
  interactionHistoryLimit: 50,

  // Minimum engagement for similar ideas query
  similarIdeasMinEngagement: 3,
};

// ============================================
// QUERIES
// ============================================

/**
 * Get trending ideas - Ideas gaining momentum with high vote velocity.
 *
 * This query identifies ideas that are receiving votes at an above-average rate,
 * regardless of their total score. This helps surface breakout content early.
 *
 * Algorithm:
 * 1. Get all open ideas within trending window
 * 2. Calculate vote velocity for each
 * 3. Filter by velocity threshold
 * 4. Sort by velocity (highest first)
 */
export const getTrendingIdeas = query({
  args: {
    limit: v.optional(v.number()),
    windowHours: v.optional(v.number()),
  },
  handler: async (
    ctx: QueryCtx,
    {
      limit = 10,
      windowHours = DISCOVERY_CONFIG.trendingWindowHours,
    }
  ) => {
    const now = Date.now();
    const windowStart = now - windowHours * 60 * 60 * 1000;

    // Get open ideas created within a reasonable timeframe
    const ideas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();

    // Calculate velocity for each idea
    const ideasWithVelocity = await Promise.all(
      ideas.map(async (idea) => {
        // Get votes for this idea within the window
        const votes = await ctx.db
          .query("ideaVotes")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_idea", (q: any) => q.eq("ideaId", idea._id))
          .collect();

        const recentVotes = votes.filter((v) => v.createdAt >= windowStart);
        const velocity = recentVotes.length / windowHours;

        return {
          ...idea,
          velocity,
          recentVoteCount: recentVotes.length,
        };
      })
    );

    // Filter by velocity threshold and sort
    const trending = ideasWithVelocity
      .filter((idea) => idea.velocity >= DISCOVERY_CONFIG.velocityThreshold)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, limit);

    return trending;
  },
});

/**
 * Get personalized "For You" recommendations based on user's past interactions.
 *
 * Algorithm:
 * 1. Get user's recent votes (what they've engaged with)
 * 2. Find authors of ideas they've supported
 * 3. Find ideas from those authors they haven't seen
 * 4. Apply diversity factor to include some random high-quality content
 *
 * Future improvements:
 * - Collaborative filtering (users with similar voting patterns)
 * - Topic/keyword similarity
 * - Time-of-day preferences
 */
export const getForYou = query({
  args: {
    username: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, { username, limit = 20 }) => {
    const { diversityFactor, interactionHistoryLimit, similarIdeasMinEngagement } =
      DISCOVERY_CONFIG;

    // Get user's voting history
    const userVotes = await ctx.db
      .query("ideaVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_voter", (q: any) => q.eq("voterUsername", username))
      .collect();

    // Get IDs of ideas user has already voted on
    const votedIdeaIds = new Set(userVotes.map((v) => v.ideaId));

    // Find authors the user has supported
    const supportedVotes = userVotes
      .filter((v) => v.voteType === "support")
      .slice(0, interactionHistoryLimit);

    const supportedIdeas = await Promise.all(
      supportedVotes.map((v) => ctx.db.get(v.ideaId))
    );

    const favoriteAuthors = new Set(
      supportedIdeas
        .filter((idea): idea is NonNullable<typeof idea> => idea !== null)
        .map((idea) => idea.authorUsername)
    );

    // Get all open ideas
    const allIdeas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();

    // Filter out already voted ideas and user's own ideas
    const candidateIdeas = allIdeas.filter(
      (idea) =>
        !votedIdeaIds.has(idea._id) &&
        idea.authorUsername !== username
    );

    // Score ideas: favorite authors get boost
    const scoredIdeas = candidateIdeas.map((idea) => {
      let score = idea.hotScore;
      if (favoriteAuthors.has(idea.authorUsername)) {
        score *= 1.5; // 50% boost for favorite authors
      }
      return { ...idea, recommendationScore: score };
    });

    // Sort by recommendation score
    scoredIdeas.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Apply diversity: mix in some high-engagement content from non-favorites
    const diverseCount = Math.floor(limit * diversityFactor);
    const personalizedCount = limit - diverseCount;

    // Get personalized recommendations (from favorite authors)
    const personalized = scoredIdeas
      .filter((idea) => favoriteAuthors.has(idea.authorUsername))
      .slice(0, personalizedCount);

    // Get diverse recommendations (high engagement, not from favorites)
    const diverse = scoredIdeas
      .filter(
        (idea) =>
          !favoriteAuthors.has(idea.authorUsername) &&
          idea.supportVotes + idea.commentCount >= similarIdeasMinEngagement
      )
      .slice(0, diverseCount);

    // Merge and shuffle slightly for variety
    const recommendations = [...personalized, ...diverse];

    // If we don't have enough personalized content, fill with top general content
    if (recommendations.length < limit) {
      const remaining = scoredIdeas
        .filter((idea) => !recommendations.some((r) => r._id === idea._id))
        .slice(0, limit - recommendations.length);
      recommendations.push(...remaining);
    }

    return recommendations.slice(0, limit);
  },
});

/**
 * Get similar ideas based on author or topic similarity.
 *
 * Algorithm:
 * 1. Same author's other ideas (excluding current)
 * 2. Ideas with similar engagement patterns (similar vote ratio)
 *
 * Future improvements:
 * - NLP-based topic extraction and matching
 * - Target audience similarity
 * - Problem domain clustering
 */
export const getSimilarIdeas = query({
  args: {
    ideaId: v.id("ideaValidations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, { ideaId, limit = 5 }) => {
    const { similarIdeasMinEngagement } = DISCOVERY_CONFIG;

    const currentIdea = await ctx.db.get(ideaId);
    if (!currentIdea) {
      return [];
    }

    // Get same author's other ideas
    const authorIdeas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_author", (q: any) =>
        q.eq("authorUsername", currentIdea.authorUsername)
      )
      .collect();

    const otherAuthorIdeas = authorIdeas
      .filter((idea) => idea._id !== ideaId && idea.status === "open")
      .sort((a, b) => b.hotScore - a.hotScore);

    // If we have enough from same author, return those
    if (otherAuthorIdeas.length >= limit) {
      return otherAuthorIdeas.slice(0, limit);
    }

    // Get ideas with similar engagement patterns
    const currentEngagement = currentIdea.supportVotes + currentIdea.opposeVotes;
    const currentRatio =
      currentIdea.supportVotes / Math.max(1, currentEngagement);

    const allOpenIdeas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();

    // Score by similarity in engagement pattern
    const similarIdeas = allOpenIdeas
      .filter(
        (idea) =>
          idea._id !== ideaId &&
          idea.authorUsername !== currentIdea.authorUsername &&
          idea.supportVotes + idea.opposeVotes >= similarIdeasMinEngagement
      )
      .map((idea) => {
        const engagement = idea.supportVotes + idea.opposeVotes;
        const ratio = idea.supportVotes / Math.max(1, engagement);
        const ratioDiff = Math.abs(ratio - currentRatio);
        return { ...idea, similarityScore: 1 - ratioDiff };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore);

    // Combine author ideas with similar ideas
    const combined = [
      ...otherAuthorIdeas,
      ...similarIdeas.slice(0, limit - otherAuthorIdeas.length),
    ];

    return combined.slice(0, limit);
  },
});

/**
 * Get rising star ideas - New ideas with exceptional early engagement.
 *
 * Algorithm:
 * 1. Filter to ideas within rising star age window
 * 2. Calculate engagement-to-age ratio
 * 3. Filter by rising star threshold
 * 4. Sort by ratio (highest first)
 *
 * This surfaces content that's getting unusual traction for its age,
 * helping new quality content get discovered quickly.
 */
export const getRisingStars = query({
  args: {
    limit: v.optional(v.number()),
    maxAgeHours: v.optional(v.number()),
  },
  handler: async (
    ctx: QueryCtx,
    {
      limit = 10,
      maxAgeHours = DISCOVERY_CONFIG.risingStarMaxAgeHours,
    }
  ) => {
    const { risingStarThreshold } = DISCOVERY_CONFIG;
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    // Get recent ideas
    const ideas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();

    // Filter and score
    const risingIdeas = ideas
      .filter((idea) => now - idea.createdAt <= maxAgeMs)
      .map((idea) => {
        const ageHours = Math.max(1, (now - idea.createdAt) / (1000 * 60 * 60));
        const engagement =
          idea.supportVotes + idea.commentCount * 0.5 - idea.opposeVotes * 0.3;
        const engagementRatio = engagement / ageHours;

        return {
          ...idea,
          engagementRatio,
          ageHours,
        };
      })
      .filter((idea) => idea.engagementRatio >= risingStarThreshold)
      .sort((a, b) => b.engagementRatio - a.engagementRatio);

    return risingIdeas.slice(0, limit);
  },
});

/**
 * Get discovery feed - A mixed feed combining multiple algorithms.
 *
 * This provides a balanced feed with:
 * - Hot content (standard ranking)
 * - Trending content (high velocity)
 * - Rising stars (new with good traction)
 * - Random exploration (for diversity)
 *
 * The mix ratio can be adjusted based on user preferences or A/B testing.
 */
export const getDiscoveryFeed = query({
  args: {
    username: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, { username, limit = 20 }) => {
    // Get all open ideas
    const ideas = await ctx.db
      .query("ideaValidations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();

    if (ideas.length === 0) {
      return [];
    }

    // Get user's voted ideas to filter out
    let votedIdeaIds = new Set<string>();
    if (username) {
      const userVotes = await ctx.db
        .query("ideaVotes")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_voter", (q: any) => q.eq("voterUsername", username))
        .collect();
      votedIdeaIds = new Set(userVotes.map((v) => v.ideaId));
    }

    // Filter out voted and own ideas
    const candidateIdeas = ideas.filter(
      (idea) =>
        !votedIdeaIds.has(idea._id) &&
        idea.authorUsername !== username
    );

    // If no candidates after filtering, return hot ideas
    if (candidateIdeas.length === 0) {
      return ideas.sort((a, b) => b.hotScore - a.hotScore).slice(0, limit);
    }

    const now = Date.now();
    const {
      trendingWindowHours,
      velocityThreshold,
      risingStarMaxAgeHours,
      risingStarThreshold,
    } = DISCOVERY_CONFIG;

    // Score each idea with multiple factors
    const scoredIdeas = await Promise.all(
      candidateIdeas.map(async (idea) => {
        // Calculate velocity
        const votes = await ctx.db
          .query("ideaVotes")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_idea", (q: any) => q.eq("ideaId", idea._id))
          .collect();

        const windowStart =
          now - trendingWindowHours * 60 * 60 * 1000;
        const recentVotes = votes.filter((v) => v.createdAt >= windowStart);
        const velocity = recentVotes.length / trendingWindowHours;

        // Calculate age-based metrics
        const ageHours = Math.max(1, (now - idea.createdAt) / (1000 * 60 * 60));
        const engagement =
          idea.supportVotes + idea.commentCount * 0.5 - idea.opposeVotes * 0.3;
        const engagementRatio = engagement / ageHours;

        // Determine idea type
        const isTrending = velocity >= velocityThreshold;
        const isRising =
          ageHours <= risingStarMaxAgeHours &&
          engagementRatio >= risingStarThreshold;

        // Calculate composite discovery score
        let discoveryScore = idea.hotScore;

        if (isTrending) {
          discoveryScore *= 1.3; // 30% boost for trending
        }
        if (isRising) {
          discoveryScore *= 1.2; // 20% boost for rising
        }

        // Add small deterministic perturbation for variety (based on idea ID hash)
        // This ensures consistent results for caching while adding diversity
        const hash = idea._id.toString().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        discoveryScore *= 1 + (hash % 100) / 1000; // 0-10% boost based on ID

        return {
          ...idea,
          discoveryScore,
          velocity,
          engagementRatio,
          isTrending,
          isRising,
        };
      })
    );

    // Sort by discovery score
    scoredIdeas.sort((a, b) => b.discoveryScore - a.discoveryScore);

    return scoredIdeas.slice(0, limit);
  },
});

/**
 * Get recommendation statistics for an idea.
 * Useful for debugging and displaying why an idea ranks the way it does.
 */
export const getIdeaStats = query({
  args: {
    ideaId: v.id("ideaValidations"),
  },
  handler: async (ctx: QueryCtx, { ideaId }) => {
    const idea = await ctx.db.get(ideaId);
    if (!idea) {
      return null;
    }

    const now = Date.now();
    const { trendingWindowHours, risingStarMaxAgeHours } = DISCOVERY_CONFIG;

    // Get votes
    const votes = await ctx.db
      .query("ideaVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_idea", (q: any) => q.eq("ideaId", ideaId))
      .collect();

    // Calculate metrics
    const windowStart = now - trendingWindowHours * 60 * 60 * 1000;
    const recentVotes = votes.filter((v) => v.createdAt >= windowStart);
    const velocity = recentVotes.length / trendingWindowHours;

    const ageHours = (now - idea.createdAt) / (1000 * 60 * 60);
    const engagement =
      idea.supportVotes + idea.commentCount * 0.5 - idea.opposeVotes * 0.3;
    const engagementRatio = engagement / Math.max(1, ageHours);

    return {
      ideaId,
      title: idea.title,
      metrics: {
        hotScore: idea.hotScore,
        supportVotes: idea.supportVotes,
        opposeVotes: idea.opposeVotes,
        commentCount: idea.commentCount,
        netVotes: idea.supportVotes - idea.opposeVotes,
      },
      velocity: {
        votesPerHour: velocity,
        recentVoteCount: recentVotes.length,
        windowHours: trendingWindowHours,
        isTrending: velocity >= DISCOVERY_CONFIG.velocityThreshold,
      },
      age: {
        hours: ageHours,
        days: ageHours / 24,
        isNew: ageHours <= DISCOVERY_CONFIG.newIdeaBoostHours,
      },
      rising: {
        engagementRatio,
        isRising:
          ageHours <= risingStarMaxAgeHours &&
          engagementRatio >= DISCOVERY_CONFIG.risingStarThreshold,
      },
    };
  },
});
