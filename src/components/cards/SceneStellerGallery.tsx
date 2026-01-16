"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { ExternalLink, Eye, Sparkles, ImageIcon } from "lucide-react";
import {
  fetchSceneStellerGallery,
  getSceneStellerShareUrl,
  getSceneStellerStudioUrl,
  type SceneStellerImage,
} from "@/lib/scenesteller/client";

interface SceneStellerGalleryProps {
  userId?: string;
  maxImages?: number;
  compact?: boolean;
  className?: string;
}

function GalleryHeader({ count }: { count?: number }): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-purple-400" />
      <h3 className="text-sm font-medium text-zinc-300">SceneSteller Creations</h3>
      {count !== undefined && <span className="text-xs text-zinc-500">({count})</span>}
    </div>
  );
}

export function SceneStellerGallery({
  userId,
  maxImages = 6,
  compact = false,
  className = "",
}: SceneStellerGalleryProps): ReactNode {
  const [images, setImages] = useState<SceneStellerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadGallery(): Promise<void> {
      setLoading(true);
      setError(false);
      try {
        const gallery = await fetchSceneStellerGallery(userId!, maxImages);
        setImages(gallery);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadGallery();
  }, [userId, maxImages]);

  // Show CTA for creating art when no userId is provided
  if (!userId) {
    return (
      <div className={`bg-gradient-to-br from-purple-900/20 to-zinc-900/50 rounded-xl p-4 border border-purple-500/20 ${className}`}>
        <div className="mb-3">
          <GalleryHeader />
        </div>
        <div className="text-center py-4">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <p className="text-xs text-zinc-400 mb-3">Create stunning AI art for your profile</p>
          <a
            href={getSceneStellerStudioUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Try SceneSteller
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  const displayCount = compact ? 3 : maxImages;
  // Use simpler 3-column grid for compact mode or small galleries
  const useCompactGrid = compact || images.length <= 3;
  const gridClass = useCompactGrid ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-4";

  if (loading) {
    return (
      <div className={`bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 ${className}`}>
        <div className="mb-3">
          <GalleryHeader />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: Math.min(maxImages, 6) }).map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-purple-900/20 to-zinc-900/50 rounded-xl p-4 border border-purple-500/20 ${className}`}>
        <div className="mb-3">
          <GalleryHeader />
        </div>
        <div className="text-center py-4">
          <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 mb-3">No shared creations yet</p>
          <a
            href={getSceneStellerStudioUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Create Your Art
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <GalleryHeader count={images.length} />
        <a
          href={getSceneStellerStudioUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
        >
          Create More
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className={`grid gap-2 ${gridClass}`}>
        {images.slice(0, displayCount).map((image) => (
          <a
            key={image.shareId}
            href={getSceneStellerShareUrl(image.shareId)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-800 hover:ring-2 hover:ring-purple-500/50 transition-all"
          >
            {image.imageUrl && (
              <Image
                src={image.imageUrl}
                alt="SceneSteller creation"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 33vw, 25vw"
                unoptimized
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white/80 text-[10px]">
                <Eye className="w-3 h-3" />
                {image.viewCount}
              </div>
              <div className="absolute top-1 right-1">
                <ExternalLink className="w-3 h-3 text-white/80" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {images.length > displayCount && (
        <div className="mt-2 text-center">
          <a
            href={getSceneStellerStudioUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            View all creations
          </a>
        </div>
      )}
    </div>
  );
}
