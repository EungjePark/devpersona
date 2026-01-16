"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

// Get the Convex URL, handling build-time where it may not be available
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    // Only create the client if URL is available
    if (!CONVEX_URL) {
      return null;
    }
    return new ConvexReactClient(CONVEX_URL);
  }, []);

  // If no Convex URL (e.g., during build), render children without provider
  if (!convex) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
