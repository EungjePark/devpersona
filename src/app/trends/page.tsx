import { Metadata } from 'next';
import Link from 'next/link';
import {
  LanguageChart,
  LibraryPopularity,
  RepoRankings,
  RepoHealth,
  CountryMap,
} from '@/components/trends';
import {
  SIMULATED_TRENDING_REPOS,
  SIMULATED_LANGUAGES,
  SIMULATED_LIBRARIES,
  SIMULATED_COUNTRIES,
  SIMULATED_REPO_HEALTH,
} from '@/lib/trends/types';

export const metadata: Metadata = {
  title: 'Global Tech Trends | DevPersona',
  description: 'Discover what developers are building worldwide. Trending repositories, popular languages, and ecosystem insights.',
  openGraph: {
    title: 'Global Tech Trends | DevPersona',
    description: 'Discover what developers are building worldwide',
    type: 'website',
  },
};

export default function TrendsPage() {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg">
                D
              </div>
              <span className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                DevPersona
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/leaderboard"
                className="text-sm text-text-muted hover:text-white transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/trends"
                className="text-sm text-purple-400 font-medium"
              >
                Trends
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Global Tech <span className="text-gradient-primary">Trends</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Discover what developers are building worldwide. Real-time insights into
            languages, libraries, and the open source ecosystem.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Updated hourly
            </span>
            <span>•</span>
            <span>Data from GitHub, npm, and more</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Trending Repos - Full Width */}
        <div className="mb-12 bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <RepoRankings repos={SIMULATED_TRENDING_REPOS} />
        </div>

        {/* Two Column Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Language Distribution */}
          <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
            <LanguageChart languages={SIMULATED_LANGUAGES} />
          </div>

          {/* Library Popularity */}
          <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
            <LibraryPopularity libraries={SIMULATED_LIBRARIES} />
          </div>
        </div>

        {/* Repo Health - Full Width */}
        <div className="mb-12 bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <RepoHealth health={SIMULATED_REPO_HEALTH} />
        </div>

        {/* Country Distribution - Full Width */}
        <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <CountryMap countries={SIMULATED_COUNTRIES} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            See where you stand
          </h2>
          <p className="text-text-muted mb-6">
            Analyze your GitHub profile and compare with developers worldwide
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <span>Analyze Your Profile</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Data sources: GitHub API, npm Registry, HN Algolia
            </p>
            <p className="text-sm text-text-muted">
              Built with <span className="text-red-400">♥</span> by DevPersona
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
