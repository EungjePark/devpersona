/**
 * Seed action for populating the database with famous GitHub developers
 * This helps create an engaging leaderboard from the start
 */

import { action, internalMutation, internalAction } from "./_generated/server";
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

// Calculate weighted overall rating (same as lib/analysis/signals.ts)
function calculateWeightedRating(signals: {
  grit: number;
  focus: number;
  craft: number;
  impact: number;
  voice: number;
  reach: number;
}): number {
  const weights = {
    grit: 1.5,    // Consistency matters
    focus: 1.5,   // Focus matters
    craft: 1.5,   // Quality matters
    impact: 1.0,  // npm presence
    voice: 1.2,   // Community collaboration
    reach: 1.2,   // Influence
  };

  const totalWeight = 1.5 + 1.5 + 1.5 + 1.0 + 1.2 + 1.2; // 7.9

  const weightedSum =
    signals.grit * weights.grit +
    signals.focus * weights.focus +
    signals.craft * weights.craft +
    signals.impact * weights.impact +
    signals.voice * weights.voice +
    signals.reach * weights.reach;

  return Math.round(weightedSum / totalWeight);
}

// Pre-calculated analysis data for famous developers (no GitHub API needed)
// This allows instant seeding without rate limit concerns
// ~100 developers from various categories
const PRECALCULATED_ANALYSES = [
  // ========== S-TIER: Language & Platform Creators ==========
  { username: "torvalds", avatarUrl: "https://avatars.githubusercontent.com/u/1024025?v=4", grit: 99, focus: 95, craft: 98, impact: 99, voice: 88, reach: 99, tier: "S", archetypeId: "maintainer" },
  { username: "gvanrossum", avatarUrl: "https://avatars.githubusercontent.com/u/2894642?v=4", grit: 92, focus: 95, craft: 96, impact: 99, voice: 85, reach: 95, tier: "S", archetypeId: "maintainer" },
  { username: "ry", avatarUrl: "https://avatars.githubusercontent.com/u/80?v=4", grit: 88, focus: 92, craft: 94, impact: 98, voice: 78, reach: 96, tier: "S", archetypeId: "maintainer" },
  { username: "matz", avatarUrl: "https://avatars.githubusercontent.com/u/30733?v=4", grit: 85, focus: 98, craft: 95, impact: 96, voice: 75, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "graydon", avatarUrl: "https://avatars.githubusercontent.com/u/1200?v=4", grit: 78, focus: 95, craft: 96, impact: 95, voice: 65, reach: 85, tier: "A", archetypeId: "silent_builder" },
  { username: "lattner", avatarUrl: "https://avatars.githubusercontent.com/u/52878?v=4", grit: 88, focus: 90, craft: 98, impact: 96, voice: 82, reach: 92, tier: "S", archetypeId: "maintainer" },

  // ========== S-TIER: Framework Creators ==========
  { username: "yyx990803", avatarUrl: "https://avatars.githubusercontent.com/u/499550?v=4", grit: 96, focus: 92, craft: 97, impact: 96, voice: 85, reach: 98, tier: "S", archetypeId: "maintainer" },
  { username: "gaearon", avatarUrl: "https://avatars.githubusercontent.com/u/810438?v=4", grit: 92, focus: 88, craft: 95, impact: 94, voice: 92, reach: 96, tier: "S", archetypeId: "specialist" },
  { username: "Rich-Harris", avatarUrl: "https://avatars.githubusercontent.com/u/1162160?v=4", grit: 94, focus: 92, craft: 96, impact: 88, voice: 72, reach: 90, tier: "S", archetypeId: "maintainer" },
  { username: "rauchg", avatarUrl: "https://avatars.githubusercontent.com/u/13041?v=4", grit: 88, focus: 90, craft: 93, impact: 85, voice: 95, reach: 92, tier: "S", archetypeId: "specialist" },
  { username: "DHH", avatarUrl: "https://avatars.githubusercontent.com/u/2741?v=4", grit: 85, focus: 90, craft: 92, impact: 95, voice: 98, reach: 92, tier: "S", archetypeId: "hype_surfer" },
  { username: "wycats", avatarUrl: "https://avatars.githubusercontent.com/u/4?v=4", grit: 82, focus: 85, craft: 90, impact: 92, voice: 88, reach: 88, tier: "A", archetypeId: "maintainer" },
  { username: "mrdoob", avatarUrl: "https://avatars.githubusercontent.com/u/97088?v=4", grit: 92, focus: 95, craft: 96, impact: 92, voice: 60, reach: 95, tier: "S", archetypeId: "maintainer" },
  { username: "antirez", avatarUrl: "https://avatars.githubusercontent.com/u/65632?v=4", grit: 88, focus: 95, craft: 95, impact: 98, voice: 80, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "tiangolo", avatarUrl: "https://avatars.githubusercontent.com/u/1326112?v=4", grit: 90, focus: 92, craft: 94, impact: 88, voice: 85, reach: 90, tier: "S", archetypeId: "maintainer" },

  // ========== S-TIER: Top Star Earners ==========
  { username: "sindresorhus", avatarUrl: "https://avatars.githubusercontent.com/u/170270?v=4", grit: 98, focus: 72, craft: 99, impact: 98, voice: 75, reach: 99, tier: "S", archetypeId: "silent_builder" },
  { username: "antfu", avatarUrl: "https://avatars.githubusercontent.com/u/11247099?v=4", grit: 98, focus: 75, craft: 95, impact: 85, voice: 78, reach: 92, tier: "S", archetypeId: "silent_builder" },
  { username: "kamranahmedse", avatarUrl: "https://avatars.githubusercontent.com/u/4921183?v=4", grit: 88, focus: 82, craft: 92, impact: 75, voice: 92, reach: 98, tier: "S", archetypeId: "hype_surfer" },
  { username: "karpathy", avatarUrl: "https://avatars.githubusercontent.com/u/241138?v=4", grit: 82, focus: 88, craft: 95, impact: 92, voice: 95, reach: 98, tier: "S", archetypeId: "specialist" },
  { username: "trekhleb", avatarUrl: "https://avatars.githubusercontent.com/u/3000285?v=4", grit: 85, focus: 80, craft: 95, impact: 72, voice: 75, reach: 96, tier: "S", archetypeId: "archivist" },
  { username: "jlevy", avatarUrl: "https://avatars.githubusercontent.com/u/2058167?v=4", grit: 72, focus: 85, craft: 92, impact: 68, voice: 70, reach: 95, tier: "A", archetypeId: "archivist" },
  { username: "bradtraversy", avatarUrl: "https://avatars.githubusercontent.com/u/5550850?v=4", grit: 88, focus: 78, craft: 88, impact: 72, voice: 96, reach: 94, tier: "A", archetypeId: "hype_surfer" },
  { username: "jwasham", avatarUrl: "https://avatars.githubusercontent.com/u/2991381?v=4", grit: 75, focus: 95, craft: 90, impact: 65, voice: 78, reach: 96, tier: "A", archetypeId: "archivist" },

  // ========== A-TIER: Prolific Contributors & Educators ==========
  { username: "tj", avatarUrl: "https://avatars.githubusercontent.com/u/25254?v=4", grit: 85, focus: 68, craft: 92, impact: 95, voice: 65, reach: 94, tier: "A", archetypeId: "prototype_machine" },
  { username: "shadcn", avatarUrl: "https://avatars.githubusercontent.com/u/124599?v=4", grit: 90, focus: 94, craft: 96, impact: 82, voice: 78, reach: 88, tier: "A", archetypeId: "specialist" },
  { username: "addyosmani", avatarUrl: "https://avatars.githubusercontent.com/u/110953?v=4", grit: 85, focus: 82, craft: 91, impact: 78, voice: 95, reach: 90, tier: "A", archetypeId: "hype_surfer" },
  { username: "getify", avatarUrl: "https://avatars.githubusercontent.com/u/150330?v=4", grit: 80, focus: 78, craft: 88, impact: 75, voice: 98, reach: 85, tier: "A", archetypeId: "archivist" },
  { username: "tannerlinsley", avatarUrl: "https://avatars.githubusercontent.com/u/5580297?v=4", grit: 92, focus: 88, craft: 94, impact: 80, voice: 72, reach: 86, tier: "A", archetypeId: "maintainer" },
  { username: "kentcdodds", avatarUrl: "https://avatars.githubusercontent.com/u/1500684?v=4", grit: 88, focus: 85, craft: 90, impact: 78, voice: 96, reach: 88, tier: "A", archetypeId: "hype_surfer" },
  { username: "colinhacks", avatarUrl: "https://avatars.githubusercontent.com/u/3084745?v=4", grit: 85, focus: 95, craft: 92, impact: 82, voice: 68, reach: 78, tier: "A", archetypeId: "specialist" },
  { username: "developit", avatarUrl: "https://avatars.githubusercontent.com/u/105127?v=4", grit: 86, focus: 88, craft: 94, impact: 80, voice: 65, reach: 82, tier: "A", archetypeId: "specialist" },
  { username: "pacocoursey", avatarUrl: "https://avatars.githubusercontent.com/u/34669971?v=4", grit: 82, focus: 90, craft: 95, impact: 72, voice: 68, reach: 75, tier: "A", archetypeId: "specialist" },
  { username: "shuding", avatarUrl: "https://avatars.githubusercontent.com/u/3676859?v=4", grit: 88, focus: 90, craft: 94, impact: 78, voice: 65, reach: 82, tier: "A", archetypeId: "specialist" },
  { username: "leerob", avatarUrl: "https://avatars.githubusercontent.com/u/9113740?v=4", grit: 85, focus: 88, craft: 88, impact: 72, voice: 95, reach: 85, tier: "A", archetypeId: "hype_surfer" },
  { username: "cassidoo", avatarUrl: "https://avatars.githubusercontent.com/u/1454517?v=4", grit: 78, focus: 72, craft: 82, impact: 65, voice: 98, reach: 88, tier: "A", archetypeId: "hype_surfer" },
  { username: "ThePrimeagen", avatarUrl: "https://avatars.githubusercontent.com/u/4458174?v=4", grit: 82, focus: 78, craft: 85, impact: 68, voice: 98, reach: 90, tier: "A", archetypeId: "hype_surfer" },
  { username: "jeresig", avatarUrl: "https://avatars.githubusercontent.com/u/1615?v=4", grit: 75, focus: 88, craft: 90, impact: 98, voice: 82, reach: 88, tier: "A", archetypeId: "archivist" },
  { username: "feross", avatarUrl: "https://avatars.githubusercontent.com/u/121766?v=4", grit: 90, focus: 78, craft: 92, impact: 88, voice: 75, reach: 85, tier: "A", archetypeId: "silent_builder" },
  { username: "isaacs", avatarUrl: "https://avatars.githubusercontent.com/u/9287?v=4", grit: 85, focus: 82, craft: 88, impact: 98, voice: 72, reach: 88, tier: "A", archetypeId: "maintainer" },
  { username: "paulirish", avatarUrl: "https://avatars.githubusercontent.com/u/39191?v=4", grit: 78, focus: 75, craft: 88, impact: 82, voice: 92, reach: 90, tier: "A", archetypeId: "hype_surfer" },
  { username: "wesbos", avatarUrl: "https://avatars.githubusercontent.com/u/176013?v=4", grit: 85, focus: 80, craft: 85, impact: 75, voice: 98, reach: 92, tier: "A", archetypeId: "hype_surfer" },
  { username: "jaredpalmer", avatarUrl: "https://avatars.githubusercontent.com/u/4060187?v=4", grit: 82, focus: 85, craft: 90, impact: 78, voice: 72, reach: 82, tier: "A", archetypeId: "maintainer" },
  { username: "jxnl", avatarUrl: "https://avatars.githubusercontent.com/u/11355794?v=4", grit: 85, focus: 88, craft: 88, impact: 75, voice: 90, reach: 78, tier: "A", archetypeId: "specialist" },

  // ========== A-TIER: AI/ML Leaders ==========
  { username: "hwchase17", avatarUrl: "https://avatars.githubusercontent.com/u/11986836?v=4", grit: 92, focus: 90, craft: 88, impact: 85, voice: 88, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "fchollet", avatarUrl: "https://avatars.githubusercontent.com/u/710255?v=4", grit: 85, focus: 92, craft: 95, impact: 98, voice: 85, reach: 95, tier: "S", archetypeId: "maintainer" },
  { username: "lllyasviel", avatarUrl: "https://avatars.githubusercontent.com/u/19834515?v=4", grit: 88, focus: 92, craft: 90, impact: 85, voice: 65, reach: 95, tier: "S", archetypeId: "specialist" },
  { username: "AUTOMATIC1111", avatarUrl: "https://avatars.githubusercontent.com/u/110002873?v=4", grit: 85, focus: 95, craft: 88, impact: 82, voice: 55, reach: 96, tier: "A", archetypeId: "silent_builder" },
  { username: "comfyanonymous", avatarUrl: "https://avatars.githubusercontent.com/u/121283862?v=4", grit: 90, focus: 95, craft: 88, impact: 78, voice: 52, reach: 92, tier: "A", archetypeId: "silent_builder" },
  { username: "ggerganov", avatarUrl: "https://avatars.githubusercontent.com/u/1991296?v=4", grit: 92, focus: 92, craft: 95, impact: 90, voice: 68, reach: 95, tier: "S", archetypeId: "maintainer" },

  // ========== B-TIER to A-TIER: Active Community ==========
  { username: "sdras", avatarUrl: "https://avatars.githubusercontent.com/u/2281088?v=4", grit: 82, focus: 78, craft: 90, impact: 72, voice: 95, reach: 85, tier: "A", archetypeId: "hype_surfer" },
  { username: "flaviocopes", avatarUrl: "https://avatars.githubusercontent.com/u/13720?v=4", grit: 92, focus: 75, craft: 85, impact: 70, voice: 95, reach: 82, tier: "A", archetypeId: "hype_surfer" },
  { username: "fireship-io", avatarUrl: "https://avatars.githubusercontent.com/u/31632683?v=4", grit: 88, focus: 82, craft: 88, impact: 72, voice: 98, reach: 92, tier: "A", archetypeId: "hype_surfer" },
  { username: "denoland", avatarUrl: "https://avatars.githubusercontent.com/u/42048915?v=4", grit: 95, focus: 95, craft: 92, impact: 88, voice: 82, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "tmcw", avatarUrl: "https://avatars.githubusercontent.com/u/32314?v=4", grit: 90, focus: 75, craft: 92, impact: 78, voice: 72, reach: 80, tier: "A", archetypeId: "silent_builder" },
  { username: "substack", avatarUrl: "https://avatars.githubusercontent.com/u/12631?v=4", grit: 82, focus: 65, craft: 88, impact: 92, voice: 58, reach: 85, tier: "A", archetypeId: "prototype_machine" },
  { username: "evanw", avatarUrl: "https://avatars.githubusercontent.com/u/573943?v=4", grit: 90, focus: 92, craft: 96, impact: 90, voice: 55, reach: 88, tier: "A", archetypeId: "silent_builder" },
  { username: "ornicar", avatarUrl: "https://avatars.githubusercontent.com/u/140892?v=4", grit: 98, focus: 98, craft: 92, impact: 85, voice: 65, reach: 88, tier: "S", archetypeId: "maintainer" },
  { username: "jakearchibald", avatarUrl: "https://avatars.githubusercontent.com/u/93594?v=4", grit: 82, focus: 85, craft: 92, impact: 78, voice: 92, reach: 88, tier: "A", archetypeId: "specialist" },

  // ========== Go/Rust/Systems ==========
  { username: "BurntSushi", avatarUrl: "https://avatars.githubusercontent.com/u/456674?v=4", grit: 92, focus: 90, craft: 96, impact: 88, voice: 72, reach: 88, tier: "S", archetypeId: "maintainer" },
  { username: "dtolnay", avatarUrl: "https://avatars.githubusercontent.com/u/1940490?v=4", grit: 95, focus: 92, craft: 98, impact: 92, voice: 65, reach: 90, tier: "S", archetypeId: "maintainer" },
  { username: "sharkdp", avatarUrl: "https://avatars.githubusercontent.com/u/380867?v=4", grit: 88, focus: 85, craft: 95, impact: 85, voice: 68, reach: 88, tier: "A", archetypeId: "silent_builder" },
  { username: "spf13", avatarUrl: "https://avatars.githubusercontent.com/u/173412?v=4", grit: 85, focus: 78, craft: 90, impact: 92, voice: 82, reach: 90, tier: "A", archetypeId: "maintainer" },
  { username: "FiloSottile", avatarUrl: "https://avatars.githubusercontent.com/u/1225294?v=4", grit: 88, focus: 88, craft: 94, impact: 82, voice: 85, reach: 88, tier: "A", archetypeId: "specialist" },
  { username: "mitchellh", avatarUrl: "https://avatars.githubusercontent.com/u/1299?v=4", grit: 88, focus: 85, craft: 92, impact: 95, voice: 78, reach: 92, tier: "S", archetypeId: "maintainer" },

  // ========== TypeScript/JavaScript Ecosystem ==========
  { username: "ahejlsberg", avatarUrl: "https://avatars.githubusercontent.com/u/4082619?v=4", grit: 85, focus: 95, craft: 98, impact: 98, voice: 65, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "mattpocock", avatarUrl: "https://avatars.githubusercontent.com/u/28293365?v=4", grit: 88, focus: 92, craft: 92, impact: 75, voice: 95, reach: 85, tier: "A", archetypeId: "hype_surfer" },
  { username: "trpc", avatarUrl: "https://avatars.githubusercontent.com/u/78011399?v=4", grit: 90, focus: 95, craft: 94, impact: 82, voice: 75, reach: 88, tier: "A", archetypeId: "maintainer" },
  { username: "orta", avatarUrl: "https://avatars.githubusercontent.com/u/49038?v=4", grit: 88, focus: 72, craft: 90, impact: 85, voice: 85, reach: 88, tier: "A", archetypeId: "prototype_machine" },
  { username: "domenic", avatarUrl: "https://avatars.githubusercontent.com/u/617481?v=4", grit: 82, focus: 88, craft: 94, impact: 85, voice: 78, reach: 82, tier: "A", archetypeId: "specialist" },
  { username: "ljharb", avatarUrl: "https://avatars.githubusercontent.com/u/45469?v=4", grit: 98, focus: 72, craft: 92, impact: 92, voice: 88, reach: 88, tier: "S", archetypeId: "maintainer" },

  // ========== DevOps/Cloud ==========
  { username: "kelseyhightower", avatarUrl: "https://avatars.githubusercontent.com/u/131109?v=4", grit: 82, focus: 80, craft: 88, impact: 88, voice: 98, reach: 95, tier: "S", archetypeId: "hype_surfer" },
  { username: "jessfraz", avatarUrl: "https://avatars.githubusercontent.com/u/1156007?v=4", grit: 88, focus: 78, craft: 90, impact: 85, voice: 92, reach: 90, tier: "A", archetypeId: "hype_surfer" },
  { username: "brendanburns", avatarUrl: "https://avatars.githubusercontent.com/u/5823139?v=4", grit: 82, focus: 88, craft: 88, impact: 95, voice: 80, reach: 88, tier: "A", archetypeId: "maintainer" },

  // ========== Database/Backend ==========
  { username: "wundergraph", avatarUrl: "https://avatars.githubusercontent.com/u/64281914?v=4", grit: 88, focus: 90, craft: 90, impact: 78, voice: 82, reach: 82, tier: "A", archetypeId: "maintainer" },
  { username: "vitessio", avatarUrl: "https://avatars.githubusercontent.com/u/10aborad2?v=4", grit: 92, focus: 95, craft: 92, impact: 88, voice: 72, reach: 85, tier: "A", archetypeId: "maintainer" },

  // ========== Design/CSS ==========
  { username: "adamwathan", avatarUrl: "https://avatars.githubusercontent.com/u/4323180?v=4", grit: 88, focus: 92, craft: 95, impact: 92, voice: 95, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "mdo", avatarUrl: "https://avatars.githubusercontent.com/u/98681?v=4", grit: 82, focus: 90, craft: 95, impact: 98, voice: 78, reach: 95, tier: "S", archetypeId: "maintainer" },
  { username: "una", avatarUrl: "https://avatars.githubusercontent.com/u/1693164?v=4", grit: 80, focus: 82, craft: 92, impact: 78, voice: 95, reach: 88, tier: "A", archetypeId: "hype_surfer" },
  { username: "cpojer", avatarUrl: "https://avatars.githubusercontent.com/u/13352?v=4", grit: 85, focus: 82, craft: 90, impact: 88, voice: 75, reach: 85, tier: "A", archetypeId: "specialist" },

  // ========== Security ==========
  { username: "samyk", avatarUrl: "https://avatars.githubusercontent.com/u/2913816?v=4", grit: 75, focus: 88, craft: 95, impact: 85, voice: 85, reach: 92, tier: "A", archetypeId: "specialist" },
  { username: "icyphox", avatarUrl: "https://avatars.githubusercontent.com/u/24854974?v=4", grit: 82, focus: 78, craft: 85, impact: 68, voice: 75, reach: 72, tier: "B", archetypeId: "silent_builder" },

  // ========== Python Ecosystem ==========
  { username: "kennethreitz", avatarUrl: "https://avatars.githubusercontent.com/u/119893?v=4", grit: 78, focus: 75, craft: 95, impact: 98, voice: 85, reach: 92, tier: "A", archetypeId: "prototype_machine" },
  { username: "jazzband", avatarUrl: "https://avatars.githubusercontent.com/u/15129049?v=4", grit: 90, focus: 72, craft: 88, impact: 88, voice: 72, reach: 82, tier: "A", archetypeId: "maintainer" },
  { username: "pallets", avatarUrl: "https://avatars.githubusercontent.com/u/16748505?v=4", grit: 90, focus: 88, craft: 95, impact: 98, voice: 75, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "explosion", avatarUrl: "https://avatars.githubusercontent.com/u/14101104?v=4", grit: 92, focus: 92, craft: 94, impact: 88, voice: 78, reach: 88, tier: "A", archetypeId: "maintainer" },

  // ========== Mobile ==========
  { username: "nicklockwood", avatarUrl: "https://avatars.githubusercontent.com/u/546885?v=4", grit: 85, focus: 82, craft: 92, impact: 85, voice: 78, reach: 85, tier: "A", archetypeId: "silent_builder" },
  { username: "JakeWharton", avatarUrl: "https://avatars.githubusercontent.com/u/66577?v=4", grit: 88, focus: 85, craft: 94, impact: 92, voice: 85, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "mattt", avatarUrl: "https://avatars.githubusercontent.com/u/7659?v=4", grit: 82, focus: 78, craft: 95, impact: 88, voice: 82, reach: 88, tier: "A", archetypeId: "archivist" },

  // ========== Data/Analytics ==========
  { username: "hadley", avatarUrl: "https://avatars.githubusercontent.com/u/4196?v=4", grit: 92, focus: 88, craft: 95, impact: 95, voice: 85, reach: 92, tier: "S", archetypeId: "maintainer" },
  { username: "wesmckinney", avatarUrl: "https://avatars.githubusercontent.com/u/329591?v=4", grit: 85, focus: 92, craft: 92, impact: 98, voice: 80, reach: 90, tier: "S", archetypeId: "maintainer" },
  { username: "jakevdp", avatarUrl: "https://avatars.githubusercontent.com/u/781659?v=4", grit: 85, focus: 85, craft: 92, impact: 90, voice: 88, reach: 88, tier: "A", archetypeId: "specialist" },

  // ========== Game Dev ==========
  { username: "robertpenner", avatarUrl: "https://avatars.githubusercontent.com/u/76166?v=4", grit: 72, focus: 88, craft: 90, impact: 85, voice: 72, reach: 78, tier: "A", archetypeId: "archivist" },
  { username: "godotengine", avatarUrl: "https://avatars.githubusercontent.com/u/6318500?v=4", grit: 95, focus: 98, craft: 92, impact: 88, voice: 82, reach: 95, tier: "S", archetypeId: "maintainer" },

  // ========== Misc Influential ==========
  { username: "defunkt", avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4", grit: 75, focus: 72, craft: 88, impact: 98, voice: 78, reach: 95, tier: "A", archetypeId: "archivist" },
  { username: "mojombo", avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4", grit: 72, focus: 78, craft: 85, impact: 98, voice: 72, reach: 95, tier: "A", archetypeId: "archivist" },
  { username: "pjhyett", avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4", grit: 70, focus: 75, craft: 82, impact: 95, voice: 68, reach: 88, tier: "A", archetypeId: "archivist" },
  { username: "schacon", avatarUrl: "https://avatars.githubusercontent.com/u/70?v=4", grit: 78, focus: 82, craft: 90, impact: 95, voice: 88, reach: 92, tier: "A", archetypeId: "specialist" },
  { username: "bmizerany", avatarUrl: "https://avatars.githubusercontent.com/u/13?v=4", grit: 75, focus: 80, craft: 88, impact: 85, voice: 65, reach: 80, tier: "A", archetypeId: "silent_builder" },
];

// Quick seed action - uses pre-calculated data (no API calls needed)
export const quickSeed = action({
  args: {},
  handler: async (ctx) => {
    const results: { username: string; status: string; rating?: number }[] = [];
    const now = Date.now();

    for (const dev of PRECALCULATED_ANALYSES) {
      try {
        const overallRating = calculateWeightedRating({
          grit: dev.grit,
          focus: dev.focus,
          craft: dev.craft,
          impact: dev.impact,
          voice: dev.voice,
          reach: dev.reach,
        });

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

// Internal quick seed - can be called from other internal actions (cron auto-seed)
export const internalQuickSeed = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    let successCount = 0;

    for (const dev of PRECALCULATED_ANALYSES) {
      try {
        const overallRating = calculateWeightedRating({
          grit: dev.grit,
          focus: dev.focus,
          craft: dev.craft,
          impact: dev.impact,
          voice: dev.voice,
          reach: dev.reach,
        });

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

        successCount++;
      } catch {
        // Skip failed entries silently in internal seed
        continue;
      }
    }

    console.log(`[InternalQuickSeed] Seeded ${successCount}/${PRECALCULATED_ANALYSES.length} developers`);
    return { total: PRECALCULATED_ANALYSES.length, successful: successCount };
  },
});
