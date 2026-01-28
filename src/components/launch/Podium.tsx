'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PodiumWinner {
  rank: number;
  username: string;
  avatarUrl?: string;
  title: string;
  description?: string;
  weightedScore: number;
  demoUrl?: string;
  launchId?: string;
  tierIcon?: string;
  tierName?: string;
}

interface PodiumProps {
  winners: PodiumWinner[];
  weekNumber?: string;
  showAnimation?: boolean;
  onViewProject?: (winner: PodiumWinner) => void;
  className?: string;
}

// Podium position configs
const PODIUM_CONFIG = {
  1: {
    order: 2, // Center position in flex
    height: 'h-40',
    bgGradient: 'from-yellow-600/30 via-yellow-500/20 to-amber-600/30',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-400',
    medal: '🥇',
    labelBg: 'bg-yellow-500/20',
    glowClass: 'shadow-yellow-500/30',
  },
  2: {
    order: 1, // Left position
    height: 'h-32',
    bgGradient: 'from-zinc-500/30 via-zinc-400/20 to-slate-500/30',
    borderColor: 'border-zinc-400/50',
    textColor: 'text-zinc-300',
    medal: '🥈',
    labelBg: 'bg-zinc-500/20',
    glowClass: 'shadow-zinc-400/20',
  },
  3: {
    order: 3, // Right position
    height: 'h-28',
    bgGradient: 'from-amber-700/30 via-amber-600/20 to-orange-700/30',
    borderColor: 'border-amber-600/50',
    textColor: 'text-amber-500',
    medal: '🥉',
    labelBg: 'bg-amber-600/20',
    glowClass: 'shadow-amber-500/20',
  },
} as const;

// Deterministic pseudo-random based on index (stable across renders)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Confetti component (simple CSS-based)
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            left: `${seededRandom(i) * 100}%`,
            top: `-10px`,
            backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][i % 6],
            animationDelay: `${seededRandom(i + 100) * 2}s`,
            animationDuration: `${2 + seededRandom(i + 200) * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

// Gold particle effect for 1st place
function GoldParticles({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-yellow-400 animate-float-particle"
          style={{
            left: `${20 + seededRandom(i + 300) * 60}%`,
            bottom: '0',
            animationDelay: `${seededRandom(i + 400) * 3}s`,
            animationDuration: `${3 + seededRandom(i + 500) * 2}s`,
            opacity: 0.6 + seededRandom(i + 600) * 0.4,
          }}
        />
      ))}
    </div>
  );
}

// Individual podium stand - wrapped with memo for performance
const PodiumStand = memo(function PodiumStand({ winner, showAnimation, onViewProject }: {
  winner: PodiumWinner;
  showAnimation: boolean;
  onViewProject?: (winner: PodiumWinner) => void;
}) {
  const [revealed, setRevealed] = useState(!showAnimation);

  const config = PODIUM_CONFIG[winner.rank as 1 | 2 | 3];

  useEffect(() => {
    if (showAnimation && config) {
      // Stagger reveal by rank (3rd, 2nd, 1st)
      const delay = winner.rank === 1 ? 2000 : winner.rank === 2 ? 1000 : 0;
      const timer = setTimeout(() => setRevealed(true), delay);
      return () => clearTimeout(timer);
    }
  }, [showAnimation, winner.rank, config]);

  if (!config) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center transition-all duration-700",
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ order: config.order }}
    >
      {/* Winner info card */}
      <div className={cn(
        "relative mb-2 p-4 rounded-xl text-center transition-all duration-500",
        "bg-gradient-to-b",
        config.bgGradient,
        "border",
        config.borderColor,
        "shadow-lg",
        config.glowClass,
        winner.rank === 1 && "scale-105"
      )}>
        {/* Gold particles for 1st place */}
        {winner.rank === 1 && <GoldParticles show={revealed} />}

        {/* Medal */}
        <div className="text-4xl mb-2">{config.medal}</div>

        {/* Avatar */}
        <div className="relative mx-auto mb-2">
          {winner.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={winner.avatarUrl}
              alt={`${winner.username}'s avatar`}
              className={cn(
                "w-16 h-16 rounded-full border-2",
                config.borderColor
              )}
              width={64}
              height={64}
              loading="lazy"
            />
          ) : (
            <div className={cn(
              "w-16 h-16 rounded-full border-2 flex items-center justify-center",
              "bg-bg-tertiary",
              config.borderColor
            )}>
              <span className="text-2xl">{(winner.username?.[0] || '?').toUpperCase()}</span>
            </div>
          )}
          {/* Tier badge */}
          {winner.tierIcon && (
            <span
              className="absolute -bottom-1 -right-1 text-lg"
              title={winner.tierName}
            >
              {winner.tierIcon}
            </span>
          )}
        </div>

        {/* Project title */}
        <h3 className={cn("font-bold text-sm truncate max-w-[140px]", config.textColor)}>
          {winner.title}
        </h3>

        {/* Username */}
        <Link
          href={`/analyze/${winner.username}`}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          @{winner.username}
        </Link>

        {/* Score */}
        <div className="mt-2 text-lg font-bold text-text-primary font-variant-numeric tabular-nums">
          {winner.weightedScore}
          <span className="text-xs text-text-muted ml-1">pts</span>
        </div>

        {/* View button */}
        {(winner.demoUrl || onViewProject) && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              if (onViewProject) {
                onViewProject(winner);
              } else if (winner.demoUrl) {
                window.open(winner.demoUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            View Project
          </Button>
        )}
      </div>

      {/* Podium base */}
      <div className={cn(
        "w-full sm:w-28 max-w-[140px] rounded-t-lg",
        "bg-gradient-to-b from-bg-elevated to-bg-tertiary",
        "border-t border-l border-r border-border",
        config.height,
        "flex items-start justify-center pt-2"
      )}>
        <span className={cn("text-3xl font-bold", config.textColor)}>
          #{winner.rank}
        </span>
      </div>
    </div>
  );
});

export function Podium({ winners, weekNumber, showAnimation = false, onViewProject, className }: PodiumProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Sort winners by rank
  const sortedWinners = [...winners].sort((a, b) => a.rank - b.rank).slice(0, 3);

  // Trigger confetti after all reveals
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowConfetti(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  if (sortedWinners.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <p className="text-text-muted">No winners yet this week.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <Confetti show={showConfetti} />

      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>Weekly Podium</span>
          {weekNumber && (
            <span className="text-sm font-normal text-text-muted">
              {weekNumber}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Podium display */}
        <div className="flex flex-col sm:flex-row justify-center items-center sm:items-end gap-6 sm:gap-4 pt-4 pb-8">
          {sortedWinners.map((winner) => (
            <PodiumStand
              key={winner.rank}
              winner={winner}
              showAnimation={showAnimation}
              onViewProject={onViewProject}
            />
          ))}
        </div>

        {/* Placeholder stands for missing positions */}
        {sortedWinners.length < 3 && (
          <p className="text-center text-sm text-text-muted mt-4">
            More spots available! Submit your launch to compete.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// CSS for animations (add to globals.css or inline)
export const podiumAnimationStyles = `
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(720deg);
    opacity: 0;
  }
}

@keyframes float-particle {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(0);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti 3s ease-out forwards;
}

.animate-float-particle {
  animation: float-particle 4s ease-out infinite;
}
`;
