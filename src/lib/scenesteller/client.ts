/**
 * SceneSteller Public Gallery Client
 *
 * Fetches publicly shared images from SceneSteller (christmas-ai-studio)
 * for display in DevPersona profiles.
 */

export interface SceneStellerImage {
  shareId: string;
  imageUrl?: string;
  createdAt: number;
  viewCount: number;
}

interface PublicGalleryResponse {
  success: boolean;
  images: SceneStellerImage[];
}

const SCENESTELLER_API_BASE =
  process.env.NEXT_PUBLIC_SCENESTELLER_API_URL ||
  "https://adorable-jackal-568.convex.site";

/**
 * Fetch public gallery images for a user from SceneSteller
 */
export async function fetchSceneStellerGallery(
  userId: string,
  limit: number = 12
): Promise<SceneStellerImage[]> {
  if (!userId) return [];

  try {
    const url = new URL(`${SCENESTELLER_API_BASE}/public-gallery`);
    url.searchParams.set("userId", userId);
    url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // Cache response for 60 seconds (Next.js ISR) to reduce API calls
      // and improve performance while still showing relatively fresh data
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.warn(`[SceneSteller] Failed to fetch gallery: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as PublicGalleryResponse;

    if (!data.success || !Array.isArray(data.images)) {
      console.warn("[SceneSteller] Invalid response format");
      return [];
    }

    return data.images.filter((img) => img.imageUrl);
  } catch (error) {
    console.warn("[SceneSteller] Error fetching gallery:", error);
    return [];
  }
}

/**
 * Get the share URL for a SceneSteller image
 */
export function getSceneStellerShareUrl(shareId: string): string {
  return `https://scenesteller.com/share/${shareId}`;
}

/**
 * Get the SceneSteller studio URL for creating new images
 */
export function getSceneStellerStudioUrl(): string {
  return "https://scenesteller.com/studio";
}
