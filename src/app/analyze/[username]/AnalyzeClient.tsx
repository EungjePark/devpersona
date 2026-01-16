'use client';

import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { FIFACard, ContributionGraph, AchievementBadges, TierListComparison, HexagonRadar, SignalBars, GlobalRanking } from '@/components/cards';
import { SceneStellerGallery } from '@/components/cards/SceneStellerGallery';
import { LeaderboardPanel, DistributionChart, MiniLeaderboard } from '@/components/leaderboard';
import { LanguageEvolution, NpmPerformance, CareerPhase } from '@/components/career';
import { StreakStats, CodingPatterns, TrendAnalysis, CodeOwnership } from '@/components/analytics';
import { PoweredBySceneSteller } from '@/components/SceneStellerBranding';
import { SceneStellerMiniCTA } from '@/components/SceneStellerMiniCTA';
import { ProfileTabs, TabPanel, type TabId, isValidTabId } from '@/components/layout/ProfileTabs';
import { analyzeUser, getRandomRoast } from '@/lib/analysis';
import { buildShareUrl } from '@/lib/url-state';
import type { AnalysisResult, TierLevel } from '@/lib/types';
import { TIER_DESIGN_TOKENS, TIERS } from '@/lib/types';

interface AnalyzeClientProps {
  username: string;
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse w-full max-w-5xl mx-auto pt-8">
      <div className="flex flex-col items-center gap-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-6 w-full max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.05]" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-32 rounded bg-white/[0.05]" />
            <div className="h-4 w-48 rounded bg-white/[0.03]" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="h-12 w-96 rounded-2xl bg-white/[0.03]" />

        {/* Content skeleton */}
        <div className="grid md:grid-cols-2 gap-8 w-full">
          <div className="h-[500px] rounded-3xl bg-white/[0.02]" />
          <div className="h-[500px] rounded-3xl bg-white/[0.02]" />
        </div>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="text-6xl mb-6 animate-bounce">😵</div>
      <h2 className="text-3xl font-black text-text-primary mb-4 tracking-tight">
        Analysis <span className="text-gradient-primary">Failed</span>
      </h2>
      <p className="text-text-secondary mb-8 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/10 font-mono text-sm">
        {error}
      </p>
      <div className="flex gap-4 justify-center">
        <Button onClick={onRetry} variant="outline" className="glass-panel hover:bg-white/10 text-white border-white/20">
          Try Again
        </Button>
        <Link href="/">
          <Button variant="ghost" className="text-text-secondary hover:text-white">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}

// Profile Header Component - memoized to prevent unnecessary re-renders
interface ProfileHeaderProps {
  result: AnalysisResult;
  userRank: { rank: number | null; total: number; percentile: number | null } | null | undefined;
  tierDesign: typeof TIER_DESIGN_TOKENS[TierLevel];
}

const ProfileHeader = memo(function ProfileHeader({ result, userRank, tierDesign }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
      {/* Avatar with Tier Badge */}
      <div className="relative">
        <div className="relative w-20 h-20 rounded-2xl border-2 overflow-hidden" style={{ borderColor: result.tier.color }}>
          <Image
            src={result.avatarUrl}
            alt={result.username}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
          style={{ backgroundColor: result.tier.color }}
        >
          {result.tier.level}
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-white mb-1">@{result.username}</h1>
        <p className={`text-sm font-medium ${tierDesign.textClass}`}>
          {result.archetype.name}
        </p>
      </div>

      {/* Quick Stats + SceneSteller CTA */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-center">
          <div className="text-3xl font-black" style={{ color: result.tier.color }}>
            {result.overallRating}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider">OVR</div>
        </div>

        {userRank && userRank.rank !== null && (
          <div className="text-center">
            <div className="text-2xl font-bold text-white">#{userRank.rank}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Rank</div>
          </div>
        )}

        <div className="text-center">
          <div className={`text-lg font-bold ${tierDesign.textClass}`}>{result.tier.name}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Tier</div>
        </div>

        {/* SceneSteller CTA */}
        <div className="hidden sm:block">
          <SceneStellerMiniCTA
            username={result.username}
            tier={result.tier.level}
            archetypeId={result.archetype.id}
            archetypeName={result.archetype.name}
            signals={result.signals}
          />
        </div>
      </div>
    </div>
  );
});

