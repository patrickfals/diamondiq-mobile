import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Pitch } from '../types/atbat';
import { COLORS } from '../theme/colors';

interface Props {
  pitch: Pitch | null;
  onClose: () => void;
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function PitchDetailOverlay({ pitch, onClose }: Props) {
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
                <Text style={styles.cardTitle}>
                  Pitch {pitch?.number} — Details
                </Text>
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

  coordNote: {
    marginTop: 14,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
  },
  coordNoteText: { fontSize: 11, color: COLORS.muted, lineHeight: 17 },
});
