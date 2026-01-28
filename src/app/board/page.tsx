'use client';

import { useState, memo, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuth, useUser, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '../../../convex/_generated/api';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';

// Type-safe vote and status types
type VoteType = "support" | "oppose";
type IdeaStatus = "open" | "validated" | "launched" | "closed";

// User vote map type (ideaId -> vote)
type UserVoteMap = Record<string, { voteType: VoteType }>;

interface Idea {
  _id: Id<"ideaValidations">;
  authorUsername: string;
  title: string;
  problem: string;
  solution: string;
  targetAudience: string;
  supportVotes: number;
  opposeVotes: number;
  commentCount: number;
  hotScore: number;
  status: IdeaStatus;
  validatedAt?: number;
  linkedLaunchId?: Id<"launches">;
  createdAt: number;
}

// Roasting status badge
const STATUS_BADGES: Record<IdeaStatus, { label: string; color: string; bg: string }> = {
  open: { label: '🔥 Being Roasted', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  validated: { label: '🚀 Survived the Fire', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  launched: { label: '🎯 Shipped', color: 'text-violet-400', bg: 'bg-violet-500/20' },
  closed: { label: '💀 Burned', color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
};

// Idea card component
const IdeaCard = memo(function IdeaCard({
  idea,
  userVote,
  onVote,
  isSignedIn,
  currentUsername,
}: {
  idea: Idea;
  userVote: { voteType: VoteType } | null | undefined;
  onVote: (type: VoteType, reason?: string) => void;
  isSignedIn: boolean;
  currentUsername?: string;
}) {
  const netVotes = idea.supportVotes - idea.opposeVotes;
  const totalVotes = idea.supportVotes + idea.opposeVotes;
  const supportRatio = totalVotes > 0 ? Math.round((idea.supportVotes / totalVotes) * 100) : 0;
  const statusBadge = STATUS_BADGES[idea.status] || STATUS_BADGES.open;

  const [showVoteInput, setShowVoteInput] = useState(false);
  const [voteReason, setVoteReason] = useState('');
  const [pendingVote, setPendingVote] = useState<VoteType | null>(null);

  const handleVoteClick = (type: VoteType) => {
    if (!isSignedIn) return;
    setPendingVote(type);
    setShowVoteInput(true);
  };

  const submitVote = () => {
    if (pendingVote) {
      onVote(pendingVote, voteReason.trim() || undefined);
      setShowVoteInput(false);
      setVoteReason('');
      setPendingVote(null);
    }
  };

  return (
    <div className="group p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", statusBadge.bg, statusBadge.color)}>
              {statusBadge.label}
            </span>
            {idea.status === 'validated' && (
              <span className="text-emerald-400 text-xs">✓ Survived the Roast!</span>
            )}
          </div>
          <Link href={`/board/idea/${idea._id}`}>
            <h3 className="text-lg font-semibold text-zinc-200 hover:text-white transition-colors line-clamp-2">
              {idea.title}
            </h3>
          </Link>
          <p className="text-[13px] text-zinc-500 mt-1">
            @{idea.authorUsername} · {formatTime(idea.createdAt)}
          </p>
        </div>

        {/* Vote Stats */}
        <div className="flex flex-col items-center text-center shrink-0">
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            netVotes > 10 ? "text-emerald-400" : netVotes > 0 ? "text-emerald-500/70" : netVotes < 0 ? "text-red-400" : "text-zinc-500"
          )}>
            {netVotes > 0 ? `+${netVotes}` : netVotes}
          </span>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">net</span>
        </div>
      </div>

      {/* Problem & Solution Preview */}
      <div className="mb-4 space-y-2">
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-[11px] uppercase tracking-wider text-red-400/70 mb-1">Problem</p>
          <p className="text-sm text-zinc-400 line-clamp-2">{idea.problem}</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-[11px] uppercase tracking-wider text-emerald-400/70 mb-1">Solution</p>
          <p className="text-sm text-zinc-400 line-clamp-2">{idea.solution}</p>
        </div>
      </div>

      {/* Target Audience */}
      <div className="mb-4">
        <span className="text-[11px] text-zinc-600 uppercase tracking-wider">Target: </span>
        <span className="text-sm text-zinc-400">{idea.targetAudience}</span>
      </div>

      {/* Voting Bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${supportRatio}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[11px] text-zinc-500">
          <span>🚀 {idea.supportVotes} Build it!</span>
          <span>🔥 {idea.opposeVotes} Burn it!</span>
        </div>
      </div>

      {/* Vote Buttons */}
      {idea.status === 'open' && (
        <div className="flex items-center gap-3">
          {isSignedIn && currentUsername ? (
            showVoteInput ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={voteReason}
                  onChange={(e) => setVoteReason(e.target.value)}
                  placeholder="Why? (optional, +2 bonus)…"
                  aria-label="Vote reason"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus-visible:ring-2 focus-visible:ring-violet-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitVote}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      pendingVote === 'support' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                    )}
                  >
                    {pendingVote === 'support' ? '🚀 Build it!' : '🔥 Burn it!'}
                  </button>
                  <button
                    onClick={() => { setShowVoteInput(false); setPendingVote(null); }}
                    className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleVoteClick('support')}
                  disabled={userVote?.voteType === 'support'}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                    userVote?.voteType === 'support'
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                  )}
                >
                  <span>🚀</span>
                  <span>Build it!</span>
                </button>
                <button
                  onClick={() => handleVoteClick('oppose')}
                  disabled={userVote?.voteType === 'oppose'}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                    userVote?.voteType === 'oppose'
                      ? "bg-red-600 text-white"
                      : "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30"
                  )}
                >
                  <span>🔥</span>
                  <span>Burn it!</span>
                </button>
              </>
            )
          ) : isSignedIn ? (
            <Link
              href="/"
              className="flex-1 py-2.5 rounded-lg bg-white/5 text-sm text-zinc-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10 text-center"
            >
              Analyze your GitHub to vote
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="flex-1 py-2.5 rounded-lg bg-white/5 text-sm text-zinc-400 hover:bg-white/10 hover:text-white transition-colors border border-white/10">
                Sign in to vote
              </button>
            </SignInButton>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
        <Link href={`/board/idea/${idea._id}`} className="text-sm text-zinc-500 hover:text-white transition-colors">
          💬 {idea.commentCount} comments
        </Link>
        {idea.status === 'validated' && currentUsername === idea.authorUsername && !idea.linkedLaunchId && (
          <Link
            href={`/launch?ideaId=${idea._id}`}
            className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Launch this idea →
          </Link>
        )}
      </div>
    </div>
  );
});

