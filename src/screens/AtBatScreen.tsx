import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AtBat, Pitch } from '../types/atbat';
import StrikeZoneCard from '../components/StrikeZoneCard';
import PitchDetailOverlay from '../components/PitchDetailOverlay';
import MatchupBug from '../components/MatchupBug';
import AICommentaryCard from '../components/AICommentaryCard';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { COLORS } from '../theme/colors';
import { classifyBattedBall } from '../utils/classifyBattedBall';
import { getPitchTypeColor } from '../utils/pitchTypeColors';
import { formatPitchResult } from '../utils/formatPitchResult';
import { KnowledgeLevel } from '../data/commentaryData';

const API_URL = 'https://diamondiq-api.onrender.com/games/777245/at-bats/8';

// Stable empty array — avoids re-triggering the replay reset effect
const EMPTY_PITCHES: Pitch[] = [];

type Status = 'loading' | 'success' | 'error';

export default function AtBatScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [atBat, setAtBat] = useState<AtBat | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);

  // Knowledge level persists across rewind / restart / replay
  const [selectedLevel, setSelectedLevel] = useState<KnowledgeLevel>('learning');

  // Evidence highlight: lifted here so StrikeZoneCard and AICommentaryCard share one source
  const [evidencePitches, setEvidencePitches] = useState<number[] | null>(null);

  const replay = useReplayEngine(atBat?.pitches ?? EMPTY_PITCHES);

  // ── Clear evidence on replay navigation ──────────────────────────────────────
  useEffect(() => {
    setEvidencePitches(null);
  }, [replay.state.revealedCount]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const finalPitchNumber: number | null = useMemo(() => {
    const pitches = atBat?.pitches;
    if (!pitches || pitches.length === 0) return null;
    return pitches[pitches.length - 1].number;
  }, [atBat]);

  const revealedOutcome = replay.isComplete && atBat
    ? classifyBattedBall(atBat.outcome)
    : null;

  const finalOutcomeLabel: string | null = replay.isComplete && atBat
    ? atBat.outcome.toUpperCase()
    : null;

  const currentPitchResult: string | null = useMemo(() => {
    const len = replay.revealedPitches.length;
    if (len === 0) return null;
    return formatPitchResult(replay.revealedPitches[len - 1].result);
  }, [replay.revealedPitches]);

  const currentPitchType: string | null = useMemo(() => {
    const len = replay.revealedPitches.length;
    if (len === 0) return null;
    return replay.revealedPitches[len - 1].type;
  }, [replay.revealedPitches]);

  // Legend: pitch types seen so far, in order of first appearance
  // Anti-spoiler: derived from revealedPitches only
  const legendItems = useMemo(() => {
    const seen: { type: string; color: string; count: number }[] = [];
    const typeIndex = new Map<string, number>();
    for (const pitch of replay.revealedPitches) {
      const idx = typeIndex.get(pitch.type);
      if (idx === undefined) {
        typeIndex.set(pitch.type, seen.length);
        seen.push({ type: pitch.type, color: getPitchTypeColor(pitch.type), count: 1 });
      } else {
        seen[idx].count += 1;
      }
    }
    return seen;
  }, [replay.revealedPitches]);

  // Close overlay if the user rewinds past the selected pitch
  useEffect(() => {
    if (selectedPitch !== null && selectedPitch.number > replay.state.revealedCount) {
      setSelectedPitch(null);
    }
  }, [replay.state.revealedCount, selectedPitch]);

  // ── Data loading ─────────────────────────────────────────────────────────────

  async function fetchAtBat() {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: AtBat = await res.json();
      setAtBat(data);
      setStatus('success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  useEffect(() => { fetchAtBat(); }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handlePitchPress(pitch: Pitch) {
    if (pitch.number > replay.state.revealedCount) return;
    replay.pause();
    setSelectedPitch(pitch);
  }

  function handleOverlayClose() {
    setSelectedPitch(null);
  }

  const handleEvidenceHighlight = useCallback((pitches: number[] | null) => {
    setEvidencePitches(pitches);
  }, []);

  // onOpenWorkflow: pauses the replay so the 3s auto-advance doesn't fire
  // while the workflow animation is running and kick the card back to commentary.
  const handleOpenWorkflow = useCallback(() => {
    replay.pause();
  }, [replay]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading at-bat data…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (status === 'error' || !atBat) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="light" />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load at-bat</Text>
        <Text style={styles.errorMsg}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchAtBat}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {/* Scrollable content: header, matchup, strike zone, commentary */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── A: Header row ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Text style={styles.wordmark}>DiamondIQ</Text>
            <View style={styles.replayBadge}>
              <Text style={styles.replayBadgeText}>GAME REPLAY</Text>
            </View>
          </View>
        </View>

        {/* ── B: Matchup bug ─────────────────────────────────────────────────── */}
        <MatchupBug
          atBat={atBat}
          currentBalls={replay.currentBalls}
          currentStrikes={replay.currentStrikes}
          revealedCount={replay.state.revealedCount}
          isComplete={replay.isComplete}
          finalOutcomeLabel={finalOutcomeLabel}
          onRestart={replay.restart}
        />

        {/* ── C: Strike zone card ────────────────────────────────────────────── */}
        <StrikeZoneCard
          pitches={replay.revealedPitches}
          selectedPitchNumber={selectedPitch?.number ?? null}
          onPitchPress={handlePitchPress}
          revealedOutcome={revealedOutcome}
          finalPitchNumber={finalPitchNumber}
          evidenceHighlight={evidencePitches}
          legendItems={legendItems}
          currentPitchResult={currentPitchResult}
          currentPitchType={currentPitchType}
        />

        {/* ── D: AI commentary / workflow card ───────────────────────────────── */}
        <AICommentaryCard
          revealedCount={replay.state.revealedCount}
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          onEvidenceHighlight={handleEvidenceHighlight}
          evidenceActive={evidencePitches !== null}
          onOpenWorkflow={handleOpenWorkflow}
        />
      </ScrollView>

      {/* ── E: Playback controls ─────────────────────────────────────────────── */}
      <View style={styles.controls}>
        {/* Previous */}
        <TouchableOpacity
          style={[styles.circleBtn, replay.state.revealedCount === 0 && styles.circleBtnDisabled]}
          onPress={replay.previous}
          disabled={replay.state.revealedCount === 0}
          accessibilityLabel="Previous pitch"
        >
          <Text style={[styles.circleBtnIcon, replay.state.revealedCount === 0 && styles.iconDimmed]}>
            ‹
          </Text>
        </TouchableOpacity>

        {/* Play / Pause / Replay */}
        {replay.isComplete ? (
          <TouchableOpacity
            style={styles.playPill}
            onPress={replay.replay}
            accessibilityLabel="Replay at-bat from beginning"
          >
            <Text style={styles.playPillText}>↺  Replay</Text>
          </TouchableOpacity>
        ) : replay.state.isPlaying ? (
          <TouchableOpacity
            style={styles.playPill}
            onPress={replay.pause}
            accessibilityLabel="Pause replay"
          >
            <Text style={styles.playPillText}>⏸  Pause</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.playPill}
            onPress={replay.play}
            accessibilityLabel="Play replay"
          >
            <Text style={styles.playPillText}>▶  Play</Text>
          </TouchableOpacity>
        )}

        {/* Next */}
        <TouchableOpacity
          style={[styles.circleBtn, replay.isComplete && styles.circleBtnDisabled]}
          onPress={replay.next}
          disabled={replay.isComplete}
          accessibilityLabel="Next pitch"
        >
          <Text style={[styles.circleBtnIcon, replay.isComplete && styles.iconDimmed]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pitch detail overlay */}
      <PitchDetailOverlay
        pitch={selectedPitch}
        onClose={handleOverlayClose}
        revealedOutcome={revealedOutcome}
        finalPitchNumber={finalPitchNumber}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  centered: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: { marginTop: 16, fontSize: 14, color: COLORS.muted },

  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  errorMsg: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 24 },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.3,
  },
  replayBadge: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  replayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  // ── Playback controls ────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 16,
  },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnDisabled: {
    opacity: 0.35,
  },
  circleBtnIcon: {
    fontSize: 26,
    color: COLORS.text,
    lineHeight: 30,
  },
  iconDimmed: {
    opacity: 0.4,
  },
  playPill: {
    backgroundColor: COLORS.accent,
    borderRadius: 27,
    paddingHorizontal: 32,
    height: 54,
    minWidth: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
