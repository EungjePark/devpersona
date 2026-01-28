'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import type { BuilderTierLevel } from '@/lib/types';
import { BUILDER_TIERS } from '@/lib/types';
import { canSubmitLaunch, getCurrentWeekNumber, isLaunchWeekOpen, getTimeUntilVotingCloses } from '@/lib/builder-rank';

interface UrlMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  siteName?: string;
  url: string;
}

interface LaunchSubmitFormProps {
  username: string;
  userTier: BuilderTierLevel;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LaunchSubmitForm({ username, userTier, onSuccess, onCancel }: LaunchSubmitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Linked validated idea state
  const [linkedIdeaId, setLinkedIdeaId] = useState<Id<"ideaValidations"> | null>(null);

  // URL metadata state
  const [urlMetadata, setUrlMetadata] = useState<UrlMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const submitLaunch = useMutation(api.launches.submitLaunch);

  // Fetch user's validated ideas
  const validatedIdeas = useQuery(api.ideaValidations.getValidatedIdeas, { username });

  const canSubmit = canSubmitLaunch();
  const isOpen = isLaunchWeekOpen();
  const timeRemaining = getTimeUntilVotingCloses();
  const weekNumber = getCurrentWeekNumber();
  const tierInfo = BUILDER_TIERS[userTier];

  // Fetch URL metadata with debounce
  useEffect(() => {
    if (!demoUrl.trim()) {
      setUrlMetadata(null);
      setMetadataError(null);
      return;
    }

    // Validate URL format
    try {
      new URL(demoUrl);
    } catch {
      setUrlMetadata(null);
      setMetadataError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsFetchingMetadata(true);
      setMetadataError(null);

      try {
        const response = await fetch(`/api/unfurl?url=${encodeURIComponent(demoUrl)}`);
        if (response.ok) {
          const data = await response.json();
          setUrlMetadata(data);

          // Auto-fill title and description if empty (using functional updates to read current values)
          setTitle((currentTitle) => {
            if (!currentTitle.trim() && data.title) {
              return data.title.slice(0, 50);
            }
            return currentTitle;
          });
          setDescription((currentDesc) => {
            if (!currentDesc.trim() && data.description) {
              return data.description.slice(0, 100);
            }
            return currentDesc;
          });
        } else {
          setMetadataError('Could not fetch preview');
        }
      } catch {
        setMetadataError('Failed to load preview');
      } finally {
        setIsFetchingMetadata(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [demoUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError('You need to be Pilot (T2) or higher to submit launches.');
      return;
    }

    if (!isOpen) {
      setError('Launch Week submissions are closed. Try again next Monday!');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a project title.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a project description.');
      return;
    }

    if (!demoUrl.trim()) {
      setError('Please enter a demo URL.');
      return;
    }

    if (!isValidUrl(demoUrl)) {
      setError('Please enter a valid demo URL.');
      return;
    }

    if (githubUrl && !isValidUrl(githubUrl)) {
      setError('Please enter a valid GitHub URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLaunch({
        username,
        title: title.trim(),
        description: description.trim(),
        demoUrl: demoUrl.trim(),
        githubUrl: githubUrl.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        problemSolved: problemSolved.trim() || undefined,
        weekNumber,
        // Include metadata if available
        screenshot: urlMetadata?.ogImage || undefined,
        ogImage: urlMetadata?.ogImage || undefined,
        favicon: urlMetadata?.favicon || undefined,
        siteName: urlMetadata?.siteName || undefined,
        // Linked validated idea
        linkedIdeaId: linkedIdeaId || undefined,
      });

      setTitle('');
      setDescription('');
      setDemoUrl('');
      setGithubUrl('');
      setTargetAudience('');
      setProblemSolved('');
      setUrlMetadata(null);
      setLinkedIdeaId(null);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit launch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isOpen, title, description, demoUrl, githubUrl, targetAudience, problemSolved, username, weekNumber, urlMetadata, linkedIdeaId, submitLaunch, onSuccess]);

  // Tier too low
  if (!canSubmit) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
            {tierInfo.icon}
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Tier Required</h3>
            <p className="text-sm text-zinc-400 mb-3">
              You need to be <span className="text-amber-400 font-medium">Pilot (T2)</span> or higher to submit launches.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <span className="text-zinc-500">Current tier:</span>
              <span className="text-white font-medium">{tierInfo.name}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Submissions closed
  if (!isOpen) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">
            🕐
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Submissions Closed</h3>
            <p className="text-sm text-zinc-400">
              Launch Week submissions open every <span className="text-blue-400">Monday at 00:00 UTC</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent border border-white/10 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl shadow-lg shadow-violet-500/25">
              🚀
            </div>
            <div>
              <h3 className="font-semibold text-white">Launch Your Product</h3>
              <p className="text-xs text-zinc-500">
                Week {weekNumber.split('-W')[1]} • {timeRemaining ? `${timeRemaining.hours}h ${timeRemaining.minutes}m left` : 'Open for submissions'}
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close form"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* URL Input - Primary Focus */}
        <div className="mb-6">
          <label htmlFor="launch-demo" className="block text-sm font-medium text-zinc-300 mb-2">
            Demo URL <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="launch-demo"
              name="demoUrl"
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://your-awesome-project.vercel.app…"
              required
              autoComplete="url"
              className={cn(
                "w-full h-12 pl-11 pr-4 rounded-xl text-base",
                "bg-white/5 border-2 border-white/10",
                "text-white placeholder:text-zinc-600",
                "focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07]",
                "transition-all duration-200",
                urlMetadata && "border-emerald-500/30"
              )}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {isFetchingMetadata ? (
                <svg className="w-4 h-4 text-zinc-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : urlMetadata?.favicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urlMetadata.favicon}
                  alt=""
                  className="w-4 h-4 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              )}
            </div>
          </div>

          {/* URL Preview Card */}
          {(urlMetadata || isFetchingMetadata) && (
            <div className="mt-3 rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] animate-in fade-in slide-in-from-top-2 duration-200">
              {isFetchingMetadata ? (
                <div className="p-4 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ) : urlMetadata && (
                <div className="flex">
                  {urlMetadata.ogImage && (
                    <div className="w-32 h-24 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={urlMetadata.ogImage}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {urlMetadata.favicon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={urlMetadata.favicon}
                          alt=""
                          className="w-4 h-4 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-xs text-zinc-500 truncate">
                        {urlMetadata.siteName || (() => { try { return new URL(urlMetadata.url).hostname; } catch { return urlMetadata.url; } })()}
                      </span>
                    </div>
                    {urlMetadata.title && (
                      <p className="text-sm font-medium text-white truncate">{urlMetadata.title}</p>
                    )}
                    {urlMetadata.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{urlMetadata.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {metadataError && (
            <p className="mt-2 text-xs text-amber-400">{metadataError}</p>
          )}
        </div>

        {/* Title & Description */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label htmlFor="launch-title" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Product Name <span className="text-red-400">*</span>
              {urlMetadata?.title && !title && (
                <span className="ml-2 text-emerald-400">Auto-filled</span>
              )}
            </label>
            <input
              id="launch-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Project…"
              maxLength={50}
              required
              autoComplete="off"
              className={cn(
                "w-full h-11 px-4 rounded-xl text-sm",
                "bg-white/5 border border-white/10",
                "text-white placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50",
                "transition-all"
              )}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-zinc-600">Give it a catchy name</span>
              <span className={title.length > 40 ? "text-amber-400" : "text-zinc-600"}>{title.length}/50</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="launch-description" className="block text-xs font-medium text-zinc-400 mb-1.5">
              One-liner <span className="text-red-400">*</span>
            </label>
            <input
              id="launch-description"
              name="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Build better products with AI-powered insights…"
              maxLength={100}
              required
              className={cn(
                "w-full h-11 px-4 rounded-xl text-sm",
                "bg-white/5 border border-white/10",
                "text-white placeholder:text-zinc-600",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50",
                "transition-all"
              )}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-zinc-600">Describe what it does in one sentence</span>
              <span className={description.length > 80 ? "text-amber-400" : "text-zinc-600"}>{description.length}/100</span>
            </div>
          </div>
        </div>

        {/* Optional Fields - Collapsible */}
        <details className="group mb-4">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 hover:text-white transition-colors select-none">
            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            Additional details (optional)
          </summary>

          <div className="mt-4 grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label htmlFor="launch-github" className="block text-xs font-medium text-zinc-500 mb-1.5">
                GitHub Repository
              </label>
              <input
                id="launch-github"
                name="githubUrl"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                autoComplete="url"
                className={cn(
                  "w-full h-10 px-3 rounded-lg text-sm",
                  "bg-white/5 border border-white/10",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50",
                  "transition-all"
                )}
              />
            </div>

            <div>
              <label htmlFor="launch-audience" className="block text-xs font-medium text-zinc-500 mb-1.5">
                Target Audience
              </label>
              <input
                id="launch-audience"
                name="targetAudience"
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Developers, Designers, Marketers..."
                maxLength={100}
                className={cn(
                  "w-full h-10 px-3 rounded-lg text-sm",
                  "bg-white/5 border border-white/10",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50",
                  "transition-all"
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="launch-problem" className="block text-xs font-medium text-zinc-500 mb-1.5">
                Problem it Solves
              </label>
              <input
                id="launch-problem"
                name="problemSolved"
                type="text"
                value={problemSolved}
                onChange={(e) => setProblemSolved(e.target.value)}
                placeholder="What pain point does this address?"
                maxLength={150}
                className={cn(
                  "w-full h-10 px-3 rounded-lg text-sm",
                  "bg-white/5 border border-white/10",
                  "text-white placeholder:text-zinc-600",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50",
                  "transition-all"
                )}
              />
            </div>

            {/* Link Validated Idea */}
            {validatedIdeas && validatedIdeas.length > 0 && (
              <div className="sm:col-span-2">
                <label htmlFor="launch-linked-idea" className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Link Validated Idea
                  <span className="ml-2 text-emerald-400">(Community Validated)</span>
                </label>
                <select
                  id="launch-linked-idea"
                  name="linkedIdeaId"
                  value={linkedIdeaId || ''}
                  onChange={(e) => setLinkedIdeaId(e.target.value ? e.target.value as Id<"ideaValidations"> : null)}
                  className={cn(
                    "w-full h-10 px-3 rounded-lg text-sm",
                    "bg-white/5 border border-white/10",
                    "text-white",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50",
                    "transition-all",
                    linkedIdeaId && "border-emerald-500/30"
                  )}
                >
                  <option value="" className="bg-zinc-900">No linked idea</option>
                  {validatedIdeas.map((idea) => (
                    <option key={idea._id} value={idea._id} className="bg-zinc-900">
                      {idea.title} (+{idea.supportVotes - idea.opposeVotes} votes)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-600">
                  Linking a validated idea shows community trust in your project
                </p>
              </div>
            )}
          </div>
        </details>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <span className="text-red-400">⚠️</span>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={cn(
                "px-5 py-3 rounded-xl text-sm font-medium transition-all",
                "bg-white/5 border border-white/10 text-zinc-400",
                "hover:bg-white/10 hover:text-white",
                "disabled:opacity-50"
              )}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !demoUrl.trim() || !title.trim() || !description.trim()}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all",
              "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
              "hover:from-violet-500 hover:to-fuchsia-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            )}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Launching...
              </>
            ) : (
              <>
                <span>🚀</span>
                Launch Now
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
