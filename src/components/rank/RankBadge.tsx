'use client';

import { cn } from '@/lib/utils';
import type { BuilderTierLevel } from '@/lib/types';
import { BUILDER_TIERS } from '@/lib/types';

interface RankBadgeProps {
  tier: BuilderTierLevel;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showBackground?: boolean;
  className?: string;
}

// Background gradients by tier
const TIER_BACKGROUNDS: Record<BuilderTierLevel, string> = {
  0: '', // No background for Ground Control
  1: '', // No background for Cadet
  2: 'bg-gradient-to-br from-sky-500/20 via-blue-400/10 to-sky-600/20', // Clouds
  3: 'bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-green-500/30', // Earth
  4: 'bg-gradient-to-br from-indigo-900/40 via-purple-800/30 to-black/40', // Space
  5: 'bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-violet-600/40', // Nebula
  6: 'bg-gradient-to-br from-indigo-600/30 via-blue-500/20 to-purple-500/30', // Galaxy
  7: 'bg-gradient-to-br from-fuchsia-500/30 via-cyan-400/20 to-yellow-400/30 animate-shimmer', // Hologram
};

// Border colors by tier
const TIER_BORDERS: Record<BuilderTierLevel, string> = {
  0: 'border-zinc-600',
  1: 'border-zinc-500',
  2: 'border-sky-500/50',
  3: 'border-cyan-500/50',
  4: 'border-purple-500/50',
  5: 'border-pink-500/50',
  6: 'border-blue-400/50',
  7: 'border-fuchsia-400/50 shadow-fuchsia-500/30',
};

// Text colors by tier
const TIER_TEXT_COLORS: Record<BuilderTierLevel, string> = {
  0: 'text-zinc-400',
  1: 'text-zinc-300',
  2: 'text-sky-400',
  3: 'text-cyan-400',
  4: 'text-purple-400',
  5: 'text-pink-400',
  6: 'text-blue-300',
  7: 'text-fuchsia-300',
};

export function RankBadge({
  tier,
  size = 'md',
  showName = true,
  showBackground = false,
  className,
}: RankBadgeProps) {
  const tierInfo = BUILDER_TIERS[tier];

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5 gap-1',
    md: 'text-base px-3 py-1 gap-1.5',
    lg: 'text-lg px-4 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        sizeClasses[size],
        TIER_BORDERS[tier],
        showBackground && TIER_BACKGROUNDS[tier],
        !showBackground && "bg-bg-tertiary/50",
        tier === 7 && "shadow-lg",
        className
      )}
      title={`${tierInfo.name} - ${tierInfo.description}`}
    >
      <span className={iconSizes[size]} role="img" aria-label={tierInfo.name}>
        {tierInfo.icon}
      </span>
      {showName && (
        <span className={cn("font-medium", TIER_TEXT_COLORS[tier])}>
          {tierInfo.name}
        </span>
      )}
    </div>
  );
}

// Icon-only variant
interface TierIconProps {
  tier: BuilderTierLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function TierIcon({ tier, size = 'md', className }: TierIconProps) {
  const tierInfo = BUILDER_TIERS[tier];

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <span
      className={cn(sizeClasses[size], className)}
      title={tierInfo.name}
      role="img"
      aria-label={tierInfo.name}
    >
      {tierInfo.icon}
    </span>
  );
}

// Progress bar toward next tier
interface TierProgressProps {
  currentScore: number;
  currentTier: BuilderTierLevel;
  className?: string;
}

export function TierProgress({ currentScore, currentTier, className }: TierProgressProps) {
  const currentTierInfo = BUILDER_TIERS[currentTier];

  // Max tier check
  if (currentTier === 7) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Max Tier Achieved</span>
          <span className="text-fuchsia-400 font-medium">🌌 Cosmos</span>
        </div>
        <div className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-yellow-400 animate-shimmer" />
      </div>
    );
  }

  const nextTier = (currentTier + 1) as BuilderTierLevel;
  const nextTierInfo = BUILDER_TIERS[nextTier];

  const scoreRange = nextTierInfo.minScore - currentTierInfo.minScore;
  const scoreProgress = currentScore - currentTierInfo.minScore;
  const progressPercent = Math.min(100, Math.max(0, (scoreProgress / scoreRange) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          {currentTierInfo.icon} {currentTierInfo.name}
        </span>
        <span className="text-text-muted">
          {currentScore} / {nextTierInfo.minScore}
        </span>
        <span className={TIER_TEXT_COLORS[nextTier]}>
          {nextTierInfo.icon} {nextTierInfo.name}
        </span>
      </div>
      <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            TIER_BACKGROUNDS[nextTier] || "bg-primary-500"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-text-muted text-center">
        {nextTierInfo.minScore - currentScore} points to {nextTierInfo.name}
      </p>
    </div>
  );
}

// Full rank card with all info
interface RankCardProps {
  username: string;
  tier: BuilderTierLevel;
  shippingPoints: number;
  communityKarma: number;
  trustScore: number;
  tierScore: number;
  className?: string;
}

export function RankCard({
  username,
  tier,
  shippingPoints,
  communityKarma,
  trustScore,
  tierScore,
  className,
}: RankCardProps) {
  const tierInfo = BUILDER_TIERS[tier];

  return (
    <div className={cn(
      "rounded-xl border p-4",
      TIER_BORDERS[tier],
      TIER_BACKGROUNDS[tier] || "bg-bg-secondary",
      tier >= 6 && "shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <TierIcon tier={tier} size="xl" />
        <div>
          <h3 className="font-bold text-text-primary">@{username}</h3>
          <p className={cn("text-sm font-medium", TIER_TEXT_COLORS[tier])}>
            {tierInfo.name}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-bg-primary/50">
          <p className="text-lg font-bold text-text-primary font-variant-numeric tabular-nums">
            {shippingPoints}
          </p>
          <p className="text-xs text-text-muted">Shipping</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-bg-primary/50">
          <p className="text-lg font-bold text-text-primary font-variant-numeric tabular-nums">
            {communityKarma}
          </p>
          <p className="text-xs text-text-muted">Karma</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-bg-primary/50">
          <p className="text-lg font-bold text-text-primary font-variant-numeric tabular-nums">
            {trustScore}
          </p>
          <p className="text-xs text-text-muted">Trust</p>
        </div>
      </div>

      {/* Progress */}
      <TierProgress currentScore={tierScore} currentTier={tier} />

      {/* Privileges */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-text-muted mb-2">Privileges:</p>
        <div className="flex flex-wrap gap-1">
          {tierInfo.privileges.map((privilege, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-bg-primary/50 text-text-secondary"
            >
              {privilege}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
