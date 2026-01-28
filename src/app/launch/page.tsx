/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuth, useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { LoadingCard } from '@/components/ui/loading-card';
import { ImageUpload } from '@/components/ui/image-upload';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-tokens';
import { getCurrentWeekNumber, isLaunchWeekOpen, getTimeUntilVotingCloses, canSubmitLaunch } from '@/lib/builder-rank';
import { BUILDER_TIERS } from '@/lib/types';
import type { BuilderTierLevel } from '@/lib/types';
import type { Id } from '../../../convex/_generated/dataModel';

type SortMode = 'hot' | 'new' | 'top';
type FilterMode = 'all' | 'painkiller' | 'vitamin' | 'candy';

export default function LaunchWeekPage() {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  const githubUsername = user?.externalAccounts?.find(
    (acc) => acc.provider === 'github'
  )?.username || user?.username;

  // Get user's builder rank for tier
  const builderRank = useQuery(
    api.builderRanks.getByUsername,
    githubUsername ? { username: githubUsername } : 'skip'
  );
  const userTier = (builderRank?.tier ?? 1) as BuilderTierLevel;

  const weekNumber = getCurrentWeekNumber();
  const isOpen = isLaunchWeekOpen();
  const timeRemaining = getTimeUntilVotingCloses();

  // Fetch data
  const currentLaunches = useQuery(api.launches.getCurrentWeekLaunches);
  const lastWeekChampions = useQuery(api.launches.getLastWeekChampions);

  // Filter and sort launches
  const processedLaunches = useMemo(() => {
    if (!currentLaunches) return [];

    let filtered = [...currentLaunches];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.username.toLowerCase().includes(q)
      );
    }

    // Product type filter
    if (filterMode !== 'all') {
      filtered = filtered.filter((l) => {
        const votes = {
          painkiller: l.painkillerVotes || 0,
          vitamin: l.vitaminVotes || 0,
          candy: l.candyVotes || 0,
        };
        const maxType = Object.entries(votes).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        return maxType === filterMode;
      });
    }

    // Sort
    switch (sortMode) {
      case 'new':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'top':
        filtered.sort((a, b) => b.weightedScore - a.weightedScore);
        break;
      case 'hot':
      default:
        const maxCreatedAt = Math.max(...filtered.map(l => l.createdAt));
        filtered.sort((a, b) => {
          const hoursSinceA = (maxCreatedAt - a.createdAt) / (1000 * 60 * 60);
          const hoursSinceB = (maxCreatedAt - b.createdAt) / (1000 * 60 * 60);
          const hotA = a.weightedScore / Math.pow(hoursSinceA + 2, 1.5);
          const hotB = b.weightedScore / Math.pow(hoursSinceB + 2, 1.5);
          return hotB - hotA;
        });
    }

    return filtered;
  }, [currentLaunches, searchQuery, filterMode, sortMode]);

  // Top 3 leaders for podium
  const topThreeLeaders = useMemo(() => {
    if (!currentLaunches || currentLaunches.length < 3) return null;
    return [...currentLaunches]
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3);
  }, [currentLaunches]);

  const handleSubmitSuccess = useCallback(() => {
    setShowSubmitModal(false);
  }, []);

  return (
    <main className="min-h-screen bg-black">
      {/* Background Effects - Subtle, Linear-inspired */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-950/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-slate-900/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative">
        {/* Last Week's Champions Banner */}
        {lastWeekChampions && lastWeekChampions.winners.length >= 3 && (
          <section className="relative border-b border-amber-500/10 bg-gradient-to-b from-amber-950/20 via-black to-black overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/[0.08] rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-amber-500/30" />
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-widest">
                    Week {lastWeekChampions.weekNumber.split('-W')[1]} Champions
                  </h2>
                </div>
                <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-amber-500/30" />
              </div>

              {/* Champions Podium - Horizontal */}
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                {/* 2nd Place */}
                <Link
                  href={`/launch/${lastWeekChampions.winners[1].launchId}`}
                  className="group relative flex flex-col items-center w-[100px] sm:w-[120px]"
                >
                  <div className="relative">
                    {/* Rank badge */}
                    <div className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-500 flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-bold text-zinc-800">2</span>
                    </div>
                    {/* Avatar */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800 border-2 border-zinc-500/50 flex items-center justify-center overflow-hidden group-hover:scale-105 group-hover:border-zinc-400 transition-all">
                      {lastWeekChampions.winners[1].screenshot || lastWeekChampions.winners[1].ogImage ? (
                        <img
                          src={lastWeekChampions.winners[1].screenshot || lastWeekChampions.winners[1].ogImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">🥈</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-zinc-300 text-center line-clamp-1 group-hover:text-white transition-colors">
                    {lastWeekChampions.winners[1].title}
                  </p>
                  <p className="text-[10px] text-zinc-600">@{lastWeekChampions.winners[1].username}</p>
                  <div className="mt-1 px-2 py-0.5 rounded bg-zinc-800/80 text-[10px] font-medium text-zinc-400 tabular-nums">
                    {lastWeekChampions.winners[1].weightedScore} pts
                  </div>
                </Link>

                {/* 1st Place - Larger & Gold */}
                <Link
                  href={`/launch/${lastWeekChampions.winners[0].launchId}`}
                  className="group relative flex flex-col items-center w-[120px] sm:w-[140px] -mt-4"
                >
                  {/* Crown */}
                  <div className="text-2xl mb-1 animate-pulse" style={{ animationDuration: '3s' }}>👑</div>
                  <div className="relative">
                    {/* Glow ring */}
                    <div className="absolute inset-0 -m-1 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-500/40 blur-md group-hover:blur-lg transition-all" />
                    {/* Rank badge */}
                    <div className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <span className="text-xs font-bold text-black">1</span>
                    </div>
                    {/* Avatar */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-amber-500/10 border-2 border-amber-400/60 flex items-center justify-center overflow-hidden group-hover:scale-105 group-hover:border-amber-300 transition-all shadow-lg shadow-amber-500/20">
                      {lastWeekChampions.winners[0].screenshot || lastWeekChampions.winners[0].ogImage ? (
                        <img
                          src={lastWeekChampions.winners[0].screenshot || lastWeekChampions.winners[0].ogImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🥇</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-amber-100 text-center line-clamp-1 group-hover:text-white transition-colors">
                    {lastWeekChampions.winners[0].title}
                  </p>
                  <p className="text-xs text-amber-400/60">@{lastWeekChampions.winners[0].username}</p>
                  <div className="mt-1.5 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 tabular-nums">
                    {lastWeekChampions.winners[0].weightedScore} pts
                  </div>
                </Link>

                {/* 3rd Place */}
                <Link
                  href={`/launch/${lastWeekChampions.winners[2].launchId}`}
                  className="group relative flex flex-col items-center w-[100px] sm:w-[120px]"
                >
                  <div className="relative">
                    {/* Rank badge */}
                    <div className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                      <span className="text-[10px] font-bold text-amber-100">3</span>
                    </div>
                    {/* Avatar */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-900/20 border-2 border-amber-700/50 flex items-center justify-center overflow-hidden group-hover:scale-105 group-hover:border-amber-600 transition-all">
                      {lastWeekChampions.winners[2].screenshot || lastWeekChampions.winners[2].ogImage ? (
                        <img
                          src={lastWeekChampions.winners[2].screenshot || lastWeekChampions.winners[2].ogImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">🥉</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-zinc-300 text-center line-clamp-1 group-hover:text-white transition-colors">
                    {lastWeekChampions.winners[2].title}
                  </p>
                  <p className="text-[10px] text-zinc-600">@{lastWeekChampions.winners[2].username}</p>
                  <div className="mt-1 px-2 py-0.5 rounded bg-amber-900/30 text-[10px] font-medium text-amber-500/80 tabular-nums">
                    {lastWeekChampions.winners[2].weightedScore} pts
                  </div>
                </Link>
              </div>

              {/* Stats & Hall of Fame link */}
              <div className="mt-6 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-white tabular-nums">{lastWeekChampions.totalLaunches}</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wide">Launches</p>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-center">
                  <p className="text-lg font-bold text-white tabular-nums">{lastWeekChampions.totalVotes}</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wide">Votes</p>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <Link
                  href="/hall-of-fame"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                >
                  <span>View Hall of Fame</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Hero Header */}
        <header className="relative border-b border-white/[0.05] overflow-hidden">
          {/* Hero gradient - Subtle */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-transparent to-transparent" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              {/* Left: Title & Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🚀</span>
                  <div>
                    <h1
                      className="text-white font-semibold"
                      style={{
                        fontSize: typography.hero.size,
                        letterSpacing: typography.hero.tracking,
                      }}
                    >
                      Launch Week
                    </h1>
                    <p
                      className="text-zinc-400"
                      style={{ fontSize: typography.body.size }}
                    >
                      Week {weekNumber.split('-W')[1]} &bull; Ship your product, compete for glory
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full border",
                    isOpen
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    )} />
                    <span className="text-sm font-medium">
                      {isOpen && timeRemaining
                        ? `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`
                        : 'Opens Monday 00:00 UTC'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Stats & CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Quick Stats */}
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-center">
                    <div
                      className="text-white font-semibold"
                      style={{ fontSize: typography.title.size }}
                    >
                      {currentLaunches?.length || 0}
                    </div>
                    <div className="text-xs text-zinc-500">Launches</div>
                  </div>
                  <div className="w-px h-10 bg-white/[0.05]" />
                  <div className="text-center">
                    <div
                      className="text-white font-semibold"
                      style={{ fontSize: typography.title.size }}
                    >
                      {currentLaunches?.reduce((sum, l) => sum + l.voteCount, 0) || 0}
                    </div>
                    <div className="text-xs text-zinc-500">Votes</div>
                  </div>
                </div>

                {/* Submit CTA - Refined, Apple-like */}
                {authLoaded && !isSignedIn ? (
                  <SignInButton mode="modal">
                    <Button
                      className={cn(
                        "h-11 px-5 rounded-xl font-medium text-sm",
                        "bg-white text-zinc-900",
                        "hover:bg-zinc-100",
                        "shadow-md shadow-black/20",
                        "transition-all duration-200"
                      )}
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Sign in to Launch
                    </Button>
                  </SignInButton>
                ) : (
                  <Button
                    onClick={() => setShowSubmitModal(true)}
                    disabled={!isOpen}
                    className={cn(
                      "h-11 px-5 rounded-xl font-medium text-sm",
                      "bg-white text-zinc-900",
                      "hover:bg-zinc-100",
                      "shadow-md shadow-black/20",
                      "disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    <span className="mr-1.5 text-base">+</span>
                    Submit Launch
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Podium Section - Linear/Apple-inspired */}
          {topThreeLeaders && (
            <section className="mb-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/50 border border-zinc-800/60">
                {/* Ambient spotlight */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/[0.08] rounded-full blur-[100px]" />
                </div>

                <div className="relative px-6 py-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                        <span className="text-lg">🏆</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight">
                          This Week&apos;s Leaders
                        </h2>
                        <p className="text-xs text-zinc-500">Live rankings • Top 3</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wide">Live</span>
                    </div>
                  </div>

                  {/* Podium - 3-column layout */}
                  <div className="grid grid-cols-3 gap-4 items-end">
                    {/* 2nd Place */}
                    <Link href={`/launch/${topThreeLeaders[1]._id}`} className="group order-1">
                      <div className="relative flex flex-col items-center p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30 hover:border-zinc-600/50 transition-all hover:translate-y-[-2px]">
                        {/* Rank badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 border border-zinc-200/30 shadow-lg">
                          <span className="text-sm font-bold text-zinc-800">2</span>
                        </div>

                        {/* Product thumbnail */}
                        <div className="mt-4 w-16 h-16 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                          {topThreeLeaders[1].screenshot ? (
                            <img src={topThreeLeaders[1].screenshot} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">🥈</span>
                          )}
                        </div>

                        {/* Info */}
                        <h3 className="mt-3 text-sm font-medium text-zinc-200 text-center line-clamp-1 group-hover:text-white transition-colors">
                          {topThreeLeaders[1].title}
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">@{topThreeLeaders[1].username}</p>
                        <div className="mt-2 px-2.5 py-1 rounded-md bg-zinc-700/50 text-xs font-semibold text-zinc-300 tabular-nums">
                          {topThreeLeaders[1].weightedScore} pts
                        </div>
                      </div>

                      {/* Podium bar */}
                      <div className="mt-2 h-16 rounded-t-lg bg-gradient-to-t from-zinc-600/30 to-zinc-700/10 border-t border-x border-zinc-600/20" />
                    </Link>

                    {/* 1st Place */}
                    <Link href={`/launch/${topThreeLeaders[0]._id}`} className="group order-2">
                      <div className="relative flex flex-col items-center p-5 rounded-xl bg-gradient-to-b from-amber-500/10 to-amber-900/5 border border-amber-500/25 hover:border-amber-400/40 transition-all hover:translate-y-[-2px] shadow-lg shadow-amber-500/5">
                        {/* Crown */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce" style={{ animationDuration: '2s' }}>
                          👑
                        </div>

                        {/* Rank badge */}
                        <div className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300/50 shadow-lg shadow-amber-500/30">
                          <span className="text-sm font-bold text-black">1</span>
                        </div>

                        {/* Product thumbnail */}
                        <div className="mt-3 w-20 h-20 rounded-xl bg-amber-500/15 border-2 border-amber-400/50 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-lg shadow-amber-500/20">
                          {topThreeLeaders[0].screenshot ? (
                            <img src={topThreeLeaders[0].screenshot} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">🥇</span>
                          )}
                        </div>

                        {/* Info */}
                        <h3 className="mt-3 text-base font-semibold text-amber-100 text-center line-clamp-1 group-hover:text-white transition-colors">
                          {topThreeLeaders[0].title}
                        </h3>
                        <p className="text-xs text-amber-400/60 mt-0.5">@{topThreeLeaders[0].username}</p>
                        <div className="mt-2.5 px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-sm font-bold text-amber-300 tabular-nums">
                          {topThreeLeaders[0].weightedScore} pts
                        </div>
                      </div>

                      {/* Podium bar - tallest */}
                      <div className="mt-2 h-24 rounded-t-lg bg-gradient-to-t from-amber-500/25 to-amber-600/5 border-t border-x border-amber-500/30" />
                    </Link>

                    {/* 3rd Place */}
                    <Link href={`/launch/${topThreeLeaders[2]._id}`} className="group order-3">
                      <div className="relative flex flex-col items-center p-4 rounded-xl bg-amber-900/10 border border-amber-800/20 hover:border-amber-700/40 transition-all hover:translate-y-[-2px]">
                        {/* Rank badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500/30 shadow-lg">
                          <span className="text-sm font-bold text-amber-100">3</span>
                        </div>

                        {/* Product thumbnail */}
                        <div className="mt-4 w-16 h-16 rounded-xl bg-amber-900/30 border border-amber-800/40 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                          {topThreeLeaders[2].screenshot ? (
                            <img src={topThreeLeaders[2].screenshot} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">🥉</span>
                          )}
                        </div>

                        {/* Info */}
                        <h3 className="mt-3 text-sm font-medium text-zinc-200 text-center line-clamp-1 group-hover:text-white transition-colors">
                          {topThreeLeaders[2].title}
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">@{topThreeLeaders[2].username}</p>
                        <div className="mt-2 px-2.5 py-1 rounded-md bg-amber-800/30 text-xs font-semibold text-amber-400/80 tabular-nums">
                          {topThreeLeaders[2].weightedScore} pts
                        </div>
                      </div>

                      {/* Podium bar - shortest */}
                      <div className="mt-2 h-10 rounded-t-lg bg-gradient-to-t from-amber-700/20 to-amber-800/5 border-t border-x border-amber-700/20" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.05]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-black text-zinc-500 text-sm">All Launches</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search launches..."
                className={cn(
                  "w-full h-11 pl-11 pr-4 rounded-xl",
                  "bg-white/[0.03] border border-white/[0.05]",
                  "text-sm text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-zinc-600 focus:bg-white/[0.04]",
                  "transition-all"
                )}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                {(['hot', 'new', 'top'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      sortMode === mode
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {mode === 'hot' && '🔥 '}
                    {mode === 'new' && '✨ '}
                    {mode === 'top' && '👑 '}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1">
                {(['all', 'painkiller', 'vitamin', 'candy'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterMode(type)}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all",
                      filterMode === type
                        ? type === 'painkiller' ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                          type === 'vitamin' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                          type === 'candy' ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" :
                          "bg-white/10 text-white border border-white/10"
                        : "text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/10"
                    )}
                    title={type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    {type === 'all' ? '∀' : type === 'painkiller' ? '💊' : type === 'vitamin' ? '💚' : '🍬'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Launches Grid */}
          {currentLaunches === undefined ? (
            <LoadingCard message="Loading launches..." />
          ) : processedLaunches.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-zinc-400 text-lg mb-2">
                {searchQuery || filterMode !== 'all'
                  ? 'No launches match your filters'
                  : 'No launches yet this week'}
              </p>
              {isOpen && !searchQuery && filterMode === 'all' && (
                authLoaded && !isSignedIn ? (
                  <SignInButton mode="modal">
                    <Button className="mt-4 bg-white/10 hover:bg-white/20 text-white">
                      Sign in to launch
                    </Button>
                  </SignInButton>
                ) : (
                  <Button
                    onClick={() => setShowSubmitModal(true)}
                    className="mt-4 bg-white/10 hover:bg-white/20 text-white"
                  >
                    Be the first to launch
                  </Button>
                )
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedLaunches.map((launch, index) => (
                <LaunchGridCard
                  key={launch._id}
                  launch={launch}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && isSignedIn && githubUsername && (
        <LaunchSubmitModal
          username={githubUsername}
          userTier={userTier}
          weekNumber={weekNumber}
          onSuccess={handleSubmitSuccess}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </main>
  );
}

// Launch Card Component (Grid Version)
interface LaunchGridCardProps {
  launch: {
    _id: string;
    title: string;
    description: string;
    username: string;
    demoUrl?: string;
    screenshot?: string;
    weightedScore: number;
    voteCount: number;
    painkillerVotes?: number;
    vitaminVotes?: number;
    candyVotes?: number;
    createdAt: number;
  };
  index: number;
}

function LaunchGridCard({ launch, index }: LaunchGridCardProps) {
  const dominantType = useMemo(() => {
    const votes = {
      painkiller: launch.painkillerVotes || 0,
      vitamin: launch.vitaminVotes || 0,
      candy: launch.candyVotes || 0,
    };
    const maxType = Object.entries(votes).reduce((a, b) => (b[1] > a[1] ? b : a));
    return maxType[1] > 0 ? maxType[0] : null;
  }, [launch]);

  return (
    <Link href={`/launch/${launch._id}`}>
      <article
        className={cn(
          "group relative rounded-2xl overflow-hidden",
          "bg-white/[0.02] border border-white/[0.05]",
          "hover:bg-white/[0.04] hover:border-white/10",
          "transition-all duration-300",
          "animate-in fade-in-0 slide-in-from-bottom-2"
        )}
        style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
      >
        {/* Screenshot */}
        <div className="relative aspect-video bg-gradient-to-br from-white/[0.02] to-transparent">
          {launch.screenshot ? (
            <img
              src={launch.screenshot}
              alt={launch.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center text-3xl">
                🚀
              </div>
            </div>
          )}

          {/* Score Badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="text-sm font-bold text-white">{launch.weightedScore}</span>
            <span className="text-xs text-zinc-400 ml-1">pts</span>
          </div>

          {/* Type Badge */}
          {dominantType && (
            <div className={cn(
              "absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-black/60 backdrop-blur-sm border",
              dominantType === 'painkiller' && "border-red-500/30",
              dominantType === 'vitamin' && "border-emerald-500/30",
              dominantType === 'candy' && "border-pink-500/30"
            )}>
              {dominantType === 'painkiller' && '💊'}
              {dominantType === 'vitamin' && '💚'}
              {dominantType === 'candy' && '🍬'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white mb-1 group-hover:text-zinc-100 transition-colors line-clamp-1">
            {launch.title}
          </h3>
          <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
            {launch.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">by @{launch.username}</span>
            <span className="text-xs text-zinc-500">{launch.voteCount} votes</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Submit Modal Component
interface LaunchSubmitModalProps {
  username: string;
  userTier: BuilderTierLevel;
  weekNumber: string;
  onSuccess: () => void;
  onClose: () => void;
}

function LaunchSubmitModal({ username, userTier, weekNumber, onSuccess, onClose }: LaunchSubmitModalProps) {
    const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [targetAudience, setTargetAudience] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedIdeaId, setLinkedIdeaId] = useState<Id<"ideaValidations"> | null>(null);

  const submitLaunch = useMutation(api.launches.submitLaunch);
  const validatedIdeas = useQuery(api.ideaValidations.getValidatedIdeas, { username });

  const canSubmit = canSubmitLaunch();
  const tierInfo = BUILDER_TIERS[userTier];

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim() || !description.trim() || !demoUrl.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      new URL(demoUrl);
    } catch {
      setError('Please enter a valid demo URL');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLaunch({
        username,
        title: title.trim(),
        description: description.trim(),
        demoUrl: demoUrl.trim(),
        githubUrl: githubUrl.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        problemSolved: problemSolved.trim() || undefined,
        weekNumber,
        screenshot,
        linkedIdeaId: linkedIdeaId || undefined,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit launch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tier check
  if (!canSubmit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-white/10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl">
              {tierInfo.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Tier Required</h3>
            <p className="text-zinc-400 mb-4">
              You need to be <span className="text-amber-400 font-medium">Pilot (T2)</span> or higher to submit launches.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-sm">
              <span className="text-zinc-500">Current tier:</span>
              <span className="text-white font-medium">{tierInfo.name}</span>
            </div>
            <Button onClick={onClose} className="w-full mt-6">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header - Clean, Linear-style */}
        <div className="relative px-6 py-5 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-xl">
                🚀
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">Launch Your Product</h2>
                <p className="text-sm text-zinc-500">Week {weekNumber.split('-W')[1]}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Product Screenshot
              <span className="text-zinc-500 font-normal ml-2">(Recommended)</span>
            </label>
            <ImageUpload
              value={screenshot}
              onChange={setScreenshot}
              placeholder="Drop your product screenshot here"
              aspectRatio="video"
            />
          </div>

          {/* Demo URL */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Demo URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://your-product.com"
              className={cn(
                "w-full h-12 px-4 rounded-xl text-base",
                "bg-white/[0.03] border border-white/10",
                "text-white placeholder:text-zinc-600",
                "focus:outline-none focus:border-zinc-600 focus:bg-white/[0.04]",
                "transition-all"
              )}
            />
          </div>

          {/* Title & Description */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Product"
                maxLength={50}
                className={cn(
                  "w-full h-11 px-4 rounded-xl text-sm",
                  "bg-white/[0.03] border border-white/10",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-zinc-600",
                  "transition-all"
                )}
              />
              <div className="mt-1 text-right text-xs text-zinc-600">{title.length}/50</div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                One-liner <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Build better products with AI-powered insights"
                maxLength={100}
                className={cn(
                  "w-full h-11 px-4 rounded-xl text-sm",
                  "bg-white/[0.03] border border-white/10",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:border-zinc-600",
                  "transition-all"
                )}
              />
              <div className="mt-1 text-right text-xs text-zinc-600">{description.length}/100</div>
            </div>
          </div>

          {/* Optional Fields */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 hover:text-white transition-colors">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Additional details (optional)
            </summary>

            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">GitHub Repository</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    className={cn(
                      "w-full h-10 px-3 rounded-lg text-sm",
                      "bg-white/[0.03] border border-white/10",
                      "text-white placeholder:text-zinc-600",
                      "focus:outline-none focus:border-zinc-600",
                      "transition-all"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Target Audience</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Developers, Designers..."
                    maxLength={100}
                    className={cn(
                      "w-full h-10 px-3 rounded-lg text-sm",
                      "bg-white/[0.03] border border-white/10",
                      "text-white placeholder:text-zinc-600",
                      "focus:outline-none focus:border-zinc-600",
                      "transition-all"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Problem it Solves</label>
                <input
                  type="text"
                  value={problemSolved}
                  onChange={(e) => setProblemSolved(e.target.value)}
                  placeholder="What pain point does this address?"
                  maxLength={150}
                  className={cn(
                    "w-full h-10 px-3 rounded-lg text-sm",
                    "bg-white/[0.03] border border-white/10",
                    "text-white placeholder:text-zinc-600",
                    "focus:outline-none focus:border-zinc-600",
                    "transition-all"
                  )}
                />
              </div>

              {/* Linked Validated Idea */}
              {validatedIdeas && validatedIdeas.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Link Validated Idea
                    <span className="ml-2 text-emerald-400">(Community Validated)</span>
                  </label>
                  <select
                    value={linkedIdeaId || ''}
                    onChange={(e) => setLinkedIdeaId(e.target.value ? e.target.value as Id<"ideaValidations"> : null)}
                    className={cn(
                      "w-full h-10 px-3 rounded-lg text-sm appearance-none",
                      "bg-white/[0.03] border border-white/10",
                      "text-white",
                      "focus:outline-none focus:border-emerald-500/50",
                      "transition-all",
                      linkedIdeaId && "border-emerald-500/30"
                    )}
                  >
                    <option value="" className="bg-zinc-900">No linked idea</option>
                    {validatedIdeas.map((idea) => (
                      <option key={idea._id} value={idea._id} className="bg-zinc-900">
                        {idea.title} (+{idea.supportVotes - idea.opposeVotes} votes)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </details>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <span className="text-red-400">⚠️</span>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Clean, Linear-style */}
        <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/50 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 h-10 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim() || !demoUrl.trim()}
            className={cn(
              "h-10 px-5 rounded-lg font-medium text-sm",
              "bg-white text-zinc-900",
              "hover:bg-zinc-100",
              "shadow-md shadow-black/20",
              "disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Launching…
              </>
            ) : (
              <>
                <span className="mr-1.5">🚀</span>
                Launch Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
