import LeaderboardClient from './LeaderboardClient';

// Force dynamic rendering to avoid static generation issues with Convex
export const dynamic = 'force-dynamic';

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
