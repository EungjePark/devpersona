import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ============================================
// Role & Permission Constants
// ============================================

// Role hierarchy (higher = more permissions)
export const ROLE_HIERARCHY = {
  crew: 0,
  moderator: 1,
  "co-captain": 2,
  captain: 3,
} as const;

export type StationRole = keyof typeof ROLE_HIERARCHY;

// Permission types
export const PERMISSIONS = {
  VIEW: "view",
  POST: "post",
  PIN: "pin",
  DELETE: "delete",
  SETTINGS: "settings",
  PROMOTE: "promote",
  BAN: "ban",
  ROLES: "roles",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Default permissions by role
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  captain: ["view", "post", "pin", "delete", "settings", "promote", "ban", "roles"],
  "co-captain": ["view", "post", "pin", "delete", "settings", "promote", "ban"],
  moderator: ["view", "post", "pin", "delete"],
  crew: ["view", "post"],
};

// Check if role has permission (for system roles)
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// Check permission with custom role support
export async function checkPermission(
  ctx: MutationCtx | QueryCtx,
  stationId: Id<"productStations">,
  username: string,
  permission: Permission
): Promise<boolean> {
  const membership = await ctx.db
    .query("stationCrews")
    .withIndex("by_station_user", (q) =>
      q.eq("stationId", stationId).eq("username", username)
    )
    .first();

  if (!membership) return false;

  // If has custom roleId, check custom role permissions
  if (membership.roleId) {
    const customRole = await ctx.db.get(membership.roleId);
    if (customRole) {
      return customRole.permissions.includes(permission);
    }
  }

  // Fall back to system role check
  return hasPermission(membership.role, permission);
}

// Require permission (throws if not allowed)
export async function requirePermission(
  ctx: MutationCtx | QueryCtx,
  stationId: Id<"productStations">,
  username: string,
  permission: Permission,
  errorMessage?: string
): Promise<void> {
  const allowed = await checkPermission(ctx, stationId, username, permission);
  if (!allowed) {
    throw new Error(errorMessage || `Missing permission: ${permission}`);
  }
}

// Legacy permission checks (for backwards compatibility)
export function canManageStation(role: string): boolean {
  return hasPermission(role, "settings");
}

export function canModerate(role: string): boolean {
  return hasPermission(role, "pin") || hasPermission(role, "delete");
}

export function canPromote(role: string): boolean {
  return hasPermission(role, "promote");
}

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

  // Get GitHub username from Clerk identity (this is the trusted source)
  // For GitHub OAuth, nickname contains the GitHub username
  const githubUsername = typeof identity.nickname === 'string' ? identity.nickname : null;

  // The actual username to use - trust Clerk identity over client-provided value
  const actualUsername = githubUsername || providedUsername;

  // First try to find user by clerkId
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();

  // If not found by clerkId, try to find by GitHub username and auto-link
  if (!user && actualUsername) {
    user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", actualUsername))
      .first();

    if (user) {
      // Auto-link clerkId to existing user
      await ctx.db.patch(user._id, {
        clerkId,
        isAuthenticated: true,
        lastLoginAt: Date.now(),
      });

      // Create builderRank if not exists
      const existingRank = await ctx.db
        .query("builderRanks")
        .withIndex("by_username", (q) => q.eq("username", actualUsername))
        .first();

      if (!existingRank) {
        const builderRankId = await ctx.db.insert("builderRanks", {
          username: actualUsername,
          tier: 1,
          shippingPoints: 0,
          communityKarma: 0,
          trustScore: 0,
          tierScore: 0,
          potenCount: 0,
          weeklyWins: 0,
          monthlyWins: 0,
          updatedAt: Date.now(),
        });
        await ctx.db.patch(user._id, { builderRankId });
      }
    }
  }

  // If still no user, auto-create from Clerk identity
  if (!user && actualUsername) {
    // Get user info from Clerk identity
    const avatarUrl = typeof identity.pictureUrl === 'string' ? identity.pictureUrl : "";
    const name = identity.name || actualUsername;

    // Create new user record
    // githubId is extracted from external account ID (format: oauth_github|<id>) or set to 0
    const externalId = identity.subject.split('|')[1];
    const githubId = externalId ? parseInt(externalId, 10) : 0;

    const userId = await ctx.db.insert("users", {
      username: actualUsername,
      name: name || actualUsername,
      avatarUrl: avatarUrl,
      githubId: isNaN(githubId) ? 0 : githubId,
      followers: 0,
      publicRepos: 0,
      totalStars: 0,
      totalForks: 0,
      lastFetchedAt: Date.now(),
      clerkId,
      isAuthenticated: true,
      lastLoginAt: Date.now(),
    });

    // Create builderRank for new user
    const builderRankId = await ctx.db.insert("builderRanks", {
      username: actualUsername,
      tier: 1,
      shippingPoints: 0,
      communityKarma: 0,
      trustScore: 0,
      tierScore: 0,
      potenCount: 0,
      weeklyWins: 0,
      monthlyWins: 0,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(userId, { builderRankId });

    user = await ctx.db.get(userId);
  }

  if (!user) {
    throw new Error("Failed to authenticate. Please sign in with GitHub.");
  }

  // Verify the user is acting as themselves (compare actual GitHub username)
  if (githubUsername && user.username.toLowerCase() !== githubUsername.toLowerCase()) {
    throw new Error(
      `Username mismatch. You are logged in as "${githubUsername}" but trying to act as "${user.username}".`
    );
  }

  return user;
}

// ============================================
// Station Queries
// ============================================

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const station = await ctx.db
      .query("productStations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!station) return null;

    // Get the linked launch if exists
    let launch = null;
    if (station.launchId) {
      launch = await ctx.db.get(station.launchId);
    }

    // Get captain (owner) info
    const ownerUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", station.ownerUsername))
      .first();

    return {
      ...station,
      launch,
      owner: ownerUser
        ? {
            username: ownerUser.username,
            avatarUrl: ownerUser.avatarUrl,
            name: ownerUser.name,
          }
        : null,
    };
  },
});

