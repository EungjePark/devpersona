# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**DevPersona** - Developer personality analyzer using GitHub + npm + Hacker News data.
Generates FIFA-style cards with hexagonal radar charts and tier system (S/A/B/C).

**Core Philosophy**: Zero AI API costs. All analysis uses heuristics and templates.

Tech stack: Next.js 14, Convex (real-time DB), Clerk (GitHub OAuth), Vercel (Edge)

## Development Commands

```bash
npm run dev                    # Next.js dev server (port 3000)
npx convex dev                 # Convex backend (required, separate terminal)
npm run build                  # Production build
npm run lint                   # ESLint
npx tsc --noEmit               # Type check
```

**Startup**: Both `npm run dev` and `npx convex dev` must run simultaneously.

## Architecture

### Data Sources (No AI, No Cost)

| Source | Endpoint | Auth | Rate Limit |
|--------|----------|------|------------|
| GitHub REST API | api.github.com | OAuth (BYOT) | 5,000/hr per user |
| npm Registry | api.npmjs.org | None | Unlimited |
| HN Algolia | hn.algolia.com | None | Generous |

### BYOT (Bring Your Own Token) Strategy

Users authenticate with GitHub OAuth via Clerk. Their token is used for GitHub API calls,
distributing rate limits across users instead of the server.

### 6 Signal Metrics (Hexagon Radar)

| Signal | Calculation | Source |
|--------|-------------|--------|
| GRIT | Commit consistency (1 - CV) | GitHub |
| FOCUS | Active repos / Total repos | GitHub |
| CRAFT | README + License + Description % | GitHub |
| IMPACT | log10(npm downloads) normalized | npm |
| VOICE | HN points + comments | HN Algolia |
| REACH | log10(stars + forks + followers) | GitHub |

### 8 Archetypes (Template-based)

The Maintainer, Silent Builder, Prototype Machine, The Specialist,
Hype Surfer, The Archivist, Comeback Kid, Ghost Developer

Each has conditions based on signal scores and 3 roast templates.

### Tier System

| Tier | Name | OVR Threshold | Card Style |
|------|------|---------------|------------|
| S | LEGENDARY | 90+ | Gold gradient + glow |
| A | EPIC | 75-89 | Purple gradient |
| B | RARE | 50-74 | Blue gradient |
| C | COMMON | <50 | Gray gradient |

### Stat Grades (A-F per stat)

| Grade | Threshold | Color |
|-------|-----------|-------|
| S | 90+ | Gold |
| A | 80-89 | Green |
| B | 60-79 | Lime |
| C | 40-59 | Yellow |
| D | 20-39 | Orange |
| F | <20 | Red |

## Key Modules

| Directory | Purpose |
|-----------|---------|
| `lib/github/` | GitHub API client, types |
| `lib/npm/` | npm Registry API client |
| `lib/hackernews/` | HN Algolia API client |
| `lib/analysis/` | Signal calculations, archetype matching |
| `components/cards/` | FIFA card, stat bars, radar chart |
| `convex/` | Database schema (shares only) |

## Design System

Dark theme with FIFA/FM card aesthetic:
- Background: `#0a0a0f` (primary), `#141419` (secondary)
- Text: `#f8fafc` (primary), `#a1a1aa` (secondary)
- Accent: Purple (`#8b5cf6`)
- Tiers: Gold/Purple/Blue/Gray gradients

## Code Standards

### Critical Rules
- **No AI API calls** - Use heuristics and templates only
- **No `as any`** - Use `unknown` + type guards
- **All UI text in English** - International audience
- **Edge runtime for API routes** - Handle traffic spikes
- **URL state pattern** - Encode results in URL for shareability

### Conventions
- Functional components with TypeScript interfaces
- Radix UI primitives + Tailwind CSS v4
- Zustand for client state, Convex for shares
- All calculations client-side (no server compute cost)

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CONVEX_DEPLOYMENT
NEXT_PUBLIC_CONVEX_URL
```

## Critical Constraints (Tibo Challenge)

1. **48-hour deadline** - Ship fast, polish later
2. **Viral potential** - Shareable FIFA-style cards
3. **Traffic resilience** - Edge functions, URL state, BYOT
4. **Gorgeous design** - Bento grid, dark mode, animations
5. **Data-driven** - 3 obscure APIs, no AI
