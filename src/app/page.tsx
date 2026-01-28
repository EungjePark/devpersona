/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { HexagonRadar } from '@/components/cards/HexagonRadar';
import { HomeLeaderboard } from '@/components/leaderboard/HomeLeaderboard';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { GitHubAuthModal } from '@/components/auth/GitHubAuthModal';
import { Activity, Users, Trophy, type LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { ShineBorder } from '@/components/ui/shine-border';
import { CSSGradientMesh, GridPattern } from '@/components/ui/gradient-mesh';
import { WelcomeModal, useOnboarding } from '@/components/onboarding/WelcomeModal';

const DEMO_SIGNALS = {
  grit: 78,
  focus: 85,
  craft: 62,
  impact: 45,
  voice: 38,
  reach: 71,
};

const POPULAR_DEVS = ['torvalds', 'shadcn', 'tanstack', 'vercel', 'gaearon'];

// Reusable stat display component
interface StatItemProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number;
  valueLabel: string;
  valueClassName?: string;
  delay?: number;
  showBorder?: boolean;
}

function StatItem({
  icon: Icon,
  iconColor,
  label,
  value,
  valueLabel,
  valueClassName,
  delay = 0,
  showBorder = false,
}: StatItemProps): ReactNode {
  return (
    <div className={`flex flex-col gap-1 ${showBorder ? 'border-l border-glass-border pl-4' : ''}`}>
      <div className="flex items-center gap-2 text-text-muted mb-1">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 pl-6">
        <AnimatedCounter
          value={value}
          duration={1500}
          delay={delay}
          size="md"
          variant={valueClassName ? undefined : 'primary'}
          className={valueClassName}
        />
        <span className="text-sm text-text-muted">{valueLabel}</span>
      </div>
    </div>
  );
}

// Quick action button component with static Tailwind classes
const QUICK_ACTION_STYLES = {
  purple: {
    border: 'hover:border-purple-500/30',
    bg: 'from-purple-500/20 to-purple-600/20',
  },
  amber: {
    border: 'hover:border-amber-500/30',
    bg: 'from-amber-500/20 to-amber-600/20',
  },
  green: {
    border: 'hover:border-green-500/30',
    bg: 'from-green-500/20 to-green-600/20',
  },
} as const;

interface QuickActionProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  colorClass: keyof typeof QUICK_ACTION_STYLES;
}

function QuickAction({ onClick, icon, label, colorClass }: QuickActionProps): ReactNode {
  const styles = QUICK_ACTION_STYLES[colorClass];
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-secondary/80 border border-glass-border ${styles.border} hover:bg-bg-tertiary transition-[border-color,background-color,transform] duration-300`}
    >
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${styles.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
        {label}
      </span>
    </button>
  );
}

// GitHub icon SVG component
function GitHubIcon({ className }: { className?: string }): ReactNode {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }): ReactNode {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }): ReactNode {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function PulsingDot({ color }: { color: string }): ReactNode {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color.replace('400', '500')}`} />
    </span>
  );
}

