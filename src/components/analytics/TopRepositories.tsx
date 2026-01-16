'use client';

import { memo } from 'react';
import Link from 'next/link';
import { formatCompactNumber } from '@/lib/leaderboard-types';
import { getLanguageColor } from '@/lib/chart-config';

interface Repository {
  name: string;
  fullName: string;
  stars: number;
  forks: number;
  language?: string;
  description?: string;
}

interface TopRepositoriesProps {
  repos: Repository[];
  tierColor: string;
  username: string;
}

export const TopRepositories = memo(function TopRepositories({
  repos,
  tierColor,
  username,
}: TopRepositoriesProps) {
  if (!repos || repos.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
        <p className="text-text-muted text-sm">No public repositories found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {repos.slice(0, 5).map((repo, index) => {
        const languageColor = repo.language ? getLanguageColor(repo.language) : '#6b7280';

        return (
          <Link
            key={repo.fullName}
            href={`https://github.com/${repo.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Repo name */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold group-hover:underline"
                    style={{ color: index === 0 ? tierColor : 'white' }}
                  >
                    {repo.name}
                  </span>
                  {index === 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/20 text-yellow-400">
                      TOP
                    </span>
                  )}
                </div>

                {/* Description */}
                {repo.description && (
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">
                    {repo.description}
                  </p>
                )}

                {/* Language badge */}
                {repo.language && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: languageColor }}
                    />
                    <span className="text-[10px] text-text-secondary">
                      {repo.language}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-sm font-bold text-white">
                      {formatCompactNumber(repo.stars)}
                    </span>
                  </div>
                  <div className="text-[9px] text-text-muted uppercase">Stars</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-text-muted">🍴</span>
                    <span className="text-sm font-bold text-text-secondary">
                      {formatCompactNumber(repo.forks)}
                    </span>
                  </div>
                  <div className="text-[9px] text-text-muted uppercase">Forks</div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      {/* View all link */}
      <Link
        href={`https://github.com/${username}?tab=repositories&sort=stargazers`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all text-sm text-text-secondary hover:text-white"
      >
        View all repositories on GitHub →
      </Link>
    </div>
  );
});
