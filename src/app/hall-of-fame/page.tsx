'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { LoadingCard, EmptyStateCard } from '@/components/ui/loading-card';
import { potenCardStyles } from '@/components/ui/poten-badge';
import { RankBadge, TierIcon } from '@/components/rank/RankBadge';
import { cn } from '@/lib/utils';

type ViewMode = 'podiums' | 'poten' | 'builders';

// Weekly result winner type
interface Winner {
  launchId: string;
  title: string;
  username: string;
  rank: number;
  weightedScore: number;
  ogImage?: string;
  screenshot?: string;
}

interface WeeklyResult {
  weekNumber: string;
  winners: Winner[];
  totalLaunches: number;
  totalVotes: number;
}

export default function HallOfFamePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('podiums');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch data
  const availableYears = useQuery(api.launches.getAvailableYears);
  const weeklyResults = useQuery(api.launches.getWeeklyResults, { year: selectedYear });
  const potenLaunches = useQuery(api.launches.getPotenLaunches, { limit: 20 });
  const potenPosts = useQuery(api.posts.getPotenPosts, { limit: 20 });
  const topBuilders = useQuery(api.builderRanks.getTopBuilders, { limit: 20 });

  const currentYear = new Date().getFullYear();
  // Only show 2026+ years (project started in 2026)
  const years = availableYears && availableYears.length > 0
    ? availableYears.filter((y: number) => y >= 2026)
    : [currentYear];

  // Get latest week with winners for hero display
  const latestWinners = useMemo(() => {
    if (!weeklyResults || weeklyResults.length === 0) return null;
    const withWinners = weeklyResults.find(r => r.winners.length >= 3);
    return withWinners || null;
  }, [weeklyResults]);

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative">
        {/* Hero Section with Latest Podium */}
        <section className="relative py-16 px-4 border-b border-white/5 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group mb-6"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
              <span className="text-sm">Home</span>
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Fame</span>
            </h1>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Celebrating builders who shipped, competed, and rose to the top.
            </p>
          </div>

          {/* Featured Podium */}
          {latestWinners && latestWinners.winners.length >= 3 && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Latest Champions</span>
                <h2 className="text-lg font-semibold text-white">
                  Week {latestWinners.weekNumber.split('-W')[1]}, {latestWinners.weekNumber.split('-W')[0]}
                </h2>
              </div>

              {/* 3D Podium */}
              <div className="relative flex items-end justify-center gap-3 h-72 px-8">
                {/* Spotlight effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/10 rounded-full blur-[80px]" />

                {/* 2nd Place */}
                <PodiumPlace
                  winner={latestWinners.winners.find(w => w.rank === 2)}
                  position={2}
                  height={160}
                />

                {/* 1st Place */}
                <PodiumPlace
                  winner={latestWinners.winners.find(w => w.rank === 1)}
                  position={1}
                  height={200}
                />

                {/* 3rd Place */}
                <PodiumPlace
                  winner={latestWinners.winners.find(w => w.rank === 3)}
                  position={3}
                  height={120}
                />
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-8 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{latestWinners.totalLaunches}</div>
                  <div className="text-xs text-zinc-500">Launches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{latestWinners.totalVotes}</div>
                  <div className="text-xs text-zinc-500">Votes</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* View Toggle */}
          <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="Hall of Fame views">
            {[
              { id: 'podiums', label: 'Weekly Podiums', icon: '🏆' },
              { id: 'poten', label: 'Poten Archive', icon: '🔥' },
              { id: 'builders', label: 'Top Builders', icon: '👑' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={viewMode === tab.id}
                aria-controls={`${tab.id}-panel`}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  viewMode === tab.id
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-white/[0.02] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Podiums View */}
          {viewMode === 'podiums' && (
            <div id="podiums-panel" role="tabpanel" aria-labelledby="podiums" className="space-y-8">
              {/* Year selector */}
              <div className="flex justify-center gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      selectedYear === year
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-white/5 text-zinc-500 hover:text-white"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>

              {weeklyResults === undefined ? (
                <LoadingCard message="Loading weekly results..." />
              ) : weeklyResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🏆</div>
                  <p className="text-zinc-400 mb-4">
                    No weekly podiums for {selectedYear} yet.
                  </p>
                  <Link href="/launch">
                    <Button variant="outline">Go to Launch Week</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weeklyResults.map((result: WeeklyResult) => {
                    const [yearPart, weekPart] = result.weekNumber.split('-W');
                    const weekNum = parseInt(weekPart);

                    // Calculate approximate date range
                    const jan1 = new Date(parseInt(yearPart), 0, 1);
                    const weekStart = new Date(jan1.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
                    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

                    const formatDate = (d: Date) =>
                      `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;

                    const hasWinners = result.winners.length > 0;

                    return (
                      <div
                        key={result.weekNumber}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          hasWinners
                            ? "bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40"
                            : "bg-white/[0.02] border-white/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">Week {weekNum}</span>
                              {hasWinners && <span>🏆</span>}
                            </div>
                            <p className="text-xs text-zinc-500">
                              {formatDate(weekStart)} - {formatDate(weekEnd)}
                            </p>
                          </div>
                          <div className="text-right text-xs text-zinc-500">
                            <div>{result.totalLaunches} launches</div>
                            <div>{result.totalVotes} votes</div>
                          </div>
                        </div>

                        {hasWinners ? (
                          <div className="space-y-2">
                            {result.winners.slice(0, 3).map((winner: Winner) => (
                              <Link
                                key={winner.launchId}
                                href={`/launch/${winner.launchId}`}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg transition-all group",
                                  winner.rank === 1 && "bg-amber-500/10 hover:bg-amber-500/20",
                                  winner.rank === 2 && "bg-zinc-400/10 hover:bg-zinc-400/20",
                                  winner.rank === 3 && "bg-amber-700/10 hover:bg-amber-700/20"
                                )}
                              >
                                <span className="text-lg">
                                  {winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : '🥉'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white text-sm truncate group-hover:text-amber-200 transition-colors">
                                    {winner.title}
                                  </p>
                                  <p className="text-xs text-zinc-500">@{winner.username}</p>
                                </div>
                                <span className="text-sm font-bold text-amber-400">{winner.weightedScore}</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-zinc-500 text-sm py-4">
                            No winners yet
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Poten Archive View */}
          {viewMode === 'poten' && (
            <div id="poten-panel" role="tabpanel" aria-labelledby="poten" className="grid md:grid-cols-2 gap-8">
              {/* Poten Launches */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>🚀</span> Poten Launches
                  <span className="text-xs font-normal text-zinc-500">(10+ points)</span>
                </h2>
                {potenLaunches === undefined ? (
                  <LoadingCard />
                ) : potenLaunches.length === 0 ? (
                  <EmptyStateCard
                    message="No poten launches yet."
                    subMessage="Launch something amazing to be featured!"
                  />
                ) : (
                  <div className="space-y-3">
                    {potenLaunches.map((launch) => (
                      <Link
                        key={launch._id}
                        href={`/launch/${launch._id}`}
                        className={cn(
                          "block p-4 rounded-xl border transition-all group",
                          potenCardStyles
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {launch.rank === 1 ? '🥇' : launch.rank === 2 ? '🥈' : launch.rank === 3 ? '🥉' : '🔥'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-amber-200 transition-colors">
                              {launch.title}
                            </h3>
                            <p className="text-sm text-zinc-500">
                              by @{launch.username} • {launch.weekNumber}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-orange-400 font-medium">
                                {launch.weightedScore} pts
                              </span>
                              {launch.verifiedFeedbackCount && launch.verifiedFeedbackCount > 0 && (
                                <span className="text-xs text-emerald-400">
                                  ✓ {launch.verifiedFeedbackCount} verified
                                </span>
                              )}
                            </div>
                            {/* Product type breakdown */}
                            {(launch.painkillerVotes || launch.vitaminVotes || launch.candyVotes) && (
                              <div className="flex gap-3 mt-1.5 text-xs text-zinc-500">
                                {launch.painkillerVotes && launch.painkillerVotes > 0 && (
                                  <span>💊 {launch.painkillerVotes}</span>
                                )}
                                {launch.vitaminVotes && launch.vitaminVotes > 0 && (
                                  <span>💚 {launch.vitaminVotes}</span>
                                )}
                                {launch.candyVotes && launch.candyVotes > 0 && (
                                  <span>🍬 {launch.candyVotes}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Poten Posts */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📝</span> Poten Posts
                </h2>
                {potenPosts === undefined ? (
                  <LoadingCard />
                ) : potenPosts.length === 0 ? (
                  <EmptyStateCard
                    message="No poten posts yet."
                    subMessage="Write something the community loves!"
                  />
                ) : (
                  <div className="space-y-3">
                    {potenPosts.map((post) => (
                      <Link
                        key={post._id}
                        href={`/board/post/${post._id}`}
                        className={cn(
                          "block p-4 rounded-xl border transition-all group",
                          potenCardStyles
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🔥</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-amber-200 transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-sm text-zinc-500">
                              by @{post.authorUsername} • {post.boardType}
                            </p>
                            <p className="text-sm text-orange-400 mt-2">
                              {(post.upvotes ?? 0) - (post.downvotes ?? 0)} net upvotes
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Builders View */}
          {viewMode === 'builders' && (
            <div id="builders-panel" role="tabpanel" aria-labelledby="builders" className="space-y-6">
              <h2 className="text-lg font-semibold text-white text-center">
                Top Builders by Tier Score
              </h2>

              {topBuilders === undefined ? (
                <LoadingCard />
              ) : topBuilders.length === 0 ? (
                <EmptyStateCard
                  message="No builders ranked yet."
                  subMessage="Be the first to climb the ranks!"
                />
              ) : (
                <>
                  {/* Top 3 Podium */}
                  {topBuilders.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 h-48 mb-8">
                      {/* 2nd */}
                      <BuilderPodiumPlace builder={topBuilders[1]} position={2} />
                      {/* 1st */}
                      <BuilderPodiumPlace builder={topBuilders[0]} position={1} />
                      {/* 3rd */}
                      <BuilderPodiumPlace builder={topBuilders[2]} position={3} />
                    </div>
                  )}

                  {/* Rest of the list */}
                  <div className="space-y-2">
                    {topBuilders.slice(3).map((builder, index) => (
                      <Link
                        key={builder._id}
                        href={`/analyze/${builder.username}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                      >
                        <span className="text-sm text-zinc-500 w-8 text-center font-mono">
                          #{index + 4}
                        </span>
                        <TierIcon tier={builder.tier as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7} size="md" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-white group-hover:text-violet-300 transition-colors">
                            @{builder.username}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <RankBadge tier={builder.tier as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7} size="sm" showBackground />
                            {builder.promotionPoints && builder.promotionPoints > 0 && (
                              <span className="text-xs text-emerald-400">
                                +{builder.promotionPoints} promo
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white tabular-nums">{builder.tierScore}</span>
                          <p className="text-xs text-zinc-500">tier score</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Podium place component for launches
function PodiumPlace({ winner, position, height }: { winner?: Winner; position: 1 | 2 | 3; height: number }) {
  if (!winner) return null;

  const colors = {
    1: { bg: 'from-amber-400/30 to-amber-400/5', border: 'border-amber-400/40', text: 'text-amber-200' },
    2: { bg: 'from-zinc-400/30 to-zinc-400/5', border: 'border-zinc-400/40', text: 'text-zinc-200' },
    3: { bg: 'from-amber-700/30 to-amber-700/5', border: 'border-amber-700/40', text: 'text-amber-600' },
  };

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const color = colors[position];

  return (
    <Link
      href={`/launch/${winner.launchId}`}
      className={cn("relative flex-1 max-w-[180px] group", position === 1 && "order-2", position === 2 && "order-1", position === 3 && "order-3")}
    >
      {/* Winner info */}
      <div className="text-center mb-2 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${position * 100}ms` }}>
        {position === 1 && (
          <div className="text-2xl animate-bounce mb-1">👑</div>
        )}
        <div className={cn(
          "relative w-12 h-12 mx-auto rounded-full flex items-center justify-center border-2 mb-2 group-hover:scale-110 transition-transform overflow-hidden",
          color.border, position === 1 ? "bg-amber-500/20" : position === 2 ? "bg-zinc-500/20" : "bg-amber-700/20"
        )}>
          {winner.ogImage || winner.screenshot ? (
            <Image
              src={winner.ogImage ?? winner.screenshot ?? ''}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="text-xl">{medals[position]}</span>
          )}
        </div>
        <p className={cn("text-sm font-semibold truncate max-w-full group-hover:text-amber-200 transition-colors", color.text)}>
          {winner.title}
        </p>
        <p className="text-xs text-zinc-500">@{winner.username}</p>
        <p className={cn("text-sm font-bold mt-1", position === 1 ? "text-amber-400" : "text-zinc-400")}>
          {winner.weightedScore} pts
        </p>
      </div>

      {/* Podium block */}
      <div
        className={cn(
          "rounded-t-xl border-t border-x bg-gradient-to-t transition-all group-hover:scale-[1.02]",
          color.bg, color.border
        )}
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center justify-center pt-3">
          <span className={cn("text-3xl font-black", color.text)}>{position}</span>
        </div>
      </div>
    </Link>
  );
}

// Podium place component for builders
function BuilderPodiumPlace({ builder, position }: { builder: { _id: string; username: string; tierScore: number; tier: number }; position: 1 | 2 | 3 }) {
  const heights = { 1: 160, 2: 120, 3: 80 };
  const colors = {
    1: { bg: 'from-amber-400/30 to-amber-400/5', border: 'border-amber-400/40', text: 'text-amber-200' },
    2: { bg: 'from-zinc-400/30 to-zinc-400/5', border: 'border-zinc-400/40', text: 'text-zinc-200' },
    3: { bg: 'from-amber-700/30 to-amber-700/5', border: 'border-amber-700/40', text: 'text-amber-600' },
  };

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const color = colors[position];

  return (
    <Link
      href={`/analyze/${builder.username}`}
      className={cn("relative flex-1 max-w-[140px] group", position === 1 && "order-2", position === 2 && "order-1", position === 3 && "order-3")}
    >
      {/* Builder info */}
      <div className="text-center mb-2">
        {position === 1 && (
          <div className="text-xl animate-bounce mb-1">👑</div>
        )}
        <span className="text-2xl">{medals[position]}</span>
        <p className={cn("text-sm font-semibold truncate group-hover:text-violet-300 transition-colors", color.text)}>
          @{builder.username}
        </p>
        <div className="flex justify-center mt-1">
          <TierIcon tier={builder.tier as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7} size="sm" />
        </div>
        <p className="text-sm font-bold text-white mt-1">{builder.tierScore}</p>
      </div>

      {/* Podium block */}
      <div
        className={cn(
          "rounded-t-xl border-t border-x bg-gradient-to-t transition-all group-hover:scale-[1.02]",
          color.bg, color.border
        )}
        style={{ height: `${heights[position]}px` }}
      >
        <div className="flex items-center justify-center pt-2">
          <span className={cn("text-2xl font-black", color.text)}>{position}</span>
        </div>
      </div>
    </Link>
  );
}
