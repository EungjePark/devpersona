'use client';

/**
 * Recharts common theme configuration
 * Provides consistent styling across all chart components
 */

import { useSyncExternalStore, createElement, type ReactNode } from 'react';
import type { TierLevel } from './types';

// Chart theme colors aligned with DevPersona design system
export const CHART_THEME = {
  background: '#09090b',
  grid: 'rgba(255,255,255,0.05)',
  axis: 'rgba(255,255,255,0.3)',
  axisLabel: '#71717a',
  tooltip: {
    background: '#141419',
    border: 'rgba(255,255,255,0.1)',
    text: '#f4f4f5',
    label: '#a1a1aa',
  },
  text: {
    primary: '#f4f4f5',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
} as const;

// Tier-specific chart colors
export const TIER_CHART_COLORS: Record<TierLevel, {
  primary: string;
  secondary: string;
  fill: string;
  gradient: string[];
}> = {
  S: {
    primary: '#ffd700',
    secondary: '#f59e0b',
    fill: 'rgba(255, 215, 0, 0.2)',
    gradient: ['#ffd700', '#b45309'],
  },
  A: {
    primary: '#a855f7',
    secondary: '#9333ea',
    fill: 'rgba(168, 85, 247, 0.2)',
    gradient: ['#a855f7', '#7e22ce'],
  },
  B: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    fill: 'rgba(59, 130, 246, 0.2)',
    gradient: ['#3b82f6', '#1d4ed8'],
  },
  C: {
    primary: '#6b7280',
    secondary: '#52525b',
    fill: 'rgba(107, 114, 128, 0.2)',
    gradient: ['#71717a', '#3f3f46'],
  },
};

// Signal colors for radar and other multi-signal charts
export const SIGNAL_CHART_COLORS = {
  grit: '#f97316',      // Orange
  focus: '#22c55e',     // Green
  craft: '#3b82f6',     // Blue
  impact: '#f59e0b',    // Amber
  voice: '#8b5cf6',     // Purple
  reach: '#06b6d4',     // Cyan
} as const;

// Grade colors for stat visualizations
export const GRADE_CHART_COLORS = {
  S: '#fcd34d',
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
} as const;

// Language colors for code ownership charts
// Consolidated - use this as the single source of truth
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3776ab',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  Ruby: '#cc342d',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Scala: '#dc322f',
  Dart: '#00b4ab',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Zig: '#ec915c',
  default: '#6b7280',
};

// Recharts tooltip style helper
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: CHART_THEME.tooltip.background,
    border: `1px solid ${CHART_THEME.tooltip.border}`,
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  labelStyle: {
    color: CHART_THEME.tooltip.label,
    fontSize: '11px',
    fontWeight: 500,
    marginBottom: '4px',
  },
  itemStyle: {
    color: CHART_THEME.tooltip.text,
    fontSize: '12px',
    fontWeight: 600,
    padding: 0,
  },
};

// Animation config
export const CHART_ANIMATION = {
  duration: 800,
  easing: 'ease-out' as const,
};

// Get language color with fallback
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.default;
}

// Get tier color set
export function getTierColors(tier: TierLevel) {
  return TIER_CHART_COLORS[tier] || TIER_CHART_COLORS.C;
}

// Common chart margins
export const CHART_MARGINS = {
  default: { top: 10, right: 10, left: 10, bottom: 10 },
  withAxis: { top: 20, right: 20, left: 40, bottom: 40 },
  compact: { top: 5, right: 5, left: 5, bottom: 5 },
};

// Responsive breakpoints for chart dimensions
export const CHART_BREAKPOINTS = {
  sm: 320,
  md: 640,
  lg: 1024,
};

/**
 * ChartContainer - Wrapper that prevents Recharts ResponsiveContainer warnings
 *
 * Delays rendering until after mount when DOM dimensions are available.
 * This prevents the "width(-1) and height(-1)" console warnings that occur
 * when ResponsiveContainer tries to measure its parent before CSS layout completes.
 */
interface ChartContainerProps {
  children: ReactNode;
  className?: string;
}

// SSR-safe mount detection using useSyncExternalStore
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ChartContainer({ children, className }: ChartContainerProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isMounted) {
    // Return empty container with same dimensions to prevent layout shift
    return createElement('div', { className });
  }

  return createElement('div', { className }, children);
}
