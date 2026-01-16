import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update leaderboard snapshot every 5 minutes
// This pre-aggregates data for O(1) leaderboard queries
crons.interval(
  "update leaderboard snapshot",
  { minutes: 5 },
  internal.stats.updateLeaderboardSnapshot
);

export default crons;
