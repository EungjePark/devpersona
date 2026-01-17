import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update leaderboard snapshot every 5 minutes (with auto-seed for cold start)
// This pre-aggregates data for O(1) leaderboard queries
// If analyses < 10, automatically seeds with ~100 famous developers
crons.interval(
  "update leaderboard snapshot with auto-seed",
  { minutes: 5 },
  internal.stats.updateLeaderboardSnapshotWithAutoSeed
);

export default crons;
