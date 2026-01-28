'use client';

import React, { memo, useMemo, useState, type CSSProperties } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import { formatNumberCompact, getTimeAgo, getLanguageColor } from './utils';
import { SectionHeader, SectionFooter, EmptyState } from './shared';

const LANGUAGE_ICONS: Record<string, string> = {
  TypeScript: 'TS',
  Python: 'Py',
  JavaScript: 'JS',
  Rust: 'Rs',
  Go: 'Go',
  Zig: 'Zg',
  Kotlin: 'Kt',
  Swift: 'Sw',
};

interface LanguageTrendData {
  language: string;
  repos: Array<{
    name: string;
    fullName: string;
    description: string | null;
    stars: number;
    url: string;
  }>;
  totalStars: number;
  repoCount: number;
}

function Skeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-bg-tertiary/50 animate-pulse border border-glass-border space-y-3">
          <div className="w-10 h-10 rounded-lg bg-bg-elevated" />
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-bg-elevated" />
            <div className="h-3 w-16 rounded bg-bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getLanguageIcon(language: string): string {
  return LANGUAGE_ICONS[language] ?? language.slice(0, 2);
}

const LanguageCard = memo(function LanguageCard({
  data,
  index,
  isExpanded,
  onToggle,
}: {
  data: LanguageTrendData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const langColor = getLanguageColor(data.language);
  const langIcon = getLanguageIcon(data.language);

  const cardStyle = useMemo(
    () =>
      ({
        '--lang-color': langColor,
        '--lang-color-15': `${langColor}15`,
        '--lang-color-30': `${langColor}30`,
        '--lang-color-50': `${langColor}50`,
      }) as CSSProperties,
    [langColor]
  );

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300 overflow-hidden',
        'bg-glass-surface border border-glass-border',
        'hover:border-[var(--lang-color-50)]',
        isExpanded && 'border-[var(--lang-color-30)]'
      )}
      style={cardStyle}
    >
      {/* Main card */}
      <button onClick={onToggle} className="w-full p-3 sm:p-4 text-left transition-colors hover:bg-white/[0.02]">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Icon - Fixed size */}
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0"
            style={{
              backgroundColor: `${langColor}15`,
              color: langColor,
              border: `1px solid ${langColor}30`,
            }}
          >
            {langIcon}
          </div>

          {/* Info - Flex grow with min-width */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h4 className="font-semibold text-sm sm:text-base text-text-primary truncate">
                {data.language}
              </h4>
              {index < 3 && (
                <span
                  className={cn(
                    'text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded font-bold shrink-0',
                    index === 0 && 'bg-amber-500/20 text-amber-400',
                    index === 1 && 'bg-zinc-400/20 text-zinc-300',
                    index === 2 && 'bg-orange-500/20 text-orange-400'
                  )}
                >
                  #{index + 1}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-muted">
              <span className="flex items-center gap-1 shrink-0">
                <span className="text-amber-400">&#9733;</span>
                {formatNumberCompact(data.totalStars)}
              </span>
              <span className="truncate">{formatNumberCompact(data.repoCount)} repos</span>
            </div>
          </div>

          {/* Expand indicator - Fixed position */}
          <div
            className={cn(
              'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted transition-transform shrink-0',
              isExpanded && 'rotate-180'
            )}
          >
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="h-px bg-glass-border" />
          <p className="text-[10px] sm:text-xs text-text-muted py-1">Top repositories:</p>
          {data.repos.slice(0, 5).map((repo, i) => (
            <a
              key={repo.fullName}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('flex items-center gap-2 p-2 rounded-lg transition-colors', 'bg-white/[0.02] hover:bg-white/[0.05]')}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="w-4 text-center text-[10px] text-text-muted font-medium shrink-0">{i + 1}</span>
              <span className="flex-1 text-xs sm:text-sm text-text-secondary truncate hover:text-text-primary transition-colors">
                {repo.fullName}
              </span>
              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5 shrink-0">
                &#9733; {formatNumberCompact(repo.stars)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
});

interface LanguageBarProps {
  language: string;
  totalStars: number;
  maxStars: number;
}

function LanguageBar({ language, totalStars, maxStars }: LanguageBarProps): React.ReactElement {
  const langColor = getLanguageColor(language);
  const percentage = (totalStars / maxStars) * 100;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-16 sm:w-20 text-[10px] sm:text-xs text-text-secondary truncate">{language}</span>
      <div className="flex-1 h-1.5 sm:h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: langColor,
          }}
        />
      </div>
      <span className="w-10 sm:w-12 text-[9px] sm:text-[10px] text-text-muted text-right">{formatNumberCompact(totalStars)}</span>
    </div>
  );
}

export const LanguageTrendsLive = memo(function LanguageTrendsLive() {
  const data = useQuery(api.trends.getLanguageTrends);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const isLoading = data === undefined;
  const languageData = data?.languages;
  const languages = useMemo(() => languageData ?? [], [languageData]);
  const isEmpty = !isLoading && languages.length === 0;
  const timeAgo = getTimeAgo(data?.updatedAt);

  const maxStars = useMemo(() => {
    return Math.max(...languages.map((l) => l.totalStars), 1);
  }, [languages]);

  function handleToggle(index: number): void {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  if (isLoading) {
    return (
      <section className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
        <SectionHeader
          icon="&#128187;"
          iconGradient="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
          iconBorder="border-blue-500/30"
          title="Language Trends"
          subtitle="Most starred by language"
        />
        <Skeleton />
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
        <SectionHeader
          icon="&#128187;"
          iconGradient="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
          iconBorder="border-blue-500/30"
          title="Language Trends"
          subtitle="Most starred by language"
        />
        <EmptyState icon="&#128187;" message="No language data found" subtext="Check back soon" />
        <SectionFooter href="https://github.com/trending" label="Explore all languages" />
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
      <SectionHeader
        icon="&#128187;"
        iconGradient="bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
        iconBorder="border-blue-500/30"
        title="Language Trends"
        subtitle="Most starred by language"
        timeAgo={timeAgo}
      />

      {/* Bar visualization */}
      <div className="space-y-1.5 sm:space-y-2">
        {languages.slice(0, 5).map((lang) => (
          <LanguageBar key={lang.language} language={lang.language} totalStars={lang.totalStars} maxStars={maxStars} />
        ))}
      </div>

      {/* Grid - Fixed layout without col-span changes */}
      <div className="space-y-2 sm:space-y-3">
        {/* Expanded card shown separately at top if any */}
        {expandedIndex !== null && languages[expandedIndex] && (
          <div className="mb-3">
            <LanguageCard
              data={languages[expandedIndex]}
              index={expandedIndex}
              isExpanded={true}
              onToggle={() => handleToggle(expandedIndex)}
            />
          </div>
        )}

        {/* Grid of collapsed cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {languages.map((lang, index) => (
            expandedIndex !== index && (
              <LanguageCard
                key={lang.language}
                data={lang}
                index={index}
                isExpanded={false}
                onToggle={() => handleToggle(index)}
              />
            )
          ))}
        </div>
      </div>

      <SectionFooter href="https://github.com/trending" label="Explore all languages" />
    </section>
  );
});
