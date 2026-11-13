export interface Pitch {
  number: number;
  type: string;
  result: string;
  velocity_mph: number;
  plate_x: number;
  plate_z: number;
  count_after_pitch: {
    balls: number;
    strikes: number;
    outs: number;
  };
}

/**
 * Batter's season-to-date batting statistics entering the game.
 * basis === "entering_game" means these are pre-game values (postgame total
 * minus this game's contribution), verified for game 777245.
 */
export interface BatterStats {
  avg: number;       // Batting average: hits / at_bats, rounded to 3 decimal places
  hits: number;      // Season hits entering the game
  at_bats: number;   // Season at-bats entering the game
  basis: string;     // "entering_game"
}

/**
 * Pitcher's season-to-date pitching statistics entering the game.
 * basis === "entering_game" means these are pre-game values (postgame total
 * minus this game's contribution), verified for game 777245.
 * outs_recorded uses the MLB API outs field directly (not innings-pitched notation).
 */
export interface PitcherStats {
  era: number;           // ERA = 27 × earned_runs / outs_recorded, rounded to 2 decimal places
  earned_runs: number;   // Season earned runs entering the game
  outs_recorded: number; // Season outs recorded entering the game (MLB outs field, not IP)
  basis: string;         // "entering_game"
}

export interface AtBat {
  game_id: number;
  at_bat_index: number;
  batter: string;
  pitcher: string;
  inning: number;
  half_inning: string;
  outcome: string;
  pitches: Pitch[];
  /** Historical batting statistics entering the game. Null if unavailable. */
  batter_stats?: BatterStats | null;
  /** Historical pitching statistics entering the game. Null if unavailable. */
  pitcher_stats?: PitcherStats | null;
}
