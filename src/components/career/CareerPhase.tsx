'use client';

import { memo, useMemo } from 'react';
import type { TierLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

export type CareerLevel = 'junior' | 'mid' | 'senior' | 'staff' | 'principal';

interface CareerPhaseProps {
  overallRating: number;
  tier: TierLevel;
  tierColor: string;
  accountAge: number; // in years
  totalRepos: number;
  totalContributions: number;
}

interface PhaseInfo {
  level: CareerLevel;
  name: string;
  minRating: number;
  emoji: string;
  description: string;
}

const CAREER_PHASES: PhaseInfo[] = [
  { level: 'junior', name: 'Junior Dev', minRating: 0, emoji: '🌱', description: 'Learning the ropes' },
  { level: 'mid', name: 'Mid-Level', minRating: 40, emoji: '🌿', description: 'Building expertise' },
  { level: 'senior', name: 'Senior', minRating: 60, emoji: '🌳', description: 'Leading projects' },
  { level: 'staff', name: 'Staff', minRating: 80, emoji: '🏔️', description: 'Shaping architecture' },
  { level: 'principal', name: 'Principal', minRating: 92, emoji: '⭐', description: 'Industry leader' },
];

export const CareerPhase = memo(function CareerPhase({
  overallRating,
  tier: _tier, // Reserved for future phase-tier correlation
  tierColor,
  accountAge,
  totalRepos,
  totalContributions: _totalContributions, // Reserved for activity-based phase calculation
}: CareerPhaseProps) {
  void _tier;
  void _totalContributions;
  // Determine current career phase
  const currentPhase = useMemo(() => {
    for (let i = CAREER_PHASES.length - 1; i >= 0; i--) {
      if (overallRating >= CAREER_PHASES[i].minRating) {
        return CAREER_PHASES[i];
      }
    }
    return CAREER_PHASES[0];
  }, [overallRating]);

  // Calculate progress to next phase
  const progressInfo = useMemo(() => {
    const currentIndex = CAREER_PHASES.findIndex(p => p.level === currentPhase.level);
    const nextPhase = CAREER_PHASES[currentIndex + 1];

    if (!nextPhase) {
      return { progress: 100, nextPhase: null, pointsToNext: 0 };
    }

    const rangeStart = currentPhase.minRating;
    const rangeEnd = nextPhase.minRating;
    const progress = ((overallRating - rangeStart) / (rangeEnd - rangeStart)) * 100;
    const pointsToNext = rangeEnd - overallRating;

    return { progress: Math.min(100, progress), nextPhase, pointsToNext };
  }, [currentPhase, overallRating]);

  return (
    <div className="space-y-6">
      {/* Current Phase Display */}
      <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5">
        <div className="text-5xl mb-3">{currentPhase.emoji}</div>
        <div
          className="text-2xl font-bold mb-1"
          style={{ color: tierColor }}
        >
          {currentPhase.name}
        </div>
        <div className="text-sm text-text-muted">{currentPhase.description}</div>
      </div>

      {/* Career progression bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          {CAREER_PHASES.map((phase) => {
            const isCurrentOrPast = overallRating >= phase.minRating;
            const isCurrent = phase.level === currentPhase.level;

            return (
              <div
                key={phase.level}
                className={cn(
                  'flex flex-col items-center transition-all',
                  isCurrent ? 'scale-110' : 'scale-100'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all',
                    isCurrentOrPast
                      ? 'border-transparent'
                      : 'border-white/10 bg-white/5'
                  )}
                  style={isCurrentOrPast ? {
                    backgroundColor: `${tierColor}30`,
                    borderColor: tierColor,
                  } : undefined}
                >
                  {phase.emoji}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-1 transition-colors',
                    isCurrent ? 'text-white font-bold' : 'text-text-muted'
                  )}
                >
                  {phase.minRating}+
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar between phases */}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(overallRating / 100) * 100}%`,
              background: `linear-gradient(90deg, ${tierColor}50, ${tierColor})`,
            }}
          />
        </div>

        {/* Next phase info */}
        {progressInfo.nextPhase && (
          <div className="text-center text-sm text-text-muted">
            <span className="text-white font-medium">{progressInfo.pointsToNext}</span> points to{' '}
            <span style={{ color: tierColor }}>{progressInfo.nextPhase.name}</span>
          </div>
        )}
      </div>

      {/* Career stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] text-center">
          <div className="text-lg font-bold text-white">{accountAge}y</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Experience</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] text-center">
          <div className="text-lg font-bold text-white">{totalRepos}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Projects</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] text-center">
          <div className="text-lg font-bold" style={{ color: tierColor }}>{overallRating}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">OVR</div>
        </div>
      </div>
    </div>
  );
});
