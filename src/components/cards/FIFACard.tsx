'use client';

import Image from 'next/image';
import { type SignalScores, type Tier, type ArchetypeId } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FIFACardProps {
  username: string;
  avatarUrl: string;
  signals: SignalScores;
  overallRating: number;
  tier: Tier;
  archetypeId: ArchetypeId;
  archetypeName: string;
  roast: string;
  rank?: number | null;
  className?: string;
}

const TIER_STYLES: Record<string, string> = {
  S: 'card-legendary',
  A: 'card-epic',
  B: 'card-rare',
  C: 'card-common',
};

const TIER_BG_COLORS: Record<string, string> = {
  S: '#d97706', // Amber 600
  A: '#9333ea', // Purple 600
  B: '#2563eb', // Blue 600
  C: '#52525b', // Zinc 600
};

// Full archetype names for display
const ARCHETYPE_DISPLAY: Record<ArchetypeId, { abbrev: string; full: string }> = {
  maintainer: { abbrev: 'MTN', full: 'The Maintainer' },
  silent_builder: { abbrev: 'SLB', full: 'Silent Builder' },
  prototype_machine: { abbrev: 'PTM', full: 'Prototype Machine' },
  specialist: { abbrev: 'SPC', full: 'The Specialist' },
  hype_surfer: { abbrev: 'HYP', full: 'Hype Surfer' },
  archivist: { abbrev: 'ARC', full: 'The Archivist' },
  comeback_kid: { abbrev: 'CBK', full: 'Comeback Kid' },
  ghost: { abbrev: 'GHT', full: 'Ghost Developer' },
};

export function FIFACard({
  username,
  avatarUrl,
  // signals prop accepted for API compatibility but displayed via overallRating
  signals: _signals = {} as SignalScores,
  overallRating,
  tier,
  archetypeId,
  archetypeName,
  roast,
  rank,
  className,
}: FIFACardProps) {
  // Suppress unused variable warning - signals available for future enhancements
  void _signals;
  const tierStyle = TIER_STYLES[tier.level] ?? TIER_STYLES.C;
  const tierColor = TIER_BG_COLORS[tier.level] ?? '#52525b';
  const archetype = ARCHETYPE_DISPLAY[archetypeId] ?? { abbrev: 'DEV', full: archetypeName };

  return (
    <div
      className={cn(
        'relative w-full max-w-[500px] rounded-3xl p-[1px]', // Thinner organic border
        tierStyle,
        className
      )}
    >
      {/* Inner card surface using new glass tokens */}
      <div className="relative rounded-[23px] bg-bg-secondary/95 backdrop-blur-xl p-6 md:p-8 overflow-hidden h-full flex flex-col justify-between min-h-[500px]">

        {/* Subtle top sheen */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Dynamic Background Glow based on Tier */}
        <div
          className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] opacity-[0.08] blur-[100px] pointer-events-none rounded-full mix-blend-screen"
          style={{ backgroundColor: tierColor }}
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] opacity-[0.05] blur-[80px] pointer-events-none rounded-full mix-blend-screen"
          style={{ backgroundColor: tierColor }}
        />

        {/* --- Top Bar: Rank & Tier --- */}
        <div className="flex justify-between items-center relative z-10 w-full mb-6">
          {rank ? (
            <div className="px-3 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
              <span className="text-xs font-medium text-text-secondary">#{rank} Global</span>
            </div>
          ) : <div />}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tierColor }} />
            <span className="text-xs font-bold tracking-wide uppercase" style={{ color: tierColor }}>{tier.name}</span>
          </div>
        </div>

        {/* --- Center: Hero Section --- */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 mb-8">
          {/* OVR Rating with Glow */}
          <div className="relative mb-6 group">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" style={{ backgroundColor: tierColor }} />
            <div className="relative w-32 h-32 flex flex-col items-center justify-center rounded-full bg-bg-tertiary border-4 border-bg-secondary shadow-2xl"
              style={{ borderColor: `${tierColor}40` }}>
              <span className="text-6xl font-black tracking-tighter leading-none" style={{ color: tierColor }}>
                {overallRating}
              </span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">OVR</span>
            </div>
          </div>

          {/* Avatar */}
          <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl p-[3px] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 ease-out"
            style={{ background: `linear-gradient(135deg, ${tierColor}, ${tierColor}20)` }}>
            <div className="w-full h-full rounded-[13px] overflow-hidden bg-bg-primary relative">
              <Image
                src={avatarUrl}
                alt={username}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {/* Tier Badge */}
            <div
              className="absolute -bottom-4 -right-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-bg-secondary"
              style={{ backgroundColor: tierColor }}
            >
              <span className="text-xl font-black text-white">{tier.level}</span>
            </div>
          </div>
        </div>

        {/* --- Footer: Identity --- */}
        <div className="text-center relative z-10 space-y-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">@{username}</h2>
            <p className="text-lg font-medium text-text-secondary opacity-80">{archetype.full}</p>
          </div>

          {/* Analyst Note (Roast) */}
          <div className="bg-bg-tertiary/30 rounded-xl p-4 border border-white/5 backdrop-blur-sm mx-2">
            <p className="text-sm text-text-muted italic leading-relaxed">
              &ldquo;{roast}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
