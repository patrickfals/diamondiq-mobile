import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props {
  currentBalls: number;
  currentStrikes: number;
  progressLabel: string;
  isComplete: boolean;
  outcome: string; // only rendered when isComplete === true
}

export default function ReplayStatusBar({
  currentBalls,
  currentStrikes,
  progressLabel,
  isComplete,
  outcome,
}: Props) {
  return (
    <View style={styles.container}>
      {isComplete ? (
        // When complete: show only the outcome result — no ball-strike count
        <View style={styles.outcomeFull}>
          <Text style={styles.outcomeLabel}>RESULT</Text>
          <Text style={styles.outcomeValue}>{outcome.toUpperCase()}</Text>
        </View>
      ) : (
        // During replay: show count on the left, progress label on the right
        <>
          <View style={styles.countBlock}>
            <Text style={styles.countLabel}>COUNT</Text>
            <Text style={styles.countValue}>
              {currentBalls}–{currentStrikes}
            </Text>
          </View>
          <View style={styles.progressBlock}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
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
