/* eslint-disable @next/next/no-img-element */
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useState, use } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Id } from '../../../../convex/_generated/dataModel';

const POST_TYPES = [
  { value: 'update', label: 'Update', emoji: '📢', description: 'Product updates and announcements' },
  { value: 'feedback', label: 'Feedback', emoji: '💬', description: 'Share your thoughts' },
  { value: 'question', label: 'Question', emoji: '❓', description: 'Ask the community' },
  { value: 'bug', label: 'Bug Report', emoji: '🐛', description: 'Report issues' },
  { value: 'feature', label: 'Feature Request', emoji: '✨', description: 'Suggest improvements' },
  { value: 'discussion', label: 'Discussion', emoji: '💭', description: 'General chat' },
] as const;

export default function StationPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const { user, isSignedIn } = useUser();
  const currentUsername = user?.externalAccounts?.find(
    (acc) => acc.provider === 'github'
  )?.username || user?.username || '';

  const station = useQuery(api.productStations.getBySlug, { slug: params.slug });
  const membership = useQuery(
    api.productStations.getMembership,
    station && currentUsername
      ? { stationId: station._id as Id<"productStations">, username: currentUsername }
      : 'skip'
  );
  const posts = useQuery(
    api.productStations.getPosts,
    station ? { stationId: station._id as Id<"productStations">, limit: 30 } : 'skip'
  );
  const crewMembers = useQuery(
    api.productStations.getCrewMembers,
    station ? { stationId: station._id as Id<"productStations">, limit: 20 } : 'skip'
  );

  const joinStation = useMutation(api.productStations.join);
  const leaveStation = useMutation(api.productStations.leave);
  const createPost = useMutation(api.productStations.createPost);

  const [activeTab, setActiveTab] = useState<'posts' | 'crew'>('posts');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<string>('feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (station === undefined) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading station...</div>
      </main>
    );
  }

  if (station === null) {
    return (
      <main className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🛸</div>
        <h1 className="text-2xl font-bold text-white mb-2">Station Not Found</h1>
        <p className="text-zinc-500 mb-6">This station does not exist or has been archived.</p>
        <Link
          href="/station"
          className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
        >
          Browse Stations
        </Link>
      </main>
    );
  }

  const isMember = !!membership;
  const isCaptain = station.ownerUsername === currentUsername;

  const handleJoin = async () => {
    if (!currentUsername) return;
    try {
      await joinStation({
        stationId: station._id as Id<"productStations">,
        username: currentUsername,
      });
    } catch (error) {
      console.error('Failed to join:', error);
    }
  };

  const handleLeave = async () => {
    if (!currentUsername) return;
    try {
      await leaveStation({
        stationId: station._id as Id<"productStations">,
        username: currentUsername,
      });
    } catch (error) {
      console.error('Failed to leave:', error);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUsername || !newPostTitle.trim() || !newPostContent.trim()) return;

    setIsSubmitting(true);
    try {
      await createPost({
        stationId: station._id as Id<"productStations">,
        authorUsername: currentUsername,
        postType: newPostType,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
      });
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPost(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPosts = selectedType
    ? posts?.filter((p) => p.postType === selectedType)
    : posts;

  const accentColor = station.accentColor || '#8b5cf6';

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Station Header */}
      <section className="relative border-b border-white/5">
        {/* Cover Image */}
        <div className="h-48 sm:h-64 relative">
          {station.logoUrl ? (
            <img
              src={station.logoUrl}
              alt={station.name}
              className="w-full h-full object-cover opacity-30"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, transparent 60%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
        </div>

        {/* Station Info */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 -mt-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            {/* Logo */}
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-bold border-4 border-bg-primary"
              style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
            >
              {station.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 pb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {station.name}
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base max-w-2xl">
                {station.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                <span className="text-zinc-500">
                  <span className="text-white font-medium">{station.memberCount}</span> crew members
                </span>
                <span className="text-zinc-500">
                  <span className="text-white font-medium">{station.postCount}</span> posts
                </span>
                {station.launch && (
                  <Link
                    href={`/launch/${station.launch._id}`}
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    View Original Launch →
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pb-4">
              {!isSignedIn ? (
                <Link
                  href="/sign-in"
                  className="px-5 py-2.5 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors"
                >
                  Sign in to Join
                </Link>
              ) : isCaptain ? (
                <span className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-medium">
                  👑 Captain
                </span>
              ) : isMember ? (
                <button
                  onClick={handleLeave}
                  className="px-5 py-2.5 rounded-lg bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Leave Station
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="px-5 py-2.5 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors"
                >
                  Join Crew
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/5 mb-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={cn(
                  "pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'posts'
                    ? "border-violet-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('crew')}
                className={cn(
                  "pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'crew'
                    ? "border-violet-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Crew ({station.memberCount})
              </button>
            </div>

            {activeTab === 'posts' ? (
              <>
                {/* Post Type Filters */}
                <div className="flex items-center gap-2 flex-wrap mb-6">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      selectedType === null
                        ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                        : "bg-white/5 text-zinc-500 border border-white/5 hover:text-zinc-300"
                    )}
                  >
                    All
                  </button>
                  {POST_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        selectedType === type.value
                          ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                          : "bg-white/5 text-zinc-500 border border-white/5 hover:text-zinc-300"
                      )}
                    >
                      {type.emoji} {type.label}
                    </button>
                  ))}
                </div>

                {/* New Post Button */}
                {isMember && !showNewPost && (
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="w-full mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left text-zinc-500 hover:bg-white/[0.04] hover:border-white/10 hover:text-zinc-400 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <span>✏️</span>
                      <span>Write a post...</span>
                    </span>
                  </button>
                )}

                {/* New Post Form */}
                {showNewPost && (
                  <form onSubmit={handleSubmitPost} className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      {POST_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setNewPostType(type.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            newPostType === type.value
                              ? "bg-violet-500/20 text-violet-400"
                              : "bg-white/5 text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          {type.emoji} {type.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Post title..."
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full mb-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                    />

                    <textarea
                      placeholder="Share your thoughts..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                      className="w-full mb-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
                    />

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowNewPost(false)}
                        className="px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !newPostTitle.trim() || !newPostContent.trim()}
                        className="px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Posts List */}
                {!filteredPosts ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-32 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-zinc-500">
                      {selectedType ? 'No posts in this category yet.' : 'No posts yet. Be the first to share!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <PostCard key={post._id} post={post} accentColor={accentColor} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Crew Tab */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!crewMembers ? (
                  [...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse"
                    />
                  ))
                ) : (
                  crewMembers.map((member) => (
                    <CrewMemberCard
                      key={member._id}
                      member={member}
                      stationOwner={station.ownerUsername}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0">
            {/* Captain Card */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 mb-4">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Captain
              </h3>
              <Link
                href={`/analyze/${station.ownerUsername}`}
                className="flex items-center gap-3 hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                {station.owner?.avatarUrl && (
                  <img
                    src={station.owner.avatarUrl}
                    alt={station.ownerUsername}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-white">
                    {station.owner?.name || station.ownerUsername}
                  </div>
                  <div className="text-sm text-zinc-500">@{station.ownerUsername}</div>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Station Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Created</span>
                  <span className="text-zinc-300">
                    {new Date(station.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Weekly Active</span>
                  <span className="text-zinc-300">{station.weeklyActiveMembers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    station.status === 'active'
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-500/20 text-zinc-400"
                  )}>
                    {station.status}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

interface PostCardProps {
  post: {
    _id: string;
    postType: string;
    title: string;
    content: string;
    authorUsername: string;
    authorAvatar?: string;
    authorName?: string;
    isOwnerPost: boolean;
    isPinned: boolean;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    createdAt: number;
  };
  accentColor: string;
}

function PostCard({ post, accentColor }: PostCardProps) {
  const postType = POST_TYPES.find((t) => t.value === post.postType);
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <article className={cn(
      "rounded-xl bg-white/[0.02] border border-white/5 p-4",
      "hover:bg-white/[0.04] hover:border-white/10 transition-all",
      post.isPinned && "border-amber-500/20"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Link href={`/analyze/${post.authorUsername}`}>
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.authorUsername}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10" />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/analyze/${post.authorUsername}`}
              className="font-medium text-white hover:text-violet-300 transition-colors"
            >
              {post.authorName || post.authorUsername}
            </Link>
            {post.isOwnerPost && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                Captain
              </span>
            )}
            {post.isPinned && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400">
                📌 Pinned
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>{timeAgo}</span>
            {postType && (
              <>
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>{postType.emoji} {postType.label}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-white mb-2">{post.title}</h3>
      <p className="text-sm text-zinc-400 line-clamp-3">{post.content}</p>

      {/* Footer */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span>👍</span>
          <span>{post.upvotes}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>💬</span>
          <span>{post.commentCount} comments</span>
        </span>
      </div>
    </article>
  );
}

interface CrewMemberCardProps {
  member: {
    _id: string;
    username: string;
    avatarUrl?: string;
    name?: string;
    role: string;
    karmaEarnedHere: number;
    joinedAt: number;
  };
  stationOwner: string;
}

function CrewMemberCard({ member, stationOwner }: CrewMemberCardProps) {
  const isCaptain = member.username === stationOwner;

  return (
    <Link
      href={`/analyze/${member.username}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
    >
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.username}
          className="w-10 h-10 rounded-full"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-white/10" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">
            {member.name || member.username}
          </span>
          {isCaptain && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400">
              👑
            </span>
          )}
          {member.role === 'moderator' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400">
              Mod
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500">
          @{member.username} · {member.karmaEarnedHere} karma
        </div>
      </div>
    </Link>
  );
}

function formatTimeAgo(createdAt: number): string {
  const diff = Date.now() - createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(createdAt).toLocaleDateString();
}
