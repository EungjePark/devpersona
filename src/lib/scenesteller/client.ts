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

/**
 * Fetch public gallery images for a user from SceneSteller
 * Uses local API proxy to avoid CORS issues
 */
export async function fetchSceneStellerGallery(
  userId: string,
  limit: number = 12
): Promise<SceneStellerImage[]> {
  if (!userId) return [];

  try {
    const url = new URL('/api/scenesteller/gallery', window.location.origin);
    url.searchParams.set("username", userId);
    url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 50)));

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as PublicGalleryResponse;

    if (!data.success || !Array.isArray(data.images)) {
      return [];
    }

    return data.images.filter((img) => img.imageUrl);
  } catch {
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
