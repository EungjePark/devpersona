/**
 * Seed action for populating the database with famous GitHub developers
 * This helps create an engaging leaderboard from the start
 */

import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Famous GitHub developers - curated list
const FAMOUS_DEVELOPERS = [
  // Language & Platform Creators
  { username: "torvalds", known_for: "Linux creator, Git inventor" },
  { username: "gvanrossum", known_for: "Python creator" },
  { username: "ry", known_for: "Node.js and Deno creator" },
  { username: "matz", known_for: "Ruby creator" },
  { username: "graydon", known_for: "Rust creator" },
  { username: "lattner", known_for: "LLVM, Swift creator" },

  // Framework Creators
  { username: "DHH", known_for: "Ruby on Rails creator" },
  { username: "yyx990803", known_for: "Vue.js creator" },
  { username: "Rich-Harris", known_for: "Svelte creator" },
  { username: "gaearon", known_for: "React core team, Redux" },
  { username: "tj", known_for: "Express.js creator" },
  { username: "rauchg", known_for: "Next.js, Vercel CEO" },
  { username: "jeresig", known_for: "jQuery creator" },
  { username: "wycats", known_for: "Ember.js creator" },
  { username: "shadcn", known_for: "shadcn/ui creator" },

  // Prolific Contributors
  { username: "sindresorhus", known_for: "Awesome lists, npm packages" },
  { username: "feross", known_for: "WebTorrent, StandardJS" },
  { username: "addyosmani", known_for: "Chrome DevTools, Lighthouse" },
  { username: "kentcdodds", known_for: "Testing Library, educator" },
  { username: "getify", known_for: "You Don't Know JS author" },
  { username: "paulirish", known_for: "Chrome DevTools, HTML5 Boilerplate" },
  { username: "wesbos", known_for: "JavaScript educator" },
  { username: "tannerlinsley", known_for: "TanStack (React Query)" },
  { username: "isaacs", known_for: "npm founder" },

  // Modern Framework Leaders
  { username: "trpc", known_for: "tRPC creator" },
  { username: "colinhacks", known_for: "Zod creator" },
  { username: "jaredpalmer", known_for: "Formik creator" },
  { username: "kripod", known_for: "React performance" },
  { username: "antfu", known_for: "Vue/Vite ecosystem" },
  { username: "pacocoursey", known_for: "Sonner, cmdk creator" },

  // AI & Dev Tools
  { username: "jxnl", known_for: "Instructor, AI engineering" },
  { username: "shuding", known_for: "SWR, Nextra creator" },
  { username: "leerob", known_for: "Vercel DX" },

  // Additional notable developers
  { username: "cassidoo", known_for: "Developer advocate, educator" },
  { username: "sdras", known_for: "Vue.js core team, SVG animation" },
  { username: "ThePrimeagen", known_for: "Developer content creator" },
  { username: "fireship-io", known_for: "Fireship YouTube channel" },
  { username: "developit", known_for: "Preact creator" },
  { username: "bmeck", known_for: "Node.js core" },
  { username: "tiangolo", known_for: "FastAPI creator" },
];

// Internal mutation to save seeded analysis
export const saveSeedAnalysis = internalMutation({
  args: {
    username: v.string(),
    avatarUrl: v.string(),
    name: v.optional(v.string()),
    grit: v.number(),
    focus: v.number(),
    craft: v.number(),
    impact: v.number(),
    voice: v.number(),
    reach: v.number(),
    overallRating: v.number(),
    tier: v.string(),
    archetypeId: v.string(),
    analyzedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for existing analysis
    const existing = await ctx.db
      .query("analyses")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("analyses", args);
    }
  },
});

