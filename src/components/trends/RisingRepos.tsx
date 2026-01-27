'use client';

import React, { memo, useMemo } from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import { formatNumber, getTimeAgo, getLanguageColor } from './utils';
import { SectionHeader, SectionFooter, EmptyState, RankBadge } from './shared';

interface RisingRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  forks: number;
  url: string;
  owner: string;
  avatarUrl: string;
  createdAt: string;
  daysOld: number;
}

function Skeleton(): React.ReactElement {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-bg-tertiary/50 animate-pulse border border-glass-border"
        >
          <div className="w-10 h-10 rounded-full bg-bg-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-bg-elevated" />
            <div className="h-3 w-48 rounded bg-bg-elevated" />
          </div>
          <div className="w-16 h-6 rounded bg-bg-elevated" />
        </div>
      ))}
    </div>
  );
}

function getFreshnessLabel(daysOld: number): { text: string; color: string; bg: string } {
  if (daysOld <= 7) {
    return { text: 'This week', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  }
  if (daysOld <= 14) {
    return { text: '2 weeks', color: 'text-blue-400', bg: 'bg-blue-500/10' };
  }
  return { text: `${daysOld}d`, color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
}

const RepoItem = memo(function RepoItem({ repo, index }: { repo: RisingRepo; index: number }) {
  const langColor = getLanguageColor(repo.language);
  const freshnessLabel = getFreshnessLabel(repo.daysOld);

  const badgeStyle = useMemo(
    () => ({
      backgroundColor: `${langColor}15`,
      borderColor: `${langColor}40`,
      color: langColor,
    }),
    [langColor]
  );

  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-start gap-4 p-4 rounded-xl transition-all duration-200',
        'bg-glass-surface border border-glass-border',
        'hover:bg-white/[0.04] hover:border-white/15 hover:scale-[1.01]',
        index < 3 && 'ring-1 ring-primary-500/20'
      )}
    >
      {/* Rank + Avatar */}
      <div className="relative shrink-0">
        <div className="absolute -top-1 -left-1 z-10">
          <RankBadge index={index} />
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-glass-border group-hover:border-primary-500/50 transition-colors">
          <Image src={repo.avatarUrl} alt={repo.owner} width={40} height={40} className="object-cover" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text-primary group-hover:text-primary-400 transition-colors truncate">
            {repo.fullName}
          </span>
          {repo.language && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium" style={badgeStyle}>
              {repo.language}
            </span>
          )}
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', freshnessLabel.bg, freshnessLabel.color)}>
            {freshnessLabel.text}
          </span>
        </div>

        {repo.description && (
          <p className="text-sm text-text-muted line-clamp-1 leading-relaxed">{repo.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="text-amber-400">&#9733;</span>
            <span className="font-medium text-text-secondary">{formatNumber(repo.stars)}</span>
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-text-muted" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
            </svg>
            <span>{formatNumber(repo.forks)}</span>
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div className="shrink-0 text-text-muted group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
});

export const RisingRepos = memo(function RisingRepos() {
  const data = useQuery(api.trends.getRisingRepos);
  const isLoading = data === undefined;
  const repos = data?.repos ?? [];
  const isEmpty = !isLoading && repos.length === 0;
  const timeAgo = getTimeAgo(data?.updatedAt);

  if (isLoading) {
    return (
      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <SectionHeader
          icon="&#127793;"
          iconGradient="bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
          iconBorder="border-emerald-500/30"
          title="Rising Repos"
          subtitle="New projects gaining traction"
        />
        <Skeleton />
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <SectionHeader
          icon="&#127793;"
          iconGradient="bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
          iconBorder="border-emerald-500/30"
          title="Rising Repos"
          subtitle="New projects gaining traction"
        />
        <EmptyState icon="&#127793;" message="No rising repos found" subtext="Check back soon" />
        <SectionFooter href="https://github.com/trending" label="View all on GitHub" />
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-6 space-y-5">
      <SectionHeader
        icon="&#127793;"
        iconGradient="bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
        iconBorder="border-emerald-500/30"
        title="Rising Repos"
        subtitle="New projects gaining traction"
        timeAgo={timeAgo}
      />

      <div className="space-y-3">
        {repos.slice(0, 10).map((repo, index) => (
          <RepoItem key={repo.fullName} repo={repo} index={index} />
        ))}
      </div>

      <SectionFooter href="https://github.com/trending" label="View all on GitHub" />
    </section>
  );
});