export const getById = query({
  args: { id: v.id("productStations") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const listAll = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("members"), v.literal("recent"))),
  },
  handler: async (ctx, { limit = 20, sortBy = "members" }) => {
    let stations;

    if (sortBy === "members") {
      stations = await ctx.db
        .query("productStations")
        .withIndex("by_member_count")
        .order("desc")
        .take(limit);
    } else {
      stations = await ctx.db
        .query("productStations")
        .order("desc")
        .take(limit);
    }

    // Enrich with owner info
    return Promise.all(
      stations.map(async (station) => {
        const owner = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", station.ownerUsername))
          .first();

        return {
          ...station,
          ownerAvatar: owner?.avatarUrl,
          ownerName: owner?.name,
        };
      })
    );
  },
});

export const getByOwner = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("productStations")
      .withIndex("by_owner", (q) => q.eq("ownerUsername", username))
      .collect();
  },
});

export const getUserMemberships = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const memberships = await ctx.db
      .query("stationCrews")
      .withIndex("by_user", (q) => q.eq("username", username))
      .collect();

    // Get station details for each membership
    const results = await Promise.all(
      memberships.map(async (m) => {
        const station = await ctx.db.get(m.stationId);
        if (!station) return null;
        return {
          ...m,
          station,
        };
      })
    );
    // Filter out memberships for deleted stations
    return results.filter((r) => r !== null);
  },
});

// ============================================
// Station Mutations
// ============================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    ownerUsername: v.string(),
    launchId: v.optional(v.id("launches")),
    logoUrl: v.optional(v.string()),
    accentColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.ownerUsername);

    // Generate unique slug
    let slug = generateSlug(args.name);
    let counter = 1;
    while (
      await ctx.db
        .query("productStations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first()
    ) {
      slug = `${generateSlug(args.name)}-${counter}`;
      counter++;
    }

    const stationId = await ctx.db.insert("productStations", {
      slug,
      name: args.name,
      description: args.description,
      ownerUsername: args.ownerUsername,
      launchId: args.launchId,
      logoUrl: args.logoUrl,
      accentColor: args.accentColor,
      memberCount: 1, // Owner is first member
      postCount: 0,
      weeklyActiveMembers: 1,
      status: "active",
      createdAt: Date.now(),
    });

    // Initialize default roles for the station
    await initializeStationRoles(ctx, stationId);

    // Add owner as captain
    await ctx.db.insert("stationCrews", {
      stationId,
      username: args.ownerUsername,
      role: "captain",
      karmaEarnedHere: 0,
      joinedAt: Date.now(),
    });

    // Update user's station memberships count
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.ownerUsername))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        stationMemberships: (user.stationMemberships || 0) + 1,
      });
    }

    return { stationId, slug };
  },
});

export const update = mutation({
  args: {
    stationId: v.id("productStations"),
    ownerUsername: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    accentColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.ownerUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    if (station.ownerUsername !== args.ownerUsername) {
      throw new Error("Only the station captain can update settings");
    }

    const updates: Partial<typeof station> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
    if (args.accentColor !== undefined) updates.accentColor = args.accentColor;

    await ctx.db.patch(args.stationId, updates);
    return { success: true };
  },
});

export const archive = mutation({
  args: {
    stationId: v.id("productStations"),
    ownerUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.ownerUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    if (station.ownerUsername !== args.ownerUsername) {
      throw new Error("Only the station captain can archive");
    }

    await ctx.db.patch(args.stationId, { status: "archived" });
    return { success: true };
  },
});

// ============================================
// Crew (Membership) Mutations
// ============================================

export const join = mutation({
  args: {
    stationId: v.id("productStations"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");
    if (station.status !== "active") throw new Error("Station is not active");

    // Check if already a member
    const existing = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.username)
      )
      .first();

    if (existing) throw new Error("Already a crew member");

    // Add as crew
    await ctx.db.insert("stationCrews", {
      stationId: args.stationId,
      username: args.username,
      role: "crew",
      karmaEarnedHere: 0,
      joinedAt: Date.now(),
    });

    // Update station member count
    await ctx.db.patch(args.stationId, {
      memberCount: station.memberCount + 1,
    });

    // Update user's station memberships count
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        stationMemberships: (user.stationMemberships || 0) + 1,
      });
    }

    return { success: true };
  },
});

export const leave = mutation({
  args: {
    stationId: v.id("productStations"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Captain cannot leave
    if (station.ownerUsername === args.username) {
      throw new Error("Captain cannot leave their station");
    }

    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.username)
      )
      .first();

    if (!membership) throw new Error("Not a crew member");

    await ctx.db.delete(membership._id);

    // Update station member count
    await ctx.db.patch(args.stationId, {
      memberCount: Math.max(0, station.memberCount - 1),
    });

    // Update user's station memberships count
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (user && user.stationMemberships && user.stationMemberships > 0) {
      await ctx.db.patch(user._id, {
        stationMemberships: user.stationMemberships - 1,
      });
    }

    return { success: true };
  },
});

export const getMembership = query({
  args: {
    stationId: v.id("productStations"),
    username: v.string(),
  },
  handler: async (ctx, { stationId, username }) => {
    return await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", stationId).eq("username", username)
      )
      .first();
  },
});

export const getCrewMembers = query({
  args: {
    stationId: v.id("productStations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { stationId, limit = 50 }) => {
    const crews = await ctx.db
      .query("stationCrews")
      .withIndex("by_station", (q) => q.eq("stationId", stationId))
      .take(limit);

    // Enrich with user info
    return Promise.all(
      crews.map(async (crew) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", crew.username))
          .first();

        return {
          ...crew,
          avatarUrl: user?.avatarUrl,
          name: user?.name,
        };
      })
    );
  },
});

