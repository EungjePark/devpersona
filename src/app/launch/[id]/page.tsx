'use client';

import React, { use } from 'react';
import { useQuery } from 'convex/react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { LoadingCard } from '@/components/ui/loading-card';
import { VoteButton } from '@/components/launch/VoteButton';
import { cn } from '@/lib/utils';
import type { BuilderTierLevel } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LaunchDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const launchId = id as Id<"launches">;

  // Auth
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const githubUsername = user?.externalAccounts?.find(
    (acc) => acc.provider === 'github'
  )?.username || user?.username || '';

  // Get user's builder rank for tier
  const builderRank = useQuery(
    api.builderRanks.getByUsername,
    githubUsername ? { username: githubUsername } : 'skip'
  );
  const userTier = (builderRank?.tier ?? 1) as BuilderTierLevel;

  // Fetch launch details
  const launch = useQuery(api.launches.getById, { launchId });

  // Fetch linked idea if exists
  const linkedIdea = useQuery(
    api.ideaValidations.getById,
    launch?.linkedIdeaId ? { ideaId: launch.linkedIdeaId } : 'skip'
  );

  // Check if user voted
  const hasVoted = useQuery(
    api.launches.hasVoted,
    githubUsername ? { launchId, voterUsername: githubUsername } : 'skip'
  );

  if (launch === undefined) {
    return (
      <main className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <LoadingCard message="Loading launch details..." />
        </div>
      </main>
    );
  }

  if (launch === null) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-2">Launch not found</h1>
          <p className="text-zinc-400 mb-6">This launch may have been removed or does not exist.</p>
          <Link href="/launch">
            <Button>Back to Launch Week</Button>
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = launch.username === githubUsername;
  const canVote = isSignedIn && !isOwner && launch.status === 'active' && userTier >= 1;

  // Determine dominant product type
  const productTypeData = (() => {
    const v = {
      painkiller: launch.painkillerVotes || 0,
      vitamin: launch.vitaminVotes || 0,
      candy: launch.candyVotes || 0,
    };
    const total = v.painkiller + v.vitamin + v.candy;
    if (total === 0) return null;

    const maxVal = Math.max(v.painkiller, v.vitamin, v.candy);
    const types = [];
    if (v.painkiller === maxVal) types.push({ key: 'painkiller', emoji: '💊', label: 'Painkiller', color: 'text-red-400', bg: 'bg-red-500/20', count: v.painkiller });
    if (v.vitamin === maxVal) types.push({ key: 'vitamin', emoji: '💚', label: 'Vitamin', color: 'text-emerald-400', bg: 'bg-emerald-500/20', count: v.vitamin });
    if (v.candy === maxVal) types.push({ key: 'candy', emoji: '🍬', label: 'Candy', color: 'text-pink-400', bg: 'bg-pink-500/20', count: v.candy });

    return { dominant: types[0], all: v, total };
  })();

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Back navigation */}
        <Link
          href="/launch"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Launch Week
        </Link>

        {/* Main content */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Left column - Launch details */}
          <div className="space-y-6">
            {/* Header card */}
            <div className={cn(
              "rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent",
              "border border-white/10",
              launch.isPoten && "border-violet-500/30"
            )}>
              {/* Screenshot/OG Image */}
              {(launch.ogImage || launch.screenshot) && (
                <div className="relative aspect-video bg-black/50 border-b border-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={launch.ogImage || launch.screenshot}
                    alt={launch.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {launch.isPoten && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-orange-500/90 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                      Poten
                    </div>
                  )}
                  {launch.rank && launch.rank <= 3 && (
                    <div className={cn(
                      "absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg",
                      launch.rank === 1 && "bg-amber-500/90",
                      launch.rank === 2 && "bg-zinc-400/90",
                      launch.rank === 3 && "bg-orange-600/90"
                    )}>
                      {launch.rank === 1 ? '🥇' : launch.rank === 2 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Title and meta */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{launch.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      <Link
                        href={`/analyze/${launch.username}`}
                        className="hover:text-violet-400 transition-colors"
                      >
                        @{launch.username}
                      </Link>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span>{formatDate(launch.createdAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="text-zinc-600">{launch.weekNumber}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    launch.status === 'active' && "bg-emerald-500/20 text-emerald-400",
                    launch.status === 'closed' && "bg-zinc-500/20 text-zinc-400",
                    launch.status === 'pending' && "bg-amber-500/20 text-amber-400"
                  )}>
                    {launch.status === 'active' ? 'Live' : launch.status}
                  </div>
                </div>

                {/* Description */}
                <p className="text-zinc-300 leading-relaxed mb-6">{launch.description}</p>

                {/* Additional info */}
                {(launch.targetAudience || launch.problemSolved) && (
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {launch.targetAudience && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-zinc-500 mb-1">Target Audience</div>
                        <div className="text-sm text-zinc-300">{launch.targetAudience}</div>
                      </div>
                    )}
                    {launch.problemSolved && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-xs text-zinc-500 mb-1">Problem Solved</div>
                        <div className="text-sm text-zinc-300">{launch.problemSolved}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  {launch.demoUrl && (
                    <a
                      href={launch.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium",
                        "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
                        "hover:from-violet-500 hover:to-fuchsia-500",
                        "transition-all shadow-lg shadow-violet-500/25"
                      )}
                    >
                      <span>🌐</span>
                      <span>Visit Demo</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  {launch.githubUrl && (
                    <a
                      href={launch.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium",
                        "bg-white/5 border border-white/10 text-zinc-300",
                        "hover:bg-white/10 hover:text-white",
                        "transition-all"
                      )}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <span>View Code</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Idea Section */}
            {linkedIdea && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Validated Idea</h3>
                    <p className="text-xs text-emerald-400">Community-validated before launch</p>
                  </div>
                </div>

                <Link
                  href={`/board/idea/${linkedIdea._id}`}
                  className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group"
                >
                  <h4 className="font-medium text-white group-hover:text-emerald-300 transition-colors mb-2">
                    {linkedIdea.title}
                  </h4>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                    {linkedIdea.problem}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="text-emerald-400">+{linkedIdea.supportVotes}</span> support
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-red-400">-{linkedIdea.opposeVotes}</span> oppose
                    </span>
                    <span>{linkedIdea.commentCount} comments</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Feedback Section Placeholder */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>💬</span> Feedback
                {launch.verifiedFeedbackCount && launch.verifiedFeedbackCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {launch.verifiedFeedbackCount} verified
                  </span>
                )}
              </h2>

              <div className="text-center py-8">
                <div className="text-4xl mb-3">🚧</div>
                <p className="text-zinc-400 text-sm">
                  Feedback section coming soon.
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  Vote to leave feedback and earn promotion points.
                </p>
              </div>
            </div>
          </div>

          {/* Right column - Voting & Stats */}
          <div className="space-y-4">
            {/* Voting Card */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent border border-violet-500/20 p-5">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {launch.weightedScore}
                </div>
                <div className="text-sm text-zinc-400">
                  weighted score
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mb-4 text-center">
                <div>
                  <div className="text-xl font-semibold text-white">{launch.voteCount}</div>
                  <div className="text-xs text-zinc-500">votes</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-xl font-semibold text-white">
                    {launch.verifiedFeedbackCount || 0}
                  </div>
                  <div className="text-xs text-zinc-500">verified</div>
                </div>
              </div>

              {canVote && githubUsername ? (
                <VoteButton
                  launchId={launch._id}
                  launchOwnerUsername={launch.username}
                  voterUsername={githubUsername}
                  voterTier={userTier}
                  initialVoteCount={launch.voteCount}
                  initialWeightedScore={launch.weightedScore}
                  size="lg"
                  className="w-full"
                />
              ) : (
                <VoteStatusMessage
                  isOwner={isOwner}
                  hasVoted={hasVoted}
                  isActive={launch.status === 'active'}
                />
              )}
            </div>

            {/* Product Type Votes */}
            {productTypeData && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <span>🎯</span> Product Classification
                </h3>

                <div className="space-y-3">
                  {/* Painkiller */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">💊</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">Painkiller</span>
                        <span className="text-red-400">{productTypeData.all.painkiller}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${(productTypeData.all.painkiller / productTypeData.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vitamin */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">💚</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">Vitamin</span>
                        <span className="text-emerald-400">{productTypeData.all.vitamin}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(productTypeData.all.vitamin / productTypeData.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Candy */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">🍬</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">Candy</span>
                        <span className="text-pink-400">{productTypeData.all.candy}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all"
                          style={{ width: `${(productTypeData.all.candy / productTypeData.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {productTypeData.dominant && (
                  <div className={cn(
                    "mt-4 p-3 rounded-xl flex items-center gap-3",
                    productTypeData.dominant.bg
                  )}>
                    <span className="text-2xl">{productTypeData.dominant.emoji}</span>
                    <div>
                      <div className={cn("font-medium", productTypeData.dominant.color)}>
                        {productTypeData.dominant.label}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Community consensus
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
              <h3 className="text-sm font-medium text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href={`/analyze/${launch.username}`}
                  className="flex items-center gap-3 p-3 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span>👤</span>
                  <span>View @{launch.username}&apos;s profile</span>
                </Link>
                <Link
                  href="/launch"
                  className="flex items-center gap-3 p-3 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span>🚀</span>
                  <span>More launches this week</span>
                </Link>
                <Link
                  href="/hall-of-fame"
                  className="flex items-center gap-3 p-3 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span>🏆</span>
                  <span>Hall of Fame</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Extracted component to avoid nested ternaries
function VoteStatusMessage({
  isOwner,
  hasVoted,
  isActive,
}: {
  isOwner: boolean;
  hasVoted: boolean | undefined;
  isActive: boolean;
}): React.ReactElement {
  let message: string;
  let colorClass: string;

  if (isOwner) {
    message = "You can't vote on your own launch";
    colorClass = "bg-amber-500/10 text-amber-400";
  } else if (hasVoted === undefined) {
    message = "Loading...";
    colorClass = "bg-zinc-500/10 text-zinc-500";
  } else if (hasVoted) {
    message = "You've already voted";
    colorClass = "bg-emerald-500/10 text-emerald-400";
  } else if (!isActive) {
    message = "Voting is closed";
    colorClass = "bg-zinc-500/10 text-zinc-400";
  } else {
    message = "You need T1+ to vote";
    colorClass = "bg-zinc-500/10 text-zinc-400";
  }

  return (
    <div className={cn("p-4 rounded-xl text-center text-sm", colorClass)}>
      {message}
    </div>
  );
}
