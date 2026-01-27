'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import { formatNumber, getTimeAgo } from './utils';
import { SectionHeader, SectionFooter, EmptyState } from './shared';

interface RisingDeveloper {
  login: string;
  name: string | null;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  bio: string | null;
  company: string | null;
  location: string | null;
  url: string;
}

function Skeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl bg-bg-tertiary/50 animate-pulse border border-glass-border"
        >
          <div className="w-12 h-12 rounded-full bg-bg-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-bg-elevated" />
            <div className="h-3 w-16 rounded bg-bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface FollowerTier {
  label: string;
  color: string;
  bg: string;
  border: string;
}

function getFollowerTier(followers: number): FollowerTier {
  if (followers >= 100_000) {
    return { label: '100K+', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  }
  if (followers >= 50_000) {
    return { label: '50K+', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
  }
  if (followers >= 10_000) {
    return { label: '10K+', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
  }
  return { label: '5K+', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' };
}

const DeveloperCard = memo(function DeveloperCard({
  dev,
  index,
}: {
  dev: RisingDeveloper;
  index: number;
}) {
  const followerTier = getFollowerTier(dev.followers);

  return (
    <div
      className={cn(
        'group relative p-4 rounded-xl transition-all duration-200',
        'bg-glass-surface border border-glass-border',
        'hover:bg-white/[0.04] hover:border-white/15',
        index < 3 && 'ring-1 ring-primary-500/20'
      )}
    >
      {/* Rank Badge */}
      {index < 3 && (
        <div
          className={cn(
            'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10',
            index === 0 && 'bg-gradient-to-br from-amber-400 to-orange-500 text-black',
            index === 1 && 'bg-gradient-to-br from-slate-300 to-slate-400 text-black',
            index === 2 && 'bg-gradient-to-br from-orange-400 to-amber-600 text-black'
          )}
        >
          {index + 1}
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-glass-border group-hover:border-primary-500/50 transition-colors">
            <Image src={dev.avatarUrl} alt={dev.login} width={48} height={48} className="object-cover" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary group-hover:text-primary-400 transition-colors truncate">
              @{dev.login}
            </span>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold border',
                followerTier.bg,
                followerTier.color,
                followerTier.border
              )}
            >
              {followerTier.label}
            </span>
          </div>

          {dev.name && <p className="text-sm text-text-secondary truncate">{dev.name}</p>}

          {dev.bio && <p className="text-xs text-text-muted line-clamp-1">{dev.bio}</p>}

          <div className="flex items-center gap-3 pt-1 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
              </svg>
              <span className="font-medium text-text-secondary">{formatNumber(dev.followers)}</span>
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z" />
              </svg>
              <span>{dev.publicRepos} repos</span>
            </span>
          </div>

          {(dev.company || dev.location) && (
            <div className="flex items-center gap-2 text-[10px] text-text-muted pt-1">
              {dev.company && <span className="truncate max-w-[100px]">{dev.company}</span>}
              {dev.company && dev.location && <span>·</span>}
              {dev.location && <span className="truncate max-w-[80px]">{dev.location}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-glass-border">
        <Link
          href={`/analyze/${dev.login}`}
          className={cn(
            'flex-1 text-center text-xs font-medium py-1.5 rounded-lg transition-colors',
            'bg-primary-500/10 text-primary-400 border border-primary-500/20',
            'hover:bg-primary-500/20 hover:border-primary-500/30'
          )}
        >
          Analyze
        </Link>
        <a
          href={dev.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex-1 text-center text-xs font-medium py-1.5 rounded-lg transition-colors',
            'bg-white/5 text-text-secondary border border-glass-border',
            'hover:bg-white/10 hover:text-text-primary'
          )}
        >
          GitHub
        </a>
      </div>
    </div>
  );
});

export const RisingDevelopers = memo(function RisingDevelopers() {
  const data = useQuery(api.trends.getRisingDevelopers);
  const isLoading = data === undefined;
  const developers = data?.developers ?? [];
  const isEmpty = !isLoading && developers.length === 0;
  const timeAgo = getTimeAgo(data?.updatedAt);

  if (isLoading) {
    return (
      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <SectionHeader
          icon="&#128640;"
          iconGradient="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
          iconBorder="border-violet-500/30"
          title="Rising Developers"
          subtitle="Most followed on GitHub"
        />
        <Skeleton />
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <SectionHeader
          icon="&#128640;"
          iconGradient="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
          iconBorder="border-violet-500/30"
          title="Rising Developers"
          subtitle="Most followed on GitHub"
        />
        <EmptyState icon="&#128640;" message="No rising developers found" subtext="Check back soon" />
        <SectionFooter
          href="https://github.com/search?q=followers%3A%3E5000&type=users&s=followers&o=desc"
          label="View all on GitHub"
        />
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-6 space-y-5">
      <SectionHeader
        icon="&#128640;"
        iconGradient="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
        iconBorder="border-violet-500/30"
        title="Rising Developers"
        subtitle="Most followed on GitHub"
        timeAgo={timeAgo}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {developers.slice(0, 8).map((dev, index) => (
          <DeveloperCard key={dev.login} dev={dev} index={index} />
        ))}
      </div>

      <SectionFooter
        href="https://github.com/search?q=followers%3A%3E5000&type=users&s=followers&o=desc"
        label="View all on GitHub"
      />
    </section>
  );
});
