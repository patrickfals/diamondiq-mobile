/**
 * Centralized pitch-type color mapping.
 *
 * Keyed on the `type` field returned by the FastAPI backend (Pitch.type).
 * The backend does not expose MLB pitch codes; this mapping uses the full
 * human-readable type name exactly as it appears in the API response.
 *
 * Verified pitch types (from live API — game 777245, at-bat 8):
 *   "Four-Seam Fastball", "Slurve", "Changeup"
 *
 * Unknown pitch types fall back to FALLBACK_PITCH_COLOR.
 */

/** Fallback color for any pitch type not present in the mapping. */
export const FALLBACK_PITCH_COLOR = '#7a8ba6';

/**
 * Pitch-type name → hex color.
 * Add entries here as new pitch types are encountered in future at-bats.
 */
const PITCH_TYPE_COLOR_MAP: Record<string, string> = {
  'Four-Seam Fastball': '#208BE8',
  'Slurve':            '#9A72E8',
  'Changeup':          '#E9A34D',
};

/**
 * Returns the display color for a given pitch type string.
 * Uses the `type` field from the Pitch object — not an MLB pitch code.
 * Returns FALLBACK_PITCH_COLOR for any unrecognized type.
 */
export function getPitchTypeColor(pitchType: string): string {
  return PITCH_TYPE_COLOR_MAP[pitchType] ?? FALLBACK_PITCH_COLOR;
}
