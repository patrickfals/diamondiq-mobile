import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Pitch } from '../types/atbat';
import { AtBat } from '../types/atbat';
import { COLORS } from '../theme/colors';
import {
  getResultCategory,
  getResultColor,
  getResultLetter,
  getPitchTypeCode,
  getPitchTypeCodeColor,
} from '../utils/pitchResultStyle';
import {
  getTrace,
  TraceSummary,
  isHumanEdited,
  KnowledgeLevel,
} from '../data/commentaryData';
import { classifyBattedBall } from '../utils/classifyBattedBall';
import StrikeZone from './StrikeZone';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  atBat: AtBat;
  revealedPitches: Pitch[];
  revealedCount: number;
  isComplete: boolean;
  currentBalls: number;
  currentStrikes: number;
  finalPitchNumber: number | null;
  evidenceHighlight: number[] | null;
  selectedPitchNumber: number | null;
  onPitchPress: (pitch: Pitch) => void;
  onAgentPanelOpen: () => void;   // pauses replay
  agentPanelOpen: boolean;
  onAgentPanelClose: () => void;
  selectedLevel: KnowledgeLevel;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAvg(avg: number): string {
  const f = avg.toFixed(3);
  return f.startsWith('0.') ? f.slice(1) : f;
}

function lastName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1];
}

/** Human-readable pitch name from type code */
function pitchName(code: string): string {
  if (code === 'FF') return 'Fastball';
  if (code === 'SV') return 'Slurve';
  if (code === 'SL') return 'Slider';
  if (code === 'CH') return 'Changeup';
  return code; // unknown codes pass through
}

// Count dots row: 3 balls + 2 strikes
function CountDots({ balls, strikes }: { balls: number; strikes: number }) {
  return (
    <View style={styles.dotsRow}>
      {/* Ball dots — 3 slots */}
      {[0, 1, 2].map(i => (
        <View
          key={`b${i}`}
          style={[
            styles.dot,
            { backgroundColor: i < balls ? COLORS.resultBall : 'rgba(255,255,255,0.15)' },
          ]}
        />
      ))}
      <View style={styles.dotSpacer} />
      {/* Strike dots — 2 slots */}
      {[0, 1].map(i => (
        <View
          key={`s${i}`}
          style={[
            styles.dot,
            { backgroundColor: i < strikes ? COLORS.resultStrike : 'rgba(255,255,255,0.15)' },
          ]}
        />
      ))}
    </View>
  );
}

// ── Pitch-mix item ────────────────────────────────────────────────────────────

