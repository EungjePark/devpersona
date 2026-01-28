import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define strictly protected routes (always require authentication)
const isProtectedRoute = createRouteMatcher([
  // Board: Submit new ideas requires auth
  "/board/submit(.*)",
  // Launch: Submit and manage launches requires auth
  "/launch/submit(.*)",
  "/launch/manage(.*)",
  // Station: All station management requires auth
  "/station(.*)",
  // Profile: User profile management requires auth
  "/profile(.*)",
  // Moderation: Admin/mod dashboard requires auth
  "/mod(.*)",
]);

// PUBLIC ROUTES (for documentation):
// These routes are accessible without authentication.
// Interactions (voting, submitting, etc.) are protected at the Convex mutation level.
// - "/" - Home page
// - "/analyze/(...)" - Profile analysis
// - "/compare/(...)" - Profile comparison
// - "/leaderboard(...)" - Leaderboard viewing
// - "/trends(...)" - Trends viewing
// - "/hall-of-fame(...)" - Hall of Fame viewing
// - "/board" and "/board/idea/(...)" - Board browsing
// - "/launch" and "/launch/week/(...)" - Launch browsing
// - "/api/(...)" - Public API endpoints
// - "/sign-in(...)" and "/sign-up(...)" - Auth pages

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
