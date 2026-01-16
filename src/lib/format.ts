// 일관된 숫자 표시를 위한 유틸리티

/**
 * Format large numbers with K/M suffix
 */
export function formatCompact(value: number, decimals = 1): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
  return value.toLocaleString();
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number as integer with locale formatting
 */
export function formatInteger(value: number): string {
  return Math.round(value).toLocaleString();
}

/**
 * Metric context types for visual indicators
 */
export type MetricContext = 'excellent' | 'good' | 'average' | 'below' | 'poor';

/**
 * Get metric context based on value and thresholds
 */
export function getMetricContext(
  value: number,
  thresholds: { excellent: number; good: number; average: number; below: number }
): MetricContext {
  if (value >= thresholds.excellent) return 'excellent';
  if (value >= thresholds.good) return 'good';
  if (value >= thresholds.average) return 'average';
  if (value >= thresholds.below) return 'below';
  return 'poor';
}

/**
 * Metric context colors using CSS variables
 */
export const CONTEXT_COLORS: Record<MetricContext, string> = {
  excellent: 'var(--metric-excellent)',
  good: 'var(--metric-good)',
  average: 'var(--metric-average)',
  below: 'var(--metric-below)',
  poor: 'var(--metric-poor)',
};

/**
 * Fallback hex colors for when CSS variables aren't available
 */
export const CONTEXT_COLORS_HEX: Record<MetricContext, string> = {
  excellent: '#ffd700',
  good: '#22c55e',
  average: '#3b82f6',
  below: '#f59e0b',
  poor: '#ef4444',
};

/**
 * Get context label for display
 */
export function getContextLabel(context: MetricContext): string {
  const labels: Record<MetricContext, string> = {
    excellent: 'Top 5%',
    good: 'Top 20%',
    average: 'Top 50%',
    below: 'Below Average',
    poor: 'Needs Work',
  };
  return labels[context];
}

/**
 * Default thresholds for common metrics
 */
export const DEFAULT_THRESHOLDS = {
  contributions: { excellent: 2000, good: 1000, average: 500, below: 100 },
  streak: { excellent: 100, good: 30, average: 14, below: 7 },
  rating: { excellent: 90, good: 75, average: 50, below: 25 },
  languages: { excellent: 8, good: 5, average: 3, below: 1 },
  packages: { excellent: 10, good: 5, average: 2, below: 1 },
};

/**
 * Grade descriptions for tooltips
 */
export const GRADE_DESCRIPTIONS: Record<string, string> = {
  S: 'Top 5% - Exceptional',
  A: 'Top 20% - Excellent',
  B: 'Top 40% - Good',
  C: 'Top 60% - Average',
  D: 'Top 80% - Below Average',
  F: 'Bottom 20% - Needs Improvement',
};
