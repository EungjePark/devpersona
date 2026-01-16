'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import { TIERS, type TierLevel } from '@/lib/types';

interface TierListComparisonProps {
  currentUsername: string;
  currentRating: number;
  currentTier: TierLevel;
  className?: string;
}

// Famous developer comparisons by rating range (like FIFA player comparisons)
const TIER_ICONS: Record<TierLevel, { icon: string; title: string; description: string }> = {
  S: {
    icon: '👑',
    title: 'GOAT Territory',
    description: 'You code like Messi plays football',
  },
  A: {
    icon: '⚡',
    title: 'Elite Developer',
    description: 'Top tier engineering skills',
  },
  B: {
    icon: '🔥',
    title: 'Rising Star',
    description: 'On your way to greatness',
  },
  C: {
    icon: '🌱',
    title: 'Growing Talent',
    description: 'Every legend starts somewhere',
  },
};

// Sports-style comparison badges
const COMPARISON_BADGES = [
  { min: 95, label: 'GOAT', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { min: 90, label: 'World Class', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { min: 85, label: 'Elite', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { min: 80, label: 'Top Tier', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { min: 75, label: 'Star', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { min: 70, label: 'Quality', color: 'text-green-400', bg: 'bg-green-500/20' },
  { min: 60, label: 'Solid', color: 'text-lime-400', bg: 'bg-lime-500/20' },
  { min: 50, label: 'Promising', color: 'text-yellow-500', bg: 'bg-yellow-600/20' },
  { min: 40, label: 'Developing', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { min: 0, label: 'Rookie', color: 'text-gray-400', bg: 'bg-gray-500/20' },
];

function getRatingBadge(rating: number) {
  return COMPARISON_BADGES.find(b => rating >= b.min) || COMPARISON_BADGES[COMPARISON_BADGES.length - 1];
}

export function TierListComparison({
  currentUsername,
  currentRating,
  currentTier,
  className = '',
}: TierListComparisonProps) {
  const snapshot = useQuery(api.analyses.getLeaderboardSnapshot);

  // Find nearby users in the same tier
  const nearbyUsers = useMemo(() => {
    if (!snapshot?.topUsers) return [];

    return snapshot.topUsers
      .filter(u => u.username !== currentUsername && u.tier === currentTier)
      .slice(0, 3);
  }, [snapshot, currentUsername, currentTier]);

  // Find the user just above and below
  const comparison = useMemo(() => {
    if (!snapshot?.topUsers) return { above: null, below: null };

    const sorted = [...snapshot.topUsers].sort((a, b) => b.overallRating - a.overallRating);
    const userIndex = sorted.findIndex(u => u.username === currentUsername);

    if (userIndex === -1) {
      // User not in top list, find first user with lower rating
      const below = sorted.find(u => u.overallRating < currentRating);
      const above = sorted.filter(u => u.overallRating > currentRating).pop();
      return { above: above || null, below: below || null };
    }

    return {
      above: userIndex > 0 ? sorted[userIndex - 1] : null,
      below: userIndex < sorted.length - 1 ? sorted[userIndex + 1] : null,
    };
  }, [snapshot, currentUsername, currentRating]);

  const tierInfo = TIER_ICONS[currentTier];
  const tierColor = TIERS[currentTier].color;
  const badge = getRatingBadge(currentRating);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🏆</span> Tier Status
        </h3>
        <span className={cn('text-xs px-2 py-1 rounded-full font-bold', badge.bg, badge.color)}>
          {badge.label}
        </span>
      </div>

      {/* Main tier badge (FIFA style) */}
      <div
        className="p-4 rounded-xl border text-center"
        style={{
          backgroundColor: `${tierColor}15`,
          borderColor: `${tierColor}40`,
        }}
      >
        <div className="text-4xl mb-2">{tierInfo.icon}</div>
        <div className="text-2xl font-black" style={{ color: tierColor }}>
          {tierInfo.title}
        </div>
        <p className="text-sm text-text-muted mt-1">{tierInfo.description}</p>

        {/* Rating comparison bar */}
        <div className="mt-4 relative h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${currentRating}%`,
              background: `linear-gradient(90deg, ${TIERS.C.color}, ${TIERS.B.color}, ${TIERS.A.color}, ${TIERS.S.color})`,
            }}
          />
          {/* Tier markers */}
          <div className="absolute inset-0 flex items-center">
            {[50, 75, 90].map(mark => (
              <div
                key={mark}
                className="absolute w-0.5 h-full bg-white/30"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>C</span>
          <span>B</span>
          <span>A</span>
          <span>S</span>
        </div>
      </div>

      {/* Comparison - Who's nearby */}
      {(comparison.above || comparison.below) && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Nearby Developers
          </div>

          {comparison.above && (
            <Link href={`/analyze/${comparison.above.username}`}>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-colors">
                <div className="text-green-400 text-sm">↑</div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-green-500/30">
                  <Image
                    src={comparison.above.avatarUrl}
                    alt={comparison.above.username}
                    width={32}
                    height={32}
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    @{comparison.above.username}
                  </span>
                </div>
                <div className="text-lg font-bold text-green-400">
                  {comparison.above.overallRating}
                </div>
                <div className="text-xs text-green-400/60">
                  +{comparison.above.overallRating - currentRating}
                </div>
              </div>
            </Link>
          )}

          {/* Current user marker */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary-500/20 border border-primary-500/40">
            <div className="text-primary-400 text-sm">●</div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-primary-300">You</span>
            </div>
            <div className="text-lg font-bold text-primary-400">{currentRating}</div>
          </div>

          {comparison.below && (
            <Link href={`/analyze/${comparison.below.username}`}>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors">
                <div className="text-red-400 text-sm">↓</div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-red-500/30">
                  <Image
                    src={comparison.below.avatarUrl}
                    alt={comparison.below.username}
                    width={32}
                    height={32}
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    @{comparison.below.username}
                  </span>
                </div>
                <div className="text-lg font-bold text-red-400">
                  {comparison.below.overallRating}
                </div>
                <div className="text-xs text-red-400/60">
                  -{currentRating - comparison.below.overallRating}
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Same tier peers */}
      {nearbyUsers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Same Tier Players
          </div>
          <div className="flex gap-2 flex-wrap">
            {nearbyUsers.map(user => (
              <Link
                key={user.username}
                href={`/compare/${currentUsername}/${user.username}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden">
                  <Image
                    src={user.avatarUrl}
                    alt={user.username}
                    width={20}
                    height={20}
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-xs text-text-secondary">@{user.username}</span>
                <span className="text-xs font-bold" style={{ color: TIERS[user.tier as TierLevel].color }}>
                  {user.overallRating}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
