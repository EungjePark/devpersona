/**
 * Trends - Fetch and cache GitHub trending data
 * Uses GitHub API to get real-time trending repos and library stats
 */

import { query, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Types for trends data
interface TrendingRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  todayStars: number;
  language: string | null;
  forks: number;
  url: string;
  owner: string;
  avatarUrl: string;
}

interface LibraryTrend {
  name: string;
  fullName: string;
  category: string;
  stars: number;
  forks: number;
  language: string | null;
  description: string | null;
}

// Curated list of repos to track (popular + emerging)
const TRACKED_REPOS = [
  // Frameworks
  "vercel/next.js",
  "facebook/react",
  "vuejs/vue",
  "sveltejs/svelte",
  "angular/angular",
  // Build tools & runtimes
  "oven-sh/bun",
  "vitejs/vite",
  "denoland/deno",
  // AI/ML
  "ggml-org/llama.cpp",
  "langchain-ai/langchain",
  "openai/openai-python",
  "anthropics/anthropic-sdk-python",
  "anthropics/claude-code", // Claude Code CLI
  "huggingface/transformers",
  // UI Libraries
  "shadcn-ui/ui",
  "tailwindlabs/tailwindcss",
  "chakra-ui/chakra-ui",
  // Dev Tools
  "getcursor/cursor",
  "microsoft/typescript",
  "prettier/prettier",
  "eslint/eslint",
  // State management & API
  "pmndrs/zustand",
  "trpc/trpc",
  "TanStack/query",
  // Databases
  "supabase/supabase",
  "drizzle-team/drizzle-orm",
  "prisma/prisma",
  // Hot/Trending
  "excalidraw/excalidraw",
  "hoppscotch/hoppscotch",
];

// Query: Get cached trending repos
export const getTrendingRepos = query({
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("trends")
      .withIndex("by_type", (q) => q.eq("type", "repos"))
      .first();

    if (!cached) {
      return { repos: [], updatedAt: null };
    }

    return {
      repos: cached.data as TrendingRepo[],
      updatedAt: cached.updatedAt,
    };
  },
});

// Query: Get cached library stats
export const getLibraryStats = query({
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("trends")
      .withIndex("by_type", (q) => q.eq("type", "libraries"))
      .first();

    if (!cached) {
      return { libraries: [], updatedAt: null };
    }

    return {
      libraries: cached.data as LibraryTrend[],
      updatedAt: cached.updatedAt,
    };
  },
});

// Internal mutation: Save trends data
export const saveTrendsData = internalMutation({
  args: {
    type: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { type, data }) => {
    const existing = await ctx.db
      .query("trends")
      .withIndex("by_type", (q) => q.eq("type", type))
      .first();

    const record = {
      type,
      data,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, record);
    } else {
      await ctx.db.insert("trends", record);
    }
  },
});

// Helper: Fetch single repo from GitHub API
async function fetchSingleRepo(
  fullName: string,
  token: string
): Promise<{ repo?: TrendingRepo; error?: string }> {
  try {
    const response = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "DevPersona/1.0",
      },
    });

    if (!response.ok) {
      return { error: `${fullName}: HTTP ${response.status}` };
    }

    const data = await response.json();

    return {
      repo: {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        todayStars: 0,
        language: data.language,
        forks: data.forks_count,
        url: data.html_url,
        owner: data.owner.login,
        avatarUrl: data.owner.avatar_url,
      },
    };
  } catch (error) {
    return { error: `${fullName}: ${error instanceof Error ? error.message : "Unknown"}` };
  }
}

