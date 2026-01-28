'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  /** Target value to count to */
  value: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix string (e.g., "$", "+") */
  prefix?: string;
  /** Suffix string (e.g., "%", "K") */
  suffix?: string;
  /** Format as compact number (1.2K, 3.4M) */
  compact?: boolean;
  /** Locale for number formatting */
  locale?: string;
  /** CSS class name */
  className?: string;
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';
  /** Whether to use monospace font */
  mono?: boolean;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Start animation when element is in viewport */
  animateOnView?: boolean;
}

const VARIANT_COLORS = {
  default: 'text-text-primary',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
  primary: 'text-primary-400',
};

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
  '2xl': 'text-5xl',
  hero: 'text-6xl sm:text-7xl',
};

/**
 * Animated Counter - Smooth number animation with formatting
 * Inspired by aliimam.in/components/counter-number
 */
export function AnimatedCounter({
  value,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  compact = false,
  locale = 'en-US',
  className,
  variant = 'default',
  size = 'lg',
  mono = true,
  delay = 0,
  animateOnView = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Format number with locale and compact notation
  const formatNumber = (num: number): string => {
    if (compact) {
      const formatter = new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
      });
      return formatter.format(num);
    }

    return num.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Easing function (ease-out cubic)
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  // Animation logic
  const animate = () => {
    const startTime = performance.now();
    const startValue = displayValue;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = startValue + (value - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);
  };

  // Intersection Observer for animateOnView
  useEffect(() => {
    if (!animateOnView) {
      timeoutRef.current = setTimeout(animate, delay);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            timeoutRef.current = setTimeout(animate, delay);
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, hasAnimated, animateOnView]);

  // Re-animate when value changes (only for animateOnView mode after initial animation)
  useEffect(() => {
    if (animateOnView && hasAnimated) {
      animate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span
      ref={ref}
      className={cn(
        'font-bold tabular-nums tracking-tight',
        VARIANT_COLORS[variant],
        SIZE_CLASSES[size],
        mono && 'font-mono',
        className
      )}
    >
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}

/**
 * Counter with label - Convenience wrapper
 */
export function CounterWithLabel({
  value,
  label,
  ...props
}: AnimatedCounterProps & { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <AnimatedCounter value={value} {...props} />
      <span className="text-xs text-text-muted uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

/**
 * Stats Grid - Display multiple counters
 */
export function StatsGrid({
  stats,
  columns = 4,
  className,
}: {
  stats: Array<{
    value: number;
    label: string;
    prefix?: string;
    suffix?: string;
    compact?: boolean;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <CounterWithLabel
          key={index}
          value={stat.value}
          label={stat.label}
          prefix={stat.prefix}
          suffix={stat.suffix}
          compact={stat.compact}
          delay={index * 100}
          size="xl"
        />
      ))}
    </div>
  );
}
