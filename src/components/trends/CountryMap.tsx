'use client';

import { memo, useMemo } from 'react';
import type { CountryStat } from '@/lib/trends/types';

interface CountryMapProps {
  countries: CountryStat[];
}

// Country flag emojis
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  CN: '🇨🇳',
  IN: '🇮🇳',
  DE: '🇩🇪',
  GB: '🇬🇧',
  BR: '🇧🇷',
  JP: '🇯🇵',
  KR: '🇰🇷',
  FR: '🇫🇷',
  CA: '🇨🇦',
  RU: '🇷🇺',
  AU: '🇦🇺',
};

export const CountryMap = memo(function CountryMap({ countries }: CountryMapProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const maxDevelopers = useMemo(
    () => Math.max(...countries.map(c => c.developers)),
    [countries]
  );

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => b.developers - a.developers),
    [countries]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2 uppercase tracking-wider">
          <span>🌍</span> Developer Distribution
        </h3>
        <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded-md">
          By country
        </span>
      </div>

      {/* Country list */}
      <div className="space-y-3">
        {sortedCountries.map((country, index) => (
          <div key={country.code} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <span className="text-xl">{COUNTRY_FLAGS[country.code] || '🏳️'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">{country.country}</span>
                    {index < 3 && (
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded font-bold
                        ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                          index === 1 ? 'bg-slate-400/20 text-slate-300' :
                          'bg-orange-500/20 text-orange-400'}
                      `}>
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-2">
                    <span>Top: {country.topLanguage}</span>
                    <span>•</span>
                    <span>Avg: {country.avgContributions}/yr</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  {formatNumber(country.developers)}
                </div>
                <div className="text-xs text-text-muted">developers</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:opacity-80"
                style={{ width: `${(country.developers / maxDevelopers) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="text-3xl font-black text-white">
            {formatNumber(countries.reduce((sum, c) => sum + c.developers, 0))}
          </div>
          <div className="text-xs text-text-muted uppercase mt-1">Total Developers</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <div className="text-3xl font-black text-white">
            {Math.round(countries.reduce((sum, c) => sum + c.avgContributions, 0) / countries.length)}
          </div>
          <div className="text-xs text-text-muted uppercase mt-1">Avg Contributions/Yr</div>
        </div>
      </div>
    </div>
  );
});
