'use client';

import { memo, useMemo } from 'react';
import type { LibraryTrend } from '@/lib/trends/types';

interface LibraryPopularityProps {
  libraries: LibraryTrend[];
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  Frontend: '#61dafb',
  Framework: '#000000',
  CSS: '#38bdf8',
  Language: '#3178c6',
  'Build Tool': '#646cff',
  UI: '#8b5cf6',
  API: '#f97316',
  State: '#eab308',
};

export const LibraryPopularity = memo(function LibraryPopularity({ libraries }: LibraryPopularityProps) {
  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Sort by weekly growth
  const sortedLibraries = useMemo(
    () => [...libraries].sort((a, b) => b.weeklyGrowth - a.weeklyGrowth),
    [libraries]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>📦</span> Trending Libraries
        </h3>
        <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded-md">
          Weekly npm stats
        </span>
      </div>

      {/* Library cards */}
      <div className="grid gap-3">
        {sortedLibraries.map((lib, index) => (
          <div
            key={lib.name}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                  ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-white/5 text-text-muted'}
                `}>
                  {index + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{lib.name}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[lib.category] || '#666'}20`,
                        color: CATEGORY_COLORS[lib.category] || '#666',
                      }}
                    >
                      {lib.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <span>📥</span> {formatDownloads(lib.downloads)}/week
                    </span>
                    <span className="flex items-center gap-1">
                      <span>⭐</span> {formatDownloads(lib.stars)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Growth indicator */}
              <div className={`
                px-3 py-1.5 rounded-lg text-sm font-bold
                ${lib.weeklyGrowth >= 10 ? 'bg-green-500/20 text-green-400' :
                  lib.weeklyGrowth >= 0 ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-red-500/20 text-red-400'}
              `}>
                {lib.weeklyGrowth >= 0 ? '+' : ''}{lib.weeklyGrowth.toFixed(1)}%
                {lib.weeklyGrowth >= 20 && <span className="ml-1">🔥</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
