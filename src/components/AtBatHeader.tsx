import { View, Text, StyleSheet } from 'react-native';
import { AtBat } from '../types/atbat';
import { COLORS } from '../theme/colors';

interface Props {
  atBat: AtBat;
  isComplete: boolean; // controls whether the outcome is revealed
}

/**
 * Format batting average to three decimal places without a leading zero.
 * Examples: 0.244 → ".244", 1.0 → "1.000"
 */
function formatAvg(avg: number): string {
  const fixed = avg.toFixed(3);
  // Keep leading "1" if AVG is exactly 1.000; otherwise strip leading "0"
  return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
}

/**
 * Format ERA to two decimal places, including trailing zeros.
 * Example: 4.7 → "4.70"
 */
function formatEra(era: number): string {
  return era.toFixed(2);
}

export default function AtBatHeader({ atBat, isComplete }: Props) {
  const halfLabel = atBat.half_inning === 'top' ? 'Top' : 'Bot';
  const inningLabel = `${halfLabel} ${atBat.inning}`;

  const avg = atBat.batter_stats?.avg ?? null;
  const era = atBat.pitcher_stats?.era ?? null;

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
          {avg !== null && (
            <Text style={styles.playerStat}>AVG {formatAvg(avg)}</Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.player}>
          <Text style={styles.playerLabel}>PITCHER</Text>
          <Text style={styles.playerName}>{atBat.pitcher}</Text>
          {era !== null && (
            <Text style={styles.playerStat}>ERA {formatEra(era)}</Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{inningLabel}</Text>
        {isComplete && (
          <>
            <Text style={styles.metaSep}>·</Text>
            <Text style={styles.outcome}>{atBat.outcome.toUpperCase()}</Text>
          </>
        )}
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
  playerStat: { fontSize: 11, fontWeight: '500', color: COLORS.muted, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: COLORS.border, marginHorizontal: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 13, color: COLORS.muted },
  metaSep: { fontSize: 13, color: COLORS.muted, marginHorizontal: 6 },
  outcome: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
});
