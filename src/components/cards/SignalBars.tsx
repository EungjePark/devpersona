'use client';

import { SIGNAL_LABELS, SIGNAL_ORDER, STAT_GRADES, type SignalScores, type StatGrade } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SignalBarsProps {
  signals: SignalScores;
  className?: string;
  showGrade?: boolean;
  compact?: boolean;
}

function getGrade(value: number): { grade: StatGrade; color: string } {
  for (const gradeInfo of STAT_GRADES) {
    if (value >= gradeInfo.threshold) {
      return { grade: gradeInfo.grade, color: gradeInfo.color };
    }
  }
  return { grade: 'F', color: '#ef4444' };
}

export function SignalBars({
  signals,
  className = '',
  showGrade = true,
  compact = false,
}: SignalBarsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {SIGNAL_ORDER.map((key) => {
        const label = SIGNAL_LABELS[key];
        const value = signals[key];
        const { grade, color } = getGrade(value);

        return (
          <div key={key} className={cn('group', compact ? 'space-y-1' : 'space-y-1.5')}>
            {/* Label row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{label.emoji}</span>
                <span className={cn(
                  'font-bold tracking-wide text-text-secondary',
                  compact ? 'text-xs' : 'text-sm'
                )}>
                  {label.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {showGrade && (
                  <span
                    className={cn(
                      'font-black rounded px-1.5 py-0.5',
                      compact ? 'text-[10px]' : 'text-xs'
                    )}
                    style={{
                      backgroundColor: `${color}20`,
                      color: color,
                    }}
                  >
                    {grade}
                  </span>
                )}
                <span className={cn(
                  'font-black text-text-primary tabular-nums',
                  compact ? 'text-sm w-7' : 'text-base w-8'
                )}>
                  {value}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className={cn(
              'w-full bg-white/5 rounded-full overflow-hidden',
              compact ? 'h-1.5' : 'h-2'
            )}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${value}%`,
                  background: `linear-gradient(90deg, ${color}90 0%, ${color} 100%)`,
                  boxShadow: `0 0 8px ${color}40`,
                }}
              />
            </div>

            {/* Description (only in non-compact mode) */}
            {!compact && (
              <p className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                {label.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact 2-column grid version
export function SignalBarsGrid({
  signals,
  className = '',
}: {
  signals: SignalScores;
  className?: string;
}) {
  const leftSignals: (keyof SignalScores)[] = ['grit', 'focus', 'craft'];
  const rightSignals: (keyof SignalScores)[] = ['impact', 'voice', 'reach'];

  return (
    <div className={cn('grid grid-cols-2 gap-x-6 gap-y-2', className)}>
      {[leftSignals, rightSignals].map((side, sideIndex) => (
        <div key={sideIndex} className="space-y-2">
          {side.map((key) => {
            const label = SIGNAL_LABELS[key];
            const value = signals[key];
            const { grade, color } = getGrade(value);

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-secondary tracking-wide">
                    {label.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9px] font-black px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: `${color}20`,
                        color: color,
                      }}
                    >
                      {grade}
                    </span>
                    <span className="text-xs font-black text-text-primary w-6 text-right">
                      {value}
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${value}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
