'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HexagonRadar } from '@/components/cards/HexagonRadar';
import { HomeLeaderboard } from '@/components/leaderboard/HomeLeaderboard';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import { Activity, Users, Trophy } from 'lucide-react';

// Demo data for the landing page preview
const DEMO_SIGNALS = {
  grit: 78,
  focus: 85,
  craft: 62,
  impact: 45,
  voice: 38,
  reach: 71,
};

// Popular developers for quick access
const POPULAR_DEVS = ['torvalds', 'shadcn', 'tanstack', 'vercel', 'gaearon'];

export default function Home() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  return (
    <ConvexClientProvider>
      <div className="min-h-screen relative overflow-hidden bg-bg-primary selection:bg-primary-500/30">
        {/* Background decoration - Refined */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-400/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          {/* Hero Header - Provocative */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm shadow-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
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

          {/* 2-Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Column: Input + Hexagon Demo */}
            <div className="space-y-10 animate-fade-in-up delay-100">
              {/* Input Form */}
              <form onSubmit={handleAnalyze} className="space-y-6">
                <div className="relative group">
                  {/* Subtle Glow behind input */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-xl blur opacity-50 group-hover:opacity-100 transition duration-500" />

                  <div className="relative flex p-1.5 bg-bg-secondary rounded-xl border border-glass-border shadow-2xl ring-1 ring-white/5">
                    <div className="flex-1 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono text-lg">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="github_username"
                        className="w-full h-12 pl-10 pr-4 bg-transparent text-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none font-medium selection:bg-primary-500/30"
                        disabled={isLoading}
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={!username.trim() || isLoading}
                      className="h-12 px-8 text-sm font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg hover:shadow-primary-500/20 transition-all duration-300 rounded-lg"
                    >
                      {isLoading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>
                </div>

                {/* Quick Access Chips */}
                <div className="flex flex-wrap gap-2 justify-center items-center">
                  <span className="text-xs text-text-muted mr-1 font-medium">Try:</span>
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

              {/* Stats Summary - Refined HUD Style */}
              <div className="border-t border-glass-border pt-8 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <Activity className="w-4 h-4 text-primary-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Analysis</span>
                    </div>
                    <div className="text-xl font-bold text-text-primary pl-6">6 Vectors</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l border-glass-border pl-4">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">Archetypes</span>
                    </div>
                    <div className="text-xl font-bold text-text-primary pl-6">8 Personas</div>
                  </div>

                  <div className="flex flex-col gap-1 border-l border-glass-border pl-4">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">System</span>
                    </div>
                    <div className="text-xl font-bold text-text-primary pl-6">4 Rarity Tiers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Demo (Replaces Hexagon Only) */}
            <div className="relative animate-fade-in-up delay-200 lg:pl-10">
              {/* Decorative backdrop for the visual */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary-500/5 via-transparent to-transparent blur-3xl pointer-events-none" />

              <div className="relative glass-panel rounded-2xl p-8 border-glass-border shadow-2xl backdrop-blur-xl">
                {/* Header of the card mockup */}
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
                    <div className="text-2xl font-bold text-tier-legendary tracking-tighter">98</div>
                    <div className="text-[10px] font-bold text-tier-legendary uppercase tracking-wider">Legendary</div>
                  </div>
                </div>

                {/* Hexagon Chart - Bigger */}
                <div className="flex justify-center mb-6">
                  <HexagonRadar
                    signals={DEMO_SIGNALS}
                    size={340}
                    showLabels={true}
                    tierColor="#d97706"
                  />
                </div>

                {/* Footer Stats Row */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-glass-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-text-primary">24.5k</div>
                    <div className="text-xs text-text-muted uppercase tracking-wide">Commits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-text-primary">Top 0.1%</div>
                    <div className="text-xs text-text-muted uppercase tracking-wide">Impact</div>
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-medium text-text-muted/60 tracking-widest uppercase">
                  Interactive Preview
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
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

          {/* Footer - Minimal */}
          <footer className="mt-24 pb-8 text-center border-t border-glass-border pt-8">
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Maybe add social icons later */}
            </div>
            <p className="text-sm text-text-muted mb-2">
              Powered by public signals from GitHub, npm, and Hacker News.
            </p>
            <p className="text-xs text-text-muted/40">
              DevPersona &copy; 2026
            </p>
          </footer>
        </div>
      </div>
    </ConvexClientProvider>
  );
}
