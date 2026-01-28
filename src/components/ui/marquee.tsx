'use client';

import { cn } from '@/lib/utils';
import { CSSProperties, ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  /** Direction of scroll */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Speed in pixels per second */
  speed?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Number of times to repeat content */
  repeat?: number;
  /** Gap between repeated content */
  gap?: number;
  /** CSS class */
  className?: string;
  /** Inner content class */
  innerClassName?: string;
  /** Fade edges */
  fade?: boolean;
  /** Fade width in pixels */
  fadeWidth?: number;
}

/**
 * Marquee - Infinite scrolling content
 * Inspired by aliimam.in/components/marquee
 */
export function Marquee({
  children,
  direction = 'left',
  speed = 50,
  pauseOnHover = true,
  repeat = 4,
  gap = 24,
  className,
  innerClassName,
  fade = true,
  fadeWidth = 100,
}: MarqueeProps) {
  const isHorizontal = direction === 'left' || direction === 'right';
  const isReverse = direction === 'right' || direction === 'down';

  // Calculate animation duration based on content width and speed
  // This is an approximation; actual duration depends on content size
  const safeSpeed = Math.max(1, speed);
  const duration = 20 / (safeSpeed / 50);

  const containerStyle: CSSProperties = {
    '--marquee-duration': `${duration}s`,
    '--marquee-gap': `${gap}px`,
    '--marquee-repeat': repeat,
  } as CSSProperties;

  const fadeStyle: CSSProperties = fade
    ? {
        maskImage: isHorizontal
          ? `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`
          : `linear-gradient(to bottom, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`,
        WebkitMaskImage: isHorizontal
          ? `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`
          : `linear-gradient(to bottom, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`,
      }
    : {};

  return (
    <div
      className={cn(
        'overflow-hidden',
        isHorizontal ? 'w-full' : 'h-full',
        className
      )}
      style={{ ...containerStyle, ...fadeStyle }}
    >
      <div
        className={cn(
          'flex',
          isHorizontal ? 'flex-row' : 'flex-col',
          pauseOnHover && 'hover:[animation-play-state:paused]',
          isHorizontal ? 'animate-marquee-horizontal' : 'animate-marquee-vertical',
          isReverse && 'animation-direction-reverse',
          innerClassName
        )}
        style={{
          gap: `${gap}px`,
          animationDuration: `${duration}s`,
          animationDirection: isReverse ? 'reverse' : 'normal',
        }}
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex shrink-0',
              isHorizontal ? 'flex-row' : 'flex-col'
            )}
            style={{ gap: `${gap}px` }}
          >
            {children}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes marquee-horizontal {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / var(--marquee-repeat, 4) - var(--marquee-gap)));
          }
        }

        @keyframes marquee-vertical {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(calc(-100% / var(--marquee-repeat, 4) - var(--marquee-gap)));
          }
        }

        .animate-marquee-horizontal {
          animation: marquee-horizontal var(--marquee-duration) linear infinite;
        }

        .animate-marquee-vertical {
          animation: marquee-vertical var(--marquee-duration) linear infinite;
        }

        .animation-direction-reverse {
          animation-direction: reverse;
        }

        .hover\\:[animation-play-state\\:paused]:hover {
          animation-play-state: paused;
        }

        .hover\\:[animation-play-state\\:paused]:hover * {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

/**
 * Developer Marquee - Showcase trending developers
 */
export function DeveloperMarquee({
  developers,
  direction = 'left',
  speed = 30,
  className,
}: {
  developers: Array<{
    username: string;
    avatarUrl?: string;
    name?: string;
    followers?: number;
  }>;
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
}) {
  return (
    <Marquee
      direction={direction}
      speed={speed}
      pauseOnHover={true}
      className={className}
      gap={16}
    >
      {developers.map((dev, index) => (
        <a
          key={index}
          href={`/analyze/${dev.username}`}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl',
            'bg-white/[0.03] border border-white/[0.05]',
            'hover:bg-white/[0.06] hover:border-white/10',
            'transition-all duration-200'
          )}
        >
          {dev.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dev.avatarUrl}
              alt={dev.username}
              className="w-10 h-10 rounded-full border border-white/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
              {dev.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {dev.name || dev.username}
            </span>
            <span className="text-xs text-text-muted">
              @{dev.username}
              {dev.followers !== undefined && (
                <span className="ml-2 text-text-secondary">
                  {dev.followers.toLocaleString()} followers
                </span>
              )}
            </span>
          </div>
        </a>
      ))}
    </Marquee>
  );
}

/**
 * Logo Marquee - Showcase tech/company logos
 */
export function LogoMarquee({
  logos,
  direction = 'left',
  speed = 40,
  className,
}: {
  logos: Array<{
    name: string;
    icon: ReactNode;
    color?: string;
  }>;
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
}) {
  return (
    <Marquee
      direction={direction}
      speed={speed}
      pauseOnHover={true}
      className={className}
      gap={32}
    >
      {logos.map((logo, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 transition-colors",
            !logo.color && "text-text-muted hover:text-text-primary"
          )}
          style={logo.color ? { color: logo.color } : undefined}
        >
          <span className="text-2xl">{logo.icon}</span>
          <span className="text-sm font-medium">{logo.name}</span>
        </div>
      ))}
    </Marquee>
  );
}

/**
 * Stats Marquee - Scrolling statistics
 */
export function StatsMarquee({
  stats,
  className,
}: {
  stats: Array<{
    value: string | number;
    label: string;
    color?: string;
  }>;
  className?: string;
}) {
  return (
    <Marquee
      direction="left"
      speed={25}
      pauseOnHover={false}
      className={cn('py-4 border-y border-white/[0.05]', className)}
      gap={48}
    >
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-3">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: stat.color || '#fff' }}
          >
            {stat.value}
          </span>
          <span className="text-sm text-text-muted uppercase tracking-wider">
            {stat.label}
          </span>
        </div>
      ))}
    </Marquee>
  );
}
