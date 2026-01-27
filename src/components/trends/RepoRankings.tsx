'use client';

import { memo } from 'react';
import type { TrendingRepo } from '@/lib/trends/types';
import { getLanguageColor } from '@/lib/chart-config';
import { formatNumber } from './utils';

interface RepoRankingsProps {
  repos: TrendingRepo[];
}

export const RepoRankings = memo(function RepoRankings({ repos }: RepoRankingsProps) {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>🔥</span> Trending Repositories
        </h3>
        <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded-md">
          Today on GitHub
        </span>
      </div>

      {/* Repo list */}
      <div className="space-y-4">
        {repos.map((repo, index) => (
          <a
            key={repo.fullName}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Rank badge */}
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0
                ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-black' :
                  index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-black' :
                  'bg-white/10 text-white'}
              `}>
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                {/* Repo name */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                    {repo.fullName}
                  </span>
                  {repo.language && (() => {
                    const langColor = getLanguageColor(repo.language);
                    return (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${langColor}15`,
                          borderColor: `${langColor}40`,
                          color: langColor,
                        }}
                      >
                        {repo.language}
                      </span>
                    );
                  })()}
                </div>

                {/* Description */}
                {repo.description && (
                  <p className="text-sm text-text-muted mt-1 line-clamp-1">
                    {repo.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    {formatNumber(repo.stars)}
                  </span>
                  <span className="flex items-center gap-1 text-green-400 font-medium">
                    +{repo.todayStars} today
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
                    </svg>
                    {formatNumber(repo.forks)}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="text-text-muted group-hover:text-purple-400 transition-colors shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
});
