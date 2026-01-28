'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ShineBorder, GlowBorder } from '@/components/ui/shine-border';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SignalScores } from '@/lib/types';

// Signal boost CTA configuration with specific community feature links
const SIGNAL_BOOST_CONFIG: Record<keyof SignalScores, {
  title: string;
  description: string;
  shortDescription: string;
  primaryAction: {
    text: string;
    link: string;
    description: string;
  };
  secondaryActions: Array<{
    text: string;
    boost: string;
    link: string;
  }>;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  icon: string;
  threshold: number;
}> = {
  voice: {
    title: "Amplify Your Voice",
    description: "Your Voice signal is low. Engage with the community to boost it!",
    shortDescription: "Join discussions & share ideas",
    primaryAction: {
      text: "Submit an Idea",
      link: "/board",
      description: "Share your thoughts and get feedback from the community",
    },
    secondaryActions: [
      { text: "Join discussions", boost: "+3", link: "/board" },
      { text: "Write feedback on launches", boost: "+5", link: "/launch" },
      { text: "Get 'helpful' marks", boost: "+10", link: "/launch" },
    ],
    color: "#22c55e",
    gradientFrom: "#22c55e",
    gradientTo: "#16a34a",
    icon: "voice",
    threshold: 40,
  },
  impact: {
    title: "Increase Your Impact",
    description: "Ship something! Launch your projects to boost your Impact signal.",
    shortDescription: "Launch products & gain recognition",
    primaryAction: {
      text: "Launch a Product",
      link: "/launch",
      description: "Share your creation with the community",
    },
    secondaryActions: [
      { text: "Launch a product", boost: "+15", link: "/launch" },
      { text: "Achieve Poten status", boost: "+25", link: "/launch" },
      { text: "Win weekly competition", boost: "+50", link: "/launch" },
    ],
    color: "#f59e0b",
    gradientFrom: "#f59e0b",
    gradientTo: "#d97706",
    icon: "impact",
    threshold: 40,
  },
  reach: {
    title: "Expand Your Reach",
    description: "Grow your network by engaging with product communities.",
    shortDescription: "Join stations & build your crew",
    primaryAction: {
      text: "Join a Station",
      link: "/station",
      description: "Connect with builders in focused communities",
    },
    secondaryActions: [
      { text: "Join product Stations", boost: "+2 each", link: "/station" },
      { text: "Build your Station crew", boost: "+1/member", link: "/station" },
      { text: "Collaborate with builders", boost: "+10", link: "/board" },
    ],
    color: "#06b6d4",
    gradientFrom: "#06b6d4",
    gradientTo: "#0891b2",
    icon: "reach",
    threshold: 40,
  },
  grit: {
    title: "Build Your Grit",
    description: "Show consistency! Keep up your coding streaks and complete challenges.",
    shortDescription: "Maintain streaks & complete challenges",
    primaryAction: {
      text: "View Challenges",
      link: "/board",
      description: "Complete weekly challenges to boost your grit",
    },
    secondaryActions: [
      { text: "Maintain weekly activity", boost: "+5", link: "/board" },
      { text: "Complete weekly challenges", boost: "+10", link: "/launch" },
      { text: "30-day streak bonus", boost: "+20", link: "/board" },
    ],
    color: "#ef4444",
    gradientFrom: "#ef4444",
    gradientTo: "#dc2626",
    icon: "grit",
    threshold: 40,
  },
  focus: {
    title: "Sharpen Your Focus",
    description: "Specialize deeper! Focus on specific technologies or communities.",
    shortDescription: "Specialize in stations & topics",
    primaryAction: {
      text: "Find Your Station",
      link: "/station",
      description: "Deep dive into a specialized community",
    },
    secondaryActions: [
      { text: "Deep dive in one Station", boost: "+5", link: "/station" },
      { text: "Become topic expert", boost: "+15", link: "/board" },
      { text: "Lead a specialization", boost: "+25", link: "/station" },
    ],
    color: "#8b5cf6",
    gradientFrom: "#8b5cf6",
    gradientTo: "#7c3aed",
    icon: "focus",
    threshold: 40,
  },
  craft: {
    title: "Polish Your Craft",
    description: "Quality matters! Contribute code reviews and detailed feedback.",
    shortDescription: "Review code & submit bug reports",
    primaryAction: {
      text: "Review Launches",
      link: "/launch",
      description: "Help others improve with quality feedback",
    },
    secondaryActions: [
      { text: "Write code reviews", boost: "+5", link: "/board" },
      { text: "Submit bug reports", boost: "+8", link: "/launch" },
      { text: "Feature implementation", boost: "+20", link: "/launch" },
    ],
    color: "#ec4899",
    gradientFrom: "#ec4899",
    gradientTo: "#db2777",
    icon: "craft",
    threshold: 40,
  },
};

