import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Pitch } from '../types/atbat';
import { COLORS } from '../theme/colors';
import { getResultCategory, getResultColor } from '../utils/pitchResultStyle';

/**
 * StrikeZone — new design spec
 *
 * Coordinate system
 * ─────────────────
 * plate_x: left = negative, right = positive (catcher's view)
 * plate_z: feet above ground (vertical)
 * Visible range: x centered at 0, z ∈ [1.4, 4.5]
 * True proportions: one uniform scale for x and y so the zone is not
 * stretched. Zone width = 1.416 ft (±0.708). Zone height = 2.0 ft (1.5–3.5).
 *
 * Canvas: 166 × 245 px (fits the center column of the hero card).
 */

// ── Canvas dimensions ────────────────────────────────────────────────────────
const CANVAS_W = 166;
const CANVAS_H = 245;

// ── Physical extents (feet) ──────────────────────────────────────────────────
const Z_MIN = 1.4;
const Z_MAX = 4.5;
const Z_RANGE = Z_MAX - Z_MIN; // 3.1 ft

// Uniform scale: fit the z-range into the canvas height
const SCALE = CANVAS_H / Z_RANGE; // px per foot

// X-range derived from the same scale so aspect ratio is 1:1
const X_HALF = CANVAS_W / 2 / SCALE; // half-width in feet
const X_MIN = -X_HALF;
const X_MAX =  X_HALF;

// ── Strike-zone boundaries ───────────────────────────────────────────────────
const SZ_X_MIN = -0.708;
const SZ_X_MAX =  0.708;
const SZ_Z_MIN =  1.5;
const SZ_Z_MAX =  3.5;

// ── Conversion helpers ───────────────────────────────────────────────────────
function toCanvasX(x: number): number {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * CANVAS_W;
}
function toCanvasY(z: number): number {
  return (1 - (z - Z_MIN) / Z_RANGE) * CANVAS_H;
}

// ── Zone box in canvas coordinates ───────────────────────────────────────────
const SZ_LEFT   = toCanvasX(SZ_X_MIN);
const SZ_TOP    = toCanvasY(SZ_Z_MAX);
const SZ_RIGHT  = toCanvasX(SZ_X_MAX);
const SZ_BOTTOM = toCanvasY(SZ_Z_MIN);
const SZ_W      = SZ_RIGHT - SZ_LEFT;
const SZ_H      = SZ_BOTTOM - SZ_TOP;

// ── 3×3 inner grid ───────────────────────────────────────────────────────────
const GRID_V = [1, 2].map(i => SZ_LEFT + (SZ_W / 3) * i);
const GRID_H = [1, 2].map(i => SZ_TOP  + (SZ_H / 3) * i);

// ── Home-plate shape dimensions ───────────────────────────────────────────────
const PLATE_W  = SZ_W * 0.72;
const PLATE_H  = 12;
const PLATE_X  = CANVAS_W / 2 - PLATE_W / 2;
const PLATE_Y  = CANVAS_H - 2;   // bottom of canvas

// ── Marker radii ─────────────────────────────────────────────────────────────
const R_LATEST = 12;
const R_OLDER  = 9;
const R_HALO   = 20;

// ── Outcome ring ─────────────────────────────────────────────────────────────
const RING_HIT_COLOR  = COLORS.teal;
const RING_OUT_COLOR  = COLORS.resultStrike;

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  pitches: Pitch[];
  selectedPitchNumber: number | null;
  onPitchPress: (pitch: Pitch) => void;
  revealedOutcome: 'hit' | 'out' | null;
  finalPitchNumber: number | null;
  evidenceHighlight?: number[] | null;
}

