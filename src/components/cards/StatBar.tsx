'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface StatBarProps {
  label: string;
  value: number; // 0-100
  className?: string;
  compact?: boolean; // For 2-column layout
}

// Get grade from value
function getGrade(value: number): { grade: string; color: string } {
  if (value >= 90) return { grade: 'S', color: '#ffd700' };
  if (value >= 80) return { grade: 'A', color: '#22c55e' };
  if (value >= 60) return { grade: 'B', color: '#84cc16' };
  if (value >= 40) return { grade: 'C', color: '#eab308' };
  if (value >= 20) return { grade: 'D', color: '#f97316' };
  return { grade: 'F', color: '#ef4444' };
}

export function StatBar({ label, value, className, compact = false }: StatBarProps) {
  const { grade, color } = useMemo(() => getGrade(value), [value]);

  return (
    <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3', className)}>
      {/* Label */}
      <span className={cn(
        'font-medium text-text-secondary',
        compact ? 'w-12 text-[10px]' : 'w-14 text-xs'
      )}>
        {label}
      </span>

      {/* Grade badge */}
      <span
        className={cn(
          'rounded font-bold flex items-center justify-center',
          compact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'
        )}
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        {grade}
      </span>

      {/* Progress bar */}
      <div className={cn(
        'flex-1 bg-bg-tertiary rounded-full overflow-hidden',
        compact ? 'h-1.5' : 'h-2'
      )}>
        <div
          className="h-full rounded-full stat-bar"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            // CSS variable for animation
            '--stat-width': `${value}%`,
          } as React.CSSProperties}
        />
      </div>

      {/* Value */}
      <span className={cn(
        'font-bold text-text-primary text-right',
        compact ? 'w-6 text-xs' : 'w-8 text-sm'
      )}>
        {value}
      </span>
    </div>
  );
}