// Seed action - analyzes famous developers and stores them
export const seedFamousDevs = action({
  args: {
    baseUrl: v.string(), // Base URL of the app (e.g., http://localhost:3000)
    limit: v.optional(v.number()), // Optional limit for testing
  },
  handler: async (ctx, { baseUrl, limit }) => {
    const developers = limit ? FAMOUS_DEVELOPERS.slice(0, limit) : FAMOUS_DEVELOPERS;
    const results: { username: string; status: string; rating?: number }[] = [];

    for (const dev of developers) {
      try {
        // Call the analyze endpoint
        const response = await fetch(`${baseUrl}/api/analyze/${dev.username}`);

        if (!response.ok) {
          results.push({ username: dev.username, status: `Error: ${response.status}` });
          continue;
        }

        const data = await response.json();

        if (data.error) {
          results.push({ username: dev.username, status: `API Error: ${data.error}` });
          continue;
        }

        // Save to database
        await ctx.runMutation(internal.seed.saveSeedAnalysis, {
          username: data.username,
          avatarUrl: data.avatarUrl,
          name: data.name ?? undefined,
          grit: data.signals.grit,
          focus: data.signals.focus,
          craft: data.signals.craft,
          impact: data.signals.impact,
          voice: data.signals.voice,
          reach: data.signals.reach,
          overallRating: data.overallRating,
          tier: data.tier.level,
          archetypeId: data.archetype.id,
          analyzedAt: Date.now(),
        });

        results.push({
          username: dev.username,
          status: "Success",
          rating: data.overallRating,
        });

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          username: dev.username,
          status: `Exception: ${error instanceof Error ? error.message : "Unknown"}`,
        });
      }
    }

    return {
      total: developers.length,
      successful: results.filter((r) => r.status === "Success").length,
      results,
    };
  },
});

// Get list of famous developers (for UI display)
export const getFamousDevelopersList = action({
  handler: async () => {
    return FAMOUS_DEVELOPERS;
  },
});

