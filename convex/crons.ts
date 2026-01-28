import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update leaderboard snapshot every hour (includes auto-seed if needed)
crons.interval(
  "updateLeaderboardSnapshot",
  { hours: 1 },
  internal.stats.updateLeaderboardSnapshotWithAutoSeed
);

// Refresh GitHub trends every 6 hours
crons.interval(
  "refreshGitHubTrends",
  { hours: 6 },
  internal.trends.fetchTrendingRepos
);

// Finalize Launch Week every Saturday at 00:00 UTC
// This selects Top 3 winners and creates weeklyResults
crons.weekly(
  "finalizeWeeklyLaunches",
  { dayOfWeek: "saturday", hourUTC: 0, minuteUTC: 0 },
  internal.launches.finalizeCurrentWeek
);

// Recalculate hot scores for idea validations every 30 minutes
// Hot scores decay over time, so this keeps rankings fresh
// See ideaValidations.ts for algorithm details
crons.interval(
  "recalculateIdeaHotScores",
  { minutes: 30 },
  internal.ideaValidations.recalculateHotScores
);

export default crons;
