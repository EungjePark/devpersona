'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Famous developer matchups for quick comparison
const SUGGESTED_MATCHUPS = [
  { a: 'torvalds', b: 'gaearon' },
  { a: 'sindresorhus', b: 'tj' },
  { a: 'yyx990803', b: 'gaearon' },
] as const;

export default function CompareLandingPage() {
  const router = useRouter();
  const [userA, setUserA] = useState('');
  const [userB, setUserB] = useState('');
  const inputBRef = useRef<HTMLInputElement>(null);

  const handleInitiateBattle = useCallback(() => {
    const fighterA = userA.trim().replace('@', '');
    const fighterB = userB.trim().replace('@', '');

    if (fighterA && fighterB && fighterA !== fighterB) {
      router.push(`/compare/${fighterA}/${fighterB}`);
    }
  }, [userA, userB, router]);

  const handleUserAKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      inputBRef.current?.focus();
    }
  }, []);

  const handleUserBKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInitiateBattle();
    }
  }, [handleInitiateBattle]);

  const isValid = userA.trim() && userB.trim() && userA.trim() !== userB.trim();

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-primary selection:bg-primary-500/30">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors group px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <span className="transform group-hover:-translate-x-0.5 transition-transform text-xs">←</span>
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">

        {/* === ARENA BANNER === */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950/40 via-black to-orange-950/40 border border-orange-500/20">
          {/* Animated fire particles effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-1 h-8 bg-gradient-to-b from-orange-500 to-transparent animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="absolute top-0 left-1/3 w-1 h-12 bg-gradient-to-b from-red-500 to-transparent animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-0 left-1/2 w-1 h-6 bg-gradient-to-b from-yellow-500 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-0 left-2/3 w-1 h-10 bg-gradient-to-b from-orange-500 to-transparent animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-0 left-3/4 w-1 h-8 bg-gradient-to-b from-red-500 to-transparent animate-pulse" style={{ animationDelay: '0.7s' }} />
          </div>

          {/* VS Background Icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[200px] font-black text-white/[0.02] select-none">VS</span>
          </div>

          <div className="relative z-10 p-8 lg:p-12">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-400">CHALLENGE ARENA</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
            </div>

            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
                Developer <span className="text-orange-400">Showdown</span>
              </h1>
              <p className="text-text-secondary text-sm max-w-md mx-auto">
                Enter two GitHub usernames to compare their developer stats in an epic head-to-head battle
              </p>
            </div>

            {/* Fighter Input Section */}
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-4">

              {/* Fighter 1 */}
              <div className="flex-1 w-full">
                <div className="text-center mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">FIGHTER 1</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-mono font-bold text-lg">@</span>
                  <input
                    type="text"
                    placeholder="Enter username..."
                    value={userA}
                    onChange={(e) => setUserA(e.target.value)}
                    onKeyDown={handleUserAKeyDown}
                    className="w-full h-16 pl-10 pr-4 bg-black/60 border-2 border-orange-500/40 rounded-xl text-white text-lg placeholder:text-white/20 focus:outline-none focus:border-orange-500 font-medium transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center gap-2 py-4 lg:py-0">
                <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-transparent via-orange-500 to-transparent" />
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-black text-lg">VS</span>
                </div>
                <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-transparent via-orange-500 to-transparent" />
              </div>

              {/* Fighter 2 */}
              <div className="flex-1 w-full">
                <div className="text-center mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400">FIGHTER 2</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-mono font-bold text-lg">@</span>
                  <input
                    ref={inputBRef}
                    type="text"
                    placeholder="Enter username..."
                    value={userB}
                    onChange={(e) => setUserB(e.target.value)}
                    onKeyDown={handleUserBKeyDown}
                    className="w-full h-16 pl-10 pr-4 bg-black/60 border-2 border-blue-500/40 rounded-xl text-white text-lg placeholder:text-white/20 focus:outline-none focus:border-blue-500 font-medium transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Battle Button */}
            <div className="mt-8">
              <button
                onClick={handleInitiateBattle}
                disabled={!isValid}
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 p-[2px] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="relative rounded-[14px] bg-black/80 px-8 py-5 overflow-hidden">
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-red-600/20 group-hover:opacity-100 opacity-50 transition-opacity" />

                  <div className="relative flex items-center justify-center gap-4">
                    <span className="text-4xl">⚔️</span>
                    <div className="text-left">
                      <div className="text-xl font-black text-white tracking-tight">INITIATE BATTLE</div>
                      <div className="text-xs text-orange-300/70 font-mono">Compare developer stats head-to-head</div>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Suggested Battles */}
            <div className="mt-10 pt-8 border-t border-white/5">
              <div className="text-center mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">SUGGESTED MATCHUPS</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {SUGGESTED_MATCHUPS.map(({ a, b }) => (
                  <button
                    key={`${a}-${b}`}
                    onClick={() => {
                      setUserA(a);
                      setUserB(b);
                    }}
                    className="px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-sm text-text-muted hover:text-white transition-all flex items-center gap-2"
                  >
                    <span className="text-orange-400">@{a}</span>
                    <span className="text-xs text-white/30">vs</span>
                    <span className="text-blue-400">@{b}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-white mb-1">Signal Comparison</div>
            <div className="text-xs text-text-muted">Compare all 6 developer signals side by side</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium text-white mb-1">Radar Overlay</div>
            <div className="text-xs text-text-muted">Visualize strengths on a dual hexagon chart</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-sm font-medium text-white mb-1">Clear Winner</div>
            <div className="text-xs text-text-muted">See who wins in each category</div>
          </div>
        </div>
      </div>
    </div>
  );
}