export const promoteToModerator = mutation({
  args: {
    stationId: v.id("productStations"),
    captainUsername: v.string(),
    targetUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    if (station.ownerUsername !== args.captainUsername) {
      throw new Error("Only captain can promote members");
    }

    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.targetUsername)
      )
      .first();

    if (!membership) throw new Error("User is not a crew member");
    if (membership.role === "captain" || membership.role === "co-captain") {
      throw new Error("Cannot promote captain or co-captain to moderator");
    }

    await ctx.db.patch(membership._id, { role: "moderator" });
    return { success: true };
  },
});

// Promote to Co-Captain
export const promoteToCoCaptain = mutation({
  args: {
    stationId: v.id("productStations"),
    captainUsername: v.string(),
    targetUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Only the original captain can promote to co-captain
    if (station.ownerUsername !== args.captainUsername) {
      throw new Error("Only captain can promote to co-captain");
    }

    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.targetUsername)
      )
      .first();

    if (!membership) throw new Error("User is not a crew member");
    if (membership.role === "captain") throw new Error("Cannot change captain role");
    if (membership.role === "co-captain") throw new Error("Already a co-captain");

    await ctx.db.patch(membership._id, { role: "co-captain" });
    return { success: true };
  },
});

// Demote from Co-Captain/Moderator to Crew
export const demoteToCrew = mutation({
  args: {
    stationId: v.id("productStations"),
    captainUsername: v.string(),
    targetUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Only captain can demote
    if (station.ownerUsername !== args.captainUsername) {
      throw new Error("Only captain can demote members");
    }

    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.targetUsername)
      )
      .first();

    if (!membership) throw new Error("User is not a crew member");
    if (membership.role === "captain") throw new Error("Cannot demote captain");

    await ctx.db.patch(membership._id, { role: "crew" });
    return { success: true };
  },
});

// ============================================
// Custom Role Management
// ============================================

// Default system roles template
const DEFAULT_ROLES = [
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

// Initialize roles for a new station
export async function initializeStationRoles(ctx: MutationCtx, stationId: Id<"productStations">) {
  for (const role of DEFAULT_ROLES) {
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
}

// Get roles for a station
export const getStationRoles = query({
  args: {
    stationId: v.id("productStations"),
  },
  handler: async (ctx, { stationId }) => {
    return await ctx.db
      .query("stationRoles")
      .withIndex("by_station", (q) => q.eq("stationId", stationId))
      .collect();
  },
});

// Create custom role
export const createCustomRole = mutation({
  args: {
    stationId: v.id("productStations"),
    captainUsername: v.string(),
    name: v.string(),
    slug: v.string(),
    color: v.optional(v.string()),
    permissions: v.array(v.string()),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    if (station.ownerUsername !== args.captainUsername) {
      throw new Error("Only captain can create custom roles");
    }

    // Check for duplicate slug
    const existing = await ctx.db
      .query("stationRoles")
      .withIndex("by_station_slug", (q) =>
        q.eq("stationId", args.stationId).eq("slug", args.slug)
      )
      .first();

    if (existing) throw new Error("Role with this slug already exists");

    // Priority must be less than captain (100)
    if (args.priority >= 100) {
      throw new Error("Custom role priority must be less than 100");
    }

    const roleId = await ctx.db.insert("stationRoles", {
      stationId: args.stationId,
      name: args.name,
      slug: args.slug,
      color: args.color,
      permissions: args.permissions,
      priority: args.priority,
      isDefault: false,
      isSystem: false,
      createdAt: Date.now(),
    });

    return { roleId };
  },
});

// Update custom role
export const updateCustomRole = mutation({
  args: {
    roleId: v.id("stationRoles"),
    captainUsername: v.string(),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");

    const station = await ctx.db.get(role.stationId);
    if (!station) throw new Error("Station not found");

    if (station.ownerUsername !== args.captainUsername) {
      throw new Error("Only captain can update roles");
    }

    if (role.isSystem) {
      throw new Error("Cannot modify system roles");
    }

    const updates: Record<string, unknown> = {};
    if (args.name) updates.name = args.name;
    if (args.color) updates.color = args.color;
    if (args.permissions) updates.permissions = args.permissions;
    if (args.priority !== undefined) {
      if (args.priority >= 100) throw new Error("Priority must be less than 100");
      updates.priority = args.priority;
    }

    await ctx.db.patch(args.roleId, updates);
    return { success: true };
  },
});

// Delete custom role
export const deleteCustomRole = mutation({
  args: {
    roleId: v.id("stationRoles"),
    captainUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");

    const station = await ctx.db.get(role.stationId);
    if (!station) throw new Error("Station not found");

    if (station.ownerUsername !== args.captainUsername) {
      throw new Error("Only captain can delete roles");
    }

    if (role.isSystem) {
      throw new Error("Cannot delete system roles");
    }

    // Move members with this role to default crew role
    const members = await ctx.db
      .query("stationCrews")
      .withIndex("by_station", (q) => q.eq("stationId", role.stationId))
      .collect();

    for (const member of members) {
      if (member.roleId === args.roleId) {
        await ctx.db.patch(member._id, { role: "crew", roleId: undefined });
      }
    }

    await ctx.db.delete(args.roleId);
    return { success: true };
  },
});

// Assign custom role to member
export const assignRole = mutation({
  args: {
    stationId: v.id("productStations"),
    captainUsername: v.string(),
    targetUsername: v.string(),
    roleSlug: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Check if user can promote (captain or co-captain)
    const promoterMembership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.captainUsername)
      )
      .first();

    if (!promoterMembership || !canManageStation(promoterMembership.role)) {
      throw new Error("Only captain or co-captain can assign roles");
    }

    // Get target membership
    const targetMembership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.targetUsername)
      )
      .first();

    if (!targetMembership) throw new Error("User is not a member");
    if (targetMembership.role === "captain") throw new Error("Cannot change captain role");

    // Get the role
    const role = await ctx.db
      .query("stationRoles")
      .withIndex("by_station_slug", (q) =>
        q.eq("stationId", args.stationId).eq("slug", args.roleSlug)
      )
      .first();

    if (!role) throw new Error("Role not found");

    // Co-captain cannot assign co-captain or higher roles
    if (promoterMembership.role === "co-captain" && role.priority >= 90) {
      throw new Error("Co-captain cannot assign co-captain or higher roles");
    }

    await ctx.db.patch(targetMembership._id, {
      role: args.roleSlug,
      roleId: role._id,
    });

    return { success: true };
  },
});

