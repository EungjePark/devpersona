'use client';

import { useState, useCallback, memo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import type { BuilderTierLevel } from '@/lib/types';
import { canVote, getVoteWeight } from '@/lib/builder-rank';

// Product type options
const PRODUCT_TYPES = [
  { id: 'painkiller', label: 'Painkiller', emoji: '💊', description: 'Must-have, solves real pain', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  { id: 'vitamin', label: 'Vitamin', emoji: '💚', description: 'Nice-to-have, good for health', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  { id: 'candy', label: 'Candy', emoji: '🍬', description: 'Fun but not essential', color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
] as const;

type ProductType = typeof PRODUCT_TYPES[number]['id'];

// Feedback weight multipliers
const FEEDBACK_WEIGHTS = {
  quickVote: 1,
  review: 3,
  verifiedReview: 5,
} as const;

interface VoteButtonProps {
  launchId: Id<"launches">;
  launchOwnerUsername: string;
  voterUsername: string;
  voterTier: BuilderTierLevel;
  demoUrl?: string;
  initialVoteCount?: number;
  initialWeightedScore?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'prominent';
  className?: string;
}

export const VoteButton = memo(function VoteButton({
  launchId,
  launchOwnerUsername,
  voterUsername,
  voterTier,
  demoUrl,
  initialVoteCount = 0,
  initialWeightedScore = 0,
  size = 'md',
  variant = 'default',
  className,
}: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticVoted, setOptimisticVoted] = useState<boolean | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Feedback form state
  const [feedbackText, setFeedbackText] = useState('');
  const [productTypeVote, setProductTypeVote] = useState<ProductType | null>(null);
  const [visitedAt, setVisitedAt] = useState<number | null>(null);

  const castVote = useMutation(api.launches.castVote);
  const removeVote = useMutation(api.launches.removeVote);
  const hasVoted = useQuery(api.launches.hasVoted, { launchId, voterUsername });
  const voteInfo = useQuery(api.launches.getVoteCount, { launchId });

  const voted = optimisticVoted !== null ? optimisticVoted : hasVoted;
  const voteCount = voteInfo?.count ?? initialVoteCount;
  const weightedScore = voteInfo?.weightedScore ?? initialWeightedScore;

  const baseVoteWeight = getVoteWeight(voterTier);
  const canUserVote = canVote(voterTier);
  const isSelfVote = launchOwnerUsername === voterUsername;

  // Calculate feedback multiplier
  const getFeedbackMultiplier = useCallback(() => {
    const hasReview = feedbackText.trim().length >= 50;
    const isVerified = visitedAt && (Date.now() - visitedAt >= 10 * 60 * 1000);
    if (hasReview && isVerified) return FEEDBACK_WEIGHTS.verifiedReview;
    if (hasReview) return FEEDBACK_WEIGHTS.review;
    return FEEDBACK_WEIGHTS.quickVote;
  }, [feedbackText, visitedAt]);

  const effectiveWeight = baseVoteWeight * getFeedbackMultiplier();

  // Track demo visit
  const handleDemoClick = useCallback(() => {
    if (demoUrl && !visitedAt) {
      setVisitedAt(Date.now());
      window.open(demoUrl, '_blank');
    }
  }, [demoUrl, visitedAt]);


  const handleVote = useCallback(async (quick = false) => {
    setError(null);

    if (!canUserVote) {
      setError('Sign in to vote');
      return;
    }

    if (isSelfVote) {
      setError("Can't vote for yourself");
      return;
    }

    setIsVoting(true);

    try {
      if (voted) {
        setOptimisticVoted(false);
        await removeVote({ launchId, voterUsername });
        setShowPanel(false);
        setFeedbackText('');
        setProductTypeVote(null);
      } else {
        setOptimisticVoted(true);
        const returnedAt = Date.now();
        await castVote({
          launchId,
          voterUsername,
          feedbackText: quick ? undefined : (feedbackText.trim() || undefined),
          productTypeVote: quick ? undefined : (productTypeVote || undefined),
          visitedAt: visitedAt || undefined,
          returnedAt: visitedAt ? returnedAt : undefined,
        });
        setShowPanel(false);
      }
    } catch (err) {
      setOptimisticVoted(null);
      setError(err instanceof Error ? err.message : 'Vote failed');
    } finally {
      setIsVoting(false);
    }
  }, [canUserVote, isSelfVote, voted, launchId, voterUsername, feedbackText, productTypeVote, visitedAt, castVote, removeVote]);

  const isDisabled = isVoting || !canUserVote || isSelfVote;

  const sizeStyles = {
    sm: 'w-12',
    md: 'w-14',
    lg: 'w-16',
  };

  // ============================================
  // Prominent Variant (ProductHunt Style)
  // ============================================
  if (variant === 'prominent') {
    return (
      <div className={cn("relative", className)}>
        {/* Main Vote Button - ProductHunt Style */}
        <button
          onClick={() => {
            if (voted) {
              handleVote();
            } else if (!isDisabled) {
              setShowPanel(!showPanel);
            }
          }}
          disabled={isDisabled}
          className={cn(
            "w-full py-4 px-6 rounded-xl font-semibold transition-all",
            "flex items-center justify-center gap-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
            voted
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              : "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]",
            isDisabled && !voted && "opacity-50 cursor-not-allowed hover:scale-100",
            isVoting && "animate-pulse"
          )}
        >
          {isVoting ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : voted ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Upvoted</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <span>Upvote</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm tabular-nums">
                {weightedScore}
              </span>
            </>
          )}
        </button>

        {/* Feedback Panel - Prominent */}
        {showPanel && !voted && (
          <div className="absolute top-full left-0 right-0 mt-3 z-50 animate-in slide-in-from-top-2 fade-in duration-150">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-white">Add your feedback</h4>
                <button
                  onClick={() => setShowPanel(false)}
                  aria-label="Close feedback panel"
                  className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Product Type */}
              <div className="mb-4" role="group" aria-labelledby={`prominent-product-type-${launchId}`}>
                <span id={`prominent-product-type-${launchId}`} className="block text-sm text-zinc-400 mb-3">What type of product is this?</span>
                <div className="grid grid-cols-3 gap-3">
                  {PRODUCT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setProductTypeVote(productTypeVote === type.id ? null : type.id)}
                      title={type.description}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                        productTypeVote === type.id
                          ? cn(type.bg, type.border, type.color, "scale-105")
                          : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600"
                      )}
                    >
                      <span className="text-2xl">{type.emoji}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Visit */}
              {demoUrl && (
                <div className="mb-4">
                  <button
                    onClick={handleDemoClick}
                    disabled={!!visitedAt}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      visitedAt
                        ? "bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 hover:text-white"
                    )}
                  >
                    {visitedAt ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Demo visited — 5x vote weight!</span>
                      </>
                    ) : (
                      <>
                        <span>🌐</span>
                        <span>Try the demo first (5x weight)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Feedback Text */}
              <div className="mb-4">
                <label htmlFor={`prominent-feedback-${launchId}`} className="flex items-center justify-between text-sm text-zinc-400 mb-2">
                  <span>Your feedback (3x weight for 50+ chars)</span>
                  <span className={cn(
                    "tabular-nums",
                    feedbackText.length >= 50 ? "text-emerald-400 font-medium" : ""
                  )}>
                    {feedbackText.length}/50
                  </span>
                </label>
                <textarea
                  id={`prominent-feedback-${launchId}`}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What did you like? Any suggestions for improvement?…"
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-sm resize-none",
                    "bg-zinc-800 border-2 border-zinc-700",
                    "text-white placeholder:text-zinc-500",
                    "focus:outline-none focus:border-violet-500/50",
                    "transition-colors",
                    feedbackText.length >= 50 && "border-emerald-500/30"
                  )}
                />
              </div>

              {/* Weight Preview */}
              <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                <span className="text-sm text-zinc-300">Your vote power:</span>
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  +{effectiveWeight} pts
                </span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleVote(true)}
                  disabled={isVoting}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    "bg-zinc-800 border border-zinc-700 text-zinc-300",
                    "hover:bg-zinc-700 hover:text-white",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                    "disabled:opacity-50"
                  )}
                >
                  Quick Vote (+{baseVoteWeight})
                </button>
                <button
                  onClick={() => handleVote(false)}
                  disabled={isVoting}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                    "bg-gradient-to-r from-orange-500 to-rose-500 text-white",
                    "hover:from-orange-400 hover:to-rose-400 hover:shadow-lg hover:shadow-orange-500/20",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                    "disabled:opacity-50"
                  )}
                >
                  {isVoting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Voting…
                    </span>
                  ) : (
                    `Submit (+${effectiveWeight})`
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && !showPanel && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // Default Variant (Compact)
  // ============================================
  return (
    <div className={cn("relative", sizeStyles[size], className)}>
      {/* Vote Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => {
            if (voted) {
              handleVote();
            } else if (!isDisabled) {
              setShowPanel(!showPanel);
            }
          }}
          disabled={isDisabled}
          title={
            !canUserVote ? 'Sign in to vote' :
            isSelfVote ? "Can't vote for yourself" :
            voted ? 'Click to remove vote' :
            `Vote (weight: ${baseVoteWeight})`
          }
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            "border",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
            voted
              ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
              : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20 hover:text-white",
            isDisabled && !voted && "opacity-40 cursor-not-allowed",
            isVoting && "animate-pulse"
          )}
        >
          {isVoting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : voted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>

        {/* Score */}
        <div className="text-center mt-1.5">
          <div className={cn(
            "text-base font-bold tabular-nums",
            weightedScore >= 10 ? "text-orange-400" : "text-white"
          )}>
            {weightedScore}
          </div>
          <div className="text-[10px] text-zinc-500">
            {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
          </div>
        </div>
      </div>

      {/* Feedback Panel */}
      {showPanel && !voted && (
        <div className="absolute left-full top-0 ml-3 z-50 w-72 animate-in slide-in-from-left-2 fade-in duration-150">
          <div className="p-4 rounded-xl bg-[#0f0f14] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Vote & Feedback</h4>
              <button
                onClick={() => setShowPanel(false)}
                aria-label="Close vote panel"
                className="text-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Product Type */}
            <div className="mb-3" role="group" aria-labelledby={`product-type-label-${launchId}`}>
              <span id={`product-type-label-${launchId}`} className="block text-xs text-zinc-500 mb-2">What type is it?</span>
              <div className="grid grid-cols-3 gap-2">
                {PRODUCT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setProductTypeVote(productTypeVote === type.id ? null : type.id)}
                    title={type.description}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                      productTypeVote === type.id
                        ? cn(type.bg, type.border, type.color)
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    <span className="text-lg">{type.emoji}</span>
                    <span className="text-[10px]">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Visit */}
            {demoUrl && (
              <div className="mb-3">
                <button
                  onClick={handleDemoClick}
                  disabled={!!visitedAt}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all",
                    visitedAt
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {visitedAt ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Demo visited
                    </>
                  ) : (
                    <>
                      <span>🌐</span>
                      Try demo first
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Feedback Text */}
            <div className="mb-3">
              <label htmlFor={`feedback-${launchId}`} className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                <span>Feedback</span>
                <span className={feedbackText.length >= 50 ? "text-emerald-400" : ""}>
                  {feedbackText.length}/50
                </span>
              </label>
              <textarea
                id={`feedback-${launchId}`}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What did you like? Any suggestions?…"
                rows={2}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-xs resize-none",
                  "bg-white/5 border border-white/10",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:ring-1 focus:ring-violet-500/50",
                  feedbackText.length >= 50 && "border-emerald-500/30"
                )}
              />
            </div>

            {/* Weight Preview */}
            <div className="flex items-center justify-between mb-3 px-2 py-1.5 rounded-lg bg-white/5 text-xs">
              <span className="text-zinc-500">Your vote weight:</span>
              <span className="font-bold text-violet-400">+{effectiveWeight}</span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleVote(true)}
                disabled={isVoting}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  "bg-white/5 border border-white/10 text-zinc-400",
                  "hover:bg-white/10 hover:text-white",
                  "disabled:opacity-50"
                )}
              >
                Quick (+{baseVoteWeight})
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={isVoting}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
                  "hover:from-violet-500 hover:to-fuchsia-500",
                  "disabled:opacity-50"
                )}
              >
                {isVoting ? 'Voting...' : `Submit (+${effectiveWeight})`}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
            )}
          </div>
        </div>
      )}

      {/* Error on main button */}
      {error && !showPanel && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-xs text-red-400 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
});

// Compact vote display
interface VoteDisplayProps {
  voteCount: number;
  weightedScore: number;
  isPoten?: boolean;
  className?: string;
}

export function VoteDisplay({
  voteCount,
  weightedScore,
  isPoten,
  className,
}: VoteDisplayProps) {
  return (
    <div className={cn("flex flex-col items-center w-14", className)}>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        "bg-white/5 border border-white/10",
        isPoten && "border-violet-500/30 bg-violet-500/10"
      )}>
        <span className={cn(
          "text-base font-bold tabular-nums",
          isPoten ? "text-violet-400" : "text-white"
        )}>
          {weightedScore}
        </span>
      </div>
      <div className="text-center mt-1.5">
        <div className="text-[10px] text-zinc-500">
          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
        </div>
        {isPoten && (
          <div className="text-[10px] text-violet-400">🛸 Orbit</div>
        )}
      </div>
    </div>
  );
}
