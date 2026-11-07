import { View, Text, StyleSheet } from 'react-native';
import { AtBat } from '../types/atbat';
import { COLORS } from '../theme/colors';

interface Props {
  atBat: AtBat;
}

export default function AtBatHeader({ atBat }: Props) {
  const halfLabel = atBat.half_inning === 'top' ? 'Top' : 'Bot';
  const inningLabel = `${halfLabel} ${atBat.inning}`;

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.logo}>DiamondIQ</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>GAME REPLAY</Text>
        </View>
      </View>

      <View style={styles.matchup}>
        <View style={styles.player}>
          <Text style={styles.playerLabel}>BATTER</Text>
          <Text style={styles.playerName}>{atBat.batter}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.player}>
          <Text style={styles.playerLabel}>PITCHER</Text>
          <Text style={styles.playerName}>{atBat.pitcher}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{inningLabel}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Text style={styles.outcome}>{atBat.outcome.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  logo: { fontSize: 22, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.5 },
  badge: { marginLeft: 10, backgroundColor: COLORS.accentDim, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.accent, letterSpacing: 1.2 },
  matchup: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  player: { flex: 1 },
  playerLabel: { fontSize: 10, fontWeight: '600', color: COLORS.muted, letterSpacing: 1, marginBottom: 2 },
  playerName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  divider: { width: 1, height: 36, backgroundColor: COLORS.border, marginHorizontal: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 13, color: COLORS.muted },
  metaSep: { fontSize: 13, color: COLORS.muted, marginHorizontal: 6 },
  outcome: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
});
