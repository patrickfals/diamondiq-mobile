/**
 * commentaryData.ts — single source of truth for all commentary and trace data.
 *
 * All JSON imports are centralised here. No other file imports the JSON directly.
 * commentary_cache.json is intentionally left in place but unused.
 */

import rawV2 from './commentary_cache_v2.json';
import rawTrace from './trace_cache.json';

// ─── Commentary v2 types ──────────────────────────────────────────────────────

export type KnowledgeLevel = 'novice' | 'learning' | 'regular' | 'expert';

interface HumanEditEntry {
  original_model_text: string;
}

interface V2Entry {
  commentary_by_level: Record<KnowledgeLevel, string>;
  evidence_pitches: number[];
  complete: boolean;
  elapsed_seconds: number;
  run_id: string;
  edited?: boolean;
  human_edits?: Partial<Record<KnowledgeLevel, HumanEditEntry>>;
}

const v2Cache = rawV2 as Record<string, V2Entry>;

// ─── Trace types ─────────────────────────────────────────────────────────────

export interface TraceEvent {
  event: string;
  ts_utc: string;
  elapsed_seconds: number;
  run_id: string;
  // only on snapshot_redeemed
  note?: string;
  record?: {
    revealed_count: number;
    ts_utc: string;
    game_id: number;
    at_bat_index: number;
    run_id: string;
    user_agent: string;
    status: string;
  };
  // only on run_completed
  elapsed_total_seconds?: number;
}

export interface TraceEntry {
  position: number;
  run_id: string;
  events: TraceEvent[];
  trace_complete: boolean;
  capture_notes: string[];
}

const traceCache = rawTrace as Record<string, TraceEntry>;

// ─── Derived trace shape ─────────────────────────────────────────────────────

/**
 * Pre-parsed trace summary for a single position, extracted from raw events.
 * All fields are from the trace file; nothing is fabricated.
 */
export interface TraceSummary {
  run_id: string;
  /** Stage A (DiamondIQ Analyst + Pitch Scout): elapsed from stage_a_call_started to stage_a_call_returned */
  stageA_duration_s: number | null;
  /** Snapshot redemption event, if present */
  snapshotRedeemed: {
    revealed_count: number;
    note: string;
  } | null;
  /** Stage B (Fan Experience): elapsed from stage_b_call_started to stage_b_call_returned */
  stageB_duration_s: number | null;
  /** Total elapsed seconds from run_completed.elapsed_total_seconds */
  total_elapsed_s: number | null;
  trace_complete: boolean;
  capture_notes: string[];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the commentary text for the given position and level, or null if
 * the position has no entry in v2 cache.
 */
export function getCommentary(revealedCount: number, level: KnowledgeLevel): string | null {
  if (revealedCount === 0) return null;
  const entry = v2Cache[String(revealedCount)];
  if (!entry) return null;
  return entry.commentary_by_level[level] ?? null;
}

/**
 * Returns the evidence pitch numbers for the given position, or [] if none.
 */
export function getEvidencePitches(revealedCount: number): number[] {
  if (revealedCount === 0) return [];
  const entry = v2Cache[String(revealedCount)];
  return entry?.evidence_pitches ?? [];
}

/**
 * Returns true if the shown commentary for this position + level was
 * human-reviewed (i.e. has a human_edits entry for that level).
 */
export function isHumanEdited(revealedCount: number, level: KnowledgeLevel): boolean {
  if (revealedCount === 0) return false;
  const entry = v2Cache[String(revealedCount)];
  if (!entry?.edited) return false;
  return !!(entry.human_edits && level in entry.human_edits);
}

/**
 * Returns the parsed TraceSummary for the given position, or null if no
 * trace entry exists for that position.
 * All durations are derived directly from elapsed_seconds in the trace file.
 */
export function getTrace(revealedCount: number): TraceSummary | null {
  if (revealedCount === 0) return null;
  const entry = traceCache[String(revealedCount)];
  if (!entry) return null;

  const events = entry.events;

  // Stage A: start→return elapsed difference
  const stageAStart = events.find(e => e.event === 'stage_a_call_started');
  const stageAReturn = events.find(e => e.event === 'stage_a_call_returned');
  let stageA_duration_s: number | null = null;
  if (stageAStart !== undefined && stageAReturn !== undefined) {
    stageA_duration_s = parseFloat(
      (stageAReturn.elapsed_seconds - stageAStart.elapsed_seconds).toFixed(2)
    );
  }

  // Snapshot redemption
  const snapEvent = events.find(e => e.event === 'snapshot_redeemed');
  let snapshotRedeemed: TraceSummary['snapshotRedeemed'] = null;
  if (snapEvent?.record !== undefined) {
    snapshotRedeemed = {
      revealed_count: snapEvent.record.revealed_count,
      note: snapEvent.note ?? 'server-reported',
    };
  }

  // Stage B: start→return elapsed difference
  const stageBStart = events.find(e => e.event === 'stage_b_call_started');
  const stageBReturn = events.find(e => e.event === 'stage_b_call_returned');
  let stageB_duration_s: number | null = null;
  if (stageBStart !== undefined && stageBReturn !== undefined) {
    stageB_duration_s = parseFloat(
      (stageBReturn.elapsed_seconds - stageBStart.elapsed_seconds).toFixed(2)
    );
  }

  // Total from run_completed
  const runCompleted = events.find(e => e.event === 'run_completed');
  const total_elapsed_s = runCompleted?.elapsed_total_seconds ?? null;

  return {
    run_id: entry.run_id,
    stageA_duration_s,
    snapshotRedeemed,
    stageB_duration_s,
    total_elapsed_s,
    trace_complete: entry.trace_complete,
    capture_notes: entry.capture_notes,
  };
}
