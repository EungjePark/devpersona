import { cn } from '@/lib/utils';

interface PotenBadgeProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function PotenBadge({ variant = 'default', className }: PotenBadgeProps) {
  if (variant === 'icon-only') {
    return (
      <span className={className} title="Poten!" aria-label="Poten achieved" role="img">
        🔥
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={cn("ml-1 text-sm", className)} aria-label="Poten" role="img">
        🔥
      </span>
    );
  }

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-400",
        className
      )}
      aria-label="Poten achieved"
    >
      🔥 Poten
    </span>
  );
}

// Common styles for poten cards/borders
export const potenCardStyles = "border-orange-500/30 bg-orange-500/5";
