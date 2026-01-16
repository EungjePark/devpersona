'use client';

import { useMemo } from 'react';
import type { ContributionStats } from '@/lib/types';
import {
  calculateAchievements,
  calculatePotential,
  getTopAchievements,
  getNextAchievement,
  TIER_COLORS,
  type Achievement,
  type PotentialRating,
  type ExtendedStats,
} from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface AchievementBadgesProps {
  contributions: ContributionStats;
  overallRating: number;
  compact?: boolean;
  /** Layout style: 'default' or 'dashboard' for wider display */
  layout?: 'default' | 'dashboard';
  className?: string;
  extendedStats?: Omit<ExtendedStats, 'contributions'>;
}

// Single achievement badge
function AchievementBadge({ achievement, size = 'md' }: { achievement: Achievement; size?: 'sm' | 'md' | 'lg' }) {
  const colors = TIER_COLORS[achievement.tier];
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-14 h-14 text-2xl',
  };

  return (
    <div className="group relative">
      <div
        className={cn(
          'rounded-full flex items-center justify-center border-2 transition-all duration-300',
          colors.bg,
          colors.border,
          achievement.unlocked ? `shadow-lg ${colors.glow}` : 'opacity-40 grayscale',
          sizeClasses[size]
        )}
      >
        <span className={achievement.unlocked ? '' : 'opacity-50'}>{achievement.icon}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-black/95 border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none">
        <div className={cn('font-bold text-sm', colors.text)}>{achievement.name}</div>
        <div className="text-xs text-text-muted mt-0.5">{achievement.description}</div>
        {!achievement.unlocked && achievement.progress !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Progress</span>
              <span>{Math.round(achievement.progress)}%</span>
            </div>
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', colors.bg.replace('/20', '/60').replace('/30', '/80'))}
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95" />
      </div>
    </div>
  );
}

// Potential rating card (FIFA style)
function PotentialCard({ potential, compact }: { potential: PotentialRating; compact?: boolean }) {
  const trendIcons = {
    rising: '📈',
    stable: '➡️',
    declining: '📉',
  };

  const trendColors = {
    rising: 'text-green-400',
    stable: 'text-text-muted',
    declining: 'text-red-400',
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <span className="text-xs text-text-muted">POT</span>
        <span className="text-lg font-black text-amber-400">{potential.potential}</span>
        <span className={cn('text-sm', trendColors[potential.trend])}>{trendIcons[potential.trend]}</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-5 group hover:bg-white/[0.04] transition-colors">
      <div className="absolute top-0 right-0 p-3 opacity-50">
        <span className={cn('text-xs font-medium flex items-center gap-1.5', trendColors[potential.trend])}>
          {potential.trend.toUpperCase()} {trendIcons[potential.trend]}
        </span>
      </div>

      <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-4">
        Potential Rating
      </div>

      <div className="flex items-end items-center justify-between gap-4">
        {/* Current */}
        <div>
          <div className="text-3xl font-black text-white tracking-tight leading-none">{potential.current}</div>
          <div className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">Current</div>
        </div>

        {/* Visual Connector */}
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-amber-500/50 relative top-[-10px]">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
        </div>

        {/* Potential */}
        <div className="text-right">
          <div className="text-4xl font-black text-amber-500 tracking-tighter leading-none">{potential.potential}</div>
          <div className="text-[10px] text-amber-500/60 mt-1 uppercase tracking-wider font-bold">Projected</div>
        </div>
      </div>

      {/* Growth Badge */}
      {potential.potential > potential.current && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-xs text-text-muted">Peak Season: <span className="text-text-secondary">{potential.peakMonth || 'Unknown'}</span></span>
          <span className="text-sm font-bold text-green-400">+{potential.potential - potential.current} Growth</span>
        </div>
      )}
    </div>
  );
}

