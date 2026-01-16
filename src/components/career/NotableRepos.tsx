'use client';

import { memo, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface RepoData {
  name: string;
  fullName: string;
  stars: number;
  forks: number;
  language: string | null;
  description: string | null;
  pushedAt: string;
  createdAt: string;
}

interface NotableReposProps {
  repos: RepoData[];
  tierColor: string;
  username: string;
}

type SortMode = 'stars' | 'recent' | 'active';

export const NotableRepos = memo(function NotableRepos({
  repos,
  tierColor,
  username,
}: NotableReposProps) {
  const [sortMode, setSortMode] = useState<SortMode>('stars');

  // Sort repos based on mode
  const sortedRepos = useMemo(() => {
    const sorted = [...repos];
    switch (sortMode) {
      case 'stars':
        sorted.sort((a, b) => b.stars - a.stars);
        break;
      case 'recent':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'active':
        sorted.sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime());
        break;
    }
    return sorted.slice(0, 6);
  }, [repos, sortMode]);

  // Calculate time ago
  const timeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  if (repos.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No repositories found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02]">
        {[
          { mode: 'stars' as SortMode, label: 'Top Stars', icon: '⭐' },
          { mode: 'active' as SortMode, label: 'Most Active', icon: '🔥' },
          { mode: 'recent' as SortMode, label: 'Newest', icon: '✨' },
        ].map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              sortMode === mode
                ? 'bg-white/[0.1] text-white'
                : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <span>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Repo grid */}
      <div className="grid gap-3">
        {sortedRepos.map((repo, index) => (
          <a
            key={repo.name}
            href={`https://github.com/${repo.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white group-hover:text-primary-400 truncate transition-colors">
                    {repo.name}
                  </span>
                  {repo.language && (
                    <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
                      {repo.language}
                    </span>
                  )}
                </div>
                {repo.description && (
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">
                    {repo.description}
                  </p>
                )}
              </div>

              {/* Star badge */}
              {index < 3 && repo.stars > 0 && (
                <div
                  className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: `${tierColor}20`,
                    color: tierColor,
                  }}
                >
                  ⭐ {repo.stars.toLocaleString()}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span>⭐</span> {repo.stars.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <span>🍴</span> {repo.forks.toLocaleString()}
              </span>
              <span className="flex-1" />
              <span className="text-text-muted/60">
                Updated {timeAgo(repo.pushedAt)}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* View all link */}
      <a
        href={`https://github.com/${username}?tab=repositories`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs text-text-muted hover:text-white transition-colors pt-2"
      >
        View all {repos.length} repositories →
      </a>
    </div>
  );
});
