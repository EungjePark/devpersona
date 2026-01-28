'use client';

import Image from 'next/image';
import { SignInButton, SignUpButton, useAuth, useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

interface ConnectGitHubProps {
  username?: string;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export function ConnectGitHub({ username, variant = 'default', className = '' }: ConnectGitHubProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // When user signs in, we'll link their Clerk account to their GitHub profile
  // This happens server-side via webhook, but we can track the username for context

  if (!isLoaded) {
    return (
      <div className={`animate-pulse bg-white/5 rounded-xl h-12 ${className}`} />
    );
  }

  if (isSignedIn) {
    // User is already signed in
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 ${className}`}>
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-400">Connected</p>
          <p className="text-xs text-text-muted">
            {user?.username || user?.emailAddresses[0]?.emailAddress || 'Account linked'}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <SignInButton mode="modal">
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            "transition-all text-sm font-medium text-white",
            className
          )}
        >
          <GitHubIcon className="w-4 h-4" aria-hidden="true" />
          Connect GitHub
        </button>
      </SignInButton>
    );
  }

  if (variant === 'inline') {
    return (
      <SignInButton mode="modal">
        <button
          className={cn(
            "inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded",
            "text-sm font-medium transition-colors",
            className
          )}
        >
          <GitHubIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Connect GitHub
          <span className="text-xs" aria-hidden="true">→</span>
        </button>
      </SignInButton>
    );
  }

  // Default variant
  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-black border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
          <GitHubIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Connect GitHub</h3>
          <p className="text-sm text-text-muted">
            {username ? `Link your account to save @${username}'s progress` : 'Save your analysis and join the community'}
          </p>
        </div>
      </div>

      {/* Benefits */}
      <ul className="space-y-2 mb-5 text-sm">
        <li className="flex items-center gap-2 text-text-secondary">
          <span className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">✓</span>
          Track your signal progress over time
        </li>
        <li className="flex items-center gap-2 text-text-secondary">
          <span className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">✓</span>
          Boost signals through community activities
        </li>
        <li className="flex items-center gap-2 text-text-secondary">
          <span className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">✓</span>
          Join Launch Week & compete for prizes
        </li>
        <li className="flex items-center gap-2 text-text-secondary">
          <span className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">✓</span>
          Create your Product Station
        </li>
      </ul>

      {/* CTA Buttons */}
      <div className="flex gap-3">
        <SignInButton mode="modal">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors">
            <GitHubIcon className="w-5 h-5" aria-hidden="true" />
            Sign in with GitHub
          </button>
        </SignInButton>
      </div>

      {/* Signup option */}
      <div className="mt-4 text-center">
        <span className="text-xs text-text-muted">
          New here?{' '}
          <SignUpButton mode="modal">
            <button className="text-primary-400 hover:text-primary-300 font-medium">
              Create an account
            </button>
          </SignUpButton>
        </span>
      </div>
    </div>
  );
}

// GitHub icon component
function GitHubIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

// User menu component for authenticated users
export function UserMenu() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />;
  }

  if (!isSignedIn) {
    return <ConnectGitHub variant="compact" />;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Image
          src={user?.imageUrl || '/placeholder-avatar.png'}
          alt={user?.username || 'User'}
          width={32}
          height={32}
          className="rounded-full border-2 border-primary-500/50"
          unoptimized
        />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-bg-primary" />
      </div>
      <span className="text-sm font-medium text-white hidden sm:block">
        @{user?.username || user?.firstName || 'User'}
      </span>
    </div>
  );
}
