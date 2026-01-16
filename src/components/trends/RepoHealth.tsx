'use client';

import { memo, useMemo } from 'react';
import type { RepoHealth as RepoHealthType } from '@/lib/trends/types';

interface RepoHealthProps {
  health: RepoHealthType;
}

export const RepoHealth = memo(function RepoHealth({ health }: RepoHealthProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const segments = useMemo(() => {
    const total = health.total;
    return [
      {
        label: 'Healthy',
        value: health.healthy,
        percentage: (health.healthy / total) * 100,
        color: '#22c55e',
        emoji: '💚',
        description: 'Active commits, issues, releases',
      },
      {
        label: 'Maintained',
        value: health.maintained,
        percentage: (health.maintained / total) * 100,
        color: '#eab308',
        emoji: '💛',
        description: 'Some activity in past 6 months',
      },
      {
        label: 'Abandoned',
        value: health.abandoned,
        percentage: (health.abandoned / total) * 100,
        color: '#ef4444',
        emoji: '💔',
        description: 'No activity for 1+ years',
      },
    ];
  }, [health]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>🏥</span> Repository Health
        </h3>
        <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded-md">
          {formatNumber(health.total)} repos analyzed
        </span>
      </div>

      {/* Visual bar */}
      <div className="h-8 rounded-full overflow-hidden flex">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="h-full transition-all duration-500 hover:opacity-80 relative group"
            style={{
              width: `${segment.percentage}%`,
              backgroundColor: segment.color,
            }}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-black/95 border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 whitespace-nowrap">
              <div className="text-sm font-bold text-white">{segment.label}</div>
              <div className="text-xs text-text-muted">{segment.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {segments.map(segment => (
          <div
            key={segment.label}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{segment.emoji}</span>
              <div>
                <div className="text-sm font-semibold text-white">{segment.label}</div>
                <div className="text-xs text-text-muted">{segment.percentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="text-2xl font-black" style={{ color: segment.color }}>
              {formatNumber(segment.value)}
            </div>
            <div className="text-xs text-text-muted mt-1">
              {segment.description}
            </div>
          </div>
        ))}
      </div>

      {/* Insight */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <div className="text-sm font-semibold text-white mb-1">Insight</div>
            <p className="text-sm text-text-muted">
              Over {((health.abandoned / health.total) * 100).toFixed(0)}% of GitHub repositories
              show no activity for over a year. Consider checking maintenance status before
              depending on a library.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
