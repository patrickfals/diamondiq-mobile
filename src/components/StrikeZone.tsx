import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pitch } from '../types/atbat';
import { COLORS } from '../theme/colors';

/**
 * Strike-zone coordinate system
 * ─────────────────────────────
 * MLB plate_x:  left = negative, right = positive (catcher's view)
 *               strike-zone horizontal edges ≈ ±0.708 ft (17-inch plate)
 * MLB plate_z:  vertical feet above ground
 *               approximate strike zone: 1.5 ft (bottom) to 3.5 ft (top)
 *
 * Plotting area rendered: plate_x ∈ [−1.5, +1.5], plate_z ∈ [1.0, 4.0]
 * Y-axis is inverted for display (higher z → smaller screen Y).
 *
 * The inner 3×3 strike-zone grid covers [−0.708, +0.708] × [1.5, 3.5].
 */

// Physical extents of the rendered plotting area (feet)
const PLOT_X_MIN = -1.5;
const PLOT_X_MAX = 1.5;
const PLOT_Z_MIN = 1.0;
const PLOT_Z_MAX = 4.0;

// Strike-zone boundaries (approximate — batter-specific unavailable)
const SZ_X_MIN = -0.708;
const SZ_X_MAX = 0.708;
const SZ_Z_MIN = 1.5;
const SZ_Z_MAX = 3.5;

// Grid cell thresholds for the 3-column / 3-row zone
const SZ_X_THIRDS = [SZ_X_MIN, SZ_X_MIN + (SZ_X_MAX - SZ_X_MIN) / 3, SZ_X_MIN + (2 * (SZ_X_MAX - SZ_X_MIN)) / 3, SZ_X_MAX];
const SZ_Z_THIRDS = [SZ_Z_MIN, SZ_Z_MIN + (SZ_Z_MAX - SZ_Z_MIN) / 3, SZ_Z_MIN + (2 * (SZ_Z_MAX - SZ_Z_MIN)) / 3, SZ_Z_MAX];

// Canvas dimensions (logical pixels)
const CANVAS_WIDTH = 260;
const CANVAS_HEIGHT = 300;

function toCanvasX(plateX: number): number {
  return ((plateX - PLOT_X_MIN) / (PLOT_X_MAX - PLOT_X_MIN)) * CANVAS_WIDTH;
}

function toCanvasY(plateZ: number): number {
  // Invert: higher plate_z → smaller Y (top of screen)
  return (1 - (plateZ - PLOT_Z_MIN) / (PLOT_Z_MAX - PLOT_Z_MIN)) * CANVAS_HEIGHT;
}

function szToCanvas(x: number, z: number): { left: number; top: number } {
  return { left: toCanvasX(x), top: toCanvasY(z) };
}

const szTopLeft = szToCanvas(SZ_X_MIN, SZ_Z_MAX);
const szBottomRight = szToCanvas(SZ_X_MAX, SZ_Z_MIN);
const SZ_LEFT = szTopLeft.left;
const SZ_TOP = szTopLeft.top;
const SZ_WIDTH = szBottomRight.left - szTopLeft.left;
const SZ_HEIGHT = szBottomRight.top - szTopLeft.top;

// Inner grid line positions (2 vertical, 2 horizontal inside the zone)
const innerVerticals = [1, 2].map(i =>
  toCanvasX(SZ_X_THIRDS[i]) - SZ_LEFT
);
const innerHorizontals = [1, 2].map(i =>
  toCanvasY(SZ_Z_THIRDS[3 - i]) - SZ_TOP // flip for display
);

interface Props {
  pitches: Pitch[];
  selectedPitchNumber: number | null;
  onPitchPress: (pitch: Pitch) => void;
}

export default function StrikeZone({ pitches, selectedPitchNumber, onPitchPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>STRIKE ZONE</Text>
      <Text style={styles.approxNote}>Approx. boundaries · ~1.5–3.5 ft vertical</Text>

      {/* Outer canvas */}
      <View style={[styles.canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}>

        {/* Strike zone box */}
        <View style={[styles.szBox, { left: SZ_LEFT, top: SZ_TOP, width: SZ_WIDTH, height: SZ_HEIGHT }]}>
          {/* 3×3 inner grid lines */}
          {innerVerticals.map((x, i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: x }]} />
          ))}
          {innerHorizontals.map((y, i) => (
            <View key={`h${i}`} style={[styles.gridLineH, { top: y }]} />
          ))}
        </View>

        {/* Zone boundary labels */}
        <Text style={[styles.boundaryLabel, { left: SZ_LEFT - 2, top: SZ_TOP - 16 }]}>3.5 ft ↑</Text>
        <Text style={[styles.boundaryLabel, { left: SZ_LEFT - 2, top: SZ_TOP + SZ_HEIGHT + 2 }]}>1.5 ft ↓</Text>

        {/* Plate width indicator at bottom */}
        <Text style={[styles.boundaryLabel, {
          left: SZ_LEFT,
          top: SZ_TOP + SZ_HEIGHT + 18,
          width: SZ_WIDTH,
          textAlign: 'center',
        }]}>
          ← 17 in →
        </Text>

        {/* Pitch markers */}
        {pitches.map((pitch, idx) => {
          const cx = toCanvasX(pitch.plate_x);
          const cy = toCanvasY(pitch.plate_z);
          const color = COLORS.pitchColors[idx % COLORS.pitchColors.length];
          const isSelected = pitch.number === selectedPitchNumber;

          return (
            <TouchableOpacity
              key={pitch.number}
              onPress={() => onPitchPress(pitch)}
              style={[
                styles.pitchMarker,
                {
                  left: cx - (isSelected ? 14 : 12),
                  top: cy - (isSelected ? 14 : 12),
                  width: isSelected ? 28 : 24,
                  height: isSelected ? 28 : 24,
                  borderRadius: isSelected ? 14 : 12,
                  backgroundColor: color,
                  borderWidth: isSelected ? 2 : 1.5,
                  borderColor: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                },
              ]}
            >
              <Text style={styles.pitchMarkerText}>{pitch.number}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.hint}>Tap a pitch marker for details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 1.2, marginBottom: 2 },
  approxNote: { fontSize: 10, color: COLORS.muted, marginBottom: 12, opacity: 0.7 },

  canvas: { position: 'relative' },

  szBox: {
    position: 'absolute',
    backgroundColor: COLORS.zoneBackground,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    overflow: 'hidden',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.zoneStroke,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.zoneStroke,
  },

  boundaryLabel: {
    position: 'absolute',
    fontSize: 9,
    color: COLORS.muted,
    opacity: 0.8,
  },

  pitchMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  pitchMarkerText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  hint: { fontSize: 10, color: COLORS.muted, marginTop: 8, opacity: 0.7 },
});
