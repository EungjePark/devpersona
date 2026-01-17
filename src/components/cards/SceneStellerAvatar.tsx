"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import Image from "next/image";
import { Sparkles, Users, Star } from "lucide-react";
import {
  fetchSceneStellerGallery,
  getSceneStellerShareUrl,
  getSceneStellerStudioUrl,
  type SceneStellerImage,
} from "@/lib/scenesteller/client";
import { SHOWCASE_IMAGES, getShowcaseImageUrl } from "@/lib/scenesteller/showcase-data";
import type { SignalScores, TierLevel } from "@/lib/types";
import { TIERS } from "@/lib/types";

interface SceneStellerAvatarProps {
  userId: string;
  username?: string;
  avatarUrl?: string;      // GitHub avatar
  bio?: string | null;     // GitHub bio
  followers?: number;      // GitHub followers
  tier?: TierLevel;
  tierColor?: string;
  archetypeId?: string;
  archetypeName?: string;
  overallRating?: number;
  signals?: SignalScores;
  rank?: number | null;
  totalStars?: number;     // Total GitHub stars
  className?: string;
}

// Get a showcase image matching the user's tier
function getShowcaseByTier(tier: string | undefined, userId: string) {
  const tierImages = SHOWCASE_IMAGES.filter(img => img.tier === tier);
  const candidates = tierImages.length > 0 ? tierImages : SHOWCASE_IMAGES;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % candidates.length;
  return candidates[index];
}

// Card style tokens by tier
const CARD_STYLES: Record<TierLevel, {
  borderGradient: string;
  bgGradient: string;
  textColor: string;
  accentGlow: string;
  avatarRing: string;
}> = {
  S: {
    borderGradient: 'from-amber-400 via-yellow-200 to-amber-600',
    bgGradient: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(180,83,9,0.1) 100%)',
    textColor: '#fcd34d',
    accentGlow: 'rgba(251,191,36,0.4)',
    avatarRing: 'ring-amber-400',
  },
  A: {
    borderGradient: 'from-purple-400 via-fuchsia-200 to-purple-600',
    bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(126,34,206,0.1) 100%)',
    textColor: '#c084fc',
    accentGlow: 'rgba(168,85,247,0.4)',
    avatarRing: 'ring-purple-400',
  },
  B: {
    borderGradient: 'from-blue-400 via-sky-200 to-blue-600',
    bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%)',
    textColor: '#60a5fa',
    accentGlow: 'rgba(59,130,246,0.4)',
    avatarRing: 'ring-blue-400',
  },
  C: {
    borderGradient: 'from-zinc-400 via-zinc-200 to-zinc-600',
    bgGradient: 'linear-gradient(135deg, rgba(113,113,122,0.15) 0%, rgba(63,63,70,0.1) 100%)',
    textColor: '#a1a1aa',
    accentGlow: 'rgba(113,113,122,0.3)',
    avatarRing: 'ring-zinc-400',
  },
};

// Short stat labels
const STAT_LABELS: Record<keyof SignalScores, string> = {
  grit: 'GRI',
  focus: 'FOC',
  craft: 'CRA',
  impact: 'IMP',
  voice: 'VOI',
  reach: 'REA',
};

/**
 * SceneStellerAvatar - FIFA-style profile card with SceneSteller AI art + GitHub profile
 */
