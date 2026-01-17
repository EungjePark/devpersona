'use client';

import { memo, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { ContributionStats } from '@/lib/types';
import { CHART_THEME, CHART_ANIMATION, ChartContainer } from '@/lib/chart-config';

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

// Semicircle gauge component using Recharts
function StreakGauge({
  value,
  maxValue,
  tierColor,
  label,
}: {
  value: number;
  maxValue: number;
  tierColor: string;
  label: string;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const data = [
    { name: 'completed', value: percentage },
    { name: 'remaining', value: 100 - percentage },
  ];

  return (
    <div className="relative flex flex-col items-center">
      <ChartContainer className="h-48 w-full min-w-[120px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100} debounce={50}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="70%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={0}
              dataKey="value"
              animationDuration={CHART_ANIMATION.duration}
              stroke="none"
            >
              <Cell fill={tierColor} />
              <Cell fill={CHART_THEME.grid} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      {/* Center value */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center">
        <div className="text-3xl font-black" style={{ color: tierColor }}>
          {value}
        </div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
          {label}
        </div>
      </div>
    </div>
  );
}

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

  // Calculate gauge max value (next milestone or 365)
  const gaugeMaxValue = nextMilestone?.days || 365;

  return (
    <div className="space-y-6">
      {/* Main streak display with gauges */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current streak gauge */}
        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 overflow-hidden">
          <div className="absolute top-2 right-2 text-2xl opacity-20">🔥</div>
          <StreakGauge
            value={currentStreak}
            maxValue={gaugeMaxValue}
            tierColor={tierColor}
            label="Current Streak"
          />
          <div className="text-center mt-2 text-xs text-text-secondary">
            {currentStreak === 0 ? 'Start coding today!' : `${currentStreak} days and counting!`}
          </div>
        </div>

        {/* Best streak gauge */}
        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 overflow-hidden">
          <div className="absolute top-2 right-2 text-2xl opacity-20">🏆</div>
          <StreakGauge
            value={longestStreak}
            maxValue={Math.max(longestStreak, 365)}
            tierColor="#fbbf24"
            label="Best Streak"
          />
          <div className="text-center mt-2 text-xs text-text-secondary">
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
