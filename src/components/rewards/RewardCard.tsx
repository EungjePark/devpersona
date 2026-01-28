'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Reward type configurations (match backend)
const REWARD_ICONS: Record<string, string> = {
  sticker_pack: '🏷️',
  goodie_kit: '👕',
  acrylic_trophy: '🏆',
  metal_trophy: '🥇',
};

const REWARD_NAMES: Record<string, string> = {
  sticker_pack: 'Sticker Pack',
  goodie_kit: 'Goodie Kit',
  acrylic_trophy: 'Acrylic Trophy',
  metal_trophy: 'Metal Trophy',
};

const REWARD_DESCRIPTIONS: Record<string, string> = {
  sticker_pack: '5 exclusive DevPersona stickers',
  goodie_kit: 'Hoodie or T-shirt + sticker pack',
  acrylic_trophy: 'Custom acrylic trophy with your achievement',
  metal_trophy: 'Premium metal trophy + ambassador status',
};

const REASON_LABELS: Record<string, string> = {
  weekly_poten_1st: 'Weekly Poten 1st Place',
  monthly_1st: 'Monthly Champion',
  quarterly_1st: 'Quarterly Champion',
  yearly_top3: 'Yearly Top 3',
};

const STATUS_COLORS: Record<string, string> = {
  eligible: 'text-green-400 bg-green-500/10 border-green-500/30',
  claimed: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  shipped: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  delivered: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  eligible: 'Ready to Claim',
  claimed: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

interface RewardData {
  _id: Id<"rewards">;
  username: string;
  rewardType: string;
  reason: string;
  weekNumber?: string;
  status: string;
  shippingAddress?: string;
  trackingNumber?: string;
  claimedAt?: number;
  shippedAt?: number;
  createdAt: number;
}

interface RewardCardProps {
  reward: RewardData;
  viewerUsername: string;
  onClaimSuccess?: () => void;
  className?: string;
}

export function RewardCard({
  reward,
  viewerUsername,
  onClaimSuccess,
  className,
}: RewardCardProps) {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimReward = useMutation(api.rewards.claimReward);

  const isOwner = reward.username === viewerUsername;
  const canClaim = isOwner && reward.status === 'eligible';

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shippingAddress.trim()) {
      setError('Please enter your shipping address');
      return;
    }

    setIsSubmitting(true);

    try {
      await claimReward({
        rewardId: reward._id,
        shippingAddress: shippingAddress.trim(),
      });
      setShowClaimForm(false);
      onClaimSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim reward');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      reward.status === 'eligible' && "border-green-500/30 hover:border-green-500/50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Reward icon */}
          <span className="text-4xl" role="img" aria-label={REWARD_NAMES[reward.rewardType]}>
            {REWARD_ICONS[reward.rewardType] || '🎁'}
          </span>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
              {REWARD_NAMES[reward.rewardType] || reward.rewardType}
              {/* Status badge */}
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                STATUS_COLORS[reward.status] || "text-text-muted bg-bg-tertiary"
              )}>
                {STATUS_LABELS[reward.status] || reward.status}
              </span>
            </CardTitle>
            <CardDescription className="mt-1">
              {REASON_LABELS[reward.reason] || reward.reason}
              {reward.weekNumber && ` · ${reward.weekNumber}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-text-secondary mb-4">
          {REWARD_DESCRIPTIONS[reward.rewardType] || 'A special reward for your achievement'}
        </p>

        {/* Tracking info for shipped rewards */}
        {reward.status === 'shipped' && reward.trackingNumber && (
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-purple-400">Tracking:</span>{' '}
              {reward.trackingNumber}
            </p>
          </div>
        )}

        {/* Claim form or button */}
        {canClaim && !showClaimForm && (
          <Button
            onClick={() => setShowClaimForm(true)}
            className="w-full"
          >
            🎉 Claim Reward
          </Button>
        )}

        {showClaimForm && (
          <form onSubmit={handleClaim} className="space-y-3">
            <div>
              <label
                htmlFor={`address-${reward._id}`}
                className="block text-sm font-medium text-text-secondary mb-1.5"
              >
                Shipping Address <span className="text-red-400">*</span>
              </label>
              <textarea
                id={`address-${reward._id}`}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Full name&#10;Street address&#10;City, State/Province, Postal code&#10;Country"
                rows={4}
                required
                className={cn(
                  "w-full px-3 py-2 rounded-lg resize-none",
                  "bg-bg-tertiary border border-border",
                  "text-text-primary placeholder:text-text-muted",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                )}
              />
              <p className="text-xs text-text-muted mt-1">
                Your address will only be used for shipping this reward.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30" role="alert">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowClaimForm(false);
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </div>
          </form>
        )}

        {/* Delivered celebration */}
        {reward.status === 'delivered' && (
          <div className="text-center py-2">
            <span className="text-2xl">🎉</span>
            <p className="text-sm text-green-400 font-medium mt-1">Delivered!</p>
          </div>
        )}

        {/* Timestamp info */}
        <div className="mt-4 pt-3 border-t border-border text-xs text-text-muted">
          {reward.claimedAt && (
            <p>Claimed: {new Date(reward.claimedAt).toLocaleDateString()}</p>
          )}
          {reward.shippedAt && (
            <p>Shipped: {new Date(reward.shippedAt).toLocaleDateString()}</p>
          )}
          {!reward.claimedAt && (
            <p>Earned: {new Date(reward.createdAt).toLocaleDateString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Display user's rewards summary
 */
interface RewardsSummaryProps {
  stats: {
    total: number;
    byStatus: {
      eligible: number;
      claimed: number;
      shipped: number;
      delivered: number;
    };
    byType: {
      sticker_pack: number;
      goodie_kit: number;
      acrylic_trophy: number;
      metal_trophy: number;
    };
  };
  className?: string;
}

export function RewardsSummary({ stats, className }: RewardsSummaryProps) {
  if (stats.total === 0) {
    return null;
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
      {stats.byStatus.eligible > 0 && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.byStatus.eligible}</p>
          <p className="text-xs text-text-muted">Ready to Claim</p>
        </div>
      )}
      {stats.byStatus.claimed > 0 && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.byStatus.claimed}</p>
          <p className="text-xs text-text-muted">Processing</p>
        </div>
      )}
      {stats.byStatus.shipped > 0 && (
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
          <p className="text-2xl font-bold text-purple-400">{stats.byStatus.shipped}</p>
          <p className="text-xs text-text-muted">In Transit</p>
        </div>
      )}
      {stats.byStatus.delivered > 0 && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.byStatus.delivered}</p>
          <p className="text-xs text-text-muted">Received</p>
        </div>
      )}
    </div>
  );
}
