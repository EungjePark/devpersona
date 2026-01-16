'use client';

import { memo, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { TIERS, type TierLevel } from '@/lib/types';
import type { TopUser } from '@/lib/leaderboard-types';
import { cn } from '@/lib/utils';

interface MiniLeaderboardProps {
  currentUsername: string;
  currentRating: number;
}

function MiniLeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] animate-pulse"
        >
          <div className="w-5 h-5 rounded bg-white/5" />
          <div className="w-6 h-6 rounded-full bg-white/5" />
          <div className="flex-1 h-4 rounded bg-white/5" />
          <div className="w-8 h-5 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export const MiniLeaderboard = memo(function MiniLeaderboard({
  currentUsername,
  currentRating,
}: MiniLeaderboardProps) {
  const snapshot = useQuery(api.analyses.getLeaderboardSnapshot);
  const userRank = useQuery(api.analyses.getUserRank, { rating: currentRating });

  const displayedUsers = useMemo(() => {
    return (snapshot?.topUsers ?? []).slice(0, 5);
  }, [snapshot?.topUsers]);

  if (snapshot === undefined) {
    return (
      <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
          <span>🏆</span> Top Developers
        </h3>
        <MiniLeaderboardSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>🏆</span> Top Developers
        </h3>
        {userRank && userRank.rank !== null && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Your Rank:</span>
            <span className="font-bold text-primary-400">#{userRank.rank}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {displayedUsers.length === 0 ? (
          <p className="text-center text-text-muted py-4 text-sm">
            Leaderboard loading...
          </p>
        ) : (
          displayedUsers.map((user: TopUser, index: number) => {
            const tier = TIERS[user.tier as TierLevel];
            const isCurrentUser = user.username === currentUsername;

            return (
              <div
                key={user.username}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg transition-all',
                  isCurrentUser
                    ? 'bg-primary-500/10 border border-primary-500/30'
                    : 'hover:bg-white/[0.03]'
                )}
              >
                {/* Rank */}
                <span
                  className={cn(
                    'w-5 text-center font-bold text-xs',
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-amber-600' :
                    'text-text-muted'
                  )}
                >
                  {index + 1}
                </span>

                {/* Avatar */}
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10">
                  <Image
                    src={user.avatarUrl}
                    alt={user.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Username */}
                <span
                  className={cn(
                    'flex-1 text-sm truncate',
                    isCurrentUser ? 'text-primary-400 font-semibold' : 'text-text-primary'
                  )}
                >
                  {user.username}
                </span>

                {/* OVR */}
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: tier?.color,
                    backgroundColor: `${tier?.color}15`,
                  }}
                >
                  {user.overallRating}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* View All Link */}
      <Link
        href="/leaderboard"
        className="block text-center mt-4 pt-3 border-t border-white/5 text-xs font-medium text-text-muted hover:text-white transition-colors"
      >
        View Full Rankings →
      </Link>
    </div>
  );
});
