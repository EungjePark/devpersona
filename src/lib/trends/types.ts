/**
 * Types for Global Tech Trends feature
 */

export interface TrendingRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  todayStars: number;
  language: string | null;
  forks: number;
  url: string;
}

export interface LanguageTrend {
  name: string;
  percentage: number;
  growth: number; // percentage change
  repos: number;
}

export interface LibraryTrend {
  name: string;
  category: string;
  downloads: number;
  weeklyGrowth: number;
  stars: number;
}

export interface CountryStat {
  country: string;
  code: string;
  developers: number;
  topLanguage: string;
  avgContributions: number;
}

export interface RepoHealth {
  healthy: number;
  maintained: number;
  abandoned: number;
  total: number;
}

export interface GlobalTrends {
  trendingRepos: TrendingRepo[];
  languages: LanguageTrend[];
  libraries: LibraryTrend[];
  countries: CountryStat[];
  repoHealth: RepoHealth;
  lastUpdated: Date;
}

// Simulated trending data (since we can't hit external APIs freely)
export const SIMULATED_TRENDING_REPOS: TrendingRepo[] = [
  {
    name: 'cursor',
    fullName: 'getcursor/cursor',
    description: 'The AI Code Editor',
    stars: 45200,
    todayStars: 156,
    language: 'TypeScript',
    forks: 3210,
    url: 'https://github.com/getcursor/cursor',
  },
  {
    name: 'ai-agents',
    fullName: 'microsoft/ai-agents',
    description: 'Next-gen AI agent framework',
    stars: 38900,
    todayStars: 342,
    language: 'Python',
    forks: 4521,
    url: 'https://github.com/microsoft/ai-agents',
  },
  {
    name: 'bun',
    fullName: 'oven-sh/bun',
    description: 'Incredibly fast JavaScript runtime',
    stars: 78500,
    todayStars: 89,
    language: 'Zig',
    forks: 2890,
    url: 'https://github.com/oven-sh/bun',
  },
  {
    name: 'next.js',
    fullName: 'vercel/next.js',
    description: 'The React Framework',
    stars: 128000,
    todayStars: 67,
    language: 'JavaScript',
    forks: 27800,
    url: 'https://github.com/vercel/next.js',
  },
  {
    name: 'shadcn-ui',
    fullName: 'shadcn/ui',
    description: 'Beautifully designed components',
    stars: 82100,
    todayStars: 234,
    language: 'TypeScript',
    forks: 5120,
    url: 'https://github.com/shadcn/ui',
  },
];

export const SIMULATED_LANGUAGES: LanguageTrend[] = [
  { name: 'TypeScript', percentage: 24.5, growth: 8.2, repos: 12500000 },
  { name: 'Python', percentage: 22.1, growth: 5.4, repos: 11200000 },
  { name: 'JavaScript', percentage: 18.3, growth: -2.1, repos: 9800000 },
  { name: 'Rust', percentage: 8.7, growth: 24.6, repos: 1200000 },
  { name: 'Go', percentage: 7.2, growth: 6.8, repos: 980000 },
  { name: 'Java', percentage: 6.8, growth: -4.2, repos: 890000 },
  { name: 'C++', percentage: 4.5, growth: 1.2, repos: 650000 },
  { name: 'Kotlin', percentage: 3.2, growth: 12.4, repos: 420000 },
  { name: 'Swift', percentage: 2.4, growth: 3.8, repos: 310000 },
  { name: 'Zig', percentage: 1.8, growth: 45.2, repos: 85000 },
];

export const SIMULATED_LIBRARIES: LibraryTrend[] = [
  { name: 'React', category: 'Frontend', downloads: 23500000, weeklyGrowth: 2.1, stars: 230000 },
  { name: 'Next.js', category: 'Framework', downloads: 6800000, weeklyGrowth: 8.4, stars: 128000 },
  { name: 'Tailwind CSS', category: 'CSS', downloads: 12400000, weeklyGrowth: 5.2, stars: 85000 },
  { name: 'TypeScript', category: 'Language', downloads: 58000000, weeklyGrowth: 3.1, stars: 102000 },
  { name: 'Vite', category: 'Build Tool', downloads: 14200000, weeklyGrowth: 12.8, stars: 72000 },
  { name: 'shadcn/ui', category: 'UI', downloads: 890000, weeklyGrowth: 34.5, stars: 82100 },
  { name: 'tRPC', category: 'API', downloads: 2100000, weeklyGrowth: 6.2, stars: 35000 },
  { name: 'Zustand', category: 'State', downloads: 4500000, weeklyGrowth: 9.8, stars: 48000 },
];

export const SIMULATED_COUNTRIES: CountryStat[] = [
  { country: 'United States', code: 'US', developers: 4200000, topLanguage: 'TypeScript', avgContributions: 342 },
  { country: 'China', code: 'CN', developers: 3800000, topLanguage: 'JavaScript', avgContributions: 286 },
  { country: 'India', code: 'IN', developers: 2900000, topLanguage: 'Python', avgContributions: 198 },
  { country: 'Germany', code: 'DE', developers: 1200000, topLanguage: 'TypeScript', avgContributions: 412 },
  { country: 'United Kingdom', code: 'GB', developers: 980000, topLanguage: 'TypeScript', avgContributions: 378 },
  { country: 'Brazil', code: 'BR', developers: 890000, topLanguage: 'JavaScript', avgContributions: 245 },
  { country: 'Japan', code: 'JP', developers: 720000, topLanguage: 'Ruby', avgContributions: 356 },
  { country: 'South Korea', code: 'KR', developers: 580000, topLanguage: 'TypeScript', avgContributions: 425 },
];

export const SIMULATED_REPO_HEALTH: RepoHealth = {
  healthy: 4200000,
  maintained: 8900000,
  abandoned: 15200000,
  total: 28300000,
};
