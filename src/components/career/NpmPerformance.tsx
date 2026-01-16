'use client';

import { memo, useMemo } from 'react';
import type { NpmPackage } from '@/lib/types';

interface NpmPerformanceProps {
  packages: NpmPackage[];
  tierColor: string;
}

// Format download count
function formatDownloads(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export const NpmPerformance = memo(function NpmPerformance({
  packages,
  tierColor,
}: NpmPerformanceProps) {
  // Sort by downloads
  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
  }, [packages]);

  // Calculate total downloads
  const totalDownloads = useMemo(() => {
    return packages.reduce((sum, pkg) => sum + pkg.downloads, 0);
  }, [packages]);

  // Max downloads for scaling bars
  const maxDownloads = useMemo(() => {
    return Math.max(...packages.map(p => p.downloads), 1);
  }, [packages]);

  if (packages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-text-muted text-sm">No npm packages found</p>
        <p className="text-text-muted/60 text-xs mt-1">
          Publish a package to see your stats here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <div className="text-2xl font-bold text-white">{packages.length}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Packages</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <div className="text-2xl font-bold" style={{ color: tierColor }}>
            {formatDownloads(totalDownloads)}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Total Downloads</div>
        </div>
      </div>

      {/* Package list */}
      <div className="space-y-3">
        <h4 className="text-xs text-text-muted uppercase tracking-wider">Top Packages</h4>
        {sortedPackages.map((pkg, index) => {
          const percentage = (pkg.downloads / maxDownloads) * 100;
          const rankEmoji = ['🥇', '🥈', '🥉'][index];

          return (
            <div key={pkg.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {rankEmoji && <span>{rankEmoji}</span>}
                  <a
                    href={`https://www.npmjs.com/package/${pkg.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:text-primary-400 truncate transition-colors"
                  >
                    {pkg.name}
                  </a>
                </div>
                <span
                  className="text-sm font-bold flex-shrink-0 ml-2"
                  style={{ color: tierColor }}
                >
                  {formatDownloads(pkg.downloads)}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${tierColor}50, ${tierColor})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* npm profile link */}
      <a
        href="https://www.npmjs.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs text-text-muted hover:text-white transition-colors"
      >
        View on npm →
      </a>
    </div>
  );
});