// ============================================
// Member Moderation (Ban/Mute)
// ============================================

// Generate random invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Log audit action
async function logAuditAction(
  ctx: MutationCtx,
  stationId: Id<"productStations">,
  action: string,
  actorUsername: string,
  targetUsername?: string,
  details?: Record<string, unknown>
) {
  await ctx.db.insert("stationAuditLog", {
    stationId,
    action,
    actorUsername,
    targetUsername,
    details: details ? JSON.stringify(details) : undefined,
    timestamp: Date.now(),
  });
}

// Ban a member
export const banMember = mutation({
  args: {
    stationId: v.id("productStations"),
    moderatorUsername: v.string(),
    targetUsername: v.string(),
    reason: v.optional(v.string()),
    durationHours: v.optional(v.number()), // null = permanent
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.moderatorUsername);
    await requirePermission(
      ctx,
      args.stationId,
      args.moderatorUsername,
      "ban",
      "You do not have permission to ban members"
    );

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    // Cannot ban captain
    if (args.targetUsername === station.ownerUsername) {
      throw new Error("Cannot ban the station captain");
    }

    // Check if already banned
    const existingBan = await ctx.db
      .query("stationModeration")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("targetUsername", args.targetUsername)
      )
      .filter((q) => q.and(q.eq(q.field("action"), "ban"), q.eq(q.field("isActive"), true)))
      .first();

    if (existingBan) throw new Error("User is already banned");

    // Remove from crew
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.targetUsername)
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
      await ctx.db.patch(args.stationId, {
        memberCount: Math.max(0, station.memberCount - 1),
      });
    }

    // Create ban record
    await ctx.db.insert("stationModeration", {
      stationId: args.stationId,
      targetUsername: args.targetUsername,
      action: "ban",
      reason: args.reason,
      expiresAt: args.durationHours ? Date.now() + args.durationHours * 60 * 60 * 1000 : undefined,
      issuedBy: args.moderatorUsername,
      issuedAt: Date.now(),
      isActive: true,
    });

    await logAuditAction(ctx, args.stationId, "member_ban", args.moderatorUsername, args.targetUsername, {
      reason: args.reason,
      durationHours: args.durationHours,
    });

    return { success: true };
  },
});

// Unban a member
export const unbanMember = mutation({
  args: {
    stationId: v.id("productStations"),
    moderatorUsername: v.string(),
    targetUsername: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.moderatorUsername);
    await requirePermission(
      ctx,
      args.stationId,
      args.moderatorUsername,
      "ban",
      "You do not have permission to unban members"
    );

    const ban = await ctx.db
      .query("stationModeration")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("targetUsername", args.targetUsername)
      )
      .filter((q) => q.and(q.eq(q.field("action"), "ban"), q.eq(q.field("isActive"), true)))
      .first();

    if (!ban) throw new Error("User is not banned");

    await ctx.db.patch(ban._id, {
      isActive: false,
      liftedBy: args.moderatorUsername,
      liftedAt: Date.now(),
    });

    await logAuditAction(ctx, args.stationId, "member_unban", args.moderatorUsername, args.targetUsername);

    return { success: true };
  },
});

// Mute a member (can post but posts are hidden by default)
export const muteMember = mutation({
  args: {
    stationId: v.id("productStations"),
    moderatorUsername: v.string(),
    targetUsername: v.string(),
    reason: v.optional(v.string()),
    durationHours: v.number(), // Required for mutes
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.moderatorUsername);
    await requirePermission(
      ctx,
      args.stationId,
      args.moderatorUsername,
      "ban",
      "You do not have permission to mute members"
    );

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");

    if (args.targetUsername === station.ownerUsername) {
      throw new Error("Cannot mute the station captain");
    }

    await ctx.db.insert("stationModeration", {
      stationId: args.stationId,
      targetUsername: args.targetUsername,
      action: "mute",
      reason: args.reason,
      expiresAt: Date.now() + args.durationHours * 60 * 60 * 1000,
      issuedBy: args.moderatorUsername,
      issuedAt: Date.now(),
      isActive: true,
    });

    await logAuditAction(ctx, args.stationId, "member_mute", args.moderatorUsername, args.targetUsername, {
      reason: args.reason,
      durationHours: args.durationHours,
    });

    return { success: true };
  },
});

// Check if user is banned/muted
export const checkMemberStatus = query({
  args: {
    stationId: v.id("productStations"),
    username: v.string(),
  },
  handler: async (ctx, { stationId, username }) => {
    const moderations = await ctx.db
      .query("stationModeration")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", stationId).eq("targetUsername", username)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const now = Date.now();
    const activeModerations = moderations.filter(
      (m) => !m.expiresAt || m.expiresAt > now
    );

    return {
      isBanned: activeModerations.some((m) => m.action === "ban"),
      isMuted: activeModerations.some((m) => m.action === "mute"),
      moderations: activeModerations,
    };
  },
});

// Get banned/muted members
export const getModerationList = query({
  args: {
    stationId: v.id("productStations"),
  },
  handler: async (ctx, { stationId }) => {
    return await ctx.db
      .query("stationModeration")
      .withIndex("by_station_active", (q) =>
        q.eq("stationId", stationId).eq("isActive", true)
      )
      .collect();
  },
});

// ============================================
// Station Invites
// ============================================

