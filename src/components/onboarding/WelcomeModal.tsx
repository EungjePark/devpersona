'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'devpersona_onboarding_seen';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'welcome' | 'analyze'>('welcome');

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAnalyze = () => {
    if (username.trim()) {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      onClose();
      router.push(`/analyze/${username.trim()}`);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl">
        {/* Gradient decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-600/10 pointer-events-none" />

        {step === 'welcome' ? (
          <div className="relative p-8">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-4xl shadow-lg shadow-violet-500/25">
                🚀
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Welcome to DevPersona
            </h2>
            <p className="text-zinc-400 text-center mb-8">
              Discover your developer identity through GitHub analysis and join a community of builders.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <Feature
                icon="🔍"
                title="Analyze Your Profile"
                description="Get insights into your coding patterns and strengths"
              />
              <Feature
                icon="📊"
                title="Track Your Rank"
                description="Climb the leaderboard and earn builder tiers"
              />
              <Feature
                icon="🚀"
                title="Launch Products"
                description="Share your projects and get community feedback"
              />
              <Feature
                icon="🛸"
                title="Join Stations"
                description="Connect with builders around products you love"
              />
            </div>

            {/* CTA */}
            <Button
              onClick={() => setStep('analyze')}
              className={cn(
                "w-full h-12 rounded-xl font-semibold",
                "bg-gradient-to-r from-violet-600 to-cyan-600",
                "hover:from-violet-500 hover:to-cyan-500",
                "shadow-lg shadow-violet-500/25",
                "transition-all duration-200"
              )}
            >
              Get Started
            </Button>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full mt-3 text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              Skip for now
            </button>
          </div>
        ) : (
          <div className="relative p-8">
            {/* Back button */}
            <button
              type="button"
              onClick={() => setStep('welcome')}
              className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded transition-colors"
            >
              ← Back
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6 mt-4">
              <div className="w-16 h-16 rounded-xl bg-violet-500/10 flex items-center justify-center text-3xl">
                🔍
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-white mb-2">
              Analyze Your GitHub
            </h2>
            <p className="text-zinc-400 text-center text-sm mb-6">
              Enter your GitHub username to discover your developer DNA
            </p>

            {/* Input */}
            <div className="relative mb-4">
              <label htmlFor="github-username" className="sr-only">GitHub username</label>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true">@</span>
              <input
                id="github-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="your-github-username…"
                autoComplete="username"
                spellCheck="false"
                className={cn(
                  "w-full h-12 pl-10 pr-4 rounded-xl",
                  "bg-zinc-800 border border-zinc-700",
                  "text-white placeholder:text-zinc-500",
                  "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500",
                  "transition-colors"
                )}
                autoFocus
              />
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!username.trim()}
              className={cn(
                "w-full h-12 rounded-xl font-semibold",
                "bg-gradient-to-r from-violet-600 to-cyan-600",
                "hover:from-violet-500 hover:to-cyan-500",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg shadow-violet-500/25",
                "transition-all duration-200"
              )}
            >
              Analyze Profile
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-zinc-700" />
              <span className="text-xs text-zinc-500">OR</span>
              <div className="flex-1 h-px bg-zinc-700" />
            </div>

            {/* Sign in for full experience */}
            {!isSignedIn && (
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl gap-2 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Sign in with GitHub
                </Button>
              </SignInButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50">
      <span className="text-xl">{icon}</span>
      <div>
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeen) {
      // Small delay for better UX
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  return { showOnboarding, closeOnboarding };
}
