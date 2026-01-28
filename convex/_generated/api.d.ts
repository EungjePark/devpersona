/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyses from "../analyses.js";
import type * as builderRanks from "../builderRanks.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as crossKarma from "../crossKarma.js";
import type * as globalRankings from "../globalRankings.js";
import type * as growthStories from "../growthStories.js";
import type * as ideaValidations from "../ideaValidations.js";
import type * as launches from "../launches.js";
import type * as posts from "../posts.js";
import type * as productStations from "../productStations.js";
import type * as recommendations from "../recommendations.js";
import type * as reports from "../reports.js";
import type * as repositories from "../repositories.js";
import type * as rewards from "../rewards.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as trends from "../trends.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analyses: typeof analyses;
  builderRanks: typeof builderRanks;
  comments: typeof comments;
  crons: typeof crons;
  crossKarma: typeof crossKarma;
  globalRankings: typeof globalRankings;
  growthStories: typeof growthStories;
  ideaValidations: typeof ideaValidations;
  launches: typeof launches;
  posts: typeof posts;
  productStations: typeof productStations;
  recommendations: typeof recommendations;
  reports: typeof reports;
  repositories: typeof repositories;
  rewards: typeof rewards;
  seed: typeof seed;
  stats: typeof stats;
  trends: typeof trends;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