// Create invite
export const createInvite = mutation({
  args: {
    stationId: v.id("productStations"),
    creatorUsername: v.string(),
    invitedUsername: v.optional(v.string()),
    roleOnJoin: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    expiresInHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.creatorUsername);
    await requirePermission(
      ctx,
      args.stationId,
      args.creatorUsername,
      "promote",
      "You do not have permission to create invites"
    );

    const inviteCode = generateInviteCode();

    const inviteId = await ctx.db.insert("stationInvites", {
      stationId: args.stationId,
      invitedUsername: args.invitedUsername,
      inviteCode,
      invitedBy: args.creatorUsername,
      roleOnJoin: args.roleOnJoin || "crew",
      maxUses: args.maxUses,
      usedCount: 0,
      expiresAt: args.expiresInHours
        ? Date.now() + args.expiresInHours * 60 * 60 * 1000
        : undefined,
      createdAt: Date.now(),
      isActive: true,
    });

    await logAuditAction(ctx, args.stationId, "invite_create", args.creatorUsername, undefined, {
      inviteCode,
      invitedUsername: args.invitedUsername,
      roleOnJoin: args.roleOnJoin,
    });

    return { inviteId, inviteCode };
  },
});

// Use invite to join
export const useInvite = mutation({
  args: {
    inviteCode: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const invite = await ctx.db
      .query("stationInvites")
      .withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!invite) throw new Error("Invalid invite code");
    if (!invite.isActive) throw new Error("This invite is no longer active");
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new Error("This invite has expired");
    }
    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      throw new Error("This invite has reached its usage limit");
    }
    if (invite.invitedUsername && invite.invitedUsername !== args.username) {
      throw new Error("This invite is for a specific user");
    }

    const station = await ctx.db.get(invite.stationId);
    if (!station) throw new Error("Station not found");

    // Check if already member
    const existing = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", invite.stationId).eq("username", args.username)
      )
      .first();

    if (existing) throw new Error("You are already a member");

    // Check if banned
    const ban = await ctx.db
      .query("stationModeration")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", invite.stationId).eq("targetUsername", args.username)
      )
      .filter((q) => q.and(q.eq(q.field("action"), "ban"), q.eq(q.field("isActive"), true)))
      .first();

    if (ban && (!ban.expiresAt || ban.expiresAt > Date.now())) {
      throw new Error("You are banned from this station");
    }

    // Join the station
    await ctx.db.insert("stationCrews", {
      stationId: invite.stationId,
      username: args.username,
      role: invite.roleOnJoin,
      karmaEarnedHere: 0,
      joinedAt: Date.now(),
    });

    await ctx.db.patch(invite.stationId, {
      memberCount: station.memberCount + 1,
    });

    // Update invite usage
    await ctx.db.patch(invite._id, {
      usedCount: invite.usedCount + 1,
    });

    // Update user's station memberships count
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        stationMemberships: (user.stationMemberships || 0) + 1,
      });
    }

    await logAuditAction(ctx, invite.stationId, "member_join_invite", args.username, undefined, {
      inviteCode: args.inviteCode,
      role: invite.roleOnJoin,
    });

    return { stationId: invite.stationId, role: invite.roleOnJoin };
  },
});

// Get station invites
export const getInvites = query({
  args: {
    stationId: v.id("productStations"),
  },
  handler: async (ctx, { stationId }) => {
    return await ctx.db
      .query("stationInvites")
      .withIndex("by_station_active", (q) =>
        q.eq("stationId", stationId).eq("isActive", true)
      )
      .collect();
  },
});

// Revoke invite
export const revokeInvite = mutation({
  args: {
    inviteId: v.id("stationInvites"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");

    await requirePermission(
      ctx,
      invite.stationId,
      args.username,
      "promote",
      "You do not have permission to revoke invites"
    );

    await ctx.db.patch(args.inviteId, { isActive: false });

    await logAuditAction(ctx, invite.stationId, "invite_revoke", args.username, undefined, {
      inviteCode: invite.inviteCode,
    });

    return { success: true };
  },
});

// Get audit log
export const getAuditLog = query({
  args: {
    stationId: v.id("productStations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { stationId, limit = 50 }) => {
    return await ctx.db
      .query("stationAuditLog")
      .withIndex("by_station_time", (q) => q.eq("stationId", stationId))
      .order("desc")
      .take(limit);
  },
});

// ============================================
// Station Posts Queries
// ============================================

export const getPosts = query({
  args: {
    stationId: v.id("productStations"),
    postType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { stationId, postType, limit = 20 }) => {
    let postsQuery;

    if (postType) {
      postsQuery = ctx.db
        .query("stationPosts")
        .withIndex("by_station_type", (q) =>
          q.eq("stationId", stationId).eq("postType", postType)
        );
    } else {
      postsQuery = ctx.db
        .query("stationPosts")
        .withIndex("by_station", (q) => q.eq("stationId", stationId));
    }

    const posts = await postsQuery.order("desc").take(limit);

    // Enrich with author info
    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", post.authorUsername))
          .first();

        return {
          ...post,
          authorAvatar: author?.avatarUrl,
          authorName: author?.name,
        };
      })
    );
  },
});

