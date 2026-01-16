'use client';

import { memo, useMemo } from 'react';
import type { SignalScores } from '@/lib/types';
import { formatCompact, getMetricContext, CONTEXT_COLORS_HEX } from '@/lib/format';

// Rough estimate: average lines of code per contribution
const LINES_PER_CONTRIBUTION_ESTIMATE = 25;

interface LanguageData {
  name: string;
  percentage: number;
}

interface CodeOwnershipProps {
  languages: LanguageData[];
  signals: SignalScores;
  totalContributions: number;
  tierColor: string;
}

export const CodeOwnership = memo(function CodeOwnership({
  languages,
  signals,
  totalContributions,
  tierColor,
}: CodeOwnershipProps) {
  // Calculate ownership metrics
  const metrics = useMemo(() => {
    // Language diversity (more languages = higher diversity)
    const diversity = Math.min(100, languages.length * 10);

    // Specialization (top language percentage)
    const specialization = languages[0]?.percentage ?? 0;

    // Estimated lines based on contributions
    const estimatedLines = totalContributions * LINES_PER_CONTRIBUTION_ESTIMATE;

    // Code quality indicator based on craft signal
    const quality = signals.craft;

    return {
      diversity,
      specialization,
      estimatedLines,
      quality,
    };
  }, [languages, signals, totalContributions]);

  // Determine developer style
  const devStyle = useMemo(() => {
    if (metrics.specialization > 70) {
      return { name: 'Specialist', emoji: '🎯', description: 'Deep expertise in one language' };
    } else if (languages.length >= 5) {
      return { name: 'Polyglot', emoji: '🌍', description: 'Comfortable with many languages' };
    } else if (metrics.quality > 70) {
      return { name: 'Craftsman', emoji: '⚒️', description: 'Focus on code quality' };
    } else {
      return { name: 'Generalist', emoji: '🔧', description: 'Balanced skill set' };
    }
  }, [metrics, languages.length]);

  return (
    <div className="space-y-6">
      {/* Developer style badge */}
      <div className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5">
        <div className="text-center">
          <div className="text-4xl mb-2">{devStyle.emoji}</div>
          <div className="text-lg font-bold text-white">{devStyle.name}</div>
          <div className="text-sm text-text-muted mt-1">{devStyle.description}</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Specialization */}
        {(() => {
          const specContext = getMetricContext(metrics.specialization, { excellent: 80, good: 60, average: 40, below: 20 });
          return (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted uppercase">Specialization</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: `${CONTEXT_COLORS_HEX[specContext]}20`, color: CONTEXT_COLORS_HEX[specContext] }}
                  >
                    {specContext === 'excellent' ? 'EXPERT' : specContext === 'good' ? 'HIGH' : 'GROWING'}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: tierColor }}>
                  {Math.round(metrics.specialization)}%
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.specialization}%`,
                    backgroundColor: tierColor,
                  }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                {languages[0]?.name || 'N/A'} expertise
              </p>
            </div>
          );
        })()}

        {/* Diversity */}
        {(() => {
          const divContext = getMetricContext(languages.length, { excellent: 8, good: 5, average: 3, below: 1 });
          return (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted uppercase">Diversity</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: `${CONTEXT_COLORS_HEX[divContext]}20`, color: CONTEXT_COLORS_HEX[divContext] }}
                  >
                    {divContext === 'excellent' ? 'POLYGLOT' : divContext === 'good' ? 'VARIED' : 'FOCUSED'}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {languages.length} langs
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${metrics.diversity}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                Language variety
              </p>
            </div>
          );
        })()}

        {/* Code Quality */}
        {(() => {
          const qualContext = getMetricContext(metrics.quality, { excellent: 80, good: 60, average: 40, below: 20 });
          return (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted uppercase">Quality</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: `${CONTEXT_COLORS_HEX[qualContext]}20`, color: CONTEXT_COLORS_HEX[qualContext] }}
                  >
                    {qualContext === 'excellent' ? 'PRISTINE' : qualContext === 'good' ? 'CLEAN' : 'OK'}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {Math.round(metrics.quality)}
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                  style={{ width: `${metrics.quality}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                Based on CRAFT signal
              </p>
            </div>
          );
        })()}

        {/* Estimated Output */}
        {(() => {
          const outputContext = getMetricContext(metrics.estimatedLines, { excellent: 500000, good: 100000, average: 25000, below: 5000 });
          return (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted uppercase">Output</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: `${CONTEXT_COLORS_HEX[outputContext]}20`, color: CONTEXT_COLORS_HEX[outputContext] }}
                  >
                    {outputContext === 'excellent' ? 'MASSIVE' : outputContext === 'good' ? 'PROLIFIC' : 'GROWING'}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {formatCompact(metrics.estimatedLines, 1)}
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  style={{ width: `${Math.min(100, metrics.estimatedLines / 10000)}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-2" title="Estimated based on contribution count × 25 lines average">
                Est. lines written
              </p>
            </div>
          );
        })()}
      </div>

      {/* Language stack */}
      <div className="space-y-2">
        <h4 className="text-xs text-text-muted uppercase tracking-wider">Language Stack</h4>
        <div className="flex flex-wrap gap-2">
          {languages.slice(0, 8).map((lang, index) => (
            <div
              key={lang.name}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: index === 0 ? `${tierColor}20` : 'rgba(255,255,255,0.03)',
                color: index === 0 ? tierColor : 'rgb(161,161,170)',
                borderWidth: 1,
                borderColor: index === 0 ? `${tierColor}40` : 'rgba(255,255,255,0.05)',
              }}
            >
              {lang.name} ({lang.percentage.toFixed(0)}%)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
