'use client';

import { useMemo, memo } from 'react';
import { SIGNAL_LABELS, type SignalScores } from '@/lib/types';

interface HexagonRadarProps {
  signals: SignalScores;
  size?: number;
  className?: string;
  showLabels?: boolean;
  animated?: boolean;
  tierColor?: string;
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
  // Add padding for labels
  const padding = showLabels ? size * 0.18 : 0;
  const totalSize = size + padding * 2;
  const center = totalSize / 2;
  const radius = size * 0.32;
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

  // Font sizes based on total size
  const labelFontSize = Math.max(10, Math.min(14, totalSize / 30));
  const valueFontSize = Math.max(13, Math.min(18, totalSize / 22));

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      className={`${className} ${animated ? 'radar-chart' : ''}`}
      style={{ overflow: 'visible' }}
    >
      {/* Background hexagon */}
      <path
        d={hexagonPath}
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />

      {/* Grid lines */}
      {gridLines.map((points, gridIndex) => (
        <path
          key={`grid-${gridIndex}`}
          d={points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
          ).join(' ') + ' Z'}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="3,3"
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
          stroke="rgba(255,255,255,0.1)"
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
          r={totalSize >= 400 ? 6 : 5}
          fill={tierColor ?? "#6366F1"}
          stroke="#fff"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {showLabels && labelPositions.map((pos, i) => (
        <g key={`label-${i}`}>
          {/* Label background for better visibility */}
          <text
            x={pos.x}
            y={pos.y - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#71717a"
            fontSize={labelFontSize}
            fontWeight="700"
            letterSpacing="0.08em"
            style={{
              textTransform: 'uppercase',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {pos.label.name}
          </text>
          <text
            x={pos.x}
            y={pos.y + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={valueFontSize}
            fontWeight="800"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {pos.value}
          </text>
        </g>
      ))}

      {/* Gradient and filter definitions */}
      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
          <stop offset="100%" stopColor="rgba(79, 70, 229, 0.4)" />
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
