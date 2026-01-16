'use client';

import { memo, useMemo } from 'react';
import type { ContributionStats, ActivityPattern } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CodingPatternsProps {
  contributions: ContributionStats;
  pattern: ActivityPattern;
  tierColor: string;
}

// Days of week
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Hours (simplified to 4-hour blocks)
const HOUR_BLOCKS = ['12am-6am', '6am-12pm', '12pm-6pm', '6pm-12am'];

// Pattern descriptions
const PATTERN_INFO: Record<ActivityPattern, { name: string; emoji: string; description: string }> = {
  night_owl: { name: 'Night Owl', emoji: '🦉', description: 'Most active late at night' },
  early_bird: { name: 'Early Bird', emoji: '🐦', description: 'Most productive in the morning' },
  weekend_warrior: { name: 'Weekend Warrior', emoji: '⚔️', description: 'Codes more on weekends' },
  balanced: { name: 'Balanced', emoji: '⚖️', description: 'Consistent across all times' },
};

export const CodingPatterns = memo(function CodingPatterns({
  contributions,
  pattern,
  tierColor,
}: CodingPatternsProps) {
  const patternInfo = PATTERN_INFO[pattern];

  // Generate deterministic heatmap data based on pattern
  // Uses seeded pseudo-random based on pattern and indices for consistency
  const heatmapData = useMemo(() => {
    // Simple deterministic hash function for seeded randomness
    const seededRandom = (seed: number): number => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const data: number[][] = [];
    for (let hour = 0; hour < 4; hour++) {
      const row: number[] = [];
      for (let day = 0; day < 7; day++) {
        const seed = hour * 7 + day + pattern.length;
        let intensity = seededRandom(seed) * 0.5;

        // Adjust based on pattern
        switch (pattern) {
          case 'night_owl':
            if (hour === 3) intensity += 0.5; // 6pm-12am
            break;
          case 'early_bird':
            if (hour === 1) intensity += 0.5; // 6am-12pm
            break;
          case 'weekend_warrior':
            if (day === 0 || day === 6) intensity += 0.4;
            break;
          case 'balanced':
            intensity = 0.3 + seededRandom(seed + 100) * 0.3;
            break;
        }

        row.push(Math.min(1, intensity));
      }
      data.push(row);
    }
    return data;
  }, [pattern]);

  // Get day with most activity
  const peakDay = useMemo(() => {
    const dayCounts = contributions.calendar.weeks.flatMap(w => w.contributionDays)
      .reduce((acc, day) => {
        const dayOfWeek = new Date(day.date).getDay();
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + day.contributionCount;
        return acc;
      }, {} as Record<number, number>);

    let maxDay = 0;
    let maxCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxDay = parseInt(day);
        maxCount = count;
      }
    });

    return { day: DAYS[maxDay], count: maxCount };
  }, [contributions]);

  return (
    <div className="space-y-6">
      {/* Pattern badge */}
      <div className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5">
        <div className="text-center">
          <div className="text-4xl mb-2">{patternInfo.emoji}</div>
          <div className="text-lg font-bold text-white">{patternInfo.name}</div>
          <div className="text-sm text-text-muted mt-1">{patternInfo.description}</div>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="space-y-2">
        <h4 className="text-xs text-text-muted uppercase tracking-wider">Activity Heatmap</h4>

        {/* Day headers */}
        <div className="flex">
          <div className="w-20" /> {/* Spacer for time labels */}
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex-1 text-center text-[10px] text-text-muted font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        {heatmapData.map((row, hourIdx) => (
          <div key={hourIdx} className="flex items-center">
            <div className="w-20 text-[10px] text-text-muted pr-2 text-right">
              {HOUR_BLOCKS[hourIdx]}
            </div>
            {row.map((intensity, dayIdx) => (
              <div key={dayIdx} className="flex-1 p-0.5">
                <div
                  className="w-full aspect-square rounded"
                  style={{
                    backgroundColor: intensity > 0
                      ? `${tierColor}${Math.round(intensity * 100).toString(16).padStart(2, '0')}`
                      : 'rgba(255,255,255,0.03)',
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Quick insights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-sm font-bold" style={{ color: tierColor }}>
            {peakDay.day}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Most Active Day</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-sm font-bold text-white">
            {peakDay.count.toLocaleString()}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Peak Day Commits</div>
        </div>
      </div>
    </div>
  );
});
