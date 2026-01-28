"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { TIERS, type TierLevel } from "@/lib/types";
import type { TopUser } from "@/lib/leaderboard-types";
import { GlowBorder } from "@/components/ui/shine-border";

// Memoized skeleton for loading state
const LeaderboardSkeleton = memo(function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary/50 animate-pulse border border-white/5"
        >
          <div className="w-6 h-6 rounded bg-bg-elevated" />
          <div className="w-10 h-10 rounded-full bg-bg-elevated" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 rounded bg-bg-elevated" />
            <div className="h-3 w-16 rounded bg-bg-elevated" />
          </div>
          <div className="w-10 h-7 rounded bg-bg-elevated" />
        </div>
      ))}
    </div>
  );
});

// Pre-computed rank styles
const RANK_STYLES = {
  0: "text-tier-legendary",
  1: "text-gray-300",
  2: "text-tier-legendary",
  default: "text-text-muted",
} as const;

// Memoized user item component
interface UserItemProps {
  user: TopUser;
  index: number;
}

const UserItem = memo(function UserItem({ user, index }: UserItemProps) {
  const tier = TIERS[user.tier as TierLevel];
  const rankStyle = RANK_STYLES[index as keyof typeof RANK_STYLES] ?? RANK_STYLES.default;

  // Memoize style objects
  const tierTextStyle = useMemo(() => ({
    color: tier?.color ?? "var(--text-muted)",
  }), [tier?.color]);

  const ratingStyle = useMemo(() => ({
    backgroundColor: `${tier?.color ?? "#6b7280"}15`,
    color: tier?.color ?? "#6b7280",
  }), [tier?.color]);

  return (
    <Link
      href={`/analyze/${user.username}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        "hover:bg-bg-elevated hover:scale-[1.01] hover:border-glass-border border border-transparent",
        "group cursor-pointer"
      )}
    >
      {/* Rank */}
      <span className={cn("w-6 text-center font-bold text-lg", rankStyle)}>
        {index + 1}
      </span>

      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-glass-border group-hover:border-text-secondary transition-colors">
        <Image
          src={user.avatarUrl}
          alt={user.username}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>

      {/* Username + Tier */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate group-hover:text-white transition-colors">
          @{user.username}
        </p>
        <p className="text-xs font-medium opacity-80" style={tierTextStyle}>
          {tier?.name ?? "COMMON"}
        </p>
      </div>

      {/* Rating */}
      <div
        className="px-2.5 py-1 rounded-md font-bold text-sm border border-transparent group-hover:border-glass-border"
        style={ratingStyle}
      >
        {user.overallRating}
      </div>
    </Link>
  );
});

export function HomeLeaderboard() {
  const snapshot = useQuery(api.analyses.getLeaderboardSnapshot);

  // Memoize top 8 users
  const topUsers = useMemo(() => {
    return (snapshot?.topUsers ?? []).slice(0, 8);
  }, [snapshot?.topUsers]);

  const isEmpty = topUsers.length === 0;

  // Loading state
  if (snapshot === undefined) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Top Developers</h2>
          <span className="text-xs text-text-muted px-2 py-1 rounded-full bg-bg-elevated border border-glass-border">
            Live
          </span>
        </div>
        <LeaderboardSkeleton />
      </div>
    );
  }

  return (
    <GlowBorder
      color="#8b5cf6"
      intensity={0.4}
      className="w-full"
    >
      <div className="glass-panel rounded-2xl p-6 bg-bg-secondary/80">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Top Developers</h2>
          {!isEmpty && (
            <span className="text-xs text-text-muted px-2 py-1 rounded-full bg-bg-elevated border border-glass-border animate-pulse">
              Live
            </span>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl">🚀</div>
            <p className="text-sm text-text-muted">No developers analyzed yet.</p>
            <p className="text-xs text-text-muted/60">Be the first to join the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topUsers.map((user, index) => (
              <UserItem key={user.username} user={user} index={index} />
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="mt-6 pt-4 border-t border-glass-border">
          <Link
            href="/leaderboard"
            className="flex items-center justify-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium group"
          >
            View Full Leaderboard
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </GlowBorder>
  );
}