export const getPost = query({
  args: { postId: v.id("stationPosts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;

    const author = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", post.authorUsername))
      .first();

    const station = await ctx.db.get(post.stationId);

    return {
      ...post,
      authorAvatar: author?.avatarUrl,
      authorName: author?.name,
      stationName: station?.name,
      stationSlug: station?.slug,
    };
  },
});

// ============================================
// Station Posts Mutations
// ============================================

export const createPost = mutation({
  args: {
    stationId: v.id("productStations"),
    authorUsername: v.string(),
    postType: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.authorUsername);

    const station = await ctx.db.get(args.stationId);
    if (!station) throw new Error("Station not found");
    if (station.status !== "active") throw new Error("Station is not active");

    // Check if user is a member
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("username", args.authorUsername)
      )
      .first();

    if (!membership) throw new Error("You must join the station to post");

    // Check if user is muted
    const modStatus = await ctx.db
      .query("stationModeration")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", args.stationId).eq("targetUsername", args.authorUsername)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (modStatus && modStatus.action === "mute" && (!modStatus.expiresAt || modStatus.expiresAt > Date.now())) {
      throw new Error("You are currently muted in this station");
    }

    const isOwnerPost = station.ownerUsername === args.authorUsername;

    const postId = await ctx.db.insert("stationPosts", {
      stationId: args.stationId,
      authorUsername: args.authorUsername,
      postType: args.postType,
      title: args.title,
      content: args.content,
      isOwnerPost,
      isPinned: false,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      createdAt: Date.now(),
    });

    // Update station post count
    await ctx.db.patch(args.stationId, {
      postCount: station.postCount + 1,
    });

    // Award cross-station karma if posting in someone else's station
    if (!isOwnerPost) {
      await awardCrossStationKarma(ctx, args.authorUsername, args.stationId, args.postType);
    }

    return { postId };
  },
});

export const pinPost = mutation({
  args: {
    postId: v.id("stationPosts"),
    captainUsername: v.string(),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.captainUsername);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const station = await ctx.db.get(post.stationId);
    if (!station) throw new Error("Station not found");

    // Only captain, co-captain, or moderators can pin
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", post.stationId).eq("username", args.captainUsername)
      )
      .first();

    if (!membership || !canModerate(membership.role)) {
      throw new Error("Only captain, co-captain, or moderators can pin posts");
    }

    await ctx.db.patch(args.postId, { isPinned: args.isPinned });
    return { success: true };
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("stationPosts"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const station = await ctx.db.get(post.stationId);
    if (!station) throw new Error("Station not found");

    // Author or moderator/captain can delete
    const canDelete =
      post.authorUsername === args.username ||
      station.ownerUsername === args.username;

    if (!canDelete) {
      const membership = await ctx.db
        .query("stationCrews")
        .withIndex("by_station_user", (q) =>
          q.eq("stationId", post.stationId).eq("username", args.username)
        )
        .first();

      if (!membership || !canModerate(membership.role)) {
        throw new Error("You do not have permission to delete this post");
      }
    }

    await ctx.db.delete(args.postId);

    // Update station post count
    await ctx.db.patch(station._id, {
      postCount: Math.max(0, station.postCount - 1),
    });

    return { success: true };
  },
});

// Edit post (author only)
export const editPost = mutation({
  args: {
    postId: v.id("stationPosts"),
    username: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Only author can edit
    if (post.authorUsername !== args.username) {
      throw new Error("Only the author can edit this post");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      isEdited: true,
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;

    await ctx.db.patch(args.postId, updates);
    return { success: true };
  },
});

// ============================================
// Station Post Voting
// ============================================

// Check if user has voted on a post
export const hasVotedOnPost = query({
  args: {
    postId: v.id("stationPosts"),
    username: v.string(),
  },
  handler: async (ctx, { postId, username }) => {
    const vote = await ctx.db
      .query("stationPostVotes")
      .withIndex("by_post_voter", (q) =>
        q.eq("postId", postId).eq("voterUsername", username)
      )
      .first();

    return vote ? { voted: true, voteType: vote.voteType } : { voted: false };
  },
});

// Upvote a post
export const upvotePost = mutation({
  args: {
    postId: v.id("stationPosts"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Check if user is a member
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", post.stationId).eq("username", args.username)
      )
      .first();

    if (!membership) throw new Error("You must be a member to vote");

    // Check existing vote
    const existingVote = await ctx.db
      .query("stationPostVotes")
      .withIndex("by_post_voter", (q) =>
        q.eq("postId", args.postId).eq("voterUsername", args.username)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === "up") {
        // Remove upvote
        await ctx.db.delete(existingVote._id);
        await ctx.db.patch(args.postId, { upvotes: Math.max(0, post.upvotes - 1) });
        return { action: "removed" };
      } else {
        // Change from downvote to upvote
        await ctx.db.patch(existingVote._id, { voteType: "up", createdAt: Date.now() });
        await ctx.db.patch(args.postId, {
          upvotes: post.upvotes + 1,
          downvotes: Math.max(0, post.downvotes - 1),
        });
        return { action: "changed" };
      }
    }

    // New upvote
    await ctx.db.insert("stationPostVotes", {
      postId: args.postId,
      voterUsername: args.username,
      voteType: "up",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, { upvotes: post.upvotes + 1 });

    // Award karma if voting on someone else's post
    if (post.authorUsername !== args.username) {
      await awardCrossStationKarma(ctx, args.username, post.stationId, "vote");
    }

    return { action: "upvoted" };
  },
});

// Downvote a post
export const downvotePost = mutation({
  args: {
    postId: v.id("stationPosts"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Check if user is a member
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", post.stationId).eq("username", args.username)
      )
      .first();

    if (!membership) throw new Error("You must be a member to vote");

    // Check existing vote
    const existingVote = await ctx.db
      .query("stationPostVotes")
      .withIndex("by_post_voter", (q) =>
        q.eq("postId", args.postId).eq("voterUsername", args.username)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === "down") {
        // Remove downvote
        await ctx.db.delete(existingVote._id);
        await ctx.db.patch(args.postId, { downvotes: Math.max(0, post.downvotes - 1) });
        return { action: "removed" };
      } else {
        // Change from upvote to downvote
        await ctx.db.patch(existingVote._id, { voteType: "down", createdAt: Date.now() });
        await ctx.db.patch(args.postId, {
          upvotes: Math.max(0, post.upvotes - 1),
          downvotes: post.downvotes + 1,
        });
        return { action: "changed" };
      }
    }

    // New downvote
    await ctx.db.insert("stationPostVotes", {
      postId: args.postId,
      voterUsername: args.username,
      voteType: "down",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, { downvotes: post.downvotes + 1 });
    return { action: "downvoted" };
  },
});

// ============================================
// Station Comments
// ============================================

// Get comments for a post
export const getComments = query({
  args: {
    postId: v.id("stationPosts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { postId, limit = 50 }) => {
    const comments = await ctx.db
      .query("stationComments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .take(limit);

    // Enrich with author info
    return Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", comment.authorUsername))
          .first();

        return {
          ...comment,
          authorAvatar: user?.avatarUrl,
          authorName: user?.name,
        };
      })
    );
  },
});

