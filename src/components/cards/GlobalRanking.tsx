'use client';

import { memo, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
  // Query Convex for dynamic data
  const globalRankings = useQuery(api.globalRankings.getTopRankings, { limit: 100 });
  const userGlobalRank = useQuery(api.globalRankings.getUserRank, { username });
  const devPersonaRank = useQuery(api.globalRankings.getDevPersonaUserRank, { username });
  const devPersonaTop = useQuery(api.globalRankings.getDevPersonaStarRanking, { limit: 5 });
  const lastUpdate = useQuery(api.globalRankings.getLastUpdate);

  // Use dynamic data if available, otherwise fallback to static
  const topDevelopers = useMemo(() => {
    if (globalRankings && globalRankings.length > 0) {
      return globalRankings.slice(0, 5);
    }
    return GLOBAL_TOP_100.slice(0, 5);
  }, [globalRankings]);

  const isLiveData = globalRankings && globalRankings.length > 0;

  // Calculate percentile and comparison
  const percentile = useMemo(() => calculateGlobalPercentile(totalStars), [totalStars]);
  const estimatedRank = useMemo(() => {
    // If we have actual rank from Convex, use it
    if (userGlobalRank) {
      return userGlobalRank.rank;
    }
    return estimateGlobalRank(totalStars);
  }, [userGlobalRank, totalStars]);

  const comparison = useMemo(() => {
    const topDev = topDevelopers[0];
    if (topDev) {
      const targetStars = topDev.stars;
      const percentage = (totalStars / targetStars) * 100;
      return {
        targetUsername: topDev.username,
        targetStars,
        percentage,
        message: percentage >= 100
          ? `You've surpassed ${topDev.username}! 🎉`
          : percentage >= 50
            ? `You're halfway to ${topDev.username}'s level!`
            : `${(targetStars - totalStars).toLocaleString()} stars to catch ${topDev.username}`,
      };
    }
    return compareToTopDeveloper(totalStars);
  }, [topDevelopers, totalStars]);

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
        <div className="flex items-center gap-2">
          {isLiveData && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
              LIVE
            </span>
          )}
          <a
            href="https://gitstar-ranking.com/users"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-white transition-colors"
          >
            gitstar-ranking.com →
          </a>
        </div>
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
                  {userGlobalRank ? '' : '~'}#{estimatedRank.toLocaleString()}
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

      {/* DevPersona Internal Ranking */}
      {devPersonaRank && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
                🏆
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  DevPersona Ranking
                </div>
                <div className="text-xs text-text-muted">
                  Among analyzed developers
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-purple-400">
                #{devPersonaRank.rank}
              </div>
              <div className="text-xs text-text-muted">
                of {devPersonaRank.totalUsers} devs • Top {100 - devPersonaRank.percentile}%
              </div>
            </div>
          </div>
        </div>
      )}

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
                #1 on Global Leaderboard
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

      {/* Global Hall of Fame */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-text-muted uppercase tracking-wider">
            🌍 Global Hall of Fame
          </div>
          {lastUpdate && (
            <div className="text-[10px] text-text-muted">
              Updated {new Date(lastUpdate).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="space-y-2">
          {topDevelopers.map((dev, index) => (
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

      {/* DevPersona Top Stars */}
      {devPersonaTop && devPersonaTop.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-3">
            ⭐ DevPersona Star Leaders
          </div>
          <div className="space-y-2">
            {devPersonaTop.map((dev, index) => (
              <div key={dev.username} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-purple-500/20 text-purple-400' :
                      index === 1 ? 'bg-pink-400/20 text-pink-300' :
                      index === 2 ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-white/5 text-text-muted'}
                  `}>
                    {dev.rank}
                  </span>
                  <a
                    href={`/analyze/${dev.username}`}
                    className="text-white hover:text-purple-400 transition-colors"
                  >
                    @{dev.username}
                  </a>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: dev.tier === 'S' ? 'rgba(252,211,77,0.2)' :
                        dev.tier === 'A' ? 'rgba(139,92,246,0.2)' :
                        dev.tier === 'B' ? 'rgba(59,130,246,0.2)' : 'rgba(107,114,128,0.2)',
                      color: dev.tier === 'S' ? '#fcd34d' :
                        dev.tier === 'A' ? '#a78bfa' :
                        dev.tier === 'B' ? '#60a5fa' : '#9ca3af',
                    }}
                  >
                    {dev.tier}
                  </span>
                </div>
                <span className="text-text-muted">
                  {(dev.stars / 1000).toFixed(1)}K ⭐
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
