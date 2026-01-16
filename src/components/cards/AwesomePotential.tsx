'use client';

import { memo, useMemo } from 'react';
import {
  getUserAwesomeCategories,
  getAwesomeBadges,
  AWESOME_CATEGORIES,
} from '@/lib/external/awesome-lists';

interface AwesomePotentialProps {
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
  }>;
}

export const AwesomePotential = memo(function AwesomePotential({
  repos,
}: AwesomePotentialProps) {
  const categoryMap = useMemo(() => getUserAwesomeCategories(repos), [repos]);
  const badges = useMemo(() => getAwesomeBadges(categoryMap), [categoryMap]);

  const topCategory = badges[0];

  if (badges.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
            <span>📚</span> Awesome List Potential
          </h3>
          <a
            href="https://github.com/sindresorhus/awesome"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-white transition-colors"
          >
            What&apos;s this? →
          </a>
        </div>
        <div className="text-center py-6">
          <span className="text-4xl mb-3 block">🌱</span>
          <p className="text-sm text-text-muted">
            Keep building! Create popular libraries to get featured in awesome lists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>📚</span> Awesome List Potential
        </h3>
        <a
          href="https://github.com/sindresorhus/awesome"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-white transition-colors"
        >
          sindresorhus/awesome →
        </a>
      </div>

      {/* Top category highlight */}
      {topCategory && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{topCategory.emoji}</div>
            <div className="flex-1">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Top Category Match
              </div>
              <div className="text-xl font-bold text-white">
                Awesome {topCategory.name}
              </div>
              <div className="text-sm text-text-muted mt-1">
                {topCategory.repos} repos • {topCategory.stars.toLocaleString()} stars
              </div>
            </div>
            <a
              href={AWESOME_CATEGORIES.find(c => c.id === topCategory.id)?.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors"
            >
              View List →
            </a>
          </div>
        </div>
      )}

      {/* All matching categories */}
      <div className="grid grid-cols-2 gap-3">
        {badges.slice(1).map(badge => (
          <div
            key={badge.id}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{badge.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {badge.name}
                </div>
                <div className="text-xs text-text-muted">
                  {badge.repos} repos • {badge.stars >= 1000 ? `${(badge.stars / 1000).toFixed(1)}K` : badge.stars} ⭐
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <div className="text-sm font-medium text-white mb-1">
              How to get featured
            </div>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• Create well-documented, high-quality libraries</li>
              <li>• Gain 500+ stars to increase visibility</li>
              <li>• Submit a PR to the relevant awesome list</li>
              <li>• Focus on solving real problems in your niche</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});
