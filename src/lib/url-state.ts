import type { AnalysisResult } from './types';

/**
 * Encode analysis result into URL query params
 * Short keys to minimize URL length:
 * u = username, a = archetype, t = tier, o = ovr
 * g = grit, f = focus, c = craft, i = impact, v = voice, r = reach
 */
export function encodeResultToParams(result: AnalysisResult): URLSearchParams {
  const params = new URLSearchParams();
  params.set('u', result.username);
  params.set('a', result.archetype.name);
  params.set('t', result.tier.level);
  params.set('o', result.overallRating.toString());
  params.set('g', result.signals.grit.toString());
  params.set('f', result.signals.focus.toString());
  params.set('c', result.signals.craft.toString());
  params.set('i', result.signals.impact.toString());
  params.set('v', result.signals.voice.toString());
  params.set('r', result.signals.reach.toString());
  if (result.avatarUrl) {
    params.set('avatar', result.avatarUrl);
  }
  return params;
}

/**
 * Build OG image URL from analysis result
 */
export function buildOgImageUrl(result: AnalysisResult, baseUrl: string): string {
  const params = encodeResultToParams(result);
  return `${baseUrl}/api/og?${params.toString()}`;
}

/**
 * Build shareable URL with encoded result
 */
export function buildShareUrl(result: AnalysisResult, baseUrl: string): string {
  const params = encodeResultToParams(result);
  return `${baseUrl}/analyze/${result.username}?${params.toString()}`;
}
