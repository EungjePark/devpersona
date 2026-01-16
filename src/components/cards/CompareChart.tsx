'use client';

import { useMemo } from 'react';
import { SIGNAL_LABELS, type SignalScores } from '@/lib/types';

interface CompareChartProps {
  userA: {
    username: string;
    signals: SignalScores;
    avatarUrl?: string;
    tierColor?: string;
  };
  userB: {
    username: string;
    signals: SignalScores;
    avatarUrl?: string;
    tierColor?: string;
  };
  size?: number;
  className?: string;
}

// Hexagon order (clockwise from top)
const HEXAGON_ORDER: (keyof SignalScores)[] = [
  'grit', 'focus', 'craft', 'impact', 'voice', 'reach',
];

export function CompareChart({
  userA,
  userB,
  size = 400,
  className = '',
}: CompareChartProps) {
  const center = size / 2;
  const radius = size * 0.34;
  const labelRadius = size * 0.46;

  // Calculate hexagon points
  const hexagonPoints = useMemo(() => {
    return HEXAGON_ORDER.map((_, i) => {
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const x = center + radius * Math.cos(angle);
      const y = center - radius * Math.sin(angle);
      return { x, y };
    });
  }, [center, radius]);

  // Calculate data points for both users
  const dataPointsA = useMemo(() => {
    return HEXAGON_ORDER.map((key, i) => {
      const value = userA.signals[key] / 100;
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const r = radius * value;
      const x = center + r * Math.cos(angle);
      const y = center - r * Math.sin(angle);
      return { x, y, value: userA.signals[key], key };
    });
  }, [userA.signals, center, radius]);

  const dataPointsB = useMemo(() => {
    return HEXAGON_ORDER.map((key, i) => {
      const value = userB.signals[key] / 100;
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const r = radius * value;
      const x = center + r * Math.cos(angle);
      const y = center - r * Math.sin(angle);
      return { x, y, value: userB.signals[key], key };
    });
  }, [userB.signals, center, radius]);

  // Label positions with comparison values
  const labelPositions = useMemo(() => {
    return HEXAGON_ORDER.map((key, i) => {
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const x = center + labelRadius * Math.cos(angle);
      const y = center - labelRadius * Math.sin(angle);
      const valueA = userA.signals[key];
      const valueB = userB.signals[key];
      const diff = valueA - valueB;
      return { x, y, label: SIGNAL_LABELS[key], valueA, valueB, diff, key };
    });
  }, [userA.signals, userB.signals, center, labelRadius]);

  // Create path strings
  const hexagonPath = hexagonPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  const dataPathA = dataPointsA.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  const dataPathB = dataPointsB.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75].map(scale => {
    return HEXAGON_ORDER.map((_, i) => {
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const r = radius * scale;
      const x = center + r * Math.cos(angle);
      const y = center - r * Math.sin(angle);
      return { x, y };
    });
  });

  const colorA = userA.tierColor ?? '#6366F1';
  const colorB = userB.tierColor ?? '#f97316';

  return (
    <div className={`relative ${className}`}>
      {/* Legend */}
      <div className="flex justify-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorA }} />
          <span className="text-sm font-medium text-text-primary">@{userA.username}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorB }} />
          <span className="text-sm font-medium text-text-primary">@{userB.username}</span>
        </div>
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        {/* Background hexagon */}
        <path
          d={hexagonPath}
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* Grid lines */}
        {gridLines.map((points, gridIndex) => (
          <path
            key={`grid-${gridIndex}`}
            d={points.map((p, i) =>
              `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ') + ' Z'}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Axis lines */}
        {hexagonPoints.map((point, i) => (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}

        {/* User B data polygon (behind) */}
        <path
          d={dataPathB}
          fill={`${colorB}20`}
          stroke={colorB}
          strokeWidth="2"
          className="transition-all duration-500"
        />

        {/* User A data polygon (front) */}
        <path
          d={dataPathA}
          fill={`${colorA}25`}
          stroke={colorA}
          strokeWidth="2.5"
          className="transition-all duration-500"
        />

        {/* Data points for User A */}
        {dataPointsA.map((point, i) => (
          <circle
            key={`pointA-${i}`}
            cx={point.x}
            cy={point.y}
            r={5}
            fill={colorA}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}

        {/* Data points for User B */}
        {dataPointsB.map((point, i) => (
          <circle
            key={`pointB-${i}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={colorB}
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}

        {/* Labels with comparison */}
        {labelPositions.map((pos, i) => (
          <g key={`label-${i}`}>
            <text
              x={pos.x}
              y={pos.y - 16}
              textAnchor="middle"
              className="fill-text-secondary text-[10px] font-bold tracking-wide"
            >
              {pos.label.name}
            </text>
            {/* User A value */}
            <text
              x={pos.x - 12}
              y={pos.y + 4}
              textAnchor="middle"
              className="text-[11px] font-bold"
              fill={colorA}
            >
              {pos.valueA}
            </text>
            {/* vs separator */}
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              className="fill-text-muted text-[9px]"
            >
              vs
            </text>
            {/* User B value */}
            <text
              x={pos.x + 12}
              y={pos.y + 4}
              textAnchor="middle"
              className="text-[11px] font-bold"
              fill={colorB}
            >
              {pos.valueB}
            </text>
            {/* Diff indicator */}
            {pos.diff !== 0 && (
              <text
                x={pos.x}
                y={pos.y + 16}
                textAnchor="middle"
                className={`text-[9px] font-bold ${pos.diff > 0 ? 'fill-green-400' : 'fill-red-400'}`}
              >
                {pos.diff > 0 ? `+${pos.diff}` : pos.diff}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Stats comparison table */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {HEXAGON_ORDER.map((key) => {
          const label = SIGNAL_LABELS[key];
          const valueA = userA.signals[key];
          const valueB = userB.signals[key];
          const diff = valueA - valueB;
          const maxValue = Math.max(valueA, valueB);

          return (
            <div key={key} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-secondary">{label.emoji} {label.name}</span>
                <span className={`text-xs font-bold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                  {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                </span>
              </div>
              {/* Comparison bars */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(valueA / 100) * 100}%`,
                        backgroundColor: colorA,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8" style={{ color: colorA }}>{valueA}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(valueB / 100) * 100}%`,
                        backgroundColor: colorB,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8" style={{ color: colorB }}>{valueB}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
