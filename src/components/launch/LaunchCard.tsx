'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VoteButton, VoteDisplay } from './VoteButton';
import type { Id } from '../../../convex/_generated/dataModel';
import type { BuilderTierLevel } from '@/lib/types';

interface LaunchCardProps {
  launch: {
    _id: Id<"launches">;
    username: string;
    title: string;
    description: string;
    demoUrl?: string;
    githubUrl?: string;
    screenshot?: string;
    weekNumber: string;
    voteCount: number;
    weightedScore: number;
    isPoten: boolean;
    rank?: number;
    status: string;
    createdAt: number;
    painkillerVotes?: number;
    vitaminVotes?: number;
    candyVotes?: number;
    verifiedFeedbackCount?: number;
  };
  viewerUsername?: string;
  viewerTier?: BuilderTierLevel;
  showVoting?: boolean;
  compact?: boolean;
  className?: string;
}

// Rank badge configuration
const RANK_CONFIGS: Record<number, { emoji: string; bg: string; text: string; border: string }> = {
  1: { emoji: '🥇', bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/30' },
  2: { emoji: '🥈', bg: 'bg-zinc-300/10', text: 'text-zinc-300', border: 'border-zinc-300/30' },
  3: { emoji: '🥉', bg: 'bg-orange-400/10', text: 'text-orange-400', border: 'border-orange-400/30' },
};

// Rank badge component (defined outside to avoid recreation during render)
function RankBadge({ rank }: { rank?: number }) {
  if (!rank || rank > 3) return null;
  const config = RANK_CONFIGS[rank];
  if (!config) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", config.bg, config.text, config.border)}>
      {config.emoji}
    </span>
  );
}

// Helper to format time ago (pure function)
function formatTimeAgo(createdAt: number, now: number): string {
  const diff = now - createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Helper to determine product type (pure function)
function getProductType(launch: LaunchCardProps['launch']) {
  const votes = {
    painkiller: launch.painkillerVotes || 0,
    vitamin: launch.vitaminVotes || 0,
    candy: launch.candyVotes || 0,
  };
  const total = votes.painkiller + votes.vitamin + votes.candy;
  if (total === 0) return null;
  const max = Math.max(votes.painkiller, votes.vitamin, votes.candy);
  if (votes.painkiller === max) return { type: 'painkiller', emoji: '💊', color: 'text-red-400', bg: 'bg-red-500/10' };
  if (votes.vitamin === max) return { type: 'vitamin', emoji: '💚', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  return { type: 'candy', emoji: '🍬', color: 'text-pink-400', bg: 'bg-pink-500/10' };
}

export const LaunchCard = memo(function LaunchCard({
  launch,
  viewerUsername,
  viewerTier = 0,
  showVoting = true,
  compact = false,
  className,
}: LaunchCardProps) {
  const isWinner = launch.rank && launch.rank <= 3;
  const canVoteDisplay = showVoting && viewerUsername && launch.status === 'active';

  // Calculate product type and time ago once
  const productType = getProductType(launch);

  // Use useState initializer to capture time once on mount
  const [timeAgo] = useState(() => formatTimeAgo(launch.createdAt, Date.now()));

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-4 p-3 rounded-xl",
        "bg-white/[0.02] border border-white/5",
        "hover:bg-white/[0.04] hover:border-white/10 transition-all",
        isWinner && "border-amber-500/20",
        className
      )}>
        <VoteDisplay
          voteCount={launch.voteCount}
          weightedScore={launch.weightedScore}
          isPoten={launch.isPoten}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/launch/${launch._id}`} className="hover:underline">
              <h3 className="font-medium text-white truncate">{launch.title}</h3>
            </Link>
            <RankBadge rank={launch.rank} />
          </div>
          <p className="text-sm text-zinc-500 truncate">{launch.description}</p>
        </div>
        {launch.demoUrl && (
          <a
            href={launch.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0"
          >
            Demo →
          </a>
        )}
      </div>
    );
  }

  return (
    <article className={cn(
      "group relative rounded-xl overflow-hidden",
      "bg-white/[0.02] border border-white/5",
      "hover:bg-white/[0.04] hover:border-white/10",
      "transition-all duration-200",
      isWinner && "border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent",
      launch.isPoten && !isWinner && "border-violet-500/20",
      className
    )}>
      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          {/* Vote Section */}
          <div className="shrink-0">
            {canVoteDisplay ? (
              <VoteButton
                launchId={launch._id}
                launchOwnerUsername={launch.username}
                voterUsername={viewerUsername}
                voterTier={viewerTier}
                initialVoteCount={launch.voteCount}
                initialWeightedScore={launch.weightedScore}
                size="md"
              />
            ) : (
              <VoteDisplay
                voteCount={launch.voteCount}
                weightedScore={launch.weightedScore}
                isPoten={launch.isPoten}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link href={`/launch/${launch._id}`} className="hover:underline">
                    <h3 className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                      {launch.title}
                    </h3>
                  </Link>
                  <RankBadge rank={launch.rank} />
                  {launch.isPoten && !isWinner && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Poten
                    </span>
                  )}
                  {productType && (
                    <span className={cn("text-sm", productType.color)} title={productType.type}>
                      {productType.emoji}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Link
                    href={`/analyze/${launch.username}`}
                    className="hover:text-zinc-300 transition-colors"
                  >
                    @{launch.username}
                  </Link>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{timeAgo}</span>
                  {launch.verifiedFeedbackCount && launch.verifiedFeedbackCount > 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="text-emerald-500">{launch.verifiedFeedbackCount} verified</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
              {launch.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {launch.demoUrl && (
                <a
                  href={launch.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    "bg-violet-500/10 text-violet-400 border border-violet-500/20",
                    "hover:bg-violet-500/20 hover:border-violet-500/30",
                    "transition-all"
                  )}
                >
                  <span>🌐</span>
                  <span>Demo</span>
                </a>
              )}
              {launch.githubUrl && (
                <a
                  href={launch.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    "bg-white/5 text-zinc-400 border border-white/10",
                    "hover:bg-white/10 hover:text-zinc-300",
                    "transition-all"
                  )}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>Code</span>
                </a>
              )}

              {/* Product type votes summary */}
              {(launch.painkillerVotes || launch.vitaminVotes || launch.candyVotes) && (
                <div className="ml-auto flex items-center gap-2 text-xs text-zinc-600">
                  {launch.painkillerVotes && launch.painkillerVotes > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span className="opacity-70">💊</span>
                      <span>{launch.painkillerVotes}</span>
                    </span>
                  )}
                  {launch.vitaminVotes && launch.vitaminVotes > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span className="opacity-70">💚</span>
                      <span>{launch.vitaminVotes}</span>
                    </span>
                  )}
                  {launch.candyVotes && launch.candyVotes > 0 && (
                    <span className="flex items-center gap-0.5">
                      <span className="opacity-70">🍬</span>
                      <span>{launch.candyVotes}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});
