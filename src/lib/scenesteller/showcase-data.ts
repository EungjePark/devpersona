import type { TierLevel } from '@/lib/types';

export interface ShowcaseImage {
  id: string;
  filename: string;
  tier: TierLevel;
  username: string;
  overallRating: number;
  archetype: string;
}

export const SHOWCASE_IMAGES: ShowcaseImage[] = [
  { id: 'showcase-1', filename: 'showcase-1.png', tier: 'S', username: 'legendary_dev', overallRating: 95, archetype: 'The Maintainer' },
  { id: 'showcase-2', filename: 'showcase-2.png', tier: 'S', username: 'code_master', overallRating: 92, archetype: 'Silent Builder' },
  { id: 'showcase-3', filename: 'showcase-3.png', tier: 'A', username: 'proto_machine', overallRating: 85, archetype: 'Prototype Machine' },
  { id: 'showcase-4', filename: 'showcase-4.png', tier: 'A', username: 'hype_lord', overallRating: 78, archetype: 'Hype Surfer' },
  { id: 'showcase-5', filename: 'showcase-5.png', tier: 'B', username: 'steady_coder', overallRating: 65, archetype: 'The Specialist' },
  { id: 'showcase-6', filename: 'showcase-6.png', tier: 'C', username: 'new_dev', overallRating: 42, archetype: 'Comeback Kid' },
];

export function getShowcaseImageUrl(filename: string): string {
  return `/showcase/${filename}`;
}