// Get threaded comments (organized by parent)
export const getThreadedComments = query({
  args: {
    postId: v.id("stationPosts"),
  },
  handler: async (ctx, { postId }) => {
    const allComments = await ctx.db
      .query("stationComments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    // Enrich with author info
    const enriched = await Promise.all(
      allComments.map(async (comment) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", comment.authorUsername))
          .first();

        return {
          ...comment,
          authorAvatar: user?.avatarUrl,
          authorName: user?.name,
          replies: [] as typeof allComments,
        };
      })
    );

    // Organize into tree structure
    const commentMap = new Map(enriched.map((c) => [c._id.toString(), c]));
    const rootComments: typeof enriched = [];

    for (const comment of enriched) {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    }

    // Sort by upvotes - downvotes
    rootComments.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

    return rootComments;
  },
});

// Create a comment
export const createComment = mutation({
  args: {
    postId: v.id("stationPosts"),
    username: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("stationComments")),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const station = await ctx.db.get(post.stationId);
    if (!station) throw new Error("Station not found");

    // Check membership
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", post.stationId).eq("username", args.username)
      )
      .first();

    if (!membership) throw new Error("You must be a member to comment");

    // Check if muted
    const modStatus = await ctx.db
      .query("stationModeration")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", post.stationId).eq("targetUsername", args.username)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (modStatus && modStatus.action === "mute" && (!modStatus.expiresAt || modStatus.expiresAt > Date.now())) {
      throw new Error("You are currently muted in this station");
    }

    // Calculate depth
    let depth = 0;
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) throw new Error("Parent comment not found");
      depth = parent.depth + 1;
      if (depth > 3) throw new Error("Maximum reply depth reached");
    }

    const commentId = await ctx.db.insert("stationComments", {
      postId: args.postId,
      stationId: post.stationId,
      authorUsername: args.username,
      content: args.content,
      parentId: args.parentId,
      depth,
      upvotes: 0,
      downvotes: 0,
      createdAt: Date.now(),
    });

    // Update post comment count
    await ctx.db.patch(args.postId, { commentCount: post.commentCount + 1 });

    // Award karma for commenting
    if (post.authorUsername !== args.username) {
      await awardCrossStationKarma(ctx, args.username, post.stationId, "discussion");
    }

    return { commentId };
  },
});

// Edit a comment
export const editComment = mutation({
  args: {
    commentId: v.id("stationComments"),
    username: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.authorUsername !== args.username) {
      throw new Error("Only the author can edit this comment");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
      isEdited: true,
    });

    return { success: true };
  },
});

// Helper to recursively delete comments and their children
async function deleteCommentCascade(
  ctx: MutationCtx,
  commentId: Id<"stationComments">
): Promise<number> {
  // Find and delete all children first
  const children = await ctx.db
    .query("stationComments")
    .withIndex("by_parent", (q) => q.eq("parentId", commentId))
    .collect();

  let deletedCount = 0;
  for (const child of children) {
    deletedCount += await deleteCommentCascade(ctx, child._id);
  }

  // Delete this comment
  await ctx.db.delete(commentId);
  return deletedCount + 1;
}

// Delete a comment
export const deleteComment = mutation({
  args: {
    commentId: v.id("stationComments"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const station = await ctx.db.get(comment.stationId);
    if (!station) throw new Error("Station not found");

    // Check permission: author, moderator, or captain
    const canDeleteComment =
      comment.authorUsername === args.username ||
      station.ownerUsername === args.username;

    if (!canDeleteComment) {
      const membership = await ctx.db
        .query("stationCrews")
        .withIndex("by_station_user", (q) =>
          q.eq("stationId", comment.stationId).eq("username", args.username)
        )
        .first();

      if (!membership || !canModerate(membership.role)) {
        throw new Error("You do not have permission to delete this comment");
      }
    }

    // Delete comment and all replies (cascade)
    const deletedCount = await deleteCommentCascade(ctx, args.commentId);

    // Update post comment count
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, post.commentCount - deletedCount),
      });
    }

    return { success: true };
  },
});

// ============================================
// Station Comment Voting
// ============================================

// Check if user has voted on a comment
export const hasVotedOnComment = query({
  args: {
    commentId: v.id("stationComments"),
    username: v.string(),
  },
  handler: async (ctx, { commentId, username }) => {
    const vote = await ctx.db
      .query("stationCommentVotes")
      .withIndex("by_comment_voter", (q) =>
        q.eq("commentId", commentId).eq("voterUsername", username)
      )
      .first();

    return vote ? { voted: true, voteType: vote.voteType } : { voted: false };
  },
});

// Upvote a comment
export const upvoteComment = mutation({
  args: {
    commentId: v.id("stationComments"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    // Check membership
    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", comment.stationId).eq("username", args.username)
      )
      .first();

    if (!membership) throw new Error("You must be a member to vote");

    const existingVote = await ctx.db
      .query("stationCommentVotes")
      .withIndex("by_comment_voter", (q) =>
        q.eq("commentId", args.commentId).eq("voterUsername", args.username)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === "up") {
        await ctx.db.delete(existingVote._id);
        await ctx.db.patch(args.commentId, { upvotes: Math.max(0, comment.upvotes - 1) });
        return { action: "removed" };
      } else {
        await ctx.db.patch(existingVote._id, { voteType: "up", createdAt: Date.now() });
        await ctx.db.patch(args.commentId, {
          upvotes: comment.upvotes + 1,
          downvotes: Math.max(0, comment.downvotes - 1),
        });
        return { action: "changed" };
      }
    }

    await ctx.db.insert("stationCommentVotes", {
      commentId: args.commentId,
      voterUsername: args.username,
      voteType: "up",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.commentId, { upvotes: comment.upvotes + 1 });
    return { action: "upvoted" };
  },
});