// Icon components for each signal type
function SignalIcon({ type, className, style }: { type: keyof SignalScores; className?: string; style?: React.CSSProperties }) {
  const iconProps = { className: cn("w-6 h-6", className), fill: "none", stroke: "currentColor", strokeWidth: 2, style };

  switch (type) {
    case 'voice':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      );
    case 'impact':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      );
    case 'reach':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
        </svg>
      );
    case 'grit':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
        </svg>
      );
    case 'focus':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-4.93-7.07l1.41-1.41M5.52 18.48l1.41-1.41M18.48 18.48l-1.41-1.41M5.52 5.52l1.41 1.41" />
        </svg>
      );
    case 'craft':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      );
    default:
      return null;
  }
}

// GitHub icon component
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

interface SignalBoostCTAProps {
  signals: SignalScores;
  className?: string;
  compact?: boolean;
}

export function SignalBoostCTA({ signals, className = '', compact = false }: SignalBoostCTAProps) {
  const { isSignedIn } = useAuth();

  // Find the lowest signal that's below threshold
  const signalEntries = Object.entries(signals) as [keyof SignalScores, number][];
  const lowSignals = signalEntries
    .filter(([key, value]) => value < SIGNAL_BOOST_CONFIG[key].threshold)
    .sort((a, b) => a[1] - b[1]); // Sort by score ascending

  // If not signed in, show the GitHub connect CTA
  if (!isSignedIn) {
    return (
      <ShineBorder
        className={cn("w-full", className)}
        borderRadius={16}
        borderWidth={2}
        duration={6}
        colors={['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b']}
      >
        <div className="p-6 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-black">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-700/50">
              <GitHubIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Connect Your GitHub
              </h3>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                Sign in with GitHub to unlock your developer persona and track your signal growth.
              </p>
            </div>
            <Button asChild variant="default" size="lg" className="w-full max-w-xs">
              <Link href="/sign-in" className="flex items-center gap-2">
                <GitHubIcon className="w-5 h-5" />
                Connect GitHub
              </Link>
            </Button>
            <p className="text-xs text-zinc-500">
              Join 10,000+ developers tracking their growth
            </p>
          </div>
        </div>
      </ShineBorder>
    );
  }

  if (lowSignals.length === 0) {
    return null; // All signals are good
  }

  const [lowestSignal, lowestScore] = lowSignals[0];
  const config = SIGNAL_BOOST_CONFIG[lowestSignal];

  if (compact) {
    return (
      <GlowBorder
        className={cn("w-full", className)}
        color={config.color}
        intensity={0.25}
      >
        <div className="p-4 bg-gradient-to-r from-zinc-900/90 to-black">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${config.gradientFrom}20, ${config.gradientTo}10)`,
                border: `1px solid ${config.color}30`
              }}
            >
              <SignalIcon type={lowestSignal} className="w-6 h-6" style={{ color: config.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-white">{config.title}</span>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                    border: `1px solid ${config.color}30`
                  }}
                >
                  {lowestScore}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">{config.shortDescription}</p>
            </div>
            <Button
              asChild
              size="sm"
              className="flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
              }}
            >
              <Link href={config.primaryAction.link}>
                Boost Now
              </Link>
            </Button>
          </div>
        </div>
      </GlowBorder>
    );
  }

  return (
    <ShineBorder
      className={cn("w-full", className)}
      borderRadius={20}
      borderWidth={2}
      duration={8}
      colors={[config.color, config.gradientTo, config.color]}
    >
      <div className="p-6 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-black">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${config.gradientFrom}25, ${config.gradientTo}15)`,
              border: `1px solid ${config.color}40`
            }}
          >
            <SignalIcon type={lowestSignal} className="w-7 h-7" style={{ color: config.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-white">{config.title}</h3>
              <span
                className="text-sm font-mono font-bold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: `${config.color}20`,
                  color: config.color,
                  border: `1px solid ${config.color}30`
                }}
              >
                {lowestScore}/100
              </span>
            </div>
            <p className="text-sm text-zinc-400">{config.description}</p>
          </div>
        </div>

        {/* Primary Action - Highlighted */}
        <Link
          href={config.primaryAction.link}
          className="block p-4 rounded-xl mb-4 transition-all hover:scale-[1.01] active:scale-[0.99] group"
          style={{
            background: `linear-gradient(135deg, ${config.gradientFrom}15, ${config.gradientTo}10)`,
            border: `1px solid ${config.color}30`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-semibold text-white group-hover:text-white/90 transition-colors">
                  {config.primaryAction.text}
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${config.color}25`, color: config.color }}
                >
                  Recommended
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {config.primaryAction.description}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-1"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: config.color }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Secondary Actions */}
        <div className="space-y-2 mb-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
            Other ways to boost
          </p>
          {config.secondaryActions.map((action, index) => (
            <Link
              key={index}
              href={action.link}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] transition-all group"
            >
              <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">
                {action.text}
              </span>
              <span
                className="text-xs font-mono font-semibold px-2 py-1 rounded-lg"
                style={{ backgroundColor: `${config.color}15`, color: config.color }}
              >
                {action.boost}
              </span>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          asChild
          size="lg"
          className="w-full font-semibold"
          style={{
            background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
          }}
        >
          <Link href={config.primaryAction.link} className="flex items-center gap-2">
            Start Boosting Your {config.title.split(' ').pop()}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </Button>
      </div>
    </ShineBorder>
  );
}

// Multi-signal boost overview (shows all low signals)
interface SignalBoostOverviewProps {
  signals: SignalScores;
  className?: string;
}

export function SignalBoostOverview({ signals, className = '' }: SignalBoostOverviewProps) {
  const { isSignedIn } = useAuth();

  const signalEntries = Object.entries(signals) as [keyof SignalScores, number][];
  const lowSignals = signalEntries
    .filter(([key, value]) => value < SIGNAL_BOOST_CONFIG[key].threshold)
    .sort((a, b) => a[1] - b[1]);

  // If not signed in, show connect GitHub prompt
  if (!isSignedIn) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            Boost Opportunities
          </h3>
        </div>
        <GlowBorder color="#8b5cf6" intensity={0.2}>
          <div className="p-4 bg-gradient-to-r from-zinc-900/90 to-black">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <GitHubIcon className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Connect GitHub</p>
                <p className="text-xs text-zinc-500">Sign in to unlock boost opportunities</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">
                  Connect
                </Link>
              </Button>
            </div>
          </div>
        </GlowBorder>
      </div>
    );
  }

  if (lowSignals.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Boost Opportunities
        </h3>
        <span className="text-xs text-zinc-600">
          {lowSignals.length} signal{lowSignals.length > 1 ? 's' : ''} to improve
        </span>
      </div>

      <div className="grid gap-2">
        {lowSignals.slice(0, 3).map(([signal, score]) => {
          const config = SIGNAL_BOOST_CONFIG[signal];
          return (
            <Link
              key={signal}
              href={config.primaryAction.link}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.08] transition-all group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${config.gradientFrom}15, ${config.gradientTo}10)`,
                  border: `1px solid ${config.color}25`
                }}
              >
                <SignalIcon type={signal} className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white capitalize">{signal}</span>
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${config.color}15`,
                      color: config.color,
                      border: `1px solid ${config.color}20`
                    }}
                  >
                    {score}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{config.primaryAction.text}</p>
              </div>
              <div
                className="text-xs font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: config.color }}
              >
                {config.secondaryActions[0].boost}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
