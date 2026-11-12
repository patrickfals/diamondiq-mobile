import { useEffect, useState } from 'react';
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
import AtBatHeader from '../components/AtBatHeader';
import StrikeZone from '../components/StrikeZone';
import PitchHistory from '../components/PitchHistory';
import PitchDetailOverlay from '../components/PitchDetailOverlay';
import ReplayControls from '../components/ReplayControls';
import ReplayStatusBar from '../components/ReplayStatusBar';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { COLORS } from '../theme/colors';

const API_URL = 'https://diamondiq-api.onrender.com/games/777245/at-bats/1';

// Stable empty array reference — avoids re-triggering the replay reset effect
// that runs on allPitches identity change when atBat is null.
const EMPTY_PITCHES: Pitch[] = [];

type Status = 'loading' | 'success' | 'error';

export default function AtBatScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [atBat, setAtBat] = useState<AtBat | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);

  // useReplayEngine receives EMPTY_PITCHES before data loads so the hook
  // initialises safely with zero pitches and no timers scheduled.
  const replay = useReplayEngine(atBat?.pitches ?? EMPTY_PITCHES);

  // Close the overlay if the user rewinds past the currently selected pitch
  useEffect(() => {
    if (
      selectedPitch !== null &&
      selectedPitch.number > replay.state.revealedCount
    ) {
      setSelectedPitch(null);
    }
  }, [replay.state.revealedCount, selectedPitch]);

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

  useEffect(() => {
    fetchAtBat();
  }, []);

  function handlePitchPress(pitch: Pitch) {
    // Defence-in-depth: only allow interaction with revealed pitches.
    // StrikeZone and PitchHistory already receive only revealedPitches,
    // so future pitches are never rendered as tappable elements.
    if (pitch.number > replay.state.revealedCount) return;
    replay.pause();
    setSelectedPitch(pitch);
  }

  function handleOverlayClose() {
    setSelectedPitch(null);
    // Deliberately does NOT call replay.play() — user must press Play explicitly
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading at-bat data…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
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

  // ── Success ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: branding, matchup, inning — outcome gated on isComplete */}
        <AtBatHeader atBat={atBat} isComplete={replay.isComplete} />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Replay count + progress label / outcome */}
        <ReplayStatusBar
          currentBalls={replay.currentBalls}
          currentStrikes={replay.currentStrikes}
          progressLabel={replay.progressLabel}
          isComplete={replay.isComplete}
          outcome={atBat.outcome}
        />

        {/* Playback controls */}
        <ReplayControls
          isPlaying={replay.state.isPlaying}
          isComplete={replay.isComplete}
          isReady={replay.state.revealedCount === 0}
          onPlay={replay.play}
          onPause={replay.pause}
          onNext={replay.next}
          onPrevious={replay.previous}
          onRestart={replay.restart}
          onReplay={replay.replay}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Strike zone — receives only revealed pitches, never future ones */}
        <StrikeZone
          pitches={replay.revealedPitches}
          selectedPitchNumber={selectedPitch?.number ?? null}
          onPitchPress={handlePitchPress}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Pitch history — receives only revealed pitches */}
        <PitchHistory
          pitches={replay.revealedPitches}
          selectedPitchNumber={selectedPitch?.number ?? null}
          onPitchPress={handlePitchPress}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* AI analysis placeholder */}
        <View style={styles.aiSection}>
          <Text style={styles.aiSectionTitle}>STORY OF THE AT-BAT</Text>
          <View style={styles.aiCard}>
            <Text style={styles.aiComingSoon}>AI analysis integration coming soon.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pitch detail overlay — only opened via handlePitchPress which guards revealedCount */}
      <PitchDetailOverlay pitch={selectedPitch} onClose={handleOverlayClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

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

  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16, marginVertical: 4 },

  aiSection: { marginHorizontal: 16, marginTop: 12 },
  aiSectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 1.2, marginBottom: 8 },
  aiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
  },
  aiComingSoon: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
});
