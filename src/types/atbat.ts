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

export interface AtBat {
  game_id: number;
  at_bat_index: number;
  batter: string;
  pitcher: string;
  inning: number;
  half_inning: string;
  outcome: string;
  pitches: Pitch[];
}
