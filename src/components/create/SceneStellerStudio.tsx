'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import type { SignalScores, TierLevel, ArchetypeId } from '@/lib/types';
import { TIER_DESIGN_TOKENS } from '@/lib/types';
import { cn } from '@/lib/utils';

// Tier-based prompt templates
const TIER_PROMPTS: Record<TierLevel, string> = {
  S: 'legendary golden aura, divine light, epic throne of code, celestial programming deity, radiant masterpiece',
  A: 'elite purple energy, masterful coder vibe, floating holographic terminals, neon accents, powerful presence',
  B: 'rising talent blue glow, focused developer, modern tech environment, clean aesthetic, determined spirit',
  C: 'emerging developer, green sprout energy, learning journey, hopeful atmosphere, humble beginnings',
};

// Archetype-based prompt modifiers
const ARCHETYPE_PROMPTS: Record<ArchetypeId, string> = {
  maintainer: 'ancient guardian of repositories, surrounded by issue tickets as scrolls, keeper of codebases',
  silent_builder: 'mysterious hooded figure, working in shadows, massive codebase architecture behind them',
  prototype_machine: 'hyperactive inventor, chaotic workshop, dozens of half-built projects floating around',
  specialist: 'zen master of a single domain, laser focus, one perfect tool gleaming with power',
  hype_surfer: 'riding a wave of trending technologies, surfboard made of GitHub stars, lightning speed',
  archivist: 'librarian of deprecated code, dusty repositories, vintage tech aesthetic, wisdom of ages',
  comeback_kid: 'phoenix rising from ashes, breaking through stone, rebirth energy, unstoppable force',
  ghost: 'ethereal presence, barely visible, fading commit history, mysterious and elusive',
};

// Style presets
const STYLE_PRESETS = [
  { id: 'fifa', name: 'FIFA Card', icon: '⚽', prompt: 'FIFA ultimate team card style, golden frame, sports card aesthetic' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', prompt: 'cyberpunk 2077 style, neon lights, rain, futuristic cityscape' },
  { id: 'retro', name: 'Retro 8-bit', icon: '👾', prompt: 'pixel art style, retro gaming aesthetic, 8-bit colors' },
  { id: 'anime', name: 'Anime', icon: '🎌', prompt: 'anime style, dramatic lighting, shonen protagonist pose' },
  { id: 'corporate', name: 'Corporate', icon: '💼', prompt: 'professional portrait, LinkedIn profile style, modern office' },
];

interface SceneStellerStudioProps {
  username: string;
  tier: TierLevel;
  archetypeId: ArchetypeId;
  archetypeName: string;
  signals: SignalScores;
}

export const SceneStellerStudio = memo(function SceneStellerStudio({
  username,
  tier,
  archetypeId,
  archetypeName,
  signals,
}: SceneStellerStudioProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>('fifa');
  const [customPrompt, setCustomPrompt] = useState('');
  const tierDesign = TIER_DESIGN_TOKENS[tier];

  // Memoize signal modifiers (only recalculate when signals change)
  const signalString = useMemo(() => {
    const modifiers: string[] = [];
    if (signals.grit > 80) modifiers.push('relentless determination');
    if (signals.focus > 80) modifiers.push('intense focus');
    if (signals.craft > 80) modifiers.push('meticulous craftsmanship');
    if (signals.impact > 80) modifiers.push('world-changing influence');
    if (signals.voice > 80) modifiers.push('powerful presence');
    if (signals.reach > 80) modifiers.push('legendary fame');
    return modifiers.length > 0 ? modifiers.join(', ') : 'growing potential';
  }, [signals]);

  // Memoize auto prompt (depends on user data + selected style)
  const autoPrompt = useMemo(() => {
    const tierPrompt = TIER_PROMPTS[tier];
    const archetypePrompt = ARCHETYPE_PROMPTS[archetypeId];
    const stylePreset = STYLE_PRESETS.find(s => s.id === selectedStyle);
    const stylePrompt = stylePreset?.prompt || '';

    return `Cinematic portrait of ${username}, a ${archetypeName.toLowerCase()}, ${tierPrompt}, ${archetypePrompt}, ${signalString}, ${stylePrompt}, dramatic lighting, 8k quality, masterpiece`;
  }, [username, tier, archetypeId, archetypeName, signalString, selectedStyle]);

  const finalPrompt = customPrompt || autoPrompt;

  // Memoize URL generator
  const generateUrl = useCallback((type: 'card' | 'cover' | 'background') => {
    const baseUrl = 'https://scenesteller.com/studio';
    const maxPromptLength = 1500;
    const truncatedPrompt = finalPrompt.length > maxPromptLength
      ? finalPrompt.slice(0, maxPromptLength) + '...'
      : finalPrompt;
    const params = new URLSearchParams({
      ref: 'devpersona',
      type,
      prompt: truncatedPrompt,
    });
    return `${baseUrl}?${params.toString()}`;
  }, [finalPrompt]);

  const handleGenerate = useCallback((type: 'card' | 'cover' | 'background') => {
    window.open(generateUrl(type), '_blank');
  }, [generateUrl]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          🎨 Create Your Developer Art
        </h2>
        <p className="text-text-secondary">
          Generate AI-powered visuals based on your developer profile
        </p>
      </div>

      {/* Auto-generated Prompt */}
      <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
          <span>✨</span> AI-Generated Prompt
        </h3>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <p className="text-white/80 text-sm leading-relaxed font-mono">
            {autoPrompt}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className={`px-2 py-1 rounded ${tierDesign.textClass} bg-white/5`}>
            {tier} Tier
          </span>
          <span className="px-2 py-1 rounded bg-white/5">
            {archetypeName}
          </span>
        </div>
      </div>

      {/* Style Presets */}
      <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
          <span>🎭</span> Style Presets
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={cn(
                'p-4 rounded-xl text-center transition-all duration-200',
                selectedStyle === style.id
                  ? 'bg-primary-500/20 border-2 border-primary-500'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              )}
            >
              <div className="text-2xl mb-2">{style.icon}</div>
              <div className="text-sm font-medium text-white">{style.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2 uppercase tracking-wider">
          <span>✏️</span> Custom Prompt (Optional)
        </h3>

        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Override with your own prompt..."
          className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary-500/50 resize-none font-mono text-sm"
        />

        {customPrompt && (
          <button
            onClick={() => setCustomPrompt('')}
            className="mt-2 text-sm text-text-muted hover:text-white"
          >
            ↩ Reset to auto-generated prompt
          </button>
        )}
      </div>

      {/* Generate Buttons */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleGenerate('card')}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative text-center">
            <div className="text-3xl mb-2">🎴</div>
            <div className="text-lg font-bold text-white">Card Art</div>
            <div className="text-xs text-white/70 mt-1">Create a trading card</div>
          </div>
        </button>

        <button
          onClick={() => handleGenerate('cover')}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-6 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative text-center">
            <div className="text-3xl mb-2">🖼️</div>
            <div className="text-lg font-bold text-white">Profile Cover</div>
            <div className="text-xs text-white/70 mt-1">Create a header image</div>
          </div>
        </button>

        <button
          onClick={() => handleGenerate('background')}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 p-6 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative text-center">
            <div className="text-3xl mb-2">🌄</div>
            <div className="text-lg font-bold text-white">Background</div>
            <div className="text-xs text-white/70 mt-1">Create a wallpaper</div>
          </div>
        </button>
      </div>

      {/* Powered by SceneSteller */}
      <div className="text-center">
        <a
          href="https://scenesteller.com?ref=devpersona"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
        >
          <span className="text-lg">🎬</span>
          Powered by SceneSteller
          <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  );
});