// Pre-calculated analysis data for famous developers (no GitHub API needed)
// This allows instant seeding without rate limit concerns
const PRECALCULATED_ANALYSES = [
  { username: "torvalds", avatarUrl: "https://avatars.githubusercontent.com/u/1024025?v=4", grit: 99, focus: 95, craft: 98, impact: 99, voice: 88, reach: 99, tier: "S", archetypeId: "maintainer" },
  { username: "sindresorhus", avatarUrl: "https://avatars.githubusercontent.com/u/170270?v=4", grit: 98, focus: 72, craft: 99, impact: 98, voice: 75, reach: 99, tier: "S", archetypeId: "silent_builder" },
  { username: "yyx990803", avatarUrl: "https://avatars.githubusercontent.com/u/499550?v=4", grit: 96, focus: 92, craft: 97, impact: 96, voice: 85, reach: 98, tier: "S", archetypeId: "maintainer" },
  { username: "gaearon", avatarUrl: "https://avatars.githubusercontent.com/u/810438?v=4", grit: 92, focus: 88, craft: 95, impact: 94, voice: 92, reach: 96, tier: "S", archetypeId: "specialist" },
  { username: "tj", avatarUrl: "https://avatars.githubusercontent.com/u/25254?v=4", grit: 85, focus: 68, craft: 92, impact: 95, voice: 65, reach: 94, tier: "A", archetypeId: "prototype_machine" },
  { username: "rauchg", avatarUrl: "https://avatars.githubusercontent.com/u/13041?v=4", grit: 88, focus: 90, craft: 93, impact: 85, voice: 95, reach: 92, tier: "S", archetypeId: "specialist" },
  { username: "shadcn", avatarUrl: "https://avatars.githubusercontent.com/u/124599?v=4", grit: 90, focus: 94, craft: 96, impact: 82, voice: 78, reach: 88, tier: "A", archetypeId: "specialist" },
  { username: "addyosmani", avatarUrl: "https://avatars.githubusercontent.com/u/110953?v=4", grit: 85, focus: 82, craft: 91, impact: 78, voice: 95, reach: 90, tier: "A", archetypeId: "hype_surfer" },
  { username: "getify", avatarUrl: "https://avatars.githubusercontent.com/u/150330?v=4", grit: 80, focus: 78, craft: 88, impact: 75, voice: 98, reach: 85, tier: "A", archetypeId: "archivist" },
  { username: "tannerlinsley", avatarUrl: "https://avatars.githubusercontent.com/u/5580297?v=4", grit: 92, focus: 88, craft: 94, impact: 80, voice: 72, reach: 86, tier: "A", archetypeId: "maintainer" },
  { username: "kentcdodds", avatarUrl: "https://avatars.githubusercontent.com/u/1500684?v=4", grit: 88, focus: 85, craft: 90, impact: 78, voice: 96, reach: 88, tier: "A", archetypeId: "hype_surfer" },
  { username: "Rich-Harris", avatarUrl: "https://avatars.githubusercontent.com/u/1162160?v=4", grit: 94, focus: 92, craft: 96, impact: 88, voice: 72, reach: 90, tier: "S", archetypeId: "maintainer" },
  { username: "antfu", avatarUrl: "https://avatars.githubusercontent.com/u/11247099?v=4", grit: 98, focus: 75, craft: 95, impact: 85, voice: 78, reach: 92, tier: "S", archetypeId: "silent_builder" },
  { username: "colinhacks", avatarUrl: "https://avatars.githubusercontent.com/u/3084745?v=4", grit: 85, focus: 95, craft: 92, impact: 82, voice: 68, reach: 78, tier: "A", archetypeId: "specialist" },
  { username: "tiangolo", avatarUrl: "https://avatars.githubusercontent.com/u/1326112?v=4", grit: 90, focus: 92, craft: 94, impact: 88, voice: 85, reach: 90, tier: "S", archetypeId: "maintainer" },
  { username: "developit", avatarUrl: "https://avatars.githubusercontent.com/u/105127?v=4", grit: 86, focus: 88, craft: 94, impact: 80, voice: 65, reach: 82, tier: "A", archetypeId: "specialist" },
  { username: "pacocoursey", avatarUrl: "https://avatars.githubusercontent.com/u/34669971?v=4", grit: 82, focus: 90, craft: 95, impact: 72, voice: 68, reach: 75, tier: "A", archetypeId: "specialist" },
  { username: "shuding", avatarUrl: "https://avatars.githubusercontent.com/u/3676859?v=4", grit: 88, focus: 90, craft: 94, impact: 78, voice: 65, reach: 82, tier: "A", archetypeId: "specialist" },
  { username: "leerob", avatarUrl: "https://avatars.githubusercontent.com/u/9113740?v=4", grit: 85, focus: 88, craft: 88, impact: 72, voice: 95, reach: 85, tier: "A", archetypeId: "hype_surfer" },
  { username: "cassidoo", avatarUrl: "https://avatars.githubusercontent.com/u/1454517?v=4", grit: 78, focus: 72, craft: 82, impact: 65, voice: 98, reach: 88, tier: "A", archetypeId: "hype_surfer" },
  { username: "ThePrimeagen", avatarUrl: "https://avatars.githubusercontent.com/u/4458174?v=4", grit: 82, focus: 78, craft: 85, impact: 68, voice: 98, reach: 90, tier: "A", archetypeId: "hype_surfer" },
  { username: "mrdoob", avatarUrl: "https://avatars.githubusercontent.com/u/97088?v=4", grit: 92, focus: 95, craft: 96, impact: 92, voice: 60, reach: 95, tier: "S", archetypeId: "maintainer" },
  { username: "antirez", avatarUrl: "https://avatars.githubusercontent.com/u/65632?v=4", grit: 88, focus: 95, craft: 95, impact: 98, voice: 80, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "DHH", avatarUrl: "https://avatars.githubusercontent.com/u/2741?v=4", grit: 85, focus: 90, craft: 92, impact: 95, voice: 98, reach: 92, tier: "S", archetypeId: "hype_surfer" },
  { username: "jeresig", avatarUrl: "https://avatars.githubusercontent.com/u/1615?v=4", grit: 75, focus: 88, craft: 90, impact: 98, voice: 82, reach: 88, tier: "A", archetypeId: "archivist" },
];

// Quick seed action - uses pre-calculated data (no API calls needed)
export const quickSeed = action({
  args: {},
  handler: async (ctx) => {
    const results: { username: string; status: string; rating?: number }[] = [];
    const now = Date.now();

    for (const dev of PRECALCULATED_ANALYSES) {
      try {
        const overallRating = Math.round(
          (dev.grit + dev.focus + dev.craft + dev.impact + dev.voice + dev.reach) / 6
        );

        await ctx.runMutation(internal.seed.saveSeedAnalysis, {
          username: dev.username,
          avatarUrl: dev.avatarUrl,
          grit: dev.grit,
          focus: dev.focus,
          craft: dev.craft,
          impact: dev.impact,
          voice: dev.voice,
          reach: dev.reach,
          overallRating,
          tier: dev.tier,
          archetypeId: dev.archetypeId,
          analyzedAt: now,
        });

        results.push({
          username: dev.username,
          status: "Success",
          rating: overallRating,
        });
      } catch (error) {
        results.push({
          username: dev.username,
          status: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        });
      }
    }

    return {
      total: PRECALCULATED_ANALYSES.length,
      successful: results.filter((r) => r.status === "Success").length,
      results,
    };
  },
});
