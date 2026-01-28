"use client";

import { useState, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TIERS, type TierLevel } from "@/lib/types";
import type { TopUser } from "@/lib/leaderboard-types";

interface LeaderboardPanelProps {
  currentUsername: string;
  currentRating: number;
}

// Skeleton loader for leaderboard
function LeaderboardSkeleton(): React.ReactNode {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary/50 animate-pulse"
        >
          <div className="w-6 h-6 rounded bg-bg-elevated" />
          <div className="w-8 h-8 rounded-full bg-bg-elevated" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-24 rounded bg-bg-elevated" />
            <div className="h-3 w-16 rounded bg-bg-elevated" />
          </div>
          <div className="w-8 h-6 rounded bg-bg-elevated" />
        </div>
      ))}
    </div>
  );
}

// Memoized leaderboard user item to prevent unnecessary re-renders
interface LeaderboardUserItemProps {
  user: TopUser;
  index: number;
  isCurrentUser: boolean;
  isSelected: boolean;
  onCompare: (username: string) => void;
}

const LeaderboardUserItem = memo(function LeaderboardUserItem({
  user,
  index,
  isCurrentUser,
  isSelected,
  onCompare,
}: LeaderboardUserItemProps) {
  const tier = TIERS[user.tier as TierLevel];

  return (
    <button
      onClick={() => !isCurrentUser && onCompare(user.username)}
      disabled={isCurrentUser}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left group relative overflow-hidden",
        isCurrentUser
          ? "bg-primary-500/10 border border-primary-500/30 cursor-default"
          : isSelected
            ? "bg-orange-500/20 border border-orange-500/50"
            : "hover:bg-white/[0.03] border border-transparent hover:border-white/5 cursor-pointer"
      )}
    >
      {/* Rank */}
      <span
        className={cn(
          "w-6 text-center font-bold text-sm tabular-nums",
          index === 0 ? "text-yellow-400" :
            index === 1 ? "text-gray-300" :
              index === 2 ? "text-amber-600" :
                "text-text-muted font-medium"
        )}
      >
        {index + 1}
      </span>

      {/* Avatar */}
      <div className={cn(
        "relative w-8 h-8 rounded-lg overflow-hidden border transition-all",
        isSelected ? "border-orange-500" : "border-white/10 group-hover:border-white/30"
      )}>
        <Image
          src={user.avatarUrl}
          alt={user.username}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-semibold truncate transition-colors",
          isCurrentUser ? "text-primary-400" : "text-text-primary group-hover:text-white"
        )}>
          {user.username}
        </p>
        <p className="text-[10px] font-medium" style={{ color: tier?.color ?? "#6b7280" }}>
          {tier?.name ?? "DEV"}
        </p>
      </div>

      {/* OVR Rating with Tier Glow */}
      <div className="pr-1 flex items-center gap-2">
        <span
          className="font-black text-base px-2 py-0.5 rounded tabular-nums"
          style={{
            color: tier?.color,
            backgroundColor: `${tier?.color}15`,
            textShadow: `0 0 10px ${tier?.color}50`,
          }}
        >
          {user.overallRating}
        </span>
      </div>
    </button>
  );
});

export function LeaderboardPanel({
  currentUsername,
  currentRating,
}: LeaderboardPanelProps) {
  const router = useRouter();
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(null);
  const snapshot = useQuery(api.analyses.getLeaderboardSnapshot);
  const userRank = useQuery(api.analyses.getUserRank, { rating: currentRating });

  const handleCompare = useCallback((targetUsername: string) => {
    if (selectedForCompare === targetUsername) {
      setSelectedForCompare(null);
    } else if (selectedForCompare) {
      router.push(`/compare/${currentUsername}/${selectedForCompare}`);
    } else {
      setSelectedForCompare(targetUsername);
    }
  }, [selectedForCompare, currentUsername, router]);

  const goToCompare = useCallback(() => {
    if (selectedForCompare) {
      router.push(`/compare/${currentUsername}/${selectedForCompare}`);
    }
  }, [selectedForCompare, currentUsername, router]);

  // Memoize top 10 users to prevent array recreation
  const displayedUsers = useMemo(() => {
    return (snapshot?.topUsers ?? []).slice(0, 10);
  }, [snapshot?.topUsers]);

  // Loading state
  if (snapshot === undefined) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Global Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardSkeleton />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] bg-bg-tertiary/50 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Rank Badge - Refined */}
      {userRank && userRank.rank !== null && (
        <div className="flex items-center justify-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary-500/10 to-transparent border border-primary-500/20 backdrop-blur-md">
          <div className="text-center">
            <span className="text-4xl font-black text-primary-400 tracking-tighter">
              #{userRank.rank}
            </span>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted mt-1">Global Rank</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-center">
            <span className="text-3xl font-bold text-white tracking-tight">
              Top {userRank.percentile}%
            </span>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted mt-1">Percentile</p>
          </div>
        </div>
      )}

      {/* Leaderboard Panel - Glass */}
      <div className="glass-panel rounded-2xl overflow-hidden p-1 border border-white/5">
        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 uppercase tracking-wider">
            <span>🏆</span> Top Developers
          </h3>
          <div className="flex items-center gap-2">
            {selectedForCompare && (
              <button
                onClick={goToCompare}
                className="text-[10px] px-2.5 py-1 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors uppercase tracking-wide"
              >
                ⚔️ VS @{selectedForCompare}
              </button>
            )}
          </div>
        </div>

        <div className="p-2 space-y-1">
          {displayedUsers.length === 0 ? (
            <p className="text-center text-text-muted py-8 text-sm">
              Leaderboard is refreshing...
            </p>
          ) : (
            displayedUsers.map((user: TopUser, index: number) => (
              <LeaderboardUserItem
                key={user.username}
                user={user}
                index={index}
                isCurrentUser={user.username === currentUsername}
                isSelected={selectedForCompare === user.username}
                onCompare={handleCompare}
              />
            ))
          )}
        </div>

        {/* View All Link */}
        <Link
          href="/leaderboard"
          className="block text-center py-3 text-xs font-semibold text-text-muted hover:text-white uppercase tracking-wider transition-colors bg-white/[0.01] hover:bg-white/[0.03]"
        >
          View Full Rankings →
        </Link>
      </div>

    </div>
  );
}
