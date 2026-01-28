'use client';

import { cn } from '@/lib/utils';
import { CSSProperties, ReactNode } from 'react';

interface ShineBorderProps {
  children: ReactNode;
  className?: string;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Border width in pixels */
  borderWidth?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Gradient colors for the shine effect */
  colors?: string[];
  /** Whether the animation is active */
  animated?: boolean;
}

/**
 * Shine Border - Animated neon gradient border effect
 * Inspired by aliimam.in/components/shine-border
 */
export function ShineBorder({
  children,
  className,
  borderRadius = 12,
  borderWidth = 2,
  duration = 8,
  colors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
  animated = true,
}: ShineBorderProps) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={
        {
          '--shine-border-radius': `${borderRadius}px`,
          '--shine-border-width': `${borderWidth}px`,
          '--shine-duration': `${duration}s`,
          '--shine-colors': colors.join(', '),
          borderRadius: `${borderRadius}px`,
        } as CSSProperties
      }
    >
      {/* Animated gradient border */}
      <div
        className={cn(
          'absolute inset-0 z-0',
          animated && 'animate-shine-rotate'
        )}
        style={{
          background: `conic-gradient(from 0deg, ${colors.join(', ')})`,
          borderRadius: `${borderRadius}px`,
        }}
      />

      {/* Inner content container */}
      <div
        className="relative z-10 bg-bg-primary"
        style={{
          margin: `${borderWidth}px`,
          borderRadius: `${Math.max(0, borderRadius - borderWidth)}px`,
        }}
      >
        {children}
      </div>

      <style jsx>{`
        @keyframes shine-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-shine-rotate {
          animation: shine-rotate var(--shine-duration) linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Shine Border Card - A card variant with the shine effect
 */
export function ShineBorderCard({
  children,
  className,
  colors,
  ...props
}: ShineBorderProps) {
  return (
    <ShineBorder
      {...props}
      colors={colors}
      className={cn('group', className)}
    >
      <div className="p-6 bg-gradient-to-br from-bg-tertiary/80 to-bg-primary">
        {children}
      </div>
    </ShineBorder>
  );
}

/**
 * Subtle Glow Border - A more subtle variant
 */
export function GlowBorder({
  children,
  className,
  color = '#8b5cf6',
  intensity = 0.3,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  intensity?: number;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden',
        className
      )}
      style={{
        boxShadow: `0 0 40px ${color}${Math.round(Math.max(0, Math.min(1, intensity)) * 255).toString(16).padStart(2, '0')}`,
      }}
    >
      {/* Gradient border */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${color}40, transparent 50%, ${color}20)`,
          padding: '1px',
        }}
      />

      {/* Content */}
      <div className="relative bg-bg-primary rounded-2xl m-[1px]">
        {children}
      </div>
    </div>
  );
}
