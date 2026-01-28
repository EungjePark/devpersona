'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  placeholder?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  placeholder = 'Drop image or click to upload',
  className,
  aspectRatio = 'video',
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  }[aspectRatio];

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF, and WebP images are allowed');
      setIsUploading(false);
      return;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      setIsUploading(false);
      return;
    }

    try {
      // Simulate initial progress
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('file', file);

      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const result = await response.json();
          errorMessage = result.error || errorMessage;
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUploadProgress(100);
      onChange(result.url);

      // Reset progress after a brief delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      onChange(undefined);
    } finally {
      setIsUploading(false);
    }
  }, [onChange, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        onClick={!isUploading ? handleClick : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'group relative overflow-hidden rounded-xl border-2 border-dashed transition-all cursor-pointer',
          aspectRatioClass,
          isDragOver
            ? 'border-violet-500 bg-violet-500/10'
            : value
              ? 'border-transparent'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
          isUploading && 'pointer-events-none opacity-70'
        )}
      >
        {/* Uploaded Image Preview */}
        {value && !isUploading && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove uploaded image"
              className={cn(
                'absolute top-2 right-2 z-10',
                'w-8 h-8 rounded-lg',
                'bg-black/50 backdrop-blur-sm border border-white/10',
                'flex items-center justify-center',
                'text-white/70 hover:text-white hover:bg-black/70',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                'transition-all'
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Change image hint */}
            <div className="absolute bottom-2 left-2 right-2 z-10">
              <div className={cn(
                'px-3 py-2 rounded-lg',
                'bg-black/50 backdrop-blur-sm',
                'text-xs text-white/70 text-center',
                'opacity-0 group-hover:opacity-100 transition-opacity'
              )}>
                Click to change image
              </div>
            </div>
          </>
        )}

        {/* Upload State */}
        {!value && !isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className={cn(
              'w-12 h-12 rounded-xl mb-3',
              'bg-white/5 border border-white/10',
              'flex items-center justify-center',
              isDragOver ? 'scale-110' : '',
              'transition-transform'
            )}>
              <svg
                className={cn(
                  'w-6 h-6 transition-colors',
                  isDragOver ? 'text-violet-400' : 'text-zinc-500'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className={cn(
              'text-sm text-center transition-colors',
              isDragOver ? 'text-violet-300' : 'text-zinc-400'
            )}>
              {isDragOver ? 'Drop image here' : placeholder}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              JPEG, PNG, GIF, WebP up to {maxSizeMB}MB
            </p>
          </div>
        )}

        {/* Uploading State */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 mb-4 relative">
              <svg className="w-full h-full animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-10"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  className="text-violet-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  d="M12 2a10 10 0 0 1 10 10"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-violet-400">
                {uploadProgress}%
              </span>
            </div>
            <p className="text-sm text-zinc-400">Uploading...</p>

            {/* Progress bar */}
            <div className="w-full max-w-[200px] h-1 mt-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