// Submit Idea Form
function SubmitIdeaForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { title: string; problem: string; solution: string; targetAudience: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !problem.trim() || !solution.trim() || !targetAudience.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title, problem, solution, targetAudience });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit idea');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
      <h3 className="text-lg font-semibold text-white mb-4">🔥 Throw Your Idea in the Fire</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="idea-title" className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Title</label>
          <input
            id="idea-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A clear, concise title for your idea…"
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus-visible:ring-2 focus-visible:ring-violet-500"
          />
        </div>

        <div>
          <label htmlFor="idea-problem" className="block text-[11px] uppercase tracking-wider text-red-400/70 mb-1.5">Problem</label>
          <textarea
            id="idea-problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="What problem are you trying to solve?…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-red-500/20 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/40 focus-visible:ring-2 focus-visible:ring-red-500 resize-none"
          />
        </div>

        <div>
          <label htmlFor="idea-solution" className="block text-[11px] uppercase tracking-wider text-emerald-400/70 mb-1.5">Solution</label>
          <textarea
            id="idea-solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="How do you plan to solve this problem?…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-emerald-500/20 text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
          />
        </div>

        <div>
          <label htmlFor="idea-target" className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Target Audience</label>
          <input
            id="idea-target"
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Who will benefit from this solution?…"
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus-visible:ring-2 focus-visible:ring-violet-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-4">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !problem.trim() || !solution.trim() || !targetAudience.trim()}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium",
            "bg-white text-black",
            "hover:bg-zinc-200 transition-colors",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {submitting ? 'Submitting...' : 'Submit Idea'}
        </button>
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | undefined>(undefined);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [query, setQuery] = useState('');

  // Get the proper username from Convex users table (GitHub-linked username)
  const convexUser = useQuery(
    api.users.getAuthenticatedUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const currentUsername = convexUser?.user?.username || user?.username || '';

  // Queries
  const ideas = useQuery(api.ideaValidations.getByStatus, { status: statusFilter, sortBy, limit: 30 });
  const builders = useQuery(api.builderRanks.getTopBuilders, { limit: 6 });

  // Get idea IDs for batch vote query
  const ideaIds = useMemo(() => {
    return ideas?.map(idea => idea._id) ?? [];
  }, [ideas]);

  // Batch fetch user votes for all visible ideas (only when signed in)
  const userVotes = useQuery(
    api.ideaValidations.getUserVotesForIdeas,
    isSignedIn && ideaIds.length > 0
      ? { ideaIds, username: currentUsername }
      : "skip"
  ) as UserVoteMap | undefined;

  // Mutations
  const submitIdea = useMutation(api.ideaValidations.submitIdea);
  const voteOnIdea = useMutation(api.ideaValidations.voteOnIdea);

  // Filter by search query
  const filtered = useMemo(() => {
    return ideas?.filter(idea => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        idea.title.toLowerCase().includes(q) ||
        idea.problem.toLowerCase().includes(q) ||
        idea.authorUsername.toLowerCase().includes(q)
      );
    });
  }, [ideas, query]);

  const handleSubmitIdea = useCallback(async (data: { title: string; problem: string; solution: string; targetAudience: string }) => {
    if (!isSignedIn || !currentUsername) return;
    await submitIdea({
      authorUsername: currentUsername,
      ...data,
    });
    setShowSubmitForm(false);
  }, [isSignedIn, currentUsername, submitIdea]) as (data: { title: string; problem: string; solution: string; targetAudience: string }) => Promise<void>;

  const handleVote = useCallback(async (ideaId: Id<"ideaValidations">, voteType: VoteType, reason?: string) => {
    if (!isSignedIn || !currentUsername) return;
    try {
      await voteOnIdea({
        ideaId,
        voterUsername: currentUsername,
        voteType,
        reason,
      });
    } catch (e) {
      console.error('Vote failed:', e);
    }
  }, [isSignedIn, currentUsername, voteOnIdea]);

  // Helper to get user's vote for a specific idea
  const getUserVoteForIdea = useCallback((ideaId: Id<"ideaValidations">): { voteType: VoteType } | undefined => {
    if (!userVotes) return undefined;
    return userVotes[ideaId.toString()];
  }, [userVotes]);

  return (
    <main className="min-h-screen bg-black text-white antialiased">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl bg-black/80 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🔥</span> Roasting
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">Get your ideas roasted before you build</p>
            </div>
            {isLoaded && isSignedIn && (
              <button
                onClick={() => setShowSubmitForm(true)}
                className="group relative px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-[length:200%_100%] text-white text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-300 ease-out overflow-hidden animate-[gradient-shift_3s_ease_infinite]"
              >
                {/* Fire particles effect on hover */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="absolute bottom-0 left-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-[float-up_1s_ease-out_infinite]" />
                  <span className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-orange-300 rounded-full animate-[float-up_1.2s_ease-out_infinite_0.2s]" />
                  <span className="absolute bottom-0 left-3/4 w-1 h-1 bg-red-300 rounded-full animate-[float-up_0.8s_ease-out_infinite_0.4s]" />
                </span>
                {/* Glow effect */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/0 via-orange-400/30 to-yellow-400/0 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300" />
                {/* Content */}
                <span className="relative flex items-center gap-2">
                  <span className="text-lg group-hover:animate-bounce">🍳</span>
                  <span>Throw Idea in Fire</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">🔥</span>
                </span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/50">
            {/* Sort */}
            <div className="flex items-center gap-1 bg-zinc-900/50 rounded-lg p-1">
              {(['hot', 'new', 'top'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                    sortBy === sort ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {sort === 'hot' ? '🔥 Hot' : sort === 'new' ? '🆕 New' : '📈 Top'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter((e.target.value || undefined) as IdeaStatus | undefined)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="validated">Validated</option>
              <option value="launched">Launched</option>
            </select>

            {/* Search */}
            <div className="flex-1 relative">
              <label htmlFor="search-ideas" className="sr-only">Search ideas</label>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search-ideas"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ideas…"
                className="w-full h-9 pl-10 pr-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Submit Form */}
        {showSubmitForm && isSignedIn && (
          <div className="mb-8">
            <SubmitIdeaForm
              onSubmit={handleSubmitIdea}
              onCancel={() => setShowSubmitForm(false)}
            />
          </div>
        )}

        {/* Validation Info Banner */}
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-violet-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Survive the Roast</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ideas survive the fire and become <span className="text-emerald-400 font-medium">Launch-Ready</span> when they receive{' '}
                <span className="text-white">20+ net &quot;Build it!&quot; votes</span>,{' '}
                <span className="text-white">10+ roasters</span>,{' '}
                <span className="text-white">60%+ approval</span>, and{' '}
                <span className="text-white">5+ comments</span>.
                Survivors can ship in Launch Week!
              </p>
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        {ideas === undefined ? (
          <div className="py-20 text-center text-zinc-600">Loading ideas...</div>
        ) : filtered && filtered.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-4xl mb-4 block">🔥</span>
            <p className="text-zinc-500">{query ? 'No matching ideas' : 'The fire is cold. Throw your idea in!'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered?.map((idea) => (
              <IdeaCard
                key={idea._id}
                idea={idea as Idea}
                userVote={getUserVoteForIdea(idea._id)}
                onVote={(type, reason) => handleVote(idea._id, type, reason)}
                isSignedIn={isSignedIn || false}
                currentUsername={currentUsername}
              />
            ))}
          </div>
        )}

        {/* Sidebar Content */}
        <div className="mt-16 pt-10 border-t border-zinc-800/30">
          {/* Top Builders - Horizontal scrollable showcase */}
          {builders && builders.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                    <span className="text-sm">👑</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white tracking-tight">Top Builders</h2>
                    <p className="text-[11px] text-zinc-600">This week&apos;s champions</p>
                  </div>
                </div>
                <Link
                  href="/hall-of-fame?view=builders"
                  className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
                >
                  View All →
                </Link>
              </div>

              {/* Horizontal scroll container - with proper overflow padding */}
              <div className="relative -mx-6 px-6">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />

                <div className="flex gap-4 overflow-x-auto pt-4 pb-4 scrollbar-hide">
                  {builders.slice(0, 6).map((b, index) => (
                    <Link
                      key={b._id}
                      href={`/analyze/${b.username}`}
                      className="group relative flex-shrink-0 w-[130px] pt-5 pb-4 px-3 rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-amber-500/5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Rank badge - now inside card with proper spacing */}
                      <div className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shadow-lg",
                        index === 0 && "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300/50 text-black shadow-amber-500/30",
                        index === 1 && "bg-gradient-to-br from-zinc-300 to-zinc-400 border-zinc-200/50 text-zinc-800 shadow-zinc-400/30",
                        index === 2 && "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500/50 text-amber-100 shadow-amber-700/30",
                        index > 2 && "bg-zinc-800 border-zinc-600 text-zinc-400"
                      )}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>

                      {/* Avatar with ring */}
                      <div className="relative mx-auto mb-2.5 mt-1">
                        <div className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold ring-2 ring-offset-2 ring-offset-zinc-950 transition-all duration-300",
                          index === 0 && "bg-gradient-to-br from-amber-500 to-orange-600 ring-amber-500/50 group-hover:ring-amber-400",
                          index === 1 && "bg-gradient-to-br from-zinc-400 to-zinc-500 ring-zinc-400/50 group-hover:ring-zinc-300",
                          index === 2 && "bg-gradient-to-br from-amber-700 to-amber-800 ring-amber-700/50 group-hover:ring-amber-600",
                          index > 2 && "bg-gradient-to-br from-zinc-700 to-zinc-800 ring-zinc-600/50 group-hover:ring-zinc-500"
                        )}>
                          <span className="text-white drop-shadow-md">{b.username.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Username */}
                      <p className="text-[13px] font-medium text-white text-center truncate group-hover:text-amber-200 transition-colors">
                        @{b.username}
                      </p>

                      {/* Score with animated bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-base font-bold text-white tabular-nums">{b.tierScore}</span>
                          <span className="text-[9px] text-zinc-600 uppercase">pts</span>
                        </div>
                        <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              index === 0 && "bg-gradient-to-r from-amber-500 to-orange-400",
                              index === 1 && "bg-gradient-to-r from-zinc-400 to-zinc-300",
                              index === 2 && "bg-gradient-to-r from-amber-700 to-amber-600",
                              index > 2 && "bg-zinc-600"
                            )}
                            style={{ width: `${Math.min(100, (b.tierScore / (builders[0]?.tierScore || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Quick Actions - Premium card design */}
          <section className="grid sm:grid-cols-2 gap-4">
            {/* Launch Week Card */}
            <Link
              href="/launch"
              className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-violet-950/40 via-violet-900/20 to-black border border-violet-500/20 hover:border-violet-400/40 transition-all duration-500"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(139,92,246,0.15),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Floating particles */}
              <div className="absolute top-4 right-4 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute w-1 h-1 rounded-full bg-violet-400/60 animate-pulse" style={{ top: '10%', left: '20%' }} />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-violet-300/40 animate-pulse" style={{ top: '60%', left: '70%', animationDelay: '0.5s' }} />
                <div className="absolute w-1 h-1 rounded-full bg-violet-400/50 animate-pulse" style={{ top: '30%', left: '80%', animationDelay: '1s' }} />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-medium text-violet-300 uppercase tracking-wider">
                    Live Now
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-violet-200 transition-colors">
                  Launch Week
                </h3>
                <p className="text-sm text-zinc-500 mb-4 group-hover:text-zinc-400 transition-colors">
                  Ship your validated ideas to the world
                </p>

                <div className="flex items-center gap-2 text-violet-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Ship Now</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Hall of Fame Card */}
            <Link
              href="/hall-of-fame"
              className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-black border border-amber-500/20 hover:border-amber-400/40 transition-all duration-500"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(251,191,36,0.15),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Trophy shine effect */}
              <div className="absolute top-0 -right-20 w-40 h-40 bg-gradient-to-br from-amber-400/10 to-transparent rotate-45 opacity-0 group-hover:opacity-100 group-hover:translate-x-10 transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-medium text-amber-300 uppercase tracking-wider">
                    Legends
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-amber-200 transition-colors">
                  Hall of Fame
                </h3>
                <p className="text-sm text-zinc-500 mb-4 group-hover:text-zinc-400 transition-colors">
                  Past winners & community champions
                </p>

                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Explore</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </section>
        </div>
      </div>

      {/* Footer - Karma earning guide */}
      <footer className="relative py-10 mt-8">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {/* Idea validation reward */}
            <div className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all duration-300 cursor-default">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-lg">✅</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">+30 CK</p>
                <p className="text-[11px] text-zinc-500">Validated ideas</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-zinc-800" />

            {/* Launch reward */}
            <div className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-violet-500/5 border border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all duration-300 cursor-default">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-lg">🚀</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-400">+20 CK</p>
                <p className="text-[11px] text-zinc-500">Launching products</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-zinc-800" />

            {/* Win reward */}
            <div className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all duration-300 cursor-default">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-lg">🏆</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-400">+50 CK</p>
                <p className="text-[11px] text-zinc-500">Weekly winner</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-zinc-700 uppercase tracking-widest">
            Community Karma (CK) • Build reputation by shipping
          </p>
        </div>
      </footer>
    </main>
  );
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 30) return `${d}d`;
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}
