'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

interface GradientMeshProps {
  /** Array of hex colors */
  colors?: string[];
  /** Animation speed (1 = normal) */
  speed?: number;
  /** Noise/grain intensity (0-1) */
  grain?: number;
  /** Blur amount */
  blur?: number;
  /** Wave amplitude */
  waveAmp?: number;
  /** Wave frequency */
  waveFreq?: number;
  /** CSS class */
  className?: string;
  /** Interactive - respond to mouse */
  interactive?: boolean;
}

/**
 * Gradient Mesh - Animated procedural gradient background
 * Inspired by aliimam.in/components/gradient-mesh
 */
export function GradientMesh({
  colors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'],
  speed = 1,
  grain = 0.03,
  blur = 100,
  waveAmp = 50,
  waveFreq = 0.005,
  className,
  interactive = false,
}: GradientMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(undefined);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };

    const animate = () => {
      time += 0.01 * speed;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw gradient blobs
      colors.forEach((color, index) => {
        const rgb = hexToRgb(color);
        const angle = (index / colors.length) * Math.PI * 2 + time * 0.5;

        // Calculate blob position with wave motion
        let x = width * 0.5 + Math.cos(angle) * width * 0.3;
        let y = height * 0.5 + Math.sin(angle) * height * 0.3;

        // Add wave distortion
        x += Math.sin(time + index) * waveAmp;
        y += Math.cos(time * 0.7 + index) * waveAmp;

        // Interactive mouse influence
        if (interactive) {
          const dx = mouseRef.current.x * width - x;
          const dy = mouseRef.current.y * height - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / (width * 0.5));
          x += dx * influence * 0.1;
          y += dy * influence * 0.1;
        }

        // Draw radial gradient blob
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, blur * 2);
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      });

      // Add noise/grain overlay using actual canvas pixel dimensions
      if (grain > 0) {
        const pixelWidth = canvas.width;
        const pixelHeight = canvas.height;
        const imageData = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
        const data = imageData.data;

        // Sample every nth pixel for performance
        const step = 4;
        for (let i = 0; i < data.length; i += 4 * step) {
          const noise = (Math.random() - 0.5) * grain * 255;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }

        ctx.putImageData(imageData, 0, 0);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    resize();
    window.addEventListener('resize', resize);

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [colors, speed, grain, blur, waveAmp, waveFreq, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full', className)}
      style={{ filter: `blur(${blur}px)` }}
    />
  );
}

/**
 * CSS-based Gradient Mesh (lighter weight)
 */
export function CSSGradientMesh({
  colors = ['#8b5cf6', '#06b6d4', '#22c55e'],
  className,
  animate = true,
}: {
  colors?: string[];
  className?: string;
  animate?: boolean;
}) {
  const gradients = colors.map((color, i) => {
    const angle = (i / colors.length) * 360;
    const x = 50 + Math.cos((angle * Math.PI) / 180) * 30;
    const y = 50 + Math.sin((angle * Math.PI) / 180) * 30;
    return `radial-gradient(circle at ${x}% ${y}%, ${color}40, transparent 50%)`;
  });

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden',
        animate && 'animate-gradient-mesh-shift',
        className
      )}
      style={{
        background: gradients.join(', '),
        filter: 'blur(60px)',
      }}
    />
  );
}

/**
 * Dot Pattern Background
 */
export function DotPattern({
  className,
  dotSize = 1,
  gap = 20,
  color = 'rgba(255,255,255,0.1)',
}: {
  className?: string;
  dotSize?: number;
  gap?: number;
  color?: string;
}) {
  const patternId = useId();

  return (
    <svg
      className={cn('absolute inset-0 w-full h-full', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width={gap}
          height={gap}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={gap / 2} cy={gap / 2} r={dotSize} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

/**
 * Grid Pattern Background
 */
export function GridPattern({
  className,
  size = 40,
  strokeWidth = 1,
  color = 'rgba(255,255,255,0.05)',
}: {
  className?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const patternId = useId();

  return (
    <svg
      className={cn('absolute inset-0 w-full h-full', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={patternId}
          x="0"
          y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

/**
 * Noise Texture Overlay
 */
export function NoiseOverlay({
  className,
  opacity = 0.03,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}