// Internal action: Fetch trending repos from GitHub API
export const fetchTrendingRepos = internalAction({
  handler: async (ctx) => {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      console.error("GITHUB_TOKEN not configured");
      return { success: false, error: "No GitHub token" };
    }

    // Fetch all repos in parallel
    const results = await Promise.all(
      TRACKED_REPOS.map((fullName) => fetchSingleRepo(fullName, token))
    );

    const repos: TrendingRepo[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.repo) {
        repos.push(result.repo);
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    // Sort by stars descending
    repos.sort((a, b) => b.stars - a.stars);

    // Save to database
    await ctx.runMutation(internal.trends.saveTrendsData, {
      type: "repos",
      data: repos,
    });

    // Also save as libraries (categorized)
    const libraries: LibraryTrend[] = repos.map((repo) => ({
      name: repo.name,
      fullName: repo.fullName,
      category: categorizeRepo(repo.fullName),
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      description: repo.description,
    }));

    await ctx.runMutation(internal.trends.saveTrendsData, {
      type: "libraries",
      data: libraries,
    });

    return {
      success: true,
      fetched: repos.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Helper: Categorize repo by name
function categorizeRepo(fullName: string): string {
  const categories: Record<string, string[]> = {
    Framework: ["next.js", "react", "vue", "svelte", "angular"],
    Runtime: ["bun", "deno", "node"],
    "Build Tool": ["vite", "webpack", "turbo"],
    "AI/ML": ["llama.cpp", "langchain", "openai", "anthropic"],
    "UI Library": ["shadcn", "tailwind", "chakra", "radix"],
    "Dev Tool": ["cursor", "typescript", "prettier", "eslint"],
    State: ["zustand", "jotai", "redux"],
    API: ["trpc", "query", "swr"],
    Database: ["supabase", "drizzle", "prisma"],
  };

  const repoName = fullName.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => repoName.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

// ============================================================================
// NEW TREND FEATURES: Rising Repos, Rising Developers, Hot This Week
// ============================================================================

// Types for new features
interface RisingRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  forks: number;
  url: string;
  owner: string;
  avatarUrl: string;
  createdAt: string;
  daysOld: number;
}

interface RisingDeveloper {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  bio: string | null;
  company: string | null;
  location: string | null;
  url: string;
}

interface HotRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  forks: number;
  url: string;
  owner: string;
  avatarUrl: string;
  pushedAt: string;
  openIssues: number;
}

interface LanguageTrendData {
  language: string;
  repos: Array<{
    name: string;
    fullName: string;
    description: string | null;
    stars: number;
    url: string;
  }>;
  totalStars: number;
  repoCount: number;
}

// Query: Get Rising Repos (newly created, gaining traction)
export const getRisingRepos = query({
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("trends")
      .withIndex("by_type", (q) => q.eq("type", "rising_repos"))
      .first();

    if (!cached) {
      return { repos: [], updatedAt: null };
    }

    return {
      repos: cached.data as RisingRepo[],
      updatedAt: cached.updatedAt,
    };
  },
});

// Query: Get Rising Developers
export const getRisingDevelopers = query({
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("trends")
      .withIndex("by_type", (q) => q.eq("type", "rising_developers"))
      .first();

    if (!cached) {
      return { developers: [], updatedAt: null };
    }

    return {
      developers: cached.data as RisingDeveloper[],
      updatedAt: cached.updatedAt,
    };
  },
});

// Query: Get Hot This Week
export const getHotThisWeek = query({
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("trends")
      .withIndex("by_type", (q) => q.eq("type", "hot_this_week"))
      .first();

    if (!cached) {
      return { repos: [], updatedAt: null };
    }

    return {
      repos: cached.data as HotRepo[],
      updatedAt: cached.updatedAt,
    };
  },
});

// Query: Get Language Trends
export const getLanguageTrends = query({
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("trends")
      .withIndex("by_type", (q) => q.eq("type", "language_trends"))
      .first();

    if (!cached) {
      return { languages: [], updatedAt: null };
    }

    return {
      languages: cached.data as LanguageTrendData[],
      updatedAt: cached.updatedAt,
    };
  },
});

// Internal action: Fetch Rising Repos from GitHub
export const fetchRisingRepos = internalAction({
  handler: async (ctx) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { success: false, error: "No GitHub token" };
    }

    try {
      // Repos created in the last 30 days with 100+ stars
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

      const query = `created:>${dateStr} stars:>100`;
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${token}`,
            "User-Agent": "DevPersona/1.0",
          },
        }
      );

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const now = new Date();

      const repos: RisingRepo[] = data.items.map((item: {
        name: string;
        full_name: string;
        description: string | null;
        stargazers_count: number;
        language: string | null;
        forks_count: number;
        html_url: string;
        owner: { login: string; avatar_url: string };
        created_at: string;
      }) => {
        const createdDate = new Date(item.created_at);
        const daysOld = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: item.name,
          fullName: item.full_name,
          description: item.description,
          stars: item.stargazers_count,
          language: item.language,
          forks: item.forks_count,
          url: item.html_url,
          owner: item.owner.login,
          avatarUrl: item.owner.avatar_url,
          createdAt: item.created_at,
          daysOld,
        };
      });

      await ctx.runMutation(internal.trends.saveTrendsData, {
        type: "rising_repos",
        data: repos,
      });

      return { success: true, count: repos.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown" };
    }
  },
});

// Internal action: Fetch Rising Developers from GitHub
export const fetchRisingDevelopers = internalAction({
  handler: async (ctx) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { success: false, error: "No GitHub token" };
    }

    try {
      // Developers with 5000+ followers
      const query = "followers:>5000";
      const response = await fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=20`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${token}`,
            "User-Agent": "DevPersona/1.0",
          },
        }
      );

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();

      // Fetch detailed info for each user (in parallel, max 10 at a time)
      const userPromises = data.items.slice(0, 15).map(async (item: { login: string }) => {
        const userResponse = await fetch(`https://api.github.com/users/${item.login}`, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${token}`,
            "User-Agent": "DevPersona/1.0",
          },
        });
        if (!userResponse.ok) return null;
        return userResponse.json();
      });

      const users = await Promise.all(userPromises);

      const developers: RisingDeveloper[] = users
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((user) => ({
          login: user.login,
          name: user.name,
          avatarUrl: user.avatar_url,
          followers: user.followers,
          publicRepos: user.public_repos,
          bio: user.bio,
          company: user.company,
          location: user.location,
          url: user.html_url,
        }));

      await ctx.runMutation(internal.trends.saveTrendsData, {
        type: "rising_developers",
        data: developers,
      });

      return { success: true, count: developers.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown" };
    }
  },
});

