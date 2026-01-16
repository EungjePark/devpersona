'use client';

import { memo, useMemo } from 'react';

interface LanguageData {
  name: string;
  percentage: number;
}

interface LanguageEvolutionProps {
  languages: LanguageData[];
  tierColor: string;
}

// Language color mapping
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  Ruby: '#cc342d',
  PHP: '#777bb4',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#fa7343',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#4fc08d',
  Svelte: '#ff3e00',
};

export const LanguageEvolution = memo(function LanguageEvolution({
  languages,
  tierColor,
}: LanguageEvolutionProps) {
  const topLanguages = useMemo(() => {
    return languages.slice(0, 6);
  }, [languages]);

  const totalPercentage = useMemo(() => {
    return topLanguages.reduce((sum, lang) => sum + lang.percentage, 0);
  }, [topLanguages]);

  if (languages.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No language data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stacked bar chart */}
      <div className="space-y-2">
        <div className="h-8 flex rounded-xl overflow-hidden">
          {topLanguages.map((lang) => {
            const color = LANGUAGE_COLORS[lang.name] || tierColor;
            const width = (lang.percentage / totalPercentage) * 100;

            return (
              <div
                key={lang.name}
                className="relative group transition-all hover:opacity-80"
                style={{
                  width: `${width}%`,
                  backgroundColor: color,
                }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-bg-primary border border-white/10 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {lang.name}: {lang.percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {topLanguages.map((lang) => {
            const color = LANGUAGE_COLORS[lang.name] || tierColor;
            return (
              <div key={lang.name} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-text-secondary">{lang.name}</span>
                <span className="text-xs text-text-muted">({lang.percentage.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Language breakdown bars */}
      <div className="space-y-3">
        {topLanguages.map((lang, index) => {
          const color = LANGUAGE_COLORS[lang.name] || tierColor;
          const rankEmoji = ['🥇', '🥈', '🥉'][index] || `${index + 1}.`;

          return (
            <div key={lang.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{rankEmoji}</span>
                  <span className="text-sm font-medium text-white">{lang.name}</span>
                </div>
                <span className="text-sm text-text-muted">{lang.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${lang.percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary language badge */}
      {topLanguages.length > 0 && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <span className="text-text-muted text-sm">Primary Language:</span>
          <span
            className="font-bold text-lg"
            style={{ color: LANGUAGE_COLORS[topLanguages[0].name] || tierColor }}
          >
            {topLanguages[0].name}
          </span>
        </div>
      )}
    </div>
  );
});
