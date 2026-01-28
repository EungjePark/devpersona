'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { TIERS, type TierLevel } from '@/lib/types';
import {
  type TopUser,
  type RankingCategory,
  sortUsersByCategory,
  formatCompactNumber,
} from '@/lib/leaderboard-types';
import { cn } from '@/lib/utils';

// Ranking tab configuration
const RANKING_TABS: { id: RankingCategory; label: string }[] = [
  { id: 'rating', label: 'Rating' },
  { id: 'stars', label: 'Stars' },
  { id: 'followers', label: 'Followers' },
];

// Tier filter options
const TIER_OPTIONS = ['all', 'S', 'A', 'B', 'C'] as const;

// Memoized user row - Apple-style minimal
const UserRow = memo(function UserRow({
  user,
  rank,
  displayValue,
}: {
  user: TopUser;
  rank: number;
  displayValue: string;
}) {
  const tier = TIERS[user.tier as TierLevel];

  return (
    <Link
      href={`/analyze/${user.username}`}
      className="group flex items-center gap-5 py-4 px-2 border-b border-zinc-800/50 last:border-0 transition-colors hover:bg-zinc-900/30"
    >
      {/* Rank */}
      <div className="shrink-0 w-10 text-center">
        <span className={cn(
          "text-lg font-semibold tabular-nums",
          rank === 1 && "text-amber-400",
          rank === 2 && "text-zinc-300",
          rank === 3 && "text-amber-600",
          rank > 3 && "text-zinc-600"
        )}>
          {rank}
        </span>
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-800 group-hover:border-zinc-700 transition-colors">
          <Image
            src={user.avatarUrl}
            alt={user.username}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
            @{user.username}
          </p>
          <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
            {user.archetypeId.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Tier Badge */}
      <div
        className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold"
        style={{
          backgroundColor: `${tier.color}15`,
          color: tier.color,
        }}
      >
        {tier.name}
      </div>

      {/* Language */}
      <div className="shrink-0 w-16 text-center">
        <span className="text-[13px] text-zinc-500">
          {user.topLanguage || '—'}
        </span>
      </div>

      {/* Value */}
      <div className="shrink-0 w-16 text-right">
        <span className="text-[15px] font-semibold tabular-nums text-zinc-300">
          {displayValue}
        </span>
      </div>

      {/* Arrow */}
      <svg className="shrink-0 w-4 h-4 text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
});

// Loading skeleton - Apple-style
const LeaderboardSkeleton = memo(function LeaderboardSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 py-4 px-2 animate-pulse">
          <div className="w-10 h-6 bg-zinc-800/50 rounded" />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-zinc-800/50 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-zinc-800/50 rounded" />
              <div className="h-3 w-16 bg-zinc-800/50 rounded" />
            </div>
          </div>
          <div className="w-14 h-6 bg-zinc-800/50 rounded" />
          <div className="w-16 h-4 bg-zinc-800/50 rounded" />
          <div className="w-16 h-5 bg-zinc-800/50 rounded" />
        </div>
      ))}
    </div>
  );
});

