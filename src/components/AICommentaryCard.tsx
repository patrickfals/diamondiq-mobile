import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../theme/colors';
import {
  KnowledgeLevel,
  TraceSummary,
  getCommentary,
  getEvidencePitches,
  getTrace,
  isHumanEdited,
} from '../data/commentaryData';

// ─── Types ────────────────────────────────────────────────────────────────────

type CardMode = 'commentary' | 'workflow';

interface Props {
  revealedCount: number;
  selectedLevel: KnowledgeLevel;
  onLevelChange: (level: KnowledgeLevel) => void;
  /** Called when evidence highlight state changes — parent mirrors to StrikeZone */
  onEvidenceHighlight: (pitches: number[] | null) => void;
  /** Current evidence highlight state (lifted to parent so clear on nav works) */
  evidenceActive: boolean;
  /**
   * Called when the user opens "How It Was Made" so the parent can pause
   * the replay. Without this, the 3s auto-advance changes revealedCount and
   * resets the card back to commentary mode mid-animation.
   */
  onOpenWorkflow: () => void;
}

// ─── Knowledge level metadata ─────────────────────────────────────────────────

const LEVELS: { key: KnowledgeLevel; label: string; description: string }[] = [
  { key: 'novice',   label: 'Novice',   description: "I don't know baseball" },
  { key: 'learning', label: 'Learning', description: 'I somewhat know the rules' },
  { key: 'regular',  label: 'Regular',  description: 'I watch a good amount' },
  { key: 'expert',   label: 'Expert',   description: "I'm a scout / super fan" },
];

// ─── Workflow node ────────────────────────────────────────────────────────────

type NodeState = 'idle' | 'active' | 'complete';

function WorkflowNode({ label, sublabel, state }: {
  label: string;
  sublabel: string;
  state: NodeState;
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 700, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 700, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(state === 'complete' ? 1 : 0);
    }
  }, [state, glowAnim]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      state === 'complete' ? COLORS.teal : '#1e3060',
      state === 'complete' ? COLORS.teal : COLORS.accent,
    ],
  });

  const bgColor =
    state === 'complete' ? COLORS.tealDim :
    state === 'active'   ? COLORS.accentDim :
    'rgba(14,30,62,0.6)';

  const labelColor =
    state === 'complete' ? COLORS.teal :
    state === 'active'   ? COLORS.accent :
    COLORS.muted;

  return (
    <Animated.View style={[styles.wfNode, { borderColor, backgroundColor: bgColor }]}>
      {state === 'complete' && <Text style={styles.wfCheckmark}>✓</Text>}
      <Text style={[styles.wfNodeLabel, { color: labelColor }]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.wfNodeSub} numberOfLines={2}>{sublabel}</Text>
    </Animated.View>
  );
}

