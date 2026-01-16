'use client';

import { memo, useMemo, useCallback } from 'react';
import type { TierLevel, ArchetypeId, SignalScores } from '@/lib/types';

// Tier-based prompt templates
const TIER_PROMPTS: Record<TierLevel, string> = {
  S: 'legendary golden aura, divine light, epic throne of code, celestial programming deity',
  A: 'elite purple energy, masterful coder vibe, floating holographic terminals, neon accents',
  B: 'rising talent blue glow, focused developer, modern tech environment, determined spirit',
  C: 'emerging developer, green sprout energy, learning journey, hopeful atmosphere',
};

// Archetype-based prompt modifiers
const ARCHETYPE_PROMPTS: Record<ArchetypeId, string> = {
  maintainer: 'ancient guardian of repositories, keeper of codebases',
  silent_builder: 'mysterious hooded figure, working in shadows',
  prototype_machine: 'hyperactive inventor, chaotic workshop',
  specialist: 'zen master of a single domain, laser focus',
  hype_surfer: 'riding a wave of trending technologies, lightning speed',
  archivist: 'librarian of deprecated code, wisdom of ages',
  comeback_kid: 'phoenix rising from ashes, unstoppable force',
  ghost: 'ethereal presence, barely visible, mysterious',
};

// Tier-based CTA messages
const TIER_MESSAGES: Record<TierLevel, string> = {
  S: 'Your LEGENDARY portrait awaits',
  A: 'Your EPIC scene awaits',
  B: 'Your RARE moment awaits',
  C: 'Your journey begins',
};

// Use indigo colors that align with DevPersona design system
const TIER_COLORS: Record<TierLevel, { from: string; to: string; border: string }> = {
  S: { from: '#fbbf24', to: '#d97706', border: '#fbbf2460' },  // Amber/Gold
  A: { from: '#6366f1', to: '#4f46e5', border: '#6366f160' },  // Indigo
  B: { from: '#3b82f6', to: '#2563eb', border: '#3b82f660' },  // Blue
  C: { from: '#64748b', to: '#475569', border: '#64748b60' },  // Slate
};

interface SceneStellerMiniCTAProps {
  username: string;
  tier: TierLevel;
  archetypeId: ArchetypeId;
  archetypeName: string;
  signals: SignalScores;
}

export const SceneStellerMiniCTA = memo(function SceneStellerMiniCTA({
  username,
  tier,
  archetypeId,
  archetypeName,
  signals,
}: SceneStellerMiniCTAProps) {
  // Build auto prompt
  const autoPrompt = useMemo(() => {
    const modifiers: string[] = [];
    if (signals.grit > 80) modifiers.push('relentless determination');
    if (signals.focus > 80) modifiers.push('intense focus');
    if (signals.craft > 80) modifiers.push('meticulous craftsmanship');
    if (signals.impact > 80) modifiers.push('world-changing influence');

    const tierPrompt = TIER_PROMPTS[tier];
    const archetypePrompt = ARCHETYPE_PROMPTS[archetypeId];
    const signalString = modifiers.length > 0 ? modifiers.join(', ') : 'growing potential';

    return `Cinematic portrait of ${username}, a ${archetypeName.toLowerCase()}, ${tierPrompt}, ${archetypePrompt}, ${signalString}, FIFA card style, dramatic lighting, 8k quality`;
  }, [username, tier, archetypeId, archetypeName, signals]);

  const handleClick = useCallback(() => {
    const baseUrl = 'https://scenesteller.com/studio';
    const maxPromptLength = 1500;
    const truncatedPrompt = autoPrompt.length > maxPromptLength
      ? autoPrompt.slice(0, maxPromptLength) + '...'
      : autoPrompt;
    const params = new URLSearchParams({
      ref: 'devpersona',
      type: 'card',
      prompt: truncatedPrompt,
      tier: tier,
    });
    window.open(`${baseUrl}?${params.toString()}`, '_blank');
  }, [autoPrompt, tier]);

  const colors = TIER_COLORS[tier];
  const message = TIER_MESSAGES[tier];

  return (
    <button
      onClick={handleClick}
      className="group relative overflow-hidden rounded-xl px-4 py-3 transition-all duration-300 hover:scale-[1.02] w-full"
      style={{
        background: `linear-gradient(135deg, ${colors.from}20, ${colors.to}10)`,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎨</span>
          <div className="text-left">
            <span className="text-sm font-semibold text-white block">{message}</span>
            <span className="text-[10px] text-text-muted">Powered by SceneSteller AI</span>
          </div>
        </div>
        <span
          className="text-xs font-bold px-2 py-1 rounded"
          style={{
            backgroundColor: `${colors.from}30`,
            color: colors.from,
          }}
        >
          Create →
        </span>
      </div>
    </button>
  );
});
