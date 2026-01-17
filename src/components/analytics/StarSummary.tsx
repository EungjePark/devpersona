'use client';

import { memo } from 'react';
import Link from 'next/link';
import { formatCompactNumber } from '@/lib/leaderboard-types';

interface StarSummaryProps {
  totalStars: number;
  totalForks: number;
  repoCount: number;
  starRank?: number | null;
  percentile?: number | null;
  totalRanked?: number;
  tierColor: string;
  username: string;
}

export const StarSummary = memo(function StarSummary({
  totalStars,
  totalForks,
  repoCount,
  starRank,
  percentile,
  totalRanked = 0,
  tierColor,
  username,
}: StarSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-2xl font-black" style={{ color: tierColor }}>
            {formatCompactNumber(totalStars)}
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Total Stars
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-2xl font-black text-white">
            {formatCompactNumber(totalForks)}
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Total Forks
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-2xl font-black text-white">
            {repoCount}
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
            Public Repos
          </div>
        </div>
      </div>

      {/* Star rank badge */}
      {starRank && percentile && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏅</span>
              <div>
                <div className="text-sm font-bold text-white">
                  Star Rank: #{starRank.toLocaleString()}
                </div>
                <div className="text-xs text-text-muted">
                  Top {(100 - percentile).toFixed(1)}% of {totalRanked.toLocaleString()} developers
                </div>
              </div>
            </div>
            <Link
              href="https://gitstar-ranking.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 transition-colors"
            >
              View on gitstar-ranking →
            </Link>
          </div>
        </div>
      )}

      {/* Add to README section */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs text-text-muted uppercase tracking-wider">Add to README</h4>
          <button
            onClick={() => {
              const endpointUrl = encodeURIComponent(`https://devpersona-gules.vercel.app/api/badge/${username}`);
              const badgeUrl = `https://img.shields.io/endpoint?url=${endpointUrl}`;
              const profileUrl = `https://devpersona-gules.vercel.app/analyze/${username}`;
              const markdown = `[![DevPersona](${badgeUrl})](${profileUrl})`;
              navigator.clipboard.writeText(markdown);
            }}
            className="px-2.5 py-1 rounded text-[10px] font-medium bg-white/5 text-text-secondary hover:text-white hover:bg-white/10 transition-all"
          >
            Copy Badge
          </button>
        </div>
        <div className="p-3 rounded-lg bg-black/20 font-mono text-[11px] text-text-secondary overflow-x-auto whitespace-nowrap">
          <code>
            {`[![DevPersona](https://img.shields.io/endpoint?url=https%3A%2F%2Fdevpersona-gules.vercel.app%2Fapi%2Fbadge%2F${username})](https://devpersona-gules.vercel.app/analyze/${username})`}
          </code>
        </div>
      </div>
    </div>
  );
});
