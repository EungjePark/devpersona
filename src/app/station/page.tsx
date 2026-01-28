'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-tokens';

// Dummy stations for when there's no data
const DUMMY_STATIONS = [
  {
    _id: 'dummy-1',
    slug: 'devflow',
    name: 'DevFlow',
    description: 'AI-powered development workflow automation. Ship faster with intelligent CI/CD and code review.',
    ownerUsername: 'torvalds',
    ownerName: 'Linus Torvalds',
    ownerAvatar: 'https://avatars.githubusercontent.com/u/1024025',
    memberCount: 1847,
    postCount: 234,
    logoUrl: undefined,
    accentColor: '#8b5cf6',
    status: 'active',
  },
  {
    _id: 'dummy-2',
    slug: 'codeweave',
    name: 'CodeWeave',
    description: 'Real-time collaborative coding platform. Pair program with anyone, anywhere.',
    ownerUsername: 'gaearon',
    ownerName: 'Dan Abramov',
    ownerAvatar: 'https://avatars.githubusercontent.com/u/810438',
    memberCount: 923,
    postCount: 156,
    logoUrl: undefined,
    accentColor: '#06b6d4',
    status: 'active',
  },
  {
    _id: 'dummy-3',
    slug: 'stacksmith',
    name: 'StackSmith',
    description: 'Full-stack boilerplate generator. Start your next project in seconds.',
    ownerUsername: 'sindresorhus',
    ownerName: 'Sindre Sorhus',
    ownerAvatar: 'https://avatars.githubusercontent.com/u/170270',
    memberCount: 612,
    postCount: 89,
    logoUrl: undefined,
    accentColor: '#f59e0b',
    status: 'active',
  },
  {
    _id: 'dummy-4',
    slug: 'apiforge',
    name: 'APIForge',
    description: 'Design, document, and deploy APIs with zero friction. OpenAPI-first workflow.',
    ownerUsername: 'wycats',
    ownerName: 'Yehuda Katz',
    ownerAvatar: 'https://avatars.githubusercontent.com/u/4',
    memberCount: 445,
    postCount: 67,
    logoUrl: undefined,
    accentColor: '#10b981',
    status: 'active',
  },
  {
    _id: 'dummy-5',
    slug: 'deploybird',
    name: 'DeployBird',
    description: 'One-click deployments for any framework. Vercel alternative with more control.',
    ownerUsername: 'rauchg',
    ownerName: 'Guillermo Rauch',
    ownerAvatar: 'https://avatars.githubusercontent.com/u/13041',
    memberCount: 387,
    postCount: 52,
    logoUrl: undefined,
    accentColor: '#ec4899',
    status: 'active',
  },
  {
    _id: 'dummy-6',
    slug: 'debugly',
    name: 'Debugly',
    description: 'AI debugging assistant that explains errors and suggests fixes in real-time.',
    ownerUsername: 'kentcdodds',
    ownerName: 'Kent C. Dodds',
    ownerAvatar: 'https://avatars.githubusercontent.com/u/1500684',
    memberCount: 298,
    postCount: 41,
    logoUrl: undefined,
    accentColor: '#ef4444',
    status: 'active',
  },
];

