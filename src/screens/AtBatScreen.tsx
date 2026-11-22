import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AtBat, Pitch } from '../types/atbat';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { COLORS } from '../theme/colors';
import { KnowledgeLevel } from '../data/commentaryData';
import { classifyBattedBall } from '../utils/classifyBattedBall';
import HeroCard from '../components/HeroCard';
import CommentarySection from '../components/CommentarySection';
import PitchDetailOverlay from '../components/PitchDetailOverlay';

const API_URL = 'https://diamondiq-api.onrender.com/games/777245/at-bats/8';

// Stable empty array — avoids re-triggering the replay reset effect
const EMPTY_PITCHES: Pitch[] = [];

type Status = 'loading' | 'success' | 'error';

export default function AtBatScreen() {
  const [status, setStatus]       = useState<Status>('loading');
  const [atBat, setAtBat]         = useState<AtBat | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string>('');
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);

  // Knowledge level persists across rewind / restart / replay
  const [selectedLevel, setSelectedLevel] = useState<KnowledgeLevel>('learning');

  // Evidence highlight: lifted here so HeroCard and CommentarySection share one source
  const [evidencePitches, setEvidencePitches] = useState<number[] | null>(null);

  // Agent panel state
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);

  // Slow-load hint: show extended message after 4 s while still loading
  const [slowLoad, setSlowLoad] = useState(false);
  useEffect(() => {
    if (status !== 'loading') {
      setSlowLoad(false);
      return;
    }
    const timer = setTimeout(() => setSlowLoad(true), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const replay = useReplayEngine(atBat?.pitches ?? EMPTY_PITCHES);

  // ── Clear evidence on replay navigation ──────────────────────────────────
  useEffect(() => {
    setEvidencePitches(null);
  }, [replay.state.revealedCount]);

  // ── Close agent panel on pitch change ────────────────────────────────────
  useEffect(() => {
    setAgentPanelOpen(false);
  }, [replay.state.revealedCount]);

  // ── Derived values ────────────────────────────────────────────────────────

  const finalPitchNumber: number | null = useMemo(() => {
    const pitches = atBat?.pitches;
    if (!pitches || pitches.length === 0) return null;
    return pitches[pitches.length - 1].number;
  }, [atBat]);

  const revealedOutcome = replay.isComplete && atBat
    ? classifyBattedBall(atBat.outcome)
    : null;

  // Close overlay if the user rewinds past the selected pitch
  useEffect(() => {
    if (selectedPitch !== null && selectedPitch.number > replay.state.revealedCount) {
      setSelectedPitch(null);
    }
  }, [replay.state.revealedCount, selectedPitch]);

  // ── Data loading ──────────────────────────────────────────────────────────

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

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  // ── Hold-to-pause ─────────────────────────────────────────────────────────
  // resumeAfterHold: set when we auto-pause due to user reading; cleared on
  // any direct ‹ › Play press so those take full control.
  const resumeAfterHold = useRef(false);

  const handleHoldStart = useCallback(() => {
    if (replay.state.isPlaying) {
      replay.pause();
      resumeAfterHold.current = true;
    }
  }, [replay]);

  const handleHoldEnd = useCallback(() => {
    if (resumeAfterHold.current && !replay.isComplete) {
      replay.play();
    }
    resumeAfterHold.current = false;
  }, [replay]);

  const handleAgentPanelOpen = useCallback(() => {
    // Opening the panel counts as hold-start (pauses; will resume on ✕)
    if (replay.state.isPlaying) {
      replay.pause();
      resumeAfterHold.current = true;
    }
    setAgentPanelOpen(true);
  }, [replay]);

  const handleAgentPanelClose = useCallback(() => {
    setAgentPanelOpen(false);
    // Closing the panel counts as hold-end
    if (resumeAfterHold.current && !replay.isComplete) {
      replay.play();
    }
    resumeAfterHold.current = false;
  }, [replay]);

  // ── Inning pill text ──────────────────────────────────────────────────────
  const inningPillText = useMemo(() => {
    if (!atBat) return 'Top 2nd';
    const half = atBat.half_inning === 'top' ? 'Top' : 'Bot';
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    const ord = ordinals[atBat.inning - 1] ?? `${atBat.inning}th`;
    // Try to extract team names from batter/pitcher (not in AtBat type — use placeholder)
    return `${half} ${ord}`;
  }, [atBat]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="light" />
        <Text style={styles.loadingWordmark}>
          Diamond<Text style={styles.loadingWordmarkAccent}>IQ</Text>
        </Text>
        <Text style={styles.loadingTagline}>Relive every pitch. No spoilers.</Text>
        <ActivityIndicator size="large" color={COLORS.accent} style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>
          {slowLoad
            ? 'Waking up the server… the first load can take up to a minute.'
            : 'Loading the at-bat…'}
        </Text>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
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

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {/* ── A: Top bar ───────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>
          Diamond<Text style={styles.wordmarkAccent}>IQ</Text>
        </Text>
        <View style={styles.inningPill}>
          <Text style={styles.inningPillText}>{inningPillText}</Text>
        </View>
      </View>

      {/* ── B: Hero card ─────────────────────────────────────────────────── */}
      <HeroCard
        atBat={atBat}
        revealedPitches={replay.revealedPitches}
        revealedCount={replay.state.revealedCount}
        isComplete={replay.isComplete}
        currentBalls={replay.currentBalls}
        currentStrikes={replay.currentStrikes}
        finalPitchNumber={finalPitchNumber}
        evidenceHighlight={evidencePitches}
        selectedPitchNumber={selectedPitch?.number ?? null}
        onPitchPress={handlePitchPress}
        onAgentPanelOpen={handleAgentPanelOpen}
        agentPanelOpen={agentPanelOpen}
        onAgentPanelClose={handleAgentPanelClose}
        selectedLevel={selectedLevel}
      />

      {/* Gap */}
      <View style={styles.gap} />

      {/* ── C: Commentary section (flex: 1) ──────────────────────────────── */}
      <CommentarySection
        revealedCount={replay.state.revealedCount}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        onEvidenceHighlight={handleEvidenceHighlight}
        evidenceActive={evidencePitches !== null}
        onDetailsPress={handleAgentPanelOpen}
        onHoldStart={handleHoldStart}
        onHoldEnd={handleHoldEnd}
      />

      {/* Gap */}
      <View style={styles.gap} />

      {/* ── E: Controls pinned at bottom ─────────────────────────────────── */}
      <View style={styles.controls}>
        {/* Previous */}
        <TouchableOpacity
          style={[styles.circleBtn, replay.state.revealedCount === 0 && styles.circleBtnDisabled]}
          onPress={() => { resumeAfterHold.current = false; setAgentPanelOpen(false); replay.previous(); }}
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
            onPress={() => { resumeAfterHold.current = false; setAgentPanelOpen(false); replay.replay(); }}
            accessibilityLabel="Replay at-bat from beginning"
          >
            <Text style={styles.playPillText}>↺  Replay</Text>
          </TouchableOpacity>
        ) : replay.state.isPlaying ? (
          <TouchableOpacity
            style={styles.playPill}
            onPress={() => { resumeAfterHold.current = false; replay.pause(); }}
            accessibilityLabel="Pause replay"
          >
            <Text style={styles.playPillText}>⏸  Pause</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.playPill}
            onPress={() => { resumeAfterHold.current = false; setAgentPanelOpen(false); replay.play(); }}
            accessibilityLabel="Play replay"
          >
            <Text style={styles.playPillText}>▶  Play</Text>
          </TouchableOpacity>
        )}

        {/* Next */}
        <TouchableOpacity
          style={[styles.circleBtn, replay.isComplete && styles.circleBtnDisabled]}
          onPress={() => { resumeAfterHold.current = false; setAgentPanelOpen(false); replay.next(); }}
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

  centered: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingWordmark: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingWordmarkAccent: {
    color: COLORS.accent,
  },
  loadingTagline: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
  },
  loadingSpinner: {
    marginTop: 28,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

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

  // ── Top bar ───────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  wordmarkAccent: {
    color: COLORS.accent,
  },
  inningPill: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inningPillText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },

  // ── Gap ───────────────────────────────────────────────────────────────────────
  gap: {
    height: 8,
  },

  // ── Playback controls ─────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 16,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnDisabled: {
    opacity: 0.35,
  },
  circleBtnIcon: {
    fontSize: 22,
    color: COLORS.text,
    lineHeight: 26,
  },
  iconDimmed: {
    opacity: 0.4,
  },
  playPill: {
    backgroundColor: COLORS.accent,
    borderRadius: 27,
    paddingHorizontal: 28,
    height: 44,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