function PitchMixRow({
  code,
  count,
  total,
}: {
  code: string;
  count: number;
  total: number;
}) {
  const color = getPitchTypeCodeColor(code);
  const pct   = total > 0 ? count / total : 0;
  return (
    <View style={styles.mixRow}>
      <Text style={[styles.mixCode, { color }]}>{code}</Text>
      <Text style={styles.mixCount}>{count}</Text>
      <View style={styles.mixBarTrack}>
        <View style={[styles.mixBarFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Agent panel overlay ───────────────────────────────────────────────────────

function AgentPanel({
  revealedCount,
  isComplete,
  selectedLevel,
  onClose,
}: {
  revealedCount: number;
  isComplete: boolean;
  selectedLevel: KnowledgeLevel;
  onClose: () => void;
}) {
  const trace: TraceSummary | null = getTrace(revealedCount);
  const dur = (s: number | null) => s != null ? s.toFixed(1) + 's' : null;

  const durA      = dur(trace?.stageA_duration_s ?? null);
  const durB      = dur(trace?.stageB_duration_s ?? null);
  const durTotal  = dur(trace?.total_elapsed_s ?? null);
  const shortRunId = trace?.run_id ? trace.run_id.slice(0, 8) : null;

  // Step 2 — Pitch Scout snapshot label
  const snapCount = trace?.snapshotRedeemed?.revealed_count ?? revealedCount;
  const allPitchesLabel = isComplete
    ? `saw all ${snapCount} pitches`
    : `saw pitches 1–${snapCount} only`;
  const hiddenText = isComplete
    ? ''
    : ` Pitch ${snapCount + 1} onward and the outcome were hidden from the AI.`;

  // Step 4 — human review status for the selected level
  const humanReviewed = isHumanEdited(revealedCount, selectedLevel);

  const steps = [
    {
      num: '1',
      color: COLORS.accent,
      label: 'Analyst',
      body: 'Asked Pitch Scout for the pitches so far.',
      dur: durA,
      tag: null as string | null,
    },
    {
      num: '2',
      color: COLORS.teal,
      label: 'Pitch Scout',
      body: `Redeemed a signed snapshot: ${allPitchesLabel}.${hiddenText}`,
      dur: null as string | null,
      tag: 'server-verified',
    },
    {
      num: '3',
      color: COLORS.accent,
      label: 'Analyst',
      body: `Got pitches 1–${snapCount} back from Pitch Scout and analyzed them with the count.`,
      dur: null as string | null,
      tag: null as string | null,
    },
    {
      num: '4',
      color: COLORS.violet,
      label: 'Fan Experience',
      body: 'Wrote 4 versions, one per knowledge level.' +
        (humanReviewed ? ' This version was human-reviewed.' : ''),
      dur: durB,
      tag: null as string | null,
    },
  ];

  return (
    <View style={styles.agentOverlay}>
      {/* Header */}
      <View style={styles.agentHeader}>
        <Text style={styles.agentTitle}>How it was made</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.agentClose}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Steps — scrollable */}
      <ScrollView style={styles.agentStepsScroll} showsVerticalScrollIndicator={false}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <View key={step.num} style={styles.agentStep}>
              {/* Number + connecting line */}
              <View style={styles.agentStepLeft}>
                <View style={[styles.agentNumBadge, { borderColor: step.color }]}>
                  <Text style={[styles.agentNumText, { color: step.color }]}>{step.num}</Text>
                </View>
                {!isLast && <View style={styles.agentConnLine} />}
              </View>
              {/* Content */}
              <View style={[styles.agentStepContent, isLast && { marginBottom: 0 }]}>
                <View style={styles.agentStepRow}>
                  <Text style={[styles.agentStepLabel, { color: step.color }]}>{step.label}</Text>
                  {step.dur != null && <Text style={styles.agentStepDur}>{step.dur}</Text>}
                  {step.tag != null && (
                    <Text style={[styles.agentVerified, { color: COLORS.teal }]}>{step.tag}</Text>
                  )}
                </View>
                <Text style={styles.agentStepSub}>{step.body}</Text>
              </View>
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.agentFooter}>
          <Text style={styles.agentAntiSpoiler}>
            The AI can't spoil what it can't see.
          </Text>
          {(shortRunId != null || durTotal != null) && (
            <Text style={styles.agentRunLine}>
              {'watsonx Orchestrate'}
              {shortRunId != null ? ` · run ${shortRunId}` : ''}
              {durTotal != null ? ` · ${durTotal}` : ''}
            </Text>
          )}
          <Text style={styles.agentPartial}>
            Partial trace — steps inside IBM aren't observable.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Level-aware left rail ─────────────────────────────────────────────────────

function LeftRail({
  level,
  revealedPitches,
  onPitchPress,
}: {
  level: KnowledgeLevel;
  revealedPitches: Pitch[];
  onPitchPress: (pitch: Pitch) => void;
}) {
  const isNovice   = level === 'novice';
  const isLearning = level === 'learning';
  const isExpert   = level === 'expert';

  const label = (isNovice || isLearning) ? 'PITCHES' : 'SEQUENCE';

  return (
    <View style={styles.railCol}>
      <Text style={styles.colLabel}>{label}</Text>
      {revealedPitches.length === 0 ? (
        <Text style={styles.emptyHint}>Pitches{'\n'}appear here</Text>
      ) : (
        revealedPitches.map((p, idx) => {
          const isLast   = idx === revealedPitches.length - 1;
          const code     = getPitchTypeCode(p.type);
          const codeColor = getPitchTypeCodeColor(code);
          const resColor  = getResultColor(p.result);
          const resLetter = getResultLetter(p.result);
          const cat       = getResultCategory(p.result);

          // novice: dot = hollow ring for ball, filled for others
          const isBall   = cat === 'ball';

          return (
            <TouchableOpacity
              key={p.number}
              onPress={() => onPitchPress(p)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={[styles.railRow, { opacity: isLast ? 1 : 0.75 }]}
            >
              {/* column 1: number */}
              <Text style={styles.railNum}>{p.number}</Text>

              {/* column 2: name or code */}
              {(isNovice || isLearning) ? (
                <Text style={[styles.railName, { color: codeColor }]} numberOfLines={1}>
                  {pitchName(code)}
                </Text>
              ) : (
                /* regular / expert: code + velo */
                <>
                  <Text style={[styles.railCode, { color: codeColor }]}>{code}</Text>
                  <Text style={styles.railVelo}>
                    {isExpert ? p.velocity_mph.toFixed(1) : Math.round(p.velocity_mph).toString()}
                  </Text>
                </>
              )}

              {/* column 3: result indicator */}
              {isNovice ? (
                /* dot: hollow ring = ball, filled = others */
                isBall ? (
                  <View style={[styles.railDotRing, { borderColor: resColor }]} />
                ) : (
                  <View style={[styles.railDotFilled, { backgroundColor: resColor }]} />
                )
              ) : (
                /* letter in result color */
                <Text style={[styles.railLetter, { color: resColor }]}>{resLetter}</Text>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

// ── Level-aware right rail ────────────────────────────────────────────────────

function RightRail({
  level,
  revealedPitches,
  revealedCount,
}: {
  level: KnowledgeLevel;
  revealedPitches: Pitch[];
  revealedCount: number;
}) {
  // ── Shared derived data ───────────────────────────────────────────────────

  // Pitch mix: code → count
  const mixMap = new Map<string, number>();
  for (const p of revealedPitches) {
    const code = getPitchTypeCode(p.type);
    mixMap.set(code, (mixMap.get(code) ?? 0) + 1);
  }
  const mixItems = Array.from(mixMap.entries()); // [code, count]

  // Velo range
  let veloTop: number | null = null;
  let veloLow: number | null = null;
  for (const p of revealedPitches) {
    if (veloTop === null || p.velocity_mph > veloTop) veloTop = p.velocity_mph;
    if (veloLow === null || p.velocity_mph < veloLow) veloLow = p.velocity_mph;
  }

  // ── Novice ───────────────────────────────────────────────────────────────
  if (level === 'novice') {
    // detect if any "in play" pitch has been revealed
    const hasInPlay = revealedPitches.some(p => getResultCategory(p.result) === 'inplay');

    return (
      <View style={styles.railCol}>
        <Text style={styles.colLabel}>WHAT THE DOTS MEAN</Text>
        {/* Strike */}
        <View style={styles.railRow}>
          <View style={[styles.railDotFilled, { backgroundColor: COLORS.resultStrike }]} />
          <Text style={styles.railLegendText}> Strike</Text>
        </View>
        {/* Ball — hollow ring */}
        <View style={styles.railRow}>
          <View style={[styles.railDotRing, { borderColor: COLORS.resultBall }]} />
          <Text style={styles.railLegendText}> Ball</Text>
        </View>
        {/* Foul */}
        <View style={styles.railRow}>
          <View style={[styles.railDotFilled, { backgroundColor: COLORS.resultFoul }]} />
          <Text style={styles.railLegendText}> Foul</Text>
        </View>
        {/* In play — only once revealed */}
        {hasInPlay && (
          <View style={styles.railRow}>
            <View style={[styles.railDotFilled, { backgroundColor: COLORS.resultInplay }]} />
            <Text style={styles.railLegendText}> In play</Text>
          </View>
        )}
        {/* Foul rule note */}
        <Text style={styles.railMutedNote}>Foul = strike, unless already 2</Text>
      </View>
    );
  }

  // ── Learning ─────────────────────────────────────────────────────────────
  if (level === 'learning') {
    return (
      <View style={styles.railCol}>
        {/* Section 1: PITCH MIX */}
        <Text style={styles.colLabel}>PITCH MIX</Text>
        {mixItems.length === 0 ? (
          <Text style={styles.emptyHint}>—</Text>
        ) : (
          mixItems.map(([code, count]) => (
            <View key={code} style={styles.railRow}>
              <Text
                style={[styles.railName, { color: getPitchTypeCodeColor(code) }]}
                numberOfLines={1}
              >
                {pitchName(code)}
              </Text>
              <Text style={styles.railMutedValue}> ×{count}</Text>
            </View>
          ))
        )}
        {/* Section 2: SPEED */}
        {veloTop !== null && (
          <>
            <Text style={[styles.colLabel, { marginTop: 6 }]}>SPEED</Text>
            <Text style={styles.railStatLine}>
              {Math.round(veloTop)}–{Math.round(veloLow!)} mph
            </Text>
          </>
        )}
      </View>
    );
  }

  // ── Regular ──────────────────────────────────────────────────────────────
  if (level === 'regular') {
    return (
      <View style={styles.railCol}>
        {/* Section 1: PITCH MIX with bars */}
        <Text style={styles.colLabel}>PITCH MIX</Text>
        {mixItems.length === 0 ? (
          <Text style={styles.emptyHint}>—</Text>
        ) : (
          mixItems.map(([code, count]) => (
            <PitchMixRow key={code} code={code} count={count} total={revealedCount} />
          ))
        )}
        {/* Section 2: VELO */}
        {veloTop !== null && (
          <>
            <Text style={[styles.colLabel, { marginTop: 6 }]}>VELO</Text>
            <Text style={styles.railStatLine}>
              {Math.round(veloTop)}–{Math.round(veloLow!)} mph
            </Text>
          </>
        )}
      </View>
    );
  }

  // ── Expert ───────────────────────────────────────────────────────────────
  // Section 1: ARSENAL — per type: code, pct, avg velo
  const arsenalItems = mixItems.map(([code, count]) => {
    const pitches = revealedPitches.filter(p => getPitchTypeCode(p.type) === code);
    const avgVelo = pitches.reduce((s, p) => s + p.velocity_mph, 0) / pitches.length;
    const pct = revealedCount > 0 ? Math.round((count / revealedCount) * 100) : 0;
    return { code, pct, avgVelo };
  });

  // Section 3: 2-STRIKE FOULS
  // fouls thrown when count already had 2 strikes
  let twoStrikeFouls = 0;
  for (const p of revealedPitches) {
    // count_after_pitch reflects after; we need strikes BEFORE this pitch
    // = previous pitch's count_after_pitch.strikes, or 0 for pitch 1
    const idx = revealedPitches.indexOf(p);
    const strikesBefore = idx === 0 ? 0 : revealedPitches[idx - 1].count_after_pitch.strikes;
    if (strikesBefore === 2 && getResultCategory(p.result) === 'foul') {
      twoStrikeFouls++;
    }
  }

  return (
    <View style={styles.railCol}>
      {/* Section 1: ARSENAL */}
      <Text style={styles.colLabel}>ARSENAL</Text>
      {arsenalItems.length === 0 ? (
        <Text style={styles.emptyHint}>—</Text>
      ) : (
        <>
          <View style={styles.railRow}>
            <Text style={[styles.arsHead, { width: 20 }]}> </Text>
            <Text style={[styles.arsHead, { width: 26, textAlign: 'right' }]}>USE</Text>
            <Text style={[styles.arsHead, { width: 30, textAlign: 'right' }]}>AVG</Text>
          </View>
          {arsenalItems.map(({ code, pct, avgVelo }) => (
            <View key={code} style={styles.railRow}>
              <Text style={[styles.arsCell, { width: 20, fontWeight: '700', color: getPitchTypeCodeColor(code) }]}>{code}</Text>
              <Text style={[styles.arsCell, { width: 26, textAlign: 'right' }]}>{pct}%</Text>
              <Text style={[styles.arsCell, { width: 30, textAlign: 'right', color: COLORS.muted }]}>{avgVelo.toFixed(1)}</Text>
            </View>
          ))}
        </>
      )}
      {/* Section 2: VELO */}
      {veloTop !== null && (
        <>
          <Text style={[styles.colLabel, { marginTop: 6 }]}>VELO</Text>
          <Text style={styles.railStatLine}>
            {veloTop.toFixed(1)} / {veloLow!.toFixed(1)}
          </Text>
        </>
      )}
      {/* Section 3: 2-STRIKE FOULS */}
      <Text style={[styles.colLabel, { marginTop: 6 }]}>2-STRIKE FOULS</Text>
      <Text style={styles.railStatLine}>{twoStrikeFouls}</Text>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HeroCard({
  atBat,
  revealedPitches,
  revealedCount,
  isComplete,
  currentBalls,
  currentStrikes,
  finalPitchNumber,
  evidenceHighlight,
  selectedPitchNumber,
  onPitchPress,
  onAgentPanelOpen: _onAgentPanelOpen,
  agentPanelOpen,
  onAgentPanelClose,
  selectedLevel,
}: Props) {
  // measured height of row1 + divider, used to position agent panel overlay
  const [row1Height, setRow1Height] = useState(0);
  // ── Derived values ────────────────────────────────────────────────────────
  const latestPitch = revealedPitches.length > 0
    ? revealedPitches[revealedPitches.length - 1]
    : null;

  const revealedOutcome = isComplete ? classifyBattedBall(atBat.outcome) : null;

  // Outcome pill color
  const outcomeIsMiss = revealedOutcome === 'out';
  const outcomePillColor = outcomeIsMiss ? COLORS.resultStrike : COLORS.teal;

  // ── Render ─────────────────────────────────────────────────────────────────
  const avg = atBat.batter_stats?.avg;
  const era = atBat.pitcher_stats?.era;

  return (
    <View style={styles.card}>
      {/* ── Row 1: Matchup ───────────────────────────────────────────────── */}
      <View
        style={styles.row1}
        onLayout={e => setRow1Height(e.nativeEvent.layout.height + 1 /* +1px divider */)}
      >
        {/* Left: batter */}
        <View style={styles.playerCol}>
          <Text style={styles.playerRole}>Batting</Text>
          <Text style={styles.playerName}>{lastName(atBat.batter)}</Text>
          {avg != null && (
            <Text style={styles.playerStat}>.{formatAvg(avg).replace('.', '')} AVG</Text>
          )}
        </View>

        {/* Center: count or outcome */}
        <View style={styles.countCol}>
          {isComplete ? (
            <>
              <View style={[styles.outcomePill, { backgroundColor: outcomePillColor + '33', borderColor: outcomePillColor }]}>
                <Text style={[styles.outcomePillText, { color: outcomePillColor }]}>
                  {atBat.outcome}
                </Text>
              </View>
              <Text style={styles.countSub}>Final</Text>
            </>
          ) : (
            <>
              <Text style={styles.countText}>
                {revealedCount === 0 ? '0–0' : `${currentBalls}–${currentStrikes}`}
              </Text>
              <CountDots
                balls={revealedCount === 0 ? 0 : currentBalls}
                strikes={revealedCount === 0 ? 0 : currentStrikes}
              />
              <Text style={styles.countSub}>{revealedCount === 0 ? 'Ready' : ''}</Text>
            </>
          )}
        </View>

        {/* Right: pitcher */}
        <View style={[styles.playerCol, styles.playerColRight]}>
          <Text style={styles.playerRole}>Pitching</Text>
          <Text style={styles.playerName}>{lastName(atBat.pitcher)}</Text>
          {era != null && (
            <Text style={styles.playerStat}>{era.toFixed(2)} ERA</Text>
          )}
        </View>
      </View>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Row 2: Left rail | Zone | Right rail ────────────────────────── */}
      <View style={styles.row2}>
        {/* Left rail */}
        <LeftRail
          level={selectedLevel}
          revealedPitches={revealedPitches}
          onPitchPress={onPitchPress}
        />

        {/* Center: Strike zone */}
        <View style={styles.zoneCol}>
          <StrikeZone
            pitches={revealedPitches}
            selectedPitchNumber={selectedPitchNumber}
            onPitchPress={onPitchPress}
            revealedOutcome={revealedOutcome}
            finalPitchNumber={finalPitchNumber}
            evidenceHighlight={evidenceHighlight}
          />
        </View>

        {/* Right rail */}
        <RightRail
          level={selectedLevel}
          revealedPitches={revealedPitches}
          revealedCount={revealedCount}
        />
      </View>

      {/* ── Row 3: Latest pitch line ─────────────────────────────────────── */}
      <View style={styles.row3}>
        {revealedCount === 0 ? (
          <Text style={styles.row3Waiting}>Waiting for the first pitch</Text>
        ) : latestPitch != null ? (
          <>
            {/* Result pill */}
            <View style={[
              styles.resultPill,
              { backgroundColor: getResultColor(latestPitch.result) + '26' },
            ]}>
              <Text style={[styles.resultPillText, { color: getResultColor(latestPitch.result) }]}>
                {(() => {
                  const cat = getResultCategory(latestPitch.result);
                  if (cat === 'strike') return 'Strike';
                  if (cat === 'foul')   return 'Foul';
                  if (cat === 'ball')   return 'Ball';
                  if (cat === 'inplay') return 'In play';
                  return latestPitch.result;
                })()}
              </Text>
            </View>
            {/* Pitch detail */}
            <Text style={styles.row3Detail} numberOfLines={1}>
              {`Pitch ${latestPitch.number} · ${latestPitch.type} · ${latestPitch.velocity_mph.toFixed(1)} mph`}
            </Text>
          </>
        ) : null}
      </View>

      {/* ── Agent panel overlay (D) ──────────────────────────────────────── */}
      {agentPanelOpen && (
        <View style={[styles.agentPanelWrapper, row1Height > 0 ? { top: row1Height + 10 /* marginBottom */ } : {}]}>
          <AgentPanel
            revealedCount={revealedCount}
            isComplete={isComplete}
            selectedLevel={selectedLevel}
            onClose={onAgentPanelClose}
          />
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },

  // ── Row 1 ────────────────────────────────────────────────────────────────────
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerCol: {
    flex: 1,
  },
  playerColRight: {
    alignItems: 'flex-end',
  },
  playerRole: {
    fontSize: 10,
    color: COLORS.label,
    marginBottom: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  playerStat: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 1,
  },
  countCol: {
    alignItems: 'center',
    minWidth: 80,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 38,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 44,
  },
  countSub: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSpacer: {
    width: 6,
  },
  outcomePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  outcomePillText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Divider ───────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 10,
  },

  // ── Row 2 ─────────────────────────────────────────────────────────────────────
  row2: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  colLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  // ── Rail columns (left & right, 76px each) ─────────────────────────────────
  railCol: {
    width: 76,
  },

  // Rail row: single line, tight layout
  railRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,           // matches lineHeight 16 — one line per row
    marginBottom: 0,
    overflow: 'hidden',
  },
  railNum: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.label,
    width: 13,
    textAlign: 'right',
  },
  // pitch name (novice / learning): compact, truncates if needed
  railName: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 3,
  },
  // type code (regular / expert)
  railCode: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    width: 20,
    marginLeft: 3,
    textAlign: 'center',
  },
  // velocity (regular / expert)
  railVelo: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
    flex: 1,
    textAlign: 'right',
  },
  // result letter
  railLetter: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    width: 10,
    textAlign: 'center',
  },
  // 8px dot — filled
  railDotFilled: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 2,
  },
  // 8px dot — hollow ring (ball)
  railDotRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    marginLeft: 2,
  },
  // Right-rail: legend text (novice "WHAT THE DOTS MEAN")
  railLegendText: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.text,
  },
  // Right-rail: muted footnote (novice rule note)
  railMutedNote: {
    fontSize: 9,
    lineHeight: 13,
    color: COLORS.muted,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  // Right-rail: muted value inline (learning ×count, expert pct·avg)
  railMutedValue: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
    flexShrink: 1,
  },
  // Right-rail: single stat line (speed, velo, 2-strike fouls count)
  railStatLine: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
  },
    arsHead: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.label,
    lineHeight: 16,
  },
  arsCell: {
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.text,
  },

  // ── Zone column ───────────────────────────────────────────────────────────────
  zoneCol: {
    flex: 1,
    alignItems: 'center',
  },

  // ── Pitch-mix row (regular level, right rail) ─────────────────────────────────
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 1,
  },
  mixCode: {
    fontSize: 11,
    fontWeight: '700',
    width: 22,
  },
  mixCount: {
    fontSize: 11,
    color: COLORS.muted,
    width: 14,
    textAlign: 'right',
  },
  mixBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.divider,
    borderRadius: 2,
    overflow: 'hidden',
  },
  mixBarFill: {
    height: 3,
    borderRadius: 2,
  },

  emptyHint: {
    fontSize: 10,
    color: COLORS.muted,
    lineHeight: 15,
  },

  // ── Row 3 ─────────────────────────────────────────────────────────────────────
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  row3Waiting: {
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
    textAlign: 'center',
  },
  resultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  resultPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  row3Detail: {
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
  },

  // ── Agent panel ───────────────────────────────────────────────────────────────
  agentPanelWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    // top is set dynamically via row1Height; fallback keeps it reasonable
    top: 83,
    bottom: 0,
    borderRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  agentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9,20,46,0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    padding: 14,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  agentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  agentClose: {
    fontSize: 14,
    color: COLORS.muted,
  },
  agentStepsScroll: {
    flex: 1,
  },
  agentStep: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  // Left column: numbered badge + vertical connecting line
  agentStepLeft: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  agentNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  agentNumText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  agentConnLine: {
    width: 1,
    flex: 1,
    minHeight: 10,
    backgroundColor: COLORS.divider,
    marginTop: 3,
  },
  agentStepContent: {
    flex: 1,
    marginBottom: 2,
  },
  agentStepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  agentStepLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  agentStepDur: {
    fontSize: 11,
    color: COLORS.muted,
  },
  agentVerified: {
    fontSize: 11,
    fontWeight: '600',
  },
  agentStepSub: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  agentFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 8,
    paddingBottom: 4,
  },
  agentAntiSpoiler: {
    fontSize: 11,
    color: COLORS.text,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  agentRunLine: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4,
  },
  agentPartial: {
    fontSize: 10,
    color: COLORS.label,
  },
});
