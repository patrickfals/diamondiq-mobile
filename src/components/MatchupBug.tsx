import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AtBat } from '../types/atbat';
import { COLORS } from '../theme/colors';

interface Props {
  atBat: AtBat;
  currentBalls: number;
  currentStrikes: number;
  revealedCount: number;
  isComplete: boolean;
  finalOutcomeLabel: string | null;
  onRestart: () => void;
}

function formatAvg(avg: number): string {
  const fixed = avg.toFixed(3);
  return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
}

function formatEra(era: number): string {
  return era.toFixed(2);
}

/** Last name from full batter/pitcher name string */
function lastName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export default function MatchupBug({
  atBat,
  currentBalls,
  currentStrikes,
  revealedCount,
  isComplete,
  finalOutcomeLabel,
  onRestart,
}: Props) {
  const avg = atBat.batter_stats?.avg ?? null;
  const era = atBat.pitcher_stats?.era ?? null;
  const halfLabel = atBat.half_inning === 'top' ? 'TOP' : 'BOT';
  const inningLabel = `${halfLabel} ${atBat.inning}`;

  const countDisplay = revealedCount === 0 ? '0–0' : `${currentBalls}–${currentStrikes}`;
  const subLabel = revealedCount === 0 ? 'READY' : `${inningLabel} · PITCH ${revealedCount}`;

  return (
    <View style={styles.card}>
      {/* Left: Batter */}
      <View style={styles.playerCol}>
        <Text style={styles.playerLabel}>BATTER</Text>
        <Text style={styles.playerName} numberOfLines={1}>{lastName(atBat.batter)}</Text>
        {avg !== null && (
          <Text style={styles.playerStat}>AVG {formatAvg(avg)}</Text>
        )}
      </View>

      {/* Center: Count / outcome */}
      <View style={styles.centerCol}>
        {isComplete && finalOutcomeLabel ? (
          <>
            <Text style={styles.outcomeText}>{finalOutcomeLabel}</Text>
            <Text style={styles.subLabel}>{inningLabel}</Text>
          </>
        ) : (
          <>
            <Text style={styles.countText}>{countDisplay}</Text>
            <Text style={styles.subLabel}>{subLabel}</Text>
          </>
        )}
      </View>

      {/* Right: Pitcher + restart */}
      <View style={styles.playerCol}>
        <View style={styles.pitcherRow}>
          <Text style={styles.playerLabel}>PITCHER</Text>
          <TouchableOpacity
            onPress={onRestart}
            style={styles.restartBtn}
            accessibilityLabel="Restart replay"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.restartIcon}>↺</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.playerName} numberOfLines={1}>{lastName(atBat.pitcher)}</Text>
        {era !== null && (
          <Text style={styles.playerStat}>ERA {formatEra(era)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 60,
  },
  playerCol: {
    flex: 1,
  },
  pitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1.4,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  playerStat: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.muted,
    marginTop: 1,
  },
  centerCol: {
    alignItems: 'center',
    paddingHorizontal: 10,
    minWidth: 80,
  },
  countText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    lineHeight: 30,
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.teal,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  restartBtn: {
    paddingLeft: 6,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartIcon: {
    fontSize: 15,
    color: COLORS.muted,
  },
});
