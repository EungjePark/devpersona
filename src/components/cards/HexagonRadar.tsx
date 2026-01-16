'use client';

import { useMemo, memo } from 'react';
import { SIGNAL_LABELS, type SignalScores } from '@/lib/types';

interface HexagonRadarProps {
  signals: SignalScores;
  size?: number;
  className?: string;
  showLabels?: boolean;
  animated?: boolean;
  tierColor?: string; // For tier-based glow effect
}

// Reorder for hexagon display (clockwise from top)
const HEXAGON_ORDER: (keyof SignalScores)[] = [
  'grit',    // Top
  'focus',   // Top-right
  'craft',   // Bottom-right
  'impact',  // Bottom
  'voice',   // Bottom-left
  'reach',   // Top-left
];

export const HexagonRadar = memo(function HexagonRadar({
  signals,
  size = 280,
  className = '',
  showLabels = true,
  animated = true,
  tierColor,
}: HexagonRadarProps) {
  const center = size / 2;
  const radius = size * 0.42;
  const labelRadius = size * 0.54;

  // Calculate hexagon points
  const hexagonPoints = useMemo(() => {
    return HEXAGON_ORDER.map((_, i) => {
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const x = center + radius * Math.cos(angle);
      const y = center - radius * Math.sin(angle);
      return { x, y };
    });
  }, [center, radius]);

  // Calculate data points (scaled by signal values)
  const dataPoints = useMemo(() => {
    return HEXAGON_ORDER.map((key, i) => {
      const value = signals[key] / 100;
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const r = radius * value;
      const x = center + r * Math.cos(angle);
      const y = center - r * Math.sin(angle);
      return { x, y, value: signals[key] };
    });
  }, [signals, center, radius]);

  // Calculate label positions
  const labelPositions = useMemo(() => {
    return HEXAGON_ORDER.map((key, i) => {
      const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
      const x = center + labelRadius * Math.cos(angle);
      const y = center - labelRadius * Math.sin(angle);
      return { x, y, label: SIGNAL_LABELS[key], value: signals[key] };
    });
  }, [signals, center, labelRadius]);

  // Create path strings
  const hexagonPath = hexagonPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  const dataPath = dataPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  // Grid lines (25%, 50%, 75%) - memoized
  const gridLines = useMemo(() => {
    return [0.25, 0.5, 0.75].map(scale => {
      return HEXAGON_ORDER.map((_, i) => {
        const angle = (Math.PI / 2) + (i * (2 * Math.PI / 6));
        const r = radius * scale;
        const x = center + r * Math.cos(angle);
        const y = center - r * Math.sin(angle);
        return { x, y };
      });
    });
  }, [center, radius]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className} ${animated ? 'radar-chart' : ''}`}
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

      {/* Axis lines from center */}
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

      {/* Data polygon */}
      <path
        d={dataPath}
        fill="url(#radarGradient)"
        stroke={tierColor ?? "rgba(99, 102, 241, 0.9)"}
        strokeWidth="2.5"
        filter={tierColor ? "url(#tierGlow)" : undefined}
        className={animated ? 'transition-all duration-700 ease-out' : ''}
      />

      {/* Data points */}
      {dataPoints.map((point, i) => (
        <circle
          key={`point-${i}`}
          cx={point.x}
          cy={point.y}
          r={size >= 280 ? 5 : 4}
          fill={tierColor ?? "#6366F1"}
          stroke="#fff"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {showLabels && labelPositions.map((pos, i) => (
        <g key={`label-${i}`}>
          <text
            x={pos.x}
            y={pos.y - 8}
            textAnchor="middle"
            className="fill-text-secondary text-[10px] font-semibold tracking-wider uppercase"
          >
            {pos.label.name}
          </text>
          <text
            x={pos.x}
            y={pos.y + 8}
            textAnchor="middle"
            className="fill-text-primary text-[13px] font-bold"
          >
            {pos.value}
          </text>
        </g>
      ))}

      {/* Gradient and filter definitions */}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.35)" />
          <stop offset="100%" stopColor="rgba(79, 70, 229, 0.35)" />
        </linearGradient>
        {tierColor && (
          <filter id="tierGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feFlood floodColor={tierColor} floodOpacity="0.5" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
    </svg>
  );
});
