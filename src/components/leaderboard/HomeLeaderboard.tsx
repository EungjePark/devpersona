"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { TIERS, type TierLevel } from "@/lib/types";
import type { TopUser } from "@/lib/leaderboard-types";

// Demo data for when no real users exist
const DEMO_USERS: TopUser[] = [
  {
    username: "torvalds",
    avatarUrl: "https://avatars.githubusercontent.com/u/1024025?v=4",
    overallRating: 98,
    tier: "S" as TierLevel,
    archetypeId: "maintainer",
  },
  {
    username: "shadcn",
    avatarUrl: "https://avatars.githubusercontent.com/u/124599?v=4",
    overallRating: 91,
    tier: "S" as TierLevel,
    archetypeId: "specialist",
  },
  {
    username: "tanstack",
    avatarUrl: "https://avatars.githubusercontent.com/u/72518640?v=4",
    overallRating: 89,
    tier: "A" as TierLevel,
    archetypeId: "maintainer",
  },
];

function LeaderboardSkeleton(): React.ReactNode {
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
}

export function HomeLeaderboard() {
  const snapshot = useQuery(api.analyses.getLeaderboardSnapshot);

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

  // Use demo data if no users exist
  const topUsers = snapshot?.topUsers?.length ? snapshot.topUsers : DEMO_USERS;
  const isDemo = !snapshot?.topUsers?.length;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">Top Developers</h2>
        {isDemo && (
          <span className="text-xs text-text-muted px-2 py-1 rounded-full bg-bg-elevated border border-glass-border">
            Demo
          </span>
        )}
      </div>

      <div className="space-y-2">
        {topUsers.slice(0, 8).map((user: TopUser, index: number) => {
          const tier = TIERS[user.tier as TierLevel];

          return (
            <Link
              key={user.username}
              href={`/analyze/${user.username}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                "hover:bg-bg-elevated hover:scale-[1.01] hover:border-glass-border border border-transparent",
                "group cursor-pointer"
              )}
            >
              {/* Rank */}
              <span
                className={cn(
                  "w-6 text-center font-bold text-lg",
                  index === 0
                    ? "text-tier-legendary"
                    : index === 1
                      ? "text-gray-300"
                      : index === 2
                        ? "text-tier-legendary" // Reuse goldish/bronze
                        : "text-text-muted"
                )}
              >
                {index + 1}
              </span>

              {/* Avatar */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-glass-border group-hover:border-text-secondary transition-colors">
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Username + Tier */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate group-hover:text-white transition-colors">
                  @{user.username}
                </p>
                <p
                  className="text-xs font-medium opacity-80"
                  style={{ color: tier?.color ?? "var(--text-muted)" }}
                >
                  {tier?.name ?? "COMMON"}
                </p>
              </div>

              {/* Rating */}
              <div
                className="px-2.5 py-1 rounded-md font-bold text-sm border border-transparent group-hover:border-glass-border"
                style={{
                  backgroundColor: `${tier?.color ?? "#6b7280"}15`,
                  color: tier?.color ?? "#6b7280",
                }}
              >
                {user.overallRating}
              </div>
            </Link>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-4 border-t border-glass-border">
        <Link
          href="/leaderboard"
          className="flex items-center justify-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          View Full Leaderboard
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
