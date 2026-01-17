'use client';

import { useState, useMemo } from 'react';
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

// Demo users for when no real data exists
const DEMO_USERS: TopUser[] = [
  { username: 'torvalds', avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4', overallRating: 98, tier: 'S', archetypeId: 'maintainer', totalStars: 180200, followers: 215000, topLanguage: 'C' },
  { username: 'gaearon', avatarUrl: 'https://avatars.githubusercontent.com/u/810438?v=4', overallRating: 94, tier: 'S', archetypeId: 'specialist', totalStars: 145800, followers: 89000, topLanguage: 'JavaScript' },
  { username: 'sindresorhus', avatarUrl: 'https://avatars.githubusercontent.com/u/170270?v=4', overallRating: 91, tier: 'S', archetypeId: 'silent_builder', totalStars: 120500, followers: 75000, topLanguage: 'TypeScript' },
  { username: 'shadcn', avatarUrl: 'https://avatars.githubusercontent.com/u/124599?v=4', overallRating: 89, tier: 'A', archetypeId: 'specialist', totalStars: 89000, followers: 45000, topLanguage: 'TypeScript' },
  { username: 'yyx990803', avatarUrl: 'https://avatars.githubusercontent.com/u/499550?v=4', overallRating: 95, tier: 'S', archetypeId: 'maintainer', totalStars: 210000, followers: 120000, topLanguage: 'JavaScript' },
  { username: 'tannerlinsley', avatarUrl: 'https://avatars.githubusercontent.com/u/5580297?v=4', overallRating: 87, tier: 'A', archetypeId: 'maintainer', totalStars: 78000, followers: 35000, topLanguage: 'TypeScript' },
  { username: 'tj', avatarUrl: 'https://avatars.githubusercontent.com/u/25254?v=4', overallRating: 88, tier: 'A', archetypeId: 'prototype_machine', totalStars: 98000, followers: 67000, topLanguage: 'Go' },
  { username: 'getify', avatarUrl: 'https://avatars.githubusercontent.com/u/150330?v=4', overallRating: 82, tier: 'A', archetypeId: 'archivist', totalStars: 45000, followers: 32000, topLanguage: 'JavaScript' },
  { username: 'addyosmani', avatarUrl: 'https://avatars.githubusercontent.com/u/110953?v=4', overallRating: 85, tier: 'A', archetypeId: 'hype_surfer', totalStars: 56000, followers: 55000, topLanguage: 'JavaScript' },
  { username: 'rauchg', avatarUrl: 'https://avatars.githubusercontent.com/u/13041?v=4', overallRating: 86, tier: 'A', archetypeId: 'specialist', totalStars: 67000, followers: 85000, topLanguage: 'TypeScript' },
];

// Ranking tab configuration
const RANKING_TABS: { id: RankingCategory; label: string; icon: string }[] = [
  { id: 'rating', label: 'OVR Rating', icon: '🏆' },
  { id: 'stars', label: 'Total Stars', icon: '⭐' },
  { id: 'followers', label: 'Followers', icon: '👥' },
];

function LeaderboardContent() {
  const [filter, setFilter] = useState<'all' | TierLevel>('all');
  const [rankingCategory, setRankingCategory] = useState<RankingCategory>('rating');
  const snapshot = useQuery(api.analyses.getLeaderboardSnapshot);

  const topUsers = snapshot?.topUsers?.length ? snapshot.topUsers : DEMO_USERS;
  const isDemo = !snapshot?.topUsers?.length;
  const totalUsers = snapshot?.totalUsers ?? 100;

  // Filter by tier, then sort by category
  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = filter === 'all'
      ? topUsers
      : topUsers.filter((u: TopUser) => u.tier === filter);
    return sortUsersByCategory(filtered, rankingCategory);
  }, [topUsers, filter, rankingCategory]);

  // Get value to display based on category
  const getDisplayValue = (user: TopUser): string => {
    switch (rankingCategory) {
      case 'stars':
        return user.totalStars ? formatCompactNumber(user.totalStars) : '-';
      case 'followers':
        return user.followers ? formatCompactNumber(user.followers) : '-';
      case 'rating':
      default:
        return user.overallRating.toString();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors group px-4 py-2 rounded-full hover:bg-white/5"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span className="font-medium">Home</span>
          </Link>

          {isDemo && (
            <span className="text-xs text-text-muted px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              Demo Data
            </span>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Global <span className="text-gradient-primary">Leaderboard</span>
          </h1>
          <p className="text-text-secondary">
            {totalUsers.toLocaleString()} developers analyzed
          </p>
        </div>

        {/* Ranking Category Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {RANKING_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRankingCategory(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
                rankingCategory === tab.id
                  ? 'bg-primary-500/20 border border-primary-500/40 text-white'
                  : 'bg-white/[0.02] border border-white/5 text-text-muted hover:text-white hover:bg-white/5'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tier Filter */}
        <div className="flex justify-center gap-2 mb-8">
          {(['all', 'S', 'A', 'B', 'C'] as const).map((tier) => {
            const tierInfo = tier === 'all' ? null : TIERS[tier];
            return (
              <button
                key={tier}
                onClick={() => setFilter(tier)}
                className={cn(
                  'px-4 py-2 rounded-lg font-bold text-sm transition-all',
                  filter === tier
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'bg-white/[0.02] border border-white/5 text-text-muted hover:text-white hover:bg-white/5'
                )}
                style={filter === tier && tierInfo ? { borderColor: tierInfo.color } : undefined}
              >
                {tier === 'all' ? 'ALL' : tierInfo?.name}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_100px_100px_80px_80px] gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="text-xs font-bold text-text-muted">RANK</div>
            <div className="text-xs font-bold text-text-muted">DEVELOPER</div>
            <div className="text-xs font-bold text-text-muted text-center">TIER</div>
            <div className="text-xs font-bold text-text-muted text-center">LANG</div>
            <div className="text-xs font-bold text-text-muted text-right">
              {rankingCategory === 'stars' ? '⭐ STARS' : rankingCategory === 'followers' ? '👥 FOLLOW' : 'OVR'}
            </div>
            <div className="text-xs font-bold text-text-muted text-right">TYPE</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {sortedAndFilteredUsers.slice(0, 50).map((user: TopUser, index: number) => {
              const tier = TIERS[user.tier as TierLevel];
              const rank = index + 1;

              return (
                <Link
                  key={user.username}
                  href={`/analyze/${user.username}`}
                  className="grid grid-cols-[60px_1fr_100px_100px_80px_80px] gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Rank */}
                  <div className="flex items-center">
                    <span
                      className={cn(
                        'text-lg font-black',
                        rank === 1 ? 'text-yellow-400' :
                        rank === 2 ? 'text-gray-300' :
                        rank === 3 ? 'text-amber-600' :
                        'text-text-muted'
                      )}
                    >
                      #{rank}
                    </span>
                  </div>

                  {/* Developer */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/20 transition-colors">
                      <Image
                        src={user.avatarUrl}
                        alt={user.username}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="font-bold text-text-primary group-hover:text-white transition-colors">
                      @{user.username}
                    </span>
                  </div>

                  {/* Tier Badge */}
                  <div className="flex items-center justify-center">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-black"
                      style={{
                        backgroundColor: `${tier.color}20`,
                        color: tier.color,
                      }}
                    >
                      {tier.name}
                    </span>
                  </div>

                  {/* Top Language */}
                  <div className="flex items-center justify-center">
                    <span className="text-xs text-text-secondary font-medium">
                      {user.topLanguage || '-'}
                    </span>
                  </div>

                  {/* Main Value (Rating/Stars/Followers) */}
                  <div className="flex items-center justify-end">
                    <span
                      className="text-xl font-black"
                      style={{ color: tier.color }}
                    >
                      {getDisplayValue(user)}
                    </span>
                  </div>

                  {/* Archetype */}
                  <div className="flex items-center justify-end">
                    <span className="text-[10px] text-text-muted font-medium uppercase truncate">
                      {user.archetypeId.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {sortedAndFilteredUsers.length === 0 && (
            <div className="py-12 text-center text-text-muted">
              No developers found in this tier
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-text-muted">
          Rankings update in real-time • Analyze yourself to join the leaderboard
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardClient() {
  return (
    <ConvexClientProvider>
      <LeaderboardContent />
    </ConvexClientProvider>
  );
}
