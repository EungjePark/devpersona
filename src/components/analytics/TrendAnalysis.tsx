'use client';

import { memo, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ContributionStats } from '@/lib/types';
import { formatCompact } from '@/lib/format';
import {
  CHART_THEME,
  tooltipStyle,
  CHART_ANIMATION,
  CHART_MARGINS,
  ChartContainer,
} from '@/lib/chart-config';

interface TrendAnalysisProps {
  contributions: ContributionStats;
  tierColor: string;
}

// Month names
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Custom tooltip component
interface TooltipPayload {
  value: number;
  name: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  return (
    <div style={tooltipStyle.contentStyle}>
      <p style={tooltipStyle.labelStyle}>{label}</p>
      <p style={tooltipStyle.itemStyle}>
        {data.value.toLocaleString()} contributions
      </p>
    </div>
  );
}

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

    return sortedMonths.map(([monthKey, count]) => {
      const [year, month] = monthKey.split('-');
      return {
        name: MONTHS[parseInt(month) - 1],
        fullLabel: `${MONTHS[parseInt(month) - 1]} ${year}`,
        year,
        count,
      };
    });
  }, [contributions]);

  // Calculate average
  const average = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return Math.round(monthlyData.reduce((sum, m) => sum + m.count, 0) / monthlyData.length);
  }, [monthlyData]);

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
      , monthlyData[0] || { name: '-', count: 0, year: '', fullLabel: '-' });
  }, [monthlyData]);

  // Area fill gradient ID
  const gradientId = `trendGradient-${tierColor.replace('#', '')}`;

  return (
    <div className="space-y-6">
      {/* Trend indicator */}
      {trend && (
        <div className={`p-4 rounded-xl ${trend.direction === 'up'
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
            <div className={`text-xl font-bold ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
              {trend.direction === 'up' ? '+' : '-'}{trend.percentage}%
            </div>
          </div>
        </div>
      )}

      {/* Recharts ComposedChart */}
      <div className="space-y-2">
        <h4 className="text-xs text-text-muted uppercase tracking-wider">Monthly Contributions</h4>

        <ChartContainer className="h-48 min-w-[200px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={100} debounce={50}>
            <ComposedChart
              data={monthlyData}
              margin={CHART_MARGINS.withAxis}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tierColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={tierColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_THEME.grid}
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{ fill: CHART_THEME.axisLabel, fontSize: 10 }}
                axisLine={{ stroke: CHART_THEME.grid }}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: CHART_THEME.axisLabel, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCompact(value, 0)}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Average reference line */}
              <ReferenceLine
                y={average}
                stroke={CHART_THEME.text.muted}
                strokeDasharray="3 3"
                label={{
                  value: `avg: ${average}`,
                  position: 'right',
                  fill: CHART_THEME.text.muted,
                  fontSize: 9,
                }}
              />

              {/* Area under the bars */}
              <Area
                type="monotone"
                dataKey="count"
                fill={`url(#${gradientId})`}
                stroke="none"
                animationDuration={CHART_ANIMATION.duration}
              />

              {/* Bar chart */}
              <Bar
                dataKey="count"
                fill={tierColor}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                animationDuration={CHART_ANIMATION.duration}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-sm font-bold" style={{ color: tierColor }}>
            {bestMonth.fullLabel || `${bestMonth.name} ${bestMonth.year}`}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Best Month</div>
          <div className="text-xs text-text-secondary mt-0.5">
            {bestMonth.count.toLocaleString()} contributions
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02] text-center">
          <div className="text-sm font-bold text-white">
            {average}
          </div>
          <div className="text-[10px] text-text-muted uppercase">Monthly Average</div>
        </div>
      </div>
    </div>
  );
});
