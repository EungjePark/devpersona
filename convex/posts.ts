import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// Poten threshold (FM코리아 style)
const POTEN_THRESHOLD = 10;

// Board access by tier
const BOARD_MIN_TIER: Record<string, number> = {
  launch_week: 0,
  hall_of_fame: 0,
  feedback: 1,
  discussion: 2,
  vip_lounge: 6,
};

// ============================================
// Queries
// ============================================

// Get posts for a board with pagination
export const getByBoard = query({
  args: {
    boardType: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, { boardType, limit = 20 }) => {
    const posts = await ctx.db
      .query("posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_board", (q: any) => q.eq("boardType", boardType))
      .collect();

    // Sort by creation date descending
    const sorted = posts.sort((a, b) => b.createdAt - a.createdAt);

    return sorted.slice(0, limit);
  },
});

// Get poten posts across all boards
export const getPotenPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit = 20 }) => {
    const posts = await ctx.db
      .query("posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_poten", (q: any) => q.eq("isPoten", true))
      .collect();

    return posts
      .sort((a, b) => (b.potenAt || 0) - (a.potenAt || 0))
      .slice(0, limit);
  },
});

// Get a single post by ID
export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx: QueryCtx, { postId }) => {
    return await ctx.db.get(postId);
  },
});

// Get posts by author
export const getByAuthor = query({
  args: { username: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { username, limit = 20 }) => {
    const posts = await ctx.db
      .query("posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_author", (q: any) => q.eq("authorUsername", username))
      .collect();

    return posts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

// Check if user has voted on a post
export const hasVoted = query({
  args: { postId: v.id("posts"), voterUsername: v.string() },
  handler: async (ctx: QueryCtx, { postId, voterUsername }) => {
    const vote = await ctx.db
      .query("postVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_post_voter", (q: any) =>
        q.eq("postId", postId).eq("voterUsername", voterUsername)
      )
      .first();

    return vote ? vote.voteType : null;
  },
});

// ============================================
// Mutations
// ============================================

// Input validation constants
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;
const MIN_TITLE_LENGTH = 1;
const MIN_CONTENT_LENGTH = 1;
const VALID_BOARD_TYPES = Object.keys(BOARD_MIN_TIER);

// Create a new post
export const createPost = mutation({
  args: {
    authorUsername: v.string(),
    authorTier: v.number(),
    boardType: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx: MutationCtx, { authorUsername, authorTier, boardType, title, content }) => {
    // SECURITY: Validate board type
    if (!VALID_BOARD_TYPES.includes(boardType)) {
      throw new Error(`Invalid board type: ${boardType}`);
    }

    // SECURITY: Validate title length
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      throw new Error("Title cannot be empty.");
    }
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters.`);
    }

    // SECURITY: Validate content length
    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
      throw new Error("Content cannot be empty.");
    }
    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      throw new Error(`Content cannot exceed ${MAX_CONTENT_LENGTH} characters.`);
    }

    // Check board access
    const minTier = BOARD_MIN_TIER[boardType] ?? 0;
    if (authorTier < minTier) {
      throw new Error(`You need tier ${minTier} or higher to post in this board.`);
    }

    return await ctx.db.insert("posts", {
      authorUsername,
      boardType,
      title: trimmedTitle,
      content: trimmedContent,
      upvotes: 0,
      downvotes: 0,
      isPoten: false,
      commentCount: 0,
      createdAt: Date.now(),
    });
  },
});

// Upvote a post
export const upvotePost = mutation({
  args: {
    postId: v.id("posts"),
    voterUsername: v.string(),
  },
  handler: async (ctx: MutationCtx, { postId, voterUsername }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found.");

    // Check existing vote
    const existingVote = await ctx.db
      .query("postVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_post_voter", (q: any) =>
        q.eq("postId", postId).eq("voterUsername", voterUsername)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === "up") {
        // Remove upvote
        await ctx.db.delete(existingVote._id);
        await ctx.db.patch(postId, { upvotes: Math.max(0, post.upvotes - 1) });
        return { action: "removed" };
      } else {
        // Change from down to up
        await ctx.db.patch(existingVote._id, { voteType: "up" });
        const newUpvotes = post.upvotes + 1;
        const newDownvotes = Math.max(0, post.downvotes - 1);
        await ctx.db.patch(postId, { upvotes: newUpvotes, downvotes: newDownvotes });
        await checkPotenThreshold(ctx, postId, newUpvotes, newDownvotes);
        return { action: "changed" };
      }
    }

    // New upvote
    await ctx.db.insert("postVotes", {
      postId,
      voterUsername,
      voteType: "up",
      createdAt: Date.now(),
    });

    const newUpvotes = post.upvotes + 1;
    await ctx.db.patch(postId, { upvotes: newUpvotes });
    await checkPotenThreshold(ctx, postId, newUpvotes, post.downvotes);

    return { action: "upvoted" };
  },
});

// Downvote a post
export const downvotePost = mutation({
  args: {
    postId: v.id("posts"),
    voterUsername: v.string(),
  },
  handler: async (ctx: MutationCtx, { postId, voterUsername }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found.");

    // Check existing vote
    const existingVote = await ctx.db
      .query("postVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_post_voter", (q: any) =>
        q.eq("postId", postId).eq("voterUsername", voterUsername)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === "down") {
        // Remove downvote
        await ctx.db.delete(existingVote._id);
        await ctx.db.patch(postId, { downvotes: Math.max(0, post.downvotes - 1) });
        return { action: "removed" };
      } else {
        // Change from up to down
        await ctx.db.patch(existingVote._id, { voteType: "down" });
        await ctx.db.patch(postId, {
          upvotes: Math.max(0, post.upvotes - 1),
          downvotes: post.downvotes + 1,
        });
        return { action: "changed" };
      }
    }

    // New downvote
    await ctx.db.insert("postVotes", {
      postId,
      voterUsername,
      voteType: "down",
      createdAt: Date.now(),
    });

    await ctx.db.patch(postId, { downvotes: post.downvotes + 1 });

    return { action: "downvoted" };
  },
});

// Delete a post (author only)
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    requestingUsername: v.string(),
  },
  handler: async (ctx: MutationCtx, { postId, requestingUsername }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found.");

    if (post.authorUsername !== requestingUsername) {
      throw new Error("You can only delete your own posts.");
    }

    // Delete all votes
    const votes = await ctx.db
      .query("postVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_post", (q: any) => q.eq("postId", postId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete all comments
    const comments = await ctx.db
      .query("comments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_post", (q: any) => q.eq("postId", postId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete post
    await ctx.db.delete(postId);

    return { success: true };
  },
});

// Helper: Check and update poten status
async function checkPotenThreshold(
  ctx: MutationCtx,
  postId: Id<"posts">,
  upvotes: number,
  downvotes: number
) {
  const netVotes = upvotes - downvotes;
  const post = await ctx.db.get(postId);

  if (post && !post.isPoten && netVotes >= POTEN_THRESHOLD) {
    await ctx.db.patch(postId, {
      isPoten: true,
      potenAt: Date.now(),
    });
  }
}

// Update comment count (called from comments.ts)
export const updateCommentCount = internalMutation({
  args: { postId: v.id("posts"), delta: v.number() },
  handler: async (ctx: MutationCtx, { postId, delta }) => {
    const post = await ctx.db.get(postId);
    if (post) {
      await ctx.db.patch(postId, {
        commentCount: Math.max(0, post.commentCount + delta),
      });
    }
  },
});
