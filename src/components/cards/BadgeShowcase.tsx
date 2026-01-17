'use client';

import { memo, useState, useMemo } from 'react';
import { Achievement, AchievementCategory, TIER_COLORS } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface BadgeShowcaseProps {
  achievements: Achievement[];
  className?: string;
}

const CATEGORY_LABELS: Record<AchievementCategory, { name: string; emoji: string }> = {
  streak: { name: 'Streaks', emoji: '🔥' },
  volume: { name: 'Volume', emoji: '📊' },
  consistency: { name: 'Consistency', emoji: '⚡' },
  special: { name: 'Special', emoji: '🌟' },
  language: { name: 'Languages', emoji: '💻' },
  social: { name: 'Social', emoji: '👥' },
  opensource: { name: 'Open Source', emoji: '🌐' },
  npm: { name: 'npm', emoji: '📦' },
  community: { name: 'Community', emoji: '🤝' },
  milestone: { name: 'Milestones', emoji: '🏆' },
  secret: { name: 'Secret', emoji: '🔮' },
};

const TIER_ORDER = ['diamond', 'platinum', 'gold', 'silver', 'bronze'] as const;

type FilterMode = 'all' | 'unlocked' | 'locked';

// Single badge card component
function BadgeCard({ achievement }: { achievement: Achievement }) {
  const tierStyle = TIER_COLORS[achievement.tier];
  const isLocked = !achievement.unlocked;

  return (
    <div
      className={cn(
        'group relative p-3 rounded-xl border transition-all duration-300',
        tierStyle.bg,
        tierStyle.border,
        isLocked ? 'opacity-40 grayscale' : `shadow-lg ${tierStyle.glow}`,
        !isLocked && 'hover:scale-105 hover:shadow-xl'
      )}
    >
      {/* Icon */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{achievement.icon}</span>
        <span
          className={cn(
            'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
            tierStyle.text,
            tierStyle.bg
          )}
        >
          {achievement.tier}
        </span>
      </div>

      {/* Name */}
      <h4 className={cn('font-bold text-sm mb-1', isLocked ? 'text-zinc-400' : 'text-white')}>
        {achievement.name}
      </h4>

      {/* Description */}
      <p className="text-[11px] text-zinc-400 line-clamp-2">{achievement.description}</p>

      {/* Progress bar */}
      {achievement.progress !== undefined && achievement.progress < 100 && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(achievement.progress)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-blue-500"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Unlocked indicator */}
      {achievement.unlocked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
          <span className="text-[10px]">✓</span>
        </div>
      )}

      {/* Lock overlay for locked achievements */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl opacity-30">🔒</span>
        </div>
      )}
    </div>
  );
}

// Main showcase component
export const BadgeShowcase = memo(function BadgeShowcase({
  achievements,
  className = '',
}: BadgeShowcaseProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Calculate stats
  const stats = useMemo(() => {
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const total = achievements.length;
    return { unlocked, total, percentage: Math.round((unlocked / total) * 100) || 0 };
  }, [achievements]);

  // Get unique categories from achievements
  const categories = useMemo(() => {
    const cats = new Set(achievements.map((a) => a.category));
    return Array.from(cats);
  }, [achievements]);

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let result = [...achievements];

    // Filter by unlock status
    if (filterMode === 'unlocked') {
      result = result.filter((a) => a.unlocked);
    } else if (filterMode === 'locked') {
      result = result.filter((a) => !a.unlocked);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Sort by tier (diamond first) then by unlock status
    result.sort((a, b) => {
      // Unlocked first
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      // Then by tier
      return TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
    });

    return result;
  }, [achievements, filterMode, selectedCategory]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div>
            <h3 className="font-bold text-white">Achievements</h3>
            <p className="text-xs text-zinc-400">
              {stats.unlocked} / {stats.total} unlocked ({stats.percentage}%)
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90">
            <circle
              className="text-white/5"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="20"
              cx="24"
              cy="24"
            />
            <circle
              className="text-purple-500 transition-all duration-500"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="20"
              cx="24"
              cy="24"
              strokeDasharray={`${stats.percentage * 1.26} 126`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {stats.percentage}%
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Status filters */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {(['all', 'unlocked', 'locked'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize',
                filterMode === mode
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as AchievementCategory | 'all')}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat].emoji} {CATEGORY_LABELS[cat].name}
            </option>
          ))}
        </select>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredAchievements.map((achievement) => (
          <BadgeCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          <span className="text-3xl block mb-2">🔍</span>
          <p className="text-sm">No achievements found with current filters</p>
        </div>
      )}
    </div>
  );
});

// Compact inline version for profile cards
export function BadgeInline({ achievements, limit = 5 }: { achievements: Achievement[]; limit?: number }) {
  const unlockedAchievements = useMemo(() => {
    return achievements
      .filter((a) => a.unlocked)
      .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
      .slice(0, limit);
  }, [achievements, limit]);

  if (unlockedAchievements.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {unlockedAchievements.map((achievement) => (
        <span
          key={achievement.id}
          className={cn(
            'text-lg cursor-help transition-transform hover:scale-125',
            TIER_COLORS[achievement.tier].glow
          )}
          title={`${achievement.name}: ${achievement.description}`}
        >
          {achievement.icon}
        </span>
      ))}
      {achievements.filter((a) => a.unlocked).length > limit && (
        <span className="text-xs text-zinc-500 ml-1">
          +{achievements.filter((a) => a.unlocked).length - limit}
        </span>
      )}
    </div>
  );
}
