import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Pitch } from '../types/atbat';
import { COLORS } from '../theme/colors';

interface Props {
  pitches: Pitch[];
  selectedPitchNumber: number | null;
  onPitchPress: (pitch: Pitch) => void;
}

export default function PitchHistory({ pitches, selectedPitchNumber, onPitchPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PITCH LOG</Text>
      <ScrollView
        horizontal={false}
        scrollEnabled={false}
        style={styles.list}
      >
        {pitches.map((pitch, idx) => {
          const color = COLORS.pitchColors[idx % COLORS.pitchColors.length];
          const isSelected = pitch.number === selectedPitchNumber;
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

              {/* Velocity + result */}
              <View style={styles.right}>
                <Text style={styles.velocity}>{pitch.velocity_mph.toFixed(1)} mph</Text>
                <Text style={styles.result}>{pitch.result}</Text>
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
});
