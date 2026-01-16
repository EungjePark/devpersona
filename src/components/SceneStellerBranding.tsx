'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SceneStellerBrandingProps {
  variant?: 'minimal' | 'expanded';
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  className?: string;
}

/**
 * SceneSteller branding component for cross-promotion
 * Links to scenesteller.com/studio for image generation
 */
export function SceneStellerBranding({
  variant = 'minimal',
  position = 'bottom-right',
  className = '',
}: SceneStellerBrandingProps) {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'inline': 'relative',
  };

  if (variant === 'minimal') {
    return (
      <Link
        href="https://scenesteller.com/studio?ref=devpersona"
        target="_blank"
        rel="noopener noreferrer"
        className={`${positionClasses[position]} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full',
            'bg-black/80 backdrop-blur-sm border border-white/10',
            'hover:border-purple-500/50 hover:bg-black/90',
            'transition-all duration-300 group cursor-pointer',
            isHovered && 'pr-4 shadow-lg shadow-purple-500/10'
          )}
        >
          {/* Logo/Icon */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
            S
          </div>

          {/* Text - expands on hover */}
          <div
            className={`
              overflow-hidden transition-all duration-300 whitespace-nowrap
              ${isHovered ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0'}
            `}
          >
            <span className="text-xs text-text-muted">Made with</span>
            <span className="text-xs font-semibold text-white ml-1">SceneSteller</span>
          </div>
        </div>
      </Link>
    );
  }

  // Expanded variant - for inline use
  return (
    <Link
      href="https://scenesteller.com/studio?ref=devpersona"
      target="_blank"
      rel="noopener noreferrer"
      className={`${position === 'inline' ? '' : positionClasses[position]} ${className}`}
    >
      <div className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
        {/* Logo */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Text content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">SceneSteller</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
              AI Studio
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 group-hover:text-text-secondary transition-colors">
            Create stunning visuals from your photos
          </p>
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-text-muted group-hover:text-purple-400 group-hover:translate-x-1 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

/**
 * "Powered by" footer badge
 */
export function PoweredBySceneSteller({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-4 ${className}`}>
      <span className="text-xs text-text-muted">Card design by</span>
      <Link
        href="https://scenesteller.com?ref=devpersona"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
      >
        <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[8px] font-bold">
          S
        </div>
        SceneSteller
      </Link>
    </div>
  );
}

/**
 * CTA Card for generating card images
 */
export function GenerateWithSceneSteller({ username }: { username: string }) {
  return (
    <Link
      href={`https://scenesteller.com/studio?ref=devpersona&prompt=Create a cinematic profile card for ${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-transparent border border-purple-500/30 hover:border-purple-500/50 transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
              Generate Custom Card Art
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              Create AI-powered visuals for your profile
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm font-medium group-hover:bg-purple-400 transition-colors">
            Try Free
          </div>
        </div>
      </div>
    </Link>
  );
}
