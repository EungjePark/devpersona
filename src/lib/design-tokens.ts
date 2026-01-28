/**
 * Design Tokens - Apple-inspired minimal dark theme
 *
 * Usage: import { colors, spacing, typography, effects } from '@/lib/design-tokens'
 */

// Color Palette
export const colors = {
  // Base
  bg: {
    primary: '#000000',
    secondary: 'rgb(9 9 11)', // zinc-950
    tertiary: 'rgb(24 24 27 / 0.5)', // zinc-900/50
    elevated: 'rgb(24 24 27)', // zinc-900
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: 'rgb(161 161 170)', // zinc-400
    muted: 'rgb(113 113 122)', // zinc-500
    subtle: 'rgb(82 82 91)', // zinc-600
    disabled: 'rgb(63 63 70)', // zinc-700
  },

  // Borders
  border: {
    default: 'rgb(39 39 42 / 0.5)', // zinc-800/50
    hover: 'rgb(63 63 70 / 0.5)', // zinc-700/50
    focus: 'rgb(113 113 122)', // zinc-500
  },

  // Accents
  accent: {
    violet: {
      DEFAULT: 'rgb(139 92 246)', // violet-500
      muted: 'rgb(139 92 246 / 0.2)',
      border: 'rgb(91 33 182 / 0.3)', // violet-800/30
    },
    emerald: {
      DEFAULT: 'rgb(52 211 153)', // emerald-400
      muted: 'rgb(52 211 153 / 0.1)',
    },
    amber: {
      DEFAULT: 'rgb(251 191 36)', // amber-400
      muted: 'rgb(251 191 36 / 0.1)',
      border: 'rgb(146 64 14 / 0.3)', // amber-800/30
    },
    red: {
      DEFAULT: 'rgb(248 113 113)', // red-400
      muted: 'rgb(248 113 113 / 0.1)',
    },
  },

  // Gradients
  gradient: {
    primary: 'linear-gradient(to bottom, #ffffff, rgb(113 113 122))',
    violet: 'linear-gradient(to bottom, rgb(46 16 101 / 0.3), transparent)',
    amber: 'linear-gradient(to bottom, rgb(69 26 3 / 0.3), transparent)',
  },
} as const;

// Spacing Scale (in pixels, use with Tailwind)
export const spacing = {
  xs: '4px',   // p-1
  sm: '8px',   // p-2
  md: '16px',  // p-4
  lg: '24px',  // p-6
  xl: '32px',  // p-8
  '2xl': '48px', // p-12
  '3xl': '64px', // p-16
} as const;

// Typography
export const typography = {
  // Font sizes with line heights
  hero: {
    size: '40px',
    lineHeight: '1.2',
    weight: '600',
    tracking: '-0.02em',
  },
  title: {
    size: '24px',
    lineHeight: '1.3',
    weight: '600',
    tracking: '-0.01em',
  },
  body: {
    size: '15px',
    lineHeight: '1.5',
    weight: '400',
    tracking: '0',
  },
  caption: {
    size: '13px',
    lineHeight: '1.4',
    weight: '400',
    tracking: '0',
  },
  label: {
    size: '13px',
    lineHeight: '1.4',
    weight: '500',
    tracking: '0.05em',
  },
  tiny: {
    size: '11px',
    lineHeight: '1.4',
    weight: '400',
    tracking: '0.02em',
  },
} as const;

// Effects
export const effects = {
  // Border radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.5)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
    glow: {
      violet: '0 0 20px rgb(139 92 246 / 0.2)',
      amber: '0 0 20px rgb(251 191 36 / 0.2)',
    },
  },

  // Blur
  blur: {
    sm: 'blur(4px)',
    md: 'blur(12px)',
    lg: 'blur(24px)',
    xl: 'blur(40px)',
    '2xl': 'blur(120px)',
  },

  // Transitions
  transition: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const;

// Common Tailwind class compositions
export const tw = {
  // Surfaces
  surface: {
    primary: 'bg-black',
    secondary: 'bg-zinc-950',
    elevated: 'bg-zinc-900/50 border border-zinc-800/50',
    card: 'bg-zinc-900/30 border border-zinc-800/50 rounded-2xl',
  },

  // Text
  text: {
    primary: 'text-white',
    secondary: 'text-zinc-400',
    muted: 'text-zinc-500',
    subtle: 'text-zinc-600',
  },

  // Interactive
  interactive: {
    default: 'transition-colors duration-200',
    hover: 'hover:bg-zinc-900/50 hover:border-zinc-700/50',
    focus: 'focus:outline-none focus:border-zinc-700',
  },

  // Buttons
  button: {
    primary: 'px-5 py-2 rounded-full text-[13px] font-medium bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
    secondary: 'px-4 py-2 text-[13px] text-zinc-500 hover:text-white transition-colors',
    ghost: 'text-zinc-500 hover:text-white transition-colors',
  },

  // Inputs
  input: {
    base: 'w-full bg-transparent placeholder:text-zinc-600 focus:outline-none',
    bordered: 'h-11 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 focus:border-zinc-700 transition-colors',
  },

  // Animations
  animate: {
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom-2 duration-300',
    slideDown: 'animate-in slide-in-from-top-2 duration-300',
  },
} as const;

// Export types
export type ColorToken = typeof colors;
export type SpacingToken = typeof spacing;
export type TypographyToken = typeof typography;
export type EffectsToken = typeof effects;
export type TwToken = typeof tw;
