// GitHub API Client - BYOT (Bring Your Own Token)
// Uses server-side proxy for unauthenticated requests

import type { GitHubUser, GitHubRepo, GitHubCommit, ContributionCalendar, ContributionStats, CommunityMetrics } from '../types';

const GITHUB_API = 'https://api.github.com';
const GITHUB_PROXY = '/api/github';

interface GitHubClientOptions {
  token?: string; // User's OAuth token (BYOT)
}

/**
 * Get the appropriate API base URL
 * - With token: Direct GitHub API (BYOT)
 * - Without token: Server-side proxy with GITHUB_TOKEN
 */
function getApiBase(token?: string): string {
  return token ? GITHUB_API : GITHUB_PROXY;
}

/**
 * Create headers for GitHub API requests
 */
function getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevPersona/1.0',
  };

  // Only add auth header for direct API calls (BYOT)
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch user profile
 */
export async function fetchUser(
  username: string,
  options: GitHubClientOptions = {}
): Promise<GitHubUser> {
  const apiBase = getApiBase(options.token);
  const response = await fetch(`${apiBase}/users/${username}`, {
    headers: getHeaders(options.token),
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`User ${username} not found`);
    }
    if (response.status === 403) {
      throw new Error('Rate limit exceeded. Please sign in with GitHub.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch user's repositories (paginated, sorted by stars)
 */
export async function fetchRepos(
  username: string,
  options: GitHubClientOptions = {},
  limit = 100
): Promise<GitHubRepo[]> {
  const apiBase = getApiBase(options.token);
  const perPage = Math.min(limit, 100);
  const pages = Math.ceil(limit / perPage);
  const repos: GitHubRepo[] = [];

  for (let page = 1; page <= pages && repos.length < limit; page++) {
    const response = await fetch(
      `${apiBase}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=pushed&direction=desc`,
      {
        headers: getHeaders(options.token),
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Rate limit exceeded. Please sign in with GitHub.');
      }
      break;
    }

    const pageRepos: GitHubRepo[] = await response.json();
    if (pageRepos.length === 0) break;

    repos.push(...pageRepos);
  }

  return repos.slice(0, limit);
}

/**
 * Fetch commits from multiple repos (sampling strategy)
 * Parallelized for performance
 */
export async function fetchCommits(
  username: string,
  repos: GitHubRepo[],
  options: GitHubClientOptions = {},
  commitsPerRepo = 20
): Promise<GitHubCommit[]> {
  const apiBase = getApiBase(options.token);
  // Sample from top 5 repos by recent activity (reduced for speed)
  const topRepos = repos
    .filter(r => !r.archived)
    .slice(0, 5);

  // Fetch commits from all repos in PARALLEL
  const results = await Promise.all(
    topRepos.map(async (repo) => {
      try {
        const response = await fetch(
          `${apiBase}/repos/${repo.full_name}/commits?author=${username}&per_page=${commitsPerRepo}`,
          {
            headers: getHeaders(options.token),
            next: { revalidate: 3600 },
          }
        );

        if (response.ok) {
          return (await response.json()) as GitHubCommit[];
        }
        return [];
      } catch {
        return [];
      }
    })
  );

  return results.flat();
}

/**
 * Check rate limit status
 */
export async function checkRateLimit(options: GitHubClientOptions = {}): Promise<{
  remaining: number;
  limit: number;
  reset: Date;
}> {
  const apiBase = getApiBase(options.token);
  const response = await fetch(`${apiBase}/rate_limit`, {
    headers: getHeaders(options.token),
  });

  if (!response.ok) {
    throw new Error('Failed to check rate limit');
  }

  const data = await response.json();

  return {
    remaining: data.resources.core.remaining,
    limit: data.resources.core.limit,
    reset: new Date(data.resources.core.reset * 1000),
  };
}

/**
 * Fetch contribution calendar via GraphQL (grass)
 * Uses direct GitHub API when token is available (server-side)
 * Falls back to proxy for client-side usage
 */
export async function fetchContributions(
  username: string,
  options: GitHubClientOptions = {}
): Promise<ContributionStats | null> {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  color
                }
              }
            }
          }
        }
      }
    `;

    // Use direct GitHub GraphQL API with token (for server-side/Edge runtime)
    // or use GITHUB_TOKEN from env if available
    const token = options.token || process.env.GITHUB_TOKEN;

    let response: Response;
    if (token) {
      // Direct GitHub API call
      response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'DevPersona/1.0',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables: { username } }),
      });
    } else if (typeof window !== 'undefined') {
      // Client-side: use proxy
      response = await fetch('/api/github/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { username } }),
      });
    } else {
      // No token and not in browser - cannot fetch
      return null;
    }

    if (!response.ok) return null;

    const data = await response.json();
    const calendar: ContributionCalendar = data.data?.user?.contributionsCollection?.contributionCalendar;

    if (!calendar) return null;

    // Calculate streaks
    const allDays = calendar.weeks.flatMap(w => w.contributionDays).reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Current streak (from today backwards)
    const today = new Date().toISOString().split('T')[0];
    for (const day of allDays) {
      if (day.date > today) continue;
      if (day.contributionCount > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest streak
    for (const day of allDays) {
      if (day.contributionCount > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const daysWithContributions = allDays.filter(d => d.contributionCount > 0).length;
    const totalDays = allDays.length;

    return {
      calendar,
      currentStreak,
      longestStreak,
      totalContributions: calendar.totalContributions,
      averagePerDay: totalDays > 0 ? Math.round((daysWithContributions / totalDays) * 100) / 100 : 0,
    };
  } catch (error) {
    console.error('Failed to fetch contributions:', error);
    return null;
  }
}

/**
 * Fetch community metrics for COMMUNITY signal
 * Samples top 10 repos and aggregates collaboration data
 */
export async function fetchCommunityMetrics(
  username: string,
  repos: GitHubRepo[],
  options: GitHubClientOptions = {}
): Promise<CommunityMetrics> {
  const apiBase = getApiBase(options.token);

  // Sample top 3 repos by stars (reduced for performance)
  const topRepos = repos
    .filter(r => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3);

  // Fetch PRs and issues in PARALLEL for all repos (skip contributors - too slow)
  const repoMetrics = await Promise.all(
    topRepos.map(async (repo) => {
      try {
        // Parallel fetch PRs and issues for this repo (reduced per_page for speed)
        const [prsResponse, issuesResponse] = await Promise.all([
          fetch(`${apiBase}/repos/${repo.full_name}/pulls?state=all&per_page=30`, {
            headers: getHeaders(options.token),
            next: { revalidate: 3600 },
          }),
          fetch(`${apiBase}/repos/${repo.full_name}/issues?state=all&per_page=30`, {
            headers: getHeaders(options.token),
            next: { revalidate: 3600 },
          }),
        ]);

        let prs = 0;
        let issues = 0;

        if (prsResponse.ok) {
          const prData: { user: { login: string } }[] = await prsResponse.json();
          prs = prData.filter(pr => pr.user.login.toLowerCase() !== username.toLowerCase()).length;
        }

        if (issuesResponse.ok) {
          const issueData: { user: { login: string }; pull_request?: unknown }[] = await issuesResponse.json();
          issues = issueData.filter(
            issue => !issue.pull_request && issue.user.login.toLowerCase() !== username.toLowerCase()
          ).length;
        }

        return { prs, issues };
      } catch {
        return { prs: 0, issues: 0 };
      }
    })
  );

  // Aggregate results
  const prsReceived = repoMetrics.reduce((sum, m) => sum + m.prs, 0);
  const issuesReceived = repoMetrics.reduce((sum, m) => sum + m.issues, 0);
  // Skip contributors count for performance - estimate from stars instead
  const contributorSet = new Set<string>();

  // Fetch external PRs (user's PRs to other repos) via search API with timeout
  let externalPRs = 0;
  try {
    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 5000);
    const searchResponse = await fetch(
      `${apiBase}/search/issues?q=author:${username}+type:pr+-user:${username}&per_page=10`,
      {
        headers: getHeaders(options.token),
        next: { revalidate: 3600 },
        signal: searchController.signal,
      }
    );
    clearTimeout(searchTimeout);
    if (searchResponse.ok) {
      const searchResult: { total_count: number } = await searchResponse.json();
      externalPRs = searchResult.total_count;
    }
  } catch {
    // Search API may fail or timeout, continue with 0
  }

  return {
    externalPRs,
    prsReceived,
    issuesReceived,
    uniqueContributors: contributorSet.size,
  };
}

/**
 * Fetch all GitHub data for a user
 */
export async function fetchAllGitHubData(
  username: string,
  options: GitHubClientOptions = {}
): Promise<{
  user: GitHubUser;
  repos: GitHubRepo[];
  commits: GitHubCommit[];
  contributions: ContributionStats | null;
}> {
  // Fetch user, repos, and contributions in parallel
  const [user, repos, contributions] = await Promise.all([
    fetchUser(username, options),
    fetchRepos(username, options, 100),
    fetchContributions(username, options),
  ]);

  // Fetch commits from repos
  const commits = await fetchCommits(username, repos, options);

  return { user, repos, commits, contributions };
}