export function SceneStellerAvatar({
  userId,
  username,
  avatarUrl,
  bio,
  followers,
  tier = 'C',
  tierColor,
  archetypeId,
  archetypeName,
  overallRating,
  signals,
  rank,
  totalStars,
  className = "",
}: SceneStellerAvatarProps): ReactNode {
  const [latestImage, setLatestImage] = useState<SceneStellerImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const showcaseImage = useMemo(() => getShowcaseByTier(tier, userId), [tier, userId]);
  const cardStyle = CARD_STYLES[tier] ?? CARD_STYLES.C;
  const tierInfo = TIERS[tier] ?? TIERS.C;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadLatestImage(): Promise<void> {
      setLoading(true);
      setError(false);
      try {
        const images = await fetchSceneStellerGallery(userId, 10);
        if (images.length > 0) {
          const sorted = [...images].sort((a, b) => b.createdAt - a.createdAt);
          setLatestImage(sorted[0]);
        } else {
          setLatestImage(null);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadLatestImage();
  }, [userId]);

  const studioUrl = useMemo(() => {
    const baseUrl = getSceneStellerStudioUrl();
    const params = new URLSearchParams();
    if (username) params.set("github", username);
    if (tier) params.set("tier", tier);
    if (archetypeId) params.set("archetype", archetypeId);
    if (archetypeName) params.set("archetypeName", archetypeName);
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [username, tier, archetypeId, archetypeName]);

  // Loading state
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="aspect-[3/4] rounded-2xl bg-zinc-900/50 border border-white/5 animate-pulse" />
      </div>
    );
  }

  const hasUserImage = !error && latestImage?.imageUrl;
  const displayImageUrl: string = hasUserImage && latestImage.imageUrl
    ? latestImage.imageUrl
    : getShowcaseImageUrl(showcaseImage.filename);
  const linkUrl = hasUserImage && latestImage
    ? getSceneStellerShareUrl(latestImage.shareId)
    : studioUrl;

  const finalTierColor = tierColor ?? tierInfo.color;

  // Format large numbers
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Card Container */}
      <div className="relative group">
        {/* Outer glow */}
        <div
          className="absolute -inset-2 rounded-3xl opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
          style={{
            background: cardStyle.bgGradient,
            boxShadow: `0 0 60px ${cardStyle.accentGlow}`
          }}
        />

        {/* Card Border */}
        <div className={`relative p-[2px] rounded-2xl bg-gradient-to-b ${cardStyle.borderGradient} shadow-2xl`}>
          {/* Inner Card */}
          <div className="relative rounded-[14px] overflow-hidden bg-zinc-950">

            {/* Background Art - Taller aspect ratio */}
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative aspect-[4/5]"
            >
              <Image
                src={displayImageUrl}
                alt={`${username ?? 'Developer'} Profile Art`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="400px"
                unoptimized={!!hasUserImage}
                priority
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/95" />

              {/* Pattern Overlay */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)`,
                }}
              />

              {/* Top Section - Rating & GitHub Avatar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
                {/* Left: Rating */}
                {overallRating !== undefined && (
                  <div className="flex flex-col items-center">
                    <span
                      className="text-5xl font-black leading-none drop-shadow-2xl"
                      style={{
                        color: finalTierColor,
                        textShadow: `0 0 40px ${cardStyle.accentGlow}, 0 2px 10px rgba(0,0,0,0.8)`
                      }}
                    >
                      {overallRating}
                    </span>
                    <span
                      className="text-xs font-bold uppercase mt-1 tracking-widest drop-shadow-lg"
                      style={{ color: cardStyle.textColor }}
                    >
                      {tierInfo.name}
                    </span>
                    <div
                      className="mt-2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black"
                      style={{
                        borderColor: finalTierColor,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: finalTierColor,
                      }}
                    >
                      {tier}
                    </div>
                  </div>
                )}

                {/* Right: GitHub Avatar + Rank */}
                <div className="flex flex-col items-end gap-2">
                  {avatarUrl && (
                    <div className={`relative w-14 h-14 rounded-full ring-2 ${cardStyle.avatarRing} ring-offset-2 ring-offset-black overflow-hidden shadow-xl`}>
                      <Image
                        src={avatarUrl}
                        alt={username ?? 'GitHub Avatar'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {rank && (
                    <div
                      className="px-2 py-1 rounded-full text-xs font-black border-2 bg-black/70"
                      style={{
                        borderColor: finalTierColor,
                        color: finalTierColor,
                      }}
                    >
                      #{rank}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Art Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-[9px] text-white/80 font-semibold">AI Art</span>
                </div>
              </div>
            </a>

            {/* Bottom Section - Profile Info */}
            <div className="p-4 bg-gradient-to-t from-black via-black/95 to-transparent -mt-16 relative z-10">
              {/* Username & Archetype */}
              {username && (
                <div className="text-center mb-3">
                  <h2
                    className="text-xl font-black uppercase tracking-tight truncate drop-shadow-lg"
                    style={{ color: '#fff' }}
                  >
                    {username}
                  </h2>
                  {archetypeName && (
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mt-0.5"
                      style={{ color: cardStyle.textColor }}
                    >
                      {archetypeName}
                    </p>
                  )}
                </div>
              )}

              {/* Bio */}
              {bio && (
                <p className="text-xs text-zinc-400 text-center line-clamp-2 mb-3 px-2">
                  {bio}
                </p>
              )}

              {/* GitHub Stats Row */}
              {(followers !== undefined || totalStars !== undefined) && (
                <div className="flex items-center justify-center gap-4 mb-3 py-2 border-y border-white/10">
                  {followers !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-sm font-bold text-white">{formatNumber(followers)}</span>
                      <span className="text-[10px] text-zinc-500 uppercase">followers</span>
                    </div>
                  )}
                  {totalStars !== undefined && totalStars > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm font-bold text-white">{formatNumber(totalStars)}</span>
                      <span className="text-[10px] text-zinc-500 uppercase">stars</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Grid - 2x3 */}
              {signals && (
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.entries(signals) as [keyof SignalScores, number][]).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-center gap-1 bg-white/5 rounded-lg py-1.5 px-1"
                    >
                      <span className="text-base font-black text-white">{value}</span>
                      <span
                        className="text-[9px] font-bold uppercase"
                        style={{ color: cardStyle.textColor }}
                      >
                        {STAT_LABELS[key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Powered by */}
      <div className="mt-3 text-center">
        <span className="text-[10px] text-zinc-600 tracking-wider uppercase">Powered by SceneSteller</span>
      </div>
    </div>
  );
}
