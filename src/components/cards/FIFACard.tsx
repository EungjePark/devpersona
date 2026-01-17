'use client';

import Image from 'next/image';
import { type SignalScores, type Tier, type ArchetypeId } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

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

const ARCHETYPE_ABBREVIATIONS: Record<ArchetypeId, string> = {
  maintainer: 'MTN',
  silent_builder: 'BLD',
  prototype_machine: 'PTM',
  specialist: 'SPC',
  hype_surfer: 'HYP',
  archivist: 'ARC',
  comeback_kid: 'CBK',
  ghost: 'GST',
};

const CARD_STYLES: Record<string, {
  borderGradient: string;
  bgGradient: string;
  innerBorder: string;
  textColor: string;
  accentColor: string;
  textureOpacity: number;
}> = {
  S: { // Legendary (Gold)
    borderGradient: 'from-[#ffd700] via-[#fbf3c8] to-[#b45309]',
    bgGradient: 'linear-gradient(to bottom, #d6ad60, #f4e4bc, #b08d55)',
    innerBorder: 'from-[#b45309] via-[#854d0e] to-[#ffd700]',
    textColor: '#451a03',
    accentColor: '#b45309',
    textureOpacity: 0.1,
  },
  A: { // Epic (Purple)
    borderGradient: 'from-[#e879f9] via-[#f5d0fe] to-[#7e22ce]',
    bgGradient: 'linear-gradient(to bottom, #a28ce0, #d8b4fe, #7e22ce)',
    innerBorder: 'from-[#6b21a8] via-[#581c87] to-[#e879f9]',
    textColor: '#3b0764',
    accentColor: '#6b21a8',
    textureOpacity: 0.15,
  },
  B: { // Rare (Blue)
    borderGradient: 'from-[#38bdf8] via-[#bae6fd] to-[#0369a1]',
    bgGradient: 'linear-gradient(to bottom, #60a5fa, #bfdbfe, #2563eb)',
    innerBorder: 'from-[#1e40af] via-[#1e3a8a] to-[#38bdf8]',
    textColor: '#0c4a6e',
    accentColor: '#0369a1',
    textureOpacity: 0.12,
  },
  C: { // Common (Silver)
    borderGradient: 'from-[#d1d5db] via-[#f3f4f6] to-[#4b5563]',
    bgGradient: 'linear-gradient(to bottom, #9ca3af, #e5e7eb, #6b7280)',
    innerBorder: 'from-[#374151] via-[#1f2937] to-[#d1d5db]',
    textColor: '#1f2937',
    accentColor: '#374151',
    textureOpacity: 0.08,
  },
};

// Map signals to FIFA-style stats
// PAC (Pace) -> GRIND (Speed/Consistency)
// SHO (Shooting) -> BOOM (Impact)
// PAS (Passing) -> CLOUT (Connection/Influence)
// DRI (Dribbling) -> SHINE (Flair/Creativity)
// DEF (Defending) -> DEPTH (Technical/Deep knowledge)
// PHY (Physical) -> VIBE (Endurance/Culture)

export function FIFACard({
  username,
  avatarUrl,
  signals,
  overallRating,
  tier,
  archetypeId,
  rank,
  className,
}: FIFACardProps) {
  const archetypeCode = ARCHETYPE_ABBREVIATIONS[archetypeId] ?? 'DEV';
  const style = CARD_STYLES[tier.level] ?? CARD_STYLES.C;

  // Stats for the bottom grid
  const stats = useMemo(() => [
    { label: 'GRI', value: signals.grit },
    { label: 'DEP', value: signals.focus },
    { label: 'SHI', value: signals.craft },
    { label: 'BOO', value: signals.impact },
    { label: 'VIB', value: signals.voice },
    { label: 'CLO', value: signals.reach },
  ], [signals]);

  return (
    <div className={cn("relative mx-auto group", className)} style={{ width: '320px' }}>
      {/* 
        FIFA Card Shape Container 
      */}
      <div
        className={cn(
          "relative w-full aspect-[2/3] p-1.5 shadow-2xl transition-all duration-300",
          `bg-gradient-to-b ${style.borderGradient}`
        )}
        style={{
          clipPath: 'polygon(20% 0, 80% 0, 100% 15%, 100% 75%, 50% 100%, 0 75%, 0 15%)',
        }}
      >
        {/* Inner Border/Frame */}
        <div
          className={cn(
            "w-full h-full p-0.5",
            `bg-gradient-to-br ${style.innerBorder}`
          )}
          style={{
            clipPath: 'polygon(20% 0, 80% 0, 100% 15%, 100% 75%, 50% 100%, 0 75%, 0 15%)',
          }}
        >
          {/* Main Content Area */}
          <div
            className="w-full h-full relative"
            style={{
              background: style.bgGradient,
              clipPath: 'polygon(20% 0, 80% 0, 100% 15%, 100% 75%, 50% 100%, 0 75%, 0 15%)',
            }}
          >
            {/* Pattern Overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 8px)`,
                opacity: style.textureOpacity,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Top Shine */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/40 to-transparent mix-blend-soft-light" />

            {/* Top Info Section */}
            <div className="absolute top-8 left-6 flex flex-col items-center z-20">
              <span className="text-5xl font-black tracking-tighter leading-none" style={{ color: style.textColor }}>{overallRating}</span>
              <span className="text-lg font-bold uppercase mt-1" style={{ color: style.textColor }}>{archetypeCode}</span>

              {/* Divider Line */}
              <div className="w-8 h-0.5 my-2 opacity-40" style={{ backgroundColor: style.textColor }} />

              {/* Tier Logo/Icon Placeholder */}
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center" style={{ borderColor: style.textColor, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <span className="text-sm font-bold" style={{ color: style.textColor }}>{tier.level}</span>
              </div>
            </div>

            {/* Player Image */}
            <div className="absolute top-6 right-4 w-[180px] h-[180px] z-10">
              <Image
                src={avatarUrl}
                alt={username}
                fill
                className="object-cover drop-shadow-xl scale-110 group-hover:scale-115 transition-transform duration-500"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                }}
                unoptimized
              />
            </div>

            {/* Name Plate */}
            <div className="absolute top-[55%] left-0 w-full flex flex-col items-center z-20">
              <div className="w-[85%] text-center border-b-2 pb-1 mb-2" style={{ borderColor: `${style.textColor}40` }}>
                <h2 className="text-2xl font-black uppercase tracking-tight truncate px-2 drop-shadow-sm" style={{ color: style.textColor }}>{username}</h2>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-[80%] mx-auto">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-lg font-black" style={{ color: style.textColor }}>{stat.value}</span>
                    <span className="text-sm font-bold uppercase opacity-80" style={{ color: style.textColor }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Decor */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4 opacity-50">
              <div className="w-1 h-3" style={{ backgroundColor: style.textColor }} />
              <div className="w-1 h-3" style={{ backgroundColor: style.textColor }} />
              <div className="w-1 h-3" style={{ backgroundColor: style.textColor }} />
            </div>

          </div>
        </div>
      </div>

      {/* Rank Badge (Floating) */}
      {rank && (
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-30">
          <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold border-2 shadow-lg" style={{ borderColor: style.accentColor }}>
            #{rank}
          </div>
        </div>
      )}
    </div>
  );
}