// Next achievement progress
function NextAchievementCard({ achievement }: { achievement: Achievement }) {
  const colors = TIER_COLORS[achievement.tier];

  return (
    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2 text-lg opacity-60',
            colors.bg,
            colors.border
          )}
        >
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={cn('text-sm font-medium', colors.text)}>{achievement.name}</span>
            <span className="text-xs text-text-muted">{Math.round(achievement.progress || 0)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', colors.bg.replace('/20', '/50').replace('/30', '/70'))}
              style={{ width: `${achievement.progress || 0}%` }}
            />
          </div>
          <div className="text-xs text-text-muted mt-1">
            {achievement.currentValue?.toLocaleString()} / {achievement.maxValue?.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component
export function AchievementBadges({
  contributions,
  overallRating,
  compact = false,
  className = '',
  extendedStats,
  layout = 'default',
}: AchievementBadgesProps) {
  const achievements = useMemo(
    () => calculateAchievements(contributions, extendedStats),
    [contributions, extendedStats]
  );
  const potential = useMemo(() => calculatePotential(contributions, overallRating), [contributions, overallRating]);
  const topAchievements = useMemo(() => getTopAchievements(achievements, 5), [achievements]);
  const nextAchievement = useMemo(() => getNextAchievement(achievements), [achievements]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {/* Top 3 achievements */}
        <div className="flex items-center gap-1.5">
          {topAchievements.slice(0, 3).map(a => (
            <AchievementBadge key={a.id} achievement={a} size="sm" />
          ))}
          {topAchievements.length === 0 && (
            <span className="text-xs text-text-muted">No achievements yet</span>
          )}
        </div>

        {/* Potential badge */}
        <PotentialCard potential={potential} compact />
      </div>
    );
  }

  // Dashboard Layout (Optimize for width)
  if (layout === 'dashboard') {
    return (
      <div className={cn('w-full', className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
            <span>🏅</span> Achievements
          </h3>
          <span className="text-xs font-medium text-text-muted bg-white/5 px-2 py-1 rounded-md border border-white/5">
            {unlockedCount} / {totalCount}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Next Up + Collection */}
          <div className="space-y-8 flex flex-col">
            {/* Next achievement */}
            {nextAchievement && (
              <div className="flex-none">
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">
                  Next Up
                </div>
                <NextAchievementCard achievement={nextAchievement} />
              </div>
            )}

            {/* Collection */}
            <div className="flex-1">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">
                Collection
              </div>
              <div className="flex flex-wrap gap-4">
                {topAchievements.map(a => (
                  <AchievementBadge key={a.id} achievement={a} size="md" />
                ))}
                {topAchievements.length === 0 && (
                  <p className="text-xs text-text-muted italic">
                    No achievements unlocked yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Potential Rating (Full Height) */}
          <div className="h-full">
            <div className="h-full flex flex-col">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1 invisible">
                Rating
              </div>
              <div className="flex-1">
                <PotentialCard potential={potential} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Vertical Stack
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>🏅</span> Achievements
        </h3>
        <span className="text-xs font-medium text-text-muted bg-white/5 px-2 py-1 rounded-md border border-white/5">
          {unlockedCount} / {totalCount}
        </span>
      </div>

      <div className="space-y-6">
        {/* Next achievement - Prominent */}
        {nextAchievement && (
          <div className="p-1">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">
              Next Up
            </div>
            <NextAchievementCard achievement={nextAchievement} />
          </div>
        )}

        {/* Achievement Badges Grid - Refined */}
        <div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1">
            Collection
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
            {topAchievements.map(a => (
              <div key={a.id} className="flex justify-center">
                <AchievementBadge achievement={a} size="md" />
              </div>
            ))}
            {topAchievements.length === 0 && (
              <p className="col-span-full text-xs text-text-muted text-center py-4 italic">
                No achievements unlocked yet. Keep coding!
              </p>
            )}
          </div>
        </div>

        {/* Potential Rating - Cleaner */}
        <div className="pt-2">
          <PotentialCard potential={potential} />
        </div>
      </div>
    </div>
  );
}

// Export individual components for flexibility
export { AchievementBadge, PotentialCard, NextAchievementCard };
