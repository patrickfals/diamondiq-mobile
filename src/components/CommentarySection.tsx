import { useRef, useEffect, type ElementRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Pressable,
} from 'react-native';
import { COLORS } from '../theme/colors';
import {
  KnowledgeLevel,
  getCommentary,
  getEvidencePitches,
  isHumanEdited,
} from '../data/commentaryData';

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS: { key: KnowledgeLevel; label: string }[] = [
  { key: 'novice',   label: 'Novice' },
  { key: 'learning', label: 'Learning' },
  { key: 'regular',  label: 'Regular' },
  { key: 'expert',   label: 'Expert' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  revealedCount: number;
  selectedLevel: KnowledgeLevel;
  onLevelChange: (level: KnowledgeLevel) => void;
  onEvidenceHighlight: (pitches: number[] | null) => void;
  evidenceActive: boolean;
  onDetailsPress: () => void;   // opens agent panel (counts as hold-start)
  onHoldStart: () => void;      // user starts reading — pause if playing
  onHoldEnd: () => void;        // user stops reading — resume if was playing
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommentarySection({
  revealedCount,
  selectedLevel,
  onLevelChange,
  onEvidenceHighlight,
  evidenceActive,
  onDetailsPress,
  onHoldStart,
  onHoldEnd,
}: Props) {
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);

  // On pitch change or level change: scroll to top then fade in
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [revealedCount, selectedLevel, fadeAnim]);

  const commentaryText = getCommentary(revealedCount, selectedLevel);
  const humanEdited    = isHumanEdited(revealedCount, selectedLevel);

  function handleEvidenceTap() {
    if (evidenceActive) {
      onEvidenceHighlight(null);
    } else {
      const pitches = getEvidencePitches(revealedCount);
      onEvidenceHighlight(pitches.length > 0 ? pitches : null);
    }
  }

  function handleLevelChange(level: KnowledgeLevel) {
    onLevelChange(level);
  }

  return (
    <View style={styles.container}>
      {/* ── Underline tabs (fixed) ──────────────────────────────────────── */}
      <View style={styles.tabs}>
        {LEVELS.map(({ key, label }) => {
          const active = key === selectedLevel;
          return (
            <Pressable
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => handleLevelChange(key)}
              onPressIn={onHoldStart}
              onPressOut={onHoldEnd}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
        onScrollBeginDrag={onHoldStart}
        onMomentumScrollEnd={onHoldEnd}
        onScrollEndDrag={onHoldEnd}
        keyboardShouldPersistTaps="handled"
      >
        {revealedCount === 0 ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.howLabel}>HOW IT WORKS</Text>
            <Text style={styles.howText}>
              Press play to relive this at-bat pitch by pitch. After each pitch,
              three IBM watsonx agents explain what happened at your level, using
              only the pitches thrown so far. No spoilers.
            </Text>
          </Animated.View>
        ) : commentaryText !== null ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.commentaryText}>{commentaryText}</Text>

            <Text style={styles.afterLine}>
              {`Covers pitches 1-${revealedCount}`}
              {humanEdited ? ' · Edited by a human' : ''}
            </Text>


          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.commentaryText}>
              Commentary unavailable for this pitch.
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Agent strip — fixed at bottom (only when pitch revealed) ───── */}
      {revealedCount > 0 && (
        <View style={styles.agentStrip}>
          <View style={styles.agentDots}>
            <View style={[styles.agentDot, { backgroundColor: COLORS.accent }]} />
            <View style={[styles.agentDot, { backgroundColor: COLORS.teal }]} />
            <View style={[styles.agentDot, { backgroundColor: COLORS.violet }]} />
          </View>
          <Text style={styles.agentName}>Made by 3 IBM agents</Text>
          <View style={styles.agentSpacer} />
          <TouchableOpacity
            onPress={onDetailsPress}
            style={styles.detailsBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.detailsBtnText}>How it was made ›</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // ── Tabs (fixed) ──────────────────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },

  // ── Scrollable body ───────────────────────────────────────────────────────────
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 14,
    paddingBottom: 16,
  },
  howLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  howText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.body,
  },
  commentaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.body,
  },
  afterLine: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 10,
  },
  evidenceLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  evidenceLinkText: {
    fontSize: 11,
    color: COLORS.label,
    textDecorationLine: 'underline',
  },
  evidenceActiveText: {
    fontSize: 11,
    color: COLORS.accent,
  },

  // ── Agent strip (fixed bottom) ─────────────────────────────────────────────
  agentStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inset,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  agentIcon: {
    fontSize: 11,
  },
  agentName: {
    fontSize: 11,
    color: COLORS.muted,
  },
    agentDots: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 6,
  },
  agentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  agentSep: {
    fontSize: 11,
    color: COLORS.label,
    marginHorizontal: 2,
  },
  agentSpacer: {
    flex: 1,
  },
  detailsBtn: {
    paddingLeft: 4,
  },
  detailsBtnText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
});
