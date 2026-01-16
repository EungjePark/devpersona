// Developer Archetypes - Template-based, No AI

import type { Archetype, ArchetypeId, SignalScores } from '../types';

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  maintainer: {
    id: 'maintainer',
    name: 'The Maintainer',
    description: 'The green grass gardener. Your repos are always pristine.',
    roasts: [
      'Is maintaining your GitHub streak a hobby... or an obsession?',
      'Your commit graph is greener than a rainforest.',
      'Therapists hate this one weird trick to stay sane.',
    ],
    condition: (s) => s.grit >= 70 && s.craft >= 70,
  },

  silent_builder: {
    id: 'silent_builder',
    name: 'Silent Builder',
    description: 'Ships consistently, never seeks the spotlight.',
    roasts: [
      'Zero stars but infinite potential... right? RIGHT?',
      "Your code is like fine wine—nobody knows it exists.",
      "Marketing is for people who can't code. You can code.",
    ],
    condition: (s) => s.grit >= 70 && s.reach < 40,
  },

  prototype_machine: {
    id: 'prototype_machine',
    name: 'Prototype Machine',
    description: 'So many ideas, so little time to finish any of them.',
    roasts: [
      'README: "Coming soon" (since 2019)',
      'You have more abandoned repos than finished ones.',
      'Commitment issues? Only to your projects.',
    ],
    condition: (s) => s.focus < 35 && s.craft < 50,
  },

  specialist: {
    id: 'specialist',
    name: 'The Specialist',
    description: 'Deep expertise in one domain. Jack of one trade.',
    roasts: [
      "You've been writing JavaScript since before it was cool.",
      'Mono-language like mono-culture: efficient but risky.',
      'TypeScript is your religion and you shall have no other gods.',
    ],
    condition: (s) => s.focus >= 80,
  },

  hype_surfer: {
    id: 'hype_surfer',
    name: 'Hype Surfer',
    description: 'Viral projects, sporadic activity. The hit maker.',
    roasts: [
      'One viral repo and then... radio silence.',
      'Your GitHub is a one-hit wonder album.',
      'Stars are temporary, legacy is forever.',
    ],
    condition: (s) => s.reach >= 70 && s.grit < 40,
  },

  archivist: {
    id: 'archivist',
    name: 'The Archivist',
    description: 'Rich history, quieter present. The retired legend.',
    roasts: [
      'Your golden age was 2018. We remember.',
      'Once a prolific coder, now a LinkedIn influencer.',
      'Your best commits are behind you.',
    ],
    condition: (s) => s.grit < 35 && s.reach >= 30,
  },

  comeback_kid: {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Back after a long break. Redemption arc in progress.',
    roasts: [
      'The prodigal developer returns!',
      'Gap year? More like gap years.',
      'Everyone loves a comeback story.',
    ],
    condition: (s) => s.grit >= 50 && s.grit <= 65 && s.focus >= 60,
  },

  ghost: {
    id: 'ghost',
    name: 'Ghost Developer',
    description: 'Minimal detectable activity. The invisible coder.',
    roasts: [
      'Are you even real?',
      'Your GitHub is giving... minimalist vibes.',
      "Private repos don't count on this scorecard.",
    ],
    condition: (s) => s.grit < 25 && s.reach < 25 && s.craft < 30,
  },
};

/**
 * Match user to an archetype based on their signals
 * Priority order matters - first match wins
 */
export function matchArchetype(signals: SignalScores): Archetype {
  // Priority order: most distinctive first
  const priorityOrder: ArchetypeId[] = [
    'ghost',           // Catch edge case first
    'hype_surfer',     // High reach, low grit
    'prototype_machine', // Low focus, low craft
    'maintainer',      // High grit AND craft
    'silent_builder',  // High grit, low reach
    'specialist',      // Very high focus
    'archivist',       // Low grit, some reach
    'comeback_kid',    // Middle ground
  ];

  for (const id of priorityOrder) {
    if (ARCHETYPES[id].condition(signals)) {
      return ARCHETYPES[id];
    }
  }

  // Default fallback - shouldn't reach here
  return ARCHETYPES.comeback_kid;
}

/**
 * Get a random roast from the archetype
 */
export function getRandomRoast(archetype: Archetype): string {
  const index = Math.floor(Math.random() * archetype.roasts.length);
  return archetype.roasts[index];
}

/**
 * Get a specific roast by index (for deterministic URL sharing)
 */
export function getRoastByIndex(archetype: Archetype, index: number): string {
  return archetype.roasts[index % archetype.roasts.length];
}
