import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props {
  currentBalls: number;
  currentStrikes: number;
  progressLabel: string;
  /**
   * The at-bat outcome string uppercased, or null before completion.
   * Pre-computed by AtBatScreen: replay.isComplete ? atBat.outcome.toUpperCase() : null.
   * When non-null, this replaces the entire status bar with the final outcome display.
   */
  finalOutcomeLabel: string | null;
  /**
   * Formatted result of the most recently revealed pitch.
   * Null before any pitch is revealed.
   * Derived from revealedPitches in AtBatScreen — no separate useState.
   */
  currentPitchResult: string | null;
}

export default function ReplayStatusBar({
  currentBalls,
  currentStrikes,
  progressLabel,
  finalOutcomeLabel,
  currentPitchResult,
}: Props) {
  return (
    <View style={styles.container}>
      {finalOutcomeLabel !== null ? (
        // When complete: show only the at-bat outcome — no ball-strike count
        <View style={styles.outcomeFull}>
          <Text style={styles.outcomeLabel}>RESULT</Text>
          <Text style={styles.outcomeValue}>{finalOutcomeLabel}</Text>
        </View>
      ) : (
        // During replay: count on the left; progress label + current pitch result on the right
        <>
          <View style={styles.countBlock}>
            <Text style={styles.countLabel}>COUNT</Text>
            <Text style={styles.countValue}>
              {currentBalls}–{currentStrikes}
            </Text>
          </View>
          <View style={styles.progressBlock}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            {currentPitchResult !== null && (
              <Text style={styles.pitchResult}>{currentPitchResult}</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // ── Incomplete state ────────────────────────────────────────────────────────
  countBlock: {
    alignItems: 'center',
    marginRight: 20,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  countValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  progressBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  pitchResult: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  // ── Complete state ──────────────────────────────────────────────────────────
  outcomeFull: {
    flex: 1,
    alignItems: 'flex-start',
  },
  outcomeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  outcomeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
