'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NpmPackage, PatternInfo } from '@/lib/types';
import { formatDownloads } from '@/lib/npm/client';
import { cn } from '@/lib/utils';

// npm Impact Card
interface NpmCardProps {
  packages: NpmPackage[];
  className?: string;
}

export function NpmCard({ packages, className }: NpmCardProps) {
  const totalDownloads = packages.reduce((sum, pkg) => sum + pkg.downloads, 0);
  const topPackage = packages[0];

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>📦</span> npm IMPACT
        </CardTitle>
      </CardHeader>
      <CardContent>
        {packages.length > 0 ? (
          <>
            <div className="text-2xl font-bold text-text-primary">
              {packages.length} packages
            </div>
            <div className="text-sm text-text-secondary mt-1">
              📥 {formatDownloads(totalDownloads)} downloads/mo
            </div>
            {topPackage && (
              <div className="mt-3 p-2 rounded bg-bg-tertiary">
                <p className="text-xs text-text-muted">Top package:</p>
                <p className="text-sm font-medium text-text-primary truncate">
                  {topPackage.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatDownloads(topPackage.downloads)}/mo
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-text-muted">
            No npm packages found
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hacker News Voice Card
interface HNCardProps {
  points: number;
  comments: number;
  topPost?: string;
  className?: string;
}

export function HNCard({ points, comments, topPost, className }: HNCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>💬</span> HN VOICE
        </CardTitle>
      </CardHeader>
      <CardContent>
        {points > 0 || comments > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {points.toLocaleString()}
                </div>
                <div className="text-xs text-text-muted">karma</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {comments.toLocaleString()}
                </div>
                <div className="text-xs text-text-muted">comments</div>
              </div>
            </div>
            {topPost && (
              <div className="mt-3 p-2 rounded bg-bg-tertiary">
                <p className="text-xs text-text-muted">Top post:</p>
                <p className="text-sm text-text-primary line-clamp-2">
                  &quot;{topPost}&quot;
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-text-muted">
            No Hacker News activity
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Languages Card
interface LanguagesCardProps {
  languages: { name: string; percentage: number }[];
  className?: string;
}

export function LanguagesCard({ languages, className }: LanguagesCardProps) {
  // Language colors
  const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3776ab',
    Rust: '#dea584',
    Go: '#00add8',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>💻</span> LANGUAGES
        </CardTitle>
      </CardHeader>
      <CardContent>
        {languages.length > 0 ? (
          <div className="space-y-2">
            {languages.map((lang) => (
              <div key={lang.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: LANG_COLORS[lang.name] || '#6b7280',
                  }}
                />
                <span className="flex-1 text-sm text-text-primary">
                  {lang.name}
                </span>
                <span className="text-sm text-text-muted">
                  {lang.percentage}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-text-muted">No languages detected</div>
        )}
      </CardContent>
    </Card>
  );
}

// Activity Pattern Card
interface PatternCardProps {
  pattern: PatternInfo;
  peakTime?: string;
  className?: string;
}

export function PatternCard({ pattern, peakTime, className }: PatternCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>⏰</span> ACTIVITY
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{pattern.emoji}</span>
          <div>
            <div className="text-lg font-bold text-text-primary">
              {pattern.name}
            </div>
            <div className="text-sm text-text-secondary">
              {pattern.description}
            </div>
          </div>
        </div>
        {peakTime && (
          <div className="mt-3 p-2 rounded bg-bg-tertiary">
            <p className="text-xs text-text-muted">Peak activity:</p>
            <p className="text-sm font-medium text-text-primary">
              {peakTime}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Roast Card with re-roll
interface RoastCardProps {
  roast: string;
  onReroll?: () => void;
  className?: string;
}

export function RoastCard({ roast, onReroll, className }: RoastCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>🔥</span> ROAST
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary italic mb-3">
          &quot;{roast}&quot;
        </p>
        {onReroll && (
          <button
            onClick={onReroll}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            [Re-roll]
          </button>
        )}
      </CardContent>
    </Card>
  );
}
