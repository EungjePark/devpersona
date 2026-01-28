'use client';

import { cn } from '@/lib/utils';
import { useEffect, useId, useRef, useState } from 'react';

interface GaugeProps {
  /** Value from 0 to 100 */
  value: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Gauge type */
  type?: 'full' | 'half' | 'quarter';
  /** Show value label */
  showValue?: boolean;
  /** Value label suffix */
  suffix?: string;
  /** Primary color or gradient */
  color?: string | string[];
  /** Background track color */
  trackColor?: string;
  /** Enable glow effect */
  glow?: boolean;
  /** Show tick marks */
  showTicks?: boolean;
  /** Number of ticks */
  tickCount?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Label text */
  label?: string;
  /** CSS class */
  className?: string;
  /** Animate on view */
  animateOnView?: boolean;
}

/**
 * Gauge - Animated circular gauge component
 * Inspired by aliimam.in/components/gauge
 */
export function Gauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  type = 'full',
  showValue = true,
  suffix = '',
  color = '#8b5cf6',
  trackColor = 'rgba(255,255,255,0.1)',
  glow = true,
  showTicks = false,
  tickCount = 10,
  duration = 1500,
  label,
  className,
  animateOnView = true,
}: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  const rafIdRef = useRef<number>(undefined);
  const uniqueId = useId();

  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (animatedValue / max) * 100;

  // Calculate arc parameters based on type
  const getArcConfig = () => {
    switch (type) {
      case 'half':
        return { startAngle: 180, endAngle: 360, viewBoxHeight: size / 2 + strokeWidth };
      case 'quarter':
        return { startAngle: 180, endAngle: 270, viewBoxHeight: size / 2 + strokeWidth };
      default:
        return { startAngle: 135, endAngle: 405, viewBoxHeight: size };
    }
  };

  const { startAngle, endAngle, viewBoxHeight } = getArcConfig();
  const totalAngle = endAngle - startAngle;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Convert angle to coordinates
  const polarToCartesian = (angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians),
    };
  };

  // Create arc path
  const createArc = (start: number, end: number) => {
    const startPoint = polarToCartesian(start);
    const endPoint = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;

    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  };

  // Get gradient ID or solid color
  const gradientId = `gauge-gradient-${uniqueId}`;
  const isGradient = Array.isArray(color);
  const strokeColor = isGradient ? `url(#${gradientId})` : color;

  // Easing function
  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

  // Animation
  useEffect(() => {
    const animate = (startValue: number) => {
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        setAnimatedValue(startValue + (normalizedValue - startValue) * easedProgress);

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(step);
        }
      };

      rafIdRef.current = requestAnimationFrame(step);
    };

    if (!animateOnView) {
      animate(animatedValue);
      return () => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animate(0);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedValue, hasAnimated, animateOnView]);

  // Calculate current angle based on percentage
  const currentAngle = startAngle + (percentage / 100) * totalAngle;
  const trackPath = createArc(startAngle, endAngle);
  const valuePath = createArc(startAngle, Math.max(startAngle + 0.1, currentAngle));

  // Generate tick marks
  const ticks = showTicks
    ? Array.from({ length: tickCount + 1 }, (_, i) => {
        const angle = startAngle + (i / tickCount) * totalAngle;
        const outerPoint = polarToCartesian(angle);
        const innerRadius = radius - strokeWidth / 2 - 4;
        const innerRadians = ((angle - 90) * Math.PI) / 180;
        const innerPoint = {
          x: center + innerRadius * Math.cos(innerRadians),
          y: center + innerRadius * Math.sin(innerRadians),
        };
        return { outer: outerPoint, inner: innerPoint };
      })
    : [];

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg
        ref={ref}
        width={size}
        height={viewBoxHeight}
        viewBox={`0 0 ${size} ${type === 'full' ? size : size / 2 + strokeWidth * 2}`}
        className="overflow-visible"
      >
        {/* Gradient definition */}
        {isGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {(color as string[]).map((c, i) => (
                <stop
                  key={i}
                  offset={`${color.length === 1 ? 0 : (i / (color.length - 1)) * 100}%`}
                  stopColor={c}
                />
              ))}
            </linearGradient>
          </defs>
        )}

        {/* Glow filter */}
        {glow && (
          <defs>
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}

        {/* Background track */}
        <path
          d={trackPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
          />
        ))}

        {/* Value arc */}
        <path
          d={valuePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={glow ? `url(#glow-${gradientId})` : undefined}
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>

      {/* Center value */}
      {showValue && (
        <div
          className={cn(
            'absolute flex flex-col items-center justify-center',
            type === 'full' ? 'inset-0' : 'bottom-0 left-0 right-0'
          )}
          style={{ height: type === 'full' ? '100%' : strokeWidth * 2 + 20 }}
        >
          <span
            className="font-bold tabular-nums"
            style={{
              fontSize: size / 4,
              color: isGradient ? (color as string[])[0] : (color as string),
            }}
          >
            {Math.round(animatedValue)}
            {suffix}
          </span>
          {label && (
            <span className="text-xs text-text-muted uppercase tracking-wider">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Signal Gauge - Specialized for DevPersona's 6 signals
 */
export function SignalGauge({
  signal,
  value,
  size = 80,
  className,
}: {
  signal: 'voice' | 'impact' | 'reach' | 'grit' | 'focus' | 'craft';
  value: number;
  size?: number;
  className?: string;
}) {
  const signalConfig = {
    voice: { color: '#22c55e', emoji: '🗣️', label: 'Voice' },
    impact: { color: '#f59e0b', emoji: '🚀', label: 'Impact' },
    reach: { color: '#06b6d4', emoji: '🌐', label: 'Reach' },
    grit: { color: '#ef4444', emoji: '💪', label: 'Grit' },
    focus: { color: '#8b5cf6', emoji: '🎯', label: 'Focus' },
    craft: { color: '#ec4899', emoji: '⚒️', label: 'Craft' },
  };

  const config = signalConfig[signal];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Gauge
        value={value}
        size={size}
        strokeWidth={6}
        color={config.color}
        type="half"
        showValue={true}
        glow={true}
      />
      <div className="flex items-center gap-1 text-sm">
        <span>{config.emoji}</span>
        <span className="text-text-secondary">{config.label}</span>
      </div>
    </div>
  );
}

/**
 * Multi-ring Gauge - Multiple values in concentric rings
 */
export function MultiRingGauge({
  rings,
  size = 150,
  className,
}: {
  rings: Array<{
    value: number;
    max?: number;
    color: string;
    label?: string;
  }>;
  size?: number;
  className?: string;
}) {
  const strokeWidth = 8;
  const gap = 6;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      {rings.map((ring, index) => {
        const ringSize = size - index * (strokeWidth + gap) * 2;
        const offset = index * (strokeWidth + gap);

        return (
          <div
            key={index}
            className="absolute"
            style={{
              top: offset,
              left: offset,
            }}
          >
            <Gauge
              value={ring.value}
              max={ring.max}
              size={ringSize}
              strokeWidth={strokeWidth}
              color={ring.color}
              showValue={false}
              glow={index === 0}
            />
          </div>
        );
      })}

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-bold text-white">
            {Math.round(rings.length > 0 ? rings.reduce((sum, r) => sum + r.value, 0) / rings.length : 0)}
          </span>
          <span className="block text-xs text-text-muted">AVG</span>
        </div>
      </div>
    </div>
  );
}
