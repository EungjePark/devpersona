'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CompareChart } from '@/components/cards';
import { analyzeUser } from '@/lib/analysis';
import { TIERS, SIGNAL_LABELS, type AnalysisResult, type TierLevel, type SignalScores } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ComparePageProps {
  params: Promise<{ userA: string; userB: string }>;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="h-10 w-64 bg-white/10 rounded-lg mx-auto mb-4" />
        <div className="h-6 w-96 bg-white/5 rounded-lg mx-auto" />
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-6 h-32" />
        <div className="glass-panel rounded-xl p-6 h-32" />
      </div>
      <div className="glass-panel rounded-2xl p-8 h-[500px]" />
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="text-6xl mb-6">😵</div>
      <h2 className="text-2xl font-black text-text-primary mb-4">
        Comparison <span className="text-gradient-primary">Failed</span>
      </h2>
      <p className="text-text-secondary mb-8 bg-white/5 p-4 rounded-lg font-mono text-sm">
        {error}
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-lg glass-panel hover:bg-white/10 text-white font-medium transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg text-text-secondary hover:text-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

function UserCard({ result, isWinner, side }: { result: AnalysisResult; isWinner: boolean; side: 'A' | 'B' }) {
  const tier = TIERS[result.tier.level as TierLevel];
  const borderColor = side === 'A' ? '#6366F1' : '#f97316';

  return (
    <div className={cn(
      'glass-panel rounded-xl p-5 transition-all',
      isWinner && 'ring-2 ring-green-500/50'
    )}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-full overflow-hidden border-3"
            style={{ borderColor, borderWidth: 3 }}
          >
            <Image
              src={result.avatarUrl}
              alt={result.username}
              width={64}
              height={64}
              className="object-cover"
              unoptimized
            />
          </div>
          {isWinner && (
            <div className="absolute -top-2 -right-2 text-xl">👑</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg text-white">@{result.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-black"
              style={{
                backgroundColor: `${tier.color}20`,
                color: tier.color,
              }}
            >
              {tier.name}
            </span>
            <span className="text-xs text-text-muted">{result.archetype.name}</span>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-4xl font-black"
            style={{ color: tier.color }}
          >
            {result.overallRating}
          </div>
          <div className="text-xs text-text-muted">OVR</div>
        </div>
      </div>
    </div>
  );
}

function StatCompareRow({ label, emoji, valueA, valueB }: { label: string; emoji: string; valueA: number; valueB: number }) {
  return (
    <div className="grid grid-cols-[1fr_100px_1fr] gap-4 items-center py-3 border-b border-white/5 last:border-0">
      {/* User A bar */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-sm font-bold text-indigo-400">{valueA}</span>
        <div className="w-32 h-3 bg-white/5 rounded-full overflow-hidden flex justify-end">
          <div
            className="h-full bg-gradient-to-l from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${(valueA / 100) * 100}%` }}
          />
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs text-text-muted ml-1">{label}</span>
      </div>

      {/* User B bar */}
      <div className="flex items-center gap-2">
        <div className="w-32 h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
            style={{ width: `${(valueB / 100) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-orange-400">{valueB}</span>
      </div>
    </div>
  );
}

function LanguageCompare({ langA, langB }: { langA: { name: string; percentage: number }[]; langB: { name: string; percentage: number }[] }) {
  const allLangs = new Set([...langA.map(l => l.name), ...langB.map(l => l.name)]);
  const topLangs = Array.from(allLangs).slice(0, 6);

  return (
    <div className="space-y-2">
      {topLangs.map(lang => {
        const a = langA.find(l => l.name === lang)?.percentage ?? 0;
        const b = langB.find(l => l.name === lang)?.percentage ?? 0;

        return (
          <div key={lang} className="flex items-center gap-3">
            <span className="w-20 text-xs text-text-muted truncate">{lang}</span>
            <div className="flex-1 flex gap-1">
              <div className="flex-1 flex justify-end">
                <div
                  className="h-4 bg-indigo-500/60 rounded-l"
                  style={{ width: `${a}%` }}
                />
              </div>
              <div className="flex-1">
                <div
                  className="h-4 bg-orange-500/60 rounded-r"
                  style={{ width: `${b}%` }}
                />
              </div>
            </div>
            <div className="w-20 flex justify-between text-xs">
              <span className="text-indigo-400">{a.toFixed(0)}%</span>
              <span className="text-orange-400">{b.toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerdictCard({ resultA, resultB }: { resultA: AnalysisResult; resultB: AnalysisResult }) {
  const diff = resultA.overallRating - resultB.overallRating;
  const winner = diff > 0 ? 'A' : diff < 0 ? 'B' : null;
  const winnerResult = winner === 'A' ? resultA : winner === 'B' ? resultB : null;

  // Count signal wins
  const signalKeys: (keyof SignalScores)[] = ['grit', 'focus', 'craft', 'impact', 'voice', 'reach'];
  const winsA = signalKeys.filter(k => resultA.signals[k] > resultB.signals[k]).length;
  const winsB = signalKeys.filter(k => resultB.signals[k] > resultA.signals[k]).length;

  return (
    <div className="glass-panel rounded-xl p-6 text-center">
      <h3 className="text-lg font-bold text-white mb-4">Battle Verdict</h3>
      {winner ? (
        <>
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-xl font-black text-white mb-2">
            @{winnerResult?.username} wins!
          </p>
          <p className="text-text-secondary text-sm">
            by <span className="font-bold text-white">{Math.abs(diff)}</span> points
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-center gap-6 text-sm">
            <div>
              <span className="text-indigo-400 font-bold">{winsA}</span>
              <span className="text-text-muted"> stats won</span>
            </div>
            <div>
              <span className="text-orange-400 font-bold">{winsB}</span>
              <span className="text-text-muted"> stats won</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-xl font-black text-white mb-2">It&apos;s a tie!</p>
          <p className="text-text-secondary text-sm">
            Both developers scored {resultA.overallRating}
          </p>
        </>
      )}
    </div>
  );
}

export default function ComparePage({ params }: ComparePageProps) {
  const { userA, userB } = use(params);
  const router = useRouter();
  const [resultA, setResultA] = useState<AnalysisResult | null>(null);
  const [resultB, setResultB] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const runComparison = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dataA, dataB] = await Promise.all([
        analyzeUser(userA),
        analyzeUser(userB),
      ]);
      setResultA(dataA);
      setResultB(dataB);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userA, userB]);

  useEffect(() => {
    runComparison();
  }, [runComparison]);

  const winner = resultA && resultB
    ? resultA.overallRating > resultB.overallRating
      ? 'A'
      : resultA.overallRating < resultB.overallRating
        ? 'B'
        : 'tie'
    : null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="max-w-6xl mx-auto pt-8 pb-4 px-4 relative z-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors group px-4 py-2 rounded-full hover:bg-white/5"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12 relative z-10">
        {isLoading && <LoadingSkeleton />}

        {error && <ErrorState error={error} onRetry={runComparison} />}

        {resultA && resultB && !isLoading && (
          <div className="animate-fade-in-up">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
                <span className="text-indigo-400">@{userA}</span>
                <span className="text-text-muted mx-4">⚔️</span>
                <span className="text-orange-400">@{userB}</span>
              </h1>
              <p className="text-text-secondary">
                Head-to-head developer battle
              </p>
            </div>

            {/* User Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <UserCard result={resultA} isWinner={winner === 'A'} side="A" />
              <UserCard result={resultB} isWinner={winner === 'B'} side="B" />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              {/* Left: Charts */}
              <div className="space-y-6">
                {/* Radar Compare */}
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>📊</span> Signal Comparison
                  </h3>
                  <CompareChart
                    userA={{
                      username: resultA.username,
                      signals: resultA.signals,
                      avatarUrl: resultA.avatarUrl,
                      tierColor: '#6366F1',
                    }}
                    userB={{
                      username: resultB.username,
                      signals: resultB.signals,
                      avatarUrl: resultB.avatarUrl,
                      tierColor: '#f97316',
                    }}
                    size={400}
                  />
                </div>

                {/* Stat Bars Comparison */}
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>📈</span> Detailed Stats
                  </h3>
                  <div className="mb-4 flex justify-between text-sm font-medium">
                    <span className="text-indigo-400">@{resultA.username}</span>
                    <span className="text-orange-400">@{resultB.username}</span>
                  </div>
                  {Object.entries(SIGNAL_LABELS).map(([key, info]) => (
                    <StatCompareRow
                      key={key}
                      label={info.name}
                      emoji={info.emoji}
                      valueA={resultA.signals[key as keyof SignalScores]}
                      valueB={resultB.signals[key as keyof SignalScores]}
                    />
                  ))}
                </div>

                {/* Language Comparison */}
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>💻</span> Language Stack
                  </h3>
                  <div className="mb-4 flex justify-between text-sm font-medium">
                    <span className="text-indigo-400">@{resultA.username}</span>
                    <span className="text-orange-400">@{resultB.username}</span>
                  </div>
                  <LanguageCompare langA={resultA.languages} langB={resultB.languages} />
                </div>
              </div>

              {/* Right: Sidebar */}
              <div className="space-y-6">
                {/* Verdict */}
                <VerdictCard resultA={resultA} resultB={resultB} />

                {/* Contribution Comparison */}
                {(resultA.contributions || resultB.contributions) && (
                  <div className="glass-panel rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <span>🔥</span> Streak Battle
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Current Streak</span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-indigo-400">
                            {resultA.contributions?.currentStreak ?? 0}
                          </span>
                          <span className="text-text-muted">vs</span>
                          <span className="text-lg font-bold text-orange-400">
                            {resultB.contributions?.currentStreak ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Best Streak</span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-indigo-400">
                            {resultA.contributions?.longestStreak ?? 0}
                          </span>
                          <span className="text-text-muted">vs</span>
                          <span className="text-lg font-bold text-orange-400">
                            {resultB.contributions?.longestStreak ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Total Contributions</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-indigo-400">
                            {(resultA.contributions?.totalContributions ?? 0).toLocaleString()}
                          </span>
                          <span className="text-text-muted">vs</span>
                          <span className="text-sm font-bold text-orange-400">
                            {(resultB.contributions?.totalContributions ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Archetype Comparison */}
                <div className="glass-panel rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span>🎭</span> Archetypes
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">
                        {resultA.archetype.name.split(' ')[1]?.[0] ?? resultA.archetype.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-indigo-300">{resultA.archetype.name}</p>
                        <p className="text-xs text-text-muted">{resultA.pattern.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-sm">
                        {resultB.archetype.name.split(' ')[1]?.[0] ?? resultB.archetype.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-300">{resultB.archetype.name}</p>
                        <p className="text-xs text-text-muted">{resultB.pattern.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Link
                    href={`/analyze/${userA}`}
                    className="block w-full px-4 py-3 rounded-lg glass-panel hover:bg-white/10 text-center text-sm font-medium text-white transition-colors"
                  >
                    View @{userA}&apos;s Full Profile
                  </Link>
                  <Link
                    href={`/analyze/${userB}`}
                    className="block w-full px-4 py-3 rounded-lg glass-panel hover:bg-white/10 text-center text-sm font-medium text-white transition-colors"
                  >
                    View @{userB}&apos;s Full Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
