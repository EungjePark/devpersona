import { cronJobs } from "convex/server";

const crons = cronJobs();

// No active cron jobs currently
// Leaderboard updates happen when users are analyzed

export default crons;
