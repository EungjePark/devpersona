'use client';

import { memo, useMemo } from 'react';
import type { LanguageTrend } from '@/lib/trends/types';

// Language colors mapping
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Zig: '#ec915c',
};

interface LanguageChartProps {
  languages: LanguageTrend[];
}

export const LanguageChart = memo(function LanguageChart({ languages }: LanguageChartProps) {
  const maxPercentage = useMemo(() => Math.max(...languages.map(l => l.percentage)), [languages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>💻</span> Language Distribution
        </h3>
        <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded-md">
          {languages.length} languages
        </span>
      </div>

      {/* Language bars */}
      <div className="space-y-3">
        {languages.map((lang, index) => (
          <div key={lang.name} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: LANGUAGE_COLORS[lang.name] || '#666' }}
                />
                <span className="text-white font-medium">{lang.name}</span>
                {index < 3 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
                    #{index + 1}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-muted">{lang.percentage.toFixed(1)}%</span>
                <span
                  className={`text-xs font-medium ${
                    lang.growth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {lang.growth >= 0 ? '+' : ''}{lang.growth.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                style={{
                  width: `${(lang.percentage / maxPercentage) * 100}%`,
                  backgroundColor: LANGUAGE_COLORS[lang.name] || '#666',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Rising stars */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🚀</span>
          <span className="text-sm font-semibold text-green-400">Fastest Growing</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {languages
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 3)
            .map(lang => (
              <div
                key={lang.name}
                className="px-3 py-1.5 rounded-lg bg-black/20 border border-green-500/30"
              >
                <span className="text-sm text-white font-medium">{lang.name}</span>
                <span className="text-xs text-green-400 ml-2">+{lang.growth.toFixed(1)}%</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
});