// Downvote a comment
export const downvoteComment = mutation({
  args: {
    commentId: v.id("stationComments"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAuthenticatedUser(ctx, args.username);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const membership = await ctx.db
      .query("stationCrews")
      .withIndex("by_station_user", (q) =>
        q.eq("stationId", comment.stationId).eq("username", args.username)
      )
      .first();

    if (!membership) throw new Error("You must be a member to vote");

    const existingVote = await ctx.db
      .query("stationCommentVotes")
      .withIndex("by_comment_voter", (q) =>
        q.eq("commentId", args.commentId).eq("voterUsername", args.username)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === "down") {
        await ctx.db.delete(existingVote._id);
        await ctx.db.patch(args.commentId, { downvotes: Math.max(0, comment.downvotes - 1) });
        return { action: "removed" };
      } else {
        await ctx.db.patch(existingVote._id, { voteType: "down", createdAt: Date.now() });
        await ctx.db.patch(args.commentId, {
          upvotes: Math.max(0, comment.upvotes - 1),
          downvotes: comment.downvotes + 1,
        });
        return { action: "changed" };
      }
    }

    await ctx.db.insert("stationCommentVotes", {
      commentId: args.commentId,
      voterUsername: args.username,
      voteType: "down",
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.commentId, { downvotes: comment.downvotes + 1 });
    return { action: "downvoted" };
  },
});

// ============================================
// Auto-create Station from Poten Launch
// ============================================

export const createFromPotenLaunch = mutation({
  args: {
    launchId: v.id("launches"),
  },
  handler: async (ctx, { launchId }) => {
    const launch = await ctx.db.get(launchId);
    if (!launch) throw new Error("Launch not found");

    if (!launch.isPoten) {
      throw new Error("Only Poten launches can create stations");
    }

    // Check if station already exists for this launch
    const existing = await ctx.db
      .query("productStations")
      .withIndex("by_launch", (q) => q.eq("launchId", launchId))
      .first();

    if (existing) {
      return { stationId: existing._id, slug: existing.slug, alreadyExists: true };
    }

    // Generate unique slug
    let slug = generateSlug(launch.title);
    let counter = 1;
    while (
      await ctx.db
        .query("productStations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
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
    await initializeStationRoles(ctx, stationId);

    // Add owner as captain
    await ctx.db.insert("stationCrews", {
      stationId,
      username: launch.username,
      role: "captain",
      karmaEarnedHere: 0,
      joinedAt: Date.now(),
    });

    // Auto-add all voters as crew members
    const voters = await ctx.db
      .query("votes")
      .withIndex("by_launch", (q) => q.eq("launchId", launchId))
      .collect();

    let memberCount = 1; // Start with owner
    for (const voter of voters) {
      if (voter.voterUsername === launch.username) continue; // Skip owner

      await ctx.db.insert("stationCrews", {
        stationId,
        username: voter.voterUsername,
        role: "crew",
        karmaEarnedHere: 0,
        joinedAt: Date.now(),
      });

      // Update user's station memberships count
      const user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", voter.voterUsername))
        .first();

      if (user) {
        await ctx.db.patch(user._id, {
          stationMemberships: (user.stationMemberships || 0) + 1,
        });
      }

      memberCount++;
    }

    // Update final member count
    await ctx.db.patch(stationId, { memberCount });

    // Update owner's station memberships count
    const ownerUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", launch.username))
      .first();

    if (ownerUser) {
      await ctx.db.patch(ownerUser._id, {
        stationMemberships: (ownerUser.stationMemberships || 0) + 1,
      });
    }

    return { stationId, slug, memberCount };
  },
});

// ============================================
// Cross-Station Karma Helper
// ============================================

const KARMA_REWARDS: Record<string, number> = {
  feedback: 5,
  bug: 8,
  feature: 5,
  discussion: 2,
  question: 2,
  vote: 1, // Small reward for voting
  update: 0, // Only owner posts updates, no karma
};

function calculatePromotionBoost(externalKarma: number): number {
  if (externalKarma <= 0) return 1;
  return Math.min(3, 1 + Math.log10(Math.max(1, externalKarma / 50)));
}

async function awardCrossStationKarma(
  ctx: MutationCtx,
  username: string,
  stationId: import("./_generated/dataModel").Id<"productStations">,
  postType: string
) {
  const station = await ctx.db.get(stationId);
  if (!station || station.ownerUsername === username) return;

  const karma = KARMA_REWARDS[postType] || 2;
  if (karma === 0) return;

  // Update crew membership karma
  const membership = await ctx.db
    .query("stationCrews")
    .withIndex("by_station_user", (q) =>
      q.eq("stationId", stationId).eq("username", username)
    )
    .first();

  if (membership) {
    await ctx.db.patch(membership._id, {
      karmaEarnedHere: membership.karmaEarnedHere + karma,
    });
  }

  // Update global cross-station karma
  const existing = await ctx.db
    .query("crossStationKarma")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();

  if (existing) {
    const newKarma = existing.externalKarma + karma;
    await ctx.db.patch(existing._id, {
      externalKarma: newKarma,
      promotionBoostEarned: calculatePromotionBoost(newKarma),
      updatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("crossStationKarma", {
      username,
      externalKarma: karma,
      uniqueStationsHelped: 1,
      promotionBoostEarned: calculatePromotionBoost(karma),
      updatedAt: Date.now(),
    });
  }

  // Also update builder rank's community karma
  const builderRank = await ctx.db
    .query("builderRanks")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();

  if (builderRank) {
    await ctx.db.patch(builderRank._id, {
      communityKarma: builderRank.communityKarma + karma,
      updatedAt: Date.now(),
    });
  }
}