export default function AnalyzeClient({ username }: AnalyzeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roast, setRoast] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCompareInput, setShowCompareInput] = useState(false);
  const [compareUsername, setCompareUsername] = useState('');
  const compareInputRef = useRef<HTMLInputElement>(null);

  // Tab state from URL
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = searchParams.get('tab');
    return tab && isValidTabId(tab) ? tab : 'overview';
  });

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Convex mutations and queries
  const saveAnalysis = useMutation(api.analyses.saveAnalysis);
  const refreshLeaderboard = useAction(api.stats.refreshLeaderboard);
  const leaderboardSnapshot = useQuery(api.analyses.getLeaderboardSnapshot);
  const userRank = useQuery(
    api.analyses.getUserRank,
    result ? { rating: result.overallRating } : 'skip'
  );

  const runAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await analyzeUser(username);
      setResult(data);
      setRoast(getRandomRoast(data.archetype));

      // Save to Convex and refresh leaderboard
      saveAnalysis({
        username: data.username,
        avatarUrl: data.avatarUrl,
        name: data.name ?? undefined,
        grit: data.signals.grit,
        focus: data.signals.focus,
        craft: data.signals.craft,
        impact: data.signals.impact,
        voice: data.signals.voice,
        reach: data.signals.reach,
        overallRating: data.overallRating,
        tier: data.tier.level,
        archetypeId: data.archetype.id,
        analyzedAt: Date.now(),
      })
        .then(() => refreshLeaderboard())
        .catch(console.error);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [username, saveAnalysis, refreshLeaderboard]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleReroll = useCallback(() => {
    if (result) {
      setRoast(getRandomRoast(result.archetype));
    }
  }, [result]);

  const handleCompareClick = useCallback(() => {
    setShowCompareInput(true);
    setTimeout(() => compareInputRef.current?.focus(), 100);
  }, []);

  const handleCompare = useCallback(() => {
    const target = compareUsername.trim().replace('@', '');
    if (target && target !== username) {
      router.push(`/compare/${username}/${target}`);
    }
  }, [compareUsername, username, router]);

  const handleShare = useCallback(async () => {
    if (!result) return;

    const baseUrl = window.location.origin;
    const shareUrl = buildShareUrl(result, baseUrl);

    const shareText = `I'm a ${result.tier.name} ${result.archetype.name}!

🎯 OVR: ${result.overallRating}
💪 GRIT: ${result.signals.grit}
🎯 FOCUS: ${result.signals.focus}
⚒️ CRAFT: ${result.signals.craft}

Discover your developer archetype 👇
${shareUrl}`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank');
  }, [result]);

  const handleCopyLink = useCallback(async () => {
    if (!result) return;

    const baseUrl = window.location.origin;
    const shareUrl = buildShareUrl(result, baseUrl);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      prompt('Copy this link:', shareUrl);
    }
  }, [result]);

  // Memoize tier design to prevent recalculation
  const tierDesign = useMemo(
    () => result ? TIER_DESIGN_TOKENS[result.tier.level] : TIER_DESIGN_TOKENS.C,
    [result]
  );

  // Memoize next tier calculation
  const nextTierInfo = useMemo(() => {
    if (!result || result.tier.level === 'S') return null;
    const nextTierKey = result.tier.level === 'C' ? 'B' : result.tier.level === 'B' ? 'A' : 'S';
    const nextTier = TIERS[nextTierKey];
    const progress = Math.min(100, (result.overallRating / nextTier.minRating) * 100);
    return { nextTier, progress, rating: result.overallRating, targetRating: nextTier.minRating };
  }, [result]);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-bg-primary selection:bg-primary-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none fixed" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 relative z-10 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors group px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <span className="transform group-hover:-translate-x-0.5 transition-transform text-xs">←</span>
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {isLoading && <LoadingSkeleton />}

        {error && <ErrorState error={error} onRetry={runAnalysis} />}

        {result && !isLoading && (
          <div className="animate-fade-in-up">
            {/* Profile Header */}
            <ProfileHeader result={result} userRank={userRank} tierDesign={tierDesign} />

            {/* Tab Navigation */}
            <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange}>

              {/* OVERVIEW Tab */}
              <TabPanel tabId="overview" activeTab={activeTab}>
                {/* Content Grid */}
                <div className="grid lg:grid-cols-12 gap-6 items-start">

                  {/* Left: FIFA Card (Fits 5 columns) */}
                  <div className="lg:col-span-5 flex justify-center lg:justify-start">
                    <div className="sticky top-8 w-full max-w-[500px] transform hover:scale-[1.01] transition-transform duration-500 ease-out perspective-1000">
                      <FIFACard
                        username={result.username}
                        avatarUrl={result.avatarUrl}
                        signals={result.signals}
                        overallRating={result.overallRating}
                        tier={result.tier}
                        archetypeId={result.archetype.id}
                        archetypeName={result.archetype.name}
                        roast={roast}
                        rank={userRank?.rank}
                        className="shadow-2xl shadow-black/50"
                      />
                    </div>
                  </div>

                  {/* Right: FM-Style Attribute Analysis Panel (Fits 7 columns) */}
                  <div className="lg:col-span-7 h-full">
                    <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
                          <span>📊</span> Attribute Analysis
                        </h3>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-text-muted">
                          FM View
                        </div>
                      </div>

                      <div className="flex-1 grid md:grid-cols-2 gap-6 items-center">
                        {/* Radar Chart (Visual) */}
                        <div className="flex items-center justify-center relative">
                          {/* Subtle background grid/glow */}
                          <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-30 blur-2xl rounded-full" />
                          <HexagonRadar
                            signals={result.signals}
                            size={320}
                            tierColor={result.tier.color}
                            className="relative z-10 drop-shadow-2xl"
                          />
                        </div>

                        {/* Detailed Attributes (Data) */}
                        <div className="bg-bg-tertiary/20 rounded-xl p-5 border border-white/5 h-full flex flex-col justify-center">
                          <div className="mb-5">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Technical Profile</h4>
                            <div className="h-0.5 w-12 bg-white/10 rounded-full" />
                          </div>
                          <SignalBars signals={result.signals} showGrade={true} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Activity & Achievements Panel */}
                {result.contributions && (
                  <div className="mt-8 bg-bg-secondary/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                    {/* Header + Contribution Graph */}
                    <div className="p-8 border-b border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
                          <span>🌱</span> Contribution Activity
                        </h3>
                      </div>
                      <div className="flex justify-center w-full overflow-hidden">
                        <ContributionGraph
                          contributions={result.contributions}
                          tierLevel={result.tier.level}
                          compact={false}
                          className="max-w-full"
                        />
                      </div>
                    </div>

                    {/* Integrated Achievements Section */}
                    <div className="p-8 bg-white/[0.02]">
                      <AchievementBadges
                        contributions={result.contributions}
                        overallRating={result.overallRating}
                        compact={false}
                        layout="dashboard"
                        className="w-full"
                        extendedStats={{
                          languages: result.languages,
                          npmPackages: result.npmPackages.length,
                          npmWeeklyDownloads: result.npmPackages.reduce(
                            (sum, pkg) => sum + (pkg.downloads || 0),
                            0
                          ),
                          hnPoints: result.hnStats.points,
                        }}
                      />
                    </div>

                    {/* SceneSteller Gallery */}
                    <div className="p-8 border-t border-white/5">
                      <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider mb-4">
                        <span>✨</span> AI Art Gallery
                      </h3>
                      <SceneStellerGallery userId={result.username} maxImages={6} />
                    </div>
                  </div>
                )}

                {/* Bottom Section: Leaderboard + Distribution */}
                <div className="grid lg:grid-cols-2 gap-6 mt-8">
                  {/* Mini Leaderboard */}
                  <MiniLeaderboard
                    currentUsername={result.username}
                    currentRating={result.overallRating}
                  />

                  {/* Global Distribution */}
                  <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                    <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <span>📊</span> Global Distribution
                    </h3>
                    {leaderboardSnapshot && (
                      <DistributionChart
                        snapshot={leaderboardSnapshot}
                        currentRating={result.overallRating}
                      />
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black hover:bg-zinc-900 text-white font-medium border border-white/10 hover:border-white/20 transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium border border-white/10 hover:border-white/20 transition-all"
                  >
                    {copySuccess ? '✓ Copied!' : '🔗 Copy Link'}
                  </button>

                  <button
                    onClick={handleReroll}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium border border-white/10 hover:border-white/20 transition-all"
                  >
                    🎲 Reroll Roast
                  </button>
                </div>
              </TabPanel>

              {/* CAREER Tab */}
              <TabPanel tabId="career" activeTab={activeTab}>
                <div className="space-y-8">
                  {/* Career Phase Indicator */}
                  <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                    <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <span>🎯</span> Career Phase
                    </h3>
                    <CareerPhase
                      overallRating={result.overallRating}
                      tier={result.tier.level}
                      tierColor={result.tier.color}
                      accountAge={Math.floor((Date.now() - new Date(result.analyzedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) || 1}
                      totalRepos={100}
                      totalContributions={result.contributions?.totalContributions || 0}
                    />
                  </div>

                  {/* Language Evolution + npm Performance */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Language Evolution */}
                    <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                      <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <span>💻</span> Language Evolution
                      </h3>
                      <LanguageEvolution
                        languages={result.languages}
                        tierColor={result.tier.color}
                      />
                    </div>

                    {/* npm Performance */}
                    <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                      <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <span>📦</span> npm Performance
                      </h3>
                      <NpmPerformance
                        packages={result.npmPackages}
                        tierColor={result.tier.color}
                      />
                    </div>
                  </div>

                  {/* Activity Summary */}
                  {result.contributions && (
                    <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
                      <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <span>📈</span> Activity Summary
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.03] text-center">
                          <div className="text-3xl font-bold" style={{ color: result.tier.color }}>
                            {result.contributions.totalContributions.toLocaleString()}
                          </div>
                          <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Total Contributions</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.03] text-center">
                          <div className="text-3xl font-bold text-white">
                            {result.contributions.currentStreak}
                          </div>
                          <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Current Streak</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.03] text-center">
                          <div className="text-3xl font-bold text-white">
                            {result.contributions.longestStreak}
                          </div>
                          <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Best Streak</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.03] text-center">
                          <div className="text-3xl font-bold text-white">
                            {result.contributions.averagePerDay.toFixed(1)}
                          </div>
                          <div className="text-xs text-text-muted mt-1 uppercase tracking-wider">Daily Average</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabPanel>

              {/* ANALYTICS Tab - Mission Control Design */}
              <TabPanel tabId="analytics" activeTab={activeTab}>
                <div className="space-y-6">

                  {/* === HERO COMMAND CENTER === */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-zinc-950 to-black border border-white/[0.08]">
                    {/* Animated Grid Background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `
                          linear-gradient(to right, ${result.tier.color}08 1px, transparent 1px),
                          linear-gradient(to bottom, ${result.tier.color}08 1px, transparent 1px)
                        `,
                        backgroundSize: '24px 24px'
                      }} />
                    </div>

                    {/* Radial Glow */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px] opacity-20"
                      style={{ backgroundColor: result.tier.color }}
                    />

                    <div className="relative z-10 p-8 lg:p-10">
                      {/* Header Strip */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-green-500">LIVE</span>
                          </div>
                          <span className="text-[10px] font-mono text-text-muted">ANALYTICS.DASHBOARD</span>
                        </div>
                        <div className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.02]">
                          <span className="text-[10px] font-mono text-text-muted">v2.0</span>
                        </div>
                      </div>

                      {/* Central Metrics Ring */}
                      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

                        {/* Left: Primary Metric */}
                        <div className="flex-shrink-0 text-center lg:text-left">
                          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted mb-2">
                            OVERALL.RATING
                          </div>
                          <div
                            className="text-6xl lg:text-[5rem] font-black tracking-tighter leading-none"
                            style={{
                              color: result.tier.color,
                              textShadow: `0 0 60px ${result.tier.color}40`
                            }}
                          >
                            {result.overallRating}
                          </div>
                          <div className="mt-3 flex items-center justify-center lg:justify-start gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                backgroundColor: `${result.tier.color}20`,
                                color: result.tier.color
                              }}
                            >
                              {result.tier.level}
                            </span>
                            <span className="text-sm text-text-secondary font-medium">
                              {result.tier.name}
                            </span>
                            {userRank?.percentile && (
                              <span className="text-xs text-text-muted font-mono">
                                Top {Math.round(100 - userRank.percentile)}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Center: Signal Radar Mini */}
                        <div className="flex-shrink-0 relative">
                          <HexagonRadar
                            signals={result.signals}
                            size={200}
                            tierColor={result.tier.color}
                            className="drop-shadow-2xl"
                          />
                          {/* Decorative Ring */}
                          <div
                            className="absolute inset-0 rounded-full border-2 border-dashed opacity-20 animate-spin"
                            style={{
                              borderColor: result.tier.color,
                              animationDuration: '30s'
                            }}
                          />
                        </div>

                        {/* Right: Quick Stats Grid */}
                        <div className="flex-1 w-full lg:w-auto">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {result.contributions && (
                              <>
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                                  <div className="text-2xl lg:text-3xl font-black text-white">
                                    {result.contributions.totalContributions.toLocaleString()}
                                  </div>
                                  <div className="text-[9px] font-mono uppercase text-text-muted mt-1">COMMITS</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                                  <div className="text-2xl lg:text-3xl font-black text-orange-400">
                                    {result.contributions.currentStreak}
                                  </div>
                                  <div className="text-[9px] font-mono uppercase text-text-muted mt-1">STREAK</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                                  <div className="text-2xl lg:text-3xl font-black text-emerald-400">
                                    {result.contributions.averagePerDay.toFixed(1)}
                                  </div>
                                  <div className="text-[9px] font-mono uppercase text-text-muted mt-1">DAILY.AVG</div>
                                </div>
                              </>
                            )}
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                              <div className="text-2xl lg:text-3xl font-black text-purple-400">
                                {result.languages.length}
                              </div>
                              <div className="text-[9px] font-mono uppercase text-text-muted mt-1">LANGUAGES</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                              <div className="text-2xl lg:text-3xl font-black text-cyan-400">
                                {result.npmPackages.length}
                              </div>
                              <div className="text-[9px] font-mono uppercase text-text-muted mt-1">NPM.PKGS</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                              <div className="text-2xl lg:text-3xl font-black text-pink-400">
                                {result.hnStats.points}
                              </div>
                              <div className="text-[9px] font-mono uppercase text-text-muted mt-1">HN.KARMA</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* === SIGNAL ANALYSIS PANEL === */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 border border-white/[0.06]">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="p-6 lg:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: result.tier.color }} />
                        <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                          SIGNAL_BREAKDOWN
                        </h3>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Left: Signal Bars */}
                        <div className="space-y-1">
                          <SignalBars signals={result.signals} showGrade />
                        </div>

                        {/* Right: Archetype + Progression */}
                        <div className="space-y-6">
                          {/* Archetype Card */}
                          <div
                            className="relative p-5 rounded-xl border overflow-hidden"
                            style={{
                              borderColor: `${result.tier.color}30`,
                              background: `linear-gradient(135deg, ${result.tier.color}08, transparent)`
                            }}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ backgroundColor: `${result.tier.color}15` }}
                              >
                                🎭
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-mono uppercase text-text-muted mb-1">ARCHETYPE</div>
                                <div
                                  className="text-lg font-bold truncate"
                                  style={{ color: result.tier.color }}
                                >
                                  {result.archetype.name}
                                </div>
                                <p className="text-xs text-text-muted mt-1 line-clamp-2">
                                  {result.archetype.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Tier Progress */}
                          {nextTierInfo && (
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-mono uppercase text-text-muted">
                                  PROGRESS → {nextTierInfo.nextTier.name.toUpperCase()}
                                </span>
                                <span className="text-sm font-mono font-bold text-white">
                                  {nextTierInfo.rating}/{nextTierInfo.targetRating}
                                </span>
                              </div>
                              <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${nextTierInfo.progress}%`,
                                    background: `linear-gradient(90deg, ${result.tier.color}, ${nextTierInfo.nextTier.color})`
                                  }}
                                />
                              </div>
                              <div className="mt-2 text-[10px] text-text-muted font-mono">
                                {nextTierInfo.targetRating - nextTierInfo.rating} pts remaining
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* === CONTRIBUTION MATRIX === */}
                  {result.contributions && (
                    <div className="grid lg:grid-cols-3 gap-6">

                      {/* Contribution Graph - Spans 2 columns */}
                      <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/60 to-black/60 border border-white/[0.05]">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-6 rounded-full bg-emerald-500" />
                            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                              CONTRIBUTION_MATRIX
                            </h3>
                          </div>
                          <ContributionGraph
                            contributions={result.contributions}
                            tierLevel={result.tier.level}
                          />
                        </div>
                      </div>

                      {/* Streak Stats - Single column */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950/20 to-black/60 border border-orange-500/10">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-6 rounded-full bg-orange-500" />
                            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                              STREAK.DATA
                            </h3>
                          </div>
                          <StreakStats
                            contributions={result.contributions}
                            tierColor={result.tier.color}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === BEHAVIOR PATTERNS === */}
                  {result.contributions && (
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Coding Patterns */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/20 to-black/60 border border-indigo-500/10">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-6 rounded-full bg-indigo-500" />
                            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                              CODING_PATTERNS
                            </h3>
                          </div>
                          <CodingPatterns
                            contributions={result.contributions}
                            pattern={result.pattern.type}
                            tierColor={result.tier.color}
                          />
                        </div>
                      </div>

                      {/* Trend Analysis */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-950/20 to-black/60 border border-cyan-500/10">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-6 rounded-full bg-cyan-500" />
                            <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                              TREND_ANALYSIS
                            </h3>
                          </div>
                          <TrendAnalysis
                            contributions={result.contributions}
                            tierColor={result.tier.color}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === CODE OWNERSHIP === */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950/20 to-black/60 border border-violet-500/10">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                    <div className="p-6 lg:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 rounded-full bg-violet-500" />
                        <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                          CODE_OWNERSHIP
                        </h3>
                      </div>
                      <CodeOwnership
                        languages={result.languages}
                        signals={result.signals}
                        totalContributions={result.contributions?.totalContributions ?? 0}
                        tierColor={result.tier.color}
                      />
                    </div>
                  </div>

                  {/* === ROAST TERMINAL === */}
                  <div className="relative overflow-hidden rounded-2xl bg-black border border-white/[0.08]">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/[0.05]">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <span className="w-3 h-3 rounded-full bg-green-500/80" />
                      <span className="ml-2 text-[10px] font-mono text-text-muted">roast.terminal</span>
                    </div>
                    <div className="p-6 font-mono">
                      <div className="text-[10px] text-text-muted mb-2">$ analyze --roast @{result.username}</div>
                      <div className="flex gap-2">
                        <span className="text-emerald-400">→</span>
                        <p className="text-text-secondary italic leading-relaxed">&quot;{roast}&quot;</p>
                      </div>
                      <button
                        onClick={handleReroll}
                        className="mt-4 px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-text-muted hover:text-white transition-all flex items-center gap-2"
                      >
                        <span className="text-emerald-400">$</span> reroll --random
                      </button>
                    </div>
                  </div>

                </div>
              </TabPanel>

              {/* COMPETE Tab - Arena Battle Design */}
              <TabPanel tabId="compete" activeTab={activeTab}>
                <div className="space-y-6">

                  {/* === ARENA BANNER === */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950/40 via-black to-orange-950/40 border border-orange-500/20">
                    {/* Animated fire particles effect */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-0 left-1/4 w-1 h-8 bg-gradient-to-b from-orange-500 to-transparent animate-pulse" style={{ animationDelay: '0s' }} />
                      <div className="absolute top-0 left-1/3 w-1 h-12 bg-gradient-to-b from-red-500 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }} />
                      <div className="absolute top-0 left-1/2 w-1 h-6 bg-gradient-to-b from-yellow-500 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <div className="absolute top-0 left-2/3 w-1 h-10 bg-gradient-to-b from-orange-500 to-transparent animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="absolute top-0 left-3/4 w-1 h-8 bg-gradient-to-b from-red-500 to-transparent animate-pulse" style={{ animationDelay: '0.7s' }} />
                    </div>

                    {/* VS Background Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[200px] font-black text-white/[0.02] select-none">VS</span>
                    </div>

                    <div className="relative z-10 p-8 lg:p-10">
                      {/* Header */}
                      <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-400">CHALLENGE ARENA</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                      </div>

                      {/* Challenge Input Section */}
                      {!showCompareInput ? (
                        <button
                          onClick={handleCompareClick}
                          className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 p-[2px] transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <div className="relative rounded-[14px] bg-black/80 px-8 py-6 overflow-hidden">
                            {/* Inner glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-red-600/20 group-hover:opacity-100 opacity-50 transition-opacity" />

                            <div className="relative flex items-center justify-center gap-4">
                              <span className="text-4xl">⚔️</span>
                              <div className="text-left">
                                <div className="text-xl font-black text-white tracking-tight">INITIATE DUEL</div>
                                <div className="text-xs text-orange-300/70 font-mono">Enter rival username to compare stats</div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="bg-black/40 rounded-2xl border border-orange-500/30 p-6">
                          <div className="text-center mb-4">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400">TARGET ACQUISITION</span>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1 relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-mono font-bold">@</span>
                              <input
                                ref={compareInputRef}
                                type="text"
                                placeholder="Enter rival username..."
                                value={compareUsername}
                                onChange={(e) => setCompareUsername(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                                className="w-full h-14 pl-10 pr-4 bg-black/60 border-2 border-orange-500/40 rounded-xl text-white text-lg placeholder:text-white/20 focus:outline-none focus:border-orange-500 font-medium transition-colors"
                              />
                            </div>
                            <button
                              onClick={handleCompare}
                              disabled={!compareUsername.trim()}
                              className="h-14 px-8 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-lg transition-all"
                            >
                              ENGAGE
                            </button>
                            <button
                              onClick={() => setShowCompareInput(false)}
                              className="h-14 w-14 flex items-center justify-center rounded-xl border border-white/10 text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Your Fighter Card */}
                      <div className="mt-8 flex items-center justify-center gap-8">
                        <div className="text-center">
                          <div
                            className="w-20 h-20 rounded-2xl border-2 overflow-hidden mx-auto mb-3"
                            style={{ borderColor: result.tier.color }}
                          >
                            <Image
                              src={result.avatarUrl}
                              alt={result.username}
                              width={80}
                              height={80}
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="text-sm font-bold text-white">@{result.username}</div>
                          <div
                            className="text-3xl font-black mt-1"
                            style={{ color: result.tier.color }}
                          >
                            {result.overallRating}
                          </div>
                          <div
                            className="text-[10px] font-bold uppercase tracking-wider mt-1"
                            style={{ color: result.tier.color }}
                          >
                            {result.tier.name}
                          </div>
                        </div>

                        {/* VS Divider */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-px h-8 bg-gradient-to-b from-transparent via-orange-500 to-transparent" />
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
                            <span className="text-white font-black text-sm">VS</span>
                          </div>
                          <div className="w-px h-8 bg-gradient-to-b from-transparent via-orange-500 to-transparent" />
                        </div>

                        {/* Opponent Placeholder */}
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 mx-auto mb-3 flex items-center justify-center bg-white/[0.02]">
                            <span className="text-2xl text-white/20">?</span>
                          </div>
                          <div className="text-sm font-medium text-text-muted">Awaiting</div>
                          <div className="text-2xl font-black text-white/20 mt-1">---</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-white/20 mt-1">
                            CHALLENGER
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* === RANKINGS & STATUS === */}
                  <div className="grid lg:grid-cols-5 gap-6">

                    {/* Leaderboard - 3 columns */}
                    <div className="lg:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/80 to-black border border-white/[0.06]">
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1 h-6 rounded-full bg-yellow-500" />
                          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                            GLOBAL_RANKINGS
                          </h3>
                        </div>
                        <LeaderboardPanel
                          currentUsername={result.username}
                          currentRating={result.overallRating}
                        />
                      </div>
                    </div>

                    {/* Tier Status - 2 columns */}
                    <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/80 to-black border border-white/[0.06]">
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1 h-6 rounded-full bg-purple-500" />
                          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                            TIER_STATUS
                          </h3>
                        </div>
                        <TierListComparison
                          currentUsername={result.username}
                          currentRating={result.overallRating}
                          currentTier={result.tier.level}
                        />
                      </div>
                    </div>
                  </div>

                  {/* === QUICK STATS === */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-950/30 to-black border border-yellow-500/10 text-center">
                      <div className="text-3xl font-black text-yellow-400">{userRank?.rank || '—'}</div>
                      <div className="text-[10px] font-mono uppercase text-text-muted mt-1">GLOBAL RANK</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gradient-to-br from-green-950/30 to-black border border-green-500/10 text-center">
                      <div className="text-3xl font-black text-green-400">
                        {userRank?.percentile ? `${Math.round(100 - userRank.percentile)}%` : '—'}
                      </div>
                      <div className="text-[10px] font-mono uppercase text-text-muted mt-1">TOP PERCENTILE</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950/30 to-black border border-blue-500/10 text-center">
                      <div className="text-3xl font-black text-blue-400">{result.overallRating}</div>
                      <div className="text-[10px] font-mono uppercase text-text-muted mt-1">POWER LEVEL</div>
                    </div>
                    <div className="p-5 rounded-xl bg-gradient-to-br from-purple-950/30 to-black border border-purple-500/10 text-center">
                      <div className="text-3xl font-black" style={{ color: result.tier.color }}>{result.tier.level}</div>
                      <div className="text-[10px] font-mono uppercase text-text-muted mt-1">TIER CLASS</div>
                    </div>
                  </div>

                  {/* === GITHUB STAR RANKING === */}
                  {result.totalStars !== undefined && result.totalStars > 0 && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/80 to-black border border-white/[0.06]">
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1 h-6 rounded-full bg-cyan-500" />
                          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-text-secondary">
                            GITHUB_STAR_RANKING
                          </h3>
                        </div>
                        <GlobalRanking totalStars={result.totalStars} username={result.username} />
                      </div>
                    </div>
                  )}

                </div>
              </TabPanel>

            </ProfileTabs>

            {/* Footer with SceneSteller Branding */}
            <div className="mt-8 pb-8 pt-4">
              <PoweredBySceneSteller />
              <p className="text-center text-xs text-text-muted/40 font-mono uppercase tracking-widest mt-2">
                Analysis via GitHub • npm • Hacker News
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
