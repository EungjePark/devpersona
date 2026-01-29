'use client';

import React, { use, useMemo, useState } from 'react';
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

// ============================================
// Helper Functions
// ============================================

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

// ============================================
// Types
// ============================================

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabType = 'overview' | 'discussion' | 'updates';

// ============================================
// Main Component
// ============================================

export default function LaunchDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const launchId = id as Id<"launches">;
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [imgError, setImgError] = useState(false);

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
  const userTier = (builderRank?.tier ?? 0) as BuilderTierLevel;

  // Fetch launch details
  const launch = useQuery(api.launches.getById, { launchId });

  // Fetch connected station
  const connectedStation = useQuery(
    api.productStations.getByLaunchId,
    launch ? { launchId: launch._id } : 'skip'
  );

  // Fetch this week's launches for ranking context
  const weeklyLaunches = useQuery(
    api.launches.getWeeklyLaunches,
    launch ? { weekNumber: launch.weekNumber } : 'skip'
  );

  // Fetch maker info
  const makerProfile = useQuery(
    api.builderRanks.getByUsername,
    launch ? { username: launch.username } : 'skip'
  );

  // Fetch voters with avatars for Voters Wall
  const voters = useQuery(
    api.launches.getVotersWithAvatars,
    launch ? { launchId: launch._id, limit: 12 } : 'skip'
  );

  // Calculate ranking
  const rankingInfo = useMemo(() => {
    if (!weeklyLaunches || !launch) return null;
    const sorted = weeklyLaunches.toSorted((a, b) => b.weightedScore - a.weightedScore);
    const currentRank = sorted.findIndex(l => l._id === launch._id) + 1;
    const totalLaunches = sorted.length;
    const topLaunch = sorted[0];
    const pointsToFirst = topLaunch && topLaunch._id !== launch._id
      ? topLaunch.weightedScore - launch.weightedScore
      : 0;
    return { currentRank, totalLaunches, pointsToFirst };
  }, [weeklyLaunches, launch]);

  // Product type analysis
  const productTypeData = useMemo(() => {
    if (!launch) return null;
    const votes = {
      painkiller: launch.painkillerVotes || 0,
      vitamin: launch.vitaminVotes || 0,
      candy: launch.candyVotes || 0,
    };
    const total = votes.painkiller + votes.vitamin + votes.candy;
    if (total === 0) return null;

    const types = [
      { key: 'painkiller', emoji: '💊', label: 'Painkiller', count: votes.painkiller, color: '#ef4444', desc: 'Must-have solution' },
      { key: 'vitamin', emoji: '💚', label: 'Vitamin', count: votes.vitamin, color: '#10b981', desc: 'Nice to have' },
      { key: 'candy', emoji: '🍬', label: 'Candy', count: votes.candy, color: '#ec4899', desc: 'Fun & delightful' },
    ];
    const dominant = types.reduce((a, b) => a.count >= b.count ? a : b);
    return { types, dominant, total };
  }, [launch]);

  // Gallery images (screenshot + gallery)
  const galleryImages = useMemo(() => {
    if (!launch) return [];
    const images: string[] = [];
    if (launch.screenshot) images.push(launch.screenshot);
    if (launch.ogImage && launch.ogImage !== launch.screenshot) images.push(launch.ogImage);
    if (launch.galleryImages) images.push(...launch.galleryImages);
    return images;
  }, [launch]);

  // ============================================
  // Loading State
  // ============================================

  if (launch === undefined) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <LoadingCard message="Loading launch..." />
        </div>
      </main>
    );
  }

  // ============================================
  // 404 State
  // ============================================

  if (launch === null) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-3xl font-semibold text-white mb-3">Launch Not Found</h1>
          <p className="text-zinc-500 mb-8">
            This launch may have been removed or doesn&apos;t exist.
          </p>
          <Link href="/launch">
            <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
              Back to Launch Week
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const isLive = launch.status === 'active';

  // Derived values for maker info
  const maker = makerProfile;
  const makerStats = makerProfile ? {
    totalLaunches: makerProfile.potenCount || 0,
    totalVotes: makerProfile.tierScore || 0,
  } : null;
  const totalPoints = launch.weightedScore || 0;

  // Content availability checks
  const hasProblem = !!launch.problemSolved;
  const hasFeatures = launch.keyFeatures && launch.keyFeatures.length > 0;
  const hasTechStack = !!launch.techStack;

  return (
    <main className="min-h-screen bg-[#09090b] bg-grid-structural text-zinc-100 selection:bg-indigo-500/30">
      {/* Header - Structural */}
      <header className="border-b border-border bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/launch"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors group uppercase tracking-wider"
          >
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Launch Week {launch.weekNumber.split('-W')[1]}</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-medium text-emerald-400 rounded-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                Live
              </div>
            )}

            {/* Rank badge */}
            {rankingInfo && isLive && (
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-mono font-bold border",
                rankingInfo.currentRank === 1 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  rankingInfo.currentRank === 2 ? "bg-zinc-100/10 text-zinc-300 border-zinc-100/20" :
                    rankingInfo.currentRank === 3 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
              )}>
                <span>#{rankingInfo.currentRank}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12">
          {/* Left Column: Product Info & Gallery */}
          <div className="space-y-10">
            {/* Structural Product Header */}
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                {/* Favicon - Boxy */}
                <div className="w-24 h-24 bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 rounded-sm overflow-hidden">
                  {launch.favicon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={launch.favicon} alt="" className="w-12 h-12" width={48} height={48} />
                  ) : (
                    <span className="text-4xl">🚀</span>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
                      {launch.title}
                    </h1>
                    {launch.isPoten && (
                      <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-mono uppercase tracking-wider rounded-sm font-semibold">
                        In Orbit
                      </span>
                    )}
                    {/* Pricing Badge */}
                    {launch.pricingModel && (
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border font-medium",
                        launch.pricingModel === 'free' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        launch.pricingModel === 'open_source' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                        launch.pricingModel === 'freemium' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        launch.pricingModel === 'paid' && "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {launch.pricingModel.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <p className="text-xl text-zinc-400 leading-normal font-light">
                    {launch.description}
                  </p>

                  {/* Meta Row - Grid Style */}
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 pt-1">
                    <Link
                      href={`/analyze/${launch.username}`}
                      className="flex items-center gap-2 hover:text-white transition-colors group"
                    >
                      <span className="w-5 h-5 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-sm flex items-center justify-center text-white text-[10px] font-bold">
                        {launch.username.charAt(0).toUpperCase()}
                      </span>
                      <span className="group-hover:underline decoration-zinc-700 underline-offset-4">@{launch.username}</span>
                    </Link>
                    <span className="text-zinc-700">|</span>
                    <span>{formatDate(launch.createdAt)}</span>
                    {productTypeData && (
                      <>
                        <span className="text-zinc-700">|</span>
                        <span className="flex items-center gap-1.5" style={{ color: productTypeData.dominant.color }}>
                          <span>{productTypeData.dominant.emoji}</span>
                          <span className="uppercase tracking-wider font-semibold">{productTypeData.dominant.label}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Platform Badges - Minimal */}
              {launch.platforms && launch.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {launch.platforms.map((platform: string) => (
                    <span
                      key={platform}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono rounded-sm"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTAs - Structural */}
            <div className="flex items-center gap-4 border-y border-border py-6">
              {launch.demoUrl && (
                <a
                  href={launch.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors rounded-sm"
                >
                  Visit Website
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {launch.githubUrl && (
                <a
                  href={launch.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-medium text-sm border border-zinc-800 hover:bg-zinc-800 transition-colors rounded-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View Code
                </a>
              )}
              {connectedStation && (
                <Link
                  href={`/station/${connectedStation.slug}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-500/10 text-violet-400 font-medium text-sm border border-violet-500/20 hover:bg-violet-500/20 transition-colors rounded-sm"
                >
                  Station
                </Link>
              )}
            </div>

            {/* Gallery - Full Width, ProductHunt Style */}
            {galleryImages.length > 0 && (
              <div className="space-y-3">
                {/* Main Image with Browser Chrome */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/80 border-b border-zinc-700/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="max-w-md mx-auto px-4 py-1.5 rounded-lg bg-zinc-900/80 text-xs text-zinc-400 text-center truncate font-mono">
                        {launch.demoUrl || 'preview'}
                      </div>
                    </div>
                    <div className="w-12" /> {/* Spacer for symmetry */}
                  </div>

                  {/* Image */}
                  <div className="relative aspect-video bg-zinc-900">
                    {!imgError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={galleryImages[galleryIndex]}
                        alt={launch.title}
                        className="w-full h-full object-cover"
                        width={800}
                        height={450}
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl opacity-20">🚀</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Thumbnails */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Image gallery thumbnails">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGalleryIndex(idx)}
                        aria-label={`View image ${idx + 1}`}
                        aria-pressed={galleryIndex === idx}
                        className={cn(
                          "flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                          galleryIndex === idx
                            ? "border-indigo-500 ring-2 ring-indigo-500/20"
                            : "border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="w-full h-full object-cover" width={80} height={56} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content Tabs - Technical & Minimal */}
            <div className="mt-12">
              <div className="flex items-center gap-8 border-b border-border mb-8" role="tablist" aria-label="Launch content tabs">
                {(['overview', 'discussion', 'updates'] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    id={`tab-${tab}`}
                    aria-selected={activeTab === tab}
                    aria-controls={`tabpanel-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "pb-3 text-sm font-mono uppercase tracking-wider transition-colors relative",
                      activeTab === tab ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]" id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
                {activeTab === 'overview' && (
                  <div className="prose prose-invert prose-zinc max-w-none">
                    {hasProblem ? (
                      <>
                        <h3 className="text-xl font-bold text-white mb-4">The Problem</h3>
                        <p className="text-zinc-400 leading-relaxed bg-zinc-900/30 p-6 border border-border rounded-sm mb-8">
                          {launch.problemSolved}
                        </p>
                      </>
                    ) : null}

                    <h3 className="text-xl font-bold text-white mb-4">The Solution</h3>
                    <div className="space-y-4 text-zinc-300 leading-relaxed whitespace-pre-wrap font-light">
                      {launch.detailedDescription || launch.description}
                    </div>

                    {hasFeatures && (
                      <div className="mt-12 pt-8 border-t border-border">
                        <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Key Features</h3>
                        <ul className="space-y-2">
                          {launch.keyFeatures?.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-zinc-300">
                              <span className="text-indigo-400 mt-1">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {hasTechStack && launch.techStack && (
                      <div className="mt-12 pt-8 border-t border-border">
                        <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Built With</h3>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(launch.techStack) ? launch.techStack : launch.techStack.split(',')).map((tech: string) => (
                            <span key={tech} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-sm">
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'discussion' && (
                  <div className="text-zinc-400 text-center py-12">
                    <p>Discussion coming soon...</p>
                  </div>
                )}

                {activeTab === 'updates' && (
                  <div className="text-zinc-400 text-center py-12">
                    <p>No updates yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (Voting & Maker) */}
          <aside className="space-y-8">
            {/* Voting Card - Control Panel Style */}
            <div className="sticky top-24 p-6 bg-[#09090b] border border-border rounded-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Current Status
                </div>
                {isLive ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-mono border border-emerald-500/20 rounded-sm">
                    VOTING OPEN
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[10px] font-mono border border-zinc-700 rounded-sm">
                    VOTING CLOSED
                  </div>
                )}
              </div>

              <div className="text-center py-4 border-y border-border border-dashed">
                <div className="text-5xl font-bold text-white tabular-nums tracking-tight mb-1">
                  {totalPoints}
                </div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  Total Points
                </div>
              </div>

              {/* Main Vote Button */}
              <div className="space-y-3">
                <VoteButton
                  launchId={launch._id}
                  launchOwnerUsername={launch.username}
                  voterUsername={githubUsername}
                  voterTier={userTier}
                  demoUrl={launch.demoUrl}
                  initialVoteCount={launch.voteCount}
                  initialWeightedScore={launch.weightedScore}
                  variant="prominent"
                />
                <p className="text-[10px] text-center text-zinc-600">
                  {isSignedIn ? 'You can update your vote anytime during launch week' : 'Sign in to cast your vote'}
                </p>
              </div>

              {/* Top Voters - Mini List */}
              {voters && voters.length > 0 && (
                <div className="pt-6 border-t border-border">
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
                    Recent Supporters
                  </div>
                  <div className="flex items-center -space-x-2 overflow-hidden pb-2">
                    {voters.slice(0, 5).map((voter) => (
                      <div key={voter.username} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-zinc-800" title={voter.username}>
                        {/* User Avatar */}
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full">
                          {voter.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    ))}
                    {voters.length > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-medium">
                        +{voters.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Maker Profile - Card */}
            {maker && (
              <div className="p-6 border border-border rounded-sm bg-zinc-900/20">
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
                  Maker
                </div>
                <Link href={`/analyze/${maker.username}`} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-sm flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {maker.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {maker.username}
                    </div>
                    <div className="text-sm text-zinc-500 font-mono">
                      @{maker.username}
                    </div>
                  </div>
                </Link>

                {/* Maker Stats - Simple Grid */}
                <div className="grid grid-cols-2 gap-px bg-zinc-800 mt-6 border border-zinc-800 rounded-sm overflow-hidden">
                  <div className="bg-[#09090b] p-3 text-center">
                    <div className="text-lg font-bold text-white tabular-nums">
                      {makerStats?.totalLaunches ?? 0}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase">Launches</div>
                  </div>
                  <div className="bg-[#09090b] p-3 text-center">
                    <div className="text-lg font-bold text-white tabular-nums">
                      {makerStats?.totalVotes ?? 0}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase">Votes</div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}