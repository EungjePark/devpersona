'use client';

import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  icon: ReactNode;
  iconGradient: string;
  iconBorder: string;
  title: string;
  subtitle: string;
  timeAgo?: string | null;
}

export const SectionHeader = memo(function SectionHeader({
  icon,
  iconGradient,
  iconBorder,
  title,
  subtitle,
  timeAgo,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center',
            iconGradient,
            iconBorder
          )}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>
      {timeAgo && (
        <span className="text-[10px] text-text-muted bg-bg-elevated px-2 py-1 rounded-full border border-glass-border">
          Updated {timeAgo}
        </span>
      )}
    </div>
  );
});

interface SectionFooterProps {
  href: string;
  label: string;
}

export const SectionFooter = memo(function SectionFooter({ href, label }: SectionFooterProps) {
  return (
    <div className="pt-4 border-t border-glass-border text-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium inline-flex items-center gap-1"
      >
        {label}
        <ExternalLinkIcon />
      </a>
    </div>
  );
});

export const ExternalLinkIcon = memo(function ExternalLinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
});

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  subtext?: string;
}

export const EmptyState = memo(function EmptyState({ icon, message, subtext }: EmptyStateProps) {
  return (
    <div className="py-12 text-center space-y-2">
      <div className="text-4xl opacity-50">{icon}</div>
      <p className="text-sm text-text-muted">{message}</p>
      {subtext && <p className="text-xs text-text-muted/60">{subtext}</p>}
    </div>
  );
});

interface RankBadgeProps {
  index: number;
  size?: 'sm' | 'md';
}

export const RankBadge = memo(function RankBadge({ index, size = 'sm' }: RankBadgeProps) {
  const sizeClasses = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs';

  if (index === 0) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold',
          'bg-gradient-to-br from-amber-400 to-orange-500 text-black',
          sizeClasses
        )}
      >
        1
      </div>
    );
  }
  if (index === 1) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold',
          'bg-gradient-to-br from-slate-300 to-slate-400 text-black',
          sizeClasses
        )}
      >
        2
      </div>
    );
  }
  if (index === 2) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold',
          'bg-gradient-to-br from-orange-400 to-amber-600 text-black',
          sizeClasses
        )}
      >
        3
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold',
        'bg-bg-elevated text-text-muted border border-glass-border',
        sizeClasses
      )}
    >
      {index + 1}
    </div>
  );
});
