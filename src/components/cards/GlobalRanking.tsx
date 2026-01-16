'use client';

import { memo, useMemo } from 'react';
import {
  calculateGlobalPercentile,
  estimateGlobalRank,
  compareToTopDeveloper,
  GLOBAL_TOP_100,
} from '@/lib/external/gitstar-ranking';

interface GlobalRankingProps {
  totalStars: number;
  username: string;
}

export const GlobalRanking = memo(function GlobalRanking({
  totalStars,
  username,
}: GlobalRankingProps) {
  const percentile = useMemo(() => calculateGlobalPercentile(totalStars), [totalStars]);
  const estimatedRank = useMemo(() => estimateGlobalRank(totalStars), [totalStars]);
  const comparison = useMemo(() => compareToTopDeveloper(totalStars), [totalStars]);

  // Tier colors
  const tierColors = {
    legendary: { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
    elite: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
    top10: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
    rising: { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/40', text: 'text-green-400' },
    starter: { bg: 'from-slate-500/20 to-gray-500/20', border: 'border-slate-500/40', text: 'text-slate-400' },
  };

  const colors = tierColors[percentile.tier];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>🌍</span> Global Star Ranking
        </h3>
        <a
          href="https://gitstar-ranking.com/users"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-white transition-colors"
        >
          via gitstar-ranking.com →
        </a>
      </div>

      {/* Main ranking card */}
      <div className={`p-6 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
              Your Global Position
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${colors.text}`}>
                Top {percentile.percentile}%
              </span>
              {estimatedRank && (
                <span className="text-lg text-text-muted">
                  (~#{estimatedRank.toLocaleString()})
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
              Total Stars
            </div>
            <div className="text-2xl font-bold text-white">
              {totalStars.toLocaleString()} ⭐
            </div>
          </div>
        </div>

        <p className="text-sm text-text-muted">
          {percentile.description}
        </p>
      </div>

      {/* Comparison to top developer */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg">
              👑
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                vs @{comparison.targetUsername}
              </div>
              <div className="text-xs text-text-muted">
                #{1} on Global Leaderboard
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {comparison.percentage.toFixed(2)}%
            </div>
            <div className="text-xs text-text-muted">of their stars</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
            style={{ width: `${Math.min(100, comparison.percentage)}%` }}
          />
        </div>

        <p className="text-xs text-text-muted mt-2">
          {comparison.message}
        </p>
      </div>

      {/* Top 5 developers */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="text-xs text-text-muted uppercase tracking-wider mb-3">
          Hall of Fame
        </div>
        <div className="space-y-2">
          {GLOBAL_TOP_100.slice(0, 5).map((dev, index) => (
            <div key={dev.username} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-white/5 text-text-muted'}
                `}>
                  {index + 1}
                </span>
                <a
                  href={`https://github.com/${dev.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-purple-400 transition-colors"
                >
                  @{dev.username}
                </a>
              </div>
              <span className="text-text-muted">
                {(dev.stars / 1000).toFixed(0)}K ⭐
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
