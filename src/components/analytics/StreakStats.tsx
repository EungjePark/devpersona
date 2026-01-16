'use client';

import { memo, useMemo } from 'react';
import type { ContributionStats } from '@/lib/types';

interface StreakStatsProps {
  contributions: ContributionStats;
  tierColor: string;
}

// Streak milestone badges
const STREAK_MILESTONES = [
  { days: 7, name: 'Week Warrior', emoji: '🔥' },
  { days: 30, name: 'Monthly Master', emoji: '🌟' },
  { days: 100, name: 'Centurion', emoji: '💯' },
  { days: 365, name: 'Year Legend', emoji: '🏆' },
];

export const StreakStats = memo(function StreakStats({
  contributions,
  tierColor,
}: StreakStatsProps) {
  const { currentStreak, longestStreak, totalContributions, averagePerDay } = contributions;

  // Calculate next milestone
  const nextMilestone = useMemo(() => {
    const milestone = STREAK_MILESTONES.find(m => currentStreak < m.days);
    if (!milestone) return null;
    return {
      ...milestone,
      daysToGo: milestone.days - currentStreak,
      progress: (currentStreak / milestone.days) * 100,
    };
  }, [currentStreak]);

  // Achieved milestones
  const achievedMilestones = useMemo(() => {
    return STREAK_MILESTONES.filter(m => longestStreak >= m.days);
  }, [longestStreak]);

  return (
    <div className="space-y-6">
      {/* Main streak display */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current streak */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 text-center overflow-hidden">
          <div className="absolute top-2 right-2 text-3xl opacity-20">🔥</div>
          <div className="text-5xl font-black mb-1" style={{ color: tierColor }}>
            {currentStreak}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Current Streak</div>
          <div className="mt-2 text-sm text-text-secondary">
            {currentStreak === 0 ? 'Start coding today!' : `${currentStreak} days and counting!`}
          </div>
        </div>

        {/* Best streak */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 text-center overflow-hidden">
          <div className="absolute top-2 right-2 text-3xl opacity-20">🏆</div>
          <div className="text-5xl font-black text-yellow-400 mb-1">
            {longestStreak}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Best Streak</div>
          <div className="mt-2 text-sm text-text-secondary">
            Your all-time record
          </div>
        </div>
      </div>

      {/* Next milestone progress */}
      {nextMilestone && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{nextMilestone.emoji}</span>
              <span className="text-sm font-medium text-white">{nextMilestone.name}</span>
            </div>
            <span className="text-sm text-text-muted">
              {nextMilestone.daysToGo} days to go
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${nextMilestone.progress}%`,
                background: `linear-gradient(90deg, ${tierColor}50, ${tierColor})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Achieved milestones */}
      {achievedMilestones.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-text-muted uppercase tracking-wider">Achievements Unlocked</h4>
          <div className="flex flex-wrap gap-2">
            {achievedMilestones.map((milestone) => (
              <div
                key={milestone.days}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
              >
                <span>{milestone.emoji}</span>
                <span className="text-xs font-medium text-yellow-400">{milestone.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-lg font-bold text-white">
            {totalContributions.toLocaleString()}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Total Contributions</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-lg font-bold text-white">
            {averagePerDay.toFixed(1)}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Daily Average</div>
        </div>
      </div>
    </div>
  );
});
