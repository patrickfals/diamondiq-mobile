/**
 * classifyBattedBall — pure outcome classification utility.
 *
 * Classifies an at-bat outcome string as a hit, a batted-ball out, or null.
 * Uses strict allowlists — no keyword matching or case folding.
 *
 * Verification status of outcome strings:
 *   VERIFIED against live API data (game 777245, at-bat 8):
 *     "Single"
 *
 *   UNVERIFIED (provided in spec; not confirmed against additional at-bats):
 *     All other strings in HIT_OUTCOMES and OUT_OUTCOMES below.
 *
 * Returns null for any outcome not in either allowlist, including:
 *   Strikeout, Walk, Hit By Pitch, Field Error, Fielders Choice,
 *   and any unknown or unsupported string.
 */

const HIT_OUTCOMES = new Set([
  'Single',
  'Double',
  'Triple',
  'Home Run',
]);

const OUT_OUTCOMES = new Set([
  'Groundout',
  'Flyout',
  'Lineout',
  'Pop Out',
  'Grounded Into DP',
  'Double Play',
  'Forceout',
  'Sac Fly',
  'Sac Bunt',
]);

/**
 * Classifies a batted-ball outcome.
 * @param outcome - The at-bat outcome string (AtBat.outcome from the API).
 * @returns 'hit' | 'out' | null
 */
export function classifyBattedBall(outcome: string): 'hit' | 'out' | null {
  if (HIT_OUTCOMES.has(outcome)) return 'hit';
  if (OUT_OUTCOMES.has(outcome)) return 'out';
  return null;
}
