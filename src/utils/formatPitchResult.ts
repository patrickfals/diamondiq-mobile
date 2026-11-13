/**
 * formatPitchResult — pure pitch-result label formatter.
 *
 * Maps the `result` field returned by the FastAPI backend (Pitch.result,
 * sourced from MLB Stats API details.description) to a readable display label.
 *
 * Rules:
 * - Input is the raw MLB result string exactly as returned by the API.
 * - This function is NOT responsible for displaying the final at-bat outcome
 *   (e.g. "Single"). That is handled by the caller using finalOutcomeLabel.
 * - Unknown strings fall back to result.toUpperCase() — never swallowed silently.
 * - Pure function: no side effects, no React dependency. Independently testable.
 *
 * Verified result strings from game 777245, at-bat 8 (live API):
 *   "Ball", "Called Strike", "Foul", "In play, no out"
 *
 * Additional strings mapped from MLB Stats API documentation:
 *   "Swinging Strike", "Swinging Strike (Blocked)", "Foul Tip",
 *   "Hit By Pitch", "In play, out(s)", "In play, run(s)", "Intent Ball"
 */

const RESULT_LABELS: Record<string, string> = {
  'Ball':                      'BALL',
  'Called Strike':             'CALLED STRIKE',
  'Swinging Strike':           'SWINGING STRIKE',
  'Swinging Strike (Blocked)': 'SWINGING STRIKE',
  'Foul':                      'FOUL BALL',
  'Foul Tip':                  'FOUL TIP',
  'Foul Bunt':                 'FOUL BUNT',
  'Hit By Pitch':              'HIT BY PITCH',
  'Intent Ball':               'INTENTIONAL BALL',
  'In play, no out':           'IN PLAY',
  'In play, out(s)':           'IN PLAY',
  'In play, run(s)':           'IN PLAY',
};

/**
 * Returns a human-readable display label for a pitch result string.
 * @param result - The raw result string from Pitch.result (MLB API).
 * @returns A formatted label suitable for display.
 */
export function formatPitchResult(result: string): string {
  return RESULT_LABELS[result] ?? result.toUpperCase();
}
