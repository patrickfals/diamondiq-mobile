import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Pitch } from '../types/atbat';
import { COLORS } from '../theme/colors';
import { getPitchTypeColor } from '../utils/pitchTypeColors';
import { formatPitchResult } from '../utils/formatPitchResult';

interface Props {
  pitches: Pitch[];
  selectedPitchNumber: number | null;
  onPitchPress: (pitch: Pitch) => void;
  /**
   * Classified batted-ball outcome, or null.
   * Pre-computed by AtBatScreen: null until isComplete, then classifyBattedBall(atBat.outcome).
   * Only the final pitch (number === finalPitchNumber) displays the HIT/OUT badge.
   */
  revealedOutcome: 'hit' | 'out' | null;
  /**
   * The pitch.number of the last pitch in the at-bat.
   * Derived by AtBatScreen from the actual number field of the last pitch.
   */
  finalPitchNumber: number | null;
  /**
   * The at-bat outcome string uppercased, or null before completion.
   * Pre-computed by AtBatScreen: replay.isComplete ? atBat.outcome.toUpperCase() : null.
   * When non-null and pitch is the final pitch, displayed instead of the pitch-level result.
   */
  finalOutcomeLabel: string | null;
}

export default function PitchHistory({
  pitches,
  selectedPitchNumber,
  onPitchPress,
  revealedOutcome,
  finalPitchNumber,
  finalOutcomeLabel,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PITCH LOG</Text>
      <ScrollView
        horizontal={false}
        scrollEnabled={false}
        style={styles.list}
      >
        {pitches.map((pitch) => {
          const color = getPitchTypeColor(pitch.type);
          const isSelected = pitch.number === selectedPitchNumber;
          const isFinalPitch = pitch.number === finalPitchNumber;
          const showOutcomeLabel = isFinalPitch && revealedOutcome !== null;

          // Display the at-bat outcome label for the final pitch when complete,
          // otherwise show the formatted pitch-level result.
          const resultDisplay = isFinalPitch && finalOutcomeLabel !== null
            ? finalOutcomeLabel
            : formatPitchResult(pitch.result);

          return (
            <TouchableOpacity
              key={pitch.number}
              onPress={() => onPitchPress(pitch)}
              activeOpacity={0.7}
              style={[styles.row, isSelected && styles.rowSelected]}
            >
              {/* Number bubble */}
              <View style={[styles.numBubble, { backgroundColor: color }]}>
                <Text style={styles.numText}>{pitch.number}</Text>
              </View>

              {/* Pitch info */}
              <View style={styles.info}>
                <Text style={styles.pitchType}>{pitch.type}</Text>
                <Text style={styles.countAfter}>{`${pitch.count_after_pitch.balls}-${pitch.count_after_pitch.strikes}`}</Text>
              </View>

              {/* Velocity + result display, with optional HIT/OUT badge */}
              <View style={styles.right}>
                <Text style={styles.velocity}>{pitch.velocity_mph.toFixed(1)} mph</Text>
                <Text style={styles.result}>{resultDisplay}</Text>
                {showOutcomeLabel && (
                  <View style={[
                    styles.outcomeBadge,
                    revealedOutcome === 'hit' ? styles.outcomeBadgeHit : styles.outcomeBadgeOut,
                  ]}>
                    <Text style={styles.outcomeBadgeText}>
                      {revealedOutcome === 'hit' ? 'HIT' : 'OUT'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 1.2, marginBottom: 8 },
  list: {},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentDim,
  },

  numBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  info: { flex: 1 },
  pitchType: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 1 },
  countAfter: { fontSize: 11, color: COLORS.muted },

  right: { alignItems: 'flex-end' },
  velocity: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 1 },
  result: { fontSize: 11, color: COLORS.muted },

  outcomeBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outcomeBadgeHit: { backgroundColor: '#19B99B' },
  outcomeBadgeOut: { backgroundColor: '#EF4444' },
  outcomeBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.8 },
});
