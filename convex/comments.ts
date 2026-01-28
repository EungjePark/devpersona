import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

// ============================================
// Queries
// ============================================

// Get comments for a post (flat list)
export const getByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx: QueryCtx, { postId }) => {
    const comments = await ctx.db
      .query("comments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_post", (q: any) => q.eq("postId", postId))
      .collect();

    // Sort by creation date
    return comments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get comments as a tree (nested structure)
export const getByPostTree = query({
  args: { postId: v.id("posts") },
  handler: async (ctx: QueryCtx, { postId }) => {
    const comments = await ctx.db
      .query("comments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_post", (q: any) => q.eq("postId", postId))
      .collect();

    // Build tree structure
    const commentMap = new Map<string, Doc<"comments"> & { children: Array<Doc<"comments"> & { children: unknown[] }> }>();
    const rootComments: Array<Doc<"comments"> & { children: unknown[] }> = [];

    // First pass: create map with children arrays
    for (const comment of comments) {
      commentMap.set(comment._id, { ...comment, children: [] });
    }

    // Second pass: build tree
    for (const comment of comments) {
      const node = commentMap.get(comment._id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          rootComments.push(node);
        }
      } else {
        rootComments.push(node);
      }
    }

    // Sort each level by creation date
    const sortComments = (comments: Array<Doc<"comments"> & { children: unknown[] }>) => {
      comments.sort((a, b) => a.createdAt - b.createdAt);
      for (const comment of comments) {
        sortComments(comment.children as Array<Doc<"comments"> & { children: unknown[] }>);
      }
    };

    sortComments(rootComments);

    return rootComments;
  },
});

// Get a single comment
export const getById = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx: QueryCtx, { commentId }) => {
    return await ctx.db.get(commentId);
  },
});

// Check if user has upvoted a comment
export const hasUpvoted = query({
  args: { commentId: v.id("comments"), voterUsername: v.string() },
  handler: async (ctx: QueryCtx, { commentId, voterUsername }) => {
    const vote = await ctx.db
      .query("commentVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_comment_voter", (q: any) =>
        q.eq("commentId", commentId).eq("voterUsername", voterUsername)
      )
      .first();

    return vote !== null;
  },
});

// ============================================
// Mutations
// ============================================

// Input validation constants
const MAX_COMMENT_LENGTH = 5000;
const MIN_COMMENT_LENGTH = 1;

// Create a comment
export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    authorUsername: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx: MutationCtx, { postId, authorUsername, content, parentId }) => {
    // SECURITY: Validate content length
    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_COMMENT_LENGTH) {
      throw new Error("Comment cannot be empty.");
    }
    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
    }

    // Verify post exists
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found.");

    // Calculate depth
    let depth = 0;
    if (parentId) {
      const parent = await ctx.db.get(parentId);
      if (!parent) throw new Error("Parent comment not found.");
      depth = parent.depth + 1;

      // Limit nesting depth
      if (depth > 5) {
        throw new Error("Maximum reply depth reached.");
      }
    }

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      postId,
      authorUsername,
      content: trimmedContent,
      parentId,
      upvotes: 0,
      depth,
      createdAt: Date.now(),
    });

    // Update post comment count
    await ctx.db.patch(postId, {
      commentCount: (post.commentCount ?? 0) + 1,
    });

    return commentId;
  },
});

// Upvote a comment
export const upvoteComment = mutation({
  args: {
    commentId: v.id("comments"),
    voterUsername: v.string(),
  },
  handler: async (ctx: MutationCtx, { commentId, voterUsername }) => {
    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found.");

    // Check existing vote
    const existingVote = await ctx.db
      .query("commentVotes")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_comment_voter", (q: any) =>
        q.eq("commentId", commentId).eq("voterUsername", voterUsername)
      )
      .first();

    if (existingVote) {
      // Remove vote
      await ctx.db.delete(existingVote._id);
      await ctx.db.patch(commentId, { upvotes: Math.max(0, comment.upvotes - 1) });
      return { action: "removed" };
    }

    // Add vote
    await ctx.db.insert("commentVotes", {
      commentId,
      voterUsername,
      createdAt: Date.now(),
    });

    await ctx.db.patch(commentId, { upvotes: comment.upvotes + 1 });

    return { action: "upvoted" };
  },
});

// Helper to delete all votes for a comment
async function deleteCommentVotes(ctx: MutationCtx, commentId: Id<"comments">): Promise<void> {
  const votes = await ctx.db
    .query("commentVotes")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_comment", (q: any) => q.eq("commentId", commentId))
    .collect();

  for (const vote of votes) {
    await ctx.db.delete(vote._id);
  }
}

// Delete a comment
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    requestingUsername: v.string(),
  },
  handler: async (ctx: MutationCtx, { commentId, requestingUsername }) => {
    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found.");

    if (comment.authorUsername !== requestingUsername) {
      throw new Error("You can only delete your own comments.");
    }

    // Delete votes for this comment
    await deleteCommentVotes(ctx, commentId);

    // Delete child comments recursively (including their votes)
    const deleteChildren = async (parentId: Id<"comments">) => {
      const children = await ctx.db
        .query("comments")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_parent", (q: any) => q.eq("parentId", parentId))
        .collect();

      for (const child of children) {
        await deleteChildren(child._id);
        await deleteCommentVotes(ctx, child._id);
        await ctx.db.delete(child._id);
      }
    };

    await deleteChildren(commentId);

    // Update post comment count (estimate - doesn't count deleted children)
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, (post.commentCount ?? 0) - 1),
      });
    }

    // Delete the comment
    await ctx.db.delete(commentId);

    return { success: true };
  },
});

// Edit a comment
export const editComment = mutation({
  args: {
    commentId: v.id("comments"),
    requestingUsername: v.string(),
    content: v.string(),
  },
  handler: async (ctx: MutationCtx, { commentId, requestingUsername, content }) => {
    // SECURITY: Validate content length
    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_COMMENT_LENGTH) {
      throw new Error("Comment cannot be empty.");
    }
    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`);
    }

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found.");

    if (comment.authorUsername !== requestingUsername) {
      throw new Error("You can only edit your own comments.");
    }

    await ctx.db.patch(commentId, { content: trimmedContent });

    return { success: true };
  },
});
