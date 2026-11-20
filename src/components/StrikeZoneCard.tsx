import { View, Text, StyleSheet } from 'react-native';
import { Pitch } from '../types/atbat';
import { COLORS } from '../theme/colors';
import { getPitchTypeColor } from '../utils/pitchTypeColors';
import { formatPitchResult } from '../utils/formatPitchResult';
import StrikeZone from './StrikeZone';

interface Props {
  pitches: Pitch[];
  selectedPitchNumber: number | null;
  onPitchPress: (pitch: Pitch) => void;
  revealedOutcome: 'hit' | 'out' | null;
  finalPitchNumber: number | null;
  evidenceHighlight: number[] | null;
  /** Legend items derived from revealed pitches only */
  legendItems: { type: string; color: string; count: number }[];
  /** Latest pitch result label, or null before any pitch revealed */
  currentPitchResult: string | null;
  /** Latest revealed pitch type label, or null */
  currentPitchType: string | null;
}

export default function StrikeZoneCard({
  pitches,
  selectedPitchNumber,
  onPitchPress,
  revealedOutcome,
  finalPitchNumber,
  evidenceHighlight,
  legendItems,
  currentPitchResult,
  currentPitchType,
}: Props) {
  const typeColor = currentPitchType ? getPitchTypeColor(currentPitchType) : null;

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>STRIKE ZONE</Text>
        {currentPitchResult !== null && (
          <View style={styles.resultBadge}>
            {typeColor !== null && (
              <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
            )}
            <Text style={styles.resultText}>{currentPitchResult}</Text>
            {currentPitchType !== null && (
              <Text style={styles.typeText}> · {currentPitchType}</Text>
            )}
          </View>
        )}
      </View>

      {/* Strike zone */}
      <StrikeZone
        pitches={pitches}
        selectedPitchNumber={selectedPitchNumber}
        onPitchPress={onPitchPress}
        revealedOutcome={revealedOutcome}
        finalPitchNumber={finalPitchNumber}
        evidenceHighlight={evidenceHighlight}
      />

      {/* Legend — only revealed pitch types, spoiler-safe */}
      {legendItems.length > 0 && (
        <View style={styles.legend}>
          {legendItems.map((item) => (
            <View key={item.type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.type}</Text>
              <Text style={styles.legendCount}>×{item.count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  resultText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  typeText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 2,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 3,
  },
  legendCount: {
    fontSize: 10,
    color: COLORS.muted,
  },
});
