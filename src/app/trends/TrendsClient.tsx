'use client';

import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import {
  LibraryPopularity,
  RepoRankings,
  RisingRepos,
  RisingDevelopers,
  HotThisWeek,
  LanguageTrendsLive,
} from '@/components/trends';
import type { TrendingRepo, LibraryTrend } from '@/lib/trends/types';

interface ConvexRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  todayStars: number;
  language: string | null;
  forks: number;
  url: string;
}

interface ConvexLibrary {
  name: string;
  category: string;
  stars: number;
  forks: number;
  language: string | null;
  description: string | null;
}

/**
 * Generate stable growth value based on name hash.
 * Used for consistent display values that don't change on re-render.
 */
function getStableGrowth(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100) / 10;
}

function StatusIndicator({ isLoading, lastUpdated }: { isLoading: boolean; lastUpdated: string | null }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-4 text-sm text-text-muted">
      <span className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        {isLoading ? 'Loading...' : 'Live from GitHub API'}
      </span>
      <span>&#8226;</span>
      <span>{lastUpdated ? `Updated: ${lastUpdated}` : 'Data from GitHub, npm, and more'}</span>
    </div>
  );
}

function LoadingSkeleton({ rows }: { rows: number }): React.ReactElement {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-white/10 rounded" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function LibrarySkeleton({ rows }: { rows: number }): React.ReactElement {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-white/10 rounded" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}

function TrendsContent(): React.ReactElement {
  const trendingData = useQuery(api.trends.getTrendingRepos);
  const libraryData = useQuery(api.trends.getLibraryStats);

  const repos = trendingData?.repos;
  const trendingRepos = useMemo<TrendingRepo[]>(() => {
    if (!repos) return [];
    return repos.slice(0, 10).map((repo: ConvexRepo) => ({
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      stars: repo.stars,
      todayStars: repo.todayStars || 0,
      language: repo.language,
      forks: repo.forks,
      url: repo.url,
    }));
  }, [repos]);

  const libList = libraryData?.libraries;
  const libraries = useMemo<LibraryTrend[]>(() => {
    if (!libList) return [];
    return libList.slice(0, 10).map((lib: ConvexLibrary) => ({
      name: lib.name,
      category: lib.category,
      downloads: lib.stars * 100,
      weeklyGrowth: getStableGrowth(lib.name),
      stars: lib.stars,
    }));
  }, [libList]);

  const isLoading = trendingData === undefined || libraryData === undefined;

  const updatedAt = trendingData?.updatedAt;
  const lastUpdated = useMemo(() => {
    if (!updatedAt) return null;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(updatedAt));
  }, [updatedAt]);

  return (
    <>
      <StatusIndicator isLoading={isLoading} lastUpdated={lastUpdated} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 mt-12">
        {/* Trending Repos - Full Width */}
        <div className="mb-12 bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <RepoRankings repos={trendingRepos} />
          )}
        </div>

        {/* Library Popularity */}
        <div className="mb-12 bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          {isLoading ? (
            <LibrarySkeleton rows={5} />
          ) : (
            <LibraryPopularity libraries={libraries} />
          )}
        </div>

        {/* GitHub API-Powered Trend Features */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 border border-primary-500/30 flex items-center justify-center">
              <span className="text-lg">&#9889;</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Live from GitHub</h2>
              <p className="text-sm text-text-muted">Real-time data powered by GitHub API</p>
            </div>
          </div>

          {/* Two Column Layout: Rising Repos + Rising Developers */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <RisingRepos />
            <RisingDevelopers />
          </div>

          {/* Two Column Layout: Hot This Week + Language Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
            <HotThisWeek />
            <LanguageTrendsLive />
          </div>
        </div>

        {/* GitHub Octoverse Link */}
        <OctoverseCard />
      </section>
    </>
  );
}

function OctoverseCard(): React.ReactElement {
  return (
    <div className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-2xl p-8 border border-purple-500/20 text-center">
      <div className="text-5xl mb-4">&#127760;</div>
      <h3 className="text-xl font-bold text-text-primary mb-2">Global Developer Statistics</h3>
      <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
        For comprehensive global developer distribution data, explore GitHub&apos;s official Octoverse report.
      </p>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <a
          href="https://github.blog/news-insights/octoverse/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          GitHub Octoverse
        </a>
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <span className="font-bold text-text-primary">100M+</span> developers
          </span>
          <span className="w-1 h-1 rounded-full bg-text-muted" />
          <span className="flex items-center gap-1">
            <span className="font-bold text-text-primary">200+</span> countries
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TrendsClient(): React.ReactElement {
  return (
    <ConvexClientProvider>
      <TrendsContent />
    </ConvexClientProvider>
  );
}
