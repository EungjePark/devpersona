/**
 * Shared utilities for trends components
 */

import { getLanguageColor as getLanguageColorFromConfig, LANGUAGE_COLORS as CHART_LANGUAGE_COLORS } from '@/lib/chart-config';

// Re-export language colors for components that need direct access
export const LANGUAGE_COLORS = CHART_LANGUAGE_COLORS;

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format number without decimal for shorter display
 */
export function formatNumberCompact(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toString();
}

/**
 * Calculate human-readable time ago string from timestamp
 */
export function getTimeAgo(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null;

  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Calculate time ago from ISO date string
 */
export function getTimeAgoFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Get language color from name with null handling
 */
export function getLanguageColor(language: string | null): string {
  if (!language) return '#6b7280';
  return getLanguageColorFromConfig(language);
}
