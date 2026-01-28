'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';

const REPORT_REASONS: Record<string, string> = {
  spam: "Spam or promotional content",
  harassment: "Harassment or bullying",
  misinformation: "False or misleading information",
  inappropriate: "Inappropriate or offensive content",
  impersonation: "Impersonation or fake account",
  other: "Other violation",
};

export default function ModerationDashboard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const currentUsername = user?.username || '';

  // Get builder rank to check mod privileges
  const builderRank = useQuery(
    api.builderRanks.getByUsername,
    currentUsername ? { username: currentUsername } : 'skip'
  );

  const stats = useQuery(api.reports.getStats);
  const pendingReports = useQuery(api.reports.getPending, { limit: 50 });
  const reviewReport = useMutation(api.reports.review);

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has mod privileges (T4+)
  const hasModerationAccess = builderRank && builderRank.tier >= 4;

  if (!isLoaded || builderRank === undefined) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
        <p className="text-zinc-500 mb-6">Please sign in to access the moderation dashboard.</p>
        <Link
          href="/sign-in"
          className="px-5 py-2.5 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors"
        >
          Sign In
        </Link>
      </main>
    );
  }

  if (!hasModerationAccess) {
    return (
      <main className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🛡️</div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-zinc-500 mb-2">Moderation access requires Tier 4+ (Commander).</p>
        <p className="text-sm text-zinc-600 mb-6">
          Current tier: T{builderRank?.tier || 0}
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
        >
          Go Home
        </Link>
      </main>
    );
  }

  const handleReview = async (status: 'reviewed' | 'actioned' | 'dismissed') => {
    if (!selectedReport || !currentUsername) return;

    setIsSubmitting(true);
    try {
      await reviewReport({
        reportId: selectedReport as Id<"reports">,
        reviewerUsername: currentUsername,
        status,
        notes: reviewNotes || undefined,
      });
      setSelectedReport(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to review report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Header */}
      <section className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🛡️</span>
            <h1 className="text-2xl font-bold text-white">Moderation Dashboard</h1>
          </div>
          <p className="text-zinc-500">Review and manage reported content.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content - Reports Queue */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Pending Reports</h2>
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-sm font-medium">
                {stats?.pending || 0} pending
              </span>
            </div>

            {!pendingReports ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : pendingReports.length === 0 ? (
              <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-zinc-500">No pending reports. All clear!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    isSelected={selectedReport === report._id}
                    onSelect={() => setSelectedReport(report._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-4">
            {/* Stats Card */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
                Statistics
              </h3>
              {stats && (
                <div className="grid grid-cols-2 gap-4">
                  <StatItem label="Total Reports" value={stats.total} />
                  <StatItem label="Pending" value={stats.pending} color="amber" />
                  <StatItem label="Actioned" value={stats.actioned} color="red" />
                  <StatItem label="Dismissed" value={stats.dismissed} color="zinc" />
                </div>
              )}
            </div>

            {/* Review Panel */}
            {selectedReport && (
              <div className="rounded-xl bg-white/[0.02] border border-violet-500/30 p-4">
                <h3 className="text-sm font-medium text-white mb-4">Review Report</h3>

                <textarea
                  placeholder="Add moderation notes (optional)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500/50 resize-none"
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleReview('actioned')}
                    disabled={isSubmitting}
                    className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                  >
                    Take Action
                  </button>
                  <button
                    onClick={() => handleReview('dismissed')}
                    disabled={isSubmitting}
                    className="w-full py-2 rounded-lg bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 text-sm font-medium hover:bg-zinc-500/30 disabled:opacity-50 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleReview('reviewed')}
                    disabled={isSubmitting}
                    className="w-full py-2 rounded-lg bg-white/5 text-zinc-500 border border-white/10 text-sm font-medium hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    Mark as Reviewed
                  </button>
                </div>
              </div>
            )}

            {/* By Reason */}
            {stats && Object.keys(stats.byReason).length > 0 && (
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
                  By Reason
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.byReason).map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">{REPORT_REASONS[reason] || reason}</span>
                      <span className="text-zinc-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

interface ReportCardProps {
  report: {
    _id: string;
    reporterUsername: string;
    targetType: string;
    targetId: string;
    reason: string;
    details?: string;
    status: string;
    createdAt: number;
  };
  isSelected: boolean;
  onSelect: () => void;
}

function ReportCard({ report, isSelected, onSelect }: ReportCardProps) {
  const timeAgo = formatTimeAgo(report.createdAt);

  return (
    <article
      onClick={onSelect}
      className={cn(
        "rounded-xl p-4 cursor-pointer transition-all",
        "bg-white/[0.02] border",
        isSelected
          ? "border-violet-500/50 bg-violet-500/5"
          : "border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              report.reason === 'spam' && "bg-yellow-500/20 text-yellow-400",
              report.reason === 'harassment' && "bg-red-500/20 text-red-400",
              report.reason === 'misinformation' && "bg-orange-500/20 text-orange-400",
              report.reason === 'inappropriate' && "bg-pink-500/20 text-pink-400",
              report.reason === 'impersonation' && "bg-purple-500/20 text-purple-400",
              report.reason === 'other' && "bg-zinc-500/20 text-zinc-400"
            )}
          >
            {report.reason}
          </span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-zinc-500">
            {report.targetType}
          </span>
        </div>
        <span className="text-xs text-zinc-600">{timeAgo}</span>
      </div>

      <p className="text-sm text-zinc-400 mb-2">
        Reported by <span className="text-zinc-300">@{report.reporterUsername}</span>
      </p>

      {report.details && (
        <p className="text-sm text-zinc-500 line-clamp-2">{report.details}</p>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-zinc-600">
        Target ID: {report.targetId.slice(0, 20)}...
      </div>
    </article>
  );
}

function StatItem({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: number;
  color?: 'white' | 'amber' | 'red' | 'zinc';
}) {
  const colorClasses = {
    white: 'text-white',
    amber: 'text-amber-400',
    red: 'text-red-400',
    zinc: 'text-zinc-400',
  };

  return (
    <div>
      <div className={cn("text-2xl font-bold", colorClasses[color])}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function formatTimeAgo(createdAt: number): string {
  const diff = Date.now() - createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
