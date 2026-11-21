/**
 * pitchResultStyle.ts
 *
 * Maps raw MLB pitch result strings → a 5-way category used for coloring.
 * Also exports short type codes (FF / SL / CH / SV) and their colors.
 *
 * Result categories:
 *   strike  — Called Strike, Swinging Strike, Swinging Strike (Blocked),
 *              Foul Tip, Missed Bunt
 *   foul    — Foul, Foul Bunt
 *   ball    — Ball, Ball In Dirt, Intent Ball, Pitchout, Hit By Pitch
 *   inplay  — anything that starts with "In play" (case-insensitive)
 *   other   — everything else
 */

import { COLORS } from '../theme/colors';

// ─── Result category ─────────────────────────────────────────────────────────

export type ResultCategory = 'strike' | 'foul' | 'ball' | 'inplay' | 'other';

const STRIKE_RESULTS = new Set([
  'called strike',
  'swinging strike',
  'swinging strike (blocked)',
  'foul tip',
  'missed bunt',
]);

const FOUL_RESULTS = new Set([
  'foul',
  'foul bunt',
]);

const BALL_RESULTS = new Set([
  'ball',
  'ball in dirt',
  'intent ball',
  'pitchout',
  'hit by pitch',
]);

export function getResultCategory(result: string): ResultCategory {
  const lower = result.toLowerCase();
  if (STRIKE_RESULTS.has(lower)) return 'strike';
  if (FOUL_RESULTS.has(lower)) return 'foul';
  if (BALL_RESULTS.has(lower)) return 'ball';
  if (lower.startsWith('in play')) return 'inplay';
  return 'other';
}

// ─── Result colors ────────────────────────────────────────────────────────────

export const RESULT_COLORS: Record<ResultCategory, string> = {
  strike: COLORS.resultStrike,
  foul:   COLORS.resultFoul,
  ball:   COLORS.resultBall,
  inplay: COLORS.resultInplay,
  other:  COLORS.resultOther,
};

export function getResultColor(result: string): string {
  return RESULT_COLORS[getResultCategory(result)];
}

/** Single-letter abbreviation used in the sequence list */
export function getResultLetter(result: string): string {
  const cat = getResultCategory(result);
  switch (cat) {
    case 'strike': return 'K';
    case 'foul':   return 'F';
    case 'ball':   return 'B';
    case 'inplay': return 'X';
    default:       return '?';
  }
}

// ─── Pitch type codes ─────────────────────────────────────────────────────────

/** Returns the 2–3-letter pitch type code used in the sequence / mix panels */
export function getPitchTypeCode(pitchType: string): string {
  const lower = pitchType.toLowerCase();
  if (lower.includes('four-seam') || lower.includes('fastball')) return 'FF';
  if (lower.includes('slurve'))                                   return 'SV';
  if (lower.includes('slider'))                                   return 'SL';
  if (lower.includes('changeup') || lower.includes('change-up')) return 'CH';
  // Fallback: first two chars upper-cased
  return pitchType.slice(0, 2).toUpperCase();
}

export const TYPE_CODE_COLORS: Record<string, string> = {
  FF: COLORS.typeFF,
  SL: COLORS.typeSL,
  SV: COLORS.typeSL,   // Slurve shares the SL violet
  CH: COLORS.typeCH,
};

export function getPitchTypeCodeColor(code: string): string {
  return TYPE_CODE_COLORS[code] ?? COLORS.typeOther;
}
