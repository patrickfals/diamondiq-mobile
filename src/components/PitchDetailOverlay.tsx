import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Pitch } from '../types/atbat';
import { COLORS } from '../theme/colors';
import { getPitchTypeColor } from '../utils/pitchTypeColors';

interface Props {
  pitch: Pitch | null;
  onClose: () => void;
  /**
   * Classified batted-ball outcome, or null.
   * Pre-computed by AtBatScreen: null until isComplete, then classifyBattedBall(atBat.outcome).
   * Only the final pitch (number === finalPitchNumber) shows the label row.
   */
  revealedOutcome: 'hit' | 'out' | null;
  /**
   * The pitch.number of the last pitch in the at-bat.
   * Derived by AtBatScreen from the actual number field of the last pitch.
   */
  finalPitchNumber: number | null;
}

interface DetailRowProps {
  label: string;
  value: string;
  valueStyle?: object;
}

function DetailRow({ label, value, valueStyle }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export default function PitchDetailOverlay({
  pitch,
  onClose,
  revealedOutcome,
  finalPitchNumber,
}: Props) {
  const isFinalPitch = pitch !== null && pitch.number === finalPitchNumber;
  const showOutcomeLabel = isFinalPitch && revealedOutcome !== null;
  const pitchColor = pitch ? getPitchTypeColor(pitch.type) : COLORS.muted;

  return (
    <Modal
      visible={pitch !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => { /* prevent close on inner tap */ }}>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  {/* Pitch-type color dot */}
                  <View style={[styles.typeDot, { backgroundColor: pitchColor }]} />
                  <Text style={styles.cardTitle}>
                    Pitch {pitch?.number} — Details
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {pitch && (
                <>
                  <DetailRow label="Type" value={pitch.type} />
                  <DetailRow label="Result" value={pitch.result} />
                  <DetailRow label="Velocity" value={`${pitch.velocity_mph.toFixed(1)} mph`} />
                  <DetailRow label="Horizontal position" value={`${pitch.plate_x.toFixed(3)} ft`} />
                  <DetailRow label="Vertical position" value={`${pitch.plate_z.toFixed(3)} ft`} />
                  <DetailRow label="Count after" value={`${pitch.count_after_pitch.balls}-${pitch.count_after_pitch.strikes}`} />

                  {/* Outcome label — only for the final pitch when isComplete */}
                  {showOutcomeLabel && (
                    <DetailRow
                      label="Outcome"
                      value={revealedOutcome === 'hit' ? 'HIT' : 'OUT'}
                      valueStyle={revealedOutcome === 'hit' ? styles.outcomeHit : styles.outcomeOut}
                    />
                  )}

                  <View style={styles.coordNote}>
                    <Text style={styles.coordNoteText}>
                      Coordinates represent pitch crossing at home plate.{'\n'}
                      Horizontal: negative = inside (RHB), positive = outside.{'\n'}
                      Vertical: feet above ground.
                    </Text>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  card: {
    width: '100%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 16, color: COLORS.muted },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: 13, color: COLORS.muted },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  outcomeHit: { color: '#19B99B' },
  outcomeOut: { color: '#EF4444' },

  coordNote: {
    marginTop: 14,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
  },
  coordNoteText: { fontSize: 11, color: COLORS.muted, lineHeight: 17 },
});
