'use client';

import { memo, useMemo } from 'react';
import type { ContributionStats } from '@/lib/types';

interface TrendAnalysisProps {
  contributions: ContributionStats;
  tierColor: string;
}

// Month names
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TrendAnalysis = memo(function TrendAnalysis({
  contributions,
  tierColor,
}: TrendAnalysisProps) {
  // Calculate monthly contribution data
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};

    contributions.calendar.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        const date = new Date(day.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months[monthKey] = (months[monthKey] || 0) + day.contributionCount;
      });
    });

    // Get last 12 months
    const sortedMonths = Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);

    const maxCount = Math.max(...sortedMonths.map(([, count]) => count), 1);

    return sortedMonths.map(([monthKey, count]) => {
      const [year, month] = monthKey.split('-');
      return {
        label: MONTHS[parseInt(month) - 1],
        year,
        count,
        percentage: (count / maxCount) * 100,
      };
    });
  }, [contributions]);

  // Calculate trend (comparing last 3 months to previous 3 months)
  const trend = useMemo(() => {
    if (monthlyData.length < 6) return null;

    const recent3 = monthlyData.slice(-3).reduce((sum, m) => sum + m.count, 0);
    const previous3 = monthlyData.slice(-6, -3).reduce((sum, m) => sum + m.count, 0);

    if (previous3 === 0) return null;

    const percentChange = ((recent3 - previous3) / previous3) * 100;
    return {
      direction: percentChange >= 0 ? 'up' : 'down',
      percentage: Math.abs(percentChange).toFixed(0),
      recent3,
      previous3,
    };
  }, [monthlyData]);

  // Find best month
  const bestMonth = useMemo(() => {
    return monthlyData.reduce((best, current) =>
      current.count > best.count ? current : best
    , monthlyData[0] || { label: '-', count: 0, year: '', percentage: 0 });
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Trend indicator */}
      {trend && (
        <div className={`p-4 rounded-xl ${
          trend.direction === 'up'
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{trend.direction === 'up' ? '📈' : '📉'}</span>
              <div>
                <div className="text-sm font-medium text-white">
                  {trend.direction === 'up' ? 'Growing' : 'Slowing'} Activity
                </div>
                <div className="text-xs text-text-muted">
                  Compared to 3 months ago
                </div>
              </div>
            </div>
            <div className={`text-xl font-bold ${
              trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend.direction === 'up' ? '+' : '-'}{trend.percentage}%
            </div>
          </div>
        </div>
      )}

      {/* Monthly chart */}
      <div className="space-y-2">
        <h4 className="text-xs text-text-muted uppercase tracking-wider">Monthly Contributions</h4>

        <div className="flex items-end gap-1 h-32">
          {monthlyData.map((month, index) => (
            <div
              key={`${month.year}-${month.label}`}
              className="flex-1 flex flex-col items-center group"
            >
              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${month.percentage}%`,
                    minHeight: month.count > 0 ? '4px' : '0',
                    backgroundColor: tierColor,
                  }}
                />
              </div>

              {/* Label */}
              <div className="text-[9px] text-text-muted mt-1">{month.label}</div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 px-2 py-1 rounded bg-bg-primary border border-white/10 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {month.label} {month.year}: {month.count} contributions
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-sm font-bold" style={{ color: tierColor }}>
            {bestMonth.label} {bestMonth.year}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Best Month</div>
          <div className="text-xs text-text-secondary mt-0.5">
            {bestMonth.count} contributions
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-sm font-bold text-white">
            {monthlyData.length > 0
              ? Math.round(monthlyData.reduce((sum, m) => sum + m.count, 0) / monthlyData.length)
              : 0}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Monthly Average</div>
        </div>
      </div>
    </div>
  );
});
