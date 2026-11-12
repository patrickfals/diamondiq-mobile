import { useReducer, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Pitch } from '../types/atbat';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReplayState {
  revealedCount: number; // 0 = ready; 1..N = pitches 1..N visible; total = complete
  isPlaying: boolean;
}

export type ReplayAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'RESTART' }
  | { type: 'REPLAY' } // reset to 0 + immediately start playing
  | { type: 'JUMP_TO'; count: number }
  | { type: 'TICK' }; // internal: fired by the playback timer

// ─── Pure Reducer ─────────────────────────────────────────────────────────────
// No side effects. Fully deterministic. Independently testable.
// totalPitches is passed as an argument (not a closure) so the function is
// importable and exercisable without React.

export function replayReducer(
  state: ReplayState,
  action: ReplayAction,
  totalPitches: number,
): ReplayState {
  switch (action.type) {
    case 'PLAY': {
      // No-op if already playing or already complete
      if (state.isPlaying || state.revealedCount >= totalPitches) return state;
      return { ...state, isPlaying: true };
    }
    case 'PAUSE': {
      if (!state.isPlaying) return state;
      return { ...state, isPlaying: false };
    }
    case 'NEXT': {
      return {
        revealedCount: Math.min(state.revealedCount + 1, totalPitches),
        isPlaying: false,
      };
    }
    case 'PREVIOUS': {
      return {
        revealedCount: Math.max(state.revealedCount - 1, 0),
        isPlaying: false,
      };
    }
    case 'RESTART': {
      // Return existing object when already at initial state — prevents render loops
      if (state.revealedCount === 0 && !state.isPlaying) return state;
      return { revealedCount: 0, isPlaying: false };
    }
    case 'REPLAY': {
      // Reset to 0 and begin playing immediately; no-op on empty set
      if (totalPitches === 0) return { revealedCount: 0, isPlaying: false };
      return { revealedCount: 0, isPlaying: true };
    }
    case 'JUMP_TO': {
      return {
        revealedCount: Math.max(0, Math.min(action.count, totalPitches)),
        isPlaying: false,
      };
    }
    case 'TICK': {
      if (!state.isPlaying || state.revealedCount >= totalPitches) {
        return { ...state, isPlaying: false };
      }
      const next = state.revealedCount + 1;
      return {
        revealedCount: next,
        // Stop playing automatically after the final pitch
        isPlaying: next < totalPitches,
      };
    }
    default: {
      return state;
    }
  }
}

// ─── Derived values ───────────────────────────────────────────────────────────
// Pure function — no React dependency. Independently testable.

export interface ReplayDerived {
  revealedPitches: Pitch[];
  isComplete: boolean;
  currentBalls: number;
  currentStrikes: number;
  progressLabel: string; // "Ready to Replay" | "Pitch N" | "Pitch N of N"
}

export function deriveReplayValues(
  allPitches: Pitch[],
  revealedCount: number,
): ReplayDerived {
  const total = allPitches.length;
  const isComplete = total > 0 && revealedCount >= total;
  const revealedPitches = allPitches.slice(0, revealedCount);

  // Count comes directly from MLB data — never computed by hand.
  // count_after_pitch on pitches[N-1] is the count after pitch N is thrown.
  // Before any pitch, baseball always starts 0-0.
  let currentBalls = 0;
  let currentStrikes = 0;
  if (revealedCount > 0 && revealedCount <= total) {
    const countAfter = allPitches[revealedCount - 1].count_after_pitch;
    currentBalls = countAfter.balls;
    currentStrikes = countAfter.strikes;
  }

  let progressLabel: string;
  if (revealedCount === 0) {
    progressLabel = 'Ready to Replay';
  } else if (isComplete) {
    progressLabel = `Pitch ${total} of ${total}`;
  } else {
    progressLabel = `Pitch ${revealedCount}`;
  }

  return { revealedPitches, isComplete, currentBalls, currentStrikes, progressLabel };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const INITIAL_STATE: ReplayState = { revealedCount: 0, isPlaying: false };
const TICK_INTERVAL_MS = 2500;

export interface UseReplayEngineResult extends ReplayDerived {
  state: ReplayState;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
  replay: () => void;
  jumpTo: (count: number) => void;
}

export function useReplayEngine(allPitches: Pitch[]): UseReplayEngineResult {
  const total = allPitches.length;

  const [state, dispatch] = useReducer(
    (s: ReplayState, a: ReplayAction) => replayReducer(s, a, total),
    INITIAL_STATE,
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Playback timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimer();
    if (state.isPlaying && state.revealedCount < total) {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'TICK' });
      }, TICK_INTERVAL_MS);
    }
    return clearTimer;
  }, [state.isPlaying, state.revealedCount, total, clearTimer]);

  // ── AppState background pause ───────────────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          dispatch({ type: 'PAUSE' });
        }
        // Deliberately does NOT resume on foreground — per requirements
      },
    );
    return () => subscription.remove();
  }, []); // mount only

  // ── Reset when pitch data changes (e.g. after API retry) ───────────────────
  useEffect(() => {
    dispatch({ type: 'RESTART' });
  }, [allPitches]);

  // ── Stable action callbacks ─────────────────────────────────────────────────
  const play     = useCallback(() => dispatch({ type: 'PLAY' }),     []);
  const pause    = useCallback(() => dispatch({ type: 'PAUSE' }),    []);
  const next     = useCallback(() => dispatch({ type: 'NEXT' }),     []);
  const previous = useCallback(() => dispatch({ type: 'PREVIOUS' }), []);
  const restart  = useCallback(() => dispatch({ type: 'RESTART' }),  []);
  const replay   = useCallback(() => dispatch({ type: 'REPLAY' }),   []);
  const jumpTo   = useCallback(
    (count: number) => dispatch({ type: 'JUMP_TO', count }),
    [],
  );

  const derived = deriveReplayValues(allPitches, state.revealedCount);

  return { state, ...derived, play, pause, next, previous, restart, replay, jumpTo };
}