export default function StrikeZone({
  pitches,
  selectedPitchNumber,
  onPitchPress,
  revealedOutcome,
  finalPitchNumber,
  evidenceHighlight,
}: Props) {
  const latestNumber = pitches.length > 0 ? pitches[pitches.length - 1].number : null;

  return (
    <View style={[styles.canvas, { width: CANVAS_W, height: CANVAS_H + PLATE_H + 4 }]}>

      {/* ── Zone outline ───────────────────────────────────────────────────── */}
      <View style={[styles.szBox, { left: SZ_LEFT, top: SZ_TOP, width: SZ_W, height: SZ_H }]}>
        {/* Faint 3×3 inner grid */}
        {GRID_V.map((x, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: x - SZ_LEFT }]} />
        ))}
        {GRID_H.map((y, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: y - SZ_TOP }]} />
        ))}
      </View>

      {/* ── Home-plate shape ───────────────────────────────────────────────── */}
      <View style={[styles.plate, { left: PLATE_X, top: PLATE_Y, width: PLATE_W }]} />

      {/* ── Pitch markers ──────────────────────────────────────────────────── */}
      {pitches.map((pitch) => {
        const isLatest   = pitch.number === latestNumber;
        const isFinal    = pitch.number === finalPitchNumber;
        const isSelected = pitch.number === selectedPitchNumber;
        const r          = isLatest ? R_LATEST : R_OLDER;
        const hitBox     = R_HALO; // touch target always uses halo size

        const rawCx = toCanvasX(pitch.plate_x);
        const rawCy = toCanvasY(pitch.plate_z);
        // Clamp to canvas edges (keep center within canvas)
        const cx = Math.max(r, Math.min(CANVAS_W - r, rawCx));
        const cy = Math.max(r, Math.min(CANVAS_H - r, rawCy));

        const isDimmed =
          evidenceHighlight != null &&
          evidenceHighlight.length > 0 &&
          !evidenceHighlight.includes(pitch.number);

        const cat        = getResultCategory(pitch.result);
        const color      = getResultColor(pitch.result);
        const isBall     = cat === 'ball';

        // Outcome ring on final pitch when complete
        const showOutcomeRing = isFinal && revealedOutcome !== null;
        const outcomeRingColor = revealedOutcome === 'hit' ? RING_HIT_COLOR : RING_OUT_COLOR;

        const opacity = isDimmed ? 0.3 : isLatest ? 1 : 0.5;

        const containerSize = hitBox * 2;

        return (
          <View
            key={pitch.number}
            style={[
              styles.markerContainer,
              {
                left: cx - hitBox,
                top:  cy - hitBox,
                width: containerSize,
                height: containerSize,
                opacity,
              },
            ]}
          >
            {/* Halo — latest pitch only */}
            {isLatest && (
              <View
                pointerEvents="none"
                style={[
                  styles.halo,
                  {
                    width: R_HALO * 2,
                    height: R_HALO * 2,
                    borderRadius: R_HALO,
                    backgroundColor: color + '29', // 16% opacity
                    left: hitBox - R_HALO,
                    top:  hitBox - R_HALO,
                  },
                ]}
              />
            )}

            {/* Outcome ring — final pitch when replay complete */}
            {showOutcomeRing && (
              <View
                pointerEvents="none"
                style={[
                  styles.ring,
                  {
                    width: (r + 4) * 2,
                    height: (r + 4) * 2,
                    borderRadius: r + 4,
                    borderColor: outcomeRingColor,
                    left: hitBox - r - 4,
                    top:  hitBox - r - 4,
                  },
                ]}
              />
            )}

            {/* Selection ring — white, when tapped */}
            {isSelected && (
              <View
                pointerEvents="none"
                style={[
                  styles.ring,
                  {
                    width: (r + 7) * 2,
                    height: (r + 7) * 2,
                    borderRadius: r + 7,
                    borderColor: '#FFFFFF',
                    left: hitBox - r - 7,
                    top:  hitBox - r - 7,
                  },
                ]}
              />
            )}

            {/* Marker */}
            <TouchableOpacity
              onPress={() => onPitchPress(pitch)}
              style={[
                styles.marker,
                {
                  width: r * 2,
                  height: r * 2,
                  borderRadius: r,
                  left: hitBox - r,
                  top:  hitBox - r,
                  // Ball: hollow with ring; others: filled
                  backgroundColor: isBall ? COLORS.card : color,
                  borderWidth: isBall ? 2 : 0,
                  borderColor: isBall ? COLORS.resultBall : 'transparent',
                },
              ]}
            >
              <Text style={[
                styles.markerText,
                {
                  fontSize: r < 12 ? 10 : 11,
                  color: isBall ? COLORS.resultBall : '#fff',
                },
              ]}>
                {pitch.number}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'relative',
  },
  szBox: {
    position: 'absolute',
    borderWidth: 1.8,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 5,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  plate: {
    position: 'absolute',
    height: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  markerContainer: {
    position: 'absolute',
  },
  halo: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontWeight: '700',
    color: '#fff',
    lineHeight: 14,
  },
});
