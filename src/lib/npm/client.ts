// npm Registry API Client - No Auth Required

import type { NpmPackage } from '../types';

const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_DOWNLOADS = 'https://api.npmjs.org/downloads/point/last-month';

interface NpmSearchResult {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description: string;
      publisher: {
        username: string;
      };
    };
  }>;
}

/**
 * Search for packages by author/maintainer username
 * Uses npm registry search API with retry logic
 */
export async function searchPackagesByAuthor(username: string): Promise<string[]> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // npm search API uses maintainer field
      const response = await fetch(
        `${NPM_REGISTRY}/-/v1/search?text=maintainer:${username}&size=20`,
        {
          next: { revalidate: 3600 }, // Cache for 1 hour
        }
      );

      if (!response.ok) {
        // Retry on 5xx errors or rate limits
        if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return [];
      }

      const data: NpmSearchResult = await response.json();
      return data.objects.map(obj => obj.package.name);
    } catch {
      // Retry on network errors
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      return [];
    }
  }

  return [];
}

/**
 * Get download counts for a package (last month) with retry logic
 */
export async function getPackageDownloads(packageName: string): Promise<number> {
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${NPM_DOWNLOADS}/${encodeURIComponent(packageName)}`, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        // Retry on 5xx errors or rate limits
        if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        return 0;
      }

      const data = await response.json();
      return data.downloads || 0;
    } catch {
      // Retry on network errors
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }
      return 0;
    }
  }

  return 0;
}

/**
 * Fetch all npm data for a username
 */
export async function fetchNpmData(username: string): Promise<NpmPackage[]> {
  // Search for packages by this user
  const packageNames = await searchPackagesByAuthor(username);

  if (packageNames.length === 0) {
    return [];
  }

  // Fetch download counts for ALL packages to ensure consistent results
  // (npm search order can vary, so we need to sort by downloads ourselves)
  const packagesWithDownloads = await Promise.all(
    packageNames.map(async (name) => {
      const downloads = await getPackageDownloads(name);
      return { name, downloads };
    })
  );

  // Sort by downloads and return top 10 (for score calculation consistency)
  return packagesWithDownloads
    .filter(pkg => pkg.downloads > 0)
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);
}

/**
 * Format download count for display
 */
export function formatDownloads(count: number): string {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}