function NodeConnector({ active }: { active: boolean }) {
  return <View style={[styles.connector, active && styles.connectorActive]} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AICommentaryCard({
  revealedCount,
  selectedLevel,
  onLevelChange,
  onEvidenceHighlight,
  evidenceActive,
  onOpenWorkflow,
}: Props) {
  const [mode, setMode] = useState<CardMode>('commentary');
  const [levelSheetOpen, setLevelSheetOpen] = useState(false);
  // 0 = not started; 1,2,3 = nodes revealing in order
  const [wfStep, setWfStep] = useState<0 | 1 | 2 | 3>(0);
  const wfTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timers on unmount
  useEffect(() => () => {
    if (wfTimerRef.current !== null) clearTimeout(wfTimerRef.current);
  }, []);

  // Reset to commentary when position changes
  useEffect(() => {
    setMode('commentary');
    setWfStep(0);
    if (wfTimerRef.current !== null) {
      clearTimeout(wfTimerRef.current);
      wfTimerRef.current = null;
    }
  }, [revealedCount]);

  function runWorkflowAnimation() {
    setWfStep(0);
    if (wfTimerRef.current !== null) clearTimeout(wfTimerRef.current);
    wfTimerRef.current = setTimeout(() => {
      setWfStep(1);
      wfTimerRef.current = setTimeout(() => {
        setWfStep(2);
        wfTimerRef.current = setTimeout(() => {
          setWfStep(3);
        }, 1200);
      }, 1200);
    }, 300);
  }

  function handleShowWorkflow() {
    // FIX 1: pause the replay before switching modes so the 3s auto-advance
    // cannot fire while the workflow animation is running.
    onOpenWorkflow();
    setMode('workflow');
    runWorkflowAnimation();
  }

  function handleWorkflowBack() {
    setMode('commentary');
    setWfStep(0);
    if (wfTimerRef.current !== null) {
      clearTimeout(wfTimerRef.current);
      wfTimerRef.current = null;
    }
  }

  function handleCommentaryToggleEvidence() {
    if (evidenceActive) {
      onEvidenceHighlight(null);
    } else {
      const pitches = getEvidencePitches(revealedCount);
      onEvidenceHighlight(pitches.length > 0 ? pitches : null);
    }
  }

  // ── Commentary mode ──────────────────────────────────────────────────────────
  if (mode === 'commentary') {
    const commentaryText = getCommentary(revealedCount, selectedLevel);
    const humanEdited = isHumanEdited(revealedCount, selectedLevel);
    const currentLevelMeta = LEVELS.find(l => l.key === selectedLevel);

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.cardTitle}>AI COMMENTARY</Text>
          </View>
          <TouchableOpacity
            style={styles.levelPill}
            onPress={() => setLevelSheetOpen(true)}
            accessibilityLabel="Change knowledge level"
          >
            <Text style={styles.levelPillText}>{currentLevelMeta?.label ?? selectedLevel}</Text>
            <Text style={styles.levelPillChevron}> ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.bodyScrollContent}>
          {revealedCount === 0 ? (
            <Text style={styles.placeholderText}>
              Commentary starts after the first pitch.
            </Text>
          ) : commentaryText !== null ? (
            <>
              <TouchableOpacity
                onPress={handleCommentaryToggleEvidence}
                activeOpacity={0.8}
                accessibilityLabel={
                  evidenceActive
                    ? 'Clear evidence highlight'
                    : 'Highlight evidence pitches on strike zone'
                }
              >
                <Text style={[styles.commentaryText, evidenceActive && styles.commentaryActive]}>
                  {commentaryText}
                </Text>
              </TouchableOpacity>
              {humanEdited && (
                <Text style={styles.humanReviewedTag}>Human-reviewed</Text>
              )}
              {evidenceActive && (
                  <Text style={styles.evidenceHint}>Tap again to clear highlight</Text>
                )}
              </>
            ) : (
              <Text style={styles.placeholderText}>
                Commentary unavailable for this pitch.
              </Text>
            )}
          </View>

        {/* Footer — only shown when a valid pitch is revealed */}
        {revealedCount > 0 && (
          <TouchableOpacity
            style={styles.footerAction}
            onPress={handleShowWorkflow}
            accessibilityLabel="How it was made"
          >
            <Text style={styles.footerActionText}>✧ How It Was Made</Text>
          </TouchableOpacity>
        )}

        {/* Knowledge level picker modal */}
        <Modal
          visible={levelSheetOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setLevelSheetOpen(false)}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            onPress={() => setLevelSheetOpen(false)}
            activeOpacity={1}
          >
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>KNOWLEDGE LEVEL</Text>
              {LEVELS.map(({ key, label, description }) => {
                const active = key === selectedLevel;
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.sheetRow}
                    onPress={() => { onLevelChange(key); setLevelSheetOpen(false); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.sheetRowLabel, active && styles.sheetRowLabelActive]}>
                      {label}
                    </Text>
                    <Text style={styles.sheetRowDesc}>{description}</Text>
                    {active && <Text style={styles.sheetCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // ── Workflow mode ────────────────────────────────────────────────────────────
  const trace: TraceSummary | null = getTrace(revealedCount);

  const nodeStateA:    NodeState = wfStep === 0 ? 'idle' : wfStep === 1 ? 'active' : 'complete';
  const nodeStateSnap: NodeState = wfStep < 2   ? 'idle' : wfStep === 2 ? 'active' : 'complete';
  const nodeStateB:    NodeState = wfStep < 3   ? 'idle' : 'complete';

  const sublabelA = trace?.stageA_duration_s != null
    ? `${trace.stageA_duration_s}s`
    : 'Retrieving pitch snapshot';

  const sublabelSnap = trace?.snapshotRedeemed != null
    ? `pitches 1–${trace.snapshotRedeemed.revealed_count} · server-reported`
    : 'Snapshot token redeemed';

  const sublabelB = trace?.stageB_duration_s != null
    ? `${trace.stageB_duration_s}s · 4 levels`
    : '4 knowledge levels';

  const shortRunId    = trace?.run_id ? trace.run_id.slice(0, 8) : null;
  const totalElapsed  = trace?.total_elapsed_s ?? null;
  const captureNote   = trace?.capture_notes[0] ?? null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleWorkflowBack}
          accessibilityLabel="Back to commentary"
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.cardTitle}>HOW IT WAS MADE</Text>
        <TouchableOpacity
          style={styles.replayPill}
          onPress={runWorkflowAnimation}
          accessibilityLabel="Replay workflow animation"
        >
          <Text style={styles.replayPillText}>Replay</Text>
        </TouchableOpacity>
      </View>

      {trace === null ? (
        <View style={styles.noTraceContainer}>
          <Text style={styles.noTraceText}>No trace for this position.</Text>
        </View>
      ) : (
        <View style={styles.wfScrollContent}>
          {/* Three nodes */}
          <View style={styles.wfRow}>
            <WorkflowNode
              label="Analyst"
              sublabel={sublabelA}
              state={nodeStateA}
            />
            <NodeConnector active={wfStep >= 2} />
            <WorkflowNode
              label="Pitch Scout"
              sublabel={sublabelSnap}
              state={nodeStateSnap}
            />
            <NodeConnector active={wfStep >= 3} />
            <WorkflowNode
              label="Fan Experience"
              sublabel={sublabelB}
              state={nodeStateB}
            />
          </View>

          {/* Meta — shown after animation completes */}
          {wfStep === 3 && (
            <View style={styles.wfMeta}>
              {shortRunId !== null && (
                <Text style={styles.wfMetaRow}>
                  <Text style={styles.wfMetaLabel}>Run  </Text>
                  <Text style={styles.wfMetaValue}>{shortRunId}…</Text>
                </Text>
              )}
              {totalElapsed !== null && (
                <Text style={styles.wfMetaRow}>
                  <Text style={styles.wfMetaLabel}>Total  </Text>
                  <Text style={styles.wfMetaValue}>{totalElapsed}s</Text>
                </Text>
              )}
              {!trace.trace_complete && (
                <Text style={styles.wfPartialTrace}>
                  Partial trace — steps inside IBM aren't observable from outside.
                </Text>
              )}
            </View>
          )}

          {/* Commentary reveal on completion */}
          {wfStep === 3 && (
            <View style={styles.wfCommentaryReveal}>
              <Text style={styles.wfCommentaryLabel}>
                COMMENTARY · {selectedLevel.toUpperCase()}
              </Text>
              <Text style={styles.wfCommentaryText}>
                {getCommentary(revealedCount, selectedLevel) ??
                  'Commentary unavailable for this pitch.'}
              </Text>
            </View>
          )}

          {/* Capture note */}
          {captureNote !== null && (
            <Text style={styles.captureNote}>{captureNote}</Text>
          )}
          <Text style={styles.illustrativeFooter}>
            Replay of recorded execution evidence
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 160,
  },

  // Shared header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkle: {
    fontSize: 12,
    color: COLORS.accent,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  // Level pill
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 28,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  levelPillChevron: {
    fontSize: 10,
    color: COLORS.accent,
  },

  // Body content area
  bodyScrollContent: { padding: 14, paddingBottom: 4 },

  // Commentary
  commentaryText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    fontStyle: 'italic',
    color: COLORS.text,
  },
  commentaryActive: { color: COLORS.accent },
  placeholderText: {
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  humanReviewedTag: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 8,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  evidenceHint: {
    fontSize: 10,
    color: COLORS.accent,
    marginTop: 4,
    opacity: 0.8,
  },

  // Footer action
  footerAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },

  // Level picker modal
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.muted,
    letterSpacing: 1.4,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    minHeight: 44,
  },
  sheetRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    width: 90,
  },
  sheetRowLabelActive: { color: COLORS.accent },
  sheetRowDesc: { flex: 1, fontSize: 13, color: COLORS.muted },
  sheetCheck: { fontSize: 15, color: COLORS.accent, marginLeft: 8 },

  // Workflow
  backBtn: {
    minWidth: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: COLORS.muted, lineHeight: 26 },
  replayPill: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 28,
  },
  replayPillText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  noTraceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noTraceText: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
  wfScrollContent: { padding: 12, paddingBottom: 10 },
  wfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  wfNode: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 7,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wfCheckmark: {
    fontSize: 11,
    color: COLORS.teal,
    fontWeight: '700',
    marginBottom: 2,
  },
  wfNodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  wfNodeSub: {
    fontSize: 9,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 13,
  },
  connector: {
    width: 12,
    height: 1.5,
    backgroundColor: COLORS.borderSubtle,
    flexShrink: 0,
  },
  connectorActive: { backgroundColor: COLORS.teal },
  wfMeta: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 10,
    marginBottom: 8,
  },
  wfMetaRow: { fontSize: 11, color: COLORS.text, marginBottom: 3 },
  wfMetaLabel: { color: COLORS.muted, fontWeight: '600' },
  wfMetaValue: { color: COLORS.text, fontWeight: '500' },
  wfPartialTrace: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  wfCommentaryReveal: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 10,
    marginBottom: 8,
  },
  wfCommentaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  wfCommentaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  captureNote: {
    fontSize: 10,
    color: COLORS.muted,
    fontStyle: 'italic',
    lineHeight: 14,
    marginBottom: 6,
  },
  illustrativeFooter: {
    fontSize: 9,
    color: COLORS.subtle,
    textAlign: 'center',
    letterSpacing: 0.8,
    paddingBottom: 4,
  },
});