function Divider({ text }: { text: string }): ReactNode {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-glass-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-4 bg-bg-primary text-text-muted">{text}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAnalyzeMe, setPendingAnalyzeMe] = useState(false);
  const router = useRouter();
  const { showOnboarding, closeOnboarding } = useOnboarding();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const githubUsername = user?.externalAccounts?.find(
    (acc) => acc.provider === 'github'
  )?.username;

  const isAuthenticated = isLoaded && isSignedIn && !!githubUsername;

  // Redirect to own profile after login if "Analyze Me" was clicked
  useEffect(() => {
    if (pendingAnalyzeMe && isSignedIn && githubUsername) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: clear flag before navigation
      setPendingAnalyzeMe(false);
      router.push(`/analyze/${githubUsername}`);
    }
  }, [pendingAnalyzeMe, isSignedIn, githubUsername, router]);

  const handleAnalyzeMe = () => {
    if (isSignedIn && githubUsername) {
      // Already logged in, go directly to profile
      router.push(`/analyze/${githubUsername}`);
    } else {
      // Need to login first
      setPendingAnalyzeMe(true);
      setAuthModalOpen(true);
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    router.push(`/analyze/${username.trim().replace('@', '')}`);
  };

  const handleQuickAnalyze = (dev: string) => {
    setIsLoading(true);
    router.push(`/analyze/${dev}`);
  };

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
    setPendingAnalyzeMe(false);
  };

  return (
    <ConvexClientProvider>
      <div className="min-h-screen relative overflow-hidden bg-bg-primary selection:bg-primary-500/30">
        <CSSGradientMesh
          colors={['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b']}
          className="opacity-30"
          animate
        />
        <GridPattern
          size={60}
          strokeWidth={0.5}
          color="rgba(255,255,255,0.03)"
          className="pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm shadow-xl">
              <PulsingDot color="bg-red-400" />
              <span className="text-xs font-semibold text-red-400 tracking-wide uppercase">
                Warning: Brutal Honesty Ahead
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter text-text-primary leading-[0.9]">
              Are you actually <br className="hidden md:block" />
              <span className="text-gradient-primary">a good developer?</span>
            </h1>

            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed text-balance font-normal">
              Stop lying to yourself. Your GitHub doesn&apos;t lie. <br className="hidden md:block" />
              We expose your <span className="text-red-400 font-bold">real</span> impact, consistency, and influence.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-10 animate-fade-in-up delay-100">
              <div className="mb-8">
                {isAuthenticated ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-amber-500 to-primary-500 rounded-2xl opacity-30 group-hover:opacity-50 blur-xl transition-opacity duration-500 animate-pulse" />
                    <button
                      onClick={handleAnalyzeMe}
                      disabled={isLoading}
                      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary border border-primary-500/30 p-6 transition-[border-color,transform,opacity] duration-300 hover:border-primary-400/50 hover:scale-[1.01] disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                      <div className="relative flex items-center gap-5">
                        <div className="relative shrink-0">
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary-400 to-amber-500 animate-spin-slow opacity-60" style={{ animationDuration: '4s' }} />
                          <img
                            src={user?.imageUrl || `https://github.com/${githubUsername}.png`}
                            alt={`${githubUsername}'s avatar`}
                            width={64}
                            height={64}
                            className="relative w-16 h-16 rounded-full border-2 border-bg-primary object-cover"
                          />
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-bg-secondary">
                            <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative h-2 w-2 rounded-full bg-white" />
                          </span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs font-bold uppercase tracking-widest text-primary-400">Ready to face the truth?</span>
                          <h3 className="text-xl font-black text-text-primary truncate">@{githubUsername}</h3>
                          <p className="text-sm text-text-muted mt-0.5">Your GitHub is waiting to be judged</p>
                        </div>
                        <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-white text-black group-hover:scale-110 transition-transform duration-300">
                          <ArrowIcon className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                      <div className="mt-5 h-1 w-full rounded-full bg-bg-elevated overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 via-amber-500 to-primary-500 rounded-full animate-shimmer" style={{ width: '100%', backgroundSize: '200% 100%' }} />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleAnalyzeMe}
                      disabled={isLoading}
                      className="group relative w-full flex items-center justify-center gap-3 py-4 px-8 rounded-xl bg-white text-black font-bold text-lg shadow-xl shadow-white/10 hover:shadow-2xl hover:shadow-white/20 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <GitHubIcon className="w-6 h-6" />
                      <span>Analyze My GitHub</span>
                    </button>
                    <p className="text-center text-xs text-text-muted mt-3">
                      Sign in with GitHub to analyze your profile
                    </p>
                  </div>
                )}
              </div>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <QuickAction
                      onClick={() => router.push('/compare')}
                      icon={<Users className="w-5 h-5 text-purple-400" />}
                      label="Compare"
                      colorClass="purple"
                    />
                    <QuickAction
                      onClick={() => router.push('/leaderboard')}
                      icon={<Trophy className="w-5 h-5 text-amber-400" />}
                      label="Leaderboard"
                      colorClass="amber"
                    />
                    <QuickAction
                      onClick={() => navigator.clipboard.writeText(`https://devpersona.app/analyze/${githubUsername}`)}
                      icon={<ShareIcon className="w-5 h-5 text-green-400" />}
                      label="Share"
                      colorClass="green"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-secondary/50 border border-glass-border/50">
                    <label htmlFor="search-username" className="text-text-muted font-mono text-sm">@</label>
                    <input
                      id="search-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && username.trim() && handleAnalyze(e)}
                      placeholder="Search other developers…"
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none"
                    />
                    {username.trim() && (
                      <button
                        onClick={handleAnalyze}
                        className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Divider text="or check someone else" />
                  <form onSubmit={handleAnalyze} className="space-y-4">
                    <div className="relative group">
                      <div className="relative flex p-1.5 bg-bg-secondary rounded-xl border border-glass-border shadow-lg ring-1 ring-white/5">
                        <div className="flex-1 relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono text-lg">
                            @
                          </span>
                          <input
                            id="github-username"
                            name="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="github_username"
                            aria-label="GitHub username"
                            autoComplete="username"
                            autoCorrect="off"
                            autoCapitalize="off"
                            className="w-full h-12 pl-10 pr-4 bg-transparent text-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none font-medium selection:bg-primary-500/30"
                            disabled={isLoading}
                          />
                        </div>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={!username.trim() || isLoading}
                          className="h-12 px-6 text-sm font-semibold bg-bg-tertiary hover:bg-bg-elevated text-text-primary border border-glass-border transition-all duration-300 rounded-lg"
                        >
                          {isLoading ? 'Loading…' : 'View'}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <span className="text-xs text-text-muted mr-1 font-medium">Popular:</span>
                      {POPULAR_DEVS.map((dev) => (
                        <button
                          key={dev}
                          type="button"
                          onClick={() => handleQuickAnalyze(dev)}
                          disabled={isLoading}
                          className="px-3 py-1 text-xs font-medium text-text-secondary hover:text-primary-400 bg-bg-tertiary hover:bg-bg-elevated rounded-md border border-glass-border transition-all duration-200"
                        >
                          {dev}
                        </button>
                      ))}
                    </div>
                  </form>
                </>
              )}

              <div className="border-t border-glass-border pt-8 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <StatItem icon={Activity} iconColor="text-primary-400" label="Analysis" value={6} valueLabel="Vectors" />
                  <StatItem icon={Users} iconColor="text-purple-400" label="Archetypes" value={8} valueLabel="Personas" valueClassName="text-purple-400" delay={200} showBorder />
                  <StatItem icon={Trophy} iconColor="text-amber-400" label="System" value={4} valueLabel="Tiers" valueClassName="text-amber-400" delay={400} showBorder />
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in-up delay-200 lg:pl-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary-500/5 via-transparent to-transparent blur-3xl pointer-events-none" />

              <ShineBorder borderRadius={16} borderWidth={2} colors={['#8b5cf6', '#d97706', '#22c55e']} duration={8} className="w-full">
                <div className="relative glass-panel rounded-2xl p-8 border-glass-border shadow-2xl backdrop-blur-xl bg-bg-secondary/80">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        LP
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-primary">Linus Torvalds</div>
                        <div className="text-xs text-text-muted">Linux Architect</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <AnimatedCounter value={98} duration={2000} size="lg" className="text-tier-legendary" />
                      <div className="text-[10px] font-bold text-tier-legendary uppercase tracking-wider">Legendary</div>
                    </div>
                  </div>
                  <div className="flex justify-center mb-6">
                    <HexagonRadar signals={DEMO_SIGNALS} size={340} showLabels tierColor="#d97706" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-glass-border">
                    <div className="text-center">
                      <AnimatedCounter value={24500} duration={2500} compact size="md" className="text-text-primary" />
                      <div className="text-xs text-text-muted uppercase tracking-wide">Commits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-text-primary">Top 0.1%</div>
                      <div className="text-xs text-text-muted uppercase tracking-wide">Impact</div>
                    </div>
                  </div>
                </div>
              </ShineBorder>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-medium text-text-muted/60 tracking-widest uppercase">
                  Interactive Preview
                </span>
              </div>
            </div>
          </div>

          <div className="mt-24 animate-fade-in-up delay-300">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
                The <span className="text-gradient-primary">Elite 0.1%</span>
              </h2>
              <p className="text-text-secondary">
                Can you even get on this list?
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <HomeLeaderboard />
            </div>
          </div>

          <footer className="mt-24 pb-8 text-center border-t border-glass-border pt-8">
            <p className="text-sm text-text-muted mb-2">
              Powered by public signals from GitHub, npm, and Hacker News.
            </p>
            <p className="text-xs text-text-muted/40">DevPersona &copy; 2026</p>
          </footer>
        </div>

        {showOnboarding && <WelcomeModal onClose={closeOnboarding} />}

        <GitHubAuthModal
          isOpen={authModalOpen}
          onClose={handleAuthModalClose}
          mode="sign-in"
        />
      </div>
    </ConvexClientProvider>
  );
}
