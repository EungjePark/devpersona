'use client';

import { useMemo } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import type { ContributionStats, TierLevel } from '@/lib/types';
import { TIER_DESIGN_TOKENS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ContributionGraphProps {
  contributions: ContributionStats;
  className?: string;
  compact?: boolean;
  tierLevel?: TierLevel;
}

// Default GitHub-style colors (Refined for Dark Mode)
const DEFAULT_LEVEL_COLORS = [
  'rgba(255, 255, 255, 0.04)', // 0: Subtle glass
  '#0e4429', // 1
  '#006d32', // 2
  '#26a641', // 3
  '#39d353', // 4
];

// Get tier-aware colors
function getTierColors(tierLevel?: TierLevel): string[] {
  if (!tierLevel) return DEFAULT_LEVEL_COLORS;

  const tierDesign = TIER_DESIGN_TOKENS[tierLevel];
  return [
    'rgba(255, 255, 255, 0.04)', // 0: Consistent empty state
    tierDesign.grassColors[0],
    tierDesign.grassColors[1],
    tierDesign.grassColors[2],
    tierDesign.grassColors[3],
  ];
}

// Contribution level thresholds
const CONTRIBUTION_THRESHOLDS = [0, 3, 6, 9] as const;

function getContributionLevel(count: number): number {
  if (count === 0) return 0;
  for (let i = CONTRIBUTION_THRESHOLDS.length - 1; i >= 0; i--) {
    if (count > CONTRIBUTION_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

// Month labels
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ContributionGraph({ contributions, className = '', compact = false, tierLevel }: ContributionGraphProps) {
  const { calendar, currentStreak, longestStreak, totalContributions } = contributions;

  // Transform data for react-activity-calendar
  // It expects Array<{ date: string; count: number; level: number }>
  const data = useMemo(() => {
    const allDays: Array<{ date: string; count: number; level: number }> = [];
    calendar.weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        allDays.push({
          date: day.date,
          count: day.contributionCount,
          level: getContributionLevel(day.contributionCount),
        });
      });
    });

    // Sort by date just in case
    return allDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [calendar]);

  // Use only the last N days based on compact mode
  const displayedData = useMemo(() => {
    const daysToShow = compact ? 150 : 365; // ~5 months vs 1 year
    return data.slice(-daysToShow);
  }, [data, compact]);

  // Get tier-aware colors
  const levelColors = useMemo(() => getTierColors(tierLevel), [tierLevel]);

  // Theme for the calendar
  const theme = {
    dark: levelColors,
    light: levelColors,
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Stats row */}
      <div className="flex items-center justify-between mb-6 px-4 max-w-[880px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="text-xl font-black text-white">{currentStreak}</span>
              <span className="text-xs text-text-muted ml-1 font-medium uppercase tracking-wider">Streak</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <span className="text-lg font-bold text-text-secondary">{longestStreak}</span>
              <span className="text-xs text-text-muted ml-1 font-medium uppercase tracking-wider">Best</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-gradient-primary">{totalContributions.toLocaleString()}</span>
          <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Contributions</div>
        </div>
      </div>

      {/* Calendar Graph */}
      <div className="w-full flex justify-center overflow-x-auto pb-2 scrollbar-hide">
        {/* We use a dynamic import or checking client-side if needed, but here standard import works */}
        <ActivityCalendar
          data={displayedData}
          theme={theme}
          labels={{
            legend: {
              less: 'Less',
              more: 'More',
            },
            months: MONTHS,
            totalCount: '{{count}} contributions in {{year}}',
          }}
          colorScheme="dark"
          blockSize={16}
          blockMargin={4}
          fontSize={11}
          showWeekdayLabels
        />
      </div>

      {/* Explicit Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5 max-w-[880px] mx-auto">
        <span className="text-[10px] text-text-muted font-medium">Less</span>
        <div className="flex gap-1">
          {levelColors.map((color, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: color }}
              title={`Level ${index}: ${index === 0 ? '0' : index === 1 ? '1-3' : index === 2 ? '4-6' : index === 3 ? '7-9' : '10+'} contributions`}
            />
          ))}
        </div>
        <span className="text-[10px] text-text-muted font-medium">More</span>
      </div>
    </div>
  );
}

// Compact streak display for cards
export function StreakBadge({ contributions }: { contributions: ContributionStats }) {
  const { currentStreak, longestStreak } = contributions;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-1">
        <span className="text-sm">🔥</span>
        <span className="text-sm font-bold text-white">{currentStreak}</span>
        <span className="text-xs text-text-muted">streak</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-1">
        <span className="text-xs">🏆</span>
        <span className="text-xs font-medium text-text-secondary">{longestStreak}</span>
        <span className="text-xs text-text-muted">best</span>
      </div>
    </div>
  );
}
