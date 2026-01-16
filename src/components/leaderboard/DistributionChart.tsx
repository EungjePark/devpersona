"use client";

import { useMemo, useState } from "react";
import { TIERS } from "@/lib/types";

interface LeaderboardSnapshot {
  distribution: Array<{ bucket: string; count: number }>;
  totalUsers: number;
  topUsers: Array<{ username: string; avatarUrl: string; overallRating: number; tier: string }>;
}

interface DistributionChartProps {
  buckets?: Array<{ bucket: string; count: number }>;
  currentRating: number;
  totalUsers?: number;
  compareRating?: number;
  snapshot?: LeaderboardSnapshot;
  variant?: 'default' | 'wide';
}

// Chart dimensions
const DEFAULT_CHART_WIDTH = 380;
const WIDE_CHART_WIDTH = 800;
const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 35, right: 20, bottom: 45, left: 20 };
const BAR_GAP = 2;

export function DistributionChart({
  buckets: bucketsProp,
  currentRating,
  totalUsers: totalUsersProp,
  compareRating,
  snapshot,
  variant = 'default',
}: DistributionChartProps): React.ReactNode {
  // Support both direct props and snapshot prop
  const buckets = bucketsProp ?? snapshot?.distribution ?? [];
  const totalUsers = totalUsersProp ?? snapshot?.totalUsers ?? 0;

  const CHART_WIDTH = variant === 'wide' ? WIDE_CHART_WIDTH : DEFAULT_CHART_WIDTH;
  const INNER_WIDTH = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate chart data
  const chartData = useMemo(() => {
    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    const barWidth = (INNER_WIDTH - (buckets.length - 1) * BAR_GAP) / buckets.length;

    const bars = buckets.map((bucket, i) => {
      const bucketStart = parseInt(bucket.bucket.split("-")[0]);
      const height = (bucket.count / maxCount) * INNER_HEIGHT;
      const x = CHART_PADDING.left + i * (barWidth + BAR_GAP);
      const y = CHART_PADDING.top + INNER_HEIGHT - height;

      // Determine tier color
      let tierKey: 'S' | 'A' | 'B' | 'C' = 'C';
      if (bucketStart >= 90) tierKey = 'S';
      else if (bucketStart >= 75) tierKey = 'A';
      else if (bucketStart >= 50) tierKey = 'B';

      const isUserBucket = currentRating >= bucketStart && currentRating < bucketStart + 10;
      const isCompareBucket = compareRating !== undefined && compareRating >= bucketStart && compareRating < bucketStart + 10;

      return {
        ...bucket,
        x,
        y,
        width: barWidth,
        height,
        color: TIERS[tierKey].color,
        tierKey,
        isUserBucket,
        isCompareBucket,
        bucketStart,
        percentage: totalUsers > 0 ? ((bucket.count / totalUsers) * 100).toFixed(1) : "0",
      };
    });

    // Generate smooth curve points for overlay
    const curvePoints = bars.map((bar, i) => {
      const x = bar.x + bar.width / 2;
      const y = bar.y;
      return { x, y };
    });

    // Create bezier curve path
    let curvePath = '';
    if (curvePoints.length > 1) {
      curvePath = `M ${curvePoints[0].x} ${curvePoints[0].y}`;
      for (let i = 1; i < curvePoints.length; i++) {
        const prev = curvePoints[i - 1];
        const curr = curvePoints[i];
        const cpX = (prev.x + curr.x) / 2;
        curvePath += ` Q ${cpX} ${prev.y}, ${curr.x} ${curr.y}`;
      }
    }

    // Curve fill path
    const curveFillPath = curvePath +
      ` L ${curvePoints[curvePoints.length - 1].x} ${CHART_PADDING.top + INNER_HEIGHT}` +
      ` L ${curvePoints[0].x} ${CHART_PADDING.top + INNER_HEIGHT} Z`;

    return { bars, maxCount, barWidth, curvePath, curveFillPath };
  }, [buckets, currentRating, compareRating, totalUsers]);

  // User tier color
  const userTierColor =
    currentRating >= 90
      ? TIERS.S.color
      : currentRating >= 75
        ? TIERS.A.color
        : currentRating >= 50
          ? TIERS.B.color
          : TIERS.C.color;

  // Compare tier color
  const compareTierColor = compareRating !== undefined
    ? compareRating >= 90
      ? TIERS.S.color
      : compareRating >= 75
        ? TIERS.A.color
        : compareRating >= 50
          ? TIERS.B.color
          : TIERS.C.color
    : '#f97316';

  // Calculate positions
  const userMarkerX = CHART_PADDING.left + (currentRating / 100) * INNER_WIDTH;
  const compareMarkerX = compareRating !== undefined
    ? CHART_PADDING.left + (compareRating / 100) * INNER_WIDTH
    : null;

  // Calculate percentile
  const percentile = useMemo(() => {
    let belowCount = 0;
    for (const bucket of buckets) {
      const bucketStart = parseInt(bucket.bucket.split("-")[0]);
      if (bucketStart < currentRating) {
        belowCount += bucket.count;
      } else if (currentRating >= bucketStart && currentRating < bucketStart + 10) {
        belowCount += bucket.count * ((currentRating - bucketStart) / 10);
      }
    }
    return totalUsers > 0 ? Math.round((belowCount / totalUsers) * 100) : 0;
  }, [buckets, currentRating, totalUsers]);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient for curve fill - More subtle */}
          <linearGradient id="curveFillGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={TIERS.C.color} stopOpacity="0.05" />
            <stop offset="50%" stopColor={TIERS.B.color} stopOpacity="0.1" />
            <stop offset="75%" stopColor={TIERS.A.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={TIERS.S.color} stopOpacity="0.2" />
          </linearGradient>

          {/* Gradient for curve stroke - Thinner/Sharper */}
          <linearGradient id="curveStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={TIERS.C.color} stopOpacity="0.5" />
            <stop offset="50%" stopColor={TIERS.B.color} stopOpacity="0.8" />
            <stop offset="75%" stopColor={TIERS.A.color} stopOpacity="1" />
            <stop offset="100%" stopColor={TIERS.S.color} stopOpacity="1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tier zone backgrounds - Very subtle for 'Linear' look */}
        {[
          { start: 0, end: 50, color: TIERS.C.color, opacity: 0.02 },
          { start: 50, end: 75, color: TIERS.B.color, opacity: 0.03 },
          { start: 75, end: 90, color: TIERS.A.color, opacity: 0.04 },
          { start: 90, end: 100, color: TIERS.S.color, opacity: 0.05 },
        ].map((zone, i) => (
          <rect
            key={i}
            x={CHART_PADDING.left + (zone.start / 100) * INNER_WIDTH}
            y={CHART_PADDING.top}
            width={((zone.end - zone.start) / 100) * INNER_WIDTH}
            height={INNER_HEIGHT}
            fill={zone.color}
            opacity={zone.opacity}
          />
        ))}

        {/* Bars */}
        {chartData.bars.map((bar, i) => {
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={Math.max(bar.height, 2)}
                fill={bar.color}
                opacity={isHovered ? 0.8 : 0.3} // Increased transparency for unhovered
                rx={2}
                className="transition-all duration-150"
              />

              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={Math.min(Math.max(bar.x + bar.width / 2 - 35, CHART_PADDING.left), CHART_WIDTH - CHART_PADDING.right - 70)}
                    y={bar.y - 40}
                    width={70}
                    height={32}
                    rx={6}
                    fill="#09090b"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1"
                  />
                  <text
                    x={bar.x + bar.width / 2}
                    y={bar.y - 27}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {bar.bucket}
                  </text>
                  <text
                    x={bar.x + bar.width / 2}
                    y={bar.y - 14}
                    textAnchor="middle"
                    fill={bar.color}
                    fontSize="9"
                  >
                    {bar.percentage}%
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Smooth curve overlay */}
        <path
          d={chartData.curveFillPath}
          fill="url(#curveFillGradient)"
        />
        <path
          d={chartData.curvePath}
          fill="none"
          stroke="url(#curveStrokeGradient)"
          strokeWidth="2" // Thinner
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Compare marker (if exists) - render first so user is on top */}
        {compareMarkerX !== null && (
          <g opacity="0.8">
            <line
              x1={compareMarkerX}
              y1={CHART_PADDING.top}
              x2={compareMarkerX}
              y2={CHART_PADDING.top + INNER_HEIGHT}
              stroke="#f97316"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <circle
              cx={compareMarkerX}
              cy={CHART_PADDING.top + INNER_HEIGHT}
              r="4"
              fill="#09090b"
              stroke="#f97316"
              strokeWidth="1.5"
            />
            <text
              x={compareMarkerX}
              y={CHART_PADDING.top - 8}
              textAnchor="middle"
              fill="#f97316"
              fontSize="10"
              fontWeight="bold"
            >
              {compareRating}
            </text>
          </g>
        )}

        {/* User marker - Refined */}
        <g filter="url(#markerGlow)">
          <line
            x1={userMarkerX}
            y1={CHART_PADDING.top}
            x2={userMarkerX}
            y2={CHART_PADDING.top + INNER_HEIGHT}
            stroke={userTierColor}
            strokeWidth="2"
            strokeDasharray="2 2" // Dashed line for modern feel
          />
          <circle
            cx={userMarkerX}
            cy={CHART_PADDING.top + INNER_HEIGHT}
            r="4"
            fill={userTierColor}
          />
          <rect
            x={userMarkerX - 16}
            y={CHART_PADDING.top - 26}
            width={32}
            height={18}
            rx={6}
            fill={userTierColor}
          />
          <text
            x={userMarkerX}
            y={CHART_PADDING.top - 13}
            textAnchor="middle"
            fill="#09090b" // Dark text on bright badge for contrast
            fontSize="10"
            fontWeight="bold"
          >
            {currentRating}
          </text>
        </g>

        {/* X-axis */}
        <line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top + INNER_HEIGHT}
          x2={CHART_PADDING.left + INNER_WIDTH}
          y2={CHART_PADDING.top + INNER_HEIGHT}
          stroke="rgba(255,255,255,0.1)"
        />

        {/* X-axis labels */}
        {[0, 50, 100].map((val) => (
          <text
            key={val}
            x={CHART_PADDING.left + (val / 100) * INNER_WIDTH}
            y={CHART_HEIGHT - 22}
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
            textAnchor="middle"
          >
            {val}
          </text>
        ))}

        {/* Tier labels at bottom */}
        <g>
          {[
            { label: 'C', x: 0.25, color: TIERS.C.color },
            { label: 'B', x: 0.625, color: TIERS.B.color },
            { label: 'A', x: 0.825, color: TIERS.A.color },
            { label: 'S', x: 0.95, color: TIERS.S.color },
          ].map((t) => (
            <text
              key={t.label}
              x={CHART_PADDING.left + t.x * INNER_WIDTH}
              y={CHART_HEIGHT - 8}
              fill={t.color}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              opacity="0.7"
            >
              {t.label}
            </text>
          ))}
        </g>
      </svg>

      {/* Stats footer */}
      <div className="flex items-center justify-between mt-2 px-1 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: userTierColor }} />
          <span className="text-text-muted">You:</span>
          <span className="font-bold" style={{ color: userTierColor }}>Top {100 - percentile}%</span>
        </div>
        {compareRating !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-text-muted">Rival</span>
          </div>
        )}
        <span className="text-text-muted">{totalUsers.toLocaleString()} devs</span>
      </div>
    </div>
  );
}
