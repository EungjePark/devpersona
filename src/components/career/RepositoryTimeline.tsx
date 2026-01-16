'use client';

import { memo, useMemo } from 'react';
// TIERS and TierLevel reserved for future tier-based repo categorization

interface RepoTimelineData {
  name: string;
  stars: number;
  forks: number;
  language: string | null;
  createdAt: string;
  description: string | null;
}

interface RepositoryTimelineProps {
  repos: RepoTimelineData[];
  tierColor: string;
  accountCreatedAt: string;
}

export const RepositoryTimeline = memo(function RepositoryTimeline({
  repos,
  tierColor,
  accountCreatedAt,
}: RepositoryTimelineProps) {
  // Sort repos by creation date
  const sortedRepos = useMemo(() => {
    return [...repos]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 10); // Show top 10 repos in timeline
  }, [repos]);

  // Calculate years range
  const yearsRange = useMemo(() => {
    if (sortedRepos.length === 0) return [];
    const startYear = new Date(accountCreatedAt).getFullYear();
    const endYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [sortedRepos, accountCreatedAt]);

  if (repos.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No public repositories found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline header with years */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <div className="w-24 flex-shrink-0" />
        {yearsRange.map((year) => (
          <div
            key={year}
            className="flex-1 min-w-[60px] text-center text-xs text-text-muted font-mono"
          >
            {year}
          </div>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: '100%',
            background: `linear-gradient(90deg, ${tierColor}30, ${tierColor})`,
          }}
        />
        {/* Repo markers */}
        {sortedRepos.map((repo) => {
          const repoYear = new Date(repo.createdAt).getFullYear();
          const startYear = yearsRange[0] || new Date().getFullYear();
          const endYear = yearsRange[yearsRange.length - 1] || new Date().getFullYear();
          const position = ((repoYear - startYear) / (endYear - startYear + 1)) * 100;

          return (
            <div
              key={repo.name}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-bg-primary cursor-pointer hover:scale-150 transition-transform"
              style={{
                left: `${Math.max(2, Math.min(98, position))}%`,
                borderColor: tierColor,
              }}
              title={`${repo.name} (${repoYear})`}
            />
          );
        })}
      </div>

      {/* Recent repos list */}
      <div className="space-y-2 mt-4">
        <h4 className="text-xs text-text-muted uppercase tracking-wider">Recent Activity</h4>
        {sortedRepos.slice(-5).reverse().map((repo) => (
          <div
            key={repo.name}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tierColor }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{repo.name}</span>
                {repo.language && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
                    {repo.language}
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-xs text-text-muted truncate mt-0.5">{repo.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted flex-shrink-0">
              <span>⭐ {repo.stars}</span>
              <span className="text-text-muted/50">•</span>
              <span>{new Date(repo.createdAt).getFullYear()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
