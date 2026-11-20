import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";
import rawCache from "../data/commentary_cache.json";

// --- Types -------------------------------------------------------------------

type KnowledgeLevel = "novice" | "learning" | "regular" | "expert";

interface CacheEntry {
  commentary_by_level: Record<KnowledgeLevel, string>;
  evidence_pitches: number[];
  complete: boolean;
  elapsed_seconds: number;
  edited?: boolean;
  edit_note?: string;
}

const cache = rawCache as Record<string, CacheEntry>;

// --- Level metadata ----------------------------------------------------------

const LEVELS: { key: KnowledgeLevel; label: string; description: string }[] = [
  { key: "novice",   label: "Novice",   description: "New to baseball" },
  { key: "learning", label: "Learning", description: "Getting started" },
  { key: "regular",  label: "Regular",  description: "Familiar with the game" },
  { key: "expert",   label: "Expert",   description: "Deep baseball knowledge" },
];

// --- Props -------------------------------------------------------------------

interface CommentaryPanelProps {
  /** replay.state.revealedCount — 0 means nothing revealed yet */
  revealedCount: number;
}

// --- Component ---------------------------------------------------------------

export default function CommentaryPanel({ revealedCount }: CommentaryPanelProps) {
  const [level, setLevel] = useState<KnowledgeLevel>("learning");

  // Only use an entry when complete === true; treat incomplete as unavailable.
  const entry: CacheEntry | null = useMemo(() => {
    if (revealedCount === 0) return null;
    const found = cache[String(revealedCount)];
    return found?.complete === true ? found : null;
  }, [revealedCount]);

  const commentaryText: string | null = entry
    ? entry.commentary_by_level[level] ?? null
    : null;

  // -- No pitches revealed yet: verified intro, no spoilers ------------------
  if (revealedCount === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>STORY OF THE AT-BAT</Text>
        <LevelSelector current={level} onChange={setLevel} />
        <View style={styles.card}>
          <Text style={styles.introText}>
            Trevor Story vs. Michael Soroka. Story comes in hitting .244 on the
            season; Soroka carries a 4.70 ERA. Press Play to watch the at-bat
            unfold pitch by pitch.
          </Text>
        </View>
      </View>
    );
  }

  // -- Entry unavailable for this count -------------------------------------
  if (!entry || !commentaryText) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>STORY OF THE AT-BAT</Text>
        <LevelSelector current={level} onChange={setLevel} />
        <View style={styles.card}>
          <Text style={styles.placeholder}>
            No commentary available for pitch {revealedCount}.
          </Text>
        </View>
      </View>
    );
  }

  // -- Commentary available -------------------------------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>STORY OF THE AT-BAT</Text>
      <LevelSelector current={level} onChange={setLevel} />
      <View style={styles.card}>
        <Text style={styles.commentaryText}>{commentaryText}</Text>
      </View>
    </View>
  );
}

// --- Level selector ----------------------------------------------------------

function LevelSelector({
  current,
  onChange,
}: {
  current: KnowledgeLevel;
  onChange: (l: KnowledgeLevel) => void;
}) {
  const activeEntry = LEVELS.find((l) => l.key === current);

  return (
    <View style={styles.levelBlock}>
      <View style={styles.levelRow}>
        {LEVELS.map(({ key, label }) => {
          const active = key === current;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onChange(key)}
              style={[styles.levelTab, active && styles.levelTabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label} commentary level`}
            >
              <Text style={[styles.levelTabText, active && styles.levelTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {activeEntry && (
        <Text style={styles.levelDescription}>{activeEntry.description}</Text>
      )}
    </View>
  );
}

// --- Styles ------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  levelBlock: {
    marginBottom: 10,
  },
  levelRow: {
    flexDirection: "row",
    gap: 6,
  },
  levelTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  levelTabActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accent,
  },
  levelTabText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.muted,
  },
  levelTabTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  levelDescription: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
    marginLeft: 2,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.muted,
    fontStyle: "italic",
  },
  commentaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
  },
  placeholder: {
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: "italic",
    textAlign: "center",
  },
});
