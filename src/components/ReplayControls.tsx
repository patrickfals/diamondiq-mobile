import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props {
  isPlaying: boolean;
  isComplete: boolean;
  isReady: boolean; // revealedCount === 0
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
  onReplay: () => void;
}

export default function ReplayControls({
  isPlaying,
  isComplete,
  isReady,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onRestart,
  onReplay,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Restart — always visible */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onRestart}
        accessibilityLabel="Restart replay"
      >
        <Text style={styles.secondaryIcon}>⟪</Text>
        <Text style={styles.secondaryLabel}>Restart</Text>
      </TouchableOpacity>

      {/* Previous */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onPrevious}
        disabled={isReady}
        accessibilityLabel="Previous pitch"
      >
        <Text style={[styles.secondaryIcon, isReady && styles.dimmed]}>‹</Text>
        <Text style={[styles.secondaryLabel, isReady && styles.dimmed]}>Prev</Text>
      </TouchableOpacity>

      {/* Play / Pause / Replay — primary centre button */}
      {isComplete ? (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onReplay}
          accessibilityLabel="Replay at-bat from beginning"
        >
          <Text style={styles.primaryLabel}>↺  Replay</Text>
        </TouchableOpacity>
      ) : isPlaying ? (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onPause}
          accessibilityLabel="Pause replay"
        >
          <Text style={styles.primaryLabel}>⏸  Pause</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onPlay}
          accessibilityLabel="Play replay"
        >
          <Text style={styles.primaryLabel}>▶  Play</Text>
        </TouchableOpacity>
      )}

      {/* Next */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onNext}
        disabled={isComplete}
        accessibilityLabel="Next pitch"
      >
        <Text style={[styles.secondaryIcon, isComplete && styles.dimmed]}>›</Text>
        <Text style={[styles.secondaryLabel, isComplete && styles.dimmed]}>Next</Text>
      </TouchableOpacity>

      {/* Spacer mirrors Restart width to keep primary btn centred */}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 110,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 48,
  },
  secondaryIcon: {
    fontSize: 20,
    color: COLORS.muted,
    lineHeight: 24,
  },
  secondaryLabel: {
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dimmed: {
    opacity: 0.3,
  },
  spacer: {
    minWidth: 48,
  },
});
