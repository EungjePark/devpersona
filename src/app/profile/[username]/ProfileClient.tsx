'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '../../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import { BUILDER_TIERS, type BuilderTierLevel } from '@/lib/types';

// ============================================
// Types
// ============================================

type ProfileTabId = 'overview' | 'ideas' | 'launches' | 'stations' | 'karma';

interface ProfileTab {
  id: ProfileTabId;
  label: string;
  icon: string;
}

const PROFILE_TABS: ProfileTab[] = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'ideas', label: 'Ideas', icon: '💡' },
  { id: 'launches', label: 'Launches', icon: '🚀' },
  { id: 'stations', label: 'Stations', icon: '🛸' },
  { id: 'karma', label: 'Karma', icon: '✨' },
];

function isValidProfileTabId(value: string): value is ProfileTabId {
  return PROFILE_TABS.some((t) => t.id === value);
}

// ============================================
// Loading & Error States
// ============================================

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse">
          <div className="w-24 h-24 rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-40 bg-white/10 rounded" />
            <div className="h-4 w-64 bg-white/5 rounded" />
          </div>
          <div className="flex gap-6">
            <div className="w-16 h-16 bg-white/5 rounded-xl" />
            <div className="w-16 h-16 bg-white/5 rounded-xl" />
          </div>
        </div>
        {/* Tab skeleton */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-24 h-10 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          <div className="h-64 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ProfileNotFound({ username }: { username: string }) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">👤</div>
      <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
      <p className="text-zinc-500 mb-6">
        @{username} hasn&apos;t joined DevPersona yet.
      </p>
      <div className="flex gap-4">
        <Link
          href={`/analyze/${username}`}
          className="px-5 py-2.5 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors"
        >
          Analyze GitHub Profile
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Profile Header Component
// ============================================

interface ProfileHeaderProps {
  user: {
    username: string;
    avatarUrl: string;
    name?: string;
    bio?: string;
    followers: number;
    totalStars: number;
  };
  builderRank: {
    tier: number;
    tierScore: number;
    shippingPoints: number;
    communityKarma: number;
    trustScore: number;
    potenCount: number;
    weeklyWins: number;
    monthlyWins: number;
  } | null;
  isOwnProfile: boolean;
}

function ProfileHeader({ user, builderRank, isOwnProfile }: ProfileHeaderProps) {
  const rawTier = builderRank?.tier ?? 0;
  const tierLevel = (Number.isInteger(rawTier) && rawTier >= 0 && rawTier <= 7 ? rawTier : 0) as BuilderTierLevel;
  const tierInfo = BUILDER_TIERS[tierLevel];

  return (
    <div className="relative">
      {/* Background gradient based on tier */}
      <div
        className="absolute inset-0 rounded-2xl opacity-20"
        style={{
          background: tierInfo.background !== 'none'
            ? `linear-gradient(135deg, ${getTierGradient(tierLevel)}, transparent 60%)`
            : 'linear-gradient(135deg, rgba(113, 113, 122, 0.2), transparent 60%)',
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        {/* Avatar with Tier Badge */}
        <div className="relative">
          <div className="relative w-24 h-24 rounded-2xl border-2 overflow-hidden"
            style={{ borderColor: getTierColor(tierLevel) }}
          >
            <Image
              src={user.avatarUrl}
              alt={user.username}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
          {/* Tier Badge */}
          <div
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: getTierColor(tierLevel) + '20' }}
            title={tierInfo.name}
          >
            {tierInfo.icon}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">@{user.username}</h1>
            {isOwnProfile && (
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium border border-violet-500/30">
                You
              </span>
            )}
          </div>
          {user.name && (
            <p className="text-text-secondary font-medium mb-1">{user.name}</p>
          )}
          {user.bio && (
            <p className="text-text-muted text-sm max-w-md line-clamp-2">{user.bio}</p>
          )}
          {/* Builder Tier */}
          <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
            <span
              className="px-3 py-1 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: getTierColor(tierLevel) + '20',
                color: getTierColor(tierLevel),
              }}
            >
              {tierInfo.icon} {tierInfo.name}
            </span>
            {builderRank && builderRank.potenCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium">
                {builderRank.potenCount}x Poten
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(user.totalStars)}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Stars</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(user.followers)}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Followers</div>
          </div>
          {builderRank && (
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: getTierColor(tierLevel) }}
              >
                {builderRank.tierScore}
              </div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Score</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Tab Components
// ============================================

function ProfileTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
}) {
  return (
    <div className="relative mb-10">
      {/* Ambient glow behind tabs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-20 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <nav className="relative flex items-center justify-center">
        <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40">
          {PROFILE_TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-selected={isActive}
                role="tab"
                className={cn(
                  'group relative flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-out',
                  isActive
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Active background with gradient */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.06] border border-white/[0.15] shadow-lg shadow-violet-500/10" />
                )}

                {/* Hover glow */}
                <div className={cn(
                  'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300',
                  !isActive && 'group-hover:opacity-100 bg-gradient-to-b from-white/[0.04] to-transparent'
                )} />

                {/* Icon with scale animation */}
                <span className={cn(
                  'relative z-10 text-base transition-all duration-300',
                  isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'group-hover:scale-105'
                )}>
                  {tab.icon}
                </span>

                {/* Label with reveal animation on desktop */}
                <span className={cn(
                  'relative z-10 hidden sm:inline transition-all duration-300',
                  isActive ? 'text-white' : 'text-inherit'
                )}>
                  {tab.label}
                </span>

                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Subtle divider below */}
      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ============================================
// Tab Content Components
// ============================================

interface TabContentProps {
  username: string;
  builderRank: ProfileHeaderProps['builderRank'];
}

function OverviewTab({ username, builderRank }: TabContentProps) {
  const analysis = useQuery(api.analyses.getByUsername, { username });
  const launches = useQuery(api.launches.getByUsername, { username });
  const ideas = useQuery(api.ideaValidations.getByAuthor, { username });
  const karmaData = useQuery(api.crossKarma.getByUsername, { username });

  const tierLevel = (builderRank?.tier ?? 0) as BuilderTierLevel;

  return (
    <div className="space-y-6">
      {/* Builder Rank Card */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Builder Stats */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
            <span>🚀</span> Builder Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Shipping Points"
              value={builderRank?.shippingPoints ?? 0}
              color="#22c55e"
            />
            <StatCard
              label="Community Karma"
              value={builderRank?.communityKarma ?? 0}
              color="#8b5cf6"
            />
            <StatCard
              label="Trust Score"
              value={builderRank?.trustScore ?? 0}
              color="#3b82f6"
            />
            <StatCard
              label="Tier Score"
              value={builderRank?.tierScore ?? 0}
              color={getTierColor(tierLevel)}
            />
          </div>
        </div>

        {/* Activity Summary */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
            <span>📊</span> Activity Summary
          </h3>
          <div className="space-y-4">
            <ActivityItem
              icon="🚀"
              label="Launches"
              value={launches?.length ?? 0}
              href={`/profile/${username}?tab=launches`}
            />
            <ActivityItem
              icon="💡"
              label="Ideas"
              value={ideas?.length ?? 0}
              href={`/profile/${username}?tab=ideas`}
            />
            <ActivityItem
              icon="🏆"
              label="Wins"
              value={(builderRank?.weeklyWins ?? 0) + (builderRank?.monthlyWins ?? 0)}
            />
            <ActivityItem
              icon="✨"
              label="External Karma"
              value={karmaData?.externalKarma ?? 0}
              href={`/profile/${username}?tab=karma`}
            />
          </div>
        </div>
      </div>

      {/* DevPersona Analysis Link */}
      {analysis && (
        <div className="rounded-2xl bg-gradient-to-br from-violet-950/30 to-black border border-violet-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">DevPersona Analysis</h3>
              <p className="text-sm text-text-muted">
                OVR {analysis.overallRating} - {analysis.tier} Tier - {analysis.archetypeId}
              </p>
            </div>
            <Link
              href={`/analyze/${username}`}
              className="px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors"
            >
              View Analysis
            </Link>
          </div>
        </div>
      )}

      {/* Recent Launches */}
      {launches && launches.length > 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
              <span>🚀</span> Recent Launches
            </h3>
            <Link
              href={`/profile/${username}?tab=launches`}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {launches.slice(0, 3).map((launch) => (
              <LaunchCard key={launch._id} launch={launch} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IdeasTab({ username }: { username: string }) {
  const ideas = useQuery(api.ideaValidations.getByAuthor, { username });

  if (ideas === undefined) {
    return <TabLoadingSkeleton />;
  }

  if (ideas.length === 0) {
    return (
      <EmptyState
        icon="💡"
        title="No Ideas Yet"
        description="Ideas submitted to the Idea Board will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {ideas.map((idea) => (
        <IdeaCard key={idea._id} idea={idea} />
      ))}
    </div>
  );
}

function LaunchesTab({ username }: { username: string }) {
  const launches = useQuery(api.launches.getByUsername, { username });

  if (launches === undefined) {
    return <TabLoadingSkeleton />;
  }

  if (launches.length === 0) {
    return (
      <EmptyState
        icon="🚀"
        title="No Launches Yet"
        description="Launch Week submissions will appear here."
      />
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {launches.map((launch) => (
        <LaunchCard key={launch._id} launch={launch} expanded />
      ))}
    </div>
  );
}

function StationsTab({ username }: { username: string }) {
  const karmaBreakdown = useQuery(api.crossKarma.getUserKarmaBreakdown, { username });

  if (karmaBreakdown === undefined) {
    return <TabLoadingSkeleton />;
  }

  if (karmaBreakdown.breakdown.length === 0) {
    return (
      <EmptyState
        icon="🛸"
        title="No Stations Yet"
        description="Product Station memberships will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Stations" value={karmaBreakdown.totalStations} color="#8b5cf6" />
        <StatCard label="External Stations" value={karmaBreakdown.externalStations} color="#22c55e" />
        <StatCard label="External Karma" value={karmaBreakdown.totalExternalKarma} color="#f59e0b" />
      </div>
      <div className="space-y-3">
        {karmaBreakdown.breakdown.map((station) => (
          <StationCard key={station.stationId} station={station} />
        ))}
      </div>
    </div>
  );
}

function KarmaTab({ username }: { username: string }) {
  const karmaData = useQuery(api.crossKarma.getByUsername, { username });
  const karmaBreakdown = useQuery(api.crossKarma.getUserKarmaBreakdown, { username });

  if (karmaData == null || karmaBreakdown == null) {
    return <TabLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Karma Overview */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/30 to-black border border-amber-500/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Cross-Station Karma</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/[0.03]">
            <div className="text-3xl font-bold text-amber-400">{karmaData.externalKarma}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-1">External Karma</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/[0.03]">
            <div className="text-3xl font-bold text-violet-400">{karmaData.uniqueStationsHelped}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Stations Helped</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/[0.03]">
            <div className="text-3xl font-bold text-emerald-400">{karmaData.promotionBoostEarned.toFixed(2)}x</div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Promotion Boost</div>
          </div>
        </div>
      </div>

      {/* Karma Breakdown */}
      {karmaBreakdown.breakdown.length > 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
            <span>📊</span> Karma by Station
          </h3>
          <div className="space-y-3">
            {karmaBreakdown.breakdown
              .filter((s) => s.karmaEarnedHere > 0)
              .map((station) => (
                <div
                  key={station.stationId}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {station.isOwnStation ? '👑' : '🛸'}
                    </span>
                    <div>
                      <Link
                        href={`/station/${station.stationSlug}`}
                        className="font-medium text-white hover:text-violet-400 transition-colors"
                      >
                        {station.stationName}
                      </Link>
                      <div className="text-xs text-text-muted">
                        {station.role === 'captain' ? 'Captain' : station.role === 'moderator' ? 'Moderator' : 'Crew'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">+{station.karmaEarnedHere}</div>
                    <div className="text-xs text-text-muted">karma</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Shared Components
// ============================================

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
      <div className="text-2xl font-bold" style={{ color }}>{formatNumber(value)}</div>
      <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ActivityItem({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className="font-bold text-white">{value}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function LaunchCard({
  launch,
  expanded = false,
}: {
  launch: {
    _id: string;
    title: string;
    description: string;
    weekNumber: string;
    voteCount: number;
    weightedScore: number;
    isPoten: boolean;
    rank?: number;
  };
  expanded?: boolean;
}) {
  return (
    <Link
      href={`/launch/${launch._id}`}
      className={cn(
        'block p-4 rounded-xl bg-white/[0.02] border border-white/5',
        'hover:bg-white/[0.04] hover:border-white/10 transition-all'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-white line-clamp-1">{launch.title}</h4>
        <div className="flex items-center gap-2">
          {launch.isPoten && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400">
              Poten
            </span>
          )}
          {launch.rank && launch.rank <= 3 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-500/20 text-violet-400">
              #{launch.rank}
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <p className="text-sm text-text-muted line-clamp-2 mb-3">{launch.description}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>{launch.weekNumber}</span>
        <span>{launch.voteCount} votes</span>
        <span>{launch.weightedScore} points</span>
      </div>
    </Link>
  );
}

function IdeaCard({
  idea,
}: {
  idea: {
    _id: string;
    title: string;
    problem: string;
    supportVotes: number;
    opposeVotes: number;
    status: string;
    createdAt: number;
  };
}) {
  const netVotes = idea.supportVotes - idea.opposeVotes;
  const statusColors: Record<string, string> = {
    open: 'bg-emerald-500/20 text-emerald-400',
    validated: 'bg-violet-500/20 text-violet-400',
    launched: 'bg-amber-500/20 text-amber-400',
    closed: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-white">{idea.title}</h4>
        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', statusColors[idea.status])}>
          {idea.status}
        </span>
      </div>
      <p className="text-sm text-text-muted line-clamp-2 mb-3">{idea.problem}</p>
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className={netVotes >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {netVotes >= 0 ? '+' : ''}{netVotes} net votes
        </span>
        <span>{idea.supportVotes} support</span>
        <span>{idea.opposeVotes} oppose</span>
      </div>
    </div>
  );
}

function StationCard({
  station,
}: {
  station: {
    stationId: string;
    stationName: string;
    stationSlug: string;
    role: string;
    karmaEarnedHere: number;
    isOwnStation: boolean;
  };
}) {
  const roleColors: Record<string, string> = {
    captain: 'bg-amber-500/20 text-amber-400',
    moderator: 'bg-blue-500/20 text-blue-400',
    crew: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <Link
      href={`/station/${station.stationSlug}`}
      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{station.isOwnStation ? '👑' : '🛸'}</span>
        <div>
          <h4 className="font-semibold text-white">{station.stationName}</h4>
          <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', roleColors[station.role])}>
            {station.role}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-amber-400">+{station.karmaEarnedHere}</div>
        <div className="text-xs text-text-muted">karma</div>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-text-muted">{description}</p>
    </div>
  );
}

function TabLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
      ))}
    </div>
  );
}

// ============================================
// Utility Functions
// ============================================

function getTierColor(tier: BuilderTierLevel): string {
  const colors: Record<BuilderTierLevel, string> = {
    0: '#71717a', // Ground Control - zinc
    1: '#a1a1aa', // Cadet - zinc light
    2: '#60a5fa', // Pilot - blue
    3: '#34d399', // Astronaut - emerald
    4: '#f59e0b', // Commander - amber
    5: '#8b5cf6', // Captain - violet
    6: '#ec4899', // Admiral - pink
    7: '#ffd700', // Cosmos - gold
  };
  return colors[tier];
}

function getTierGradient(tier: BuilderTierLevel): string {
  const gradients: Record<BuilderTierLevel, string> = {
    0: 'rgba(113, 113, 122, 0.3)',
    1: 'rgba(161, 161, 170, 0.3)',
    2: 'rgba(96, 165, 250, 0.3)',
    3: 'rgba(52, 211, 153, 0.3)',
    4: 'rgba(245, 158, 11, 0.3)',
    5: 'rgba(139, 92, 246, 0.3)',
    6: 'rgba(236, 72, 153, 0.3)',
    7: 'rgba(255, 215, 0, 0.3)',
  };
  return gradients[tier];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ============================================
// Main Component
// ============================================

interface ProfileClientProps {
  username: string;
}

export default function ProfileClient({ username }: ProfileClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: clerkUser, isSignedIn } = useUser();

  // Tab state from URL
  const [activeTab, setActiveTab] = useState<ProfileTabId>(() => {
    const tab = searchParams.get('tab');
    return tab && isValidProfileTabId(tab) ? tab : 'overview';
  });

  const handleTabChange = useCallback((tab: ProfileTabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Query user data from Convex
  const userData = useQuery(api.users.getByUsername, { username });
  const builderRank = useQuery(api.builderRanks.getByUsername, { username });

  // Check if this is the current user's profile
  const isOwnProfile = useMemo(() => {
    if (!isSignedIn || !clerkUser) return false;
    // Check both GitHub username connection and clerk username
    const clerkUsername = clerkUser.username?.toLowerCase();
    return clerkUsername === username.toLowerCase();
  }, [isSignedIn, clerkUser, username]);

  // Loading state
  if (userData === undefined) {
    return <ProfileSkeleton />;
  }

  // User not found
  if (userData === null) {
    return <ProfileNotFound username={username} />;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none fixed" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Navigation */}
      <div className="max-w-6xl mx-auto pt-6 px-4 sm:px-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors group px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <span className="transform group-hover:-translate-x-0.5 transition-transform text-xs">&larr;</span>
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Profile Header */}
        <ProfileHeader
          user={{
            username: userData.username,
            avatarUrl: userData.avatarUrl,
            name: userData.name,
            bio: userData.bio,
            followers: userData.followers,
            totalStars: userData.totalStars,
          }}
          builderRank={builderRank ?? null}
          isOwnProfile={isOwnProfile}
        />

        {/* Tab Navigation */}
        <div className="mt-8">
          <ProfileTabNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in-up">
          {activeTab === 'overview' && (
            <OverviewTab username={username} builderRank={builderRank ?? null} />
          )}
          {activeTab === 'ideas' && <IdeasTab username={username} />}
          {activeTab === 'launches' && <LaunchesTab username={username} />}
          {activeTab === 'stations' && <StationsTab username={username} />}
          {activeTab === 'karma' && <KarmaTab username={username} />}
        </div>
      </div>
    </div>
  );
}