// Top 3 Podium Component
const Podium = memo(function Podium({ users }: { users: TopUser[] }) {
  if (users.length < 3) return null;

  const podiumOrder = [users[1], users[0], users[2]]; // 2nd, 1st, 3rd
  const heights = ['h-24', 'h-32', 'h-20'];
  const ranks = [2, 1, 3];

  return (
    <div className="flex items-end justify-center gap-4 mb-12">
      {podiumOrder.map((user, idx) => {
        return (
          <Link
            key={user.username}
            href={`/analyze/${user.username}`}
            className="group flex flex-col items-center"
          >
            {/* Avatar */}
            <div className={cn(
              "relative rounded-full overflow-hidden border-2 mb-3 transition-transform group-hover:scale-105",
              idx === 1 ? "w-20 h-20 border-amber-400" : "w-14 h-14 border-zinc-700"
            )}>
              <Image
                src={user.avatarUrl}
                alt={user.username}
                fill
                sizes={idx === 1 ? "80px" : "56px"}
                className="object-cover"
              />
            </div>
            {/* Name */}
            <p className="text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors mb-1">
              @{user.username}
            </p>
            <p className="text-[11px] text-zinc-600 mb-3">{user.overallRating} pts</p>
            {/* Pedestal */}
            <div className={cn(
              "w-24 rounded-t-lg flex items-start justify-center pt-3 transition-colors",
              heights[idx],
              idx === 1 ? "bg-gradient-to-b from-amber-900/40 to-amber-950/20 border-t border-x border-amber-700/30" :
              idx === 0 ? "bg-gradient-to-b from-zinc-800/50 to-zinc-900/30 border-t border-x border-zinc-700/30" :
              "bg-gradient-to-b from-amber-950/30 to-zinc-900/20 border-t border-x border-amber-800/20"
            )}>
              <span className={cn(
                "text-2xl font-bold",
                idx === 1 ? "text-amber-400" : idx === 0 ? "text-zinc-400" : "text-amber-600"
              )}>
                {ranks[idx]}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
});

function LeaderboardContent() {
  const [filter, setFilter] = useState<'all' | TierLevel>('all');
  const [rankingCategory, setRankingCategory] = useState<RankingCategory>('rating');
  const snapshot = useQuery(api.analyses.getLeaderboardSnapshot);

  const topUsers = useMemo(() => snapshot?.topUsers ?? [], [snapshot?.topUsers]);
  const isEmpty = topUsers.length === 0;
  const totalUsers = snapshot?.totalUsers ?? 0;

  // Filter by tier, then sort by category
  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = filter === 'all'
      ? topUsers
      : topUsers.filter((u: TopUser) => u.tier === filter);
    return sortUsersByCategory(filtered, rankingCategory).slice(0, 50);
  }, [topUsers, filter, rankingCategory]);

  // Top 3 for podium
  const topThree = useMemo(() => {
    if (rankingCategory !== 'rating') return [];
    return sortUsersByCategory(topUsers, 'rating').slice(0, 3);
  }, [topUsers, rankingCategory]);

  // Display value getter
  const getDisplayValue = useCallback((user: TopUser): string => {
    switch (rankingCategory) {
      case 'stars':
        return user.totalStars ? formatCompactNumber(user.totalStars) : '—';
      case 'followers':
        return user.followers ? formatCompactNumber(user.followers) : '—';
      case 'rating':
      default:
        return user.overallRating.toString();
    }
  }, [rankingCategory]);

  const isLoading = snapshot === undefined;

  return (
    <main className="min-h-screen bg-black text-white antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-black/80 border-b border-zinc-800/50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-[13px] font-medium tracking-wide text-zinc-400">Leaderboard</span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <header className="mb-12 text-center">
          <h1 className="text-[40px] font-semibold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Global Rankings
          </h1>
          <p className="text-zinc-500 text-[17px] mt-3">
            {totalUsers.toLocaleString()} developers analyzed
          </p>
        </header>

        {/* Podium (only for rating) */}
        {!isLoading && topThree.length >= 3 && rankingCategory === 'rating' && (
          <Podium users={topThree} />
        )}

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {RANKING_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRankingCategory(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-[13px] font-medium transition-all",
                rankingCategory === tab.id
                  ? "bg-white text-black"
                  : "text-zinc-500 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tier Filter */}
        <div className="flex justify-center gap-1.5 mb-8">
          {TIER_OPTIONS.map((tier) => {
            const tierInfo = tier === 'all' ? null : TIERS[tier];
            return (
              <button
                key={tier}
                onClick={() => setFilter(tier)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                  filter === tier
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-600 hover:text-zinc-400"
                )}
                style={filter === tier && tierInfo ? {
                  backgroundColor: `${tierInfo.color}20`,
                  color: tierInfo.color
                } : undefined}
              >
                {tier === 'all' ? 'All' : tierInfo?.name}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <section className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-5 py-3 px-2 border-b border-zinc-800/50 bg-zinc-900/50">
            <div className="w-10 text-center text-[11px] text-zinc-600 uppercase tracking-widest">#</div>
            <div className="flex-1 text-[11px] text-zinc-600 uppercase tracking-widest">Developer</div>
            <div className="w-14 text-center text-[11px] text-zinc-600 uppercase tracking-widest">Tier</div>
            <div className="w-16 text-center text-[11px] text-zinc-600 uppercase tracking-widest">Lang</div>
            <div className="w-16 text-right text-[11px] text-zinc-600 uppercase tracking-widest">
              {rankingCategory === 'stars' ? 'Stars' : rankingCategory === 'followers' ? 'Follow' : 'Score'}
            </div>
            <div className="w-4" />
          </div>

          {/* Rows */}
          {isLoading ? (
            <LeaderboardSkeleton />
          ) : sortedAndFilteredUsers.length === 0 ? (
            <div className="py-20 text-center">
              {isEmpty ? (
                <div className="space-y-2">
                  <p className="text-zinc-500 text-[15px]">No developers analyzed yet</p>
                  <p className="text-zinc-700 text-[13px]">Be the first to join!</p>
                </div>
              ) : (
                <p className="text-zinc-500 text-[15px]">No developers in this tier</p>
              )}
            </div>
          ) : (
            <div>
              {sortedAndFilteredUsers.map((user: TopUser, index: number) => (
                <UserRow
                  key={user.username}
                  user={user}
                  rank={index + 1}
                  displayValue={getDisplayValue(user)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-[12px] text-zinc-700">
            Rankings update in real-time
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function LeaderboardClient() {
  return (
    <ConvexClientProvider>
      <LeaderboardContent />
    </ConvexClientProvider>
  );
}
