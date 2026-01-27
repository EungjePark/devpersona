'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import { formatNumber, getTimeAgo, getTimeAgoFromDate, getLanguageColor } from './utils';
import { SectionHeader, SectionFooter, EmptyState } from './shared';

interface HotRepo {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  forks: number;
  url: string;
  owner: string;
  avatarUrl: string;
  pushedAt: string;
  openIssues: number;
}

function Skeleton(): React.ReactElement {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/50 animate-pulse border border-glass-border"
        >
          <div className="w-8 h-8 rounded-full bg-bg-elevated" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-bg-elevated" />
            <div className="h-2.5 w-24 rounded bg-bg-elevated" />
          </div>
          <div className="w-14 h-5 rounded bg-bg-elevated" />
        </div>
      ))}
    </div>
  );
}

interface ActivityIndicator {
  level: string;
  color: string;
  pulse: boolean;
}

function getActivityIndicator(pushedAt: string): ActivityIndicator {
  const hoursSincePush = Math.floor((Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60));

  if (hoursSincePush < 6) {
    return { level: 'hot', color: 'bg-red-500', pulse: true };
  }
  if (hoursSincePush < 24) {
    return { level: 'active', color: 'bg-orange-500', pulse: false };
  }
  if (hoursSincePush < 72) {
    return { level: 'warm', color: 'bg-yellow-500', pulse: false };
  }
  return { level: 'normal', color: 'bg-emerald-500', pulse: false };
}

const HotRepoItem = memo(function HotRepoItem({ repo, index }: { repo: HotRepo; index: number }) {
  const langColor = getLanguageColor(repo.language);
  const activityIndicator = getActivityIndicator(repo.pushedAt);

  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
        'bg-glass-surface/50 border border-glass-border',
        'hover:bg-white/[0.04] hover:border-white/15'
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0',
          index < 3
            ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30'
            : 'bg-bg-elevated text-text-muted'
        )}
      >
        {index + 1}
      </div>

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-glass-border">
          <Image src={repo.avatarUrl} alt={repo.owner} width={32} height={32} className="object-cover" />
        </div>
        {/* Activity indicator */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-primary',
            activityIndicator.color,
            activityIndicator.pulse && 'animate-pulse'
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary group-hover:text-primary-400 transition-colors truncate">
            {repo.fullName}
          </span>
          {repo.language && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: langColor }}
              title={repo.language}
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span>Pushed {getTimeAgoFromDate(repo.pushedAt)}</span>
          {repo.openIssues > 0 && (
            <>
              <span>·</span>
              <span>{repo.openIssues} issues</span>
            </>
          )}
        </div>
      </div>

      {/* Stars */}
      <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-amber-400">
        <span>&#9733;</span>
        <span>{formatNumber(repo.stars)}</span>
      </div>
    </a>
  );
});

function ActivityLegend(): React.ReactElement {
  return (
    <div className="flex items-center gap-4 text-[10px] text-text-muted">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        &lt; 6h
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-orange-500" />
        &lt; 24h
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        &lt; 3d
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        This week
      </span>
    </div>
  );
}

export const HotThisWeek = memo(function HotThisWeek() {
  const data = useQuery(api.trends.getHotThisWeek);
  const isLoading = data === undefined;
  const repos = data?.repos ?? [];
  const isEmpty = !isLoading && repos.length === 0;
  const timeAgo = getTimeAgo(data?.updatedAt);

  if (isLoading) {
    return (
      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <SectionHeader
          icon="&#128293;"
          iconGradient="bg-gradient-to-br from-orange-500/20 to-red-500/20"
          iconBorder="border-orange-500/30"
          title="Hot This Week"
          subtitle="Recently updated popular repos"
        />
        <ActivityLegend />
        <Skeleton />
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <SectionHeader
          icon="&#128293;"
          iconGradient="bg-gradient-to-br from-orange-500/20 to-red-500/20"
          iconBorder="border-orange-500/30"
          title="Hot This Week"
          subtitle="Recently updated popular repos"
        />
        <ActivityLegend />
        <EmptyState icon="&#128293;" message="No hot repos found" subtext="Check back soon" />
        <SectionFooter href="https://github.com/trending?since=weekly" label="View weekly trending" />
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-6 space-y-5">
      <SectionHeader
        icon="&#128293;"
        iconGradient="bg-gradient-to-br from-orange-500/20 to-red-500/20"
        iconBorder="border-orange-500/30"
        title="Hot This Week"
        subtitle="Recently updated popular repos"
        timeAgo={timeAgo}
      />

      <ActivityLegend />

      <div className="space-y-2">
        {repos.slice(0, 12).map((repo, index) => (
          <HotRepoItem key={repo.fullName} repo={repo} index={index} />
        ))}
      </div>

      <SectionFooter href="https://github.com/trending?since=weekly" label="View weekly trending" />
    </section>
  );
});