export default function StationListPage() {
  const stations = useQuery(api.productStations.listAll, { limit: 50, sortBy: 'members' });

  // Separate loading and empty states
  const isLoading = stations === undefined;
  const isEmpty = stations !== undefined && stations.length === 0;
  const displayStations = isLoading || isEmpty ? DUMMY_STATIONS : stations;
  const isUsingDummy = isLoading || isEmpty;

  return (
    <main className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-violet-600/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-cyan-600/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative border-b border-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 mb-6">
              <span className="text-lg">🛸</span>
              <span
                className="font-medium"
                style={{ fontSize: typography.label.size, letterSpacing: typography.label.tracking }}
              >
                Product Stations
              </span>
            </div>

            <h1
              className="text-white font-semibold mb-4"
              style={{
                fontSize: typography.hero.size,
                letterSpacing: typography.hero.tracking,
              }}
            >
              Join Product Communities
            </h1>

            <p
              className="text-zinc-400 max-w-2xl mx-auto"
              style={{ fontSize: typography.body.size }}
            >
              Connect with builders, give feedback, and help products grow.
              Earn karma by contributing to other stations.
            </p>

            {isUsingDummy && (
              <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <span>✨</span>
                <span style={{ fontSize: typography.caption.size }}>
                  Showing demo stations. Real stations appear when products achieve Poten status.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div
                className="text-white font-semibold"
                style={{ fontSize: typography.title.size }}
              >
                {displayStations.length}
              </div>
              <div
                className="text-zinc-500"
                style={{ fontSize: typography.caption.size }}
              >
                Active Stations
              </div>
            </div>
            <div className="w-px h-8 bg-white/[0.05] hidden sm:block" />
            <div className="text-center">
              <div
                className="text-white font-semibold"
                style={{ fontSize: typography.title.size }}
              >
                {displayStations.reduce((sum, s) => sum + s.memberCount, 0).toLocaleString()}
              </div>
              <div
                className="text-zinc-500"
                style={{ fontSize: typography.caption.size }}
              >
                Total Crew
              </div>
            </div>
            <div className="w-px h-8 bg-white/[0.05] hidden sm:block" />
            <div className="text-center">
              <div
                className="text-white font-semibold"
                style={{ fontSize: typography.title.size }}
              >
                {displayStations.reduce((sum, s) => sum + s.postCount, 0).toLocaleString()}
              </div>
              <div
                className="text-zinc-500"
                style={{ fontSize: typography.caption.size }}
              >
                Discussions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stations Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {!stations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayStations.map((station, index) => (
              <StationCard
                key={station._id}
                station={station}
                index={index}
                isDummy={isUsingDummy}
              />
            ))}
          </div>
        )}

        {/* CTA if no real stations */}
        {isUsingDummy && (
          <div className="mt-12 text-center">
            <p
              className="text-zinc-500 mb-4"
              style={{ fontSize: typography.body.size }}
            >
              Want your product here? Ship it in Launch Week and earn Poten status!
            </p>
            <Link
              href="/launch"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                "bg-gradient-to-r from-violet-600 to-fuchsia-600",
                "text-white font-semibold",
                "hover:from-violet-500 hover:to-fuchsia-500",
                "shadow-lg shadow-violet-500/25",
                "transition-all duration-200"
              )}
            >
              <span>🚀</span>
              <span>Go to Launch Week</span>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

interface StationCardProps {
  station: {
    _id: string;
    slug: string;
    name: string;
    description: string;
    ownerUsername: string;
    ownerAvatar?: string;
    ownerName?: string;
    memberCount: number;
    postCount: number;
    logoUrl?: string;
    accentColor?: string;
    status: string;
  };
  index: number;
  isDummy?: boolean;
}

function StationCard({ station, index, isDummy }: StationCardProps) {
  const accentColor = station.accentColor || '#8b5cf6';

  const CardContent = (
    <article
      className={cn(
        "group relative rounded-2xl overflow-hidden h-full",
        "bg-white/[0.02] border border-white/[0.05]",
        "hover:bg-white/[0.04] hover:border-white/10",
        "transition-all duration-300",
        "animate-in fade-in-0 slide-in-from-bottom-2"
      )}
      style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
    >
      {/* Cover/Header */}
      <div className="relative h-28 overflow-hidden">
        {/* Gradient Background */}
        <div
          className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${accentColor}40, transparent 70%)`,
          }}
        />

        {/* Logo */}
        {station.logoUrl ? (
          <Image
            src={station.logoUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover opacity-40 group-hover:opacity-50 transition-opacity"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        )}

        {/* Station Icon */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "border-4 border-black",
              "shadow-lg group-hover:scale-105 transition-transform"
            )}
            style={{
              backgroundColor: `${accentColor}30`,
              color: accentColor,
            }}
          >
            <span
              className="font-bold"
              style={{ fontSize: typography.title.size }}
            >
              {station.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Member Count Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
          <span
            className="text-white font-medium"
            style={{ fontSize: typography.tiny.size }}
          >
            👥 {station.memberCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-10">
        <h3
          className="text-white font-semibold mb-1 group-hover:text-violet-300 transition-colors"
          style={{ fontSize: typography.body.size }}
        >
          {station.name}
        </h3>
        <p
          className="text-zinc-500 line-clamp-2 mb-4"
          style={{ fontSize: typography.caption.size }}
        >
          {station.description}
        </p>

        {/* Stats */}
        <div
          className="flex items-center gap-4 text-zinc-500"
          style={{ fontSize: typography.tiny.size }}
        >
          <span className="flex items-center gap-1.5">
            <span>📝</span>
            <span>{station.postCount} posts</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span>💬</span>
            <span>Active</span>
          </span>
        </div>

        {/* Captain */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.05]">
          {station.ownerAvatar ? (
            <Image
              src={station.ownerAvatar}
              alt=""
              width={24}
              height={24}
              className="rounded-full border border-white/10"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <span style={{ fontSize: typography.tiny.size }} aria-hidden="true">👤</span>
            </div>
          )}
          <span style={{ fontSize: typography.tiny.size }} className="text-zinc-500">
            Captain:{' '}
            <span className="text-zinc-400">@{station.ownerUsername}</span>
          </span>
        </div>
      </div>

      {/* Dummy Badge */}
      {isDummy && (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
          <span style={{ fontSize: typography.tiny.size }} className="text-amber-400">
            Demo
          </span>
        </div>
      )}
    </article>
  );

  if (isDummy) {
    return <div className="cursor-not-allowed opacity-80">{CardContent}</div>;
  }

  return <Link href={`/station/${station.slug}`}>{CardContent}</Link>;
}