// Internal action: Fetch Hot This Week repos
export const fetchHotThisWeek = internalAction({
  handler: async (ctx) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { success: false, error: "No GitHub token" };
    }

    try {
      // Repos pushed in the last 7 days with 500+ stars
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split("T")[0];

      const query = `pushed:>${dateStr} stars:>500`;
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${token}`,
            "User-Agent": "DevPersona/1.0",
          },
        }
      );

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();

      const repos: HotRepo[] = data.items.map((item: {
        name: string;
        full_name: string;
        description: string | null;
        stargazers_count: number;
        language: string | null;
        forks_count: number;
        html_url: string;
        owner: { login: string; avatar_url: string };
        pushed_at: string;
        open_issues_count: number;
      }) => ({
        name: item.name,
        fullName: item.full_name,
        description: item.description,
        stars: item.stargazers_count,
        language: item.language,
        forks: item.forks_count,
        url: item.html_url,
        owner: item.owner.login,
        avatarUrl: item.owner.avatar_url,
        pushedAt: item.pushed_at,
        openIssues: item.open_issues_count,
      }));

      await ctx.runMutation(internal.trends.saveTrendsData, {
        type: "hot_this_week",
        data: repos,
      });

      return { success: true, count: repos.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown" };
    }
  },
});

// Internal action: Fetch Language Trends
export const fetchLanguageTrends = internalAction({
  handler: async (ctx) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { success: false, error: "No GitHub token" };
    }

    const languages = ["TypeScript", "Python", "Rust", "Go", "JavaScript", "Kotlin", "Swift", "Zig"];
    const languageData: LanguageTrendData[] = [];

    try {
      for (const language of languages) {
        const query = `language:${language} stars:>1000`;
        const response = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `Bearer ${token}`,
              "User-Agent": "DevPersona/1.0",
            },
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        const repos = data.items.map((item: {
          name: string;
          full_name: string;
          description: string | null;
          stargazers_count: number;
          html_url: string;
        }) => ({
          name: item.name,
          fullName: item.full_name,
          description: item.description,
          stars: item.stargazers_count,
          url: item.html_url,
        }));

        const totalStars = repos.reduce((sum: number, r: { stars: number }) => sum + r.stars, 0);

        languageData.push({
          language,
          repos,
          totalStars,
          repoCount: data.total_count,
        });

        // Rate limit protection
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Sort by total stars
      languageData.sort((a, b) => b.totalStars - a.totalStars);

      await ctx.runMutation(internal.trends.saveTrendsData, {
        type: "language_trends",
        data: languageData,
      });

      return { success: true, count: languageData.length };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown" };
    }
  },
});

// Search GitHub for trending repos (alternative approach)
export const searchTrendingRepos = internalAction({
  args: {
    query: v.optional(v.string()),
    minStars: v.optional(v.number()),
  },
  handler: async (ctx, { query = "stars:>10000", minStars = 10000 }) => {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return { success: false, error: "No GitHub token" };
    }

    try {
      // Search for repos with many stars, sorted by stars
      const searchQuery = query || `stars:>${minStars}`;
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=30`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${token}`,
            "User-Agent": "DevPersona/1.0",
          },
        }
      );

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();

      const repos: TrendingRepo[] = data.items.map((item: {
        name: string;
        full_name: string;
        description: string | null;
        stargazers_count: number;
        language: string | null;
        forks_count: number;
        html_url: string;
        owner: { login: string; avatar_url: string };
      }) => ({
        name: item.name,
        fullName: item.full_name,
        description: item.description,
        stars: item.stargazers_count,
        todayStars: 0,
        language: item.language,
        forks: item.forks_count,
        url: item.html_url,
        owner: item.owner.login,
        avatarUrl: item.owner.avatar_url,
      }));

      return { success: true, repos, total: data.total_count };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown" };
    }
  },
});
